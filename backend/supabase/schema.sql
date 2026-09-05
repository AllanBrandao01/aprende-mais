-- Aprende+ — schema do banco (Supabase / PostgreSQL)
-- Rode em: SQL Editor > New query > Run. Reexecutável — remove e recria tudo.

drop view if exists public.resultados;
drop function if exists public.pode_ver_exercicio(uuid) cascade;
drop function if exists public.is_professor() cascade;
drop table if exists public.exercicio_alunos cascade;
drop table if exists public.respostas_aluno cascade;
drop table if exists public.alternativas cascade;
drop table if exists public.questoes cascade;
drop table if exists public.exercicios cascade;
drop table if exists public.profiles cascade;
drop type if exists public.tipo_questao;
drop type if exists public.disciplina;
drop type if exists public.tipo_usuario;
drop type if exists public.tipo_midia;
drop type if exists public.situacao_aluno;

create type public.tipo_usuario as enum ('aluno', 'professor');
create type public.disciplina as enum ('portugues', 'matematica');
create type public.tipo_questao as enum ('multipla_escolha', 'verdadeiro_falso');
create type public.tipo_midia as enum ('imagem', 'video');
create type public.situacao_aluno as enum ('em_reforco', 'apto_saida');

-- estende o auth.users do Supabase com os dados do app
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  tipo public.tipo_usuario not null,
  turma text,
  usuario text unique,
  situacao public.situacao_aluno not null default 'em_reforco',
  created_at timestamptz not null default now()
);

create table public.exercicios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  disciplina public.disciplina not null,
  serie text,
  criado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

-- vínculo entre exercício e os alunos para quem ele foi atribuído
create table public.exercicio_alunos (
  id uuid primary key default gen_random_uuid(),
  exercicio_id uuid not null references public.exercicios (id) on delete cascade,
  aluno_id uuid not null references public.profiles (id) on delete cascade,
  unique (exercicio_id, aluno_id)
);

create table public.questoes (
  id uuid primary key default gen_random_uuid(),
  exercicio_id uuid not null references public.exercicios (id) on delete cascade,
  enunciado text not null,
  tipo public.tipo_questao not null default 'multipla_escolha',
  ordem int not null default 0,
  midia_url text,
  midia_tipo public.tipo_midia
);

create table public.alternativas (
  id uuid primary key default gen_random_uuid(),
  questao_id uuid not null references public.questoes (id) on delete cascade,
  texto text not null,
  correta boolean not null default false
);

create table public.respostas_aluno (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.profiles (id) on delete cascade,
  questao_id uuid not null references public.questoes (id) on delete cascade,
  alternativa_id uuid not null references public.alternativas (id),
  correta boolean not null,
  respondido_em timestamptz not null default now(),
  unique (aluno_id, questao_id)
);

-- desempenho agregado por aluno/exercício, usado no dashboard do professor
-- security_invoker: a view roda com o privilégio de quem consulta, então o RLS
-- de respostas_aluno se aplica normalmente (aluno só vê o próprio resultado)
create view public.resultados
with (security_invoker = true)
as
select
  ra.aluno_id,
  p.nome as aluno_nome,
  p.turma as aluno_turma,
  q.exercicio_id,
  e.titulo as exercicio_titulo,
  e.created_at as exercicio_criado_em,
  count(*) filter (where ra.correta) as acertos,
  count(*) as total_respondidas,
  round(100.0 * count(*) filter (where ra.correta) / count(*), 1) as percentual
from public.respostas_aluno ra
join public.questoes q on q.id = ra.questao_id
join public.exercicios e on e.id = q.exercicio_id
join public.profiles p on p.id = ra.aluno_id
group by ra.aluno_id, p.nome, p.turma, q.exercicio_id, e.titulo, e.created_at;

-- necessário porque "Automatically expose new tables" está desativado no projeto:
-- sem isso, nem o service_role tem acesso à tabela (o RLS é uma camada por cima disso).
grant usage on schema public to authenticated, service_role;
grant all on public.profiles, public.exercicios, public.exercicio_alunos, public.questoes, public.alternativas, public.respostas_aluno to service_role;
grant select, insert, update, delete on public.profiles, public.exercicios, public.exercicio_alunos, public.questoes, public.alternativas, public.respostas_aluno to authenticated;
grant select on public.resultados to authenticated, service_role;

-- security definer: roda com privilégio elevado, então consultar profiles aqui
-- dentro não reaciona o RLS de profiles (evita recursão infinita na policy).
create function public.is_professor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and tipo = 'professor');
$$;

-- professor vê tudo; aluno só vê exercícios atribuídos a ele especificamente
create function public.pode_ver_exercicio(ex_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_professor() or exists (
    select 1 from public.exercicio_alunos ea where ea.exercicio_id = ex_id and ea.aluno_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.exercicios enable row level security;
alter table public.exercicio_alunos enable row level security;
alter table public.questoes enable row level security;
alter table public.alternativas enable row level security;
alter table public.respostas_aluno enable row level security;

create policy "profiles_select_own_or_professor" on public.profiles
  for select using (auth.uid() = id or public.is_professor());
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
-- só o professor edita perfis (inclui a situação de reforço do aluno) — o
-- aluno não tem tela de editar o próprio perfil hoje, então não precisa disso.
create policy "profiles_update_professor" on public.profiles
  for update using (public.is_professor());

create policy "exercicios_select" on public.exercicios
  for select using (public.pode_ver_exercicio(id));
create policy "exercicios_insert_professor" on public.exercicios
  for insert with check (public.is_professor());
create policy "exercicios_update_own" on public.exercicios
  for update using (criado_por = auth.uid());
create policy "exercicios_delete_own" on public.exercicios
  for delete using (criado_por = auth.uid());

create policy "exercicio_alunos_select" on public.exercicio_alunos
  for select using (aluno_id = auth.uid() or public.is_professor());
create policy "exercicio_alunos_insert_professor" on public.exercicio_alunos
  for insert with check (
    exists (select 1 from public.exercicios e where e.id = exercicio_id and e.criado_por = auth.uid())
  );
create policy "exercicio_alunos_delete_professor" on public.exercicio_alunos
  for delete using (
    exists (select 1 from public.exercicios e where e.id = exercicio_id and e.criado_por = auth.uid())
  );

create policy "questoes_select" on public.questoes
  for select using (public.pode_ver_exercicio(exercicio_id));
create policy "questoes_write_owner" on public.questoes
  for all using (
    exists (select 1 from public.exercicios e where e.id = exercicio_id and e.criado_por = auth.uid())
  );

create policy "alternativas_select" on public.alternativas
  for select using (
    exists (select 1 from public.questoes q where q.id = questao_id and public.pode_ver_exercicio(q.exercicio_id))
  );
create policy "alternativas_write_owner" on public.alternativas
  for all using (
    exists (
      select 1 from public.questoes q
      join public.exercicios e on e.id = q.exercicio_id
      where q.id = questao_id and e.criado_por = auth.uid()
    )
  );

create policy "respostas_select_own_or_professor" on public.respostas_aluno
  for select using (aluno_id = auth.uid() or public.is_professor());
create policy "respostas_insert_own" on public.respostas_aluno
  for insert with check (aluno_id = auth.uid());
create policy "respostas_update_own" on public.respostas_aluno
  for update using (aluno_id = auth.uid());
