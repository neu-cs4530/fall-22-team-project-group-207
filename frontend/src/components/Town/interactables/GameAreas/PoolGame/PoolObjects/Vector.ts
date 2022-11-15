export type vector = {
    x: number;
    y: number;
    z: number;
}

// return a vector scaled by a constant
export function scale(v: vector, scalar: number): vector {
    return {x: v.x * scalar, y: v.y * scalar, z: v.z * scalar};
}

// find the magnitude of a vector
export function magnitude(v: vector): number {
    return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

// find the unit vector parallel to a given vector
export function parallelUnitVector(v: vector): vector {
    const vMagnitude: number = magnitude(v);
    return {x: v.x / vMagnitude, y: v.y / vMagnitude, z: v.z / vMagnitude};
}

export function subtractVectors(v1: vector, v2: vector): vector {
    return {x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z};
}

export function addVectors(v1: vector, v2: vector): vector {
    return {x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z};
}

// take the dot product of 2 vectors
export function dotProduct(v1: vector, v2: vector): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z + v2.z;
}

// take the cross product of 2 vectors
export function crossProduct(v1: vector, v2: vector): vector {
    const xMagnitude = v1.y * v2.z - v1.z * v2.y;
    const yMagnitude = v1.z * v2.x - v1.x * v2.z;
    const zMagnitude = v1.x * v2.y - v1.y * v2.x;
    return {x: xMagnitude, y: yMagnitude, z: zMagnitude}
}

// find the small (acute) angle between 2 vectors
export function angleBetween(v1: vector, v2: vector): number {
    return Math.acos(dotProduct(v1, v2) / (magnitude(v1) * magnitude(v2)));
}