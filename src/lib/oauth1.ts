import {URLSearchParams} from 'url'
import r3986 from 'r3986'
import {createHmac, createSign, randomUUID} from 'crypto'

interface OAuth1RequestOptions {
	method?: 'POST' | 'GET'
	headers?: { [key: string]: string }
	body?: { [key: string]: string }
	qs?: { [key: string]: string}
	oauthHeaders?: { [key: string]: string }
}
export interface OAuth1TokenPayload {
	token: string
	secret: string
}
export interface OAuth1State {
	secret: string
}
export interface OAuth1CallbackQuery {
	oauth_token: string
	oauth_verifier: string
}

const version = '1.0'
const getTimestamp = () => Math.floor(Date.now() / 1000)
const getNonce = () => randomUUID()
type OAuth1SigningMethod = 'HMAC-SHA1' | 'PLAINTEXT' | 'RSA-SHA1'

export class OAuth1Error extends Error {
	name = 'OAuth1Error'
}

// export for test
export const oauth1Sign = (method: OAuth1SigningMethod, base: string, consumerSecret: string, tokenSecret?: string) => {
	switch (method) {
		case 'HMAC-SHA1':
			consumerSecret = r3986(consumerSecret)
			tokenSecret = tokenSecret ? r3986(tokenSecret) : ''
			return createHmac('sha1', `${consumerSecret}&${tokenSecret}`)
				.update(base)
				.digest('base64')
		case 'PLAINTEXT':
			consumerSecret = r3986(consumerSecret)
			tokenSecret = tokenSecret ? r3986(tokenSecret) : ''
			return `${consumerSecret}&${tokenSecret}`
		case 'RSA-SHA1':
			return createSign('RSA-SHA1')
				.update(base)
				.sign(consumerSecret, 'base64')
		default:
			throw new Error(`Unknown OAuth signing method ${method}`)
	}
}

const authorizationHeader = (
	{clientID, clientSecret, signingMethod}: {
		clientID: string
		clientSecret: string
		signingMethod: OAuth1SigningMethod
	},
	url: string,
	{
		method = 'GET',
		body = {},
		qs,
		oauthHeaders
	}: OAuth1RequestOptions,
	tokenSet?: OAuth1TokenPayload
) => {
	const authHeaders = {
		oauth_consumer_key: clientID,
		oauth_signature_method: signingMethod,
		oauth_timestamp: getTimestamp(),
		oauth_nonce: getNonce(),
		oauth_version: version,
		...tokenSet && {oauth_token: tokenSet.token},
		...oauthHeaders
	}
	const allParams: { [key: string]: string } = {...body, ...qs, ...authHeaders} as any
	const allPairs = Object.keys(allParams)
		.map(k => [k, allParams[k]])
		.map(arr => arr.map(r3986))
		.sort(([a1, b1], [a2, b2]) => a1 < a2
			? -1
			: a1 > a2
				? 1
				: b1 < b2
					? -1
					: b1 > b2
						? 1
						: 0
		)
		.map(([k, v]) => `${k}=${v}`)
		.join('&')
	const baseString = `${method}&${r3986(url)}&${r3986(allPairs)}`
	const signature = oauth1Sign(signingMethod, baseString, clientSecret, tokenSet?.secret)
	const signedAuthHeaders: { [key: string]: string } = {
		...authHeaders,
		oauth_signature: signature,
	} as any
	const signedAuthHeadersRaw = Object
		.keys(signedAuthHeaders)
		.map(k => `${r3986(k)}="${r3986(signedAuthHeaders[k])}"`)
		.join(', ')
	return `OAuth ${signedAuthHeadersRaw}`
}

export const oauth1SignAndFetch = async (
	oauth1Env: {
		clientID: string
		clientSecret: string
		signingMethod: OAuth1SigningMethod
	},
	url: string,
	options: OAuth1RequestOptions,
	tokenPayload?: OAuth1TokenPayload
) => fetch(`${url}${options.qs ? `?${new URLSearchParams(options.qs).toString()}` : ''}`, {
	headers: {
		...options.headers,
		Authorization: authorizationHeader(oauth1Env, url, options, tokenPayload),
	},
	method: options.method,
	body: options.body && new URLSearchParams(options.body).toString(),
})

export const getOauth1ConsentUrl = async (
	{tokenUrl, redirectUri, consentUrl, clientSecret, clientID, signingMethod}: {
		tokenUrl: string
		redirectUri: string
		consentUrl: string
		clientID: string
		clientSecret: string
		signingMethod: OAuth1SigningMethod
	}
) => {
	const response = await oauth1SignAndFetch(
		{clientID, clientSecret, signingMethod},
		tokenUrl,
		{
			method: 'POST',
			oauthHeaders: {
				oauth_callback: redirectUri,
			}
		}
	)
	if (!response.ok) throw new OAuth1Error(await response.text())
	const {
		oauth_token,
		oauth_token_secret,
		oauth_callback_confirmed
	} = Object.fromEntries(new URLSearchParams(await response.text()))
	if (oauth_callback_confirmed !== 'true') throw new Error('Failed to request access token')
	return {
		url: `${consentUrl}?${new URLSearchParams({oauth_token}).toString()}`,
		state: {secret: oauth_token_secret} // satisfy OAuth1State
	}
}

export const getOAuth1AccessToken = async (
	{tokenUrl, ...oauth1Env}: {
		clientID: string
		clientSecret: string
		signingMethod: OAuth1SigningMethod
		tokenUrl: string
	},
	{secret: sessionSecret}: OAuth1State,
	{oauth_token, oauth_verifier}: OAuth1CallbackQuery,
) => {
	if (!sessionSecret) throw new OAuth1Error('Last token secret lost')

	const response = await oauth1SignAndFetch(oauth1Env, tokenUrl, {
		oauthHeaders: {
			oauth_verifier: oauth_verifier as string,
		},
		method: 'POST'
	}, {
		token: oauth_token as string,
		secret: sessionSecret
	})
	if (!response.ok) throw new OAuth1Error(await response.text())

	const {
		oauth_token: token,
		oauth_token_secret: secret,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		user_id,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		screen_name
	} = Object.fromEntries(new URLSearchParams(await response.text()))

	return {
		token: token as string,
		secret: secret as string
	} satisfies OAuth1TokenPayload
}
