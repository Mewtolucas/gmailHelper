import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GmailClient } from '../services/gmail/gmailClient';
import { env } from '../config/environment';
import { categoriesRouter } from './routes/categories';
import { emailsRouter } from './routes/emails';
import { vipRouter } from './routes/vip';
import { authRouter, setGmailClient } from './routes/auth';
import { syncRouter } from './routes/sync';
import { logger } from '../utils/logger';

dotenv.config();

const app = express();
const PORT = env.WEB_PORT || 3000;

// Initialize Gmail Client
const gmailClient = new GmailClient({
  clientId: env.GMAIL_CLIENT_ID,
  clientSecret: env.GMAIL_CLIENT_SECRET,
  redirectUri: env.GMAIL_REDIRECT_URI
});

// Set Gmail client for routes
setGmailClient(gmailClient);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:*',
    'http://localhost:3000',
    'chrome-extension://*'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/vip', vipRouter);
app.use('/api/sync', syncRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    authenticated: gmailClient.isAuthenticated()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('API error', err);
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Gmail Helper API running on http://localhost:${PORT}`);
  console.log(`📧 Authenticated: ${gmailClient.isAuthenticated()}\n`);
});
