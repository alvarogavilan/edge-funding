(()=>{"use strict";
const Q=s=>document.querySelector(s),N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
state.saleHistory=Array.isArray(state.saleHistory)?state.saleHistory:[];

function ensureEeveeArchive(){
 const card=(state.cards||[]).find(c=>c.id==="eev174");
 const ledger=(state.investmentLedger||[]).find(r=>r.id==="sale-cardmarket-1304093225");
 if(!card||!card.archivedSold)return;
 if(!state.saleHistory.some(h=>h.cardId==="eev174"||h.id==="sale-cardmarket-1304093225")){
  state.saleHistory.push({
   id:"sale-cardmarket-1304093225",cardId:"eev174",name:card.name||"Eevee ex #174",set:card.set||"SVP Promo · 2025",
   number:"SVP174",language:card.language||"",grading:"PSA",grade:String(card.grade||9),cert:card.cert||"136142568",
   qty:1,unitPrice:60,shipping:0,fees:0,net:60,soldAt:"2026-09-27",channel:"Cardmarket",saleOrder:"1304093225",
   fulfillmentStatus:ledger?.fulfillmentStatus||"sold-awaiting-shipment",purchase:null,basisUnknown:true,
   acquisitionSource:card.acquisitionSource||"Prismatic Evolutions Super-Premium Collection",
   parentProductCostEUR:card.parentProductCostEUR||120,parentProductCostApprox:true,
   acquisitionType:card.acquisitionType||"included-promo",
   acquisitionNotes:card.acquisitionNotes||"Promo incluida en la Super-Premium Collection de Evoluciones Prismáticas (~120 € el producto completo). Coste individual no asignado.",
   referenceImage:card.referenceImage||"https://images.pokemontcg.io/svp/174_hires.png",
   marketUrl:"https://www.cardmarket.com/es/Pokemon/Products/Singles/SV-Black-Star-Promos/Eevee-ex-SVP174",rawMarketSnapshot:{checkedAt:"2026-09-27",trend:16.56,avg30:18.78,avg7:20.37,avg1:17.24,currency:"EUR",scope:"RAW only · no comparable directamente con PSA 9"},
   archiveNotes:"Venta real Cardmarket. No se calcula ROI porque el coste individual de esta carta no fue asignado dentro del producto completo."
  });
  save();
 }
}
function workflowLabel(h){
 const r=(state.investmentLedger||[]).find(x=>x.id===h.id),v=String(r?.fulfillmentStatus||h.fulfillmentStatus||"");
 if(["paid","paid-confirmed","completed","settled"].includes(v))return "COBRADA";
 if(v==="sold-awaiting-shipment")return "VENDIDA · ENVÍO PENDIENTE";
 if(v==="sold-awaiting-payment")return "VENDIDA · COBRO PENDIENTE";
 return v?String(v).toUpperCase():"VENDIDA";
}
function holdDays(h,c={}){
 const a=h.purchaseDate||c.purchaseDate||"",b=h.soldAt||"";
 if(!a||!b)return null;
 const d=(new Date(b+"T00:00:00Z")-new Date(a+"T00:00:00Z"))/86400000;
 return Number.isFinite(d)&&d>=0?Math.round(d):null;
}
function paymentStatus(h){
 const r=(state.investmentLedger||[]).find(x=>x.id===h.id);
 const s=String(r?.fulfillmentStatus||h.fulfillmentStatus||"");
 return ["paid","paid-confirmed","completed","settled"].includes(s)?"COBRADA":"PENDIENTE";
}
function cardFor(h){return (state.cards||[]).find(c=>c.id===h.cardId)||null}
function records(){
 ensureEeveeArchive();
 return [...state.saleHistory].map(h=>{
  const c=cardFor(h)||{},ledger=(state.investmentLedger||[]).find(r=>r.id===h.id);
  const purchase=h.purchase??c.purchase??null,basis=purchase==null?null:N(purchase)*N(h.qty||1),net=N(h.net)||N(h.unitPrice)*N(h.qty||1)-N(h.shipping)-N(h.fees);
  return {...c,...h,cert:h.cert||c.cert||"",referenceImage:h.referenceImage||c.referenceImage||"",purchase,basis,net,
    result:basis==null?null:net-basis,payment:paymentStatus(h),workflow:workflowLabel(h),heldDays:holdDays(h,c),ledgerStatus:ledger?.fulfillmentStatus||h.fulfillmentStatus||""};
 }).sort((a,b)=>(b.soldAt||"").localeCompare(a.soldAt||""));
}
function summary(rows){
 const gross=rows.reduce((a,x)=>a+N(x.unitPrice)*N(x.qty||1),0),net=rows.reduce((a,x)=>a+N(x.net),0);
 const known=rows.filter(x=>x.result!=null),pnl=known.reduce((a,x)=>a+N(x.result),0),pending=rows.filter(x=>x.payment!=="COBRADA").reduce((a,x)=>a+N(x.net),0);
 const psa=rows.filter(x=>String(x.grading||"").toUpperCase()==="PSA").length,raw=rows.filter(x=>String(x.grading||"RAW").toUpperCase()==="RAW").length;
 const pokemon=rows.filter(x=>String(x.universe||"pokemon").toLowerCase()==="pokemon").length,lorcana=rows.filter(x=>String(x.universe||"").toLowerCase()==="lorcana").length;
 const best=rows.slice().sort((a,b)=>N(b.unitPrice)-N(a.unitPrice))[0]||null;
 return {count:rows.reduce((a,x)=>a+N(x.qty||1),0),records:rows.length,gross,net,known:known.length,pnl,pending,psa,raw,pokemon,lorcana,best};
}
function csv(rows){
 const cols=["Fecha venta","Nombre","Set","Número","Idioma","Graduación","Nota","Certificado","Cantidad","Precio unidad","Neto","Coste unidad","Resultado","Canal","Pedido","Cobro","Procedencia","URL mercado"];
 const quote=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
 const lines=[cols.map(quote).join(",")];
 for(const x of rows)lines.push([
  x.soldAt,x.name,x.set,x.number,x.language,x.grading,x.grade,x.cert,x.qty,x.unitPrice,x.net,x.purchase,x.result,x.channel,x.saleOrder,x.payment,x.acquisitionSource,x.marketUrl
 ].map(quote).join(","));
 return "\uFEFF"+lines.join("\n");
}
function exportCsv(){
 const rows=records(),blob=new Blob([csv(rows)],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download="card-vault-archivo-vendidos.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function watchAgain(id){
 const x=records().find(r=>r.id===id);if(!x)return;
 state.watch=Array.isArray(state.watch)?state.watch:[];
 if(!state.watch.some(w=>w.archiveId===id))state.watch.push({name:x.name,target:0,archiveId:id,source:"Archivo de vendidos",set:x.set||"",number:x.number||"",language:x.language||"",grading:x.grading||"",grade:x.grade||""});
 save();render();try{window.CVRenderCollection?.()}catch{}
 alert("Añadida a Seguimiento. Card Vault volverá a vigilar esta carta.");
}
function render(){
 const box=Q("#archiveList"),sum=Q("#archiveSummary");if(!box||!sum)return;
 const rows=records(),s=summary(rows);
 sum.innerHTML='<div><span>Cartas vendidas</span><b>'+s.count+'</b></div><div><span>Ventas archivadas</span><b>'+s.records+'</b></div><div><span>Bruto histórico</span><b>'+EUR(s.gross)+'</b></div><div><span>Neto histórico</span><b>'+EUR(s.net)+'</b></div><div><span>Resultado conocido</span><b>'+(s.known?(s.pnl>=0?"+":"")+EUR(s.pnl):"Coste pendiente")+'</b></div><div><span>Cobros pendientes</span><b>'+EUR(s.pending)+'</b></div><div><span>PSA / RAW</span><b>'+s.psa+' / '+s.raw+'</b></div><div><span>Pokémon / Lorcana</span><b>'+s.pokemon+' / '+s.lorcana+'</b></div><div><span>Mejor salida</span><b>'+(s.best?EUR(s.best.unitPrice):"—")+'</b></div>';
 box.innerHTML=rows.length?rows.map(x=>{
  const detail=[x.number,x.set,x.language,x.grading,x.grade,x.cert?("Cert. "+x.cert):""].filter(Boolean).join(" · ");
  const origin=[x.acquisitionSource,x.acquisitionType].filter(Boolean).join(" · ");
  const result=x.result==null?"ROI no calculado · coste individual desconocido":("Resultado "+(x.result>=0?"+":"")+EUR(x.result));
  return '<article class="sealedCard archiveCard"><div class="sealedMain"><div class="thumb">'+(x.referenceImage?'<img src="'+x.referenceImage+'" alt="">':"🗃️")+'</div><div><span class="pill">'+x.payment+'</span><h4>'+String(x.name||"")+'</h4><small>'+detail+'</small></div><div class="sealedNumbers"><b>'+EUR(x.unitPrice)+' / ud</b><span>'+N(x.qty||1)+' ud · neto '+EUR(x.net)+'</span></div></div>'+
   '<div class="microNote"><b>Venta:</b> '+String(x.soldAt||"")+" · "+String(x.channel||"")+(x.saleOrder?" · Pedido #"+x.saleOrder:"")+'</div>'+
   '<div class="microNote"><b>Procedencia:</b> '+String(origin||"Sin documentar")+(x.parentProductCostEUR?" · producto origen ~"+EUR(x.parentProductCostEUR):"")+'</div>'+
   '<div class="microNote"><b>Contabilidad:</b> '+result+'</div>'+
   (x.acquisitionNotes?'<div class="microNote">'+String(x.acquisitionNotes)+'</div>':"")+
   (x.rawMarketSnapshot?'<div class="microNote"><b>Snapshot RAW '+x.rawMarketSnapshot.checkedAt+':</b> tendencia '+EUR(x.rawMarketSnapshot.trend)+' · 30d '+EUR(x.rawMarketSnapshot.avg30)+' · 7d '+EUR(x.rawMarketSnapshot.avg7)+' · 1d '+EUR(x.rawMarketSnapshot.avg1)+' · no comparar directamente con el slab PSA 9.</div>':"")+(x.archiveNotes?'<div class="microNote">'+String(x.archiveNotes)+'</div>':"")+
   '<div class="sealedActions">'+(x.marketUrl?'<a href="'+x.marketUrl+'" target="_blank" rel="noopener">Ficha mercado</a>':"")+'<button data-archive-watch="'+x.id+'">Volver a vigilar</button></div></article>'
 }).join(""):'<div class="emptyState"><b>El archivo está vacío.</b><span>Cuando vendas una carta aparecerá aquí permanentemente.</span></div>';
 document.querySelectorAll("[data-archive-watch]").forEach(b=>b.onclick=()=>watchAgain(b.dataset.archiveWatch));
 const ex=Q("#archiveExport");if(ex)ex.onclick=exportCsv;
}
window.CVArchive={render,records,exportCsv};ensureEeveeArchive();render();
})();