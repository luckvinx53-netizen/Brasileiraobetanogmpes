// =========================================================
// GESTÃO DE TÉCNICOS, PRAZO E ESCALAÇÕES (aba Técnicos do admin)
// =========================================================

let tecnicosCache = [];

// Popula o select de times assim que a aba de Técnicos é usada
// (reaproveita timesCache já carregado pelo admin.js principal)
function popularSelectTimeTecnico() {
  const select = document.getElementById("timeTecnicoNovo");
  if (!select || typeof timesCache === "undefined") return;

  select.innerHTML = timesCache.map(t => `<option value="${t.id}">${t.nome}</option>`).join("");
}

// ---------------------------------------------------------
// PRAZO GERAL
// ---------------------------------------------------------

async function carregarPrazoEscalacao() {
  const { data, error } = await supabaseClient
    .from("configuracoes_gerais")
    .select("valor")
    .eq("chave", "prazo_escalacao_horas_antes")
    .maybeSingle();

  if (error) { console.error(error); return; }

  document.getElementById("prazoEscalacaoHoras").value = data?.valor || 2;
}

async function salvarPrazoEscalacao() {
  const horas = document.getElementById("prazoEscalacaoHoras").value;

  if (!horas || Number(horas) <= 0) {
    notificar("Informe um número de horas válido.", "aviso");
    return;
  }

  const { error } = await supabaseClient
    .from("configuracoes_gerais")
    .upsert({ chave: "prazo_escalacao_horas_antes", valor: String(horas) }, { onConflict: "chave" });

  if (error) { notificar(error.message, "erro"); return; }

  notificar("Prazo atualizado!");
}

// ---------------------------------------------------------
// VÍNCULO TÉCNICO ↔ TIME
// ---------------------------------------------------------

