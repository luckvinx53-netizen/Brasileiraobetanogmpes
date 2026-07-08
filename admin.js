// =========================================================
// CENTRAL ADMIN
// Autenticação real via Supabase Auth + checagem de admin
// =========================================================

let temporadaAtiva = null;
let timesCache = [];
let jogosCache = [];
let jogadoresCache = [];

// ---------- LOGIN / SESSÃO ----------

async function fazerLogin() {
  try {
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;

    if (!email || !senha) {
      notificar("Preencha e-mail e senha.", "aviso");
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
  ["abaJogos", "abaTimes", "abaJogadores", "abaNoticias"].forEach(a => {
    document.getElementById(a).classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");

  document.querySelectorAll(".tabs-row .tab-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
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

  ["timeCasa", "timeFora", "timeJogador", "timeTabela"].forEach(id => {
    document.getElementById(id).innerHTML = "";
  });

  timesCache.forEach(t => {
    const opt = `<option value="${t.id}">${t.nome}</option>`;
    document.getElementById("timeCasa").innerHTML += opt;
    document.getElementById("timeFora").innerHTML += opt;
    document.getElementById("timeJogador").innerHTML += opt;
    document.getElementById("timeTabela").innerHTML += opt;
  });

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
      <div class="meta">${t.pontos} pts · ${t.jogos} jogos · SG ${t.saldo}</div>
      <div class="actions">
        <button class="btn btn-sm btn-secondary" onclick='editarTime(${JSON.stringify(t)})'>Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirTime('${t.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

function editarTime(t) {
  document.querySelector('[onclick*="abaTimes"]')?.click();
  document.getElementById("timeId").value = t.id;
  document.getElementById("nomeTime").value = t.nome || "";
  document.getElementById("siglaTime").value = t.sigla || "";
  document.getElementById("escudoTime").value = t.escudo_url || "";
  document.getElementById("cidadeTime").value = t.cidade || "";
  document.getElementById("estadioTime").value = t.estadio || "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function limparFormularioTime() {
  document.getElementById("timeId").value = "";
  document.getElementById("nomeTime").value = "";
  document.getElementById("siglaTime").value = "";
  document.getElementById("escudoTime").value = "";
  document.getElementById("cidadeTime").value = "";
  document.getElementById("estadioTime").value = "";
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
  };

  if (!time.nome) { notificar("Informe o nome do time.", "aviso"); return; }

  let error;
  if (id) {
    ({ error } = await supabaseClient.from("times").update(time).eq("id", id));
  } else {
    ({ error } = await supabaseClient.from("times").insert([time]));
  }

  if (error) { notificar(error.message, "erro"); return; }

  notificar("Time salvo!");
  limparFormularioTime();
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
  await carregarTimesAdmin();
}

// ================= JOGOS =================

function dadosJogo() {
  return {
    temporada_id: temporadaAtiva.id,
    rodada: Number(document.getElementById("rodada").value || 0),
    time_casa_id: document.getElementById("timeCasa").value,
    time_fora_id: document.getElementById("timeFora").value,
    placar_casa: document.getElementById("placar_casa").value === "" ? null : Number(document.getElementById("placar_casa").value),
    placar_fora: document.getElementById("placar_fora").value === "" ? null : Number(document.getElementById("placar_fora").value),
    local: document.getElementById("local").value,
    data_jogo: document.getElementById("data_jogo").value || null,
    hora_jogo: document.getElementById("hora_jogo").value,
    status: document.getElementById("status").value,
    capacidade: document.getElementById("capacidade").value,
    foto_estadio: document.getElementById("foto_estadio").value,
    estatisticas: document.getElementById("estatisticas").value,
    hora_inicio_simulacao: document.getElementById("hora_inicio_simulacao").value || null,
  };
}

async function salvarJogo() {
  const id = document.getElementById("jogoId").value;
  const jogo = dadosJogo();

  if (!jogo.time_casa_id || !jogo.time_fora_id) {
    notificar("Escolha os dois times.", "aviso");
    return;
  }
  if (jogo.time_casa_id === jogo.time_fora_id) {
    notificar("Os times não podem ser iguais.", "aviso");
    return;
  }

  let jogoId = id;

  if (id) {
    const { error } = await supabaseClient.from("jogos").update(jogo).eq("id", id);
    if (error) { notificar(error.message, "erro"); return; }
  } else {
    const { data, error } = await supabaseClient.from("jogos").insert([{ ...jogo, computado: false }]).select();
    if (error) { notificar(error.message, "erro"); return; }
    jogoId = data[0].id;
  }

  if (jogo.status === "Encerrado") {
    await computarJogo(jogoId);
  } else {
    notificar("Jogo salvo!");
  }

  limparFormularioJogo();
  await carregarJogosAdmin();
}

function resultado(jogo) {
  const pc = Number(jogo.placar_casa || 0);
  const pf = Number(jogo.placar_fora || 0);

  const casa = { pontos: 0, jogos: 1, vitorias: 0, empates: 0, derrotas: 0, gols_pro: pc, gols_contra: pf };
  const fora = { pontos: 0, jogos: 1, vitorias: 0, empates: 0, derrotas: 0, gols_pro: pf, gols_contra: pc };

  if (pc > pf) { casa.pontos = 3; casa.vitorias = 1; fora.derrotas = 1; }
  else if (pc < pf) { fora.pontos = 3; fora.vitorias = 1; casa.derrotas = 1; }
  else { casa.pontos = 1; fora.pontos = 1; casa.empates = 1; fora.empates = 1; }

  return { casa, fora };
}

async function alterarTabela(jogo, modo) {
  const { data: times, error } = await supabaseClient
    .from("times")
    .select("*")
    .in("id", [jogo.time_casa_id, jogo.time_fora_id]);

  if (error) { notificar(error.message, "erro"); return false; }

  const timeCasa = times.find(t => t.id === jogo.time_casa_id);
  const timeFora = times.find(t => t.id === jogo.time_fora_id);

  if (!timeCasa || !timeFora) {
    notificar("Times do jogo não encontrados.", "erro");
    return false;
  }

  const r = resultado(jogo);
  const mult = modo === "somar" ? 1 : -1;

  const novoCasa = {
    pontos: Math.max(0, Number(timeCasa.pontos || 0) + r.casa.pontos * mult),
    jogos: Math.max(0, Number(timeCasa.jogos || 0) + r.casa.jogos * mult),
    vitorias: Math.max(0, Number(timeCasa.vitorias || 0) + r.casa.vitorias * mult),
    empates: Math.max(0, Number(timeCasa.empates || 0) + r.casa.empates * mult),
    derrotas: Math.max(0, Number(timeCasa.derrotas || 0) + r.casa.derrotas * mult),
    gols_pro: Math.max(0, Number(timeCasa.gols_pro || 0) + r.casa.gols_pro * mult),
    gols_contra: Math.max(0, Number(timeCasa.gols_contra || 0) + r.casa.gols_contra * mult),
  };

  const novoFora = {
    pontos: Math.max(0, Number(timeFora.pontos || 0) + r.fora.pontos * mult),
    jogos: Math.max(0, Number(timeFora.jogos || 0) + r.fora.jogos * mult),
    vitorias: Math.max(0, Number(timeFora.vitorias || 0) + r.fora.vitorias * mult),
    empates: Math.max(0, Number(timeFora.empates || 0) + r.fora.empates * mult),
    derrotas: Math.max(0, Number(timeFora.derrotas || 0) + r.fora.derrotas * mult),
    gols_pro: Math.max(0, Number(timeFora.gols_pro || 0) + r.fora.gols_pro * mult),
    gols_contra: Math.max(0, Number(timeFora.gols_contra || 0) + r.fora.gols_contra * mult),
  };

  const c = await supabaseClient.from("times").update(novoCasa).eq("id", timeCasa.id);
  if (c.error) { notificar(c.error.message, "erro"); return false; }

  const f = await supabaseClient.from("times").update(novoFora).eq("id", timeFora.id);
  if (f.error) { notificar(f.error.message, "erro"); return false; }

  return true;
}

async function computarJogo(id) {
  const { data: jogo, error } = await supabaseClient.from("jogos").select("*").eq("id", id).single();
  if (error) { notificar(error.message, "erro"); return; }

  if (jogo.computado === true) {
    notificar("Esse jogo já foi computado. Descompute antes.", "aviso");
    return;
  }

  const ok = await alterarTabela(jogo, "somar");
  if (!ok) return;

  await supabaseClient.from("jogos").update({ computado: true }).eq("id", id);
  notificar("Jogo computado na tabela!");
  await carregarTimesAdmin();
}

async function descomputarJogo(id) {
  if (!confirm("Descomputar esse jogo da tabela?")) return;

  const { data: jogo, error } = await supabaseClient.from("jogos").select("*").eq("id", id).single();
  if (error) { notificar(error.message, "erro"); return; }

  if (jogo.computado !== true) {
    notificar("Esse jogo ainda não está computado.", "aviso");
    return;
  }

  const ok = await alterarTabela(jogo, "subtrair");
  if (!ok) return;

  await supabaseClient.from("jogos").update({ computado: false }).eq("id", id);
  notificar("Jogo descomputado!");
  await carregarJogosAdmin();
  await carregarTimesAdmin();
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

  await supabaseClient.from("gols_jogo").delete().eq("jogo_id", id);
  await supabaseClient.from("eventos_jogo").delete().eq("jogo_id", id);
  await supabaseClient.from("escalacoes_jogo").delete().eq("jogo_id", id);

  const del = await supabaseClient.from("jogos").delete().eq("id", id);
  if (del.error) { notificar(del.error.message, "erro"); return; }

  notificar("Jogo excluído!");
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
  renderizarSelectJogoEvento();
}

function renderizarListaJogosAdmin() {
  const lista = document.getElementById("listaJogosAdmin");
  if (!lista) return;

  if (jogosCache.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum jogo cadastrado ainda.</p>`;
    return;
  }

  lista.innerHTML = jogosCache.map(j => `
    <div class="admin-item">
      <div class="title">${j.rodada}ª — ${j.time_casa?.nome || "?"} ${j.placar_casa ?? "-"} x ${j.placar_fora ?? "-"} ${j.time_fora?.nome || "?"}</div>
      <div class="meta">${j.local || ""} · ${j.status} · Computado: ${j.computado ? "Sim" : "Não"}</div>
      <div class="actions">
        <button class="btn btn-sm btn-secondary" onclick='editarJogo(${JSON.stringify(j)})'>Editar</button>
        <button class="btn btn-sm btn-warning" onclick="descomputarJogo('${j.id}')">Descomputar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirJogo('${j.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

function editarJogo(j) {
  document.querySelector('[onclick*="abaJogos"]')?.click();

  document.getElementById("jogoId").value = j.id;
  document.getElementById("timeCasa").value = j.time_casa_id;
  document.getElementById("timeFora").value = j.time_fora_id;
  document.getElementById("rodada").value = j.rodada || "";
  document.getElementById("local").value = j.local || "";
  document.getElementById("data_jogo").value = j.data_jogo || "";
  document.getElementById("hora_jogo").value = j.hora_jogo || "";
  document.getElementById("placar_casa").value = j.placar_casa ?? "";
  document.getElementById("placar_fora").value = j.placar_fora ?? "";
  document.getElementById("status").value = j.status || "Agendado";
  document.getElementById("capacidade").value = j.capacidade || "";
  document.getElementById("foto_estadio").value = j.foto_estadio || "";
  document.getElementById("estatisticas").value = j.estatisticas || "";
  document.getElementById("hora_inicio_simulacao").value = j.hora_inicio_simulacao ? j.hora_inicio_simulacao.slice(0, 16) : "";

  document.getElementById("jogoEvento").value = j.id;
  aoTrocarJogoEvento();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function limparFormularioJogo() {
  document.getElementById("jogoId").value = "";
  document.getElementById("rodada").value = "";
  document.getElementById("local").value = "";
  document.getElementById("data_jogo").value = "";
  document.getElementById("hora_jogo").value = "";
  document.getElementById("placar_casa").value = "";
  document.getElementById("placar_fora").value = "";
  document.getElementById("status").value = "Agendado";
  document.getElementById("capacidade").value = "";
  document.getElementById("foto_estadio").value = "";
  document.getElementById("estatisticas").value = "";
  document.getElementById("hora_inicio_simulacao").value = "";
}

function renderizarSelectJogoEvento() {
  const select = document.getElementById("jogoEvento");
  select.innerHTML = jogosCache.map(j =>
    `<option value="${j.id}">${j.rodada}ª - ${j.time_casa?.nome || "?"} x ${j.time_fora?.nome || "?"}</option>`
  ).join("");
  aoTrocarJogoEvento();
}

function jogoEventoAtual() {
  const jogoId = document.getElementById("jogoEvento").value;
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

function aoTrocarJogoEvento() {
  const jogo = jogoEventoAtual();
  preencherSelectsTimeDoJogo(jogo, "timeEvento");
  preencherSelectsTimeDoJogo(jogo, "timeEscalacao");
  carregarJogadoresDoTimeEvento();
  carregarJogadoresDoTimeEscalacao();
  carregarEventosDoJogo();
  carregarEscalacaoDoJogo();
}

async function carregarJogadoresDoTimeEvento() {
  const timeId = document.getElementById("timeEvento").value;
  const select = document.getElementById("jogadorEvento");
  if (!timeId) { select.innerHTML = ""; return; }

  const { data, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .eq("time_id", timeId)
    .order("nome", { ascending: true });

  if (error) return;

  select.innerHTML = (data || [])
    .map(j => `<option value="${j.id}" data-nome="${j.nome}">${j.nome}</option>`).join("");
}

async function carregarJogadoresDoTimeEscalacao() {
  const timeId = document.getElementById("timeEscalacao").value;
  const select = document.getElementById("jogadorEscalacao");
  if (!timeId) { select.innerHTML = ""; return; }

  const { data, error } = await supabaseClient
    .from("jogadores")
    .select("*")
    .eq("time_id", timeId)
    .order("nome", { ascending: true });

  if (error) return;

  select.innerHTML = (data || [])
    .map(j => `<option value="${j.id}" data-nome="${j.nome}">${j.nome}</option>`).join("");
}

async function salvarEvento() {
  const jogoId = document.getElementById("jogoEvento").value;
  const timeId = document.getElementById("timeEvento").value;
  const jogadorSelect = document.getElementById("jogadorEvento");
  const jogadorId = jogadorSelect.value || null;
  const jogadorNome = jogadorSelect.selectedOptions[0]?.dataset.nome || "";
  const minuto = document.getElementById("minutoEvento").value;
  const tipo = document.getElementById("tipoEvento").value;
  const descricao = document.getElementById("descricaoEvento").value || null;

  if (!jogoId) { notificar("Escolha o jogo.", "aviso"); return; }
  if (minuto === "") { notificar("Informe o minuto do evento.", "aviso"); return; }

  const evento = {
    jogo_id: jogoId,
    time_id: timeId || null,
    jogador_id: jogadorId,
    jogador_nome: jogadorNome,
    tipo,
    minuto: Number(minuto),
    descricao,
  };

  const { error } = await supabaseClient.from("eventos_jogo").insert([evento]);
  if (error) { notificar(error.message, "erro"); return; }

  // gols contam para o artilheiro, igual ao comportamento anterior
  if ((tipo === "Gol" || tipo === "Pênalti Marcado") && jogadorId) {
    const jogador = jogadoresCache.find(j => j.id === jogadorId);
    if (jogador) {
      await supabaseClient.from("jogadores").update({ gols: (jogador.gols || 0) + 1 }).eq("id", jogadorId);
      await carregarJogadoresAdmin();
    }
  }

  document.getElementById("minutoEvento").value = "";
  document.getElementById("descricaoEvento").value = "";
  notificar("Evento adicionado!");
  carregarEventosDoJogo();
}

async function carregarEventosDoJogo() {
  const jogoId = document.getElementById("jogoEvento").value;
  const area = document.getElementById("listaEventosJogo");
  if (!jogoId) { area.innerHTML = ""; return; }

  const { data, error } = await supabaseClient
    .from("eventos_jogo")
    .select("*")
    .eq("jogo_id", jogoId)
    .order("minuto", { ascending: true });

  if (error) return;

  const icones = {
    "Gol": "⚽", "Gol Contra": "⚽", "Pênalti Marcado": "🥅", "Pênalti Perdido": "❌",
    "Cartão Amarelo": "🟨", "Cartão Vermelho": "🟥", "Substituição": "🔄",
    "Escalação Divulgada": "📋", "Início de Jogo": "🏁", "Fim de Jogo": "⏱️", "Outro": "📝",
  };

  area.innerHTML = (data || []).map(e => `
    <div class="admin-item">
      <div class="title">${icones[e.tipo] || ""} ${e.minuto}' — ${e.tipo}${e.jogador_nome ? " · " + e.jogador_nome : ""}</div>
      <div class="meta">${e.descricao || ""}</div>
      <div class="actions">
        <button class="btn btn-sm btn-danger" onclick="excluirEvento('${e.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

async function excluirEvento(id) {
  if (!confirm("Excluir esse evento?")) return;

  const { error } = await supabaseClient.from("eventos_jogo").delete().eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }

  notificar("Evento excluído!");
  carregarEventosDoJogo();
}

async function salvarEscalacao() {
  const jogoId = document.getElementById("jogoEvento").value;
  const timeId = document.getElementById("timeEscalacao").value;
  const jogadorSelect = document.getElementById("jogadorEscalacao");
  const jogadorId = jogadorSelect.value || null;
  const jogadorNome = jogadorSelect.selectedOptions[0]?.dataset.nome || "";
  const posicao = document.getElementById("posicaoEscalacao").value || null;
  const titular = document.getElementById("titularEscalacao").value === "true";

  if (!jogoId || !timeId || !jogadorNome) {
    notificar("Escolha jogo, time e jogador.", "aviso");
    return;
  }

  const escalacao = {
    jogo_id: jogoId,
    time_id: timeId,
    jogador_id: jogadorId,
    jogador_nome: jogadorNome,
    titular,
    posicao,
  };

  const { error } = await supabaseClient.from("escalacoes_jogo").insert([escalacao]);
  if (error) { notificar(error.message, "erro"); return; }

  document.getElementById("posicaoEscalacao").value = "";
  notificar("Jogador adicionado à escalação!");
  carregarEscalacaoDoJogo();
}

async function carregarEscalacaoDoJogo() {
  const jogoId = document.getElementById("jogoEvento").value;
  const area = document.getElementById("listaEscalacaoJogo");
  if (!jogoId) { area.innerHTML = ""; return; }

  const { data, error } = await supabaseClient
    .from("escalacoes_jogo")
    .select("*")
    .eq("jogo_id", jogoId)
    .order("titular", { ascending: false });

  if (error) return;

  area.innerHTML = (data || []).map(e => `
    <div class="admin-item">
      <div class="title">${e.titular ? "🟢" : "⚪"} ${e.jogador_nome}${e.posicao ? " · " + e.posicao : ""}</div>
      <div class="meta">${e.titular ? "Titular" : "Reserva"}</div>
      <div class="actions">
        <button class="btn btn-sm btn-danger" onclick="excluirEscalacao('${e.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

async function excluirEscalacao(id) {
  if (!confirm("Remover esse jogador da escalação?")) return;

  const { error } = await supabaseClient.from("escalacoes_jogo").delete().eq("id", id);
  if (error) { notificar(error.message, "erro"); return; }

  notificar("Removido da escalação!");
  carregarEscalacaoDoJogo();
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

  if (jogadoresCache.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="font-size:13px;">Nenhum jogador cadastrado ainda.</p>`;
    return;
  }

  const mapaTimes = Object.fromEntries(timesCache.map(t => [t.id, t.nome]));

  lista.innerHTML = jogadoresCache.map(j => `
    <div class="admin-item">
      <div class="title">${j.nome} — ${mapaTimes[j.time_id] || "?"}</div>
      <div class="meta">${j.posicao || ""} · Nº ${j.numero ?? "-"} · ${j.gols} gols · ${j.assistencias} assist.</div>
      <div class="actions">
        <button class="btn btn-sm btn-secondary" onclick='editarJogador(${JSON.stringify(j)})'>Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirJogador('${j.id}')">Excluir</button>
      </div>
    </div>
  `).join("");
}

function editarJogador(j) {
  document.querySelector('[onclick*="abaJogadores"]')?.click();

  document.getElementById("jogadorId").value = j.id;
  document.getElementById("nomeJogador").value = j.nome || "";
  document.getElementById("timeJogador").value = j.time_id || "";
  document.getElementById("posicaoJogador").value = j.posicao || "";
  document.getElementById("numeroJogador").value = j.numero ?? "";
  document.getElementById("golsJogador").value = j.gols || 0;
  document.getElementById("assistenciasJogador").value = j.assistencias || 0;
  document.getElementById("amarelosJogador").value = j.cartoes_amarelos || 0;
  document.getElementById("vermelhosJogador").value = j.cartoes_vermelhos || 0;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function limparFormularioJogador() {
  document.getElementById("jogadorId").value = "";
  document.getElementById("nomeJogador").value = "";
  document.getElementById("posicaoJogador").value = "";
  document.getElementById("numeroJogador").value = "";
  document.getElementById("golsJogador").value = "";
  document.getElementById("assistenciasJogador").value = "";
  document.getElementById("amarelosJogador").value = "";
  document.getElementById("vermelhosJogador").value = "";
}

async function salvarJogador() {
  const id = document.getElementById("jogadorId").value;

  const jogador = {
    nome: document.getElementById("nomeJogador").value.trim(),
    time_id: document.getElementById("timeJogador").value,
    posicao: document.getElementById("posicaoJogador").value.trim(),
    numero: Number(document.getElementById("numeroJogador").value || 0),
    gols: Number(document.getElementById("golsJogador").value || 0),
    assistencias: Number(document.getElementById("assistenciasJogador").value || 0),
    cartoes_amarelos: Number(document.getElementById("amarelosJogador").value || 0),
    cartoes_vermelhos: Number(document.getElementById("vermelhosJogador").value || 0),
  };

  if (!jogador.nome || !jogador.time_id) {
    notificar("Informe nome e time do jogador.", "aviso");
    return;
  }

  let error;
  if (id) {
    ({ error } = await supabaseClient.from("jogadores").update(jogador).eq("id", id));
  } else {
    ({ error } = await supabaseClient.from("jogadores").insert([jogador]));
  }

  if (error) { notificar(error.message, "erro"); return; }

  notificar("Jogador salvo!");
  limparFormularioJogador();
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
