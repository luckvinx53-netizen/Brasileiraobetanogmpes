// =========================================================
// MEU TIME — área exclusiva do técnico
// =========================================================

let meuTimeId = null;
let meuTimeDados = null;
let elencoDoTime = [];
let jogoParaEscalar = null;
let escalacaoAtual = {}; // { slotId: jogador }
let reservasAtuais = new Set(); // Set de jogador_id no banco de reservas
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
  window.location.href = "https://brasileiraobetanogmpes.vercel.app/";
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

  // IMPORTANTE: só desloga quando temos certeza de que a conta não é
  // de um técnico (query OK, mas sem vínculo nenhum). Um erro de rede,
  // de RLS momentâneo, ou qualquer outra falha na consulta NÃO deve
  // derrubar a sessão — antes disso fazia signOut() em qualquer erro,
  // o que apagava o login à toa e obrigava a pessoa a logar de novo
  // sempre que abria a página.
  if (error) {
    notificar("Erro ao carregar seus dados. Tente novamente.", "erro");
    console.error(error);
    mostrarGateTecnico();
    return;
  }

  if (!vinculo) {
    notificar("Sua conta não está vinculada a nenhum time como técnico.", "erro");
    await supabaseClient.auth.signOut();
    mostrarGateTecnico();
    return;
  }

  // Técnico licenciado (sem clube no momento) não tem o que ver aqui —
  // a área dele (perfil + propostas recebidas) fica no GM Academy.
  if (vinculo.status === "licenciado" || !vinculo.time_id) {
    window.location.href = "gm-academy";
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

// Pedido de demissão: o técnico sai do clube por conta própria, na
// hora. Volta a "licenciado" (time_id = null) e é redirecionado pro
// GM Academy, onde fica disponível para novas propostas.
async function pedirDemissao() {
  if (!confirm(`Tem certeza que quer pedir demissão do ${meuTimeDados?.nome || "clube"}? Você ficará licenciado e disponível para novas propostas.`)) return;

  const { error } = await supabaseClient
    .from("tecnicos")
    .update({ time_id: null, status: "licenciado" })
    .eq("user_id", (await supabaseClient.auth.getSession()).data.session.user.id);

  if (error) {
    notificar("Erro ao pedir demissão: " + error.message, "erro");
    return;
  }

  notificar("Demissão realizada. Você está licenciado.", "sucesso");
  window.location.href = "gm-academy";
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
  const secoes = ["Inicio", "Escalacao", "Calendario", "Bid", "Orcamento", "Email"];

  secoes.forEach(s => {
    document.getElementById(`secao${s}MeuTime`)?.classList.add("hidden");
  });
  document.getElementById(`secao${nome}MeuTime`)?.classList.remove("hidden");

  document.querySelectorAll("#navMeuTime a").forEach(a => a.classList.remove("active"));
  const linkNav = link || document.querySelector(`#navMeuTime a[data-secao="${nome}"]`);
  if (linkNav) linkNav.classList.add("active");

  if (nome === "Email") carregarEmailMeuTime();
  if (nome === "Orcamento") carregarOrcamentoMeuTime();

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
    <div class="time-item" onclick="location.href='jogador?id=${j.id}'" style="cursor:pointer;">
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

    reservasAtuais = new Set(
      (data.jogadores_reservas || [])
        .map(item => item.jogador_id)
        .filter(id => elencoDoTime.some(j => j.id === id))
    );

    document.getElementById("statusEscalacaoAtual").innerText =
      `Última escalação enviada em ${new Date(data.atualizado_em).toLocaleString("pt-BR")}. Você pode editar até o prazo fechar.`;
  } else {
    escalacaoAtual = {};
    reservasAtuais = new Set();
    document.getElementById("statusEscalacaoAtual").innerText = "Nenhuma escalação enviada ainda para este jogo.";
  }

  renderizarListaReservas();
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

  renderizarListaReservas();
}

// ---------------------------------------------------------
// BANCO DE RESERVAS
// ---------------------------------------------------------

function renderizarListaReservas() {
  const area = document.getElementById("listaReservasEscalacao");
  if (!area) return;

  const idsTitulares = new Set(Object.values(escalacaoAtual).map(j => j.id));
  // Um jogador titular não pode também estar no banco de reservas.
  [...reservasAtuais].forEach(id => { if (idsTitulares.has(id)) reservasAtuais.delete(id); });

  if (elencoDoTime.length === 0) {
    area.innerHTML = `<p class="text-dim" style="font-size:12.5px;">Nenhum jogador no elenco.</p>`;
    return;
  }

  area.innerHTML = elencoDoTime.map(j => {
    const eTitular = idsTitulares.has(j.id);
    const selecionado = reservasAtuais.has(j.id);
    return `
      <div class="chip-reserva ${selecionado ? 'selecionado' : ''} ${eTitular ? 'indisponivel' : ''}"
           onclick="${eTitular ? '' : `toggleReserva('${j.id}')`}">
        <div class="numero">${j.numero ?? '-'}</div>
        <div class="info">
          <h4>${j.nome}</h4>
          <p>${eTitular ? "Já é titular" : (j.posicao || "—")}</p>
        </div>
        <div class="check">✅</div>
      </div>
    `;
  }).join("");
}

function toggleReserva(jogadorId) {
  if (reservasAtuais.has(jogadorId)) reservasAtuais.delete(jogadorId);
  else reservasAtuais.add(jogadorId);
  renderizarListaReservas();
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

  const jogadoresReservas = [...reservasAtuais].map(id => ({ jogador_id: id }));

  const { data: { session } } = await supabaseClient.auth.getSession();

  const payload = {
    jogo_id: jogoParaEscalar.id,
    time_id: meuTimeId,
    formacao: formacaoAtual,
    jogadores_titulares: jogadoresTitulares,
    jogadores_reservas: jogadoresReservas,
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

  await carregarJogadoresElegiveisRegularizacao();
  await carregarMinhasSolicitacoesBid();
  await carregarTimesParaTransferencia();
  await carregarNegociacoesBid();
}

// Cache das transferências aceitas e ainda não usadas, indexado por jogador_id.
// É daqui que a Regularização puxa clube de origem, valor, tipo e idade.
let transferenciasElegiveisCache = {};

// Cache das consultas recebidas pelo time atual (técnico B), indexado por id.
// Usado pelo modal de negociar pra saber o tipo de contratação pretendido.
let negociacoesRecebidasCache = {};
let negociacoesEnviadasCache = {};

// Popula o select da Regularização apenas com jogadores recém-contratados:
// aqueles com uma transferência aceita (bid_transferencias.status = 'aceito')
// para o time atual, que ainda não foi usada em nenhuma solicitação de regularização.
async function carregarJogadoresElegiveisRegularizacao() {
  const select = document.getElementById("jogadorBidSolicitar");
  if (!select) return;

  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome, idade), dono:time_dono_id(nome)")
    .eq("time_interessado_id", meuTimeId)
    .eq("status", "aceito")
    .eq("usada_em_regularizacao", false)
    .order("respondido_em", { ascending: false });

  if (error) {
    select.innerHTML = `<option value="">Erro ao carregar jogadores</option>`;
    transferenciasElegiveisCache = {};
    return;
  }

  transferenciasElegiveisCache = {};
  (data || []).forEach(t => { transferenciasElegiveisCache[t.jogador_id] = t; });

  if (!data || data.length === 0) {
    select.innerHTML = `<option value="">Nenhum jogador recém-contratado disponível</option>`;
  } else {
    select.innerHTML = `<option value="">Selecione um jogador</option>` +
      data.map(t => `<option value="${t.jogador_id}">${t.jogadores?.nome || "Jogador"}</option>`).join("");
  }

  atualizarPreviewRegularizacao();
}

