import {getAccessToken, getConsentUrl, OAuthCallbackQuery, OAuthError, OAuthState} from '../lib/oauth'
import {OAuthProfile} from '../lib/util'
import {URLSearchParams} from 'url'

export const getLineConsentUrl = (
	{
		scope = [
			'profile',
			'openid', // if 'openid' scope is not included, `ignoreEmail` must be false when calling `fetchProfile`
			'openid%20email' // exclude this scope if app is not permitted to access user email
		].join(' '),
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
	consentUrl: 'https://access.line.me/oauth2/v2.1/authorize',
	enablePKCE: !disablePKCE,
})

export const getLineAccessToken = async (
	{clientID, clientSecret, redirectUri, disablePKCE}: {
		clientID: string
		clientSecret: string
		redirectUri: string
		disablePKCE?: boolean
	},
	state: OAuthState,
	query: OAuthCallbackQuery,
) => await getAccessToken<{
	access_token: string
	expires_in: number
	id_token: string
	refresh_token: string
	scope: string
	token_type: 'Bearer'
}>(
	{
		clientID,
		clientSecret,
		redirectUri,
		tokenUrl: 'https://api.line.me/oauth2/v2.1/token',
		ignoreGrantType: false,
		requestMethod: 'POST',
		includeStateWhenRequest: false,
		enablePKCE: !disablePKCE,
	},
	state,
	query,
)

export const refreshLineAccessToken = async (
	{clientID, clientSecret}: {
		clientID: string
		clientSecret: string
	},
	refreshToken: string
) => {
	const res = await fetch('https://api.line.me/oauth2/v2.1/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		},
		body: new URLSearchParams({
			client_id: clientID,
			client_secret: clientSecret,
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		}).toString()
	})
	if (!res.ok) throw new OAuthError(await res.text())
	return await res.json()
}

// https://developers.line.biz/en/reference/line-login/#oauth
export const fetchLineProfile = async (
	{clientID}: {
		clientID: string
	},
	{access_token, id_token}: {
		access_token: string,
		id_token: string // to get email, if empty or null/undefined, ignore
	},
	{
		ignoreEmail = false
	} = {}
): Promise<OAuthProfile> => {
	// id_token can be decoded with jwt.verify() and jwt.decode.
	// However, we don't want to add a new `jwt` dependency. Also, we need to pass channel_secret to verify.
	// verify key = channel_secret, audience = channel_id, issuer = 'https://access.line.me', algorithms = ['HS256]

	let email
	if (!ignoreEmail && id_token) {
		const res = await fetch(
			'https://api.line.me/oauth2/v2.1/verify',
			{
				method: 'POST',
				body: new URLSearchParams({
					id_token,
					client_id: clientID
				}).toString(),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				},
			}
		)
		if (!res.ok) throw new OAuthError(await res.text())
		email = (await res.json()).email // 'name', 'picture' might be included if appropriate scopes included.
	}

	const res = await fetch(
		'https://api.line.me/v2/profile',
		{
			headers: {
				Authorization: `Bearer ${access_token}`
			}
		}
	)
	if (!res.ok) throw new OAuthError(await res.text())

	const profile = await res.json()
	const {
		userId,
		displayName,
		pictureUrl, // can be undefined
		// statusMessage
	} = profile

	const [first, ...rest] = displayName?.split(' ') || []

	return {
		email,
		id: userId,
		avatar: pictureUrl && `${pictureUrl}/large`, // can be added with /large or /small
		first,
		last: rest?.join(' '),
		raw: profile
	}
}
