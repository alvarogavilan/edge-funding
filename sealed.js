/* Card Vault V69 · Sellado / Productos + Rebalanceo
   Local-first. No inventa precios ni rentabilidad: solo calcula con datos introducidos y URLs de evidencia. */
(function(){
"use strict";
if(!Array.isArray(state.sealedProducts))state.sealedProducts=[];
if(!state.sealedSnapshots||typeof state.sealedSnapshots!=="object"||Array.isArray(state.sealedSnapshots))state.sealedSnapshots={};
if(!state.sealedPolicy||typeof state.sealedPolicy!=="object")state.sealedPolicy={minPriceEUR:40,maxPriceEUR:250,minUpsideEUR:50};
for(const c of state.cards||[])if(!c.purpose)c.purpose="investment";
save();

let sealedEditId=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const num=v=>Number.isFinite(+v)?+v:0;
const pct=v=>Number.isFinite(+v)?(+v).toFixed(1)+"%":"—";
const purposeLabels={no_sell:"NO vender",personal:"Colección personal",investment:"Inversión",psa:"Para PSA",sell:"Para vender",reinvest:"Para reinvertir"};
const purposeOptions=Object.entries(purposeLabels).map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join("");

function sealedEvidenceScore(p){
  let s=0;
  if(num(p.currentPrice)>0)s+=18;
  if(p.sourceUrl)s+=18;
  if(p.buyUrl)s+=18;
  if(p.photoUrl)s+=10;
  if(num(p.averagePrice)>0||num(p.recentLow)>0)s+=10;
  if(num(p.targetBase)>0)s+=10;
  if(p.liquidity)s+=6;
  if(p.reprintRisk)s+=5;
  if(p.releaseDate)s+=3;
  if(p.printStatus&&p.printStatus!=="unknown")s+=2;
  return Math.min(100,s);
}
function sealedHistory(p){return Array.isArray(state.sealedSnapshots?.[p.id])?state.sealedSnapshots[p.id]:[]}
function recordSealedSnapshot(p){
  if(!p?.id||!(num(p.currentPrice)>0)||!p.sourceUrl)return;
  const day=new Date().toISOString().slice(0,10),rows=sealedHistory(p),last=rows.at(-1);
  const row={day,price:num(p.currentPrice),shipping:num(p.shipping),sourceUrl:p.sourceUrl,at:new Date().toISOString()};
  if(last?.day===day)rows[rows.length-1]=row;else rows.push(row);
  state.sealedSnapshots[p.id]=rows.slice(-370);
}
function derivedSealedTrend(p,days){
  const rows=sealedHistory(p).filter(x=>num(x.price)>0),now=rows.at(-1);if(!now)return null;
  const cutoff=new Date(now.day+"T00:00:00Z").getTime()-days*86400000;
  const prior=[...rows].reverse().find(x=>new Date(x.day+"T00:00:00Z").getTime()<=cutoff);
  return prior&&num(prior.price)>0?(num(now.price)-num(prior.price))/num(prior.price)*100:null;
}
function sealedEconomics(p){
  const cost=num(p.currentPrice)+num(p.shipping),base=num(p.targetBase),low=num(p.targetLow),high=num(p.targetHigh);
  return {cost,base,low,high,baseProfit:base>0?base-cost:null,basePct:base>0&&cost>0?(base-cost)/cost*100:null};
}
function sealedDecision(p){
  const e=sealedEvidenceScore(p),x=sealedEconomics(p),policy=state.sealedPolicy;
  if(!p.sourceUrl||!p.buyUrl||x.cost<=0||e<55)return {key:"avoid",label:"NO COMPRAR",why:"Evidencia insuficiente o falta enlace/precio verificable."};
  if(p.reprintRisk==="high")return {key:"avoid",label:"NO COMPRAR",why:"Riesgo de reedición alto registrado."};
  if(x.baseProfit==null)return {key:"watch",label:"VIGILAR",why:"Falta escenario base respaldado por datos."};
  const inBand=x.cost>=num(policy.minPriceEUR)&&x.cost<=num(policy.maxPriceEUR);
  if(e>=80&&x.baseProfit>=num(policy.minUpsideEUR)&&inBand&&p.liquidity!=="low")
    return {key:"buy",label:"COMPRA YA",why:"Cumple tus filtros de precio, margen absoluto y calidad de evidencia."};
  return {key:"watch",label:"VIGILAR",why:!inBand?"Fuera del rango de compra configurado.":"Aún no supera todos tus filtros de compra."};
}
function confidence(p){const e=sealedEvidenceScore(p);return e>=85?"Alta":e>=65?"Media":"Baja"}
function universeName(u){return u==="lorcana"?"Lorcana":"Pokémon"}
function ageYears(date){if(!date)return null;const t=new Date(date).getTime();if(!Number.isFinite(t))return null;return Math.max(0,(Date.now()-t)/31557600000)}
function cardmarketHub(p){return p.universe==="lorcana"?"https://www.cardmarket.com/es/Lorcana/Products":"https://www.cardmarket.com/es/Pokemon/Products/Sealed-Products"}
function ebaySearch(p){return "https://www.ebay.es/sch/i.html?_nkw="+encodeURIComponent((p.name||"")+" "+(p.set||"")+" sealed")}
function productCard(p,rank){
  const d=sealedDecision(p),x=sealedEconomics(p),ev=sealedEvidenceScore(p),age=ageYears(p.releaseDate);
  const premium=num(p.msrp)>0?((num(p.currentPrice)-num(p.msrp))/num(p.msrp)*100):null;
  const photo=p.photoUrl?'<img src="'+esc(p.photoUrl)+'" alt="'+esc(p.name)+'" loading="lazy">':'📦';
  const t30=derivedSealedTrend(p,30),t90=derivedSealedTrend(p,90);
  const trend=[t30!=null?"30d local "+pct(t30):(p.trend30!==""&&p.trend30!=null?"30d fuente "+pct(p.trend30):""),t90!=null?"90d local "+pct(t90):(p.trend90!==""&&p.trend90!=null?"90d fuente "+pct(p.trend90):"")].filter(Boolean).join(" · ");
  return '<article class="sealedCard" data-id="'+esc(p.id)+'"><div class="sealedPhoto">'+photo+'</div><div>'+
    '<div class="sealedTitle"><div>'+(rank?'<small>#'+rank+' · '+universeName(p.universe)+'</small>':'<small>'+universeName(p.universe)+'</small>')+'<h3>'+esc(p.name)+'</h3><div class="meta">'+esc(p.set||"—")+' · '+esc(p.productType||"Producto sellado")+'</div></div><span class="decisionPill '+d.key+'">'+d.label+'</span></div>'+
    '<div class="sealedMetrics"><div><span>Precio total</span><b>'+euro(x.cost)+'</b></div><div><span>Escenario base</span><b>'+(x.base?euro(x.base):"Sin dato")+'</b></div><div><span>Potencial base</span><b>'+(x.baseProfit==null?"Sin dato":(x.baseProfit>=0?"+":"")+euro(x.baseProfit))+'</b></div><div><span>Confianza datos</span><b>'+confidence(p)+' · '+ev+'/100</b></div><div><span>Liquidez</span><b>'+esc(p.liquidity||"Sin evaluar")+'</b></div><div><span>Riesgo reedición</span><b>'+esc(p.reprintRisk||"Sin evaluar")+'</b></div></div>'+
    '<div class="evidenceLine">'+esc(d.why)+(trend?' · '+esc(trend):'')+(premium!=null?' · Prima MSRP '+pct(premium):'')+(age!=null?' · Edad '+age.toFixed(1)+' años':'')+'</div>'+
    '<div class="evidenceLine">Estado: '+esc(p.printStatus||"unknown")+' · Stock: '+esc(p.availability||"unknown")+(p.seller?' · Vendedor: '+esc(p.seller):'')+'</div>'+
    (p.notes?'<div class="evidenceLine">'+esc(p.notes)+'</div>':'')+
    '<div class="sealedActions">'+
      (p.buyUrl?'<a href="'+esc(p.buyUrl)+'" target="_blank" rel="noopener">Comprar / oferta</a>':'')+
      (p.sourceUrl?'<a href="'+esc(p.sourceUrl)+'" target="_blank" rel="noopener">Ver evidencia</a>':'')+
      '<a href="'+cardmarketHub(p)+'" target="_blank" rel="noopener">Cardmarket</a><a href="'+ebaySearch(p)+'" target="_blank" rel="noopener">eBay exacto</a>'+
      '<button type="button" data-edit-sealed="'+esc(p.id)+'">Editar</button></div></div></article>';
}
function filteredProducts(){
  const u=$("#sealedUniverse")?.value||"",d=$("#sealedDecision")?.value||"",q=($("#sealedSearch")?.value||"").trim().toLowerCase();
  return state.sealedProducts.filter(p=>(!u||p.universe===u)&&(!d||sealedDecision(p).key===d)&&(!q||[p.name,p.set,p.productType,p.seller].join(" ").toLowerCase().includes(q)));
}
function rankedProducts(){
  return [...state.sealedProducts].filter(p=>sealedEvidenceScore(p)>=55).sort((a,b)=>{
    const da=sealedDecision(a),db=sealedDecision(b),w={buy:3,watch:2,avoid:1};
    const pa=sealedEconomics(a).baseProfit??-1e9,pb=sealedEconomics(b).baseProfit??-1e9;
    return (w[db.key]-w[da.key])||(pb-pa)||(sealedEvidenceScore(b)-sealedEvidenceScore(a));
  });
}
function renderSealed(){
  const rows=filteredProducts(),ranked=rankedProducts(),dec=state.sealedProducts.map(sealedDecision);
  const sum=$("#sealedSummary");if(sum)sum.innerHTML=
    '<div><span>Productos</span><b>'+state.sealedProducts.length+'</b></div>'+
    '<div><span>Compra ya</span><b>'+dec.filter(x=>x.key==="buy").length+'</b></div>'+
    '<div><span>Vigilar</span><b>'+dec.filter(x=>x.key==="watch").length+'</b></div>'+
    '<div><span>No comprar</span><b>'+dec.filter(x=>x.key==="avoid").length+'</b></div>';
  const policy=state.sealedPolicy;
  const best=ranked.find(p=>sealedDecision(p).key==="buy");
  const buy=$("#sealedBuyNow");if(buy)buy.innerHTML='<div class="investmentProfile"><div><b>Perfil sellado</b><span>Rango y beneficio absoluto mínimo. Se guarda localmente.</span></div><div class="investmentInputs"><label>Mínimo €<input id="sealedMin" type="number" min="0" step="5" value="'+num(policy.minPriceEUR)+'"></label><label>Máximo €<input id="sealedMax" type="number" min="0" step="10" value="'+num(policy.maxPriceEUR)+'"></label><label>Potencial mínimo €<input id="sealedUpside" type="number" min="0" step="10" value="'+num(policy.minUpsideEUR)+'"></label></div><small>“Compra ya” exige además evidencia ≥80/100, liquidez no baja y riesgo de reedición no alto.</small></div>'+
    '<div class="sectionHead"><h3>Compra ya</h3></div>'+(best?productCard(best,1):'<div class="empty">NO COMPRAR: no hay ahora mismo ningún producto registrado que supere todos los filtros con evidencia suficiente.</div>');
  const top=$("#sealedTop10");if(top)top.innerHTML=ranked.length?ranked.slice(0,10).map((p,i)=>productCard(p,i+1)).join(""):'<div class="empty">Añade productos con precio y evidencia real para construir el Top 10.</div>';
  const list=$("#sealedList");if(list)list.innerHTML=rows.length?rows.map(p=>productCard(p)).join(""):'<div class="empty">No hay productos que coincidan con el filtro.</div>';
  bindSealedActions();
}
function bindSealedActions(){
  document.querySelectorAll("[data-edit-sealed]").forEach(b=>b.onclick=()=>openSealed(b.dataset.editSealed));
  ["sealedMin","sealedMax","sealedUpside"].forEach(id=>{const el=$("#"+id);if(el)el.onchange=()=>{state.sealedPolicy.minPriceEUR=num($("#sealedMin")?.value);state.sealedPolicy.maxPriceEUR=num($("#sealedMax")?.value);state.sealedPolicy.minUpsideEUR=num($("#sealedUpside")?.value);save();renderSealed();renderRebalance();}});
}
function openSealed(id){
  sealedEditId=id||null;const dlg=$("#sealedDialog"),form=$("#sealedForm"),del=$("#sealedDelete");form.reset();
  const p=state.sealedProducts.find(x=>x.id===id);
  if(p)for(const [k,v] of Object.entries(p)){const el=form.elements.namedItem(k);if(el&&v!=null)el.value=v}
  del.classList.toggle("hidden",!p);dlg.showModal();
}
function saveSealed(e){
  e.preventDefault();const f=new FormData($("#sealedForm")),id=sealedEditId||crypto.randomUUID(),old=state.sealedProducts.find(x=>x.id===id)||{};
  const p={...old,id,universe:f.get("universe")==="lorcana"?"lorcana":"pokemon",name:String(f.get("name")||"").trim(),set:String(f.get("set")||"").trim(),productType:String(f.get("productType")||"Otro"),releaseDate:String(f.get("releaseDate")||""),msrp:num(f.get("msrp")),currentPrice:num(f.get("currentPrice")),shipping:num(f.get("shipping")),recentLow:num(f.get("recentLow")),averagePrice:num(f.get("averagePrice")),targetLow:num(f.get("targetLow")),targetBase:num(f.get("targetBase")),targetHigh:num(f.get("targetHigh")),availability:String(f.get("availability")||"unknown"),printStatus:String(f.get("printStatus")||"unknown"),liquidity:String(f.get("liquidity")||""),reprintRisk:String(f.get("reprintRisk")||""),trend30:f.get("trend30")===""?"":num(f.get("trend30")),trend90:f.get("trend90")===""?"":num(f.get("trend90")),photoUrl:String(f.get("photoUrl")||"").trim(),sourceUrl:String(f.get("sourceUrl")||"").trim(),buyUrl:String(f.get("buyUrl")||"").trim(),seller:String(f.get("seller")||"").trim(),notes:String(f.get("notes")||"").trim(),updatedAt:new Date().toISOString()};
  if(!p.name||!p.currentPrice||!p.sourceUrl||!p.buyUrl){alert("Nombre, precio actual, fuente y enlace de compra son obligatorios.");return}
  if(sealedEditId)state.sealedProducts=state.sealedProducts.map(x=>x.id===id?p:x);else state.sealedProducts.push(p);
  recordSealedSnapshot(p);save();$("#sealedDialog").close();sealedEditId=null;renderSealed();renderRebalance();
}
function deleteSealed(){
  if(!sealedEditId||!confirm("¿Eliminar este producto sellado?"))return;
  state.sealedProducts=state.sealedProducts.filter(x=>x.id!==sealedEditId);delete state.sealedSnapshots[sealedEditId];save();$("#sealedDialog").close();sealedEditId=null;renderSealed();renderRebalance();
}
function renderRebalance(){
  const cards=state.cards||[],totalVal=cards.reduce((s,c)=>s+num(c.value)*Math.max(1,num(c.quantity)||1),0);
  const released=cards.filter(c=>["sell","reinvest"].includes(c.purpose)).reduce((s,c)=>s+num(c.value)*Math.max(1,num(c.quantity)||1),0);
  const personal=cards.filter(c=>["no_sell","personal"].includes(c.purpose)).reduce((s,c)=>s+num(c.value)*Math.max(1,num(c.quantity)||1),0);
  const invest=cards.filter(c=>["investment","psa","sell","reinvest"].includes(c.purpose)).reduce((s,c)=>s+num(c.value)*Math.max(1,num(c.quantity)||1),0);
  const stats=$("#rebalanceSummary");if(stats)stats.innerHTML='<div><span>Valor cartas</span><b>'+euro(totalVal)+'</b></div><div><span>Capital inversión</span><b>'+euro(invest)+'</b></div><div><span>Protegido/personal</span><b>'+euro(personal)+'</b></div><div><span>Capital liberable</span><b>'+euro(released)+'</b></div>';
  const warnings=[];
  for(const c of cards){
    const v=num(c.value)*Math.max(1,num(c.quantity)||1),share=totalVal>0?v/totalVal*100:0;
    if(share>=35&&!["no_sell","personal"].includes(c.purpose))warnings.push(esc(c.name)+' concentra '+share.toFixed(1)+'% del valor de cartas. Revisar concentración; no implica vender automáticamente.');
  }
  const w=$("#rebalanceWarnings");if(w)w.innerHTML=warnings.length?warnings.map(x=>'<div class="rebalanceAlert">'+x+'</div>').join(""):'<div class="empty">No se detecta ninguna posición de inversión por encima del 35% del valor total.</div>';
  const list=$("#rebalanceList");if(list)list.innerHTML=cards.length?cards.slice().sort((a,b)=>num(b.value)-num(a.value)).map(c=>{
    const v=num(c.value)*Math.max(1,num(c.quantity)||1),share=totalVal>0?v/totalVal*100:0,purpose=c.purpose||"investment";
    let action=purpose==="no_sell"||purpose==="personal"?"Mantener fuera del rebalanceo":purpose==="sell"?"Preparar para venta":purpose==="reinvest"?"Liberar capital para reinvertir":purpose==="psa"?"Evaluar en Pregrado PSA":"Mantener / revisar con evidencia de mercado";
    return '<div class="rebalanceCard"><div><b>'+esc(c.name)+'</b><div class="meta">'+euro(v)+' · '+share.toFixed(1)+'% cartera · '+action+'</div><div class="allocationBar"><i style="width:'+Math.min(100,share)+'%"></i></div></div><select data-purpose="'+esc(c.id)+'">'+purposeOptions+'</select></div>';
  }).join(""):'<div class="empty">No hay cartas en la colección.</div>';
  document.querySelectorAll("[data-purpose]").forEach(sel=>{const c=cards.find(x=>x.id===sel.dataset.purpose);if(c)sel.value=c.purpose||"investment";sel.onchange=()=>{const x=cards.find(c=>c.id===sel.dataset.purpose);if(x){x.purpose=sel.value;save();renderRebalance()}}});
  const plan=$("#reinvestPlan"),buys=rankedProducts().filter(p=>sealedDecision(p).key==="buy").slice(0,3);
  if(plan)plan.innerHTML='<h3>Plan de reinversión</h3><div class="qaRow"><span>Capital marcado para vender/reinvertir</span><b>'+euro(released)+'</b></div>'+
    (released<=0?'<small>Marca posiciones “Para vender” o “Para reinvertir” para calcular capital liberable.</small>':buys.length?'<small>Hay '+buys.length+' candidato(s) sellado(s) que superan tus filtros actuales. Compáralos también con el Top 10 de cartas antes de reasignar capital.</small>':'<small>No hay compra sellada que supere todos los filtros actuales. Mantén el capital sin reasignar hasta tener evidencia suficiente.</small>');
}
function sealedSourceGuide(){
  const box=$("#sealedSourceGuide");if(!box)return;
  box.innerHTML='<h3>Fuentes de datos · sellado</h3>'+
  '<div class="qaRow"><span>Cardmarket</span><b class="ok">Prioridad EUR</b></div><small>Usa la URL exacta del producto/listado cuando sea verificable. Card Vault conserva precio + fuente + fecha en cada snapshot.</small>'+
  '<div class="qaRow"><span>Pokémon TCG API sellado</span><b class="warn">Opcional</b></div><small>Existe catálogo/API de booster boxes, ETB, tins, blísteres y colecciones, pero requiere clave. No se activa ni genera coste automáticamente.</small>'+
  '<div class="qaRow"><span>Lorcana</span><b class="warn">Evidencia por producto</b></div><small>No se rellena histórico sintético. Guarda fuentes reales por booster box, trove, gift set, D23 u otro producto.</small>'+
  '<div class="qaRow"><span>Histórico propio</span><b class="ok">Activo</b></div><small>Cada actualización de precio con fuente crea un snapshot diario local; así 7d/30d/90d pasan a ser medibles sin inventar datos.</small>';
}
function exportSealed(){
  const blob=new Blob([JSON.stringify({format:"cardvault-sealed-v1",createdAt:new Date().toISOString(),policy:state.sealedPolicy,products:state.sealedProducts},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="card-vault-sellado-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function augmentBenchmark(){
  const old=typeof renderExcellenceBenchmark==="function"?renderExcellenceBenchmark:null;
  if(!old||old.__v69)return;
  const wrapped=function(){old();const box=$("#excellenceBenchmark");if(box&&!box.querySelector('[data-v69-bench]'))box.insertAdjacentHTML("beforeend",'<div data-v69-bench><div class="benchRow"><b>Productos sellados Pokémon + Lorcana</b><span class="ok">Sí</span><small>Portfolio, filtros, Top 10, Compra ya y evidencia enlazada V69</small></div><div class="benchRow"><b>Rebalanceo por objetivo de posición</b><span class="ok">Sí</span><small>NO vender · personal · inversión · PSA · vender · reinvertir</small></div><div class="benchRow"><b>Histórico externo profundo de sellado</b><span class="warn">Parcial</span><small>La app no inventa históricos: depende de fuentes verificadas añadidas o integraciones futuras.</small></div></div>');};
  wrapped.__v69=true;renderExcellenceBenchmark=wrapped;
}
augmentBenchmark();
$("#sealedAdd").onclick=()=>openSealed();
$("#sealedCancel").onclick=()=>$("#sealedDialog").close();
$("#sealedSave").onclick=saveSealed;
$("#sealedDelete").onclick=deleteSealed;
$("#sealedExport").onclick=exportSealed;
["sealedUniverse","sealedDecision"].forEach(id=>$("#"+id).onchange=renderSealed);
$("#sealedSearch").oninput=renderSealed;
document.querySelectorAll('nav button[data-tab="sealed"],nav button[data-tab="rebalance"]').forEach(b=>b.addEventListener("click",()=>{renderSealed();renderRebalance()}));
const sealedSection=$("#sealed");if(sealedSection&&!$("#sealedSourceGuide"))sealedSection.insertAdjacentHTML("beforeend",'<div id="sealedSourceGuide" class="qaPanel"></div>');
sealedSourceGuide();renderSealed();renderRebalance();
try{renderExcellenceBenchmark()}catch{}
})();