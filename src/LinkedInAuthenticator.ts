import OAuth2, {TokenRequestMethod} from './oauth2/OAuth2'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from './OAuthCommon'

const fetchLinkedInProfile = async (
	token: string,
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
			Authorization: `Bearer ${token}`,
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

export default class LinkedInAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
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
				'w_member_social'
			].join(' '),
			...options,
		}, {
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: true,
			enablePKCE: true,
		})
	}
}
