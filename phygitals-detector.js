/* Phygitals · detector económico con evidencia. UMD, sin dependencias, sin red.
 * Señales: «COMPRA YA» · «REVISAR» · «NO COMPRAR».
 * Reglas duras:
 *  - Un pack aleatorio NUNCA es «COMPRA YA»: no tiene salida fija asegurada.
 *  - «REVISAR» exige a la vez: EV oficial fresco con margen en efectivo positivo tras recompra y costes
 *    Y evidencia independiente (retorno observado × recompra con IC95 inferior > 100 %, últimos 14 días > 100 %,
 *    sin caída de régimen significativa ni déficit significativo en el nivel alto).
 *  - «COMPRA YA» solo para un artículo identificado con puja firme verificada (motor PhygitalsDecision),
 *    o una Pack Party completa con todas las plazas y pujas firmes (motor PhygitalsPartyArbitrage).
 *  - El valor esperado por sí solo nunca aprueba nada. */
(function(root){'use strict';
const fin=x=>typeof x==='number'&&Number.isFinite(x);
const pct=x=>(x*100).toFixed(1).replace('.',',')+' %';
const DAY=86400000;

function randomPack(pack,evidence,ctx){
  const c=ctx||{},reasons=[],facts=[],now=fin(c.now)?c.now:Date.now();
  const budget=fin(c.budgetEUR)?Math.min(c.budgetEUR,50):50,fx=c.usdToEur,fees=fin(c.feesEUR)&&c.feesEUR>=0?c.feesEUR:null;
  if(!pack||typeof pack!=='object')return {signal:'NO COMPRAR',reasons:['Sin pack'],facts};
  const price=Number(pack.mint_price),ev=Number(pack.ev),bbLive=Number(pack.buyback_percent);
  if(!fin(price)||price<=0)reasons.push('Precio no verificable');
  if(!fin(fx)||fx<=0)reasons.push('Sin cambio USD→EUR verificable');
  if(fees===null)reasons.push('Costes extra no indicados');
  if(pack.in_stock!==true||pack.enable!==true)reasons.push('Pack no disponible');
  const t=Date.parse(pack.ev_updated_at||'');
  const fresh=fin(t)&&t<=now+60000&&now-t<=DAY;
  if(!fresh)reasons.push('EV oficial sin fecha válida o con más de 24 h');
  const bb=fin(bbLive)&&bbLive>0&&bbLive<=1?bbLive:null;
  if(bb===null)reasons.push('Recompra publicada no válida');
  let marginEUR=null;
  if(fin(price)&&fin(ev)&&bb!==null&&fin(fx)&&fees!==null){
    const costEUR=price*fx+fees;
    if(costEUR>budget)reasons.push('Coste '+costEUR.toFixed(2)+' € supera el presupuesto de '+budget+' €');
    marginEUR=(ev*bb-price)*fx-fees;
    facts.push('Efectivo esperado según el operador: '+pct(ev*bb/price)+' del precio (EV × recompra '+pct(bb)+').');
    if(!(marginEUR>0))reasons.push('Margen medio en efectivo según el propio operador: '+marginEUR.toFixed(2)+' € (negativo)');
  }else if(fin(price)&&!fin(ev))reasons.push('EV oficial no disponible');
  // Evidencia independiente (agregados públicos de aperturas, no transacciones verificadas).
  let evidenceOK=false;
  if(!evidence){reasons.push('Sin evidencia independiente de aperturas para este pack');}
  else{
    const b=bb!==null?bb:evidence.buyback_percent;
    const lo=evidence.value_return_ci95&&evidence.value_return_ci95[0],last=evidence.value_return_last14;
    facts.push('Aperturas observadas: '+Number(evidence.n).toLocaleString('es-ES')+' ('+evidence.window[0]+' → '+evidence.window[1]+'). Valor medio devuelto: '+pct(evidence.value_return)+' (IC95 '+pct(evidence.value_return_ci95[0])+'–'+pct(evidence.value_return_ci95[1])+').');
    if(fin(b)){
      facts.push('En efectivo con recompra '+pct(b)+': '+pct(evidence.value_return*b)+'; últimos 14 días: '+pct(last*b)+'.');
      const ok1=fin(lo)&&lo*b>1,ok2=fin(last)&&last*b>1;
      if(!ok1)reasons.push('Retorno observado en efectivo sin margen demostrado (IC95 inferior '+pct(lo*b)+')');
      if(!ok2)reasons.push('Últimos 14 días en efectivo: '+pct(last*b));
      evidenceOK=ok1&&ok2;
    }else reasons.push('Recompra desconocida para la evidencia');
    const rb=evidence.regime_break;
    if(rb&&rb.p_holm<0.05&&rb.after<rb.before){reasons.push('Cambio de régimen desde '+rb.from+': '+pct(rb.before)+' → '+pct(rb.after)+' (p Holm '+rb.p_holm.toFixed(3)+')');evidenceOK=false}
    const tt=evidence.top_tier;
    if(tt&&evidence.odds_p_holm<0.05&&tt.ci95&&tt.ci95[1]<tt.advertised){reasons.push('Nivel '+tt.tier+' por debajo de lo anunciado: '+pct(tt.observed)+' frente a '+pct(tt.advertised));evidenceOK=false}
  }
  const signal=(reasons.length===0&&evidenceOK)?'REVISAR':'NO COMPRAR';
  if(signal==='REVISAR')facts.push('Pack aleatorio: aunque las medias sean favorables, cada apertura puede perder. Nunca «COMPRA YA».');
  return {signal,reasons,facts,marginEUR};
}

function firmOffer(candidate,decisionEngine,now){
  const eng=decisionEngine||(root.PhygitalsDecision);
  if(!eng)return {signal:'NO COMPRAR',reasons:['Motor de decisión no cargado']};
  const r=eng.evaluate(candidate,now);
  return {signal:r.decision==='REVISAR OFERTA'?'COMPRA YA':'NO COMPRAR',reasons:r.decision==='REVISAR OFERTA'?['Puja firme verificada hace menos de 15 min, beneficio neto '+r.netEUR.toFixed(2)+' €. Ejecución manual: la app no compra.']:r.reasons,netEUR:r.netEUR};
}

function party(input,partyEngine){
  const eng=partyEngine||(root.PhygitalsPartyArbitrage);
  if(!eng)return {signal:'NO COMPRAR',reasons:['Motor de Pack Party no cargado']};
  const r=eng.assess(input);
  return {signal:r.status==='REVISAR EJECUCIÓN'?'COMPRA YA':'NO COMPRAR',reasons:r.reasons.length?r.reasons:['Todas las plazas y pujas firmes verificadas; beneficio neto '+r.netEUR.toFixed(2)+' €. Ejecución manual.'],netEUR:r.netEUR};
}

const api={randomPack,firmOffer,party};
if(typeof module==='object'&&module.exports)module.exports=api;root.PhygitalsDetector=api;
})(typeof window==='object'?window:globalThis);
