// =========================================================
// DETALHES DO JOGO — "Matchcenter"
// Inspirado em Sofascore / 365Scores / OneFootball:
// placar em destaque no topo + abas (Resumo, Escalações, Estatísticas)
// =========================================================

const ICONES_EVENTO = {
  "Gol": "⚽",
  "Gol Contra": "⚽",
  "Pênalti Marcado": "🥅",
  "Pênalti Perdido": "❌",
  "Cartão Amarelo": "🟨",
  "Cartão Vermelho": "🟥",
  "Substituição": "🔄",
  "Escalação Divulgada": "📋",
  "Início de Jogo": "🏁",
  "Fim de Jogo": "⏱️",
  "Outro": "📝",
};

// Tipos que aparecem centralizados na timeline (marco do jogo, não são
// de um time específico) em vez de alinhados casa/fora.
const EVENTOS_MARCO = new Set(["Início de Jogo", "Fim de Jogo", "Escalação Divulgada"]);

let mcJogoAtual = null;
let mcAbaAtiva = "resumo";

async function carregarDetalhes() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const area = document.getElementById("detalhesJogo");

  if (!id) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Jogo não encontrado</h3></div>`;
    return;
  }

  const { data: jogo, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .eq("id", id)
    .single();

  if (error || !jogo) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar jogo</h3><p>${error?.message || ""}</p></div>`;
    return;
  }

  const jogoAtualizado = await checarEncerramentoAutomatico(jogo);
  Object.assign(jogo, jogoAtualizado);

  const { data: eventos } = await supabaseClient
    .from("eventos_jogo")
    .select("*")
    .eq("jogo_id", id)
    .order("minuto", { ascending: true });

  const { data: escalacoes } = await supabaseClient
    .from("escalacoes_jogo")
    .select("*")
    .eq("jogo_id", id);

  mcJogoAtual = jogo;

  const estado = estadoAoVivoDoJogo(
    jogo,
    (eventos || []).filter(e => e.tipo === "Gol" || e.tipo === "Gol Contra" || e.tipo === "Pênalti Marcado")
  );

  // Timeline e escalações só mostram o que já "aconteceu" até o minuto
  // atual, igual à lógica de placar ao vivo já usada no site.
  const eventosVisiveis = filtrarEventosVisiveis(eventos || [], estado);

  area.innerHTML = `
    ${mcHeroHtml(jogo, estado)}
    ${mcTabsHtml()}
    <div id="mcPainelResumo" class="mc-panel ${mcAbaAtiva === "resumo" ? "" : "hidden"}">
      ${mcResumoHtml(jogo, eventosVisiveis, estado)}
    </div>
    <div id="mcPainelEscalacoes" class="mc-panel ${mcAbaAtiva === "escalacoes" ? "" : "hidden"}">
      ${mcEscalacoesHtml(jogo, escalacoes || [], estado)}
    </div>
    <div id="mcPainelEstatisticas" class="mc-panel ${mcAbaAtiva === "estatisticas" ? "" : "hidden"}">
      ${mcEstatisticasHtml(jogo)}
    </div>
  `;
}

// Enquanto o jogo não começou, não mostra eventos. Enquanto está em
// andamento, só mostra até o minuto ao vivo. Encerrado, mostra tudo.
function filtrarEventosVisiveis(eventos, estado) {
  if (estado.statusExibido === "Agendado") return [];
  if (estado.emAndamento) return eventos.filter(e => (e.minuto ?? 0) <= estado.minutoAoVivo);
  return eventos;
}

// ---------- HERO (placar) ----------

