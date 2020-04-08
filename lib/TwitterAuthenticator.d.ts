import OAuth, { IOAuthTokenSet } from './oauth/OAuth';
import { IOAuthProfileFetcher } from './OAuthCommon';
export default class TwitterAuthenticator extends OAuth implements IOAuthProfileFetcher<IOAuthTokenSet> {
    constructor(config: {
        clientID: string;
        clientSecret: string;
        redirectUri: string;
    });
    fetchProfile(tokenSet: IOAuthTokenSet): Promise<{
        id: any;
        raw: any;
        avatar: any;
        first: any;
        email: any;
        emailVerified: boolean;
    }>;
}
