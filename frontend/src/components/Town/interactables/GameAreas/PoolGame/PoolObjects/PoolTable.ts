import { midpoint, Vector } from '../Vector';

const TABLE_LENGTH = 2.54; // m
const TABLE_WIDTH = 1.27; // m
const CUSHION_WIDTH = 0.051; //m
const CORNER_POCKET_ENTRANCE_WIDTH = 0.117; // m
const SIDE_POCKET_ENTRANCE_WIDTH = 0.133; // m
const CORNER_POCKET_RADIUS = 0.062; // m
const SIDE_POCKET_RADIUS = 0.0645; // m
const CORNER_POCKET_ANGLE = 2.478368; // rad
const SIDE_POCKET_ANGLE = 1.815142; // rad
const CORNER_POCKET_SHELF_DEPTH = 0.05715; // m
const SIDE_POCKET_SHELF_DEPTH = 0.009525; // m

export type CushionPlane = {
  point1: Vector;
  point2: Vector;
};

export type PoolPocket = {
  position: Vector;
  radius: number;
};

// cushions are numbered cpositionkwise going around the table, starting with the left side cushion

// SIDE cushions:
const cushion1: CushionPlane = {
  point1: { x: 0, y: TABLE_WIDTH - Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, z: 0 },
  point2: { x: 0, y: Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, z: 0 },
};

const cushion4: CushionPlane = {
  point1: { x: Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, y: 0, z: 0 },
  point2: { x: TABLE_LENGTH / 2 - SIDE_POCKET_ENTRANCE_WIDTH / 2, y: 0, z: 0 },
};

const cushion7: CushionPlane = {
  point1: { x: TABLE_LENGTH / 2 + SIDE_POCKET_ENTRANCE_WIDTH / 2, y: 0, z: 0 },
  point2: { x: TABLE_LENGTH - Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, y: 0, z: 0 },
};

const cushion10: CushionPlane = {
  point1: { x: TABLE_LENGTH, y: Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, z: 0 },
  point2: {
    x: TABLE_LENGTH,
    y: TABLE_WIDTH - Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH,
    z: 0,
  },
};

const cushion13: CushionPlane = {
  point1: {
    x: TABLE_LENGTH - Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH,
    y: TABLE_WIDTH,
    z: 0,
  },
  point2: { x: TABLE_LENGTH / 2 + SIDE_POCKET_ENTRANCE_WIDTH / 2, y: TABLE_WIDTH, z: 0 },
};

const cushion16: CushionPlane = {
  point1: { x: TABLE_LENGTH / 2 - SIDE_POCKET_ENTRANCE_WIDTH / 2, y: TABLE_WIDTH, z: 0 },
  point2: { x: Math.sin(0.7853982) * CORNER_POCKET_ENTRANCE_WIDTH, y: TABLE_WIDTH, z: 0 },
};

// pocket cushionS:

const cushion2: CushionPlane = {
  point1: cushion1.point2,
  point2: {
    x: -CUSHION_WIDTH,
    y: cushion1.point2.y - Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    z: 0,
  },
};

const cushion3: CushionPlane = {
  point1: {
    x: cushion4.point1.x - Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    y: -CUSHION_WIDTH,
    z: 0,
  },
  point2: cushion4.point1,
};

