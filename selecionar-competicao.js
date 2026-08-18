// =========================================================
// SELECIONAR COMPETIÇÃO — tela de entrada do site. Antes o usuário
// escolhia o campeonato num dropdown lá no topbar, depois de já estar
// dentro do site (comportamento antigo, ainda usado como referência
// em competicoes.js). Agora a escolha acontece ANTES: quem entra no
// site cai aqui primeiro, escolhe o campeonato, e só então vai pra
// home (index.html) já com a competição salva. Reaproveita
// listarCompeticoes() de competicoes.js — não duplica a busca.
// =========================================================

async function carregarSelecaoCompeticoes() {
  const area = document.getElementById("listaCompeticoes");

  const competicoes = await listarCompeticoes();

  if (!competicoes || !competicoes.length) {
    area.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Nenhum campeonato disponível</h3></div>`;
    return;
  }

  area.innerHTML = competicoes.map(c => `
    <button
      class="sel-comp-card"
      style="--cor-item: ${c.cor_primaria};"
      onclick="irParaCompeticao('${c.slug}')"
    >
      <span class="sel-comp-card-emoji">${c.logo_emoji || "🏆"}</span>
      <span class="sel-comp-card-nome">${c.nome_curto || c.nome}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sel-comp-card-seta">
        <path d="m9 6 6 6-6 6"/>
      </svg>
    </button>
  `).join("");
}

// Salva a escolha (mesma chave usada por selecionarCompeticao em
// competicoes.js, pra todo o resto do site continuar funcionando sem
// mudanças) e manda pra home, já com a competição definida.
//
// O "passe" pra não cair de novo no redirect de index.html vai na
// própria URL (?ok=1), não em sessionStorage. Antes usava
// sessionStorage, mas em alguns fluxos de redirect da Vercel
// (cleanUrls) esse valor não sobrevivia até o <head> de index.html
// rodar, e o passe se perdia — daí o loop (index manda pra cá → aqui
// manda pra index → index não vê o passe → manda pra cá de novo). Uma
// query string chega garantida no destino porque faz parte da própria
// URL da navegação, sem depender de nenhum storage do navegador.
function irParaCompeticao(slug) {
  localStorage.setItem(COMPETICAO_STORAGE_KEY, slug);
  window.location.href = "index?ok=1";
}

document.addEventListener("DOMContentLoaded", carregarSelecaoCompeticoes);
