(()=>{
const $=s=>document.querySelector(s), num=v=>Number(v)||0, eur=v=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(num(v));
if(!Array.isArray(state.investmentLedger))state.investmentLedger=[];
function assetOptions(){
 const out=['<option value="">Sin vincular</option>'];
 (state.cards||[]).forEach(c=>out.push('<option value="card:'+esc(c.id)+'">Carta · '+esc(c.name)+'</option>'));
 (state.sealedProducts||[]).forEach(p=>out.push('<option value="sealed:'+esc(p.id)+'">Sellado · '+esc(p.name)+'</option>'));
 return out.join("");
}
function assetLedger(key){return state.investmentLedger.filter(r=>r.assetKey===key)}
function assetAccounting(key,currentUnitValue=0){
 const rows=assetLedger(key).slice().sort((a,b)=>(a.date||"").localeCompare(b.date||"")),lots=[];let realized=0,extra=0,soldNet=0;
 for(const r of rows){
  const q=num(r.qty||1),unit=num(r.unitPrice),ship=num(r.shipping),fees=num(r.fees);
  if(r.type==="buy"){lots.push({qty:q,unitCost:(unit*q+ship+fees)/q});continue}
  if(r.type==="sell"){
   let need=q,cost=0;
   while(need>0&&lots.length){const lot=lots[0],take=Math.min(need,lot.qty);cost+=take*lot.unitCost;lot.qty-=take;need-=take;if(lot.qty<=1e-9)lots.shift()}
   const proceeds=unit*q-ship-fees;soldNet+=proceeds;realized+=proceeds-cost;
  } else if(r.type==="grading"||r.type==="fee") extra+=unit*q+ship+fees;
 }
 const held=lots.reduce((a,l)=>a+l.qty,0),basis=lots.reduce((a,l)=>a+l.qty*l.unitCost,0)+extra,current=held*num(currentUnitValue),latent=current-basis;
 return {held,basis,avgCost:held?basis/held:0,current,latent,realized,soldNet};
}
let editId=null;
function total(r){const gross=num(r.unitPrice)*num(r.qty||1);return gross+num(r.shipping)+num(r.fees)}
function integrity(){
 const issues=[];
 const keys=[...new Set(state.investmentLedger.map(r=>r.assetKey).filter(Boolean))];
 for(const key of keys){let held=0;for(const r of state.investmentLedger.filter(x=>x.assetKey===key).sort((a,b)=>(a.date||"").localeCompare(b.date||""))){if(r.type==="buy")held+=num(r.qty||1);if(r.type==="sell"){held-=num(r.qty||1);if(held<-1e-9){issues.push("Venta supera unidades compradas: "+r.name);held=0}}}}
 for(const r of state.investmentLedger){if(!r.name||!r.date||num(r.qty)<=0)issues.push("Operación incompleta: "+(r.name||r.id));if(r.type==="sell"&&!r.assetKey)issues.push("Venta sin posición vinculada: "+r.name)}
 return [...new Set(issues)];
}
function stats(){
 const rows=state.investmentLedger, buys=rows.filter(r=>r.type==="buy").reduce((a,r)=>a+total(r),0),
 sales=rows.filter(r=>r.type==="sell").reduce((a,r)=>a+(num(r.unitPrice)*num(r.qty||1)-num(r.shipping)-num(r.fees)),0),
 costs=rows.filter(r=>r.type==="grading"||r.type==="fee").reduce((a,r)=>a+total(r),0);
 return {buys,sales,costs,netCash:sales-buys-costs};
}
function render(){
 const box=$("#ledgerSummary"),list=$("#ledgerList");if(!box||!list)return;const x=stats();
 const issues=integrity();
 box.innerHTML='<div class="stat"><b>'+eur(x.buys)+'</b><span>Compras registradas</span></div><div class="stat"><b>'+eur(x.sales)+'</b><span>Ventas netas</span></div><div class="stat"><b>'+eur(x.costs)+'</b><span>Graduación/costes</span></div><div class="stat"><b>'+eur(x.netCash)+'</b><span>Flujo neto realizado</span></div><div class="stat"><b>'+issues.length+'</b><span>Alertas contables</span></div>';
 const rows=[...state.investmentLedger].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 list.innerHTML=rows.length?rows.map(r=>'<article class="sealedCard"><div class="sealedMain"><div><span class="pill">'+({buy:"Compra",sell:"Venta",grading:"Graduación",fee:"Coste"}[r.type]||r.type)+'</span><h4>'+esc(r.name)+'</h4><small>'+esc(r.date||"")+" · "+esc(r.assetType||"")+'</small></div><div class="sealedNumbers"><b>'+eur(num(r.unitPrice)*num(r.qty||1))+'</b><span>cant. '+num(r.qty||1)+'</span></div></div><div class="microNote">Envío '+eur(r.shipping)+' · Comisiones '+eur(r.fees)+(r.notes?" · "+esc(r.notes):"")+'</div><div class="sealedActions">'+(r.sourceUrl?'<a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener">Evidencia</a>':"")+'<button data-ledger-edit="'+esc(r.id)+'">Editar</button></div></article>').join(""):'<div class="emptyState"><b>Aún no hay operaciones.</b><span>Registra compras y ventas reales para medir resultados realizados.</span></div>';
 document.querySelectorAll("[data-ledger-edit]").forEach(b=>b.onclick=()=>open(b.dataset.ledgerEdit));
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function open(id){
 editId=id||null;const r=state.investmentLedger.find(x=>x.id===id)||{};
 $("#ledgerDialogTitle").textContent=id?"Editar operación":"Registrar operación";$("#ledgerAssetKey").innerHTML=assetOptions();$("#ledgerAssetKey").value=r.assetKey||"";$("#ledgerType").value=r.type||"buy";$("#ledgerAssetType").value=r.assetType||"card";$("#ledgerName").value=r.name||"";$("#ledgerDate").value=r.date||new Date().toISOString().slice(0,10);$("#ledgerQty").value=r.qty||1;$("#ledgerUnitPrice").value=r.unitPrice??"";$("#ledgerShipping").value=r.shipping||0;$("#ledgerFees").value=r.fees||0;$("#ledgerSource").value=r.sourceUrl||"";$("#ledgerNotes").value=r.notes||"";$("#ledgerDelete").classList.toggle("hidden",!id);$("#ledgerDialog").showModal();
}
$("#ledgerAdd")?.addEventListener("click",()=>open());$("#ledgerCancel")?.addEventListener("click",()=>$("#ledgerDialog").close());
$("#ledgerForm")?.addEventListener("submit",e=>{e.preventDefault();const r={id:editId||crypto.randomUUID(),type:$("#ledgerType").value,assetType:$("#ledgerAssetType").value,assetKey:$("#ledgerAssetKey").value,name:$("#ledgerName").value.trim(),date:$("#ledgerDate").value,qty:num($("#ledgerQty").value),unitPrice:num($("#ledgerUnitPrice").value),shipping:num($("#ledgerShipping").value),fees:num($("#ledgerFees").value),sourceUrl:$("#ledgerSource").value.trim(),notes:$("#ledgerNotes").value.trim(),updatedAt:new Date().toISOString()};if(!r.name||!r.date||r.qty<=0||r.unitPrice<0)return;if(editId)state.investmentLedger=state.investmentLedger.map(x=>x.id===editId?r:x);else state.investmentLedger.push(r);save();$("#ledgerDialog").close();render();try{renderRebalance()}catch{}});
$("#ledgerDelete")?.addEventListener("click",()=>{if(!editId)return;state.investmentLedger=state.investmentLedger.filter(x=>x.id!==editId);save();$("#ledgerDialog").close();render();try{renderRebalance()}catch{}});
render();
window.renderInvestmentLedger=render;window.investmentLedgerStats=stats;window.assetAccounting=assetAccounting;window.investmentLedgerIntegrity=integrity;
})();