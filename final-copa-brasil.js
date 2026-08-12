// =========================================================
// FINAL DA COPA DO BRASIL — página standalone, fora da temporada normal
// do Brasileirão. Status ("Agendado"/"Em andamento"/"Intervalo"/
// "Encerrado") e minuto são controlados manualmente pelo admin (não corre
// 0-90' sozinho), porque os elencos dos times estão incompletos e a
// narração é feita na mão. A "linha do jogo" é só texto (narração tipo
// 365Scores/SofaScore), sem campinho gráfico com bonecos.
// =========================================================

const FCB_ID_FIXO_STORAGE_KEY = "finalCopaBrasilId"; // cacheia o id encontrado, evita re-consultar toda hora

const FCB_ICONES_EVENTO = {
  "Gol": "⚽",
  "Gol Contra": "⚽",
  "Pênalti Marcado": "🥅",
  "Pênalti Perdido": "❌",
  "Cartão Amarelo": "🟨",
  "Cartão Vermelho": "🟥",
  "Substituição": "🔄",
  "Início de Jogo": "🏁",
  "Intervalo": "⏸️",
  "Fim de Jogo": "⏱️",
  "Narração": "📝",
};

const FCB_EVENTOS_MARCO = new Set(["Início de Jogo", "Intervalo", "Fim de Jogo", "Narração"]);

const FCB_TIPOS_COM_BOLHA = new Set([
  "Gol", "Gol Contra", "Pênalti Marcado", "Pênalti Perdido",
  "Cartão Amarelo", "Cartão Vermelho", "Substituição",
]);

let fcbFinalAtual = null;
let fcbEventosVistosIds = null;
let fcbFilaBolhas = [];
let fcbBolhaExibindo = false;
const FCB_BOLHA_DURACAO_MS = 10000;
const FCB_BOLHA_ANIM_MS = 250;

function fcbClasseBolha(tipo) {
  switch (tipo) {
    case "Gol":
    case "Pênalti Marcado": return "gol";
    case "Gol Contra": return "gol-contra";
    case "Cartão Amarelo": return "cartao-amarelo";
    case "Cartão Vermelho": return "cartao-vermelho";
    case "Substituição": return "substituicao";
    default: return "";
  }
}

function fcbTituloBolha(e, nomeTime) {
  const time = nomeTime ? ` do ${nomeTime}` : "";
  switch (e.tipo) {
    case "Gol": return `⚽ Goooool${time}!`;
    case "Pênalti Marcado": return `🥅 Gol de pênalti${time}!`;
    case "Gol Contra": return `⚽ Gol contra${time}!`;
    case "Pênalti Perdido": return `❌ Pênalti perdido${time}`;
    case "Cartão Amarelo": return `🟨 Cartão amarelo${time}`;
    case "Cartão Vermelho": return `🟥 Cartão vermelho${time}`;
    case "Substituição": return `🔄 Substituição${time}`;
    default: return `${FCB_ICONES_EVENTO[e.tipo] || "📝"} ${e.tipo}${time}`;
  }
}

function fcbSubtituloBolha(e) {
  if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_secundario_nome) {
    return `${e.jogador_nome || "—"} • Assistência: ${e.jogador_secundario_nome}`;
  }
  if (e.tipo === "Substituição" && e.jogador_secundario_nome) {
    return `Sai: ${e.jogador_nome || "—"} • Entra: ${e.jogador_secundario_nome}`;
  }
  return e.jogador_nome || "";
}

function fcbEnfileirarNovosEventos(eventos, casa, fora) {
  if (fcbEventosVistosIds === null) {
    fcbEventosVistosIds = new Set(eventos.map(e => e.id));
    return;
  }

  const novos = eventos.filter(e => !fcbEventosVistosIds.has(e.id));
  novos.forEach(e => fcbEventosVistosIds.add(e.id));

  novos
    .filter(e => FCB_TIPOS_COM_BOLHA.has(e.tipo))
    .forEach(e => {
      const nomeTime = e.time_id === casa?.id ? casa?.nome : (e.time_id === fora?.id ? fora?.nome : "");
      fcbFilaBolhas.push({ evento: e, nomeTime });
    });

  fcbProcessarFilaBolhas();
}

function fcbProcessarFilaBolhas() {
  if (fcbBolhaExibindo || !fcbFilaBolhas.length) return;
  const item = fcbFilaBolhas.shift();
  fcbExibirBolha(item.evento, item.nomeTime);
}

