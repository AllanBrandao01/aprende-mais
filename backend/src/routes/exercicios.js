import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('exercicios')
    .select('id, titulo, disciplina, serie, criado_por, created_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id', requireAuth, async (req, res) => {
  const { data: exercicio, error } = await req.supabase
    .from('exercicios')
    .select('id, titulo, disciplina, serie, criado_por, created_at')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Exercício não encontrado' });

  const { data: questoes, error: questoesError } = await req.supabase
    .from('questoes')
    .select('id, enunciado, tipo, ordem, alternativas (id, texto, correta)')
    .eq('exercicio_id', req.params.id)
    .order('ordem', { ascending: true });
  if (questoesError) return res.status(400).json({ error: questoesError.message });

  res.json({ ...exercicio, questoes });
});

router.post('/', requireAuth, async (req, res) => {
  const { titulo, disciplina, serie, questoes } = req.body;
  if (!titulo || !disciplina || !Array.isArray(questoes) || questoes.length === 0) {
    return res.status(400).json({ error: 'Campos obrigatórios: titulo, disciplina, questoes (lista não vazia)' });
  }

  const { data: exercicio, error: exercicioError } = await req.supabase
    .from('exercicios')
    .insert({ titulo, disciplina, serie: serie || null, criado_por: req.user.id })
    .select()
    .single();
  if (exercicioError) return res.status(400).json({ error: exercicioError.message });

  for (const [ordem, questao] of questoes.entries()) {
    const { data: questaoCriada, error: questaoError } = await req.supabase
      .from('questoes')
      .insert({
        exercicio_id: exercicio.id,
        enunciado: questao.enunciado,
        tipo: questao.tipo || 'multipla_escolha',
        ordem,
      })
      .select()
      .single();
    if (questaoError) return res.status(400).json({ error: questaoError.message });

    const alternativas = (questao.alternativas || []).map((a) => ({
      questao_id: questaoCriada.id,
      texto: a.texto,
      correta: !!a.correta,
    }));
    if (alternativas.length > 0) {
      const { error: alternativasError } = await req.supabase.from('alternativas').insert(alternativas);
      if (alternativasError) return res.status(400).json({ error: alternativasError.message });
    }
  }

  res.status(201).json(exercicio);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { titulo, disciplina, serie } = req.body;
  const { data, error } = await req.supabase
    .from('exercicios')
    .update({ titulo, disciplina, serie })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await req.supabase.from('exercicios').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

router.post('/:id/respostas', requireAuth, async (req, res) => {
  const { questao_id, alternativa_id } = req.body;
  if (!questao_id || !alternativa_id) {
    return res.status(400).json({ error: 'Campos obrigatórios: questao_id, alternativa_id' });
  }

  const { data: alternativa, error: alternativaError } = await req.supabase
    .from('alternativas')
    .select('correta')
    .eq('id', alternativa_id)
    .single();
  if (alternativaError) return res.status(400).json({ error: alternativaError.message });

  const { data, error } = await req.supabase
    .from('respostas_aluno')
    .upsert(
      { aluno_id: req.user.id, questao_id, alternativa_id, correta: alternativa.correta },
      { onConflict: 'aluno_id,questao_id' }
    )
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/:id/resultados', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase.from('resultados').select('*').eq('exercicio_id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
