(()=>{"use strict";
const N=v=>Number(v)||0;
function norm(v){return String(v??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ")}
function key(p){return [norm(p.universe),norm(p.name),norm(p.set),norm(p.productType),norm(p.language)].join("|")}
function get(id){return (state.sealedProducts||[]).find(p=>p.id===id)||null}
function safeUrl(v){return /^https?:\/\//i.test(String(v||"").trim())?String(v).trim():""}
function numOrNull(v){const s=String(v??"").trim();return s===""?null:N(s.replace(",","."))}
function intOrNull(v){const s=String(v??"").trim();return s===""?null:Math.max(0,Math.floor(N(s)))}
function record(id){
 const p=get(id);if(!p)return;
 const exact=confirm("Confirma que la evidencia corresponde al MISMO producto, idioma, variante/edición y mercado.");
 if(!exact){alert("No se guarda como evidencia PRIME.");return}
 const seller=(prompt("Vendedor / tienda exacta de la oferta:","")||"").trim();
 const source=(prompt("Fuente de salida comparable:","Cardmarket")||"").trim();
 const url=safeUrl(prompt("URL exacta de la evidencia de salida:","")||"");
 if(!seller||!source||!url){alert("Vendedor, fuente y URL son obligatorios.");return}
 const exitComparableEUR=numOrNull(prompt("Salida comparable conservadora actual (€):",""));
 const soldRaw=(prompt("Ventas REALES comparables recientes separadas por ; (ej. 119;125;130):","")||"").trim();
 const sold=soldRaw?soldRaw.split(";").map(v=>N(v.replace(",","."))).filter(v=>v>0).sort((a,b)=>a-b):[];
 const soldMedian=sold.length?(sold.length%2?sold[(sold.length-1)/2]:(sold[sold.length/2-1]+sold[sold.length/2])/2):null;
 const sales30=intOrNull(prompt("Ventas comparables en 30 días, si están verificadas:",""));
 const currentQty=intOrNull(prompt("Unidades comparables actuales en mercado, si están visibles:",""));
 const ev={at:new Date().toISOString(),identityKey:key(p),exactComparable:true,seller,source,url,
  exitComparableEUR:exitComparableEUR&&exitComparableEUR>0?exitComparableEUR:null,soldPrices:sold,soldMedianEUR:soldMedian,soldSample:sold.length,sales30,currentQty};
 if(!(ev.exitComparableEUR>0||ev.soldMedianEUR>0)){alert("Hace falta al menos una salida comparable o una muestra de ventas reales.");return}
 p.primeEvidenceHistory=Array.isArray(p.primeEvidenceHistory)?p.primeEvidenceHistory:[];
 if(p.primeEvidence?.at)p.primeEvidenceHistory.push({...p.primeEvidence,replacedAt:ev.at});
 p.primeEvidenceHistory=p.primeEvidenceHistory.slice(-20);
 p.primeEvidence=ev;p.seller=seller;
 save();
 document.querySelector("#sealedDecision")?.dispatchEvent(new Event("change"));
 try{window.CVPrimeAttention?.render?.()}catch{}
 alert("Evidencia PRIME de sellado guardada.");
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-prime-sealed]");if(!b)return;
 e.preventDefault();e.stopPropagation();record(b.dataset.primeSealed);
});
window.CVPrimeSealedEvidence={record,key};
})();