import PoolCue from "./PoolCue";
import { addVectors, angleBetween, crossProduct, magnitude, parallelUnitVector, scale, subtractVectors, vector } from "./Vector";

const BALL_MASS = 0.16726 // kg
const BALL_CLOTH_ANGULAR_DECELERATION_RATE: number = 10; //rad/s^2
const BALL_CLOTH_ROLLING_FRICTION: number = 0.01;
const BALL_BALL_RESTITUTION: number = 0.96
const GRAVITATIONAL_CONSTANT = 9.8; // m/s^2
const BALL_RADIUS = 0.028575; // m
const BALL_MOMENT_OF_INERTIA = (2 / 5) * BALL_MASS * (BALL_RADIUS ** 2);
const CUE_TIP_CONTACT_TIME = 0.0015 // s
const CUE_TIP_BALL_FRICTION = 0.6;
const CUE_TIP_BALL_RESTITUTION = 0.75;

export default class PoolBall {
    private _angularVelocity: vector;
    private _position: vector;
    private _velocity: vector;

    constructor(xPosition: number, yPosition: number) {
        this._angularVelocity = {x: 0, y: 0, z: 0};
        this._position = {x: xPosition, y: yPosition, z: BALL_RADIUS};
        this._velocity = {x: 0, y: 0, z: 0};
    }

    get angularVelocity() {
        return this._angularVelocity;
    }

    set angularVelocity(v: vector) {
        this._angularVelocity = v;
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

    get mass(): number {
        return BALL_MASS;
    }

    private _updateSpinningBall(elapsedTime: number) {
        this._angularVelocity.z = this._angularVelocity.z - elapsedTime * BALL_CLOTH_ANGULAR_DECELERATION_RATE;
    }

    private _updateRollingBall(elapsedTime: number) {
        const oldVelocityMagnitude = magnitude(this.velocity);
        var newVelocityMagnitude = oldVelocityMagnitude - BALL_CLOTH_ROLLING_FRICTION * GRAVITATIONAL_CONSTANT * elapsedTime;
        if (newVelocityMagnitude < 0.001) {newVelocityMagnitude = 0};
        const scalar = newVelocityMagnitude / oldVelocityMagnitude;
        this._velocity = scale(this.velocity, scalar);
        this._position.x += + this._velocity.x * elapsedTime;
        this._position.y += + this._velocity.y * elapsedTime;
        this._angularVelocity.y = this._velocity.x / BALL_RADIUS;
        this._angularVelocity.x = this._velocity.y / BALL_RADIUS;
        this._updateSpinningBall(elapsedTime);
    }
}

export function ballBallCollision(ball1: PoolBall, ball2: PoolBall) {
    // v0 is the velocity vector of ball 1 as it's approaching. We multiply by the coeff of restitution for ball-ball collision to account for the small
    // loss of energy that occurs as a resalut of the collision
    var v0: vector = scale(ball1.velocity, BALL_BALL_RESTITUTION);
    var ball2IsMoving = magnitude(ball2.velocity) > 0;
    // If ball 2 isn't actually stationary, change the frame of reference to pretend like it is by subtracting the velocity vector of the
    // "stationary" ball 2 from the moving ball 1
    if (ball2IsMoving) {
        v0 = subtractVectors(v0, ball2.velocity);
    }
    // vB is the vector indicating the direction ball 2 will go, represented by the vector connecting the balls' midpoints. 
    // Right now only the direction is important, so we can use the unit vector parallel to the real vB vector.
    var vB: vector = parallelUnitVector(subtractVectors(ball2.position, ball1.position));
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
    // This is mostly the same as a ball-ball collision with a stationary second ball:
    var cueVelocityVector: vector = scale(cue.velocity, CUE_TIP_BALL_RESTITUTION);
    // the radius vector is just the vector from the point of contact to the center of mass
    const radiusVector: vector = subtractVectors(ball.position, cue.position);
    var normalVelocityVector: vector = parallelUnitVector(radiusVector);
    const alpha: number = angleBetween(cueVelocityVector, normalVelocityVector);
    // we multiply by the restituion coefficient because the collision isn't perfectly elastic, this factor helps account for velocity loss
    // due to energy loss
    const vBMagnitude = 2 * magnitude(cueVelocityVector) * Math.cos(alpha) / (ball.mass / cue.mass + 1);
    normalVelocityVector = scale(normalVelocityVector, vBMagnitude);
    // This operates under the assumption that the normal force being imparted through the contact is consistent through the entire time, so we ignore the
    // change in time factor of the forces and assume the normal and frictional forces are applied uniformly through the same change in time for
    // simplicity's sake
    const frictionVelocityMagnitude: number = CUE_TIP_BALL_FRICTION * magnitude(normalVelocityVector);
    // To find the direction of the friction force exerted on the cue ball, we first take the cross product of the cue velocity vector and ball normal velocity
    // vectors to get a vector that is tangential to both; with that vector, we can then take the cross product of it and the ball normal velocity vector to
    // produce a vector that will be both tangential to the surface of the ball and in the same plane as the cue velocity vector
    // This vector is the unit vector just representing the direction of the friction:
    var frictionVelocityVector = parallelUnitVector(crossProduct(crossProduct(cueVelocityVector, normalVelocityVector), normalVelocityVector));
    frictionVelocityVector = scale(frictionVelocityVector, frictionVelocityMagnitude);
    // L = r x mv, where L is the angular momentum vector, r is the vector from the point of contact to the center of the ball, m is the mass, and v is the
    // velocity vector of the force causing the rotation
    const angularMomentumVector = crossProduct(radiusVector, scale(frictionVelocityVector, ball.mass));
    // L = Iw where I is the moment of intertia of the body and w is its angular velocity
    const angularVelocityVector = scale(angularMomentumVector, 1 / BALL_MOMENT_OF_INERTIA);
    // update the ball velocities
    ball.velocity = addVectors(normalVelocityVector, frictionVelocityVector);
    ball.angularVelocity = angularVelocityVector;
}