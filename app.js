// Atualiza a data automaticamente
document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
let chart = null;
let tipoGrafico = "bar";
let termoPesquisa = "";
let filtroPeriodo = "all";

function filtrarPorData(aplicacoes) {
  if (filtroPeriodo === "all") return aplicacoes;
  const agora = Date.now();
  let limite = 0;
  if (filtroPeriodo === "24h") limite = 24*60*60*1000;
  if (filtroPeriodo === "7d") limite = 7*24*60*60*1000;
  if (filtroPeriodo === "30d") limite = 30*24*60*60*1000;
  return aplicacoes.filter(ap => agora - new Date(ap.data).getTime() <= limite);
}

// Renderizar lista de talhões com formulário de adubação
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
      aplicacoesFiltradas.slice().reverse().forEach((ap, idx) => {
        const li = document.createElement("li");
        li.textContent = ap.desc + " – " + ap.qtd + "g (" + new Date(ap.data).toLocaleDateString("pt-BR") + ")";
        const btn = document.createElement("button");
        btn.textContent = "Excluir";
        btn.className = "delete-btn";
        btn.onclick = () => {
          t.aplicacoes.splice(t.aplicacoes.indexOf(ap), 1);
          salvar();
        };
        li.appendChild(btn);
        listaAp.appendChild(li);
      });
      card.appendChild(listaAp);

      // Formulário de adubação dentro do card
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

      // Botões editar e excluir talhão
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

// Salvar alterações e re-renderizar
function salvar() {
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  renderizarTalhoes();
}

// Adicionar talhão
document.getElementById("formTalhao").addEventListener("submit", e => {
  e.preventDefault();
  const nome = document.getElementById("nomeTalhao").value.trim();
  if (!nome) return;
  talhoes.push({ nome, aplicacoes: [] });
  document.getElementById("formTalhao").reset();
  salvar();
});

// Pesquisar talhões
document.getElementById("pesquisaTalhao").addEventListener("input", e => {
  termoPesquisa = e.target.value;
  renderizarTalhoes();
});

// Filtro por período
document.getElementById("filtroData").addEventListener("change", e => {
  filtroPeriodo = e.target.value;
  renderizarTalhoes();
});

// Relatório Geral
document.getElementById("abrirRelatorio").addEventListener("click", () => {
  gerarRelatorio();
});

document.getElementById("toggleGrafico").addEventListener("click", () => {
  tipoGrafico = tipoGrafico === "bar" ? "pie" : "bar";
  gerarRelatorio();
});

document.getElementById("voltarRelatorio").addEventListener("click", () => {
  document.getElementById("relatorioGeral").style.display = "none";
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
