import type {BinaryLike} from 'crypto'
import {createHmac, randomBytes, timingSafeEqual} from 'crypto'

export const decodeSessionData = (raw?: string) => {
	try {
		return JSON.parse(raw || '') || {}
	} catch {
		return {}
	}
}
export const encodeSessionData = JSON.stringify

export const safeCompare = (a?: BinaryLike, b?: BinaryLike) => {
	if (typeof a !== 'string' || typeof b !== 'string') return false
	const key = randomBytes(32)
	const ha = createHmac('sha256', key).update(a).digest()
	const hb = createHmac('sha256', key).update(b).digest()
	return ha.length === hb.length && timingSafeEqual(Buffer.from(ha), Buffer.from(hb)) && a === b
}
