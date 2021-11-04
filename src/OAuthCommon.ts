export interface IStoreSession {
	store(data: string): void | Promise<void>
}

export interface IPopSession {
	pop(): string | undefined
}

export interface IOAuthCommon<T> {
	authenticate(session: IStoreSession): Promise<string> | string

	callback({pop}: IPopSession, rawQuery: string): Promise<T> | T
}

export interface IOAuthProfile {
	id?: string
	email?: string
	emailVerified?: boolean
	first?: string
	last?: string
	avatar?: string
	raw: any
}

export interface IOAuthProfileFetcher<T> {
	fetchProfile(tokenSet: T): Promise<IOAuthProfile>
}

export class OAuthProfileError extends Error {}
