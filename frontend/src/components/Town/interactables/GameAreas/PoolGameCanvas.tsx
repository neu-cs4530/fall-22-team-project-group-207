import React, { useEffect, useRef } from 'react';
import { FrontEndPoolBall } from '../../../../classes/PoolGameAreaController';
import ball1 from './PoolGameAssets/ball_1.png';
import ball2 from './PoolGameAssets/ball_2.png';
import ball3 from './PoolGameAssets/ball_3.png';
// POOL TODO: add the rest of the imports

// POOL TODO: remove test balls
const TEST_POOL_BALLS = [
  {
    posX: 0,
    posY: 0,
    orientation: '',
    ballNumber: 1,
  },
  {
    posX: 100,
    posY: 15,
    orientation: '',
    ballNumber: 2,
  },
  {
    posX: 250,
    posY: 250,
    orientation: '',
    ballNumber: 3,
  },
];

/**
 * Returns a canvas that renders the pool game
 * @returns HTML canvas containing pool game display
 */
export default function PoolGameCanvas(): JSX.Element {
  // POOL TODO: add react hooks for game state so we can update this with the pool balls

  // canvas for rendering the game
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  canvasRef.current?.getContext('2d');
  const canvasCtxRef = React.useRef<CanvasRenderingContext2D | null>(null);

  function getBallSrc(ballNumber: number): string {
    switch (ballNumber) {
      case 1:
        return ball1;
      case 2:
        return ball2;
      case 3:
        return ball3;
      default:
        return '';
    }
  }

  useEffect(() => {
    // Draw the game state
    // console.log('attempting to find canvasRef.current');
    if (!canvasRef.current) {
      // console.log('could not find canvasRef.current');
      return;
    }
    const canvas = canvasRef.current;
    canvasCtxRef.current = canvas.getContext('2d');
    if (!canvasCtxRef.current) {
      // console.log('could not find canvasCtxRef.current');
      return;
    }

    // Helper fucntions to draw all balls
    function drawBall(ctx: CanvasRenderingContext2D, ball: FrontEndPoolBall) {
      const img = new Image();
      img.src = getBallSrc(ball.ballNumber);
      console.log('img src ' + ball1);
      img.onload = function () {
        console.log('onload');
        ctx.drawImage(img, ball.posX, ball.posY);
      };
    }
    function drawAllBalls(ctx: CanvasRenderingContext2D, balls: FrontEndPoolBall[]) {
      balls.map(ball => drawBall(ctx, ball));
    }

    const ctx = canvasCtxRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawAllBalls(ctx, TEST_POOL_BALLS);
  }, []);

  return (
    <div>
      <canvas id='canvas' ref={canvasRef} width='800' height='500'></canvas>
      {/* POOL TODO: delete this div
      <img src={ball1}></img>*/}
    </div>
  );
}
