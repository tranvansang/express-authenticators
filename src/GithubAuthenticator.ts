import OAuth2, {TokenRequestMethod} from './oauth2/OAuth2'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from './OAuthCommon'

export const fetchGithubProfile = async (
	token: string,
) => {
	const res = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `token ${token}`,
			Accept: 'application/json',
		}
	})
	if (!res.ok) throw new OAuthProfileError(await res.text())
	const emailRes = await fetch('https://api.github.com/user/emails', {
		headers: {
			Authorization: `token ${token}`,
			Accept: 'application/json',
		}
	})
	let emails: any[]
	if (emailRes.ok) emails = await emailRes.json()
	const getEmail = () => {
		for (const emailFilter of [
			(meta: any) => meta?.primary && meta?.verified,
			(meta: any) => meta?.verified,
			(meta: any) => meta?.primary,
			(meta: any) => meta?.visibility === 'public',
			() => true,
		]) for (
			const emailData of emails || []
		) if (
			emailData?.email && emailFilter(emailData)
		) return {
			email: emailData.email,
			emailVerified: emailData.verified
		}
	}
	const profile = await res.json()
	if (!profile.id) throw new OAuthProfileError('Invalid Github profile ID')
	return {
		id: profile.id,
		first: profile.name,
		last: '',
		avatar: profile.avatar_url,
		...getEmail(),
		raw: profile
	}
}

export default class GithubAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
	fetchProfile = fetchGithubProfile
	constructor(options: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://github.com/login/oauth/authorize',
			tokenURL: 'https://github.com/login/oauth/access_token',
			scope: [
				'read:user',
				'user:email'
			].join(' '),
			...options,
		}, {
			ignoreGrantType: true,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: true
		})
	}
}
