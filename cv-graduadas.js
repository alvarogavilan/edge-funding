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
/* V134 · Oportunidades de graduadas, como Compra YA: la única fuente que se puede leer sola con precio, empresa y nota es
   CardTrader (con tu token). Para cada colección con cartas de valor dentro de tu presupuesto se piden sus anuncios y se
   agrupan las graduadas por carta + empresa + nota + idioma. Oportunidad = el anuncio más barato del grupo cuesta (con
   envío) bastante menos que el SIGUIENTE anuncio igual: lo compras y lo revendes justo a ese precio. Es precio PEDIDO,
   no venta cerrada: se dice. Anti-falsas: nunca por debajo del 30 % de la carta sin graduar; pide y comprueba el
   certificado antes de pagar. */
const OKEY="cv_v134_gr_opp",SCAN_SETS=15;let opp=readLS(OKEY,null),oppBusy=null;
const nrmS=v=>nq(v).replace(/[^a-z0-9]+/g," ").trim();
function gradeOf(p){const h=p.properties_hash||{};let co="",gr=NaN;
 for(const [k,v] of Object.entries(h)){if(v==null||v===false)continue;if(/company|grader/i.test(k))co=String(v);else if(/grade/i.test(k)){const n=Number(String(v).replace(",","."));if(Number.isFinite(n))gr=n}}
 if(!co){const m=JSON.stringify(h).match(/\b(PSA|BGS|Beckett|CGC|SGC|ACE|TAG)\b/i);if(m)co=m[1]}
 const lk=Object.keys(h).find(k=>/language/i.test(k));return {co:co.toUpperCase().replace("BECKETT","BGS"),gr,lang:String(lk?h[lk]:"").toLowerCase()}}
