// =========================================================
// GM ACADEMY — cadastro público de técnico (Supabase Auth),
// escolha de tática favorita e área do técnico licenciado
// (visualizar/aceitar/recusar propostas de clubes).
// =========================================================

let gmSessaoAtual = null;
let gmTecnicoAtual = null; // linha de public.tecnicos do usuário logado
let gmJaIniciou = false; // evita rodar gmCarregarPerfilLogado() em duplicidade

document.addEventListener("DOMContentLoaded", gmIniciar);

async function gmIniciar() {
  // Mostra um estado neutro (nem tela de login nem conteúdo) enquanto
  // verificamos se já existe uma sessão salva no navegador — assim a
  // pessoa não vê o botão "Entrar" piscar antes do sistema perceber
  // que ela já está logada (por exemplo, por ter entrado em Meu Time
  // ou em qualquer outra página do site antes).
  gmMostrarTela("carregando");

  // getSession() é a checagem garantida da sessão já salva no
  // navegador (localStorage) — é o que de fato resolve "reconhecer
  // quem já tem login". onAuthStateChange complementa isso, avisando
  // sobre mudanças que aconteçam DEPOIS da página já carregada (login,
  // logout, token renovado), mas não deve ser a única fonte, porque em
  // algumas situações o evento inicial pode não chegar a tempo.
  const { data: { session } } = await supabaseClient.auth.getSession();
  gmSessaoAtual = session;

  if (session) {
    gmJaIniciou = true;
    await gmCarregarPerfilLogado();
  } else {
    gmMostrarTela("escolha");
  }

  supabaseClient.auth.onAuthStateChange((_evento, novaSessao) => {
    gmSessaoAtual = novaSessao;

    if (!novaSessao) {
      gmJaIniciou = false;
      gmTecnicoAtual = null;
      gmMostrarTela("escolha");
      return;
    }

    // Evita recarregar o perfil de novo à toa quando o Supabase dispara
    // eventos como TOKEN_REFRESHED pra uma sessão que já processamos.
    if (gmJaIniciou && gmTecnicoAtual?.user_id === novaSessao.user.id) return;

    gmJaIniciou = true;
    gmCarregarPerfilLogado();
  });
}

// Busca a linha de tecnicos do usuário logado. Se ele já está
// "contratado" (tem time_id), mostra a tela de "já em um clube" com um
// botão manual pra ir pra Meu Time — sem redirecionar sozinho, pra não
// tirar a pessoa do GM Academy sem ela querer.
async function gmCarregarPerfilLogado() {
  const { data: tecnico, error } = await supabaseClient
    .from("tecnicos")
    .select("*")
    .eq("user_id", gmSessaoAtual.user.id)
    .maybeSingle();

  if (error || !tecnico) {
    // Sessão existe mas ainda não tem perfil de técnico — deixa a
    // pessoa completar o cadastro.
    gmMostrarTela("cadastro");
    return;
  }

  gmTecnicoAtual = tecnico;

  // time_id é a fonte de verdade de "está em um clube" — não confiamos
  // só na coluna status, que pode ficar dessincronizada (por exemplo,
  // em contas vinculadas manualmente antes do GM Academy existir).
  // Não redireciona sozinho: só mostra a tela de "já contratado", com
  // um botão pra quem quiser ir pra Meu Time manualmente.
  if (tecnico.time_id) {
    await gmMostrarTelaContratado();
    return;
  }

  gmMostrarTela("licenciado");
  gmPreencherPerfilLicenciado();
  await gmCarregarPropostas();
}

async function gmMostrarTelaContratado() {
  const { data: time } = await supabaseClient
    .from("times")
    .select("nome")
    .eq("id", gmTecnicoAtual.time_id)
    .maybeSingle();

  gmMostrarTela("contratado");
  document.getElementById("gmNomeTecnicoContratado").textContent = gmTecnicoAtual.nome || "Técnico";
  document.getElementById("gmNomeTimeContratado").textContent = time?.nome || "seu clube";
}

// ---------------------------------------------------------
// NAVEGAÇÃO ENTRE TELAS
// ---------------------------------------------------------

function gmMostrarTela(nome) {
  const telas = ["Carregando", "Escolha", "Cadastro", "Login", "Licenciado", "Contratado"];
  telas.forEach(t => document.getElementById(`gmTela${t}`)?.classList.add("hidden"));
  const alvo = document.getElementById(`gmTela${nome.charAt(0).toUpperCase() + nome.slice(1)}`);
  if (alvo) alvo.classList.remove("hidden");
}

// ---------------------------------------------------------
// CADASTRO (signUp) — cria a conta em Auth + a linha em "tecnicos"
// ---------------------------------------------------------

