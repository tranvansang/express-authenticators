import fetch from 'node-fetch'
import {getNonce, getTimestamp, oauthSign, OAuthSigningMethod} from './oauthUtils'
import OAuthError from './OAuthError'
import r3986 from 'r3986'
import type {IOAuthCommon, IPopSession, IStoreSession} from '../OAuthCommon'
import querystring from 'querystring'
import {decodeSessionData, encodeSessionData} from '../lib'

type IHttpMethod = 'POST' | 'GET'
const version = '1.0'

interface IOAuthRequestOptions {
	method?: IHttpMethod
	headers?: { [key: string]: string }
	body?: { [key: string]: string }
	qs?: { [key: string]: string | boolean | number }
	oauthHeaders?: { [key: string]: string }
}

export interface IOAuthTokenPayload {
	token: string
	secret: string
}

export default class OAuth implements IOAuthCommon<IOAuthTokenPayload> {
	// eslint-disable-next-line no-useless-constructor
	constructor(
		private config: {
			consumerKey: string
			consumerSecret: string
			requestTokenUrl: string
			accessTokenUrl: string
			callbackUrl: string
			authorizeUrl: string
			signingMethod: OAuthSigningMethod
		},
	) {
	}

	public async authenticate({store}: IStoreSession) {
		const response = await this.signAndFetch(
			this.config.requestTokenUrl,
			{
				method: 'POST',
				oauthHeaders: {
					oauth_callback: this.config.callbackUrl,
				}
			}
		)
		if (!response.ok) throw new OAuthError(await response.text())
		const {
			oauth_token,
			oauth_token_secret,
			oauth_callback_confirmed
		} = querystring.parse(await response.text())
		if (oauth_callback_confirmed !== 'true') throw new Error('Failed to request access token')
		await store(encodeSessionData({secret: oauth_token_secret}))
		return `${this.config.authorizeUrl}?${querystring.stringify({oauth_token})}`
	}

	public signAndFetch(
		url: string,
		options: IOAuthRequestOptions,
		tokenPayload?: IOAuthTokenPayload
	) {
		return fetch(`${url}${options.qs ? `?${querystring.stringify(options.qs)}` : ''}`, {
			headers: {
				...options.headers,
				Authorization: this.#authorizationHeader(url, options, tokenPayload),
			},
			method: options.method,
			body: options.body && querystring.stringify(options.body),
		})
	}

	public async callback({pop}: IPopSession, rawQuery: string) {
		const query = querystring.parse(rawQuery)
		const {
			oauth_token,
			oauth_verifier
		} = query
		const sessionSecret = decodeSessionData(pop()).secret
		if (!sessionSecret) throw new OAuthError('Last token secret lost')

		const response = await this.signAndFetch(this.config.accessTokenUrl, {
			oauthHeaders: {
				oauth_verifier: oauth_verifier as string,
			},
			method: 'POST'
		}, {
			token: oauth_token as string,
			secret: sessionSecret
		})
		if (!response.ok) throw new OAuthError(await response.text())

		const {
			oauth_token: token,
			oauth_token_secret: secret,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			user_id,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			screen_name
		} = querystring.parse(await response.text())

		return {
			token: token as string,
			secret: secret as string
		}
	}

	#authorizationHeader(
		url: string, {
			method = 'GET',
			body = {},
			qs,
			oauthHeaders
		}: IOAuthRequestOptions,
		tokenSet?: IOAuthTokenPayload
	) {
		const authHeaders = {
			oauth_consumer_key: this.config.consumerKey,
			oauth_signature_method: this.config.signingMethod,
			oauth_timestamp: getTimestamp(),
			oauth_nonce: getNonce(),
			oauth_version: version,
			...tokenSet && {oauth_token: tokenSet.token},
			...oauthHeaders
		}
		const allParams: { [key: string]: string } = {...body, ...qs, ...authHeaders} as any
		const allPairs = Object.keys(allParams)
			.map(k => [k, allParams[k]])
			.map(arr => arr.map(r3986))
			.sort(([a1, b1], [a2, b2]) => a1 < a2
				? -1
				: a1 > a2
					? 1
					: b1 < b2
						? -1
						: b1 > b2
							? 1
							: 0
			)
			.map(([k, v]) => `${k}=${v}`)
			.join('&')
		const baseString = `${method}&${r3986(url)}&${r3986(allPairs)}`
		const signature = oauthSign(this.config.signingMethod, baseString, this.config.consumerSecret, tokenSet?.secret)
		const signedAuthHeaders: { [key: string]: string } = {
			...authHeaders,
			oauth_signature: signature,
		} as any
		const signedAuthHeadersRaw = Object
			.keys(signedAuthHeaders)
			.map(k => `${r3986(k)}="${r3986(signedAuthHeaders[k])}"`)
			.join(', ')
		return `OAuth ${signedAuthHeadersRaw}`
	}
}
