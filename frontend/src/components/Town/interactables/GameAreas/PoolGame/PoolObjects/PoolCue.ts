import { Vector } from '../Vector';

const CUE_MASS = 0.5386; // kg

export default class PoolCue {
  private _velocity: Vector = { x: 0, y: 0, z: 0 };

  private _position: Vector = { x: 0, y: 0, z: 0 };

  constructor(velocity: Vector, position: Vector) {
    Object.assign(this._velocity, velocity);
    Object.assign(this._position, position);
  }

  get velocity() {
    return { x: this._velocity.x, y: this._velocity.y, z: this._velocity.z };
  }

  set velocity(v: Vector) {
    Object.assign(this._velocity, v);
  }

  get position() {
    return { x: this._position.x, y: this._position.y, z: this._position.z };
  }

  set position(v: Vector) {
    Object.assign(this._position, v);
  }

  get mass(): number {
    return CUE_MASS;
  }
}
