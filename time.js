// =========================================================
// DETALHES DO TIME + ELENCO
// =========================================================

async function carregarTime() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const cabecalho = document.getElementById("cabecalhoTime");
  const listaJogadores = document.getElementById("listaJogadoresTime");

  if (!id) {
    cabecalho.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Time não encontrado</h3></div>`;
    listaJogadores.innerHTML = "";
    return;
  }

  const { data: time, error } = await supabaseClient
    .from("times")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !time) {
    cabecalho.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar time</h3></div>`;
    listaJogadores.innerHTML = "";
    return;
  }

  cabecalho.innerHTML = `
    <div class="card" style="display:flex;align-items:center;gap:16px;">
      ${escudoHtml(time, "escudo").replace('class="escudo"', 'class="escudo" style="width:64px;height:64px;"')}
      <div style="flex:1;">
        <h1 style="font-family:var(--font-display);font-size:26px;margin:0 0 4px;">${time.nome}</h1>
        <p class="text-dim" style="margin:0;font-size:13px;">${time.cidade || ""} ${time.estadio ? "· " + time.estadio : ""}</p>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="num">${time.pontos}</div><div class="label">Pontos</div></div>
      <div class="stat-card"><div class="num">${time.jogos}</div><div class="label">Jogos</div></div>
      <div class="stat-card"><div class="num">${time.vitorias}</div><div class="label">Vitórias</div></div>
      <div class="stat-card"><div class="num">${time.saldo}</div><div class="label">Saldo</div></div>
    </div>
  `;

  const { data: jogadores } = await supabaseClient
    .from("jogadores")
    .select("*")
    .eq("time_id", id)
    .order("numero", { ascending: true });

  if (!jogadores || jogadores.length === 0) {
    listaJogadores.innerHTML = `<div class="empty-state"><div class="icon">👤</div><h3>Nenhum jogador cadastrado</h3></div>`;
    return;
  }

  listaJogadores.innerHTML = jogadores.map(j => `
    <div class="time-item">
      <div class="escudo-placeholder">${j.numero ?? "-"}</div>
      <div class="info">
        <h3>${j.nome}</h3>
        <p>${j.posicao || "—"} · ${j.gols} gols · ${j.assistencias} assist.</p>
      </div>
    </div>
  `).join("");
}

carregarTime();
