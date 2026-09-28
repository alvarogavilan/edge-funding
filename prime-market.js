(()=>{"use strict";
const Q=s=>document.querySelector(s),N=v=>Number(v)||0;
const EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const BUY=new Set(["BUY-ONE","BUY-SCALE"]);
function refs(x){return [x.trend,x.avg30,x.avg7,x.avg1].map(N).filter(v=>v>0)}
function exactOffer(x){
 const lang=String(x.offerLanguage||x.language||"").trim(),seller=String(x.seller||"").trim();
 const sellerSpecific=!!seller&&!/oferta .*publicada|cardmarket\s*·?\s*(oferta|mínimo|minimo)|mercado público|vendedor verificado|oferta (italiana|francesa|alemana|inglesa|japonesa) más barata/i.test(seller);
 return !!(N(x.price)>0&&sellerSpecific&&/^https?:\/\//i.test(String(x.url||""))&&
  String(x.variant||"").trim()&&String(x.condition||"").trim()&&lang&&!/pendiente|unknown|desconoc/i.test(lang)&&x.languageVerified===true);
}
function exitEvidence(x){
 const r=refs(x),ev=x.marketEvidence||{},idNow=window.CVIdentity?.key?.(x)||"",idOk=!!(ev.identityKey&&idNow&&ev.identityKey===idNow);
 const age=window.CVIdentity?.ageHours?.(x.evidenceCheckedAt||ev.at)??Infinity,fresh=age<=24;
 const sameMarket=x.sameMarketComparableVerified===true&&idOk;
 const currentExit=N(ev.currentExitEUR);
 const soldVerified=x.closedSaleVerified===true||ev.closedSaleVerified===true;
 const soldSameIdentity=soldVerified&&(x.closedSaleIdentityVerified===true||ev.closedSaleIdentityVerified===true);
 const soldSameLanguage=soldVerified&&(x.closedSaleLanguageVerified===true||ev.closedSaleLanguageVerified===true);
 const soldUsable=soldVerified&&soldSameIdentity&&soldSameLanguage;
 const sales=soldUsable?N(x.sales30||x.recentSalesCount||ev.sales30):0;
 const lastSale=soldUsable?N(x.lastSalePrice||ev.lastSaleEUR):0;
 const soldMedian=soldUsable?N(x.soldMedianEUR||ev.soldMedianEUR):0;
 const soldSample=soldUsable?N(x.soldSample||ev.soldSample):0;
 const askVerified=x.activeAskVerified===true||ev.activeAskVerified===true||currentExit>0;
 const verified=soldUsable||askVerified;
 return {ok:sameMarket&&verified&&fresh,sameMarket,sales,lastSale,soldMedian,soldSample,currentExit,
  refs:r.length,verified,idOk,fresh,age,soldVerified,soldSameIdentity,soldSameLanguage,soldUsable,askVerified};
}
function absorption(x){
 const sold=x.sales30==null?null:N(x.sales30),qty=x.marketEvidence?.currentQty??x.available??null;
 if(sold==null||qty==null)return {rate:null,days:null,label:"SIN DATO"};
 const q=Math.max(0,N(qty)),s=Math.max(0,N(sold));
 const rate=(s+q)>0?s/(s+q)*100:0;
 const days=s>0?q/(s/30):null;
 const label=rate>=50?"FUERTE":rate>=25?"MEDIA":rate>0?"BAJA":"SIN ABSORCIÓN";
 return {rate,days,label,sold30:s,currentQty:q};
}
function liquidityBand(x){
 const s7=x.sales7==null?null:N(x.sales7),s30=x.sales30==null?null:N(x.sales30),s90=x.sales90==null?null:N(x.sales90);
 if(s7==null&&s30==null&&s90==null)return {label:"SIN DATO VERIFICADO",score:null};
 const base=s30!=null?s30:(s7!=null?s7*4:(s90||0)/3);
 const score=Math.round(Math.max(0,Math.min(100,base*8)));
 const label=base>=8?"ALTA":base>=3?"MEDIA":base>0?"BAJA":"SIN VENTAS VERIFICADAS";
 return {label,score};
}
function depth(x){
 const p=(Array.isArray(x.depthPrices)?x.depthPrices:[]).map(N).filter(v=>v>0).sort((a,b)=>a-b);
 const first=p[0]||N(x.price),second=p[1]||0;
 const gap=first>0&&second>0?(second-first)/first*100:null;
 const units=Math.max(p.length,N(x.sellerQty),0),available=N(x.available);
 return {prices:p,first,second,gap,units,available};
}
function consistency(x){
 const r=refs(x);if(r.length<2)return {score:null,range:null};
 const lo=Math.min(...r),hi=Math.max(...r),range=hi>0?(hi-lo)/hi:0;
 return {score:Math.round(Math.max(0,100-range*140)),range};
}
function conservative(x){
 const ev=x.marketEvidence||{},ee=exitEvidence(x),
  soldMedian=ee.soldMedian,soldSample=ee.soldSample,lastSale=ee.lastSale,currentExit=N(ev.currentExitEUR);
 let gross=0,kind="none",haircut=0;
 if(ee.soldUsable&&soldMedian>0&&soldSample>=3){gross=soldMedian;kind="closed-sale-median";haircut=.95}
 else if(ee.soldUsable&&lastSale>0){gross=lastSale;kind="closed-sale-last";haircut=.90}
 else if(currentExit>0){gross=currentExit;kind="active-exit-ask";haircut=.85}
 const prudentGross=gross*haircut;
 const sellFee=prudentGross*.05;
 const logisticsReserve=3;
 const exit=Math.max(0,prudentGross-sellFee-logisticsReserve),edge=exit-N(x.price),roi=N(x.price)>0?edge/N(x.price)*100:0;
 return {gross,prudentGross,sellFee,logisticsReserve,exit,edge,roi,kind,haircut,soldMedian,soldSample,lastSale,currentExit};
}
function evidenceConfidence(x){
 const ex=exactOffer(x),ee=exitEvidence(x),d=depth(x);
 const stale=x.expiresAt?new Date(x.expiresAt)<=new Date():false;
 const signals=[ex,ee.sameMarket,ee.verified,ee.idOk,ee.fresh,d.units>=2,!stale,x.integrityBlocked!==true,ee.soldSample>=3||ee.sales>=3];
 const n=signals.filter(Boolean).length;
 return {label:n>=6?"A":n>=5?"B":n>=3?"C":"NO VERIFICADA",score:Math.round(n/signals.length*100),checks:n,total:signals.length};
}
function quality(x){
 const ex=exactOffer(x),ee=exitEvidence(x),d=depth(x),c=consistency(x),econ=conservative(x),supply=window.CVSupplyRisk?.stateOf?.(x)||{risk:"unknown",verified:false},abs=absorption(x);
 const stale=x.expiresAt?new Date(x.expiresAt)<=new Date():false;
 const owned=(state.cards||[]).filter(card=>!card.archivedSold).some(card=>{try{return window.CVIdentity?.sameOwnedCard?.(card,x)===true}catch{return false}});
 const checks=[
  ["No está ya en Mi colección",!owned||x.allowScaleOwned===true],
  ["Oferta exacta",ex],
  ["Comparable mismo idioma/mercado",ee.sameMarket],
  ["Evidencia de salida",ee.ok],
  ["Venta realizada verificada · misma identidad/idioma",ee.soldUsable],
  ["Identidad evidencia intacta",ee.idOk],
  ["Evidencia ≤24h",ee.fresh],
  ["Salida económica basada en evidencia",econ.kind!=="none"],
  ["Margen ≥ 40 €",econ.edge>=40],
  ["ROI ≥ 35%",econ.roi>=35],
  ["Precio ≥ 20 €",N(x.price)>=20],
  ["Datos vigentes",!stale],
  ["Integridad estructural",x.integrityBlocked!==true],
  ["Sin riesgo reprint alto verificado",!(supply.verified&&supply.risk==="high")]
 ];
 const passed=checks.filter(([,ok])=>ok).length;
 let label=passed===checks.length?"APTA PARA REVISIÓN DE COMPRA":passed>=5?"WATCH · FALTA EVIDENCIA":"NO COMPRAR / REVISAR";
 return {checks,passed,total:checks.length,label,ex,ee,d,c,econ,stale,supply,abs,confidence:evidenceConfidence(x)};
}
function harden(){
 let changed=false;
 for(const x of (state.manualOpportunities||[])){
  if(!BUY.has(x.approval))continue;
  const q=quality(x);
  if(q.passed<q.total){
   x.prePrimeApproval=x.prePrimeApproval||x.approval;
   x.approval="WATCH";
   x.status="WATCH PRIME · COMPRA BLOQUEADA POR EVIDENCIA";
   x.primeGate={at:new Date().toISOString(),passed:q.passed,total:q.total,
    missing:q.checks.filter(([,ok])=>!ok).map(([k])=>k)};
   changed=true;
  }
 }
 if(changed)save();
 return changed;
}
function metric(name,value,note=""){
 return '<div class="qaRow"><span>'+E(name)+(note?'<small> · '+E(note)+'</small>':'')+'</span><b>'+E(value)+'</b></div>';
}
function render(){
 const host=Q("#todaySimple");if(!host)return;
 let box=Q("#primeMarketQuality");
 if(!box){box=document.createElement("section");box.id="primeMarketQuality";box.className="qaPanel";host.prepend(box)}
 const rows=(state.manualOpportunities||[]).slice().sort((a,b)=>N(b.price)-N(a.price));
 const buy=rows.filter(x=>BUY.has(x.approval)),watch=rows.filter(x=>x.approval==="WATCH");
 const audited=rows.map(x=>({x,q:quality(x)}));
 const exact=audited.filter(z=>z.q.ex).length,same=audited.filter(z=>z.q.ee.sameMarket).length;
 const deep=audited.filter(z=>z.q.d.units>=2).length,anoms=audited.filter(z=>z.q.c.range!=null&&z.q.c.range>.45).length;
 const best=audited.filter(z=>z.q.passed===z.q.total).sort((a,b)=>b.q.econ.edge-a.q.econ.edge).slice(0,5);
 const soldEvidence=audited.filter(z=>z.q.ee.soldUsable).length;
 box.innerHTML='<b>Card Vault PRIME · Calidad de mercado</b>'+
  '<div class="statsGrid">'+
   '<div><span>Ofertas auditadas</span><b>'+rows.length+'</b></div>'+
   '<div><span>Oferta exacta completa</span><b>'+exact+'</b></div>'+
   '<div><span>Comparable mismo mercado</span><b>'+same+'</b></div>'+
   '<div><span>Ventas realizadas verificadas</span><b>'+soldEvidence+'</b></div>'+
   '<div><span>Evidencia fresca ≤24h</span><b>'+audited.filter(z=>z.q.ee.fresh).length+'</b></div>'+
   '<div><span>Profundidad ≥2 niveles</span><b>'+deep+'</b></div>'+
   '<div><span>Anomalías de referencia</span><b>'+anoms+'</b></div>'+
   '<div><span>BUY tras gate PRIME</span><b>'+buy.length+'</b></div>'+
  '</div>'+
  '<small>La caja no interviene. Un agregado de precios nunca eleva a COMPRAR. BUY admite cualquier idioma, pero exige oferta exacta, idioma/variante/condición, vendedor, URL y comparable del MISMO idioma/mercado, evidencia de salida, +40 € NETOS aprox. y ROI ≥35% después del recorte prudente, 5% de comisión y 3 € de reserva logística.</small>'+
  (best.length?'<div class="sectionHead"><h3>Superan el gate PRIME</h3></div>'+best.map(({x,q})=>
   '<div class="qaRow"><span>'+E(x.name)+'<small> · '+E(x.offerLanguage||x.language||"")+' · '+E(x.condition||"")+'</small></span><b>edge '+EUR(q.econ.edge)+' · '+q.econ.roi.toFixed(0)+'%</b></div>'
  ).join(""):'<div class="qaRow"><span>Compras con evidencia completa</span><b>0 · correcto si no existen</b></div>')+
  '<details><summary>Ver auditoría de oportunidades</summary>'+audited.slice(0,30).map(({x,q})=>{
   const gap=q.d.gap==null?"sin 2º nivel":q.d.gap.toFixed(1)+"%";
   const cons=q.c.score==null?"sin muestra":q.c.score+"/100",liq=liquidityBand(x),conf=q.confidence,supply=q.supply,abs=q.abs;
   return '<article class="microNote"><b>'+E(x.name)+'</b> · '+E(q.label)+'<br>'+
    'Entrada '+EUR(x.price)+' · '+(q.econ.kind==="active-exit-ask"?"salida neta ESTIMADA por ofertas activas ":"salida neta basada en VENTAS CERRADAS ")+EUR(q.econ.exit)+' ('+E(q.econ.kind)+') · comisión '+EUR(q.econ.sellFee)+' · reserva logística '+EUR(q.econ.logisticsReserve)+' · margen '+EUR(q.econ.edge)+' · ROI '+q.econ.roi.toFixed(1)+'%<br>'+
    'Profundidad observable: '+q.d.units+' nivel(es) · gap 1º→2º '+gap+' · liquidez verificada '+liq.label+(liq.score==null?'':' '+liq.score+'/100')+' · absorción 30d '+(abs.rate==null?'sin dato':abs.rate.toFixed(0)+'% '+abs.label)+' · stock observado '+(abs.days==null?'sin dato':abs.days.toFixed(0)+' días al ritmo 30d')+' · evidencia '+conf.label+' '+conf.score+'/100 · supply/reprint '+(supply.verified?supply.risk.toUpperCase():'SIN EVIDENCIA')+' · mediana VENTAS CERRADAS '+(q.ee.soldMedian>0?EUR(q.ee.soldMedian)+' ('+q.ee.soldSample+' comps)':'SIN VENTAS VERIFICADAS')+' · consistencia referencias '+cons+'<br>'+
    q.checks.map(([k,ok])=>(ok?'✓ ':'✕ ')+E(k)).join(' · ')+'</article>';
  }).join("")+'</details>';
}
function run(){harden();render();try{window.renderOpportunityEngine?.()}catch{}try{window.CVTodaySimple?.render?.()}catch{}try{window.CVReinvestmentCommittee?.render?.()}catch{}try{window.CVFinalOps?.render?.()}catch{}}
window.CVPrimeMarket={run,quality,exactOffer,exitEvidence,depth,consistency,liquidityBand,evidenceConfidence,absorption};
setTimeout(run,100);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)run()});
})();