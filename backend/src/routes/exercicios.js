import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { calcularProgresso } from '../lib/progresso.js';

const router = Router();

async function vincularAlunos(supabase, exercicioId, alunoIds) {
  return supabase.from('exercicio_alunos').insert(alunoIds.map((aluno_id) => ({ exercicio_id: exercicioId, aluno_id })));
}

async function inserirQuestoes(supabase, exercicioId, questoes) {
  for (const [ordem, questao] of questoes.entries()) {
    const { data: questaoCriada, error: questaoError } = await supabase
      .from('questoes')
      .insert({
        exercicio_id: exercicioId,
        enunciado: questao.enunciado,
        tipo: questao.tipo || 'multipla_escolha',
        ordem,
        midia_url: questao.midia_url || null,
        midia_tipo: questao.midia_url ? questao.midia_tipo || 'imagem' : null,
      })
      .select()
      .single();
    if (questaoError) return { error: questaoError };

    const alternativas =
      questao.tipo === 'dissertativa'
        ? []
        : (questao.alternativas || []).map((a) => ({
            questao_id: questaoCriada.id,
            texto: a.texto,
            correta: !!a.correta,
          }));
    if (alternativas.length > 0) {
      const { error: alternativasError } = await supabase.from('alternativas').insert(alternativas);
      if (alternativasError) return { error: alternativasError };
    }
  }
  return { error: null };
}

function validarPayload(body) {
  const { titulo, disciplina, questoes, aluno_ids } = body;
  if (!titulo || !disciplina || !Array.isArray(questoes) || questoes.length === 0) {
    return 'Campos obrigatórios: titulo, disciplina, questoes (lista não vazia)';
  }
  if (!Array.isArray(aluno_ids) || aluno_ids.length === 0) {
    return 'Selecione ao menos um aluno para receber o exercício';
  }
  for (const [i, q] of questoes.entries()) {
    if (q.tipo === 'dissertativa') continue;
    if (!Array.isArray(q.alternativas) || q.alternativas.length < 2) {
      return `Questão ${i + 1}: informe ao menos 2 alternativas`;
    }
    if (!q.alternativas.some((a) => a.correta)) {
      return `Questão ${i + 1}: marque uma alternativa correta`;
    }
  }
  return null;
}

