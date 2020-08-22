// eslint-disable-next-line import/no-unresolved
import {Request, Response} from 'express'
import {v4} from 'uuid'
import * as qs from 'qs'
import fetch from 'node-fetch'
import {IOAuthCommon} from '../OAuthCommon'
import OAuth2Error from './OAuth2Error'

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
		}
	) {}

	async callback(req: Request) {
		const state = req.query.state
		if (state !== req.session![sessionKey]?.state) throw new OAuth2Error('Invalid returning state')
		if (
			req.query.error_code
			|| req.query.error
			|| req.query.error_description
			|| req.query.error_message
			|| req.query.error_reason
		) {
			const error = new OAuth2Error(
				req.query.error_message
				|| req.query.error_description
				|| req.query.error_reason
				|| req.query.error
				|| 'Unknown OAuth2 error'
			)
			error.code = req.query.error_code
			throw error
		}
		const code = req.query.code
		const requestBody = {
			client_id: this.config.clientID,
			redirect_uri: this.config.redirectUri,
			client_secret: this.config.clientSecret,
			code,
			...!this.options.ignoreGrantType && {grant_type: 'authorization_code'},
			...this.options.includeStateInAccessToken && {state}
		}
		const response = this.options.tokenRequestMethod === TokenRequestMethod.GET
			? await fetch(`${this.config.tokenURL}?${qs.stringify(requestBody)}`)
			: await fetch(this.config.tokenURL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				},
				body: qs.stringify(requestBody)
			})
		if (!response.ok) throw new OAuth2Error(await response.text() || 'Cannot get access token')
		let json
		try {
			json = await response.json()
		} catch (err) {
			throw new OAuth2Error(err.message)
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const {access_token, token_type, expires_in} = json
		if (!access_token) throw new OAuth2Error('Token not found')
		return access_token
	}

	authenticate(req: Request, res: Response) {
		const state = v4()
		req.session![sessionKey] = {state}
		res.status(302).redirect(`${this.config.consentURL}?\
${qs.stringify({
		client_id: this.config.clientID,
		redirect_uri: this.config.redirectUri,
		state,
		scope: this.config.scope,
		response_type: 'code'
	})}`)
	}
}
