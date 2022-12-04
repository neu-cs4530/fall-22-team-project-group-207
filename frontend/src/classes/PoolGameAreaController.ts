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
import { PoolLeaderboardServiceClient } from '../poolLeaderboardServices/PoolLeaderboardServiceClient';
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

  // Player enters or leaves area
  occupantsChange: (newOccupants: PlayerController[]) => void;

  // Player joins or leaves game (interacts with area or presses exit)
  playersChange: (newPlayers: PlayerController[]) => void;

  // Sends an update out to signify the game is over
  gameOver: (winnerID: string) => void;

  // To tell other clients that a player is placing the ball
  onBallPlacement: (playerPlacingID: string) => void;

  // Send the history of models to clients for rendering.
  onHistoryUpdate: (newModelHistory: PoolGameAreaModel[]) => void;

  // Sends an update out to signify a turn has been made for a player
  turnChange: (newTurn: boolean) => void;
};

const BALL_RADIUS = 0.028575; // m
const TICK_RATE = 0.001; // s
const POCKET_RADIUS = 0.05; // m
const RAIL_WIDTH = 0.051; // m

export default class PoolGameAreaController extends (EventEmitter as new () => TypedEmitter<PoolGameAreaEvents>) {
  // Players in bounds of the area
  private _occupants: PlayerController[] = [];

  private _id: string;

  // Current state of the game that we send to the front end for rendering
  public currentModel: PoolGameAreaModel;

  /**
   * A history of the game models at every tick-- index 0 is the model at tick 0, index 1 is the model at tick 1, etc.
   * This will store this history of the entire game with multiple moves.
   */
  public modelHistory: PoolGameAreaModel[] = [];

  // The tick the game is currently on, for use indexing the modelHistory
  public currentTick = 0;

  private _player1ID: string | undefined;

  private _player2ID: string | undefined;

  // a private, controller-only list of pool balls to be used to calculate physics. Includes cue and 8 ball.
  private _physicsPoolBalls: PoolBall[] = this.resetPoolBalls();

  // List of Pool Ball objects in the game at their default break position. Updated by calling toModel on the physicsPoolBall list
  private _poolBalls: PoolBallModel[] = this._physicsPoolBalls.map(ball => ball.toModel());

  // These indexes are dynamically set in the constructor-- these are assuming that all 16 pool balls exist in the list.
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

  // Constants representing the length and width of a 7-foot pool table. (0, 0) is the top-left corner of the playable area.
  private _tableLength = 2.54; //m

  private _tableWidth = 1.27; //m

  //private _cushionHeight = 0.005715; //m

  // Boolean that represents whether the game has started or not.
  private _isGameStarted = false;

  // list of all pockets, which hold their own location and radius
  private _pockets: Pocket[] = [
    // top left
    { posnX: 0, posnY: 0, radius: POCKET_RADIUS },
    // top middle
    { posnX: this._tableLength / 2, posnY: 0, radius: POCKET_RADIUS },
    // top right
    { posnX: this._tableLength, posnY: 0, radius: POCKET_RADIUS },
    // bottom left
    { posnX: 0, posnY: this._tableWidth, radius: POCKET_RADIUS },
    // bottom middle
    { posnX: this._tableLength / 2, posnY: this._tableWidth, radius: POCKET_RADIUS },
    // bottom right
    { posnX: this._tableLength, posnY: this._tableWidth, radius: POCKET_RADIUS },
  ];

  private _leaderboardService = new PoolLeaderboardServiceClient();

  /**
   * Create a new PoolGameAreaController
   * @param poolGameModel model representation of this pool area
   */
  constructor(poolGameModel: PoolGameAreaModel) {
    super();
    this._id = poolGameModel.id;
    this.currentModel = this.toPoolGameAreaModel();
    // Avoid hard-coding index values
    for (let i = 0; i < this._physicsPoolBalls.length; i++) {
      if (this._physicsPoolBalls[i].ballNumber === 0) {
        this._cueBallIndex = i;
      }
      if (this._physicsPoolBalls[i].ballNumber === 8) {
        this._8ballIndex = i;
      }
    }
  }

  /**
   * The ID of this pool area (read only)
   */
  get id() {
    return this._id;
  }

  /**
   * The Current Turn of this pool area
   */
  get isPlayer1Turn() {
    return this._isPlayer1Turn;
  }

  /**
   * The current Turn of this pool area. Changing the turn will emit a turnChange event.
   */
  set isPlayer1Turn(newPlayerTurn: boolean) {
    if (newPlayerTurn !== this.isPlayer1Turn) {
      this._isPlayer1Turn = newPlayerTurn;
      this.emit('turnChange', true);
    }
  }

