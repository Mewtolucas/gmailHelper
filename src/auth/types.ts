/**
 * Authentication types and interfaces
 */
export interface Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface StoredTokens extends Tokens {
  expiresAt: Date;
  createdAt: Date;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}
