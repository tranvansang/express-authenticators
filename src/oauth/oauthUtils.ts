import crypto, {randomUUID} from 'crypto'
import OAuthError from './OAuthError'
import r3986 from 'r3986'

export const getTimestamp = () => Math.floor(Date.now() / 1000)
export const getNonce = () => randomUUID()

export enum OAuthSigningMethod {
	Hmac = 'HMAC-SHA1',
	Plain = 'PLAINTEXT',
	Rsa = 'RSA-SHA1',
}
export const oauthSign = (method: OAuthSigningMethod, base: string, consumerSecret: string, tokenSecret?: string) => {
	switch (method) {
		case OAuthSigningMethod.Hmac:
			consumerSecret = r3986(consumerSecret)
			tokenSecret = tokenSecret ? r3986(tokenSecret) : ''
			return crypto.createHmac('sha1', `${consumerSecret}&${tokenSecret}`)
				.update(base)
				.digest('base64')
		case OAuthSigningMethod.Plain:
			consumerSecret = r3986(consumerSecret)
			tokenSecret = tokenSecret ? r3986(tokenSecret) : ''
			return `${consumerSecret}&${tokenSecret}`
		case OAuthSigningMethod.Rsa:
			return crypto.createSign('RSA-SHA1')
				.update(base)
				.sign(consumerSecret, 'base64')
		default:
			throw new OAuthError(`Unknown OAuth signing method ${method}`)
	}
}
