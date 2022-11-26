import PoolBall from "./PoolObjects/PoolBall";
import PoolCue from "./PoolObjects/PoolCue";
import { vector, scale, magnitude, subtractVectors, unitVector, angleBetween, addVectors, crossProduct } from "./Vector";

const BALL_MASS = 0.16726 // kg
const BALL_BALL_RESTITUTION: number = 0.96
const BALL_RADIUS = 0.028575; // m
const BALL_MOMENT_OF_INERTIA = (2 / 5) * BALL_MASS * (BALL_RADIUS ** 2);
const BALL_BALL_FRICTION = 0.1; // tentative
const CUE_MASS = 0.53864 // kg
const CUE_TIP_BALL_FRICTION = 0.6;
const CUE_TIP_BALL_RESTITUTION = 0.75;
const CUSHION_HEIGHT = BALL_RADIUS * 1.2;
const BALL_SLATE_RESTITUTION = 0.5; // tentative

export function ballBallCollisionWithFriction(ball1: PoolBall, ball2: PoolBall) {
    // v0 is the velocity vector of ball 1 as it's approaching. We multiply by the coeff of restitution for ball-ball collision to account for the small
    // loss of energy that occurs as a resalut of the collision
    var ball1InitialVelocity: vector = scale(ball1.velocity, BALL_BALL_RESTITUTION);
    var ball1InitialAngularVelocity: vector = scale(ball1.angularVelocity, BALL_BALL_RESTITUTION);
    const ball2IsMoving: boolean = magnitude(ball2.velocity) > 0;
    const ball2IsSpinning: boolean = magnitude(ball2.angularVelocity) > 0;
    // If ball 2 isn't actually stationary, change the frame of reference to pretend like it is by subtracting the velocity vector of the
    // "stationary" ball 2 from the moving ball 1
    if (ball2IsMoving) {
        ball1InitialVelocity = subtractVectors(ball1InitialVelocity, ball2.velocity);
    }
    if (ball2IsSpinning) {
        ball1InitialAngularVelocity = subtractVectors(ball1InitialAngularVelocity, ball2.angularVelocity);
    }
    const normalUnitVector: vector = unitVector(subtractVectors(ball2.position, ball1.position));
    // theta is the angle between the normal vector and initial cue velocity vector
    const theta: number = angleBetween(normalUnitVector, ball1InitialVelocity);
    // phi is the angle between the normal vector and final ball velocity vector
    // Vf2 = u*VN2*sin(theta)*normalFrictionDirection + u*Vtan*angularFrictionDirection + VN2*normalDirection
    // VN2 = Vi1 * cos(theta)
    // Vtan = ball1InitialAngularVelocity x r
    const frictionUnitVector: vector = unitVector(crossProduct(normalUnitVector, crossProduct(ball1InitialVelocity, normalUnitVector)));
    // Vtan should already be in the angular friction direction
    const tangentVelocityVector: vector = scale(crossProduct(ball1InitialAngularVelocity, scale(normalUnitVector, BALL_RADIUS)), BALL_BALL_FRICTION);
    const normalVelocityVector: vector = scale(normalUnitVector, magnitude(scale(ball1InitialVelocity, Math.cos(theta))));
    const frictionVelocityVector: vector = scale(frictionUnitVector, magnitude(normalVelocityVector) * BALL_BALL_FRICTION * Math.sin(theta));
    var ball2FinalVelocity: vector = addVectors(normalVelocityVector, addVectors(tangentVelocityVector, frictionVelocityVector));
    var ball1FinalVelocity: vector = subtractVectors(ball1InitialVelocity, ball2FinalVelocity);
    // wAi * I + 0 = wAf * I + mb(rB x vBf)
    // wAf = wAi - mb(rB x vBf) / I
    // 0 + mb(rA x vAi) = wBf * I + mb(rA x vAf)
    // wBf = (mb(rA x vAi) - mb(rA x vAf)) / I
    var ball1FinalAngularVelocity = subtractVectors(
        ball1InitialAngularVelocity,
        scale(crossProduct(subtractVectors(ball1.position, ball2.position), ball2FinalVelocity), BALL_MASS / BALL_MOMENT_OF_INERTIA)
    );
    var ball2FinalAngularVelocity = scale(
        subtractVectors(
            crossProduct(subtractVectors(ball2.position, ball1.position), ball1InitialVelocity),
            crossProduct(subtractVectors(ball2.position, ball1.position), ball1FinalVelocity)
        ),
        BALL_MASS / BALL_MOMENT_OF_INERTIA
    );
    // restore frame of reference if need be
    if (ball2IsMoving) {
        ball1FinalVelocity = addVectors(ball1FinalVelocity, ball2.velocity);
        ball2FinalVelocity = addVectors(ball2FinalVelocity, ball2.velocity);
    }
    if (ball2IsSpinning) {
        ball1FinalAngularVelocity = addVectors(ball1FinalAngularVelocity, ball2.angularVelocity);
        ball2FinalAngularVelocity = addVectors(ball2FinalAngularVelocity, ball2.angularVelocity);
    }
    ball1.velocity = ball1FinalVelocity;
    ball2.velocity = ball2FinalVelocity;
    ball1.angularVelocity = ball1FinalAngularVelocity;
    ball2.angularVelocity = ball2FinalAngularVelocity;
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
    var vB: vector = unitVector(subtractVectors(ball2.position, ball1.position));
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
    // We multiply the initial velocity by the coefficient of restition to account for some of the
    // energy loss that occurs, and then treat the rest of the collision as elastic
    const cueInitialVelocity: vector = scale(cue.velocity, CUE_TIP_BALL_RESTITUTION);
    // the normal vector is just the vector from the point of contact to the center of mass
    const normalVector: vector = subtractVectors(ball.position, cue.position);
    const normalUnitVector: vector = unitVector(normalVector);
    // theta is the angle between the normal vector and initial cue velocity vector
    const theta: number = angleBetween(normalUnitVector, cueInitialVelocity);
    // phi is the angle between the normal vector and final ball velocity vector
    const phi: number = Math.atan(1 / (CUE_TIP_BALL_FRICTION * Math.sin(theta)));
    // alpha is the angle between the final ball velocity vector and the initial cue velocity vector
    const alpha: number = theta - phi;
    const ballVelocityMagnitude: number = 2 * magnitude(cueInitialVelocity) * Math.cos(alpha) / (1 + BALL_MASS / CUE_MASS);
    // find the direction of the friction vector using cross products, adjusted to be a proportion of the normal unit vector based on sin(theta) and the friction coeff
    const adjustedFrictionDirectionVector: vector = 
    scale(crossProduct(normalUnitVector, crossProduct(unitVector(cueInitialVelocity), normalUnitVector)), CUE_TIP_BALL_FRICTION);
    const ballVelocityDirection: vector = unitVector(addVectors(normalUnitVector, adjustedFrictionDirectionVector));
    const ballFinalVelocity: vector = scale(ballVelocityDirection, ballVelocityMagnitude);
    // conservation of linear momentum to find the cue's final velocity vector:
    const cueFinalVelocity: vector = subtractVectors(cueInitialVelocity, scale(ballFinalVelocity, BALL_MASS / CUE_MASS));
    // conservation of angular momentum to find the resulting angular velocity on the ball:
    ball.angularVelocity = scale(
        subtractVectors(
            scale(crossProduct(normalVector, cueInitialVelocity), CUE_MASS),
            scale(crossProduct(normalVector, cueFinalVelocity), CUE_MASS)
        ),
        1 / BALL_MOMENT_OF_INERTIA
    );
    ball.velocity = ballFinalVelocity;
}

