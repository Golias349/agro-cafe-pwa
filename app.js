// Data no header
document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

// Estado
let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
let chartTalhoes = null;
let chartTipos = null;
let tipoGrafico = "bar";
let termoPesquisa = "";
let filtroTipo = "Todos";

// Abas
function mostrarAba(id){
  document.querySelectorAll(".aba").forEach(a=>a.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
  if(id==="abaRelatorios") gerarRelatorio();
  if(id==="abaRegistros") atualizarSelectTalhoes();
}

// Utils
function salvar(){ localStorage.setItem("talhoes", JSON.stringify(talhoes)); }
function render(){ renderizarTalhoes(); atualizarSelectTalhoes(); }

// Talhões
function renderizarTalhoes(){
  const lista = document.getElementById("listaTalhoes");
  lista.innerHTML = "";
  talhoes
    .filter(t => t.nome.toLowerCase().includes(termoPesquisa.toLowerCase()))
    .forEach((t, i)=>{
      const card = document.createElement("section");
      card.className = "card";
      const h = document.createElement("h3"); h.textContent = t.nome; card.appendChild(h);
      const total = somaPorTipo(t.aplicacoes, "Todos");
      const p = document.createElement("p");
      p.innerHTML = `<strong>Total de Aplicações:</strong> ${t.aplicacoes.length} <br><strong>Total Aplicado:</strong> ${total}g`;
      card.appendChild(p);
      const btnE = document.createElement("button"); btnE.textContent = "✏ Editar Talhão";
      btnE.onclick = ()=>{ const nn = prompt("Novo nome do talhão:", t.nome); if(nn){ t.nome = nn; salvar(); render(); } };
      const btnD = document.createElement("button"); btnD.textContent = "🗑 Excluir Talhão"; btnD.className="delete-btn";
      btnD.onclick = ()=>{ if(confirm("Excluir este talhão e suas aplicações?")){ talhoes.splice(i,1); salvar(); render(); } };
      card.appendChild(btnE); card.appendChild(btnD);
      lista.appendChild(card);
    });
}

// Select para registros
function atualizarSelectTalhoes(){
  const sel = document.getElementById("selectTalhao");
  if(!sel) return;
  sel.innerHTML = "";
  talhoes.forEach((t,i)=>{
    const op = document.createElement("option");
    op.value = i; op.textContent = t.nome; sel.appendChild(op);
  });
}

// Helpers de cálculo
function somaPorTipo(aplicacoes, tipo){
  return aplicacoes
    .filter(ap => tipo==="Todos" ? true : ap.tipo===tipo)
    .reduce((a,b)=> a + Number(b.qtd||0), 0);
}

function contagemPorTipo(aplicacoes, tipo){
  return aplicacoes
    .filter(ap => tipo==="Todos" ? true : ap.tipo===tipo).length;
}

// Relatório
function gerarRelatorio(){
  const tipo = filtroTipo;
  const ul = document.getElementById("resumoTalhoes");
  ul.innerHTML = "";

  let labelsTalhoes = [], dadosTalhoes = [];
  let mapaTipos = {}; // {tipo: soma}

  let totalAplic=0, totalInsumos=0;
  talhoes.forEach(t=>{
    const soma = somaPorTipo(t.aplicacoes, tipo);
    const cont = contagemPorTipo(t.aplicacoes, tipo);
    totalAplic += cont; totalInsumos += soma;
    labelsTalhoes.push(t.nome); dadosTalhoes.push(soma);
    const li = document.createElement("li");
    li.textContent = `${t.nome}: ${cont} aplicações${tipo!=="Todos"?" ("+tipo+")":""}, ${soma}g`;
    ul.appendChild(li);

    // agrega por tipo
    t.aplicacoes.forEach(ap=>{
      if(tipo!=="Todos" && ap.tipo!==tipo) return;
      mapaTipos[ap.tipo] = (mapaTipos[ap.tipo]||0) + Number(ap.qtd||0);
    });
  });

  document.getElementById("relTotalTalhoes").textContent = talhoes.length;
  document.getElementById("relTotalAplicacoes").textContent = totalAplic;
  document.getElementById("relTotalInsumos").textContent = totalInsumos + "g";

  // Gráfico por talhão
  const ctxT = document.getElementById("graficoInsumos").getContext("2d");
  if(chartTalhoes) chartTalhoes.destroy();
  chartTalhoes = new Chart(ctxT, {
    type: tipoGrafico,
    data: { labels: labelsTalhoes, datasets:[{ label:"Insumos aplicados (g)", data: dadosTalhoes }]},
    options: { responsive:true, plugins:{ legend:{ display:true } } }
  });

  // Gráfico por tipo
  const labelsTipos = Object.keys(mapaTipos);
  const dadosTipos = Object.values(mapaTipos);
  const ctxTipos = document.getElementById("graficoTipos").getContext("2d");
  if(chartTipos) chartTipos.destroy();
  chartTipos = new Chart(ctxTipos, {
    type: "bar",
    data: { labels: labelsTipos, datasets:[{ label:"Total por Tipo (g)", data: dadosTipos }]},
    options: { responsive:true, plugins:{ legend:{ display:true } } }
  });
}

// Eventos de UI
document.getElementById("formTalhao").addEventListener("submit", e=>{
  e.preventDefault();
  const nome = document.getElementById("nomeTalhao").value.trim();
  if(!nome) return;
  talhoes.push({nome, aplicacoes:[]});
  e.target.reset();
  salvar(); render();
});

document.getElementById("pesquisaTalhao").addEventListener("input", e=>{
  termoPesquisa = e.target.value;
  renderizarTalhoes();
});

document.getElementById("formAplicacao").addEventListener("submit", e=>{
  e.preventDefault();
  const idx = document.getElementById("selectTalhao").value;
  const tipo = document.getElementById("tipoInsumo").value;
  const desc = document.getElementById("descAplicacao").value.trim();
  const qtd = parseFloat(document.getElementById("qtdAplicacao").value);
  if(idx==="" || isNaN(qtd)) return;
  talhoes[idx].aplicacoes.push({desc, qtd, tipo, data: new Date().toISOString()});
  e.target.reset();
  salvar();
});

document.getElementById("toggleGrafico").addEventListener("click", ()=>{
  tipoGrafico = (tipoGrafico==="bar") ? "pie" : "bar";
  gerarRelatorio();
});

document.getElementById("filtroTipo").addEventListener("change", (e)=>{
  filtroTipo = e.target.value;
  gerarRelatorio();
});

// PDF
document.getElementById("exportarPDF").addEventListener("click", ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p","mm","a4");
  doc.setFontSize(18); doc.text("Relatório Geral - Grão Digital",14,20);
  doc.setFontSize(12); doc.text("Data: "+new Date().toLocaleDateString("pt-BR"),14,30);
  doc.text("Filtro de Tipo: "+document.getElementById("filtroTipo").value,14,37);
  doc.text("Total de Talhões: "+document.getElementById("relTotalTalhoes").textContent,14,47);
  doc.text("Total de Aplicações: "+document.getElementById("relTotalAplicacoes").textContent,14,54);
  doc.text("Total de Insumos Aplicados: "+document.getElementById("relTotalInsumos").textContent,14,61);
  doc.text("Resumo por Talhão:", 14, 72);
  let y=79; document.querySelectorAll("#resumoTalhoes li").forEach(li=>{ if(y>270){ doc.addPage(); y=20;} doc.text("- "+li.textContent,14,y); y+=7; });
  const canvas = document.getElementById("graficoInsumos"); const img = canvas.toDataURL("image/png");
  if(y>150){ doc.addPage(); y=20;}
  doc.addImage(img,"PNG",14,y,180,100);
  doc.save("relatorio-grao-digital.pdf");
});

