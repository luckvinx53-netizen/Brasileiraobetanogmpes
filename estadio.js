// =========================================================
// DETALHES DO ESTÁDIO
// Aberta a partir do link no Resumo do jogo (jogo.html), recebe o nome do
// estádio via query string (?nome=...) e busca no time mandante os dados
// de foto/capacidade/cidade, além de listar os jogos já realizados ali.
// =========================================================

async function carregarEstadio() {
  const params = new URLSearchParams(window.location.search);
  const nomeEstadio = params.get("nome");
  const area = document.getElementById("detalhesEstadio");

  if (!nomeEstadio) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Estádio não encontrado</h3></div>`;
    return;
  }

  // O estádio é um dado do time mandante (não tem tabela própria), então
  // busca o time que tem esse estádio cadastrado pra pegar foto/cidade/capacidade.
  const { data: timeMandante, error: erroTime } = await supabaseClient
    .from("times")
    .select("*")
    .eq("estadio", nomeEstadio)
    .limit(1)
    .maybeSingle();

  if (erroTime) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar estádio</h3><p>${erroTime.message}</p></div>`;
    return;
  }

  // Todos os jogos já registrados nesse estádio (qualquer temporada),
  // usando o campo "local" gravado no jogo (que é herdado do time mandante
  // no momento do cadastro — ver estadioDoMandante() no admin).
  const { data: jogos, error: erroJogos } = await supabaseClient
    .from("jogos")
    .select("*, time_casa:time_casa_id(*), time_fora:time_fora_id(*)")
    .eq("local", nomeEstadio)
    .order("data_jogo", { ascending: false })
    .order("hora_jogo", { ascending: false });

  if (erroJogos) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar jogos do estádio</h3><p>${erroJogos.message}</p></div>`;
    return;
  }

  area.innerHTML = `
    ${eHeroHtml(nomeEstadio, timeMandante)}
    ${eJogosHtml(jogos || [])}
  `;
}

function eHeroHtml(nomeEstadio, time) {
  return `
    <div class="card">
      ${time?.foto_estadio ? `<img class="mc-estadio-foto" style="margin-top:0;" src="${time.foto_estadio}" alt="${nomeEstadio}">` : ""}

      <h2 style="font-family:var(--font-display);font-size:24px;margin:14px 0 12px;">${nomeEstadio}</h2>

      <div class="mc-estadio-detalhes">
        <div class="mc-estadio-item">
          <span class="mc-estadio-label">Cidade</span>
          <span class="mc-estadio-valor">${time?.cidade || "—"}</span>
        </div>
        ${time?.capacidade_estadio ? `
          <div class="mc-estadio-item">
            <span class="mc-estadio-label">Capacidade</span>
            <span class="mc-estadio-valor">${time.capacidade_estadio} lugares</span>
          </div>
        ` : ""}
        ${time ? `
          <div class="mc-estadio-item">
            <span class="mc-estadio-label">Mandante</span>
            <span class="mc-estadio-valor">${escudoHtml(time)} ${time.nome}</span>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function eJogosHtml(jogos) {
  if (!jogos.length) {
    return `
      <div class="card" style="margin-top:16px;">
        <div class="empty-state" style="padding:30px 20px;">
          <div class="icon">📋</div>
          <h3>Nenhum jogo registrado neste estádio ainda</h3>
        </div>
      </div>
    `;
  }

  const linhas = jogos.map(j => `
    <a class="admin-item" style="display:block;" href="jogo.html?id=${j.id}">
      <div class="title">${j.time_casa?.nome || "?"} ${j.placar_casa ?? "-"} x ${j.placar_fora ?? "-"} ${j.time_fora?.nome || "?"}</div>
      <div class="meta">${formatarData(j.data_jogo)}${j.hora_jogo ? " • " + j.hora_jogo : ""} · ${j.status}</div>
    </a>
  `).join("");

  return `
    <div class="card" style="margin-top:16px;">
      <h2 style="font-family:var(--font-display);font-size:20px;margin:0 0 10px;">Últimos jogos neste estádio</h2>
      ${linhas}
    </div>
  `;
}

carregarEstadio();
