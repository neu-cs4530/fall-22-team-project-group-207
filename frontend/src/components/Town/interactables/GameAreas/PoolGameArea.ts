import PoolGameAreaController from '../../../../classes/PoolGameAreaController';
import TownController from '../../../../classes/TownController';
import { KnownInteractableTypes } from '../../Interactable';
import TownGameScene from '../../TownGameScene';
import GameArea from '../GameArea';

export default class PoolGameArea extends GameArea {
  // POOL TODO May want this to display the current player's turn?
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
    this._townController.addListener('poolGameAreasChanged', this._updatePoolGameAreas);
  }

  removedFromScene(): void {}

  addedToScene(): void {
    super.addedToScene();
    this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y - this.displayHeight / 2,
      this.name,
      { color: '#FFFFFF', backgroundColor: '#000000' },
    );
    this._infoTextBox = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y + this.displayHeight / 2,
      '(No Players)',
      { color: '#000000' },
    );
    this._updatePoolGameAreas(this._townController.poolGameAreas);
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
    this._labelText?.setVisible(false);
    this._isInteracting = true;
  }

  getType(): KnownInteractableTypes {
    return 'gameArea';
  }

  private _updatePoolGameAreas(areas: PoolGameAreaController[]) {
    // POOL TODO: look at _updateWhateverAreas in other Areas for reference
    const area = areas.find(eachAreaInController => eachAreaInController.id === this.name);
    if (area !== this._poolGameArea) {
      if (area === undefined) {
        this._poolGameArea = undefined;
      } else {
        this._poolGameArea = area;
        if (this.isOverlapping) {
          this._scene.moveOurPlayerTo({ interactableID: this.name });
        }
        // This might be useful if we want to update a text box saying whos turn it is?
        const updateListener = (newTurn: boolean) => {
          if (newTurn) {
            if (this._infoTextBox && this._infoTextBox.visible) {
              this._infoTextBox.setVisible(false);
            }
            this._infoTextBox.text = 'Player 1 Turn';
          } else {
            this._infoTextBox.text = 'Player 2 Turn';
          }
        };
        updateListener(area.isPlayer1Turn);
        area.addListener('turnChange', updateListener);
      }
    }
  }
}
