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
let fcbArbitrosCbfCache = [];
let fcbJogadoresCache = [];
let fcbJogadorPrincipalSelecionado = null;
let fcbJogadorSecundarioSelecionado = null;
let fcbJogadorPenaltiSelecionado = null; // { id, nome, timeId, ladoWrapId }
let fcbCobrancasPenaltisCache = [];

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
  await fcbCarregarArbitrosCbf();
  await fcbCarregarJogadores();
  fcbRenderizarGradeJogadoresEvento();
  fcbExibirArbitragemDefinida(null);
  await fcbCarregarFinal();
}

// Busca todos os jogadores dos times cadastrados (elencos podem estar
// incompletos, mas a grade de seleção usa o que já existir).
async function fcbCarregarJogadores() {
  const { data, error } = await supabaseClient
    .from("jogadores")
    .select("id, nome, time_id")
    .order("nome", { ascending: true });

  if (error) { console.error(error); return; }
  fcbJogadoresCache = data || [];
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

// Ao escolher o time da casa, define automaticamente o campo oculto
// "Local" com o estádio cadastrado desse time (tabela times.estadio) e
// mostra o nome na tela — sem input pra digitar, igual ao jogo normal do
// Brasileirão, onde estádio/capacidade/foto vêm sozinhos do time mandante.
function fcbPreencherEstadioMandante() {
  const casaId = document.getElementById("finalTimeCasa").value;
  const time = fcbTimesCache.find(t => t.id === casaId);
  const estadio = time ? (time.estadio || "") : "";

  document.getElementById("finalLocal").value = estadio;

  const displayLocal = document.getElementById("fcbLocalDefinido");
  displayLocal.textContent = estadio ? `📍 ${estadio}` : "";

  fcbAtualizarLabelsPlacar();
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
    document.getElementById("fcbLocalDefinido").textContent = data.local ? `📍 ${data.local}` : "";
    document.getElementById("finalArbitro").value = data.arbitro || "";
    document.getElementById("finalAssistente1").value = data.assistente_1 || "";
    document.getElementById("finalAssistente2").value = data.assistente_2 || "";
    document.getElementById("finalQuartoArbitro").value = data.quarto_arbitro || "";
    fcbExibirArbitragemDefinida(data);

    document.getElementById("finalStatus").value = data.status || "Agendado";
    document.getElementById("finalMinutoAtual").value = data.minuto_atual ?? "";
    document.getElementById("finalPlacarCasa").value = data.placar_casa ?? "";
    document.getElementById("finalPlacarFora").value = data.placar_fora ?? "";
    document.getElementById("finalPenaltisCasa").value = data.penaltis_casa ?? "";
    document.getElementById("finalPenaltisFora").value = data.penaltis_fora ?? "";

    document.getElementById("fcbCardAoVivo").classList.remove("hidden");
    document.getElementById("fcbCardNarracao").classList.remove("hidden");
    document.getElementById("fcbBtnResortear").classList.remove("hidden");
    fcbAtualizarLabelsPlacar();
    fcbAlternarCamposAoVivo();
    fcbRenderizarGradeJogadoresEvento();
    await fcbCarregarCobrancasPenaltis();
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

// ---------- ARBITRAGEM (sorteio) ----------

// Reaproveita a mesma tabela "arbitros_cbf" já usada nos jogos normais do
// Brasileirão (cadastrada na Central Admin principal, aba Times).
async function fcbCarregarArbitrosCbf() {
  const { data, error } = await supabaseClient
    .from("arbitros_cbf")
    .select("*")
    .eq("ativo", true);

  if (error) { console.error(error); return; }
  fcbArbitrosCbfCache = data || [];
}

function fcbSortearNomeArbitro(lista, excluir = []) {
  const disponiveis = lista.filter(a => !excluir.includes(a.nome));
  if (!disponiveis.length) return "";
  return disponiveis[Math.floor(Math.random() * disponiveis.length)].nome;
}

// Gera o quarteto sorteado (sem tocar no DOM) — reaproveitado tanto pelo
// botão manual "Sortear novamente" quanto pelo sorteio automático ao
// salvar um jogo novo.
function fcbGerarQuartetoArbitragem() {
  const centrais = fcbArbitrosCbfCache.filter(a => a.categoria === "central");
  const assistentes = fcbArbitrosCbfCache.filter(a => a.categoria === "assistente");
  const videos = fcbArbitrosCbfCache.filter(a => a.categoria === "video");

  const arbitro = fcbSortearNomeArbitro(centrais);
  const assistente_1 = fcbSortearNomeArbitro(assistentes);
  const assistente_2 = fcbSortearNomeArbitro(assistentes, [assistente_1]);
  const quarto_arbitro = fcbSortearNomeArbitro(videos);

  return { arbitro, assistente_1, assistente_2, quarto_arbitro };
}

function fcbExibirArbitragemDefinida(quarteto) {
  const area = document.getElementById("fcbArbitragemDefinida");
  if (!area) return;

  if (!quarteto || (!quarteto.arbitro && !quarteto.assistente_1 && !quarteto.assistente_2 && !quarteto.quarto_arbitro)) {
    area.innerHTML = `<p class="text-dim" style="font-size:12.5px;">Ainda não sorteada — salve o jogo para sortear.</p>`;
    return;
  }

  const linhas = [
    ["Árbitro", quarteto.arbitro],
    ["1º Assistente", quarteto.assistente_1],
    ["2º Assistente", quarteto.assistente_2],
    ["4º Árbitro", quarteto.quarto_arbitro],
  ];

  area.innerHTML = linhas
    .map(([label, nome]) => `<p style="margin:4px 0;font-size:13.5px;"><strong>${label}:</strong> ${nome || "—"}</p>`)
    .join("");
}

// Sorteia árbitro central, 4º árbitro/vídeo e os dois assistentes
// (garantindo que 1º e 2º assistente sejam pessoas diferentes), igual à
// lógica usada nos jogos normais do Brasileirão. Usado pelo botão manual
// "Sortear novamente" (jogo já salvo) — grava direto no banco.
async function fcbSortearArbitragem() {
  const id = document.getElementById("finalId").value;
  if (!id) {
    notificar("Salve o jogo primeiro para poder sortear a arbitragem.", "aviso");
    return;
  }

  if (!fcbArbitrosCbfCache.length) {
    notificar("Nenhum árbitro cadastrado. Cadastre em Central Admin > Times > Árbitros CBF.", "aviso");
    return;
  }

  const quarteto = fcbGerarQuartetoArbitragem();

  if (!quarteto.arbitro || !quarteto.assistente_1 || !quarteto.assistente_2 || !quarteto.quarto_arbitro) {
    notificar("Faltam árbitros cadastrados em alguma categoria (central/assistente/vídeo).", "aviso");
  }

  const { error } = await supabaseClient.from("final_copa_brasil").update(quarteto).eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }

  document.getElementById("finalArbitro").value = quarteto.arbitro;
  document.getElementById("finalAssistente1").value = quarteto.assistente_1;
  document.getElementById("finalAssistente2").value = quarteto.assistente_2;
  document.getElementById("finalQuartoArbitro").value = quarteto.quarto_arbitro;
  fcbExibirArbitragemDefinida(quarteto);

  notificar("Árbitros sorteados novamente!");
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

  // Garante que o Local (estádio) esteja definido pelo time da casa antes
  // de salvar — reforço caso o campo oculto não tenha sido atualizado.
  if (!dados.local && dados.time_casa_id) {
    const timeCasa = fcbTimesCache.find(t => t.id === dados.time_casa_id);
    if (timeCasa && timeCasa.estadio) {
      dados.local = timeCasa.estadio;
      document.getElementById("finalLocal").value = timeCasa.estadio;
    }
  }

  if (id) {
    const { error } = await supabaseClient.from("final_copa_brasil").update(dados).eq("id", id);
    if (error) { notificar(error.message, "erro"); return; }
  } else {
    // Se o admin não sorteou manualmente antes de salvar, sorteia agora
    // automaticamente — igual ao fluxo dos jogos normais do Brasileirão,
    // onde a arbitragem sai sozinha ao salvar um jogo novo.
    if (!dados.arbitro && !dados.assistente_1 && !dados.assistente_2 && !dados.quarto_arbitro) {
      const quarteto = fcbGerarQuartetoArbitragem();
      Object.assign(dados, quarteto);
      document.getElementById("finalArbitro").value = quarteto.arbitro;
      document.getElementById("finalAssistente1").value = quarteto.assistente_1;
      document.getElementById("finalAssistente2").value = quarteto.assistente_2;
      document.getElementById("finalQuartoArbitro").value = quarteto.quarto_arbitro;
    }

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

// Renderiza as grades de jogadores (casa/fora) para a disputa de pênaltis,
// usando os elencos de finalTimeCasa/finalTimeFora já definidos nos
// "Dados da final". Cada botão de jogador, ao ser clicado, mostra os
// botões ✅ Marcou / ❌ Perdeu para registrar a cobrança.
function fcbRenderizarGradeJogadoresPenaltis() {
  const casaId = document.getElementById("finalTimeCasa").value;
  const foraId = document.getElementById("finalTimeFora").value;
  const casa = fcbTimesCache.find(t => t.id === casaId);
  const fora = fcbTimesCache.find(t => t.id === foraId);

  document.getElementById("fcbLabelPenaltisCasa").textContent = casa ? casa.nome : "Casa";
  document.getElementById("fcbLabelPenaltisFora").textContent = fora ? fora.nome : "Fora";

  const montar = (containerId, timeId) => {
    const container = document.getElementById(containerId);
    const jogadoresDoTime = fcbJogadoresCache.filter(j => j.time_id === timeId);
    if (!timeId) {
      container.innerHTML = `<p class="text-dim" style="font-size:12px;">Selecione o time nos Dados da final.</p>`;
      return;
    }
    if (!jogadoresDoTime.length) {
      container.innerHTML = `<p class="text-dim" style="font-size:12px;">Nenhum jogador cadastrado.</p>`;
      return;
    }
    container.innerHTML = jogadoresDoTime.map(j => {
      const cobranca = fcbCobrancasPenaltisCache.find(c => c.jogador_nome === j.nome && c.time_id === timeId);
      let classeExtra = "";
      let marcador = "";
      if (cobranca) {
        classeExtra = cobranca.tipo === "Pênalti Marcado" ? "penalti-marcou" : "penalti-perdeu";
        marcador = cobranca.tipo === "Pênalti Marcado" ? " ✅" : " ❌";
      }
      return `<button type="button" class="fcb-jogador-btn ${classeExtra}" data-id="${j.id}" onclick="fcbAbrirResultadoPenalti('${j.id}', '${timeId}', this)">${j.nome}${marcador}</button>`;
    }).join("");
  };

  montar("fcbGradeJogadoresPenaltisCasa", casaId);
  montar("fcbGradeJogadoresPenaltisFora", foraId);
}

function fcbAbrirResultadoPenalti(jogadorId, timeId, btn) {
  const jogador = fcbJogadoresCache.find(j => j.id === jogadorId);
  if (!jogador) return;

  fcbJogadorPenaltiSelecionado = { id: jogador.id, nome: jogador.nome, timeId };

  document.querySelectorAll("#fcbGradeJogadoresPenaltisCasa .fcb-jogador-btn, #fcbGradeJogadoresPenaltisFora .fcb-jogador-btn")
    .forEach(b => b.style.outline = "none");
  if (btn) btn.style.outline = `2px solid var(--grama)`;

  document.getElementById("fcbPenaltiJogadorSelecionado").textContent = `Cobrança de: ${jogador.nome}`;
  document.getElementById("fcbPenaltiResultadoArea").classList.remove("hidden");
}

// Grava a cobrança como um evento da narração (tipo Pênalti Marcado/Perdido)
// e recalcula o placar da disputa a partir da contagem desses eventos.
async function fcbRegistrarCobrancaPenalti(marcou) {
  const finalId = document.getElementById("finalId").value;
  if (!finalId) { notificar("Salve os dados da final primeiro.", "aviso"); return; }
  if (!fcbJogadorPenaltiSelecionado) { notificar("Selecione o jogador que bateu o pênalti.", "aviso"); return; }

  const { nome, timeId } = fcbJogadorPenaltiSelecionado;
  const tipo = marcou ? "Pênalti Marcado" : "Pênalti Perdido";

  const dados = {
    final_id: finalId,
    tipo,
    minuto: 0,
    time_id: timeId,
    jogador_nome: nome,
    jogador_secundario_nome: null,
    descricao: "Disputa de pênaltis",
  };

  const { error } = await supabaseClient.from("final_copa_brasil_eventos").insert([dados]);
  if (error) { notificar(error.message, "erro"); return; }

  notificar(marcou ? `${nome} marcou! ✅` : `${nome} perdeu. ❌`);

  document.getElementById("fcbPenaltiResultadoArea").classList.add("hidden");
  fcbJogadorPenaltiSelecionado = null;

  await fcbCarregarCobrancasPenaltis();
  await fcbCarregarEventos();
}

// Busca as cobranças já registradas (eventos Pênalti Marcado/Perdido com
// descrição "Disputa de pênaltis") e recalcula o placar da disputa.
async function fcbCarregarCobrancasPenaltis() {
  const finalId = document.getElementById("finalId").value;
  if (!finalId) { fcbCobrancasPenaltisCache = []; return; }

  const { data, error } = await supabaseClient
    .from("final_copa_brasil_eventos")
    .select("*")
    .eq("final_id", finalId)
    .eq("descricao", "Disputa de pênaltis")
    .in("tipo", ["Pênalti Marcado", "Pênalti Perdido"])
    .order("criado_em", { ascending: true });

  if (error) { console.error(error); return; }

  fcbCobrancasPenaltisCache = data || [];

  const casaId = document.getElementById("finalTimeCasa").value;
  const foraId = document.getElementById("finalTimeFora").value;
  const golsCasa = fcbCobrancasPenaltisCache.filter(c => c.time_id === casaId && c.tipo === "Pênalti Marcado").length;
  const golsFora = fcbCobrancasPenaltisCache.filter(c => c.time_id === foraId && c.tipo === "Pênalti Marcado").length;

  document.getElementById("finalPenaltisCasa").value = golsCasa;
  document.getElementById("finalPenaltisFora").value = golsFora;

  const casa = fcbTimesCache.find(t => t.id === casaId);
  const fora = fcbTimesCache.find(t => t.id === foraId);
  document.getElementById("fcbPlacarPenaltisResumo").textContent =
    (casa || fora) ? `Pênaltis: ${casa ? casa.nome : "Casa"} ${golsCasa} x ${golsFora} ${fora ? fora.nome : "Fora"}` : "";

  fcbRenderizarGradeJogadoresPenaltis();
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
  const campoSecundario = document.getElementById("fcbCampoJogadorSecundario");
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

  // Time pode ter mudado de relevância (Narração esconde o campo) — sempre
  // re-renderiza a grade de jogadores pro time atualmente selecionado.
  fcbRenderizarGradeJogadoresEvento();
}

// Renderiza a grade de botões de jogadores do time selecionado no evento,
// tanto pro jogador principal quanto pro secundário (assistência/substituto).
function fcbRenderizarGradeJogadoresEvento() {
  const timeId = document.getElementById("fcbTimeEvento").value;
  const jogadoresDoTime = fcbJogadoresCache.filter(j => j.time_id === timeId);

  fcbJogadorPrincipalSelecionado = null;
  fcbJogadorSecundarioSelecionado = null;
  document.getElementById("fcbJogadorEvento").value = "";
  document.getElementById("fcbJogadorSecundarioEvento").value = "";

  const montarGrade = (containerId, onClickFn) => {
    const container = document.getElementById(containerId);
    if (!jogadoresDoTime.length) {
      container.innerHTML = `<p class="text-dim" style="font-size:12px;">Nenhum jogador cadastrado para este time.</p>`;
      return;
    }
    container.innerHTML = jogadoresDoTime.map(j => `
      <button type="button" class="fcb-jogador-btn" data-id="${j.id}" onclick="${onClickFn}('${j.id}', this)">${j.nome}</button>
    `).join("");
  };

  montarGrade("fcbGradeJogadorPrincipal", "fcbSelecionarJogadorPrincipal");
  montarGrade("fcbGradeJogadorSecundario", "fcbSelecionarJogadorSecundario");
}

function fcbSelecionarJogadorPrincipal(jogadorId, btn) {
  const jogador = fcbJogadoresCache.find(j => j.id === jogadorId);
  fcbJogadorPrincipalSelecionado = jogador || null;
  document.getElementById("fcbJogadorEvento").value = jogador ? jogador.nome : "";

  document.querySelectorAll("#fcbGradeJogadorPrincipal .fcb-jogador-btn").forEach(b => b.classList.remove("selecionado"));
  if (btn) btn.classList.add("selecionado");
}

function fcbSelecionarJogadorSecundario(jogadorId, btn) {
  const jogador = fcbJogadoresCache.find(j => j.id === jogadorId);
  fcbJogadorSecundarioSelecionado = jogador || null;
  document.getElementById("fcbJogadorSecundarioEvento").value = jogador ? jogador.nome : "";

  document.querySelectorAll("#fcbGradeJogadorSecundario .fcb-jogador-btn").forEach(b => b.classList.remove("selecionado"));
  if (btn) btn.classList.add("selecionado");
}

async function fcbSalvarEvento() {
  const finalId = document.getElementById("finalId").value;
  if (!finalId) { notificar("Salve os dados da final primeiro.", "aviso"); return; }

  const tipo = document.getElementById("fcbTipoEvento").value;

  const dados = {
    final_id: finalId,
    tipo,
    minuto: 0,
    time_id: FCB_TIPOS_SEM_TIME.has(tipo) ? null : (document.getElementById("fcbTimeEvento").value || null),
    jogador_nome: document.getElementById("fcbJogadorEvento").value.trim() || null,
    jogador_secundario_nome: document.getElementById("fcbJogadorSecundarioEvento").value.trim() || null,
    descricao: document.getElementById("fcbDescricaoEvento").value.trim() || null,
  };

  const { error } = await supabaseClient.from("final_copa_brasil_eventos").insert([dados]);
  if (error) { notificar(error.message, "erro"); return; }

  notificar("Lance adicionado à narração!");
  fcbJogadorPrincipalSelecionado = null;
  fcbJogadorSecundarioSelecionado = null;
  document.getElementById("fcbJogadorEvento").value = "";
  document.getElementById("fcbJogadorSecundarioEvento").value = "";
  document.querySelectorAll(".fcb-jogador-btn").forEach(b => b.classList.remove("selecionado"));
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
      <div class="title">${icones[e.tipo] || "📝"} ${e.tipo}${e.time ? ` (${e.time.nome})` : ""}</div>
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
