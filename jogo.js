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

// ---------- BOLHA DE EVENTO AO VIVO ----------
// Controla quais eventos já foram "vistos" (pra só notificar o que é novo
// desde o último carregamento) e a fila de bolhas exibidas na aba Resumo,
// no estilo de notificação ao vivo do 365Scores / SofaScore.
let mcEventosVistosIds = null; // null = ainda não inicializado (1ª carga não notifica nada)
const MC_BOLHA_DURACAO_MS = 10000;
const MC_BOLHA_ANIM_MS = 250;
let mcFilaBolhas = [];
let mcBolhaExibindo = false;

// Tipos de evento que geram bolha de notificação (marcos e eventos
// "silenciosos" como escalação divulgada não precisam de bolha).
const MC_TIPOS_COM_BOLHA = new Set([
  "Gol",
  "Gol Contra",
  "Pênalti Marcado",
  "Pênalti Perdido",
  "Cartão Amarelo",
  "Cartão Vermelho",
  "Substituição",
]);

function mcClasseBolha(tipo) {
  switch (tipo) {
    case "Gol":
    case "Pênalti Marcado":
      return "gol";
    case "Gol Contra":
      return "gol-contra";
    case "Cartão Amarelo":
      return "cartao-amarelo";
    case "Cartão Vermelho":
      return "cartao-vermelho";
    case "Substituição":
      return "substituicao";
    default:
      return "";
  }
}

// Monta o título da bolha, ex: "Goool de Fulano do Time!" — no padrão
// pedido, similar ao que 365Scores/SofaScore mostram.
function mcTituloBolha(e, nomeTime) {
  const time = nomeTime ? ` do ${nomeTime}` : "";
  switch (e.tipo) {
    case "Gol":
      return `⚽ Goooool${time}!`;
    case "Pênalti Marcado":
      return `🥅 Gol de pênalti${time}!`;
    case "Gol Contra":
      return `⚽ Gol contra${time}!`;
    case "Pênalti Perdido":
      return `❌ Pênalti perdido${time}`;
    case "Cartão Amarelo":
      return `🟨 Cartão amarelo${time}`;
    case "Cartão Vermelho":
      return `🟥 Cartão vermelho${time}`;
    case "Substituição":
      return `🔄 Substituição${time}`;
    default:
      return `${ICONES_EVENTO[e.tipo] || "📝"} ${e.tipo}${time}`;
  }
}

function mcSubtituloBolha(e) {
  if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_secundario_nome) {
    return `${e.jogador_nome || "—"} • Assistência: ${e.jogador_secundario_nome}`;
  }
  if (e.tipo === "Substituição" && e.jogador_secundario_nome) {
    return `Sai: ${e.jogador_nome || "—"} • Entra: ${e.jogador_secundario_nome}`;
  }
  return e.jogador_nome || "";
}

// Enfileira eventos novos para virarem bolha (a bolha só é exibida
// visualmente enquanto a aba Resumo estiver ativa).
function mcEnfileirarNovosEventos(eventos, casa, fora) {
  if (mcEventosVistosIds === null) {
    // Primeira carga da página: marca tudo como visto sem notificar,
    // pra não disparar uma enxurrada de bolhas de eventos antigos.
    mcEventosVistosIds = new Set(eventos.map(e => e.id));
    return;
  }

  const novos = eventos.filter(e => !mcEventosVistosIds.has(e.id));
  novos.forEach(e => mcEventosVistosIds.add(e.id));

  novos
    .filter(e => MC_TIPOS_COM_BOLHA.has(e.tipo))
    .forEach(e => {
      const nomeTime = e.time_id === casa?.id ? casa?.nome : (e.time_id === fora?.id ? fora?.nome : "");
      mcFilaBolhas.push({ evento: e, nomeTime });
    });

  mcProcessarFilaBolhas();
}

function mcProcessarFilaBolhas() {
  if (mcBolhaExibindo || !mcFilaBolhas.length) return;
  const item = mcFilaBolhas.shift();
  mcExibirBolha(item.evento, item.nomeTime);
}

