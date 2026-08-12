// =========================================================
// ADMIN — FINAL DA COPA DO BRASIL (standalone, fora da temporada)
// Reaproveita a mesma tabela "admins" (Supabase Auth) da Central Admin
// principal, mas é uma página própria: cadastra o jogo único, controla
// status/minuto/placar manualmente (sem relógio automático 0'→90', já
// que os elencos estão incompletos) e narra os lances em texto.
// =========================================================

let fcbTimesCache = [];
let fcbFinalAtual = null;
let fcbTipoEventoSelecionado = "Gol";

// ---------- LOGIN / SESSÃO ----------

async function fcbFazerLogin() {
  const botao = document.getElementById("btnEntrarAdmin");
  const textoOriginal = botao ? botao.textContent : "Entrar";

  try {
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;

    if (!email || !senha) {
      notificar("Preencha e-mail e senha.", "aviso");
      return;
    }

    if (botao) { botao.disabled = true; botao.textContent = "Entrando..."; }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
    if (error) {
      notificar("ERRO LOGIN: " + error.message, "erro");
      return;
    }

    await fcbChecarAcessoAdmin();
  } catch (e) {
    notificar("EXCEÇÃO: " + e.message, "erro");
    console.error(e);
  } finally {
    if (botao) { botao.disabled = false; botao.textContent = textoOriginal; }
  }
}

async function fcbFazerLogout() {
  await supabaseClient.auth.signOut();
  window.location.reload();
}

async function fcbChecarAcessoAdmin() {
  try {
    const { data: { session }, error: sessErr } = await supabaseClient.auth.getSession();
    if (sessErr) { notificar("ERRO SESSÃO: " + sessErr.message, "erro"); fcbMostrarGate(); return; }
    if (!session) { fcbMostrarGate(); return; }

    const { data: admin, error } = await supabaseClient
      .from("admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) { notificar("ERRO TABELA ADMINS: " + error.message, "erro"); fcbMostrarGate(); return; }

    if (!admin) {
      notificar("Sua conta não tem permissão de administrador.", "erro");
      await supabaseClient.auth.signOut();
      fcbMostrarGate();
      return;
    }

    fcbMostrarConteudoAdmin();
    await fcbIniciarAdmin();
  } catch (e) {
    notificar("EXCEÇÃO CHECAGEM: " + e.message, "erro");
    console.error(e);
    fcbMostrarGate();
  }
}

function fcbMostrarGate() {
  document.getElementById("gateLogin").classList.remove("hidden");
  document.getElementById("conteudoAdmin").classList.add("hidden");
}

function fcbMostrarConteudoAdmin() {
  document.getElementById("gateLogin").classList.add("hidden");
  document.getElementById("conteudoAdmin").classList.remove("hidden");
}

// ---------- INICIALIZAÇÃO ----------

async function fcbIniciarAdmin() {
  await fcbCarregarTimes();
  await fcbCarregarFinal();
}

async function fcbCarregarTimes() {
  // A final usa os mesmos times já cadastrados no banco (mesmo que os
  // elencos ainda estejam incompletos) — não é temporada-específico,
  // então busca todos os times existentes, sem filtrar por temporada_id.
  const { data, error } = await supabaseClient
    .from("times")
    .select("*")
    .order("nome", { ascending: true });

  if (error) { notificar(error.message, "erro"); return; }

  fcbTimesCache = data || [];

  const opts = fcbTimesCache.map(t => `<option value="${t.id}">${t.nome}</option>`).join("");
  document.getElementById("finalTimeCasa").innerHTML = `<option value="">Selecione</option>${opts}`;
  document.getElementById("finalTimeFora").innerHTML = `<option value="">Selecione</option>${opts}`;
  document.getElementById("fcbTimeEvento").innerHTML = opts;
}

// ---------- DADOS DA FINAL ----------

// Como é uma linha só (jogo standalone), sempre trabalha com o registro
// mais recente. Se não existir nenhum ainda, o formulário fica vazio
// pronto pra criar o primeiro.
async function fcbCarregarFinal() {
  const { data, error } = await supabaseClient
    .from("final_copa_brasil")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) { notificar(error.message, "erro"); return; }

  fcbFinalAtual = data;

  if (data) {
    document.getElementById("finalId").value = data.id;
    document.getElementById("finalTimeCasa").value = data.time_casa_id || "";
    document.getElementById("finalTimeFora").value = data.time_fora_id || "";
    document.getElementById("finalData").value = data.data_jogo || "";
    document.getElementById("finalHora").value = (data.hora_jogo || "").slice(0, 5);
    document.getElementById("finalLocal").value = data.local || "";
    document.getElementById("finalArbitro").value = data.arbitro || "";
    document.getElementById("finalAssistente1").value = data.assistente_1 || "";
    document.getElementById("finalAssistente2").value = data.assistente_2 || "";
    document.getElementById("finalQuartoArbitro").value = data.quarto_arbitro || "";

    document.getElementById("finalStatus").value = data.status || "Agendado";
    document.getElementById("finalMinutoAtual").value = data.minuto_atual ?? "";
    document.getElementById("finalPlacarCasa").value = data.placar_casa ?? "";
    document.getElementById("finalPlacarFora").value = data.placar_fora ?? "";
    document.getElementById("finalPenaltisCasa").value = data.penaltis_casa ?? "";
    document.getElementById("finalPenaltisFora").value = data.penaltis_fora ?? "";

    document.getElementById("fcbCardAoVivo").classList.remove("hidden");
    document.getElementById("fcbCardNarracao").classList.remove("hidden");
    fcbAtualizarLabelsPlacar();
    fcbAlternarCamposAoVivo();
    await fcbCarregarEventos();
  }
}

