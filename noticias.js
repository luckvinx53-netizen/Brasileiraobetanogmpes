// =========================================================
// NOTÍCIAS — mescla as notícias publicadas pelo admin com os
// "furos de mercado" (rumores vazados + transferências confirmadas),
// gerados a partir de bid_transferencias em mercado-noticias.js.
// =========================================================

let noticiasFiltroAtivo = "todas"; // "todas" | "oficiais" | "mercado"
let noticiasCacheCombinado = null; // guarda o resultado já buscado, pra trocar de filtro sem refazer as queries

async function carregarNoticias() {
  const lista = document.getElementById("listaNoticias");

  const [{ data: oficiais, error }, rumores, confirmadas] = await Promise.all([
    supabaseClient.from("noticias").select("*").order("publicado_em", { ascending: false }).limit(30),
    typeof buscarRumoresComoNoticias === "function" ? buscarRumoresComoNoticias() : [],
    typeof buscarConfirmadasComoNoticias === "function" ? buscarConfirmadasComoNoticias() : [],
  ]);

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar notícias</h3></div>`;
    console.error(error);
    return;
  }

  const oficiaisNormalizadas = (oficiais || []).map(n => ({
    origem: "oficial",
    id: `oficial-${n.id}`,
    data: new Date(n.publicado_em),
    titulo: n.titulo,
    resumo: n.resumo || n.conteudo || "",
    imagem_url: n.imagem_url || null,
  }));

  const combinado = [...oficiaisNormalizadas, ...rumores, ...confirmadas]
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
    { id: "oficiais", label: "📰 Oficiais" },
    { id: "mercado", label: "🗞️ Mercado" },
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
    if (noticiasFiltroAtivo === "oficiais") return n.origem === "oficial";
    if (noticiasFiltroAtivo === "mercado") return n.origem === "rumor" || n.origem === "confirmada";
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

  return `
    <div class="news-card">
      ${n.imagem_url ? `<img src="${n.imagem_url}" alt="${n.titulo}">` : ""}
      <div class="body">
        <h3>${n.titulo}</h3>
        <p>${n.resumo || ""}</p>
        <time>${n.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</time>
      </div>
    </div>
  `;
}

carregarNoticias();
