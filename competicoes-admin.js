// =========================================================
// COMPETIÇÕES — ABAS DO ADMIN
// Antes, pra editar Jogos/Times/Jogadores/etc de uma competição
// diferente do Brasileirão era preciso sair do admin, ir em
// "selecionar-competicao.html" (o seletor de TEMA do site público),
// trocar lá e voltar. Este arquivo troca isso por abas de competição
// dentro do próprio admin: cada competição cadastrada em "competicoes"
// (Brasileirão, Libertadores, Sul-Americana, Copa do Brasil...) vira
// uma aba aqui em cima, e as abas de conteúdo logo abaixo (Jogos,
// Times, Jogadores, Técnicos, Rede Social, Temporadas) passam a
// pertencer à competição selecionada.
//
// Reaproveita o MESMO mecanismo já usado pelo site público
// (competicoes.js: localStorage "competicaoSelecionadaSlug" +
// getCompeticaoAtual()) — então trocar de competição aqui no admin
// também é a mesma coisa que trocar de "tema", sem duplicar lógica.
//
// Abas que NÃO pertencem a nenhuma competição (Notícias, BID) ficam
// de fora, na seção "Geral" do admin.html, sempre visíveis.
// =========================================================

// Abas de conteúdo de uma competição em formato normal (pontos
// corridos / grupos): Jogos, Times, Jogadores, Técnicos, Rede Social
// e Temporadas.
const CA_ABAS_PADRAO = [
  { id: "abaJogos", label: "Jogos" },
  { id: "abaTimes", label: "Times" },
  { id: "abaJogadores", label: "Jogadores" },
  { id: "abaTecnicos", label: "Técnicos" },
  { id: "abaRedeSocial", label: "Rede Social" },
  { id: "abaTemporadas", label: "Temporadas" },
];

// Abas de conteúdo de uma competição em mata-mata (ex: Copa do
// Brasil): no lugar de "Jogos" (rodadas de pontos corridos), mostra o
// chaveamento. Mata-mata usa os times de outra competição (ver
// copa-do-brasil-admin.js), então não faz sentido ter "Times" e
// "Jogadores" próprios aqui — só chaveamento, técnicos (escalação) e
// temporadas.
const CA_ABAS_MATA_MATA = [
  { id: "abaCopaDoBrasil", label: "Chaveamento" },
  { id: "abaTecnicos", label: "Técnicos" },
  { id: "abaRedeSocial", label: "Rede Social" },
  { id: "abaTemporadas", label: "Temporadas" },
];

function caEhMataMata(competicao) {
  return competicao?.formato === "mata_mata" || competicao?.slug === "copa-do-brasil";
}

// Monta as abas de competição (linha de cima) + abas de conteúdo
// (linha de baixo). Chamado uma vez na inicialização do admin (ver
// admin.js:iniciarAdmin) — só monta os BOTÕES aqui; quem decide abrir
// a primeira aba de conteúdo é iniciarAdmin(), depois de já ter
// resolvido temporadaAtiva (algumas abas, como Técnicos, dependem
// dela pra carregar dados).
async function iniciarAbasCompeticoesAdmin() {
  const competicoes = await listarCompeticoes();
  const competicaoAtual = await getCompeticaoAtual();

  renderizarTabsCompeticoesAdmin(competicoes, competicaoAtual);
  return montarBotoesConteudoCompeticaoAdmin(competicaoAtual);
}

function renderizarTabsCompeticoesAdmin(competicoes, atual) {
  const container = document.getElementById("tabsCompeticoesAdmin");
  if (!container) return;

  if (!competicoes || !competicoes.length) {
    container.innerHTML = `<p class="text-dim" style="font-size:12.5px;">Nenhuma competição cadastrada.</p>`;
    return;
  }

  container.innerHTML = competicoes.map(c => `
    <button
      class="tab-btn ${atual?.id === c.id ? "active" : ""}"
      onclick="trocarCompeticaoAdmin('${c.slug}')"
    >${c.logo_emoji || "🏆"} ${c.nome_curto}</button>
  `).join("");
}

// Só monta os botões da linha de conteúdo (sem abrir nenhuma aba
// ainda) e devolve o id da primeira, pra quem chamou decidir quando é
// seguro abri-la de fato.
function montarBotoesConteudoCompeticaoAdmin(competicao) {
  const container = document.getElementById("tabsConteudoCompeticaoAdmin");
  if (!container) return null;

  const abas = caEhMataMata(competicao) ? CA_ABAS_MATA_MATA : CA_ABAS_PADRAO;

  container.innerHTML = abas.map((a, i) => `
    <button class="tab-btn ${i === 0 ? "active" : ""}" onclick="abrirAba('${a.id}', this)">${a.label}</button>
  `).join("");

  return abas[0].id;
}

// Troca a competição selecionada (mesmo mecanismo do seletor público)
// e recarrega a página — mais simples e confiável do que tentar
// re-buscar na mão tudo que cada aba do admin já carregou.
function trocarCompeticaoAdmin(slug) {
  localStorage.setItem(COMPETICAO_STORAGE_KEY, slug);
  window.location.reload();
}
