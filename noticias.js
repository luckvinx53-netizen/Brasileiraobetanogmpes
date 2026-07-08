// =========================================================
// NOTÍCIAS
// =========================================================

async function carregarNoticias() {
  const lista = document.getElementById("listaNoticias");

  const { data, error } = await supabaseClient
    .from("noticias")
    .select("*")
    .order("publicado_em", { ascending: false })
    .limit(30);

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar notícias</h3></div>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">📰</div><h3>Nenhuma notícia publicada</h3><p>As novidades do campeonato aparecem aqui.</p></div>`;
    return;
  }

  lista.innerHTML = data.map(n => `
    <div class="news-card">
      ${n.imagem_url ? `<img src="${n.imagem_url}" alt="${n.titulo}">` : ""}
      <div class="body">
        <h3>${n.titulo}</h3>
        <p>${n.resumo || n.conteudo || ""}</p>
        <time>${new Date(n.publicado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</time>
      </div>
    </div>
  `).join("");
}

carregarNoticias();
