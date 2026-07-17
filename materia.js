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
  const tipo = params.get("tipo"); // "rumor" | "confirmada" | "jogo"

  const area = document.getElementById("materiaConteudo");

  if (!id || !tipo) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Matéria não encontrada</h3></div>`;
    return;
  }

  if (tipo === "jogo") {
    await carregarMateriaFimDeJogo(area, id);
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

// =========================================================
// MATÉRIA DE FIM DE JOGO — texto jornalístico completo gerado a partir
// de um jogo Encerrado, assinado por um "grande veículo" (ge, Goal,
// Lance!, TNT Sports, ESPN, UOL...), igual ao padrão de rumor/
// confirmada acima, mas usando partida-noticias.js como núcleo.
// =========================================================

const MT_PARAGRAFOS_JOGO = [
  (v, p, gv, gp) => `A equipe do ${v} soube aproveitar as oportunidades criadas ao longo da partida e construiu o resultado com eficiência diante do ${p}, em confronto válido pelo Brasileirão.`,
  (v, p, gv, gp) => `Apesar da pressão do ${p} em alguns momentos, o ${v} se mostrou mais organizado e converteu as chances que teve, garantindo os três pontos na tabela.`,
  (v, p, gv, gp) => `O resultado positivo mantém o ${v} confiante para a sequência da competição, enquanto o ${p} agora volta as atenções para a próxima rodada em busca de reação.`,
];

const MT_PARAGRAFOS_EMPATE = [
  (c, f) => `As duas equipes criaram chances, mas pecaram nas finalizações em momentos decisivos, o que explica o empate no placar.`,
  (c, f) => `${c} e ${f} fizeram um confronto equilibrado, sem um domínio claro de nenhum dos dois lados ao longo dos 90 minutos.`,
  (c, f) => `O ponto conquistado por ambos os lados reflete o equilíbrio visto em campo, num jogo movimentado do início ao fim.`,
];

const MT_QUOTES_JOGO = [
  (vencedor) => `"Fizemos o que planejamos durante a semana. O grupo está de parabéns pela entrega dentro de campo", avaliou o técnico do ${vencedor} após a partida.`,
  (vencedor) => `"Sabíamos da dificuldade do jogo, mas conseguimos ser mais efetivos nos momentos certos", disse um dos jogadores do ${vencedor} em entrevista após o apito final.`,
  (vencedor) => `"O resultado é justo pelo que a equipe apresentou. Agora é pensar no próximo desafio", declarou o comandante do ${vencedor}.`,
];

const MT_QUOTES_EMPATE = [
  () => `"Faltou capricho na hora de definir as jogadas, mas o time se doou até o final", avaliou o técnico de um dos lados após a partida.`,
  () => `"Um ponto que não nos deixa satisfeitos, mas o adversário também é qualificado. Seguimos trabalhando", disse um jogador em campo ao fim do confronto.`,
];

async function carregarMateriaFimDeJogo(area, id) {
  const { data: j, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !j || j.status !== "Encerrado") {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Matéria não encontrada</h3><p>Esse jogo pode ainda não ter sido encerrado, ou o link está incorreto.</p></div>`;
    if (error) console.error(error);
    return;
  }

  // Busca os eventos de gol pra listar os autores na matéria, igual a
  // uma cobertura de fim de jogo de verdade.
  const { data: eventos } = await supabaseClient
    .from("eventos_jogo")
    .select("*")
    .eq("jogo_id", id)
    .in("tipo", ["Gol", "Pênalti Marcado", "Gol Contra"])
    .order("minuto", { ascending: true })
    .then(r => r, e => { console.error("eventos_jogo:", e); return { data: [] }; });

  const n = pnJogoParaNoticia(j);
  const nomeCasa = n.timeCasaNome;
  const nomeFora = n.timeForaNome;
  const pc = n.placarCasa;
  const pf = n.placarFora;
  const empate = pc === pf;
  const vencedor = empate ? null : (pc > pf ? nomeCasa : nomeFora);
  const perdedor = empate ? null : (pc > pf ? nomeFora : nomeCasa);

  const paragrafo2 = empate
    ? mtEscolher(MT_PARAGRAFOS_EMPATE, j.id + "-p2")(nomeCasa, nomeFora)
    : mtEscolher(MT_PARAGRAFOS_JOGO, j.id + "-p2")(vencedor, perdedor, pc, pf);

  const quote = empate
    ? mtEscolher(MT_QUOTES_EMPATE, j.id + "-q")()
    : mtEscolher(MT_QUOTES_JOGO, j.id + "-q")(vencedor);

  const assinatura = n.assinatura;

  const golsHtml = (eventos && eventos.length)
    ? `
      <p class="materia-secao-titulo">Gols do jogo</p>
      <ul class="materia-lista-gols">
        ${eventos.map(e => {
          const timeDoGol = e.time_id === j.time_casa_id ? nomeCasa : nomeFora;
          const rotulo = e.tipo === "Gol Contra" ? "gol contra" : (e.tipo === "Pênalti Marcado" ? "pênalti" : "gol");
          return `<li>${e.minuto ?? "-"}' — <b>${e.jogador_nome || "Jogador"}</b> (${timeDoGol}) ${rotulo !== "gol" ? `· ${rotulo}` : ""}</li>`;
        }).join("")}
      </ul>
    `
    : "";

  area.innerHTML = `
    <span class="materia-tag jogo">⚽ Fim de jogo</span>
    <h1 class="materia-titulo">${n.titulo}</h1>
    ${mtBylineHtml(assinatura)}

    <div class="materia-placar-destaque">
      <span>${nomeCasa}</span>
      <span class="placar">${pc} <small>x</small> ${pf}</span>
      <span>${nomeFora}</span>
    </div>

    <div class="materia-corpo">
      <p>Em jogo válido pela <b>${j.rodada}ª rodada</b> do Brasileirão${j.local ? `, disputado no <b>${j.local}</b>` : ""}, ${empate
        ? `<b>${nomeCasa}</b> e <b>${nomeFora}</b> ficaram no empate em <b>${pc} a ${pf}</b>.`
        : `<b>${vencedor}</b> venceu o <b>${perdedor}</b> por <b>${Math.max(pc, pf)} a ${Math.min(pc, pf)}</b>.`}</p>

      <p>${paragrafo2}</p>

      <div class="materia-quote">${quote}</div>

      <p>Com o resultado, as duas equipes seguem de olho na sequência da tabela do Brasileirão, em busca de manter ou melhorar a posição na classificação.</p>
    </div>

    ${golsHtml}
  `;
}

carregarMateria();
