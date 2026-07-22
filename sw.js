// =========================================================
// SERVICE WORKER — notificações push de gol
// Este arquivo PRECISA ficar na raiz do site (mesma pasta do
// index.html), não dentro de subpastas, para o navegador
// permitir que ele controle o site inteiro.
// =========================================================

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Chega um push do servidor (Edge Function) e exibimos a notificação
self.addEventListener("push", (event) => {
  let dados = { titulo: "Brasileirão PES", corpo: "Aconteceu um gol!", url: "/jogos" };

  try {
    if (event.data) {
      dados = { ...dados, ...event.data.json() };
    }
  } catch (e) {
    // se não vier JSON, usa o texto puro como corpo
    if (event.data) dados.corpo = event.data.text();
  }

  const opcoes = {
    body: dados.corpo,
    icon: "/icone-192.png",
    badge: "/icone-192.png",
    data: { url: dados.url || "/jogos" },
    vibrate: [100, 50, 100],
    tag: "gol-brasileirao", // agrupa notificações, evita empilhar demais
  };

  event.waitUntil(self.registration.showNotification(dados.titulo, opcoes));
});

// Ao clicar na notificação, abre (ou foca) o site na página de jogos
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/jogos";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
