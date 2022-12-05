import { addVectors, crossProduct, scale, unitVector, Vector } from '../Vector';

import { PoolBall as PoolBallModel } from '../../../../../../types/CoveyTownSocket';

const ROLLING_FRICTION = 0.01;
const SLIDING_FRICTION = 0.4; // tentative
const GRAVITATIONAL_CONSTANT = 9.8; // m/s^2
const BALL_RADIUS = 0.028575; // m
const SPINNING_FRICTION = 0.4444 * BALL_RADIUS;
const ANGULAR_SPINNING_ACCEL_COEFF =
  (5 * SPINNING_FRICTION * GRAVITATIONAL_CONSTANT) / (2 * BALL_RADIUS);
const ANGULAR_SLIDING_ACCEL_COEFF =
  (5 * SLIDING_FRICTION * GRAVITATIONAL_CONSTANT) / (2 * BALL_RADIUS);

export enum MotionState {
  Stationary = 'Stationary',
  Spinning = 'Spinning',
  Sliding = 'Sliding',
  Rolling = 'Rolling',
  Airborne = 'Airborne',
}

/**
 * Represents a pool ball with physics implemented
 *
 * NOTE: these were tested manually since these calculations are much too complicated to test in a test file
 */
export default class PoolBall {
  private _angularOrientation: Vector;

  private _angularVelocity: Vector;

  private _position: Vector;

  private _velocity: Vector;

  private _ballNumber: number;

  private _isPocketed: boolean;

  private _stateOfMotion: MotionState;

  constructor(xPosition: number, yPosition: number, ballNumber: number) {
    this._ballNumber = ballNumber;
    this._angularOrientation = { x: 0, y: 0, z: 0 };
    this._angularVelocity = { x: 0, y: 0, z: 0 };
    this._position = { x: xPosition, y: yPosition, z: 0 };
    this._velocity = { x: 0, y: 0, z: 0 };
    this._isPocketed = false;
    this._stateOfMotion = MotionState.Stationary;
  }

  get angularVelocity() {
    return { x: this._angularVelocity.x, y: this._angularVelocity.y, z: this._angularVelocity.z };
  }

  set angularVelocity(v: Vector) {
    Object.assign(this._angularVelocity, v);
  }

  get velocity(): Vector {
    return { x: this._velocity.x, y: this._velocity.y, z: this._velocity.z };
  }

  set velocity(v: Vector) {
    Object.assign(this._velocity, v);
    this._updateStateOfMotion();
  }

  get position(): Vector {
    return { x: this._position.x, y: this._position.y, z: this._position.z };
  }

  set position(v: Vector) {
    Object.assign(this._position, v);
  }

  set angularOrientation(v: Vector) {
    Object.assign(this._angularOrientation, v);
  }

  get angularOrientation(): Vector {
    return {
      x: this._angularOrientation.x,
      y: this._angularOrientation.y,
      z: this._angularOrientation.z,
    };
  }

  get ballNumber() {
    return this._ballNumber;
  }

  set ballNumber(ballNumber: number) {
    this._ballNumber = ballNumber;
  }

  get ballType() {
    return this.getBallTypeByNumber(this.ballNumber);
  }

  set isPocketed(isPocketed: boolean) {
    this._isPocketed = isPocketed;
  }

  get isPocketed() {
    return this._isPocketed;
  }

  get stateOfMotion() {
    return this._stateOfMotion;
  }

  set stateOfMotion(state: MotionState) {
    this._stateOfMotion = state;
  }

  public evolveByTime(time: number) {
    this._position = addVectors(
      this.position,
      addVectors(scale(this.velocity, time), scale(this.acceleration, 0.5 * time ** 2)),
    );
    this._velocity = addVectors(this.velocity, scale(this.acceleration, time));
    switch (this.stateOfMotion) {
      case MotionState.Stationary:
        break;
      case MotionState.Spinning:
        this._evolveSpinningAngular(time);
        break;
      case MotionState.Airborne:
        this._evolveAirborneAngular(time);
        break;
      case MotionState.Rolling:
        this._evolveRollingAngular(time);
        break;
      case MotionState.Sliding:
        this._evolveSlidingAngular(time);
        break;
    }
  }

  private _evolveSpinningAngular(time: number) {
    if (this.angularVelocity.z >= 0) {
      this._angularVelocity.z = this.angularVelocity.z - ANGULAR_SPINNING_ACCEL_COEFF * time;
      this._angularOrientation.z =
        this.angularOrientation.z +
        this.angularVelocity.z * time -
        0.5 * ANGULAR_SPINNING_ACCEL_COEFF * time ** 2;
    } else {
      this._angularVelocity.z = this.angularVelocity.z + ANGULAR_SPINNING_ACCEL_COEFF * time;
      this._angularOrientation.z =
        this.angularOrientation.z +
        this.angularVelocity.z * time +
        0.5 * ANGULAR_SPINNING_ACCEL_COEFF * time ** 2;
    }
  }

