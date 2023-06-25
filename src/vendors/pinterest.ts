import {getAccessToken, getConsentUrl, OAuthCallbackQuery, OAuthError, OAuthState} from '../lib/oauth'
import {OAuthProfile} from '../lib/util'

const enablePKCE = false

export const getPinterestConsentUrl = (
	{
		scope = 'read_users',
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
	consentUrl: 'https://www.pinterest.com/oauth',
	enablePKCE,
})

export const getPinterestAccessToken = async (
	{clientID, clientSecret, redirectUri}: {
		clientID: string
		clientSecret: string
		redirectUri: string
	},
	state: OAuthState,
	query: OAuthCallbackQuery,
) => await getAccessToken<{
	status: 'success'
	message: 'ok'
	code: 0
	data: {
		access_token: string
		expires_at: number
		consumer_id: string | number
		token_type: 'bearer'
		authorized: true
		scope: string
	}
}>(
	{
		clientID,
		clientSecret,
		redirectUri,
		tokenUrl: 'https://api.pinterest.com/v3/oauth/access_token',
		ignoreGrantType: false,
		requestMethod: 'PUT',
		includeStateWhenRequest: false,
		enablePKCE,
	},
	state,
	query,
)

// https://developers.pinterest.com/docs/redoc/martech/#section/User-Authorization/Exchange-the-code-for-an-access-token
export const fetchPinterestProfile = async (
	access_token: string,
): Promise<OAuthProfile> => {
	const res = await fetch(
		'https://api.pinterest.com/v3/users/me',
		{
			headers: {
				Authorization: `Bearer ${access_token}`
			}
		}
	)
	if (!res.ok) throw new OAuthError(await res.text())
	const {data: profile} = await res.json()
	// Pinterest does not include response shape in document
	// https://developers.pinterest.com/docs/redoc/martech/#operation/v3_get_user_handler_GET
	if (!profile.id) throw new OAuthError('Invalid Pinterest profile')
	return {
		id: profile.id,
		first: profile.first_name,
		last: profile.last_name,
		raw: profile
	}
}
