import EventEmitter from 'events';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import TypedEmitter from 'typed-emitter';
import {
  PoolBall as PoolBallModel,
  PoolGameArea as PoolGameAreaModel,
} from '../types/CoveyTownSocket';
import PlayerController from './PlayerController';
import PoolCue from '../components/Town/interactables/GameAreas/PoolGame/PoolObjects/PoolCue';
import {
  magnitude,
  subtractVectors,
} from '../components/Town/interactables/GameAreas/PoolGame/Vector';
import PoolBall from '../components/Town/interactables/GameAreas/PoolGame/PoolObjects/PoolBall';
import {
  ballBallCollision,
  ballSlateCollision,
  cueBallCollision,
  cushionBallCollision,
} from '../components/Town/interactables/GameAreas/PoolGame/Collisions';

/**
 * Type representing the entirety of the pool game to be sent to the frontend.
 *
 * POOL TODO: further documentation about state
 */
export type PoolGameModel = {
  // POOL TODO: add in id, player1ID, player2ID for telling whose move it is
  // id: string;

  // a list of pool ball objects, each of which contains information on their current position, orientation, etc.
  id: string;
  poolBalls: PoolBallModel[];
  player1BallType: string | undefined;
  player2BallType: string | undefined;
  player1ID: string;
  player2ID: string;
  isPlayer1Turn: boolean;
  isBallBeingPlaced: boolean;
};

/**
 * Type representing the two types of pool balls and the 8 ball.
 */
export type BallType = 'Stripes' | 'Solids' | '8 ball';

/**
 * Type representing a pocket. Radius is for calculations for overlapping with a Pool Ball.
 */
export type Pocket = {
  posnX: number;
  posnY: number;
  radius: number;
};

/**
 * The events that the PoolGameArea emits to subscribers. These events
 * are only ever emitted to local components (not to the townService).
 */
export type PoolGameAreaEvents = {
  // To animate the game playing
  onTick: (newModel: PoolGameAreaModel) => void;

  // To tell other clients that a player has made a move
  onPlayerMove: () => void;

  // Player enters or leaves area
  occupantsChange: (newOccupants: PlayerController[]) => void;

  // Player joins or leaves game (interacts with area or presses exit)
  playersChange: (newPlayers: PlayerController[]) => void;
};

const BALL_RADIUS = 0.028575; // m
const TICK_RATE = 0.1; // s
const POCKET_RADIUS = 0.05; // m
const RAIL_WIDTH = 0.051; // m

export default class PoolGameAreaController extends (EventEmitter as new () => TypedEmitter<PoolGameAreaEvents>) {
  // Players in bounds of the area
  private _occupants: PlayerController[] = [];

  private _id: string;

  // Current state of the game that we send to the front end for rendering
  public currentModel: PoolGameAreaModel;

  // Players playing the game (as opposed to spectating). A subset of occupants.
  private _players: PlayerController[] = [];

  private _player1ID: string | undefined; // POOL TODO: fix these

  private _player2ID: string | undefined;

  // a private, controller-only list of pool balls to be used to calculate physics. Includes cue and 8 ball.
  private _physicsPoolBalls: PoolBall[] = this.resetPoolBalls();

  // List of Pool Ball objects in the game at their default break position. Updated by calling toModel on the physicsPoolBall list
  private _poolBalls: PoolBallModel[] = this._physicsPoolBalls.map(ball => ball.toModel());

  private _cueBallIndex = 0;

  private _8ballIndex = 5;

  // Number of Pool Balls each player has pocketed, for checking whether they should win/lose the game
  private _player1BallsPocketed = 0;

  private _player2BallsPocketed = 0;

  // String to hold whether a player is 'Stripes' or 'Solids'.
  private _player1BallType: string | undefined = undefined;

  private _player2BallType: string | undefined = undefined;

  private _isPlayer1Turn = false;

  private _playerIDToMove: string | undefined = undefined;

