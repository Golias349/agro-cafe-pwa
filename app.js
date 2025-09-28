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

function limparEstoque(){
  if(confirm("Tem certeza que deseja limpar todo o estoque?")){
    estoque=[]; salvarTudo(); renderEstoque();
  }
}

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

// -------- Google Drive --------
const CLIENT_ID="COLE_SEU_CLIENT_ID_AQUI"; // <-- Cole aqui seu CLIENT_ID do Google
const SCOPES="https://www.googleapis.com/auth/drive.file";
let authInstance;

function initGoogle(){
  gapi.load("client:auth2", () => {
    gapi.client.init({clientId: CLIENT_ID, scope: SCOPES}).then(() => {
      authInstance = gapi.auth2.getAuthInstance();
    });
  });
}

function handleAuthClick(){
  if(!authInstance){alert("Google API não inicializada.");return;}
  authInstance.signIn().then(()=>{alert("✅ Conectado ao Google Drive!");});
}

async function saveDataToDrive(){
  if(!authInstance || !authInstance.isSignedIn.get()){alert("Conecte ao Google primeiro.");return;}
  let dados={talhoes,estoque,aplicacoes};
  let fileContent=JSON.stringify(dados,null,2);
  let file=new Blob([fileContent],{type:"application/json"});
  const metadata={name:"grao_digital_backup.json",mimeType:"application/json"};
  const accessToken=gapi.auth.getToken().access_token;
  let form=new FormData();
  form.append("metadata",new Blob([JSON.stringify(metadata)],{type:"application/json"}));
  form.append("file",file);
  fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",{
    method:"POST",headers:new Headers({"Authorization":"Bearer "+accessToken}),body:form
  }).then(r=>r.json()).then(data=>{alert("✅ Backup salvo no Drive!");console.log(data);});
}

async function loadDataFromDrive(){
  if(!authInstance || !authInstance.isSignedIn.get()){alert("Conecte ao Google primeiro.");return;}
  const accessToken=gapi.auth.getToken().access_token;
  fetch("https://www.googleapis.com/drive/v3/files?q=name='grao_digital_backup.json'&spaces=drive",{
    headers:new Headers({"Authorization":"Bearer "+accessToken})
  }).then(r=>r.json()).then(data=>{
    if(data.files.length===0){alert("Nenhum backup encontrado.");return;}
    let fileId=data.files[0].id;
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,{
      headers:new Headers({"Authorization":"Bearer "+accessToken})
    }).then(r=>r.json()).then(backup=>{
      talhoes=backup.talhoes||[];
      estoque=backup.estoque||[];
      aplicacoes=backup.aplicacoes||[];
      salvarTudo();
      renderTalhoes();renderEstoque();renderAplicacoes();
      alert("✅ Backup restaurado!");
    });
  });
}