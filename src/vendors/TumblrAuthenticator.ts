import OAuth, {IOAuthTokenPayload} from '../oauth/OAuth'
import {OAuthSigningMethod} from '../oauth/oauthUtils'
import {IOAuthProfileFetcher, OAuthProfileError} from '../OAuthCommon'

export default class TumblrAuthenticator extends OAuth implements IOAuthProfileFetcher<IOAuthTokenPayload> {
	constructor(config: {
		clientID: string
		clientSecret: string
		redirectUri: string
	}) {
		super({
			consumerKey: config.clientID,
			consumerSecret: config.clientSecret,
			callbackUrl: config.redirectUri,
			requestTokenUrl: 'https://www.tumblr.com/oauth/request_token',
			accessTokenUrl: 'https://www.tumblr.com/oauth/access_token',
			authorizeUrl: 'https://www.tumblr.com/oauth/authorize',
			signingMethod: OAuthSigningMethod.Hmac,
		})
	}

	async fetchProfile(tokenPayload: IOAuthTokenPayload) {
		const response = await this.signAndFetch(
			'https://api.tumblr.com/v2/user/info',
			{},
			tokenPayload
		)
		if (!response.ok) throw new OAuthProfileError(await response.text())
		const profile = await response.json()
		let blogProfile
		if (profile?.response?.user?.name) {
			const blogResponse = await this.signAndFetch(
				`https://api.tumblr.com/v2/blog/${profile.response.user.name}.tumblr.com/info`,
				{},
				tokenPayload
			)
			if (blogResponse.ok) {
				blogProfile = await blogResponse.json()
			}
		}
		return {
			id: blogProfile?.response?.blog?.uuid,
			first: blogProfile?.response?.blog?.title,
			avatar: blogProfile?.response?.blog?.avatar?.[0]?.url,
			raw: {
				profile,
				blogProfile
			},
		}
	}
}
