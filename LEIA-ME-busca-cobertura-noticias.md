# Busca + cobertura múltipla nas Notícias

Inspirado no Google Notícias: buscar por um time ou jogador mostra a
mesma transferência coberta por vários veículos diferentes, cada um
com manchete e "há X horas" próprios — como no print de exemplo
(Flamengo, vários veículos, mesmo fato).

## O que mudou

**`mercado-noticias.js`**
- `tmRelevanciaTransferencia(c, jogador)` — pontua a transferência
  pelo perfil real do jogador (artilheiro/garçom pesam mais, reserva
  pesa menos) e pelo valor negociado. Não inventa nada fora dos dados
  reais do banco.
- `tmQtdCoberturas(pontos)` — converte a relevância em quantos
  veículos cobrem aquela transferência: mínimo 2, máximo 6 (todos os
  veículos fictícios existentes em `MC_VEICULOS_FALLBACK`).
- `tmVeiculosParaCobertura(id, qtd)` — escolhe quais veículos, sem
  repetir, de forma determinística (mesmo resultado a cada refresh).
- `tmCoberturasConfirmada(c, jogador, dono, interessado)` — gera uma
  manchete própria por veículo (reaproveitando o banco de frases já
  existente por perfil, `TM_FRASES_CONFIRMADA_POR_PERFIL`, variando a
  semente por veículo) e um horário de publicação escalonado (o
  primeiro veículo "fura", os outros replicam minutos/horas depois).
- `buscarConfirmadasComoNoticias()` — agora retorna, além do card
  principal de cada transferência (comportamento de sempre), um card
  extra por cobertura. Todos compartilham `grupoId` (o id da
  transferência), usado pra agrupar na busca.

**`noticias.js`**
- Barra de busca (`noticiasBuscar`, normaliza acento/caixa).
- Sem busca ativa: timeline normal, um card por publicação, como já
  era.
- Com busca ativa: os resultados são agrupados por `grupoId`
  (`noticiasAgrupadasHtml`) — cards do mesmo fato viram um bloco só,
  com a manchete do furo em destaque e um card compacto por veículo
  abaixo (`news-fonte-card`), igual ao print de referência.
- `noticiasTempoRelativo()` — "há 12 horas" / "há 2 dias".

**`materia.js`**
- `carregarMateria()` lê o parâmetro opcional `?veiculo=X` na URL: se
  presente, abre a matéria "vestida" com a manchete e assinatura
  daquele veículo específico, em vez da assinatura sorteada padrão.
- `mtRenderOutrasCoberturas()` — no fim da matéria, seção "Mais sobre
  esse assunto" linkando as outras coberturas da mesma transferência
  (outros veículos, cada um com sua manchete).

**`veiculo.js`**
- Links de cobertura extra levam o parâmetro `&veiculo=X`, pra que a
  página do veículo abra a matéria com a manchete daquele veículo
  específico, não a genérica.

**`style.css`**
- `.news-busca-barra` / `.news-busca-input` — barra de busca.
- `.news-grupo` / `.news-grupo-titulo` / `.news-fonte-card` — bloco de
  cobertura agrupada.
- `.materia-outras-coberturas` / `.mc-outra-fonte` — seção "Mais sobre
  esse assunto" na matéria.

## O que não mudou

- Nenhuma tabela nova, nenhuma coluna nova — tudo é gerado em memória
  a partir de `bid_transferencias`, igual ao sistema de veículos que
  já existia.
- Timeline sem busca continua igual a antes (um card por publicação).
- Transfermarkt e página do repórter continuam mostrando só a matéria
  principal (não fazia sentido duplicar lá — são páginas de perfil,
  não de busca).
- Rumores não geram cobertura múltipla — só transferências confirmadas
  (é o padrão do print: fatos consumados são replicados por vários
  veículos; rumores costumam ter uma fonte primária).
