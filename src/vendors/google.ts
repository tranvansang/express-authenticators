import {getAccessToken, getConsentUrl, OAuthCallbackQuery, OAuthError, OAuthState} from '../lib/oauth'
import {isValidDate, jsonFetch, OAuthProfile, rsaPublicKeyPem, safeCompare, uriToBase64} from '../lib/util'
import {URLSearchParams} from 'url'
import {decode} from 'jws'
import {createVerify} from 'crypto'

export const getGoogleConsentUrl = (
	{
		scope = [
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/userinfo.profile'
		].join(' '),
		clientID,
		redirectUri,
		disablePKCE,
	}: {
		clientID: string
		redirectUri: string
		scope?: string
		disablePKCE?: boolean
	}
) => getConsentUrl({
	clientID,
	redirectUri,
	scope,
	consentUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
	enablePKCE: !disablePKCE,
})

export const getGoogleAccessToken = async (
	{clientID, clientSecret, redirectUri, disablePKCE}: {
		clientID: string
		clientSecret: string
		redirectUri: string
		disablePKCE?: boolean
	},
	state: OAuthState,
	query: OAuthCallbackQuery,
) => await getAccessToken<{
	access_token: string
	expires_in: number
	refresh_token: string
	scope: string
	token_type: 'Bearer'
}>(
	{
		clientID,
		clientSecret,
		redirectUri,
		enablePKCE: !disablePKCE,
		tokenUrl: 'https://oauth2.googleapis.com/token',
		ignoreGrantType: false,
		requestMethod: 'POST',
		includeStateWhenRequest: false,
	},
	state,
	query,
)

export const refreshGoogleAccessToken = async (
	{clientID, clientSecret}: {
		clientID: string
		clientSecret: string
	},
	refreshToken: string,
) => await jsonFetch('https://oauth2.googleapis.com/token', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		Accept: 'application/json',
	},
	body: new URLSearchParams({
		client_id: clientID,
		client_secret: clientSecret,
		grant_type: 'refresh_token',
		refresh_token: refreshToken
	}).toString()
})

// https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
const profilePictureSize = 1024
export const fetchGoogleProfile = async (
	access_token: string,
	{
		fields = [
			'emailAddresses',
			'names',
			'nicknames',
			'photos',
			'urls',
		]
	} = {}
): Promise<OAuthProfile> => {
	const profile = await jsonFetch(`https://people.googleapis.com/v1/people/me?${new URLSearchParams({
		access_token,
		personFields: fields.join(',')
	}).toString()}`)
	if (
		!profile.resourceName?.startsWith('people/')
	) throw new OAuthError('Invalid response from Google People API')
	const id = profile.resourceName.slice('people/'.length)
	if (!id) throw new OAuthError('Invalid Google profile ID')
	const getEmail = () => {
		for (const metaFilter of [
			(meta: any) => meta?.primary && meta?.verified,
			(meta: any) => meta?.verified,
			(meta: any) => meta?.primary,
			() => true,
		]) for (
			const email of profile.emailAddresses || []
		) if (
			email?.value && metaFilter(email.metadata)
		) return {
			email: email.value,
			emailVerified: email.metadata?.verified || false
		}
	}
	const primaryMetaFilters = [
		(meta: any) => meta?.primary,
		() => true
	]
	const getAvatar = () => {
		for (
			const metaFilter of primaryMetaFilters
		) for (
			const photo of profile.photos || []
		) if (
			photo.url && metaFilter(photo.metadata)
		) return photo.url.replace(/=s100$/, `=s${profilePictureSize}`)
	}
	const getFirstLast = () => {
		for (
			const metaFilter of primaryMetaFilters
		) for (
			const name of profile.names || []
		) if (
			metaFilter(name.metadata)
		) return {
			first: name.givenName,
			last: name.familyName
		}
		for (
			const metaFilter of primaryMetaFilters
		) for (
			const nickname of profile.nicknames || []
		) if (
			nickname.value && metaFilter(nickname.metadata)
		) return {
			first: nickname.value,
		}
	}
	return {
		id,
		...getEmail(),
		avatar: getAvatar(),
		...getFirstLast(),
		raw: profile
	}
}

// https://ncona.com/2015/02/consuming-a-google-id-token-from-a-server/
export const verifyGoogleIdToken = async (
	clientID: string,
	idToken: string
) => {
	const {
		header: {
			alg,
			kid, // key id
			typ, // type, must be JWT
		},
		payload: {
			iss, // issuer
			nbf, // not before
			aud, // audience
			sub, // subject
			email,
			email_verified,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			azp, // authorized party
			name,
			picture,
			given_name,
			family_name,
			iat, // issued at
			exp, // expiration
			// jti, // JWT ID
		}
	} = decode(idToken)

	// static check
	if (!safeCompare(typ, 'JWT')) throw new OAuthError(`Invalid JWT type: ${typ}`)
	if (!safeCompare(iss, 'https://accounts.google.com')) throw new OAuthError(`Invalid JWT issuer: ${iss}`)
	if (!safeCompare(aud, clientID)) throw new OAuthError(`Invalid JWT audience: ${aud}`)
	// authorized party is not always the same as the issuer
	// if (!safeCompare(azp, processEnv.get().GOOGLE_ID)) throw new OAuthError(`Invalid JWT authorized party: ${azp}`)
	if (nbf) {
		const notBefore = new Date(nbf * 1000)
		if (!isValidDate(notBefore) || notBefore.getTime() > Date.now()) throw new OAuthError(`Invalid JWT not before: ${nbf}, ${notBefore}`)
	}
	const issuedAt = new Date(iat * 1000)
	if (!isValidDate(issuedAt) || issuedAt.getTime() > Date.now()) throw new OAuthError(`Invalid JWT issued at: ${iat}, ${issuedAt}`)
	const expiration = new Date(exp * 1000)
	if (!isValidDate(expiration) || expiration.getTime() < Date.now()) throw new OAuthError(`Invalid or expired JWT expiration: ${iat}, ${expiration}`)

	// get jwks_uri
	// Obtaining Authorization Server Metadata: https://datatracker.ietf.org/doc/html/rfc8414#section-3
	const {jwks_uri} = await jsonFetch('https://accounts.google.com/.well-known/openid-configuration')

	// https://www.googleapis.com/oauth2/v3/certs
	// jwk: https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-web-key-41
	const {keys} = await jsonFetch(jwks_uri)
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
		const [header, payload, signature] = idToken.split('.') as [string, string, string]
		if (createVerify('RSA-SHA256').update([header, payload].join('.')).verify(
			pem,
			uriToBase64(signature),
			'base64'
		)) return {
			name, picture, email, email_verified, given_name, family_name, sub
		}
		throw new OAuthError('Invalid JWT signature')
	}
	throw new OAuthError('No matching key found')
}