  // Boolean that represents whether a player has to replace a ball or not
  public _isBallBeingPlaced = false;

  // Boolean that represents whether the balls are currently moving
  private _isBallMoving = false;

  // Constants representing the length and width of a 7-foot pool table. (0, 0) is the top-left corner of the playable area.
  private _tableLength = 2.54; //m

  private _tableWidth = 1.27; //m

  private _cushionHeight = 0.005715; //m

  // Boolean that represents whether the game has started or not.
  private _isGameStarted = false;

  // list of all pockets, which hold their own location and radius
  private _pockets: Pocket[] = [
    { posnX: 0, posnY: 0, radius: POCKET_RADIUS },
    { posnX: this._tableLength / 2, posnY: 0, radius: POCKET_RADIUS },
    { posnX: this._tableLength, posnY: 0, radius: POCKET_RADIUS },
    { posnX: 0, posnY: this._tableWidth, radius: POCKET_RADIUS },
    { posnX: this._tableLength / 2, posnY: this._tableWidth, radius: POCKET_RADIUS },
    { posnX: this._tableLength, posnY: this._tableWidth, radius: POCKET_RADIUS },
  ];

  /**
   * Create a new PoolGameAreaController
   * @param poolGameModel model representation of this pool area
   */
  constructor(poolGameModel: PoolGameAreaModel) {
    super();
    this._id = poolGameModel.id;
    this.currentModel = {
      id: this._id,
      player1ID: this._player1ID,
      player2ID: this._player2ID,
      poolBalls: this._poolBalls,
      player1BallType: this._player1BallType,
      player2BallType: this._player2BallType,
      isPlayer1Turn: this._isPlayer1Turn,
      isBallBeingPlaced: this._isBallBeingPlaced,
      isBallMoving: this._isBallMoving,
      playerIDToMove: this._playerIDToMove,
    };
  }

  /**
   * The ID of this pool area (read only)
   */
  get id() {
    return this._id;
  }

  get isPlaying() {
    return this._players.length >= 2 && !this.isGameOver;
  }

  /**
   * The Current Turn of this pool area (read only)
   */
  get isPlayer1Turn() {
    return this._isPlayer1Turn;
  }

  /**
   * Whether the game has started.
   */
  get isGameStarted() {
    return this._isGameStarted;
  }

  /**
   * Whether the game has started. Setting this to true will allow gameTick() to start updating the game.
   */
  set isGameStarted(hasGameStarted: boolean) {
    this._isGameStarted = hasGameStarted;
  }

  get isBallBeingPlaced() {
    return this._isBallBeingPlaced;
  }

  set isBallBeingPlaced(value) {
    this._isBallBeingPlaced = value;
  }

  /**
   * The list of occupants in this pool area. Changing the set of occupants
   * will emit an occupantsChange event.
   */
  set occupants(newOccupants: PlayerController[]) {
    if (
      newOccupants.length !== this._occupants.length ||
      _.xor(newOccupants, this._occupants).length > 0
    ) {
      this.emit('occupantsChange', newOccupants);
      this._occupants = newOccupants;
    }
  }

  get occupants() {
    return this._occupants;
  }

  /**
   * The list of players in this pool area. Changing the set of players
   * will emit an playersChange event.
   */
  set players(newPlayers: PlayerController[]) {
    if (newPlayers.length !== this._players.length || _.xor(newPlayers, this._players).length > 0) {
      this.emit('playersChange', newPlayers);
      this._players = newPlayers;
    }
  }

  get poolBalls() {
    return this._poolBalls;
  }

  /**
   * The list of pool balls in this pool area.
   */
  set poolBalls(newPoolBalls: PoolBallModel[]) {
    if (
      newPoolBalls.length !== this._poolBalls.length ||
      _.xor(newPoolBalls, this._poolBalls).length > 0
    ) {
      this._poolBalls = newPoolBalls;
    }
  }

