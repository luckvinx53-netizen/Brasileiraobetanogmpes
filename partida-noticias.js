// =========================================================
// PARTIDA — núcleo compartilhado entre Notícias e Matéria.
// Gera a "notícia de fim de jogo" automaticamente a partir de um jogo
// com status = "Encerrado" na tabela jogos, igual às matérias de
// mercado (mercado-noticias.js): mesma ideia de conteúdo determinístico
// (mesmo jogo sempre gera a mesma manchete/assinatura, pra não ficar
// mudando a cada refresh) e mesma assinatura por "veículo grande" de
// imprensa esportiva (ge, Goal, Lance!, TNT Sports, ESPN, UOL...), no
// lugar do repórter fixo de clube usado nas matérias de mercado.
// =========================================================

// Veículos de imprensa esportiva "grandes" que assinam a cobertura de
// fim de jogo — sorteado de forma determinística por jogo, pra manter
// sempre o mesmo veículo pra aquele jogo específico.
const PN_VEICULOS = [
  { nome: "ge", arroba: "@geglobo" },
  { nome: "Goal", arroba: "@GoalBrasil" },
  { nome: "Lance!", arroba: "@LANCE" },
  { nome: "TNT Sports", arroba: "@TNTSportsBR" },
  { nome: "ESPN", arroba: "@ESPNBrasil" },
  { nome: "UOL Esporte", arroba: "@UOLEsporte" },
];

function pnHashVeiculo(seed) {
  const idx = tmHashString(seed + "-veiculo-jogo") % PN_VEICULOS.length;
  return PN_VEICULOS[idx];
}

function pnAssinaturaMateria(jogoId) {
  const veiculo = pnHashVeiculo(jogoId);
  return { tipo: "veiculo", nome: veiculo.nome, arroba: veiculo.arroba };
}

function pnAssinaturaHtml(assinatura) {
  return `Redação ${assinatura.nome} <span class="mc-assinatura-arroba">${assinatura.arroba}</span>`;
}

// ---------- TÍTULOS ----------
// Frases de manchete variadas, no estilo real de fim de jogo de grande
// veículo esportivo. Escolhida deterministicamente por jogo (hash do id).
const PN_FRASES_VITORIA = [
  (v, p, gv, gp) => `${v} vence ${p} por ${gv} a ${gp} e segue na briga pelo título`,
  (v, p, gv, gp) => `Com atuação sólida, ${v} bate ${p} por ${gv} a ${gp}`,
  (v, p, gv, gp) => `${v} derrota ${p} por ${gv} a ${gp} e comemora resultado no Brasileirão`,
  (v, p, gv, gp) => `Fim de jogo: ${v} ${gv} x ${gp} ${p}, com vitória construída na etapa final`,
  (v, p, gv, gp) => `${v} atropela ${p} e vence por ${gv} a ${gp} pela rodada do Brasileirão`,
];

const PN_FRASES_EMPATE = [
  (c, f, g) => `${c} e ${f} empatam em ${g} a ${g} em jogo movimentado`,
  (c, f, g) => `Sem vencedor: ${c} e ${f} ficam no ${g} a ${g}`,
  (c, f, g) => `${c} ${g} x ${g} ${f}: times dividem os pontos pelo Brasileirão`,
  (c, f, g) => `Empate em ${g} a ${g} entre ${c} e ${f} mantém a briga aberta na tabela`,
];

function pnFraseTitulo(jogoId, nomeCasa, nomeFora, pc, pf) {
  const idxV = tmHashString(jogoId + "-titulo") % PN_FRASES_VITORIA.length;
  const idxE = tmHashString(jogoId + "-titulo") % PN_FRASES_EMPATE.length;

  if (pc === pf) return PN_FRASES_EMPATE[idxE](nomeCasa, nomeFora, pc);

  const [vencedor, perdedor, gv, gp] = pc > pf
    ? [nomeCasa, nomeFora, pc, pf]
    : [nomeFora, nomeCasa, pf, pc];

  return PN_FRASES_VITORIA[idxV](vencedor, perdedor, gv, gp);
}

// ---------- BUSCA (compartilhada) ----------
// Busca os jogos encerrados e devolve já no formato de card de notícia,
// igual ao que mercado-noticias.js faz pra rumores/confirmadas.
async function buscarFimDeJogoComoNoticias() {
  const { data, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .eq("status", "Encerrado")
    .order("data_jogo", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map(j => pnJogoParaNoticia(j));
}

// Usado tanto na lista (noticias.js) quanto pra montar o card — mantém
// os dois pontos usando exatamente a mesma lógica de título/resumo.
function pnJogoParaNoticia(j) {
  const casa = j.time_casa;
  const fora = j.time_fora;
  const nomeCasa = casa?.nome || "Time da casa";
  const nomeFora = fora?.nome || "Time visitante";
  const pc = j.placar_casa ?? 0;
  const pf = j.placar_fora ?? 0;

  const titulo = pnFraseTitulo(j.id, nomeCasa, nomeFora, pc, pf);
  const assinatura = pnAssinaturaMateria(j.id);

  const metaPartes = [`${j.rodada}ª rodada`];
  if (j.local) metaPartes.push(j.local);

  // Usa data_jogo (+ hora, se houver) como data de publicação — cai
  // certinho na ordenação junto com as outras notícias.
  const dataBase = j.data_jogo
    ? new Date(`${j.data_jogo}T${j.hora_jogo || "18:00"}`)
    : new Date(j.criado_em || Date.now());

  return {
    origem: "jogo",
    id: `jogo-${j.id}`,
    jogoId: j.id,
    data: dataBase,
    titulo,
    resumo: `${nomeCasa} ${pc} x ${pf} ${nomeFora} · ${metaPartes.join(" · ")}`,
    tag: "Fim de jogo",
    assinatura,
    placarCasa: pc,
    placarFora: pf,
    timeCasaNome: nomeCasa,
    timeForaNome: nomeFora,
  };
}
