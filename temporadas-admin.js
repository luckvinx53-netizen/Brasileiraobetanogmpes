// =========================================================
// TEMPORADAS — ADMIN
// Criar, ativar e "zerar" temporadas de cada competição, direto pelo
// admin.html (antes só dava pra fazer isso no SQL Editor do Supabase).
//
// Colunas reais confirmadas na tabela "temporadas" (consultadas
// direto no banco, não presumidas): id, nome (text, obrigatório),
// ano (integer, obrigatório), ativa (boolean), total_rodadas
// (integer, obrigatório), criado_em, competicao_id.
//
// Mesmo assim, o formulário de criação AINDA descobre as colunas em
// runtime (tpDescobrirColunasExtras) em vez de fixar esses nomes no
// código — se o schema mudar de novo no futuro, o formulário se
// adapta sozinho sem precisar de outra rodada de correção aqui.
// =========================================================

const TP_COLUNAS_CONHECIDAS = new Set(["id", "ativa", "competicao_id", "criado_em"]);

let tpColunasExtras = null; // descoberta em runtime, ver tpDescobrirColunasExtras()

// ---------- DESCOBERTA DE SCHEMA ----------

async function tpDescobrirColunasExtras() {
  if (tpColunasExtras) return tpColunasExtras;

  const { data, error } = await supabaseClient.from("temporadas").select("*").limit(1);

  if (error || !data?.length) {
    console.error("Não foi possível descobrir colunas de 'temporadas', usando fallback nome/ano/total_rodadas:", error);
    tpColunasExtras = ["nome", "ano", "total_rodadas"];
    return tpColunasExtras;
  }

  tpColunasExtras = Object.keys(data[0]).filter(c => !TP_COLUNAS_CONHECIDAS.has(c));
  return tpColunasExtras;
}

