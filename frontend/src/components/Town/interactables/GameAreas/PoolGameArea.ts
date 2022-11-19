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

  private _labelText?: Phaser.GameObjects.Text;

  private _isInteracting = false;

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

  addedToScene() {
    super.addedToScene();
    this.setTintFill();
    this.setAlpha(0.3);

    this._labelText = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y - this.displayHeight / 2,
      `Press space to join the ${this.name} game`,
      { color: '#FFFFFF', backgroundColor: '#000000' },
    );
    this._labelText.setVisible(false);
    //this.townController.getViewingAreaController(this);
    this.setDepth(-1);
  }

  overlap(): void {
    if (!this._labelText) {
      throw new Error('Should not be able to overlap with this interactable before added to scene');
    }
    const location = this.townController.ourPlayer.location;
    this._labelText.setX(location.x);
    this._labelText.setY(location.y);
    this._labelText.setVisible(true);
  }

  overlapExit(): void {
    this._labelText?.setVisible(false);
    if (this._isInteracting) {
      this.townController.interactableEmitter.emit('endInteraction', this);
      this._isInteracting = false;
    }
  }

  interact(): void {
    console.log('hello');
    this._labelText?.setVisible(false);
    this._isInteracting = true;
  }

  getType(): KnownInteractableTypes {
    return 'gameArea';
  }

  private _updatePoolGameAreas(areas: PoolGameAreaController[]) {
    // POOL TODO: look at _updateWhateverAreas in other Areas for reference
    this.townController.poolGameAreas = areas;
  }
}
