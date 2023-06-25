import {getAccessToken, getConsentUrl, OAuthCallbackQuery, OAuthError, OAuthState} from '../lib/oauth'
import {URLSearchParams} from 'url'
import {OAuthProfile} from '../lib/util'

const enablePKCE = false

export const getFoursquareConsentUrl = (
	{
		scope,
		clientID,
		redirectUri,
	}: {
		clientID: string
		redirectUri: string
		scope?: string
	}
) => getConsentUrl({
	clientID,
	redirectUri,
	scope,
	consentUrl: 'https://foursquare.com/oauth2/authenticate',
	enablePKCE,
})

export const getFoursquareAccessToken = async (
	{clientID, clientSecret, redirectUri}: {
		clientID: string
		clientSecret: string
		redirectUri: string
	},
	state: OAuthState,
	query: OAuthCallbackQuery,
) => await getAccessToken<{
	access_token: string
}>(
	{
		clientID,
		clientSecret,
		redirectUri,
		enablePKCE,
		tokenUrl: 'https://foursquare.com/oauth2/access_token',
		ignoreGrantType: false,
		requestMethod: 'GET',
		includeStateWhenRequest: false
	},
	state,
	query,
)

// https://developer.foursquare.com/docs/places-api/authentication/#step-3
export const fetchFoursquareProfile = async (
	access_token: string,
	{version = '20200408'}: {
		version?: string
	} = {}
): Promise<OAuthProfile> => {
	const res = await fetch(`https://api.foursquare.com/v2/users/self?${new URLSearchParams({
		oauth_token: access_token,
		v: version
	}).toString()}`)
	if (!res.ok) throw new OAuthError(await res.text())
	const profile = await res.json()
	if (!profile?.response?.user?.id) throw new OAuthError('Invalid Foursquare profile ID')
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
