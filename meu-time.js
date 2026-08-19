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
// Cache dos contratos de negociação em andamento, indexado por
// transferencia_id — usado pela tela de negociação estilo "ligação"
// (abrirTelaNegociacao) pra não precisar refazer a query.
let contratosNegociacaoCache = {};

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
  const subabas = ["Regularizacao", "Transferencias", "Negociacoes", "Scout", "Mercado"];

  subabas.forEach(s => {
    document.getElementById(`subAba${s}Bid`)?.classList.add("hidden");
  });
  document.getElementById(`subAba${nome}Bid`)?.classList.remove("hidden");

  document.querySelectorAll(".subtab-btn").forEach(b => b.classList.remove("active"));
  if (botao) botao.classList.add("active");

  if (nome === "Negociacoes") carregarNegociacoesBid();
  if (nome === "Scout") carregarSubAbaScout();
  if (nome === "Mercado") carregarSubAbaMercado();
}

async function solicitarRegularizacao() {
  const jogadorId = document.getElementById("jogadorBidSolicitar").value;
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
        <p>${statusLabel[s.status] || s.status}</p>
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
      <button class="btn btn-sm btn-primary" onclick="abrirModalConsultaValor('${j.id}', '${timeId}', false, '${escJs(j.nome)}')">Consultar valor</button>
    </div>
  `).join("");
}

// ehExterno: true quando o "jogador" é da tabela jogadores_externos
// (não jogadores do jogo) — muda qual coluna é preenchida no insert.
function abrirModalConsultaValor(jogadorId, timeDonoId, ehExterno, nomeJogador) {
  const overlay = document.createElement("div");
  overlay.className = "negociacao-overlay";
  overlay.id = "modalConsultaOverlay";

  overlay.innerHTML = `
    <div class="negociacao-topo">
      <h3>Consultar interesse</h3>
      <button class="fechar" onclick="document.getElementById('modalConsultaOverlay').remove()">✕</button>
    </div>
    <div class="negociacao-form">
      <h2 class="negociacao-form-titulo">${nomeJogador || "o jogador"}</h2>
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
    </div>
    <div class="negociacao-acoes">
      <button class="btn btn-primary btn-block" onclick="enviarConsultaValor('${jogadorId}', '${timeDonoId || ""}', ${!!ehExterno})">Enviar consulta</button>
      <button class="btn btn-ghost btn-block" onclick="document.getElementById('modalConsultaOverlay').remove()">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

async function enviarConsultaValor(jogadorId, timeDonoId, ehExterno) {
  const tipoContratacao = document.getElementById("tipoContratacaoConsultaSelect").value;
  const mensagem = document.getElementById("mensagemConsultaInput").value.trim();

  // Evita proposta duplicada: já existe uma negociação (não recusada)
  // em aberto do MEU time para esse mesmo jogador?
  const colunaJogador = ehExterno ? "jogador_externo_id" : "jogador_id";
  const { data: existente } = await supabaseClient
    .from("bid_transferencias")
    .select("id, status")
    .eq(colunaJogador, jogadorId)
    .eq("time_interessado_id", meuTimeId)
    .neq("status", "recusado")
    .maybeSingle();

  if (existente) {
    notificar("Você já tem uma negociação em aberto por esse jogador. Veja em Negociações.", "aviso");
    document.getElementById("modalConsultaOverlay")?.remove();
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();

  const linha = {
    time_dono_id: timeDonoId || null,
    time_interessado_id: meuTimeId,
    tipo_contratacao: tipoContratacao,
    mensagem: mensagem || null,
    solicitado_por: session?.user?.id,
  };
  linha[colunaJogador] = jogadorId;

  const { error } = await supabaseClient
    .from("bid_transferencias")
    .insert([linha]);

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

// Apaga do histórico as negociações já ENCERRADAS (recusadas ou
// aceitas) — nunca as pendentes/em andamento, pra não sumir com algo
// que o outro lado ainda está esperando resposta. `escopo` decide o
// filtro: 'recebidas' e 'email' olham pro que meu time é dono do
// jogador; 'enviadas' olha pro que meu time foi quem consultou.
async function limparHistoricoBid(escopo) {
  const confirmou = confirm(
    "Isso vai tirar da lista as consultas/propostas já encerradas (recusadas ou concluídas). Elas continuam guardadas no histórico (notícias de mercado, auditoria) — só somem dessa tela. Negociações em andamento não são afetadas. Deseja continuar?"
  );
  if (!confirmou) return;

  const colunaFiltro = escopo === "enviadas" ? "time_interessado_id" : "time_dono_id";

  // Antes apagava com DELETE — isso destruía o histórico e quebrava
  // as notícias de mercado, que usam bid_transferencias como fonte
  // (ver mercado-noticias.js). Agora é soft delete: marca
  // "arquivada_em" com a data/hora atual em vez de excluir a linha.
  // Registros arquivados somem das listas operacionais do BID (que
  // filtram por arquivada_em IS NULL) mas continuam existindo pra
  // notícias, histórico e auditoria, que não aplicam esse filtro.
  const { error, count } = await supabaseClient
    .from("bid_transferencias")
    .update({ arquivada_em: new Date().toISOString() }, { count: "exact" })
    .eq(colunaFiltro, meuTimeId)
    .in("status", ["recusado", "aceito"])
    .is("arquivada_em", null);

  if (error) {
    console.error("Erro ao limpar histórico do BID:", error);
    notificar("Não foi possível limpar o histórico agora.", "erro");
    return;
  }

  notificar(count ? `${count} registro(s) removido(s) da lista.` : "Nada para limpar — lista já estava limpa.");

  await carregarNegociacoesBid();
  await carregarEmailMeuTime();
}

async function carregarConsultasRecebidas() {
  const lista = document.getElementById("listaConsultasRecebidas");
  if (!lista) return;

  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome), jogador_externo:jogador_externo_id(nome, sobrenome), interessado:time_interessado_id(nome), contratos_negociacao(*)")
    .eq("time_dono_id", meuTimeId)
    .is("arquivada_em", null) // negociações arquivadas (via "Limpar histórico") não aparecem aqui
    .order("criado_em", { ascending: false });

  if (error) { lista.innerHTML = `<p class="text-dim">Erro ao carregar consultas.</p>`; return; }

  negociacoesRecebidasCache = Object.fromEntries((data || []).map(c => [c.id, c]));

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhuma consulta recebida ainda.</p>`;
    return;
  }

  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  lista.innerHTML = data.map(c => {
    const nomeJogador = c.jogadores?.nome || (c.jogador_externo ? `${c.jogador_externo.nome} ${c.jogador_externo.sobrenome || ""}`.trim() : "Jogador");
    const contrato = Array.isArray(c.contratos_negociacao) ? c.contratos_negociacao[0] : c.contratos_negociacao;

    return `
    <div class="consulta-item">
      <div class="info">
        <h4>${nomeJogador}</h4>
        <p>Time interessado: ${c.interessado?.nome || "—"}${c.tipo_contratacao ? ` · Pretende: ${tipoLabel[c.tipo_contratacao]}` : ""}${c.valor_consultado ? ` · Proposta: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}` : ""}</p>
        ${c.mensagem ? `<p>"${c.mensagem}"</p>` : ""}
        ${scoutDetalhesPropostaHtml(c)}
        ${etapaTransferenciaHtml(c, contrato)}
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
      <!-- Etapa 2 é conduzida pelo time INTERESSADO (comprador), não pelo
           dono — aqui o dono só acompanha o andamento, sem botões de ação. -->
    </div>
  `;
  }).join("");
}

// Texto e progresso das 6 etapas do fluxo (Proposta ao clube → Clube
// aceitou → Negociação com jogador → Contrato em negociação →
// Transferência concluída → Transferência rejeitada), reaproveitado
// nas duas listas (recebidas e enviadas).
function etapaTransferenciaHtml(c, contrato) {
  if (c.status === "recusado") {
    return `<span class="status-consulta recusado">❌ Transferência rejeitada — clube não aceitou</span>`;
  }
  if (c.status === "pendente") {
    return `<span class="status-consulta pendente">1️⃣ Proposta ao clube — aguardando resposta</span>`;
  }
  if (c.status === "negociando") {
    return `<span class="status-consulta negociando">💬 Negociando valor com o clube (${c.proposta_de === "dono" ? "aguardando o interessado" : "aguardando o dono"})</span>`;
  }
  // status === "aguardando_jogador" ou "aceito": clube já aceitou (etapa
  // 1 concluída) — o progresso daqui em diante é decidido por "etapa" e
  // pelo status do contrato, não mais pelo status da transferência.
  if (c.etapa === "concluida") {
    return `<span class="status-consulta aceito">✅ 5️⃣ Transferência concluída</span>`;
  }
  if (!contrato) {
    return `<span class="status-consulta negociando">2️⃣ Clube aceitou — aguardando proposta de contrato ao jogador</span>`;
  }
  if (contrato.status === "recusado") {
    return `<span class="status-consulta recusado">❌ Jogador recusou o contrato — transferência não avança</span>`;
  }
  if (contrato.status === "pendente") {
    return `<span class="status-consulta negociando">4️⃣ Contrato em negociação — aguardando resposta do jogador</span>`;
  }
  return `<span class="status-consulta negociando">3️⃣ Negociação com o jogador em andamento</span>`;
}

// ---------- CONDIÇÃO DE BÔNUS COMO META SELECIONÁVEL (estilo FC) ----------
// Em vez de digitar a condição em texto livre, o usuário escolhe o
// tipo de meta (partidas, gols, assistências, sem sofrer gols) e a
// quantidade num stepper — igual jogos de gerência fazem com cláusulas
// de performance. O resultado ainda é salvo como texto em
// bonus_condicao (não muda o schema do banco), só a forma de montar
// esse texto que virou seleção guiada em vez de digitação livre.
const METAS_BONUS = {
  partidas: { label: "Partidas disputadas", sufixo: (n) => `${n} partida${n === 1 ? "" : "s"} disputada${n === 1 ? "" : "s"}`, passo: 5 },
  gols: { label: "Gols marcados", sufixo: (n) => `${n} gol${n === 1 ? "" : "s"} marcado${n === 1 ? "" : "s"}`, passo: 5 },
  assistencias: { label: "Assistências", sufixo: (n) => `${n} assistência${n === 1 ? "" : "s"}`, passo: 5 },
  sem_sofrer_gols: { label: "Jogos sem sofrer gols", sufixo: (n) => `${n} jogo${n === 1 ? "" : "s"} sem sofrer gols`, passo: 5 },
};

// Gera o HTML do bloco "Condição do bônus" (select de meta + stepper
// de quantidade). `prefixo` evita colisão de IDs quando o mesmo bloco
// aparece em mais de um modal na mesma tela.
function htmlCondicaoBonus(prefixo) {
  const opcoes = Object.entries(METAS_BONUS)
    .map(([chave, m]) => `<option value="${chave}">${m.label}</option>`)
    .join("");
  return `
    <div class="field">
      <label>Condição do bônus (opcional)</label>
      <select id="${prefixo}MetaTipo" onchange="atualizarPassoMetaBonus('${prefixo}')">
        <option value="">Sem condição — bônus garantido</option>
        ${opcoes}
      </select>
    </div>
    <div class="field" id="${prefixo}MetaQtdCampo" style="display:none;">
      <label>Quantidade</label>
      <div class="value-stepper">
        <button type="button" onclick="ajustarValorStepper('${prefixo}MetaQtd', -5, 1)">−</button>
        <input type="number" id="${prefixo}MetaQtd" value="10" min="1" step="5" inputmode="numeric">
        <button type="button" onclick="ajustarValorStepper('${prefixo}MetaQtd', 5, 1)">+</button>
      </div>
    </div>
  `;
}

// Mostra/esconde o stepper de quantidade conforme o tipo de meta
// escolhido, e ajusta o passo do stepper pro padrão daquela meta.
function atualizarPassoMetaBonus(prefixo) {
  const tipoSelect = document.getElementById(`${prefixo}MetaTipo`);
  const campoQtd = document.getElementById(`${prefixo}MetaQtdCampo`);
  const inputQtd = document.getElementById(`${prefixo}MetaQtd`);
  const meta = METAS_BONUS[tipoSelect?.value];
  if (!meta) {
    campoQtd.style.display = "none";
    return;
  }
  campoQtd.style.display = "";
  inputQtd.step = meta.passo;
  if (!inputQtd.value || Number(inputQtd.value) < 1) inputQtd.value = meta.passo;
}

// Lê a seleção de meta+quantidade e monta a string final salva em
// bonus_condicao — ou null se "sem condição" estiver selecionado.
function lerCondicaoBonusSelecionada(prefixo) {
  const tipo = document.getElementById(`${prefixo}MetaTipo`)?.value;
  const meta = METAS_BONUS[tipo];
  if (!meta) return null;
  const qtd = Number(document.getElementById(`${prefixo}MetaQtd`)?.value) || meta.passo;
  return meta.sufixo(qtd);
}

// Modal onde o time dono (técnico B) define o valor da transferência,
// já vendo o tipo de contratação pretendido pelo interessado.
function abrirModalNegociar(consultaId) {
  const consulta = negociacoesRecebidasCache?.[consultaId];
  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };
  const nomeJogador = consulta?.jogadores?.nome || consulta?.jogador_externo?.nome || "o jogador";

  // Passo do stepper pra valores de transferência: bem maior que
  // salário, já que costuma ser na casa dos milhões.
  const PASSO_VALOR_TRANSFERENCIA = 250000;
  const PASSO_BONUS_TRANSFERENCIA = 50000;

  const overlay = document.createElement("div");
  overlay.className = "negociacao-overlay";
  overlay.id = "modalNegociarOverlay";

  overlay.innerHTML = `
    <div class="negociacao-topo">
      <h3>Proposta de transferência</h3>
      <button class="fechar" onclick="document.getElementById('modalNegociarOverlay').remove()">✕</button>
    </div>
    <div class="negociacao-form">
      <h2 class="negociacao-form-titulo">${nomeJogador}</h2>
      <span class="negociacao-form-badge">${tipoLabel[consulta?.tipo_contratacao] || "—"}</span>
      <div class="field" style="margin-top:16px;">
        <label>Valor da transferência</label>
        <div class="value-stepper">
          <button type="button" onclick="ajustarValorStepper('valorNegociarInput', -${PASSO_VALOR_TRANSFERENCIA}, 0)">−</button>
          <input type="number" id="valorNegociarInput" value="${PASSO_VALOR_TRANSFERENCIA}" min="0" step="${PASSO_VALOR_TRANSFERENCIA}" inputmode="numeric">
          <button type="button" onclick="ajustarValorStepper('valorNegociarInput', ${PASSO_VALOR_TRANSFERENCIA}, 0)">+</button>
        </div>
      </div>
      <div class="field">
        <label>Bônus (opcional)</label>
        <div class="value-stepper">
          <button type="button" onclick="ajustarValorStepper('bonusNegociarInput', -${PASSO_BONUS_TRANSFERENCIA}, 0)">−</button>
          <input type="number" id="bonusNegociarInput" value="0" min="0" step="${PASSO_BONUS_TRANSFERENCIA}" inputmode="numeric">
          <button type="button" onclick="ajustarValorStepper('bonusNegociarInput', ${PASSO_BONUS_TRANSFERENCIA}, 0)">+</button>
        </div>
      </div>
      ${htmlCondicaoBonus("negociar")}
      ${consulta?.tipo_contratacao === "emprestimo" ? `
        <div class="field">
          <label>Taxa do empréstimo (% pago pelo interessado)</label>
          <div class="value-stepper">
            <button type="button" onclick="ajustarValorStepper('taxaEmprestimoNegociarInput', -5, 0, 100)">−</button>
            <input type="number" id="taxaEmprestimoNegociarInput" value="70" min="0" max="100" step="5" inputmode="numeric">
            <button type="button" onclick="ajustarValorStepper('taxaEmprestimoNegociarInput', 5, 0, 100)">+</button>
          </div>
        </div>
        <div class="field">
          <label class="check-inline">
            <input type="checkbox" id="opcaoCompraNegociarInput">
            Incluir opção de compra ao final do empréstimo
          </label>
        </div>
        <div class="field" id="opcaoCompraValorCampo" style="display:none;">
          <label>Valor da opção de compra</label>
          <div class="value-stepper">
            <button type="button" onclick="ajustarValorStepper('opcaoCompraValorNegociarInput', -${PASSO_VALOR_TRANSFERENCIA}, 0)">−</button>
            <input type="number" id="opcaoCompraValorNegociarInput" value="${PASSO_VALOR_TRANSFERENCIA}" min="0" step="${PASSO_VALOR_TRANSFERENCIA}" inputmode="numeric">
            <button type="button" onclick="ajustarValorStepper('opcaoCompraValorNegociarInput', ${PASSO_VALOR_TRANSFERENCIA}, 0)">+</button>
          </div>
        </div>
      ` : ""}
    </div>
    <div class="negociacao-acoes">
      <button class="btn btn-primary btn-block" onclick="enviarPropostaNegociar('${consultaId}')">Enviar proposta</button>
      <button class="btn btn-ghost btn-block" onclick="document.getElementById('modalNegociarOverlay').remove()">Cancelar</button>
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
  const bonusCondicaoInput = lerCondicaoBonusSelecionada("negociar");
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
      bonus_valor: bonusInput && Number(bonusInput) > 0 ? Number(bonusInput) : null,
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
// Chamada pelo técnico A (interessado) ao aceitar o valor proposto
// pelo técnico B. Isso NÃO efetiva mais a transferência na hora —
// só fecha a ETAPA 1 (negociação com o clube) e libera a ETAPA 2
// (negociação de contrato com o jogador: salário, duração, bônus).
// A transferência de fato (jogador muda de time, orçamento se move)
// só acontece quando o contrato da etapa 2 for aceito — ver
// aceitarContratoNegociacao().
async function aceitarPropostaTransferencia(consultaId) {
  const { data: consulta, error: erroConsulta } = await supabaseClient
    .from("bid_transferencias")
    .select("*")
    .eq("id", consultaId)
    .single();

  if (erroConsulta || !consulta) {
    notificar("Erro ao buscar a consulta: " + (erroConsulta?.message || ""), "erro");
    return;
  }

  // Marca a etapa 1 como aceita pelo clube — mas ainda NÃO conclui a
  // transferência. Usa um status próprio ("aguardando_jogador") em vez
  // de "aceito" de propósito: várias outras telas do site (Regularização,
  // BID público, notícias de mercado, perfil do jogador etc) já filtram
  // bid_transferencias por status="aceito" esperando que isso signifique
  // "transferência concluída de verdade" — se essa etapa intermediária
  // usasse o mesmo valor, todas essas telas passariam a mostrar
  // transferências que na prática ainda não aconteceram.
  const { error: erroTransferencia } = await supabaseClient
    .from("bid_transferencias")
    .update({
      status: "aguardando_jogador",
      etapa: "jogador",
      respondido_em: new Date().toISOString(),
      lida: true,
    })
    .eq("id", consultaId);

  if (erroTransferencia) {
    notificar("Erro ao confirmar aceite do clube: " + erroTransferencia.message, "erro");
    return;
  }

  notificar("Clube aceitou! Agora é preciso negociar o contrato (salário, duração) com o jogador antes de concluir a transferência.");
  await carregarNegociacoesBid();
  await carregarEmailMeuTime();
}

// Debita o valor da transferência do time interessado (comprador) e credita
// no time dono (vendedor), registrando as duas movimentações no histórico.
// Chamada só quando a ETAPA 2 (contrato com o jogador) também é aceita —
// ver aceitarContratoNegociacao(). Também desconta a comissão do
// empresário do jogador, se houver uma configurada.
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

  // Comissão do empresário: descontada do orçamento do time COMPRADOR,
  // separada da movimentação principal pra ficar clara no histórico
  // ("Comissão de empresário" vs "Transferência").
  if (consulta.jogador_id) {
    const { data: jogador } = await supabaseClient
      .from("jogadores")
      .select("empresario_id, percentual_comissao")
      .eq("id", consulta.jogador_id)
      .maybeSingle();

    if (jogador?.empresario_id && jogador.percentual_comissao > 0) {
      const valorComissao = valor * (Number(jogador.percentual_comissao) / 100);

      const { data: timeCompradorAtualizado } = await supabaseClient
        .from("times").select("orcamento").eq("id", consulta.time_interessado_id).single();

      if (timeCompradorAtualizado) {
        await supabaseClient.from("times")
          .update({ orcamento: Number(timeCompradorAtualizado.orcamento || 0) - valorComissao })
          .eq("id", consulta.time_interessado_id);
      }

      await supabaseClient.from("orcamento_movimentacoes").insert([{
        time_id: consulta.time_interessado_id,
        tipo: "saida",
        valor: valorComissao,
        motivo: "comissao_empresario",
        transferencia_id: consulta.id,
      }]);
    }
  }
}

// ---------------------------------------------------------
// ETAPA 2 — NEGOCIAÇÃO DE CONTRATO COM O JOGADOR
// Só existe depois que o clube (etapa 1) já aceitou. O comprador
// propõe salário/duração/bônus; aceitar aqui é o que de fato efetiva
// a transferência (move o jogador, movimenta orçamento, desconta
// comissão de empresário).
// ---------------------------------------------------------

// Tela de negociação em tela cheia (estilo "ligação com o empresário",
// no espírito de jogos de gerência de futebol): mostra o card do
// jogador, a fala do empresário extraída das observações, os termos
// da proposta atual e as ações disponíveis — tudo em um só lugar em
// vez de espalhado no card da lista.
function abrirTelaNegociacao(consultaId) {
  const consulta = negociacoesEnviadasCache?.[consultaId] || negociacoesRecebidasCache?.[consultaId];
  const contrato = contratosNegociacaoCache?.[consultaId];
  if (!consulta || !contrato) {
    notificar("Não foi possível abrir a negociação.", "erro");
    return;
  }

  const alvo = consulta.jogadores || consulta.jogador_externo;
  const nomeJogador = alvo?.nome ? `${alvo.nome}${consulta.jogador_externo?.sobrenome ? " " + consulta.jogador_externo.sobrenome : ""}` : "o jogador";
  const nomeEmpresarioTime = consulta.dono?.nome || "Empresário";

  // A "fala" do empresário fica guardada nas observações no formato
  // 💬 Nome: "fala aqui" (às vezes com uma linha de sugestão depois,
  // e/ou a linha de expiração automática por prazo). Extrai só a fala
  // pra mostrar destacada; o resto (sugestão/expiração) vai embaixo.
  const obs = contrato.observacoes || "";
  const matchFala = obs.match(/💬\s*([^:]+):\s*"([^"]*)"/);
  const nomeQuemFala = matchFala?.[1]?.trim() || nomeEmpresarioTime;
  const falaExtraida = matchFala?.[2]?.trim() || null;
  const restanteObs = obs.replace(/💬[^\n]*/g, "").trim();

  const expirou = obs.includes("expirou após 2 dias");
  const semEmpresario = !obs;

  // Prazo de 2 dias a partir do envio da proposta — mostrado como
  // contagem regressiva simples pro usuário saber quanto tempo falta
  // antes de expirar automaticamente.
  const propostoEm = contrato.proposto_em ? new Date(contrato.proposto_em) : null;
  let prazoTexto = "";
  if (propostoEm && contrato.status === "pendente") {
    const prazoFinal = new Date(propostoEm.getTime() + 2 * 24 * 60 * 60 * 1000);
    const restanteMs = prazoFinal - new Date();
    if (restanteMs > 0) {
      const horas = Math.floor(restanteMs / (1000 * 60 * 60));
      const dias = Math.floor(horas / 24);
      const horasResto = horas % 24;
      prazoTexto = dias > 0
        ? `⏱️ Expira em ${dias}d ${horasResto}h se não houver resposta`
        : `⏱️ Expira em ${horasResto}h se não houver resposta`;
    } else {
      prazoTexto = "⏱️ Prazo de resposta esgotado — deve expirar em breve";
    }
  }

  const overlay = document.createElement("div");
  overlay.className = "negociacao-overlay";
  overlay.id = "telaNegociacaoOverlay";

  const posicao = alvo?.posicao || "—";
  const idade = alvo?.idade ?? null;
  const overallAlvo = consulta.jogador_externo?.overall ?? null;
  const valorMercado = alvo?.valor_mercado;

  overlay.innerHTML = `
    <div class="negociacao-topo">
      <h3>Negociação de contrato</h3>
      <button class="fechar" onclick="document.getElementById('telaNegociacaoOverlay').remove()">✕</button>
    </div>

    <div class="negociacao-call-card">
      <div class="avatar">${(nomeQuemFala || "?").slice(0, 1).toUpperCase()}</div>
      <div class="info">
        <span class="tag-status">${contrato.status === "aceito" ? "Transferência concluída" : contrato.status === "recusado" && expirou ? "Prazo esgotado" : contrato.status === "recusado" ? "Recusado" : semEmpresario ? "Aguardando você" : falaExtraida ? "Retornou contato" : "Em negociação"}</span>
        <h4>${nomeQuemFala}</h4>
        <p>Empresário de ${nomeJogador}</p>
      </div>
    </div>

    ${falaExtraida ? `<p class="negociacao-fala">💬 "${falaExtraida}"</p>` : ""}
    ${restanteObs ? `<p class="text-dim" style="margin:8px 18px 0;font-size:12px;">${restanteObs}</p>` : ""}

    <div class="negociacao-jogador-card">
      <div class="cabecalho">
        <h4>${nomeJogador}</h4>
        ${posicao !== "—" ? `<span class="badge-pos">${posicao}</span>` : ""}
      </div>
      <div class="negociacao-stats">
        ${idade != null ? `<span>Idade <b>${idade}</b></span>` : ""}
        ${overallAlvo != null ? `<span>Overall <b>${overallAlvo}</b></span>` : ""}
        ${valorMercado ? `<span>Valor de mercado <b>R$ ${Number(valorMercado).toLocaleString("pt-BR")}</b></span>` : ""}
      </div>
    </div>

    <div class="negociacao-proposta">
      <div class="linha destaque">
        <span class="label">Salário mensal</span>
        <span class="valor">R$ ${Number(contrato.salario_mensal_proposto).toLocaleString("pt-BR")}</span>
      </div>
      <div class="linha">
        <span class="label">Duração</span>
        <span class="valor">${formatarDuracaoContrato(contrato.duracao_meses)}</span>
      </div>
      <div class="linha">
        <span class="label">Bônus de assinatura</span>
        <span class="valor">${contrato.bonus_assinatura > 0 ? `R$ ${Number(contrato.bonus_assinatura).toLocaleString("pt-BR")}` : "Nenhum"}</span>
      </div>
      ${contrato.bonus_condicao ? `
      <div class="linha">
        <span class="label">Condição do bônus</span>
        <span class="valor" style="font-weight:400;font-size:12px;text-align:right;max-width:60%;">${contrato.bonus_condicao}</span>
      </div>` : ""}
    </div>

    ${prazoTexto ? `<p class="negociacao-prazo">${prazoTexto}</p>` : ""}

    <div class="negociacao-acoes">
      ${contrato.status === "pendente" && !semEmpresario ? `
        <button class="btn btn-primary btn-block" onclick="aceitarContratoNegociacao('${contrato.id}', '${consultaId}')">Aceitar mesmo assim — concluir</button>
        <button class="btn btn-secondary btn-block" onclick="document.getElementById('telaNegociacaoOverlay').remove(); abrirModalContrato('${consultaId}');">Enviar nova proposta</button>
        <button class="btn btn-ghost btn-block" onclick="document.getElementById('telaNegociacaoOverlay').remove(); recusarContratoNegociacao('${contrato.id}');">Desistir da negociação</button>
      ` : contrato.status === "pendente" ? `
        <p class="text-dim" style="text-align:center;font-size:12.5px;">Aguardando o empresário responder à proposta...</p>
      ` : `
        <button class="btn btn-ghost btn-block" onclick="document.getElementById('telaNegociacaoOverlay').remove()">Fechar</button>
      `}
    </div>
  `;

  document.body.appendChild(overlay);
}

// Abre o modal para o técnico comprador propor o contrato ao jogador,
// depois que o clube já aceitou (bid_transferencias.etapa === 'jogador').
function abrirModalContrato(consultaId) {
  const consulta = negociacoesEnviadasCache?.[consultaId] || negociacoesRecebidasCache?.[consultaId];
  const nomeJogador = consulta?.jogadores?.nome || consulta?.jogador_externo?.nome || "o jogador";

  const overlay = document.createElement("div");
  overlay.className = "negociacao-overlay";
  overlay.id = "modalContratoOverlay";

  // Passo do stepper: valores de salário/bônus sobem/descem em blocos
  // "redondos" (estilo FIFA), não de 1 em 1.
  const PASSO_SALARIO = 5000;
  const PASSO_BONUS = 10000;
  const ANOS_MIN = 1;
  const ANOS_MAX = 6;

  const opcoesAnos = Array.from({ length: ANOS_MAX - ANOS_MIN + 1 }, (_, i) => {
    const ano = ANOS_MIN + i;
    return `<option value="${ano}" ${ano === 3 ? "selected" : ""}>${ano} ${ano === 1 ? "ano" : "anos"}</option>`;
  }).join("");

  overlay.innerHTML = `
    <div class="negociacao-topo">
      <h3>Negociação de contrato</h3>
      <button class="fechar" onclick="document.getElementById('modalContratoOverlay').remove()">✕</button>
    </div>
    <div class="negociacao-form">
      <h2 class="negociacao-form-titulo">${nomeJogador}</h2>
      <div class="field">
        <label>Salário mensal</label>
        <div class="value-stepper">
          <button type="button" onclick="ajustarValorStepper('salarioContratoInput', -${PASSO_SALARIO}, 0)">−</button>
          <input type="number" id="salarioContratoInput" value="350000" min="0" step="${PASSO_SALARIO}" inputmode="numeric">
          <button type="button" onclick="ajustarValorStepper('salarioContratoInput', ${PASSO_SALARIO}, 0)">+</button>
        </div>
      </div>
      <div class="field">
        <label>Duração do contrato</label>
        <select id="duracaoContratoInput">${opcoesAnos}</select>
      </div>
      <div class="field">
        <label>Bônus de assinatura (opcional)</label>
        <div class="value-stepper">
          <button type="button" onclick="ajustarValorStepper('bonusAssinaturaContratoInput', -${PASSO_BONUS}, 0)">−</button>
          <input type="number" id="bonusAssinaturaContratoInput" value="0" min="0" step="${PASSO_BONUS}" inputmode="numeric">
          <button type="button" onclick="ajustarValorStepper('bonusAssinaturaContratoInput', ${PASSO_BONUS}, 0)">+</button>
        </div>
      </div>
      ${htmlCondicaoBonus("contrato")}
    </div>
    <div class="negociacao-acoes">
      <button class="btn btn-primary btn-block" onclick="enviarContratoNegociacao('${consultaId}')">Enviar proposta de contrato</button>
      <button class="btn btn-ghost btn-block" onclick="document.getElementById('modalContratoOverlay').remove()">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

// Exibe a duração do contrato em anos (agora que a proposta é feita
// em anos). Contratos antigos/salvos com meses "quebrados" (não
// múltiplos de 12) continuam sendo mostrados em meses, sem perder
// informação.
function formatarDuracaoContrato(meses) {
  const m = Number(meses || 0);
  if (m > 0 && m % 12 === 0) {
    const anos = m / 12;
    return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  }
  return `${m} ${m === 1 ? "mês" : "meses"}`;
}

// Incrementa/decrementa o valor de um input numérico do stepper,
// respeitando o mínimo (e opcionalmente um máximo — ex: taxas em %,
// que não podem passar de 100), sem nunca deixar o campo vazio/NaN.
function ajustarValorStepper(inputId, passo, minimo, maximo) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const atual = Number(input.value) || 0;
  let novo = Math.max(minimo, atual + passo);
  if (maximo != null) novo = Math.min(maximo, novo);
  input.value = novo;
}

// Cria (ou reenvia, se tinha sido recusado) a proposta de contrato.
async function enviarContratoNegociacao(consultaId) {
  const salario = document.getElementById("salarioContratoInput").value;
  const duracaoAnos = document.getElementById("duracaoContratoInput").value;
  const bonus = document.getElementById("bonusAssinaturaContratoInput").value;
  const bonusCondicao = lerCondicaoBonusSelecionada("contrato");

  if (!salario || Number(salario) <= 0) {
    notificar("Informe o salário mensal proposto.", "aviso");
    return;
  }
  if (!duracaoAnos || Number(duracaoAnos) <= 0) {
    notificar("Informe a duração do contrato.", "aviso");
    return;
  }

  // O seletor trabalha em anos (mais natural pra propor contrato),
  // mas o banco (duracao_meses) e o resto do sistema continuam em
  // meses — convertemos só na hora de salvar.
  const duracao = Number(duracaoAnos) * 12;

  // ---------- VALIDAÇÃO: FOLHA SALARIAL SUSTENTÁVEL ----------
  // Impede propor um salário que, somado à folha atual do elenco,
  // ultrapasse o orçamento do clube — não faz sentido assumir um
  // compromisso mensal maior do que o clube tem disponível agora.
  // (Não é uma previsão perfeita de fluxo de caixa futuro — é uma
  // trava simples: a folha nova não pode já nascer maior que o caixa.)
  const { data: timeAtual } = await supabaseClient
    .from("times").select("orcamento").eq("id", meuTimeId).single();

  const { data: elencoAtual } = await supabaseClient
    .from("jogadores")
    .select("salario_mensal")
    .eq("time_id", meuTimeId)
    .not("salario_mensal", "is", null);

  const folhaAtual = (elencoAtual || []).reduce((soma, j) => soma + Number(j.salario_mensal || 0), 0);
  const folhaComNovoJogador = folhaAtual + Number(salario);
  const orcamentoAtual = Number(timeAtual?.orcamento || 0);

  if (folhaComNovoJogador > orcamentoAtual) {
    notificar(
      `Salário proposto deixaria a folha mensal em R$ ${folhaComNovoJogador.toLocaleString("pt-BR")}, ` +
      `acima do orçamento disponível (R$ ${orcamentoAtual.toLocaleString("pt-BR")}). Reduza o valor.`,
      "erro"
    );
    return;
  }

  // upsert: se já existe uma proposta de contrato pra essa transferência
  // (ex: foi recusada antes), reabre com os novos termos em vez de
  // duplicar — a coluna transferencia_id é UNIQUE.
  const { data: contratoSalvo, error } = await supabaseClient
    .from("contratos_negociacao")
    .upsert({
      transferencia_id: consultaId,
      salario_mensal_proposto: Number(salario),
      duracao_meses: Number(duracao),
      bonus_assinatura: bonus ? Number(bonus) : 0,
      bonus_condicao: bonusCondicao || null,
      observacoes: null,
      status: "pendente",
      proposto_em: new Date().toISOString(),
      respondido_em: null,
    }, { onConflict: "transferencia_id" })
    .select()
    .single();

  if (error) {
    notificar("Erro ao enviar proposta de contrato: " + error.message, "erro");
    return;
  }

  notificar("Proposta de contrato enviada! Consultando o empresário...");
  document.getElementById("modalContratoOverlay")?.remove();
  await carregarNegociacoesBid();

  // Se o jogador tem empresário configurado, o Gemini simula a decisão
  // dele automaticamente — sem isso, a proposta ficaria "pendente" pra
  // sempre esperando alguém (jogador) responder manualmente, já que não
  // existe login de jogador no sistema.
  await consultarEmpresarioSobreContrato(consultaId, contratoSalvo);
}

// Chama a edge function simular-empresario (Gemini) para decidir a
// reação do empresário à proposta de contrato recém-enviada, e já
// aplica o resultado: aceita, recusa, ou registra a contraproposta.
async function consultarEmpresarioSobreContrato(transferenciaId, contrato) {
  const { data: transferencia, error: erroTransferencia } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome, posicao, salario_mensal, valor_mercado, empresario_id, percentual_comissao, empresario:empresario_id(nome)), jogador_externo:jogador_externo_id(nome, sobrenome, posicao, overall, salario_mensal, valor_mercado, empresario_id, percentual_comissao, empresario:empresario_id(nome)), interessado:time_interessado_id(nome)")
    .eq("id", transferenciaId)
    .single();

  if (erroTransferencia) {
    console.error("Erro ao buscar transferência para consultar empresário:", erroTransferencia);
    notificar("Não foi possível consultar o empresário agora. A proposta segue pendente.", "aviso");
    return;
  }
  if (!transferencia) return;

  const alvo = transferencia.jogadores || transferencia.jogador_externo;
  if (!alvo?.empresario_id) {
    // Sem empresário configurado: fica pendente mesmo, pra ser
    // respondido manualmente (fluxo antigo, sem IA).
    return;
  }

  // Conta quantas vezes esse contrato já foi negociado (pra dar mais
  // flexibilidade ao empresário em tentativas seguintes). Como o
  // upsert reabre a mesma linha em vez de criar uma nova a cada
  // reenvio, usa proposto_em vs criado_em como sinal aproximado de
  // "já foi reenviado pelo menos uma vez".
  const tentativaNumero = contrato?.criado_em !== contrato?.proposto_em ? 2 : 1;

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();

    const resposta = await fetch(`${SUPABASE_URL}/functions/v1/simular-empresario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token || ""}`,
      },
      body: JSON.stringify({
        nomeJogador: alvo.nome,
        nomeEmpresario: alvo.empresario?.nome,
        nomeClube: transferencia.interessado?.nome,
        posicao: alvo.posicao,
        overall: alvo.overall,
        valorMercado: alvo.valor_mercado,
        salarioAtual: alvo.salario_mensal,
        salarioProposto: contrato.salario_mensal_proposto,
        duracaoMeses: contrato.duracao_meses,
        bonusAssinatura: contrato.bonus_assinatura,
        percentualComissao: alvo.percentual_comissao,
        tentativaNumero,
      }),
    });

    const resultado = await resposta.json();

    if (!resposta.ok || resultado.error) {
      console.error("Erro ao consultar empresário:", resultado.error);
      notificar("Não foi possível consultar o empresário agora. A proposta segue pendente.", "aviso");
      return;
    }

    // Guarda a fala do empresário nas observações do contrato, pra
    // aparecer na tela mesmo depois de recarregar.
    const observacoesComFala = `💬 ${alvo.empresario?.nome || "Empresário"}: "${resultado.fala}"`;

    if (resultado.decisao === "aceito") {
      await supabaseClient
        .from("contratos_negociacao")
        .update({ observacoes: observacoesComFala })
        .eq("id", contrato.id);

      notificar(`O empresário aceitou! "${resultado.fala}"`);
      await aceitarContratoNegociacao(contrato.id, transferenciaId);
    } else if (resultado.decisao === "recusado") {
      await supabaseClient
        .from("contratos_negociacao")
        .update({ status: "recusado", respondido_em: new Date().toISOString(), observacoes: observacoesComFala })
        .eq("id", contrato.id);

      notificar(`O empresário recusou. "${resultado.fala}"`, "aviso");
    } else {
      // contraproposta: mantém pendente, mas registra o novo valor
      // sugerido nas observações — o clube decide se envia de novo com
      // esse valor ou tenta outra coisa.
      const sugestao = resultado.contraproposta_salario
        ? ` Sugestão: R$ ${Number(resultado.contraproposta_salario).toLocaleString("pt-BR")}/mês.`
        : "";

      await supabaseClient
        .from("contratos_negociacao")
        .update({ observacoes: observacoesComFala + sugestao })
        .eq("id", contrato.id);

      notificar(`O empresário quer negociar. "${resultado.fala}"${sugestao}`, "aviso");
    }

    await carregarNegociacoesBid();
  } catch (e) {
    console.error("Falha ao consultar empresário via IA:", e);
    notificar("Não foi possível consultar o empresário agora. A proposta segue pendente.", "aviso");
  }
}

// Aceitar o contrato = efetivar a transferência de verdade: move o
// jogador (só se for jogador do jogo — jogador externo não move
// elenco, conforme decisão pendente), movimenta orçamento e comissão
// de empresário, e marca a transferência como "concluida".
async function aceitarContratoNegociacao(contratoId, transferenciaId) {
  const { data: contrato, error: erroContrato } = await supabaseClient
    .from("contratos_negociacao")
    .select("*")
    .eq("id", contratoId)
    .single();

  if (erroContrato || !contrato) {
    notificar("Erro ao buscar o contrato: " + (erroContrato?.message || ""), "erro");
    return;
  }

  const { data: transferencia, error: erroTransferencia } = await supabaseClient
    .from("bid_transferencias")
    .select("*")
    .eq("id", transferenciaId)
    .single();

  if (erroTransferencia || !transferencia) {
    notificar("Erro ao buscar a transferência: " + (erroTransferencia?.message || ""), "erro");
    return;
  }

  // ---------- VALIDAÇÃO FINANCEIRA ----------
  // Não deixa concluir se o clube comprador não tem saldo suficiente
  // pro custo total (valor da transferência + bônus de assinatura +
  // comissão do empresário, quando configurada). Verificado só aqui —
  // no momento em que o dinheiro de fato vai sair — porque orçamento e
  // negociações concorrentes podem mudar entre o início da negociação
  // e o aceite final.
  const { data: timeComprador, error: erroTimeComprador } = await supabaseClient
    .from("times")
    .select("orcamento")
    .eq("id", transferencia.time_interessado_id)
    .single();

  if (erroTimeComprador || !timeComprador) {
    notificar("Erro ao verificar o orçamento do clube: " + (erroTimeComprador?.message || ""), "erro");
    return;
  }

  const valorTransferencia = Number(transferencia.valor_consultado || 0) + Number(transferencia.bonus_valor || 0);
  const bonusAssinatura = Number(contrato.bonus_assinatura || 0);

  let percentualComissao = 0;
  if (transferencia.jogador_id) {
    const { data: jogador } = await supabaseClient
      .from("jogadores")
      .select("percentual_comissao")
      .eq("id", transferencia.jogador_id)
      .maybeSingle();
    percentualComissao = Number(jogador?.percentual_comissao || 0);
  } else if (transferencia.jogador_externo_id) {
    const { data: jogadorExterno } = await supabaseClient
      .from("jogadores_externos")
      .select("percentual_comissao")
      .eq("id", transferencia.jogador_externo_id)
      .maybeSingle();
    percentualComissao = Number(jogadorExterno?.percentual_comissao || 0);
  }

  const valorComissao = valorTransferencia * (percentualComissao / 100);
  const custoTotal = valorTransferencia + bonusAssinatura + valorComissao;
  const orcamentoAtual = Number(timeComprador.orcamento || 0);

  if (custoTotal > orcamentoAtual) {
    notificar(
      `Orçamento insuficiente: essa contratação custa R$ ${custoTotal.toLocaleString("pt-BR")} ` +
      `(transferência + bônus + comissão), mas o clube só tem R$ ${orcamentoAtual.toLocaleString("pt-BR")} disponível.`,
      "erro"
    );
    return;
  }

  const { error: erroUpdateContrato } = await supabaseClient
    .from("contratos_negociacao")
    .update({ status: "aceito", respondido_em: new Date().toISOString() })
    .eq("id", contratoId);

  if (erroUpdateContrato) {
    notificar("Erro ao aceitar contrato: " + erroUpdateContrato.message, "erro");
    return;
  }

  // Move o jogador de fato — só para jogador do jogo. Jogador externo
  // fica de fora do elenco por enquanto (ver comentário em
  // jogadores_externos no banco).
  //
  // Isso passa por uma função SECURITY DEFINER no banco
  // (concluir_transferencia_jogador, ver 30_correcoes_bid.sql) em vez
  // de um UPDATE direto na tabela "jogadores". Motivo: a policy RLS de
  // "jogadores" só libera escrita para admin, então um UPDATE direto
  // daqui (técnico comum) é bloqueado pelo RLS e o Supabase pode
  // devolver "data: null, error: null" — parecendo sucesso mesmo sem
  // mover ninguém. A função no banco faz a validação e o UPDATE do
  // lado de dentro (bypassando esse RLS de forma controlada) e SÓ
  // retorna sucesso se a linha foi realmente atualizada — nunca
  // silenciosamente.
  if (transferencia.jogador_id) {
    const { data: resultadoMovimentacao, error: erroJogador } = await supabaseClient
      .rpc("concluir_transferencia_jogador", {
        p_transferencia_id: transferenciaId,
        p_salario_mensal: contrato.salario_mensal_proposto,
      });

    if (erroJogador) {
      notificar("Erro ao transferir jogador: " + erroJogador.message, "erro");
      return; // não segue o fluxo — transferência continua "não concluída"
    }

    if (!resultadoMovimentacao) {
      notificar("Erro ao transferir jogador: a operação não confirmou a movimentação.", "erro");
      return;
    }

    // A função já marca bid_transferencias como aceita/concluída
    // quando move o jogador (ou confirma que já estava concluída, se
    // chamada de novo por engano). Não precisa repetir esse UPDATE
    // aqui embaixo pra esse caso — só falta orçamento e comissão.
  } else if (transferencia.jogador_externo_id) {
    await supabaseClient
      .from("jogadores_externos")
      .update({ status: "contratado", salario_mensal: contrato.salario_mensal_proposto })
      .eq("id", transferencia.jogador_externo_id);
  }

  // Movimenta orçamento (valor da transferência + bônus de assinatura
  // do contrato) e comissão de empresário.
  if (transferencia.valor_consultado) {
    await movimentarOrcamentoTransferencia(transferencia);
  }

  if (contrato.bonus_assinatura > 0) {
    const { data: timeCompradorAtualizado } = await supabaseClient
      .from("times").select("orcamento").eq("id", transferencia.time_interessado_id).single();

    if (timeCompradorAtualizado) {
      await supabaseClient.from("times")
        .update({ orcamento: Number(timeCompradorAtualizado.orcamento || 0) - Number(contrato.bonus_assinatura) })
        .eq("id", transferencia.time_interessado_id);
    }

    await supabaseClient.from("orcamento_movimentacoes").insert([{
      time_id: transferencia.time_interessado_id,
      tipo: "saida",
      valor: contrato.bonus_assinatura,
      motivo: "bonus_assinatura",
      transferencia_id: transferencia.id,
    }]);
  }

  // AGORA SIM: a transferência está de fato concluída (jogador movido,
  // orçamento movimentado, comissão descontada). Para jogador_id, a
  // RPC concluir_transferencia_jogador() já marcou status/etapa lá
  // dentro do banco (garantindo que só virou "aceito" depois do
  // jogador realmente ter sido movido); este UPDATE aqui é redundante
  // nesse caso mas inofensivo. Para jogador_externo_id (que não passa
  // pela RPC), é este UPDATE quem marca a conclusão — o mesmo valor
  // que todas as outras telas do site (Regularização, BID público,
  // notícias de mercado, perfil do jogador, Transfermarkt) já esperam
  // para considerar uma transferência como realmente concluída.
  await supabaseClient
    .from("bid_transferencias")
    .update({ status: "aceito", etapa: "concluida" })
    .eq("id", transferenciaId);

  notificar("Contrato aceito! Transferência concluída — o jogador já pode ser regularizado pelo novo time.");
  await carregarNegociacoesBid();
  await carregarEmailMeuTime();
}

async function recusarContratoNegociacao(contratoId) {
  const { error } = await supabaseClient
    .from("contratos_negociacao")
    .update({ status: "recusado", respondido_em: new Date().toISOString() })
    .eq("id", contratoId);

  if (error) {
    notificar("Erro ao recusar contrato: " + error.message, "erro");
    return;
  }

  notificar("Proposta de contrato recusada. O jogador não aceitou as condições.");
  await carregarNegociacoesBid();
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
  const PASSO_VALOR_TRANSFERENCIA = 250000;
  const PASSO_BONUS_TRANSFERENCIA = 50000;

  const overlay = document.createElement("div");
  overlay.className = "negociacao-overlay";
  overlay.id = "modalContrapropostaOverlay";

  overlay.innerHTML = `
    <div class="negociacao-topo">
      <h3>Contraproposta</h3>
      <button class="fechar" onclick="document.getElementById('modalContrapropostaOverlay').remove()">✕</button>
    </div>
    <div class="negociacao-form">
      <h2 class="negociacao-form-titulo">R$ ${Number(consulta.valor_consultado || 0).toLocaleString("pt-BR")}</h2>
      <span class="negociacao-form-badge">Proposta atual${consulta.tipo_contratacao ? " · " + tipoLabel[consulta.tipo_contratacao] : ""}</span>

      <div class="field" style="margin-top:16px;">
        <label>Novo valor da transferência</label>
        <div class="value-stepper">
          <button type="button" onclick="ajustarValorStepper('valorContrapropostaInput', -${PASSO_VALOR_TRANSFERENCIA}, 0)">−</button>
          <input type="number" id="valorContrapropostaInput" value="${consulta.valor_consultado || PASSO_VALOR_TRANSFERENCIA}" min="0" step="${PASSO_VALOR_TRANSFERENCIA}" inputmode="numeric">
          <button type="button" onclick="ajustarValorStepper('valorContrapropostaInput', ${PASSO_VALOR_TRANSFERENCIA}, 0)">+</button>
        </div>
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
        <div class="value-stepper">
          <button type="button" onclick="ajustarValorStepper('bonusContrapropostaInput', -${PASSO_BONUS_TRANSFERENCIA}, 0)">−</button>
          <input type="number" id="bonusContrapropostaInput" value="${consulta.bonus_valor || 0}" min="0" step="${PASSO_BONUS_TRANSFERENCIA}" inputmode="numeric">
          <button type="button" onclick="ajustarValorStepper('bonusContrapropostaInput', ${PASSO_BONUS_TRANSFERENCIA}, 0)">+</button>
        </div>
      </div>
      ${htmlCondicaoBonus("contraproposta")}

      <div id="blocoEmprestimoContraproposta" style="${ehEmprestimo ? "" : "display:none;"}">
        <div class="field">
          <label>Taxa do empréstimo (% pago pelo interessado)</label>
          <div class="value-stepper">
            <button type="button" onclick="ajustarValorStepper('taxaContrapropostaInput', -5, 0, 100)">−</button>
            <input type="number" id="taxaContrapropostaInput" value="${consulta.taxa_emprestimo_percentual ?? 70}" min="0" max="100" step="5" inputmode="numeric">
            <button type="button" onclick="ajustarValorStepper('taxaContrapropostaInput', 5, 0, 100)">+</button>
          </div>
        </div>
        <div class="field">
          <label class="check-inline">
            <input type="checkbox" id="opcaoCompraContrapropostaInput" ${consulta.opcao_compra ? "checked" : ""}>
            Incluir opção de compra ao final do empréstimo
          </label>
        </div>
        <div class="field">
          <label>Valor da opção de compra</label>
          <div class="value-stepper">
            <button type="button" onclick="ajustarValorStepper('opcaoCompraValorContrapropostaInput', -${PASSO_VALOR_TRANSFERENCIA}, 0)">−</button>
            <input type="number" id="opcaoCompraValorContrapropostaInput" value="${consulta.opcao_compra_valor || PASSO_VALOR_TRANSFERENCIA}" min="0" step="${PASSO_VALOR_TRANSFERENCIA}" inputmode="numeric">
            <button type="button" onclick="ajustarValorStepper('opcaoCompraValorContrapropostaInput', ${PASSO_VALOR_TRANSFERENCIA}, 0)">+</button>
          </div>
        </div>
      </div>
    </div>

    <div class="negociacao-acoes">
      <button class="btn btn-primary btn-block" onclick="enviarContraproposta('${consultaId}', '${origem}')">Enviar contraproposta</button>
      <button class="btn btn-ghost btn-block" onclick="document.getElementById('modalContrapropostaOverlay').remove()">Cancelar</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

async function enviarContraproposta(consultaId, origem) {
  const valorInput = document.getElementById("valorContrapropostaInput").value;
  const tipoInput = document.getElementById("tipoContrapropostaInput").value;
  const bonusInput = document.getElementById("bonusContrapropostaInput").value;
  const bonusCondicaoInput = lerCondicaoBonusSelecionada("contraproposta");
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
      bonus_valor: bonusInput && Number(bonusInput) > 0 ? Number(bonusInput) : null,
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
    .select("*, jogadores(nome, posicao, idade, valor_mercado, foto_url), jogador_externo:jogador_externo_id(nome, sobrenome, posicao, idade, overall, valor_mercado), dono:time_dono_id(nome, escudo_url, sigla)")
    .eq("time_interessado_id", meuTimeId)
    .is("arquivada_em", null) // negociações arquivadas (via "Limpar histórico") não aparecem aqui
    .order("criado_em", { ascending: false });

  if (error) { lista.innerHTML = `<p class="text-dim">Erro ao carregar consultas.</p>`; return; }

  negociacoesEnviadasCache = Object.fromEntries((data || []).map(c => [c.id, c]));

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Você ainda não enviou nenhuma consulta.</p>`;
    return;
  }

  // Contratos das transferências já aceitas pelo clube — busca separada
  // porque só interessa quando etapa já passou de "clube". O status
  // aqui é "aguardando_jogador" (etapa 1 aceita, mas transferência
  // ainda não concluída de verdade) — ver aceitarPropostaTransferencia().
  const idsAceitos = data.filter(c => c.status === "aguardando_jogador" || c.etapa === "concluida").map(c => c.id);
  let contratosPorTransferencia = {};
  if (idsAceitos.length) {
    const { data: contratos } = await supabaseClient
      .from("contratos_negociacao")
      .select("*")
      .in("transferencia_id", idsAceitos);
    contratosPorTransferencia = Object.fromEntries((contratos || []).map(ct => [ct.transferencia_id, ct]));
  }
  contratosNegociacaoCache = { ...contratosNegociacaoCache, ...contratosPorTransferencia };

  const tipoLabel = { definitivo: "Definitivo", emprestimo: "Empréstimo" };

  lista.innerHTML = data.map(c => {
    const nomeJogador = c.jogadores?.nome || (c.jogador_externo ? `${c.jogador_externo.nome} ${c.jogador_externo.sobrenome || ""}`.trim() : "Jogador");
    const contrato = contratosPorTransferencia[c.id];

    return `
    <div class="consulta-item">
      <div class="info">
        <h4>${nomeJogador}</h4>
        <p>Time dono: ${c.dono?.nome || "—"}${c.tipo_contratacao ? ` · Pretendido: ${tipoLabel[c.tipo_contratacao]}` : ""}${c.valor_consultado ? ` · Proposta: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}` : ""}</p>
        ${scoutDetalhesPropostaHtml(c)}
        ${etapaTransferenciaHtml(c, contrato)}
        ${contrato ? `<p class="text-dim" style="font-size:12px;margin-top:4px;">Contrato proposto: R$ ${Number(contrato.salario_mensal_proposto).toLocaleString("pt-BR")}/mês por ${formatarDuracaoContrato(contrato.duracao_meses)}${contrato.bonus_assinatura > 0 ? ` + bônus de R$ ${Number(contrato.bonus_assinatura).toLocaleString("pt-BR")}` : ""}</p>` : ""}
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
      <!-- ETAPA 2: só quem comprou (time_interessado_id = meuTimeId,
           que é exatamente esta lista) propõe/gerencia o contrato. -->
      ${c.status === "aguardando_jogador" && c.etapa === "jogador" && !contrato ? `
        <div class="flex-gap" style="margin-top:10px;">
          <button class="btn btn-primary btn-sm" onclick="abrirModalContrato('${c.id}')">Negociar contrato com o jogador</button>
        </div>
      ` : ""}
      ${c.status === "aguardando_jogador" && c.etapa === "jogador" && contrato?.status === "recusado" ? `
        <div class="flex-gap" style="margin-top:10px;">
          <button class="btn btn-primary btn-sm" onclick="abrirModalContrato('${c.id}')">Propor novo contrato</button>
        </div>
      ` : ""}
      ${contrato ? `
        <div class="flex-gap" style="margin-top:10px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="abrirTelaNegociacao('${c.id}')">📞 Ver negociação</button>
          ${contrato.status === "pendente" ? `<button class="btn btn-ghost btn-sm" onclick="recusarContratoNegociacao('${contrato.id}')">Desistir da negociação</button>` : ""}
        </div>
        ${contrato.status === "pendente" && !contrato.observacoes ? `<p class="text-dim" style="font-size:11.5px;margin-top:6px;">⏳ Aguardando o empresário responder à proposta.</p>` : ""}
      ` : ""}
    </div>
  `;
  }).join("");
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
  const valorPatrocinador = document.getElementById("valorPatrocinadorMaster");
  const valorFolha = document.getElementById("valorFolhaSalarialMensal");
  const valorQtdJogadores = document.getElementById("valorQuantidadeJogadores");
  const listaCategorias = document.getElementById("listaResumoCategoriasOrcamento");
  const grafico = document.getElementById("graficoOrcamentoMeuTime");
  const lista = document.getElementById("listaMovimentacoesOrcamento");

  const { data: time, error: erroTime } = await supabaseClient
    .from("times")
    .select("orcamento, patrocinador_master, patrocinador_master_logo_url")
    .eq("id", meuTimeId)
    .single();

  const { data: movimentacoes, error: erroMov } = await supabaseClient
    .from("orcamento_movimentacoes")
    .select("*")
    .eq("time_id", meuTimeId)
    .order("criado_em", { ascending: false });

  const { data: elenco } = await supabaseClient
    .from("jogadores")
    .select("salario_mensal")
    .eq("time_id", meuTimeId);

  if (erroTime || erroMov) {
    lista.innerHTML = `<p class="text-dim">Erro ao carregar orçamento.</p>`;
    return;
  }

  const orcamentoAtual = Number(time?.orcamento || 0);
  const totalEntradas = (movimentacoes || []).filter(m => m.tipo === "entrada").reduce((s, m) => s + Number(m.valor), 0);
  const totalSaidas = (movimentacoes || []).filter(m => m.tipo === "saida").reduce((s, m) => s + Number(m.valor), 0);
  const folhaMensal = (elenco || []).reduce((s, j) => s + Number(j.salario_mensal || 0), 0);

  valorAtual.textContent = "R$ " + orcamentoAtual.toLocaleString("pt-BR");
  valorEntradas.textContent = "R$ " + totalEntradas.toLocaleString("pt-BR");
  valorSaidas.textContent = "R$ " + totalSaidas.toLocaleString("pt-BR");
  valorPatrocinador.textContent = time?.patrocinador_master || "Não definido";
  valorFolha.textContent = "R$ " + folhaMensal.toLocaleString("pt-BR") + "/mês";
  valorQtdJogadores.textContent = String((elenco || []).length);

  grafico.innerHTML = desenharGraficoRoscaOrcamento(totalEntradas, totalSaidas);

  // ---------- RESUMO POR CATEGORIA ----------
  // Agrupa as movimentações por motivo, separando entrada/saída, pra
  // dar a visão "quanto o clube gasta com o quê" pedida — transferências
  // (compra/venda), salários (folha), comissões de empresário e bônus.
  const categoriasConfig = [
    { motivo: "transferencia", tipo: "saida", label: "🔵 Contratações", cor: "#5b8def" },
    { motivo: "transferencia", tipo: "entrada", label: "🟢 Vendas de jogadores", cor: "var(--grama)" },
    { motivo: "folha_salarial", tipo: "saida", label: "🔴 Folha salarial", cor: "#e5484d" },
    { motivo: "comissao_empresario", tipo: "saida", label: "🟡 Comissões de empresário", cor: "#e6c869" },
    { motivo: "bonus_assinatura", tipo: "saida", label: "🟣 Bônus de assinatura", cor: "#b06fe0" },
    { motivo: "ajuste_admin", tipo: null, label: "⚙️ Ajustes do admin", cor: "var(--text-dim)" },
  ];

  const linhasCategorias = categoriasConfig.map(cat => {
    const total = (movimentacoes || [])
      .filter(m => m.motivo === cat.motivo && (cat.tipo === null || m.tipo === cat.tipo))
      .reduce((s, m) => s + Number(m.valor), 0);
    return { ...cat, total };
  }).filter(cat => cat.total > 0);

  listaCategorias.innerHTML = linhasCategorias.length
    ? linhasCategorias.map(cat => `
        <div class="time-item">
          <div class="info">
            <h3 style="color:${cat.cor};font-size:15px;">${cat.label}</h3>
            <p>R$ ${cat.total.toLocaleString("pt-BR")}</p>
          </div>
        </div>
      `).join("")
    : `<p class="text-dim" style="font-size:13px;">Nenhuma movimentação por categoria ainda.</p>`;

  if (!movimentacoes || movimentacoes.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhuma movimentação registrada ainda.</p>`;
    return;
  }

  const motivoLabel = {
    transferencia: "Transferência",
    ajuste_admin: "Ajuste do admin",
    orcamento_inicial: "Orçamento inicial",
    folha_salarial: "🔴 Pagamento de salários",
    comissao_empresario: "🟡 Comissão de empresário",
    bonus_assinatura: "🟣 Bônus de assinatura",
  };

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
    .is("arquivada_em", null) // negociações arquivadas (via "Limpar histórico") não aparecem aqui
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

// ---------------------------------------------------------
// BID > MERCADO — jogadores externos (fora do banco do jogo) e empresários
// ---------------------------------------------------------

let empresariosCache = [];
let jogadoresExternosCache = {};

async function carregarSubAbaMercado() {
  await carregarEmpresariosParaSelect();
  await carregarMercadoExternos();
}

// Popula os <select> de empresário (usado no cadastro de jogador
// externo). O mesmo cache é reaproveitado caso a tela cresça no
// futuro para permitir configurar empresário em jogadores do jogo também.
async function carregarEmpresariosParaSelect() {
  const { data, error } = await supabaseClient
    .from("empresarios")
    .select("*")
    .order("nome", { ascending: true });

  if (error) { console.error(error); return; }

  empresariosCache = data || [];

  const opcoesExtras = empresariosCache.map(e => `<option value="${e.id}">${e.nome}</option>`).join("");
  const select = document.getElementById("extEmpresarioSelect");
  if (select) {
    select.innerHTML = `<option value="">Nenhum</option>${opcoesExtras}<option value="__novo__">+ Cadastrar novo empresário</option>`;
  }
}

// Mostra/esconde os campos de "novo empresário" conforme a escolha do select.
function alternarCampoNovoEmpresario(prefixo) {
  const select = document.getElementById(`${prefixo}EmpresarioSelect`);
  const campos = document.getElementById(`${prefixo}NovoEmpresarioCampos`);
  if (!select || !campos) return;
  campos.classList.toggle("hidden", select.value !== "__novo__");
}

// Cria o empresário no banco (se "novo" foi escolhido) e devolve o id
// pronto pra usar — ou null se nenhum empresário foi selecionado.
async function resolverEmpresarioSelecionado(prefixo) {
  const select = document.getElementById(`${prefixo}EmpresarioSelect`);
  if (!select || !select.value) return null;

  if (select.value !== "__novo__") return select.value;

  const nome = document.getElementById(`${prefixo}NovoEmpresarioNome`).value.trim();
  if (!nome) {
    notificar("Informe o nome do novo empresário.", "aviso");
    return undefined; // undefined sinaliza "erro, cancele o cadastro"
  }

  const telefone = document.getElementById(`${prefixo}NovoEmpresarioTelefone`)?.value.trim() || null;
  const email = document.getElementById(`${prefixo}NovoEmpresarioEmail`)?.value.trim() || null;

  const { data, error } = await supabaseClient
    .from("empresarios")
    .insert([{ nome, telefone, email }])
    .select()
    .single();

  if (error) {
    notificar("Erro ao cadastrar empresário: " + error.message, "erro");
    return undefined;
  }

  return data.id;
}

async function cadastrarJogadorExterno() {
  const nome = document.getElementById("extNomeInput").value.trim();
  const sobrenome = document.getElementById("extSobrenomeInput").value.trim();
  const idade = document.getElementById("extIdadeInput").value;
  const nacionalidade = document.getElementById("extNacionalidadeInput").value.trim();
  const posicao = document.getElementById("extPosicaoInput").value;
  const overall = document.getElementById("extOverallInput").value;
  const clubeAtual = document.getElementById("extClubeAtualInput").value.trim();
  const valorMercado = document.getElementById("extValorMercadoInput").value;
  const salario = document.getElementById("extSalarioInput").value;
  const comissao = document.getElementById("extComissaoInput").value;

  if (!nome) {
    notificar("Informe ao menos o nome do jogador.", "aviso");
    return;
  }

  const empresarioId = await resolverEmpresarioSelecionado("ext");
  if (empresarioId === undefined) return; // erro já notificado

  const { data: { session } } = await supabaseClient.auth.getSession();

  const { error } = await supabaseClient
    .from("jogadores_externos")
    .insert([{
      nome,
      sobrenome: sobrenome || null,
      idade: idade ? Number(idade) : null,
      nacionalidade: nacionalidade || null,
      posicao: posicao || null,
      clube_atual_nome: clubeAtual || null,
      overall: overall ? Number(overall) : null,
      valor_mercado: valorMercado ? Number(valorMercado) : null,
      salario_mensal: salario ? Number(salario) : null,
      empresario_id: empresarioId,
      percentual_comissao: comissao ? Number(comissao) : null,
      cadastrado_por: session?.user?.id,
    }]);

  if (error) {
    notificar("Erro ao cadastrar jogador: " + error.message, "erro");
    return;
  }

  notificar("Jogador cadastrado! Já aparece no mercado, abaixo.");
  ["extNomeInput", "extSobrenomeInput", "extIdadeInput", "extNacionalidadeInput", "extClubeAtualInput", "extValorMercadoInput", "extSalarioInput", "extComissaoInput"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  document.getElementById("extEmpresarioSelect").value = "";
  document.getElementById("extNovoEmpresarioCampos").classList.add("hidden");

  await carregarMercadoExternos();
}

async function carregarMercadoExternos() {
  const lista = document.getElementById("listaMercadoExternos");
  if (!lista) return;

  const { data, error } = await supabaseClient
    .from("jogadores_externos")
    .select("*, empresario:empresario_id(nome), clube_atual:clube_atual_id(nome)")
    .order("criado_em", { ascending: false });

  if (error) { lista.innerHTML = `<p class="text-dim">Erro ao carregar mercado.</p>`; return; }

  jogadoresExternosCache = Object.fromEntries((data || []).map(j => [j.id, j]));

  if (!data || data.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum jogador externo cadastrado ainda.</p>`;
    return;
  }

  // Pra cada jogador, checa se já existe negociação em aberto (não
  // recusada) do meu time — sem isso o mesmo botão "Enviar proposta"
  // ficaria disponível mesmo já tendo consulta em andamento.
  const { data: negociacoesDoMeuTime } = await supabaseClient
    .from("bid_transferencias")
    .select("id, jogador_externo_id, status")
    .eq("time_interessado_id", meuTimeId)
    .not("jogador_externo_id", "is", null)
    .neq("status", "recusado");

  const negociacaoAbertaPorJogador = Object.fromEntries((negociacoesDoMeuTime || []).map(n => [n.jogador_externo_id, n]));

  const statusLabel = {
    disponivel: "Disponível",
    em_negociacao: "Em negociação",
    contratado: "Contratado",
    indisponivel: "Indisponível",
  };

  lista.innerHTML = data.map(j => {
    const nomeCompleto = `${j.nome} ${j.sobrenome || ""}`.trim();
    const nomeClube = j.clube_atual?.nome || j.clube_atual_nome || "Sem clube definido";
    const jaNegociando = negociacaoAbertaPorJogador[j.id];

    return `
    <div class="time-item">
      <div class="info">
        <h3>${nomeCompleto}</h3>
        <p>${j.posicao || "—"} · Clube atual: ${nomeClube}${j.overall ? ` · Overall ${j.overall}` : ""}</p>
        <p>${j.valor_mercado ? `Valor de mercado: R$ ${Number(j.valor_mercado).toLocaleString("pt-BR")}` : "Valor de mercado não informado"}${j.salario_mensal ? ` · Salário atual: R$ ${Number(j.salario_mensal).toLocaleString("pt-BR")}/mês` : ""}</p>
        ${j.empresario?.nome ? `<p>Empresário: ${j.empresario.nome}${j.percentual_comissao ? ` (${j.percentual_comissao}% de comissão)` : ""}</p>` : ""}
        <span class="status-consulta ${j.status === "disponivel" ? "pendente" : j.status === "contratado" ? "aceito" : "negociando"}">${statusLabel[j.status] || j.status}</span>
      </div>
      ${j.status === "disponivel" && !jaNegociando ? `
        <div class="flex-gap" style="margin-top:10px;">
          <button class="btn btn-primary btn-sm" onclick="abrirModalConsultaValor('${j.id}', '${j.clube_atual_id || ""}', true, '${escJs(nomeCompleto)}')">Enviar proposta</button>
        </div>
      ` : ""}
      ${jaNegociando ? `<p class="text-dim" style="font-size:11.5px;margin-top:6px;">Você já tem uma negociação em aberto por esse jogador — veja em Negociações.</p>` : ""}
    </div>
  `;
  }).join("");
}

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

      <button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="abrirModalConsultaValor('${j.id}', '${document.getElementById('scoutTimeSelect').value}', false, '${escJs(j.nome)}')">Consultar valor pelo jogador</button>
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
      <button class="btn btn-sm btn-primary" onclick="abrirModalConsultaValor('${v.jogador_id}', '${v.time_id}', false, '${escJs(v.jogadores?.nome || "Jogador")}')">Propor</button>
    </div>
  `).join("");
}

// ---------- START ----------
checarAcessoTecnico();
