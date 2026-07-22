// =========================================================
// FEED — rede social do campeonato (visão geral, todos os times
// da competição atualmente selecionada no seletor do topbar).
// =========================================================

async function carregarFeed() {
  const lista = document.getElementById("listaFeed");

  const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;

  const posts = await rsListarPosts({ competicaoId: competicaoAtual?.id, limite: 50 });

  lista.innerHTML = rsFeedHtml(posts);
}

carregarFeed();
