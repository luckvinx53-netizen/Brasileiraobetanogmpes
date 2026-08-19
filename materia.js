// =========================================================
// MATÉRIA COMPLETA — página de "furo de reportagem" ao clicar num
// rumor ou transferência confirmada nas Notícias/Transfermarkt.
// Mostra o texto jornalístico completo (assinado pelo repórter fixo
// do clube, ou por um veículo fictício), e as estatísticas reais do
// jogador na temporada.
// =========================================================

// Parágrafos extras de "contexto", sorteados de forma determinística
// (mesmo id sempre pega o mesmo texto) pra encorpar a matéria além da
// manchete curta usada nos cards. Um conjunto por perfil estatístico do
// jogador (tmPerfilJogador, definido em mercado-noticias.js), pra uma
// matéria de artilheiro não soar igual à de um jogador qualquer.
const MT_PARAGRAFOS_RUMOR_POR_PERFIL = {
  artilheiro: [
    (jog, timeInt, timeDono, j) => `Autor de ${j.gols} gols na temporada, ${jog} vive um momento de destaque no ${timeDono}, o que despertou o interesse do departamento de futebol do ${timeInt}.`,
    (jog, timeInt, timeDono, j) => `A boa fase de ${jog} em campo — já são ${j.gols} gols marcados — chamou a atenção de olheiros do ${timeInt}, que monitoram o desempenho do atleta rodada a rodada.`,
    (jog, timeInt, timeDono, j) => `Com faro de gol reconhecido, ${jog} se tornou peça cobiçada no mercado, e o ${timeInt} não escondeu o interesse em reforçar o ataque.`,
  ],
  garcom: [
    (jog, timeInt, timeDono, j) => `Com ${j.assistencias} assistências na temporada, ${jog} tem sido um dos principais fornecedores de bola de gol do ${timeDono}, o que motivou o contato do ${timeInt}.`,
    (jog, timeInt, timeDono, j) => `A visão de jogo de ${jog}, que já somou ${j.assistencias} passes para gol, é vista pelo ${timeInt} como uma peça capaz de destravar o ataque.`,
    (jog, timeInt, timeDono, j) => `Reconhecido pela qualidade na criação de jogadas, ${jog} entrou no radar do ${timeInt} após uma sequência de boas atuações.`,
  ],
  joia: [
    (jog, timeInt, timeDono, j) => `Aos ${j.idade} anos, ${jog} já chama atenção pelo potencial demonstrado no ${timeDono}, e o ${timeInt} monitora de perto sua evolução.`,
    (jog, timeInt, timeDono, j) => `Um dos nomes mais jovens em evidência do campeonato, ${jog} desperta o interesse do ${timeInt}, que aposta no potencial do atleta a médio prazo.`,
    (jog, timeInt, timeDono, j) => `A projeção em torno de ${jog}, de apenas ${j.idade} anos, fez o departamento de futebol do ${timeInt} antecipar contato com o estafe do jogador.`,
  ],
  veterano: [
    (jog, timeInt, timeDono, j) => `Com a experiência de quem já rodou a Série A, ${jog} é visto pelo ${timeInt} como opção de liderança para o elenco.`,
    (jog, timeInt, timeDono, j) => `A bagagem de ${jog}, hoje no ${timeDono}, é o principal argumento do ${timeInt} para avançar na negociação.`,
    (jog, timeInt, timeDono, j) => `Nos bastidores, dirigentes do ${timeInt} avaliam que a experiência de ${jog} pode ajudar um elenco mais jovem a lidar com a pressão da temporada.`,
  ],
  cartoleiro: [
    (jog, timeInt, timeDono, j) => `Conhecido pela postura combativa em campo, ${jog} chamou atenção do ${timeInt}, que busca reforçar a marcação do time.`,
    (jog, timeInt, timeDono, j) => `Apesar do temperamento forte, refletido nos cartões recebidos, ${jog} é visto pelo ${timeInt} como peça capaz de dar equilíbrio físico ao setor.`,
    (jog, timeInt, timeDono, j) => `O ${timeInt} monitora ${jog} de olho na entrega física do atleta, mesmo com o histórico de cartões na temporada.`,
  ],
  goleiro: [
    (jog, timeInt, timeDono, j) => `De olho em reforçar a meta, o ${timeInt} monitora a situação de ${jog}, hoje no ${timeDono}.`,
    (jog, timeInt, timeDono, j) => `O departamento de futebol do ${timeInt} avalia a contratação de ${jog} para brigar por posição no gol.`,
    (jog, timeInt, timeDono, j) => `Nos bastidores, o ${timeInt} sondou o estafe de ${jog}, goleiro que atua hoje pelo ${timeDono}.`,
  ],
  reserva: [
    (jog, timeInt, timeDono, j) => `Mesmo sem muito destaque estatístico até aqui, ${jog} é visto pelo ${timeInt} como opção de equilíbrio para o elenco.`,
    (jog, timeInt, timeDono, j) => `A informação, apurada com exclusividade, dá conta de que o departamento de futebol do ${timeInt} avalia ${jog} como reforço de profundidade de elenco.`,
    (jog, timeInt, timeDono, j) => `Nos bastidores, dirigentes do ${timeInt} avaliam o custo-benefício da operação envolvendo ${jog}, hoje no ${timeDono}.`,
  ],
  padrao: [
    (jog, timeInt, timeDono, j) => `A informação, apurada com exclusividade, dá conta de que o departamento de futebol do ${timeInt} já iniciou uma sondagem informal para entender a situação contratual de ${jog}, hoje no ${timeDono}.`,
    (jog, timeInt, timeDono, j) => `Segundo pessoas próximas às negociações, o interesse do ${timeInt} em ${jog} não é de agora, mas ganhou força nas últimas semanas com a proximidade da janela de transferências.`,
    (jog, timeInt, timeDono, j) => `Nos bastidores, dirigentes do ${timeInt} avaliam o custo-benefício da operação, considerando o momento de ${jog} no ${timeDono} e o impacto financeiro de uma eventual proposta.`,
  ],
};

