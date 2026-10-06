(()=>{"use strict";
// Card Vault · tableros finales: Compra YA, Sellado y PSA.
// Regla: nada aparece como "COMPRAR YA" sin venta cerrada verificada, idioma exacto,
// oferta ≤24 h y enlace directo al producto. El resto se muestra como VIGILAR con su motivo.
const state=window.CVStateBridge?.get?.()||JSON.parse(localStorage.getItem("cardvault.v2")||"{\"cards\":[],\"manualOpportunities\":[]}");
const save=()=>{if(window.CVStateBridge?.save)window.CVStateBridge.save();else localStorage.setItem("cardvault.v2",JSON.stringify(state))};
const N=v=>Number(v)||0;
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const DAY=86400000;
const FEE=0.05,HAIRCUT=0.85,SHIP=3; // comisión Cardmarket 5 %, descuento prudente 15 %, envío 3 €
const LANG={english:["🇬🇧","Inglés"],en:["🇬🇧","Inglés"],spanish:["🇪🇸","Español"],español:["🇪🇸","Español"],es:["🇪🇸","Español"],
 french:["🇫🇷","Francés"],fr:["🇫🇷","Francés"],german:["🇩🇪","Alemán"],de:["🇩🇪","Alemán"],italian:["🇮🇹","Italiano"],it:["🇮🇹","Italiano"],
 japanese:["🇯🇵","Japonés"],japonés:["🇯🇵","Japonés"],jp:["🇯🇵","Japonés"],ja:["🇯🇵","Japonés"],korean:["🇰🇷","Coreano"],ko:["🇰🇷","Coreano"],
 portuguese:["🇵🇹","Portugués"],"traditional chinese":["🇹🇼","Chino trad."],"simplified chinese":["🇨🇳","Chino simpl."]};
function lang(v){const k=String(v||"").trim().toLowerCase();if(!k||k==="pendiente")return ["🏳️","Idioma pendiente",false];const l=LANG[k];return l?[l[0],l[1],true]:["🏳️",v,true]}
const BAD_HOST=/(^|\.)(ebay\.[a-z.]+|ebayimg\.com)$/i;
function safeUrl(u){try{const x=new URL(u);return x.protocol==="https:"&&!BAD_HOST.test(x.hostname)?x.href:""}catch{return ""}}
// Enlace directo = ficha de producto concreta (no listados, expansiones ni búsquedas).
function directUrl(u){
 const s=safeUrl(u);if(!s)return "";
 const x=new URL(s);
 if(/cardmarket\.com$/i.test(x.hostname)){
  const p=x.pathname.replace(/\/+$/,"");
  return /\/Products\/Singles\/[^/]+\/[^/]+$/.test(p)||/\/Products\/(?!Singles\/)[^/]+\/[^/]+$/.test(p)?s:"";
 }
 return s;
}
function rarity(x){
 const m=String(x.number||"").match(/^(\d+)\s*\/\s*(\d+)$/);
 if(m&&N(m[1])>N(m[2]))return "Secreta (nº > total del set)";
 if(/prize pack|promo|wcd/i.test(x.set||""))return "Promo";
 if(/vmax|vstar| ex$|gx$| v$/i.test(x.name||""))return "Rara ("+String(x.name).split(" ").pop()+")";
 return x.rarity||"—";
}
const fresh=x=>{const t=Date.parse(x.checkedAt||x.evidenceCheckedAt||"");return t>0&&Date.now()-t<=DAY};
const ageTxt=x=>{const t=Date.parse(x.checkedAt||x.evidenceCheckedAt||"");if(!(t>0))return "sin fecha";const d=Math.floor((Date.now()-t)/DAY);return d<1?"hoy":"hace "+d+" día"+(d>1?"s":"")};
function owned(x){try{return window.CVSimpleHome?.alreadyOwned?.(x)===true}catch{return false}}
function closedSale(x){
 const ev=x.closedSaleEvidence||{},p=(Array.isArray(ev.pricesEUR)?ev.pricesEUR:[]).map(N).filter(v=>v>0);
 if(x.closedSaleVerified===true&&(N(x.soldMedianEUR)||p.length||N(x.lastSalePrice)))
  return {type:"VENTA CERRADA REAL",eur:N(x.soldMedianEUR)||(p.length?p.reduce((a,b)=>a+b,0)/p.length:N(x.lastSalePrice)),n:Math.max(1,p.length,N(x.soldSample)),url:safeUrl(ev.url||x.salesEvidenceUrl),lang:ev.language||x.soldLanguage||""};
 const sup=x.supportingClosedSales||{},usd=(Array.isArray(sup.pricesUSD)?sup.pricesUSD:[]).map(N).filter(v=>v>0).sort((a,b)=>a-b);
 if(usd.length){const med=usd.length%2?usd[(usd.length-1)/2]:(usd[usd.length/2-1]+usd[usd.length/2])/2;
  return {type:"REFERENCIA EXTERNA de ventas (PriceCharting, USD→€, no Cardmarket)",eur:med*N(sup.fxEURPerUSD||0.88),n:usd.length,url:safeUrl(sup.url),lang:sup.language||""}}
 return null;
}
function evaluate(x){
 const cs=closedSale(x),trend=N(x.trend)||N(x.avg30);
 const ref=cs?cs.eur:trend,refType=cs?cs.type:trend?"ESTIMACIÓN · tendencia Cardmarket (no es venta)":"sin referencia";
 const net=ref>0?ref*HAIRCUT*(1-FEE)-SHIP:0,price=N(x.price),edge=net-price,roi=price>0?edge/price*100:0;
 const [flag,lname,langKnown]=lang(x.offerLanguage||x.language);
 const langOk=x.languageVerified===true&&langKnown;
 const url=directUrl(x.url);
 const isFresh=fresh(x);
 const avail=N(x.available||x.sellerQty);
 const liq=avail>=20?"Alta":avail>=5?"Media":avail>0?"Baja":"Sin dato";
 const missing=[];
 if(!cs||!String(cs.type||"").startsWith("VENTA CERRADA REAL"))missing.push("venta cerrada verificada");
 if(!langOk)missing.push("idioma exacto de la oferta");
 if(!isFresh)missing.push("oferta comprobada hace ≤24 h (última: "+ageTxt(x)+")");
 if(!url)missing.push("enlace directo al producto");
 if(edge<40)missing.push("beneficio ≥ 40 €");
 const buyReady=missing.length===0&&cs&&String(cs.type||"").startsWith("VENTA CERRADA REAL")&&["BUY-ONE","BUY-SCALE"].includes(x.approval);
 const score=Math.round((cs?(cs.type.startsWith("VENTA CERRADA REAL")?35:20):0)+(langOk?20:0)+(isFresh?20:0)+(url?10:0)+(liq==="Alta"?15:liq==="Media"?10:liq==="Baja"?5:0));
 const risk=!langOk||x.languageMismatchRisk?"Alto (idioma)":!cs?"Alto (sin venta cerrada)":!isFresh?"Medio (oferta antigua)":"Bajo";
 return {x,cs,ref,refType,net,edge,roi,flag,lname,langOk,url,isFresh,liq,avail,missing,buyReady,score,risk};
}
function discarded(x){
 const st=String(x.status||"");
 if(x.resolvedMarketNoEdge)return "mismo idioma sin margen";
 if(x.languageMismatchRisk)return "el mínimo es de otro idioma";
 if(/^DESCARTADA|^NO COMPRAR/i.test(st))return st.replace(/^[^·]*·\s*/,"").toLowerCase()||"descartada";
 return "";
}
function cardRows(){
 return (state.manualOpportunities||[]).filter(x=>x&&["pokemon","lorcana"].includes(x.universe)&&String(x.condition).toUpperCase()!=="SEALED"&&N(x.price)>=20);
}
/* ---------- fotos oficiales (nunca fotos personales) ---------- */
const IMG_KEY="cv_official_img_v1";
const imgCache=(()=>{try{return JSON.parse(localStorage.getItem(IMG_KEY)||"{}")}catch{return {}}})();
function officialImage(x){const u=safeUrl(x.image||"");return u||imgCache[x.id]||""}
async function resolveLorcanaImages(rows){
 for(const x of rows.filter(r=>r.universe==="lorcana"&&!officialImage(r)).slice(0,12)){
  try{
   const nm=String(x.name||"").replace(/\s*\(V\.\d\)\s*$/,"");
   const r=await fetch("https://api.lorcast.com/v0/cards/search?q="+encodeURIComponent('name:"'+nm.split(" - ")[0]+'"'));
   if(!r.ok)continue;const j=await r.json();
   const num=String(x.number||"").split("/")[0].replace(/^0+/,"");
   const hit=(j.results||[]).find(c=>String(c.collector_number).replace(/^0+/,"")===num&&String(c.set?.name||"").toLowerCase()===String(x.set||"").toLowerCase());
   const u=hit?.image_uris?.digital?.normal;if(u){imgCache[x.id]=u;try{localStorage.setItem(IMG_KEY,JSON.stringify(imgCache))}catch{}}
  }catch{}
 }
}
/* ---------- Compra YA ---------- */
let filter="all";
function oppCard(o){
 const x=o.x,img=officialImage(x),badge=o.buyReady?'<span class="cyBadge buy">COMPRAR YA</span>':'<span class="cyBadge watch">VIGILAR</span>';
 return '<article class="cyCard">'+
 '<div class="cyImg">'+(img?'<img src="'+E(img)+'" alt="'+E(x.name)+'" loading="lazy" referrerpolicy="no-referrer">':'<span>Foto oficial<br>no disponible</span>')+'</div>'+
 '<div class="cyBody">'+badge+'<span class="cyGame">'+(x.universe==="lorcana"?"Lorcana":"Pokémon")+'</span>'+
 '<h4>'+E(x.name)+'</h4>'+
 '<p class="cyMeta">'+E([x.set,x.number?"nº "+x.number:""].filter(Boolean).join(" · "))+'</p>'+
 '<p class="cyMeta">'+o.flag+' '+E(o.lname)+' · '+E(x.condition||"estado pendiente")+' · '+E(rarity(x))+'</p>'+
 '<dl class="cyGrid">'+
 '<div><dt>Precio compra</dt><dd>'+EUR(x.price)+'</dd></div>'+
 '<div><dt>Precio mercado</dt><dd>'+(o.ref?EUR(o.ref):"—")+'</dd></div>'+
 '<div class="wide"><dt>Tipo de referencia</dt><dd>'+E(o.refType)+(o.cs?' · '+o.cs.n+' venta(s)'+(o.cs.lang?' · '+E(lang(o.cs.lang)[1]):''):'')+'</dd></div>'+
 '<div><dt>Beneficio estimado</dt><dd class="'+(o.edge>=40?"pos":o.edge>0?"":"neg")+'">'+(o.ref?EUR(o.edge):"—")+'</dd></div>'+
 '<div><dt>Margen</dt><dd>'+(o.ref?o.roi.toFixed(0)+" %":"—")+'</dd></div>'+
 '<div><dt>Liquidez</dt><dd>'+E(o.liq)+(o.avail?' ('+o.avail+' ofertas)':'')+'</dd></div>'+
 '<div><dt>Riesgo</dt><dd>'+E(o.risk)+'</dd></div>'+
 '<div><dt>Calidad</dt><dd>'+o.score+'/100</dd></div>'+
 '<div><dt>Comprobado</dt><dd>'+E(ageTxt(x))+'</dd></div>'+
 '</dl>'+
 (o.missing.length?'<p class="cyMissing"><b>Antes de comprar falta:</b> '+E(o.missing.join(" · "))+'</p>':'')+
 '<p class="cyCalc">Beneficio = mercado × 0,85 (prudente) × 0,95 (comisión) − 3 € envío − precio.</p>'+
 '<div class="cyActions">'+
 (o.url?'<a class="cyBtn'+(o.buyReady?' primary':'')+'" href="'+E(o.url)+'" target="_blank" rel="noopener">'+(o.buyReady?'Comprar':'Abrir producto exacto')+'</a>':'<span class="cyBtn off">Sin enlace directo</span>')+
 (o.cs?.url?'<a class="cyBtn" href="'+E(o.cs.url)+'" target="_blank" rel="noopener">'+(o.cs.type.startsWith("VENTA CERRADA REAL")?'Ver venta cerrada':'Ver referencia externa')+'</a>':'')+
 '<button class="cyBtn" type="button" data-cy-bought="'+E(x.id)+'">He comprado</button>'+
 '</div></div></article>';
}
function arbBanner(){
 try{
  const r=(window.CVTonArb?.state?.results||[]).find(z=>z.eval.ready&&Date.now()-z.quoteAt<=10000);
  if(!r)return "";
  return '<button type="button" class="cyArbGreen" data-goto-tab="arbitraje">🟢 VERDE REAL ENCONTRADO · Arbitraje '+E(r.route.id)+' · mín. '+r.eval.netPct.toFixed(2)+' % · Abrir</button>';
 }catch{return ""}
}
function renderBuy(){
 const host=document.getElementById("cvBuyBoard");if(!host)return;
 const all=cardRows().filter(x=>!x.ownedDuplicateBlocked&&!owned(x));
 const disc=all.filter(discarded),live=all.filter(x=>!discarded(x)).map(evaluate).filter(o=>o.ref>0);
 live.sort((a,b)=>(b.buyReady-a.buyReady)||((b.edge>=40)-(a.edge>=40))||b.score-a.score||b.edge-a.edge);
 const view=live.filter(o=>filter==="all"||o.x.universe===filter);
 const buys=live.filter(o=>o.buyReady),pk=live.filter(o=>o.x.universe==="pokemon").length,lo=live.filter(o=>o.x.universe==="lorcana").length;
 const ownedN=cardRows().filter(x=>x.ownedDuplicateBlocked||owned(x)).length;
 const newest=Math.max(0,...live.map(o=>Date.parse(o.x.checkedAt||"")||0));
 host.innerHTML=arbBanner()+
 '<section class="cyHead"><span class="cyKicker">COMPRA YA · POKÉMON + LORCANA · SIN EBAY</span>'+
 '<h2>'+(buys.length?buys.length+' compra(s) verificada(s)':'0 compras verificadas ahora · '+live.length+' oportunidades en vigilancia')+'</h2>'+
 '<p>'+(buys.length?'Cumplen venta cerrada, idioma exacto, oferta ≤24 h, enlace directo y ≥40 € de beneficio.':'Ninguna cumple hoy todas las condiciones de compra. La evidencia más reciente es del '+(newest?new Date(newest).toLocaleDateString("es-ES"):"—")+': abre el producto, confirma precio, idioma y estado, y solo entonces compra.')+'</p>'+
 '<div class="cyFilters" role="group" aria-label="Juego">'+[["all","Todas ("+live.length+")"],["pokemon","Pokémon ("+pk+")"],["lorcana","Lorcana ("+lo+")"]].map(([k,l])=>'<button type="button" data-cy-filter="'+k+'" class="'+(filter===k?"on":"")+'">'+l+'</button>').join("")+'</div>'+
 '<p class="cyNote">'+ownedN+' oportunidad(es) ocultas porque ya están en Mi colección. Precio de venta real solo se muestra como «VENTA CERRADA REAL»; un anuncio nunca cuenta como venta.</p></section>'+
 '<div class="cyList">'+view.map(oppCard).join("")+'</div>'+
 (disc.length?'<details class="cyDisc"><summary>Descartadas con motivo ('+disc.length+')</summary>'+disc.map(x=>'<div class="cyDiscRow"><b>'+E(x.name)+'</b> <span>'+E([x.set,x.number].filter(Boolean).join(" · "))+'</span> · '+E(discarded(x))+'</div>').join("")+'</details>':'');
 resolveLorcanaImages(view.map(o=>o.x)).then(()=>{if(view.some(o=>!o.x.image&&imgCache[o.x.id])&&!host.dataset.reimg){host.dataset.reimg="1";renderBuy()}});
}
function registerBuy(id){
 const x=(state.manualOpportunities||[]).find(o=>o.id===id);if(!x)return;
 if(owned(x)&&!confirm("Esta carta ya está en Mi colección. ¿Autorizas ampliar posición con otra unidad?"))return;
 const p=prompt("Precio pagado por "+x.name+" (€):",String(x.price||""));if(p==null)return;
 const price=N(String(p).replace(",","."));if(!(price>0)){alert("Precio no válido.");return}
 const s=prompt("Portes y comisiones de la compra (€):","0");if(s==null)return;
 const extra=Math.max(0,N(String(s).replace(",",".")));
 const lg=prompt("Idioma de la carta recibida:",lang(x.offerLanguage||x.language)[2]?lang(x.offerLanguage||x.language)[1]:"");if(lg==null)return;
 const o=evaluate(x);
 state.cards.push({id:crypto.randomUUID(),universe:x.universe,name:x.name,set:x.set||"",number:x.number||"",language:lg,grading:"RAW",grade:x.condition||"",condition:x.condition||"",
  value:o.ref||price,valuationStatus:"reference",purchase:price,purchaseShipping:extra,purchaseFees:0,quantity:1,purchaseDate:new Date().toISOString().slice(0,10),
  purpose:"investment",referenceImage:officialImage(x)||"",referenceImageIdentityExact:!!officialImage(x),buyOpportunityId:x.id,buySource:"Cardmarket",buySourceUrl:o.url||"",
  fundingSource:"capital-card-vault",updatedAt:new Date().toISOString()});
 x.boughtAt=new Date().toISOString();
 try{save()}catch{}
 try{window.CVRenderCollection?.()}catch{}
 renderBuy();
 alert("Compra registrada en Mi colección: "+x.name+" · coste "+EUR(price+extra)+".");
}
/* ---------- Sellado ---------- */
// Fichas directas de Cardmarket localizadas el 06/10/2026. «Desde» y «media 30 d» proceden del índice
// público de búsqueda (no de una consulta en vivo): son ESTIMACIÓN hasta abrir la ficha.
const SEEN="2026-10-06";
const SEALED=[
 ["pokemon","ETB","Prismatic Evolutions Elite Trainer Box","https://www.cardmarket.com/en/Pokemon/Products/Elite-Trainer-Boxes/Prismatic-Evolutions-Elite-Trainer-Box",88.99,155.59,1994],
 ["pokemon","ETB","151 Elite Trainer Box","https://www.cardmarket.com/en/Pokemon/Products/Elite-Trainer-Boxes/151-Elite-Trainer-Box",320,401.51,375],
 ["pokemon","Booster Bundle","151 Booster Bundle","https://www.cardmarket.com/en/Pokemon/Products/Booster-Boxes/151-Booster-Bundle",85,146.83,968],
 ["pokemon","Caja de sobres","Destined Rivals Booster Box","https://www.cardmarket.com/en/Pokemon/Products/Booster-Boxes/Destined-Rivals-Booster-Box",169.90,null,1331],
 ["pokemon","Caja de sobres","Journey Together Booster Box","https://www.cardmarket.com/en/Pokemon/Products/Booster-Boxes/Journey-Together-Booster-Box",120,null,864],
 ["pokemon","Caja de sobres","Surging Sparks Booster Box","https://www.cardmarket.com/en/Pokemon/Products/Booster-Boxes/Surging-Sparks-Booster-Box",130,null,770],
 ["pokemon","Booster Bundle","Prismatic Evolutions Booster Bundle","https://www.cardmarket.com/en/Pokemon/Products/Booster-Boxes/Prismatic-Evolutions-Booster-Bundle",null,null,null],
 ["lorcana","Caja de sobres","Fabled Booster Box","https://www.cardmarket.com/en/Lorcana/Products/Booster-Boxes/Fabled-Booster-Box",250,null,null],
 ["lorcana","Caja de sobres","Shimmering Skies Booster Box","https://www.cardmarket.com/en/Lorcana/Products/Booster-Boxes/Shimmering-Skies-Booster-Box",55,null,null],
 ["lorcana","Caja de sobres","The First Chapter Booster Box","https://www.cardmarket.com/en/Lorcana/Products/Booster-Boxes/The-First-Chapter-Booster-Box",null,null,null],
 ["lorcana","Caja de sobres","Ursula's Return Booster Box","https://www.cardmarket.com/en/Lorcana/Products/Booster-Boxes/Ursulas-Return-Booster-Box",null,null,null],
 ["lorcana","Producto especial","Fabled Illumineer's Trove","https://www.cardmarket.com/en/Lorcana/Products/Box-Sets/Fabled-Illumineers-Trove",null,null,null],
 ["lorcana","Producto especial","Archazia's Island Illumineer's Trove","https://www.cardmarket.com/en/Lorcana/Products/Box-Sets/Archazias-Island-Illumineers-Trove",null,null,null]
].map(([game,type,name,url,from,avg30,avail])=>({game,type,name,url,from,avg30,avail}));
function renderSealed(){
 const host=document.getElementById("cvSealedBoard");if(!host)return;
 const manual=(state.manualOpportunities||[]).filter(x=>String(x.condition).toUpperCase()==="SEALED").map(x=>({game:x.universe,type:"Mazo temático",name:x.name,url:x.url,from:N(x.price),avg30:N(x.avg30)||N(x.trend)||null,avail:N(x.available)||null,note:x.status,seen:String(x.checkedAt||"").slice(0,10)}));
 const own=(state.sealedProducts||[]).length;
 const rows=[...SEALED.map(r=>({...r,seen:SEEN})),...manual].filter(r=>directUrl(r.url));
 host.innerHTML='<section class="cyHead"><span class="cyKicker">SELLADO · POKÉMON + LORCANA</span><h2>0 compras verificadas · '+rows.length+' productos en vigilancia</h2>'+
 '<p>Fichas directas de Cardmarket. «Desde» es el anuncio más barato y «media 30 d» la media de ventas que publica Cardmarket, ambos tomados del índice público de búsqueda el '+new Date(SEEN).toLocaleDateString("es-ES")+': son ESTIMACIÓN. Un «desde» muy por debajo de la media suele ser otro idioma o un producto sin precintar: compruébalo en la ficha. No se muestran probabilidades de cartas premiadas porque no hay fuente fiable.</p></section>'+
 '<div class="cySealed">'+rows.map(r=>{const gap=r.from&&r.avg30?r.avg30-r.from:null;
  return '<article class="cyCard sealed"><div class="cyBody"><span class="cyBadge watch">VIGILAR</span><span class="cyGame">'+(r.game==="lorcana"?"Lorcana":"Pokémon")+' · '+E(r.type)+'</span><h4>'+E(r.name)+'</h4>'+
  '<dl class="cyGrid"><div><dt>Precio compra (desde)</dt><dd>'+(r.from?EUR(r.from):"ver ficha")+'</dd></div><div><dt>Mercado (media 30 d)</dt><dd>'+(r.avg30?EUR(r.avg30):"ver ficha")+'</dd></div>'+
  '<div><dt>Diferencia</dt><dd>'+(gap!=null?EUR(gap)+' · sin verificar':"—")+'</dd></div><div><dt>Liquidez</dt><dd>'+(r.avail?(r.avail>=300?"Alta":r.avail>=50?"Media":"Baja")+' ('+r.avail+')':"—")+'</dd></div>'+
  '<div><dt>Riesgo</dt><dd>'+(gap!=null&&gap>r.from*.4?"Alto (posible otro idioma)":"Medio (reimpresión)")+'</dd></div><div><dt>Tendencia</dt><dd>'+(r.avg30&&r.from?"Ver gráfico en ficha":"—")+'</dd></div></dl>'+
  (r.note?'<p class="cyMissing">'+E(r.note)+'</p>':'')+
  '<p class="cyCalc">Visto el '+E(r.seen||"—")+'. Potencial sellado: solo si el precio en la ficha (mismo idioma, precintado) queda ≥40 € por debajo de la media de 30 días tras un 5 % de comisión y el envío.</p>'+
  '<div class="cyActions"><a class="cyBtn" href="'+E(r.url)+'" target="_blank" rel="noopener">Abrir producto exacto</a></div></div></article>'}).join("")+'</div>'+
  '<p class="cyNote">'+own+' producto(s) sellado(s) registrados en tu inventario.</p>';
}
/* ---------- PSA ---------- */
function renderPSA(){
 const host=document.getElementById("cvPsaBoard");if(!host)return;
 const cards=(state.cards||[]).filter(c=>!c.archivedSold);
 const graded=cards.filter(c=>String(c.grading||"").toUpperCase()==="PSA"||/^psa/i.test(String(c.grading||"")));
 const raw=cards.filter(c=>String(c.grading||"RAW").toUpperCase()==="RAW");
 const g=state.gradingEconomics||{};
 const psaCost=N(g.gradeCost);
 const rowsRaw=raw.map(c=>({c,v:N(c.value)})).sort((a,b)=>b.v-a.v);
 host.innerHTML='<section class="cyHead"><span class="cyKicker">PSA · OPORTUNIDADES</span><h2>0 PSA 10 verificadas a ≤40 € ahora</h2>'+
 '<p>No hay ninguna oferta PSA 10 con precio, certificado y venta cerrada comparable verificados en los datos actuales; por eso no se recomienda comprar ninguna. Abajo: tus graduadas y tus RAW candidatas a enviar a PSA.</p></section>'+
 '<h3 class="cySub">Tus graduadas ('+graded.length+')</h3><div class="cyTable">'+graded.map(c=>'<div class="cyRow"><b>'+E(c.name)+'</b><span>PSA '+E(c.grade)+' · '+E(c.set||"")+'</span><span>Valor '+(N(c.value)?EUR(c.value):"pendiente")+'</span><span>Coste '+(c.purchase!=null?EUR(c.purchase):"pendiente")+'</span><span>Población PSA: '+(c.popTotal?E(c.popTotal):"sin dato verificado")+'</span></div>').join("")+'</div>'+
 '<h3 class="cySub">RAW → PSA: ¿compensa enviar?</h3>'+
 '<p class="cyNote">'+(psaCost?'Coste PSA configurado: '+EUR(psaCost)+' por carta.':'Configura el coste real de PSA (tarifa + envío) en la calculadora de abajo para ver el umbral.')+' Una RAW compensa si PSA 10 vendida − comisión − coste PSA − valor RAW ≥ 40 €. Sin precio PSA 10 verificado de esa carta exacta, se marca «pendiente».</p>'+
 '<div class="cyTable">'+rowsRaw.map(({c,v})=>'<div class="cyRow"><b>'+E(c.name)+'</b><span>'+E([c.number,c.set,c.language].filter(Boolean).join(" · "))+'</span><span>RAW '+(v?EUR(v):"sin valor")+'</span><span>'+(v&&v<15?"No compensa (valor RAW bajo)":"PSA 10 pendiente de precio verificado")+'</span></div>').join("")+'</div>';
}
/* ---------- montaje ---------- */
function mount(){
 const add=(sec,id,first)=>{const s=document.getElementById(sec);if(s&&!document.getElementById(id)){const d=document.createElement("div");d.id=id;d.className="cyBoard";first?s.prepend(d):s.insertBefore(d,s.children[1]||null)}};
 add("radar","cvBuyBoard",true);add("sealed","cvSealedBoard",true);add("pregrade","cvPsaBoard",true);
 renderAll();
}
function renderAll(){try{renderBuy()}catch(e){console.error(e)}try{renderSealed()}catch(e){console.error(e)}try{renderPSA()}catch(e){console.error(e)}}
document.addEventListener("click",e=>{
 const f=e.target.closest("[data-cy-filter]");if(f){filter=f.dataset.cyFilter;renderBuy();return}
 const b=e.target.closest("[data-cy-bought]");if(b){e.preventDefault();e.stopPropagation();registerBuy(b.dataset.cyBought);return}
 const g=e.target.closest("[data-goto-tab]");if(g){document.querySelector('.mainNav button[data-tab="'+g.dataset.gotoTab+'"]')?.click();return}
 const nav=e.target.closest(".mainNav button");if(nav)setTimeout(renderAll,60);
});
setInterval(()=>{if(document.body.dataset.activeTab==="radar"||!document.body.dataset.activeTab){const h=document.getElementById("cvBuyBoard");const has=!!h?.querySelector(".cyArbGreen"),now=!!arbBanner();if(has!==now)renderBuy()}},5000);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(mount,400));else setTimeout(mount,400);
setTimeout(renderAll,2500);
window.CVFinal={renderAll,evaluate,directUrl,rarity};
})();
