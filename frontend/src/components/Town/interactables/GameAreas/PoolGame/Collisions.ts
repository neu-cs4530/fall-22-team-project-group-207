import PoolBall from './PoolObjects/PoolBall';
import PoolCue from './PoolObjects/PoolCue';
import {
  Vector,
  scale,
  magnitude,
  subtractVectors,
  unitVector,
  angleBetween,
  addVectors,
  crossProduct,
} from './Vector';

const BALL_MASS = 0.16726; // kg
const BALL_BALL_RESTITUTION = 0.96;
const BALL_RADIUS = 0.028575; // m
const BALL_MOMENT_OF_INERTIA = (2 / 5) * BALL_MASS * BALL_RADIUS ** 2;
const BALL_BALL_FRICTION = 0.05;
const CUE_MASS = 0.53864; // kg
const CUE_TIP_BALL_FRICTION = 0.6;
const CUE_TIP_BALL_RESTITUTION = 0.75;
const CUSHION_HEIGHT = BALL_RADIUS * 0.2;
const BALL_SLATE_RESTITUTION = 0.5;

/**
 * Represents types of collisions used in our pool physics
 *
 * NOTE: these were tested manually since these calculations are much too complicated to test in a test file
 */
export function ballBallCollisionWithFriction(ball1: PoolBall, ball2: PoolBall) {
  // v0 is the velocity vector of ball 1 as it's approaching. We multiply by the coeff of restitution for ball-ball collision to account for the small
  // loss of energy that occurs as a resalut of the collision
  let ball1InitialVelocity: Vector = scale(ball1.velocity, BALL_BALL_RESTITUTION);
  let ball1InitialAngularVelocity: Vector = scale(ball1.angularVelocity, BALL_BALL_RESTITUTION);
  const ball2IsMoving: boolean = magnitude(ball2.velocity) > 0;
  const ball2IsSpinning: boolean = magnitude(ball2.angularVelocity) > 0;
  // If ball 2 isn't actually stationary, change the frame of reference to pretend like it is by subtracting the velocity vector of the
  // "stationary" ball 2 from the moving ball 1
  if (ball2IsMoving) {
    ball1InitialVelocity = subtractVectors(ball1InitialVelocity, ball2.velocity);
  }
  if (ball2IsSpinning) {
    ball1InitialAngularVelocity = subtractVectors(
      ball1InitialAngularVelocity,
      ball2.angularVelocity,
    );
  }
  const normalUnitVector: Vector = unitVector(subtractVectors(ball2.position, ball1.position));
  // theta is the angle between the normal vector and initial cue velocity vector
  const theta: number = angleBetween(normalUnitVector, ball1InitialVelocity);
  // phi is the angle between the normal vector and final ball velocity vector
  // Vf2 = u*VN2*sin(theta)*normalFrictionDirection + u*Vtan*angularFrictionDirection + VN2*normalDirection
  // VN2 = Vi1 * cos(theta)
  // Vtan = ball1InitialAngularVelocity x r
  const frictionUnitVector: Vector = unitVector(
    crossProduct(normalUnitVector, crossProduct(ball1InitialVelocity, normalUnitVector)),
  );
  // Vtan should already be in the angular friction direction
  const tangentVelocityVector: Vector = scale(
    crossProduct(ball1InitialAngularVelocity, scale(normalUnitVector, BALL_RADIUS)),
    BALL_BALL_FRICTION,
  );
  const normalVelocityVector: Vector = scale(
    normalUnitVector,
    magnitude(scale(ball1InitialVelocity, Math.cos(theta))),
  );
  const frictionVelocityVector: Vector = scale(
    frictionUnitVector,
    magnitude(normalVelocityVector) * BALL_BALL_FRICTION * Math.sin(theta),
  );
  let ball2FinalVelocity: Vector = addVectors(
    normalVelocityVector,
    addVectors(tangentVelocityVector, frictionVelocityVector),
  );
  let ball1FinalVelocity: Vector = subtractVectors(ball1InitialVelocity, ball2FinalVelocity);
  // wAi * I + 0 = wAf * I + mb(rB x vBf)
  // wAf = wAi - mb(rB x vBf) / I
  // 0 + mb(rA x vAi) = wBf * I + mb(rA x vAf)
  // wBf = (mb(rA x vAi) - mb(rA x vAf)) / I
  let ball1FinalAngularVelocity = subtractVectors(
    ball1InitialAngularVelocity,
    scale(
      crossProduct(subtractVectors(ball1.position, ball2.position), ball2FinalVelocity),
      BALL_MASS / BALL_MOMENT_OF_INERTIA,
    ),
  );
  let ball2FinalAngularVelocity = scale(
    subtractVectors(
      crossProduct(subtractVectors(ball2.position, ball1.position), ball1InitialVelocity),
      crossProduct(subtractVectors(ball2.position, ball1.position), ball1FinalVelocity),
    ),
    BALL_MASS / BALL_MOMENT_OF_INERTIA,
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
  let v0: Vector = scale(ball1.velocity, BALL_BALL_RESTITUTION);
  const ball2IsMoving = magnitude(ball2.velocity) > 0;
  // If ball 2 isn't actually stationary, change the frame of reference to pretend like it is by subtracting the velocity vector of the
  // "stationary" ball 2 from the moving ball 1
  if (ball2IsMoving) {
    v0 = subtractVectors(v0, ball2.velocity);
  }
  // vB is the vector indicating the direction ball 2 will go, represented by the vector connecting the balls' midpoints.
  // Right now only the direction is important, so we can use the unit vector parallel to the real vB vector.
  let vB: Vector = unitVector(subtractVectors(ball2.position, ball1.position));
  // Knowing the angle between the initial and final ball directions allows us to find how much each ball will lose its velocity
  const alpha: number = angleBetween(v0, vB);
  // If we consider the triangle formed between the initial velocity vector of ball 1 and the resulting velocity vector of ball 2,
  // with alpha as the angle between the 2 vectors and v0 as the hypotenuse: cos(alpha) = vB/v0, and therefore the magnitude of vB = v0 * cos(alpha)
  vB = scale(vB, magnitude(v0) * Math.cos(alpha));
  // Conservation of linear momentum tells us v0 = vA + vB as long as the collision is elastic, which I'm pretending is true. Therefore, we know vA = v0 - vB
  let vA: Vector = subtractVectors(v0, vB);
  // If we changed the frame of reference to make ball 2 stationary, we need to restore the frame of reference back to the table
  if (ball2IsMoving) {
    vA = addVectors(vA, ball2.velocity);
    vB = addVectors(vB, ball2.velocity);
  }
  // Friction and spin be damned.
  ball1.velocity = vA;
  ball2.velocity = vB;

  console.log('from collisions.txt');
  console.log(v0, vA, vB);
}

export function cueBallCollision(cue: PoolCue, ball: PoolBall) {
  console.log('cue ball collision from collision.ts');
  // We multiply the initial velocity by the coefficient of restition to account for some of the
  // energy loss that occurs, and then treat the rest of the collision as elastic
  const cueInitialVelocity: Vector = scale(cue.velocity, CUE_TIP_BALL_RESTITUTION);
  // the normal vector is just the vector from the point of contact to the center of mass
  const normalVector: Vector = subtractVectors(ball.position, cue.position);
  const normalUnitVector: Vector = unitVector(normalVector);
  // theta is the angle between the normal vector and initial cue velocity vector
  const theta: number = angleBetween(normalUnitVector, cueInitialVelocity);
  // phi is the angle between the normal vector and final ball velocity vector
  const phi: number =
    Math.sin(theta) === 0 ? 0 : Math.atan(1 / (CUE_TIP_BALL_FRICTION * Math.sin(theta)));
  // alpha is the angle between the final ball velocity vector and the initial cue velocity vector
  const alpha: number = theta - phi;
  const ballVelocityMagnitude: number =
    (2 * magnitude(cueInitialVelocity) * Math.cos(alpha)) / (1 + BALL_MASS / CUE_MASS);
  // find the direction of the friction vector using cross products, adjusted to be a proportion of the normal unit vector based on sin(theta) and the friction coeff
  const adjustedFrictionDirectionVector: Vector = scale(
    crossProduct(normalUnitVector, crossProduct(unitVector(cueInitialVelocity), normalUnitVector)),
    CUE_TIP_BALL_FRICTION,
  );
  const ballVelocityDirection: Vector = unitVector(
    addVectors(normalUnitVector, adjustedFrictionDirectionVector),
  );
  const ballFinalVelocity: Vector = scale(ballVelocityDirection, ballVelocityMagnitude);
  // conservation of linear momentum to find the cue's final velocity vector:
  const cueFinalVelocity: Vector = subtractVectors(
    cueInitialVelocity,
    scale(ballFinalVelocity, BALL_MASS / CUE_MASS),
  );
  // conservation of angular momentum to find the resulting angular velocity on the ball:
  ball.angularVelocity = scale(
    subtractVectors(
      scale(crossProduct(normalVector, cueInitialVelocity), CUE_MASS),
      scale(crossProduct(normalVector, cueFinalVelocity), CUE_MASS),
    ),
    1 / BALL_MOMENT_OF_INERTIA,
  );
  ball.velocity = ballFinalVelocity;
  console.log('final velocity');
  console.log(ballFinalVelocity);
  console.log(ball.isMoving);
}

export function cushionBallCollision(ball: PoolBall, cushionNumber: number) {
  console.log('cushion ball collision ' + ball.ballNumber);
  // Rotate the table frame of reference so it's as if the rail is always perpendicular to the x direction unit vector
  const rotationAngle: number = (cushionNumber * Math.PI) / 2;
  let xVelocityAdjusted: number =
    ball.velocity.x * Math.cos(rotationAngle) + ball.velocity.y * Math.sin(rotationAngle);
  let yVelocityAdjusted: number =
    -ball.velocity.x * Math.sin(rotationAngle) + ball.velocity.y * Math.cos(rotationAngle);
  let xAngularVelocityAdjusted: number =
    ball.angularVelocity.x * Math.cos(rotationAngle) +
    ball.angularVelocity.y * Math.sin(rotationAngle);
  let yAngularVelocityAdjusted: number =
    -ball.angularVelocity.x * Math.sin(rotationAngle) +
    ball.angularVelocity.y * Math.cos(rotationAngle);
  const theta: number = Math.asin((CUSHION_HEIGHT - ball.position.z) / BALL_RADIUS);
  const phi: number = angleBetween(
    { x: 1, y: 0, z: 0 },
    { x: xVelocityAdjusted, y: yVelocityAdjusted, z: 0 },
  );
  console.log('phi ' + phi);
  const ballRailFriction: number = 0.471 - 0.241 * theta;
  const ballRailRestitution: number = Math.max(
    0.39 + 0.257 * xVelocityAdjusted - 0.044 * xVelocityAdjusted ** 2,
    0.4,
  );
  console.log('fric ' + ballRailFriction);
  console.log('rest ' + ballRailRestitution);
  const sx: number =
    xVelocityAdjusted * Math.sin(theta) -
    ball.velocity.z * Math.cos(theta) +
    BALL_RADIUS * yAngularVelocityAdjusted;
  const sy: number =
    -yVelocityAdjusted -
    BALL_RADIUS * ball.angularVelocity.z * Math.cos(theta) +
    BALL_RADIUS * xAngularVelocityAdjusted * Math.sin(theta);
  console.log('sx ' + sx);
  console.log('sy ' + sy);
  console.log('x velocity adjusted ' + xVelocityAdjusted);
  console.log('theta ' + theta);
  let c: number = xVelocityAdjusted * Math.cos(theta);
  console.log('original c ' + c);
  const pzE: number = BALL_MASS * c * (1 + ballRailRestitution);
  const pzS: number = ((2 * BALL_MASS) / 7) * Math.sqrt(sx ** 2 + sy ** 2);
  let velocityFinal: Vector = { x: 0, y: 0, z: 0 };
  const angularVelocityFinal: Vector = { x: 0, y: 0, z: 0 };
  if (pzS <= pzE) {
    console.log('entered if statement');
    xVelocityAdjusted =
      (-2 / 7) * sx * Math.sin(theta) - (1 + ballRailRestitution) * c * Math.cos(theta);
    yVelocityAdjusted = (2 / 7) * sy;
    velocityFinal.z =
      (2 / 7) * sx * Math.cos(theta) - (1 + ballRailRestitution) * c * Math.sin(theta);
  } else {
    console.log('entered else statement');
    xVelocityAdjusted =
      -ballRailFriction *
      (1 + ballRailRestitution) *
      c *
      Math.cos(phi) * Math.sin(theta) - (1 + ballRailRestitution) * c * Math.cos(theta);
    yVelocityAdjusted = ballRailFriction * c * (1 + ballRailRestitution) * Math.sin(phi);
    velocityFinal.z =
      ballRailFriction *
      c *
      (1 + ballRailRestitution) *
      Math.cos(phi) * Math.cos(theta) - (1 + ballRailRestitution) * c * Math.sin(theta);
    console.log(xVelocityAdjusted);
  }
  c = BALL_RADIUS / BALL_MOMENT_OF_INERTIA;
  xAngularVelocityAdjusted = -c * yVelocityAdjusted * Math.sin(theta);
  yAngularVelocityAdjusted =
    c * (xVelocityAdjusted * Math.sin(theta) - velocityFinal.z * Math.cos(theta));
  // Restore frame of reference
  angularVelocityFinal.z = c * yVelocityAdjusted * Math.cos(theta);
  velocityFinal.x =
    xVelocityAdjusted * Math.cos(-rotationAngle) + yVelocityAdjusted * Math.sin(-rotationAngle);
  velocityFinal.y =
    -xVelocityAdjusted * Math.sin(-rotationAngle) + yVelocityAdjusted * Math.cos(-rotationAngle);
  angularVelocityFinal.x =
    xAngularVelocityAdjusted * Math.cos(-rotationAngle) +
    yAngularVelocityAdjusted * Math.sin(-rotationAngle);
  angularVelocityFinal.y =
    -xAngularVelocityAdjusted * Math.sin(-rotationAngle) +
    yAngularVelocityAdjusted * Math.cos(-rotationAngle);
  ball.velocity = addVectors(ball.velocity, velocityFinal);
  ball.angularVelocity = addVectors(ball.angularVelocity, angularVelocityFinal);
  console.log(velocityFinal);
  console.log(ballRailFriction);
  console.log(ballRailRestitution);
  console.log(c);
  console.log(theta);
}

export function ballSlateCollision(ball: PoolBall) {
  let newZVelocity = -ball.velocity.z * BALL_SLATE_RESTITUTION;
  if (Math.abs(newZVelocity) < 0.01) {
    newZVelocity = 0;
    ball.isAirborne = false;
  }
  ball.velocity = { x: ball.velocity.x, y: ball.velocity.y, z: newZVelocity };
  // TODO: see how angular velocity/friction affect this collision to adjust x and y velocities as necessary
}
