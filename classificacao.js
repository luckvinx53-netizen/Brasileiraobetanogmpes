// =========================================================
// CLASSIFICAÇÃO COMPLETA
// Quando a competição selecionada no topbar é mata-mata (Copa do
// Brasil), esta página mostra o chaveamento em vez da tabela de
// pontos corridos — a Copa não tem classificação por pontos.
// As funções de bracket (mmBracket...) ficam em utils.js, compartilhadas
// com o resumo da Home.
// =========================================================

async function carregarTabela() {
  const tabelaWrap = document.getElementById("tabelaWrap");
  const legenda = document.getElementById("legendaZonas");
  const bracketArea = document.getElementById("bracketArea");
  const tabela = document.getElementById("tabelaCompleta");
  const titulo = document.getElementById("tituloClassificacao");

  const competicao = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
  const ehMataMata = competicao?.formato === "mata_mata" || competicao?.slug === "copa-do-brasil";

  if (ehMataMata) {
    if (tabelaWrap) tabelaWrap.style.display = "none";
    if (legenda) legenda.style.display = "none";
    if (bracketArea) bracketArea.style.display = "";
    if (titulo) titulo.textContent = "Chaveamento";
    await carregarBracketNaClassificacao(bracketArea);
    return;
  }

  if (tabelaWrap) tabelaWrap.style.display = "";
  if (legenda) legenda.style.display = "";
  if (bracketArea) bracketArea.style.display = "none";
  if (titulo) titulo.textContent = "Classificação";

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    tabela.innerHTML = `<tr><td colspan="10">Nenhuma temporada ativa.</td></tr>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from("times")
    .select("*")
    .eq("temporada_id", temporada.id)
    .order("pontos", { ascending: false })
    .order("saldo", { ascending: false })
    .order("gols_pro", { ascending: false });

  if (error) {
    tabela.innerHTML = `<tr><td colspan="10">Erro ao carregar tabela.</td></tr>`;
    console.error(error);
    return;
  }

  tabela.innerHTML = (data || []).map((time, index) => {
    let classeZona = "";
    if (index < 4) classeZona = "zona-g4";
    else if (index === 4) classeZona = "zona-pre-libertadores";
    else if (index >= 5 && index <= 11) classeZona = "zona-sul-americana";
    else if (index >= (data.length - 4)) classeZona = "zona-rebaixamento";

    const aproveitamento = time.jogos > 0
      ? Math.round((time.pontos / (time.jogos * 3)) * 100)
      : 0;

    return `
      <tr class="${classeZona}" onclick="location.href='time?id=${time.id}'" style="cursor:pointer;">
        <td>${index + 1}</td>
        <td>${escudoHtml(time).replace('class="escudo"', 'class="escudo" style="width:22px;height:22px;"')} ${time.nome}</td>
        <td>${time.pontos}</td>
        <td>${time.jogos}</td>
        <td>${time.vitorias}</td>
        <td>${time.empates}</td>
        <td>${time.derrotas}</td>
        <td>${time.gols_pro}</td>
        <td>${time.gols_contra}</td>
        <td>${time.saldo}</td>
        <td>${aproveitamento}%</td>
      </tr>
    `;
  }).join("");
}

// ---------------------------------------------------------
// Chaveamento (mata-mata) — mostrado no lugar da tabela quando a
// competição selecionada é a Copa do Brasil.
// ---------------------------------------------------------
async function carregarBracketNaClassificacao(area) {
  if (!area) return;
  area.innerHTML = `<div class="empty-state"><div class="icon">⏳</div><h3>Carregando...</h3></div>`;

  try {
    const temporada = await getTemporadaAtiva();
    if (!temporada) {
      area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Nenhuma temporada ativa</h3></div>`;
      return;
    }

    const { data: confrontos, error: erroConfrontos } = await supabaseClient
      .from("confrontos_mata_mata")
      .select("*, time_a:time_a_id(*), time_b:time_b_id(*), vencedor:vencedor_id(*)")
      .eq("temporada_id", temporada.id)
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

    area.innerHTML = `<div class="cdb-bracket">${MM_ORDEM_FASE.map(f => mmBracketColunaHtml(f, confrontos)).join("")}</div>`;
  } catch (e) {
    console.error("Falha ao carregar chaveamento da Copa do Brasil:", e);
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar</h3></div>`;
  }
}

// competicoes.js/getCompeticaoAtual roda de forma assíncrona; espera
// o layout terminar de montar (mesmo padrão usado em outras páginas)
// antes de decidir tabela vs. chaveamento, pra já pegar a competição
// certa mesmo em navegação direta (refresh) na página.
document.addEventListener("DOMContentLoaded", carregarTabela);