  /**
   * Whether the game has has been won.
   */
  get isGameWon() {
    return this.isGameOver();
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
   * Whether the game has started.
   */
  public playerBallsPocketed(player1: boolean) {
    return player1 ? this._player1BallsPocketed : this._player2BallsPocketed;
  }

  /**
   * Sets the number of balls pocketed depending on the contents of the pool ball array
   */
  public updatePocketedBalls() {
    this._player1BallsPocketed = this._poolBalls.filter(
      ball => ball.isPocketed && ball.ballType === this._player1BallType,
    ).length;
    this._player2BallsPocketed = this._poolBalls.filter(
      ball => ball.isPocketed && ball.ballType === this._player2BallType,
    ).length;
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
      if (this._playerIDToMove) {
        this.emit('onBallPlacement', this._playerIDToMove);
      }
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
   * Place a cue ball
   * @param position New position to place the pool ball at
   */
  placeCueBall(position: Vector): void {
    // update the cue ball's position
    this._physicsPoolBalls[this._cueBallIndex].position = {
      x: position.x,
      y: position.y,
      z: position.z,
    };

    // unset the flag
    this._isBallBeingPlaced = false;

    // update the model list
    this.poolBalls = this._physicsPoolBalls.map(ball => ball.toModel());

    // emit an update
    if (this._playerIDToMove) {
      this.emit('onBallPlacement', this._playerIDToMove);
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

  /**
   * Resets the pool balls to their starting position and scores to 0.
   */
  resetGame(): void {
    // reset the model history.
    this.currentTick = 0;
    this.modelHistory = [this.currentModel];

    // set pool balls into break position. Declaring new pool balls is to reset their fields.
    this._physicsPoolBalls = this.resetPoolBalls();
    this._poolBalls = this._physicsPoolBalls.map(ball => ball.toModel());

    // reset score and type for both players
    this._player1BallType = undefined;
    this._player2BallType = undefined;
    this._player1BallsPocketed = 0;
    this._player2BallsPocketed = 0;

    this._isBallBeingPlaced = false;

    // tell listeners to reset the game
    this.emit('onTick', this.toPoolGameAreaModel());
  }

  /**
   * A player makes a move. Runs the onTick function repeatedly until every ball stops moving.
   * @param cue information stored in the cue, which is passed to the physics engine
   */
  poolMove(cue: PoolCue) {
    // Player hits the cue ball
    if (cue) {
      cueBallCollision(cue, this._physicsPoolBalls[this._cueBallIndex]);
    }
    // Tick until every ball stops moving, whether they roll to a stop or get pocketed.
    while (this._areAnyPoolBallsMoving()) {
      this.gameTick();
    }

    // play out the animations until they are done
    for (let i = 0; i < 40; i++) {
      this.fastForward();
      (async () => {
        await new Promise(f => setTimeout(f, TICK_RATE));
      })
    }

    // emits a history update to listeners, passing the new model history.
    this.emit('onHistoryUpdate', this.modelHistory);

    // swap the turns
    if (this.isPlayer1Turn) {
      this._playerIDToMove = this.player2ID;
    } else {
      this._playerIDToMove = this.player1ID;
    }
    this.isPlayer1Turn = !this.isPlayer1Turn;
  }

  /**
   * Helper function that returns whether any pool ball is moving.
   * @returns a boolean that stores whether any of the pool balls are moving
   */
  private _areAnyPoolBallsMoving(): boolean {
    this._physicsPoolBalls.forEach(ball => {
      if (ball.velocity.x !== 0 || ball.velocity.y !== 0) {
        return true;
      }
    });

    return false;
  }

  /**
   * Starts the current PoolGame. Sets all of the variables to default AND sets this.isGameStarted to true.
   */
  startGame(): void {
    // if players aren't valid, we dont start the game
    // if (!this.player1ID || !this.player2ID) {
    //   return;
    // }
    this.currentTick = 0;
    this.modelHistory = [this.currentModel];
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
    } else if (ballNumber === 0) {
      return 'CueBall';
    } else {
      return 'Invalid';
    }
  }

  /**
   * Placeholder function that is called every tick. Checks for collisions, scratches, game overs, etc.
   */
  gameTick(): void {
    // only tick the game if we've actually started it. Assuming we'll start via an input in covey.town.
    if (this.isGameStarted) {
      this.poolPhysicsGoHere();
      this.currentModel = this.toPoolGameAreaModel();

      if (this.isGameOver().isGameOver) {
        this.endGame();
      }
      this.emit('onTick', this.currentModel);
      this.modelHistory.push(this.currentModel);
      this.currentTick++;
    }
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

  /**
   * Checks if the game has ended, and ends the game if a player has won.
   *
   * Emits gameOver with the ID of the player that won.
   */
  endGame(): void {
    const gameOverStruct: { isGameOver: boolean; didPlayer1Win: boolean } = this.isGameOver();

    if (gameOverStruct.didPlayer1Win && this.player1ID) {
      this._leaderboardService.leaderboard.playerWon(this.player1ID);
      this.emit('gameOver', this.player1ID);
    } else if (!gameOverStruct.didPlayer1Win && this.player2ID) {
      this._leaderboardService.leaderboard.playerWon(this.player2ID);
      this.emit('gameOver', this.player2ID);
      // send update to frontend saying that player 2 won.
    }
  }

  /**
   * Fast forwards the game by 10 ticks instead of one at a time
   */
  fastForward(): void {
    for (let i = 0; i < 10; i++) {
      this.gameTick();
    }
  }

  // whatever else needs to go here, maybe physics
  poolPhysicsGoHere(): void {
    // check every pool ball's overlappingBalls list. If not overlapping with any ball, remove them from the list.
    // in addition, check every pool ball's recently hit rails list. if we're sufficiently far from them, remove them from the list.
    this._physicsPoolBalls.forEach(ball => {
      const ballVelocityMagnitude = magnitude(ball.velocity);
      ball.velocity = {
        x: ball.velocity.x * (1 - 1 / (50 + ballVelocityMagnitude ** 2)),
        y: ball.velocity.y * (1 - 1 / (50 + ballVelocityMagnitude ** 2)),
        z: 0,
      };
      ball.position = { x: ball.position.x, y: ball.position.y, z: 0 };
      if (ballVelocityMagnitude < 0.2) {
        ball.isMoving = false;
        ball.velocity = { x: 0, y: 0, z: 0 };
      }
      ball.overlappingBalls.forEach(oBall => {
        if (magnitude(subtractVectors(ball.position, oBall.position)) > BALL_RADIUS * 2) {
          ball.removeOverlappingBall(oBall);
        }
      });
      ball.recentlyHitRails.forEach(rail => {
        switch (rail) {
          case 'top': {
            if (
              magnitude(
                subtractVectors(ball.position, {
                  x: ball.position.x,
                  y: RAIL_WIDTH,
                  z: 0,
                }),
              )
            ) {
              ball.removeRecentlyHitRail(rail);
            }
            break;
          }
          case 'bottom': {
            if (
              magnitude(
                subtractVectors(ball.position, {
                  x: ball.position.x,
                  y: this._tableWidth + RAIL_WIDTH,
                  z: 0,
                }),
              )
            ) {
              ball.removeRecentlyHitRail(rail);
            }
            break;
          }
          case 'left': {
            if (
              magnitude(
                subtractVectors(ball.position, {
                  x: RAIL_WIDTH,
                  y: ball.position.y,
                  z: 0,
                }),
              )
            ) {
              ball.removeRecentlyHitRail(rail);
            }
            break;
          }
          case 'right': {
            if (
              magnitude(
                subtractVectors(ball.position, {
                  x: ball.position.x,
                  y: RAIL_WIDTH,
                  z: 0,
                }),
              )
            ) {
              ball.removeRecentlyHitRail(rail);
            }
            break;
          }
          default: {
            break;
          }
        }
      });
    });

    // holds all of the currently moving pool balls-- these are the ones we need to check collisions with
    const movingBalls: PoolBall[] = this._physicsPoolBalls.filter(
      ball => ball.isMoving && !ball.isPocketed,
    );
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
        if (ball.position.z <= 0 && ball.velocity.z < 0) {
          ballSlateCollision(ball);
        }

        // ball-ball collisions
        this._physicsPoolBalls.forEach(otherBall => {
          // check if the two current poolballs are different, not overlapping, and have not already been checked
          if (
            !otherBall.isPocketed &&
            ball !== otherBall &&
            !alreadyCheckedBalls.includes(otherBall) &&
            !ball.overlappingBalls.includes(otherBall) &&
            !otherBall.overlappingBalls.includes(ball)
          ) {
            if (magnitude(subtractVectors(ball.position, otherBall.position)) <= BALL_RADIUS * 2) {
              ballBallCollision(ball, otherBall);
              alreadyCheckedBalls.push(ball);
              alreadyCheckedBalls.push(otherBall);
              ball.addOverlappingBall(otherBall);
              otherBall.addOverlappingBall(ball);

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
            // ball goes in pocket, so stop it from moving !!
            ball.isPocketed = true;
            ball.velocity = { x: 0, y: 0, z: 0 };
            ball.isMoving = false;
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
          !ball.recentlyHitRails.includes('right') &&
          magnitude(
            subtractVectors(ball.position, {
              x: this._tableLength + RAIL_WIDTH,
              y: ball.position.y,
              z: 0,
            }),
          ) <=
            2 * BALL_RADIUS
        ) {
          // collided with right rail
          cushionBallCollision(ball, 0);
          // ball.velocity.x = -ball.velocity.x * 0.6;
          alreadyCheckedBalls.push(ball);
          ball.addRecentlyHitRail('right');
        } else if (
          ball.velocity.x < 0 &&
          !ball.recentlyHitRails.includes('left') &&
          magnitude(
            subtractVectors(ball.position, {
              x: RAIL_WIDTH,
              y: ball.position.y,
              z: 0,
            }),
          ) <=
            2 * BALL_RADIUS
        ) {
          // collided with left rail
          cushionBallCollision(ball, 2);
          // ball.velocity.x = -ball.velocity.x * 0.6;
          alreadyCheckedBalls.push(ball);
          ball.addRecentlyHitRail('left');
        } else if (
          ball.velocity.y < 0 &&
          !ball.recentlyHitRails.includes('top') &&
          (ball.position.x < this._tableLength / 2 - POCKET_RADIUS ||
            ball.position.x > this._tableLength / 2 + POCKET_RADIUS) &&
          magnitude(
            subtractVectors(ball.position, {
              x: ball.position.x,
              y: RAIL_WIDTH,
              z: 0,
            }),
          ) <=
            2 * BALL_RADIUS
        ) {
          // collided with top rail, but NOT with the pocket
          cushionBallCollision(ball, 1);
          // ball.velocity.y = -ball.velocity.y * 0.6;
          alreadyCheckedBalls.push(ball);
          ball.addRecentlyHitRail('top');
        } else if (
          ball.velocity.y > 0 &&
          !ball.recentlyHitRails.includes('bottom') &&
          (ball.position.x < this._tableLength / 2 - POCKET_RADIUS ||
            ball.position.x > this._tableLength / 2 + POCKET_RADIUS) &&
          magnitude(
            subtractVectors(ball.position, {
              x: ball.position.x,
              y: this._tableWidth + RAIL_WIDTH,
              z: 0,
            }),
          ) <=
            2 * BALL_RADIUS
        ) {
          // collided with bottom rail, but NOT with the pocket
          cushionBallCollision(ball, 3);
          // ball.velocity.y = -ball.velocity.y * 0.6;
          alreadyCheckedBalls.push(ball);
          ball.addRecentlyHitRail('bottom');
        }

        // check if the ball has gone off the board/ over the rails
        let haveWeScratchedOverTable = false;
        if (ball.position.x > this._tableLength) {
          ball.position.x = this._tableLength - 6 * BALL_RADIUS;
          ball.velocity = { x: 0, y: 0, z: 0 };
          alreadyCheckedBalls.push(ball);
          haveWeScratchedOverTable = ball.ballNumber === 0;
        } else if (ball.position.x < 0) {
          ball.position.x = RAIL_WIDTH + 6 * BALL_RADIUS;
          ball.velocity = { x: 0, y: 0, z: 0 };
          alreadyCheckedBalls.push(ball);
          haveWeScratchedOverTable = ball.ballNumber === 0;
        } else if (ball.position.y > this._tableWidth) {
          ball.position.y = this._tableWidth - 6 * BALL_RADIUS;
          ball.velocity = { x: 0, y: 0, z: 0 };
          alreadyCheckedBalls.push(ball);
          haveWeScratchedOverTable = ball.ballNumber === 0;
        } else if (ball.position.y < 0) {
          ball.position.y = RAIL_WIDTH + 6 * BALL_RADIUS;
          ball.velocity = { x: 0, y: 0, z: 0 };
          alreadyCheckedBalls.push(ball);
          haveWeScratchedOverTable = ball.ballNumber === 0;
        }
        if (haveWeScratchedOverTable) {
          // cue ball went over the table, scratch
          this._isBallBeingPlaced = true;
          if (this.isPlayer1Turn) {
            this._playerIDToMove = this.player2ID;
          } else {
            this._playerIDToMove = this.player1ID;
          }
          canScratch = false;
        }
      }
    });
    // update the poolballmodels
    this.poolBalls = this._physicsPoolBalls.map(ball => ball.toModel());
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
 * A react hook to retrieve the PoolGameAreaModel of a PoolGameAreaController, returning a PoolGameAreaModel.
 *
 * This hook will re-render any components that use it when the current PoolGameAreaModel changes.
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
