// =========================================================
// MEU TIME — área exclusiva do técnico
// =========================================================

let meuTimeId = null;
let meuTimeDados = null;
let elencoDoTime = [];
let jogoParaEscalar = null;
let escalacaoAtual = {}; // { slotId: jogador }
let formacaoAtual = "4-3-3";

// ---------------------------------------------------------
// Coordenadas (em % do campo) de cada posição, por formação.
// y=0 é o fundo do próprio gol (goleiro), y=100 é o ataque.
// ---------------------------------------------------------
const FORMACOES = {
  "4-3-3": [
    { id: "GOL", x: 50, y: 8, tipo: "GOL" },
    { id: "LAT-E", x: 15, y: 25, tipo: "DEF" },
    { id: "ZAG-1", x: 37, y: 20, tipo: "DEF" },
    { id: "ZAG-2", x: 63, y: 20, tipo: "DEF" },
    { id: "LAT-D", x: 85, y: 25, tipo: "DEF" },
    { id: "VOL", x: 50, y: 42, tipo: "MEI" },
    { id: "MEI-E", x: 25, y: 55, tipo: "MEI" },
    { id: "MEI-D", x: 75, y: 55, tipo: "MEI" },
    { id: "PE-E", x: 15, y: 78, tipo: "ATA" },
    { id: "ATA", x: 50, y: 85, tipo: "ATA" },
    { id: "PE-D", x: 85, y: 78, tipo: "ATA" },
  ],
  "4-4-2": [
    { id: "GOL", x: 50, y: 8, tipo: "GOL" },
    { id: "LAT-E", x: 15, y: 25, tipo: "DEF" },
    { id: "ZAG-1", x: 37, y: 20, tipo: "DEF" },
    { id: "ZAG-2", x: 63, y: 20, tipo: "DEF" },
    { id: "LAT-D", x: 85, y: 25, tipo: "DEF" },
    { id: "MEI-E", x: 15, y: 50, tipo: "MEI" },
    { id: "VOL-1", x: 38, y: 45, tipo: "MEI" },
    { id: "VOL-2", x: 62, y: 45, tipo: "MEI" },
    { id: "MEI-D", x: 85, y: 50, tipo: "MEI" },
    { id: "ATA-1", x: 35, y: 82, tipo: "ATA" },
    { id: "ATA-2", x: 65, y: 82, tipo: "ATA" },
  ],
  "3-5-2": [
    { id: "GOL", x: 50, y: 8, tipo: "GOL" },
    { id: "ZAG-1", x: 25, y: 20, tipo: "DEF" },
    { id: "ZAG-2", x: 50, y: 16, tipo: "DEF" },
    { id: "ZAG-3", x: 75, y: 20, tipo: "DEF" },
    { id: "ALA-E", x: 10, y: 42, tipo: "MEI" },
    { id: "VOL-1", x: 38, y: 45, tipo: "MEI" },
    { id: "VOL-2", x: 62, y: 45, tipo: "MEI" },
    { id: "ALA-D", x: 90, y: 42, tipo: "MEI" },
    { id: "MEI-OF", x: 50, y: 60, tipo: "MEI" },
    { id: "ATA-1", x: 35, y: 82, tipo: "ATA" },
    { id: "ATA-2", x: 65, y: 82, tipo: "ATA" },
  ],
  "4-2-3-1": [
    { id: "GOL", x: 50, y: 8, tipo: "GOL" },
    { id: "LAT-E", x: 15, y: 25, tipo: "DEF" },
    { id: "ZAG-1", x: 37, y: 20, tipo: "DEF" },
    { id: "ZAG-2", x: 63, y: 20, tipo: "DEF" },
    { id: "LAT-D", x: 85, y: 25, tipo: "DEF" },
    { id: "VOL-1", x: 38, y: 42, tipo: "MEI" },
    { id: "VOL-2", x: 62, y: 42, tipo: "MEI" },
    { id: "MEIA-E", x: 20, y: 62, tipo: "MEI" },
    { id: "MEIA-C", x: 50, y: 65, tipo: "MEI" },
    { id: "MEIA-D", x: 80, y: 62, tipo: "MEI" },
    { id: "ATA", x: 50, y: 85, tipo: "ATA" },
  ],
  "3-4-3": [
    { id: "GOL", x: 50, y: 8, tipo: "GOL" },
    { id: "ZAG-1", x: 25, y: 20, tipo: "DEF" },
    { id: "ZAG-2", x: 50, y: 16, tipo: "DEF" },
    { id: "ZAG-3", x: 75, y: 20, tipo: "DEF" },
    { id: "ALA-E", x: 12, y: 48, tipo: "MEI" },
    { id: "VOL-1", x: 40, y: 45, tipo: "MEI" },
    { id: "VOL-2", x: 60, y: 45, tipo: "MEI" },
    { id: "ALA-D", x: 88, y: 48, tipo: "MEI" },
    { id: "PE-E", x: 20, y: 80, tipo: "ATA" },
    { id: "ATA", x: 50, y: 85, tipo: "ATA" },
    { id: "PE-D", x: 80, y: 80, tipo: "ATA" },
  ],
  "5-3-2": [
    { id: "GOL", x: 50, y: 8, tipo: "GOL" },
    { id: "LAT-E", x: 10, y: 28, tipo: "DEF" },
    { id: "ZAG-1", x: 30, y: 18, tipo: "DEF" },
    { id: "ZAG-2", x: 50, y: 15, tipo: "DEF" },
    { id: "ZAG-3", x: 70, y: 18, tipo: "DEF" },
    { id: "LAT-D", x: 90, y: 28, tipo: "DEF" },
    { id: "VOL-1", x: 35, y: 48, tipo: "MEI" },
    { id: "VOL-2", x: 65, y: 48, tipo: "MEI" },
    { id: "MEI-OF", x: 50, y: 62, tipo: "MEI" },
    { id: "ATA-1", x: 35, y: 82, tipo: "ATA" },
    { id: "ATA-2", x: 65, y: 82, tipo: "ATA" },
  ],
};

