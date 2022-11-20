import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { PoolGameState } from '../../../../classes/PoolGameAreaController';
import { useInteractable } from '../../../../classes/TownController';
import { PoolGameArea } from '../../../../generated/client';
import useTownController from '../../../../hooks/useTownController';

export default function NewPoolGameModal(): JSX.Element {
  const coveyTownController = useTownController();
  const newPoolGame = useInteractable('gameArea');
  const [gameState, setGameState] = useState<PoolGameState>();

  const isOpen = newPoolGame !== undefined;

  useEffect(() => {
    console.log('interacted with pool area');
    if (newPoolGame) {
      coveyTownController.pause();
      console.log('started game and paused coveytown');
    } else {
      coveyTownController.unPause();
      console.log('ended game and unpaused coveytown');
    }
  }, [coveyTownController, newPoolGame]);

  const closeModal = useCallback(() => {
    if (newPoolGame) {
      coveyTownController.interactEnd(newPoolGame);
    }
  }, [coveyTownController, newPoolGame]);

  const toast = useToast();

  /**
    export type PoolGameArea = {
      id: string;
      player1ID?: string;
      player2ID?: string;
      player1BallType?: string;
      player2BallType?: string;
      isPlayer1Turn: boolean;
      poolBalls: Array<PoolBall>;
    };

    type PoolGameState = {
      poolBalls: FrontEndPoolBall[];
      player1BallType: BallType;
      player2BallType: BallType;
      isPlayer1Turn: boolean;
    }
   */
  const createPoolGame = useCallback(async () => {
    if (gameState && newPoolGame) {
      const poolGameToCreate: PoolGameArea = {
        id: newPoolGame.id,
        // player1ID: ,
        // player2ID: ,
        isPlayer1Turn: gameState.isPlayer1Turn,
        player1BallType: gameState.player1BallType,
        player2BallType: gameState.player2BallType,
        poolBalls: [], //gameState.poolBalls.map(b => b), // POOL TODO: convert from frontend to backend balls
      };
      try {
        await coveyTownController.createPoolGameArea(poolGameToCreate);
        toast({
          title: 'Pool Area Created!',
          status: 'success',
        });
        setGameState(gameState);
        coveyTownController.unPause();
        closeModal();
      } catch (err) {
        if (err instanceof Error) {
          toast({
            title: 'Unable to create pool area',
            description: err.toString(),
            status: 'error',
          });
        } else {
          console.trace(err);
          toast({
            title: 'Unexpected Error',
            status: 'error',
          });
        }
      }
    }
  }, [gameState, setGameState, coveyTownController, newPoolGame, closeModal, toast]);

  const drawRect = (
    info = { x: 0, y: 0, width: 1, height: 1 },
    style = { borderColor: 'black', borderWidth: 1 },
  ) => {
    const { x, y, width, height } = info;
    const { borderColor, borderWidth } = style;

    // ctx.beginPath();
    // ctx.strokeStyle = borderColor;
    // ctx.lineWidth = borderWidth;
    // ctx.rect(x, y, w, h);
    // ctx.stroke();
  };

  const drawSphere = (
    info = { x: 0, y: 0, radius: 1 },
    style = { borderColor: 'black', borderWidth: 1 },
  ) => {
    const { x, y, radius } = info;
    const { borderColor, borderWidth } = style;
  };

  const drawTable = (table = { x: 10, y: 10, width: 100, height: 100 }) => {
    return;
  };

  const drawBall = (
    ball = { x: 1, y: 2, z: 3, rotation: '123' },
    table = { x: 10, y: 10, width: 100, height: 100 },
  ) => {
    return;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Play Pool!!!</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <canvas id='canvas' width='490' height='490'></canvas>
          <p>
            there is a canvas above this... it&apos;s just invisible for now xD trust me its there
            :)
          </p>
          <p>
            the code for this is visible in NewPoolGameModal.tsx in interactables/GameAreas folder
          </p>
          <p>
            Stuff todo: make the pool thingy actually draw in the canvas... need to figure out how
            to find the canvas through the code to update it through react...
          </p>
          {/**
           * some references:
           * https://kernhanda.github.io/tutorial-typescript-canvas-drawing/
           * https://www.cluemediator.com/draw-a-line-on-canvas-using-react/
           */}
          <p>also maybe figure out how to make the modal bigger lol</p>
        </ModalBody>
        <ModalFooter>footer here</ModalFooter>
      </ModalContent>
    </Modal>
  );
}
