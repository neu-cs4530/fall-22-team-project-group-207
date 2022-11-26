import EventEmitter from 'events';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import TypedEmitter from 'typed-emitter';
import PlayerController from './PlayerController';
import { PoolGameArea as PoolGameAreaModel, PoolBall, Player } from '../types/CoveyTownSocket';
import TownController from './TownController';
//import PoolBall from './PoolBall';

/**
 * Type representing the entirety of the pool game to be sent to the frontend.
 *
 * POOL TODO: further documentation about state
 */
export type PoolGameModel = {
  // a list of pool ball objects, each of which contains information on their current position, orientation, etc.
  poolBalls: PoolBallModel[];
  player1BallType: string | undefined;
  player2BallType: string | undefined;
  isPlayer1Turn: boolean;
  isBallBeingPlaced: boolean;

  // POOL TODO: add more
};

/**
 * Type representing a pool ball exclusively for the front end.
 * For sending to the front end with only the necessary information, rather than the full backend objects.
 */
export type PoolBallModel = {
  posnX: number;
  posnY: number;
  orientation: string;
  ballNumber: number;
};

/**
 * Type representing a move being made by a player
 *
 * POOL TODO: further documentation about state
 */
export type PoolMove = {
  playerID: string;
  velocity: number;
  cueHitLocationX: number;
  cueHitLocationY: number;
  cueHitLocationZ: number;
  // POOL TODO: add more
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
  onTick: (newModel: PoolGameModel) => void;

  // To tell other clients that a player has made a move
  onPlayerMove: (newMove: PoolMove) => void;

  // Player enters or leaves area
  occupantsChange: (newOccupants: PlayerController[]) => void;

  // Player joins or leaves game (interacts with area or presses exit)
  playersChange: (newPlayers: PlayerController[]) => void;
};

export default class PoolGameAreaController extends (EventEmitter as new () => TypedEmitter<PoolGameAreaEvents>) {
  // Players in bounds of the area
  private _occupants: PlayerController[] = [];

  private _id: string;

  // Current state of the game that we send to the front end for rendering
  public currentModel: PoolGameModel; 

  // Current move inputted by a player. Information in here is passed to the physics. Starts off undefined as there is no move by default.
  public currentMove: PoolMove | undefined = undefined;

  // Players playing the game (as opposed to spectating). A subset of occupants.
  private _players: PlayerController[] = [];

  // List of Pool Ball objects in the game. May contain the cue ball, TBD.
  private _poolBalls: PoolBall[] = [];

  private _cueBallIndex = 0;

  private _8ballIndex = 1;

  private _pockets: Pocket[] = [];

  // Number of Pool Balls each player has pocketed, for checking whether they should win/lose the game
  private _player1BallsPocketed = 0;

  private _player2BallsPocketed = 0;

  // String to hold whether a player is 'Stripes' or 'Solids'.
  private _player1BallType: string | undefined = undefined;

  private _player2BallType: string | undefined = undefined;

  private _isPlayer1turn = false;

  // Boolean that represents whether a player has to replace a ball or not
  private _isBallBeingPlaced = false;

  // Constants representing the length and width of a 7-foot pool table. (0, 0) is the top-left corner of the playable area.
  private _tableLength = 78;

  private _tableWidth = 39;

  // Boolean that represents whether the game has started or not.
  private _isGameStarted = false;

