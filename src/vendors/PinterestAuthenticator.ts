import OAuth2, {TokenRequestMethod} from '../oauth2/OAuth2'
import {IOAuthProfileFetcher, OAuthProfileError} from '../OAuthCommon'

// https://developers.pinterest.com/docs/redoc/martech/#section/User-Authorization/Exchange-the-code-for-an-access-token
interface IPinterestTokenPayload {
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
}

const fetchPinterestProfile = async (
	{data: {access_token}}: IPinterestTokenPayload,
) => {
	const res = await fetch(
		'https://api.pinterest.com/v3/users/me',
		{
			headers: {
				Authorization: `Bearer ${access_token}`
			}
		}
	)
	if (!res.ok) throw new OAuthProfileError(await res.text())
	const {data: profile} = await res.json()
	// Pinterest does not include response shape in document
	// https://developers.pinterest.com/docs/redoc/martech/#operation/v3_get_user_handler_GET
	if (!profile.id) throw new OAuthProfileError('Invalid Pinterest profile')
	return {
		id: profile.id,
		first: profile.first_name,
		last: profile.last_name,
		raw: profile
	}
}

export default class PinterestAuthenticator
	extends OAuth2<IPinterestTokenPayload>
	implements IOAuthProfileFetcher<IPinterestTokenPayload> {
	fetchProfile = fetchPinterestProfile

	constructor(options: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://www.pinterest.com/oauth',
			tokenURL: 'https://api.pinterest.com/v3/oauth/access_token',
			scope: 'read_users',
			...options,
		}, {
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.PUT,
			includeStateInAccessToken: false,
			enablePKCE: false,
		})
	}
}
