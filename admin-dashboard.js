// =========================================================
// ADMIN DASHBOARD — sidebar (mobile) + cards de resumo do
// topo do admin.html. Puramente visual/informativo: não
// interfere em nenhuma lógica de cadastro já existente.
// =========================================================

function abrirSidebarAdmin() {
  document.getElementById("adminSidebar")?.classList.add("aberta");
  document.getElementById("adminSidebarOverlay")?.classList.add("aberta");
}

function fecharSidebarAdmin() {
  document.getElementById("adminSidebar")?.classList.remove("aberta");
  document.getElementById("adminSidebarOverlay")?.classList.remove("aberta");
}

// Fecha a sidebar automaticamente ao escolher uma aba no mobile,
// pra não ficar cobrindo o conteúdo depois de navegar.
document.addEventListener("click", (e) => {
  const dentroDaSidebar = e.target.closest("#adminSidebar");
  const ehLinkDeAba = e.target.closest(".tab-btn.sidebar-link") || e.target.closest("#adminSidebar .tab-btn");
  if (dentroDaSidebar && ehLinkDeAba && window.innerWidth <= 860) {
    fecharSidebarAdmin();
  }
});

function admSaudacaoPorHorario() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia 👋";
  if (hora < 18) return "Boa tarde 👋";
  return "Boa noite 👋";
}

async function iniciarDashboardAdmin() {
  const saudacao = document.getElementById("adminSaudacao");
  if (saudacao) saudacao.textContent = admSaudacaoPorHorario();

  if (typeof supabaseClient === "undefined") return;

  // Cada card é independente — se uma consulta falhar, as outras
  // continuam funcionando normalmente (dashboard é só informativo).
  carregarKpiJogos();
  carregarKpiTimes();
  carregarKpiNoticias();
  carregarKpiBid();
}

async function carregarKpiJogos() {
  try {
    const { data, error } = await supabaseClient.from("jogos").select("rodada, computado");
    if (error) throw error;

    const total = data?.length || 0;
    const computados = data?.filter(j => j.computado).length || 0;

    setTexto("admKpiJogos", total);

    const pct = total ? Math.round((computados / total) * 100) : 0;
    const anel = document.getElementById("admAnelJogos");
    if (anel) anel.style.setProperty("--ring-pct", pct);
    setTexto("admAnelJogosTexto", pct + "%");
    setTexto("admAnelJogosLegenda", `${computados} de ${total} jogos computados`);

    montarBarrasRodadas(data || []);
  } catch (e) {
    console.warn("Dashboard: falha ao carregar KPI de jogos", e);
  }
}

function montarBarrasRodadas(jogos) {
  const wrap = document.getElementById("admBarrasRodadas");
  const labelsWrap = document.getElementById("admBarrasRodadasLabels");
  if (!wrap || !labelsWrap) return;

  const contagemPorRodada = {};
  jogos.forEach(j => {
    if (!j.rodada) return;
    contagemPorRodada[j.rodada] = (contagemPorRodada[j.rodada] || 0) + 1;
  });

  const rodadas = Object.keys(contagemPorRodada).map(Number).sort((a, b) => a - b).slice(-8);

  if (!rodadas.length) {
    wrap.innerHTML = `<p class="text-dim" style="font-size:12px;margin:auto;">Nenhum jogo cadastrado ainda.</p>`;
    labelsWrap.innerHTML = "";
    return;
  }

  const max = Math.max(...rodadas.map(r => contagemPorRodada[r]), 1);

  wrap.innerHTML = rodadas.map(r => {
    const altura = Math.max(8, Math.round((contagemPorRodada[r] / max) * 90));
    return `<div class="bar" style="height:${altura}px;" title="Rodada ${r}: ${contagemPorRodada[r]} jogo(s)"></div>`;
  }).join("");

  labelsWrap.innerHTML = rodadas.map(r => `<span>R${r}</span>`).join("");
}

async function carregarKpiTimes() {
  try {
    const { count, error } = await supabaseClient.from("times").select("*", { count: "exact", head: true });
    if (error) throw error;
    setTexto("admKpiTimes", count ?? 0);
  } catch (e) {
    console.warn("Dashboard: falha ao carregar KPI de times", e);
  }
}

async function carregarKpiNoticias() {
  try {
    const { count, error } = await supabaseClient.from("noticias").select("*", { count: "exact", head: true });
    if (error) throw error;
    setTexto("admKpiNoticias", count ?? 0);
  } catch (e) {
    console.warn("Dashboard: falha ao carregar KPI de notícias", e);
  }
}

async function carregarKpiBid() {
  try {
    const { data, error } = await supabaseClient
      .from("configuracoes_gerais")
      .select("chave, valor")
      .in("chave", ["bid_janela_inicio", "bid_janela_fim"]);
    if (error) throw error;

    const inicioStr = data?.find(d => d.chave === "bid_janela_inicio")?.valor;
    const fimStr = data?.find(d => d.chave === "bid_janela_fim")?.valor;

    const anel = document.getElementById("admAnelBid");

    if (!inicioStr || !fimStr) {
      setTexto("admKpiBid", "Fechada");
      setTexto("admAnelBidTexto", "—");
      setTexto("admAnelBidLegenda", "Nenhuma janela configurada");
      if (anel) anel.style.setProperty("--ring-pct", 0);
      return;
    }

    const inicio = new Date(inicioStr);
    const fim = new Date(fimStr);
    const agora = new Date();

    if (agora < inicio) {
      setTexto("admKpiBid", "Em breve");
      setTexto("admAnelBidLegenda", `Abre em ${inicio.toLocaleDateString("pt-BR")}`);
      if (anel) anel.style.setProperty("--ring-pct", 0);
      setTexto("admAnelBidTexto", "0%");
    } else if (agora > fim) {
      setTexto("admKpiBid", "Fechada");
      setTexto("admAnelBidLegenda", `Fechou em ${fim.toLocaleDateString("pt-BR")}`);
      if (anel) anel.style.setProperty("--ring-pct", 100);
      setTexto("admAnelBidTexto", "100%");
    } else {
      const total = fim - inicio;
      const decorrido = agora - inicio;
      const pct = total > 0 ? Math.min(100, Math.round((decorrido / total) * 100)) : 0;
      setTexto("admKpiBid", "Aberta");
      setTexto("admAnelBidLegenda", `Fecha em ${fim.toLocaleDateString("pt-BR")}`);
      if (anel) anel.style.setProperty("--ring-pct", pct);
      setTexto("admAnelBidTexto", pct + "%");
    }
  } catch (e) {
    console.warn("Dashboard: falha ao carregar KPI do BID", e);
  }
}

function setTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

// iniciarDashboardAdmin() é chamada por mostrarConteudoAdmin() em
// admin.js, logo após o login de admin ser validado — momento em que
// supabaseClient e o conteúdo do painel já estão prontos.
