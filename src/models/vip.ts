/**
 * VIP/Important contacts model
 */
export type VIPPriority = 'vip' | 'important' | 'normal';

export interface VIPContact {
  id: string;
  email: string;
  name: string;
  category?: string;
  priority: VIPPriority;
  tags?: string[];
  notifyOnEmail: boolean;
  createdAt: Date;
  modifiedAt: Date;
}
