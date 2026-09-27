(()=>{const N=v=>Number(v)||0,E=v=>{const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML},EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
state.manualOpportunities=Array.isArray(state.manualOpportunities)?state.manualOpportunities:[];
const id="lorcana-donald-pie-slinger-v2-20260927";
if(!state.manualOpportunities.some(x=>x.id===id)){
 state.manualOpportunities.push({id,universe:"lorcana",name:"Donald Duck - Pie Slinger (V.2)",set:"Shimmering Skies",number:"214/204",variant:"Enchanted · V.2 · Foil",condition:"NM",shop:"Cardmarket",seller:"BKJ38",price:44.90,trend:116.36,avg30:76.69,avg7:101.80,avg1:138.18,available:47,url:"https://www.cardmarket.com/es/Lorcana/Products/Singles/Shimmering-Skies/Donald-Duck-Pie-Slinger-V2",checkedAt:"2026-09-27T14:20:00+02:00",expiresAt:"2026-09-28T14:20:00+02:00",status:"PRIORIDAD · VERIFICAR OFERTA ANTES DE PAGAR"});save();
}
function cash(){try{return Math.max(0,window.investmentLedgerStats?.().netCash||0)}catch{return 0}}
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 let box=document.querySelector("#manualOpportunityPanel");if(!box){box=document.createElement("section");box.id="manualOpportunityPanel";box.className="simpleSection";host.prepend(box)}
 const x=state.manualOpportunities.find(z=>z.id===id);if(!x)return;
 const stale=new Date(x.expiresAt)<=new Date(),c=cash(),netExit=N(x.trend)*.95,potential=netExit-N(x.price);
 box.innerHTML='<div class="simpleTitle"><h3>Oportunidad verificada manualmente</h3><span>LORCANA</span></div><article class="buyTile"><div class="buyNoPhoto">LORCANA<br>ENCHANTED</div><div class="buyBody"><div class="buyKicker">'+(stale?'REVERIFICAR PRECIO':'PRIORIDAD DE COMPRA')+'</div><h3>'+E(x.name)+'</h3><small>'+E(x.set)+' · '+E(x.number)+' · '+E(x.variant)+' · '+E(x.condition)+'</small><div class="buyNumbers"><div><span>Oferta observada</span><b>'+EUR(x.price)+'</b></div><div><span>Tendencia</span><b>'+EUR(x.trend)+'</b></div><div><span>Media 7 días</span><b>'+EUR(x.avg7)+'</b></div><div><span>Potencial neto aprox.</span><b>'+EUR(potential)+'</b></div></div><div class="buyWhy">Cardmarket: '+x.available+' disponibles · vendedor observado '+E(x.seller)+' · NM a '+EUR(x.price)+'. La tendencia no garantiza una reventa futura.</div><div class="buyWhy">'+(c>=x.price?'✓ CABE EN CAJA · quedarían '+EUR(c-x.price):'Caja registrada '+EUR(c)+' · faltan '+EUR(x.price-c))+'</div><a class="buyButton" href="'+E(x.url)+'" target="_blank" rel="noopener">ABRIR FICHA · BUSCAR '+E(x.seller)+' A '+EUR(x.price)+'</a></div></article>';
}
window.CVManualOpportunities={render};setTimeout(render,50);document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
})();