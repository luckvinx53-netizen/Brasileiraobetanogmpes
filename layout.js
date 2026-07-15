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
};

// Itens que ficam escondidos atrás do menu "☰" na topbar — páginas
// secundárias que não cabem na bottom-nav principal.
const MENU_EXTRA_ITEMS = [
  { href: "bid.html", icon: "bid", label: "BID — Transferências" },
  { href: "transfermarkt.html", icon: "transfermarkt", label: "Transfermarkt" },
  { href: "gm-academy.html", icon: "gmacademy", label: "GM Academy" },
];

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
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
    { href: "index.html", icon: "inicio", label: "Início" },
    { href: "jogos.html", icon: "jogos", label: "Jogos" },
    { href: "classificacao.html", icon: "tabela", label: "Tabela" },
    { href: "artilharia.html", icon: "artilharia", label: "Estatísticas" },
    { href: "noticias.html", icon: "noticias", label: "Notícias" },
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
}

// Mostra o item "Meu Time" na navbar somente se o visitante estiver
// logado E for técnico de algum time. Roda depois do menu já estar
// na tela, então não atrasa o carregamento normal da página.
async function adicionarLinkMeuTimeSeTecnico() {
  if (typeof supabaseClient === "undefined") return;

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: vinculo } = await supabaseClient
      .from("tecnicos")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!vinculo) return;

    const nav = document.querySelector(".bottom-nav");
    if (!nav || nav.querySelector('a[href="meu-time.html"]')) return;

    const link = document.createElement("a");
    link.href = "meu-time.html";
    link.innerHTML = `${NAV_ICONS.meutime}<span>Meu Time</span>`;
    nav.appendChild(link);
    marcarNavAtiva();
  } catch (e) {
    console.error("Erro ao checar técnico:", e);
  }
}

document.addEventListener("DOMContentLoaded", montarLayout);
