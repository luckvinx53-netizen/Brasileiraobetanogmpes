// =========================================================
// FANTASY — UI pública (fantasy.html)
// =========================================================
// Login/cadastro (mesma conta de Supabase Auth usada no GM Academy),
// mercado de jogadores, escalação por rodada com orçamento, e ranking
// entre os times de fantasy. O CÁLCULO de pontuação fica em fantasy.js
// (carregado antes deste arquivo) — aqui só lemos o resultado já salvo
// em fantasy_pontuacoes.

let fantSessaoAtual = null;
let fantTimeAtual = null; // linha de fantasy_times do usuário logado
let fantTemporadaAtiva = null;
let fantRodadaSelecionada = null; // rodada mais recente com jogo cadastrado
let fantTodosJogadores = []; // cache de jogadores + time, pra filtrar o mercado sem refazer query
let fantEscalacaoAtual = []; // linhas de fantasy_escalacoes da rodada atual, com jogador embutido
let fantFiltroPosicaoAtiva = "Todos";
let fantJaIniciou = false;

document.addEventListener("DOMContentLoaded", fantIniciar);

async function fantIniciar() {
  fantMostrarTela("carregando");

  const { data: { session } } = await supabaseClient.auth.getSession();
  fantSessaoAtual = session;

  if (session) {
    fantJaIniciou = true;
    await fantCarregarTudo();
  } else {
    fantMostrarTela("login");
  }

  supabaseClient.auth.onAuthStateChange((_evento, novaSessao) => {
    fantSessaoAtual = novaSessao;
    if (!novaSessao) {
      fantJaIniciou = false;
      fantTimeAtual = null;
      fantMostrarTela("login");
      return;
    }
    if (fantJaIniciou && fantTimeAtual?.user_id === novaSessao.user.id) return;
    fantJaIniciou = true;
    fantCarregarTudo();
  });
}

function fantMostrarTela(nome) {
  const telas = ["Carregando", "Login", "Cadastro", "Principal"];
  telas.forEach(t => document.getElementById(`fantTela${t}`)?.classList.add("hidden"));
  const alvo = document.getElementById(`fantTela${nome.charAt(0).toUpperCase() + nome.slice(1)}`);
  if (alvo) alvo.classList.remove("hidden");
}

function fantMostrarCadastro() {
  fantMostrarTela("cadastro");
}

// ---------------------------------------------------------
// LOGIN / CADASTRO — mesma auth.users do GM Academy, mas fantasy_times
// não depende da tabela "tecnicos": qualquer conta pode ter um time de
// fantasy, mesmo quem nunca se cadastrou como técnico.
// ---------------------------------------------------------

async function fantFazerLogin() {
  const email = document.getElementById("fantLoginEmail").value.trim();
  const senha = document.getElementById("fantLoginSenha").value;
  if (!email || !senha) { notificar("Preencha e-mail e senha.", "aviso"); return; }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
  if (error) { notificar("Erro no login: " + error.message, "erro"); return; }

  fantSessaoAtual = data.session;
  fantJaIniciou = true;
  await fantCarregarTudo();
}

