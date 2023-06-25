import {
	getOAuth1AccessToken,
	getOauth1ConsentUrl,
	OAuth1CallbackQuery,
	OAuth1Error,
	oauth1SignAndFetch,
	OAuth1State,
	OAuth1TokenPayload
} from '../lib/oauth1'
import {OAuthProfile} from '../lib/util'

const signingMethod = 'HMAC-SHA1'
export const getTumblrConsentUrl = (
	{
		clientID,
		clientSecret,
		redirectUri,
	}: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}
) => getOauth1ConsentUrl({
	redirectUri,
	clientID,
	clientSecret,
	tokenUrl: 'https://www.tumblr.com/oauth/request_token',
	consentUrl: 'https://www.tumblr.com/oauth/authorize',
	signingMethod,
})

export const getTumblrAccessToken = async (
	{clientID, clientSecret}: {
		clientID: string
		clientSecret: string
	},
	state: OAuth1State,
	query: OAuth1CallbackQuery,
) => await getOAuth1AccessToken(
	{
		clientID,
		clientSecret,
		tokenUrl: 'https://www.tumblr.com/oauth/access_token',
		signingMethod,
	},
	state,
	query,
)
export const fetchTumblrProfile = async (
	{clientID, clientSecret}: {
		clientID: string
		clientSecret: string
	},
	tokenPayload: OAuth1TokenPayload
): Promise<OAuthProfile> => {
	const response = await oauth1SignAndFetch(
		{
			clientID,
			clientSecret,
			signingMethod,
		},
		'https://api.tumblr.com/v2/user/info',
		{},
		tokenPayload
	)
	if (!response.ok) throw new OAuth1Error(await response.text())
	const profile = await response.json()
	let blogProfile
	if (profile?.response?.user?.name) {
		const blogResponse = await oauth1SignAndFetch(
			{
				clientID,
				clientSecret,
				signingMethod,
			},
			`https://api.tumblr.com/v2/blog/${profile.response.user.name}.tumblr.com/info`,
			{},
			tokenPayload
		)
		if (blogResponse.ok) {
			blogProfile = await blogResponse.json()
		}
	}
	return {
		id: blogProfile?.response?.blog?.uuid,
		first: blogProfile?.response?.blog?.title,
		avatar: blogProfile?.response?.blog?.avatar?.[0]?.url,
		raw: {
			profile,
			blogProfile
		},
	}
}
