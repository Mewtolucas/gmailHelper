import { Router } from 'express';
import { VIPListStore } from '../../services/storage/vipListStore';

export const vipRouter = Router();
const vipStore = new VIPListStore();

vipRouter.get('/', (req, res) => {
  try {
    const vipList = vipStore.getAll();
    res.json(vipList);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

vipRouter.post('/', (req, res) => {
  try {
    const { name, email, priority } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const vip = vipStore.create({
      name: name || email,
      email,
      priority: priority || 'high'
    });

    res.status(201).json(vip);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

vipRouter.delete('/:email', (req, res) => {
  try {
    const { email } = req.params;
    const vip = vipStore.findOne(v => v.email.toLowerCase() === email.toLowerCase());

    if (!vip) {
      return res.status(404).json({ error: 'VIP not found' });
    }

    vipStore.delete(vip.id);
    res.json({ success: true, message: 'VIP removed' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});
