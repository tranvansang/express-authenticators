import {getAccessToken, getConsentUrl, OAuthCallbackQuery, OAuthError, OAuthState} from '../lib/oauth'
import {jsonFetch, OAuthProfile} from '../lib/util'

const enablePKCE = false

export const getGithubConsentUrl = (
	{
		scope = [
			'read:user',
			'user:email'
		].join(' '),
		clientID,
		redirectUri,
	}: {
		clientID: string
		redirectUri: string
		scope?: string
	}
) => getConsentUrl({
	clientID,
	redirectUri,
	scope,
	consentUrl: 'https://github.com/login/oauth/authorize',
	enablePKCE,
})

export const getGithubAccessToken = async (
	{clientID, clientSecret, redirectUri}: {
		clientID: string
		clientSecret: string
		redirectUri: string
	},
	state: OAuthState,
	query: OAuthCallbackQuery,
) => await getAccessToken<{
	access_token: string
	token_type: 'bearer'
	scope: string
}>(
	{
		clientID,
		clientSecret,
		redirectUri,
		enablePKCE,
		tokenUrl: 'https://github.com/login/oauth/access_token',
		ignoreGrantType: true,
		requestMethod: 'POST',
		includeStateWhenRequest: true,
	},
	state,
	query,
)

// https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#response
export const fetchGithubProfile = async (
	access_token: string,
): Promise<OAuthProfile> => {
	const profile = await jsonFetch('https://api.github.com/user', {
		headers: {
			Authorization: `token ${access_token}`,
			Accept: 'application/json',
		}
	})
	let emails: any[]
	try {
		emails = await jsonFetch('https://api.github.com/user/emails', {
			headers: {
				Authorization: `token ${access_token}`,
				Accept: 'application/json',
			}
		})
	} catch { /* empty */ }
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
	if (!profile.id) throw new OAuthError('Invalid Github profile ID')
	return {
		id: profile.id,
		first: profile.name,
		last: '',
		avatar: profile.avatar_url,
		...getEmail(),
		raw: profile
	}
}
