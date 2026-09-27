(()=>{"use strict";
const N=v=>Number(v)||0;
function today(){return new Date().toISOString().slice(0,10)}
function sell(cardId){
 const c=(state.cards||[]).find(x=>x.id===cardId&&!x.archivedSold);if(!c)return;
 const held=Math.max(1,Math.floor(N(c.quantity)||1));
 let qty=1;
 if(held>1){const raw=prompt("¿Cuántas unidades has vendido? Máximo "+held,"1");if(raw==null)return;qty=Math.max(1,Math.min(held,Math.floor(N(raw)||1)))}
 const rawPrice=prompt("Precio real vendido por unidad (€):",String(c.value||c.purchase||""));if(rawPrice==null)return;
 const price=N(String(rawPrice).replace(",","."));if(!(price>0))return;
 const rawFees=prompt("Comisiones totales de esta venta (€):","0");if(rawFees==null)return;const fees=Math.max(0,N(String(rawFees).replace(",",".")));
 const rawShip=prompt("Coste de envío que pagas tú (€):","0");if(rawShip==null)return;const shipping=Math.max(0,N(String(rawShip).replace(",",".")));
 if(!confirm("Registrar venta de "+qty+" × "+c.name+" a "+price.toLocaleString("es-ES",{style:"currency",currency:"EUR"})+" por unidad?"))return;
 state.investmentLedger=Array.isArray(state.investmentLedger)?state.investmentLedger:[];
 const id="sale-card-"+c.id+"-"+Date.now();
 state.investmentLedger.push({
  id,type:"sell",assetType:"card",assetKey:"card:"+c.id,name:c.name,date:today(),qty,unitPrice:price,
  shipping,fees,sourceUrl:"",notes:"Venta registrada desde Mi colección · pendiente de cobro confirmado",
  fulfillmentStatus:"sold-awaiting-payment",basisUnknown:c.purchase==null,updatedAt:new Date().toISOString()
 });
 state.saleHistory=Array.isArray(state.saleHistory)?state.saleHistory:[];
 state.saleHistory.push({
  id,cardId:c.id,name:c.name,set:c.set||"",number:c.number||"",language:c.language||"",grade:c.grade||"",
  grading:c.grading||"RAW",qty,unitPrice:price,shipping,fees,net:price*qty-shipping-fees,soldAt:today(),
  fulfillmentStatus:"sold-awaiting-payment",purchase:c.purchase??null,saleDescription:c.saleDescription||""
 });
 if(qty>=held){
  c.archivedSold=true;c.soldAt=today();c.soldPrice=price;c.soldQty=qty;c.soldFees=fees;c.soldShipping=shipping;
 }else{
  c.quantity=held-qty;
  c.lastPartialSaleAt=today();c.lastPartialSalePrice=price;
 }
 save();
 try{window.CVRenderCollection?.()}catch{}
 try{window.renderInvestmentLedger?.()}catch{}
 try{window.CVSalesHistory?.render?.()}catch{}try{window.CVArchive?.render?.()}catch{}
 try{window.CVFinalOps?.render?.()}catch{}
 alert("Venta registrada. No entra en caja hasta que confirmes el cobro.");
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-cv-sell]");if(!b)return;
 e.preventDefault();e.stopPropagation();sell(b.dataset.cvSell);
});
window.CVCollectionSales={sell};
})();