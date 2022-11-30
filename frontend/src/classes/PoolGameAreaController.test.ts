import { mock, mockClear, MockProxy } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import PoolBall from '../components/Town/interactables/GameAreas/PoolGame/PoolObjects/PoolBall';
import PoolCue from '../components/Town/interactables/GameAreas/PoolGame/PoolObjects/PoolCue';
import {
  PlayerLocation,
  PoolBall as PoolBallModel,
  PoolGameArea as PoolGameAreaModel,
} from '../types/CoveyTownSocket';
import PlayerController from './PlayerController';
import PoolGameAreaController, { PoolGameAreaEvents } from './PoolGameAreaController';
import TownController from './TownController';

describe('PoolGameAreaController', () => {
  // A valid PoolGameAreaController to be reused within the tests
  let testArea: PoolGameAreaController;
  let testAreaModel: PoolGameAreaModel;
  const townController: MockProxy<TownController> = mock<TownController>();
  let testUpdateAreaModel: PoolGameAreaModel;
  let initPoolBallModels: PoolBallModel[];
  const mockListeners = mock<PoolGameAreaEvents>();
  beforeEach(() => {
    const playerLocation: PlayerLocation = {
      moving: false,
      x: 0,
      y: 0,
      rotation: 'front',
    };
    const id = nanoid();
    const player1ID = nanoid();
    const player2ID = nanoid();
    const player1BallType = 'Stripes';
    const player2BallType = 'Solids';
    const isPlayer1Turn = true;
    const ballRadius = 0.028575;
    const initPoolBalls = [
      // cue ball at break position
      new PoolBall(0.847, 0.634, 0),
      // front of triangle
      new PoolBall(1.905, 0.634, 1),
      // second row
      new PoolBall(1.905 + 2 * ballRadius, 0.634 - ballRadius, 2),
      new PoolBall(1.905 + 2 * ballRadius, 0.634 + ballRadius, 9),
      // third row
      new PoolBall(1.905 + 4 * ballRadius, 0.634 - 2 * ballRadius, 3),
      new PoolBall(1.905 + 4 * ballRadius, 0.634, 8),
      new PoolBall(1.905 + 4 * ballRadius, 0.634 + 2 * ballRadius, 10),
      // fourth row
      new PoolBall(1.905 + 6 * ballRadius, 0.634 - 3 * ballRadius, 4),
      new PoolBall(1.905 + 6 * ballRadius, 0.634 - ballRadius, 14),
      new PoolBall(1.905 + 6 * ballRadius, 0.634 + ballRadius, 7),
      new PoolBall(1.905 + 6 * ballRadius, 0.634 + 3 * ballRadius, 11),
      // fifth row
      new PoolBall(1.905 + 8 * ballRadius, 0.634 - 4 * ballRadius, 12),
      new PoolBall(1.905 + 8 * ballRadius, 0.634 - 2 * ballRadius, 6),
      new PoolBall(1.905 + 8 * ballRadius, 0.634, 15),
      new PoolBall(1.905 + 8 * ballRadius, 0.634 + 2 * ballRadius, 13),
      new PoolBall(1.905 + 8 * ballRadius, 0.634 + 4 * ballRadius, 5),
    ];
    initPoolBallModels = initPoolBalls.map(ball => ball.toModel());
    const poolBall1: PoolBallModel = {
      angularOrientation: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      ballNumber: 0,
      ballType: 'CueBall',
      isMoving: false,
      isAirborne: false,
      isPocketed: false,
    };
    const poolBall2: PoolBallModel = {
      angularOrientation: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      position: { x: 5, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      ballNumber: 5,
      ballType: 'Solids',
      isMoving: false,
      isAirborne: false,
      isPocketed: false,
    };
    const poolBalls: PoolBallModel[] = [poolBall1, poolBall2];
    testArea = new PoolGameAreaController({
      id,
      player1ID,
      player2ID,
      player1BallType,
      player2BallType,
      isPlayer1Turn,
      poolBalls,
      isBallBeingPlaced: false,
    });
    testAreaModel = {
      id: id,
      player1ID: undefined,
      player2ID: undefined,
      player1BallType: undefined,
      player2BallType: undefined,
      playerIDToMove: undefined,
      isPlayer1Turn: false,
      isBallBeingPlaced: false,
      poolBalls: initPoolBallModels,
    };
    testUpdateAreaModel = {
      id: id,
      player1ID: player2ID,
      player2ID: player1ID,
      player1BallType: undefined,
      player2BallType: undefined,
      playerIDToMove: undefined,
      isPlayer1Turn: false,
      isBallBeingPlaced: false,
      poolBalls: initPoolBallModels,
    };
    testArea.occupants = [
      new PlayerController(nanoid(), nanoid(), playerLocation),
      new PlayerController(nanoid(), nanoid(), playerLocation),
      new PlayerController(nanoid(), nanoid(), playerLocation),
    ];

    mockClear(townController);
    mockClear(mockListeners.occupantsChange);
    mockClear(mockListeners.turnChange);
    mockClear(mockListeners.onTick);
    mockClear(mockListeners.playersChange);
    testArea.addListener('occupantsChange', mockListeners.occupantsChange);
    testArea.addListener('onTick', mockListeners.onTick);
    testArea.addListener('playersChange', mockListeners.playersChange);
    testArea.addListener('turnChange', mockListeners.turnChange);
    testArea.addListener('onBallPlacement', mockListeners.onBallPlacement);
    testArea.addListener('onHistoryUpdate', mockListeners.onHistoryUpdate);
  });
  // POOL TODO: write tests for PoolGameAreaController
  describe('setting the occupants property', () => {
    it('does not update the property if the new occupants are the same set as the old', () => {
      const origOccupants = testArea.occupants;
      const occupantsCopy = testArea.occupants.concat([]);
      const shuffledOccupants = occupantsCopy.reverse();
      testArea.occupants = shuffledOccupants;
      expect(testArea.occupants).toEqual(origOccupants);
      expect(mockListeners.occupantsChange).not.toBeCalled();
    });
    it('emits the occupantsChange event when setting the property and updates the model', () => {
      const newOccupants = testArea.occupants.slice(1);
      testArea.occupants = newOccupants;
      expect(testArea.occupants).toEqual(newOccupants);
      expect(mockListeners.occupantsChange).toBeCalledWith(newOccupants);
    });
  });
  describe('toPoolGameAreaModel', () => {
    it('Carries through all of the properties', () => {
      const model = testArea.toPoolGameAreaModel();
      expect(model).toEqual(testAreaModel);
    });
  });
  describe('updateFrom', () => {
    it('Carries through all of the properties', () => {
      testArea.updateFrom(testUpdateAreaModel);
      expect(testArea.toPoolGameAreaModel()).toEqual(testUpdateAreaModel);
    });
  });
  describe('isGameOver', () => {
    it('Recognizes when the game is over and player 1 wins', () => {
      const player1ID = nanoid();
      const player2ID = nanoid();
      const player1BallType = 'Solids';
      const player2BallType = 'Stripes';
      testUpdateAreaModel = {
        id: testArea.id,
        player1ID: player1ID,
        player2ID: player2ID,
        player1BallType: player1BallType,
        player2BallType: player2BallType,
        playerIDToMove: player1ID,
        isPlayer1Turn: true,
        isBallBeingPlaced: false,
        poolBalls: initPoolBallModels,
      };
      testArea.updateFrom(testUpdateAreaModel);
      testArea.poolBalls.map(ball => {
        if (ball.ballNumber !== 0 && ball.ballNumber <= 8) {
          ball.isPocketed = true;
        }
      });
      testArea.updatePocketedBalls();
      expect(testArea.isGameOver()).toEqual({ isGameOver: true, didPlayer1Win: true });
    });
    it('Recognizes when the game is over but player 2 wins because player 1 pocketed 8 ball', () => {
      const player1ID = nanoid();
      const player2ID = nanoid();
      const player1BallType = 'Solids';
      const player2BallType = 'Stripes';
      testUpdateAreaModel = {
        id: testArea.id,
        player1ID: player1ID,
        player2ID: player2ID,
        player1BallType: player1BallType,
        player2BallType: player2BallType,
        playerIDToMove: player1ID,
        isPlayer1Turn: true,
        isBallBeingPlaced: false,
        poolBalls: initPoolBallModels,
      };
      testArea.updateFrom(testUpdateAreaModel);
      testArea.poolBalls.map(ball => {
        if ((ball.ballNumber !== 0 && ball.ballNumber <= 5) || ball.ballNumber === 8) {
          ball.isPocketed = true;
        }
      });
      testArea.updatePocketedBalls();
      expect(testArea.isGameOver()).toEqual({ isGameOver: true, didPlayer1Win: false });
    });
  });
  describe('getBallTypeByNumber', () => {
    it('Accurately returns the correct ball type for the given number', () => {
      expect(testArea.getBallTypeByNumber(5)).toEqual('Solids');
      expect(testArea.getBallTypeByNumber(13)).toEqual('Stripes');
      expect(testArea.getBallTypeByNumber(8)).toEqual('8ball');
      expect(testArea.getBallTypeByNumber(0)).toEqual('CueBall');
      expect(testArea.getBallTypeByNumber(17)).toEqual('Invalid');
    });
  });
  describe('gameTick', () => {
    it('emits the onTick event', () => {
      const currentTick = testArea.currentTick;
      testArea.isGameStarted = true;
      testArea.gameTick();
      expect(mockListeners.onTick).toBeCalled();
      expect(testArea.currentTick).toEqual(currentTick + 1);
    });
  });
  describe('occupantsChange', () => {
    it('emits the occupantsChange event', () => {
      testArea.occupants = testArea.occupants.slice(1);
      expect(mockListeners.occupantsChange).toBeCalled();
    });
  });
  describe('playersChange', () => {
    it('emits the playerChange event', () => {
      const nonPlayer1 = testArea.occupants.filter(player => player.id != testArea.player1ID)[0];
      testArea.player1ID = nonPlayer1.id;
      expect(mockListeners.playersChange).toBeCalled();
    });
  });
  describe('turnChange', () => {
    it('emits the playerCturnChangehange event', () => {
      testArea.isPlayer1Turn = true;
      expect(mockListeners.turnChange).toBeCalled();
    });
  });
  describe('onHistoryUpdate', () => {
    it('emits the onHistoryUpdate event', () => {
      testArea.poolMove(new PoolCue({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }));
      expect(mockListeners.onHistoryUpdate).toBeCalled();
    });
  });
});
