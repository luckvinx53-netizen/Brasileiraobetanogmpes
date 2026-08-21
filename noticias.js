// =========================================================
// NOTÍCIAS — mescla as notícias publicadas pelo admin com os
// "furos de mercado" (rumores vazados + transferências confirmadas),
// gerados a partir de bid_transferencias em mercado-noticias.js.
// =========================================================

let noticiasFiltroAtivo = "todas"; // "todas" | "mercado" | "jogos"
let noticiasCacheCombinado = null; // guarda o resultado já buscado, pra trocar de filtro sem refazer as queries
let noticiasBuscaAtiva = ""; // texto digitado na busca

async function carregarNoticias() {
  const lista = document.getElementById("listaNoticias");

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">📰</div><h3>Nenhuma temporada ativa</h3></div>`;
    return;
  }

  // Mercado (rumores + confirmadas) é igual em qualquer competição —
  // por isso NÃO recebe temporada aqui, ao contrário de fimDeJogo, que
  // é específico da competição selecionada no seletor do topbar.
  const [rumores, confirmadas, fimDeJogo] = await Promise.all([
    typeof buscarRumoresComoNoticias === "function" ? buscarRumoresComoNoticias() : [],
    typeof buscarConfirmadasComoNoticias === "function" ? buscarConfirmadasComoNoticias() : [],
    typeof buscarFimDeJogoComoNoticias === "function" ? buscarFimDeJogoComoNoticias() : [],
  ]);

  const combinado = [...rumores, ...confirmadas, ...fimDeJogo]
    .sort((a, b) => b.data - a.data);

  noticiasCacheCombinado = combinado;
  renderizarNoticias();
}

function noticiasMudarFiltro(filtro) {
  noticiasFiltroAtivo = filtro;
  renderizarNoticias();
}

function noticiasBuscar(texto) {
  noticiasBuscaAtiva = (texto || "").trim();
  renderizarNoticias();
}

