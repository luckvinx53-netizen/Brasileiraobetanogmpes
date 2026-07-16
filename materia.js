// =========================================================
// MATÉRIA COMPLETA — página de "furo de reportagem" ao clicar num
// rumor ou transferência confirmada nas Notícias/Transfermarkt.
// Mostra o texto jornalístico completo (assinado pelo repórter fixo
// do clube, ou por um veículo fictício), e as estatísticas reais do
// jogador na temporada.
// =========================================================

// Parágrafos extras de "contexto", sorteados de forma determinística
// (mesmo id sempre pega o mesmo texto) pra encorpar a matéria além da
// manchete curta usada nos cards.
const MT_PARAGRAFOS_RUMOR = [
  (jog, timeInt, timeDono) => `A informação, apurada com exclusividade, dá conta de que o departamento de futebol do ${timeInt} já iniciou uma sondagem informal para entender a situação contratual de ${jog}, hoje no ${timeDono}.`,
  (jog, timeInt, timeDono) => `Segundo pessoas próximas às negociações, o interesse do ${timeInt} em ${jog} não é de agora, mas ganhou força nas últimas semanas com a proximidade da janela de transferências.`,
  (jog, timeInt, timeDono) => `Nos bastidores, dirigentes do ${timeInt} avaliam o custo-benefício da operação, considerando o momento de ${jog} no ${timeDono} e o impacto financeiro de uma eventual proposta.`,
];

const MT_PARAGRAFOS_CONFIRMADA = [
  (jog, timeInt, timeDono) => `A negociação, que já vinha sendo tratada nos bastidores, foi selada após as duas diretorias chegarem a um acordo sobre os valores e condições do negócio.`,
  (jog, timeInt, timeDono) => `${jog} se despede do ${timeDono} e assina com o ${timeInt} em meio à expectativa da torcida, que já projeta a estreia do reforço.`,
  (jog, timeInt, timeDono) => `Com a confirmação, o ${timeInt} reforça o elenco para a sequência da temporada, enquanto o ${timeDono} volta ao mercado em busca de uma reposição.`,
];

const MT_QUOTES_RUMOR = [
  (jog) => `"Ainda é cedo para falar em algo concreto, mas não escondo que admiro o trabalho do atleta", disse uma fonte ligada à diretoria, sob condição de anonimato.`,
  (jog) => `"São conversas preliminares. Nada foi formalizado até o momento", ponderou um dirigente próximo ao caso.`,
  (jog) => `"O nome está na mesa, sim. Mas o mercado é assim, muita coisa pode mudar até o fim da janela", comentou uma pessoa com conhecimento da negociação.`,
];

const MT_QUOTES_CONFIRMADA = [
  (jog) => `"Estou muito feliz com essa nova etapa da minha carreira. Chego com muita vontade de ajudar dentro de campo", declarou ${jog} após a confirmação do negócio.`,
  (jog) => `"É um jogador que vai agregar muito ao nosso elenco. Trabalhamos duro para viabilizar essa contratação", afirmou um dirigente do clube que recebe o reforço.`,
  (jog) => `"Agradeço a confiança de todos que fizeram parte da minha passagem. Levo comigo grandes memórias", disse ${jog} ao se despedir do antigo clube.`,
];

function mtEscolher(lista, seed) {
  const idx = tmHashString(seed) % lista.length;
  return lista[idx];
}

async function carregarMateria() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const tipo = params.get("tipo"); // "rumor" | "confirmada"

  const area = document.getElementById("materiaConteudo");

  if (!id || !tipo) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Matéria não encontrada</h3></div>`;
    return;
  }

  const { data: c, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(*), dono:time_dono_id(*), interessado:time_interessado_id(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !c) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Matéria não encontrada</h3><p>Essa negociação pode ter sido removida ou o link está incorreto.</p></div>`;
    console.error(error);
    return;
  }

  const jogador = c.jogadores;
  const timeDono = c.dono;
  const timeInteressado = c.interessado;
  const jogadorNome = jogador?.nome || "o jogador";
  const nomeTimeInt = timeInteressado?.nome || "um clube";
  const nomeTimeDono = timeDono?.nome || "seu clube atual";

  const assinatura = tmAssinaturaMateria(c.id, nomeTimeInt);

  if (tipo === "confirmada") {
    renderMateriaConfirmada(area, c, jogador, timeDono, timeInteressado, assinatura);
  } else {
    renderMateriaRumor(area, c, jogador, timeDono, timeInteressado, assinatura);
  }
}

function mtBylineHtml(assinatura) {
  const icone = assinatura.tipo === "reporter" ? "📝" : "📰";
  return `
    <div class="materia-byline">
      <div class="avatar">${icone}</div>
      <div class="info">
        <p class="nome">${assinatura.tipo === "reporter" ? assinatura.nome : `Redação ${assinatura.nome}`}</p>
        <p class="veiculo">${assinatura.tipo === "reporter" ? `${assinatura.arroba} · Cobre o ${assinatura.timeCobertura || ""}` : "Reportagem especial"}</p>
      </div>
    </div>
  `;
}

