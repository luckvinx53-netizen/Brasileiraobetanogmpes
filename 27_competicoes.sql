-- =========================================================
-- 27_competicoes.sql
-- Adiciona suporte a múltiplas competições rodando ao mesmo tempo
-- (Brasileirão, Sul-Americana, Libertadores, Copa do Brasil), cada
-- uma com seu próprio tema de cor e suas próprias temporadas/times/jogos.
--
-- Rode no SQL Editor do Supabase, uma vez, nesta ordem.
-- =========================================================

-- 1) Tabela de competições -------------------------------------------------
create table if not exists competicoes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- ex: 'brasileirao', 'libertadores'
  nome text not null,                  -- ex: 'Brasileirão Betano'
  nome_curto text not null,            -- ex: 'Brasileirão'
  cor_primaria text not null,          -- ex: '#3ddc84'
  cor_secundaria text not null,        -- ex: '#12161d'
  logo_emoji text default '🏆',        -- emoji/ícone simples pro seletor
  ordem int not null default 0,        -- ordem de exibição no seletor
  ativa boolean not null default true, -- permite "desligar" uma competição sem apagar
  criado_em timestamptz not null default now()
);

alter table competicoes enable row level security;

drop policy if exists "competicoes_leitura_publica" on competicoes;
create policy "competicoes_leitura_publica"
  on competicoes for select
  using (true);

drop policy if exists "competicoes_escrita_admin" on competicoes;
create policy "competicoes_escrita_admin"
  on competicoes for all
  using (exists (select 1 from admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from admins a where a.user_id = auth.uid()));

-- 2) Liga temporadas -> competição -----------------------------------------
alter table temporadas
  add column if not exists competicao_id uuid references competicoes(id);

-- 3) Seed das 4 competições --------------------------------------------------
insert into competicoes (slug, nome, nome_curto, cor_primaria, cor_secundaria, logo_emoji, ordem)
values
  ('brasileirao',  'Brasileirão Betano',        'Brasileirão',  '#3ddc84', '#12161d', '🏆', 1),
  ('libertadores', 'CONMEBOL Libertadores',     'Libertadores', '#e8b74d', '#0a0d12', '🌎', 2),
  ('sula',         'CONMEBOL Sul-Americana',    'Sul-Americana','#f2971d', '#0a0d12', '🥈', 3),
  ('copa-do-brasil','Copa do Brasil',           'Copa do Brasil','#e5484d', '#12161d', '🇧🇷', 4)
on conflict (slug) do nothing;

-- 4) Vincula a temporada ativa atual (e todas as existentes, por segurança)
--    ao Brasileirão, já que é a única competição com dados reais até agora.
update temporadas
set competicao_id = (select id from competicoes where slug = 'brasileirao')
where competicao_id is null;

-- 5) Cria uma temporada "ativa" vazia para cada competição nova que ainda
--    não tenha nenhuma temporada. Sem isso, ao trocar o seletor para
--    Libertadores/Sul-Americana/Copa do Brasil o admin veria "Nenhuma
--    temporada ativa encontrada" — como as 4 competições devem rodar ao
--    mesmo tempo desde já, cada uma precisa da sua própria temporada
--    pronta para receber times/jogos no admin.
--
--    ATENÇÃO — rode este passo com cuidado:
--    O arquivo 01_schema.sql original (que criou a tabela "temporadas")
--    não estava disponível ao gerar esta migração, então os nomes exatos
--    das colunas obrigatórias (além de id/ativa/competicao_id) podem ser
--    diferentes de "nome"/"ano" abaixo. Antes de rodar, confira no
--    Supabase (Table Editor > temporadas) quais colunas existem e são
--    NOT NULL, e ajuste a lista de colunas/valores no INSERT conforme
--    necessário. Se preferir o caminho mais seguro, comente este bloco
--    e crie as temporadas das outras 3 competições manualmente pela
--    própria interface que você já usa hoje para gerenciar temporadas.
insert into temporadas (nome, ano, ativa, competicao_id)
select '2026', 2026, true, c.id
from competicoes c
where not exists (
  select 1 from temporadas t where t.competicao_id = c.id
);
