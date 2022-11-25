import { vector } from "../Vector"

const CUE_MASS = 0.5386 // kg

export default class PoolCue {
    private _velocity: vector;
    private _position: vector;

    constructor() {
        this._velocity = {x: 0, y: 0, z: 0};
        this._position = {x: 0, y: 0, z: 0};
    }

    get velocity() {
        return this._velocity;
    }

    get position() {
        return this._position;
    }

    get mass(): number {
        return CUE_MASS;
    }
}