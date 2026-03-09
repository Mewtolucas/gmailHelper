/**
 * Gmail service types and interfaces
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload?: {
    partId: string;
    mimeType: string;
    filename: string;
    headers?: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      size: number;
      data?: string;
    };
    parts?: any[];
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface GmailList {
  messages?: GmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface GmailLabel {
  id: string;
  name: string;
  labelListVisibility: string;
  messageListVisibility: string;
}

export interface GmailThread {
  id: string;
  snippet: string;
  historyId: string;
  messages?: GmailMessage[];
}

export interface FetchEmailsOptions {
  query?: string;
  maxResults?: number;
  pageToken?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  replyTo?: string;
}
