(()=>{"use strict";
const N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
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
function stats(){
 const rows=(state.cards||[]).filter(c=>!c.archivedSold&&N(c.value)>0).map(c=>({c,t:tier(c),value:N(c.value)*Math.max(1,N(c.quantity)||1)}));
 const sums={A:0,B:0,C:0,REF:0,NONE:0};for(const r of rows)sums[r.t.tier]=(sums[r.t.tier]||0)+r.value;
 return {rows,sums,total:rows.reduce((a,r)=>a+r.value,0)};
}
function apply(){
 const s=stats();for(const r of s.rows){r.c.primeValuationTier=r.t.tier;r.c.primeValuationReason=r.t.reason}save();render();try{window.CVPrimeAttention?.render?.()}catch{}return s;
}
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 let box=document.querySelector("#primeValuationQuality");
 if(!box){box=document.createElement("section");box.id="primeValuationQuality";box.className="qaPanel";host.prepend(box)}
 const s=stats();
 box.innerHTML='<b>Valor de cartera · Calidad PRIME</b>'+
  '<div class="statsGrid">'+
   '<div><span>A · fuerte</span><b>'+EUR(s.sums.A)+'</b></div>'+
   '<div><span>B · usable</span><b>'+EUR(s.sums.B)+'</b></div>'+
   '<div><span>C · revisar</span><b>'+EUR(s.sums.C)+'</b></div>'+
   '<div><span>Referencia</span><b>'+EUR(s.sums.REF)+'</b></div>'+
  '</div>'+
  '<small>A exige identidad, condición/grado, fuente trazable y valor ≤7 días. B admite evidencia trazable ≤30 días. C y Referencia no deben tratarse como valor firme para decisiones de venta/reinversión.</small>'+
  (s.rows.filter(r=>["C","REF"].includes(r.t.tier)&&r.value>=20).slice(0,8).map(r=>'<div class="qaRow"><span>'+r.c.name+'<small> · '+r.t.reason+'</small></span><b>'+EUR(r.value)+'</b></div>').join(""));
}
setTimeout(apply,120);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)apply()});
window.CVPrimeValuation={tier,stats,apply,render};
})();