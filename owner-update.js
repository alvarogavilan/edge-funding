(()=>{"use strict";
const s=window.CVStateBridge?.get?.();if(!s||s.ownerUpdate20261013)return;
const c=(s.cards||[]).find(c=>c.id==='own-surfing-pikachu-mt-fuji-jr-1997');
if(!c)return;
s.saleHistory=Array.isArray(s.saleHistory)?s.saleHistory:[];s.investmentLedger=Array.isArray(s.investmentLedger)?s.investmentLedger:[];
const id='sale-cardmarket-surfing-20261013',snapshot=JSON.parse(JSON.stringify(c));
snapshot.referenceImage=window.CVCardImages?.resolve?.(c)||c.referenceImage;
const existing=s.saleHistory.find(h=>h.cardId===c.id&&h.soldAt==='2026-10-13'&&Number(h.unitPrice)===160);
if(!existing){
 const sale={id,cardId:c.id,name:c.name,number:c.number,set:c.set,language:c.language,grading:c.grading,grade:c.grade,condition:c.condition,universe:c.universe,referenceImage:snapshot.referenceImage,cardSnapshot:snapshot,purchase:c.purchase??null,purchaseShipping:c.purchaseShipping??null,purchaseFees:c.purchaseFees??null,unitPrice:160,qty:1,shipping:null,fees:null,net:null,costsPending:true,soldAt:'2026-10-13',channel:'Cardmarket',fulfillmentStatus:'sold-awaiting-shipment',destinationCountry:'Italia',sourceEvidence:'user-confirmed',archiveNotes:'Venta confirmada por el propietario. Envío a Italia pendiente; portes y comisiones reales pendientes de registrar.'};
 s.saleHistory.push(sale);
 if(!s.investmentLedger.some(r=>r.id===id))s.investmentLedger.push({...sale,type:'sell',assetType:'card',assetKey:'card:'+c.id,date:sale.soldAt,basisUnknown:c.purchase==null,notes:sale.archiveNotes});
}
c.archivedSold=true;c.soldAt='2026-10-13';c.soldPrice=160;c.soldQty=1;
if(c.currentListing)c.currentListing={...c.currentListing,status:'sold',soldPriceEUR:160};
for(const r of s.saleListings||[])if(r.cardId===c.id&&r.status==='active'){r.status='sold';r.soldPriceEUR=160;r.soldAt='2026-10-13'}
s.treasuryCash={availableEUR:60,source:'Cardmarket',reportedAt:'2026-10-13',sourceEvidence:'user-confirmed',notes:'Caja actual procedente de Eevee PSA 9; snapshot, no aportación adicional ni modificación del precio histórico de venta.'};
const g=(s.cards||[]).find(c=>c.id==='own-gyarados-ex-089-xy9-jp');if(g)g.buyerInterest={status:'interested',reportedAt:'2026-10-13',source:'Cardmarket',sourceEvidence:'user-confirmed'};
s.ownerUpdate20261013=true;window.CVStateBridge.save();window.CVRenderCollection?.();
})();
