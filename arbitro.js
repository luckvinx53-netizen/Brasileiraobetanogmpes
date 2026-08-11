// =========================================================
// DETALHES DO ÁRBITRO
// Aberta a partir do link no card de Arbitragem (jogo.html), recebe o
// nome do árbitro/assistente via query string (?nome=...) e monta um
// "raio-x": categoria (se cadastrado em arbitros_cbf), últimos jogos em
// que atuou (em qualquer uma das 4 funções: árbitro central, 1º/2º
// assistente ou 4º árbitro), quantos cartões (amarelos/vermelhos) saíram
// nesses jogos, e os últimos estádios onde apitou.
//
// Não existe um "arbitro_id" salvo em eventos_jogo — a arbitragem é
// gravada por NOME (texto) na tabela arbitragem_jogo, uma linha por
// jogo com as 4 funções em colunas. Por isso o caminho aqui é:
//   1) achar todas as linhas de arbitragem_jogo em que o nome aparece
//      em QUALQUER uma das 4 colunas (arbitro/assistente_1/assistente_2/
//      quarto_arbitro);
//   2) a partir dos jogo_id encontrados, buscar os jogos (com os times);
//   3) contar os cartões (eventos_jogo) desses mesmos jogos.
// =========================================================

const AR_FUNCOES = [
  { chave: "arbitro", label: "Árbitro central" },
  { chave: "assistente_1", label: "1º Assistente" },
  { chave: "assistente_2", label: "2º Assistente" },
  { chave: "quarto_arbitro", label: "4º Árbitro" },
];

async function carregarArbitro() {
  const params = new URLSearchParams(window.location.search);
  const nome = params.get("nome");
  const area = document.getElementById("detalhesArbitro");

  if (!nome) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Árbitro não encontrado</h3></div>`;
    return;
  }

  // Cadastro do árbitro (categoria: central/assistente/video), se existir.
  const { data: cadastro } = await supabaseClient
    .from("arbitros_cbf")
    .select("*")
    .eq("nome", nome)
    .maybeSingle();

  // Todas as escalações em que esse nome aparece, em qualquer função.
  const filtroOr = AR_FUNCOES.map(f => `${f.chave}.eq.${nome}`).join(",");
  const { data: escalacoes, error: erroEscalacoes } = await supabaseClient
    .from("arbitragem_jogo")
    .select("*")
    .or(filtroOr);

  if (erroEscalacoes) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar árbitro</h3><p>${erroEscalacoes.message}</p></div>`;
    return;
  }

  if (!escalacoes || !escalacoes.length) {
    area.innerHTML = `
      ${arHeroHtml(nome, cadastro, 0, 0, 0)}
      <div class="card" style="margin-top:16px;">
        <div class="empty-state" style="padding:30px 20px;">
          <div class="icon">📋</div>
          <h3>Nenhum jogo registrado ainda</h3>
          <p>Este árbitro ainda não apitou nenhuma partida no sistema.</p>
        </div>
      </div>
    `;
    return;
  }

  const idsJogos = escalacoes.map(e => e.jogo_id);
  const mapaFuncaoPorJogo = Object.fromEntries(
    escalacoes.map(e => [e.jogo_id, AR_FUNCOES.filter(f => e[f.chave] === nome).map(f => f.label)])
  );

  const { data: jogos, error: erroJogos } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .in("id", idsJogos)
    .order("data_jogo", { ascending: false })
    .order("hora_jogo", { ascending: false });

  if (erroJogos) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar jogos do árbitro</h3><p>${erroJogos.message}</p></div>`;
    return;
  }

  const { data: eventos, error: erroEventos } = await supabaseClient
    .from("eventos_jogo")
    .select("jogo_id, tipo")
    .in("jogo_id", idsJogos)
    .in("tipo", ["Cartão Amarelo", "Cartão Vermelho"]);

  if (erroEventos) console.error("Erro ao carregar cartões:", erroEventos);

  const amarelosPorJogo = {};
  const vermelhosPorJogo = {};
  let totalAmarelos = 0;
  let totalVermelhos = 0;

  (eventos || []).forEach(e => {
    if (e.tipo === "Cartão Amarelo") {
      amarelosPorJogo[e.jogo_id] = (amarelosPorJogo[e.jogo_id] || 0) + 1;
      totalAmarelos++;
    } else if (e.tipo === "Cartão Vermelho") {
      vermelhosPorJogo[e.jogo_id] = (vermelhosPorJogo[e.jogo_id] || 0) + 1;
      totalVermelhos++;
    }
  });

  area.innerHTML = `
    ${arHeroHtml(nome, cadastro, jogos.length, totalAmarelos, totalVermelhos)}
    ${arEstadiosHtml(jogos)}
    ${arJogosHtml(jogos, mapaFuncaoPorJogo, amarelosPorJogo, vermelhosPorJogo)}
  `;
}

function arHeroHtml(nome, cadastro, totalJogos, totalAmarelos, totalVermelhos) {
  const mediaAmarelos = totalJogos ? (totalAmarelos / totalJogos).toFixed(1) : "0.0";
  const mediaVermelhos = totalJogos ? (totalVermelhos / totalJogos).toFixed(1) : "0.0";

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="escudo-placeholder" style="width:56px;height:56px;font-size:20px;">🧑‍⚖️</div>
        <div>
          <h2 style="font-family:var(--font-display);font-size:22px;margin:0;">${nome}</h2>
          ${cadastro ? `<div class="text-dim" style="font-size:12.5px;margin-top:2px;">${MC_LABEL_CATEGORIA_ARBITRO_PUB[cadastro.categoria] || cadastro.categoria}</div>` : ""}
        </div>
      </div>

      <div class="mc-estadio-detalhes" style="margin-top:16px;">
        <div class="mc-estadio-item">
          <span class="mc-estadio-label">Jogos apitados</span>
          <span class="mc-estadio-valor">${totalJogos}</span>
        </div>
        <div class="mc-estadio-item">
          <span class="mc-estadio-label">🟨 Cartões amarelos</span>
          <span class="mc-estadio-valor">${totalAmarelos} <span class="text-dim" style="font-weight:500;">(${mediaAmarelos}/jogo)</span></span>
        </div>
        <div class="mc-estadio-item">
          <span class="mc-estadio-label">🟥 Cartões vermelhos</span>
          <span class="mc-estadio-valor">${totalVermelhos} <span class="text-dim" style="font-weight:500;">(${mediaVermelhos}/jogo)</span></span>
        </div>
      </div>
    </div>
  `;
}