const MT_PARAGRAFOS_CONFIRMADA_POR_PERFIL = {
  artilheiro: [
    (jog, timeInt, timeDono, j) => `Com ${j.gols} gols marcados na temporada, ${jog} chega para brigar por posição de titularidade e injetar ainda mais poder de fogo no ataque do ${timeInt}.`,
    (jog, timeInt, timeDono, j) => `A expectativa em torno da contratação é grande: ${jog} deixa o ${timeDono} como um dos artilheiros do campeonato e chega para reforçar o setor ofensivo.`,
    (jog, timeInt, timeDono, j) => `${jog} se despede do ${timeDono} em alta, com ${j.gols} gols na conta, e assina com o ${timeInt} rodeado de expectativa da torcida.`,
  ],
  garcom: [
    (jog, timeInt, timeDono, j) => `Com ${j.assistencias} assistências na bagagem, ${jog} chega ao ${timeInt} para agregar criatividade e municiar os atacantes do elenco.`,
    (jog, timeInt, timeDono, j) => `${jog} deixa o ${timeDono} reconhecido pela visão de jogo e assina com o ${timeInt} rodeado de expectativa.`,
    (jog, timeInt, timeDono, j) => `A chegada de ${jog} é vista como uma injeção de criatividade para o meio-campo do ${timeInt}.`,
  ],
  joia: [
    (jog, timeInt, timeDono, j) => `Aos ${j.idade} anos, ${jog} desembarca no ${timeInt} como uma das principais apostas de longo prazo do clube.`,
    (jog, timeInt, timeDono, j) => `${jog} se despede do ${timeDono} ainda jovem, mas já com moral suficiente para chegar ao ${timeInt} rodeado de expectativa.`,
    (jog, timeInt, timeDono, j) => `A negociação reforça a estratégia do ${timeInt} de investir em jovens talentos como ${jog}.`,
  ],
  veterano: [
    (jog, timeInt, timeDono, j) => `Com a experiência acumulada na carreira, ${jog} chega ao ${timeInt} para agregar liderança a um elenco em formação.`,
    (jog, timeInt, timeDono, j) => `${jog} se despede do ${timeDono} e leva para o ${timeInt} a bagagem de quem já disputou diversas competições na carreira.`,
    (jog, timeInt, timeDono, j) => `A diretoria do ${timeInt} aposta na vivência de ${jog} para ajudar o elenco na reta final da temporada.`,
  ],
  cartoleiro: [
    (jog, timeInt, timeDono, j) => `${jog} chega ao ${timeInt} com fama de aguerrido, characterística que a comissão técnica espera transformar em intensidade dentro de campo.`,
    (jog, timeInt, timeDono, j) => `A negociação, que já vinha sendo tratada nos bastidores, foi selada após as duas diretorias chegarem a um acordo sobre os valores e condições do negócio envolvendo ${jog}.`,
    (jog, timeInt, timeDono, j) => `${jog} se despede do ${timeDono} e assina com o ${timeInt} em meio à expectativa da torcida, que já projeta a estreia do reforço.`,
  ],
  goleiro: [
    (jog, timeInt, timeDono, j) => `${jog} chega ao ${timeInt} para brigar por posição no gol, reforçando a disputa interna da posição.`,
    (jog, timeInt, timeDono, j) => `A negociação, que já vinha sendo tratada nos bastidores, foi selada após as duas diretorias chegarem a um acordo sobre os valores e condições do negócio.`,
    (jog, timeInt, timeDono, j) => `${jog} se despede do ${timeDono} e assina com o ${timeInt} em meio à expectativa da torcida, que já projeta a estreia do reforço.`,
  ],
  reserva: [
    (jog, timeInt, timeDono, j) => `Com a chegada de ${jog}, o ${timeInt} ganha mais uma opção de elenco para a sequência da temporada.`,
    (jog, timeInt, timeDono, j) => `A negociação, que já vinha sendo tratada nos bastidores, foi selada após as duas diretorias chegarem a um acordo sobre os valores e condições do negócio.`,
    (jog, timeInt, timeDono, j) => `${jog} se despede do ${timeDono} e assina com o ${timeInt}, buscando espaço no novo elenco.`,
  ],
  padrao: [
    (jog, timeInt, timeDono, j) => `A negociação, que já vinha sendo tratada nos bastidores, foi selada após as duas diretorias chegarem a um acordo sobre os valores e condições do negócio.`,
    (jog, timeInt, timeDono, j) => `${jog} se despede do ${timeDono} e assina com o ${timeInt} em meio à expectativa da torcida, que já projeta a estreia do reforço.`,
    (jog, timeInt, timeDono, j) => `Com a confirmação, o ${timeInt} reforça o elenco para a sequência da temporada, enquanto o ${timeDono} volta ao mercado em busca de uma reposição.`,
  ],
};