const cushion5: CushionPlane = {
  point1: cushion4.point2,
  point2: {
    x: cushion4.point2.x + Math.tan(SIDE_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    y: -CUSHION_WIDTH,
    z: 0,
  },
};

const cushion6: CushionPlane = {
  point1: {
    x: cushion7.point1.x - Math.tan(SIDE_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    y: -CUSHION_WIDTH,
    z: 0,
  },
  point2: cushion7.point1,
};

const cushion8: CushionPlane = {
  point1: cushion7.point2,
  point2: {
    x: cushion7.point2.x + Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    y: -CUSHION_WIDTH,
    z: 0,
  },
};

const cushion9: CushionPlane = {
  point1: {
    x: TABLE_LENGTH + CUSHION_WIDTH,
    y: cushion10.point1.y - Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    z: 0,
  },
  point2: cushion4.point1,
};

const cushion11: CushionPlane = {
  point1: cushion10.point2,
  point2: {
    x: TABLE_LENGTH + CUSHION_WIDTH,
    y: cushion10.point2.y + Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    z: 0,
  },
};

const cushion12: CushionPlane = {
  point1: {
    x: cushion13.point1.x + Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    y: TABLE_WIDTH + CUSHION_WIDTH,
    z: 0,
  },
  point2: cushion13.point1,
};

const cushion14: CushionPlane = {
  point1: cushion13.point2,
  point2: {
    x: cushion13.point2.x - Math.tan(SIDE_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    y: TABLE_WIDTH + CUSHION_WIDTH,
    z: 0,
  },
};

const cushion15: CushionPlane = {
  point1: {
    x: cushion16.point1.x + Math.tan(SIDE_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    y: TABLE_WIDTH + CUSHION_WIDTH,
    z: 0,
  },
  point2: cushion16.point1,
};

const cushion17: CushionPlane = {
  point1: cushion16.point2,
  point2: {
    x: cushion16.point2.x - Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    y: TABLE_WIDTH + CUSHION_WIDTH,
    z: 0,
  },
};

const cushion18: CushionPlane = {
  point1: {
    x: -CUSHION_WIDTH,
    y: cushion1.point1.y + Math.tan(CORNER_POCKET_ANGLE - Math.PI / 2) * CUSHION_WIDTH,
    z: 0,
  },
  point2: cushion1.point1,
};

export const CUSHIONS: CushionPlane[] = [
  cushion1,
  cushion2,
  cushion3,
  cushion4,
  cushion5,
  cushion6,
  cushion7,
  cushion8,
  cushion9,
  cushion10,
  cushion11,
  cushion12,
  cushion13,
  cushion14,
  cushion15,
  cushion16,
  cushion17,
  cushion18,
];

// Pockets go cpositionkwise around the table, starting with the top left pocket

const pocket1: PoolPocket = {
  position: {
    x:
      midpoint(cushion1.point2, cushion4.point1).x -
      0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
    y:
      midpoint(cushion1.point2, cushion4.point1).y -
      0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
    z: 0,
  },
  radius: CORNER_POCKET_RADIUS,
};

const pocket2: PoolPocket = {
  position: {
    x: midpoint(cushion4.point2, cushion7.point1).x,
    y:
      midpoint(cushion4.point2, cushion7.point1).y - (SIDE_POCKET_RADIUS + SIDE_POCKET_SHELF_DEPTH),
    z: 0,
  },
  radius: SIDE_POCKET_RADIUS,
};

const pocket3: PoolPocket = {
  position: {
    x:
      midpoint(cushion7.point2, cushion10.point1).x +
      0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
    y:
      midpoint(cushion7.point2, cushion10.point1).y -
      0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
    z: 0,
  },
  radius: CORNER_POCKET_RADIUS,
};

const pocket4: PoolPocket = {
  position: {
    x:
      midpoint(cushion10.point2, cushion13.point1).x +
      0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
    y:
      midpoint(cushion10.point2, cushion13.point1).y +
      0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
    z: 0,
  },
  radius: CORNER_POCKET_RADIUS,
};

const pocket5: PoolPocket = {
  position: {
    x: midpoint(cushion13.point2, cushion16.point1).x,
    y:
      midpoint(cushion13.point2, cushion16.point1).y +
      (SIDE_POCKET_RADIUS + SIDE_POCKET_SHELF_DEPTH),
    z: 0,
  },
  radius: SIDE_POCKET_RADIUS,
};

const pocket6: PoolPocket = {
  position: {
    x:
      midpoint(cushion16.point2, cushion1.point1).x -
      0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
    y:
      midpoint(cushion16.point2, cushion1.point1).y +
      0.7071 * (CORNER_POCKET_RADIUS + CORNER_POCKET_SHELF_DEPTH),
    z: 0,
  },
  radius: CORNER_POCKET_RADIUS,
};

export const POCKETS: PoolPocket[] = [pocket1, pocket2, pocket3, pocket4, pocket5, pocket6];
