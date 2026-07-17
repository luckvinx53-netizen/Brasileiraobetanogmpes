// =========================================================
// MERCADO — núcleo compartilhado entre Transfermarkt e Notícias.
// Gera "rumores" (consultas de transferência que vazaram pra imprensa)
// e lista as transferências já confirmadas, a partir da mesma tabela
// bid_transferencias usada no BID/Meu Time. Fica num arquivo à parte
// pra transfermarkt.js e noticias.js reaproveitarem a mesma lógica e
// os MESMOS rumores (o vazamento é determinístico por id de consulta).
// =========================================================

// Nem toda consulta feita entre técnicos vira rumor público — só uma
// parte "vaza" pra imprensa, do jeito que acontece na vida real. O
// vazamento é decidido de forma DETERMINÍSTICA a partir do id da consulta
// (hash simples), então o mesmo rumor não some/aparece a cada atualização
// da página — ele fica estável até a negociação mudar de status.
function tmHashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const TM_CHANCE_VAZAR = 0.4; // fallback p/ clube sem jornalista fixo cadastrado
const TM_CHANCE_VALOR_NO_RUMOR = 0.5; // metade dos rumores vaza com valor, metade sem

// Taxa de furo por jornalista (chance de a consulta que ele cobre virar
// rumor publicado). Cada clube tem um repórter fixo (ver
// MC_REPORTERES_POR_TIME) e cada um tem sua própria taxa de acerto.
const MC_CHANCE_FURO_POR_TIME = {
  "Flamengo": 0.92,
  "Cruzeiro": 0.90,
  "Botafogo": 0.89,
  "Internacional": 0.88,
  "Palmeiras": 0.87,
  "Corinthians": 0.86,
  "Fluminense": 0.85,
  "Santos": 0.85,
  "Grêmio": 0.84,
  "Gremio": 0.84,
  "Atlético-MG": 0.83,
  "Atletico-MG": 0.83,
  "São Paulo": 0.82,
  "Sao Paulo": 0.82,
  "Bahia": 0.82,
  "Ceará": 0.81,
  "Ceara": 0.81,
  "Vasco": 0.81,
  "Juventude": 0.80,
  "Red Bull Bragantino": 0.80,
  "Bragantino": 0.80,
  "Fortaleza": 0.79,
  "Sport": 0.79,
  "Vitória": 0.78,
  "Vitoria": 0.78,
  "Mirassol": 0.77,
};

// A chance de vazar depende de QUEM cobre o clube interessado na consulta
// (é o furo do jornalista daquele time). Se o clube não tiver jornalista
// fixo com taxa cadastrada, usa o fallback geral (~40%).
function tmConsultaVazou(consultaId, nomeTimeInteressado) {
  const chance = MC_CHANCE_FURO_POR_TIME[nomeTimeInteressado] ?? TM_CHANCE_VAZAR;
  return (tmHashString(consultaId + "-vazou") % 100) / 100 < chance;
}

function tmRumorComValor(consultaId) {
  return (tmHashString(consultaId + "-valor") % 100) / 100 < TM_CHANCE_VALOR_NO_RUMOR;
}

// ---------- PERFIL ESTATÍSTICO DO JOGADOR ----------
// Classifica o jogador puramente pelos números reais dele na temporada
// (gols, assistências, cartões, idade) — nada de "overall" ou nota
// inventada. É esse perfil que decide QUAL conjunto de frases a matéria
// vai usar, pra um artilheiro não soar igual a um jogador qualquer.
// Os limiares abaixo são intencionalmente baixos (times PES costumam
// jogar poucas rodadas simuladas), então valem como "já se destacou
// nessa característica", não como recorde da temporada inteira.
const TM_LIMIAR_ARTILHEIRO = 5;   // gols
const TM_LIMIAR_GARCOM = 4;       // assistências
const TM_LIMIAR_JOVEM = 21;       // idade
const TM_LIMIAR_VETERANO = 33;    // idade
const TM_LIMIAR_CARTOLEIRO = 3;   // pontos de disciplina (vermelho vale 3, amarelo vale 1)