function fcbAtualizarLabelsPlacar() {
  const casaId = document.getElementById("finalTimeCasa").value;
  const foraId = document.getElementById("finalTimeFora").value;
  const casa = fcbTimesCache.find(t => t.id === casaId);
  const fora = fcbTimesCache.find(t => t.id === foraId);
  document.getElementById("labelPlacarCasa").textContent = casa ? casa.nome : "Casa";
  document.getElementById("labelPlacarFora").textContent = fora ? fora.nome : "Fora";
}

async function fcbSalvarFinal() {
  const id = document.getElementById("finalId").value;

  const dados = {
    time_casa_id: document.getElementById("finalTimeCasa").value || null,
    time_fora_id: document.getElementById("finalTimeFora").value || null,
    data_jogo: document.getElementById("finalData").value || null,
    hora_jogo: document.getElementById("finalHora").value || null,
    local: document.getElementById("finalLocal").value.trim() || null,
    arbitro: document.getElementById("finalArbitro").value.trim() || null,
    assistente_1: document.getElementById("finalAssistente1").value.trim() || null,
    assistente_2: document.getElementById("finalAssistente2").value.trim() || null,
    quarto_arbitro: document.getElementById("finalQuartoArbitro").value.trim() || null,
  };

  if (!dados.time_casa_id || !dados.time_fora_id) {
    notificar("Escolha os dois times.", "aviso");
    return;
  }
  if (dados.time_casa_id === dados.time_fora_id) {
    notificar("Os times não podem ser iguais.", "aviso");
    return;
  }

  if (id) {
    const { error } = await supabaseClient.from("final_copa_brasil").update(dados).eq("id", id);
    if (error) { notificar(error.message, "erro"); return; }
  } else {
    const { data, error } = await supabaseClient
      .from("final_copa_brasil")
      .insert([{ ...dados, status: "Agendado" }])
      .select();
    if (error) { notificar(error.message, "erro"); return; }
    document.getElementById("finalId").value = data[0].id;
    document.getElementById("fcbCardAoVivo").classList.remove("hidden");
    document.getElementById("fcbCardNarracao").classList.remove("hidden");
  }

  notificar("Dados da final salvos!");
  fcbAtualizarLabelsPlacar();
  await fcbCarregarFinal();
}

// ---------- CONTROLE AO VIVO ----------

function fcbAlternarCamposAoVivo() {
  const status = document.getElementById("finalStatus").value;
  const campoMinuto = document.getElementById("finalMinutoAtual");
  // Minuto só faz sentido com o jogo rolando ou em intervalo — mas deixa
  // editável sempre, só não obrigatório fora desses estados.
  campoMinuto.disabled = !(status === "Em andamento" || status === "Intervalo");
}

async function fcbSalvarStatusAoVivo() {
  const id = document.getElementById("finalId").value;
  if (!id) { notificar("Salve os dados da final primeiro.", "aviso"); return; }

  const dados = {
    status: document.getElementById("finalStatus").value,
    minuto_atual: document.getElementById("finalMinutoAtual").value === "" ? null : Number(document.getElementById("finalMinutoAtual").value),
    placar_casa: document.getElementById("finalPlacarCasa").value === "" ? null : Number(document.getElementById("finalPlacarCasa").value),
    placar_fora: document.getElementById("finalPlacarFora").value === "" ? null : Number(document.getElementById("finalPlacarFora").value),
    penaltis_casa: document.getElementById("finalPenaltisCasa").value === "" ? null : Number(document.getElementById("finalPenaltisCasa").value),
    penaltis_fora: document.getElementById("finalPenaltisFora").value === "" ? null : Number(document.getElementById("finalPenaltisFora").value),
  };

  const { error } = await supabaseClient.from("final_copa_brasil").update(dados).eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }

  notificar("Status atualizado! " + (dados.status === "Em andamento" ? "🔴 Ao vivo" : ""));
  await fcbCarregarFinal();
}

// ---------- NARRAÇÃO / EVENTOS ----------

const FCB_TIPOS_SEM_JOGADOR_SECUNDARIO = new Set(["Cartão Amarelo", "Cartão Vermelho", "Pênalti Perdido", "Narração"]);
const FCB_TIPOS_SEM_TIME = new Set(["Narração"]);

