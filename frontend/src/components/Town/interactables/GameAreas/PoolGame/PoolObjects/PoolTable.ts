import { midpoint, Vector } from '../Vector';

const TABLE_LENGTH: number = 2.54; // m
const TABLE_WIDTH: number = 1.27 // m
const CUSHION_WIDTH: number = 0.051 //m
const CORNER_POCKET_ENTRANCE_WIDTH: number = 0.117 // m
const SIDE_POCKET_ENTRANCE_WIDTH: number = 0.133 // m
const CORNER_POCKET_RADIUS: number = 0.062 // m
const SIDE_POCKET_RADIUS: number = 0.0645 // m
const CORNER_POCKET_ANGLE: number = 2.478368 // rad
const SIDE_POCKET_ANGLE: number = 1.815142 // rad
const CORNER_POCKET_SHELF_DEPTH: number = 0.05715 // m
const SIDE_POCKET_SHELF_DEPTH: number = 0.009525 // m


export type CushionPlane = {
    point1: Vector,
    point2: Vector,
}

export type PoolPocket = {
    position: Vector,
    radius: number,
}

// cushions are numbered cpositionkwise going around the table, starting with the left side cushion

// SIDE CUSHIONS:
const CUSHION1: CushionPlane = {
    point1: { x: 0, y: TABLE_WIDTH - Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, z: 0 },
    point2: { x: 0, y: Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, z: 0 },
}

const CUSHION4: CushionPlane = {
    point1: { x: Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, y: 0, z: 0 },
    point2: { x: TABLE_LENGTH / 2 - SIDE_POCKET_ENTRANCE_WIDTH / 2, y: 0, z: 0 },
}

const CUSHION7: CushionPlane = {
    point1: { x: TABLE_LENGTH / 2 + SIDE_POCKET_ENTRANCE_WIDTH / 2, y: 0, z: 0 },
    point2: { x: TABLE_LENGTH - Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, y: 0, z: 0 },
}

const CUSHION10: CushionPlane = {
    point1: { x: TABLE_LENGTH, y: Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, z: 0 },
    point2: { x: TABLE_LENGTH, y: TABLE_WIDTH - Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, z: 0 },
}

const CUSHION13: CushionPlane = {
    point1: { x: TABLE_LENGTH - Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, y: TABLE_WIDTH, z: 0 },
    point2: { x: TABLE_LENGTH / 2 + SIDE_POCKET_ENTRANCE_WIDTH / 2, y: TABLE_WIDTH, z: 0 },
}

const CUSHION16: CushionPlane = {
    point1: { x: TABLE_LENGTH / 2 - SIDE_POCKET_ENTRANCE_WIDTH / 2, y: TABLE_WIDTH, z: 0 },
    point2: { x: Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, y: TABLE_WIDTH, z: 0 },
}

// POCKET CUSHIONS:

const CUSHION2: CushionPlane = {
    point1: CUSHION1.point2,
    point2: { x: -CUSHION_WIDTH, y: CUSHION1.point2.y - Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, z: 0 },
}

const CUSHION3: CushionPlane = {
    point1: { x: CUSHION4.point1.x - Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, y: -CUSHION_WIDTH, z: 0 },
    point2: CUSHION4.point1,
}