function mcExibirBolha(evento, nomeTime) {
  const container = document.getElementById("mcEventoBolhaContainer");
  if (!container) { mcProcessarFilaBolhas(); return; }

  // Só mostra visualmente a bolha se a aba Resumo estiver ativa. Ainda
  // assim o evento fica marcado como "visto" e vai constar normalmente
  // na timeline do Resumo quando o usuário for olhar.
  if (mcAbaAtiva !== "resumo") {
    mcProcessarFilaBolhas();
    return;
  }

  mcBolhaExibindo = true;

  const el = document.createElement("div");
  el.className = `mc-evento-bolha ${mcClasseBolha(evento.tipo)}`;
  const sub = mcSubtituloBolha(evento);
  el.innerHTML = `
    <span class="mc-evento-bolha-icone">${ICONES_EVENTO[evento.tipo] || "📝"}</span>
    <div class="mc-evento-bolha-texto">
      <div class="mc-evento-bolha-titulo">${mcTituloBolha(evento, nomeTime)}</div>
      ${sub ? `<div class="mc-evento-bolha-sub">${sub}</div>` : ""}
    </div>
    <span class="mc-evento-bolha-minuto">${evento.minuto}'</span>
  `;
  container.appendChild(el);

  // força reflow pra transição de entrada funcionar
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("mc-evento-bolha-mostrar")));

  setTimeout(() => {
    el.classList.remove("mc-evento-bolha-mostrar");
    el.classList.add("mc-evento-bolha-sair");
    setTimeout(() => {
      el.remove();
      mcBolhaExibindo = false;
      // Quando a bolha some, o evento já deve estar registrado na
      // timeline do Resumo — dá um destaque rápido nele, igual ao
      // 365Scores/SofaScore quando o placar muda.
      mcDestacarNaTimeline(evento.id);
      mcProcessarFilaBolhas();
    }, MC_BOLHA_ANIM_MS);
  }, MC_BOLHA_DURACAO_MS);
}

function mcDestacarNaTimeline(eventoId) {
  const linha = document.querySelector(`.mc-timeline-item[data-evento-id="${eventoId}"]`);
  if (!linha) return;
  linha.classList.add("destaque");
  setTimeout(() => linha.classList.remove("destaque"), 4000);
}

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

  // Escalação agora é enviada pelo próprio técnico do time em "Meu Time"
  // (tabela escalacoes_tecnico), não mais digitada manualmente no admin.
  const { data: escalacoes } = await supabaseClient
    .from("escalacoes_tecnico")
    .select("*")
    .eq("jogo_id", id);

  // Busca o elenco dos dois times envolvidos, pra resolver jogador_id -> nome/número/posição.
  const idsTimes = [jogo.time_casa_id, jogo.time_fora_id].filter(Boolean);
  const { data: elenco } = idsTimes.length
    ? await supabaseClient.from("jogadores").select("*").in("time_id", idsTimes)
    : { data: [] };

  const { data: arbitragem } = await supabaseClient
    .from("arbitragem_jogo")
    .select("*")
    .eq("jogo_id", id)
    .maybeSingle();

  mcJogoAtual = jogo;

  const estado = estadoAoVivoDoJogo(
    jogo,
    (eventos || []).filter(e => e.tipo === "Gol" || e.tipo === "Gol Contra" || e.tipo === "Pênalti Marcado")
  );

  // Timeline só mostra o que já "aconteceu" até o minuto atual, igual à
  // lógica de placar ao vivo já usada no site.
  const eventosVisiveis = filtrarEventosVisiveis(eventos || [], estado);

  // Detecta eventos que acabaram de "acontecer" (ficaram visíveis agora)
  // pra disparar a bolha de notificação — tipo Gooool de Fulano aos 23'.
  mcEnfileirarNovosEventos(eventosVisiveis, jogo.time_casa, jogo.time_fora);

  // Escalação só é revelada a partir de 30 minutos antes do início do jogo
  // (ou já valendo se o jogo estiver rolando/encerrado).
  const escalacaoLiberada = mcEscalacaoLiberada(jogo, estado);

  area.innerHTML = `
    ${mcHeroHtml(jogo, estado)}
    ${mcTabsHtml()}
    <div id="mcPainelResumo" class="mc-panel ${mcAbaAtiva === "resumo" ? "" : "hidden"}">
      ${mcResumoHtml(jogo, eventosVisiveis, estado)}
    </div>
    <div id="mcPainelEscalacoes" class="mc-panel ${mcAbaAtiva === "escalacoes" ? "" : "hidden"}">
      ${escalacaoLiberada ? mcEscalacoesHtml(jogo, escalacoes || [], elenco || []) : mcEscalacaoBloqueadaHtml(jogo)}
    </div>
    <div id="mcPainelEstatisticas" class="mc-panel ${mcAbaAtiva === "estatisticas" ? "" : "hidden"}">
      ${mcEstatisticasHtml(jogo)}
    </div>
    <div id="mcPainelInformacoes" class="mc-panel ${mcAbaAtiva === "informacoes" ? "" : "hidden"}">
      ${mcInformacoesHtml(jogo, arbitragem)}
    </div>
  `;
}

// A escalação só aparece a partir de 30 minutos antes do início do jogo
// (hora_inicio_simulacao). Uma vez que o jogo está em andamento ou
// encerrado, ela também fica visível normalmente.
const MC_MINUTOS_ANTES_ESCALACAO = 30;

