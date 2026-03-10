import express, { Router } from 'express';
import { GmailService } from '../../services/gmail/gmailService';
import { StorageService } from '../../services/storage/storageService';
import { Categorizer } from '../../services/email/categorizer';
import { Prioritizer } from '../../services/email/prioritizer';

export const emailsRouter = Router();
const gmail = GmailService.getInstance();
const storage = StorageService.getInstance();
const categorizer = new Categorizer();
const prioritizer = new Prioritizer();

emailsRouter.get('/', async (req, res) => {
  try {
    const { category, priority, limit = 50, offset = 0 } = req.query;

    const emails = await gmail.listEmails({
      maxResults: parseInt(limit as string),
      q: category ? `label:${category}` : undefined
    });

    if (priority) {
      const important = await storage.getImportantEmails();
      return res.json(
        emails.filter(e => important.includes(e.id)).slice(offset as any, (offset as any) + limit)
      );
    }

    res.json(emails.slice(offset as any, (offset as any) + limit));
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

emailsRouter.post('/:emailId/categorize', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    await gmail.addLabel(emailId, categoryId);
    res.json({ success: true, message: 'Email categorized' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

emailsRouter.post('/:emailId/flag-important', async (req, res) => {
  try {
    const { emailId } = req.params;

    const important = await storage.getImportantEmails();
    if (!important.includes(emailId)) {
      important.push(emailId);
      await storage.saveImportantEmails(important);
    }

    res.json({ success: true, message: 'Email flagged as important' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

emailsRouter.post('/:emailId/spam', async (req, res) => {
  try {
    const { emailId } = req.params;
    await gmail.moveToSpam(emailId);
    res.json({ success: true, message: 'Email moved to spam' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

emailsRouter.post('/analyze', async (req, res) => {
  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({ error: 'Email ID is required' });
    }

    const email = await gmail.getEmail(emailId);
    const category = await categorizer.categorizeEmail(email);

    res.json({
      category,
      isPriority: await prioritizer.isPriority(email),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});
