module.exports = {
	displayName: 'express-authenticators',
	moduleFileExtensions: ['ts', 'js'],
	verbose: true,
	collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
	transform: {'^.+\\.(ts)$': 'babel-jest', },
	testMatch: ['<rootDir>/src/**/*.test.ts'],
	testEnvironment: 'node'
}