function mcEscalacaoLiberada(jogo, estado) {
  if (estado.statusExibido !== "Agendado") return true;
  if (!jogo.hora_inicio_simulacao) return false;

  const inicio = new Date(jogo.hora_inicio_simulacao);
  const liberaEm = new Date(inicio.getTime() - MC_MINUTOS_ANTES_ESCALACAO * 60 * 1000);
  return new Date() >= liberaEm;
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
      </div>
    </div>
  `;
}

// ---------- TABS ----------

function mcTabsHtml() {
  const abas = [
    { id: "resumo", label: "Resumo" },
    { id: "escalacoes", label: "Escalações" },
    { id: "estatisticas", label: "Estatísticas" },
    { id: "informacoes", label: "Informações" },
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

  // Se o usuário voltou pra aba Resumo e havia bolhas pendentes na fila
  // (acumuladas enquanto ele estava em Escalações/Estatísticas), mostra agora.
  if (id === "resumo") mcProcessarFilaBolhas();
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
        ${mcLinkEstadioHtml(jogo)}
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
        ${mcLinkEstadioHtml(jogo)}
      </div>
    `;
  }

  const linhas = eventos.map(e => mcTimelineLinhaHtml(e, casa, fora)).join("");

  return `
    <div class="card">
      <h2 style="font-family:var(--font-display);font-size:22px;margin:0 0 6px;">Linha do jogo</h2>
      <div class="mc-timeline">${linhas}</div>
      ${mcLinkEstadioHtml(jogo)}
    </div>
  `;
}

// Link com o nome do estádio, mostrado dentro do Resumo (embaixo dos
// eventos/estado do jogo). Ao clicar, abre estadio.html com os dados
// completos (foto, cidade, capacidade e últimos jogos ali realizados).
function mcLinkEstadioHtml(jogo) {
  if (!jogo.local) return "";
  const url = `estadio.html?nome=${encodeURIComponent(jogo.local)}`;
  return `
    <a class="mc-link-estadio" href="${url}">
      <span>📍 ${jogo.local}</span>
      <span class="mc-link-estadio-seta">›</span>
    </a>
  `;
}

function mcTimelineLinhaHtml(e, casa, fora) {
  const icone = ICONES_EVENTO[e.tipo] || "📝";

  if (EVENTOS_MARCO.has(e.tipo)) {
    return `<div class="mc-timeline-marco">${icone} ${e.tipo} — ${e.minuto}'</div>`;
  }

  let legenda = "";
  if (e.tipo === "Substituição" && e.jogador_secundario_nome) {
    legenda = `Entra: ${e.jogador_secundario_nome}`;
  } else if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_secundario_nome) {
    legenda = `Assistência: ${e.jogador_secundario_nome}`;
  } else if (e.tipo !== "Gol") {
    legenda = e.tipo;
  }

  const doTimeCasa = e.time_id === casa?.id;
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

// ---------- ESCALAÇÕES ----------

// Mostrado enquanto faltar mais de 30 minutos para o jogo começar.
function mcEscalacaoBloqueadaHtml(jogo) {
  return `
    <div class="card">
      <div class="empty-state" style="padding:30px 20px;">
        <div class="icon">🔒</div>
        <h3>Escalação ainda não revelada</h3>
        <p>Os times enviam a escalação até pouco antes do jogo. Ela aparece aqui a partir de
        30 minutos do início da partida.</p>
      </div>
    </div>
  `;
}

function mcEscalacoesHtml(jogo, escalacoes, elenco) {
  const casa = jogo.time_casa;
  const fora = jogo.time_fora;

  const escCasa = escalacoes.find(e => e.time_id === casa?.id);
  const escFora = escalacoes.find(e => e.time_id === fora?.id);

  if (!escCasa && !escFora) {
    return `
      <div class="card">
        <div class="empty-state" style="padding:30px 20px;">
          <div class="icon">📋</div>
          <h3>Escalações ainda não enviadas pelos técnicos</h3>
        </div>
      </div>
    `;
  }

  const titularesCasa = mcResolverJogadores(escCasa?.jogadores_titulares, elenco);
  const titularesFora = mcResolverJogadores(escFora?.jogadores_titulares, elenco);
  const reservasCasa = mcResolverJogadores(escCasa?.jogadores_reservas, elenco);
  const reservasFora = mcResolverJogadores(escFora?.jogadores_reservas, elenco);

  return `
    <div class="card">
      <div class="mc-escalacao-times">
        <div class="mc-escalacao-time-nome">${escudoHtml(casa)} ${casa ? casa.nome : "Casa"}</div>
        <div class="mc-escalacao-time-nome direita">${fora ? fora.nome : "Fora"} ${escudoHtml(fora)}</div>
      </div>
      ${(escCasa || escFora) ? `
        <p class="text-dim" style="font-size:11.5px;margin:-6px 0 12px;text-align:center;">
          ${escCasa ? `${casa?.nome}: ${escCasa.formacao}` : `${casa?.nome}: —`}
          &nbsp;·&nbsp;
          ${escFora ? `${fora?.nome}: ${escFora.formacao}` : `${fora?.nome}: —`}
        </p>
      ` : ""}

      <p class="mc-sub-titulo">Titulares</p>
      ${mcListaJogadoresHtml(titularesCasa, titularesFora)}

      ${(reservasCasa.length || reservasFora.length) ? `
        <p class="mc-sub-titulo">Reservas</p>
        ${mcListaJogadoresHtml(reservasCasa, reservasFora)}
      ` : ""}
    </div>
  `;
}

