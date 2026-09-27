(()=>{const N=v=>Number(v)||0,E=v=>{const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML},EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
state.manualOpportunities=Array.isArray(state.manualOpportunities)?state.manualOpportunities:[];
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
  price:80.00,trend:254.47,avg30:242.97,avg7:251.99,available:121,sellerQty:5,
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
  price:85.00,trend:229.89,avg30:189.07,avg7:215.54,available:96,sellerQty:5,
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
  price:68.99,trend:165.83,avg30:170.31,avg7:167.53,available:94,sellerQty:1,
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
  price:50.00,trend:112.31,avg30:108.69,avg7:108.19,available:93,sellerQty:1,
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
function positionSizing(x,c){
 const unit=N(x.price),trend=N(x.trend),avg30=N(x.avg30),available=N(x.available);
 const floor=Math.min(trend||Infinity,avg30||Infinity);
 const conservativeGross=isFinite(floor)?floor:0;
 const conservativeExit=conservativeGross*.95;
 const netEdge=conservativeExit>unit?conservativeExit-unit:0;
 const roi=unit>0?netEdge/unit*100:0;
 const passes=unit>=20&&netEdge>=40&&roi>=35;
 let maxUnits=passes?1:0,reason=passes?"1 unidad por defecto":"No supera simultáneamente +40 € netos aprox. y ROI 35% con la referencia más conservadora.";
 if(passes&&roi>=50&&available>=20){maxUnits=2;reason="2 unidades máximo: descuento fuerte, sujeto a verificar idioma, estado y profundidad real.";}
 if(passes&&roi>=80&&available>=40){maxUnits=3;reason="3 unidades solo con varias ofertas equivalentes verificadas y aceptando concentración.";}
 const affordable=unit>0?Math.floor(c/unit):0;
 return {conservativeGross,conservativeExit,netEdge,roi,passes,maxUnits,affordable,recommended:Math.max(0,Math.min(maxUnits,affordable)),reason};
}
function cash(){try{return Math.max(0,window.investmentLedgerStats?.().netCash||0)}catch{return 0}}
function top5Rank(x){
 const floor=Math.min(N(x.trend)||Infinity,N(x.avg30)||Infinity),entry=N(x.price);
 return (isFinite(floor)?floor*.95:0)-entry;
}
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 let box=document.querySelector("#manualOpportunityPanel");if(!box){box=document.createElement("section");box.id="manualOpportunityPanel";box.className="simpleSection";host.prepend(box)}
 const rows=state.manualOpportunities.filter(z=>[tinkerId,auroraId,belleId,simbaId,artfulId,ladyId,trumpeterId,mickeyId,id,caravanId].includes(z.id)).sort((a,b)=>top5Rank(b)-top5Rank(a));
 if(!rows.length)return;const c=cash();
 box.innerHTML='<div class="simpleTitle"><h3>Oportunidades verificadas manualmente</h3><span>'+rows.length+'</span></div>'+rows.map(x=>{const stale=new Date(x.expiresAt)<=new Date(),ps=positionSizing(x,c),netExit=ps.conservativeExit,potential=ps.netEdge,isPolicyFail=!ps.passes,isWatch=x.approval==="WATCH"||isPolicyFail,isLang=x.approval==="VERIFY-LANGUAGE",isScale=x.approval==="BUY-SCALE"&&!isPolicyFail,isOne=x.approval==="BUY-ONE"&&!isPolicyFail;
 if(x.approval==="VERIFY-LANGUAGE"){ps.maxUnits=0;ps.recommended=0;ps.reason="Bloqueada hasta confirmar idioma y estado exactos de la oferta.";}
 if(x.approval==="BUY-SCALE"){ps.maxUnits=Math.min(3,N(x.sellerQty)||3);ps.affordable=Math.floor(c/N(x.price));ps.recommended=Math.min(ps.maxUnits,ps.affordable);ps.reason="Posición escalable: varias NM al mismo precio del mismo vendedor; verificar portes y disponibilidad."}
 if(x.approval==="BUY-ONE"){ps.maxUnits=1;ps.affordable=Math.floor(c/N(x.price));ps.recommended=Math.min(1,ps.affordable);ps.reason="Una unidad máximo hasta verificar liquidez de salida y comparables recientes."}
 return '<article class="buyTile"><div class="buyNoPhoto">'+E(x.universe.toUpperCase())+'<br>'+E(isWatch?"WATCH":isLang?"VERIFICAR IDIOMA":isScale?"ESCALABLE":isOne?"1 UNIDAD":"PRIORIDAD")+'</div><div class="buyBody"><div class="buyKicker">'+E(stale?"REVERIFICAR PRECIO":x.status)+'</div><h3>'+E(x.name)+'</h3><small>'+E([x.set,x.number,x.variant,x.condition].filter(Boolean).join(" · "))+'</small><div class="buyNumbers"><div><span>Oferta observada</span><b>'+EUR(x.price)+'</b></div><div><span>Tendencia</span><b>'+EUR(x.trend)+'</b></div><div><span>Media 30 días</span><b>'+EUR(x.avg30)+'</b></div><div><span>Potencial neto aprox.</span><b>'+EUR(potential)+'</b></div></div><div class="buyWhy">Cardmarket: '+E(x.available)+' disponibles · vendedor observado '+E(x.seller)+' · '+(isWatch?'precio extremadamente anómalo; confirmar que sea producto completo y sellado antes de considerar compra.':'la tendencia no garantiza una reventa futura.')+'</div><div class="buyWhy"><b>Tamaño de posición:</b> caja actual permite '+ps.affordable+' unidad(es); límite de riesgo '+ps.maxUnits+'; recomendación actual '+ps.recommended+'. '+E(ps.reason)+'</div><div class="buyWhy">'+(c>=x.price?'✓ CABE EN CAJA · quedarían '+EUR(c-x.price):'Caja registrada '+EUR(c)+' · faltan '+EUR(x.price-c))+(isWatch?' · NO APROBADA TODAVÍA':'')+'</div><a class="buyButton '+(isWatch?'secondary':'')+'" href="'+E(x.url)+'" target="_blank" rel="noopener">'+(isWatch?'ABRIR Y VERIFICAR ANOMALÍA':'ABRIR FICHA · BUSCAR '+E(x.seller)+' A '+EUR(x.price))+'</a></div></article>'}).join("");
}
window.CVManualOpportunities={render};setTimeout(render,50);document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
})();