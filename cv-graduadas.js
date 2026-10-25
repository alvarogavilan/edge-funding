/* Card Vault V122 · Comprar graduadas (PSA, Beckett, CGC, SGC, Ace…) a buen precio.
   No hay una fuente gratuita y legítima de ventas de graduadas en Europa sin eBay, así que la app usa un ancla que sí es
   real: lo que te costaría CREAR esa graduada tú = carta sin graduar en Cardmarket (EX o mejor si se conoce) + tarifa de
   graduación + envíos. Una graduada alta (9–10) anunciada por debajo de ese «precio de reposición» es una oferta: nadie
   la fabrica más barato. Si conoces una venta real de esa graduada, la app calcula tu beneficio exacto. */
(()=>{"use strict";
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>Number.isFinite(v)?v.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—";
const SIGNED=v=>Number.isFinite(v)?(v>=0?"+":"−")+EUR(Math.abs(v)):"—";
const NUM=v=>{const t=String(v??"").trim().replace(/\s|€/g,"");if(!t)return NaN;const x=Number(t.includes(",")?t.replace(/\./g,"").replace(",","."):t);return Number.isFinite(x)&&x>=0?x:NaN};
const nq=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const readLS=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k)||"null");return x??d}catch{return d}};
const writeLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const KEY="cv_v122_graded";
/* Tarifa de graduación por empresa (lo más barato publicado para particulares en Europa; editable en cada análisis).
   PSA Europa Standard 49,99 € (lanzamiento oct. 2026). Para el resto se usa la misma cifra si no escribes otra. */
const GRADE_FEE=49.99,SHIP_TO=15,SHIP_BACK=25;
let pick=null,list=readLS(KEY,[]);if(!Array.isArray(list))list=[];
/* Dónde comprar graduadas desde 41020 (tiendas españolas con catálogo de graduadas y subastas/mercados de la UE).
   Las tiendas no permiten leer sus precios desde otra web: la app abre su búsqueda con la carta elegida y lee el anuncio
   que pegues. Comprueba siempre el número de certificado antes de pagar. */
const STORES=[
 ["Pokémillon","Tienda · España","PSA, Beckett y otras",q=>"https://www.pokemillon.com/search?type=product&q="+q],
 ["Iberian Collect","Tienda · España","PSA, BGS y CGC con certificado",q=>"https://iberiancollect.com/search?type=product&q="+q],
 ["Cardzone","Tienda · España","PSA, CGC…",q=>"https://cardzone.es/search?type=product&q="+q],
 ["MaickJP","Tienda · España","PSA 10 japonesas",q=>"https://maickjp.com/search?type=product&q="+q],
 ["Catawiki","Subastas · UE","con verificación de expertos",q=>"https://www.catawiki.com/es/s?q="+q],
 ["Wallapop","Particulares · España","verifica certificado y vendedor",q=>"https://es.wallapop.com/app/search?keywords="+q],
 ["Vinted","Particulares · UE","verifica certificado y vendedor",q=>"https://www.vinted.es/catalog?search_text="+q]];
