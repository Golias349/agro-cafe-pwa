
// Data da UI
document.getElementById("data").textContent = new Date().toLocaleDateString("pt-BR", {weekday:"long", day:"2-digit", month:"long", year:"numeric"});

// Estado
let talhoes = JSON.parse(localStorage.getItem("talhoes")||"[]");
let aplicacoes = JSON.parse(localStorage.getItem("aplicacoes")||"[]");
let estoque = JSON.parse(localStorage.getItem("estoque")||"[]");

function salvarTudo(){
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  localStorage.setItem("aplicacoes", JSON.stringify(aplicacoes));
  localStorage.setItem("estoque", JSON.stringify(estoque));
}

// Navegação abas
document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("ativa"));
    btn.classList.add("ativa");
    const id = btn.dataset.id;
    document.querySelectorAll(".aba").forEach(a=>a.classList.remove("ativa"));
    document.getElementById(id).classList.add("ativa");
    atualizarSelects();
  });
});

// ---------- Talhões -----------
function renderTalhoes(){
  const lista = document.getElementById("listaTalhoes");
  lista.innerHTML = "";
  talhoes.forEach((t,idx)=>{
    const li = document.createElement("li");
    li.className="item";
    const nome = (typeof t==="string") ? t : (t.nome||"");
    li.innerHTML = `<div><strong>${nome}</strong></div>`;
    const ações = document.createElement("div");
    const del = document.createElement("button");
    del.className="icon";
    del.textContent="❌";
    del.title="Excluir talhão";
    del.onclick = ()=>{
      // também remove registros daquele talhão
      const nomeT = (typeof talhoes[idx]==="string") ? talhoes[idx] : talhoes[idx].nome;
      aplicacoes = aplicacoes.filter(a=>a.talhao!==nomeT);
      talhoes.splice(idx,1);
      salvarTudo();
      renderTalhoes();
      renderAplicacoes();
      atualizarSelects();
    };
    ações.appendChild(del);
    li.appendChild(ações);
    lista.appendChild(li);
  });
}

document.getElementById("btnAddTalhao").addEventListener("click", ()=>{
  const nome = document.getElementById("novoTalhao").value.trim();
  if(!nome) return alert("Informe o nome do talhão.");
  talhoes.push({nome});
  document.getElementById("novoTalhao").value="";
  salvarTudo();
  renderTalhoes();
  atualizarSelects();
});

// ---------- Registros -----------
function renderAplicacoes(){
  const ul = document.getElementById("listaAplicacoes");
  ul.innerHTML="";
  const recentes = [...aplicacoes].reverse().slice(0,20);
  recentes.forEach((a,idx)=>{
    const li = document.createElement("li"); li.className="item";
    const precoKg = precoPorKg(a.tipo);
    const custo = precoKg ? (precoKg * a.qtd) : 0;
    li.innerHTML = `
      <div>
        <strong>${a.talhao}</strong> – <span class="badge">${a.tipo}</span>
        <small> • ${new Date(a.data).toLocaleDateString("pt-BR")} • ${a.desc||""}</small>
      </div>
      <div><strong>${a.qtd} kg</strong> ${precoKg? `• R$ ${custo.toFixed(2)}`:""}</div>
    `;
    ul.appendChild(li);
  });
}

document.getElementById("btnSalvarAplicacao").addEventListener("click", ()=>{
  const talhao = document.getElementById("selTalhao").value;
  if(!talhao) return alert("Cadastre e selecione um talhão.");
  const tipo = document.getElementById("tipoInsumo").value.trim();
  const desc = document.getElementById("descricao").value.trim();
  const qtd = Number(document.getElementById("qtdKg").value);
  if(!qtd || qtd<=0) return alert("Quantidade inválida.");

  aplicacoes.push({talhao,tipo,desc,qtd,data:new Date().toISOString()});
  salvarTudo();
  document.getElementById("qtdKg").value="";
  renderAplicacoes();
  atualizarResumo();
});