function mcHeroHtml(jogo, estado) {
  const casa = jogo.time_casa;
  const fora = jogo.time_fora;
  const { minutoAoVivo, statusExibido, emAndamento, temPlacar, pc, pf } = estado;

  const subinfo = emAndamento
    ? `<span class="minuto-live">${minutoAoVivo}'</span>`
    : `<span class="subinfo">${statusExibido}</span>`;

  return `
    <div class="mc-hero">
      <div class="mc-hero-top">
        <span class="scoreboard-meta">${jogo.rodada}ª rodada</span>
        <span class="status-pill ${statusClasse(statusExibido)}">
          ${emAndamento ? `<span class="mc-status-live"><span class="dot"></span>${minutoAoVivo}' AO VIVO</span>` : statusExibido}
        </span>
      </div>

      <div class="mc-teams">
        <div class="mc-team">
          ${escudoHtml(casa, "escudo")}
          <span class="time-nome">${casa ? casa.nome : "—"}</span>
        </div>
        <div class="mc-placar">
          <div class="numeros">
            ${temPlacar
              ? `<span>${pc}</span><span class="sep">:</span><span>${pf}</span>`
              : `<span class="vs">VS</span>`}
          </div>
          ${subinfo}
        </div>
        <div class="mc-team">
          ${escudoHtml(fora, "escudo")}
          <span class="time-nome">${fora ? fora.nome : "—"}</span>
        </div>
      </div>

      <div class="mc-info-row">
        <span>📍 ${jogo.local || "Local a definir"}</span>
        <span>📅 ${formatarData(jogo.data_jogo)}${jogo.hora_jogo ? " • " + jogo.hora_jogo : ""}</span>
        ${jogo.capacidade ? `<span>🏟️ ${jogo.capacidade} lugares</span>` : ""}
      </div>

      ${jogo.foto_estadio ? `<img class="mc-estadio-foto" src="${jogo.foto_estadio}" alt="Estádio">` : ""}
    </div>
  `;
}

// ---------- TABS ----------

function mcTabsHtml() {
  const abas = [
    { id: "resumo", label: "Resumo" },
    { id: "escalacoes", label: "Escalações" },
    { id: "estatisticas", label: "Estatísticas" },
  ];
  return `
    <div class="mc-tabs">
      ${abas.map(a => `
        <button class="mc-tab-btn ${mcAbaAtiva === a.id ? "active" : ""}" onclick="mcAbrirAba('${a.id}', this)">
          ${a.label}
        </button>
      `).join("")}
    </div>
  `;
}

function mcAbrirAba(id, btn) {
  mcAbaAtiva = id;
  document.querySelectorAll(".mc-panel").forEach(p => p.classList.add("hidden"));
  document.getElementById(`mcPainel${id.charAt(0).toUpperCase() + id.slice(1)}`).classList.remove("hidden");
  document.querySelectorAll(".mc-tab-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

// ---------- RESUMO (timeline de eventos) ----------

function mcResumoHtml(jogo, eventos, estado) {
  const casa = jogo.time_casa;
  const fora = jogo.time_fora;

  if (estado.statusExibido === "Agendado") {
    return `
      <div class="card">
        <div class="empty-state" style="padding:30px 20px;">
          <div class="icon">⏳</div>
          <h3>O jogo ainda não começou</h3>
          <p>Os eventos da partida vão aparecer aqui assim que a bola rolar.</p>
        </div>
      </div>
    `;
  }

  if (!eventos.length) {
    return `
      <div class="card">
        <div class="empty-state" style="padding:30px 20px;">
          <div class="icon">📋</div>
          <h3>Nenhum evento registrado ainda</h3>
        </div>
      </div>
    `;
  }

  const linhas = eventos.map(e => mcTimelineLinhaHtml(e, casa, fora)).join("");

  return `
    <div class="card">
      <h2 style="font-family:var(--font-display);font-size:22px;margin:0 0 6px;">Linha do jogo</h2>
      <div class="mc-timeline">${linhas}</div>
    </div>
  `;
}

function mcTimelineLinhaHtml(e, casa, fora) {
  const icone = ICONES_EVENTO[e.tipo] || "📝";

  if (EVENTOS_MARCO.has(e.tipo)) {
    return `<div class="mc-timeline-marco">${icone} ${e.tipo} — ${e.minuto}'</div>`;
  }

  const doTimeCasa = e.time_id === casa?.id;
  const conteudo = `
    <span class="icone">${icone}</span>
    <span>
      <span class="nome">${e.jogador_nome || "—"}</span>
      ${e.descricao ? `<span class="desc">${e.descricao}</span>` : (e.tipo !== "Gol" ? `<span class="desc">${e.tipo}</span>` : "")}
    </span>
  `;

  return `
    <div class="mc-timeline-item">
      <div class="mc-timeline-lado ${doTimeCasa ? "" : "mc-timeline-empty"}">
        ${doTimeCasa ? conteudo : ""}
      </div>
      <div class="mc-timeline-minuto">${e.minuto}'</div>
      <div class="mc-timeline-lado direita ${doTimeCasa ? "mc-timeline-empty" : ""}">
        ${doTimeCasa ? "" : conteudo}
      </div>
    </div>
  `;
}

