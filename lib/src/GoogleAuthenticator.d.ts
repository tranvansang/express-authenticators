import OAuth2 from './oauth2/OAuth2';
import { IOAuthProfileFetcher } from './OAuthCommon';
export default class GoogleAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
    fetchProfile: (token: string, fields?: string[]) => Promise<{
        raw: any;
        avatar: any;
        id: any;
    } | {
        raw: any;
        first: any;
        last: any;
        avatar: any;
        id: any;
    } | {
        raw: any;
        first: any;
        last?: undefined;
        avatar: any;
        id: any;
    } | {
        raw: any;
        avatar: any;
        email: any;
        emailVerified: any;
        id: any;
    } | {
        raw: any;
        first: any;
        last: any;
        avatar: any;
        email: any;
        emailVerified: any;
        id: any;
    } | {
        raw: any;
        first: any;
        last?: undefined;
        avatar: any;
        email: any;
        emailVerified: any;
        id: any;
    }>;
    constructor(options: {
        clientID: string;
        clientSecret: string;
        redirectUri: string;
        scope?: string;
    });
}
