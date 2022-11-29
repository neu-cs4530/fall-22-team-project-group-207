/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import { CancelablePromise } from 'twilio-video/tsdef/types';
import { BaseHttpRequest } from '../generated/client';
import { Leader } from './Leader';

export class PoolLeaderboardService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * List all entries in the pool leaderboard that are set to be publicly available
     * @returns Town list of towns
     * @throws ApiError
     */
    public listLeaderboard(): CancelablePromise<Array<Leader>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/leaderboard',
        });
    }

    /**
     * Adds a user to the leaderboard
     * @param requestBody The public-facing information for the new town
     * @returns Leader The user model of the newly created leaderboard entry
     * @throws ApiError
     */
    public addLeader(
        requestBody: Leader,
    ): CancelablePromise<Leader> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/leaderboard/add',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Updates an existing leaderboard entry's wins by ID
     * @param user_id user to update
     * @param requestBody The updated settings
     * @returns void
     * @throws ApiError
     */
    public updateLeaderWins(
        user_id: string,
        requestBody: Leader,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/leaderboard/update/',
            body: {
                'userid': user_id,
            },
            body: requestBody,
            mediaType: 'application/json'
        });
    }

    /**
     * Updates an existing leaderboard entry's wins by ID
     * @param user_id user to update
     * @returns void
     * @throws ApiError
     */
     public playerWon(
        user_id: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/leaderboard/win/',
            body: {
                'userid': user_id,
            },
            mediaType: 'application/json'
        });
    }

}
