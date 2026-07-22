// =========================================================
// NOTÍCIAS — mescla as notícias publicadas pelo admin com os
// "furos de mercado" (rumores vazados + transferências confirmadas),
// gerados a partir de bid_transferencias em mercado-noticias.js.
// =========================================================

let noticiasFiltroAtivo = "todas"; // "todas" | "mercado" | "jogos"
let noticiasCacheCombinado = null; // guarda o resultado já buscado, pra trocar de filtro sem refazer as queries

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

  if (filtrados.length === 0) {
    lista.innerHTML = noticiasFiltrosHtml() + `
      <div class="empty-state"><div class="icon">📰</div><h3>Nada por aqui ainda</h3><p>As novidades do campeonato aparecem aqui.</p></div>
    `;
    return;
  }

  lista.innerHTML = noticiasFiltrosHtml() + filtrados.map(n => noticiaCardHtml(n)).join("");
}

function noticiaCardHtml(n) {
  if (n.origem === "rumor" || n.origem === "confirmada") {
    const icone = n.origem === "rumor" ? "🗞️" : "✅";
    return `
      <div class="news-card mercado ${n.origem}" onclick="location.href='materia?id=${n.consultaId}&tipo=${n.origem}'" style="cursor:pointer;">
        <span class="news-icone">${icone}</span>
        <div class="body">
          <span class="mercado-tag">${n.tag}</span>
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
        <span class="news-icone">⚽</span>
        <div class="body">
          <span class="mercado-tag jogo">${n.tag}</span>
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

carregarNoticias();
