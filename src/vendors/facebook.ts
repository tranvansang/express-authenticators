import {getAccessToken, getConsentUrl, OAuthCallbackQuery, OAuthError, OAuthState} from '../lib/oauth'
import {URLSearchParams} from 'url'
import {OAuthProfile} from '../lib/util'

const enablePKCE = false
const defaultVersion = 'v16.0'

// https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#token
export const getFacebookConsentUrl = (
	{
		scope = ['email'].join(','),
		clientID,
		redirectUri,
		version = defaultVersion,
	}: {
		clientID: string
		redirectUri: string
		scope?: string
		version?: string
	}
) => getConsentUrl({
	clientID,
	redirectUri,
	scope,
	consentUrl: `https://www.facebook.com/${version}/dialog/oauth`,
	enablePKCE,
})

export const getFacebookAccessToken = async (
	{
		clientID,
		clientSecret,
		redirectUri,
		version = defaultVersion,
	}: {
		clientID: string
		clientSecret: string
		redirectUri: string
		version?: string
	},
	state: OAuthState,
	query: OAuthCallbackQuery,
) => await getAccessToken<{
	access_token: string
	token_type: string
	expires_in: number
}>(
	{
		clientID,
		clientSecret,
		redirectUri,
		enablePKCE,
		tokenUrl: `https://graph.facebook.com/${version}/oauth/access_token`,
		ignoreGrantType: true,
		requestMethod: 'GET',
		includeStateWhenRequest: false
	},
	state,
	query,
)

const profilePictureWidth = 1024 //px
export const fetchFacebookProfile = async (
	access_token: string,
	{
		fields = [
			'first_name',
			'middle_name',
			'last_name',
			'email',
			'picture',
			'id',
			'name'
		],
		version = defaultVersion,
	}: {
		fields?: string[]
		version?: string
	} = {},
): Promise<OAuthProfile> => {
	const res = await fetch(`https://graph.facebook.com/${version}/me?${new URLSearchParams({
		access_token,
		fields: fields.join(',')
	}).toString()}`)
	if (!res.ok) throw new OAuthError(await res.text())
	const profile = await res.json()
	if (!profile.id) throw new OAuthError('Invalid Facebook profile ID')
	return {
		id: profile.id,
		first: profile.first_name,
		last: profile.last_name,
		email: profile.email,
		emailVerified: !!profile.email,
		avatar: `https://graph.facebook.com/${version}/${profile.id}/picture?width=${profilePictureWidth}`,
		raw: profile
	}
}