  /**
   * Function that returns an array of PoolBalls to the default break state.
   */
  resetPoolBalls(): PoolBall[] {
    return [
      // cue ball at break position
      new PoolBall(0.847, 0.634, 0),
      // front of triangle
      new PoolBall(1.905, 0.634, 1),
      // second row
      new PoolBall(1.905 + 2 * BALL_RADIUS, 0.634 - BALL_RADIUS, 2),
      new PoolBall(1.905 + 2 * BALL_RADIUS, 0.634 + BALL_RADIUS, 9),
      // third row
      new PoolBall(1.905 + 4 * BALL_RADIUS, 0.634 - 2 * BALL_RADIUS, 3),
      new PoolBall(1.905 + 4 * BALL_RADIUS, 0.634, 8),
      new PoolBall(1.905 + 4 * BALL_RADIUS, 0.634 + 2 * BALL_RADIUS, 10),
      // fourth row
      new PoolBall(1.905 + 6 * BALL_RADIUS, 0.634 - 3 * BALL_RADIUS, 4),
      new PoolBall(1.905 + 6 * BALL_RADIUS, 0.634 - BALL_RADIUS, 14),
      new PoolBall(1.905 + 6 * BALL_RADIUS, 0.634 + BALL_RADIUS, 7),
      new PoolBall(1.905 + 6 * BALL_RADIUS, 0.634 + 3 * BALL_RADIUS, 11),
      // fifth row
      new PoolBall(1.905 + 8 * BALL_RADIUS, 0.634 - 4 * BALL_RADIUS, 12),
      new PoolBall(1.905 + 8 * BALL_RADIUS, 0.634 - 2 * BALL_RADIUS, 6),
      new PoolBall(1.905 + 8 * BALL_RADIUS, 0.634, 15),
      new PoolBall(1.905 + 8 * BALL_RADIUS, 0.634 + 2 * BALL_RADIUS, 13),
      new PoolBall(1.905 + 8 * BALL_RADIUS, 0.634 + 4 * BALL_RADIUS, 5),
    ];
  }

  // POOL TODO
  startGame(): void {
    // randomly decide who is first
    this._isPlayer1Turn = Math.random() <= 0.5;

    // reset score and type for both players
    this._player1BallType = undefined;
    this._player2BallType = undefined;
    this._player1BallsPocketed = 0;
    this._player2BallsPocketed = 0;

    this._isBallBeingPlaced = false;

    // set pool balls into break position. Declaring new pool balls is to reset their fields.
    this._physicsPoolBalls = this.resetPoolBalls();

    // start the game
    this.isGameStarted = true;
  }

  /**
   * A function that returns a string representing the type of the ball based on its number-- 'Stripes', 'Solids', '8ball', or 'CueBall'
   * @param ballNumber the number of the given ball
   */
  getBallTypeByNumber(ballNumber: number): string {
    if (ballNumber <= 7 && ballNumber >= 1) {
      return 'Solids';
    } else if (ballNumber === 8) {
      return '8ball';
    } else if (ballNumber >= 9 && ballNumber <= 15) {
      return 'Stripes';
    }
    // Cue ball has a number of 0?
    return 'CueBall';
  }

  /**
   * Placeholder function that is called every tick. Checks for collisions, scratches, game overs, etc.
   */
  gameTick(): void {
    // only tick the game if we've actually started it. Assuming we'll start via an input in covey.town.
    if (this.isGameStarted) {
      this.poolPhysicsGoHere();

      if (this.isGameOver().isGameOver) {
        this.endGame();
      }
    }
    this.emit('onTick', this.currentModel);
  }

