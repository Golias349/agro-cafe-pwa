let CLIENT_ID = "SUBSTITUA_COM_SEU_CLIENT_ID";
const SCOPES = "https://www.googleapis.com/auth/drive.file openid email profile";
let accessToken = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});

function mostrar(secao) {
  document.querySelectorAll("main section").forEach(s => s.style.display = "none");
  document.getElementById(secao).style.display = "block";
}

function adicionarTalhao() {
  let nome = document.getElementById("nomeTalhao").value;
  if (!nome) return;
  let li = document.createElement("li");
  li.textContent = nome;
  document.getElementById("listaTalhoes").appendChild(li);
  document.getElementById("nomeTalhao").value = "";
}

function adicionarEstoque() {
  let nome = document.getElementById("nomeInsumo").value;
  let qtd = document.getElementById("qtdInsumo").value;
  let preco = document.getElementById("precoInsumo").value;
  if (!nome || !qtd || !preco) return;
  let li = document.createElement("li");
  li.textContent = `${nome} - ${qtd}kg - R$${preco}/saco`;
  document.getElementById("listaEstoque").appendChild(li);
}

function salvarAplicacao() {
  let li = document.createElement("li");
  li.textContent = "Aplicação registrada";
  document.getElementById("listaRegistros").appendChild(li);
}

function apagarTudo() {
  if(confirm("Tem certeza que deseja apagar TODOS os dados?")) {
    localStorage.clear();
    location.reload();
  }
}

// Backup JSON local
function exportarBackup() {
  let dados = localStorage;
  let blob = new Blob([JSON.stringify(dados)], {type: "application/json"});
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup.json";
  a.click();
}
function importarBackup(e) {
  let file = e.target.files[0];
  let reader = new FileReader();
  reader.onload = () => {
    localStorage.clear();
    let dados = JSON.parse(reader.result);
    for (let k in dados) localStorage.setItem(k, dados[k]);
    alert("Backup importado com sucesso!");
    location.reload();
  };
  reader.readAsText(file);
}

// Google Drive
function initGoogle() {
  if(CLIENT_ID === "SUBSTITUA_COM_SEU_CLIENT_ID"){
    alert("Edite CLIENT_ID em app.js com seu OAuth Client ID antes de conectar.");
    return;
  }
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.onload = () => {
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (token) => { accessToken = token.access_token; alert("Conectado ao Google!"); }
    }).requestAccessToken();
  };
  document.body.appendChild(s);
}

function salvarNoDrive() {
  if(!accessToken) { alert("Conecte ao Google antes."); return; }
  let file = new Blob([JSON.stringify(localStorage)], {type: "application/json"});
  let metadata = { name: "grao-digital-backup.json", mimeType: "application/json" };
  let form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);
  fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: new Headers({ "Authorization": "Bearer " + accessToken }),
    body: form
  }).then(r => r.json()).then(() => alert("Backup salvo no Drive!"));
}

function carregarDoDrive() {
  alert("Função carregar ainda não implementada.");
}