/* Lee el título y el precio de un anuncio copiado: empresa, nota y precio en euros. */
const CO=[["PSA",/\bpsa\b/i],["Beckett (BGS)",/\b(bgs|beckett)\b/i],["CGC",/\bcgc\b/i],["SGC",/\bsgc\b/i],["Ace",/\bace\b/i],["Otra",/\b(tag|pca|ags|gma)\b/i]];
function parseListing(txt){
 const t=String(txt||""),o={};for(const [n,re] of CO)if(re.test(t)){o.company=n;break}
 const g=t.match(/\b(?:psa|bgs|beckett|cgc|sgc|ace|tag|pca|ags|gma)\s*(?:gem\s*mint|mint|pristine|black\s*label)?\s*(10|[1-9](?:[.,]5)?)\b/i);if(g)o.grade=Number(g[1].replace(",","."));
 const m=t.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*€|€\s*(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
 if(m){const v=(m[1]||m[2]).replace(/[\s]/g,""),c=v.lastIndexOf(","),d=v.lastIndexOf("."),dec=Math.max(c,d);o.price=dec>=0&&v.length-dec-1<=2?Number(v.slice(0,dec).replace(/[.,]/g,"")+"."+v.slice(dec+1)):Number(v.replace(/[.,]/g,""))}
 const ce=t.match(/(?:cert(?:ificado|ification)?|n[ºo°]\s*de\s*certificado)\s*(?:n[ºo°.]*|#|:)?\s*(\d{6,10})/i);if(ce)o.cert=ce[1];
 return o;
}

function search(q){
 const C=window.CVCompra;if(!C||!q||q.trim().length<3)return [];const k=nq(q).trim();
 const all=C.cardsPk().concat(C.cardsJp?C.cardsJp():[]);return all.filter(x=>nq(x.name+" "+x.set+" "+x.number).includes(k)).slice(0,8);
}
function analyse(a){
 const C=window.CVCompra,x=(C.cardsPk().concat(C.cardsJp())).find(y=>y.id===a.id);if(!x)return null;
 const p=x.p,raw=Number.isFinite(p.exPlus)?p.exPlus:C.saleRef_(p),rawKind=Number.isFinite(p.exPlus)?"«desde» EX o mejor":"venta de referencia sin graduar";
 const fee=Number.isFinite(a.fee)?a.fee:GRADE_FEE,repo=raw+fee+SHIP_TO+SHIP_BACK,cost=a.price+(a.ship||0);
 const cfg=C.cfg(),net=Number.isFinite(a.sale)?a.sale*(1-cfg.feePct/100)-cfg.sellShip:NaN,profit=net-cost;
 const vs=cost/repo,high=a.grade>=9;
 const verdict=!Number.isFinite(raw)?{k:"flat",t:"Sin precio de la carta sin graduar"}:
  cost<=raw&&high?{k:"go",t:"🟢 Muy por debajo: cuesta menos que la carta sin graduar"}:
  cost<repo&&high?{k:"go",t:"🟢 Oferta: más barata que graduarla tú"}:
  cost<repo?{k:"flat",t:"⚪ Por debajo de reposición, pero nota "+a.grade+" (las notas bajas valen poco más que sin graduar)"}:
  {k:"wait",t:"🟠 Más cara que graduarla tú"};
 return {x,raw,rawKind,fee,repo,cost,vs,net,profit,verdict};
}
function rowHtml(a,i){
 const r=analyse(a);if(!r)return '<li><span><b>'+E(a.company)+' '+E(a.grade)+' · '+E(a.name)+'</b></span><button type="button" class="v4btn" data-gr-del="'+i+'">Quitar</button><small>'+E(a.store||"")+' · anuncio '+EUR(a.price+(a.ship||0))+' · cargando el precio de Cardmarket…</small></li>';
 return '<li><span><b>'+E(a.company)+' '+E(a.grade)+' · '+E(r.x.name)+'</b> · '+E(r.x.set)+' nº '+E(r.x.number)+'</span><button type="button" class="v4btn" data-gr-del="'+i+'">Quitar</button>'+
  '<small>'+E(a.store||"")+(a.cert?' · certificado '+E(a.cert)+(certUrl(a.company,a.cert)?' <a href="'+E(certUrl(a.company,a.cert))+'" target="_blank" rel="noopener noreferrer">verificar ↗</a>':''):'')+'</small><small><span class="cpSig '+r.verdict.k+'">'+r.verdict.t+'</span> Anuncio '+EUR(r.cost)+' (con envío) · crearla tú: '+EUR(r.repo)+' = carta '+EUR(r.raw)+' ('+r.rawKind+') + graduación '+EUR(r.fee)+' + envíos '+EUR(SHIP_TO+SHIP_BACK)+' · '+Math.round(r.vs*100)+' % de su reposición'+
  (Number.isFinite(r.net)?' · si la vendes a '+EUR(a.sale)+': te quedan '+EUR(r.net)+' → <b>'+SIGNED(r.profit)+'</b>':' · añade una venta conocida de esta graduada para ver tu beneficio')+'.</small></li>';
}
function render(){
 const host=ensureHost();if(!host)return;const C=window.CVCompra;
 const ready=C&&C.state().guide;
 host.innerHTML='<section class="rdlivebox cpBox"><h3>Comprar graduadas a buen precio (PSA, Beckett, CGC, SGC…)</h3>'+
  '<p class="v4note">No hay datos públicos y gratuitos de ventas de graduadas en Europa sin eBay. La app compara cada anuncio que veas (Cardmarket, Catawiki, Wallapop, Vinted, tiendas) con lo que te costaría <b>crear esa graduada tú</b>: la carta sin graduar en Cardmarket + graduación + envíos. Por debajo de eso, nadie la fabrica más barata.</p>'+
  (ready?'<div class="cpPlanIn"><label class="wide">Carta<input type="search" data-gr-q placeholder="Nombre, colección o número (mín. 3 letras)" value="'+E(pick?pick.name+" · "+pick.set+" nº "+pick.number:"")+'"></label></div><div data-gr-res></div>'+
   '<div class="cpPlanIn"><label>Empresa<select data-gr="company">'+["PSA","Beckett (BGS)","CGC","SGC","Ace","Otra"].map(c=>'<option>'+c+'</option>').join("")+'</select></label><label>Nota<input inputmode="decimal" data-gr="grade" placeholder="10"></label>'+
   '<label>Precio del anuncio €<input inputmode="decimal" data-gr="price" placeholder="120"></label><label>Envío €<input inputmode="decimal" data-gr="ship" placeholder="8"></label>'+
   '<label>Venta conocida de esa graduada € (opcional)<input inputmode="decimal" data-gr="sale" placeholder="vacío = no la sé"></label><label>Tarifa de graduación €<input inputmode="decimal" data-gr="fee" placeholder="'+String(GRADE_FEE).replace(".",",")+'"></label></div>'+
   '<details class="v4more"><summary>Pegar el anuncio de la tienda (rellena empresa, nota, precio y certificado)</summary><textarea data-gr-paste rows="3" placeholder="Ej.: Charizard ex 199/165 PSA 10 · 249,90 € · Certificado 12345678"></textarea><button type="button" class="v4btn" data-gr-parse>Leer anuncio</button></details>'+
   '<div class="cpPlanIn"><label>Dónde está<select data-gr="store">'+STORES.map(s=>'<option>'+s[0]+'</option>').join("")+'<option>Cardmarket</option><option>Otra</option></select></label><label>N.º de certificado (opcional)<input inputmode="numeric" data-gr="cert" placeholder="12345678"></label></div>'+
   '<button type="button" class="v4btn primary" data-gr-add>Analizar anuncio</button>'+ctGHtml()+storesHtml():'<p class="v4note">⏳ Cargando la guía de Cardmarket… (abre Compra YA una vez si no aparece)</p>')+
  (list.length?'<h4>Anuncios analizados</h4><ol class="cpPlanList">'+list.map(rowHtml).join("")+'</ol>':'')+'</section>';
}
/* CardTrader (con tu token): anuncios reales de esa carta GRADUADA ahora, con precio, país del vendedor y enlace. */
let ctG=null;
async function loadCtGraded(){
 const C=window.CVCompra;if(!pick)return;if(!C.ctToken()){ctG={error:"Sin token de CardTrader: pégalo en Compra YA → Estado de las fuentes."};render();return}
 ctG={loading:true};render();
 try{const {bp}=await C.ctBlueprint(pick),j=await C.ctGet("/marketplace/products?blueprint_id="+encodeURIComponent(bp.id)),list=Array.isArray(j)?j:(j?.[bp.id]||Object.values(j||{}).flat());
  const g=list.filter(p=>p.graded||Object.keys(p.properties_hash||{}).some(k=>/grad/i.test(k)&&p.properties_hash[k])).map(p=>{const h=p.properties_hash||{},info=Object.entries(h).filter(([k,v])=>/grad|grade|psa|bgs|cgc|beckett|language|condition/i.test(k)&&v!==false&&v!=null).map(([k,v])=>String(k).replace(/_/g," ")+": "+v).join(" · ");
   return {eur:Number(p.price_cents??p.price?.cents)/100,info,country:p.user?.country_code||"",bp:bp.id}}).filter(o=>o.eur>0).sort((a,b)=>a.eur-b.eur);
  const max=C.cfg().maxBuy,inB=g.filter(o=>o.eur<=max);/* solo lo que cabe en tu compra máxima por carta */
  ctG={rows:inB,over:g.length-inB.length,max,bp:bp.id}}
 catch(e){ctG={error:String(e.message||e)}}
 render();
}
function ctGHtml(){
 if(!pick)return '';const head='<h4>Graduadas en CardTrader ahora</h4>';
 if(!ctG)return head+'<button type="button" class="v4btn" data-gr-ct>Buscar anuncios graduados en CardTrader</button>';
 if(ctG.loading)return head+'<p class="v4note">Consultando CardTrader…</p>';
 if(ctG.error)return head+'<p class="v4note neg">'+E(ctG.error)+'</p><button type="button" class="v4btn" data-gr-ct>Reintentar</button>';
 const url="https://www.cardtrader.com/cards/"+encodeURIComponent(ctG.bp);
 return head+(ctG.rows.length?'<ol class="cpPlanList">'+ctG.rows.slice(0,10).map(o=>'<li><span><b>'+EUR(o.eur)+'</b>'+(o.country?' · vendedor '+E(o.country):'')+'</span><button type="button" class="v4btn" data-gr-use="'+o.eur+'">Analizar</button><small>'+E(o.info||"graduada")+' · <a href="'+E(url)+'" target="_blank" rel="noopener noreferrer">ver en CardTrader ↗</a></small></li>').join("")+'</ol>':'<p class="v4note">Ninguna graduada a la venta ahora en CardTrader para esta carta dentro de tu presupuesto.</p>')+(ctG.over?'<p class="v4note">'+ctG.over+' anuncio(s) más caros que tu compra máxima ('+EUR(ctG.max)+') no se muestran.</p>':'')+'<p class="v4note">Precio pedido, sin envío. «Analizar» lo pasa al comparador: pon la empresa y la nota del anuncio.</p>';
}
function storesHtml(){
 const q=pick?encodeURIComponent(pick.name+" "+String(pick.number).split("/")[0]):"";
 return '<h4>Dónde comprar graduadas'+(pick?' · buscar «'+E(pick.name)+'»':'')+'</h4><ul class="cpPlanList">'+STORES.map(([n,type,what,url])=>'<li><span><b>'+E(n)+'</b> · '+E(type)+'</span>'+(pick?'<a class="v4btn" href="'+E(url(q))+'" target="_blank" rel="noopener noreferrer">Buscar ↗</a>':'')+'<small>'+E(what)+'</small></li>').join("")+'</ul>'+
  '<p class="v4note">'+(pick?'':'Elige una carta para buscarla directamente en cada sitio. ')+'Las tiendas no dejan leer sus precios desde otra web: copia el título y el precio del anuncio y pégalo arriba. Antes de pagar, comprueba el certificado en la web de la empresa (PSA: psacard.com/cert, CGC: cgccards.com/certlookup).</p>';
}
const certUrl=(co,n)=>!n?"":/^PSA/.test(co)?"https://www.psacard.com/cert/"+encodeURIComponent(n):/^CGC/.test(co)?"https://www.cgccards.com/certlookup/"+encodeURIComponent(n)+"/":"";
function ensureHost(){
 const sec=document.getElementById("pregrade");if(!sec)return null;let h=document.getElementById("cpGraded");
 if(!h){h=document.createElement("div");h.id="cpGraded";h.className="v4board";sec.prepend(h)}return h;
}
document.addEventListener("input",e=>{const t=e.target.closest("[data-gr-q]");if(!t)return;pick=null;const r=search(t.value),box=document.querySelector("[data-gr-res]");if(!box)return;
 box.innerHTML=r.length?'<ul class="cpPlanList">'+r.map(x=>'<li><span>'+E(x.name)+' · '+E(x.set)+' nº '+E(x.number)+'</span><button type="button" class="v4btn" data-gr-pick="'+E(x.id)+'">Elegir</button></li>').join("")+'</ul>':(t.value.trim().length>=3?'<p class="v4note">Ninguna carta coincide.</p>':'')});
document.addEventListener("click",e=>{
 const p=e.target.closest("[data-gr-pick]");if(p){const C=window.CVCompra;ctG=null;pick=C.cardsPk().concat(C.cardsJp()).find(x=>x.id===p.dataset.grPick)||null;render();return}
 if(e.target.closest("[data-gr-ct]")){loadCtGraded();return}
 const u=e.target.closest("[data-gr-use]");if(u){const i=document.querySelector('[data-gr="price"]');if(i)i.value=String(u.dataset.grUse).replace(".",",");const st=document.querySelector('[data-gr="store"]');if(st){if(![...st.options].some(o=>o.value==="CardTrader"))st.add(new Option("CardTrader","CardTrader"));st.value="CardTrader"}i?.focus();return}
 if(e.target.closest("[data-gr-parse]")){const o=parseListing(document.querySelector("[data-gr-paste]")?.value);const set=(k,v)=>{const i=document.querySelector('[data-gr="'+k+'"]');if(i&&v!=null)i.value=typeof v==="number"?String(v).replace(".",","):v};
  if(o.company==null&&o.grade==null&&o.price==null){alert("No encuentro empresa, nota ni precio en el texto pegado.");return}set("company",o.company);set("grade",o.grade);set("price",o.price);set("cert",o.cert);return}
 const d=e.target.closest("[data-gr-del]");if(d){list.splice(+d.dataset.grDel,1);writeLS(KEY,list);render();return}
 if(e.target.closest("[data-gr-add]")){
  const g=k=>document.querySelector('[data-gr="'+k+'"]')?.value,price=NUM(g("price")),grade=NUM(g("grade")),ship=NUM(g("ship")),sale=NUM(g("sale")),fee=NUM(g("fee"));
  if(!pick){alert("Elige la carta de la lista.");return}
  if(!Number.isFinite(price)||price<=0){alert("Escribe el precio del anuncio.");return}
  if(!Number.isFinite(grade)||grade<1||grade>10){alert("La nota va de 1 a 10.");return}
  list.unshift({id:pick.id,name:pick.name,company:g("company")||"PSA",store:g("store")||"",cert:String(g("cert")||"").replace(/\D/g,"")||undefined,grade,price,ship:Number.isFinite(ship)?ship:0,sale:Number.isFinite(sale)&&sale>0?sale:undefined,fee:Number.isFinite(fee)?fee:undefined,at:new Date().toISOString()});
  if(!writeLS(KEY,list.slice(0,50))){alert("NO se ha guardado: el almacenamiento del navegador no lo permite.");return}
  pick=null;render()}
});
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="pregrade"]'))setTimeout(async()=>{render();const C=window.CVCompra;if(C){try{await C.ready_();await C.loadCatalog();if(!C.state().guide)await C.loadGuide(false)}catch{}render()}},60)});
if(location.hash==="#pregrade")setTimeout(async()=>{const C=window.CVCompra;if(C){try{await C.ready_();await C.loadCatalog()}catch{}}render()},1400);
window.CVGraduadas={render,analyse,parseListing};
})();