  /**
   * Create a new PoolGameAreaController
   * @param poolGameModel model representation of this pool area
   */
  constructor(poolGameModel: PoolGameAreaModel) {
    super();
    this._id = poolGameModel.id;
    this.currentModel = {
      poolBalls: this._poolBalls,
      player1BallType: this._player1BallType,
      player2BallType: this._player2BallType,
      isPlayer1Turn: this._isPlayer1turn,
      isBallBeingPlaced: this._isBallBeingPlaced,
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
    return this._isPlayer1turn;
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
    if (
      newPlayers.length !== this._players.length ||
      _.xor(newPlayers, this._players).length > 0
    ) {
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
  set poolBalls(newPoolBalls: PoolBall[]) {
    if (
      newPoolBalls.length !== this._poolBalls.length ||
      _.xor(newPoolBalls, this._poolBalls).length > 0
    ) {
      this._poolBalls = newPoolBalls;
    }
  }

  // POOL TODO
  startGame(): void {
    // randomly decide who is first
    this._isPlayer1turn = Math.random() <= 0.5;

    // set pool balls into break position
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
  }

  /**
   * Checks if the game is over. Returns a struct that contains information about if the game is over, and if so, who won.
   */ 
  isGameOver(): { isGameOver: boolean; didPlayer1Win: boolean } {
    // If a player has 8 balls pocketed (all 7 of theirs and the 8 ball)
    // the 8 ball is pocketed, the cue ball is NOT pocketed, and it is a certain player's turn, that player wins.
    if (this._isPlayer1turn) {
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
    if (!this._isPlayer1turn) {
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
  poolPhysicsGoHere(): void {
    // call physics update function with the currentMove information
    // physics(this.currentMove?.cueHitLocationX, this.currentMove?.cueHitLocationY)
    // we only want to update once, so we reset current move to undefined.
    // this.currentMove = undefined;

    // holds all of the currently moving pool balls-- these are the ones we need to check collisions with
    let movingBalls: PoolBall[] = this.poolBalls.filter(ball => ball.isMoving);
    // holds all of the pool balls we've already checked for collisions to prevent duplicate collisions
    let alreadyCheckedBalls: PoolBall[] = [];
    
    // loop through every pool ball, calling an update function on them and checking for collisions.
    // if any collisions, call the collide function on both balls, passing each other as parameters.
    movingBalls.forEach(ball => {
      if (!alreadyCheckedBalls.includes(ball)) {
        // ball-table collisions
        // if (ball.position.Z = 0 && ball.velocity.z < 0) {
        //   // call ball/table collision
        // }

        // ball-ball collisions
        this._poolBalls.forEach(otherBall => {
          if (ball !== otherBall) {
            if(ball.ballNumber === 0 || otherBall.ballNumber === 0) {
              // call cue/ball collision check

              // otherBall is the cue
              if (this.isPlayer1Turn
                && ball.ballNumber === 0
                && otherBall.ballType !== this._player1BallType) {
                // player 1 hit the wrong ball, scratch
                this._isBallBeingPlaced = true;
              }
              if (!this.isPlayer1Turn
                && ball.ballNumber === 0
                && otherBall.ballType !== this._player2BallType) {
                // player 2 hit the wrong ball, scratch
                this._isBallBeingPlaced = true;
              }
              
              // ball is the cue
              if (this.isPlayer1Turn
                && ball.ballNumber !== 0
                && ball.ballType !== this._player1BallType) {
                // player 1 hit the wrong ball, scratch
                this._isBallBeingPlaced = true;
              }
              if (!this.isPlayer1Turn
                && ball.ballNumber !== 0
                && ball.ballType !== this._player2BallType) {
                // player 2 hit the wrong ball, scratch
                this._isBallBeingPlaced = true;
              }
            }
            else {
              // call check collision between the two balls
            }
          }
        })
        // call check if ball goes in pocket
        // if (ball collides with pocket) {
        //   ball.isMoving = false;
        //   ball.isPocketed = true;
        //   (this.isPlayer1Turn) ? this._player1BallsPocketed++ : this._player2BallsPocketed++;
        // }

        // check if the ball has gone off the board/ over the rails
        // let haveWeScratched = false;
        // if (ball.posnX > this._tableLength) {
        // ball.posnX = this._tableLength - ballRadius;
        //   haveWeScratched = ball.ballNumber === 0;
        // }
        // if (ball.posnX < 0) {
        //   ball.posnX = 0 + ballRadius;
        //   haveWeScratched = ball.ballNumber === 0;
        // }
        // if (ball.posnY > this._tableWidth) {
        //   ball.posnY = this._tableWidth + ballRadius;
        //   haveWeScratched = ball.ballNumber === 0;
        // }
        // if (ball.posnY < 0) {
        //   ball.posnY = 0 - ballRadius;
        //   haveWeScratched = ball.ballNumber === 0;
        // }
        // if (haveWeScratched) {
        //   this._isBallBeingPlaced = true;
        // }
      }
    });

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
      isPlayer1Turn: this._isPlayer1turn,
      poolBalls: this._poolBalls,
    };
  }

  public updateFrom(
    updatedModel: PoolGameAreaModel,
    playerFinder: (playerIDs: string[]) => PlayerController[],
  ) {
    this._isPlayer1turn = updatedModel.isPlayer1Turn;
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
    this._isPlayer1turn = updatedModel.isPlayer1Turn;
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
 export function usePoolGameModel(area: PoolGameAreaController): PoolGameModel {
  const [gameModel, setGameModel] = useState(area.currentModel);
  useEffect(() => {
    area.addListener('onTick', setGameModel);
    return () => {
      area.removeListener('onTick', setGameModel);
    };
  }, [area, setGameModel]);
  return gameModel;
}

/**
 * A react hook to retrieve the current PoolMove of a PoolGameAreaController, returning a PoolMove.
 *
 * This hook will re-render any components that use it when the current PoolMove changes.
 */
 export function usePoolGameMove(area: PoolGameAreaController): PoolMove {
  const [playerMove, setPlayerMove] = useState(area.currentMove);
  useEffect(() => {
    area.addListener('playerMove', setPlayerMove);
    return () => {
      area.removeListener('playerMove', setPlayerMove);
    };
  }, [area, setPlayerMove]);
  return playerMove;
}
