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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PoolGameModel } from '../../../../classes/PoolGameAreaController';
import { useInteractable } from '../../../../classes/TownController';
import { PoolGameArea } from '../../../../generated/client';
import useTownController from '../../../../hooks/useTownController';
import PoolGameCanvas from './PoolGameCanvas';

/**
 * Returns a modal that contains a display for the pool game
 * @returns HTML modal containing pool game display
 */
export default function NewPoolGameModal(): JSX.Element {
  const coveyTownController = useTownController();
  const newPoolGame = useInteractable('gameArea');
  const [gameState, setGameState] = useState<PoolGameModel>();

  const isOpen = newPoolGame !== undefined;

  useEffect(() => {
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
   * The datatypes we are working with
   * POOL TODO: finalize these and update once datatype for frontend-backend communication is finalized
   * 
    export type PoolGameArea = {
      id: string;
      player1ID?: string;
      player2ID?: string;
      player1BallType?: string;
      player2BallType?: string;
      isPlayer1Turn: boolean;
      poolBalls: Array<PoolBall>;
    };

    type PoolGameModel = {
      poolBalls: FrontEndPoolBall[];
      player1BallType: BallType;
      player2BallType: BallType;
      isPlayer1Turn: boolean;
    }
   */
  const createPoolGame = useCallback(async () => {
    if (gameState && newPoolGame) {
      const poolGameToCreate: PoolGameModel = {
        // id: newPoolGame.id,
        // player1ID: ,
        // player2ID: ,
        isPlayer1Turn: gameState.isPlayer1Turn,
        player1BallType: gameState.player1BallType,
        player2BallType: gameState.player2BallType,
        isBallBeingPlaced: false,
        poolBalls: [], //gameState.poolBalls.map(b => b), // POOL TODO: convert from frontend to backend balls
      };
      try {
        // await coveyTownController.createPoolGameArea(poolGameToCreate); // POOL TODO: fix this
        // we could probably change this to take in a PoolGameModel
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

  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent maxW='1000px' height='800px'>
        <ModalHeader>Play Pool!!!</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <PoolGameCanvas poolGameModel={gameState} />
          {/**
           * POOL TODO: update poolGameArea above to be not undefined
           * some references:
           * https://kernhanda.github.io/tutorial-typescript-canvas-drawing/
           * https://www.cluemediator.com/draw-a-line-on-canvas-using-react/
           */}
        </ModalBody>
        <ModalFooter>exit</ModalFooter>
      </ModalContent>
    </Modal>
  );
}
