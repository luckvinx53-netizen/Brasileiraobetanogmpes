// =========================================================
// HOME (Início) — conteúdo varia conforme a competição selecionada
// no seletor do topbar (Brasileirão/Libertadores/Sul-Americana/Copa
// do Brasil). Antes, esta página era 100% estática (sempre mostrava
// "Brasileirão Betano" e "Rodada", mesmo trocando de competição).
//
// Duas famílias de formato:
// - pontos_corridos / grupos_mata_mata (Brasileirão, Libertadores,
//   Sul-Americana): hero com nome da competição, stats de
//   times/rodada/líder/gols, tabela de classificação resumida (top 5).
// - mata_mata (Copa do Brasil): não tem "rodada" nem líder por pontos
//   — mostra fase atual e nº de times restantes, e no lugar da tabela
//   mostra um resumo do chaveamento (usa as funções mmBracket... de
//   utils.js, compartilhadas com classificacao.js).
// =========================================================

// Descrição do hero por slug — não é dado de usuário, é copy fixa da
// UI (a tabela "competicoes" não tem coluna de descrição).
const HOME_DESCRICAO_POR_SLUG = {
  "brasileirao": "Acompanhe classificação, jogos, estatísticas e informações dos clubes em tempo real.",
  "libertadores": "Acompanhe grupos, mata-mata, jogos e estatísticas dos clubes na competição mais importante da América do Sul.",
  "sula": "Acompanhe grupos, mata-mata, jogos e estatísticas dos clubes na Sul-Americana.",
  "copa-do-brasil": "Acompanhe o chaveamento mata-mata, os jogos de ida e volta e quem avança rumo ao título.",
};

async function carregarHome() {
  const competicao = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
  const temporada = await getTemporadaAtiva();

  montarHero(competicao);

  if (!temporada) {
    document.getElementById("proximosJogos").innerHTML =
      `<div class="empty-state"><div class="icon">⚽</div><h3>Nenhuma temporada ativa</h3></div>`;
    document.getElementById("classificacaoHome").innerHTML = `<tr><td colspan="8">Nenhuma temporada ativa.</td></tr>`;
    return;
  }

  const ehMataMata = competicao?.formato === "mata_mata";

  await Promise.all([
    carregarProximosJogosHome(temporada),
    ehMataMata ? carregarBracketResumoHome(temporada) : carregarClassificacaoResumoHome(temporada),
    carregarStatsHome(temporada, ehMataMata),
  ]);
}

function montarHero(competicao) {
  const tag = document.getElementById("heroTag");
  const titulo = document.getElementById("heroTitulo");
  const descricao = document.getElementById("heroDescricao");

  const nome = competicao?.nome || "Brasileirão Betano";
  const emoji = competicao?.logo_emoji || "🏆";

  if (tag) tag.textContent = `${emoji} Boas Vindas ao`;
  if (titulo) titulo.innerHTML = nome.replace(" ", "<br>");
  if (descricao) descricao.textContent = HOME_DESCRICAO_POR_SLUG[competicao?.slug] || HOME_DESCRICAO_POR_SLUG["brasileirao"];
}

// ---------- PRÓXIMOS JOGOS (comum aos dois formatos) ----------

