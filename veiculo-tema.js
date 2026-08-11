// =========================================================
// VEÍCULO-TEMA — dá a cada matéria de fim de jogo a "roupagem" visual
// do veículo de imprensa que a assina (Goal, Lance!, ESPN, UOL, TNT
// Sports, ge), pra imitar de verdade o site de cada um: cabeçalho com
// logo/menu no estilo do veículo, cor de destaque e tipografia.
//
// Chave de ligação: assinatura.nome (vem de PN_VEICULOS, em
// partida-noticias.js) tem que bater com a chave aqui em VT_TEMAS.
// Se algum veículo novo for adicionado lá, adiciona aqui também —
// senão cai no tema "padrao" (visual atual do site, sem quebrar nada).
// =========================================================

const VT_TEMAS = {
  "ge": {
    slug: "ge",
    cor: "#0d2b1f",
    corDestaque: "#00b26e",
    corTexto: "#ffffff",
    fonte: "'Barlow Condensed', sans-serif",
    menu: [
      { label: "Início", href: "index.html" },
      { label: "Futebol", href: "noticias.html" },
      { label: "Brasileirão", href: "classificacao.html" },
      { label: "Vídeos", href: "noticias.html" },
      { label: "Times", href: "times.html" },
    ],
    logoHtml: `<span style="font-family:Georgia,serif;font-weight:900;font-size:22px;letter-spacing:-1px;">g<span style="color:#00b26e;">e</span></span>`,
  },
  "Goal": {
    slug: "goal",
    cor: "#000000",
    corDestaque: "#ffffff",
    corTexto: "#ffffff",
    fonte: "Arial, Helvetica, sans-serif",
    menu: [
      { label: "Ao Vivo", href: "jogos.html" },
      { label: "Ingressos", href: "jogos.html" },
    ],
    logoHtml: `<span style="font-weight:900;font-size:21px;letter-spacing:-.5px;">GOAL<span style="color:#00d448;">!</span></span>`,
  },
  "Lance!": {
    slug: "lance",
    cor: "#00a651",
    corDestaque: "#00a651",
    corTexto: "#ffffff",
    fonte: "Arial, Helvetica, sans-serif",
    menu: [
      { label: "Agenda", href: "jogos.html" },
      { label: "Notícias", href: "__veiculo__" },
      { label: "Times", href: "times.html" },
      { label: "Apostas", href: "bid.html" },
    ],
    logoHtml: `<span style="font-weight:900;font-size:20px;">lance<span style="color:#0a2e1a;">!</span></span>`,
  },
  "TNT Sports": {
    slug: "tnt",
    cor: "#0a0014",
    corDestaque: "#ff0060",
    corTexto: "#ffffff",
    fonte: "Arial, Helvetica, sans-serif",
    menu: [
      { label: "Notícias", href: "__veiculo__" },
      { label: "Mais", href: "noticias.html" },
    ],
    logoHtml: `<span style="font-weight:900;font-size:18px;">TNT <span style="color:#ff0060;">SPORTS</span></span>`,
  },
  "ESPN": {
    slug: "espn",
    cor: "#d1091b",
    corDestaque: "#ffffff",
    corTexto: "#ffffff",
    fonte: "Arial, Helvetica, sans-serif",
    menu: [
      { label: "Futebol", href: "noticias.html" },
      { label: "Mais Esportes", href: "noticias.html" },
      { label: "Vídeos", href: "noticias.html" },
    ],
    logoHtml: `<span style="font-weight:900;font-style:italic;font-size:20px;letter-spacing:-.5px;">ESPN</span>`,
  },
  "UOL Esporte": {
    slug: "uol",
    cor: "#000000",
    corDestaque: "#d1091b",
    corTexto: "#ffffff",
    fonte: "Arial, Helvetica, sans-serif",
    menu: [
      { label: "Futebol", href: "noticias.html" },
      { label: "Times", href: "times.html" },
      { label: "Copa do Mundo", href: "copa-do-brasil.html" },
    ],
    logoHtml: `<span style="font-weight:900;font-size:19px;">UOL <span style="font-weight:400;color:#9aa4a8;">Esporte</span></span>`,
  },
};

const VT_TEMA_PADRAO = null; // sem tema = mantém o visual normal do site

function vtTemaPorNomeVeiculo(nome) {
  return VT_TEMAS[nome] || VT_TEMA_PADRAO;
}

// Monta o cabeçalho fiel ao veículo (logo + menu horizontal), no
// mesmo espírito dos prints de site real: uma faixa colorida no topo,
// logo à esquerda, itens de menu clicáveis à direita/rolando. Cada
// item é um link de verdade — "Notícias"/"Agenda" (que representam o
// próprio veículo) usam "__veiculo__" como marcador e são resolvidos
// aqui para veiculo.html?nome=<veículo>; os demais apontam direto
// pra outra página já existente no site (times.html, jogos.html...).
function vtHeaderHtml(tema, nomeVeiculo) {
  if (!tema) return "";
  const itens = tema.menu.map(i => {
    const href = i.href === "__veiculo__"
      ? `veiculo.html?nome=${encodeURIComponent(nomeVeiculo)}`
      : i.href;
    return `<a class="vt-menu-item" href="${href}">${i.label}</a>`;
  }).join("");
  return `
    <div class="vt-header" style="background:${tema.cor};font-family:${tema.fonte};">
      <div class="vt-header-inner">
        <div class="vt-logo">${tema.logoHtml}</div>
        <div class="vt-menu">${itens}</div>
      </div>
    </div>
  `;
}

// Aplica o tema na página inteira da matéria: injeta o cabeçalho antes
// do conteúdo, marca o <body> com data-veiculo (o CSS usa isso pra
// recolorir tag, quote, título etc.) e troca a cor de status bar do
// navegador (meta theme-color), só pra reforçar a sensação de site
// próprio quando aberto no celular.
function vtAplicarTema(nomeVeiculo) {
  const tema = vtTemaPorNomeVeiculo(nomeVeiculo);
  if (!tema) return;

  document.body.setAttribute("data-veiculo", tema.slug);
  document.body.style.setProperty("--vt-cor", tema.cor);
  document.body.style.setProperty("--vt-destaque", tema.corDestaque);
  document.body.style.setProperty("--vt-texto", tema.corTexto);

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = tema.cor;

  const header = document.createElement("div");
  header.innerHTML = vtHeaderHtml(tema, nomeVeiculo);
  const container = document.querySelector("main.container");
  if (container) container.parentNode.insertBefore(header.firstElementChild, container);
}