router.get('/', requireAuth, async (req, res) => {
  const { data: exercicios, error } = await req.supabase
    .from('exercicios')
    .select('id, titulo, disciplina, serie, criado_por, created_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  if (exercicios.length === 0) return res.json([]);

  const ids = exercicios.map((e) => e.id);
  const { data: questoes, error: questoesError } = await req.supabase
    .from('questoes')
    .select('id, exercicio_id')
    .in('exercicio_id', ids);
  if (questoesError) return res.status(400).json({ error: questoesError.message });

  const { data: minhasRespostas, error: respostasError } = await req.supabase
    .from('respostas_aluno')
    .select('questao_id, correta')
    .eq('aluno_id', req.user.id);
  if (respostasError) return res.status(400).json({ error: respostasError.message });

  res.json(calcularProgresso(exercicios, questoes, minhasRespostas));
});

router.get('/:id', requireAuth, async (req, res) => {
  const { data: exercicio, error } = await req.supabase
    .from('exercicios')
    .select('id, titulo, disciplina, serie, midia_url, midia_tipo, criado_por, created_at')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Exercício não encontrado' });

  const { data: questoes, error: questoesError } = await req.supabase
    .from('questoes')
    .select('id, enunciado, tipo, ordem, midia_url, midia_tipo, alternativas (id, texto, correta)')
    .eq('exercicio_id', req.params.id)
    .order('ordem', { ascending: true });
  if (questoesError) return res.status(400).json({ error: questoesError.message });

  const { data: alunos, error: alunosError } = await req.supabase
    .from('exercicio_alunos')
    .select('aluno_id, profiles (id, nome, turma)')
    .eq('exercicio_id', req.params.id);
  if (alunosError) return res.status(400).json({ error: alunosError.message });

  res.json({ ...exercicio, questoes, alunos: alunos.map((a) => a.profiles) });
});

router.post('/', requireAuth, async (req, res) => {
  const erroValidacao = validarPayload(req.body);
  if (erroValidacao) return res.status(400).json({ error: erroValidacao });
  const { titulo, disciplina, serie, midia_url, midia_tipo, questoes, aluno_ids } = req.body;

  const { data: exercicio, error: exercicioError } = await req.supabase
    .from('exercicios')
    .insert({
      titulo,
      disciplina,
      serie: serie || null,
      midia_url: midia_url || null,
      midia_tipo: midia_url ? midia_tipo || 'imagem' : null,
      criado_por: req.user.id,
    })
    .select()
    .single();
  if (exercicioError) return res.status(400).json({ error: exercicioError.message });

  const { error: vinculoError } = await vincularAlunos(req.supabase, exercicio.id, aluno_ids);
  if (vinculoError) return res.status(400).json({ error: vinculoError.message });

  const { error: questoesError } = await inserirQuestoes(req.supabase, exercicio.id, questoes);
  if (questoesError) return res.status(400).json({ error: questoesError.message });

  res.status(201).json(exercicio);
});

// edição substitui questões, alternativas e atribuições por completo, para
// garantir que todos os alunos fiquem com a mesma versão do exercício —
// como consequência, respostas antigas dessas questões são apagadas (cascade).
router.put('/:id', requireAuth, async (req, res) => {
  const erroValidacao = validarPayload(req.body);
  if (erroValidacao) return res.status(400).json({ error: erroValidacao });
  const { titulo, disciplina, serie, midia_url, midia_tipo, questoes, aluno_ids } = req.body;

  const { error: updateError } = await req.supabase
    .from('exercicios')
    .update({
      titulo,
      disciplina,
      serie: serie || null,
      midia_url: midia_url || null,
      midia_tipo: midia_url ? midia_tipo || 'imagem' : null,
    })
    .eq('id', req.params.id);
  if (updateError) return res.status(400).json({ error: updateError.message });

  const { error: delQuestoesError } = await req.supabase.from('questoes').delete().eq('exercicio_id', req.params.id);
  if (delQuestoesError) return res.status(400).json({ error: delQuestoesError.message });

  const { error: delAlunosError } = await req.supabase
    .from('exercicio_alunos')
    .delete()
    .eq('exercicio_id', req.params.id);
  if (delAlunosError) return res.status(400).json({ error: delAlunosError.message });

  const { error: vinculoError } = await vincularAlunos(req.supabase, req.params.id, aluno_ids);
  if (vinculoError) return res.status(400).json({ error: vinculoError.message });

  const { error: questoesError } = await inserirQuestoes(req.supabase, req.params.id, questoes);
  if (questoesError) return res.status(400).json({ error: questoesError.message });

  res.json({ id: req.params.id });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await req.supabase.from('exercicios').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

router.post('/:id/respostas', requireAuth, async (req, res) => {
  const { questao_id, alternativa_id, resposta_texto } = req.body;
  if (!questao_id || (!alternativa_id && !resposta_texto)) {
    return res.status(400).json({ error: 'Informe alternativa_id (objetiva) ou resposta_texto (dissertativa)' });
  }

  let correta = null;
  if (alternativa_id) {
    const { data: alternativa, error: alternativaError } = await req.supabase
      .from('alternativas')
      .select('correta')
      .eq('id', alternativa_id)
      .single();
    if (alternativaError) return res.status(400).json({ error: alternativaError.message });
    correta = alternativa.correta;
  }

  // insert (não upsert): a unique constraint em (aluno_id, questao_id) rejeita
  // uma segunda tentativa — o aluno não pode refazer uma questão já respondida.
  const { data, error } = await req.supabase
    .from('respostas_aluno')
    .insert({
      aluno_id: req.user.id,
      questao_id,
      alternativa_id: alternativa_id || null,
      resposta_texto: resposta_texto || null,
      correta,
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Você já respondeu essa questão.' });
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json(data);
});

router.get('/:id/resultados', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase.from('resultados').select('*').eq('exercicio_id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// respostas de um aluno específico para um exercício — usado tanto pelo próprio
// aluno (retomar após recarregar a página) quanto pelo professor (tela de revisão)
router.get('/:id/respostas', requireAuth, async (req, res) => {
  const alunoId = req.query.aluno_id || req.user.id;
  if (alunoId !== req.user.id) {
    const { data: chamador, error: chamadorError } = await req.supabase
      .from('profiles')
      .select('tipo')
      .eq('id', req.user.id)
      .single();
    if (chamadorError || chamador.tipo !== 'professor') {
      return res.status(403).json({ error: 'Sem permissão para ver respostas de outro aluno' });
    }
  }

  const { data: questoes, error: questoesError } = await req.supabase
    .from('questoes')
    .select('id')
    .eq('exercicio_id', req.params.id);
  if (questoesError) return res.status(400).json({ error: questoesError.message });

  const { data, error } = await req.supabase
    .from('respostas_aluno')
    .select('questao_id, alternativa_id, resposta_texto, correta')
    .eq('aluno_id', alunoId)
    .in(
      'questao_id',
      questoes.map((q) => q.id)
    );
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
