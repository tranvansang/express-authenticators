import OAuth2, {TokenRequestMethod} from '../oauth2/OAuth2'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from '../OAuthCommon'
import {URLSearchParams} from 'url'

// https://developer.foursquare.com/docs/places-api/authentication/#step-3
interface IFoursquareTokenPayload {
	access_token: string
}

const fetchFoursquareProfile = async (
	{access_token}: IFoursquareTokenPayload,
) => {
	const res = await fetch(`https://api.foursquare.com/v2/users/self?${new URLSearchParams({
		oauth_token: access_token,
		v: '20200408'
	}).toString()}`)
	if (!res.ok) throw new OAuthProfileError(await res.text())
	const profile = await res.json()
	if (!profile?.response?.user?.id) throw new OAuthProfileError('Invalid Foursquare profile ID')
	return {
		id: profile.response.user.id,
		first: profile.response.user.firstName,
		last: profile.response.user.lastName,
		email: profile.response.user.contact?.email || undefined,
		emailVerified: false,
		avatar: profile.response.user.photo?.prefix
			? `${profile.response.user.photo?.prefix}original${profile.response.user.photo?.suffix}`
			: '',
		raw: profile
	}
}

export default class FoursquareAuthenticator
	extends OAuth2<IFoursquareTokenPayload>
	implements IOAuthProfileFetcher<IFoursquareTokenPayload> {
	fetchProfile = fetchFoursquareProfile

	constructor(options: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://foursquare.com/oauth2/authenticate',
			tokenURL: 'https://foursquare.com/oauth2/access_token',
			...options,
		}, {
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.GET,
			includeStateInAccessToken: false,
			enablePKCE: false,
		})
	}
}
