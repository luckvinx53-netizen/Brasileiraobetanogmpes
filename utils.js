// =========================================================
// UTILITÁRIOS COMPARTILHADOS
// =========================================================

// Devolve a data de HOJE no fuso local do navegador, no formato
// "AAAA-MM-DD" (mesmo formato salvo em jogos.data_jogo). NUNCA use
// new Date().toISOString().slice(0,10) para isso — toISOString()
// sempre converte para UTC, então das ~21h às 23h59 no horário de
// Brasília (UTC-3) ele já devolve a data de AMANHÃ, fazendo qualquer
// comparação com jogo.data_jogo falhar silenciosamente bem no horário
// em que a maioria dos jogos de futebol acontece. Foi exatamente isso
// que fazia o post de "Matchday" nunca ser gerado à noite.
function dataLocalDeHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function notificar(texto, tipo = "sucesso") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.innerText = texto;
  toast.className = "";
  if (tipo === "erro") toast.classList.add("erro");
  else if (tipo === "aviso") toast.classList.add("aviso");
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function statusClasse(status) {
  const map = {
    "Agendado": "status-agendado",
    "Em andamento": "status-andamento",
    "Encerrado": "status-encerrado",
    "Adiado": "status-adiado"
  };
  return map[status] || "status-agendado";
}