async function fantCriarConta() {
  const nome = document.getElementById("fantCadastroNome").value.trim();
  const email = document.getElementById("fantCadastroEmail").value.trim();
  const senha = document.getElementById("fantCadastroSenha").value;

  if (!nome || !email || !senha) { notificar("Preencha nome, e-mail e senha.", "aviso"); return; }
  if (senha.length < 6) { notificar("A senha precisa ter pelo menos 6 caracteres.", "aviso"); return; }

  const botao = document.getElementById("fantBtnCadastrar");
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = "Criando conta...";

  try {
    const { data: signUpData, error: erroSignUp } = await supabaseClient.auth.signUp({
      email, password: senha, options: { data: { nome } },
    });

    if (erroSignUp) { notificar("Erro ao criar conta: " + erroSignUp.message, "erro"); return; }

    if (!signUpData.session) {
      notificar("Conta criada! Verifique seu e-mail para confirmar antes de entrar.", "sucesso");
      fantMostrarTela("login");
      return;
    }

    fantSessaoAtual = signUpData.session;
    fantJaIniciou = true;
    await fantCarregarTudo();
  } catch (e) {
    notificar("Erro inesperado: " + e.message, "erro");
    console.error(e);
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}

// ---------------------------------------------------------
// CARREGAMENTO PRINCIPAL
// ---------------------------------------------------------

async function fantCarregarTudo() {
  fantMostrarTela("carregando");

  fantTemporadaAtiva = typeof getTemporadaAtiva === "function" ? await getTemporadaAtiva() : null;
  if (!fantTemporadaAtiva) {
    notificar("Não há temporada ativa no momento.", "erro");
    fantMostrarTela("principal");
    return;
  }

  await fantGarantirTimeFantasy();
  await fantResolverRodadaAtual();
  await fantCarregarJogadores();
  await fantCarregarEscalacaoDaRodada();

  fantMostrarTela("principal");
  fantRenderizarOrcamento();
  fantRenderizarEscalacao();
  fantRenderizarFiltroPosicao();
  fantRenderizarMercado();
}

// Cria a linha em fantasy_times na primeira vez que o usuário acessa,
// se ele ainda não tiver um time de fantasy nesta temporada.
async function fantGarantirTimeFantasy() {
  const { data: timeExistente } = await supabaseClient
    .from("fantasy_times")
    .select("*")
    .eq("user_id", fantSessaoAtual.user.id)
    .eq("temporada_id", fantTemporadaAtiva.id)
    .maybeSingle();

  if (timeExistente) {
    fantTimeAtual = timeExistente;
    return;
  }

  const nomeUsuario = fantSessaoAtual.user.user_metadata?.nome || fantSessaoAtual.user.email.split("@")[0];
  const { data: novoTime, error } = await supabaseClient
    .from("fantasy_times")
    .insert([{
      user_id: fantSessaoAtual.user.id,
      temporada_id: fantTemporadaAtiva.id,
      nome_time: `Time do ${nomeUsuario}`,
    }])
    .select()
    .single();

  if (error) {
    notificar("Erro ao criar seu time de fantasy: " + error.message, "erro");
    return;
  }
  fantTimeAtual = novoTime;
}

// A "rodada atual" do fantasy é a maior rodada com pelo menos um jogo
// cadastrado que ainda não foi computado — ou seja, a próxima rodada
// pra qual ainda faz sentido escalar. Se todas as rodadas já foram
// computadas, cai na última rodada existente (modo "só consulta").
async function fantResolverRodadaAtual() {
  const { data: jogos } = await supabaseClient
    .from("jogos")
    .select("rodada, computado")
    .eq("temporada_id", fantTemporadaAtiva.id)
    .order("rodada", { ascending: true });

  if (!jogos || jogos.length === 0) { fantRodadaSelecionada = 1; return; }

  const rodadaAberta = jogos.find(j => !j.computado);
  fantRodadaSelecionada = rodadaAberta ? rodadaAberta.rodada : Math.max(...jogos.map(j => j.rodada));
}

async function fantCarregarJogadores() {
  const { data, error } = await supabaseClient
    .from("jogadores")
    .select("*, time:times(id, nome, sigla, escudo_url)")
    .order("valor_mercado", { ascending: false });

  if (error) { console.error(error); return; }
  fantTodosJogadores = data || [];
}

async function fantCarregarEscalacaoDaRodada() {
  const { data, error } = await supabaseClient
    .from("fantasy_escalacoes")
    .select("*, jogador:jogadores(*, time:times(id, nome, sigla, escudo_url))")
    .eq("fantasy_time_id", fantTimeAtual.id)
    .eq("rodada", fantRodadaSelecionada);

  if (error) { console.error(error); fantEscalacaoAtual = []; return; }
  fantEscalacaoAtual = data || [];
}

// ---------------------------------------------------------
// ABAS
// ---------------------------------------------------------

function fantTrocarAba(nome) {
  document.querySelectorAll(".fant-tab").forEach(b => b.classList.toggle("ativa", b.dataset.tab === nome));
  document.getElementById("fantAbaEscalacao").classList.toggle("hidden", nome !== "escalacao");
  document.getElementById("fantAbaMercado").classList.toggle("hidden", nome !== "mercado");
  document.getElementById("fantAbaRanking").classList.toggle("hidden", nome !== "ranking");
  if (nome === "ranking") fantCarregarRanking();
}

// ---------------------------------------------------------
// ORÇAMENTO
// ---------------------------------------------------------

function fantValorGastoNaRodada() {
  return fantEscalacaoAtual.reduce((soma, e) => soma + Number(e.preco_no_momento || 0), 0);
}

function fantRenderizarOrcamento() {
  const gasto = fantValorGastoNaRodada();
  const disponivel = Number(fantTimeAtual.orcamento_total) - gasto;
  const el = document.getElementById("fantOrcamentoDisponivel");
  el.textContent = "R$ " + disponivel.toLocaleString("pt-BR");
  el.classList.toggle("negativo", disponivel < 0);
  document.getElementById("fantRodadaAtual").textContent = fantRodadaSelecionada + "ª";
}

// ---------------------------------------------------------
// ESCALAÇÃO (aba "Minha Escalação")
// ---------------------------------------------------------

function fantRenderizarEscalacao() {
  const lista = document.getElementById("fantListaEscalados");
  const vazio = document.getElementById("fantEscalacaoVazia");

  if (fantEscalacaoAtual.length === 0) {
    lista.innerHTML = "";
    vazio.classList.remove("hidden");
    return;
  }
  vazio.classList.add("hidden");

  lista.innerHTML = fantEscalacaoAtual.map(e => {
    const j = e.jogador;
    const fotoHtml = j.foto_url
      ? `<img class="foto" src="${j.foto_url}" alt="${j.nome}">`
      : `<div class="foto-placeholder">${(j.nome || "?").slice(0, 2).toUpperCase()}</div>`;
    return `
      <div class="fant-jogador-linha">
        ${fotoHtml}
        <div class="fant-jogador-info">
          <div class="nome">${j.nome}${e.capitao ? " (C)" : ""}</div>
          <div class="meta">${j.posicao || "—"} · ${j.time?.sigla || j.time?.nome || "—"}</div>
        </div>
        <div class="fant-jogador-preco">R$ ${Number(e.preco_no_momento).toLocaleString("pt-BR")}</div>
        <button class="fant-btn-capitao ${e.capitao ? "ativo" : ""}" onclick="fantDefinirCapitao('${e.jogador_id}')">C</button>
        <button class="fant-btn-remover" onclick="fantRemoverDaEscalacao('${e.jogador_id}')">✕</button>
      </div>
    `;
  }).join("");
}

async function fantRemoverDaEscalacao(jogadorId) {
  const { error } = await supabaseClient
    .from("fantasy_escalacoes")
    .delete()
    .eq("fantasy_time_id", fantTimeAtual.id)
    .eq("rodada", fantRodadaSelecionada)
    .eq("jogador_id", jogadorId);

  if (error) { notificar("Erro ao remover: " + error.message, "erro"); return; }

  notificar("Jogador removido do time.", "sucesso");
  await fantCarregarEscalacaoDaRodada();
  fantRenderizarOrcamento();
  fantRenderizarEscalacao();
  fantRenderizarMercado();
}

// Só um capitão por rodada — pontua em dobro (ver fantCarregarRanking).
async function fantDefinirCapitao(jogadorId) {
  const eraCapitao = fantEscalacaoAtual.find(e => e.jogador_id === jogadorId)?.capitao;

  // Desmarca todo mundo primeiro, depois marca só o escolhido (a menos
  // que ele já fosse o capitão — nesse caso, o clique tira a capitania).
  const { error: erroLimpar } = await supabaseClient
    .from("fantasy_escalacoes")
    .update({ capitao: false })
    .eq("fantasy_time_id", fantTimeAtual.id)
    .eq("rodada", fantRodadaSelecionada);

  if (erroLimpar) { notificar("Erro: " + erroLimpar.message, "erro"); return; }

  if (!eraCapitao) {
    const { error: erroMarcar } = await supabaseClient
      .from("fantasy_escalacoes")
      .update({ capitao: true })
      .eq("fantasy_time_id", fantTimeAtual.id)
      .eq("rodada", fantRodadaSelecionada)
      .eq("jogador_id", jogadorId);
    if (erroMarcar) { notificar("Erro: " + erroMarcar.message, "erro"); return; }
  }

  await fantCarregarEscalacaoDaRodada();
  fantRenderizarEscalacao();
}

// ---------------------------------------------------------
// MERCADO (aba "Mercado")
// ---------------------------------------------------------

function fantRenderizarFiltroPosicao() {
  const posicoes = ["Todos", ...new Set(fantTodosJogadores.map(j => j.posicao).filter(Boolean))];
  const container = document.getElementById("fantFiltroPosicao");
  container.innerHTML = posicoes.map(p => `
    <button class="${p === fantFiltroPosicaoAtiva ? "ativo" : ""}" onclick="fantFiltrarPorPosicao('${p}')">${p}</button>
  `).join("");
}

function fantFiltrarPorPosicao(posicao) {
  fantFiltroPosicaoAtiva = posicao;
  fantRenderizarFiltroPosicao();
  fantRenderizarMercado();
}

function fantFiltrarMercado() {
  fantRenderizarMercado();
}

function fantRenderizarMercado() {
  const termoBusca = (document.getElementById("fantBuscaJogador")?.value || "").trim().toLowerCase();
  const idsEscalados = new Set(fantEscalacaoAtual.map(e => e.jogador_id));
  const gasto = fantValorGastoNaRodada();
  const disponivel = Number(fantTimeAtual.orcamento_total) - gasto;

  const filtrados = fantTodosJogadores.filter(j => {
    if (fantFiltroPosicaoAtiva !== "Todos" && j.posicao !== fantFiltroPosicaoAtiva) return false;
    if (termoBusca) {
      const alvo = `${j.nome} ${j.time?.nome || ""}`.toLowerCase();
      if (!alvo.includes(termoBusca)) return false;
    }
    return true;
  });

  const lista = document.getElementById("fantListaMercado");
  if (filtrados.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="text-align:center;padding:20px;font-size:13px;">Nenhum jogador encontrado.</p>`;
    return;
  }

  lista.innerHTML = filtrados.map(j => {
    const jaEscalado = idsEscalados.has(j.id);
    const preco = Number(j.valor_mercado || 0);
    const cabeNoOrcamento = preco <= disponivel;
    const fotoHtml = j.foto_url
      ? `<img class="foto" src="${j.foto_url}" alt="${j.nome}">`
      : `<div class="foto-placeholder">${(j.nome || "?").slice(0, 2).toUpperCase()}</div>`;

    let botao;
    if (jaEscalado) {
      botao = `<button class="fant-btn-add" disabled>No time</button>`;
    } else if (!cabeNoOrcamento) {
      botao = `<button class="fant-btn-add" disabled title="Orçamento insuficiente">Sem saldo</button>`;
    } else {
      botao = `<button class="fant-btn-add" onclick="fantAdicionarNaEscalacao('${j.id}')">Escalar</button>`;
    }

    return `
      <div class="fant-jogador-linha">
        ${fotoHtml}
        <div class="fant-jogador-info">
          <div class="nome">${j.nome}</div>
          <div class="meta">${j.posicao || "—"} · ${j.time?.sigla || j.time?.nome || "—"}</div>
        </div>
        <div class="fant-jogador-preco">R$ ${preco.toLocaleString("pt-BR")}</div>
        ${botao}
      </div>
    `;
  }).join("");
}

async function fantAdicionarNaEscalacao(jogadorId) {
  const jogador = fantTodosJogadores.find(j => j.id === jogadorId);
  if (!jogador) return;

  const gasto = fantValorGastoNaRodada();
  const disponivel = Number(fantTimeAtual.orcamento_total) - gasto;
  const preco = Number(jogador.valor_mercado || 0);

  if (preco > disponivel) {
    notificar("Orçamento insuficiente para escalar este jogador.", "aviso");
    return;
  }

  const { error } = await supabaseClient.from("fantasy_escalacoes").insert([{
    fantasy_time_id: fantTimeAtual.id,
    temporada_id: fantTemporadaAtiva.id,
    rodada: fantRodadaSelecionada,
    jogador_id: jogadorId,
    preco_no_momento: preco,
  }]);

  if (error) {
    notificar("Erro ao escalar: " + error.message, "erro");
    return;
  }

  notificar(`${jogador.nome} escalado!`, "sucesso");
  await fantCarregarEscalacaoDaRodada();
  fantRenderizarOrcamento();
  fantRenderizarEscalacao();
  fantRenderizarMercado();
}

// ---------------------------------------------------------
// RANKING (aba "Ranking")
// ---------------------------------------------------------

// Soma a pontuação de todos os times de fantasy da temporada, rodada a
// rodada, cruzando fantasy_escalacoes com fantasy_pontuacoes (a tabela
// que fantasy.js/reaplicarEstatisticasEventosDoJogo mantém atualizada).
// Feito no client (não em SQL agregada) porque o volume de dados de um
// fantasy amador é pequeno o suficiente pra isso ser tranquilo, e
// mantém a regra do capitão (pontos em dobro) num lugar só, em JS.
async function fantCarregarRanking() {
  const lista = document.getElementById("fantListaRanking");
  lista.innerHTML = `<div class="skeleton" style="height:200px;"></div>`;

  const { data: times, error: erroTimes } = await supabaseClient
    .from("fantasy_times")
    .select("*")
    .eq("temporada_id", fantTemporadaAtiva.id);

  if (erroTimes || !times || times.length === 0) {
    lista.innerHTML = `<p class="text-dim" style="text-align:center;padding:20px;font-size:13px;">Ainda não há times no ranking.</p>`;
    return;
  }

  const { data: todasEscalacoes } = await supabaseClient
    .from("fantasy_escalacoes")
    .select("fantasy_time_id, rodada, jogador_id, capitao")
    .eq("temporada_id", fantTemporadaAtiva.id);

  const { data: todasPontuacoes } = await supabaseClient
    .from("fantasy_pontuacoes")
    .select("rodada, jogador_id, pontos")
    .eq("temporada_id", fantTemporadaAtiva.id);

  const mapaPontos = {}; // "rodada:jogador_id" -> pontos
  (todasPontuacoes || []).forEach(p => { mapaPontos[`${p.rodada}:${p.jogador_id}`] = Number(p.pontos) || 0; });

  const totalPorTime = {}; // fantasy_time_id -> total
  (todasEscalacoes || []).forEach(e => {
    const pontosBase = mapaPontos[`${e.rodada}:${e.jogador_id}`] || 0;
    const pontos = e.capitao ? pontosBase * 2 : pontosBase;
    totalPorTime[e.fantasy_time_id] = (totalPorTime[e.fantasy_time_id] || 0) + pontos;
  });

  const ranking = times
    .map(t => ({ ...t, total: Math.round((totalPorTime[t.id] || 0) * 100) / 100 }))
    .sort((a, b) => b.total - a.total);

  lista.innerHTML = ranking.map((t, i) => `
    <div class="fant-ranking-linha">
      <div class="fant-ranking-pos">${i + 1}º</div>
      <div class="fant-ranking-info">
        <div class="nome-time">${t.nome_time}${t.user_id === fantSessaoAtual.user.id ? " (você)" : ""}</div>
      </div>
      <div class="fant-ranking-pontos">${t.total.toLocaleString("pt-BR")} pts</div>
    </div>
  `).join("");
}
