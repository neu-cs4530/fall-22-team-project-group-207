import Interactable, { KnownInteractableTypes } from '../Interactable';
import TownGameScene from '../TownGameScene';
/**
 * Game types
 *
 * Only one game currently supported, more to be added later
 */
export type GameTypes = 'pool';

/**
 * Abstract class GameArea for creating multiple types of games
 */
export default abstract class GameArea extends Interactable {
  private _game: GameTypes;

  constructor(scene: TownGameScene, game: GameTypes) {
    // super call to Interactable constructor
    super(scene);
    this._game = game;
  }

  getGame(): GameTypes {
    return this._game;
  }

  getType(): KnownInteractableTypes {
    return 'gameArea';
  }
}
