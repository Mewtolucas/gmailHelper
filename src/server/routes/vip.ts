import express, { Router } from 'express';
import { StorageService } from '../../services/storage/storageService';

export const vipRouter = Router();
const storage = StorageService.getInstance();

vipRouter.get('/', async (req, res) => {
  try {
    const vipList = await storage.getVIPList();
    res.json(vipList);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

vipRouter.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const vip = {
      id: Date.now().toString(),
      name: name || email,
      email,
      createdAt: new Date().toISOString()
    };

    const vipList = await storage.getVIPList();
    vipList.push(vip);
    await storage.saveVIPList(vipList);

    res.status(201).json(vip);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

vipRouter.delete('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const vipList = await storage.getVIPList();
    const filteredList = vipList.filter(v => v.email !== email);

    if (vipList.length === filteredList.length) {
      return res.status(404).json({ error: 'VIP not found' });
    }

    await storage.saveVIPList(filteredList);
    res.json({ success: true, message: 'VIP removed' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});
