// eslint-disable-next-line import/no-unresolved
import {IOAuthCommon, IPopSession, IStoreSession} from '../OAuthCommon'
import OAuth2Error from './OAuth2Error'
import crypto, {randomUUID} from 'crypto'
import {decodeSessionData, encodeSessionData, safeCompare} from '../lib'
import {URLSearchParams} from 'url'

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
			clientIDQueryName?: string // default: 'client_id'
			secretHeaderName?: string // if defined, include clientSecret in header with this name and ignore client_secret in body

			// for apple
			responseType?: string // default: 'code'
			consentAdditionalParams?: Record<string, string>
			addNonceToAuthorizeURL?: boolean
		}
	) {
	}

	get #clientIDQueryName(): string {
		return this.options.clientIDQueryName ?? 'client_id'
	}

	public async callback({pop}: IPopSession, rawQuery: string) {
		const {
			state: sessionState,
			verifier
		} = decodeSessionData(pop())

		const query = new URLSearchParams(rawQuery)
		const state = String(query.get('state'))
		if (!safeCompare(state, sessionState)) throw new OAuth2Error('Invalid returning state')
		if (
			query.get('error_code')
			|| query.get('error')
			|| query.get('error_description')
			|| query.get('error_message')
			|| query.get('error_reason')
		) {
			const error = new OAuth2Error(
				(query.get('error_message')
					|| query.get('error_description')
					|| query.get('error_reason')
					|| query.get('error')
					|| 'Unknown OAuth2 error'
				) as string
			)
			error.code = query.get('error_code') as string
			throw error
		}

		const code = query.get('code')
		const body = new URLSearchParams({
			[this.#clientIDQueryName]: this.config.clientID,
			redirect_uri: this.config.redirectUri,
			...!this.options.secretHeaderName && {
				client_secret: this.config.clientSecret
			},
			...code && {code},
			...!this.options.ignoreGrantType && {grant_type: 'authorization_code'},
			...this.options.includeStateInAccessToken && state && {state},
			...this.options.enablePKCE && {code_verifier: verifier},
		}).toString()

		const res = this.options.tokenRequestMethod === TokenRequestMethod.GET
			? await fetch(`${this.config.tokenURL}?${body}`)
			: await fetch(this.config.tokenURL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
					...this.options.secretHeaderName && {
						[this.options.secretHeaderName]: this.config.clientSecret
					}
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
${new URLSearchParams({
		[this.#clientIDQueryName]: this.config.clientID,
		redirect_uri: this.config.redirectUri,
		state,
		...this.config.scope && {scope: this.config.scope},
		response_type: this.options.responseType ?? 'code',
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
		},
		...this.options.addNonceToAuthorizeURL && {
			nonce: randomUUID(),
		},
		...this.options.consentAdditionalParams,
	}).toString()}`
	}
}
