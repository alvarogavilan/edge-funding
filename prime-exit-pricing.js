(()=>{"use strict";
const N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
function listing(id){return (state.saleListings||[]).find(x=>x.id===id)||null}
function card(id){return (state.cards||[]).find(c=>c.id===id)||null}
function numOrNull(v){const s=String(v??"").trim();return s===""?null:N(s.replace(",","."))}
function intOrNull(v){const s=String(v??"").trim();return s===""?null:Math.max(0,Math.floor(N(s)))}
function safeUrl(v){return /^https?:\/\//i.test(String(v||"").trim())?String(v).trim():""}
function capture(id){
 const x=listing(id),c=x&&card(x.cardId);if(!x||!c)return;
 const exact=confirm("Confirma que la evidencia corresponde al MISMO activo: nombre, set, número, idioma, variante, condición/grado y mercado.");
 if(!exact){alert("No se guarda como evidencia de salida.");return}
 const source=(prompt("Fuente exacta de salida:","Cardmarket")||"").trim();
 const url=safeUrl(prompt("URL exacta de la evidencia:","")||"");
 if(!source||!url){alert("Hace falta fuente y URL.");return}
 const lowestAsk=numOrNull(prompt("Oferta comparable más baja actual (€), si existe:",""));
 const soldRaw=(prompt("Ventas REALES comparables recientes separadas por ; (ej. 169;175;180):","")||"").trim();
 const sold=soldRaw?soldRaw.split(";").map(v=>N(v.replace(",","."))).filter(v=>v>0).sort((a,b)=>a-b):[];
 const median=sold.length?(sold.length%2?sold[(sold.length-1)/2]:(sold[sold.length/2-1]+sold[sold.length/2])/2):null;
 const sales30=intOrNull(prompt("Número de ventas comparables en 30 días, si está visible:",""));
 const sellers=intOrNull(prompt("Vendedores comparables actuales, si está visible:",""));
 const depthRaw=(prompt("Siguientes precios comparables separados por ; (ej. 169;174.90;180):","")||"").trim();
 const depth=depthRaw?depthRaw.split(";").map(v=>N(v.replace(",","."))).filter(v=>v>0).sort((a,b)=>a-b):[];
 const ev={at:new Date().toISOString(),identityKey:window.CVIdentity?.key?.(c)||"",source,url,lowestAskEUR:lowestAsk&&lowestAsk>0?lowestAsk:null,
  soldPrices:sold,soldMedianEUR:median,soldSample:sold.length,sales30,sellers,depthPrices:depth};
 x.exitEvidenceHistory=Array.isArray(x.exitEvidenceHistory)?x.exitEvidenceHistory:[];
 if(x.exitEvidence?.at)x.exitEvidenceHistory.push({...x.exitEvidence,replacedAt:ev.at});
 x.exitEvidenceHistory=x.exitEvidenceHistory.slice(-20);
 x.exitEvidence=ev;
 save();renderOne(x,c);
 try{window.CVSalesDesk?.render?.()}catch{}
 alert("Evidencia de salida guardada.");
}
function calc(x,c){
 const ev=x.exitEvidence||{},idOk=!!(ev.identityKey&&ev.identityKey===(window.CVIdentity?.key?.(c)||""));
 const age=window.CVIdentity?.ageHours?.(ev.at)??Infinity,fresh=age<=24;
 const landed=N(c.landedCostUnit)||N(c.purchase)||0,minProfit=N(state.operationPolicy?.minProfitEUR)||40;
 const feePct=5,neededNet=landed+minProfit,neededGross=neededNet/(1-feePct/100);
 const marketRefs=[N(ev.lowestAskEUR),N(ev.soldMedianEUR)].filter(v=>v>0);
 const marketAnchor=marketRefs.length?Math.min(...marketRefs):0;
 const floor=Math.max(N(x.floor),neededGross);
 const ask=marketAnchor>0?Math.max(floor,marketAnchor):Math.max(N(x.price),floor);
 const net=ask*(1-feePct/100),profit=landed>0?net-landed:null,roi=landed>0&&profit!=null?profit/landed*100:null;
 let rotation="SIN DATO VERIFICADO";
 if(ev.sales30!=null)rotation=N(ev.sales30)>=8?"ALTA":N(ev.sales30)>=3?"MEDIA":N(ev.sales30)>0?"BAJA":"SIN VENTAS 30D";
 const executable=idOk&&fresh&&!!(ev.source&&ev.url)&&marketAnchor>0;
 return {idOk,fresh,age,landed,minProfit,neededGross,marketAnchor,floor,ask,net,profit,roi,rotation,executable};
}
function renderOne(x,c){
 const r=calc(x,c);x.primeExit=r;return r
}
function render(){
 for(const x of (state.saleListings||[])){const c=card(x.cardId);if(c)renderOne(x,c)}
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-sale-evidence]");if(!b)return;
 e.preventDefault();e.stopPropagation();capture(b.dataset.saleEvidence);
});
window.CVPrimeExitPricing={capture,calc,render};
setTimeout(render,250);
})();