// Preenche automaticamente Clube de origem, Valor, Idade e Tipo de contratação
// com base na transferência aceita selecionada — somente leitura.
function atualizarPreviewRegularizacao() {
  const select = document.getElementById("jogadorBidSolicitar");
  const preview = document.getElementById("previewRegularizacaoBid");
  if (!select || !preview) return;

  const jogadorId = select.value;
  const transferencia = transferenciasElegiveisCache[jogadorId];

  if (!jogadorId || !transferencia) {
    preview.classList.add("hidden");
    return;
  }

  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  preview.classList.remove("hidden");
  preview.innerHTML = `
    <div class="field"><label>Clube de origem</label><input type="text" value="${transferencia.dono?.nome || "—"}" disabled></div>
    <div class="row-2">
      <div class="field"><label>Valor da transferência</label><input type="text" value="${transferencia.valor_consultado ? "R$ " + Number(transferencia.valor_consultado).toLocaleString("pt-BR") : "—"}" disabled></div>
      <div class="field"><label>Idade</label><input type="text" value="${transferencia.jogadores?.idade ?? "—"}" disabled></div>
    </div>
    <div class="field"><label>Tipo de contratação</label><input type="text" value="${tipoLabel[transferencia.tipo_contratacao] || "—"}" disabled></div>
  `;
}

// ---------------------------------------------------------
// BID > SUB-ABAS (Regularização / Transferências / Negociações)
// ---------------------------------------------------------

function abrirSubAbaBid(nome, botao) {
  const subabas = ["Regularizacao", "Transferencias", "Negociacoes", "Scout"];

  subabas.forEach(s => {
    document.getElementById(`subAba${s}Bid`)?.classList.add("hidden");
  });
  document.getElementById(`subAba${nome}Bid`)?.classList.remove("hidden");

  document.querySelectorAll(".subtab-btn").forEach(b => b.classList.remove("active"));
  if (botao) botao.classList.add("active");

  if (nome === "Negociacoes") carregarNegociacoesBid();
  if (nome === "Scout") carregarSubAbaScout();
}

async function solicitarRegularizacao() {
  const jogadorId = document.getElementById("jogadorBidSolicitar").value;
  const observacao = document.getElementById("obsBidSolicitar").value.trim();
  const transferencia = transferenciasElegiveisCache[jogadorId];

  if (!jogadorId) {
    notificar("Selecione um jogador.", "aviso");
    return;
  }

  if (!transferencia) {
    notificar("Esse jogador não tem uma contratação recente pendente de regularização.", "aviso");
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
      transferencia_id: transferencia.id,
    }]);

  if (error) {
    notificar("Erro ao solicitar: " + error.message, "erro");
    return;
  }

  // Marca a transferência como já usada, pra não poder gerar outra regularização
  await supabaseClient.from("bid_transferencias").update({ usada_em_regularizacao: true }).eq("id", transferencia.id);

  // Marca o jogador como irregular até o admin aprovar
  await supabaseClient.from("jogadores").update({ regularizado: false }).eq("id", jogadorId);

  notificar("Solicitação enviada! Aguarde a aprovação do admin.");
  document.getElementById("obsBidSolicitar").value = "";
  await carregarElenco();
  await carregarJogadoresElegiveisRegularizacao();
  await carregarMinhasSolicitacoesBid();
}

async function carregarMinhasSolicitacoesBid() {
  const lista = document.getElementById("listaMinhasSolicitacoesBid");
  if (!lista) return;

  const { data, error } = await supabaseClient
    .from("bid_solicitacoes")
    .select("*, jogadores(nome), transferencia:transferencia_id(valor_consultado, tipo_contratacao, dono:time_dono_id(nome))")
    .eq("time_id", meuTimeId)
    .order("criado_em", { ascending: false });

  if (error) { lista.innerHTML = `<p class="text-dim">Erro ao carregar solicitações.</p>`; return; }

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhuma solicitação enviada ainda.</p>`;
    return;
  }

  const statusLabel = { pendente: "⏳ Pendente", aprovado: "✅ Aprovado", recusado: "❌ Recusado" };
  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  lista.innerHTML = data.map(s => {
    const t = s.transferencia;
    const detalhes = t
      ? `${t.dono?.nome ? "Origem: " + t.dono.nome + " · " : ""}${t.valor_consultado ? "R$ " + Number(t.valor_consultado).toLocaleString("pt-BR") + " · " : ""}${tipoLabel[t.tipo_contratacao] || ""}`
      : "";
    return `
    <div class="time-item">
      <div class="info">
        <h3>${s.jogadores?.nome || "Jogador"}</h3>
        <p>${statusLabel[s.status] || s.status} ${s.observacao ? "· " + s.observacao : ""}</p>
        ${detalhes ? `<p class="text-dim" style="font-size:12px;">${detalhes}</p>` : ""}
        <p class="text-dim" style="font-size:11.5px;">Solicitado em ${new Date(s.criado_em).toLocaleString("pt-BR")}</p>
      </div>
    </div>
  `;
  }).join("");
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
      <h3>Consultar interesse no jogador</h3>
      <div class="field">
        <label>Tipo de contratação pretendida</label>
        <select id="tipoContratacaoConsultaSelect">
          <option value="definitivo">Definitivo</option>
          <option value="emprestimo">Empréstimo</option>
        </select>
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
  const tipoContratacao = document.getElementById("tipoContratacaoConsultaSelect").value;
  const mensagem = document.getElementById("mensagemConsultaInput").value.trim();

  const { data: { session } } = await supabaseClient.auth.getSession();

  const { error } = await supabaseClient
    .from("bid_transferencias")
    .insert([{
      jogador_id: jogadorId,
      time_dono_id: timeDonoId,
      time_interessado_id: meuTimeId,
      tipo_contratacao: tipoContratacao,
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

  negociacoesRecebidasCache = Object.fromEntries((data || []).map(c => [c.id, c]));

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhuma consulta recebida ainda.</p>`;
    return;
  }

  const statusLabel = {
    pendente: "⏳ Aguardando negociação",
    negociando: "💬 Proposta enviada — aguardando o interessado",
    recusado: "❌ Recusada",
    aceito: "✅ Aceita — transferido",
  };
  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  lista.innerHTML = data.map(c => `
    <div class="consulta-item">
      <div class="info">
        <h4>${c.jogadores?.nome || "Jogador"}</h4>
        <p>Time interessado: ${c.interessado?.nome || "—"}${c.tipo_contratacao ? ` · Pretende: ${tipoLabel[c.tipo_contratacao]}` : ""}${c.valor_consultado ? ` · Proposta: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}` : ""}</p>
        ${c.mensagem ? `<p>"${c.mensagem}"</p>` : ""}
        ${scoutDetalhesPropostaHtml(c)}
        <span class="status-consulta ${c.status}">${statusLabel[c.status] || c.status}</span>
      </div>
      ${c.status === "pendente" ? `
        <div class="flex-gap" style="margin-top:10px;">
          <button class="btn btn-primary btn-sm" onclick="abrirModalNegociar('${c.id}')">Negociar</button>
          <button class="btn btn-ghost btn-sm" onclick="recusarConsulta('${c.id}')">Recusar consulta</button>
        </div>
      ` : ""}
      ${c.status === "negociando" && c.proposta_de === "interessado" ? `
        <div class="flex-gap" style="margin-top:10px;">
          <button class="btn btn-primary btn-sm" onclick="aceitarPropostaTransferencia('${c.id}')">Aceitar contraproposta</button>
          <button class="btn btn-secondary btn-sm" onclick="abrirModalContraproposta('${c.id}', 'recebida')">Contrapropor de volta</button>
          <button class="btn btn-ghost btn-sm" onclick="recusarPropostaTransferencia('${c.id}')">Recusar</button>
        </div>
      ` : ""}
    </div>
  `).join("");
}

