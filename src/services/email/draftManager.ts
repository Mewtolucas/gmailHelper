/**
 * Draft email management service
 */
import { Email } from '../../models/email';
import { logger } from '../../utils/logger';

export interface DraftInfo {
  email: Email;
  ageInDays: number;
  lastModifiedDate: Date;
}

export class DraftManager {
  /**
   * Find stale drafts
   */
  findStaleDrafts(emails: Email[], maxAgeInDays = 30): DraftInfo[] {
    const stale: DraftInfo[] = [];
    const now = new Date();

    for (const email of emails) {
      if (!email.isDraft) {
        continue;
      }

      const lastModified = new Date(email.lastModified);
      const ageInDays = Math.floor((now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24));

      if (ageInDays > maxAgeInDays) {
        stale.push({
          email,
          ageInDays,
          lastModifiedDate: lastModified,
        });
      }
    }

    // Sort by age (oldest first)
    return stale.sort((a, b) => b.ageInDays - a.ageInDays);
  }

  /**
   * Get all draft emails
   */
  getDrafts(emails: Email[]): Email[] {
    return emails.filter((e) => e.isDraft);
  }

  /**
   * Check if email is a recently modified draft
   */
  isRecentlyModified(email: Email, withinHours = 24): boolean {
    if (!email.isDraft) {
      return false;
    }

    const lastModified = new Date(email.lastModified);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60);

    return hoursDiff < withinHours;
  }

  /**
   * Get draft statistics
   */
  getStatistics(emails: Email[]): {
    totalDrafts: number;
    recentDrafts: number;
    staleDrafts: number;
    avgAge: number;
  } {
    const drafts = this.getDrafts(emails);
    const stale = this.findStaleDrafts(emails, 7);
    const recent = drafts.filter((d) => this.isRecentlyModified(d, 24));

    let totalAge = 0;
    for (const draft of drafts) {
      const age = Math.floor(
        (new Date().getTime() - new Date(draft.lastModified).getTime()) / (1000 * 60 * 60 * 24),
      );
      totalAge += age;
    }

    return {
      totalDrafts: drafts.length,
      recentDrafts: recent.length,
      staleDrafts: stale.length,
      avgAge: drafts.length > 0 ? Math.round(totalAge / drafts.length) : 0,
    };
  }

  /**
   * Group drafts by subject
   */
  groupBySubject(emails: Email[]): Map<string, Email[]> {
    const groups = new Map<string, Email[]>();

    for (const email of this.getDrafts(emails)) {
      if (!groups.has(email.subject)) {
        groups.set(email.subject, []);
      }
      groups.get(email.subject)!.push(email);
    }

    return groups;
  }

  /**
   * Mark draft for deletion
   */
  markForDeletion(email: Email): void {
    // In a real implementation, this would move to trash
    logger.debug('Marked draft for deletion', { emailId: email.id });
  }

  /**
   * Bulk mark drafts for deletion
   */
  bulkMarkForDeletion(emails: Email[]): number {
    let count = 0;
    for (const email of emails) {
      this.markForDeletion(email);
      count++;
    }
    logger.info(`Marked ${count} drafts for deletion`);
    return count;
  }

  /**
   * Get draft clean up suggestion
   */
  getCleanupSuggestion(
    emails: Email[],
    maxAgeInDays = 30,
  ): {
    toDelete: Email[];
    reason: string;
  } {
    const stale = this.findStaleDrafts(emails, maxAgeInDays);
    const toDelete = stale.map((d) => d.email);

    return {
      toDelete,
      reason: `Found ${toDelete.length} drafts older than ${maxAgeInDays} days`,
    };
  }

  /**
   * Archive draft instead of deleting
   */
  archiveDraft(email: Email): void {
    email.isDraft = false;
    email.lastModified = new Date();
    logger.debug('Archived draft', { emailId: email.id });
  }

  /**
   * Check for duplicates in drafts
   */
  findDuplicateDrafts(emails: Email[]): Email[][] {
    const drafts = this.getDrafts(emails);
    const groups: Email[][] = [];
    const subjects = new Map<string, Email[]>();

    for (const draft of drafts) {
      if (!subjects.has(draft.subject)) {
        subjects.set(draft.subject, []);
      }
      subjects.get(draft.subject)!.push(draft);
    }

    // Return groups with more than one draft
    for (const group of subjects.values()) {
      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }
}
