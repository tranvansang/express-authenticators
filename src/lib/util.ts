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
