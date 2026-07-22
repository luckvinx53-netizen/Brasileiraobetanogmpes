// =========================================================
// JOGOS — lista agrupada por rodada, com filtro de status
// =========================================================

let __todosJogos = [];
let __eventosGolPorJogo = {};
let __filtroAtual = "todos"; // "todos" ou número da rodada (string)

async function carregarJogos() {
  const lista = document.getElementById("listaJogos");

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚽</div><h3>Nenhuma temporada ativa</h3></div>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .eq("temporada_id", temporada.id)
    .order("rodada", { ascending: true });

  if (error) {
    console.error(error);
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar jogos</h3><p>${error.message}</p></div>`;
    return;
  }

  __todosJogos = await Promise.all((data || []).map(j => checarEncerramentoAutomatico(j)));

  // Posts automáticos de "Matchday" no perfil dos clubes que jogam hoje.
  // Não usa await: não deve atrasar a renderização da lista de jogos
  // esperando o upload de cada arte pro Storage.
  if (typeof rsGerarPostMatchdaySeNecessario === "function") {
    (async () => {
      try {
        const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
        const hoje = new Date().toISOString().slice(0, 10);
        const jogosDeHoje = __todosJogos.filter(j => j.data_jogo === hoje);
        await Promise.all(jogosDeHoje.map(j => rsGerarPostMatchdaySeNecessario(j, competicaoAtual)));
      } catch (e) {
        console.error("Falha ao gerar posts automáticos de matchday:", e);
      }
    })();
  }

  __eventosGolPorJogo = {};
  if (__todosJogos.length > 0) {
    const { data: eventos } = await supabaseClient
      .from("eventos_jogo")
      .select("*")
      .in("jogo_id", __todosJogos.map(j => j.id))
      .in("tipo", ["Gol", "Gol Contra", "Pênalti Marcado"]);

    (eventos || []).forEach(e => {
      if (!__eventosGolPorJogo[e.jogo_id]) __eventosGolPorJogo[e.jogo_id] = [];
      __eventosGolPorJogo[e.jogo_id].push(e);
    });
  }

  popularFiltroRodada();
  renderizarJogos();
}

function popularFiltroRodada() {
  const wrap = document.getElementById("filtroRodadaWrap");
  if (!wrap) return;

  const rodadas = [...new Set(__todosJogos.map(j => Number(j.rodada)))]
    .filter(r => !Number.isNaN(r))
    .sort((a, b) => a - b);

  // Mantém o filtro anterior se ainda existir na lista
  const existeAinda = __filtroAtual === "todos" || rodadas.some(r => String(r) === String(__filtroAtual));
  __filtroAtual = existeAinda ? __filtroAtual : "todos";

  wrap.innerHTML = `
    <button class="tab-btn${__filtroAtual === "todos" ? " active" : ""}" data-rodada="todos">Todas as rodadas</button>
    ${rodadas.map(r => `
      <button class="tab-btn${String(__filtroAtual) === String(r) ? " active" : ""}" data-rodada="${r}">${r}ª Rodada</button>
    `).join("")}
  `;
}

function renderizarJogos() {
  const lista = document.getElementById("listaJogos");

  const filtrados = __filtroAtual === "todos"
    ? __todosJogos
    : __todosJogos.filter(j => String(j.rodada) === String(__filtroAtual));

  if (filtrados.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="icon">📅</div>
        <h3>Nenhum jogo encontrado</h3>
        <p>Tente outro filtro ou cadastre jogos no painel admin.</p>
      </div>`;
    return;
  }

  const rodadas = {};
  filtrados.forEach(j => {
    if (!rodadas[j.rodada]) rodadas[j.rodada] = [];
    rodadas[j.rodada].push(j);
  });

  const filtrandoRodadaUnica = __filtroAtual !== "todos";

  lista.innerHTML = Object.keys(rodadas)
    .sort((a, b) => Number(a) - Number(b))
    .map(rodada => `
      ${filtrandoRodadaUnica ? "" : `
        <div class="rodada-header">
          <h3>${rodada}ª Rodada</h3>
          <div class="linha"></div>
        </div>
      `}
      ${rodadas[rodada].map(j => jogoCardHtml(j, __eventosGolPorJogo[j.id])).join("")}
    `).join("");
}

document.getElementById("filtroRodadaWrap")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;

  __filtroAtual = btn.dataset.rodada;

  document.querySelectorAll("#filtroRodadaWrap .tab-btn").forEach(b => {
    b.classList.toggle("active", b === btn);
  });

  // Centraliza o chip clicado na área visível do carrossel
  btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

  renderizarJogos();
});

carregarJogos();
setInterval(carregarJogos, 15000);
