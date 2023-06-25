import {getConsentUrl, OAuthError} from '../lib/oauth'
import {isValidDate, jsonFetch, rsaPublicKeyPem, safeCompare, uriToBase64} from '../lib/util'
import {URLSearchParams} from 'url'
import {decode, sign} from 'jws'
import {createVerify} from 'crypto'

export interface IAppleEnv {
	keyId: string // 10-character key identifier
	teamId: string // 10-character Team ID
	clientId: string
	secret: string
}

export const getAppleConsentUrl = (
	{
		scope = ['email', 'name'].join(' '), // if non-null, response_mode must be form_post and break the oauth2 flow
		clientID,
		redirectUri,
		state,
	}: {
		clientID: string
		redirectUri: string
		scope?: string
		state?: string
	}
) => getConsentUrl({
	clientID,
	redirectUri,
	scope,
	state,
	consentUrl: 'https://appleid.apple.com/auth/authorize',
	enablePKCE: false,
	addNonce: true,
	responseType: 'code id_token',
	// https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/incorporating_sign_in_with_apple_into_other_platforms#3332113
	additionalParams: {response_mode: 'form_post'} // query or form_post or fragment
})

// https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user#3383769
export const verifyAppleIdToken = async (
	clientID: string,
	idToken: string,
	nonce: string,
	{ignoreNonceCheck = false} = {},
) => {
	const {
		header: {
			alg, // RS256
			kid, // key id: YuyXoY
		},
		payload,
	} = decode(idToken)
	const {
		iss, // issuer
		aud, // audience
		exp, // expiration
		iat, // issued at
		sub, // subject
		nonce: decodedNonce,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		c_hash,
		email,
		email_verified,
		is_private_email,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		auth_time,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		nonce_supported,
		firstName,
		lastName,
	} = JSON.parse(payload)

	// static check
	if (!ignoreNonceCheck && !safeCompare(nonce, decodedNonce)) throw new OAuthError(`Invalid nonce. expected: ${nonce}, actual: ${decodedNonce}`)
	if (!safeCompare(iss, 'https://appleid.apple.com')) throw new OAuthError(`Invalid issuer: expected: https://appleid.apple.com, actual: ${iss}`)
	if (!safeCompare(aud, clientID)) throw new OAuthError(`Invalid JWT audience: ${aud}, expected: ${clientID}`)
	const expiration = new Date(exp * 1000)
	if (!isValidDate(expiration) || expiration.getTime() < Date.now()) throw new OAuthError(`Invalid or expired JWT expiration: ${iat}, ${expiration}`)

	// https://developer.apple.com/documentation/sign_in_with_apple/fetch_apple_s_public_key_for_verifying_token_signature
	// jwk: https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-web-key-41
	const {keys} = await jsonFetch('https://appleid.apple.com/auth/keys')
	/*
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "YuyXoY",
      "use": "sig",
      "alg": "RS256",
      "n": "1JiU4l3YCeT4o0gVmxGTEK1IXR-Ghdg5Bzka12tzmtdCxU00ChH66aV-4HRBjF1t95IsaeHeDFRgmF0lJbTDTqa6_VZo2hc0zTiUAsGLacN6slePvDcR1IMucQGtPP5tGhIbU-HKabsKOFdD4VQ5PCXifjpN9R-1qOR571BxCAl4u1kUUIePAAJcBcqGRFSI_I1j_jbN3gflK_8ZNmgnPrXA0kZXzj1I7ZHgekGbZoxmDrzYm2zmja1MsE5A_JX7itBYnlR41LOtvLRCNtw7K3EFlbfB6hkPL-Swk5XNGbWZdTROmaTNzJhV-lWT0gGm6V1qWAK2qOZoIDa_3Ud0Gw",
      "e": "AQAB"
    },
    {
      "kty": "RSA",
      "kid": "W6WcOKB",
      "use": "sig",
      "alg": "RS256",
      "n": "2Zc5d0-zkZ5AKmtYTvxHc3vRc41YfbklflxG9SWsg5qXUxvfgpktGAcxXLFAd9Uglzow9ezvmTGce5d3DhAYKwHAEPT9hbaMDj7DfmEwuNO8UahfnBkBXsCoUaL3QITF5_DAPsZroTqs7tkQQZ7qPkQXCSu2aosgOJmaoKQgwcOdjD0D49ne2B_dkxBcNCcJT9pTSWJ8NfGycjWAQsvC8CGstH8oKwhC5raDcc2IGXMOQC7Qr75d6J5Q24CePHj_JD7zjbwYy9KNH8wyr829eO_G4OEUW50FAN6HKtvjhJIguMl_1BLZ93z2KJyxExiNTZBUBQbbgCNBfzTv7JrxMw",
      "e": "AQAB"
    },
    {
      "kty": "RSA",
      "kid": "fh6Bs8C",
      "use": "sig",
      "alg": "RS256",
      "n": "u704gotMSZc6CSSVNCZ1d0S9dZKwO2BVzfdTKYz8wSNm7R_KIufOQf3ru7Pph1FjW6gQ8zgvhnv4IebkGWsZJlodduTC7c0sRb5PZpEyM6PtO8FPHowaracJJsK1f6_rSLstLdWbSDXeSq7vBvDu3Q31RaoV_0YlEzQwPsbCvD45oVy5Vo5oBePUm4cqi6T3cZ-10gr9QJCVwvx7KiQsttp0kUkHM94PlxbG_HAWlEZjvAlxfEDc-_xZQwC6fVjfazs3j1b2DZWsGmBRdx1snO75nM7hpyRRQB4jVejW9TuZDtPtsNadXTr9I5NjxPdIYMORj9XKEh44Z73yfv0gtw",
      "e": "AQAB"
    }
  ]
}
	 */

	for (const {
		// https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-web-key-41#section-9.3
		e, // exponent
		n, // modulus
		use,
		kid: serverKid,
		alg: serverAlg,
		// kty, // RSA
	} of keys) if (
		safeCompare(serverKid, kid)
		&& safeCompare(serverAlg, alg)
		&& safeCompare(use, 'sig') //  'sig' or 'enc': https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-web-key-41#section-4.2
	) {
		const pem = rsaPublicKeyPem(n, e)
		const [header, idTokenPayload, signature] = idToken.split('.') as [string, string, string]
		if (createVerify('RSA-SHA256').update([header, idTokenPayload].join('.')).verify(
			pem,
			uriToBase64(signature),
			'base64'
		)) return {
			email, email_verified, sub, firstName, lastName, is_private_email,
		}
		throw new OAuthError('Invalid JWT signature')
	}
	throw new OAuthError('No matching key found')
}

