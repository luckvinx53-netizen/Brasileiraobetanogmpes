// =========================================================
// BID — utilidades compartilhadas
// (mapa de cores por time + checagem da janela de transferências)
// =========================================================

// Mapa fixo de cores por nome de time. Chaves em minúsculas, SEM
// acentos e SEM hífen (normalizadas por obterTemaTime abaixo) — assim
// "São Paulo", "RB-Bragantino" e "Atlético-MG" batem certinho com os
// nomes reais salvos no banco, que vêm com acento e hífen.
// Adicione mais conforme precisar.
// "primaria" e "secundaria" viram variáveis CSS aplicadas na página do time.
const TEMAS_TIME = {
  "flamengo":   { primaria: "#E30613", secundaria: "#000000" },
  "palmeiras":  { primaria: "#0B6E36", secundaria: "#0A0A0A" },
  "bahia":      { primaria: "#0033A0", secundaria: "#E30613" },
  "vasco":      { primaria: "#000000", secundaria: "#FFFFFF" },
  "corinthians":{ primaria: "#000000", secundaria: "#FFFFFF" },
  "sao paulo":  { primaria: "#B90E1D", secundaria: "#000000" },
  "santos":     { primaria: "#000000", secundaria: "#FFFFFF" },
  "gremio":     { primaria: "#0090D4", secundaria: "#000000" },
  "internacional": { primaria: "#D50032", secundaria: "#FFFFFF" },
  "atletico mineiro": { primaria: "#000000", secundaria: "#FFFFFF" },
  "atletico mg": { primaria: "#000000", secundaria: "#FFFFFF" },
  "cruzeiro":   { primaria: "#003DA5", secundaria: "#FFFFFF" },
  "botafogo":   { primaria: "#000000", secundaria: "#FFFFFF" },
  "fluminense": { primaria: "#870018", secundaria: "#005C36" },
  "vitoria":    { primaria: "#D50032", secundaria: "#000000" },
  "bragantino":     { primaria: "#FFFFFF", secundaria: "#000000" },
  "red bull bragantino": { primaria: "#FFFFFF", secundaria: "#000000" },
  "rb bragantino": { primaria: "#FFFFFF", secundaria: "#000000" },
  "fortaleza":  { primaria: "#0033A0", secundaria: "#D50032" },
  "ceara":      { primaria: "#000000", secundaria: "#FFFFFF" },
  "sport":      { primaria: "#D50032", secundaria: "#000000" },
  "mirassol":   { primaria: "#FFD400", secundaria: "#006633" },
  "juventude":  { primaria: "#009444", secundaria: "#FFFFFF" },
  // Adicionados: times que estavam sem cor por não existirem no mapa.
  "athletico pr": { primaria: "#CE181E", secundaria: "#000000" },
  "athletico paranaense": { primaria: "#CE181E", secundaria: "#000000" },
  "chapecoense": { primaria: "#1B552A", secundaria: "#FFFFFF" },
  "coritiba":    { primaria: "#046A38", secundaria: "#FFFFFF" },
  "remo":        { primaria: "#002E6D", secundaria: "#FFFFFF" },
};

// Tema padrão para times sem mapa definido
const TEMA_PADRAO = { primaria: "#22C55E", secundaria: "#0A0A0A" };

// Normaliza o nome do time pra bater com as chaves de TEMAS_TIME:
// minúsculas, sem acentos (São → sao) e com hífen/underscore virando
// espaço (Athletico-PR → athletico pr). Sem isso, nomes como "São
// Paulo" (com acento) ou "RB-Bragantino" (com hífen) não batiam com
// as chaves "sao paulo"/"rb bragantino" e caíam no tema padrão verde,
// fazendo o time perder a cor própria.
function normalizarNomeTime(nome) {
  return (nome || "")
    .trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[-_]/g, " ")                              // hífen/underscore → espaço
    .replace(/\s+/g, " ");                              // espaços duplicados → um só
}

function obterTemaTime(nomeTime) {
  const chave = normalizarNomeTime(nomeTime);
  return TEMAS_TIME[chave] || TEMA_PADRAO;
}

// Aplica as cores do time como variáveis CSS no elemento raiz da página.
// Escreve em --tema-time-primaria/secundaria (não direto em
// --tema-primaria/secundaria) porque o seletor de competição
// (competicoes.js) também usa esse mesmo par de variáveis para o tema
// do Brasileirão/outras competições, e roda de forma assíncrona — sem
// essa separação, quem terminasse de carregar por último apagava a cor
// do outro. sincronizarTemaVisual() decide a prioridade final (time > 
// competição > default) toda vez que uma das duas fontes muda.
function aplicarTemaTime(nomeTime) {
  const tema = obterTemaTime(nomeTime);
  document.documentElement.style.setProperty("--tema-time-primaria", tema.primaria);
  document.documentElement.style.setProperty("--tema-time-secundaria", tema.secundaria);
  if (typeof sincronizarTemaVisual === "function") {
    sincronizarTemaVisual();
  } else {
    // Fallback caso competicoes.js não tenha sido carregado nesta página
    document.documentElement.style.setProperty("--tema-primaria", tema.primaria);
    document.documentElement.style.setProperty("--tema-secundaria", tema.secundaria);
  }
}

// ---------------------------------------------------------
// JANELA DE TRANSFERÊNCIAS
// ---------------------------------------------------------

// Retorna { aberta, inicio, fim } consultando configuracoes_gerais
async function obterJanelaBid() {
  const { data, error } = await supabaseClient
    .from("configuracoes_gerais")
    .select("chave, valor")
    .in("chave", ["bid_janela_inicio", "bid_janela_fim"]);

  if (error || !data) return { aberta: false, inicio: null, fim: null };

  const inicioStr = data.find(d => d.chave === "bid_janela_inicio")?.valor;
  const fimStr = data.find(d => d.chave === "bid_janela_fim")?.valor;

  if (!inicioStr || !fimStr) return { aberta: false, inicio: null, fim: null };

  const inicio = new Date(inicioStr);
  const fim = new Date(fimStr);
  const agora = new Date();

  const aberta = !isNaN(inicio) && !isNaN(fim) && agora >= inicio && agora <= fim;

  return { aberta, inicio, fim };
}

// ---------------------------------------------------------
// TRANSFERÊNCIAS — consultas de valor entre times (aba BID > Transferências)
// ---------------------------------------------------------

// Quantas notificações não lidas o time tem (usado pra bolinha da aba Email)
async function contarNotificacoesNaoLidas(timeId) {
  const { count, error } = await supabaseClient
    .from("bid_transferencias")
    .select("id", { count: "exact", head: true })
    .eq("time_dono_id", timeId)
    .eq("lida", false);

  if (error) { console.error(error); return 0; }
  return count || 0;
}