  /**
   * Checks if the game is over. Returns a struct that contains information about if the game is over, and if so, who won.
   */
  isGameOver(): { isGameOver: boolean; didPlayer1Win: boolean } {
    // If a player has 8 balls pocketed (all 7 of theirs and the 8 ball)
    // the 8 ball is pocketed, the cue ball is NOT pocketed, and it is a certain player's turn, that player wins.
    if (this._isPlayer1Turn) {
      if (
        this._poolBalls[this._8ballIndex].isPocketed &&
        !this._poolBalls[this._cueBallIndex].isPocketed
      ) {
        if (this._player1BallsPocketed === 7) {
          // player 1 wins
          return { isGameOver: true, didPlayer1Win: true };
        } else if (this._player1BallsPocketed < 7) {
          // player 1 sunk the 8 ball before all of their own, so they lost
          return { isGameOver: true, didPlayer1Win: false };
        }
      }
    }
    if (!this._isPlayer1Turn) {
      if (
        this._poolBalls[this._8ballIndex].isPocketed &&
        !this._poolBalls[this._cueBallIndex].isPocketed
      ) {
        if (this._player2BallsPocketed === 7) {
          // player 2 wins
          return { isGameOver: true, didPlayer1Win: false };
        } else if (this._player2BallsPocketed < 7) {
          // player 2 sunk the 8 ball before all of their own, so they lost
          return { isGameOver: true, didPlayer1Win: false };
        }
      }
    }

    return { isGameOver: false, didPlayer1Win: false };
  }

  // POOL TODO
  endGame(): void {
    const gameOverStruct: { isGameOver: boolean; didPlayer1Win: boolean } = this.isGameOver();

    if (gameOverStruct.didPlayer1Win) {
      // send update to frontend saying that player 1 won.
    } else if (!gameOverStruct.didPlayer1Win) {
      // send update to frontend saying that player 2 won.
    }
  }

