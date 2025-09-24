
document.addEventListener("DOMContentLoaded", () => {
  const abas = document.querySelectorAll(".aba");
  window.mostrarAba = (id) => {
    abas.forEach(a => a.classList.remove("ativa"));
    document.getElementById(id).classList.add("ativa");
  };

  // Exibir data
  document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR",{weekday:'long', day:'numeric', month:'long', year:'numeric'});

  let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
  let aplicacoes = JSON.parse(localStorage.getItem("aplicacoes")) || [];

  const listaTalhoes = document.getElementById("listaTalhoes");
  const selectTalhao = document.getElementById("selectTalhao");

  function atualizarTalhoes(){
    listaTalhoes.innerHTML = "";
    selectTalhao.innerHTML = "";
    talhoes.forEach(t => {
      const div = document.createElement("div");
      div.textContent = t;
      listaTalhoes.appendChild(div);
      const opt = document.createElement("option");
      opt.value = t; opt.textContent = t;
      selectTalhao.appendChild(opt);
    });
    localStorage.setItem("talhoes", JSON.stringify(talhoes));
  }

  document.getElementById("formTalhao").addEventListener("submit", e => {
    e.preventDefault();
    const nome = document.getElementById("nomeTalhao").value;
    if(nome && !talhoes.includes(nome)){
      talhoes.push(nome);
      atualizarTalhoes();
    }
    e.target.reset();
  });

  document.getElementById("formAplicacao").addEventListener("submit", e => {
    e.preventDefault();
    const talhao = selectTalhao.value;
    const tipo = document.getElementById("tipoInsumo").value;
    const desc = document.getElementById("descAplicacao").value;
    const qtd = parseFloat(document.getElementById("qtdAplicacao").value)||0;
    aplicacoes.push({talhao, tipo, desc, qtd});
    localStorage.setItem("aplicacoes", JSON.stringify(aplicacoes));
    e.target.reset();
    atualizarRelatorios();
    alert("Aplicação salva!");
  });

  function atualizarRelatorios(){
    document.getElementById("relTotalTalhoes").textContent = talhoes.length;
    document.getElementById("relTotalAplicacoes").textContent = aplicacoes.length;
    let total = aplicacoes.reduce((acc,a)=>acc+a.qtd,0);
    document.getElementById("relTotalInsumos").textContent = total+"g";
  }

  atualizarTalhoes();
  atualizarRelatorios();
});