const MT_QUOTES_RUMOR_POR_PERFIL = {
  artilheiro: [
    (jog, j) => `"Um jogador com o faro de gol dele chama atenção de qualquer clube. Vamos acompanhar de perto", disse uma fonte ligada à diretoria, sob condição de anonimato.`,
    (jog, j) => `"Não escondo que é um nome que nos agrada. Os números falam por si", ponderou um dirigente próximo ao caso.`,
  ],
  garcom: [
    (jog, j) => `"É um jogador que enxerga espaços que poucos veem. Faz todo sentido o interesse", comentou uma fonte ligada à negociação.`,
    (jog, j) => `"A criatividade dele pode fazer muita diferença no nosso time", avaliou uma pessoa próxima às conversas.`,
  ],
  joia: [
    (jog, j) => `"É um jogador jovem, mas com um potencial que não passa despercebido", disse uma fonte ligada à diretoria.`,
    (jog, j) => `"Apostar em jovens talentos como ele faz parte do nosso planejamento", ponderou um dirigente próximo ao caso.`,
  ],
  veterano: [
    (jog, j) => `"A experiência dele pode ajudar bastante o grupo, principalmente em momentos de pressão", avaliou uma fonte ligada ao clube.`,
    (jog, j) => `"É um profissional que já viveu muita coisa no futebol. Isso tem valor", disse um dirigente próximo às conversas.`,
  ],
  padrao: [
    (jog, j) => `"Ainda é cedo para falar em algo concreto, mas não escondo que admiro o trabalho do atleta", disse uma fonte ligada à diretoria, sob condição de anonimato.`,
    (jog, j) => `"São conversas preliminares. Nada foi formalizado até o momento", ponderou um dirigente próximo ao caso.`,
    (jog, j) => `"O nome está na mesa, sim. Mas o mercado é assim, muita coisa pode mudar até o fim da janela", comentou uma pessoa com conhecimento da negociação.`,
  ],
};

