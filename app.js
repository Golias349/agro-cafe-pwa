// Exemplo app.js corrigido

document.getElementById("data").textContent =
  new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
let aplicacoes = JSON.parse(localStorage.getItem("aplicacoes")) || [];

function salvarTudo() {
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  localStorage.setItem("estoque", JSON.stringify(estoque));
  localStorage.setItem("aplicacoes", JSON.stringify(aplicacoes));
}

function mostrarAba(id) {
  document.querySelectorAll('.aba').forEach(a => a.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// Funções de exemplo (adicionarTalhao, salvarAplicacao, etc.) aqui...
