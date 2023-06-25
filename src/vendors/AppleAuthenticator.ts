import OAuth2, {TokenRequestMethod} from '../oauth2/OAuth2'
import {IPopSession} from '../OAuthCommon'
import {decodeSessionData} from '../lib'
import OAuth2Error from '../oauth2/OAuth2Error'
import {safeCompare} from '../lib/util'

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
		ignoreStateCheck?: boolean
	}) {
		super({
			// https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
			tokenURL: 'https://appleid.apple.com/auth/token',
			// https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens#3262048
			clientSecret: '',
			...childConfig,
		}, {
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: false,
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
		const {state: sessionState, nonce} = decodeSessionData(pop())

		if (!this.childConfig.ignoreStateCheck && !safeCompare(state, sessionState)) throw new OAuth2Error('Invalid returning state')
		if (error) throw new OAuth2Error(error)
		return {code, id_token, state, user, nonce}
	}
}
