(()=>{"use strict";
const N=v=>Number(v)||0;
function parse(v){const t=new Date(v||0).getTime();return Number.isFinite(t)?t:null}
function auditOpportunity(x){
 const issues=[],now=Date.now(),checked=parse(x.checkedAt),expires=parse(x.expiresAt),ev=parse(x.evidenceCheckedAt||x.marketEvidence?.at);
 if(checked!=null&&checked>now+5*60*1000)issues.push("checkedAt futuro");
 if(expires!=null&&expires<=now)issues.push("oferta caducada");
 if(checked!=null&&expires!=null&&expires<=checked)issues.push("expiresAt ≤ checkedAt");
 if(ev!=null&&ev>now+5*60*1000)issues.push("evidencia futura");
 if(x.languageVerified===true&&/pendiente|unknown|desconoc/i.test(String(x.offerLanguage||x.language||"")))issues.push("idioma marcado verificado pero desconocido");
 if(x.sameMarketComparableVerified===true&&!(x.marketEvidence?.identityKey))issues.push("comparable verificado sin sello de identidad");
 if(x.exitEvidenceVerified===true&&!x.marketEvidence&&!N(x.sales30)&&!N(x.lastSalePrice)&&!N(x.soldMedianEUR))issues.push("salida verificada sin evidencia material");
 return issues;
}
function auditCard(c){
 const issues=[];
 if(c.landedCostUnit!=null&&N(c.landedCostUnit)<N(c.purchase))issues.push("coste aterrizado < precio compra");
 if(c.archivedSold&&N(c.quantity)>1)issues.push("archivada como vendida con cantidad >1");
 if(c.grading&&String(c.grading).toUpperCase()!=="RAW"&&!String(c.grade||"").trim())issues.push("graduada sin nota");
 if(c.cert&&String(c.grading||"RAW").toUpperCase()==="RAW")issues.push("certificado en carta RAW");
 return issues;
}
function auditTransactions(){
 const issues=[],hist=state.saleHistory||[],ledger=(state.investmentLedger||[]).filter(x=>x.type==="sell");
 const dup=(rows,label)=>{const seen=new Set();for(const r of rows){if(!r?.id)continue;if(seen.has(r.id))issues.push({type:"reconciliation",id:r.id,name:r.name||r.id,issues:[label+" duplicado"]});seen.add(r.id)}};
 dup(hist,"saleHistory id");dup(ledger,"ledger sell id");
 for(const h of hist){
  const l=ledger.find(x=>x.id===h.id);
  const row=[];
  if(!l)row.push("venta en Archivo sin operación sell en Libro");
  else{
   if(Math.abs(N(l.unitPrice)-N(h.unitPrice))>.009)row.push("precio venta Libro ≠ Archivo");
   if(Math.abs(N(l.qty||1)-N(h.qty||1))>.009)row.push("cantidad Libro ≠ Archivo");
   if(Math.abs(N(l.shipping)-N(h.shipping))>.009)row.push("envío Libro ≠ Archivo");
   if(Math.abs(N(l.fees)-N(h.fees))>.009)row.push("comisiones Libro ≠ Archivo");
   if(String(l.fulfillmentStatus||"")!==String(h.fulfillmentStatus||""))row.push("estado de cobro/envío desincronizado");
   const expected=N(h.unitPrice)*N(h.qty||1)-N(h.shipping)-N(h.fees);
   if(Math.abs(expected-N(h.net))>.009)row.push("neto Archivo inconsistente");
  }
  if(!h.cardSnapshot)row.push("venta sin snapshot autocontenido");
  if(row.length)issues.push({type:"reconciliation",id:h.id,name:h.name||h.id,issues:row});
 }
 for(const l of ledger){
  if(l.assetType!=="card"&&!String(l.assetKey||"").startsWith("card:"))continue;
  if(!hist.some(h=>h.id===l.id))issues.push({type:"reconciliation",id:l.id,name:l.name||l.id,issues:["venta de carta en Libro sin expediente en Archivo"]});
 }
 return issues;
}
function run(){
 const opps=(state.manualOpportunities||[]).map(x=>({type:"opportunity",id:x.id,name:x.name,issues:auditOpportunity(x)})).filter(x=>x.issues.length);
 const cards=(state.cards||[]).map(x=>({type:"card",id:x.id,name:x.name,issues:auditCard(x)})).filter(x=>x.issues.length);
 const reconciliation=auditTransactions();
 const all=[...opps,...cards,...reconciliation];
 for(const row of opps){
  const x=(state.manualOpportunities||[]).find(o=>o.id===row.id);if(!x)continue;
  x.integrityIssues=row.issues;x.integrityBlocked=true;
  if(["BUY-ONE","BUY-SCALE"].includes(x.approval)){
   x.preIntegrityApproval=x.approval;x.approval="WATCH";x.status="WATCH PRIME · INTEGRIDAD BLOQUEADA";
  }
 }
 for(const x of (state.manualOpportunities||[])){
  if(!opps.some(r=>r.id===x.id)){
   const wasBlocked=x.integrityBlocked===true,prev=x.preIntegrityApproval;
   x.integrityIssues=[];x.integrityBlocked=false;
   if(wasBlocked&&["BUY-ONE","BUY-SCALE"].includes(prev)&&x.approval==="WATCH"){
    x.approval=prev;x.status=prev==="BUY-SCALE"?"COMPRAR AHORA · PRIME · ESCALA":"COMPRAR AHORA · PRIME · 1 UNIDAD";
   }
  }
 }
 state.primeIntegrity={at:new Date().toISOString(),issues:all.slice(0,100)};
 save();render();
 try{window.CVPrimeMarket?.run?.()}catch{}
 try{window.CVManualOpportunities?.render?.()}catch{}
 try{window.CVPrimeAttention?.render?.()}catch{}
 return all;
}
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 let box=document.querySelector("#primeIntegrityGuard");
 if(!box){box=document.createElement("section");box.id="primeIntegrityGuard";box.className="qaPanel";host.prepend(box)}
 const rows=state.primeIntegrity?.issues||[];
 box.innerHTML='<b>Integrity Guard PRIME</b>'+
  '<div class="statsGrid"><div><span>Anomalías</span><b>'+rows.length+'</b></div><div><span>Oportunidades bloqueadas</span><b>'+rows.filter(x=>x.type==="opportunity").length+'</b></div><div><span>Descuadres contables</span><b>'+rows.filter(x=>x.type==="reconciliation").length+'</b></div></div>'+
  (rows.length?rows.slice(0,12).map(x=>'<div class="qaRow"><span>'+String(x.name||x.id)+'<small> · '+x.issues.join(" · ")+'</small></span><b>REVISAR</b></div>').join(""):'<div class="qaRow"><span>Estado</span><b>Sin anomalías estructurales</b></div>')+
  '<small>Las anomalías no se borran ni corrigen inventando datos. Si afectan a una oportunidad, BUY queda bloqueado hasta resolverlas.</small>';
}
setTimeout(run,220);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)run()});
window.CVIntegrityGuard={run,render,auditOpportunity,auditCard,auditTransactions};
})();