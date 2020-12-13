import OAuth2, {TokenRequestMethod} from './oauth2/OAuth2'
import * as qs from 'qs'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from './OAuthCommon'

const fetchPinterestProfile = async (
	token: string,
) => {
	const res = await fetch(`https://api.pinterest.com/v1/me?${qs.stringify({access_token: token})}`)
	if (!res.ok) throw new OAuthProfileError(await res.text())
	const profile = await res.json()
	if (!profile.id) throw new OAuthProfileError('Invalid Pinterest profile')
	return {
		id: profile.id,
		first: profile.first_name,
		last: profile.last_name,
		raw: profile
	}
}

export default class PinterestAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
	fetchProfile = fetchPinterestProfile
	constructor(options: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://api.pinterest.com/oauth',
			tokenURL: 'https://api.pinterest.com/v1/oauth/token',
			scope: 'read_public',
			...options,
		}, {
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: false,
			enablePKCE: true,
		})
	}
}