function atualizarSelects(){
  const sel = document.getElementById("selTalhao");
  sel.innerHTML="";
  talhoes.forEach(t=>{
    const nome = (typeof t==="string")? t : (t.nome||"");
    const opt = document.createElement("option"); opt.value=nome; opt.textContent=nome;
    sel.appendChild(opt);
  });
}

// ---------- Estoque -----------
function precoPorKg(tipo){
  if(!tipo) return 0;
  const item = estoque.find(e=>e.nome.toLowerCase()===tipo.toLowerCase());
  if(!item || !item.precoSaco) return 0;
  return Number(item.precoSaco)/50; // preco por kg
}

function renderEstoque(){
  const ul = document.getElementById("listaEstoque");
  ul.innerHTML="";
  estoque.forEach((e,idx)=>{
    const li = document.createElement("li"); li.className="item";
    const precoKg = e.precoSaco? (Number(e.precoSaco)/50) : 0;
    li.innerHTML = `<div><strong>${e.nome}</strong> <small>• ${e.kg} kg</small></div>
                    <div>R$ ${Number(e.precoSaco||0).toFixed(2)}/50kg (${precoKg? "R$ "+precoKg.toFixed(2)+"/kg":""})
                      <button class="icon" title="Excluir" data-i="${idx}">❌</button></div>`;
    ul.appendChild(li);
  });
  // listeners para excluir
  ul.querySelectorAll("button.icon").forEach(b=>{
    b.onclick = ()=>{
      const i = Number(b.dataset.i);
      estoque.splice(i,1);
      salvarTudo();
      renderEstoque();
      atualizarResumo();
    };
  });
}

document.getElementById("btnAddEstoque").addEventListener("click", ()=>{
  const nome = document.getElementById("insumoNome").value.trim();
  const kg = Number(document.getElementById("insumoKg").value);
  const precoSaco = Number(document.getElementById("insumoPrecoSaco").value);
  if(!nome) return alert("Informe o nome do insumo.");
  if(!kg || kg<=0) return alert("Quantidade inválida.");
  if(!precoSaco || precoSaco<=0) return alert("Preço por saco inválido.");
  // Se já existir, atualiza
  const ex = estoque.find(e=>e.nome.toLowerCase()===nome.toLowerCase());
  if(ex){ ex.kg += kg; ex.precoSaco = precoSaco; }
  else { estoque.push({nome, kg, precoSaco}); }
  ["insumoNome","insumoKg","insumoPrecoSaco"].forEach(id=>document.getElementById(id).value="");
  salvarTudo();
  renderEstoque();
  atualizarResumo();
});

