(()=>{"use strict";
const Q=s=>document.querySelector(s),N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
function ageDays(d){if(!d)return null;const t=new Date(d).getTime();return Number.isFinite(t)?Math.floor((Date.now()-t)/86400000):null}
function items(){
 const out=[];
 for(const c of (state.cards||[])){
  if(c.archivedSold)continue;
  const conditionUnknown=!String(c.condition||c.grade||"").trim()||(c.grading==="RAW"&&["", "RAW"].includes(String(c.condition||c.grade||"").toUpperCase()));
  const marketAt=c.marketPricing?.checkedAt||c.conditionMarket?.checkedAt||c.updatedAt||"";
  const stale=ageDays(marketAt);
  if(conditionUnknown&&N(c.value)>=20)out.push({kind:"condition",priority:90,name:c.name,text:"Cerrar condición antes de valorar/vender",cardId:c.id});
  if(stale!=null&&stale>30&&N(c.value)>=20)out.push({kind:"stale",priority:70,name:c.name,text:"Valor de mercado con "+stale+" días",cardId:c.id});
  if(c.purchase==null&&["investment","sell","reinvest"].includes(c.purpose||""))out.push({kind:"basis",priority:45,name:c.name,text:"Coste individual desconocido · ROI no disponible",cardId:c.id});
  if(c.valuationStatus==="reference")out.push({kind:"reference",priority:85,name:c.name,text:"Valor solo de referencia · falta cierre",cardId:c.id});
  if(c.primeValuationTier==="C"&&N(c.value)>=20)out.push({kind:"valuation-c",priority:82,name:c.name,text:"Valoración PRIME C · "+(c.primeValuationReason||"evidencia incompleta"),cardId:c.id});
 }
 for(const h of (state.saleHistory||[])){
  const ledger=(state.investmentLedger||[]).find(x=>x.id===h.id);
  const s=String(ledger?.fulfillmentStatus||h.fulfillmentStatus||"");
  if(s==="sold-awaiting-shipment")out.push({kind:"shipment",priority:100,name:h.name,text:"Venta pendiente de envío · "+EUR(h.net),saleId:h.id});
  else if(s==="sold-awaiting-payment")out.push({kind:"payment",priority:95,name:h.name,text:"Cobro pendiente · "+EUR(h.net),saleId:h.id});
 }
 for(const x of (state.manualOpportunities||[])){
  if(x.approval==="VERIFY-LANGUAGE")out.push({kind:"opportunity",priority:80,name:x.name,text:"Oportunidad bloqueada · verificar idioma/estado",oppId:x.id});
  const at=x.evidenceCheckedAt||x.marketEvidence?.at;
  if(at){
   const age=(Date.now()-new Date(at).getTime())/36e5;
   if(Number.isFinite(age)&&age>24)out.push({kind:"evidence-expired",priority:98,name:x.name,text:"Evidencia PRIME caducada · "+age.toFixed(1)+" h",oppId:x.id});
   else if(Number.isFinite(age)&&age>=20)out.push({kind:"evidence-expiring",priority:88,name:x.name,text:"Evidencia PRIME vence pronto · "+age.toFixed(1)+" h",oppId:x.id});
  }
  if(x.integrityBlocked)out.push({kind:"integrity",priority:99,name:x.name,text:"Integrity Guard · "+(x.integrityIssues||[]).join(" · "),oppId:x.id});
 }
 const rec=(state.primeIntegrity?.issues||[]).filter(x=>x.type==="reconciliation");
 if(rec.length)out.push({kind:"reconciliation",priority:100,name:"Libro ↔ Archivo",text:rec.length+" descuadre(s) contable(s) · revisar antes de usar caja"});
 for(const p of (state.sealedProducts||[])){
  if(!(N(p.currentPrice)>=20)||!p.buyUrl)continue;
  const at=p.primeEvidence?.at;
  if(!at){
   out.push({kind:"sealed-evidence-missing",priority:72,name:p.name,text:"Sellado · falta evidencia PRIME ejecutable",sealedId:p.id});
   continue;
  }
  const age=(Date.now()-new Date(at).getTime())/36e5;
  if(Number.isFinite(age)&&age>24)out.push({kind:"sealed-evidence-expired",priority:98,name:p.name,text:"Sellado · evidencia PRIME caducada · "+age.toFixed(1)+" h",sealedId:p.id});
  else if(Number.isFinite(age)&&age>=20)out.push({kind:"sealed-evidence-expiring",priority:88,name:p.name,text:"Sellado · evidencia PRIME vence pronto · "+age.toFixed(1)+" h",sealedId:p.id});
  if(p.primeEvidence?.identityKey&&window.CVPrimeSealedEvidence?.key?.(p)&&p.primeEvidence.identityKey!==window.CVPrimeSealedEvidence.key(p))
   out.push({kind:"sealed-identity",priority:99,name:p.name,text:"Sellado · evidencia no coincide con identidad actual",sealedId:p.id});
 }
 try{for(const k of (window.CVConflictGuard?.detect?.()||[]))out.push({kind:"conflict-"+k.kind,priority:k.priority,name:k.name,text:"Conflicto · "+k.text})}catch{}
 return out.sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
}
function render(){
 const host=Q("#todaySimple");if(!host)return;
 let box=Q("#primeAttention");
 if(!box){box=document.createElement("section");box.id="primeAttention";box.className="qaPanel";host.prepend(box)}
 const rows=items();
 const high=rows.filter(x=>x.priority>=90).length;
 const rowHtml=x=>'<div class="qaRow"><span>'+x.name+'<small> · '+x.text+'</small>'+(x.oppId?'<button type="button" class="buyButton secondary" data-prime-evidence="'+x.oppId+'">Refrescar evidencia</button>':'')+(x.sealedId?'<button type="button" class="buyButton secondary" data-prime-sealed="'+x.sealedId+'">Refrescar sellado</button>':'')+(x.kind==="shipment"&&x.saleId?'<button type="button" class="buyButton secondary" data-prime-shipped="'+x.saleId+'">Confirmar envío</button>':'')+(x.kind==="payment"&&x.saleId?'<button type="button" class="buyButton secondary" data-prime-paid="'+x.saleId+'">Confirmar cobro</button>':'')+'</span><b>'+(x.priority>=90?"AHORA":x.priority>=70?"REVISAR":"CUANDO TOQUE")+'</b></div>';
 box.innerHTML='<b>Bandeja PRIME · Atención</b>'+
  '<div class="statsGrid"><div><span>Pendientes</span><b>'+rows.length+'</b></div><div><span>Prioridad alta</span><b>'+high+'</b></div></div>'+
  (rows.length?rows.slice(0,6).map(rowHtml).join("")+(rows.length>6?'<details><summary>Ver '+(Math.min(rows.length,30)-6)+' pendientes más</summary>'+rows.slice(6,30).map(rowHtml).join("")+'</details>':''):'<div class="qaRow"><span>Estado</span><b>Sin pendientes críticos</b></div>')+
  '<small>No crea compras ni ventas. Solo concentra tareas que pueden provocar errores, pérdida de datos o decisiones con evidencia incompleta.</small>';
}
document.addEventListener("click",e=>{
 const shipped=e.target.closest("[data-prime-shipped]");if(shipped){e.preventDefault();e.stopPropagation();window.CVLedgerWorkflow?.confirmShipment?.(shipped.dataset.primeShipped);return}
 const paid=e.target.closest("[data-prime-paid]");if(paid){e.preventDefault();e.stopPropagation();window.CVLedgerWorkflow?.confirmSaleCash?.(paid.dataset.primePaid)}
});
function run(){render()}
setTimeout(run,180);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)run()});
window.CVPrimeAttention={items,render,run};
})();