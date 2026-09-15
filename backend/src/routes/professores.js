import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { SENHA_PADRAO } from '../lib/usuario.js';

const router = Router();

async function exigirDiretor(req, res) {
  const { data, error } = await req.supabase.from('profiles').select('tipo').eq('id', req.user.id).single();
  if (error || data.tipo !== 'diretor') {
    res.status(403).json({ error: 'Apenas a diretoria pode gerenciar professores' });
    return false;
  }
  return true;
}

router.get('/', requireAuth, async (req, res) => {
  if (!(await exigirDiretor(req, res))) return;
  const { data, error } = await req.supabase
    .from('profiles')
    .select('id, nome')
    .eq('tipo', 'professor')
    .order('nome', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });

  const { data: usuariosAuth, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) return res.status(400).json({ error: authError.message });
  const emailPorId = Object.fromEntries(usuariosAuth.users.map((u) => [u.id, u.email]));

  res.json(data.map((p) => ({ ...p, email: emailPorId[p.id] || null })));
});

router.post('/', requireAuth, async (req, res) => {
  if (!(await exigirDiretor(req, res))) return;

  const { nome, email } = req.body;
  if (!nome || !email) return res.status(400).json({ error: 'Campos obrigatórios: nome, email' });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: SENHA_PADRAO,
    email_confirm: true,
  });
  if (error) {
    if (error.message.includes('already been registered')) return res.status(400).json({ error: 'E-mail já cadastrado' });
    return res.status(400).json({ error: error.message });
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({ id: data.user.id, nome, tipo: 'professor', senha_temporaria: true });
  if (profileError) return res.status(400).json({ error: profileError.message });

  res.status(201).json({ id: data.user.id, nome, email, senhaPadrao: SENHA_PADRAO });
});

router.patch('/:id/resetar-senha', requireAuth, async (req, res) => {
  if (!(await exigirDiretor(req, res))) return;

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
    password: SENHA_PADRAO,
  });
  if (authError) return res.status(400).json({ error: authError.message });

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ senha_temporaria: true })
    .eq('id', req.params.id);
  if (profileError) return res.status(400).json({ error: profileError.message });

  res.json({ senhaPadrao: SENHA_PADRAO });
});

export default router;
