/** Pack Party complete-set arbitrage; no prediction and no guarantees. */
(function(root){'use strict';
function assess(x){
 const reasons=[];if(!x||!Array.isArray(x.cards)||x.cards.length<2||x.cards.length>10)return {status:'NO COMPRAR',reasons:['Se requieren 2-10 cartas identificadas']};
 const cards=x.cards,finite=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 if(!finite(x.pricePerSpotEUR)||!finite(x.totalFeesEUR)||!finite(x.budgetEUR))reasons.push('Faltan importes verificables');
 if(x.allSpotsAvailable!==true||x.multipleSpotsAllowed!==true)reasons.push('No se ha verificado que puedas comprar todas las plazas');
 if(x.partiesEnabled!==true)reasons.push('Pack Party no está confirmado como disponible');
 if(cards.some(c=>!c||!c.assetId||!finite(c.firmBidEUR)||!c.bidProofURL||!c.bidTransferable))reasons.push('Cada carta necesita identificación, puja firme transferible y prueba');
 if(x.verifiedSpain!==true)reasons.push('Elegibilidad en España sin verificar');
 const cost=cards.length*x.pricePerSpotEUR+x.totalFeesEUR,returnEUR=cards.reduce((s,c)=>s+(c.firmBidEUR||0),0),net=returnEUR-cost;
 if(!Number.isFinite(cost)||!Number.isFinite(returnEUR))reasons.push('Cálculo inválido');
 if(cost>Math.min(50,x.budgetEUR))reasons.push('Supera presupuesto máximo de 50 EUR');
 if(net<=0)reasons.push('Beneficio neto no positivo');
 return {status:reasons.length?'NO COMPRAR':'REVISAR EJECUCIÓN',costEUR:cost,firmReturnEUR:returnEUR,netEUR:net,reasons};
}
const api={assess};if(typeof module==='object'&&module.exports)module.exports=api;root.PhygitalsPartyArbitrage=api;
})(typeof window==='object'?window:globalThis);
