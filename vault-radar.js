/* Card Vault V105–V115 · Radar «En investigación» y ofertas en directo de Compra YA.
   Se ejecuta en el navegador del usuario (Safari) contra APIs públicas con CORS:
   - Pokémon: api.tcgdex.net (guía diaria de Cardmarket) y api.pokemontcg.io (TCGplayer en inglés y Cardmarket «desde EX+»).
   - Lorcana: api.lorcast.com (precio de mercado TCGplayer en USD).
   Todo lo que produce es INVESTIGACIÓN: medias agregadas y el anuncio más barato (sin estado ni idioma).
   Nunca crea una «compra comprobada» ni una «venta cerrada». */
(()=>{"use strict";
const CACHE="cv_v115_radar",TTL=24*3600e3;/* V115: clave nueva (fuentes en bloque y estado de fuentes) */
try{localStorage.removeItem("cv_v105_radar");localStorage.removeItem("cv_v114_radar")}catch{}
const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:NaN};
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>Number.isFinite(v)?v.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—";
const SIGNED=v=>Number.isFinite(v)?(v>=0?"+":"−")+EUR(Math.abs(v)):"—";
const DAY=t=>{const d=new Date(t);return Number.isFinite(d.getTime())?d.toLocaleDateString("es-ES"):"sin fecha"};
const WHEN=t=>{const d=new Date(t);return Number.isFinite(d.getTime())?d.toLocaleString("es-ES",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"—"};
const SRC0=()=>({tcgdex:{ok:0,fail:0},ptcg:{req:0,ok:0,fail:0},lorcast:{ok:0,fail:0}});
function readCache(){try{const x=JSON.parse(localStorage.getItem(CACHE)||"{}");return {pk:x.pk||{},lo:x.lo||{},en:x.en||{},ptSets:x.ptSets||{},src:{...SRC0(),...(x.src||{})},runs:Array.isArray(x.runs)?x.runs:[],universeCount:x.universeCount||0}}catch{return {pk:{},lo:{},en:{},ptSets:{},src:SRC0(),runs:[]}}}
let cache=readCache();
function writeCache(){try{localStorage.setItem(CACHE,JSON.stringify(cache))}catch{try{cache.runs=cache.runs.slice(-5);localStorage.setItem(CACHE,JSON.stringify(cache))}catch{}}}
const cfg=()=>window.CVVault?.user?.().cfg||{feePct:5,sellShip:5,buyShip:6,minProfit:40,restLow:.6,restMid:.75,restHigh:.9,usdToEur:.86,usShip:15,usVat:21,usHandling:5};
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
/* Inglés (TCGplayer, EE. UU.): misma variante para anuncio más barato (low) y precio de mercado (market, calculado con ventas reales).
   Orden de preferencia: impresión principal antes que reverse y 1.ª edición. */
const EN_ORDER=["holofoil","normal","unlimited-holofoil","unlimitedHolofoil","unlimited","reverse-holofoil","reverseHolofoil","1st-edition-holofoil","1stEditionHolofoil","1st-edition","1stEditionNormal"];
function pickEN(variants,mk,lk){
 if(!variants||typeof variants!=="object")return null;
 const keys=[...EN_ORDER.filter(k=>k in variants),...Object.keys(variants).filter(k=>!EN_ORDER.includes(k))];
 for(const k of keys){const o=variants[k];if(o&&typeof o==="object"&&N(o[mk]))return {variant:k,market:N(o[mk]),low:N(o[lk])}}
 return null;
}
function parseTcgdex(j){
 const cm=j?.pricing?.cardmarket||{},tp=j?.pricing?.tcgplayer||{};
 const en=pickEN(tp,"marketPrice","lowPrice");
 return {t:Date.now(),trend:N(cm.trend),avg30:N(cm.avg30),avg7:N(cm.avg7),avg1:N(cm.avg1),avg:N(cm.avg),low:N(cm.low),cmUpdated:cm.updated||"",cmId:N(cm.idProduct)||N(cm.productId)||undefined,
  usd:en?en.market:NaN,usdLow:en?en.low:NaN,enVariant:en?en.variant:"",enSrc:en?"TCGdex":"",tpUpdated:tp.updated||"",tpId:N(tp.productId)||undefined,rarity:j?.rarity||"",image:j?.image?j.image+"/high.webp":""};
}
function parsePtcg(j){const tp=j?.data?.tcgplayer;const en=pickEN(tp?.prices,"market","low");return en?{usd:en.market,usdLow:en.low,enVariant:en.variant,enSrc:"pokemontcg.io",tpUpdated:tp.updatedAt||"",tpUrl:tp.url||""}:null}
/* ---------- V115 · fuentes en bloque: pokemontcg.io (inglés de TCGplayer y Cardmarket «desde EX+») ----------
   Una petición por colección (hasta 250 cartas) en lugar de una por carta. Gratis y sin clave hasta el 1/3/2027:
   máximo 1000 peticiones/día y 30/minuto sin clave → pausa de 2,1 s y tope diario propio de 900. API lenta: 45 s de espera. */
const PT="https://api.pokemontcg.io/v2",BUDGET_KEY="cv_v115_ptcg_budget",PT_DAILY=900;
let revMap=null;
function ptcgToTcgdex(){if(revMap)return revMap;revMap={};for(const r of (window.CV_UNIVERSE?.cards||[]))if(hasPtcg(r[0]))revMap[ptcgId(r[0])]=r[0];return revMap}
function budget(){const d=new Date().toISOString().slice(0,10);let b;try{b=JSON.parse(localStorage.getItem(BUDGET_KEY)||"{}")}catch{b={}}if(b.day!==d)b={day:d,n:0};return b}
function spend(){const b=budget();b.n++;try{localStorage.setItem(BUDGET_KEY,JSON.stringify(b))}catch{}return b.n}
function parsePtcgCard(c){
 const tp=c?.tcgplayer,cm=c?.cardmarket?.prices||{},en=pickEN(tp?.prices,"market","low");
 return {t:Date.now(),tp:en?{...en,updated:tp.updatedAt||""}:null,tpUrl:tp?.url||"",
  cm:{low:N(cm.lowPrice),exPlus:N(cm.lowPriceExPlus),avg30:N(cm.avg30),trend:N(cm.trendPrice),avg:N(cm.averageSellPrice),updated:c?.cardmarket?.updatedAt||""}};
}
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function scanPtcg(ctrl,rows){
 const src=cache.src.ptcg,map=ptcgToTcgdex();
 const sets=[...new Set(rows.filter(r=>hasPtcg(r[0])).map(r=>{const id=ptcgId(r[0]);return id.slice(0,id.lastIndexOf("-"))}))];
 const todo=sets.filter(s=>!(cache.ptSets[s]&&Date.now()-cache.ptSets[s]<TTL));
 running.ptTotal=todo.length;running.ptDone=0;
 for(const s of todo){if(ctrl.signal.aborted)break;
  let page=1,got=0,total=Infinity,okSet=true;
  while(got<total){
   if(budget().n>=PT_DAILY){src.lastErr="Tope diario propio alcanzado ("+PT_DAILY+" peticiones): se reanuda mañana";okSet=false;break}
   try{spend();src.req++;
    const j=await getJSON(PT+"/cards?q=set.id:"+encodeURIComponent(s)+"&pageSize=250&page="+page+"&select=id,number,tcgplayer,cardmarket",ctrl.signal,2,45000);
    const list=Array.isArray(j?.data)?j.data:[];
    for(const c of list){const tid=map[c.id];if(tid)cache.en[tid]=parsePtcgCard(c)}
    got+=list.length;total=Number.isFinite(j?.totalCount)?j.totalCount:got;src.ok++;src.last=Date.now();
    if(!list.length)break;page++;
   }catch(e){if(ctrl.signal.aborted)break;src.fail++;src.lastErr=String(e.message||e).slice(0,80);okSet=false;break}
   await sleep(2100);
  }
  if(okSet)cache.ptSets[s]=Date.now();running.ptDone++;writeCache();render();
 }
}
/* Petición con tiempo máximo (12 s por defecto) y un único reintento ante 429, 5xx o tiempo agotado. */
async function getJSON(url,signal,tries=2,timeout=12000){
 for(let k=0;k<tries;k++){
  const t=new AbortController(),stop=()=>t.abort();signal?.addEventListener("abort",stop,{once:true});const timer=setTimeout(()=>t.abort(),timeout);
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
 const un=N(c.prices?.usd)||0,uf=N(c.prices?.usd_foil)||0,usd=Math.max(un,uf),eur=usd*f.rate;
 return {kind:"lo",id:"lo-"+c.id,foil:uf>un,name:c.name+(c.version?" – "+c.version:""),set:c.set?.name||"",number:String(c.collector_number||""),rarity:String(c.rarity||"").replace(/_/g," "),eur,usd,
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
  try{const j=await getJSON("https://api.tcgdex.net/v2/en/cards/"+encodeURIComponent(r[0]),ctrl.signal);if(!j||typeof j!=="object"||Array.isArray(j))throw new Error("Respuesta vacía o malformada");cache.pk[r[0]]=parseTcgdex(j);if(!j.pricing)running.noPrice=(running.noPrice||0)+1;running.ok++;cache.src.tcgdex.ok++;cache.src.tcgdex.last=Date.now()}
  catch(e){if(ctrl.signal.aborted)break;running.fail++;const k=String(e.message||e).slice(0,60);running.errors[k]=(running.errors[k]||0)+1;cache.src.tcgdex.fail++;cache.src.tcgdex.lastErr=k;
   if(running.ok===rows.length-todo.length&&running.fail>=8)/* 8 fallos sin ningún acierto: sin conexión */{running.errors["Sin conexión con TCGdex: consulta detenida"]=1;ctrl.abort();break}}
  running.done++;if(Date.now()-lastSave>4000){writeCache();lastSave=Date.now();render()}}};
 await Promise.all([...Array.from({length:4},worker),scanPtcg(ctrl,rows).catch(e=>{cache.src.ptcg.fail++;cache.src.ptcg.lastErr=String(e.message||e).slice(0,80)})]);
 finish();
}
async function scanLorcana(){
 const ctrl=new AbortController(),f=fx();running={ctrl,done:0,total:1,ok:0,fail:0,label:"Lorcana · todas las expansiones",startedAt:Date.now(),errors:{}};render();
 try{const sets=(await getJSON("https://api.lorcast.com/v0/sets",ctrl.signal)).results||[];running.total=sets.length;
  for(const s of sets){if(ctrl.signal.aborted)break;
   try{const j=await getJSON("https://api.lorcast.com/v0/sets/"+encodeURIComponent(s.code||s.id)+"/cards",ctrl.signal);const list=Array.isArray(j)?j:(j.results||[]);
    for(const c of list){const x=evaluateLo(c,f);if(x.eur>0)cache.lo[x.id]=x}running.ok++;cache.src.lorcast.ok++;cache.src.lorcast.last=Date.now()}
   catch(e){if(ctrl.signal.aborted)break;running.fail++;const k=String(e.message||e).slice(0,60);running.errors[k]=(running.errors[k]||0)+1;cache.src.lorcast.fail++;cache.src.lorcast.lastErr=k}
   running.done++;render();await new Promise(r=>setTimeout(r,120))}}
 catch(e){running.fail++;running.errors[String(e.message||e).slice(0,60)]=1;cache.src.lorcast.fail++;cache.src.lorcast.lastErr=String(e.message||e).slice(0,60)}
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
/* ---------- V115 · Compra YA unificada: dónde comprar, a qué precio, en qué idioma y a cuánto se vende en ese idioma ----------
   Compras (puestas en 41020 Sevilla, con los supuestos editables de envío, IVA y gestión):
   - Cardmarket (UE) «desde» en cualquier estado y «desde» en EX o mejor. Cardmarket NO publica el idioma de esos precios.
   - TCGplayer (EE. UU.): anuncio más barato en INGLÉS (mercado solo de inglés), traído a Sevilla con envío, IVA y gestión.
   - Lo que anotes de Cardmarket filtrando por idioma.
   Ventas: inglés = precio de mercado de TCGplayer (calculado con ventas reales de ejemplares en inglés).
           Cardmarket media 30 días = todos los idiomas mezclados (solo referencia).
   Operaciones: solo se calcula beneficio con venta en el MISMO idioma que la compra:
   - «Inglés confirmado»: compra en inglés (TCGplayer o anotada) → venta en inglés.
   - «Si es inglés»: compra en Cardmarket a su «desde» → venta en inglés; además, precio máximo en inglés para ganar el mínimo.
   - «Restaurar»: «desde» en cualquier estado (casi siempre mal estado) → venta mejorada a restMid × valor en inglés.
   Estimaciones con datos públicos; nunca beneficio seguro. */
const LANGS=[["en","Inglés"],["es","Español"],["fr","Francés"],["de","Alemán"],["it","Italiano"],["pt","Portugués"],["ja","Japonés"]];
const LSTORE="cv_v113_lang",VSTORE="cv_v115_view";
function readLang(){try{const x=JSON.parse(localStorage.getItem(LSTORE)||"{}");return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}catch{return {}}}
let langData=readLang();
function writeLang(){try{localStorage.setItem(LSTORE,JSON.stringify(langData));return true}catch{return false}}
function readView(){try{return {game:"all",cond:"all",show:"profit",sort:"profit",...JSON.parse(localStorage.getItem(VSTORE)||"{}")}}catch{return {game:"all",cond:"all",show:"profit",sort:"profit"}}}
let lv=readView();
function writeView(){try{localStorage.setItem(VSTORE,JSON.stringify(lv))}catch{}}
const NUM=v=>{const t=String(v??"").trim().replace(/\s|€/g,"");if(!t)return NaN;const x=Number(t.includes(",")?t.replace(/\./g,"").replace(",","."):t);return Number.isFinite(x)&&x>0?x:NaN};
const netSale=(v,c)=>v*(1-c.feePct/100)-c.sellShip;
function usLanded(buy,c){return (buy+(c.usShip??15))*(1+(c.usVat??21)/100)+(c.usHandling??5)}
const fresh=x=>x&&Date.now()-x.t<TTL;
const OLD_CM=14*24*3600e3;
/* Inglés de TCGplayer: pokemontcg.io (en bloque) y, si no, el que traiga TCGdex. */
function enOf(id){
 const e=cache.en[id],p=cache.pk[id];
 if(fresh(e)&&e.tp)return {market:e.tp.market,low:e.tp.low,variant:e.tp.variant,src:"pokemontcg.io",updated:e.tp.updated,url:e.tpUrl};
 if(fresh(p)&&Number.isFinite(p.usd))return {market:p.usd,low:p.usdLow,variant:p.enVariant,src:"TCGdex",updated:p.tpUpdated,url:""};
 return null;
}
/* Cardmarket: TCGdex (guía diaria) y pokemontcg.io («desde EX+», descartado si tiene más de 14 días). */
function cmOf(id){
 const p=fresh(cache.pk[id])?cache.pk[id]:null,e=fresh(cache.en[id])?cache.en[id].cm:null;
 const eOk=e&&(!e.updated||Date.now()-new Date(String(e.updated).replace(/\//g,"-")).getTime()<OLD_CM);
 return {low:p?p.low:eOk?e.low:NaN,exPlus:eOk?e.exPlus:NaN,avg30:p?p.avg30:eOk?e.avg30:NaN,trend:p?p.trend:eOk?e.trend:NaN,
  updated:p?p.cmUpdated:eOk?e.updated:"",exUpdated:eOk?e.updated:"",src:p?"TCGdex":eOk?"pokemontcg.io":""};
}
const inBudget=v=>Number.isFinite(v)&&v>=20&&v<=200;
/* Valoración de una carta Pokémon del catálogo. */
function evalPk(r,c){
 const id=r[0],cm=cmOf(id),en=enOf(id),rate=fx().rate,saved=langData[id]||{};
 const V=en?en.market*rate:NaN,ops=[];
 const add=o=>{o.margin=Number.isFinite(o.profit)&&o.cost>0?o.profit/o.cost:NaN;ops.push(o)};
 if(en&&Number.isFinite(en.low)&&Number.isFinite(V)){const buy=en.low*rate,cost=usLanded(buy,c);
  add({k:"en-us",cond:"buen",sure:true,label:"Inglés confirmado · TCGplayer (EE. UU.) → venta en inglés",where:"TCGplayer (EE. UU.)",lang:"Inglés",buy,cost,sale:V,profit:netSale(V,c)-cost})}
 if(Number.isFinite(cm.exPlus)&&Number.isFinite(V)){const cost=cm.exPlus+c.buyShip;
  add({k:"cm-ex",cond:"buen",sure:false,label:"Si es inglés · Cardmarket EX o mejor → venta en inglés",where:"Cardmarket (UE)",lang:"sin indicar",buy:cm.exPlus,cost,sale:V,profit:netSale(V,c)-cost,maxBuy:netSale(V,c)-c.minProfit-c.buyShip})}
 if(Number.isFinite(cm.low)&&Number.isFinite(V)&&!(cm.low>=cm.exPlus)){const sale=V*c.restMid,cost=cm.low+c.buyShip;
  add({k:"cm-po",cond:"mal",sure:false,label:"Restaurar · Cardmarket «desde» (casi siempre mal estado) → venta mejorada en inglés",where:"Cardmarket (UE)",lang:"sin indicar",buy:cm.low,cost,sale,profit:netSale(sale,c)-cost,maxBuy:netSale(sale,c)-c.minProfit-c.buyShip})}
 for(const [k,name] of LANGS){const v=saved[k];if(!v)continue;const buy=N(v.buy),sell=N(v.sell)||(k==="en"?V:NaN);if(!Number.isFinite(buy))continue;const cond=v.cond==="mal"?"mal":"buen";
  const sale=cond==="mal"&&!N(v.sell)?sell*c.restMid:sell,cost=buy+c.buyShip;
  add({k:"own-"+k,cond,sure:true,own:true,label:name+" confirmado · anotado por ti → venta en "+name.toLowerCase(),where:"Cardmarket (anotado)",lang:name,buy,cost,sale,profit:Number.isFinite(sale)?netSale(sale,c)-cost:NaN,at:v.at})}
 return {kind:"pk",id,r,name:r[1],set:r[2],number:r[3]+(r[4]?"/"+r[4]:""),rarity:r[5],cm,en,V,ops};
}
/* Lorcana (Lorcast): solo publica el precio de mercado de TCGplayer en inglés; no hay precio de compra en abierto.
   Se muestra el precio máximo de compra para ganar el mínimo y, si anotas una compra, el beneficio. */
function evalLo(x,c){
 const V=x.eur,saved=langData[x.id]||{},ops=[];
 for(const [k,name] of LANGS){const v=saved[k];if(!v)continue;const buy=N(v.buy),sale=N(v.sell)||(k==="en"?V:NaN);if(!Number.isFinite(buy))continue;const cost=buy+c.buyShip;const profit=Number.isFinite(sale)?netSale(sale,c)-cost:NaN;
  ops.push({k:"own-"+k,cond:v.cond==="mal"?"mal":"buen",sure:true,own:true,label:name+" confirmado · anotado por ti",where:"Cardmarket (anotado)",lang:name,buy,cost,sale,profit,margin:profit/cost,at:v.at})}
 return {kind:"lo",id:x.id,x,name:x.name,set:x.set,number:x.number,rarity:x.rarity,V,ops,maxBuy:netSale(V,c)-c.minProfit-c.buyShip};
}
function bestOp(ev,cond){const ok=ev.ops.filter(o=>(cond==="all"||o.cond===cond)&&Number.isFinite(o.profit)&&inBudget(o.buy));
 return ok.sort((a,b)=>b.profit-a.profit)[0]||null}
function liveList(){
 const c=cfg(),U=window.CV_UNIVERSE,isOwned=ownedKeys(),out=[];
 if(U&&lv.game!=="lorcana")for(const r of U.cards){if(isOwned(rowKey(r)))continue;if(!fresh(cache.pk[r[0]])&&!fresh(cache.en[r[0]]))continue;
  const ev=evalPk(r,c);if(!Number.isFinite(ev.V))continue;ev.best=bestOp(ev,lv.cond);
  if(lv.show==="profit"?ev.best&&ev.best.profit>=c.minProfit:!!ev.best)out.push(ev)}
 if(lv.game!=="pokemon")for(const x of Object.values(cache.lo)){if(!fresh(x)||!(x.eur>0))continue;const ev=evalLo(x,c);ev.best=bestOp(ev,lv.cond);
  if(ev.best?(lv.show!=="profit"||ev.best.profit>=c.minProfit):ev.maxBuy>=20&&lv.cond!=="mal")out.push(ev)}
 const buyOf=e=>e.best?e.best.buy:Infinity,pr=e=>e.best?e.best.profit:-Infinity;
 const S={profit:(a,b)=>pr(b)-pr(a)||b.V-a.V,buy:(a,b)=>buyOf(a)-buyOf(b),margin:(a,b)=>(b.best?b.best.margin:-1)-(a.best?a.best.margin:-1),sale:(a,b)=>b.V-a.V,name:(a,b)=>a.name.localeCompare(b.name,"es")};
 return out.sort(S[lv.sort]||S.profit);
}
function rowBuy(place,lang,cond,price,landed,note,link){
 return '<tr><td><b>'+place+'</b>'+(link?' <a href="'+E(link)+'" target="_blank" rel="noopener noreferrer">↗</a>':'')+'</td><td>'+lang+'</td><td>'+cond+'</td><td>'+EUR(price)+'</td><td>'+(Number.isFinite(landed)?'<b>'+EUR(landed)+'</b>':'—')+(note?'<small> '+note+'</small>':'')+'</td></tr>';
}
function langTable(id,c){
 const saved=langData[id]||{};
 return '<details class="v4more rdlangbox"><summary>Anotar precios por idioma (Cardmarket → Filtros → Idioma)</summary>'+
 '<p class="v4note">Cardmarket no publica en abierto los precios por idioma. Abre la ficha, filtra por idioma y anota el anuncio más barato y, si la conoces, la venta en ese idioma. Lo anotado manda y se guarda en este iPhone.</p>'+
 '<table class="v4scen rdlang"><tr><th>Idioma</th><th>Compra €</th><th>Venta €</th><th>Estado</th></tr>'+
 LANGS.map(([k,name])=>{const v=saved[k]||{};return '<tr><td>'+name+'</td><td><input inputmode="decimal" aria-label="Compra en '+name+'" data-rd-lbuy="'+E(id)+'|'+k+'" value="'+(N(v.buy)?String(v.buy).replace(".",","):"")+'" placeholder="€"></td>'+
  '<td><input inputmode="decimal" aria-label="Venta en '+name+'" data-rd-lsell="'+E(id)+'|'+k+'" value="'+(N(v.sell)?String(v.sell).replace(".",","):"")+'" placeholder="'+(k==="en"?"inglés auto":"€")+'"></td>'+
  '<td><select aria-label="Estado en '+name+'" data-rd-lcond="'+E(id)+'|'+k+'"><option value="buen"'+(v.cond!=="mal"?" selected":"")+'>Buen estado</option><option value="mal"'+(v.cond==="mal"?" selected":"")+'>Mal estado</option></select></td></tr>'}).join("")+'</table>'+
 '<button type="button" class="v4btn primary" data-rd-lsave="'+E(id)+'">Guardar precios por idioma</button></details>';
}
function opsTable(ev,c){
 if(!ev.ops.length)return '';
 return '<table class="v4scen rdops"><tr><th>Operación</th><th>Compra en 41020</th><th>Venta</th><th>Beneficio</th></tr>'+
  ev.ops.slice().sort((a,b)=>(N(b.profit)||-1e9)-(N(a.profit)||-1e9)).map(o=>'<tr'+(o===ev.best?' class="rdbest"':'')+'><td>'+E(o.label)+(Number.isFinite(o.maxBuy)?'<small> · precio máximo en inglés para ganar '+EUR(c.minProfit)+': <b>'+EUR(o.maxBuy)+'</b></small>':'')+(inBudget(o.buy)?'':'<small> · compra fuera de 20–200 €</small>')+'</td><td>'+EUR(o.cost)+'</td><td>'+EUR(o.sale)+'</td><td><b class="'+(o.profit>=c.minProfit?'rdpos':'rdneg')+'">'+SIGNED(o.profit)+'</b></td></tr>').join("")+'</table>';
}
function badge(ev,c){const b=ev.best;
 if(!b)return ev.kind==="lo"?['s-observacion','PRECIO DE COMPRA NO PUBLICADO · COMPRA SI ≤ '+EUR(ev.maxBuy)+' EN INGLÉS']:['s-observacion','SIN OPERACIÓN EN 20–200 €'];
 if(b.profit<c.minProfit)return ['s-observacion','MARGEN INSUFICIENTE · '+SIGNED(b.profit)];
 return b.sure?['s-comprobada','RENTABLE · '+b.lang.toUpperCase()+' CONFIRMADO']:['s-observacion','RENTABLE SI ES INGLÉS · COMPRUEBA EL IDIOMA'];
}
function liveCardPk(ev,rank,c){
 const {r,cm,en,V}=ev,id=ev.id,links=pkLinks(r,cache.pk[id]),rate=fx().rate,b=ev.best,[bc,bt]=badge(ev,c);
 const enLow=en&&Number.isFinite(en.low)?en.low*rate:NaN;
 return '<article class="v4card s-observacion rdlive" id="live-'+E(id)+'" data-game="pokemon">'+
 '<figure class="v4photo">'+imgTag(r,cache.pk[id],r[1])+'<div class="v4noimg" hidden><b>'+E(r[1])+'</b><span>Foto no disponible · '+E(r[2])+' nº '+E(r[3])+'</span></div><figcaption>Imagen de catálogo · el ejemplar se ve en el anuncio</figcaption></figure>'+
 '<div class="v4body"><div class="v4badges"><span class="v4tag rank">#'+rank+'</span><span class="v4status '+bc+'">'+E(bt)+'</span><span class="v4tag">Pokémon</span></div>'+
 '<h3>'+E(r[1])+'</h3><p class="v4id">'+E(r[2])+' · nº '+E(ev.number)+' · '+E(r[5]||"—")+'</p>'+
 '<div class="v4money">'+
  '<div><span>MEJOR COMPRA'+(b?' · '+E(b.where):'')+'</span><b>'+EUR(b?b.buy:NaN)+'</b><small>'+(b?'idioma: '+E(b.lang)+' · puesta en 41020 Sevilla '+EUR(b.cost):'—')+'</small></div>'+
  '<div><span>VENTA EN INGLÉS · VENTAS REALES</span><b>'+EUR(V)+'</b><small>TCGplayer precio de mercado '+E(en.market.toLocaleString("es-ES",{style:"currency",currency:"USD"}))+' · '+E(en.variant)+' · vía '+E(en.src)+(en.updated?' · '+E(DAY(String(en.updated).replace(/\//g,"-"))):'')+'</small></div>'+
  '<div class="v4profit '+(b&&b.profit>=c.minProfit?'t-good':'t-muted')+'"><span>BENEFICIO · MISMO IDIOMA</span><b>'+(b?SIGNED(b.profit):'—')+'</b><small>'+(b?E(b.label)+(Number.isFinite(b.margin)?' · margen '+Math.round(b.margin*100)+' %':''):'')+'</small></div>'+
 '</div>'+
 '<table class="v4scen rdbuy"><tr><th>Dónde comprar</th><th>Idioma</th><th>Estado</th><th>Precio</th><th>Puesta en 41020</th></tr>'+
  rowBuy("Cardmarket (UE)","sin indicar","cualquiera",cm.low,Number.isFinite(cm.low)?cm.low+c.buyShip:NaN,"",links.cardmarket)+
  rowBuy("Cardmarket (UE)","sin indicar","EX o mejor",cm.exPlus,Number.isFinite(cm.exPlus)?cm.exPlus+c.buyShip:NaN,"",links.cardmarket)+
  rowBuy("TCGplayer (EE. UU.)","inglés","sin indicar",enLow,Number.isFinite(enLow)?usLanded(enLow,c):NaN,"envío, IVA y gestión",en.url||links.tcgplayer)+
 '</table>'+
 '<p class="v4note">Venta en todos los idiomas (Cardmarket, media 30 días): '+EUR(cm.avg30)+' · tendencia '+EUR(cm.trend)+'. Cardmarket no dice en qué idioma está su «desde»: ábrelo, filtra por <b>Inglés</b> y compra solo si está por debajo del precio máximo indicado.</p>'+
 opsTable(ev,c)+langTable(id,c)+
 '<p class="v4basis">Envío UE → 41020: '+EUR(c.buyShip)+' · EE. UU. → 41020: '+EUR(c.usShip??15)+' + IVA '+(c.usVat??21)+' % + gestión '+EUR(c.usHandling??5)+' · venta con '+String(c.feePct).replace(".",",")+' % de comisión y '+EUR(c.sellShip)+' de envío (editables en «Supuestos del cálculo»). Cardmarket: '+E(cm.src||"—")+' '+E(cm.updated?DAY(String(cm.updated).replace(/\//g,"-")):"")+'. Pocos vendedores de TCGplayer envían a España.</p>'+
 '<div class="v4actions"><a class="v4btn primary" href="'+E(links.cardmarket)+'" target="_blank" rel="noopener noreferrer">Abrir en Cardmarket ↗</a>'+
 (en.url||links.tcgplayer?'<a class="v4btn" href="'+E(en.url||links.tcgplayer)+'" target="_blank" rel="noopener noreferrer">TCGplayer (inglés) ↗</a>':'')+
 '<button type="button" class="v4btn" data-rd-promote="'+E(id)+'|'+(b&&b.cond==="mal"?"restaurar":"compra")+'">Registrar este anuncio</button></div></div></article>';
}
function liveCardLo(ev,rank,c){
 const {x,V}=ev,b=ev.best,[bc,bt]=badge(ev,c),q=encodeURIComponent(x.name.split(" – ")[0]);
 return '<article class="v4card s-observacion rdlive" id="live-'+E(ev.id)+'" data-game="lorcana">'+
 '<figure class="v4photo">'+(x.image?'<img src="'+E(x.image)+'" alt="'+E(x.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>':'')+'<div class="v4noimg"'+(x.image?' hidden':'')+'><b>'+E(x.name)+'</b><span>Foto no disponible</span></div><figcaption>Imagen de catálogo (Lorcast)</figcaption></figure>'+
 '<div class="v4body"><div class="v4badges"><span class="v4tag rank">#'+rank+'</span><span class="v4status '+bc+'">'+E(bt)+'</span><span class="v4tag">Lorcana</span></div>'+
 '<h3>'+E(x.name)+'</h3><p class="v4id">'+E(x.set)+' · nº '+E(x.number)+' · '+E(x.rarity)+'</p>'+
 '<div class="v4money">'+
  '<div><span>'+(b?'COMPRA ANOTADA · '+E(b.lang):'PRECIO MÁXIMO DE COMPRA EN INGLÉS')+'</span><b>'+EUR(b?b.buy:ev.maxBuy)+'</b><small>'+(b?'puesta en 41020 Sevilla '+EUR(b.cost):'para ganar '+EUR(c.minProfit)+' tras comisión y envíos a/desde 41020')+'</small></div>'+
  '<div><span>VENTA EN INGLÉS · VENTAS REALES</span><b>'+EUR(V)+'</b><small>TCGplayer precio de mercado '+E(x.usd.toLocaleString("es-ES",{style:"currency",currency:"USD"}))+(x.foil?' · foil':'')+' · vía Lorcast</small></div>'+
  '<div class="v4profit '+(b&&b.profit>=c.minProfit?'t-good':'t-muted')+'"><span>BENEFICIO · MISMO IDIOMA</span><b>'+(b?SIGNED(b.profit):'—')+'</b><small>'+(b?E(b.label):'Lorcast no publica anuncios: busca en Cardmarket en inglés y anota el precio')+'</small></div>'+
 '</div>'+opsTable(ev,c)+langTable(ev.id,c)+
 '<div class="v4actions"><a class="v4btn primary" href="https://www.cardmarket.com/es/Lorcana/Products/Search?searchString='+q+'" target="_blank" rel="noopener noreferrer">Buscar en Cardmarket ↗</a>'+(x.tcgplayer?'<a class="v4btn" href="'+E(x.tcgplayer)+'" target="_blank" rel="noopener noreferrer">TCGplayer (inglés) ↗</a>':'')+'</div></div></article>';
}
function sourcesBox(){
 const s=cache.src,b=budget(),pk=Object.values(cache.pk).filter(fresh).length,en=Object.values(cache.en).filter(e=>fresh(e)&&e.tp).length,tdEn=Object.values(cache.pk).filter(p=>fresh(p)&&Number.isFinite(p.usd)).length,lo=Object.values(cache.lo).filter(fresh).length;
 const line=(n,o)=>'<li><b>'+n+'</b> · '+o.ok+' correctas, '+o.fail+' fallidas'+(o.last?' · última '+WHEN(o.last):'')+(o.lastErr?' · <span class="rdneg">'+E(o.lastErr)+'</span>':'')+'</li>';
 return '<details class="v4settings rdsrc"><summary>Estado de las fuentes</summary><ul class="v4help">'+
  line("TCGdex (Cardmarket)",s.tcgdex)+line("pokemontcg.io (inglés TCGplayer y Cardmarket EX+) · "+b.n+"/"+PT_DAILY+" peticiones hoy",s.ptcg)+line("Lorcast (Lorcana)",s.lorcast)+
  '</ul><p class="v4note">Últimas 24 h en este iPhone: '+pk.toLocaleString("es-ES")+' cartas con Cardmarket · '+(en+tdEn).toLocaleString("es-ES")+' con venta en inglés ('+en+' de pokemontcg.io, '+tdEn+' de TCGdex) · '+lo+' de Lorcana. TCGdex pierde a menudo el dato en inglés desde el 15/10/2026 (incidencia pública #2479).</p></details>';
}
function renderLive(){
 if(typeof document.querySelector!=="function")return;
 langData=readLang();
 const slot=document.querySelector('[data-rd-live="compra"]');if(!slot)return;
 const U=window.CV_UNIVERSE,c=cfg(),list=liveList(),groups=U?Object.entries(U.meta.groups):[];
 const sel=(k,opts)=>'<select data-rd-lv="'+k+'" aria-label="'+k+'">'+opts.map(([v,t])=>'<option value="'+v+'"'+(lv[k]===v?' selected':'')+'>'+t+'</option>').join("")+'</select>';
 const ctl=running?'<div class="rdprog"><b>'+E(running.label)+'</b><progress max="'+running.total+'" value="'+running.done+'"></progress><span>'+running.done+' / '+running.total+(running.ptTotal?' · inglés '+(running.ptDone||0)+'/'+running.ptTotal+' colecciones':'')+' · '+running.fail+' fallos</span><button type="button" class="v4btn" data-rd-stop>Detener</button></div>':
  '<div class="rdscan"><label>Familia de cartas<select data-rd-group>'+groups.map(([k,g])=>'<option value="'+k+'">'+E(g.label)+' ('+g.count+')</option>').join("")+'<option value="all">Todas ('+(U?U.cards.length:"…")+')</option></select></label><button type="button" class="v4btn primary" data-rd-scan>Buscar ofertas</button><button type="button" class="v4btn" data-rd-lorcana>Buscar Lorcana</button></div>';
 const nPk=list.filter(e=>e.kind==="pk").length,nLo=list.length-nPk;
 slot.innerHTML='<section class="rdlivebox"><h3>Ofertas en directo · compra y venta en el mismo idioma</h3>'+
  '<p class="v4note">'+nPk+' Pokémon y '+nLo+' Lorcana. Beneficio tras comisión y envíos con compra puesta en <b>41020 Sevilla</b>. Solo se calcula con venta en el mismo idioma que la compra.</p>'+ctl+
  '<div class="rdctl"><label>Juego'+sel("game",[["all","Todas"],["pokemon","Pokémon"],["lorcana","Lorcana"]])+'</label>'+
  '<label>Estado'+sel("cond",[["all","Todos"],["buen","Buen estado"],["mal","Mal estado · restaurar"]])+'</label>'+
  '<label>Mostrar'+sel("show",[["profit","Solo rentables (≥ "+EUR(c.minProfit)+")"],["all","Todas con precio"]])+'</label>'+
  '<label>Ordenar'+sel("sort",[["profit","Mayor beneficio"],["buy","Menor precio de compra"],["margin","Mayor margen %"],["sale","Mayor precio de venta"],["name","Nombre A–Z"]])+'</label></div>'+
  sourcesBox()+
  (list.length?'<div class="v4list">'+list.slice(0,20).map((e,i)=>e.kind==="pk"?liveCardPk(e,i+1,c):liveCardLo(e,i+1,c)).join("")+'</div>'+(list.length>20?'<details class="v4old"><summary>Ver más ('+(list.length-20)+')</summary><div class="v4list">'+list.slice(20,120).map((e,i)=>e.kind==="pk"?liveCardPk(e,i+21,c):liveCardLo(e,i+21,c)).join("")+'</div></details>':''):
   '<p class="v4empty">'+(Object.values(cache.pk).some(fresh)||Object.values(cache.lo).some(fresh)?'Ninguna carta cumple estos filtros. Cambia «Mostrar» a «Todas con precio», otro estado u otra familia.':'Pulsa «Buscar ofertas» con conexión (1–3 min por familia).')+'</p>')+'</section>';
 wireImgs(slot);
}
function saveLang(id){
 const box=document.getElementById("live-"+id);if(!box)return;const cur={};let bad=[];
 for(const [k,name] of LANGS){const bi=box.querySelector('[data-rd-lbuy="'+id+'|'+k+'"]'),si=box.querySelector('[data-rd-lsell="'+id+'|'+k+'"]'),ci=box.querySelector('[data-rd-lcond="'+id+'|'+k+'"]');if(!bi||!si)continue;
  const b=NUM(bi.value),s=NUM(si.value);if((bi.value.trim()&&!Number.isFinite(b))||(si.value.trim()&&!Number.isFinite(s))){bad.push(name);continue}
  if(Number.isFinite(b)||Number.isFinite(s))cur[k]={buy:Number.isFinite(b)?b:undefined,sell:Number.isFinite(s)?s:undefined,cond:ci?.value==="mal"?"mal":"buen",at:new Date().toISOString()}}
 if(bad.length){alert("Importe no válido en: "+bad.join(", ")+". Usa números como 150 o 149,90.");return}
 const prev=langData[id];if(Object.keys(cur).length)langData[id]=cur;else delete langData[id];
 if(!writeLang()){if(prev)langData[id]=prev;else delete langData[id];alert("NO se han guardado los precios: el almacenamiento del navegador no lo permite.");return}
 renderLive();document.getElementById("live-"+id)?.scrollIntoView({block:"nearest"});
}
function promote(id,lane){
 const U=window.CV_UNIVERSE,row=U?.cards.find(r=>r[0]===id);if(!row)return;
 const c=cfg(),ev=evalPk(row,c),p=cache.pk[id],links=pkLinks(row,p),cm=ev.cm,d=cm.updated||new Date().toISOString(),b=bestOp(ev,"all");
 const sales=[];
 if(Number.isFinite(cm.avg30))sales.push({kind:"agregado",price:cm.avg30,currency:"EUR",date:d,condition:"todas",language:"todos",platform:"Cardmarket · media 30 días (todos los idiomas)",url:links.cardmarket,note:"Agregado de todas las ventas; no es una venta individual."});
 if(Number.isFinite(cm.low))sales.push({kind:"anuncio",price:cm.low,currency:"EUR",date:d,condition:"desconocido",language:"desconocido",platform:"Cardmarket · «desde» (idioma sin indicar)",url:links.cardmarket,note:"Precio pedido. NO es una venta."});
 if(Number.isFinite(ev.V))sales.push({kind:"agregado",price:Math.round(ev.V*100)/100,currency:"EUR",date:String(ev.en.updated||d).replace(/\//g,"-"),condition:"todas",language:"Inglés",platform:"TCGplayer · precio de mercado EE. UU. (vía "+ev.en.src+")",url:ev.en.url||links.tcgplayer,note:"Calculado con ventas reales de ejemplares en inglés; agregado, no venta individual. "+ev.en.market+" USD."});
 for(const o of ev.ops)if(o.own)sales.push({kind:"anuncio",price:o.buy,currency:"EUR",date:o.at||new Date().toISOString(),condition:o.cond==="mal"?"mal estado":"buen estado",language:o.lang,platform:"Cardmarket · anotado por ti (filtro de idioma)",url:links.cardmarket,note:"Precio pedido. NO es una venta."});
 window.CVVault?.addCustom?.({lane:lane||(b&&b.cond==="mal"?"restaurar":"compra"),game:"pokemon",name:row[1],set:row[2],number:row[3]+(row[4]?"/"+row[4]:""),rarity:row[5],language:b&&b.sure?b.lang:"",image:pkImages(row,p)[0],imageAlt:pkImages(row,p)[1]||"",links,
  why:b?"Detectada en directo: "+b.label+" · compra "+EUR(b.buy)+" ("+b.where+"), puesta en 41020 "+EUR(b.cost)+", venta "+EUR(b.sale)+" → "+SIGNED(b.profit)+(b.sure?"":". Comprueba que el anuncio está en inglés."):"Detectada en directo. Falta comprobar el ejemplar.",sales,source:"Compra YA en directo V115"});
}
document.addEventListener("change",e=>{const t=e.target.closest("[data-rd-lv]");if(!t)return;lv[t.dataset.rdLv]=t.value;writeView();renderLive();
 if(t.dataset.rdLv==="cond")window.CVVault?.setCondView?.(t.value)});
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
function autoLive(){loadUniverse().then(async()=>{render();if(running||autoDone||navigator.onLine===false)return;autoDone=true;
 const U=window.CV_UNIVERSE,vin=U.cards.filter(r=>r[7]==="vintage"),setOf=r=>{const id=ptcgId(r[0]);return id.slice(0,id.lastIndexOf("-"))};
 const needPk=!vin.some(r=>fresh(cache.pk[r[0]]))||vin.some(r=>hasPtcg(r[0])&&!(cache.ptSets[setOf(r)]&&Date.now()-cache.ptSets[setOf(r)]<TTL));
 try{if(needPk)await scanPokemon("vintage")}catch{running=null;render()}
 try{if(!running&&!Object.values(cache.lo).some(fresh))await scanLorcana()}catch{running=null;render()}},()=>render())}
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="radar"]'))setTimeout(autoLive,60)});
window.addEventListener("hashchange",()=>{if(location.hash==="#investigacion")loadUniverse().then(render,()=>render())});
window.CVRadar={counts:()=>({catalog:window.CV_UNIVERSE?.cards.length||cache.universeCount||NaN,consulted:Object.values(cache.pk).filter(p=>Date.now()-p.t<TTL).length+Object.values(cache.lo).filter(x=>Date.now()-x.t<TTL).length}),evaluatePk,parseTcgdex,evaluateLo,ptcgId,render,results,renderLive,autoLive,pkImages,pkLinks,pickEN,parsePtcg,parsePtcgCard,usLanded,evalPk,evalLo,bestOp,liveList,scanPtcg,
 setView:v=>{lv={...lv,...v};writeView()},reloadLang:()=>{langData=readLang()},cache:()=>cache};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(mount,400));else setTimeout(mount,400);
})();
