# Página de jogador + Transfermarkt + time.html temático

## 1. Página de jogador (novo: `jogador.html` + `jogador.js`)
Acessível clicando no jogador em: Artilharia, elenco do `time.html`
(público) e elenco do `meu-time.html` (área do técnico — sai da área
logada e abre a página pública). Mostra:
- Nome, número, posição, idade
- Time atual (com link pra página do time) ou "Sem time no momento"
- Estatísticas da temporada (gols, assistências, amarelos, vermelhos)
- **Histórico completo de transferências** — todas as vezes que o jogador
  mudou de time (tanto como comprado quanto como vendido depois), com
  origem → destino, valor e tipo (Definitivo/Empréstimo)

URL: `jogador.html?id=<id_do_jogador>`

## 2. Transfermarkt do campeonato (novo: `transfermarkt.html` + `transfermarkt.js`)
Diferente do BID (que só mostra transferências recentes), essa página
mostra o **elenco inteiro** de um time selecionado:
- Select de time no topo (igual o `bid.html`)
- Valor total do elenco (soma do valor de mercado de todos os jogadores)
- Lista completa do elenco com: número, nome, posição, idade, estatísticas
  da temporada, e **valor de mercado**
- Valor de mercado = valor da última transferência aceita do jogador (ou
  R$ 0 se ele nunca foi transferido no sistema)
- Cada jogador da lista também é clicável, levando pra página dele

Acessível pelo menu **☰** (junto com BID), e também tem um botão direto
"Ver Transfermarkt do time" na página de detalhe de cada time
(`time.html`), já filtrado nesse time.

## 3. time.html agora é temático (correção de um bug)
O `time.js` já chamava `aplicarTemaTime()`, mas faltava adicionar a classe
`tema-time` no `<body>` — por isso as cores do time apareciam parcialmente
(só variáveis CSS, sem os estilos extra de topbar/bottom-nav/botões que
dependem dessa classe). Corrigido: agora `time.html` fica visualmente
temático igual o `meu-time.html` já era.

## Arquivos novos
- `jogador.html`, `jogador.js`
- `transfermarkt.html`, `transfermarkt.js`

## Arquivos alterados
- `artilharia.js` — cada artilheiro agora é clicável
- `time.js` — elenco clicável + tema completo aplicado + botão pro Transfermarkt
- `meu-time.js` — elenco do técnico agora é clicável (sai pra página pública do jogador)
- `layout.js` — novo ícone e item "Transfermarkt" no menu ☰

## Nada de SQL novo
Tudo usa dados que já existem (`jogadores.idade`, `bid_transferencias`
com `valor_consultado`/`tipo_contratacao`/`status`, já criados nas rodadas
anteriores).
