// =========================================================
// BID — utilidades compartilhadas
// (mapa de cores por time + checagem da janela de transferências)
// =========================================================

// Mapa fixo de cores por nome de time. Adicione mais conforme precisar.
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
  "atletico-mg": { primaria: "#000000", secundaria: "#FFFFFF" },
  "cruzeiro":   { primaria: "#003DA5", secundaria: "#FFFFFF" },
  "botafogo":   { primaria: "#000000", secundaria: "#FFFFFF" },
  "fluminense": { primaria: "#870018", secundaria: "#005C36" },
  "vitoria":    { primaria: "#D50032", secundaria: "#000000" },
  "bragantino":     { primaria: "#FFFFFF", secundaria: "#000000" },
  "red bull bragantino": { primaria: "#FFFFFF", secundaria: "#000000" },
  "fortaleza":  { primaria: "#0033A0", secundaria: "#D50032" },
  "ceara":      { primaria: "#000000", secundaria: "#FFFFFF" },
  "sport":      { primaria: "#D50032", secundaria: "#000000" },
  "mirassol":   { primaria: "#FFD400", secundaria: "#006633" },
  "juventude":  { primaria: "#009444", secundaria: "#FFFFFF" },
};

// Tema padrão para times sem mapa definido
const TEMA_PADRAO = { primaria: "#22C55E", secundaria: "#0A0A0A" };

function obterTemaTime(nomeTime) {
  const chave = (nomeTime || "").trim().toLowerCase();
  return TEMAS_TIME[chave] || TEMA_PADRAO;
}

// Aplica as cores do time como variáveis CSS no elemento raiz da página
function aplicarTemaTime(nomeTime) {
  const tema = obterTemaTime(nomeTime);
  document.documentElement.style.setProperty("--tema-primaria", tema.primaria);
  document.documentElement.style.setProperty("--tema-secundaria", tema.secundaria);
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
