// =========================================================
// CLASSIFICAÇÃO COMPLETA
// Quando a competição selecionada no topbar é mata-mata (Copa do
// Brasil), esta página mostra o chaveamento em vez da tabela de
// pontos corridos — a Copa não tem classificação por pontos.
// As funções de bracket (mmBracket...) ficam em utils.js, compartilhadas
// com o resumo da Home.
//
// Libertadores/Sul-Americana (formato "grupos_mata_mata") têm fase de
// grupos própria: 8 grupos de 4 times, turno e returno. Regulamento
// oficial (2026): só o 1º colocado de cada grupo avança direto às
// oitavas de final; o 2º colocado disputa um playoff (2º da Sula x 3º
// da Liberta, e vice-versa) por uma vaga nas oitavas; 3º e 4º são
// eliminados. Por isso a tela mostra uma mini-tabela por grupo (usando
// as tabelas grupos/grupo_times/grupos_classificacao), com legenda e
// zonas próprias — nada de G-4/Sul-Americana/rebaixamento, que são
// zonas do formato de pontos corridos do Brasileirão.
// =========================================================

const LEGENDA_ZONAS_PONTOS_CORRIDOS = `
  <div class="flex-gap" style="align-items:center;margin-bottom:10px;">
    <span style="width:10px;height:10px;border-radius:3px;background:var(--grama);display:inline-block;"></span>
    <span class="text-dim" style="font-size:12.5px;">G-4 — Libertadores</span>
  </div>
  <div class="flex-gap" style="align-items:center;margin-bottom:10px;">
    <span style="width:10px;height:10px;border-radius:3px;background:#2dd4bf;display:inline-block;"></span>
    <span class="text-dim" style="font-size:12.5px;">5º — Pré-Libertadores</span>
  </div>
  <div class="flex-gap" style="align-items:center;margin-bottom:10px;">
    <span style="width:10px;height:10px;border-radius:3px;background:var(--azul);display:inline-block;"></span>
    <span class="text-dim" style="font-size:12.5px;">6º ao 12º — Sul-Americana</span>
  </div>
  <div class="flex-gap" style="align-items:center;">
    <span style="width:10px;height:10px;border-radius:3px;background:var(--vermelho);display:inline-block;"></span>
    <span class="text-dim" style="font-size:12.5px;">Z-4 — Rebaixamento</span>
  </div>
`;

const LEGENDA_ZONAS_GRUPOS = `
  <div class="flex-gap" style="align-items:center;margin-bottom:10px;">
    <span style="width:10px;height:10px;border-radius:3px;background:var(--grama);display:inline-block;"></span>
    <span class="text-dim" style="font-size:12.5px;">1º — Classificado direto às oitavas</span>
  </div>
  <div class="flex-gap" style="align-items:center;">
    <span style="width:10px;height:10px;border-radius:3px;background:#2dd4bf;display:inline-block;"></span>
    <span class="text-dim" style="font-size:12.5px;">2º — Vai para o playoff (oitavas)</span>
  </div>
`;