async function gmCriarPerfil() {
  const nome = document.getElementById("gmCadastroNome").value.trim();
  const tatica = document.getElementById("gmCadastroTatica").value;
  const email = document.getElementById("gmCadastroEmail").value.trim();
  const senha = document.getElementById("gmCadastroSenha").value;

  if (!nome || !email || !senha) {
    notificar("Preencha nome, e-mail e senha.", "aviso");
    return;
  }
  if (senha.length < 6) {
    notificar("A senha precisa ter pelo menos 6 caracteres.", "aviso");
    return;
  }

  const botao = document.getElementById("gmBtnCadastrar");
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = "Criando perfil...";

  try {
    const { data: signUpData, error: erroSignUp } = await supabaseClient.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });

    if (erroSignUp) {
      notificar("Erro ao criar conta: " + erroSignUp.message, "erro");
      return;
    }

    // Se a confirmação de e-mail estiver ativada no projeto, ainda não
    // existe sessão aqui — avisamos a pessoa em vez de travar a tela.
    if (!signUpData.session) {
      notificar("Conta criada! Verifique seu e-mail para confirmar antes de entrar.", "sucesso");
      gmMostrarTela("login");
      return;
    }

    gmSessaoAtual = signUpData.session;
    gmJaIniciou = true;

    const { error: erroInsert } = await supabaseClient.from("tecnicos").insert([{
      user_id: signUpData.user.id,
      nome,
      tatica_favorita: tatica,
      time_id: null,
      status: "licenciado",
    }]);

    if (erroInsert) {
      notificar("Conta criada, mas houve um erro ao salvar seu perfil: " + erroInsert.message, "erro");
      return;
    }

    notificar("Perfil criado! Você já está licenciado e disponível para propostas.", "sucesso");
    await gmCarregarPerfilLogado();
  } catch (e) {
    notificar("Erro inesperado: " + e.message, "erro");
    console.error(e);
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}

// ---------------------------------------------------------
// LOGIN
// ---------------------------------------------------------

async function gmFazerLogin() {
  const email = document.getElementById("gmLoginEmail").value.trim();
  const senha = document.getElementById("gmLoginSenha").value;

  if (!email || !senha) {
    notificar("Preencha e-mail e senha.", "aviso");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });

  if (error) {
    notificar("Erro no login: " + error.message, "erro");
    return;
  }

  gmSessaoAtual = data.session;
  gmJaIniciou = true;
  await gmCarregarPerfilLogado();
}

async function gmSair() {
  await supabaseClient.auth.signOut();
  gmSessaoAtual = null;
  gmTecnicoAtual = null;
  gmJaIniciou = false;
  gmMostrarTela("escolha");
}

// ---------------------------------------------------------
// ÁREA DO LICENCIADO
// ---------------------------------------------------------

function gmPreencherPerfilLicenciado() {
  document.getElementById("gmNomeTecnico").textContent = gmTecnicoAtual.nome || "Técnico";
  document.getElementById("gmTaticaTecnico").textContent = gmTecnicoAtual.tatica_favorita || "—";
}

async function gmCarregarPropostas() {
  const lista = document.getElementById("gmListaPropostas");
  if (!lista) return;

  const { data, error } = await supabaseClient
    .from("propostas_tecnico")
    .select("*, times(nome)")
    .eq("tecnico_id", gmSessaoAtual.user.id)
    .eq("status", "pendente")
    .order("criado_em", { ascending: false });

  if (error) {
    lista.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar propostas</h3></div>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <h3>Nenhuma proposta no momento</h3>
        <p>Assim que um clube demonstrar interesse, a proposta aparece aqui.</p>
      </div>
    `;
    return;
  }

  lista.innerHTML = data.map(p => `
    <div class="gm-proposta-item">
      <div class="gm-proposta-topo">
        <h4>🛡️ ${p.times?.nome || "Clube"}</h4>
        <time>${new Date(p.criado_em).toLocaleDateString("pt-BR")}</time>
      </div>
      <p>${p.mensagem || `O ${p.times?.nome || "clube"} está sem técnico e gostaria de contar com você no comando.`}</p>
      <div class="gm-proposta-acoes">
        <button class="btn btn-primary btn-sm" onclick="gmAceitarProposta('${p.id}', '${p.time_id}')">Aceitar</button>
        <button class="btn btn-ghost btn-sm" onclick="gmRecusarProposta('${p.id}')">Recusar</button>
      </div>
    </div>
  `).join("");
}

// Aceitar uma proposta: vincula o técnico ao clube (time_id + status
// "contratado") e marca a proposta como aceita. As demais propostas
// pendentes desse técnico são recusadas automaticamente, já que ele só
// pode estar em um clube por vez.
async function gmAceitarProposta(propostaId, timeId) {
  const { error: erroUpdate } = await supabaseClient
    .from("tecnicos")
    .update({ time_id: timeId, status: "contratado" })
    .eq("user_id", gmSessaoAtual.user.id);

  if (erroUpdate) {
    notificar("Erro ao aceitar proposta: " + erroUpdate.message, "erro");
    return;
  }

  await supabaseClient
    .from("propostas_tecnico")
    .update({ status: "aceita", respondido_em: new Date().toISOString() })
    .eq("id", propostaId);

  // Recusa automaticamente as outras propostas pendentes, já que o
  // técnico só pode estar em um lugar por vez.
  await supabaseClient
    .from("propostas_tecnico")
    .update({ status: "cancelada", respondido_em: new Date().toISOString() })
    .eq("tecnico_id", gmSessaoAtual.user.id)
    .eq("status", "pendente");

  notificar("Proposta aceita! Bem-vindo ao clube.", "sucesso");
  window.location.href = "meu-time";
}

async function gmRecusarProposta(propostaId) {
  const { error } = await supabaseClient
    .from("propostas_tecnico")
    .update({ status: "recusada", respondido_em: new Date().toISOString() })
    .eq("id", propostaId);

  if (error) {
    notificar("Erro ao recusar proposta: " + error.message, "erro");
    return;
  }

  notificar("Proposta recusada.", "sucesso");
  await gmCarregarPropostas();
}