// ---------------------------------------------------------
// LOGIN
// ---------------------------------------------------------

async function fazerLoginTecnico() {
  const email = document.getElementById("loginEmailTecnico").value.trim();
  const senha = document.getElementById("loginSenhaTecnico").value;

  if (!email || !senha) {
    notificar("Preencha e-mail e senha.", "aviso");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });

  if (error) {
    notificar("Erro no login: " + error.message, "erro");
    return;
  }

  await checarAcessoTecnico();
}

async function sairTecnico() {
  await supabaseClient.auth.signOut();
  document.body.classList.remove("tema-time");
  document.documentElement.style.removeProperty("--tema-primaria");
  document.documentElement.style.removeProperty("--tema-secundaria");
  mostrarGateTecnico();
}

async function checarAcessoTecnico() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    mostrarGateTecnico();
    return;
  }

  const { data: vinculo, error } = await supabaseClient
    .from("tecnicos")
    .select("*, times(*)")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !vinculo) {
    notificar("Sua conta não está vinculada a nenhum time como técnico.", "erro");
    await supabaseClient.auth.signOut();
    mostrarGateTecnico();
    return;
  }

  meuTimeId = vinculo.time_id;
  meuTimeDados = vinculo.times;

  mostrarConteudoTecnico();
  await iniciarMeuTime();
}

function mostrarGateTecnico() {
  document.getElementById("gateLoginTecnico").classList.remove("hidden");
  document.getElementById("conteudoMeuTime").classList.add("hidden");
}

function mostrarConteudoTecnico() {
  document.getElementById("gateLoginTecnico").classList.add("hidden");
  document.getElementById("conteudoMeuTime").classList.remove("hidden");
}

// ---------------------------------------------------------
// CARREGAMENTO GERAL
// ---------------------------------------------------------

async function iniciarMeuTime() {
  if (typeof aplicarTemaTime === "function") {
    aplicarTemaTime(meuTimeDados?.nome);
    document.body.classList.add("tema-time");
  }

  renderizarCabecalhoTopo();
  renderizarCabecalho();
  renderizarStats();
  await carregarElenco();
  await verificarJogoParaEscalar();
  await verificarEcarregarBid();
  await carregarCalendarioTime();
  await atualizarBolinhaEmail();
}

function renderizarCabecalhoTopo() {
  const t = meuTimeDados;
  const marcaEl = document.getElementById("escudoTopoMeuTime");
  const nomeEl = document.getElementById("nomeTopoMeuTime");
  if (marcaEl) marcaEl.textContent = (t.nome || "?").slice(0, 1).toUpperCase();
  if (nomeEl) nomeEl.textContent = t.nome || "Meu Time";
}

// ---------------------------------------------------------
// NAVEGAÇÃO ENTRE SEÇÕES (bottom-nav próprio do técnico)
// ---------------------------------------------------------

function abrirSecaoMeuTime(nome, link) {
  const secoes = ["Inicio", "Escalacao", "Calendario", "Bid", "Email"];

  secoes.forEach(s => {
    document.getElementById(`secao${s}MeuTime`)?.classList.add("hidden");
  });
  document.getElementById(`secao${nome}MeuTime`)?.classList.remove("hidden");

  document.querySelectorAll("#navMeuTime a").forEach(a => a.classList.remove("active"));
  if (link) link.classList.add("active");

  if (nome === "Email") carregarEmailMeuTime();

  window.scrollTo({ top: 0, behavior: "instant" });
  return false; // impede o href="#" de rolar a página
}

