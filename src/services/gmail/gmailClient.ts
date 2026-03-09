/**
 * Gmail API client with authentication and error handling
 */
import { gmail_v1, google } from 'googleapis';
import { OAuthHandler } from '../../auth/oauth';
import { TokenManager } from '../../auth/tokenManager';
import { OAuthConfig } from '../../auth/types';
import { GmailMessage, GmailList, GmailLabel, FetchEmailsOptions, SendEmailOptions } from './types';
import { logger } from '../../utils/logger';
import { retryWithBackoff } from '../../utils/helpers';

export class GmailClient {
  private oauthHandler: OAuthHandler;
  private tokenManager: TokenManager;
  private gmailService: gmail_v1.Gmail;

  constructor(oauthConfig: OAuthConfig) {
    this.oauthHandler = new OAuthHandler(oauthConfig);
    this.tokenManager = new TokenManager();
    this.gmailService = google.gmail({
      version: 'v1',
      auth: this.oauthHandler.getClient() as any,
    });
  }

  /**
   * Initialize and authenticate with Gmail
   */
  async initialize(): Promise<void> {
    try {
      const storedTokens = this.tokenManager.getStoredTokens();
      if (!storedTokens) {
        throw new Error('No stored tokens found. Please authenticate first.');
      }

      // Set credentials
      this.oauthHandler.setCredentials(storedTokens);

      // Check if token needs refresh
      if (this.tokenManager.isTokenExpired(storedTokens)) {
        await this.refreshAccessToken();
      }

      logger.info('Gmail client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Gmail client', error);
      throw error;
    }
  }

  /**
   * Get authorization URL for user login
   */
  getAuthUrl(): string {
    return this.oauthHandler.generateAuthUrl([
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.readonly',
    ]);
  }

