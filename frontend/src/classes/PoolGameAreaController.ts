import EventEmitter from 'events';
import _ from 'lodash';
import TypedEmitter from 'typed-emitter';
import PlayerController from './PlayerController';
import { PoolGameArea as PoolGameAreaModel, PoolBall } from '../types/CoveyTownSocket';
//import PoolBall from './PoolBall';

/**
 * Type representing the entirety of the pool game to be sent to the frontend.
 *
 * POOL TODO: further documentation about state
 */
export type PoolGameState = {
  // a list of pool ball objects, each of which contains information on their current position, orientation, etc.
  poolBalls: FrontEndPoolBall[];
  player1BallType: BallType;
  player2BallType: BallType;
  isPlayer1Turn: boolean;

  // POOL TODO: add more
};

/**
 * Type representing a pool ball exclusively for the front end.
 * For sending to the front end with only the necessary information, rather than the full backend objects.
 */
export type FrontEndPoolBall = {
  posX: number;
  posY: number;
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
  onTick: () => void;

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
  private _player1BallType: BallType = 'Stripes';

  private _player2BallType: BallType = 'Solids';

  private _isPlayer1turn = false;

  // Constatns representing the length and width of a 7-foot pool table. (0, 0) is the top-left corner of the playable area.
  private _tableLength = 78;

  private _tableWidth = 39;

  /**
   * Create a new PoolGameAreaController
   * @param poolGameModel model representation of this pool area
   */
  constructor(poolGameModel: PoolGameAreaModel) {
    super();
    this._id = poolGameModel.id;
  }

  /**
   * The ID of this pool area (read only)
   */
  get id() {
    return this._id;
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

  // POOL TODO
  startGame(): void {
    // randomly decide who is first
    this._isPlayer1turn = Math.random() <= 0.5;

    // set pool balls into break position
  }

  // Checks if the game is over. Returns a struct that contains information about if the game is over, and if so, who won.
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
    // loop through every pool ball, calling an update function on them and checking for collisions.
    // if any collisions, call the collide function on both balls, passing each other as parameters.
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

  public updateFrom(updatedModel: PoolGameAreaModel) {
    // TODO: implement this (look at viewingareacontroller)
  }
}
