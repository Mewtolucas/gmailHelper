/**
 * Category storage and management
 */
import { FileStore } from './fileStore';
import { Category, DEFAULT_CATEGORIES } from '../../models/category';
import { CATEGORIES_FILE } from '../../config/constants';
import { logger } from '../../utils/logger';

export class CategoryStore extends FileStore<Category> {
  constructor() {
    super(CATEGORIES_FILE);
    // Initialize with default categories if empty
    if (this.count() === 0) {
      this.initializeDefaults();
    }
  }

  /**
   * Initialize with default categories
   */
  private initializeDefaults(): void {
    try {
      for (const defaultCat of DEFAULT_CATEGORIES) {
        this.create(defaultCat);
      }
      logger.info('Initialized with default categories');
    } catch (error) {
      logger.error('Failed to initialize default categories', error);
    }
  }

  /**
   * Create new category with validation
   */
  create(category: Omit<Category, 'id' | 'createdAt' | 'modifiedAt'>): Category {
    // Validate category name is unique
    if (this.findOne((c) => c.name.toLowerCase() === category.name.toLowerCase())) {
      throw new Error(`Category "${category.name}" already exists`);
    }

    // Validate color format
    if (!this.isValidColor(category.color)) {
      throw new Error(`Invalid color format: ${category.color}`);
    }

    return super.create(category);
  }

  /**
   * Rename category
   */
  rename(id: string, newName: string): Category | null {
    const existing = this.findOne((c) => c.name.toLowerCase() === newName.toLowerCase());
    if (existing && existing.id !== id) {
      throw new Error(`Category "${newName}" already exists`);
    }

    return this.update(id, { name: newName });
  }

  /**
   * Change category color
   */
  setColor(id: string, color: string): Category | null {
    if (!this.isValidColor(color)) {
      throw new Error(`Invalid color format: ${color}`);
    }

    return this.update(id, { color });
  }

  /**
   * Get categories sorted by priority
   */
  getSortedCategories(): Category[] {
    return this.getAll().sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get category by name
   */
  getByName(name: string): Category | null {
    return this.findOne((c) => c.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Reorder categories
   */
  reorder(ids: string[]): boolean {
    try {
      let priority = 1;
      for (const id of ids) {
        const category = this.getById(id);
        if (!category) {
          logger.warn(`Category ${id} not found during reorder`);
          continue;
        }
        this.update(id, { priority });
        priority++;
      }
      logger.info('Reordered categories');
      return true;
    } catch (error) {
      logger.error('Failed to reorder categories', error);
      return false;
    }
  }

  /**
   * Get statistics
   */
  getStats(): { totalCategories: number; categoriesWithRules: number; autoApplyCount: number } {
    const all = this.getAll();
    return {
      totalCategories: all.length,
      categoriesWithRules: all.filter((c) => c.rules.length > 0).length,
      autoApplyCount: all.filter((c) => c.autoApply).length,
    };
  }

  /**
   * Validate color format (hex color)
   */
  private isValidColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }
}
