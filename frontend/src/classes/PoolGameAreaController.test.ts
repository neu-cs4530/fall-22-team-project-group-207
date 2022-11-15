import { mock, mockClear, MockProxy } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { PlayerLocation } from '../types/CoveyTownSocket';
import PlayerController from './PlayerController';
import PoolGameAreaController, { PoolGameAreaEvents } from './PoolGameAreaController';
import TownController from './TownController';
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
    testArea = new PoolGameAreaController(nanoid());
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
