(()=>{"use strict";
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])),Q=s=>document.querySelector(s),N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
let archiveFilter={q:"",universe:"",grading:"",payment:"",sort:"date-desc"};
state.saleHistory=Array.isArray(state.saleHistory)?state.saleHistory:[];

function snapshotFromCard(c={},qty=1){
 return {
  universe:c.universe||"pokemon",name:c.name||"",set:c.set||"",number:c.number||"",year:c.year||"",language:c.language||"",
  variant:c.buyVariant||c.variant||"",condition:c.buyCondition||c.condition||c.grade||"",grading:c.grading||"RAW",grade:c.grade||"",cert:c.cert||"",
  referenceImage:c.referenceImage||"",photoKey:c.photoKey||"",quantity:qty,purchase:c.purchase??null,purchaseDate:c.purchaseDate||"",purchaseShipping:c.purchaseShipping??0,purchaseFees:c.purchaseFees??0,landedCostUnit:c.landedCostUnit??null,
  seller:c.buySeller||c.seller||"",purchaseUrl:c.buySourceUrl||c.marketPricing?.url||"",marketUrl:c.marketPricing?.url||c.buySourceUrl||"",
  saleDescription:c.saleDescription||"",description:c.description||"",notes:c.notes||"",purpose:c.purpose||"",
  acquisitionSource:c.acquisitionSource||"",acquisitionType:c.acquisitionType||"",acquisitionNotes:c.acquisitionNotes||"",
  parentProductCostEUR:c.parentProductCostEUR??null,parentProductCostApprox:!!c.parentProductCostApprox,
  popGrade:c.popGrade??null,popHigher:c.popHigher??null,popTotal:c.popTotal??null,popSource:c.popSource||"",popUrl:c.popUrl||"",popCheckedAt:c.popCheckedAt||"",
  marketPricing:c.marketPricing||null,gradedValuation:c.gradedValuation||null,conditionMarket:c.conditionMarket||null,
  buyOpportunityId:c.buyOpportunityId||"",buySource:c.buySource||"",buyVariant:c.buyVariant||"",buyLanguage:c.buyLanguage||"",
  buyCondition:c.buyCondition||"",buySeller:c.buySeller||"",buySourceUrl:c.buySourceUrl||"",boughtAt:c.boughtAt||"",
  purchaseThesis:c.purchaseThesis?JSON.parse(JSON.stringify(c.purchaseThesis)):null
 };
}
function clone(v){try{return v==null?null:JSON.parse(JSON.stringify(v))}catch{return null}}
function listingFor(cardId){
 const all=(state.saleListings||[]).filter(x=>x.cardId===cardId);
 return all.sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")))[0]||null;
}
/* V84.7 · Expediente autosuficiente: congela identidad exacta, tesis, evidencia de salida, supply,
   coste aterrizado y bucket de valoración en el momento de archivar. Nunca sobrescribe un audit ya congelado. */