// https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
export const generateAppleClientSecret = (
	{keyId, teamId, clientId, secret}: IAppleEnv
) => {
	const now = Date.now()

	return sign({
		header: {
			alg: 'ES256',
			kid: keyId,
			typ: 'JWT'
		},
		payload: {
			iss: teamId,
			iat: Math.round(now / 1000),
			exp: Math.round((now + 20 * 60 * 1000) / 1000),
			aud: 'https://appleid.apple.com',
			sub: clientId,
		},
		secret,
	})
}

export const revokeAppleToken = async (
	appleEnv: IAppleEnv,
	{token, tokenType}: {
		token: string
		tokenType: 'access_token' | 'refresh_token'
	}
) => {
	// response is empty if success
	const res = await jsonFetch('https://appleid.apple.com/auth/revoke', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: appleEnv.clientId,
			client_secret: generateAppleClientSecret(appleEnv),
			token,
			token_type_hint: tokenType,
		}).toString(),
	})
	if (!res.ok) {
		let text
		try {
			text = await res.text()
		} catch (e: any) {
			text = e.message
		}
		throw new Error(`${res.status}: ${res.statusText} ${text}`)
	}
}

// https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
// https://developer.apple.com/documentation/sign_in_with_apple/tokenresponse
export const getAppleToken = async (
	appleEnv: IAppleEnv,
	{code, redirectUri}: {
		code: string // expired in 5-min
		redirectUri: string
	}
): Promise<{
	access_token: string
	expires_in: number // unit: second
	id_token: string
	refresh_token: string
	token_type: 'bearer'
}> => await jsonFetch(
	'https://appleid.apple.com/auth/token',
	{
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: appleEnv.clientId,
			client_secret: generateAppleClientSecret(appleEnv),
			code,
			grant_type: 'authorization_code', // or refresh_token for refresh token validation
			// refresh_token,
			redirect_uri: redirectUri,
		})
	}
)