function renderizarCabecalho() {
  const area = document.getElementById("cabecalhoMeuTime");
  const t = meuTimeDados;

  area.innerHTML = `
    <div class="card cabecalho-time-tema" style="display:flex;align-items:center;gap:16px;">
      ${escudoHtml(t, "escudo").replace('class="escudo"', 'class="escudo" style="width:60px;height:60px;"')}
      <div>
        <h1 style="font-family:var(--font-display);font-size:24px;margin:0 0 2px;">${t.nome}</h1>
        <p class="text-dim" style="margin:0;font-size:13px;">Área do técnico</p>
      </div>
    </div>
  `;
}

function renderizarStats() {
  const t = meuTimeDados;
  document.getElementById("statsGridMeuTime").innerHTML = `
    <div class="stat-card"><div class="num">${t.pontos}</div><div class="label">Pontos</div></div>
    <div class="stat-card"><div class="num">${t.jogos}</div><div class="label">Jogos</div></div>
    <div class="stat-card"><div class="num">${t.vitorias}</div><div class="label">Vitórias</div></div>
    <div class="stat-card"><div class="num">${t.saldo}</div><div class="label">Saldo</div></div>
  `;
}

async function carregarElenco() {
  const { data, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .eq("time_id", meuTimeId)
    .order("numero", { ascending: true });

  if (error) { notificar(error.message, "erro"); return; }

  elencoDoTime = data || [];

  const lista = document.getElementById("listaElencoMeuTime");
  if (elencoDoTime.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">👤</div><h3>Nenhum jogador cadastrado</h3></div>`;
    return;
  }

  lista.innerHTML = elencoDoTime.map(j => `
    <div class="time-item">
      <div class="escudo-placeholder">${j.numero ?? "-"}</div>
      <div class="info">
        <h3>${j.nome} ${j.regularizado === false ? '<span class="jogador-irregular">· Irregular (BID)</span>' : ""}</h3>
        <p>${j.posicao || "—"} · ${j.gols} gols · ${j.assistencias} assist.</p>
      </div>
    </div>
  `).join("");
}

// ---------------------------------------------------------
// VERIFICA SE HÁ JOGO DENTRO DO PRAZO PARA ESCALAR
// ---------------------------------------------------------

let __proximoJogoTimerId = null;

async function verificarJogoParaEscalar() {
  const bloco = document.getElementById("blocoEscalacao");
  const semJogo = document.getElementById("semJogoParaEscalar");
  const contagem = document.getElementById("contagemProximoJogo");

  // Limpa qualquer timer de contagem regressiva anterior
  if (__proximoJogoTimerId) {
    clearInterval(__proximoJogoTimerId);
    __proximoJogoTimerId = null;
  }

  const { data: config } = await supabaseClient
    .from("configuracoes_gerais")
    .select("valor")
    .eq("chave", "prazo_escalacao_horas_antes")
    .maybeSingle();

  const horasAntes = Number(config?.valor || 2);

  const { data: jogos, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(nome), time_fora:time_fora_id(nome)")
    .or(`time_casa_id.eq.${meuTimeId},time_fora_id.eq.${meuTimeId}`)
    .eq("status", "Agendado")
    .order("data_jogo", { ascending: true })
    .limit(5);

  // Caso 1: não há jogo nenhum agendado para o time
  if (error || !jogos || jogos.length === 0) {
    bloco.classList.add("hidden");
    contagem.classList.add("hidden");
    semJogo.classList.remove("hidden");
    return;
  }

  const agora = new Date();

  // Acha o próximo jogo futuro (independente de estar dentro do prazo ou não)
  const proximoJogo = jogos
    .filter(j => j.data_jogo)
    .find(j => new Date(`${j.data_jogo}T${j.hora_jogo || "00:00"}:00`) > agora);

  if (!proximoJogo) {
    bloco.classList.add("hidden");
    contagem.classList.add("hidden");
    semJogo.classList.remove("hidden");
    return;
  }

  const dataHoraJogo = new Date(`${proximoJogo.data_jogo}T${proximoJogo.hora_jogo || "00:00"}:00`);
  const fechaEm = new Date(dataHoraJogo.getTime() - horasAntes * 60 * 60 * 1000);
  const prazoAberto = agora < fechaEm;

  const adversario = proximoJogo.time_casa_id === meuTimeId
    ? proximoJogo.time_fora?.nome
    : proximoJogo.time_casa?.nome;

  // Caso 2: prazo já fechou (estamos a menos de X horas do jogo, ou o jogo já começou)
  if (!prazoAberto) {
    semJogo.classList.add("hidden");
    bloco.classList.add("hidden");
    contagem.classList.remove("hidden");

    document.getElementById("tituloProximoJogo").textContent =
      `${proximoJogo.rodada}ª rodada vs ${adversario || "—"}`;

    const relogioEl = document.getElementById("relogioProximoJogo");
    if (relogioEl) relogioEl.textContent = "🔒 Prazo de escalação encerrado";

    const labelEl = document.getElementById("horasAntesLabel");
    if (labelEl) labelEl.textContent = "A escalação fecha automaticamente antes de cada jogo.";
    return;
  }

  // Caso 3: prazo aberto -> libera a escalação, com contador de quanto falta pra fechar
  jogoParaEscalar = proximoJogo;
  bloco.classList.remove("hidden");
  contagem.classList.add("hidden");
  semJogo.classList.add("hidden");

  const horasRestantes = (fechaEm - agora) / 1000 / 60 / 60;
  const urgente = horasRestantes < 1;

  const atualizarRelogioFechamento = () => {
    const restante = fechaEm - new Date();
    const infoEl = document.getElementById("infoJogoEscalacao");
    if (!infoEl) { clearInterval(__proximoJogoTimerId); return; }

    if (restante <= 0) {
      verificarJogoParaEscalar(); // prazo acabou de fechar, recarrega o estado
      return;
    }

    const dias = Math.floor(restante / (1000 * 60 * 60 * 24));
    const horas = Math.floor((restante / (1000 * 60 * 60)) % 24);
    const min = Math.floor((restante / (1000 * 60)) % 60);
    const seg = Math.floor((restante / 1000) % 60);

    const textoRestante = dias > 0
      ? `${dias}d ${String(horas).padStart(2,"0")}h ${String(min).padStart(2,"0")}m`
      : `${String(horas).padStart(2,"0")}:${String(min).padStart(2,"0")}:${String(seg).padStart(2,"0")}`;

    infoEl.innerHTML = `
      <span class="prazo-badge ${horasRestantes < 1 ? 'urgente' : ''}">⏰ Fecha em ${textoRestante}</span>
      <p style="margin:0;font-size:14px;">Próximo jogo: <strong>${proximoJogo.rodada}ª rodada vs ${adversario}</strong></p>
    `;
  };

  atualizarRelogioFechamento();
  __proximoJogoTimerId = setInterval(atualizarRelogioFechamento, 1000);

  await carregarEscalacaoExistente();
  renderizarCampoTatico();
}

// ---------------------------------------------------------
// CAMPO TÁTICO
// ---------------------------------------------------------

async function carregarEscalacaoExistente() {
  if (!jogoParaEscalar) return;

  const { data } = await supabaseClient
    .from("escalacoes_tecnico")
    .select("*")
    .eq("jogo_id", jogoParaEscalar.id)
    .eq("time_id", meuTimeId)
    .maybeSingle();

  if (data) {
    formacaoAtual = data.formacao;
    document.getElementById("formacaoTatica").value = formacaoAtual;

    escalacaoAtual = {};
    (data.jogadores_titulares || []).forEach(item => {
      const jogador = elencoDoTime.find(j => j.id === item.jogador_id);
      if (jogador) escalacaoAtual[item.posicao_campo] = jogador;
    });

    document.getElementById("statusEscalacaoAtual").innerText =
      `Última escalação enviada em ${new Date(data.atualizado_em).toLocaleString("pt-BR")}. Você pode editar até o prazo fechar.`;
  } else {
    escalacaoAtual = {};
    document.getElementById("statusEscalacaoAtual").innerText = "Nenhuma escalação enviada ainda para este jogo.";
  }
}

function renderizarCampoTatico() {
  formacaoAtual = document.getElementById("formacaoTatica").value;
  const slots = FORMACOES[formacaoAtual];
  const campo = document.getElementById("campoTatico");

  campo.innerHTML = slots.map(slot => {
    const jogador = escalacaoAtual[slot.id];
    return `
      <div class="posicao-slot ${jogador ? 'preenchido' : ''}"
           style="left:${slot.x}%; top:${slot.y}%;"
           onclick="abrirModalJogador('${slot.id}', '${slot.tipo}')">
        <div class="marcador">${jogador ? (jogador.numero ?? '?') : slot.tipo}</div>
        ${jogador ? `<div class="nome-jogador">${jogador.nome}</div>` : ''}
      </div>
    `;
  }).join("");
}

function abrirModalJogador(slotId, tipoPosicao) {
  const jogadoresJaEscalados = Object.entries(escalacaoAtual)
    .filter(([sid]) => sid !== slotId)
    .map(([, j]) => j.id);

  const overlay = document.createElement("div");
  overlay.className = "modal-jogador-overlay";
  overlay.id = "modalJogadorOverlay";
  overlay.onclick = (e) => { if (e.target === overlay) fecharModalJogador(); };

  overlay.innerHTML = `
    <div class="modal-jogador-sheet">
      <h3>Escolher jogador (${tipoPosicao})</h3>
      ${elencoDoTime.map(j => {
        const jaEscalado = jogadoresJaEscalados.includes(j.id);
        const selecionado = escalacaoAtual[slotId]?.id === j.id;
        return `
          <div class="opcao-jogador ${selecionado ? 'selecionado' : ''} ${jaEscalado ? 'indisponivel' : ''}"
               onclick="${jaEscalado ? '' : `escolherJogador('${slotId}', '${j.id}')`}">
            <div class="info">
              <h4>${j.numero ?? '-'} · ${j.nome}</h4>
              <p>${j.posicao || '—'}</p>
            </div>
            ${selecionado ? '✅' : ''}
          </div>
        `;
      }).join("")}
      <button class="btn btn-ghost btn-block" style="margin-top:10px;" onclick="fecharModalJogador()">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function escolherJogador(slotId, jogadorId) {
  const jogador = elencoDoTime.find(j => j.id === jogadorId);
  if (jogador) escalacaoAtual[slotId] = jogador;
  fecharModalJogador();
  renderizarCampoTatico();
}

function fecharModalJogador() {
  document.getElementById("modalJogadorOverlay")?.remove();
}

// ---------------------------------------------------------
// ENVIO DA ESCALAÇÃO
// ---------------------------------------------------------

async function enviarEscalacao() {
  if (!jogoParaEscalar) {
    notificar("Nenhum jogo disponível para escalação no momento.", "aviso");
    return;
  }

  const slots = FORMACOES[formacaoAtual];
  const preenchidos = slots.filter(s => escalacaoAtual[s.id]);

  if (preenchidos.length < slots.length) {
    notificar(`Preencha todas as ${slots.length} posições antes de enviar.`, "aviso");
    return;
  }

  const jogadoresTitulares = slots.map(s => ({
    posicao_campo: s.id,
    jogador_id: escalacaoAtual[s.id].id,
  }));

  const { data: { session } } = await supabaseClient.auth.getSession();

  const payload = {
    jogo_id: jogoParaEscalar.id,
    time_id: meuTimeId,
    formacao: formacaoAtual,
    jogadores_titulares: jogadoresTitulares,
    enviada_por: session?.user?.id,
    gerada_automaticamente: false,
  };

  const { error } = await supabaseClient
    .from("escalacoes_tecnico")
    .upsert(payload, { onConflict: "jogo_id,time_id" });

  if (error) {
    notificar("Erro ao enviar escalação: " + error.message, "erro");
    return;
  }

  notificar("Escalação enviada com sucesso! ⚽");
  await carregarEscalacaoExistente();
}

// ---------------------------------------------------------
// BID — solicitação de regularização (só dentro da janela)
// ---------------------------------------------------------

async function verificarEcarregarBid() {
  const bloco = document.getElementById("blocoBid");
  const aviso = document.getElementById("bidJanelaFechadaAviso");
  const badge = document.getElementById("badgeBidStatus");
  if (!bloco || typeof obterJanelaBid !== "function") return;

  const janela = await obterJanelaBid();

  if (!janela.aberta) {
    bloco.classList.add("hidden");
    aviso.classList.remove("hidden");
    if (badge) { badge.textContent = "janela fechada"; badge.className = "badge-bid fechada"; }
    return;
  }

  bloco.classList.remove("hidden");
  aviso.classList.add("hidden");
  if (badge) { badge.textContent = "janela aberta"; badge.className = "badge-bid aberta"; }

  // Popula o select com os jogadores do elenco ainda regularizados
  // (os já irregulares já têm solicitação em andamento ou foram recusados)
  const select = document.getElementById("jogadorBidSolicitar");
  const elegiveis = elencoDoTime.filter(j => j.regularizado !== false);

  if (elegiveis.length === 0) {
    select.innerHTML = `<option value="">Nenhum jogador disponível</option>`;
  } else {
    select.innerHTML = elegiveis.map(j => `<option value="${j.id}">${j.nome}</option>`).join("");
  }

  await carregarMinhasSolicitacoesBid();
  await carregarTimesParaTransferencia();
  await carregarNegociacoesBid();
}

// ---------------------------------------------------------
// BID > SUB-ABAS (Regularização / Transferências / Negociações)
// ---------------------------------------------------------

function abrirSubAbaBid(nome, botao) {
  const subabas = ["Regularizacao", "Transferencias", "Negociacoes"];

  subabas.forEach(s => {
    document.getElementById(`subAba${s}Bid`)?.classList.add("hidden");
  });
  document.getElementById(`subAba${nome}Bid`)?.classList.remove("hidden");

  document.querySelectorAll(".subtab-btn").forEach(b => b.classList.remove("active"));
  if (botao) botao.classList.add("active");

  if (nome === "Negociacoes") carregarNegociacoesBid();
}

async function solicitarRegularizacao() {
  const jogadorId = document.getElementById("jogadorBidSolicitar").value;
  const observacao = document.getElementById("obsBidSolicitar").value.trim();

  if (!jogadorId) {
    notificar("Selecione um jogador.", "aviso");
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();

  const { error } = await supabaseClient
    .from("bid_solicitacoes")
    .insert([{
      jogador_id: jogadorId,
      time_id: meuTimeId,
      observacao: observacao || null,
      solicitado_por: session?.user?.id,
    }]);

  if (error) {
    notificar("Erro ao solicitar: " + error.message, "erro");
    return;
  }

  // Marca o jogador como irregular até o admin aprovar
  await supabaseClient.from("jogadores").update({ regularizado: false }).eq("id", jogadorId);

  notificar("Solicitação enviada! Aguarde a aprovação do admin.");
  document.getElementById("obsBidSolicitar").value = "";
  await carregarElenco();
  await carregarMinhasSolicitacoesBid();
}

async function carregarMinhasSolicitacoesBid() {
  const lista = document.getElementById("listaMinhasSolicitacoesBid");
  if (!lista) return;

  const { data, error } = await supabaseClient
    .from("bid_solicitacoes")
    .select("*, jogadores(nome)")
    .eq("time_id", meuTimeId)
    .order("criado_em", { ascending: false });

  if (error) { lista.innerHTML = `<p class="text-dim">Erro ao carregar solicitações.</p>`; return; }

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhuma solicitação enviada ainda.</p>`;
    return;
  }

  const statusLabel = { pendente: "⏳ Pendente", aprovado: "✅ Aprovado", recusado: "❌ Recusado" };

  lista.innerHTML = data.map(s => `
    <div class="time-item">
      <div class="info">
        <h3>${s.jogadores?.nome || "Jogador"}</h3>
        <p>${statusLabel[s.status] || s.status} ${s.observacao ? "· " + s.observacao : ""}</p>
      </div>
    </div>
  `).join("");
}

// ---------------------------------------------------------
// CALENDÁRIO — todos os jogos do próprio time
// ---------------------------------------------------------

async function carregarCalendarioTime() {
  const lista = document.getElementById("listaCalendarioMeuTime");
  if (!lista) return;

  const { data: jogos, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .or(`time_casa_id.eq.${meuTimeId},time_fora_id.eq.${meuTimeId}`)
    .order("rodada", { ascending: true });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar calendário</h3></div>`;
    return;
  }

  if (!jogos || jogos.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">📅</div><h3>Nenhum jogo cadastrado</h3></div>`;
    return;
  }

  const jogosProcessados = await Promise.all(
    jogos.map(j => typeof checarEncerramentoAutomatico === "function" ? checarEncerramentoAutomatico(j) : j)
  );

  lista.innerHTML = jogosProcessados.map(j => jogoCardHtml(j)).join("");
}

// ---------------------------------------------------------
// BID > TRANSFERÊNCIAS — ver elenco de outros times e consultar valores
// ---------------------------------------------------------

async function carregarTimesParaTransferencia() {
  const select = document.getElementById("timeTransferenciaSelect");
  if (!select) return;

  const { data, error } = await supabaseClient
    .from("times")
    .select("id, nome")
    .neq("id", meuTimeId)
    .order("nome", { ascending: true });

  if (error) {
    select.innerHTML = `<option value="">Erro ao carregar times</option>`;
    return;
  }

  if (!data || data.length === 0) {
    select.innerHTML = `<option value="">Nenhum outro time cadastrado</option>`;
    return;
  }

  select.innerHTML = `<option value="">Selecione um time</option>` +
    data.map(t => `<option value="${t.id}">${t.nome}</option>`).join("");

  document.getElementById("listaElencoTimeTransferencia").innerHTML =
    `<p class="text-dim" style="font-size:13px;">Escolha um time para ver o elenco.</p>`;
}

async function carregarElencoTimeTransferencia() {
  const timeId = document.getElementById("timeTransferenciaSelect").value;
  const lista = document.getElementById("listaElencoTimeTransferencia");
  if (!lista) return;

  if (!timeId) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Escolha um time para ver o elenco.</p>`;
    return;
  }

  lista.innerHTML = `<div class="skeleton" style="height:60px;"></div>`;

  const { data, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .eq("time_id", timeId)
    .order("numero", { ascending: true });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar elenco</h3></div>`;
    return;
  }

  if (!data || data.length === 0) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">👤</div><h3>Nenhum jogador cadastrado</h3></div>`;
    return;
  }

  lista.innerHTML = data.map(j => `
    <div class="time-item">
      <div class="escudo-placeholder">${j.numero ?? "-"}</div>
      <div class="info">
        <h3>${j.nome}</h3>
        <p>${j.posicao || "—"} · ${j.gols} gols · ${j.assistencias} assist.</p>
      </div>
      <button class="btn btn-sm btn-primary" onclick="abrirModalConsultaValor('${j.id}', '${timeId}')">Consultar valor</button>
    </div>
  `).join("");
}

