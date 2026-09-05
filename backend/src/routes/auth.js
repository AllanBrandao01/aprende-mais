import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

const router = Router();

// Cria a conta já confirmada (sem enviar e-mail) — necessário porque alunos do
// fundamental normalmente não têm e-mail próprio para confirmar.
router.post('/register', async (req, res) => {
  const { email, password, nome, tipo, turma } = req.body;
  if (!email || !password || !nome || !['aluno', 'professor'].includes(tipo)) {
    return res.status(400).json({ error: 'Campos obrigatórios: email, password, nome, tipo (aluno|professor)' });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return res.status(400).json({ error: error.message });

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({ id: data.user.id, nome, tipo, turma: turma || null });
  if (profileError) return res.status(400).json({ error: profileError.message });

  res.status(201).json({ user: { id: data.user.id, email, nome, tipo, turma } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Campos obrigatórios: email, password' });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });

  const scopedClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
  const { data: profile, error: profileError } = await scopedClient
    .from('profiles')
    .select('nome, tipo, turma')
    .eq('id', data.user.id)
    .single();
  if (profileError) return res.status(400).json({ error: profileError.message });

  res.json({ access_token: data.session.access_token, user: { id: data.user.id, email, ...profile } });
});

export default router;
