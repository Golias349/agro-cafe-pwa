// Data
document.getElementById("data").textContent =
  new Date().toLocaleDateString("pt-BR", {weekday:"long", day:"numeric", month:"long", year:"numeric"});

// Estado
let talhoes = JSON.parse(localStorage.getItem("talhoes")) || [];
let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
let aplicacoes = JSON.parse(localStorage.getItem("aplicacoes")) || [];
function salvarTudo(){
  localStorage.setItem("talhoes", JSON.stringify(talhoes));
  localStorage.setItem("estoque", JSON.stringify(estoque));
  localStorage.setItem("aplicacoes", JSON.stringify(aplicacoes));
}

// Abas
function mostrarAba(id){
  document.querySelectorAll(".aba").forEach(a=>a.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");
  if(id==="abaTalhoes") renderTalhoes();
  if(id==="abaEstoque") renderEstoque();
  if(id==="abaRegistros") atualizarSelects();
  if(id==="abaRelatorios") atualizarRelatorios();
}

// TALHÕES
const listaTalhoes = document.getElementById("listaTalhoes");
function renderTalhoes(){
  const termo = (document.getElementById("pesquisaTalhao").value||"").toLowerCase();
  listaTalhoes.innerHTML = "";
  talhoes.filter(t=>t.nome.toLowerCase().includes(termo)).forEach(t=>{
    const apps = aplicacoes.filter(a=>a.talhao===t.nome);
    const totalAplic = apps.length;
    const totalKg = apps.reduce((s,a)=>s+a.kg,0);
    const kgHa = t.area>0 ? totalKg/t.area : 0;
    const custo = apps.reduce((s,a)=>s+(a.custo||0),0);
    const rHa = t.area>0 ? custo/t.area : 0;
    const metaTxt = t.meta?` • meta ${t.meta} kg/ha`:"";
    const badge = t.meta ? (kgHa>=t.meta ? '<span class="badge-ok">Meta atingida</span>' : '<span class="badge-low">Abaixo da meta</span>') : "";
    const el = document.createElement("section");
    el.className="talhao-card";
    el.innerHTML = `
      <h3>${t.nome} <small style="opacity:.8;font-weight:normal;">(${t.area} ha${metaTxt})</small> ${badge}</h3>
      <p><strong>Aplicações:</strong> ${totalAplic} · <strong>Total:</strong> ${totalKg.toFixed(1)} kg (${kgHa.toFixed(1)} kg/ha) · <strong>R$:</strong> ${custo.toFixed(2)} (${rHa.toFixed(2)} R$/ha)</p>
      <div class="talhao-actions">
        <button onclick="editarTalhao('${t.nome}')">✏️ Editar</button>
        <button onclick="excluirTalhao('${t.nome}')" style="background:#8a2b2b">🗑️ Excluir</button>
      </div>`;
    listaTalhoes.appendChild(el);
  });
}
document.getElementById("formTalhao").addEventListener("submit", e=>{
  e.preventDefault();
  const nome = document.getElementById("nomeTalhao").value.trim();
  const area = parseFloat(document.getElementById("areaTalhao").value);
  const meta = parseFloat(document.getElementById("metaTalhao").value);
  if(!nome || isNaN(area) || area<=0){ alert("Informe nome e área (ha) > 0"); return; }
  if(talhoes.some(t=>t.nome===nome)){ alert("Já existe talhão com esse nome."); return; }
  const novo = {nome, area}; if(!isNaN(meta) && meta>0) novo.meta = meta;
  talhoes.push(novo); salvarTudo(); e.target.reset(); renderTalhoes(); atualizarSelects();
});
document.getElementById("pesquisaTalhao").addEventListener("input", renderTalhoes);
window.excluirTalhao = (nome)=>{
  if(!confirm("Excluir talhão e suas aplicações?")) return;
  talhoes = talhoes.filter(t=>t.nome!==nome);
  aplicacoes = aplicacoes.filter(a=>a.talhao!==nome);
  salvarTudo(); renderTalhoes(); atualizarRelatorios(); atualizarSelects();
};
window.editarTalhao = (nome)=>{
  const t = talhoes.find(x=>x.nome===nome); if(!t) return;
  const nn = prompt("Novo nome do talhão:", t.nome) ?? t.nome;
  const na = parseFloat(prompt("Nova área (ha):", t.area) ?? t.area);
  const nm = prompt("Meta (kg/ha) — opcional:", t.meta ?? "");
  const nmeta = nm!==null && nm!=="" ? parseFloat(nm) : null;
  if(!nn || isNaN(na) || na<=0) return;
  const novo = {nome:nn, area:na}; if(nmeta && !isNaN(nmeta) && nmeta>0) novo.meta = nmeta;
  talhoes = talhoes.map(x=> x.nome===nome ? novo : x);
  aplicacoes = aplicacoes.map(a=> a.talhao===nome ? {...a, talhao: nn} : a);
  salvarTudo(); renderTalhoes(); atualizarSelects(); atualizarRelatorios();
};

// ESTOQUE
const listaEstoque = document.getElementById("listaEstoque");
function renderEstoque(){
  listaEstoque.innerHTML = "";
  if(estoque.length===0){
    const c = document.createElement("div");
    c.className="card"; c.innerHTML="<em>Sem itens no estoque.</em>";
    listaEstoque.appendChild(c); return;
  }
  estoque.forEach((item,i)=>{
    const dispKg = item.sacos*item.kgSaco;
    const low = item.sacos<5;
    const c = document.createElement("section");
    c.className="card";
    c.innerHTML = `
      <h3>${item.nome} ${low?'<span class="badge-low">⚠️ Estoque baixo</span>':''}</h3>
      <p><strong>Sacos:</strong> ${item.sacos} · <strong>kg/saco:</strong> ${item.kgSaco} · <strong>Preço/saco:</strong> R$ ${Number(item.precoSaco).toFixed(2)}</p>
      <p><strong>Disponível (kg):</strong> ${dispKg}</p>
      <div class="talhao-actions">
        <button onclick="editarEstoque(${i})">✏️ Editar</button>
        <button onclick="excluirEstoque(${i})" style="background:#8a2b2b">🗑️ Excluir</button>
      </div>`;
    listaEstoque.appendChild(c);
  });
}
document.getElementById("formEstoque").addEventListener("submit", e=>{
  e.preventDefault();
  const nome = document.getElementById("estNome").value.trim();
  const sacos = parseFloat(document.getElementById("estSacos").value);
  const kgSaco = parseFloat(document.getElementById("estKgSaco").value);
  const precoSaco = parseFloat(document.getElementById("estPrecoSaco").value);
  if(!nome || [sacos,kgSaco,precoSaco].some(v=>isNaN(v)||v<=0)){ alert("Preencha corretamente."); return; }
  estoque.push({nome,sacos,kgSaco,precoSaco});
  salvarTudo(); e.target.reset(); renderEstoque(); atualizarSelects();
});
window.excluirEstoque = (i)=>{
  if(!confirm("Excluir item?")) return;
  estoque.splice(i,1); salvarTudo(); renderEstoque(); atualizarSelects();
};
window.editarEstoque = (i)=>{
  const it = estoque[i];
  const n = prompt("Nome:", it.nome) ?? it.nome;
  const s = parseFloat(prompt("Sacos:", it.sacos) ?? it.sacos);
  const k = parseFloat(prompt("kg/saco:", it.kgSaco) ?? it.kgSaco);
  const p = parseFloat(prompt("Preço/saco (R$):", it.precoSaco) ?? it.precoSaco);
  if(!n || [s,k,p].some(v=>isNaN(v)||v<=0)) return;
  estoque[i]={nome:n,sacos:s,kgSaco:k,precoSaco:p};
  salvarTudo(); renderEstoque(); atualizarSelects();
};

// REGISTROS
function atualizarSelects(){
  const selT = document.getElementById("selectTalhao");
  const selI = document.getElementById("tipoInsumo");
  selT.innerHTML=""; selI.innerHTML="";
  talhoes.forEach(t=>{
    const o=document.createElement("option"); o.value=t.nome; o.textContent=`${t.nome} (${t.area} ha${t.meta?` • meta ${t.meta} kg/ha`:``})`; selT.appendChild(o);
  });
  estoque.forEach(e=>{
    const o=document.createElement("option"); o.value=e.nome; o.textContent=e.nome; selI.appendChild(o);
  });
}
document.getElementById("formAplicacao").addEventListener("submit", e=>{
  e.preventDefault();
  const talhao = document.getElementById("selectTalhao").value;
  const tipo = document.getElementById("tipoInsumo").value;
  const desc = document.getElementById("descAplicacao").value.trim();
  const kg = parseFloat(document.getElementById("kgAplicacao").value);
  if(!talhao||!tipo||!desc||isNaN(kg)||kg<=0){ alert("Preencha os campos."); return; }
  const it = estoque.find(x=>x.nome===tipo);
  if(!it){ alert("Adubo não encontrado no estoque."); return; }
  if(it.kgSaco<=0){ alert("kg/saco inválido no estoque."); return; }
  const sacosUsados = kg/it.kgSaco;
  const custo = sacosUsados*it.precoSaco;
  it.sacos = +(it.sacos - sacosUsados).toFixed(4);
  if(it.sacos<5) alert(`⚠️ Estoque baixo para ${it.nome} (${it.sacos.toFixed(2)} sacos).`);
  aplicacoes.push({talhao,tipo,desc,kg,data:new Date().toISOString(),custo:+custo.toFixed(2)});
  salvarTudo(); e.target.reset();
  alert(`Aplicação salva! Custo: R$ ${custo.toFixed(2)}`);
  renderTalhoes(); atualizarRelatorios(); renderEstoque(); atualizarSelects();
});

// RELATÓRIOS
let gKgTalhao,gKgTipo,gCustoMes,gCustoTipo,gCustoHaTalhao;
const sumBy=(arr,key,val=(x)=>x)=>arr.reduce((m,o)=>{const k=key(o);m[k]=(m[k]||0)+val(o);return m;},{});
function atualizarRelatorios(){
  const totalKg = aplicacoes.reduce((s,a)=>s+a.kg,0);
  const totalR = aplicacoes.reduce((s,a)=>s+(a.custo||0),0);
  document.getElementById("relTotalTalhoes").textContent=talhoes.length;
  document.getElementById("relTotalAplicacoes").textContent=aplicacoes.length;
  document.getElementById("relTotalKg").textContent=totalKg.toFixed(2);
  document.getElementById("relTotalCusto").textContent=totalR.toFixed(2);

  const ul=document.getElementById("resumoTalhoes"); ul.innerHTML="";
  talhoes.forEach(t=>{
    const apps = aplicacoes.filter(a=>a.talhao===t.nome);
    const kgT = apps.reduce((s,a)=>s+a.kg,0);
    const rT = apps.reduce((s,a)=>s+(a.custo||0),0);
    const kgha = t.area>0?kgT/t.area:0;
    const rpha = t.area>0?rT/t.area:0;
    const badge = t.meta? (kgha>=t.meta?'<span class="badge-ok">Meta OK</span>':'<span class="badge-low">Abaixo da meta</span>') : "";
    const metaTxt = t.meta?` · meta ${t.meta} kg/ha`:"";
    const li=document.createElement("li");
    li.innerHTML=`<span>${t.nome} (${t.area} ha${metaTxt}) ${badge}</span><span>${kgT.toFixed(1)} kg · R$ ${rT.toFixed(2)} · ${kgha.toFixed(1)} kg/ha · R$ ${rpha.toFixed(2)}/ha</span>`;
    ul.appendChild(li);
  });

  const labelsTalhao = talhoes.map(t=>t.nome);
  const dadosKgTalhao = talhoes.map(t=>aplicacoes.filter(a=>a.talhao===t.nome).reduce((s,a)=>s+a.kg,0));
  if(gKgTalhao) gKgTalhao.destroy();
  gKgTalhao = new Chart(document.getElementById("grafKgTalhao"), {type:"bar", data:{labels:labelsTalhao, datasets:[{label:"kg", data:dadosKgTalhao}]}, options:{responsive:true,plugins:{legend:{labels:{color:"#fff"}}},scales:{x:{ticks:{color:"#fff"}},y:{ticks:{color:"#fff"}}}}});

  const tipos=[...new Set(aplicacoes.map(a=>a.tipo))];
  const dadosKgTipo=tipos.map(tp=>aplicacoes.filter(a=>a.tipo===tp).reduce((s,a)=>s+a.kg,0));
  if(gKgTipo) gKgTipo.destroy();
  gKgTipo=new Chart(document.getElementById("grafKgTipo"), {type:"pie", data:{labels:tipos, datasets:[{data:dadosKgTipo}]}, options:{responsive:true,plugins:{legend:{labels:{color:"#fff"}}}}});

  const porMes = sumBy(aplicacoes,a=>a.data.slice(0,7),a=>a.custo||0);
  const lMes=Object.keys(porMes).sort(); const dMes=lMes.map(k=>porMes[k]);
  if(gCustoMes) gCustoMes.destroy();
  gCustoMes=new Chart(document.getElementById("grafCustoMes"), {type:"bar", data:{labels:lMes,datasets:[{label:"R$",data:dMes}]}, options:{responsive:true,plugins:{legend:{labels:{color:"#fff"}}},scales:{x:{ticks:{color:"#fff"}},y:{ticks:{color:"#fff"}}}}});
  // tabela mensal
  const tab=document.getElementById("tabelaCustoMes");
  if(tab){
    tab.innerHTML="";
    if(lMes.length===0){ tab.innerHTML="<em>Sem dados no período.</em>"; }
    else{
      lMes.forEach((m,i)=>{
        const li=document.createElement("li");
        li.innerHTML=`<span>${m}</span><span>R$ ${dMes[i].toFixed(2)}</span>`;
        tab.appendChild(li);
      });
    }
  }

  const porTipoR = sumBy(aplicacoes,a=>a.tipo,a=>a.custo||0);
  const lTipo=Object.keys(porTipoR); const dTipo=lTipo.map(k=>porTipoR[k]);
  if(gCustoTipo) gCustoTipo.destroy();
  gCustoTipo=new Chart(document.getElementById("grafCustoTipo"), {type:"pie", data:{labels:lTipo,datasets:[{data:dTipo}]}, options:{responsive:true,plugins:{legend:{labels:{color:"#fff"}}}}});

  const dadosRha = talhoes.map(t=>{
    const rT=aplicacoes.filter(a=>a.talhao===t.nome).reduce((s,a)=>s+(a.custo||0),0);
    return t.area>0? rT/t.area : 0;
  });
  if(gCustoHaTalhao) gCustoHaTalhao.destroy();
  gCustoHaTalhao=new Chart(document.getElementById("grafCustoHaTalhao"), {type:"bar", data:{labels:labelsTalhao,datasets:[{label:"R$/ha",data:dadosRha}]}, options:{responsive:true,plugins:{legend:{labels:{color:"#fff"}}},scales:{x:{ticks:{color:"#fff"}},y:{ticks:{color:"#fff"}}}}});
}

// PDF/Excel/JSON local – omitido aqui por brevidade; (no seu projeto completo já está)
document.getElementById("exportarPDF").addEventListener("click", ()=>alert("PDF gerado (versão compacta)."));
document.getElementById("compartilharPDF").addEventListener("click", ()=>alert("Compartilhar PDF (versão compacta)."));
document.getElementById("exportarXLSX").addEventListener("click", ()=>alert("Exportar Excel (versão compacta)."));

// SW
if("serviceWorker" in navigator){ navigator.serviceWorker.register("service-worker.js"); }

// Google Drive – placeholder (cole seu CLIENT_ID no projeto completo)
const CLIENT_ID = "PASTE_YOUR_CLIENT_ID.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
let isAuthed=false;
function initGoogle(){
  gapi.load("client:auth2", ()=>{
    gapi.client.init({clientId:CLIENT_ID,scope:SCOPES,discoveryDocs:["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]})
      .then(()=>{ isAuthed=gapi.auth2.getAuthInstance().isSignedIn.get(); });
  });
}
function handleAuthClick(){ gapi.auth2.getAuthInstance().signIn().then(()=>{ isAuthed=true; alert("Conectado!"); }); }
async function saveDataToDrive(){ alert("Salvar no Drive (use o pacote completo)."); }
async function loadDataFromDrive(){ alert("Carregar do Drive (use o pacote completo)."); }

// Inicial
renderTalhoes(); renderEstoque(); atualizarSelects(); atualizarRelatorios();