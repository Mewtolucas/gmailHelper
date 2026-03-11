import { Router } from 'express';
import { CategoryStore } from '../../services/storage/categoryStore';

export const categoriesRouter = Router();
const categoryStore = new CategoryStore();

categoriesRouter.get('/', (req, res) => {
  try {
    const categories = categoryStore.getAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

categoriesRouter.post('/', (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = categoryStore.create({
      name,
      color: color || '#808080',
      rules: [],
      autoApply: false
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

categoriesRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    let updated = categoryStore.getById(id);
    if (!updated) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (name) {
      updated = categoryStore.rename(id, name) || updated;
    }
    if (color) {
      updated = categoryStore.setColor(id, color) || updated;
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

categoriesRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = categoryStore.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message
    });
  }
});
