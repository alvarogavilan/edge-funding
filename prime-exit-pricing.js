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
function policy(){
 const op=state.operationPolicy||{};
 const fee=op.sellFeePct==null||op.sellFeePct===""?5:Math.max(0,Math.min(40,N(op.sellFeePct)));
 const ship=Math.max(0,N(op.sellShippingEUR));
 return {feePct:fee,sellShipping:ship,minProfit:N(op.minProfitEUR)||40,minROI:N(op.minROI)||35};
}
function configure(){
 const op=state.operationPolicy=state.operationPolicy||{},cur=policy();
 const f=prompt("Comisión real de venta (%) · Cardmarket vendedor particular suele ser 5%:",String(cur.feePct));if(f==null)return;
 const sh=prompt("Coste medio de envío que pagas tú por venta (€):",String(cur.sellShipping));if(sh==null)return;
 op.sellFeePct=Math.max(0,Math.min(40,N(String(f).replace(",","."))));op.sellShippingEUR=Math.max(0,N(String(sh).replace(",",".")));
 save();render();try{window.CVSalesDesk?.render?.()}catch{}
}
function basisOf(c){
 const b=window.CVPrimeValuation?.basisUnit?.(c);
 if(b!==undefined)return b;
 return c.landedCostUnit!=null?N(c.landedCostUnit):(c.purchase==null?null:N(c.purchase));
}
function calc(x,c){
 const ev=x.exitEvidence||{},idNow=window.CVIdentity?.key?.(c)||"",idOk=!!(ev.identityKey&&ev.identityKey===idNow);
 const age=window.CVIdentity?.ageHours?.(ev.at)??Infinity,fresh=age<=24;
 const pol=policy(),keep=1-pol.feePct/100,landed=basisOf(c),minProfit=pol.minProfit;
 const breakEven=landed!=null?(landed+pol.sellShipping)/keep:null;
 const targetFloor=landed!=null?(landed+minProfit+pol.sellShipping)/keep:null;
 const neededGross=targetFloor;
 const marketRefs=[N(ev.lowestAskEUR),N(ev.soldMedianEUR)].filter(v=>v>0);
 const marketAnchor=marketRefs.length?Math.min(...marketRefs):0;
 const floor=Math.max(N(x.floor),breakEven||0);
 const ask=marketAnchor>0?Math.max(floor,marketAnchor):Math.max(N(x.price),floor);
 const netOf=p=>p*keep-pol.sellShipping;
 const net=netOf(ask),profit=landed!=null?net-landed:null,roi=landed>0&&profit!=null?profit/landed*100:null;
 const listedNet=netOf(N(x.price)),listedProfit=landed!=null?listedNet-landed:null,listedRoi=landed>0&&listedProfit!=null?listedProfit/landed*100:null;
 let rotation="SIN DATO VERIFICADO";
 if(ev.sales30!=null)rotation=N(ev.sales30)>=8?"ALTA":N(ev.sales30)>=3?"MEDIA":N(ev.sales30)>0?"BAJA":"SIN VENTAS 30D";
 const depth=Array.isArray(ev.depthPrices)?ev.depthPrices.length:0;
 const executable=idOk&&fresh&&!!(ev.source&&ev.url)&&marketAnchor>0;
 const alerts=[];
 if(breakEven!=null&&N(x.price)>0&&N(x.price)<breakEven-0.005)alerts.push({level:"high",text:"Precio publicado por debajo del floor económico (break-even "+EUR(breakEven)+")"});
 else if(targetFloor!=null&&N(x.price)>0&&N(x.price)<targetFloor-0.005)alerts.push({level:"mid",text:"Precio publicado por debajo del objetivo +"+EUR(minProfit)+" ("+EUR(targetFloor)+")"});
 if(breakEven!=null&&N(x.floor)>0&&N(x.floor)<breakEven-0.005)alerts.push({level:"mid",text:"Mínimo interno "+EUR(x.floor)+" por debajo del break-even"});
 if(landed==null)alerts.push({level:"info",text:"Coste individual desconocido · sin floor económico ni ROI"});
 if(ev.at&&!idOk)alerts.push({level:"high",text:"Evidencia de salida de otra identidad · no usar"});
 else if(ev.at&&!fresh)alerts.push({level:"mid",text:"Evidencia de salida caducada ("+Math.floor(age)+" h)"});
 if(marketAnchor>0&&targetFloor!=null&&marketAnchor<targetFloor)alerts.push({level:"mid",text:"Comparable actual "+EUR(marketAnchor)+" por debajo del objetivo: no rebajar para perseguirlo"});
 if(executable&&N(x.price)>marketAnchor*1.15)alerts.push({level:"info",text:"Publicado >15% sobre el comparable más bajo · rotación lenta probable"});
 return {idOk,fresh,age,landed,minProfit,feePct:pol.feePct,sellShipping:pol.sellShipping,breakEven,targetFloor,neededGross,marketAnchor,floor,ask,net,profit,roi,
  listedPrice:N(x.price),listedNet,listedProfit,listedRoi,rotation,executable,alerts,
  soldMedian:N(ev.soldMedianEUR)||null,soldSample:N(ev.soldSample),sales30:ev.sales30??null,sellers:ev.sellers??null,depth,lowestAsk:N(ev.lowestAskEUR)||null,source:ev.source||"",url:ev.url||"",evidenceAt:ev.at||""};
}
function renderOne(x,c){
 const r=calc(x,c);x.primeExit=r;return r
}
function render(){
 for(const x of (state.saleListings||[])){const c=card(x.cardId);if(c)renderOne(x,c)}
}
document.addEventListener("click",e=>{
 if(e.target.closest("[data-sale-policy]")){e.preventDefault();configure();return}
 const b=e.target.closest("[data-sale-evidence]");if(!b)return;
 e.preventDefault();e.stopPropagation();capture(b.dataset.saleEvidence);
});
window.CVPrimeExitPricing={capture,calc,render,policy,configure};
setTimeout(render,250);
})();