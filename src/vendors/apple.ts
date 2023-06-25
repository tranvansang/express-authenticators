import {getConsentUrl} from '../lib/oauth'

export const getAppleConsentUrl = (
	{
		scope = ['email', 'name'].join(' '), // if non-null, response_mode must be form_post and break the oauth2 flow
		clientID,
		redirectUri,
	}: {
		clientID: string
		redirectUri: string
		scope?: string
	}
) => getConsentUrl({
	clientID,
	redirectUri,
	scope,
	consentUrl: 'https://appleid.apple.com/auth/authorize',
	enablePKCE: false,
	addNonce: true,
	responseType: 'code id_token',
	// https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/incorporating_sign_in_with_apple_into_other_platforms#3332113
	additionalParams: {response_mode: 'form_post'} // query or form_post or fragment
})
