import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { getLastEmittedEvent } from '../TestUtils';
import { TownEmitter, PoolBall as PoolBallModel } from '../types/CoveyTownSocket';
import PoolGameArea from './PoolGameArea';

export {};
describe('PoolGameArea', () => {
  const testAreaBox = {
    x: 100,
    y: 100,
    width: 100,
    height: 100,
  };
  let testArea: PoolGameArea;
  const townEmitter = mock<TownEmitter>();
  let newPlayer1: Player;
  let newPlayer2: Player;
  const id = nanoid();
  const player1ID = nanoid();
  const player2ID = nanoid();
  const player1BallType = 'Stripes';
  const player2BallType = 'Solids';
  const isPlayer1Turn = true;
  const isBallBeingPlaced = false;
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
    ballNumber: 1,
    ballType: 'Solids',
    isMoving: false,
    isAirborne: false,
    isPocketed: false,
  };
  const poolBalls: PoolBallModel[] = [poolBall1, poolBall2];

  beforeEach(() => {
    mockClear(townEmitter);
    testArea = new PoolGameArea(
      {
        id,
        player1ID,
        player2ID,
        player1BallType,
        player2BallType,
        isPlayer1Turn,
        isBallBeingPlaced,
        poolBalls,
      },
      testAreaBox,
      townEmitter,
    );
    newPlayer1 = new Player(nanoid(), mock<TownEmitter>());
    newPlayer2 = new Player(nanoid(), mock<TownEmitter>());
    testArea.add(newPlayer1);
    testArea.add(newPlayer2);
  });

  describe('remove', () => {
    it('Removes the player from the list of occupants and emits an interactableUpdate event', () => {
      testArea.remove(newPlayer1);

      expect(testArea.occupantsByID).toEqual([newPlayer2.id]);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id,
        player1ID,
        player2ID,
        player1BallType,
        player2BallType,
        isPlayer1Turn,
        isBallBeingPlaced,
        poolBalls,
      });
    });
    it('Emits an update for their location', () => {
      testArea.remove(newPlayer1);
      expect(newPlayer1.location.interactableID).toBeUndefined();
      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toBeUndefined();
    });
    it('Emits an update when the last occupant leaves', () => {
      testArea.remove(newPlayer1);
      testArea.remove(newPlayer2);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id,
        player1ID,
        player2ID,
        player1BallType,
        player2BallType,
        isPlayer1Turn,
        isBallBeingPlaced,
        poolBalls,
      });
    });
  });
  describe('add', () => {
    it('Adds the player to the occupants list', () => {
      expect(testArea.occupantsByID).toEqual([newPlayer1.id, newPlayer2.id]);
    });
    it('Emits an update for their location', () => {
      expect(newPlayer1.location.interactableID).toEqual(id);

      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toEqual(id);
    });
  });
  test('toModel sets the ID, player1&2 ID, player1&2 Ball Type, isPlayer1Turn, and poolBalls', () => {
    const model = testArea.toModel();
    expect(model).toEqual({
      id,
      player1ID,
      player2ID,
      player1BallType,
      player2BallType,
      isPlayer1Turn,
      isBallBeingPlaced,
      poolBalls,
    });
  });
  test('updateModel sets video, isPlaying and elapsedTimeSec', () => {
    testArea.updateModel({
      id: 'ignore',
      player1ID: '123',
      player2ID: '150',
      player1BallType: 'Stripes',
      player2BallType: 'Solids',
      isPlayer1Turn: true,
      isBallBeingPlaced: false,
      poolBalls,
    });
    expect(testArea.player1ID).toBe('123');
    expect(testArea.player2ID).toBe('150');
    expect(testArea.player1BallType).toBe('Stripes');
    expect(testArea.player2BallType).toBe('Solids');
    expect(testArea.id).toBe(id);
    expect(testArea.isPlayer1Turn).toBe(true);
    expect(testArea.poolBalls).toBe(poolBalls);
  });
  describe('fromMapObject', () => {
    it('Throws an error if the width or height are missing', () => {
      expect(() =>
        PoolGameArea.fromMapObject(
          {
            id: 1,
            name: nanoid(),
            visible: true,
            x: 0,
            y: 0,
          },
          townEmitter,
        ),
      ).toThrowError();
    });
    it('Creates a new PoolGameArea using the provided boundingBox and id, with isPlayer1Turn defaulting to true and other fields to undefined, and emitter', () => {
      const x = 30;
      const y = 20;
      const width = 10;
      const height = 20;
      const name = 'name';
      const val = PoolGameArea.fromMapObject(
        {
          x,
          y,
          width,
          height,
          name,
          id: 10,
          visible: true,
        },
        townEmitter,
      );
      expect(val.id).toEqual(name);
      expect(val.isPlayer1Turn).toEqual(true);
      expect(val.player1BallType).toBeUndefined();
      expect(val.player2BallType).toBeUndefined();
      expect(val.player1ID).toBeUndefined();
      expect(val.player2ID).toBeUndefined();
      expect(val.poolBalls).toEqual([]);
    });
  });
});
