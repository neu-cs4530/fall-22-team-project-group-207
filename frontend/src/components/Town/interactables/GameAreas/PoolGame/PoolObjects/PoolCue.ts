import { Vector } from '../Vector';

const CUE_MASS = 0.5386; // kg

export default class PoolCue {
  private _velocity: Vector;

  private _position: Vector;

  constructor(velocity: Vector, position: Vector) {
    this._velocity = velocity;
    this._position = position;
  }

  get velocity() {
    return this._velocity;
  }

  get position() {
    return this._position;
  }

  get mass(): number {
    return CUE_MASS;
  }
}
