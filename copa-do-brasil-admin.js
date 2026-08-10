// =========================================================
// COPA DO BRASIL — MATA-MATA (aba do admin)
// Sorteio das oitavas a partir dos times do Brasileirão, geração
// automática das fases seguintes (quartas/semifinal/final) e
// lançamento manual de pênaltis quando o agregado empata.
//
// Schema real (já existente no banco):
// - confrontos_mata_mata: competicao_id, temporada_id, fase, ordem,
//   time_a_id, time_b_id, agregado_a, agregado_b,
//   situacao ('aguardando'|'em_andamento'|'penaltis'|'definido'),
//   vencedor_id, foi_penaltis, penaltis_a, penaltis_b.
// - jogos: fase ('grupos'|'oitavas'|'quartas'|'semifinal'|'final'),
//   confronto_id, perna ('ida'|'volta'|'unica').
// A final é sempre jogo único (perna='unica'); não existe coluna
// "ida_volta" — usamos fase === 'final' pra saber isso.
// =========================================================

const CDB_FASES = ["oitavas", "quartas", "semifinal", "final"];
const CDB_NOME_FASE = {
  oitavas: "Oitavas de final",
  quartas: "Quartas de final",
  semifinal: "Semifinal",
  final: "Final",
};
const CDB_PROXIMA_FASE = { oitavas: "quartas", quartas: "semifinal", semifinal: "final" };

let cdbCompeticaoCache = null;
let cdbTemporadaCache = null;
let cdbConfrontosCache = [];

async function cdbResolverCompeticaoETemporada() {
  const { data: competicao, error: erroCompeticao } = await supabaseClient
    .from("competicoes")
    .select("*")
    .eq("slug", "copa-do-brasil")
    .maybeSingle();

  if (erroCompeticao || !competicao) {
    return { error: erroCompeticao || { message: "Competição 'Copa do Brasil' não encontrada." } };
  }

  const { data: temporadas, error: erroTemporada } = await supabaseClient
    .from("temporadas")
    .select("*")
    .eq("competicao_id", competicao.id)
    .eq("ativa", true)
    .order("criado_em", { ascending: false })
    .limit(1);

  if (erroTemporada || !temporadas || !temporadas.length) {
    return { error: erroTemporada || { message: "Nenhuma temporada ativa da Copa do Brasil encontrada." } };
  }

  return { competicao, temporada: temporadas[0] };
}

async function cdbBuscarTimesDoBrasileirao() {
  const { data: competicaoBr, error: erroComp } = await supabaseClient
    .from("competicoes")
    .select("id")
    .eq("slug", "brasileirao")
    .maybeSingle();

  if (erroComp || !competicaoBr) {
    return { error: erroComp || { message: "Competição 'Brasileirão' não encontrada." } };
  }

  const { data: temporadasBr, error: erroTempBr } = await supabaseClient
    .from("temporadas")
    .select("id")
    .eq("competicao_id", competicaoBr.id)
    .eq("ativa", true)
    .order("criado_em", { ascending: false })
    .limit(1);

  if (erroTempBr || !temporadasBr || !temporadasBr.length) {
    return { error: erroTempBr || { message: "Nenhuma temporada ativa do Brasileirão encontrada." } };
  }

  const { data: times, error: erroTimes } = await supabaseClient
    .from("times")
    .select("*")
    .eq("temporada_id", temporadasBr[0].id)
    .order("nome", { ascending: true });

  if (erroTimes) return { error: erroTimes };

  return { times: times || [] };
}

async function carregarCopaDoBrasilAdmin() {
  const area = document.getElementById("cdbConteudo");
  if (!area) return;
  area.innerHTML = `<div class="empty-state"><div class="icon">⏳</div><h3>Carregando...</h3></div>`;

  const resolvido = await cdbResolverCompeticaoETemporada();
  if (resolvido.error) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>${resolvido.error.message}</h3></div>`;
    return;
  }
  cdbCompeticaoCache = resolvido.competicao;
  cdbTemporadaCache = resolvido.temporada;

  const { data: confrontos, error: erroConfrontos } = await supabaseClient
    .from("confrontos_mata_mata")
    .select("*, time_a:time_a_id(*), time_b:time_b_id(*), vencedor:vencedor_id(*)")
    .eq("temporada_id", cdbTemporadaCache.id)
    .order("fase", { ascending: true })
    .order("ordem", { ascending: true });

  if (erroConfrontos) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>${erroConfrontos.message}</h3></div>`;
    return;
  }

  cdbConfrontosCache = confrontos || [];
  area.innerHTML = await cdbConteudoHtml();
}

