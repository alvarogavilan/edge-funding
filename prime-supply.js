(()=>{"use strict";
const N=v=>Number(v)||0;
function get(id){return (state.manualOpportunities||[]).find(x=>x.id===id)||null}
function safeUrl(v){return /^https?:\/\//i.test(String(v||"").trim())?String(v).trim():""}
function record(id){
 const x=get(id);if(!x)return;
 const status=(prompt("Estado de impresión / supply:\nunknown · printing · discontinued · out","unknown")||"unknown").trim().toLowerCase();
 const risk=(prompt("Riesgo de reedición verificado:\nunknown · low · medium · high","unknown")||"unknown").trim().toLowerCase();
 if(!["unknown","printing","discontinued","out"].includes(status)){alert("Estado no válido.");return}
 if(!["unknown","low","medium","high"].includes(risk)){alert("Riesgo no válido.");return}
 const source=(prompt("Fuente exacta de supply/reprint:","")||"").trim();
 const url=safeUrl(prompt("URL exacta de la fuente:","")||"");
 const note=(prompt("Nota factual breve (qué confirma la fuente):","")||"").trim();
 if((status!=="unknown"||risk!=="unknown")&&(!source||!url)){
  alert("Para marcar supply/reprint hace falta fuente y URL verificables.");return
 }
 const ev={at:new Date().toISOString(),status,risk,source,url,note,identityKey:window.CVIdentity?.key?.(x)||""};
 x.supplyEvidenceHistory=Array.isArray(x.supplyEvidenceHistory)?x.supplyEvidenceHistory:[];
 if(x.supplyEvidence?.at)x.supplyEvidenceHistory.push({...x.supplyEvidence,replacedAt:ev.at});
 x.supplyEvidenceHistory=x.supplyEvidenceHistory.slice(-20);
 x.supplyEvidence=ev;
 x.printStatus=status;x.reprintRisk=risk;
 x.reprintRiskVerified=!!(source&&url&&risk!=="unknown");
 x.supplyStatusVerified=!!(source&&url&&status!=="unknown");
 save();
 try{window.CVSupplyRisk?.apply?.(x)}catch{}
 try{window.CVPrimeMarket?.run?.()}catch{}
 try{window.CVManualOpportunities?.render?.()}catch{}
 alert("Evidencia supply/reprint guardada.");
}
function stateOf(x){
 const ev=x?.supplyEvidence||{},id=window.CVIdentity?.key?.(x)||"",idOk=!!(ev.identityKey&&id&&ev.identityKey===id);
 const age=window.CVIdentity?.ageHours?.(ev.at)??Infinity,fresh=age<=168;
 const risk=String(ev.risk||x?.reprintRisk||"unknown"),status=String(ev.status||x?.printStatus||"unknown");
 const verified=!!(ev.source&&ev.url&&idOk&&fresh);
 return {risk,status,verified,idOk,fresh,age,source:ev.source||"",url:ev.url||"",note:ev.note||""};
}
function apply(x){
 const s=stateOf(x);x.supplyRiskBlocked=s.verified&&s.risk==="high";
 if(x.supplyRiskBlocked&&["BUY-ONE","BUY-SCALE"].includes(x.approval)){
  x.preSupplyApproval=x.approval;x.approval="WATCH";x.status="WATCH PRIME · RIESGO REPRINT/SUPPLY";
  save();
 }
 return s;
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-prime-supply]");if(!b)return;
 e.preventDefault();e.stopPropagation();record(b.dataset.primeSupply);
});
window.CVSupplyRisk={record,stateOf,apply};
})();