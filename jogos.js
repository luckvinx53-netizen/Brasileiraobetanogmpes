// =========================================================
// JOGOS — lista agrupada por rodada (ou por fase, em competições
// mata-mata como a Copa do Brasil), com filtro de status
// =========================================================

const JG_NOMES_FASE = { oitavas: "Oitavas", quartas: "Quartas", semifinal: "Semifinal", final: "Final" };
const JG_ORDEM_FASE = { oitavas: 0, quartas: 1, semifinal: 2, final: 3 };

let __todosJogos = [];
let __eventosGolPorJogo = {};
let __filtroAtual = "todos"; // "todos", número da rodada (string), ou fase ("oitavas" etc.)

// Um jogo é de mata-mata quando tem fase preenchida e diferente de
// "grupos" — não tem "rodada" de verdade, então a lista não deve
// agrupar/filtrar por rodada (e muito menos mostrar "0ª rodada").
function jgEhMataMata(jogo) {
  return !!jogo.fase && jogo.fase !== "grupos";
}

// Rótulo do grupo: "Oitavas • Ida" no mata-mata, "Nª Rodada" no normal.
function jgRotuloGrupo(jogo) {
  if (jgEhMataMata(jogo)) {
    const perna = jogo.perna === "ida" ? " • Ida" : jogo.perna === "volta" ? " • Volta" : "";
    return `${JG_NOMES_FASE[jogo.fase] || jogo.fase}${perna}`;
  }
  return `${jogo.rodada}ª Rodada`;
}

// Chave estável pra agrupar (fase sozinha, sem a perna — ida e volta
// do mesmo confronto ficam juntas na mesma seção) ou a rodada.
function jgChaveGrupo(jogo) {
  return jgEhMataMata(jogo) ? jogo.fase : String(jogo.rodada);
}

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

  // No mata-mata, ordena por fase (oitavas → final) e depois por ida/volta,
  // já que "rodada" não representa a ordem real dos jogos aqui.
  if (__todosJogos.length && jgEhMataMata(__todosJogos[0])) {
    const ordemPerna = { ida: 0, volta: 1, unica: 0 };
    __todosJogos.sort((a, b) => {
      const fa = JG_ORDEM_FASE[a.fase] ?? 99, fb = JG_ORDEM_FASE[b.fase] ?? 99;
      if (fa !== fb) return fa - fb;
      return (ordemPerna[a.perna] ?? 0) - (ordemPerna[b.perna] ?? 0);
    });
  }

  // Posts automáticos de "Matchday" no perfil dos clubes que jogam hoje.
  // Não usa await: não deve atrasar a renderização da lista de jogos
  // esperando o upload de cada arte pro Storage.
  if (typeof rsGerarPostMatchdaySeNecessario === "function") {
    (async () => {
      try {
        const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
        const hoje = typeof dataLocalDeHoje === "function" ? dataLocalDeHoje() : new Date().toISOString().slice(0, 10);
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

  const ehMataMata = __todosJogos.length > 0 && jgEhMataMata(__todosJogos[0]);

  if (ehMataMata) {
    const fases = [...new Set(__todosJogos.map(j => j.fase))]
      .sort((a, b) => (JG_ORDEM_FASE[a] ?? 99) - (JG_ORDEM_FASE[b] ?? 99));

    const existeAinda = __filtroAtual === "todos" || fases.includes(__filtroAtual);
    __filtroAtual = existeAinda ? __filtroAtual : "todos";

    wrap.innerHTML = `
      <button class="tab-btn${__filtroAtual === "todos" ? " active" : ""}" data-rodada="todos">Todas as fases</button>
      ${fases.map(f => `
        <button class="tab-btn${__filtroAtual === f ? " active" : ""}" data-rodada="${f}">${JG_NOMES_FASE[f] || f}</button>
      `).join("")}
    `;
    return;
  }

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

  const ehMataMata = __todosJogos.length > 0 && jgEhMataMata(__todosJogos[0]);

  const filtrados = __filtroAtual === "todos"
    ? __todosJogos
    : ehMataMata
      ? __todosJogos.filter(j => j.fase === __filtroAtual)
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

  const grupos = {};
  filtrados.forEach(j => {
    const chave = jgChaveGrupo(j);
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(j);
  });

  const filtrandoGrupoUnico = __filtroAtual !== "todos";

  const chavesOrdenadas = ehMataMata
    ? Object.keys(grupos).sort((a, b) => (JG_ORDEM_FASE[a] ?? 99) - (JG_ORDEM_FASE[b] ?? 99))
    : Object.keys(grupos).sort((a, b) => Number(a) - Number(b));

  lista.innerHTML = chavesOrdenadas
    .map(chave => `
      ${filtrandoGrupoUnico ? "" : `
        <div class="rodada-header">
          <h3>${jgRotuloGrupo(grupos[chave][0])}</h3>
          <div class="linha"></div>
        </div>
      `}
      ${grupos[chave].map(j => jogoCardHtml(j, __eventosGolPorJogo[j.id])).join("")}
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
