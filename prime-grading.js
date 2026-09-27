(()=>{"use strict";
const N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
function evaluate({rawValue=0,landedCost=0,gradeCost=0,sellFeePct=0,psa9=0,psa10=0,p10=null}={}){
 rawValue=N(rawValue);landedCost=N(landedCost)||rawValue;gradeCost=N(gradeCost);sellFeePct=N(sellFeePct);psa9=N(psa9);psa10=N(psa10);
 const net=v=>v*(1-sellFeePct/100),cost=landedCost+gradeCost;
 const profit9=psa9>0?net(psa9)-cost:null,profit10=psa10>0?net(psa10)-cost:null;
 const roi9=profit9==null||cost<=0?null:profit9/cost*100,roi10=profit10==null||cost<=0?null:profit10/cost*100;
 const prob10=p10==null?null:Math.max(0,Math.min(1,N(p10)));
 const expected=prob10==null||profit9==null||profit10==null?null:(1-prob10)*profit9+prob10*profit10;
 let verdict="SIN DATOS";
 if(profit9!=null&&profit9>=40&&roi9>=35)verdict="ECONOMÍA ROBUSTA A PSA 9";
 else if(expected!=null&&expected>=40&&profit9!=null&&profit9>=0)verdict="SOLO CON PROBABILIDAD 10 VERIFICADA";
 else if(profit10!=null&&profit10>=40)verdict="DEPENDIENTE DE PSA 10 · NO GRADUAR AÚN";
 else if(profit9!=null||profit10!=null)verdict="NO GRADUAR";
 return {rawValue,landedCost,gradeCost,cost,psa9,psa10,sellFeePct,profit9,profit10,roi9,roi10,prob10,expected,verdict};
}
function fromCard(c){
 const g=state.gradingEconomics||{},raw=N(c.value),landed=N(c.landedCostUnit)||N(c.purchase)||raw;
 const v=c.gradedValuation||{};
 return evaluate({rawValue:raw,landedCost:landed,gradeCost:N(g.gradeCost),sellFeePct:N(g.sellFeePct),psa9:N(v.psa9||g.psa9),psa10:N(v.psa10||g.psa10),p10:c.pregrade?.p10??c.pregradeProbability10??null});
}
function render(){
 const host=document.querySelector("#gradingEconomicsResult");if(!host)return;
 const sel=document.querySelector("#psaOwnedCard"),id=sel?.value;
 const c=(state.cards||[]).find(x=>x.id===id);
 if(!c)return;
 const r=fromCard(c);
 const extra=document.createElement("div");extra.id="primeGradingDecision";extra.className="qaPanel";
 extra.innerHTML='<b>PRIME · RAW vs PSA</b>'+
  '<div class="qaRow"><span>Coste real antes de vender</span><b>'+EUR(r.cost)+'</b></div>'+
  '<div class="qaRow"><span>Resultado si PSA 9</span><b>'+(r.profit9==null?'SIN DATO':(r.profit9>=0?'+':'')+EUR(r.profit9)+(r.roi9==null?'':' · '+r.roi9.toFixed(1)+'%'))+'</b></div>'+
  '<div class="qaRow"><span>Resultado si PSA 10</span><b>'+(r.profit10==null?'SIN DATO':(r.profit10>=0?'+':'')+EUR(r.profit10)+(r.roi10==null?'':' · '+r.roi10.toFixed(1)+'%'))+'</b></div>'+
  '<div class="qaRow"><span>Probabilidad 10</span><b>'+(r.prob10==null?'SIN EVIDENCIA':(r.prob10*100).toFixed(0)+'%')+'</b></div>'+
  '<div class="qaRow"><span>Decisión económica</span><b>'+r.verdict+'</b></div>'+
  '<small>PSA 10 nunca es el caso base. Si PSA 9 no sostiene la operación, una expectativa de PSA 10 requiere evidencia específica de pregrade; si no existe, queda bloqueada.</small>';
 document.querySelector("#primeGradingDecision")?.remove();host.after(extra);
}
document.addEventListener("click",e=>{if(e.target.closest("#calculateGradingEconomics"))setTimeout(render,20)});
window.CVPrimeGrading={evaluate,fromCard,render};
})();