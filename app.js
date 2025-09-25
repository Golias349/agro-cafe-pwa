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

// ---------- TALHÕES ----------
const listaTalhoes = document.getElementById("listaTalhoes");

function renderTalhoes(){
  const termo = (document.getElementById("pesquisaTalhao").value||"").toLowerCase();
  listaTalhoes.innerHTML = "";
  talhoes
    .filter(t=>t.nome.toLowerCase().includes(termo))
    .forEach(t=>{
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

// ---------- ESTOQUE ----------
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

// ---------- REGISTROS ----------
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

// ---------- RELATÓRIOS ----------
let gKgTalhao,gKgTipo,gCustoMes,gCustoTipo,gCustoHaTalhao;
const sumBy=(arr,key,sel=(x)=>1,val=(x)=>x)=>arr.reduce((m,o)=>{const k=key(o);m[k]=(m[k]||0)+val(o);return m;},{});

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

  // kg por talhão
  const labelsTalhao = talhoes.map(t=>t.nome);
  const dadosKgTalhao = talhoes.map(t=>aplicacoes.filter(a=>a.talhao===t.nome).reduce((s,a)=>s+a.kg,0));
  if(gKgTalhao) gKgTalhao.destroy();
  gKgTalhao = new Chart(document.getElementById("grafKgTalhao"), {type:"bar", data:{labels:labelsTalhao, datasets:[{label:"kg", data:dadosKgTalhao}]}, options:{responsive:true,plugins:{legend:{labels:{color:"#fff"}}},scales:{x:{ticks:{color:"#fff"}},y:{ticks:{color:"#fff"}}}}});

  // kg por tipo
  const tipos=[...new Set(aplicacoes.map(a=>a.tipo))];
  const dadosKgTipo=tipos.map(tp=>aplicacoes.filter(a=>a.tipo===tp).reduce((s,a)=>s+a.kg,0));
  if(gKgTipo) gKgTipo.destroy();
  gKgTipo=new Chart(document.getElementById("grafKgTipo"), {type:"pie", data:{labels:tipos, datasets:[{data:dadosKgTipo}]}, options:{responsive:true,plugins:{legend:{labels:{color:"#fff"}}}}});

  // R$ por mês
  const porMes = sumBy(aplicacoes,a=>a.data.slice(0,7),null,a=>a.custo||0);
  const lMes=Object.keys(porMes).sort(); const dMes=lMes.map(k=>porMes[k]);
  if(gCustoMes) gCustoMes.destroy();
  gCustoMes=new Chart(document.getElementById("grafCustoMes"), {type:"bar", data:{labels:lMes,datasets:[{label:"R$",data:dMes}]}, options:{responsive:true,plugins:{legend:{labels:{color:"#fff"}}},scales:{x:{ticks:{color:"#fff"}},y:{ticks:{color:"#fff"}}}}});

  // R$ por tipo
  const porTipoR = sumBy(aplicacoes,a=>a.tipo,null,a=>a.custo||0);
  const lTipo=Object.keys(porTipoR); const dTipo=lTipo.map(k=>porTipoR[k]);
  if(gCustoTipo) gCustoTipo.destroy();
  gCustoTipo=new Chart(document.getElementById("grafCustoTipo"), {type:"pie", data:{labels:lTipo,datasets:[{data:dTipo}]}, options:{responsive:true,plugins:{legend:{labels:{color:"#fff"}}}}});

  // R$/ha por talhão
  const dadosRha = talhoes.map(t=>{
    const rT=aplicacoes.filter(a=>a.talhao===t.nome).reduce((s,a)=>s+(a.custo||0),0);
    return t.area>0? rT/t.area : 0;
  });
  if(gCustoHaTalhao) gCustoHaTalhao.destroy();
  gCustoHaTalhao=new Chart(document.getElementById("grafCustoHaTalhao"), {type:"bar", data:{labels:labelsTalhao,datasets:[{label:"R$/ha",data:dadosRha}]}, options:{responsive:true,plugins:{legend:{labels:{color:"#fff"}}},scales:{x:{ticks:{color:"#fff"}},y:{ticks:{color:"#fff"}}}}});
}

// ---------- Exportações ----------
function gerarPdfBlob(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p","mm","a4");
  let y=15;
  doc.setFontSize(18); doc.text("Relatório - Grão Digital",14,y); y+=10;
  doc.setFontSize(12);
  doc.text("Data: "+new Date().toLocaleDateString("pt-BR"),14,y); y+=8;
  doc.text("Total Talhões: "+talhoes.length,14,y); y+=6;
  doc.text("Total Aplicações: "+aplicacoes.length,14,y); y+=6;
  const totalKg = aplicacoes.reduce((s,a)=>s+a.kg,0);
  const totalR = aplicacoes.reduce((s,a)=>s+(a.custo||0),0);
  doc.text("Total (kg): "+totalKg.toFixed(2),14,y); y+=6;
  doc.text("Total (R$): "+totalR.toFixed(2),14,y); y+=10;

  doc.text("Resumo por Talhão (kg · R$ · kg/ha · R$/ha · meta):",14,y); y+=6;
  talhoes.forEach(t=>{
    const apps = aplicacoes.filter(a=>a.talhao===t.nome);
    const kgT = apps.reduce((s,a)=>s+a.kg,0);
    const rT = apps.reduce((s,a)=>s+(a.custo||0),0);
    const kgha = t.area>0?kgT/t.area:0;
    const rpha = t.area>0?rT/t.area:0;
    const metaTxt = t.meta?` · meta ${t.meta} kg/ha`:"";
    if(y>280){ doc.addPage(); y=15; }
    doc.text(`- ${t.nome} (${t.area} ha): ${kgT.toFixed(1)} kg · R$ ${rT.toFixed(2)} · ${kgha.toFixed(1)} kg/ha · R$ ${rpha.toFixed(2)}/ha${metaTxt}`,14,y);
    y+=6;
  });
  return doc.output("blob");
}

document.getElementById("exportarPDF").addEventListener("click", ()=>{
  const blob = gerarPdfBlob();
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="relatorio-grao-digital.pdf"; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("compartilharPDF").addEventListener("click", async ()=>{
  try{
    const blob=gerarPdfBlob();
    const file=new File([blob],"relatorio-grao-digital.pdf",{type:"application/pdf"});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({title:"Relatório - Grão Digital",text:"Segue o relatório.",files:[file]});
    }else{
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download="relatorio-grao-digital.pdf"; a.click();
      URL.revokeObjectURL(url);
      alert("Compartilhamento nativo não suportado; o PDF foi baixado.");
    }
  }catch(e){ alert("Falha ao compartilhar: "+e.message); }
});

document.getElementById("exportarXLSX").addEventListener("click", ()=>{
  const resumo = talhoes.map(t=>{
    const apps=aplicacoes.filter(a=>a.talhao===t.nome);
    const kgT = apps.reduce((s,a)=>s+a.kg,0);
    const rT = apps.reduce((s,a)=>s+(a.custo||0),0);
    const kgha = t.area>0?kgT/t.area:0;
    const rpha = t.area>0?rT/t.area:0;
    return {Talhao:t.nome,Area_ha:t.area,Meta_kg_ha:t.meta||"",Kg:kgT,Custo_R$:rT,Kg_ha:kgha,R$_ha:rpha};
  });
  const tipos=[...new Set(aplicacoes.map(a=>a.tipo))];
  const kgTipo=tipos.map(tp=>({Tipo:tp,Kg:aplicacoes.filter(a=>a.tipo===tp).reduce((s,a)=>s+a.kg,0)}));
  const rTipo=tipos.map(tp=>({Tipo:tp,Custo_R$:aplicacoes.filter(a=>a.tipo===tp).reduce((s,a)=>s+(a.custo||0),0)}));
  const porMes={}; aplicacoes.forEach(a=>{const k=a.data.slice(0,7); porMes[k]=(porMes[k]||0)+(a.custo||0);});
  const rMes=Object.keys(porMes).sort().map(k=>({Mes:k,Custo_R$:porMes[k]}));
  const detalhado=aplicacoes.map(a=>({Data:new Date(a.data).toLocaleString("pt-BR"),Talhao:a.talhao,Tipo:a.tipo,Descricao:a.desc,Kg:a.kg,Custo_R$:a.custo||0}));

  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(resumo),"Resumo_Talhao");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(kgTipo),"KG_por_Tipo");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rTipo),"R$_por_Tipo");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rMes),"R$_por_Mes");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(detalhado),"Aplicacoes");
  XLSX.writeFile(wb,"grao-digital-dados.xlsx");
});

