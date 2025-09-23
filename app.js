// Atualiza a data automaticamente
document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

// Função para carregar dados do localStorage
function carregarAplicacoes() {
  const aplicacoes = JSON.parse(localStorage.getItem("aplicacoes")) || [];
  const lista = document.getElementById("listaAplicacoes");
  lista.innerHTML = "";
  let total = 0;

  aplicacoes.slice().reverse().forEach((ap, index) => {
    const li = document.createElement("li");
    li.textContent = ap.desc + " – " + ap.qtd + "g";

    const btn = document.createElement("button");
    btn.textContent = "Excluir";
    btn.className = "delete-btn";
    btn.onclick = () => excluirAplicacao(aplicacoes.length - 1 - index);

    li.appendChild(btn);
    lista.appendChild(li);

    total += parseFloat(ap.qtd);
  });

  document.getElementById("aplicacoesTotais").textContent = aplicacoes.length;
  document.getElementById("esteMes").textContent = aplicacoes.length; // simplificado
  document.getElementById("totalAplicado").textContent = total + "g";
}

// Função para excluir aplicação
function excluirAplicacao(index) {
  let aplicacoes = JSON.parse(localStorage.getItem("aplicacoes")) || [];
  aplicacoes.splice(index, 1);
  localStorage.setItem("aplicacoes", JSON.stringify(aplicacoes));
  carregarAplicacoes();
}

// Listener do formulário
document.getElementById("formAplicacao").addEventListener("submit", e => {
  e.preventDefault();
  const desc = document.getElementById("desc").value;
  const qtd = document.getElementById("qtd").value;

  let aplicacoes = JSON.parse(localStorage.getItem("aplicacoes")) || [];
  aplicacoes.push({ desc, qtd });
  localStorage.setItem("aplicacoes", JSON.stringify(aplicacoes));

  document.getElementById("formAplicacao").reset();
  carregarAplicacoes();
});

// Inicializa
carregarAplicacoes();

// Registra o service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registrado!"))
    .catch(err => console.error("Erro ao registrar Service Worker", err));
}
