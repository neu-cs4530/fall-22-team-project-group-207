import React, { useEffect, useRef, useState } from 'react';
import { PoolBall } from '../../../../types/CoveyTownSocket';
import { usePoolGameAreaController } from '../../../../classes/TownController';
import { addVectors, scale, subtractVectors, unitVector, Vector } from './PoolGame/Vector';
import PoolGameArea from './PoolGameArea';
import { CONFETTI_IMAGE, POOL_BALL_IMAGES, POOL_TABLE_IMAGE } from './PoolGameAssets/assets';
import useTownController from '../../../../hooks/useTownController';
import PoolCue from './PoolGame/PoolObjects/PoolCue';
import { Button } from '@chakra-ui/react';

const BALL_RADIUS = 0.028575; // m
const OUTSIDE_BORDER_WIDTH = 0.18; // m
const POOL_TABLE_LEFT_OFFSET = 50; // pixels
const POOL_TABLE_TOP_OFFSET = 52; // pixels
const POOL_TABLE_WIDTH = 1095; // pixels
const POOL_TABLE_HEIGHT = 588; // pixels
const METER_TO_PIXEL_SCALAR = 400.0; // scalar

/**
 * Function to convert position of a ball in meters to the pixel value, taking in all offsets from drawing
 * NOTE: A ball at position 0,0 would be in the center of the top-left pocket
 * @param position position of the ball in meters
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
 * Function to convert pixel value to position of a ball in meters
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
 * Returns an HTML element that renders the pool game, using an HTMLCanvasElement
 * @param poolGameArea PoolGameArea to be rendered
 * @returns HTML element containing pool game display
 */
