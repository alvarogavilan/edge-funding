(()=>{"use strict";
const N=v=>Number(v)||0;
function parse(v){const t=new Date(v||0).getTime();return Number.isFinite(t)?t:null}
function auditOpportunity(x){
 const issues=[],now=Date.now(),checked=parse(x.checkedAt),expires=parse(x.expiresAt),ev=parse(x.evidenceCheckedAt||x.marketEvidence?.at);
 if(checked!=null&&checked>now+5*60*1000)issues.push("checkedAt futuro");
 if(expires!=null&&expires<=now)issues.push("oferta caducada");
 if(checked!=null&&expires!=null&&expires<=checked)issues.push("expiresAt ≤ checkedAt");
 if(ev!=null&&ev>now+5*60*1000)issues.push("evidencia futura");
 if(ev!=null&&checked!=null&&ev+5*60*1000<checked)issues.push("evidencia anterior al snapshot de oferta");
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
function run(){
 const opps=(state.manualOpportunities||[]).map(x=>({type:"opportunity",id:x.id,name:x.name,issues:auditOpportunity(x)})).filter(x=>x.issues.length);
 const cards=(state.cards||[]).map(x=>({type:"card",id:x.id,name:x.name,issues:auditCard(x)})).filter(x=>x.issues.length);
 const all=[...opps,...cards];
 for(const row of opps){
  const x=(state.manualOpportunities||[]).find(o=>o.id===row.id);if(!x)continue;
  x.integrityIssues=row.issues;x.integrityBlocked=true;
  if(["BUY-ONE","BUY-SCALE"].includes(x.approval)){
   x.preIntegrityApproval=x.approval;x.approval="WATCH";x.status="WATCH PRIME · INTEGRIDAD BLOQUEADA";
  }
 }
 for(const x of (state.manualOpportunities||[])){
  if(!opps.some(r=>r.id===x.id)){x.integrityIssues=[];x.integrityBlocked=false}
 }
 state.primeIntegrity={at:new Date().toISOString(),issues:all.slice(0,100)};
 save();render();return all;
}
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 let box=document.querySelector("#primeIntegrityGuard");
 if(!box){box=document.createElement("section");box.id="primeIntegrityGuard";box.className="qaPanel";host.prepend(box)}
 const rows=state.primeIntegrity?.issues||[];
 box.innerHTML='<b>Integrity Guard PRIME</b>'+
  '<div class="statsGrid"><div><span>Anomalías</span><b>'+rows.length+'</b></div><div><span>Oportunidades bloqueadas</span><b>'+rows.filter(x=>x.type==="opportunity").length+'</b></div></div>'+
  (rows.length?rows.slice(0,12).map(x=>'<div class="qaRow"><span>'+String(x.name||x.id)+'<small> · '+x.issues.join(" · ")+'</small></span><b>REVISAR</b></div>').join(""):'<div class="qaRow"><span>Estado</span><b>Sin anomalías estructurales</b></div>')+
  '<small>Las anomalías no se borran ni corrigen inventando datos. Si afectan a una oportunidad, BUY queda bloqueado hasta resolverlas.</small>';
}
setTimeout(run,220);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)run()});
window.CVIntegrityGuard={run,render,auditOpportunity,auditCard};
})();