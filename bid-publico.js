// =========================================================
// BID — página pública (fãs)
// Mostra, por time, todas as transferências já confirmadas
// (status = "aceito"), tanto como comprador quanto como vendedor.
// =========================================================

async function popularTimesBidPublico() {
  const select = document.getElementById("timeBidSelect");
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
}

async function carregarTransferenciasBidPublico() {
  const timeId = document.getElementById("timeBidSelect").value;
  const lista = document.getElementById("listaTransferenciasBid");
  if (!lista) return;

  if (!timeId) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Escolha um time para ver as transferências.</p>`;
    return;
  }

  lista.innerHTML = `<div class="skeleton" style="height:70px;"></div><div class="skeleton" style="height:70px;"></div>`;

  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome), dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
    .eq("status", "aceito")
    .or(`time_dono_id.eq.${timeId},time_interessado_id.eq.${timeId}`)
    .order("respondido_em", { ascending: false });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar transferências</h3></div>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">📋</div><h3>Nenhuma transferência confirmada</h3><p>Esse time ainda não participou de nenhuma transferência oficial.</p></div>`;
    return;
  }

  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  lista.innerHTML = data.map(t => `
    <div class="time-item">
      <div class="info">
        <h3>${t.jogadores?.nome || "Jogador"}</h3>
        <p>${t.dono?.nome || "—"} → ${t.interessado?.nome || "—"}</p>
        <p class="text-dim" style="font-size:12px;">
          ${t.valor_consultado ? "R$ " + Number(t.valor_consultado).toLocaleString("pt-BR") : "Valor não informado"}
          ${t.tipo_contratacao ? " · " + (tipoLabel[t.tipo_contratacao] || t.tipo_contratacao) : ""}
        </p>
        ${t.respondido_em ? `<p class="text-dim" style="font-size:11.5px;">Confirmada em ${new Date(t.respondido_em).toLocaleString("pt-BR")}</p>` : ""}
      </div>
    </div>
  `).join("");
}

popularTimesBidPublico();
