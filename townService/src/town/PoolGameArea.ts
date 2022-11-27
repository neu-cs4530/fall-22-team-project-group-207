import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import Player from '../lib/Player';
import {
  BoundingBox,
  TownEmitter,
  PoolBall,
  PoolGameArea as PoolGameAreaModel,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

export default class PoolGameArea extends InteractableArea {
  private _player1ID: string | undefined;

  private _player2ID: string | undefined;

  // Stripes or solids, or undeclared if no balls have been pocketed yet
  private _player1BallType: string | undefined;

  private _player2BallType: string | undefined;

  private _isPlayer1Turn: boolean;

  private _poolBalls: PoolBall[];

  public get player1ID() {
    return this._player1ID;
  }

  public get player2ID() {
    return this._player2ID;
  }

  public get player1BallType() {
    return this._player1BallType;
  }

  public get player2BallType() {
    return this._player2BallType;
  }

  public get isPlayer1Turn() {
    return this._isPlayer1Turn;
  }

  public get poolBalls() {
    return this._poolBalls;
  }

  /**
   * Creates a new PoolGameArea
   *
   * @param poolArea model containing this area's starting state
   * @param coordinates the bounding box that defines this pool game area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    {
      id,
      player1ID,
      player2ID,
      player1BallType,
      player2BallType,
      isPlayer1Turn,
      poolBalls,
    }: PoolGameAreaModel,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this._player1ID = player1ID;
    this._player2ID = player2ID;
    this._player1BallType = player1BallType;
    this._player2BallType = player2BallType;
    this._isPlayer1Turn = isPlayer1Turn;
    this._poolBalls = poolBalls;
  }

  /**
   * Removes a player from this pool game area.
   *
   * When the last player leaves, this method clears the video of this area and
   * emits that update to all of the players
   *
   * @param player
   */
  public remove(player: Player): void {
    super.remove(player);
    if (this._occupants.length === 0) {
      this._emitAreaChanged();
    }
  }

  /**
   * Updates the state of this PoolGameArea, setting all of the properties
   *
   * @param poolGameArea updated model
   */
  public updateModel({
    player1ID,
    player2ID,
    player1BallType,
    player2BallType,
    isPlayer1Turn,
    poolBalls,
  }: PoolGameAreaModel) {
    this._player1ID = player1ID;
    this._player2ID = player2ID;
    this._player1BallType = player1BallType;
    this._player2BallType = player2BallType;
    this._isPlayer1Turn = isPlayer1Turn;
    this._poolBalls = poolBalls;
  }

  /**
   * Convert this PoolGameArea instance to a simple PoolGameAreaModel suitable for
   * transporting over a socket to a client.
   */
  public toModel(): PoolGameAreaModel {
    return {
      id: this.id,
      player1ID: this._player1ID,
      player2ID: this._player2ID,
      player1BallType: this._player1BallType,
      player2BallType: this._player2BallType,
      isPlayer1Turn: this._isPlayer1Turn,
      poolBalls: this._poolBalls,
    };
  }

  /**
   * Creates a new PoolGameArea object that will represent a PoolGame Area object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this viewing area exists
   * @param townEmitter An emitter that can be used by this pool game area to broadcast updates to players in the town
   * @returns
   */
  public static fromMapObject(mapObject: ITiledMapObject, townEmitter: TownEmitter): PoolGameArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed pool game area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new PoolGameArea(
      {
        id: name,
        player1ID: undefined,
        player2ID: undefined,
        player1BallType: undefined,
        player2BallType: undefined,
        isPlayer1Turn: true,
        poolBalls: [],
      },
      rect,
      townEmitter,
    );
  }
}
