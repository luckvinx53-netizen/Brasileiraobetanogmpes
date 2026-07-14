// =========================================================
// TRANSFERMARKT — elenco completo do time + valor de mercado
// (valor de mercado = valor da última transferência aceita, ou 0)
// =========================================================

async function popularTimesTransfermarkt() {
  const select = document.getElementById("timeTransfermarktSelect");
  if (!select) return;

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    select.innerHTML = `<option value="">Nenhuma temporada ativa</option>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from("times")
    .select("id, nome")
    .eq("temporada_id", temporada.id)
    .order("nome", { ascending: true });

  if (error || !data || data.length === 0) {
    select.innerHTML = `<option value="">Nenhum time cadastrado</option>`;
    return;
  }

  select.innerHTML = `<option value="">Selecione um time</option>` +
    data.map(t => `<option value="${t.id}">${t.nome}</option>`).join("");

  // Se veio um time pré-selecionado pela URL (?time=), já carrega direto
  const params = new URLSearchParams(window.location.search);
  const timePreSelecionado = params.get("time");
  if (timePreSelecionado && data.some(t => String(t.id) === timePreSelecionado)) {
    select.value = timePreSelecionado;
    await carregarElencoTransfermarkt();
  }
}

async function carregarElencoTransfermarkt() {
  const timeId = document.getElementById("timeTransfermarktSelect").value;
  const resumo = document.getElementById("resumoTransfermarkt");
  const lista = document.getElementById("listaElencoTransfermarkt");

  if (!timeId) {
    resumo.innerHTML = "";
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Escolha um time para ver o elenco.</p>`;
    return;
  }

  lista.innerHTML = `<div class="skeleton" style="height:70px;"></div><div class="skeleton" style="height:70px;"></div>`;
  resumo.innerHTML = "";

  const { data: time } = await supabaseClient.from("times").select("nome").eq("id", timeId).single();
  if (time && typeof aplicarTemaTime === "function") aplicarTemaTime(time.nome);

  const { data: jogadores, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .eq("time_id", timeId)
    .order("posicao", { ascending: true });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar elenco</h3></div>`;
    return;
  }

  if (!jogadores || jogadores.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">👤</div><h3>Nenhum jogador cadastrado</h3></div>`;
    return;
  }

  // Busca a última transferência aceita de cada jogador do elenco, pra
  // servir de "valor de mercado" (0 se o jogador nunca foi transferido)
  const idsJogadores = jogadores.map(j => j.id);
  const { data: transferencias } = await supabaseClient
    .from("bid_transferencias")
    .select("jogador_id, valor_consultado, respondido_em")
    .in("jogador_id", idsJogadores)
    .eq("status", "aceito")
    .order("respondido_em", { ascending: false });

  const valorMercadoPorJogador = {};
  (transferencias || []).forEach(t => {
    // Como já veio ordenado do mais recente pro mais antigo, a primeira
    // ocorrência de cada jogador é a transferência mais recente dele.
    if (!(t.jogador_id in valorMercadoPorJogador)) {
      valorMercadoPorJogador[t.jogador_id] = Number(t.valor_consultado || 0);
    }
  });

  const valorTotalElenco = jogadores.reduce((soma, j) => soma + (valorMercadoPorJogador[j.id] || 0), 0);

  resumo.innerHTML = `
    <div class="card" style="margin-bottom:16px;text-align:center;">
      <p class="text-dim" style="margin:0;font-size:12.5px;">Valor total do elenco</p>
      <p style="font-family:var(--font-display);font-size:24px;margin:4px 0 0;">R$ ${valorTotalElenco.toLocaleString("pt-BR")}</p>
    </div>
  `;

  lista.innerHTML = jogadores.map(j => {
    const valorMercado = valorMercadoPorJogador[j.id] || 0;
    return `
    <div class="time-item" onclick="location.href='jogador.html?id=${j.id}'" style="cursor:pointer;">
      <div class="escudo-placeholder">${j.numero ?? "-"}</div>
      <div class="info">
        <h3>${j.nome} ${j.regularizado === false ? '<span class="jogador-irregular">· Irregular (BID)</span>' : ""}</h3>
        <p>${j.posicao || "—"} ${j.idade ? "· " + j.idade + " anos" : ""} · ${j.gols} gols · ${j.assistencias} assist.</p>
      </div>
      <div class="pts" style="text-align:right;">
        R$ ${valorMercado.toLocaleString("pt-BR")}
        <span style="display:block;font-size:10.5px;font-weight:400;color:var(--text-dim);">valor</span>
      </div>
    </div>
  `;
  }).join("");
}

popularTimesTransfermarkt();