// Modal onde o time dono (técnico B) define o valor da transferência,
// já vendo o tipo de contratação pretendido pelo interessado.
function abrirModalNegociar(consultaId) {
  const consulta = negociacoesRecebidasCache?.[consultaId];
  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  const overlay = document.createElement("div");
  overlay.className = "modal-jogador-overlay";
  overlay.id = "modalNegociarOverlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div class="modal-jogador-sheet">
      <h3>Propor valor da transferência</h3>
      <p class="text-dim" style="font-size:12.5px;">
        Tipo pretendido pelo interessado: <strong>${tipoLabel[consulta?.tipo_contratacao] || "—"}</strong>
      </p>
      <div class="field">
        <label>Valor da transferência</label>
        <input type="number" id="valorNegociarInput" placeholder="Ex: 5000000" min="0" step="1">
      </div>
      <div class="field">
        <label>Bônus (opcional)</label>
        <input type="number" id="bonusNegociarInput" placeholder="Ex: 500000" min="0" step="1">
      </div>
      <div class="field">
        <label>Condição do bônus (opcional)</label>
        <input type="text" id="bonusCondicaoNegociarInput" placeholder="Ex: por meta de jogos disputados">
      </div>
      ${consulta?.tipo_contratacao === "emprestimo" ? `
        <div class="field">
          <label>Taxa do empréstimo (% pago pelo interessado)</label>
          <input type="number" id="taxaEmprestimoNegociarInput" placeholder="Ex: 70" min="0" max="100" step="1">
        </div>
        <div class="field">
          <label class="check-inline">
            <input type="checkbox" id="opcaoCompraNegociarInput">
            Incluir opção de compra ao final do empréstimo
          </label>
        </div>
        <div class="field" id="opcaoCompraValorCampo" style="display:none;">
          <label>Valor da opção de compra</label>
          <input type="number" id="opcaoCompraValorNegociarInput" placeholder="Ex: 6000000" min="0" step="1">
        </div>
      ` : ""}
      <button class="btn btn-primary btn-block" onclick="enviarPropostaNegociar('${consultaId}')">Enviar proposta</button>
      <button class="btn btn-ghost btn-block" style="margin-top:10px;" onclick="document.getElementById('modalNegociarOverlay').remove()">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const chkOpcaoCompra = document.getElementById("opcaoCompraNegociarInput");
  if (chkOpcaoCompra) {
    chkOpcaoCompra.addEventListener("change", () => {
      document.getElementById("opcaoCompraValorCampo").style.display = chkOpcaoCompra.checked ? "" : "none";
    });
  }
}

async function enviarPropostaNegociar(consultaId) {
  const valorInput = document.getElementById("valorNegociarInput").value;
  const bonusInput = document.getElementById("bonusNegociarInput")?.value;
  const bonusCondicaoInput = document.getElementById("bonusCondicaoNegociarInput")?.value.trim();
  const taxaInput = document.getElementById("taxaEmprestimoNegociarInput")?.value;
  const opcaoCompraChk = document.getElementById("opcaoCompraNegociarInput")?.checked;
  const opcaoCompraValorInput = document.getElementById("opcaoCompraValorNegociarInput")?.value;

  if (!valorInput || Number(valorInput) <= 0) {
    notificar("Informe um valor para a transferência.", "aviso");
    return;
  }

  const { error } = await supabaseClient
    .from("bid_transferencias")
    .update({
      status: "negociando",
      valor_consultado: Number(valorInput),
      bonus_valor: bonusInput ? Number(bonusInput) : null,
      bonus_condicao: bonusCondicaoInput || null,
      taxa_emprestimo_percentual: taxaInput ? Number(taxaInput) : null,
      opcao_compra: !!opcaoCompraChk,
      opcao_compra_valor: (opcaoCompraChk && opcaoCompraValorInput) ? Number(opcaoCompraValorInput) : null,
      proposta_de: "dono",
      rodada_contraproposta: 1,
      lida: true,
    })
    .eq("id", consultaId);

  if (error) {
    notificar("Erro ao enviar proposta: " + error.message, "erro");
    return;
  }

  notificar("Proposta enviada! O time interessado vai receber um aviso na aba Email.");
  document.getElementById("modalNegociarOverlay")?.remove();
  await carregarNegociacoesBid();
}

// Chamada pelo técnico A (interessado) ao aceitar o valor proposto
// pelo técnico B. É esse aceite que oficializa a transferência.
async function aceitarPropostaTransferencia(consultaId) {
  // Busca a consulta pra saber jogador e time interessado
  const { data: consulta, error: erroConsulta } = await supabaseClient
    .from("bid_transferencias")
    .select("*")
    .eq("id", consultaId)
    .single();

  if (erroConsulta || !consulta) {
    notificar("Erro ao buscar a consulta: " + (erroConsulta?.message || ""), "erro");
    return;
  }

  // Marca a consulta como aceita (valor e tipo já definidos nas etapas anteriores)
  const { error: erroTransferencia } = await supabaseClient
    .from("bid_transferencias")
    .update({
      status: "aceito",
      respondido_em: new Date().toISOString(),
      lida: true,
    })
    .eq("id", consultaId);

  if (erroTransferencia) {
    notificar("Erro ao confirmar transferência: " + erroTransferencia.message, "erro");
    return;
  }

  // Move o jogador oficialmente para o time interessado e marca como irregular
  // (fica pendente de regularização no BID até o técnico solicitar e o admin aprovar)
  const { error: erroJogador } = await supabaseClient
    .from("jogadores")
    .update({ time_id: consulta.time_interessado_id, regularizado: false })
    .eq("id", consulta.jogador_id);

  if (erroJogador) {
    notificar("Erro ao transferir jogador: " + erroJogador.message, "erro");
    return;
  }

  // Movimenta o orçamento dos dois times pelo valor acordado, se houver valor
  if (consulta.valor_consultado) {
    await movimentarOrcamentoTransferencia(consulta);
  }

  notificar("Transferência confirmada! O jogador já pode ser regularizado pelo novo time.");
  await carregarNegociacoesBid();
  await carregarEmailMeuTime();
}

