// =========================================================
// COMPETIÇÕES — seletor global + tema de cor por competição
// Carregado em TODAS as páginas (igual layout.js/utils.js), define
// qual competição está selecionada (guardada em localStorage) e
// aplica o tema de cor dela nas variáveis CSS --tema-primaria /
// --tema-secundaria (mesmo mecanismo já usado em bid.js/time.js).
// =========================================================

const COMPETICAO_STORAGE_KEY = "competicaoSelecionadaSlug";

let competicoesCache = null;       // todas as competições ativas, carregadas 1x
let competicaoAtualCache = null;   // a competição atualmente selecionada

// Busca todas as competições ativas, ordenadas pra exibição no seletor.
async function listarCompeticoes() {
  if (competicoesCache) return competicoesCache;

  const { data, error } = await supabaseClient
    .from("competicoes")
    .select("*")
    .eq("ativa", true)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao carregar competições:", error);
    return [];
  }

  competicoesCache = data || [];
  return competicoesCache;
}

// Retorna a competição selecionada atualmente (lendo do localStorage o
// slug escolhido antes; se não houver escolha salva ou ela não existir
// mais, cai na primeira competição por "ordem" — hoje o Brasileirão).
async function getCompeticaoAtual() {
  if (competicaoAtualCache) return competicaoAtualCache;

  const competicoes = await listarCompeticoes();
  if (!competicoes.length) return null;

  const slugSalvo = localStorage.getItem(COMPETICAO_STORAGE_KEY);
  const escolhida = competicoes.find(c => c.slug === slugSalvo) || competicoes[0];

  competicaoAtualCache = escolhida;
  return escolhida;
}

// Troca a competição selecionada: salva a escolha, aplica o tema de cor
// e recarrega a página atual (mais simples e confiável do que tentar
// re-buscar todos os dados de cada página na mão).
function selecionarCompeticao(slug) {
  localStorage.setItem(COMPETICAO_STORAGE_KEY, slug);
  window.location.reload();
}

// Aplica a cor da competição atual nas variáveis --tema-primaria /
// --tema-secundaria (mesmo padrão usado em bid.js para times), e
// também espelha em --grama/--grama-dim/--grama-bg, que é a variável
// usada na maior parte do design system hoje (botões, links, ícones).
function aplicarTemaCompeticao(competicao) {
  if (!competicao) return;
  const raiz = document.documentElement.style;

  raiz.setProperty("--tema-primaria", competicao.cor_primaria);
  raiz.setProperty("--tema-secundaria", competicao.cor_secundaria);

  raiz.setProperty("--grama", competicao.cor_primaria);
  raiz.setProperty("--grama-dim", sombrearCor(competicao.cor_primaria, 0.25));
  raiz.setProperty("--grama-bg", hexParaRgba(competicao.cor_primaria, 0.12));
}

// Escurece um hex em `fator` (0-1) — usado pra derivar a variante "dim"
// de qualquer cor de competição sem precisar cadastrar 2 tons na mão.
function sombrearCor(hex, fator) {
  const { r, g, b } = hexParaRgbObj(hex);
  const escurecer = (v) => Math.max(0, Math.round(v * (1 - fator)));
  return `rgb(${escurecer(r)}, ${escurecer(g)}, ${escurecer(b)})`;
}

function hexParaRgba(hex, alpha) {
  const { r, g, b } = hexParaRgbObj(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexParaRgbObj(hex) {
  const limpo = hex.replace("#", "");
  const bigint = parseInt(limpo.length === 3
    ? limpo.split("").map(c => c + c).join("")
    : limpo, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

// Monta o HTML do seletor (dropdown) usado no topbar. Chamado pelo
// layout.js ao montar o header.
function seletorCompeticaoHtml(competicoes, atual) {
  if (!competicoes || !competicoes.length) return "";

  return `
    <div id="seletorCompeticao" class="seletor-competicao">
      <button id="btnSeletorCompeticao" class="seletor-competicao-btn" onclick="alternarSeletorCompeticao()">
        <span class="seletor-competicao-emoji">${atual?.logo_emoji || "🏆"}</span>
        <span class="seletor-competicao-nome">${atual?.nome_curto || "Competição"}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="seletor-competicao-seta">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      <div id="painelSeletorCompeticao" class="seletor-competicao-painel hidden">
        ${competicoes.map(c => `
          <button
            class="seletor-competicao-item ${c.slug === atual?.slug ? "active" : ""}"
            style="--cor-item: ${c.cor_primaria};"
            onclick="selecionarCompeticao('${c.slug}')"
          >
            <span class="seletor-competicao-emoji">${c.logo_emoji}</span>
            <span>${c.nome_curto}</span>
            ${c.slug === atual?.slug ? `<span class="seletor-competicao-check">✓</span>` : ""}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function alternarSeletorCompeticao() {
  const painel = document.getElementById("painelSeletorCompeticao");
  if (!painel) return;
  painel.classList.toggle("hidden");
}

document.addEventListener("click", (e) => {
  const painel = document.getElementById("painelSeletorCompeticao");
  const botao = document.getElementById("btnSeletorCompeticao");
  if (!painel || painel.classList.contains("hidden")) return;
  if (!painel.contains(e.target) && e.target !== botao && !botao?.contains(e.target)) {
    painel.classList.add("hidden");
  }
});

// Inicializa o seletor: busca competições + a atual, injeta o HTML no
// slot que o layout.js deixou reservado, e aplica o tema. Chamado pelo
// layout.js dentro de montarLayout(), depois do topbar já estar no DOM.
async function inicializarSeletorCompeticao() {
  const slot = document.getElementById("seletorCompeticaoSlot");
  if (!slot || typeof supabaseClient === "undefined") return;

  const [competicoes, atual] = await Promise.all([
    listarCompeticoes(),
    getCompeticaoAtual(),
  ]);

  slot.outerHTML = seletorCompeticaoHtml(competicoes, atual);
  aplicarTemaCompeticao(atual);
}