async function carregarTabela() {
  const tabelaWrap = document.getElementById("tabelaWrap");
  const gruposArea = document.getElementById("gruposArea");
  const legenda = document.getElementById("legendaZonas");
  const bracketArea = document.getElementById("bracketArea");
  const tabela = document.getElementById("tabelaCompleta");
  const titulo = document.getElementById("tituloClassificacao");

  const competicao = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
  const ehMataMata = competicao?.formato === "mata_mata" || competicao?.slug === "copa-do-brasil";
  const ehGrupos = competicao?.formato === "grupos_mata_mata";

  if (ehMataMata) {
    if (tabelaWrap) tabelaWrap.style.display = "none";
    if (gruposArea) gruposArea.style.display = "none";
    if (legenda) legenda.style.display = "none";
    if (bracketArea) bracketArea.style.display = "";
    if (titulo) titulo.textContent = "Chaveamento";
    await carregarBracketNaClassificacao(bracketArea);
    return;
  }

  if (legenda) {
    legenda.style.display = "";
    legenda.innerHTML = ehGrupos ? LEGENDA_ZONAS_GRUPOS : LEGENDA_ZONAS_PONTOS_CORRIDOS;
  }
  if (bracketArea) bracketArea.style.display = "none";
  if (titulo) titulo.textContent = "Classificação";

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    if (tabelaWrap) tabelaWrap.style.display = "";
    if (gruposArea) gruposArea.style.display = "none";
    tabela.innerHTML = `<tr><td colspan="10">Nenhuma temporada ativa.</td></tr>`;
    return;
  }

  if (ehGrupos) {
    if (tabelaWrap) tabelaWrap.style.display = "none";
    if (gruposArea) gruposArea.style.display = "";
    await carregarClassificacaoPorGrupos(temporada, gruposArea);
    return;
  }

  if (tabelaWrap) tabelaWrap.style.display = "";
  if (gruposArea) gruposArea.style.display = "none";

  const { data, error } = await supabaseClient
    .from("times")
    .select("*")
    .eq("temporada_id", temporada.id)
    .eq("serie", "A")
    .order("nome", { ascending: true });

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
// Classificação por grupos (Libertadores/Sul-Americana).
// Usa grupos + grupo_times + grupos_classificacao. Cada grupo vira
// sua própria mini-tabela, ordenada por pontos/saldo/gols, com o 1º
// e o 2º destacados conforme o regulamento (1º direto, 2º playoff).
// Se ainda não há grupos cadastrados pra temporada, mostra aviso.
// ---------------------------------------------------------
async function carregarClassificacaoPorGrupos(temporada, area) {
  area.innerHTML = `<div class="empty-state"><div class="icon">⏳</div><h3>Carregando...</h3></div>`;

  const { data: grupos, error: erroGrupos } = await supabaseClient
    .from("grupos")
    .select("*, grupo_times(*, times(*)), grupos_classificacao(*, times(*))")
    .eq("temporada_id", temporada.id)
    .order("nome", { ascending: true });

  if (erroGrupos) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar grupos</h3></div>`;
    console.error(erroGrupos);
    return;
  }

  if (!grupos || !grupos.length) {
    area.innerHTML = `<div class="empty-state"><div class="icon">🏆</div><h3>Os grupos ainda não foram sorteados</h3><p>Volte em breve para acompanhar a fase de grupos.</p></div>`;
    return;
  }

  area.innerHTML = grupos.map(grupo => {
    // Prioriza a linha de grupos_classificacao (pontos/saldo já calculados
    // por grupo); se ainda não houver, cai pro time "cru" via grupo_times
    // com estatísticas zeradas (grupo recém-sorteado, sem jogos ainda).
    const linhas = (grupo.grupos_classificacao && grupo.grupos_classificacao.length)
      ? grupo.grupos_classificacao.map(c => ({
          time: c.times,
          pontos: c.pontos, jogos: c.jogos, vitorias: c.vitorias,
          empates: c.empates, derrotas: c.derrotas,
          gols_pro: c.gols_pro, gols_contra: c.gols_contra, saldo: c.saldo,
        }))
      : (grupo.grupo_times || []).map(gt => ({
          time: gt.times,
          pontos: 0, jogos: 0, vitorias: 0, empates: 0, derrotas: 0,
          gols_pro: 0, gols_contra: 0, saldo: 0,
        }));

    linhas.sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.gols_pro - a.gols_pro);

    const linhasHtml = linhas.map((l, index) => {
      let classeZona = "";
      if (index === 0) classeZona = "zona-g4";
      else if (index === 1) classeZona = "zona-pre-libertadores";

      return `
        <tr class="${classeZona}" onclick="location.href='time?id=${l.time.id}'" style="cursor:pointer;">
          <td>${index + 1}</td>
          <td>${escudoHtml(l.time).replace('class="escudo"', 'class="escudo" style="width:20px;height:20px;"')} ${l.time.nome}</td>
          <td>${l.pontos}</td>
          <td>${l.jogos}</td>
          <td>${l.vitorias}</td>
          <td>${l.empates}</td>
          <td>${l.derrotas}</td>
          <td>${l.gols_pro}</td>
          <td>${l.gols_contra}</td>
          <td>${l.saldo}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:10px;">${grupo.nome}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Time</th><th>PTS</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr>
            </thead>
            <tbody>${linhasHtml}</tbody>
          </table>
        </div>
      </div>
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
