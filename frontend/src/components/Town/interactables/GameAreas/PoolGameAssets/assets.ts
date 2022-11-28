import ball0 from './ball_0.png';
import ball1 from './ball_1.png';
import ball10 from './ball_10.png';
import ball11 from './ball_11.png';
import ball12 from './ball_12.png';
import ball13 from './ball_13.png';
import ball14 from './ball_14.png';
import ball15 from './ball_15.png';
import ball2 from './ball_2.png';
import ball3 from './ball_3.png';
import ball4 from './ball_4.png';
import ball5 from './ball_5.png';
import ball6 from './ball_6.png';
import ball7 from './ball_7.png';
import ball8 from './ball_8.png';
import ball9 from './ball_9.png';
import pool_table from './pool_table.png';

/**
 * Paths for the images for each pool ball (in order 0-10)
 * ball0 is the cue ball, and ball8 is the eight ball
 */
export const POOL_BALL_PATHS = [
  ball0, // ball0 is the cue ball
  ball1,
  ball2,
  ball3,
  ball4,
  ball5,
  ball6,
  ball7,
  ball8, // ball8 is the eight ball
  ball9,
  ball10,
  ball11,
  ball12,
  ball13,
  ball14,
  ball15,
];

export const POOL_TABLE_PATH = pool_table;

/**
 * Preload the images so they display on first render
 */
export const POOL_TABLE_IMAGE = [POOL_TABLE_PATH].map(p => {
  console.log('loading pool board');
  const img = new Image();
  img.src = p;
  return img;
});

export const POOL_BALL_IMAGES = POOL_BALL_PATHS.map(p => {
  console.log('loading pool ball');
  const img = new Image();
  img.src = p;
  return img;
});