// ---------- Resumo Mensal -----------
function chaveMes(d){
  const dt = new Date(d);
  return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0");
}
function labelMes(ym){
  const [y,m]=ym.split("-");
  const d=new Date(Number(y), Number(m)-1, 1);
  return d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
}
function atualizarResumo(){
  const tbody = document.querySelector("#tabelaResumo tbody");
  tbody.innerHTML="";
  const mapa={}; // ym -> {kg, gasto}
  aplicacoes.forEach(a=>{
    const ym = chaveMes(a.data);
    mapa[ym] = mapa[ym] || {kg:0, gasto:0};
    mapa[ym].kg += Number(a.qtd)||0;
    const precoKg = precoPorKg(a.tipo);
    mapa[ym].gasto += (precoKg * (Number(a.qtd)||0));
  });
  Object.keys(mapa).sort().forEach(ym=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${labelMes(ym)}</td>
                    <td>${mapa[ym].kg.toFixed(1)} kg</td>
                    <td>R$ ${mapa[ym].gasto.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
}

// ---------- Backup local (JSON) ----------
document.getElementById("btnExportar").onclick = ()=>{
  const blob = new Blob([JSON.stringify({talhoes,aplicacoes,estoque},null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "grao_digital_backup.json";
  a.click();
}
document.getElementById("btnImportar").onclick = ()=>document.getElementById("inputImportar").click();
document.getElementById("inputImportar").onchange = (ev)=>{
  const f = ev.target.files[0]; if(!f) return;
  const rd = new FileReader();
  rd.onload = ()=>{
    try{
      const data = JSON.parse(rd.result);
      talhoes = data.talhoes||[];
      aplicacoes = data.aplicacoes||[];
      estoque = data.estoque||[];
      salvarTudo();
      renderTalhoes(); renderAplicacoes(); renderEstoque(); atualizarSelects(); atualizarResumo();
      alert("Backup importado com sucesso.");
    }catch(e){ alert("Arquivo inválido."); }
  };
  rd.readAsText(f);
};

// ---------- Google Drive (opcional) ----------
const CLIENT_ID = "COLE_SEU_CLIENT_ID_AQUI"; // substitua
const SCOPES = "https://www.googleapis.com/auth/drive.file openid email profile";
let accessToken = null;

function initGoogle(){
  if(!CLIENT_ID || CLIENT_ID.includes("COLE_SEU_CLIENT_ID_AQUI")){
    alert("Edite CLIENT_ID em app.js com seu OAuth Client ID antes de conectar.");
    return;
  }
  // Google Identity Services
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.onload = ()=>{
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (token)=>{ accessToken = token.access_token; alert("Conectado ao Google."); }
    }).requestAccessToken();
  };
  document.body.appendChild(s);
}
document.getElementById("btnConectar").onclick = initGoogle;

async function driveFetch(url, opts={}){
  if(!accessToken) { alert("Conecte ao Google primeiro."); return null; }
  opts.headers = Object.assign({}, opts.headers||{}, {Authorization:"Bearer "+accessToken});
  const r = await fetch(url, opts);
  if(!r.ok) throw new Error("Drive error "+r.status);
  return r;
}
document.getElementById("btnSalvarDrive").onclick = async ()=>{
  try{
    if(!accessToken) return alert("Conecte ao Google primeiro.");
    const metadata = {name:"grao_digital_backup.json", mimeType:"application/json"};
    const dados = JSON.stringify({talhoes,aplicacoes,estoque});
    const boundary = "-------314159265358979323846";
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`+
      JSON.stringify(metadata)+
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n`+
      dados+`\r\n--${boundary}--`;
    await driveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",{
      method:"POST",
      headers:{"Content-Type":"multipart/related; boundary="+boundary},
      body
    });
    alert("Backup salvo no Drive.");
  }catch(e){ alert("Falha ao salvar no Drive: "+e.message); }
};
document.getElementById("btnCarregarDrive").onclick = async ()=>{
  try{
    if(!accessToken) return alert("Conecte ao Google primeiro.");
    // procurar arquivo pelo nome
    const q = encodeURIComponent("name='grao_digital_backup.json' and trashed=false");
    const res = await driveFetch("https://www.googleapis.com/drive/v3/files?q="+q+"&fields=files(id,name)");
    const j = await res.json();
    if(!j.files || !j.files.length) return alert("Arquivo não encontrado no Drive.");
    const fileId = j.files[0].id;
    const conteudo = await driveFetch("https://www.googleapis.com/drive/v3/files/"+fileId+"?alt=media");
    const data = await conteudo.json();
    talhoes = data.talhoes||[];
    aplicacoes = data.aplicacoes||[];
    estoque = data.estoque||[];
    salvarTudo(); renderTalhoes(); renderAplicacoes(); renderEstoque(); atualizarSelects(); atualizarResumo();
    alert("Backup carregado do Drive.");
  }catch(e){ alert("Falha ao carregar do Drive: "+e.message); }
};

// ---------- Limpeza ----------
document.getElementById("btnApagarDados").onclick = ()=>{
  if(confirm("Tem certeza que deseja APAGAR TODOS os dados (talhões, estoque e registros)?")){
    talhoes=[]; estoque=[]; aplicacoes=[]; salvarTudo();
    renderTalhoes(); renderEstoque(); renderAplicacoes(); atualizarSelects(); atualizarResumo();
  }
};

// Inicialização
renderTalhoes();
renderEstoque();
renderAplicacoes();
atualizarSelects();
atualizarResumo();

// PWA
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js');
}
