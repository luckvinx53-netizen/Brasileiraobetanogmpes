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

const TM_CHANCE_VAZAR = 0.4; // ~40% das consultas em aberto viram rumor
const TM_CHANCE_VALOR_NO_RUMOR = 0.5; // metade dos rumores vaza com valor, metade sem

function tmConsultaVazou(consultaId) {
  return (tmHashString(consultaId + "-vazou") % 100) / 100 < TM_CHANCE_VAZAR;
}

function tmRumorComValor(consultaId) {
  return (tmHashString(consultaId + "-valor") % 100) / 100 < TM_CHANCE_VALOR_NO_RUMOR;
}

// Frases variadas de "furo de reportagem", igual à imprensa esportiva —
// escolhida também de forma determinística por consulta, pra não ficar
// mudando de frase a cada refresh.
const TM_FRASES_RUMOR = [
  (jog, time) => `De olho no mercado: <b>${time}</b> monitora a situação de <b>${jog}</b>`,
  (jog, time) => `Bastidores: <b>${time}</b> fez contato para avaliar a contratação de <b>${jog}</b>`,
  (jog, time) => `Apurado pela reportagem: <b>${time}</b> sondou o estafe de <b>${jog}</b>`,
  (jog, time) => `Nos corredores do mercado: nome de <b>${jog}</b> circula ligado ao <b>${time}</b>`,
  (jog, time) => `Fontes internas indicam interesse do <b>${time}</b> em <b>${jog}</b>`,
];

function tmFraseRumor(consultaId, jog, time) {
  const idx = tmHashString(consultaId + "-frase") % TM_FRASES_RUMOR.length;
  return TM_FRASES_RUMOR[idx](jog, time);
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
  "Santos": { nome: "Lucas Musetti", arroba: "@lucas_musetti" },
  "São Paulo": { nome: "Eduardo Affonso", arroba: "@eduaffonsoespn" },
  "Sao Paulo": { nome: "Eduardo Affonso", arroba: "@eduaffonsoespn" },
  "Sport": { nome: "Antônio Gabriel", arroba: "@reporterAG" },
  "Vasco": { nome: "Joel Silva", arroba: "@JoelSilva90" },
  "Vitória": { nome: "Ronaldo Oliveira", arroba: "@ronaldolimare" },
  "Vitoria": { nome: "Ronaldo Oliveira", arroba: "@ronaldolimare" },
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
  const titulo = tmFraseRumor(c.id, jogadorNome, timeInteressado);
  const assinatura = tmAssinaturaMateria(c.id, timeInteressado);

  const metaPartes = [];
  if (timeDono) metaPartes.push(`Atualmente no ${timeDono}`);
  if (comValor) metaPartes.push(`Valor especulado: R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}`);
  metaPartes.push(c.status === "negociando" ? "Negociação em andamento" : "Consulta inicial");

  return `
    <div class="tm-mercado-item rumor" onclick="location.href='materia.html?id=${c.id}&tipo=rumor'" style="cursor:pointer;">
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

  const metaPartes = [];
  if (c.valor_consultado) metaPartes.push(`R$ ${Number(c.valor_consultado).toLocaleString("pt-BR")}`);
  if (c.tipo_contratacao) metaPartes.push(tipoLabel[c.tipo_contratacao] || c.tipo_contratacao);
  if (c.respondido_em) metaPartes.push(new Date(c.respondido_em).toLocaleDateString("pt-BR"));

  return `
    <div class="tm-mercado-item confirmada" onclick="location.href='materia.html?id=${c.id}&tipo=confirmada'" style="cursor:pointer;">
      <span class="tm-mercado-icone">✅</span>
      <div class="tm-mercado-corpo">
        <p class="tm-mercado-titulo"><b>${jogadorNome}</b> foi confirmado: ${timeDono} → ${timeInteressado}</p>
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
    .select("*, jogadores(nome), dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
    .in("status", ["pendente", "negociando"])
    .order("criado_em", { ascending: false });

  if (error || !data) return [];

  return data
    .filter(c => tmConsultaVazou(c.id))
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
        titulo: tmFraseRumor(c.id, jogadorNome, timeInteressado),
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
    .select("*, jogadores(nome), dono:time_dono_id(nome), interessado:time_interessado_id(nome)")
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
      titulo: `${jogadorNome} foi confirmado: ${timeDono} → ${timeInteressado}`,
      resumo: metaPartes.join(" · "),
      tag: "Transferência confirmada",
      assinatura: tmAssinaturaMateria(c.id, timeInteressado),
      tipoContratacao: c.tipo_contratacao,
      valor: c.valor_consultado,
    };
  });
}
