# Express Authenticators [![Build Status](https://travis-ci.org/tranvansang/express-authenticators.svg?branch=master)](https://travis-ci.org/tranvansang/express-authenticators)

[![NPM](https://nodei.co/npm/express-authenticators.png)](https://nodei.co/npm/express-authenticators/)

Third party authenticator module re-written in Typescript

- Zero dependency OAuth and OAuth2 implementations in Typescript.
- Support fetching user profile for various providers: Google, Facebook, Twitter, Instagram, Tumblr, Github, LinkedIn, Pinterest, Foursquare.

# Usage

- With `yarn`: `yarn add express-authenticators`.
- With `npm`: `npm install --save express-authenticators`.

## Sample code

```javascript

const {
	FacebookAuthenticator,
	FoursquareAuthenticator,
	GithubAuthenticator,
	GoogleAuthenticator,
	InstagramAuthenticator,
	LinkedInAuthenticator,
	PinterestAuthenticator,
	TumblrAuthenticator,
	TwitterAuthenticator,
	OAuth2,
	OAuth
} = require('express-authenticators')
const express = require('express')
const session = require('express-session')
const asyncMiddleware = require('middleware-async').default

const app = express()
app.use(session())

const facebookAuth = new FacebookAuthenticator({
	clientID: 'facebook app id',
	clientSecret: 'facebook app secret',
	redirectUri: `https://example.com/auth/facebook/callback`,
})

app.get(
	'/auth/facebook',
	(req, res, next) => {
		req.session.someInfo = 'my info' // store the user credential
		facebookAuth.authenticate(req, res, next)
	}
/*
or
app.get('/auth/facebook', facebookAuth.authenticate)
*/
)
app.get(
	`/auth/facebook/callback`,
	asyncMiddleware(async (req, res) => {
		const token = await facebookAuth.callback(req)
		const profile = await facebookAuth.fetchProfile(token)
		console.log('got profile', profile)
		res.send(JSON.stringify(profile))
	})
)

```
# API references

This module requires `express-session` middleware to be applied before.

Exported classes:

- `FacebookAuthenticator`, `FoursquareAuthenticator`, `GithubAuthenticator`, `GoogleAuthenticator`, `InstagramAuthenticator`, `LinkedInAuthenticator`, `PinterestAuthenticator`, `TumblrAuthenticator`, `TwitterAuthenticator`.
	
	All these classes have a same interface, they all inherit OAuth2 or OAuth classes
	
```typescript
constructor(option: {
    clientID: 'app id',
    clientSecret: 'app secret',
    redirectUri: `https://example.com/auth/<provider>/callback`
})
authenticate(req: Request, res: Response): Promise<void> | void // async middleware
callback(req: Request): Promise<TokenType> | TokenType
fetchProfile(tokenSet: TokenType): Promise<{
	id?: string
	email?: string
	emailVerified?: boolean
	first?: string
	last?: string
	avatar?: string
	raw: any
}>
```

`authenticate`: redirect middleware
If there is no error, this middleware will redirect the user to the provider website.
Eventually, redirect back to our pre-configured `redirectUri` with appropriate user privilege.

`callback`: take the request and return a promise which returns a token for profile fetching.
This function should be called in the callback url handler. Check example at the end of this readme.

`fetchProfile`: provider-specific profile fetcher using the token returned by `callback`.


- `OAuth2`, `OAuth`
	
In principle these classes have `authenticate` and `callback` methods.
However, I recommend you use the provider-specific classes described above.
If you need an additional provider, clone the other providers' implementations then make your own.

Here are two sample implementations of `FacebookAuthenticator` (`OAuth2`), and `TwitterAuthenticator` (`OAuth`)

```typescript
class FacebookAuthenticator extends OAuth2 implements IOAuthProfileFetcher<string> {
	fetchProfile = fetchFacebookProfile //make your own profile fetcher
	constructor(options: {
		clientID: string
		clientSecret: string
		redirectUri: string
		scope?: string
	}) {
		super({
			consentURL: 'https://www.facebook.com/v6.0/dialog/oauth',
			tokenURL: 'https://graph.facebook.com/v6.0/oauth/access_token',
			scope: ['email'].join(','),
			...options,
		}, {
			ignoreGrantType: true,
			tokenRequestMethod: TokenRequestMethod.GET,
			includeStateInAccessToken: false
		})
	}
}
class TwitterAuthenticator extends OAuth implements IOAuthProfileFetcher<IOAuthTokenSet> {
	constructor(config: {
		clientID: string
		clientSecret: string
		redirectUri: string
	}) {
		super({
			consumerKey: config.clientID,
			consumerSecret: config.clientSecret,
			callbackUrl: config.redirectUri,
			requestTokenUrl: 'https://api.twitter.com/oauth/request_token',
			accessTokenUrl: 'https://api.twitter.com/oauth/access_token',
			authorizeUrl: 'https://api.twitter.com/oauth/authorize',
			signingMethod: OAuthSigningMethod.Hmac,
		})
	}

	async fetchProfile(tokenSet: IOAuthTokenSet){
    //make use of this.signAndFetch and make your own profile fetcher
		const response = await this.signAndFetch(
			'https://api.twitter.com/1.1/account/verify_credentials.json',
			{
				qs: { include_email: true},
			},
			tokenSet
		)
		if (!response.ok) throw new OAuthProfileError(await response.text())
		const profile = await response.json()
		if (!profile.id_str) throw new OAuthProfileError('Invalid Twitter profile ID')
		return {
			id: profile.id_str,
			raw: profile,
			avatar: profile.profile_image_url_https
				|| profile.profile_image_url
				|| profile.profile_background_image_url_https
				|| profile.profile_background_image_url,
			first: profile.name || profile.screen_name,
			email: profile.email,
			emailVerified: !!profile.email,
			/**
			 * from twitter docs
			 * https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/get-account-verify_credentials
			 * When set to true email will be returned in the user objects as a string. If the user does not have an email address on their account, or if the email address is not verified, null will be returned.
			 */
		}
	}
}
```

