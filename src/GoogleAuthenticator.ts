import OAuth2, {TokenRequestMethod} from './oauth2/OAuth2'
import qs from 'qs'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from './OAuthCommon'

const profilePictureSize = 1024
const fetchGoogleProfile = async (
	token: string,
	fields = [
		'emailAddresses',
		'names',
		'nicknames',
		'photos',
		'urls',
	]
) => {
	const res = await fetch(`https://people.googleapis.com/v1/people/me?${qs.stringify({
		access_token: token,
		personFields: fields.join(',')
	})}`)
	if (!res.ok) throw new OAuthProfileError(await res.text())
	const profile = await res.json()
	if (
		!profile.resourceName?.startsWith('people/')
	) throw new OAuthProfileError('Invalid response from Google People API')
	const id = profile.resourceName.substr('people/'.length)
	if (!id) throw new OAuthProfileError('Invalid Google profile ID')
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

export default class GoogleAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
	fetchProfile = fetchGoogleProfile
	constructor(private childConfig: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://accounts.google.com/o/oauth2/v2/auth',
			tokenURL: 'https://oauth2.googleapis.com/token',
			scope: [
				'https://www.googleapis.com/auth/userinfo.email',
				'https://www.googleapis.com/auth/userinfo.profile'
			].join(' '),
			...childConfig,
		}, {
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: false,
			enablePKCE: true,
		})
	}

	async refreshAccessToken(refreshToken: string) {
		const response = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: qs.stringify({
				client_id: this.childConfig.clientID,
				client_secret: this.childConfig.clientSecret,
				grant_type: 'refresh_token',
				refresh_token: refreshToken
			})
		})
		return await response.json()
	}
}