  // whatever else needs to go here, maybe physics
  poolPhysicsGoHere(
    cue: PoolCue | undefined = undefined,
    cueBall: PoolBall | undefined = undefined,
  ): void {
    // holds all of the currently moving pool balls-- these are the ones we need to check collisions with
    const movingBalls: PoolBall[] = this._physicsPoolBalls.filter(ball => ball.isMoving);
    // holds all of the pool balls we've already checked for collisions to prevent duplicate collisions
    const alreadyCheckedBalls: PoolBall[] = [];

    if (cue && cueBall) {
      cueBallCollision(cue, cueBall);
    }

    // we can only scratch once per turn, so this boolean represents whether that has happened yet
    let canScratch = true;

    // loop through every pool ball, calling an update function on them and checking for collisions.
    // if any collisions, call the collide function on both balls, passing each other as parameters.
    movingBalls.forEach(ball => {
      ball.tick(TICK_RATE);
      if (!alreadyCheckedBalls.includes(ball)) {
        // ball-table collisions
        if (ball.position.z === 0 && ball.velocity.z < 0) {
          ballSlateCollision(ball);
        }

        // ball-ball collisions
        this._physicsPoolBalls.forEach(otherBall => {
          // check if the two current poolballs are different, and have not already been checked
          if (ball !== otherBall && !alreadyCheckedBalls.includes(otherBall)) {
            if (magnitude(subtractVectors(ball.position, otherBall.position)) <= BALL_RADIUS * 2) {
              ballBallCollision(ball, otherBall);
              alreadyCheckedBalls.push(ball);
              alreadyCheckedBalls.push(otherBall);

              // can only scratch on the first cue/ball collision
              if (
                canScratch &&
                (this.getBallTypeByNumber(ball.ballNumber) === 'CueBall' ||
                  this.getBallTypeByNumber(otherBall.ballNumber) === 'CueBall')
              ) {
                // check for scratches
                if (this._player1BallType) {
                  // ball is the cue ball
                  if (
                    this.isPlayer1Turn &&
                    ball.ballNumber === 0 &&
                    this.getBallTypeByNumber(otherBall.ballNumber) !== this._player1BallType
                  ) {
                    // player 1 hit the wrong ball, scratch
                    this._isBallBeingPlaced = true;
                    this._isPlayer1Turn = false;
                    canScratch = false;
                  }
                  // otherBall is the cue ball
                  if (
                    this.isPlayer1Turn &&
                    otherBall.ballNumber === 0 &&
                    this.getBallTypeByNumber(ball.ballNumber) !== this._player1BallType
                  ) {
                    // player 1 hit the wrong ball, scratch
                    this._isBallBeingPlaced = true;
                    this._isPlayer1Turn = false;
                    canScratch = false;
                  }
                }
                if (this._player2BallType) {
                  // ball is the cue ball
                  if (
                    !this.isPlayer1Turn &&
                    ball.ballNumber === 0 &&
                    this.getBallTypeByNumber(otherBall.ballNumber) !== this._player2BallType
                  ) {
                    // player 2 hit the wrong ball, scratch
                    this._isBallBeingPlaced = true;
                    this._isPlayer1Turn = true;
                    canScratch = false;
                  }
                  // otherBall is the cue ball
                  if (
                    !this.isPlayer1Turn &&
                    otherBall.ballNumber === 0 &&
                    this.getBallTypeByNumber(ball.ballNumber) !== this._player2BallType
                  ) {
                    // player 2 hit the wrong ball, scratch
                    this._isBallBeingPlaced = true;
                    this._isPlayer1Turn = true;
                    canScratch = false;
                  }
                }
              }
            }
          }
        });
        // at this point we've checked the current moving ball against every other ball, so do other checks

        // check if ball goes in pocket
        this._pockets.forEach(pocket => {
          if (
            magnitude(subtractVectors(ball.position, { x: pocket.posnX, y: pocket.posnY, z: 0 })) <=
            BALL_RADIUS + pocket.radius
          ) {
            ball.isPocketed = true;
            const ballType = this.getBallTypeByNumber(ball.ballNumber);

            // if the players don't have a ball type yet, assign them
            if (this._player1BallType === undefined && this._player2BallType == undefined) {
              if (this._isPlayer1Turn) {
                this._player1BallType = ballType;
                if (ballType === 'Stripes') {
                  this._player2BallType = 'Solids';
                } else {
                  this._player2BallType = 'Stripes';
                }
              } else {
                this._player2BallType = ballType;
                if (ballType === 'Stripes') {
                  this._player1BallType = 'Solids';
                } else {
                  this._player1BallType = 'Stripes';
                }
              }
            }

            if (ballType === this._player1BallType) {
              this._player1BallsPocketed++;
            } else if (ballType === this._player2BallType) {
              this._player2BallsPocketed++;
            } else if (ballType === 'CueBall') {
              // cue ball went in pocket, scratch
              this._isBallBeingPlaced = true;
              this._isPlayer1Turn = !this._isPlayer1Turn;
              canScratch = false;
            }
          }
        });

        // check if the ball has collided with the side rails
        if (
          ball.velocity.x > 0 &&
          magnitude(
            subtractVectors(ball.position, {
              x: this._tableLength + RAIL_WIDTH,
              y: ball.position.y,
              z: this._cushionHeight,
            }),
          ) <=
            2 * BALL_RADIUS
        ) {
          // collided with right rail
          cushionBallCollision(ball, false);
        } else if (
          ball.velocity.x > 0 &&
          magnitude(
            subtractVectors(ball.position, {
              x: RAIL_WIDTH,
              y: ball.position.y,
              z: this._cushionHeight,
            }),
          ) <=
            2 * BALL_RADIUS
        ) {
          // collided with left rail
          cushionBallCollision(ball, false);
        } else if (
          ball.velocity.y > 0 &&
          magnitude(
            subtractVectors(ball.position, {
              x: ball.position.x,
              y: RAIL_WIDTH,
              z: this._cushionHeight,
            }),
          ) <=
            2 * BALL_RADIUS
        ) {
          // collided with top rail
          cushionBallCollision(ball, true);
        } else if (
          ball.velocity.y > 0 &&
          magnitude(
            subtractVectors(ball.position, {
              x: ball.position.x,
              y: this._tableWidth + RAIL_WIDTH,
              z: this._cushionHeight,
            }),
          ) <=
            2 * BALL_RADIUS
        ) {
          // collided with bottom rail
          cushionBallCollision(ball, true);
        }

        // check if the ball has gone off the board/ over the rails
        let haveWeScratchedOverTable = false;
        if (ball.position.x > this._tableLength) {
          ball.position.x = this._tableLength - BALL_RADIUS;
        } else if (ball.position.x < 0) {
          ball.position.x = RAIL_WIDTH + BALL_RADIUS;
        } else if (ball.position.y > this._tableWidth) {
          ball.position.y = this._tableWidth - BALL_RADIUS;
        } else if (ball.position.y < 0) {
          ball.position.y = RAIL_WIDTH + BALL_RADIUS;
        }
        haveWeScratchedOverTable = ball.ballNumber === 0;
        if (haveWeScratchedOverTable) {
          // cue ball went over the table, scratch
          this._isBallBeingPlaced = true;
          this._isPlayer1Turn = !this._isPlayer1Turn;
          canScratch = false;
        }
      }
    });
    // update the poolballmodels
    this.poolBalls = this._physicsPoolBalls.map(ball => ball.toModel());

    // update the current PoolGameModel variable (currentModel). Might be worth moving this into its own function? so we can emit a onTick?
    this.currentModel.isBallBeingPlaced = this._isBallBeingPlaced;
    this.currentModel.isPlayer1Turn = this.isPlayer1Turn;
    this.currentModel.poolBalls = this._poolBalls;
  }

