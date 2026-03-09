/**
 * OAuth 2.0 authentication handler for Gmail API
 */
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { OAuthConfig } from './types';
import { logger } from '../utils/logger';

export class OAuthHandler {
  private oauth2Client: any;

  constructor(config: OAuthConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
    );
  }

  /**
   * Generate authorization URL for user consent
   */
  generateAuthUrl(scopes: string[]): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    logger.debug('Generated auth URL');
    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeAuthCode(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      logger.info('Successfully exchanged auth code for tokens');
      return tokens;
    } catch (error) {
      logger.error('Failed to exchange auth code', error);
      throw error;
    }
  }

  /**
   * Set credentials for the OAuth2 client
   */
  setCredentials(tokens: any): void {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Get the OAuth2 client instance
   */
  getClient(): any {
    return this.oauth2Client;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<any> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      logger.debug('Successfully refreshed access token');
      return credentials;
    } catch (error) {
      logger.error('Failed to refresh access token', error);
      throw error;
    }
  }

  /**
   * Check if OAuth2 client has valid credentials
   */
  hasValidCredentials(): boolean {
    const credentials = this.oauth2Client.credentials;
    return !!(credentials && credentials.access_token);
  }

  /**
   * Get current credentials
   */
  getCredentials(): any {
    return this.oauth2Client.credentials;
  }

  /**
   * Clear credentials
   */
  clearCredentials(): void {
    this.oauth2Client.setCredentials({});
  }
}
