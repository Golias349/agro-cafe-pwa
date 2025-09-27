// -------- Funções de Data --------
document.getElementById("data-atual").innerText = new Date().toLocaleDateString("pt-BR",{weekday:'long', day:'numeric', month:'long', year:'numeric'});

// -------- Estoque --------
let estoque = [];
function adicionarEstoque(){
  const nome = document.getElementById("insumo").value;
  const qtd = parseFloat(document.getElementById("quantidade").value);
  const preco = parseFloat(document.getElementById("preco").value);
  if(!nome || !qtd || !preco) return alert("Preencha todos os campos!");
  estoque.push({nome,qtd,preco,mes:new Date().getMonth()+1});
  atualizarResumo();
}
function atualizarResumo(){
  const tabela = document.getElementById("resumoMensal");
  tabela.innerHTML = "<tr><th>Mês</th><th>Kg aplicados</th><th>Gasto (R$)</th></tr>";
  let resumo = {};
  estoque.forEach(e=>{
    if(!resumo[e.mes]) resumo[e.mes]={kg:0,gasto:0};
    resumo[e.mes].kg+=e.qtd;
    resumo[e.mes].gasto+=(e.qtd/50)*e.preco;
  });
  for(let mes in resumo){
    let linha = `<tr><td>${mes}</td><td>${resumo[mes].kg}</td><td>${resumo[mes].gasto.toFixed(2)}</td></tr>`;
    tabela.innerHTML+=linha;
  }
}

// -------- Talhões --------
let talhoes=[];
function adicionarTalhao(){
  const nome=document.getElementById("novoTalhao").value;
  if(!nome) return;
  talhoes.push(nome);
  renderTalhoes();
}
function renderTalhoes(){
  const lista=document.getElementById("listaTalhoes");
  lista.innerHTML="";
  talhoes.forEach(t=>{
    lista.innerHTML+=`<li>${t}</li>`;
  });
}

// -------- Google Drive --------
const CLIENT_ID = "149167584419-39h4d0qhjfqjs096870ih6p1fkpqds0k.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
let authn=null;
function initGoogle(){
  const s=document.createElement("script");
  s.src="https://accounts.google.com/gsi/client";
  s.onload=()=>{
    google.accounts.oauth2.initTokenClient({
      client_id:CLIENT_ID, scope:SCOPES,
      callback:(token)=>{authn=token;alert("Conectado!");}
    }).requestAccessToken();
  };
  document.body.appendChild(s);
}
function saveToDrive(){
  if(!authn) return alert("Conecte ao Google antes!");
  alert("Aqui salvaríamos no Google Drive (demo).");
}
function loadFromDrive(){
  if(!authn) return alert("Conecte ao Google antes!");
  alert("Aqui carregaríamos do Google Drive (demo).");
}

// -------- Navegação --------
function mostrar(id){
  document.querySelectorAll("main section").forEach(s=>s.style.display="none");
  document.getElementById(id).style.display="block";
}
mostrar("estoque");