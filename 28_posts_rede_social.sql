-- =========================================================
-- 28_posts_rede_social.sql
-- Tabela dos posts da "rede social do campeonato": matchday,
-- escalação, fim de jogo e nota oficial, publicados no perfil
-- oficial de cada clube (ou da CBF, no caso de nota oficial).
--
-- Rode no SQL Editor do Supabase, depois de já ter rodado
-- 27_competicoes.sql.
-- =========================================================

create table if not exists posts_rede_social (
  id uuid primary key default gen_random_uuid(),

  -- Cada post pertence a uma competição/temporada, pra filtrar certinho
  -- quando o usuário troca o seletor de campeonato no topbar.
  competicao_id uuid references competicoes(id),
  temporada_id uuid references temporadas(id),

  -- Perfil "dono" do post. time_id fica NULL só no caso de nota oficial
  -- da CBF (que não é o perfil de nenhum clube).
  time_id uuid references times(id),
  eh_perfil_cbf boolean not null default false,

  -- Jogo relacionado (matchday, escalação, fim de jogo). NULL em nota oficial.
  jogo_id uuid references jogos(id),

  tipo text not null check (tipo in ('matchday', 'escalacao', 'fim_de_jogo', 'nota_oficial')),

  titulo text not null,
  corpo text,

  -- A "arte" do post: SVG completo (string), pra renderizar direto no
  -- feed sem precisar de nenhum serviço externo de geração de imagem.
  -- NULL em posts que são só texto (ex: nota oficial simples).
  imagem_svg text,

  -- Quem postou a nota oficial (admin da CBF). NULL nos posts automáticos.
  publicado_por uuid references auth.users(id),

  criado_em timestamptz not null default now()
);

create index if not exists idx_posts_rede_social_temporada
  on posts_rede_social(temporada_id, criado_em desc);

create index if not exists idx_posts_rede_social_time
  on posts_rede_social(time_id, criado_em desc);

-- Evita duplicar o mesmo post automático (ex: 2 abas abertas geram o
-- "post de escalação" do mesmo jogo/time duas vezes). Nota oficial não
-- entra nessa regra (tipo distinto, sem jogo_id).
create unique index if not exists idx_posts_rede_social_unico_automatico
  on posts_rede_social(jogo_id, time_id, tipo)
  where tipo in ('matchday', 'escalacao', 'fim_de_jogo');

alter table posts_rede_social enable row level security;

drop policy if exists "posts_rede_social_leitura_publica" on posts_rede_social;
create policy "posts_rede_social_leitura_publica"
  on posts_rede_social for select
  using (true);

-- Escrita liberada pra qualquer visitante logado (os posts automáticos
-- de matchday/escalação/fim-de-jogo são criados pelo client de QUALQUER
-- pessoa que esteja com o site aberto no momento certo — não só admin,
-- do mesmo jeito que checarEncerramentoAutomatico() já funciona hoje em
-- utils.js). Nota oficial fica restrita a admin dentro do próprio
-- admin.html (checagem feita em JS, não aqui, pra não duplicar a lógica
-- de "é admin" que já existe no projeto).
drop policy if exists "posts_rede_social_escrita_publica" on posts_rede_social;
create policy "posts_rede_social_escrita_publica"
  on posts_rede_social for insert
  with check (true);

-- =========================================================
-- BUCKET DE STORAGE para as artes (PNG) geradas automaticamente.
-- Mesmo padrão do bucket "capas-noticias" que você já usa hoje.
-- Se preferir, crie manualmente pela interface do Supabase
-- (Storage > New bucket > nome "posts-rede-social", marcado como
-- Public), em vez de rodar o insert abaixo.
-- =========================================================

insert into storage.buckets (id, name, public)
values ('posts-rede-social', 'posts-rede-social', true)
on conflict (id) do nothing;

drop policy if exists "posts_rede_social_storage_leitura" on storage.objects;
create policy "posts_rede_social_storage_leitura"
  on storage.objects for select
  using (bucket_id = 'posts-rede-social');

drop policy if exists "posts_rede_social_storage_upload" on storage.objects;
create policy "posts_rede_social_storage_upload"
  on storage.objects for insert
  with check (bucket_id = 'posts-rede-social');
