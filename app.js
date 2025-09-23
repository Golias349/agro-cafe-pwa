// Atualiza a data automaticamente
document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
let talhaoAtual = null;
let chart = null;
let tipoGrafico = "bar";

// Renderizar lista de talhões
function renderizarTalhoes() {
  const lista = document.getElementById("listaTalhoes");
  lista.innerHTML = "";
  talhoes.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = t.nome + " (" + t.aplicacoes.length + " aplicações)";
    li.style.cursor = "pointer";
    li.onclick = () => abrirTalhao(i);
    lista.appendChild(li);
  });
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
}

// Abrir talhão
function abrirTalhao(index) {
  talhaoAtual = index;
  const talhao = talhoes[index];
  document.getElementById("tituloTalhao").textContent = talhao.nome;
  document.getElementById("totalAplicacoes").textContent = talhao.aplicacoes.length;

  let total = talhao.aplicacoes.reduce((acc, ap) => acc + parseFloat(ap.qtd), 0);
  document.getElementById("totalAplicado").textContent = total + "g";

  const listaAp = document.getElementById("listaAplicacoes");
  listaAp.innerHTML = "";
  talhao.aplicacoes.slice().reverse().forEach((ap, idx) => {
    const li = document.createElement("li");
    li.textContent = ap.desc + " – " + ap.qtd + "g";
    const btn = document.createElement("button");
    btn.textContent = "Excluir";
    btn.className = "delete-btn";
    btn.onclick = () => excluirAplicacao(idx);
    li.appendChild(btn);
    listaAp.appendChild(li);
  });

  document.getElementById("listaTalhoesSection").style.display = "none";
  document.getElementById("detalhesTalhao").style.display = "block";
  document.getElementById("relatorioGeral").style.display = "none";
}

// Excluir aplicação
function excluirAplicacao(idx) {
  let talhao = talhoes[talhaoAtual];
  talhao.aplicacoes.splice(talhao.aplicacoes.length - 1 - idx, 1);
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  abrirTalhao(talhaoAtual);
}

// Adicionar talhão
document.getElementById("formTalhao").addEventListener("submit", e => {
  e.preventDefault();
  const nome = document.getElementById("nomeTalhao").value.trim();
  if (!nome) return;
  talhoes.push({ nome, aplicacoes: [] });
  document.getElementById("formTalhao").reset();
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  renderizarTalhoes();
});

// Adicionar aplicação
document.getElementById("formAplicacao").addEventListener("submit", e => {
  e.preventDefault();
  const desc = document.getElementById("desc").value;
  const qtd = parseFloat(document.getElementById("qtd").value);
  talhoes[talhaoAtual].aplicacoes.push({ desc, qtd });
  document.getElementById("formAplicacao").reset();
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  abrirTalhao(talhaoAtual);
});

// Botão voltar
document.getElementById("voltar").addEventListener("click", () => {
  document.getElementById("listaTalhoesSection").style.display = "block";
  document.getElementById("detalhesTalhao").style.display = "none";
  document.getElementById("relatorioGeral").style.display = "none";
  renderizarTalhoes();
});

// Botão editar talhão
document.getElementById("editarTalhao").addEventListener("click", () => {
  const novoNome = prompt("Digite o novo nome do talhão:", talhoes[talhaoAtual].nome);
  if (novoNome) {
    talhoes[talhaoAtual].nome = novoNome;
    localStorage.setItem("talhoes", JSON.stringify(talhoes));
    abrirTalhao(talhaoAtual);
  }
});

// Botão excluir talhão
document.getElementById("excluirTalhao").addEventListener("click", () => {
  if (confirm("Tem certeza que deseja excluir este talhão e todas as suas aplicações?")) {
    talhoes.splice(talhaoAtual, 1);
    localStorage.setItem("talhoes", JSON.stringify(talhoes));
    document.getElementById("listaTalhoesSection").style.display = "block";
    document.getElementById("detalhesTalhao").style.display = "none";
    renderizarTalhoes();
  }
});

// Relatório Geral
document.getElementById("abrirRelatorio").addEventListener("click", () => {
  gerarRelatorio();
});

document.getElementById("toggleGrafico").addEventListener("click", () => {
  tipoGrafico = tipoGrafico === "bar" ? "pie" : "bar";
  gerarRelatorio();
});

function gerarRelatorio() {
  let totalTalhoes = talhoes.length;
  let totalAplicacoes = 0;
  let totalInsumos = 0;
  const resumo = document.getElementById("resumoTalhoes");
  resumo.innerHTML = "";

  let labels = [];
  let dados = [];

  talhoes.forEach(t => {
    totalAplicacoes += t.aplicacoes.length;
    const totalTalhao = t.aplicacoes.reduce((acc, ap) => acc + parseFloat(ap.qtd), 0);
    totalInsumos += totalTalhao;

    const li = document.createElement("li");
    li.textContent = `${t.nome}: ${t.aplicacoes.length} aplicações, ${totalTalhao}g aplicados`;
    resumo.appendChild(li);

    labels.push(t.nome);
    dados.push(totalTalhao);
  });

  document.getElementById("relTotalTalhoes").textContent = totalTalhoes;
  document.getElementById("relTotalAplicacoes").textContent = totalAplicacoes;
  document.getElementById("relTotalInsumos").textContent = totalInsumos + "g";

  const ctx = document.getElementById("graficoInsumos").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: tipoGrafico,
    data: {
      labels: labels,
      datasets: [{
        label: "Insumos aplicados (g)",
        data: dados,
        backgroundColor: [
          "rgba(78, 52, 46, 0.7)",
          "rgba(100, 181, 246, 0.7)",
          "rgba(129, 199, 132, 0.7)",
          "rgba(255, 241, 118, 0.7)",
          "rgba(244, 143, 177, 0.7)"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } }
    }
  });

  document.getElementById("listaTalhoesSection").style.display = "none";
  document.getElementById("detalhesTalhao").style.display = "none";
  document.getElementById("relatorioGeral").style.display = "block";
}

// Inicializar
renderizarTalhoes();

// Registrar service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registrado!"))
    .catch(err => console.error("Erro ao registrar Service Worker", err));
}
