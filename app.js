document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
let chart = null;
let tipoGrafico = "bar";
let termoPesquisa = "";
let filtroPeriodo = "all";

function mostrarAba(id) {
  document.querySelectorAll(".aba").forEach(aba => aba.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");

  if (id === "abaRelatorios") {
    gerarRelatorio();
  }
}

function filtrarPorData(aplicacoes) {
  if (filtroPeriodo === "all") return aplicacoes;
  const agora = Date.now();
  let limite = 0;
  if (filtroPeriodo === "24h") limite = 24*60*60*1000;
  if (filtroPeriodo === "7d") limite = 7*24*60*60*1000;
  if (filtroPeriodo === "30d") limite = 30*24*60*60*1000;
  return aplicacoes.filter(ap => agora - new Date(ap.data).getTime() <= limite);
}

function renderizarTalhoes() {
  const lista = document.getElementById("listaTalhoes");
  lista.innerHTML = "";

  talhoes
    .filter(t => t.nome.toLowerCase().includes(termoPesquisa.toLowerCase()))
    .forEach((t, i) => {
      const card = document.createElement("section");
      card.className = "card";

      const titulo = document.createElement("h3");
      titulo.textContent = t.nome;
      card.appendChild(titulo);

      const aplicacoesFiltradas = filtrarPorData(t.aplicacoes);
      const resumo = document.createElement("p");
      resumo.innerHTML = `<strong>Total de Aplicações:</strong> ${aplicacoesFiltradas.length} <br> 
                          <strong>Total Aplicado:</strong> ${aplicacoesFiltradas.reduce((acc, ap) => acc + ap.qtd, 0)}g`;
      card.appendChild(resumo);

      const listaAp = document.createElement("ul");
      aplicacoesFiltradas.slice().reverse().forEach(ap => {
        const li = document.createElement("li");
        li.textContent = ap.desc + " – " + ap.qtd + "g (" + new Date(ap.data).toLocaleDateString("pt-BR") + ")";
        listaAp.appendChild(li);
      });
      card.appendChild(listaAp);

      const formAp = document.createElement("form");
      formAp.innerHTML = `
        <label>Descrição:<br><input type="text" required></label><br>
        <label>Quantidade (g):<br><input type="number" required></label><br>
        <button type="submit">Salvar Aplicação</button>
      `;
      formAp.onsubmit = e => {
        e.preventDefault();
        const desc = formAp.querySelector("input[type=text]").value;
        const qtd = parseFloat(formAp.querySelector("input[type=number]").value);
        t.aplicacoes.push({ desc, qtd, data: new Date().toISOString() });
        salvar();
      };
      card.appendChild(formAp);

      const btnEditar = document.createElement("button");
      btnEditar.textContent = "✏ Editar Talhão";
      btnEditar.onclick = () => {
        const novoNome = prompt("Digite o novo nome do talhão:", t.nome);
        if (novoNome) {
          t.nome = novoNome;
          salvar();
        }
      };

      const btnExcluir = document.createElement("button");
      btnExcluir.textContent = "🗑 Excluir Talhão";
      btnExcluir.className = "delete-btn";
      btnExcluir.onclick = () => {
        if (confirm("Excluir este talhão e todas as aplicações?")) {
          talhoes.splice(i, 1);
          salvar();
        }
      };

      card.appendChild(btnEditar);
      card.appendChild(btnExcluir);
      lista.appendChild(card);
    });

  localStorage.setItem("talhoes", JSON.stringify(talhoes));
}

function salvar() {
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  renderizarTalhoes();
}

document.getElementById("formTalhao").addEventListener("submit", e => {
  e.preventDefault();
  const nome = document.getElementById("nomeTalhao").value.trim();
  if (!nome) return;
  talhoes.push({ nome, aplicacoes: [] });
  document.getElementById("formTalhao").reset();
  salvar();
});

document.getElementById("pesquisaTalhao").addEventListener("input", e => {
  termoPesquisa = e.target.value;
  renderizarTalhoes();
});

document.getElementById("filtroData").addEventListener("change", e => {
  filtroPeriodo = e.target.value;
  renderizarTalhoes();
});

document.getElementById("toggleGrafico").addEventListener("click", () => {
  tipoGrafico = tipoGrafico === "bar" ? "pie" : "bar";
  gerarRelatorio();
});

document.getElementById("exportarPDF").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFontSize(18);
  doc.text("Relatório Geral - AGRO Café", 14, 20);
  doc.setFontSize(12);
  doc.text("Data: " + new Date().toLocaleDateString("pt-BR"), 14, 30);

  doc.text("Total de Talhões: " + document.getElementById("relTotalTalhoes").textContent, 14, 40);
  doc.text("Total de Aplicações: " + document.getElementById("relTotalAplicacoes").textContent, 14, 47);
  doc.text("Total de Insumos Aplicados: " + document.getElementById("relTotalInsumos").textContent, 14, 54);

  doc.text("Resumo por Talhão:", 14, 65);
  let y = 72;
  document.querySelectorAll("#resumoTalhoes li").forEach(li => {
    doc.text("- " + li.textContent, 14, y);
    y += 7;
  });

  const canvas = document.getElementById("graficoInsumos");
  const imgData = canvas.toDataURL("image/png");
  doc.addImage(imgData, "PNG", 14, y, 180, 100);

  doc.save("relatorio-agro-cafe.pdf");
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
    const aplicacoesFiltradas = filtrarPorData(t.aplicacoes);
    totalAplicacoes += aplicacoesFiltradas.length;
    const totalTalhao = aplicacoesFiltradas.reduce((acc, ap) => acc + parseFloat(ap.qtd), 0);
    totalInsumos += totalTalhao;

    const li = document.createElement("li");
    li.textContent = `${t.nome}: ${aplicacoesFiltradas.length} aplicações, ${totalTalhao}g aplicados`;
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
}

renderizarTalhoes();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