const CUSHION5: CushionPlane = {
    point1: CUSHION4.point2,
    point2: { x: CUSHION4.point2.x + Math.tan(SIDE_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, y: -CUSHION_WIDTH, z: 0 },
}

const CUSHION6: CushionPlane = {
    point1: { x: CUSHION7.point1.x - Math.tan(SIDE_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, y: -CUSHION_WIDTH, z: 0 },
    point2: CUSHION7.point1,
}

const CUSHION8: CushionPlane = {
    point1: CUSHION7.point2,
    point2: { x: CUSHION7.point2.x + Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, y: -CUSHION_WIDTH, z: 0 },
}

const CUSHION9: CushionPlane = {
    point1: { x: TABLE_LENGTH + CUSHION_WIDTH, y: CUSHION10.point1.y - Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, z: 0 },
    point2: CUSHION4.point1,
}

const CUSHION11: CushionPlane = {
    point1: CUSHION10.point2,
    point2: { x: TABLE_LENGTH + CUSHION_WIDTH, y: CUSHION10.point2.y + Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, z: 0 },
}

const CUSHION12: CushionPlane = {
    point1: { x: CUSHION13.point1.x + Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, y: TABLE_WIDTH + CUSHION_WIDTH, z: 0 },
    point2: CUSHION13.point1,
}

const CUSHION14: CushionPlane = {
    point1: CUSHION13.point2,
    point2: { x: CUSHION13.point2.x - Math.tan(SIDE_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, y: TABLE_WIDTH + CUSHION_WIDTH, z: 0 },
}

const CUSHION15: CushionPlane = {
    point1: { x: CUSHION16.point1.x + Math.tan(SIDE_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, y: TABLE_WIDTH + CUSHION_WIDTH, z: 0 },
    point2: CUSHION16.point1,
}

const CUSHION17: CushionPlane = {
    point1: CUSHION16.point2,
    point2: { x: CUSHION16.point2.x - Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, y: TABLE_WIDTH + CUSHION_WIDTH, z: 0 },
}

const CUSHION18: CushionPlane = {
    point1: { x: -CUSHION_WIDTH, y: CUSHION1.point1.y + Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH, z: 0 },
    point2: CUSHION1.point1,
}

export const CUSHIONS: CushionPlane[] = [
    CUSHION1,
    CUSHION2,
    CUSHION3,
    CUSHION4,
    CUSHION5,
    CUSHION6,
    CUSHION7,
    CUSHION8,
    CUSHION9,
    CUSHION10,
    CUSHION11,
    CUSHION12,
    CUSHION13,
    CUSHION14,
    CUSHION15,
    CUSHION16,
    CUSHION17,
    CUSHION18,
];


// Pockets go cpositionkwise around the table, starting with the top left pocket

const POCKET1: PoolPocket = { 
    position: {
        x: midpoint(CUSHION1.point2, CUSHION4.point1).x - 0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
        y: midpoint(CUSHION1.point2, CUSHION4.point1).y - 0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
        z: 0,
    },
    radius: CORNER_POCKET_RADIUS,
}

const POCKET2: PoolPocket = { 
    position: {
        x: midpoint(CUSHION4.point2, CUSHION7.point1).x,
        y: midpoint(CUSHION4.point2, CUSHION7.point1).y - (SIDE_POCKET_RADIUS + SIDE_POCKET_SHELF_DEPTH),
        z: 0,
    },
    radius: SIDE_POCKET_RADIUS,
}

const POCKET3: PoolPocket = { 
    position: {
        x: midpoint(CUSHION7.point2, CUSHION10.point1).x + 0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
        y: midpoint(CUSHION7.point2, CUSHION10.point1).y - 0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
        z: 0,
    },
    radius: CORNER_POCKET_RADIUS,
}

const POCKET4: PoolPocket = {
    position: {
        x: midpoint(CUSHION10.point2, CUSHION13.point1).x + 0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
        y: midpoint(CUSHION10.point2, CUSHION13.point1).y + 0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
        z: 0,
    },
    radius: CORNER_POCKET_RADIUS
}

const POCKET5: PoolPocket = {
    position: { 
        x: midpoint(CUSHION13.point2, CUSHION16.point1).x,
        y: midpoint(CUSHION13.point2, CUSHION16.point1).y + (SIDE_POCKET_RADIUS + SIDE_POCKET_SHELF_DEPTH),
        z: 0,
    },
    radius: SIDE_POCKET_RADIUS,
}

const POCKET6: PoolPocket = { 
    position: {
        x: midpoint(CUSHION16.point2, CUSHION1.point1).x - 0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
        y: midpoint(CUSHION16.point2, CUSHION1.point1).y + 0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
        z: 0,  
    },
    radius: CORNER_POCKET_RADIUS, 
}

export const POCKETS: PoolPocket[] = [
    POCKET1,
    POCKET2,
    POCKET3,
    POCKET4,
    POCKET5,
    POCKET6,
]