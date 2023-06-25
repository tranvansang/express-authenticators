import {getAccessToken, getConsentUrl, OAuthCallbackQuery, OAuthError, OAuthState} from '../lib/oauth'
import {OAuthProfile} from '../lib/util'
import {URLSearchParams} from 'url'

export const getGoogleConsentUrl = (
	{
		scope = [
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/userinfo.profile'
		].join(' '),
		clientID,
		redirectUri,
		disablePKCE,
	}: {
		clientID: string
		redirectUri: string
		scope?: string
		disablePKCE?: boolean
	}
) => getConsentUrl({
	clientID,
	redirectUri,
	scope,
	consentUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
	enablePKCE: !disablePKCE,
})

export const getGoogleAccessToken = async (
	{clientID, clientSecret, redirectUri, disablePKCE}: {
		clientID: string
		clientSecret: string
		redirectUri: string
		disablePKCE?: boolean
	},
	state: OAuthState,
	query: OAuthCallbackQuery,
) => await getAccessToken<{
	access_token: string
	expires_in: number
	refresh_token: string
	scope: string
	token_type: 'Bearer'
}>(
	{
		clientID,
		clientSecret,
		redirectUri,
		enablePKCE: !disablePKCE,
		tokenUrl: 'https://oauth2.googleapis.com/token',
		ignoreGrantType: false,
		requestMethod: 'POST',
		includeStateWhenRequest: false,
	},
	state,
	query,
)

export const refreshGoogleAccessToken = async (
	{clientID, clientSecret}: {
		clientID: string
		clientSecret: string
	},
	refreshToken: string,
) => {
	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		},
		body: new URLSearchParams({
			client_id: clientID,
			client_secret: clientSecret,
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		}).toString()
	})
	if (!res.ok) throw new OAuthError(await res.text())
	return await res.json()
}

// https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
const profilePictureSize = 1024
export const fetchGoogleProfile = async (
	access_token: string,
	{
		fields = [
			'emailAddresses',
			'names',
			'nicknames',
			'photos',
			'urls',
		]
	} = {}
): Promise<OAuthProfile> => {
	const res = await fetch(`https://people.googleapis.com/v1/people/me?${new URLSearchParams({
		access_token,
		personFields: fields.join(',')
	}).toString()}`)
	if (!res.ok) throw new OAuthError(await res.text())
	const profile = await res.json()
	if (
		!profile.resourceName?.startsWith('people/')
	) throw new OAuthError('Invalid response from Google People API')
	const id = profile.resourceName.slice('people/'.length)
	if (!id) throw new OAuthError('Invalid Google profile ID')
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
