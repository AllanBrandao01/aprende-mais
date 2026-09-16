import { supabaseAdmin } from '../src/config/supabaseAdmin.js';

const DIRETOR = { email: 'diretor.teste@gmail.com', senha: 'aprende123', nome: 'Diretor Teste', tipo: 'diretor' };
const PROFESSOR = { email: 'professor.teste@gmail.com', senha: 'aprende123', nome: 'Professor Teste', tipo: 'professor' };
const ALUNO = {
  email: 'aluno.teste@aprendemais.local',
  senha: 'aprende123',
  nome: 'Aluno Teste',
  tipo: 'aluno',
  usuario: 'aluno.teste',
  turma: '5º ano',
};

await supabaseAdmin.from('exercicios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
console.log('exercícios (e questões/alternativas/respostas em cascata) removidos');

const { data: usuariosExistentes } = await supabaseAdmin.auth.admin.listUsers();
for (const u of usuariosExistentes.users) {
  await supabaseAdmin.auth.admin.deleteUser(u.id);
  console.log(`usuário removido: ${u.email}`);
}

async function criarUsuarioTeste({ email, senha, nome, tipo, usuario, turma }) {
  const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (error) throw new Error(`${email}: ${error.message}`);

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: criado.user.id,
    nome,
    tipo,
    usuario: usuario || null,
    turma: turma || null,
    senha_temporaria: false,
  });
  if (profileError) throw new Error(`${email}: ${profileError.message}`);
  console.log(`conta de teste criada: ${email} (${tipo})`);
}

await criarUsuarioTeste(DIRETOR);
await criarUsuarioTeste(PROFESSOR);
await criarUsuarioTeste(ALUNO);

console.log('reset concluído — apenas as 3 contas de teste acima existem no banco.');
