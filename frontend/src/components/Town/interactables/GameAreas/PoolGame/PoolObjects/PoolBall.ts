import {
  addVectors,
  crossProduct,
  magnitude,
  scale,
  subtractVectors,
  unitVector,
  Vector,
} from '../Vector';

const BALL_CLOTH_ANGULAR_DECELERATION_RATE = 10; //rad/s^2
const BALL_CLOTH_ROLLING_FRICTION = 0.01;
const BALL_CLOTH_SLIDING_FRICTION = 0.4; // tentative
const GRAVITATIONAL_CONSTANT = 9.8; // m/s^2
const BALL_RADIUS = 0.028575; // m
const ANGULAR_SLIDING_DECEL_COEFF =
  (5 * BALL_CLOTH_SLIDING_FRICTION * GRAVITATIONAL_CONSTANT) / (2 * BALL_RADIUS);

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

  private _isMoving: boolean;

  private _isAirborne: boolean;

  private _isPocketed: boolean;

  private _overlappingBalls: PoolBall[];

  constructor(xPosition: number, yPosition: number, ballNumber: number) {
    this._ballNumber = ballNumber;
    this._angularOrientation = { x: 0, y: 0, z: 0 };
    this._angularVelocity = { x: 0, y: 0, z: 0 };
    this._position = { x: xPosition, y: yPosition, z: 0 };
    this._velocity = { x: 0, y: 0, z: 0 };
    this._isMoving = false;
    this._isAirborne = false;
    this._isPocketed = false;
    this._overlappingBalls = [];
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
    if (v.x !== 0 || v.y !== 0) {
      this._isMoving = true;
    }
    if (v.z !== 0) {
      this._isMoving = true;
      this._isAirborne = true;
    }
  }

  get position(): Vector {
    return { x: this._position.x, y: this._position.y, z: this._position.z };
  }

  set position(v: Vector) {
    Object.assign(this._position, v);
  }

  get angularOrientation(): Vector {
    return {
      x: this._angularOrientation.x,
      y: this._angularOrientation.y,
      z: this._angularOrientation.z,
    };
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

  set isMoving(isMoving: boolean) {
    this._isMoving = isMoving;
  }

  get overlappingBalls() {
    return this._overlappingBalls;
  }

  set overlappingBalls(overlappingBalls: PoolBall[]) {
    this._overlappingBalls = overlappingBalls;
  }

  public addOverlappingBall(ball: PoolBall) {
    if (!this._overlappingBalls.includes(ball)) {
      this._overlappingBalls.push(ball);
    }
  }

  public removeOverlappingBall(ball: PoolBall) {
    this._overlappingBalls = this._overlappingBalls.filter(oball => oball !== ball);
  }

  public tick(elapsedTime: number) {
    console.log('tick from ball ' + this.ballNumber);
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
          console.log('sliding ball ' + this.ballNumber);
          // sliding
          this._updateSlidingBall(elapsedTime);
        } else {
          console.log('rolling ball ' + this.ballNumber);
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
    console.log('total friction direction: ' + totalFrictionDirection);
    console.log(
      'this.velocity (of pool ball ' + this.ballNumber + ') before subtract: ' + this.velocity,
    );
    this.velocity = subtractVectors(
      this.velocity,
      scale(
        totalFrictionDirection,
        BALL_CLOTH_SLIDING_FRICTION * GRAVITATIONAL_CONSTANT * elapsedTime,
      ),
    );
    console.log(
      'this.velocity (of pool ball ' + this.ballNumber + ') after subtract: ' + this.velocity,
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

  // Convert to a PoolBallModel suitable for broadcasting
  public toModel() {
    return {
      angularOrientation: this.angularOrientation,
      angularVelocity: this.angularVelocity,
      position: this.position,
      velocity: this.velocity,
      ballNumber: this.ballNumber,
      ballType: this.getBallTypeByNumber(this.ballNumber),
      isMoving: this.isMoving,
      isAirborne: this.isAirborne,
      isPocketed: this.isPocketed,
    };
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
