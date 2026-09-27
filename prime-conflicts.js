(()=>{"use strict";
/* V84.8 · Guardia de duplicados / conflictos.
   Detecta: misma carta añadida varias veces, mismo cert repetido, mismo pedido de venta repetido,
   misma compra registrada varias veces, BUY-ONE comprada dos veces y BUY-SCALE por encima del máximo.
   Nunca borra nada. Muestra el conflicto y bloquea las acciones peligrosas (comprar / vender). */
const N=v=>Number(v)||0;
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const norm=v=>String(v??"").trim().toLowerCase();
function group(arr,keyFn){const g=new Map();for(const x of arr){const k=keyFn(x);if(!k)continue;if(!g.has(k))g.set(k,[]);g.get(k).push(x)}return [...g.entries()].filter(([,v])=>v.length>1)}
function maxUnitsFor(x){
 const ps=window.CVManualOpportunities?.positionSizing?.(x);
 if(!ps)return x.approval==="BUY-SCALE"?1:(x.approval==="BUY-ONE"?1:0);
 if(!ps.passes)return 0;
 if(x.approval==="BUY-ONE")return 1;
 if(x.approval==="BUY-SCALE")return Math.max(1,Math.min(ps.maxUnits,N(x.sellerQty)||1));
 return ps.maxUnits;
}
function detect(){
 const out=[],cards=state.cards||[],active=cards.filter(c=>!c.archivedSold),key=c=>window.CVIdentity?.key?.(c)||"";
 for(const [k,arr] of group(active,c=>{const gr=String(c.grading||"RAW").toUpperCase();return gr!=="RAW"&&c.cert?"":key(c)}))
  out.push({kind:"duplicate-card",level:"mid",priority:92,name:arr[0].name,text:arr.length+" fichas con la misma identidad exacta · revisar si es duplicado accidental o unidades reales",ids:arr.map(c=>c.id),key:k});
 for(const [cert,arr] of group(cards.filter(c=>String(c.grading||"RAW").toUpperCase()!=="RAW"),c=>norm(c.cert)))
  out.push({kind:"duplicate-cert",level:"high",priority:99,name:arr[0].name,text:"Certificado "+cert+" repetido en "+arr.length+" fichas"+(arr.some(c=>c.archivedSold)&&arr.some(c=>!c.archivedSold)?" · uno vendido y otro activo":""),ids:arr.map(c=>c.id),cert});
 for(const [order,arr] of group(state.saleHistory||[],h=>norm(h.saleOrder)))
  out.push({kind:"duplicate-sale-order",level:"high",priority:99,name:arr[0].name,text:"Pedido de venta #"+order+" registrado "+arr.length+" veces",ids:arr.map(h=>h.id),order});
 const buys=(state.investmentLedger||[]).filter(r=>r.type==="buy");
 for(const [k,arr] of group(buys,r=>r.sourceUrl?[norm(r.sourceUrl),N(r.unitPrice).toFixed(2),r.assetType||""].join("|"):""))
  out.push({kind:"duplicate-purchase",level:"mid",priority:93,name:arr[0].name,text:"Misma oferta (URL + precio) registrada "+arr.length+" veces · "+arr.map(r=>r.date).join(", "),ids:arr.map(r=>r.id)});
 const byOpp=group(cards.filter(c=>c.purchaseThesis?.opportunityId),c=>c.purchaseThesis.opportunityId);
 for(const [opp,arr] of byOpp){
  const one=arr.some(c=>c.purchaseThesis?.approval==="BUY-ONE");
  if(one)out.push({kind:"buy-one-twice",level:"high",priority:99,name:arr[0].name,text:"Oportunidad BUY-ONE comprada "+arr.length+" veces",ids:arr.map(c=>c.id),opp});
 }
 for(const x of state.manualOpportunities||[]){
  const bought=N(x.purchasedQty);if(!(bought>0))continue;
  const approval=x.prePrimeApproval||x.preSupplyApproval||x.approval;
  const cap=approval==="BUY-ONE"||x.approval==="PURCHASED"?1:(approval==="BUY-SCALE"?Math.max(1,maxUnitsFor({...x,approval:"BUY-SCALE"})):null);
  if(cap!=null&&bought>cap)out.push({kind:"over-max",level:"high",priority:99,name:x.name,text:"Compradas "+bought+" unidades · máximo autorizado "+cap,ids:[x.id],opp:x.id});
 }
 return out.sort((a,b)=>b.priority-a.priority);
}
function saleOrderTaken(order,exceptId){
 const o=norm(order);if(!o)return null;
 return (state.saleHistory||[]).find(h=>norm(h.saleOrder)===o&&h.id!==exceptId)||null;
}
/* Llamado desde la ejecución de compra: devuelve {block,reason,maxQty} */
function purchaseCheck(key){
 const [kind,id]=String(key||"").split(":");
 if(kind!=="manual")return {block:false,maxQty:null};
 const x=(state.manualOpportunities||[]).find(o=>o.id===id);if(!x)return {block:false,maxQty:null};
 const bought=N(x.purchasedQty),cap=maxUnitsFor(x),left=Math.max(0,cap-bought);
 if(x.approval==="PURCHASED"||(x.approval==="BUY-ONE"&&bought>=1))return {block:true,reason:"Esta oportunidad BUY-ONE ya está comprada. No se registra una segunda compra.",maxQty:0};
 if(cap>0&&left<=0)return {block:true,reason:"Ya compraste "+bought+" unidad(es): máximo autorizado "+cap+".",maxQty:0};
 const dupe=(state.investmentLedger||[]).find(r=>r.type==="buy"&&r.sourceUrl&&norm(r.sourceUrl)===norm(x.url)&&Math.abs(N(r.unitPrice)-N(x.price))<.01);
 return {block:false,maxQty:cap>0?left:null,warn:dupe?"Ya existe una compra registrada con esta misma URL y precio ("+dupe.date+").":""};
}
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 const rows=detect();let box=document.querySelector("#primeConflicts");
 if(!rows.length){box?.remove();return}
 if(!box){box=document.createElement("section");box.id="primeConflicts";box.className="qaPanel";host.prepend(box)}
 box.innerHTML='<b>Conflictos PRIME · '+rows.length+'</b>'+rows.slice(0,8).map(r=>'<div class="qaRow"><span>'+E(r.name)+'<small> · '+E(r.text)+'</small></span><b>'+(r.level==="high"?"BLOQUEA":"REVISAR")+'</b></div>').join("")+
  '<small>No se borra nada automáticamente. Mientras exista un conflicto alto se bloquean nuevas compras/ventas sobre esos registros.</small>';
}
function blockedIds(){const s=new Set();for(const r of detect())if(r.level==="high")for(const id of r.ids||[])s.add(id);return s}
/* Bloqueo en fase de captura: antes de que otros módulos ejecuten la acción. */
document.addEventListener("click",e=>{
 const buy=e.target.closest("[data-cv-bought]");
 if(buy){
  const chk=purchaseCheck(buy.dataset.cvBought);
  if(chk.block){e.preventDefault();e.stopImmediatePropagation();alert("Compra bloqueada por Conflict Guard: "+chk.reason);return}
  if(chk.warn&&!confirm(chk.warn+"\n¿Es una compra NUEVA y distinta?")){e.preventDefault();e.stopImmediatePropagation();return}
  return;
 }
 const sell=e.target.closest("[data-cv-sell],[data-sale-sold]");
 if(sell){
  let cardId=sell.dataset.cvSell;
  if(!cardId){const l=(state.saleListings||[]).find(x=>x.id===sell.dataset.saleSold);cardId=l?.cardId}
  const c=(state.cards||[]).find(x=>x.id===cardId);
  if(c?.archivedSold){e.preventDefault();e.stopImmediatePropagation();alert("Esta carta ya figura como vendida. No se registra otra venta.");return}
  if(cardId&&blockedIds().has(cardId)){e.preventDefault();e.stopImmediatePropagation();alert("Venta bloqueada: la carta tiene un conflicto alto (cert/pedido duplicado). Revísalo en Conflictos PRIME.");}
 }
},true);
setTimeout(render,260);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
window.CVConflictGuard={detect,purchaseCheck,saleOrderTaken,maxUnitsFor,render};
})();
