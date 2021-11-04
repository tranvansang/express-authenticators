import OAuth2, {TokenRequestMethod} from '../oauth2/OAuth2'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from '../OAuthCommon'

// https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?context=linkedin%2Fcontext&tabs=HTTPS#step-3-exchange-authorization-code-for-an-access-token
interface ILinkedInTokenPayload {
	access_token: string
	expires_in: number
}

const fetchLinkedInProfile = async (
	{access_token}: ILinkedInTokenPayload,
) => {
	const res = await fetch(`https://api.linkedin.com/v2/me?projection=(${
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
	if (!res.ok) throw new OAuthProfileError(await res.text())
	const profile = await res.json()
	if (!profile.id) throw new OAuthProfileError('Invalid LinkedIn profile ID')
	return {
		id: profile.id,
		first: profile.localizedFirstName,
		last: profile.localizedLastName,
		raw: profile
	}
}

export default class LinkedInAuthenticator
	extends OAuth2<ILinkedInTokenPayload>
	implements IOAuthProfileFetcher<ILinkedInTokenPayload> {
	fetchProfile = fetchLinkedInProfile

	constructor(options: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://www.linkedin.com/oauth/v2/authorization',
			tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
			scope: [
				'r_emailaddress',
				'r_liteprofile',
				// 'w_member_social'
			].join(' '),
			...options,
		}, {
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: true,
			enablePKCE: false,
		})
	}
}