function renderMateriaRumor(area, c, jogador, timeDono, timeInteressado, assinatura) {
  const jogadorNome = jogador?.nome || "o jogador";
  const nomeTimeInt = timeInteressado?.nome || "um clube";
  const nomeTimeDono = timeDono?.nome || "seu clube atual";

  const titulo = tmFraseRumor(c.id, jogadorNome, nomeTimeInt).replace(/<\/?b>/g, "");
  const comValor = c.valor_consultado && tmRumorComValor(c.id);
  const paragrafo2 = mtEscolher(MT_PARAGRAFOS_RUMOR, c.id + "-p2")(jogadorNome, nomeTimeInt, nomeTimeDono);
  const quote = mtEscolher(MT_QUOTES_RUMOR, c.id + "-q")(jogadorNome);

  assinatura.timeCobertura = nomeTimeInt;

  area.innerHTML = `
    <span class="materia-tag rumor">🗞️ Rumor</span>
    <h1 class="materia-titulo">${titulo}</h1>
    ${mtBylineHtml(assinatura)}

    <div class="materia-corpo">
      <p>O nome de <b>${jogadorNome}</b> voltou a circular nos bastidores do mercado da bola. De acordo com apuração desta reportagem, o <b>${nomeTimeInt}</b> monitora a situação do atleta, que atualmente defende o <b>${nomeTimeDono}</b>.</p>

      <p>${paragrafo2}</p>

      ${comValor ? `<p>Estimativas extraoficiais apontam uma movimentação na casa de <b>R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}</b>, valor que ainda pode ser ajustado caso as conversas avancem.</p>` : `<p>Por ora, o valor da eventual negociação não foi divulgado — os primeiros contatos costumam ser discretos justamente para não elevar as pretensões financeiras envolvidas.</p>`}

      <div class="materia-quote">${quote}</div>

      <p>${c.status === "negociando" ? `As conversas entre as partes já avançaram para uma etapa de negociação mais concreta, mas nenhum acordo foi fechado até o momento.` : `Trata-se, por ora, de uma consulta inicial — o tipo de movimento comum no início de uma janela de transferências, sem garantia de que o negócio avance.`}</p>
    </div>

    <p class="materia-secao-titulo">Sobre ${jogadorNome}</p>
    ${mtJogadorCardHtml(jogador, timeDono)}
  `;
}

function renderMateriaConfirmada(area, c, jogador, timeDono, timeInteressado, assinatura) {
  const jogadorNome = jogador?.nome || "o jogador";
  const nomeTimeInt = timeInteressado?.nome || "um clube";
  const nomeTimeDono = timeDono?.nome || "seu clube anterior";
  const tipoLabel = { definitivo: "em definitivo", emprestimo: "por empréstimo" };

  const titulo = `${jogadorNome} é anunciado ${tipoLabel[c.tipo_contratacao] || ""} pelo ${nomeTimeInt}`;
  const paragrafo2 = mtEscolher(MT_PARAGRAFOS_CONFIRMADA, c.id + "-p2")(jogadorNome, nomeTimeInt, nomeTimeDono);
  const quote = mtEscolher(MT_QUOTES_CONFIRMADA, c.id + "-q")(jogadorNome);

  assinatura.timeCobertura = nomeTimeInt;

  area.innerHTML = `
    <span class="materia-tag confirmada">✅ Transferência confirmada</span>
    <h1 class="materia-titulo">${titulo}</h1>
    ${mtBylineHtml(assinatura)}

    <div class="materia-corpo">
      <p>É oficial: <b>${jogadorNome}</b> é o mais novo reforço do <b>${nomeTimeInt}</b>. O clube confirmou a contratação ${c.tipo_contratacao ? tipoLabel[c.tipo_contratacao] : ""}, encerrando a passagem do atleta pelo <b>${nomeTimeDono}</b>.</p>

      <p>${paragrafo2}</p>

      ${c.valor_consultado ? `<p>A negociação foi fechada em <b>R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}</b>, segundo os valores movimentados entre as diretorias.</p>` : `<p>Os valores da negociação não foram divulgados oficialmente pelos clubes envolvidos.</p>`}

      <div class="materia-quote">${quote}</div>

      <p>${c.respondido_em ? `O acordo foi confirmado em ${new Date(c.respondido_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}.` : ""} Com a chegada do reforço, a expectativa é que o atleta seja rapidamente integrado ao grupo para a sequência da temporada.</p>
    </div>

    <p class="materia-secao-titulo">Sobre ${jogadorNome}</p>
    ${mtJogadorCardHtml(jogador, timeInteressado)}
  `;
}

// Card com estatísticas reais do jogador na temporada (gols,
// assistências, cartões) e o time atual dele — dados de verdade do
// banco, não inventados, igual ao que já aparece em jogador.
function mtJogadorCardHtml(jogador, timeExibido) {
  if (!jogador) return `<p class="text-dim" style="font-size:13px;">Dados do jogador não disponíveis.</p>`;

  return `
    <div class="materia-jogador-card" onclick="location.href='jogador?id=${jogador.id}'">
      <div class="escudo-placeholder">${jogador.numero ?? "-"}</div>
      <div class="info">
        <h3>${jogador.nome}</h3>
        <p>${jogador.posicao || "—"} ${jogador.idade ? "· " + jogador.idade + " anos" : ""} · ${timeExibido?.nome || "sem time"}</p>
        <p style="margin-top:4px;">⚽ ${jogador.gols || 0} gols · 🎯 ${jogador.assistencias || 0} assist. · 🟨 ${jogador.amarelos || 0} · 🟥 ${jogador.vermelhos || 0}</p>
      </div>
      <span class="seta">›</span>
    </div>
  `;
}

carregarMateria();