// Debita o valor da transferência do time interessado (comprador) e credita
// no time dono (vendedor), registrando as duas movimentações no histórico.
async function movimentarOrcamentoTransferencia(consulta) {
  const valor = Number(consulta.valor_consultado) + Number(consulta.bonus_valor || 0);

  const { data: timeInteressado } = await supabaseClient
    .from("times").select("orcamento").eq("id", consulta.time_interessado_id).single();
  const { data: timeDono } = await supabaseClient
    .from("times").select("orcamento").eq("id", consulta.time_dono_id).single();

  if (timeInteressado) {
    await supabaseClient.from("times")
      .update({ orcamento: Number(timeInteressado.orcamento || 0) - valor })
      .eq("id", consulta.time_interessado_id);
  }

  if (timeDono) {
    await supabaseClient.from("times")
      .update({ orcamento: Number(timeDono.orcamento || 0) + valor })
      .eq("id", consulta.time_dono_id);
  }

  await supabaseClient.from("orcamento_movimentacoes").insert([
    {
      time_id: consulta.time_interessado_id,
      tipo: "saida",
      valor,
      motivo: "transferencia",
      transferencia_id: consulta.id,
    },
    {
      time_id: consulta.time_dono_id,
      tipo: "entrada",
      valor,
      motivo: "transferencia",
      transferencia_id: consulta.id,
    },
  ]);
}

// Recusar a proposta de valor enviada pelo time dono (técnico A recusando
// a etapa de negociação) — fecha a consulta definitivamente.
async function recusarPropostaTransferencia(consultaId) {
  const { error } = await supabaseClient
    .from("bid_transferencias")
    .update({ status: "recusado", respondido_em: new Date().toISOString(), lida: true })
    .eq("id", consultaId);

  if (error) {
    notificar("Erro ao recusar proposta: " + error.message, "erro");
    return;
  }

  notificar("Proposta recusada.");
  await carregarNegociacoesBid();
}

// ---------------------------------------------------------
// CONTRAPROPOSTA — quem recebeu uma proposta em "negociando" pode
// devolver com valor, bônus, tipo e taxa de empréstimo diferentes,
// em vez de só aceitar ou recusar. O campo `proposta_de` marca quem
// fez a proposta vigente, pra saber de quem é a vez de responder.
// ---------------------------------------------------------

function abrirModalContraproposta(consultaId, origem) {
  // origem: 'recebida' (quem contrapropõe é o dono) | 'enviada' (quem contrapõe é o interessado)
  const consulta = origem === "recebida"
    ? negociacoesRecebidasCache?.[consultaId]
    : negociacoesEnviadasCache?.[consultaId];

  if (!consulta) return;

  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };
  const ehEmprestimo = consulta.tipo_contratacao === "emprestimo";

  const overlay = document.createElement("div");
  overlay.className = "modal-jogador-overlay";
  overlay.id = "modalContrapropostaOverlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div class="modal-jogador-sheet">
      <h3>Enviar contraproposta</h3>
      <p class="text-dim" style="font-size:12.5px;">
        Proposta atual: R$ ${Number(consulta.valor_consultado || 0).toLocaleString("pt-BR")}
        ${consulta.tipo_contratacao ? " · " + tipoLabel[consulta.tipo_contratacao] : ""}
      </p>

      <div class="field">
        <label>Novo valor da transferência</label>
        <input type="number" id="valorContrapropostaInput" value="${consulta.valor_consultado || ""}" min="0" step="1">
      </div>

      <div class="field">
        <label>Tipo de transferência</label>
        <select id="tipoContrapropostaInput" onchange="document.getElementById('blocoEmprestimoContraproposta').style.display = this.value === 'emprestimo' ? '' : 'none';">
          <option value="definitivo" ${!ehEmprestimo ? "selected" : ""}>Definitivo</option>
          <option value="emprestimo" ${ehEmprestimo ? "selected" : ""}>Empréstimo</option>
        </select>
      </div>

      <div class="field">
        <label>Bônus (opcional)</label>
        <input type="number" id="bonusContrapropostaInput" value="${consulta.bonus_valor || ""}" min="0" step="1">
      </div>
      <div class="field">
        <label>Condição do bônus (opcional)</label>
        <input type="text" id="bonusCondicaoContrapropostaInput" value="${consulta.bonus_condicao || ""}" placeholder="Ex: por meta de gols">
      </div>

      <div id="blocoEmprestimoContraproposta" style="${ehEmprestimo ? "" : "display:none;"}">
        <div class="field">
          <label>Taxa do empréstimo (% pago pelo interessado)</label>
          <input type="number" id="taxaContrapropostaInput" value="${consulta.taxa_emprestimo_percentual ?? ""}" min="0" max="100" step="1">
        </div>
        <div class="field">
          <label class="check-inline">
            <input type="checkbox" id="opcaoCompraContrapropostaInput" ${consulta.opcao_compra ? "checked" : ""}>
            Incluir opção de compra ao final do empréstimo
          </label>
        </div>
        <div class="field">
          <label>Valor da opção de compra</label>
          <input type="number" id="opcaoCompraValorContrapropostaInput" value="${consulta.opcao_compra_valor || ""}" min="0" step="1">
        </div>
      </div>

      <button class="btn btn-primary btn-block" onclick="enviarContraproposta('${consultaId}', '${origem}')">Enviar contraproposta</button>
      <button class="btn btn-ghost btn-block" style="margin-top:10px;" onclick="document.getElementById('modalContrapropostaOverlay').remove()">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

