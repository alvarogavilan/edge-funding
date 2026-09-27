(()=>{"use strict";
const N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function ageDays(v){if(!v)return Infinity;const t=new Date(v).getTime();return Number.isFinite(t)?Math.max(0,(Date.now()-t)/86400000):Infinity}
function evidence(c){
 const mp=c.marketPricing||{},cm=c.conditionMarket||{},gv=c.gradedValuation||{};
 const at=mp.checkedAt||cm.checkedAt||gv.checkedAt||gv.at||c.updatedAt||"";
 const url=mp.url||cm.sourceUrl||gv.url||gv.sourceUrl||"";
 const source=mp.source||cm.source||gv.source||"";
 return {at,url,source,age:ageDays(at)};
}
function tier(c){
 if(c.archivedSold||!(N(c.value)>0))return {tier:"NONE",reason:"Sin valor activo"};
 const ev=evidence(c),ref=c.valuationStatus==="reference",graded=String(c.grading||"RAW").toUpperCase()!=="RAW";
 const identity=!!(String(c.name||"").trim()&&String(c.set||"").trim()&&String(c.language||"").trim());
 const condition=graded?!!(String(c.grade||"").trim()&&String(c.cert||"").trim()):!!String(c.condition||c.grade||"").trim();
 const sourceOk=!!(ev.source&&/^https?:\/\//i.test(String(ev.url||"")));
 if(ref)return {tier:"REF",reason:"Valor de referencia",ev,identity,condition,sourceOk};
 if(identity&&condition&&sourceOk&&ev.age<=7)return {tier:"A",reason:"Identidad + condición/grado + fuente + ≤7d",ev,identity,condition,sourceOk};
 if(identity&&sourceOk&&ev.age<=30)return {tier:"B",reason:"Fuente trazable ≤30d; falta cierre PRIME completo",ev,identity,condition,sourceOk};
 return {tier:"C",reason:ev.age>30?"Valor antiguo o sin fecha reciente":"Evidencia incompleta",ev,identity,condition,sourceOk};
}
/* V84.0 · Buckets prudentes de valoración.
   CONFIRMED  = tier A + sin estado referencia + (graduada: ≥3 ventas reales mismo grado).
   PROVISIONAL= fuente trazable ≤30 días pero falta cierre (condición pendiente, graduada sin comparables, referencia de condición).
   STALE      = tenía fuente pero la evidencia supera 30 días o no tiene fecha.
   UNSUPPORTED= solo referencia o sin fuente trazable.
   Nunca se modifica c.value: solo se clasifica. En "condition-reference" con oferta del mismo estado
   se usa como importe prudente el menor entre c.value y esa oferta observada (dato real, no inventado). */
const GRADED_MIN_COMPS=3;
function bucket(c){
 const t=tier(c),units=Math.max(1,N(c.quantity)||1),raw=N(c.value);
 if(t.tier==="NONE")return {bucket:"NONE",unit:0,amount:0,units,reason:t.reason,t};
 const graded=String(c.grading||"RAW").toUpperCase()!=="RAW";
 const comps=N(c.gradedValuation?.count);
 const condRef=c.valuationStatus==="condition-reference";
 const ask=N(c.conditionMarket?.askEUR),matched=c.conditionMarket?.matched===true;
 let unit=raw,adjusted=false;
 if(condRef&&matched&&ask>0&&ask<raw){unit=ask;adjusted=true}
 const out=(b,reason)=>({bucket:b,unit,amount:unit*units,units,reason,adjusted,rawValue:raw,t,graded,comps});
 if(t.tier==="REF")return out("UNSUPPORTED","Solo referencia de mercado · no es valor del ejemplar");
 if(t.tier==="C")return t.sourceOk||t.ev?.source?out("STALE",t.ev.age===Infinity?"Evidencia sin fecha":"Evidencia de "+Math.floor(t.ev.age)+" días"):out("UNSUPPORTED","Sin fuente trazable (URL + fuente)");
 if(condRef)return out("PROVISIONAL",adjusted?"Ajustado a oferta observada en su condición ("+EUR(ask)+") · no es venta cerrada":"Referencia de condición sin cierre");
 if(graded&&comps<GRADED_MIN_COMPS)return out("PROVISIONAL","Graduada sin "+GRADED_MIN_COMPS+" ventas reales del mismo grado ("+comps+")");
 if(t.tier==="A")return out("CONFIRMED","Identidad + condición/grado + fuente ≤7 días");
 return out("PROVISIONAL",!t.condition?"Condición pendiente":"Evidencia ≤30 días sin cierre completo");
}
function basisUnit(c){
 if(c.landedCostUnit!=null&&N(c.landedCostUnit)>0)return N(c.landedCostUnit);
 if(c.purchase!=null&&c.purchase!==""&&N(c.purchase)>=0)return N(c.purchase)+(N(c.purchaseShipping)+N(c.purchaseFees))/Math.max(1,N(c.quantity)||1);
 return null;
}
function realized(){
 try{
  const rows=window.CVArchive?.records?.()||[];
  const known=rows.filter(x=>x.result!=null);
  return {known:known.length,total:rows.length,pnl:known.reduce((a,x)=>a+N(x.result),0),unknown:rows.length-known.length};
 }catch{return {known:0,total:0,pnl:0,unknown:0}}
}
function portfolio(){
 const rows=(state.cards||[]).filter(c=>!c.archivedSold&&N(c.value)>0).map(c=>({c,b:bucket(c),basis:basisUnit(c)}));
 const sum=k=>rows.filter(r=>r.b.bucket===k).reduce((a,r)=>a+r.b.amount,0);
 const withBasis=rows.filter(r=>r.basis!=null);
 const invested=withBasis.reduce((a,r)=>a+r.basis*r.b.units,0);
 const latentRows=k=>withBasis.filter(r=>k.includes(r.b.bucket));
 const latent=k=>latentRows(k).reduce((a,r)=>a+(r.b.amount-r.basis*r.b.units),0);
 return {rows,confirmed:sum("CONFIRMED"),provisional:sum("PROVISIONAL"),stale:sum("STALE"),unsupported:sum("UNSUPPORTED"),
  invested,basisPositions:withBasis.length,noBasisPositions:rows.length-withBasis.length,
  latentConfirmed:latent(["CONFIRMED"]),latentConfirmedN:latentRows(["CONFIRMED"]).length,
  latentPrudent:latent(["CONFIRMED","PROVISIONAL"]),latentPrudentN:latentRows(["CONFIRMED","PROVISIONAL"]).length,
  excludedLatentN:withBasis.length-latentRows(["CONFIRMED","PROVISIONAL"]).length,
  realized:realized()};
}
function stats(){
 const rows=(state.cards||[]).filter(c=>!c.archivedSold&&N(c.value)>0).map(c=>({c,t:tier(c),value:N(c.value)*Math.max(1,N(c.quantity)||1)}));
 const sums={A:0,B:0,C:0,REF:0,NONE:0};for(const r of rows)sums[r.t.tier]=(sums[r.t.tier]||0)+r.value;
 return {rows,sums,total:rows.reduce((a,r)=>a+r.value,0)};
}
function apply(){
 const s=stats();for(const r of s.rows){const b=bucket(r.c);r.c.primeValuationTier=r.t.tier;r.c.primeValuationReason=r.t.reason;r.c.primeValuationBucket=b.bucket;r.c.primeValuationPrudent=b.amount}
 save();render();try{window.CVRenderCollection?.()}catch{}try{window.CVPrimeAttention?.render?.()}catch{}return s;
}
const LABEL={CONFIRMED:"Confirmado",PROVISIONAL:"Provisional",STALE:"Antiguo >30d",UNSUPPORTED:"Sin evidencia suficiente"};
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 let box=document.querySelector("#primeValuationQuality");
 if(!box){box=document.createElement("section");box.id="primeValuationQuality";box.className="qaPanel";host.prepend(box)}
 const p=portfolio(),sign=v=>(v>=0?"+":"")+EUR(v);
 const weak=p.rows.filter(r=>r.b.bucket!=="CONFIRMED"&&N(r.b.rawValue)>=5).sort((a,b)=>N(b.b.rawValue)-N(a.b.rawValue));
 box.innerHTML='<b>Valor de cartera · PRIME prudente</b>'+
  '<div class="statsGrid">'+
   '<div><span>Confirmado</span><b>'+EUR(p.confirmed)+'</b></div>'+
   '<div><span>Provisional</span><b>'+EUR(p.provisional)+'</b></div>'+
   '<div><span>Antiguo >30d</span><b>'+EUR(p.stale)+'</b></div>'+
   '<div><span>Sin evidencia</span><b>'+EUR(p.unsupported)+'</b></div>'+
   '<div><span>Coste invertido (con basis)</span><b>'+EUR(p.invested)+'</b></div>'+
   '<div><span>P&amp;L latente prudente</span><b>'+(p.latentPrudentN?sign(p.latentPrudent)+' · '+p.latentPrudentN+' pos.':'Sin posiciones válidas')+'</b></div>'+
   '<div><span>P&amp;L realizado</span><b>'+(p.realized.known?sign(p.realized.pnl)+' · '+p.realized.known+' ventas':'Coste pendiente')+'</b></div>'+
  '</div>'+
  '<small>Confirmado exige identidad, condición/grado, fuente trazable ≤7 días y, en graduadas, ≥3 ventas reales del mismo grado. P&amp;L latente solo cuenta posiciones con coste conocido y valor confirmado/provisional'+(p.excludedLatentN?' ('+p.excludedLatentN+' con coste excluidas por valor sin evidencia)':'')+'; '+p.noBasisPositions+' posiciones sin coste no entran.</small>'+
  (weak.length?'<details><summary>'+weak.length+' valoraciones no firmes</summary>'+weak.slice(0,20).map(r=>'<div class="qaRow"><span>'+E(r.c.name)+'<small> · '+E(LABEL[r.b.bucket]||r.b.bucket)+' · '+E(r.b.reason)+'</small></span><b>'+EUR(r.b.amount)+(r.b.adjusted?'<small> (ref. '+EUR(r.b.rawValue)+')</small>':'')+'</b></div>').join("")+'</details>':'');
}
setTimeout(apply,120);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)apply()});
window.CVPrimeValuation={tier,bucket,basisUnit,portfolio,stats,apply,render,LABEL};
})();
