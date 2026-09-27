(()=>{"use strict";
const N=v=>Number(v)||0;
function row(id){return (state.manualOpportunities||[]).find(x=>x.id===id)||null}
function safeUrl(v){return /^https?:\/\//i.test(String(v||"").trim())?String(v).trim():""}
function intOrNull(v){const s=String(v??"").trim();return s===""?null:Math.max(0,Math.floor(N(s)))}
function numOrNull(v){const s=String(v??"").trim();return s===""?null:N(s.replace(",","."))}
function desk(id){
 const x=row(id);if(!x)return;
 const exact=confirm("Confirma que la evidencia corresponde al MISMO nombre, set, número, idioma, variante, condición/grado y mercado comparable de esta oportunidad.");
 if(!exact){alert("No se guarda como evidencia comparable.");return}
 const source=(prompt("Fuente de la evidencia:","Cardmarket")||"").trim();
 const url=safeUrl(prompt("URL exacta de evidencia:","")||"");
 if(!source||!url){alert("Hace falta fuente y URL verificable.");return}
 const lastSaleEUR=numOrNull(prompt("Última venta REAL comparable (€), si existe:",""));
 const lastSaleDate=(prompt("Fecha última venta YYYY-MM-DD, si existe:","")||"").trim();
 const soldRaw=(prompt("Precios de ventas REALES comparables recientes separados por ; (ej. 95;99.90;105). Vacío = sin muestra:","")||"").trim();
 const soldPrices=soldRaw?soldRaw.split(";").map(v=>N(v.replace(",","."))).filter(v=>v>0).sort((a,b)=>a-b):[];
 const soldMedian=soldPrices.length?(soldPrices.length%2?soldPrices[(soldPrices.length-1)/2]:(soldPrices[soldPrices.length/2-1]+soldPrices[soldPrices.length/2])/2):null;
 const sales7=intOrNull(prompt("Ventas reales comparables en 7 días. Vacío = sin dato:",""));
 const sales30=intOrNull(prompt("Ventas reales comparables en 30 días. Vacío = sin dato:",""));
 const sales90=intOrNull(prompt("Ventas reales comparables en 90 días. Vacío = sin dato:",""));
 const currentSellers=intOrNull(prompt("Vendedores actuales comparables. Vacío = sin dato:",""));
 const currentQty=intOrNull(prompt("Cantidad actual comparable en mercado. Vacío = sin dato:",""));
 const depthRaw=(prompt("Precios de los siguientes niveles comparables separados por coma (ej. 70, 79.90, 85). Vacío = sin dato:","")||"").trim();
 const depthPrices=depthRaw?depthRaw.split(/[,;\s]+/).map(v=>N(v.replace(",","."))).filter(v=>v>0):[];
 const currentExitEUR=numOrNull(prompt("Precio de salida comparable actual (€), si está verificado:",""));
 const identityKey=window.CVIdentity?.key?.(x)||"";
 const evidence={
  at:new Date().toISOString(),identityKey,source,url,exactComparable:true,lastSaleEUR:lastSaleEUR>0?lastSaleEUR:null,lastSaleDate,
  soldPrices,soldMedianEUR:soldMedian,soldSample:soldPrices.length,
  sales7,sales30,sales90,currentSellers,currentQty,depthPrices,currentExitEUR:currentExitEUR>0?currentExitEUR:null,
  language:x.offerLanguage||x.language||"",variant:x.variant||"",condition:x.condition||"",grading:x.grading||"",grade:x.grade||""
 };
 x.marketEvidenceHistory=Array.isArray(x.marketEvidenceHistory)?x.marketEvidenceHistory:[];
 if(x.marketEvidence?.at)x.marketEvidenceHistory.push({...x.marketEvidence,replacedAt:evidence.at});
 x.marketEvidenceHistory=x.marketEvidenceHistory.slice(-20);
 x.marketEvidence=evidence;
 if(depthPrices.length)x.depthPrices=depthPrices;
 if(currentSellers!=null)x.currentSellers=currentSellers;
 if(currentQty!=null)x.available=currentQty;
 x.sales7=sales7;x.sales30=sales30;x.sales90=sales90;
 x.lastSalePrice=lastSaleEUR>0?lastSaleEUR:null;x.lastSaleDate=lastSaleDate;
 x.soldMedianEUR=soldMedian;x.soldSample=soldPrices.length;
 x.identityKey=identityKey;
 x.sameMarketComparableVerified=true;
 x.exitEvidenceVerified=!!((lastSaleEUR>0)||(soldPrices.length>0)||(sales30!=null&&sales30>0)||(currentExitEUR>0));
 x.evidenceSource=source;x.evidenceUrl=url;x.evidenceCheckedAt=new Date().toISOString();
 save();
 try{window.CVPrimeMarket?.run?.()}catch{}
 try{window.CVManualOpportunities?.render?.()}catch{}
 alert("Evidencia PRIME guardada. No se eleva automáticamente a COMPRAR; el gate solo valida o bloquea.");
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-prime-evidence]");if(!b)return;
 e.preventDefault();e.stopPropagation();desk(b.dataset.primeEvidence);
});
window.CVPrimeEvidenceDesk={desk};
})();