async function enviarContraproposta(consultaId, origem) {
  const valorInput = document.getElementById("valorContrapropostaInput").value;
  const tipoInput = document.getElementById("tipoContrapropostaInput").value;
  const bonusInput = document.getElementById("bonusContrapropostaInput").value;
  const bonusCondicaoInput = document.getElementById("bonusCondicaoContrapropostaInput").value.trim();
  const taxaInput = document.getElementById("taxaContrapropostaInput")?.value;
  const opcaoCompraChk = document.getElementById("opcaoCompraContrapropostaInput")?.checked;
  const opcaoCompraValorInput = document.getElementById("opcaoCompraValorContrapropostaInput")?.value;

  if (!valorInput || Number(valorInput) <= 0) {
    notificar("Informe um valor para a contraproposta.", "aviso");
    return;
  }

  // quem faz a contraproposta agora é o "autor" da proposta vigente —
  // 'recebida' = dono contrapropondo, 'enviada' = interessado contrapondo
  const propostaDe = origem === "recebida" ? "dono" : "interessado";

  const { data: atual } = await supabaseClient
    .from("bid_transferencias")
    .select("rodada_contraproposta")
    .eq("id", consultaId)
    .single();

  const { error } = await supabaseClient
    .from("bid_transferencias")
    .update({
      status: "negociando",
      valor_consultado: Number(valorInput),
      tipo_contratacao: tipoInput,
      bonus_valor: bonusInput ? Number(bonusInput) : null,
      bonus_condicao: bonusCondicaoInput || null,
      taxa_emprestimo_percentual: (tipoInput === "emprestimo" && taxaInput) ? Number(taxaInput) : null,
      opcao_compra: tipoInput === "emprestimo" ? !!opcaoCompraChk : false,
      opcao_compra_valor: (tipoInput === "emprestimo" && opcaoCompraChk && opcaoCompraValorInput) ? Number(opcaoCompraValorInput) : null,
      proposta_de: propostaDe,
      rodada_contraproposta: (atual?.rodada_contraproposta || 1) + 1,
      lida: true,
    })
    .eq("id", consultaId);

  if (error) {
    notificar("Erro ao enviar contraproposta: " + error.message, "erro");
    return;
  }

  notificar("Contraproposta enviada! O outro clube vai receber um aviso na aba Email.");
  document.getElementById("modalContrapropostaOverlay")?.remove();
  await carregarNegociacoesBid();
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

  negociacoesEnviadasCache = Object.fromEntries((data || []).map(c => [c.id, c]));

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Você ainda não enviou nenhuma consulta.</p>`;
    return;
  }

  const statusLabel = {
    pendente: "⏳ Aguardando negociação",
    negociando: "💬 Proposta recebida",
    recusado: "❌ Recusada",
    aceito: "✅ Aceita — transferido",
  };
  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  lista.innerHTML = data.map(c => `
    <div class="consulta-item">
      <div class="info">
        <h4>${c.jogadores?.nome || "Jogador"}</h4>
        <p>Time dono: ${c.dono?.nome || "—"}${c.tipo_contratacao ? ` · Pretendido: ${tipoLabel[c.tipo_contratacao]}` : ""}${c.valor_consultado ? ` · Proposta: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}` : ""}</p>
        ${scoutDetalhesPropostaHtml(c)}
        <span class="status-consulta ${c.status}">${statusLabel[c.status] || c.status}</span>
      </div>
      ${c.status === "negociando" && c.proposta_de !== "interessado" ? `
        <div class="flex-gap" style="margin-top:10px;">
          <button class="btn btn-primary btn-sm" onclick="aceitarPropostaTransferencia('${c.id}')">Aceitar proposta</button>
          <button class="btn btn-secondary btn-sm" onclick="abrirModalContraproposta('${c.id}', 'enviada')">Contrapropor</button>
          <button class="btn btn-ghost btn-sm" onclick="recusarPropostaTransferencia('${c.id}')">Recusar proposta</button>
        </div>
      ` : ""}
      ${c.status === "negociando" && c.proposta_de === "interessado" ? `
        <p class="text-dim" style="font-size:12px;margin-top:8px;">Aguardando o ${c.dono?.nome || "clube dono"} responder à sua contraproposta.</p>
      ` : ""}
    </div>
  `).join("");
}

// Mostra bônus, taxa de empréstimo e opção de compra da proposta vigente,
// quando presentes — igual em consultas recebidas e enviadas.
function scoutDetalhesPropostaHtml(c) {
  const partes = [];
  if (c.bonus_valor) partes.push(`Bônus: R$ ${Number(c.bonus_valor).toLocaleString("pt-BR")}${c.bonus_condicao ? " (" + c.bonus_condicao + ")" : ""}`);
  if (c.taxa_emprestimo_percentual != null) partes.push(`Taxa do empréstimo: ${c.taxa_emprestimo_percentual}%`);
  if (c.opcao_compra) partes.push(`Opção de compra: R$ ${Number(c.opcao_compra_valor || 0).toLocaleString("pt-BR")}`);
  if (!partes.length) return "";
  return `<p class="text-dim" style="font-size:11.5px;">${partes.join(" · ")}</p>`;
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

  // Conta consultas recebidas aguardando este time negociar (como dono)
  // + propostas recebidas aguardando este time aceitar/recusar (como interessado)
  const [recebidas, propostas] = await Promise.all([
    supabaseClient
      .from("bid_transferencias")
      .select("id", { count: "exact", head: true })
      .eq("time_dono_id", meuTimeId)
      .eq("status", "pendente"),
    supabaseClient
      .from("bid_transferencias")
      .select("id", { count: "exact", head: true })
      .eq("time_interessado_id", meuTimeId)
      .eq("status", "negociando"),
  ]);

  if (recebidas.error || propostas.error) return;

  const count = (recebidas.count || 0) + (propostas.count || 0);

  if (count > 0) {
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
  const bolinhaTopo = document.getElementById("bolinhaEmailTopo");
  if (!bolinhaTopo || !meuTimeId || typeof contarNotificacoesNaoLidas !== "function") return;

  const naoLidas = await contarNotificacoesNaoLidas(meuTimeId);
  bolinhaTopo.classList.toggle("hidden", naoLidas === 0);
}

// ---------------------------------------------------------
// ORÇAMENTO — gráfico em rosca (entradas x saídas) + histórico
// ---------------------------------------------------------

async function carregarOrcamentoMeuTime() {
  const valorAtual = document.getElementById("valorOrcamentoAtual");
  const valorEntradas = document.getElementById("valorTotalEntradas");
  const valorSaidas = document.getElementById("valorTotalSaidas");
  const grafico = document.getElementById("graficoOrcamentoMeuTime");
  const lista = document.getElementById("listaMovimentacoesOrcamento");

  const { data: time, error: erroTime } = await supabaseClient
    .from("times")
    .select("orcamento")
    .eq("id", meuTimeId)
    .single();

  const { data: movimentacoes, error: erroMov } = await supabaseClient
    .from("orcamento_movimentacoes")
    .select("*")
    .eq("time_id", meuTimeId)
    .order("criado_em", { ascending: false });

  if (erroTime || erroMov) {
    lista.innerHTML = `<p class="text-dim">Erro ao carregar orçamento.</p>`;
    return;
  }

  const orcamentoAtual = Number(time?.orcamento || 0);
  const totalEntradas = (movimentacoes || []).filter(m => m.tipo === "entrada").reduce((s, m) => s + Number(m.valor), 0);
  const totalSaidas = (movimentacoes || []).filter(m => m.tipo === "saida").reduce((s, m) => s + Number(m.valor), 0);

  valorAtual.textContent = "R$ " + orcamentoAtual.toLocaleString("pt-BR");
  valorEntradas.textContent = "R$ " + totalEntradas.toLocaleString("pt-BR");
  valorSaidas.textContent = "R$ " + totalSaidas.toLocaleString("pt-BR");

  grafico.innerHTML = desenharGraficoRoscaOrcamento(totalEntradas, totalSaidas);

  if (!movimentacoes || movimentacoes.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhuma movimentação registrada ainda.</p>`;
    return;
  }

  const motivoLabel = { transferencia: "Transferência", ajuste_admin: "Ajuste do admin", orcamento_inicial: "Orçamento inicial" };

  lista.innerHTML = movimentacoes.map(m => `
    <div class="time-item">
      <div class="info">
        <h3 style="color:${m.tipo === "entrada" ? "var(--grama)" : "#e5484d"};">
          ${m.tipo === "entrada" ? "+" : "−"} R$ ${Number(m.valor).toLocaleString("pt-BR")}
        </h3>
        <p>${motivoLabel[m.motivo] || m.motivo}</p>
        <p class="text-dim" style="font-size:11.5px;">${new Date(m.criado_em).toLocaleString("pt-BR")}</p>
      </div>
    </div>
  `).join("");
}

