import OAuth2 from './oauth2/OAuth2';
import { IOAuthProfileFetcher } from './OAuthCommon';
export declare const fetchGithubProfile: (token: string) => Promise<{
    raw: any;
    id: any;
    first: any;
    last: string;
    avatar: any;
} | {
    raw: any;
    email: any;
    emailVerified: any;
    id: any;
    first: any;
    last: string;
    avatar: any;
}>;
export default class GithubAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
    fetchProfile: (token: string) => Promise<{
        raw: any;
        id: any;
        first: any;
        last: string;
        avatar: any;
    } | {
        raw: any;
        email: any;
        emailVerified: any;
        id: any;
        first: any;
        last: string;
        avatar: any;
    }>;
    constructor(options: {
        clientID: string;
        clientSecret: string;
        redirectUri: string;
        scope?: string;
    });
}