const MT_QUOTES_CONFIRMADA_POR_PERFIL = {
  artilheiro: [
    (jog, j) => `"Cheguei com muita vontade de continuar marcando gols e ajudando o time a vencer", declarou ${jog} após a confirmação do negócio.`,
    (jog, j) => `"É um artilheiro nato. Vamos precisar muito dos gols dele nessa reta da temporada", afirmou um dirigente do clube que recebe o reforço.`,
  ],
  garcom: [
    (jog, j) => `"Gosto de fazer os companheiros brilharem também. Vim para ajudar da forma que puder", declarou ${jog} após a confirmação do negócio.`,
    (jog, j) => `"A visão de jogo dele vai destravar muita coisa no nosso ataque", afirmou um dirigente do clube.`,
  ],
  joia: [
    (jog, j) => `"Estou muito feliz com essa oportunidade. Sei que ainda tenho muito a evoluir, mas vim com vontade de aprender", declarou ${jog}.`,
    (jog, j) => `"É um investimento no futuro do clube. Acreditamos muito no potencial dele", afirmou um dirigente do clube que recebe o reforço.`,
  ],
  veterano: [
    (jog, j) => `"Chego para somar experiência e ajudar os mais jovens do elenco", declarou ${jog} após a confirmação do negócio.`,
    (jog, j) => `"A vivência dele em outras competições vai ser fundamental pra gente", afirmou um dirigente do clube.`,
  ],
  padrao: [
    (jog, j) => `"Estou muito feliz com essa nova etapa da minha carreira. Chego com muita vontade de ajudar dentro de campo", declarou ${jog} após a confirmação do negócio.`,
    (jog, j) => `"É um jogador que vai agregar muito ao nosso elenco. Trabalhamos duro para viabilizar essa contratação", afirmou um dirigente do clube que recebe o reforço.`,
    (jog, j) => `"Agradeço a confiança de todos que fizeram parte da minha passagem. Levo comigo grandes memórias", disse ${jog} ao se despedir do antigo clube.`,
  ],
};

function mtEscolher(lista, seed) {
  const idx = tmHashString(seed) % lista.length;
  return lista[idx];
}

// Escolhe dentro do conjunto de textos do perfil do jogador — se o
// perfil não tiver conjunto próprio (ex: "reserva" nas citações), cai
// no conjunto "padrao".
function mtEscolherPorPerfil(mapaPorPerfil, jogador, seed) {
  const perfil = typeof tmPerfilJogador === "function" ? tmPerfilJogador(jogador) : "padrao";
  const lista = mapaPorPerfil[perfil] || mapaPorPerfil.padrao;
  return mtEscolher(lista, seed);
}

async function carregarMateria() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const tipo = params.get("tipo"); // "rumor" | "confirmada" | "jogo"
  const veiculoParam = params.get("veiculo"); // opcional — abre a cobertura de UM veículo específico

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

  // Sem &veiculo= na URL: comportamento de sempre (assinatura única
  // sorteada por hash do id). Com &veiculo=X: abre especificamente a
  // cobertura daquele veículo (manchete própria dele), permitindo que
  // a mesma transferência tenha várias matérias de verdade, uma por
  // veículo — só faz sentido pra "confirmada", que é o tipo que gera
  // cobertura múltipla (ver tmCoberturasConfirmada).
  let assinatura = tmAssinaturaMateria(c.id, nomeTimeInt);
  let tituloOverride = null;

  if (tipo === "confirmada" && veiculoParam) {
    const coberturas = tmCoberturasConfirmada(c, jogador, nomeTimeDono, nomeTimeInt);
    const cobertura = coberturas.find(cob => cob.veiculo === veiculoParam);
    if (cobertura) {
      assinatura = { tipo: "veiculo", nome: cobertura.veiculo };
      tituloOverride = cobertura.titulo;
    }
  }

  if (tipo === "confirmada") {
    renderMateriaConfirmada(area, c, jogador, timeDono, timeInteressado, assinatura, tituloOverride);
    await mtRenderOutrasCoberturas(area, c, jogador, timeDono, timeInteressado, veiculoParam);
  } else {
    renderMateriaRumor(area, c, jogador, timeDono, timeInteressado, assinatura);
  }
}