// ---------- Notificações ----------
const notifState = JSON.parse(localStorage.getItem("gd_notif")||"{}");
document.getElementById("notifFreq").value = notifState.freq||"none";
document.getElementById("notifHora").value = notifState.hora||"08:00";
document.getElementById("notifDia").value = notifState.dia||"1";
document.getElementById("diaSemanaWrap").style.display = (notifState.freq==="weekly")?"block":"none";

document.getElementById("notifFreq").addEventListener("change", e=>{
  document.getElementById("diaSemanaWrap").style.display = (e.target.value==="weekly")?"block":"none";
});

document.getElementById("btnPermissaoNotif").addEventListener("click", async ()=>{
  if(!("Notification" in window)){ alert("Sem suporte a notificações."); return; }
  const perm = await Notification.requestPermission();
  alert(perm==="granted"?"Permissão concedida.":"Permissão negada.");
});

document.getElementById("salvarNotif").addEventListener("click", ()=>{
  const freq=document.getElementById("notifFreq").value;
  const hora=document.getElementById("notifHora").value;
  const dia=document.getElementById("notifDia").value;
  localStorage.setItem("gd_notif", JSON.stringify({freq,hora,dia}));
  alert("Lembrete salvo!");
});

function checkAndNotify(){
  try{
    const cfg=JSON.parse(localStorage.getItem("gd_notif")||"{}");
    if(cfg.freq==="none") return;
    if(Notification.permission!=="granted") return;
    const now=new Date();
    const [hh,mm]=(cfg.hora||"08:00").split(":").map(n=>parseInt(n,10));
    const isTime=now.getHours()===hh && now.getMinutes()===mm;
    const isDay=cfg.freq==="daily" || (cfg.freq==="weekly" && now.getDay().toString()===cfg.dia);
    if(isTime && isDay){ new Notification("Grão Digital 🌱",{body:"Lembre-se de registrar as adubações."}); }
  }catch(e){}
}
setInterval(checkAndNotify, 60000);

// ---------- Backup ----------
document.getElementById("exportarJSON").addEventListener("click", ()=>{
  const blob=new Blob([JSON.stringify({talhoes,estoque,aplicacoes},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="grao-digital-backup.json"; a.click();
  URL.revokeObjectURL(url);
});
document.getElementById("importarJSON").addEventListener("change", e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      talhoes=d.talhoes||[]; estoque=d.estoque||[]; aplicacoes=d.aplicacoes||[];
      salvarTudo(); renderTalhoes(); renderEstoque(); atualizarSelects(); atualizarRelatorios();
      alert("Importação concluída!");
    }catch(err){ alert("Falha ao importar: "+err.message); }
  };
  r.readAsText(f);
});

// Inicialização
renderTalhoes(); renderEstoque(); atualizarSelects(); atualizarRelatorios();
if("serviceWorker" in navigator){ navigator.serviceWorker.register("service-worker.js"); }
