// =========================================================
// VEÍCULO (página) — a "home" de um veículo de imprensa esportiva
// (Goal, Lance!, ESPN, UOL, TNT Sports, ge), aberta ao clicar em
// "Redação X" no topo de uma matéria. Lista, em formato de feed
// (como um site de notícia de verdade), todas as matérias assinadas
// por aquele veículo: fim de jogo e mercado (rumor/confirmada) —
// só quando a assinatura é "Redação X", não quando é repórter fixo
// de clube (esse já tem a própria página, reporter.html).
// =========================================================

function vgNomeVeiculoDaUrl() {
  const params = new URLSearchParams(location.search);
  return params.get("nome") || "";
}

async function vgCarregarVeiculo() {
  const area = document.getElementById("veiculoConteudo");
  const nomeVeiculo = vgNomeVeiculoDaUrl();
  const tema = typeof vtTemaPorNomeVeiculo === "function" ? vtTemaPorNomeVeiculo(nomeVeiculo) : null;

  if (!nomeVeiculo || !tema) {
    area.innerHTML = `<div class="empty-state"><div class="icon">📰</div><h3>Veículo não encontrado</h3><p>O link usado pode estar incorreto.</p></div>`;
    return;
  }

  // Veste a página inteira com o visual do veículo (mesmo tema usado
  // em materia.html — cabeçalho fiel ao site real, cores etc).
  if (typeof vtAplicarTema === "function") vtAplicarTema(nomeVeiculo);

  const [rumores, confirmadas, fimDeJogo] = await Promise.all([
    typeof buscarRumoresComoNoticias === "function" ? buscarRumoresComoNoticias() : [],
    typeof buscarConfirmadasComoNoticias === "function" ? buscarConfirmadasComoNoticias() : [],
    typeof buscarFimDeJogoComoNoticias === "function" ? buscarFimDeJogoComoNoticias() : [],
  ]);

  // Só entra no feed do veículo o que é realmente assinado por ele
  // como "Redação X" (assinatura.tipo === "veiculo") — matéria
  // assinada por repórter fixo de clube não aparece aqui, porque já
  // tem a própria página (reporter.html).
  const combinado = [...rumores, ...confirmadas, ...fimDeJogo]
    .filter(n => n.assinatura?.tipo === "veiculo" && n.assinatura?.nome === nomeVeiculo)
    .sort((a, b) => b.data - a.data);

  if (combinado.length === 0) {
    area.innerHTML = `
      <div class="vg-hero">
        <h1>${tema.slug === "ge" ? "ge" : nomeVeiculo}</h1>
        <p>Cobertura do Brasileirão</p>
      </div>
      <div class="empty-state"><div class="icon">📰</div><h3>Nada publicado ainda</h3><p>As matérias assinadas pela redação aparecem aqui.</p></div>
    `;
    return;
  }

  area.innerHTML = `
    <div class="vg-hero">
      <h1>${nomeVeiculo}</h1>
      <p>Cobertura do Brasileirão · ${combinado.length} matéria${combinado.length > 1 ? "s" : ""}</p>
    </div>
    <div class="vg-feed">
      ${combinado.map(n => vgCardHtml(n)).join("")}
    </div>
  `;
}

function vgCardHtml(n) {
  const href = n.origem === "jogo"
    ? `materia.html?id=${n.jogoId}&tipo=jogo`
    : `materia.html?id=${n.consultaId}&tipo=${n.origem}${n.veiculoParam ? "&veiculo=" + encodeURIComponent(n.veiculoParam) : ""}`;
  const icone = n.origem === "jogo" ? "⚽" : (n.origem === "rumor" ? "🗞️" : "✅");

  return `
    <a class="vg-card" href="${href}">
      <span class="vg-card-icone">${icone}</span>
      <div class="vg-card-body">
        <span class="vg-card-tag">${n.tag}</span>
        <h3>${n.titulo}</h3>
        <p>${n.resumo}</p>
        <time>${n.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</time>
      </div>
    </a>
  `;
}

vgCarregarVeiculo();
