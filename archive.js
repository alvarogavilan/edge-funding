(()=>{"use strict";
const Q=s=>document.querySelector(s),N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
state.saleHistory=Array.isArray(state.saleHistory)?state.saleHistory:[];

function snapshotFromCard(c={},qty=1){
 return {
  universe:c.universe||"pokemon",name:c.name||"",set:c.set||"",number:c.number||"",year:c.year||"",language:c.language||"",
  variant:c.buyVariant||c.variant||"",condition:c.buyCondition||c.condition||c.grade||"",grading:c.grading||"RAW",grade:c.grade||"",cert:c.cert||"",
  referenceImage:c.referenceImage||"",photoKey:c.photoKey||"",quantity:qty,purchase:c.purchase??null,purchaseDate:c.purchaseDate||"",
  seller:c.buySeller||c.seller||"",purchaseUrl:c.buySourceUrl||c.marketPricing?.url||"",marketUrl:c.marketPricing?.url||c.buySourceUrl||"",
  saleDescription:c.saleDescription||"",description:c.description||"",notes:c.notes||"",purpose:c.purpose||"",
  acquisitionSource:c.acquisitionSource||"",acquisitionType:c.acquisitionType||"",acquisitionNotes:c.acquisitionNotes||"",
  parentProductCostEUR:c.parentProductCostEUR??null,parentProductCostApprox:!!c.parentProductCostApprox,
  popGrade:c.popGrade??null,popHigher:c.popHigher??null,popTotal:c.popTotal??null,popSource:c.popSource||"",popUrl:c.popUrl||"",popCheckedAt:c.popCheckedAt||"",
  marketPricing:c.marketPricing||null,gradedValuation:c.gradedValuation||null,conditionMarket:c.conditionMarket||null,
  buyOpportunityId:c.buyOpportunityId||"",buySource:c.buySource||"",buyVariant:c.buyVariant||"",buyLanguage:c.buyLanguage||"",
  buyCondition:c.buyCondition||"",buySeller:c.buySeller||"",buySourceUrl:c.buySourceUrl||"",boughtAt:c.boughtAt||""
 };
}
function migrateLegacySnapshots(){
 let changed=false;
 for(const h of state.saleHistory){
  if(h.cardSnapshot)continue;
  const c=(state.cards||[]).find(x=>x.id===h.cardId)||{};
  h.cardSnapshot={...snapshotFromCard(c,h.qty||1),...Object.fromEntries(Object.entries(h).filter(([k])=>!["cardSnapshot"].includes(k)))};
  h.archiveSnapshotAt=h.archiveSnapshotAt||new Date().toISOString();
  changed=true;
 }
 if(changed)save();
}
function ensureEeveeArchive(){
 const card=(state.cards||[]).find(c=>c.id==="eev174");
 const ledger=(state.investmentLedger||[]).find(r=>r.id==="sale-cardmarket-1304093225");
 if(!card||!card.archivedSold)return;
 if(!state.saleHistory.some(h=>h.cardId==="eev174"||h.id==="sale-cardmarket-1304093225")){
  const snap={...snapshotFromCard(card,1),
   universe:"pokemon",name:card.name||"Eevee ex #174",set:card.set||"SVP Promo · 2025",number:"SVP174",
   grading:"PSA",grade:String(card.grade||9),cert:card.cert||"136142568",
   acquisitionSource:card.acquisitionSource||"Prismatic Evolutions / Evoluciones Prismáticas Super-Premium Collection",
   parentProductCostEUR:card.parentProductCostEUR||120,parentProductCostApprox:true,acquisitionType:card.acquisitionType||"included-promo",
   acquisitionNotes:card.acquisitionNotes||"Promo incluida en la Super-Premium Collection de Evoluciones Prismáticas (~120 € el producto completo). Coste individual no asignado.",
   referenceImage:card.referenceImage||"https://images.pokemontcg.io/svp/174_hires.png",
   marketUrl:"https://www.cardmarket.com/es/Pokemon/Products/Singles/SV-Black-Star-Promos/Eevee-ex-SVP174"
  };
  state.saleHistory.push({
   id:"sale-cardmarket-1304093225",cardId:"eev174",...snap,cardSnapshot:snap,qty:1,unitPrice:60,shipping:0,fees:0,net:60,
   soldAt:"2026-09-27",channel:"Cardmarket",saleOrder:"1304093225",fulfillmentStatus:ledger?.fulfillmentStatus||"sold-awaiting-shipment",
   purchase:null,basisUnknown:true,archiveSnapshotAt:new Date().toISOString(),
   rawMarketSnapshot:{checkedAt:"2026-09-27",trend:16.56,avg30:18.78,avg7:20.37,avg1:17.24,currency:"EUR",scope:"RAW only · no comparable directamente con PSA 9"},
   archiveNotes:"Venta real Cardmarket. No se calcula ROI porque el coste individual de esta carta no fue asignado dentro del producto completo."
  });save();
 }
}
function workflowLabel(h){
 const r=(state.investmentLedger||[]).find(x=>x.id===h.id),v=String(r?.fulfillmentStatus||h.fulfillmentStatus||"");
 if(["paid","paid-confirmed","completed","settled"].includes(v))return "COBRADA";
 if(v==="sold-awaiting-shipment")return "VENDIDA · ENVÍO PENDIENTE";
 if(v==="sold-awaiting-payment")return "VENDIDA · COBRO PENDIENTE";
 return v?String(v).toUpperCase():"VENDIDA";
}
function holdDays(h){
 const a=h.purchaseDate||h.cardSnapshot?.purchaseDate||"",b=h.soldAt||"";
 if(!a||!b)return null;
 const d=(new Date(b+"T00:00:00Z")-new Date(a+"T00:00:00Z"))/86400000;
 return Number.isFinite(d)&&d>=0?Math.round(d):null;
}
function paymentStatus(h){
 const r=(state.investmentLedger||[]).find(x=>x.id===h.id),s=String(r?.fulfillmentStatus||h.fulfillmentStatus||"");
 return ["paid","paid-confirmed","completed","settled"].includes(s)?"COBRADA":"PENDIENTE";
}
function records(){
 ensureEeveeArchive();migrateLegacySnapshots();
 return [...state.saleHistory].map(h=>{
  const s=h.cardSnapshot||{};
  const purchase=h.purchase??s.purchase??null,basis=purchase==null?null:N(purchase)*N(h.qty||1);
  const net=N(h.net)||N(h.unitPrice)*N(h.qty||1)-N(h.shipping)-N(h.fees);
  return {...s,...h,cardSnapshot:s,purchase,basis,net,result:basis==null?null:net-basis,payment:paymentStatus(h),workflow:workflowLabel(h),
   heldDays:holdDays(h),ledgerStatus:(state.investmentLedger||[]).find(r=>r.id===h.id)?.fulfillmentStatus||h.fulfillmentStatus||""};
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
 const cols=["Fecha venta","Nombre","Universo","Set","Número","Año","Idioma","Variante","Condición","Graduación","Nota","Certificado","Cantidad","Precio unidad","Bruto","Comisiones","Envío","Neto","Coste unidad","Coste base","Beneficio","ROI %","Días en cartera","Canal","Pedido","Estado cobro","Workflow","Vendedor compra","Procedencia","Tipo procedencia","Producto origen coste","Coste producto aproximado","Fecha compra","URL compra","URL mercado","Población grado","Población superior","Población total","Fuente población","Descripción venta","Descripción","Notas carta","Notas venta","Snapshot mercado RAW","Histórico posterior"];
 const quote=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
 const lines=[cols.map(quote).join(",")];
 for(const x of rows){
  const roi=x.result!=null&&N(x.basis)>0?x.result/N(x.basis)*100:null;
  lines.push([
   x.soldAt,x.name,x.universe,x.set,x.number,x.year,x.language,x.variant,x.condition,x.grading,x.grade,x.cert,x.qty,x.unitPrice,
   N(x.unitPrice)*N(x.qty||1),x.fees,x.shipping,x.net,x.purchase,x.basis,x.result,roi,x.heldDays,x.channel,x.saleOrder,x.payment,x.workflow,
   x.buySeller||x.seller,x.acquisitionSource,x.acquisitionType,x.parentProductCostEUR,x.parentProductCostApprox?"sí":"",x.purchaseDate,
   x.purchaseUrl||x.buySourceUrl,x.marketUrl,x.popGrade,x.popHigher,x.popTotal,x.popSource,x.saleDescription,x.description,x.notes,x.saleNotes,
   x.rawMarketSnapshot?JSON.stringify(x.rawMarketSnapshot):"",Array.isArray(x.postSaleChecks)?JSON.stringify(x.postSaleChecks):""
  ].map(quote).join(","));
 }
 return "\uFEFF"+lines.join("\n");
}
function exportCsv(){
 const rows=records(),blob=new Blob([csv(rows)],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download="card-vault-archivo-vendidos.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function watchAgain(id){
 const x=records().find(r=>r.id===id);if(!x)return;
 state.watch=Array.isArray(state.watch)?state.watch:[];
 if(!state.watch.some(w=>w.archiveId===id))state.watch.push({name:x.name,target:0,archiveId:id,source:"Archivo de vendidos",set:x.set||"",number:x.number||"",language:x.language||"",grading:x.grading||"",grade:x.grade||"",variant:x.variant||"",condition:x.condition||""});
 save();render();try{window.CVRenderCollection?.()}catch{}
 alert("Añadida a Seguimiento. Card Vault volverá a vigilar esta carta.");
}
function renderLearning(rows){
 const box=Q("#archiveInsights");if(!box)return;
 const known=rows.filter(x=>x.result!=null&&N(x.basis)>0);
 if(known.length<3){
  box.innerHTML='<b>Learning Engine · aprendiendo</b><div class="qaRow"><span>Ventas con coste conocido</span><b>'+known.length+'/3 mínimas</b></div><small>No ajusta recomendaciones todavía. Espera una muestra mínima para evitar sobreajuste.</small>';
  return;
 }
 const rois=known.map(x=>x.result/N(x.basis)*100),wins=known.filter(x=>x.result>0).length;
 const avgRoi=rois.reduce((a,b)=>a+b,0)/rois.length,sorted=known.map(x=>x.heldDays).filter(x=>x!=null).sort((a,b)=>a-b);
 const medianHold=sorted.length?sorted[Math.floor(sorted.length/2)]:null,groups={};
 for(const x of known){const k=(x.universe||"pokemon")+" · "+(x.grading||"RAW");const g=groups[k]||(groups[k]={n:0,sum:0});g.n++;g.sum+=x.result/N(x.basis)*100}
 const eligible=Object.entries(groups).filter(([,g])=>g.n>=2).sort((a,b)=>(b[1].sum/b[1].n)-(a[1].sum/a[1].n));
 box.innerHTML='<b>Learning Engine · resultados cerrados</b>'+
  '<div class="qaRow"><span>Tasa positiva</span><b>'+((wins/known.length)*100).toFixed(1)+'%</b></div>'+
  '<div class="qaRow"><span>ROI medio realizado</span><b>'+(avgRoi>=0?'+':'')+avgRoi.toFixed(1)+'%</b></div>'+
  '<div class="qaRow"><span>Tiempo mediano en cartera</span><b>'+(medianHold==null?'Sin dato':medianHold+' días')+'</b></div>'+
  '<div class="qaRow"><span>Mejor segmento con ≥2 ventas</span><b>'+(eligible.length?eligible[0][0]+' · '+(eligible[0][1].sum/eligible[0][1].n).toFixed(1)+'% ROI':'Aún sin muestra')+'</b></div>'+
  '<small>Estas métricas son descriptivas. No cambian el motor de compra hasta acumular una muestra suficiente y estable.</small>';
}
function render(){
 const box=Q("#archiveList"),sum=Q("#archiveSummary");if(!box||!sum)return;
 const rows=records(),s=summary(rows);renderLearning(rows);
 sum.innerHTML='<div><span>Cartas vendidas</span><b>'+s.count+'</b></div><div><span>Ventas archivadas</span><b>'+s.records+'</b></div><div><span>Bruto histórico</span><b>'+EUR(s.gross)+'</b></div><div><span>Neto histórico</span><b>'+EUR(s.net)+'</b></div><div><span>Resultado conocido</span><b>'+(s.known?(s.pnl>=0?"+":"")+EUR(s.pnl):"Coste pendiente")+'</b></div><div><span>Cobros pendientes</span><b>'+EUR(s.pending)+'</b></div><div><span>PSA / RAW</span><b>'+s.psa+' / '+s.raw+'</b></div><div><span>Pokémon / Lorcana</span><b>'+s.pokemon+' / '+s.lorcana+'</b></div><div><span>Mejor salida</span><b>'+(s.best?EUR(s.best.unitPrice):"—")+'</b></div>';
 box.innerHTML=rows.length?rows.map(x=>{
  const detail=[x.number,x.set,x.language,x.variant,x.condition,x.grading,x.grade,x.cert?("Cert. "+x.cert):""].filter(Boolean).join(" · ");
  const origin=[x.acquisitionSource,x.acquisitionType].filter(Boolean).join(" · ");
  const result=x.result==null?"ROI no calculado · coste individual desconocido":("Resultado "+(x.result>=0?"+":"")+EUR(x.result)+" · ROI "+(x.basis>0?(x.result/x.basis*100).toFixed(1)+"%":"—"));
  return '<article class="sealedCard archiveCard"><div class="sealedMain"><div class="thumb">'+(x.referenceImage?'<img src="'+x.referenceImage+'" alt="">':"🗃️")+'</div><div><span class="pill">'+x.payment+'</span><h4>'+String(x.name||"")+'</h4><small>'+detail+'</small></div><div class="sealedNumbers"><b>'+EUR(x.unitPrice)+' / ud</b><span>'+N(x.qty||1)+' ud · neto '+EUR(x.net)+'</span></div></div>'+
   '<div class="microNote"><b>Venta:</b> '+String(x.soldAt||"")+" · "+String(x.channel||"")+(x.saleOrder?" · Pedido #"+x.saleOrder:"")+' · '+x.workflow+'</div>'+
   '<div class="microNote"><b>Procedencia:</b> '+String(origin||"Sin documentar")+(x.parentProductCostEUR?" · producto origen ~"+EUR(x.parentProductCostEUR):"")+'</div>'+
   '<div class="microNote"><b>Contabilidad:</b> '+result+(x.heldDays!=null?" · "+x.heldDays+" días en cartera":"")+'</div>'+
   (x.acquisitionNotes?'<div class="microNote">'+String(x.acquisitionNotes)+'</div>':"")+
   (x.rawMarketSnapshot?'<div class="microNote"><b>Snapshot RAW '+x.rawMarketSnapshot.checkedAt+':</b> tendencia '+EUR(x.rawMarketSnapshot.trend)+' · 30d '+EUR(x.rawMarketSnapshot.avg30)+' · 7d '+EUR(x.rawMarketSnapshot.avg7)+' · 1d '+EUR(x.rawMarketSnapshot.avg1)+' · no comparar directamente con el slab PSA 9.</div>':"")+
   (x.archiveNotes?'<div class="microNote">'+String(x.archiveNotes)+'</div>':"")+
   '<div class="sealedActions">'+(x.marketUrl?'<a href="'+x.marketUrl+'" target="_blank" rel="noopener">Ficha mercado</a>':"")+'<button data-archive-watch="'+x.id+'">Volver a vigilar</button></div></article>';
 }).join(""):'<div class="emptyState"><b>El archivo está vacío.</b><span>Cuando vendas una carta aparecerá aquí permanentemente.</span></div>';
 document.querySelectorAll("[data-archive-watch]").forEach(b=>b.onclick=()=>watchAgain(b.dataset.archiveWatch));
 const ex=Q("#archiveExport");if(ex)ex.onclick=exportCsv;
}
window.CVArchive={render,records,exportCsv};ensureEeveeArchive();migrateLegacySnapshots();render();
})();