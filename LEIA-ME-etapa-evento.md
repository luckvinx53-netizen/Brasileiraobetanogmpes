# Eventos: "0' a 90'" trocado por Etapa

No admin, aba "Eventos / Simulação", o campo que era um dropdown de
minuto exato (0' até 90') virou um campo **Etapa**, com 4 opções:

- 1º tempo
- Acréscimos do 1º tempo
- 2º tempo
- Acréscimos do 2º tempo

## Como funciona por baixo

`eventos_jogo.minuto` continua sendo um número no banco — não mudei o
schema. Esse número ainda é necessário porque é usado em outros
lugares:

- **Ordenar a timeline** de eventos (`order("minuto")`).
- **Revelar eventos aos poucos durante a simulação ao vivo**
  (`jogo.js` / `utils.js`, `filtrarEventosVisiveis`): o jogo roda em
  18 minutos reais representando os 90' e só mostra os eventos cujo
  minuto já "passou" no relógio ao vivo.

Cada etapa escolhida no admin vira um **minuto de referência** fixo
(`etapaParaMinutoReferencia` em `utils.js`):

| Etapa | Minuto salvo |
|---|---|
| 1º tempo | 20 |
| Acréscimos do 1º tempo | 45 |
| 2º tempo | 65 |
| Acréscimos do 2º tempo | 90 |

Isso preserva a ordenação e a revelação gradual ao vivo (por etapa,
não mais por minuto exato) sem precisar mexer na coluna do banco nem
em nenhum outro sistema que dependa de `minuto` ser número.

## Exibição

Em todo lugar que antes mostrava `37'` (minuto cru), agora mostra a
etapa:
- Timeline compacta/bolha ao vivo → label curto: `1T`, `1T+`, `2T`, `2T+`
  (`minutoParaEtapaLabelCurto`, em `jogo.js`, `admin.js`,
  `final-copa-brasil.js`).
- Texto corrido da matéria (`materia.js`) → label completo: "1º
  tempo", "Acréscimos do 1º tempo", etc. (`minutoParaEtapaLabel`).

Eventos já existentes no banco (lançados antes dessa mudança, com
minuto exato tipo 37) continuam funcionando: o label é calculado pela
faixa em que o minuto cai, então um evento salvo com minuto 37 ainda
aparece como "1º tempo" / `1T`.

## Arquivos alterados

- `utils.js` — novo: `ETAPAS_EVENTO`, `etapaParaMinutoReferencia()`,
  `minutoParaEtapaLabel()`, `minutoParaEtapaLabelCurto()`.
- `admin.html` — label do campo trocado de "Minuto" para "Etapa".
- `admin.js` — `popularSelectMinutos()` agora popula as 4 etapas em
  vez de 0-90; `salvarEvento()` converte a etapa escolhida pro minuto
  de referência antes de salvar; timeline do admin mostra a etapa.
- `jogo.js`, `final-copa-brasil.js`, `materia.js` — exibição da
  timeline trocada de minuto cru para etapa. A lógica de revelação ao
  vivo (`filtrarEventosVisiveis`) não foi tocada — continua comparando
  números, só que agora eles vêm de 4 valores fixos em vez de 91.

## O que não mudou

- `final.minuto_atual` (usado só na Final da Copa do Brasil, que roda
  manualmente sem relógio automático) é um campo diferente — não foi
  tocado, continua sendo número digitado à mão pelo admin.
- Coluna `eventos_jogo.minuto` no banco continua `integer`, sem
  migração necessária.
