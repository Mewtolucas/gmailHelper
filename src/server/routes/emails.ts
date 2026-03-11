import { Router } from 'express';
import { GmailClient } from '../../services/gmail/gmailClient';

export const emailsRouter = Router();
let gmailClient: GmailClient;

export function setGmailClientEmails(client: GmailClient) {
  gmailClient = client;
}

emailsRouter.get('/', async (req, res) => {
  try {
    if (!gmailClient) {
      return res.status(500).json({ error: 'Gmail client not initialized' });
    }

    const { limit = 50, query } = req.query;
    const emails = await gmailClient.fetchEmails({
      maxResults: Math.min(parseInt(limit as string), 100),
      query: query as string
    });

    res.json(emails);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

emailsRouter.get('/:emailId', async (req, res) => {
  try {
    if (!gmailClient) {
      return res.status(500).json({ error: 'Gmail client not initialized' });
    }

    const email = await gmailClient.getEmail(req.params.emailId);
    res.json(email);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

emailsRouter.post('/:emailId/labels', async (req, res) => {
  try {
    if (!gmailClient) {
      return res.status(500).json({ error: 'Gmail client not initialized' });
    }

    const { emailId } = req.params;
    const { addLabelIds = [], removeLabelIds = [] } = req.body;

    const updated = await gmailClient.modifyEmail(emailId, {
      addLabelIds,
      removeLabelIds
    });

    res.json({ success: true, message: 'Email labels updated', email: updated });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

emailsRouter.post('/:emailId/trash', async (req, res) => {
  try {
    if (!gmailClient) {
      return res.status(500).json({ error: 'Gmail client not initialized' });
    }

    const { emailId } = req.params;
    await gmailClient.trashEmail(emailId);
    res.json({ success: true, message: 'Email moved to trash' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});
