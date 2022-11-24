import React, { useEffect, useRef, useState } from 'react';
import { FrontEndPoolBall } from '../../../../classes/PoolGameAreaController';
import { usePoolGameAreaController } from '../../../../classes/TownController';
import PoolGameArea from './PoolGameArea';
import { POOL_BALL_PATHS, POOL_TABLE_PATH } from './PoolGameAssets/assets';
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
export default function PoolGameCanvas({
  poolGameArea,
}: {
  poolGameArea: PoolGameArea | undefined;
}): JSX.Element {
  // POOL TODO: add react hooks for game state so we can update this with the pool balls
  // const coveyTownController = useTownController(); // not sure if we need this
  // const poolGameAreaController = usePoolGameAreaController(poolGameArea?.name);
  // const [poolBalls, setPoolBalls] = useState<FrontEndPoolBall>(poolGameArea?.poolBalls);

  // Coordinates of mouse
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // canvas for rendering the game
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const scratch = false; // POOL TODO: use pool controller for these
  const isPlayersTurn = true;
  const spectating = false;

  /**
   * Draws the board on the canvas
   * @param ctx Canvas context
   */
  function drawBoard(ctx: CanvasRenderingContext2D) {
    const img = new Image();
    img.src = POOL_TABLE_PATH;
    img.onload = function () {
      ctx.drawImage(img, 0, 0, img.width * 1.5, img.height * 1.5);
    };
  }

  // Handle mouse events, namely movement and clicking
  useEffect(() => {
    const canvas = boardCanvasRef.current;
    if (!canvas) {
      console.log('could not find canvasRef.current');
      return;
    }
    const canvasRect = canvas.getBoundingClientRect();
    console.log('bounding rect ' + canvasRect.x + ' ' + canvasRect.y);

    // Get local mouse coordinates
    const handleMouseMove = (event: { screenX: number; screenY: number }) => {
      setMousePos({
        x: event.screenX - canvasRect.x,
        y: event.screenY - canvasRect.y,
      });
    };

    // Handle user input based on the state of the game
    const handleMouseClick = () => {
      console.log('player clicked at ' + mousePos.x + ' ' + mousePos.y);
      if (scratch) {
        // POOL TODO: update game controller with new cue ball position
      }
      // When the current player needs to input a hit
      else if (isPlayersTurn) {
        // POOL TODO: handle player input and update game controller with move vector
      }
      // When the current player is spectating or waiting on the other player's move
      else if (spectating) {
        // Clicking when it's not the player's turn should do nothing
        return;
      }
      // Catch unknown states
      else {
        console.log('no state found');
      }
    };

    // Listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseClick);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseClick);
    };
  }, [isPlayersTurn, mousePos, scratch, spectating]);

  /**
   * useEffect to render the board state and ball movements
   */
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

    /**
     * Draws one ball on the canvas, using the ball's coordinates as the center of the ball
     * (as opposed to top left)
     * @param ctx Canvas context
     * @param ball Pool ball to be drawn
     */
    function drawBall(ctx: CanvasRenderingContext2D, ball: FrontEndPoolBall) {
      const img = new Image();
      img.src = POOL_BALL_PATHS[ball.ballNumber];
      const width = img.width * 0.7;
      const height = img.height * 0.7;
      img.onload = function () {
        ctx.drawImage(img, ball.posX - width / 2, ball.posY - height / 2, width, height);
      };
    }

    /**
     * Draw all balls on the canvas
     * @param ctx Canvas context
     * @param balls Pool balls to be drawn
     */
    function drawAllBalls(ctx: CanvasRenderingContext2D, balls: FrontEndPoolBall[]) {
      balls.map(ball => drawBall(ctx, ball));
    }

    // Actually draw stuff
    boardCanvasCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    drawBoard(boardCanvasCtx);
    drawAllBalls(boardCanvasCtx, TEST_POOL_BALLS);
  }, []);

  /**
   * useEffect to render the player's inputs to the game
   */
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

    /**
     * Draw the cue stick if the player is making a move
     * @param ctx Canvas context
     */
    function drawCueStick(ctx: CanvasRenderingContext2D) {
      const ballX = TEST_POOL_BALLS[0].posX; // POOL TODO: fix this to actually use the cue ball
      const ballY = TEST_POOL_BALLS[0].posY;
      /*
      // This code draws a line from the mouse to the cue ball
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(ballX, ballY);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
      */

      const r = Math.atan2(mousePos.y - ballY, mousePos.x - ballX);
      const ballOffset = 35;
      const handleOffset = 300;
      ctx.beginPath();
      ctx.moveTo(ballOffset * Math.cos(r) + ballX, ballOffset * Math.sin(r) + ballY);
      ctx.lineTo(handleOffset * Math.cos(r) + ballX, handleOffset * Math.sin(r) + ballY);
      ctx.strokeStyle = 'brown';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Draw the player placing down the cue ball
    function drawPlaceCueBall(ctx: CanvasRenderingContext2D) {
      TEST_POOL_BALLS[0].posX = mousePos.x;
      TEST_POOL_BALLS[0].posY = mousePos.y;
      // drawBall(ctx, TEST_POOL_BALLS[0]);
    }

    // Draw the player's inputs based on the current state of the game
    // If the the previous player scratched, the current player gets to place the cue ball
    if (scratch) {
      inputCanvasCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
      drawPlaceCueBall(inputCanvasCtx);
    }
    // When the current player needs to input a hit
    else if (isPlayersTurn) {
      inputCanvasCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
      drawCueStick(inputCanvasCtx);
    }
    // When the current player is spectating or waiting on the other player's move
    else if (spectating) {
      inputCanvasCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
    }
    // Catch unknown states
    else {
      console.log('no state found');
    }
  }, [isPlayersTurn, mousePos, scratch, spectating]);

  return (
    <div id='pool-canvas-container'>
      <canvas
        id='board canvas'
        className='pool-canvas'
        ref={boardCanvasRef}
        width='800'
        height='500'
        style={{ backgroundImage: POOL_TABLE_PATH, position: 'absolute' }}></canvas>
      <canvas
        id='input canvas'
        className='pool-canvas'
        ref={inputCanvasRef}
        width='800'
        height='500'
        style={{ backgroundImage: POOL_TABLE_PATH, position: 'absolute' }}></canvas>
      <div style={{ height: '500px' }}>{/* div to hold space for canvas */}</div>
      <div>
        {/* POOL TODO: delete this div*/}
        {/* Get mouse coordinates relative to element */}
        <hr />
        <hr />
        <hr />
        <div style={{ padding: '3rem', backgroundColor: 'lightgray' }}>
          <h2>
            Canvas coords: {mousePos.x} {mousePos.y}
          </h2>
        </div>

        <hr />
        <h2>
          Canvas coords: {mousePos.x} {mousePos.y}
        </h2>
      </div>
    </div>
  );
}
