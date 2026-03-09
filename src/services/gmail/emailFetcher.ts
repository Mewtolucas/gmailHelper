/**
 * Email fetching and synchronization service
 */
import { GmailClient } from './gmailClient';
import { GmailMessage } from './types';
import { Email, PriorityLevel } from '../../models/email';
import { getCacheFilePath, readJsonFile, writeJsonFile } from '../../utils/helpers';
import { EMAIL_CACHE_FILE } from '../../config/constants';
import { logger } from '../../utils/logger';

export interface SyncMetadata {
  lastSyncTime: Date;
  lastHistoryId: string;
  totalEmails: number;
}

export class EmailFetcher {
  private gmailClient: GmailClient;
  private syncMetadataFile: string;

  constructor(gmailClient: GmailClient) {
    this.gmailClient = gmailClient;
    this.syncMetadataFile = getCacheFilePath('sync-metadata.json');
  }

  /**
   * Parse Gmail message to Email model
   */
  private parseGmailMessage(message: GmailMessage, isDraft = false): Email {
    const headers = message.payload?.headers || [];
    const getHeaderValue = (name: string): string => {
      const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const from = getHeaderValue('from');
    const to = getHeaderValue('to').split(',').map((e) => e.trim());
    const cc = getHeaderValue('cc') ? getHeaderValue('cc').split(',').map((e) => e.trim()) : [];
    const bcc = getHeaderValue('bcc') ? getHeaderValue('bcc').split(',').map((e) => e.trim()) : [];
    const subject = getHeaderValue('subject');
    const dateStr = getHeaderValue('date');
    const date = dateStr ? new Date(dateStr) : new Date(parseInt(message.internalDate || '0'));

    // Extract email body
    let body = '';
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    }

    // Check for attachments
    const hasAttachments =
      !!(message.payload?.parts && message.payload.parts.some((p) => p.filename));

    return {
      id: message.id,
      threadId: message.threadId,
      from,
      to,
      cc,
      bcc,
      subject,
      body,
      snippet: message.snippet,
      date,
      labels: message.labelIds || [],
      priority: 'low' as PriorityLevel,
      isSpam: false,
      isPhishing: false,
      isImportant: false,
      isPinned: false,
      isVIP: false,
      isDraft,
      hasAttachments,
      createdAt: new Date(),
      lastModified: date,
    };
  }

  /**
   * Fetch all emails with optional query
   */
  async fetchEmails(query = '', maxResults = 100): Promise<Email[]> {
    try {
      logger.info('Starting email fetch', { query, maxResults });

      const emails: Email[] = [];
      let pageToken: string | undefined;
      let resultCount = 0;

      do {
        const result = await this.gmailClient.fetchEmails({
          query,
          maxResults: Math.min(maxResults - resultCount, 50),
          pageToken,
        });

        if (!result.messages || result.messages.length === 0) {
          break;
        }

        // Fetch full message details for each email
        for (const message of result.messages) {
          try {
            const fullMessage = await this.gmailClient.getEmail(message.id);
            emails.push(this.parseGmailMessage(fullMessage));
            resultCount++;

            if (resultCount >= maxResults) {
              break;
            }
          } catch (error) {
            logger.warn('Failed to fetch full email details', { messageId: message.id });
          }
        }

        pageToken = result.nextPageToken;

        if (resultCount >= maxResults) {
          break;
        }
      } while (pageToken);

      logger.info('Email fetch completed', { count: emails.length });
      return emails;
    } catch (error) {
      logger.error('Failed to fetch emails', error);
      throw error;
    }
  }

  /**
   * Perform full sync of all emails
   */
  async fullSync(days = 30): Promise<Email[]> {
    try {
      logger.info('Starting full email sync', { days });

      // Calculate date for query
      const date = new Date();
      date.setDate(date.getDate() - days);
      const formattedDate = date.toISOString().split('T')[0];

      // Fetch emails from past N days
      const query = `after:${formattedDate}`;
      const emails = await this.fetchEmails(query, 500);

      // Also fetch recent drafts
      try {
        const drafts = await this.gmailClient.getDrafts(50);
        const draftEmails = drafts.map((d) => this.parseGmailMessage(d, true));
        emails.push(...draftEmails);
      } catch (error) {
        logger.warn('Failed to fetch drafts', error);
      }

      // Save to cache
      this.saveEmailCache(emails);

      // Update sync metadata
      const metadata: SyncMetadata = {
        lastSyncTime: new Date(),
        lastHistoryId: '0',
        totalEmails: emails.length,
      };
      this.saveSyncMetadata(metadata);

      logger.info('Full sync completed', { count: emails.length });
      return emails;
    } catch (error) {
      logger.error('Full sync failed', error);
      throw error;
    }
  }