// Desenha um gráfico em rosca (donut) simples em SVG puro, sem dependências,
// comparando entradas (verde) e saídas (vermelho) do orçamento.
function desenharGraficoRoscaOrcamento(entradas, saidas) {
  const total = entradas + saidas;
  const raio = 80;
  const centro = 100;
  const espessura = 26;
  const circunferencia = 2 * Math.PI * raio;

  if (total === 0) {
    return `
      <svg viewBox="0 0 200 200" style="width:100%;height:100%;">
        <circle cx="${centro}" cy="${centro}" r="${raio}" fill="none" stroke="var(--bg-elev-2)" stroke-width="${espessura}"/>
        <text x="${centro}" y="${centro}" text-anchor="middle" dominant-baseline="middle" fill="var(--text-dim)" font-size="12">Sem movimentações</text>
      </svg>
    `;
  }

  const fracaoEntradas = entradas / total;
  const tamanhoEntradas = fracaoEntradas * circunferencia;

  return `
    <svg viewBox="0 0 200 200" style="width:100%;height:100%;transform:rotate(-90deg);">
      <circle cx="${centro}" cy="${centro}" r="${raio}" fill="none" stroke="#e5484d" stroke-width="${espessura}"/>
      <circle cx="${centro}" cy="${centro}" r="${raio}" fill="none" stroke="var(--grama)" stroke-width="${espessura}"
        stroke-dasharray="${tamanhoEntradas} ${circunferencia - tamanhoEntradas}" stroke-linecap="butt"/>
    </svg>
  `;
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

  const statusLabel = { pendente: "Aguardando você negociar", negociando: "Proposta enviada", recusado: "Consulta recusada", aceito: "Transferência aceita" };
  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  lista.innerHTML = data.map(c => `
    <div class="email-item ${c.lida ? "" : "nao-lida"}">
      <div class="email-topo">
        <h4 class="email-titulo">Consulta de interesse — ${c.jogadores?.nome || "Jogador"}</h4>
        <span class="email-data">${new Date(c.criado_em).toLocaleString("pt-BR")}</span>
      </div>
      <p class="email-corpo">
        O time <strong>${c.interessado?.nome || "—"}</strong> tem interesse em <strong>${c.jogadores?.nome || "seu jogador"}</strong>.
        ${c.tipo_contratacao ? ` Tipo pretendido: ${tipoLabel[c.tipo_contratacao]}.` : ""}
        ${c.valor_consultado ? ` Valor proposto por você: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}.` : ""}
        ${c.mensagem ? ` Mensagem: "${c.mensagem}"` : ""}
        <br><span class="status-consulta ${c.status}">${statusLabel[c.status] || c.status}</span>
      </p>
      <div class="email-acoes">
        ${c.status === "pendente" ? `<button class="btn btn-primary btn-sm" onclick="irParaNegociacaoDoEmail('${c.id}')">Ir para negociação</button>` : ""}
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

// ===========================================================
// BID > SCOUT — relatório de avaliação + jogadores à venda
// ===========================================================
//
// O relatório de scout é gerado de forma DETERMINÍSTICA a partir dos
// dados que já existem do jogador (idade, posição, gols, assistências,
// cartões) usando o mesmo hash simples que o mercado de rumores já usa
// (tmHashString, em mercado-noticias.js). Isso significa: o mesmo
// jogador sempre recebe o mesmo relatório, mas cada jogador é diferente
// dos outros — como se cada um tivesse passado por uma bateria de
// observação real, sem precisar guardar isso no banco.

let scoutElencoCache = {}; // jogadorId -> jogador, do time selecionado no Scout

async function carregarSubAbaScout() {
  await Promise.all([
    carregarTimesParaScout(),
    carregarMeusJogadoresParaVenda(),
    carregarMeusJogadoresAVenda(),
    carregarMercadoDeVendas(),
  ]);
}

// ---------- Select de times/elenco pra avaliar ----------

async function carregarTimesParaScout() {
  const select = document.getElementById("scoutTimeSelect");
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

  select.innerHTML = `<option value="">Selecione um time</option>` +
    (data || []).map(t => `<option value="${t.id}">${t.nome}</option>`).join("");

  document.getElementById("scoutJogadorSelect").innerHTML = `<option value="">Selecione um time primeiro</option>`;
  document.getElementById("scoutJogadorSelect").disabled = true;
  document.getElementById("relatorioScoutArea").innerHTML = "";
}

async function carregarElencoScout() {
  const timeId = document.getElementById("scoutTimeSelect").value;
  const jogadorSelect = document.getElementById("scoutJogadorSelect");
  document.getElementById("relatorioScoutArea").innerHTML = "";

  if (!timeId) {
    jogadorSelect.innerHTML = `<option value="">Selecione um time primeiro</option>`;
    jogadorSelect.disabled = true;
    return;
  }

  jogadorSelect.innerHTML = `<option value="">Carregando elenco...</option>`;
  jogadorSelect.disabled = true;

  const { data, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .eq("time_id", timeId)
    .order("numero", { ascending: true });

  if (error || !data || data.length === 0) {
    jogadorSelect.innerHTML = `<option value="">Nenhum jogador encontrado</option>`;
    return;
  }

  scoutElencoCache = Object.fromEntries(data.map(j => [j.id, j]));

  jogadorSelect.innerHTML = `<option value="">Selecione um jogador</option>` +
    data.map(j => `<option value="${j.id}">${j.nome} — ${j.posicao || "—"}</option>`).join("");
  jogadorSelect.disabled = false;
}

// ---------- Geração do relatório ----------

// Gera um número pseudo-aleatório estável em [0,1) a partir de uma seed.
function scoutRand(seed) {
  return (tmHashString(seed) % 10000) / 10000;
}

// Nota de 0 a 10 combinando os stats disponíveis do jogador com uma
// variação pseudo-aleatória estável (o "olho clínico" do scout).
function scoutCalcularNota(j) {
  const idade = Number(j.idade) || 24;
  const gols = Number(j.gols) || 0;
  const assist = Number(j.assistencias) || 0;
  const amarelos = Number(j.amarelos) || 0;
  const vermelhos = Number(j.vermelhos) || 0;

  // Produção ofensiva pesa mais pra atacantes/meias, mas todo mundo ganha
  // um pouco por participar de gol.
  const producao = Math.min(4.5, (gols * 0.35) + (assist * 0.25));

  // Idade: pico entre 24-29, cai fora dessa faixa (curva simples).
  let fatorIdade = 1;
  if (idade < 20) fatorIdade = 0.85;
  else if (idade <= 29) fatorIdade = 1;
  else if (idade <= 33) fatorIdade = 0.9;
  else fatorIdade = 0.75;

  // Disciplina: muitos cartões pesam contra.
  const penalidadeDisciplina = Math.min(1.2, (amarelos * 0.05) + (vermelhos * 0.4));

  // Base "observada em campo" — determinística por jogador, simula o
  // olhar do scout além dos números frios (técnica, tática, físico, mental).
  const baseObservada = 4.5 + scoutRand(j.id + "-base") * 3.5;

  let nota = (baseObservada + producao) * fatorIdade - penalidadeDisciplina;
  nota = Math.max(1, Math.min(10, nota));
  return Math.round(nota * 10) / 10;
}

// Valor de mercado estimado: parte de uma base pela nota/idade/posição e
// aplica uma variação estável, no mesmo espírito de tmHashString.
function scoutCalcularValorMercado(j, nota) {
  const idade = Number(j.idade) || 24;
  const posicao = (j.posicao || "").toLowerCase();

  let baseposicao = 4_000_000;
  if (posicao.includes("atacante") || posicao.includes("ponta")) baseposicao = 7_000_000;
  else if (posicao.includes("meia")) baseposicao = 6_000_000;
  else if (posicao.includes("zagueiro") || posicao.includes("lateral") || posicao.includes("defensor")) baseposicao = 5_000_000;
  else if (posicao.includes("goleiro")) baseposicao = 4_500_000;

  const fatorNota = Math.pow(nota / 6, 3); // nota alta pesa MUITO no valor
  let fatorIdade = 1;
  if (idade <= 23) fatorIdade = 1.35;
  else if (idade <= 29) fatorIdade = 1.1;
  else if (idade <= 33) fatorIdade = 0.7;
  else fatorIdade = 0.4;

  const variacao = 0.8 + scoutRand(j.id + "-valor") * 0.5; // ±variação estável

  const valor = baseposicao * fatorNota * fatorIdade * variacao;
  return Math.round(valor / 50000) * 50000; // arredonda pra múltiplos de 50 mil
}

const SCOUT_QUALIDADES = [
  "finalização precisa", "bom passe entre linhas", "velocidade de explosão",
  "leitura de jogo acima da média", "força física no duelo", "boa saída de bola",
  "cabeceio ofensivo", "desarme no timing certo", "visão de jogo", "liderança em campo",
  "boa marcação sob pressão", "capacidade de decidir jogos", "consistência técnica",
];
const SCOUT_FRAQUEZAS = [
  "inconsistência na finalização", "perde muitos duelos aéreos", "marcação displicente",
  "pouca resistência física no fim dos jogos", "decisões apressadas sob pressão",
  "dificuldade com a perna não-dominante", "pouca intensidade na recomposição",
  "oscila em jogos de pressão", "posicionamento defensivo a melhorar",
];
const SCOUT_ESTILOS = [
  "jogador de movimentação constante, busca espaços",
  "referência técnica, prefere jogo combinado no curto",
  "atua mais pelo lado, forte em conduções",
  "joga próximo à área, finaliza de primeira",
  "organiza o time, prioriza posse e circulação",
  "intenso na marcação, ganha muitas bolas no meio",
  "vertical, procura jogadas de profundidade",
];

function scoutEscolher(lista, seed, n) {
  // escolhe n itens sem repetição, de forma determinística por seed
  const embaralhado = [...lista].sort((a, b) => scoutRand(seed + a) - scoutRand(seed + b));
  return embaralhado.slice(0, n);
}

async function gerarRelatorioScout() {
  const jogadorId = document.getElementById("scoutJogadorSelect").value;
  const area = document.getElementById("relatorioScoutArea");

  if (!jogadorId) { area.innerHTML = ""; return; }

  const j = scoutElencoCache[jogadorId];
  if (!j) return;

  area.innerHTML = `<div class="skeleton" style="height:180px;"></div>`;

  const nota = scoutCalcularNota(j);
  const valorMercado = scoutCalcularValorMercado(j, nota);
  const pontosFortes = scoutEscolher(SCOUT_QUALIDADES, j.id + "-fortes", 3);
  const pontosFracos = scoutEscolher(SCOUT_FRAQUEZAS, j.id + "-fracos", 2);
  const estilo = scoutEscolher(SCOUT_ESTILOS, j.id + "-estilo", 1)[0];

  const recomendacao =
    nota >= 8 ? { label: "Contratar", cor: "var(--grama)" } :
    nota >= 6 ? { label: "Observar", cor: "#e6b800" } :
    { label: "Descartar", cor: "#e5484d" };

  // Assinatura do jornalista/repórter do clube do jogador, reaproveitando
  // o mesmo mapeamento de mercado-noticias.js — o scout "cruza" a
  // informação com o que já circula na imprensa daquele clube.
  const nomeTime = document.getElementById("scoutTimeSelect").selectedOptions[0]?.textContent || "";
  const assinatura = typeof tmAssinaturaMateria === "function" ? tmAssinaturaMateria(j.id + "-scout", nomeTime) : null;

  area.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <h3 style="margin:0 0 2px;">${j.nome}</h3>
          <p class="text-dim" style="margin:0;font-size:12.5px;">
            ${j.posicao || "—"} ${j.idade ? "· " + j.idade + " anos" : ""} · Camisa ${j.numero ?? "-"}
          </p>
        </div>
        <div style="text-align:center;flex-shrink:0;">
          <div style="font-family:var(--font-display);font-size:26px;line-height:1;">${nota.toFixed(1)}</div>
          <div class="text-dim" style="font-size:10.5px;">NOTA SCOUT</div>
        </div>
      </div>

      <div class="row-2" style="margin-top:14px;">
        <div class="card" style="text-align:center;padding:10px;">
          <p class="text-dim" style="margin:0;font-size:11.5px;">Valor de mercado estimado</p>
          <p style="font-family:var(--font-display);font-size:18px;margin:4px 0 0;">R$ ${valorMercado.toLocaleString("pt-BR")}</p>
        </div>
        <div class="card" style="text-align:center;padding:10px;">
          <p class="text-dim" style="margin:0;font-size:11.5px;">Recomendação</p>
          <p style="font-family:var(--font-display);font-size:16px;margin:4px 0 0;color:${recomendacao.cor};">${recomendacao.label}</p>
        </div>
      </div>

      <div style="margin-top:14px;">
        <p style="margin:0 0 4px;font-size:12.5px;font-weight:700;">Estilo de jogo</p>
        <p class="text-dim" style="margin:0;font-size:13px;">${estilo}</p>
      </div>

      <div style="margin-top:12px;">
        <p style="margin:0 0 4px;font-size:12.5px;font-weight:700;color:var(--grama);">Pontos fortes</p>
        <p class="text-dim" style="margin:0;font-size:13px;">${pontosFortes.join(", ")}</p>
      </div>

      <div style="margin-top:12px;">
        <p style="margin:0 0 4px;font-size:12.5px;font-weight:700;color:#e5484d;">Pontos a melhorar</p>
        <p class="text-dim" style="margin:0;font-size:13px;">${pontosFracos.join(", ")}</p>
      </div>

      <div style="margin-top:12px;">
        <p style="margin:0 0 4px;font-size:12.5px;font-weight:700;">Estatísticas na temporada</p>
        <p class="text-dim" style="margin:0;font-size:13px;">${j.gols || 0} gols · ${j.assistencias || 0} assistências · ${j.amarelos || 0} amarelos · ${j.vermelhos || 0} vermelhos</p>
      </div>

      ${assinatura ? `<p class="mc-assinatura" style="margin-top:14px;">Relatório cruzado com apuração de ${tmAssinaturaHtml(assinatura)}</p>` : ""}

      <button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="abrirModalConsultaValor('${j.id}', '${document.getElementById('scoutTimeSelect').value}')">Consultar valor pelo jogador</button>
    </div>
  `;
}

