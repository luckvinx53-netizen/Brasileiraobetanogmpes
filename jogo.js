// =========================================================
// DETALHES DO JOGO
// =========================================================

async function carregarDetalhes() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const area = document.getElementById("detalhesJogo");

  if (!id) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Jogo não encontrado</h3></div>`;
    return;
  }

  const { data: jogo, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .eq("id", id)
    .single();

  if (error || !jogo) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar jogo</h3><p>${error?.message || ""}</p></div>`;
    return;
  }

  const { data: gols } = await supabaseClient
    .from("gols_jogo")
    .select("*")
    .eq("jogo_id", id)
    .order("criado_em", { ascending: true });

  const casa = jogo.time_casa;
  const fora = jogo.time_fora;
  const temPlacar = jogo.status !== "Agendado" && jogo.status !== "Adiado";

  const golsCasa = (gols || []).filter(g => g.time_id === casa?.id);
  const golsFora = (gols || []).filter(g => g.time_id === fora?.id);

  area.innerHTML = `

    <div class="card" style="margin-bottom:16px;">
      <div class="scoreboard-top">
        <span class="scoreboard-meta">${jogo.rodada}ª rodada</span>
        <span class="status-pill ${statusClasse(jogo.status)}">${jogo.status}</span>
      </div>

      <div class="scoreboard-main" style="margin-top:18px;">
        <div class="time-col esquerda">
          ${escudoHtml(casa, "escudo").replace('class="escudo"', 'class="escudo" style="width:64px;height:64px;"')}
          <span class="time-nome" style="font-size:15px;">${casa ? casa.nome : "—"}</span>
        </div>
        <div class="${temPlacar ? 'placar-display' : 'placar-vs'}" style="font-size:48px;">
          ${temPlacar
            ? `${jogo.placar_casa ?? 0}<span class="sep">:</span>${jogo.placar_fora ?? 0}`
            : `VS`}
        </div>
        <div class="time-col direita">
          ${escudoHtml(fora, "escudo").replace('class="escudo"', 'class="escudo" style="width:64px;height:64px;"')}
          <span class="time-nome" style="font-size:15px;">${fora ? fora.nome : "—"}</span>
        </div>
      </div>

      <div class="scoreboard-info">
        <span>📍 ${jogo.local || "Local a definir"}</span>
        <span>📅 ${formatarData(jogo.data_jogo)} ${jogo.hora_jogo ? "• " + jogo.hora_jogo : ""}</span>
      </div>

      ${jogo.capacidade ? `<div class="scoreboard-info" style="border-top:none;margin-top:6px;padding-top:0;"><span>🏟️ Capacidade: ${jogo.capacidade}</span></div>` : ""}

      ${jogo.foto_estadio ? `<img src="${jogo.foto_estadio}" alt="Estádio" style="width:100%;border-radius:16px;margin-top:16px;">` : ""}
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h2 style="font-family:var(--font-display);font-size:22px;margin:0 0 14px;">Gols</h2>
      <div class="row-2">
        <div>
          <p class="eyebrow" style="margin-bottom:8px;">${casa ? casa.nome : "Casa"}</p>
          ${golsCasa.length ? golsCasa.map(g => golLinhaHtml(g)).join("") : `<p class="text-dim" style="font-size:13px;">Nenhum gol registrado</p>`}
        </div>
        <div>
          <p class="eyebrow" style="margin-bottom:8px;">${fora ? fora.nome : "Fora"}</p>
          ${golsFora.length ? golsFora.map(g => golLinhaHtml(g)).join("") : `<p class="text-dim" style="font-size:13px;">Nenhum gol registrado</p>`}
        </div>
      </div>
    </div>

    <div class="card">
      <h2 style="font-family:var(--font-display);font-size:22px;margin:0 0 10px;">Estatísticas</h2>
      <p class="text-dim" style="font-size:13.5px;line-height:1.6;">${jogo.estatisticas || "Estatísticas ainda não informadas."}</p>
    </div>
  `;
}

function golLinhaHtml(g) {
  return `<p style="font-size:13.5px;margin:0 0 6px;">⚽ ${g.jogador_nome || "—"} <span class="text-dim">${g.minuto || ""} ${g.tipo && g.tipo !== "Gol" ? "· " + g.tipo : ""}</span></p>`;
}

carregarDetalhes();
