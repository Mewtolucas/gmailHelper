/**
 * Application constants
 */

export const APP_NAME = 'Gmail Helper';
export const APP_VERSION = '1.0.0';

// Gmail API Constants
export const GMAIL_API_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
];

export const GMAIL_API_BASE_URL = 'https://www.googleapis.com/gmail/v1';

// Email Constants
export const EMAIL_BATCH_SIZE = 50;
export const EMAIL_FETCH_DAYS = 30;
export const EMAIL_SYNC_INTERVAL_MINUTES = 30;

// AI Constants
export const DEFAULT_AI_MODEL = 'claude-3-5-sonnet-20241022';
export const DEFAULT_MAX_TOKENS = 1000;
export const AI_RATE_LIMIT_PER_MINUTE = 60;

// Cache Constants
export const CACHE_EXPIRY_HOURS = 24;
export const MAX_CACHE_SIZE = 10000;

// File Paths
export const CONFIG_DIR = '.gmailHelper';
export const TOKEN_FILE = 'tokens.json';
export const CATEGORIES_FILE = 'categories.json';
export const VIP_LIST_FILE = 'vipList.json';
export const RULES_FILE = 'rules.json';
export const CONFIG_FILE = 'config.json';
export const CACHE_DIR = 'cache';
export const EMAIL_CACHE_FILE = 'emails.json';
export const ANALYSIS_CACHE_FILE = 'analysis.json';

// Default Values
export const DEFAULT_PRIORITY_THRESHOLD = 0.5;
export const DEFAULT_SPAM_THRESHOLD = 0.7;
export const DEFAULT_PHISHING_THRESHOLD = 0.8;

// Importance Keywords
export const IMPORTANCE_KEYWORDS = [
  'urgent',
  'asap',
  'critical',
  'deadline',
  'action required',
  'time-sensitive',
  'immediate',
  'high priority',
  'important',
  'please review',
  'decision needed',
  'approval required',
];

// VIP Indicators
export const VIP_INDICATORS = [
  'boss',
  'ceo',
  'manager',
  'director',
  'founder',
  'executive',
  'founder',
];

// Error Messages
export const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: 'User is not authenticated. Please run auth login first.',
  INVALID_CONFIG: 'Invalid configuration provided.',
  GMAIL_API_ERROR: 'Gmail API error occurred.',
  TOKEN_EXPIRED: 'Authentication token expired. Please re-authenticate.',
  AI_API_ERROR: 'Claude AI API error occurred.',
  FILE_NOT_FOUND: 'Required file not found.',
  INVALID_EMAIL: 'Invalid email format.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH_SUCCESS: 'Authentication successful.',
  SYNC_COMPLETE: 'Email sync completed.',
  CATEGORY_CREATED: 'Category created successfully.',
  EMAIL_CATEGORIZED: 'Email categorized successfully.',
  VIP_ADDED: 'VIP contact added successfully.',
};
