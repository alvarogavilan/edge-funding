/* Phygitals evidence gate · never buy random packs automatically. Browser-safe UMD. */
(function(root){'use strict';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function evaluate(candidate,now=Date.now()){
 const fail=[];if(!candidate||typeof candidate!=='object')return {decision:'NO COMPRAR',reasons:['Sin operación concreta']};
 const budget=finite(candidate.budgetEUR)?Math.min(candidate.budgetEUR,50):50;
 const amountKeys=['purchaseEUR','feesEUR','withdrawalFeesEUR','fxSpreadEUR','firmExitEUR'];
 for(const k of amountKeys)if(!finite(candidate[k])||candidate[k]<0)fail.push('Falta importe comprobable: '+k);
 if(candidate.purchaseEUR>budget)fail.push('Excede el presupuesto');
 if(!candidate.assetId||typeof candidate.assetId!=='string')fail.push('Falta identificador exacto de carta');
 if(!candidate.buyUrl||!/^https:\/\//.test(candidate.buyUrl))fail.push('Falta URL de compra exacta');
 if(candidate.randomPack!==false)fail.push('Los packs aleatorios no tienen salida fija asegurada');
 if(!candidate.exitEvidenceUrl||!/^https:\/\//.test(candidate.exitEvidenceUrl))fail.push('Falta evidencia de oferta firme');
 if(candidate.exitTransferable!==true)fail.push('No está probado que la oferta sea transferible');
 if(candidate.exitAvailableToSpain!==true)fail.push('No está verificada la elegibilidad en España');
 if(!finite(candidate.exitVerifiedAt)||now-candidate.exitVerifiedAt>15*60*1000||candidate.exitVerifiedAt>now)fail.push('Oferta no verificada en los últimos 15 minutos');
 if(candidate.exitType!=='binding_bid')fail.push('Un anuncio o valoración no es una oferta firme');
 const costs=(candidate.purchaseEUR||0)+(candidate.feesEUR||0)+(candidate.withdrawalFeesEUR||0)+(candidate.fxSpreadEUR||0);
 const net=(candidate.firmExitEUR||0)-costs;
 if(costs>budget)fail.push('Coste total, incluidos gastos, excede el presupuesto');
 if(net<=0)fail.push('Sin margen neto positivo');
 return {decision:fail.length?'NO COMPRAR':'COMPRA YA',netEUR:Math.round(net*100)/100,reasons:fail,budgetEUR:budget,assetId:candidate.assetId||null};
}
const api={evaluate};if(typeof module==='object'&&module.exports)module.exports=api;root.PhygitalsDecision=api;
})(typeof window==='object'?window:globalThis);
