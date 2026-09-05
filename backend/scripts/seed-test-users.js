// Recria os usuários de teste (professor + aluno) após um reset do schema.sql,
// já que resetar a tabela profiles apaga os perfis mas não os usuários do Supabase Auth.
// Uso: node scripts/seed-test-users.js

import { supabaseAdmin } from '../src/config/supabaseAdmin.js';

const USUARIOS = [
  { email: 'professor.teste@gmail.com', senha: 'senha123456', nome: 'Professor Teste', tipo: 'professor', usuario: null, turma: null },
  { email: 'aluno.dois@aprendemais.local', senha: 'senha123456', nome: 'Aluno Dois', tipo: 'aluno', usuario: 'aluno.dois', turma: '5A' },
  { email: 'aluno.tres@aprendemais.local', senha: 'senha123456', nome: 'Aluno Três', tipo: 'aluno', usuario: 'aluno.tres', turma: '5A' },
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
