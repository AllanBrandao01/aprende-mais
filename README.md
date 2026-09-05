# Reforço Escolar — Atividade Extensionista II

Plataforma web de reforço em Língua Portuguesa e Matemática, com acessibilidade, para alunos do ensino fundamental com dificuldades de aprendizado.

Projeto desenvolvido para a EMEF Conceição Aparecida Magalhães Silva (Jacareí-SP), como parte da disciplina Atividade Extensionista II — Tecnologia Aplicada à Inclusão Digital (CST em Análise e Desenvolvimento de Sistemas — UNINTER).

## Stack

- **Back-end:** Node.js + Express
- **Front-end:** React (Vite)
- **Banco de dados:** Supabase (PostgreSQL)

## Estrutura

```
backend/    API REST em Express, integrada ao Supabase
frontend/   Aplicação React (Vite)
docs/       Documentos e diagramas do projeto
```

## Como rodar

### Back-end

```
cd backend
cp .env.example .env   # preencher com as credenciais do Supabase
npm install
npm run dev
```

### Front-end

```
cd frontend
npm install
npm run dev
```
