import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('profiles')
    .select('id, nome, turma, usuario, situacao')
    .eq('tipo', 'aluno')
    .order('nome', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { situacao } = req.body;
  if (!['em_reforco', 'apto_saida'].includes(situacao)) {
    return res.status(400).json({ error: 'situacao deve ser em_reforco ou apto_saida' });
  }
  const { data, error } = await req.supabase
    .from('profiles')
    .update({ situacao })
    .eq('id', req.params.id)
    .select('id, nome, turma, situacao')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id/evolucao', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('resultados')
    .select('exercicio_id, exercicio_titulo, exercicio_criado_em, acertos, total_respondidas, percentual')
    .eq('aluno_id', req.params.id)
    .order('exercicio_criado_em', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
