import { Request, Response } from 'express';
import { IOAuthCommon } from '../OAuthCommon';
export declare class OAuth2Error extends Error {
    code?: string;
    name: string;
}
export declare enum TokenRequestMethod {
    GET = "GET",
    POST = "POST"
}
export default class OAuth2 implements IOAuthCommon<string> {
    private config;
    private options;
    constructor(config: {
        consentURL: string;
        tokenURL: string;
        clientID: string;
        clientSecret: string;
        redirectUri: string;
        scope?: string;
    }, options: {
        ignoreGrantType: boolean;
        tokenRequestMethod: TokenRequestMethod;
        includeStateInAccessToken: boolean;
    });
    callback(req: Request): Promise<any>;
    authenticate(req: Request, res: Response): void;
}
