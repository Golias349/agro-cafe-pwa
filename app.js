// Atualiza a data automaticamente
document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

// Registra o service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registrado!"))
    .catch(err => console.error("Erro ao registrar Service Worker", err));
}
