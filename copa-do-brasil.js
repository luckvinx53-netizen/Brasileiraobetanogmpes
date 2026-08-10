// =========================================================
// COPA DO BRASIL — chaveamento público (só leitura)
// =========================================================

const CDBP_FASES = ["oitavas", "quartas", "semifinal", "final"];
const CDBP_NOME_FASE = {
  oitavas: "Oitavas",
  quartas: "Quartas",
  semifinal: "Semifinal",
  final: "Final",
};

document.addEventListener("DOMContentLoaded", carregarBracketPublico);

async function carregarBracketPublico() {
  const area = document.getElementById("cdbBracketArea");
  if (!area) return;

  try {
    const { data: competicao, error: erroCompeticao } = await supabaseClient
      .from("competicoes")
      .select("id")
      .eq("slug", "copa-do-brasil")
      .maybeSingle();

    if (erroCompeticao || !competicao) {
      area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Copa do Brasil ainda não configurada</h3></div>`;
      return;
    }

    const { data: temporadas, error: erroTemporada } = await supabaseClient
      .from("temporadas")
      .select("id")
      .eq("competicao_id", competicao.id)
      .eq("ativa", true)
      .order("criado_em", { ascending: false })
      .limit(1);

    if (erroTemporada || !temporadas || !temporadas.length) {
      area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Nenhuma temporada ativa</h3></div>`;
      return;
    }

    const { data: confrontos, error: erroConfrontos } = await supabaseClient
      .from("confrontos_mata_mata")
      .select("*, time_a:time_a_id(*), time_b:time_b_id(*), vencedor:vencedor_id(*)")
      .eq("temporada_id", temporadas[0].id)
      .order("fase", { ascending: true })
      .order("ordem", { ascending: true });

    if (erroConfrontos) {
      area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>${erroConfrontos.message}</h3></div>`;
      return;
    }

    if (!confrontos || !confrontos.length) {
      area.innerHTML = `<div class="empty-state"><div class="icon">🏆</div><h3>O sorteio ainda não saiu</h3><p>Volte em breve para acompanhar o chaveamento.</p></div>`;
      return;
    }

    area.innerHTML = `<div class="cdb-bracket">${CDBP_FASES.map(f => cdbpColunaHtml(f, confrontos)).join("")}</div>`;
  } catch (e) {
    console.error("Falha ao carregar chaveamento da Copa do Brasil:", e);
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar</h3></div>`;
  }
}

function cdbpColunaHtml(fase, confrontos) {
  const confrontosFase = confrontos.filter(c => c.fase === fase).sort((a, b) => a.ordem - b.ordem);
  if (!confrontosFase.length) return "";

  return `
    <div class="cdb-bracket-coluna">
      <h3>${CDBP_NOME_FASE[fase]}</h3>
      ${confrontosFase.map(cdbpConfrontoCardHtml).join("")}
    </div>
  `;
}

function cdbpConfrontoCardHtml(confronto) {
  const timeA = confronto.time_a;
  const timeB = confronto.time_b;
  const vencedor = confronto.vencedor;

  const linhaTime = (time, golsAgregado) => `
    <div class="cdb-jogo-linha" style="cursor:default;">
      <span class="${vencedor && time && vencedor.id === time.id ? 'cdb-vencedor' : ''}">${time ? time.nome : 'A definir'}</span>
      <span>${confronto.vencedor_id || confronto.agregado_a || confronto.agregado_b ? golsAgregado : ''}</span>
    </div>
  `;

  const penaltisTxt = confronto.foi_penaltis ? `<div class="cdb-confronto-sub">Pênaltis: ${confronto.penaltis_a}-${confronto.penaltis_b}</div>` : "";

  return `
    <div class="cdb-confronto-card ${vencedor ? 'cdb-definido' : ''}" onclick="cdbpAbrirPrimeiroJogo('${confronto.id}')">
      ${linhaTime(timeA, confronto.agregado_a)}
      ${linhaTime(timeB, confronto.agregado_b)}
      ${penaltisTxt}
    </div>
  `;
}

async function cdbpAbrirPrimeiroJogo(confrontoId) {
  const { data: jogos } = await supabaseClient
    .from("jogos")
    .select("id, perna")
    .eq("confronto_id", confrontoId)
    .order("perna", { ascending: true });

  if (jogos && jogos.length) {
    window.location.href = `jogo?id=${jogos[0].id}`;
  }
}