// ---------- Meus jogadores à venda ----------

async function carregarMeusJogadoresParaVenda() {
  const select = document.getElementById("jogadorVendaSelect");
  if (!select || !meuTimeId) return;

  const { data, error } = await supabaseClient
    .from("jogadores")
    .select("id, nome, posicao")
    .eq("time_id", meuTimeId)
    .order("nome", { ascending: true });

  if (error || !data || data.length === 0) {
    select.innerHTML = `<option value="">Nenhum jogador no elenco</option>`;
    return;
  }

  select.innerHTML = data.map(j => `<option value="${j.id}">${j.nome} — ${j.posicao || "—"}</option>`).join("");
}

async function colocarJogadorAVenda() {
  const jogadorId = document.getElementById("jogadorVendaSelect").value;
  const valor = document.getElementById("valorVendaInput").value;
  const aceitaEmprestimo = document.getElementById("aceitaEmprestimoVendaInput").checked;
  const observacao = document.getElementById("obsVendaInput").value.trim();

  if (!jogadorId) { notificar("Selecione um jogador do seu elenco.", "aviso"); return; }
  if (!valor || Number(valor) <= 0) { notificar("Informe um valor pedido válido.", "aviso"); return; }

  const { error } = await supabaseClient
    .from("jogadores_a_venda")
    .insert([{
      jogador_id: jogadorId,
      time_id: meuTimeId,
      valor_pedido: Number(valor),
      aceita_emprestimo: aceitaEmprestimo,
      observacao: observacao || null,
    }]);

  if (error) {
    // Índice único (uniq_jogador_a_venda_ativo) barra duplicar o mesmo
    // jogador enquanto já houver um anúncio ativo pra ele.
    if (error.code === "23505") {
      notificar("Esse jogador já está anunciado à venda.", "aviso");
    } else {
      notificar("Erro ao colocar à venda: " + error.message, "erro");
    }
    return;
  }

  notificar("Jogador colocado à venda! Ele já aparece no Scout dos outros clubes.");
  document.getElementById("valorVendaInput").value = "";
  document.getElementById("obsVendaInput").value = "";
  await Promise.all([carregarMeusJogadoresAVenda(), carregarMercadoDeVendas()]);
}

