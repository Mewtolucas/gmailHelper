/**
 * Spam and phishing detection service
 */
import { Email } from '../../models/email';
import { logger } from '../../utils/logger';

export class SpamDetector {
  private phishingKeywords = [
    'verify account',
    'confirm identity',
    'update payment',
    'suspicious activity',
    'click here',
    'verify now',
    'act now',
    'urgent action required',
  ];

  private spamKeywords = [
    'click here',
    'limited time',
    'buy now',
    'special offer',
    'free money',
    'guarantee',
    'no credit check',
    'unsubscribe',
  ];

  /**
   * Detect spam characteristics
   */
  detectSpam(email: Email): number {
    let score = 0;

    // Check for spam keywords
    const body = email.body.toLowerCase();
    const subject = email.subject.toLowerCase();
    const combined = `${body} ${subject}`;

    const spamMatches = this.spamKeywords.filter((keyword) =>
      combined.includes(keyword.toLowerCase()),
    ).length;

    score += spamMatches * 10;

    // Check for suspicious links
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const links = combined.match(urlPattern) || [];
    if (links.length > 5) {
      score += 20;
    }

    // Check for suspicious sender domain
    if (this.isSuspiciousDomain(email.from)) {
      score += 15;
    }

    // Check for generic greeting
    if (
      combined.includes('dear customer') ||
      combined.includes('dear user') ||
      combined.includes('dear member')
    ) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Detect phishing characteristics
   */
  detectPhishing(email: Email): number {
    let score = 0;

    // Check for phishing keywords
    const body = email.body.toLowerCase();
    const subject = email.subject.toLowerCase();
    const combined = `${body} ${subject}`;

    const phishingMatches = this.phishingKeywords.filter((keyword) =>
      combined.includes(keyword.toLowerCase()),
    ).length;

    score += phishingMatches * 15;

    // Check for urgency indicators
    if (
      combined.includes('verify') ||
      combined.includes('confirm') ||
      combined.includes('urgent') ||
      combined.includes('immediately')
    ) {
      score += 20;
    }

    // Check for requests to click links
    if (combined.includes('click') || combined.includes('here')) {
      score += 15;
    }

    // Check for sender spoofing (common word + generic domain)
    if (this.isSpoofedSender(email.from)) {
      score += 25;
    }

    // Check for fake banking/payment references
    if (this.hasFakeFinancialReferences(combined)) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Check if domain looks suspicious
   */
  private isSuspiciousDomain(email: string): boolean {
    const suspiciousDomains = [
      'noreply',
      'no-reply',
      'donotreply',
      'notification',
      'alert',
      'confirm',
    ];

    return suspiciousDomains.some((domain) => email.includes(domain));
  }

  /**
   * Check if sender looks spoofed
   */
  private isSpoofedSender(email: string): boolean {
    const commonWords = [
      'support',
      'admin',
      'security',
      'account',
      'service',
      'noreply',
    ];

    const isFreeEmail = email.includes('@gmail.com') || email.includes('@yahoo.com');
    const hasCommonWord = commonWords.some((word) => email.includes(word));

    return isFreeEmail && hasCommonWord;
  }

  /**
   * Check for fake financial references
   */
  private hasFakeFinancialReferences(text: string): boolean {
    const patterns = [
      /verify.*account/i,
      /confirm.*payment/i,
      /update.*credit/i,
      /unusual.*activity/i,
      /suspicious.*login/i,
    ];

    return patterns.some((pattern) => pattern.test(text));
  }

  /**
   * Mark email as spam
   */
  markAsSpam(email: Email): void {
    email.isSpam = true;
    email.lastModified = new Date();
    logger.debug('Marked email as spam', { emailId: email.id });
  }

  /**
   * Mark email as phishing
   */
  markAsPhishing(email: Email): void {
    email.isPhishing = true;
    email.lastModified = new Date();
    logger.debug('Marked email as phishing', { emailId: email.id });
  }

  /**
   * Bulk detect spam and phishing
   */
  bulkDetect(emails: Email[]): void {
    for (const email of emails) {
      const spamScore = this.detectSpam(email);
      const phishingScore = this.detectPhishing(email);

      email.analysisMetadata = {
        ...email.analysisMetadata,
        spamScore,
        phishingScore,
      };

      if (spamScore > 70) {
        this.markAsSpam(email);
      }

      if (phishingScore > 70) {
        this.markAsPhishing(email);
      }
    }

    logger.info(`Bulk detected spam/phishing for ${emails.length} emails`);
  }

  /**
   * Get spam statistics
   */
  getStatistics(emails: Email[]): { spam: number; phishing: number; safe: number } {
    const spam = emails.filter((e) => e.isSpam).length;
    const phishing = emails.filter((e) => e.isPhishing).length;
    const safe = emails.length - spam - phishing;

    return { spam, phishing, safe };
  }
}
