import { Vector as SharedVector } from '../../../../../types/CoveyTownSocket';

export type Vector = SharedVector;

// return a vector scaled by a constant
export function scale(v: Vector, scalar: number): Vector {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
}

// find the magnitude of a vector
export function magnitude(v: Vector): number {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

// find the unit vector parallel to a given vector
export function unitVector(v: Vector): Vector {
  const vMagnitude: number = magnitude(v);
  return { x: v.x / vMagnitude, y: v.y / vMagnitude, z: v.z / vMagnitude };
}

export function subtractVectors(v1: Vector, v2: Vector): Vector {
  return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
}

export function addVectors(v1: Vector, v2: Vector): Vector {
  return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z };
}

// take the dot product of 2 vectors
export function dotProduct(v1: Vector, v2: Vector): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

// take the cross product of 2 vectors
export function crossProduct(v1: Vector, v2: Vector): Vector {
  const xMagnitude = v1.y * v2.z - v1.z * v2.y;
  const yMagnitude = v1.z * v2.x - v1.x * v2.z;
  const zMagnitude = v1.x * v2.y - v1.y * v2.x;
  return { x: xMagnitude, y: yMagnitude, z: zMagnitude };
}

// find the small (acute) angle between 2 vectors
export function angleBetween(v1: Vector, v2: Vector): number {
  // to guard against js floating point magic:
  let ratio: number = dotProduct(v1, v2) / (magnitude(v1) * magnitude(v2));
  ratio = ratio > 1 ? 1 : ratio;
  ratio = ratio < -1 ? -1 : ratio;
  return Math.acos(ratio);
}

// find the midpoint between 2 vectors
export function midpoint(v1: Vector, v2: Vector): Vector {
  return scale(addVectors(v1, v2), 0.5);
}