function tpRotuloCampo(coluna) {
  return coluna.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Valor padrão sensato para cada campo extra, usado só para pré-
// preencher o formulário (o usuário pode mudar à vontade). Colunas
// não listadas aqui ficam em branco.
function tpValorPadraoCampo(coluna) {
  const hoje = new Date();
  if (coluna === "ano") return String(hoje.getFullYear());
  if (coluna === "nome") return String(hoje.getFullYear());
  if (coluna === "total_rodadas") return "38";
  return "";
}

// ---------- LISTAGEM ----------

async function carregarTemporadasAdmin() {
  const container = document.getElementById("listaTemporadasAdmin");
  if (!container) return;

  const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
  if (!competicaoAtual) {
    container.innerHTML = `<p class="text-dim" style="font-size:12.5px;">Nenhuma competição selecionada.</p>`;
    return;
  }

  document.getElementById("tituloAbaTemporadas").innerText = `Temporadas — ${competicaoAtual.nome_curto}`;

  const { data: temporadas, error } = await supabaseClient
    .from("temporadas")
    .select("*")
    .eq("competicao_id", competicaoAtual.id)
    .order("criado_em", { ascending: false });

  if (error) {
    container.innerHTML = `<p class="text-dim" style="font-size:12.5px;">Erro ao carregar temporadas.</p>`;
    console.error(error);
    return;
  }

  const colunasExtras = await tpDescobrirColunasExtras();

  container.innerHTML = (temporadas || []).length
    ? temporadas.map(t => `
        <div class="flex-gap" style="align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line);">
          <div>
            <strong style="font-size:13.5px;">${colunasExtras.map(c => t[c]).filter(v => v !== null && v !== undefined && v !== "").join(" · ") || t.id.slice(0, 8)}</strong>
            ${t.ativa ? `<span class="badge-ativa">Ativa</span>` : ""}
          </div>
          ${!t.ativa ? `<button class="btn btn-secondary btn-sm" onclick="ativarTemporadaAdmin('${t.id}')">Ativar</button>` : ""}
        </div>
      `).join("")
    : `<p class="text-dim" style="font-size:12.5px;">Nenhuma temporada cadastrada para esta competição.</p>`;
}

// Monta os campos do formulário de criação dinamicamente, a partir das
// colunas extras descobertas — hoje: nome, ano, total_rodadas.
async function montarFormularioNovaTemporada() {
  const colunasExtras = await tpDescobrirColunasExtras();
  const container = document.getElementById("camposNovaTemporadaAdmin");

  container.innerHTML = colunasExtras.map(c => `
    <div class="field">
      <label>${tpRotuloCampo(c)}</label>
      <input type="text" data-campo-temporada="${c}" value="${tpValorPadraoCampo(c)}" placeholder="${tpRotuloCampo(c)}">
    </div>
  `).join("");
}

// Lê os campos do formulário, convertendo "ano"/"total_rodadas" para
// número (a coluna no banco é integer — mandar string dá erro).
function tpLerCamposFormulario() {
  const campos = {};
  document.querySelectorAll("#camposNovaTemporadaAdmin [data-campo-temporada]").forEach(input => {
    const coluna = input.dataset.campoTemporada;
    const valor = input.value.trim();
    campos[coluna] = (coluna === "ano" || coluna === "total_rodadas") ? Number(valor || 0) : valor;
  });
  return campos;
}

// ---------- ATIVAR ----------

// Arquiva todas as outras temporadas da mesma competição (ativa=false)
// e ativa a escolhida — só uma ativa por competição de cada vez, como
// já funciona hoje.
async function ativarTemporadaAdmin(temporadaId) {
  const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
  if (!competicaoAtual) return;

  const r1 = await supabaseClient.from("temporadas").update({ ativa: false }).eq("competicao_id", competicaoAtual.id);
  if (r1.error) { notificar(r1.error.message, "erro"); return; }

  const r2 = await supabaseClient.from("temporadas").update({ ativa: true }).eq("id", temporadaId);
  if (r2.error) { notificar(r2.error.message, "erro"); return; }

  notificar("Temporada ativada! Recarregando...");
  setTimeout(() => location.reload(), 800);
}

// ---------- CRIAR NOVA TEMPORADA (mantendo a antiga arquivada) ----------

async function criarNovaTemporadaAdmin() {
  const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
  if (!competicaoAtual) { notificar("Nenhuma competição selecionada.", "erro"); return; }

  const campos = tpLerCamposFormulario();

  // Arquiva as temporadas existentes desta competição antes de criar a
  // nova já ativa (mesma regra de ativarTemporadaAdmin).
  const r1 = await supabaseClient.from("temporadas").update({ ativa: false }).eq("competicao_id", competicaoAtual.id);
  if (r1.error) { notificar(r1.error.message, "erro"); return; }

  const { error } = await supabaseClient.from("temporadas").insert([{
    ...campos,
    competicao_id: competicaoAtual.id,
    ativa: true,
  }]);

  if (error) { notificar(error.message, "erro"); return; }

  notificar("Nova temporada criada e ativada! Recarregando...");
  setTimeout(() => location.reload(), 800);
}

// ---------- "NOVA TEMPORADA (ZERAR TUDO)" ----------
// Apaga times/jogos/posts/etc. da temporada ATUALMENTE ativa da
// competição selecionada, e cria uma temporada nova e vazia no lugar.
// Operação destrutiva e irreversível — por isso pede confirmação dupla
// (texto digitado) antes de rodar.

async function confirmarZerarTemporadaAdmin() {
  const competicaoAtual = typeof getCompeticaoAtual === "function" ? await getCompeticaoAtual() : null;
  if (!competicaoAtual || !temporadaAtiva) {
    notificar("Nenhuma temporada ativa para zerar.", "erro");
    return;
  }

  const digitado = prompt(
    `Isso vai APAGAR PERMANENTEMENTE todos os times, jogos e posts da temporada atual de ${competicaoAtual.nome_curto}.\n\nDigite ZERAR para confirmar:`
  );

  if (digitado !== "ZERAR") {
    if (digitado !== null) notificar("Confirmação incorreta — nada foi apagado.", "aviso");
    return;
  }

  await zerarTemporadaAdmin(temporadaAtiva.id, competicaoAtual.id);
}

async function zerarTemporadaAdmin(temporadaId, competicaoId) {
  notificar("Apagando dados da temporada, aguarde...", "aviso");

  try {
    // 1) Times desta temporada (precisamos dos ids pra apagar tudo que
    //    depende de time_id nas tabelas abaixo).
    const { data: times } = await supabaseClient.from("times").select("id").eq("temporada_id", temporadaId);
    const idsTimes = (times || []).map(t => t.id);

    // 2) Jogos desta temporada (precisamos dos ids pra apagar tudo que
    //    depende de jogo_id).
    const { data: jogos } = await supabaseClient.from("jogos").select("id").eq("temporada_id", temporadaId);
    const idsJogos = (jogos || []).map(j => j.id);

    // 3) Filhos de "jogos".
    if (idsJogos.length) {
      await supabaseClient.from("eventos_jogo").delete().in("jogo_id", idsJogos);
      await supabaseClient.from("arbitragem_jogo").delete().in("jogo_id", idsJogos);
      await supabaseClient.from("gols_jogo").delete().in("jogo_id", idsJogos);
      await supabaseClient.from("escalacoes_tecnico").delete().in("jogo_id", idsJogos);
    }

    // 4) Filhos de "times".
    if (idsTimes.length) {
      await supabaseClient.from("bid_solicitacoes").delete().in("time_id", idsTimes);
      await supabaseClient.from("bid_transferencias").delete().in("time_dono_id", idsTimes);
      await supabaseClient.from("bid_transferencias").delete().in("time_interessado_id", idsTimes);
      await supabaseClient.from("jogadores_a_venda").delete().in("time_id", idsTimes);
      await supabaseClient.from("orcamento_movimentacoes").delete().in("time_id", idsTimes);
      await supabaseClient.from("propostas_tecnico").delete().in("time_id", idsTimes);

      // Técnicos não são apagados (a conta de login é do usuário) — só
      // desvinculados do time que está sendo removido.
      await supabaseClient.from("tecnicos").update({ time_id: null, status: "disponivel" }).in("time_id", idsTimes);

      await supabaseClient.from("jogadores").delete().in("time_id", idsTimes);
    }

    // 5) Jogos e posts da rede social (se a tabela existir neste projeto).
    await supabaseClient.from("jogos").delete().eq("temporada_id", temporadaId);

    const { error: erroPosts } = await supabaseClient.from("posts_rede_social").delete().eq("temporada_id", temporadaId);
    if (erroPosts) console.warn("posts_rede_social: tabela pode não existir ainda neste projeto —", erroPosts.message);

    await supabaseClient.from("noticias").delete().eq("temporada_id", temporadaId);

    // 6) Times por último (depois de tudo que referenciava time_id já ter sumido).
    await supabaseClient.from("times").delete().eq("temporada_id", temporadaId);

    // 7) Arquiva a temporada zerada e cria uma nova, já ativa, copiando
    //    os campos extras preenchidos no formulário (se houver).
    await supabaseClient.from("temporadas").update({ ativa: false }).eq("id", temporadaId);

    const campos = tpLerCamposFormulario();

    const { error: erroInsert } = await supabaseClient.from("temporadas").insert([{
      ...campos,
      competicao_id: competicaoId,
      ativa: true,
    }]);

    if (erroInsert) { notificar(erroInsert.message, "erro"); return; }

    notificar("Temporada zerada e nova temporada criada! Recarregando...");
    setTimeout(() => location.reload(), 1000);
  } catch (e) {
    console.error("Erro ao zerar temporada:", e);
    notificar("Erro ao zerar temporada — veja o console para detalhes.", "erro");
  }
}
