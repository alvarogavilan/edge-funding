(()=>{"use strict";
const N=v=>Number(v)||0,E=v=>{const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML},
EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
function idioma(v){
 const k=String(v||"").trim().toLowerCase();
 const map={it:["🇮🇹","Italiano"],italian:["🇮🇹","Italiano"],italiano:["🇮🇹","Italiano"],en:["🇬🇧","Inglés"],english:["🇬🇧","Inglés"],ingles:["🇬🇧","Inglés"],"inglés":["🇬🇧","Inglés"],es:["🇪🇸","Español"],spanish:["🇪🇸","Español"],espanol:["🇪🇸","Español"],"español":["🇪🇸","Español"],fr:["🇫🇷","Francés"],french:["🇫🇷","Francés"],frances:["🇫🇷","Francés"],"francés":["🇫🇷","Francés"],de:["🇩🇪","Alemán"],german:["🇩🇪","Alemán"],aleman:["🇩🇪","Alemán"],"alemán":["🇩🇪","Alemán"],jp:["🇯🇵","Japonés"],ja:["🇯🇵","Japonés"],japanese:["🇯🇵","Japonés"],japones:["🇯🇵","Japonés"],"japonés":["🇯🇵","Japonés"],pt:["🇵🇹","Portugués"],portuguese:["🇵🇹","Portugués"],portugues:["🇵🇹","Portugués"],"portugués":["🇵🇹","Portugués"],kr:["🇰🇷","Coreano"],ko:["🇰🇷","Coreano"],korean:["🇰🇷","Coreano"],coreano:["🇰🇷","Coreano"]};
 return map[k]||["🌐",v||"Idioma sin verificar"];
}
function textoES(v){
 let s=String(v||"");
 const reps=[
  [/\bEnchanted\b/gi,"Encantada"],[/\bItalian\b/gi,"Italiano"],[/\bGerman\b/gi,"Alemán"],[/\bFrench\b/gi,"Francés"],
  [/\bEnglish\b/gi,"Inglés"],[/\bJapanese\b/gi,"Japonés"],[/\bSpanish\b/gi,"Español"],
  [/\bNear Mint\b/gi,"Casi nueva"],[/\bNM\b/g,"Casi nueva (NM)"],
  [/\bMint\b/gi,"Impecable (MT)"],[/\bExcellent\b/gi,"Excelente (EX)"],
  [/\bGood\b/gi,"Buena (GD)"],[/\bPlayed\b/gi,"Jugada (PL)"],
  [/\bHolofoil\b/gi,"Holofoil"],[/\bFoil\b/gi,"Foil"],[/\bCapital alto\b/gi,"Capital alto"]
 ];
 for(const [re,to] of reps)s=s.replace(re,to);
 return s.replace(/\s+·\s+/g," · ").trim();
}
function sellerES(v){
 const s=String(v||"").trim();
 if(/^Cardmarket\s*·/i.test(s))return "Oferta publicada en Cardmarket";
 return s||"Vendedor verificado";
}
function sourceES(v){
 const s=String(v||"").trim();
 if(/Cardmarket/i.test(s)&&/oferta/i.test(s))return "Oferta publicada en Cardmarket";
 if(/Mercado público verificado/i.test(s))return "Mercado público verificado · mismo idioma y estado";
 if(/Sellado PRIME/i.test(s))return "Producto sellado verificado";
 return s||"Mercado verificado";
}
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
 language:r.x.offerLanguage||r.x.language||"",description:[r.x.variant,r.x.condition].filter(Boolean).join(" · "),
 exit:N(r.q.econ?.exit),edge:N(r.q.econ?.edge),roi:N(r.q.econ?.roi),exitKind:r.q.econ?.kind||"none",checkedAt:r.x.evidenceCheckedAt||r.x.checkedAt||"",units:r.x.approval==="BUY-SCALE"?Math.max(1,N(r.x.recommendedQty)||1):1}));
}
function publicVerifiedBuys(){
 const now=Date.now();
 return (state.manualOpportunities||[]).filter(x=>{
  if(x.publicFloorVerified!==true||x.languageVerified!==true||x.sameMarketComparableVerified!==true||x.exitEvidenceVerified!==true)return false;
  const price=N(x.price),exitGross=N(x.marketEvidence?.currentExitEUR),at=new Date(x.evidenceCheckedAt||x.marketEvidence?.at||0).getTime();
  if(!(price>=20&&exitGross>0&&at&&now-at<=24*3600000))return false;
  if(!String(x.offerLanguage||x.language||"").trim()||!String(x.condition||"").trim()||!String(x.variant||"").trim()||!String(x.seller||"").trim()||!/^https?:\/\//i.test(String(x.url||"")))return false;
  const exit=exitGross*.85,edge=exit-price,roi=edge/price*100;
  return edge>=40&&roi>=35;
 }).map(x=>{
  const exit=N(x.marketEvidence.currentExitEUR)*.85,edge=exit-N(x.price),roi=edge/N(x.price)*100;
  return {id:"public:"+x.id,name:x.name,set:x.set||"",number:x.number||"",image:img(x),price:N(x.price),
   seller:x.seller,url:x.url,source:"Mercado público verificado · mismo idioma/estado",
   language:x.offerLanguage||x.language||"",description:[x.variant,x.condition,N(x.price)>=500?"Capital alto":""].filter(Boolean).join(" · "),
   exit,edge,roi,exitKind:"active-exit-ask",checkedAt:x.evidenceCheckedAt||x.checkedAt||"",units:1,
   lastSalePrice:N(x.lastSalePrice),lastSaleDate:x.lastSaleDate||"",sameLanguageOffers:N(x.marketEvidence?.currentQty||x.available)};
 });
}
function euBuys(){
 const rows=window.CVStrictOpportunity?.euRows?.()||[];
 return rows.filter(r=>r.status==="buy"&&r.buyUrl).map(r=>({
  id:r.purchaseKey||("eu:"+String(r.name||"")),
  name:r.name,set:r.set||"",number:r.number||"",image:img(r),
  price:N(r.price),seller:r.meta?.seller||"Vendedor verificado",url:r.buyUrl,source:"Oferta EUR exacta",
  language:r.meta?.language||"",description:[r.meta?.variant,r.meta?.condition].filter(Boolean).join(" · "),
  exit:N(r.target),edge:N(r.profit),roi:N(r.roi),exitKind:"closed-sale-median",checkedAt:"",units:1
 }));
}
function arbitrageBuys(){
 const rows=window.CVStrictOpportunity?.arbitrageRows?.()||[];
 return rows.filter(r=>r.status==="buy"&&r.buyUrl).map(r=>({
  id:r.purchaseKey,name:r.name,set:r.set||"",number:r.number||"",image:img(r),price:N(r.price),
  seller:r.meta?.seller||r.meta?.entryShop||"Vendedor verificado",url:r.buyUrl,
  source:(r.meta?.entryShop||"Mercado admitido")+" → vender en Cardmarket",
  language:r.meta?.language||"",description:[r.meta?.variant,r.meta?.condition].filter(Boolean).join(" · "),
  exit:N(r.target),edge:N(r.profit),roi:N(r.roi),exitKind:"cross-market-net",checkedAt:"",units:1
 }));
}
function sealedBuys(){
 return (state.sealedProducts||[]).map(p=>({p,d:window.CVSealedPrime?.decision?.(p)}))
 .filter(r=>r.d?.key==="buy")
 .map(r=>({id:"sealed:"+r.p.id,name:r.p.name,set:r.p.set||"",number:"",image:img(r.p),
 price:N(r.d.prime?.cost),seller:r.d.prime?.seller||r.p.seller||"Tienda verificada",url:r.p.buyUrl||"",source:"Sellado PRIME",
 language:r.p.language||"",description:[r.p.productType].filter(Boolean).join(" · "),
 exit:N(r.d.prime?.exit),edge:N(r.d.prime?.edge),roi:N(r.d.prime?.roi),units:1}));
}
function buys(){
 const all=[...manualBuys(),...publicVerifiedBuys(),...arbitrageBuys(),...euBuys(),...sealedBuys()];
 const seen=new Set();
 return all.filter(r=>{const k=String(r.id||"").replace(/^(manual|public):/,"");if(seen.has(k))return false;seen.add(k);return true})
  .sort((a,b)=>(b.edge-a.edge)||(b.roi-a.roi));
}
function funnel(){
 const all=(state.manualOpportunities||[]),quality=x=>window.CVPrimeMarket?.quality?.(x)||null;
 const audited=all.map(x=>({x,q:quality(x)})).filter(r=>r.q);
 const exact=audited.filter(r=>r.q.ex).length;
 const economic=audited.filter(r=>r.q.econ?.edge>=40&&r.q.econ?.roi>=35&&N(r.x.price)>=20).length;
 const prime=audited.filter(r=>r.q.passed===r.q.total&&["BUY-ONE","BUY-SCALE"].includes(r.x.approval)).length;
 const watch=audited.filter(r=>r.x.approval==="WATCH"||r.q.passed<r.q.total).length;
 return {total:all.length,exact,economic,prime,watch};
}
function radarCandidates(){
 const seen=new Set(),out=[];
 const add=(x,universe)=>{
  if(!x||!x.name)return;
  const key=(universe+"|"+String(x.name).toLowerCase()+"|"+String(x.number||"").toLowerCase());
  if(seen.has(key))return;seen.add(key);
  const price=N(x.price||x.marketPrice||x.value||x.trend||x.avg30),score=N(x.score||x.opportunityScore||x.confidence);
  if(price>0&&price<20)return;
  const game=universe==="lorcana"?"Lorcana":"Pokemon";
  out.push({universe,name:x.name,set:x.set||x.setName||x.expansion_name||"",number:x.number||"",price,score,
   image:x.image||x.referenceImage||"",url:"https://www.cardmarket.com/es/"+game+"/Products/Search?searchString="+encodeURIComponent(x.name),
   reason:x.why||x.reason||"Señal automática detectada; falta verificar oferta exacta, idioma, variante, condición y salida antes de elevar a Compra ya."});
 };
 for(const universe of ["pokemon","lorcana"]){
  const pack=state.autoMarketScans?.[universe],rows=Array.isArray(pack?.signals)?pack.signals:[];
  rows.forEach(x=>add(x,universe));
 }
 for(const x of (state.marketScan||[]))add(x,x.universe==="lorcana"?"lorcana":"pokemon");
 for(const x of (state.marketCandidates||[]))add(x,x.universe==="lorcana"?"lorcana":"pokemon");
 return out.sort((a,b)=>(b.score-a.score)||(b.price-a.price));
}
function radarCard(r,i){
 return '<article class="primeRadarCandidate">'+
  (r.image?'<img src="'+E(r.image)+'" alt="'+E(r.name)+'" loading="lazy">':'<div class="primeRadarNoImage">RADAR</div>')+
  '<div><small>#'+(i+1)+' · '+E(r.universe==="lorcana"?"LORCANA":"POKÉMON")+(r.score?' · señal '+r.score:'')+'</small>'+
  '<h4>'+E(r.name)+'</h4><span>'+E([r.number,r.set].filter(Boolean).join(" · "))+'</span>'+
  '<p>'+E(r.reason)+'</p>'+
  (r.price?'<b>Referencia observada '+EUR(r.price)+'</b>':'<b>Precio ejecutable pendiente</b>')+
  '<a href="'+E(r.url)+'" target="_blank" rel="noopener">VERIFICAR EN CARDMARKET</a></div></article>';
}
function card(r,i){
 const l=idioma(r.language);
 return '<article class="primeBuySimple">'+
  '<div class="primeBuyTop"><span class="primeBuyBadge">COMPRAR AHORA</span><strong class="primeBuyPrice">'+EUR(r.price)+'</strong></div>'+
  '<div class="primeBuyMain">'+
   (r.image?'<img class="primeBuyImage" src="'+E(r.image)+'" alt="'+E(r.name)+'" loading="lazy">':'<div class="primeBuyImage primeBuyNoImage"><span class="autoImageLoader"></span><small>Cargando imagen automática…</small></div>')+
   '<div class="primeBuyInfo"><div class="primeBuyRank">#'+(i+1)+'</div><div class="primeLanguageBadge">'+E(l[0]+' '+l[1])+'</div><h3>'+E(r.name)+'</h3><small class="primeBuyMeta">'+E([r.number,r.set,textoES(r.description)].filter(Boolean).join(" · "))+'</small>'+
    '<div class="primeBuySeller"><span>Vendedor / origen</span><b>'+E(sellerES(r.seller))+'</b><small>'+E(sourceES(r.source))+'</small></div>'+
   '</div>'+
  '</div>'+
  '<div class="primeBuyEconomics"><span>Salida prudente '+EUR(r.exit)+'</span><span>Margen aprox. +'+EUR(r.edge)+' · Rentabilidad '+r.roi.toFixed(1)+'%</span></div>'+
  '<small class="primeBuyEvidence">'+(r.exitKind==="active-exit-ask"?"Salida basada en mercado activo del mismo idioma":r.exitKind==="cross-market-net"?"Salida conservadora neta cruzando mercados y profundidad del mismo idioma":"Salida respaldada por ventas verificadas")+(r.checkedAt?" · Revisado "+new Date(r.checkedAt).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"")+'</small>'+
  ((r.lastSalePrice||r.sameLanguageOffers)?'<div class="primeBuyFacts">'+(r.lastSalePrice?'<span>Última venta observada <b>'+EUR(r.lastSalePrice)+'</b>'+(r.lastSaleDate?' · '+new Date(r.lastSaleDate+"T12:00:00").toLocaleDateString("es-ES"):'')+'</span>':'')+(r.sameLanguageOffers?'<span>Ofertas mismo idioma <b>'+r.sameLanguageOffers+'+</b></span>':'')+'</div>':'')+
  (r.url?'<a class="primeBuyLink" href="'+E(r.url)+'" target="_blank" rel="noopener">'+E((/cardmarket/i.test(r.url)?"COMPRAR EN CARDMARKET":"COMPRAR")+' · '+EUR(r.price))+'</a>':'<button class="primeBuyLink" disabled>SIN ENLACE DE COMPRA</button>')+
  (r.units>1?'<small class="primeBuyUnits">Máximo sugerido: '+r.units+' unidades por liquidez.</small>':'')+
 '</article>';
}
async function hydrateBuyImages(){
 const rows=(state.manualOpportunities||[]).filter(x=>{
  const q=window.CVPrimeMarket?.quality?.(x);
  return q&&q.passed===q.total&&["BUY-ONE","BUY-SCALE"].includes(x.approval)&&!img(x);
 }).slice(0,8);
 let changed=false;
 for(const x of rows){
  try{
   let url="";
   if((x.universe||"pokemon")==="pokemon")url=await window.CVCatalogImages?.resolvePokemon?.(x)||"";
   else if(x.universe==="lorcana")url=await window.CVCatalogImages?.resolveLorcana?.(x)||"";
   if(url){x.image=url;x.imageSource="catalog-auto";changed=true}
  }catch{}
 }
 if(changed){save();render()}
}
function render(){
 const host=document.querySelector("#todaySimple");if(!host)return;
 let simple=document.querySelector("#primeSimpleHome");
 if(!simple){simple=document.createElement("section");simple.id="primeSimpleHome";host.prepend(simple)}
 const rows=buys(),cards=rows.filter(r=>!r.id.startsWith("sealed:")),products=rows.filter(r=>r.id.startsWith("sealed:")),f=funnel();
 const ct=state.cardTraderDirect||{},hasCt=window.CVCardTraderDirect?.hasToken?.()===true,diag=ct.diagnostics||{};
 const marketStatus=!hasCt?'<section class="primeScannerStatus"><b>Escaneo público activo</b><span>Pokémon y Lorcana se refrescan al abrir. CardTrader es un acelerador opcional y no bloquea Compra ya.</span></section>':
  ct.status==="error"?'<section class="primeScannerStatus warn"><b>CardTrader no disponible</b><span>La app continúa con fuentes públicas; no requiere ninguna acción tuya.</span></section>':
  '<section class="primeScannerStatus"><b>Escaneo real CardTrader + fuentes públicas</b><span>'+N(ct.scanned)+' candidatas · '+N(diag.uniqueExpansions)+' sets completos · '+N(diag.blueprintExact)+' identidades exactas · '+N(diag.ambiguousBlueprint)+' ambiguas · '+N(ct.offers)+' ofertas · '+N(diag.dislocations)+' gangas internas · '+N(ct.approved)+' compras aprobadas</span></section>';
 if(rows.some(r=>!r.image))setTimeout(()=>hydrateBuyImages().catch(()=>{}),50);
 const section=(title,subtitle,items)=>'<section class="primeBuyGroup"><div class="primeBuyGroupHead"><div><span>COMPRA YA</span><h3>'+E(title)+'</h3><small>'+E(subtitle)+'</small></div><b>'+items.length+'</b></div>'+
  (items.length?'<div class="primeBuyList">'+items.slice(0,10).map(card).join("")+'</div>':'<div class="primeNoBuy compact"><b>NINGUNA COMPRA VERIFICADA EN ESTE BLOQUE.</b><span>Se mantiene visible la categoría; no se mezcla con candidatos sin evidencia suficiente.</span></div>')+'</section>';
 simple.innerHTML=marketStatus+'<div class="primeHomeHeader"><span>HOY</span><h2>QUÉ COMPRAR</h2><p>Compras ejecutables separadas por tipo. Solo entran si superan PRIME con oferta exacta, vendedor, identidad, salida y evidencia vigente.</p></div>'+
  section("CARTAS","Pokémon y Lorcana · cartas individuales RAW o graduadas",cards)+
  section("SETS / OTROS PRODUCTOS","ETB, booster boxes, colecciones, blísteres, troves y demás sellado",products)+
  '<section class="primeFunnel"><div class="primeBuyGroupHead"><div><span>COBERTURA</span><h3>Por qué no aparecen miles como “Compra ya”</h3></div></div><div class="statsGrid">'+
   '<div><span>Oportunidades auditadas</span><b>'+f.total+'</b></div>'+
   '<div><span>Oferta exacta</span><b>'+f.exact+'</b></div>'+
   '<div><span>Economía ≥ +40 € y ROI ≥35%</span><b>'+f.economic+'</b></div>'+
   '<div><span>Compra PRIME final</span><b>'+f.prime+'</b></div>'+
  '</div><small>El catálogo puede contener decenas de miles de cartas, pero “Compra ya” exige una unidad realmente comprable ahora. No se muestran candidatos, watches ni oportunidades sin aprobar.</small></section>'
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
document.addEventListener("click",e=>{
 if(e.target.closest('[data-tab="radar"]')){installGuard();setTimeout(render,100)}
});
window.CVSimpleHome={render,buys,publicVerifiedBuys,euBuys,arbitrageBuys,funnel,installGuard,hydrateBuyImages};
})();