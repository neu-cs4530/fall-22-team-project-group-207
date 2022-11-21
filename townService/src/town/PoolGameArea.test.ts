import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { getLastEmittedEvent } from '../TestUtils';
import { TownEmitter } from '../types/CoveyTownSocket';
import PoolGameArea from './PoolGameArea';

describe('PoolGameArea', () => {
  const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
  let testArea: PoolGameArea;
  const townEmitter = mock<TownEmitter>();
  let newPlayer: Player;

  beforeEach(() => {
    mockClear(townEmitter);
    // POOL TODO: finish these tests
    // testArea = new PoolGameArea({}, testAreaBox, townEmitter);
    newPlayer = new Player(nanoid(), mock<TownEmitter>());
    testArea.add(newPlayer);
  });

  describe('POOL TODO: sample method here', () => {
    it('POOL TODO: sample test here', () => {
      expect(1).toBe(1);
    });
  });
});