function abrirModalConsultaValor(jogadorId, timeDonoId) {
  const overlay = document.createElement("div");
  overlay.className = "modal-jogador-overlay";
  overlay.id = "modalConsultaOverlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div class="modal-jogador-sheet">
      <h3>Consultar valor do passe</h3>
      <div class="field">
        <label>Valor a propor (opcional)</label>
        <input type="number" id="valorConsultaInput" placeholder="Ex: 5000000" min="0" step="1">
      </div>
      <div class="field">
        <label>Mensagem (opcional)</label>
        <input type="text" id="mensagemConsultaInput" placeholder="Ex: temos interesse em negociar">
      </div>
      <button class="btn btn-primary btn-block" onclick="enviarConsultaValor('${jogadorId}', '${timeDonoId}')">Enviar consulta</button>
      <button class="btn btn-ghost btn-block" style="margin-top:10px;" onclick="document.getElementById('modalConsultaOverlay').remove()">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

async function enviarConsultaValor(jogadorId, timeDonoId) {
  const valorInput = document.getElementById("valorConsultaInput").value;
  const mensagem = document.getElementById("mensagemConsultaInput").value.trim();

  const { data: { session } } = await supabaseClient.auth.getSession();

  const { error } = await supabaseClient
    .from("bid_transferencias")
    .insert([{
      jogador_id: jogadorId,
      time_dono_id: timeDonoId,
      time_interessado_id: meuTimeId,
      valor_consultado: valorInput ? Number(valorInput) : null,
      mensagem: mensagem || null,
      solicitado_por: session?.user?.id,
    }]);

  if (error) {
    notificar("Erro ao enviar consulta: " + error.message, "erro");
    return;
  }

  notificar("Consulta enviada! O time dono vai receber um aviso na aba Email.");
  document.getElementById("modalConsultaOverlay")?.remove();
  await carregarNegociacoesBid();
}

// ---------------------------------------------------------
// BID > NEGOCIAÇÕES — consultas recebidas e enviadas
// ---------------------------------------------------------

async function carregarNegociacoesBid() {
  await Promise.all([
    carregarConsultasRecebidas(),
    carregarConsultasEnviadas(),
  ]);
  await atualizarBadgeNegociacoes();
  await atualizarBolinhaEmail();
}

async function carregarConsultasRecebidas() {
  const lista = document.getElementById("listaConsultasRecebidas");
  if (!lista) return;

  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome), interessado:time_interessado_id(nome)")
    .eq("time_dono_id", meuTimeId)
    .order("criado_em", { ascending: false });

  if (error) { lista.innerHTML = `<p class="text-dim">Erro ao carregar consultas.</p>`; return; }

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhuma consulta recebida ainda.</p>`;
    return;
  }

  const statusLabel = { pendente: "⏳ Pendente", recusado: "❌ Recusada", respondido: "✅ Respondida" };

  lista.innerHTML = data.map(c => `
    <div class="consulta-item">
      <div class="info">
        <h4>${c.jogadores?.nome || "Jogador"}</h4>
        <p>Time interessado: ${c.interessado?.nome || "—"}${c.valor_consultado ? ` · Proposta: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}` : ""}</p>
        ${c.mensagem ? `<p>"${c.mensagem}"</p>` : ""}
        <span class="status-consulta ${c.status}">${statusLabel[c.status] || c.status}</span>
      </div>
      ${c.status === "pendente" ? `
        <div class="flex-gap" style="margin-top:10px;">
          <button class="btn btn-ghost btn-sm" onclick="recusarConsulta('${c.id}')">Recusar consulta</button>
        </div>
      ` : ""}
    </div>
  `).join("");
}

async function carregarConsultasEnviadas() {
  const lista = document.getElementById("listaConsultasEnviadas");
  if (!lista) return;

  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome), dono:time_dono_id(nome)")
    .eq("time_interessado_id", meuTimeId)
    .order("criado_em", { ascending: false });

  if (error) { lista.innerHTML = `<p class="text-dim">Erro ao carregar consultas.</p>`; return; }

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Você ainda não enviou nenhuma consulta.</p>`;
    return;
  }

  const statusLabel = { pendente: "⏳ Pendente", recusado: "❌ Recusada", respondido: "✅ Respondida" };

  lista.innerHTML = data.map(c => `
    <div class="consulta-item">
      <div class="info">
        <h4>${c.jogadores?.nome || "Jogador"}</h4>
        <p>Time dono: ${c.dono?.nome || "—"}${c.valor_consultado ? ` · Proposta: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}` : ""}</p>
        <span class="status-consulta ${c.status}">${statusLabel[c.status] || c.status}</span>
      </div>
    </div>
  `).join("");
}

