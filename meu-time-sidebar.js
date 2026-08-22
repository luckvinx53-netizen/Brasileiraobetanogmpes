// =========================================================
// MEU TIME — toggle da sidebar no mobile (área do técnico).
// Puramente visual: não interfere na lógica de seções, que
// continua em abrirSecaoMeuTime() (meu-time.js).
// =========================================================

function abrirSidebarMeuTime() {
  document.getElementById("mtSidebar")?.classList.add("aberta");
  document.getElementById("mtSidebarOverlay")?.classList.add("aberta");
}

function fecharSidebarMeuTime() {
  document.getElementById("mtSidebar")?.classList.remove("aberta");
  document.getElementById("mtSidebarOverlay")?.classList.remove("aberta");
}

// Fecha a sidebar automaticamente ao escolher uma seção no mobile,
// pra não ficar cobrindo o conteúdo depois de navegar.
document.addEventListener("click", (e) => {
  const dentroDaSidebar = e.target.closest("#mtSidebar");
  const ehLinkDeSecao = e.target.closest(".mt-sidebar-link");
  if (dentroDaSidebar && ehLinkDeSecao && window.innerWidth <= 860) {
    fecharSidebarMeuTime();
  }
});
