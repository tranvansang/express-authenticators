import OAuth2, {TokenRequestMethod} from './oauth2/OAuth2'
import qs from 'qs'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from './OAuthCommon'

// https://developers.line.biz/en/reference/line-login/#oauth
interface ILineTokenPayload {
	access_token: string
	expires_in: number
	id_token: string
	refresh_tokeN: string
	scope: string
	token_type: 'Bearer'
}

const fetchLineProfile = async (
	{
		access_token,
		id_token
	}: ILineTokenPayload,
	ignoreEmail?: boolean
) => {
	// id_token can be decoded with jwt.verify() and jwt.decode.
	// However, we don't want to add a new `jwt` dependency. Also, we need to pass channel_secret to verify.
	// verify key = channel_secret, audience = channel_id, issuer = 'https://access.line.me', algorithms = ['HS256]

	let email
	if (!ignoreEmail) {
		const res = await fetch(
			'https://api.line.me/oauth2/v2.1/verify',
			{
				method: 'POST',
				body: qs.stringify({id_token}),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				},
			}
		)
		if (!res.ok) throw new OAuthProfileError(await res.text())
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
	if (!res.ok) throw new OAuthProfileError(await res.text())

	const profile = await res.json()
	const {
		userId,
		displayName,
		pictureUrl, // can be undefined
		// statusMessage
	} = profile

	const [first, rest] = displayName?.split(' ') || []

	return {
		email,
		id: userId,
		avatar: pictureUrl && `${pictureUrl}/large`, // can be added with /large or /small
		first,
		last: rest?.join(' '),
		raw: profile
	}
}

export default class GoogleAuthenticator
	extends OAuth2<ILineTokenPayload>
	implements IOAuthProfileFetcher<ILineTokenPayload> {
	fetchProfile = fetchLineProfile

	constructor(private childConfig: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://access.line.me/oauth2/v2.1',
			tokenURL: 'https://api.line.me/oauth2/v2.1/token',
			scope: [
				'profile',
				'openid%20email' // exclude this scope if app is not permitted to access user email
			].join(' '),
			...childConfig,
		}, {
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: false,
			enablePKCE: true,
		})
	}

	async refreshAccessToken(refreshToken: string) {
		const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: qs.stringify({
				client_id: this.childConfig.clientID,
				client_secret: this.childConfig.clientSecret,
				grant_type: 'refresh_token',
				refresh_token: refreshToken
			})
		})
		return await response.json()
	}
}
