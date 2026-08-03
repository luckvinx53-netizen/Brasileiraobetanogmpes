// =========================================================
// CENTRAL ADMIN
// Autenticação real via Supabase Auth + checagem de admin
// =========================================================

let temporadaAtiva = null;
let timesCache = [];
let jogosCache = [];
let jogadoresCache = [];
let arbitrosCbfCache = [];

// ---------- LOGIN / SESSÃO ----------

async function fazerLogin() {
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

    if (typeof supabaseClient === "undefined") {
      notificar("ERRO: conexão com o banco não foi carregada (supabaseClient indefinido). Recarregue a página.", "erro");
      return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });

    if (error) {
      notificar("ERRO LOGIN: " + error.message, "erro");
      return;
    }

    await checarAcessoAdmin();
  } catch (e) {
    notificar("EXCEÇÃO: " + e.message, "erro");
    console.error(e);
  } finally {
    if (botao) { botao.disabled = false; botao.textContent = textoOriginal; }
  }
}

async function fazerLogout() {
  await supabaseClient.auth.signOut();
  window.location.reload();
}

// Verifica se o usuário logado está na tabela "admins"
async function checarAcessoAdmin() {
  try {
    const { data: { session }, error: sessErr } = await supabaseClient.auth.getSession();

    if (sessErr) {
      notificar("ERRO SESSÃO: " + sessErr.message, "erro");
      mostrarGate();
      return;
    }

    if (!session) {
      mostrarGate();
      return;
    }

    const { data: admin, error } = await supabaseClient
      .from("admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      notificar("ERRO TABELA ADMINS: " + error.message, "erro");
      mostrarGate();
      return;
    }

    if (!admin) {
      notificar("Sua conta não tem permissão de administrador (não encontrada na tabela admins).", "erro");
      await supabaseClient.auth.signOut();
      mostrarGate();
      return;
    }

    mostrarConteudoAdmin();
    await iniciarAdmin();
  } catch (e) {
    notificar("EXCEÇÃO CHECAGEM: " + e.message, "erro");
    console.error(e);
    mostrarGate();
  }
}

function mostrarGate() {
  document.getElementById("gateLogin").classList.remove("hidden");
  document.getElementById("conteudoAdmin").classList.add("hidden");
}

function mostrarConteudoAdmin() {
  document.getElementById("gateLogin").classList.add("hidden");
  document.getElementById("conteudoAdmin").classList.remove("hidden");
}

// ---------- ABAS ----------

