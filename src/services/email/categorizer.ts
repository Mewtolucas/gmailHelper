/**
 * Email categorization service with rule engine
 */
import { Email } from '../../models/email';
import { Category, CategoryRule } from '../../models/category';
import { CategoryStore } from '../storage/categoryStore';
import { logger } from '../../utils/logger';

export class Categorizer {
  private categoryStore: CategoryStore;

  constructor(categoryStore: CategoryStore) {
    this.categoryStore = categoryStore;
  }

  /**
   * Categorize email based on rules
   */
  categorizeEmail(email: Email): string | null {
    const categories = this.categoryStore.getAll();

    for (const category of categories) {
      if (!category.autoApply || category.rules.length === 0) {
        continue;
      }

      for (const rule of category.rules) {
        if (!rule.enabled) {
          continue;
        }

        if (this.ruleMatches(email, rule)) {
          logger.debug(`Email matched rule "${rule.name}" in category "${category.name}"`, {
            emailId: email.id,
          });
          return category.id;
        }
      }
    }

    return null;
  }

  /**
   * Check if email matches a rule
   */
  private ruleMatches(email: Email, rule: CategoryRule): boolean {
    const conditions = rule.conditions;
    const matchAll = conditions.matchAll ?? true;
    const results: boolean[] = [];

    // Check sender
    if (conditions.from && conditions.from.length > 0) {
      const fromMatches = conditions.from.some((pattern) =>
        this.emailMatchesPattern(email.from, pattern),
      );
      results.push(fromMatches);
    }

    // Check subject
    if (conditions.subject && conditions.subject.length > 0) {
      const subjectMatches = conditions.subject.some((keyword) =>
        email.subject.toLowerCase().includes(keyword.toLowerCase()),
      );
      results.push(subjectMatches);
    }

    // Check body content
    if (conditions.body && conditions.body.length > 0) {
      const bodyMatches = conditions.body.some((keyword) =>
        email.body.toLowerCase().includes(keyword.toLowerCase()),
      );
      results.push(bodyMatches);
    }

    // Check attachments
    if (conditions.hasAttachments !== undefined) {
      results.push(email.hasAttachments === conditions.hasAttachments);
    }

    // Check date range
    if (conditions.after) {
      results.push(new Date(email.date) >= new Date(conditions.after));
    }

    if (conditions.before) {
      results.push(new Date(email.date) <= new Date(conditions.before));
    }

    // Combine results
    if (results.length === 0) {
      return false;
    }

    return matchAll ? results.every((r) => r) : results.some((r) => r);
  }

  /**
   * Check if email matches pattern (with wildcard support)
   */
  private emailMatchesPattern(email: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`, 'i');
      return regex.test(email);
    }
    return email.toLowerCase() === pattern.toLowerCase();
  }

  /**
   * Assign email to category
   */
  assignCategory(email: Email, categoryId: string): void {
    const category = this.categoryStore.getById(categoryId);
    if (!category) {
      throw new Error(`Category ${categoryId} not found`);
    }

    email.category = categoryId;
    email.lastModified = new Date();
    logger.debug(`Assigned email to category "${category.name}"`, { emailId: email.id });
  }

  /**
   * Remove category from email
   */
  removeCategory(email: Email): void {
    email.category = undefined;
    email.lastModified = new Date();
    logger.debug('Removed category from email', { emailId: email.id });
  }

  /**
   * Bulk categorize emails
   */
  bulkCategorize(emails: Email[]): number {
    let categorizedCount = 0;

    for (const email of emails) {
      // Don't override manually set categories
      if (email.category) {
        continue;
      }

      const categoryId = this.categorizeEmail(email);
      if (categoryId) {
        this.assignCategory(email, categoryId);
        categorizedCount++;
      }
    }

    logger.info(`Bulk categorized ${categorizedCount} emails`);
    return categorizedCount;
  }

  /**
   * Get category for email
   */
  getCategory(email: Email): Category | null {
    if (!email.category) {
      return null;
    }

    return this.categoryStore.getById(email.category);
  }

  /**
   * Get emails by category
   */
  filterByCategory(emails: Email[], categoryId: string): Email[] {
    return emails.filter((e) => e.category === categoryId);
  }

  /**
   * Get category statistics
   */
  getStatistics(emails: Email[]): Record<string, number> {
    const stats: Record<string, number> = {};
    const uncategorized = 'Uncategorized';

    for (const email of emails) {
      const categoryId = email.category;
      const categoryName = categoryId
        ? this.categoryStore.getById(categoryId)?.name || 'Unknown'
        : uncategorized;

      stats[categoryName] = (stats[categoryName] || 0) + 1;
    }

    return stats;
  }
}