async function vincularTecnico() {
  const email = document.getElementById("emailTecnico").value.trim();
  const timeId = document.getElementById("timeTecnicoNovo").value;
  const nome = document.getElementById("nomeTecnicoNovo").value.trim();

  if (!email || !timeId) {
    notificar("Informe o e-mail do técnico e escolha o time.", "aviso");
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    notificar("Sessão expirada, faça login novamente.", "erro");
    return;
  }

  notificar("Buscando usuário...", "aviso");

  try {
    const resposta = await fetch(`${SUPABASE_URL}/functions/v1/tecnicos-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email, time_id: timeId, nome }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      notificar("Erro ao vincular: " + (resultado.error || "erro desconhecido"), "erro");
      return;
    }

    notificar(`Técnico vinculado: ${resultado.email}`);
    document.getElementById("emailTecnico").value = "";
    document.getElementById("nomeTecnicoNovo").value = "";
    await carregarTecnicosAdmin();
  } catch (e) {
    notificar("Erro de conexão: " + e.message, "erro");
  }
}

async function carregarTecnicosAdmin() {
  const { data, error } = await supabaseClient
    .from("tecnicos")
    .select("*, times(nome)")
    .order("criado_em", { ascending: false });

  if (error) { console.error(error); return; }

  tecnicosCache = data || [];
  const lista = document.getElementById("listaTecnicosAdmin");

  if (tecnicosCache.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum técnico vinculado ainda.</p>`;
    return;
  }

  lista.innerHTML = tecnicosCache.map(t => `
    <div class="admin-item">
      <div class="title">${t.nome || "(sem nome)"} — ${t.time_id ? (t.times?.nome || "?") : "🎓 Licenciado (sem clube)"}</div>
      <div class="meta">UUID: ${t.user_id}</div>
      ${t.tatica_favorita ? `<div class="meta">Tática favorita: ${t.tatica_favorita}</div>` : ""}
      <div class="actions">
        ${t.time_id ? `<button class="btn btn-sm btn-danger" onclick="removerTecnico('${t.user_id}')">Remover vínculo</button>` : ""}
      </div>
    </div>
  `).join("");
}

// Demite o técnico do time (ele volta a ficar licenciado, disponível
// pra novas propostas) em vez de apagar o cadastro dele — assim o
// histórico e o perfil do GM Academy não se perdem.
async function removerTecnico(userId) {
  if (!confirm("Demitir esse técnico do time dele? Ele voltará a ficar licenciado no GM Academy.")) return;

  const { error } = await supabaseClient
    .from("tecnicos")
    .update({ time_id: null, status: "licenciado" })
    .eq("user_id", userId);
  if (error) { notificar(error.message, "erro"); return; }

  notificar("Técnico demitido e licenciado novamente!");
  await carregarTecnicosAdmin();
  if (typeof gmAdminIniciar === "function") gmAdminIniciar();
}

// ---------------------------------------------------------
// ESCALAÇÕES RECEBIDAS
// ---------------------------------------------------------

async function popularSelectJogosEscalacao() {
  const select = document.getElementById("jogoEscalacaoRecebida");
  if (!select || typeof jogosCache === "undefined") return;

  select.innerHTML = jogosCache.map(j =>
    `<option value="${j.id}">${j.rodada}ª - ${j.time_casa?.nome || "?"} x ${j.time_fora?.nome || "?"}</option>`
  ).join("");

  await carregarEscalacoesRecebidas();
}

async function carregarEscalacoesRecebidas() {
  const jogoId = document.getElementById("jogoEscalacaoRecebida").value;
  const area = document.getElementById("listaEscalacoesRecebidas");
  if (!jogoId) { area.innerHTML = ""; return; }

  const jogo = (typeof jogosCache !== "undefined" ? jogosCache : []).find(j => j.id === jogoId);
  if (!jogo) { area.innerHTML = ""; return; }

  const { data: escalacoes, error } = await supabaseClient
    .from("escalacoes_tecnico")
    .select("*")
    .eq("jogo_id", jogoId);

  if (error) { notificar(error.message, "erro"); return; }

  const timesDoJogo = [
    { id: jogo.time_casa_id, nome: jogo.time_casa?.nome },
    { id: jogo.time_fora_id, nome: jogo.time_fora?.nome },
  ];

  area.innerHTML = timesDoJogo.map(time => {
    const escalacao = (escalacoes || []).find(e => e.time_id === time.id);

    if (!escalacao) {
      return `
        <div class="admin-item">
          <div class="title">${time.nome}</div>
          <div class="meta" style="color:var(--vermelho);">Nenhuma escalação enviada ainda</div>
        </div>
      `;
    }

    const jogadoresTexto = (escalacao.jogadores_titulares || [])
      .map(item => item.posicao_campo)
      .join(", ");

    return `
      <div class="admin-item">
        <div class="title">${time.nome} — ${escalacao.formacao} ${escalacao.gerada_automaticamente ? "🎲 (sorteada)" : "✅ (enviada pelo técnico)"}</div>
        <div class="meta">Posições preenchidas: ${jogadoresTexto}</div>
        <div class="meta">Atualizada em: ${new Date(escalacao.atualizado_em).toLocaleString("pt-BR")}</div>
      </div>
    `;
  }).join("");
}

// ---------------------------------------------------------
// SORTEIO AUTOMÁTICO (para quem não enviou a tempo)
// ---------------------------------------------------------

// Mapeia tipos de posição usados nos slots táticos para prefixos
// comuns digitados no campo livre "posicao" do jogador.
function tipoCompativel(posicaoJogador, tipoSlot) {
  const p = (posicaoJogador || "").toUpperCase();
  if (tipoSlot === "GOL") return p.includes("GOL");
  if (tipoSlot === "DEF") return p.includes("ZAG") || p.includes("LAT") || p.includes("DEF");
  if (tipoSlot === "MEI") return p.includes("MEI") || p.includes("VOL") || p.includes("ALA");
  if (tipoSlot === "ATA") return p.includes("ATA") || p.includes("PE");
  return false;
}

// Formação simples fixa usada só para o sorteio (4-3-3), com os
// mesmos "tipos" de posição do meu-time.js
const SLOTS_SORTEIO = [
  { id: "GOL", tipo: "GOL" },
  { id: "LAT-E", tipo: "DEF" }, { id: "ZAG-1", tipo: "DEF" }, { id: "ZAG-2", tipo: "DEF" }, { id: "LAT-D", tipo: "DEF" },
  { id: "VOL", tipo: "MEI" }, { id: "MEI-E", tipo: "MEI" }, { id: "MEI-D", tipo: "MEI" },
  { id: "PE-E", tipo: "ATA" }, { id: "ATA", tipo: "ATA" }, { id: "PE-D", tipo: "ATA" },
];

function embaralhar(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

async function sortearEscalacaoParaTime(jogoId, timeId) {
  const { data: jogadores, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .eq("time_id", timeId);

  if (error || !jogadores || jogadores.length === 0) {
    notificar("Esse time não tem jogadores cadastrados para sortear.", "erro");
    return false;
  }

  const disponiveis = embaralhar(jogadores);
  const usados = new Set();
  const titulares = [];

  for (const slot of SLOTS_SORTEIO) {
    // tenta achar um jogador compatível com a posição, ainda não usado
    let escolhido = disponiveis.find(j => !usados.has(j.id) && tipoCompativel(j.posicao, slot.tipo));

    // se não achar ninguém da posição certa, pega qualquer um disponível
    if (!escolhido) {
      escolhido = disponiveis.find(j => !usados.has(j.id));
    }

    if (escolhido) {
      usados.add(escolhido.id);
      titulares.push({ posicao_campo: slot.id, jogador_id: escolhido.id });
    }
  }

  const { error: erroInsert } = await supabaseClient
    .from("escalacoes_tecnico")
    .upsert({
      jogo_id: jogoId,
      time_id: timeId,
      formacao: "4-3-3",
      jogadores_titulares: titulares,
      gerada_automaticamente: true,
    }, { onConflict: "jogo_id,time_id" });

  if (erroInsert) {
    notificar("Erro ao salvar escalação sorteada: " + erroInsert.message, "erro");
    return false;
  }

  return true;
}

async function sortearEscalacaoFaltante() {
  const jogoId = document.getElementById("jogoEscalacaoRecebida").value;
  if (!jogoId) { notificar("Escolha um jogo primeiro.", "aviso"); return; }

  const jogo = (typeof jogosCache !== "undefined" ? jogosCache : []).find(j => j.id === jogoId);
  if (!jogo) return;

  const { data: escalacoesExistentes } = await supabaseClient
    .from("escalacoes_tecnico")
    .select("time_id")
    .eq("jogo_id", jogoId);

  const idsComEscalacao = (escalacoesExistentes || []).map(e => e.time_id);
  const timesSemEscalacao = [jogo.time_casa_id, jogo.time_fora_id].filter(id => !idsComEscalacao.includes(id));

  if (timesSemEscalacao.length === 0) {
    notificar("Os dois times já têm escalação enviada.", "aviso");
    return;
  }

  for (const timeId of timesSemEscalacao) {
    await sortearEscalacaoParaTime(jogoId, timeId);
  }

  notificar(`Escalação sorteada para ${timesSemEscalacao.length} time(s)!`);
  await carregarEscalacoesRecebidas();
}

// ---------------------------------------------------------
// GM ACADEMY — propostas de contratação (clube sem técnico ↔
// técnico licenciado). vincularTecnico() acima continua existindo
// para o vínculo manual direto; isto aqui é o fluxo de "proposta que
// o técnico precisa aceitar".
// ---------------------------------------------------------

let gmAdminTimesSemTecnico = [];
let gmAdminTecnicosLicenciados = [];

async function gmAdminIniciar() {
  await gmAdminCarregarSelects();
  await gmAdminCarregarPropostas();
}

async function gmAdminCarregarSelects() {
  const selectTime = document.getElementById("gmAdminTimeSelect");
  const selectTecnico = document.getElementById("gmAdminTecnicoSelect");
  if (!selectTime || !selectTecnico) return;

  // Times sem técnico = times da temporada ativa que não aparecem
  // como time_id de nenhuma linha "contratado" em tecnicos.
  const { data: times } = await supabaseClient.from("times").select("id, nome").order("nome");
  const { data: tecnicosContratados } = await supabaseClient
    .from("tecnicos")
    .select("time_id")
    .eq("status", "contratado")
    .not("time_id", "is", null);

  const idsComTecnico = new Set((tecnicosContratados || []).map(t => t.time_id));
  gmAdminTimesSemTecnico = (times || []).filter(t => !idsComTecnico.has(t.id));

  const { data: licenciados } = await supabaseClient
    .from("tecnicos")
    .select("user_id, nome, tatica_favorita")
    .eq("status", "licenciado")
    .order("nome");

  gmAdminTecnicosLicenciados = licenciados || [];

  selectTime.innerHTML = gmAdminTimesSemTecnico.length
    ? gmAdminTimesSemTecnico.map(t => `<option value="${t.id}">${t.nome}</option>`).join("")
    : `<option value="">Nenhum clube sem técnico no momento</option>`;

  selectTecnico.innerHTML = gmAdminTecnicosLicenciados.length
    ? gmAdminTecnicosLicenciados.map(t => `<option value="${t.user_id}">${t.nome || "(sem nome)"} — ${t.tatica_favorita || "sem tática definida"}</option>`).join("")
    : `<option value="">Nenhum técnico licenciado no momento</option>`;
}

async function gmAdminEnviarProposta() {
  const timeId = document.getElementById("gmAdminTimeSelect").value;
  const tecnicoId = document.getElementById("gmAdminTecnicoSelect").value;
  const mensagem = document.getElementById("gmAdminMensagem").value.trim();

  if (!timeId || !tecnicoId) {
    notificar("Escolha um clube e um técnico licenciado.", "aviso");
    return;
  }

  const { error } = await supabaseClient.from("propostas_tecnico").insert([{
    tecnico_id: tecnicoId,
    time_id: timeId,
    mensagem: mensagem || null,
  }]);

  if (error) {
    notificar("Erro ao enviar proposta: " + error.message, "erro");
    return;
  }

  notificar("Proposta enviada ao técnico!");
  document.getElementById("gmAdminMensagem").value = "";
  await gmAdminCarregarPropostas();
}

async function gmAdminCarregarPropostas() {
  const area = document.getElementById("gmAdminListaPropostas");
  if (!area) return;

  const { data, error } = await supabaseClient
    .from("propostas_tecnico")
    .select("*, times(nome), tecnico:tecnico_id(nome)")
    .in("status", ["pendente", "aceita", "recusada"])
    .order("criado_em", { ascending: false })
    .limit(30);

  if (error) {
    area.innerHTML = `<p class="text-dim" style="font-size:13px;">Erro ao carregar propostas.</p>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    area.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhuma proposta enviada ainda.</p>`;
    return;
  }

  const statusLabel = { pendente: "Aguardando resposta", aceita: "✅ Aceita", recusada: "❌ Recusada", cancelada: "Cancelada" };

  area.innerHTML = data.map(p => `
    <div class="admin-item">
      <div class="title">${p.tecnico?.nome || "Técnico"} → ${p.times?.nome || "?"}</div>
      <div class="meta">${statusLabel[p.status] || p.status} · ${new Date(p.criado_em).toLocaleString("pt-BR")}</div>
      ${p.mensagem ? `<div class="meta">"${p.mensagem}"</div>` : ""}
    </div>
  `).join("");
}
