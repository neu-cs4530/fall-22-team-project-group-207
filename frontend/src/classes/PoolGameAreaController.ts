import EventEmitter from 'events';
import _ from 'lodash';
import TypedEmitter from 'typed-emitter';
import PlayerController from './PlayerController';

/**
 * Type representing the entirety of the pool game
 *
 * POOL TODO: further documentation about state
 */
export type PoolGameState = {
  ball1Pos: number;
  ball2Pos: number;
  // POOL TODO: add more
};

/**
 * Type representing a move being made by a player
 *
 * POOL TODO: further documentation about state
 */
export type PoolMove = {
  playerID: string;
  velocity: number;
  // POOL TODO: add more
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

  // Players playing the game (as opposed to spectating). A subset of occupants.
  private _players: PlayerController[] = [];

  private _id: string;

  private _game: string;

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
  startGame(): void {}

  // POOL TODO
  endGame(): void {}

  // whatever else needs to go here, maybe physics
  poolPhysicsGoHere(): void {}
}
