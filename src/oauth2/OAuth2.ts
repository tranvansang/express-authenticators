// eslint-disable-next-line import/no-unresolved
import fetch from 'node-fetch'
import {IOAuthCommon, IPopSession, IStoreSession} from '../OAuthCommon'
import OAuth2Error from './OAuth2Error'
import crypto, {randomUUID} from 'crypto'
import querystring from 'querystring'
import {decodeSessionData, encodeSessionData} from '../lib'

export const enum TokenRequestMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT'
}

export default class OAuth2<T> implements IOAuthCommon<T> {
	// eslint-disable-next-line no-useless-constructor
	constructor(
		private config: {
			consentURL: string
			tokenURL: string
			clientID: string
			clientSecret: string
			redirectUri: string
			scope?: string
		},
		private options: {
			ignoreGrantType: boolean
			tokenRequestMethod: TokenRequestMethod
			includeStateInAccessToken: boolean
			enablePKCE: boolean
		}
	) {
	}

	public async callback({pop}: IPopSession, rawQuery: string) {
		const {
			state: sessionState,
			verifier
		} = decodeSessionData(pop())

		const query = querystring.parse(rawQuery)
		const {state} = query
		if (state !== sessionState) throw new OAuth2Error('Invalid returning state')
		if (
			query.error_code
			|| query.error
			|| query.error_description
			|| query.error_message
			|| query.error_reason
		) {
			const error = new OAuth2Error(
				(query.error_message
					|| query.error_description
					|| query.error_reason
					|| query.error
					|| 'Unknown OAuth2 error'
				) as string
			)
			error.code = query.error_code as string
			throw error
		}

		const code = query.code
		const body = querystring.stringify({
			client_id: this.config.clientID,
			redirect_uri: this.config.redirectUri,
			client_secret: this.config.clientSecret,
			code,
			...!this.options.ignoreGrantType && {grant_type: 'authorization_code'},
			...this.options.includeStateInAccessToken && {state},
			...this.options.enablePKCE && {code_verifier: verifier},
		})

		const res = this.options.tokenRequestMethod === TokenRequestMethod.GET
			? await fetch(`${this.config.tokenURL}?${body}`)
			: await fetch(this.config.tokenURL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				},
				body
			})
		if (!res.ok) throw new OAuth2Error(await res.text() || 'Cannot get access token')

		let json
		try {
			json = await res.json()
		} catch (err: any) {
			throw new OAuth2Error(err.message)
		}

		// const {access_token, token_type, expires_in, refresh_token} = json
		if (!json.access_token) throw new OAuth2Error('Token not found')
		return <T>json
	}

	public async authenticate({store}: IStoreSession) {
		const state = randomUUID()
		// https://datatracker.ietf.org/doc/html/rfc7636#section-4.1
		// rfc7636 requires key length between 43-128
		// while v4's generated key has 36 char
		const verifier = `${randomUUID()}-${randomUUID()}`
		await store(encodeSessionData({
			state,
			verifier
		}))

		return `${this.config.consentURL}?\
${querystring.stringify({
		client_id: this.config.clientID,
		redirect_uri: this.config.redirectUri,
		state,
		scope: this.config.scope,
		response_type: 'code',
		...this.options.enablePKCE && {
			code_challenge: crypto
				.createHash('sha256')
				.update(Buffer.from(verifier))
				.digest()
				.toString('base64')
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, ''),
			code_challenge_method: 'S256'
		}
	})}`
	}
}
