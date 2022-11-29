import React, { useEffect, useRef, useState } from 'react';
import { PoolBall, PoolGameArea as PoolGameAreaModel } from '../../../../types/CoveyTownSocket';
import { usePoolGameAreaController } from '../../../../classes/TownController';
import { addVectors, scale, subtractVectors, unitVector, Vector } from './PoolGame/Vector';
import PoolGameArea from './PoolGameArea';
import { POOL_BALL_IMAGES, POOL_TABLE_IMAGE } from './PoolGameAssets/assets';
import useTownController from '../../../../hooks/useTownController';
import PoolCue from './PoolGame/PoolObjects/PoolCue';
import { Button } from '@chakra-ui/react';

const BALL_RADIUS = 0.028575; // m
const OUTSIDE_BORDER_WIDTH = 0.18; // m
const POOL_TABLE_WIDTH = 2.9; // m
const POOL_TABLE_HEIGHT = 1.63; // m
const METER_TO_PIXEL_SCALAR = 400.0; // scalar

/**
 * function to convert position of a ball in meters to the pixel value
 * @param position position of the ball in m
 * @returns new position of the ball to draw in pixels
 */
const positionToPixels = (position: Vector) => {
  const newPos: Vector = {
    x: position.x + OUTSIDE_BORDER_WIDTH,
    y: position.y + OUTSIDE_BORDER_WIDTH,
    z: position.z,
  };
  return scale(newPos, METER_TO_PIXEL_SCALAR);
};

/**
 * Returns a canvas that renders the pool game
 * @returns HTML canvas containing pool game display
 */