// Retorna o "perfil" dominante do jogador a partir das estatísticas
// reais dele. Pode ter mais de uma característica batendo (ex: jovem E
// artilheiro) — nesse caso prioriza a mais rara/forte primeiro.
function tmPerfilJogador(jogador) {
  if (!jogador) return "padrao";

  const gols = Number(jogador.gols) || 0;
  const assist = Number(jogador.assistencias) || 0;
  const amarelos = Number(jogador.cartoes_amarelos) || 0;
  const vermelhos = Number(jogador.cartoes_vermelhos) || 0;
  const idade = Number(jogador.idade) || 0;
  const disciplina = vermelhos * 3 + amarelos;
  const posicao = (jogador.posicao || "").toLowerCase();
  const ehGoleiro = posicao.includes("gol");

  if (ehGoleiro) return "goleiro";
  if (gols >= TM_LIMIAR_ARTILHEIRO && gols >= assist) return "artilheiro";
  if (assist >= TM_LIMIAR_GARCOM) return "garcom";
  if (disciplina >= TM_LIMIAR_CARTOLEIRO) return "cartoleiro";
  if (idade > 0 && idade <= TM_LIMIAR_JOVEM && (gols > 0 || assist > 0)) return "joia";
  if (idade >= TM_LIMIAR_VETERANO) return "veterano";
  if (gols === 0 && assist === 0) return "reserva";
  return "padrao";
}

// Frases de manchete de RUMOR, uma lista por perfil — escolhida também
// de forma determinística por consulta, pra não ficar mudando de frase
// a cada refresh, mas variando de verdade conforme o momento do atleta.
const TM_FRASES_RUMOR_POR_PERFIL = {
  artilheiro: [
    (jog, time, j) => `Artilheiro em alta: <b>${time}</b> monitora <b>${jog}</b>, autor de ${j.gols} gols na temporada`,
    (jog, time, j) => `De olho no faro de gol: <b>${time}</b> avalia contratar <b>${jog}</b>, que já balançou as redes ${j.gols} vezes`,
    (jog, time, j) => `Reforço no ataque: <b>${time}</b> sondou <b>${jog}</b> após sequência artilheira`,
  ],
  garcom: [
    (jog, time, j) => `De olho no armador: <b>${time}</b> monitora <b>${jog}</b>, dono de ${j.assistencias} assistências na temporada`,
    (jog, time, j) => `Criatividade no radar: <b>${time}</b> avalia a contratação de <b>${jog}</b>`,
    (jog, time, j) => `Bastidores: <b>${time}</b> fez contato para saber da situação de <b>${jog}</b>, um dos garçons do campeonato`,
  ],
  joia: [
    (jog, time, j) => `De olho na promessa: <b>${time}</b> monitora <b>${jog}</b>, de apenas ${j.idade} anos`,
    (jog, time, j) => `Aposta no futuro: <b>${time}</b> sondou o jovem <b>${jog}</b>`,
    (jog, time, j) => `Faro de mercado: <b>${time}</b> avalia contratar a joia <b>${jog}</b>`,
  ],
  veterano: [
    (jog, time, j) => `Experiência no radar: <b>${time}</b> avalia trazer o veterano <b>${jog}</b>`,
    (jog, time, j) => `De olho na bagagem: <b>${time}</b> monitora a situação de <b>${jog}</b>`,
    (jog, time, j) => `Bastidores: <b>${time}</b> sondou <b>${jog}</b>, que soma experiência na Série A`,
  ],
  cartoleiro: [
    (jog, time, j) => `De olho na marcação: <b>${time}</b> monitora <b>${jog}</b>, um dos mais advertidos do campeonato`,
    (jog, time, j) => `Aposta na entrega física: <b>${time}</b> avalia contratar <b>${jog}</b>`,
    (jog, time, j) => `Bastidores: <b>${time}</b> fez contato para avaliar <b>${jog}</b>, conhecido pela postura combativa`,
  ],
  goleiro: [
    (jog, time, j) => `Reforço no gol: <b>${time}</b> monitora a situação de <b>${jog}</b>`,
    (jog, time, j) => `De olho na meta: <b>${time}</b> avalia a contratação de <b>${jog}</b>`,
    (jog, time, j) => `Bastidores: <b>${time}</b> sondou o goleiro <b>${jog}</b>`,
  ],
  reserva: [
    (jog, time, j) => `De olho em opções de elenco: <b>${time}</b> monitora <b>${jog}</b>`,
    (jog, time, j) => `Bastidores: <b>${time}</b> avalia a situação de <b>${jog}</b> como reforço de equilíbrio para o elenco`,
    (jog, time, j) => `Nos corredores do mercado: nome de <b>${jog}</b> circula ligado ao <b>${time}</b>`,
  ],
  padrao: [
    (jog, time, j) => `De olho no mercado: <b>${time}</b> monitora a situação de <b>${jog}</b>`,
    (jog, time, j) => `Bastidores: <b>${time}</b> fez contato para avaliar a contratação de <b>${jog}</b>`,
    (jog, time, j) => `Apurado pela reportagem: <b>${time}</b> sondou o estafe de <b>${jog}</b>`,
    (jog, time, j) => `Nos corredores do mercado: nome de <b>${jog}</b> circula ligado ao <b>${time}</b>`,
    (jog, time, j) => `Fontes internas indicam interesse do <b>${time}</b> em <b>${jog}</b>`,
  ],
};

