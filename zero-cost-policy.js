(()=>{"use strict";
const POLICY={version:"1.0",maxExternalSpendEUR:0,paidServicesAllowed:false,
 allowedFree:["GitHub Pages/static hosting","Cloudflare Workers Free","Cloudflare D1 Free","TCGdex","Lorcast","Frankfurter","CardTrader API when user token is free","PSA API when user access is free"],
 forbidden:["paid market data","paid proxies","paid scraping","paid hosting","paid databases","paid AI/API calls required for core operation"]};
state.zeroCostPolicy={...POLICY,updatedAt:new Date().toISOString()};save();
function assertFree(service,costEUR=0){
 const cost=Number(costEUR)||0;
 return {ok:cost<=POLICY.maxExternalSpendEUR,service,costEUR:cost,reason:cost<=0?"Permitido por política 0 €":"Bloqueado: Card Vault no autoriza gasto externo"};
}
function render(){
 const host=document.querySelector("#operationalStatus")||document.querySelector("#todaySimple");if(!host)return;
 let box=document.querySelector("#zeroCostPrime");
 if(!box){box=document.createElement("section");box.id="zeroCostPrime";box.className="qaPanel";host.appendChild(box)}
 box.innerHTML='<b>Política 0 € · BLOQUEO DE COSTES</b><div class="statsGrid"><div><span>Presupuesto externo</span><b>0 €</b></div><div><span>Servicios de pago</span><b>DESACTIVADOS</b></div></div><small>Card Vault debe degradar funciones o esperar antes que exigir un servicio de pago. Las fuentes gratuitas pueden fallar o limitarse sin generar gasto.</small>';
}
setTimeout(render,300);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
window.CVZeroCost={policy:POLICY,assertFree,render};
})();