// Excel
document.getElementById("exportarXLSX").addEventListener("click", ()=>{
  const tipoSel = document.getElementById("filtroTipo").value;

  // Sheet 1: Resumo (respeita filtro de tipo)
  const resumo = talhoes.map(t=>{
    const total = somaPorTipo(t.aplicacoes, tipoSel);
    const apps = contagemPorTipo(t.aplicacoes, tipoSel);
    return { Talhao: t.nome, Aplicacoes: apps, Total_g: total, TipoFiltro: tipoSel };
  });

  // Sheet 2: Aplicações (respeita filtro de tipo)
  const detalhado = [];
  talhoes.forEach(t=>{
    t.aplicacoes.forEach(ap=>{
      if(tipoSel!=="Todos" && ap.tipo!==tipoSel) return;
      detalhado.push({
        Talhao: t.nome, Tipo: ap.tipo, Descricao: ap.desc,
        Quantidade_g: ap.qtd, Data: new Date(ap.data).toLocaleString("pt-BR")
      });
    });
  });

  // Sheet 3: Totais por Tipo
  const mapa = {};
  talhoes.forEach(t=> t.aplicacoes.forEach(ap=> { mapa[ap.tipo]=(mapa[ap.tipo]||0)+Number(ap.qtd||0); }));
  const porTipo = Object.keys(mapa).map(k=>({ Tipo:k, Total_g: mapa[k] }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumo), "Resumo");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalhado), "Aplicacoes");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(porTipo), "Totais_por_Tipo");
  XLSX.writeFile(wb, "grao-digital-dados.xlsx");
});

// Backup JSON
document.getElementById("exportarJSON").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify({talhoes}, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "grao-digital-backup.json"; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importarJSON").addEventListener("change", (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(!data.talhoes) throw new Error("JSON inválido");
      talhoes = data.talhoes;
      salvar(); render();
      alert("Importação concluída!");
    }catch(err){
      alert("Falha ao importar: " + err.message);
    }
  };
  reader.readAsText(file);
});

// Render inicial
render();

// SW
if("serviceWorker" in navigator){ navigator.serviceWorker.register("service-worker.js"); }
