import { eigs, MathCollection, typeOf } from 'mathjs'
import PoolBall, { MotionState } from './PoolObjects/PoolBall';
import { magnitude, scale, Vector } from './Vector';
import { CushionPlane, PoolPocket, CUSHIONS, POCKETS } from './PoolObjects/PoolTable';
import { PoolBall as PoolBallModel } from '../../../../../types/CoveyTownSocket';
import math from 'mathjs';

const BALL_RADIUS = 0.028575; // m
const SPINNING_FRICTION = 0.4444 * BALL_RADIUS;
const ROLLING_FRICTION = 0.01;
const SLIDING_FRICTION = 0.4; // tentative
const GRAVITATIONAL_CONSTANT = 9.8; // m/s^2

export enum EventType {
    SpinningToStationary = 'SpinningToStationary',
    RollingToStationary = 'RollingToStationary',
    SlidingToRolling = 'SlidingToRolling',
    BallToSlate = 'BallToSlate',
    BallToBall = 'BallToBall',
    BallToCushion = 'BallToCushion',
    BallToPocket = 'BallToPocket',
    Rest = 'Rest',
}

export type TimedEvent = {
    timeUntil: number,
    eventType: EventType,
    participants: (PoolBall | PoolPocket | CushionPlane)[],
}

export function timeUntilNextEvent(balls: PoolBall[]): TimedEvent {
    let nextEvent: TimedEvent = {
        timeUntil: Number.POSITIVE_INFINITY,
        eventType: EventType.Rest,
        participants: [],
    }
    balls.forEach(ball => {
        if (ball.stateOfMotion !== MotionState.Stationary) {
            let timeTaken: number = spinningToStationaryTime(ball);
            if (timeTaken < nextEvent.timeUntil) {
                nextEvent.timeUntil = timeTaken;
                nextEvent.eventType = EventType.SpinningToStationary;
                nextEvent.participants = [ball];
            }
            if (ball.stateOfMotion !== MotionState.Spinning) {
                timeTaken = rollingToStationaryTime(ball);
                if (timeTaken < nextEvent.timeUntil) {
                    nextEvent.timeUntil = timeTaken;
                    nextEvent.eventType = EventType.RollingToStationary;
                    nextEvent.participants = [ball];
                }
                timeTaken = slidingToRollingTime(ball);
                if (timeTaken < nextEvent.timeUntil) {
                    nextEvent.timeUntil = timeTaken;
                    nextEvent.eventType = EventType.SlidingToRolling;
                    nextEvent.participants = [ball];
                }
                timeTaken = ballToSlateTime(ball);
                if (timeTaken < nextEvent.timeUntil) {
                    nextEvent.timeUntil = timeTaken;
                    nextEvent.eventType = EventType.BallToSlate;
                    nextEvent.participants = [ball];
                }
                balls.forEach(ball2 => {
                    timeTaken = ballBallCollisionTime(ball, ball2);
                    if (timeTaken < nextEvent.timeUntil) {
                        nextEvent.timeUntil = timeTaken;
                        nextEvent.eventType = EventType.BallToBall;
                        nextEvent.participants = [ball, ball2];
                    }
                });
                CUSHIONS.forEach(cushion => {
                    timeTaken = ballCushionCollisionTime(ball, cushion);
                    if (timeTaken < nextEvent.timeUntil) {
                        nextEvent.timeUntil = timeTaken;
                        nextEvent.eventType = EventType.BallToCushion;
                        nextEvent.participants = [ball, cushion];
                    }
                });
                POCKETS.forEach(pocket => {
                    timeTaken = ballPocketCollisionTime(ball, pocket);
                    if (timeTaken < nextEvent.timeUntil) {
                        nextEvent.timeUntil = timeTaken;
                        nextEvent.eventType = EventType.BallToPocket;
                        nextEvent.participants = [ball, pocket];
                    }
                });
            }
        }
    });
    return nextEvent;
}

export function spinningToStationaryTime(ball: PoolBall): number {
    return ball.angularVelocity.z * 2 * BALL_RADIUS / (5 * SPINNING_FRICTION * GRAVITATIONAL_CONSTANT);
}

export function rollingToStationaryTime(ball: PoolBall): number {
    return magnitude(ball.velocity) / (ROLLING_FRICTION * GRAVITATIONAL_CONSTANT);
}

