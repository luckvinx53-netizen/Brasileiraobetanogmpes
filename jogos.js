// =========================================================
// JOGOS — lista agrupada por rodada, com filtro de status
// =========================================================

let __todosJogos = [];
let __filtroAtual = "todos";

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
  renderizarJogos();
}

function renderizarJogos() {
  const lista = document.getElementById("listaJogos");

  const filtrados = __filtroAtual === "todos"
    ? __todosJogos
    : __todosJogos.filter(j => j.status === __filtroAtual);

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

  lista.innerHTML = Object.keys(rodadas)
    .sort((a, b) => Number(a) - Number(b))
    .map(rodada => `
      <div class="rodada-header">
        <h3>${rodada}ª Rodada</h3>
        <div class="linha"></div>
      </div>
      ${rodadas[rodada].map(jogoCardHtml).join("")}
    `).join("");
}

document.getElementById("filtroStatus")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  document.querySelectorAll("#filtroStatus .tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  __filtroAtual = btn.dataset.status;
  renderizarJogos();
});

carregarJogos();
