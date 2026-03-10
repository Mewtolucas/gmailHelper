import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { categoriesRouter } from './routes/categories';
import { emailsRouter } from './routes/emails';
import { vipRouter } from './routes/vip';
import { authRouter } from './routes/auth';
import { syncRouter } from './routes/sync';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:*',
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
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Gmail Helper API running on http://localhost:${PORT}`);
});
