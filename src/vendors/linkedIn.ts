import {getAccessToken, getConsentUrl, OAuthCallbackQuery, OAuthError, OAuthState} from '../lib/oauth'
import {jsonFetch, OAuthProfile} from '../lib/util'

const enablePKCE = false
export const getLinkedInConsentUrl = (
	{
		scope = [
				'r_emailaddress',
				'r_liteprofile',
				// 'w_member_social'
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
	consentUrl: 'https://www.linkedin.com/oauth/v2/authorization',
	enablePKCE,
})

export const getLinkedInAccessToken = async (
	{clientID, clientSecret, redirectUri}: {
		clientID: string
		clientSecret: string
		redirectUri: string
	},
	state: OAuthState,
	query: OAuthCallbackQuery,
) => await getAccessToken<{
	access_token: string
	expires_in: number
}>(
	{
		clientID,
		clientSecret,
		redirectUri,
		tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
		ignoreGrantType: false,
		requestMethod: 'POST',
		includeStateWhenRequest: true,
		enablePKCE,
	},
	state,
	query,
)

// https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?context=linkedin%2Fcontext&tabs=HTTPS#step-3-exchange-authorization-code-for-an-access-token
export const fetchLinkedInProfile = async (
	access_token: string
): Promise<OAuthProfile> => {
	const profile = await jsonFetch(`https://api.linkedin.com/v2/me?projection=(${
		[
			'id',
			'profilePicture(displayImage~:playableStreams)',
			'firstName',
			'lastName',
			'localizedFirstName',
			'localizedLastName',
		].join(',')
	})`, {
		headers: {
			Authorization: `Bearer ${access_token}`,
			Accept: 'application/json',
		}
	})
	if (!profile.id) throw new OAuthError('Invalid LinkedIn profile ID')
	return {
		id: profile.id,
		first: profile.localizedFirstName,
		last: profile.localizedLastName,
		raw: profile
	}
}
