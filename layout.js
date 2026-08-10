// =========================================================
// LAYOUT — topbar e bottom-nav injetados em todas as páginas
// =========================================================

const NAV_ICONS = {
  inicio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>`,
  jogos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
  tabela: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  times: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z"/></svg>`,
  artilharia: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="m8.5 13-1 8 4.5-2.5L16.5 21l-1-8"/></svg>`,
  noticias: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2-2H4V5Z"/><path d="M4 5v14a2 2 0 0 0 2 2h13M8 9h8M8 13h8M8 17h4"/></svg>`,
  meutime: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z"/><path d="M9 12l2 2 4-4"/></svg>`,
  bid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h5"/></svg>`,
  transfermarkt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  gmacademy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>`,
  feed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>`,
  fantasy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 9a8 8 0 0 0 16 0V4H4v5Z"/><path d="M12 17v4M8 21h8"/></svg>`,
  copadobrasil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4"/></svg>`,
};

// Itens que ficam escondidos atrás do menu "☰" na topbar — páginas
// secundárias que não cabem na bottom-nav principal.
const MENU_EXTRA_ITEMS = [
  { href: "copa-do-brasil", icon: "copadobrasil", label: "Copa do Brasil" },
  { href: "feed", icon: "feed", label: "Rede Social" },
  { href: "fantasy", icon: "fantasy", label: "Fantasy — Meu Cartola" },
  { href: "bid", icon: "bid", label: "BID — Transferências" },
  { href: "transfermarkt", icon: "transfermarkt", label: "Transfermarkt" },
  { href: "gm-academy", icon: "gmacademy", label: "GM Academy" },
];

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="topbar-inner">
        <div id="seletorCompeticaoSlot" class="brand">
          <div class="brand-mark">B</div>
          <div class="brand-text">
            <h1>Brasileirão Betano</h1>
            <p>GMPES 2026</p>
          </div>
        </div>
        <div class="topbar-actions">
          <button id="btnMenuExtra" class="btn-menu-extra" aria-label="Mais opções" onclick="alternarMenuExtra()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
          <div id="menuExtraPainel" class="menu-extra-painel hidden">
            ${MENU_EXTRA_ITEMS.map(i => `<a href="${i.href}">${NAV_ICONS[i.icon]}<span>${i.label}</span></a>`).join("")}
          </div>
        </div>
      </div>
    </header>
  `;
}

// Abre/fecha o painel do menu "☰" e fecha ao clicar fora dele.
function alternarMenuExtra() {
  const painel = document.getElementById("menuExtraPainel");
  if (!painel) return;
  painel.classList.toggle("hidden");
}

document.addEventListener("click", (e) => {
  const painel = document.getElementById("menuExtraPainel");
  const botao = document.getElementById("btnMenuExtra");
  if (!painel || painel.classList.contains("hidden")) return;
  if (!painel.contains(e.target) && e.target !== botao && !botao?.contains(e.target)) {
    painel.classList.add("hidden");
  }
});

function renderBottomNav() {
  const items = [
    { href: "index", icon: "inicio", label: "Início" },
    { href: "jogos", icon: "jogos", label: "Jogos" },
    { href: "classificacao", icon: "tabela", label: "Tabela" },
    { href: "artilharia", icon: "artilharia", label: "Estatísticas" },
    { href: "noticias", icon: "noticias", label: "Notícias" },
  ];

  return `
    <nav class="bottom-nav">
      ${items.map(i => `
        <a href="${i.href}">
          ${NAV_ICONS[i.icon]}
          <span>${i.label}</span>
        </a>
      `).join("")}
    </nav>
  `;
}

function montarLayout() {
  const topSlot = document.getElementById("topbar-slot");
  const navSlot = document.getElementById("bottomnav-slot");
  if (topSlot) topSlot.outerHTML = renderTopbar();
  if (navSlot) navSlot.outerHTML = renderBottomNav();
  marcarNavAtiva();
  adicionarLinkMeuTimeSeTecnico();

  // Seletor de competição (Brasileirão/Libertadores/Sul-Americana/Copa do
  // Brasil): busca as competições e aplica o tema de cor da selecionada.
  // Fica em competicoes.js, carregado como script compartilhado — se por
  // algum motivo a página não incluir esse script, o slot simplesmente
  // fica com o texto fixo "Brasileirão Betano" (comportamento antigo).
  if (typeof inicializarSeletorCompeticao === "function") {
    inicializarSeletorCompeticao();
  }
}

// Troca o item "GM Academy" do menu "☰" por "Meu Time" quando o
// visitante logado for um técnico contratado (com time_id
// preenchido). Roda depois do menu já estar na tela, então não atrasa
// o carregamento normal da página. Não mexe na bottom-nav — o acesso
// a "Meu Time" fica só dentro do menu "☰", junto com GM Academy/BID/
// Transfermarkt.
async function adicionarLinkMeuTimeSeTecnico() {
  if (typeof supabaseClient === "undefined") return;

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: vinculo } = await supabaseClient
      .from("tecnicos")
      .select("user_id, time_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    // Só ativa "Meu Time" para quem está de fato contratado (com
    // time_id preenchido). Um técnico licenciado (sem clube) não tem
    // o que ver em meu-time — a área dele fica no GM Academy.
    // Usamos só time_id (não o campo status) porque é a fonte de
    // verdade mais confiável.
    if (!vinculo || !vinculo.time_id) return;

    // Menu "☰": troca o item "GM Academy" por "Meu Time", já que um
    // técnico contratado não precisa mais passar pelo GM Academy —
    // a área dele agora é o próprio time.
    const itemGmAcademy = document.querySelector('#menuExtraPainel a[href="gm-academy"]');
    if (itemGmAcademy) {
      itemGmAcademy.href = "meu-time";
      itemGmAcademy.innerHTML = `${NAV_ICONS.meutime}<span>Meu Time</span>`;
    }
  } catch (e) {
    console.error("Erro ao checar técnico:", e);
  }
}

document.addEventListener("DOMContentLoaded", montarLayout);
