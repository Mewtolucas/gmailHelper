/**
 * Base file storage class for persistent data management
 */
import * as path from 'path';
import { getConfigFilePath, writeJsonFile, readJsonFile, generateId } from '../../utils/helpers';
import { logger } from '../../utils/logger';

export abstract class FileStore<T extends { id: string; createdAt: Date; modifiedAt: Date }> {
  protected filename: string;
  protected data: Map<string, T>;
  protected filePath: string;

  constructor(filename: string) {
    this.filename = filename;
    this.filePath = getConfigFilePath(filename);
    this.data = new Map();
    this.load();
  }

  /**
   * Load data from file
   */
  protected load(): void {
    try {
      const fileData = readJsonFile<T[]>(this.filePath, []);
      this.data.clear();
      if (Array.isArray(fileData)) {
        for (const item of fileData) {
          this.data.set(item.id, item);
        }
      }
      logger.debug(`Loaded ${this.data.size} items from ${this.filename}`);
    } catch (error) {
      logger.warn(`Failed to load ${this.filename}, starting with empty data`, error);
      this.data.clear();
    }
  }

  /**
   * Save data to file
   */
  protected save(): void {
    try {
      const data = Array.from(this.data.values());
      writeJsonFile(this.filePath, data);
      logger.debug(`Saved ${data.length} items to ${this.filename}`);
    } catch (error) {
      logger.error(`Failed to save ${this.filename}`, error);
      throw error;
    }
  }

  /**
   * Create new item
   */
  create(item: Omit<T, 'id' | 'createdAt' | 'modifiedAt'>): T {
    try {
      const newItem: T = {
        ...(item as T),
        id: generateId(),
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      this.data.set(newItem.id, newItem);
      this.save();
      logger.debug(`Created item ${newItem.id}`);
      return newItem;
    } catch (error) {
      logger.error('Failed to create item', error);
      throw error;
    }
  }

  /**
   * Get item by ID
   */
  getById(id: string): T | null {
    return this.data.get(id) || null;
  }

  /**
   * Get all items
   */
  getAll(): T[] {
    return Array.from(this.data.values());
  }

  /**
   * Find items by predicate
   */
  find(predicate: (item: T) => boolean): T[] {
    return Array.from(this.data.values()).filter(predicate);
  }

  /**
   * Find first item matching predicate
   */
  findOne(predicate: (item: T) => boolean): T | null {
    return Array.from(this.data.values()).find(predicate) || null;
  }

  /**
   * Update item
   */
  update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): T | null {
    try {
      const item = this.data.get(id);
      if (!item) {
        logger.warn(`Item ${id} not found`);
        return null;
      }

      const updated: T = {
        ...item,
        ...updates,
        id: item.id,
        createdAt: item.createdAt,
        modifiedAt: new Date(),
      };

      this.data.set(id, updated);
      this.save();
      logger.debug(`Updated item ${id}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update item ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete item
   */
  delete(id: string): boolean {
    try {
      if (!this.data.has(id)) {
        logger.warn(`Item ${id} not found`);
        return false;
      }

      this.data.delete(id);
      this.save();
      logger.debug(`Deleted item ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete item ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete multiple items
   */
  deleteMany(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.delete(id)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all items
   */
  clear(): void {
    try {
      this.data.clear();
      this.save();
      logger.info(`Cleared all items from ${this.filename}`);
    } catch (error) {
      logger.error(`Failed to clear ${this.filename}`, error);
      throw error;
    }
  }

  /**
   * Get count of items
   */
  count(): number {
    return this.data.size;
  }

  /**
   * Check if item exists
   */
  exists(id: string): boolean {
    return this.data.has(id);
  }

  /**
   * Reload data from file
   */
  reload(): void {
    logger.debug(`Reloading ${this.filename}`);
    this.load();
  }
}