const MC_LABEL_CATEGORIA_ARBITRO_PUB = { central: "Árbitro central (CBF)", assistente: "Árbitro assistente (CBF)", video: "Árbitro de vídeo — VAR (CBF)" };

// Lista os estádios mais recentes em que o árbitro apitou, sem repetir
// (mantém só a aparição mais recente de cada estádio, já que jogos vem
// ordenado por data decrescente).
function arEstadiosHtml(jogos) {
  const vistos = new Set();
  const estadios = [];
  jogos.forEach(j => {
    const nomeEstadio = j.local || "Local não informado";
    if (!vistos.has(nomeEstadio)) {
      vistos.add(nomeEstadio);
      estadios.push({ nome: nomeEstadio, data: j.data_jogo });
    }
  });

  if (!estadios.length) return "";

  const linhas = estadios.slice(0, 6).map(e => `
    <a class="mc-estadio-item" style="text-decoration:none;color:inherit;" href="estadio.html?nome=${encodeURIComponent(e.nome)}">
      <span class="mc-estadio-label">📍 ${e.nome}</span>
      <span class="mc-estadio-valor" style="font-weight:500;color:var(--text-dim);">${formatarData(e.data)}</span>
    </a>
  `).join("");

  return `
    <div class="card" style="margin-top:16px;">
      <h2 style="font-family:var(--font-display);font-size:20px;margin:0 0 10px;">Últimos estádios</h2>
      <div class="mc-estadio-detalhes">${linhas}</div>
    </div>
  `;
}

function arJogosHtml(jogos, mapaFuncaoPorJogo, amarelosPorJogo, vermelhosPorJogo) {
  if (!jogos.length) {
    return `
      <div class="card" style="margin-top:16px;">
        <div class="empty-state" style="padding:30px 20px;">
          <div class="icon">📋</div>
          <h3>Nenhum jogo registrado ainda</h3>
        </div>
      </div>
    `;
  }

  const linhas = jogos.map(j => {
    const amarelos = amarelosPorJogo[j.id] || 0;
    const vermelhos = vermelhosPorJogo[j.id] || 0;
    const funcoes = (mapaFuncaoPorJogo[j.id] || []).join(" · ");

    return `
      <a class="admin-item" style="display:block;" href="jogo.html?id=${j.id}">
        <div class="title">${j.time_casa?.nome || "?"} ${j.placar_casa ?? "-"} x ${j.placar_fora ?? "-"} ${j.time_fora?.nome || "?"}</div>
        <div class="meta">${formatarData(j.data_jogo)}${j.hora_jogo ? " • " + j.hora_jogo : ""} · ${j.status}${funcoes ? " · " + funcoes : ""}</div>
        <div class="meta">📍 ${j.local || "Local não informado"} · 🟨 ${amarelos} · 🟥 ${vermelhos}</div>
      </a>
    `;
  }).join("");

  return `
    <div class="card" style="margin-top:16px;">
      <h2 style="font-family:var(--font-display);font-size:20px;margin:0 0 10px;">Últimos jogos</h2>
      ${linhas}
    </div>
  `;
}

carregarArbitro();
