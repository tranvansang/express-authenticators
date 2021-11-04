import OAuth2, {TokenRequestMethod} from '../oauth2/OAuth2'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from '../OAuthCommon'
import * as querystring from 'querystring'

// https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#token
interface IFacebookTokenPayload {
	access_token: string
	token_type: string
	expires_in: number
}

const profilePictureWidth = 1024 //px
const fetchFacebookProfile = async (
	{access_token}: IFacebookTokenPayload,
	fields = [
		'first_name',
		'middle_name',
		'last_name',
		'email',
		'picture',
		'id',
		'name'
	]
) => {
	const res = await fetch(`https://graph.facebook.com/v9.0/me?${querystring.stringify({
		access_token,
		fields: fields.join(',')
	})}`)
	if (!res.ok) throw new OAuthProfileError(await res.text())
	const profile = await res.json()
	if (!profile.id) throw new OAuthProfileError('Invalid Facebook profile ID')
	return {
		id: profile.id,
		first: profile.first_name,
		last: profile.last_name,
		email: profile.email,
		emailVerified: !!profile.email,
		avatar: `https://graph.facebook.com/v9.0/${profile.id}/picture?width=${profilePictureWidth}`,
		raw: profile
	}
}

export default class FacebookAuthenticator
	extends OAuth2<IFacebookTokenPayload>
	implements IOAuthProfileFetcher<IFacebookTokenPayload> {
	fetchProfile = fetchFacebookProfile

	constructor(options: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://www.facebook.com/v9.0/dialog/oauth',
			tokenURL: 'https://graph.facebook.com/v9.0/oauth/access_token',
			scope: ['email'].join(','),
			...options,
		}, {
			ignoreGrantType: true,
			tokenRequestMethod: TokenRequestMethod.GET,
			includeStateInAccessToken: false,
			enablePKCE: false,
		})
	}
}