// Escapa aspas simples pra usar um valor com segurança dentro de um
// onclick="...('${valor}')" — evita quebrar o HTML/JS quando o nome
// de um jogador tem apóstrofo (ex: "D'Angelo").
function escJs(texto) {
  return String(texto ?? "").replace(/'/g, "\\'");
}

function escudoHtml(time, tamanhoClasse = "escudo") {
  if (!time) return `<div class="escudo-placeholder">?</div>`;
  if (time.escudo_url) {
    return `<img class="${tamanhoClasse}" src="${time.escudo_url}" alt="${time.nome}" onerror="this.outerHTML='<div class=&quot;escudo-placeholder&quot;>${sigla(time)}</div>'">`;
  }
  return `<div class="escudo-placeholder">${sigla(time)}</div>`;
}

function sigla(time) {
  if (time.sigla) return time.sigla.slice(0, 3).toUpperCase();
  if (time.nome) return time.nome.slice(0, 3).toUpperCase();
  return "?";
}

function formatarData(dataStr) {
  if (!dataStr) return "";
  const [ano, mes, dia] = dataStr.split("-");
  if (!ano) return dataStr;
  return `${dia}/${mes}/${ano}`;
}

// Busca a temporada ativa DA COMPETIÇÃO SELECIONADA no seletor do topbar
// (Brasileirão/Libertadores/Sul-Americana/Copa do Brasil). Cada competição
// tem sua própria temporada "ativa" (ativa=true), então isso continua
// funcionando como antes (times.html, jogos.js, classificacao.js etc.
// não precisam saber nada sobre competições — só recebem a temporada
// certa automaticamente).
//
// Se por algum motivo a competição ainda não estiver disponível (ex:
// página sem competicoes.js carregado, ou banco ainda sem a migração
// 27_competicoes.sql aplicada), cai no comportamento antigo: pega
// qualquer temporada com ativa=true.
async function getTemporadaAtiva() {
  let competicaoId = null;

  if (typeof getCompeticaoAtual === "function") {
    try {
      const competicao = await getCompeticaoAtual();
      competicaoId = competicao?.id || null;
    } catch (e) {
      console.error("Erro ao resolver competição atual:", e);
    }
  }

  let query = supabaseClient.from("temporadas").select("*").eq("ativa", true);
  if (competicaoId) query = query.eq("competicao_id", competicaoId);

  // Usa .limit(1) + pega o primeiro item em vez de .maybeSingle(): se
  // por algum motivo existir mais de uma temporada marcada como ativa
  // pra mesma competição (ex: dado antigo de antes da migração de
  // competições), .maybeSingle() lançaria erro e getTemporadaAtiva()
  // voltaria null pro site inteiro. Preferimos seguir com a mais
  // recente do que quebrar a página inteira silenciosamente.
  let { data, error } = await query.order("criado_em", { ascending: false }).limit(1);

  // Se a tabela não tiver coluna "criado_em" (schema pode variar),
  // tenta de novo sem ordenar por ela em vez de quebrar tudo.
  if (error) {
    const semOrdenacao = await (competicaoId
      ? supabaseClient.from("temporadas").select("*").eq("ativa", true).eq("competicao_id", competicaoId).limit(1)
      : supabaseClient.from("temporadas").select("*").eq("ativa", true).limit(1));
    data = semOrdenacao.data;
    error = semOrdenacao.error;
  }

  if (error) {
    console.error("Erro ao buscar temporada ativa:", error);
    return null;
  }
  return data?.[0] || null;
}

// Aplica a classe "active" no item certo da navbar, com base no arquivo atual
function marcarNavAtiva() {
  const pagina = window.location.pathname.split("/").pop() || "index";
  document.querySelectorAll(".bottom-nav a").forEach(a => {
    const href = a.getAttribute("href");
    if (href === pagina) a.classList.add("active");
    else a.classList.remove("active");
  });

  // Destaca o botão "☰" se a página atual for uma das escondidas no menu extra
  const botaoMenu = document.getElementById("btnMenuExtra");
  if (botaoMenu && typeof MENU_EXTRA_ITEMS !== "undefined") {
    const estaNoMenuExtra = MENU_EXTRA_ITEMS.some(i => i.href === pagina);
    botaoMenu.classList.toggle("active", estaNoMenuExtra);
  }
}

document.addEventListener("DOMContentLoaded", marcarNavAtiva);

// =========================================================
// SIMULAÇÃO POR MINUTAGEM
// Cada partida "roda" em 18 minutos reais, representando os 90'
// do jogo (1' do jogo = 12s reais). Isso é calculado a partir
// de hora_inicio_simulacao.
// =========================================================

const DURACAO_SIMULACAO_MS = 18 * 60 * 1000; // 18 minutos reais
const MINUTOS_JOGO = 90;

// =========================================================
// ETAPA DO EVENTO (1º tempo / 2º tempo / acréscimos)
// O admin, ao lançar um evento, escolhe só a ETAPA em que ele
// aconteceu — não mais o minuto exato (era o dropdown "0' a 90'").
// Por baixo, cada etapa continua sendo salva como um número em
// eventos_jogo.minuto (a coluna no banco não mudou), porque esse
// número ainda é usado pra: ordenar a timeline, decidir quando
// revelar o evento durante a simulação ao vivo (filtrarEventosVisiveis
// em jogo.js/utils.js) e comparar com o minuto ao vivo do jogo. A
// etapa escolhida vira o minuto de REFERÊNCIA daquela etapa (meio do
// primeiro tempo, meio do segundo tempo, etc.) — não é mais o minuto
// exato do lance, é uma aproximação por etapa.
const ETAPAS_EVENTO = [
  { valor: "1T", label: "1º tempo", minutoReferencia: 20 },
  { valor: "ACR1T", label: "Acréscimos do 1º tempo", minutoReferencia: 45 },
  { valor: "2T", label: "2º tempo", minutoReferencia: 65 },
  { valor: "ACR2T", label: "Acréscimos do 2º tempo", minutoReferencia: 90 },
];

function etapaParaMinutoReferencia(valorEtapa) {
  const etapa = ETAPAS_EVENTO.find(e => e.valor === valorEtapa);
  return etapa ? etapa.minutoReferencia : 0;
}

// Converte um minuto (número, inclusive eventos antigos lançados
// antes dessa mudança, que têm minuto exato em vez de referência) de
// volta pra etapa, pra exibir "1º tempo" etc. na timeline em vez do
// minuto cru. Eventos antigos com minuto exato (ex: 37') caem na
// etapa correspondente pela faixa em que o minuto está.
function minutoParaEtapaLabel(minuto) {
  const m = Number(minuto) || 0;
  if (m <= 45) return m <= 40 ? "1º tempo" : "Acréscimos do 1º tempo";
  return m < 90 ? "2º tempo" : "Acréscimos do 2º tempo";
}

// Label curto (cabe em bolhas/timelines compactas): "1T", "1T+", "2T", "2T+".
function minutoParaEtapaLabelCurto(minuto) {
  const m = Number(minuto) || 0;
  if (m <= 45) return m <= 40 ? "1T" : "1T+";
  return m < 90 ? "2T" : "2T+";
}


// Converte o valor salvo de hora_inicio_simulacao (vindo do input
// datetime-local, ex: "2026-07-08T21:00") para timestamp local real,
// SEM deixar o JS/Postgres reinterpretar como UTC. O datetime-local
// não carrega fuso horário, então tratamos sempre como horário local
// de quem cadastrou o jogo.
// [FUSO-CORRIGIDO-v2] Marca de identificação: se você está vendo este
// comentário no arquivo publicado, a correção de fuso ESTÁ aplicada.
//
// Converte um valor de <input type="datetime-local"> (string
// "AAAA-MM-DDTHH:MM", sem informação de fuso — é a hora de PAREDE que
// a pessoa digitou, sempre em horário de Brasília neste projeto) para
// uma string ISO com o instante UTC real correspondente.
//
// Isso é necessário porque a coluna hora_inicio_simulacao é
// timestamptz: se mandarmos a string crua sem fuso, o Postgres assume
// que ela já é UTC e grava o instante errado — 3h adiantado do que a
// pessoa quis dizer (Brasília = UTC-3). Convertendo aqui, ANTES de
// enviar (usada em admin.js, dentro de dadosJogo()), garantimos que o
// valor salvo no banco já é o instante correto para qualquer lugar
// que o leia depois (front-end, Edge Function de notificações).
//
// Esta função é o "espelho" de parseHoraInicioSimulacaoLocal(): aquela
// lê um timestamptz do banco e devolve os componentes de parede tal
// como estão (sem conversão), assumindo que quem gravou já fez a
// conversão certa — que é exatamente o que esta função faz.
function dataHoraBrasiliaParaUtcIso(valorDatetimeLocal) {
  if (!valorDatetimeLocal) return null;

  const match = valorDatetimeLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return valorDatetimeLocal;

  const [, ano, mes, dia, hora, minuto] = match;
  const OFFSET_BRASILIA_HORAS = 3; // Brasília = UTC-3 (sem horário de verão atualmente)

  const instanteUtcMs = Date.UTC(
    Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto)
  ) + OFFSET_BRASILIA_HORAS * 60 * 60 * 1000;

  return new Date(instanteUtcMs).toISOString();
}