function fcbSelecionarTipoEvento(tipo, btn) {
  fcbTipoEventoSelecionado = tipo;
  document.getElementById("fcbTipoEvento").value = tipo;
  document.querySelectorAll("#fcbChipsTipoEvento .chip-evento").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const labelPrincipal = document.getElementById("fcbLabelJogadorPrincipal");
  const labelSecundario = document.getElementById("fcbLabelJogadorSecundario");
  const campoSecundario = document.getElementById("fcbJogadorSecundarioEvento");
  const campoTime = document.getElementById("fcbCampoTimeEvento");

  campoTime.style.display = FCB_TIPOS_SEM_TIME.has(tipo) ? "none" : "";

  const rotulos = {
    "Gol": "Quem fez o gol",
    "Gol Contra": "Quem fez contra",
    "Pênalti Marcado": "Quem bateu o pênalti",
    "Pênalti Perdido": "Quem perdeu o pênalti",
    "Cartão Amarelo": "Quem recebeu o cartão",
    "Cartão Vermelho": "Quem recebeu o cartão",
    "Substituição": "Quem saiu",
    "Narração": "Jogador em destaque (opcional)",
  };
  labelPrincipal.textContent = rotulos[tipo] || "Jogador";

  if (tipo === "Substituição") {
    labelSecundario.textContent = "Quem entrou";
    campoSecundario.style.display = "";
  } else if (tipo === "Gol" || tipo === "Pênalti Marcado") {
    labelSecundario.textContent = "Assistência (opcional)";
    campoSecundario.style.display = "";
  } else {
    campoSecundario.style.display = FCB_TIPOS_SEM_JOGADOR_SECUNDARIO.has(tipo) ? "none" : "";
  }
}

async function fcbSalvarEvento() {
  const finalId = document.getElementById("finalId").value;
  if (!finalId) { notificar("Salve os dados da final primeiro.", "aviso"); return; }

  const tipo = document.getElementById("fcbTipoEvento").value;
  const minuto = document.getElementById("fcbMinutoEvento").value;

  if (minuto === "") { notificar("Informe o minuto do lance.", "aviso"); return; }

  const dados = {
    final_id: finalId,
    tipo,
    minuto: Number(minuto),
    time_id: FCB_TIPOS_SEM_TIME.has(tipo) ? null : (document.getElementById("fcbTimeEvento").value || null),
    jogador_nome: document.getElementById("fcbJogadorEvento").value.trim() || null,
    jogador_secundario_nome: document.getElementById("fcbJogadorSecundarioEvento").value.trim() || null,
    descricao: document.getElementById("fcbDescricaoEvento").value.trim() || null,
  };

  const { error } = await supabaseClient.from("final_copa_brasil_eventos").insert([dados]);
  if (error) { notificar(error.message, "erro"); return; }

  notificar("Lance adicionado à narração!");
  document.getElementById("fcbMinutoEvento").value = "";
  document.getElementById("fcbJogadorEvento").value = "";
  document.getElementById("fcbJogadorSecundarioEvento").value = "";
  document.getElementById("fcbDescricaoEvento").value = "";

  await fcbCarregarEventos();
}

async function fcbCarregarEventos() {
  const finalId = document.getElementById("finalId").value;
  if (!finalId) return;

  const { data, error } = await supabaseClient
    .from("final_copa_brasil_eventos")
    .select("*, time:time_id(*)")
    .eq("final_id", finalId)
    .order("minuto", { ascending: true })
    .order("criado_em", { ascending: true });

  if (error) { console.error(error); return; }

  fcbRenderizarEventos(data || []);
}

function fcbRenderizarEventos(eventos) {
  const lista = document.getElementById("fcbListaEventos");
  if (!lista) return;

  if (!eventos.length) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum lance narrado ainda.</p>`;
    return;
  }

  const icones = {
    "Gol": "⚽", "Gol Contra": "⚽", "Pênalti Marcado": "🥅", "Pênalti Perdido": "❌",
    "Cartão Amarelo": "🟨", "Cartão Vermelho": "🟥", "Substituição": "🔄", "Narração": "📝",
  };

  lista.innerHTML = eventos.map(e => `
    <div class="admin-item">
      <div class="title">${icones[e.tipo] || "📝"} ${e.minuto}' — ${e.tipo}${e.time ? ` (${e.time.nome})` : ""}</div>
      <div class="meta">
        ${e.jogador_nome ? `${e.jogador_nome}` : ""}${e.jogador_secundario_nome ? ` → ${e.jogador_secundario_nome}` : ""}
        ${e.descricao ? `<br>${e.descricao}` : ""}
      </div>
      <div class="actions">
        <button class="btn btn-sm btn-danger" onclick="fcbExcluirEvento('${e.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

async function fcbExcluirEvento(id) {
  if (!confirm("Excluir este lance da narração?")) return;
  const { error } = await supabaseClient.from("final_copa_brasil_eventos").delete().eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }
  notificar("Lance excluído.");
  await fcbCarregarEventos();
}

document.addEventListener("DOMContentLoaded", fcbChecarAcessoAdmin);
