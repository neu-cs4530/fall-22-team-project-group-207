export type TownJoinResponse = {
  /** Unique ID that represents this player * */
  userID: string;
  /** Secret token that this player should use to authenticate
   * in future requests to this service * */
  sessionToken: string;
  /** Secret token that this player should use to authenticate
   * in future requests to the video service * */
  providerVideoToken: string;
  /** List of players currently in this town * */
  currentPlayers: Player[];
  /** Friendly name of this town * */
  friendlyName: string;
  /** Is this a private town? * */
  isPubliclyListed: boolean;
  /** Current state of interactables in this town */
  interactables: Interactable[];
};

export type Interactable = ViewingArea | ConversationArea | PoolGameArea;

export type TownSettingsUpdate = {
  friendlyName?: string;
  isPubliclyListed?: boolean;
};

export type Direction = "front" | "back" | "left" | "right";
export interface Player {
  id: string;
  userName: string;
  location: PlayerLocation;
}

export type XY = { x: number; y: number };

export interface PlayerLocation {
  /* The CENTER x coordinate of this player's location */
  x: number;
  /* The CENTER y coordinate of this player's location */
  y: number;
  /** @enum {string} */
  rotation: Direction;
  moving: boolean;
  interactableID?: string;
}
export type ChatMessage = {
  author: string;
  sid: string;
  body: string;
  dateCreated: Date;
};

export interface ConversationArea {
  id: string;
  topic?: string;
  occupantsByID: string[];
}
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewingArea {
  id: string;
  video?: string;
  isPlaying: boolean;
  elapsedTimeSec: number;
};

export type Vector = {
  x: number;
  y: number;
  z: number;
};

export type PoolBall = {
  // Position, rotation, and velocity of the ball
  angularOrientation: Vector;
  angularVelocity: Vector;
  position: Vector;
  velocity: Vector;
  // Number on the ball 1 - 15 (0 for cue ball)
  ballNumber: number;
  ballType: string;
  // Other useful information
  isMoving: boolean;
  isAirborne: boolean;
  isPocketed: boolean;
};

export interface PoolGameArea {
  id: string;
  player1ID?: string;
  player2ID?: string;

  // a list of pool ball objects, each of which contains information on their current position, orientation, etc.
  poolBalls: PoolBall[];

  // Stripes or solids, or undefined if no balls have been pocketed yet
  player1BallType?: string;
  player2BallType?: string;
  isPlayer1Turn: boolean;
  isBallBeingPlaced: boolean;

  // Player ID of the next player to move, or undefined if no player is up next
  playerIDToMove?: string;
}

export interface ServerToClientEvents {
  playerMoved: (movedPlayer: Player) => void;
  playerDisconnect: (disconnectedPlayer: Player) => void;
  playerJoined: (newPlayer: Player) => void;
  initialize: (initialData: TownJoinResponse) => void;
  townSettingsUpdated: (update: TownSettingsUpdate) => void;
  townClosing: () => void;
  chatMessage: (message: ChatMessage) => void;
  interactableUpdate: (interactable: Interactable) => void;
}

export interface ClientToServerEvents {
  chatMessage: (message: ChatMessage) => void;
  playerMovement: (movementData: PlayerLocation) => void;
  interactableUpdate: (update: Interactable) => void;
}