// Retira acentos/caixa pra busca não depender de digitar exatamente
// igual (ex: "flamengo" acha "Flamengo", "sao paulo" acha "São Paulo").
function noticiasNormalizarBusca(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function noticiasBuscaBarraHtml() {
  return `
    <div class="news-busca-barra">
      <span class="news-busca-icone">🔎</span>
      <input
        type="text"
        id="noticiasBuscaInput"
        class="news-busca-input"
        placeholder="Buscar por time, jogador ou notícia..."
        value="${noticiasBuscaAtiva.replace(/"/g, "&quot;")}"
        oninput="noticiasBuscar(this.value)"
      >
      ${noticiasBuscaAtiva ? `<button class="news-busca-limpar" onclick="noticiasBuscar('')">✕</button>` : ""}
    </div>
  `;
}

function noticiasFiltrosHtml() {
  const filtros = [
    { id: "todas", label: "Todas" },
    { id: "mercado", label: "🗞️ Mercado" },
    { id: "jogos", label: "⚽ Jogos" },
  ];
  return `
    <div class="news-filtros">
      ${filtros.map(f => `
        <button class="news-filtro-btn ${noticiasFiltroAtivo === f.id ? "active" : ""}" onclick="noticiasMudarFiltro('${f.id}')">
          ${f.label}
        </button>
      `).join("")}
    </div>
  `;
}

function renderizarNoticias() {
  const lista = document.getElementById("listaNoticias");
  if (!noticiasCacheCombinado) return;

  const filtrados = noticiasCacheCombinado.filter(n => {
    if (noticiasFiltroAtivo === "mercado") return n.origem === "rumor" || n.origem === "confirmada";
    if (noticiasFiltroAtivo === "jogos") return n.origem === "jogo";
    return true;
  });

  const buscaNorm = noticiasNormalizarBusca(noticiasBuscaAtiva);
  const encontrados = buscaNorm
    ? filtrados.filter(n => noticiasNormalizarBusca(`${n.titulo} ${n.resumo || ""}`).includes(buscaNorm))
    : filtrados;

  const cabecalho = noticiasBuscaBarraHtml() + noticiasFiltrosHtml();

  if (encontrados.length === 0) {
    lista.innerHTML = cabecalho + (buscaNorm
      ? `<div class="empty-state"><div class="icon">🔎</div><h3>Nada encontrado para "${noticiasBuscaAtiva}"</h3><p>Tente buscar pelo nome de um time ou jogador.</p></div>`
      : `<div class="empty-state"><div class="icon">📰</div><h3>Nada por aqui ainda</h3><p>As novidades do campeonato aparecem aqui.</p></div>`);
    return;
  }

  // Só agrupa em "cobertura completa" (vários veículos, mesmo fato)
  // quando o usuário está buscando — é o comportamento estilo Google
  // Notícias do print. Sem busca, a timeline normal mostra cada
  // publicação na sua própria ordem cronológica, como sempre foi.
  if (buscaNorm) {
    lista.innerHTML = cabecalho + noticiasAgrupadasHtml(encontrados);
  } else {
    lista.innerHTML = cabecalho + encontrados.map(n => noticiaCardHtml(n)).join("");
  }
}

// Agrupa os resultados por grupoId (mesma transferência) — cada grupo
// vira um bloco com a manchete "chapéu" e, dentro, um card por veículo
// que cobriu aquele mesmo fato. Itens sem grupoId (rumores, notícias
// de fim de jogo, notícias do admin) continuam soltos, um card cada.
function noticiasAgrupadasHtml(itens) {
  const grupos = new Map(); // grupoId -> itens[]
  const soltos = [];

  itens.forEach(n => {
    if (n.grupoId) {
      if (!grupos.has(n.grupoId)) grupos.set(n.grupoId, []);
      grupos.get(n.grupoId).push(n);
    } else {
      soltos.push(n);
    }
  });

  const blocosGrupo = Array.from(grupos.values()).map(itensDoGrupo => {
    if (itensDoGrupo.length === 1) return noticiaCardHtml(itensDoGrupo[0]);

    const ordenado = [...itensDoGrupo].sort((a, b) => a.data - b.data);
    const chapeu = ordenado[0]; // primeira cobertura publicada = "furo"

    return `
      <div class="news-grupo">
        <p class="news-grupo-titulo">${chapeu.titulo}</p>
        <div class="news-grupo-fontes">
          ${ordenado.map(n => noticiaCardHtml(n, true)).join("")}
        </div>
      </div>
    `;
  });

  // Mistura os blocos de grupo com os itens soltos. Simplificação
  // deliberada: mantemos a ordem em que já chegaram (mais recentes
  // primeiro, herdada da query original) em vez de reordenar por
  // grupo — evita simular uma cronologia que não existe de verdade.
  return [...blocosGrupo, ...soltos.map(n => noticiaCardHtml(n))].join("");
}

function noticiaCardHtml(n, dentroDeGrupo) {
  if (n.origem === "rumor" || n.origem === "confirmada") {
    const icone = n.origem === "rumor" ? "🗞️" : "✅";
    const href = `materia?id=${n.consultaId}&tipo=${n.origem}${n.veiculoParam ? "&veiculo=" + encodeURIComponent(n.veiculoParam) : ""}`;

    if (dentroDeGrupo) {
      // Card compacto (estilo Google Notícias): ícone do veículo,
      // manchete própria daquele veículo e "há X horas/dias".
      return `
        <div class="news-fonte-card" onclick="location.href='${href}'" style="cursor:pointer;">
          <span class="news-fonte-icone">${icone}</span>
          <div class="news-fonte-body">
            <p class="news-fonte-veiculo">${tmAssinaturaHtml(n.assinatura)}</p>
            <p class="news-fonte-titulo">${n.titulo}</p>
            <time>${noticiasTempoRelativo(n.data)}</time>
          </div>
        </div>
      `;
    }

    return `
      <div class="news-card mercado ${n.origem}" onclick="location.href='${href}'" style="cursor:pointer;">
        <div class="body">
          <span class="mercado-tag">${icone} ${n.tag}</span>
          <h3>${n.titulo}</h3>
          <p>${n.resumo}</p>
          <p class="mc-assinatura">${tmAssinaturaHtml(n.assinatura)}</p>
          <time>${n.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</time>
        </div>
      </div>
    `;
  }

  if (n.origem === "jogo") {
    return `
      <div class="news-card mercado jogo" onclick="location.href='materia?id=${n.jogoId}&tipo=jogo'" style="cursor:pointer;">
        <div class="body">
          <span class="mercado-tag jogo">⚽ ${n.tag}</span>
          <h3>${n.titulo}</h3>
          <p>${n.resumo}</p>
          <p class="mc-assinatura">${pnAssinaturaHtml(n.assinatura)}</p>
          <time>${n.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</time>
        </div>
      </div>
    `;
  }

  return "";
}

// "há 12 horas" / "há 2 dias" — igual ao formato do Google Notícias
// que serviu de referência pro agrupamento de cobertura múltipla.
function noticiasTempoRelativo(data) {
  const diffMs = Date.now() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora há pouco";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `há ${diffHoras} hora${diffHoras > 1 ? "s" : ""}`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 30) return `há ${diffDias} dia${diffDias > 1 ? "s" : ""}`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

carregarNoticias();
