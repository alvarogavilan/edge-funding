(()=>{"use strict";
const N=v=>Number(v)||0,E=v=>{const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML},
EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
function img(x){
 const direct=x?.image||x?.referenceImage||x?.photoURL||x?.photo;if(direct)return direct;
 const rows=[...(state.marketScan||[]),...(state.marketCandidates||[]),...(state.globalRadar?.scored||[]).map(z=>z.x||z)].filter(Boolean);
 const n=String(x?.name||"").trim().toLowerCase(),num=String(x?.number||"").replace(/\s/g,"").toLowerCase();
 const hit=rows.find(r=>r.image&&String(r.name||"").trim().toLowerCase()===n&&(!num||String(r.number||"").replace(/\s/g,"").toLowerCase()===num));
 return hit?.image||"";
}
function bestKnownOffer(x){
 const rows=[{price:N(x.price),seller:x.seller||"",url:x.url||"",source:x.shop||"Oferta actual"}];
 for(const o of (state.euOffers||[])){
  let same=false;try{same=window.CVIdentity?.same?.(x,o)===true}catch{}
  if(!same)continue;
  const price=N(o.total||o.price),url=String(o.url||""),seller=o.seller||o.shop||"";
  if(!(price>0)||!/^https?:\/\//i.test(url))continue;
  const admitted=window.CVMarket?.admittedShop?.(url);if(admitted&&admitted.ok===false)continue;
  rows.push({price,seller,url,source:o.shop||admitted?.name||"Oferta EUR verificada"});
 }
 return rows.filter(r=>r.price>0&&r.url).sort((a,b)=>a.price-b.price)[0]||null;
}
function manualBuys(){
 return (state.manualOpportunities||[]).map(x=>{const best=bestKnownOffer(x);if(!best)return null;const candidate={...x,price:best.price,seller:best.seller,url:best.url};const q=window.CVPrimeMarket?.quality?.(candidate);return {kind:"card",x,candidate,q,best}}).filter(Boolean)
 .filter(r=>r.q&&r.q.passed===r.q.total&&["BUY-ONE","BUY-SCALE"].includes(r.x.approval))
 .map(r=>({id:"manual:"+r.x.id,name:r.x.name,set:r.x.set||"",number:r.x.number||"",image:img(r.x),
 price:N(r.best.price),seller:r.best.seller||"Vendedor verificado",url:r.best.url||"",source:r.best.source||r.x.shop||"Mercado verificado",
 description:[r.x.offerLanguage||r.x.language,r.x.variant,r.x.condition].filter(Boolean).join(" · "),
 exit:N(r.q.econ?.exit),edge:N(r.q.econ?.edge),roi:N(r.q.econ?.roi),units:r.x.approval==="BUY-SCALE"?Math.max(1,N(r.x.recommendedQty)||1):1}));
}
function sealedBuys(){
 return (state.sealedProducts||[]).map(p=>({p,d:window.CVSealedPrime?.decision?.(p)}))
 .filter(r=>r.d?.key==="buy")
 .map(r=>({id:"sealed:"+r.p.id,name:r.p.name,set:r.p.set||"",number:"",image:img(r.p),
 price:N(r.d.prime?.cost),seller:r.d.prime?.seller||r.p.seller||"Tienda verificada",url:r.p.buyUrl||"",source:"Sellado PRIME",
 description:[r.p.productType,r.p.language].filter(Boolean).join(" · "),
 exit:N(r.d.prime?.exit),edge:N(r.d.prime?.edge),roi:N(r.d.prime?.roi),units:1}));
}
function buys(){
 return [...manualBuys(),...sealedBuys()].sort((a,b)=>(b.edge-a.edge)||(b.roi-a.roi));
}
function card(r,i){
 return '<article class="primeBuySimple">'+
  '<div class="primeBuyRank">#'+(i+1)+'</div>'+
  (r.image?'<img class="primeBuyImage" src="'+E(r.image)+'" alt="'+E(r.name)+'" loading="lazy">':'<div class="primeBuyImage primeBuyNoImage">SIN FOTO</div>')+
  '<div class="primeBuyInfo"><h3>'+E(r.name)+'</h3><small>'+E([r.number,r.set,r.description].filter(Boolean).join(" · "))+'</small>'+
  '<div class="primeBuyMetrics"><div><span>Comprar</span><b>'+EUR(r.price)+'</b></div><div><span>Salida prudente</span><b>'+EUR(r.exit)+'</b></div><div><span>Margen</span><b>+'+EUR(r.edge)+'</b></div></div>'+
  '<div class="primeBuySeller"><b>'+E(r.seller)+'</b><span>'+E(r.source)+'</span></div>'+
  (r.url?'<a class="primaryAction primeBuyLink" href="'+E(r.url)+'" target="_blank" rel="noopener">ABRIR MEJOR OFERTA VERIFICADA · '+EUR(r.price)+'</a>':'<button class="primaryAction" disabled>SIN ENLACE EJECUTABLE</button>')+
  (r.units>1?'<small>Compra recomendada: '+r.units+' unidades máximo según liquidez verificada.</small>':'')+
  '</div></article>';
}
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 let simple=document.querySelector("#primeSimpleHome");
 if(!simple){simple=document.createElement("section");simple.id="primeSimpleHome";host.prepend(simple)}
 const rows=buys();
 simple.innerHTML='<div class="primeHomeHeader"><span>HOY</span><h2>QUÉ COMPRAR</h2><p>Solo aparecen compras que superan PRIME con oferta exacta, vendedor, identidad, salida y evidencia vigente.</p></div>'+
 (rows.length?'<div class="primeBuyList">'+rows.slice(0,10).map(card).join("")+'</div>':
 '<div class="primeNoBuy"><b>HOY NO HAY NINGUNA COMPRA PRIME VERIFICADA.</b><span>No voy a rellenar esta pantalla con cartas dudosas. Cuando aparezca una, verás foto, precio, vendedor y enlace directo aquí.</span></div>');
}
function installGuard(){
 const api=window.CVTodaySimple;
 if(api?.render&&!api.__simpleHomeWrapped){
  const base=api.render.bind(api);
  api.render=function(){const out=base();setTimeout(render,0);return out};
  api.__simpleHomeWrapped=true;
 }
}
setTimeout(()=>{installGuard();render()},700);
setTimeout(installGuard,1400);
document.addEventListener("visibilitychange",()=>{if(!document.hidden){installGuard();setTimeout(render,100)}});
document.addEventListener("click",e=>{if(e.target.closest('[data-tab="radar"]')){installGuard();setTimeout(render,100)}});
window.CVSimpleHome={render,buys,installGuard};
})();