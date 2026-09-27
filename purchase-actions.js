(()=>{"use strict";
const N=v=>Number(v)||0;
function esc(v){return String(v??"")}
function today(){return new Date().toISOString().slice(0,10)}
function strictRow(key){
  const api=window.CVStrictOpportunity;
  if(!api)return null;
  const rows=[...(api.manualRows?.()||[]),...(api.euRows?.()||[]),...(api.sealedRows?.()||[])];
  return rows.find(x=>x.purchaseKey===key)||null;
}
function sourceFor(key){
  const [kind,id]=String(key||"").split(":");
  if(kind==="manual")return {kind,id,row:(state.manualOpportunities||[]).find(x=>x.id===id)||null};
  if(kind==="eu")return {kind,id,row:(state.euOffers||[]).find(x=>x.id===id)||null};
  if(kind==="sealed")return {kind,id,row:(state.sealedProducts||[]).find(x=>x.id===id)||null};
  return null;
}
function saleText(x,row){
  const bits=[x.name,x.number,x.set,row?.meta?.variant||x.variant,row?.meta?.language||x.offerLanguage||x.language,row?.meta?.condition||x.condition].filter(Boolean);
  return bits.join(" · ")+" · procedencia "+(row?.meta?.seller||x.seller||x.shop||"oferta verificada")+". Conservada para inversión/reventa; comprobar estado final antes de publicar.";
}
function addCardPurchase(src,row,qty=1){
  const x=src.row, id=crypto.randomUUID(), language=row.meta?.language||x.offerLanguage||x.language||"", condition=row.meta?.condition||x.condition||"";
  const value=N(row.target)>0?N(row.target):N(row.price), purchase=N(row.price);
  const description=saleText(x,row);
  const card={
    id,universe:x.universe||row.universe||"pokemon",name:x.name||row.name,set:x.set||row.set||"",number:x.number||row.number||"",
    year:"",language,grading:"RAW",grade:condition,value,purchase,quantity:qty,purchaseDate:today(),purpose:"investment",
    cert:"",draft:false,identityVerifiedAt:new Date().toISOString(),identityVerifiedBy:"verified-opportunity",
    marketPricing:{value,currency:"EUR",source:"Card Vault · salida conservadora verificada",url:row.source||row.buyUrl||"",checkedAt:today()},
    buySourceUrl:row.buyUrl||row.source||"",buySeller:row.meta?.seller||x.seller||"",buyVariant:row.meta?.variant||x.variant||"",
    saleDescription:description,notes:"Compra registrada desde COMPRAR AHORA. Descripción de venta: "+description,
    createdAt:new Date().toISOString(),icon:"🃏"
  };
  state.cards=Array.isArray(state.cards)?state.cards:[];
  state.cards.push(card);
  state.investmentLedger=Array.isArray(state.investmentLedger)?state.investmentLedger:[];
  state.investmentLedger.push({
    id:"buy-"+id,type:"buy",assetType:"card",assetKey:"card:"+id,name:card.name,date:today(),qty,
    unitPrice:purchase,shipping:0,fees:0,sourceUrl:row.buyUrl||row.source||"",
    notes:"Compra desde oportunidad verificada · "+description,
    fundingSource:"owner-external",cashImpact:false,updatedAt:new Date().toISOString()
  });
  if(src.kind==="manual"){
    x.purchasedQty=N(x.purchasedQty)+qty;x.purchasedAt=new Date().toISOString();
    if(x.approval==="BUY-ONE")x.approval="PURCHASED";
    x.status=x.approval==="PURCHASED"?"COMPRADA · EN MI COLECCIÓN":x.status;
  }
  return card;
}
function addSealedPurchase(src,row,qty=1){
  const p=src.row;
  p.ownedQuantity=N(p.ownedQuantity)+qty;
  p.purchasePrice=N(row.price);p.purchaseDate=today();p.purpose="investment";
  p.saleDescription=[p.name,p.set,p.productType,p.language].filter(Boolean).join(" · ")+" · producto sellado para inversión/reventa.";
  state.investmentLedger=Array.isArray(state.investmentLedger)?state.investmentLedger:[];
  state.investmentLedger.push({
    id:"buy-sealed-"+crypto.randomUUID(),type:"buy",assetType:"sealed",assetKey:"sealed:"+p.id,name:p.name,date:today(),qty,
    unitPrice:N(row.price),shipping:0,fees:0,sourceUrl:row.buyUrl||row.source||"",
    notes:"Compra sellada desde COMPRAR AHORA · "+p.saleDescription,
    fundingSource:"owner-external",cashImpact:false,updatedAt:new Date().toISOString()
  });
  return p;
}
function buy(key){
  const row=strictRow(key),src=sourceFor(key);
  if(!row||!src?.row){alert("La oportunidad ya no está disponible o necesita volver a verificarse.");return}
  if(row.status!=="buy"){alert("Esta oportunidad ya no cumple COMPRAR AHORA. Refresca el mercado antes de registrar la compra.");return}
  let qty=1;
  if(src.kind==="manual"&&src.row.approval==="BUY-SCALE"){
    const raw=prompt("¿Cuántas unidades has comprado?","1");if(raw==null)return;qty=Math.max(1,Math.floor(N(raw)||1));
  }
  if(!confirm("Registrar "+qty+" × "+row.name+" a "+N(row.price).toLocaleString("es-ES",{style:"currency",currency:"EUR"})+" como compra realizada?"))return;
  const result=src.kind==="sealed"?addSealedPurchase(src,row,qty):addCardPurchase(src,row,qty);
  save();
  try{window.CVRenderCollection?.()}catch{}
  try{window.renderInvestmentLedger?.()}catch{}
  try{window.renderOpportunityEngine?.()}catch{}
  try{window.CVManualOpportunities?.render?.()}catch{}
  try{window.CVFinalOps?.render?.()}catch{}
  alert("Compra añadida: "+result.name+". Ya está registrada en tu biblioteca y en el libro de inversión.");
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-cv-bought]");if(!b)return;
  e.preventDefault();e.stopPropagation();buy(b.dataset.cvBought);
});
window.CVPurchaseActions={buy};
})();