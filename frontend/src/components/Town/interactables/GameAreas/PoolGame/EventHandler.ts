import { eigs, MathCollection } from 'mathjs';
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
  timeUntil: number;
  eventType: EventType;
  participants: (PoolBall | PoolPocket | CushionPlane)[];
};

export function realPositiveRoots(coeffs: number[]): number[] {
  const lastCoeff: number = coeffs[coeffs.length - 1];
  if (lastCoeff !== 1) {
    coeffs = coeffs.map(num => num / lastCoeff);
  }
  const companionMatrix: number[][] = [];
  for (let ii = 0; ii < coeffs.length - 1; ++ii) {
    companionMatrix[ii] = [];
    for (let jj = 0; jj < coeffs.length - 1; ++jj) {
      if ((ii = coeffs.length - 2)) {
        companionMatrix[ii][jj] = -coeffs[jj];
      } else if (jj - 1 === ii) {
        companionMatrix[ii][jj] = 1;
      } else {
        companionMatrix[ii][jj] = 0;
      }
    }
  }
  const relevantRoots: number[] = [];
  try {
    const allRoots: MathCollection = eigs(companionMatrix).values;
    allRoots.forEach(root => {
      if (math.typeOf(root) !== 'Complex' && root >= 0) {
        relevantRoots.push(root);
      }
    });
  } catch (err) {
    // do nothing
  }
  return relevantRoots;
}

export function smallestRealPositiveRoot(coeffs: number[]): number {
  // return the smallest of the roots, if there are no positive real roots then return infinity
  return coeffs.length > 0 ? Math.min(...realPositiveRoots(coeffs)) : Number.POSITIVE_INFINITY;
}

export function ballBallCollisionTime(ball1: PoolBall, ball2: PoolBall) {
  // check conditions that would immediately make it impossible for ball1 to collide with ball2, and return POSITIVE_INFINITY if they are met
  if (
    (ball1.velocity.x > 0 && ball1.position.x > ball2.position.x + 2 * BALL_RADIUS) ||
    (ball1.velocity.x < 0 && ball1.position.x < ball2.position.x - 2 * BALL_RADIUS) ||
    (ball1.velocity.y > 0 && ball1.position.y > ball2.position.y + 2 * BALL_RADIUS) ||
    (ball1.velocity.y < 0 && ball1.position.y < ball2.position.y - 2 * BALL_RADIUS)
  ) {
    return Number.POSITIVE_INFINITY;
  }
  // In order to process this, we need a matrix containing the coefficients in the position equations of the balls
  const ball1AccelerationCoeff: Vector = scale(ball1.acceleration, 0.5);
  const ball2AccelerationCoeff: Vector = scale(ball2.acceleration, 0.5);
  const ax: number = ball2AccelerationCoeff.x - ball1AccelerationCoeff.x;
  const ay: number = ball2AccelerationCoeff.y - ball1AccelerationCoeff.y;
  const az: number = ball2AccelerationCoeff.z - ball1AccelerationCoeff.z;
  const bx: number = ball2.velocity.x - ball1.velocity.x;
  const by: number = ball2.velocity.y - ball1.velocity.y;
  const bz: number = ball2.velocity.z - ball1.velocity.z;
  const cx: number = ball2.position.x - ball1.position.x;
  const cy: number = ball2.position.y - ball1.position.y;
  const cz: number = ball2.position.z - ball1.position.z;
  return smallestRealPositiveRoot([
    cx ** 2 + cy ** 2 + cz ** 2 - 4 * BALL_RADIUS ** 2,
    2 * bx * cx + 2 * by * cy + 2 * bz * cz,
    bx ** 2 + by ** 2 + bz ** 2 + 2 * ax * cx + 2 * ay * cy + 2 * az * cz,
    2 * ax * bx + 2 * ay * by + 2 * az * bz,
    ax ** 2 + ay ** 2 + az ** 2,
  ]);
}

export function ballCushionCollisionTime(ball: PoolBall, cushion: CushionPlane): number {
  // Immediately return POSITIVE_INFINITY on an impossible collision condition
  if (
    (ball.velocity.x > 0 &&
      ball.position.x > Math.max(cushion.point1.x, cushion.point2.x) + BALL_RADIUS) ||
    (ball.velocity.x < 0 &&
      ball.position.x < Math.min(cushion.point1.x, cushion.point2.x) - BALL_RADIUS) ||
    (ball.velocity.y > 0 &&
      ball.position.y > Math.max(cushion.point1.y, cushion.point2.y) + BALL_RADIUS) ||
    (ball.velocity.y < 0 &&
      ball.position.y < Math.min(cushion.point1.y, cushion.point2.y) - BALL_RADIUS)
  ) {
    return Number.POSITIVE_INFINITY;
  }
  const accelerationCoeff: Vector = scale(ball.acceleration, 0.5);
  const lx: number = -(cushion.point2.y - cushion.point1.y) / (cushion.point2.x - cushion.point1.x);
  const ly = 1;
  const l0: number = -lx * cushion.point1.x - cushion.point1.y;
  const a: number = lx * accelerationCoeff.x + ly * accelerationCoeff.y;
  const b: number = lx * ball.velocity.x + ly * ball.velocity.y;
  let c: number =
    l0 + lx * ball.position.x + ly * ball.position.y + BALL_RADIUS * Math.sqrt(lx ** 2 + ly ** 2);
  const min1: number = smallestRealPositiveRoot([c, b, a]);
  c = l0 + lx * ball.position.x + ly * ball.position.y - BALL_RADIUS * Math.sqrt(lx ** 2 + ly ** 2);
  const min2: number = smallestRealPositiveRoot([c, b, a]);
  return Math.min(min1, min2);
}