// Converte o valor salvo de hora_inicio_simulacao (coluna timestamptz)
// para um timestamp real (ms desde epoch).
//
// IMPORTANTE: desde que admin.js passou a converter explicitamente a
// hora digitada (fuso de Brasília) para o instante UTC real antes de
// salvar — ver dataHoraBrasiliaParaUtcIso() logo acima —, o valor que
// vem do banco já é um timestamp com fuso explícito (ex: termina em
// "+00" ou "Z"). Isso significa que o `new Date()` nativo já
// interpreta esse valor corretamente por conta própria, sem precisar
// de nenhum parse manual de componentes "de parede".
//
// (Uma versão anterior desta função extraía os componentes de
// data/hora e montava um `new Date(ano,mes,dia,hora,min)` local — isso
// fazia sentido quando o valor gravado ainda era a hora de parede sem
// conversão, mas agora que a gravação já entrega o instante UTC
// correto, fazer esse parse manual de novo contaria o fuso duas vezes
// e voltaria a dar o mesmo tipo de bug de 3h que já tivemos.)
function parseHoraInicioSimulacaoLocal(valor) {
  if (!valor) return null;
  const timestamp = new Date(valor).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

// Retorna o minuto atual do jogo (0 a 90), ou null se a simulação
// ainda não começou (hora_inicio_simulacao vazio/no futuro).
function minutoAtualDoJogo(jogo) {
  if (!jogo.hora_inicio_simulacao) return null;

  const inicio = parseHoraInicioSimulacaoLocal(jogo.hora_inicio_simulacao);
  if (inicio === null) return null;

  const agora = Date.now();
  if (agora < inicio) return null;

  const decorridoMs = agora - inicio;
  const progresso = Math.min(decorridoMs / DURACAO_SIMULACAO_MS, 1);
  return Math.floor(progresso * MINUTOS_JOGO);
}

// Calcula o placar de um jogo a partir dos eventos de Gol/Gol Contra
async function calcularPlacarPorEventosCompartilhado(jogo) {
  const { data: eventos, error } = await supabaseClient
    .from("eventos_jogo")
    .select("*")
    .eq("jogo_id", jogo.id);

  if (error) { console.error(error); return { pc: 0, pf: 0 }; }

  let pc = 0, pf = 0;
  (eventos || []).forEach(e => {
    const eDoTimeCasa = e.time_id === jogo.time_casa_id;
    const eDoTimeFora = e.time_id === jogo.time_fora_id;

    if (e.tipo === "Gol" || e.tipo === "Pênalti Marcado") {
      if (eDoTimeCasa) pc++;
      else if (eDoTimeFora) pf++;
    } else if (e.tipo === "Gol Contra") {
      if (eDoTimeCasa) pf++;
      else if (eDoTimeFora) pc++;
    }
  });

  return { pc, pf };
}

// Desfaz nas estatísticas dos jogadores (gols, assistências, cartões,
// valor de mercado) tudo o que os eventos_jogo de um jogo geraram. Usada
// ao descomputar um jogo, pra que a artilharia/estatísticas voltem a
// ficar corretas e batam com o placar e os eventos, permitindo editar
// tudo de novo sem duplicar contagem quando o jogo for recomputado.
async function desfazerEstatisticasEventosDoJogo(jogoId) {
  const { data: eventos, error } = await supabaseClient
    .from("eventos_jogo")
    .select("*")
    .eq("jogo_id", jogoId);

  if (error) return { ok: false, error };

  const idsEnvolvidos = [
    ...new Set(
      (eventos || [])
        .flatMap(e => [e.jogador_id, e.jogador_secundario_id])
        .filter(Boolean)
    ),
  ];

  if (idsEnvolvidos.length === 0) return { ok: true };

  const { data: jogadoresEnvolvidos, error: erroJogadores } = await supabaseClient
    .from("jogadores")
    .select("*")
    .in("id", idsEnvolvidos);

  if (erroJogadores) return { ok: false, error: erroJogadores };

  const mapaJogadores = Object.fromEntries((jogadoresEnvolvidos || []).map(j => [j.id, { ...j }]));

  (eventos || []).forEach(e => {
    if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_id && mapaJogadores[e.jogador_id]) {
      mapaJogadores[e.jogador_id].gols = Math.max((mapaJogadores[e.jogador_id].gols || 0) - 1, 0);
    }
    if (e.tipo === "Gol" && e.jogador_secundario_id && mapaJogadores[e.jogador_secundario_id]) {
      mapaJogadores[e.jogador_secundario_id].assistencias = Math.max((mapaJogadores[e.jogador_secundario_id].assistencias || 0) - 1, 0);
    }
    if (e.tipo === "Cartão Amarelo" && e.jogador_id && mapaJogadores[e.jogador_id]) {
      mapaJogadores[e.jogador_id].cartoes_amarelos = Math.max((mapaJogadores[e.jogador_id].cartoes_amarelos || 0) - 1, 0);
    }
    if (e.tipo === "Cartão Vermelho" && e.jogador_id && mapaJogadores[e.jogador_id]) {
      mapaJogadores[e.jogador_id].cartoes_vermelhos = Math.max((mapaJogadores[e.jogador_id].cartoes_vermelhos || 0) - 1, 0);
    }
    // Reverte o valor de mercado do artilheiro dividindo pelo MESMO fator
    // que foi aplicado quando o evento foi computado (guardado em
    // fator_valorizacao_gol). Fator fixo de gol (1.03), então não
    // precisaria ser salvo, mas usamos o valor salvo mesmo assim por
    // consistência e para não depender de constantes duplicadas.
    if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_id
        && e.fator_valorizacao_gol && mapaJogadores[e.jogador_id]) {
      const atual = Number(mapaJogadores[e.jogador_id].valor_mercado) || 0;
      mapaJogadores[e.jogador_id].valor_mercado = Math.round(atual / Number(e.fator_valorizacao_gol));
    }
    // Reverte o valor de mercado de quem deu a assistência. O fator é
    // SORTEADO a cada evento (entre 1% e 1,25%), então só dá pra
    // reverter usando o valor exato que foi salvo em
    // fator_valorizacao_assistencia no momento em que o evento foi
    // computado — não dá pra recalcular.
    if (e.tipo === "Gol" && e.jogador_secundario_id
        && e.fator_valorizacao_assistencia && mapaJogadores[e.jogador_secundario_id]) {
      const atual = Number(mapaJogadores[e.jogador_secundario_id].valor_mercado) || 0;
      mapaJogadores[e.jogador_secundario_id].valor_mercado = Math.round(atual / Number(e.fator_valorizacao_assistencia));
    }
  });

  for (const jogadorId of Object.keys(mapaJogadores)) {
    const j = mapaJogadores[jogadorId];
    const { error: erroUpdate } = await supabaseClient
      .from("jogadores")
      .update({
        gols: j.gols || 0,
        assistencias: j.assistencias || 0,
        cartoes_amarelos: j.cartoes_amarelos || 0,
        cartoes_vermelhos: j.cartoes_vermelhos || 0,
        valor_mercado: j.valor_mercado || 0,
      })
      .eq("id", jogadorId);
    if (erroUpdate) return { ok: false, error: erroUpdate };
  }

  return { ok: true };
}

