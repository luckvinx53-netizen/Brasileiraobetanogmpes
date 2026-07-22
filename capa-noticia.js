// =========================================================
// GERADOR DE CAPAS DE NOTÍCIA
// Desenha um "card esportivo" em Canvas (sem IA de imagem,
// sem rostos de pessoas) e sobe pro Supabase Storage.
// =========================================================

let __capasTimesCache = [];

function atualizarCamposEstilo() {
  const estilo = document.getElementById("capaEstilo").value;
  const camposPlacar = document.getElementById("camposPlacar");
  if (estilo === "resultado") camposPlacar.classList.remove("hidden");
  else camposPlacar.classList.add("hidden");
  desenharCapa();
}

// Popula os selects de time do gerador (chamado depois que timesCache existir)
function popularSelectsCapa() {
  const selects = [document.getElementById("capaTime"), document.getElementById("capaTimeAdversario")];
  if (!selects[0]) return;

  __capasTimesCache = (typeof timesCache !== "undefined") ? timesCache : [];

  selects.forEach((sel, i) => {
    const placeholder = i === 0
      ? `<option value="">Nenhum / genérico</option>`
      : `<option value="">—</option>`;
    sel.innerHTML = placeholder + __capasTimesCache
      .map(t => `<option value="${t.id}">${t.nome}</option>`)
      .join("");
  });

  desenharCapa();
}

function corDoTime(time) {
  // Paleta simples baseada em palavras-chave comuns de camisas —
  // fallback pro verde do próprio site se não achar nada.
  const nome = (time?.nome || "").toLowerCase();
  const paleta = [
    { chave: ["corinthians", "botafogo", "vasco", "atlético-mg", "atletico-mg"], cor: "#141414", accent: "#ffffff" },
    { chave: ["flamengo", "internacional", "athletico", "bahia"], cor: "#7a0c1e", accent: "#ffffff" },
    { chave: ["palmeiras", "chapecoense", "coritiba", "fluminense", "américa"], cor: "#0d5c34", accent: "#ffffff" },
    { chave: ["cruzeiro", "avaí", "grêmio", "gremio"], cor: "#0b4c8c", accent: "#ffffff" },
    { chave: ["são paulo", "sao paulo", "santos", "vitória", "vitoria"], cor: "#1c1c1c", accent: "#e8b74d" },
  ];
  for (const p of paleta) {
    if (p.chave.some(c => nome.includes(c))) return p;
  }
  return { cor: "#12161d", accent: "#3ddc84" };
}

