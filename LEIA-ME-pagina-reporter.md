# Página do Repórter

Clicar no `@arroba` do repórter no topo de uma matéria (rumor ou
transferência confirmada) agora abre a página de perfil dele, com:

- Nome e time que cobre.
- Total de transferências confirmadas e rumores publicados por ele.
- Lista de todas as matérias dele (confirmadas e rumores), cada uma
  levando pra matéria completa.

## Arquivos

- **`reporter.html`** (novo) — página, mesmo padrão de `estadio.html`/`arbitro.html`.
- **`reporter.js`** (novo) — toda a lógica de busca/montagem.
- **`materia.js`** (alterado) — só a função `mtBylineHtml`: o `@arroba`
  agora é um link pra `reporter.html?arroba=...` (só quando a
  assinatura é de um repórter fixo — matérias assinadas por "Redação
  X" continuam sem link, porque não são um repórter específico).

## Como funciona (importante saber)

**Não existe uma tabela de repórteres no banco.** A assinatura de cada
matéria é derivada na hora, a partir de uma lista fixa no código
(`MC_REPORTERES_POR_TIME`, em `mercado-noticias.js`): cada time do
Brasileirão tem um repórter fixo cadastrado, e toda matéria sobre esse
time como **interessado na negociação** é assinada por ele — não tem
nada gravado dizendo "essa matéria é do fulano".

Por isso a página do repórter funciona assim: a partir do `@arroba` da
URL, ela primeiro descobre **qual time** aquele repórter cobre
(procurando na mesma lista fixa `MC_REPORTERES_POR_TIME`), e só então
busca no banco todas as negociações (`bid_transferencias`) em que
aquele time aparece como interessado. Ou seja, a "carreira" do
repórter é 100% a cobertura do time dele — não tem como um repórter
aparecer assinando matéria de outro clube.

Os rumores mostrados passam pelo mesmo filtro de "vazamento"
(`tmConsultaVazou`) já usado no Transfermarkt e nas Notícias, pra não
listar consultas internas que nunca viraram matéria pública de
verdade — mantém a página consistente com o que já aparece em outros
lugares do site.

## Não precisa rodar SQL nenhum

A página só lê `bid_transferencias` e `times`, que já existem no seu
banco, e usa a lista de repórteres que já existe no código
(`mercado-noticias.js`) — não criei nada novo no banco.

## Publicar

Suba os arquivos no Vercel:

1. `reporter.html` (novo)
2. `reporter.js` (novo)
3. `materia.js` (substituir)
