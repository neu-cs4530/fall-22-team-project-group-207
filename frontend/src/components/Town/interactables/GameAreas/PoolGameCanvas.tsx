import React, { useEffect, useRef, useState } from 'react';
import { FrontEndPoolBall } from '../../../../classes/PoolGameAreaController';
import ball0 from './PoolGameAssets/ball_0.png';
import ball1 from './PoolGameAssets/ball_1.png';
import ball2 from './PoolGameAssets/ball_2.png';
import ball3 from './PoolGameAssets/ball_3.png';
import pool_table from './PoolGameAssets/pool_table.png';
// POOL TODO: add the rest of the imports

// POOL TODO: remove test balls
const TEST_POOL_BALLS = [
  {
    posX: 380,
    posY: 260,
    orientation: '',
    ballNumber: 0,
  },
  {
    posX: 500,
    posY: 200,
    orientation: '',
    ballNumber: 1,
  },
  {
    posX: 100,
    posY: 140,
    orientation: '',
    ballNumber: 2,
  },
  {
    posX: 400,
    posY: 340,
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

  // Coordinates of mouse
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const [globalCoords, setGlobalCoords] = useState({ x: 0, y: 0 });

  // canvas for rendering the game
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  function getBallSrc(ballNumber: number): string {
    switch (ballNumber) {
      case 0:
        return ball0; // cue ball
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

  // Handle mouse movement
  useEffect(() => {
    // Get local mouse coordinates
    const handleMouseMove = (event: { screenX: number; screenY: number }) => {
      const canvas = boardCanvasRef.current;
      if (!canvas) {
        console.log('could not find canvasRef.current');
        return;
      }
      const canvasRect = canvas.getBoundingClientRect();
      console.log('bounding rect ' + canvasRect.x + ' ' + canvasRect.y);
      setCoords({
        x: event.screenX - canvasRect.x,
        y: event.screenY - canvasRect.y,
      });
    };

    // Get global mouse coordinates
    const handleWindowMouseMove = (event: { screenX: number; screenY: number }) => {
      setGlobalCoords({
        x: event.screenX,
        y: event.screenY,
      });
      handleMouseMove(event);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, []);

  // Main drawing method for the board
  useEffect(() => {
    // Set up context for board
    const boardCanvas = boardCanvasRef.current;
    if (!boardCanvas) {
      return;
    }
    boardCanvasCtxRef.current = boardCanvas.getContext('2d');
    const boardCanvasCtx = boardCanvasCtxRef.current;
    if (!boardCanvasCtx) {
      return;
    }

    // Draw the game state

    // Draw one ball
    function drawBall(ctx: CanvasRenderingContext2D, ball: FrontEndPoolBall) {
      const img = new Image();
      img.src = getBallSrc(ball.ballNumber);
      // console.log('img src ' + ball1);
      img.onload = function () {
        // console.log('onload');
        ctx.drawImage(img, ball.posX, ball.posY, img.width * 0.7, img.height * 0.7);
      };
    }
    // Draw all balls
    function drawAllBalls(ctx: CanvasRenderingContext2D, balls: FrontEndPoolBall[]) {
      balls.map(ball => drawBall(ctx, ball));
    }
    // Draw board
    function drawBoard(ctx: CanvasRenderingContext2D) {
      const img = new Image();
      img.src = pool_table;
      img.onload = function () {
        ctx.drawImage(img, 0, 0, img.width * 1.5, img.height * 1.5);
      };
    }

    // Actually draw stuff
    boardCanvasCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    drawBoard(boardCanvasCtx);
    drawAllBalls(boardCanvasCtx, TEST_POOL_BALLS);
  }, [coords]);

  // Main drawing method for user input
  useEffect(() => {
    // Set up context for player input
    const inputCanvas = inputCanvasRef.current;
    if (!inputCanvas) {
      return;
    }
    inputCanvasCtxRef.current = inputCanvas.getContext('2d');
    const inputCanvasCtx = inputCanvasCtxRef.current;
    if (!inputCanvasCtx) {
      return;
    }

    // Draw the player's input
    function drawPlayerInput(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);

      ctx.lineTo(TEST_POOL_BALLS[0].posX, TEST_POOL_BALLS[0].posY);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    inputCanvasCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
    drawPlayerInput(inputCanvasCtx);
  }, [coords]);

  return (
    <div>
      <canvas
        id='board canvas'
        ref={boardCanvasRef}
        width='800'
        height='500'
        data-style='position: absolute; left: 0; top: 0; z-index: 1;'></canvas>
      <canvas
        id='input canvas'
        ref={inputCanvasRef}
        width='800'
        height='500'
        data-style='position: absolute; left: 0; top: 0; z-index: 2;'></canvas>
      {/* POOL TODO: delete this div*/}
      <div>
        {/* Get mouse coordinates relative to element */}
        <div style={{ padding: '3rem', backgroundColor: 'lightgray' }}>
          <h2>
            Canvas coords: {coords.x} {coords.y}
          </h2>
        </div>

        <hr />

        <h2>
          Global coords: {globalCoords.x} {globalCoords.y}
        </h2>
      </div>
    </div>
  );
}
