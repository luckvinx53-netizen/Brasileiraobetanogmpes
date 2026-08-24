// =========================================================
// TIMES
// =========================================================

async function carregarTimes() {
  const lista = document.getElementById("listaTimes");

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">🛡️</div><h3>Nenhuma temporada ativa</h3></div>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from("times")
    .select("*")
    .eq("temporada_id", temporada.id)
    .eq("serie", "A")
    .order("nome", { ascending: true });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar times</h3></div>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">🛡️</div><h3>Nenhum time cadastrado</h3></div>`;
    return;
  }

  lista.innerHTML = data.map(time => `
    <div class="time-item" onclick="location.href='time?id=${time.id}'" style="cursor:pointer;">
      ${escudoHtml(time, "escudo").replace('class="escudo"', 'class="escudo" style="width:46px;height:46px;"')}
      <div class="info">
        <h3>${time.nome}</h3>
        <p>${time.jogos} jogos · ${time.vitorias}V ${time.empates}E ${time.derrotas}D</p>
      </div>
      <div class="pts">${time.pontos}<span>pontos</span></div>
    </div>
  `).join("");
}

carregarTimes();
