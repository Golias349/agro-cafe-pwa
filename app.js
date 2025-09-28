let CLIENT_ID = "149167584419-39h4d0qhjfjqs09687oih6p1fkpqds0k.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file openid email profile";
let accessToken = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  render();
});

function mostrar(secao) {
  document.querySelectorAll("main section").forEach(s => s.style.display = "none");
  document.getElementById(secao).style.display = "block";
}

function adicionarEstoque(){
  let nome = document.getElementById("nomeInsumo").value;
  let qtd = parseFloat(document.getElementById("qtdInsumo").value);
  let preco = parseFloat(document.getElementById("precoInsumo").value);
  if(!nome || !qtd || !preco) return;
  let estoque = JSON.parse(localStorage.getItem("estoque")||"[]");
  estoque.push({nome,qtd,preco});
  localStorage.setItem("estoque", JSON.stringify(estoque));
  render();
}

function adicionarTalhao(){
  let nome = document.getElementById("novoTalhao").value;
  if(!nome) return;
  let talhoes = JSON.parse(localStorage.getItem("talhoes")||"[]");
  talhoes.push(nome);
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  render();
}

function apagarTudo(){
  localStorage.clear();
  render();
}

function render(){
  let estoque = JSON.parse(localStorage.getItem("estoque")||"[]");
  let listaEstoque = document.getElementById("listaEstoque");
  listaEstoque.innerHTML = "";
  estoque.forEach((i, idx) => {
    let li = document.createElement("li");
    li.textContent = `${i.nome} - ${i.qtd}kg - R$${i.preco}/saco`;
    let btn = document.createElement("button");
    btn.textContent = "❌";
    btn.onclick = ()=>{ estoque.splice(idx,1); localStorage.setItem("estoque",JSON.stringify(estoque)); render(); };
    li.appendChild(btn);
    listaEstoque.appendChild(li);
  });

  let talhoes = JSON.parse(localStorage.getItem("talhoes")||"[]");
  let listaTalhoes = document.getElementById("listaTalhoes");
  listaTalhoes.innerHTML = "";
  talhoes.forEach((t, idx)=>{
    let li=document.createElement("li");
    li.textContent=t;
    let btn=document.createElement("button");
    btn.textContent="❌";
    btn.onclick=()=>{ talhoes.splice(idx,1); localStorage.setItem("talhoes",JSON.stringify(talhoes)); render(); };
    li.appendChild(btn);
    listaTalhoes.appendChild(li);
  });
}

// ---- Google Drive ----
function initGoogle(){
  const s = document.createElement("script");
  s.src="https://accounts.google.com/gsi/client";
  s.onload=()=>{
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (token)=>{ accessToken=token.access_token; alert("✅ Conectado ao Google"); }
    }).requestAccessToken();
  };
  document.body.appendChild(s);
}

async function salvarNoDrive(){
  if(!accessToken){ alert("Conecte-se ao Google primeiro."); return; }
  let data = { estoque: localStorage.getItem("estoque"), talhoes: localStorage.getItem("talhoes") };
  const boundary = "-------314159265358979323846";
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(data)}\r\n--${boundary}--`;
  await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",{
    method:"POST",
    headers:{Authorization:"Bearer "+accessToken,"Content-Type":"multipart/related; boundary="+boundary},
    body:body
  });
  alert("💾 Backup salvo no Drive.");
}

async function carregarDoDrive(){
  if(!accessToken){ alert("Conecte-se ao Google primeiro."); return; }
  let res = await fetch("https://www.googleapis.com/drive/v3/files?q=name='graodigital.json'&fields=files(id)",{headers:{Authorization:"Bearer "+accessToken}});
  let files = await res.json();
  if(files.files.length==0){ alert("Nenhum backup encontrado."); return; }
  let id = files.files[0].id;
  let dl = await fetch("https://www.googleapis.com/drive/v3/files/"+id+"?alt=media",{headers:{Authorization:"Bearer "+accessToken}});
  let data = await dl.json();
  if(data.estoque) localStorage.setItem("estoque",data.estoque);
  if(data.talhoes) localStorage.setItem("talhoes",data.talhoes);
  render();
  alert("🔄 Backup carregado.");
}
