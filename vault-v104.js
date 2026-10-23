/* Card Vault V104 · Compra YA, Comprar para restaurar y Ventas reales.
   Reglas:
   - Un anuncio activo nunca cuenta como venta. Solo «venta» (operación individual cerrada) sustenta el precio de salida;
     un «agregado» (media de transacciones) se muestra, pero la ficha queda como evidencia débil.
   - COMPRA COMPROBADA = anuncio concreto + precio + disponible + comprobado hace ≤ 24 h. Pasado ese plazo, CADUCADA.
   - Ninguna cifra es beneficio seguro. Sin eBay. */
(()=>{"use strict";
const STORE="cv_v104_user",IDB="cardvault-v104";
const DEFAULTS={feePct:5,sellShip:5,buyShip:6,usdToEur:0.86,minProfit:40,freshHours:24,restLow:0.6,restMid:0.75,restHigh:0.9};
const N=v=>{if(v==null||v==="")return NaN;const n=Number(String(v).replace(/\s/g,"").replace(",","."));return Number.isFinite(n)?n:NaN};
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>Number.isFinite(v)?v.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—";
const SIGNED=v=>Number.isFinite(v)?(v>=0?"+":"−")+EUR(Math.abs(v)):"—";
const WHEN=t=>{const d=new Date(t);return Number.isFinite(d.getTime())?d.toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"sin fecha"};
const DAY=t=>{const d=new Date(t);return Number.isFinite(d.getTime())?d.toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"}):"fecha no registrada"};
const uid=()=>"u"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const median=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length?(s.length%2?s[m]:(s[m-1]+s[m])/2):NaN};

/* ---------- idioma ---------- */
const LANGS=[["Inglés","🇬🇧",["english","en","ingles","inglés"]],["Español","🇪🇸",["spanish","es","español","espanol"]],["Japonés","🇯🇵",["japanese","ja","jp","japonés","japones"]],
 ["Francés","🇫🇷",["french","fr","francés","frances"]],["Alemán","🇩🇪",["german","de","alemán","aleman"]],["Italiano","🇮🇹",["italian","it","italiano"]],
 ["Portugués","🇵🇹",["portuguese","pt","portugués","portugues"]],["Coreano","🇰🇷",["korean","ko","kr","coreano"]],["Chino","🇨🇳",["chinese","zh","chino","traditional chinese","simplified chinese"]]];
function lang(v){const k=String(v||"").trim().toLowerCase();if(!k||k==="pendiente"||k==="none")return {name:"Idioma sin confirmar",flag:"🏳️",known:false};
 for(const [name,flag,keys] of LANGS)if(keys.includes(k)||name.toLowerCase()===k)return {name,flag,known:true};return {name:String(v),flag:"🏳️",known:true}}

/* ---------- URLs ---------- */
const BAD=/(^|\.)(ebay\.[a-z.]+|ebayimg\.com)$/i;
function safeUrl(u){try{const x=new URL(String(u||"").trim());return x.protocol==="https:"&&!x.username&&!x.password&&!BAD.test(x.hostname)?x.href:""}catch{return ""}}
function isSearchUrl(u){try{const x=new URL(u);return /\/search\b|\/s-|\/buscar|\/busqueda/i.test(x.pathname)||["q","searchString","query","_nkw","keywords"].some(k=>x.searchParams.has(k))}catch{return true}}
function isCardmarketProduct(u){try{const x=new URL(u);return /(^|\.)cardmarket\.com$/i.test(x.hostname)&&/\/Products\//.test(x.pathname)}catch{return false}}
/* Cardmarket no tiene URL por anuncio: la ficha de producto + el vendedor identifican la oferta concreta. */
function listingPrecision(l){const u=safeUrl(l?.url);if(!u)return {ok:false,txt:"sin enlace"};if(isSearchUrl(u))return {ok:false,txt:"enlace de búsqueda (no vale)"};
 if(isCardmarketProduct(u))return l.seller?{ok:true,txt:"ficha Cardmarket · vendedor «"+l.seller+"»"}:{ok:false,txt:"ficha de producto sin vendedor identificado"};
 return {ok:true,txt:"anuncio individual"}}

/* ---------- configuración y datos del usuario ---------- */
function readUser(){try{const x=JSON.parse(localStorage.getItem(STORE)||"{}");return {cfg:{...DEFAULTS,...(x.cfg||{})},patches:x.patches||{},custom:Array.isArray(x.custom)?x.custom:[],migratedV103:!!x.migratedV103,fx:x.fx||null,bought:x.bought||{}}}catch{return {cfg:{...DEFAULTS},patches:{},custom:[]}}}
let user=readUser();
function writeUser(){try{localStorage.setItem(STORE,JSON.stringify(user));return true}catch{toast("No se ha podido guardar en este navegador (almacenamiento lleno o bloqueado).");return false}}

/* ---------- fotos del anuncio (IndexedDB) ---------- */
const photoCache={};
function idb(){return new Promise((ok,ko)=>{try{const r=indexedDB.open(IDB,1);r.onupgradeneeded=()=>r.result.createObjectStore("photos");r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)}catch(e){ko(e)}})}
async function photoPut(id,data){photoCache[id]=data;try{const db=await idb();await new Promise((ok,ko)=>{const t=db.transaction("photos","readwrite");t.objectStore("photos").put(data,id);t.oncomplete=ok;t.onerror=()=>ko(t.error)});return true}catch{return false}}
async function photoLoadAll(){try{const db=await idb();await new Promise(ok=>{const t=db.transaction("photos","readonly"),s=t.objectStore("photos"),c=s.openCursor();c.onsuccess=()=>{const k=c.result;if(k){photoCache[k.key]=k.value;k.continue()}else ok()};c.onerror=()=>ok()})}catch{}}
function compress(file){return new Promise((ok,ko)=>{const fr=new FileReader();fr.onerror=()=>ko(fr.error);fr.onload=()=>{const im=new Image();im.onerror=()=>ko(new Error("imagen"));im.onload=()=>{const s=Math.min(1,1100/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);ok(c.toDataURL("image/jpeg",0.82))};im.src=fr.result};fr.readAsDataURL(file)})}

/* ---------- carga de oportunidades ---------- */
function appState(){try{return window.CVStateBridge?.get?.()||null}catch{return null}}
function fromResearch(o){
 const sales=[];
 const cs=o.closedSaleEvidence;
 if(cs&&cs.transactionType==="closed-sale")for(const p of (cs.pricesEUR||[]))sales.push({id:"r-"+o.id+"-cs"+p,kind:"venta",price:N(p),currency:"EUR",date:o.lastSaleDate||"",capturedAt:cs.at||"",condition:cs.condition||"",language:cs.language||"",platform:"Cardmarket (vía "+String(cs.source||"").split("·")[0].trim()+")",url:safeUrl(cs.url),note:(o.lastSaleDate?"":"Fecha exacta de la operación no registrada; capturada el "+DAY(cs.at)+". ")+"Investigación previa, no reverificada.",addedBy:"investigación"});
 if(N(o.observedSalePrice)>0)sales.push({id:"r-"+o.id+"-obs",kind:"venta",price:N(o.observedSalePrice),currency:"EUR",date:o.observedSaleDate||"",condition:"",language:"",platform:"Última venta visible (TCGGraph)",url:safeUrl(o.marketEvidence?.url),note:"Idioma y estado de esa venta no registrados.",addedBy:"investigación"});
 if(N(o.avg30)>0)sales.push({id:"r-"+o.id+"-avg30",kind:"agregado",price:N(o.avg30),currency:"EUR",date:o.checkedAt||"",condition:"todas",language:"todos",platform:"Cardmarket · media de ventas 30 días",url:safeUrl(o.url),note:"Media agregada de todos los idiomas y estados: no es una venta individual.",addedBy:"investigación"});
 if(N(o.marketEvidence?.currentExitEUR)>0)sales.push({id:"r-"+o.id+"-ask",kind:"anuncio",price:N(o.marketEvidence.currentExitEUR),currency:"EUR",date:o.marketEvidence.at||o.checkedAt||"",condition:o.condition||"",language:o.offerLanguage||"",platform:"Cardmarket · anuncios activos",url:safeUrl(o.url),note:"Precio pedido por vendedores. NO es una venta.",addedBy:"investigación"});
 const url=safeUrl(o.url);
 return {id:"buy-"+o.id,lane:"compra",game:o.universe==="lorcana"?"lorcana":"pokemon",name:o.name,set:o.set||"",number:o.number||"",rarity:o.rarity||o.variant||"",language:o.offerLanguage||o.language||"",
  image:o.image||"",links:{cardmarket:url},why:o.note||"",source:"Investigación V76–V101 (septiembre 2026)",
  listing:{url,shop:o.shop||"Cardmarket",seller:o.seller||"",price:N(o.price),shipping:NaN,shippingKind:"estimado",condition:o.condition||"",defects:"",language:o.offerLanguage||"",checkedAt:o.checkedAt||o.evidenceCheckedAt||"",checkedBy:"investigación",available:"desconocido"},
  sales,origStatus:o.status||"",ownedFlag:!!o.ownedDuplicateBlocked||/YA EN MI COLECCI/i.test(String(o.status||""))};
}
function owned(x){
 const st=appState();if(!st)return false;
 if(x.ownedFlag)return true;
 const n=v=>String(v||"").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ");
 const num=v=>n(v).replace(/\s/g,"").replace(/^0+/,"");
 return (st.cards||[]).some(c=>{
  if(!c||c.archivedSold||(c.universe||"pokemon")!==x.game||n(c.name)!==n(x.name))return false;
  if(c.number&&x.number&&num(c.number)!==num(x.number))return false;
  const a=lang(c.language),b=lang(x.listing?.language||x.language);
  return !(a.known&&b.known&&a.name!==b.name);
 });
}
function baseItems(){
 const st=appState(),out=[];
 for(const o of (st?.manualOpportunities||[])){
  if(!o||!["pokemon","lorcana"].includes(o.universe)||String(o.condition).toUpperCase()==="SEALED"||!(N(o.price)>0))continue;
  if(/^DESCARTADA/i.test(String(o.status||""))||o.resolvedMarketNoEdge)continue;
  out.push(fromResearch(o));
 }
 for(const t of (window.CV_VAULT_DATA?.restoreTargets||[]))out.push({...t,listing:null,sales:[]});
 return out;
}
function merge(base){
 const p=user.patches[base.id]||{};
 const it={...base,listing:p.listing?{...(base.listing||{}),...p.listing}:base.listing,sales:[...(base.sales||[]).filter(s=>!(p.removedSales||[]).includes(s.id)),...(p.sales||[])],interventions:p.interventions||[],hidden:!!p.hidden};
 if(photoCache[it.id])it.listingPhoto=photoCache[it.id];
 return it;
}
function allItems(){return [...baseItems(),...user.custom].map(merge)}

/* ---------- motor ---------- */
function fxNow(){const f=user.fx;return f&&f.rate>0?f:{rate:user.cfg.usdToEur,date:"",source:"manual"}}
function toEUR(s,cfg){const p=N(s.price);if(!(p>0))return NaN;return String(s.currency||"EUR").toUpperCase()==="USD"?p*(cfg===user.cfg?fxNow().rate:cfg.usdToEur):p}
async function refreshFx(){if(user.fx&&Date.now()-Date.parse(user.fx.fetchedAt||0)<12*3600e3)return;try{const r=await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR",{cache:"no-store"});if(!r.ok)return;const j=await r.json();const rate=Number(j?.rates?.EUR);if(rate>0&&rate<2){user.fx={rate,date:j.date||"",source:"BCE vía frankfurter.app",fetchedAt:new Date().toISOString()};writeUser();renderAll()}}catch{}}
function status(it,now,cfg){
 const l=it.listing;
 if(!l||!(safeUrl(l.url)||N(l.price)>0))return {code:"objetivo",label:"OBJETIVO · SIN ANUNCIO",missing:["registrar un anuncio concreto"]};
 if(l.available==="no")return {code:"caducada",label:"CADUCADA",missing:["ya no está disponible"],why:"Marcada como no disponible el "+WHEN(l.checkedAt)};
 const t=Date.parse(l.checkedAt||""),age=(now-t)/3600000;
 if(!(t>0)||age>cfg.freshHours)return {code:"caducada",label:"CADUCADA",missing:["volver a comprobar precio y stock"],why:t>0?"Comprobación de "+WHEN(t)+" (hace más de "+cfg.freshHours+" h)":"Sin fecha de comprobación"};
 const miss=[],prec=listingPrecision(l);
 if(!prec.ok)miss.push("anuncio concreto ("+prec.txt+")");
 if(!(N(l.price)>0))miss.push("precio actual");
 if(l.available!=="si")miss.push("confirmar que sigue disponible");
 if(!lang(l.language||it.language).known)miss.push("idioma del ejemplar");
 if(!l.condition)miss.push("estado de conservación");
 return miss.length?{code:"observacion",label:"EN OBSERVACIÓN",missing:miss}:{code:"comprobada",label:"COMPRA COMPROBADA",missing:[]};
}
function economics(it,cfg){
 const l=it.listing||{},buy=N(l.price),shipKnown=N(l.shipping)>=0,buyShip=shipKnown?N(l.shipping):cfg.buyShip;
 const ventas=it.sales.filter(s=>s.kind==="venta").map(s=>toEUR(s,cfg)).filter(v=>v>0);
 const agreg=it.sales.filter(s=>s.kind==="agregado").map(s=>toEUR(s,cfg)).filter(v=>v>0);
 const basis=ventas.length?"venta":agreg.length?"agregado":null,arr=ventas.length?ventas:agreg;
 if(!basis)return {basis:null,buy,buyShip,shipKnown,n:0};
 let low=Math.min(...arr),mid=median(arr),high=Math.max(...arr);
 const unaltered={low,mid,high};
 if(it.lane==="restaurar"){low*=cfg.restLow;mid*=cfg.restMid;high*=cfg.restHigh}
 const net=s=>s*(1-cfg.feePct/100)-cfg.sellShip-buy-buyShip;
 const costs=s=>s*cfg.feePct/100+cfg.sellShip+buyShip;
 return {basis,n:arr.length,buy,buyShip,shipKnown,sale:{low,mid,high},unaltered,costs:{low:costs(low),mid:costs(mid),high:costs(high)},net:buy>0&&basis==="venta"?{low:net(low),mid:net(mid),high:net(high)}:null};
}
function verdict(st,ec,cfg){
 if(!ec.basis)return {code:"sin-datos",label:"Sin ventas reales registradas",tone:"muted"};
 if(ec.basis==="agregado")return {code:"solo-agregado",label:"Sin ventas cerradas: no se calcula beneficio con medias agregadas",tone:"muted"};
 if(!ec.net)return {code:"sin-precio",label:"Falta el precio de compra",tone:"muted"};
 if(st.code==="comprobada"&&ec.basis==="venta"&&ec.n>=2&&ec.net.low>=cfg.minProfit)return {code:"rentable",label:"Rentable según ventas reales · no garantizado",tone:"good"};
 if(ec.net.mid>=cfg.minProfit)return {code:"potencial",label:ec.basis==="venta"?(ec.n<2?"Potencial · solo 1 venta de referencia":"Potencial · faltan comprobaciones de compra"):"Potencial",tone:"warn"};
 if(ec.net.mid>0)return {code:"bajo",label:"Margen inferior a "+EUR(cfg.minProfit),tone:"muted"};
 return {code:"negativo",label:"Pérdida estimada",tone:"bad"};
}
function evaluate(it,now=Date.now(),cfg=user.cfg){const st=status(it,now,cfg),ec=economics(it,cfg);return {it,st,ec,vd:verdict(st,ec,cfg)}}

/* ---------- vistas ---------- */
const KIND={venta:["VENTA CERRADA","k-venta"],agregado:["DATO AGREGADO","k-agregado"],anuncio:["ANUNCIO ACTIVO · NO ES VENTA","k-anuncio"]};
function photoBlock(it){
 const own=it.listingPhoto||safeUrl(it.listing?.photoUrl);
 const src=own||safeUrl(it.image)||window.CVCardImages?.entry?.({name:it.name,number:it.number,set:it.set,universe:it.game})?.path||"";
 const tag=own?"Foto del ejemplar anunciado":src?(it.lane==="restaurar"?"Imagen de catálogo · NO es el ejemplar dañado":"Imagen de catálogo de la carta"):"";
 return '<figure class="v4photo">'+(src?'<img src="'+E(src)+'" alt="'+E(it.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>':"")+
  '<div class="v4noimg"'+(src?' hidden':'')+'><b>'+E(it.name)+'</b><span>Foto no disponible</span></div>'+(tag?'<figcaption class="'+(own?"own":"")+'">'+tag+'</figcaption>':'')+'</figure>';
}
function salesList(it,cfg){
 if(!it.sales.length)return '<p class="v4empty">Sin referencias de venta todavía.</p>';
 return '<ul class="v4sales">'+it.sales.map(s=>{const k=KIND[s.kind]||KIND.anuncio,eur=toEUR(s,cfg);
  return '<li><span class="v4kind '+k[1]+'">'+k[0]+'</span><b>'+(String(s.currency).toUpperCase()==="USD"?E(N(s.price).toLocaleString("es-ES",{style:"currency",currency:"USD"}))+' ≈ '+EUR(eur)+' <small>(cambio '+String(fxNow().rate).replace(".",",")+(fxNow().date?' BCE '+DAY(fxNow().date):' manual')+')</small>':EUR(eur))+'</b>'+
  '<span>'+E([s.date?DAY(s.date):"fecha de operación no registrada",s.condition&&"estado "+s.condition,s.language&&lang(s.language).flag+" "+lang(s.language).name,s.platform].filter(Boolean).join(" · "))+'</span>'+
  (s.note?'<small>'+E(s.note)+'</small>':'')+
  '<span class="v4row">'+(safeUrl(s.url)?'<a href="'+E(safeUrl(s.url))+'" target="_blank" rel="noopener noreferrer">Ver fuente ↗</a>':'<small>Sin enlace verificable</small>')+
  ' <small>· añadida por '+E(s.addedBy||"usuario")+'</small> <button type="button" class="v4link" data-v4-delsale="'+E(it.id)+'|'+E(s.id)+'">Quitar</button></span></li>'}).join("")+'</ul>';
}
function card(ev,cfg){
 const {it,st,ec,vd}=ev,l=it.listing||{},lg=lang(l.language||it.language),isR=it.lane==="restaurar",prec=listingPrecision(l);
 const scen=ec.net?[["Conservador",ec.sale.low,ec.net.low],["Central",ec.sale.mid,ec.net.mid],["Optimista",ec.sale.high,ec.net.high]]:null;
 const basisTxt=ec.basis==="venta"?ec.n+" venta"+(ec.n>1?"s":"")+" cerrada"+(ec.n>1?"s":""):ec.basis==="agregado"?"media agregada (no venta individual)":"";
 const range=it.lane==="compra"&&N(l.price)>0&&(l.price<20||l.price>100)?'<span class="v4tag">Fuera de 20–100 €</span>':'';
 return '<article class="v4card s-'+st.code+'" id="card-'+E(it.id)+'">'+photoBlock(it)+'<div class="v4body">'+
 '<div class="v4badges"><span class="v4status s-'+st.code+'">'+st.label+'</span><span class="v4tag">'+(it.game==="lorcana"?"Lorcana":"Pokémon")+'</span>'+range+'</div>'+
 '<h3>'+E(it.name)+'</h3><p class="v4id">'+E([it.set,it.number&&"nº "+it.number,it.rarity].filter(Boolean).join(" · "))+'</p>'+
 '<p class="v4lang"><span class="v4flag">'+lg.flag+'</span> '+E(lg.name)+(l.condition?' · Estado: <b>'+E(l.condition)+'</b>':isR?' · Objetivo: ejemplares dañados; reventa comparada con '+E(it.targetCondition||"HP / MP"):'')+'</p>'+
 (l.defects?'<p class="v4defects"><b>Defectos visibles:</b> '+E(l.defects)+'</p>':'')+
 '<div class="v4money">'+
  '<div><span>PRECIO DE COMPRA</span><b>'+(N(l.price)>0?EUR(N(l.price)):"—")+'</b><small>'+(N(l.price)>0?'+ envío '+EUR(ec.buyShip)+(ec.shipKnown?' (confirmado)':' (estimado)'):'pendiente de anuncio')+'</small></div>'+
  '<div><span>PRECIO DE VENTA ESTIMADO</span><b>'+(ec.basis==="venta"?EUR(ec.sale.mid):"—")+'</b><small>'+(ec.basis==="agregado"?'Referencia agregada '+EUR(ec.unaltered.mid)+' (no es venta). Añade ventas cerradas.':ec.basis?(isR?'restaurada declarada · '+Math.round(cfg.restMid*100)+' % de '+EUR(ec.unaltered.mid)+' · ':'')+basisTxt:'sin ventas reales')+'</small></div>'+
  '<div><span>GASTOS Y COMISIONES</span><b>'+(ec.net?EUR(ec.costs.mid):"—")+'</b><small>'+cfg.feePct+' % comisión + envíos</small></div>'+
  '<div class="v4profit t-'+vd.tone+'"><span>BENEFICIO POTENCIAL</span><b>'+(ec.net?SIGNED(ec.net.mid):"—")+'</b><small>'+E(vd.label)+'</small></div>'+
 '</div>'+
 (scen?'<table class="v4scen"><thead><tr><th>Escenario</th><th>Venta</th><th>Beneficio</th></tr></thead><tbody>'+scen.map(([n,s,p])=>'<tr><td>'+n+'</td><td>'+EUR(s)+'</td><td class="'+(p>=cfg.minProfit?"pos":p<0?"neg":"")+'">'+SIGNED(p)+'</td></tr>').join("")+'</tbody></table>'+
  '<p class="v4basis">Fundamento: conservador = venta más baja, central = mediana, optimista = venta más alta'+(isR?', multiplicadas por '+[cfg.restLow,cfg.restMid,cfg.restHigh].map(f=>Math.round(f*100)+" %").join(" / ")+' por ser carta restaurada (ajuste editable, no es dato de mercado)':'')+'. Beneficio = venta − '+cfg.feePct+' % − envío de venta '+EUR(cfg.sellShip)+' − compra − envío de compra. '+(isR?'No incluye materiales ni horas. ':'')+'Nunca es un beneficio garantizado.</p>':'')+
 (st.missing.length?'<p class="v4missing"><b>'+(st.code==="caducada"?E(st.why||"Comprobación vencida")+'. ':'')+'Falta:</b> '+E(st.missing.join(" · "))+'</p>':'')+
 (it.why?'<p class="v4why"><b>Por qué merece la pena mirarla:</b> '+E(it.why)+'</p>':'')+
 '<dl class="v4facts">'+
  '<div><dt>Tienda / vendedor</dt><dd>'+E([l.shop,l.seller].filter(Boolean).join(" · ")||"—")+'</dd></div>'+
  '<div><dt>Comprobado</dt><dd>'+(l.checkedAt?WHEN(l.checkedAt)+' · por '+E(l.checkedBy||"usuario"):"nunca")+'</dd></div>'+
  '<div><dt>Disponibilidad</dt><dd>'+({si:"Disponible al comprobar",no:"No disponible",desconocido:"No verificable"}[l.available]||"Sin anuncio")+'</dd></div>'+
  '<div><dt>Enlace</dt><dd>'+E(prec.txt)+'</dd></div>'+
 '</dl>'+
 '<div class="v4actions">'+
  (safeUrl(l.url)?'<a class="v4btn primary" href="'+E(safeUrl(l.url))+'" target="_blank" rel="noopener noreferrer">'+(prec.ok?"Abrir anuncio":"Abrir ficha del producto")+' ↗</a>':'')+
  '<button type="button" class="v4btn '+(st.code==="comprobada"?"":"primary")+'" data-v4-verify="'+E(it.id)+'">'+(st.code==="objetivo"?"Registrar anuncio":"Comprobar ahora")+'</button>'+
  '<button type="button" class="v4btn" data-v4-sale="'+E(it.id)+'">Añadir venta real</button>'+
  (N(l.price)>0&&st.code!=="objetivo"?(user.bought[it.id]?'<span class="v4btn off">Comprada el '+DAY(user.bought[it.id])+'</span>':'<button type="button" class="v4btn" data-v4-bought="'+E(it.id)+'">He comprado</button>'):'')+
  (it.links?.cardmarket&&it.links.cardmarket!==safeUrl(l.url)?'<a class="v4btn" href="'+E(it.links.cardmarket)+'" target="_blank" rel="noopener noreferrer">Cardmarket ↗</a>':'')+
  (it.links?.tcgplayer?'<a class="v4btn" href="'+E(it.links.tcgplayer)+'" target="_blank" rel="noopener noreferrer">Ventas TCGplayer ↗</a>':'')+
 '</div>'+
 '<details class="v4more"><summary>Referencias de venta ('+it.sales.length+')</summary>'+salesList(it,cfg)+'</details>'+
 (isR?'<details class="v4more"><summary>Texto para declarar la restauración al vender</summary>'+declareForm(it)+'</details>':'')+
 (it.custom||l.checkedBy==="usuario"?'<p class="v4row"><button type="button" class="v4link" data-v4-reset="'+E(it.id)+'">'+(it.custom?"Eliminar esta ficha":"Borrar mi comprobación")+'</button></p>':'')+
 '</div></article>';
}
const INTERVENTIONS=["Limpieza de superficie","Corrección de doblez o pliegue","Tratamiento de bordes y esquinas","Retoque de color o tinta","Otra intervención (detallar)"];
function declareText(it){
 const iv=it.interventions||[];
 return "Carta original: "+it.name+" · "+[it.set,it.number&&"nº "+it.number,lang(it.listing?.language||it.language).name].filter(Boolean).join(" · ")+".\n"+
 "CARTA RESTAURADA. Intervenciones realizadas: "+(iv.length?iv.join("; "):"(marcar intervenciones)")+".\n"+
 "Se vende declarando la restauración. No equivale a un ejemplar sin alterar, no se garantiza ninguna categoría de conservación (NM u otra) ni nota de graduación, y puede no ser aceptada por empresas de graduación. Fotos de antes y después disponibles.";
}
function declareForm(it){
 return '<div class="v4declare" data-v4-declare="'+E(it.id)+'">'+INTERVENTIONS.map(t=>'<label><input type="checkbox" value="'+E(t)+'"'+((it.interventions||[]).includes(t)?" checked":"")+'> '+E(t)+'</label>').join("")+
 '<textarea readonly rows="6">'+E(declareText(it))+'</textarea><button type="button" class="v4btn" data-v4-copy="'+E(it.id)+'">Copiar texto</button>'+
 '<small>No describe técnicas: solo qué se ha intervenido, para que el comprador esté informado.</small></div>';
}
function summary(evs,lane,cfg,hiddenOwned){
 const n=c=>evs.filter(e=>e.st.code===c).length,rent=evs.filter(e=>e.vd.code==="rentable").length;
 return '<div class="v4summary"><div class="s-comprobada"><b>'+n("comprobada")+'</b><span>Compra comprobada</span></div><div class="s-observacion"><b>'+n("observacion")+'</b><span>En observación</span></div><div class="s-caducada"><b>'+n("caducada")+'</b><span>Caducadas</span></div>'+
  (lane==="restaurar"?'<div class="s-objetivo"><b>'+n("objetivo")+'</b><span>Objetivos sin anuncio</span></div>':'<div class="s-objetivo"><b>'+rent+'</b><span>Rentables con evidencia</span></div>')+'</div>'+
  (hiddenOwned?'<p class="v4note">'+hiddenOwned+' oportunidad(es) ocultas porque esa carta ya está en Mi colección.</p>':'');
}
function order(a,b){const r={comprobada:0,observacion:1,objetivo:2,caducada:3};return (r[a.st.code]-r[b.st.code])||((b.vd.code==="rentable")-(a.vd.code==="rentable"))||((b.ec.net?.mid??-1e9)-(a.ec.net?.mid??-1e9))}
let gameFilter="all";
function renderLane(lane){
 const host=document.getElementById(lane==="compra"?"v4Buy":"v4Restore");if(!host)return;
 const cfg=user.cfg,now=Date.now();
 let items=allItems().filter(i=>i.lane===lane&&!i.hidden),hiddenOwned=0;
 if(lane==="compra"){const keep=[];for(const i of items){if(owned(i))hiddenOwned++;else keep.push(i)}items=keep}
 const evs=items.map(i=>evaluate(i,now,cfg)).sort(order);
 const view=evs.filter(e=>gameFilter==="all"||e.it.game===gameFilter);
 const live=view.filter(e=>e.st.code!=="caducada"),old=view.filter(e=>e.st.code==="caducada");
 const isR=lane==="restaurar";
 host.innerHTML='<section class="v4head"><span class="v4kicker">'+(isR?"POKÉMON · CARTAS DETERIORADAS · REVENTA COMO RESTAURADA":"POKÉMON + LORCANA · 20–100 € · OBJETIVO ≥ "+EUR(cfg.minProfit)+" · SIN EBAY")+'</span>'+
  '<h2>'+(isR?"Comprar para restaurar":"Compra YA")+'</h2>'+
  '<p>'+(isR?"Cartas baratas en mal estado cuya versión mejor conservada se vende bien. La reventa se calcula con ventas cerradas de ejemplares en mejor estado, rebajadas por ser carta restaurada. Se descuentan compra, comisiones y envíos; no tus materiales ni tus horas.":"Cada ficha muestra el anuncio, el precio de compra, la venta estimada a partir de ventas cerradas reales y el beneficio tras comisiones y envíos. Una compra comprobada no implica beneficio seguro.")+'</p>'+
  summary(evs,lane,cfg,hiddenOwned)+top3(live)+
  '<div class="v4filters" role="group" aria-label="Juego">'+[["all","Todas"],["pokemon","Pokémon"],["lorcana","Lorcana"]].map(([k,t])=>'<button type="button" data-v4-filter="'+k+'" class="'+(gameFilter===k?"on":"")+'">'+t+'</button>').join("")+
  '<button type="button" class="v4btn primary" data-v4-new="'+lane+'">+ Nueva oportunidad</button></div>'+
  '<p class="v4honest">Comprobación en directo: Card Vault no puede leer Cardmarket ni TCGplayer desde el navegador (lo bloquean). Pulsa «Comprobar ahora», abre el enlace, confirma precio, envío, vendedor, estado y stock, y la ficha queda fechada. Válido '+cfg.freshHours+' h.</p></section>'+
  (live.length?'<div class="v4list">'+live.map(e=>card(e,cfg)).join("")+'</div>':'<p class="v4empty big">'+(isR?"No hay objetivos activos.":"Ahora mismo no hay ninguna compra comprobada ni en observación. Revisa las caducadas de abajo: son oportunidades investigadas que hay que volver a comprobar.")+'</p>')+
  (old.length?'<details class="v4old"'+(live.length?'':' open')+'><summary>Caducadas · volver a comprobar ('+old.length+')</summary><div class="v4list">'+old.map(e=>card(e,cfg)).join("")+'</div></details>':'')+
  settingsBlock(cfg);
 wireImages(host);
}
function top3(live){
 const top=live.filter(e=>e.ec.net).slice(0,3);if(!top.length)return "";
 return '<div class="v4top"><b>Las 3 mejores ahora</b>'+top.map((e,i)=>'<a href="#card-'+E(e.it.id)+'" class="t-'+e.vd.tone+'"><span>#'+(i+1)+' '+E(e.it.name)+'</span><strong>'+SIGNED(e.ec.net.mid)+'</strong><small>'+E(e.st.label)+' · '+E(e.vd.label)+'</small></a>').join("")+'</div>';
}
function settingsBlock(cfg){
 const f=(k,l,s)=>'<label>'+l+'<input inputmode="decimal" data-v4-cfg="'+k+'" value="'+E(String(cfg[k]).replace(".",","))+'"><small>'+s+'</small></label>';
 return '<details class="v4settings"><summary>Supuestos del cálculo (editables)</summary><div class="v4grid">'+
  f("feePct","Comisión de venta %","Cardmarket vendedor particular: 5 %. Ajusta si vendes en otra plataforma.")+
  f("sellShip","Envío de venta €","Estimado: envío certificado con seguimiento.")+
  f("buyShip","Envío de compra por defecto €","Solo se usa si el anuncio no indica envío (aparece como «estimado»).")+
  f("usdToEur","Cambio USD → EUR manual",fxNow().source==="manual"?"Se usa este valor: no se pudo obtener el cambio del BCE.":"En uso el cambio del BCE "+String(fxNow().rate).replace(".",",")+" del "+DAY(fxNow().date)+"; este valor solo es reserva.")+
  f("minProfit","Beneficio mínimo €","Umbral para considerar la operación interesante.")+
  f("restLow","Restaurada · conservador","Fracción del precio de ejemplares sin alterar.")+
  f("restMid","Restaurada · central","")+f("restHigh","Restaurada · optimista","")+
 '</div><button type="button" class="v4btn" data-v4-cfgsave>Guardar supuestos</button></details>';
}
function wireImages(root){root.querySelectorAll("img[data-v4img]").forEach(im=>{const fail=()=>{im.hidden=true;const n=im.parentElement.querySelector(".v4noimg");if(n)n.hidden=false};if(im.complete&&im.naturalWidth===0&&im.src)fail();im.addEventListener("error",fail,{once:true})})}

function renderSales(){
 const host=document.getElementById("v4Sales");if(!host)return;const cfg=user.cfg;
 const rows=[];for(const it of allItems())for(const s of it.sales)rows.push({it,s});
 const c=k=>rows.filter(r=>r.s.kind===k).length;
 const by={};for(const r of rows)(by[r.it.id]=by[r.it.id]||{it:r.it,list:[]}).list.push(r.s);
 host.innerHTML='<section class="v4head"><span class="v4kicker">PRECIOS QUE HAN PAGADO COMPRADORES REALES</span><h2>Ventas reales</h2>'+
 '<p>Cada referencia indica carta, fecha, precio, estado, idioma, plataforma y enlace. Se separan tres tipos que nunca se mezclan:</p>'+
 '<div class="v4legend"><span class="v4kind k-venta">VENTA CERRADA</span> operación individual completada · <span class="v4kind k-agregado">DATO AGREGADO</span> media de transacciones (p. ej. media 30 días de Cardmarket o «Market Price» de TCGplayer) · <span class="v4kind k-anuncio">ANUNCIO ACTIVO · NO ES VENTA</span> precio pedido.</div>'+
 '<div class="v4summary"><div class="s-comprobada"><b>'+c("venta")+'</b><span>Ventas cerradas</span></div><div class="s-observacion"><b>'+c("agregado")+'</b><span>Datos agregados</span></div><div class="s-caducada"><b>'+c("anuncio")+'</b><span>Anuncios (no ventas)</span></div></div>'+
 '<details class="v4settings"><summary>Dónde consultar ventas cerradas legítimas</summary><ul class="v4help">'+
 '<li><b>TCGplayer</b> · en la ficha del producto, «Latest Sales» muestra fecha, estado, variante y precio de cada venta. Su «Market Price» es un dato agregado.</li>'+
 '<li><b>Cardmarket</b> · la ficha muestra media de 30, 7 y 1 días (agregado de ventas). Las operaciones individuales no son públicas; algunos servicios como PokeValue las recopilan.</li>'+
 '<li><b>PSA · Auction Prices Realized</b> · ventas de cartas graduadas con fecha y casa de subastas. Para cartas restauradas no sirve como comparable directo.</li>'+
 '<li>No se usan datos de eBay ni de herramientas que solo recopilan eBay.</li></ul></details></section>'+
 (rows.length?Object.values(by).map(({it,list})=>'<article class="v4salecard"><h3>'+E(it.name)+'</h3><p class="v4id">'+E([it.set,it.number&&"nº "+it.number].filter(Boolean).join(" · "))+' · '+(it.lane==="restaurar"?"Comprar para restaurar":"Compra YA")+'</p>'+salesList({...it,sales:list},cfg)+'<div class="v4actions"><button type="button" class="v4btn" data-v4-sale="'+E(it.id)+'">Añadir venta real</button></div></article>').join(""):'<p class="v4empty big">Aún no hay referencias.</p>')+
 '<details class="v4settings"><summary>Copia de mis comprobaciones</summary><p>Tus comprobaciones, ventas añadidas y fichas propias se guardan en este iPhone. Exporta una copia para no perderlas.</p><div class="v4actions"><button type="button" class="v4btn" data-v4-export>Exportar copia</button><label class="v4btn">Importar copia<input type="file" accept="application/json" data-v4-import hidden></label></div></details>';
}

/* ---------- hoja de edición ---------- */
function sheet(html){
 let s=document.getElementById("v4Sheet");
 if(!s){s=document.createElement("div");s.id="v4Sheet";s.className="v4sheet";s.setAttribute("role","dialog");s.setAttribute("aria-modal","true");document.body.appendChild(s)}
 s.innerHTML='<div class="v4sheetIn">'+html+'</div>';s.hidden=false;document.documentElement.classList.add("v4lock");
 setTimeout(()=>s.querySelector("input,select,textarea")?.focus?.({preventScroll:true}),50);return s;
}
function closeSheet(){const s=document.getElementById("v4Sheet");if(s){s.hidden=true;s.innerHTML=""}document.documentElement.classList.remove("v4lock")}
const fld=(name,label,val,attrs="")=>'<label>'+label+'<input name="'+name+'" value="'+E(val??"")+'" '+attrs+'></label>';
const sel=(name,label,val,opts)=>'<label>'+label+'<select name="'+name+'">'+opts.map(([v,t])=>'<option value="'+E(v)+'"'+(String(val)===v?" selected":"")+'>'+E(t)+'</option>').join("")+'</select></label>';
const LANG_OPTS=[["","— elegir —"],...LANGS.map(([n])=>[n,n])];
const COND_OPTS=[["","— elegir —"],["NM","Near Mint (NM)"],["EX","Excellent (EX)"],["GD","Good (GD)"],["LP","Light Played (LP)"],["PL","Played (PL)"],["MP","Moderately Played"],["HP","Heavily Played"],["PO","Poor (PO)"],["DMG","Damaged"]];
function findItem(id){return allItems().find(i=>i.id===id)}
function verifySheet(id){
 const it=findItem(id);if(!it)return;const l=it.listing||{};
 sheet('<h3>'+(it.listing?"Comprobar anuncio":"Registrar anuncio")+'</h3><p class="v4id">'+E(it.name)+' · '+E([it.set,it.number].filter(Boolean).join(" · "))+'</p>'+
 '<p class="v4note">Abre el anuncio, comprueba los datos y guárdalos. Se registrará la fecha y hora actuales como «comprobado por ti».</p>'+
 (safeUrl(l.url)||it.links?.cardmarket?'<p><a class="v4btn" href="'+E(safeUrl(l.url)||it.links.cardmarket)+'" target="_blank" rel="noopener noreferrer">Abrir '+(safeUrl(l.url)?"anuncio":"Cardmarket")+' ↗</a></p>':'')+
 '<form data-v4-form="verify" data-id="'+E(id)+'" class="v4form">'+
 fld("url","Enlace del anuncio (no búsquedas)",l.url||"",'type="url" inputmode="url" placeholder="https://…" required')+
 fld("shop","Tienda",l.shop||"Cardmarket")+fld("seller","Vendedor (obligatorio en Cardmarket)",l.seller||"")+
 fld("price","Precio de compra €",N(l.price)>0?String(l.price).replace(".",","):"",'inputmode="decimal" required')+
 fld("shipping","Envío de compra € (vacío = estimado)",N(l.shipping)>=0?String(l.shipping).replace(".",","):"",'inputmode="decimal"')+
 sel("language","Idioma del ejemplar",lang(l.language||it.language).known?lang(l.language||it.language).name:"",LANG_OPTS)+
 sel("condition","Estado",l.condition||"",COND_OPTS)+
 fld("defects","Defectos visibles",l.defects||"",'placeholder="Pliegue, esquinas, rayas, suciedad…"')+
 sel("available","¿Sigue disponible ahora?",l.available==="no"?"no":"si",[["si","Sí, disponible"],["no","No, ya no está"]])+
 fld("photoUrl","Enlace a la foto del anuncio (opcional)",l.photoUrl||"",'type="url" inputmode="url"')+
 '<label>Foto del ejemplar (captura o foto, opcional)<input type="file" name="photo" accept="image/*"></label>'+
 '<div class="v4actions"><button type="submit" class="v4btn primary">Guardar comprobación</button><button type="button" class="v4btn" data-v4-close>Cancelar</button></div><p class="v4err" aria-live="polite"></p></form>');
}
function saleSheet(id){
 const it=findItem(id);if(!it)return;
 sheet('<h3>Añadir venta real</h3><p class="v4id">'+E(it.name)+' · '+E([it.set,it.number].filter(Boolean).join(" · "))+'</p>'+
 '<p class="v4note">'+(it.lane==="restaurar"?"Registra ventas del mismo modelo en mejor estado (sin alterar). La app aplicará el ajuste por restauración.":"Registra ventas de la misma carta, variante e idioma.")+' Un anuncio activo no es una venta.</p>'+
 '<form data-v4-form="sale" data-id="'+E(id)+'" class="v4form">'+
 sel("kind","Tipo de dato","venta",[["venta","Venta cerrada individual"],["agregado","Dato agregado de transacciones"],["anuncio","Anuncio activo (no es venta)"]])+
 fld("price","Precio realizado","",'inputmode="decimal" required')+sel("currency","Moneda","EUR",[["EUR","EUR €"],["USD","USD $"]])+
 fld("date","Fecha de la operación","",'type="date" required')+
 sel("condition","Estado del ejemplar vendido","",COND_OPTS)+sel("language","Idioma","",LANG_OPTS)+
 fld("platform","Plataforma","TCGplayer",'list="v4platforms"')+'<datalist id="v4platforms"><option>TCGplayer</option><option>Cardmarket</option><option>PSA Auction Prices Realized</option><option>PokeValue (ventas Cardmarket)</option><option>Heritage Auctions</option></datalist>'+
 fld("url","Enlace verificable","",'type="url" inputmode="url" placeholder="https://…"')+
 fld("note","Nota (variante exacta, edición…)","")+
 '<div class="v4actions"><button type="submit" class="v4btn primary">Guardar referencia</button><button type="button" class="v4btn" data-v4-close>Cancelar</button></div><p class="v4err" aria-live="polite"></p></form>');
}
function newSheet(lane){
 sheet('<h3>Nueva oportunidad · '+(lane==="restaurar"?"Comprar para restaurar":"Compra YA")+'</h3>'+
 '<form data-v4-form="new" data-lane="'+lane+'" class="v4form">'+
 sel("game","Juego","pokemon",[["pokemon","Pokémon"],["lorcana","Disney Lorcana"]])+
 fld("name","Nombre de la carta","",'required')+fld("set","Colección","")+fld("number","Número","")+fld("rarity","Rareza","")+
 fld("image","Enlace a imagen de catálogo (opcional)","",'type="url" inputmode="url"')+
 fld("why","¿Por qué merece la pena?","")+
 '<p class="v4note">Después pulsa «Registrar anuncio» y «Añadir venta real» en la ficha.</p>'+
 '<div class="v4actions"><button type="submit" class="v4btn primary">Crear ficha</button><button type="button" class="v4btn" data-v4-close>Cancelar</button></div><p class="v4err" aria-live="polite"></p></form>');
}
function boughtSheet(id){
 const it=findItem(id);if(!it)return;const l=it.listing||{};
 sheet('<h3>He comprado</h3><p class="v4id">'+E(it.name)+' · '+E([it.set,it.number].filter(Boolean).join(" · "))+'</p><p class="v4note">Solo confirma si ya has pagado. La carta se añadirá a Mi colección con estos datos.</p>'+
 '<form data-v4-form="bought" data-id="'+E(id)+'" class="v4form">'+fld("price","Precio pagado €",N(l.price)>0?String(l.price).replace(".",","):"",'inputmode="decimal" required')+
 fld("shipping","Envío y comisiones de compra €",N(l.shipping)>=0?String(l.shipping).replace(".",","):"",'inputmode="decimal"')+
 sel("language","Idioma recibido",lang(l.language||it.language).known?lang(l.language||it.language).name:"",LANG_OPTS)+sel("condition","Estado",l.condition||"",COND_OPTS)+
 fld("date","Fecha de compra",new Date().toISOString().slice(0,10),'type="date" required')+
 '<div class="v4actions"><button type="submit" class="v4btn primary">Añadir a Mi colección</button><button type="button" class="v4btn" data-v4-close>Cancelar</button></div><p class="v4err" aria-live="polite"></p></form>');
}
function addToCollection(it,f){
 const st=appState();if(!st)return false;st.cards=Array.isArray(st.cards)?st.cards:[];
 const l=it.listing||{},ref=economics(it,user.cfg);
 st.cards.push({id:"cv105-"+uid(),universe:it.game,name:it.name,set:it.set||"",number:it.number||"",language:f.language||"",grading:"RAW",grade:f.condition||"",condition:f.condition||"",
  value:ref.basis==="venta"?(it.lane==="restaurar"?ref.unaltered.mid:ref.sale.mid):f.price,valuationStatus:ref.basis==="venta"?"reference":"cost",purchase:f.price,purchaseShipping:f.shipping,purchaseFees:0,quantity:1,purchaseDate:f.date,
  purpose:it.lane==="restaurar"?"restoration":"investment",referenceImage:safeUrl(it.image)||"",buySource:l.shop||"",buySourceUrl:safeUrl(l.url)||"",buySeller:l.seller||"",buyOpportunityId:it.id,
  notes:(it.lane==="restaurar"?"Comprada para restaurar. ":"")+"Registrada desde Card Vault V105.",updatedAt:new Date().toISOString()});
 try{window.CVStateBridge.save();window.CVRenderCollection?.()}catch{return false}
 return true;
}
function patch(id){return user.patches[id]=user.patches[id]||{}}
function customRef(id){return user.custom.find(c=>c.id===id)}
async function submit(form){
 const g=n=>String(form.elements.namedItem(n)?.value||"").trim(),err=m=>{form.querySelector(".v4err").textContent=m};
 const kind=form.dataset.v4Form,id=form.dataset.id;
 if(kind==="verify"){
  const url=safeUrl(g("url")),price=N(g("price")),ship=g("shipping")===""?NaN:N(g("shipping"));
  if(!url)return err("Enlace no válido (debe ser https y no puede ser eBay).");
  if(isSearchUrl(url))return err("Eso es una búsqueda. Pega el enlace del anuncio o de la ficha concreta.");
  if(isCardmarketProduct(url)&&!g("seller"))return err("En Cardmarket indica el vendedor: la ficha de producto agrupa muchos anuncios.");
  if(!(price>0))return err("Indica el precio actual.");
  if(g("shipping")!==""&&!(ship>=0))return err("Envío no válido.");
  const photoUrl=g("photoUrl");if(photoUrl&&!safeUrl(photoUrl))return err("Enlace de foto no válido.");
  const listing={url,shop:g("shop"),seller:g("seller"),price,shipping:ship,shippingKind:Number.isFinite(ship)?"confirmado":"estimado",language:g("language"),condition:g("condition"),defects:g("defects"),available:g("available")||"si",photoUrl:safeUrl(photoUrl),checkedAt:new Date().toISOString(),checkedBy:"usuario"};
  const file=form.elements.namedItem("photo")?.files?.[0];
  if(file){try{const d=await compress(file);if(!(await photoPut(id,d)))toast("La foto se verá en esta sesión, pero el navegador no permite guardarla.")}catch{return err("No se ha podido leer la foto.")}}
  const c=customRef(id);if(c)c.listing=listing;else patch(id).listing=listing;
 }else if(kind==="sale"){
  const price=N(g("price"));if(!(price>0))return err("Indica el precio realizado.");
  if(!g("date"))return err("Indica la fecha de la operación.");
  const url=g("url");if(url&&!safeUrl(url))return err("Enlace no válido (https, sin eBay).");
  const s={id:uid(),kind:g("kind"),price,currency:g("currency"),date:g("date"),condition:g("condition"),language:g("language"),platform:g("platform"),url:safeUrl(url),note:g("note")+(url?"":(g("note")?" · ":"")+"Sin enlace: precio no verificable por terceros."),addedBy:"usuario"};
  const c=customRef(id);if(c)(c.sales=c.sales||[]).push(s);else (patch(id).sales=patch(id).sales||[]).push(s);
 }else if(kind==="bought"){
  const price=N(g("price")),ship=g("shipping")===""?0:N(g("shipping"));
  if(!(price>0))return err("Indica el precio pagado.");if(!(ship>=0))return err("Envío no válido.");
  const it=findItem(id);if(!it||!addToCollection(it,{price,shipping:ship,language:g("language"),condition:g("condition"),date:g("date")}))return err("No se ha podido añadir a Mi colección.");
  user.bought[id]=g("date");
 }else if(kind==="new"){
  if(!g("name"))return err("Indica el nombre.");
  const img=g("image");if(img&&!safeUrl(img))return err("Enlace de imagen no válido.");
  user.custom.unshift({id:"own-"+uid(),custom:true,lane:form.dataset.lane,game:g("game"),name:g("name"),set:g("set"),number:g("number"),rarity:g("rarity"),language:"",image:safeUrl(img),why:g("why"),links:{},listing:null,sales:[],source:"Añadida por el usuario"});
 }
 if(writeUser()){closeSheet();renderAll();toast(kind==="bought"?"Añadida a Mi colección":kind==="verify"?"Comprobación guardada · "+WHEN(Date.now()):kind==="sale"?"Referencia de venta guardada":"Ficha creada")}
}
let toastT=0;
function toast(m){let t=document.getElementById("v4Toast");if(!t){t=document.createElement("div");t.id="v4Toast";t.className="v4toast";t.setAttribute("role","status");document.body.appendChild(t)}t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true},3500)}

/* ---------- eventos ---------- */
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-v4-bought],[data-v4-verify],[data-v4-sale],[data-v4-new],[data-v4-close],[data-v4-filter],[data-v4-delsale],[data-v4-reset],[data-v4-copy],[data-v4-cfgsave],[data-v4-export],[data-v4-go]");
 if(!t){if(e.target.id==="v4Sheet")closeSheet();return}
 const d=t.dataset;
 if(d.v4Bought)boughtSheet(d.v4Bought);
 else if(d.v4Verify)verifySheet(d.v4Verify);
 else if(d.v4Sale)saleSheet(d.v4Sale);
 else if(d.v4New)newSheet(d.v4New);
 else if("v4Close" in d)closeSheet();
 else if(d.v4Filter){gameFilter=d.v4Filter;renderAll()}
 else if(d.v4Delsale){const [id,sid]=d.v4Delsale.split("|");if(!confirm("¿Quitar esta referencia de venta?"))return;const c=customRef(id);if(c)c.sales=(c.sales||[]).filter(s=>s.id!==sid);else{const p=patch(id);p.sales=(p.sales||[]).filter(s=>s.id!==sid);if(!String(sid).startsWith("u"))(p.removedSales=p.removedSales||[]).push(sid)}writeUser();renderAll()}
 else if(d.v4Reset){if(!confirm("¿Seguro?"))return;if(customRef(d.v4Reset))user.custom=user.custom.filter(c=>c.id!==d.v4Reset);else if(user.patches[d.v4Reset])delete user.patches[d.v4Reset].listing;writeUser();renderAll()}
 else if(d.v4Copy){const ta=t.parentElement.querySelector("textarea");const done=()=>toast("Texto copiado");if(navigator.clipboard?.writeText)navigator.clipboard.writeText(ta.value).then(done,()=>{ta.select();document.execCommand("copy");done()});else{ta.select();document.execCommand("copy");done()}}
 else if("v4Cfgsave" in d){const c={...user.cfg};let bad=false;document.querySelectorAll("[data-v4-cfg]").forEach(i=>{if(!i.closest(".tab:not(.hidden)"))return;const v=N(i.value);if(!(v>=0))bad=true;else c[i.dataset.v4Cfg]=v});if(bad||c.feePct>=100||c.restLow>c.restMid||c.restMid>c.restHigh){toast("Valores no válidos: comprueba que conservador ≤ central ≤ optimista.");return}user.cfg=c;writeUser();renderAll();toast("Supuestos guardados")}
 else if("v4Export" in d){const blob=new Blob([JSON.stringify({app:"Card Vault V104",exportedAt:new Date().toISOString(),user,photos:photoCache},null,1)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cardvault-comprobaciones-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
 else if(d.v4Go){window.CVSimpleNav?.showTab?.(d.v4Go);history.replaceState(null,"","#"+d.v4Go);window.scrollTo({top:0,behavior:"smooth"})}
});
document.addEventListener("submit",e=>{const f=e.target.closest("[data-v4-form]");if(!f)return;e.preventDefault();submit(f)});
document.addEventListener("change",e=>{
 const box=e.target.closest("[data-v4-declare]");
 if(box){const id=box.dataset.v4Declare,iv=[...box.querySelectorAll("input:checked")].map(i=>i.value);const c=customRef(id);if(c)c.interventions=iv;else patch(id).interventions=iv;writeUser();const it=findItem(id);box.querySelector("textarea").value=declareText(it);return}
 const imp=e.target.closest("[data-v4-import]");
 if(imp&&imp.files[0]){const fr=new FileReader();fr.onload=async()=>{try{const j=JSON.parse(fr.result);if(!j.user||typeof j.user!=="object")throw 0;user={cfg:{...DEFAULTS,...(j.user.cfg||{})},patches:j.user.patches||{},custom:Array.isArray(j.user.custom)?j.user.custom:[]};for(const [k,v] of Object.entries(j.photos||{}))if(/^data:image\//.test(v))await photoPut(k,v);writeUser();renderAll();toast("Copia importada")}catch{toast("Archivo no válido")}};fr.readAsText(imp.files[0])}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeSheet()});

/* ---------- montaje ---------- */
function mountHosts(){
 const radar=document.getElementById("radar");
 if(radar&&!document.getElementById("v4Buy")){const d=document.createElement("div");d.id="v4Buy";d.className="v4board";radar.prepend(d)}
 const rest=document.getElementById("comprar-restaurar");
 if(rest&&!document.getElementById("v4Restore")){rest.innerHTML='<div id="v4Restore" class="v4board"></div>'}
 const sales=document.getElementById("ventas-reales");
 if(sales&&!document.getElementById("v4Sales")){const d=document.createElement("div");d.id="v4Sales";d.className="v4board";sales.prepend(d)}
}
function renderAll(){mountHosts();for(const f of [()=>renderLane("compra"),()=>renderLane("restaurar"),renderSales])try{f()}catch(err){console.error("Card Vault V104",err)}}
/* Estudios guardados con V101–V103 («cv_buy_to_restore_v1»): se conservan como fichas propias. Los rangos de venta
   que eran hipótesis no se convierten en ventas; solo una venta cerrada declarada con fecha pasa a «venta». */
function migrateV103(){
 if(user.migratedV103)return;
 let old=[];try{old=JSON.parse(localStorage.getItem("cv_buy_to_restore_v1")||"[]")}catch{}
 for(const x of (Array.isArray(old)?old:[])){
  if(!x||!x.name||user.custom.some(c=>c.migratedFrom===x.id))continue;
  const sales=x.soldUrl&&N(x.soldAmount)>0&&x.soldDate&&x.soldType==="completed"?[{id:uid(),kind:"venta",price:N(x.soldAmount),currency:"EUR",date:x.soldDate,condition:"",language:"",platform:"Declarada en V103",url:safeUrl(x.soldUrl),note:x.soldIsAltered?"Venta de carta intervenida declarada por el usuario.":"Venta declarada por el usuario.",addedBy:"usuario"}]:[];
  user.custom.push({id:"own-"+uid(),custom:true,migratedFrom:x.id,lane:"restaurar",game:/lorcana/i.test(x.game)?"lorcana":"pokemon",name:x.name,set:x.set||"",number:"",rarity:"",language:x.language||"",image:safeUrl(x.imageUrl),
   why:N(x.sellLow)>0?"Estudio de V103: venta restaurada estimada por ti entre "+EUR(N(x.sellLow))+" y "+EUR(N(x.sellHigh))+" (hipótesis, no venta).":"",links:{},
   listing:{url:safeUrl(x.buyUrl),shop:"",seller:"",price:N(x.buy),shipping:N(x.buyShipping),shippingKind:"confirmado",condition:x.condition||"",defects:"",language:x.language||"",checkedAt:x.savedAt||"",checkedBy:"usuario",available:"desconocido"},sales,source:"Migrada de V103"});
 }
 user.migratedV103=true;writeUser();
}
async function start(){document.body.classList.add("v104");try{migrateV103()}catch(e){console.error(e)}mountHosts();renderAll();refreshFx();await photoLoadAll();if(Object.keys(photoCache).length)renderAll()}
setInterval(()=>{if(!document.getElementById("v4Sheet")||document.getElementById("v4Sheet").hidden)renderAll()},5*60*1000);
function addCustom(x){const id="own-"+uid();user.custom.unshift({id,custom:true,listing:null,links:{},...x,sales:(x.sales||[]).map(s=>({id:uid(),addedBy:"radar",...s}))});if(writeUser()){renderAll();toast("Añadida a "+(x.lane==="restaurar"?"Comprar para restaurar":"Compra YA"));const tab=x.lane==="restaurar"?"comprar-restaurar":"radar";window.CVSimpleNav?.showTab?.(tab);history.replaceState(null,"","#"+tab);setTimeout(()=>document.getElementById("card-"+id)?.scrollIntoView({behavior:"smooth"}),120)}}
window.CVVault={addCustom,fx:fxNow,engine:{status,economics,verdict,evaluate,listingPrecision,isSearchUrl,safeUrl,lang,DEFAULTS},renderAll,allItems,user:()=>user};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(start,300));else setTimeout(start,300);
})();
