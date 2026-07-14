// =========================================================
// ARTILHARIA
// =========================================================

async function carregarArtilharia() {
  const lista = document.getElementById("listaArtilharia");

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚽</div><h3>Nenhuma temporada ativa</h3></div>`;
    return;
  }

  // Pega ids dos times da temporada ativa, depois os jogadores desses times
  const { data: times } = await supabaseClient
    .from("times")
    .select("id, nome")
    .eq("temporada_id", temporada.id);

  const idsTimes = (times || []).map(t => t.id);
  const mapaTimes = Object.fromEntries((times || []).map(t => [t.id, t.nome]));

  if (idsTimes.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚽</div><h3>Nenhum time cadastrado</h3></div>`;
    return;
  }

  const { data: jogadores, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .in("time_id", idsTimes)
    .order("gols", { ascending: false })
    .limit(30);

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar artilharia</h3></div>`;
    console.error(error);
    return;
  }

  const artilheiros = (jogadores || []).filter(j => j.gols > 0);

  if (artilheiros.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚽</div><h3>Nenhum gol registrado ainda</h3><p>Os artilheiros aparecem aqui assim que os gols forem cadastrados.</p></div>`;
    return;
  }

  lista.innerHTML = artilheiros.map((j, i) => `
    <div class="artilheiro-item" onclick="location.href='jogador.html?id=${j.id}'" style="cursor:pointer;">
      <div class="rank">${i + 1}</div>
      <div class="info">
        <h4>${j.nome}</h4>
        <p>${mapaTimes[j.time_id] || ""} ${j.posicao ? "· " + j.posicao : ""}</p>
      </div>
      <div class="gols">${j.gols}<span>gols</span></div>
    </div>
  `).join("");
}

carregarArtilharia();
