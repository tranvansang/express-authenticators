/* eslint-disable import/no-extraneous-dependencies */

import {oauth1Sign} from './oauth1'

describe('oauth1', () => {
	test('should sign string correctly', () => {
		const plain = 'a fox jumps over a lazy dog'
		const key = 'my secret key'
		const tokenSecret = 'a random secret'
		const pemKey = `\
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA4rBfMzLYJkL9TRWAD5xxy7j9HWOSHJrv1SI2q0zIYSH40Sa/
kdo7OBoBgy+zXGLCRbccCwOL0tv8HS2D7J0nHYa20D7brAffoa6qYwIINqt1N98a
8V2y91OhlZktYPqFfuBS2CnEbD2Uwb7x/v46+P0ZNeddAMoqJzFjKcjEmIyv//2x
0uXPtPoK3Dby5PgndN3D68K4Cn1Jt8A3WFOk42dPCZelHAqXYbVlQ3J3RC+h1jeU
DOl3D2AghTzfSUi5GS66zXKk8A2oOWFK/T2jREopok+tdzcpwqBN6YERST1k7Cpf
qNi/ufdo/WxCpTPrJM51G8L9jL6pIcU0aQaTDwIDAQABAoIBAHHTtjnzMe4kfSST
wzYTjGCLhy2WreuHMR6Ii4MAjy2W7WW4W0FVn57QECpbbWjafkqbY410PmWm6LWO
AUxyrQ16c5mltpBvc6+wEQaeIpmxBq8DbHf+YLsoV17TB6JGqXnIElFQx7zCP0v6
IXG1Hs+f52TVxDF9UiVT+0Mj+PPP3zFO3BDi4NGm3BiaE77KXLZnVnyd8F/gkqHu
3EStmzKT9lYOQ2+Ic4+hRiAy+YeStHp7RswthyNVHyPF2EAfIaxfgzunpRJEqyPK
5Sa63WJumfCrHPkdsR4e2kx1FHfBRLsQHXWXLuIQ6GRFkw7OWKoI6FpOiAs9/Pjz
GuiGlIECgYEA8ohz6hdZ2S6jWSwPH3VZWNCilKKddx7iS08jjKyH6exYQRxz80z8
NZFfd1q1Ze96c6ifhDb6bHyi426DpSATQ5Npknm/nmbupqGTjmiujX+OOo5pvVSF
gla9wlE4I0eFpNDchuyxbnC+4+RbR86RraggrXm2LcQnecD8OyJTTtECgYEA70az
F8x7jRCgFeuadVzHM3RvXG/aESwyc7tHQ61eQvH2TynAM6V0HFwjWbfgT1PNs0Gq
mQD/Sit1rmj9R65868VtKVw771aqtfmWtt+NB8lu0qxtAR+npeXtHzA7+lKT1mo9
0Tj1hswxr6goimjXhEZ95zkR3Y37OYfOI+jO+98CgYEAg7+uQB75NuqH37v4Zx1n
MMD9YILJyVjkkwZliFh86Iz0EEK1lhhe9XaIBp0m5z3lJgkWxkrbVK2MCsIRD1VS
QaZFdkVe21yNDcW+E2E4WTNOfu638BqHABvAr1tRhJCov7SZ502SwSzL9Z4qG+LR
7iTjw3jXhxsEWraEDleCK9ECgYAqHFk8oQJFi12BPhvK9+8fASjwLcdFKnAeqiEa
qhJi2c6tk/19mWrb6uNV0OSrUWZsW+w4TVKgrRFjBps82Fqn6/EQTGlH8ArPSAPc
X2+kpTDZ5vqwLfAFZHfc+1Iy9gGKxNvoTIv5k0pTTdcEtPrpDrbt0L9yLKDAOURw
UXLMJQKBgQDCbS1bjn9sj0YOzyJUMmyycgHwP4eKNdXexA7uD0dmEW7wI+tYXO4W
3aovIKGWVqCFCPUY+EK35qTJ4XIrekIdbIMuG0KvlfiYikcTHaAMsI8YN2zZ7qOV
1HG5hOqK9uCwWc+2+pY54kFdWw/oENOZ1Ak/deEdmVg/IBeC4G2Xqw==
-----END RSA PRIVATE KEY-----`
		const rsaHash = 'dXlCkWByu47qiqVnADfMVa+U7QShGtCuCc2t0nnwTUg7Xv+qF0MAnWR6wIVbsaljMZ3Lm9e+G8lZfW1yG2AXeZRZ6OKn45vRIF7lNiQlvVlvbeuEb3dZpOhKu9FN4tf8ameI/gRobfUjP6P8jf3UMow4K1tNZPQvNpJgOU+huyd1DMjj7BR6jhP3/WYnOnGrxUIvsj58zLm3TrloKJynPAXkGAxjs+QaZseHC/ypXG/AAATEjxZ2gToNkQSFniWW33JkF2cGYnKXtLDWeIvZ4jlYveJ0jCPL3E+gJ2V1Z3xxuRPNi6XFZdnk5kTOM1Dd9ObwcBpCysvWOM8f9DPDcA=='
		expect(oauth1Sign('HMAC-SHA1', plain, key))
			.toBe('kUgwfI+iYiIX16qESLvAGQKlwOI=')
		expect(oauth1Sign('HMAC-SHA1', plain, key, tokenSecret))
			.toBe('IQlp+mZNGS+vTcvjPJbJj7r30LI=')
		expect(oauth1Sign('PLAINTEXT', plain, key))
			.toBe(`${encodeURIComponent(key)}&`)
		expect(oauth1Sign('PLAINTEXT', plain, key, tokenSecret))
			.toBe(`${encodeURIComponent(key)}&${encodeURIComponent(tokenSecret)}`)
		expect(oauth1Sign('RSA-SHA1', plain, pemKey))
			.toBe(rsaHash)
		expect(oauth1Sign('RSA-SHA1', plain, pemKey, tokenSecret))
			.toBe(rsaHash)
	})
})
