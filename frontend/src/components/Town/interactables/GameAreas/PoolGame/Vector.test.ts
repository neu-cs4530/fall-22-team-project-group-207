import {
  Vector,
  scale,
  magnitude,
  subtractVectors,
  unitVector,
  angleBetween,
  addVectors,
  crossProduct,
  dotProduct,
} from './Vector';

export {};
describe('Vector', () => {
  const v1: Vector = { x: 3, y: 7, z: 2 };
  const v2: Vector = { x: 5, y: 1, z: 0 };
  describe('scale', () => {
    it('properly scales the vector', () => {
      expect(scale(v1, 3)).toEqual({ x: 9, y: 21, z: 6 });
    });
  });
  describe('magnitude', () => {
    it('finds the magnitude of a given vector', () => {
      expect(magnitude(v1)).toBeCloseTo(7.874);
    });
  });
  describe('subtractVectors', () => {
    it('subtracts 2 vectors from each other', () => {
      expect(subtractVectors(v1, v2)).toEqual({ x: -2, y: 6, z: 2 });
    });
  });
  describe('addVectors', () => {
    it('adds 2 vectors to each other', () => {
      expect(addVectors(v1, v2)).toEqual({ x: 8, y: 8, z: 2 });
    });
  });
  describe('addVectors', () => {
    it('adds 2 vectors to each other', () => {
      expect(addVectors(v1, v2)).toEqual({ x: 8, y: 8, z: 2 });
    });
  });
  describe('unitVector', () => {
    it('finds the unit vector for a given vector', () => {
      const unit: Vector = unitVector(v1);
      expect(unit.x).toBeCloseTo(0.381);
      expect(unit.y).toBeCloseTo(0.889);
      expect(unit.z).toBeCloseTo(0.254);
    });
  });
  describe('dotProduct', () => {
    it('gets the dot product of 2 vectors', () => {
      expect(dotProduct(v1, v2)).toBe(22);
    });
  });
  describe('crossProduct', () => {
    it('gets the cross product of 2 vectors', () => {
      expect(crossProduct(v1, v2)).toEqual({ x: -2, y: 10, z: -32 });
    });
  });
  describe('angleBetween', () => {
    it('gets the angle between 2 vectors', () => {
      expect(angleBetween(v1, v2)).toBeCloseTo(0.99);
    });
    it('doesnt return NaN when the 2 vectors are pointing in the same direction', () => {
      expect(angleBetween(v1, v1)).toBe(0);
    });
  });
});
