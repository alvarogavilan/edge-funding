/* Card Vault V105 · Radar «En investigación».
   Se ejecuta en el navegador del usuario (Safari) contra APIs públicas con CORS:
   - Pokémon: api.tcgdex.net (precios Cardmarket y TCGplayer que publica TCGdex, con su fecha).
   - Lorcana: api.lorcast.com (precio de mercado TCGplayer en USD).
   Todo lo que produce es INVESTIGACIÓN: medias agregadas y el anuncio más barato (sin estado ni idioma).
   Nunca crea una «compra comprobada» ni una «venta cerrada». */
(()=>{"use strict";
const CACHE="cv_v105_radar",TTL=24*3600e3;
const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:NaN};
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>Number.isFinite(v)?v.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—";
const SIGNED=v=>Number.isFinite(v)?(v>=0?"+":"−")+EUR(Math.abs(v)):"—";
const DAY=t=>{const d=new Date(t);return Number.isFinite(d.getTime())?d.toLocaleDateString("es-ES"):"sin fecha"};
const WHEN=t=>{const d=new Date(t);return Number.isFinite(d.getTime())?d.toLocaleString("es-ES",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"—"};
function readCache(){try{const x=JSON.parse(localStorage.getItem(CACHE)||"{}");return {pk:x.pk||{},lo:x.lo||{},runs:Array.isArray(x.runs)?x.runs:[],universeCount:x.universeCount||0}}catch{return {pk:{},lo:{},runs:[]}}}
let cache=readCache();
function writeCache(){try{localStorage.setItem(CACHE,JSON.stringify(cache))}catch{try{cache.runs=cache.runs.slice(-5);localStorage.setItem(CACHE,JSON.stringify(cache))}catch{}}}
const cfg=()=>window.CVVault?.user?.().cfg||{feePct:5,sellShip:5,buyShip:6,minProfit:40,restLow:.6,restMid:.75,restHigh:.9,usdToEur:.86};
const fx=()=>window.CVVault?.fx?.()||{rate:cfg().usdToEur,date:"",source:"manual"};

/* ---------- identidad y enlaces ---------- */
function ptcgId(tcgdexId){ // TCGdex «sv03.5-199» → pokemontcg «sv3pt5-199» (tabla exacta V113; regla antigua solo como respaldo)
 const M=window.CV_PTCG;if(M?.id?.[tcgdexId])return M.id[tcgdexId];
 const i=tcgdexId.lastIndexOf("-"),set=tcgdexId.slice(0,i),num=tcgdexId.slice(i+1).replace(/^([A-Za-z]*)0+(?=\d)/,"$1");
 if(M?.sets?.[set])return M.sets[set]+"-"+num;
 const m=set.match(/^(sv|me)0?(\d+)(?:\.(\d))?$/);const s=m?m[1]+m[2]+(m[3]?"pt"+m[3]:""):set;return s+"-"+num;
}
const hasPtcg=tcgdexId=>!window.CV_PTCG||!window.CV_PTCG.none.includes(tcgdexId);
function pkLinks(row,p){
 const id=ptcgId(row[0]),ok=hasPtcg(row[0]),q=encodeURIComponent(row[1]+" "+String(row[3]).replace(/^0+(?=\d)/,""));
 return {cardmarket:ok?"https://prices.pokemontcg.io/cardmarket/"+id:"https://www.cardmarket.com/es/Pokemon/Products/Search?searchString="+q,
  cardmarketSearch:"https://www.cardmarket.com/es/Pokemon/Products/Search?searchString="+q,
  tcgplayer:N(p?.tpId)?"https://www.tcgplayer.com/product/"+p.tpId:ok?"https://prices.pokemontcg.io/tcgplayer/"+id:""};
}
/* Imagen: primero la de pokemontcg.io/scrydex (confirmada en su base de datos), después la de TCGdex. */
function pkImages(row,p){
 const M=window.CV_PTCG,id=row[0],tcg=p?.image||"https://assets.tcgdex.net/en/"+row[6]+"/"+id.slice(0,id.lastIndexOf("-"))+"/"+row[3]+"/high.webp";
 if(!hasPtcg(id))return [tcg];
 const pid=ptcgId(id),i=pid.lastIndexOf("-"),ptcg=M?.img?.[id]||"https://images.pokemontcg.io/"+pid.slice(0,i)+"/"+pid.slice(i+1)+"_hires.png";
 return [ptcg,tcg];
}
const pkImage=row=>pkImages(row)[0];
/* Fotos con respaldo: imagen alternativa, después un reintento, después aviso con el nombre. */
function wireImgs(root){root.querySelectorAll("img[data-v4img]").forEach(im=>{if(im.dataset.wired)return;im.dataset.wired="1";
 const fail=()=>{im.hidden=true;const n=im.parentElement.querySelector(".v4noimg");if(n)n.hidden=false};
 const onErr=()=>{const alt=im.dataset.alt;if(alt&&!im.dataset.usedAlt){im.dataset.usedAlt="1";im.addEventListener("error",onErr,{once:true});im.src=alt;return}
  if(im.dataset.retried){fail();return}im.dataset.retried="1";const src=im.getAttribute("src");
  setTimeout(()=>{if(!im.isConnected)return;im.addEventListener("error",onErr,{once:true});im.src=src+(src.includes("?")?"&":"?")+"r=1"},2000)};
 if(im.complete&&im.naturalWidth===0&&im.getAttribute("src"))onErr();else im.addEventListener("error",onErr,{once:true})})}
const imgTag=(row,p,alt)=>{const [a,b]=pkImages(row,p);return '<img src="'+E(a)+'"'+(b?' data-alt="'+E(b)+'"':'')+' alt="'+E(alt)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>'};

/* ---------- lectura de precios ---------- */
function parseTcgdex(j){
 const cm=j?.pricing?.cardmarket||{},tp=j?.pricing?.tcgplayer||{};
 let usd=NaN;for(const [k,o] of Object.entries(tp))if(o&&typeof o==="object"&&N(o.marketPrice)){usd=Number.isFinite(usd)?Math.min(usd,N(o.marketPrice)):N(o.marketPrice)}
 return {t:Date.now(),trend:N(cm.trend),avg30:N(cm.avg30),avg7:N(cm.avg7),avg1:N(cm.avg1),avg:N(cm.avg),low:N(cm.low),cmUpdated:cm.updated||"",cmId:N(cm.idProduct)||N(cm.productId)||undefined,
  usd,tpUpdated:tp.updated||"",tpId:N(tp.productId)||undefined,rarity:j?.rarity||"",image:j?.image?j.image+"/high.webp":""};
}
/* Petición con tiempo máximo (12 s) y un único reintento ante 429, 5xx o tiempo agotado. */
async function getJSON(url,signal,tries=2){
 for(let k=0;k<tries;k++){
  const t=new AbortController(),stop=()=>t.abort();signal?.addEventListener("abort",stop,{once:true});const timer=setTimeout(()=>t.abort(),12000);
  try{const r=await fetch(url,{signal:t.signal,cache:"no-store"});
   if(r.ok){let j;try{j=await r.json()}catch{throw new Error("Respuesta no válida (JSON)")}return j}
   if(!(r.status===429||r.status>=500)||k===tries-1)throw new Error("HTTP "+r.status);
  }catch(e){if(signal?.aborted)throw e;if(k===tries-1)throw new Error(t.signal.aborted?"Tiempo agotado":(e.message||"Error de red"))}
  finally{clearTimeout(timer);signal?.removeEventListener("abort",stop)}
  await new Promise(r=>setTimeout(r,1500*(k+1)));
 }
}

/* ---------- evaluación ---------- */
/* Criba: diferencia bruta entre la media agregada de ventas y el anuncio más barato (cualquier estado e idioma).
   Es un INDICADOR para decidir qué abrir; no es beneficio: no hay estado, idioma, vendedor, costes ni ventas comparables. */
function evaluatePk(row,p,c,owned){
 const ref=[p.trend,p.avg30].filter(Number.isFinite),refC=ref.length?Math.min(...ref):NaN;
 const out={kind:"pk",row,p,id:row[0],name:row[1],set:row[2],number:row[3]+(row[4]?"/"+row[4]:""),rarity:row[5],group:row[7],ref:refC,low:p.low,reasons:[],risks:[]};
 if(owned){out.reasons.push("Ya está en Mi colección");return out}
 if(!Number.isFinite(refC)){out.reasons.push("Sin media de ventas de Cardmarket en la fuente");return out}
 if(refC<20){out.reasons.push("Valor de referencia "+EUR(refC)+" (< 20 €)");return out}
 if(!Number.isFinite(p.low)){out.reasons.push("Sin anuncios en Cardmarket según la fuente");return out}
 out.gap=refC-p.low;out.gapPct=out.gap/refC;
 const vol=Number.isFinite(p.avg7)&&Number.isFinite(p.avg30)?Math.abs(p.avg7/p.avg30-1):NaN;
 const diverge=Number.isFinite(p.trend)&&Number.isFinite(p.avg30)&&Math.max(p.trend,p.avg30)/Math.min(p.trend,p.avg30)>1.6;
 if(vol>0.5)out.risks.push("Precio inestable: media 7 días "+EUR(p.avg7)+" frente a 30 días "+EUR(p.avg30));
 if(diverge)out.risks.push("Tendencia y media 30 días muy distintas: probablemente pocas ventas");
 if(!Number.isFinite(p.avg7))out.risks.push("Sin media de 7 días: liquidez desconocida");
 if(p.low>200)out.reasons.push("Anuncio más barato "+EUR(p.low)+" (> 200 €)");
 else if(p.low<5)out.reasons.push("Anuncio más barato "+EUR(p.low)+": casi seguro carta muy dañada, otra variante o error");
 else if(out.gap<c.minProfit)out.reasons.push("Diferencia bruta "+EUR(out.gap)+" (< "+EUR(c.minProfit)+") antes de costes");
 else if(out.gapPct<0.35)out.reasons.push("Diferencia del "+Math.round(out.gapPct*100)+" % (< 35 %): los costes la absorben");
 out.pass=!out.reasons.length;
 out.score=out.pass?out.gap*(1-Math.min(.5,Number.isFinite(vol)?vol:.3))*(diverge?.75:1):-1;
 return out;
}
function evaluateLo(c,f){
 const usd=Math.max(N(c.prices?.usd)||0,N(c.prices?.usd_foil)||0),eur=usd*f.rate;
 return {kind:"lo",id:"lo-"+c.id,name:c.name+(c.version?" – "+c.version:""),set:c.set?.name||"",number:String(c.collector_number||""),rarity:String(c.rarity||"").replace(/_/g," "),eur,usd,
  image:c.image_uris?.digital?.large||c.image_uris?.digital?.normal||"",tcgplayer:N(c.tcgplayer_id)?"https://www.tcgplayer.com/product/"+c.tcgplayer_id:"",t:Date.now()};
}

/* ---------- escaneo ---------- */
let running=null;
function ownedKeys(){const st=window.CVStateBridge?.get?.();const n=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();const num=v=>String(v||"").split("/")[0].replace(/\D/g,"").replace(/^0+/,"");
 const set=new Set();for(const c of (st?.cards||[]))if(!c.archivedSold)set.add(n(c.name)+"|"+num(c.number));return k=>set.has(k)}
function rowKey(row){return String(row[1]).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim()+"|"+String(row[3]).replace(/\D/g,"").replace(/^0+/,"")}
async function loadUniverse(){if(window.CV_UNIVERSE){cache.universeCount=window.CV_UNIVERSE.cards.length;return window.CV_UNIVERSE}await new Promise((ok,ko)=>{const s=document.createElement("script");s.src="vault-universe.js?v=1.0";s.onload=ok;s.onerror=()=>ko(new Error("No se pudo cargar el universo de cartas"));document.head.appendChild(s)});return window.CV_UNIVERSE}
async function scanPokemon(group){
 const U=await loadUniverse(),rows=U.cards.filter(r=>group==="all"||r[7]===group);
 const ctrl=new AbortController();running={ctrl,done:0,total:rows.length,ok:0,fail:0,label:group==="all"?"Pokémon · todo":"Pokémon · "+U.meta.groups[group].label,startedAt:Date.now(),errors:{}};
 const todo=rows.filter(r=>!(cache.pk[r[0]]&&Date.now()-cache.pk[r[0]].t<TTL));running.done=rows.length-todo.length;running.ok=running.done;
 render();let i=0,lastSave=Date.now();
 const worker=async()=>{while(i<todo.length&&!ctrl.signal.aborted){const r=todo[i++];
  try{const j=await getJSON("https://api.tcgdex.net/v2/en/cards/"+encodeURIComponent(r[0]),ctrl.signal);if(!j||typeof j!=="object"||Array.isArray(j))throw new Error("Respuesta vacía o malformada");cache.pk[r[0]]=parseTcgdex(j);if(!j.pricing)running.noPrice=(running.noPrice||0)+1;running.ok++}
  catch(e){if(ctrl.signal.aborted)break;running.fail++;const k=String(e.message||e).slice(0,60);running.errors[k]=(running.errors[k]||0)+1;
   if(running.ok===rows.length-todo.length&&running.fail>=8)/* 8 fallos sin ningún acierto: sin conexión */{running.errors["Sin conexión con TCGdex: consulta detenida"]=1;ctrl.abort();break}}
  running.done++;if(Date.now()-lastSave>4000){writeCache();lastSave=Date.now();render()}}};
 await Promise.all(Array.from({length:4},worker));
 finish();
}
async function scanLorcana(){
 const ctrl=new AbortController(),f=fx();running={ctrl,done:0,total:1,ok:0,fail:0,label:"Lorcana · todas las expansiones",startedAt:Date.now(),errors:{}};render();
 try{const sets=(await getJSON("https://api.lorcast.com/v0/sets",ctrl.signal)).results||[];running.total=sets.length;
  for(const s of sets){if(ctrl.signal.aborted)break;
   try{const j=await getJSON("https://api.lorcast.com/v0/sets/"+encodeURIComponent(s.code||s.id)+"/cards",ctrl.signal);const list=Array.isArray(j)?j:(j.results||[]);
    for(const c of list){const x=evaluateLo(c,f);if(x.eur>0)cache.lo[x.id]=x}running.ok++}
   catch(e){if(ctrl.signal.aborted)break;running.fail++;const k=String(e.message||e).slice(0,60);running.errors[k]=(running.errors[k]||0)+1}
   running.done++;render();await new Promise(r=>setTimeout(r,120))}}
 catch(e){running.fail++;running.errors[String(e.message||e).slice(0,60)]=1}
 finish();
}
function finish(){if(!running)return;cache.runs.push({label:running.label,at:Date.now(),total:running.total,ok:running.ok,fail:running.fail,errors:running.errors});cache.runs=cache.runs.slice(-12);writeCache();running=null;render()}

/* ---------- vistas ---------- */
let view="top",lens="restaurar";
function results(){
 const c=cfg(),isOwned=ownedKeys(),U=window.CV_UNIVERSE;const out=[];
 if(U)for(const r of U.cards){const p=cache.pk[r[0]];if(p&&Date.now()-p.t<TTL)out.push(evaluatePk(r,p,c,isOwned(rowKey(r))))}
 return out;
}
function staleCount(){let n=0;for(const p of Object.values(cache.pk))if(Date.now()-p.t>=TTL)n++;return n}
function pkCard(x,rank){
 const c=cfg(),p=x.p,links=pkLinks(x.row,p);
 return '<article class="v4card s-observacion rd">'+
 '<figure class="v4photo">'+imgTag(x.row,p,x.name)+'<div class="v4noimg" hidden><b>'+E(x.name)+'</b><span>Foto no disponible</span></div><figcaption>Imagen de catálogo · no es el ejemplar anunciado</figcaption></figure>'+
 '<div class="v4body"><div class="v4badges">'+(rank?'<span class="v4tag rank">#'+rank+'</span>':'')+'<span class="v4status s-observacion">EN INVESTIGACIÓN</span><span class="v4tag">Pokémon · inglés</span></div>'+
 '<h3>'+E(x.name)+'</h3><p class="v4id">'+E(x.set)+' · nº '+E(x.number)+' · '+E(x.rarity||"—")+'</p>'+
 '<div class="v4money">'+
  '<div><span>ANUNCIO MÁS BARATO</span><b>'+EUR(x.low)+'</b><small>Cardmarket · estado, idioma y vendedor DESCONOCIDOS</small></div>'+
  '<div><span>MEDIA DE VENTAS (AGREGADO)</span><b>'+EUR(x.ref)+'</b><small>mínimo de tendencia y media 30 días · todos los estados</small></div>'+
  '<div class="v4profit t-muted"><span>DIFERENCIA BRUTA · INDICADOR</span><b>'+EUR(x.gap)+'</b><small>'+Math.round(x.gapPct*100)+' % · antes de costes · NO es beneficio</small></div>'+
 '</div>'+
 '<p class="v4basis">Criba, no recomendación: la diferencia compara una media de ventas de todos los estados con el anuncio más barato, que suele ser un ejemplar dañado o de otro idioma. No se calcula beneficio sin anuncio concreto, coste puesto en Sevilla y ventas comparables. Datos Cardmarket publicados por TCGdex: '+E(p.cmUpdated?DAY(p.cmUpdated):"sin fecha")+' · consultados '+WHEN(p.t)+'. Las medias son agregados, no ventas individuales.</p>'+
 (x.risks.length?'<p class="v4missing"><b>Riesgos:</b> '+E(x.risks.join(" · "))+'</p>':'')+
 '<p class="v4why"><b>Qué comprobar:</b> abre Cardmarket, ordena por precio y mira las fotos del anuncio más barato: estado, idioma, edición y vendedor. Si es un ejemplar dañado con buena base, estúdialo en «Comprar para restaurar».</p>'+
 '<div class="v4actions"><a class="v4btn primary" href="'+E(links.cardmarket)+'" target="_blank" rel="noopener noreferrer">Ver anuncios en Cardmarket ↗</a>'+
 '<button type="button" class="v4btn" data-rd-promote="'+E(x.id)+'|restaurar">Estudiar para restaurar</button><button type="button" class="v4btn" data-rd-promote="'+E(x.id)+'|compra">Estudiar en Compra YA</button>'+
 '<a class="v4btn" href="'+E(links.tcgplayer)+'" target="_blank" rel="noopener noreferrer">Ventas TCGplayer ↗</a></div></div></article>';
}
function loCard(x){
 const f=fx();
 return '<article class="v4salecard rdlo">'+(x.image?'<img src="'+E(x.image)+'" alt="'+E(x.name)+'" loading="lazy" referrerpolicy="no-referrer" data-v4img>':'')+'<div><h3>'+E(x.name)+'</h3><p class="v4id">'+E(x.set)+' · nº '+E(x.number)+' · '+E(x.rarity)+'</p>'+
 '<p><b>'+EUR(x.eur)+'</b> <small>('+E(x.usd.toLocaleString("es-ES",{style:"currency",currency:"USD"}))+' · TCGplayer, agregado · cambio '+String(f.rate).replace(".",",")+(f.date?" del "+E(DAY(f.date)):" manual")+')</small></p>'+
 (x.tcgplayer?'<a class="v4btn" href="'+E(x.tcgplayer)+'" target="_blank" rel="noopener noreferrer">Ventas TCGplayer ↗</a>':'')+'</div></article>';
}
function render(){
 try{renderLive()}catch(e){console.error("Card Vault radar",e)}
 const host=document.getElementById("v4Radar");if(!host)return;
 const U=window.CV_UNIVERSE,c=cfg(),all=results(),pass=all.filter(x=>x.pass).sort((a,b)=>b.score-a.score),disc=all.filter(x=>!x.pass);
 const lo=Object.values(cache.lo).filter(x=>Date.now()-x.t<TTL&&x.eur>=20&&/enchanted|epic|iconic|legendary|promo/i.test(x.rarity)).sort((a,b)=>b.eur-a.eur);
 const pkCount=all.length,stale=staleCount(),loCount=Object.keys(cache.lo).length,last=cache.runs[cache.runs.length-1];
 const groups=U?Object.entries(U.meta.groups):[];
 const list=view==="top"?pass.slice(0,3):view==="top10"?pass.slice(0,10):pass;
 host.innerHTML='<section class="v4head"><span class="v4kicker">BLOQUE C · DATOS EN DIRECTO DESDE ESTE IPHONE · SIN EBAY</span><h2>En investigación</h2>'+
 '<p>El radar consulta en directo los precios publicados de miles de cartas y busca diferencias entre el anuncio más barato de Cardmarket y la media de ventas. Es una criba: ninguna carta de aquí es una compra comprobada. Ábrela, mira las fotos y regístrala en Compra YA o en Restaurar.</p>'+
 '<div class="v4summary"><div class="s-objetivo"><b>'+pkCount.toLocaleString("es-ES")+'</b><span>Cartas Pokémon con precio consultado</span></div><div class="s-observacion"><b>'+pass.length+'</b><span>Pasan la criba (sin verificar)</span></div><div class="s-caducada"><b>'+disc.length+'</b><span>Descartadas con motivo</span></div><div class="s-objetivo"><b>'+loCount.toLocaleString("es-ES")+'</b><span>Cartas Lorcana consultadas</span></div></div>'+
 (running?'<div class="rdprog"><b>'+E(running.label)+'</b><progress max="'+running.total+'" value="'+running.done+'"></progress><span>'+running.done+' / '+running.total+' · '+running.fail+' fallos</span><button type="button" class="v4btn" data-rd-stop>Detener</button></div>':
  '<div class="rdscan"><label>Familia de cartas<select data-rd-group><option value="vintage">Vintage WotC</option>'+groups.filter(([k])=>k!=="vintage").map(([k,g])=>'<option value="'+k+'">'+E(g.label)+' ('+g.count+')</option>').join("")+'<option value="all">Todas ('+(U?U.cards.length:"…")+')</option></select></label><button type="button" class="v4btn primary" data-rd-scan>Consultar precios Pokémon</button><button type="button" class="v4btn" data-rd-lorcana>Consultar Lorcana</button></div>')+
 (last?'<p class="v4note">Última consulta: '+E(last.label)+' · '+WHEN(last.at)+' · '+last.ok+' correctas, '+last.fail+' fallidas'+(last.fail?' ('+E(Object.entries(last.errors||{}).map(([k,v])=>k+" ×"+v).join(", "))+')':'')+'. Los precios se guardan 24 h en este iPhone'+(stale?' · '+stale+' precio(s) de más de 24 h ignorados: vuelve a consultar':'')+'.</p>':'<p class="v4note">Aún no se ha consultado nada en este dispositivo. Pulsa «Consultar precios» (con wifi tarda entre unos segundos y un par de minutos).</p>')+
 '</section>'+
 (pass.length?'<div class="v4filters">'+[["top","Top 3"],["top10","Top 10"],["all","Todas ("+pass.length+")"],["disc","Descartadas ("+disc.length+")"]].map(([k,t])=>'<button type="button" data-rd-view="'+k+'" class="'+(view===k?"on":"")+'">'+t+'</button>').join("")+'</div>':'')+
 (view==="disc"?'<div class="v4list">'+disc.slice(0,300).map(x=>'<div class="cyDiscRow"><b>'+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+' — '+E(x.reasons.join("; "))+'</div>').join("")+(disc.length>300?'<p class="v4note">Mostrando 300 de '+disc.length+'.</p>':'')+'</div>':
  list.length?'<div class="v4list">'+list.map((x,i)=>pkCard(x,i+1)).join("")+'</div>':(pkCount?'<p class="v4empty big">Ninguna carta consultada pasa hoy la criba (diferencia bruta ≥ '+EUR(c.minProfit)+' y ≥ 35 %). Consulta otra familia o revisa las descartadas.</p>':''))+
 (lo.length?'<details class="v4old"><summary>Lorcana · referencia de precios EE. UU. ('+lo.length+')</summary><p class="v4note">Lorcast solo publica el precio de mercado de TCGplayer (agregado, en dólares). No hay en abierto anuncios ni ventas de Cardmarket para Lorcana, así que aquí no se calcula beneficio: sirve para comparar con lo que veas en Cardmarket.</p><div class="v4list">'+lo.slice(0,60).map(loCard).join("")+'</div></details>':'');
 wireImgs(host);
}
/* ---------- V113 · ofertas en directo para Compra YA y Comprar para restaurar, con idiomas separados ----------
   Fuente automática: guía de precios diaria de Cardmarket que publica TCGdex, consultada desde este iPhone (máx. 24 h).
   ATENCIÓN: esa guía MEZCLA todos los idiomas y estados de la carta. El «desde» puede ser un ejemplar en otro idioma o dañado,
   y la media de ventas mezcla inglés, español, francés, alemán, italiano y portugués. Por eso:
   - la diferencia «desde» vs media solo sirve para CRIBAR qué cartas mirar; nunca se presenta como beneficio;
   - el beneficio solo se calcula con compra y venta del MISMO idioma: precios que anotas tras filtrar por idioma en Cardmarket,
     o, en inglés, el precio de mercado de TCGplayer (EE. UU., calculado con ventas reales de ejemplares en inglés).
   Compra YA: «desde» ≥ 50 % de la media. Restaurar: «desde» < 60 % de la media (casi siempre en mal estado).
   Beneficio = venta × (1 − comisión) − envío de venta − compra − envío de compra. Estimación, nunca beneficio seguro. */
const LANGS=[["en","Inglés"],["es","Español"],["fr","Francés"],["de","Alemán"],["it","Italiano"],["pt","Portugués"]];
const LSTORE="cv_v113_lang";
function readLang(){try{const x=JSON.parse(localStorage.getItem(LSTORE)||"{}");return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}catch{return {}}}
let langData=readLang();
function writeLang(){try{localStorage.setItem(LSTORE,JSON.stringify(langData));return true}catch{return false}}
const NUM=v=>{const t=String(v??"").trim().replace(/\s|€/g,"");if(!t)return NaN;const x=Number(t.includes(",")?t.replace(/\./g,"").replace(",","."):t);return Number.isFinite(x)&&x>0?x:NaN};
const netSale=(v,c)=>v*(1-c.feePct/100)-c.sellShip;
function enSale(p){const f=fx();return Number.isFinite(p?.usd)?p.usd*f.rate:NaN}
/* Precios del idioma: los anotados; en inglés, si no anotas venta, la referencia de TCGplayer (mejorada en Restaurar). */
function langRows(id,p,c,lane){
 const saved=langData[id]||{},en=enSale(p);
 return LANGS.map(([k,name])=>{const v=saved[k]||{},buy=N(v.buy),sellOwn=N(v.sell);
  const sellRef=k==="en"&&Number.isFinite(en)?(lane==="restaurar"?en*c.restMid:en):NaN;
  const sell=Number.isFinite(sellOwn)?sellOwn:sellRef;
  const profit=Number.isFinite(buy)&&Number.isFinite(sell)?netSale(sell,c)-buy-c.buyShip:NaN;
  return {k,name,buy,sell,sellOwn,sellRef,profit,at:v.at||""}});
}
function liveDeal(r,p,c,lane){
 const ref=Math.min(...[p.trend,p.avg30].filter(Number.isFinite));
 if(!Number.isFinite(ref)||!Number.isFinite(p.low)||p.low<20||p.low>200)return null;
 const ratio=p.low/ref,cost=p.low+c.buyShip;
 if(lane==="compra"){if(ratio<0.5)return null;const sale=[ref*.9,ref,ref];const pr=sale.map(v=>netSale(v,c)-cost);
  if(pr[1]<c.minProfit)return null;return {r,p,ref,ratio,sale,pr,cost,lane}}
 if(ratio>=0.6)return null;const sale=[ref*c.restLow,ref*c.restMid,ref*c.restHigh];const pr=sale.map(v=>netSale(v,c)-cost);
 if(pr[1]<c.minProfit)return null;return {r,p,ref,ratio,sale,pr,cost,lane};
}
function liveDeals(lane){
 const c=cfg(),U=window.CV_UNIVERSE,isOwned=ownedKeys(),out=[];if(!U)return out;
 for(const r of U.cards){const p=cache.pk[r[0]];if(!p||Date.now()-p.t>=TTL||isOwned(rowKey(r)))continue;const d=liveDeal(r,p,c,lane);
  if(d){const rows=langRows(r[0],p,c,lane),best=rows.filter(x=>Number.isFinite(x.profit)).sort((a,b)=>b.profit-a.profit)[0]||null;d.rows=rows;d.best=best;out.push(d)}}
 const conf=d=>d.best&&d.best.profit>=c.minProfit?1:0;
 return out.sort((a,b)=>conf(b)-conf(a)||(conf(a)?b.best.profit-a.best.profit:b.pr[0]-a.pr[0]));
}
function liveCard(d,rank){
 const c=cfg(),{r,p}=d,links=pkLinks(r,p),isR=d.lane==="restaurar",id=r[0],en=enSale(p),best=d.best,ok=best&&best.profit>=c.minProfit;
 const tbl='<table class="v4scen rdlang"><tr><th>Idioma</th><th>Compra '+(isR?'(mal estado)':'(buen estado)')+'</th><th>Venta '+(isR?'mejorada':'')+'</th><th>Beneficio</th></tr>'+
  d.rows.map(x=>'<tr><td>'+x.name+'</td><td><input inputmode="decimal" aria-label="Compra en '+x.name+'" data-rd-lbuy="'+E(id)+'|'+x.k+'" value="'+(Number.isFinite(x.buy)?String(x.buy).replace(".",","):"")+'" placeholder="€"></td>'+
   '<td><input inputmode="decimal" aria-label="Venta en '+x.name+'" data-rd-lsell="'+E(id)+'|'+x.k+'" value="'+(Number.isFinite(x.sellOwn)?String(x.sellOwn).replace(".",","):"")+'" placeholder="'+(Number.isFinite(x.sellRef)?E(EUR(x.sellRef))+' ref.':'€')+'"></td>'+
   '<td>'+(Number.isFinite(x.profit)?'<b class="'+(x.profit>=c.minProfit?'rdpos':'rdneg')+'">'+SIGNED(x.profit)+'</b>':'—')+'</td></tr>').join("")+'</table>';
 return '<article class="v4card s-observacion rdlive" id="live-'+E(id)+'">'+
 '<figure class="v4photo">'+imgTag(r,p,r[1])+'<div class="v4noimg" hidden><b>'+E(r[1])+'</b><span>Foto no disponible · '+E(r[2])+' nº '+E(r[3])+'</span></div><figcaption>Imagen de catálogo · el ejemplar anunciado se ve en Cardmarket</figcaption></figure>'+
 '<div class="v4body"><div class="v4badges"><span class="v4tag rank">#'+rank+'</span><span class="v4status '+(ok?'s-comprobada':'s-observacion')+'">'+(ok?'RENTABLE EN '+best.name.toUpperCase()+' · PRECIOS DEL IDIOMA':'EN DIRECTO · IDIOMA SIN CONFIRMAR')+'</span><span class="v4tag">Pokémon</span></div>'+
 '<h3>'+E(r[1])+'</h3><p class="v4id">'+E(r[2])+' · nº '+E(r[3]+(r[4]?"/"+r[4]:""))+' · '+E(r[5]||"—")+'</p>'+
 '<div class="v4money">'+
  '<div><span>DESDE · CUALQUIER IDIOMA Y ESTADO</span><b>'+EUR(p.low)+'</b><small>anuncio más barato de la ficha · a '+Math.round(d.ratio*100)+' % de la media'+(isR?' · casi seguro en mal estado':'')+'</small></div>'+
  '<div><span>MEDIA DE VENTAS CARDMARKET · TODOS LOS IDIOMAS</span><b>'+EUR(d.ref)+'</b><small>ventas reales mezcladas (30 días '+EUR(p.avg30)+' · tendencia '+EUR(p.trend)+')</small></div>'+
  '<div><span>VENTAS EN INGLÉS · TCGPLAYER EE. UU.</span><b>'+EUR(en)+'</b><small>'+(Number.isFinite(en)?'precio de mercado con ventas reales en inglés · '+E(p.usd.toLocaleString("es-ES",{style:"currency",currency:"USD"})):'sin dato publicado')+'</small></div>'+
  '<div class="v4profit '+(ok?'t-good':'t-muted')+'"><span>BENEFICIO EN UN MISMO IDIOMA</span><b>'+(best?SIGNED(best.profit):'—')+'</b><small>'+(best?'en '+best.name+(Number.isFinite(best.sellOwn)?' · venta anotada':' · venta: referencia TCGplayer'+(isR?' × '+Math.round(c.restMid*100)+' %':''))+' · tras comisión y envíos':'anota abajo la compra del idioma que veas en Cardmarket')+'</small></div>'+
 '</div>'+
 '<p class="v4missing"><b>Idiomas mezclados:</b> la diferencia entre «desde» y la media es '+EUR(d.ref-p.low)+' ('+(isR?'venta mejorada central '+EUR(d.sale[1])+' → ':'')+'cribado '+SIGNED(d.pr[1])+'), pero NO es beneficio: el «desde» puede ser otro idioma u otro estado. Las cartas japonesas son otra ficha en Cardmarket.</p>'+
 '<details class="v4more rdlangbox"'+(best?' open':'')+'><summary>Precios por idioma · compra y venta del mismo idioma</summary>'+
 '<p class="v4note">En Cardmarket abre la ficha, pulsa Filtros → Idioma'+(isR?'':' y Estado mínimo')+'. Anota el anuncio más barato '+(isR?'en mal estado':'en buen estado')+' de cada idioma y, si la conoces, la venta '+(isR?'de una carta mejorada ':'')+'en ese idioma. En inglés se propone la referencia de TCGplayer.</p>'+tbl+
 '<button type="button" class="v4btn primary" data-rd-lsave="'+E(id)+'">Guardar precios por idioma</button>'+(best&&best.at?'<small class="v4note"> Anotado el '+E(DAY(best.at))+'</small>':'')+'</details>'+
 '<p class="v4basis">'+(isR?'Se vende declarada como restaurada. No incluye tus materiales ni tus horas.':'Si en las fotos está dañada, no es Compra YA.')+' Envío de compra estimado '+EUR(c.buyShip)+', venta con '+String(c.feePct).replace(".",",")+' % de comisión y '+EUR(c.sellShip)+' de envío. Guía de Cardmarket publicada por TCGdex el '+E(p.cmUpdated?DAY(p.cmUpdated):"(sin fecha)")+' · consultada '+WHEN(p.t)+'. Los precios pueden haber cambiado.</p>'+
 '<div class="v4actions"><a class="v4btn primary" href="'+E(links.cardmarket)+'" target="_blank" rel="noopener noreferrer">Abrir en Cardmarket ↗</a>'+
 (links.tcgplayer?'<a class="v4btn" href="'+E(links.tcgplayer)+'" target="_blank" rel="noopener noreferrer">Ventas en inglés (TCGplayer) ↗</a>':'')+
 '<button type="button" class="v4btn" data-rd-promote="'+E(id)+'|'+d.lane+'">Registrar este anuncio</button></div></div></article>';
}
function saveLang(id){
 const box=document.getElementById("live-"+id);if(!box)return;const cur={...(langData[id]||{})};let bad=[];
 for(const [k,name] of LANGS){const bi=box.querySelector('[data-rd-lbuy="'+id+'|'+k+'"]'),si=box.querySelector('[data-rd-lsell="'+id+'|'+k+'"]');if(!bi||!si)continue;
  const b=NUM(bi.value),s=NUM(si.value);if((bi.value.trim()&&!Number.isFinite(b))||(si.value.trim()&&!Number.isFinite(s))){bad.push(name);continue}
  if(Number.isFinite(b)||Number.isFinite(s))cur[k]={buy:Number.isFinite(b)?b:undefined,sell:Number.isFinite(s)?s:undefined,at:new Date().toISOString()};else delete cur[k]}
 if(bad.length){alert("Importe no válido en: "+bad.join(", ")+". Usa números como 150 o 149,90.");return}
 const prev=langData[id];langData[id]=cur;if(!Object.keys(cur).length)delete langData[id];
 if(!writeLang()){if(prev)langData[id]=prev;else delete langData[id];alert("NO se han guardado los precios: el almacenamiento del navegador no lo permite.");return}
 renderLive();document.getElementById("live-"+id)?.scrollIntoView({block:"nearest"});
}
function renderLive(){
 if(typeof document.querySelector!=="function")return;
 langData=readLang();
 for(const lane of ["compra","restaurar"]){
  const slot=document.querySelector('[data-rd-live="'+lane+'"]');if(!slot)continue;
  const U=window.CV_UNIVERSE,deals=liveDeals(lane),c=cfg(),fresh=Object.values(cache.pk).filter(p=>Date.now()-p.t<TTL).length,groups=U?Object.entries(U.meta.groups):[];
  const nConf=deals.filter(d=>d.best&&d.best.profit>=c.minProfit).length;
  const ctl=running?'<div class="rdprog"><b>'+E(running.label)+'</b><progress max="'+running.total+'" value="'+running.done+'"></progress><span>'+running.done+' / '+running.total+' · '+running.fail+' fallos</span><button type="button" class="v4btn" data-rd-stop>Detener</button></div>':
   '<div class="rdscan"><label>Familia de cartas<select data-rd-group>'+groups.map(([k,g])=>'<option value="'+k+'">'+E(g.label)+' ('+g.count+')</option>').join("")+'<option value="all">Todas ('+(U?U.cards.length:"…")+')</option></select></label><button type="button" class="v4btn primary" data-rd-scan>Buscar ofertas en Cardmarket</button></div>';
  slot.innerHTML='<section class="rdlivebox"><h3>'+(lane==="compra"?'Ofertas en directo · comprar y revender':'Ofertas en directo · comprar dañada y vender mejorada')+'</h3>'+
   '<p class="v4note">'+fresh.toLocaleString("es-ES")+' cartas con precio de Cardmarket de las últimas 24 h en este iPhone · '+deals.length+' candidatas entre 20 y 200 € · <b>'+nConf+' con beneficio ≥ '+EUR(c.minProfit)+' en un mismo idioma</b>. La guía de Cardmarket mezcla idiomas: el beneficio solo se da con compra y venta del mismo idioma.</p>'+ctl+
   (deals.length?'<div class="v4list">'+deals.slice(0,10).map((d,i)=>liveCard(d,i+1)).join("")+'</div>'+(deals.length>10?'<details class="v4old"><summary>Ver todas ('+deals.length+')</summary><div class="v4list">'+deals.slice(10,60).map((d,i)=>liveCard(d,i+11)).join("")+'</div></details>':''):
    '<p class="v4empty">'+(fresh?'Ninguna carta consultada pasa hoy la criba. Prueba otra familia.':'Pulsa «Buscar ofertas en Cardmarket» con conexión: consulta los precios en directo (1–3 min por familia).')+'</p>')+'</section>';
  wireImgs(slot);
 }
}
function promote(id,lane){
 const U=window.CV_UNIVERSE,row=U?.cards.find(r=>r[0]===id),p=cache.pk[id];if(!row||!p)return;
 const links=pkLinks(row,p),d=p.cmUpdated||new Date(p.t).toISOString();
 const sales=[];
 if(Number.isFinite(p.avg30))sales.push({kind:"agregado",price:p.avg30,currency:"EUR",date:d,condition:"todas",language:"todos",platform:"Cardmarket · media 30 días (vía TCGdex)",url:links.cardmarket,note:"Agregado de todas las ventas; no es una venta individual."});
 if(Number.isFinite(p.trend))sales.push({kind:"agregado",price:p.trend,currency:"EUR",date:d,condition:"todas",language:"todos",platform:"Cardmarket · tendencia (vía TCGdex)",url:links.cardmarket,note:"Agregado."});
 if(Number.isFinite(p.low))sales.push({kind:"anuncio",price:p.low,currency:"EUR",date:d,condition:"desconocido",language:"desconocido",platform:"Cardmarket · anuncio más barato (cualquier idioma)",url:links.cardmarket,note:"Precio pedido. NO es una venta."});
 const en=enSale(p);if(Number.isFinite(en))sales.push({kind:"agregado",price:Math.round(en*100)/100,currency:"EUR",date:p.tpUpdated||d,condition:"todas",language:"Inglés",platform:"TCGplayer · precio de mercado EE. UU. (vía TCGdex)",url:links.tcgplayer,note:"Calculado con ventas reales de ejemplares en inglés; agregado, no venta individual. "+p.usd+" USD."});
 const rows=langRows(id,p,cfg(),lane);for(const x of rows)if(Number.isFinite(x.buy))sales.push({kind:"anuncio",price:x.buy,currency:"EUR",date:x.at||new Date().toISOString(),condition:lane==="restaurar"?"mal estado":"buen estado",language:x.name,platform:"Cardmarket · anotado por ti (filtro de idioma)",url:links.cardmarket,note:"Precio pedido. NO es una venta."});
 const best=rows.filter(x=>Number.isFinite(x.profit)).sort((a,b)=>b.profit-a.profit)[0];
 window.CVVault?.addCustom?.({lane,game:"pokemon",name:row[1],set:row[2],number:row[3]+(row[4]?"/"+row[4]:""),rarity:row[5],language:best?best.name:"",image:pkImages(row,p)[0],imageAlt:pkImages(row,p)[1]||"",links,
  why:"Detectada por el radar: anuncio más barato "+EUR(p.low)+" frente a media de ventas "+EUR(Math.min(...[p.trend,p.avg30].filter(Number.isFinite)))+". Falta comprobar el ejemplar y añadir ventas cerradas.",sales,source:"Radar V105"});
}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-rd-scan],[data-rd-lorcana],[data-rd-stop],[data-rd-view],[data-rd-promote],[data-rd-lsave]");if(!t)return;const d=t.dataset;
 if(d.rdLsave){saveLang(d.rdLsave);return}
 if("rdScan" in d){if(running)return;const g=t.parentElement?.querySelector("[data-rd-group]")?.value||document.querySelector("[data-rd-group]")?.value||"vintage";scanPokemon(g).catch(err=>{running=null;render();alert("No se pudo consultar: "+err.message)})}
 else if("rdLorcana" in d){if(!running)scanLorcana()}
 else if("rdStop" in d){running?.ctrl.abort()}
 else if(d.rdView){view=d.rdView;render()}
 else if(d.rdPromote){const [id,lane]=d.rdPromote.split("|");promote(id,lane)}
});
function mount(){const s=document.getElementById("investigacion");if(s&&!document.getElementById("v4Radar")){const d=document.createElement("div");d.id="v4Radar";d.className="v4board";s.prepend(d)}
 if(s&&!s.classList.contains("hidden"))loadUniverse().then(render,()=>render());else if(["","#radar","#comprar-restaurar"].includes(location.hash)){render();setTimeout(autoLive,1500)}/* después de pintar: el catálogo (≈ 430 kB) no retrasa la carga */else render()}
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="investigacion"]'))setTimeout(()=>loadUniverse().then(render,()=>render()),30)});
let autoDone=false;
function autoLive(){loadUniverse().then(()=>{render();const fresh=Object.values(cache.pk).some(p=>Date.now()-p.t<TTL);
 if(!fresh&&!running&&!autoDone&&navigator.onLine!==false){autoDone=true;scanPokemon("vintage").catch(()=>{running=null;render()})}},()=>render())}
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="radar"],.mainNav [data-tab="comprar-restaurar"]'))setTimeout(autoLive,60)});
window.addEventListener("hashchange",()=>{if(location.hash==="#investigacion")loadUniverse().then(render,()=>render())});
window.CVRadar={counts:()=>({catalog:window.CV_UNIVERSE?.cards.length||cache.universeCount||NaN,consulted:Object.values(cache.pk).filter(p=>Date.now()-p.t<TTL).length+Object.values(cache.lo).filter(x=>Date.now()-x.t<TTL).length}),evaluatePk,parseTcgdex,evaluateLo,ptcgId,render,results,liveDeal,liveDeals,renderLive,autoLive,langRows,pkImages,pkLinks,reloadLang:()=>{langData=readLang()},cache:()=>cache};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(mount,400));else setTimeout(mount,400);
})();
