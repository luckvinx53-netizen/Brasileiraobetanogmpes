// =========================================================
// REDE SOCIAL — ADMIN
// Publica a "nota oficial" no perfil da CBF e lista os posts
// recentes (automáticos + manuais) da competição atualmente
// selecionada no seletor do topbar.
// =========================================================

async function publicarNotaOficialAdmin() {
  const titulo = document.getElementById("notaOficialTitulo").value.trim();
  const corpo = document.getElementById("notaOficialCorpo").value.trim();
  const status = document.getElementById("statusNotaOficial");

  if (!titulo) {
    notificar("Preencha o título da nota oficial.", "erro");
    return;
  }

  status.innerText = "Publicando...";

  const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;

  const resultado = await rsPublicarNotaOficial({
    titulo,
    corpo,
    competicaoAtual,
    temporadaId: temporadaAtiva?.id || null,
  });

  if (!resultado.ok) {
    status.innerText = "Erro ao publicar: " + (resultado.error?.message || "");
    notificar("Erro ao publicar nota oficial.", "erro");
    return;
  }

  document.getElementById("notaOficialTitulo").value = "";
  document.getElementById("notaOficialCorpo").value = "";
  status.innerText = "✅ Nota oficial publicada na Rede Social.";
  notificar("Nota oficial publicada!");

  carregarRedeSocialAdmin();
}

async function carregarRedeSocialAdmin() {
  const lista = document.getElementById("listaRedeSocialAdmin");
  if (!lista) return;

  const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
  const posts = await rsListarPosts({ competicaoId: competicaoAtual?.id, limite: 30 });

  lista.innerHTML = rsFeedHtml(posts);
}