function tmFraseRumor(consultaId, jog, time, jogador) {
  const perfil = tmPerfilJogador(jogador);
  const lista = TM_FRASES_RUMOR_POR_PERFIL[perfil] || TM_FRASES_RUMOR_POR_PERFIL.padrao;
  const idx = tmHashString(consultaId + "-frase") % lista.length;
  return lista[idx](jog, time, jogador || {});
}

// Frases de manchete de TRANSFERÊNCIA CONFIRMADA, também por perfil —
// um artilheiro fechando com um clube é manchete diferente de um
// reserva sendo emprestado.
const TM_FRASES_CONFIRMADA_POR_PERFIL = {
  artilheiro: [
    (jog, dono, interessado, j) => `Reforço de peso: <b>${jog}</b> (${j.gols} gols na temporada) é anunciado pelo <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `Artilheiro confirmado: <b>${jog}</b> deixa o <b>${dono}</b> e assina com o <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `É oficial: <b>${interessado}</b> anuncia <b>${jog}</b>, um dos nomes em maior evidência do ataque`,
  ],
  garcom: [
    (jog, dono, interessado, j) => `Criatividade garantida: <b>${jog}</b> (${j.assistencias} assistências) é o novo reforço do <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `É oficial: <b>${jog}</b> deixa o <b>${dono}</b> e reforça o meio-campo do <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `<b>${interessado}</b> anuncia a contratação do armador <b>${jog}</b>`,
  ],
  joia: [
    (jog, dono, interessado, j) => `Aposta no futuro: <b>${interessado}</b> anuncia a joia <b>${jog}</b>, de ${j.idade} anos`,
    (jog, dono, interessado, j) => `É oficial: o jovem <b>${jog}</b> deixa o <b>${dono}</b> rumo ao <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `<b>${interessado}</b> confirma a contratação da promessa <b>${jog}</b>`,
  ],
  veterano: [
    (jog, dono, interessado, j) => `Experiência reforça o elenco: <b>${jog}</b> é o novo contratado do <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `É oficial: o veterano <b>${jog}</b> deixa o <b>${dono}</b> e assina com o <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `<b>${interessado}</b> anuncia <b>${jog}</b>, nome de bagagem na Série A`,
  ],
  cartoleiro: [
    (jog, dono, interessado, j) => `<b>${interessado}</b> anuncia <b>${jog}</b>, reforço de postura combativa`,
    (jog, dono, interessado, j) => `É oficial: <b>${jog}</b> deixa o <b>${dono}</b> rumo ao <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `Fechado: <b>${jog}</b> é o novo reforço do <b>${interessado}</b>`,
  ],
  goleiro: [
    (jog, dono, interessado, j) => `Reforço para o gol: <b>${jog}</b> é anunciado pelo <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `É oficial: o goleiro <b>${jog}</b> deixa o <b>${dono}</b> e assina com o <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `<b>${interessado}</b> confirma a contratação do arqueiro <b>${jog}</b>`,
  ],
  reserva: [
    (jog, dono, interessado, j) => `<b>${interessado}</b> reforça o elenco com a contratação de <b>${jog}</b>`,
    (jog, dono, interessado, j) => `É oficial: <b>${jog}</b> deixa o <b>${dono}</b> rumo ao <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `Fechado: <b>${jog}</b> é o novo nome do elenco do <b>${interessado}</b>`,
  ],
  padrao: [
    (jog, dono, interessado, j) => `<b>${jog}</b> foi confirmado: ${dono} → ${interessado}`,
    (jog, dono, interessado, j) => `É oficial: <b>${jog}</b> deixa o <b>${dono}</b> e assina com o <b>${interessado}</b>`,
    (jog, dono, interessado, j) => `<b>${interessado}</b> anuncia a contratação de <b>${jog}</b>`,
  ],
};

function tmFraseConfirmada(consultaId, jog, dono, interessado, jogador) {
  const perfil = tmPerfilJogador(jogador);
  const lista = TM_FRASES_CONFIRMADA_POR_PERFIL[perfil] || TM_FRASES_CONFIRMADA_POR_PERFIL.padrao;
  const idx = tmHashString(consultaId + "-frase-confirmada") % lista.length;
  return lista[idx](jog, dono, interessado, jogador || {});
}

function tmMercadoTipoLabel() {
  return { definitivo: "Definitivo", emprestimo: "Empréstimo" };
}

// ---------- REPÓRTERES / BYLINE ----------
// Cada clube do Brasileirão tem um repórter fixo que "cobre" o time —
// é ele quem assina as matérias de rumor/transferência envolvendo
// aquele clube, igual ao jeito que ge.globo, Lance! etc. atribuem furos
// a repórteres específicos de cada praça.
const MC_REPORTERES_POR_TIME = {
  "Atlético-MG": { nome: "Fred Ribeiro", arroba: "@fredfrm" },
  "Atletico-MG": { nome: "Fred Ribeiro", arroba: "@fredfrm" },
  "Bahia": { nome: "Yuri Santana", arroba: "@oysantana_" },
  "Botafogo": { nome: "Thiago Franklin", arroba: "@thiagofranklin" },
  "Ceará": { nome: "André Almeida", arroba: "@andrealmeidace" },
  "Ceara": { nome: "André Almeida", arroba: "@andrealmeidace" },
  "Corinthians": { nome: "Luis Fabiani", arroba: "@luissfabiani" },
  "Cruzeiro": { nome: "Samuel Venâncio", arroba: "@samuelvenancio" },
  "Flamengo": { nome: "Venê Casagrande", arroba: "@venecasagrande" },
  "Fluminense": { nome: "Victor Lessa", arroba: "@victor_lessa" },
  "Fortaleza": { nome: "Afonso Ribeiro", arroba: "@afonseribeiro" },
  "Grêmio": { nome: "Kaliel Dorneles", arroba: "@Kaliel_D" },
  "Gremio": { nome: "Kaliel Dorneles", arroba: "@Kaliel_D" },
  "Internacional": { nome: "Lucas Collar", arroba: "@LucasCollar" },
  "Juventude": { nome: "Cristiano Silva", arroba: "@chrissilva75" },
  "Mirassol": { nome: "Bruno Cazarini", arroba: "@cazarinibruno" },
  "Palmeiras": { nome: "Diego Firmino", arroba: "@Diegofirmino" },
  "Red Bull Bragantino": { nome: "Igor Assunção", arroba: "@igorassuncao_" },
  "Bragantino": { nome: "Igor Assunção", arroba: "@igorassuncao_" },
  "Santos": { nome: "Lucas Musetti Perazolli", arroba: "@lucas_musetti" },
  "São Paulo": { nome: "Eduardo Affonso", arroba: "@eduaffonsoespn" },
  "Sao Paulo": { nome: "Eduardo Affonso", arroba: "@eduaffonsoespn" },
  "Sport": { nome: "Antônio Gabriel", arroba: "@reporterAG" },
  "Vasco": { nome: "Joel Silva", arroba: "@JoelSilva90" },
  "Vitória": { nome: "Leandro Aragão", arroba: "@ronaldolimare" },
  "Vitoria": { nome: "Leandro Aragão", arroba: "@ronaldolimare" },
};

// Quando o time envolvido não tem um repórter fixo cadastrado (ex: um
// clube fora da lista oficial), a matéria é atribuída a um veículo
// esportivo fictício — igual a uma reportagem assinada pela redação.
const MC_VEICULOS_FALLBACK = ["ge", "Lance!", "Goal", "365Scores"];

function tmHashVeiculoFallback(seed) {
  const idx = tmHashString(seed + "-veiculo") % MC_VEICULOS_FALLBACK.length;
  return MC_VEICULOS_FALLBACK[idx];
}

// Retorna a "assinatura" (byline) da matéria: repórter fixo do clube
// interessado (é o furo do torcedor daquele time) ou, na falta de um
// repórter cadastrado pra esse nome de time, um veículo fictício.
function tmAssinaturaMateria(seed, nomeTimeInteressado) {
  const reporter = MC_REPORTERES_POR_TIME[nomeTimeInteressado];
  if (reporter) {
    return { tipo: "reporter", nome: reporter.nome, arroba: reporter.arroba };
  }
  return { tipo: "veiculo", nome: tmHashVeiculoFallback(seed) };
}

function tmAssinaturaHtml(assinatura) {
  if (assinatura.tipo === "reporter") {
    return `${assinatura.nome} <span class="mc-assinatura-arroba">${assinatura.arroba}</span>`;
  }
  return `Redação ${assinatura.nome}`;
}

// ---------- HTML (usado no Transfermarkt) ----------

function tmRumorItemHtml(c) {
  const jogadorNome = c.jogadores?.nome || "um jogador";
  const timeInteressado = c.interessado?.nome || "um clube";
  const timeDono = c.dono?.nome || "";

  const comValor = c.valor_consultado && tmRumorComValor(c.id);
  const titulo = tmFraseRumor(c.id, jogadorNome, timeInteressado, c.jogadores);
  const assinatura = tmAssinaturaMateria(c.id, timeInteressado);

  const metaPartes = [];
  if (timeDono) metaPartes.push(`Atualmente no ${timeDono}`);
  if (comValor) metaPartes.push(`Valor especulado: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}`);
  metaPartes.push(c.status === "negociando" ? "Negociação em andamento" : "Consulta inicial");

  return `
    <div class="tm-mercado-item rumor" onclick="location.href='materia?id=${c.id}&tipo=rumor'" style="cursor:pointer;">
      <span class="tm-mercado-icone">🗞️</span>
      <div class="tm-mercado-corpo">
        <p class="tm-mercado-titulo">${titulo}</p>
        <p class="tm-mercado-meta">${metaPartes.join(" · ")}</p>
        <p class="mc-assinatura">${tmAssinaturaHtml(assinatura)}</p>
        <span class="tm-mercado-tag">Rumor</span>
      </div>
    </div>
  `;
}

function tmConfirmadaItemHtml(c) {
  const tipoLabel = tmMercadoTipoLabel();
  const jogadorNome = c.jogadores?.nome || "Jogador";
  const timeDono = c.dono?.nome || "—";
  const timeInteressado = c.interessado?.nome || "—";
  const assinatura = tmAssinaturaMateria(c.id, timeInteressado);
  const titulo = tmFraseConfirmada(c.id, jogadorNome, timeDono, timeInteressado, c.jogadores);

  const metaPartes = [];
  if (c.valor_consultado) metaPartes.push(`R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}`);
  if (c.tipo_contratacao) metaPartes.push(tipoLabel[c.tipo_contratacao] || c.tipo_contratacao);
  if (c.respondido_em) metaPartes.push(new Date(c.respondido_em).toLocaleDateString("pt-BR"));

  return `
    <div class="tm-mercado-item confirmada" onclick="location.href='materia?id=${c.id}&tipo=confirmada'" style="cursor:pointer;">
      <span class="tm-mercado-icone">✅</span>
      <div class="tm-mercado-corpo">
        <p class="tm-mercado-titulo">${titulo}</p>
        <p class="tm-mercado-meta">${metaPartes.join(" · ")}</p>
        <p class="mc-assinatura">${tmAssinaturaHtml(assinatura)}</p>
        <span class="tm-mercado-tag">Confirmada</span>
      </div>
    </div>
  `;
}

// ---------- BUSCA (compartilhada) ----------

// Busca todas as consultas em aberto (pendente/negociando) e retorna só
// as que "vazaram", já no formato de card de rumor pronto pra Notícias:
// { tipo, data (Date), titulo, resumo, id }
async function buscarRumoresComoNoticias() {
  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome, gols, assistencias, cartoes_amarelos, cartoes_vermelhos, idade, posicao), dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
    .in("status", ["pendente", "negociando"])
    .order("criado_em", { ascending: false });

  if (error || !data) return [];

  return data
    .filter(c => tmConsultaVazou(c.id, c.interessado?.nome))
    .map(c => {
      const jogadorNome = c.jogadores?.nome || "um jogador";
      const timeInteressado = c.interessado?.nome || "um clube";
      const timeDono = c.dono?.nome || "";
      const comValor = c.valor_consultado && tmRumorComValor(c.id);

      const metaPartes = [];
      if (timeDono) metaPartes.push(`Atualmente no ${timeDono}`);
      if (comValor) metaPartes.push(`Valor especulado: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}`);
      metaPartes.push(c.status === "negociando" ? "Negociação em andamento" : "Consulta inicial");

      return {
        origem: "rumor",
        id: `rumor-${c.id}`,
        consultaId: c.id,
        jogadorId: c.jogador_id,
        timeDonoId: c.time_dono_id,
        timeInteressadoId: c.time_interessado_id,
        data: new Date(c.criado_em),
        titulo: tmFraseRumor(c.id, jogadorNome, timeInteressado, c.jogadores),
        resumo: metaPartes.join(" · "),
        tag: "Rumor",
        assinatura: tmAssinaturaMateria(c.id, timeInteressado),
        comValor,
        valor: c.valor_consultado,
        status: c.status,
      };
    });
}

// Busca as transferências já confirmadas (status = aceito), no mesmo
// formato de card de notícia.
async function buscarConfirmadasComoNoticias() {
  const { data, error } = await supabaseClient
    .from("bid_transferencias")
    .select("*, jogadores(nome, gols, assistencias, cartoes_amarelos, cartoes_vermelhos, idade, posicao), dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
    .eq("status", "aceito")
    .order("respondido_em", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  const tipoLabel = tmMercadoTipoLabel();

  return data.map(c => {
    const jogadorNome = c.jogadores?.nome || "Jogador";
    const timeDono = c.dono?.nome || "—";
    const timeInteressado = c.interessado?.nome || "—";

    const metaPartes = [];
    if (c.valor_consultado) metaPartes.push(`R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}`);
    if (c.tipo_contratacao) metaPartes.push(tipoLabel[c.tipo_contratacao] || c.tipo_contratacao);

    return {
      origem: "confirmada",
      id: `confirmada-${c.id}`,
      consultaId: c.id,
      jogadorId: c.jogador_id,
      timeDonoId: c.time_dono_id,
      timeInteressadoId: c.time_interessado_id,
      data: new Date(c.respondido_em || c.criado_em),
      titulo: tmFraseConfirmada(c.id, jogadorNome, timeDono, timeInteressado, c.jogadores),
      resumo: metaPartes.join(" · "),
      tag: "Transferência confirmada",
      assinatura: tmAssinaturaMateria(c.id, timeInteressado),
      tipoContratacao: c.tipo_contratacao,
      valor: c.valor_consultado,
    };
  });
}