// Sorteia o fator de valorização de uma assistência: entre +1% e +1,25%
// (1.01 a 1.0125), diferente a cada evento.
function sortearFatorValorizacaoAssistencia() {
  const percentual = 0.01 + Math.random() * 0.0025; // 0.01 a 0.0125
  return 1 + percentual;
}

// Fator fixo de valorização por gol: +3%.
const FATOR_VALORIZACAO_GOL = 1.03;

// Reaplica nas estatísticas dos jogadores (gols, assistências, cartões,
// valor de mercado) tudo o que os eventos_jogo de um jogo já lançados
// representam. Espelho de desfazerEstatisticasEventosDoJogo, usada ao
// encerrar/recomputar um jogo que foi descomputado antes (pra não perder
// os gols/cartões que tinham sido zerados no jogador ao descomputar).
//
// Valor de mercado: cada evento de Gol/Pênalti Marcado sobe o valor do
// artilheiro em +3%; cada Gol com assistência também sobe o valor de
// quem deu a assistência entre +1% e +1,25% (sorteado). O fator exato
// usado é salvo em eventos_jogo (fator_valorizacao_gol/assistencia) pra
// permitir reverter com exatidão se o jogo for descomputado depois —
// eventos que já tinham um fator salvo (recomputação) reusam o mesmo
// fator em vez de sortear de novo, pra não gerar valores diferentes a
// cada vez que o mesmo jogo é computado/descomputado.
async function reaplicarEstatisticasEventosDoJogo(jogoId) {
  const { data: eventos, error } = await supabaseClient
    .from("eventos_jogo")
    .select("*")
    .eq("jogo_id", jogoId);

  if (error) return { ok: false, error };

  const idsEnvolvidos = [
    ...new Set(
      (eventos || [])
        .flatMap(e => [e.jogador_id, e.jogador_secundario_id])
        .filter(Boolean)
    ),
  ];

  if (idsEnvolvidos.length === 0) return { ok: true };

  const { data: jogadoresEnvolvidos, error: erroJogadores } = await supabaseClient
    .from("jogadores")
    .select("*")
    .in("id", idsEnvolvidos);

  if (erroJogadores) return { ok: false, error: erroJogadores };

  const mapaJogadores = Object.fromEntries((jogadoresEnvolvidos || []).map(j => [j.id, { ...j }]));

  // Eventos que ganharem um fator novo (1ª vez sendo computados) precisam
  // ser salvos de volta em eventos_jogo — acumulamos aqui pra fazer isso
  // depois de calcular tudo.
  const atualizacoesEventos = [];

  (eventos || []).forEach(e => {
    if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_id && mapaJogadores[e.jogador_id]) {
      mapaJogadores[e.jogador_id].gols = (mapaJogadores[e.jogador_id].gols || 0) + 1;

      const fatorGol = e.fator_valorizacao_gol || FATOR_VALORIZACAO_GOL;
      const atual = Number(mapaJogadores[e.jogador_id].valor_mercado) || 0;
      mapaJogadores[e.jogador_id].valor_mercado = Math.round(atual * fatorGol);
      if (!e.fator_valorizacao_gol) atualizacoesEventos.push({ id: e.id, fator_valorizacao_gol: fatorGol });
    }
    if (e.tipo === "Gol" && e.jogador_secundario_id && mapaJogadores[e.jogador_secundario_id]) {
      mapaJogadores[e.jogador_secundario_id].assistencias = (mapaJogadores[e.jogador_secundario_id].assistencias || 0) + 1;

      const fatorAssist = e.fator_valorizacao_assistencia || sortearFatorValorizacaoAssistencia();
      const atualAssist = Number(mapaJogadores[e.jogador_secundario_id].valor_mercado) || 0;
      mapaJogadores[e.jogador_secundario_id].valor_mercado = Math.round(atualAssist * fatorAssist);
      if (!e.fator_valorizacao_assistencia) {
        const jaTemAtualizacao = atualizacoesEventos.find(a => a.id === e.id);
        if (jaTemAtualizacao) jaTemAtualizacao.fator_valorizacao_assistencia = fatorAssist;
        else atualizacoesEventos.push({ id: e.id, fator_valorizacao_assistencia: fatorAssist });
      }
    }
    if (e.tipo === "Cartão Amarelo" && e.jogador_id && mapaJogadores[e.jogador_id]) {
      mapaJogadores[e.jogador_id].cartoes_amarelos = (mapaJogadores[e.jogador_id].cartoes_amarelos || 0) + 1;
    }
    if (e.tipo === "Cartão Vermelho" && e.jogador_id && mapaJogadores[e.jogador_id]) {
      mapaJogadores[e.jogador_id].cartoes_vermelhos = (mapaJogadores[e.jogador_id].cartoes_vermelhos || 0) + 1;
    }
  });

  for (const jogadorId of Object.keys(mapaJogadores)) {
    const j = mapaJogadores[jogadorId];
    const { error: erroUpdate } = await supabaseClient
      .from("jogadores")
      .update({
        gols: j.gols || 0,
        assistencias: j.assistencias || 0,
        cartoes_amarelos: j.cartoes_amarelos || 0,
        cartoes_vermelhos: j.cartoes_vermelhos || 0,
        valor_mercado: j.valor_mercado || 0,
      })
      .eq("id", jogadorId);
    if (erroUpdate) return { ok: false, error: erroUpdate };
  }

  // Salva os fatores sorteados/usados de volta nos eventos, pra que uma
  // futura reversão (descomputar) use o valor exato aplicado agora.
  for (const upd of atualizacoesEventos) {
    const { id, ...campos } = upd;
    const { error: erroEvento } = await supabaseClient
      .from("eventos_jogo")
      .update(campos)
      .eq("id", id);
    if (erroEvento) return { ok: false, error: erroEvento };
  }

  // Calcula e grava a pontuação do fantasy pros jogadores que tiveram
  // evento neste jogo. Roda por último, depois de gols/cartões/valor de
  // mercado já estarem salvos. Uma falha aqui NÃO desfaz o resto (gols/
  // cartões/valor de mercado já foram gravados com sucesso acima) — só
  // loga o erro, pra não travar o fluxo principal de computar jogo por
  // causa de um problema isolado no fantasy.
  if (typeof fantasyCalcularPontuacaoJogo === "function") {
    try {
      const { data: jogoCompleto } = await supabaseClient
        .from("jogos")
        .select("id, rodada, temporada_id, time_casa_id, time_fora_id, placar_casa, placar_fora")
        .eq("id", jogoId)
        .single();
      if (jogoCompleto) {
        const resultadoFantasy = await fantasyCalcularPontuacaoJogo(jogoCompleto);
        if (!resultadoFantasy.ok) console.error("Falha ao calcular pontuação fantasy:", resultadoFantasy.error);
      }
    } catch (e) {
      console.error("Falha ao calcular pontuação fantasy:", e);
    }
  }

  return { ok: true };
}

