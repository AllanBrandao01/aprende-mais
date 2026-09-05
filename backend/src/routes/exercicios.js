import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase.from('exercicios').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
