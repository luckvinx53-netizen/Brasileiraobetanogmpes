-- =========================================================
-- 26_indice_noticias_fim_de_jogo.sql
-- OPCIONAL. Não é obrigatório para a funcionalidade funcionar — as
-- notícias automáticas de fim de jogo são geradas 100% no front-end
-- (partida-noticias.js), lendo a tabela "jogos" que já existe.
--
-- Esse arquivo só acelera a consulta que a aba Notícias faz sempre que
-- carrega (filtra por status = 'Encerrado' e ordena por data_jogo).
-- Rode no SQL Editor do Supabase se quiser o ganho de performance.
-- =========================================================

create index if not exists idx_jogos_status_data
  on jogos(status, data_jogo desc);
