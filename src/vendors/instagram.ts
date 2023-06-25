import {getAccessToken, getConsentUrl, OAuthCallbackQuery, OAuthError, OAuthState} from '../lib/oauth'
import {URLSearchParams} from 'url'
import {jsonFetch, OAuthProfile} from '../lib/util'

const enablePKCE = false

export const getInstagramConsentUrl = (
	{
		scope = [
			'instagram_graph_user_profile',
			'instagram_graph_user_media'
		].join(' '), //separator can be comma or space
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
	consentUrl: 'https://api.instagram.com/oauth/authorize',
	enablePKCE,
})

export const getInstagramAccessToken = async (
	{clientID, clientSecret, redirectUri}: {
		clientID: string
		clientSecret: string
		redirectUri: string
	},
	state: OAuthState,
	query: OAuthCallbackQuery,
) => await getAccessToken<{
	access_token: string
	user_id: string
}>(
	{
		clientID,
		clientSecret,
		redirectUri,
		tokenUrl: 'https://api.instagram.com/oauth/access_token',
		ignoreGrantType: false,
		requestMethod: 'POST',
		includeStateWhenRequest: false,
		enablePKCE,
	},
	state,
	query,
)

// https://developers.facebook.com/docs/instagram-basic-display-api/reference/oauth-access-token
export const fetchInstagramProfile = async (
	access_token: string,
	{
		fields = [
			'account_type',
			'id',
			'media_count',
			'username'
		]
	} = {}
): Promise<OAuthProfile> => {
	const profile = await jsonFetch(`https://graph.instagram.com/me?${new URLSearchParams({
		access_token,
		fields: fields.join(',')
	}).toString()}`, {
		headers: {
			Accept: 'application/json',
		}
	})
	if (!profile.id) throw new OAuthError('Invalid Instagram profile ID')
	let graphProfile
	if (profile.username) {
		try {
			graphProfile = await jsonFetch(`https://instagram.com/${profile.username}/?__a=1`)
		} catch { /* empty */ }
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
