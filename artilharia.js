// =========================================================
// ESTATÍSTICAS (ex-Artilharia) — Gols, Assistências, Cartões,
// Melhor Ataque e Melhor Defesa da temporada ativa.
// =========================================================

let __statAtual = "gols";
let __jogadoresStatsCache = null; // jogadores dos times da temporada ativa
let __timesStatsCache = null;     // times da temporada ativa (ataque/defesa)
let __mapaTimesStats = {};

// Configuração de cada aba: de onde vêm os dados, como ordenar e como exibir.
const CONFIG_STATS = {
  gols: {
    origem: "jogadores",
    campo: "gols",
    unidade: "gols",
    icone: "⚽",
    vazio: "Nenhum gol registrado ainda.",
  },
  assistencias: {
    origem: "jogadores",
    campo: "assistencias",
    unidade: "assist.",
    icone: "🎯",
    vazio: "Nenhuma assistência registrada ainda.",
  },
  cartoes_amarelos: {
    origem: "jogadores",
    campo: "cartoes_amarelos",
    unidade: "cartões",
    icone: "🟨",
    vazio: "Nenhum cartão amarelo registrado ainda.",
  },
  cartoes_vermelhos: {
    origem: "jogadores",
    campo: "cartoes_vermelhos",
    unidade: "cartões",
    icone: "🟥",
    vazio: "Nenhum cartão vermelho registrado ainda.",
  },
  melhor_ataque: {
    origem: "times",
    campo: "gols_pro",
    unidade: "gols pró",
    icone: "🔥",
    vazio: "Nenhum time com gols registrados ainda.",
  },
  melhor_defesa: {
    origem: "times",
    campo: "gols_contra",
    unidade: "gols sofridos",
    icone: "🛡️",
    vazio: "Nenhum time com jogos registrados ainda.",
    ordemAscendente: true, // menos gols sofridos primeiro
    exigeJogo: true, // só entra na lista quem já jogou pelo menos 1 jogo
  },
};

async function carregarArtilharia() {
  const lista = document.getElementById("listaArtilharia");

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">📊</div><h3>Nenhuma temporada ativa</h3></div>`;
    return;
  }

  const { data: times, error: erroTimes } = await supabaseClient
    .from("times")
    .select("*")
    .eq("temporada_id", temporada.id)
    .eq("serie", "A");

  if (erroTimes) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar estatísticas</h3></div>`;
    console.error(erroTimes);
    return;
  }

  __timesStatsCache = times || [];
  __mapaTimesStats = Object.fromEntries(__timesStatsCache.map(t => [t.id, t.nome]));

  const idsTimes = __timesStatsCache.map(t => t.id);

  if (idsTimes.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">📊</div><h3>Nenhum time cadastrado</h3></div>`;
    return;
  }

  const { data: jogadores, error: erroJogadores } = await supabaseClient
    .from("jogadores")
    .select("*")
    .in("time_id", idsTimes);

  if (erroJogadores) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar estatísticas</h3></div>`;
    console.error(erroJogadores);
    return;
  }

  __jogadoresStatsCache = jogadores || [];

  renderizarStatAtual();
}

function mudarStat(stat, botao) {
  __statAtual = stat;
  document.querySelectorAll("#tabsEstatisticas .tab-btn").forEach(b => b.classList.remove("active"));
  botao?.classList.add("active");
  renderizarStatAtual();
}

function renderizarStatAtual() {
  const lista = document.getElementById("listaArtilharia");
  const cfg = CONFIG_STATS[__statAtual];
  if (!cfg) return;

  if (cfg.origem === "jogadores") {
    renderizarRankingJogadores(lista, cfg);
  } else {
    renderizarRankingTimes(lista, cfg);
  }
}

function renderizarRankingJogadores(lista, cfg) {
  const itens = (__jogadoresStatsCache || [])
    .filter(j => Number(j[cfg.campo] || 0) > 0)
    .sort((a, b) => Number(b[cfg.campo] || 0) - Number(a[cfg.campo] || 0))
    .slice(0, 30);

  if (itens.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">${cfg.icone}</div><h3>${cfg.vazio}</h3></div>`;
    return;
  }

  lista.innerHTML = itens.map((j, i) => `
    <div class="artilheiro-item" onclick="location.href='jogador?id=${j.id}'" style="cursor:pointer;">
      <div class="rank">${i + 1}</div>
      <div class="info">
        <h4>${j.nome}</h4>
        <p>${__mapaTimesStats[j.time_id] || ""} ${j.posicao ? "· " + j.posicao : ""}</p>
      </div>
      <div class="gols">${j[cfg.campo] || 0}<span>${cfg.unidade}</span></div>
    </div>
  `).join("");
}

function renderizarRankingTimes(lista, cfg) {
  let itens = (__timesStatsCache || []).slice();

  if (cfg.exigeJogo) {
    itens = itens.filter(t => Number(t.jogos || 0) > 0);
  }

  itens = itens.sort((a, b) => {
    const va = Number(a[cfg.campo] || 0);
    const vb = Number(b[cfg.campo] || 0);
    return cfg.ordemAscendente ? va - vb : vb - va;
  });

  if (itens.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">${cfg.icone}</div><h3>${cfg.vazio}</h3></div>`;
    return;
  }

  lista.innerHTML = itens.map((t, i) => `
    <div class="artilheiro-item" onclick="location.href='time?id=${t.id}'" style="cursor:pointer;">
      <div class="rank">${i + 1}</div>
      <div class="info">
        <h4>${t.nome}</h4>
        <p>${t.jogos || 0} jogo${(t.jogos || 0) === 1 ? "" : "s"}</p>
      </div>
      <div class="gols">${t[cfg.campo] || 0}<span>${cfg.unidade}</span></div>
    </div>
  `).join("");
}

carregarArtilharia();
