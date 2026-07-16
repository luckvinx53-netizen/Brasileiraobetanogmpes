// =========================================================
// TRANSFERMARKT — vitrine de times + elenco com valor de mercado
// + aba MERCADO com rumores (consultas que "vazaram" pra imprensa)
// e transferências já confirmadas, no estilo transfermarkt.com.br.
// =========================================================

// Agrupa os códigos de posição usados no admin em 4 blocos, igual ao
// site real (Goleiros / Defesa / Meio-campo / Ataque).
const TM_GRUPOS_POSICAO = [
  { titulo: "Goleiros", codigos: ["GOL"] },
  { titulo: "Defensores", codigos: ["ZAG", "LD", "LE"] },
  { titulo: "Meio-campistas", codigos: ["VOL", "MC", "MEI"] },
  { titulo: "Atacantes", codigos: ["PD", "PE", "SA", "ATA"] },
];

function tmNomePosicao(codigo) {
  const mapa = {
    GOL: "Goleiro", ZAG: "Zagueiro", LD: "Lateral direito", LE: "Lateral esquerdo",
    VOL: "Volante", MC: "Meio-campo", MEI: "Meia atacante",
    PD: "Ponta direita", PE: "Ponta esquerda", SA: "Segundo atacante", ATA: "Atacante",
  };
  return mapa[codigo] || codigo || "—";
}

let tmAbaTopoAtiva = "times"; // "times" | "mercado" | "ranking"
let tmAbaMercadoAtiva = "rumores"; // "rumores" | "confirmadas"
let tmAbaRankingAtiva = "valiosos"; // "valiosos" | "artilheiros" | "garcons" | "jovens" | "cartoes"

async function iniciarTransfermarkt() {
  const params = new URLSearchParams(window.location.search);
  const timePreSelecionado = params.get("time");

  if (timePreSelecionado) {
    await tmAbrirTime(timePreSelecionado);
  } else {
    await tmMostrarTelaInicial();
  }
}

// ---------- TELA INICIAL (abas Times / Mercado / Ranking) ----------

function tmTopoAbasHtml() {
  return `
    <div class="tm-mercado-tabs">
      <button class="tm-mercado-tab-btn ${tmAbaTopoAtiva === "times" ? "active" : ""}" onclick="tmMudarAbaTopo('times')">🛡️ Times</button>
      <button class="tm-mercado-tab-btn ${tmAbaTopoAtiva === "mercado" ? "active" : ""}" onclick="tmMudarAbaTopo('mercado')">🗞️ Mercado</button>
      <button class="tm-mercado-tab-btn ${tmAbaTopoAtiva === "ranking" ? "active" : ""}" onclick="tmMudarAbaTopo('ranking')">🏆 Ranking</button>
    </div>
  `;
}

function tmMudarAbaTopo(aba) {
  tmAbaTopoAtiva = aba;
  tmMostrarTelaInicial();
}

async function tmMostrarTelaInicial() {
  document.getElementById("tmTopo").innerHTML = tmTopoAbasHtml();
  if (tmAbaTopoAtiva === "mercado") {
    await tmMostrarMercado();
  } else if (tmAbaTopoAtiva === "ranking") {
    await tmMostrarRanking();
  } else {
    await tmMostrarGradeTimes();
  }
}

// ---------- GRADE DE TIMES (tela inicial, tipo capa do site real) ----------

