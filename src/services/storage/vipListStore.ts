/**
 * VIP contacts list storage and management
 */
import { FileStore } from './fileStore';
import { VIPContact, VIPPriority } from '../../models/vip';
import { VIP_LIST_FILE } from '../../config/constants';
import { logger } from '../../utils/logger';
import { isValidEmail, extractEmailAddress } from '../../utils/helpers';

export class VIPListStore extends FileStore<VIPContact> {
  constructor() {
    super(VIP_LIST_FILE);
  }

  /**
   * Create new VIP contact with validation
   */
  create(contact: Omit<VIPContact, 'id' | 'createdAt' | 'modifiedAt'>): VIPContact {
    // Validate email
    const email = extractEmailAddress(contact.email);
    if (!isValidEmail(email)) {
      throw new Error(`Invalid email format: ${contact.email}`);
    }

    // Check for duplicates
    if (this.findOne((c) => c.email.toLowerCase() === email.toLowerCase())) {
      throw new Error(`VIP contact "${email}" already exists`);
    }

    return super.create({
      ...contact,
      email: email,
    });
  }

  /**
   * Add VIP contact
   */
  add(email: string, name: string, priority: VIPPriority = 'important'): VIPContact {
    return this.create({ email, name, priority, notifyOnEmail: true });
  }

  /**
   * Remove VIP contact by email
   */
  removeByEmail(email: string): boolean {
    const contact = this.getByEmail(email);
    if (!contact) {
      return false;
    }
    return this.delete(contact.id);
  }

  /**
   * Get VIP contact by email
   */
  getByEmail(email: string): VIPContact | null {
    const normalizedEmail = extractEmailAddress(email).toLowerCase();
    return this.findOne((c) => c.email.toLowerCase() === normalizedEmail);
  }

  /**
   * Check if email is VIP
   */
  isVIP(email: string): boolean {
    return this.getByEmail(email) !== null;
  }

  /**
   * Get VIP contacts by priority
   */
  getByPriority(priority: VIPPriority): VIPContact[] {
    return this.find((c) => c.priority === priority);
  }

  /**
   * Get all VIP contacts sorted by priority
   */
  getSortedByPriority(): VIPContact[] {
    const priorityOrder: Record<VIPPriority, number> = {
      vip: 1,
      important: 2,
      normal: 3,
    };

    return this.getAll().sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /**
   * Search VIP contacts by name or email
   */
  search(query: string): VIPContact[] {
    const lowerQuery = query.toLowerCase();
    return this.find(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.email.toLowerCase().includes(lowerQuery) ||
        (c.tags?.some((t) => t.toLowerCase().includes(lowerQuery)) ?? false),
    );
  }

  /**
   * Add tag to VIP contact
   */
  addTag(id: string, tag: string): VIPContact | null {
    const contact = this.getById(id);
    if (!contact) {
      return null;
    }

    const tags = contact.tags || [];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }

    return this.update(id, { tags });
  }

  /**
   * Remove tag from VIP contact
   */
  removeTag(id: string, tag: string): VIPContact | null {
    const contact = this.getById(id);
    if (!contact) {
      return null;
    }

    const tags = (contact.tags || []).filter((t) => t !== tag);
    return this.update(id, { tags });
  }

  /**
   * Update VIP priority
   */
  setPriority(id: string, priority: VIPPriority): VIPContact | null {
    return this.update(id, { priority });
  }

  /**
   * Import contacts from array
   */
  importFromArray(contacts: Array<{ email: string; name: string }>): number {
    let count = 0;
    for (const contact of contacts) {
      try {
        if (!this.getByEmail(contact.email)) {
          this.create({
            email: contact.email,
            name: contact.name,
            priority: 'normal',
            notifyOnEmail: false,
          });
          count++;
        }
      } catch (error) {
        logger.warn(`Failed to import contact ${contact.email}`, error);
      }
    }
    logger.info(`Imported ${count} VIP contacts`);
    return count;
  }

  /**
   * Export contacts as array
   */
  exportAsArray(): Array<{ email: string; name: string }> {
    return this.getAll().map((c) => ({
      email: c.email,
      name: c.name,
    }));
  }

  /**
   * Merge duplicate contacts
   */
  mergeDuplicates(): number {
    const emailMap = new Map<string, VIPContact[]>();

    // Group by email
    for (const contact of this.getAll()) {
      const email = contact.email.toLowerCase();
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      emailMap.get(email)!.push(contact);
    }

    // Merge duplicates
    let mergedCount = 0;
    for (const [, contacts] of emailMap) {
      if (contacts.length > 1) {
        // Keep the first, delete the rest
        const primary = contacts[0];
        const toDelete = contacts.slice(1);

        for (const duplicate of toDelete) {
          this.delete(duplicate.id);
          mergedCount++;
        }

        logger.info(`Merged ${toDelete.length} duplicate contacts for ${primary.email}`);
      }
    }

    return mergedCount;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalContacts: number;
    vipCount: number;
    importantCount: number;
    normalCount: number;
  } {
    const all = this.getAll();
    return {
      totalContacts: all.length,
      vipCount: all.filter((c) => c.priority === 'vip').length,
      importantCount: all.filter((c) => c.priority === 'important').length,
      normalCount: all.filter((c) => c.priority === 'normal').length,
    };
  }
}
