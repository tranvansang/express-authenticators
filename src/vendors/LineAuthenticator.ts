import OAuth2, {TokenRequestMethod} from '../oauth2/OAuth2'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from '../OAuthCommon'
import {URLSearchParams} from 'url'

// https://developers.line.biz/en/reference/line-login/#oauth
interface ILineTokenPayload {
	access_token: string
	expires_in: number
	id_token: string
	refresh_token: string
	scope: string
	token_type: 'Bearer'
}

export default class GoogleAuthenticator
	extends OAuth2<ILineTokenPayload>
	implements IOAuthProfileFetcher<ILineTokenPayload> {
	constructor(private childConfig: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://access.line.me/oauth2/v2.1/authorize',
			tokenURL: 'https://api.line.me/oauth2/v2.1/token',
			scope: [
				'profile',
				'openid', // if 'openid' scope is not included, `ignoreEmail` must be false when calling `fetchProfile`
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

	async fetchProfile(
		{
			access_token,
			id_token, // to get email, if empty or null/undefined, ignore
		}: ILineTokenPayload,
		ignoreEmail?: boolean
	) {
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
						client_id: this.childConfig.clientID
					}).toString(),
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

	async refreshAccessToken(refreshToken: string) {
		const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: new URLSearchParams({
				client_id: this.childConfig.clientID,
				client_secret: this.childConfig.clientSecret,
				grant_type: 'refresh_token',
				refresh_token: refreshToken
			}).toString()
		})
		return await response.json()
	}
}
