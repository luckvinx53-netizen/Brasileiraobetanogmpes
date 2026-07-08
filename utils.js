// =========================================================
// UTILITÁRIOS COMPARTILHADOS
// =========================================================

function notificar(texto, tipo = "sucesso") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.innerText = texto;
  toast.className = "";
  if (tipo === "erro") toast.classList.add("erro");
  else if (tipo === "aviso") toast.classList.add("aviso");
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function statusClasse(status) {
  const map = {
    "Agendado": "status-agendado",
    "Em andamento": "status-andamento",
    "Encerrado": "status-encerrado",
    "Adiado": "status-adiado"
  };
  return map[status] || "status-agendado";
}

function escudoHtml(time, tamanhoClasse = "escudo") {
  if (!time) return `<div class="escudo-placeholder">?</div>`;
  if (time.escudo_url) {
    return `<img class="${tamanhoClasse}" src="${time.escudo_url}" alt="${time.nome}" onerror="this.outerHTML='<div class=&quot;escudo-placeholder&quot;>${sigla(time)}</div>'">`;
  }
  return `<div class="escudo-placeholder">${sigla(time)}</div>`;
}

function sigla(time) {
  if (time.sigla) return time.sigla.slice(0, 3).toUpperCase();
  if (time.nome) return time.nome.slice(0, 3).toUpperCase();
  return "?";
}

function formatarData(dataStr) {
  if (!dataStr) return "";
  const [ano, mes, dia] = dataStr.split("-");
  if (!ano) return dataStr;
  return `${dia}/${mes}/${ano}`;
}

// Busca a temporada ativa (a maioria das telas só precisa do id dela)
async function getTemporadaAtiva() {
  const { data, error } = await supabaseClient
    .from("temporadas")
    .select("*")
    .eq("ativa", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

// Aplica a classe "active" no item certo da navbar, com base no arquivo atual
function marcarNavAtiva() {
  const pagina = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".bottom-nav a").forEach(a => {
    const href = a.getAttribute("href");
    if (href === pagina) a.classList.add("active");
    else a.classList.remove("active");
  });
}

document.addEventListener("DOMContentLoaded", marcarNavAtiva);

// Card de jogo (scoreboard) reutilizado em home, jogos e detalhes
function jogoCardHtml(jogo) {
  const casa = jogo.time_casa;
  const fora = jogo.time_fora;
  const temPlacar = jogo.status !== "Agendado" && jogo.status !== "Adiado";

  return `
    <div class="scoreboard" onclick="location.href='jogo.html?id=${jogo.id}'">
      <div class="scoreboard-top">
        <span class="scoreboard-meta">${jogo.rodada}ª rodada</span>
        <span class="status-pill ${statusClasse(jogo.status)}">${jogo.status}</span>
      </div>
      <div class="scoreboard-main">
        <div class="time-col esquerda">
          ${escudoHtml(casa)}
          <span class="time-nome">${casa ? casa.nome : "—"}</span>
        </div>
        <div class="${temPlacar ? 'placar-display' : 'placar-vs'}">
          ${temPlacar
            ? `${jogo.placar_casa ?? 0}<span class="sep">:</span>${jogo.placar_fora ?? 0}`
            : `VS`}
        </div>
        <div class="time-col direita">
          ${escudoHtml(fora)}
          <span class="time-nome">${fora ? fora.nome : "—"}</span>
        </div>
      </div>
      <div class="scoreboard-info">
        <span>📍 ${jogo.local || "Local a definir"}</span>
        <span>${formatarData(jogo.data_jogo)} ${jogo.hora_jogo || ""}</span>
      </div>
    </div>
  `;
}
