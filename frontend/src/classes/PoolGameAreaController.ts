import EventEmitter from 'events';
import _ from 'lodash';
import TypedEmitter from 'typed-emitter';
import BackgroundSelectionDialog from '../components/VideoCall/VideoFrontend/components/BackgroundSelectionDialog/BackgroundSelectionDialog';
import PlayerController from './PlayerController';
//import PoolBall from './PoolBall';

/**
 * Type representing the entirety of the pool game
 *
 * POOL TODO: further documentation about state
 */
export type PoolGameState = {
  // a list of pool ball objects, each of which contains information on their current position, velocity, etc.
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
}

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
 * Type representing a pocket. Bounds are for calculations for overlapping with a Pool Ball.
 */
export type Pocket = {
  leftXBound: number;
  rightXBound: number;
  leftYBound: number;
  rightYBound: number;
}

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

  private _game: string;

  // Players playing the game (as opposed to spectating). A subset of occupants.
  private _players: PlayerController[] = [];

  // List of Pool Ball objects in the game. May contain the cue ball, TBD.
  private _poolBalls: PoolBall[] = [];

  private _pockets: Pocket[] = [];

  // Number of Pool Balls each player has pocketed, for checking whether they should win/lose the game
  private _player1BallsPocketed: number = 0;

  private _player2BallsPocketed: number = 0;

  // String to hold whether a player is 'Stripes' or 'Solids'.
  private _player1BallType: BallType = 'Stripes';

  private _player2BallType: BallType = 'Solids';

  private _isPlayer1turn: boolean = false;

  /**
   * Create a new PoolGameAreaController
   * @param id
   */
  constructor(id: string, game: string) {
    super();
    this._id = id;
    this._game = game;
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
    this._isPlayer1turn = (Math.random() <= 0.5); 

    // set pool balls into break position

    // 
  }

  // check if the game is over
  isGameOver(): boolean {
    // loop through each pool ball. If every pool ball of a type is pocketed, 
    // the 8 ball is pocketed, the cue ball is NOT pocketed, and it is a certain player's turn, that player wins.

    return false;
  }

  // POOL TODO
  endGame(): void {
    
  }

  // whatever else needs to go here, maybe physics
  poolPhysicsGoHere(): void {
    // loop through every pool ball, calling an update function on them and checking for collisions.
    // if any collisions, call the collide function on both balls, passing each other as parameters.
  }
}
