/**
 * Environment configuration
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { logger } from '../utils/logger';

// Load .env file if it exists
dotenv.config({ path: path.join(process.cwd(), '.env') });

export interface EnvironmentConfig {
  // Gmail OAuth
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REDIRECT_URI: string;

  // Claude AI
  ANTHROPIC_API_KEY: string;

  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  DEBUG: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  WEB_PORT: number;

  // Features
  ENABLE_AI: boolean;
  ENABLE_SPAM_DETECTION: boolean;
  ENABLE_DRAFT_CLEANUP: boolean;
  ENABLE_SWEEP: boolean;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    logger.warn(`Environment variable ${key} not set`);
    return '';
  }
  return value || defaultValue || '';
};

const getEnvBoolean = (key: string, defaultValue = false): boolean => {
  const value = getEnv(key);
  return value ? value.toLowerCase() === 'true' : defaultValue;
};

const getEnvNumber = (key: string, defaultValue = 0): number => {
  const value = getEnv(key);
  return value ? parseInt(value, 10) : defaultValue;
};

export const env: EnvironmentConfig = {
  // Gmail OAuth
  GMAIL_CLIENT_ID: getEnv('GMAIL_CLIENT_ID'),
  GMAIL_CLIENT_SECRET: getEnv('GMAIL_CLIENT_SECRET'),
  GMAIL_REDIRECT_URI: getEnv('GMAIL_REDIRECT_URI', 'http://localhost:3000/auth/callback'),

  // Claude AI
  ANTHROPIC_API_KEY: getEnv('ANTHROPIC_API_KEY'),

  // Application
  NODE_ENV: (getEnv('NODE_ENV', 'development') as EnvironmentConfig['NODE_ENV']),
  DEBUG: getEnvBoolean('DEBUG', false),
  LOG_LEVEL: (getEnv('LOG_LEVEL', 'info') as EnvironmentConfig['LOG_LEVEL']),
  WEB_PORT: getEnvNumber('WEB_PORT', 3000),

  // Features
  ENABLE_AI: getEnvBoolean('ENABLE_AI', true),
  ENABLE_SPAM_DETECTION: getEnvBoolean('ENABLE_SPAM_DETECTION', true),
  ENABLE_DRAFT_CLEANUP: getEnvBoolean('ENABLE_DRAFT_CLEANUP', true),
  ENABLE_SWEEP: getEnvBoolean('ENABLE_SWEEP', true),
};
