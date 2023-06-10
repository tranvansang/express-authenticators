import OAuth2, {TokenRequestMethod} from '../oauth2/OAuth2'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from '../OAuthCommon'
import {URLSearchParams} from 'url'

interface IAppleTokenPayload {
	access_token: string
	expires_in: number
	refresh_token: string
	scope: string
	token_type: 'Bearer'
}

const profilePictureSize = 1024
const fetchGoogleProfile = async (
	{access_token}: IAppleTokenPayload,
	fields = [
		'emailAddresses',
		'names',
		'nicknames',
		'photos',
		'urls',
	]
) => {
	const res = await fetch(`https://people.googleapis.com/v1/people/me?${new URLSearchParams({
		access_token,
		personFields: fields.join(',')
	}).toString()}`)
	if (!res.ok) throw new OAuthProfileError(await res.text())
	const profile = await res.json()
	if (
		!profile.resourceName?.startsWith('people/')
	) throw new OAuthProfileError('Invalid response from Google People API')
	const id = profile.resourceName.slice('people/'.length)
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

export default class AppleAuthenticator
	extends OAuth2<IAppleTokenPayload>
	implements IOAuthProfileFetcher<IAppleTokenPayload> {
	fetchProfile = fetchGoogleProfile

	constructor(private childConfig: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://appleid.apple.com/auth/authorize',
			tokenURL: 'https://oauth2.googleapis.com/token',
			scope: ['email', 'name'].join(' '),
			...childConfig,
		}, {
			responseType: 'code id_token', // 'code' or 'code id_token'
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: false,
			enablePKCE: false,
			addNonceToAuthorizeURL: true,
			// https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/incorporating_sign_in_with_apple_into_other_platforms#3332113
			consentAdditionalParams: {response_mode: 'form_post'} // form_post or fragment
		})
	}

	async refreshAccessToken(refreshToken: string) {
		const response = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: new URLSearchParams({
				client_id: this.childConfig.clientID,
				client_secret: this.childConfig.clientSecret,
				grant_type: 'refresh_token',
				refresh_token: refreshToken
			}).toString()
		})
		return await response.json()
	}
}
