# Fim automático removido + badge "Em andamento"

## O que mudou

**1. Badge "6' AO VIVO" / "5'" → "Em andamento" / "AO VIVO"**

Nos cards de jogo (Início, Jogos) e na tela de detalhe do jogo, o
número do minuto ao vivo não aparece mais no badge de status:
- Card de lista (`jogoCardHtml`, em `utils.js`): mostrava `5'`, agora
  mostra `Em andamento`.
- Tela de detalhe do jogo (`jogo.js`): mostrava `6' AO VIVO`, agora
  mostra só `AO VIVO` (mantendo a bolinha vermelha pulsante).

**2. Jogo não encerra mais sozinho aos 90'**

Antes, `checarEncerramentoAutomatico()` (chamada em toda tela que
carrega jogos: Início, Jogos, Meu Time, detalhe do jogo) checava se o
relógio da simulação (18 min reais = 90' do jogo) já tinha passado de
90' e, se sim, encerrava o jogo sozinho: calculava o placar, somava na
tabela, atualizava estatísticas, fechava mata-mata e gerava o post de
fim de jogo.

Agora essa função **não encerra mais nada** — só continua existindo
para o backfill do post de "Fim de jogo" em jogos que já estavam
Encerrados antes dessa mudança (não perde nenhum post retroativo).

**O único jeito de um jogo virar "Encerrado" agora é o admin clicar em
"Encerrar jogo"** (`encerrarJogoManualmente`, aba Jogos do admin) — que
já existia e já fazia certo (placar pelos eventos, tabela, mata-mata,
estatísticas). Só faltava nele o post automático de fim de jogo na
rede social, que foi adicionado agora.

## Comportamento resultante

- O relógio da simulação (`minutoAtualDoJogo`) trava em 90' e não
  passa disso — então um jogo "esquecido" fica com o badge "Em
  andamento" indefinidamente, com o placar ao vivo parado no resultado
  calculado a partir de todos os gols lançados (já que todos têm
  minuto ≤ 90).
- O placar ao vivo continua subindo normalmente conforme o admin
  lança eventos de Gol/Gol Contra/Pênalti Marcado, exatamente como já
  funcionava — a única mudança é que ele não vira "Encerrado" sozinho
  no final.
- Na lista de jogos do admin, o aviso "⏱️ já passou dos 90', pronto
  para encerrar" continua aparecendo (não fazia o encerramento
  sozinho, só avisava) — agora fica ainda mais importante como lembrete
  pro admin.

## Arquivos alterados

- `utils.js` — `jogoCardHtml()` não mostra mais o minuto no badge;
  `checarEncerramentoAutomatico()` não encerra mais sozinha (mantido
  só o backfill de post para jogos já encerrados).
- `jogo.js` — badge da tela de detalhe sem o minuto; comentário
  atualizado.
- `admin.js` — `encerrarJogoManualmente()` agora busca `time_casa`/
  `time_fora` completos (join, necessário pra montar a arte do post) e
  dispara o post de "Fim de jogo" ao encerrar.

## O que não mudou

- `descomputarJogo`/`descomputarJogoAtual` (desfazer um encerramento)
  seguem iguais — continuam sendo o complemento natural do botão
  "Encerrar jogo".
- A Final da Copa do Brasil (`final-copa-brasil.js`/`final-copa-brasil-admin.js`)
  já era 100% manual antes disso — não foi tocada.
- Nenhuma mudança de banco — `eventos_jogo.minuto`, `jogos.status`,
  `jogos.computado` continuam com o mesmo formato de sempre.
