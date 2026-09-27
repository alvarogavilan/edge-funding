(()=>{"use strict";
const N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
function byId(id){return (state.saleHistory||[]).find(x=>x.id===id)||null}
function safeUrl(v){return /^https?:\/\//i.test(String(v||"").trim())?String(v).trim():""}
function addCheck(id){
 const h=byId(id);if(!h)return;
 const snap=h.cardSnapshot||h;
 const priceRaw=prompt("Precio actual verificable del MISMO activo (€):\nMismo idioma, variante, condición/grado y mercado comparable.",String(h.unitPrice||""));
 if(priceRaw==null)return;
 const price=N(String(priceRaw).replace(",","."));
 if(!(price>0)){alert("Precio no válido.");return}
 const source=(prompt("Fuente exacta del control:","Cardmarket")||"").trim();
 const url=safeUrl(prompt("URL exacta de la evidencia:","")||"");
 if(!source||!url){alert("El control postventa exige fuente y URL verificables.");return}
 const lastSaleRaw=prompt("Última venta REAL comparable (€), si existe. Déjalo vacío si no está verificada:","");
 const lastSale=String(lastSaleRaw??"").trim()===""?null:N(String(lastSaleRaw).replace(",","."));
 const sales30Raw=prompt("Número de ventas reales comparables en 30 días, si la fuente lo muestra. Déjalo vacío si no existe:","");
 const sales30=String(sales30Raw??"").trim()===""?null:Math.max(0,Math.floor(N(sales30Raw)));
 const currentSellersRaw=prompt("Número de vendedores actuales comparables, si está visible. Déjalo vacío si no existe:","");
 const currentSellers=String(currentSellersRaw??"").trim()===""?null:Math.max(0,Math.floor(N(currentSellersRaw)));
 const exact=confirm("Confirma: ¿la evidencia corresponde al MISMO idioma, variante, condición/grado y mercado comparable que la unidad vendida?");
 if(!exact){alert("No se guarda como comparable exacto.");return}
 const at=new Date().toISOString(),sale=N(h.unitPrice),delta=sale>0?(price-sale)/sale*100:null;
 h.postSaleChecks=Array.isArray(h.postSaleChecks)?h.postSaleChecks:[];
 h.postSaleChecks.push({at,priceEUR:price,source,url,lastSaleEUR:lastSale&&lastSale>0?lastSale:null,sales30,currentSellers,
  exactComparable:true,language:snap.language||"",variant:snap.variant||"",condition:snap.condition||"",grading:snap.grading||"",grade:snap.grade||"",
  deltaVsSalePct:delta});
 h.postSaleChecks=h.postSaleChecks.slice(-24);
 save();try{window.CVArchive?.render?.()}catch{}
 alert("Control postventa guardado con evidencia exacta.");
}
function latest(h){const a=Array.isArray(h.postSaleChecks)?h.postSaleChecks:[];return a.length?a[a.length-1]:null}
function inject(){
 for(const h of (state.saleHistory||[])){
  const el=document.querySelector('[data-post-sale="'+CSS.escape(h.id)+'"]');if(!el||el.dataset.bound==="1")continue;
  el.dataset.bound="1";el.onclick=e=>{e.preventDefault();e.stopPropagation();addCheck(h.id)};
  const p=latest(h);if(!p)continue;
  const sale=N(h.unitPrice),d=sale>0?(N(p.priceEUR)-sale)/sale*100:null;
  const row=document.createElement("div");row.className="microNote";
  let velocity="Velocidad: sin evidencia";
  if(p.sales30!=null)velocity="Ventas 30d verificadas: "+p.sales30;
  row.innerHTML="<b>Postventa:</b> mercado comparable "+EUR(p.priceEUR)+(d==null?"":" · "+(d>=0?"+":"")+d.toFixed(1)+"% vs venta")+
    " · "+velocity+(p.lastSaleEUR?" · última venta real "+EUR(p.lastSaleEUR):"")+
    (p.currentSellers!=null?" · "+p.currentSellers+" vendedor(es)":"")+
    ' · <a href="'+p.url+'" target="_blank" rel="noopener">'+String(p.source||"Fuente")+"</a>";
  el.closest(".sealedActions")?.before(row);
 }
}
const obs=new MutationObserver(()=>inject());
function start(){inject();const host=document.querySelector("#archiveList");if(host)obs.observe(host,{childList:true,subtree:true})}
document.addEventListener("DOMContentLoaded",start);setTimeout(start,150);
window.CVPostSale={addCheck,inject};
})();