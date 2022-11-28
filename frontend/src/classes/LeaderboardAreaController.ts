import EventEmitter from 'events';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import TypedEmitter from 'typed-emitter';

export interface LeaderboardObject {
  id: string;
  wins: number;
}
/**
 * The events that the ConversationAreaController emits to subscribers. These events
 * are only ever emitted to local components (not to the townService).
 */
export type LeaderboardAreaEvents = {
  leaderboardChange: (newLeaderboard: LeaderboardObject[]) => void;
};

/**
 * A ConversationAreaController manages the local behavior of a conversation area in the frontend,
 * implementing the logic to bridge between the townService's interpretation of conversation areas and the
 * frontend's. The ConversationAreaController emits events when the conversation area changes.
 */
export default class LeaderboardAreaController extends (EventEmitter as new () => TypedEmitter<LeaderboardAreaEvents>) {
  private _leaderboard: LeaderboardObject[] = [];

  private _id: string;

  /**
   * Create a new LeaderboardAreaController
   * @param id
   */
  constructor(id: string) {
    super();
    this._id = id;
  }

  /**
   * The ID of this leaderboard area (read only)
   */
  get id() {
    return this._id;
  }

  /**
   * The leaderboard of this leaderboard area (read only)
   */
  get leaderboard() {
    return [...this._leaderboard];
  }

  /**
   * The list of occupants in this conversation area. Changing the set of occupants
   * will emit an occupantsChange event.
   */
  set leaderboard(newLeaderboard: LeaderboardObject[]) {
    if (
      newLeaderboard.length !== this._leaderboard.length ||
      _.xor(newLeaderboard, this._leaderboard).length > 0 ||
      JSON.stringify(newLeaderboard) !== JSON.stringify(this._leaderboard)
    ) {
      this.emit('leaderboardChange', newLeaderboard);
      this._leaderboard = newLeaderboard;
    }
  }
}

/**
 * A react hook to retrieve the occupants of a ConversationAreaController, returning an array of PlayerController.
 *
 * This hook will re-render any components that use it when the set of occupants changes.
 */
export function useLeaderboardAreaLeaderboard(
  area: LeaderboardAreaController,
): LeaderboardObject[] {
  const [leaderboard, setLeaderboard] = useState(area.leaderboard);
  useEffect(() => {
    area.addListener('leaderboardChange', setLeaderboard);
    return () => {
      area.removeListener('leaderboardChange', setLeaderboard);
    };
  }, [area]);
  return leaderboard;
}
