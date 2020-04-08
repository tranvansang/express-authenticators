import OAuth, { IOAuthTokenSet } from './oauth/OAuth';
import { IOAuthProfileFetcher } from './OAuthCommon';
export default class TumblrAuthenticator extends OAuth implements IOAuthProfileFetcher<IOAuthTokenSet> {
    constructor(config: {
        clientID: string;
        clientSecret: string;
        redirectUri: string;
    });
    fetchProfile(tokenSet: IOAuthTokenSet): Promise<{
        id: any;
        first: any;
        avatar: any;
        raw: {
            profile: any;
            blogProfile: any;
        };
    }>;
}