  /**
   * Perform incremental sync since last sync
   */
  async incrementalSync(): Promise<Email[]> {
    try {
      logger.info('Starting incremental email sync');

      // Get last sync time
      const metadata = this.getSyncMetadata();
      if (!metadata) {
        logger.warn('No sync metadata found, performing full sync instead');
        return this.fullSync();
      }

      // Fetch only new/modified emails
      const lastSyncHours = Math.ceil(
        (Date.now() - metadata.lastSyncTime.getTime()) / (1000 * 60 * 60),
      );
      const query = `newer_than:${lastSyncHours}h`;

      const newEmails = await this.fetchEmails(query, 200);

      // Merge with existing cache
      let cachedEmails = this.getEmailCache();
      const cachedIds = new Set(cachedEmails.map((e) => e.id));

      // Update existing emails and add new ones
      for (const email of newEmails) {
        const index = cachedEmails.findIndex((e) => e.id === email.id);
        if (index >= 0) {
          // Preserve user-set properties
          const existing = cachedEmails[index];
          email.category = existing.category;
          email.isImportant = existing.isImportant;
          email.isPinned = existing.isPinned;
          email.priority = existing.priority;
          cachedEmails[index] = email;
        } else {
          cachedEmails.push(email);
        }
      }

      // Keep only recent emails (last 90 days to avoid cache explosion)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      cachedEmails = cachedEmails.filter((e) => new Date(e.date) > ninetyDaysAgo);

      this.saveEmailCache(cachedEmails);

      // Update sync metadata
      const updatedMetadata: SyncMetadata = {
        lastSyncTime: new Date(),
        lastHistoryId: metadata.lastHistoryId,
        totalEmails: cachedEmails.length,
      };
      this.saveSyncMetadata(updatedMetadata);

      logger.info('Incremental sync completed', {
        newCount: newEmails.length,
        totalCount: cachedEmails.length,
      });

      return newEmails;
    } catch (error) {
      logger.error('Incremental sync failed', error);
      throw error;
    }
  }

  /**
   * Get cached emails
   */
  getEmailCache(): Email[] {
    try {
      const cacheFile = getCacheFilePath(EMAIL_CACHE_FILE);
      const cached = readJsonFile<Email[]>(cacheFile, []);
      return cached || [];
    } catch (error) {
      logger.debug('Failed to read email cache', error);
      return [];
    }
  }

  /**
   * Save emails to cache
   */
  private saveEmailCache(emails: Email[]): void {
    try {
      const cacheFile = getCacheFilePath(EMAIL_CACHE_FILE);
      writeJsonFile(cacheFile, emails);
      logger.debug('Saved email cache', { count: emails.length });
    } catch (error) {
      logger.error('Failed to save email cache', error);
    }
  }

  /**
   * Get sync metadata
   */
  private getSyncMetadata(): SyncMetadata | null {
    try {
      return readJsonFile<SyncMetadata>(this.syncMetadataFile, null);
    } catch (error) {
      logger.debug('Failed to read sync metadata', error);
      return null;
    }
  }

  /**
   * Save sync metadata
   */
  private saveSyncMetadata(metadata: SyncMetadata): void {
    try {
      writeJsonFile(this.syncMetadataFile, metadata);
    } catch (error) {
      logger.error('Failed to save sync metadata', error);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    try {
      const cacheFile = getCacheFilePath(EMAIL_CACHE_FILE);
      const fs = require('fs');
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
        logger.info('Email cache cleared');
      }
    } catch (error) {
      logger.error('Failed to clear email cache', error);
    }
  }
}
