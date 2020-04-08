"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = __importDefault(require("node-fetch"));
var qs_1 = __importDefault(require("qs"));
var oauthUtils_1 = require("./oauthUtils");
var OAuthError_1 = __importDefault(require("./OAuthError"));
var r3986_1 = __importDefault(require("r3986"));
var version = '1.0';
var sessionKey = 'oauth';
var OAuth = /** @class */ (function () {
    function OAuth(config) {
        this.config = config;
    }
    OAuth.prototype.signAndFetch = function (url, options, tokenSet) {
        return node_fetch_1.default("" + url + (options.qs ? "?" + qs_1.default.stringify(options.qs) : ''), {
            headers: __assign(__assign({}, options.headers), { Authorization: this.authorizationHeader(url, options, tokenSet) }),
            method: options.method,
            body: options.body && qs_1.default.stringify(options.body),
        });
    };
    OAuth.prototype.authenticate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, _b, oauth_token, oauth_token_secret, oauth_callback_confirmed, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.signAndFetch(this.config.requestTokenUrl, {
                            method: 'POST',
                            oauthHeaders: {
                                oauth_callback: this.config.callbackUrl,
                            }
                        })];
                    case 1:
                        response = _e.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        _a = OAuthError_1.default.bind;
                        return [4 /*yield*/, response.text()];
                    case 2: throw new (_a.apply(OAuthError_1.default, [void 0, _e.sent()]))();
                    case 3:
                        _d = (_c = qs_1.default).parse;
                        return [4 /*yield*/, response.text()];
                    case 4:
                        _b = _d.apply(_c, [_e.sent()]), oauth_token = _b.oauth_token, oauth_token_secret = _b.oauth_token_secret, oauth_callback_confirmed = _b.oauth_callback_confirmed;
                        if (oauth_callback_confirmed !== 'true')
                            throw new Error('Failed to request access token');
                        req.session[sessionKey] = {
                            secret: oauth_token_secret
                        };
                        res.status(302).redirect(this.config.authorizeUrl + "?" + qs_1.default.stringify({ oauth_token: oauth_token }));
                        return [2 /*return*/];
                }
            });
        });
    };
    OAuth.prototype.callback = function (req) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var _b, oauth_token, oauth_verifier, response, _c, _d, token, secret, user_id, screen_name, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _b = req.query, oauth_token = _b.oauth_token, oauth_verifier = _b.oauth_verifier;
                        if (!((_a = req.session[sessionKey]) === null || _a === void 0 ? void 0 : _a.secret))
                            throw new OAuthError_1.default('Last token secret lost');
                        return [4 /*yield*/, this.signAndFetch(this.config.accessTokenUrl, {
                                oauthHeaders: {
                                    oauth_verifier: oauth_verifier,
                                },
                                method: 'POST'
                            }, {
                                token: oauth_token,
                                secret: req.session[sessionKey].secret
                            })];
                    case 1:
                        response = _g.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        _c = OAuthError_1.default.bind;
                        return [4 /*yield*/, response.text()];
                    case 2: throw new (_c.apply(OAuthError_1.default, [void 0, _g.sent()]))();
                    case 3:
                        _f = (_e = qs_1.default).parse;
                        return [4 /*yield*/, response.text()];
                    case 4:
                        _d = _f.apply(_e, [_g.sent()]), token = _d.oauth_token, secret = _d.oauth_token_secret, user_id = _d.user_id, screen_name = _d.screen_name;
                        return [2 /*return*/, { token: token, secret: secret }];
                }
            });
        });
    };
    OAuth.prototype.authorizationHeader = function (url, _a, tokenSet) {
        var _b = _a.method, method = _b === void 0 ? 'GET' : _b, _c = _a.body, body = _c === void 0 ? {} : _c, query = _a.qs, oauthHeaders = _a.oauthHeaders;
        var authHeaders = __assign(__assign({ oauth_consumer_key: this.config.consumerKey, oauth_signature_method: this.config.signingMethod, oauth_timestamp: oauthUtils_1.getTimestamp(), oauth_nonce: oauthUtils_1.getNonce(), oauth_version: version }, tokenSet && { oauth_token: tokenSet.token }), oauthHeaders);
        var allParams = __assign(__assign(__assign({}, body), query), authHeaders);
        var allPairs = Object.keys(allParams)
            .map(function (k) { return [k, allParams[k]]; })
            .map(function (arr) { return arr.map(r3986_1.default); })
            .sort(function (_a, _b) {
            var a1 = _a[0], b1 = _a[1];
            var a2 = _b[0], b2 = _b[1];
            return a1 < a2
                ? -1
                : a1 > a2
                    ? 1
                    : b1 < b2
                        ? -1
                        : b1 > b2
                            ? 1
                            : 0;
        })
            .map(function (_a) {
            var k = _a[0], v = _a[1];
            return k + "=" + v;
        })
            .join('&');
        var baseString = method + "&" + r3986_1.default(url) + "&" + r3986_1.default(allPairs);
        var signature = oauthUtils_1.oauthSign(this.config.signingMethod, baseString, this.config.consumerSecret, tokenSet === null || tokenSet === void 0 ? void 0 : tokenSet.secret);
        var signedAuthHeaders = __assign(__assign({}, authHeaders), { oauth_signature: signature });
        var signedAuthHeadersRaw = Object
            .keys(signedAuthHeaders)
            .map(function (k) { return r3986_1.default(k) + "=\"" + r3986_1.default(signedAuthHeaders[k]) + "\""; })
            .join(', ');
        return "OAuth " + signedAuthHeadersRaw;
    };
    return OAuth;
}());
exports.default = OAuth;