  /**
   * Handle OAuth callback and save tokens
   */
  async handleAuthCallback(authCode: string): Promise<void> {
    try {
      const tokens = await this.oauthHandler.exchangeAuthCode(authCode);
      this.tokenManager.saveTokens(tokens);
      this.oauthHandler.setCredentials(tokens);
      logger.info('Authentication successful');
    } catch (error) {
      logger.error('Authentication failed', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      const newTokens = await this.oauthHandler.refreshAccessToken();
      this.tokenManager.updateTokens(newTokens);
      logger.info('Access token refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh access token', error);
      throw error;
    }
  }

  /**
   * Fetch emails with optional filtering
   */
  async fetchEmails(options: FetchEmailsOptions = {}): Promise<GmailList> {
    return retryWithBackoff(async () => {
      try {
        const response = await this.gmailService.users.messages.list({
          userId: 'me',
          q: options.query || '',
          maxResults: options.maxResults || 50,
          pageToken: options.pageToken,
        });

        const result: GmailList = {
          messages: (response.data.messages as any[]) || [],
          resultSizeEstimate: response.data.resultSizeEstimate || 0,
        };

        if (response.data.nextPageToken) {
          result.nextPageToken = response.data.nextPageToken;
        }

        logger.debug('Fetched emails', {
          count: result.messages?.length,
          total: result.resultSizeEstimate,
        });

        return result;
      } catch (error) {
        logger.error('Failed to fetch emails', error);
        throw error;
      }
    });
  }

  /**
   * Get full email message
   */
  async getEmail(messageId: string): Promise<GmailMessage> {
    return retryWithBackoff(async () => {
      try {
        const response = await this.gmailService.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });

        logger.debug('Fetched email', { messageId });
        return response.data as GmailMessage;
      } catch (error) {
        logger.error('Failed to get email', error);
        throw error;
      }
    });
  }

  /**
   * Get email headers only (faster)
   */
  async getEmailHeaders(messageId: string): Promise<GmailMessage> {
    return retryWithBackoff(async () => {
      try {
        const response = await this.gmailService.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Cc', 'Bcc', 'Subject', 'Date'],
        });

        logger.debug('Fetched email headers', { messageId });
        return response.data as GmailMessage;
      } catch (error) {
        logger.error('Failed to get email headers', error);
        throw error;
      }
    });
  }

  /**
   * Batch get emails (fetch multiple sequentially)
   */
  async batchGetEmails(messageIds: string[]): Promise<GmailMessage[]> {
    try {
      const messages: GmailMessage[] = [];

      for (const id of messageIds) {
        try {
          const message = await this.getEmail(id);
          messages.push(message);
        } catch (error) {
          logger.warn('Failed to fetch email in batch', { messageId: id });
        }
      }

      logger.debug('Batch fetched emails', { count: messages.length });
      return messages;
    } catch (error) {
      logger.error('Failed to batch get emails', error);
      throw error;
    }
  }

  /**
   * Delete email
   */
  async deleteEmail(messageId: string): Promise<void> {
    return retryWithBackoff(async () => {
      try {
        await this.gmailService.users.messages.delete({
          userId: 'me',
          id: messageId,
        });
        logger.debug('Deleted email', { messageId });
      } catch (error) {
        logger.error('Failed to delete email', error);
        throw error;
      }
    });
  }

  /**
   * Trash email (move to trash)
   */
  async trashEmail(messageId: string): Promise<GmailMessage> {
    return retryWithBackoff(async () => {
      try {
        const response = await this.gmailService.users.messages.trash({
          userId: 'me',
          id: messageId,
        });
        logger.debug('Trashed email', { messageId });
        return response.data as GmailMessage;
      } catch (error) {
        logger.error('Failed to trash email', error);
        throw error;
      }
    });
  }

  /**
   * Modify email labels
   */
  async modifyEmail(
    messageId: string,
    options: { addLabelIds?: string[]; removeLabelIds?: string[] },
  ): Promise<GmailMessage> {
    return retryWithBackoff(async () => {
      try {
        const response = await this.gmailService.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: options,
        });
        logger.debug('Modified email', { messageId });
        return response.data as GmailMessage;
      } catch (error) {
        logger.error('Failed to modify email', error);
        throw error;
      }
    });
  }

  /**
   * Get all labels
   */
  async getLabels(): Promise<GmailLabel[]> {
    return retryWithBackoff(async () => {
      try {
        const response = await this.gmailService.users.labels.list({
          userId: 'me',
        });
        logger.debug('Fetched labels', { count: response.data.labels?.length });
        return (response.data.labels as any[]) || [];
      } catch (error) {
        logger.error('Failed to get labels', error);
        throw error;
      }
    });
  }

  /**
   * Create a new label
   */
  async createLabel(name: string): Promise<GmailLabel> {
    return retryWithBackoff(async () => {
      try {
        const response = await this.gmailService.users.labels.create({
          userId: 'me',
          requestBody: {
            name,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show',
          },
        });
        logger.info('Created label', { name });
        return response.data as GmailLabel;
      } catch (error) {
        logger.error('Failed to create label', error);
        throw error;
      }
    });
  }

  /**
   * Get draft emails
   */
  async getDrafts(maxResults = 50): Promise<GmailMessage[]> {
    return retryWithBackoff(async () => {
      try {
        const response = await this.gmailService.users.drafts.list({
          userId: 'me',
          maxResults,
        });

        if (!response.data.drafts) {
          return [];
        }

        const messages: GmailMessage[] = [];
        for (const draft of response.data.drafts) {
          if (draft.message?.id) {
            const draftMessage = await this.getEmail(draft.message.id);
            messages.push(draftMessage);
          }
        }

        logger.debug('Fetched drafts', { count: messages.length });
        return messages;
      } catch (error) {
        logger.error('Failed to get drafts', error);
        throw error;
      }
    });
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.tokenManager.hasValidTokens();
  }

  /**
   * Get profile information
   */
  async getProfile(): Promise<any> {
    return retryWithBackoff(async () => {
      try {
        const response = await this.gmailService.users.getProfile({
          userId: 'me',
        });
        logger.debug('Fetched profile');
        return response.data;
      } catch (error) {
        logger.error('Failed to get profile', error);
        throw error;
      }
    });
  }

  /**
   * Logout
   */
  logout(): void {
    this.tokenManager.deleteTokens();
    this.oauthHandler.clearCredentials();
    logger.info('Logged out successfully');
  }
}
