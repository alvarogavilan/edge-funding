(()=>{const N=v=>Number(v)||0,E=v=>{const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML},EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
state.manualOpportunities=Array.isArray(state.manualOpportunities)?state.manualOpportunities:[];
if(!state.sameLanguageAuditV788){
 const ids=[
  "lorcana-tinker-bell-giant-fairy-v2-20260927",
  "lorcana-aurora-dreaming-guardian-v2-20260927",
  "lorcana-belle-strange-special-v2-20260927",
  "lorcana-simba-returned-king-v2-20260927",
  "lorcana-mickey-artful-rogue-v2-20260927",
  "lorcana-mickey-wayward-v2-20260927"
 ];
 const notes={
  "lorcana-tinker-bell-giant-fairy-v2-20260927":"Mismo idioma: JP 80→mediana 90; FR 89,94→122; EN 170→189,98; DE 178→180. Ninguno deja ≈+40 € netos.",
  "lorcana-aurora-dreaming-guardian-v2-20260927":"Mismo idioma: FR 79,99→mediana 100; JP 82→82; DE 94,95→110. No supera +40 € netos.",
  "lorcana-belle-strange-special-v2-20260927":"Mismo idioma: FR NM 79→mediana 120; DE 100→130; JP 119,99→140; EN 189,99→199. No supera +40 € netos.",
  "lorcana-simba-returned-king-v2-20260927":"Mismo idioma: JP 69→104,39; DE NM 90→124,99; FR 89→127,48; EN NM 200→225. No supera +40 € netos.",
  "lorcana-mickey-artful-rogue-v2-20260927":"Mismo idioma: FR 50→74; DE 89→99,90; EN NM 140→145; JP 120→130. No supera +40 € netos.",
  "lorcana-mickey-wayward-v2-20260927":"Mismo idioma: FR NM 85→mediana 120; DE 170→230; EN 300→389,98. El mejor margen porcentual no cumple de forma conservadora el filtro actual tras costes."
 };
 for(const id of ids){
  const x=state.manualOpportunities.find(o=>o.id===id);
  if(x){
   x.approval="WATCH";
   x.status="NO COMPRAR AHORA · AUDITORÍA MISMO IDIOMA";
   x.note=((x.note||"")+" · "+notes[id]).trim();
  }
 }
 state.sameLanguageAuditV788=true;save();
}
if(!state.stitchAuditV787){
 const rock=state.manualOpportunities.find(x=>x.id==="lorcana-stitch-rock-star-promo-v2-20260927");
 if(rock){
  rock.approval="WATCH";
  rock.status="NO COMPRAR POR AHORA · IMPRESIÓN/REFERENCIA EN CONFLICTO";
  rock.note=((rock.note||"")+" · Contraste externo: la referencia ~278 € corresponde a Store Championship; la versión estándar/promo comparable ronda ~85–99 €. No tratar 95 € como arbitraje hasta aislar ventas de esta impresión exacta.").trim();
 }
 const surfer=state.manualOpportunities.find(x=>x.id==="lorcana-stitch-carefree-surfer-v2-20260927");
 if(surfer){
  surfer.approval="VERIFY-LANGUAGE";
  surfer.status="VERIFICAR IDIOMA EXACTO · POSIBLE OPORTUNIDAD REAL";
  surfer.note=((surfer.note||"")+" · TCGGraph #206 muestra ventas realizadas recientes aprox. 190–275 €, pero mínimos NM por idioma observados: francés 95 €, japonés 100 €, alemán 139,94 €; inglés aparece más alto. La oferta 75 € debe identificarse por idioma antes de aprobar.").trim();
 }
 state.stitchAuditV787=true;save();
}
if(!state.variantAuditV785){
 const lady=state.manualOpportunities.find(x=>x.id==="pokemon-lady-forbidden-light-jp-100-20260927");
 if(lady){
  lady.approval="WATCH";
  lady.status="VERIFICAR VARIANTE · POSIBLE ERROR PRINT";
  lady.variant="Japanese SR 100/094 · acabado exacto pendiente";
  lady.note=((lady.note||"")+" · Existen impresiones japonesas con diferencias de acabado/error que alteran mucho el valor. Ventas RAW recientes de copias normales rondan ~51–60 USD; no usar trend/avg de Cardmarket como salida hasta verificar la superficie exacta por fotos.").trim();
 }
 state.variantAuditV785=true;save();
}
if(!state.variantAuditV783){
 const t=state.manualOpportunities.find(x=>x.id==="lorcana-mickey-trumpeter-v2-20260927");
 if(t){
  t.variant="Foil / V.2 · 182/204 · NO Enchanted";
  t.approval="WATCH";
  t.status="DESCARTAR POR AHORA · VARIANTE/PRECIO ANÓMALO";
  t.note=((t.note||"")+" · Contraste externo: la versión foil 182/204 cotiza muy por debajo de 50 €; no usar las métricas anómalas de esta ficha como señal de compra.").trim();
 }
 state.variantAuditV783=true;save();
}
if(!state.languageAwareV777){
  for(const x of state.manualOpportunities){
    if(x.universe==="lorcana" && ["BUY-SCALE","BUY-ONE"].includes(x.approval||"")){
      x.offerLanguage=x.offerLanguage||"PENDIENTE";
      x.languageCheckRequired=true;
      x.preLanguageApproval=x.approval;
      x.approval="VERIFY-LANGUAGE";
      x.status="VERIFICAR IDIOMA + ESTADO ANTES DE COMPRAR";
      x.note=((x.note||"")+" · No comparar mínimos de un idioma con referencias de salida de otro idioma.").trim();
    }
  }
  state.languageAwareV777=true;save();
}
for(const x of state.manualOpportunities){
 if(x.universe==="lorcana"&&["BUY-SCALE","BUY-ONE"].includes(x.approval||"")&&x.languageVerified!==true){
  x.offerLanguage=x.offerLanguage||"PENDIENTE";
  x.languageCheckRequired=true;
  x.preLanguageApproval=x.preLanguageApproval||x.approval;
  x.approval="VERIFY-LANGUAGE";
  x.status="VERIFICAR IDIOMA + ESTADO ANTES DE COMPRAR";
 }
}
state.rejectedManualOpportunities=[
 {name:"Peter Pan - Pirate's Bane (V.2)",reason:"Margen absoluto conservador insuficiente para política +50 €",price:31,trend:49.32,avg30:37.57},
 {name:"Sisu - Divine Water Dragon (V.2)",reason:"Margen absoluto conservador insuficiente para política +50 €",price:30,trend:44.56,avg30:47.18}
];
const id="lorcana-donald-pie-slinger-v2-20260927";
const caravanId="pokemon-ex-sandstorm-caravan-20260927";
const auroraId="lorcana-aurora-dreaming-guardian-v2-20260927";
const mickeyId="lorcana-mickey-wayward-v2-20260927";
const tinkerId="lorcana-tinker-bell-giant-fairy-v2-20260927";
const belleId="lorcana-belle-strange-special-v2-20260927";
const simbaId="lorcana-simba-returned-king-v2-20260927";
const artfulId="lorcana-mickey-artful-rogue-v2-20260927";
const ladyId="pokemon-lady-forbidden-light-jp-100-20260927";
const trumpeterId="lorcana-mickey-trumpeter-v2-20260927";
const nurseId="pokemon-nurse-wcd04-ex145-20260927";
const stitchSurferId="lorcana-stitch-carefree-surfer-v2-20260927";
const stitchRockId="lorcana-stitch-rock-star-promo-v2-20260927";
const hoohId="pokemon-hooh-ex-xy9-088-20260927";
const espeonId="pokemon-espeon-v-eevee-heroes-081-20260927";
const arielId="lorcana-ariel-sonic-warrior-220-it-20260927";
const belleMysticId="lorcana-belle-accomplished-mystic-226-it-20260927";
const beastGraciousId="lorcana-beast-gracious-prince-224-20260927";
const pongoId="lorcana-pongo-determined-father-223-it-20260928";
const winnieId="lorcana-winnie-hunny-wizard-227-de-20260928";
const elsaId="lorcana-elsa-spirit-winter-207-fr-20260928";
const scroogeId="lorcana-scrooge-richest-duck-218-it-20260928";
const gyaradosBuyId="pokemon-gyarados-ex-xy9-089-jp-nm-20260928";
{
 const x=state.manualOpportunities.find(o=>o.id===gyaradosBuyId);
 if(x){
  x.approval="WATCH";
  x.status="YA EN MI COLECCIÓN · NO REPETIR";
  x.publicFloorVerified=false;
  x.ownedDuplicateBlocked=true;
  x.note=((x.note||"")+" · Bloqueada: Gyarados EX XY9 089/080 japonés ya está en Mi colección. No volver a proponer salvo autorización explícita para ampliar posición.").trim();
 }
}

const glaceonResearchId="pokemon-glaceon-vmax-s6a091-research-20260928";
const leafeonResearchId="pokemon-leafeon-vmax-s6a089-research-20260928";
const pikazekResearchId="pokemon-pikachu-zekrom-gx-sm9101-research-20260928";
const umbreonResearchId="pokemon-umbreon-vmax-s6a095-research-20260928";
const giratinaResearchId="pokemon-giratina-v-s11-111-research-20260928";
const mew151ResearchId="pokemon-mew-ex-sv2a205-research-20260928";
const leafeonPps2ResearchId="pokemon-leafeon-vmax-pps2-evs008-research-20260928";
const rayquaza217AuditId="pokemon-rayquaza-vmax-evs217-audit-20260928";
const giratina186AuditId="pokemon-giratina-v-lor186-audit-20260928";
const gengar271AuditId="pokemon-gengar-vmax-fst271-audit-20260928";
const mew251AuditId="pokemon-mew-v-fst251-audit-20260928";
for(const row of [
 {id:leafeonPps2ResearchId,name:"Leafeon VMAX",set:"Play! Pokémon Prize Pack Series Two",number:"EVS 008",price:34.99,trend:115.87,avg30:36.42,avg7:103.57,avg1:140,available:3,seller:"Impavido",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Play-Pokemon-Prize-Pack-Series-Two/Leafeon-VMAX-PPS2EVS-008",note:"NM 34,99 €, siguiente 65 €, luego ~149,96–179,94 €. Venta NM inglesa externa observada a 140 €. Idioma exacto de la oferta 34,99 € pendiente; no aprobar hasta aislar mismo idioma."},
 {id:giratinaResearchId,name:"Giratina V",set:"Lost Abyss",number:"111",price:349,trend:1592.81,avg30:1069.53,avg7:1563.78,available:47,seller:"ananaskiwi28",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Lost-Abyss/Giratina-V-V3-s11111",note:"NM desde 349 €. Varias NM consecutivas 349–449 €. Margen potencial muy alto; idioma exacto de la oferta mínima debe verificarse antes de comprar."},
 {id:mew151ResearchId,name:"Mew ex",set:"Pokémon Card 151",number:"205",price:119.55,trend:225.99,avg30:249.91,avg7:257.63,available:129,seller:"magma-cards",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Pokemon-Card-151/Mew-ex-V3-sv2a205",note:"Primera NM observada 119,55 €. Varias NM 120–130 €. Media 30d 249,91 €. Idioma exacto pendiente."},
 {id:glaceonResearchId,name:"Glaceon VMAX",set:"Eevee Heroes",number:"091",price:105,trend:448.29,avg30:244.05,avg7:416.49,available:51,seller:"Predatoree",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Eevee-Heroes/Glaceon-VMAX-V3",note:"NM desde 105 €. Varias NM consecutivas 105–130 €. Idioma exacto de la oferta mínima no visible públicamente."},
 {id:leafeonResearchId,name:"Leafeon VMAX",set:"Eevee Heroes",number:"089",price:110,trend:370.25,avg30:251.95,avg7:279.33,available:42,seller:"DojoTCG",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Eevee-Heroes/Leafeon-VMAX-V3",note:"NM desde 110 €. Varias NM consecutivas 110–120 €. Idioma exacto de la oferta mínima no visible públicamente."},
 {id:pikazekResearchId,name:"Pikachu & Zekrom GX",set:"Tag Bolt",number:"101",price:199.99,trend:2385.09,avg30:613.67,avg7:1436.40,available:9,seller:"SvenVM",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Tag-Bolt/Pikachu-Zekrom-GX-V3-sm9101",note:"NM desde 199,99 €. Dispersión extrema; exige verificar idioma exacto y salida antes de comprar."},
 {id:umbreonResearchId,name:"Umbreon VMAX",set:"Eevee Heroes",number:"095",price:769,trend:1869.65,avg30:1817.73,avg7:2305,available:44,seller:"Labilador",url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Eevee-Heroes/Umbreon-VMAX-V3",note:"NM desde 769 €. Ticket alto; exige idioma exacto y ventas comparables del mismo idioma."}
]){
 if(!state.manualOpportunities.some(x=>x.id===row.id)){
  state.manualOpportunities.push({...row,universe:"pokemon",variant:"Oriental · acabado exacto por validar",condition:"NM",shop:"Cardmarket",
   checkedAt:"2026-09-28T22:12:00+02:00",expiresAt:"2026-09-29T22:12:00+02:00",
   status:"INVESTIGACIÓN PRIORITARIA · VERIFICAR IDIOMA EXACTO",approval:"VERIFY-LANGUAGE",
   offerLanguage:"PENDIENTE",languageCheckRequired:true,publicFloorVerified:false});
 }
}
save();
for(const [id,status,note] of [
 [giratinaResearchId,"DESCARTADA · MÍNIMO COREANO, NO JAPONÉS","La referencia separada por idioma sitúa JP muy por encima (~1.100–1.560 €) y KR alrededor de 399,99 €. Las ofertas 344,90–399,99 € encajan con coreano; no comparar contra JP."],
 [mew151ResearchId,"DESCARTADA · MÍNIMO COMPATIBLE CON COREANO","Referencia por idioma: japonés ~297,19 €, coreano ~151,06 €. Las NM 119,55–130 € no justifican salida japonesa; con referencia coreana no supera el gate neto."],
 [glaceonResearchId,"DESCARTADA · MÍNIMO COREANO, NO JAPONÉS","Referencia separada por idioma: JP NM ~429 €, KR ~105 €. El mínimo de 105 € coincide con coreano; no es arbitraje japonés."]
]){
 const x=state.manualOpportunities.find(o=>o.id===id);
 if(x){x.approval="WATCH";x.status=status;x.publicFloorVerified=false;x.languageMismatchRisk=true;x.note=((x.note||"")+" · "+note).trim();}
}
state.pokemonLanguageSpreadAuditV939=true;
for(const row of [
 {id:rayquaza217AuditId,name:"Rayquaza VMAX",set:"Evolving Skies",number:"217/203",price:54,status:"DESCARTADA · MISMO IDIOMA SIN MARGEN",note:"Separación por idioma: IT ~54 €, EN ~80 €, DE ~80,99 €, FR ~85 €, ES ~100 €. El mínimo no es arbitraje; es el suelo italiano."},
 {id:giratina186AuditId,name:"Giratina V",set:"Lost Origin",number:"186/196",price:490,status:"DESCARTADA · MISMO IDIOMA SIN MARGEN",note:"NM por idioma aprox.: DE ~490 €, IT ~539,99 €, EN ~650 €, ES ~700 €, FR ~1.100 €. La NM ~500 € es el propio suelo alemán."},
 {id:gengar271AuditId,name:"Gengar VMAX",set:"Fusion Strike",number:"271/264",price:600,status:"DESCARTADA · MISMO IDIOMA SIN MARGEN",note:"NM por idioma aprox.: FR ~600 €, DE ~625 €, EN ~700 €, ES ~750 €, IT ~910 €. Los mínimos globales bajos son cartas PO/PL; NM no deja +40 € netos del mismo idioma."},
 {id:mew251AuditId,name:"Mew V",set:"Fusion Strike",number:"251/264",price:81,status:"DESCARTADA · MISMO IDIOMA SIN MARGEN",note:"NM por idioma aprox.: EN ~81 €, IT ~98,99 €, DE ~100 €, FR ~158 €, ES ~350 €. No usar media global como salida de otro idioma."}
]){
 if(!state.manualOpportunities.some(x=>x.id===row.id)){
  state.manualOpportunities.push({...row,universe:"pokemon",variant:"RAW · idioma occidental",condition:"NM",shop:"Cardmarket",
   checkedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+24*3600000).toISOString(),
   approval:"WATCH",publicFloorVerified:false,resolvedMarketNoEdge:true,languageVerified:false});
 }
}

for(const [id,status,why] of [
 [belleMysticId,"WATCH · ROI NETO < 35%","Con salida 245 €, recorte 15%, comisión 5% y 3 € de reserva: salida neta ~194,84 €, margen ~44,84 €, ROI ~29,9%."],
 [elsaId,"WATCH · ROI NETO < 35%","Con salida 450 €, recorte 15%, comisión 5% y 3 € de reserva: salida neta ~360,38 €, margen ~81,38 €, ROI ~29,2%."],
 [scroogeId,"WATCH · MARGEN NETO < 40 €","Con salida 117,48 €, recorte 15%, comisión 5% y 3 € de reserva: salida neta ~91,87 €, margen ~33,88 €."]
]){
 const x=state.manualOpportunities.find(o=>o.id===id);
 if(x){x.approval="WATCH";x.status=status;x.publicFloorVerified=false;x.netEconomicsBlocked=true;x.note=((x.note||"")+" · "+why).trim();}
}
save();
if(!state.manualOpportunities.some(x=>x.id===gyaradosBuyId)){
 state.manualOpportunities.push({
  id:gyaradosBuyId,universe:"pokemon",name:"Gyarados EX",set:"Rage of the Broken Heavens",number:"089/080",
  variant:"Full Art secreta · Japonés",condition:"NM",shop:"Cardmarket",seller:"AngelD4rk",
  price:150.00,trend:509.76,avg30:274.17,avg7:535.49,avg1:660.00,available:20,sellerQty:1,
  url:"https://www.cardmarket.com/es/Pokemon/Products/Singles/Rage-of-the-Broken-Heavens/Gyarados-EX-V3",
  checkedAt:"2026-09-28T22:12:00+02:00",expiresAt:"2026-09-29T22:12:00+02:00",
  status:"COMPRAR AHORA · JAPONÉS NM · 1 UNIDAD",approval:"BUY-ONE",
  offerLanguage:"Japanese",languageVerified:true,publicFloorVerified:true,
  note:"Oferta pública Cardmarket: AngelD4rk NM 150 €. Media 30 días 274,17 €. Otras NM visibles: 230 €, 250 €, 649 €, 699,90 € y 700 €. Una unidad."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===scroogeId)){
 state.manualOpportunities.push({
  id:scroogeId,universe:"lorcana",name:"Scrooge McDuck - Richest Duck in the World",set:"Into the Inklands",number:"218/204",
  variant:"Encantada · Holofoil · Italiano",condition:"NM",shop:"Cardmarket",seller:"Oferta italiana publicada en Cardmarket",
  price:57.99,trend:223.88,avg30:188.63,avg7:215.44,avg1:0,available:8,sellerQty:1,
  url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/Into-the-Inklands/Scrooge-McDuck-Richest-Duck-in-the-World-V2",
  checkedAt:"2026-09-28T22:12:00+02:00",expiresAt:"2026-09-29T22:12:00+02:00",
  status:"COMPRAR AHORA · ITALIANO NM · 1 UNIDAD",approval:"BUY-ONE",
  offerLanguage:"Italian",languageVerified:true,publicFloorVerified:true,
  note:"Italiano Holofoil NM desde 57,99 €, mediana italiana 117,48 €, 8+ ofertas. Última venta global visible 23/09: 95 €. Una unidad."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===elsaId)){
 state.manualOpportunities.push({
  id:elsaId,universe:"lorcana",name:"Elsa - Spirit of Winter",set:"The First Chapter",number:"207/204",
  variant:"Encantada · Holofoil · Francés",condition:"NM",shop:"Cardmarket",seller:"Oferta francesa publicada en Cardmarket",
  price:279.00,trend:773.87,avg30:761.10,avg7:811.63,avg1:0,available:36,sellerQty:1,
  url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/The-First-Chapter/Elsa-Spirit-of-Winter-V2",
  checkedAt:"2026-09-28T13:28:00+02:00",expiresAt:"2026-09-29T13:28:00+02:00",
  status:"COMPRAR AHORA · FRANCÉS NM · 1 UNIDAD",approval:"BUY-ONE",
  offerLanguage:"French",languageVerified:true,publicFloorVerified:true,
  note:"Francés Holofoil NM desde 279 €, mediana francesa 450 €, 36+ ofertas. Última venta global visible 23/09: 600 €. Una unidad."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===winnieId)){
 state.manualOpportunities.push({
  id:winnieId,universe:"lorcana",name:"Winnie the Pooh - Hunny Wizard",set:"Fabled",number:"227/242",
  variant:"Enchanted · Holofoil · German",condition:"NM",shop:"Cardmarket",seller:"Cardmarket · mínimo alemán NM",
  price:800.00,trend:519.00,avg30:519.00,avg7:519.00,avg1:0,available:13,sellerQty:1,
  url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/Fabled/Winnie-the-Pooh-Hunny-Wizard-V2",
  checkedAt:"2026-09-28T10:15:00+02:00",expiresAt:"2026-09-29T10:15:00+02:00",
  status:"COMPRAR AHORA · GERMAN NM · CAPITAL ALTO",approval:"BUY-ONE",
  offerLanguage:"German",languageVerified:true,publicFloorVerified:true,
  note:"TCGGraph/Cardmarket: alemán Holofoil NM desde 800 €, mediana alemana 1.499 €, 13 ofertas. Ticket alto; una sola unidad."
 });save();
}
{
 const x=state.manualOpportunities.find(o=>o.id===winnieId);
 if(x){
  x.approval="WATCH";
  x.status="NO COMPRAR AHORA · SALIDA INSUFICIENTEMENTE SEGURA";
  x.publicFloorVerified=false;
  x.note=((x.note||"")+" · Revisión 28/09: última venta global visible 22/09 a 697 €, por debajo de la entrada alemana de 800 €. Se retira de Compra ya.").trim();
 }
}
if(!state.manualOpportunities.some(x=>x.id===pongoId)){
 state.manualOpportunities.push({
  id:pongoId,universe:"lorcana",name:"Pongo - Determined Father",set:"Fabled",number:"223/242",
  variant:"Enchanted · Holofoil · Italian",condition:"NM",shop:"Cardmarket",seller:"Cardmarket · oferta italiana más barata",
  price:137.95,trend:194.89,avg30:147.66,avg7:166.87,avg1:0,available:5,sellerQty:1,
  url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/Fabled/Pongo-Determined-Father-V2",
  checkedAt:"2026-09-28T10:06:00+02:00",expiresAt:"2026-09-29T10:06:00+02:00",
  status:"COMPRAR AHORA · ITALIAN NM · 1 UNIDAD",approval:"BUY-ONE",
  offerLanguage:"Italian",languageVerified:true,publicFloorVerified:true,
  note:"Cardmarket/TCGGraph: italiano Holofoil NM desde 137,95 €, mediana italiana 271,91 €, 5+ ofertas. Compra pública por suelo de mercado; el vendedor exacto se selecciona al abrir la ficha."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===beastGraciousId)){
 state.manualOpportunities.push({
  id:beastGraciousId,universe:"lorcana",name:"Beast - Gracious Prince",set:"Fabled",number:"224/242",
  variant:"Enchanted · Holofoil · idioma exacto pendiente",condition:"NM",shop:"Cardmarket",seller:"Davidev1974",
  price:137.96,trend:257.53,avg30:175.02,avg7:218.63,avg1:205.00,available:46,sellerQty:1,
  url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/Fabled/Beast-Gracious-Prince-V2",
  checkedAt:"2026-09-27T19:50:00+02:00",expiresAt:"2026-09-28T19:50:00+02:00",
  status:"WATCH ALTA PRIORIDAD · CONFIRMAR IDIOMA",approval:"WATCH",
  offerLanguage:"PENDIENTE",languageCheckRequired:true,
  note:"Cardmarket: Davidev1974 NM ~137,96 €. TCGGraph: francés NM low 119,67 €, mediana 219,90 € con 15+ ofertas; japonés NM low ~137,62 €. La oferta concreta puede ser japonesa, así que NO comprar hasta confirmar idioma."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===belleMysticId)){
 state.manualOpportunities.push({
  id:belleMysticId,universe:"lorcana",name:"Belle - Accomplished Mystic",set:"Fabled",number:"226/242",
  variant:"Enchanted · Holofoil · Italian",condition:"NM",shop:"Cardmarket",seller:"Retfird",
  price:150.00,trend:261.59,avg30:241.29,avg7:239.88,avg1:280.00,available:65,sellerQty:1,
  url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/Fabled/Belle-Accomplished-Mystic-V2",
  checkedAt:"2026-09-27T19:05:00+02:00",expiresAt:"2026-09-28T19:05:00+02:00",
  status:"COMPRAR AHORA · ITALIAN NM · 1 UNIDAD",approval:"BUY-ONE",
  offerLanguage:"Italian",languageVerified:true,
  note:"Oferta concreta Cardmarket: Retfird, NM, 150 €. TCGGraph por idioma: italiano low/NM 150 €, median ask 249,95 €, 7+ ofertas. Ventas realizadas recientes del producto: 230–300 € en varias fechas; idiomas mezclados. Retfird ~99–100% evaluaciones positivas. Una unidad: solo una copia observada a 150 €."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===arielId)){
 state.manualOpportunities.push({
  id:arielId,universe:"lorcana",name:"Ariel - Sonic Warrior",set:"Ursula's Return",number:"220/204",
  variant:"Enchanted · Holofoil · Italian",condition:"NM",shop:"Cardmarket",seller:"Fantaverso-Store",
  price:65.00,trend:119.10,avg30:117.88,avg7:131.86,avg1:123.00,available:74,sellerQty:1,
  url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/Ursulas-Return/Ariel-Sonic-Warrior-V2",
  checkedAt:"2026-09-27T18:45:00+02:00",expiresAt:"2026-09-28T18:45:00+02:00",
  status:"COMPRAR AHORA · ITALIAN NM · 1 UNIDAD",approval:"BUY-ONE",
  offerLanguage:"Italian",languageVerified:true,
  note:"Oferta concreta Cardmarket: Fantaverso-Store, NM italiano, 65 €. TCGGraph por idioma: italiano low/NM 65 €, median ask 114,95 €, 7+ ofertas; trend 119,10 €, avg30 117,88 €, avg7 131,86 €. Una unidad: no escalar porque solo hay una copia a 65 €."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===nurseId)){
 state.manualOpportunities.push({
  id:nurseId,universe:"pokemon",name:"Pokémon Nurse",set:"WCD 2004",number:"EX 145",
  variant:"World Championships Deck 2004",condition:"EX",shop:"Cardmarket",seller:"traptrixseur",
  price:66.00,trend:600.00,avg30:600.00,avg7:600.00,avg1:600.00,available:5,sellerQty:1,
  url:"https://www.cardmarket.com/en/Pokemon/Products/Singles/WCD-2004/Pokemon-Nurse-WCD04EX-145",
  checkedAt:"2026-09-27T17:55:00+02:00",expiresAt:"2026-09-28T17:55:00+02:00",
  status:"WATCH ALTA PRIORIDAD · ANOMALÍA DE REFERENCIA",approval:"WATCH",
  note:"Solo 5 unidades. Cardmarket muestra 600 € en tendencia y medias, pero la señal es demasiado extrema para asumir liquidez/valor real. EX observada a 66 €; requiere ventas cerradas o contraste externo antes de aprobar."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===trumpeterId)){
 state.manualOpportunities.push({
  id:trumpeterId,universe:"lorcana",name:"Mickey Mouse - Trumpeter (V.2)",set:"Into the Inklands",number:"",
  variant:"Foil / V.2",condition:"NM",shop:"Cardmarket",seller:"Daquiao92",
  price:50.00,trend:99.69,avg30:98.84,avg7:104.23,avg1:102.50,available:50,sellerQty:1,
  url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/Into-the-Inklands/Mickey-Mouse-Trumpeter-V2",
  checkedAt:"2026-09-27T17:26:00+02:00",expiresAt:"2026-09-28T17:26:00+02:00",
  status:"PRIORIDAD · +40 € FLOOR · 1 UNIDAD",approval:"BUY-ONE",
  note:"Cardmarket: NM 50 €, trend 99,69 €, avg30 98,84 €, avg7 104,23 €. Potencial neto aprox. +43,90 € antes de portes usando avg30 y 5% venta."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===ladyId)){
 state.manualOpportunities.push({
  id:ladyId,universe:"pokemon",name:"Lady",set:"Forbidden Light JP",number:"100",
  variant:"Japanese Full Art",condition:"NM",shop:"Cardmarket",seller:"meshtolino",
  price:44.99,trend:147.01,avg30:104.00,avg7:104.00,avg1:140.00,available:5,sellerQty:1,
  url:"https://www.cardmarket.com/en/Pokemon/Products/Singles/Forbidden-Light-JP/Lady-V2",
  checkedAt:"2026-09-27T17:35:00+02:00",expiresAt:"2026-09-28T17:35:00+02:00",
  status:"POKÉMON TOP · 1 UNIDAD",approval:"BUY-ONE",
  note:"Cardmarket: NM 44,99 €, trend 147,01 €, avg30/7 104 €. Solo 5 unidades disponibles; verificar oferta exacta antes de pagar."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===tinkerId)){
 state.manualOpportunities.push({
  id:tinkerId,universe:"lorcana",name:"Tinker Bell - Giant Fairy (V.2)",set:"The First Chapter",number:"216/204",
  variant:"Enchanted · Foil",condition:"NM",shop:"Cardmarket",seller:"TheBazaarTCG",
  price:80.00,trend:141.96,avg30:146.31,avg7:166.99,avg1:109.99,available:121,sellerQty:5,
  url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Tinker-Bell-Giant-Fairy-V2",
  checkedAt:"2026-09-27T17:28:00+02:00",expiresAt:"2026-09-28T17:28:00+02:00",
  status:"TOP 1 · ESCALABLE · 5 NM A 80 €",approval:"BUY-SCALE",
  note:"Referencia fresca TCGGraph: trend 254,47 €, avg30 242,97 €, avg7 251,99 €. Cardmarket directo: 5 NM a 80 €."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===belleId)){
 state.manualOpportunities.push({
  id:belleId,universe:"lorcana",name:"Belle - Strange but Special (V.2)",set:"The First Chapter",number:"214/204",
  variant:"Enchanted · Foil",condition:"NM",shop:"Cardmarket",seller:"TheBazaarTCG",
  price:85.00,trend:86.55,avg30:190.01,avg7:112.25,avg1:100.00,available:96,sellerQty:5,
  url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Belle-Strange-but-Special-V2",
  checkedAt:"2026-09-27T17:28:00+02:00",expiresAt:"2026-09-28T17:28:00+02:00",
  status:"TOP 3 · ESCALABLE · 5 NM A 85 €",approval:"BUY-SCALE",
  note:"Referencia fresca TCGGraph: trend 229,89 €, avg30 189,07 €, avg7 215,54 €. Cardmarket directo: 5 NM a 85 €."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===simbaId)){
 state.manualOpportunities.push({
  id:simbaId,universe:"lorcana",name:"Simba - Returned King (V.2)",set:"The First Chapter",number:"215/204",
  variant:"Enchanted · Foil",condition:"NM",shop:"Cardmarket",seller:"Vegas",
  price:68.99,trend:148.50,avg30:118.18,avg7:156.56,avg1:65.00,available:94,sellerQty:1,
  url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Simba-Returned-King-V2",
  checkedAt:"2026-09-27T17:28:00+02:00",expiresAt:"2026-09-28T17:28:00+02:00",
  status:"TOP 4 · 1 UNIDAD",approval:"BUY-ONE",
  note:"Referencia fresca TCGGraph: trend 165,83 €, avg30 170,31 €, avg7 167,53 €. Cardmarket directo: NM 68,99 €."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===artfulId)){
 state.manualOpportunities.push({
  id:artfulId,universe:"lorcana",name:"Mickey Mouse - Artful Rogue (V.2)",set:"The First Chapter",number:"210/204",
  variant:"Enchanted · Foil",condition:"NM",shop:"Cardmarket",seller:"fantasymarket06",
  price:50.00,trend:92.01,avg30:91.30,avg7:87.60,avg1:146.67,available:93,sellerQty:1,
  url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Mickey-Mouse-Artful-Rogue-V2",
  checkedAt:"2026-09-27T17:28:00+02:00",expiresAt:"2026-09-28T17:28:00+02:00",
  status:"TOP 5 · 1 UNIDAD",approval:"BUY-ONE",
  note:"Referencia fresca TCGGraph: trend 112,31 €, avg30 108,69 €, avg7 108,19 €. Cardmarket directo: NM 50 €."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===mickeyId)){
 state.manualOpportunities.push({
  id:mickeyId,universe:"lorcana",name:"Mickey Mouse - Wayward Sorcerer (V.2)",set:"The First Chapter",number:"",
  variant:"Foil / V.2",condition:"NM",shop:"Cardmarket",seller:"Smurf256",
  price:70.00,trend:145.48,avg30:158.24,avg7:110.54,avg1:69.00,available:80,
  depthPrices:[70,79.90,79.95,80,89.99,90],
  url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/The-First-Chapter/Mickey-Mouse-Wayward-Sorcerer-V2",
  checkedAt:"2026-09-27T16:50:00+02:00",expiresAt:"2026-09-28T16:50:00+02:00",
  status:"PRIORIDAD · 1 UNIDAD",approval:"BUY-ONE",
  note:"NM a 70 €, seguida por varias NM/MT 79,90–90 €. No escalar hasta verificar ventas/profundidad de salida."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===auroraId)){
 state.manualOpportunities.push({
  id:auroraId,universe:"lorcana",name:"Aurora - Dreaming Guardian (V.2)",set:"The First Chapter",number:"",
  variant:"Enchanted / V.2 · Foil",condition:"NM",shop:"Cardmarket",seller:"TheBazaarTCG",
  price:70.00,trend:143.52,avg30:157.04,avg7:140.07,avg1:249.00,available:116,
  sellerQty:5,url:"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Aurora-Dreaming-Guardian-V2",
  checkedAt:"2026-09-27T16:42:00+02:00",expiresAt:"2026-09-28T16:42:00+02:00",
  status:"PRIORIDAD ESCALABLE · 5 NM A 70 € · PROFUNDIDAD CONFIRMADA",approval:"BUY-SCALE",
  note:"Mismo vendedor ofrece 5 NM a 70 €. Media 30d 157,04 €, 7d 140,07 €. Verificar precio/portes antes de pagar."
 });save();
}
if(!state.manualOpportunities.some(x=>x.id===caravanId)){
 state.manualOpportunities.push({id:caravanId,universe:"pokemon",name:"EX Sandstorm: Caravan Theme Deck",set:"EX Sandstorm",number:"",variant:"Sealed Theme Deck",condition:"SEALED",shop:"Cardmarket",seller:"halver93",price:15.00,backupPrice:50.00,trend:119.43,avg30:65.15,avg7:65.15,avg1:100.00,available:9,url:"https://www.cardmarket.com/en/Pokemon/Products/Theme-Decks/EX-Sandstorm-Caravan-Theme-Deck",checkedAt:"2026-09-27T16:25:00+02:00",expiresAt:"2026-09-28T16:25:00+02:00",status:"ANOMALÍA · VERIFICAR SELLADO Y CONTENIDO",approval:"WATCH"});save();
}
if(!state.manualOpportunities.some(x=>x.id===id)){
 state.manualOpportunities.push({id,universe:"lorcana",name:"Donald Duck - Pie Slinger (V.2)",set:"Shimmering Skies",number:"214/204",variant:"Enchanted · V.2 · Foil",condition:"NM",shop:"Cardmarket",seller:"BKJ38",price:44.90,trend:116.36,avg30:76.69,avg7:101.80,avg1:138.18,available:47,url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/Shimmering-Skies/Donald-Duck-Pie-Slinger-V2",checkedAt:"2026-09-27T14:20:00+02:00",expiresAt:"2026-09-28T14:20:00+02:00",status:"SECUNDARIA · PROFUNDIDAD NM CONFIRMADA",depthPrices:[44.9,45,45,45,49,50,50],depthNote:"Varias NM consecutivas entre 44,90 y 50 €; no depende de una sola oferta."});save();
}

/* V94.5 · normalización FINAL después de crear todos los seeds.
   Evita que una instalación limpia regenere BUY antiguos antes de los bloqueos. */
for(const [id,approval,status,flags] of [
 [gyaradosBuyId,"WATCH","YA EN MI COLECCIÓN · NO REPETIR",{publicFloorVerified:false,ownedDuplicateBlocked:true}],
 [belleMysticId,"WATCH","WATCH · ROI NETO < 35%",{publicFloorVerified:false,netEconomicsBlocked:true}],
 [elsaId,"WATCH","WATCH · ROI NETO < 35%",{publicFloorVerified:false,netEconomicsBlocked:true}],
 [scroogeId,"WATCH","WATCH · MARGEN NETO < 40 €",{publicFloorVerified:false,netEconomicsBlocked:true}],
 [winnieId,"WATCH","NO COMPRAR AHORA · SALIDA INSUFICIENTEMENTE SEGURA",{publicFloorVerified:false}],
 [pongoId,"WATCH","WATCH · VENDEDOR EXACTO PENDIENTE",{publicFloorVerified:false,exactSellerPending:true}],
 [arielId,"WATCH","WATCH PRIME · BUEN PRECIO, MARGEN < 40 €",{publicFloorVerified:false}]
]){
 const x=state.manualOpportunities.find(o=>o.id===id);
 if(x){x.approval=approval;x.status=status;Object.assign(x,flags);}
}
state.finalOpportunityNormalizationV945=true;save();

function positionSizing(x,c){
 const unit=N(x.price),trend=N(x.trend),avg30=N(x.avg30),avg7=N(x.avg7),avg1=N(x.avg1);
 const refs=[trend,avg30,avg7,avg1].filter(v=>v>0);
 const floor=refs.length?Math.min(...refs):Infinity;
 const conservativeGross=isFinite(floor)?floor:0;
 const conservativeExit=Math.max(0,conservativeGross*.85*.95-3);
 const netEdge=conservativeExit>unit?conservativeExit-unit:0;
 const roi=unit>0?netEdge/unit*100:0;
 const passes=unit>=20&&netEdge>=40&&roi>=35;
 const depth=Array.isArray(x.depthPrices)?x.depthPrices.filter(v=>N(v)>0).length:0;
 const sales30=x.sales30==null?null:N(x.sales30),sellerQty=N(x.sellerQty);
 const exactExit=x.exitEvidenceVerified===true&&x.sameMarketComparableVerified===true;
 let maxUnits=passes?1:0,reason=passes?"1 unidad por defecto. Escalar requiere liquidez y profundidad verificadas.":"No supera simultáneamente +40 € netos aprox. y ROI 35% después de recorte, comisión y reserva logística.";
 if(passes&&exactExit&&sales30!=null&&sales30>=3&&depth>=2&&sellerQty>=2){maxUnits=2;reason="2 unidades máximo: margen + salida exacta + ≥3 ventas/30d + ≥2 niveles de profundidad.";}
 if(passes&&exactExit&&sales30!=null&&sales30>=6&&depth>=3&&sellerQty>=3&&roi>=50){maxUnits=3;reason="3 unidades máximo: liquidez fuerte verificada, ≥6 ventas/30d, ≥3 niveles de profundidad y ROI ≥50%.";}
 return {conservativeGross,conservativeExit,netEdge,roi,passes,maxUnits,recommended:maxUnits,reason,depth,sales30,exactExit};
}
function cash(){try{return Math.max(0,window.investmentLedgerStats?.().netCash||0)}catch{return 0}}
function top5Rank(x){
 const refs=[N(x.trend),N(x.avg30),N(x.avg7),N(x.avg1)].filter(v=>v>0),entry=N(x.price);
 const floor=refs.length?Math.min(...refs):Infinity;
 return (isFinite(floor)?floor*.95:0)-entry;
}
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 let box=document.querySelector("#manualOpportunityPanel");if(!box){box=document.createElement("section");box.id="manualOpportunityPanel";box.className="simpleSection";host.prepend(box)}
 const rows=state.manualOpportunities.filter(z=>[gyaradosBuyId,scroogeId,elsaId,winnieId,pongoId,belleMysticId,arielId,tinkerId,auroraId,belleId,simbaId,artfulId,ladyId,trumpeterId,nurseId,hoohId,espeonId,stitchSurferId,stitchRockId,mickeyId,id,caravanId].includes(z.id)).sort((a,b)=>top5Rank(b)-top5Rank(a));
 if(!rows.length)return;const c=cash();
 box.innerHTML='<div class="simpleTitle"><h3>Oportunidades verificadas manualmente</h3><span>'+rows.length+'</span></div>'+rows.map(x=>{const stale=new Date(x.expiresAt)<=new Date(),ps=positionSizing(x,c),netExit=ps.conservativeExit,potential=ps.netEdge,isPolicyFail=!ps.passes,isWatch=x.approval==="WATCH"||isPolicyFail,isLang=x.approval==="VERIFY-LANGUAGE",isScale=x.approval==="BUY-SCALE"&&!isPolicyFail,isOne=x.approval==="BUY-ONE"&&!isPolicyFail;
 if(x.approval==="VERIFY-LANGUAGE"){ps.maxUnits=0;ps.recommended=0;ps.reason="Bloqueada hasta confirmar idioma y estado exactos de la oferta.";}
 if(x.approval==="BUY-SCALE"&&ps.passes){
   const allowed=Math.min(ps.maxUnits,N(x.sellerQty)||1);
   ps.maxUnits=allowed;ps.recommended=allowed;
   if(allowed<2)ps.reason="BUY-SCALE bloqueado a 1 unidad hasta tener ventas/30d y profundidad verificadas.";
 }
 if(x.approval==="BUY-ONE"&&ps.passes){ps.maxUnits=1;ps.recommended=1;ps.reason="Una unidad máximo hasta verificar liquidez de salida y comparables recientes."}
 return '<article class="buyTile"><div class="buyNoPhoto">'+E(x.universe.toUpperCase())+'<br>'+E(isWatch?"WATCH":isLang?"VERIFICAR IDIOMA":isScale?"ESCALABLE":isOne?"1 UNIDAD":"PRIORIDAD")+'</div><div class="buyBody"><div class="buyKicker">'+E(stale?"REVERIFICAR PRECIO":x.status)+'</div><h3>'+E(x.name)+'</h3><small>'+E([x.set,x.number,x.variant,x.condition].filter(Boolean).join(" · "))+'</small><div class="buyNumbers"><div><span>Oferta observada</span><b>'+EUR(x.price)+'</b></div><div><span>Tendencia</span><b>'+EUR(x.trend)+'</b></div><div><span>Media 30 días</span><b>'+EUR(x.avg30)+'</b></div><div><span>Potencial neto aprox.</span><b>'+EUR(potential)+'</b></div></div><div class="buyWhy primeTape"><b>Terminal:</b> última venta '+(x.lastSalePrice?EUR(x.lastSalePrice)+(x.lastSaleDate?' · '+E(x.lastSaleDate):''):'SIN DATO VERIFICADO')+
 ' · mediana ventas '+(x.soldMedianEUR?EUR(x.soldMedianEUR)+' · '+E(x.soldSample||0)+' comps':'SIN DATO VERIFICADO')+
 ' · ventas 7/30/90d '+(x.sales7!=null||x.sales30!=null||x.sales90!=null?E(x.sales7??'—')+'/'+E(x.sales30??'—')+'/'+E(x.sales90??'—'):'SIN DATO VERIFICADO')+
 ' · vendedores '+(x.currentSellers!=null?E(x.currentSellers):'SIN DATO')+
 ' · profundidad '+(Array.isArray(x.depthPrices)&&x.depthPrices.length?x.depthPrices.slice(0,6).map(EUR).join(' → '):'SIN DATO VERIFICADO')+'</div><div class="buyWhy">Cardmarket: '+E(x.available)+' disponibles · vendedor observado '+E(x.seller)+' · '+(isWatch?'precio extremadamente anómalo; confirmar que sea producto completo y sellado antes de considerar compra.':'la tendencia no garantiza una reventa futura.')+'</div><div class="buyWhy"><b>Tamaño de posición:</b> recomendación estratégica '+ps.recommended+' unidad(es) · límite de riesgo '+ps.maxUnits+'. '+E(ps.reason)+'</div><div class="buyWhy"><b>Capital:</b> fuera del ranking. El propietario decide después cuánto asignar.'+(isWatch?' · NO APROBADA TODAVÍA':'')+'</div><a class="buyButton '+(isWatch?'secondary':'')+'" href="'+E(x.url)+'" target="_blank" rel="noopener">'+(isWatch?'ABRIR Y VERIFICAR ANOMALÍA':'ABRIR FICHA · BUSCAR '+E(x.seller)+' A '+EUR(x.price))+'</a><button class="buyButton secondary" type="button" data-prime-card="'+E(x.id)+'">FICHA PRIME</button><button class="buyButton secondary" type="button" data-prime-supply="'+E(x.id)+'">SUPPLY / REPRINT</button><button class="buyButton secondary" type="button" data-prime-evidence="'+E(x.id)+'">EVIDENCIA · 7/30/90D</button>'+((isOne||isScale)?'<button class="buyButton" type="button" data-cv-bought="manual:'+E(x.id)+'">✓ LA HE COMPRADO</button>':"")+'</div></article>'}).join("");
}
window.CVManualOpportunities={render,positionSizing};setTimeout(render,50);document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
})();