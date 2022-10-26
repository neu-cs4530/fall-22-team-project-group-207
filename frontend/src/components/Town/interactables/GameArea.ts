import Interactable, { KnownInteractableTypes } from '../Interactable';
import TownGameScene from '../TownGameScene';

/**
 * Abstract class GameArea for creating multiple types of games
 */
export default abstract class GameArea extends Interactable {
  private _game: string;

  constructor(scene: TownGameScene, game: string) {
    // super call to Interactable constructor
    super(scene);
    this._game = game;
  }

  getGame(): string {
    return this._game;
  }

  getType(): KnownInteractableTypes {
    return 'conversationArea';
  }
}
