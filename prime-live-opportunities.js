(()=>{"use strict";
const now="2026-09-27T22:25:00+02:00";
function seal(x){return window.CVIdentity?.key?.(x)||""}
function setEvidence(id,data){
 const x=(state.manualOpportunities||[]).find(o=>o.id===id);if(!x)return;
 Object.assign(x,data.offer||{});
 x.marketEvidenceHistory=Array.isArray(x.marketEvidenceHistory)?x.marketEvidenceHistory:[];
 if(x.marketEvidence?.at&&x.marketEvidence.at!==now)x.marketEvidenceHistory.push({...x.marketEvidence,replacedAt:now});
 x.marketEvidenceHistory=x.marketEvidenceHistory.slice(-20);
 x.marketEvidence={at:now,identityKey:seal(x),source:data.source,url:data.sourceUrl,currentExitEUR:data.currentExitEUR,currentQty:data.currentQty,
  evidenceType:"active-same-language-market",note:data.note};
 x.evidenceCheckedAt=now;x.checkedAt=now;x.expiresAt="2026-09-28T22:25:00+02:00";
 x.sameMarketComparableVerified=true;
 x.exitEvidenceVerified=true;
 x.depthPrices=data.depthPrices||[];
 x.available=data.available||x.available;
 x.integrityBlocked=false;x.integrityIssues=[];
 if(data.approval)x.approval=data.approval;
 if(data.status)x.status=data.status;
}
setEvidence("lorcana-belle-accomplished-mystic-226-it-20260927",{
 source:"Cardmarket + TCGGraph",sourceUrl:"https://tcggraph.com/cards/lor_9_226",currentExitEUR:245,currentQty:7,available:65,
 depthPrices:[150,240,240,240,244.99,245,249.95],
 offer:{price:150,seller:"Retfird",url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/Fabled/Belle-Accomplished-Mystic-V2",offerLanguage:"Italian",languageVerified:true,condition:"NM",variant:"Enchanted · Holofoil · Italian",
 image:"https://cards.lorcast.io/card/digital/large/crd_c51b6a26015b45f298d1664787f37234.avif?1755541561="},
 approval:"BUY-ONE",status:"COMPRAR AHORA · PRIME · ITALIAN NM · 1 UNIDAD",
 note:"Entrada exacta Cardmarket 150 € (Retfird). Salida económica usa mediana de anuncios italianos 245 € con recorte PRIME 15%; no equivale a venta cerrada."
});
setEvidence("lorcana-ariel-sonic-warrior-220-it-20260927",{
 source:"Cardmarket + TCGGraph",sourceUrl:"https://tcggraph.com/cards/lor_4_220",currentExitEUR:114.95,currentQty:7,available:76,
 depthPrices:[65,75,85,90,97.94,97.95,100,110,114.95],
 offer:{price:65,seller:"Fantaverso-Store",url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/Ursulas-Return/Ariel-Sonic-Warrior-V2",offerLanguage:"Italian",languageVerified:true,condition:"NM",variant:"Enchanted · Holofoil · Italian"},
 approval:"WATCH",status:"WATCH PRIME · BUEN PRECIO, MARGEN < 40 €",
 note:"Entrada exacta Cardmarket 65 €. Mercado italiano NM confirmado; tras recorte conservador no alcanza el margen mínimo de +40 €."
});
state.liveEvidenceV880=now;save();
try{window.CVPrimeMarket?.run?.()}catch{}
try{window.CVSimpleHome?.render?.()}catch{}
})();