  private _evolveAirborneAngular(time: number) {
    this._angularOrientation = addVectors(
      this.angularOrientation,
      scale(this.angularVelocity, time),
    );
  }

  private _evolveRollingAngular(time: number) {
    this._angularVelocity.x = -this.velocity.y / BALL_RADIUS;
    this._angularVelocity.y = this.velocity.x / BALL_RADIUS;
    this._angularOrientation.x = -this.position.y / BALL_RADIUS;
    this._angularOrientation.y = this.position.x / BALL_RADIUS;
    this._evolveSpinningAngular(time);
  }

  private _evolveSlidingAngular(time: number) {
    const relativeVelocityUnit: Vector = unitVector(this.relativeVelocity());
    this._angularVelocity.x =
      this.angularVelocity.x + ANGULAR_SLIDING_ACCEL_COEFF * relativeVelocityUnit.y * time;
    this._angularVelocity.y =
      this.angularVelocity.y + ANGULAR_SLIDING_ACCEL_COEFF * relativeVelocityUnit.x * time;
    this._angularOrientation.x =
      this._angularOrientation.x +
      this.angularVelocity.x * time +
      0.5 * ANGULAR_SLIDING_ACCEL_COEFF * relativeVelocityUnit.y * time ** 2;
    this._angularOrientation.y =
      this.angularOrientation.y +
      this.angularVelocity.y * time +
      0.5 * ANGULAR_SLIDING_ACCEL_COEFF * relativeVelocityUnit.x * time ** 2;
    this._evolveSpinningAngular(time);
  }

  get acceleration(): Vector {
    let acceleration: Vector = { x: 0, y: 0, z: 0 };
    switch (this.stateOfMotion) {
      case MotionState.Stationary:
        break;
      case MotionState.Spinning:
        break;
      case MotionState.Airborne:
        acceleration.z = -GRAVITATIONAL_CONSTANT;
        break;
      case MotionState.Rolling:
        acceleration = scale(unitVector(this.velocity), -ROLLING_FRICTION * GRAVITATIONAL_CONSTANT);
        break;
      case MotionState.Sliding:
        acceleration = scale(
          unitVector(this.relativeVelocity()),
          -SLIDING_FRICTION * GRAVITATIONAL_CONSTANT,
        );
        break;
    }
    return acceleration;
  }

  private _updateStateOfMotion() {
    if (this.velocity.z !== 0) {
      this.stateOfMotion = MotionState.Airborne;
    } else if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      if (
        this.angularVelocity.x === this.velocity.y / BALL_RADIUS &&
        this.angularVelocity.y === this.velocity.x / BALL_RADIUS
      ) {
        this.stateOfMotion = MotionState.Rolling;
      } else {
        this.stateOfMotion = MotionState.Sliding;
      }
    } else {
      if (this.angularVelocity.z !== 0) {
        this.stateOfMotion = MotionState.Spinning;
      } else {
        this.stateOfMotion = MotionState.Stationary;
      }
    }
  }

  public relativeVelocity(): Vector {
    const kHat: Vector = { x: 0, y: 0, z: 1 }; // vertical unit vector
    // the "velocity" that must be used when calculating friction, as it accounts for both linear and angular momentum
    return addVectors(this.velocity, crossProduct(scale(kHat, BALL_RADIUS), this.angularVelocity));
  }

  // Convert to a PoolBallModel suitable for broadcasting
  public toModel() {
    return {
      angularOrientation: this.angularOrientation,
      angularVelocity: this.angularVelocity,
      position: this.position,
      velocity: this.velocity,
      ballNumber: this.ballNumber,
      ballType: this.getBallTypeByNumber(this.ballNumber),
      isPocketed: this.isPocketed,
      stateOfMotion: this.stateOfMotion,
    };
  }

  public static fromModel(model: PoolBallModel): PoolBall {
    const newBall: PoolBall = new PoolBall(0, 0, 0);
    newBall.angularVelocity = model.angularVelocity;
    newBall.angularOrientation = model.angularOrientation;
    newBall.position = model.position;
    newBall.velocity = model.velocity;
    newBall.ballNumber = model.ballNumber;
    newBall.stateOfMotion = model.stateOfMotion;
    return newBall;
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
}
