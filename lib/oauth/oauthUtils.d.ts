export declare const getTimestamp: () => number;
export declare const getNonce: () => string;
export declare enum OAuthSigningMethod {
    hmac = "HMAC-SHA1",
    plain = "PLAINTEXT",
    rsa = "RSA-SHA1"
}
export declare const oauthSign: (method: OAuthSigningMethod, base: string, consumerSecret: string, tokenSecret?: string | undefined) => string;