function fcbExibirBolha(evento, nomeTime) {
  const container = document.getElementById("fcbBolhaContainer");
  if (!container) { fcbProcessarFilaBolhas(); return; }

  fcbBolhaExibindo = true;

  const el = document.createElement("div");
  el.className = `mc-evento-bolha ${fcbClasseBolha(evento.tipo)}`;
  const sub = fcbSubtituloBolha(evento);
  el.innerHTML = `
    <span class="mc-evento-bolha-icone">${FCB_ICONES_EVENTO[evento.tipo] || "📝"}</span>
    <div class="mc-evento-bolha-texto">
      <div class="mc-evento-bolha-titulo">${fcbTituloBolha(evento, nomeTime)}</div>
      ${sub ? `<div class="mc-evento-bolha-sub">${sub}</div>` : ""}
    </div>
    <span class="mc-evento-bolha-minuto">${evento.minuto}'</span>
  `;
  container.appendChild(el);

  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("mc-evento-bolha-mostrar")));

  setTimeout(() => {
    el.classList.remove("mc-evento-bolha-mostrar");
    el.classList.add("mc-evento-bolha-sair");
    setTimeout(() => {
      el.remove();
      fcbBolhaExibindo = false;
      fcbDestacarNaTimeline(evento.id);
      fcbProcessarFilaBolhas();
    }, FCB_BOLHA_ANIM_MS);
  }, FCB_BOLHA_DURACAO_MS);
}

function fcbDestacarNaTimeline(eventoId) {
  const linha = document.querySelector(`.mc-timeline-item[data-evento-id="${eventoId}"], .mc-timeline-marco[data-evento-id="${eventoId}"]`);
  if (!linha) return;
  linha.classList.add("destaque");
  setTimeout(() => linha.classList.remove("destaque"), 4000);
}