// ---------- ESCALAÇÕES ----------

function mcEscalacoesHtml(jogo, escalacoes, estado) {
  const casa = jogo.time_casa;
  const fora = jogo.time_fora;

  if (!escalacoes.length) {
    return `
      <div class="card">
        <div class="empty-state" style="padding:30px 20px;">
          <div class="icon">📋</div>
          <h3>Escalações ainda não divulgadas</h3>
        </div>
      </div>
    `;
  }

  const escCasa = escalacoes.filter(e => e.time_id === casa?.id);
  const escFora = escalacoes.filter(e => e.time_id === fora?.id);

  const titularesCasa = escCasa.filter(e => e.titular);
  const titularesFora = escFora.filter(e => e.titular);
  const reservasCasa = escCasa.filter(e => !e.titular);
  const reservasFora = escFora.filter(e => !e.titular);

  return `
    <div class="card">
      <div class="mc-escalacao-times">
        <div class="mc-escalacao-time-nome">${escudoHtml(casa)} ${casa ? casa.nome : "Casa"}</div>
        <div class="mc-escalacao-time-nome direita">${fora ? fora.nome : "Fora"} ${escudoHtml(fora)}</div>
      </div>

      <p class="mc-sub-titulo">Titulares</p>
      ${mcListaJogadoresHtml(titularesCasa, titularesFora)}

      ${(reservasCasa.length || reservasFora.length) ? `
        <p class="mc-sub-titulo">Reservas</p>
        ${mcListaJogadoresHtml(reservasCasa, reservasFora)}
      ` : ""}
    </div>
  `;
}

function mcListaJogadoresHtml(listaCasa, listaFora) {
  const max = Math.max(listaCasa.length, listaFora.length);
  if (max === 0) return `<p class="text-dim" style="font-size:12.5px;">Ninguém escalado ainda.</p>`;

  let linhas = "";
  for (let i = 0; i < max; i++) {
    const jc = listaCasa[i];
    const jf = listaFora[i];
    linhas += `
      <div class="mc-jogador-item" style="${jc ? "" : "visibility:hidden;"}">
        ${jc ? `<span class="numero">${i + 1}</span><span class="nome">${jc.jogador_nome}</span>${jc.posicao ? `<span class="pos">${jc.posicao}</span>` : ""}` : ""}
      </div>
      <div class="mc-jogador-item direita" style="${jf ? "" : "visibility:hidden;"}">
        ${jf ? `<span class="numero">${i + 1}</span><span class="nome">${jf.jogador_nome}</span>${jf.posicao ? `<span class="pos">${jf.posicao}</span>` : ""}` : ""}
      </div>
    `;
  }

  return `<div class="mc-lista-jogadores">${linhas}</div>`;
}

// ---------- ESTATÍSTICAS ----------

function mcEstatisticasHtml(jogo) {
  if (!jogo.estatisticas) {
    return `
      <div class="card">
        <div class="empty-state" style="padding:30px 20px;">
          <div class="icon">📊</div>
          <h3>Estatísticas ainda não informadas</h3>
        </div>
      </div>
    `;
  }

  return `
    <div class="card">
      <h2 style="font-family:var(--font-display);font-size:22px;margin:0 0 10px;">Estatísticas</h2>
      <p class="text-dim" style="font-size:13.5px;line-height:1.6;white-space:pre-line;">${jogo.estatisticas}</p>
    </div>
  `;
}

carregarDetalhes();
setInterval(carregarDetalhes, 15000); // atualiza a cada 15s (jogo roda em 18min = 90')