async function cdbConteudoHtml() {
  if (!cdbConfrontosCache.length) {
    return `
      <div class="empty-state">
        <div class="icon">🇧🇷</div>
        <h3>Nenhum chaveamento ainda</h3>
        <p>Sorteie os 16 times das oitavas a partir do Brasileirão atual.</p>
        <button class="btn btn-primary" onclick="cdbSortearOitavas()">Sortear oitavas</button>
      </div>
    `;
  }

  const blocos = await Promise.all(CDB_FASES.map(f => cdbBlocoFaseHtml(f)));

  return `
    <div class="cdb-toolbar">
      <button class="btn btn-secondary" onclick="cdbSortearOitavas()">Sortear oitavas de novo</button>
    </div>
    ${blocos.join("")}
  `;
}

async function cdbBlocoFaseHtml(fase) {
  const confrontosFase = cdbConfrontosCache
    .filter(c => c.fase === fase)
    .sort((a, b) => a.ordem - b.ordem);

  if (!confrontosFase.length) {
    const faseAnteriorIdx = CDB_FASES.indexOf(fase) - 1;
    if (faseAnteriorIdx < 0) return "";
    const faseAnterior = CDB_FASES[faseAnteriorIdx];
    const confrontosAnteriores = cdbConfrontosCache.filter(c => c.fase === faseAnterior);
    if (!confrontosAnteriores.length) return "";

    const todosComVencedor = confrontosAnteriores.every(c => c.vencedor_id);
    if (!todosComVencedor) return "";

    return `
      <div class="card cdb-fase-card">
        <h3>${CDB_NOME_FASE[fase]}</h3>
        <button class="btn btn-primary" onclick="cdbGerarProximaFase('${faseAnterior}')">Gerar ${CDB_NOME_FASE[fase].toLowerCase()}</button>
      </div>
    `;
  }

  const jogosPorConfronto = await cdbBuscarJogosDosConfrontos(confrontosFase.map(c => c.id));

  return `
    <div class="card cdb-fase-card">
      <h3>${CDB_NOME_FASE[fase]}</h3>
      <div class="cdb-confrontos-grid">
        ${confrontosFase.map(c => cdbConfrontoCardHtml(c, jogosPorConfronto[c.id] || [])).join("")}
      </div>
    </div>
  `;
}

