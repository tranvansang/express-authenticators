import OAuth2, {TokenRequestMethod} from './oauth2/OAuth2'
import fetch from 'node-fetch'
import {IOAuthProfileFetcher, OAuthProfileError} from './OAuthCommon'
import qs from 'qs'

const fetchInstagramProfile = async (
	token: string,
	fields = [
		'account_type',
		'id',
		'media_count',
		'username'
	]
) => {
	const res = await fetch(`https://graph.instagram.com/me?${qs.stringify({
		access_token: token,
		fields: fields.join(',')
	})}`, {
		headers: {
			Accept: 'application/json',
		}
	})
	if (!res.ok) throw new OAuthProfileError(await res.text())
	const profile = await res.json()
	if (!profile.id) throw new OAuthProfileError('Invalid Instagram profile ID')
	let graphProfile
	if (profile.username) {
		const graphRes = await fetch(`https://instagram.com/${profile.username}/?__a=1`)
		if (graphRes.ok) {
			graphProfile = await graphRes.json()
		}
	}
	return {
		id: profile.id,
		first: graphProfile?.graphql?.user?.full_name,
		avatar: graphProfile?.graphql?.user?.profile_pic_url_hd || graphProfile?.graphql?.user?.profile_pic_url_hd,
		raw: {
			profile,
			graphProfile
		}
	}
}

export default class InstagramAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
	fetchProfile = fetchInstagramProfile
	constructor(options: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://api.instagram.com/oauth/authorize',
			tokenURL: 'https://api.instagram.com/oauth/access_token',
			scope: [
				'user_profile',
			].join(' '), //separator can be comma or space
			...options,
		}, {
			ignoreGrantType: false,
			tokenRequestMethod: TokenRequestMethod.POST,
			includeStateInAccessToken: false
		})
	}
}
