import OAuth2, {TokenRequestMethod} from '../oauth2/OAuth2'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from '../OAuthCommon'
import {URLSearchParams} from 'url'

// https://developers.zalo.me/docs/api/social-api/tham-khao/user-access-token-v4-post-4316
interface IZaloTokenPayload {
	access_token: string // expires in 1 hour
	refresh_token: string // 3 months
	expires_in: string // in second
}

const fetchZaloProfile = async (
	{access_token}: IZaloTokenPayload,
	fields = [
		'name',
		'id',
		'picture',
		'error',
		'message'
	]
) => {
	const res = await fetch(`https://graph.zalo.me/v2.0/me?${new URLSearchParams({
		access_token,
		fields: fields.join(',')
	}).toString()}`, {
		headers: {
			access_token
		}
	})
	if (!res.ok) throw new OAuthProfileError(await res.text())

	const profile = await res.json()
	if (!profile.id) throw new OAuthProfileError('Invalid Zalo profile ID')
	if (profile.error) throw new OAuthProfileError(`Zalo error: ${profile.message}`)

	return {
		id: profile.id,
		first: profile.name,
		avatar: profile.picture?.data?.url,
		raw: profile
	}
}

export default class ZaloAuthenticator
	extends OAuth2<IZaloTokenPayload>
	implements IOAuthProfileFetcher<IZaloTokenPayload> {
	fetchProfile = fetchZaloProfile

	constructor(private childConfig: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://oauth.zaloapp.com/v4/permission',
			tokenURL: 'https://oauth.zaloapp.com/v4/access_token',
			...childConfig,
		}, {
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: false,
			enablePKCE: true,
			clientIDQueryName: 'app_id',
			secretHeaderName: 'secret_key',
		})
	}

	async refreshAccessToken(refreshToken: string): Promise<IZaloTokenPayload> {
		const response = await fetch('https://oauth.zaloapp.com/v4/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
				secret_key: this.childConfig.clientSecret
			},
			body: new URLSearchParams({
				app_id: this.childConfig.clientID,
				grant_type: 'refresh_token',
				refresh_token: refreshToken
			}).toString()
		})
		return await response.json()
	}
}
