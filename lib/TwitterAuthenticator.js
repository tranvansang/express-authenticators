"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var OAuth_1 = __importDefault(require("./oauth/OAuth"));
var oauthUtils_1 = require("./oauth/oauthUtils");
var OAuthCommon_1 = require("./OAuthCommon");
var TwitterAuthenticator = /** @class */ (function (_super) {
    __extends(TwitterAuthenticator, _super);
    function TwitterAuthenticator(config) {
        return _super.call(this, {
            consumerKey: config.clientID,
            consumerSecret: config.clientSecret,
            callbackUrl: config.redirectUri,
            requestTokenUrl: 'https://api.twitter.com/oauth/request_token',
            accessTokenUrl: 'https://api.twitter.com/oauth/access_token',
            authorizeUrl: 'https://api.twitter.com/oauth/authorize',
            signingMethod: oauthUtils_1.OAuthSigningMethod.hmac,
        }) || this;
    }
    TwitterAuthenticator.prototype.fetchProfile = function (tokenSet) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, profile;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.signAndFetch('https://api.twitter.com/1.1/account/verify_credentials.json', {
                            qs: { include_email: true },
                        }, tokenSet)];
                    case 1:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        _a = OAuthCommon_1.OAuthProfileError.bind;
                        return [4 /*yield*/, response.text()];
                    case 2: throw new (_a.apply(OAuthCommon_1.OAuthProfileError, [void 0, _b.sent()]))();
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        profile = _b.sent();
                        if (!profile.id_str)
                            throw new OAuthCommon_1.OAuthProfileError('Invalid Twitter profile ID');
                        return [2 /*return*/, {
                                id: profile.id_str,
                                raw: profile,
                                avatar: profile.profile_image_url_https
                                    || profile.profile_image_url
                                    || profile.profile_background_image_url_https
                                    || profile.profile_background_image_url,
                                first: profile.name || profile.screen_name,
                                email: profile.email,
                                emailVerified: !!profile.email,
                            }];
                }
            });
        });
    };
    return TwitterAuthenticator;
}(OAuth_1.default));
exports.default = TwitterAuthenticator;
