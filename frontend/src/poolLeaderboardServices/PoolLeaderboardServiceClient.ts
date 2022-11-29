/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from '../generated/client/core/BaseHttpRequest';
import type { OpenAPIConfig } from '../generated/client/core/OpenAPI';
import { AxiosHttpRequest } from '../generated/client/core/AxiosHttpRequest';

import { TownsService } from '../generated/client/services/TownsService';
import { PoolLeaderboardService } from './PoolLeaderboardService';

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export const LEADERBOARD_DB_URL = 'https://group-207-fp-database.herokuapp.com';

export class PoolLeaderboardServiceClient {

    public readonly leaderboard: PoolLeaderboardService;

    public readonly request: BaseHttpRequest;

    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = AxiosHttpRequest) {
        this.request = new HttpRequest({
            BASE: LEADERBOARD_DB_URL,
            VERSION: config?.VERSION ?? '1.0.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });

        this.leaderboard = new PoolLeaderboardService(this.request);
    }
}

