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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var OAuth2_1 = __importStar(require("./oauth2/OAuth2"));
var node_fetch_1 = __importDefault(require("node-fetch"));
var OAuthCommon_1 = require("./OAuthCommon");
exports.fetchGithubProfile = function (token) { return __awaiter(void 0, void 0, void 0, function () {
    var res, _a, emailRes, emails, getEmail, profile;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, node_fetch_1.default('https://api.github.com/user', {
                    headers: {
                        Authorization: "token " + token,
                        Accept: 'application/json',
                    }
                })];
            case 1:
                res = _b.sent();
                if (!!res.ok) return [3 /*break*/, 3];
                _a = OAuthCommon_1.OAuthProfileError.bind;
                return [4 /*yield*/, res.text()];
            case 2: throw new (_a.apply(OAuthCommon_1.OAuthProfileError, [void 0, _b.sent()]))();
            case 3: return [4 /*yield*/, node_fetch_1.default('https://api.github.com/user/emails', {
                    headers: {
                        Authorization: "token " + token,
                        Accept: 'application/json',
                    }
                })];
            case 4:
                emailRes = _b.sent();
                if (!emailRes.ok) return [3 /*break*/, 6];
                return [4 /*yield*/, emailRes.json()];
            case 5:
                emails = _b.sent();
                _b.label = 6;
            case 6:
                getEmail = function () {
                    for (var _i = 0, _a = [
                        function (meta) { return (meta === null || meta === void 0 ? void 0 : meta.primary) && (meta === null || meta === void 0 ? void 0 : meta.verified); },
                        function (meta) { return meta === null || meta === void 0 ? void 0 : meta.verified; },
                        function (meta) { return meta === null || meta === void 0 ? void 0 : meta.primary; },
                        function (meta) { return (meta === null || meta === void 0 ? void 0 : meta.visibility) === 'public'; },
                        function () { return true; },
                    ]; _i < _a.length; _i++) {
                        var emailFilter = _a[_i];
                        for (var _b = 0, _c = emails || []; _b < _c.length; _b++) {
                            var emailData = _c[_b];
                            if ((emailData === null || emailData === void 0 ? void 0 : emailData.email) && emailFilter(emailData))
                                return {
                                    email: emailData.email,
                                    emailVerified: emailData.verified
                                };
                        }
                    }
                };
                return [4 /*yield*/, res.json()];
            case 7:
                profile = _b.sent();
                if (!profile.id)
                    throw new OAuthCommon_1.OAuthProfileError('Invalid Github profile ID');
                return [2 /*return*/, __assign(__assign({ id: profile.id, first: profile.name, last: '', avatar: profile.avatar_url }, getEmail()), { raw: profile })];
        }
    });
}); };
var GithubAuthenticator = /** @class */ (function (_super) {
    __extends(GithubAuthenticator, _super);
    function GithubAuthenticator(options) {
        var _this = _super.call(this, __assign({ consentURL: 'https://github.com/login/oauth/authorize', tokenURL: 'https://github.com/login/oauth/access_token', scope: [
                'read:user',
                'user:email'
            ].join(' ') }, options), {
            ignoreGrantType: true,
            tokenRequestMethod: OAuth2_1.TokenRequestMethod.POST,
            includeStateInAccessToken: true
        }) || this;
        _this.fetchProfile = exports.fetchGithubProfile;
        return _this;
    }
    return GithubAuthenticator;
}(OAuth2_1.default));
exports.default = GithubAuthenticator;