// Busca o registro da final. Como é uma linha só (jogo único standalone),
// pega sempre o mais recente criado — assim, se um dia quiserem reusar a
// tabela pra outra final, só cadastrar de novo que ela passa a valer.
async function fcbBuscarFinal() {
  const { data, error } = await supabaseClient
    .from("final_copa_brasil")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function fcbCarregarDetalhes() {
  const area = document.getElementById("detalhesFinal");

  try {
    const final = await fcbBuscarFinal();

    if (!final) {
      area.innerHTML = `
        <div class="empty-state">
          <div class="icon">🏆</div>
          <h3>Final ainda não cadastrada</h3>
          <p>Volte em breve — a final da Copa do Brasil aparece aqui assim que for cadastrada.</p>
        </div>
      `;
      return;
    }

    fcbFinalAtual = final;

    const { data: eventos, error: erroEventos } = await supabaseClient
      .from("final_copa_brasil_eventos")
      .select("*")
      .eq("final_id", final.id)
      .order("minuto", { ascending: true })
      .order("criado_em", { ascending: true });

    if (erroEventos) console.error("Erro ao carregar eventos da final:", erroEventos);

    const eventosLista = eventos || [];

    fcbEnfileirarNovosEventos(eventosLista, final.time_casa, final.time_fora);

    area.innerHTML = `
      ${fcbHeroHtml(final)}
      ${fcbResumoHtml(final, eventosLista)}
      ${fcbArbitragemCardHtml(final)}
    `;
  } catch (e) {
    console.error("Falha ao carregar a final:", e);
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar a final</h3><p>${e?.message || "Tente recarregar a página."}</p></div>`;
  }
}

// ---------- HERO (placar) ----------

function fcbHeroHtml(final) {
  const casa = final.time_casa;
  const fora = final.time_fora;
  const emAndamento = final.status === "Em andamento";
  const temPlacar = final.placar_casa !== null && final.placar_fora !== null;

  const subinfo = emAndamento
    ? `<span class="minuto-live">${final.minuto_atual ?? 0}'</span>`
    : `<span class="subinfo">${final.status}</span>`;

  const penaltisTxt = (final.penaltis_casa !== null && final.penaltis_fora !== null)
    ? `<div class="mc-info-row"><span>🥅 Pênaltis: ${final.penaltis_casa} x ${final.penaltis_fora}</span></div>`
    : "";

  return `
    <div class="mc-hero">
      <div class="mc-hero-top">
        <span class="scoreboard-meta">🏆 Final única</span>
        <span class="status-pill ${statusClasse(final.status === "Intervalo" ? "Em andamento" : final.status)}">
          ${emAndamento ? `<span class="mc-status-live"><span class="dot"></span>${final.minuto_atual ?? 0}' AO VIVO</span>` : final.status}
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
              ? `<span>${final.placar_casa}</span><span class="sep">:</span><span>${final.placar_fora}</span>`
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
        <span>📍 ${final.local || "Local a definir"}</span>
        <span>📅 ${formatarData(final.data_jogo)}${final.hora_jogo ? " • " + final.hora_jogo : ""}</span>
      </div>
      ${penaltisTxt}
    </div>
  `;
}

// ---------- RESUMO / NARRAÇÃO (texto, sem campinho gráfico) ----------

function fcbResumoHtml(final, eventos) {
  if (final.status === "Agendado") {
    return `
      <div class="card">
        <div class="empty-state" style="padding:30px 20px;">
          <div class="icon">⏳</div>
          <h3>A final ainda não começou</h3>
          <p>A narração da partida vai aparecer aqui assim que a bola rolar.</p>
        </div>
      </div>
    `;
  }

  if (!eventos.length) {
    return `
      <div class="card">
        <div class="empty-state" style="padding:30px 20px;">
          <div class="icon">📋</div>
          <h3>Nenhum lance narrado ainda</h3>
        </div>
      </div>
    `;
  }

  const casa = final.time_casa;
  const fora = final.time_fora;
  const linhas = eventos.map(e => fcbTimelineLinhaHtml(e, casa, fora)).join("");

  return `
    <div class="card">
      <h2 style="font-family:var(--font-display);font-size:22px;margin:0 0 6px;">Narração da final</h2>
      <div class="mc-timeline">${linhas}</div>
    </div>
  `;
}

function fcbTimelineLinhaHtml(e, casa, fora) {
  const icone = FCB_ICONES_EVENTO[e.tipo] || "📝";

  if (FCB_EVENTOS_MARCO.has(e.tipo)) {
    const texto = e.tipo === "Narração" ? (e.descricao || "") : e.tipo;
    return `<div class="mc-timeline-marco" data-evento-id="${e.id}">${icone} ${texto} — ${e.minuto}'</div>`;
  }

  let legenda = "";
  if (e.tipo === "Substituição" && e.jogador_secundario_nome) {
    legenda = `Entra: ${e.jogador_secundario_nome}`;
  } else if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_secundario_nome) {
    legenda = `Assistência: ${e.jogador_secundario_nome}`;
  } else if (e.tipo !== "Gol") {
    legenda = e.tipo;
  }
  if (e.descricao) legenda = legenda ? `${legenda} • ${e.descricao}` : e.descricao;

  const doTimeCasaBase = e.time_id === casa?.id;
  const doTimeCasa = e.tipo === "Gol Contra" ? !doTimeCasaBase : doTimeCasaBase;
  const conteudo = `
    <span class="icone">${icone}</span>
    <span>
      <span class="nome">${e.jogador_nome || "—"}</span>
      ${legenda ? `<span class="desc">${legenda}</span>` : ""}
    </span>
  `;

  return `
    <div class="mc-timeline-item" data-evento-id="${e.id}">
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

// ---------- ARBITRAGEM ----------

function fcbArbitragemCardHtml(final) {
  const funcoes = [
    { chave: "arbitro", label: "Árbitro" },
    { chave: "assistente_1", label: "1º Assistente" },
    { chave: "assistente_2", label: "2º Assistente" },
    { chave: "quarto_arbitro", label: "4º Árbitro" },
  ];

  const algumDefinido = funcoes.some(f => final[f.chave]);
  if (!algumDefinido) return "";

  return `
    <div class="card" style="margin-top:16px;">
      <h2 style="font-family:var(--font-display);font-size:20px;margin:0 0 10px;">🧑‍⚖️ Arbitragem</h2>
      <div class="mc-arbitragem-lista">
        ${funcoes.map(f => `
          <div class="mc-arbitro-item">
            <span class="mc-arbitro-funcao">${f.label}</span>
            <span class="mc-arbitro-nome">${final[f.chave] || "—"}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

fcbCarregarDetalhes();
setInterval(fcbCarregarDetalhes, 8000); // final é evento especial: atualiza mais rápido que o resto do site
