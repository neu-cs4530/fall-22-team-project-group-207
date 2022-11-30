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
const MOUSE_LEFT_OFFSET = 0;
const MOUSE_TOP_OFFSET = 70;

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
 * function to convert pixel value to position of a ball in meters
 * @param position position of the ball in pixels
 * @returns new position of the ball in meters
 */
const pixelsToPosition = (position: Vector) => {
  const newPos: Vector = {
    x: position.x,
    y: position.y,
    z: position.z,
  };
  return subtractVectors(scale(newPos, 1 / METER_TO_PIXEL_SCALAR), {
    x: OUTSIDE_BORDER_WIDTH,
    y: OUTSIDE_BORDER_WIDTH,
    z: 0,
  });
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
  // Controllers
  const townController = useTownController();
  const poolGameAreaController = usePoolGameAreaController(poolGameArea.id);

  // Player move variables for shooting
  const [mouseClick1Pos, setMouseClick1Pos] = useState<{ x: number; y: number } | undefined>(
    undefined,
  );

  // Coordinates of mouse
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Canvas for rendering the game
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    console.log('got pool ball update');
    console.log(poolGameAreaController.poolBalls.find(p => p.ballNumber === 0)?.position);
    console.log(poolGameAreaController.poolBalls.find(p => p.ballNumber === 0)?.velocity);
  }, [poolGameAreaController]);

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
        x: event.screenX - canvasRect.x - MOUSE_LEFT_OFFSET,
        y: event.screenY - canvasRect.y - MOUSE_TOP_OFFSET,
      });
    };

    // POOL TODO: remove this
    // poolGameAreaController.poolBalls.map(p =>
    //   console.log(
    //     'ball number ' +
    //       p.ballNumber +
    //       ' pos: ' +
    //       p.position.x +
    //       ' ' +
    //       p.position.y +
    //       ' ' +
    //       p.position.z,
    //   ),
    // );

    // Handle user input based on the state of the game
    const handleMouseClick = () => {
      // If click out of bounds, don't process it
      if (mousePos.x < 0 || mousePos.x > 1170 || mousePos.y < 0 || mousePos.y > 670) {
        console.log('suppressed click');
        return;
      }
      // const qwe: Vector = pixelsToPosition({ x: mousePos.x, y: mousePos.y, z: 0 });
      console.log('player clicked at ' + mousePos.x + ' ' + mousePos.y);
      // console.log('player clicked at ' + qwe.x + ' ' + qwe.y);
      // if (mouseClick1Pos) {
      //   console.log('saved mouse click ' + mouseClick1Pos.x + ' ' + mouseClick1Pos.y);
      // }
      // console.log('isplayer1turn ' + poolGameAreaController.isPlayer1Turn + ' end');
      // console.log('place ball ' + poolGameAreaController.isBallBeingPlaced + ' end');
      // console.log('player1id ' + poolGameAreaController.player1ID + ' end');
      // console.log('player2id ' + poolGameAreaController.player2ID + ' end');
      // console.log('myid ' + townController.userID + ' end');
      console.log('isGameStarted ' + poolGameAreaController.isGameStarted);
      console.log(
        'cue ball moving? ' +
          poolGameAreaController.poolBalls.find(p => p.ballNumber === 0)?.isMoving,
      );

      const handlePlayerInput = () => {
        // Handle player's move
        // Place down a ball
        if (poolGameAreaController.isBallBeingPlaced) {
          const pos: Vector = {
            x: mousePos.x,
            y: mousePos.y,
            z: 0,
          };
          poolGameAreaController.placeCueBall(pixelsToPosition(pos));
        }
        // When the current player needs to input a hit
        else {
          // When the player needs to input angle
          if (mouseClick1Pos === undefined) {
            setMouseClick1Pos(mousePos);
          }
          // When the player needs to input velocity
          else {
            const cueBall = poolGameAreaController.poolBalls.find(p => {
              return p.ballNumber === 0;
            });
            if (!cueBall) {
              console.log('could not find cue ball');
              return;
            }

            const mouseClickPosMeters = pixelsToPosition({
              x: mouseClick1Pos.x,
              y: mouseClick1Pos.y,
              z: 0,
            });
            const velocityUnitVector: Vector = unitVector(
              subtractVectors(cueBall.position, {
                x: mouseClickPosMeters.x,
                y: mouseClickPosMeters.y,
                z: 0,
              }),
            );

            const ballPos = positionToPixels(cueBall.position);
            const velocityScalar =
              Math.max(
                Math.min(
                  Math.sqrt(
                    Math.pow(mouseClick1Pos.y - ballPos.y, 2) +
                      Math.pow(mouseClick1Pos.x - ballPos.x, 2),
                  ),
                  200,
                ),
                15,
              ) / 10;

            const velocity: Vector = scale(velocityUnitVector, velocityScalar); // POOL TODO: get scalar for velocity

            const collisionPoint: Vector = addVectors(
              cueBall.position,
              scale(velocityUnitVector, -BALL_RADIUS),
            );

            console.log(mouseClick1Pos);
            console.log(velocity, velocityUnitVector, velocityScalar, collisionPoint);
            const cue: PoolCue = new PoolCue(velocity, collisionPoint);
            console.log('making pool move');
            poolGameAreaController.poolMove(cue);
            setMouseClick1Pos(undefined);
          }
        }
      };

      //if (poolGameAreaController.isPlaying) {
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
      //  }
    };
    // Listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseClick);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseClick);
    };
  }, [mouseClick1Pos, mousePos, poolGameAreaController, townController.userID]);

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
    drawAllBalls(boardCanvasCtx, poolGameAreaController.poolBalls);
  }, [poolGameAreaController.poolBalls, mousePos]);

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
     * Draw the cue ball's position when the player is placing it
     * @param ctx
     * @returns
     */
    function drawPlaceCueBall(ctx: CanvasRenderingContext2D) {
      const displayPos = { x: mousePos.x, y: mousePos.y, z: BALL_RADIUS };

      const img = POOL_BALL_IMAGES[0];
      const radius = BALL_RADIUS * METER_TO_PIXEL_SCALAR;
      const diameter = radius * 2;
      ctx.drawImage(img, displayPos.x - radius, displayPos.y - radius, diameter, diameter);
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

      let r: number;
      let ballOffset: number;
      let handleOffset: number;
      const ballPos = positionToPixels(ball.position);

      if (mouseClick1Pos === undefined) {
        r = Math.atan2(mousePos.y - ballPos.y, mousePos.x - ballPos.x);
        ballOffset = 30;
        handleOffset = 300;
      } else {
        r = Math.atan2(mouseClick1Pos.y - ballPos.y, mouseClick1Pos.x - ballPos.x);
        ballOffset = Math.max(
          Math.min(
            Math.sqrt(Math.pow(mousePos.y - ballPos.y, 2) + Math.pow(mousePos.x - ballPos.x, 2)),
            200,
          ),
          15,
        );
        handleOffset = ballOffset + 270;
        // console.log('mousePos ' + mousePos.x + ' ' + mousePos.y);
        // console.log('ball pos' + ballPos.x + ' ' + ballPos.y);
        // console.log('ballOffset ' + ballOffset);
        // console.log('handleOffset ' + handleOffset);
      }
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
        drawPlaceCueBall(inputCanvasCtx);
      }
      // When the current player needs to input a hit
      else {
        inputCanvasCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
        drawCueStick(inputCanvasCtx);
      }
    };

    //if (poolGameAreaController.isPlaying) {
    // Draw the player's inputs based on the current state of the game
    // If the the previous player scratched, the current player gets to place the cue ball
    if (
      // Player 1's turn, Player 1 is this player
      poolGameAreaController.isPlayer1Turn &&
      townController.userID === poolGameAreaController.player1ID
    ) {
      // Player 1 gets to move, draw the cue stick
      drawPlayerInput();
    } else if (
      // Player 2's turn, Player 2 is this player
      !poolGameAreaController.isPlayer1Turn &&
      townController.userID === poolGameAreaController.player2ID
    ) {
      // Player 2 gets to move, draw the cue stick
      drawPlayerInput();
    } else {
      // When the current player is spectating or waiting on the other player's move
      inputCanvasCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
    }
    //}
  }, [
    mouseClick1Pos,
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
        disabled={poolGameAreaController.player1ID !== undefined}>
        Join as player 1
      </Button>
      <Button
        onClick={() => (poolGameAreaController.player2ID = townController.userID)}
        disabled={poolGameAreaController.player2ID !== undefined}>
        Join as player 2
      </Button>
      <Button
        onClick={() => poolGameAreaController.removePlayer(townController.userID)}
        disabled={
          poolGameAreaController.player1ID !== townController.userID &&
          poolGameAreaController.player2ID !== townController.userID
        }>
        Leave Game
      </Button>
      <Button
        onClick={() => {
          console.log('click reset game button');
          poolGameAreaController.resetGame();
        }}>
        Reset game
      </Button>
      <Button onClick={() => poolGameAreaController.gameTick()}>Tick game</Button>
      <canvas
        id='board canvas'
        className='pool-canvas'
        ref={boardCanvasRef}
        width='1170'
        height='670'
        style={{ position: 'absolute' }}></canvas>
      <canvas
        id='input canvas'
        className='pool-canvas'
        ref={inputCanvasRef}
        width='1170'
        height='670'
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