function auditFields(c={},h={}){
 const listing=c.id?listingFor(c.id):null,px=listing&&window.CVPrimeExitPricing?.calc?listing&&window.CVPrimeExitPricing.calc(listing,c):null;
 let decision=null;try{decision=window.CVPositionDecision?.evaluate?(()=>{const r=window.CVPositionDecision.evaluate(c,{prudentTotal:0,alts:{n:0,known:false}});return {label:r.label,strength:r.strength,why:r.why}})():null}catch{}
 const b=window.CVPrimeValuation?.bucket?.({...c,archivedSold:false})||null;
 return {
  auditVersion:"84.7",frozenAt:new Date().toISOString(),cardAvailable:!!c.id,
  identityKey:window.CVIdentity?.key?.((()=>{const snap=h.cardSnapshot||h,o={...snap};for(const k of ["universe","name","set","number","language","offerLanguage","variant","condition","grading","grade"])if(String(c[k]??"").trim())o[k]=c[k];return o})())||"",
  landedCostUnit:c.id?(window.CVPrimeValuation?.basisUnit?.(c)??null):(h.landedCostUnit??h.cardSnapshot?.landedCostUnit??null),
  purchaseThesis:clone(c.purchaseThesis||h.purchaseThesis||h.cardSnapshot?.purchaseThesis),
  saleThesis:px?{listedPrice:px.listedPrice,suggestedAsk:px.ask,breakEven:px.breakEven,targetFloor:px.targetFloor,feePct:px.feePct,sellShipping:px.sellShipping,expectedProfit:px.profit,expectedRoi:px.roi,executable:px.executable,rotation:px.rotation,decision}:(decision?{decision}:null),
  exitEvidence:clone(listing?.exitEvidence||null),exitEvidenceHistory:clone(listing?.exitEvidenceHistory||null),
  supplyEvidence:clone(c.supplyEvidence||c.purchaseThesis?.supply||null),
  valuationAtSale:b?{bucket:b.bucket,amount:b.amount,reason:b.reason}:null,
  marketPricing:clone(c.marketPricing||h.cardSnapshot?.marketPricing||null),conditionMarket:clone(c.conditionMarket||null),gradedValuation:clone(c.gradedValuation||null),
  conditionAssessment:clone(c.conditionAssessment||null),provenance:c.provenance||"",purchaseEvidence:c.purchaseEvidence||"",purchaseEvidenceDate:c.purchaseEvidenceDate||""
 };
}
function freezeAudits(){
 if(!window.CVIdentity||!window.CVPrimeValuation)return; // módulos PRIME aún no cargados: congelar más tarde, nunca con campos vacíos
 let changed=false;
 for(const h of state.saleHistory){
  const r=(state.investmentLedger||[]).find(x=>x.id===h.id);
  if(r){if(r.shippedAt&&!h.shippedAt){h.shippedAt=r.shippedAt;changed=true}if(r.paidAt&&!h.paidAt){h.paidAt=r.paidAt;changed=true}}
  if(h.audit)continue;
  const c=(state.cards||[]).find(x=>x.id===h.cardId)||{};
  h.audit=auditFields(c,h);changed=true;
 }
 if(changed)save();
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
 ensureEeveeArchive();migrateLegacySnapshots();freezeAudits();
 return [...state.saleHistory].map(h=>{
  const s=h.cardSnapshot||{};
  const purchase=h.purchase??s.purchase??null,landed=h.landedCostUnit??s.landedCostUnit??null,basis=landed!=null?N(landed)*N(h.qty||1):(purchase==null?null:N(purchase)*N(h.qty||1));
  const net=N(h.net)||N(h.unitPrice)*N(h.qty||1)-N(h.shipping)-N(h.fees);
  return {...s,...h,cardSnapshot:s,purchase,basis,net,result:basis==null?null:net-basis,payment:paymentStatus(h),workflow:workflowLabel(h),
   audit:h.audit||null,identityKey:h.audit?.identityKey||"",shippedAt:h.shippedAt||(state.investmentLedger||[]).find(r=>r.id===h.id)?.shippedAt||"",paidAt:h.paidAt||(state.investmentLedger||[]).find(r=>r.id===h.id)?.paidAt||"",
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
 const cols=["Fecha venta","Nombre","Universo","Set","Número","Año","Idioma","Variante","Condición","Graduación","Nota","Certificado","Cantidad","Precio unidad","Bruto","Comisiones","Envío","Neto","Coste compra","Portes compra","Comisiones compra","Coste aterrizado ud","Coste base","Beneficio","ROI %","Días en cartera","Canal","Pedido","Estado cobro","Workflow","Vendedor compra","Procedencia","Tipo procedencia","Producto origen coste","Coste producto aproximado","Fecha compra","URL compra","URL mercado","Población grado","Población superior","Población total","Fuente población","Descripción venta","Descripción","Notas carta","Notas venta","Snapshot mercado RAW","Histórico posterior","Identity key exacta","Enviada (shippedAt)","Cobrada (paidAt)","Coste aterrizado congelado","Valoración al vender","Tesis de compra","Tesis de venta","Evidencia de salida","Supply / reprint","Evaluación de condición","Audit congelado"];
 const quote=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
 const lines=[cols.map(quote).join(",")];
 for(const x of rows){
  const roi=x.result!=null&&N(x.basis)>0?x.result/N(x.basis)*100:null;
  lines.push([
   x.soldAt,x.name,x.universe,x.set,x.number,x.year,x.language,x.variant,x.condition,x.grading,x.grade,x.cert,x.qty,x.unitPrice,
   N(x.unitPrice)*N(x.qty||1),x.fees,x.shipping,x.net,x.purchase,x.purchaseShipping,x.purchaseFees,x.landedCostUnit,x.basis,x.result,roi,x.heldDays,x.channel,x.saleOrder,x.payment,x.workflow,
   x.buySeller||x.seller,x.acquisitionSource,x.acquisitionType,x.parentProductCostEUR,x.parentProductCostApprox?"sí":"",x.purchaseDate,
   x.purchaseUrl||x.buySourceUrl,x.marketUrl,x.popGrade,x.popHigher,x.popTotal,x.popSource,x.saleDescription,x.description,x.notes,x.saleNotes,
   x.rawMarketSnapshot?JSON.stringify(x.rawMarketSnapshot):"",Array.isArray(x.postSaleChecks)?JSON.stringify(x.postSaleChecks):"",
   x.identityKey,x.shippedAt,x.paidAt,x.audit?.landedCostUnit,x.audit?.valuationAtSale?JSON.stringify(x.audit.valuationAtSale):"",
   (x.audit?.purchaseThesis||x.purchaseThesis)?JSON.stringify(x.audit?.purchaseThesis||x.purchaseThesis):"",x.audit?.saleThesis?JSON.stringify(x.audit.saleThesis):"",
   x.audit?.exitEvidence?JSON.stringify(x.audit.exitEvidence):"",x.audit?.supplyEvidence?JSON.stringify(x.audit.supplyEvidence):"",
   x.audit?.conditionAssessment?JSON.stringify(x.audit.conditionAssessment):"",x.audit?.frozenAt||""
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
/* V84.7 · Learning Engine: solo resultados cerrados con coste conocido.
   ≥3 casos = observación · ≥10 = tendencia más estable · nunca ajusta reglas automáticamente. */
const LEARN_MIN=3,LEARN_STABLE=10;
function median(a){const v=a.filter(x=>x!=null&&Number.isFinite(x)).sort((x,y)=>x-y);if(!v.length)return null;const m=Math.floor(v.length/2);return v.length%2?v[m]:(v[m-1]+v[m])/2}
function learningSegments(known){
 const dims={
  "Universo":x=>String(x.universe||"pokemon").toLowerCase()==="lorcana"?"Lorcana":"Pokémon",
  "Idioma":x=>x.language||"sin idioma",
  "Graduación":x=>String(x.grading||"RAW").toUpperCase(),
  "Canal":x=>x.channel||"sin canal",
  "Origen compra":x=>x.buySource||x.buySeller||x.seller||x.acquisitionSource||"sin origen",
  "Supply":x=>{const r=x.audit?.supplyEvidence?.risk;return r?("reprint "+r):"sin evidencia supply"}
 };
 const out=[];
 for(const [dim,fn] of Object.entries(dims)){
  const g={};for(const x of known){const k=fn(x);(g[k]=g[k]||[]).push(x)}
  for(const [k,arr] of Object.entries(g)){
   if(arr.length<LEARN_MIN)continue;
   const rois=arr.map(x=>x.result/N(x.basis)*100),exp=arr.filter(x=>(x.audit?.purchaseThesis||x.purchaseThesis)?.edgeEUR!=null);
   out.push({dim,k,n:arr.length,roi:rois.reduce((a,b)=>a+b,0)/rois.length,win:arr.filter(x=>x.result>0).length/arr.length,
    hold:median(arr.map(x=>x.heldDays)),bias:exp.length>=LEARN_MIN?exp.reduce((a,x)=>a+N(x.result)-N((x.audit?.purchaseThesis||x.purchaseThesis).edgeEUR),0)/exp.length:null,
    level:arr.length>=LEARN_STABLE?"tendencia":"observación"});
  }
 }
 return out.sort((a,b)=>b.n-a.n||b.roi-a.roi);
}
function renderLearning(rows){
 const box=Q("#archiveInsights");if(!box)return;
 const known=rows.filter(x=>x.result!=null&&N(x.basis)>0),unknown=rows.length-known.length;
 const tracked=rows.map(x=>{
  const checks=(Array.isArray(x.postSaleChecks)?x.postSaleChecks:[]).filter(p=>p.exactComparable&&N(p.priceEUR)>0);
  if(!checks.length||!(N(x.unitPrice)>0))return null;
  const last=checks[checks.length-1];
  return (N(last.priceEUR)-N(x.unitPrice))/N(x.unitPrice)*100;
 }).filter(v=>v!=null);
 const medianAfter=median(tracked);
 const head='<b>Learning Engine · resultados cerrados</b>'+
  '<div class="qaRow"><span>Ventas con coste conocido</span><b>'+known.length+(known.length<LEARN_MIN?' / '+LEARN_MIN+' mínimas':'')+'</b></div>'+
  '<div class="qaRow"><span>Ventas sin coste (excluidas)</span><b>'+unknown+'</b></div>'+
  '<div class="qaRow"><span>Ventas con control postventa exacto</span><b>'+tracked.length+'</b></div>'+
  '<div class="qaRow"><span>Mercado posterior vs nuestra venta (mediana)</span><b>'+(tracked.length>=LEARN_MIN?(medianAfter>=0?'+':'')+medianAfter.toFixed(1)+'%':'Necesita ≥'+LEARN_MIN)+'</b></div>';
 if(known.length<LEARN_MIN){
  box.innerHTML=head+'<small>No se muestran tasas, segmentos ni sesgos hasta tener ≥'+LEARN_MIN+' ventas cerradas con coste conocido. Las reglas BUY/SELL nunca se ajustan solas.</small>';
  return;
 }
 const rois=known.map(x=>x.result/N(x.basis)*100),avgRoi=rois.reduce((a,b)=>a+b,0)/rois.length,wins=known.filter(x=>x.result>0).length;
 const thesis=known.filter(x=>(x.audit?.purchaseThesis||x.purchaseThesis)?.edgeEUR!=null);
 const bias=thesis.length>=LEARN_MIN?thesis.reduce((a,x)=>a+N(x.result)-N((x.audit?.purchaseThesis||x.purchaseThesis).edgeEUR),0)/thesis.length:null;
 const stable=known.length>=LEARN_STABLE,seg=learningSegments(known);
 let timing='Muestra insuficiente';
 if(tracked.length>=LEARN_MIN&&medianAfter!=null)timing=medianAfter>=15?'Vendemos pronto: el mercado posterior sube':medianAfter<=-15?'Buen timing: el mercado posterior cae':'Timing estable';
 box.innerHTML=head+
  '<div class="qaRow"><span>Tasa positiva</span><b>'+(wins/known.length*100).toFixed(0)+'% · '+(stable?'tendencia':'observación')+'</b></div>'+
  '<div class="qaRow"><span>ROI medio realizado</span><b>'+(avgRoi>=0?'+':'')+avgRoi.toFixed(1)+'%</b></div>'+
  '<div class="qaRow"><span>Días en cartera (mediana)</span><b>'+(median(known.map(x=>x.heldDays))??'Sin dato')+'</b></div>'+
  '<div class="qaRow"><span>Edge esperado vs realizado</span><b>'+(bias==null?'Necesita ≥'+LEARN_MIN+' tesis':((bias>=0?'+':'')+EUR(bias)+' por operación · '+(bias<0?'tesis optimistas':'tesis conservadoras')))+'</b></div>'+
  '<div class="qaRow"><span>Timing de salida</span><b>'+timing+'</b></div>'+
  (seg.length?'<details><summary>Segmentos con ≥'+LEARN_MIN+' ventas ('+seg.length+')</summary>'+seg.map(g=>'<div class="qaRow"><span>'+E(g.dim)+' · '+E(g.k)+'<small> · '+g.n+' ventas · '+g.level+(g.hold!=null?' · '+g.hold+' días':'')+(g.bias!=null?' · sesgo '+(g.bias>=0?'+':'')+EUR(g.bias):'')+'</small></span><b>'+(g.roi>=0?'+':'')+g.roi.toFixed(1)+'% · '+(g.win*100).toFixed(0)+'% pos.</b></div>').join("")+'</details>':'')+
  '<small>Descriptivo. '+(stable?'Con ≥'+LEARN_STABLE+' ventas la lectura es más estable, pero':'Con menos de '+LEARN_STABLE+' ventas es solo observación y')+' ningún umbral BUY/SELL se modifica automáticamente: cualquier ajuste requiere revisión explícita.</small>';
}
function ensureArchiveFilters(){
 const list=Q("#archiveList");if(!list)return;
 let box=Q("#archiveFilters");if(box)return;
 box=document.createElement("div");box.id="archiveFilters";box.className="searchRow";
 box.innerHTML='<input id="archiveSearch" placeholder="Buscar nombre, set, número, certificado o pedido">'+
  '<select id="archiveUniverse"><option value="">Pokémon + Lorcana</option><option value="pokemon">Pokémon</option><option value="lorcana">Lorcana</option></select>'+
  '<select id="archiveGrading"><option value="">RAW + graduadas</option><option value="RAW">RAW</option><option value="PSA">PSA</option><option value="BGS">BGS</option><option value="CGC">CGC</option></select>'+
  '<select id="archivePayment"><option value="">Todos los cobros</option><option value="COBRADA">Cobradas</option><option value="PENDIENTE">Pendientes</option></select>'+
  '<select id="archiveSort"><option value="date-desc">Más recientes</option><option value="date-asc">Más antiguas</option><option value="price-desc">Mayor venta</option><option value="price-asc">Menor venta</option><option value="net-desc">Mayor neto</option></select>';
 list.before(box);
 const rerender=()=>{archiveFilter={
  q:(Q("#archiveSearch")?.value||"").trim().toLowerCase(),
  universe:Q("#archiveUniverse")?.value||"",grading:Q("#archiveGrading")?.value||"",
  payment:Q("#archivePayment")?.value||"",sort:Q("#archiveSort")?.value||"date-desc"
 };render()};
 ["#archiveSearch","#archiveUniverse","#archiveGrading","#archivePayment","#archiveSort"].forEach(s=>Q(s)?.addEventListener(s==="#archiveSearch"?"input":"change",rerender));
}
function filteredRows(rows){
 let out=rows.filter(x=>{
  const hay=[x.name,x.set,x.number,x.cert,x.saleOrder,x.channel,x.language,x.variant].join(" ").toLowerCase();
  return (!archiveFilter.q||hay.includes(archiveFilter.q))&&
   (!archiveFilter.universe||String(x.universe||"pokemon").toLowerCase()===archiveFilter.universe)&&
   (!archiveFilter.grading||String(x.grading||"RAW").toUpperCase()===archiveFilter.grading)&&
   (!archiveFilter.payment||x.payment===archiveFilter.payment);
 });
 if(archiveFilter.sort==="date-asc")out.sort((a,b)=>(a.soldAt||"").localeCompare(b.soldAt||""));
 else if(archiveFilter.sort==="price-desc")out.sort((a,b)=>N(b.unitPrice)-N(a.unitPrice));
 else if(archiveFilter.sort==="price-asc")out.sort((a,b)=>N(a.unitPrice)-N(b.unitPrice));
 else if(archiveFilter.sort==="net-desc")out.sort((a,b)=>N(b.net)-N(a.net));
 else out.sort((a,b)=>(b.soldAt||"").localeCompare(a.soldAt||""));
 return out;
}
function render(){
 const box=Q("#archiveList"),sum=Q("#archiveSummary");if(!box||!sum)return;
 ensureArchiveFilters();
 const allRows=records(),rows=filteredRows(allRows),s=summary(allRows);renderLearning(allRows);
 sum.innerHTML='<div><span>Cartas vendidas</span><b>'+s.count+'</b></div><div><span>Ventas archivadas</span><b>'+s.records+'</b></div><div><span>Bruto histórico</span><b>'+EUR(s.gross)+'</b></div><div><span>Neto histórico</span><b>'+EUR(s.net)+'</b></div><div><span>Resultado conocido</span><b>'+(s.known?(s.pnl>=0?"+":"")+EUR(s.pnl):"Coste pendiente")+'</b></div><div><span>Cobros pendientes</span><b>'+EUR(s.pending)+'</b></div><div><span>PSA / RAW</span><b>'+s.psa+' / '+s.raw+'</b></div><div><span>Pokémon / Lorcana</span><b>'+s.pokemon+' / '+s.lorcana+'</b></div><div><span>Mejor salida</span><b>'+(s.best?EUR(s.best.unitPrice):"—")+'</b></div>';
 box.innerHTML=(rows.length?'<div class="microNote"><b>'+rows.length+'</b> expediente(s) visibles de '+allRows.length+'</div>':"")+ (rows.length?rows.map(x=>{
  const detail=[x.number,x.set,x.language,x.variant,x.condition,x.grading,x.grade,x.cert?("Cert. "+x.cert):""].filter(Boolean).join(" · ");
  const origin=[x.acquisitionSource,x.acquisitionType].filter(Boolean).join(" · ");
  const result=x.result==null?"ROI no calculado · coste individual desconocido":("Resultado "+(x.result>=0?"+":"")+EUR(x.result)+" · ROI "+(x.basis>0?(x.result/x.basis*100).toFixed(1)+"%":"—"));
  return '<article class="sealedCard archiveCard"><div class="sealedMain"><div class="thumb">'+(x.referenceImage?'<img src="'+x.referenceImage+'" alt="">':"🗃️")+'</div><div><span class="pill">'+x.payment+'</span><h4>'+String(x.name||"")+'</h4><small>'+detail+'</small></div><div class="sealedNumbers"><b>'+EUR(x.unitPrice)+' / ud</b><span>'+N(x.qty||1)+' ud · neto '+EUR(x.net)+'</span></div></div>'+
   '<div class="microNote"><b>Venta:</b> '+String(x.soldAt||"")+" · "+String(x.channel||"")+(x.saleOrder?" · Pedido #"+x.saleOrder:"")+' · '+x.workflow+'</div>'+
   '<div class="microNote"><b>Procedencia:</b> '+String(origin||"Sin documentar")+(x.parentProductCostEUR?" · producto origen ~"+EUR(x.parentProductCostEUR):"")+'</div>'+
   '<div class="microNote"><b>Contabilidad:</b> '+result+(x.heldDays!=null?" · "+x.heldDays+" días en cartera":"")+'</div>'+
   (x.acquisitionNotes?'<div class="microNote">'+String(x.acquisitionNotes)+'</div>':"")+
   (x.rawMarketSnapshot?'<div class="microNote"><b>Snapshot RAW '+x.rawMarketSnapshot.checkedAt+':</b> tendencia '+EUR(x.rawMarketSnapshot.trend)+' · 30d '+EUR(x.rawMarketSnapshot.avg30)+' · 7d '+EUR(x.rawMarketSnapshot.avg7)+' · 1d '+EUR(x.rawMarketSnapshot.avg1)+' · no comparar directamente con el slab PSA 9.</div>':"")+
   (x.purchaseThesis?'<div class="microNote"><b>Tesis de compra congelada:</b> entrada '+EUR(x.purchaseThesis.entryEUR)+' · salida conservadora '+(x.purchaseThesis.conservativeExitEUR==null?'sin dato':EUR(x.purchaseThesis.conservativeExitEUR))+' · edge '+(x.purchaseThesis.edgeEUR==null?'sin dato':EUR(x.purchaseThesis.edgeEUR))+' · ROI '+(x.purchaseThesis.roiPct==null?'sin dato':Number(x.purchaseThesis.roiPct).toFixed(1)+'%')+' · confianza '+String(x.purchaseThesis.evidenceConfidence?.label||'sin dato')+' · ventas 7/30/90d '+[x.purchaseThesis.sales7??'—',x.purchaseThesis.sales30??'—',x.purchaseThesis.sales90??'—'].join('/')+'</div>':"")+
   (x.archiveNotes?'<div class="microNote">'+String(x.archiveNotes)+'</div>':"")+
   '<details class="moreActions"><summary>Auditoría y acciones</summary>'+
    '<div class="microNote"><b>Fulfillment:</b> vendida '+E(x.soldAt||"—")+' · enviada '+E(x.shippedAt?String(x.shippedAt).slice(0,10):"pendiente")+' · cobrada '+E(x.paidAt?String(x.paidAt).slice(0,10):"pendiente")+'</div>'+
    '<div class="microNote"><b>Expediente:</b> '+(x.audit?('congelado '+E(String(x.audit.frozenAt||"").slice(0,10))+' · identidad '+E(x.identityKey||"sin clave")+(x.audit.valuationAtSale?' · valor al vender '+E(window.CVPrimeValuation?.LABEL?.[x.audit.valuationAtSale.bucket]||x.audit.valuationAtSale.bucket)+' '+EUR(x.audit.valuationAtSale.amount):'')+(x.audit.saleThesis?.suggestedAsk!=null?' · ask sugerido '+EUR(x.audit.saleThesis.suggestedAsk):'')+(x.audit.exitEvidence?' · evidencia salida '+E(x.audit.exitEvidence.source||''):' · sin evidencia de salida')):'pendiente de congelar')+'</div>'+
    '<div class="sealedActions">'+(x.marketUrl?'<a href="'+x.marketUrl+'" target="_blank" rel="noopener">Ficha mercado</a>':"")+'<button data-archive-watch="'+x.id+'">Volver a vigilar</button><button data-post-sale="'+x.id+'">Registrar control postventa</button></div></details></article>';
 }).join(""):'<div class="emptyState"><b>Sin resultados para estos filtros.</b><span>El Archivo completo sigue conservado.</span></div>');
 document.querySelectorAll("[data-archive-watch]").forEach(b=>b.onclick=()=>watchAgain(b.dataset.archiveWatch));
 const ex=Q("#archiveExport");if(ex)ex.onclick=exportCsv;
}
window.CVArchive={render,records,exportCsv,auditFields};setTimeout(()=>{try{render()}catch{}},450);ensureEeveeArchive();migrateLegacySnapshots();render();
})();