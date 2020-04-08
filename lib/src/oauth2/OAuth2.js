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
var uuid_1 = require("uuid");
var qs = __importStar(require("qs"));
var node_fetch_1 = __importDefault(require("node-fetch"));
var sessionKey = 'oauth2';
var OAuth2Error = /** @class */ (function (_super) {
    __extends(OAuth2Error, _super);
    function OAuth2Error() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'OAuth2Error';
        return _this;
    }
    return OAuth2Error;
}(Error));
exports.OAuth2Error = OAuth2Error;
var TokenRequestMethod;
(function (TokenRequestMethod) {
    TokenRequestMethod["GET"] = "GET";
    TokenRequestMethod["POST"] = "POST";
})(TokenRequestMethod = exports.TokenRequestMethod || (exports.TokenRequestMethod = {}));
var OAuth2 = /** @class */ (function () {
    function OAuth2(config, options) {
        this.config = config;
        this.options = options;
    }
    OAuth2.prototype.callback = function (req) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var state, error, code, requestBody, response, _b, _c, json, err_1, access_token, token_type, expires_in;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        state = req.query.state;
                        if (state !== ((_a = req.session[sessionKey]) === null || _a === void 0 ? void 0 : _a.state))
                            throw new OAuth2Error('Invalid returning state');
                        if (req.query.error_code || req.query.error || req.query.error_description || req.query.error_message || req.query.error_reason) {
                            error = new OAuth2Error(req.query.error_message
                                || req.query.error_description
                                || req.query.error_reason
                                || req.query.error
                                || 'Unknown OAuth2 error');
                            error.code = req.query.error_code;
                            throw error;
                        }
                        code = req.query.code;
                        requestBody = __assign(__assign({ client_id: this.config.clientID, redirect_uri: this.config.redirectUri, client_secret: this.config.clientSecret, code: code }, !this.options.ignoreGrantType && { grant_type: 'authorization_code' }), this.options.includeStateInAccessToken && { state: state });
                        if (!(this.options.tokenRequestMethod === TokenRequestMethod.GET)) return [3 /*break*/, 2];
                        return [4 /*yield*/, node_fetch_1.default(this.config.tokenURL + "?" + qs.stringify(requestBody))];
                    case 1:
                        _b = _d.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, node_fetch_1.default(this.config.tokenURL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Accept: 'application/json',
                            },
                            body: qs.stringify(requestBody)
                        })];
                    case 3:
                        _b = _d.sent();
                        _d.label = 4;
                    case 4:
                        response = _b;
                        if (!!response.ok) return [3 /*break*/, 6];
                        _c = OAuth2Error.bind;
                        return [4 /*yield*/, response.text()];
                    case 5: throw new (_c.apply(OAuth2Error, [void 0, (_d.sent()) || 'Cannot get access token']))();
                    case 6:
                        _d.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, response.json()];
                    case 7:
                        json = _d.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        err_1 = _d.sent();
                        throw new OAuth2Error(err_1.message);
                    case 9:
                        access_token = json.access_token, token_type = json.token_type, expires_in = json.expires_in;
                        if (!access_token)
                            throw new OAuth2Error('Token not found');
                        return [2 /*return*/, access_token];
                }
            });
        });
    };
    OAuth2.prototype.authenticate = function (req, res) {
        var state = uuid_1.v4();
        req.session[sessionKey] = { state: state };
        res.status(302).redirect(this.config.consentURL + "?" + qs.stringify({
            client_id: this.config.clientID,
            redirect_uri: this.config.redirectUri,
            state: state,
            scope: this.config.scope,
            response_type: 'code'
        }));
    };
    return OAuth2;
}());
exports.default = OAuth2;
