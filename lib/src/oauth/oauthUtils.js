"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var uuid_1 = require("uuid");
var crypto_1 = __importDefault(require("crypto"));
var OAuthError_1 = __importDefault(require("./OAuthError"));
var r3986_1 = __importDefault(require("r3986"));
exports.getTimestamp = function () { return Math.floor(Date.now() / 1000); };
exports.getNonce = function () { return uuid_1.v4(); };
var OAuthSigningMethod;
(function (OAuthSigningMethod) {
    OAuthSigningMethod["Hmac"] = "HMAC-SHA1";
    OAuthSigningMethod["Plain"] = "PLAINTEXT";
    OAuthSigningMethod["Rsa"] = "RSA-SHA1";
})(OAuthSigningMethod = exports.OAuthSigningMethod || (exports.OAuthSigningMethod = {}));
exports.oauthSign = function (method, base, consumerSecret, tokenSecret) {
    switch (method) {
        case OAuthSigningMethod.Hmac:
            consumerSecret = r3986_1.default(consumerSecret);
            tokenSecret = tokenSecret ? r3986_1.default(tokenSecret) : '';
            return crypto_1.default.createHmac('sha1', consumerSecret + "&" + tokenSecret)
                .update(base)
                .digest('base64');
        case OAuthSigningMethod.Plain:
            consumerSecret = r3986_1.default(consumerSecret);
            tokenSecret = tokenSecret ? r3986_1.default(tokenSecret) : '';
            return consumerSecret + "&" + tokenSecret;
        case OAuthSigningMethod.Rsa:
            return crypto_1.default.createSign('RSA-SHA1')
                .update(base)
                .sign(consumerSecret, 'base64');
        default:
            throw new OAuthError_1.default("Unknown OAuth signing method " + method);
    }
};
