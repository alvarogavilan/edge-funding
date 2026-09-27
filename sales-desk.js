(()=>{
const Q=s=>document.querySelector(s),N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"}),E=v=>{const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML};
state.saleListings=Array.isArray(state.saleListings)?state.saleListings:[];
const seed=[
 {id:"listing-charizard-obf228",cardId:"cha228",channel:"Cardmarket",price:44.90,floor:39.90,status:"active",condition:"PSA 8",note:"PSA 8 · slab original"},
 {id:"listing-charizard-svp074",cardId:"cha074",channel:"Cardmarket",price:44.90,floor:39.90,status:"active",condition:"PSA 9",note:"PSA 9 · slab original"},
 {id:"listing-vaporeon-pre149",cardId:"vap149",channel:"Cardmarket",price:229.90,floor:199.90,status:"active",condition:"PSA 9",note:"PSA 9 · slab original"}
];
for(const x of seed)if(!state.saleListings.some(y=>y.id===x.id))state.saleListings.push({...x,listedAt:"2026-09-27",updatedAt:new Date().toISOString()});
if(!state.userConfirmedListingsV881){
 const confirmed=[
  {id:"listing-gyarados-xy9",cardId:"own-gyarados-ex-089-xy9-jp",channel:"Cardmarket",price:169.90,status:"active",condition:"GD",note:"ANUNCIO ACTIVO confirmado por captura del usuario · 27/09/2026"},
  {id:"listing-mewtwo-ec1",cardId:"own-mewtwo-118-ec1-jp-1ed-holo",channel:"Cardmarket",price:149.90,status:"active",condition:"PO",note:"ANUNCIO ACTIVO confirmado por captura del usuario · 27/09/2026"},
  {id:"listing-surfing-pikachu-v1",cardId:"own-surfing-pikachu-mt-fuji-jr-1997",channel:"Cardmarket",price:229.90,status:"active",condition:"PO",note:"ANUNCIO ACTIVO confirmado por captura del usuario · 27/09/2026"}
 ];
 for(const x of confirmed){
  const cur=(state.saleListings||[]).find(y=>y.id===x.id);
  if(cur)Object.assign(cur,x,{floor:cur.floor??0,pauseReason:"",updatedAt:new Date().toISOString(),userConfirmed:true});
  else state.saleListings.push({...x,floor:0,listedAt:"2026-09-27",updatedAt:new Date().toISOString(),userConfirmed:true});
 }
 state.userConfirmedListingsV881=true;save();
}

if(!state.salesLegacyPauseV870){
 const legacyIds=new Set(["listing-gyarados-xy9","listing-mewtwo-ec1","listing-surfing-pikachu-v1"]);
 for(const x of state.saleListings||[])if(legacyIds.has(x.id)&&x.status==="active"&&!x.exitEvidence?.at&&!x.userConfirmed){
  x.status="paused";x.pauseReason="Pausado V87.0: precio heredado sin evidencia PRIME actual";x.updatedAt=new Date().toISOString();
 }
 state.salesLegacyPauseV870=true;save();
}
save();

function reconcileUserConfirmedListings(){
 const truth={
  "listing-gyarados-xy9":{cardId:"own-gyarados-ex-089-xy9-jp",price:169.90,condition:"GD"},
  "listing-mewtwo-ec1":{cardId:"own-mewtwo-118-ec1-jp-1ed-holo",price:149.90,condition:"PO"},
  "listing-surfing-pikachu-v1":{cardId:"own-surfing-pikachu-mt-fuji-jr-1997",price:229.90,condition:"PO"}
 };
 let changed=false;
 for(const [id,t] of Object.entries(truth)){
  const x=(state.saleListings||[]).find(r=>r.id===id);if(!x)continue;
  if(x.userConfirmed&&x.status!=="sold"&&x.status!=="archived"){
   if(x.status!=="active"){x.status="active";changed=true}
   if(!x.channel){x.channel="Cardmarket";changed=true}
   if(!x.condition){x.condition=t.condition;changed=true}
   if(!N(x.price)){x.price=t.price;changed=true}
   x.pauseReason="";
  }
 }
 if(changed)save();
}
reconcileUserConfirmedListings();
function card(id){return (state.cards||[]).find(c=>c.id===id)}
function active(){return state.saleListings.filter(x=>x.status==="active"&&card(x.cardId)&&!card(x.cardId).archivedSold)}
function pol(){return window.CVPrimeExitPricing?.policy?.()||{feePct:5,sellShipping:0}}
function expectedNet(x){const p=pol();return N(x.price)*(1-p.feePct/100)-N(p.sellShipping)}
function markSold(id){
 const x=state.saleListings.find(z=>z.id===id),c=x&&card(x.cardId);if(!x||!c)return;
 const raw=prompt("Precio real vendido (€):",String(x.price));if(raw==null)return;const price=N(String(raw).replace(",","."));
 if(!(price>0))return;
 const feeRaw=prompt("Comisión/gastos totales (€):",(price*pol().feePct/100).toFixed(2));if(feeRaw==null)return;const fees=Math.max(0,N(String(feeRaw).replace(",",".")));
 const shipRaw=prompt("Coste de envío que pagas tú (€):","0");if(shipRaw==null)return;const shipping=Math.max(0,N(String(shipRaw).replace(",",".")));
 const saleOrder=(prompt("Número de pedido / referencia (opcional):","")||"").trim();{const dup=window.CVConflictGuard?.saleOrderTaken?.(saleOrder);if(dup){alert("El pedido #"+saleOrder+" ya está registrado ("+(dup.name||dup.id)+"). Venta NO registrada para evitar duplicado.");return}}
 const saleNotes=(prompt("Notas de la venta (opcional):","")||"").trim();
 const date=new Date().toISOString().slice(0,10);
 const ledgerId="sale-"+x.id+"-"+date;
 if(!Array.isArray(state.investmentLedger))state.investmentLedger=[];
 if(!state.investmentLedger.some(r=>r.id===ledgerId))state.investmentLedger.push({
  id:ledgerId,type:"sell",assetType:"card",assetKey:"card:"+c.id,name:c.name+(String(c.grading||"RAW").toUpperCase()!=="RAW"&&c.grade?(" · "+String(c.grading).toUpperCase()+" "+c.grade):""),date,qty:1,unitPrice:price,shipping,fees,sourceUrl:"",notes:"Venta Cardmarket registrada desde Sales Desk · envío pendiente",basisUnknown:c.purchase==null,fulfillmentStatus:"sold-awaiting-shipment",updatedAt:new Date().toISOString()
 });
 state.saleHistory=Array.isArray(state.saleHistory)?state.saleHistory:[];
 const snap={
  universe:c.universe||"pokemon",name:c.name||"",set:c.set||"",number:c.number||"",year:c.year||"",language:c.language||"",
  variant:c.buyVariant||c.variant||"",condition:c.buyCondition||c.condition||c.grade||"",grading:c.grading||"RAW",grade:c.grade||"",cert:c.cert||"",
  referenceImage:c.referenceImage||"",photoKey:c.photoKey||"",quantity:1,purchase:c.purchase??null,purchaseDate:c.purchaseDate||"",
  purchaseShipping:c.purchaseShipping??0,purchaseFees:c.purchaseFees??0,landedCostUnit:c.landedCostUnit??null,
  seller:c.buySeller||c.seller||"",purchaseUrl:c.buySourceUrl||c.marketPricing?.url||"",marketUrl:c.marketPricing?.url||c.buySourceUrl||"",
  saleDescription:c.saleDescription||"",description:c.description||"",notes:c.notes||"",purpose:c.purpose||"",
  acquisitionSource:c.acquisitionSource||"",acquisitionType:c.acquisitionType||"",acquisitionNotes:c.acquisitionNotes||"",
  parentProductCostEUR:c.parentProductCostEUR??null,parentProductCostApprox:!!c.parentProductCostApprox,
  popGrade:c.popGrade??null,popHigher:c.popHigher??null,popTotal:c.popTotal??null,popSource:c.popSource||"",popUrl:c.popUrl||"",popCheckedAt:c.popCheckedAt||"",
  marketPricing:c.marketPricing||null,gradedValuation:c.gradedValuation||null,conditionMarket:c.conditionMarket||null,
  buyOpportunityId:c.buyOpportunityId||"",buySource:c.buySource||"",buyVariant:c.buyVariant||"",buyLanguage:c.buyLanguage||"",
  buyCondition:c.buyCondition||"",buySeller:c.buySeller||"",buySourceUrl:c.buySourceUrl||"",boughtAt:c.boughtAt||"",
  purchaseThesis:c.purchaseThesis?JSON.parse(JSON.stringify(c.purchaseThesis)):null
 };
 if(!state.saleHistory.some(h=>h.id===ledgerId))state.saleHistory.push({
  id:ledgerId,cardId:c.id,...snap,cardSnapshot:snap,qty:1,unitPrice:price,shipping,fees,net:price-shipping-fees,soldAt:date,channel:x.channel||"Cardmarket",
  saleOrder,saleNotes,fulfillmentStatus:"sold-awaiting-shipment",basisUnknown:c.purchase==null,archiveSnapshotAt:new Date().toISOString()
 });
 x.status="sold";x.soldPrice=price;x.soldFees=fees;x.soldAt=date;x.updatedAt=new Date().toISOString();
 c.archivedSold=true;c.soldAt=date;c.soldPrice=price;c.soldFees=fees;c.soldShipping=shipping;
 save();render();try{window.renderInvestmentLedger?.();window.CVSalesHistory?.render?.();window.CVArchive?.render?.();window.CVReinvestmentCommittee?.render?.();window.CVFinalOps?.render?.()}catch{}
 alert("Venta registrada · ENVÍO PENDIENTE. No entra en caja hasta confirmar envío y después cobro.");
}
function editPrice(id){
 const x=state.saleListings.find(z=>z.id===id);if(!x)return;
 const p=prompt("Nuevo precio publicado (€):",String(x.price));if(p==null)return;const v=N(String(p).replace(",","."));
 if(!(v>0))return;x.price=v;x.updatedAt=new Date().toISOString();save();render()
}
function remove(id){const x=state.saleListings.find(z=>z.id===id);if(!x)return;x.status="paused";x.updatedAt=new Date().toISOString();save();render()}
function addCapital(){
 const raw=prompt("¿Cuánto capital quieres añadir a Card Vault (€)?","50");if(raw==null)return;
 const amount=N(String(raw).replace(",","."));if(!(amount>0))return;
 if(!Array.isArray(state.investmentLedger))state.investmentLedger=[];
 state.investmentLedger.push({id:"capital-"+Date.now(),type:"capital",assetType:"other",assetKey:"",name:"Aportación de capital",date:new Date().toISOString().slice(0,10),qty:1,unitPrice:amount,shipping:0,fees:0,sourceUrl:"",notes:"Capital añadido por el propietario para nuevas oportunidades",updatedAt:new Date().toISOString()});
 save();render();try{window.renderInvestmentLedger?.();window.CVReinvestmentCommittee?.render?.();window.CVFinalOps?.render?.();window.CVTodaySimple?.render?.();window.CVManualOpportunities?.render?.()}catch{}
}
function render(){
 const b=Q("#salesDeskPanel");if(!b)return;const rows=active(),gross=rows.reduce((a,x)=>a+N(x.price),0),net=rows.reduce((a,x)=>a+expectedNet(x),0),P=pol();
 const opt=v=>v==null?'SIN DATO':EUR(v),sg=v=>v==null?'SIN DATO':(v>=0?'+':'')+EUR(v);
 const pxs=rows.map(x=>({x,c:card(x.cardId),px:window.CVPrimeExitPricing?.calc?.(x,card(x.cardId))||null}));
 const below=pxs.filter(r=>r.px&&r.px.alerts.some(a=>a.level==="high")).length;
 b.innerHTML='<div class="sectionHead"><h3>Ventas activas · Sales Desk PRIME</h3><div class="miniActions"><button id="addCapitalNow">+ Añadir capital</button><button type="button" data-sale-policy="1">Comisión '+P.feePct+'% · envío '+EUR(P.sellShipping)+'</button></div></div>'+
 '<div class="statsGrid"><div><span>Anuncios activos</span><b>'+rows.length+'</b></div><div><span>Bruto si venden todos</span><b>'+EUR(gross)+'</b></div><div><span>Neto tras comisión/envío</span><b>'+EUR(net)+'</b></div><div><span>Alertas de precio</span><b>'+below+'</b></div></div>'+
 (rows.length?pxs.map(({x,c,px})=>{
  const al=px?px.alerts:[],hi=al.some(a=>a.level==="high");
  const ev=px?(px.executable?'EJECUTABLE · '+E(px.source)+' · '+Math.floor(px.age)+' h':(px.evidenceAt?(px.idOk?'CADUCADA':'IDENTIDAD DISTINTA'):'SIN EVIDENCIA')):'—';
  return '<article class="sealedCard'+(hi?' priceAlert':'')+'"><div class="sealedMain"><div><span class="pill">'+E(x.condition||"")+'</span><h4>'+E(c?.name||x.cardId)+'</h4><small>'+E(x.channel)+' · '+E(x.note||"")+'</small></div><div class="sealedNumbers"><b>'+EUR(x.price)+'</b><span>neto '+EUR(expectedNet(x))+(px&&px.listedProfit!=null?' · '+sg(px.listedProfit):'')+'</span></div></div>'+
  al.map(a=>'<div class="microNote alert-'+a.level+'">'+(a.level==="high"?'⛔ ':a.level==="mid"?'⚠️ ':'ℹ️ ')+E(a.text)+'</div>').join("")+
  (px?'<div class="exitGrid">'+
   '<div><span>Coste aterrizado</span><b>'+opt(px.landed)+'</b></div>'+
   '<div><span>Break-even</span><b>'+opt(px.breakEven)+'</b></div>'+
   '<div><span>Objetivo +'+EUR(px.minProfit)+'</span><b>'+opt(px.targetFloor)+'</b></div>'+
   '<div><span>Precio sugerido</span><b>'+EUR(px.ask)+'</b></div>'+
   '<div><span>Beneficio neto sugerido</span><b>'+sg(px.profit)+(px.roi==null?'':' · '+px.roi.toFixed(0)+'%')+'</b></div>'+
   '<div><span>Rotación</span><b>'+E(px.rotation)+'</b></div>'+
  '</div>'+
  '<details class="exitDetails"><summary>Evidencia de salida · '+ev+'</summary>'+
   '<div class="qaRow"><span>Comparable más bajo</span><b>'+opt(px.lowestAsk)+'</b></div>'+
   '<div class="qaRow"><span>Mediana ventas reales</span><b>'+(px.soldMedian?EUR(px.soldMedian)+' · '+px.soldSample+' comps':'SIN DATO')+'</b></div>'+
   '<div class="qaRow"><span>Ventas 30d · vendedores · profundidad</span><b>'+(px.sales30??'—')+' · '+(px.sellers??'—')+' · '+px.depth+' niveles</b></div>'+
   '<div class="qaRow"><span>Posición de tu anuncio</span><b>'+(px.position?'nº '+px.position.rank+' de '+px.position.of+' comparables':'SIN ESCALERA')+'</b></div>'+
   '<div class="qaRow"><span>Mínimo interno</span><b>'+EUR(x.floor)+'</b></div>'+
   '<div class="qaRow"><span>Comisión · envío</span><b>'+px.feePct+'% · '+EUR(px.sellShipping)+'</b></div>'+
   (px.url?'<a href="'+E(px.url)+'" target="_blank" rel="noopener">Abrir evidencia</a>':'')+
   '<small>El precio sugerido nunca se aplica solo: cambia el anuncio real en Cardmarket y después actualiza aquí.</small>'+
  '</details>':'')+
  '<div class="sealedActions primaryOnly"><button class="primaryAction" data-sale-sold="'+E(x.id)+'">Marcar vendida</button></div>'+
  '<details class="moreActions"><summary>Más acciones</summary><div class="sealedActions"><button data-sale-evidence="'+E(x.id)+'">Evidencia salida</button><button data-sale-edit="'+E(x.id)+'">Cambiar precio</button><button data-sale-pause="'+E(x.id)+'">Pausar</button></div></details></article>'}).join(""):'<div class="emptyState"><b>No hay anuncios activos.</b><span>Cuando marques una venta, sale de la colección activa pero NO entra en caja hasta confirmar el cobro en Operaciones.</span></div>')+
 '<small>Neto = precio × (1 − comisión) − envío configurado. Break-even = coste aterrizado recuperado; objetivo = break-even + beneficio mínimo de la política. Sin coste conocido no hay floor ni ROI.</small>';
 Q("#addCapitalNow")?.addEventListener("click",addCapital);
 b.querySelectorAll("[data-sale-edit]").forEach(el=>el.onclick=()=>editPrice(el.dataset.saleEdit));
 b.querySelectorAll("[data-sale-sold]").forEach(el=>el.onclick=()=>markSold(el.dataset.saleSold));
 b.querySelectorAll("[data-sale-pause]").forEach(el=>el.onclick=()=>remove(el.dataset.salePause));
}
window.CVSalesDesk={render,active,markSold,addCapital};render();
})();