async function tmMostrarGradeTimes() {
  const area = document.getElementById("tmConteudo");
  area.innerHTML = `
    <div class="tm-grade-times">
      ${Array(6).fill('<div class="skeleton" style="height:110px;border-radius:16px;"></div>').join("")}
    </div>
  `;

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Nenhuma temporada ativa</h3></div>`;
    return;
  }

  const { data: times, error } = await supabaseClient
    .from("times")
    .select("*")
    .eq("temporada_id", temporada.id)
    .order("nome", { ascending: true });

  if (error || !times || times.length === 0) {
    area.innerHTML = `<div class="empty-state"><div class="icon">🛡️</div><h3>Nenhum time cadastrado</h3></div>`;
    return;
  }

  // Busca todos os jogadores de todos os times de uma vez, pra calcular
  // o valor total do elenco de cada time sem fazer N consultas.
  const idsTimes = times.map(t => t.id);
  const { data: jogadores } = await supabaseClient
    .from("jogadores")
    .select("id, time_id")
    .in("time_id", idsTimes);

  const idsJogadores = (jogadores || []).map(j => j.id);
  const { data: transferencias } = idsJogadores.length
    ? await supabaseClient
        .from("bid_transferencias")
        .select("jogador_id, valor_consultado, respondido_em")
        .in("jogador_id", idsJogadores)
        .eq("status", "aceito")
        .order("respondido_em", { ascending: false })
    : { data: [] };

  const valorPorJogador = {};
  (transferencias || []).forEach(t => {
    if (!(t.jogador_id in valorPorJogador)) {
      valorPorJogador[t.jogador_id] = Number(t.valor_consultado || 0);
    }
  });

  const valorPorTime = {};
  (jogadores || []).forEach(j => {
    valorPorTime[j.time_id] = (valorPorTime[j.time_id] || 0) + (valorPorJogador[j.id] || 0);
  });

  area.innerHTML = `
    <div class="tm-grade-times">
      ${times.map(t => tmTimeCardHtml(t, valorPorTime[t.id] || 0)).join("")}
    </div>
  `;
}

function tmTimeCardHtml(time, valorTotal) {
  const tema = typeof obterTemaTime === "function" ? obterTemaTime(time.nome) : null;
  const corBorda = tema ? tema.primaria : "var(--grama)";
  return `
    <div class="tm-time-card" style="--tm-cor:${corBorda};" onclick="tmAbrirTime('${time.id}')">
      ${escudoHtml(time, "escudo")}
      <span class="tm-time-nome">${time.nome}</span>
      <span class="tm-time-valor">R$ ${valorTotal.toLocaleString("pt-BR")}</span>
    </div>
  `;
}

// ---------- MERCADO (rumores vazados + transferências confirmadas) ----------
// A lógica de vazamento/frases/hash mora em mercado-noticias.js
// (compartilhada com a aba Notícias). Aqui só monta a UI de abas.

function tmMercadoTopoHtml() {
  return `
    <div class="tm-mercado-tabs">
      <button class="tm-mercado-tab-btn ${tmAbaMercadoAtiva === "rumores" ? "active" : ""}" onclick="tmMudarAbaMercado('rumores')">🗞️ Rumores</button>
      <button class="tm-mercado-tab-btn ${tmAbaMercadoAtiva === "confirmadas" ? "active" : ""}" onclick="tmMudarAbaMercado('confirmadas')">✅ Confirmadas</button>
    </div>
  `;
}

function tmMudarAbaMercado(aba) {
  tmAbaMercadoAtiva = aba;
  tmMostrarMercado();
}

async function tmMostrarMercado() {
  const area = document.getElementById("tmConteudo");
  area.innerHTML = `
    ${tmMercadoTopoHtml()}
    <div class="skeleton" style="height:70px;margin-bottom:8px;"></div>
    <div class="skeleton" style="height:70px;margin-bottom:8px;"></div>
    <div class="skeleton" style="height:70px;"></div>
  `;

  if (tmAbaMercadoAtiva === "confirmadas") {
    await tmRenderConfirmadas();
  } else {
    await tmRenderRumores();
  }
}

async function tmRenderRumores() {
  const area = document.getElementById("tmConteudo");

  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome), dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
    .in("status", ["pendente", "negociando"])
    .order("criado_em", { ascending: false });

  if (error) {
    area.innerHTML = tmMercadoTopoHtml() + `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar rumores</h3></div>`;
    return;
  }

  const vazados = (data || []).filter(c => tmConsultaVazou(c.id, c.interessado?.nome));

  if (!vazados.length) {
    area.innerHTML = tmMercadoTopoHtml() + `
      <div class="empty-state" style="padding:30px 20px;">
        <div class="icon">🤫</div>
        <h3>Nenhum rumor no ar</h3>
        <p>As negociações em aberto estão sendo mantidas em sigilo por enquanto.</p>
      </div>
    `;
    return;
  }

  area.innerHTML = tmMercadoTopoHtml() + vazados.map(c => tmRumorItemHtml(c)).join("");
}

async function tmRenderConfirmadas() {
  const area = document.getElementById("tmConteudo");

  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome), dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
    .eq("status", "aceito")
    .order("respondido_em", { ascending: false })
    .limit(50);

  if (error) {
    area.innerHTML = tmMercadoTopoHtml() + `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar transferências</h3></div>`;
    return;
  }

  if (!data || data.length === 0) {
    area.innerHTML = tmMercadoTopoHtml() + `
      <div class="empty-state" style="padding:30px 20px;">
        <div class="icon">📋</div>
        <h3>Nenhuma transferência confirmada ainda</h3>
      </div>
    `;
    return;
  }

  area.innerHTML = tmMercadoTopoHtml() + data.map(c => tmConfirmadaItemHtml(c)).join("");
}

// ---------- RANKING (mais valiosos, artilheiros, garçons, jovens, cartões) ----------

const TM_RANKINGS = [
  { id: "valiosos", label: "💰 Mais valiosos" },
  { id: "artilheiros", label: "⚽ Artilheiros" },
  { id: "garcons", label: "🎯 Garçons" },
  { id: "jovens", label: "🌟 Joias" },
  { id: "cartoes", label: "🟥 Cartoleiros" },
];

function tmRankingTopoHtml() {
  return `
    <div class="tm-ranking-tabs">
      ${TM_RANKINGS.map(r => `
        <button class="tm-mercado-tab-btn ${tmAbaRankingAtiva === r.id ? "active" : ""}" onclick="tmMudarAbaRanking('${r.id}')">${r.label}</button>
      `).join("")}
    </div>
  `;
}

function tmMudarAbaRanking(aba) {
  tmAbaRankingAtiva = aba;
  tmMostrarRanking();
}

async function tmMostrarRanking() {
  const area = document.getElementById("tmConteudo");
  area.innerHTML = `
    ${tmRankingTopoHtml()}
    <div class="skeleton" style="height:64px;margin-bottom:8px;"></div>
    <div class="skeleton" style="height:64px;margin-bottom:8px;"></div>
    <div class="skeleton" style="height:64px;"></div>
  `;

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    area.innerHTML = tmRankingTopoHtml() + `<div class="empty-state"><div class="icon">⚠️</div><h3>Nenhuma temporada ativa</h3></div>`;
    return;
  }

  const { data: times } = await supabaseClient
    .from("times")
    .select("id, nome, escudo_url, sigla")
    .eq("temporada_id", temporada.id);

  const idsTimes = (times || []).map(t => t.id);
  const timesPorId = {};
  (times || []).forEach(t => timesPorId[t.id] = t);

  const { data: jogadores, error } = idsTimes.length
    ? await supabaseClient.from("jogadores").select("*").in("time_id", idsTimes)
    : { data: [] };

  if (error || !jogadores || jogadores.length === 0) {
    area.innerHTML = tmRankingTopoHtml() + `<div class="empty-state"><div class="icon">👤</div><h3>Nenhum jogador cadastrado</h3></div>`;
    return;
  }

  // Valor de mercado = valor da última transferência aceita de cada
  // jogador (mesma regra usada em todo o resto do Transfermarkt).
  const idsJogadores = jogadores.map(j => j.id);
  const { data: transferencias } = idsJogadores.length
    ? await supabaseClient
        .from("bid_transferencias")
        .select("jogador_id, valor_consultado, respondido_em")
        .in("jogador_id", idsJogadores)
        .eq("status", "aceito")
        .order("respondido_em", { ascending: false })
    : { data: [] };

  const valorPorJogador = {};
  (transferencias || []).forEach(t => {
    if (!(t.jogador_id in valorPorJogador)) {
      valorPorJogador[t.jogador_id] = Number(t.valor_consultado || 0);
    }
  });

  let ranking = [];
  let metrica = null; // função que formata o valor de destaque de cada linha

  if (tmAbaRankingAtiva === "valiosos") {
    ranking = jogadores
      .filter(j => (valorPorJogador[j.id] || 0) > 0)
      .sort((a, b) => (valorPorJogador[b.id] || 0) - (valorPorJogador[a.id] || 0));
    metrica = j => `R$ ${(valorPorJogador[j.id] || 0).toLocaleString("pt-BR")}`;
  } else if (tmAbaRankingAtiva === "artilheiros") {
    ranking = jogadores
      .filter(j => (j.gols || 0) > 0)
      .sort((a, b) => (b.gols || 0) - (a.gols || 0));
    metrica = j => `${j.gols || 0} gol${(j.gols || 0) === 1 ? "" : "s"}`;
  } else if (tmAbaRankingAtiva === "garcons") {
    ranking = jogadores
      .filter(j => (j.assistencias || 0) > 0)
      .sort((a, b) => (b.assistencias || 0) - (a.assistencias || 0));
    metrica = j => `${j.assistencias || 0} assist.`;
  } else if (tmAbaRankingAtiva === "jovens") {
    // "Joias": mais jovens do campeonato que já têm participação em gol
    // (gol ou assistência) — evita encher o ranking com reservas jovens
    // que ainda não jogaram, mantendo o espírito de "promessa em alta".
    ranking = jogadores
      .filter(j => j.idade && ((j.gols || 0) > 0 || (j.assistencias || 0) > 0))
      .sort((a, b) => a.idade - b.idade);
    metrica = j => `${j.idade} anos`;
  } else if (tmAbaRankingAtiva === "cartoes") {
    // Cartão vermelho pesa mais que amarelo pra ordenar o "mais
    // encrenqueiro" do campeonato.
    ranking = jogadores
      .filter(j => (j.amarelos || 0) > 0 || (j.vermelhos || 0) > 0)
      .sort((a, b) => ((b.vermelhos || 0) * 3 + (b.amarelos || 0)) - ((a.vermelhos || 0) * 3 + (a.amarelos || 0)));
    metrica = j => `🟨 ${j.amarelos || 0} · 🟥 ${j.vermelhos || 0}`;
  }

  ranking = ranking.slice(0, 20);

  if (ranking.length === 0) {
    area.innerHTML = tmRankingTopoHtml() + `
      <div class="empty-state" style="padding:30px 20px;">
        <div class="icon">📊</div>
        <h3>Ainda sem dados suficientes</h3>
        <p>Esse ranking aparece assim que houver estatísticas registradas na temporada.</p>
      </div>
    `;
    return;
  }

  area.innerHTML = tmRankingTopoHtml() + ranking.map((j, i) => tmRankingItemHtml(j, i + 1, timesPorId[j.time_id], metrica(j))).join("");
}

function tmRankingItemHtml(jogador, posicao, time, valorDestaque) {
  const medalha = posicao === 1 ? "🥇" : posicao === 2 ? "🥈" : posicao === 3 ? "🥉" : posicao;
  return `
    <div class="tm-ranking-item" onclick="location.href='jogador?id=${jogador.id}'">
      <span class="tm-ranking-posicao">${medalha}</span>
      ${time ? escudoHtml(time, "escudo") : `<div class="escudo-placeholder">?</div>`}
      <div class="info">
        <h3>${jogador.nome}</h3>
        <p>${tmNomePosicao(jogador.posicao)} · ${time?.nome || "sem time"}</p>
      </div>
      <div class="tm-ranking-valor">${valorDestaque}</div>
    </div>
  `;
}

// ---------- ELENCO DE UM TIME ----------

async function tmAbrirTime(timeId) {
  // Mantém a URL navegável/compartilhável, sem recarregar a página.
  const url = new URL(window.location.href);
  url.searchParams.set("time", timeId);
  window.history.replaceState({}, "", url);

  const topo = document.getElementById("tmTopo");
  const area = document.getElementById("tmConteudo");

  topo.innerHTML = "";
  area.innerHTML = `<div class="skeleton" style="height:90px;margin-bottom:16px;"></div><div class="skeleton" style="height:70px;"></div><div class="skeleton" style="height:70px;"></div>`;

  const { data: time, error: erroTime } = await supabaseClient
    .from("times")
    .select("*")
    .eq("id", timeId)
    .single();

  if (erroTime || !time) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Time não encontrado</h3></div>`;
    return;
  }

  if (typeof aplicarTemaTime === "function") aplicarTemaTime(time.nome);

  const { data: jogadores, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .eq("time_id", timeId)
    .order("numero", { ascending: true });

  topo.innerHTML = `
    <div class="tm-header-time">
      ${escudoHtml(time, "escudo")}
      <div class="tm-header-info">
        <h3>${time.nome}</h3>
        <p>${(jogadores || []).length} jogador${(jogadores || []).length === 1 ? "" : "es"} no elenco</p>
      </div>
      <button class="tm-voltar" onclick="tmVoltarGrade()">← Times</button>
    </div>
  `;

  if (error) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar elenco</h3></div>`;
    return;
  }

  if (!jogadores || jogadores.length === 0) {
    area.innerHTML = `<div class="empty-state"><div class="icon">👤</div><h3>Nenhum jogador cadastrado</h3></div>`;
    return;
  }

  // Busca a última transferência aceita de cada jogador do elenco, pra
  // servir de "valor de mercado" (0 se o jogador nunca foi transferido)
  const idsJogadores = jogadores.map(j => j.id);
  const { data: transferencias } = await supabaseClient
    .from("bid_transferencias")
    .select("jogador_id, valor_consultado, respondido_em")
    .in("jogador_id", idsJogadores)
    .eq("status", "aceito")
    .order("respondido_em", { ascending: false });

  const valorMercadoPorJogador = {};
  (transferencias || []).forEach(t => {
    if (!(t.jogador_id in valorMercadoPorJogador)) {
      valorMercadoPorJogador[t.jogador_id] = Number(t.valor_consultado || 0);
    }
  });

  const valorTotalElenco = jogadores.reduce((soma, j) => soma + (valorMercadoPorJogador[j.id] || 0), 0);
  const jogadorMaisValioso = jogadores.reduce((maisCaro, j) => {
    const valor = valorMercadoPorJogador[j.id] || 0;
    return (!maisCaro || valor > (valorMercadoPorJogador[maisCaro.id] || 0)) ? j : maisCaro;
  }, null);

  const resumoHtml = `
    <div class="tm-resumo-cards">
      <div class="tm-resumo-card destaque">
        <p>Valor total do elenco</p>
        <p>R$ ${valorTotalElenco.toLocaleString("pt-BR")}</p>
      </div>
      <div class="tm-resumo-card">
        <p>Mais valioso</p>
        <p style="font-size:14px;">${jogadorMaisValioso ? jogadorMaisValioso.nome : "—"}</p>
      </div>
    </div>
  `;

  // Agrupa os jogadores nos 4 blocos de posição, na ordem goleiro → ataque,
  // igual ao site real. Jogadores sem posição reconhecida caem no fim.
  const restantes = new Set(jogadores.map(j => j.id));
  let blocosHtml = "";

  TM_GRUPOS_POSICAO.forEach(grupo => {
    const doGrupo = jogadores.filter(j => grupo.codigos.includes(j.posicao));
    if (!doGrupo.length) return;
    doGrupo.forEach(j => restantes.delete(j.id));
    blocosHtml += `
      <p class="tm-posicao-titulo">${grupo.titulo}</p>
      ${doGrupo.map(j => tmJogadorItemHtml(j, valorMercadoPorJogador[j.id] || 0)).join("")}
    `;
  });

  const semGrupo = jogadores.filter(j => restantes.has(j.id));
  if (semGrupo.length) {
    blocosHtml += `
      <p class="tm-posicao-titulo">Outros</p>
      ${semGrupo.map(j => tmJogadorItemHtml(j, valorMercadoPorJogador[j.id] || 0)).join("")}
    `;
  }

  const mercadoDoTimeHtml = await tmMercadoDoTimeHtml(timeId);

  area.innerHTML = resumoHtml + blocosHtml + mercadoDoTimeHtml;
}

// Bloco compacto de rumores + transferências confirmadas que envolvem
// especificamente o time aberto (como comprador ou vendedor).
async function tmMercadoDoTimeHtml(timeId) {
  const { data: consultasAbertas } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome), dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
    .in("status", ["pendente", "negociando"])
    .or(`time_dono_id.eq.${timeId},time_interessado_id.eq.${timeId}`)
    .order("criado_em", { ascending: false });

  const { data: confirmadas } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome), dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
    .eq("status", "aceito")
    .or(`time_dono_id.eq.${timeId},time_interessado_id.eq.${timeId}`)
    .order("respondido_em", { ascending: false })
    .limit(10);

  const rumoresDoTime = (consultasAbertas || []).filter(c => tmConsultaVazou(c.id, c.interessado?.nome));

  if (!rumoresDoTime.length && (!confirmadas || !confirmadas.length)) return "";

  let html = `<p class="tm-posicao-titulo">🗞️ Mercado do clube</p>`;

  if (rumoresDoTime.length) {
    html += rumoresDoTime.map(c => tmRumorItemHtml(c)).join("");
  }
  if (confirmadas && confirmadas.length) {
    html += confirmadas.map(c => tmConfirmadaItemHtml(c)).join("");
  }

  return html;
}

function tmJogadorItemHtml(j, valorMercado) {
  return `
    <div class="tm-jogador-item" onclick="location.href='jogador?id=${j.id}'">
      <span class="tm-numero">${j.numero ?? "-"}</span>
      <div class="info">
        <h3>${j.nome} ${j.regularizado === false ? '<span class="jogador-irregular">· Irregular (BID)</span>' : ""}</h3>
        <p>${tmNomePosicao(j.posicao)} ${j.idade ? "· " + j.idade + " anos" : ""} · ${j.gols ?? 0} gols · ${j.assistencias ?? 0} assist.</p>
      </div>
      <div class="tm-valor">
        R$ ${valorMercado.toLocaleString("pt-BR")}
        <span>valor</span>
      </div>
    </div>
  `;
}

function tmVoltarGrade() {
  const url = new URL(window.location.href);
  url.searchParams.delete("time");
  window.history.replaceState({}, "", url);
  document.documentElement.style.removeProperty("--tema-primaria");
  document.documentElement.style.removeProperty("--tema-secundaria");
  tmMostrarTelaInicial();
}

iniciarTransfermarkt();
