# Aprende+

Plataforma web de reforço escolar em Língua Portuguesa e Matemática, com foco em acessibilidade, voltada a alunos do ensino fundamental com dificuldades de aprendizagem.

Desenvolvida para a **EMEF Conceição Aparecida Magalhães Silva** (Jacareí-SP), como Atividade Extensionista II — Tecnologia Aplicada à Inclusão Digital (CST em Análise e Desenvolvimento de Sistemas — UNINTER).

**Deploy:** [aprende-mais-brown.vercel.app](https://aprende-mais-brown.vercel.app)

---

## Sobre o projeto

O Aprende+ conecta professores e alunos em torno de exercícios de reforço direcionados, permitindo que a escola acompanhe de perto quais estudantes estão com dificuldade em Português ou Matemática e ofereça atividades específicas para cada um, com uma interface pensada para acessibilidade e facilidade de uso por crianças.

O sistema possui três papéis de acesso, cada um com seu próprio painel:

| Papel | O que pode fazer |
|---|---|
| **Aluno** | Responder exercícios (múltipla escolha e dissertativos) atribuídos a ele, ouvir o enunciado em voz alta, acompanhar seu progresso |
| **Professor** | Cadastrar alunos, criar exercícios com mídia (imagem/vídeo), atribuir exercícios a alunos específicos, revisar respostas dissertativas, acompanhar a evolução de cada aluno, resetar senha e excluir contas de alunos |
| **Diretor** | Cadastrar professores, visualizar e resetar senha de professores, buscar e resetar senha de alunos |

## Funcionalidades

- Autenticação por papel (aluno / professor / diretor), com troca obrigatória de senha no primeiro acesso
- Exercícios de múltipla escolha e dissertativos, com mídia de apoio (imagem ou vídeo) por questão
- Atribuição de exercícios a alunos específicos, com seleção por busca e por turma
- Leitura em voz alta do enunciado das questões (Web Speech API), para apoiar alunos com dificuldade de leitura
- Acompanhamento individual de desempenho e situação do aluno (pendente / em reforço / concluído)
- Revisão manual de respostas dissertativas pelo professor
- Gestão de contas (criação, reset de senha e exclusão) por professores e diretor
- Acessibilidade: aumento/diminuição do tamanho da fonte, alto contraste e rotulagem semântica (`aria-label`) nos elementos interativos

## Arquitetura e stack

```
frontend/   React (Vite) + React Router — SPA
backend/    Node.js + Express — API REST
            Supabase (PostgreSQL) — banco de dados, autenticação e Row Level Security
```

- **Frontend:** React 19, React Router, CSS Modules — hospedado na Vercel
- **Backend:** Node.js + Express, rodando como função serverless na Vercel
- **Banco de dados:** PostgreSQL via Supabase, com Row Level Security (RLS) controlando o acesso por papel diretamente no banco
- **Autenticação:** Supabase Auth (JWT), validado nas rotas via middleware `requireAuth`

## Modelo de dados

| Tabela | Descrição |
|---|---|
| `profiles` | Dados de aluno, professor ou diretor (nome, tipo, usuário/turma quando aplicável) |
| `exercicios` | Exercício criado por um professor (título, disciplina, série, mídia) |
| `exercicio_alunos` | Atribuição de um exercício a um aluno, com situação (pendente/em reforço/concluído) |
| `questoes` | Questões de um exercício (múltipla escolha ou dissertativa) |
| `alternativas` | Alternativas de uma questão de múltipla escolha |
| `respostas_aluno` | Respostas registradas pelo aluno para cada questão |

O script completo está em [`backend/supabase/schema.sql`](backend/supabase/schema.sql), incluindo as políticas de RLS de cada tabela.

## API

Principais rotas expostas pelo backend (todas exigem autenticação, exceto `/health`):

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Login (aluno por usuário, professor/diretor por e-mail) |
| `PATCH` | `/api/auth/senha` | Troca de senha (primeiro acesso ou voluntária) |
| `GET/POST` | `/api/exercicios` | Listar / criar exercícios |
| `GET/PUT/DELETE` | `/api/exercicios/:id` | Detalhar / editar / excluir um exercício |
| `POST` | `/api/exercicios/:id/respostas` | Aluno envia suas respostas |
| `GET` | `/api/exercicios/:id/resultados` | Resultados de um exercício |
| `GET/POST` | `/api/alunos` | Listar / cadastrar alunos |
| `GET` | `/api/alunos/buscar` | Buscar aluno por nome/usuário |
| `PATCH/DELETE` | `/api/alunos/:id` | Editar / excluir aluno |
| `PATCH` | `/api/alunos/:id/resetar-senha` | Resetar senha de um aluno |
| `GET/POST` | `/api/professores` | Listar / cadastrar professores (diretor) |
| `PATCH` | `/api/professores/:id/resetar-senha` | Resetar senha de um professor (diretor) |

## Como rodar localmente

Pré-requisitos: Node.js 18+ e um projeto no [Supabase](https://supabase.com).

### Backend

```bash
cd backend
cp .env.example .env   # preencher com as credenciais do seu projeto Supabase
npm install
npm run dev
```

Rode o script `backend/supabase/schema.sql` no editor SQL do Supabase para criar as tabelas e políticas de RLS.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Variáveis de ambiente

**`backend/.env`**
```
PORT=3001
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=sua-chave-publishable
SUPABASE_SECRET_KEY=sua-chave-secret
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:3001/api
```

## Deploy

Aplicação publicada na [Vercel](https://vercel.com), com `frontend/` e `backend/` como projetos independentes apontando para o mesmo repositório (cada um com seu próprio Root Directory). O backend roda como função serverless (`backend/api/index.js`); o roteamento de SPA do frontend é resolvido via `frontend/vercel.json`.

## Acesso para avaliação

Para fins de avaliação acadêmica, o ambiente de produção não contém dados reais da escola parceira — apenas contas de teste, sem dados pessoais de estudantes:

| Papel | Login | Senha |
|---|---|---|
| Diretor | `diretor.teste@gmail.com` | `aprende123` |
| Professor | `professor.teste@gmail.com` | `aprende123` |
| Aluno | `aluno.teste` | `aprende123` |

## Autor

Allan Henrique Pereira Brandão — CST em Análise e Desenvolvimento de Sistemas, UNINTER.
