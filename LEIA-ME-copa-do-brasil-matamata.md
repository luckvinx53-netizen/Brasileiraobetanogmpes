# Copa do Brasil — mata-mata

A Copa do Brasil deixou de ser pontos corridos e agora funciona como
mata-mata de verdade, igual à Copa do Brasil real:

- **16 times**, sorteados automaticamente entre os times cadastrados na
  temporada ativa do Brasileirão.
- **Oitavas, quartas e semifinal são ida e volta** (2 jogos por
  confronto, mandos alternados).
- **Final é jogo único.**
- Em caso de **empate no placar agregado** dos jogos de ida e volta (ou
  empate no jogo único da final), quem avança é decidido **só nos
  pênaltis** (sem critério de gol fora de casa).
- O Brasileirão, Libertadores e Sul-Americana **continuam exatamente
  como estavam** (pontos corridos / fase de grupos) — nada disso muda.

## O que rodar

O schema (tabela `confrontos_mata_mata` e as colunas de mata-mata em
`jogos`) **já está pronto no seu banco Supabase** — inclusive a parte
de pênaltis já foi aplicada diretamente por mim nesta conversa. Você
**não precisa rodar nenhum SQL manualmente**; o arquivo
`29_copa_do_brasil_matamata.sql` fica só de referência/documentação.

Só falta publicar os arquivos de código novos/alterados no Vercel (ver
lista abaixo).

## Como usar no admin

1. Selecione **Copa do Brasil** no seletor de competição do topbar.
2. Abra a aba **Copa do Brasil** no admin.
3. Clique em **Sortear oitavas** — isso busca os times da temporada
   ativa do Brasileirão, sorteia 16 deles, monta os 8 confrontos das
   oitavas e já cria os 16 jogos (ida e volta) na temporada da Copa.
   Se já existir um chaveamento em andamento, o botão pede confirmação
   antes de apagar e sortear de novo.
4. Os jogos aparecem normalmente na aba **Jogos** do admin — lance os
   eventos/gols como em qualquer outro jogo. A única diferença é que,
   ao encerrar o **último jogo de um confronto**, o site calcula o
   agregado sozinho:
   - Se um time venceu no agregado, ele já é marcado como classificado.
   - Se empatou no agregado, abre automaticamente o card **Disputa de
     pênaltis** no painel do confronto (dentro da aba Copa do Brasil)
     para você digitar o placar dos pênaltis e definir quem avança.
5. Depois que **todos os confrontos de uma fase** estiverem com
   vencedor definido, aparece o botão **Gerar quartas** (ou
   **Gerar semifinal** / **Gerar final**, conforme a fase). Ele cria
   os jogos da fase seguinte automaticamente, cruzando os vencedores
   na ordem do chaveamento (confronto 1 x confronto 2, confronto 3 x
   confronto 4, etc.), com mando de campo alternado como de costume.
6. Times eliminados não precisam de nenhuma ação manual — eles
   simplesmente não aparecem mais nos confrontos das fases seguintes.

## Tela pública

Existe uma página nova, **Copa do Brasil** (`copa-do-brasil.html`),
acessível pelo menu principal, mostrando o chaveamento completo
(oitavas → quartas → semifinal → final) com escudos, placares
agregados e, quando houver, o resultado dos pênaltis. Clicar em
qualquer jogo abre o matchcenter normal (`jogo.html`), que agora
também mostra, no topo, "Ida" / "Volta" / "Final" e o placar agregado
do confronto quando o jogo pertence à Copa do Brasil.

## Arquivos novos

- `29_copa_do_brasil_matamata.sql`
- `copa-do-brasil-admin.js`
- `copa-do-brasil.html`
- `copa-do-brasil.js`

## Arquivos alterados

- `utils.js` — implementa de verdade `mmAtualizarConfrontoAposJogo`
  (antes só era chamada, mas não existia em lugar nenhum).
- `admin.html` — nova aba "Copa do Brasil" + script novo.
- `admin.js` — inclui `abaCopaDoBrasil` na lista de abas.
- `jogo.js` — mostra "Ida"/"Volta"/"Final" e o agregado do confronto
  no cabeçalho do jogo, quando aplicável.
- `layout.js` — link "Copa do Brasil" no menu.
