import express, { Router } from 'express';
import { GmailService } from '../../services/gmail/gmailService';
import { StorageService } from '../../services/storage/storageService';
import { Categorizer } from '../../services/email/categorizer';

export const syncRouter = Router();
const gmail = GmailService.getInstance();
const storage = StorageService.getInstance();
const categorizer = new Categorizer();

syncRouter.post('/start', async (req, res) => {
  try {
    const { days = 30 } = req.body;

    res.json({
      status: 'syncing',
      message: 'Starting email sync...',
      timestamp: new Date()
    });

    // Start sync in background
    (async () => {
      try {
        const emails = await gmail.listEmails({
          maxResults: 100,
          q: `after:${getDaysAgoDate(days)}`
        });

        let categorizedCount = 0;
        for (const email of emails) {
          try {
            const category = await categorizer.categorizeEmail(email);
            if (category) {
              await gmail.addLabel(email.id, category.id);
              categorizedCount++;
            }
          } catch (err) {
            console.error(`Error categorizing email ${email.id}:`, err);
          }
        }

        console.log(`Sync complete: ${emails.length} emails, ${categorizedCount} categorized`);
      } catch (err) {
        console.error('Sync failed:', err);
      }
    })();
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

syncRouter.get('/status', async (req, res) => {
  try {
    const config = await storage.getConfig();
    res.json({
      lastSync: config.lastSync,
      syncInterval: config.syncInterval,
      status: 'idle'
    });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

function getDaysAgoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}