// Soma/subtrai o resultado do jogo na tabela de classificação dos times
async function ajustarTabelaClassificacao(jogo, pc, pf, modo) {
  const { data: times, error } = await supabaseClient
    .from("times")
    .select("*")
    .in("id", [jogo.time_casa_id, jogo.time_fora_id]);

  if (error) { console.error(error); return { ok: false, error }; }
  if (!times) { return { ok: false, error: { message: "Times não retornados." } }; }

  const timeCasa = times.find(t => t.id === jogo.time_casa_id);
  const timeFora = times.find(t => t.id === jogo.time_fora_id);
  if (!timeCasa || !timeFora) return { ok: false, error: { message: "Um dos times do jogo não foi encontrado." } };

  const casaR = { pontos: 0, jogos: 1, vitorias: 0, empates: 0, derrotas: 0, gols_pro: pc, gols_contra: pf };
  const foraR = { pontos: 0, jogos: 1, vitorias: 0, empates: 0, derrotas: 0, gols_pro: pf, gols_contra: pc };

  if (pc > pf) { casaR.pontos = 3; casaR.vitorias = 1; foraR.derrotas = 1; }
  else if (pc < pf) { foraR.pontos = 3; foraR.vitorias = 1; casaR.derrotas = 1; }
  else { casaR.pontos = 1; foraR.pontos = 1; casaR.empates = 1; foraR.empates = 1; }

  const mult = modo === "somar" ? 1 : -1;

  const novoCasa = {};
  const novoFora = {};
  Object.keys(casaR).forEach(k => {
    novoCasa[k] = Math.max(0, Number(timeCasa[k] || 0) + casaR[k] * mult);
    novoFora[k] = Math.max(0, Number(timeFora[k] || 0) + foraR[k] * mult);
  });

  const c = await supabaseClient.from("times").update(novoCasa).eq("id", timeCasa.id);
  if (c.error) { console.error(c.error); return { ok: false, error: c.error }; }

  const f = await supabaseClient.from("times").update(novoFora).eq("id", timeFora.id);
  if (f.error) { console.error(f.error); return { ok: false, error: f.error }; }

  return { ok: true };
}

