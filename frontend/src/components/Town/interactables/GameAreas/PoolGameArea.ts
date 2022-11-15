import PoolGameAreaController from '../../../../classes/PoolGameAreaController';
import TownController from '../../../../classes/TownController';
import TownGameScene from '../../TownGameScene';
import GameArea from '../GameArea';

export default class PoolGameArea extends GameArea {
  // POOL TODO Text object? do we need this?
  private _topicTextOrUndefined?: Phaser.GameObjects.Text;

  // POOL TODO Text object? do we need this?
  private _infoTextBox?: Phaser.GameObjects.Text;

  // POOL TODO
  private _poolGameArea?: PoolGameAreaController;

  // POOL TODO
  private _townController: TownController;

  constructor(scene: TownGameScene) {
    // Super call to GameArea constructor
    super(scene, 'pool');

    this._townController = scene.coveyTownController;
    this.setTintFill();
    this.setAlpha(0.3);

    // POOL TODO make this work somehow??
    // We can either make a generic gameAreasChanged or make it specific for this area
    // If we are able to abstract it that would work better
    // To make this work, we need to implement the gameAreasChanged townEvent in TownController.ts
    // this._townController.addListener('poolGameAreasChanged', this._updatePoolGameAreas);
  }

  private _updatePoolGameAreas(areas: PoolGameAreaController[]) {
    // POOL TODO: look at _updateWhateverAreas in other Areas for reference
    areas;
  }
}
