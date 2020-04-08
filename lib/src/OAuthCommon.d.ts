import { Request, RequestHandler } from 'express';
export interface IOAuthCommon<T> {
    authenticate: RequestHandler;
    callback(req: Request): Promise<T> | T;
}
interface IOAuthProfile {
    id?: string;
    email?: string;
    emailVerified?: boolean;
    first?: string;
    last?: string;
    avatar?: string;
    raw: any;
}
export interface IOAuthProfileFetcher<T> {
    fetchProfile(tokenSet: T): Promise<IOAuthProfile>;
}
export declare class OAuthProfileError extends Error {
}
export {};
