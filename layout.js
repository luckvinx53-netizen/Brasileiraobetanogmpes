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
};

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
      </div>
    </header>
  `;
}

function renderBottomNav() {
  const items = [
    { href: "index.html", icon: "inicio", label: "Início" },
    { href: "jogos.html", icon: "jogos", label: "Jogos" },
    { href: "classificacao.html", icon: "tabela", label: "Tabela" },
    { href: "times.html", icon: "times", label: "Times" },
    { href: "artilharia.html", icon: "artilharia", label: "Artilharia" },
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
}

document.addEventListener("DOMContentLoaded", montarLayout);
