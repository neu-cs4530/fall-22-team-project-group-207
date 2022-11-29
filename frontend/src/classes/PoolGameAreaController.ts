import EventEmitter from 'events';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import TypedEmitter from 'typed-emitter';
import {
  ballBallCollision,
  ballSlateCollision,
  cueBallCollision,
  cushionBallCollision,
} from '../components/Town/interactables/GameAreas/PoolGame/Collisions';
import PoolBall from '../components/Town/interactables/GameAreas/PoolGame/PoolObjects/PoolBall';
import PoolCue from '../components/Town/interactables/GameAreas/PoolGame/PoolObjects/PoolCue';
import {
  magnitude,
  subtractVectors,
  Vector,
} from '../components/Town/interactables/GameAreas/PoolGame/Vector';
import {
  PoolBall as PoolBallModel,
  PoolGameArea as PoolGameAreaModel,
} from '../types/CoveyTownSocket';
import PlayerController from './PlayerController';

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

  // To tell other clients that a player is placing the ball
  onBallPlacement: (playerPlacingID: string) => void;
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

  private _player1ID: string | undefined;

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
  private _isBallBeingPlaced = false;

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
    return this.player1ID && this.player2ID && this.isGameStarted && !this.isGameOver;
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

  /**
   * Whether a player is currently placing the cue ball anywhere on the board following a scratch.
   */
  get isBallBeingPlaced() {
    return this._isBallBeingPlaced;
  }

  set isBallBeingPlaced(value) {
    if (value !== this.isBallBeingPlaced) {
      this._isBallBeingPlaced = value;
      this.emit('onBallPlacement', )
    }
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

  get player1ID() {
    return this._player1ID;
  }

  set player1ID(newPlayer1ID: string | undefined) {
    if (newPlayer1ID !== this.player1ID) {
      if (newPlayer1ID === this.player2ID) {
        this._player2ID = undefined;
      }
      this._player1ID = newPlayer1ID;
      if (newPlayer1ID) {
        const newPlayerController = this.occupants.find(occ => occ.id === newPlayer1ID);
        if (newPlayerController) {
          this.emit('playersChange', [newPlayerController]);
        }
      }
    }
  }

  get player2ID() {
    return this._player2ID;
  }

  set player2ID(newPlayer2ID: string | undefined) {
    if (newPlayer2ID !== this.player2ID) {
      if (newPlayer2ID === this.player1ID) {
        this._player1ID = undefined;
      }
      this._player2ID = newPlayer2ID;
      if (newPlayer2ID) {
        const newPlayerController = this.occupants.find(occ => occ.id === newPlayer2ID);
        if (newPlayerController) {
          this.emit('playersChange', [newPlayerController]);
        }
      }
    }
  }

  set players(newPlayers: PlayerController[]) {
    if (newPlayers.length > 0) {
      this.player1ID = newPlayers[0].id;
      if (newPlayers.length > 1) {
        this.player2ID = newPlayers[1].id;
      }
      this.emit('playersChange', newPlayers);
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
   * Remove a player from playing the game
   * @param playerID Player ID to remove
   */
  removePlayer(playerID: string): void {
    if (this.player1ID === playerID) {
      this._player1ID = undefined;
    } else if (this.player2ID === playerID) {
      this._player2ID = undefined;
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
      new PoolBall(0, 0, 3),
      new PoolBall(2.54, 1.27, 8),
      // new PoolBall(1.905 + 4 * BALL_RADIUS, 0.634 - 2 * BALL_RADIUS, 3),
      // new PoolBall(1.905 + 4 * BALL_RADIUS, 0.634, 8),
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
    // if players aren't valid, we dont start the game
    if (!this.player1ID || !this.player2ID) {
      return;
    }
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
    this._poolBalls = this._physicsPoolBalls.map(ball => ball.toModel());

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

  placeCueBall(newPosition: Vector) {
    // update the cue ball's position
    this._physicsPoolBalls[this._cueBallIndex].position.x = newPosition.x;
    this._physicsPoolBalls[this._cueBallIndex].position.y = newPosition.y;
    this._physicsPoolBalls[this._cueBallIndex].position.z = newPosition.z;

    // unset the flag
    this._isBallBeingPlaced = false;

    // update the model list
    this.poolBalls = this._physicsPoolBalls.map(ball => ball.toModel());
    if (this._playerIDToMove) {
      this.emit('onBallPlacement', this._playerIDToMove);
    }
  }

  // whatever else needs to go here, maybe physics
  poolPhysicsGoHere(cue: PoolCue | undefined = undefined): void {
    if (cue) {
      cueBallCollision(cue, this._physicsPoolBalls[this._cueBallIndex]);
      this.emit('onPlayerMove');
    }

    // holds all of the currently moving pool balls-- these are the ones we need to check collisions with
    const movingBalls: PoolBall[] = this._physicsPoolBalls.filter(ball => ball.isMoving && !ball.isPocketed);
    // holds all of the pool balls we've already checked for collisions to prevent duplicate collisions
    const alreadyCheckedBalls: PoolBall[] = [];
    
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
          if (!otherBall.isPocketed && ball !== otherBall && !alreadyCheckedBalls.includes(otherBall)) {
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
                    this._playerIDToMove = this.player2ID;
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
                    this._playerIDToMove = this.player2ID;
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
                    this._playerIDToMove = this.player1ID;
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
                    this._playerIDToMove = this.player1ID;
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
              if (this.isPlayer1Turn) {
                this._playerIDToMove = this.player2ID;
              } else {
                this._playerIDToMove = this.player1ID;
              }
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
          if (this.isPlayer1Turn) {
            this._playerIDToMove = this.player2ID;
          } else {
            this._playerIDToMove = this.player1ID;
          }
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

    this.emit('onTick', this.currentModel);
  }

  toPoolGameAreaModel(): PoolGameAreaModel {
    return {
      id: this._id,
      player1ID: this._player1ID,
      player2ID: this._player2ID,
      player1BallType: this._player1BallType,
      player2BallType: this._player2BallType,
      playerIDToMove: this._playerIDToMove,
      isPlayer1Turn: this._isPlayer1Turn,
      isBallBeingPlaced: this._isBallBeingPlaced,
      isBallMoving: this._isBallMoving,
      poolBalls: this._poolBalls,
    };
  }

  public updateFrom(updatedModel: PoolGameAreaModel) {
    this._isPlayer1Turn = updatedModel.isPlayer1Turn;
    this._player1BallType = updatedModel.player1BallType;
    this._player2BallType = updatedModel.player2BallType;
    this._poolBalls = updatedModel.poolBalls;
    this._id = updatedModel.id;
    this._player1ID = updatedModel.player1ID;
    this._player2ID = updatedModel.player2ID;
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
