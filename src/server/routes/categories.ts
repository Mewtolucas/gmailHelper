import express, { Router } from 'express';
import { StorageService } from '../../services/storage/storageService';

export const categoriesRouter = Router();
const storage = StorageService.getInstance();

categoriesRouter.get('/', async (req, res) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

categoriesRouter.post('/', async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = {
      id: Date.now().toString(),
      name,
      color: color || '#808080',
      icon: icon || '📁',
      createdAt: new Date().toISOString()
    };

    const categories = await storage.getCategories();
    categories.push(category);
    await storage.saveCategories(categories);

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

categoriesRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon } = req.body;

    const categories = await storage.getCategories();
    const categoryIndex = categories.findIndex(c => c.id === id);

    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    categories[categoryIndex] = {
      ...categories[categoryIndex],
      name: name || categories[categoryIndex].name,
      color: color || categories[categoryIndex].color,
      icon: icon || categories[categoryIndex].icon
    };

    await storage.saveCategories(categories);
    res.json(categories[categoryIndex]);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

categoriesRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categories = await storage.getCategories();
    const filteredCategories = categories.filter(c => c.id !== id);

    if (categories.length === filteredCategories.length) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await storage.saveCategories(filteredCategories);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});
