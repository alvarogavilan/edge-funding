(()=>{
const $=s=>document.querySelector(s), num=v=>Number(v)||0, eur=v=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(num(v));
if(!Array.isArray(state.investmentLedger))state.investmentLedger=[];
let editId=null;
function total(r){const gross=num(r.unitPrice)*num(r.qty||1);return gross+num(r.shipping)+num(r.fees)}
function signed(r){const t=total(r);return r.type==="sell"?t*-1:t}
function stats(){
 const rows=state.investmentLedger, buys=rows.filter(r=>r.type==="buy").reduce((a,r)=>a+total(r),0),
 sales=rows.filter(r=>r.type==="sell").reduce((a,r)=>a+(num(r.unitPrice)*num(r.qty||1)-num(r.shipping)-num(r.fees)),0),
 costs=rows.filter(r=>r.type==="grading"||r.type==="fee").reduce((a,r)=>a+total(r),0);
 return {buys,sales,costs,netCash:sales-buys-costs};
}
function render(){
 const box=$("#ledgerSummary"),list=$("#ledgerList");if(!box||!list)return;const x=stats();
 box.innerHTML='<div class="stat"><b>'+eur(x.buys)+'</b><span>Compras registradas</span></div><div class="stat"><b>'+eur(x.sales)+'</b><span>Ventas netas</span></div><div class="stat"><b>'+eur(x.costs)+'</b><span>Graduación/costes</span></div><div class="stat"><b>'+eur(x.netCash)+'</b><span>Flujo neto realizado</span></div>';
 const rows=[...state.investmentLedger].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 list.innerHTML=rows.length?rows.map(r=>'<article class="sealedCard"><div class="sealedMain"><div><span class="pill">'+({buy:"Compra",sell:"Venta",grading:"Graduación",fee:"Coste"}[r.type]||r.type)+'</span><h4>'+esc(r.name)+'</h4><small>'+esc(r.date||"")+" · "+esc(r.assetType||"")+'</small></div><div class="sealedNumbers"><b>'+eur(num(r.unitPrice)*num(r.qty||1))+'</b><span>cant. '+num(r.qty||1)+'</span></div></div><div class="microNote">Envío '+eur(r.shipping)+' · Comisiones '+eur(r.fees)+(r.notes?" · "+esc(r.notes):"")+'</div><div class="sealedActions">'+(r.sourceUrl?'<a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener">Evidencia</a>':"")+'<button data-ledger-edit="'+esc(r.id)+'">Editar</button></div></article>').join(""):'<div class="emptyState"><b>Aún no hay operaciones.</b><span>Registra compras y ventas reales para medir resultados realizados.</span></div>';
 document.querySelectorAll("[data-ledger-edit]").forEach(b=>b.onclick=()=>open(b.dataset.ledgerEdit));
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function open(id){
 editId=id||null;const r=state.investmentLedger.find(x=>x.id===id)||{};
 $("#ledgerDialogTitle").textContent=id?"Editar operación":"Registrar operación";$("#ledgerType").value=r.type||"buy";$("#ledgerAssetType").value=r.assetType||"card";$("#ledgerName").value=r.name||"";$("#ledgerDate").value=r.date||new Date().toISOString().slice(0,10);$("#ledgerQty").value=r.qty||1;$("#ledgerUnitPrice").value=r.unitPrice??"";$("#ledgerShipping").value=r.shipping||0;$("#ledgerFees").value=r.fees||0;$("#ledgerSource").value=r.sourceUrl||"";$("#ledgerNotes").value=r.notes||"";$("#ledgerDelete").classList.toggle("hidden",!id);$("#ledgerDialog").showModal();
}
$("#ledgerAdd")?.addEventListener("click",()=>open());$("#ledgerCancel")?.addEventListener("click",()=>$("#ledgerDialog").close());
$("#ledgerForm")?.addEventListener("submit",e=>{e.preventDefault();const r={id:editId||crypto.randomUUID(),type:$("#ledgerType").value,assetType:$("#ledgerAssetType").value,name:$("#ledgerName").value.trim(),date:$("#ledgerDate").value,qty:num($("#ledgerQty").value),unitPrice:num($("#ledgerUnitPrice").value),shipping:num($("#ledgerShipping").value),fees:num($("#ledgerFees").value),sourceUrl:$("#ledgerSource").value.trim(),notes:$("#ledgerNotes").value.trim(),updatedAt:new Date().toISOString()};if(!r.name||!r.date||r.qty<=0||r.unitPrice<0)return;if(editId)state.investmentLedger=state.investmentLedger.map(x=>x.id===editId?r:x);else state.investmentLedger.push(r);save();$("#ledgerDialog").close();render();try{renderRebalance()}catch{}});
$("#ledgerDelete")?.addEventListener("click",()=>{if(!editId)return;state.investmentLedger=state.investmentLedger.filter(x=>x.id!==editId);save();$("#ledgerDialog").close();render();try{renderRebalance()}catch{}});
render();
window.renderInvestmentLedger=render;window.investmentLedgerStats=stats;
})();