document.getElementById("dataTopo").textContent =
  new Date().toLocaleDateString("pt-BR",{weekday:"long", day:"numeric", month:"long", year:"numeric"});

let talhoes = JSON.parse(localStorage.getItem("talhoes")||"[]");
let estoque = JSON.parse(localStorage.getItem("estoque")||"[]");
let aplicacoes = JSON.parse(localStorage.getItem("aplicacoes")||"[]");

function salvarTudo(){
  localStorage.setItem("talhoes",JSON.stringify(talhoes));
  localStorage.setItem("estoque",JSON.stringify(estoque));
  localStorage.setItem("aplicacoes",JSON.stringify(aplicacoes));
  atualizarCustos();
}

function mostrarAba(id){
  document.querySelectorAll('.aba').forEach(a=>a.classList.remove('ativa'));
  document.getElementById(id).classList.add('ativa');
}

function adicionarTalhao(){
  const nome=document.getElementById("novoTalhao").value;
  if(nome){ talhoes.push(nome); salvarTudo(); renderTalhoes(); atualizarSelects(); document.getElementById("novoTalhao").value=""; }
}
function renderTalhoes(){
  document.getElementById("listaTalhoes").innerHTML = talhoes.map(t=>`<li>${t}</li>`).join("");
}
function atualizarSelects(){
  document.getElementById("selectTalhao").innerHTML = talhoes.map(t=>`<option>${t}</option>`).join("");
  document.getElementById("tipoInsumo").innerHTML = estoque.map(e=>`<option>${e.nome}</option>`).join("");
}
renderTalhoes(); atualizarSelects();

function adicionarEstoque(){
  const nome=document.getElementById("nomeInsumo").value;
  const qtd=parseFloat(document.getElementById("quantidadeEstoque").value);
  const preco=parseFloat(document.getElementById("precoSaco").value);
  if(nome&&qtd&&preco){ estoque.push({nome,qtd,preco}); salvarTudo(); renderEstoque(); atualizarSelects(); }
}
function renderEstoque(){
  document.getElementById("listaEstoque").innerHTML = estoque.map(e=>`<li>${e.nome} - ${e.qtd}kg - R$${e.preco}/saco</li>`).join("");
}
renderEstoque();

function salvarAplicacao(){
  const talhao=document.getElementById("selectTalhao").value;
  const tipo=document.getElementById("tipoInsumo").value;
  const desc=document.getElementById("descricao").value;
  const qtd=parseFloat(document.getElementById("quantidade").value);
  if(talhao&&tipo&&qtd){ aplicacoes.push({talhao,tipo,desc,qtd,data:new Date().toISOString()}); salvarTudo(); renderAplicacoes(); document.getElementById("descricao").value=""; document.getElementById("quantidade").value=""; }
}
function renderAplicacoes(){
  document.getElementById("listaAplicacoes").innerHTML = aplicacoes.map(a=>`<li>${a.data.substring(0,10)} - ${a.talhao} - ${a.tipo} - ${a.qtd}kg</li>`).join("");
}
renderAplicacoes();

function atualizarCustos(){
  let resumo={};
  aplicacoes.forEach(a=>{
    const d=new Date(a.data);
    const mes=`${d.getMonth()+1}/${d.getFullYear()}`;
    const insumo=estoque.find(e=>e.nome===a.tipo);
    const precoKg=insumo?(insumo.preco/50):0;
    const custo=precoKg*a.qtd;
    if(!resumo[mes]) resumo[mes]={kg:0,custo:0};
    resumo[mes].kg+=a.qtd;
    resumo[mes].custo+=custo;
  });
  const tabela=document.getElementById("tabelaCustos");
  if(tabela){ tabela.innerHTML="<table><tr><th>Mês</th><th>Kg aplicados</th><th>Gasto (R$)</th></tr>"+
    Object.keys(resumo).map(m=>`<tr><td>${m}</td><td>${resumo[m].kg.toFixed(1)}</td><td>R$ ${resumo[m].custo.toFixed(2)}</td></tr>`).join("")+"</table>"; }
  const ctx=document.getElementById("grafCustos").getContext("2d");
  if(window.grafCustos) window.grafCustos.destroy();
  window.grafCustos=new Chart(ctx,{type:'bar',data:{labels:Object.keys(resumo),
    datasets:[{label:'Kg aplicados',data:Object.values(resumo).map(r=>r.kg),backgroundColor:'#36c'},
              {label:'Gasto (R$)',data:Object.values(resumo).map(r=>r.custo),backgroundColor:'#4CAF50'}]},
    options:{responsive:true,scales:{y:{beginAtZero:true}}}});
}
atualizarCustos();

// Google Drive
const CLIENT_ID="149167584419-39h4d0qhjfqjs096870ih6p1fkpqds0k.apps.googleusercontent.com";
const SCOPES="https://www.googleapis.com/auth/drive.file";
let authIn=null;
function initGoogle(){
  const s=document.createElement("script"); s.src="https://accounts.google.com/gsi/client";
  s.onload=()=>{ google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:SCOPES,
    callback:(token)=>{authIn=token;alert("Conectado com sucesso!");}
  }).requestAccessToken(); };
  document.body.appendChild(s);
}
function saveToDrive(){ if(!authIn) return alert("Conecte ao Google primeiro"); alert("Backup no Google Drive pronto (demo)."); }
function loadFromDrive(){ if(!authIn) return alert("Conecte ao Google primeiro"); alert("Carregar do Google Drive (demo)."); }
