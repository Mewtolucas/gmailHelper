/**
 * Token manager for storing and managing OAuth tokens
 */
import { Tokens, StoredTokens } from './types';
import { getConfigFilePath, readJsonFile, writeJsonFile } from '../utils/helpers';
import { TOKEN_FILE } from '../config/constants';
import { logger } from '../utils/logger';

export class TokenManager {
  private tokenFilePath: string;

  constructor() {
    this.tokenFilePath = getConfigFilePath(TOKEN_FILE);
  }

  /**
   * Save tokens to encrypted file
   */
  saveTokens(tokens: Tokens): void {
    try {
      const storedTokens: StoredTokens = {
        ...tokens,
        expiresAt: tokens.expiresIn
          ? new Date(Date.now() + tokens.expiresIn * 1000)
          : new Date(Date.now() + 3600 * 1000), // Default 1 hour
        createdAt: new Date(),
      };

      writeJsonFile(this.tokenFilePath, storedTokens);
      logger.info('Tokens saved successfully');
    } catch (error) {
      logger.error('Failed to save tokens', error);
      throw error;
    }
  }

  /**
   * Get stored tokens
   */
  getStoredTokens(): StoredTokens | null {
    try {
      const tokens = readJsonFile<StoredTokens>(this.tokenFilePath, null);
      if (!tokens) {
        logger.debug('No stored tokens found');
        return null;
      }

      // Check if tokens are expired
      if (this.isTokenExpired(tokens)) {
        logger.warn('Stored tokens have expired');
        return null;
      }

      return tokens;
    } catch (error) {
      logger.debug('Failed to read stored tokens', error);
      return null;
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.accessToken || null;
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.refreshToken || null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(tokens: StoredTokens): boolean {
    if (!tokens.expiresAt) {
      return false;
    }

    const expiresAt = new Date(tokens.expiresAt);
    const now = new Date();

    // Consider expired if within 5 minutes of expiration
    const bufferMs = 5 * 60 * 1000;
    return now.getTime() + bufferMs >= expiresAt.getTime();
  }

  /**
   * Check if valid tokens exist
   */
  hasValidTokens(): boolean {
    const tokens = this.getStoredTokens();
    return !!(tokens && tokens.accessToken);
  }

  /**
   * Delete stored tokens (logout)
   */
  deleteTokens(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.tokenFilePath)) {
        fs.unlinkSync(this.tokenFilePath);
        logger.info('Tokens deleted successfully');
      }
    } catch (error) {
      logger.error('Failed to delete tokens', error);
      throw error;
    }
  }

  /**
   * Update refresh token (called after token refresh)
   */
  updateTokens(newTokens: Partial<StoredTokens>): void {
    try {
      const existingTokens = readJsonFile<StoredTokens>(this.tokenFilePath, null);
      if (!existingTokens) {
        throw new Error('No existing tokens to update');
      }

      const updatedTokens: StoredTokens = {
        ...existingTokens,
        ...newTokens,
        expiresAt: newTokens.expiresIn
          ? new Date(Date.now() + newTokens.expiresIn * 1000)
          : existingTokens.expiresAt,
      };

      writeJsonFile(this.tokenFilePath, updatedTokens);
      logger.info('Tokens updated successfully');
    } catch (error) {
      logger.error('Failed to update tokens', error);
      throw error;
    }
  }
}