// Verifica se um jogo já passou dos 90' e ainda não foi computado;
// se sim, encerra sozinho: calcula placar pelos eventos, salva no
// jogo e soma o resultado na tabela. Chamado a partir de qualquer
// tela pública ou do admin ao carregar um jogo.
async function checarEncerramentoAutomatico(jogo) {
  // Jogo já estava Encerrado (e computado=true) ANTES da rede social
  // existir: nunca vai passar pelo bloco de encerramento normal lá
  // embaixo (só roda uma vez, no momento em que o jogo termina de
  // verdade). Por isso este backfill do post de fim de jogo roda ANTES
  // do guard de "já computado" — senão jogos antigos nunca teriam post
  // gerado, mesmo com a página sendo recarregada infinitas vezes.
  // rsGerarPostFimDeJogoSeNecessario() é idempotente (índice único no
  // banco + checagem prévia de existência), então rodar isso toda vez
  // que a página carrega não duplica nada.
  if (jogo.status === "Encerrado") {
    if (typeof rsGerarPostFimDeJogoSeNecessario === "function" && jogo.time_casa && jogo.time_fora) {
      (async () => {
        try {
          const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
          await rsGerarPostFimDeJogoSeNecessario(jogo, jogo.placar_casa ?? 0, jogo.placar_fora ?? 0, competicaoAtual);
        } catch (e) {
          console.error("Falha ao gerar post (backfill) de fim de jogo:", e);
        }
      })();
    }
    return jogo;
  }

  if (jogo.computado === true) return jogo;

  const minuto = minutoAtualDoJogo(jogo);
  if (minuto === null || minuto < MINUTOS_JOGO) return jogo;

  const { pc, pf } = await calcularPlacarPorEventosCompartilhado(jogo);

  // Três formatos possíveis de jogo, cada um ajusta uma tabela diferente
  // (ou nenhuma):
  // - Pontos corridos (Brasileirão, ou qualquer jogo sem grupo/fase de
  //   mata-mata): soma na tabela de "times" como sempre funcionou.
  // - Fase de grupos de Libertadores/Sul-Americana (jogo.grupo_id
  //   preenchido): soma na tabela separada "grupos_classificacao",
  //   sem tocar nas colunas de "times".
  // - Mata-mata (jogo.fase em oitavas/quartas/semifinal/final): não
  //   ajusta tabela nenhuma — só atualiza o agregado do confronto e,
  //   se possível, já define quem avança.
  const ehMataMata = jogo.fase && jogo.fase !== "grupos";
  const ehFaseDeGrupo = !ehMataMata && jogo.grupo_id;

  if (ehMataMata) {
    // Mata-mata não ajusta tabela nenhuma aqui — o fechamento do
    // confronto (mmAtualizarConfrontoAposJogo) só acontece MAIS ABAIXO,
    // depois que este jogo já estiver salvo como Encerrado/computado no
    // banco, porque aquela função relê os jogos do confronto pelo banco
    // pra saber se ida e volta já terminaram.
  } else if (ehFaseDeGrupo) {
    if (typeof gpAjustarClassificacaoGrupo === "function") {
      const resultadoAjuste = await gpAjustarClassificacaoGrupo(jogo, pc, pf, "somar");
      if (!resultadoAjuste.ok) {
        console.error("Falha ao ajustar classificação do grupo:", resultadoAjuste.error);
        return jogo;
      }
    }
  } else {
    const resultadoAjuste = await ajustarTabelaClassificacao(jogo, pc, pf, "somar");
    if (!resultadoAjuste.ok) {
      console.error("Falha ao encerrar jogo automaticamente:", resultadoAjuste.error);
      return jogo;
    }
  }

  const resultadoEstatisticas = await reaplicarEstatisticasEventosDoJogo(jogo.id);
  if (!resultadoEstatisticas.ok) {
    console.error("Falha ao reaplicar gols/assistências/cartões:", resultadoEstatisticas.error);
    return jogo;
  }

  const atualizacao = { computado: true, status: "Encerrado", placar_casa: pc, placar_fora: pf };
  const { error: erroUpdate } = await supabaseClient.from("jogos").update(atualizacao).eq("id", jogo.id);
  if (erroUpdate) {
    console.error("Falha ao salvar jogo encerrado:", erroUpdate);
    return jogo;
  }

  // Só agora, com o jogo já salvo como Encerrado/computado no banco, dá
  // pra checar com segurança se o confronto de mata-mata (ida+volta, ou
  // o jogo único da final) já terminou por completo.
  if (ehMataMata && typeof mmAtualizarConfrontoAposJogo === "function" && jogo.confronto_id) {
    const resultadoConfronto = await mmAtualizarConfrontoAposJogo(jogo.confronto_id);
    if (!resultadoConfronto.ok) {
      console.error("Falha ao atualizar confronto de mata-mata:", resultadoConfronto.error);
    }
  }

  // Post automático de "Fim de jogo" no perfil dos dois clubes. Não usa
  // await de propósito: não queremos atrasar a tela esperando o upload
  // da arte pro Storage — se falhar, só loga o erro (ver
  // rsGerarPostFimDeJogoSeNecessario) e o jogo continua encerrando normalmente.
  if (typeof rsGerarPostFimDeJogoSeNecessario === "function" && jogo.time_casa && jogo.time_fora) {
    (async () => {
      try {
        const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
        await rsGerarPostFimDeJogoSeNecessario(jogo, pc, pf, competicaoAtual);
      } catch (e) {
        console.error("Falha ao gerar post automático de fim de jogo:", e);
      }
    })();
  }

  return { ...jogo, ...atualizacao };
}

