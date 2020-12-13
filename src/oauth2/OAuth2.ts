// eslint-disable-next-line import/no-unresolved
import {Request, Response} from 'express'
import {v4} from 'uuid'
import * as qs from 'qs'
import fetch from 'node-fetch'
import {IOAuthCommon} from '../OAuthCommon'
import OAuth2Error from './OAuth2Error'
import crypto from 'crypto'

const sessionKey = 'oauth2'

export enum TokenRequestMethod {
	GET = 'GET',
	POST = 'POST'
}

export default class OAuth2 implements IOAuthCommon<string> {
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
	) {}

	public async callback(req: Request) {
		const {state: sessionState, verifier} = (req.session as any)[sessionKey] || {}
		delete (req.session as any)[sessionKey]
		const {state} = req.query
		if (state !== sessionState) throw new OAuth2Error('Invalid returning state')
		if (
			req.query.error_code
			|| req.query.error
			|| req.query.error_description
			|| req.query.error_message
			|| req.query.error_reason
		) {
			const error = new OAuth2Error(
				(req.query.error_message
					|| req.query.error_description
					|| req.query.error_reason
					|| req.query.error
					|| 'Unknown OAuth2 error'
				) as string
			)
			error.code = req.query.error_code as string
			throw error
		}
		const code = req.query.code
		const body = qs.stringify({
			client_id: this.config.clientID,
			redirect_uri: this.config.redirectUri,
			client_secret: this.config.clientSecret,
			code,
			...!this.options.ignoreGrantType && {grant_type: 'authorization_code'},
			...this.options.includeStateInAccessToken && {state},
			...this.options.enablePKCE && {code_verifier: verifier},
		})
		const response = this.options.tokenRequestMethod === TokenRequestMethod.GET
			? await fetch(`${this.config.tokenURL}?${body}`)
			: await fetch(this.config.tokenURL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				},
				body
			})
		if (!response.ok) throw new OAuth2Error(await response.text() || 'Cannot get access token')
		let json
		try {
			json = await response.json()
		} catch (err) {
			throw new OAuth2Error(err.message)
		}
		// const {access_token, token_type, expires_in, refresh_token} = json
		if (!json.access_token) throw new OAuth2Error('Token not found')
		return json
	}

	public authenticate(req: Request, res: Response) {
		const state = v4()
		const verifier = v4()
		;(req.session as any)[sessionKey] = {state, verifier}
		res.status(302).redirect(`${this.config.consentURL}?\
${qs.stringify({
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
	})}`)
	}
}