// Lista as OUTRAS coberturas da mesma transferência (outros veículos
// noticiando o mesmo fato) abaixo da matéria — igual à busca do
// Google Notícias, onde o mesmo assunto aparece com várias fontes.
// Não repete a que já está sendo exibida na página atual.
async function mtRenderOutrasCoberturas(area, c, jogador, timeDono, timeInteressado, veiculoAtual) {
  const nomeTimeInt = timeInteressado?.nome || "um clube";
  const nomeTimeDono = timeDono?.nome || "seu clube atual";

  const assinaturaPrincipal = tmAssinaturaMateria(c.id, nomeTimeInt);
  const coberturas = tmCoberturasConfirmada(c, jogador, nomeTimeDono, nomeTimeInt)
    .filter(cob => !(assinaturaPrincipal.tipo === "veiculo" && assinaturaPrincipal.nome === cob.veiculo));

  // Monta a lista completa de "outras fontes": a matéria principal
  // (sem &veiculo=, assinada pelo repórter fixo ou pelo primeiro
  // veículo sorteado) + cada cobertura extra — exceto a que já está
  // sendo exibida na tela agora.
  const todasAsFontes = [
    { veiculo: assinaturaPrincipal.tipo === "veiculo" ? assinaturaPrincipal.nome : null, assinatura: assinaturaPrincipal, principal: true },
    ...coberturas.map(cob => ({ veiculo: cob.veiculo, assinatura: { tipo: "veiculo", nome: cob.veiculo }, titulo: cob.titulo, principal: false })),
  ].filter(f => f.principal ? !veiculoAtual : f.veiculo !== veiculoAtual);

  if (todasAsFontes.length === 0) return;

  const bloco = document.createElement("div");
  bloco.className = "materia-outras-coberturas";
  bloco.innerHTML = `
    <p class="materia-secao-titulo">Mais sobre esse assunto</p>
    <div class="mc-outras-lista">
      ${todasAsFontes.map(f => {
        const href = f.principal
          ? `materia.html?id=${c.id}&tipo=confirmada`
          : `materia.html?id=${c.id}&tipo=confirmada&veiculo=${encodeURIComponent(f.veiculo)}`;
        const tituloFonte = f.principal
          ? tmFraseConfirmada(c.id, jogador?.nome || "Jogador", nomeTimeDono, nomeTimeInt, jogador).replace(/<\/?b>/g, "")
          : f.titulo.replace(/<\/?b>/g, "");
        return `
          <a class="mc-outra-fonte" href="${href}">
            <span class="mc-outra-fonte-veiculo">${tmAssinaturaHtml(f.assinatura)}</span>
            <span class="mc-outra-fonte-titulo">${tituloFonte}</span>
          </a>
        `;
      }).join("")}
    </div>
  `;
  area.appendChild(bloco);
}

function mtBylineHtml(assinatura) {
  const icone = assinatura.tipo === "reporter" ? "📝" : "📰";
  const linkArroba = assinatura.tipo === "reporter"
    ? `<a href="reporter.html?arroba=${encodeURIComponent(assinatura.arroba)}" style="color:inherit;text-decoration:none;">${assinatura.arroba}</a>`
    : "";
  // Quando a assinatura é de um veículo (não repórter fixo), o nome
  // vira link pra página do veículo (veiculo.html) — a "home" com
  // todas as matérias assinadas por aquela redação.
  const nomeExibido = assinatura.tipo === "reporter"
    ? assinatura.nome
    : `<a href="veiculo.html?nome=${encodeURIComponent(assinatura.nome)}" style="color:inherit;text-decoration:none;">Redação ${assinatura.nome}</a>`;
  return `
    <div class="materia-byline">
      <div class="avatar">${icone}</div>
      <div class="info">
        <p class="nome">${nomeExibido}</p>
        <p class="veiculo">${assinatura.tipo === "reporter" ? `${linkArroba} · Cobre o ${assinatura.timeCobertura || ""}` : "Reportagem especial"}</p>
      </div>
    </div>
  `;
}

