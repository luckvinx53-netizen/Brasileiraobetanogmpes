# Regularização automática (BID) — o que mudou

## Fluxo completo implementado (espelha o processo real da CBF)

1. **Técnico A (interessado)** manda uma consulta pelo jogador: escolhe o
   jogador, o **tipo de contratação pretendido** (Definitivo/Empréstimo) e uma
   mensagem opcional. **Sem valor nessa etapa** — ainda é só manifestação de
   interesse.
2. **Técnico B (dono do passe)** vê a consulta em **Negociações > Consultas
   recebidas**, com o tipo pretendido já visível, e escolhe:
   - **Negociar** → abre um campo pra propor um valor pela transferência
   - **Recusar consulta** → fecha ali, sem mais nenhuma etapa
3. Ao clicar em **Negociar**, o Técnico B define o **valor da transferência**.
   Isso muda o status da consulta para `negociando` e o Técnico A recebe o
   aviso.
4. **Técnico A** vê a proposta em **Negociações > Consultas enviadas**, com
   o valor que o Técnico B pediu, e escolhe:
   - **Aceitar proposta** → a transferência é oficializada: o jogador muda de
     time e fica marcado como pendente de regularização
   - **Recusar proposta** → fecha como recusada; se quiser tentar de novo,
     precisa abrir uma consulta nova do zero
5. Na aba **BID > Regularização**, o select "Jogador" só lista jogadores com
   uma transferência **aceita e ainda não usada** para o time atual — ou
   seja, só recém-contratados por esse fluxo.
6. Ao selecionar o jogador, aparecem automaticamente (somente leitura):
   **Clube de origem, Valor da transferência, Idade, Tipo de contratação**.
7. Ao enviar a solicitação de regularização, a transferência é marcada como
   `usada_em_regularizacao = true` (não pode gerar uma segunda regularização
   com o mesmo contrato).
8. "Minhas solicitações" (técnico) e a tela do admin mostram a data e hora
   da publicação da solicitação, além desses dados da contratação.

## Status da negociação (`bid_transferencias.status`)

- `pendente` — consulta enviada, aguardando o dono negociar ou recusar
- `negociando` — dono propôs um valor, aguardando o interessado aceitar/recusar
- `recusado` — fechada sem transferência (pode acontecer em qualquer das duas etapas)
- `aceito` — transferência oficializada, jogador já mudou de time

## Rodar no Supabase (SQL Editor)

Rode o arquivo `24_regularizacao_bid.sql` **antes** de subir os arquivos
novos — ele adiciona:
- `jogadores.idade`
- `bid_transferencias.tipo_contratacao` e `usada_em_regularizacao`
- `bid_solicitacoes.transferencia_id`

⚠️ **Atenção**: se a coluna `bid_transferencias.status` tiver uma constraint
fixa de valores permitidos (`check`), os valores `'negociando'` e `'aceito'`
precisam ser adicionados a ela. O arquivo SQL tem uma consulta comentada no
final pra você checar isso — rode ela primeiro pra ver se sua constraint já
aceita esses valores ou se precisa ser ajustada.

## Arquivos alterados

- `24_regularizacao_bid.sql` (novo — rodar no Supabase)
- `admin.html` — campo Idade no cadastro de jogador
- `admin.js` — salvar/exibir/editar idade
- `meu-time.html` — bloco de preview na Regularização
- `meu-time.js` — toda a lógica nova (consulta em duas etapas, elegibilidade
  de regularização, preview automático, marcação de uso)
- `bid-admin.js` — exibir dados da contratação e data/hora na tela do admin

## O que ficou de fora (por decisão sua)

- Jogadores contratados **fora** desse fluxo de negociação entre técnicos
  (ex: vindo de fora do campeonato) não geram transferência automaticamente —
  continuam exigindo edição manual do time no cadastro do jogador, sem
  preencher os campos de origem/valor/tipo na regularização.
- Não existem múltiplas rodadas de contraproposta: se o Técnico A recusa o
  valor, a negociação encerra e uma nova consulta precisa ser aberta do zero.
