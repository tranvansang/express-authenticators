import crypto, {randomUUID} from 'crypto'

import {safeCompare} from './util'

export class OAuthError extends Error {
	public code?: string
	name = 'OAuthError'

	constructor(message: string) {
		super(message)
		Object.setPrototypeOf(this, OAuthError.prototype)
	}
}

export interface OAuthState {
	state: string
	verifier: string
	nonce?: string
}
export interface OAuthCallbackQuery {
	state: string
	code: string
	// error
	error_code?: string
	error?: string
	error_description?: string
	error_message?: string
	error_reason?: string
}

export const getConsentUrl = async (
	{
		addNonce = false,
		consentUrl,
		clientIDQueryName = 'client_id',
		clientID,
		redirectUri,
		scope,
		responseType = 'code',
		enablePKCE,
		additionalParams,
	}: {
		clientID: string,
		redirectUri: string
		consentUrl: string
		scope?: string
		clientIDQueryName?: string
		enablePKCE?: boolean

		// for apple
		responseType?: string // default: 'code'
		additionalParams?: Record<string, string>
		addNonce?: boolean
	}) => {
	const state = randomUUID()
	// https://datatracker.ietf.org/doc/html/rfc7636#section-4.1
	// rfc7636 requires key length between 43-128
	// while v4's generated key has 36 char
	const verifier = `${randomUUID()}-${randomUUID()}`
	const nonce = randomUUID()

	return {
		url: `${consentUrl}?\
${new URLSearchParams({
		[clientIDQueryName]: clientID,
		redirect_uri: redirectUri,
		state,
		...scope && {scope},
		response_type: responseType,
		...enablePKCE && {
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
		...addNonce && {nonce},
		...additionalParams,
	}).toString()}`,
		state: {
			state,
			verifier,
			...addNonce && {nonce},
		}, // satisfy OAuthState
	}
}

// use new URLSearchParams(queryString) to decode
export const getAccessToken = async <T>(
	{
		clientIDQueryName = 'client_id',
		clientID,
		redirectUri,
		secretHeaderName,
		clientSecret,
		tokenUrl,
		ignoreGrantType,
		includeStateWhenRequest,
		enablePKCE,
		requestMethod,
	}: {
		clientID: string
		clientSecret: string
		tokenUrl: string
		redirectUri: string
		clientIDQueryName?: string // default: 'client_id'
		secretHeaderName?: string // if defined, include clientSecret in header with this name and ignore client_secret in body
		ignoreGrantType: boolean
		includeStateWhenRequest: boolean
		enablePKCE: boolean
		requestMethod: 'GET' | 'POST' | 'PUT'
	},
	{
		state: sessionState,
		verifier,
		nonce,
	}: OAuthState,
	{
		state: returnState,
		code,
		error_code,
		error: error_msg,
		error_description,
		error_message,
		error_reason,
	}: OAuthCallbackQuery,
) => {
	if (!safeCompare(returnState, sessionState)) throw new OAuthError('Invalid returning state')
	if (
		error_code
		|| error_msg
		|| error_description
		|| error_message
		|| error_reason
	) {
		const error = new OAuthError(
			(error_message
				|| error_description
				|| error_reason
				|| error_msg
				|| 'Unknown OAuth2 error'
			) as string
		)
		error.code = error_code
		throw error
	}

	const body = new URLSearchParams({
		[clientIDQueryName]: clientID,
		redirect_uri: redirectUri,
		...!secretHeaderName && {
			client_secret: clientSecret
		},
		...code && {code},
		...!ignoreGrantType && {grant_type: 'authorization_code'},
		...includeStateWhenRequest && returnState && {state: returnState},
		...enablePKCE && {code_verifier: verifier},
	}).toString()

	const res = requestMethod === 'GET'
		? await fetch(`${tokenUrl}?${body}`)
		: await fetch(tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
				...secretHeaderName && {
					[secretHeaderName]: clientSecret
				}
			},
			body
		})
	if (!res.ok) throw new OAuthError(await res.text() || 'Cannot get access token')

	let json
	try {
		json = await res.json()
	} catch (err: any) {
		throw new OAuthError(err.message)
	}

	// const {access_token, token_type, expires_in, refresh_token} = json
	if (!json.access_token) throw new OAuthError('Token not found')
	return <T>json
}