function renderMateriaRumor(area, c, jogador, timeDono, timeInteressado, assinatura) {
  const jogadorNome = jogador?.nome || "o jogador";
  const nomeTimeInt = timeInteressado?.nome || "um clube";
  const nomeTimeDono = timeDono?.nome || "seu clube atual";

  // Links do jogador e dos dois times, usados nas menções em negrito
  // no texto corrido — mesmo padrão da matéria de fim de jogo.
  const linkJogador = jogador ? `<a href="jogador.html?id=${jogador.id}" style="color:inherit;text-decoration:none;">${jogadorNome}</a>` : jogadorNome;
  const linkTimeInt = timeInteressado ? `<a href="time.html?id=${timeInteressado.id}" style="color:inherit;text-decoration:none;">${nomeTimeInt}</a>` : nomeTimeInt;
  const linkTimeDono = timeDono ? `<a href="time.html?id=${timeDono.id}" style="color:inherit;text-decoration:none;">${nomeTimeDono}</a>` : nomeTimeDono;

  const titulo = tmFraseRumor(c.id, jogadorNome, nomeTimeInt, jogador).replace(/<\/?b>/g, "");
  const comValor = c.valor_consultado && tmRumorComValor(c.id);
  const paragrafo2 = mtEscolherPorPerfil(MT_PARAGRAFOS_RUMOR_POR_PERFIL, jogador, c.id + "-p2")(jogadorNome, nomeTimeInt, nomeTimeDono, jogador || {});
  const quote = mtEscolherPorPerfil(MT_QUOTES_RUMOR_POR_PERFIL, jogador, c.id + "-q")(jogadorNome, jogador || {});

  assinatura.timeCobertura = nomeTimeInt;

  area.innerHTML = `
    <span class="materia-tag rumor">🗞️ Rumor</span>
    <h1 class="materia-titulo">${titulo}</h1>
    ${mtBylineHtml(assinatura)}

    <div class="materia-corpo">
      <p>O nome de <b>${linkJogador}</b> voltou a circular nos bastidores do mercado da bola. De acordo com apuração desta reportagem, o <b>${linkTimeInt}</b> monitora a situação do atleta, que atualmente defende o <b>${linkTimeDono}</b>.</p>

      <p>${paragrafo2}</p>

      ${comValor ? `<p>Estimativas extraoficiais apontam uma movimentação na casa de <b>R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}</b>, valor que ainda pode ser ajustado caso as conversas avancem.</p>` : `<p>Por ora, o valor da eventual negociação não foi divulgado — os primeiros contatos costumam ser discretos justamente para não elevar as pretensões financeiras envolvidas.</p>`}

      <div class="materia-quote">${quote}</div>

      <p>${c.status === "negociando" ? `As conversas entre as partes já avançaram para uma etapa de negociação mais concreta, mas nenhum acordo foi fechado até o momento.` : `Trata-se, por ora, de uma consulta inicial — o tipo de movimento comum no início de uma janela de transferências, sem garantia de que o negócio avance.`}</p>
    </div>

    <p class="materia-secao-titulo">Sobre ${jogadorNome}</p>
    ${mtJogadorCardHtml(jogador, timeDono)}
  `;
}