const isGraded=p=>p.graded===true||Object.entries(p.properties_hash||{}).some(([k,v])=>/grad/i.test(k)&&v&&v!=="false");
async function scanGraded(){
 const C=window.CVCompra;if(!C?.ctToken()){opp={error:"Sin token de CardTrader: pégalo en Compra YA → Estado de las fuentes (es gratis, en tu cuenta de CardTrader → Ajustes → API)."};renderOpp();return}
 const c=C.cfg(),cards=C.cardsPk().concat(C.cardsJp()).filter(x=>{const S=C.saleRef_(x.p);return Number.isFinite(S)&&S>=15&&S<=2*c.maxBuy&&(x.liq?.k||0)>=1});/* graduada ≤ tu compra máxima: la carta sin graduar no suele valer más del doble */
 if(!cards.length){opp={error:"Aún se están cargando los precios de Cardmarket: vuelve a pulsar «Buscar oportunidades» en unos segundos."};renderOpp();return}
 const bySet={};for(const x of cards){const k=x.kind==="jp"?"jp|"+String(x.code||"").toLowerCase():"n|"+nrmS(x.set);(bySet[k]=bySet[k]||[]).push(x)}
 try{oppBusy={done:0,total:0};renderOpp();
  const games=await C.ctGet("/games"),g=(Array.isArray(games)?games:games?.array||[]).find(o=>/pok[eé]mon/i.test(String(o.name||o.display_name||"")));if(!g)throw new Error("CardTrader: juego Pokémon no encontrado");
  const exps=(await C.ctGet("/expansions")).filter(e=>e.game_id===g.id);
  const pairs=Object.entries(bySet).map(([k,xs])=>{const [t,v]=k.split("|");const e=t==="jp"?exps.find(e=>String(e.code||"").toLowerCase()===v):exps.find(e=>nrmS(e.name)===v);return e?{e,xs}:null}).filter(Boolean).sort((a,b)=>b.xs.length-a.xs.length).slice(0,SCAN_SETS);
  oppBusy.total=pairs.length;renderOpp();const rows=[];
  for(const {e,xs} of pairs){
   const bps=await C.ctGet("/blueprints/export?expansion_id="+encodeURIComponent(e.id)),bpA=Array.isArray(bps)?bps:(bps?.array||[]),bpM=new Map(bpA.map(b=>[b.id,b]));
   const j=await C.ctGet("/marketplace/products?expansion_id="+encodeURIComponent(e.id)),prods=Array.isArray(j)?j:Object.entries(j||{}).flatMap(([k,v])=>(Array.isArray(v)?v:[]).map(p=>({blueprint_id:Number(k),...p})));/* la API agrupa por id de carta */
   const grp={};for(const p of prods){if(!isGraded(p)||p.on_vacation||(C.fakeWords?.(p.description)||[]).length)continue;/* V141: de vacaciones o «proxy»/«réplica» en la descripción, fuera */const cur=String(p.price?.currency||"EUR").toUpperCase(),eur=cur==="EUR"?Number(p.price?.cents??p.price_cents)/100:NaN;if(!(eur>0))continue;const G=gradeOf(p);if(!G.co||!Number.isFinite(G.gr))continue;
    const k=p.blueprint_id+"|"+G.co+"|"+G.gr+"|"+G.lang;(grp[k]=grp[k]||[]).push({eur,country:p.user?.country_code||"",G,bp:p.blueprint_id})}
   for(const G0 of Object.values(grp)){const bp=bpM.get(G0[0].bp)||{},num=String(bp.fixed_properties?.collector_number||bp.collector_number||"").split("/")[0].replace(/^0+/,"");
    const cm=(bp.card_market_ids||[]).map(Number),x=xs.find(y=>cm.includes(Number(y.res?.pid)))||xs.find(y=>String(y.number||"").split("/")[0].replace(/^0+/,"")===num&&nrmS(bp.name||"").split(" ")[0]===nrmS(y.name).split(" ")[0]);/* V135: por id de Cardmarket */
    const raw=x?C.saleRef_(x.p):NaN;/* lo que vale sin graduar (venta de referencia de Cardmarket) */
    /* fuera los sospechosos (< 30 % de la carta sin graduar: cápsula falsa o proxy) antes de elegir el más barato */
    const L=G0.filter(o=>!(Number.isFinite(raw)&&o.eur<raw*(C.FAKE_RATIO||.3))).sort((a,b)=>a.eur-b.eur);if(L.length<2)continue;
    const a=L[0],b=L[1],cost=a.eur+c.buyShip,profit=C.netSale(b.eur,c)-cost;
    if(cost>c.maxBuy||profit<c.minProfit)continue;
    rows.push({id:x?.id||"",name:x?.name||bp.name||"",set:x?.set||e.name,number:x?.number||num,image:x?.image||"",co:a.G.co,gr:a.G.gr,lang:a.G.lang,price:a.eur,country:a.country,cost,resale:b.eur,n:L.length,profit,raw,url:"https://www.cardtrader.com/cards/"+encodeURIComponent(a.bp)})}
   oppBusy.done++;renderOpp();await new Promise(r=>setTimeout(r,300))}
  opp={rows:rows.sort((p,q)=>q.profit-p.profit).slice(0,40),at:Date.now(),sets:pairs.length};if(pairs.length)writeLS(OKEY,opp)}
 catch(e){opp={error:String(e.message||e)}}
 oppBusy=null;renderOpp();
}
/* solo repinta la lista de oportunidades: no toca lo que estés escribiendo en el analizador */
function renderOpp(){const b=document.querySelector("#cpGraded [data-gr-opp]");if(b)b.innerHTML=oppHtml();else render()}
const LN={en:"inglés",jp:"japonés",ja:"japonés",es:"español",fr:"francés",de:"alemán",it:"italiano",pt:"portugués",kr:"coreano",ko:"coreano",zh:"chino"};
function oppHtml(){
 const C=window.CVCompra,head='<h4>💎 Graduadas con oportunidad de compra ahora</h4>';
 if(oppBusy)return head+'<p class="v4note">⏳ Buscando graduadas en CardTrader… '+oppBusy.done+'/'+(oppBusy.total||"?")+' colecciones</p>';
 if(!C?.ctToken())return head+'<p class="v4note">Para que salgan solas hace falta tu token de CardTrader (gratis): CardTrader → Ajustes → API, y pégalo en Compra YA → «Estado de las fuentes». CardTrader es la única fuente que deja leer anuncios de graduadas con su empresa y nota; las tiendas españolas no dejan leer sus precios.</p>';
 const btn='<button type="button" class="v4btn" data-gr-scan>'+(opp?.rows?'Volver a buscar':'Buscar oportunidades')+'</button>';
 if(!opp)return head+btn;
 if(opp.error)return head+'<p class="v4note neg">'+E(opp.error)+'</p>'+btn;
 const c=C.cfg();
 return head+'<p class="v4note">'+opp.rows.length+' oportunidad(es) en '+opp.sets+' colecciones · consultado '+new Date(opp.at).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})+'. Compra ≤ '+EUR(c.maxBuy)+' con envío y beneficio ≥ '+EUR(c.minProfit)+'.</p>'+btn+
  (opp.rows.length?'<ol class="cpPlanList">'+opp.rows.map((o,i)=>'<li>'+(o.image?'<span class="cpThumb"><img src="'+E(o.image)+'" alt="" loading="lazy"></span>':'<span class="cpThumb">💎</span>')+'<span><b>'+(i+1)+'. '+E(o.co)+' '+E(String(o.gr).replace(".",","))+' · '+E(o.name)+'</b> · '+E(o.set)+' nº '+E(o.number)+(o.lang?' ('+E(LN[o.lang]||o.lang)+')':'')+'</span><a class="v4btn primary" href="'+E(o.url)+'" target="_blank" rel="noopener noreferrer">Comprar en CardTrader ↗</a>'+
   '<small><b>Pagas '+EUR(o.cost)+'</b> (CardTrader, anuncio '+EUR(o.price)+(o.country?' de un vendedor de '+E(o.country):'')+' + envío) → revéndela al precio del siguiente '+E(o.co)+' '+E(String(o.gr).replace(".",","))+' igual ('+EUR(o.resale)+') → <b>'+SIGNED(o.profit)+'</b> · '+o.n+' anuncios iguales'+(Number.isFinite(o.raw)?' · sin graduar vale ~'+EUR(o.raw):'')+'. Antes de pagar: pide el número de certificado y compruébalo'+(o.co==="PSA"?' en psacard.com/cert':o.co==="CGC"?' en cgccards.com':'')+'.</small></li>').join("")+'</ol>':'<p class="v4note">Ninguna graduada deja tu beneficio mínimo dentro de tu presupuesto en las colecciones consultadas.</p>')+
  '<p class="v4note">Reventa = el siguiente anuncio de la misma carta, empresa, nota e idioma en CardTrader (precio pedido, no venta cerrada): si lo pones un poco por debajo, sueles vender primero. Envío de compra estimado '+EUR(c.buyShip)+'.</p>';
}
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
  cost<raw*(C.FAKE_RATIO||.3)?{k:"wait",t:"⛔ Sospechosa: cuesta menos del 30 % de la carta sin graduar → casi seguro cápsula falsa o proxy. Comprueba el certificado y no la compres si no cuadra"}:
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
 const op=[...host.querySelectorAll("details")].map(d=>d.open);
 host.innerHTML='<section class="rdlivebox cpBox"><h3>Cartas graduadas · comprar para revender (PSA, Beckett, CGC…)</h3>'+
  (ready?'<div data-gr-opp>'+oppHtml()+'</div>':'')+
  '<details class="v4more"'+(pick||list.length||!C?.ctToken()?' open':'')+'><summary><b>Analizar un anuncio que hayas visto</b> (tienda, Catawiki, Wallapop…)</summary><p class="v4note">Elige la carta, pega el anuncio y la app lo compara con lo que te costaría <b>crear esa graduada tú</b>: la carta sin graduar en Cardmarket + graduación + envíos.</p>'+
  (ready?'<div class="cpPlanIn"><label class="wide">Carta<input type="search" data-gr-q placeholder="Nombre, colección o número (mín. 3 letras)" value="'+E(pick?pick.name+" · "+pick.set+" nº "+pick.number:"")+'"></label></div><div data-gr-res></div>'+
   '<div class="cpPlanIn"><label>Empresa<select data-gr="company">'+["PSA","Beckett (BGS)","CGC","SGC","Ace","Otra"].map(c=>'<option>'+c+'</option>').join("")+'</select></label><label>Nota<input inputmode="decimal" data-gr="grade" placeholder="10"></label>'+
   '<label>Precio del anuncio €<input inputmode="decimal" data-gr="price" placeholder="120"></label><label>Envío €<input inputmode="decimal" data-gr="ship" placeholder="8"></label>'+
   '<label>Venta conocida de esa graduada € (opcional)<input inputmode="decimal" data-gr="sale" placeholder="vacío = no la sé"></label><label>Tarifa de graduación €<input inputmode="decimal" data-gr="fee" placeholder="'+String(GRADE_FEE).replace(".",",")+'"></label></div>'+
   '<details class="v4more"><summary>Pegar el anuncio de la tienda (rellena empresa, nota, precio y certificado)</summary><textarea data-gr-paste rows="3" placeholder="Ej.: Charizard ex 199/165 PSA 10 · 249,90 € · Certificado 12345678"></textarea><button type="button" class="v4btn" data-gr-parse>Leer anuncio</button></details>'+
   '<div class="cpPlanIn"><label>Dónde está<select data-gr="store">'+STORES.map(s=>'<option>'+s[0]+'</option>').join("")+'<option>Cardmarket</option><option>Otra</option></select></label><label>N.º de certificado (opcional)<input inputmode="numeric" data-gr="cert" placeholder="12345678"></label></div>'+
   '<button type="button" class="v4btn primary" data-gr-add>Analizar anuncio</button>'+ctGHtml():'<p class="v4note">⏳ Cargando la guía de Cardmarket… (abre Compra YA una vez si no aparece)</p>')+
  (list.length?'<h4>Anuncios analizados</h4><ol class="cpPlanList">'+list.map(rowHtml).join("")+'</ol>':'')+'</details></section>';
 if(op.length)host.querySelectorAll("details").forEach((d,i)=>{if(op[i]!=null)d.open=op[i]});/* repintar no cierra lo abierto */
}
/* CardTrader (con tu token): anuncios reales de esa carta GRADUADA ahora, con precio, país del vendedor y enlace. */
let ctG=null;
async function loadCtGraded(){
 const C=window.CVCompra;if(!pick)return;if(!C.ctToken()){ctG={error:"Sin token de CardTrader: pégalo en Compra YA → Estado de las fuentes."};render();return}
 ctG={loading:true};render();
 try{const {bp}=await C.ctBlueprint(pick),j=await C.ctGet("/marketplace/products?blueprint_id="+encodeURIComponent(bp.id)),list=Array.isArray(j)?j:(j?.[bp.id]||Object.values(j||{}).flat());
  const g=list.filter(p=>p.graded||Object.keys(p.properties_hash||{}).some(k=>/grad/i.test(k)&&p.properties_hash[k])).map(p=>{const h=p.properties_hash||{},info=Object.entries(h).filter(([k,v])=>/grad|grade|psa|bgs|cgc|beckett|language|condition/i.test(k)&&v!==false&&v!=null).map(([k,v])=>String(k).replace(/_/g," ")+": "+v).join(" · ");
   return {eur:Number(p.price?.cents??p.price_cents)/100,info,country:p.user?.country_code||"",bp:bp.id}}).filter(o=>o.eur>0).sort((a,b)=>a.eur-b.eur);
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
 if(e.target.closest("[data-gr-scan]")){scanGraded();return}
 const u=e.target.closest("[data-gr-use]");if(u){const i=document.querySelector('[data-gr="price"]');if(i)i.value=String(u.dataset.grUse).replace(".",",");const st=document.querySelector('[data-gr="store"]');if(st){if(![...st.options].some(o=>o.value==="CardTrader"))st.add(new Option("CardTrader","CardTrader"));st.value="CardTrader"}i?.focus();return}
 if(e.target.closest("[data-gr-parse]")){const raw=document.querySelector("[data-gr-paste]")?.value,fw=window.CVCompra?.fakeWords?.(raw)||[];/* V130: cápsulas y cartas falsas */if(fw.length){alert("⛔ El anuncio dice «"+fw.join("», «")+"»: es una carta o cápsula proxy, réplica o falsa. No la compres.");return}const o=parseListing(raw);const set=(k,v)=>{const i=document.querySelector('[data-gr="'+k+'"]');if(i&&v!=null)i.value=typeof v==="number"?String(v).replace(".",","):v};
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
async function openTab(){render();const C=window.CVCompra;if(!C)return;try{await C.ready_();await C.loadCatalog();if(!C.state().guide)await C.loadGuide(false)}catch{}render();
 for(let i=0;i<40&&!C.cardsPk().length;i++)await new Promise(r=>setTimeout(r,500));
 if(C.ctToken()&&!oppBusy&&(!opp?.at||Date.now()-opp.at>6*3600e3))scanGraded()}/* al abrir: busca solo si hay token y lo último tiene más de 6 h */
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="pregrade"]'))setTimeout(openTab,60)});
if(location.hash==="#pregrade")setTimeout(openTab,1400);
window.CVGraduadas={render,analyse,parseListing,scanGraded,gradeOf};
})();
