import OAuth2, {TokenRequestMethod} from './oauth2/OAuth2'
import * as qs from 'qs'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from './OAuthCommon'

const profilePictureWidth = 1024 //px
const fetchFacebookProfile = async (
	token: string,
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
	const res = await fetch(`https://graph.facebook.com/v6.0/me?${qs.stringify({
		access_token: token,
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
		avatar: `https://graph.facebook.com/v6.0/${profile.id}/picture?width=${profilePictureWidth}`,
		raw: profile
	}
}

export default class FacebookAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
	fetchProfile = fetchFacebookProfile
	constructor(options: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://www.facebook.com/v6.0/dialog/oauth',
			tokenURL: 'https://graph.facebook.com/v6.0/oauth/access_token',
			scope: ['email'].join(','),
			...options,
		}, {
			ignoreGrantType: true,
			tokenRequestMethod: TokenRequestMethod.GET,
			includeStateInAccessToken: false
		})
	}
}