function renderMateriaConfirmada(area, c, jogador, timeDono, timeInteressado, assinatura, tituloOverride) {
  const jogadorNome = jogador?.nome || "o jogador";
  const nomeTimeInt = timeInteressado?.nome || "um clube";
  const nomeTimeDono = timeDono?.nome || "seu clube anterior";
  const tipoLabel = { definitivo: "em definitivo", emprestimo: "por empréstimo" };

  // Links do jogador e dos dois times, usados nas menções em negrito
  // no texto corrido — mesmo padrão da matéria de fim de jogo.
  const linkJogador = jogador ? `<a href="jogador.html?id=${jogador.id}" style="color:inherit;text-decoration:none;">${jogadorNome}</a>` : jogadorNome;
  const linkTimeInt = timeInteressado ? `<a href="time.html?id=${timeInteressado.id}" style="color:inherit;text-decoration:none;">${nomeTimeInt}</a>` : nomeTimeInt;
  const linkTimeDono = timeDono ? `<a href="time.html?id=${timeDono.id}" style="color:inherit;text-decoration:none;">${nomeTimeDono}</a>` : nomeTimeDono;

  // Se veio de uma cobertura específica (?veiculo=X), usa a manchete
  // própria daquele veículo; senão, cai no comportamento padrão
  // (frase sorteada pelo hash do id da transferência).
  const titulo = (tituloOverride || tmFraseConfirmada(c.id, jogadorNome, nomeTimeDono, nomeTimeInt, jogador)).replace(/<\/?b>/g, "");
  const paragrafo2 = mtEscolherPorPerfil(MT_PARAGRAFOS_CONFIRMADA_POR_PERFIL, jogador, c.id + "-p2")(jogadorNome, nomeTimeInt, nomeTimeDono, jogador || {});
  const quote = mtEscolherPorPerfil(MT_QUOTES_CONFIRMADA_POR_PERFIL, jogador, c.id + "-q")(jogadorNome, jogador || {});

  assinatura.timeCobertura = nomeTimeInt;

  area.innerHTML = `
    <span class="materia-tag confirmada">✅ Transferência confirmada</span>
    <h1 class="materia-titulo">${titulo}</h1>
    ${mtBylineHtml(assinatura)}

    <div class="materia-corpo">
      <p>É oficial: <b>${linkJogador}</b> é o mais novo reforço do <b>${linkTimeInt}</b>. O clube confirmou a contratação ${c.tipo_contratacao ? tipoLabel[c.tipo_contratacao] : ""}, encerrando a passagem do atleta pelo <b>${linkTimeDono}</b>.</p>

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
function mtJogadorCardHtml(jogador, timeExibido, subtitulo) {
  if (!jogador) return `<p class="text-dim" style="font-size:13px;">Dados do jogador não disponíveis.</p>`;

  const linhaInfo = subtitulo || `${jogador.posicao || "—"} ${jogador.idade ? "· " + jogador.idade + " anos" : ""} · ${timeExibido?.nome || "sem time"}`;

  return `
    <div class="materia-jogador-card" onclick="location.href='jogador.html?id=${jogador.id}'">
      <div class="escudo-placeholder">${jogador.numero ?? "-"}</div>
      <div class="info">
        <h3>${jogador.nome}</h3>
        <p>${linhaInfo}</p>
        <p style="margin-top:4px;">⚽ ${jogador.gols || 0} gols · 🎯 ${jogador.assistencias || 0} assist. · 🟨 ${jogador.cartoes_amarelos || 0} · 🟥 ${jogador.cartoes_vermelhos || 0}</p>
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

  // Dados completos (foto/posição/estatísticas) de cada jogador que
  // marcou, pra linkar o nome de verdade (não "Transfermarkt") e montar
  // os cards "Sobre o jogador" no fim da matéria, igual ao que já existe
  // nas matérias de rumor/transferência (mtJogadorCardHtml).
  const idsArtilheiros = [...new Set((eventos || []).map(e => e.jogador_id).filter(Boolean))];
  let mapaJogadores = {};
  if (idsArtilheiros.length) {
    const { data: jogadoresGols } = await supabaseClient
      .from("jogadores")
      .select("*, time:time_id(*)")
      .in("id", idsArtilheiros)
      .then(r => r, e => { console.error("jogadores (gols):", e); return { data: [] }; });
    mapaJogadores = Object.fromEntries((jogadoresGols || []).map(jg => [jg.id, jg]));
  }

  const n = pnJogoParaNoticia(j);
  const nomeCasa = n.timeCasaNome;
  const nomeFora = n.timeForaNome;
  const pc = n.placarCasa;
  const pf = n.placarFora;
  const empate = pc === pf;
  const vencedor = empate ? null : (pc > pf ? nomeCasa : nomeFora);
  const perdedor = empate ? null : (pc > pf ? nomeFora : nomeCasa);

  // Links para o time (perfil) e o estádio, reaproveitados no placar em
  // destaque e no texto corrido (qualquer menção em negrito ao nome de
  // um time ou do estádio vira link, igual ao link do jogador nos gols).
  const linkTimeCasa = (texto) => `<a href="time.html?id=${j.time_casa_id}" style="color:inherit;text-decoration:none;">${texto}</a>`;
  const linkTimeFora = (texto) => `<a href="time.html?id=${j.time_fora_id}" style="color:inherit;text-decoration:none;">${texto}</a>`;
  const linkVencedor = (texto) => (vencedor === nomeCasa ? linkTimeCasa(texto) : linkTimeFora(texto));
  const linkPerdedor = (texto) => (perdedor === nomeCasa ? linkTimeCasa(texto) : linkTimeFora(texto));
  const linkEstadio = j.local
    ? `<a href="estadio.html?nome=${encodeURIComponent(j.local)}" style="color:inherit;text-decoration:none;">${j.local}</a>`
    : "";

  const paragrafo2 = empate
    ? mtEscolher(MT_PARAGRAFOS_EMPATE, j.id + "-p2")(nomeCasa, nomeFora)
    : mtEscolher(MT_PARAGRAFOS_JOGO, j.id + "-p2")(vencedor, perdedor, pc, pf);

  const quote = empate
    ? mtEscolher(MT_QUOTES_EMPATE, j.id + "-q")()
    : mtEscolher(MT_QUOTES_JOGO, j.id + "-q")(vencedor);

  const assinatura = n.assinatura;

  // Cada gol vira um card (mesmo componente usado nas matérias de
  // rumor/transferência — mtJogadorCardHtml), na ordem dos minutos, no
  // lugar da antiga lista de texto. O minuto e observações (gol contra/
  // pênalti) aparecem como um selinho no topo do card. Gol contra
  // também ganha card: quem marcou foi ele, mesmo que contra o próprio time.
  const golsHtml = (eventos && eventos.length)
    ? `
      <p class="materia-secao-titulo">Gols do jogo</p>
      ${eventos.map(e => {
        const timeDoGol = e.time_id === j.time_casa_id ? nomeCasa : nomeFora;
        const ehGolContra = e.tipo === "Gol Contra";
        const ehPenalti = e.tipo === "Pênalti Marcado";
        const observacao = ehGolContra ? " · gol contra" : ehPenalti ? " · pênalti" : "";
        const jogadorEvento = e.jogador_id ? mapaJogadores[e.jogador_id] : null;

        if (jogadorEvento) {
          return mtJogadorCardHtml(jogadorEvento, jogadorEvento.time, `${minutoParaEtapaLabel(e.minuto)} · ${timeDoGol}${observacao}`);
        }

        // Sem jogador_id cadastrado (evento antigo/avulso): mantém uma
        // linha simples de texto em vez de um card vazio.
        const nomeAutor = e.jogador_nome || "Autor não identificado";
        return `<p style="font-size:13.5px;color:var(--text-dim);margin:8px 0;">${minutoParaEtapaLabel(e.minuto)} — <b style="color:var(--text);">${nomeAutor}</b> (${timeDoGol})${observacao}</p>`;
      }).join("")}
    `
    : "";

  area.innerHTML = `
    <span class="materia-tag jogo">⚽ Fim de jogo</span>
    <h1 class="materia-titulo">${n.titulo}</h1>
    ${mtBylineHtml(assinatura)}

    <a class="materia-placar-destaque" href="jogo.html?id=${j.id}" style="text-decoration:none;color:inherit;cursor:pointer;">
      <span>${nomeCasa}</span>
      <span class="placar">${pc} <small>x</small> ${pf}</span>
      <span>${nomeFora}</span>
    </a>

    <div class="materia-corpo">
      <p>Em jogo válido pela <b>${j.rodada}ª rodada</b> do Brasileirão${j.local ? `, disputado no <b>${linkEstadio}</b>` : ""}, ${empate
        ? `<b>${linkTimeCasa(nomeCasa)}</b> e <b>${linkTimeFora(nomeFora)}</b> ficaram no empate em <b>${pc} a ${pf}</b>.`
        : `<b>${linkVencedor(vencedor)}</b> venceu o <b>${linkPerdedor(perdedor)}</b> por <b>${Math.max(pc, pf)} a ${Math.min(pc, pf)}</b>.`}</p>

      <p>${paragrafo2}</p>

      <div class="materia-quote">${quote}</div>

      <p>Com o resultado, as duas equipes seguem de olho na sequência da tabela do Brasileirão, em busca de manter ou melhorar a posição na classificação.</p>
    </div>

    ${golsHtml}
  `;

  // Veste a matéria com o visual do veículo que a assina (Goal,
  // Lance!, ESPN, UOL, TNT Sports, ge), imitando o site real dele.
  if (typeof vtAplicarTema === "function") vtAplicarTema(assinatura.nome);
}

carregarMateria();