export function ballPocketCollisionTime(ball: PoolBall, pocket: PoolPocket) {
  // if it's obviously impossible for the ball to go in the pocket, return POSITIVE_INFINITY
  if (
    (ball.velocity.x > 0 && ball.position.x > pocket.position.x + pocket.radius) ||
    (ball.velocity.x < 0 && ball.position.x < pocket.position.x - 2 * pocket.radius) ||
    (ball.velocity.y > 0 && ball.position.y > pocket.position.y + 2 * pocket.radius) ||
    (ball.velocity.y < 0 && ball.position.y < pocket.position.y - 2 * pocket.radius)
  ) {
    return Number.POSITIVE_INFINITY;
  }
  const accelerationCoeff: Vector = scale(ball.acceleration, 0.5);
  const xAcceleration: number = accelerationCoeff.x;
  const yAcceleration: number = accelerationCoeff.y;
  const a: number = 0.5 * (xAcceleration ** 2 + yAcceleration ** 2);
  const b: number = xAcceleration * ball.velocity.x + yAcceleration * ball.velocity.y;
  const c: number =
    xAcceleration * (ball.position.x - pocket.position.x) +
    yAcceleration * (ball.position.y - pocket.position.y) +
    0.5 * (ball.velocity.x ** 2 + ball.velocity.y ** 2);
  const d: number =
    ball.velocity.x * (ball.position.x - pocket.position.x) +
    ball.velocity.y * (ball.position.y - pocket.position.y);
  const e: number =
    0.5 *
      (pocket.position.x ** 2 +
        pocket.position.y ** 2 +
        ball.position.x ** 2 +
        ball.position.y ** 2 -
        pocket.radius ** 2) -
    (ball.position.x * pocket.position.x + ball.position.y * pocket.position.y);
  const roots: number[] = realPositiveRoots([e, d, c, b, a]);
  const pocketHeight: number = (7 / 5) * pocket.radius - BALL_RADIUS;
  // store the original state of the ball
  const originalBall: PoolBallModel = ball.toModel();
  // check which of the roots does not exceed the pocket height, if any
  for (let ii = 0; ii < roots.length; ++ii) {
    ball.evolveByTime(roots[ii]);
    if (ball.position.z <= pocketHeight) {
      // restore the ball to its original state
      ball = PoolBall.fromModel(originalBall);
      // we can return immediately, roots should be in ascending order
      return roots[ii];
    }
    // restore the ball to its original state
    ball = PoolBall.fromModel(originalBall);
  }
  // If no roots work, return POSITIVE_INFINITY
  return Number.POSITIVE_INFINITY;
}

export function spinningToStationaryTime(ball: PoolBall): number {
  return (
    (ball.angularVelocity.z * 2 * BALL_RADIUS) / (5 * SPINNING_FRICTION * GRAVITATIONAL_CONSTANT)
  );
}

export function rollingToStationaryTime(ball: PoolBall): number {
  return magnitude(ball.velocity) / (ROLLING_FRICTION * GRAVITATIONAL_CONSTANT);
}

export function slidingToRollingTime(ball: PoolBall): number {
  return (2 * magnitude(ball.relativeVelocity())) / (7 * SLIDING_FRICTION * GRAVITATIONAL_CONSTANT);
}

export function ballToSlateTime(ball: PoolBall) {
  if (ball.stateOfMotion === MotionState.Airborne) {
    return (
      (ball.velocity.z +
        Math.sqrt(ball.velocity.z ** 2 + 2 * GRAVITATIONAL_CONSTANT * ball.position.z)) /
      GRAVITATIONAL_CONSTANT
    );
  }
  return Number.POSITIVE_INFINITY;
}

export function timeUntilNextEvent(balls: PoolBall[]): TimedEvent {
  const nextEvent: TimedEvent = {
    timeUntil: Number.POSITIVE_INFINITY,
    eventType: EventType.Rest,
    participants: [],
  };
  balls
    .filter(ball => {
      return ball.stateOfMotion !== MotionState.Stationary;
    })
    .forEach(ball => {
      let timeTaken = 0;
      if (ball.stateOfMotion === MotionState.Spinning) {
        timeTaken = spinningToStationaryTime(ball);
        if (timeTaken < nextEvent.timeUntil) {
          nextEvent.timeUntil = timeTaken;
          nextEvent.eventType = EventType.SpinningToStationary;
          nextEvent.participants = [ball];
        }
      } else {
        if (ball.stateOfMotion === MotionState.Rolling) {
          timeTaken = rollingToStationaryTime(ball);
          if (timeTaken < nextEvent.timeUntil) {
            nextEvent.timeUntil = timeTaken;
            nextEvent.eventType = EventType.RollingToStationary;
            nextEvent.participants = [ball];
          }
        }
        if (ball.stateOfMotion === MotionState.Sliding) {
          timeTaken = slidingToRollingTime(ball);
          if (timeTaken < nextEvent.timeUntil) {
            nextEvent.timeUntil = timeTaken;
            nextEvent.eventType = EventType.SlidingToRolling;
            nextEvent.participants = [ball];
          }
        }
        if (ball.stateOfMotion === MotionState.Airborne) {
          timeTaken = ballToSlateTime(ball);
          if (timeTaken < nextEvent.timeUntil) {
            nextEvent.timeUntil = timeTaken;
            nextEvent.eventType = EventType.BallToSlate;
            nextEvent.participants = [ball];
          }
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
    });
  return nextEvent;
}
