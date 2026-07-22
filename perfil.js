// =========================================================
// PERFIL DO CLUBE — mural de posts (matchday, escalação, fim de
// jogo, nota oficial) do time selecionado por ?time=ID.
// =========================================================

async function carregarPerfil() {
  const params = new URLSearchParams(window.location.search);
  const timeId = params.get("time");

  const cabecalho = document.getElementById("cabecalhoPerfil");
  const mural = document.getElementById("listaMuralPerfil");

  if (!timeId) {
    cabecalho.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Perfil não encontrado</h3></div>`;
    mural.innerHTML = "";
    return;
  }

  const { data: time, error } = await supabaseClient
    .from("times")
    .select("*")
    .eq("id", timeId)
    .single();

  if (error || !time) {
    cabecalho.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar perfil</h3></div>`;
    mural.innerHTML = "";
    return;
  }

  cabecalho.innerHTML = `
    <div class="card cabecalho-time-tema" style="display:flex;align-items:center;gap:16px;">
      ${escudoHtml(time, "escudo").replace('class="escudo"', 'class="escudo" style="width:64px;height:64px;"')}
      <div style="flex:1;">
        <h1 style="font-family:var(--font-display);font-size:24px;margin:0 0 4px;">${time.nome}</h1>
        <p class="text-dim" style="margin:0;font-size:13px;">Perfil oficial · Rede Social do Campeonato</p>
      </div>
      <a href="time?id=${timeId}" class="btn btn-secondary" style="text-decoration:none;white-space:nowrap;">Ver elenco</a>
    </div>
  `;

  if (typeof aplicarTemaTime === "function") {
    aplicarTemaTime(time.nome);
    document.body.classList.add("tema-time");
  }

  const posts = await rsListarPosts({ timeId, limite: 40 });
  mural.innerHTML = rsFeedHtml(posts);
}

carregarPerfil();
