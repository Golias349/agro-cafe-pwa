
document.addEventListener("DOMContentLoaded", () => {
  const abas = document.querySelectorAll(".aba");
  window.mostrarAba = (id) => {
    abas.forEach(a => a.classList.remove("ativa"));
    document.getElementById(id).classList.add("ativa");
  };

  document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR",{weekday:'long', day:'numeric', month:'long', year:'numeric'});

  let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
  let aplicacoes = JSON.parse(localStorage.getItem("aplicacoes")) || [];

  const listaTalhoes = document.getElementById("listaTalhoes");
  const selectTalhao = document.getElementById("selectTalhao");

  function atualizarTalhoes(){
    listaTalhoes.innerHTML = "";
    selectTalhao.innerHTML = "";
    talhoes.forEach(t => {
      // Criar card
      const div = document.createElement("div");
      div.className = "talhao-card";
      div.innerHTML = `
        <h3>${t}</h3>
        <p><strong>Total de Aplicações:</strong> ${aplicacoes.filter(a=>a.talhao===t).length}</p>
        <p><strong>Total Aplicado:</strong> ${aplicacoes.filter(a=>a.talhao===t).reduce((acc,a)=>acc+a.qtd,0)}g</p>
        <button onclick="editarTalhao('${t}')">✏️ Editar</button>
        <button onclick="excluirTalhao('${t}')">🗑️ Excluir</button>
      `;
      listaTalhoes.appendChild(div);
      const opt = document.createElement("option");
      opt.value = t; opt.textContent = t;
      selectTalhao.appendChild(opt);
    });
    localStorage.setItem("talhoes", JSON.stringify(talhoes));
  }

  window.excluirTalhao = (nome) => {
    if(confirm("Excluir talhão " + nome + "?")){
      talhoes = talhoes.filter(t=>t!==nome);
      aplicacoes = aplicacoes.filter(a=>a.talhao!==nome);
      localStorage.setItem("talhoes", JSON.stringify(talhoes));
      localStorage.setItem("aplicacoes", JSON.stringify(aplicacoes));
      atualizarTalhoes();
      atualizarRelatorios();
    }
  };

  window.editarTalhao = (nome) => {
    const novoNome = prompt("Novo nome para o talhão:", nome);
    if(novoNome && novoNome!==nome){
      talhoes = talhoes.map(t=>t===nome?novoNome:t);
      aplicacoes = aplicacoes.map(a=>a.talhao===nome?{...a,talhao:novoNome}:a);
      localStorage.setItem("talhoes", JSON.stringify(talhoes));
      localStorage.setItem("aplicacoes", JSON.stringify(aplicacoes));
      atualizarTalhoes();
      atualizarRelatorios();
    }
  };

  document.getElementById("formTalhao").addEventListener("submit", e => {
    e.preventDefault();
    const nome = document.getElementById("nomeTalhao").value.trim();
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
    atualizarTalhoes();
    alert("Aplicação salva!");
  });

  function atualizarRelatorios(){
    document.getElementById("relTotalTalhoes").textContent = talhoes.length;
    document.getElementById("relTotalAplicacoes").textContent = aplicacoes.length;
    let total = aplicacoes.reduce((acc,a)=>acc+a.qtd,0);
    document.getElementById("relTotalInsumos").textContent = total+"g";
    const resumo = document.getElementById("resumoTalhoes");
    resumo.innerHTML = "";
    talhoes.forEach(t=>{
      const li = document.createElement("li");
      li.textContent = `${t}: ${aplicacoes.filter(a=>a.talhao===t).reduce((acc,a)=>acc+a.qtd,0)}g`;
      resumo.appendChild(li);
    });
  }

  atualizarTalhoes();
  atualizarRelatorios();
});