// Retorna { pc, pf, minutoAoVivo, statusExibido, emAndamento, temPlacar }
// calculando o placar corretamente conforme o estado do jogo:
// - ainda não começou: 0x0, sem placar (VS)
// - em andamento: soma só os gols com minuto <= minuto atual
// - encerrado: usa o placar final salvo (jogo.placar_casa/fora)
function estadoAoVivoDoJogo(jogo, eventosGol) {
  const minutoAoVivo = minutoAtualDoJogo(jogo);
  const jaEncerrado = jogo.status === "Encerrado";
  const aindaNaoComecou = !jaEncerrado && minutoAoVivo === null;
  const emAndamento = !jaEncerrado && !aindaNaoComecou && minutoAoVivo < MINUTOS_JOGO;

  const statusExibido = jogo.status === "Adiado"
    ? "Adiado"
    : jaEncerrado
      ? "Encerrado"
      : emAndamento
        ? "Em andamento"
        : "Agendado";

  const temPlacar = jaEncerrado || emAndamento;

  let pc = jogo.placar_casa ?? 0;
  let pf = jogo.placar_fora ?? 0;

  if (!jaEncerrado) {
    const eventos = (eventosGol || []).filter(e =>
      aindaNaoComecou ? false : (emAndamento ? (e.minuto ?? 0) <= minutoAoVivo : true)
    );

    pc = 0; pf = 0;
    eventos.forEach(e => {
      const eDoTimeCasa = e.time_id === jogo.time_casa_id;
      const eDoTimeFora = e.time_id === jogo.time_fora_id;
      if (e.tipo === "Gol" || e.tipo === "Pênalti Marcado") {
        if (eDoTimeCasa) pc++;
        else if (eDoTimeFora) pf++;
      } else if (e.tipo === "Gol Contra") {
        if (eDoTimeCasa) pf++;
        else if (eDoTimeFora) pc++;
      }
    });
  }

  return { pc, pf, minutoAoVivo, statusExibido, emAndamento, temPlacar };
}

// Rótulo do "quando" de um jogo: fase/perna no mata-mata (Copa do
// Brasil), "Nª rodada" nos demais. Compartilhado por jogoCardHtml
// (scoreboard, usado em home/jogos/detalhes) e por quem precisar do
// mesmo rótulo em outro lugar — evita duplicar essa lógica.
const NOMES_FASE_MATA_MATA = { oitavas: "Oitavas", quartas: "Quartas", semifinal: "Semifinal", final: "Final" };

function rotuloRodadaOuFase(jogo) {
  if (!jogo.fase || jogo.fase === "grupos") return `${jogo.rodada}ª rodada`;
  const perna = jogo.perna === "ida" ? " • Ida" : jogo.perna === "volta" ? " • Volta" : "";
  return `${NOMES_FASE_MATA_MATA[jogo.fase] || jogo.fase}${perna}`;
}

