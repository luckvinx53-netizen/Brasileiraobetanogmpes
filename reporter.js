// =========================================================
// PERFIL DO REPÓRTER
// Aberta a partir do @arroba no byline de uma matéria (materia.html),
// recebe o @arroba via query string (?arroba=...) e monta um "raio-x"
// do repórter: nome, time que cobre, e a lista de rumores/transferências
// confirmadas que ele assinou.
//
// Não existe uma tabela de "repórteres" no banco — a assinatura é
// puramente derivada (MC_REPORTERES_POR_TIME, em mercado-noticias.js):
// cada repórter cobre um único time fixo, e toda matéria sobre aquele
// time (como INTERESSADO na negociação) é assinada por ele. Por isso o
// caminho aqui é:
//   1) achar, em MC_REPORTERES_POR_TIME, qual time bate com o @arroba
//      pedido (pode haver mais de uma chave apontando pro mesmo
//      repórter, ex: "Atlético-MG" e "Atletico-MG" — usamos a primeira
//      ocorrência como nome "oficial" de exibição);
//   2) buscar em bid_transferencias as negociações em que esse time é
//      o INTERESSADO (é sempre esse lado que o repórter cobre);
//   3) separar por status: aceito = confirmada, pendente/negociando =
//      rumor (só os que "vazaram", mesma regra usada no Transfermarkt/
//      Notícias, pra não listar consultas que nunca viraram matéria).
// =========================================================

async function carregarReporter() {
  const params = new URLSearchParams(window.location.search);
  const arroba = params.get("arroba");
  const area = document.getElementById("detalhesReporter");

  if (!arroba) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Repórter não encontrado</h3></div>`;
    return;
  }

  const info = rpEncontrarReporterPorArroba(arroba);
  if (!info) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Repórter não encontrado</h3></div>`;
    return;
  }

  const { nome, nomesTime } = info;
  const nomeTimeExibicao = nomesTime.find(n => /[áàâãéêíóôõúüç]/i.test(n)) || nomesTime[0];

  const { data: timeRow, error: erroTime } = await supabaseClient
    .from("times")
    .select("id, nome")
    .in("nome", nomesTime)
    .maybeSingle();

  if (erroTime) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar time</h3><p>${erroTime.message}</p></div>`;
    return;
  }

  let lista = [];
  if (timeRow) {
    const { data: negociacoes, error } = await supabaseClient
      .from("bid_transferencias")
      .select("*, jogadores(nome, gols, assistencias, cartoes_amarelos, cartoes_vermelhos, idade, posicao), dono:time_dono_id(*), interessado:time_interessado_id(*)")
      .eq("time_interessado_id", timeRow.id)
      .order("criado_em", { ascending: false });

    if (error) {
      area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar matérias</h3><p>${error.message}</p></div>`;
      return;
    }
    lista = negociacoes || [];
  }

  const confirmadas = lista.filter(c => c.status === "aceito");
  const rumores = lista
    .filter(c => c.status === "pendente" || c.status === "negociando")
    .filter(c => tmConsultaVazou(c.id, timeRow?.nome || nomeTimeExibicao));

  area.innerHTML = `
    ${rpHeroHtml(nome, arroba, timeRow?.nome || nomeTimeExibicao, confirmadas.length, rumores.length)}
    ${rpListaHtml("✅ Transferências confirmadas", confirmadas, "confirmada")}
    ${rpListaHtml("🗞️ Rumores", rumores, "rumor")}
  `;
}

// Procura, em MC_REPORTERES_POR_TIME (mercado-noticias.js), todas as
// entradas cujo @arroba bate com o pedido — o mapa tem propósitalmente
// mais de uma chave apontando pro mesmo repórter (ex: "Atlético-MG" e
// "Atletico-MG", com e sem acento), porque o nome salvo em "times" no
// banco pode estar em qualquer uma das duas formas. Retorna o nome do
// repórter e a lista de nomes de time a tentar.
function rpEncontrarReporterPorArroba(arroba) {
  const alvo = arroba.toLowerCase();
  let nome = null;
  const nomesTime = [];
  for (const [nomeTime, reporter] of Object.entries(MC_REPORTERES_POR_TIME)) {
    if (reporter.arroba.toLowerCase() === alvo) {
      nome = reporter.nome;
      nomesTime.push(nomeTime);
    }
  }
  if (!nome) return null;
  return { nome, arroba, nomesTime };
}

function rpHeroHtml(nome, arroba, nomeTime, totalConfirmadas, totalRumores) {
  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="escudo-placeholder" style="width:52px;height:52px;font-size:18px;">📝</div>
        <div>
          <h2 style="font-family:var(--font-display);font-size:22px;margin:0;">${nome}</h2>
          <div class="text-dim" style="font-size:12.5px;margin-top:2px;">${arroba} · Cobre o ${nomeTime}</div>
        </div>
      </div>

      <div class="mc-estadio-detalhes" style="margin-top:16px;">
        <div class="mc-estadio-item">
          <span class="mc-estadio-label">✅ Transferências confirmadas</span>
          <span class="mc-estadio-valor">${totalConfirmadas}</span>
        </div>
        <div class="mc-estadio-item">
          <span class="mc-estadio-label">🗞️ Rumores publicados</span>
          <span class="mc-estadio-valor">${totalRumores}</span>
        </div>
      </div>
    </div>
  `;
}

function rpListaHtml(titulo, lista, tipo) {
  if (!lista.length) return "";

  const linhas = lista.map(c => {
    const jogadorNome = c.jogadores?.nome || "Jogador";
    const timeDono = c.dono?.nome || "—";
    const timeInteressado = c.interessado?.nome || "—";
    const tituloMateria = tipo === "confirmada"
      ? tmFraseConfirmada(c.id, jogadorNome, timeDono, timeInteressado, c.jogadores).replace(/<\/?b>/g, "")
      : tmFraseRumor(c.id, jogadorNome, timeInteressado, c.jogadores).replace(/<\/?b>/g, "");
    const data = new Date(c.respondido_em || c.criado_em);
    const dataFormatada = Number.isNaN(data.getTime()) ? "" : data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

    return `
      <a class="admin-item" style="display:block;" href="materia?id=${c.id}&tipo=${tipo}">
        <div class="title">${tituloMateria}</div>
        <div class="meta">${jogadorNome} · ${dataFormatada}</div>
      </a>
    `;
  }).join("");

  return `
    <div class="card" style="margin-top:16px;">
      <h2 style="font-family:var(--font-display);font-size:20px;margin:0 0 10px;">${titulo}</h2>
      ${linhas}
    </div>
  `;
}

carregarReporter();