function quebrarLinhas(ctx, texto, maxLargura) {
  const palavras = texto.split(" ");
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

function desenharCapa() {
  const canvas = document.getElementById("canvasCapa");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  const estilo = document.getElementById("capaEstilo").value;
  const timeId = document.getElementById("capaTime").value;
  const timeAdvId = document.getElementById("capaTimeAdversario").value;
  const titulo = (document.getElementById("capaTitulo").value || "TÍTULO DA NOTÍCIA").toUpperCase();
  const subtitulo = document.getElementById("capaSubtitulo").value || "";
  const placar1 = document.getElementById("capaPlacar1").value || "0";
  const placar2 = document.getElementById("capaPlacar2").value || "0";

  const time = __capasTimesCache.find(t => t.id === timeId);
  const timeAdv = __capasTimesCache.find(t => t.id === timeAdvId);
  const paleta = corDoTime(time);

  // ---------- FUNDO ----------
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0a0d12");
  grad.addColorStop(0.55, paleta.cor);
  grad.addColorStop(1, "#0a0d12");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // textura sutil: linhas diagonais de campo
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

  // vinheta lateral pra dar contraste ao texto
  const vinheta = ctx.createLinearGradient(0, H * 0.35, 0, H);
  vinheta.addColorStop(0, "rgba(0,0,0,0)");
  vinheta.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = vinheta;
  ctx.fillRect(0, 0, W, H);

  // ---------- FAIXA DE TOPO (marca / eyebrow) ----------
  const corFaixa = estilo === "breaking" ? "#e5484d" : (estilo === "resultado" ? "#e8b74d" : "#3ddc84");
  const corFaixaTexto = estilo === "resultado" ? "#241a04" : "#ffffff";

  ctx.fillStyle = corFaixa;
  ctx.fillRect(0, 0, W, 64);

  ctx.fillStyle = corFaixaTexto;
  ctx.font = "800 30px 'Arial Black', Arial, sans-serif";
  ctx.textBaseline = "middle";
  const rotulo = estilo === "breaking" ? "ÚLTIMAS NOTÍCIAS" : (estilo === "resultado" ? "RESULTADO" : "DESTAQUE");
  ctx.fillText("● " + rotulo, 36, 32);

  ctx.font = "700 24px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("BRASILEIRÃO PES", W - 36, 32);
  ctx.textAlign = "left";

  // ---------- CONTEÚDO ----------
  if (estilo === "resultado") {
    // Placar central grande
    ctx.textAlign = "center";

    // nomes dos times
    ctx.font = "700 34px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText((time?.nome || "TIME 1").toUpperCase(), W * 0.27, H * 0.42);
    ctx.fillText((timeAdv?.nome || "TIME 2").toUpperCase(), W * 0.73, H * 0.42);

    // placar
    ctx.font = "800 130px Arial, sans-serif";
    ctx.fillStyle = paleta.accent;
    ctx.fillText(`${placar1}  x  ${placar2}`, W * 0.5, H * 0.42 + 100);

    ctx.textAlign = "left";
  } else {
    // escudo/iniciais do time (se houver), como selo decorativo
    if (time) {
      const raio = 70;
      const cx = 100, cy = H - 220;
      ctx.beginPath();
      ctx.arc(cx, cy, raio, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 46px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const sig = (time.sigla || time.nome || "?").slice(0, 3).toUpperCase();
      ctx.fillText(sig, cx, cy + 4);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
  }

  // título principal (várias linhas se precisar)
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 64px Arial, sans-serif";
  const linhas = quebrarLinhas(ctx, titulo, W - 80);
  const baseY = H - 150;
  linhas.slice(0, 3).forEach((linha, i) => {
    ctx.fillText(linha, 40, baseY + i * 68);
  });

  // subtítulo
  if (subtitulo) {
    ctx.font = "500 30px Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    const yLinhaSub = baseY + linhas.slice(0, 3).length * 68 + 8;
    ctx.fillText(subtitulo, 40, Math.min(yLinhaSub, H - 30));
  }
}

// Converte o canvas em Blob e sobe pro Supabase Storage
async function usarCapaGerada() {
  const canvas = document.getElementById("canvasCapa");
  const status = document.getElementById("statusUploadCapa");

  status.innerText = "Gerando imagem...";

  canvas.toBlob(async (blob) => {
    if (!blob) {
      status.innerText = "Erro ao gerar imagem do canvas.";
      return;
    }

    const nomeArquivo = `capa-${Date.now()}.png`;

    status.innerText = "Enviando pro Supabase...";

    const { data, error } = await supabaseClient
      .storage
      .from("capas-noticias")
      .upload(nomeArquivo, blob, { contentType: "image/png", upsert: false });

    if (error) {
      status.innerText = "Erro no upload: " + error.message;
      notificar("Erro ao subir a capa: " + error.message, "erro");
      return;
    }

    const { data: urlData } = supabaseClient
      .storage
      .from("capas-noticias")
      .getPublicUrl(nomeArquivo);

    document.getElementById("imagemNoticia").value = urlData.publicUrl;
    status.innerText = "✅ Capa enviada e preenchida no campo de imagem da notícia abaixo!";
    notificar("Capa gerada e anexada à notícia!");
  }, "image/png");
}

// Desenha uma vez ao carregar (mesmo sem times ainda)
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("canvasCapa")) desenharCapa();
});
