module.exports = {
  name: 'express-transformer',
  moduleFileExtensions: ['ts', 'js'],
  verbose: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  transform: { '^.+\\.(ts)$': 'babel-jest', },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  testEnvironment: 'node'
}
