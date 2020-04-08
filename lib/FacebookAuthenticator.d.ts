import OAuth2 from './oauth2/OAuth2';
import { IOAuthProfileFetcher } from './OAuthCommon';
export default class FacebookAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
    constructor(options: {
        clientID: string;
        clientSecret: string;
        redirectUri: string;
        scope?: string;
    });
    fetchProfile: (token: string, fields?: string[]) => Promise<{
        id: any;
        first: any;
        last: any;
        email: any;
        emailVerified: boolean;
        avatar: string;
        raw: any;
    }>;
}
