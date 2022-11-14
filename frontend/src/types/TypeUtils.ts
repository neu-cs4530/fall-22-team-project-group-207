import { ConversationArea, Interactable, ViewingArea, PoolGameArea } from './CoveyTownSocket';

/**
 * Test to see if an interactable is a conversation area
 */
export function isConversationArea(interactable: Interactable): interactable is ConversationArea {
  return 'occupantsByID' in interactable;
}

/**
 * Test to see if an interactable is a viewing area
 */
export function isViewingArea(interactable: Interactable): interactable is ViewingArea {
  return 'isPlaying' in interactable;
}

/**
 * Test to see if an interactable is a PoolGame area
 */
 export function isPoolGameArea(interactable: Interactable): interactable is PoolGameArea {
  return 'poolBalls' in interactable;
}

