// =========================================================
// HOME
// =========================================================

async function carregarHome() {
  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    document.getElementById("proximosJogos").innerHTML = `
      <div class="empty-state">
        <div class="icon">⚽</div>
        <h3>Nenhuma temporada ativa</h3>
        <p>Cadastre uma temporada no painel admin para começar.</p>
      </div>`;
    return;
  }

  const { data: times } = await supabaseClient
    .from("times")
    .select("*")
    .eq("temporada_id", temporada.id)
    .order("pontos", { ascending: false })
    .order("saldo", { ascending: false });

  const { data: jogos } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .eq("temporada_id", temporada.id)
    .order("rodada", { ascending: true });

  const listaTimes = times || [];
  const listaJogos = await Promise.all((jogos || []).map(j => checarEncerramentoAutomatico(j)));

  // --- stats ---
  document.getElementById("totalTimes").innerText = listaTimes.length;

  const lider = listaTimes[0];
  document.getElementById("pontosLider").innerText = lider ? lider.pontos : 0;

  const maiorRodada = listaJogos.length
    ? Math.max(...listaJogos.map(j => Number(j.rodada)))
    : 0;
  document.getElementById("rodadaAtual").innerText = maiorRodada ? maiorRodada + "ª" : "–";

  const totalGols = listaTimes.reduce((acc, t) => acc + Number(t.gols_pro || 0), 0);
  document.getElementById("totalGols").innerText = totalGols;

  // --- próximos jogos ---
  const proximos = listaJogos
    .filter(j => j.status !== "Encerrado" && j.status !== "Adiado")
    .slice(0, 3);

  const areaJogos = document.getElementById("proximosJogos");

  if (proximos.length === 0) {
    areaJogos.innerHTML = `
      <div class="empty-state">
        <div class="icon">📅</div>
        <h3>Nenhum jogo agendado</h3>
        <p>Os próximos confrontos aparecem aqui assim que forem cadastrados.</p>
      </div>`;
  } else {
    const { data: eventos } = await supabaseClient
      .from("eventos_jogo")
      .select("*")
      .in("jogo_id", proximos.map(j => j.id))
      .in("tipo", ["Gol", "Gol Contra", "Pênalti Marcado"]);

    const eventosPorJogo = {};
    (eventos || []).forEach(e => {
      if (!eventosPorJogo[e.jogo_id]) eventosPorJogo[e.jogo_id] = [];
      eventosPorJogo[e.jogo_id].push(e);
    });

    areaJogos.innerHTML = proximos.map(j => jogoCardHtml(j, eventosPorJogo[j.id])).join("");
  }

  // --- classificação resumida ---
  const tabela = document.getElementById("classificacaoHome");
  tabela.innerHTML = listaTimes.slice(0, 5).map((time, index) => linhaTabelaHtml(time, index)).join("");
}

function linhaTabelaHtml(time, index) {
  let classeZona = "";
  if (index < 4) classeZona = "zona-g4";
  else if (index === 4) classeZona = "zona-pre-libertadores";

  return `
    <tr class="${classeZona}" onclick="location.href='time.html?id=${time.id}'" style="cursor:pointer;">
      <td>${index + 1}</td>
      <td>${escudoHtml(time, "escudo").replace('class="escudo"', 'class="escudo" style="width:22px;height:22px;"')} ${time.nome}</td>
      <td>${time.pontos}</td>
      <td>${time.jogos}</td>
      <td>${time.vitorias}</td>
      <td>${time.empates}</td>
      <td>${time.derrotas}</td>
      <td>${time.saldo}</td>
    </tr>
  `;
}

carregarHome();
