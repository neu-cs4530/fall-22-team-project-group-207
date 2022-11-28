import {
  addVectors,
  crossProduct,
  magnitude,
  unitVector,
  scale,
  subtractVectors,
  Vector,
} from '../Vector';

const BALL_CLOTH_ANGULAR_DECELERATION_RATE = 10; //rad/s^2
const BALL_CLOTH_ROLLING_FRICTION = 0.01;
const BALL_CLOTH_SLIDING_FRICTION = 0.2; // tentative
const GRAVITATIONAL_CONSTANT = 9.8; // m/s^2
const BALL_RADIUS = 0.028575; // m
const ANGULAR_SLIDING_DECEL_COEFF =
  (5 * BALL_CLOTH_SLIDING_FRICTION * GRAVITATIONAL_CONSTANT) / (2 * BALL_RADIUS);

export default class PoolBall {
  private _angularOrientation: Vector;

  private _angularVelocity: Vector;

  private _position: Vector;

  private _velocity: Vector;

  private _ballNumber: number;

  private _isMoving: boolean;

  private _isAirborne: boolean;

  private _isPocketed: boolean;

  constructor(xPosition: number, yPosition: number, ballNumber: number) {
    this._ballNumber = ballNumber;
    this._angularOrientation = { x: 0, y: 0, z: 0 };
    this._angularVelocity = { x: 0, y: 0, z: 0 };
    this._position = { x: xPosition, y: yPosition, z: BALL_RADIUS };
    this._velocity = { x: 0, y: 0, z: 0 };
    this._isMoving = false;
    this._isAirborne = false;
    this._isPocketed = false;
  }

  get angularVelocity() {
    return this._angularVelocity;
  }

  set angularVelocity(v: Vector) {
    this._angularVelocity = v;
  }

  get velocity(): Vector {
    return this._velocity;
  }

  set velocity(v: Vector) {
    this._velocity = v;
    if (v.x !== 0 || v.y !== 0) {
      this._isMoving = true;
    }
    if (v.z !== 0) {
      this._isMoving = true;
      this._isAirborne = true;
    }
  }

  get position(): Vector {
    return this._position;
  }

  get angularOrientation(): Vector {
    return this._angularOrientation;
  }

  set isAirborne(isAirborne: boolean) {
    this._isAirborne = isAirborne;
  }

  get isAirborne() {
    return this._isAirborne;
  }

  get ballNumber() {
    return this._ballNumber;
  }

  set isPocketed(isPocketed: boolean) {
    this._isPocketed = isPocketed;
  }

  get isPocketed() {
    return this._isPocketed;
  }

  get isMoving() {
    return this._isMoving;
  }

  public tick(elapsedTime: number) {
    if (this._isMoving) {
      this._updatePosition(elapsedTime);
      this._updateOrientation(elapsedTime);
      // decide if ball is airborne, rolling or sliding and update velocities accordingly
      if (!this._isAirborne) {
        // frictional forces will only affect velocities if the ball isn't airborne
        if (
          this.angularVelocity.x !== this.velocity.x / BALL_RADIUS ||
          this.angularVelocity.y !== this.velocity.y / BALL_RADIUS
        ) {
          // sliding
          this._updateSlidingBall(elapsedTime);
        } else {
          // rolling
          this._updateRollingBall(elapsedTime);
        }
      }
    }
    if (this.angularVelocity.z !== 0) {
      this._updateSpinningBall(elapsedTime);
    }
  }

  private _updateOrientation(elapsedTime: number) {
    this._angularOrientation = addVectors(
      this.angularOrientation,
      scale(this.angularVelocity, elapsedTime),
    );
  }

  private _updatePosition(elapsedTime: number) {
    this._position = addVectors(this.position, scale(this.velocity, elapsedTime));
  }

  private _updateSpinningBall(elapsedTime: number) {
    if (this.position.z > 0) {
      return;
    }
    const changeInSpin: number = elapsedTime * BALL_CLOTH_ANGULAR_DECELERATION_RATE;
    if (changeInSpin > Math.abs(this.angularVelocity.z)) {
      this._angularVelocity.z = 0;
    } else {
      this._angularVelocity.z =
        this.angularVelocity.z > 0
          ? this.angularVelocity.z - changeInSpin
          : this.angularVelocity.z + changeInSpin;
    }
  }

  private _updateRollingBall(elapsedTime: number) {
    const frictionVector: Vector = scale(
      unitVector(this.velocity),
      BALL_CLOTH_ROLLING_FRICTION * GRAVITATIONAL_CONSTANT * elapsedTime,
    );
    if (magnitude(this.velocity) > magnitude(frictionVector)) {
      this._velocity = subtractVectors(this.velocity, frictionVector);
    } else {
      this._velocity = { x: 0, y: 0, z: 0 };
      this._isMoving = false;
    }
    this._angularVelocity.y = this.velocity.x / BALL_RADIUS;
    this._angularVelocity.x = this.velocity.y / BALL_RADIUS;
  }

  private _updateSlidingBall(elapsedTime: number) {
    // vertical unit vector
    const kHat: Vector = { x: 0, y: 0, z: 1 };
    // the "velocity" that must be used when calculating friction, as it accounts for both linear and angular momentum
    const relativeVelocity: Vector = addVectors(
      this.velocity,
      crossProduct(scale(kHat, BALL_RADIUS), this.angularVelocity),
    );
    const totalFrictionDirection: Vector = unitVector(relativeVelocity);
    this._velocity = subtractVectors(
      this.velocity,
      scale(
        totalFrictionDirection,
        BALL_CLOTH_SLIDING_FRICTION * GRAVITATIONAL_CONSTANT * elapsedTime,
      ),
    );
    const xyPlaneAngularVelocity: Vector = subtractVectors(
      { x: this.angularVelocity.x, y: this.angularVelocity.y, z: 0 },
      scale(crossProduct(kHat, relativeVelocity), ANGULAR_SLIDING_DECEL_COEFF * elapsedTime),
    );
    if (
      Math.abs(xyPlaneAngularVelocity.x - this.velocity.x / BALL_RADIUS) < 0.01 &&
      Math.abs(xyPlaneAngularVelocity.y - this.velocity.y / BALL_RADIUS) < 0.01
    ) {
      this._angularVelocity.y = this.velocity.x / BALL_RADIUS;
      this._angularVelocity.x = this.velocity.y / BALL_RADIUS;
    } else {
      this._angularVelocity.x = xyPlaneAngularVelocity.x;
      this._angularVelocity.y = xyPlaneAngularVelocity.y;
    }
  }
}
