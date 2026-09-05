import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

router.get('/db', async (req, res) => {
  const { error } = await supabase.from('exercicios').select('id').limit(1);
  if (error) return res.status(500).json({ status: 'erro', error: error.message });
  res.json({ status: 'conectado ao supabase' });
});

export default router;