async function carregarProximosJogosHome(temporada) {
  const area = document.getElementById("proximosJogos");

  const { data, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .eq("temporada_id", temporada.id)
    .neq("status", "Encerrado")
    .order("data_jogo", { ascending: true })
    .order("hora_jogo", { ascending: true })
    .limit(5);

  if (error) {
    console.error(error);
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar jogos</h3></div>`;
    return;
  }

  if (!data || !data.length) {
    area.innerHTML = `<div class="empty-state"><div class="icon">📅</div><h3>Nenhum jogo agendado</h3></div>`;
    return;
  }

  const jogosChecados = await Promise.all(data.map(j => checarEncerramentoAutomatico(j)));

  area.innerHTML = jogosChecados.map(j => jogoCardHtml(j)).join("");
}

// ---------- CLASSIFICAÇÃO RESUMIDA (pontos corridos / grupos) ----------

async function carregarClassificacaoResumoHome(temporada) {
  document.getElementById("tabelaWrapHome").style.display = "";
  document.getElementById("bracketHome").style.display = "none";
  document.getElementById("tituloSecaoClassificacaoHome").textContent = "Classificação";
  document.getElementById("linkSecaoClassificacaoHome").textContent = "Tabela completa";

  const tabela = document.getElementById("classificacaoHome");

  const { data, error } = await supabaseClient
    .from("times")
    .select("*")
    .eq("temporada_id", temporada.id)
    .order("pontos", { ascending: false })
    .order("saldo", { ascending: false })
    .order("gols_pro", { ascending: false })
    .limit(5);

  if (error) {
    tabela.innerHTML = `<tr><td colspan="8">Erro ao carregar tabela.</td></tr>`;
    console.error(error);
    return;
  }

  tabela.innerHTML = (data || []).map((time, index) => `
    <tr onclick="location.href='time?id=${time.id}'" style="cursor:pointer;">
      <td>${index + 1}</td>
      <td>${escudoHtml(time).replace('class="escudo"', 'class="escudo" style="width:22px;height:22px;"')} ${time.nome}</td>
      <td>${time.pontos}</td>
      <td>${time.jogos}</td>
      <td>${time.vitorias}</td>
      <td>${time.empates}</td>
      <td>${time.derrotas}</td>
      <td>${time.saldo}</td>
    </tr>
  `).join("");
}

// ---------- RESUMO DO CHAVEAMENTO (mata-mata / Copa do Brasil) ----------

async function carregarBracketResumoHome(temporada) {
  document.getElementById("tabelaWrapHome").style.display = "none";
  document.getElementById("bracketHome").style.display = "";
  document.getElementById("tituloSecaoClassificacaoHome").textContent = "Chaveamento";
  document.getElementById("linkSecaoClassificacaoHome").textContent = "Ver completo";
  document.getElementById("linkSecaoClassificacaoHome").href = "classificacao";

  const area = document.getElementById("bracketHome");
  area.innerHTML = `<div class="empty-state"><div class="icon">⏳</div><h3>Carregando...</h3></div>`;

  const { data: confrontos, error } = await supabaseClient
    .from("confrontos_mata_mata")
    .select("*, time_a:time_a_id(*), time_b:time_b_id(*), vencedor:vencedor_id(*)")
    .eq("temporada_id", temporada.id)
    .order("fase", { ascending: true })
    .order("ordem", { ascending: true });

  if (error) {
    console.error(error);
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>${error.message}</h3></div>`;
    return;
  }

  if (!confrontos || !confrontos.length) {
    area.innerHTML = `<div class="empty-state"><div class="icon">🏆</div><h3>O sorteio ainda não saiu</h3><p>Volte em breve para acompanhar o chaveamento.</p></div>`;
    return;
  }

  // Na Home mostra só a fase mais atual (a última com confrontos), pra
  // não repetir o chaveamento inteiro que já existe em /classificacao.
  const faseMaisRecente = [...MM_ORDEM_FASE].reverse().find(f => confrontos.some(c => c.fase === f));

  area.innerHTML = `<div class="cdb-bracket">${mmBracketColunaHtml(faseMaisRecente, confrontos)}</div>`;
}

// ---------- CARDS DE ESTATÍSTICA (varia por formato) ----------

async function carregarStatsHome(temporada, ehMataMata) {
  const [num1, label1] = [document.getElementById("statCard1Num"), document.getElementById("statCard1Label")];
  const [num2, label2] = [document.getElementById("statCard2Num"), document.getElementById("statCard2Label")];
  const [num3, label3] = [document.getElementById("statCard3Num"), document.getElementById("statCard3Label")];
  const [num4, label4] = [document.getElementById("statCard4Num"), document.getElementById("statCard4Label")];

  const { data: times } = await supabaseClient.from("times").select("*").eq("temporada_id", temporada.id);
  const totalTimes = times?.length || 0;

  const { data: jogos } = await supabaseClient.from("jogos").select("*").eq("temporada_id", temporada.id);
  const totalGols = (jogos || []).reduce((soma, j) => soma + (j.placar_casa || 0) + (j.placar_fora || 0), 0);

  label1.textContent = "Times";
  num1.textContent = totalTimes || "–";

  label4.textContent = "Gols";
  num4.textContent = totalGols || "–";

  if (ehMataMata) {
    const { data: confrontos } = await supabaseClient
      .from("confrontos_mata_mata")
      .select("fase, situacao")
      .eq("temporada_id", temporada.id);

    const faseAtual = confrontos?.length
      ? [...MM_ORDEM_FASE].reverse().find(f => confrontos.some(c => c.fase === f))
      : null;

    label2.textContent = "Fase atual";
    num2.textContent = faseAtual ? MM_NOME_FASE[faseAtual] : "–";

    // Times ainda vivos na competição: total de confrontos da fase
    // atual sem vencedor definido ainda contam os 2 lados; já definidos
    // contam só o vencedor (o perdedor já caiu fora).
    const confrontosFaseAtual = (confrontos || []).filter(c => c.fase === faseAtual);
    const vivos = confrontosFaseAtual.length * 2 - confrontosFaseAtual.filter(c => c.situacao === "definido").length;

    label3.textContent = "Times na disputa";
    num3.textContent = faseAtual ? vivos : "–";
    return;
  }

  const rodadaAtual = (jogos || []).length
    ? Math.max(...jogos.map(j => Number(j.rodada) || 0).filter(r => r > 0), 0)
    : 0;

  label2.textContent = "Rodada";
  num2.textContent = rodadaAtual || "–";

  const lider = (times || []).slice().sort((a, b) => (b.pontos ?? 0) - (a.pontos ?? 0))[0];

  label3.textContent = "Pts. líder";
  num3.textContent = lider ? (lider.pontos ?? 0) : "–";
}

document.addEventListener("DOMContentLoaded", carregarHome);
