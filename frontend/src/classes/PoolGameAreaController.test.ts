import { mock, mockClear /*, MockProxy*/ } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { PlayerLocation, PoolBall, PoolGameArea } from '../types/CoveyTownSocket';
import PlayerController from './PlayerController';
import PoolGameAreaController, { PoolGameAreaEvents } from './PoolGameAreaController';
//import TownController from './TownController';
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
    const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
    const townEmitter = mock<TownEmitter>();
    const player1ID = nanoid();
    const player2ID = nanoid();
    const player1BallType = 'Stripes';
    const player2BallType = 'Solids';
    const isPlayer1Turn = true;
    const poolBall1: PoolBall = {posnX: 0, posnY: 0, ballNumber: 0, ballType: 'Cue', orientation: '', isPocketed: false};
    const poolBall2: PoolBall = {posnX: 5, posnY: 0, ballNumber: 1, ballType: 'Solid', orientation: '', isPocketed: false};
    const poolBalls: PoolBall[] = [poolBall1, poolBall2];
    testArea = new PoolGameAreaController({ id, player1ID, player2ID, player1BallType, player2BallType, isPlayer1Turn, poolBalls });
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

    // POOL TODO: make and add listeners
    // testArea.addListener('occupantsChange', mockListeners.occupantsChange);
    // testArea.addListener('topicChange', mockListeners.topicChange);
  });
  // POOL TODO: write tests for PoolGameAreaController
  describe('sampleMethod', () => {
    it('Do Something Here', () => {
      expect(1).toBe(1);
    });
  });
});