export function slidingToRollingTime(ball: PoolBall): number {
    return 2 * magnitude(ball.relativeVelocity()) / (7 * SLIDING_FRICTION * GRAVITATIONAL_CONSTANT);
}

export function ballToSlateTime(ball: PoolBall) {
    if (ball.stateOfMotion === MotionState.Airborne) {
        return (
            (ball.velocity.z +
            Math.sqrt(
                ball.velocity.z ** 2 +
                2 * GRAVITATIONAL_CONSTANT * ball.position.z
            )
            ) / GRAVITATIONAL_CONSTANT
        )
    }
    return Number.POSITIVE_INFINITY;
}

export function ballBallCollisionTime(ball1: PoolBall, ball2: PoolBall) {
    // check conditions that would immediately make it impossible for ball1 to collide with ball2, and return POSITIVE_INFINITY if they are met
    if (
        ball1.velocity.x > 0 && ball1.position.x > ball2.position.x + 2 * BALL_RADIUS ||
        ball1.velocity.x < 0 && ball1.position.x < ball2.position.x - 2 * BALL_RADIUS ||
        ball1.velocity.y > 0 && ball1.position.y > ball2.position.y + 2 * BALL_RADIUS ||
        ball1.velocity.y < 0 && ball1.position.y < ball2.position.y - 2 * BALL_RADIUS
    ) {
        return Number.POSITIVE_INFINITY;
    }
    // In order to process this, we need a matrix containing the coefficients in the position equations of the balls
    const ball1AccelerationCoeff: Vector = scale(ball1.acceleration, 0.5);
    const ball2AccelerationCoeff: Vector = scale(ball2.acceleration, 0.5);
    const Ax: number = ball2AccelerationCoeff.x - ball1AccelerationCoeff.x;
    const Ay: number = ball2AccelerationCoeff.y - ball1AccelerationCoeff.y;
    const Az: number = ball2AccelerationCoeff.z - ball1AccelerationCoeff.z;
    const Bx: number = ball2.velocity.x - ball1.velocity.x;
    const By: number = ball2.velocity.y - ball1.velocity.y;
    const Bz: number = ball2.velocity.z - ball1.velocity.z;
    const Cx: number = ball2.position.x - ball1.position.x;
    const Cy: number = ball2.position.y - ball1.position.y;
    const Cz: number = ball2.position.z - ball1.position.z;
    return smallestRealPositiveRoot(
        [Cx ** 2 + Cy ** 2 + Cz ** 2 - 4 * BALL_RADIUS ** 2,
        2 * Bx * Cx + 2 * By * Cy + 2 * Bz * Cz,
        Bx ** 2 + By ** 2 + Bz ** 2 + 2 * Ax * Cx + 2 * Ay * Cy + 2 * Az * Cz,
        2 * Ax * Bx + 2 * Ay * By + 2 * Az * Bz,
        Ax ** 2 + Ay ** 2 + Az ** 2]
    )
}

export function ballCushionCollisionTime(ball: PoolBall, cushion: CushionPlane): number {
    // Immediately return POSITIVE_INFINITY on an impossible collision condition
    if (
        ball.velocity.x > 0 && ball.position.x > Math.max(cushion.point1.x, cushion.point2.x) + BALL_RADIUS ||
        ball.velocity.x < 0 && ball.position.x < Math.min(cushion.point1.x, cushion.point2.x) - BALL_RADIUS ||
        ball.velocity.y > 0 && ball.position.y > Math.max(cushion.point1.y, cushion.point2.y) + BALL_RADIUS ||
        ball.velocity.y < 0 && ball.position.y < Math.min(cushion.point1.y, cushion.point2.y) - BALL_RADIUS
    ) {
        return Number.POSITIVE_INFINITY;
    }
    const accelerationCoeff: Vector = scale(ball.acceleration, 0.5);
    const lx: number = -(cushion.point2.y - cushion.point1.y) / (cushion.point2.x - cushion.point1.x);
    const ly: number = 1;
    const l0: number = -lx * cushion.point1.x - cushion.point1.y;
    const A: number = lx * accelerationCoeff.x + ly * accelerationCoeff.y;
    const B: number = lx * ball.velocity.x + ly * ball.velocity.y;
    let C: number = l0 +
        lx * ball.position.x +
        ly * ball.position.y +
        BALL_RADIUS * Math.sqrt(lx ** 2 + ly ** 2);
    const min1: number = smallestRealPositiveRoot([C, B, A]);
    C = l0 +
        lx * ball.position.x +
        ly * ball.position.y -
        BALL_RADIUS * Math.sqrt(lx ** 2 + ly ** 2);
    const min2: number = smallestRealPositiveRoot([C, B, A]);
    return Math.min(min1, min2);
}

