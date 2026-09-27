(()=>{"use strict";
state.autonomousMarketPolicy=state.autonomousMarketPolicy&&typeof state.autonomousMarketPolicy==="object"?state.autonomousMarketPolicy:{enabled:true,intervalMin:30,staleMin:20};
if(state.autonomousMarketPolicy.enabled!==false)state.autonomousMarketPolicy.enabled=true;
state.autonomousMarketPolicy.intervalMin=Math.max(15,Number(state.autonomousMarketPolicy.intervalMin)||30);
state.autonomousMarketPolicy.staleMin=Math.max(10,Number(state.autonomousMarketPolicy.staleMin)||20);
let running=false,timer=null;

function ageMin(){
 const at=state.autonomousMarketRuntime?.lastRun;
 if(!at)return Infinity;
 const n=(Date.now()-new Date(at).getTime())/60000;
 return Number.isFinite(n)?n:Infinity;
}
function due(){return ageMin()>=state.autonomousMarketPolicy.staleMin}
async function cycle(reason="interval"){
 if(state.autonomousMarketPolicy.enabled===false||running||document.hidden||typeof window.CVRunMarketScan!=="function")return null;
 running=true;
 state.autonomousMarketRuntime={...(state.autonomousMarketRuntime||{}),running:true,reason,startedAt:new Date().toISOString(),lastError:""};
 try{
  const result={};
  for(const universe of ["pokemon","lorcana"]){
   try{
    const rows=await window.CVRunMarketScan("quick",universe,{silent:true});
    result[universe]=Array.isArray(rows)?rows.length:0;
   }catch(e){
    result[universe]=0;
    state.autonomousMarketRuntime.lastError=(state.autonomousMarketRuntime.lastError?state.autonomousMarketRuntime.lastError+" · ":"")+universe+": "+String(e?.message||e);
   }
  }
  state.autonomousMarketRuntime={...(state.autonomousMarketRuntime||{}),running:false,lastRun:new Date().toISOString(),reason,counts:result};
  save();
  try{window.renderOpportunityEngine?.()}catch{}
  try{window.CVManualOpportunities?.render?.()}catch{}
  return result;
 }finally{
  running=false;
  if(state.autonomousMarketRuntime?.running){state.autonomousMarketRuntime.running=false;save();}
 }
}
function schedule(){
 clearInterval(timer);
 timer=setInterval(()=>cycle("interval"),state.autonomousMarketPolicy.intervalMin*60000);
}
setTimeout(()=>cycle("open"),2500);
schedule();
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&due())cycle("resume")});
window.addEventListener("focus",()=>{if(due())cycle("focus")});
window.CVAutonomousMarket={cycle,due,ageMin,policy:state.autonomousMarketPolicy};
})();