export default function PoolGameCanvas({
  poolGameArea,
}: {
  poolGameArea: PoolGameArea;
}): JSX.Element {
  // POOL TODO: add react hooks for game state so we can update this with the pool balls
  const townController = useTownController();
  const poolGameAreaController = usePoolGameAreaController(poolGameArea.id);
  const [gameState, setGameState] = useState<PoolGameAreaModel>(
    poolGameAreaController.currentModel,
  );
  console.log('POOL TODO: setGameState log to remove eslint error' + setGameState);

  // Coordinates of mouse
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Canvas for rendering the game
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // States for joining the game
  const [player1IDEnabled, setPlayer1IDEnabled] = useState<boolean>(
    poolGameAreaController.player1ID === undefined,
  );
  const [player2IDEnabled, setPlayer2IDEnabled] = useState<boolean>(
    poolGameAreaController.player2ID === undefined,
  );

  // Handle clicking the join game buttons
  useEffect(() => {
    setPlayer1IDEnabled(poolGameAreaController.player1ID === undefined);
    setPlayer2IDEnabled(poolGameAreaController.player2ID === undefined);
  }, [poolGameAreaController.player1ID, poolGameAreaController.player2ID]);

  // Handle mouse events, namely movement and clicking
  useEffect(() => {
    const canvas = boardCanvasRef.current;
    if (!canvas) {
      console.log('could not find canvasRef.current');
      return;
    }
    const canvasRect = canvas.getBoundingClientRect();

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
      const handlePlayerInput = () => {
        // Handle player's move
        // Place down a ball
        if (poolGameAreaController.isBallBeingPlaced) {
          // POOL TODO: update game controller with new cue ball position
        }
        // When the current player needs to input a hit
        else {
          const cueBall = gameState.poolBalls.find(p => {
            return p.ballNumber === 0;
          });
          if (!cueBall) {
            console.log('could not find cue ball');
            return;
          }
          const velocityUnitVector: Vector = unitVector(
            subtractVectors(cueBall.position, {
              x: mousePos.x / METER_TO_PIXEL_SCALAR,
              y: cueBall.position.y,
              z: mousePos.y / METER_TO_PIXEL_SCALAR,
            }),
          );
          const velocity: Vector = scale(velocityUnitVector, 0.1); // POOL TODO: get scalar for velocity

          const collisionPoint: Vector = addVectors(
            cueBall.position,
            scale(velocityUnitVector, -BALL_RADIUS),
          );

          console.log(velocity, collisionPoint);
          const cue: PoolCue = new PoolCue(velocity, collisionPoint);
          poolGameAreaController.poolPhysicsGoHere(cue);
        }
      };

      // Draw the player's inputs based on the current state of the game
      // If the the previous player scratched, the current player gets to place the cue ball
      if (
        // Player 1's turn, Player 1 is this player
        poolGameAreaController.isPlayer1Turn &&
        townController.userID === poolGameAreaController.player1ID
      ) {
        // Player 1 gets to move
        handlePlayerInput();
      } else if (
        // Player 2's turn, Player 2 is this player
        !poolGameAreaController.isPlayer1Turn &&
        townController.userID === poolGameAreaController.player2ID
      ) {
        // Player 2 gets to move
        handlePlayerInput();
      } else {
        // Do nothing
      }
    };
    // Listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseClick);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseClick);
    };
  }, [gameState.poolBalls, mousePos.x, mousePos.y, poolGameAreaController, townController.userID]);

  /**
   * useEffect to render the board state and ball movements
   */
  useEffect(() => {
    // Set up context for board
    const boardCanvas = boardCanvasRef.current;
    if (!boardCanvas) {
      console.log('could not find boardCanvas');
      return;
    }
    boardCanvasCtxRef.current = boardCanvas.getContext('2d');
    const boardCanvasCtx = boardCanvasCtxRef.current;
    if (!boardCanvasCtx) {
      console.log('could not find boardCanvasCtx');
      return;
    }

    /**
     * Draws the board on the canvas
     * @param ctx Canvas context
     */
    function drawBoard(ctx: CanvasRenderingContext2D) {
      const img = POOL_TABLE_IMAGE[0];
      ctx.drawImage(
        img,
        0,
        0,
        POOL_TABLE_WIDTH * METER_TO_PIXEL_SCALAR,
        POOL_TABLE_HEIGHT * METER_TO_PIXEL_SCALAR,
      );
    }

    /**
     * Draws one ball on the canvas, using the ball's coordinates as the center of the ball
     * (as opposed to top left)
     * @param ctx Canvas context
     * @param ball Pool ball to be drawn
     */
    function drawBall(ctx: CanvasRenderingContext2D, ball: PoolBall) {
      const displayPos = positionToPixels(ball.position);

      const img = POOL_BALL_IMAGES[ball.ballNumber];
      const radius = BALL_RADIUS * METER_TO_PIXEL_SCALAR;
      const diameter = radius * 2;
      ctx.drawImage(img, displayPos.x - radius, displayPos.y - radius, diameter, diameter);
    }

    /**
     * Draw all balls on the canvas
     * @param ctx Canvas context
     * @param balls Pool balls to be drawn
     */
    function drawAllBalls(ctx: CanvasRenderingContext2D, balls: PoolBall[]) {
      balls.map(ball => drawBall(ctx, ball));
    }

    // Actually draw stuff
    boardCanvasCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    drawBoard(boardCanvasCtx);
    drawAllBalls(boardCanvasCtx, gameState.poolBalls);
  }, [gameState.poolBalls]);

  /**
   * useEffect to render the player's inputs to the game
   */
  useEffect(() => {
    // Set up context for player input
    const inputCanvas = inputCanvasRef.current;
    if (!inputCanvas) {
      console.log('could not find inputCanvas');
      return;
    }
    inputCanvasCtxRef.current = inputCanvas.getContext('2d');
    const inputCanvasCtx = inputCanvasCtxRef.current;
    if (!inputCanvasCtx) {
      console.log('could not find inputCanvasCtx');
      return;
    }

    /**
     * Draw the cue stick if the player is making a move
     * @param ctx Canvas context
     */
    function drawCueStick(ctx: CanvasRenderingContext2D) {
      const ball = poolGameAreaController.poolBalls.find(p => {
        return p.ballNumber === 0;
      });
      if (!ball) {
        console.log('could not find ball');
        return;
      }

      const ballPos = positionToPixels(ball.position);

      const r = Math.atan2(mousePos.y - ballPos.y, mousePos.x - ballPos.y);
      const ballOffset = 35;
      const handleOffset = 300;
      ctx.beginPath();
      ctx.moveTo(ballOffset * Math.cos(r) + ballPos.x, ballOffset * Math.sin(r) + ballPos.y);
      ctx.lineTo(handleOffset * Math.cos(r) + ballPos.x, handleOffset * Math.sin(r) + ballPos.y);
      ctx.strokeStyle = 'brown';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    const drawPlayerInput = () => {
      // Draw player's move
      if (poolGameAreaController.isBallBeingPlaced) {
        inputCanvasCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
        // drawPlaceCueBall(inputCanvasCtx);
      }
      // When the current player needs to input a hit
      else {
        inputCanvasCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
        drawCueStick(inputCanvasCtx);
      }
    };

    console.log('isplayer1turn ' + !poolGameAreaController.isPlayer1Turn + ' end');
    console.log('player1id ' + poolGameAreaController.player1ID + ' end');
    console.log('player2id ' + poolGameAreaController.player2ID + ' end');
    console.log('myid ' + townController.userID + ' end');

    // Draw the player's inputs based on the current state of the game
    // If the the previous player scratched, the current player gets to place the cue ball
    if (
      // Player 1's turn, Player 1 is this player
      poolGameAreaController.isPlayer1Turn &&
      townController.userID === poolGameAreaController.player1ID
    ) {
      // Player 1 gets to move
      drawPlayerInput();
    } else if (
      // Player 2's turn, Player 2 is this player
      !poolGameAreaController.isPlayer1Turn &&
      townController.userID === poolGameAreaController.player2ID
    ) {
      // Player 2 gets to move
      drawPlayerInput();
    } else {
      // When the current player is spectating or waiting on the other player's move
      inputCanvasCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
    }
  }, [
    mousePos,
    poolGameAreaController,
    poolGameAreaController.isBallBeingPlaced,
    poolGameAreaController.isPlayer1Turn,
    poolGameAreaController.players,
    poolGameAreaController.poolBalls,
    townController.userID,
  ]);

  return (
    <div id='pool-canvas-container'>
      <Button onClick={() => poolGameAreaController.startGame()}>Play Pool!</Button>
      <Button
        onClick={() => (poolGameAreaController.player1ID = townController.userID)}
        disabled={!player1IDEnabled}>
        Join as player 1
      </Button>
      <Button
        onClick={() => (poolGameAreaController.player2ID = townController.userID)}
        disabled={!player2IDEnabled}>
        Join as player 2
      </Button>
      <canvas
        id='board canvas'
        className='pool-canvas'
        ref={boardCanvasRef}
        width='1600'
        height='800'
        style={{ position: 'absolute' }}></canvas>
      <canvas
        id='input canvas'
        className='pool-canvas'
        ref={inputCanvasRef}
        width='1600'
        height='800'
        style={{ position: 'absolute' }}></canvas>
      <div style={{ height: '1000px' }}>{/* div to hold space for canvas */}</div>
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
