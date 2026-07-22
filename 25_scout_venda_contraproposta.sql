-- =========================================================
-- 25_scout_venda_contraproposta.sql
-- Adiciona: (1) jogadores à venda, (2) contraproposta na
-- negociação (bônus, tipo, taxa de empréstimo).
-- Rode este arquivo no SQL Editor do Supabase.
-- =========================================================

-- ---------- 1) JOGADORES À VENDA ----------
-- Técnico marca um jogador do próprio elenco como disponível no
-- mercado, com um valor pedido. Fica visível pros outros técnicos
-- na aba BID > Scout.
create table if not exists jogadores_a_venda (
  id uuid primary key default gen_random_uuid(),
  jogador_id uuid not null references jogadores(id) on delete cascade,
  time_id uuid not null references times(id) on delete cascade,
  valor_pedido numeric not null,
  aceita_emprestimo boolean not null default true,
  observacao text,
  criado_em timestamptz not null default now(),
  removido_em timestamptz, -- null = ainda está à venda
  removido_motivo text     -- 'vendido' | 'retirado' | null
);

create index if not exists idx_jogadores_a_venda_time on jogadores_a_venda(time_id);
create index if not exists idx_jogadores_a_venda_jogador on jogadores_a_venda(jogador_id);

-- Só pode haver UM anúncio ativo (removido_em is null) por jogador de
-- cada vez — evita duplicar o mesmo jogador na lista de à venda.
create unique index if not exists uniq_jogador_a_venda_ativo
  on jogadores_a_venda(jogador_id)
  where removido_em is null;

alter table jogadores_a_venda enable row level security;

-- Leitura pública para técnicos autenticados (qualquer técnico logado
-- pode ver a lista de jogadores à venda de qualquer clube)
drop policy if exists "jogadores_a_venda_select_autenticado" on jogadores_a_venda;
create policy "jogadores_a_venda_select_autenticado"
  on jogadores_a_venda for select
  to authenticated
  using (true);

-- Escrita apenas pelo técnico dono do time (ajuste o nome da tabela/
-- coluna de vínculo técnico->time se for diferente na sua base;
-- aqui assumindo uma tabela "tecnicos" com user_id e time_id, igual
-- ao padrão já usado no resto do projeto).
drop policy if exists "jogadores_a_venda_insert_tecnico_dono" on jogadores_a_venda;
create policy "jogadores_a_venda_insert_tecnico_dono"
  on jogadores_a_venda for insert
  to authenticated
  with check (
    exists (
      select 1 from tecnicos t
      where t.user_id = auth.uid() and t.time_id = jogadores_a_venda.time_id
    )
  );

drop policy if exists "jogadores_a_venda_update_tecnico_dono" on jogadores_a_venda;
create policy "jogadores_a_venda_update_tecnico_dono"
  on jogadores_a_venda for update
  to authenticated
  using (
    exists (
      select 1 from tecnicos t
      where t.user_id = auth.uid() and t.time_id = jogadores_a_venda.time_id
    )
  );

-- ---------- 2) CONTRAPROPOSTA NA NEGOCIAÇÃO ----------
-- Estende bid_transferencias pra suportar bônus, tipo de empréstimo
-- com taxa/opção de compra, e um histórico simples de quem fez a
-- última proposta (pra saber de quem é a vez de responder).
alter table bid_transferencias
  add column if not exists bonus_valor numeric,               -- valor de bônus (ex: por metas, gols, etc)
  add column if not exists bonus_condicao text,                -- descrição livre da condição do bônus
  add column if not exists taxa_emprestimo_percentual numeric, -- % do salário/valor pago pelo time interessado no empréstimo
  add column if not exists opcao_compra boolean default false, -- se o empréstimo tem opção de compra ao final
  add column if not exists opcao_compra_valor numeric,         -- valor da opção de compra, se houver
  add column if not exists proposta_de text,                   -- 'dono' | 'interessado' — quem fez a proposta vigente
  add column if not exists rodada_contraproposta int default 0; -- contador de idas e vindas, só pra exibir "Proposta 2", "Proposta 3"...

-- Se o status tiver um CHECK fixo de valores permitidos, confirme que
-- 'negociando' já é aceito (deveria estar, já que veio da migração
-- 24_regularizacao_bid.sql). Rode a consulta abaixo pra conferir:
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'bid_transferencias'::regclass and contype = 'c';
