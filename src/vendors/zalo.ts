import {getAccessToken, getConsentUrl, OAuthCallbackQuery, OAuthError, OAuthState} from '../lib/oauth'
import {OAuthProfile} from '../lib/util'
import {URLSearchParams} from 'url'

export const getZaloConsentUrl = (
	{
		scope,
		clientID,
		redirectUri,
		disablePKCE,
	}: {
		clientID: string
		redirectUri: string
		scope?: string
		disablePKCE?: boolean
	}
) => getConsentUrl({
	clientID,
	redirectUri,
	scope,
	consentUrl: 'https://oauth.zaloapp.com/v4/permission',
	enablePKCE: !disablePKCE,
	clientIDQueryName: 'app_id'
})

export const getZaloAccessToken = async (
	{clientID, clientSecret, redirectUri, disablePKCE}: {
		clientID: string
		clientSecret: string
		redirectUri: string
		disablePKCE?: boolean
	},
	state: OAuthState,
	query: OAuthCallbackQuery,
) => await getAccessToken<{
	access_token: string // expires in 1 hour
	refresh_token: string // 3 months
	expires_in: string // in second
}>(
	{
		clientID,
		clientSecret,
		redirectUri,
		tokenUrl: 'https://oauth.zaloapp.com/v4/access_token',
		ignoreGrantType: false,
		requestMethod: 'POST',
		includeStateWhenRequest: false,
		secretHeaderName: 'secret_key',
		enablePKCE: !disablePKCE,
	},
	state,
	query,
)

// https://developers.zalo.me/docs/api/social-api/tham-khao/user-access-token-v4-post-4316
export const fetchZaloProfile = async (
	access_token: string,
	{
		fields = [
			'name',
			'id',
			'picture',
			'error',
			'message'
		]
	} = {}
): Promise<OAuthProfile> => {
	const res = await fetch(`https://graph.zalo.me/v2.0/me?${new URLSearchParams({
		access_token,
		fields: fields.join(',')
	}).toString()}`, {
		headers: {
			access_token
		}
	})
	if (!res.ok) throw new OAuthError(await res.text())

	const profile = await res.json()
	if (!profile.id) throw new OAuthError('Invalid Zalo profile ID')
	if (profile.error) throw new OAuthError(`Zalo error: ${profile.message}`)

	return {
		id: profile.id,
		first: profile.name,
		avatar: profile.picture?.data?.url,
		raw: profile
	}
}

export const refreshZaloAccessToken = async (
	{clientID, clientSecret}: {
		clientID: string
		clientSecret: string
	},
	refreshToken: string
): Promise<{
	access_token: string // expires in 1 hour
	refresh_token: string // 3 months
	expires_in: string // in second
}> => {
	const res = await fetch('https://oauth.zaloapp.com/v4/access_token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
			secret_key: clientSecret
		},
		body: new URLSearchParams({
			app_id: clientID,
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		}).toString()
	})
	if (!res.ok) throw new OAuthError(await res.text())
	return await res.json()
}
