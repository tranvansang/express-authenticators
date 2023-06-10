import OAuth2, {TokenRequestMethod} from '../oauth2/OAuth2'
import {IPopSession} from '../OAuthCommon'
import {decodeSessionData, safeCompare} from '../lib'
import OAuth2Error from '../oauth2/OAuth2Error'

interface IAppleTokenPayload {
	code: string
	id_token: string
	state: string
	user?: {
		name?: {
			firstName?: string
			lastName?: string
		}
		email?: string
	}
	// access_token: string
	// expires_in: number
	// refresh_token: string
	// id_token: string
	// token_type: 'Bearer'
}

export default class AppleAuthenticator extends OAuth2<IAppleTokenPayload> {
	constructor(private childConfig: {
		clientID: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://appleid.apple.com/auth/authorize',
			// https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
			tokenURL: 'https://appleid.apple.com/auth/token',
			scope: ['email', 'name'].join(' '), // must be null, otherwise, response_mode must be form_post and break the oauth2 flow
			...childConfig,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			get clientSecret() {
				// https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens#3262048
				throw new Error('AppleAuthenticator.clientSecret is not available')
			},
		}, {
			responseType: 'code id_token', // 'code' or 'code id_token'
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: false,
			enablePKCE: false,
			addNonceToAuthorizeURL: true,
			// https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/incorporating_sign_in_with_apple_into_other_platforms#3332113
			consentAdditionalParams: {response_mode: 'form_post'} // query or form_post or fragment
		})
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	// eslint-disable-next-line class-methods-use-this
	public override async callback({pop}: IPopSession, {code, id_token, state, user, error}: {
		code: string
		id_token: string
		state: string
		user: string
		error: string
	}) {
		const {state: sessionState} = decodeSessionData(pop())

		if (!safeCompare(state, sessionState)) throw new OAuth2Error('Invalid returning state')
		if (error) throw new OAuth2Error(error)
		return {code, id_token, state, user}
	}
}