  toPoolGameAreaModel(): PoolGameAreaModel {
    // TODO: this is placeholder, and this._players[0]/[1] is hardcoded, should definitely find a better way to do that.
    return {
      id: this._id,
      player1ID: this._players[0]?.id,
      player2ID: this._players[1]?.id,
      isPlayer1Turn: this._isPlayer1Turn,
      isBallBeingPlaced: this._isBallBeingPlaced,
      isBallMoving: this._isBallMoving,
      poolBalls: this._poolBalls,
    };
  }

  public updateFrom(
    updatedModel: PoolGameAreaModel,
    playerFinder: (playerIDs: string[]) => PlayerController[],
  ) {
    this._isPlayer1Turn = updatedModel.isPlayer1Turn;
    this._player1BallType = updatedModel.player1BallType;
    this._player2BallType = updatedModel.player2BallType;
    this._poolBalls = updatedModel.poolBalls;
    this._id = updatedModel.id;
    this._players[0] = playerFinder([
      updatedModel.player1ID !== undefined ? updatedModel.player1ID : '',
    ])[0];
    this._players[1] = playerFinder([
      updatedModel.player2ID !== undefined ? updatedModel.player2ID : '',
    ])[0];
    this._isPlayer1Turn = updatedModel.isPlayer1Turn;
  }
}

/**
 * A react hook to retrieve the occupants of a PoolGameAreaController, returning an array of PlayerController.
 *
 * This hook will re-render any components that use it when the set of occupants changes.
 */
export function usePoolGameAreaOccupants(area: PoolGameAreaController): PlayerController[] {
  const [occupants, setOccupants] = useState(area.occupants);
  useEffect(() => {
    area.addListener('occupantsChange', setOccupants);
    return () => {
      area.removeListener('occupantsChange', setOccupants);
    };
  }, [area]);
  return occupants;
}

/**
 * A react hook to retrieve the PoolGameModel of a PoolGameAreaController, returning a PoolGameModel.
 *
 * This hook will re-render any components that use it when the current PoolGameModel changes.
 */
export function usePoolGameModel(area: PoolGameAreaController): PoolGameAreaModel {
  const [gameModel, setGameModel] = useState(area.currentModel);
  useEffect(() => {
    area.addListener('onTick', setGameModel);
    return () => {
      area.removeListener('onTick', setGameModel);
    };
  }, [area, setGameModel]);
  return gameModel;
}
