# Scout, jogador à venda e contraproposta — o que foi adicionado

## 1) Rodar no Supabase (SQL Editor)

Rode `25_scout_venda_contraproposta.sql` **antes** de subir os arquivos novos.
Ele cria:

- `jogadores_a_venda` — jogadores que um técnico colocou no mercado.
- Colunas novas em `bid_transferencias`: `bonus_valor`, `bonus_condicao`,
  `taxa_emprestimo_percentual`, `opcao_compra`, `opcao_compra_valor`,
  `proposta_de`, `rodada_contraproposta`.

⚠️ **Atenção RLS**: o SQL assume uma tabela `tecnicos(user_id, time_id)`
pra saber qual técnico é dono de qual time — é o mesmo padrão usado no
resto do projeto. Se o nome real dessa tabela for outro na sua base,
ajuste as duas policies de `insert`/`update` de `jogadores_a_venda` antes
de rodar.

## 2) Nova sub-aba: BID > Scout

Local: `Meu Time > BID > Scout` (ao lado de Regularização, Transferências
e Negociações).

**Relatório de scout**: escolha um time do Brasileirão e um jogador do
elenco dele. O sistema gera automaticamente:

- Nota de 0 a 10
- Valor de mercado estimado
- Estilo de jogo
- Pontos fortes e pontos a melhorar
- Estatísticas da temporada
- Recomendação: **Contratar** (nota ≥ 8), **Observar** (6–7.9) ou
  **Descartar** (< 6)
- Assinatura do jornalista que cobre aquele clube (reaproveita o mapeamento
  de `mercado-noticias.js`)

Tudo isso é **gerado automaticamente**, sem precisar de nenhum campo novo
no cadastro do jogador (idade, altura, pé dominante etc. não existem ainda
no banco). O cálculo usa os dados que já existem — idade, posição, gols,
assistências, cartões — combinados com uma variação pseudo-aleatória
**determinística** (a mesma técnica de hash que o mercado de rumores já
usa em `mercado-noticias.js`): o mesmo jogador sempre gera o mesmo
relatório, mas jogadores diferentes têm relatórios diferentes entre si.

Botão "Consultar valor pelo jogador" no fim do relatório leva direto pro
fluxo de consulta já existente (mesmo modal da aba Transferências).

## 3) Jogador à venda

Dentro da própria aba Scout:

- **Meus jogadores à venda** — o técnico escolhe um jogador do próprio
  elenco, define valor pedido, se aceita proposta de empréstimo e uma
  observação opcional. Só pode haver um anúncio ativo por jogador
  (garantido por índice único no banco). Pode "Retirar" a qualquer momento.
- **Mercado de vendas** — lista os jogadores que outros clubes colocaram
  à venda, com botão "Propor" que abre o mesmo modal de consulta de valor
  já existente.

Fica visível **só para técnicos logados** (dentro de Meu Time), não é uma
página pública.

## 4) Contraproposta

O fluxo antigo continua igual: consulta → time dono propõe valor
(`negociando`) → interessado aceita ou recusa. A diferença é que agora,
enquanto está em `negociando`, **qualquer um dos dois lados** pode, em vez
de só aceitar/recusar, clicar em **"Contrapropor"** e enviar de volta:

- Novo valor
- Bônus (valor + condição livre, ex: "por meta de gols")
- Tipo de transferência (definitivo/empréstimo)
- Se empréstimo: taxa (% pago pelo interessado) e opção de compra
  (com valor) ao final do contrato

O campo `proposta_de` guarda quem fez a proposta vigente (`'dono'` ou
`'interessado'`), então a interface sempre mostra os botões de ação pro
lado que **ainda não respondeu** — evita o mesmo time contrapropor duas
vezes seguidas sem o outro lado ter visto.

`rodada_contraproposta` conta quantas idas e vindas já aconteceram (só
informativo, não tem limite de rodadas no momento).

Ao aceitar, o bônus entra na movimentação de orçamento junto com o valor
principal da transferência.

## Arquivos alterados/novos

- `25_scout_venda_contraproposta.sql` (novo — rodar no Supabase)
- `meu-time.html` — sub-aba Scout, inclui `mercado-noticias.js`
- `meu-time.js` — toda a lógica nova (scout, à venda, contraproposta)
- `meu-time.css` — estilo `.check-inline` pros checkboxes dos modais
