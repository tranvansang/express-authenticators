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
var TumblrAuthenticator = /** @class */ (function (_super) {
    __extends(TumblrAuthenticator, _super);
    function TumblrAuthenticator(config) {
        return _super.call(this, {
            consumerKey: config.clientID,
            consumerSecret: config.clientSecret,
            callbackUrl: config.redirectUri,
            requestTokenUrl: 'https://www.tumblr.com/oauth/request_token',
            accessTokenUrl: 'https://www.tumblr.com/oauth/access_token',
            authorizeUrl: 'https://www.tumblr.com/oauth/authorize',
            signingMethod: oauthUtils_1.OAuthSigningMethod.Hmac,
        }) || this;
    }
    TumblrAuthenticator.prototype.fetchProfile = function (tokenSet) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __awaiter(this, void 0, void 0, function () {
            var response, _l, profile, blogProfile, blogResponse;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0: return [4 /*yield*/, this.signAndFetch('https://api.tumblr.com/v2/user/info', {}, tokenSet)];
                    case 1:
                        response = _m.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        _l = OAuthCommon_1.OAuthProfileError.bind;
                        return [4 /*yield*/, response.text()];
                    case 2: throw new (_l.apply(OAuthCommon_1.OAuthProfileError, [void 0, _m.sent()]))();
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        profile = _m.sent();
                        if (!((_b = (_a = profile === null || profile === void 0 ? void 0 : profile.response) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.signAndFetch("https://api.tumblr.com/v2/blog/" + profile.response.user.name + ".tumblr.com/info", {}, tokenSet)];
                    case 5:
                        blogResponse = _m.sent();
                        if (!blogResponse.ok) return [3 /*break*/, 7];
                        return [4 /*yield*/, blogResponse.json()];
                    case 6:
                        blogProfile = _m.sent();
                        _m.label = 7;
                    case 7: return [2 /*return*/, {
                            id: (_d = (_c = blogProfile === null || blogProfile === void 0 ? void 0 : blogProfile.response) === null || _c === void 0 ? void 0 : _c.blog) === null || _d === void 0 ? void 0 : _d.uuid,
                            first: (_f = (_e = blogProfile === null || blogProfile === void 0 ? void 0 : blogProfile.response) === null || _e === void 0 ? void 0 : _e.blog) === null || _f === void 0 ? void 0 : _f.title,
                            avatar: (_k = (_j = (_h = (_g = blogProfile === null || blogProfile === void 0 ? void 0 : blogProfile.response) === null || _g === void 0 ? void 0 : _g.blog) === null || _h === void 0 ? void 0 : _h.avatar) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.url,
                            raw: {
                                profile: profile,
                                blogProfile: blogProfile
                            },
                        }];
                }
            });
        });
    };
    return TumblrAuthenticator;
}(OAuth_1.default));
exports.default = TumblrAuthenticator;
