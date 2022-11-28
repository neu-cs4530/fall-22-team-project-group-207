//import { mock, mockClear /*, MockProxy*/ } from 'jest-mock-extended';
/*
import { nanoid } from 'nanoid';
import { PlayerLocation, PoolBall } from '../types/CoveyTownSocket';
import PlayerController from './PlayerController';
import PoolGameAreaController, { PoolGameAreaEvents } from './PoolGameAreaController';
import TownController from './TownController';*/

export {};
describe('sample test', () => {
  it('sample test 2', () => {
    expect(123).toBe(123);
  });
});

/*
describe('PoolGameAreaController', () => {
  // A valid PoolGameAreaController to be reused within the tests
  let testArea: PoolGameAreaController;
  //const townController: MockProxy<TownController> = mock<TownController>();
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
    const poolBall1: PoolBall = {
      posnX: 0,
      posnY: 0,
      ballNumber: 0,
      ballType: 'Cue',
      orientation: '',
      isPocketed: false,
      isMoving: false,
    };
    const poolBall2: PoolBall = {
      posnX: 5,
      posnY: 0,
      ballNumber: 1,
      ballType: 'Solid',
      orientation: '',
      isPocketed: false,
      isMoving: false,
    };
    const poolBalls: PoolBall[] = [poolBall1, poolBall2];
    testArea = new PoolGameAreaController({
      id,
      player1ID,
      player2ID,
      player1BallType,
      player2BallType,
      isPlayer1Turn,
      poolBalls,
    });
    // testArea = new PoolGameAreaController(nanoid());
    testArea.occupants = [
      new PlayerController(nanoid(), nanoid(), playerLocation),
      new PlayerController(nanoid(), nanoid(), playerLocation),
      new PlayerController(nanoid(), nanoid(), playerLocation),
    ];
    mockClear(mockListeners.occupantsChange);
    mockClear(mockListeners.onPlayerMove);
    mockClear(mockListeners.onTick);
    mockClear(mockListeners.playersChange);
    testArea.addListener('occupantsChange', mockListeners.occupantsChange);
  });
  // POOL TODO: write tests for PoolGameAreaController
  describe('sampleMethod', () => {
    it('Do Something Here', () => {
      expect(1).toBe(1);
    });
  });
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
      expect(testArea.toPoolGameAreaModel()).toEqual({
        id: testArea.id,
        player1ID: undefined,
        player2ID: undefined,
        isPlayer1Turn: false,
        poolBalls: [],
      });
    });
  });
});
*/
