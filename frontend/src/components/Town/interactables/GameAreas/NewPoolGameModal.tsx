import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react'; // useState
import { useInteractable } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import PoolGameCanvas from './PoolGameCanvas';
import { PoolGameArea as PoolGameAreaModel } from '../../../../types/CoveyTownSocket';
import PoolGameArea from './PoolGameArea';
import PoolLeaderboard from './PoolLeaderboardModal';

/**
 * Returns a modal that contains a display for the pool game
 * @returns HTML modal containing pool game display
 */
export default function NewPoolGameModal(): JSX.Element {
  const townController = useTownController();
  const poolGameArea = useInteractable<PoolGameArea>('gameArea');
  const [viewLeaderboard, setViewLeaderboard] = useState(false);
  const [gameState, setGameState] = useState<PoolGameAreaModel>();

  const isOpen = poolGameArea !== undefined;

  useEffect(() => {
    if (poolGameArea) {
      townController.pause();
      console.log('started game and paused coveytown');
    } else {
      townController.unPause();
      console.log('ended game and unpaused coveytown');
    }
  }, [townController, poolGameArea]);

  const closeModal = useCallback(() => {
    if (poolGameArea) {
      townController.interactEnd(poolGameArea);
    }
  }, [townController, poolGameArea]);

  const toast = useToast();

  useCallback(async () => {
    if (gameState && poolGameArea) {
      const poolGameToCreate: PoolGameAreaModel = {
        id: poolGameArea.id,
        // player1ID: ,
        // player2ID: ,
        isPlayer1Turn: gameState.isPlayer1Turn,
        player1BallType: gameState.player1BallType,
        player2BallType: gameState.player2BallType,
        isBallBeingPlaced: gameState.isBallBeingPlaced,
        poolBalls: gameState.poolBalls,
      };
      try {
        await townController.createPoolGameArea(poolGameToCreate); // POOL TODO: fix this
        // we could probably change this to take in a PoolGameModel
        toast({
          title: 'Pool Area Created!',
          status: 'success',
        });
        setGameState(gameState);
        townController.unPause();
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
  }, [gameState, setGameState, townController, poolGameArea, closeModal, toast]);

  if (poolGameArea) {
    return (
      <Modal
        closeOnOverlayClick={false}
        isOpen={isOpen}
        onClose={() => {
          closeModal();
          townController.unPause();
        }}>
        <ModalOverlay />
        <ModalContent maxW='1210px' height='1000px'>
          <ModalHeader>Play Pool!!!</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Button onClick={() => setViewLeaderboard(true)} hidden={viewLeaderboard}>
              View Leaderboard
            </Button>
            <Button onClick={() => setViewLeaderboard(false)} hidden={!viewLeaderboard}>
              Back
            </Button>
            {viewLeaderboard && <PoolLeaderboard />}
            {!viewLeaderboard && <PoolGameCanvas poolGameArea={poolGameArea} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
