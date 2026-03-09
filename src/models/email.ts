/**
 * Core Email data model representing a Gmail message
 */
export interface EmailAnalysisMetadata {
  aiCategory?: string;
  confidence?: number;
  reasoning?: string;
  spamScore?: number;
  phishingScore?: number;
}

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Email {
  id: string;
  threadId: string;
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  snippet: string;
  date: Date;
  labels: string[];
  category?: string;
  priority: PriorityLevel;
  isSpam: boolean;
  isPhishing: boolean;
  isImportant: boolean;
  isPinned: boolean;
  isVIP: boolean;
  isDraft: boolean;
  hasAttachments: boolean;
  createdAt: Date;
  lastModified: Date;
  analysisMetadata?: EmailAnalysisMetadata;
}
