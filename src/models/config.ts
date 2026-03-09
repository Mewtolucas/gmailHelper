/**
 * Application configuration models
 */
export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface AIConfig {
  provider: 'anthropic';
  model: string;
  maxTokens: number;
  rateLimitPerMinute: number;
}

export interface SyncConfig {
  autoSync: boolean;
  syncIntervalMinutes: number;
  defaultDays: number;
  batchSize: number;
}

export interface FeaturesConfig {
  enableAI: boolean;
  enableSpamDetection: boolean;
  enableDraftCleanup: boolean;
  enableSweep: boolean;
}

export interface CacheConfig {
  enableCache: boolean;
  cacheExpiryHours: number;
  maxCacheSize: number;
}

export interface AppConfig {
  app: {
    name: string;
    version: string;
    dataDir: string;
  };
  gmail: GmailConfig;
  ai: AIConfig;
  sync: SyncConfig;
  features: FeaturesConfig;
  cache: CacheConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
  app: {
    name: 'Gmail Helper',
    version: '1.0.0',
    dataDir: '~/.gmailHelper',
  },
  gmail: {
    clientId: '',
    clientSecret: '',
    redirectUri: 'http://localhost:3000/auth/callback',
    scopes: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
  },
  ai: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 1000,
    rateLimitPerMinute: 60,
  },
  sync: {
    autoSync: true,
    syncIntervalMinutes: 30,
    defaultDays: 30,
    batchSize: 50,
  },
  features: {
    enableAI: true,
    enableSpamDetection: true,
    enableDraftCleanup: true,
    enableSweep: true,
  },
  cache: {
    enableCache: true,
    cacheExpiryHours: 24,
    maxCacheSize: 10000,
  },
};
