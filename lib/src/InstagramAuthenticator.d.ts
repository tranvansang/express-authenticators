import OAuth2 from './oauth2/OAuth2';
import { IOAuthProfileFetcher } from './OAuthCommon';
export default class InstagramAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
    fetchProfile: (token: string, fields?: string[]) => Promise<{
        id: any;
        first: any;
        avatar: any;
        raw: {
            profile: any;
            graphProfile: any;
        };
    }>;
    constructor(options: {
        clientID: string;
        clientSecret: string;
        redirectUri: string;
        scope?: string;
    });
}
