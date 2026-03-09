/**
 * Email prioritization and importance detection service
 */
import { Email, PriorityLevel } from '../../models/email';
import { VIPListStore } from '../storage/vipListStore';
import { IMPORTANCE_KEYWORDS } from '../../config/constants';
import { logger } from '../../utils/logger';

export class Prioritizer {
  private vipStore: VIPListStore;
  private importanceKeywords: string[];

  constructor(vipStore: VIPListStore) {
    this.vipStore = vipStore;
    this.importanceKeywords = IMPORTANCE_KEYWORDS;
  }

  /**
   * Detect if email is from VIP contact
   */
  isFromVIP(email: Email): boolean {
    return this.vipStore.isVIP(email.from);
  }

  /**
   * Check if email contains urgency indicators
   */
  hasUrgencyIndicators(email: Email): boolean {
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();
    const combined = `${subject} ${body}`;

    return this.importanceKeywords.some((keyword) => combined.includes(keyword.toLowerCase()));
  }

  /**
   * Calculate importance score (0-100)
   */
  calculateImportanceScore(email: Email): number {
    let score = 0;

    // VIP contact (30 points)
    if (this.isFromVIP(email)) {
      score += 30;
    }

    // Urgency keywords (25 points)
    if (this.hasUrgencyIndicators(email)) {
      score += 25;
    }

    // Directly addressed (15 points)
    if (email.to.length === 1) {
      score += 15;
    }

    // Has attachments (10 points)
    if (email.hasAttachments) {
      score += 10;
    }

    // Subject length (might indicate importance) (10 points)
    if (email.subject.length > 5) {
      score += 10;
    }

    // No "Fwd:" or "Re:" (5 points - original emails often more important)
    if (!email.subject.toLowerCase().startsWith('fwd:')) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Assign priority level based on importance score
   */
  assignPriority(email: Email): void {
    const score = this.calculateImportanceScore(email);

    let priority: PriorityLevel;
    if (score >= 70) {
      priority = 'critical';
    } else if (score >= 50) {
      priority = 'high';
    } else if (score >= 30) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    email.priority = priority;
    email.analysisMetadata = {
      ...email.analysisMetadata,
      confidence: score,
    };

    logger.debug(`Assigned priority "${priority}" to email`, {
      emailId: email.id,
      score,
    });
  }

  /**
   * Mark email as important
   */
  markImportant(email: Email): void {
    email.isImportant = true;
    email.lastModified = new Date();
    logger.debug('Marked email as important', { emailId: email.id });
  }

  /**
   * Unmark email as important
   */
  unmarkImportant(email: Email): void {
    email.isImportant = false;
    email.lastModified = new Date();
    logger.debug('Unmarked email as important', { emailId: email.id });
  }

  /**
   * Pin email to top
   */
  pinEmail(email: Email): void {
    email.isPinned = true;
    email.lastModified = new Date();
    logger.debug('Pinned email', { emailId: email.id });
  }

  /**
   * Unpin email
   */
  unpinEmail(email: Email): void {
    email.isPinned = false;
    email.lastModified = new Date();
    logger.debug('Unpinned email', { emailId: email.id });
  }

  /**
   * Mark email as VIP
   */
  markAsVIP(email: Email): void {
    email.isVIP = this.isFromVIP(email);
  }

  /**
   * Bulk prioritize emails
   */
  bulkPrioritize(emails: Email[]): void {
    for (const email of emails) {
      this.assignPriority(email);
      this.markAsVIP(email);
    }
    logger.info(`Bulk prioritized ${emails.length} emails`);
  }

  /**
   * Get important emails
   */
  getImportantEmails(emails: Email[]): Email[] {
    return emails.filter((e) => e.isImportant || e.priority === 'critical' || e.isVIP);
  }

  /**
   * Sort emails by importance (pinned first, then critical, then important, then by date)
   */
  sortByImportance(emails: Email[]): Email[] {
    const priorityOrder: Record<PriorityLevel, number> = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    };

    return [...emails].sort((a, b) => {
      // Pinned emails first
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      // Then by importance flag
      if (a.isImportant !== b.isImportant) {
        return a.isImportant ? -1 : 1;
      }

      // Then by priority level
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      // Finally by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  /**
   * Get priority statistics
   */
  getStatistics(emails: Email[]): Record<PriorityLevel, number> {
    return {
      critical: emails.filter((e) => e.priority === 'critical').length,
      high: emails.filter((e) => e.priority === 'high').length,
      medium: emails.filter((e) => e.priority === 'medium').length,
      low: emails.filter((e) => e.priority === 'low').length,
    };
  }
}