function abrirAba(id, btn) {
  ["abaJogos", "abaTimes", "abaJogadores", "abaNoticias", "abaTecnicos", "abaBid", "abaRedeSocial", "abaTemporadas"].forEach(a => {
    document.getElementById(a).classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");

  document.querySelectorAll(".tabs-row .tab-btn").forEach(b => {
    if (!b.closest("#subAbasJogo")) b.classList.remove("active");
  });
  if (btn) btn.classList.add("active");

  if (id === "abaTecnicos" && typeof popularSelectTimeTecnico === "function") {
    popularSelectTimeTecnico();
    carregarPrazoEscalacao();
    carregarTecnicosAdmin();
    popularSelectJogosEscalacao();
  }

  if (id === "abaBid" && typeof carregarJanelaBidAdmin === "function") {
    carregarJanelaBidAdmin();
    popularFiltroTimeSolicitacoesBid();
    carregarSolicitacoesBidAdmin();
  }

  if (id === "abaRedeSocial" && typeof carregarRedeSocialAdmin === "function") {
    carregarRedeSocialAdmin();
  }

  if (id === "abaTemporadas" && typeof carregarTemporadasAdmin === "function") {
    carregarTemporadasAdmin();
    montarFormularioNovaTemporada();
  }
}

// ---------- SUB-ABAS DENTRO DO PAINEL DE UM JOGO ----------

function abrirSubAbaJogo(id, btn) {
  ["subDados", "subEventos"].forEach(a => {
    document.getElementById(a).classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");

  document.querySelectorAll("#subAbasJogo .tab-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function abrirPainelJogo(titulo) {
  document.querySelector('.tabs-row > [onclick*="abaJogos"]')?.click();
  document.getElementById("painelJogo").classList.remove("hidden");
  document.getElementById("painelJogoTitulo").textContent = titulo;
  abrirSubAbaJogo("subDados", document.querySelector('#subAbasJogo [data-sub="subDados"]'));
  document.getElementById("painelJogo").scrollIntoView({ behavior: "smooth", block: "start" });
}

function fecharPainelJogo() {
  document.getElementById("painelJogo").classList.add("hidden");
  limparFormularioJogo();
}

function novoJogo() {
  limparFormularioJogo();
  abrirPainelJogo("Novo jogo");
}

// ---------- INICIALIZAÇÃO ----------

async function iniciarAdmin() {
  temporadaAtiva = await getTemporadaAtiva();

  if (!temporadaAtiva) {
    notificar("Nenhuma temporada ativa encontrada. Crie uma no Supabase.", "erro");
    return;
  }

  await carregarTimesAdmin();
  await carregarJogosAdmin();
  await carregarJogadoresAdmin();
  await carregarNoticiasAdmin();
  await carregarArbitrosCbfAdmin();
  popularSelectMinutos();

  if (typeof inicializarChaveamentoAdmin === "function") {
    inicializarChaveamentoAdmin();
  }
}

function popularSelectMinutos() {
  const select = document.getElementById("minutoEvento");
  if (!select) return;
  select.innerHTML = "";
  for (let i = 0; i <= 90; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i + "'";
    select.appendChild(opt);
  }
}

// ================= TIMES =================

async function carregarTimesAdmin() {
  const { data, error } = await supabaseClient
    .from("times")
    .select("*")
    .eq("temporada_id", temporadaAtiva.id)
    .order("nome", { ascending: true });

  if (error) { notificar(error.message, "erro"); return; }

  timesCache = data || [];

  const filtroAtualSelecionado = document.getElementById("filtroTimeJogadores")?.value || "";

  ["timeCasa", "timeFora", "timeJogador", "timeTabela", "filtroTimeJogadores"].forEach(id => {
    const manterPrimeira = id === "filtroTimeJogadores";
    document.getElementById(id).innerHTML = manterPrimeira ? `<option value="">Selecione um time</option>` : "";
  });

  timesCache.forEach(t => {
    const opt = `<option value="${t.id}">${t.nome}</option>`;
    document.getElementById("timeCasa").innerHTML += opt;
    document.getElementById("timeFora").innerHTML += opt;
    document.getElementById("timeJogador").innerHTML += opt;
    document.getElementById("timeTabela").innerHTML += opt;
    document.getElementById("filtroTimeJogadores").innerHTML += opt;
  });

  document.getElementById("filtroTimeJogadores").value = filtroAtualSelecionado;

  renderizarListaTimesAdmin();

  if (typeof popularSelectsCapa === "function") popularSelectsCapa();
}

function renderizarListaTimesAdmin() {
  const lista = document.getElementById("listaTimesAdmin");
  if (!lista) return;

  if (timesCache.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum time cadastrado ainda.</p>`;
    return;
  }

  lista.innerHTML = timesCache.map(t => `
    <div class="admin-item">
      <div class="title">${t.nome} ${t.sigla ? "(" + t.sigla + ")" : ""}</div>
      <div class="meta">${t.pontos} pts · ${t.jogos} jogos · SG ${t.saldo} · R$ ${Number(t.orcamento || 0).toLocaleString("pt-BR")}</div>
      <div class="actions">
        <button class="btn btn-sm btn-secondary" onclick='editarTime(${JSON.stringify(t)})'>Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirTime('${t.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

function editarTime(t) {
  document.querySelector('[onclick*="abaTimes"]')?.click();
  document.getElementById("tituloFormTime").textContent = "Editar time";
  document.getElementById("timeId").value = t.id;
  document.getElementById("nomeTime").value = t.nome || "";
  document.getElementById("siglaTime").value = t.sigla || "";
  document.getElementById("escudoTime").value = t.escudo_url || "";
  document.getElementById("cidadeTime").value = t.cidade || "";
  document.getElementById("estadioTime").value = t.estadio || "";
  document.getElementById("capacidadeEstadioTime").value = t.capacidade_estadio || "";
  document.getElementById("fotoEstadioTime").value = t.foto_estadio || "";
  document.getElementById("orcamentoTime").value = t.orcamento ?? "";
  document.getElementById("cardFormTime").classList.remove("hidden");

  // Abre também o card de estatísticas, já com esse time selecionado e preenchido
  document.getElementById("timeTabela").value = t.id;
  preencherTimeManual();
  document.getElementById("cardEstatisticasTime").classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Abre o formulário vazio pra cadastrar um time novo do zero.
function abrirFormularioNovoTime() {
  document.getElementById("tituloFormTime").textContent = "Novo time";
  document.getElementById("timeId").value = "";
  document.getElementById("nomeTime").value = "";
  document.getElementById("siglaTime").value = "";
  document.getElementById("escudoTime").value = "";
  document.getElementById("cidadeTime").value = "";
  document.getElementById("estadioTime").value = "";
  document.getElementById("capacidadeEstadioTime").value = "";
  document.getElementById("fotoEstadioTime").value = "";
  document.getElementById("orcamentoTime").value = "";
  document.getElementById("cardFormTime").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fecharFormularioTime() {
  document.getElementById("cardFormTime").classList.add("hidden");
}

function fecharEstatisticasTime() {
  document.getElementById("cardEstatisticasTime").classList.add("hidden");
}

async function salvarTime() {
  const id = document.getElementById("timeId").value;

  const time = {
    temporada_id: temporadaAtiva.id,
    nome: document.getElementById("nomeTime").value.trim(),
    sigla: document.getElementById("siglaTime").value.trim().toUpperCase(),
    escudo_url: document.getElementById("escudoTime").value.trim(),
    cidade: document.getElementById("cidadeTime").value.trim(),
    estadio: document.getElementById("estadioTime").value.trim(),
    capacidade_estadio: document.getElementById("capacidadeEstadioTime").value.trim(),
    foto_estadio: document.getElementById("fotoEstadioTime").value.trim(),
  };

  const orcamentoInput = document.getElementById("orcamentoTime").value;

  if (!time.nome) { notificar("Informe o nome do time.", "aviso"); return; }

  let error;
  let timeIdSalvo = id;

  if (id) {
    // Editando um time existente: se o admin mudou o valor do orçamento,
    // registra a diferença como um ajuste manual no histórico.
    const timeAnterior = timesCache.find(t => String(t.id) === String(id));
    if (orcamentoInput !== "") {
      const novoValor = Number(orcamentoInput);
      const valorAnterior = Number(timeAnterior?.orcamento || 0);
      time.orcamento = novoValor;

      if (novoValor !== valorAnterior) {
        await supabaseClient.from("orcamento_movimentacoes").insert([{
          time_id: id,
          tipo: novoValor > valorAnterior ? "entrada" : "saida",
          valor: Math.abs(novoValor - valorAnterior),
          motivo: "ajuste_admin",
        }]);
      }
    }
    ({ error } = await supabaseClient.from("times").update(time).eq("id", id));
  } else {
    // Time novo: orçamento inicial definido pelo admin (padrão 0 se não informado)
    const orcamentoInicial = orcamentoInput !== "" ? Number(orcamentoInput) : 0;
    time.orcamento = orcamentoInicial;
    const { data: novoTime, error: erroInsert } = await supabaseClient.from("times").insert([time]).select().single();
    error = erroInsert;
    timeIdSalvo = novoTime?.id;

    if (!error && timeIdSalvo && orcamentoInicial > 0) {
      await supabaseClient.from("orcamento_movimentacoes").insert([{
        time_id: timeIdSalvo,
        tipo: "entrada",
        valor: orcamentoInicial,
        motivo: "orcamento_inicial",
      }]);
    }
  }

  if (error) { notificar(error.message, "erro"); return; }

  notificar("Time salvo!");
  fecharFormularioTime();
  await carregarTimesAdmin();
}

async function excluirTime(id) {
  if (!confirm("Excluir esse time? Isso também apaga jogadores e jogos vinculados a ele.")) return;

  const { error } = await supabaseClient.from("times").delete().eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }

  notificar("Time excluído!");
  await carregarTimesAdmin();
  await carregarJogosAdmin();
  await carregarJogadoresAdmin();
}

function preencherTimeManual() {
  const id = document.getElementById("timeTabela").value;
  const time = timesCache.find(t => String(t.id) === String(id));
  if (!time) return;

  document.getElementById("pontos").value = time.pontos || 0;
  document.getElementById("jogosCount").value = time.jogos || 0;
  document.getElementById("vitorias").value = time.vitorias || 0;
  document.getElementById("empates").value = time.empates || 0;
  document.getElementById("derrotas").value = time.derrotas || 0;
  document.getElementById("gols_pro").value = time.gols_pro || 0;
  document.getElementById("gols_contra").value = time.gols_contra || 0;
}

async function atualizarEstatisticasTime() {
  const id = document.getElementById("timeTabela").value;
  if (!id) { notificar("Escolha um time.", "aviso"); return; }

  const dados = {
    pontos: Number(document.getElementById("pontos").value || 0),
    jogos: Number(document.getElementById("jogosCount").value || 0),
    vitorias: Number(document.getElementById("vitorias").value || 0),
    empates: Number(document.getElementById("empates").value || 0),
    derrotas: Number(document.getElementById("derrotas").value || 0),
    gols_pro: Number(document.getElementById("gols_pro").value || 0),
    gols_contra: Number(document.getElementById("gols_contra").value || 0),
  };

  const { error } = await supabaseClient.from("times").update(dados).eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }

  notificar("Estatísticas atualizadas!");
  fecharEstatisticasTime();
  await carregarTimesAdmin();
}

// ================= JOGOS =================

function dadosJogo() {
  // O campo único "hora_inicio_simulacao" (datetime-local) agora define tanto
  // a data/hora exibidas do jogo quanto o instante em que a simulação (0–90')
  // começa a contar. data_jogo/hora_jogo continuam sendo gravados (derivados
  // daqui) porque outras telas do site (jogo.js, utils.js, meu-time.js) ainda
  // leem essas duas colunas separadas para exibição.
  const inicioSimulacaoInput = document.getElementById("hora_inicio_simulacao").value || null;
  // inicioSimulacaoInput vem como "AAAA-MM-DDTHH:MM" — é a hora de PAREDE que
  // o técnico digitou, no fuso de Brasília (não tem informação de fuso
  // nenhuma nessa string). data_jogo/hora_jogo continuam usando esse valor
  // cru, porque só servem para EXIBIÇÃO de texto em outras telas.
  const [dataParte, horaParte] = inicioSimulacaoInput ? inicioSimulacaoInput.split("T") : [null, null];

  // hora_inicio_simulacao, por outro lado, é usado para CÁLCULO matemático
  // de "quanto tempo já passou" (aqui no site e na Edge Function
  // notificar-gols). Essa coluna é timestamptz — se mandarmos a string crua
  // "AAAA-MM-DDTHH:MM" sem fuso, o Postgres assume que já é UTC, gravando o
  // instante errado (3h adiantado em relação ao que o técnico realmente
  // quis dizer, já que Brasília = UTC-3). Por isso convertemos aqui,
  // explicitamente, para o instante UTC real antes de enviar — assim o
  // valor salvo já é o instante correto para qualquer lugar que o leia
  // depois (front-end e a Edge Function de notificações).
  const inicioSimulacaoUtc = typeof dataHoraBrasiliaParaUtcIso === "function"
    ? dataHoraBrasiliaParaUtcIso(inicioSimulacaoInput)
    : inicioSimulacaoInput;

  return {
    temporada_id: temporadaAtiva.id,
    rodada: Number(document.getElementById("rodada").value || 0),
    time_casa_id: document.getElementById("timeCasa").value,
    time_fora_id: document.getElementById("timeFora").value,
    data_jogo: dataParte,
    hora_jogo: horaParte || "",
    hora_inicio_simulacao: inicioSimulacaoUtc,
    ...(typeof dadosChaveamentoJogo === "function" ? dadosChaveamentoJogo() : {}),
  };
}

// Preenche local/capacidade/foto_estadio do jogo automaticamente com os
// dados cadastrados no time da casa (mandante). Assim o admin não precisa
// mais digitar isso em cada jogo — só cadastra o estádio uma vez no time.
function estadioDoMandante(timeCasaId) {
  const timeCasa = timesCache.find(t => String(t.id) === String(timeCasaId));
  return {
    local: timeCasa?.estadio || "",
    capacidade: timeCasa?.capacidade_estadio || "",
    foto_estadio: timeCasa?.foto_estadio || "",
  };
}

async function salvarJogo() {
  const id = document.getElementById("jogoId").value;
  const jogo = { ...dadosJogo(), ...estadioDoMandante(document.getElementById("timeCasa").value) };

  if (!jogo.time_casa_id || !jogo.time_fora_id) {
    notificar("Escolha os dois times.", "aviso");
    return;
  }
  if (jogo.time_casa_id === jogo.time_fora_id) {
    notificar("Os times não podem ser iguais.", "aviso");
    return;
  }

  let jogoId = id;
  const eraJogoNovo = !id;

  if (id) {
    const { error } = await supabaseClient.from("jogos").update(jogo).eq("id", id);
    if (error) { notificar(error.message, "erro"); return; }
  } else {
    const { data, error } = await supabaseClient.from("jogos").insert([{ ...jogo, computado: false }]).select();
    if (error) { notificar(error.message, "erro"); return; }
    jogoId = data[0].id;
    document.getElementById("jogoId").value = jogoId;
  }

  // Só sorteia arbitragem automaticamente na criação do jogo. Em edições
  // seguintes, mantém o quarteto já sorteado (o admin usa o botão
  // "Sortear novamente" se quiser trocar).
  if (eraJogoNovo) {
    await sortearESalvarArbitragem(jogoId);
  }

  notificar("Jogo salvo!");

  await carregarJogosAdmin();
  atualizarTimesEscalacaoEvento();
}

// ---------- ÁRBITROS CBF (cadastro) ----------

async function carregarArbitrosCbfAdmin() {
  const { data, error } = await supabaseClient
    .from("arbitros_cbf")
    .select("*")
    .eq("ativo", true)
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });

  if (error) { notificar(error.message, "erro"); return; }

  arbitrosCbfCache = data || [];
  renderizarListaArbitrosCbf();
}

const MC_LABEL_CATEGORIA_ARBITRO = { central: "Central", assistente: "Assistente", video: "Vídeo (VAR)" };

function renderizarListaArbitrosCbf() {
  const lista = document.getElementById("listaArbitrosCbf");
  if (!lista) return;

  if (arbitrosCbfCache.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum árbitro cadastrado ainda.</p>`;
    return;
  }

  lista.innerHTML = arbitrosCbfCache.map(a => `
    <div class="admin-item">
      <div class="title">${a.nome}</div>
      <div class="meta">${MC_LABEL_CATEGORIA_ARBITRO[a.categoria] || a.categoria}</div>
      <div class="actions">
        <button class="btn btn-sm btn-danger" onclick="excluirArbitroCbf('${a.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

async function salvarArbitroCbf() {
  const nome = document.getElementById("nomeArbitroCbf").value.trim();
  const categoria = document.getElementById("categoriaArbitroCbf").value;

  if (!nome) { notificar("Digite o nome do árbitro.", "aviso"); return; }

  const { error } = await supabaseClient.from("arbitros_cbf").insert([{ nome, categoria }]);
  if (error) { notificar(error.message, "erro"); return; }

  document.getElementById("nomeArbitroCbf").value = "";
  notificar("Árbitro adicionado!");
  await carregarArbitrosCbfAdmin();
}

async function excluirArbitroCbf(id) {
  if (!confirm("Excluir este árbitro da lista?")) return;
  const { error } = await supabaseClient.from("arbitros_cbf").delete().eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }
  await carregarArbitrosCbfAdmin();
}

// ---------- SORTEIO DA ARBITRAGEM DO JOGO ----------

function sortearNome(lista, excluir = []) {
  const disponiveis = lista.filter(a => !excluir.includes(a.nome));
  if (!disponiveis.length) return "";
  return disponiveis[Math.floor(Math.random() * disponiveis.length)].nome;
}

// Sorteia um nome por função, cada uma dentro da sua categoria (Central,
// Assistente, Vídeo). Dentro da categoria "assistente", garante que o 1º e o
// 2º assistente sejam pessoas diferentes.
function sortearQuartetoArbitragem() {
  const centrais = arbitrosCbfCache.filter(a => a.categoria === "central");
  const assistentes = arbitrosCbfCache.filter(a => a.categoria === "assistente");
  const videos = arbitrosCbfCache.filter(a => a.categoria === "video");

  const arbitro = sortearNome(centrais);
  const assistente_1 = sortearNome(assistentes);
  const assistente_2 = sortearNome(assistentes, [assistente_1]);
  const quarto_arbitro = sortearNome(videos);

  return { arbitro, assistente_1, assistente_2, quarto_arbitro };
}

// Sorteia o quarteto e grava (upsert) na tabela arbitragem_jogo, depois
// atualiza a exibição na sub-aba "Dados".
async function sortearESalvarArbitragem(jogoId) {
  if (!arbitrosCbfCache.length) {
    notificar("Cadastre árbitros CBF na aba \"Times\" antes de sortear.", "aviso");
    return;
  }

  const quarteto = sortearQuartetoArbitragem();

  const { error } = await supabaseClient
    .from("arbitragem_jogo")
    .upsert({ jogo_id: jogoId, ...quarteto }, { onConflict: "jogo_id" });

  if (error) {
    notificar("Jogo salvo, mas houve erro ao sortear a arbitragem: " + error.message, "erro");
    return;
  }

  exibirArbitragemSorteada(quarteto);
}

// Chamado pelo botão "Sortear novamente" na sub-aba Dados de um jogo já salvo.
async function resortearArbitragem() {
  const jogoId = document.getElementById("jogoId").value;
  if (!jogoId) {
    notificar("Salve o jogo primeiro para poder sortear a arbitragem.", "aviso");
    return;
  }
  await sortearESalvarArbitragem(jogoId);
  notificar("Arbitragem sorteada novamente!");
}

function exibirArbitragemSorteada(arbitragem) {
  const area = document.getElementById("arbitragemSorteada");
  if (!area) return;

  if (!arbitragem || (!arbitragem.arbitro && !arbitragem.assistente_1 && !arbitragem.assistente_2 && !arbitragem.quarto_arbitro)) {
    area.innerHTML = `<p class="text-dim" style="font-size:12.5px;">Ainda não sorteada — salve o jogo para sortear.</p>`;
    return;
  }

  const linhas = [
    ["Árbitro", arbitragem.arbitro],
    ["1º Assistente", arbitragem.assistente_1],
    ["2º Assistente", arbitragem.assistente_2],
    ["4º Árbitro", arbitragem.quarto_arbitro],
  ];

  area.innerHTML = linhas.map(([label, nome]) => `
    <div class="mc-arbitro-item">
      <span class="mc-arbitro-funcao">${label}</span>
      <span class="mc-arbitro-nome">${nome || "—"}</span>
    </div>
  `).join("");
}

// Busca a arbitragem já sorteada para este jogo (se houver) e exibe na
// sub-aba "Dados".
async function carregarArbitragemDoJogo(jogoId) {
  const { data, error } = await supabaseClient
    .from("arbitragem_jogo")
    .select("*")
    .eq("jogo_id", jogoId)
    .maybeSingle();

  if (error) return;

  // Só exibe se o usuário ainda estiver no mesmo jogo (evita corrida caso
  // ele troque de jogo rapidamente enquanto a consulta está em andamento).
  if (document.getElementById("jogoId").value !== jogoId) return;

  exibirArbitragemSorteada(data);
}

async function descomputarJogo(id) {
  if (!confirm("Descomputar esse jogo da tabela? Isso reverte os pontos e permite editar os eventos de novo.")) return;

  const { data: jogo, error } = await supabaseClient.from("jogos").select("*").eq("id", id).single();
  if (error) { notificar(error.message, "erro"); return; }

  if (jogo.computado !== true) {
    notificar("Esse jogo ainda não está computado.", "aviso");
    return;
  }

  const pc = jogo.placar_casa ?? 0;
  const pf = jogo.placar_fora ?? 0;

  const resultadoAjuste = await ajustarTabelaClassificacao(jogo, pc, pf, "subtrair");
  if (!resultadoAjuste.ok) {
    notificar("Erro ao ajustar a tabela: " + (resultadoAjuste.error?.message || "desconhecido"), "erro");
    return;
  }

  const resultadoEstatisticas = await desfazerEstatisticasEventosDoJogo(id);
  if (!resultadoEstatisticas.ok) {
    notificar("Erro ao desfazer gols/assistências/cartões: " + (resultadoEstatisticas.error?.message || "desconhecido"), "erro");
    return;
  }

  const { error: erroUpdate } = await supabaseClient.from("jogos").update({ computado: false, status: "Agendado" }).eq("id", id);
  if (erroUpdate) {
    notificar("Erro ao descomputar o jogo: " + erroUpdate.message, "erro");
    return;
  }

  notificar("Jogo descomputado! Os gols, assistências e cartões desse jogo também foram desfeitos. Você pode ajustar os eventos e o jogo encerra sozinho de novo ao chegar aos 90'.");
  await carregarJogosAdmin();
  await carregarTimesAdmin();
  await carregarJogadoresAdmin();
}

async function encerrarJogoManualmente(id) {
  const { data: jogo, error } = await supabaseClient.from("jogos").select("*").eq("id", id).single();
  if (error) { notificar(error.message, "erro"); return; }

  if (jogo.computado === true) {
    notificar("Esse jogo já está computado.", "aviso");
    return;
  }

  if (!confirm("Encerrar esse jogo agora? O placar será calculado pelos eventos de Gol/Gol Contra e computado na tabela.")) return;

  const { pc, pf } = await calcularPlacarPorEventosCompartilhado(jogo);

  const resultadoAjuste = await ajustarTabelaClassificacao(jogo, pc, pf, "somar");
  if (!resultadoAjuste.ok) {
    notificar("Erro ao ajustar a tabela: " + (resultadoAjuste.error?.message || "desconhecido"), "erro");
    return;
  }

  const resultadoEstatisticas = await reaplicarEstatisticasEventosDoJogo(id);
  if (!resultadoEstatisticas.ok) {
    notificar("Erro ao aplicar gols/assistências/cartões: " + (resultadoEstatisticas.error?.message || "desconhecido"), "erro");
    return;
  }

  const { error: erroUpdate } = await supabaseClient
    .from("jogos")
    .update({ computado: true, status: "Encerrado", placar_casa: pc, placar_fora: pf })
    .eq("id", id);

  if (erroUpdate) {
    notificar("Erro ao encerrar o jogo: " + erroUpdate.message, "erro");
    return;
  }

  notificar(`Jogo encerrado! Placar: ${pc} x ${pf}`);
  await carregarJogosAdmin();
  await carregarTimesAdmin();
  await carregarJogadoresAdmin();
}

function descomputarJogoAtual() {
  const id = document.getElementById("jogoId").value;
  if (!id) { notificar("Escolha um jogo primeiro.", "aviso"); return; }
  descomputarJogo(id);
}

async function excluirJogo(id) {
  const { data: jogo, error } = await supabaseClient.from("jogos").select("*").eq("id", id).single();
  if (error) { notificar(error.message, "erro"); return; }

  if (jogo.computado === true) {
    notificar("Descompute o jogo antes de excluir.", "aviso");
    return;
  }

  if (!confirm("Excluir esse jogo definitivamente?")) return;

  const delGols = await supabaseClient.from("gols_jogo").delete().eq("jogo_id", id);
  if (delGols.error) console.error("Erro ao excluir gols_jogo:", delGols.error);

  const delEventos = await supabaseClient.from("eventos_jogo").delete().eq("jogo_id", id);
  if (delEventos.error) console.error("Erro ao excluir eventos_jogo:", delEventos.error);

  const delEscalacoes = await supabaseClient.from("escalacoes_tecnico").delete().eq("jogo_id", id);
  if (delEscalacoes.error) console.error("Erro ao excluir escalacoes_tecnico:", delEscalacoes.error);

  const del = await supabaseClient.from("jogos").delete().eq("id", id);
  if (del.error) { notificar(del.error.message, "erro"); return; }

  notificar("Jogo excluído!");
  if (document.getElementById("jogoId").value === id) fecharPainelJogo();
  await carregarJogosAdmin();
}

async function carregarJogosAdmin() {
  const { data, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .eq("temporada_id", temporadaAtiva.id)
    .order("rodada", { ascending: true });

  if (error) { notificar(error.message, "erro"); return; }

  jogosCache = data || [];
  renderizarListaJogosAdmin();
}

function renderizarListaJogosAdmin() {
  const lista = document.getElementById("listaJogosAdmin");
  if (!lista) return;

  if (jogosCache.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum jogo cadastrado ainda.</p>`;
    return;
  }

  lista.innerHTML = jogosCache.map(j => {
    const minuto = minutoAtualDoJogo(j);
    const passouDe90 = j.computado !== true && minuto !== null && minuto >= MINUTOS_JOGO;

    return `
    <div class="admin-item">
      <div class="title">${j.rodada}ª — ${j.time_casa?.nome || "?"} ${j.placar_casa ?? "-"} x ${j.placar_fora ?? "-"} ${j.time_fora?.nome || "?"}</div>
      <div class="meta">${j.local || ""} · ${j.status} · Computado: ${j.computado ? "Sim" : "Não"}${passouDe90 ? " · ⏱️ já passou dos 90', pronto para encerrar" : ""}</div>
      <div class="actions">
        <button class="btn btn-sm btn-secondary" onclick='editarJogo(${JSON.stringify(j)})'>Editar</button>
        ${j.computado === true
          ? `<button class="btn btn-sm btn-warning" onclick="descomputarJogo('${j.id}')">Descomputar</button>`
          : `<button class="btn btn-sm btn-primary" onclick="encerrarJogoManualmente('${j.id}')">Encerrar jogo</button>`}
        <button class="btn btn-sm btn-danger" onclick="excluirJogo('${j.id}')">Excluir</button>
      </div>
    </div>
  `;
  }).join("");
}

function editarJogo(j) {
  document.getElementById("jogoId").value = j.id;
  document.getElementById("timeCasa").value = j.time_casa_id;
  document.getElementById("timeFora").value = j.time_fora_id;
  document.getElementById("rodada").value = j.rodada || "";

  // Campo único de data/hora: prioriza hora_inicio_simulacao (já é datetime
  // completo); se um jogo antigo só tiver data_jogo/hora_jogo separados,
  // monta o valor a partir deles pra não aparecer em branco.
  let valorDataHora = "";
  if (j.hora_inicio_simulacao) {
    valorDataHora = j.hora_inicio_simulacao.slice(0, 16);
  } else if (j.data_jogo) {
    valorDataHora = `${j.data_jogo}T${(j.hora_jogo || "00:00").slice(0, 5)}`;
  }
  document.getElementById("hora_inicio_simulacao").value = valorDataHora;

  exibirArbitragemSorteada(null);
  carregarArbitragemDoJogo(j.id);

  abrirPainelJogo(`${j.time_casa?.nome || "?"} x ${j.time_fora?.nome || "?"} — ${j.rodada}ª rodada`);
  atualizarTimesEscalacaoEvento();
}

function limparFormularioJogo() {
  document.getElementById("jogoId").value = "";
  document.getElementById("rodada").value = "";
  document.getElementById("hora_inicio_simulacao").value = "";
  document.getElementById("listaEventosJogo").innerHTML = "";
  exibirArbitragemSorteada(null);
}

function jogoAtualDoPainel() {
  const jogoId = document.getElementById("jogoId").value;
  return jogosCache.find(j => j.id === jogoId) || null;
}

function preencherSelectsTimeDoJogo(jogo, selectTimeId) {
  const select = document.getElementById(selectTimeId);
  if (!jogo) { select.innerHTML = ""; return; }
  select.innerHTML = `
    <option value="${jogo.time_casa_id}">${jogo.time_casa?.nome || "Casa"}</option>
    <option value="${jogo.time_fora_id}">${jogo.time_fora?.nome || "Fora"}</option>
  `;
}

function atualizarTimesEscalacaoEvento() {
  const jogo = jogoAtualDoPainel();
  preencherSelectsTimeDoJogo(jogo, "timeEvento");
  carregarJogadoresDoTimeEvento();
  carregarEventosDoJogo();
  ajustarCamposEvento();
}

async function carregarJogadoresDoTimeEvento() {
  const timeId = document.getElementById("timeEvento").value;
  const select = document.getElementById("jogadorEvento");
  const selectSecundario = document.getElementById("jogadorSecundarioEvento");
  if (!timeId) { select.innerHTML = ""; selectSecundario.innerHTML = `<option value="">Nenhuma</option>`; return; }

  const { data, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .eq("time_id", timeId)
    .order("nome", { ascending: true });

  if (error) return;

  const opcoes = (data || [])
    .map(j => `<option value="${j.id}" data-nome="${j.nome}">${j.nome}</option>`).join("");

  select.innerHTML = opcoes + `<option value="__novo__">➕ Novo jogador</option>`;
  selectSecundario.innerHTML = `<option value="">Nenhuma</option>${opcoes}<option value="__novo__">➕ Novo jogador</option>`;
}

// Detecta quando a pessoa escolhe "➕ Novo jogador" no meio da lista, pede
// só o nome, cadastra rapidinho no time selecionado (sem sair da aba
// Eventos) e já deixa o jogador recém-criado selecionado no lugar.
async function checarNovoJogadorEvento(selectEl) {
  if (selectEl.value !== "__novo__") return;

  const timeId = document.getElementById("timeEvento").value;
  if (!timeId) {
    notificar("Escolha o time primeiro.", "aviso");
    selectEl.value = "";
    return;
  }

  const nome = prompt("Nome do novo jogador:");
  if (!nome || !nome.trim()) {
    selectEl.value = "";
    return;
  }

  const { data, error } = await supabaseClient
    .from("jogadores")
    .insert([{ nome: nome.trim(), time_id: timeId, gols: 0, assistencias: 0, cartoes_amarelos: 0, cartoes_vermelhos: 0, regularizado: true }])
    .select()
    .single();

  if (error) { notificar(error.message, "erro"); selectEl.value = ""; return; }

  notificar("Jogador cadastrado!");
  await carregarJogadoresAdmin();
  await carregarJogadoresDoTimeEvento();
  selectEl.value = data.id;
}

// Troca o tipo de evento selecionado via chip (visual tipo Sofascore),
// atualizando o estado visual dos botões e o hidden input real.
function selecionarTipoEvento(tipo, btn) {
  document.getElementById("tipoEvento").value = tipo;
  document.querySelectorAll("#chipsTipoEvento .chip-evento").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  ajustarCamposEvento();
}

// O campo "jogador secundário" muda de função conforme o tipo de evento:
// - Gol: quem deu a assistência (opcional)
// - Substituição: quem entra em campo (o campo principal vira "quem sai")
// - Pênalti Marcado / Cartões / Pênalti Perdido / Gol Contra: não se
//   aplica (pênalti não tem assistência), fica desabilitado
function ajustarCamposEvento() {
  const tipo = document.getElementById("tipoEvento").value;
  const campoSecundario = document.getElementById("jogadorSecundarioEvento").closest(".field");
  const labelPrincipal = document.getElementById("labelJogadorPrincipal");
  const labelSecundario = document.getElementById("labelJogadorSecundario");

  if (tipo === "Gol") {
    labelPrincipal.textContent = "Quem fez o gol";
    labelSecundario.textContent = "Assistência (opcional)";
    campoSecundario.classList.remove("hidden");
  } else if (tipo === "Substituição") {
    labelPrincipal.textContent = "Quem sai";
    labelSecundario.textContent = "Quem entra";
    campoSecundario.classList.remove("hidden");
  } else {
    labelPrincipal.textContent = tipo === "Gol Contra" ? "Quem fez o gol contra" : tipo === "Pênalti Marcado" ? "Quem fez o gol" : "Jogador";
    campoSecundario.classList.add("hidden");
    document.getElementById("jogadorSecundarioEvento").value = "";
  }
}

async function salvarEvento() {
  const jogoId = document.getElementById("jogoId").value;
  const timeId = document.getElementById("timeEvento").value;
  const jogadorSelect = document.getElementById("jogadorEvento");
  const jogadorId = jogadorSelect.value || null;
  const jogadorNome = jogadorSelect.selectedOptions[0]?.dataset.nome || "";
  const jogadorSecSelect = document.getElementById("jogadorSecundarioEvento");
  const jogadorSecundarioId = jogadorSecSelect.value || null;
  const jogadorSecundarioNome = jogadorSecSelect.selectedOptions[0]?.dataset.nome || "";
  const minuto = document.getElementById("minutoEvento").value;
  const tipo = document.getElementById("tipoEvento").value;

  if (!jogoId) { notificar("Salve o jogo na aba Dados primeiro.", "aviso"); return; }
  if (minuto === "") { notificar("Informe o minuto do evento.", "aviso"); return; }

  const evento = {
    jogo_id: jogoId,
    time_id: timeId || null,
    jogador_id: jogadorId,
    jogador_nome: jogadorNome,
    jogador_secundario_id: jogadorSecundarioId,
    jogador_secundario_nome: jogadorSecundarioNome || null,
    tipo,
    minuto: Number(minuto),
  };

  const { error } = await supabaseClient.from("eventos_jogo").insert([evento]);
  if (error) { notificar(error.message, "erro"); return; }

  // gols contam para o artilheiro, igual ao comportamento anterior
  if ((tipo === "Gol" || tipo === "Pênalti Marcado") && jogadorId) {
    const jogador = jogadoresCache.find(j => j.id === jogadorId);
    if (jogador) {
      await supabaseClient.from("jogadores").update({ gols: (jogador.gols || 0) + 1 }).eq("id", jogadorId);
    }
  }

  // assistência (só faz sentido em Gol — pênalti não tem assistência) conta para o jogador que a deu
  if (tipo === "Gol" && jogadorSecundarioId) {
    const jogadorAssist = jogadoresCache.find(j => j.id === jogadorSecundarioId);
    if (jogadorAssist) {
      await supabaseClient.from("jogadores").update({ assistencias: (jogadorAssist.assistencias || 0) + 1 }).eq("id", jogadorSecundarioId);
    }
  }

  // cartões contam automaticamente pro jogador que recebeu
  if (tipo === "Cartão Amarelo" && jogadorId) {
    const jogador = jogadoresCache.find(j => j.id === jogadorId);
    if (jogador) {
      await supabaseClient.from("jogadores").update({ cartoes_amarelos: (jogador.cartoes_amarelos || 0) + 1 }).eq("id", jogadorId);
    }
  }
  if (tipo === "Cartão Vermelho" && jogadorId) {
    const jogador = jogadoresCache.find(j => j.id === jogadorId);
    if (jogador) {
      await supabaseClient.from("jogadores").update({ cartoes_vermelhos: (jogador.cartoes_vermelhos || 0) + 1 }).eq("id", jogadorId);
    }
  }

  if (jogadorId || jogadorSecundarioId) {
    await carregarJogadoresAdmin();
  }

  document.getElementById("minutoEvento").value = "0";
  document.getElementById("jogadorSecundarioEvento").value = "";
  selecionarTipoEvento("Gol", document.querySelector('#chipsTipoEvento [data-tipo="Gol"]'));
  notificar("Evento adicionado!");
  carregarEventosDoJogo();
}

async function carregarEventosDoJogo() {
  const jogoId = document.getElementById("jogoId").value;
  const area = document.getElementById("listaEventosJogo");
  if (!jogoId) { area.innerHTML = ""; return; }

  const jogo = jogoAtualDoPainel();

  const { data, error } = await supabaseClient
    .from("eventos_jogo")
    .select("*")
    .eq("jogo_id", jogoId)
    .order("minuto", { ascending: true });

  if (error) return;

  if (!data || !data.length) {
    area.innerHTML = `<div class="mc-timeline-vazio">Nenhum evento lançado ainda.</div>`;
    return;
  }

  const icones = {
    "Gol": "⚽", "Gol Contra": "⚽", "Pênalti Marcado": "🥅", "Pênalti Perdido": "❌",
    "Cartão Amarelo": "🟨", "Cartão Vermelho": "🟥", "Substituição": "🔄",
  };

  area.innerHTML = data.map(e => {
    const icone = icones[e.tipo] || "📝";
    let legenda = "";
    if (e.tipo === "Substituição" && e.jogador_secundario_nome) {
      legenda = `Entra: ${e.jogador_secundario_nome}`;
    } else if (e.tipo === "Gol" && e.jogador_secundario_nome) {
      legenda = `Assistência: ${e.jogador_secundario_nome}`;
    }

    const doTimeCasa = jogo && e.time_id === jogo.time_casa_id;
    const conteudo = `
      <span class="icone">${icone}</span>
      <span>
        <span class="nome">${e.jogador_nome || "—"}</span>
        ${legenda ? `<span class="desc">${legenda}</span>` : `<span class="desc">${e.tipo}</span>`}
      </span>
    `;

    return `
      <div class="mc-timeline-item">
        <div class="mc-timeline-lado ${doTimeCasa ? "" : "mc-timeline-empty"}">${doTimeCasa ? conteudo : ""}</div>
        <div class="mc-timeline-minuto">${e.minuto}'</div>
        <div class="mc-timeline-lado direita ${doTimeCasa ? "mc-timeline-empty" : ""}">${doTimeCasa ? "" : conteudo}</div>
        <button class="mc-timeline-excluir" onclick="excluirEvento('${e.id}')" title="Excluir evento">✕</button>
      </div>
    `;
  }).join("");
}

async function excluirEvento(id) {
  if (!confirm("Excluir esse evento?")) return;

  // Busca o evento antes de apagar, pra saber o que desfazer nas
  // estatísticas do jogador (gol, assistência ou cartão).
  const { data: evento } = await supabaseClient.from("eventos_jogo").select("*").eq("id", id).single();

  const { error } = await supabaseClient.from("eventos_jogo").delete().eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }

  if (evento) {
    if ((evento.tipo === "Gol" || evento.tipo === "Pênalti Marcado") && evento.jogador_id) {
      const jogador = jogadoresCache.find(j => j.id === evento.jogador_id);
      if (jogador) await supabaseClient.from("jogadores").update({ gols: Math.max((jogador.gols || 0) - 1, 0) }).eq("id", evento.jogador_id);
    }
    if (evento.tipo === "Gol" && evento.jogador_secundario_id) {
      const jogadorAssist = jogadoresCache.find(j => j.id === evento.jogador_secundario_id);
      if (jogadorAssist) await supabaseClient.from("jogadores").update({ assistencias: Math.max((jogadorAssist.assistencias || 0) - 1, 0) }).eq("id", evento.jogador_secundario_id);
    }
    if (evento.tipo === "Cartão Amarelo" && evento.jogador_id) {
      const jogador = jogadoresCache.find(j => j.id === evento.jogador_id);
      if (jogador) await supabaseClient.from("jogadores").update({ cartoes_amarelos: Math.max((jogador.cartoes_amarelos || 0) - 1, 0) }).eq("id", evento.jogador_id);
    }
    if (evento.tipo === "Cartão Vermelho" && evento.jogador_id) {
      const jogador = jogadoresCache.find(j => j.id === evento.jogador_id);
      if (jogador) await supabaseClient.from("jogadores").update({ cartoes_vermelhos: Math.max((jogador.cartoes_vermelhos || 0) - 1, 0) }).eq("id", evento.jogador_id);
    }
    await carregarJogadoresAdmin();
  }

  notificar("Evento excluído!");
  carregarEventosDoJogo();
}

// ================= JOGADORES =================

async function carregarJogadoresAdmin() {
  const idsTimes = timesCache.map(t => t.id);
  if (idsTimes.length === 0) { jogadoresCache = []; renderizarListaJogadoresAdmin(); return; }

  const { data, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .in("time_id", idsTimes)
    .order("nome", { ascending: true });

  if (error) { notificar(error.message, "erro"); return; }

  jogadoresCache = data || [];
  renderizarListaJogadoresAdmin();
}

function renderizarListaJogadoresAdmin() {
  const lista = document.getElementById("listaJogadoresAdmin");
  if (!lista) return;

  const filtroTimeId = document.getElementById("filtroTimeJogadores")?.value || "";

  if (!filtroTimeId) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Escolha um time acima para ver os jogadores cadastrados.</p>`;
    return;
  }

  if (jogadoresCache.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum jogador cadastrado ainda.</p>`;
    return;
  }

  const itemHtml = (j) => `
    <div class="admin-item">
      <div class="title">${j.nome}</div>
      <div class="meta">${j.posicao || ""} · Nº ${j.numero ?? "-"} · ${j.gols || 0} gols · ${j.assistencias || 0} assist. · 🟨${j.cartoes_amarelos || 0} 🟥${j.cartoes_vermelhos || 0}</div>
      <div class="actions">
        <button class="btn btn-sm btn-secondary" onclick='editarJogador(${JSON.stringify(j)})'>Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirJogador('${j.id}')">Excluir</button>
      </div>
    </div>
  `;

  const jogadoresDoTime = jogadoresCache.filter(j => String(j.time_id) === String(filtroTimeId));
  if (jogadoresDoTime.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum jogador cadastrado nesse time ainda.</p>`;
    return;
  }
  lista.innerHTML = jogadoresDoTime.map(itemHtml).join("");
}

function editarJogador(j) {
  document.querySelector('[onclick*="abaJogadores"]')?.click();

  document.getElementById("jogadorId").value = j.id;
  document.getElementById("nomeJogador").value = j.nome || "";
  document.getElementById("timeJogador").value = j.time_id || "";
  document.getElementById("posicaoJogador").value = j.posicao || "";
  document.getElementById("numeroJogador").value = j.numero ?? "";
  document.getElementById("regularizadoJogador").checked = j.regularizado !== false;

  document.getElementById("formJogadorWrap").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function abrirFormularioNovoJogador() {
  limparFormularioJogador();
  document.getElementById("formJogadorWrap").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fecharFormularioJogador() {
  limparFormularioJogador();
  document.getElementById("formJogadorWrap").hidden = true;
}

function limparFormularioJogador() {
  document.getElementById("jogadorId").value = "";
  document.getElementById("nomeJogador").value = "";
  document.getElementById("posicaoJogador").value = "";
  document.getElementById("numeroJogador").value = "";
  document.getElementById("regularizadoJogador").checked = true;
}

async function salvarJogador() {
  const id = document.getElementById("jogadorId").value;

  const jogador = {
    nome: document.getElementById("nomeJogador").value.trim(),
    time_id: document.getElementById("timeJogador").value,
    posicao: document.getElementById("posicaoJogador").value.trim(),
    numero: Number(document.getElementById("numeroJogador").value || 0),
    regularizado: document.getElementById("regularizadoJogador").checked,
  };

  if (!jogador.nome || !jogador.time_id) {
    notificar("Informe nome e time do jogador.", "aviso");
    return;
  }

  let error;
  if (id) {
    ({ error } = await supabaseClient.from("jogadores").update(jogador).eq("id", id));
  } else {
    // jogador novo começa zerado nas estatísticas (colunas continuam
    // existindo na tabela, só não são mais preenchidas manualmente aqui)
    ({ error } = await supabaseClient.from("jogadores").insert([{
      ...jogador,
      gols: 0,
      assistencias: 0,
      cartoes_amarelos: 0,
      cartoes_vermelhos: 0,
    }]));
  }

  if (error) { notificar(error.message, "erro"); return; }

  notificar("Jogador salvo!");
  fecharFormularioJogador();
  await carregarJogadoresAdmin();
}

async function excluirJogador(id) {
  if (!confirm("Excluir esse jogador?")) return;

  const { error } = await supabaseClient.from("jogadores").delete().eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }

  notificar("Jogador excluído!");
  await carregarJogadoresAdmin();
}

// ================= NOTÍCIAS =================

let noticiasCache = [];

async function carregarNoticiasAdmin() {
  const { data, error } = await supabaseClient
    .from("noticias")
    .select("*")
    .order("publicado_em", { ascending: false });

  if (error) { notificar(error.message, "erro"); return; }

  noticiasCache = data || [];
  renderizarListaNoticiasAdmin();
}

function renderizarListaNoticiasAdmin() {
  const lista = document.getElementById("listaNoticiasAdmin");
  if (!lista) return;

  if (noticiasCache.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhuma notícia publicada ainda.</p>`;
    return;
  }

  lista.innerHTML = noticiasCache.map(n => `
    <div class="admin-item">
      <div class="title">${n.titulo}</div>
      <div class="meta">${new Date(n.publicado_em).toLocaleDateString("pt-BR")}</div>
      <div class="actions">
        <button class="btn btn-sm btn-secondary" onclick='editarNoticia(${JSON.stringify(n)})'>Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirNoticia('${n.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

function editarNoticia(n) {
  document.querySelector('[onclick*="abaNoticias"]')?.click();

  document.getElementById("noticiaId").value = n.id;
  document.getElementById("tituloNoticia").value = n.titulo || "";
  document.getElementById("resumoNoticia").value = n.resumo || "";
  document.getElementById("imagemNoticia").value = n.imagem_url || "";
  document.getElementById("conteudoNoticia").value = n.conteudo || "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function limparFormularioNoticia() {
  document.getElementById("noticiaId").value = "";
  document.getElementById("tituloNoticia").value = "";
  document.getElementById("resumoNoticia").value = "";
  document.getElementById("imagemNoticia").value = "";
  document.getElementById("conteudoNoticia").value = "";
}

async function salvarNoticia() {
  const id = document.getElementById("noticiaId").value;

  const noticia = {
    temporada_id: temporadaAtiva.id,
    titulo: document.getElementById("tituloNoticia").value.trim(),
    resumo: document.getElementById("resumoNoticia").value.trim(),
    imagem_url: document.getElementById("imagemNoticia").value.trim(),
    conteudo: document.getElementById("conteudoNoticia").value.trim(),
  };

  if (!noticia.titulo) { notificar("Informe o título da notícia.", "aviso"); return; }

  let error;
  if (id) {
    ({ error } = await supabaseClient.from("noticias").update(noticia).eq("id", id));
  } else {
    ({ error } = await supabaseClient.from("noticias").insert([noticia]));
  }

  if (error) { notificar(error.message, "erro"); return; }

  notificar("Notícia publicada!");
  limparFormularioNoticia();
  await carregarNoticiasAdmin();
}

async function excluirNoticia(id) {
  if (!confirm("Excluir essa notícia?")) return;

  const { error } = await supabaseClient.from("noticias").delete().eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }

  notificar("Notícia excluída!");
  await carregarNoticiasAdmin();
}

// ---------- START ----------
checarAcessoAdmin();
