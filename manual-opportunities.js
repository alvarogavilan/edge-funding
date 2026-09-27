(()=>{const N=v=>Number(v)||0,E=v=>{const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML},EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
state.manualOpportunities=Array.isArray(state.manualOpportunities)?state.manualOpportunities:[];
const id="lorcana-donald-pie-slinger-v2-20260927";
const caravanId="pokemon-ex-sandstorm-caravan-20260927";
if(!state.manualOpportunities.some(x=>x.id===caravanId)){
 state.manualOpportunities.push({id:caravanId,universe:"pokemon",name:"EX Sandstorm: Caravan Theme Deck",set:"EX Sandstorm",number:"",variant:"Sealed Theme Deck",condition:"SEALED",shop:"Cardmarket",seller:"halver93",price:15.00,backupPrice:50.00,trend:119.43,avg30:65.15,avg7:65.15,avg1:100.00,available:9,url:"https://www.cardmarket.com/en/Pokemon/Products/Theme-Decks/EX-Sandstorm-Caravan-Theme-Deck",checkedAt:"2026-09-27T16:25:00+02:00",expiresAt:"2026-09-28T16:25:00+02:00",status:"ANOMALÍA · VERIFICAR SELLADO Y CONTENIDO",approval:"WATCH"});save();
}
if(!state.manualOpportunities.some(x=>x.id===id)){
 state.manualOpportunities.push({id,universe:"lorcana",name:"Donald Duck - Pie Slinger (V.2)",set:"Shimmering Skies",number:"214/204",variant:"Enchanted · V.2 · Foil",condition:"NM",shop:"Cardmarket",seller:"BKJ38",price:44.90,trend:116.36,avg30:76.69,avg7:101.80,avg1:138.18,available:47,url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/Shimmering-Skies/Donald-Duck-Pie-Slinger-V2",checkedAt:"2026-09-27T14:20:00+02:00",expiresAt:"2026-09-28T14:20:00+02:00",status:"PRIORIDAD · VERIFICAR OFERTA ANTES DE PAGAR"});save();
}
function positionSizing(x,c){
 const unit=N(x.price),trend=N(x.trend),avg30=N(x.avg30),available=N(x.available);
 const floor=Math.min(trend||Infinity,avg30||Infinity);
 const conservativeExit=isFinite(floor)?floor:0;
 const grossEdge=conservativeExit>unit?conservativeExit-unit:0;
 const roi=unit>0?grossEdge/unit*100:0;
 let maxUnits=1,reason="1 unidad por defecto";
 if(unit>=20&&roi>=50&&available>=20){maxUnits=2;reason="2 unidades máximo: descuento fuerte, pero aún sin evidencia de profundidad por tramos";}
 if(unit>=20&&roi>=80&&available>=40){maxUnits=3;reason="3 unidades solo si verificas varias ofertas equivalentes y aceptas concentración";}
 const affordable=unit>0?Math.floor(c/unit):0;
 return {conservativeExit,grossEdge,roi,maxUnits,affordable,recommended:Math.max(0,Math.min(maxUnits,affordable)),reason};
}
function cash(){try{return Math.max(0,window.investmentLedgerStats?.().netCash||0)}catch{return 0}}
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 let box=document.querySelector("#manualOpportunityPanel");if(!box){box=document.createElement("section");box.id="manualOpportunityPanel";box.className="simpleSection";host.prepend(box)}
 const rows=state.manualOpportunities.filter(z=>[id,caravanId].includes(z.id));
 if(!rows.length)return;const c=cash();
 box.innerHTML='<div class="simpleTitle"><h3>Oportunidades verificadas manualmente</h3><span>'+rows.length+'</span></div>'+rows.map(x=>{const stale=new Date(x.expiresAt)<=new Date(),netExit=N(x.trend)*.95,potential=netExit-N(x.price),isWatch=x.approval==="WATCH";const ps=positionSizing(x,c);return '<article class="buyTile"><div class="buyNoPhoto">'+E(x.universe.toUpperCase())+'<br>'+E(isWatch?"WATCH":"PRIORIDAD")+'</div><div class="buyBody"><div class="buyKicker">'+E(stale?"REVERIFICAR PRECIO":x.status)+'</div><h3>'+E(x.name)+'</h3><small>'+E([x.set,x.number,x.variant,x.condition].filter(Boolean).join(" · "))+'</small><div class="buyNumbers"><div><span>Oferta observada</span><b>'+EUR(x.price)+'</b></div><div><span>Tendencia</span><b>'+EUR(x.trend)+'</b></div><div><span>Media 30 días</span><b>'+EUR(x.avg30)+'</b></div><div><span>Potencial neto aprox.</span><b>'+EUR(potential)+'</b></div></div><div class="buyWhy">Cardmarket: '+E(x.available)+' disponibles · vendedor observado '+E(x.seller)+' · '+(isWatch?'precio extremadamente anómalo; confirmar que sea producto completo y sellado antes de considerar compra.':'la tendencia no garantiza una reventa futura.')+'</div><div class="buyWhy"><b>Tamaño de posición:</b> caja actual permite '+ps.affordable+' unidad(es); límite de riesgo '+ps.maxUnits+'; recomendación actual '+ps.recommended+'. '+E(ps.reason)+'</div><div class="buyWhy">'+(c>=x.price?'✓ CABE EN CAJA · quedarían '+EUR(c-x.price):'Caja registrada '+EUR(c)+' · faltan '+EUR(x.price-c))+(isWatch?' · NO APROBADA TODAVÍA':'')+'</div><a class="buyButton '+(isWatch?'secondary':'')+'" href="'+E(x.url)+'" target="_blank" rel="noopener">'+(isWatch?'ABRIR Y VERIFICAR ANOMALÍA':'ABRIR FICHA · BUSCAR '+E(x.seller)+' A '+EUR(x.price))+'</a></div></article>'}).join("");
}
window.CVManualOpportunities={render};setTimeout(render,50);document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
})();