// Recusar consulta — botão dentro da aba BID > Transferências > Negociações
async function recusarConsulta(consultaId) {
  const { error } = await supabaseClient
    .from("bid_transferencias")
    .update({ status: "recusado", respondido_em: new Date().toISOString(), lida: true })
    .eq("id", consultaId);

  if (error) {
    notificar("Erro ao recusar consulta: " + error.message, "erro");
    return;
  }

  notificar("Consulta recusada.");
  await carregarNegociacoesBid();
  await carregarEmailMeuTime();
}

async function atualizarBadgeNegociacoes() {
  const badge = document.getElementById("badgeNegociacoesPendentes");
  if (!badge || !meuTimeId) return;

  const { count, error } = await supabaseClient
    .from("bid_transferencias")
    .select("id", { count: "exact", head: true })
    .eq("time_dono_id", meuTimeId)
    .eq("status", "pendente");

  if (error) return;

  if (count && count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

// ---------------------------------------------------------
// EMAIL — notificações do time (consultas de transferência recebidas)
// ---------------------------------------------------------

async function atualizarBolinhaEmail() {
  const bolinha = document.getElementById("bolinhaEmailNav");
  if (!bolinha || !meuTimeId || typeof contarNotificacoesNaoLidas !== "function") return;

  const naoLidas = await contarNotificacoesNaoLidas(meuTimeId);
  bolinha.classList.toggle("hidden", naoLidas === 0);
}

async function carregarEmailMeuTime() {
  const lista = document.getElementById("listaEmailMeuTime");
  if (!lista) return;

  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome), interessado:time_interessado_id(nome)")
    .eq("time_dono_id", meuTimeId)
    .order("criado_em", { ascending: false });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar mensagens</h3></div>`;
    return;
  }

  if (!data || data.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <h3>Nenhuma mensagem</h3>
        <p>Avisos sobre consultas de transferência e outras notificações do time aparecem aqui.</p>
      </div>
    `;
    return;
  }

  const statusLabel = { pendente: "Consulta pendente", recusado: "Consulta recusada", respondido: "Consulta respondida" };

  lista.innerHTML = data.map(c => `
    <div class="email-item ${c.lida ? "" : "nao-lida"}">
      <div class="email-topo">
        <h4 class="email-titulo">Consulta de valor — ${c.jogadores?.nome || "Jogador"}</h4>
        <span class="email-data">${new Date(c.criado_em).toLocaleString("pt-BR")}</span>
      </div>
      <p class="email-corpo">
        O time <strong>${c.interessado?.nome || "—"}</strong> consultou o valor do passe de <strong>${c.jogadores?.nome || "seu jogador"}</strong>.
        ${c.valor_consultado ? ` Proposta enviada: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}.` : ""}
        ${c.mensagem ? ` Mensagem: "${c.mensagem}"` : ""}
        <br><span class="status-consulta ${c.status}">${statusLabel[c.status] || c.status}</span>
      </p>
      <div class="email-acoes">
        <button class="btn btn-primary btn-sm" onclick="irParaNegociacaoDoEmail('${c.id}')">Ir para negociação</button>
      </div>
    </div>
  `).join("");

  // Marca todas como lidas ao abrir a aba Email
  const idsNaoLidas = data.filter(c => !c.lida).map(c => c.id);
  if (idsNaoLidas.length > 0) {
    await supabaseClient.from("bid_transferencias").update({ lida: true }).in("id", idsNaoLidas);
    await atualizarBolinhaEmail();
  }
}

// Botão "Ir para negociação" dentro do email: leva pra aba BID > Transferências > Negociações
function irParaNegociacaoDoEmail(consultaId) {
  const linkBid = document.querySelector('#navMeuTime a[data-secao="Bid"]');
  abrirSecaoMeuTime("Bid", linkBid);

  const botaoNegociacoes = document.querySelector('.subtab-btn[data-subaba="Negociacoes"]');
  abrirSubAbaBid("Negociacoes", botaoNegociacoes);

  setTimeout(() => {
    const el = document.getElementById("listaConsultasRecebidas");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

// ---------- START ----------
checarAcessoTecnico();
