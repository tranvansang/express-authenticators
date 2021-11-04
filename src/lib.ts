export const decodeSessionData = (raw?: string) => {
	try {
		return JSON.parse(raw || '') || {}
	} catch {
		return {}
	}
}
export const encodeSessionData = JSON.stringify
