(()=>{"use strict";
/* V84.6 · HOLD / REVIEW SELL / SELL-REDEPLOY por activo propio de inversión.
   No usa solo subida/bajada. Cruza: coste (basis), valor prudente (bucket), evidencia de salida ejecutable,
   liquidez verificada, concentración, datos antiguos, supply/reprint verificado y coste de oportunidad
   (compras PRIME ejecutables reales ahora). Datos insuficientes => REVIEW, nunca recomendación fuerte.
   Nunca vende ni cambia anuncios: solo lectura. */
const N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const CONC=0.35;
function buyAlternatives(){
 try{const a=window.CVStrictOpportunity;if(!a)return {n:0,known:false};
  const rows=[...(a.manualRows?.()||[]),...(a.euRows?.()||[]),...(a.sealedRows?.()||[])];
  return {n:rows.filter(x=>x.status==="buy").length,known:true};
 }catch{return {n:0,known:false}}
}
function supplyOf(c){
 const s=c.supplyEvidence||c.purchaseThesis?.supply||null;
 if(!s)return {risk:"unknown",verified:false};
 const at=c.supplyEvidence?.at,fresh=at?(Date.now()-new Date(at).getTime())/36e5<=168:!!c.purchaseThesis?.supply;
 return {risk:String(s.risk||"unknown"),verified:!!s.verified||(!!(c.supplyEvidence?.source&&c.supplyEvidence?.url)&&fresh)};
}
function isInvestment(c,listing){
 const b=window.CVPrimeValuation?.basisUnit?.(c);
 return !!listing||b!=null||["investment","sell","reinvest"].includes(c.purpose||"");
}
function evaluate(c,ctx){
 const V=window.CVPrimeValuation,b=V?.bucket?.(c)||{bucket:"UNSUPPORTED",amount:0,reason:"Sin motor de valoración"};
 const basisU=V?.basisUnit?.(c)??null,units=Math.max(1,N(c.quantity)||1),basis=basisU==null?null:basisU*units;
 const listing=(state.saleListings||[]).find(x=>x.cardId===c.id&&x.status==="active")||null;
 const px=listing?window.CVPrimeExitPricing?.calc?.(listing,c):null;
 const pol=state.operationPolicy||{},minProfit=N(pol.minProfitEUR)||40,minROI=N(pol.minROI)||35;
 const valueOk=["CONFIRMED","PROVISIONAL"].includes(b.bucket);
 const conc=ctx.prudentTotal>0&&valueOk?b.amount/ctx.prudentTotal:null;
 const supply=supplyOf(c),supplyHigh=supply.verified&&supply.risk==="high";
 const exitExec=!!px?.executable,exitProfit=exitExec?px.profit:null,exitRoi=exitExec?px.roi:null;
 const latent=basis!=null&&valueOk?b.amount-basis:null;
 const missing=[];
 if(basis==null)missing.push("coste individual");
 if(!valueOk)missing.push(b.bucket==="STALE"?"valor actualizado (<30 días)":"valor con evidencia");
 if(!exitExec)missing.push("evidencia de salida ejecutable (≤24 h, misma identidad)");
 const why=[],alts=ctx.alts;
 let label="REVIEW",strength="datos insuficientes";
 const economicExit=exitExec&&basis!=null&&exitProfit!=null&&exitProfit>=minProfit&&exitRoi!=null&&exitRoi>=minROI;
 const belowFloor=px?.alerts?.some(a=>a.level==="high");
 if(belowFloor){label="REVIEW SELL";strength="alerta de precio";why.push("Anuncio activo con precio bajo el floor económico")}
 else if(economicExit&&(alts.n>0||supplyHigh||(conc!=null&&conc>=CONC))){
  label="SELL / REDEPLOY";strength="evidencia completa";
  why.push("Salida ejecutable deja "+EUR(exitProfit)+" ("+exitRoi.toFixed(0)+"%)");
  if(alts.n>0)why.push(alts.n+" compra(s) PRIME ejecutable(s) donde reasignar");
  if(supplyHigh)why.push("Riesgo reprint/supply ALTO verificado");
  if(conc!=null&&conc>=CONC)why.push("Concentración "+(conc*100).toFixed(0)+"% del valor prudente");
 }
 else if(economicExit){label="REVIEW SELL";strength="salida económica sin destino";why.push("Salida verificada con +"+EUR(exitProfit)+", pero no hay alternativa PRIME ejecutable: vender solo si necesitas liquidez")}
 else if(supplyHigh||(conc!=null&&conc>=CONC)){label="REVIEW SELL";strength="riesgo de cartera";if(supplyHigh)why.push("Riesgo reprint ALTO verificado");if(conc!=null&&conc>=CONC)why.push("Concentración "+(conc*100).toFixed(0)+"%")}
 else if(listing&&!exitExec){label="REVIEW SELL";strength="anuncio sin evidencia";why.push("Ya está publicada pero sin evidencia de salida: registrar comparable antes de ajustar precio")}
 else if(valueOk&&basis!=null){
  label="HOLD";strength=exitExec?"evidencia completa":"sin evidencia de salida";
  if(exitExec&&exitProfit!=null&&exitProfit<minProfit)why.push("Salida actual deja "+EUR(exitProfit)+" < objetivo "+EUR(minProfit)+": no vender barato");
  else why.push("Sin disparador de venta verificado");
 }
 else {label="REVIEW";strength="datos insuficientes";why.push("Falta: "+missing.join(", "))}
 try{const ms=window.CVMarketFeed?.signal?.({ref:c});if(ms&&ms.zone&&ms.zone!=="INSUFICIENTE")why.push("Histórico propio: zona "+ms.zone+" (p"+ms.rank+" "+ms.rankWindow+"d) · solo contexto")}catch{}
 if(label!=="REVIEW"&&missing.length)why.push("Pendiente: "+missing.join(", "));
 return {c,label,strength,why,missing,bucket:b,basis,latent,conc,supply,listing,px,exitExec,exitProfit,exitRoi,liquidity:px?.rotation||"SIN DATO VERIFICADO",stale:b.bucket==="STALE"};
}
function evaluateAll(){
 const V=window.CVPrimeValuation,p=V?.portfolio?.();
 const ctx={prudentTotal:p?p.confirmed+p.provisional:0,alts:buyAlternatives()};
 const rows=(state.cards||[]).filter(c=>!c.archivedSold&&N(c.value)>0).filter(c=>isInvestment(c,(state.saleListings||[]).some(x=>x.cardId===c.id&&x.status==="active"))).map(c=>evaluate(c,ctx));
 const order={"SELL / REDEPLOY":0,"REVIEW SELL":1,"REVIEW":2,"HOLD":3};
 rows.sort((a,b)=>order[a.label]-order[b.label]||N(b.bucket.amount)-N(a.bucket.amount));
 return {rows,ctx};
}
function render(){
 const tab=document.querySelector("#rebalance");if(!tab)return;
 let box=document.querySelector("#primePositionDecision");
 if(!box){box=document.createElement("section");box.id="primePositionDecision";box.className="qaPanel";const anchor=document.querySelector("#salesDeskPanel");anchor?anchor.before(box):tab.prepend(box)}
 const {rows,ctx}=evaluateAll(),count=k=>rows.filter(r=>r.label===k).length,sg=v=>v==null?"—":(v>=0?"+":"")+EUR(v);
 box.innerHTML='<b>Decisión de cartera PRIME · HOLD / SELL</b>'+
  '<div class="statsGrid"><div><span>SELL / REDEPLOY</span><b>'+count("SELL / REDEPLOY")+'</b></div><div><span>REVIEW SELL</span><b>'+count("REVIEW SELL")+'</b></div><div><span>HOLD</span><b>'+count("HOLD")+'</b></div><div><span>REVIEW · datos</span><b>'+count("REVIEW")+'</b></div></div>'+
  '<small>Coste de oportunidad: '+(ctx.alts.known?ctx.alts.n+' compra(s) PRIME ejecutable(s) ahora':'motor de oportunidades no disponible')+'. Sin evidencia suficiente la lectura es REVIEW, nunca una orden. Nada se vende ni se cambia automáticamente.</small>'+
  rows.map(r=>'<details class="decisionRow"><summary><span class="decisionPill d-'+r.label.split(" ")[0].toLowerCase()+'">'+E(r.label)+'</span><span class="decisionName">'+E(r.c.name)+'<small>'+E(r.strength)+'</small></span></summary>'+
   '<div class="microNote">'+r.why.map(E).join(" · ")+'</div>'+
   '<div class="qaRow"><span>Coste (basis)</span><b>'+(r.basis==null?'DESCONOCIDO':EUR(r.basis))+'</b></div>'+
   '<div class="qaRow"><span>Valor prudente</span><b>'+EUR(r.bucket.amount)+' · '+E(window.CVPrimeValuation?.LABEL?.[r.bucket.bucket]||r.bucket.bucket)+'</b></div>'+
   '<div class="qaRow"><span>P&amp;L latente prudente</span><b>'+sg(r.latent)+'</b></div>'+
   '<div class="qaRow"><span>Salida ejecutable</span><b>'+(r.exitExec?EUR(r.px.ask)+' · '+sg(r.exitProfit):'SIN EVIDENCIA')+'</b></div>'+
   '<div class="qaRow"><span>Liquidez verificada</span><b>'+E(r.liquidity)+'</b></div>'+
   '<div class="qaRow"><span>Concentración</span><b>'+(r.conc==null?'—':(r.conc*100).toFixed(0)+'%')+'</b></div>'+
   '<div class="qaRow"><span>Supply / reprint</span><b>'+(r.supply.verified?E(r.supply.risk.toUpperCase()):'SIN EVIDENCIA')+'</b></div>'+
  '</details>').join("");
}
setTimeout(render,300);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
document.addEventListener("click",e=>{if(e.target.closest('[data-tab="rebalance"]'))setTimeout(render,30)});
window.CVPositionDecision={evaluate,evaluateAll,render};
})();
