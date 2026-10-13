(()=>{"use strict";
const data=window.CVRetailSnapshot||{offers:[]},DAY=86400000;
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>Number(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const norm=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
const number=c=>String(c.number||String(c.name||"").match(/#([\d/]+)/)?.[1]||"").split('/')[0].replace(/^0+(?=\d)/,"");
const hosts=new Set(["www.tiendalorcanatcg.com","www.pokemillon.com","www.empiregames.es","www.eucollectibles.com"]);
function valid(r){try{const u=new URL(r.url);return !!(u.protocol==="https:"&&hosts.has(u.hostname)&&r.evidenceType==="ANUNCIO ACTIVO"&&Number(r.priceEUR)>=20&&r.name&&r.image&&r.language&&r.checkedAt)}catch{return false}}
function fresh(r,now=Date.now()){const at=Date.parse(r.checkedAt);return Number.isFinite(at)&&now>=at&&now-at<=DAY}
function owned(r){
 const s=window.CVStateBridge?.get?.();
 return (s?.cards||[]).some(c=>!c.archivedSold&&(c.universe||"pokemon")===r.universe&&number(c)&&number(c)===number(r)&&norm(c.set)===norm(r.set)&&(!c.language||norm(c.language)===norm(r.language)))||
  (r.kind==="sealed"&&(s?.sealedProducts||[]).some(c=>norm(c.name)===norm(r.name)));
}
function rows(kind,filter="all"){return (data.offers||[]).filter(r=>valid(r)&&r.kind===kind&&(!filter||filter==="all"||r.universe===filter)&&!owned(r))}
function count(kind,filter="all"){return rows(kind,filter).filter(r=>r.stock===true&&fresh(r)).length}
const date=r=>new Date(r.checkedAt).toLocaleString("es-ES",{timeZone:"Europe/Madrid",dateStyle:"short",timeStyle:"short"});
function card(r){
 const current=fresh(r)&&r.stock===true,shipping=r.shippingEUR==null?null:Number(r.shippingEUR),total=shipping==null?null:Number(r.priceEUR)+shipping;
 const flag=r.language==="Español"?"🇪🇸":r.language==="Japonés"?"🇯🇵":"🇬🇧";
 return '<article class="cyCard retailCard" data-retail-offer="'+E(r.id)+'"><div class="cyImg"><img src="'+E(r.image)+'" alt="'+E(r.name)+'" loading="lazy"></div><div class="cyBody">'+
 '<span class="cyBadge retail">'+(current?'OFERTA DISPONIBLE':'RECOMPROBAR OFERTA')+'</span><span class="cyGame">'+(r.universe==="lorcana"?'Lorcana':'Pokémon')+'</span><h4>'+E(r.displayName||r.name)+'</h4>'+
 '<p class="cyMeta">'+E([r.number,r.set,r.rarity].filter(Boolean).join(' · '))+'</p><p class="cyMeta">'+flag+' '+E(r.language)+' · '+E(r.grading==="RAW"?r.condition:r.grading==="SEALED"?r.condition:r.grading+' '+r.grade+' (según anuncio)')+'</p>'+
 '<dl class="cyGrid"><div><dt>Precio anunciado</dt><dd>'+EUR(r.priceEUR)+'</dd></div><div><dt>Total a península</dt><dd>'+(total==null?EUR(r.priceEUR)+' + portes':EUR(total))+'</dd></div><div><dt>Estado de la oferta</dt><dd>'+(current?'Stock comprobado':'Disponibilidad pendiente de actualizar')+'</dd></div><div><dt>Tipo de evidencia</dt><dd>ANUNCIO ACTIVO</dd></div><div class="wide"><dt>Vendedor</dt><dd>'+E(r.seller)+'</dd></div><div class="wide"><dt>Beneficio de reventa</dt><dd>SIN VERIFICAR · falta venta cerrada comparable</dd></div></dl>'+
 '<p class="cyNote">'+E(r.shippingNote)+' Comprobado: '+E(date(r))+'.</p>'+
 (r.grading==="PSA"?'<p class="cyNote">Certificado PSA pendiente de cotejar. El precio ≤40 € excluye portes.</p>':'')+
 '<div class="cyActions"><a class="cyBtn retailLink" href="'+E(r.url)+'" target="_blank" rel="noopener">'+(current?'Comprar en la tienda':'Ver disponibilidad actual')+'</a><button type="button" class="cyBtn" data-retail-bought="'+E(r.id)+'">He comprado</button></div></div></article>';
}
function html(kind,filter="all"){
 const all=rows(kind,filter);if(!all.length)return "";
 const n=count(kind,filter),heading=kind==="graded"?'PSA 10 anunciadas':kind==="sealed"?'Sellado':'Cartas';
 return '<section class="retailSection"><div class="cyHead"><span class="cyKicker">'+heading.toUpperCase()+' · PRECIOS Y STOCK DE TIENDAS</span><h2>'+n+' oferta(s) disponible(s) para comprar</h2><p>Precio, edición, idioma y stock observados en el vendedor. Estar disponible no acredita rentabilidad: solo se activa una recomendación de inversión con ventas cerradas comparables y el margen exigido. La comprobación caduca a las 24 horas.</p>'+(kind==='card'?'<div class="cyFilters" role="group" aria-label="Filtrar ofertas por juego">'+[['all','Todas'],['pokemon','Pokémon'],['lorcana','Lorcana']].map(([key,label])=>'<button type="button" data-cy-filter="'+key+'" class="'+(filter===key?'on':'')+'">'+label+' ('+rows(kind,key).length+')</button>').join('')+'</div>':'')+'</div><div class="cyList">'+all.map(card).join('')+'</div></section>';
}
function register(id){
 const r=(data.offers||[]).find(r=>r.id===id);if(!r)return;
 const s=window.CVStateBridge?.get?.();if(!s)return;
 if(owned(r)&&!confirm('Ya tienes esta carta o producto. ¿Autorizas ampliar posición?'))return;
 const input=prompt('Precio que realmente has pagado por '+r.name+' (€):',String(r.priceEUR));if(input==null)return;
 const cost=Number(input.replace(',','.'));if(!(cost>0)){alert('Precio no válido.');return}
 const extraInput=prompt('Portes y comisiones de tu compra (€):',r.shippingEUR==null?'':String(r.shippingEUR));if(extraInput==null)return;
 if(!extraInput.trim()){alert('Indica los portes reales; usa 0 si fueron gratuitos.');return}
 const extra=Number(extraInput.replace(',','.'));if(!Number.isFinite(extra)||extra<0){alert('Portes no válidos.');return}
 const idNew=globalThis.crypto?.randomUUID?.()||('retail-'+Date.now());
 if(r.kind==='sealed'){
  s.sealedProducts=Array.isArray(s.sealedProducts)?s.sealedProducts:[];
  s.sealedProducts.push({id:idNew,universe:r.universe,name:r.name,set:r.set,productType:'Producto sellado',language:r.language,languageVerified:true,currentPrice:cost,shipping:extra,purchase:cost,purchaseShipping:extra,photoUrl:r.image,sourceUrl:r.url,buyUrl:r.url,seller:r.seller,quantity:1,updatedAt:new Date().toISOString()});
 }else{
  s.cards.push({id:idNew,universe:r.universe,name:r.name,number:r.number,set:r.set,language:r.language,grading:r.grading,grade:r.grading==='RAW'?r.condition:r.grade,condition:r.condition,purchase:cost,purchaseShipping:extra,quantity:1,valuationStatus:'reference',value:0,purpose:'collection',referenceImage:r.image,referenceImageIdentityExact:true,buySource:r.seller,buySourceUrl:r.url,buyOpportunityId:r.id,purchaseDate:new Date().toISOString().slice(0,10)});
 }
 window.CVStateBridge.save();window.CVRenderCollection?.();window.CVFinal?.renderAll();alert('Compra registrada con tu coste real.');
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-retail-bought]');if(b){e.preventDefault();register(b.dataset.retailBought)}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)window.CVFinal?.renderAll()});
setInterval(()=>{if(!document.hidden)window.CVFinal?.renderAll()},60000);
function treasury(){const s=window.CVStateBridge?.get?.(),c=s?.treasuryCash;if(!c)return '';const pending=(s.saleHistory||[]).filter(h=>h.fulfillmentStatus==='sold-awaiting-shipment').reduce((a,h)=>a+Number(h.unitPrice)*Number(h.qty||1),0);return '<section class="retailSection cyHead"><h2>Caja Cardmarket: '+EUR(c.availableEUR)+'</h2><p>Confirmada por ti el '+E(c.reportedAt)+'. Ventas pendientes de envío: '+EUR(pending)+' brutos; no se suman a caja disponible. El saldo Cardmarket no paga automáticamente compras en otras tiendas.</p><p>Gyarados: comprador interesado; sigue sin vender.</p></section>'}
window.CVAvailableOffers={html,rows,count,valid,fresh,owned,register,data,treasury};
})();
