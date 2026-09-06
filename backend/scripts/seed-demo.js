// Monta um ambiente de demonstração limpo: reseta usuários/exercícios de teste
// e cria 3 alunos + exercícios de múltipla escolha já atribuídos a eles.
// Uso: node scripts/seed-demo.js

import { supabaseAdmin } from '../src/config/supabaseAdmin.js';

const DIRETOR = { email: 'diretor.teste@gmail.com', senha: 'aprende123', nome: 'Diretor Teste', senhaTemporaria: true };
const PROFESSOR = { email: 'professor.teste@gmail.com', senha: 'senha123456', nome: 'Professor Teste' };
const ALUNOS = [
  { email: 'ana@aprendemais.local', senha: 'senha123456', nome: 'Ana Silva', usuario: 'ana', turma: '5A', senhaTemporaria: true },
  { email: 'bruno@aprendemais.local', senha: 'senha123456', nome: 'Bruno Souza', usuario: 'bruno', turma: '5A', senhaTemporaria: true },
  { email: 'carla@aprendemais.local', senha: 'senha123456', nome: 'Carla Lima', usuario: 'carla', turma: '5B', senhaTemporaria: true },
];
const EMAILS_DESCARTAR = ['aluno.dois@aprendemais.local', 'aluno.tres@aprendemais.local'];

const { data: usuariosExistentes } = await supabaseAdmin.auth.admin.listUsers();

for (const email of EMAILS_DESCARTAR) {
  const u = usuariosExistentes.users.find((x) => x.email === email);
  if (u) {
    await supabaseAdmin.auth.admin.deleteUser(u.id);
    console.log(`removido usuário de teste antigo: ${email}`);
  }
}

await supabaseAdmin.from('exercicios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
console.log('exercícios antigos removidos');

async function garantirUsuario({ email, senha, nome, tipo, usuario, turma, senhaTemporaria }) {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  let usuarioAuth = data.users.find((x) => x.email === email);
  if (!usuarioAuth) {
    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({ email, password: senha, email_confirm: true });
    if (error) throw new Error(`${email}: ${error.message}`);
    usuarioAuth = criado.user;
  }
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: usuarioAuth.id,
    nome,
    tipo,
    usuario: usuario || null,
    turma: turma || null,
    senha_temporaria: !!senhaTemporaria,
  });
  if (profileError) throw new Error(`${email}: ${profileError.message}`);
  console.log(`${email}: ok`);
  return usuarioAuth.id;
}

await garantirUsuario({ ...DIRETOR, tipo: 'diretor' });
const professorId = await garantirUsuario({ ...PROFESSOR, tipo: 'professor' });
const alunoIds = {};
for (const aluno of ALUNOS) {
  alunoIds[aluno.usuario] = await garantirUsuario({ ...aluno, tipo: 'aluno' });
}

async function criarExercicio({ titulo, disciplina, serie, alunos, questoes }) {
  const { data: exercicio, error } = await supabaseAdmin
    .from('exercicios')
    .insert({ titulo, disciplina, serie, criado_por: professorId })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabaseAdmin
    .from('exercicio_alunos')
    .insert(alunos.map((usuario) => ({ exercicio_id: exercicio.id, aluno_id: alunoIds[usuario] })));

  for (const [ordem, q] of questoes.entries()) {
    const { data: questao, error: qErro } = await supabaseAdmin
      .from('questoes')
      .insert({ exercicio_id: exercicio.id, enunciado: q.enunciado, tipo: 'multipla_escolha', ordem })
      .select()
      .single();
    if (qErro) throw new Error(qErro.message);

    await supabaseAdmin
      .from('alternativas')
      .insert(q.alternativas.map((a) => ({ questao_id: questao.id, texto: a.texto, correta: a.correta })));
  }
  console.log(`exercício "${titulo}" criado, atribuído a: ${alunos.join(', ')}`);
}

await criarExercicio({
  titulo: 'Interpretação de texto — O Cachorro',
  disciplina: 'portugues',
  serie: '5º ano',
  alunos: ['ana', 'bruno', 'carla'],
  questoes: [
    {
      enunciado: 'Na frase "O cachorro correu atrás da bola", qual é o sujeito?',
      alternativas: [
        { texto: 'O cachorro', correta: true },
        { texto: 'A bola', correta: false },
        { texto: 'Correu', correta: false },
      ],
    },
    {
      enunciado: 'Qual palavra é um substantivo na frase acima?',
      alternativas: [
        { texto: 'Correu', correta: false },
        { texto: 'Bola', correta: true },
        { texto: 'Atrás', correta: false },
      ],
    },
  ],
});

await criarExercicio({
  titulo: 'Tabuada do 5',
  disciplina: 'matematica',
  serie: '5º ano',
  alunos: ['ana', 'bruno'],
  questoes: [
    {
      enunciado: 'Quanto é 5 x 4?',
      alternativas: [
        { texto: '20', correta: true },
        { texto: '15', correta: false },
        { texto: '25', correta: false },
      ],
    },
    {
      enunciado: 'Quanto é 5 x 7?',
      alternativas: [
        { texto: '30', correta: false },
        { texto: '35', correta: true },
        { texto: '40', correta: false },
      ],
    },
  ],
});

await criarExercicio({
  titulo: 'Plural das palavras',
  disciplina: 'portugues',
  serie: '5º ano',
  alunos: ['carla'],
  questoes: [
    {
      enunciado: 'Qual é o plural de "papel"?',
      alternativas: [
        { texto: 'Papeles', correta: false },
        { texto: 'Papéis', correta: true },
        { texto: 'Papels', correta: false },
      ],
    },
  ],
});

console.log('demo pronta!');
