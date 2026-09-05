import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.js';
import { emailDoUsuario } from '../lib/usuario.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, usuario, password } = req.body;
  if (!password || (!email && !usuario)) {
    return res.status(400).json({ error: 'Informe email (professor) ou usuario (aluno), e password' });
  }

  const emailFinal = usuario ? emailDoUsuario(usuario) : email;
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
