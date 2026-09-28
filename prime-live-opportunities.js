(()=>{"use strict";
const now="2026-09-28T22:12:00+02:00";
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
setEvidence("pokemon-gyarados-ex-xy9-089-jp-nm-20260928",{
 source:"Cardmarket",sourceUrl:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Rage-of-the-Broken-Heavens/Gyarados-EX-V3",currentExitEUR:274.17,currentQty:20,available:20,
 depthPrices:[150,230,250,649,699.90,700],
 offer:{price:150,seller:"AngelD4rk",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Rage-of-the-Broken-Heavens/Gyarados-EX-V3",offerLanguage:"Japanese",languageVerified:true,publicFloorVerified:false,condition:"NM",variant:"Full Art secreta · Japonés",image:"https://cdn.pooka.app/card/ja-xy9-89.png",ownedDuplicateBlocked:true},
 approval:"WATCH",status:"YA EN MI COLECCIÓN · NO REPETIR",
 note:"Oferta de mercado conservada solo como referencia. Esta identidad ya existe en Mi colección; no se aprueba otra unidad salvo autorización explícita para ampliar posición."
});
setEvidence("lorcana-scrooge-richest-duck-218-it-20260928",{
 source:"Cardmarket + TCGGraph",sourceUrl:"https://tcggraph.com/cards/lor_3_218",currentExitEUR:117.48,currentQty:8,available:8,
 depthPrices:[57.99,70,80,95,110,117.48],
 offer:{price:57.99,seller:"Oferta italiana publicada en Cardmarket",url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/Into-the-Inklands/Scrooge-McDuck-Richest-Duck-in-the-World-V2",offerLanguage:"Italian",languageVerified:true,publicFloorVerified:true,condition:"NM",variant:"Encantada · Holofoil · Italiano",image:"https://cards.tcggraph.io/32/lor_3_218/normal.webp",lastSalePrice:95,lastSaleDate:"2026-09-23",recentSalesCount:24},
 approval:"BUY-ONE",status:"COMPRAR AHORA · PRIME · ITALIANO NM · 1 UNIDAD",
 note:"Entrada italiana NM 57,99 €. Mediana italiana 117,48 € con 8+ ofertas. Última venta global visible 23/09: 95 €. Salida económica aplica recorte PRIME 15%."
});
setEvidence("lorcana-elsa-spirit-winter-207-fr-20260928",{
 source:"Cardmarket + TCGGraph",sourceUrl:"https://tcggraph.com/cards/lor_1_207",currentExitEUR:450,currentQty:36,available:36,
 depthPrices:[279,320,350,400,425,450],
 offer:{price:279,seller:"Oferta francesa publicada en Cardmarket",url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/The-First-Chapter/Elsa-Spirit-of-Winter-V2",offerLanguage:"French",languageVerified:true,publicFloorVerified:true,condition:"NM",variant:"Encantada · Holofoil · Francés",image:"https://cards.tcggraph.io/12/lor_1_207/normal.webp",lastSalePrice:600,lastSaleDate:"2026-09-23",recentSalesCount:19},
 approval:"BUY-ONE",status:"COMPRAR AHORA · PRIME · FRANCÉS NM · 1 UNIDAD",
 note:"Entrada francesa NM 279 €. Mediana francesa 450 € con 36+ ofertas. Última venta global visible 23/09: 600 €. Salida económica aplica recorte PRIME 15%."
});
setEvidence("lorcana-winnie-hunny-wizard-227-de-20260928",{
 source:"Cardmarket + TCGGraph",sourceUrl:"https://tcggraph.com/cards/lor_9_227",currentExitEUR:1499,currentQty:13,available:13,
 depthPrices:[800,900,1000,1200,1300,1499],
 offer:{price:800,seller:"Oferta alemana publicada en Cardmarket",url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/Fabled/Winnie-the-Pooh-Hunny-Wizard-V2",offerLanguage:"German",languageVerified:true,publicFloorVerified:false,condition:"NM",variant:"Encantada · Holofoil · Alemán"},
 approval:"WATCH",status:"NO COMPRAR AHORA · SALIDA INSUFICIENTEMENTE SEGURA",
 note:"Revisión 28/09: la mediana alemana publicada es alta, pero la última venta global visible del 22/09 fue 697 €, por debajo de la entrada alemana de 800 €. No se aprueba."
});
setEvidence("lorcana-pongo-determined-father-223-it-20260928",{
 source:"Cardmarket + TCGGraph",sourceUrl:"https://tcggraph.com/cards/lor_9_223",currentExitEUR:271.91,currentQty:5,available:5,
 depthPrices:[137.95,149,170,179,245,247,271.91],
 offer:{price:137.95,seller:"Oferta italiana publicada en Cardmarket",url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/Fabled/Pongo-Determined-Father-V2",offerLanguage:"Italian",languageVerified:true,publicFloorVerified:true,condition:"NM",variant:"Encantada · Holofoil · Italiano",image:"https://cards.tcggraph.io/92/lor_9_223/normal.webp",lastSalePrice:245,lastSaleDate:"2026-09-05",recentSalesCount:17},
 approval:"BUY-ONE",status:"COMPRAR AHORA · PRIME · ITALIAN NM · 1 UNIDAD",
 note:"Entrada pública Cardmarket italiana NM 137,95 €. Mediana italiana 271,91 € con 5+ ofertas. Salida económica aplica recorte PRIME 15%; no equivale a venta cerrada."
});
setEvidence("lorcana-belle-accomplished-mystic-226-it-20260927",{
 source:"Cardmarket + TCGGraph",sourceUrl:"https://tcggraph.com/cards/lor_9_226",currentExitEUR:245,currentQty:7,available:65,
 depthPrices:[150,240,240,240,244.99,245,249.95],
 offer:{price:150,seller:"Retfird",url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/Fabled/Belle-Accomplished-Mystic-V2",offerLanguage:"Italian",languageVerified:true,publicFloorVerified:true,condition:"NM",variant:"Encantada · Holofoil · Italiano",lastSalePrice:230,lastSaleDate:"2026-09-18",recentSalesCount:16,
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