// Troca a lista de { jogador_id, posicao_campo? } salva no banco pelo
// objeto completo do jogador (nome, número, posição), buscando no elenco.
function mcResolverJogadores(lista, elenco) {
  if (!lista || !lista.length) return [];
  return lista
    .map(item => elenco.find(j => j.id === item.jogador_id))
    .filter(Boolean);
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
        ${jc ? `<span class="numero">${jc.numero ?? "-"}</span><span class="nome">${jc.nome}</span>${jc.posicao ? `<span class="pos">${jc.posicao}</span>` : ""}` : ""}
      </div>
      <div class="mc-jogador-item direita" style="${jf ? "" : "visibility:hidden;"}">
        ${jf ? `<span class="numero">${jf.numero ?? "-"}</span><span class="nome">${jf.nome}</span>${jf.posicao ? `<span class="pos">${jf.posicao}</span>` : ""}` : ""}
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

// ---------- INFORMAÇÕES (Arbitragem) ----------

function mcInformacoesHtml(jogo, arbitragem) {
  return `
    <div class="card">
      <h2 style="font-family:var(--font-display);font-size:22px;margin:0 0 6px;">🧑‍⚖️ Arbitragem</h2>
      ${mcArbitragemHtml(arbitragem)}
    </div>
  `;
}

function mcAbrirSubAbaInformacoes(id, btn) {
  mcSubAbaInformacoesAtiva = id;

  const painelArbitragem = document.getElementById("mcSubPainelArbitragem");
  const painelEstadio = document.getElementById("mcSubPainelEstadio");
  if (!painelArbitragem || !painelEstadio) return; // painel ainda não foi montado nesta carga

  painelArbitragem.classList.toggle("hidden", id !== "arbitragem");
  painelEstadio.classList.toggle("hidden", id !== "estadio");

  const botoes = document.querySelectorAll("#mcSubTabsInformacoes .mc-sub-tab-btn");
  botoes.forEach(b => b.classList.remove("active"));
  if (btn) {
    btn.classList.add("active");
  } else {
    // Chamada programática (ex: ao recarregar os dados a cada 15s) sem
    // clique do usuário — encontra o botão certo pelo texto/ordem.
    const idx = id === "arbitragem" ? 0 : 1;
    botoes[idx]?.classList.add("active");
  }
}

// Quarteto de arbitragem definido para a partida (árbitro, 2 assistentes e
// o 4º árbitro), cadastrado no admin na sub-aba "Dados" do jogo.
function mcArbitragemHtml(arbitragem) {
  const funcoes = [
    { chave: "arbitro", label: "Árbitro" },
    { chave: "assistente_1", label: "1º Assistente" },
    { chave: "assistente_2", label: "2º Assistente" },
    { chave: "quarto_arbitro", label: "4º Árbitro" },
  ];

  const algumDefinido = arbitragem && funcoes.some(f => arbitragem[f.chave]);

  if (!algumDefinido) {
    return `
      <div class="empty-state" style="padding:30px 20px;">
        <div class="icon">🧑‍⚖️</div>
        <h3>Arbitragem ainda não definida</h3>
        <p>O quarteto de arbitragem desta partida ainda não foi divulgado.</p>
      </div>
    `;
  }

  const linhas = funcoes.map(f => `
    <div class="mc-arbitro-item">
      <span class="mc-arbitro-funcao">${f.label}</span>
      <span class="mc-arbitro-nome">${arbitragem[f.chave] || "—"}</span>
    </div>
  `).join("");

  return `<div class="mc-arbitragem-lista">${linhas}</div>`;
}

carregarDetalhes();
setInterval(carregarDetalhes, 15000); // atualiza a cada 15s (jogo roda em 18min = 90')
