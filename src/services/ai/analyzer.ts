/**
 * AI-powered email analysis using Claude
 */
import { Anthropic } from '@anthropic-ai/sdk';
import { Email } from '../../models/email';
import { Category } from '../../models/category';
import { getCacheFilePath, writeJsonFile, readJsonFile } from '../../utils/helpers';
import { ANALYSIS_CACHE_FILE } from '../../config/constants';
import { logger } from '../../utils/logger';

interface AnalysisCache {
  [key: string]: {
    timestamp: Date;
    analysis: EmailAnalysis;
  };
}

export interface EmailAnalysis {
  categoryId?: string;
  categoryName?: string;
  confidence?: number;
  importanceScore?: number;
  spamScore?: number;
  phishingScore?: number;
  reasoning?: string;
  keywords?: string[];
}

export class AIAnalyzer {
  private client: Anthropic;
  private cache: AnalysisCache;
  private cacheFile: string;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
    this.cacheFile = getCacheFilePath(ANALYSIS_CACHE_FILE);
    this.cache = this.loadCache();
  }

  /**
   * Load cache from file
   */
  private loadCache(): AnalysisCache {
    try {
      return (readJsonFile<AnalysisCache>(this.cacheFile, {}) as AnalysisCache) || {};
    } catch {
      return {};
    }
  }

  /**
   * Save cache to file
   */
  private saveCache(): void {
    try {
      writeJsonFile(this.cacheFile, this.cache);
    } catch (error) {
      logger.warn('Failed to save analysis cache', error);
    }
  }

  /**
   * Get cache key for email
   */
  private getCacheKey(email: Email): string {
    return `${email.from}|${email.subject}|${email.snippet}`;
  }

  /**
   * Suggest category for email
   */
  async suggestCategory(email: Email, categories: Category[]): Promise<EmailAnalysis> {
    const cacheKey = this.getCacheKey(email);
    const cached = this.cache[cacheKey];

    if (cached) {
      logger.debug('Using cached analysis for email', { emailId: email.id });
      return cached.analysis;
    }

    try {
      const categoryList = categories.map((c) => `- ${c.name}: ${c.description || ''}`).join('\n');

      const prompt = `Analyze this email and suggest the most appropriate category.

Available Categories:
${categoryList}

Email Details:
From: ${email.from}
Subject: ${email.subject}
Preview: ${email.snippet.substring(0, 200)}

Respond in JSON format:
{
  "categoryName": "category name",
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '{}';
      const response = JSON.parse(responseText);

      const analysis: EmailAnalysis = {
        categoryName: response.categoryName,
        confidence: response.confidence,
        reasoning: response.reasoning,
      };

      // Cache the result
      this.cache[cacheKey] = {
        timestamp: new Date(),
        analysis,
      };
      this.saveCache();

      logger.debug('AI suggested category', { categoryName: analysis.categoryName });
      return analysis;
    } catch (error) {
      logger.error('Failed to analyze email with AI', error);
      return {};
    }
  }

  /**
   * Analyze email importance
   */
  async analyzeImportance(email: Email): Promise<number> {
    try {
      const prompt = `Rate the importance of this email on a scale of 0-100.
Consider: urgency indicators, sender authority, action requirements, business impact.

Email:
From: ${email.from}
Subject: ${email.subject}
Content: ${email.body.substring(0, 500)}

Respond with just a number 0-100.`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '50';
      const score = Math.min(100, Math.max(0, parseInt(responseText.trim(), 10) || 50));

      logger.debug('AI importance score', { score });
      return score;
    } catch (error) {
      logger.error('Failed to analyze importance', error);
      return 50; // Default medium importance
    }
  }

  /**
   * Detect spam and phishing
   */
  async detectSpamPhishing(email: Email): Promise<{ spamScore: number; phishingScore: number }> {
    try {
      const prompt = `Analyze this email for spam and phishing indicators.

Email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 500)}

Respond in JSON format:
{
  "spamScore": 0-100,
  "phishingScore": 0-100
}`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '{"spamScore": 0, "phishingScore": 0}';
      const response = JSON.parse(responseText);

      return {
        spamScore: Math.min(100, Math.max(0, response.spamScore || 0)),
        phishingScore: Math.min(100, Math.max(0, response.phishingScore || 0)),
      };
    } catch (error) {
      logger.error('Failed to detect spam/phishing', error);
      return { spamScore: 0, phishingScore: 0 };
    }
  }

  /**
   * Extract key information from email
   */
  async extractKeywords(email: Email): Promise<string[]> {
    try {
      const prompt = `Extract 3-5 key topics/keywords from this email. Respond as JSON array of strings.

Subject: ${email.subject}
Content: ${email.body.substring(0, 300)}`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '[]';
      const keywords = JSON.parse(responseText);

      return Array.isArray(keywords) ? keywords : [];
    } catch (error) {
      logger.error('Failed to extract keywords', error);
      return [];
    }
  }

  /**
   * Clear old cache entries
   */
  clearOldCache(maxAgeHours: number = 24): void {
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    let cleared = 0;

    for (const [key, value] of Object.entries(this.cache)) {
      const cacheAge = now - new Date(value.timestamp).getTime();
      if (cacheAge > maxAgeMs) {
        delete this.cache[key];
        cleared++;
      }
    }

    this.saveCache();
    logger.info(`Cleared ${cleared} old cache entries`);
  }
}
