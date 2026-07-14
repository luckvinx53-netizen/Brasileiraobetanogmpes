// =========================================================
// GESTÃO DO BID (aba BID do admin)
// Janela de transferências + aprovação de regularizações
// =========================================================

// ---------------------------------------------------------
// JANELA DE TRANSFERÊNCIAS
// ---------------------------------------------------------

async function carregarJanelaBidAdmin() {
  const { data, error } = await supabaseClient
    .from("configuracoes_gerais")
    .select("chave, valor")
    .in("chave", ["bid_janela_inicio", "bid_janela_fim"]);

  if (error) { notificar(error.message, "erro"); return; }

  const inicio = data?.find(d => d.chave === "bid_janela_inicio")?.valor;
  const fim = data?.find(d => d.chave === "bid_janela_fim")?.valor;

  document.getElementById("bidJanelaInicio").value = inicio ? inicio.slice(0, 16) : "";
  document.getElementById("bidJanelaFim").value = fim ? fim.slice(0, 16) : "";

  atualizarStatusJanelaBid(inicio, fim);
}

function atualizarStatusJanelaBid(inicioStr, fimStr) {
  const status = document.getElementById("statusJanelaBid");
  if (!inicioStr || !fimStr) {
    status.textContent = "Nenhuma janela configurada. A aba BID ficará oculta para os técnicos.";
    return;
  }

  const inicio = new Date(inicioStr);
  const fim = new Date(fimStr);
  const agora = new Date();

  if (agora < inicio) {
    status.textContent = `Janela ainda não começou (abre em ${inicio.toLocaleString("pt-BR")}).`;
  } else if (agora > fim) {
    status.textContent = `Janela já encerrou (fechou em ${fim.toLocaleString("pt-BR")}).`;
  } else {
    status.textContent = `Janela aberta agora — fecha em ${fim.toLocaleString("pt-BR")}.`;
  }
}

async function salvarJanelaBid() {
  const inicio = document.getElementById("bidJanelaInicio").value;
  const fim = document.getElementById("bidJanelaFim").value;

  if (!inicio || !fim) {
    notificar("Preencha início e fim da janela.", "aviso");
    return;
  }

  if (new Date(fim) <= new Date(inicio)) {
    notificar("A data de fim precisa ser depois da data de início.", "aviso");
    return;
  }

  const { error } = await supabaseClient
    .from("configuracoes_gerais")
    .upsert([
      { chave: "bid_janela_inicio", valor: new Date(inicio).toISOString() },
      { chave: "bid_janela_fim", valor: new Date(fim).toISOString() },
    ], { onConflict: "chave" });

  if (error) { notificar(error.message, "erro"); return; }

  notificar("Janela de transferências atualizada!");
  atualizarStatusJanelaBid(new Date(inicio).toISOString(), new Date(fim).toISOString());
}

// ---------------------------------------------------------
// SOLICITAÇÕES DE REGULARIZAÇÃO
// ---------------------------------------------------------

// Popula o select de filtro por time na lista de solicitações de regularização,
// reaproveitando o timesCache já carregado pelo admin.
function popularFiltroTimeSolicitacoesBid() {
  const select = document.getElementById("timeFiltroSolicitacoesBid");
  if (!select || typeof timesCache === "undefined") return;

  const valorAtual = select.value;
  select.innerHTML = `<option value="">Todos os times</option>` +
    timesCache.map(t => `<option value="${t.id}">${t.nome}</option>`).join("");
  select.value = valorAtual;
}

async function carregarSolicitacoesBidAdmin() {
  const lista = document.getElementById("listaSolicitacoesBid");
  const timeId = document.getElementById("timeFiltroSolicitacoesBid")?.value || "";

  let query = supabaseClient
    .from("bid_solicitacoes")
    .select("*, jogadores(nome, idade), times(nome), transferencia:transferencia_id(valor_consultado, tipo_contratacao, dono:time_dono_id(nome))")
    .order("criado_em", { ascending: false });

  if (timeId) query = query.eq("time_id", timeId);

  const { data, error } = await query;

  if (error) { lista.innerHTML = `<p class="text-dim">Erro ao carregar solicitações.</p>`; return; }

  if (!data || data.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">📋</div><h3>${timeId ? "Nenhuma solicitação desse time" : "Nenhuma solicitação ainda"}</h3></div>`;
    return;
  }

  const statusLabel = { pendente: "⏳ Pendente", aprovado: "✅ Aprovado", recusado: "❌ Recusado" };
  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  lista.innerHTML = data.map(s => {
    const t = s.transferencia;
    const detalhes = t
      ? `${t.dono?.nome ? "Origem: " + t.dono.nome + " · " : ""}${t.valor_consultado ? "R$ " + Number(t.valor_consultado).toLocaleString("pt-BR") + " · " : ""}${tipoLabel[t.tipo_contratacao] || ""}${s.jogadores?.idade ? " · " + s.jogadores.idade + " anos" : ""}`
      : "";
    return `
    <div class="time-item">
      <div class="info">
        <h3>${s.jogadores?.nome || "Jogador"} <span class="text-dim" style="font-weight:400;">· ${s.times?.nome || ""}</span></h3>
        <p>${statusLabel[s.status] || s.status} ${s.observacao ? "· " + s.observacao : ""}</p>
        ${detalhes ? `<p class="text-dim" style="font-size:12px;">${detalhes}</p>` : ""}
        <p class="text-dim" style="font-size:11.5px;">Publicado em ${new Date(s.criado_em).toLocaleString("pt-BR")}</p>
      </div>
      ${s.status === "pendente" ? `
        <div class="flex-gap">
          <button class="btn btn-primary" onclick="responderSolicitacaoBid('${s.id}', '${s.jogador_id}', true)">Aprovar</button>
          <button class="btn btn-ghost" onclick="responderSolicitacaoBid('${s.id}', '${s.jogador_id}', false)">Recusar</button>
        </div>
      ` : ""}
    </div>
  `;
  }).join("");
}

async function responderSolicitacaoBid(solicitacaoId, jogadorId, aprovar) {
  const { error: erroSolicitacao } = await supabaseClient
    .from("bid_solicitacoes")
    .update({ status: aprovar ? "aprovado" : "recusado", respondido_em: new Date().toISOString() })
    .eq("id", solicitacaoId);

  if (erroSolicitacao) { notificar(erroSolicitacao.message, "erro"); return; }

  if (aprovar) {
    const { error: erroJogador } = await supabaseClient
      .from("jogadores")
      .update({ regularizado: true })
      .eq("id", jogadorId);

    if (erroJogador) { notificar(erroJogador.message, "erro"); return; }
  }

  notificar(aprovar ? "Jogador regularizado!" : "Solicitação recusada.");
  await carregarSolicitacoesBidAdmin();
}