export function cushionBallCollision(ball: PoolBall, flipAxes: boolean) {
    var vx: number = flipAxes ? ball.velocity.y : ball.velocity.x;
    var vy: number = flipAxes ? ball.velocity.x : ball.velocity.y;
    var vz: number = ball.velocity.z;
    var wx: number = flipAxes ? ball.angularVelocity.y : ball.angularVelocity.x;
    var wy: number = flipAxes ? ball.angularVelocity.x : ball.angularVelocity.y;
    var wz: number = ball.angularVelocity.z;
    const theta: number = Math.asin((CUSHION_HEIGHT - BALL_RADIUS) / BALL_RADIUS);
    const phi: number = angleBetween({x: 1, y: 0, z: 0}, {x: vx, y: vy, z: 0})
    const ballRailFriction = 0.471 - 0.241 * theta;
    const sx: number = vx * Math.sin(theta) - vy * Math.cos(theta) + BALL_RADIUS * wy;
    const sy: number = -vy - BALL_RADIUS * wz * Math.cos(theta) + BALL_RADIUS * wx * Math.sin(theta);
    var c: number = vx * Math.cos(theta);
    const PzE: number = BALL_MASS * c * (1 + Math.E);
    const PzS: number = (2 * BALL_MASS / 7) * Math.sqrt(sx ** 2 + sy ** 2);
    if (PzS <= PzE) {
        vx = -2 / 7 * sx * Math.sin(theta) - (1 + Math.E) * c * Math.cos(theta);
        vy = 2 / 7 * sy;
        vz = 2 / 7 * sx * Math.cos(theta) - (1 + Math.E) * c * Math.sin(theta);
    } else {
        vx = -c * (1 + Math.E) * (ballRailFriction * Math.cos(phi) * Math.sin(theta) + Math.cos(theta));
        vy = c * (1 + Math.E) * ballRailFriction * Math.sin(phi);
        vz = c * (1 + Math.E) * (ballRailFriction * Math.cos(phi) * Math.cos(theta) - Math.sin(theta));
    }
    c = BALL_MASS * BALL_RADIUS / BALL_MOMENT_OF_INERTIA;
    wx = -c * vy * Math.sin(theta);
    wy = c * (vx * Math.sin(theta) - vz * Math.cos(theta));
    wz = c * vy * Math.cos(theta);
    ball.velocity.x = flipAxes ? vy : vx;
    ball.velocity.y = flipAxes ? vx : vy;
    ball.velocity.z = vz;
    ball.angularVelocity.x = flipAxes ? wy : wx;
    ball.angularVelocity.y = flipAxes ? wx : wy;
    ball.angularVelocity.z = wz;
}

export function ballSlateCollision(ball: PoolBall) {
    var newZVelocity = -ball.velocity.z * BALL_SLATE_RESTITUTION;
    if (Math.abs(newZVelocity) < 0.01) {
        newZVelocity = 0;
        ball.isAirborne = false;
    }
    ball.velocity = {x: ball.velocity.x, y: ball.velocity.y, z: newZVelocity};
    // TODO: see how angular velocity/friction affect this collision to adjust x and y velocities as necessary 
}