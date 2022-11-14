import PoolCue from "./PoolCue";
import { addVectors, angleBetween, magnitude, parallelUnitVector, scale, subtractVectors, vector } from "./Vector";

const BALL_MASS = 0.16726 // kg
const BALL_CLOTH_ANGULAR_DECELERATION_RATE: number = 10; //rad/s^2
const BALL_CLOTH_ROLLING_FRICTION: number = 0.01;
const GRAVITATIONAL_CONSTANT = 9.8; // m/s^2
const BALL_RADIUS = 0.028575; // m
const BALL_MOMENT_OF_INERTIA = (2 / 5) * BALL_MASS * (BALL_RADIUS ** 2);

export default class PoolBall {
    private _wx: number; // The x axis goes across the length of the table
    private _wy: number; // The y axis goes across the width of the table
    private _wz: number; // The z axis goes vertically into the table
    private _position: vector;
    private _velocity: vector;

    constructor(xPosition: number, yPosition: number) {
        this._wx = 0;
        this._wy = 0;
        this._wz = 0;
        this._position = {x: xPosition, y: yPosition, z: BALL_RADIUS};
        this._velocity = {x: 0, y: 0, z: 0};
    }

    get velocity(): vector {
        return this._velocity;
    }

    set velocity(v: vector) {
        this._velocity = v;
    }

    get position(): vector {
        return this._position;
    }

    get weight(): number {
        return BALL_MASS;
    }

    private _updateSpinningBall(elapsedTime: number) {
        this._wz = this._wz - elapsedTime * BALL_CLOTH_ANGULAR_DECELERATION_RATE;
    }

    private _updateRollingBall(elapsedTime: number) {
        const oldVelocityMagnitude = magnitude(this.velocity);
        var newVelocityMagnitude = oldVelocityMagnitude - BALL_CLOTH_ROLLING_FRICTION * GRAVITATIONAL_CONSTANT * elapsedTime;
        if (newVelocityMagnitude < 0.001) {newVelocityMagnitude = 0};
        const scalar = newVelocityMagnitude / oldVelocityMagnitude;
        this._velocity = scale(this.velocity, scalar);
        this._position.x += + this._velocity.x * elapsedTime;
        this._position.y += + this._velocity.y * elapsedTime;
        this._wy = this._velocity.x / BALL_RADIUS;
        this._wx = this._velocity.y / BALL_RADIUS;
        this._updateSpinningBall(elapsedTime);
    }
}

export function ballBallCollision(ball1: PoolBall, ball2: PoolBall) {
    // v0 is the velocity vector of ball 1 as it's approaching
    var v0: vector = ball1.velocity;
    var ball2IsMoving = magnitude(ball2.velocity) > 0;
    // If ball 2 isn't actually stationary, change the frame of reference to pretend like it is by subtracting the velocity vector of the
    // "stationary" ball 2 from the moving ball 1
    if (ball2IsMoving) {
        v0 = subtractVectors(v0, ball2.velocity);
    }
    // vB is the vector indicating the direction ball 2 will go, represented by the vector connecting the balls' midpoints. 
    // Right now only the direction is important, so we can use the unit vector parallel to the real vB vector.
    var vB: vector = parallelUnitVector({
        x: ball2.position.x - ball1.position.x, 
        y: ball2.position.y - ball1.position.y,
        z: ball2.position.z - ball1.position.z
    });
    // Knowing the angle between the initial and final ball directions allows us to find how much each ball will lose its velocity
    const alpha: number = angleBetween(v0, vB);
    // If we consider the triangle formed between the initial velocity vector of ball 1 and the resulting velocity vector of ball 2,
    // with alpha as the angle between the 2 vectors and v0 as the hypotenuse: cos(alpha) = vB/v0, and therefore the magnitude of vB = v0 * cos(alpha) 
    vB = scale(vB, magnitude(v0) * Math.cos(alpha));
    // Conservation of linear momentum tells us v0 = vA + vB as long as the collision is elastic, which I'm pretending is true. Therefore, we know vA = v0 - vB
    var vA: vector = subtractVectors(v0, vB);
    // If we changed the frame of reference to make ball 2 stationary, we need to restore the frame of reference back to the table
    if (ball2IsMoving) {
        vA = addVectors(vA, ball2.velocity);
        vB = addVectors(vB, ball2.velocity);
    }
    // Friction and spin be damned.
    ball1.velocity = vA;
    ball2.velocity = vB;
}

export function cueBallCollision(cue: PoolCue, ball: PoolBall) {
    //TODO
}