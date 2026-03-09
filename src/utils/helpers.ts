/**
 * Helper utility functions
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { logger } from './logger';

/**
 * Get the config directory, creating it if necessary
 */
export function getConfigDir(): string {
  const configDir = path.join(os.homedir(), '.gmailHelper');
  if (!fs.existsSync(configDir)) {
    try {
      fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
      logger.debug('Created config directory', configDir);
    } catch (error) {
      logger.error('Failed to create config directory', error);
      throw error;
    }
  }
  return configDir;
}

/**
 * Get the cache directory within config directory
 */
export function getCacheDir(): string {
  const cacheDir = path.join(getConfigDir(), 'cache');
  if (!fs.existsSync(cacheDir)) {
    try {
      fs.mkdirSync(cacheDir, { recursive: true, mode: 0o700 });
    } catch (error) {
      logger.error('Failed to create cache directory', error);
      throw error;
    }
  }
  return cacheDir;
}

/**
 * Get full path to a config file
 */
export function getConfigFilePath(filename: string): string {
  return path.join(getConfigDir(), filename);
}

/**
 * Get full path to a cache file
 */
export function getCacheFilePath(filename: string): string {
  return path.join(getCacheDir(), filename);
}

/**
 * Read JSON file safely
 */
export function readJsonFile<T>(filePath: string, defaultValue?: T | null): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      logger.debug('File does not exist', filePath);
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    logger.error(`Failed to read JSON file ${filePath}`, error);
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw error;
  }
}

/**
 * Write JSON file atomically (write to temp, then rename)
 */
export function writeJsonFile<T>(filePath: string, data: T, backup = true): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    // Create backup if file exists
    if (backup && fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup`;
      fs.copyFileSync(filePath, backupPath);
      logger.debug('Created backup', backupPath);
    }

    // Write to temporary file first
    const tempPath = `${filePath}.tmp`;
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempPath, jsonString, 'utf-8');

    // Atomic rename
    fs.renameSync(tempPath, filePath);
    logger.debug('Wrote JSON file', filePath);
  } catch (error) {
    logger.error(`Failed to write JSON file ${filePath}`, error);
    throw error;
  }
}

/**
 * Check if email matches a pattern
 */
export function emailMatchesPattern(email: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    // Simple wildcard matching
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`, 'i');
    return regex.test(email);
  }
  return email.toLowerCase() === pattern.toLowerCase();
}

/**
 * Extract email from a string like "Name <email@example.com>"
 */
export function extractEmailAddress(emailString: string): string {
  const match = emailString.match(/<(.+?)>/);
  return match ? match[1] : emailString;
}

/**
 * Extract name from email string like "Name <email@example.com>"
 */
export function extractEmailName(emailString: string): string {
  const match = emailString.match(/^([^<]+)</);
  if (match) {
    return match[1].trim();
  }
  return '';
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  initialDelayMs = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms`, lastError.message);
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}
