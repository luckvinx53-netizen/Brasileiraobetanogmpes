# Notícias automáticas de fim de jogo

Igual às notícias de transferência (rumores/confirmadas), agora toda
partida que termina também vira notícia sozinha — sem o admin precisar
escrever nada.

## Como funciona

1. Um jogo já tem uma coluna `status`, que vira `"Encerrado"`
   automaticamente quando a partida passa dos 90' (função
   `checarEncerramentoAutomatico`, em `utils.js`) ou quando o admin usa
   "Encerrar manualmente".
2. **Novo arquivo `partida-noticias.js`** lê os jogos com
   `status = "Encerrado"` direto da tabela `jogos` (não precisa de
   tabela nova) e monta, pra cada um, uma notícia de fim de jogo:
   manchete, resumo com o placar e uma assinatura de veículo grande de
   imprensa esportiva — **ge, Goal, Lance!, TNT Sports, ESPN, UOL** —
   sorteado de forma determinística por jogo (o mesmo jogo sempre cai
   no mesmo veículo, não fica trocando a cada F5).
3. **`noticias.js`** foi atualizado pra buscar também essas notícias de
   jogo e mesclar com as oficiais e as de mercado na mesma lista,
   com um novo filtro **"⚽ Jogos"**.
4. **`materia.js`** foi atualizado pra abrir a matéria completa do jogo
   ao clicar no card: manchete, placar em destaque, texto jornalístico
   (com parágrafo de contexto + "aspas" de técnico/jogador, geradas do
   mesmo jeito determinístico que já existe pras matérias de mercado)
   e a lista dos gols com minuto e autor.
5. **`style.css`** ganhou as classes visuais pro novo tipo de notícia
   (cor azul pra diferenciar de rumor/dourado e confirmada/verde).

## Arquivos alterados/criados

| Arquivo | O que mudou |
|---|---|
| `partida-noticias.js` | **Novo.** Núcleo que gera a notícia de fim de jogo a partir da tabela `jogos`. |
| `noticias.js` | Passa a buscar e mesclar as notícias de jogo; novo filtro "Jogos". |
| `materia.js` | Passa a reconhecer `?tipo=jogo` e monta a matéria completa do jogo. |
| `noticias.html` | Inclui `<script src="partida-noticias.js">`. |
| `materia.html` | Inclui `<script src="partida-noticias.js">`. |
| `style.css` | Classes `.mercado-tag.jogo`, `.materia-tag.jogo`, `.materia-placar-destaque`, `.materia-lista-gols`. |
| `26_indice_noticias_fim_de_jogo.sql` | **Opcional.** Só um índice de performance — não é obrigatório rodar. |

## Instalação

1. Suba os 6 arquivos acima nos MESMOS nomes/caminhos do repositório
   (todos ficam na raiz do projeto, junto dos outros `.js`/`.html`).
2. (Opcional) Rode `26_indice_noticias_fim_de_jogo.sql` no SQL Editor
   do Supabase — só acelera a consulta, a funcionalidade já funciona
   sem isso.
3. Pronto. Assim que um jogo virar "Encerrado" (automático aos 90' ou
   manual pelo admin), ele aparece sozinho em Notícias na próxima vez
   que alguém abrir a aba.

## Por que não precisou de tabela nova

Ao contrário de rumores/transferências (que usam a tabela
`bid_transferencias`), o "fim de jogo" já tem tudo que precisa na
tabela `jogos` que já existe: placar, times, rodada, local e status.
Então, seguindo o mesmo padrão do projeto (gerar a notícia "on the fly"
a partir de dados reais, sem duplicar em outra tabela), não foi
necessário criar nada no banco — só o índice opcional de performance.

Se no futuro você quiser, por exemplo, permitir que o admin **edite**
manualmente uma notícia de fim de jogo específica (trocar o veículo,
travar uma manchete, etc.), aí sim valeria criar uma tabela pra
guardar essas customizações por `jogo_id` — me chama que eu monto.
