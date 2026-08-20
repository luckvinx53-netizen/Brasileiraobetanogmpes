// ---------------------------------------------------------
// ATUALIZAÇÃO DE ELENCO VIA IA (admin)
// Chama a edge function atualizar-elenco, que busca o elenco real
// atual de cada time (Gemini com Google Search grounding) e aplica
// no banco: cria jogador que falta, completa posição/idade de quem
// já existe, e remove quem a IA confirmar que saiu do clube. Cada
// mudança fica registrada em log_atualizacao_elenco.
// ---------------------------------------------------------

async function chamarAtualizarElencoTime(timeId, sessionToken) {
  const resposta = await fetch(`${SUPABASE_URL}/functions/v1/atualizar-elenco`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ acao: "processar_time", timeId }),
  });
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.error || "Erro desconhecido");
  return resultado;
}

async function atualizarElencoTodosOsTimes() {
  if (!confirm("Isso vai consultar a web (Gemini) e atualizar automaticamente o elenco dos 20 times, sem pedir confirmação individual. Pode levar alguns minutos. Continuar?")) {
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    notificar("Sessão expirada, faça login novamente.", "erro");
    return;
  }

  const times = (timesCache || []).slice().sort((a, b) => a.nome.localeCompare(b.nome));
  const progresso = document.getElementById("progressoAtualizacaoElenco");
  progresso.innerHTML = `<p class="text-dim" style="font-size:13px;">Iniciando...</p>`;

  let totalCriados = 0, totalCompletados = 0, totalSaidas = 0, totalFalhas = 0;
  const linhas = [];

  for (const time of times) {
    linhas.unshift(`<p style="font-size:13px;margin:2px 0;">⏳ ${time.nome}...</p>`);
    progresso.innerHTML = linhas.join("");

    try {
      const r = await chamarAtualizarElencoTime(time.id, session.access_token);
      totalCriados += r.criados || 0;
      totalCompletados += r.completados || 0;
      totalSaidas += r.saidas || 0;
      linhas[0] = `<p style="font-size:13px;margin:2px 0;">✅ ${time.nome}: +${r.criados} criados, ${r.completados} completados, ${r.saidas} saídas</p>`;
    } catch (e) {
      totalFalhas++;
      linhas[0] = `<p style="font-size:13px;margin:2px 0;color:#e5484d;">❌ ${time.nome}: ${e.message}</p>`;
    }
    progresso.innerHTML = linhas.join("");

    // Pequena pausa entre times pra não estourar limite de taxa do Gemini.
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  progresso.innerHTML = `
    <div class="card" style="margin-top:10px;">
      <h4 style="margin:0 0 8px;">Concluído</h4>
      <p style="font-size:13px;margin:0;">
        ${totalCriados} jogadores criados · ${totalCompletados} completados · ${totalSaidas} saídas aplicadas
        ${totalFalhas > 0 ? ` · ${totalFalhas} times com falha (veja acima)` : ""}
      </p>
    </div>
  ` + linhas.join("");

  notificar("Atualização de elenco concluída.");
  if (typeof carregarTimesAdmin === "function") await carregarTimesAdmin();
  if (typeof renderizarListaJogadoresAdmin === "function") renderizarListaJogadoresAdmin();
}

function abrirModalAtualizarElencoUmTime() {
  const times = (timesCache || []).slice().sort((a, b) => a.nome.localeCompare(b.nome));
  if (times.length === 0) {
    notificar("Nenhum time carregado ainda.", "aviso");
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "negociacao-overlay";
  overlay.id = "modalAtualizarElencoUmTimeOverlay";
  overlay.innerHTML = `
    <div class="negociacao-topo">
      <h3>Atualizar elenco de um time</h3>
      <button class="fechar" onclick="document.getElementById('modalAtualizarElencoUmTimeOverlay').remove()">✕</button>
    </div>
    <div class="negociacao-form">
      <div class="field">
        <label>Time</label>
        <select id="selectTimeAtualizarElenco">
          ${times.map(t => `<option value="${t.id}">${t.nome}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="negociacao-acoes">
      <button class="btn btn-primary btn-block" onclick="confirmarAtualizarElencoUmTime()">Buscar e atualizar</button>
      <button class="btn btn-ghost btn-block" onclick="document.getElementById('modalAtualizarElencoUmTimeOverlay').remove()">Cancelar</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function confirmarAtualizarElencoUmTime() {
  const timeId = document.getElementById("selectTimeAtualizarElenco").value;
  const time = (timesCache || []).find(t => t.id === timeId);
  document.getElementById("modalAtualizarElencoUmTimeOverlay")?.remove();

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    notificar("Sessão expirada, faça login novamente.", "erro");
    return;
  }

  const progresso = document.getElementById("progressoAtualizacaoElenco");
  progresso.innerHTML = `<p class="text-dim" style="font-size:13px;">⏳ Buscando elenco atual do ${time?.nome || "time"}...</p>`;

  try {
    const r = await chamarAtualizarElencoTime(timeId, session.access_token);
    progresso.innerHTML = `
      <div class="card">
        <h4 style="margin:0 0 8px;">${r.time}</h4>
        <p style="font-size:13px;margin:0;">
          ${r.criados} jogadores criados · ${r.completados} completados · ${r.saidas} saídas aplicadas
          <br><span class="text-dim">${r.total_encontrados_na_busca} jogadores encontrados na busca.</span>
        </p>
      </div>
    `;
    notificar(`Elenco do ${r.time} atualizado.`);
    if (typeof carregarTimesAdmin === "function") await carregarTimesAdmin();
    if (typeof renderizarListaJogadoresAdmin === "function") renderizarListaJogadoresAdmin();
  } catch (e) {
    progresso.innerHTML = `<p style="font-size:13px;color:#e5484d;">Erro: ${e.message}</p>`;
    notificar("Erro ao atualizar elenco: " + e.message, "erro");
  }
}
