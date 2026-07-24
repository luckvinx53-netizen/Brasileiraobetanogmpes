// =========================================================
// REDE SOCIAL DO CAMPEONATO
// Gera e lista os posts do "perfil oficial" de cada clube:
// matchday, escalação, fim de jogo e nota oficial (CBF).
//
// A "arte" de cada post é desenhada num <canvas> off-screen (mesmo
// estilo visual do gerador de capas em capa-noticia.js: faixa de
// topo colorida, gradiente com a cor do time, textura de campo) e
// sobe pro Supabase Storage (bucket "posts-rede-social"), igual ao
// que já é feito hoje pra capas de notícia manuais.
//
// Os posts automáticos (matchday/escalação/fim de jogo) são criados
// por QUALQUER visitante que esteja com o site aberto no momento
// certo — mesmo princípio de checarEncerramentoAutomatico() em
// utils.js. A tabela tem um índice único (jogo_id, time_id, tipo)
// que evita duplicar o mesmo post se duas pessoas gerarem ao mesmo
// tempo (o segundo insert simplesmente falha por conflito, e isso
// é ignorado silenciosamente).
// =========================================================

const RS_LARGURA_ARTE = 1080;
const RS_ALTURA_ARTE = 1080;
const RS_BUCKET = "posts-rede-social";

// ---------- PALETA (reaproveita a mesma lógica de capa-noticia.js) ----------

function rsCorDoTime(time) {
  if (typeof corDoTime === "function") return corDoTime(time);
  return { cor: "#12161d", accent: "#3ddc84" };
}

// ---------- CANVAS HELPERS ----------

function rsCriarCanvasOffscreen() {
  const canvas = document.createElement("canvas");
  canvas.width = RS_LARGURA_ARTE;
  canvas.height = RS_ALTURA_ARTE;
  return canvas;
}

function rsQuebrarLinhas(ctx, texto, maxLargura) {
  const palavras = (texto || "").split(" ");
  const linhas = [];
  let atual = "";
  palavras.forEach(palavra => {
    const teste = atual ? atual + " " + palavra : palavra;
    if (ctx.measureText(teste).width > maxLargura && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  });
  if (atual) linhas.push(atual);
  return linhas;
}

// Fundo padrão de todas as artes: gradiente com a cor do time +
// textura diagonal sutil, igual ao estilo já usado nas capas de notícia.
function rsDesenharFundo(ctx, W, H, paleta) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0a0d12");
  grad.addColorStop(0.55, paleta.cor);
  grad.addColorStop(1, "#0a0d12");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  for (let x = -H; x < W; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }
  ctx.restore();
}

