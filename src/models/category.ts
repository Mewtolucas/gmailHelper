/**
 * Category model for organizing emails
 */
export interface CategoryRule {
  id: string;
  name: string;
  conditions: {
    from?: string[];
    subject?: string[];
    body?: string[];
    hasAttachments?: boolean;
    before?: Date;
    after?: Date;
    matchAll?: boolean;
  };
  enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  rules: CategoryRule[];
  autoApply: boolean;
  priority: number;
  createdAt: Date;
  modifiedAt: Date;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'modifiedAt'>[] = [
  {
    name: 'Work',
    color: '#4285F4',
    icon: '💼',
    description: 'Work-related emails',
    rules: [],
    autoApply: true,
    priority: 1,
  },
  {
    name: 'Personal',
    color: '#34A853',
    icon: '👤',
    description: 'Personal emails',
    rules: [],
    autoApply: true,
    priority: 2,
  },
  {
    name: 'Finance',
    color: '#FBBC04',
    icon: '💰',
    description: 'Financial and billing emails',
    rules: [],
    autoApply: true,
    priority: 3,
  },
  {
    name: 'Shopping',
    color: '#EA4335',
    icon: '🛒',
    description: 'Shopping and purchases',
    rules: [],
    autoApply: true,
    priority: 4,
  },
  {
    name: 'Social',
    color: '#9C27B0',
    icon: '👥',
    description: 'Social and community',
    rules: [],
    autoApply: true,
    priority: 5,
  },
  {
    name: 'Other',
    color: '#757575',
    icon: '📋',
    description: 'Other emails',
    rules: [],
    autoApply: true,
    priority: 6,
  },
];