export default function PoolGameCanvas({
  poolGameArea,
}: {
  poolGameArea: PoolGameArea;
}): JSX.Element {
  // Controllers
  const townController = useTownController();
  const [gameWinner, setGameWinner] = useState('');
  const poolGameAreaController = usePoolGameAreaController(poolGameArea.id);

  // Player move variables for shooting
  const [mouseClick1Pos, setMouseClick1Pos] = useState<{ x: number; y: number } | undefined>(
    undefined,
  );
  const [tickToggle, setTickToggle] = useState(false);

  // Coordinates of mouse
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Canvas for rendering the game
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // call gameTick on a timed loop
  useEffect(() => {
    const interval = setInterval(() => {
      poolGameAreaController.gameTick();
      setTickToggle(!tickToggle);
    }, 25);
    return () => {
      clearInterval(interval);
    };
  }, [poolGameAreaController, tickToggle]);

  // Handle mouse events, namely movement and clicking
  useEffect(() => {
    const canvas = boardCanvasRef.current;
    if (!canvas) {
      console.log('could not find canvasRef.current');
      return;
    }

    // Get local mouse coordinates
    const handleMouseMove = (event: MouseEvent) => {
      const target: HTMLElement = event.target as HTMLElement;
      if (target.tagName === canvas.tagName) {
        setMousePos({
          x: event.offsetX,
          y: event.offsetY,
        });
      }
    };

    // Handle user input based on the state of the game
    const handleMouseClick = (event: MouseEvent) => {
      // We ignore clicks outside the canvas
      if ((event.target as HTMLElement).tagName !== canvas.tagName) {
        return;
      }
      // Handle player's move
      const handlePlayerInput = () => {
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
                    (mouseClick1Pos.y - ballPos.y) ** 2 + (mouseClick1Pos.x - ballPos.x) ** 2,
                  ),
                  250,
                ),
                15,
              ) / 3;

            const velocity: Vector = scale(velocityUnitVector, velocityScalar);

            const collisionPoint: Vector = addVectors(
              cueBall.position,
              scale(velocityUnitVector, -BALL_RADIUS),
            );

            const cue: PoolCue = new PoolCue(velocity, collisionPoint);
            poolGameAreaController.poolMove(cue);
            setMouseClick1Pos(undefined);
          }
        }
      };

      if (
        poolGameAreaController.isGameStarted &&
        poolGameAreaController.poolBalls.find(p => p.isMoving) === undefined
      ) {
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
      }
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
   * useEffect to get game end condition
   */
  useEffect(() => {
    const setWinner = (winnerID: string) => {
      setGameWinner(winnerID);
    };
    poolGameAreaController.addListener('gameOver', setWinner);
    return () => {
      poolGameAreaController.removeListener('gameOver', setWinner);
    };
  }, [poolGameAreaController, townController]);

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
      const img = gameWinner ? CONFETTI_IMAGE[0] : POOL_TABLE_IMAGE[0];
      ctx.drawImage(
        img,
        POOL_TABLE_LEFT_OFFSET,
        POOL_TABLE_TOP_OFFSET,
        POOL_TABLE_WIDTH,
        POOL_TABLE_HEIGHT,
      );
    }

    /**
     * Draws one ball on the canvas, using the ball's coordinates as the center of the ball
     * (as opposed to top left)
     * @param ctx Canvas context
     * @param ball Pool ball to be drawn
     */
    function drawBall(ctx: CanvasRenderingContext2D, ball: PoolBall) {
      if (ball.isPocketed) {
        return;
      }

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

    /**
     * Draw win state on the canvas
     * @param ctx Canvas context
     */
    function drawWinState(ctx: CanvasRenderingContext2D) {
      const winner = townController.players.find(player => player.id === gameWinner)?.userName;
      ctx.font = 'small-caps bold 80px sans-serif';
      ctx.fillText('The Winner Is', 350, 300);
      ctx.fillText(winner?.concat('!') || 'No One!', 450, 400);
    }

    // Actually draw stuff
    boardCanvasCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    drawBoard(boardCanvasCtx);
    if (gameWinner) {
      drawWinState(boardCanvasCtx);
    } else {
      drawAllBalls(boardCanvasCtx, poolGameAreaController.poolBalls);
    }
  }, [poolGameAreaController.poolBalls, mousePos, tickToggle, gameWinner, townController.players]);

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
     * @param ctx canvas context
     */
    function drawPlaceCueBall(ctx: CanvasRenderingContext2D) {
      const displayPos = { x: mousePos.x, y: mousePos.y, z: 0 };

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

      let r: number; // Rotation about axis
      let ballOffset: number; // Distance from cue tip to ball
      let handleOffset: number; // Distance from cue handle to ball
      const ballPos = positionToPixels(ball.position);

      // Handle case where we are rotating around ball
      if (mouseClick1Pos === undefined) {
        r = Math.atan2(mousePos.y - ballPos.y, mousePos.x - ballPos.x);
        ballOffset = 30;
        handleOffset = 300;
      }
      // Handle case where we are selecting velocity
      else {
        r = Math.atan2(mouseClick1Pos.y - ballPos.y, mouseClick1Pos.x - ballPos.x);
        ballOffset = Math.max(
          Math.min(
            Math.sqrt(Math.pow(mousePos.y - ballPos.y, 2) + Math.pow(mousePos.x - ballPos.x, 2)),
            250,
          ),
          15,
        );
        handleOffset = ballOffset + 270;
      }
      ctx.beginPath();
      ctx.moveTo(ballOffset * Math.cos(r) + ballPos.x, ballOffset * Math.sin(r) + ballPos.y);
      ctx.lineTo(handleOffset * Math.cos(r) + ballPos.x, handleOffset * Math.sin(r) + ballPos.y);
      ctx.strokeStyle = 'brown';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Draw player's move
    const drawPlayerInput = () => {
      // Draw cue ball at player's mouse
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

    // Ensure that we don't display anything while the game is not started, and while balls are moving
    if (
      poolGameAreaController.isGameStarted &&
      poolGameAreaController.poolBalls.find(p => p.isMoving) === undefined
    ) {
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
    }
  }, [
    mouseClick1Pos,
    mousePos.x,
    mousePos.y,
    poolGameAreaController.isBallBeingPlaced,
    poolGameAreaController.isGameStarted,
    poolGameAreaController.isPlayer1Turn,
    poolGameAreaController.player1ID,
    poolGameAreaController.player2ID,
    poolGameAreaController.poolBalls,
    townController.userID,
  ]);

  return (
    <div id='pool-canvas-container'>
      <Button onClick={() => poolGameAreaController.startGame()}>Play Pool!</Button>
      <Button
        onClick={() => (poolGameAreaController.player1ID = townController.userID)}
        disabled={poolGameAreaController.player1ID !== undefined}>
        Join as Player 1
      </Button>
      <Button
        onClick={() => (poolGameAreaController.player2ID = townController.userID)}
        disabled={poolGameAreaController.player2ID !== undefined}>
        Join as Player 2
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
          poolGameAreaController.resetGame();
          setTickToggle(!tickToggle);
        }}>
        Reset Game
      </Button>
      <Button
        onClick={() => {
          poolGameAreaController.gameTick();
          setTickToggle(!tickToggle);
        }}>
        Tick Game
      </Button>
      <Button
        onClick={() => {
          poolGameAreaController.fastForward();
          setTickToggle(!tickToggle);
        }}>
        Fast Forward Game
      </Button>
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
      <div style={{ height: '670px' }}>{/* div to hold space for canvas */}</div>
    </div>
  );
}