// Faixa de topo com rótulo (ex: "ESCALAÇÃO") + nome da competição.
function rsDesenharFaixaTopo(ctx, W, corFaixa, corTexto, rotulo, nomeCompeticao) {
  ctx.fillStyle = corFaixa;
  ctx.fillRect(0, 0, W, 64);

  ctx.fillStyle = corTexto;
  ctx.font = "800 28px 'Arial Black', Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("● " + rotulo, 36, 32);

  ctx.font = "700 22px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText((nomeCompeticao || "").toUpperCase(), W - 36, 32);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// Selo circular com a sigla do time (mesmo estilo do capa-noticia.js).
function rsDesenharSeloTime(ctx, time, cx, cy, raio) {
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.round(raio * 0.6)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const sig = (time?.sigla || time?.nome || "?").slice(0, 3).toUpperCase();
  ctx.fillText(sig, cx, cy + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// ---------- ARTE: MATCHDAY ----------
// Anuncia o jogo do dia no perfil do time (casa e fora, horário, local).

function rsDesenharArteMatchday(canvas, { jogo, timeCasa, timeFora, nomeCompeticao }) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const paleta = rsCorDoTime(timeCasa);

  rsDesenharFundo(ctx, W, H, paleta);
  rsDesenharFaixaTopo(ctx, W, "#3ddc84", "#ffffff", "MATCHDAY", nomeCompeticao);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 30px Arial, sans-serif";
  ctx.fillText(`${jogo.rodada}ª RODADA`, W / 2, 150);

  rsDesenharSeloTime(ctx, timeCasa, W * 0.28, H * 0.45, 90);
  rsDesenharSeloTime(ctx, timeFora, W * 0.72, H * 0.45, 90);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 46px Arial, sans-serif";
  ctx.fillText("VS", W / 2, H * 0.45 + 16);

  ctx.font = "700 32px Arial, sans-serif";
  const nomeCasaLinhas = rsQuebrarLinhas(ctx, (timeCasa?.nome || "—").toUpperCase(), 340);
  const nomeForaLinhas = rsQuebrarLinhas(ctx, (timeFora?.nome || "—").toUpperCase(), 340);
  nomeCasaLinhas.forEach((l, i) => ctx.fillText(l, W * 0.28, H * 0.45 + 130 + i * 38));
  nomeForaLinhas.forEach((l, i) => ctx.fillText(l, W * 0.72, H * 0.45 + 130 + i * 38));

  ctx.font = "600 28px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const dataTxt = formatarData(jogo.data_jogo) + (jogo.hora_jogo ? " · " + jogo.hora_jogo : "");
  ctx.fillText(dataTxt, W / 2, H - 160);

  if (jogo.local) {
    ctx.font = "500 24px Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("📍 " + jogo.local, W / 2, H - 110);
  }

  ctx.textAlign = "left";
}

// ---------- ARTE: ESCALAÇÃO ----------
// Lista os titulares do time no jogo, no estilo "escalação oficial".

function rsDesenharArteEscalacao(canvas, { jogo, time, adversario, escalacao, jogadores, nomeCompeticao }) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const paleta = rsCorDoTime(time);

  rsDesenharFundo(ctx, W, H, paleta);
  rsDesenharFaixaTopo(ctx, W, "#e8b74d", "#241a04", "ESCALAÇÃO", nomeCompeticao);

  rsDesenharSeloTime(ctx, time, 110, 150, 56);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 34px Arial, sans-serif";
  ctx.textAlign = "left";
  const nomeLinhas = rsQuebrarLinhas(ctx, (time?.nome || "—").toUpperCase(), W - 260);
  nomeLinhas.slice(0, 2).forEach((l, i) => ctx.fillText(l, 190, 140 + i * 38));

  ctx.font = "500 24px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(`vs ${adversario?.nome || "—"} · ${jogo.rodada}ª rodada`, 190, 140 + nomeLinhas.slice(0, 2).length * 38 + 8);

  ctx.font = "700 26px Arial, sans-serif";
  ctx.fillStyle = "#e8b74d";
  ctx.textAlign = "center";
  ctx.fillText(escalacao?.formacao || "", W / 2, 250);

  // Lista dos titulares, na ordem salva (posicao_campo), 2 colunas.
  const titulares = (escalacao?.jogadores_titulares || [])
    .map(item => jogadores.find(j => j.id === item.jogador_id))
    .filter(Boolean);

  ctx.textAlign = "left";
  const colX = [80, W / 2 + 40];
  const linhaAltura = 58;
  const inicioY = 320;
  const porColuna = Math.ceil(titulares.length / 2) || 1;

  titulares.forEach((j, i) => {
    const col = Math.floor(i / porColuna);
    const linha = i % porColuna;
    const x = colX[col] ?? colX[0];
    const y = inicioY + linha * linhaAltura;

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(x + 18, y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 18px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(j.numero ?? "-"), x + 18, y + 6);

    ctx.textAlign = "left";
    ctx.font = "600 22px Arial, sans-serif";
    const nomeCurto = (j.nome || "").length > 20 ? j.nome.slice(0, 19) + "." : j.nome;
    ctx.fillText(nomeCurto, x + 46, y + 7);
  });

  ctx.textAlign = "left";
}

// ---------- ARTE: FIM DE JOGO ----------
// Placar final + rodada, no perfil de cada um dos dois times.

function rsDesenharArteFimDeJogo(canvas, { jogo, timeCasa, timeFora, pc, pf, nomeCompeticao }) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const vencedor = pc > pf ? timeCasa : (pf > pc ? timeFora : null);
  const paleta = rsCorDoTime(vencedor || timeCasa);

  rsDesenharFundo(ctx, W, H, paleta);
  rsDesenharFaixaTopo(ctx, W, "#e5484d", "#ffffff", "FIM DE JOGO", nomeCompeticao);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 28px Arial, sans-serif";
  ctx.fillText(`${jogo.rodada}ª RODADA`, W / 2, 150);

  rsDesenharSeloTime(ctx, timeCasa, W * 0.28, H * 0.4, 80);
  rsDesenharSeloTime(ctx, timeFora, W * 0.72, H * 0.4, 80);

  ctx.font = "700 28px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  const nCasa = rsQuebrarLinhas(ctx, (timeCasa?.nome || "—").toUpperCase(), 320);
  const nFora = rsQuebrarLinhas(ctx, (timeFora?.nome || "—").toUpperCase(), 320);
  nCasa.forEach((l, i) => ctx.fillText(l, W * 0.28, H * 0.4 + 115 + i * 34));
  nFora.forEach((l, i) => ctx.fillText(l, W * 0.72, H * 0.4 + 115 + i * 34));

  ctx.font = "800 130px Arial, sans-serif";
  ctx.fillStyle = paleta.accent || "#3ddc84";
  ctx.fillText(`${pc} x ${pf}`, W / 2, H * 0.4 + 100);

  ctx.font = "700 26px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(vencedor ? `Vitória do ${vencedor.nome}` : "Empate", W / 2, H - 130);

  ctx.textAlign = "left";
}

