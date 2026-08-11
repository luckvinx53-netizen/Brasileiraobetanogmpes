# Página do Árbitro

Igual à página de Estádio, agora clicar no nome do árbitro (ou de um
assistente / 4º árbitro) dentro do card **🧑‍⚖️ Arbitragem** do jogo abre
uma página só dele, com:

- Nome e categoria (se cadastrado em Árbitros CBF, no admin).
- Total de jogos apitados.
- Total de cartões amarelos e vermelhos dados **nos jogos em que ele
  atuou** (em qualquer uma das 4 funções), com a média por jogo.
- Últimos estádios onde apitou (com link pra página do estádio).
- Lista dos últimos jogos, mostrando placar, data, função exercida
  naquele jogo e os cartões daquela partida específica.

## Arquivos

- **`arbitro.html`** (novo) — página, mesmo padrão de `estadio.html`.
- **`arbitro.js`** (novo) — toda a lógica de busca/montagem.
- **`jogo.js`** (alterado) — só a função `mcArbitragemCardHtml`: os
  nomes do árbitro/assistentes/4º árbitro agora são links para
  `arbitro.html?nome=...` em vez de texto simples.
- **`style.css`** (alterado) — duas linhas novas pra deixar o nome do
  árbitro com a cor de destaque (`--grama`) e indicar que é clicável.

## Importante: como a busca funciona (sem quebrar nada)

A arbitragem no banco é gravada **por nome** (texto), uma linha por
jogo na tabela `arbitragem_jogo`, com 4 colunas: `arbitro`,
`assistente_1`, `assistente_2`, `quarto_arbitro`. Não existe uma
tabela ligando cada árbitro a um ID fixo com histórico — por isso a
página busca **por igualdade de nome exato** em qualquer uma dessas 4
colunas.

Isso significa uma coisa a que vale ficar atento: **se dois árbitros
diferentes tiverem o nome cadastrado de forma diferente (ex: "João
Silva" e "João da Silva"), eles aparecem como pessoas separadas** — e
se o mesmo árbitro for cadastrado com grafias diferentes em jogos
diferentes, o histórico dele fica dividido. Não precisa mudar nada
agora, é só saber que o nome cadastrado em **Árbitros CBF** (aba
Times, no admin) é o que deve ser usado sempre, exatamente igual, pra
manter o histórico de cada um unificado.

Os cartões são contados a partir de `eventos_jogo` (tipo `Cartão
Amarelo` / `Cartão Vermelho`) dos jogos em que aquele nome aparece —
não há vínculo direto entre o evento e o árbitro (o jogo em si nunca
teve isso gravado), então o número mostrado é "cartões dados na
partida", não "cartões que ele pessoalmente mostrou" (relevante pra
assistentes/4º árbitro, que tecnicamente não mostram cartão, mas
participam da partida).

## Não precisa rodar SQL nenhum

Não criei tabela nova — a página só lê `arbitros_cbf`,
`arbitragem_jogo`, `jogos` e `eventos_jogo`, que já existem no seu
banco.

## Publicar

Suba os arquivos no Vercel (ou onde o projeto estiver hospedado):

1. `arbitro.html` (novo)
2. `arbitro.js` (novo)
3. `jogo.js` (substituir)
4. `style.css` (substituir)
