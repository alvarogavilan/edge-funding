(()=>{"use strict";
const N=v=>Number(v)||0;
function today(){return new Date().toISOString().slice(0,10)}
/* Lectura estricta de importes en € (formato español). null = cancelado; NaN = inválido. */
function askMoney(msg,def){const raw=prompt(msg,def);if(raw==null)return null;const c=window.CVMoney?window.CVMoney.cents(raw):Math.round(Number(String(raw).replace(",","."))*100);return Number.isFinite(c)&&c>=0?c:NaN}
function sell(cardId){
 const c=(state.cards||[]).find(x=>x.id===cardId&&!x.archivedSold);if(!c)return false;
 const held=Math.max(1,Math.floor(N(c.quantity)||1));
 let qty=1;
 if(held>1){const raw=prompt("¿Cuántas unidades has vendido? Máximo "+held,"1");if(raw==null)return false;qty=Math.floor(Number(String(raw).trim()));if(!(qty>=1&&qty<=held)){alert("Cantidad no válida: debe estar entre 1 y "+held+". Venta NO registrada.");return false}}
 const priceC=askMoney("Precio real vendido por unidad (€):",String(c.value||c.purchase||""));if(priceC===null)return false;if(!(priceC>0)){alert("Precio no válido. Venta NO registrada.");return false}
 const feesC=askMoney("Comisiones totales de esta venta (€):","0");if(feesC===null)return false;if(Number.isNaN(feesC)){alert("Comisión no válida. Venta NO registrada.");return false}
 const shipC=askMoney("Coste de envío que pagas tú (€):","0");if(shipC===null)return false;if(Number.isNaN(shipC)){alert("Envío no válido. Venta NO registrada.");return false}
 const price=priceC/100,fees=feesC/100,shipping=shipC/100;
 const channel=(prompt("Canal de venta:","Cardmarket")||"").trim()||"Sin especificar";
 const saleOrder=(prompt("Número de pedido / referencia (opcional):","")||"").trim();{const dup=window.CVConflictGuard?.saleOrderTaken?.(saleOrder)||(saleOrder&&(state.saleHistory||[]).find(h=>h.saleOrder===saleOrder&&h.channel===channel));if(dup){alert("El pedido #"+saleOrder+" ya está registrado ("+(dup.name||dup.id)+"). Venta NO registrada para evitar duplicado.");return false}}
 const saleNotes=(prompt("Notas de la venta (opcional):","")||"").trim();
 const netC=priceC*qty-feesC-shipC;
 if(!confirm("Registrar venta de "+qty+" × "+c.name+" a "+price.toLocaleString("es-ES",{style:"currency",currency:"EUR"})+" por unidad? Ingreso neto: "+(netC/100).toLocaleString("es-ES",{style:"currency",currency:"EUR"})))return false;
 // Operación completa o nada: copia del estado antes de modificarlo.
 const backup=window.CVStateBridge?.snapshot?.();
 const M=window.CVMoney,basis=M?M.basisForUnits(c,qty):{cents:null,status:"desconocido"},res=M?M.result(netC,basis):{cents:null,estimateCents:null,status:"desconocido"};
 state.investmentLedger=Array.isArray(state.investmentLedger)?state.investmentLedger:[];
 const id="sale-card-"+c.id+"-"+Date.now();
 state.investmentLedger.push({
  id,type:"sell",assetType:"card",assetKey:"card:"+c.id,name:c.name,date:today(),qty,unitPrice:price,
  shipping,fees,sourceUrl:"",notes:"Venta registrada desde Mi colección · envío pendiente · después cobro pendiente",
  fulfillmentStatus:"sold-awaiting-shipment",basisUnknown:basis.status!=="pagado",updatedAt:new Date().toISOString()
 });
 state.saleHistory=Array.isArray(state.saleHistory)?state.saleHistory:[];
 const snap={
  universe:c.universe||"pokemon",name:c.name||"",set:c.set||"",number:c.number||"",year:c.year||"",language:c.language||"",
  variant:c.buyVariant||c.variant||"",condition:c.buyCondition||c.condition||c.grade||"",grading:c.grading||"",grade:c.grade||"",cert:c.cert||"",
  referenceImage:c.referenceImage||"",photoKey:c.photoKey||"",quantity:qty,purchase:c.purchase??null,purchaseDate:c.purchaseDate||"",
  purchaseShipping:c.purchaseShipping??null,purchaseFees:c.purchaseFees??null,landedCostUnit:c.landedCostUnit??null,purchaseCosts:c.purchaseCosts||null,buyCountry:c.buyCountry||"",
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
 state.saleHistory.push({
  id,cardId:c.id,...snap,cardSnapshot:snap,qty,unitPrice:price,shipping,fees,net:netC/100,netCents:netC,soldAt:today(),channel,saleOrder,saleNotes,
  basisCents:basis.cents,basisKnownCents:basis.knownCents??null,basisStatus:basis.status,basis:basis.cents==null?null:basis.cents/100,costUnits:{from:basis.from,to:basis.to},
  landedCostUnit:basis.cents==null?null:basis.cents/qty/100,resultCents:res.cents,resultEstimateCents:res.estimateCents,resultStatus:res.status,
  fulfillmentStatus:"sold-awaiting-shipment",basisUnknown:basis.status!=="pagado",archiveSnapshotAt:new Date().toISOString()
 });
 if(M)M.consume(c,qty);
 if(qty>=held){
  c.archivedSold=true;c.soldAt=today();c.soldPrice=price;c.soldQty=qty;c.soldFees=fees;c.soldShipping=shipping;
 }else{
  c.quantity=held-qty;
  c.lastPartialSaleAt=today();c.lastPartialSalePrice=price;
 }
 if(save()===false){if(backup)window.CVStateBridge.restore(backup);try{window.CVRenderCollection?.()}catch{}alert("NO se ha guardado la venta: el almacenamiento del navegador ha fallado ("+(window.CVLastSaveError||"error")+"). No se ha registrado nada; tus datos siguen como antes. Exporta una copia o libera espacio y vuelve a intentarlo.");return false}
 try{window.CVRenderCollection?.()}catch{}
 try{window.renderInvestmentLedger?.()}catch{}
 try{window.CVSalesHistory?.render?.()}catch{}try{window.CVArchive?.render?.()}catch{}
 try{window.CVFinalOps?.render?.()}catch{}
 alert("Venta guardada · ENVÍO PENDIENTE. No entra en caja hasta confirmar envío y después confirmar el cobro.");
 return true;
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-cv-sell]");if(!b)return;
 e.preventDefault();e.stopPropagation();sell(b.dataset.cvSell);
});
window.CVCollectionSales={sell};
})();