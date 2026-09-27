(()=>{"use strict";
/* V90.9 · Escaneo bajo demanda: cada apertura/recarga refresca mercado desde el propio iPhone.
   Sin cron obligatorio. Cloudflare queda como complemento opcional para fuentes con secretos privados. */
state.autonomousMarketPolicy={enabled:true,mode:"on-open",staleMin:0};
let running=false;
async function cycle(reason="open"){
 if(running||document.hidden||typeof window.CVRunMarketScan!=="function")return null;
 running=true;
 state.autonomousMarketRuntime={...(state.autonomousMarketRuntime||{}),running:true,reason,startedAt:new Date().toISOString(),lastError:""};
 try{
  const result={};
  for(const universe of ["pokemon","lorcana"]){
   try{
    const rows=await window.CVRunMarketScan("wide",universe,{silent:true});
    result[universe]=Array.isArray(rows)?rows.length:0;
   }catch(e){
    result[universe]=0;
    state.autonomousMarketRuntime.lastError=(state.autonomousMarketRuntime.lastError?state.autonomousMarketRuntime.lastError+" · ":"")+universe+": "+String(e?.message||e);
   }
  }
  if(window.CVCardTraderDirect?.hasToken?.()){
   try{result.cardtrader=await window.CVCardTraderDirect.scan()}catch(e){result.cardtrader={ok:false,error:String(e?.message||e)}}
  }
  state.autonomousMarketRuntime={...(state.autonomousMarketRuntime||{}),running:false,lastRun:new Date().toISOString(),reason,counts:result};
  save();
  try{window.renderOpportunityEngine?.()}catch{}
  try{window.CVManualOpportunities?.render?.()}catch{}
  try{window.CVSimpleHome?.render?.()}catch{}
  try{window.CVCollectionSimple?.render?.()}catch{}
  return result;
 }finally{
  running=false;
  if(state.autonomousMarketRuntime?.running){state.autonomousMarketRuntime.running=false;save();}
 }
}
setTimeout(()=>cycle("open"),900);
/* Al volver a la app tras haberla dejado en segundo plano, hacemos una sola actualización nueva. */
let lastHiddenAt=0;
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){lastHiddenAt=Date.now();return}
 if(lastHiddenAt&&Date.now()-lastHiddenAt>60000)setTimeout(()=>cycle("resume"),300);
});
window.CVAutonomousMarket={cycle,policy:state.autonomousMarketPolicy};
})();