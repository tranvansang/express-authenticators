import {BinaryLike, createHmac, randomBytes, timingSafeEqual} from 'crypto'

export const safeCompare = (a?: BinaryLike, b?: BinaryLike) => {
	if (typeof a !== 'string' || typeof b !== 'string') return false
	const key = randomBytes(32)
	const ha = createHmac('sha256', key).update(a).digest()
	const hb = createHmac('sha256', key).update(b).digest()
	return ha.length === hb.length && timingSafeEqual(Buffer.from(ha), Buffer.from(hb)) && a === b
}

export interface OAuthProfile {
	id?: string
	email?: string
	emailVerified?: boolean
	first?: string
	last?: string
	avatar?: string
	raw: any
}

export const isValidDate = (date: Date) => !isNaN(date.getTime())

function prepadSigned(hexStr: string) {
	const msb = hexStr[0]
	if (msb < '0' || msb > '7') {
		return `00${hexStr}`
	}
	return hexStr
}

function toHex(number: number) {
	const nstr = number.toString(16)
	if (nstr.length % 2) return `0${nstr}`
	return nstr
}

// encode ASN.1 DER length field
// if <=127, short form
// if >=128, long form
function encodeLengthHex(n: number) {
	if (n <= 127) return toHex(n)

	const n_hex = toHex(n)
	const length_of_length_byte = 128 + n_hex.length / 2 // 0x80+numbytes
	return toHex(length_of_length_byte) + n_hex

}

// https://github.com/tracker1/node-rsa-pem-from-mod-exp/blob/6aefeab7ecc69236becbf2bf827b21a385183020/index.js
// http://stackoverflow.com/questions/18835132/xml-to-pem-in-node-js
export function rsaPublicKeyPem(
	modulus_b64: string,
	exponent_b64: string,
) {

	const modulus = Buffer.from(modulus_b64, 'base64')
	const exponent = Buffer.from(exponent_b64, 'base64')

	let modulus_hex = modulus.toString('hex')
	let exponent_hex = exponent.toString('hex')

	modulus_hex = prepadSigned(modulus_hex)
	exponent_hex = prepadSigned(exponent_hex)

	const modlen = modulus_hex.length / 2
	const explen = exponent_hex.length / 2

	const encoded_modlen = encodeLengthHex(modlen)
	const encoded_explen = encodeLengthHex(explen)
	const encoded_pubkey = `30${
		encodeLengthHex(
			modlen
			+ explen
			+ encoded_modlen.length / 2
			+ encoded_explen.length / 2 + 2
		)
	}02${encoded_modlen}${modulus_hex
	}02${encoded_explen}${exponent_hex}`

	const der_b64 = Buffer.from(encoded_pubkey, 'hex').toString('base64')

	const pem = `-----BEGIN RSA PUBLIC KEY-----\n${
		(der_b64.match(/.{1,64}/g) ?? []).join('\n')
	}\n-----END RSA PUBLIC KEY-----\n`

	return pem
}

// https://github.com/brianloveswords/base64url/blob/fce104a75ebade9bbeb761d74153b46938c2fef4/src/base64url.ts
function padString(input: string): string {
	const segmentLength = 4
	const stringLength = input.length
	const diff = stringLength % segmentLength

	if (!diff) {
		return input
	}

	let position = stringLength
	let padLength = segmentLength - diff
	const paddedStringLength = stringLength + padLength
	const buffer = Buffer.alloc(paddedStringLength)

	buffer.write(input)

	while (padLength--) {
		buffer.write('=', position++)
	}

	return buffer.toString()
}
export const uriToBase64 = (str: string) => padString(str)
	.replace(/~/g, '=')
	.replace(/_/g, '/')
	.replace(/-/g, '+')

export const jsonFetch = async (url: string, options?: any) => {
	const res = await globalThis.fetch(url, options)
	if (!res.ok) {
		let text
		try {
			text = await res.text()
		} catch (e: any) {
			text = e.message
		}
		throw new Error(`${res.status}: ${res.statusText} ${text}`)
	}
	return await res.json()
}
