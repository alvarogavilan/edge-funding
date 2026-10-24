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
function ptcgId(tcgdexId){ // TCGdex «sv03.5-199» → pokemontcg «sv3pt5-199»
 const i=tcgdexId.lastIndexOf("-"),set=tcgdexId.slice(0,i),num=tcgdexId.slice(i+1).replace(/^0+(?=\d)/,"");
 const m=set.match(/^(sv|me)0?(\d+)(?:\.(\d))?$/);const s=m?m[1]+m[2]+(m[3]?"pt"+m[3]:""):set;return s+"-"+num;
}
function pkLinks(row,p){
 const id=ptcgId(row[0]);
 return {cardmarket:"https://prices.pokemontcg.io/cardmarket/"+id,
  tcgplayer:N(p?.tpId)?"https://www.tcgplayer.com/product/"+p.tpId:"https://prices.pokemontcg.io/tcgplayer/"+id};
}
const pkImage=row=>"https://assets.tcgdex.net/en/"+row[6]+"/"+row[0].slice(0,row[0].lastIndexOf("-"))+"/"+row[3]+"/high.webp";

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
  catch(e){if(ctrl.signal.aborted)break;running.fail++;const k=String(e.message||e).slice(0,60);running.errors[k]=(running.errors[k]||0)+1}
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
 const c=cfg(),p=x.p,links=pkLinks(x.row,p),img=p.image||pkImage(x.row);
 return '<article class="v4card s-observacion rd">'+
 '<figure class="v4photo"><img src="'+E(img)+'" alt="'+E(x.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img><div class="v4noimg" hidden><b>'+E(x.name)+'</b><span>Foto no disponible</span></div><figcaption>Imagen de catálogo · no es el ejemplar anunciado</figcaption></figure>'+
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
 host.querySelectorAll("img[data-v4img]").forEach(im=>im.addEventListener("error",()=>{im.hidden=true;const n=im.parentElement.querySelector(".v4noimg");if(n)n.hidden=false},{once:true}));
}
function promote(id,lane){
 const U=window.CV_UNIVERSE,row=U?.cards.find(r=>r[0]===id),p=cache.pk[id];if(!row||!p)return;
 const links=pkLinks(row,p),d=p.cmUpdated||new Date(p.t).toISOString();
 const sales=[];
 if(Number.isFinite(p.avg30))sales.push({kind:"agregado",price:p.avg30,currency:"EUR",date:d,condition:"todas",language:"todos",platform:"Cardmarket · media 30 días (vía TCGdex)",url:links.cardmarket,note:"Agregado de todas las ventas; no es una venta individual."});
 if(Number.isFinite(p.trend))sales.push({kind:"agregado",price:p.trend,currency:"EUR",date:d,condition:"todas",language:"todos",platform:"Cardmarket · tendencia (vía TCGdex)",url:links.cardmarket,note:"Agregado."});
 if(Number.isFinite(p.low))sales.push({kind:"anuncio",price:p.low,currency:"EUR",date:d,condition:"desconocido",language:"desconocido",platform:"Cardmarket · anuncio más barato",url:links.cardmarket,note:"Precio pedido. NO es una venta."});
 window.CVVault?.addCustom?.({lane,game:"pokemon",name:row[1],set:row[2],number:row[3]+(row[4]?"/"+row[4]:""),rarity:row[5],language:"Inglés",image:p.image||pkImage(row),links,
  why:"Detectada por el radar: anuncio más barato "+EUR(p.low)+" frente a media de ventas "+EUR(Math.min(...[p.trend,p.avg30].filter(Number.isFinite)))+". Falta comprobar el ejemplar y añadir ventas cerradas.",sales,source:"Radar V105"});
}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-rd-scan],[data-rd-lorcana],[data-rd-stop],[data-rd-view],[data-rd-promote]");if(!t)return;const d=t.dataset;
 if("rdScan" in d){if(running)return;const g=document.querySelector("[data-rd-group]")?.value||"vintage";scanPokemon(g).catch(err=>{running=null;render();alert("No se pudo consultar: "+err.message)})}
 else if("rdLorcana" in d){if(!running)scanLorcana()}
 else if("rdStop" in d){running?.ctrl.abort()}
 else if(d.rdView){view=d.rdView;render()}
 else if(d.rdPromote){const [id,lane]=d.rdPromote.split("|");promote(id,lane)}
});
function mount(){const s=document.getElementById("investigacion");if(s&&!document.getElementById("v4Radar")){const d=document.createElement("div");d.id="v4Radar";d.className="v4board";s.prepend(d)}
 if(s&&!s.classList.contains("hidden"))loadUniverse().then(render,()=>render());else render()}
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="investigacion"]'))setTimeout(()=>loadUniverse().then(render,()=>render()),30)});
window.addEventListener("hashchange",()=>{if(location.hash==="#investigacion")loadUniverse().then(render,()=>render())});
window.CVRadar={counts:()=>({catalog:window.CV_UNIVERSE?.cards.length||cache.universeCount||NaN,consulted:Object.values(cache.pk).filter(p=>Date.now()-p.t<TTL).length+Object.values(cache.lo).filter(x=>Date.now()-x.t<TTL).length}),evaluatePk,parseTcgdex,evaluateLo,ptcgId,render,results,cache:()=>cache};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(mount,400));else setTimeout(mount,400);
})();
