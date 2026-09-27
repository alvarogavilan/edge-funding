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
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const nrm=v=>String(v??"").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
/* V84.9 · Solo ventas cerradas (kind==="sold") en EUR, mismo nombre + set si existe. Nunca listings. */
function soldComps(c,grading,grade){
 const rows=(state.market||[]).filter(m=>m.kind==="sold"&&nrm(m.name)===nrm(c.name)&&String(m.grading||"").toUpperCase()===grading&&String(m.grade||"")===String(grade)&&(m.currency||"EUR").toUpperCase()==="EUR"&&(!c.set||!m.set||nrm(m.set)===nrm(c.set))&&N(m.price)>0);
 if(!rows.length)return null;
 const p=rows.map(m=>N(m.price)).sort((x,y)=>x-y),mid=Math.floor(p.length/2),median=p.length%2?p[mid]:(p[mid-1]+p[mid])/2;
 const last=rows.map(m=>m.soldDate||m.at||"").filter(Boolean).sort().at(-1)||"";
 return {n:rows.length,median,last};
}
const LADDER=[["PSA","8"],["PSA","9"],["PSA","10"],["BGS","9.5"],["BGS","10"],["CGC","9.5"],["CGC","10"]];
function population(c){
 const ok=!!(c.popSource&&/^https?:\/\//i.test(String(c.popUrl||""))&&N(c.popTotal)>0);
 if(!ok)return {verified:false};
 return {verified:true,grade:c.popGrade==null?null:N(c.popGrade),higher:c.popHigher==null?null:N(c.popHigher),total:N(c.popTotal),ratio:c.popGrade==null?null:N(c.popGrade)/N(c.popTotal),source:c.popSource,url:c.popUrl,at:c.popCheckedAt||""};
}
/* V85.0 · Gem rate (concepto de PokeInvest/GemTracker): PSA 10 ÷ total graduadas de la MISMA carta/variante.
   Solo con fuente + URL registradas por el usuario. Es contexto: nunca sustituye al p10 de pregrade. */
function gemRate(c){
 const p=c.psaPop;if(!p||!(N(p.total)>0)||!p.source||!/^https?:\/\//i.test(String(p.url||"")))return null;
 const age=(Date.now()-new Date(p.at||0).getTime())/864e5;
 return {total:N(p.total),psa10:N(p.psa10),psa9:p.psa9==null?null:N(p.psa9),rate10:N(p.psa10)/N(p.total),rate9:p.psa9==null?null:N(p.psa9)/N(p.total),source:p.source,url:p.url,at:p.at,stale:!(age<=30)};
}
function capturePop(id){
 const c=(state.cards||[]).find(x=>x.id===id);if(!c)return;
 if(!confirm("Registra la población PSA de la MISMA carta, set, número, idioma y variante. ¿Continuar?"))return;
 const total=N(prompt("Total de copias graduadas PSA (todas las notas):",""));if(!(total>0)){alert("Total no válido.");return}
 const psa10=N(prompt("Copias PSA 10:",""));const p9raw=prompt("Copias PSA 9 (vacío si no lo sabes):","");
 const source=(prompt("Fuente exacta:","PSA Population Report")||"").trim(),url=(prompt("URL exacta de la población:","")||"").trim();
 if(!source||!/^https?:\/\//i.test(url)){alert("Hace falta fuente y URL verificables.");return}
 if(psa10>total){alert("PSA 10 no puede superar el total.");return}
 const prev=c.psaPop?{...c.psaPop}:null;
 c.psaPop={at:new Date().toISOString(),total,psa10,psa9:String(p9raw??"").trim()===""?null:N(p9raw),source,url,identityKey:window.CVIdentity?.key?.(c)||""};
 if(prev){c.psaPopHistory=Array.isArray(c.psaPopHistory)?c.psaPopHistory:[];c.psaPopHistory.push(prev);c.psaPopHistory=c.psaPopHistory.slice(-20)}
 save();render();
}
function render(){
 const host=document.querySelector("#gradingEconomicsResult");if(!host)return;
 const sel=document.querySelector("#psaCollectionCard"),id=sel?.value;
 const c=(state.cards||[]).find(x=>x.id===id);
 document.querySelector("#primeGradingDecision")?.remove();
 if(!c)return;
 const inp=q=>N(document.querySelector(q)?.value);
 const g=state.gradingEconomics||{},feeRaw=String(document.querySelector("#gradeSellFee")?.value??"").trim(),fee=feeRaw!==""?N(feeRaw):(window.CVPrimeExitPricing?.policy?.().feePct??5),gradeCost=inp("#gradeCost")||N(g.gradeCost);
 const c9=soldComps(c,"PSA","9"),c10=soldComps(c,"PSA","10");
 const psa9=c9?c9.median:(inp("#gradePSA9")||N(c.gradedValuation?.psa9)),psa10=c10?c10.median:(inp("#gradePSA10")||N(c.gradedValuation?.psa10));
 const src9=c9?c9.n+" ventas reales":(psa9>0?"manual · verificar que sea venta real":"sin dato"),src10=c10?c10.n+" ventas reales":(psa10>0?"manual · verificar que sea venta real":"sin dato");
 const b=window.CVPrimeValuation?.bucket?.(c),rawVal=N(c.value),basis=window.CVPrimeValuation?.basisUnit?.(c);
 const landed=basis!=null?basis:rawVal;
 const r=evaluate({rawValue:rawVal,landedCost:landed,gradeCost,sellFeePct:fee,psa9,psa10,p10:c.pregrade?.p10??c.pregradeProbability10??null});
 const keep=1-fee/100,breakEven=keep>0?r.cost/keep:null;
 const spread=v=>v>0&&rawVal>0?EUR(v-rawVal)+" ("+((v-rawVal)/rawVal*100).toFixed(0)+"%)":"SIN DATO";
 const pop=population(c),graded=String(c.grading||"RAW").toUpperCase()!=="RAW";
 const dep=r.profit9!=null&&r.profit9>=40&&r.roi9>=35?"No depende del 10":r.profit10!=null&&r.profit10>=40?"DEPENDE DEL PSA 10":"—";
 const extra=document.createElement("div");extra.id="primeGradingDecision";extra.className="qaPanel";
 extra.innerHTML='<b>PRIME · RAW vs graduada</b>'+
  '<div class="qaRow"><span>'+(graded?'Ya graduada':'RAW')+' · valor base<small> · '+E(b?(window.CVPrimeValuation.LABEL[b.bucket]||b.bucket)+' · '+b.reason:'')+'</small></span><b>'+EUR(rawVal)+'</b></div>'+
  '<div class="qaRow"><span>Coste base usado<small> · '+(basis!=null?'coste aterrizado real':'coste desconocido: se usa valor RAW como coste de oportunidad')+'</small></span><b>'+EUR(landed)+'</b></div>'+
  '<div class="qaRow"><span>Coste graduación · comisión venta</span><b>'+EUR(gradeCost)+' · '+fee+'%</b></div>'+
  '<div class="qaRow"><span>Break-even de venta graduada</span><b>'+(breakEven?EUR(breakEven):'—')+'</b></div>'+
  '<div class="qaRow"><span>PSA 9<small> · '+E(src9)+'</small></span><b>'+(psa9>0?EUR(psa9):'SIN DATO')+'</b></div>'+
  '<div class="qaRow"><span>PSA 10<small> · '+E(src10)+'</small></span><b>'+(psa10>0?EUR(psa10):'SIN DATO')+'</b></div>'+
  '<div class="qaRow"><span>Spread RAW → PSA 9</span><b>'+spread(psa9)+'</b></div>'+
  '<div class="qaRow"><span>Spread RAW → PSA 10</span><b>'+spread(psa10)+'</b></div>'+
  '<div class="qaRow"><span>Resultado si PSA 9</span><b>'+(r.profit9==null?'SIN DATO':(r.profit9>=0?'+':'')+EUR(r.profit9)+(r.roi9==null?'':' · '+r.roi9.toFixed(1)+'%'))+'</b></div>'+
  '<div class="qaRow"><span>Resultado si PSA 10</span><b>'+(r.profit10==null?'SIN DATO':(r.profit10>=0?'+':'')+EUR(r.profit10)+(r.roi10==null?'':' · '+r.roi10.toFixed(1)+'%'))+'</b></div>'+
  '<div class="qaRow"><span>Probabilidad 10 (pregrade)</span><b>'+(r.prob10==null?'SIN EVIDENCIA':(r.prob10*100).toFixed(0)+'%')+'</b></div>'+
  '<div class="qaRow"><span>Dependencia del 10</span><b>'+dep+'</b></div>'+
  '<div class="qaRow"><span>Decisión económica</span><b>'+r.verdict+'</b></div>'+
  (()=>{const gr=gemRate(c);return '<div class="qaRow"><span>Gem rate PSA 10<small> · '+(gr?E(gr.source)+' · '+gr.total+' graduadas'+(gr.stale?' · ANTIGUA >30d':''):'sin población verificada')+'</small></span><b>'+(gr?(gr.rate10*100).toFixed(1)+'%'+(gr.rate9!=null?' · PSA 9 '+(gr.rate9*100).toFixed(1)+'%':''):'SIN DATO')+'</b></div>'+(gr?'<div class="microNote">'+(gr.rate10<.1?'PSA 10 históricamente muy difícil en esta carta: el caso base debe ser PSA 9 o inferior.':gr.rate10>=.6?'PSA 10 frecuente: mucha oferta de 10 presiona su precio; confirma ventas reales de PSA 10.':'Gem rate intermedio: decide con PSA 9 como caso base.')+' El gem rate es contexto poblacional, no la probabilidad de TU copia.</div>':'')+'<div class="sealedActions"><button type="button" data-prime-pop="'+E(c.id)+'">'+(gr?'Actualizar':'Registrar')+' población PSA</button></div>'})()+
  '<details><summary>Escalera de ventas reales graduadas</summary>'+LADDER.map(([gr,gd])=>{const x=soldComps(c,gr,gd);return '<div class="qaRow"><span>'+gr+' '+gd+(x?'<small> · '+x.n+' ventas · última '+E(x.last?String(x.last).slice(0,10):'s/f')+'</small>':'')+'</span><b>'+(x?EUR(x.median):'SIN VENTAS')+'</b></div>'}).join("")+'<small>Solo ventas cerradas registradas en EUR del mismo nombre/set. Los anuncios no cuentan.</small></details>'+
  '<details><summary>Población'+(pop.verified?' verificada':' · sin verificar')+'</summary>'+(pop.verified?
   '<div class="qaRow"><span>Mismo grado</span><b>'+(pop.grade??'—')+'</b></div><div class="qaRow"><span>Grado superior</span><b>'+(pop.higher??'—')+'</b></div><div class="qaRow"><span>Total graduadas</span><b>'+pop.total+'</b></div><div class="qaRow"><span>Ratio del grado</span><b>'+(pop.ratio==null?'—':(pop.ratio*100).toFixed(1)+'%')+'</b></div><a href="'+E(pop.url)+'" target="_blank" rel="noopener">'+E(pop.source)+(pop.at?' · '+E(pop.at):'')+'</a>':
   '<small>Sin cifra + fuente + URL verificadas no se usa población. Consulta PSA/CGC/Beckett y regístrala en la ficha.</small>')+
   (c.cert?'<div class="qaRow"><span>Certificado</span><b>'+E(c.cert)+'</b></div>':'')+'</details>'+
  '<small>PSA 10 nunca es el caso base. Si PSA 9 no sostiene +40 € y ROI ≥35%, la operación depende del 10 y queda en NO GRADUAR AÚN salvo evidencia específica.</small>';
 host.after(extra);
}
function soon(){setTimeout(render,40)}
document.addEventListener("click",e=>{if(e.target.closest("#calculateGradingEconomics")||e.target.closest('[data-tab="pregrade"]'))soon()});document.addEventListener("input",e=>{if(e.target?.closest?.("#gradingEconomics"))soon()});setTimeout(render,500);document.addEventListener("change",e=>{if(e.target?.matches?.("#psaCollectionCard"))setTimeout(render,20)});
document.addEventListener("click",e=>{const b=e.target.closest("[data-prime-pop]");if(b){e.preventDefault();capturePop(b.dataset.primePop)}});
window.CVPrimeGrading={evaluate,fromCard,render,soldComps,population,gemRate,capturePop};
})();