// =========================================================
// DETALHES DO JOGADOR
// =========================================================

async function carregarJogador() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const cabecalho = document.getElementById("cabecalhoJogador");
  const statsGrid = document.getElementById("statsGridJogador");
  const listaHistorico = document.getElementById("listaHistoricoJogador");

  if (!id) {
    cabecalho.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Jogador não encontrado</h3></div>`;
    return;
  }

  const { data: jogador, error } = await supabaseClient
    .from("jogadores")
    .select("*, times(id, nome, escudo_url, sigla)")
    .eq("id", id)
    .single();

  if (error || !jogador) {
    cabecalho.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar jogador</h3></div>`;
    return;
  }

  const time = jogador.times;

  cabecalho.innerHTML = `
    <div class="card cabecalho-time-tema" style="display:flex;align-items:center;gap:16px;">
      <div class="escudo-placeholder" style="width:64px;height:64px;font-size:22px;">${jogador.numero ?? "-"}</div>
      <div style="flex:1;">
        <h1 style="font-family:var(--font-display);font-size:24px;margin:0 0 4px;">
          ${jogador.nome} ${jogador.regularizado === false ? '<span class="jogador-irregular">· Irregular (BID)</span>' : ""}
        </h1>
        <p class="text-dim" style="margin:0;font-size:13px;">
          ${jogador.posicao || "—"} ${jogador.idade ? "· " + jogador.idade + " anos" : ""}
        </p>
        ${time ? `
          <p style="margin:8px 0 0;display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="location.href='time.html?id=${time.id}'">
            ${escudoHtml(time, "escudo").replace('class="escudo"', 'class="escudo" style="width:22px;height:22px;"')}
            <span style="font-size:13.5px;font-weight:600;">${time.nome}</span>
          </p>
        ` : `<p class="text-dim" style="margin:8px 0 0;font-size:13px;">Sem time no momento</p>`}
      </div>
    </div>
  `;

  if (time && typeof aplicarTemaTime === "function") {
    aplicarTemaTime(time.nome);
    document.body.classList.add("tema-time");
  }

  statsGrid.innerHTML = `
    <div class="stat-card"><div class="num">${jogador.gols || 0}</div><div class="label">Gols</div></div>
    <div class="stat-card"><div class="num">${jogador.assistencias || 0}</div><div class="label">Assistências</div></div>
    <div class="stat-card"><div class="num">${jogador.amarelos || 0}</div><div class="label">Amarelos</div></div>
    <div class="stat-card"><div class="num">${jogador.vermelhos || 0}</div><div class="label">Vermelhos</div></div>
  `;

  await carregarHistoricoTransferenciasJogador(id, listaHistorico);
}

// Mostra todas as transferências confirmadas envolvendo o jogador —
// tanto as vezes que ele chegou (comprado) quanto que ele saiu (vendido) de um time.
async function carregarHistoricoTransferenciasJogador(jogadorId, lista) {
  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
    .eq("jogador_id", jogadorId)
    .eq("status", "aceito")
    .order("respondido_em", { ascending: false });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar histórico</h3></div>`;
    return;
  }

  if (!data || data.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">📋</div><h3>Nenhuma transferência registrada</h3><p>Esse jogador ainda não passou por nenhuma transferência oficial no sistema.</p></div>`;
    return;
  }

  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  lista.innerHTML = data.map(t => `
    <div class="time-item">
      <div class="info">
        <h3>${t.dono?.nome || "—"} → ${t.interessado?.nome || "—"}</h3>
        <p class="text-dim" style="font-size:12px;">
          ${t.valor_consultado ? "R$ " + Number(t.valor_consultado).toLocaleString("pt-BR") : "Valor não informado"}
          ${t.tipo_contratacao ? " · " + (tipoLabel[t.tipo_contratacao] || t.tipo_contratacao) : ""}
        </p>
        ${t.respondido_em ? `<p class="text-dim" style="font-size:11.5px;">${new Date(t.respondido_em).toLocaleString("pt-BR")}</p>` : ""}
      </div>
    </div>
  `).join("");
}

carregarJogador();
