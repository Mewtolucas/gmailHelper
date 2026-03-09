/**
 * Sweep engine for deleting similar emails
 */
import { Email } from '../../models/email';
import { logger } from '../../utils/logger';

export interface SimilarityMatch {
  email: Email;
  score: number; // 0-100
}

export class SweepEngine {
  /**
   * Calculate similarity between two emails
   */
  calculateSimilarity(source: Email, target: Email): number {
    let score = 0;

    // Same sender (40 points)
    if (source.from.toLowerCase() === target.from.toLowerCase()) {
      score += 40;
    } else if (this.sameDomain(source.from, target.from)) {
      score += 20;
    }

    // Similar subject (30 points)
    const subjectSimilarity = this.stringSimilarity(source.subject, target.subject);
    score += subjectSimilarity * 30;

    // Same category (20 points)
    if (source.category && source.category === target.category) {
      score += 20;
    }

    // Similar keywords (10 points)
    const keywordSimilarity = this.extractKeywords(source).some((kw) =>
      target.body.toLowerCase().includes(kw.toLowerCase()),
    )
      ? 10
      : 0;
    score += keywordSimilarity;

    return Math.min(score, 100);
  }

  /**
   * Find similar emails to a source email
   */
  findSimilarEmails(source: Email, candidates: Email[], threshold = 50): SimilarityMatch[] {
    const matches: SimilarityMatch[] = [];

    for (const candidate of candidates) {
      if (candidate.id === source.id) {
        continue; // Skip source email itself
      }

      const score = this.calculateSimilarity(source, candidate);
      if (score >= threshold) {
        matches.push({ email: candidate, score });
      }
    }

    // Sort by similarity score (highest first)
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Check if two emails are likely duplicates
   */
  isDuplicate(email1: Email, email2: Email): boolean {
    // Exact same subject and sender = duplicate
    if (
      email1.subject === email2.subject &&
      email1.from.toLowerCase() === email2.from.toLowerCase()
    ) {
      return true;
    }

    // Very similar content = duplicate
    const similarity = this.calculateSimilarity(email1, email2);
    return similarity > 85;
  }

  /**
   * Group similar emails
   */
  groupSimilarEmails(emails: Email[], threshold = 70): Email[][] {
    const groups: Email[][] = [];
    const processed = new Set<string>();

    for (const email of emails) {
      if (processed.has(email.id)) {
        continue;
      }

      const group = [email];
      processed.add(email.id);

      const similar = this.findSimilarEmails(email, emails, threshold);
      for (const match of similar) {
        if (!processed.has(match.email.id)) {
          group.push(match.email);
          processed.add(match.email.id);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Suggest emails to delete (keep newest, delete older)
   */
  suggestForDeletion(
    similar: SimilarityMatch[],
    strategy: 'keep-newest' | 'keep-oldest' = 'keep-newest',
  ): Email[] {
    if (similar.length === 0) {
      return [];
    }

    const sorted =
      strategy === 'keep-newest'
        ? [...similar].sort((a, b) => new Date(b.email.date).getTime() - new Date(a.email.date).getTime())
        : [...similar].sort((a, b) => new Date(a.email.date).getTime() - new Date(b.email.date).getTime());

    // Keep first, suggest rest for deletion
    return sorted.slice(1).map((m) => m.email);
  }

  /**
   * Extract keywords from email
   */
  private extractKeywords(email: Email): string[] {
    const text = `${email.subject} ${email.snippet}`.toLowerCase();
    const words = text.split(/\s+/);

    // Filter out common words
    const commonWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      're',
    ];

    return words.filter((word) => word.length > 3 && !commonWords.includes(word));
  }

  /**
   * Calculate string similarity (0-1)
   */
  private stringSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];

    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
    }

    return costs[s2.length];
  }

  /**
   * Check if two email domains are the same
   */
  private sameDomain(email1: string, email2: string): boolean {
    const domain1 = email1.split('@')[1]?.toLowerCase();
    const domain2 = email2.split('@')[1]?.toLowerCase();
    return !!(domain1 && domain2 && domain1 === domain2);
  }

  /**
   * Get sweep statistics
   */
  getStatistics(
    emails: Email[],
    threshold: number = 70,
  ): { totalEmails: number; groups: number; toDelete: number } {
    const groups = this.groupSimilarEmails(emails, threshold);
    let toDelete = 0;

    for (const group of groups) {
      toDelete += group.length - 1; // Keep one per group
    }

    return {
      totalEmails: emails.length,
      groups: groups.length,
      toDelete,
    };
  }
}