export function ballPocketCollisionTime(ball: PoolBall, pocket: PoolPocket) {
    // if it's obviously impossible for the ball to go in the pocket, return POSITIVE_INFINITY
    if (
        ball.velocity.x > 0 && ball.position.x > pocket.position.x + pocket.radius ||
        ball.velocity.x < 0 && ball.position.x < pocket.position.x - 2 * pocket.radius ||
        ball.velocity.y > 0 && ball.position.y > pocket.position.y + 2 * pocket.radius ||
        ball.velocity.y < 0 && ball.position.y < pocket.position.y - 2 * pocket.radius
    ) {
        return Number.POSITIVE_INFINITY;
    }
    const accelerationCoeff: Vector = scale(ball.acceleration, 0.5);
    const xAcceleration: number = accelerationCoeff.x
    const yAcceleration: number = accelerationCoeff.y
    const A: number = 0.5 * (xAcceleration ** 2 + yAcceleration ** 2);
    const B: number = xAcceleration * ball.velocity.x + yAcceleration * ball.velocity.y;
    const C: number = xAcceleration * (ball.position.x - pocket.position.x) +
                      yAcceleration * (ball.position.y - pocket.position.y) +
                      0.5 * (ball.velocity.x ** 2 + ball.velocity.y ** 2);
    const D: number = ball.velocity.x * (ball.position.x - pocket.position.x) +
                      ball.velocity.y * (ball.position.y - pocket.position.y);
    const E: number = 0.5 * (pocket.position.x ** 2 +
                        pocket.position.y ** 2 +
                        ball.position.x ** 2 +
                        ball.position.y ** 2 -
                        pocket.radius ** 2) -
                      (ball.position.x * pocket.position.x +
                        ball.position.y * pocket.position.y);
    const roots: number[] = realPositiveRoots([E, D, C, B, A]);
    const pocketHeight: number = (7 / 5) * pocket.radius - BALL_RADIUS;
    // store the original state of the ball
    let originalBall: PoolBallModel = ball.toModel();
    // check which of the roots does not exceed the pocket height, if any
    for (let ii = 0; ii < roots.length; ++ii) {
        ball.evolveByTime(roots[ii]);
        if (ball.position.z <= pocketHeight) {
            // restore the ball to its original state
            ball.fromModel(originalBall);
            // we can return immediately, roots should be in ascending order
            return roots[ii];
        }
        // restore the ball to its original state
        ball.fromModel(originalBall);
    }
    // If no roots work, return POSITIVE_INFINITY
    return Number.POSITIVE_INFINITY;
}

export function smallestRealPositiveRoot(coeffs: number[]): number {
    // return the smallest of the roots, if there are no positive real roots then return infinity
    return coeffs.length > 0 ? Math.min(...realPositiveRoots(coeffs)) : Number.POSITIVE_INFINITY;
}

export function realPositiveRoots(coeffs: number[]): number[] {
    const lastCoeff: number = coeffs[coeffs.length - 1];
    if (lastCoeff !== 1) {
        coeffs = coeffs.map(num => num / lastCoeff);
    }
    const companionMatrix: number[][] = [];
    for (let ii = 0; ii < coeffs.length - 1; ++ii) {
        companionMatrix[ii] = [];
        for (let jj = 0; jj < coeffs.length - 1; ++jj) {
            if (ii = coeffs.length - 2) {
                companionMatrix[ii][jj] = -coeffs[jj];
            } else if (jj - 1 === ii) {
                companionMatrix[ii][jj] = 1;
            } else {
                companionMatrix[ii][jj] = 0;
            }
        }
    }
  let realPositiveRoots: number[] = [];
  try {
    const roots: MathCollection = eigs(companionMatrix).values;
    roots.forEach(root => {
        if (math.typeOf(root) !== 'Complex' && root >= 0) {
            realPositiveRoots.push(root);
        }
    });
  } catch(err) {
    // do nothing
  }
  return realPositiveRoots;
}