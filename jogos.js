// =========================================================
// JOGOS — lista agrupada por rodada, com filtro de status
// =========================================================

let __todosJogos = [];
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

  __todosJogos = data || [];
  popularFiltroRodada();
  renderizarJogos();
}

function popularFiltroRodada() {
  const select = document.getElementById("filtroRodada");
  if (!select) return;

  const rodadas = [...new Set(__todosJogos.map(j => Number(j.rodada)))]
    .filter(r => !Number.isNaN(r))
    .sort((a, b) => a - b);

  const valorAtual = select.value || "todos";

  select.innerHTML = `
    <option value="todos">Todas as rodadas</option>
    ${rodadas.map(r => `<option value="${r}">${r}ª Rodada</option>`).join("")}
  `;

  // Mantém a seleção anterior se ainda existir na lista
  const existeAinda = valorAtual === "todos" || rodadas.some(r => String(r) === valorAtual);
  select.value = existeAinda ? valorAtual : "todos";
  __filtroAtual = select.value;
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
      ${rodadas[rodada].map(jogoCardHtml).join("")}
    `).join("");
}

document.getElementById("filtroRodada")?.addEventListener("change", (e) => {
  __filtroAtual = e.target.value;
  renderizarJogos();
});

carregarJogos();
