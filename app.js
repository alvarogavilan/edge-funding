const seed=[
{id:"vap149",name:"Vaporeon ex #149/131",set:"Prismatic Evolutions · 2025",grade:9,cert:"136142566",value:215,purchase:null,referenceImage:"https://images.pokemontcg.io/sv8pt5/149_hires.png",icon:"💧"},
{id:"eev174",name:"Eevee ex #174",set:"SVP Promo · 2025",grade:9,cert:"136142568",value:30,purchase:null,referenceImage:"https://images.pokemontcg.io/svp/174_hires.png",icon:"✨"},
{id:"cha074",name:"Charizard ex #074",set:"Paldean Fates Tin · 2024",grade:9,cert:"136142569",value:38,purchase:null,referenceImage:"https://images.pokemontcg.io/svp/74_hires.png",icon:"🔥"},
{id:"cha228",name:"Charizard ex #228/197",set:"Obsidian Flames · 2023",grade:8,cert:"136142567",value:55,purchase:null,referenceImage:"https://images.pokemontcg.io/sv3/228_hires.png",icon:"🏆"}];
const KEY="cardvault.v2";let editId=null;const catalogCache={};let recognitionQueue=[];let queueRunning=false;const DB="cardvault.media.v1";let db;function openDB(){return new Promise((ok,no)=>{let r=indexedDB.open(DB,3);r.onupgradeneeded=()=>{let d=r.result;if(!d.objectStoreNames.contains("photos"))d.createObjectStore("photos");if(!d.objectStoreNames.contains("marketSignals"))d.createObjectStore("marketSignals",{keyPath:"id"});if(!d.objectStoreNames.contains("catalog")){let s=d.createObjectStore("catalog",{keyPath:"id"});s.createIndex("universe","universe",{unique:false})}};r.onsuccess=()=>{db=r.result;ok(db)};r.onerror=()=>no(r.error)})}
function photoPut(id,blob){return new Promise((ok,no)=>{let t=db.transaction("photos","readwrite"),r=t.objectStore("photos").put(blob,id);r.onsuccess=()=>ok();r.onerror=()=>no(r.error)})}
function photoGet(id){return new Promise((ok,no)=>{let r=db.transaction("photos").objectStore("photos").get(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
function photoDel(id){return new Promise(ok=>{let r=db.transaction("photos","readwrite").objectStore("photos").delete(id);r.onsuccess=()=>ok()})}
function marketSignalPutMany(rows){return new Promise((ok,no)=>{try{let t=db.transaction("marketSignals","readwrite"),s=t.objectStore("marketSignals");for(const x of rows||[])if(x?.id)s.put(x);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)}catch(e){no(e)}})}
function marketSignalAll(){return new Promise((ok,no)=>{try{let r=db.transaction("marketSignals").objectStore("marketSignals").getAll();r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>no(r.error)}catch(e){no(e)}})}
function marketSignalCount(){return new Promise((ok,no)=>{try{let r=db.transaction("marketSignals").objectStore("marketSignals").count();r.onsuccess=()=>ok(r.result||0);r.onerror=()=>no(r.error)}catch(e){no(e)}})}function marketSignalDeleteMany(ids){return new Promise((ok,no)=>{try{let t=db.transaction("marketSignals","readwrite"),s=t.objectStore("marketSignals");for(const id of ids||[])s.delete(id);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)}catch(e){no(e)}})}
function marketSignalClear(){return new Promise((ok,no)=>{try{let r=db.transaction("marketSignals","readwrite").objectStore("marketSignals").clear();r.onsuccess=()=>ok();r.onerror=()=>no(r.error)}catch(e){no(e)}})}function catalogPutMany(rows){return new Promise((ok,no)=>{try{let t=db.transaction("catalog","readwrite"),s=t.objectStore("catalog");for(const x of rows||[])if(x&&x.id)s.put(x);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)}catch(e){no(e)}})}function catalogAll(){return new Promise((ok,no)=>{try{let r=db.transaction("catalog").objectStore("catalog").getAll();r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>no(r.error)}catch(e){no(e)}})}function catalogCount(universe){return new Promise((ok,no)=>{try{let s=db.transaction("catalog").objectStore("catalog"),r=universe?s.index("universe").count(IDBKeyRange.only(universe)):s.count();r.onsuccess=()=>ok(r.result||0);r.onerror=()=>no(r.error)}catch(e){no(e)}})}let state=JSON.parse(localStorage.getItem(KEY)||"null")||{cards:seed,watch:[],history:[],market:[]};if(!state.market)state.market=[];if(!state.watch)state.watch=[];if(!state.history)state.history=[];if(!state.marketScan)state.marketScan=[];if(!state.marketScanHistory)state.marketScanHistory=[];if(!state.compare)state.compare=[];if(!state.alertHistory)state.alertHistory=[];if(!state.signalHistory)state.signalHistory=[];if(!state.analystWeights)state.analystWeights={momentum:.30,value:.22,stability:.18,global:.12,data:.18,scarcity:.12};if(!state.processingLog)state.processingLog=[];if(!state.selfTest)state.selfTest={};if(!state.photoValidation)state.photoValidation={};if(!state.certification)state.certification={};if(!state.releaseChecks)state.releaseChecks={};if(!state.runtimeErrors)state.runtimeErrors=[];if(!state.dataQuality)state.dataQuality={};if(!state.schemaVersion||state.schemaVersion<43)state.schemaVersion=68;if(!state.marketCursor)state.marketCursor=0;if(!state.marketUniverse)state.marketUniverse={};if(!state.marketCoverage)state.marketCoverage={total:0,seen:0,priced:0,at:null};if(!state.marketScannedIds)state.marketScannedIds={};if(!state.marketFailures)state.marketFailures={};if(!state.coverageByUniverse)state.coverageByUniverse={pokemon:state.marketCoverage||{},lorcana:{total:0,seen:0,priced:0,active:0,stale:0,failed:0,at:null}};if(!state.cursorByUniverse)state.cursorByUniverse={pokemon:state.marketCursor||0,lorcana:0};if(!state.archivedUniverses)state.archivedUniverses={};if(!state.gradingEconomics||typeof state.gradingEconomics!=="object")state.gradingEconomics={buy:0,buyShip:0,gradeCost:0,psa9:0,psa10:0,sellFeePct:0};if(state.gradingEconomics.buy===50&&state.gradingEconomics.buyShip===5&&state.gradingEconomics.gradeCost===40&&state.gradingEconomics.psa9===100&&state.gradingEconomics.psa10===250&&state.gradingEconomics.sellFeePct===13)state.gradingEconomics={buy:0,buyShip:0,gradeCost:0,psa9:0,psa10:0,sellFeePct:0};if(!state.investmentProfile||typeof state.investmentProfile!=="object")state.investmentProfile={minPriceEUR:20,maxPriceEUR:150,minUpsideEUR:40,minPriceUSD:25,maxPriceUSD:170,minUpsideUSD:45};if(!state.operationPolicy||typeof state.operationPolicy!=="object")state.operationPolicy={minPurchaseEUR:20,minProfitEUR:40,minROI:35};state.operationPolicy.minPurchaseEUR=Math.max(20,+state.operationPolicy.minPurchaseEUR||20);state.operationPolicy.minProfitEUR=Math.max(40,+state.operationPolicy.minProfitEUR||40);state.operationPolicy.minROI=Math.max(35,+state.operationPolicy.minROI||35);
if(!state.profitFloorV775){
  state.operationPolicy.minProfitEUR=40;
  if(state.investmentProfile){state.investmentProfile.minUpsideEUR=40;state.investmentProfile.minUpsideUSD=45}
  state.profitFloorV775=true;
}if(!state.investmentProfileMigrationV742){if((+state.investmentProfile.minPriceEUR||0)===40)state.investmentProfile.minPriceEUR=20;if((+state.investmentProfile.minPriceUSD||0)===45)state.investmentProfile.minPriceUSD=25;state.investmentProfileMigrationV742=true;}if(!state.catalogMeta)state.catalogMeta={pokemon:{count:0,at:null},lorcana:{count:0,sets:0,at:null}};if(!state.processingLog)state.processingLog=[];if(!state.selfTest)state.selfTest={};if(!state.photoValidation)state.photoValidation={};if(!state.certification)state.certification={};if(!state.releaseChecks)state.releaseChecks={};if(!state.runtimeErrors)state.runtimeErrors=[];state=ensureStateShape(state);
if(!state.userCollectionImport20260927){
  const imported=[
    {id:"own-lapras-gx-151-sm1-es",universe:"pokemon",name:"Lapras GX",number:"151/149",set:"Sol y Luna",year:"2017",language:"Español",grading:"RAW",grade:"",value:21.79,purchase:null,quantity:1,purchaseDate:"",purpose:"investment",draft:false,catalogId:"sm1-151",referenceImage:"https://images.pokemontcg.io/sm1/151_hires.png",marketPricing:{value:21.79,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Sun-Moon/Lapras-GX-V3-SUM151",checkedAt:"2026-09-27",avg30:21.05,avg7:26.51},notes:"Carta propia fotografiada · RAW · estado exacto pendiente de reverso."},
    {id:"own-team-skull-grunt-149-sm1-es",universe:"pokemon",name:"Recluta del Team Skull",number:"149/149",set:"Sol y Luna",year:"2017",language:"Español",grading:"RAW",grade:"",value:7.60,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",draft:false,catalogId:"sm1-149",referenceImage:"https://images.pokemontcg.io/sm1/149_hires.png",marketPricing:{value:7.60,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Sun-Moon/Team-Skull-Grunt-V2-SUM149",checkedAt:"2026-09-27",avg30:7.83,avg7:8.45},notes:"Carta propia fotografiada · Full Art · estado exacto pendiente de reverso."},
    {id:"own-lurantis-gx-138-sm1-es",universe:"pokemon",name:"Lurantis GX",number:"138/149",set:"Sol y Luna",year:"2017",language:"Español",grading:"RAW",grade:"",value:3.35,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",draft:false,catalogId:"sm1-138",referenceImage:"https://images.pokemontcg.io/sm1/138_hires.png",marketPricing:{value:3.35,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Sun-Moon/Lurantis-GX-V2-SUM138",checkedAt:"2026-09-27",avg30:3.73,avg7:3.35},notes:"Carta propia fotografiada · RAW."},
    {id:"own-decidueye-gx-12-sm1-es",universe:"pokemon",name:"Decidueye GX",number:"12/149",set:"Sol y Luna",year:"2017",language:"Español",grading:"RAW",grade:"",value:3.02,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",draft:false,catalogId:"sm1-12",referenceImage:"https://images.pokemontcg.io/sm1/12_hires.png",marketPricing:{value:3.02,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Sun-Moon/Decidueye-GX-SUM12",checkedAt:"2026-09-27",avg30:2.77,avg7:3.03},notes:"Carta propia fotografiada · RAW."},
    {id:"own-venusaur-ex-182-mew-es",universe:"pokemon",name:"Venusaur ex",number:"182/165",set:"151",year:"2023",language:"Español",grading:"RAW",grade:"",value:19.20,purchase:null,quantity:1,purchaseDate:"",purpose:"investment",draft:false,catalogId:"sv3pt5-182",referenceImage:"https://images.pokemontcg.io/sv3pt5/182_hires.png",marketPricing:{value:19.20,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/151/Venusaur-ex-V2-MEW182",checkedAt:"2026-09-27",avg30:18.24,avg7:18.63},notes:"Carta propia fotografiada · Ultra Rare / Full Art · estado exacto pendiente de reverso."},
    {id:"own-arbok-ex-185-mew-es",universe:"pokemon",name:"Arbok ex",number:"185/165",set:"151",year:"2023",language:"Español",grading:"RAW",grade:"",value:9.46,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",draft:false,catalogId:"sv3pt5-185",referenceImage:"https://images.pokemontcg.io/sv3pt5/185_hires.png",marketPricing:{value:9.46,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/151/Arbok-ex-V2-MEW185",checkedAt:"2026-09-27",avg30:9.71,avg7:9.61},notes:"Carta propia fotografiada · Ultra Rare / Full Art · RAW."},
    {id:"own-omanyte-180-mew-es",universe:"pokemon",name:"Omanyte",number:"180/165",set:"151",year:"2023",language:"Español",grading:"RAW",grade:"",value:17.68,purchase:null,quantity:1,purchaseDate:"",purpose:"investment",draft:false,catalogId:"sv3pt5-180",referenceImage:"https://images.pokemontcg.io/sv3pt5/180_hires.png",marketPricing:{value:17.68,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/en/Pokemon/Products/Singles/151/Omanyte-V2-MEW180",checkedAt:"2026-09-27",avg30:17.47,avg7:17.10},notes:"Carta propia fotografiada · Illustration Rare · estado exacto pendiente de reverso."},
    {id:"own-metang-094-cri-es",universe:"pokemon",name:"Metang",number:"094/086",set:"Caos Creciente",year:"2026",language:"Español",grading:"RAW",grade:"",value:2.87,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",draft:false,catalogId:"cri-094",marketPricing:{value:2.87,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Chaos-Rising/Metang-V2-CRI095",checkedAt:"2026-09-27",avg30:3.07,avg7:2.85},notes:"Carta propia fotografiada · Illustration Rare · #094/086. Estado exacto pendiente de reverso."},
    {id:"own-wigglytuff-147-paf-es",universe:"pokemon",name:"Wigglytuff",number:"147/091",set:"Destinos de Paldea",year:"2024",language:"Español",grading:"RAW",grade:"",value:3.88,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",draft:false,catalogId:"sv4pt5-147",referenceImage:"https://images.pokemontcg.io/sv4pt5/147_hires.png",marketPricing:{value:3.88,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/en/Pokemon/Products/Singles/Paldean-Fates/Wigglytuff-PAF147",checkedAt:"2026-09-27",avg30:3.70,avg7:3.95},notes:"Carta propia fotografiada · Shiny Rare · RAW."},
    {id:"own-eiscue-ex-222-obf-es",universe:"pokemon",name:"Eiscue ex",number:"222/197",set:"Llamas Obsidianas",year:"2023",language:"Español",grading:"RAW",grade:"",value:4.49,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",draft:false,catalogId:"sv3-222",referenceImage:"https://images.pokemontcg.io/sv3/222_hires.png",marketPricing:{value:4.49,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Obsidian-Flames/Eiscue-ex-V3-OBF222",checkedAt:"2026-09-27",avg30:4.33,avg7:4.58},notes:"Carta propia fotografiada · RAW."},
    {id:"own-eevee-ex-075-pre-es",universe:"pokemon",name:"Eevee ex",number:"075/131",set:"Evoluciones Prismáticas",year:"2025",language:"Español",grading:"RAW",grade:"",value:6.46,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",draft:false,catalogId:"sv8pt5-75",referenceImage:"https://images.pokemontcg.io/sv8pt5/75_hires.png",marketPricing:{value:6.46,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Prismatic-Evolutions/Eevee-ex-V1-PRE075",checkedAt:"2026-09-27",avg30:6.18,avg7:6.51},notes:"Carta propia fotografiada · versión PRE 075/131 sin sello adicional visible · RAW."},
    {id:"own-great-tusk-ex-053-paf-es",universe:"pokemon",name:"Colmilargo ex",number:"053/091",set:"Destinos de Paldea",year:"2024",language:"Español",grading:"RAW",grade:"",value:0.60,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",draft:false,catalogId:"sv4pt5-53",referenceImage:"https://images.pokemontcg.io/sv4pt5/53_hires.png",marketPricing:{value:0.60,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/en/Pokemon/Products/Singles/Paldean-Fates/Great-Tusk-ex-PAF053",checkedAt:"2026-09-27",avg30:0.58,avg7:0.71},notes:"Carta propia fotografiada · Great Tusk ex / Colmilargo ex · RAW."}
  ];
  const same=(a,b)=>norm(a.name)===norm(b.name)&&norm(a.number)===norm(b.number)&&norm(a.set)===norm(b.set);
  for(const c of imported)if(!state.cards.some(x=>x.id===c.id||same(x,c)))state.cards.push(c);
  state.userCollectionImport20260927={at:new Date().toISOString(),count:imported.length,pricing:"Cardmarket EUR reference"};
}
if(!state.userCollectionImportVintage20260927){
  const imported=[
    {id:"own-hitmonlee-106-jp-fossil-psa5",universe:"pokemon",name:"Hitmonlee",number:"106",set:"Japanese Mystery of the Fossils",year:"1997",language:"Japonés",grading:"PSA",grade:"5",cert:"57688397",value:21.86,purchase:null,quantity:1,purchaseDate:"",purpose:"investment",draft:false,variant:"Holo",marketPricing:{value:21.86,currency:"EUR",source:"Setlot PSA 5 · 24.93 USD convertido con referencia ECB 25/09/2026",url:"https://app.setlot.com/catalog/pokemon/japanese-mystery-of-the-fossils/hitmonlee-106",checkedAt:"2026-09-27"},notes:"Carta propia fotografiada · PSA 5 EX · etiqueta 1997 P.M. Japanese Fossil Hitmonlee-Holo #106 · cert 57688397 visible. Certificado fotografiado; verificación PSA online pendiente de consulta directa."},
    {id:"own-toxtricity-089-m2-jp",universe:"pokemon",name:"Toxtricity",number:"089/080",set:"Inferno X",year:"2025",language:"Japonés",grading:"RAW",grade:"",value:1.17,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",draft:false,variant:"Art Rare",marketPricing:{value:1.17,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Inferno-X/Toxtricity-V2-m2089",checkedAt:"2026-09-27",avg30:1.18,avg7:1.15},notes:"Carta propia fotografiada frontal + reverso · m2 089/080 AR. No es una posición prioritaria de inversión por su bajo valor absoluto."},
    {id:"own-gyarados-ex-089-xy9-jp",valuationStatus:"reference",universe:"pokemon",name:"Gyarados EX",number:"089/080",set:"Rage of the Broken Heavens",year:"2015",language:"Japonés",grading:"RAW",grade:"",value:509.76,purchase:null,quantity:1,purchaseDate:"",purpose:"investment",draft:false,variant:"UR / Secret",marketPricing:{value:509.76,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Rage-of-the-Broken-Heavens/Gyarados-EX-V3",checkedAt:"2026-09-27",avg30:274.17,avg7:535.49},notes:"Carta propia fotografiada frontal + reverso · XY9 089/080 UR. Pieza de alto valor. 509,76 € es referencia de mercado, NO valoración definitiva del ejemplar; condición debe revisarse fuera del toploader antes de vender o graduar."},
    {id:"own-machamp-gx-154-bus-es",universe:"pokemon",name:"Machamp GX",number:"154/147",set:"Sombras Ardientes",year:"2017",language:"Español",grading:"RAW",grade:"",value:15.35,purchase:null,quantity:1,purchaseDate:"",purpose:"investment",draft:false,variant:"Secret Rainbow Rare",marketPricing:{value:15.35,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Burning-Shadows/Machamp-GX-V3-BUS154",checkedAt:"2026-09-27",avg30:15.81,avg7:17.43},notes:"Carta propia fotografiada · Secret Rainbow Rare. Estado exacto pendiente de reverso."},
    {id:"own-mewtwo-118-ec1-jp-1ed-holo",valuationStatus:"reference",universe:"pokemon",name:"Mewtwo",number:"118/128",set:"Base Expansion Pack / e-Card",year:"2001",language:"Japonés",grading:"RAW",grade:"",value:840.42,purchase:null,quantity:1,purchaseDate:"",purpose:"investment",draft:false,variant:"1st Edition Holo",marketPricing:{value:840.42,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Expansion-Pack/Mewtwo-V2-EC1118",checkedAt:"2026-09-27",avg30:472.08,avg7:741.25},notes:"Carta propia fotografiada · Japanese e-Card Mewtwo 118/128 Holo 1st Edition. Pieza potencialmente muy valiosa. 840,42 € es referencia de mercado agregada; NO es valor definitivo del ejemplar. Prioridad máxima: foto del reverso y revisión de superficie/bordes antes de cualquier decisión."},
    {id:"own-surfing-pikachu-mt-fuji-jr-1997",valuationStatus:"reference",universe:"pokemon",name:"Surfing Pikachu",number:"025",set:"Unnumbered Promos",year:"1997",language:"Japonés",grading:"RAW",grade:"",value:289.78,purchase:null,quantity:1,purchaseDate:"",purpose:"investment",draft:false,variant:"Mt. Fuji / JR Stamp Rally · Unnumbered Promos V1",marketPricing:{value:289.78,currency:"EUR",source:"Cardmarket · tendencia",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Unnumbered-Promos/Surfing-Pikachu-V1-UNP",checkedAt:"2026-09-27",avg30:189.62,avg7:495.87},notes:"Carta propia fotografiada · Surfing Pikachu No.025 con Mt. Fuji y tren JR, compatible con promo JR Stamp Rally 1997 / Unnumbered Promos V1. Mercado muy ilíquido y volátil: solo 4-5 ofertas europeas recientes. Referencia NO ajustada a condición; falta reverso."}
  ];
  const same=(a,b)=>norm(a.name)===norm(b.name)&&norm(a.number)===norm(b.number)&&norm(a.set)===norm(b.set);
  for(const c of imported)if(!state.cards.some(x=>x.id===c.id||same(x,c)))state.cards.push(c);
  state.userCollectionImportVintage20260927={at:new Date().toISOString(),count:imported.length,pricing:"EUR market references; high-value copies condition-pending"};
}
if(!state.conditionMarketV876){
  const g=(state.cards||[]).find(c=>c.id==="own-gyarados-ex-089-xy9-jp");
  if(g){
    g.valuationStatus="condition-reference";
    g.condition="GD";g.grade="GD";
    g.conditionMarket={matched:true,condition:"GD",askEUR:190,source:"Cardmarket · oferta activa misma impresión/condición",seller:"CardsRealm",sourceUrl:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Rage-of-the-Broken-Heavens/Gyarados-EX-V3",checkedAt:"2026-09-27"};
    g.notes=(g.notes||"")+" · V87.6: oferta activa comparable GD a 190 €; no es venta cerrada.";
  }
  state.conditionMarketV876=true;save();
}
if(!state.listingTruthV881){
 const facts={
  "own-gyarados-ex-089-xy9-jp":{price:169.90,condition:"GD"},
  "own-mewtwo-118-ec1-jp-1ed-holo":{price:149.90,condition:"PO"},
  "own-surfing-pikachu-mt-fuji-jr-1997":{price:229.90,condition:"PO"}
 };
 for(const c of state.cards||[]){
  const x=facts[c.id];if(!x)continue;
  c.currentListing={channel:"Cardmarket",priceEUR:x.price,condition:x.condition,status:"active",confirmedAt:"2026-09-27",source:"user-screenshot"};
  if(c.previousSaleRecommendation?.status==="withdrawn"&&c.id==="own-mewtwo-118-ec1-jp-1ed-holo"){
   c.previousSaleRecommendation={priceEUR:149.90,status:"active-user-listing",reason:"El usuario confirma que sigue publicado en Cardmarket."};
  }
 }
 state.listingTruthV881=true;save();
}
if(!state.legacyReferenceImagesV880){
  const refs={
   "own-gyarados-ex-089-xy9-jp":"https://static.mercdn.net/item/detail/orig/photos/m37477880305_1.jpg",
   "own-mewtwo-118-ec1-jp-1ed-holo":"https://down-ph.img.susercontent.com/file/ph-11134207-7qul4-lg4jm0xnb3w083",
   "own-surfing-pikachu-mt-fuji-jr-1997":"https://cdn-vault.fanaticscollect.com/2026/3/6/wr12/large/v2783490_20260306155210986M_1.jpg"
  };
  for(const c of state.cards||[]){if(refs[c.id]&&!c.photoURL&&!c.photo){c.referenceImage=refs[c.id];c.referenceImageSource="external-reference"}}
  state.legacyReferenceImagesV880=true;save();
}
if(!state.mewtwoPricingCorrectionV880){
  const m=(state.cards||[]).find(c=>c.id==="own-mewtwo-118-ec1-jp-1ed-holo");
  if(m){
    m.purchase=50;m.grade="PO";m.condition="PO";m.conditionVerified=true;m.conditionVerifiedBy="photos";
    m.valuationStatus="reference";
    m.marketContext={exactCardFloorEUR:279.99,floorCondition:"EX- / pequeña doblez",source:"Cardmarket",sourceUrl:"https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Expansion-Pack/Mewtwo-V2-EC1118",checkedAt:"2026-09-27",note:"No es comparable PO; solo contexto del mercado exacto."};
    m.previousSaleRecommendation={priceEUR:149.90,status:"active-user-listing",reason:"Precio publicado actualmente por el usuario en Cardmarket; no equivale a valoración PO validada."};
    m.notes=(m.notes||"")+" · V88.0: recomendación anterior 149,90 € RETIRADA. Cardmarket exacto empieza en 279,99 € con copia EX-; no asignar valor PO sin comparable PO.";
  }
  for(const x of (state.saleListings||[]))if(x.id==="listing-mewtwo-ec1"){
    x.status="active";x.pauseReason="";x.userConfirmed=true;x.price=149.90;x.updatedAt=new Date().toISOString();
  }
  state.mewtwoPricingCorrectionV880=true;save();
}
if(!state.collectionFactsV872){
  const facts={
    "own-gyarados-ex-089-xy9-jp":{purchase:119.45,grade:"GD",condition:"GD",conditionVerified:true,conditionVerifiedBy:"photos"},
    "own-mewtwo-118-ec1-jp-1ed-holo":{purchase:50,grade:"PO",condition:"PO",conditionVerified:true,conditionVerifiedBy:"photos"},
    "own-surfing-pikachu-mt-fuji-jr-1997":{purchase:100,grade:"PO",condition:"PO",conditionVerified:true,conditionVerifiedBy:"photos"}
  };
  for(const c of state.cards||[]){
    const x=facts[c.id];if(!x)continue;
    Object.assign(c,x);
    c.valuationStatus="reference";
    c.notes=(c.notes||"")+" · V87.2: condición confirmada por fotos previas; referencia general NO equivale al valor de este ejemplar.";
  }
  state.collectionFactsV872=true;save();
}
if(!state.valuationReferenceMigrationV744){
  const refs=new Set(["own-ancient-mew-2000-international","own-gyarados-ex-089-xy9-jp","own-mewtwo-118-ec1-jp-1ed-holo","own-surfing-pikachu-mt-fuji-jr-1997"]);
  for(const c of state.cards||[])if(refs.has(c.id))c.valuationStatus="reference";
  state.valuationReferenceMigrationV744=true;
}
if(!state.purchaseEvidenceMigrationV746){
  const rows={
    "own-mewtwo-118-ec1-jp-1ed-holo":{purchase:50,condition:"PO",purchaseSource:"Cardmarket",purchaseEvidence:"Cardmarket order screenshot",purchaseEvidenceDate:"2025-11-04",provenance:"Cardmarket purchase · original confirmed by owner",identityVerifiedBy:"user",authenticityStatus:"owner-confirmed-original"},
    "own-surfing-pikachu-mt-fuji-jr-1997":{purchase:100,condition:"PO",purchaseSource:"Cardmarket",purchaseEvidence:"Cardmarket order screenshot",purchaseEvidenceDate:"2025-11-09",provenance:"Cardmarket purchase · original confirmed by owner",identityVerifiedBy:"user",authenticityStatus:"owner-confirmed-original"},
    "own-gyarados-ex-089-xy9-jp":{purchase:119.45,condition:"GD",purchaseSource:"Cardmarket",purchaseEvidence:"Cardmarket order screenshot",purchaseEvidenceDate:"2025-11-13",provenance:"Cardmarket purchase · original confirmed by owner",identityVerifiedBy:"user",authenticityStatus:"owner-confirmed-original"}
  };
  for(const c of state.cards||[]){const u=rows[c.id];if(!u)continue;Object.assign(c,u);
    if(c.id==="own-surfing-pikachu-mt-fuji-jr-1997")c.notes="Carta propia fotografiada frontal + reverso · Surfing Pikachu No.025 Mt. Fuji / JR Stamp Rally · comprada en Cardmarket por 100,00 € · condición PO (Poor) declarada por el vendedor · fuerte pliegue horizontal visible en frontal y reverso · autenticidad/originalidad confirmada por el propietario · no candidata a PSA por rentabilidad.";
    if(c.id==="own-mewtwo-118-ec1-jp-1ed-holo")c.notes="Carta propia fotografiada · Japanese e-Card Mewtwo 118/128 Holo 1st Edition · comprada en Cardmarket por 50,00 € · condición PO (Poor) declarada por el vendedor · autenticidad/originalidad confirmada por el propietario · valor actual debe ajustarse a condición; falta reverso detallado.";
    if(c.id==="own-gyarados-ex-089-xy9-jp")c.notes="Carta propia fotografiada frontal + reverso · XY9 089/080 UR · comprada en Cardmarket por 119,45 € · condición GD (Good) declarada por el vendedor · autenticidad/originalidad confirmada por el propietario · pieza de alto valor; referencia de mercado pendiente de ajuste fino por condición.";
  }
  state.purchaseEvidenceMigrationV746=true;
}
if(!state.conditionMarketMigrationV747){
  const byId={
    "own-gyarados-ex-089-xy9-jp":{conditionMarket:{condition:"GD",askEUR:190,source:"Cardmarket · oferta GD actual",sourceUrl:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Rage-of-the-Broken-Heavens/Gyarados-EX-V3",checkedAt:"2026-09-27",kind:"active-ask",matched:true},valuationStatus:"condition-reference"},
    "own-mewtwo-118-ec1-jp-1ed-holo":{conditionMarket:{condition:"PO",askEUR:null,source:"Cardmarket · sin PO comparable actual; mínimo observado EX- 279,99 €",sourceUrl:"https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Expansion-Pack/Mewtwo-V2-EC1118",checkedAt:"2026-09-27",kind:"no-condition-match",matched:false},valuationStatus:"reference"},
    "own-surfing-pikachu-mt-fuji-jr-1997":{conditionMarket:{condition:"PO",askEUR:null,source:"Cardmarket · V1 sin PO comparable actual; ofertas actuales desde NM 1.400 € / PL 1.499,98 € / GD 1.999,95 €",sourceUrl:"https://www.cardmarket.com/en/Pokemon/Products/Singles/Unnumbered-Promos/Surfing-Pikachu-V1-UNP",checkedAt:"2026-09-27",kind:"no-condition-match",matched:false},valuationStatus:"reference"}
  };
  for(const c of state.cards||[]){const u=byId[c.id];if(u)Object.assign(c,u)}
  state.conditionMarketMigrationV747=true;
}
if(!state.mewRemovalAndMewtwoConditionV748){
  state.cards=(state.cards||[]).filter(c=>c.id!=="own-ancient-mew-2000-international");
  const m=state.cards.find(c=>c.id==="own-mewtwo-118-ec1-jp-1ed-holo");
  if(m){
    m.condition="PO";
    m.valuationStatus="reference";
    m.psaCandidate=false;
    m.conditionAssessment={
      at:"2026-09-27",
      source:"owner photos",
      front:"visible structural crease/damage, especially lower-left corner; surface wear",
      back:"strong lower-right crease/abrasion, top vertical creases, edge whitening/wear",
      conclusion:"PO (Poor) consistent with Cardmarket purchase condition",
      grading:"PSA not recommended for investment"
    };
    m.notes="Carta propia fotografiada frontal + reverso · Japanese e-Card Mewtwo 118/128 Holo 1st Edition · comprada en Cardmarket por 50,00 € · condición PO (Poor) confirmada por fotos y por el vendedor. Daño estructural visible: pliegue fuerte en esquina inferior izquierda frontal, gran crease/abrasión en esquina inferior derecha del reverso, varias líneas verticales/creases en borde superior y desgaste general de bordes. Autenticidad/originalidad confirmada por el propietario. No candidata a PSA por rentabilidad. Valor de mercado PO pendiente de comparable directo.";
  }
  state.mewRemovalAndMewtwoConditionV748=true;
}
if(!state.gyaradosConditionClosureV749){
  const g=state.cards.find(c=>c.id==="own-gyarados-ex-089-xy9-jp");
  if(g){
    g.condition="GD";
    g.conditionDetail="GD+ / EX- visual";
    g.psaCandidate=false;
    g.purpose="investment";
    g.valuationStatus="condition-reference";
    g.conditionAssessment={
      at:"2026-09-27",
      source:"owner photos",
      front:"good overall eye appeal; light edge/corner wear on gold border; no major crease visible",
      back:"light whitening/edge wear and small corner wear; no major structural crease visible",
      conclusion:"GD high-end, visually close to EX-",
      grading:"RAW hold preferred; PSA not priority"
    };
    g.sellPolicy={
      mode:"hold",
      minimumAskEUR:180,
      rationale:"Do not sell for a small gain; current condition-matched reference around 190 EUR. Review again before listing."
    };
    g.notes="Carta propia fotografiada frontal + reverso · XY9 089/080 UR · comprada en Cardmarket por 119,45 € · condición GD declarada por el vendedor y confirmada por fotos. Visualmente GD+ / cerca de EX-: buena presencia general, desgaste ligero de bordes/esquinas y sin pliegues estructurales fuertes visibles. Autenticidad/originalidad confirmada por el propietario. Mantener RAW; PSA no prioritario. No vender por margen pequeño; referencia interna de salida mínima 180 € salvo nueva evidencia.";
  }
  state.gyaradosConditionClosureV749=true;
}
if(!state.quickSalePlanV7410){
  const plans={
    "own-gyarados-ex-089-xy9-jp":{mode:"sell-fast",channel:"Cardmarket",listEUR:179.90,floorEUR:169.90,reason:"Current GD comparable is 190 EUR. List just below it for a fast sale while preserving a meaningful net margin over 119.45 EUR cost.",status:"LISTAR YA"},
    "own-mewtwo-118-ec1-jp-1ed-holo":{mode:"sell-fast",channel:"Cardmarket",listEUR:179.90,floorEUR:149.90,reason:"PO copy with heavy structural wear; no direct PO comparable. Price far below current EX-/GD asks to create liquidity without giving it away.",status:"LISTAR YA"},
    "own-surfing-pikachu-mt-fuji-jr-1997":{mode:"sell-fast",channel:"Cardmarket",listEUR:279.90,floorEUR:229.90,reason:"PO with strong crease; scarce V1 and no direct PO comparable. Start near market trend, then reduce if needed for a fast sale.",status:"LISTAR YA"}
  };
  for(const c of state.cards||[]){const p=plans[c.id];if(p){c.sellPolicy=p;c.purpose="sell"}}
  state.quickSalePlanV7410=true;
}
if(!state.charizard228GradeFixV7411){
  const c=state.cards.find(x=>x.id==="cha228");
  if(c){c.grading="PSA";c.grade=8;c.notes=((c.notes||"")+" · Grado corregido por propietario: PSA 8.").trim()}
  state.charizard228GradeFixV7411=true;
}
if(!state.eeveeSaleReinvestmentV751){
  const e=state.cards.find(c=>c.id==="eev174");
  if(e){e.archivedSold=true;e.soldAt="2026-09-27";e.soldPrice=60;e.saleChannel="Cardmarket";e.saleOrder="1304093225";e.fulfillmentStatus="sold-awaiting-shipment";e.reinvestable=true;e.notes=((e.notes||"")+" · Vendida en Cardmarket por 60,00 € · Sale #1304093225 · envío pendiente 28/09/2026 · capital reservado para reinversión.").trim()}
  state.eeveeSaleReinvestmentV751=true;
}
if(!state.eeveeSuperPremiumProvenanceV752){
  const e=state.cards.find(c=>c.id==="eev174");
  if(e){
    e.acquisitionSource="Prismatic Evolutions Super-Premium Collection";
    e.parentProductCostEUR=120;
    e.parentProductCostApprox=true;
    e.costBasisAllocationStatus="pending";
    e.purchase=null;
    e.acquisitionNotes="Promo incluida en Prismatic Evolutions Super-Premium Collection. Producto completo costó aproximadamente 120 €. Incluía 15 sobres, playmat, 65 fundas y caja/deck box de Eevee. Parte de los accesorios se vendieron posteriormente; coste específico de la promo no asignado.";
    e.notes=((e.notes||"")+" · Procedencia corregida: promo incluida en Prismatic Evolutions Super-Premium Collection (~120 € el producto completo), no salida de un sobre. Coste individual pendiente de reparto.").trim();
  }
  state.eeveeSuperPremiumProvenanceV752=true;
}
if(!state.prismaticSPCSharedProvenanceV753){
  const parent={name:"Prismatic Evolutions Super-Premium Collection",costEUR:120,costApprox:true,contentsNote:"15 sobres + promo Eevee ex + playmat + 65 fundas + caja/accesorio Eevee; parte de accesorios vendida posteriormente"};
  const promo=state.cards.find(c=>c.id==="eev174");
  if(promo){
    promo.acquisitionSource=parent.name;
    promo.parentProductCostEUR=parent.costEUR;
    promo.parentProductCostApprox=true;
    promo.costBasisAllocationStatus="pending";
    promo.purchase=null;
    promo.acquisitionType="included-promo";
    promo.acquisitionNotes="Promo incluida directamente en la Super-Premium Collection de Evoluciones Prismáticas (~120 € el producto completo). Coste individual no asignado.";
  }
  const pulledEevee=state.cards.find(c=>c.id==="own-eevee-ex-075-pre-es");
  if(pulledEevee){
    pulledEevee.acquisitionSource=parent.name;
    pulledEevee.parentProductCostEUR=parent.costEUR;
    pulledEevee.parentProductCostApprox=true;
    pulledEevee.costBasisAllocationStatus="pending";
    pulledEevee.purchase=null;
    pulledEevee.acquisitionType="booster-pull";
    pulledEevee.acquisitionNotes="Obtenida en uno de los 15 sobres de la misma Super-Premium Collection de Evoluciones Prismáticas. Coste individual no asignado.";
  }
  const vap=state.cards.find(c=>c.id==="vap149");
  if(vap){
    vap.acquisitionSource=parent.name;
    vap.parentProductCostEUR=parent.costEUR;
    vap.parentProductCostApprox=true;
    vap.costBasisAllocationStatus="pending";
    vap.purchase=null;
    vap.acquisitionType="booster-pull";
    vap.acquisitionNotes="Obtenida en uno de los 15 sobres de la misma Super-Premium Collection de Evoluciones Prismáticas. Coste individual no asignado.";
  }
  state.prismaticSPCParentProduct=parent;
  state.prismaticSPCSharedProvenanceV753=true;
}
const soldEevee=state.cards.find(c=>c.id==="eev174");if(soldEevee&&!soldEevee.sale1304093225Applied){const q=Math.max(1,+soldEevee.quantity||1);if(q>1)soldEevee.quantity=q-1;else soldEevee.archivedSold=true;soldEevee.sale1304093225Applied=true;soldEevee.soldAt="2026-09-27";soldEevee.soldPrice=60;}const refImages={vap149:"https://images.pokemontcg.io/sv8pt5/149_hires.png",eev174:"https://images.pokemontcg.io/svp/174_hires.png",cha074:"https://images.pokemontcg.io/svp/74_hires.png",cha228:"https://images.pokemontcg.io/sv3/228_hires.png"};for(const c of state.cards){if(refImages[c.id]&&!c.referenceImage)c.referenceImage=refImages[c.id]}save();let radarLimit=999999;
const euro=n=>(+n||0).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const qty=x=>Math.max(1,+x.quantity||1);
const activeCards=()=>state.cards.filter(x=>!x.archivedSold);
const primePortfolio=()=>{try{return window.CVPrimeValuation?.portfolio?.()||null}catch{return null}};
const confirmedTotal=()=>{const p=primePortfolio();return p?p.confirmed:activeCards().filter(x=>x.valuationStatus!=="reference").reduce((a,x)=>a+(+x.value||0)*qty(x),0)};
const provisionalTotal=()=>{const p=primePortfolio();return p?p.provisional:activeCards().filter(x=>x.valuationStatus==="reference").reduce((a,x)=>a+(+x.value||0)*qty(x),0)};
const total=()=>confirmedTotal()+provisionalTotal();
const invested=()=>activeCards().reduce((a,x)=>a+(x.purchase==null?0:(+x.purchase||0)*qty(x)),0);const confirmedInvested=()=>activeCards().filter(x=>x.valuationStatus!=="reference").reduce((a,x)=>a+(x.purchase==null?0:(+x.purchase||0)*qty(x)),0);
const drafts=()=>activeCards().filter(x=>x.draft).length;
const gain=()=>{const p=primePortfolio();return p?p.latentPrudent:confirmedTotal()-confirmedInvested()};function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function universeLabel(u){return u==="lorcana"?"Lorcana":"Pokémon"}
function universeIcon(u){return u==="lorcana"?"✨":"⚡"}
function currentRadarUniverse(){const u=document.querySelector("#radarUniverse")?.value||"pokemon";return u==="lorcana"?"lorcana":"pokemon"}
function cardUniverse(c){return c?.universe==="lorcana"?"lorcana":"pokemon"}
function marketUniverseOf(x){return x?.universe==="lorcana"?"lorcana":"pokemon"}
function money(n,currency="EUR"){return (+n||0).toLocaleString("es-ES",{style:"currency",currency:currency||"EUR"})}
function ensureStateShape(s){
  s=s&&typeof s==="object"?s:{};
  const arrays=["cards","watch","history","market","marketScan","marketScanHistory","compare","alertHistory","signalHistory","processingLog","runtimeErrors","pregradeHistory"];
  for(const k of arrays)if(!Array.isArray(s[k]))s[k]=k==="cards"?[]:[];
  if(!s.analystWeights||typeof s.analystWeights!=="object")s.analystWeights={momentum:.30,value:.22,stability:.18,global:.12,data:.18,scarcity:.12};
  for(const k of ["selfTest","photoValidation","certification","releaseChecks","dataQuality","marketUniverse","marketFailures"])if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]={};
  if(!s.marketCoverage||typeof s.marketCoverage!=="object"||Array.isArray(s.marketCoverage))s.marketCoverage={total:0,seen:0,priced:0,active:0,stale:0,failed:0,at:null};
  s.marketCursor=Math.max(0,+s.marketCursor||0);
  s.schemaVersion=70;
  for(const c of s.cards){
    if(!c||typeof c!=="object")continue;
    if(!c.universe)c.universe="pokemon";
    if(["vap149","eev174","cha074","cha228"].includes(c.id)&&!c.grading)c.grading="PSA";if(c.universe==="football"){c.archivedUniverse="football";c.universe="pokemon";c.archivedAt=c.archivedAt||new Date().toISOString();}
    if(!c.id)c.id=crypto.randomUUID();
    c.quantity=Math.max(1,+c.quantity||1);
    c.value=Number.isFinite(+c.value)?+c.value:0;
    if(!c.name)c.name="Carta por identificar";
    if(!c.grading)c.grading=(["vap149","eev174","cha074","cha228"].includes(c.id)?"PSA":"RAW");
    if(c.draft==null)c.draft=c.name==="Carta por identificar";
  }
  return s;
}
function renderBootStatus(){
  const box=document.querySelector("#bootPanel");if(!box)return;const b=state.bootInfo||{};
  box.innerHTML='<h3>Inicio y recuperación</h3><div class="qaRow"><span>Esquema de datos</span><b class="ok">V'+(state.schemaVersion||"?")+'</b></div><div class="qaRow"><span>Radar recuperado</span><b class="'+(b.radarLoaded?"ok":"warn")+'">'+(b.radarLoaded?(b.radarCount+" señales"):"Pendiente")+'</b></div><div class="qaRow"><span>Último arranque</span><b>'+(b.at?new Date(b.at).toLocaleString("es-ES"):"—")+'</b></div>';
}
function pushRuntimeError(kind,message){
  try{state.runtimeErrors=state.runtimeErrors||[];state.runtimeErrors.push({at:new Date().toISOString(),kind,message:String(message||"").slice(0,240)});state.runtimeErrors=state.runtimeErrors.slice(-20);save()}catch{}
}
window.addEventListener("error",e=>pushRuntimeError("error",e.message||e.error));
window.addEventListener("unhandledrejection",e=>pushRuntimeError("promise",e.reason?.message||e.reason||"rejection"));
function stateIntegrityReport(){
  const issues=[],ids=new Set();
  if(!Array.isArray(state.cards))issues.push("Colección inválida");
  else for(const c of state.cards){
    if(!c||typeof c!=="object"){issues.push("Ficha inválida");continue}
    if(!c.id)issues.push("Carta sin ID");
    else if(ids.has(c.id))issues.push("ID duplicado: "+c.id); else ids.add(c.id);
    if(c.quantity!=null&&(!Number.isFinite(+c.quantity)||+c.quantity<1))issues.push("Cantidad inválida: "+(c.name||c.id));
    if(c.value!=null&&!Number.isFinite(+c.value))issues.push("Valor inválido: "+(c.name||c.id));
  }
  for(const k of ["watch","history","market","marketScan","marketScanHistory","compare","alertHistory","signalHistory","processingLog","runtimeErrors"])if(!Array.isArray(state[k]))issues.push(k+" no es una lista");if(!state.marketUniverse||typeof state.marketUniverse!=="object"||Array.isArray(state.marketUniverse))issues.push("marketUniverse inválido");if(!state.marketFailures||typeof state.marketFailures!=="object"||Array.isArray(state.marketFailures))issues.push("marketFailures inválido");
  return {ok:issues.length===0,issues};
}
function repairStateIntegrity(){
  const arrays=["cards","watch","history","market","marketScan","marketScanHistory","compare","alertHistory","signalHistory","processingLog","runtimeErrors","pregradeHistory"];
  for(const k of arrays)if(!Array.isArray(state[k]))state[k]=[];if(!state.marketUniverse||typeof state.marketUniverse!=="object"||Array.isArray(state.marketUniverse))state.marketUniverse={};if(!state.marketScannedIds||typeof state.marketScannedIds!=="object"||Array.isArray(state.marketScannedIds))state.marketScannedIds={};if(!state.marketFailures||typeof state.marketFailures!=="object"||Array.isArray(state.marketFailures))state.marketFailures={};
  const seen=new Set(),fixed=[];
  for(const c0 of state.cards){
    if(!c0||typeof c0!=="object")continue;const c=c0;
    if(!c.id||seen.has(c.id))c.id=crypto.randomUUID();seen.add(c.id);
    c.quantity=Math.max(1,Number.isFinite(+c.quantity)?+c.quantity:1);
    c.value=Number.isFinite(+c.value)?+c.value:0;
    if(!c.name)c.name="Carta por identificar";
    if(!c.grading)c.grading="RAW";
    if(c.draft==null)c.draft=c.name==="Carta por identificar";
    fixed.push(c);
  }
  state.cards=fixed;state.runtimeErrors=(state.runtimeErrors||[]).filter(x=>ageDays(x.at)<=14);save();return stateIntegrityReport();
}
function renderIntegrity(){
  const box=document.querySelector("#integrityResults");if(!box)return;const r=stateIntegrityReport(),errs=(state.runtimeErrors||[]),bootAt=new Date(state.bootInfo?.at||0).getTime(),current=errs.filter(x=>new Date(x.at).getTime()>=bootAt&&bootAt>0);
  box.innerHTML='<div class="qaRow"><span>Estado de datos</span><b class="'+(r.ok?"ok":"warn")+'">'+(r.ok?"OK":r.issues.length+" incidencias")+'</b></div>'+
    '<div class="qaRow"><span>Errores de este arranque</span><b class="'+(current.length?"warn":"ok")+'">'+current.length+'</b></div>'+
    '<div class="qaRow"><span>Errores históricos guardados</span><b>'+errs.length+'</b></div>'+
    (current.length?'<div class="integrityIssues">'+current.slice(-5).map(x=>'<div>• '+x.kind+': '+x.message+'</div>').join("")+'</div>':'')+
    (r.issues.length?'<div class="integrityIssues">'+r.issues.slice(0,8).map(x=>'<div>• '+x+'</div>').join("")+'</div>':'');
}
function comparableKeyMatch(m,x){
  if(m.kind!=="sold")return false;
  if((m.currency||"EUR").toUpperCase()!=="EUR")return false;
  if(norm(m.name)!==norm(x.name))return false;
  if(String(m.grading||"")!==String(x.grading||""))return false;
  if(String(m.grade||"")!==String(x.grade||""))return false;
  if(m.set&&x.set&&norm(m.set)!==norm(x.set))return false;
  return true;
}
function forecast(x){
  let obs=state.market.filter(m=>comparableKeyMatch(m,x)).map(m=>({...m,price:+m.price,t:new Date(m.soldDate||m.at||0).getTime()})).filter(m=>m.price>0&&Number.isFinite(m.t)).sort((a,b)=>a.t-b.t).slice(-12);
  if(obs.length<3||!(+x.value>0))return null;
  const mid=Math.ceil(obs.length/2),a=obs.slice(0,mid),b=obs.slice(mid);
  if(!b.length)return null;
  const avg=v=>v.reduce((s,o)=>s+o.price,0)/v.length,first=avg(a),last=avg(b),trend=clamp((last-first)/Math.max(first,1),-.25,.25);
  return {low:+x.value*(1+trend*.5),base:+x.value*(1+trend),high:+x.value*(1+trend*1.75),evidence:obs.length,trend};
}
function catalogImageFor(x){
  const rows=[...(state.marketScan||[]),...(state.marketCandidates||[]),...(state.globalRadar?.scored||[]).map(z=>z.x||z)].filter(Boolean);
  const nn=norm(x.name),num=normNum(x.number);
  const hit=rows.find(r=>r.image&&(x.catalogId&&(r.id===x.catalogId||r.sourceId===x.catalogId)))||
    rows.find(r=>r.image&&norm(r.name)===nn&&(!num||normNum(r.number)===num));
  return hit?.image||"";
}
function activeListingForCard(c){
 const rows=(state.saleListings||[]).filter(x=>x.cardId===c.id&&x.status==="active").sort((a,b)=>new Date(b.updatedAt||b.listedAt||0)-new Date(a.updatedAt||a.listedAt||0));
 return rows[0]||null;
}
async function hydratePhotos(){for(const x of state.cards){if(x.photoKey&&!x.photoURL){let b=await photoGet(x.photoKey);if(b)x.photoURL=URL.createObjectURL(b)}}render()}
function langCodeForCard(c){const s=String(c.language||"").toLowerCase();return s.includes("jap")?"ja":s.includes("espa")?"es":s.includes("fran")?"fr":s.includes("alem")||s.includes("germ")?"de":s.includes("ital")?"it":"en"}
function cardNumHead(v){return String(v||"").split("/")[0].replace(/^0+(?=\d)/,"").trim()}
async function resolvePokemonCatalogImage(c){
 const langs=[langCodeForCard(c),"en"].filter((v,i,a)=>a.indexOf(v)===i),want=cardNumHead(c.number),name=norm(c.name);
 for(const lang of langs){
  const list=await tcgdexList(lang).catch(()=>[]);if(!list.length)continue;
  let matches=list.filter(r=>cardNumHead(r.localId||r.printed_number||r.number)===want);
  const byName=matches.filter(r=>norm(r.name)===name||norm(r.name).includes(name)||name.includes(norm(r.name)));
  if(byName.length===1)matches=byName;
  if(matches.length!==1)continue;
  const d=await tcgdexCard(lang,matches[0].id).catch(()=>null);
  const img=d?.image?(d.image+"/high.webp"):(d?.images?.[0]?.large||d?.images?.[0]?.small||"");
  if(img)return img;
 }
 return "";
}
async function hydrateCatalogImages(){
 const todo=(state.cards||[]).filter(x=>!x.archivedSold&&!x.photoURL&&!x.photo&&!x.referenceImage).slice(0,20);
 if(!todo.length)return;
 let local=[];try{local=await catalogAll()}catch{}
 let changed=false;
 for(const c of todo){
  const want=cardNumHead(c.number),name=norm(c.name);
  let hit=local.find(r=>r.image&&r.universe===(c.universe||"pokemon")&&norm(r.name)===name&&(!want||cardNumHead(r.number)===want));
  let img=hit?.image||"";
  if(!img&&(c.universe||"pokemon")==="pokemon")img=await resolvePokemonCatalogImage(c);
  if(img){c.referenceImage=img;c.referenceImageSource="catalog";changed=true}
 }
 if(changed){save();render();try{window.renderMasterSets?.()}catch{}try{window.CVSimpleHome?.render?.()}catch{}}
}
window.CVCatalogImages={hydrate:hydrateCatalogImages,resolvePokemon:resolvePokemonCatalogImage};
setTimeout(()=>hydrateCatalogImages().catch(()=>{}),1800);function render(){let q=(document.querySelector("#searchCards")?.value||"").toLowerCase(),ft=document.querySelector("#filterType")?.value||"",fu=document.querySelector("#collectionUniverse")?.value||"",visible=activeCards().filter(x=>(!fu||cardUniverse(x)===fu)&&(!ft||(x.grading||"PSA")===ft)&&(!q||[x.name,x.set,x.number,x.cert,x.notes,universeLabel(cardUniverse(x))].join(" ").toLowerCase().includes(q)));document.querySelector("#cards").innerHTML=visible.map(x=>{const hasListingRecord=(state.saleListings||[]).some(r=>r.cardId===x.id),listing=activeListingForCard(x)||(!hasListingRecord&&x.currentListing?.status==="active"?x.currentListing:null);const raw=String(x.grading||"RAW").toUpperCase()==="RAW",conditionKnown=raw?!!String(x.condition||x.grade||"").trim():!!String(x.grade||"").trim();const condAsk=(x.valuationStatus==="condition-reference"&&x.conditionMarket?.matched===true&&(+x.conditionMarket?.askEUR||0)>0)?Math.min(+x.value||0,+x.conditionMarket.askEUR):null;const priceValidated=x.valuationStatus!=="reference"&&(!raw||conditionKnown||condAsk!=null);const displayUnit=priceValidated?(condAsk!=null?condAsk:(+x.value||0)):null;let p=x.purchase!=null&&displayUnit!=null?((displayUnit-x.purchase)*qty(x)):null;return `<article class="card" onclick="editCard(\`${x.id}\`)"><div class="thumb">${x.photoURL?`<img src="${x.photoURL}">`:x.photo?`<img src="${x.photo}">`:x.referenceImage?`<div class="catalogThumb"><img src="${x.referenceImage}" alt="${x.name}"><small>${x.referenceImageSource==="user"?"foto":"imagen referencia"}</small></div>`:catalogImageFor(x)?`<div class="catalogThumb"><img src="${catalogImageFor(x)}" alt="${x.name}"><small>imagen catálogo</small></div>`:`<div class="photoMissing">FOTO<br>PENDIENTE<small>Pulsa para añadirla</small></div>`}</div><div><div class="universeBadge ${cardUniverse(x)}">${universeIcon(cardUniverse(x))} ${universeLabel(cardUniverse(x))}</div><h3>${x.draft?"⚠️ ":""}${x.name}</h3><div class="meta">${x.number?x.number+" · ":""}${x.set||""}<br>${x.cert?"Cert. "+x.cert:""}${qty(x)>1?" · Cant. "+qty(x):""}</div><span class="grade">${x.grading||"PSA"} ${x.grade||""}</span>${x.valuationStatus==="reference"?`<div class="recognition warn">⚠️ ${x.conditionVerified?"Condición confirmada "+(x.condition||x.grade||"")+" · falta precio comparable de ESA condición":"Valor de referencia · condición pendiente"}</div>`:x.valuationStatus==="condition-reference"?`<div class="recognition">✓ Referencia de condición: ${x.conditionMarket?.condition||""} · ${x.conditionMarket?.askEUR?euro(x.conditionMarket.askEUR):"sin precio"}</div>`:""}${x.recognition?.score?`<div class="recognition">Reconocimiento ${x.recognition.score}% · ${x.recognition.source==="collector-number"?"número exacto":x.recognition.source==="collector-number+visual"?"número + imagen":x.recognition.source==="collector-number+name-tokens"?"número + texto":"asistido"}</div>`:""}${x.popGrade!=null&&x.popSource?`<div class="scarcity">Pop ${x.grade||""}: ${x.popGrade} · ${x.popSource}${x.popHigher!=null?" · superiores "+x.popHigher:""}</div>`:""}${(()=>{const ready=!!(x.catalogId&&!x.draft&&(+x.value>0));const label=ready?"✓ Lista para decisión":x.draft?"Identidad pendiente":(+x.value>0?"Identificada · revisar evidencia":"Precio/evidencia pendiente");return `<div class="recognition valuationStatus">${label}${x.purpose?` · ${({"collection":"colección","investment":"inversión","psa":"PSA","sell":"vender","reinvest":"reinvertir","hold":"no vender"}[x.purpose]||x.purpose)}`:""}</div>`})()}</div><div class="price">${listing&&listing.status==="active"?`<div class="activeListing"><span>TU ANUNCIO CARDMARKET</span><b>${euro(listing.price||listing.priceEUR)}</b><small>${listing.condition||x.condition||x.grade||""} · ACTIVO</small></div>`:""}${!priceValidated?`<span class="unvaluedPrice">SIN VALORACIÓN DEL EJEMPLAR VALIDADA</span><div class="marketRef">Tu coste: ${x.purchase!=null?euro(x.purchase):"desconocido"} · condición ${conditionKnown?(x.condition||x.grade):"pendiente"}</div><div class="marketRef">Referencia general: ${euro(x.value)} · NO es el valor de tu ejemplar</div>${x.previousSaleRecommendation?.status==="withdrawn"?`<div class="marketRef warningText">Recomendación anterior ${euro(x.previousSaleRecommendation.priceEUR)} · RETIRADA</div>`:x.previousSaleRecommendation?.status==="active-user-listing"?`<div class="marketRef">Ese precio sigue publicado actualmente por ti en Cardmarket.</div>`:""}${x.marketContext?.exactCardFloorEUR?`<div class="marketRef">Mercado exacto desde ${euro(x.marketContext.exactCardFloorEUR)} · ${x.marketContext.floorCondition} · NO comparable con tu ${x.condition||x.grade||""}</div>`:""}`:condAsk!=null?`<span class="conditionPrice">${euro(condAsk)}</span><div class="marketRef">Referencia por condición ${x.conditionMarket?.condition||""} · tendencia general ${euro(x.value)}</div>`:`${euro(x.value)}`}${(()=>{let s=(state.marketScan||[]).find(m=>m.id===x.catalogId);return s?`<div class="signal mini">${s.score}</div>`:""})()}${x.marketPricing?`<div class="marketRef">${x.valuationStatus==="reference"?"NO usar como precio de venta · ":"RAW · "}${x.marketPricing.source}</div>`:""}${x.gradedValuation?`<div class="marketRef">${x.grading} ${x.grade||""} · ${x.gradedValuation.count} ventas · ${x.gradedValuation.confidence}${x.gradedValuation.liquidity!=null?" · Liq "+x.gradedValuation.liquidity:""}</div>`:""}${(()=>{try{let f=forecast(x);return f?`<div class="future">12m ≈ ${euro(f.base)}</div>`:""}catch{return ""}})()}${p==null?"":`<div class="profit ${p>=0?"up":"down"}">${p>=0?"+":""}${euro(p)}</div>`}${listing&&listing.status==="active"?`<div class="saleListingNote">Anuncio activo · la valoración puede seguir pendiente.</div><button class="primaryAction" type="button" data-cv-sell="${x.id}">Marcar vendida</button>`:!priceValidated?`<div class="saleBlocked">${conditionKnown?"Falta comparable real de la misma condición":"Falta confirmar condición"}</div><button class="primaryAction" type="button" data-cv-complete="${x.id}">${conditionKnown?"REVISAR VALOR DE SU CONDICIÓN":"CONFIRMAR ESTADO"}</button>`:`<button class="primaryAction" type="button" data-cv-sell="${x.id}">Marcar vendida</button>`}</div></article>`}).join("");const pp=primePortfolio();document.querySelector("#total").textContent=euro(pp?pp.confirmed+pp.provisional:confirmedTotal());{const tl=document.querySelector("#totalLabel");if(tl)tl.textContent=pp?"Valor prudente · confirmado + provisional":"Valor confirmado"}document.querySelector("#count").textContent=pp?activeCards().reduce((n,x)=>n+qty(x),0)+" cartas · confirmado "+euro(pp.confirmed)+" · provisional "+euro(pp.provisional)+" · antiguo "+euro(pp.stale)+" · sin evidencia "+euro(pp.unsupported):activeCards().reduce((n,x)=>n+qty(x),0)+" cartas · + "+euro(provisionalTotal())+" en referencias pendientes";
let cs=document.querySelector("#collectionStats");if(cs){let pp2=primePortfolio();if(pp2){const notValued=pp2.rows.filter(r=>["STALE","UNSUPPORTED"].includes(r.b.bucket)).length;cs.innerHTML=
'<div><span>Valor confirmado</span><b>'+euro(pp2.confirmed)+'</b></div>'+
'<div><span>Valor provisional</span><b>'+euro(pp2.provisional)+'</b></div>'+
'<div><span>Sin valorar bien</span><b>'+notValued+' carta(s)</b></div>';}else{cs.innerHTML=
'<div><span>Valor confirmado</span><b>'+euro(confirmedTotal())+'</b></div>'+
'<div><span>Por revisar</span><b>'+drafts()+' carta(s)</b></div>';}} let prev=state.history.at(-1)?.total;document.querySelector("#change").textContent=prev==null?"Pulsa «Guardar valoración» para crear histórico":(total()-prev>=0?"+":"")+euro(total()-prev)+" desde la última valoración";document.querySelector("#watchList").innerHTML=state.watch.length?state.watch.map((x,i)=>{let m=(state.marketScan||[]).find(s=>s.id===x.catalogId||norm(s.name)===norm(x.name));return `<div class="card"><div class="thumb">👁️</div><div><h3>${x.name}</h3><div class="meta">Objetivo ≤ ${euro(x.target)}${m?" · mercado "+euro(m.price):""}${m&&m.price<=x.target?" · ✅ en objetivo":""}</div>${m?`<div class="recognition">Convicción ${convictionSignal(m)}/100 · Liquidez ${liquiditySignal(m)}/100</div>`:""}</div><button onclick="removeWatch(${i})">×</button></div>`}).join(""):'<div class="empty">No sigues ninguna carta todavía.</div>';renderWatchSummary();renderHistory()}
function renderHistory(){const h=[...state.history].reverse();document.querySelector("#history").innerHTML=h.slice(0,10).map(x=>`<div class="historyRow"><span>${new Date(x.at).toLocaleString("es-ES")}</span><b>${euro(x.total)}</b></div>`).join("");drawChart()}
function drawChart(){const c=document.querySelector("#chart"),dpr=devicePixelRatio||1,r=c.getBoundingClientRect();c.width=r.width*dpr;c.height=r.height*dpr;const g=c.getContext("2d");g.scale(dpr,dpr);g.clearRect(0,0,r.width,r.height);let a=state.history.slice(-30);if(a.length<2){g.fillStyle="#8992ad";g.font="13px -apple-system";g.fillText("Guarda 2 valoraciones para ver la evolución",12,30);return}let vals=a.map(x=>x.total),mn=Math.min(...vals),mx=Math.max(...vals);if(mx===mn){mx++;mn--}g.strokeStyle="#eef2ff";g.lineWidth=2;g.beginPath();a.forEach((x,i)=>{let px=10+i*(r.width-20)/(a.length-1),py=10+(mx-x.total)*(r.height-20)/(mx-mn);i?g.lineTo(px,py):g.moveTo(px,py)});g.stroke()}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".tab").forEach(x=>x.classList.add("hidden"));document.querySelector("#"+b.dataset.tab).classList.remove("hidden");if(b.dataset.tab==="data")drawChart()});document.querySelector("#runPregrade").onclick=runPSAPregrade;renderPregradeHistory();document.querySelector("#calculateGradingEconomics").onclick=calculateGradingEconomics;bindPSACollectionPicker();hydrateGradingEconomics();
document.querySelector("#snapshot").onclick=()=>{state.history.push({at:new Date().toISOString(),total:total(),cards:Object.fromEntries(state.cards.map(x=>[x.id,x.value]))});save();render()};
function radarScore(group){let sold=group.filter(x=>x.kind==="sold"),list=group.filter(x=>x.kind==="listing");if(!sold.length)return 0;let prices=sold.map(x=>x.price).sort((a,b)=>a-b),med=prices[Math.floor(prices.length/2)],latest=sold.at(-1)?.price||med,score=Math.min(55,sold.length*11);if(latest<med)score+=15;if(list.length&&Math.min(...list.map(x=>x.price))<med*.9)score+=20;return Math.min(100,score)}

function holdingMarketMatch(c,signals){
  return (signals||[]).find(x=>x.id===c.catalogId||x.sourceId===c.catalogId||(norm(x.name)===norm(c.name)&&(!c.set||!x.set||norm(x.set)===norm(c.set))))||null;
}
function portfolioRotationAnalysis(signals=[]){
  const goal=+(state.investmentProfile?.minUpsideEUR||50),minBuy=+(state.investmentProfile?.minPriceEUR||40);
  const rows=activeCards().filter(c=>(+c.value||0)>0).map(c=>{
    const market=holdingMarketMatch(c,signals),value=(+c.value||0)*qty(c),cost=(+c.purchase||0)*qty(c),pnl=cost?value-cost:null,ret=cost?value/cost-1:null;
    const momentum=market?.momentum7??null,liq=market?liquiditySignal(market):null,conv=market?convictionSignal(market):null,purpose=c.purpose||"collection";
    const reasons=[];let action="CONSERVAR",score=50;
    if(purpose==="hold"){action="NO VENDER";score=100;reasons.push("bloqueada por decisión de colección")}
    else if(purpose==="psa"){action="REVISAR PSA";score=70;reasons.push("marcada para valorar graduación")}
    else{
      if(value<Math.max(10,minBuy*.25)){score-=8;reasons.push("valor demasiado pequeño para vender individualmente")}
      else if(value<minBuy){score-=12;reasons.push("valor por debajo del rango principal de reinversión")}
      if(momentum!=null&&momentum<-.08){score-=22;reasons.push("momentum negativo")}
      if(momentum!=null&&momentum>.08){score+=12;reasons.push("momentum positivo")}
      if(liq!=null&&liq<55){score-=12;reasons.push("liquidez baja")}
      if(conv!=null&&conv>=78){score+=15;reasons.push("convicción de mercado alta")}
      if(ret!=null&&ret>=.45&&momentum!=null&&momentum<=0){score-=18;reasons.push("ganancia acumulada con impulso débil")}
      if((c.grading||"RAW")==="PSA"&&String(c.grade)==="9"&&value<minBuy*1.25){score-=10;reasons.push("PSA 9 de bajo valor absoluto")}
      if(purpose==="reinvest"){score-=20;reasons.push("marcada para reinversión")}
      if(purpose==="sell"){score-=14;reasons.push("marcada para valorar venta")}
      if(purpose==="investment"){score+=8;reasons.push("marcada como inversión")}
      if(purpose==="collection"){score+=5;reasons.push("colección personal")}
      if(value<10){
        action="CONSERVAR / LOTE";
        reasons.push("evita comisiones y trabajo por una venta pequeña");
      }else if(score<=28)action="VENDER / REINVERTIR";
      else if(score<=42)action="REVISAR VENTA";
      else if(!market)action="ACTUALIZAR DATOS";
    }
    return {c,market,value,cost,pnl,ret,momentum,liq,conv,score,action,reasons,purpose};
  });
  const sell=rows.filter(r=>r.action==="VENDER / REINVERTIR").sort((a,b)=>a.score-b.score);
  const review=rows.filter(r=>r.action==="REVISAR VENTA").sort((a,b)=>a.score-b.score);
  const psa=rows.filter(r=>r.action==="REVISAR PSA").sort((a,b)=>b.value-a.value);
  const keep=rows.filter(r=>["CONSERVAR","NO VENDER","CONSERVAR / LOTE","ACTUALIZAR DATOS"].includes(r.action)).sort((a,b)=>b.value-a.value);
  const capital=sell.reduce((s,r)=>s+r.value,0);
  const buys=(signals||[]).map(topBuyRank).filter(o=>o.eligible).sort((a,b)=>b.rank-a.rank);
  const affordable=buys.filter(o=>(+o.x.price||0)<=capital+goal).slice(0,5);
  return {rows,sell,review,psa,keep,capital,affordable};
}
function renderRotationPanel(){
  const box=document.querySelector("#rotationPanel");if(!box)return;
  const all=state.marketScan||[],r=portfolioRotationAnalysis(all),fmt=x=>euro(x);
  const rowHtml=o=>'<article class="rotationRow"><div><b>'+o.c.name+'</b><small>'+[(o.c.grading||"RAW")+(o.c.grade?(" "+o.c.grade):""),o.c.set].filter(Boolean).join(" · ")+'</small></div><strong>'+fmt(o.value)+'</strong><span class="rotationAction '+o.action.toLowerCase().replace(/[^a-z]+/g,"-")+'">'+o.action+'</span><small>'+((o.reasons||[]).slice(0,3).join(" · ")||"sin señal suficiente")+'</small></article>';
  box.innerHTML='<div class="rotationHero"><h3>Reinvertir mi colección</h3><p>Objetivo: hacer crecer una colección todavía pequeña. No vendo por vender: libero capital solo cuando una carta aporta poco al objetivo o hay una alternativa claramente mejor.</p><div class="rotationStats"><div><span>Valor confirmado</span><b>'+euro(confirmedTotal())+'</b></div><div><span>Referencias pendientes</span><b>'+euro(provisionalTotal())+'</b></div><div><span>Capital liberable</span><b>'+euro(r.capital)+'</b></div><div><span>Cartas a revisar</span><b>'+(r.sell.length+r.review.length)+'</b></div></div></div>'+
    '<div class="rotationGroup"><h4>Considerar vender / reinvertir</h4>'+(r.sell.length?r.sell.map(rowHtml).join(""):'<div class="empty">Ninguna venta clara con los datos actuales.</div>')+'</div>'+
    '<div class="rotationGroup"><h4>Revisar antes de vender</h4>'+(r.review.length?r.review.map(rowHtml).join(""):'<div class="empty">Sin cartas en zona gris.</div>')+'</div>'+
    '<div class="rotationGroup"><h4>Revisar para PSA</h4>'+(r.psa.length?r.psa.map(rowHtml).join(""):'<div class="empty">Ninguna carta marcada para PSA todavía.</div>')+'</div>'+
    '<div class="rotationGroup"><h4>Conservar / no vender</h4>'+(r.keep.length?r.keep.slice(0,12).map(rowHtml).join(""):'<div class="empty">Faltan datos de mercado.</div>')+'</div>'+
    '<div class="rotationGroup"><h4>Qué podrías comprar con lo liberado</h4>'+(r.affordable.length?r.affordable.map((o,i)=>'<div class="rotationTarget"><b>#'+(i+1)+' '+universeIcon(marketUniverseOf(o.x))+' '+o.x.name+'</b><span>'+money(o.x.price,o.x.currency||"EUR")+' · potencial +'+money(o.gate.upside,o.x.currency||"EUR")+'</span><a href="'+cardmarketProductLink(o.x)+'" target="_blank" rel="noopener">Cardmarket</a></div>').join(""):'<div class="empty">El capital liberable aún no alcanza una candidata que pase todos los filtros.</div>')+'</div>'+
    '<small class="rotationFoot">La etiqueta “vender/reinvertir” es un filtro de cartera, no una obligación. Confirma precio real de salida, comisiones y demanda antes de listar.</small>';
}
function setupMarketWorkspace(){
  const section=document.querySelector("#radar"),host=document.querySelector("#marketPaneHost"),sub=document.querySelector("#marketSubnav");
  if(!section||!host||host.dataset.ready)return;
  const today=document.createElement("div"),rotation=document.createElement("div"),radar=document.createElement("div"),catalog=document.createElement("div");
  today.id="marketPaneToday";rotation.id="marketPaneRotation";radar.id="marketPaneRadar";catalog.id="marketPaneCatalog";
  today.className="marketPane";rotation.className="marketPane hidden";radar.className="marketPane hidden";catalog.className="marketPane hidden";
  host.append(today,rotation,radar,catalog);
  const move=(id,target)=>{const el=document.querySelector(id);if(el)target.appendChild(el)};
  // First screen: only the decision output.
  move("#topBuyCandidates",today);move("#opportunityAlerts",today);move("#decisionBoard",today);
  // Rotation and catalog get their own clean screens.
  move("#rotationPanel",rotation);move(".catalogHub",catalog);
  // Everything else belongs to the technical radar screen.
  const keep=[".labControls",".scanModes","#coveragePanel",".researchDesk","#marketIndex","#marketHealth","#provenancePanel","#sectorGrid","#portfolioRisk","#marketLeaders","#compareTray","#signalPerformance","#scanHistory"];
  keep.forEach(sel=>move(sel,radar));
  // Move the lower opportunities block and its controls into Radar.
  const heads=[...section.querySelectorAll(".sectionHead")];
  const oppHead=heads.find(h=>/Oportunidades de mercado/i.test(h.textContent||""));
  if(oppHead){
    radar.appendChild(oppHead);
    let n=oppHead.nextElementSibling;
    while(n&&n!==host&&n.tagName!=="SECTION"){
      const next=n.nextElementSibling;
      if(n.id==="pregrade"||n.id==="watch"||n.id==="data")break;
      if(["radarSummary","radarList"].includes(n.id)||n.classList?.contains("filters")||n.classList?.contains("muted"))radar.appendChild(n);
      n=next;
    }
  }
  host.dataset.ready="1";
  const show=name=>{
    [today,rotation,radar,catalog].forEach(p=>p.classList.add("hidden"));
    ({today,rotation,radar,catalog}[name]||today).classList.remove("hidden");
    sub.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.marketpane===name));
    if(name==="today"){renderTopBuyCandidates(state.marketScan||[]);renderOpportunityAlerts(state.marketScan||[]);renderDecisionBoard(state.marketScan||[]);refreshGlobalToday().catch(()=>{})}
    if(name==="rotation"){renderRotationPanel()}
    if(name==="catalog")refreshCatalogBrowser(false).catch(()=>{});
  };
  sub.querySelectorAll("button").forEach(b=>b.onclick=()=>show(b.dataset.marketpane));
  show("today");renderInvestmentProfile();
}
function renderRadar(){setupMarketWorkspace();
  const u=currentRadarUniverse(),auto=[...(state.marketScan||[])].filter(x=>{const g=investmentGate(x);return marketUniverseOf(x)===u&&(+x.price||0)>0&&(+x.price||0)<=radarLimit&&(+x.price||0)>=Math.min(g.profile.min,radarLimit)}).sort((a,b)=>{const A=topBuyRank(a),B=topBuyRank(b);return (B.eligible-A.eligible)||(B.rank-A.rank)||((+b.score||0)-(+a.score||0))});
  const manual=state.market.filter(x=>marketUniverseOf(x)===u),sales=manual.filter(x=>x.kind==="sold"),listings=manual.filter(x=>x.kind==="listing");
  const rs=document.querySelector("#radarSummary");
  if(rs)rs.innerHTML='<div><span>Señales automáticas</span><b>'+auto.length+'</b></div><div><span>Señales ≥60</span><b>'+auto.filter(x=>(+x.score||0)>=60).length+'</b></div><div><span>Ventas verificadas</span><b>'+sales.length+'</b></div><div><span>Anuncios manuales</span><b>'+listings.length+'</b></div>';
  const box=document.querySelector("#radarList");if(!box)return;
  if(!auto.length){
    box.innerHTML='<div class="empty">No hay señales automáticas visibles para este filtro. El radar superior puede contener datos guardados de otro universo o pendientes de cargar; pulsa «Escanear mercado» o cambia el filtro de precio.</div>';
    return;
  }
  box.innerHTML=auto.slice(0,80).map(x=>'<article class="opportunity"><div class="oppThumb">'+(x.image?'<img src="'+x.image+'" alt="" onerror="this.style.display=\'none\';this.nextElementSibling&&(this.nextElementSibling.style.display=\'flex\')"><div class="catalogNoImg fallbackImg" style="display:none">🃏</div>':'🃏')+'</div><div class="oppMain"><b>'+x.name+'</b><div class="meta">'+[x.set,x.rarity].filter(Boolean).join(" · ")+'</div><div class="oppSignals"><span>'+signalLabel(x)+'</span><span>Riesgo '+(x.risk||"—")+'</span><span>Liquidez '+liquiditySignal(x)+'/100</span></div></div><div class="oppRight"><strong>'+money(x.price,x.currency||"EUR")+'</strong><b class="signal '+((+x.score||0)>=75?"hot":(+x.score||0)>=60?"warm":"")+'">'+Math.round(+x.score||0)+'/100</b><button class="watchFromMarket" data-watchid="'+x.id+'">Seguir</button></div></article>').join("");
}
document.querySelector("#refreshValues").onclick=refreshPortfolioValues;document.querySelector("#scanMarket").onclick=()=>runMarketScan("quick");document.querySelector("#deepScanMarket").onclick=()=>runMarketScan("wide");document.querySelector("#radarUniverse").onchange=async()=>{const u=currentRadarUniverse(),q=await activeMarketSignals(45,u);state.marketScan=q.active.sort((a,b)=>b.score-a.score).slice(0,400);state.marketScanUniverse=u;renderCoverage();renderMarketScan();renderRadar();renderQA();};document.querySelector("#continueCoverage").onclick=()=>continueCoverage(5);document.querySelector("#retryMarketFailures").onclick=retryMarketFailures;document.querySelector("#indexFullCatalog").onclick=indexFullCatalog;document.querySelector("#enrichCatalogPage").onclick=enrichCatalogPage;document.querySelector("#catalogSearch").oninput=()=>refreshCatalogBrowser(true);document.querySelector("#catalogUniverse").onchange=()=>refreshCatalogBrowser(true);document.querySelector("#catalogPrev").onclick=()=>{catalogPage=Math.max(0,catalogPage-1);refreshCatalogBrowser()};document.querySelector("#catalogNext").onclick=()=>{catalogPage++;refreshCatalogBrowser()};setTimeout(()=>refreshCatalogBrowser(true),0);renderMarketScan();renderScanHistory();
document.addEventListener("click",e=>{let b=e.target.closest(".watchFromMarket");if(!b)return;e.stopPropagation();let x=(state.marketScan||[]).find(m=>m.id===b.dataset.watchid);if(!x)return;if(!state.watch.some(w=>w.catalogId===x.id))state.watch.push({name:x.name,target:Math.round((x.low||x.price*.9)*100)/100,catalogId:x.id,source:"Market Lab"});save();render();b.textContent="En seguimiento";});
document.addEventListener("click",e=>{let b=e.target.closest(".compareMarket");if(!b)return;e.stopPropagation();toggleCompare(b.dataset.compareid)});
document.querySelectorAll("[data-limit]").forEach(b=>b.onclick=()=>{radarLimit=+b.dataset.limit;document.querySelectorAll("[data-limit]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");renderRadar()});
const marketDialog=document.querySelector("#marketDialog"),marketForm=document.querySelector("#marketForm");document.querySelector("#addMarket").onclick=()=>{marketForm.elements.universe.value=currentRadarUniverse();marketDialog.showModal()};document.querySelector("#saveMarket").onclick=e=>{e.preventDefault();if(!marketForm.reportValidity())return;let f=new FormData(marketForm);state.market.push({id:crypto.randomUUID(),universe:f.get("universe")||currentRadarUniverse(),name:f.get("name").trim(),set:f.get("set"),grading:f.get("grading"),grade:f.get("grade"),price:+f.get("price"),kind:f.get("kind"),source:f.get("source"),url:f.get("url"),soldDate:f.get("soldDate")||"",currency:(f.get("currency")||"EUR").toUpperCase(),at:new Date().toISOString()});save();renderRadar();renderMarketEvidence();marketForm.reset();marketDialog.close()};
document.querySelector("#addWatch").onclick=()=>{let name=prompt("Nombre de la carta que quieres seguir");if(!name)return;let target=prompt("Precio objetivo en euros","30");state.watch.push({name,target:+target||0});save();render()};window.removeWatch=i=>{state.watch.splice(i,1);save();render()};

function cleanOCR(s){return (s||"").replace(/[|]/g,"I").replace(/\s+/g," ").trim()}
function guessFromOCR(text){
  const raw=text||"", lines=raw.split(/\n+/).map(cleanOCR).filter(Boolean);
  const number=(raw.match(/\b\d{1,3}\s*\/\s*\d{2,3}\b/)||[])[0]?.replace(/\s/g,"")||"";
  const cert=(raw.match(/\b\d{8,10}\b/)||[])[0]||"";
  const issuer=/\bPSA\b/i.test(raw)?"PSA":/\bBGS|BECKETT\b/i.test(raw)?"BGS":/\bCGC\b/i.test(raw)?"CGC":"";
  const gradeMatch=raw.match(/(?:GEM\s*MT|MINT|NM[- ]?MT|PSA|BGS|CGC|BECKETT)\s*(10(?:\.0)?|9\.5|9|8\.5|8|7\.5|7|6\.5|6|5\.5|5|4\.5|4|3\.5|3|2\.5|2|1\.5|1)\b/i);
  const grading=issuer||"RAW";
  const grade=gradeMatch?gradeMatch[1]:"";
  const year=(raw.match(/\b(19\d{2}|20\d{2})\b/)||[])[0]||"";
  const language=/\bESPAÑOL|SPANISH\b/i.test(raw)?"Español":/\bJAPANESE|JAPON[EÉ]S\b/i.test(raw)?"Japonés":/\bENGLISH\b/i.test(raw)?"Inglés":"";
  const stop=/POK[EÉ]MON|TRAINER|ENERGY|BASIC|STAGE|PSA|GEM|MINT|HP|SVP|ILLUSTRATION|RARE|HOLO|CARD/i;
  lines.find(x=>x.length>=3&&x.length<=28&&!stop.test(x)&&!/^\d/.test(x)&&/^[A-Za-zÀ-ÿ0-9 .\-]+$/.test(x)&&(/[A-Za-zÀ-ÿ]{3,}/.test(x)))||"";
  return {number,cert,grade,grading,gradingEvidence:issuer?"ocr-label":"none",issuerDetected:issuer,year,language,name:""};
}
async function tcgdexList(lang){
  if(catalogCache[lang])return catalogCache[lang];
  try{
    let r=await fetch("https://api.tcgdex.net/v2/"+lang+"/cards");if(!r.ok)return[];
    let data=await r.json();catalogCache[lang]=data;return data;
  }catch{return[]}
}
async function tcgdexCard(lang,id){
  try{let r=await fetch("https://api.tcgdex.net/v2/"+lang+"/cards/"+encodeURIComponent(id));if(!r.ok)return null;return await r.json()}catch{return null}
}
function normNum(v){return String(v||"").replace(/\s/g,"").replace(/^0+(?=\d)/,"").toLowerCase()}

const MARKET_NAMES=["Pikachu","Charizard","Umbreon","Eevee","Rayquaza","Gengar","Mew","Lugia","Giratina","Sylveon","Greninja","Mewtwo"];
function num(v){v=Number(v);return Number.isFinite(v)?v:null}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function tcgplayerMarket(c){
  const t=c?.pricing?.tcgplayer;if(!t)return null;
  const vals=[];
  for(const [variant,o] of Object.entries(t)){if(o&&typeof o==="object"){let m=num(o.marketPrice);if(m)vals.push({variant,price:m})}}
  if(!vals.length)return null;
  vals.sort((a,b)=>a.price-b.price);return vals[Math.floor(vals.length/2)];
}
function buildMarketSignal(c){
  const cm=c?.pricing?.cardmarket||{},trend=num(cm.trend)||num(cm.avg30)||num(cm.avg7)||num(cm.avg),a1=num(cm.avg1),a7=num(cm.avg7),a30=num(cm.avg30),low=num(cm.low);
  if(!trend)return null;
  const m1=a1&&a30?(a1/a30-1):0,m7=a7&&a30?(a7/a30-1):0,discount=low?clamp((trend-low)/trend,0,0.6):0;
  const vals=[a1,a7,a30,trend].filter(Boolean),mean=vals.reduce((s,n)=>s+n,0)/vals.length;
  const vol=vals.length>1?Math.sqrt(vals.reduce((s,n)=>s+Math.pow((n-mean)/mean,2),0)/vals.length):0.18;
  const global=!!tcgplayerMarket(c),dataCount=[a1,a7,a30,low,trend].filter(Boolean).length;
  const analysts={momentum:Math.round(clamp(50+(m1*.35+m7*.65)*100,0,100)),value:Math.round(clamp(discount*170,0,100)),stability:Math.round(clamp(100-vol*360,0,100)),global:global?80:45,data:Math.round(clamp(dataCount/5*100,0,100))};
  const w=state.analystWeights||{},baseW={momentum:.30,value:.22,stability:.18,global:.12,data:.18};let denom=0,weighted=0;for(const k of Object.keys(baseW)){let wk=Number(w[k]??baseW[k]);denom+=wk;weighted+=(analysts[k]||0)*wk}const score=Math.round(weighted/Math.max(denom,.001));
  const risk=vol<0.08?"Bajo":vol<0.18?"Medio":"Alto";
  const scenario12=trend*(1+clamp(m7*3,-0.25,0.35));
  const owned=state.cards.find(x=>x.catalogId===c.id),sc=owned?scarcitySignal(owned):null;let finalScore=score;if(sc){analysts.scarcity=sc.score;let sw=Number(state.analystWeights?.scarcity??.12);finalScore=Math.round((score+sc.score*sw)/(1+sw))}return {id:c.id,sourceId:c.id,universe:"pokemon",name:c.name,set:c.set?.name||"",number:c.localId||c.printed_number||c.number||"",image:c.image?c.image+"/low.webp":"",price:trend,low,avg1:a1,avg7:a7,avg30:a30,momentum1:m1,momentum7:m7,discount,volatility:vol,global,tcgplayer:tcgplayerMarket(c),score:finalScore,risk,scenario12,rarity:c.rarity||"",updated:cm.updated||null,scannedAt:new Date().toISOString(),analysts,scarcity:sc};
}
async function mapLimit(items,limit,fn){
  let out=new Array(items.length),i=0;async function worker(){while(true){let n=i++;if(n>=items.length)return;try{out[n]=await fn(items[n],n)}catch{out[n]=null}}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));return out;
}
async function activeMarketSignals(maxAgeDays=45,universe=currentRadarUniverse()){
  const all=(await marketSignalAll().catch(()=>[])).filter(x=>marketUniverseOf(x)===universe);
  const now=Date.now(),active=[],stale=[];
  for(const x of all){
    const t=new Date(x.scannedAt||x.updated||0).getTime();
    if(t&&now-t<=maxAgeDays*86400000)active.push(x);else stale.push(x);
  }
  return {all,active,stale};
}
async function refreshMarketFreshness(universe=currentRadarUniverse()){
  const q=await activeMarketSignals(45,universe);
  state.coverageByUniverse=state.coverageByUniverse||{};
  const prev=state.coverageByUniverse[universe]||{};
  state.coverageByUniverse[universe]={...prev,priced:q.all.length,active:q.active.length,stale:q.stale.length,at:prev.at||new Date().toISOString()};
  if(universe==="pokemon"){
    state.marketCoverage={...(state.marketCoverage||{}),priced:q.all.length,active:q.active.length,stale:q.stale.length};
  }
  save();return q;
}
function pokemonCatalogRow(c){return {id:"pokemon:"+c.id,sourceId:c.id,universe:"pokemon",name:c.name||"",set:c.set?.name||c.expansion?.name||"",number:c.localId||c.printed_number||c.number||"",image:c.image?c.image+"/low.webp":(c.images?.[0]?.small||""),rarity:c.rarity||"",source:"TCGdex"}}
function lorcanaCatalogRow(c){return {id:"lorcana:"+c.id,sourceId:c.id,universe:"lorcana",name:(c.name||"")+(c.version?" · "+c.version:""),set:c.set?.name||"",number:c.collector_number||"",image:c.image_uris?.digital?.small||c.image_uris?.digital?.normal||"",rarity:c.rarity||"",price:Number(c?.prices?.usd)||Number(c?.prices?.usd_foil)||null,foilPrice:Number(c?.prices?.usd_foil)||null,currency:"USD",source:"Lorcast"}}
let catalogPage=0,catalogPageSize=60,catalogVisibleRows=[],catalogHydrating=false;
async function resolveCatalogCard(row){
  if(!row)return null;
  if(row.universe==="pokemon"){
    const full=await tcgdexCard("en",row.sourceId);if(!full)return row;
    const signal=buildMarketSignal(full),merged={...row,...pokemonCatalogRow(full),price:signal?.price||null,currency:"EUR",marketScore:signal?.score??null,updated:new Date().toISOString()};
    await catalogPutMany([merged]);if(signal)await marketSignalPutMany([signal]);return merged;
  }
  const signals=(await marketSignalAll().catch(()=>[])).filter(x=>x.universe==="lorcana"&&x.sourceId===row.sourceId),signal=signals.sort((a,b)=>(+b.price||0)-(+a.price||0))[0];
  return {...row,price:row.price??signal?.price??null,currency:"USD",marketScore:signal?.score??row.marketScore??null};
}
function renderCatalogDetail(row){
  const box=document.querySelector("#catalogDetail");if(!box)return;if(!row){box.classList.add("hidden");box.innerHTML="";return}
  box.classList.remove("hidden");
  box.innerHTML='<div class="detailTop">'+(row.image?'<img src="'+row.image+'" alt="">':'<div class="catalogNoImg">🃏<small>Sin imagen de fuente</small></div>')+
    '<div><div class="universeBadge '+row.universe+'">'+universeIcon(row.universe)+' '+universeLabel(row.universe)+'</div><h3>'+row.name+'</h3><p>'+[row.set,row.number?("#"+row.number):"",row.rarity].filter(Boolean).join(" · ")+'</p>'+
    '<div class="detailPrice">'+(row.price?money(row.price,row.currency||"EUR"):'Sin precio utilizable todavía')+'</div>'+
    (row.marketScore!=null?'<div class="signal mini">'+row.marketScore+'/100</div>':'')+'</div></div>'+
    '<div class="detailActions"><button id="catalogLoadDetail">Actualizar ficha/precio</button><button id="catalogAddCollection">+ Mi colección</button><button id="catalogAddWatch">Seguir</button></div>'+
    '<small>La ficha se completa bajo demanda para no lanzar decenas de miles de consultas desde el iPhone.</small>';
  document.querySelector("#catalogLoadDetail").onclick=async()=>{const b=document.querySelector("#catalogLoadDetail");b.disabled=true;b.textContent="Actualizando…";const fresh=await resolveCatalogCard(row);renderCatalogDetail(fresh);await refreshCatalogBrowser();};
  document.querySelector("#catalogAddCollection").onclick=()=>addCatalogRowToCollection(row);
  document.querySelector("#catalogAddWatch").onclick=()=>addCatalogRowToWatch(row);
}
function addCatalogRowToCollection(row){
  if(state.cards.some(c=>c.catalogId===row.sourceId&&cardUniverse(c)===row.universe)){alert("Esta carta ya está en tu colección.");return}
  const c={id:crypto.randomUUID(),universe:row.universe,name:row.name,set:row.set||"",number:row.number||"",year:"",language:row.universe==="pokemon"?"Inglés":"",grading:"RAW",grade:"",cert:"",value:+row.price||0,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",notes:"Añadida desde catálogo",catalogId:row.sourceId,referenceImage:row.image||"",marketPricing:row.price?{value:+row.price,source:row.source||"Catálogo",currency:row.currency||"EUR"}:null,draft:false,icon:"🃏",createdAt:new Date().toISOString()};
  state.cards.push(c);save();render();renderQA();alert("Añadida a Mi colección.");
}
function addCatalogRowToWatch(row){
  if(!state.watch.some(w=>w.catalogId===row.id||w.catalogId===row.sourceId))state.watch.push({name:row.name,target:+row.price||0,catalogId:row.id,source:"Catálogo "+universeLabel(row.universe)});
  save();render();alert("Añadida a Seguimiento.");
}
async function enrichCatalogPage(){
  const btn=document.querySelector("#enrichCatalogPage"),st=document.querySelector("#catalogStatus"),rows=[...catalogVisibleRows];
  if(!rows.length){st.textContent="No hay cartas visibles para analizar.";return}
  btn.disabled=true;let done=0,priced=0;
  st.textContent="Analizando "+rows.length+" cartas visibles…";
  const out=await mapLimit(rows,4,async row=>{const fresh=await resolveCatalogCard(row);done++;if(fresh?.price)priced++;st.textContent="Analizadas "+done+"/"+rows.length+" · con precio "+priced;return fresh});
  await refreshMarketFreshness(document.querySelector("#catalogUniverse")?.value||"pokemon").catch(()=>{});
  await refreshCatalogBrowser();btn.disabled=false;st.textContent="Página analizada: "+done+" fichas · "+priced+" con precio utilizable.";
  return out;
}

async function hydrateVisibleCatalog(rows){
  const st=document.querySelector("#catalogStatus");
  const todo=(rows||[]).filter(x=>x.universe==="pokemon"&&(!x.image||!x.set||!x.number||x.price==null)).slice(0,60);
  if(!todo.length)return;
  let done=0,updated=0;
  if(st)st.textContent="Completando "+todo.length+" fichas visibles…";
  await mapLimit(todo,4,async row=>{
    const fresh=await resolveCatalogCard(row);
    done++;if(fresh&&(fresh.image||fresh.set||fresh.number||fresh.price!=null))updated++;
    if(st)st.textContent="Completando fichas visibles "+done+"/"+todo.length+"…";
    return fresh;
  });
  if(st)st.textContent="Página completada: "+updated+"/"+todo.length+" fichas enriquecidas.";
}
async function refreshCatalogBrowser(reset=false){
  if(reset)catalogPage=0;const u=document.querySelector("#catalogUniverse")?.value||"pokemon",q=norm(document.querySelector("#catalogSearch")?.value||"");
  const all=(await catalogAll().catch(()=>[])).filter(x=>x.universe===u),rows=q?all.filter(x=>norm([x.name,x.set,x.number,x.rarity].join(" ")).includes(q)):all;
  rows.sort((a,b)=>String(a.set).localeCompare(String(b.set))||String(a.number).localeCompare(String(b.number),undefined,{numeric:true})||String(a.name).localeCompare(String(b.name)));
  const pages=Math.max(1,Math.ceil(rows.length/catalogPageSize));catalogPage=Math.min(catalogPage,pages-1);const slice=rows.slice(catalogPage*catalogPageSize,(catalogPage+1)*catalogPageSize);catalogVisibleRows=slice;
  const box=document.querySelector("#catalogResults");if(box){box.innerHTML=slice.length?slice.map((x,i)=>'<article class="catalogCard" data-catalog-index="'+i+'">'+(x.image?'<img src="'+x.image+'" alt="">':'<div class="catalogNoImg">🃏</div>')+'<div><b>'+x.name+'</b><small>'+([x.set,x.number?("#"+x.number):"",x.rarity].filter(Boolean).join(" · ")||"Pulsa para completar ficha")+'</small>'+(x.price?'<strong>'+money(x.price,x.currency||"EUR")+'</strong>':'')+'</div></article>').join(""):'<div class="empty">No hay cartas indexadas para este filtro.</div>';box.querySelectorAll("[data-catalog-index]").forEach(el=>el.onclick=()=>renderCatalogDetail(slice[+el.dataset.catalogIndex]));}
  const info=document.querySelector("#catalogPageInfo");if(info)info.textContent=rows.length?((catalogPage*catalogPageSize+1)+"–"+Math.min((catalogPage+1)*catalogPageSize,rows.length)+" de "+rows.length):"0 cartas";
  const pc=await catalogCount("pokemon").catch(()=>0),lc=await catalogCount("lorcana").catch(()=>0),cc=document.querySelector("#catalogCounts");if(cc)cc.innerHTML='<div><span>Pokémon indexadas</span><b>'+pc.toLocaleString("es-ES")+'</b></div><div><span>Lorcana indexadas</span><b>'+lc.toLocaleString("es-ES")+'</b></div><div><span>Total local</span><b>'+(pc+lc).toLocaleString("es-ES")+'</b></div>';
  if(!catalogHydrating&&catalogVisibleRows.some(x=>x.universe==="pokemon"&&(!x.image||!x.set||!x.number||x.price==null))){catalogHydrating=true;setTimeout(()=>hydrateVisibleCatalog(catalogVisibleRows).then(async()=>{catalogHydrating=false;await refreshCatalogBrowser(false)}).catch(()=>{catalogHydrating=false}),80)}
}
async function indexFullCatalog(){
  const btn=document.querySelector("#indexFullCatalog"),st=document.querySelector("#catalogStatus");btn.disabled=true;
  try{
    st.textContent="Pokémon · cargando índice completo…";const pok=await tcgdexList("en"),prows=(pok||[]).filter(x=>x.id).map(pokemonCatalogRow);
    for(let i=0;i<prows.length;i+=800)await catalogPutMany(prows.slice(i,i+800));state.catalogMeta.pokemon={count:prows.length,at:new Date().toISOString()};
    st.textContent="Lorcana · recorriendo todos los sets…";const sets=await lorcastSets();let lcount=0;
    for(let i=0;i<sets.length;i++){st.textContent="Lorcana · set "+(i+1)+"/"+sets.length+"…";const cards=await lorcastSetCards(sets[i].code),rows=cards.map(lorcanaCatalogRow);lcount+=rows.length;await catalogPutMany(rows);await new Promise(r=>setTimeout(r,70))}
    state.catalogMeta.lorcana={count:lcount,sets:sets.length,at:new Date().toISOString()};save();await refreshCatalogBrowser(true);
    st.textContent="Índice local: "+prows.length.toLocaleString("es-ES")+" Pokémon + "+lcount.toLocaleString("es-ES")+" Lorcana. Precio/señal se enriquece aparte.";
  }catch(e){pushRuntimeError("catalog-index",e?.message||e);st.textContent="Indexado interrumpido. Lo ya guardado se conserva; puedes reintentar."}
  if(btn)btn.disabled=false;
}
window.CVRunMarketScan=runMarketScan;
let lorcastSetsCache=null;
async function lorcastSets(){
  if(lorcastSetsCache)return lorcastSetsCache;
  const r=await fetch("https://api.lorcast.com/v0/sets");if(!r.ok)throw new Error("Lorcast sets");
  const j=await r.json();lorcastSetsCache=j.results||[];return lorcastSetsCache;
}
async function lorcastSetCards(code){
  const r=await fetch("https://api.lorcast.com/v0/sets/"+encodeURIComponent(code)+"/cards");if(!r.ok)throw new Error("Lorcast set");
  const j=await r.json();return Array.isArray(j)?j:(j.results||[]);
}
function lorcanaHistoryStats(id,currentPrice){
  const pts=(state.signalHistory||[]).filter(s=>s.id===id&&(+s.price||0)>0).map(s=>({t:new Date(s.at).getTime(),p:+s.price})).filter(x=>Number.isFinite(x.t)).sort((a,b)=>a.t-b.t);
  const unique=[];for(const x of pts){const day=new Date(x.t).toISOString().slice(0,10);if(!unique.some(y=>y.day===day))unique.push({day,t:x.t,p:x.p})}
  const recent=unique.filter(x=>x.t>=Date.now()-90*86400000),first=recent[0],span=first?(Date.now()-first.t)/86400000:0;
  const high=recent.length?Math.max(currentPrice,...recent.map(x=>x.p)):currentPrice,low=recent.length?Math.min(currentPrice,...recent.map(x=>x.p)):currentPrice;
  const momentum=first&&span>=3?clamp(currentPrice/first.p-1,-.5,.5):0;
  return {points:recent.length,spanDays:span,high90:high,low90:low,momentum};
}
function buildLorcanaSignals(c){
  const variants=[["normal",Number(c?.prices?.usd)],["foil",Number(c?.prices?.usd_foil)]],out=[];
  for(const [finish,price] of variants){
    if(!(price>0))continue;
    const id="lorcana:"+c.id+":"+finish,h=lorcanaHistoryStats(id,price),rarity=String(c.rarity||"").toLowerCase();
    const rarityScore=rarity.includes("enchanted")?92:rarity.includes("legendary")?76:rarity.includes("super")?66:rarity.includes("rare")?58:48;
    const dataScore=Math.round(clamp(([c.name,c.set?.name,c.collector_number,c.image_uris?.digital?.small,c.prices,c.tcgplayer_id].filter(Boolean).length/6)*100,0,100));
    const histScore=h.points>=3&&h.spanDays>=3?Math.min(100,55+h.points*5):35;
    const momentum7=h.momentum,discount=h.high90>price?(h.high90-price)/h.high90:0;
    const score=Math.round(clamp(rarityScore*.34+dataScore*.30+histScore*.16+clamp(50+momentum7*120,0,100)*.12+clamp(discount*180,0,100)*.08,0,100));
    const target=(h.points>=3&&h.spanDays>=3&&h.high90>price)?h.high90:price;
    out.push({id,sourceId:c.id,universe:"lorcana",finish,name:(c.name||"")+(c.version?" · "+c.version:"")+(finish==="foil"?" · Foil":""),set:c.set?.name||"",number:c.collector_number||"",image:c.image_uris?.digital?.small||c.image_uris?.digital?.normal||"",price,currency:"USD",low:h.low90,avg1:null,avg7:null,avg30:null,momentum1:0,momentum7,discount,volatility:.18,global:true,tcgplayer:c.tcgplayer_id||null,score,risk:h.points>=3?"Medio":"Datos limitados",scenario12:target,observedTarget:target,historyPoints:h.points,historySpanDays:Math.round(h.spanDays),rarity:c.rarity||"",releaseDate:c.released_at||null,updated:new Date().toISOString(),scannedAt:new Date().toISOString(),source:"Lorcast",catalogOnly:false,analysts:{momentum:Math.round(clamp(50+momentum7*120,0,100)),value:Math.round(clamp(50+discount*140,0,100)),stability:h.points>=3?62:40,global:70,data:dataScore}});
  }
  return out;
}
function buildLorcanaSignal(c){return buildLorcanaSignals(c)[0]||null}
async function fetchLorcanaUniverse(mode){
  const sets=await lorcastSets(),total=sets.length;
  if(!total)return [];
  const perRun=mode==="wide"?Math.min(4,total):Math.min(3,total),start=state.cursorByUniverse.lorcana%total,chosen=[];
  for(let i=0;i<perRun;i++)chosen.push(sets[(start+i)%total]);
  let signals=[],cardsSeen=0;
  for(const st of chosen){
    const cards=await lorcastSetCards(st.code);cardsSeen+=cards.length;await catalogPutMany(cards.map(lorcanaCatalogRow));
    signals.push(...cards.flatMap(buildLorcanaSignals));
    await new Promise(r=>setTimeout(r,90));
  }
  if(signals.length)await marketSignalPutMany(signals);
  state.cursorByUniverse.lorcana=(start+chosen.length)%total;
  const all=(await marketSignalAll()).filter(x=>marketUniverseOf(x)==="lorcana"),prev=state.coverageByUniverse.lorcana||{};
  const prior=prev.cycleTotal===total?(+prev.cycleProgress||0):0,rawProgress=prior+chosen.length,completed=total>0&&rawProgress>=total,cycleProgress=total?rawProgress%total:0,everComplete=completed||!!prev.lastCompleteAt,seenSets=everComplete?total:Math.min(total,rawProgress),cycleCards=(+prev.cycleCards||0)+cardsSeen,lastCycleCards=completed?cycleCards:(+prev.lastCycleCards||0),seenCards=everComplete?(lastCycleCards||+state.catalogMeta?.lorcana?.count||cycleCards):cycleCards,lastCompleteAt=completed?new Date().toISOString():(prev.lastCompleteAt||null);
  state.coverageByUniverse.lorcana={total,seen:seenSets,seenSets,seenCards,priced:all.length,active:all.filter(x=>ageDays(x.scannedAt)<=45).length,stale:all.filter(x=>ageDays(x.scannedAt)>45).length,failed:0,at:new Date().toISOString(),unit:"sets",cursor:state.cursorByUniverse.lorcana,cycleTotal:total,cycleProgress,cycleCards:completed?0:cycleCards,lastCycleCards,cycleComplete:everComplete,lastCompleteAt};
  save();
  return all.filter(x=>ageDays(x.scannedAt)<=45).sort((a,b)=>b.score-a.score).slice(0,400);
}

async function fetchMarketUniverse(mode="quick",universe=currentRadarUniverse()){
  if(universe==="lorcana")return fetchLorcanaUniverse(mode);
  const list=await tcgdexList("en"),pool=(list||[]).filter(x=>x.id&&x.name);if(pool.length){await catalogPutMany(pool.map(pokemonCatalogRow));state.catalogMeta.pokemon={count:pool.length,at:new Date().toISOString()};save()}
  if(mode==="wide"){
    const batchSize=120,total=pool.length||0,start=total?state.marketCursor%total:0,briefs=[];
    for(let n=0;n<Math.min(batchSize,total);n++)briefs.push(pool[(start+n)%total]);
    const full=await mapLimit(briefs,4,async b=>{
      const c=await tcgdexCard("en",b.id);
      if(!c)state.marketFailures[b.id]=(state.marketFailures[b.id]||0)+1;
      else delete state.marketFailures[b.id];
      return c;
    });
    const fetched=full.filter(Boolean),signals=fetched.map(buildMarketSignal).filter(Boolean),pricedIds=new Set(signals.map(x=>x.id)),lostPrice=fetched.filter(c=>!pricedIds.has(c.id)).map(c=>c.id);
    if(signals.length)await marketSignalPutMany(signals);if(lostPrice.length)await marketSignalDeleteMany(lostPrice);
    state.marketCursor=total?((start+briefs.length)%total):0;
    const prev=state.marketCoverage||{},prior=prev.cycleTotal===total?(+prev.cycleProgress||0):0,rawProgress=prior+briefs.length,completed=total>0&&rawProgress>=total,cycleProgress=total?rawProgress%total:0,everComplete=completed||!!prev.lastCompleteAt,seen=everComplete?total:Math.min(total,rawProgress),cycleComplete=everComplete,lastCompleteAt=completed?new Date().toISOString():(prev.lastCompleteAt||null);
    const fresh=await activeMarketSignals(45),priced=fresh.all.length;
    state.marketCoverage={total,seen,priced,active:fresh.active.length,stale:fresh.stale.length,failed:Object.keys(state.marketFailures).length,at:new Date().toISOString(),cursor:state.marketCursor,cycleTotal:total,cycleProgress,cycleComplete,lastCompleteAt};state.coverageByUniverse.pokemon=state.marketCoverage;
    state.marketUniverse={};state.marketScannedIds={};save();
    return fresh.active.sort((a,b)=>b.score-a.score).slice(0,400);
  }
  const wanted=MARKET_NAMES.map(n=>norm(n)),owned=new Set(state.cards.map(c=>c.catalogId).filter(Boolean)),briefs=[];
  for(const b of pool){
    const nm=norm(b.name);
    if(owned.has(b.id)||wanted.some(w=>nm.includes(w)))briefs.push(b);
    if(briefs.length>=100)break;
  }
  for(const c of state.cards)if(c.catalogId&&!briefs.some(b=>b.id===c.catalogId))briefs.unshift({id:c.catalogId,name:c.name});
  const full=await mapLimit(briefs.slice(0,100),4,async b=>tcgdexCard("en",b.id));
  return full.filter(Boolean);
}
async function ensureCompleteCatalog(){
  const p=state.catalogMeta?.pokemon||{},l=state.catalogMeta?.lorcana||{};
  const age=Math.max(ageDays(p.at),ageDays(l.at));if((+p.count||0)>0&&(+l.count||0)>0&&(+l.sets||0)>0&&age<=7){const ms=await marketSignalAll().catch(()=>[]),la=ms.filter(x=>marketUniverseOf(x)==="lorcana"&&ageDays(x.scannedAt||x.updated)<=45);if(!la.length){const sets=await lorcastSets();let made=0;for(const st of sets){const cards=await lorcastSetCards(st.code),signals=cards.flatMap(buildLorcanaSignals);if(signals.length){await marketSignalPutMany(signals);made+=signals.length}await new Promise(r=>setTimeout(r,75))}state.coverageByUniverse.lorcana={...(state.coverageByUniverse.lorcana||{}),total:sets.length,seen:sets.length,seenSets:sets.length,priced:made,active:made,at:new Date().toISOString(),cycleComplete:true,lastCompleteAt:new Date().toISOString()};save();await refreshGlobalToday()}return {pokemon:+p.count,lorcana:+l.count,sets:+l.sets,cached:true};}
  const pok=await tcgdexList("en"),prows=(pok||[]).filter(x=>x.id).map(pokemonCatalogRow);for(let i=0;i<prows.length;i+=800)await catalogPutMany(prows.slice(i,i+800));state.catalogMeta.pokemon={count:prows.length,at:new Date().toISOString()};
  const sets=await lorcastSets();let lcount=0,lsignals=0;for(const st of sets){const cards=await lorcastSetCards(st.code),rows=cards.map(lorcanaCatalogRow),signals=cards.flatMap(buildLorcanaSignals);lcount+=rows.length;lsignals+=signals.length;await catalogPutMany(rows);if(signals.length)await marketSignalPutMany(signals);await new Promise(r=>setTimeout(r,75))}state.catalogMeta.lorcana={count:lcount,sets:sets.length,at:new Date().toISOString()};state.coverageByUniverse.lorcana={...(state.coverageByUniverse.lorcana||{}),total:sets.length,seen:sets.length,seenSets:sets.length,seenCards:lcount,priced:lsignals,active:lsignals,at:new Date().toISOString(),cycleComplete:true,lastCompleteAt:new Date().toISOString()};save();try{window.CVTodaySimple?.render?.()}catch{}return {pokemon:prows.length,lorcana:lcount,sets:sets.length,cached:false};
}
window.CVCompleteCatalog={run:ensureCompleteCatalog};
async function turboMarketCoverage(rounds=6){
  const status=document.querySelector("#todayCoverageStatus")||document.querySelector("#marketScanState");
  if(state.turboMarketRunning)return;state.turboMarketRunning=true;save();let pok=0,lor=0,errors=0;
  try{
    for(let n=0;n<rounds;n++){
      if(status)status.textContent="Turbo Radar · Pokémon "+(n+1)+"/"+rounds+"…";
      try{await fetchMarketUniverse("wide","pokemon");pok++}catch(e){errors++;pushRuntimeError("turbo-pokemon",e?.message||e)}
      if(status)status.textContent="Turbo Radar · Lorcana "+(n+1)+"/"+rounds+"…";
      try{await fetchMarketUniverse("wide","lorcana");lor++}catch(e){errors++;pushRuntimeError("turbo-lorcana",e?.message||e)}
      await new Promise(r=>setTimeout(r,120));
    }
    const all=await marketSignalAll().catch(()=>[]),now=Date.now(),active=all.filter(x=>{const t=new Date(x.scannedAt||x.updated||0).getTime();return t&&now-t<=45*86400000});
    state.marketScan=active.sort((a,b)=>(+b.score||0)-(+a.score||0)).slice(0,800);state.marketScanAt=new Date().toISOString();recordSignalSnapshot(state.marketScan);state.turboMarketLast={at:state.marketScanAt,rounds,pokemonRounds:pok,lorcanaRounds:lor,errors,active:active.length};state.turboMarketRunning=false;save();renderMarketScan();renderRadar();await refreshGlobalToday();try{window.CVTodaySimple?.render?.()}catch{}if(status)status.textContent="Turbo Radar listo · "+active.length+" señales activas";return state.turboMarketLast;
  }catch(e){state.turboMarketRunning=false;save();if(status)status.textContent="Turbo Radar interrumpido; el progreso guardado se conserva.";throw e}
}
window.CVTurboMarket={run:turboMarketCoverage};
async function autoMarketCoverage(){
  const last=new Date(state.turboMarketLast?.at||0).getTime(),fresh=last&&Date.now()-last<6*3600000;
  if(fresh||state.turboMarketRunning)return;
  const p=state.coverageByUniverse?.pokemon||{},l=state.coverageByUniverse?.lorcana||{},pDone=(+p.total>0&&+p.seen>=+p.total),lDone=(+l.total>0&&+l.seen>=+l.total);
  if(pDone&&lDone){await refreshGlobalToday().catch(()=>{});return}
  setTimeout(()=>turboMarketCoverage(2).catch(e=>pushRuntimeError("auto-turbo",e?.message||e)),900);
}
window.CVAutoMarketCoverage={run:autoMarketCoverage};


async function retryMarketFailures(){
  const btn=document.querySelector("#retryMarketFailures"),st=document.querySelector("#marketScanState"),ids=Object.keys(state.marketFailures||{}).slice(0,80);
  if(!ids.length){st.textContent="No hay fallos pendientes de mercado.";return}
  btn.disabled=true;st.textContent="Reintentando "+ids.length+" consultas fallidas…";
  const rows=await mapLimit(ids,3,async id=>{
    const c=await tcgdexCard("en",id);
    if(c){delete state.marketFailures[id];let s=buildMarketSignal(c);if(!s)await marketSignalDeleteMany([id]);return s}
    state.marketFailures[id]=(state.marketFailures[id]||0)+1;return null
  });
  const good=rows.filter(Boolean);if(good.length)await marketSignalPutMany(good);
  state.marketCoverage.failed=Object.keys(state.marketFailures).length;await refreshMarketFreshness();renderCoverage();renderQA();
  st.textContent=good.length+" recuperadas · "+state.marketCoverage.failed+" fallos pendientes";btn.disabled=false;
}
function renderCoverage(){
  const box=document.querySelector("#coveragePanel");if(!box)return;
  const u=currentRadarUniverse(),c=u==="pokemon"?(state.coverageByUniverse?.pokemon||state.marketCoverage||{}):(state.coverageByUniverse?.[u]||{}),total=+c.total||0,seen=+c.seen||0,priced=+c.priced||0,active=+c.active||0,stale=+c.stale||0,failed=+c.failed||0,pct=total?seen/total*100:0,unit=c.unit==="sets"?"sets":"elementos";
  box.innerHTML='<div><span>Universo</span><b>'+universeIcon(u)+' '+universeLabel(u)+'</b></div>'+
    '<div><span>Recorridos</span><b>'+seen+(total?' / '+total:'')+' '+unit+'</b></div>'+
    '<div><span>Con precio guardado</span><b>'+priced+'</b></div>'+
    '<div><span>Radar activo ≤45d</span><b>'+active+'</b></div>'+
    '<div><span>Señales antiguas</span><b class="'+(stale?"warn":"")+'">'+stale+'</b></div>'+
    '<div><span>Cobertura</span><b>'+pct.toFixed(1)+'%</b></div>'+
    '<div><span>Fallos</span><b class="'+(failed?"warn":"")+'">'+failed+'</b></div>'+
    '<div class="coverageBar"><i style="width:'+Math.min(100,pct)+'%"></i></div>'+
    '<small>'+(u==="lorcana"?"Lorcast expone todos los sets y cartas; precios actuales se conservan en USD y no se mezclan con EUR.":"TCGdex aporta catálogo y referencias Cardmarket para Pokémon.")+'</small>';
}
function signalLabel(x){
  if(x.score>=78&&x.risk!=="Alto")return "Señal cuantitativa alta";
  if(x.score>=65)return "Señal cuantitativa media";
  if(x.score>=52)return "Señal mixta";
  return "Señal baja";
}
function buildThesis(x){
  const bits=[];
  if(x.momentum7>0.08)bits.push("momentum positivo");
  if(x.discount>0.12)bits.push("descuento frente a tendencia");
  if(x.volatility<0.08)bits.push("precio estable");
  if(x.global)bits.push("referencia EU/US");
  if(!bits.length)bits.push("sin catalizador cuantitativo claro");
  return bits.join(" · ");
}
function snapshotMarketScan(mode){
  const rows=state.marketScan||[];
  if(!rows.length)return;
  const top=[...rows].sort((a,b)=>b.score-a.score).slice(0,10).map(x=>({id:x.id,name:x.name,score:x.score,price:x.price,risk:x.risk}));
  state.marketScanHistory.push({at:new Date().toISOString(),mode,count:rows.length,index:Math.round(median(rows.map(x=>x.score))||0),breadth:Math.round(rows.filter(x=>x.momentum7>0).length/rows.length*100),candidates:rows.filter(x=>decisionFor(x).status==="CANDIDATA").length,top});
  state.marketScanHistory=state.marketScanHistory.slice(-20);
  save();
}
function renderScanHistory(){
  const box=document.querySelector("#scanHistory");if(!box)return;
  const h=[...(state.marketScanHistory||[])].reverse().slice(0,6);
  box.innerHTML=h.length?'<h3>Histórico de mercado</h3>'+h.map(x=>'<div class="scanRow"><span>'+new Date(x.at).toLocaleString("es-ES")+' · '+(x.mode==="wide"?"amplio":"rápido")+'</span><b>Índice '+x.index+' · '+x.breadth+'% positivo · '+(x.candidates??0)+' candidatas · '+x.count+' cartas</b></div>').join(""):"";
}

function scarcitySignal(card){
  if(card.popGrade==null||!card.popSource)return null;
  const pg=Math.max(0,+card.popGrade||0),ph=Math.max(0,+card.popHigher||0),pt=Math.max(pg+ph,+card.popTotal||0);
  if(!pt)return null;
  const gradeShare=pg/pt,higherShare=ph/pt;
  const scarcity=Math.round(clamp(100-(gradeShare*55+higherShare*80),0,100));
  const evidence=card.popUrl&&card.popCheckedAt?"Verificada":"Parcial";
  return {score:scarcity,evidence,source:card.popSource,popGrade:pg,popHigher:ph,popTotal:pt};
}
function portfolioResearchRows(){
  return state.cards.map(c=>({card:c,scarcity:scarcitySignal(c),comps:(c.grading||"RAW")!=="RAW"?marketValueFor(c.name,c.grading,c.grade,c.set||"",cardUniverse(c)):null})).filter(x=>x.scarcity||x.comps);
}
function renderPortfolioRisk(){
  const box=document.querySelector("#portfolioRisk");if(!box)return;
  const valued=state.cards.filter(c=>(+c.value||0)>0),sum=valued.reduce((s,c)=>s+(+c.value||0)*qty(c),0);
  if(!sum){box.innerHTML="";return}
  const byName={};for(const c of valued){let k=(c.name||"Sin nombre").split(" ex")[0];byName[k]=(byName[k]||0)+(+c.value||0)*qty(c)}
  const top=Object.entries(byName).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const topShare=top[0]?top[0][1]/sum*100:0;
  const graded=valued.filter(c=>(c.grading||"RAW")!=="RAW").reduce((s,c)=>s+(+c.value||0)*qty(c),0)/sum*100;
  const research=portfolioResearchRows();const evidence=research.filter(x=>x.scarcity?.evidence==="Verificada").length;const notes=rebalanceNotes();box.innerHTML='<h3>Riesgo de cartera</h3><div class="riskGrid"><div><span>Mayor concentración</span><b>'+topShare.toFixed(0)+'%</b></div><div><span>Graduadas</span><b>'+graded.toFixed(0)+'%</b></div></div><div class="riskEvidence"><span>Fichas con población verificada</span><b>'+evidence+'</b></div>'+(notes.length?'<div class="rebalanceNotes">'+notes.map(n=>'<div>'+n+'</div>').join("")+'</div>':'')+'<div class="riskBars">'+top.map(([n,v])=>'<div><span>'+n+'</span><i style="width:'+Math.min(100,v/sum*100)+'%"></i><b>'+((v/sum)*100).toFixed(0)+'%</b></div>').join("")+'</div>';
}
function toggleCompare(id){
  let a=state.compare||[],i=a.indexOf(id);if(i>=0)a.splice(i,1);else if(a.length<3)a.push(id);state.compare=a;save();renderCompare();renderMarketScan();
}
function renderCompare(){
  const box=document.querySelector("#compareTray");if(!box)return;
  const rows=(state.marketScan||[]).filter(x=>(state.compare||[]).includes(x.id));
  if(!rows.length){box.classList.add("hidden");box.innerHTML="";return}
  box.classList.remove("hidden");
  box.innerHTML='<h3>Comparador</h3><div class="compareGrid">'+rows.map(x=>'<div><b>'+x.name+'</b><span>'+euro(x.price)+'</span><small>Señal '+x.score+' · Riesgo '+x.risk+'</small><small>Mom 7/30d '+(x.momentum7>=0?"+":"")+(x.momentum7*100).toFixed(1)+'%</small><small>Descuento '+(x.discount*100).toFixed(1)+'%</small></div>').join("")+'</div>';
}
function ageDays(date){if(!date)return 9999;let t=new Date(date).getTime();return Number.isFinite(t)?Math.max(0,(Date.now()-t)/86400000):9999}
function freshnessLabel(days){return days<=2?"Muy reciente":days<=14?"Reciente":days<=45?"Aceptable":"Antiguo"}
function liquiditySignal(x){
  const spread=(x.low&&x.price)?Math.max(0,(x.price-x.low)/x.price):null;
  const data=[x.avg1,x.avg7,x.avg30,x.low,x.price].filter(v=>v!=null).length;
  let score=35+data*8+(x.global?12:0);
  if(spread!=null)score+=clamp((.35-spread)*70,-10,20);
  return Math.round(clamp(score,0,100));
}
function convictionSignal(x){
  const liq=liquiditySignal(x),fresh=ageDays(x.updated),freshPts=fresh<=2?100:fresh<=14?80:fresh<=45?55:30;
  const sc=x.scarcity?.score??50;
  return Math.round(clamp(x.score*.5+liq*.2+freshPts*.15+sc*.15,0,100));
}
function buyZone(x){
  const floor=x.low||x.avg30||x.price;
  const fair=x.avg30||x.price;
  if(!floor||!fair)return null;
  const low=Math.min(floor,fair*.94),high=Math.min(fair,floor*1.08);
  return {low,high};
}
function renderMarketIndex(rows){
  const box=document.querySelector("#marketIndex");if(!box)return;
  if(!rows?.length){box.innerHTML="";return}
  const prices=rows.map(x=>+x.price||0).filter(x=>x>0),scores=rows.map(x=>+x.score||0),positive=rows.filter(x=>(+x.momentum7||0)>0).length;
  const medPrice=prices.length?median(prices):0,medScore=scores.length?median(scores):0;
  box.innerHTML='<div><span>Universo</span><b>'+universeIcon(currentRadarUniverse())+' '+universeLabel(currentRadarUniverse())+'</b></div>'+
    '<div><span>Activos analizados</span><b>'+rows.length+'</b></div>'+
    '<div><span>Señal mediana</span><b>'+Math.round(medScore||0)+'/100</b></div>'+
    '<div><span>Precio mediano</span><b>'+money(medPrice,rows[0]?.currency||"EUR")+'</b></div>'+
    '<div><span>Momentum positivo</span><b>'+Math.round(positive/rows.length*100)+'%</b></div>';
}
function renderMarketHealth(rows){
  const box=document.querySelector("#marketHealth");if(!box)return;
  if(!rows.length){box.innerHTML="";return}
  const liq=median(rows.map(liquiditySignal))||0;
  const fresh=rows.filter(x=>ageDays(x.updated)<=14).length/rows.length*100;
  const strong=rows.filter(x=>convictionSignal(x)>=75).length;
  const stale=rows.filter(x=>ageDays(x.updated)>45).length;
  box.innerHTML='<div><span>Liquidez mediana</span><b>'+Math.round(liq)+'/100</b></div><div><span>Datos recientes</span><b>'+fresh.toFixed(0)+'%</b></div><div><span>Convicción ≥75</span><b>'+strong+'</b></div><div><span>Datos antiguos</span><b>'+stale+'</b></div>';
}
async function refreshPortfolioValues(){
  const btn=document.querySelector("#refreshValues"),st=document.querySelector("#marketScanState");btn.disabled=true;let changed=0,checked=0;
  st.textContent="Actualizando valores de tu colección…";
  for(const c of state.cards){
    if(!c.catalogId)continue;checked++;
    try{
      if(cardUniverse(c)!=="pokemon"){let mv=marketValueFor(c.name,c.grading,c.grade,c.set||"",cardUniverse(c));if(mv){c.value=mv.value;c.gradedValuation={...mv,at:new Date().toISOString()};changed++}continue}
      const full=await tcgdexCard("en",c.catalogId);
      if(!full)continue;
      if((c.grading||"RAW")==="RAW"){let p=extractRawPricing(full);if(p){c.value=p.value;c.marketPricing=p;changed++}}
      else{let gv=marketValueFor(c.name,c.grading,c.grade,c.set||"",cardUniverse(c));if(gv){c.value=gv.value;c.gradedValuation={...gv,at:new Date().toISOString()};changed++}}
    }catch{}
  }
  save();render();renderPortfolioRisk();renderRotationPanel();renderReadiness();btn.disabled=false;st.textContent=changed+" valores actualizados de "+checked+" fichas vinculadas.";
}
function evaluateOpportunityAlerts(rows){
  const alerts=[];
  for(const x of rows){
    const zone=buyZone(x),conv=convictionSignal(x),liq=liquiditySignal(x),gate=investmentGate(x),historyOk=marketUniverseOf(x)!=="lorcana"||investability.history;
    if(!gate.ok||!historyOk)continue;
    if(conv>=78&&liq>=65&&x.risk!=="Alto"&&zone&&x.price<=zone.high){
      alerts.push({type:"oportunidad",id:x.id,name:x.name,score:x.score,conviction:conv,liquidity:liq,price:x.price,currency:x.currency||"EUR",zone,upside:gate.upside,reason:"Pasa precio, margen absoluto, liquidez, frescura y zona de entrada"});
    }else if(x.discount>=.18&&liq>=65&&x.risk!=="Alto"){
      alerts.push({type:"descuento",id:x.id,name:x.name,score:x.score,conviction:conv,liquidity:liq,price:x.price,currency:x.currency||"EUR",zone,upside:gate.upside,reason:"Descuento relevante con margen absoluto y liquidez suficientes"});
    }
  }
  return alerts.sort((a,b)=>(b.upside-a.upside)||(b.conviction-a.conviction)).slice(0,8);
}
function renderOpportunityAlerts(rows){
  const box=document.querySelector("#opportunityAlerts");if(!box)return;
  const alerts=evaluateOpportunityAlerts(rows);
  if(!alerts.length){box.innerHTML='<div class="empty">Sin alertas cuantitativas claras en este escaneo.</div>';return}
  box.innerHTML='<h3>Alertas cuantitativas</h3>'+alerts.map(a=>'<article class="alertCard"><div><b>'+a.name+'</b><small>'+a.reason+'</small></div><div class="alertNums"><span>Conv '+a.conviction+'</span><span>Liq '+a.liquidity+'</span><span>'+euro(a.price)+'</span></div></article>').join("");
}
function portfolioAllocation(){
  const rows=state.cards.filter(c=>(+c.value||0)>0),sum=rows.reduce((s,c)=>s+(+c.value||0)*qty(c),0);if(!sum)return[];
  return rows.map(c=>({id:c.id,name:c.name,value:(+c.value||0)*qty(c),share:((+c.value||0)*qty(c))/sum,grading:c.grading||"RAW"})).sort((a,b)=>b.share-a.share);
}
function renderWatchSummary(){
  const box=document.querySelector("#watchSummary");if(!box)return;
  const scan=state.marketScan||[];
  let matched=0,below=0,strong=0;
  for(const w of state.watch){
    const m=scan.find(x=>x.id===w.catalogId||norm(x.name)===norm(w.name));
    if(m){matched++;if(w.target&&m.price<=w.target)below++;if(convictionSignal(m)>=75)strong++}
  }
  box.innerHTML='<div><span>En seguimiento</span><b>'+state.watch.length+'</b></div><div><span>Con mercado</span><b>'+matched+'</b></div><div><span>En objetivo</span><b>'+below+'</b></div><div><span>Convicción ≥75</span><b>'+strong+'</b></div>';
}
function rebalanceNotes(){
  const a=portfolioAllocation(),notes=[];if(!a.length)return notes;
  if(a[0]?.share>=.35)notes.push("Concentración elevada en "+a[0].name+" ("+(a[0].share*100).toFixed(0)+"% del valor).");
  const graded=a.filter(x=>x.grading!=="RAW").reduce((s,x)=>s+x.share,0);
  if(graded>=.8)notes.push("Más del 80% del valor está en cartas graduadas.");
  if(graded<=.15)notes.push("Menos del 15% del valor está en cartas graduadas.");
  return notes;
}
function recordSignalSnapshot(rows){
  const at=new Date().toISOString();
  for(const x of rows){
    state.signalHistory.push({at,id:x.id,name:x.name,price:x.price,score:x.score,conviction:convictionSignal(x),liquidity:liquiditySignal(x),risk:x.risk,analysts:{...(x.analysts||{})}});
  }
  const cutoff=Date.now()-180*86400000;
  state.signalHistory=state.signalHistory.filter(s=>new Date(s.at).getTime()>=cutoff).slice(-5000);
  save();
}
function evaluateSignalPerformance(){
  const h=state.signalHistory||[],latest=state.marketScan||[],latestMap=new Map(latest.map(x=>[x.id,x]));
  const windows=[7,30,90],stats={};
  for(const d of windows){
    const min=Date.now()-(d+3)*86400000,max=Date.now()-(d-3)*86400000;
    const samples=h.filter(s=>{let t=new Date(s.at).getTime();return t>=min&&t<=max&&latestMap.has(s.id)&&s.price>0&&latestMap.get(s.id).price>0});
    const strong=samples.filter(s=>s.conviction>=70);
    const rets=strong.map(s=>(latestMap.get(s.id).price/s.price-1));
    stats[d]={n:strong.length,avg:rets.length?rets.reduce((a,b)=>a+b,0)/rets.length:null,hit:rets.length?rets.filter(r=>r>0).length/rets.length:null};
  }
  return stats;
}
function analystBacktest(){
  const h=state.signalHistory||[],latest=state.marketScan||[],latestMap=new Map(latest.map(x=>[x.id,x]));
  const pairs=h.filter(s=>{let age=ageDays(s.at);return age>=20&&age<=45&&latestMap.has(s.id)&&s.price>0});
  const keys=["momentum","value","stability","global","data","scarcity"],out={};
  for(const k of keys){
    const pts=pairs.filter(p=>p.analysts?.[k]!=null).map(p=>({a:p.analysts[k],r:latestMap.get(p.id).price/p.price-1}));
    if(pts.length<5){out[k]=null;continue}
    const hi=pts.filter(p=>p.a>=60),lo=pts.filter(p=>p.a<60);
    const havg=hi.length?hi.reduce((s,p)=>s+p.r,0)/hi.length:0,lavg=lo.length?lo.reduce((s,p)=>s+p.r,0)/lo.length:0;
    out[k]={n:pts.length,edge:havg-lavg};
  }
  return out;
}
function updateAnalystWeights(){
  const bt=analystBacktest(),base={momentum:.30,value:.22,stability:.18,global:.12,data:.18,scarcity:.12},raw={};
  let sum=0;
  for(const [k,b] of Object.entries(base)){let edge=bt[k]?.edge;let mult=edge==null?1:clamp(1+edge*3,.65,1.45);raw[k]=b*mult;sum+=raw[k]}
  if(sum){for(const k of Object.keys(raw))raw[k]/=sum}
  state.analystWeights=raw;save();return {weights:raw,backtest:bt};
}
function renderSignalPerformance(){
  const box=document.querySelector("#signalPerformance");if(!box)return;
  const perf=evaluateSignalPerformance(),learn=updateAnalystWeights(),labels={momentum:"Momentum",value:"Valor",stability:"Estabilidad",global:"Global",data:"Datos",scarcity:"Escasez"};
  const perfHtml=[7,30,90].map(d=>{let x=perf[d];return '<div><span>'+d+' días</span><b>'+(x?.n?((x.avg>=0?"+":"")+(x.avg*100).toFixed(1)+"%"):"Sin muestra")+'</b><small>'+(x?.n?("acierto "+(x.hit*100).toFixed(0)+"% · "+x.n+" señales"):"")+'</small></div>'}).join("");
  const weights=Object.entries(learn.weights||{}).map(([k,v])=>'<span>'+labels[k]+' '+Math.round(v*100)+'%</span>').join("");
  box.innerHTML='<h3>Rendimiento de señales</h3><div class="performanceGrid">'+perfHtml+'</div><div class="learnedWeights"><b>Pesos aprendidos</b><div>'+weights+'</div><small>Los pesos solo se ajustan cuando existe historial suficiente; no convierten una señal en garantía.</small></div>';
}
function decisionFor(x){
  const conv=convictionSignal(x),liq=liquiditySignal(x),zone=buyZone(x),fresh=ageDays(x.updated||x.scannedAt),reasons=[];
  let status="OBSERVAR";
  if(conv>=80&&liq>=70&&x.risk!=="Alto"&&fresh<=14&&zone&&x.price<=zone.high){status="CANDIDATA";reasons.push("convicción alta","liquidez suficiente","dato reciente","precio en zona")}
  else{
    if(conv<70)reasons.push("convicción insuficiente");
    if(liq<60)reasons.push("liquidez limitada");
    if(x.risk==="Alto")reasons.push("riesgo alto");
    if(fresh>30)reasons.push("dato antiguo");
    if(zone&&x.price>zone.high)reasons.push("precio fuera de zona");
  }
  return {status,conv,liq,zone,reasons};
}
function investmentProfileFor(x){
  const p=state.investmentProfile||{};
  const usd=(x.currency||"EUR")==="USD";
  return {
    min:usd?(+p.minPriceUSD||45):(+p.minPriceEUR||40),
    max:usd?(+p.maxPriceUSD||170):(+p.maxPriceEUR||150),
    upside:usd?(+p.minUpsideUSD||55):(+p.minUpsideEUR||50),
    currency:usd?"USD":"EUR"
  };
}
function modeledUpside(x){
  const base=+x.price||0,target=+x.scenario12||0;
  return target>base?target-base:0;
}
function investmentGate(x){
  const p=investmentProfileFor(x),price=+x.price||0,up=modeledUpside(x),reasons=[],policy=state.operationPolicy||{minPurchaseEUR:20,minProfitEUR:50,minROI:35};
  const hardMin=Math.max(20,+policy.minPurchaseEUR||20),hardProfit=Math.max(50,+policy.minProfitEUR||50),hardROI=Math.max(35,+policy.minROI||35),roi=price>0?up/price*100:0;
  if(marketUniverseOf(x)==="lorcana"&&String(x.currency||"USD").toUpperCase()!=="EUR")reasons.push("sin precio EUR verificable");
  if(price<Math.max(p.min,hardMin))reasons.push("desembolso < "+money(Math.max(p.min,hardMin),p.currency));
  if(price>p.max)reasons.push("precio por encima del rango");
  if(up<Math.max(p.upside,hardProfit))reasons.push("beneficio potencial < "+money(Math.max(p.upside,hardProfit),p.currency));
  if(roi<hardROI)reasons.push("rentabilidad potencial < "+hardROI+"%");
  return {ok:!reasons.length,profile:p,upside:up,roi,reasons,hard:{minPurchase:hardMin,minProfit:hardProfit,minROI:hardROI}};
}
function renderInvestmentProfile(){
  const host=document.querySelector("#marketPaneToday"),tpl=document.querySelector("#investmentProfileTemplate");if(!host||!tpl)return;
  if(!host.querySelector(".investmentProfile"))host.insertAdjacentHTML("afterbegin",tpl.innerHTML);
  const p=state.investmentProfile||{};
  const a=host.querySelector("#invMinPrice"),b=host.querySelector("#invMaxPrice"),c=host.querySelector("#invMinUpside");
  if(a){a.value=+p.minPriceEUR||20;b.value=+p.maxPriceEUR||150;c.value=+p.minUpsideEUR||50}
  [a,b,c].forEach(el=>{if(el)el.onchange=()=>{
    state.investmentProfile=state.investmentProfile||{};
    state.investmentProfile.minPriceEUR=Math.max(20,+a.value||20);
    state.investmentProfile.maxPriceEUR=Math.max(state.investmentProfile.minPriceEUR,+b.value||150);
    state.investmentProfile.minUpsideEUR=Math.max(50,+c.value||50);
    save();renderTopBuyCandidates(state.marketScan||[]);renderDecisionBoard(state.marketScan||[]);
  }});
}
function localObservedHistory(x){
  const rows=(state.signalHistory||[]).filter(h=>h.id===x.id&&(+h.price||0)>0).sort((a,b)=>new Date(a.at)-new Date(b.at)),days=new Set(),prices=[];
  for(const h of rows){const d=String(h.at||"").slice(0,10);if(!days.has(d)){days.add(d);prices.push({at:h.at,price:+h.price})}}
  if((+x.price||0)>0){const d=new Date().toISOString().slice(0,10);if(!days.has(d))prices.push({at:new Date().toISOString(),price:+x.price})}
  const span=prices.length>1?(new Date(prices[prices.length-1].at)-new Date(prices[0].at))/86400000:0,vals=prices.map(p=>p.price),low=vals.length?Math.min(...vals):null,high=vals.length?Math.max(...vals):null;
  return {points:prices.length,spanDays:span,low,high,source:"Card Vault observations"};
}
function investabilityOf(x){
  const u=marketUniverseOf(x),data=+x.analysts?.data||0,price=+x.price||0,priced=price>0,localHistory=localObservedHistory(x),sourceHistory=u==="lorcana"?((+x.historyPoints||0)>=3&&(+x.historySpanDays||0)>=3):([x.avg7,x.avg30,x.low,x.price].filter(v=>v!=null).length>=4),history=sourceHistory||(localHistory.points>=3&&localHistory.spanDays>=2),cross=u==="pokemon"?!!x.global:!!x.tcgplayer,fresh=ageDays(x.updated||x.scannedAt)<=14;
  let score=0;if(priced)score+=25;if(data>=80)score+=20;else if(data>=60)score+=12;if(history)score+=25;if(cross)score+=15;if(fresh)score+=15;
  const maturity=Math.min(100,Math.round((localHistory.points||0)*12+(sourceHistory?45:0)+(cross?20:0)));const quality=Math.min(score,maturity||score);return {score:quality,rawScore:score,maturity,priced,history,sourceHistory,localHistory,cross,fresh,investible:quality>=80};
}
function topBuyRank(x){
  const d=decisionFor(x),fresh=ageDays(x.updated||x.scannedAt),data=+x.analysts?.data||0,zone=d.zone,gate=investmentGate(x),investability=investabilityOf(x),historyOk=marketUniverseOf(x)!=="lorcana"||investability.history;
  const pokemonEvidence=marketUniverseOf(x)!=="pokemon"||(!!x.global&&data>=80&&[x.avg7,x.avg30,x.low,x.price].filter(v=>v!=null).length>=4),eligible=gate.ok&&historyOk&&pokemonEvidence&&(+x.price||0)>0&&d.conv>=76&&d.liq>=65&&x.risk!=="Alto"&&fresh<=14&&zone&&x.price<=zone.high&&data>=60,reasons=[];
  if(!gate.ok)reasons.push(...gate.reasons);if(!historyOk)reasons.push("faltan observaciones históricas");if(!pokemonEvidence)reasons.push("faltan referencias de mercado");if(d.conv<76)reasons.push("convicción < 76");if(d.liq<65)reasons.push("liquidez < 65");if(x.risk==="Alto")reasons.push("riesgo alto");if(fresh>14)reasons.push("precio no reciente");if(data<60)reasons.push("evidencia < 60");
  const rank=Math.round(d.conv*.27+d.liq*.20+(+x.score||0)*.16+data*.10+investability.score*.17+clamp((+x.discount||0)*100,0,100)*.04+clamp(gate.upside/Math.max(1,gate.profile.upside)*100,0,100)*.06);
  return {x,d,fresh,data,eligible,rank,gate,historyOk,pokemonEvidence,investability,reasons:[...new Set(reasons)].slice(0,4)};
}
function cardmarketProductLink(x){
  const key=(marketUniverseOf(x)+"|"+norm(x.name)+"|"+norm(x.number||"")+"|"+norm(x.set)).toLowerCase();
  const known=[
    [/pokemon\\|eevee\\|188.*\\|twilight masquerade/,"https://www.cardmarket.com/es/Pokemon/Products/Singles/Twilight-Masquerade/Eevee-V2-TWM188"],
    [/pokemon\\|charmander\\|168.*\\|151/,"https://www.cardmarket.com/es/Pokemon/Products/Singles/151/Charmander-V2-MEW168"],
    [/pokemon\\|magikarp\\|203.*\\|paldea evolved/,"https://www.cardmarket.com/en/Pokemon/Products/Singles/Paldea-Evolved/Magikarp-V2-PAL203"],
    [/pokemon\\|pikachu ex\\|238.*\\|surging sparks/,"https://www.cardmarket.com/en/Pokemon/Products/Singles/Surging-Sparks/Pikachu-ex-V3-SSP238"],
    [/lorcana\\|aladdin heroic outlaw\\|211.*\\|the first chapter|lorcana\\|aladdin heroic outlaw\\|211.*\\|first chapter/,"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Aladdin-Heroic-Outlaw-V2"],
    [/lorcana\\|genie on the job\\|209.*\\|the first chapter|lorcana\\|genie on the job\\|209.*\\|first chapter/,"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Genie-On-the-Job-V2"],
    [/lorcana\\|elsa spirit of winter\\|207.*\\|the first chapter|lorcana\\|elsa spirit of winter\\|207.*\\|first chapter/,"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Elsa-Spirit-of-Winter-V2"]
  ];
  for(const [re,url] of known)if(re.test(key))return url;
  const game=marketUniverseOf(x)==="lorcana"?"Lorcana":"Pokemon",q=[String(x.name||"").replace(/ · Foil$/i,""),x.set||"",x.number?("#"+x.number):""].filter(Boolean).join(" ");
  return "https://www.cardmarket.com/es/"+game+"/Products/Search?searchString="+encodeURIComponent(q);
}

function psa10BuyLink(x){const offers=(state.gradedOffers||[]).filter(o=>/^PSA 10$/i.test(o.grade||"")&&!/ebay\./i.test(o.url||"")&&norm(o.name)===norm(x.name)&&(!x.set||!o.set||norm(o.set)===norm(x.set))&&(!x.number||!o.number||norm(o.number)===norm(x.number))).sort((a,b)=>(+a.total||Infinity)-(+b.total||Infinity));return offers[0]?.url||""}
function psa10Comparable(x){
  return marketValueFor(x.name,"PSA","10",x.set||"",marketUniverseOf(x));
}
function routeComparison(x){
  const raw=+x.price||0,g=state.gradingEconomics||{},gradeCost=(+g.gradeCost||40)+(+g.buyShip||5),psa10=psa10Comparable(x),goal=+(state.investmentProfile?.minUpsideEUR||50);
  if(!psa10)return {label:"Faltan ventas PSA 10 verificadas",level:"unknown",rawTotal:raw+gradeCost,psa10:null,detail:"No comparo rutas sin al menos 2 ventas cerradas PSA 10 en la base local."};
  const direct=psa10.value,rawToSlab=raw+gradeCost,delta=direct-rawToSlab;
  if(delta>=goal)return {label:"Más eficiente: RAW → PSA",level:"raw",rawTotal:rawToSlab,psa10,delta,detail:"RAW + graduación queda bastante por debajo del valor PSA 10, pero depende de obtener 10."};
  if(delta<=goal*.25)return {label:"Más prudente: comprar PSA 10",level:"psa",rawTotal:rawToSlab,psa10,delta,detail:"La prima PSA 10 es pequeña frente a RAW + graduación y elimina el riesgo de nota."};
  return {label:"Rutas similares",level:"neutral",rawTotal:rawToSlab,psa10,delta,detail:"La diferencia no es suficiente para declarar una ruta claramente superior."};
}
function routeComparisonHtml(x){
  const r=routeComparison(x);
  return '<div class="routeCompare '+r.level+'"><b>'+r.label+'</b><span>RAW + costes '+money(r.rawTotal,x.currency||"EUR")+(r.psa10?' · PSA10 mediana '+money(r.psa10.value,x.currency||"EUR"):'')+'</span><small>'+r.detail+'</small></div>';
}
function authenticityStatus(x){
  if((x.grading||"RAW")==="PSA"&&x.cert&&x.identityVerifiedBy==="user")return {label:"Certificado verificado por ti",level:"high"};
  if(x.source==="Lorcast"||x.global)return {label:"Producto/mercado identificado; autenticidad del ejemplar pendiente",level:"medium"};
  return {label:"Autenticidad del ejemplar no verificable online",level:"low"};
}
function buyRouteLabel(x){
  const g=topBuyRank(x);
  if((x.grading||"RAW")!=="RAW")return "Comparar ya graduada";
  if(g.gate.upside>=g.gate.profile.upside)return "RAW → revisar para PSA";
  return "RAW / conservar";
}
function renderBuyNow(ranked){
  const box=document.querySelector("#buyNowCard");if(!box)return;
  const best=(ranked||[])[0];
  if(!best){box.innerHTML='<div class="buyNow none"><b>RADAR CUANTITATIVO</b><strong>Ninguna candidata ahora mismo</strong><span>Este radar nunca autoriza una compra. La decisión ejecutable vive en el gate PRIME con oferta y evidencia exactas.</span></div>';return}
  const x=best.x,a=authenticityStatus(x),rawUrl=cardmarketProductLink(x),psaUrl=psa10BuyLink(x);
  box.innerHTML='<div class="buyNow"><div class="buyNowFlag">RADAR · candidata cuantitativa #1</div><div class="buyNowMain">'+
    (x.image?'<img src="'+x.image+'" alt="">':'<div class="buyNoImg">🃏</div>')+
    '<div><h3>'+universeIcon(marketUniverseOf(x))+' '+x.name+'</h3><small>'+[x.set,x.rarity,x.finish].filter(Boolean).join(" · ")+'</small>'+
    '<div class="buyRoute">'+buyRouteLabel(x)+'</div><div class="buyMetrics"><span>Precio RAW señal <strong>'+money(x.price,x.currency||"EUR")+'</strong></span><span>Potencial modelado <strong>+'+money(best.gate.upside,x.currency||"EUR")+'</strong></span><span>Conv <strong>'+best.d.conv+'/100</strong></span><span>Liq <strong>'+best.d.liq+'/100</strong></span></div>'+
    routeComparisonHtml(x)+'<div class="auth '+a.level+'">Originalidad: '+a.label+'</div></div></div>'+
    '<div class="dualBuyLinks"><a class="buyLink" href="'+rawUrl+'" target="_blank" rel="noopener">Ver ficha RAW · Cardmarket</a>'+(psaUrl?'<a class="buyLink psa" href="'+psaUrl+'" target="_blank" rel="noopener">PSA 10 · oferta admitida</a>':'<span class="buyLink disabled">PSA 10 · sin oferta exacta</span>')+'</div>'+
    '<small class="buyCaveat">RADAR NO EJECUTABLE. Los agregados sirven para descubrir candidatas; solo el gate PRIME puede mostrar COMPRAR AHORA tras verificar oferta exacta, identidad, vendedor, salida y evidencia vigente.</small></div>';
}
async function refreshGlobalToday(){
  const box=document.querySelector("#topBuyCandidates"),sum=document.querySelector("#globalTodaySummary");
  const all=await marketSignalAll().catch(()=>[]),active=all.filter(x=>{const t=new Date(x.scannedAt||x.updated||0).getTime();return t&&Date.now()-t<=45*86400000});
  const scored=active.map(topBuyRank),eligible=scored.filter(o=>o.eligible).sort((a,b)=>b.rank-a.rank),ranked=eligible.slice(0,10);
  const pokemon=active.filter(x=>marketUniverseOf(x)==="pokemon"),lorcana=active.filter(x=>marketUniverseOf(x)==="lorcana");
  if(sum)sum.innerHTML='<div><span>Pokémon activas</span><b>'+pokemon.length+'</b></div><div><span>Lorcana activas</span><b>'+lorcana.length+'</b></div><div><span>Pasan filtro radar</span><b>'+eligible.length+'</b></div>';
  const investible=scored.filter(o=>o.investability?.investible).sort((a,b)=>b.rank-a.rank);window.CVGlobalRadar={active,scored,eligible,investible,ranked,near:scored.filter(o=>(+o.x.price||0)>=o.gate.profile.min&&(+o.x.price||0)<=o.gate.profile.max).sort((a,b)=>b.rank-a.rank).slice(0,10),best:scored.filter(o=>(+o.x.price||0)>0).sort((a,b)=>b.rank-a.rank).slice(0,10),at:new Date().toISOString()};try{window.CVTodaySimple?.render?.()}catch{}
  if(!box)return;
  renderBuyNow(ranked);
  if(!ranked.length){
    const near=scored.filter(o=>(+o.x.price||0)>=o.gate.profile.min&&(+o.x.price||0)<=o.gate.profile.max).sort((a,b)=>b.rank-a.rank).slice(0,10);
    box.innerHTML='<div class="buyHead"><h3>Top 10 · vigilancia</h3><span>ninguna pasa todos los filtros</span></div>'+
      (near.length?'<div class="topTenList">'+near.map((o,i)=>'<article class="topTenRow"><div class="topTenBody"><b>#'+(i+1)+' '+universeIcon(marketUniverseOf(o.x))+' '+o.x.name+'</b><span>'+money(o.x.price,o.x.currency||"EUR")+'</span><small>'+[...(o.historyOk?[]:["historial insuficiente"]),...(o.pokemonEvidence?[]:["fuentes insuficientes"]),...o.gate.reasons,...o.d.reasons].slice(0,3).join(" · ")+'</small><div class="topTenLinks"><a class="buyLink mini" href="'+cardmarketProductLink(o.x)+'" target="_blank" rel="noopener">RAW · Cardmarket</a>'+(psa10BuyLink(o.x)?'<a class="buyLink mini psa" href="'+psa10BuyLink(o.x)+'" target="_blank" rel="noopener">PSA 10 · oferta admitida</a>':'<span class="buyLink mini disabled">PSA 10 · sin oferta</span>')+'</div></div></article>').join("")+'</div>':'<div class="empty">Sin candidatas en el rango económico actual.</div>');
    return;
  }
  box.innerHTML='<div class="buyHead"><h3>Top 10 radar cuantitativo · Pokémon + Lorcana</h3><span>descubrimiento · no orden de compra</span></div><div class="topTenList">'+
    ranked.map((o,i)=>{const x=o.x,a=authenticityStatus(x),rc=routeComparison(x);return '<article class="topTenRow"><div class="topTenThumb">'+(x.image?'<img src="'+x.image+'" alt="">':'🃏')+'</div><div class="topTenBody"><b>#'+(i+1)+' '+universeIcon(marketUniverseOf(x))+' '+x.name+'</b><small>'+[x.set,x.rarity,x.finish].filter(Boolean).join(" · ")+'</small><div>'+buyRouteLabel(x)+'</div><div class="buyMetrics"><span>RAW <strong>'+money(x.price,x.currency||"EUR")+'</strong></span><span>Potencial <strong>+'+money(o.gate.upside,x.currency||"EUR")+'</strong></span><span>Conv <strong>'+o.d.conv+'</strong></span><span>Liq <strong>'+o.d.liq+'</strong></span></div><div class="routeMini '+rc.level+'">'+rc.label+'</div><div class="auth '+a.level+'">'+a.label+'</div></div><div class="topTenLinks"><a class="buyLink mini" href="'+cardmarketProductLink(x)+'" target="_blank" rel="noopener">RAW · Cardmarket</a>'+(psa10BuyLink(x)?'<a class="buyLink mini psa" href="'+psa10BuyLink(x)+'" target="_blank" rel="noopener">PSA 10 · oferta admitida</a>':'<span class="buyLink mini disabled">PSA 10 · sin oferta</span>')+'</div></article>'}).join("")+'</div>'+
    '<small class="buyFoot">Card Vault solo declara RAW→PSA o comprar PSA10 cuando tiene suficientes ventas PSA10 verificadas. Si no, muestra que faltan comparables en lugar de inventar una conclusión.</small>';
}
function renderTopBuyCandidates(rows){
  const box=document.querySelector("#topBuyCandidates");if(!box)return;
  renderInvestmentProfile();
  const all=(rows||[]).map(topBuyRank),ranked=all.filter(o=>o.eligible).sort((a,b)=>b.rank-a.rank).slice(0,3);
  if(!ranked.length){
    const near=all.filter(o=>(+o.x.price||0)>=o.gate.profile.min&&(+o.x.price||0)<=o.gate.profile.max).sort((a,b)=>b.rank-a.rank).slice(0,3);
    box.innerHTML='<div class="buyHead"><h3>Qué mirar hoy</h3><span>Filtro estricto</span></div><div class="buyNone"><b>Ninguna compra cumple hoy el objetivo</b><span>Exijo precio útil, al menos '+money((state.investmentProfile?.minUpsideEUR||50),"EUR")+' de beneficio potencial modelado y suficiente calidad/liquidez. No mostraré cartas de céntimos como compra.</span></div>'+
      (near.length?'<div class="nearMisses"><b>Más cercanas, pero NO pasan el filtro</b>'+near.map(o=>'<div><span>'+o.x.name+' · '+money(o.x.price,o.x.currency||"EUR")+'</span><small>'+[...o.gate.reasons,...o.d.reasons].slice(0,2).join(" · ")+'</small></div>').join("")+'</div>':'');
    return;
  }
  box.innerHTML='<div class="buyHead"><h3>Top 3 candidatas</h3><span>Solo si cumplen el perfil</span></div>'+
    ranked.map((o,i)=>{const x=o.x,z=o.d.zone,why=[];if((+x.momentum7||0)>0)why.push("momentum positivo");if((+x.discount||0)>=.08)why.push("descuento");if(o.d.liq>=75)why.push("liquidez alta");if(o.fresh<=2)why.push("dato reciente");return '<article class="buyPick"><div class="buyRank">#'+(i+1)+'</div>'+(x.image?'<img src="'+x.image+'" alt="">':'<div class="buyNoImg">🃏</div>')+'<div class="buyBody"><b>'+x.name+'</b><small>'+[x.set,x.rarity].filter(Boolean).join(" · ")+'</small><div class="buyReason">'+(why.join(" · ")||"equilibrio sólido")+'</div><div class="buyMetrics"><span>Precio <strong>'+money(x.price,x.currency||"EUR")+'</strong></span><span>Escenario <strong>'+money(x.scenario12,x.currency||"EUR")+'</strong></span><span>Potencial <strong>+'+money(o.gate.upside,x.currency||"EUR")+'</strong></span><span>Máx. zona <strong>'+money(z.high,x.currency||"EUR")+'</strong></span><span>Conv <strong>'+o.d.conv+'/100</strong></span><span>Liq <strong>'+o.d.liq+'/100</strong></span></div></div></article>'}).join("")+
    '<small class="buyFoot">Filtro cuantitativo, no promesa de beneficio. Si el potencial absoluto no llega al objetivo, la carta no aparece aquí aunque cueste céntimos.</small>';
}
function renderDecisionBoard(rows){
  const box=document.querySelector("#decisionBoard");if(!box)return;
  const ranked=rows.map(x=>({x,d:decisionFor(x),g:investmentGate(x)})).sort((a,b)=>b.d.conv-a.d.conv);
  const candidates=ranked.filter(o=>o.d.status==="CANDIDATA"&&o.g.ok).slice(0,8);
  const observe=ranked.filter(o=>o.d.status==="OBSERVAR").slice(0,5);
  box.innerHTML='<h3>Panel de decisión</h3><p class="muted">Filtro objetivo: ninguna etiqueta implica recomendación ni rentabilidad garantizada.</p>'+
    '<div class="decisionGroup"><b>Candidatas por criterios</b>'+(candidates.length?candidates.map(o=>'<div class="decisionRow"><span>'+o.x.name+'</span><strong>'+money(o.x.price,o.x.currency||"EUR")+'</strong><small>Conv '+o.d.conv+' · Liq '+o.d.liq+(o.d.zone?' · zona '+money(o.d.zone.low,o.x.currency||"EUR")+'–'+money(o.d.zone.high,o.x.currency||"EUR"):'')+'</small></div>').join(""):'<div class="empty">Ninguna carta cumple todos los filtros.</div>')+'</div>'+
    '<div class="decisionGroup"><b>En observación</b>'+observe.map(o=>'<div class="decisionRow mutedRow"><span>'+o.x.name+'</span><small>'+o.d.reasons.slice(0,2).join(" · ")+'</small></div>').join("")+'</div>';
}
function renderProvenance(rows){
  const box=document.querySelector("#provenancePanel");if(!box)return;
  if(!rows.length){box.innerHTML="";return}
  let cm=rows.filter(x=>x.price>0).length,us=rows.filter(x=>x.global).length,fresh=rows.filter(x=>ageDays(x.updated)<=14).length,stale=rows.length-fresh;
  box.innerHTML='<h3>Calidad de fuentes</h3><div class="provenanceGrid"><div><span>Cardmarket/TCGdex</span><b>'+cm+'</b></div><div><span>También EEUU</span><b>'+us+'</b></div><div><span>Datos ≤14 días</span><b>'+fresh+'</b></div><div><span>Datos >14 días</span><b>'+stale+'</b></div></div><small>Las señales cuantitativas se calculan solo con los campos disponibles; ausencia de una fuente no se rellena con estimaciones inventadas.</small>';
}
function renderPhotoValidation(){
  const box=document.querySelector("#photoValidationResults");if(!box)return;const v=state.photoValidation||{};
  if(!v.at){box.innerHTML='<p class="muted">Aún no se ha validado el reconocimiento con fotos reales etiquetadas.</p>';return}
  const acc=v.labeledTested?((v.correct||0)/v.labeledTested):0;
  box.innerHTML='<div class="selfTestHeader"><b>Validación real: '+(v.correct||0)+'/'+(v.labeledTested||0)+' correctas</b><span>'+new Date(v.at).toLocaleString("es-ES")+'</span></div>'+
    '<div class="qaRow"><span>Exactitud con verdad conocida</span><b class="'+(acc>=.7&&v.labeledTested>=3?"ok":"warn")+'">'+(acc*100).toFixed(0)+'%</b></div>'+
    '<div class="qaRow"><span>Incorrectas</span><b class="'+((v.incorrect||0)?"warn":"ok")+'">'+(v.incorrect||0)+'</b></div>'+
    '<div class="qaRow"><span>No resueltas</span><b class="'+((v.unresolved||0)?"warn":"ok")+'">'+(v.unresolved||0)+'</b></div>'+
    '<div class="qaRow"><span>Fotos sin etiqueta</span><b>'+(v.unlabeledTested||0)+'</b></div>'+
    '<div class="qaRow"><span>Proceso completado</span><b class="'+(v.completed?"ok":"warn")+'">'+(v.completed?"OK":"FALLO")+'</b></div>'+
    '<small>La exactitud solo cuenta fotos cuya identidad fue confirmada manualmente por ti antes de la prueba. Resolver una carta desconocida no se contabiliza como acierto.</small>';
}
async function runPhotoValidation(){
  const btn=document.querySelector("#runPhotoValidation"),box=document.querySelector("#photoValidationResults");
  const labeled=state.cards.filter(c=>c.photoKey&&c.catalogId&&c.identityVerifiedAt&&c.identityVerifiedBy==="user").slice(0,5);
  const unlabeled=state.cards.filter(c=>c.photoKey&&!(c.catalogId&&c.identityVerifiedAt&&c.identityVerifiedBy==="user")).slice(0,Math.max(0,5-labeled.length));
  const candidates=[...labeled,...unlabeled];
  if(!candidates.length){box.innerHTML='<p class="muted">No hay fotos guardadas para validar.</p>';return}
  btn.disabled=true;box.innerHTML='<p class="muted">Validando '+candidates.length+' fotos reales sin modificar tu colección…</p>';
  let correct=0,incorrect=0,unresolved=0,labeledTested=0,unlabeledTested=0,unlabeledResolved=0,completed=true,details=[];
  for(const c of candidates){
    try{
      const blob=await photoGet(c.photoKey);if(!blob)continue;
      const expected=c.catalogId||"";
      if(expected)labeledTested++;else unlabeledTested++;
      const r=await Promise.race([analyzeCollectibleFile(blob,cardUniverse(c)),timeoutAfter(22000)]);
      const fresh=cardFromRecognition("__validation__",blob,r,cardUniverse(c));
      if(expected){
        if(fresh.draft||!fresh.catalogId){unresolved++;details.push({id:c.id,result:"unresolved"})}
        else if(fresh.catalogId===expected){correct++;details.push({id:c.id,result:"correct",catalogId:fresh.catalogId})}
        else{incorrect++;details.push({id:c.id,result:"incorrect",expected,got:fresh.catalogId})}
      }else{
        if(!fresh.draft&&fresh.catalogId)unlabeledResolved++;
        details.push({id:c.id,result:!fresh.draft&&fresh.catalogId?"resolved-unlabeled":"unresolved-unlabeled",got:fresh.catalogId||""});
      }
      if(fresh.photoURL)try{URL.revokeObjectURL(fresh.photoURL)}catch{}
    }catch{completed=false;details.push({id:c.id,result:"error"})}
    await new Promise(r=>setTimeout(r,120));
  }
  const accuracy=labeledTested?correct/labeledTested:0;
  const resolution=unlabeledTested?unlabeledResolved/unlabeledTested:0;
  state.photoValidation={at:new Date().toISOString(),labeledTested,correct,incorrect,unresolved,accuracy,unlabeledTested,unlabeledResolved,resolution,completed,details:details.slice(-10)};
  save();renderPhotoValidation();renderReadiness();renderQA();btn.disabled=false;
}
function productCompletionScore(){
  const t=technicalCompletionScore(),pc=state.catalogMeta?.pokemon?.count||0,lc=state.catalogMeta?.lorcana?.count||0,sets=state.catalogMeta?.lorcana?.sets||0;
  const panes=!!document.querySelector("#marketSubnav")&&!!document.querySelector("#pregrade")&&!!document.querySelector("#collection");
  const profile=!!state.investmentProfile&&(+state.investmentProfile.minPriceEUR||0)>=1&&(+state.investmentProfile.minUpsideEUR||0)>=1;
  const checks=[
    {label:"Núcleo técnico",ok:t.score===100},
    {label:"Catálogo Pokémon completo indexado",ok:pc>=20000},
    {label:"Catálogo Lorcana completo indexado",ok:lc>=2500&&sets>=20},
    {label:"Mercado separado en Hoy / Reinvertir / Radar / Catálogo",ok:panes&&!!document.querySelector("#rotationPanel")},
    {label:"Filtro económico de compra activo",ok:profile},{label:"Top 10 y Compra ya operativos",ok:!!document.querySelector("#buyNowCard")},{label:"Rutas RAW y PSA10 disponibles",ok:typeof psa10BuyLink==="function"&&typeof routeComparison==="function"},
    {label:"Pregrado PSA operativo",ok:(state.selfTest?.results||[]).some(x=>x.label==="Pregrado PSA sintético"&&x.ok)},
    {label:"Backup local completo",ok:(state.selfTest?.results||[]).some(x=>x.label==="Backup serializable"&&x.ok)}
  ];
  return {score:Math.round(checks.filter(x=>x.ok).length/checks.length*100),checks};
}
function renderProductCompletion(){
  const box=document.querySelector("#technicalCompletionPanel");if(!box)return;const p=productCompletionScore(),t=technicalCompletionScore();
  box.innerHTML='<h3>Estado de la aplicación V68</h3><div class="readinessScore '+(p.score===100?"complete":"")+'">'+p.score+'%</div>'+
    p.checks.map(x=>'<div class="qaRow"><span>'+x.label+'</span><b class="'+(x.ok?"ok":"warn")+'">'+(x.ok?"OK":"Pendiente")+'</b></div>').join("")+
    '<small>'+(p.score===100?'✅ Aplicación terminada técnicamente al 100%.':'Pulsa «Finalizar app» para completar automáticamente lo que falte.')+' Los datos de tu colección, ventas comparables y población oficial se mantienen como evidencia independiente y no se inventan.</small>'+
    '<div class="qaRow"><span>Autotest técnico</span><b class="'+(t.score===100?"ok":"warn")+'">'+t.score+'%</b></div>';
}function technicalCompletionScore(){
  const self=state.selfTest||{},results=self.results||[],required=["JavaScript cargado","Estado local","IndexedDB fotos","IndexedDB radar","IndexedDB catálogo","Catálogo TCGdex","Catálogo Lorcast","Motor OCR cargado","Procesamiento de imagen","Pregrado PSA sintético","Backup serializable"];
  const pass=required.filter(name=>results.some(x=>x.label===name&&x.ok)).length;
  const integrity=stateIntegrityReport().ok;
  const boot=state.bootInfo?.radarLoaded!==false;
  const bootAt=new Date(state.bootInfo?.at||0).getTime(),runtime=(state.runtimeErrors||[]).filter(x=>new Date(x.at).getTime()>=bootAt&&bootAt>0).length===0;
  const checks=[
    {label:"11/11 autotests",ok:pass===required.length},
    {label:"Integridad local",ok:integrity},
    {label:"Arranque/IndexedDB",ok:boot},
    {label:"Sin errores runtime recientes",ok:runtime},
    {label:"Motor Pokémon",ok:results.some(x=>x.label==="Catálogo TCGdex"&&x.ok)},
    {label:"Motor Lorcana",ok:results.some(x=>x.label==="Catálogo Lorcast"&&x.ok)},
    {label:"Pregrado PSA",ok:results.some(x=>x.label==="Pregrado PSA sintético"&&x.ok)}
  ];
  return {score:Math.round(checks.filter(x=>x.ok).length/checks.length*100),checks,pass,total:required.length};
}

function readinessScore(){
  const photos=state.cards.filter(c=>c.photoKey),identified=photos.filter(c=>!c.draft&&c.recognition?.score>0);
  const signals=state.signalHistory||[],graded=state.market.filter(m=>m.kind==="sold"&&(m.grading||"RAW")!=="RAW"),pop=state.cards.filter(c=>c.popGrade!=null&&c.popSource&&c.popUrl&&c.popCheckedAt);
  const pc=state.coverageByUniverse?.pokemon||state.marketCoverage||{},lc=state.coverageByUniverse?.lorcana||{};
  const allStoredScan=(state.marketScan||[]).length;
  const checks=[
    {k:"code",ok:(state.selfTest?.pass||0)>=11,label:"Autotest técnico 11/11"},
    {k:"market",ok:allStoredScan>=20||(+pc.active||0)>=20||(+lc.active||0)>=20,label:"Market Lab con datos"},
    {k:"pokemonCoverage",ok:(+pc.seen||0)>=120,label:"Pokémon: ≥120 cartas recorridas"},
    {k:"lorcanaCoverage",ok:(+lc.total||0)>0&&(+lc.seen||0)>=(+lc.total||0),label:"Lorcana: todos los sets recorridos"},
    {k:"freshmarket",ok:(+pc.active||0)>=40&&(+lc.active||0)>=20,label:"Radar activo Pokémon ≥40 + Lorcana ≥20"},
    {k:"recognition",ok:(state.photoValidation?.labeledTested||0)>=3&&(state.photoValidation?.accuracy||0)>=.7&&state.photoValidation?.completed===true,label:"Exactitud real ≥70% (≥3 fotos etiquetadas)"},
    {k:"history",ok:signals.length>=50,label:"Histórico ≥50 señales"},
    {k:"graded",ok:graded.length>=4,label:"Comparables graduadas ≥4"},
    {k:"population",ok:pop.length>=1,label:"Población verificada"},
    {k:"backup",ok:(state.selfTest?.results||[]).some(x=>x.label==="Backup serializable"&&x.ok)&&(state.selfTest?.results||[]).some(x=>x.label==="IndexedDB radar"&&x.ok),label:"Backup + radar local"},
    {k:"integrity",ok:stateIntegrityReport().ok,label:"Integridad de datos local"},
    {k:"slab",ok:state.cards.filter(c=>c.recognition?.barcode?.cert&&(c.grading||"RAW")!=="RAW"&&c.recognition?.gradingEvidence!=="ocr-label"&&c.identityVerifiedBy!=="user").length===0,label:"Emisor de slab sin inferencias inseguras"},
    {k:"evidence",ok:marketEvidenceQuality().score>=60,label:"Evidencia de mercado ≥60/100"}
  ];
  return {checks,score:Math.round(checks.filter(x=>x.ok).length/checks.length*100),identified:identified.length,photos:photos.length,coverage:{pokemon:pc,lorcana:lc}};
}
function readinessBlockers(){
  const r=readinessScore();return r.checks.filter(c=>!c.ok).map(c=>{
    if(c.k==="market")return "Haz un escaneo de mercado.";if(c.k==="pokemonCoverage")return "Continúa el escaneo amplio de Pokémon hasta recorrer al menos 120 cartas.";if(c.k==="lorcanaCoverage")return "Continúa Lorcana hasta recorrer todos los sets disponibles.";if(c.k==="freshmarket")return "Mantén al menos 40 señales Pokémon y 20 Lorcana revisadas en los últimos 45 días.";
    if(c.k==="recognition")return "Confirma manualmente la identidad de al menos 3 fotos y alcanza ≥70% de aciertos exactos.";
    if(c.k==="history")return "Acumula al menos 50 señales reales con escaneos.";
    if(c.k==="graded")return "Añade al menos 4 ventas cerradas comparables de cartas graduadas.";
    if(c.k==="population")return "Verifica población oficial de al menos una carta graduada.";
    if(c.k==="code")return "Ejecuta el autotest técnico y supera las 11 de 11 pruebas.";
    if(c.k==="backup")return "Ejecuta el autotest para verificar el backup.";if(c.k==="integrity")return "Pulsa «Revisar y reparar» en Integridad local.";if(c.k==="slab")return "Revisa las cartas graduadas antiguas cuyo emisor se dedujo solo desde un código de barras.";if(c.k==="evidence")return "Añade más ventas cerradas con fecha, moneda y URL de evidencia hasta alcanzar 60/100.";
    return c.label;
  })
}
function renderCertification(){
  const box=document.querySelector("#certificationResults");if(!box)return;const c=state.certification||{},r=readinessScore(),blocks=readinessBlockers(),p=productCompletionScore(),dq=dataQualityScore();
  let head='<div class="certScore '+(p.score===100?"complete":"")+'">'+p.score+'%</div><div class="certSub">Aplicación · Evidencia real '+r.score+'% · Calidad de evidencia '+dq.score+'%</div>';
  if(c.at)head+='<small>Última comprobación: '+new Date(c.at).toLocaleString("es-ES")+'</small>';
  box.innerHTML=head+(p.score===100?'<div class="certDone">✅ Desarrollo de la aplicación completado al 100%.</div>':'')+
    (blocks.length?'<div class="blockers"><b>Evidencia real pendiente (no bloquea que la app esté terminada):</b>'+blocks.map(x=>'<div>• '+x+'</div>').join("")+'</div>':'<div class="certDone">✅ Evidencia real también completa.</div>');
}
async function finalizeApplication(){
  const btn=document.querySelector("#finalizeApp"),st=document.querySelector("#finalizeStatus"),selector=document.querySelector("#radarUniverse");
  btn.disabled=true;st.classList.remove("hidden");const before=selector?.value||"pokemon";
  try{
    st.textContent="1/5 · Autotest completo…";await runSelfTest();
    const pc=await catalogCount("pokemon").catch(()=>0),lc=await catalogCount("lorcana").catch(()=>0);
    if(pc<20000||lc<2500){st.textContent="2/5 · Indexando catálogos completos…";await indexFullCatalog()}
    else st.textContent="2/5 · Catálogos completos ya disponibles.";
    if(selector){
      selector.value="lorcana";const sets=await lorcastSets().catch(()=>[]);let cov=state.coverageByUniverse?.lorcana||{},guard=0;
      while(sets.length&&(+cov.seen||0)<sets.length&&guard<Math.min(sets.length,60)){st.textContent="3/5 · Lorcana "+(+cov.seen||0)+"/"+sets.length+" sets…";await fetchMarketUniverse("wide","lorcana");cov=state.coverageByUniverse?.lorcana||{};guard++}
      selector.value="pokemon";let pCov=state.coverageByUniverse?.pokemon||state.marketCoverage||{},runs=0;
      while((+pCov.active||0)<400&&runs<8){st.textContent="4/5 · Ampliando radar Pokémon…";await fetchMarketUniverse("wide","pokemon");pCov=state.coverageByUniverse?.pokemon||state.marketCoverage||{};runs++}
      selector.value=before;
    }
    st.textContent="5/5 · Validando versión final…";repairStateIntegrity();await refreshMarketFreshness("pokemon");await refreshMarketFreshness("lorcana");await runSelfTest();
    const q=await activeMarketSignals(45,currentRadarUniverse()).catch(()=>({active:[]}));state.marketScan=q.active.sort((a,b)=>b.score-a.score).slice(0,400);state.marketScanUniverse=currentRadarUniverse();
    save();renderMarketScan();renderRadar();renderQA();renderCertification();renderProductCompletion();
    const p=productCompletionScore();st.textContent=p.score===100?"✅ Aplicación terminada al 100% técnico.":"Finalización "+p.score+"% · revisa los pendientes mostrados abajo.";
  }catch(e){pushRuntimeError("finalize",e?.message||e);st.textContent="Finalización interrumpida: "+String(e?.message||e||"error")}
  if(selector)selector.value=before;btn.disabled=false;
}
async function advanceAutomaticCompletion(){
  const btn=document.querySelector("#advanceCompletion"),st=document.querySelector("#completionRunStatus"),selector=document.querySelector("#radarUniverse");
  btn.disabled=true;document.querySelector("#runCertification").disabled=true;st.classList.remove("hidden");
  const before=selector?.value||"pokemon";
  try{
    st.textContent="1/4 · Ejecutando autotests…";await runSelfTest();
    if(selector){
      selector.value="pokemon";
      let pc=state.coverageByUniverse?.pokemon||state.marketCoverage||{},guard=0;
      while((+pc.seen||0)<120&&guard<2){st.textContent="2/4 · Ampliando cobertura Pokémon…";await fetchMarketUniverse("wide","pokemon");pc=state.coverageByUniverse?.pokemon||state.marketCoverage||{};guard++}
      selector.value="lorcana";
      const sets=await lorcastSets().catch(()=>[]);let lc=state.coverageByUniverse?.lorcana||{},remaining=Math.max(0,(sets.length||0)-(+lc.seen||0)),runs=Math.min(remaining,60);
      for(let i=0;i<runs;i++){st.textContent="3/4 · Lorcana set "+(i+1)+"/"+runs+"…";await fetchMarketUniverse("wide","lorcana")}
      selector.value=before;
      const q=await activeMarketSignals(45,currentRadarUniverse());state.marketScan=q.active.sort((a,b)=>b.score-a.score).slice(0,400);state.marketScanUniverse=currentRadarUniverse();
      if(state.marketScan.length)recordSignalSnapshot(state.marketScan);
    }
    st.textContent="4/4 · Verificando integridad y estado…";repairStateIntegrity();await refreshMarketFreshness("pokemon");await refreshMarketFreshness("lorcana");await runSelfTest();
    save();renderCoverage();renderMarketScan();renderProductCompletion();renderReadiness();renderCertification();renderQA();
    const tech=technicalCompletionScore(),real=readinessScore();
    st.textContent="Completado · Técnico "+tech.score+"% · Datos reales "+real.score+"%";
  }catch(e){pushRuntimeError("completion-run",e?.message||e);st.textContent="Proceso interrumpido: "+String(e?.message||e||"error")}
  if(selector)selector.value=before;btn.disabled=false;document.querySelector("#runCertification").disabled=false;
}
async function runCertification(){
  const btn=document.querySelector("#runCertification");btn.disabled=true;btn.textContent="Comprobando…";repairStateIntegrity();renderIntegrity();
  try{await runSelfTest()}catch{}
  try{
    const selector=document.querySelector("#radarUniverse"),before=selector?.value||"pokemon";
    if(selector){
      selector.value="pokemon";await runMarketScan("quick");
      selector.value="lorcana";await runMarketScan("quick");
      selector.value=before;
      const q=await activeMarketSignals(45,currentRadarUniverse());state.marketScan=q.active.sort((a,b)=>b.score-a.score).slice(0,400);state.marketScanUniverse=currentRadarUniverse();
    }
  }catch(e){pushRuntimeError("cert-market",e?.message||e)}
  try{if(state.cards.filter(c=>c.photoKey&&c.catalogId&&c.identityVerifiedAt&&c.identityVerifiedBy==="user").length>=3)await runPhotoValidation()}catch{}
  try{await refreshPortfolioValues()}catch{}
  state.certification={at:new Date().toISOString(),technical:technicalCompletionScore().score,score:readinessScore().score,quality:dataQualityScore().score,marketEvidence:marketEvidenceQuality().score,blockers:readinessBlockers()};save();
  renderProductCompletion();renderCertification();renderReadiness();renderMarketScan();renderQA();
  btn.disabled=false;btn.textContent="Comprobar todo";
}
function renderReadiness(){
  const box=document.querySelector("#readinessPanel");if(!box)return;const r=readinessScore();
  const blocks=readinessBlockers();box.innerHTML='<h3>Evidencia para uso real</h3><div class="readinessScore">'+r.score+'%</div>'+r.checks.map(c=>'<div class="qaRow"><span>'+c.label+'</span><b class="'+(c.ok?'ok':'warn')+'">'+(c.ok?'OK':'Pendiente')+'</b></div>').join("")+(blocks.length?'<div class="nextBlocker"><b>Siguiente bloqueo</b><span>'+blocks[0]+'</span></div>':'<div class="certDone">✅ Lista para el hito V68.</div>')+'<small>Este porcentaje mide evidencia real; no mide si el desarrollo de la app está terminado.</small>';
}
function renderMarketScan(){setupMarketWorkspace();
  renderPortfolioRisk();renderCompare();
  const box=document.querySelector("#marketLeaders");if(!box)return;
  const rows=[...(state.marketScan||[])].sort((a,b)=>b.score-a.score);for(const fn of [()=>renderCoverage(),()=>renderMarketIndex(rows),()=>renderMarketHealth(rows),()=>renderTopBuyCandidates(rows),()=>renderOpportunityAlerts(rows),()=>renderDecisionBoard(rows),()=>renderProvenance(rows),()=>renderSignalPerformance()]){try{fn()}catch(e){pushRuntimeError("market-render",e?.message||e)}}
  if(!rows.length){box.innerHTML='<div class="empty">Pulsa «Escanear mercado» para crear el primer radar cuantitativo.</div>';return}
  box.innerHTML='<div class="marketGrid">'+rows.slice(0,20).map((x,i)=>'<article class="marketAsset">'+(x.image?'<img src="'+x.image+'" alt="">':'')+'<div class="assetBody"><div class="assetTop"><b>#'+(i+1)+' '+universeIcon(marketUniverseOf(x))+' '+x.name+'</b><span class="signal '+(x.score>=75?'hot':x.score>=60?'warm':'')+'">'+x.score+'</span></div><div class="signalLabel">'+signalLabel(x)+'</div><small>'+x.set+(x.rarity?' · '+x.rarity:'')+'</small><div class="assetMetrics"><span>Mercado <b>'+money(x.price,x.currency||"EUR")+'</b></span><span>Riesgo <b>'+x.risk+'</b></span><span>Liquidez <b>'+liquiditySignal(x)+'/100</b></span><span>Convicción <b>'+convictionSignal(x)+'/100</b></span><span>1d <b class="'+(x.momentum1>=0?'up':'down')+'">'+(x.momentum1>=0?'+':'')+(x.momentum1*100).toFixed(1)+'%</b></span><span>7/30d <b class="'+(x.momentum7>=0?'up':'down')+'">'+(x.momentum7>=0?'+':'')+(x.momentum7*100).toFixed(1)+'%</b></span></div><div class="analystStrip"><span>Mom '+(x.analysts?.momentum??0)+'</span><span>Valor '+(x.analysts?.value??0)+'</span><span>Estab '+(x.analysts?.stability??0)+'</span><span>Global '+(x.analysts?.global??0)+'</span><span>Datos '+(x.analysts?.data??0)+'</span>'+(x.analysts?.scarcity!=null?'<span>Escasez '+x.analysts.scarcity+'</span>':'')+'</div><div class="thesis">'+buildThesis(x)+'. Datos: '+freshnessLabel(ageDays(x.updated))+' · '+(buyZone(x)?('zona de compra basada en referencias '+euro(buyZone(x).low)+'–'+euro(buyZone(x).high)+'. '):'')+'Escenario 12m: '+money(x.scenario12,x.currency||"EUR")+' (no es predicción).</div><div class="marketActions"><button class="watchFromMarket" data-watchid="'+x.id+'">Seguir</button><button class="compareMarket" data-compareid="'+x.id+'">'+((state.compare||[]).includes(x.id)?"✓ Comparando":"Comparar")+'</button></div></div></article>').join("")+'</div>';
}
async function continueCoverage(blocks=5){
  const btn=document.querySelector("#continueCoverage"),st=document.querySelector("#marketScanState");
  btn.disabled=true;document.querySelector("#deepScanMarket").disabled=true;
  let completed=0;
  try{
    const u=currentRadarUniverse(),runs=blocks;for(let i=0;i<runs;i++){
      st.textContent="Cobertura "+(i+1)+"/"+runs+" · "+universeLabel(u)+"…";
      await fetchMarketUniverse("wide",u);
      completed++;
      renderCoverage();
      await new Promise(r=>setTimeout(r,180));
    }
    const signals=(await activeMarketSignals(45,currentRadarUniverse())).active.sort((a,b)=>b.score-a.score).slice(0,400);
    state.marketScan=signals;state.marketScanAt=new Date().toISOString();state.marketScanMode="wide";
    recordSignalSnapshot(signals);
    const alerts=evaluateOpportunityAlerts(signals);
    state.alertHistory.push({at:state.marketScanAt,count:alerts.length,ids:alerts.map(a=>a.id)});
    state.alertHistory=state.alertHistory.slice(-30);save();renderMarketScan();renderRadar();snapshotMarketScan("wide");renderScanHistory();renderWatchSummary();renderQA();renderReadiness();
    st.textContent=completed+" bloques completados · "+(state.marketCoverage?.seen||0)+" cartas recorridas";
  }catch(e){st.textContent="Cobertura interrumpida tras "+completed+" bloques. Puedes continuar después."}
  btn.disabled=false;document.querySelector("#deepScanMarket").disabled=false;
}
async function runMarketScan(mode="quick",universeOverride="",options={}){
  const silent=!!options.silent;
  const btn=mode==="wide"?document.querySelector("#deepScanMarket"):document.querySelector("#scanMarket"),st=document.querySelector("#marketScanState");
  if(btn)btn.disabled=true;if(st&&!silent)st.textContent=mode==="wide"?"Preparando escaneo amplio…":"Actualizando radar…";
  try{
    const universe=universeOverride||currentRadarUniverse(),cards=await fetchMarketUniverse(mode,universe);
    if(st&&!silent)st.textContent="Analizando "+cards.length+" elementos de "+universeLabel(universe)+"…";if(!silent)renderCoverage();
    const signals=universe==="pokemon"?cards.map(c=>c?.pricing?buildMarketSignal(c):c).filter(x=>x&&Number.isFinite(+x.score)&&(+x.price||0)>0):cards.filter(Boolean);
    if(!signals.length)throw new Error("La fuente no devolvió señales utilizables en esta pasada");
    const scanAt=new Date().toISOString();
    if(silent){state.autoMarketScans=state.autoMarketScans||{};state.autoMarketScans[universe]={at:scanAt,mode,signals:signals.slice(0,400)};}
    else{state.marketScan=signals;state.marketScanAt=scanAt;state.marketScanMode=mode;state.marketScanUniverse=universe;}
    recordSignalSnapshot(signals);const alerts=evaluateOpportunityAlerts(signals);state.alertHistory.push({at:state.marketScanAt,count:alerts.length,ids:alerts.map(a=>a.id)});state.alertHistory=state.alertHistory.slice(-30);
    save();if(!silent){renderMarketScan();renderRadar();renderRotationPanel();refreshGlobalToday().catch(()=>{});snapshotMarketScan(mode);renderScanHistory();renderWatchSummary();if(st)st.textContent=signals.length+" señales activas · "+new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});renderQA();renderReadiness();}try{window.renderOpportunityEngine?.()}catch{} return signals;
  }catch(e){
    pushRuntimeError("market-scan",e?.message||e);
    const fallback=(await activeMarketSignals(45,universeOverride||currentRadarUniverse()).catch(()=>({active:[]}))).active.sort((a,b)=>b.score-a.score).slice(0,400);
    if(fallback.length){
      state.marketScan=fallback;state.marketScanUniverse=currentRadarUniverse();save();renderMarketScan();renderRadar();
      if(st&&!silent)st.textContent="No se pudo refrescar ahora; mostrando "+fallback.length+" señales guardadas.";return fallback;
    }else if(st&&!silent)st.textContent="No se pudo refrescar y no hay señales guardadas para este universo.";
  }
  btn.disabled=false;
}
function extractRawPricing(c){
  const p=c?.pricing?.cardmarket;if(!p)return null;
  const candidates=[p.trend,p.avg7,p.avg30,p.avg1,p.avg].map(Number).filter(n=>Number.isFinite(n)&&n>0);
  if(!candidates.length)return null;
  const value=candidates[0];
  return {value,source:"Cardmarket vía TCGdex",updated:p.updated||c.pricing?.cardmarket?.updated||"",low:+p.low||null,avg7:+p.avg7||null,avg30:+p.avg30||null};
}
function applyCatalogPricing(card,c){
  const price=extractRawPricing(c);
  if(card.grading==="RAW"&&price){
    card.value=price.value;
    card.marketPricing=price;
  }
  return card;
}
function showMarketHint(card){
  const box=document.querySelector("#marketHint");if(!box)return;
  if(card?.marketPricing){
    const p=card.marketPricing;
    box.innerHTML="<b>Referencia RAW</b><span>"+euro(p.value)+" · "+p.source+(p.avg7?" · media 7d "+euro(p.avg7):"")+(p.avg30?" · media 30d "+euro(p.avg30):"")+"</span>";
    box.classList.remove("hidden");
  }else{
    box.classList.add("hidden");box.innerHTML="";
  }
}
function updateQueueUI(){
  const box=document.querySelector("#queueStatus");if(!box)return;
  if(!recognitionQueue.length&&!queueRunning){box.classList.add("hidden");box.textContent="";return}
  box.classList.remove("hidden");box.textContent=queueRunning?"Identificación en curso · "+recognitionQueue.length+" pendientes":"Pendientes de identificar: "+recognitionQueue.length;
}
async function processRecognitionQueue(){
  if(queueRunning)return;queueRunning=true;updateQueueUI();
  while(recognitionQueue.length){
    const job=recognitionQueue.shift();updateQueueUI();
    try{await recognizeSavedCard(job.card,job.blob)}catch{}
    await new Promise(r=>setTimeout(r,150));
  }
  queueRunning=false;updateQueueUI();
}
function enqueueRecognition(card,blob){
  recognitionQueue.push({card,blob});updateQueueUI();setTimeout(processRecognitionQueue,50);
}

async function findCardMeta(g){
  if(!g.number)return[];
  const front=normNum(g.number.split("/")[0]);
  const langs=["es","en"];
  let out=[];
  for(const lang of langs){
    const list=await Promise.race([tcgdexList(lang),timeoutAfter(6000)]).catch(()=>[]);
    const hits=(list||[]).filter(c=>normNum(c.localId)===front).slice(0,16);
    for(const h of hits){
      const full=await Promise.race([tcgdexCard(lang,h.id),timeoutAfter(4000)]).catch(()=>null);
      if(full){
        full._lang=lang;
        full.printed_number=full.localId||h.localId||"";
        full.expansion=full.set||full.expansion||{};
        if(!full.images&&full.image)full.images=[{small:full.image+"/low.webp",medium:full.image+"/high.webp",large:full.image+"/high.webp"}];
        out.push(full);
      }
    }
    if(out.length===1)break;
  }
  return out;
}
function norm(s){return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim()}
function tokenScore(a,b){let A=new Set(norm(a).split(" ").filter(Boolean)),B=new Set(norm(b).split(" ").filter(Boolean));if(!A.size||!B.size)return 0;let hit=[...A].filter(x=>B.has(x)).length;return hit/Math.max(A.size,B.size)}
function candidateScore(c,g){
  const printed=String(c.printed_number||"").replace(/\s/g,"").toLowerCase();
  const num=String(c.number||"").replace(/\s/g,"").replace(/^0+/,"").toLowerCase();
  const gn=String(g.number||"").replace(/\s/g,"").toLowerCase();
  if(!gn)return 0;
  if(printed===gn)return 100;
  const front=gn.split("/")[0].replace(/^0+/,"");
  if(num===front)return 55;
  return 0;
}
function bestCandidate(found,g){
  return (found||[]).map(c=>({c,score:candidateScore(c,g)})).sort((a,b)=>b.score-a.score)[0]||null
}
function marketValueFor(name,grading,grade,setName="",universe="pokemon"){
  const all=state.market.filter(m=>marketUniverseOf(m)===universe&&m.kind==="sold"&&norm(m.name)===norm(name)&&String(m.grading||"")===String(grading||"")&&String(m.grade||"")===String(grade||""));
  const excludedCurrency=all.filter(m=>(m.currency||"EUR").toUpperCase()!=="EUR").length;
  let sold=all.filter(m=>(m.currency||"EUR").toUpperCase()==="EUR").filter(m=>!setName||!m.set||norm(m.set)===norm(setName)).map(m=>({...m,price:+m.price})).filter(m=>m.price>0);
  if(sold.length<2)return null;
  const now=Date.now(),weighted=[];
  for(const m of sold){
    let age=(now-new Date(m.soldDate||m.at||now).getTime())/86400000;
    let w=age<=30?4:age<=90?3:age<=180?2:1;
    for(let i=0;i<w;i++)weighted.push(m.price);
  }
  weighted.sort((a,b)=>a-b);
  const q1=weighted[Math.floor(weighted.length*.25)],q3=weighted[Math.floor(weighted.length*.75)],iqr=q3-q1;
  let clean=weighted.filter(v=>v>=q1-1.5*iqr&&v<=q3+1.5*iqr);if(!clean.length)clean=weighted;
  const mid=Math.floor(clean.length/2),med=clean.length%2?clean[mid]:(clean[mid-1]+clean[mid])/2;
  const recent30=sold.filter(m=>(now-new Date(m.soldDate||m.at||now).getTime())/86400000<=30).length;
  const recent90=sold.filter(m=>(now-new Date(m.soldDate||m.at||now).getTime())/86400000<=90).length;
  const dispersion=med?iqr/med:1;
  const liquidity=Math.round(clamp(recent30*15+recent90*7+sold.length*3-dispersion*25,0,100));
  return {value:med,count:sold.length,recent:recent90,recent30,dispersion,liquidity,excludedCurrency,confidence:sold.length>=8&&recent90>=3&&dispersion<=.35?"Alta":sold.length>=4&&dispersion<=.6?"Media":"Baja"};
}
function imageCropBlob(file,region="full",max=900,quality=.78){
  return new Promise((ok,no)=>{let im=new Image(),r=new FileReader();r.onload=()=>im.src=r.result;r.onerror=no;im.onload=()=>{
    let x=0,y=0,cw=im.width,ch=im.height;
    if(region==="bottom"){x=im.width*.03;y=im.height*.60;cw=im.width*.94;ch=im.height*.38}
    if(region==="label"){x=im.width*.05;y=0;cw=im.width*.90;ch=im.height*.28}
    let scale=Math.min(1,max/cw),cv=document.createElement("canvas");cv.width=Math.max(1,Math.round(cw*scale));cv.height=Math.max(1,Math.round(ch*scale));
    let g=cv.getContext("2d");g.drawImage(im,x,y,cw,ch,0,0,cv.width,cv.height);
    if(region!=="full"){
      let d=g.getImageData(0,0,cv.width,cv.height),p=d.data;
      for(let i=0;i<p.length;i+=4){let v=.299*p[i]+.587*p[i+1]+.114*p[i+2];v=v>145?255:v<105?0:v;p[i]=p[i+1]=p[i+2]=v}
      g.putImageData(d,0,0);
    }
    cv.toBlob(b=>b?ok(b):no(new Error("No blob")),"image/jpeg",quality)
  };r.readAsDataURL(file)})
}
function timeoutAfter(ms){return new Promise((_,no)=>setTimeout(()=>no(new Error("timeout")),ms))}
function extractNumberCandidates(text){
  const raw=String(text||"").replace(/[Oo]/g,"0");
  const out=[];
  for(const m of raw.matchAll(/\b(\d{1,3})\s*[\/|\\-]\s*(\d{2,3})\b/g))out.push(m[1]+"/"+m[2]);
  for(const m of raw.matchAll(/\b(\d{1,3})\s+(\d{2,3})\b/g)){let a=+m[1],b=+m[2];if(a<=b+80)out.push(m[1]+"/"+m[2])}
  return [...new Set(out)].slice(0,6);
}
function ocrNameTokens(text){
  return [...new Set(String(text||"").toLowerCase().match(/[a-záéíóúñ]{4,}/gi)||[])].filter(x=>!["pokemon","basic","stage","trainer","energy","damage","weakness","resistance","retreat"].includes(x)).slice(0,12);
}
function candidateTextScore(c,tokens){
  if(!tokens?.length)return 0;let hay=(c.name+" "+(c.set?.name||"")).toLowerCase(),s=0;
  for(const t of tokens)if(hay.includes(t))s+=8;
  return s;
}
async function detectSlabCode(file){
  if(!("BarcodeDetector" in window))return null;
  try{
    const formats=await BarcodeDetector.getSupportedFormats();
    const wanted=["code_128","qr_code","data_matrix","ean_13"].filter(x=>formats.includes(x));
    if(!wanted.length)return null;
    const bd=new BarcodeDetector({formats:wanted}),bmp=await createImageBitmap(file);
    const codes=await Promise.race([bd.detect(bmp),timeoutAfter(3500)]);bmp.close?.();
    for(const c of codes||[]){const raw=String(c.rawValue||"").trim(),m=raw.match(/\b\d{7,10}\b/);if(m)return {cert:m[0],format:c.format||"",raw}}
  }catch{} return null;
}

async function imageToCanvas(file,maxW=720){
  const bmp=await createImageBitmap(file),scale=Math.min(1,maxW/bmp.width),cv=document.createElement("canvas");
  cv.width=Math.max(1,Math.round(bmp.width*scale));cv.height=Math.max(1,Math.round(bmp.height*scale));
  const g=cv.getContext("2d");g.drawImage(bmp,0,0,cv.width,cv.height);bmp.close?.();return cv;
}
function regionStats(data,w,h,x0,y0,x1,y1){
  x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(w,Math.ceil(x1));y1=Math.min(h,Math.ceil(y1));
  let n=0,lum=0,lum2=0,white=0,grad=0,prev=null;
  for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){
    const i=(y*w+x)*4,v=.299*data[i]+.587*data[i+1]+.114*data[i+2];
    lum+=v;lum2+=v*v;n++;if(v>238)white++;if(prev!=null)grad+=Math.abs(v-prev);prev=v;
  }
  const mean=lum/Math.max(1,n),variance=Math.max(0,lum2/Math.max(1,n)-mean*mean);
  return {mean,contrast:Math.sqrt(variance),white:white/Math.max(1,n),gradient:grad/Math.max(1,n)};
}
function symmetryScore(a,b){
  const d=Math.abs(a-b)/Math.max(1,(Math.abs(a)+Math.abs(b))/2);return Math.round(clamp(100-d*120,0,100));
}
function psaGradeFromScore(score){
  if(score>=96)return 10;if(score>=91)return 9;if(score>=84)return 8;if(score>=75)return 7;if(score>=66)return 6;
  if(score>=56)return 5;if(score>=46)return 4;if(score>=34)return 3;if(score>=22)return 2;return 1;
}
function psaRange(score,confidence){
  const g=psaGradeFromScore(score),spread=confidence>=80?1:confidence>=60?2:3;
  return {low:Math.max(1,g-spread+1),high:Math.min(10,g)};
}
async function analyzeCornerMacro(file,label){
  const q=await imageQuality(file),cv=await imageToCanvas(file,520),g=cv.getContext("2d"),w=cv.width,h=cv.height,d=g.getImageData(0,0,w,h).data;
  const outer=regionStats(d,w,h,0,0,w,h),inner=regionStats(d,w,h,w*.18,h*.18,w*.82,h*.82);
  const whitening=clamp((outer.white-inner.white)*220,0,35);
  const texture=Math.abs(outer.gradient-inner.gradient);
  const contrastPenalty=clamp((texture-7)*2.2,0,30);
  const focusPenalty=q.score<55?(55-q.score)*.7:0;
  const score=Math.round(clamp(100-whitening-contrastPenalty-focusPenalty,25,100));
  const issues=[];
  if(whitening>10)issues.push("posible blanqueamiento");
  if(contrastPenalty>10)issues.push("posible golpe/irregularidad");
  if(q.score<55)issues.push("macro poco nítido");
  return {label,score,quality:q.score,whitening:Math.round(whitening),texture:Math.round(texture),issues};
}
function cornerAggregate(corners){
  const valid=(corners||[]).filter(Boolean);if(!valid.length)return null;
  const avg=valid.reduce((s,x)=>s+x.score,0)/valid.length;
  const worst=Math.min(...valid.map(x=>x.score));
  const score=Math.round(avg*.55+worst*.45);
  return {score,worst,avg:Math.round(avg),count:valid.length,issues:[...new Set(valid.flatMap(x=>x.issues||[]))]};
}
async function analyzePregradeSide(file,side){
  const q=await imageQuality(file),cv=await imageToCanvas(file,760),g=cv.getContext("2d"),w=cv.width,h=cv.height,d=g.getImageData(0,0,w,h).data;
  const edge=Math.max(8,Math.round(Math.min(w,h)*.055)),corner=Math.max(18,Math.round(Math.min(w,h)*.13));
  const L=regionStats(d,w,h,0,h*.15,edge,h*.85),R=regionStats(d,w,h,w-edge,h*.15,w,h*.85);
  const T=regionStats(d,w,h,w*.15,0,w*.85,edge),B=regionStats(d,w,h,w*.15,h-edge,w*.85,h);
  const tl=regionStats(d,w,h,0,0,corner,corner),tr=regionStats(d,w,h,w-corner,0,w,corner),bl=regionStats(d,w,h,0,h-corner,corner,h),br=regionStats(d,w,h,w-corner,h-corner,w,h);
  const centerLR=symmetryScore(L.gradient,R.gradient),centerTB=symmetryScore(T.gradient,B.gradient);
  const centering=Math.round((centerLR+centerTB)/2);
  const edgeBalance=Math.round((symmetryScore(L.white,R.white)+symmetryScore(T.white,B.white))/2);
  const cornerVals=[tl,tr,bl,br],cornerMean=cornerVals.reduce((s,x)=>s+x.gradient,0)/4;
  const cornerSpread=Math.sqrt(cornerVals.reduce((s,x)=>s+Math.pow(x.gradient-cornerMean,2),0)/4);
  const corners=Math.round(clamp(100-cornerSpread*4-(cornerVals.filter(x=>x.white>.18).length*5),0,100));
  const edges=Math.round(clamp(edgeBalance*.65+Math.min(100,60+((L.gradient+R.gradient+T.gradient+B.gradient)/4)*1.2)*.35,0,100));
  const full=regionStats(d,w,h,w*.08,h*.08,w*.92,h*.92),glarePenalty=clamp((full.white-.08)*180,0,28);
  const surface=Math.round(clamp(94-Math.max(0,full.gradient-24)*1.1-glarePenalty,25,100));
  const focus=Math.round(clamp(q.score,0,100));
  const score=Math.round(centering*.25+corners*.27+edges*.23+surface*.20+focus*.05);
  const issues=[];
  if(centering<88)issues.push("centrado visual mejorable");
  if(corners<88)issues.push("posible desgaste o asimetría en esquinas");
  if(edges<88)issues.push("posible irregularidad/blanqueo en bordes");
  if(surface<88)issues.push("posibles marcas, reflejos o defectos de superficie");
  if(q.score<60)issues.push("foto insuficiente para máxima confianza");
  return {side,q,centering,corners,edges,surface,focus,score,issues,canvas:cv};
}
function paintPregradeOverlay(src,target,analysis){
  const ctx=target.getContext("2d"),w=src.width,h=src.height;target.width=w;target.height=h;ctx.drawImage(src,0,0);
  ctx.lineWidth=Math.max(2,Math.round(Math.min(w,h)*.006));ctx.strokeStyle="rgba(255,80,80,.9)";
  const c=Math.round(Math.min(w,h)*.13),e=Math.round(Math.min(w,h)*.055);
  ctx.strokeRect(1,1,c,c);ctx.strokeRect(w-c-1,1,c,c);ctx.strokeRect(1,h-c-1,c,c);ctx.strokeRect(w-c-1,h-c-1,c,c);
  ctx.strokeStyle="rgba(255,210,80,.9)";ctx.strokeRect(e,e,w-2*e,h-2*e);
}
function calculateGradingEconomics(){
  const v=id=>Math.max(0,+document.querySelector(id)?.value||0),buy=v("#gradeBuyPrice"),buyShip=v("#gradeBuyShip"),gradeCost=v("#gradeCost"),psa9=v("#gradePSA9"),psa10=v("#gradePSA10"),sellFeePct=clamp(v("#gradeSellFee"),0,50),own=selectedPSACard();
  const rawOpportunity=own?(+own.value||buy):buy+buyShip,fixed=own?gradeCost:(buy+buyShip+gradeCost),netSale=sale=>sale*(1-sellFeePct/100);
  const profit9=psa9>0?(own?netSale(psa9)-gradeCost-rawOpportunity:netSale(psa9)-fixed):null;
  const profit10=psa10>0?(own?netSale(psa10)-gradeCost-rawOpportunity:netSale(psa10)-fixed):null,goal=+(state.investmentProfile?.minUpsideEUR||50);
  state.gradingEconomics={buy,buyShip,gradeCost,psa9,psa10,sellFeePct};save();
  const last=own?(state.pregradeHistory||[]).filter(x=>x.cardId===own.id).at(-1):(state.pregradeHistory||[]).at(-1),box=document.querySelector("#gradingEconomicsResult");if(!box)return;
  if(!(buy>0)||!(psa9>0||psa10>0)){box.innerHTML='<div class="gradeEconHero warn"><b>Faltan precios reales</b><span>'+(own?'Valor RAW cargado desde tu colección. Añade al menos una salida PSA 9 o PSA 10 respaldada y el coste real de graduación.':'Introduce el coste RAW y al menos una salida PSA 9 o PSA 10 respaldada antes de calcular.')+'</span></div>';return null}
  let verdict=psa10>0?"Necesita PSA 10 para justificar la operación":"PSA 10 sin precio respaldado",cls="warn";
  if(profit9!=null&&profit9>=goal){verdict="PSA 9 ya aporta suficiente valor frente a RAW";cls="ok"}
  else if(profit10!=null&&profit10>=goal){verdict="Solo compensa económicamente si alcanza PSA 10";cls="warn"}
  else if(profit10!=null){verdict="No mejora suficiente frente a conservar/vender RAW";cls="bad"}
  else if(profit9!=null){verdict="PSA 9 no justifica el envío y falta PSA 10";cls="warn"}
  const photo=last?(' · Pregrado fotográfico PSA '+last.range.low+'–'+last.range.high):'';
  box.innerHTML='<div class="gradeEconHero '+cls+'"><b>'+verdict+'</b><span>'+(own?('Carta propia · RAW '+euro(rawOpportunity)+' · coste graduación '+euro(gradeCost)):('Coste total antes de venta '+euro(fixed)))+photo+'</span></div>'+
    '<div class="gradeEconRows"><div><span>Valor añadido si PSA 9</span><b class="'+(profit9!=null&&profit9>=goal?"ok":"warn")+'">'+(profit9==null?"—":(profit9>=0?"+":"")+euro(profit9))+'</b></div>'+
    '<div><span>Valor añadido si PSA 10</span><b class="'+(profit10!=null&&profit10>=goal?"ok":"warn")+'">'+(profit10==null?"—":(profit10>=0?"+":"")+euro(profit10))+'</b></div>'+
    '<div><span>Objetivo mínimo</span><b>'+euro(goal)+'</b></div></div>'+
    '<small>'+(own?'El cálculo compara contra vender/conservar la carta RAW ahora. No asigna probabilidades de obtener 9 o 10.':'No asigna probabilidades de nota.')+' Confirma ventas cerradas PSA comparables antes de enviar.</small>';
  renderCollectionPSADecision();
  return {profit9,profit10,fixed,goal,rawOpportunity,ownCardId:own?.id||null};
}
function populatePSACollectionPicker(){
  const sel=document.querySelector("#psaCollectionCard");if(!sel)return;
  const current=sel.value,rows=activeCards().filter(c=>(c.grading||"RAW")==="RAW"&&(+c.value||0)>0).sort((a,b)=>(+b.value||0)-(+a.value||0));
  sel.innerHTML='<option value="">Seleccionar carta de Mi colección</option>'+rows.map(c=>'<option value="'+c.id+'">'+c.name+(c.number?' #'+c.number:'')+' · '+euro(c.value)+'</option>').join("");
  if(rows.some(c=>c.id===current))sel.value=current;
  renderCollectionPSADecision();
  renderPSAPriorityQueue();
}
function psaEvidenceForCard(c){
  const p9=marketValueFor(c.name,"PSA","9",c.set||"",cardUniverse(c));
  const p10=marketValueFor(c.name,"PSA","10",c.set||"",cardUniverse(c));
  return {p9,p10,ready:!!(p9&&p10),count9:p9?.count||0,count10:p10?.count||0};
}
function psaPriorityScore(c){
  if((c.grading||"RAW")!=="RAW"||!(+c.value>0)||c.archivedSold)return null;
  const raw=+c.value||0,hasBack=/reverso/i.test(c.notes||"")&&!/pendiente de reverso/i.test(c.notes||""),purpose=c.purpose||"collection",evidence=psaEvidenceForCard(c);
  let score=0,reasons=[];
  if(raw>=40){score+=35;reasons.push("RAW con valor relevante")}
  else if(raw>=20){score+=25;reasons.push("RAW de valor medio")}
  else if(raw>=10){score+=15;reasons.push("RAW por encima de 10 €")}
  else score+=5;
  if(purpose==="psa"){score+=25;reasons.push("marcada para PSA")}
  if(purpose==="investment"){score+=12;reasons.push("posición de inversión")}
  if(/secret|rainbow|illustration rare|full art|ultra rare|special illustration/i.test(c.notes||"")){score+=12;reasons.push("rareza/arte premium")}
  if(/eevee|charizard|venusaur|pikachu|mew|umbreon|gengar|rayquaza|lugia|gardevoir|lapras/i.test(c.name||"")){score+=8;reasons.push("personaje con demanda")}
  if(c.marketPricing?.avg7&&c.marketPricing?.avg30&&+c.marketPricing.avg7>+c.marketPricing.avg30){score+=5;reasons.push("mercado reciente firme")}
  if(evidence.ready){score+=10;reasons.push("PSA 9 y 10 con ventas comparables")}
  else if(evidence.p9||evidence.p10){score+=4;reasons.push("evidencia PSA parcial")}
  if(hasBack){score+=3}
  const last=(state.pregradeHistory||[]).filter(x=>x.cardId===c.id).at(-1);
  if(last){score+=Math.min(12,Math.max(0,(last.overall-80)*.8));reasons.push("ya tiene pregrado")}
  const missing=[];
  if(!last)missing.push("pregrado");
  if(!hasBack)missing.push("reverso");
  if(!evidence.p9)missing.push("ventas PSA 9");
  if(!evidence.p10)missing.push("ventas PSA 10");
  return {c,score:Math.round(score),reasons,missing,last,raw,evidence};
}
function renderPSAPriorityQueue(){
  const box=document.querySelector("#psaPriorityQueue");if(!box)return;
  const rows=activeCards().map(psaPriorityScore).filter(Boolean).sort((a,b)=>b.score-a.score||b.raw-a.raw).slice(0,8);
  box.innerHTML='<h3>Prioridad para estudiar PSA</h3><p class="muted">Ordena qué cartas merece la pena revisar primero. No significa “enviar a PSA”.</p>'+
    (rows.length?rows.map((r,i)=>'<article class="rotationRow"><div><b>#'+(i+1)+' '+r.c.name+(r.c.number?' #'+r.c.number:'')+'</b><small>'+r.c.set+' · RAW '+euro(r.raw)+'</small></div><strong>'+r.score+'/100</strong><span class="rotationAction revisar-psa">ESTUDIAR</span><small>'+r.reasons.slice(0,3).join(" · ")+'</small><small>PSA 9: '+(r.evidence.p9?euro(r.evidence.p9.value)+' · '+r.evidence.count9+' ventas':'sin evidencia suficiente')+' · PSA 10: '+(r.evidence.p10?euro(r.evidence.p10.value)+' · '+r.evidence.count10+' ventas':'sin evidencia suficiente')+'</small><small>'+(r.missing.length?'Falta: '+r.missing.join(" + "):'Evidencia mínima completa para evaluar economía; falta aún validar físicamente la copia.')+'</small><button type="button" class="psaPickOwned" data-cardid="'+r.c.id+'">Analizar esta</button></article>').join(""):'<div class="empty">No hay cartas RAW con valoración suficiente para priorizar.</div>')+
    '<small>Las medianas PSA solo se muestran con al menos 2 ventas cerradas EUR comparables. Card Vault no convierte un precio anunciado en valor PSA ni asigna probabilidad de PSA 10.</small>';
  box.querySelectorAll(".psaPickOwned").forEach(b=>b.onclick=()=>{const sel=document.querySelector("#psaCollectionCard");if(sel){sel.value=b.dataset.cardid;sel.dispatchEvent(new Event("change"));sel.scrollIntoView({behavior:"smooth",block:"center"})}});
}
function selectedPSACard(){const id=document.querySelector("#psaCollectionCard")?.value;return id?activeCards().find(c=>c.id===id)||null:null}
function renderCollectionPSADecision(){
  const box=document.querySelector("#collectionPSADecision");if(!box)return;const c=selectedPSACard();
  if(!c){box.innerHTML='<p class="muted">Elige una carta para conectar el pregrado con su economía real.</p>';return}
  const last=(state.pregradeHistory||[]).filter(x=>x.cardId===c.id).at(-1),raw=+c.value||0;
  box.innerHTML='<div class="qaRow"><span>Valor RAW actual</span><b>'+euro(raw)+'</b></div>'+
    '<div class="qaRow"><span>Estado</span><b>'+((c.notes||"").includes("pendiente de reverso")?"Falta reverso":"Pendiente de pregrado completo")+'</b></div>'+
    '<div class="qaRow"><span>Último pregrado</span><b>'+(last?('PSA '+last.range.low+'–'+last.range.high+' · confianza '+last.confidence+'%'):'Sin analizar')+'</b></div>'+
    (()=>{const ev=psaEvidenceForCard(c);return '<div class="qaRow"><span>PSA 9 comparable</span><b>'+(ev.p9?euro(ev.p9.value)+' · '+ev.count9+' ventas':'Pendiente')+'</b></div><div class="qaRow"><span>PSA 10 comparable</span><b>'+(ev.p10?euro(ev.p10.value)+' · '+ev.count10+' ventas':'Pendiente')+'</b></div>'})()+
    '<small>Para recomendar envío necesitamos frontal + reverso; las 4 esquinas aumentan la confianza. El valor RAW es coste de oportunidad, no dinero que vuelves a pagar.</small>';
}
function bindPSACollectionPicker(){
  const sel=document.querySelector("#psaCollectionCard");if(!sel||sel.dataset.bound)return;sel.dataset.bound="1";
  sel.onchange=()=>{const c=selectedPSACard();if(c){const raw=document.querySelector("#gradeBuyPrice"),ship=document.querySelector("#gradeBuyShip"),p9=document.querySelector("#gradePSA9"),p10=document.querySelector("#gradePSA10"),ev=psaEvidenceForCard(c);if(raw)raw.value=+c.value||0;if(ship)ship.value=0;if(p9)p9.value=ev.p9?.value||0;if(p10)p10.value=ev.p10?.value||0}renderCollectionPSADecision();calculateGradingEconomics()};
  populatePSACollectionPicker();
}
function hydrateGradingEconomics(){
  const g=state.gradingEconomics||{};const map={gradeBuyPrice:g.buy,gradeBuyShip:g.buyShip,gradeCost:g.gradeCost,gradePSA9:g.psa9,gradePSA10:g.psa10,gradeSellFee:g.sellFeePct};
  for(const [id,val] of Object.entries(map)){const el=document.querySelector("#"+id);if(el&&val!=null)el.value=val}
  calculateGradingEconomics();
}
function renderPregradeHistory(){
  const box=document.querySelector("#pregradeHistory");if(!box)return;const h=[...(state.pregradeHistory||[])].reverse().slice(0,5);
  box.innerHTML='<h3>Últimos pregrados</h3>'+(h.length?h.map(x=>'<div class="qaRow"><span>'+(x.cardName?x.cardName+' · ':'')+new Date(x.at).toLocaleString("es-ES")+'</span><b>PSA '+x.range.low+'–'+x.range.high+' · '+x.overall+'/100 · '+x.confidence+'%</b></div>').join(""):'<p class="muted">Aún no hay análisis guardados.</p>');
}
function renderPregradeReport(r){
  const box=document.querySelector("#pregradeResult");if(!box)return;
  const rows=[["Centrado",r.centering],["Esquinas",r.corners],["Bordes",r.edges],["Superficie",r.surface]];
  box.innerHTML='<div class="pregradeHero"><span>Pregrado estimado</span><strong>PSA '+r.range.low+'–'+r.range.high+'</strong><small>Confianza fotográfica '+r.confidence+'% · '+(r.cornerCount||0)+'/4 macros de esquina</small></div>'+
    '<div class="gradeBreakdown">'+rows.map(([n,v])=>'<div><span>'+n+'</span><b>'+v+'/100</b><i><em style="width:'+v+'%"></em></i></div>').join("")+'</div>'+
    '<div class="gradeNotes"><b>Hallazgos</b>'+(r.issues.length?r.issues.map(x=>'<div>• '+x+'</div>').join(""):'<div>• No se detectan defectos evidentes en estas fotografías.</div>')+'</div>'+
    '<div class="gradeNotes"><b>Lectura</b><div>El rango es una estimación visual. Defectos microscópicos, presión, indentaciones, alteraciones, autenticidad o daños invisibles en foto pueden cambiar el grado oficial.</div></div>';
}
async function runPSAPregrade(){
  const front=document.querySelector("#psaFront")?.files?.[0],back=document.querySelector("#psaBack")?.files?.[0],btn=document.querySelector("#runPregrade"),st=document.querySelector("#pregradeStatus");
  const cornerFiles=[
    ["Sup. izq.",document.querySelector("#psaCornerTL")?.files?.[0]],
    ["Sup. der.",document.querySelector("#psaCornerTR")?.files?.[0]],
    ["Inf. izq.",document.querySelector("#psaCornerBL")?.files?.[0]],
    ["Inf. der.",document.querySelector("#psaCornerBR")?.files?.[0]]
  ];
  if(!front){st.textContent="Añade al menos una foto frontal.";return}
  btn.disabled=true;st.textContent="Analizando centrado, esquinas, bordes y superficie…";
  try{
    const f=await analyzePregradeSide(front,"front"),b=back?await analyzePregradeSide(back,"back"):null;
    const corners=[];
    for(const [label,file] of cornerFiles)if(file)corners.push(await analyzeCornerMacro(file,label));
    const cornerAgg=cornerAggregate(corners);
    paintPregradeOverlay(f.canvas,document.querySelector("#pregradeFrontCanvas"),f);
    const bc=document.querySelector("#pregradeBackCanvas");if(b)paintPregradeOverlay(b.canvas,bc,b);else{bc.width=1;bc.height=1}
    const hasBack=!!b,weightFront=hasBack?.58:1,weightBack=hasBack?.42:0;
    const centering=Math.round(f.centering*(hasBack?.58:1)+(b?.centering||0)*(hasBack?.42:0));
    const cornerBase=Math.round(f.corners*weightFront+(b?.corners||0)*weightBack);
    const cornersScore=cornerAgg?Math.round(cornerBase*.35+cornerAgg.score*.65):cornerBase;
    const edges=Math.round(f.edges*weightFront+(b?.edges||0)*weightBack),surface=Math.round(f.surface*weightFront+(b?.surface||0)*weightBack);
    let overall=Math.round(centering*.22+cornersScore*.30+edges*.23+surface*.25);
    const minQuality=Math.min(f.q.score,b?.q.score??f.q.score,...corners.map(x=>x.quality));
    let confidence=Math.round(clamp((b?60:42)+(corners.length*6)+minQuality*.22,35,98));
    if(!b)confidence=Math.min(confidence,68);
    if(corners.length<4)confidence=Math.min(confidence,82);
    if(minQuality<50)overall=Math.min(overall,88);
    const range=psaRange(overall,confidence);
    const issues=[...new Set([...(f.issues||[]),...(b?.issues||[]),...(cornerAgg?.issues||[])])];
    const selected=selectedPSACard();const report={at:new Date().toISOString(),cardId:selected?.id||null,cardName:selected?.name||"",cardNumber:selected?.number||"",overall,centering,corners:cornersScore,edges,surface,confidence,range,issues,frontQuality:f.q.score,backQuality:b?.q.score??null,cornerCount:corners.length,cornerMacro:corners};
    state.pregradeHistory=state.pregradeHistory||[];state.pregradeHistory.push(report);state.pregradeHistory=state.pregradeHistory.slice(-20);save();
    renderPregradeReport(report);renderCornerDetail(report);renderPregradeHistory();calculateGradingEconomics();st.textContent="Análisis completado.";
  }catch(e){st.textContent="No se pudo completar el análisis. Usa fotos más rectas, nítidas y sin reflejos.";pushRuntimeError("pregrade",e?.message||e)}
  btn.disabled=false;
}
function renderCornerDetail(r){
  const box=document.querySelector("#cornerDetail");if(!box)return;const rows=r.cornerMacro||[];
  if(!rows.length){box.innerHTML='<h3>Macros de esquinas</h3><p class="muted">Sin macros. Añadir las 4 esquinas aumenta bastante la confianza del pregrado.</p>';return}
  box.innerHTML='<h3>Macros de esquinas</h3>'+rows.map(x=>'<div class="qaRow"><span>'+x.label+'</span><b class="'+(x.score>=88?"ok":x.score>=75?"":"warn")+'">'+x.score+'/100</b></div>').join("")+
    '<small>Se pondera más la peor esquina para evitar que tres esquinas buenas oculten una dañada.</small>';
}
async function imageQuality(file){
  return new Promise((ok,no)=>{let im=new Image(),r=new FileReader();r.onload=()=>im.src=r.result;r.onerror=no;im.onload=()=>{
    let cv=document.createElement("canvas"),s=Math.min(1,320/im.width);cv.width=Math.max(1,Math.round(im.width*s));cv.height=Math.max(1,Math.round(im.height*s));
    let g=cv.getContext("2d");g.drawImage(im,0,0,cv.width,cv.height);let d=g.getImageData(0,0,cv.width,cv.height).data,lum=0,lum2=0,edges=0,n=0,prev=null;
    for(let y=0;y<cv.height;y+=2)for(let x=0;x<cv.width;x+=2){let i=(y*cv.width+x)*4,v=.299*d[i]+.587*d[i+1]+.114*d[i+2];lum+=v;lum2+=v*v;n++;if(prev!=null)edges+=Math.abs(v-prev);prev=v}
    let mean=lum/Math.max(1,n),variance=Math.max(0,lum2/Math.max(1,n)-mean*mean),contrast=Math.sqrt(variance),sharp=edges/Math.max(1,n),score=Math.round(clamp(35+contrast*.7+sharp*.7-(mean<55||mean>225?20:0),0,100));
    ok({score,brightness:mean,contrast,sharpness:sharp,width:im.width,height:im.height});
  };r.readAsDataURL(file)})
}
function showPhotoQuality(q){
  const box=document.querySelector("#photoQuality");if(!box)return;if(!q){box.classList.add("hidden");box.innerHTML="";return}
  let label=q.score>=75?"Buena":q.score>=55?"Aceptable":"Mejorable";
  box.classList.remove("hidden");box.innerHTML="<b>Calidad de foto: "+label+" · "+q.score+"/100</b><span>"+(q.score<55?"Acerca la carta, evita reflejos y mantenla recta.":"Suficiente para intentar reconocimiento automático.")+"</span>";
}
function renderBatchStatus(){
  const box=document.querySelector("#batchStatus");if(!box)return;let withPhoto=state.cards.filter(c=>c.photoKey),pending=withPhoto.filter(c=>c.draft),good=withPhoto.filter(c=>(c.recognition?.quality?.score||0)>=55),codes=withPhoto.filter(c=>c.recognition?.barcode?.cert),issuer=withPhoto.filter(c=>c.recognition?.gradingEvidence==="ocr-label");
  box.innerHTML="<h3>Calidad de entrada</h3><div class=\"qaRow\"><span>Fotos guardadas</span><b>"+withPhoto.length+"</b></div><div class=\"qaRow\"><span>Calidad ≥55</span><b>"+good.length+"</b></div><div class=\"qaRow\"><span>Códigos slab leídos</span><b>"+codes.length+"</b></div><div class=\"qaRow\"><span>Pendientes</span><b class=\""+(pending.length?"warn":"ok")+"\">"+pending.length+"</b></div>";
}
async function blobFingerprint(blob){
  return new Promise((ok,no)=>{let im=new Image(),u=URL.createObjectURL(blob);im.onload=()=>{try{
    let cv=document.createElement("canvas");cv.width=24;cv.height=34;let g=cv.getContext("2d");g.drawImage(im,0,0,24,34);let d=g.getImageData(0,0,24,34).data,arr=[];
    for(let i=0;i<d.length;i+=4)arr.push(Math.round((.299*d[i]+.587*d[i+1]+.114*d[i+2])/16));
    URL.revokeObjectURL(u);ok(arr)
  }catch(e){URL.revokeObjectURL(u);no(e)}};im.onerror=e=>{URL.revokeObjectURL(u);no(e)};im.src=u})
}
function fingerprintScore(a,b){if(!a||!b||a.length!==b.length)return 0;let diff=0;for(let i=0;i<a.length;i++)diff+=Math.abs(a[i]-b[i]);return Math.round(clamp(100-diff/(a.length*15)*100,0,100))}
async function candidateImageBlob(c){
  let u=c.image?c.image+"/low.webp":(c.images?.[0]?.small||c.images?.[0]?.medium||"");if(!u)return null;
  try{let r=await Promise.race([fetch(u,{mode:"cors"}),timeoutAfter(4500)]);if(!r.ok)return null;return await r.blob()}catch{return null}
}
async function visualMatchCandidates(file,candidates){
  if(!candidates?.length)return [];let source;try{source=await imageCropBlob(file,"full",520,.70)}catch{return candidates.map(c=>({c,visual:0}))}
  let sf;try{sf=await blobFingerprint(source)}catch{return candidates.map(c=>({c,visual:0}))}
  const rows=await mapLimit(candidates.slice(0,8),3,async c=>{const b=await candidateImageBlob(c);if(!b)return {c,visual:0};try{return {c,visual:fingerprintScore(sf,await blobFingerprint(b))}}catch{return {c,visual:0}}});
  return rows.filter(Boolean).sort((a,b)=>b.visual-a.visual);
}
function signalToCandidate(x){
  return {id:x.id,name:x.name||"",number:x.number||"",localId:x.number||"",printed_number:x.number||"",set:{name:x.set||"",releaseDate:(x.updated||"").slice(0,10)},expansion:{name:x.set||"",releaseDate:(x.updated||"").slice(0,10)},image:x.image||"",images:x.image?[{small:x.image,medium:x.image,large:x.image}]:[],_lang:"",_universe:x.universe||"pokemon",_currency:x.currency||"EUR",_price:x.price||0};
}
function genericCandidateScore(x,g,tokens){
  let score=0,gn=normNum((g.number||"").split("/")[0]),xn=normNum(x.number||"");
  if(gn&&xn&&gn===xn)score+=70;
  const nameScore=tokenScore((tokens||[]).join(" "),x.name||"");
  const setScore=tokenScore((tokens||[]).join(" "),x.set||"");
  score+=nameScore*24+setScore*6;
  return score;
}
async function analyzeNonPokemonFile(file,universe){
  const [barcode,quality]=await Promise.all([detectSlabCode(file),imageQuality(file).catch(()=>null)]);
  if(!window.Tesseract)throw new Error("OCR no disponible");
  const passes=[["full",900,9000],["bottom",700,7000],["label",700,6500]],texts=[],numbers=[];
  let gBest=null;
  for(const [region,max,ms] of passes){
    try{
      const blob=await imageCropBlob(file,region,max,.76),res=await Promise.race([Tesseract.recognize(blob,"eng"),timeoutAfter(ms)]),text=res?.data?.text||"";
      texts.push(text);numbers.push(...extractNumberCandidates(text));const g=guessFromOCR(text);
      if(!gBest||(!gBest.number&&g.number)||(!gBest.cert&&g.cert))gBest={...(gBest||{}),...g};
    }catch{}
  }
  const merged=texts.join("\n"),tokens=ocrNameTokens(merged),g={...(gBest||guessFromOCR(merged))};
  if(numbers[0])g.number=numbers[0];
  if(barcode?.cert){g.cert=barcode.cert;g.certEvidence="barcode"}else if(g.cert)g.certEvidence="ocr";
  if(!g.issuerDetected){g.grading="RAW";g.gradingEvidence="none"}
  let pool=(await marketSignalAll().catch(()=>[])).filter(x=>marketUniverseOf(x)===universe);
  const ranked=pool.map(x=>({x,score:genericCandidateScore(x,g,tokens)})).filter(r=>r.score>=10).sort((a,b)=>b.score-a.score).slice(0,12);
  const found=ranked.map(r=>signalToCandidate(r.x));
  let visual=[];if(found.length>1)visual=await visualMatchCandidates(file,found);
  if(visual.length)found.sort((a,b)=>(visual.find(v=>v.c.id===b.id)?.visual||0)-(visual.find(v=>v.c.id===a.id)?.visual||0));
  return {g,found,best:found[0]||null,debug:{passes:texts.length,numbers:[...new Set(numbers)],tokens,barcode,quality,visual:visual.map(v=>({id:v.c.id,score:v.visual})),universe}};
}
async function analyzeCardFile(file){
  const [barcode,quality]=await Promise.all([detectSlabCode(file),imageQuality(file).catch(()=>null)]);
  if(!window.Tesseract)throw new Error("OCR no disponible");
  const passes=[["bottom",650,6500],["full",850,8500],["label",700,6500]];
  let texts=[],numbers=[],gBest=null;
  for(const [region,max,ms] of passes){
    try{
      const blob=await imageCropBlob(file,region,max,.74);
      const res=await Promise.race([Tesseract.recognize(blob,"eng"),timeoutAfter(ms)]);
      const text=res?.data?.text||"";texts.push(text);numbers.push(...extractNumberCandidates(text));
      const g=guessFromOCR(text);if(!gBest||(!gBest.number&&g.number)||(!gBest.cert&&g.cert))gBest={...(gBest||{}),...g};
      if(numbers.length&&region==="bottom")break;
    }catch{}
  }
  const mergedText=texts.join("\n"),allNumbers=[...new Set(numbers)];
  let g={...(gBest||guessFromOCR(mergedText))};if(allNumbers[0])g.number=allNumbers[0];if(barcode?.cert){g.cert=barcode.cert;g.certEvidence="barcode";}else if(g.cert){g.certEvidence="ocr";}if(!g.issuerDetected){g.grading="RAW";g.gradingEvidence="none"}
  const tokens=ocrNameTokens(mergedText);
  let found=[];
  for(const n of allNumbers.length?allNumbers:[g.number].filter(Boolean)){
    const x=await Promise.race([findCardMeta({...g,number:n}),timeoutAfter(7000)]).catch(()=>[]);
    found.push(...x);
  }
  const uniq=[];const seen=new Set();for(const c of found){if(c?.id&&!seen.has(c.id)){seen.add(c.id);uniq.push(c)}}
  uniq.sort((a,b)=>candidateTextScore(b,tokens)-candidateTextScore(a,tokens));
  let visual=[];if(uniq.length>1)visual=await visualMatchCandidates(file,uniq);if(visual.length){uniq.sort((a,b)=>(visual.find(v=>v.c.id===b.id)?.visual||0)-(visual.find(v=>v.c.id===a.id)?.visual||0))}const best=uniq[0]||null;
  return {g,found:uniq,best,debug:{passes:texts.length,numbers:allNumbers,tokens,barcode,quality,visual:visual.map(v=>({id:v.c.id,score:v.visual}))}};
}
async function analyzeCollectibleFile(file,universe="pokemon"){return universe==="lorcana"?analyzeNonPokemonFile(file,"lorcana"):analyzeCardFile(file)}

function cardFromRecognition(id,blob,r,universe="pokemon"){
  const g=r.g||{}, exact=(r.found||[]).filter(c=>normNum(c.localId||c.printed_number||c.number)===normNum((g.number||"").split("/")[0]));
  const ranked=(r.found||[]),top=ranked[0],second=ranked[1],topScore=top?candidateTextScore(top,r.debug?.tokens||[]):0,secondScore=second?candidateTextScore(second,r.debug?.tokens||[]):0,visTop=r.debug?.visual?.find(v=>v.id===top?.id)?.score||0,visSecond=r.debug?.visual?.find(v=>v.id===second?.id)?.score||0;const c=exact.length===1?exact[0]:(top&&((topScore>=16&&topScore-secondScore>=8)||(visTop>=72&&visTop-visSecond>=8))?top:null), confident=!!c, img=c?.images?.[0], name=confident?(c.name||"Carta identificada"):"Carta por identificar",grading=g.grading||"RAW",grade=g.grade||"";
  const mv=confident?marketValueFor(name,grading,grade,"",universe):null;
  let result={id,universe,name,set:confident?(c.set?.name||c.expansion?.name||""):"",number:confident?(c.localId||c.printed_number||c.number||g.number||""):(g.number||""),year:confident?String(c.set?.releaseDate||c.expansion?.release_date||c.expansion?.releaseDate||g.year||"").slice(0,4):(g.year||""),language:confident?(c._lang==="es"?"Español":c._lang==="en"?"Inglés":(c.language_code||c.language||g.language||"")):(g.language||""),grading,grade,cert:g.cert||"",value:mv?.value||0,valueEvidence:mv?.count||0,purchase:null,quantity:1,purchaseDate:"",catalogId:confident?(c.id||""):"",referenceImage:img?(img.large||img.medium||img.small||""):"",photoKey:id,photoURL:URL.createObjectURL(blob),icon:"🃏",draft:!confident,recognition:{score:confident?(exact.length===1?100:(visTop>=72?92:88)):0,source:confident?(exact.length===1?"collector-number":visTop>=72?"collector-number+visual":"collector-number+name-tokens"):"pending",passes:r.debug?.passes||0,candidates:(r.found||[]).length,visualScore:visTop||0,barcode:r.debug?.barcode||null,quality:r.debug?.quality||null,gradingEvidence:g.gradingEvidence||"none",certEvidence:g.certEvidence||"",issuerDetected:g.issuerDetected||"",at:new Date().toISOString()},createdAt:new Date().toISOString()};if(confident&&universe==="pokemon")applyCatalogPricing(result,c);else if(confident&&c._price){result.value=+c._price||0;result.marketPricing={value:+c._price||0,source:"Lorcast",currency:c._currency||"USD"};}return result
}
async function recognizeSavedCard(card,file){
  try{
    const universe=cardUniverse(card),r=await analyzeCollectibleFile(file,universe),fresh=cardFromRecognition(card.id,file,r,universe);
    if(!fresh.draft){
      const keep={purchase:card.purchase,quantity:card.quantity||1,purchaseDate:card.purchaseDate||"",notes:card.notes||"",photoKey:card.photoKey,photoURL:card.photoURL,identityVerifiedAt:card.identityVerifiedAt||null,identityVerifiedBy:card.identityVerifiedBy||null};
      Object.assign(card,fresh,keep);save();render();return true;
    }
    card.number=r.g?.number||card.number||"";card.recognition=fresh.recognition;save();render();return false;
  }catch{
    card.recognition={score:0,source:"timeout-or-error",at:new Date().toISOString()};save();render();return false;
  }
}

function applyCandidate(c,g={}){
  if(!c)return;
  form.elements.name.value=c.name||g.name||"";form.dataset.catalogId=c.id||"";
  form.elements.number.value=c.number||g.number||"";
  form.elements.year.value=(c.set?.releaseDate||c.expansion?.release_date||c.expansion?.releaseDate||g.year||"").toString().slice(0,4);
  form.elements.set.value=c.set?.name||c.expansion?.name||"";
  form.elements.language.value=c._lang==="es"?"Español":c._lang==="en"?"Inglés":(c.language_code||c.language||g.language||"");
  if(g.grading&&g.grading!=="RAW"&&g.gradingEvidence==="ocr-label")form.elements.grading.value=g.grading;
  if(g.grade)form.elements.grade.value=g.grade;
  if(g.cert)form.elements.cert.value=g.cert;
  const img=(c.images||[])[0]; if(img) form.dataset.referenceImage=img.large||img.medium||img.small||""; else if(c.image) form.dataset.referenceImage=c._universe&&c._universe!=="pokemon"?c.image:c.image+"/high.webp";const u=form.elements.universe?.value||"pokemon",rp=u==="pokemon"?extractRawPricing(c):(c._price?{value:+c._price,source:"Lorcast",currency:c._currency||"USD"}:null);if(form.elements.grading.value==="RAW"&&rp){form.elements.value.value=rp.value;form.dataset.marketPricing=JSON.stringify(rp);showMarketHint({marketPricing:rp})}else{delete form.dataset.marketPricing;showMarketHint(null)}
}
async function scanCardFile(file){
  const st=document.querySelector("#scanStatus"),box=document.querySelector("#autoMatch");
  st.textContent="Leyendo número de colección, grado y certificado…";box.classList.add("hidden");box.innerHTML="";
  try{
    const universe=form.elements.universe?.value||"pokemon",r=await analyzeCollectibleFile(file,universe),g=r.g,exact=r.found.filter(c=>normNum(c.localId||c.printed_number||c.number)===normNum((g.number||"").split("/")[0]));
    if(form.elements.grading&&g.grading&&g.grading!=="RAW"&&g.gradingEvidence==="ocr-label")form.elements.grading.value=g.grading;
    for(const k of ["number","year","language","cert"])if(g[k]&&form.elements[k])form.elements[k].value=g[k];if(g.grade&&g.gradingEvidence==="ocr-label"&&form.elements.grade)form.elements.grade.value=g.grade;
    if(exact.length===1){
      applyCandidate(exact[0],g);form.dataset.recognitionScore=100;delete form.dataset.truthVerified;document.querySelector("#confirmIdentity").classList.remove("hidden");document.querySelector("#confirmIdentity").textContent="✓ Confirmar que esta identidad es correcta";
      st.textContent="✅ Coincidencia automática por número "+g.number+". Confírmala si la imagen es correcta.";return;
    }
    const choices=exact.length?exact:r.found;
    if(choices.length){
      st.textContent=(g.number?"Número leído: "+g.number+". ":"")+"Elige la imagen correcta:";
      box.innerHTML=choices.slice(0,8).map((c,i)=>{let im=c.images?.[0]?.small||c.images?.[0]?.medium||"";return '<button type="button" class="candidateCard" data-match="'+i+'">'+(im?'<img src="'+im+'" alt="">':'')+'<span><b>'+(c.name||"Carta")+'</b><small>'+(c.printed_number||c.number||"")+' · '+(c.expansion?.name||"")+'</small></span></button>'}).join("");
      box.classList.remove("hidden");
      box.querySelectorAll("[data-match]").forEach(b=>b.onclick=()=>{applyCandidate(choices[+b.dataset.match],g);form.dataset.recognitionScore=exact.length?95:80;form.dataset.truthVerified="1";document.querySelector("#confirmIdentity").classList.remove("hidden");document.querySelector("#confirmIdentity").textContent="✓ Identidad confirmada";box.classList.add("hidden");st.textContent="✅ Carta seleccionada por ti. Pulsa «Guardar carta»."});
      return;
    }
    form.elements.name.value="";
    st.textContent=g.number?"⚠️ He leído "+g.number+", pero no encontré una coincidencia en el catálogo.":"⚠️ No he podido leer el número de colección. Usa una foto más cercana y recta del frontal.";
  }catch(e){st.textContent="⚠️ El reconocimiento no ha podido completarse. Prueba otra foto frontal."}
}

const dlg=document.querySelector("#cardDialog"),form=document.querySelector("#cardForm"),del=document.querySelector("#deleteCard");form.elements.universe.onchange=()=>{delete form.dataset.catalogId;delete form.dataset.referenceImage;delete form.dataset.marketPricing;delete form.dataset.truthVerified;document.querySelector("#autoMatch").classList.add("hidden");document.querySelector("#confirmIdentity").classList.add("hidden");showMarketHint(null);document.querySelector("#scanStatus").textContent="Universo cambiado. Selecciona o vuelve a analizar la foto."};document.querySelector("#cardPhoto").onchange=async e=>{let f=e.target.files?.[0];if(f){showPhotoQuality(await imageQuality(f).catch(()=>null));document.querySelector("#scanStatus").textContent="Analizando foto…";await scanCardFile(f)}};document.querySelector("#cardCamera").onchange=async e=>{let f=e.target.files?.[0];if(f){try{let dt=new DataTransfer();dt.items.add(f);document.querySelector("#cardPhoto").files=dt.files}catch{}showPhotoQuality(await imageQuality(f).catch(()=>null));document.querySelector("#scanStatus").textContent="Analizando foto…";await scanCardFile(f)}};document.querySelector("#addCard").onclick=()=>{editId=null;form.reset();form.elements.universe.value=document.querySelector("#collectionUniverse")?.value||"pokemon";delete form.dataset.referenceImage;delete form.dataset.marketPricing;delete form.dataset.catalogId;delete form.dataset.recognitionScore;delete form.dataset.truthVerified;showMarketHint(null);document.querySelector("#scanStatus").textContent="Elige una foto de tu galería o haz una nueva.";document.querySelector("#autoMatch").classList.add("hidden");showPhotoQuality(null);document.querySelector("#retryRecognition").classList.add("hidden");document.querySelector("#confirmIdentity").classList.add("hidden");del.classList.add("hidden");dlg.showModal()};window.editCard=id=>{let x=state.cards.find(c=>c.id===id);if(!x)return;editId=id;form.dataset.referenceImage=x.referenceImage||"";form.dataset.catalogId=x.catalogId||"";if(x.identityVerifiedAt)form.dataset.truthVerified="1";else delete form.dataset.truthVerified;let ci=document.querySelector("#confirmIdentity");if(x.catalogId){ci.classList.remove("hidden");ci.textContent=x.identityVerifiedAt?"✓ Identidad confirmada":"✓ Confirmar que esta identidad es correcta"}else ci.classList.add("hidden");document.querySelector("#scanStatus").textContent="Puedes cambiar la foto para volver a identificarla.";for(const k of ["universe","name","number","year","set","grading","grade","language","cert","value","purchase","quantity","purchaseDate","purpose","notes","popGrade","popHigher","popTotal","popSource","popUrl","popCheckedAt"])if(form.elements[k])form.elements[k].value=x[k]??"";if((x.grading||"RAW")!=="RAW"){let gv=marketValueFor(x.name,x.grading,x.grade);if(gv){form.elements.value.value=gv.value;let mb=document.querySelector("#marketHint");mb.innerHTML="<b>Valoración "+x.grading+" "+(x.grade||"")+"</b><span>"+euro(gv.value)+" · "+gv.count+" ventas cerradas · confianza "+gv.confidence+"</span>";mb.classList.remove("hidden")}else showMarketHint(null)}else showMarketHint(x);showPhotoQuality(x.recognition?.quality||null);if(x.photoKey)document.querySelector("#retryRecognition").classList.remove("hidden");else document.querySelector("#retryRecognition").classList.add("hidden");del.classList.remove("hidden");dlg.showModal()};document.querySelector("#retryRecognition").onclick=async()=>{if(!editId)return;let c=state.cards.find(x=>x.id===editId);if(!c?.photoKey)return;let b=await photoGet(c.photoKey);if(!b)return;let st=document.querySelector("#scanStatus"),btn=document.querySelector("#retryRecognition");btn.disabled=true;st.textContent="Reanalizando foto con varios recortes…";let ok=await recognizeSavedCard(c,b);btn.disabled=false;if(ok){st.textContent="✅ Identificación completada.";for(const k of ["name","number","year","set","grading","grade","language","cert","value"])if(form.elements[k])form.elements[k].value=c[k]??"";showMarketHint(c)}else st.textContent="No hay coincidencia suficientemente segura todavía."};
document.querySelector("#confirmIdentity").onclick=()=>{
  if(!form.dataset.catalogId){document.querySelector("#scanStatus").textContent="Primero identifica o selecciona una carta del catálogo.";return}
  form.dataset.truthVerified="1";
  const b=document.querySelector("#confirmIdentity");b.textContent="✓ Identidad confirmada";
  document.querySelector("#scanStatus").textContent="Identidad marcada como correcta. Guarda la carta para usarla como referencia de validación.";
};
document.querySelector("#saveCard").onclick=async e=>{e.preventDefault();let f=new FormData(form),file=f.get("photo"),cameraFile=document.querySelector("#cardCamera")?.files?.[0],id=editId||crypto.randomUUID(),old=state.cards.find(x=>x.id===id)||{};if((!file||!file.size)&&cameraFile)file=cameraFile;if(!editId&&(!file||!file.size)){document.querySelector("#scanStatus").textContent="Selecciona una foto primero.";return}let x={...old,id,universe:f.get("universe")||old.universe||"pokemon",name:f.get("name")||old.name||"Carta por identificar",set:f.get("set")||old.set||"",grading:f.get("grading")||old.grading||"RAW",grade:f.get("grade")||old.grade||"",number:f.get("number")||old.number||"",year:f.get("year")||old.year||"",language:f.get("language")||old.language||"",value:+f.get("value")||old.value||0,cert:f.get("cert")||old.cert||"",purchase:f.get("purchase")===""?(old.purchase??null):+f.get("purchase"),quantity:Math.max(1,+f.get("quantity")||old.quantity||1),purchaseDate:f.get("purchaseDate")||old.purchaseDate||"",purpose:f.get("purpose")||old.purpose||"collection",notes:f.get("notes")||old.notes||"",popGrade:f.get("popGrade")===""?(old.popGrade??null):+f.get("popGrade"),popHigher:f.get("popHigher")===""?(old.popHigher??null):+f.get("popHigher"),popTotal:f.get("popTotal")===""?(old.popTotal??null):+f.get("popTotal"),popSource:f.get("popSource")||old.popSource||"",popUrl:f.get("popUrl")||old.popUrl||"",popCheckedAt:f.get("popCheckedAt")||old.popCheckedAt||"",catalogId:form.dataset.catalogId||old.catalogId||"",referenceImage:form.dataset.referenceImage||old.referenceImage||"",marketPricing:form.dataset.marketPricing?JSON.parse(form.dataset.marketPricing):old.marketPricing||null,draft:form.dataset.catalogId?false:(old.draft??true),identityVerifiedAt:form.dataset.truthVerified==="1"?(old.identityVerifiedAt||new Date().toISOString()):(old.identityVerifiedAt||null),identityVerifiedBy:form.dataset.truthVerified==="1"?"user":(old.identityVerifiedBy||null),icon:old.icon||"🃏"};if(x.identityVerifiedAt){x.recognition={...(old.recognition||{}),score:100,source:"user-confirmed-catalog",at:new Date().toISOString()}}let savedBlob=null;if(file&&file.size){savedBlob=await resizeBlob(file);x.photoKey=id;delete x.photo;delete x.photoURL;await photoPut(id,savedBlob);x.photoURL=URL.createObjectURL(savedBlob)}if(editId)state.cards=state.cards.map(c=>c.id===id?x:c);else state.cards.push(x);save();render();renderPSAPriorityQueue();form.reset();editId=null;dlg.close();storageStatus();if(savedBlob){let st=document.querySelector("#repairStatus");st.classList.remove("hidden");st.textContent="Foto guardada. La identificación seguirá sin bloquear la app.";enqueueRecognition(x,savedBlob)}};del.onclick=async()=>{if(!editId||!confirm("¿Eliminar esta carta del portfolio?"))return;state.cards=state.cards.filter(x=>x.id!==editId);await photoDel(editId);save();editId=null;dlg.close();render()};function resizeBlob(file){return new Promise(ok=>{let im=new Image(),rd=new FileReader();rd.onload=()=>im.src=rd.result;im.onload=()=>{let max=1200,s=Math.min(1,max/im.width),cv=document.createElement("canvas");cv.width=im.width*s;cv.height=im.height*s;cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);cv.toBlob(ok,"image/jpeg",.82)};rd.readAsDataURL(file)})}
function resize(file){return new Promise(ok=>{let im=new Image(),rd=new FileReader();rd.onload=()=>im.src=rd.result;im.onload=()=>{let max=900,s=Math.min(1,max/im.width),cv=document.createElement("canvas");cv.width=im.width*s;cv.height=im.height*s;cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);ok(cv.toDataURL("image/jpeg",.78))};rd.readAsDataURL(file)})}
function blobToDataURL(blob){return new Promise((ok,no)=>{let r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(blob)})}function dataURLToBlob(s){let [h,d]=s.split(","),mime=(h.match(/:(.*?);/)||[])[1]||"image/jpeg",bin=atob(d),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}function renderRecognitionStats(){
  const box=document.querySelector("#recognitionStats");if(!box)return;
  const withPhoto=state.cards.filter(c=>c.photoKey),done=withPhoto.filter(c=>!c.draft&&c.recognition?.score>0),pending=withPhoto.filter(c=>c.draft),confirmed=withPhoto.filter(c=>c.catalogId&&c.identityVerifiedAt&&c.identityVerifiedBy==="user").length,rate=withPhoto.length?done.length/withPhoto.length*100:0;
  const exact=done.filter(c=>c.recognition?.source==="collector-number").length,visual=done.filter(c=>c.recognition?.source==="collector-number+visual").length,assisted=done.filter(c=>c.recognition?.source==="collector-number+name-tokens").length;
  box.innerHTML='<h3>Reconocimiento de fotos</h3><div class="qaRow"><span>Fotos procesables</span><b>'+withPhoto.length+'</b></div><div class="qaRow"><span>Referencias confirmadas</span><b class="'+(confirmed>=3?"ok":"warn")+'">'+confirmed+'</b></div><div class="qaRow"><span>Identificadas</span><b class="'+(done.length?"ok":"warn")+'">'+done.length+' · '+rate.toFixed(0)+'%</b></div><div class="qaRow"><span>Coincidencia exacta</span><b>'+exact+'</b></div><div class="qaRow"><span>Número + imagen</span><b>'+visual+'</b></div><div class="qaRow"><span>Número + texto</span><b>'+assisted+'</b></div><div class="qaRow"><span>Pendientes</span><b class="'+(pending.length?"warn":"ok")+'">'+pending.length+'</b></div>';
}
async function testMarketStoreRoundtrip(){
  const id="__cardvault_market_test__";
  try{
    await marketSignalPutMany([{id,name:"test",score:1,price:1}]);
    const all=await marketSignalAll();
    const ok=all.some(x=>x.id===id);
    let t=db.transaction("marketSignals","readwrite"),r=t.objectStore("marketSignals").delete(id);
    await new Promise((yes,no)=>{r.onsuccess=()=>yes();r.onerror=()=>no(r.error)});
    return ok;
  }catch{return false}
}
async function testIndexedDBRoundtrip(){
  const id="__cardvault_test__";try{const blob=new Blob(["ok"],{type:"text/plain"});await photoPut(id,blob);const got=await photoGet(id);await photoDel(id);return !!got&&got.size===2}catch{return false}
}
async function testCatalogConnectivity(){
  try{const list=await Promise.race([tcgdexList("en"),timeoutAfter(9000)]);return Array.isArray(list)&&list.length>100}catch{return false}
}
async function testLorcanaConnectivity(){
  try{const sets=await Promise.race([lorcastSets(),timeoutAfter(9000)]);return Array.isArray(sets)&&sets.length>0}catch{return false}
}
async function testPregradePipeline(){
  try{
    const cv=document.createElement("canvas");cv.width=420;cv.height=590;const g=cv.getContext("2d");
    g.fillStyle="#d8d8d8";g.fillRect(0,0,420,590);g.fillStyle="#fff";g.fillRect(20,20,380,550);g.fillStyle="#333";g.fillRect(38,38,344,514);
    const blob=await new Promise(ok=>cv.toBlob(ok,"image/jpeg",.9));
    if(!blob)return false;const a=await analyzePregradeSide(blob,"front");
    return !!a&&["centering","corners","edges","surface","score"].every(k=>Number.isFinite(a[k]));
  }catch{return false}
}

async function testImagePipeline(){
  try{
    const cv=document.createElement("canvas");cv.width=120;cv.height=180;const g=cv.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,120,180);g.fillStyle="#000";g.font="16px sans-serif";g.fillText("149/131",20,155);
    const blob=await new Promise(ok=>cv.toBlob(ok,"image/jpeg",.8));const q=await imageQuality(blob);const fp=await imageFingerprint(blob);return !!blob&&q.score>=0&&!!fp
  }catch{return false}
}
function testLocalState(){try{const s=JSON.stringify(state);JSON.parse(s);localStorage.setItem("__cv_test__","1");const ok=localStorage.getItem("__cv_test__")==="1";localStorage.removeItem("__cv_test__");return ok}catch{return false}}
function renderSelfTest(){
  const box=document.querySelector("#selfTestResults");if(!box)return;const t=state.selfTest||{},rows=t.results||[];
  if(!rows.length){box.innerHTML='<p class="muted">Comprueba almacenamiento, catálogos, OCR, imagen, pregrado y backup.</p>';return}
  const failed=rows.filter(r=>!r.ok);
  box.innerHTML='<div class="selfTestHeader"><b>'+((t.pass||0))+'/'+rows.length+' pruebas superadas</b><span>'+new Date(t.at).toLocaleString("es-ES")+'</span></div>'+
    rows.map(r=>'<div class="qaRow"><span>'+r.label+'</span><b class="'+(r.ok?"ok":"warn")+'">'+(r.ok?"OK":"FALLO")+'</b></div>').join("")+
    (failed.length?'<div class="integrityIssues"><b>Faltan:</b>'+failed.map(r=>'<div>• '+r.label+(r.detail?' · '+r.detail:'')+'</div>').join("")+'</div>':'<div class="certDone">✅ Autotest 11/11.</div>');
}
async function runSelfTest(){
  const btn=document.querySelector("#runSelfTest"),box=document.querySelector("#selfTestResults");btn.disabled=true;box.innerHTML='<p class="muted">Ejecutando 10 pruebas independientes…</p>';
  const results=[];
  const one=async(label,fn)=>{try{const ok=await fn();results.push({label,ok:!!ok})}catch(e){results.push({label,ok:false,detail:String(e?.message||e||"error").slice(0,100)})}};
  await one("JavaScript cargado",async()=>true);
  await one("Estado local",async()=>testLocalState());
  await one("IndexedDB fotos",testIndexedDBRoundtrip);
  await one("IndexedDB radar",testMarketStoreRoundtrip);await one("IndexedDB catálogo",async()=>{await catalogPutMany([{id:"__catalog_test__",universe:"pokemon",name:"test"}]);const all=await catalogAll();const ok=all.some(x=>x.id==="__catalog_test__");let t=db.transaction("catalog","readwrite"),rr=t.objectStore("catalog").delete("__catalog_test__");await new Promise((y,n)=>{rr.onsuccess=()=>y();rr.onerror=()=>n(rr.error)});return ok});
  await one("Catálogo TCGdex",testCatalogConnectivity);
  await one("Catálogo Lorcast",testLorcanaConnectivity);
  await one("Motor OCR cargado",async()=>!!window.Tesseract);
  await one("Procesamiento de imagen",testImagePipeline);
  await one("Pregrado PSA sintético",testPregradePipeline);
  await one("Backup serializable",async()=>{JSON.stringify({format:"cardvault-backup",version:3,state});return true});
  state.selfTest={at:new Date().toISOString(),results,pass:results.filter(r=>r.ok).length};
  if(state.selfTest.pass===11){
    const bootAt=new Date(state.bootInfo?.at||0).getTime();
    state.runtimeErrors=(state.runtimeErrors||[]).filter(x=>new Date(x.at).getTime()<bootAt);
  }
  save();renderSelfTest();renderIntegrity();renderProductCompletion();renderQA();renderReadiness();btn.disabled=false;return state.selfTest;
}
function valuationAuditData(){
  const nonEur=state.market.filter(m=>m.kind==="sold"&&(m.currency||"EUR").toUpperCase()!=="EUR").length;
  const undated=state.market.filter(m=>m.kind==="sold"&&!m.soldDate&&!m.at).length;
  const graded=state.cards.filter(c=>(c.grading||"RAW")!=="RAW");
  const valued=graded.filter(c=>marketValueFor(c.name,c.grading,c.grade,c.set||"",cardUniverse(c)));
  const weak=graded.filter(c=>{let v=marketValueFor(c.name,c.grading,c.grade,c.set||"",cardUniverse(c));return v&&v.confidence==="Baja"}).length;
  return {nonEur,undated,graded:graded.length,valued:valued.length,weak};
}
function marketEvidenceQuality(){
  const rows=state.market||[],sold=rows.filter(x=>x.kind==="sold"),listing=rows.filter(x=>x.kind==="listing");
  const withUrl=sold.filter(x=>x.url).length,dated=sold.filter(x=>x.soldDate||x.at).length,eur=sold.filter(x=>(x.currency||"EUR").toUpperCase()==="EUR").length;
  const recent=sold.filter(x=>ageDays(x.soldDate||x.at)<=90).length;
  const verified=sold.filter(x=>x.url&&x.source&&x.price>0).length;
  const score=sold.length?Math.round(clamp((withUrl/sold.length)*25+(dated/sold.length)*20+(eur/sold.length)*15+(recent/sold.length)*20+(verified/sold.length)*20,0,100)):0;
  return {sold:sold.length,listing:listing.length,withUrl,dated,eur,recent,verified,score};
}
function renderMarketEvidence(){
  const box=document.querySelector("#marketEvidencePanel");if(!box)return;const q=marketEvidenceQuality();
  box.innerHTML='<h3>Calidad de evidencia de mercado</h3><div class="evidenceScore">'+q.score+'/100</div>'+
    '<div class="qaRow"><span>Ventas cerradas</span><b>'+q.sold+'</b></div>'+
    '<div class="qaRow"><span>Con URL de evidencia</span><b>'+q.withUrl+'</b></div>'+
    '<div class="qaRow"><span>Con fecha</span><b>'+q.dated+'</b></div>'+
    '<div class="qaRow"><span>EUR utilizables</span><b>'+q.eur+'</b></div>'+
    '<div class="qaRow"><span>≤90 días</span><b>'+q.recent+'</b></div>'+
    '<small>Las observaciones sin URL, fecha o moneda compatible se conservan, pero pesan menos en la confianza y algunas quedan fuera de la valoración.</small>';
}
function dataQualityScore(){
  const r=readinessScore(),m=marketEvidenceQuality(),photos=state.photoValidation||{},self=state.selfTest||{};
  const parts=[
    {k:"preparacion",v:r.score,w:.35},
    {k:"mercado",v:m.score,w:.25},
    {k:"fotos",v:(photos.labeledTested||0)>=3?Math.round((photos.accuracy||0)*100):0,w:.20},
    {k:"autotest",v:Math.round(((self.pass||0)/11)*100),w:.20}
  ];
  return {score:Math.round(parts.reduce((s,x)=>s+x.v*x.w,0)),parts};
}
function renderValuationAudit(){
  const box=document.querySelector("#valuationAudit");if(!box)return;const a=valuationAuditData();
  box.innerHTML='<h3>Auditoría de valoración</h3><div class="qaRow"><span>Graduadas con valoración comparable</span><b>'+a.valued+'/'+a.graded+'</b></div><div class="qaRow"><span>Ventas no EUR excluidas</span><b class="'+(a.nonEur?"warn":"ok")+'">'+a.nonEur+'</b></div><div class="qaRow"><span>Valoraciones de confianza baja</span><b class="'+(a.weak?"warn":"ok")+'">'+a.weak+'</b></div><small>Las ventas en otras monedas se conservan como evidencia, pero ya no se mezclan con EUR hasta disponer de conversión de divisa fiable.</small>';
}function renderExcellenceBenchmark(){
  const box=document.querySelector("#excellenceBenchmark");if(!box)return;
  const rows=[
    ["Escaneo foto + identificación","Sí","Collectr/LUDEX también lo ofrecen"],
    ["Variante Lorcana normal/foil exacta","Sí","Separada desde V63"],
    ["Portfolio + coste + P/L","Sí","Comparable a trackers líderes"],["Rotación vender→reinvertir","Sí","Prioriza crecimiento de una colección pequeña"],
    ["Catálogo Pokémon + Lorcana","Sí","Más de 27k fichas locales según última indexación"],
    ["Filtros de compra por precio/margen","Sí","Ventaja específica de Card Vault"],
    ["Top 10 + RAW/PSA10 + enlaces","Sí","Cardmarket RAW y búsqueda exacta PSA10 V67"],
    ["Pregrado PSA + economía RAW→PSA","Sí","Compara PSA 9/10 neto sin asumir una nota"],
    ["Histórico largo de ventas verificadas","Parcial","Líderes comerciales disponen de años de datos; aquí depende de fuentes/histórico acumulado"],
    ["Venta/listado directo marketplace","No","No implementado: no es necesario para el objetivo actual"]
  ];
  const strong=rows.filter(r=>r[1]==="Sí").length;
  box.innerHTML='<h3>Benchmark mundial de producto</h3><div class="qaRow"><span>Capacidades fuertes</span><b class="ok">'+strong+'/'+rows.length+'</b></div>'+rows.map(r=>'<div class="benchRow"><b>'+r[0]+'</b><span class="'+(r[1]==="Sí"?"ok":r[1]==="Parcial"?"warn":"")+'">'+r[1]+'</span><small>'+r[2]+'</small></div>').join("")+'<small>Comparación funcional, no ranking comercial. La mayor brecha pendiente es disponer de histórico externo profundo de ventas verificadas sin añadir costes.</small>';
}
function renderQA(){
  const box=document.querySelector("#qaPanel");if(!box)return;
  const pending=state.cards.filter(c=>c.draft).length,photos=state.cards.filter(c=>c.photoKey).length,scan=(state.marketScan||[]).length,gradedSales=state.market.filter(m=>m.kind==="sold"&&(m.grading||"RAW")!=="RAW").length,popVerified=state.cards.filter(c=>c.popGrade!=null&&c.popSource&&c.popUrl&&c.popCheckedAt).length,activeAlerts=evaluateOpportunityAlerts(state.marketScan||[]).length,signalPoints=(state.signalHistory||[]).length,last=state.marketScanAt?new Date(state.marketScanAt).toLocaleString("es-ES"):"Nunca",scanAge=state.marketScanAt?ageDays(state.marketScanAt):9999;
  const catalogP=state.catalogMeta?.pokemon?.count||0,catalogL=state.catalogMeta?.lorcana?.count||0;const unsafeSlab=state.cards.filter(c=>c.recognition?.barcode?.cert&&(c.grading||"RAW")!=="RAW"&&c.recognition?.gradingEvidence!=="ocr-label"&&c.identityVerifiedBy!=="user").length;const checks=[["Build","V70","ok"],["Catálogo Pokémon",catalogP.toLocaleString("es-ES")+" cartas",catalogP>1000?"ok":"warn"],["Catálogo Lorcana",catalogL.toLocaleString("es-ES")+" cartas",catalogL>1000?"ok":"warn"],["Slab sin emisor verificado",String(unsafeSlab),unsafeSlab?"warn":"ok"],["Colección",state.cards.length+" fichas","ok"],["Fotos locales",photos+" guardadas",photos?"ok":"warn"],["Pendientes OCR",String(pending),pending?"warn":"ok"],["Market Lab",scan+" analizadas",scan?"ok":"warn"],["Pokémon recorridas",((state.coverageByUniverse?.pokemon||state.marketCoverage||{}).seen||0)+" cartas",((state.coverageByUniverse?.pokemon||state.marketCoverage||{}).seen||0)>=120?"ok":"warn"],["Lorcana cobertura",((state.coverageByUniverse?.lorcana||{}).seen||0)+"/"+((state.coverageByUniverse?.lorcana||{}).total||0)+" sets",((state.coverageByUniverse?.lorcana||{}).total||0)>0&&((state.coverageByUniverse?.lorcana||{}).seen||0)>=((state.coverageByUniverse?.lorcana||{}).total||0)?"ok":"warn"],["Radar Pokémon",((state.coverageByUniverse?.pokemon||state.marketCoverage||{}).active||0)+" activas",((state.coverageByUniverse?.pokemon||state.marketCoverage||{}).active||0)>=40?"ok":"warn"],["Radar Lorcana",((state.coverageByUniverse?.lorcana||{}).active||0)+" activas",((state.coverageByUniverse?.lorcana||{}).active||0)>=20?"ok":"warn"],["Ventas graduadas",gradedSales+" comps",gradedSales>=4?"ok":"warn"],["Población verificada",popVerified+" fichas",popVerified?"ok":"warn"],["Alertas activas",activeAlerts,activeAlerts?"ok":"warn"],["Histórico señales",signalPoints+" puntos",signalPoints>=20?"ok":"warn"],["Aplicación",productCompletionScore().score+"%",productCompletionScore().score===100?"ok":"warn"],["Evidencia real",readinessScore().score+"%",readinessScore().score===100?"ok":"warn"],["Calidad global",dataQualityScore().score+"%",dataQualityScore().score>=80?"ok":"warn"],["Autotest",(state.selfTest?.pass||0)+"/11",(state.selfTest?.pass||0)>=11?"ok":"warn"],["Prueba fotos",(state.photoValidation?.labeledTested||0)?Math.round((state.photoValidation.accuracy||0)*100)+"%":"Sin muestra",(state.photoValidation?.labeledTested||0)>=3&&(state.photoValidation?.accuracy||0)>=.7?"ok":"warn"],["Modo",state.marketScanMode==="wide"?"Amplio":"Rápido",state.marketScanMode==="wide"?"ok":"warn"],["Último escaneo",last,scan?"ok":"warn"],["Frescura mercado",scanAge<=1?"Hoy":scanAge<=7?"< 7 días":"Antiguo",scanAge<=7?"ok":"warn"]];
  box.innerHTML="<h3>Diagnóstico Card Vault</h3>"+checks.map(c=>"<div class=\"qaRow\"><span>"+c[0]+"</span><b class=\""+c[2]+"\">"+c[1]+"</b></div>").join("");renderBootStatus();renderProductCompletion();renderExcellenceBenchmark();renderRecognitionStats();renderBatchStatus();renderReadiness();renderSelfTest();renderPhotoValidation();renderCertification();renderIntegrity();renderValuationAudit();renderMarketEvidence();
}
async function storageStatus(){let label="Almacenamiento disponible";if(navigator.storage?.estimate){let e=await navigator.storage.estimate(),u=e.usage||0,q=e.quota||0,p=q?u/q*100:0;label=(u/1048576).toFixed(1)+" MB usados"+(q?" de "+(q/1048576).toFixed(0)+" MB · "+p.toFixed(1)+"%":"");document.querySelector("#storageText").textContent=label}renderQA();let persisted=false;try{persisted=await navigator.storage?.persisted?.()}catch{}let r=document.querySelector("#readyText");if(r)r.textContent="Fotos y radar guardados localmente · copia V3 completa · "+(persisted?"almacenamiento persistente concedido":"haz copias periódicas en Archivos/iCloud")}document.querySelector("#export").onclick=async()=>{let photos={};for(const x of state.cards){if(x.photoKey){let b=await photoGet(x.photoKey);if(b)photos[x.photoKey]=await blobToDataURL(b)}}let marketSignals=await marketSignalAll().catch(()=>[]),clean=JSON.parse(JSON.stringify(state,(k,v)=>k==="photoURL"?undefined:v)),pack={format:"cardvault-backup",version:3,createdAt:new Date().toISOString(),state:clean,photos,marketSignals},blob=new Blob([JSON.stringify(pack)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="card-vault-completo-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
document.querySelector("#import").onchange=async e=>{try{let x=JSON.parse(await e.target.files[0].text()),s=x.format==="cardvault-backup"?x.state:x;if(!s.cards)throw 0;if(x.photos)for(const [id,data] of Object.entries(x.photos))await photoPut(id,dataURLToBlob(data));if(x.marketSignals){await marketSignalClear();await marketSignalPutMany(x.marketSignals)}state=ensureStateShape(s);await refreshMarketFreshness();normalizePendingCards();save();await hydratePhotos();await hydrateMarketFromStorage();ensureCompleteCatalog().catch(e=>pushRuntimeError("catalog-auto",e?.message||e));try{autoMarketCoverage()}catch{}storageStatus();renderCoverage();renderBootStatus();setTimeout(async()=>{let todo=state.cards.filter(c=>c.draft&&c.photoKey).slice(0,3);for(const c of todo){let b=await photoGet(c.photoKey);if(b)enqueueRecognition(c,b)}},700);alert("Copia completa restaurada")}catch(err){alert("Copia no válida o incompleta")}};

function normalizePendingCards(){
  let changed=false;
  for(const c of state.cards){
    if(c.draft){
      const bad=!c.name||c.name==="Carta por identificar"||c.recognition?.source!=="catalog+ocr";
      if(bad&&c.name!=="Carta por identificar"){c.recognition={...(c.recognition||{}),legacyName:c.name};c.name="Carta por identificar";changed=true}
    }
  }
  if(changed)save();
}
async function reanalyzePending(){
  const btn=document.querySelector("#reanalyzePending"),st=document.querySelector("#repairStatus"),pending=state.cards.filter(c=>c.draft&&c.photoKey);
  if(!pending.length){st.textContent="No hay cartas pendientes con foto para reanalizar.";st.classList.remove("hidden");return}
  btn.disabled=true;st.classList.remove("hidden");let ok=0,fail=0;
  for(let i=0;i<pending.length;i++){
    const c=pending[i];st.textContent="Reanalizando "+(i+1)+"/"+pending.length+"…";
    try{
      const blob=await photoGet(c.photoKey);if(!blob){fail++;continue}
      const r=await analyzeCardFile(blob),fresh=cardFromRecognition(c.id,blob,r);
      if(!fresh.draft){
        const keep={purchase:c.purchase,quantity:c.quantity||1,purchaseDate:c.purchaseDate||"",notes:c.notes||"",photoKey:c.photoKey,photoURL:c.photoURL||fresh.photoURL};
        Object.assign(c,fresh,keep);ok++;
      }else{
        c.name="Carta por identificar";c.number=r.g?.number||c.number||"";c.recognition=fresh.recognition;fail++;
      }
    }catch{c.name="Carta por identificar";fail++}
    save();render();
  }
  btn.disabled=false;st.textContent=ok+" identificadas · "+fail+" siguen pendientes.";storageStatus();
}
normalizePendingCards();
document.querySelector("#reanalyzePending").onclick=reanalyzePending;
document.querySelector("#clearTests").onclick=async()=>{let bad=state.cards.filter(c=>c.draft);if(!bad.length){alert("No hay pruebas pendientes que limpiar.");return}if(!confirm("Esto borrará solo las cartas pendientes/de prueba. ¿Continuar?"))return;for(const c of bad){if(c.photoKey)await photoDel(c.photoKey)}state.cards=state.cards.filter(c=>!c.draft);save();render();storageStatus();alert("Pruebas pendientes eliminadas.")};

document.querySelector("#runSelfTest").onclick=runSelfTest;renderSelfTest();document.querySelector("#runPhotoValidation").onclick=runPhotoValidation;renderPhotoValidation();document.querySelector("#finalizeApp").onclick=finalizeApplication;document.querySelector("#runCertification").onclick=runCertification;renderCertification();document.querySelector("#advanceCompletion").onclick=advanceAutomaticCompletion;document.querySelector("#repairIntegrity").onclick=()=>{repairStateIntegrity();renderIntegrity();render();renderQA()};renderIntegrity();
document.querySelector("#searchCards").oninput=render;document.querySelector("#filterType").onchange=render;document.querySelector("#collectionUniverse").onchange=render;
const bulkDialog=document.querySelector("#bulkDialog"),bulkPhotos=document.querySelector("#bulkPhotos");document.querySelector("#bulkAdd").onclick=()=>bulkDialog.showModal();
document.querySelector("#saveBulk").onclick=async e=>{e.preventDefault();let fs=[...bulkPhotos.files];if(!fs.length)return;let btn=e.currentTarget,old=btn.textContent;btn.disabled=true;btn.textContent="Guardando fotos…";let jobs=[];for(let i=0;i<fs.length;i++){let id=crypto.randomUUID(),blob=await resizeBlob(fs[i]);await photoPut(id,blob);let card={id,universe:document.querySelector("#bulkUniverse")?.value||"pokemon",name:"Carta por identificar",set:"",number:"",year:"",language:"",grading:"RAW",grade:"",value:0,purchase:null,quantity:1,purchaseDate:"",purpose:"collection",cert:"",photoKey:id,photoURL:URL.createObjectURL(blob),icon:"🃏",draft:true,recognition:{score:0,source:"pending",at:new Date().toISOString()},createdAt:new Date().toISOString()};state.cards.push(card);jobs.push({card,blob});}save();render();try{autoMarketCoverage()}catch{}storageStatus();btn.disabled=false;btn.textContent=old;bulkPhotos.value="";bulkDialog.close();let st=document.querySelector("#repairStatus");st.classList.remove("hidden");st.textContent=fs.length+" fotos guardadas. La identificación continuará sin bloquear la app.";for(const j of jobs)enqueueRecognition(j.card,j.blob)};

async function hydrateMarketFromStorage(){
  try{
    const u=currentRadarUniverse(),q=await refreshMarketFreshness(u),rows=q.active.sort((a,b)=>b.score-a.score).slice(0,400);
    state.marketScan=rows;state.marketScanUniverse=u;
    if(rows.length){state.marketScanMode="wide";if(!state.marketScanAt)state.marketScanAt=new Date().toISOString()}
    state.bootInfo={at:new Date().toISOString(),radarLoaded:true,radarCount:rows.length};
    save();
    try{renderCoverage()}catch(e){pushRuntimeError("renderCoverage",e?.message||e)}
    try{renderMarketScan();renderRadar();refreshGlobalToday().catch(()=>{})}catch(e){pushRuntimeError("renderMarketScan",e?.message||e)}
    try{renderScanHistory()}catch(e){pushRuntimeError("renderScanHistory",e?.message||e)}
    try{renderBootStatus()}catch(e){pushRuntimeError("renderBootStatus",e?.message||e)}
  }catch(e){
    state.bootInfo={at:new Date().toISOString(),radarLoaded:false,radarCount:0,error:String(e?.message||e||"market hydrate")};save();
  }
}
async function archiveFootballUniverseData(){
  try{
    const all=await marketSignalAll(),football=all.filter(x=>x?.universe==="football");
    if(football.length){
      state.archivedUniverses=state.archivedUniverses||{};
      state.archivedUniverses.football={at:new Date().toISOString(),signals:football.slice(0,500),count:football.length};
      await marketSignalDeleteMany(football.map(x=>x.id));
    }
    state.market=state.market||[];
    const fm=state.market.filter(x=>x?.universe==="football");
    if(fm.length){
      state.archivedUniverses=state.archivedUniverses||{};
      state.archivedUniverses.footballMarket={at:new Date().toISOString(),rows:fm.slice(0,500),count:fm.length};
      state.market=state.market.filter(x=>x?.universe!=="football");
    }
    delete state.coverageByUniverse?.football;delete state.cursorByUniverse?.football;
    save();
  }catch{}
}
async function migrateLegacyMarketUniverse(){
  const rows=Object.values(state.marketUniverse||{}).filter(x=>x?.id);
  if(rows.length){await marketSignalPutMany(rows);state.marketUniverse={};}
  state.marketScannedIds={};
  await refreshMarketFreshness();
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-cv-complete]");if(!b)return;e.preventDefault();e.stopPropagation();try{editCard(b.dataset.cvComplete)}catch{}});
window.CVRenderCollection=render;
openDB().then(async()=>{try{await navigator.storage?.persist?.()}catch{}await migrateLegacyMarketUniverse();await archiveFootballUniverseData(); for(const x of state.cards){if(x.photo&&!x.photoKey&&x.photo.startsWith("data:")){try{let blob=await (await fetch(x.photo)).blob();x.photoKey=x.id;await photoPut(x.id,blob);delete x.photo}catch{}}}save();await hydratePhotos();await hydrateMarketFromStorage();storageStatus()}).catch(e=>{state.bootInfo={at:new Date().toISOString(),radarLoaded:false,radarCount:0,error:String(e?.message||e||"IndexedDB")};save();renderBootStatus();document.querySelector("#readyText").textContent="Error al abrir almacenamiento local. No cargues cartas hasta recargar la app."});