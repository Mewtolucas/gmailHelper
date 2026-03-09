/**
 * Application configuration storage and management
 */
import { AppConfig, DEFAULT_CONFIG } from '../../models/config';
import { getConfigFilePath, writeJsonFile, readJsonFile } from '../../utils/helpers';
import { CONFIG_FILE } from '../../config/constants';
import { logger } from '../../utils/logger';

export class ConfigStore {
  private config: AppConfig;
  private filePath: string;

  constructor() {
    this.filePath = getConfigFilePath(CONFIG_FILE);
    this.config = this.load();
  }

  /**
   * Load configuration from file or use defaults
   */
  private load(): AppConfig {
    try {
      const loaded = readJsonFile<AppConfig>(this.filePath, null);
      if (loaded) {
        // Merge with defaults to ensure all keys exist
        return this.mergeWithDefaults(loaded);
      }
    } catch (error) {
      logger.warn('Failed to load config file, using defaults', error);
    }

    // Save defaults if no config exists
    this.config = DEFAULT_CONFIG;
    this.save();
    return this.config;
  }

  /**
   * Merge loaded config with defaults
   */
  private mergeWithDefaults(loaded: Partial<AppConfig>): AppConfig {
    return {
      app: { ...DEFAULT_CONFIG.app, ...loaded.app },
      gmail: { ...DEFAULT_CONFIG.gmail, ...loaded.gmail },
      ai: { ...DEFAULT_CONFIG.ai, ...loaded.ai },
      sync: { ...DEFAULT_CONFIG.sync, ...loaded.sync },
      features: { ...DEFAULT_CONFIG.features, ...loaded.features },
      cache: { ...DEFAULT_CONFIG.cache, ...loaded.cache },
    };
  }

  /**
   * Save configuration to file
   */
  save(): void {
    try {
      writeJsonFile(this.filePath, this.config);
      logger.debug('Configuration saved');
    } catch (error) {
      logger.error('Failed to save configuration', error);
      throw error;
    }
  }

  /**
   * Get full configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update specific configuration
   */
  update(updates: Partial<AppConfig>): AppConfig {
    try {
      this.config = this.mergeWithDefaults({ ...this.config, ...updates });
      this.save();
      logger.info('Configuration updated');
      return this.getConfig();
    } catch (error) {
      logger.error('Failed to update configuration', error);
      throw error;
    }
  }

  /**
   * Update Gmail configuration
   */
  setGmailConfig(gmailConfig: Partial<AppConfig['gmail']>): void {
    this.update({ gmail: { ...this.config.gmail, ...gmailConfig } });
  }

  /**
   * Update AI configuration
   */
  setAIConfig(aiConfig: Partial<AppConfig['ai']>): void {
    this.update({ ai: { ...this.config.ai, ...aiConfig } });
  }

  /**
   * Update sync configuration
   */
  setSyncConfig(syncConfig: Partial<AppConfig['sync']>): void {
    this.update({ sync: { ...this.config.sync, ...syncConfig } });
  }

  /**
   * Update features configuration
   */
  setFeaturesConfig(featuresConfig: Partial<AppConfig['features']>): void {
    this.update({ features: { ...this.config.features, ...featuresConfig } });
  }

  /**
   * Update cache configuration
   */
  setCacheConfig(cacheConfig: Partial<AppConfig['cache']>): void {
    this.update({ cache: { ...this.config.cache, ...cacheConfig } });
  }

  /**
   * Get specific section
   */
  getSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return { ...this.config[section] };
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Reset to defaults
   */
  reset(): AppConfig {
    this.config = DEFAULT_CONFIG;
    this.save();
    logger.info('Configuration reset to defaults');
    return this.getConfig();
  }

  /**
   * Export configuration (excluding sensitive data)
   */
  export(): Omit<AppConfig, 'gmail'> {
    const { gmail, ...safe } = this.config;
    return safe;
  }

  /**
   * Validate configuration
   */
  validate(): boolean {
    try {
      // Check required fields
      if (!this.config.gmail.clientId) {
        logger.warn('Gmail client ID not configured');
        return false;
      }
      if (!this.config.gmail.clientSecret) {
        logger.warn('Gmail client secret not configured');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Configuration validation failed', error);
      return false;
    }
  }

  /**
   * Get version
   */
  getVersion(): string {
    return this.config.app.version;
  }

  /**
   * Get data directory
   */
  getDataDir(): string {
    return this.config.app.dataDir;
  }
}
