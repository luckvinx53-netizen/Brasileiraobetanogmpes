-- =========================================================
-- 29_copa_do_brasil_matamata.sql
--
-- IMPORTANTE: o schema principal do mata-mata (tabela
-- confrontos_mata_mata e as colunas fase/grupo_id/confronto_id/perna
-- em jogos) JÁ FOI CRIADO diretamente no banco de produção (via
-- Claude Code) e por isso não está neste arquivo — rodar um "create
-- table" duplicado aqui quebraria tudo.
--
-- Este arquivo documenta o schema real (pra referência) e contém
-- APENAS a migration que faltava: suporte a pênaltis, que já foi
-- aplicada em produção em 2026-08-10 (migration "copa_do_brasil_penaltis").
-- Se você estiver montando um banco do zero (novo ambiente), rode as
-- duas partes abaixo, na ordem.
-- =========================================================

-- 1) Schema já existente em produção (documentação — NÃO precisa
--    rodar se você está no banco atual, já está criado):
--
-- create table confrontos_mata_mata (
--   id uuid primary key default gen_random_uuid(),
--   competicao_id uuid not null references competicoes(id),
--   temporada_id uuid not null references temporadas(id),
--   fase text not null check (fase in ('oitavas','quartas','semifinal','final')),
--   ordem int not null default 0,
--   time_a_id uuid references times(id),
--   time_b_id uuid references times(id),
--   agregado_a int,
--   agregado_b int,
--   situacao text not null default 'aguardando'
--     check (situacao in ('aguardando','em_andamento','penaltis','definido')),
--   vencedor_id uuid references times(id),
--   criado_em timestamptz not null default now()
-- );
--
-- alter table jogos add column fase text
--   check (fase in ('grupos','oitavas','quartas','semifinal','final'));
-- alter table jogos add column grupo_id uuid references grupos(id);
-- alter table jogos add column confronto_id uuid references confrontos_mata_mata(id) on delete set null;
-- alter table jogos add column perna text check (perna is null or perna in ('ida','volta','unica'));

-- 2) Migration aplicada em 2026-08-10 (suporte a pênaltis) --------------
alter table confrontos_mata_mata
  add column if not exists foi_penaltis boolean not null default false;
alter table confrontos_mata_mata
  add column if not exists penaltis_a int;
alter table confrontos_mata_mata
  add column if not exists penaltis_b int;

alter table jogos
  add column if not exists penaltis_casa int;
alter table jogos
  add column if not exists penaltis_fora int;