async function cdbBuscarJogosDosConfrontos(confrontoIds) {
  if (!confrontoIds.length) return {};
  const { data, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .in("confronto_id", confrontoIds)
    .order("perna", { ascending: true });

  if (error) { console.error(error); return {}; }

  const mapa = {};
  (data || []).forEach(j => {
    if (!mapa[j.confronto_id]) mapa[j.confronto_id] = [];
    mapa[j.confronto_id].push(j);
  });
  return mapa;
}

function cdbConfrontoCardHtml(confronto, jogos) {
  const timeA = confronto.time_a;
  const timeB = confronto.time_b;
  const vencedor = confronto.vencedor;

  const linhasJogos = jogos.map(j => {
    const label = j.perna === "ida" ? "Ida" : j.perna === "volta" ? "Volta" : "Único";
    const placar = j.status === "Encerrado" ? `${j.placar_casa ?? "-"} x ${j.placar_fora ?? "-"}` : "a definir";
    return `
      <div class="cdb-jogo-linha" onclick="cdbAbrirJogoNoAdmin('${j.id}')">
        <span class="cdb-jogo-label">${label}</span>
        <span>${j.time_casa?.nome || "?"} ${placar} ${j.time_fora?.nome || "?"}</span>
      </div>
    `;
  }).join("");

  const precisaDePenaltis = confronto.situacao === "penaltis" && !confronto.vencedor_id;
  const cardPenaltis = precisaDePenaltis ? cdbCardPenaltisHtml(confronto) : "";

  const ehFinal = confronto.fase === "final";
  const rotuloAgregado = ehFinal ? "Placar" : "Agregado";

  return `
    <div class="cdb-confronto-card ${confronto.situacao === 'definido' ? 'cdb-definido' : ''}">
      <div class="cdb-confronto-topo">
        <span class="${vencedor?.id === timeA?.id ? 'cdb-vencedor' : ''}">${timeA ? timeA.nome : "A definir"}</span>
        <span class="cdb-agregado">${confronto.agregado_a ?? 0} - ${confronto.agregado_b ?? 0}</span>
        <span class="${vencedor?.id === timeB?.id ? 'cdb-vencedor' : ''}">${timeB ? timeB.nome : "A definir"}</span>
      </div>
      <div class="cdb-confronto-sub">${rotuloAgregado}${confronto.foi_penaltis ? ` • pênaltis ${confronto.penaltis_a}-${confronto.penaltis_b}` : ""}</div>
      <div class="cdb-jogos-lista">${linhasJogos || '<div class="cdb-jogo-linha-vazia">Jogos ainda não gerados.</div>'}</div>
      ${cardPenaltis}
    </div>
  `;
}

function cdbCardPenaltisHtml(confronto) {
  return `
    <div class="cdb-penaltis-card">
      <p>Empate no agregado — disputa de pênaltis:</p>
      <div class="cdb-penaltis-inputs">
        <input type="number" min="0" id="cdbPenA_${confronto.id}" placeholder="${confronto.time_a?.nome || 'Time A'}">
        <span>x</span>
        <input type="number" min="0" id="cdbPenB_${confronto.id}" placeholder="${confronto.time_b?.nome || 'Time B'}">
      </div>
      <button class="btn btn-secondary" onclick="cdbSalvarPenaltis('${confronto.id}')">Salvar pênaltis</button>
    </div>
  `;
}

async function cdbAbrirJogoNoAdmin(jogoId) {
  const { data: jogo, error } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .eq("id", jogoId)
    .single();

  if (error || !jogo) { notificar("Não foi possível abrir esse jogo.", "erro"); return; }

  document.querySelector('.tabs-row > [onclick*="abaJogos"]')?.click();
  if (typeof editarJogo === "function") editarJogo(jogo);
}

async function cdbSalvarPenaltis(confrontoId) {
  const inputA = document.getElementById(`cdbPenA_${confrontoId}`);
  const inputB = document.getElementById(`cdbPenB_${confrontoId}`);
  const penA = Number(inputA?.value);
  const penB = Number(inputB?.value);

  if (!Number.isFinite(penA) || !Number.isFinite(penB) || penA === penB) {
    notificar("Informe um placar de pênaltis válido (sem empate).", "aviso");
    return;
  }

  const confronto = cdbConfrontosCache.find(c => c.id === confrontoId);
  if (!confronto) return;

  const vencedorId = penA > penB ? confronto.time_a_id : confronto.time_b_id;

  const { error } = await supabaseClient
    .from("confrontos_mata_mata")
    .update({
      foi_penaltis: true,
      penaltis_a: penA,
      penaltis_b: penB,
      vencedor_id: vencedorId,
      situacao: "definido",
    })
    .eq("id", confrontoId);

  if (error) { notificar(error.message, "erro"); return; }

  notificar("Pênaltis salvos — classificado definido!");
  await carregarCopaDoBrasilAdmin();
}

function cdbEmbaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

async function cdbSortearOitavas() {
  if (cdbConfrontosCache.length) {
    if (!confirm("Já existe um chaveamento da Copa do Brasil. Sortear de novo apaga TODOS os confrontos e jogos atuais da Copa. Continuar?")) return;
  }

  const resolvido = await cdbResolverCompeticaoETemporada();
  if (resolvido.error) { notificar(resolvido.error.message, "erro"); return; }
  cdbCompeticaoCache = resolvido.competicao;
  cdbTemporadaCache = resolvido.temporada;

  const { times, error: erroTimes } = await cdbBuscarTimesDoBrasileirao();
  if (erroTimes) { notificar(erroTimes.message, "erro"); return; }

  if (!times || times.length < 16) {
    notificar(`É preciso ter pelo menos 16 times cadastrados no Brasileirão para sortear a Copa do Brasil (hoje: ${times ? times.length : 0}).`, "erro");
    return;
  }

  const { data: confrontosAntigos } = await supabaseClient
    .from("confrontos_mata_mata")
    .select("id")
    .eq("temporada_id", cdbTemporadaCache.id);

  if (confrontosAntigos && confrontosAntigos.length) {
    const idsAntigos = confrontosAntigos.map(c => c.id);
    await supabaseClient.from("jogos").delete().in("confronto_id", idsAntigos);
    await supabaseClient.from("confrontos_mata_mata").delete().in("id", idsAntigos);
  }

  const sorteados = cdbEmbaralhar(times).slice(0, 16);
  const pares = [];
  for (let i = 0; i < 16; i += 2) {
    pares.push([sorteados[i], sorteados[i + 1]]);
  }

  const erro = await cdbCriarConfrontosDaFase("oitavas", pares.map((par, idx) => ({
    ordem: idx + 1,
    timeA: par[0],
    timeB: par[1],
  })));

  if (erro) { notificar(erro.message, "erro"); return; }

  notificar("Oitavas sorteadas!");
  await carregarCopaDoBrasilAdmin();
}

async function cdbCriarConfrontosDaFase(fase, itens) {
  const ehFinal = fase === "final";

  for (const item of itens) {
    const { data: confronto, error: erroConfronto } = await supabaseClient
      .from("confrontos_mata_mata")
      .insert([{
        competicao_id: cdbCompeticaoCache.id,
        temporada_id: cdbTemporadaCache.id,
        fase,
        ordem: item.ordem,
        time_a_id: item.timeA.id,
        time_b_id: item.timeB.id,
        situacao: "em_andamento",
      }])
      .select()
      .single();

    if (erroConfronto) return erroConfronto;

    const jogosNovos = ehFinal
      ? [{ casa: item.timeA, fora: item.timeB, perna: "unica" }]
      : [
          { casa: item.timeA, fora: item.timeB, perna: "ida" },
          { casa: item.timeB, fora: item.timeA, perna: "volta" },
        ];

    for (const jg of jogosNovos) {
      const { error: erroJogo } = await supabaseClient.from("jogos").insert([{
        temporada_id: cdbTemporadaCache.id,
        rodada: 0,
        time_casa_id: jg.casa.id,
        time_fora_id: jg.fora.id,
        local: jg.casa.estadio || "",
        capacidade: jg.casa.capacidade_estadio || "",
        foto_estadio: jg.casa.foto_estadio || "",
        status: "Agendado",
        computado: false,
        fase,
        confronto_id: confronto.id,
        perna: jg.perna,
      }]);
      if (erroJogo) return erroJogo;
    }
  }

  return null;
}

async function cdbGerarProximaFase(faseAnterior) {
  const proximaFase = CDB_PROXIMA_FASE[faseAnterior];
  if (!proximaFase) return;

  const confrontosAnteriores = cdbConfrontosCache
    .filter(c => c.fase === faseAnterior)
    .sort((a, b) => a.ordem - b.ordem);

  if (!confrontosAnteriores.every(c => c.vencedor_id)) {
    notificar("Ainda há confrontos dessa fase sem vencedor definido.", "aviso");
    return;
  }

  const vencedores = confrontosAnteriores.map(c => c.vencedor_id === c.time_a_id ? c.time_a : c.time_b);

  const pares = [];
  for (let i = 0; i < vencedores.length; i += 2) {
    pares.push([vencedores[i], vencedores[i + 1]]);
  }

  const itens = pares.map((par, idx) => ({ ordem: idx + 1, timeA: par[0], timeB: par[1] }));

  const erro = await cdbCriarConfrontosDaFase(proximaFase, itens);
  if (erro) { notificar(erro.message, "erro"); return; }

  notificar(`${CDB_NOME_FASE[proximaFase]} gerada!`);
  await carregarCopaDoBrasilAdmin();
}
