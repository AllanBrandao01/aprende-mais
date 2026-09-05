// Recria os usuários de teste (professor + aluno) após um reset do schema.sql,
// já que resetar a tabela profiles apaga os perfis mas não os usuários do Supabase Auth.
// Uso: node scripts/seed-test-users.js

import { supabaseAdmin } from '../src/config/supabaseAdmin.js';

const USUARIOS = [
  { email: 'professor.teste@gmail.com', senha: 'senha123456', nome: 'Professor Teste', tipo: 'professor', usuario: null, turma: null },
  { email: 'ana@aprendemais.local', senha: 'senha123456', nome: 'Ana Silva', tipo: 'aluno', usuario: 'ana', turma: '5A' },
  { email: 'bruno@aprendemais.local', senha: 'senha123456', nome: 'Bruno Souza', tipo: 'aluno', usuario: 'bruno', turma: '5A' },
  { email: 'carla@aprendemais.local', senha: 'senha123456', nome: 'Carla Lima', tipo: 'aluno', usuario: 'carla', turma: '5B' },
];

const { data } = await supabaseAdmin.auth.admin.listUsers();

for (const u of USUARIOS) {
  let usuarioAuth = data.users.find((x) => x.email === u.email);

  if (!usuarioAuth) {
    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.senha,
      email_confirm: true,
    });
    if (error) {
      console.log(`${u.email}: erro ao criar — ${error.message}`);
      continue;
    }
    usuarioAuth = criado.user;
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: usuarioAuth.id, nome: u.nome, tipo: u.tipo, usuario: u.usuario, turma: u.turma });

  console.log(`${u.email}: ${profileError ? 'erro — ' + profileError.message : 'ok'}`);
}
