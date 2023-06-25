import {
	getOAuth1AccessToken,
	getOauth1ConsentUrl,
	OAuth1CallbackQuery,
	OAuth1Error,
	oauth1SignAndFetch,
	OAuth1State,
	OAuth1TokenPayload
} from '../lib/oauth1'
import {OAuthProfile} from '../lib/util'

const signingMethod = 'HMAC-SHA1'
export const getTwitterConsentUrl = (
	{
		clientID,
		clientSecret,
		redirectUri,
	}: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}
) => getOauth1ConsentUrl({
	redirectUri,
	clientID,
	clientSecret,
	tokenUrl: 'https://api.twitter.com/oauth/request_token',
	consentUrl: 'https://api.twitter.com/oauth/authorize',
	signingMethod,
})

export const getTwitterAccessToken = async (
	{clientID, clientSecret}: {
		clientID: string
		clientSecret: string
	},
	state: OAuth1State,
	query: OAuth1CallbackQuery,
) => await getOAuth1AccessToken(
	{
		clientID,
		clientSecret,
		tokenUrl: 'https://api.twitter.com/oauth/access_token',
		signingMethod,
	},
	state,
	query,
)
export const fetchTwitterProfile = async (
	{clientID, clientSecret}: {
		clientID: string
		clientSecret: string
	},
	tokenPayload: OAuth1TokenPayload
): Promise<OAuthProfile> => {
	const response = await oauth1SignAndFetch(
		{
			clientID,
			clientSecret,
			signingMethod,
		},
		'https://api.twitter.com/1.1/account/verify_credentials.json',
		{
			qs: {include_email: 'true'},
		},
		tokenPayload
	)
	if (!response.ok) throw new OAuth1Error(await response.text())
	const profile = await response.json()
	if (!profile.id_str) throw new OAuth1Error('Invalid Twitter profile ID')
	return {
		id: profile.id_str,
		raw: profile,
		avatar: profile.profile_image_url_https
			|| profile.profile_image_url
			|| profile.profile_background_image_url_https
			|| profile.profile_background_image_url,
		first: profile.name || profile.screen_name,
		email: profile.email,
		emailVerified: !!profile.email,
		/**
		 * from twitter docs
		 * https://developer.twitter.com/en/docs/accounts-and-users
		 * /manage-account-settings/api-reference/get-account-verify_credentials
		 * When set to true email will be returned in the user objects as a string.
		 * If the user does not have an email address on their account,
		 * or if the email address is not verified, null will be returned.
		 */
	}
}
