# BID — filtro por time no admin + página pública para fãs

## O que foi feito

### 1. Menu "☰" na topbar (novo)
Como a bottom-nav já tinha 6 itens fixos (Início, Jogos, Tabela, Times,
Artilharia, Notícias), criei um botão de menu (3 tracinhos) no canto da
topbar. Ao tocar, abre um pequeno painel com páginas secundárias — por
enquanto só o **BID**. Dá pra adicionar mais itens depois só editando a
lista `MENU_EXTRA_ITEMS` no topo do `layout.js`.

### 2. Aba BID do admin — filtro por time
Na aba **BID > Solicitações de regularização**, agora tem um select "Time"
no topo. Com "Todos os times" selecionado, funciona como antes (mostra
tudo). Selecionando um time específico, a lista mostra só as solicitações
daquele time.

### 3. Nova página pública `bid.html` (para os fãs)
Página sem necessidade de login. A pessoa escolhe um time num select e vê
todas as **transferências já confirmadas** (status `aceito`) envolvendo
aquele time — tanto como comprador quanto como vendedor. Cada item mostra:
- Nome do jogador
- Origem → destino (nome dos dois times)
- Valor da transferência
- Tipo (Definitivo/Empréstimo)
- Data/hora da confirmação

## Arquivos novos
- `bid.html` — página pública
- `bid-publico.js` — lógica da página pública

## Arquivos alterados
- `layout.js` — botão de menu (☰) e painel dropdown na topbar
- `utils.js` — `marcarNavAtiva()` agora também destaca o botão de menu quando
  a página atual é uma das do menu extra
- `style.css` — estilos do botão de menu e do painel dropdown
- `admin.html` — select de filtro por time na aba BID
- `admin.js` — chama `popularFiltroTimeSolicitacoesBid()` ao abrir a aba BID
- `bid-admin.js` — nova função `popularFiltroTimeSolicitacoesBid()` e
  `carregarSolicitacoesBidAdmin()` agora filtra por time quando selecionado

## Nada de SQL novo
Essas mudanças não mexem no banco — usam só colunas que já existem
(incluindo as criadas na rodada anterior: `tipo_contratacao`,
`valor_consultado`, `respondido_em`). Se você já rodou o
`24_regularizacao_bid.sql` da vez passada, não precisa rodar nada a mais
agora.

## Atenção ao subir
Os arquivos `admin.html`, `admin.js` e `bid-admin.js` enviados aqui já
incluem tanto o filtro por time (desta rodada) quanto as mudanças de
regularização automática (da rodada anterior) — suba estas versões no lugar
das anteriores, não acumule as duas.
