export default class OAuth2Error extends Error {
	public code?: string
	name = 'OAuth2Error'

	constructor(message: string) {
		super(message)
		Object.setPrototypeOf(this, OAuth2Error.prototype)
	}
}
