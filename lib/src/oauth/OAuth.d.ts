import { OAuthSigningMethod } from './oauthUtils';
import { Request, Response } from 'express';
import { IOAuthCommon } from '../OAuthCommon';
declare type IHttpMethod = 'POST' | 'GET';
interface IOAuthRequestOptions {
    method?: IHttpMethod;
    headers?: {
        [key: string]: string;
    };
    body?: {
        [key: string]: string;
    };
    qs?: {
        [key: string]: string | boolean | number;
    };
    oauthHeaders?: {
        [key: string]: string;
    };
}
export interface IOAuthTokenSet {
    token: string;
    secret: string;
}
export default class OAuth implements IOAuthCommon<IOAuthTokenSet> {
    private config;
    constructor(config: {
        consumerKey: string;
        consumerSecret: string;
        requestTokenUrl: string;
        accessTokenUrl: string;
        callbackUrl: string;
        authorizeUrl: string;
        signingMethod: OAuthSigningMethod;
    });
    signAndFetch(url: string, options: IOAuthRequestOptions, tokenSet?: IOAuthTokenSet): Promise<import("node-fetch").Response>;
    authenticate(req: Request, res: Response): Promise<void>;
    callback(req: Request): Promise<{
        token: any;
        secret: any;
    }>;
    private authorizationHeader;
}
export {};
