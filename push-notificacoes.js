// =========================================================
// NOTIFICAÇÕES PUSH — inscrição do visitante
// =========================================================

// Chave pública VAPID (pode ficar exposta, é a parte pública do par)
const VAPID_PUBLIC_KEY = "BCEwi3tS8_VuG6P_seY7bLbIwjVMwYV9x51SRu5lxzp9eFYWrtMxsLmiuyhoycM-9DhNVbt6CVgyBD4wxwVyVts";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function suportaPush() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

async function statusInscricaoPush() {
  if (!suportaPush()) return "sem-suporte";
  if (Notification.permission === "denied") return "negado";

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return "inativo";

  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "ativo" : "inativo";
}

async function ativarNotificacoesPush() {
  if (!suportaPush()) {
    notificar("Seu navegador não suporta notificações push.", "aviso");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permissao = await Notification.requestPermission();
    if (permissao !== "granted") {
      notificar("Permissão de notificação não concedida.", "aviso");
      return false;
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON();

    const { error } = await supabaseClient.from("push_subscriptions").upsert({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    }, { onConflict: "endpoint" });

    if (error) {
      console.error(error);
      notificar("Erro ao salvar inscrição: " + error.message, "erro");
      return false;
    }

    notificar("Notificações de gol ativadas! ⚽");
    return true;
  } catch (e) {
    console.error(e);
    notificar("Erro ao ativar notificações: " + e.message, "erro");
    return false;
  }
}

async function desativarNotificacoesPush() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await supabaseClient.from("push_subscriptions").delete().eq("endpoint", endpoint);

    notificar("Notificações de gol desativadas.");
  } catch (e) {
    console.error(e);
    notificar("Erro ao desativar: " + e.message, "erro");
  }
}

// Atualiza visualmente o botão de notificação, se existir na página.
// Quando já está ativo, o botão SOME (em vez de virar "Notificações
// ativadas") — não faz sentido continuar ocupando espaço na Home só
// pra confirmar um estado que o visitante já escolheu.
async function atualizarBotaoNotificacao() {
  const btn = document.getElementById("btnNotificacoes");
  if (!btn) return;

  const status = await statusInscricaoPush();

  if (status === "sem-suporte" || status === "ativo") {
    btn.classList.add("hidden");
    return;
  }

  btn.classList.remove("hidden");
  btn.innerHTML = "🔕 Ativar notificações de gol";
  btn.onclick = async () => {
    const ok = await ativarNotificacoesPush();
    if (ok) atualizarBotaoNotificacao();
  };
}

async function desativarComConfirmacao() {
  if (!confirm("Desativar notificações de gol?")) return;
  await desativarNotificacoesPush();
  atualizarBotaoNotificacao();
}

document.addEventListener("DOMContentLoaded", atualizarBotaoNotificacao);
