import OAuth, {IOAuthTokenPayload} from '../oauth/OAuth'
import {OAuthSigningMethod} from '../oauth/oauthUtils'
import {IOAuthProfileFetcher, OAuthProfileError} from '../OAuthCommon'

export default class TwitterAuthenticator extends OAuth implements IOAuthProfileFetcher<IOAuthTokenPayload> {
	constructor(config: {
		clientID: string
		clientSecret: string
		redirectUri: string
	}) {
		super({
			consumerKey: config.clientID,
			consumerSecret: config.clientSecret,
			callbackUrl: config.redirectUri,
			requestTokenUrl: 'https://api.twitter.com/oauth/request_token',
			accessTokenUrl: 'https://api.twitter.com/oauth/access_token',
			authorizeUrl: 'https://api.twitter.com/oauth/authorize',
			signingMethod: OAuthSigningMethod.Hmac,
		})
	}

	async fetchProfile(tokenPayload: IOAuthTokenPayload) {
		const response = await this.signAndFetch(
			'https://api.twitter.com/1.1/account/verify_credentials.json',
			{
				qs: {include_email: true},
			},
			tokenPayload
		)
		if (!response.ok) throw new OAuthProfileError(await response.text())
		const profile = await response.json()
		if (!profile.id_str) throw new OAuthProfileError('Invalid Twitter profile ID')
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
}
