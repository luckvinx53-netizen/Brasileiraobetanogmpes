// =========================================================
// DETALHES DO JOGADOR
// =========================================================

async function carregarJogador() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const cabecalho = document.getElementById("cabecalhoJogador");
  const statsGrid = document.getElementById("statsGridJogador");
  const listaHistorico = document.getElementById("listaHistoricoJogador");
  const listaRumores = document.getElementById("listaRumoresJogador");

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
          <p style="margin:8px 0 0;display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="location.href='time?id=${time.id}'">
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

  // Valor de mercado: sobe automaticamente ao computar jogo (+3% por
  // gol, +1% a +1,25% por assistência — ver reaplicarEstatisticasEventosDoJogo
  // em utils.js). Exibido como card de destaque, separado da stat-grid
  // porque é dinheiro, não uma contagem de evento.
  const valorMercadoCard = document.getElementById("cardValorMercadoJogador");
  if (valorMercadoCard) {
    valorMercadoCard.innerHTML = `
      <div class="card" style="text-align:center;padding:14px;">
        <div class="text-dim" style="font-size:12px;">Valor de mercado</div>
        <div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--tema-primaria);">
          R$ ${Number(jogador.valor_mercado || 0).toLocaleString("pt-BR")}
        </div>
      </div>
    `;
  }

  await carregarHistoricoTransferenciasJogador(id, listaHistorico);
  await carregarRumoresJogador(id, listaRumores);
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

// Mostra os clubes de olho no jogador — consultas em aberto (pendente/
// negociando) que "vazaram" pra imprensa, igual aos rumores do mercado.
// A chance de vazar é a taxa de furo do jornalista que cobre o clube
// interessado (ver MC_CHANCE_FURO_POR_TIME em mercado-noticias.js).
async function carregarRumoresJogador(jogadorId, lista) {
  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
    .eq("jogador_id", jogadorId)
    .in("status", ["pendente", "negociando"])
    .order("criado_em", { ascending: false });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar rumores</h3></div>`;
    return;
  }

  const vazados = (data || []).filter(c => typeof tmConsultaVazou === "function" && tmConsultaVazou(c.id, c.interessado?.nome));

  if (!vazados.length) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">🤫</div><h3>Nenhum rumor no ar</h3><p>Não há clubes interessados vazados na imprensa no momento.</p></div>`;
    return;
  }

  lista.innerHTML = vazados.map(c => {
    const timeInteressado = c.interessado?.nome || "um clube";
    const comValor = c.valor_consultado && typeof tmRumorComValor === "function" && tmRumorComValor(c.id);
    const assinatura = typeof tmAssinaturaMateria === "function" ? tmAssinaturaMateria(c.id, timeInteressado) : null;

    const metaPartes = [];
    if (comValor) metaPartes.push(`Valor especulado: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}`);
    metaPartes.push(c.status === "negociando" ? "Negociação em andamento" : "Consulta inicial");

    return `
      <div class="time-item">
        <div class="info">
          <h3>Interesse do ${timeInteressado}</h3>
          <p class="text-dim" style="font-size:12px;">${metaPartes.join(" · ")}</p>
          ${assinatura ? `<p class="mc-assinatura">${tmAssinaturaHtml(assinatura)}</p>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

carregarJogador();
