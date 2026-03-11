import express, { Router } from 'express';
import { GmailClient } from '../../services/gmail/gmailClient';

export const authRouter = Router();
let gmailClient: GmailClient;

export function setGmailClient(client: GmailClient) {
  gmailClient = client;
}

authRouter.get('/status', async (req, res) => {
  try {
    if (!gmailClient) {
      return res.json({ authenticated: false });
    }
    res.json({
      authenticated: gmailClient.isAuthenticated(),
      timestamp: new Date()
    });
  } catch (error) {
    res.json({
      authenticated: false,
      error: (error as Error).message
    });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    if (!gmailClient) {
      return res.status(500).json({ error: 'Gmail client not initialized' });
    }
    const authUrl = gmailClient.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

authRouter.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    if (!gmailClient) {
      return res.status(500).json({ error: 'Gmail client not initialized' });
    }

    await gmailClient.handleAuthCallback(code);
    res.json({ success: true, message: 'Authentication successful' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

authRouter.post('/logout', async (req, res) => {
  try {
    if (!gmailClient) {
      return res.status(500).json({ error: 'Gmail client not initialized' });
    }
    gmailClient.logout();
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});
