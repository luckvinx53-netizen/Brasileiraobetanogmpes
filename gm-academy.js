// =========================================================
// GM ACADEMY — cadastro público de técnico (Supabase Auth),
// escolha de tática favorita e área do técnico licenciado
// (visualizar/aceitar/recusar propostas de clubes).
// =========================================================

let gmSessaoAtual = null;
let gmTecnicoAtual = null; // linha de public.tecnicos do usuário logado

document.addEventListener("DOMContentLoaded", gmIniciar);

async function gmIniciar() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  gmSessaoAtual = session;

  if (!session) {
    gmMostrarTela("escolha");
    return;
  }

  await gmCarregarPerfilLogado();
}

// Busca a linha de tecnicos do usuário logado. Se ele já está
// "contratado" (tem time_id), manda direto pra Meu Time — o GM Academy
// é a porta de entrada só enquanto ele está licenciado ou se cadastrando.
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

  if (tecnico.status === "contratado" && tecnico.time_id) {
    notificar("Você já está em um clube — redirecionando para Meu Time.", "sucesso");
    window.location.href = "meu-time.html";
    return;
  }

  gmMostrarTela("licenciado");
  gmPreencherPerfilLicenciado();
  await gmCarregarPropostas();
}

// ---------------------------------------------------------
// NAVEGAÇÃO ENTRE TELAS
// ---------------------------------------------------------

function gmMostrarTela(nome) {
  const telas = ["Escolha", "Cadastro", "Login", "Licenciado"];
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
  await gmCarregarPerfilLogado();
}

async function gmSair() {
  await supabaseClient.auth.signOut();
  gmSessaoAtual = null;
  gmTecnicoAtual = null;
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
  window.location.href = "meu-time.html";
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
