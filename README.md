# Express Authenticators [![Build Status](https://travis-ci.org/tranvansang/express-authenticators.svg?branch=master)](https://travis-ci.org/tranvansang/express-authenticators)

[![NPM](https://nodei.co/npm/express-authenticators.png)](https://nodei.co/npm/express-authenticators/)

Modern OAuth/OAuth2 authenticator.

## Features

- Pre-configured for popular providers: Apple, Google, Facebook, Foursquare, Github, Twitter, LinkedIn, LINE, Pinterest, Tumblr, Instagram.
- Pre-configured for popular scopes: email, profile, etc. with account fetching for basic user information.
- OAuth/OAuth2 utilities are available for customizing new providers.
- The only dependencies are `r3986` and `jws` (`jws` is required for Google and Apple token check).
- Strongly typed with TypeScript.
- Support PKCE([Proof Key for Code Exchange](https://oauth.net/2/pkce/)).
- Generic and pure interface. Do not depend on any framework.

# Usage

- With `yarn`: `yarn add express-authenticators`.
- With `npm`: `npm install --save express-authenticators`.

## Requirement
- `fetch` polyfilled.
- NodeJS >= v14.17.0 (to use `randomUUID()`).

## Exported APIs

```typescript
export {
	getGoogleConsentUrl, getGoogleAccessToken, fetchGoogleProfile, refreshGoogleAccessToken, verifyGoogleIdToken,
	getFacebookConsentUrl, getFacebookAccessToken, fetchFacebookProfile,
	getAppleConsentUrl, getAppleToken, generateAppleClientSecret, verifyAppleIdToken, revokeAppleToken,
	getGithubConsentUrl, getGithubAccessToken, fetchGithubProfile,
	getFoursquareConsentUrl, getFoursquareAccessToken, fetchFoursquareProfile,
	getInstagramConsentUrl, getInstagramAccessToken, fetchInstagramProfile,
	getLineConsentUrl, getLineAccessToken, fetchLineProfile, refreshLineAccessToken,
	getLinkedInConsentUrl, getLinkedInAccessToken, fetchLinkedInProfile,
	getTwitterConsentUrl, getTwitterAccessToken, fetchTwitterProfile,
	getTumblrConsentUrl, getTumblrAccessToken, fetchTumblrProfile,
	getZaloConsentUrl, getZaloAccessToken, fetchZaloProfile, refreshZaloAccessToken,
	getPinterestConsentUrl, getPinterestAccessToken, fetchPinterestProfile,
	getConsentUrl, getAccessToken,
	getOauth1ConsentUrl, getOAuth1AccessToken, oauth1SignAndFetch,
}
```

## Sample Usage

```javascript
const {
	getGoogleConsentUrl, getGoogleAccessToken, fetchGoogleProfile, refreshGoogleAccessToken, verifyGoogleIdToken,
} = require('express-authenticators')
const express = require('express')
const session = require('express-session')

const app = express()
app.use(session())

app.get(
	'/auth/google',
	async (req, res, next) => {
		req.session.someInfo = 'my info' // store the user credential
		try {
			const {url, state} = await getGoogleConsentUrl({
        clientID: 'your client id',
        redirectUri: 'https://your-host.com/auth/google/callback',
      })
			req.session.oauthGoogle = JSON.stringify(state)
			res.redirect(302, url)
		} catch (e) {
			next(e)
		}
	}
)
app.get( // for AppleAuthenticator, must use POST method instead
	'/auth/google/callback',
	async (req, res, next) => {
		try {
			const {access_token} = await getGoogleAccessToken(
        {
          clientID: 'your client id',
          clientSecret: 'your client secret',
          redirectUri: 'https://your-host.com/auth/google/callback',
        },
				JSON.parse(req.session.oauthGoogle),
        Object.fromEntries(new URLSearchParams(new URL(`https://example.com${req.url}`).search)) // for AppleAuthenticator, use req.body instead
			)
			const profile = await fetchGoogleProfile(access_token)
			console.log('got profile', profile)
			res.send(JSON.stringify(profile))
		} catch (e) {
			next(e)
		}
	}
)
```

## Profile interface

All fetch profile APIs return the same interface:

```typescript
interface OAuthProfile {
	id?: string
	email?: string
	emailVerified?: boolean
	first?: string
	last?: string
	avatar?: string
	raw: any
}
```

Where `raw` is the raw JSON-parsed data returned from the provider.
Other fields are calculated **carefully** based on the data returned from each provider.
