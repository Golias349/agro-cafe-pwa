
// Data topo
document.getElementById("dataTopo").textContent =
  new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

// Estado
let talhoes = JSON.parse(localStorage.getItem("talhoes")||"[]");
let estoque = JSON.parse(localStorage.getItem("estoque")||"[]");
let aplicacoes = JSON.parse(localStorage.getItem("aplicacoes")||"[]");

function salvarTudo(){
  localStorage.setItem("talhoes",JSON.stringify(talhoes));
  localStorage.setItem("estoque",JSON.stringify(estoque));
  localStorage.setItem("aplicacoes",JSON.stringify(aplicacoes));
  atualizarCustos();
}

// Navegação
function mostrarAba(id){
  document.querySelectorAll(".aba").forEach(a=>a.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
  document.querySelectorAll(".tabbar .tab").forEach(b=>b.classList.remove("ativa"));
  const idx = ["abaTalhoes","abaRegistros","abaEstoque","abaConfig"].indexOf(id);
  document.querySelectorAll(".tabbar .tab")[idx].classList.add("ativa");
}

// Talhões
function adicionarTalhao(){
  const nome = document.getElementById("novoTalhao").value.trim();
  if(!nome) return;
  talhoes.push(nome);
  document.getElementById("novoTalhao").value="";
  salvarTudo();
  renderTalhoes();
  atualizarSelects();
}
function excluirTalhao(i){
  const nome = talhoes[i];
  talhoes.splice(i,1);
  aplicacoes = aplicacoes.filter(a=>a.talhao!==nome);
  salvarTudo(); renderTalhoes(); atualizarSelects(); renderAplicacoes();
}
function renderTalhoes(filtro=""){
  const ul = document.getElementById("listaTalhoes");
  const data = talhoes.filter(t=>t.toLowerCase().includes((filtro||"").toLowerCase()));
  ul.innerHTML = data.map((t,i)=>`<li><span>${t}</span><button class="btn ghost" onclick="excluirTalhao(${i})">Excluir</button></li>`).join("")||"<li>Nenhum talhão</li>";
}
function atualizarSelects(){
  const sel = document.getElementById("selectTalhao");
  sel.innerHTML = talhoes.map(t=>`<option>${t}</option>`).join("");
  const tipos = [...new Set(estoque.map(e=>e.nome))];
  document.getElementById("tipoInsumo").innerHTML = tipos.map(n=>`<option>${n}</option>`).join("");
}
renderTalhoes(); atualizarSelects();

// Estoque
function adicionarEstoque(){
  const nome = document.getElementById("nomeInsumo").value.trim();
  const qtd = parseFloat(document.getElementById("quantidadeEstoque").value);
  const preco = parseFloat(document.getElementById("precoSaco").value);
  if(!nome || !qtd || !preco) return;
  estoque.push({nome, qtd, preco}); // preco por 50kg
  document.getElementById("nomeInsumo").value="";
  document.getElementById("quantidadeEstoque").value="";
  document.getElementById("precoSaco").value="";
  salvarTudo(); renderEstoque(); atualizarSelects();
}
function excluirEstoque(i){
  estoque.splice(i,1); salvarTudo(); renderEstoque(); atualizarSelects();
}
function renderEstoque(){
  const ul = document.getElementById("listaEstoque");
  ul.innerHTML = estoque.map((e,i)=>`<li><span>${e.nome} — ${e.qtd} kg — R$ ${e.preco} /saco</span><button class="btn ghost" onclick="excluirEstoque(${i})">Excluir</button></li>`).join("") || "<li>Sem insumos</li>";
}
renderEstoque();

// Registros
function salvarAplicacao(){
  const talhao = document.getElementById("selectTalhao").value;
  const tipo = document.getElementById("tipoInsumo").value;
  const desc = document.getElementById("descricao").value.trim();
  const qtd = parseFloat(document.getElementById("quantidade").value);
  if(!talhao || !tipo || !qtd) return;
  aplicacoes.push({talhao,tipo,desc,qtd,data:new Date().toISOString()});
  document.getElementById("descricao").value="";
  document.getElementById("quantidade").value="";
  salvarTudo(); renderAplicacoes();
}
function excluirAplicacao(i){
  aplicacoes.splice(i,1); salvarTudo(); renderAplicacoes();
}
function renderAplicacoes(){
  const ul = document.getElementById("listaAplicacoes");
  ul.innerHTML = aplicacoes.slice().reverse().map((a,idx)=>{
    const i = aplicacoes.length-1-idx;
    return `<li><span>${a.data.substring(0,10)} — ${a.talhao} — ${a.tipo} — ${a.qtd} kg</span><button class="btn ghost" onclick="excluirAplicacao(${i})">Excluir</button></li>`
  }).join("") || "<li>Sem aplicações</li>";
}
renderAplicacoes();

// Custos Mensais (kg + R$)
let grafCustos;
function atualizarCustos(){
  let resumo = {}; // mes: {kg, custo}
  aplicacoes.forEach(a=>{
    const d = new Date(a.data);
    const mes = String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();
    const insumo = estoque.find(e=>e.nome===a.tipo);
    const precoKg = insumo ? (insumo.preco/50) : 0;
    const custo = precoKg * a.qtd;
    if(!resumo[mes]) resumo[mes] = {kg:0,custo:0};
    resumo[mes].kg += a.qtd;
    resumo[mes].custo += custo;
  });
  const meses = Object.keys(resumo).sort((a,b)=>{
    const [ma,ya]=a.split("/").map(Number); const [mb,yb]=b.split("/").map(Number);
    return ya!==yb ? ya-yb : ma-mb;
  });
  const tabela = document.getElementById("tabelaCustos");
  if(tabela){
    tabela.innerHTML = `<table>
      <thead><tr><th>Mês</th><th>Kg aplicados</th><th>Gasto (R$)</th></tr></thead>
      <tbody>${
        meses.map(m=>`<tr><td>${m}</td><td>${resumo[m].kg.toFixed(1)}</td><td>R$ ${resumo[m].custo.toFixed(2)}</td></tr>`).join("")
      }</tbody></table>`;
  }
  const ctx = document.getElementById("grafCustos")?.getContext("2d");
  if(ctx){
    if(grafCustos) grafCustos.destroy();
    grafCustos = new Chart(ctx,{
      type:'bar',
      data:{
        labels: meses,
        datasets:[
          {label:'Kg aplicados', data:meses.map(m=>resumo[m].kg), backgroundColor:'#36c'},
          {label:'Gasto (R$)', data:meses.map(m=>resumo[m].custo), backgroundColor:'#4CAF50'}
        ]
      },
      options:{responsive:true, scales:{y:{beginAtZero:true}}}
    });
  }
}
atualizarCustos();

// -------- Google Drive (opcional) --------
const CLIENT_ID = "149167584419-39h4d0qhjfjqs09687oih6p1fkpqds0k.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
let authIn = null;
function initGoogle(){
  if(!CLIENT_ID.includes(".apps.googleusercontent.com")){
    alert("Edite CLIENT_ID em app.js antes de conectar ao Google.");
    return;
  }
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.onload = () => {
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: SCOPES,
      callback: (token)=>{ authIn = token; alert("Conectado!"); }
    }).requestAccessToken();
  };
  document.body.appendChild(s);
}
function saveDataToDrive(){
  if(!authIn){ alert("Conecte ao Google primeiro."); return; }
  const blob = new Blob([JSON.stringify({talhoes,estoque,aplicacoes},null,2)],{type:"application/json"});
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({name:"grao-digital-backup.json"})],{type:"application/json"}));
  form.append("file", blob);
  fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",{
    method:"POST",
    headers:{Authorization:"Bearer "+authIn.access_token},
    body: form
  }).then(r=>r.json()).then(()=>alert("Backup enviado!")).catch(e=>alert("Falhou: "+e));
}
function loadDataFromDrive(){
  alert("Carregamento do Drive: implemente selecionando o arquivo desejado (opcional).");
}