// ---------- UPLOAD ----------

// Converte o canvas em Blob PNG e sobe pro Storage, devolvendo a URL
// pública. `prefixo` ajuda a identificar o tipo de post no nome do
// arquivo (ex: "escalacao", "matchday", "fimdejogo").
function rsSubirArte(canvas, prefixo) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error("Falha ao gerar imagem do canvas."));

      const nomeArquivo = `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

      const { error } = await supabaseClient
        .storage
        .from(RS_BUCKET)
        .upload(nomeArquivo, blob, { contentType: "image/png", upsert: false });

      if (error) return reject(error);

      const { data: urlData } = supabaseClient
        .storage
        .from(RS_BUCKET)
        .getPublicUrl(nomeArquivo);

      resolve(urlData.publicUrl);
    }, "image/png");
  });
}

// ---------- CRIAÇÃO DE POSTS (idempotente) ----------

// Insere o post; se já existir um post desse tipo pra esse jogo/time
// (conflito no índice único), simplesmente ignora — outra aba/pessoa
// já deve ter gerado no mesmo instante.
async function rsInserirPostSeNaoExistir(post) {
  const { error } = await supabaseClient.from("posts_rede_social").insert([post]);
  // Código 23505 = unique_violation no Postgres. Nesse caso o post já
  // existe e não é um erro de verdade — só não duplica.
  if (error && error.code !== "23505") {
    console.error("Erro ao criar post na rede social:", error);
  }
}

// Gera (se ainda não existir) o post de MATCHDAY para os dois times de
// um jogo, no dia da partida. Chamado a partir de jogos.js/jogo.js.
async function rsGerarPostMatchdaySeNecessario(jogo, competicaoAtual) {
  if (!jogo?.time_casa || !jogo?.time_fora) return;

  const hoje = typeof dataLocalDeHoje === "function" ? dataLocalDeHoje() : new Date().toISOString().slice(0, 10);
  if (jogo.data_jogo !== hoje) return; // só no dia do jogo

  const canvas = rsCriarCanvasOffscreen();
  rsDesenharArteMatchday(canvas, {
    jogo, timeCasa: jogo.time_casa, timeFora: jogo.time_fora,
    nomeCompeticao: competicaoAtual?.nome_curto,
  });

  let urlImagem;
  try {
    urlImagem = await rsSubirArte(canvas, "matchday");
  } catch (e) {
    console.error("Falha ao gerar arte de matchday:", e);
    return;
  }

  const base = {
    competicao_id: competicaoAtual?.id || null,
    temporada_id: jogo.temporada_id,
    jogo_id: jogo.id,
    tipo: "matchday",
    imagem_svg: null,
    imagem_url: urlImagem,
  };

  await Promise.all([
    rsInserirPostSeNaoExistir({
      ...base,
      time_id: jogo.time_casa_id,
      titulo: `${jogo.time_casa.nome} recebe o ${jogo.time_fora.nome} hoje`,
      corpo: `${jogo.rodada}ª rodada · ${jogo.local || "local a definir"}`,
    }),
    rsInserirPostSeNaoExistir({
      ...base,
      time_id: jogo.time_fora_id,
      titulo: `${jogo.time_fora.nome} enfrenta o ${jogo.time_casa.nome} hoje`,
      corpo: `${jogo.rodada}ª rodada · ${jogo.local || "local a definir"}`,
    }),
  ]);
}

// Gera (se ainda não existir) o post de ESCALAÇÃO de um time, assim que
// a escalação dele estiver liberada para o público (mesma regra de
// mcEscalacaoLiberada em jogo.js: 30 min antes do jogo, ou já em
// andamento/encerrado). Chamado a partir de jogo.js, uma vez por time.
async function rsGerarPostEscalacaoSeNecessario({ jogo, time, adversario, escalacao, elenco, competicaoAtual }) {
  if (!escalacao || !time) return;

  const canvas = rsCriarCanvasOffscreen();
  rsDesenharArteEscalacao(canvas, {
    jogo, time, adversario, escalacao, jogadores: elenco,
    nomeCompeticao: competicaoAtual?.nome_curto,
  });

  let urlImagem;
  try {
    urlImagem = await rsSubirArte(canvas, "escalacao");
  } catch (e) {
    console.error("Falha ao gerar arte de escalação:", e);
    return;
  }

  await rsInserirPostSeNaoExistir({
    competicao_id: competicaoAtual?.id || null,
    temporada_id: jogo.temporada_id,
    time_id: time.id,
    jogo_id: jogo.id,
    tipo: "escalacao",
    titulo: `Escalação confirmada: ${time.nome}`,
    corpo: `${escalacao.formacao || ""} para enfrentar o ${adversario?.nome || "adversário"} · ${jogo.rodada}ª rodada`,
    imagem_url: urlImagem,
    imagem_svg: null,
  });
}

// Gera (se ainda não existir) o post de FIM DE JOGO para os dois times.
// Chamado a partir de checarEncerramentoAutomatico, quando o jogo acaba
// de ser marcado como Encerrado.
async function rsGerarPostFimDeJogoSeNecessario(jogo, pc, pf, competicaoAtual) {
  if (!jogo?.time_casa || !jogo?.time_fora) return;

  // Evita regenerar a arte (upload no Storage) toda vez que a página é
  // recarregada: se já existe QUALQUER post de fim de jogo pra esse
  // jogo (de qualquer um dos dois times), não faz nada. O índice único
  // do banco já impede duplicata no insert, mas checar antes evita o
  // trabalho de desenhar+subir a imagem de novo sem necessidade.
  const { data: existente } = await supabaseClient
    .from("posts_rede_social")
    .select("id")
    .eq("jogo_id", jogo.id)
    .eq("tipo", "fim_de_jogo")
    .limit(1);

  if (existente && existente.length > 0) return;

  const canvas = rsCriarCanvasOffscreen();
  rsDesenharArteFimDeJogo(canvas, {
    jogo, timeCasa: jogo.time_casa, timeFora: jogo.time_fora, pc, pf,
    nomeCompeticao: competicaoAtual?.nome_curto,
  });

  let urlImagem;
  try {
    urlImagem = await rsSubirArte(canvas, "fimdejogo");
  } catch (e) {
    console.error("Falha ao gerar arte de fim de jogo:", e);
    return;
  }

  const base = {
    competicao_id: competicaoAtual?.id || null,
    temporada_id: jogo.temporada_id,
    jogo_id: jogo.id,
    tipo: "fim_de_jogo",
    imagem_svg: null,
    imagem_url: urlImagem,
    titulo: `Fim de jogo: ${jogo.time_casa.nome} ${pc} x ${pf} ${jogo.time_fora.nome}`,
    corpo: `${jogo.rodada}ª rodada`,
  };

  await Promise.all([
    rsInserirPostSeNaoExistir({ ...base, time_id: jogo.time_casa_id }),
    rsInserirPostSeNaoExistir({ ...base, time_id: jogo.time_fora_id }),
  ]);
}

// ---------- NOTA OFICIAL (publicada manualmente pelo admin da CBF) ----------

async function rsPublicarNotaOficial({ titulo, corpo, competicaoAtual, temporadaId }) {
  const { data: { session } } = await supabaseClient.auth.getSession();

  const { error } = await supabaseClient.from("posts_rede_social").insert([{
    competicao_id: competicaoAtual?.id || null,
    temporada_id: temporadaId || null,
    time_id: null,
    eh_perfil_cbf: true,
    jogo_id: null,
    tipo: "nota_oficial",
    titulo,
    corpo,
    imagem_url: null,
    imagem_svg: null,
    publicado_por: session?.user?.id || null,
  }]);

  return { ok: !error, error };
}

// ---------- LEITURA / RENDERIZAÇÃO DO FEED ----------

const RS_TIPO_LABEL = {
  matchday: { icone: "📅", label: "Matchday" },
  escalacao: { icone: "📋", label: "Escalação" },
  fim_de_jogo: { icone: "⏱️", label: "Fim de jogo" },
  nota_oficial: { icone: "📢", label: "Nota oficial" },
};

// Busca os posts do feed, opcionalmente filtrando por competição e/ou
// por um time específico (perfil do clube).
async function rsListarPosts({ competicaoId, timeId, limite = 40 } = {}) {
  let query = supabaseClient
    .from("posts_rede_social")
    .select("*, time:time_id(*), jogo:jogo_id(*)")
    .order("criado_em", { ascending: false })
    .limit(limite);

  if (competicaoId) query = query.eq("competicao_id", competicaoId);
  if (timeId) query = query.eq("time_id", timeId);

  const { data, error } = await query;
  if (error) {
    console.error("Erro ao carregar posts da rede social:", error);
    return [];
  }
  return data || [];
}

// Monta o card HTML de um post, no estilo "rede social": cabeçalho com
// escudo+nome do perfil (time ou CBF), corpo de texto, imagem (se
// houver) e rodapé com data/hora.
function rsPostCardHtml(post) {
  const info = RS_TIPO_LABEL[post.tipo] || { icone: "📝", label: post.tipo };
  const nomePerfil = post.eh_perfil_cbf ? "CBF" : (post.time?.nome || "Perfil do clube");
  const escudo = post.eh_perfil_cbf
    ? `<div class="escudo-placeholder">CBF</div>`
    : escudoHtml(post.time, "escudo");
  const linkPerfil = post.eh_perfil_cbf ? "#" : `perfil?time=${post.time_id}`;
  const dataFormatada = new Date(post.criado_em).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return `
    <div class="rs-post-card">
      <div class="rs-post-cabecalho" onclick="location.href='${linkPerfil}'" style="${post.eh_perfil_cbf ? "cursor:default;" : "cursor:pointer;"}">
        ${escudo}
        <div class="rs-post-cabecalho-texto">
          <span class="rs-post-nome-perfil">${nomePerfil}</span>
          <span class="rs-post-tipo">${info.icone} ${info.label}</span>
        </div>
        <span class="rs-post-data">${dataFormatada}</span>
      </div>

      <div class="rs-post-corpo">
        <h3>${post.titulo}</h3>
        ${post.corpo ? `<p>${post.corpo}</p>` : ""}
      </div>

      ${post.imagem_url ? `<img class="rs-post-imagem" src="${post.imagem_url}" alt="${post.titulo}">` : ""}

      ${post.jogo_id ? `<a class="rs-post-link-jogo" href="jogo?id=${post.jogo_id}">Ver detalhes do jogo ›</a>` : ""}
    </div>
  `;
}

function rsFeedHtml(posts) {
  if (!posts.length) {
    return `
      <div class="empty-state">
        <div class="icon">📭</div>
        <h3>Nenhum post ainda</h3>
        <p>Matchday, escalações, fim de jogo e notas oficiais aparecem aqui automaticamente.</p>
      </div>
    `;
  }
  return posts.map(rsPostCardHtml).join("");
}