async function carregarMeusJogadoresAVenda() {
  const lista = document.getElementById("listaMeusJogadoresVenda");
  if (!lista || !meuTimeId) return;

  const { data, error } = await supabaseClient
    .from("jogadores_a_venda")
    .select("*, jogadores(nome, posicao)")
    .eq("time_id", meuTimeId)
    .is("removido_em", null)
    .order("criado_em", { ascending: false });

  if (error) { lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Erro ao carregar.</p>`; return; }

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum jogador seu está à venda no momento.</p>`;
    return;
  }

  lista.innerHTML = data.map(v => `
    <div class="time-item">
      <div class="info">
        <h3>${v.jogadores?.nome || "Jogador"}</h3>
        <p class="text-dim" style="font-size:12px;">
          Pedido: R$ ${Number(v.valor_pedido).toLocaleString("pt-BR")} ${v.aceita_emprestimo ? "· Aceita empréstimo" : "· Só definitivo"}
        </p>
        ${v.observacao ? `<p class="text-dim" style="font-size:11.5px;">"${v.observacao}"</p>` : ""}
      </div>
      <button class="btn btn-ghost btn-sm" onclick="retirarJogadorDaVenda('${v.id}')">Retirar</button>
    </div>
  `).join("");
}

async function retirarJogadorDaVenda(anuncioId) {
  const { error } = await supabaseClient
    .from("jogadores_a_venda")
    .update({ removido_em: new Date().toISOString(), removido_motivo: "retirado" })
    .eq("id", anuncioId);

  if (error) { notificar("Erro ao retirar: " + error.message, "erro"); return; }

  notificar("Jogador retirado do mercado.");
  await Promise.all([carregarMeusJogadoresAVenda(), carregarMercadoDeVendas()]);
}

// ---------- Mercado de vendas (jogadores de outros clubes à venda) ----------

async function carregarMercadoDeVendas() {
  const lista = document.getElementById("listaMercadoVendas");
  if (!lista || !meuTimeId) return;

  const { data, error } = await supabaseClient
    .from("jogadores_a_venda")
    .select("*, jogadores(nome, posicao), times(nome)")
    .neq("time_id", meuTimeId)
    .is("removido_em", null)
    .order("criado_em", { ascending: false });

  if (error) { lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Erro ao carregar mercado.</p>`; return; }

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum jogador de outro clube à venda no momento.</p>`;
    return;
  }

  lista.innerHTML = data.map(v => `
    <div class="time-item">
      <div class="info">
        <h3>${v.jogadores?.nome || "Jogador"}</h3>
        <p class="text-dim" style="font-size:12px;">
          ${v.times?.nome || "—"} · Pedido: R$ ${Number(v.valor_pedido).toLocaleString("pt-BR")} ${v.aceita_emprestimo ? "· Aceita empréstimo" : "· Só definitivo"}
        </p>
        ${v.observacao ? `<p class="text-dim" style="font-size:11.5px;">"${v.observacao}"</p>` : ""}
      </div>
      <button class="btn btn-sm btn-primary" onclick="abrirModalConsultaValor('${v.jogador_id}', '${v.time_id}')">Propor</button>
    </div>
  `).join("");
}

// ---------- START ----------
checarAcessoTecnico();
