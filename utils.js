// =========================================================
// UTILITÁRIOS COMPARTILHADOS
// =========================================================

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

// Busca a temporada ativa (a maioria das telas só precisa do id dela)
async function getTemporadaAtiva() {
  const { data, error } = await supabaseClient
    .from("temporadas")
    .select("*")
    .eq("ativa", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

// Aplica a classe "active" no item certo da navbar, com base no arquivo atual
function marcarNavAtiva() {
  const pagina = window.location.pathname.split("/").pop() || "index.html";
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

// Converte o valor salvo de hora_inicio_simulacao (vindo do input
// datetime-local, ex: "2026-07-08T21:00") para timestamp local real,
// SEM deixar o JS/Postgres reinterpretar como UTC. O datetime-local
// não carrega fuso horário, então tratamos sempre como horário local
// de quem cadastrou o jogo.
function parseHoraInicioSimulacaoLocal(valor) {
  if (!valor) return null;

  // Pode vir como "2026-07-08T21:00", "2026-07-08T21:00:00" ou
  // já com fuso (ex: terminando em Z ou +00:00) se o banco devolveu
  // um timestamptz. Extraímos sempre os componentes de data/hora
  // "de parede" e montamos um Date local com eles.
  const match = valor.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return null;

  const [, ano, mes, dia, hora, minuto] = match;
  return new Date(
    Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto)
  ).getTime();
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

// Desfaz nas estatísticas dos jogadores (gols, assistências, cartões)
// tudo o que os eventos_jogo de um jogo geraram. Usada ao descomputar
// um jogo, pra que a artilharia/estatísticas voltem a ficar corretas
// e batam com o placar e os eventos, permitindo editar tudo de novo
// sem duplicar contagem quando o jogo for recomputado.
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
    if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_secundario_id && mapaJogadores[e.jogador_secundario_id]) {
      mapaJogadores[e.jogador_secundario_id].assistencias = Math.max((mapaJogadores[e.jogador_secundario_id].assistencias || 0) - 1, 0);
    }
    if (e.tipo === "Cartão Amarelo" && e.jogador_id && mapaJogadores[e.jogador_id]) {
      mapaJogadores[e.jogador_id].cartoes_amarelos = Math.max((mapaJogadores[e.jogador_id].cartoes_amarelos || 0) - 1, 0);
    }
    if (e.tipo === "Cartão Vermelho" && e.jogador_id && mapaJogadores[e.jogador_id]) {
      mapaJogadores[e.jogador_id].cartoes_vermelhos = Math.max((mapaJogadores[e.jogador_id].cartoes_vermelhos || 0) - 1, 0);
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
      })
      .eq("id", jogadorId);
    if (erroUpdate) return { ok: false, error: erroUpdate };
  }

  return { ok: true };
}

// Reaplica nas estatísticas dos jogadores (gols, assistências, cartões)
// tudo o que os eventos_jogo de um jogo já lançados representam.
// Espelho de desfazerEstatisticasEventosDoJogo, usada ao encerrar/
// recomputar um jogo que foi descomputado antes (pra não perder os
// gols/cartões que tinham sido zerados no jogador ao descomputar).
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

  (eventos || []).forEach(e => {
    if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_id && mapaJogadores[e.jogador_id]) {
      mapaJogadores[e.jogador_id].gols = (mapaJogadores[e.jogador_id].gols || 0) + 1;
    }
    if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_secundario_id && mapaJogadores[e.jogador_secundario_id]) {
      mapaJogadores[e.jogador_secundario_id].assistencias = (mapaJogadores[e.jogador_secundario_id].assistencias || 0) + 1;
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
      })
      .eq("id", jogadorId);
    if (erroUpdate) return { ok: false, error: erroUpdate };
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
  if (jogo.computado === true) return jogo;
  if (jogo.status === "Encerrado") return jogo;

  const minuto = minutoAtualDoJogo(jogo);
  if (minuto === null || minuto < MINUTOS_JOGO) return jogo;

  const { pc, pf } = await calcularPlacarPorEventosCompartilhado(jogo);
  const resultadoAjuste = await ajustarTabelaClassificacao(jogo, pc, pf, "somar");
  if (!resultadoAjuste.ok) {
    console.error("Falha ao encerrar jogo automaticamente:", resultadoAjuste.error);
    return jogo;
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

// Card de jogo (scoreboard) reutilizado em home, jogos e detalhes.
// eventosGol é opcional: se não for passado, mostra o placar salvo
// (comportamento antigo, só correto quando o jogo já está encerrado).
function jogoCardHtml(jogo, eventosGol) {
  const casa = jogo.time_casa;
  const fora = jogo.time_fora;

  const { pc, pf, minutoAoVivo, statusExibido, emAndamento, temPlacar } = estadoAoVivoDoJogo(jogo, eventosGol);

  return `
    <div class="scoreboard" onclick="location.href='jogo.html?id=${jogo.id}'">
      <div class="scoreboard-top">
        <span class="scoreboard-meta">${jogo.rodada}ª rodada</span>
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
