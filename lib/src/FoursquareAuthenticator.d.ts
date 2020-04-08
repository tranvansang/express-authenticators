import OAuth2 from './oauth2/OAuth2';
import { IOAuthProfileFetcher } from './OAuthCommon';
export default class FoursquareAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
    fetchProfile: (token: string) => Promise<{
        id: any;
        first: any;
        last: any;
        email: any;
        emailVerified: boolean;
        avatar: string;
        raw: any;
    }>;
    constructor(options: {
        clientID: string;
        clientSecret: string;
        redirectUri: string;
        scope?: string;
    });
}
