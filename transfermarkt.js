// =========================================================
// TRANSFERMARKT — vitrine de times + elenco com valor de mercado
// (valor de mercado = valor da última transferência aceita, ou 0)
// Inspirado no layout do transfermarkt.com.br: grade de times na
// entrada, depois header colorido do time + elenco por posição.
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

async function iniciarTransfermarkt() {
  const params = new URLSearchParams(window.location.search);
  const timePreSelecionado = params.get("time");

  if (timePreSelecionado) {
    await tmAbrirTime(timePreSelecionado);
  } else {
    await tmMostrarGradeTimes();
  }
}

// ---------- GRADE DE TIMES (tela inicial, tipo capa do site real) ----------

async function tmMostrarGradeTimes() {
  document.getElementById("tmTopo").innerHTML = "";
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

  area.innerHTML = resumoHtml + blocosHtml;
}

function tmJogadorItemHtml(j, valorMercado) {
  return `
    <div class="tm-jogador-item" onclick="location.href='jogador.html?id=${j.id}'">
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
  tmMostrarGradeTimes();
}

iniciarTransfermarkt();
