import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { emailDoUsuario } from '../lib/usuario.js';
import { calcularProgresso } from '../lib/progresso.js';

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

// só o professor cadastra alunos — evita depender da criança se autocadastrar
router.post('/', requireAuth, async (req, res) => {
  const { data: chamador, error: chamadorError } = await req.supabase
    .from('profiles')
    .select('tipo')
    .eq('id', req.user.id)
    .single();
  if (chamadorError || chamador.tipo !== 'professor') {
    return res.status(403).json({ error: 'Apenas professores podem cadastrar alunos' });
  }

  const { nome, usuario, password, turma } = req.body;
  if (!nome || !usuario || !password || !/^[a-z0-9._-]+$/i.test(usuario)) {
    return res
      .status(400)
      .json({ error: 'Campos obrigatórios: nome, usuario (letras, números, ponto, traço ou underline), password' });
  }

  const usuarioFinal = usuario.toLowerCase();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: emailDoUsuario(usuarioFinal),
    password,
    email_confirm: true,
  });
  if (error) {
    if (error.message.includes('already been registered')) {
      return res.status(400).json({ error: 'Nome de usuário já em uso' });
    }
    return res.status(400).json({ error: error.message });
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({ id: data.user.id, nome, tipo: 'aluno', turma: turma || null, usuario: usuarioFinal });
  if (profileError) return res.status(400).json({ error: profileError.message });

  res.status(201).json({ id: data.user.id, nome, turma: turma || null, usuario: usuarioFinal, situacao: 'em_reforco' });
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

// exercícios atribuídos a um aluno com o progresso dele em cada um (pendente ou
// concluído) — usado na tela de evolução do professor, que antes só mostrava
// os já respondidos
router.get('/:id/exercicios', requireAuth, async (req, res) => {
  if (req.params.id !== req.user.id) {
    const { data: chamador, error: chamadorError } = await req.supabase
      .from('profiles')
      .select('tipo')
      .eq('id', req.user.id)
      .single();
    if (chamadorError || chamador.tipo !== 'professor') {
      return res.status(403).json({ error: 'Sem permissão para ver exercícios de outro aluno' });
    }
  }

  const { data: vinculos, error: vinculosError } = await req.supabase
    .from('exercicio_alunos')
    .select('exercicio_id, exercicios (id, titulo, disciplina, serie, created_at)')
    .eq('aluno_id', req.params.id);
  if (vinculosError) return res.status(400).json({ error: vinculosError.message });
  if (vinculos.length === 0) return res.json([]);

  const exerciciosBase = vinculos.map((v) => v.exercicios).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const ids = exerciciosBase.map((e) => e.id);

  const { data: questoes, error: questoesError } = await req.supabase
    .from('questoes')
    .select('id, exercicio_id')
    .in('exercicio_id', ids);
  if (questoesError) return res.status(400).json({ error: questoesError.message });

  const { data: respostas, error: respostasError } = await req.supabase
    .from('respostas_aluno')
    .select('questao_id, correta')
    .eq('aluno_id', req.params.id);
  if (respostasError) return res.status(400).json({ error: respostasError.message });

  res.json(calcularProgresso(exerciciosBase, questoes, respostas));
});

export default router;
