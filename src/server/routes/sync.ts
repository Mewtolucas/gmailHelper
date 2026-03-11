import { Router } from 'express';

export const syncRouter = Router();

syncRouter.post('/start', (req, res) => {
  try {
    const { days = 30 } = req.body;

    res.json({
      status: 'syncing',
      message: 'Email sync initiated',
      days,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

syncRouter.get('/status', (req, res) => {
  try {
    res.json({
      status: 'idle',
      lastSync: null,
      message: 'Ready to sync'
    });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});
