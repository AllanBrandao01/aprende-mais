import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

const router = Router();

// Aluno do fundamental normalmente não tem e-mail próprio, então ele usa um
// nome de usuário. O Supabase Auth exige e-mail internamente, então convertemos
// o usuário num e-mail sintético (nunca exposto na interface).
function emailDoUsuario(usuario) {
  return `${usuario}@aprendemais.local`;
}

// Cadastro público só cria conta de aluno. Professor não se autocadastra —
// contas de professor exigem vínculo com a escola, então são criadas à parte
// (hoje, manualmente pela equipe do projeto; no futuro, por um professor já existente).
router.post('/register', async (req, res) => {
  const { usuario, password, nome, turma } = req.body;
  if (!password || !nome || !usuario || !/^[a-z0-9._-]+$/i.test(usuario)) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, usuario (letras, números, ponto, traço ou underline), password' });
  }

  const usuarioFinal = usuario.toLowerCase();
  const emailFinal = emailDoUsuario(usuarioFinal);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: emailFinal,
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

  res.status(201).json({ user: { id: data.user.id, nome, tipo: 'aluno', turma, usuario: usuarioFinal } });
});

router.post('/login', async (req, res) => {
  const { email, usuario, password } = req.body;
  if (!password || (!email && !usuario)) {
    return res.status(400).json({ error: 'Informe email (professor) ou usuario (aluno), e password' });
  }

  const emailFinal = usuario ? emailDoUsuario(usuario.toLowerCase()) : email;
  const { data, error } = await supabase.auth.signInWithPassword({ email: emailFinal, password });
  if (error) return res.status(401).json({ error: 'Credenciais inválidas' });

  const scopedClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
  const { data: profile, error: profileError } = await scopedClient
    .from('profiles')
    .select('nome, tipo, turma, usuario')
    .eq('id', data.user.id)
    .single();
  if (profileError) return res.status(400).json({ error: profileError.message });

  res.json({ access_token: data.session.access_token, user: { id: data.user.id, ...profile } });
});

export default router;
