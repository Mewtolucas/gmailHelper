import express, { Router } from 'express';
import { oauth } from '../../auth/oauth';
import { tokenManager } from '../../auth/tokenManager';

export const authRouter = Router();

authRouter.get('/status', async (req, res) => {
  try {
    const token = await tokenManager.getToken();
    res.json({
      authenticated: !!token,
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
    const authUrl = oauth.generateAuthUrl();
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

    await oauth.handleCallback(code);
    res.json({ success: true, message: 'Authentication successful' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

authRouter.post('/logout', async (req, res) => {
  try {
    await tokenManager.clearToken();
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});