// Card de jogo (scoreboard) reutilizado em home, jogos e detalhes.
// eventosGol é opcional: se não for passado, mostra o placar salvo
// (comportamento antigo, só correto quando o jogo já está encerrado).
function jogoCardHtml(jogo, eventosGol) {
  const casa = jogo.time_casa;
  const fora = jogo.time_fora;

  const { pc, pf, minutoAoVivo, statusExibido, emAndamento, temPlacar } = estadoAoVivoDoJogo(jogo, eventosGol);

  return `
    <div class="scoreboard" onclick="location.href='jogo?id=${jogo.id}'">
      <div class="scoreboard-top">
        <span class="scoreboard-meta">${rotuloRodadaOuFase(jogo)}</span>
        <span class="status-pill ${statusClasse(statusExibido)}">${emAndamento ? `${minutoAoVivo}'` : statusExibido}</span>
      </div>
      <div class="scoreboard-main">
        <div class="time-col esquerda">
          ${escudoHtml(casa)}
          <span class="time-nome">${casa ? casa.nome : "—"}</span>
        </div>
        <div class="${temPlacar ? 'placar-display' : 'placar-vs'}">
          ${temPlacar
            ? `${pc}<span class="sep">:</span>${pf}`
            : `VS`}
        </div>
        <div class="time-col direita">
          ${escudoHtml(fora)}
          <span class="time-nome">${fora ? fora.nome : "—"}</span>
        </div>
      </div>
      <div class="scoreboard-info">
        <span>📍 ${jogo.local || "Local a definir"}</span>
        <span>${formatarData(jogo.data_jogo)} ${jogo.hora_jogo || ""}</span>
      </div>
    </div>
  `;
}

// =========================================================
// MATA-MATA (Copa do Brasil) — chaveamento compartilhado
// Usado por classificacao.js (chaveamento completo) e home.js
// (resumo na Home), pra não duplicar a mesma lógica de HTML.
// =========================================================

const MM_NOME_FASE = { oitavas: "Oitavas", quartas: "Quartas", semifinal: "Semifinal", final: "Final" };
const MM_ORDEM_FASE = ["oitavas", "quartas", "semifinal", "final"];

function mmBracketColunaHtml(fase, confrontos) {
  const confrontosFase = confrontos.filter(c => c.fase === fase).sort((a, b) => a.ordem - b.ordem);
  if (!confrontosFase.length) return "";

  return `
    <div class="cdb-bracket-coluna">
      <h3>${MM_NOME_FASE[fase]}</h3>
      ${confrontosFase.map(mmBracketConfrontoCardHtml).join("")}
    </div>
  `;
}

function mmBracketConfrontoCardHtml(confronto) {
  const timeA = confronto.time_a;
  const timeB = confronto.time_b;
  const vencedor = confronto.vencedor;

  const linhaTime = (time, golsAgregado) => `
    <div class="cdb-jogo-linha" style="cursor:default;">
      <span class="${vencedor && time && vencedor.id === time.id ? 'cdb-vencedor' : ''}">${time ? time.nome : 'A definir'}</span>
      <span>${confronto.vencedor_id || confronto.agregado_a || confronto.agregado_b ? golsAgregado : ''}</span>
    </div>
  `;

  const penaltisTxt = confronto.foi_penaltis ? `<div class="cdb-confronto-sub">Pênaltis: ${confronto.penaltis_a}-${confronto.penaltis_b}</div>` : "";

  return `
    <div class="cdb-confronto-card ${vencedor ? 'cdb-definido' : ''}" onclick="mmAbrirPrimeiroJogoBracket('${confronto.id}')">
      ${linhaTime(timeA, confronto.agregado_a)}
      ${linhaTime(timeB, confronto.agregado_b)}
      ${penaltisTxt}
    </div>
  `;
}

async function mmAbrirPrimeiroJogoBracket(confrontoId) {
  const { data: jogos } = await supabaseClient
    .from("jogos")
    .select("id, perna")
    .eq("confronto_id", confrontoId)
    .order("perna", { ascending: true });

  if (jogos && jogos.length) {
    window.location.href = `jogo?id=${jogos[0].id}`;
  }
}

// =========================================================
// MATA-MATA (Copa do Brasil) — fechamento de confronto
// =========================================================
//
// Chamada por checarEncerramentoAutomatico() sempre que um jogo com
// jogo.fase preenchida (oitavas/quartas/semifinal/final) acaba de ser
// encerrado. Não mexe na tabela "times" (mata-mata não tem
// classificação) — só recalcula o agregado do confronto e, se possível,
// já define quem avança.
//
// Schema (confrontos_mata_mata): agregado_a, agregado_b, situacao
// ('aguardando' | 'em_andamento' | 'penaltis' | 'definido'), vencedor_id,
// foi_penaltis, penaltis_a, penaltis_b.
// jogos.perna: 'ida' | 'volta' | 'unica' (final é sempre jogo único,
// perna = 'unica' — não existe coluna ida_volta; usamos fase === 'final'
// pra saber se o confronto é de jogo único).
//
// Retorna { ok: true } em caso de sucesso, ou { ok:false, error } se
// alguma consulta/gravação falhar (o chamador só loga e não trava o
// encerramento do jogo em si, que já foi salvo antes desta chamada).
async function mmAtualizarConfrontoAposJogo(confrontoId) {
  const { data: confronto, error: erroConfronto } = await supabaseClient
    .from("confrontos_mata_mata")
    .select("*")
    .eq("id", confrontoId)
    .single();

  if (erroConfronto || !confronto) {
    return { ok: false, error: erroConfronto || { message: "Confronto não encontrado." } };
  }

  // Já tem vencedor definido (ex: reprocessamento) — nada a fazer.
  if (confronto.vencedor_id) return { ok: true };

  const { data: jogosConfronto, error: erroJogos } = await supabaseClient
    .from("jogos")
    .select("*")
    .eq("confronto_id", confrontoId);

  if (erroJogos) return { ok: false, error: erroJogos };

  const jogos = jogosConfronto || [];
  const jogosNecessarios = confronto.fase === "final" ? 1 : 2;

  // Só fecha o confronto quando TODOS os jogos dele já estiverem
  // encerrados e computados — senão fica esperando (ex: jogo de ida
  // encerrado, volta ainda não rolou).
  const todosEncerrados = jogos.length === jogosNecessarios &&
    jogos.every(j => j.status === "Encerrado" && j.computado === true);

  if (!todosEncerrados) return { ok: true };

  // Placar agregado: time_a soma os gols que fez em cada jogo
  // (independente de ter mandado ou visitado), mesma lógica pra time_b.
  let golsA = 0;
  let golsB = 0;
  jogos.forEach(j => {
    const casaEhA = j.time_casa_id === confronto.time_a_id;
    const pc = j.placar_casa ?? 0;
    const pf = j.placar_fora ?? 0;
    if (casaEhA) { golsA += pc; golsB += pf; }
    else { golsA += pf; golsB += pc; }
  });

  const atualizacaoConfronto = {
    agregado_a: golsA,
    agregado_b: golsB,
  };

  if (golsA !== golsB) {
    // Sem empate no agregado: já dá pra definir o vencedor sem pênaltis.
    atualizacaoConfronto.situacao = "definido";
    atualizacaoConfronto.vencedor_id = golsA > golsB ? confronto.time_a_id : confronto.time_b_id;
  } else {
    // Empatou no agregado (ou na final) — fica esperando o admin
    // lançar o placar dos pênaltis (aba Copa do Brasil).
    atualizacaoConfronto.situacao = "penaltis";
  }

  const { error: erroUpdate } = await supabaseClient
    .from("confrontos_mata_mata")
    .update(atualizacaoConfronto)
    .eq("id", confrontoId);

  if (erroUpdate) return { ok: false, error: erroUpdate };

  return { ok: true };
}
