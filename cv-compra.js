/* Card Vault V116 · Compra YA: comprar y vender en Cardmarket desde 41020 Sevilla.
   Fuentes (todas públicas, gratuitas y legibles desde Safari):
   - Guía de precios OFICIAL de Cardmarket (diaria), vía el espejo público ZyzyThePizi/pokemon-price-data en GitHub:
     low (anuncio más barato, cualquier estado e idioma), trend, avg1/avg7/avg30 (ventas reales; todos los idiomas).
   - vault-cm-map.js: carta del catálogo → producto de Cardmarket, con avisos de calidad (colisión, nombre, versión arriesgada).
   - pokemontcg.io (por colección): segunda fuente de Cardmarket enlazada a SU producto → verifica la versión y aporta el
     «desde» en EX o mejor. Hasta el 1/3/2027; ≤ 900 peticiones/día propias.
   - Lorcana: Bindex (Cardmarket en EUR emparejado por nombre y precio), si responde.
   Nada de EE. UU.: compra y venta en Cardmarket, envío a/desde 41020. Las cifras de Cardmarket mezclan idiomas y estados:
   se dice siempre así, el beneficio es una estimación y nunca un beneficio seguro. */
(()=>{"use strict";
const ZZ="https://raw.githubusercontent.com/ZyzyThePizi/pokemon-price-data/main/",PT="https://api.pokemontcg.io/v2",BX="https://douxeh.github.io/bindex-prices/v1/lorcana/",BXB="https://douxeh.github.io/bindex-prices/v1/";
/* V144 · Juegos con la MISMA calidad que Pokémon: precio y VENTAS reales de la guía oficial de Cardmarket (medias de venta
   de 1, 7 y 30 días), emparejados por Bindex. Magic carga las colecciones de más valor y las más recientes (son ~105.000
   cartas); de Magic y One Piece solo se guardan las que valen ≥ 15 € (las de menos no pueden dejar beneficio). */
const BXG={lorcana:{name:"Lorcana",cm:"Lorcana",ct:/lorcana/i,yt:"lorcana",langs:["en","de","fr","it","ja","zh"],sets:999,min:0},
 mtg:{name:"Magic",cm:"Magic",ct:/magic/i,yt:"magic the gathering",langs:["en","de","fr","it","es","pt","ja","ko","zh"],sets:40,min:15},
 onepiece:{name:"One Piece",cm:"OnePiece",ct:/one ?piece/i,yt:"one piece card game",langs:["en","ja","fr","zh","ko"],sets:80,min:15},
 gundam:{name:"Gundam",cm:"Gundam",ct:/gundam/i,yt:"gundam card game",langs:["en","ja"],sets:40,min:15},
 riftbound:{name:"Riftbound",cm:"Riftbound",ct:/riftbound/i,yt:"riftbound tcg",langs:["en","fr","de","it","es","zh"],sets:40,min:15}};
const isBx=g=>Object.prototype.hasOwnProperty.call(BXG,g),gOf=x=>x&&x.kind==="lo"?(x.game||"lorcana"):"pokemon",cmGame=x=>x.kind==="lo"?BXG[gOf(x)].cm:"Pokemon";
const KEY="cv_v116_market",WKEY="cv_v116_watch",VKEY="cv_v116_view",LKEY="cv_v113_lang",BUDGET_KEY="cv_v115_ptcg_budget",PT_DAILY=900;
const DAY=24*3600e3,GUIDE_TTL=6*3600e3,PT_TTL=DAY,LO_TTL=DAY;
const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:NaN};
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>Number.isFinite(v)?v.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—";
const SIGNED=v=>Number.isFinite(v)?(v>=0?"+":"−")+EUR(Math.abs(v)):"—";
const PCT=v=>Number.isFinite(v)?(v>=0?"+":"−")+Math.abs(Math.round(v*100))+" %":"—";
const DATE=t=>{const d=new Date(String(t||"").replace(/\//g,"-"));return Number.isFinite(d.getTime())?d.toLocaleDateString("es-ES"):"sin fecha"};
const WHEN=t=>{const d=new Date(t);return Number.isFinite(d.getTime())?d.toLocaleString("es-ES",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"—"};
const NUM=v=>{const t=String(v??"").trim().replace(/\s|€/g,"");if(!t)return NaN;const x=Number(t.includes(",")?t.replace(/\./g,"").replace(",","."):t);return Number.isFinite(x)&&x>0?x:NaN};
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
/* V137 · Registro de errores en ESTE iPhone (los 20 últimos): si algo falla en tu móvil queda apuntado y «Copiar
   diagnóstico» lo copia (versión, estado de las fuentes y errores; nunca el token) para enviárselo a quien lo arregle. */
const ERRKEY="cv_v137_errors";
function logErr(msg,where){try{const L=JSON.parse(localStorage.getItem(ERRKEY)||"[]");L.unshift({at:new Date().toISOString(),v:document.body?.dataset?.release||"",msg:String(msg||"").slice(0,200),where:String(where||"").slice(0,120)});localStorage.setItem(ERRKEY,JSON.stringify(L.slice(0,20)))}catch{}}
addEventListener("error",e=>logErr(e.message,(e.filename||"").split("/").pop()+":"+(e.lineno||"")));
addEventListener("unhandledrejection",e=>logErr(e.reason?.message||e.reason,"promesa"));
const cfg=()=>({maxBuy:200,minMargin:25,minProfitLo:40,feePct:5,sellShip:5,buyShip:6,minProfit:40,restLow:.6,restMid:.75,restHigh:.9,...(window.CVVault?.user?.().cfg||{})});
/* V130 · Escudo anti-proxy (caso real: Mewtwo & Mew GX japonés a 50 € frente a ~638 € → el anuncio decía «proxy», carta
   falsa). 1) Un anuncio por debajo del 30 % de lo que la carta vale y se vende casi nunca es una ganga: es proxy,
   falsificación, otra carta o un error, y no se propone nunca (ni chollo, ni punto de mira, ni restaurar, ni Top 5).
   2) Detector de palabras de proxy en lo que pegues de un anuncio. */
const FAKE_RATIO=.3;
/* V131 · Mismo idioma (caso real: Umbreon a 135 € que era COREANO, comparado con ventas de todos los idiomas). En los
   productos internacionales de Cardmarket el «desde» y el «desde EX o mejor» son de CUALQUIER idioma (también coreano y
   chino, mucho más baratos), y la venta de referencia es de todos los idiomas. Un anuncio por debajo del 75 % del valor
   casi siempre es otro idioma, así que NO se calcula beneficio con él: compra y venta tienen que ser del mismo idioma.
   Idioma comprobado: productos japoneses (todo japonés), TCGplayer (inglés) y lo que pegues filtrado por idioma. */
const LANG_OK=.75;
const FAKE_RE=/\b(prox(y|ies|ys)|r[ée]plicas?|fakes?|custom|fan[\s-]?(made|art)|orica|no\s+(es\s+)?original|not\s+(an?\s+)?original|non[\s-]+(officiel|original[e]?|ufficiale)|unofficial|no\s+oficial|inoffiziell|f[äa]lschung|contrefa[çc]on|falsa|falso|imitaci[óo]n|reproducci[óo]n|repro|copia|kopie|playtest)\b|プロキシ|レプリカ|コピー/i;
const fakeWords=t=>{const out=new Set();const g=new RegExp(FAKE_RE.source,"gi");let m;while((m=g.exec(String(t||""))))out.add(m[0].toLowerCase());return [...out]};
const readLS=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k)||"null");return x&&typeof x==="object"?x:d}catch{return d}};
const writeLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};

/* ---------- almacenamiento: IndexedDB (no compite con tus datos en localStorage) ---------- */
let idbP=null;
function idb(){if(idbP)return idbP;idbP=new Promise((ok,ko)=>{try{if(typeof indexedDB==="undefined")return ko(new Error("sin IndexedDB"));const r=indexedDB.open("cardvault-cache",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)}catch(e){ko(e)}});return idbP}
const idbGet=k=>idb().then(db=>new Promise((ok,ko)=>{const q=db.transaction("kv","readonly").objectStore("kv").get(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>ko(q.error)}));
const idbSet=(k,v)=>idb().then(db=>new Promise((ok,ko)=>{const t=db.transaction("kv","readwrite");t.objectStore("kv").put(v,k);t.oncomplete=()=>ok(true);t.onerror=()=>ko(t.error);t.onabort=()=>ko(t.error)}));
const SRC0=()=>({guide:{ok:0,fail:0},ptcg:{req:0,ok:0,fail:0},bindex:{ok:0,fail:0}});
let M={guide:null,pt:{sets:{},cards:{}},lo:null,src:SRC0()};
const ready=(async()=>{try{const x=await idbGet(KEY);if(x)M={...M,...x,src:{...SRC0(),...(x.src||{})}}}catch{}})();
let wT=null;function persist(){clearTimeout(wT);wT=setTimeout(()=>{idbSet(KEY,M).catch(()=>{})},500)}

/* ---------- red ---------- */
async function getJSON(url,signal,timeout=15000,tries=2){
 for(let k=0;k<tries;k++){
  const t=new AbortController(),stop=()=>t.abort();signal?.addEventListener("abort",stop,{once:true});const timer=setTimeout(()=>t.abort(),timeout);
  try{const r=await fetch(url,{signal:t.signal,cache:"no-store"});
   if(r.ok){try{return await r.json()}catch{throw new Error("Respuesta no válida (JSON)")}}
   if(!(r.status===429||r.status>=500)||k===tries-1)throw new Error("HTTP "+r.status);
  }catch(e){if(signal?.aborted)throw e;if(k===tries-1)throw new Error(t.signal.aborted?"Tiempo agotado":(e.message||"Error de red"))}
  finally{clearTimeout(timer);signal?.removeEventListener("abort",stop)}
  await sleep(1500*(k+1));
 }
}
function loadScript(src,ok){return new Promise((res,rej)=>{if(ok())return res();const s=document.createElement("script");s.src=src;s.onload=()=>res();s.onerror=()=>rej(new Error("No se pudo cargar "+src));document.head.appendChild(s)})}
const loadCatalog=()=>Promise.all([loadScript("vault-universe.js?v=1.0",()=>!!window.CV_UNIVERSE),loadScript("vault-cm-map.js?v=1.0",()=>!!window.CV_CM_MAP),loadScript("vault-jp-map.js?v=2.0",()=>!!window.CV_JP_MAP).catch(()=>{}),loadScript("vault-sealed-map.js?v=1.0",()=>!!window.CV_SEALED_MAP).catch(()=>{})]);

/* ---------- guía oficial de Cardmarket (espejo diario) ---------- */
const GF=["low","trend","avg1","avg7","avg30","lowHolo","trendHolo","avg30Holo"];
function neededIds(){const s=new Set();for(const v of Object.values(window.CV_CM_MAP||{})){s.add(v[0]);for(let i=2;i<v.length;i++)s.add(v[i])}for(const r of (window.CV_JP_MAP?.cards||[]))s.add(r[0]);for(const r of (window.CV_SEALED_MAP?.items||[]))s.add(r[0]);return s}
/* GUIDE_V sube cuando cambia el conjunto de productos guardados (V118: + productos japoneses) */
const GUIDE_V=4;
function parseGuide(j,need){
 const f=j?.fields,rows=j?.rows;if(!Array.isArray(f)||!Array.isArray(rows))throw new Error("Guía con formato inesperado");
 const ix=GF.map(k=>f.indexOf(k)),id=f.indexOf("idProduct");if(id<0||ix[1]<0)throw new Error("Guía sin idProduct/trend");
 const out={};for(const r of rows){const p=r[id];if(need&&!need.has(p))continue;out[p]=ix.map(i=>i<0?null:r[i])}
 return {rows:out,sourceCreatedAt:j.sourceCreatedAt||"",generatedAt:j.generatedAt||"",fetchedAt:Date.now(),count:Object.keys(out).length};
}
async function loadGuide(force){
 if(!force&&M.guide&&M.guide.v===GUIDE_V&&Date.now()-M.guide.fetchedAt<GUIDE_TTL)return;
 try{const j=await getJSON(ZZ+"prices/latest.json",null,60000);M.guide={...parseGuide(j,neededIds()),v:window.CV_JP_MAP&&window.CV_SEALED_MAP?GUIDE_V:1};M.src.guide.ok++;M.src.guide.last=Date.now();M.src.guide.lastErr="";persist()}
 catch(e){M.src.guide.fail++;M.src.guide.lastErr=String(e.message||e).slice(0,80);persist();throw e}
}
/* ---------- bajadas desde el día anterior (fotos diarias de la guía en el espejo, se guardan 14 días) ----------
   Se compara el «desde» de hoy con el de la foto anterior disponible: lo que acaba de bajar es lo que hay que mirar primero. */
async function loadPrev(){
 const g=M.guide;if(!g?.sourceCreatedAt||M.prev?.of===g.sourceCreatedAt&&M.prev.v===GUIDE_V)return;
 const d0=new Date(String(g.sourceCreatedAt).slice(0,10)+"T12:00:00Z");if(!Number.isFinite(d0.getTime()))return;
 const need=neededIds(),f2=n=>String(n).padStart(2,"0");
 for(let i=1;i<=4;i++){const d=new Date(d0.getTime()-i*DAY),path="prices/"+d.getUTCFullYear()+"/"+f2(d.getUTCMonth()+1)+"/"+f2(d.getUTCDate())+".json";
  try{const j=await getJSON(ZZ+path,null,60000,1),pg=parseGuide(j,need);M.prev={of:g.sourceCreatedAt,v:GUIDE_V,date:pg.sourceCreatedAt||d.toISOString(),rows:pg.rows};persist();return}catch{}}
 M.prev={of:g.sourceCreatedAt,v:GUIDE_V,date:"",rows:{}};persist();
}
/* Foto de hace ~14 días (el espejo guarda 14): tendencia a dos semanas para el sellado. Se descarga solo al abrir Sellado. */
async function loadOld(){
 const g=M.guide;if(!g?.sourceCreatedAt||M.old?.of===g.sourceCreatedAt)return;
 const d0=new Date(String(g.sourceCreatedAt).slice(0,10)+"T12:00:00Z"),need=new Set((window.CV_SEALED_MAP?.items||[]).map(r=>r[0])),f2=n=>String(n).padStart(2,"0");
 for(const i of [13,12,11,10,9,8,7]){const d=new Date(d0.getTime()-i*DAY),path="prices/"+d.getUTCFullYear()+"/"+f2(d.getUTCMonth()+1)+"/"+f2(d.getUTCDate())+".json";
  try{const j=await getJSON(ZZ+path,null,60000,1),pg=parseGuide(j,need);M.old={of:g.sourceCreatedAt,date:pg.sourceCreatedAt||d.toISOString(),days:i,rows:pg.rows};persist();return}catch{}}
 M.old={of:g.sourceCreatedAt,date:"",days:0,rows:{}};persist();
}
function delta(pid){const a=G(pid),r=M.prev?.rows?.[pid];if(!a||!r)return null;const lo0=N(r[0]);if(!Number.isFinite(lo0)||!Number.isFinite(a.low))return null;return {lo0,lo:a.low,drop:1-a.low/lo0}}
const G=pid=>{const r=M.guide?.rows?.[pid];if(!r)return null;const o={};GF.forEach((k,i)=>o[k]=N(r[i]));return o};

/* ---------- pokemontcg.io: verificación de versión y «desde» EX+ ---------- */
const PTM=()=>window.CV_PTCG||{sets:{},id:{},none:[]};
function ptcgId(t){const P=PTM();if(P.id?.[t])return P.id[t];const i=t.lastIndexOf("-"),set=t.slice(0,i),num=t.slice(i+1).replace(/^([A-Za-z]*)0+(?=\d)/,"$1");return (P.sets?.[set]||set)+"-"+num}
const hasPtcg=t=>!PTM().none?.includes(t);
const ptSetOf=t=>{const id=ptcgId(t);return id.slice(0,id.lastIndexOf("-"))};
function budget(){const d=new Date().toISOString().slice(0,10);let b=readLS(BUDGET_KEY,{});if(b.day!==d)b={day:d,n:0};return b}
function spend(){const b=budget();b.n++;writeLS(BUDGET_KEY,b)}
/* TCGplayer (EE. UU.) vía pokemontcg.io: precio de mercado (media de ventas recientes) y más barato, en dólares, y el enlace
   directo a la carta en TCGplayer. Variante: la holo si existe, si no la normal, si no la primera con precio. */
function parseTcg(tp){const pr=tp?.prices||{},k=["holofoil","normal","1stEditionHolofoil","unlimitedHolofoil","reverseHolofoil","1stEditionNormal","unlimited"].find(v=>pr[v]&&(N(pr[v].market)||N(pr[v].low)))||Object.keys(pr).find(v=>N(pr[v]?.market));
 if(!k||!tp?.url)return null;return {url:tp.url,variant:k,market:N(pr[k].market),low:N(pr[k].low),updated:tp.updatedAt||""}}
function parsePtCard(c){const cm=c?.cardmarket?.prices||{};return {t:Date.now(),tcg:parseTcg(c?.tcgplayer),trend:N(cm.trendPrice),avg30:N(cm.avg30),low:N(cm.lowPrice),exPlus:N(cm.lowPriceExPlus),avg7:N(cm.avg7),avg1:N(cm.avg1),updated:c?.cardmarket?.updatedAt||""}}
let ptRunning=null;/* progreso de la verificación en bloque */
/* V137 · Primero las cartas que importan. Antes se comprobaba colección a colección (cientos, con 2 s de pausa obligada
   entre llamadas): las internacionales tardaban minutos en tener su «EX o mejor» y Compra YA salía casi solo japonesa.
   pokemontcg.io admite pedir cartas concretas (id:"a" OR id:"b"…): se piden antes, de 60 en 60, las 300 que pueden ser
   oportunidad (valen ≥ 40 €, se venden y su compra puede caber en tu presupuesto). */
async function verifyPriority(ctrl){
 const c=cfg(),rev={},fresh=t=>M.pt.cards[t]&&Date.now()-M.pt.cards[t].t<PT_TTL;
 const cand=cardsPk().filter(x=>hasPtcg(x.id)&&!fresh(x.id)&&(x.liq?.k||0)>=1).map(x=>({x,S:saleRef(x.p)})).filter(o=>Number.isFinite(o.S)&&o.S>=40&&o.S<=c.maxBuy/FAKE_RATIO).sort((a,b)=>(b.x.liq.k-a.x.liq.k)||(a.S-b.S)).slice(0,300);
 const prog={total:Math.ceil(cand.length/60),done:0,first:true};if(cand.length)ptRunning=prog;
 for(let i=0;i<cand.length;i+=60){if(ctrl.signal.aborted||budget().n>=PT_DAILY)break;
  const grp=cand.slice(i,i+60);for(const o of grp)rev[ptcgId(o.x.id)]=o.x.id;
  try{spend();M.src.ptcg.req++;
   const j=await getJSON(PT+"/cards?q="+encodeURIComponent(grp.map(o=>'id:"'+ptcgId(o.x.id)+'"').join(" OR "))+"&pageSize=250&select=id,cardmarket,tcgplayer",ctrl.signal,45000);
   for(const cd of (Array.isArray(j?.data)?j.data:[])){const t=rev[cd.id];if(t)M.pt.cards[t]=parsePtCard(cd)}
   M.src.ptcg.ok++;M.src.ptcg.last=Date.now();prog.done++;persist();render()}
  catch(e){if(ctrl.signal.aborted)break;M.src.ptcg.fail++;M.src.ptcg.lastErr=String(e.message||e).slice(0,80);break}
  await sleep(2100)}
 if(ptRunning===prog)ptRunning=null;
}
async function verifySets(sets,ctrl){
 const rev={};for(const r of window.CV_UNIVERSE.cards)if(hasPtcg(r[0]))rev[ptcgId(r[0])]=r[0];
 const todo=sets.filter(s=>!(M.pt.sets[s]&&Date.now()-M.pt.sets[s]<PT_TTL));
 const prog={total:todo.length,done:0};ptRunning=prog;
 for(const s of todo){if(ctrl.signal.aborted)break;if(budget().n>=PT_DAILY){M.src.ptcg.lastErr="Tope diario propio ("+PT_DAILY+") alcanzado: sigue mañana";break}
  let page=1,got=0,total=Infinity,ok=true;
  while(got<total){
   try{spend();M.src.ptcg.req++;
    const j=await getJSON(PT+"/cards?q=set.id:"+encodeURIComponent(s)+"&pageSize=250&page="+page+"&select=id,cardmarket,tcgplayer",ctrl.signal,45000);
    const list=Array.isArray(j?.data)?j.data:[];for(const c of list){const t=rev[c.id];if(t)M.pt.cards[t]=parsePtCard(c)}
    got+=list.length;total=Number.isFinite(j?.totalCount)?j.totalCount:got;M.src.ptcg.ok++;M.src.ptcg.last=Date.now();if(!list.length)break;page++;
   }catch(e){if(ctrl.signal.aborted)break;M.src.ptcg.fail++;M.src.ptcg.lastErr=String(e.message||e).slice(0,80);ok=false;break}
   await sleep(2100);
  }
  if(ok)M.pt.sets[s]=Date.now();prog.done++;persist();render();
  if(sets.length>6&&M.src.ptcg.fail>=3&&M.src.ptcg.ok===0)break;/* sin conexión con pokemontcg.io: no insistir */
 }
 if(ptRunning===prog)ptRunning=null;persist();
}

/* ---------- Lorcana (Bindex) ---------- */
let loState="";
const bxSt={};
function loadLorcana(ctrl){return loadBx("lorcana",ctrl)}
async function loadAllBx(ctrl){for(const g of Object.keys(BXG))if(view.game==="all"||view.game===g){if(ctrl.signal.aborted)break;await loadBx(g,ctrl)}}
async function loadBx(g,ctrl){
 const G=BXG[g],lor=g==="lorcana",cur=lor?M.lo:M.bx?.[g],setSt=t=>{if(lor)loState=t;else bxSt[g]=t};
 if(cur&&Date.now()-cur.at<LO_TTL)return;if(String(lor?loState:bxSt[g]||"").startsWith("Cargando"))return;
 setSt("Cargando "+G.name+" (precios y ventas de Cardmarket vía Bindex)…");render();
 try{let sets=(await getJSON(BXB+g+"/sets.json",ctrl.signal,30000))?.sets||[];const cards=[];
  if(sets.length>G.sets){const byV=[...sets].sort((a,b)=>(N(b.setValueUsd)||0)-(N(a.setValueUsd)||0)),byD=[...sets].sort((a,b)=>String(b.releaseDate||"").localeCompare(String(a.releaseDate||""))),half=Math.ceil(G.sets/2);
   sets=[...new Set(byV.slice(0,half).concat(byD.slice(0,G.sets)))].slice(0,G.sets)}/* las de más valor y las más recientes */
  for(const st of sets){if(ctrl.signal.aborted)break;
   try{const f=await getJSON(BXB+g+"/sets/"+encodeURIComponent(st.id)+".json",ctrl.signal,30000);
    for(const c of (f?.cards||[])){const vs=(c.variants||[]).filter(v=>v?.eur&&N(v.eur.trend));if(!vs.length)continue;
     const isF=n=>n!=="nonfoil"&&/foil/i.test(n),ench=lor&&/enchanted|iconic|epic/i.test(c.rarity||"");
     const v=(ench&&vs.find(x=>x.name==="foil"))||vs.find(x=>x.name==="normal"||x.name==="nonfoil")||vs[0];
     const mk=(v,id)=>({id,game:g,bxId:c.id,setId:st.id,name:c.name,number:String(c.number||""),set:st.name||f?.set?.name||"",rarity:c.rarity||"",variant:v.name,fo:isF(v.name),image:c.imageLarge||c.imageSmall||"",cm:c.cardmarketId||null,
      low:N(v.eur.low),trend:N(v.eur.trend),avg1:N(v.eur.avg1),avg7:N(v.eur.avg7),avg30:N(v.eur.avg30),updated:f?.updatedAt||""});
     const pre=lor?"lo-":"bx-"+g+"-";
     if(N(v.eur.trend)>=G.min)cards.push(mk(v,pre+c.id));
     /* V143 · La versión FOIL de una carta normal es otro precio en Cardmarket (columnas «foil» de la guía): sale aparte
        cuando vale ≥ 20 € (las legendarias y súper raras foil pueden valer varias veces la normal). */
     const vf=!isF(v.name)&&vs.find(x=>isF(x.name));if(vf&&N(vf.eur.trend)>=Math.max(20,G.min))cards.push(mk(vf,pre+c.id+"~foil"))}
   }catch(e){if(ctrl.signal.aborted)break;M.src.bindex.fail++;M.src.bindex.lastErr=String(e.message||e).slice(0,80)}
   await sleep(150)}
  if(cards.length){const o={at:Date.now(),cards,sets:sets.length};if(lor)M.lo=o;else M.bx={...(M.bx||{}),[g]:o};M.src.bindex.ok++;M.src.bindex.last=Date.now();M.src.bindex.lastErr="";setSt("")}
  else setSt(G.name+" no disponible: Bindex no ha devuelto cartas con precio de Cardmarket"+(M.src.bindex.lastErr?" ("+M.src.bindex.lastErr+")":"")+". Mira «Estado de las fuentes».");
  persist();
 }catch(e){M.src.bindex.fail++;M.src.bindex.lastErr=String(e.message||e).slice(0,80);setSt(G.name+" no disponible ahora: "+M.src.bindex.lastErr+". Pulsa «Actualizar precios» para reintentar.");persist()}
 render();
}

/* ---------- versión del producto ---------- */
/* Resultado: pid (producto usado), estado y motivo.
   verificado: pokemontcg.io (enlazado a su propio producto) da una tendencia que coincide con una sola versión.
   una-fuente: TCGdex sin avisos (no hay versiones de precio muy distinto). pt-only: sin producto en la guía; datos de pokemontcg.io.
   sin-confirmar: hay otra versión con precio muy distinto y aún no hay 2.ª fuente. dudoso: colisión/nombre o 2.ª fuente que no cuadra. */
function resolve(id){
 const m=window.CV_CM_MAP?.[id],pt=M.pt.cards[id],ptOk=pt&&Date.now()-pt.t<PT_TTL*7&&pt.trend>0;
 if(!m)return ptOk?{pid:null,status:"pt-only",why:"Sin producto en la guía; datos de Cardmarket vía pokemontcg.io"}:null;
 const [p0,f,...alts]=m,all=[p0,...alts].filter(x=>G(x));
 if(!all.length)return ptOk?{pid:null,status:"pt-only",why:"El producto no está en la guía de hoy; datos vía pokemontcg.io"}:null;
 if(ptOk){
  const d=all.map(x=>({x,d:Math.abs(Math.log(G(x).trend/pt.trend))})).filter(o=>Number.isFinite(o.d)).sort((a,b)=>a.d-b.d);
  const b=d[0],s=d[1];
  if(b&&b.d<Math.log(1.6)&&(!s||s.d-b.d>Math.log(1.5)||Math.abs(Math.log(G(b.x).trend/G(s.x).trend))<Math.log(1.3)))
   return {pid:b.x,status:"verificado",changed:b.x!==p0,why:b.x!==p0?"Corregido: TCGdex apuntaba a otra versión; la tendencia de pokemontcg.io ("+EUR(pt.trend)+") coincide con esta":"Dos fuentes coinciden (tendencia "+EUR(pt.trend)+")"};
  return {pid:p0,status:"dudoso",why:"pokemontcg.io da una tendencia ("+EUR(pt.trend)+") que no coincide con ninguna versión de la guía"};
 }
 if(f&1)return {pid:p0,status:"dudoso",why:"TCGdex asigna este producto a dos cartas del mismo set"};
 if(f&2)return {pid:p0,status:"dudoso",why:"El nombre del producto de Cardmarket no coincide con la carta"};
 if(f&4)return {pid:p0,status:"sin-confirmar",why:"Hay otra versión con el mismo nombre y precio muy distinto"};
 return {pid:p0,status:"una-fuente",why:"Producto único con este nombre en la expansión (TCGdex)"};
}
const TRUST={"verificado":3,"jp":3,"una-fuente":2,"pt-only":2,"bindex":2,"sin-confirmar":1,"dudoso":0};

/* ---------- valoración ---------- */
const LANGS=[["en","Inglés"],["es","Español"],["fr","Francés"],["de","Alemán"],["it","Italiano"],["pt","Portugués"],["ja","Japonés"],["ko","Coreano"],["zh","Chino"]];
/* V142 · Idiomas de CardTrader → los de la app (CardTrader escribe «jp», «kr», «zh-CN»…), y al revés para pedirle un idioma */
const normL=v=>{v=String(v||"").toLowerCase();return v==="jp"?"ja":v==="kr"?"ko":/^zh/.test(v)?"zh":v},CTLANG={en:"en",es:"es",fr:"fr",de:"de",it:"it",pt:"pt",ja:"jp",ko:"kr",zh:"zh-CN"};
const OTHER_L=["es","fr","de","it","pt","ko","zh"],LO_LANGS=["en","de","fr","it","ja","zh"],gLangs=x=>BXG[gOf(x)]?.langs||LO_LANGS;/* Lorcana se imprime en inglés, alemán, francés, italiano, japonés y chino */
let langData=readLS(LKEY,{}),watch=readLS(WKEY,{}),view={game:"all",cond:"buen",show:"profit",sort:"profit",q:"",lang:"all",...readLS(VKEY,{})};if(view.cond!=="mal")view.cond="buen";
const netSale=(v,c)=>v*(1-c.feePct/100)-c.sellShip;
/* Presupuesto: precio de la carta entre 20 € y la «Compra máxima por carta» (Supuestos, 200 € por defecto). En compras
   importadas (TCGplayer) cuenta el coste total puesto en 41020, porque el IVA y la gestión se pagan sí o sí. */
/* Beneficio mínimo: el de Supuestos; Lorcana tiene el suyo (sus cartas valen menos y el margen de 40 € casi nunca cabe). */
const minP=(x,c)=>x&&x.kind==="lo"&&gOf(x)==="lorcana"&&Number.isFinite(Number(c.minProfitLo))?Number(c.minProfitLo):c.minProfit;
/* V139 · Margen mínimo: además del beneficio en euros, ganar al menos minMargin % de lo que pagas (25 %: pagas 160 € → ≥ 40 €) */
const mgOk=(profit,cost,c)=>Number.isFinite(profit)&&Number.isFinite(cost)&&cost>0&&profit/cost>=(Number.isFinite(c.minMargin)?c.minMargin:25)/100;
/* V144 · Ventas mínimas: 1 = al menos una venta en 30 días · 2 = cada semana (por defecto) · 3 = a diario (Cardmarket) */
const minLiq=c=>Math.min(3,Math.max(1,Math.round(Number(c?.minLiq)||2)));
const goodOp=(o,x,c)=>!!o&&!o.mixLang&&Number.isFinite(o.profit)&&o.profit>=minP(x,c)&&mgOk(o.profit,o.cost,c);
const inBudget=v=>Number.isFinite(v)&&v>=20&&v<=cfg().maxBuy;
/* V129: el presupuesto es lo que PAGAS en total (carta + envío, y en importadas + IVA y gestión): nunca más que la compra máxima. */
const opIn=o=>Number.isFinite(o.cost)&&o.buy>=20&&o.cost<=cfg().maxBuy;
function liquidity(p){if(N(p.avg1)&&N(p.avg7))return {k:3,t:"Se vende a diario"};if(N(p.avg7))return {k:2,t:"Ventas esta semana"};if(N(p.avg30))return {k:1,t:"Pocas ventas (30 días)"};return {k:0,t:"Sin ventas recientes"}}
function momentum(p){return N(p.avg7)&&N(p.avg30)?p.avg7/p.avg30-1:NaN}
function saleRef(p){const xs=[p.trend,p.avg30,p.avg7].filter(Number.isFinite);return xs.length?Math.min(...xs):NaN}
function ops(card,c){
 const {p,res}=card,S=saleRef(p),out=[],saved=langData[card.id]||{},jp=card.kind==="jp",idi=jp?"japonés":"idioma sin indicar";
 const add=o=>{o.cost=Number.isFinite(o.costFull)?o.costFull:o.buy+c.buyShip;o.profit=Number.isFinite(o.sale)?netSale(o.sale,c)-o.cost:NaN;o.margin=o.profit/o.cost;o.maxBuy=Number.isFinite(o.sale)?netSale(o.sale,c)-minP(card,c)-c.buyShip:NaN;out.push(o)};
 if(Number.isFinite(S)){
  if(Number.isFinite(p.exPlus)&&p.exPlus>=S*(jp?FAKE_RATIO:LANG_OK))add({k:"ex",cond:"buen",label:"Cardmarket · EX o mejor ("+idi+") → venta en Cardmarket"+(jp?" (ventas de cartas japonesas)":""),buy:p.exPlus,sale:S});
  /* «desde» de cualquier estado e idioma: solo si no es un valor atípico (≥ 75 % de la venta). Un «desde» muy bajo suele
     ser una carta jugada, otro idioma o un anuncio ya vendido, y no coincide con lo que ves en la ficha (caso Mew ex 232:
     «desde» 50 € frente a 149,90 € el más barato EX o mejor). */
  /* V138: el «EX o mejor» barato de idioma sin indicar ya no da beneficio inventado: la carta sale con «🔎 BUSCA EN INGLÉS»
     y el precio máximo al que te compensa (tgtOf). */
  else if(Number.isFinite(p.low)&&p.low>=S*.75)add({k:"low",cond:"buen",label:jp?"Cardmarket · «desde» japonés (estado sin indicar) → venta de cartas japonesas en Cardmarket":"Cardmarket · «desde» (estado e idioma sin indicar) → venta en Cardmarket",buy:p.low,sale:S});
  if(jp&&Number.isFinite(p.low)&&p.low<S*.5&&p.low>=S*FAKE_RATIO)add({k:"po",cond:"mal",label:"Restaurar · «desde» en mal estado → venta mejorada al "+Math.round(c.restLow*100)+" % (supuesto conservador)",buy:p.low,sale:S*c.restLow});
 }
 /* EE. UU.: compra en TCGplayer al precio de mercado (en inglés), importada a 41020: (precio + envío) × (1 + IVA) + gestión */
 const tg=card.kind==="pk"?M.pt.cards[card.id]?.tcg:null,I=impCfg();/* ojo: aquí «jp» es local (carta japonesa) */
 if(tg&&N(tg.market)&&N(fx.usd)&&Number.isFinite(S)){const buy=tg.market*fx.usd,full=(buy+I.shipUS)*(1+I.vat/100)+I.handling;
  add({k:"us",cond:"buen",us:true,url:tg.url,label:"TCGplayer (EE. UU.) · mercado $"+tg.market.toFixed(2).replace(".",",")+" ≈ "+EUR(buy)+" · importada a 41020 (envío "+EUR(I.shipUS)+", IVA "+I.vat+" %, gestión "+EUR(I.handling)+") → venta en Cardmarket. Comprueba que el vendedor envía a España.",buy,costFull:full,sale:S});
  const o=out[out.length-1];o.maxBuy=(netSale(S,c)-c.minProfit-I.handling)/(1+I.vat/100)-I.shipUS}
 /* V131: CardTrader dice el idioma de cada anuncio → compra en INGLÉS (NM/EX), idioma comprobado */
 const ctr=ctRes[card.id]?.rows?.find(o=>jp?o.lang==="ja":o.lang==="en");
 if(ctr&&ctr.cheapestGood&&Number.isFinite(S)&&ctr.cheapestGood.eur>=S*FAKE_RATIO)add({k:"ct",costFull:ctr.cheapestGood.eur+(Number.isFinite(ctr.cheapestGood.ship)?ctr.cheapestGood.ship:c.buyShip),cond:"buen",url:"https://www.cardtrader.com/cards/"+encodeURIComponent(ctRes[card.id].bp),label:"CardTrader · "+(jp?"japonés ":"inglés ")+(ctr.cheapestGood.cond||"NM/EX")+" (idioma comprobado) → venta en Cardmarket",buy:ctr.cheapestGood.eur,sale:S});
 /* V142 · OTROS IDIOMAS (alemán, francés, italiano, español, portugués, coreano, chino): la guía de Cardmarket mezcla idiomas,
    así que su venta NO puede ser el precio de la inglesa (suelen valer menos). Venta = lo que piden los demás vendedores de
    ESE idioma en CardTrader (sin el más barato, al menos 3) −5 % para vender antes, y nunca más que su valor en Cardmarket. */
 if(!jp&&Number.isFinite(S))for(const r of (ctRes[card.id]?.rows||[])){const lk=r.lang;if(!OTHER_L.includes(lk)||card.kind==="lo"&&!gLangs(card).includes(lk)||!r.cheapestGood||!(r.n2>=3)||!Number.isFinite(r.exit2))continue;
  const sale=Math.min(r.exit2*.95,S),g=r.cheapestGood;if(g.eur<sale*FAKE_RATIO)continue;const name=LNAME2[lk];
  add({k:"ctl-"+lk,ctl:true,langK:lk,lang:name,sameLang:true,cond:"buen",costFull:g.eur+(Number.isFinite(g.ship)?g.ship:c.buyShip),url:"https://www.cardtrader.com/cards/"+encodeURIComponent(ctRes[card.id].bp),
   label:"CardTrader · "+name.toLowerCase()+" "+(g.cond||"NM/EX")+" (idioma comprobado) → venta en "+name.toLowerCase()+" a lo que piden los otros "+r.n2+" vendedores −5 % (como mucho su valor en Cardmarket)",buy:g.eur,sale,exitN:r.n2})}
 /* V143 · CardNexus: el anuncio más barato de CARDMARKET en el idioma de la carta y en NM (la guía oficial mezcla idiomas y
    estados), y el anuncio de CardNexus con su envío real a España. En otro idioma, la venta es la del mismo idioma (arriba). */
 const cn=cnRes[card.id];
 if(cn&&Number.isFinite(S)){const lgs=jp?["ja"]:["en"].concat(OTHER_L.filter(l=>card.kind!=="lo"||gLangs(card).includes(l)));
  for(const lk of lgs){const base=lk==="en"||lk==="ja",name=LNAME2[lk];let sale=S,exitN=0;
   if(!base){const r=(ctRes[card.id]?.rows||[]).find(o=>o.lang===lk);if(!r||!(r.n2>=3)||!Number.isFinite(r.exit2))continue;sale=Math.min(r.exit2*.95,S);exitN=r.n2}
   const cmLow=N(cn.cm?.byCondition?.NM?.byLanguage?.[lk]?.low),url="https://www.cardmarket.com/es/"+cmGame(card)+"/Products?idProduct="+encodeURIComponent(res.pid)+"&language="+CMID[lk]+"&minCondition=2"+(card.fo?"&isFoil=Y":"");
   if(Number.isFinite(cmLow)&&cmLow>=sale*FAKE_RATIO)add({k:"cnm-"+lk,cn:true,where:"Cardmarket",langK:lk,lang:name,ctl:!base,exitN,sameLang:true,cond:"buen",url,
    label:"Cardmarket · "+name.toLowerCase()+" NM"+(card.fo?" foil":"")+": su anuncio más barato en "+name.toLowerCase()+" (dato de CardNexus, del día) → venta "+(base?"en Cardmarket":"en "+name.toLowerCase()+" a lo que piden los demás vendedores −5 %"),buy:cmLow,sale});
   const xb=cn.cxBuy;if(base&&xb&&!xb.none&&Number.isFinite(xb.eur)&&xb.eur>=sale*FAKE_RATIO)add({k:"cnx",cn:true,where:"CardNexus",langK:lk,lang:name,sameLang:true,cond:"buen",url:"https://cardnexus.com/",costFull:xb.eur+(Number.isFinite(xb.ship)?xb.ship:c.buyShip),
    label:"CardNexus · "+name.toLowerCase()+" NM"+(card.fo?" foil":"")+", vendedor «"+xb.user+"» ("+xb.country+")"+(Number.isFinite(xb.ship)?" + envío real a España "+EUR(xb.ship):"")+(xb.photos?" · con "+xb.photos+" foto(s) de la carta":"")+" · pago retenido hasta que la recibes → venta en Cardmarket",buy:xb.eur,sale})}}
 /* V133: tiendas leídas en vivo (precio real, con envío o importación hasta 41020) */
 if(jp&&shopRes[card.id]?.res&&Number.isFinite(S))for(const sh of SHOPS){const o=shopRes[card.id].res[sh.id]?.best;if(o&&o.eur>=S*FAKE_RATIO)add({k:"shop",cond:"buen",shop:sh.name+" ("+sh.where+")",url:o.url,label:sh.name+" ("+sh.where+") · «"+o.title+"» precio leído ahora "+EUR(o.eur)+(sh.eu?" + envío":" + importación (EMS, arancel, IVA, gestión)")+" → venta en Cardmarket",buy:o.eur,costFull:o.total,sale:S})}
 const chk=langCheck(card);
 for(const [k,name] of LANGS){const v=saved[k];if(!v||!N(v.buy))continue;const cond=v.cond==="mal"?"mal":"buen";const ls=N(v.sell),sep=chk[k]==="separada";
  /* venta del mismo idioma: la media pegada solo cuenta si se ha comprobado que es distinta de la media general */
  const sale0=ls&&(v.src!=="pegado"||sep)?ls:S,sale=Number.isFinite(sale0)?(cond==="mal"?sale0*c.restLow:sale0):NaN;
  if(Number.isFinite(sale0)&&N(v.buy)<sale0*FAKE_RATIO)continue;/* V130: por debajo del 30 % de su valor → proxy o falsa */
  const how=v.src==="pegado"?(sep?"venta media 30 días en "+name.toLowerCase()+" (Cardmarket, comprobada)":"venta en Cardmarket de todos los idiomas (la ficha no separó el idioma)"):(ls?"anotada en "+name.toLowerCase():"en Cardmarket (todos los idiomas)");
  add({k:"own-"+k,cond,own:true,lang:name,sameLang:v.src==="pegado"?sep:!!ls,mixLang:!(v.src==="pegado"?sep:!!ls),/* V131: venta de otro idioma → no es oportunidad */label:name+" · "+(v.src==="pegado"?"Cardmarket filtrado por "+name.toLowerCase()+" (pegado por ti)":"anotado por ti")+" → "+how,buy:N(v.buy),sale,at:v.at})}
 return out;
}
/* ¿La media pegada es de ese idioma? Si coincide (±2 %) con la media general de la guía o con la de otro idioma pegado,
   Cardmarket no la ha separado por idioma: se marca «general» y NO se usa como venta del idioma. */
function langCheck(card){
 const saved=langData[card.id]||{},G30=N(card.p?.avg30),out={},near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a/b-1)<=.02;
 const GT=N(card.p?.trend),ks=LANGS.map(l=>l[0]).filter(k=>saved[k]?.src==="pegado"&&N(saved[k].sell));
 /* se compara la media 30 días pegada (o la tendencia si no hay media) con la general y con la de los otros idiomas */
 const ref=v=>N(v.avg30)?["a",N(v.avg30)]:["t",N(v.trend)];
 for(const k of ks){const [ty,a]=ref(saved[k]);
  out[k]=near(a,ty==="a"?G30:GT)||ks.some(o=>{if(o===k)return false;const [t2,b]=ref(saved[o]);return t2===ty&&near(a,b)})?"general":"separada"}
 return out;
}
/* Lee el bloque copiado de la ficha de Cardmarket (cualquier idioma de la web): «desde», tendencia, medias 30/7/1 días
   y, si se copió también la lista de anuncios, el anuncio más barato visible con el filtro aplicado. */
const LBL=[["avg30",/(precio medio (de )?30 d[ií]as|media (de )?30 d[ií]as|avg\.? ?30( days?)?|30[- ]days? average( price)?|30-tages-durchschnitt|prix moyen 30 jours|prezzo medio (a )?30 giorni|pre[cç]o m[eé]dio (de )?30 dias)/i],
 ["avg7",/(precio medio (de )?7 d[ií]as|media (de )?7 d[ií]as|avg\.? ?7( days?)?|7[- ]days? average( price)?|7-tages-durchschnitt|prix moyen 7 jours|prezzo medio (a )?7 giorni|pre[cç]o m[eé]dio (de )?7 dias)/i],
 ["avg1",/(precio medio (de )?1 d[ií]a|media (de )?1 d[ií]a|avg\.? ?1( day)?\b|1[- ]day average( price)?|1-tages-durchschnitt|prix moyen 1 jour|prezzo medio (a )?1 giorno|pre[cç]o m[eé]dio (de )?1 dia)/i],
 ["trend",/(tendencia( de precio)?|price trend|preis-trend|tendance des prix|tendenza( di prezzo)?|tend[eê]ncia( de pre[cç]o)?)/i],
 ["from",/(^|\n|\s)(desde|from|ab|[àa] partir de|da|a partir de|precio m[ií]nimo|m[ií]nimo)(?=\s*[:\n]?\s*[\d€])/i]];
const PRICE=/(?:€\s*)?(\d{1,3}(?:[.\s\u00a0]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*€|€\s*(\d{1,3}(?:[.,\s\u00a0]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/;
function pnum(t){t=String(t).replace(/[\s\u00a0]/g,"");const c=t.lastIndexOf(","),d=t.lastIndexOf(".");const dec=Math.max(c,d);let x;
 if(dec>=0&&t.length-dec-1<=2)x=Number(t.slice(0,dec).replace(/[.,]/g,"")+"."+t.slice(dec+1));else x=Number(t.replace(/[.,]/g,""));return Number.isFinite(x)&&x>0?x:NaN}
function parseCmPaste(txt){
 let t=String(txt||"").replace(/\r/g,"");const o={};
 for(const [k,re] of LBL){const m=t.match(re);if(!m)continue;const rest=t.slice(m.index+m[0].length,m.index+m[0].length+40),pm=rest.match(PRICE);
  if(pm){o[k]=pnum(pm[1]||pm[2]);t=t.slice(0,m.index)+" ".repeat(m[0].length+pm.index+pm[0].length)+t.slice(m.index+m[0].length+pm.index+pm[0].length)}}
 const offers=[];const g=new RegExp(PRICE.source,"g");let m;while((m=g.exec(t)))offers.push(pnum(m[1]||m[2]));
 const fo=offers.filter(Number.isFinite);if(fo.length)o.offerMin=Math.min(...fo),o.offers=fo.length;
 return o;
}
/* Confianza 0–100: cuánto fiarse de la oferta. Suma transparente de 5 partes (todas con datos reales de la guía):
   versión (25) · ventas recientes (20) · estabilidad de precio entre media 1/7/30 días y tendencia (20) ·
   tendencia de la semana (10) · colchón de margen (10) · estado conocido de la compra (15: «desde» EX o mejor 15, pegado
   de la ficha filtrada 8, «desde» sin estado 0 — el más barato puede ser una carta jugada).
   «Beneficio prudente» = beneficio × confianza. */
function confidence(x,o){
 const p=x.p||{},S=saleRef(p),parts={};
 parts.version={3:25,2:18,1:6,0:0}[TRUST[x.res?.status]??0]??0;
 parts.ventas={3:20,2:14,1:6,0:0}[x.liq?.k??0];
 const xs=[p.avg1,p.avg7,p.avg30,p.trend].filter(Number.isFinite),disp=xs.length>=2&&S>0?(Math.max(...xs)-Math.min(...xs))/S:NaN;
 parts.estabilidad=!Number.isFinite(disp)?0:disp<=.1?20:disp<=.25?14:disp<=.5?7:0;
 const m=x.mom;parts.tendencia=!Number.isFinite(m)?5:m>=-.05?10:m>=-.15?5:0;
 const mg=o?.margin;parts.colchon=!Number.isFinite(mg)?0:mg>=.5?10:mg>=.25?7:mg>=.1?3:0;
 parts.estado=!o?0:o.k==="ex"||o.k==="exu"||o.k==="ct"||o.cn&&!o.ctl?15:o.ctl||o.own||o.k==="po"||o.k==="us"||o.k==="shop"?8:0;/* TCGplayer: precio de mercado (ventas), no un anuncio concreto *//* en restaurar el mal estado es lo esperado; queda por ver cuánto */
 let score=Object.values(parts).reduce((a,b)=>a+b,0);if(o?.langUnk)score=Math.min(score,40);if(o?.ctl)score=Math.min(score,60);/* V142: venta estimada con anuncios (precio pedido), no con ventas cerradas *//* idioma sin comprobar: como mucho 40 */
 return {score,parts,disp,prudent:Number.isFinite(o?.profit)?o.profit*score/100:NaN};
}
function bestOp(list,cond){return list.filter(o=>!o.mixLang&&(cond==="all"||o.cond===cond)&&Number.isFinite(o.profit)&&opIn(o)).sort((a,b)=>b.profit-a.profit)[0]||null}
function ownedSet(){const st=window.CVStateBridge?.get?.(),n=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim(),num=v=>String(v||"").split("/")[0].replace(/\D/g,"").replace(/^0+/,"");
 const s=new Set();for(const c of (st?.cards||[]))if(!c.archivedSold)s.add(n(c.name)+"|"+num(c.number));return {has:(name,number)=>s.has(n(name)+"|"+num(number))}}
/* V141 · Durante un pintado las cartas se calculan una sola vez (antes, 4 veces: lista, Top 5, punto de mira y chollos) */
let memo=null;const memoOf=(k,f)=>memo?(memo.has(k)?memo.get(k):(memo.set(k,f()),memo.get(k))):f();
function cardsPk(){return memoOf("pk",cardsPk_)}
function cardsPk_(){
 const U=window.CV_UNIVERSE;if(!U||!M.guide&&!Object.keys(M.pt.cards).length)return [];
 const c=cfg(),own=ownedSet(),out=[];
 for(const r of U.cards){const res=resolve(r[0]);if(!res)continue;
  let p;if(res.pid){p={...G(res.pid)};const pt=M.pt.cards[r[0]];if(res.status==="verificado"&&pt)p.exPlus=pt.exPlus;p.date=M.guide?.sourceCreatedAt}
  else{const pt=M.pt.cards[r[0]];p={low:pt.low,trend:pt.trend,avg1:pt.avg1,avg7:pt.avg7,avg30:pt.avg30,exPlus:pt.exPlus,date:pt.updated}}
  const card={kind:"pk",id:r[0],r,name:r[1],set:r[2],number:r[3]+(r[4]?"/"+r[4]:""),rarity:r[5],res,p,owned:own.has(r[1],r[3])};
  card.ops=ops(card,c);card.liq=liquidity(p);card.mom=momentum(p);out.push(card)}
 return out;
}
/* Cartas japonesas: expansión japonesa = producto propio en Cardmarket, así que «desde», tendencia y medias de venta
   son de cartas japonesas (idioma seguro). Catálogo verificado por nombre y por orden de numeración (tools/build-jp-map.mjs). */
function cardsJp(){return memoOf("jp",cardsJp_)}
function cardsJp_(){
 const J=window.CV_JP_MAP;if(!J?.cards||!M.guide)return [];const c=cfg(),out=[];
 for(const r of J.cards){const [pid,name,set,code,number,image,f]=r,g=G(pid);if(!g)continue;
  const res={pid,status:f&4?"sin-confirmar":"jp",why:f&16?"Producto japonés de Cardmarket; emparejado por nombre y orden de numeración dentro de su expansión (método comprobado 130 de 130); confirma el número "+number+" en la ficha":f&4?"Hay otra versión japonesa con el mismo nombre y precio muy distinto; comprueba el número "+number+" en la ficha":f&8?"Producto japonés de Cardmarket; versión comprobada por nombre y orden de numeración":"Producto japonés de Cardmarket; único con este nombre en la expansión"};
  const card={kind:"jp",id:"jp-"+pid,r,name,set:set+" (japonés)",code,number,rarity:"",image:image?J.imageBase+image:"",res,p:{...g,date:M.guide.sourceCreatedAt},owned:false,lang:"Japonés"};
  card.ops=ops(card,c);card.liq=liquidity(card.p);card.mom=momentum(card.p);out.push(card)}
 return out;
}
/* Mi colección → carta del catálogo con precio: por id de catálogo (TCGdex o pokemontcg.io) y, si no hay, por nombre y
   número (y colección si hay varias). Japonesas solo si la carta está marcada en japonés. */
function matchOwned(c){
 if(!window.CV_UNIVERSE||!M.guide)return null;const all=cardsPk(),num=v=>String(v||"").split("/")[0].replace(/\D/g,"").replace(/^0+/,"");
 const id=String(c.catalogId||"");
 if(id){const x=all.find(y=>y.id===id||hasPtcg(y.id)&&ptcgId(y.id)===id);if(x)return {card:x,how:"catálogo"}}
 const jp=/jap|^ja$|^jp$/i.test(String(c.language||""));
 const pool=jp?cardsJp():all,cand=pool.filter(y=>nq(y.name)===nq(c.name)&&num(y.number)===num(c.number)&&num(c.number));
 if(cand.length===1)return {card:cand[0],how:"nombre y número"};
 if(cand.length>1&&c.set){const z=cand.filter(y=>nq(y.set).includes(nq(c.set))||nq(c.set).includes(nq(y.set).replace(" (japones)","")));if(z.length===1)return {card:z[0],how:"nombre, número y colección"}}
 return cand.length>1?{ambiguous:cand.length}:null;
}
function cardsLo(){return memoOf("lo",cardsLo_)}
function cardsLo_(){
 const src=[["lorcana",M.lo]].concat(Object.entries(M.bx||{})).filter(([,o])=>o?.cards?.length);if(!src.length)return [];const c=cfg(),own=ownedSet();
 return src.flatMap(([g,o])=>o.cards.map(x=>({...x,game:x.game||g}))).map(x=>{const card={kind:"lo",game:x.game,id:x.id,x,fo:!!x.fo,name:x.name+(x.fo&&!/enchanted|iconic|epic/i.test(x.rarity||"")?" (foil)":""),set:x.set,number:x.number,rarity:x.rarity,res:{pid:x.cm,status:"bindex",why:"Bindex empareja Cardmarket "+(x.game==="onepiece"?"por el código de la carta":"por nombre y precio dentro de la expansión")},p:{low:x.low,trend:x.trend,avg1:x.avg1,avg7:x.avg7,avg30:x.avg30,date:x.updated},owned:own.has(x.name,x.number)};
  card.ops=ops(card,c);card.liq=liquidity(card.p);card.mom=momentum(card.p);return card});
}
/* cartas de Lorcana, Magic y One Piece que tocan según el juego y el idioma elegidos */
const loPool=lg=>view.game!=="all"&&!isBx(view.game)?[]:cardsLo().filter(x=>(view.game==="all"||view.game===gOf(x))&&(!lg||lg!=="ja"&&gLangs(x).includes(lg)));
const nq=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
/* V142 · Idioma de cada compra: CardTrader lo dice; el «desde»/«EX o mejor» de Cardmarket no (cuenta como inglés, como hasta ahora) */
const opLang=(o,x)=>o.ctl||o.cn?o.langK:o.own?String(o.k).slice(4):o.k==="ct"?(x.kind==="jp"?"ja":"en"):o.k==="shop"||x.kind==="jp"?"ja":o.us?"en":null;
const langOk=(o,x,lg)=>{const l=opLang(o,x);return lg==="en"?l==="en"||l===null:lg==="ja"?l==="ja":l===lg};
const payOf=x=>x.langPend?1e9:x.tgtOnly?x.tgt.maxPay:x.best&&Number.isFinite(x.best.cost)?x.best.cost:1e9;
function list(){
 const c=cfg(),q=nq(view.q).trim();let all=[];
 const lg=selLang();
 if((view.game==="all"||view.game==="pokemon")&&lg!=="ja")all=all.concat(cardsPk());if(!isBx(view.game)&&(!lg||lg==="ja"))all=all.concat(cardsJp());all=all.concat(loPool(lg));
 for(const x of all){x.best=bestOp(lg?x.ops.filter(o=>langOk(o,x,lg)):x.ops,view.cond);x.conf=confidence(x,x.best);x.dl=x.kind!=="lo"&&x.res?.pid?delta(x.res.pid):null;x.hot=!!(x.dl&&x.dl.drop>=.15&&x.best&&x.best.profit>=c.minProfit);x.watch=watch[x.id];x.hit=x.watch&&x.best&&x.best.buy<=x.watch.target}
 if(q)all=all.filter(x=>nq(x.name+" "+x.set+" "+x.number).includes(q));
 const ol=OTHER_L.includes(lg);
 for(const x of all){const ok=goodOp(x.best,x,c),t=ok?null:tgtOf(x,c,view.cond);x.tgt=ol?null:t;/* V142: en alemán, coreano… no hay precio de venta de ese idioma en la guía: sin objetivo inventado */x.tgtOnly=!ok&&!!x.tgt;
  x.langPend=ol&&!ok&&!!t&&x.kind!=="jp"}/* …pero la carta sale «por comprobar en ese idioma», sin beneficio */
 if(q)all=all;else all=all.filter(x=>!x.owned&&(x.watch||x.best&&(view.show==="all"||goodOp(x.best,x,c))||(x.tgtOnly||x.langPend)&&(x.liq?.k||0)>=2));
 const pr=x=>x.langPend?-2e5+(x.liq?.k||0)*100+saleRef(x.p)/1e4:x.tgtOnly?-1e5+(x.liq?.k||0)*100+x.tgt.maxBuy/x.tgt.S:x.best?x.best.profit:-1e9,/* las de precio objetivo, detrás de las compras confirmadas */by={profit:(a,b)=>pr(b)-pr(a),buy:(a,b)=>payOf(a)-payOf(b),/* V140: por lo que PAGAS (lo que dice la carta), también en los precios objetivo */margin:(a,b)=>(b.best?b.best.margin:-9)-(a.best?a.best.margin:-9),
  sale:(a,b)=>(saleRef(b.p)||0)-(saleRef(a.p)||0),liq:(a,b)=>b.liq.k-a.liq.k||pr(b)-pr(a),mom:(a,b)=>(Number.isFinite(b.mom)?b.mom:-9)-(Number.isFinite(a.mom)?a.mom:-9),name:(a,b)=>a.name.localeCompare(b.name,"es"),risk:(a,b)=>(N(b.conf?.prudent)||-1e9)-(N(a.conf?.prudent)||-1e9),drop:(a,b)=>(b.hot-a.hot)||((b.dl?b.dl.drop:-9)-(a.dl?a.dl.drop:-9))};
 all.sort((a,b)=>(b.hit?1:0)-(a.hit?1:0)||by[view.sort||"profit"](a,b));
 /* Recomendadas: versión fiable y con ventas en los últimos 30 días. El resto, aparte y avisado. */
 const ml=minLiq(c),sure=all.filter(x=>q||TRUST[x.res.status]>=2&&x.liq.k>=ml),pending=q?[]:all.filter(x=>!(TRUST[x.res.status]>=2&&x.liq.k>=ml));
 return {sure,pending,total:all.length};
}

/* ---------- vista ---------- */
const STAT={"verificado":["v4ok","VERSIÓN VERIFICADA (2 FUENTES)"],"una-fuente":["v4ok","VERSIÓN ÚNICA"],"pt-only":["v4ok","DATOS VÍA POKEMONTCG.IO"],"bindex":["v4ok","LORCANA · BINDEX"],"jp":["v4ok","JAPONÉS · PRECIO Y VENTAS DEL MISMO IDIOMA"],"sin-confirmar":["v4warn","COMPRUEBA LA VERSIÓN"],"dudoso":["v4bad","VERSIÓN DUDOSA"]};
/* Enlace oficial de Cardmarket por id de producto (cardmarket.com/{juego}/Products?idProduct=N, admite filtros):
   abre EXACTAMENTE la versión verificada. Idiomas de Cardmarket: 1 inglés, 2 francés, 3 alemán, 4 español, 5 italiano,
   6 chino simpl., 7 japonés, 8 portugués, 9 ruso, 10 coreano, 11 chino trad. Estado mínimo: 3 = EX o mejor. */
const CM_LANG=[["en","Inglés",1],["es","Español",4],["fr","Francés",2],["de","Alemán",3],["it","Italiano",5],["pt","Portugués",8],["ko","Coreano",10],["zh","Chino",6]];
/* El enlace abre la ficha con el mismo filtro que el precio mostrado: EX o mejor solo si la compra es el «desde» EX+. */
function exShown(x){const b=x.best||x.ops?.filter(o=>o.cond===view.cond&&Number.isFinite(o.profit)).sort((a,c)=>c.profit-a.profit)[0];return !!b&&(b.k==="ex"||b.k==="exu")||!!x.tgtOnly}
function links(x){
 const game=cmGame(x),pid=x.res?.pid;
 if(pid&&x.kind==="jp"){const base="https://www.cardmarket.com/es/Pokemon/Products?idProduct="+encodeURIComponent(pid);return {cm:(selLang()==="ja"?base+"&language=7":base)+(view.cond!=="mal"&&exShown(x)?"&minCondition=3":""),exact:true,lang:[{k:"ja",n:"Japonés",url:base+"&language=7"+(view.cond==="mal"?"":"&minCondition=3")}]}}
 if(pid){const base="https://www.cardmarket.com/es/"+game+"/Products?idProduct="+encodeURIComponent(pid),cond=view.cond!=="mal"&&exShown(x)?"&minCondition=3":"",lg=selLang()||(x.tgtOnly?"en":"");/* precio objetivo en inglés: se abre filtrado en inglés */
  const fo=x.fo?"&isFoil=Y":"";/* V143: Lorcana foil → solo anuncios foil */
  return {cm:(lg&&CMID[lg]&&!(x.kind==="lo"&&!gLangs(x).includes(lg))?base+"&language="+CMID[lg]+cond:base+cond)+fo,exact:true,lang:CM_LANG.filter(l=>x.kind!=="lo"||gLangs(x).includes(l[0])).map(([k,n,id])=>({k,n,url:base+"&language="+id+cond}))}}
 if(x.kind==="lo")return {cm:"https://www.cardmarket.com/es/"+game+"/Products/Search?searchString="+encodeURIComponent(x.name.split(" - ")[0]),lang:[]};
 const q=encodeURIComponent(x.name+" "+String(x.r[3]).replace(/^0+(?=\d)/,""));
 return {cm:hasPtcg(x.id)?"https://prices.pokemontcg.io/cardmarket/"+ptcgId(x.id):"https://www.cardmarket.com/es/Pokemon/Products/Search?searchString="+q,lang:[]};
}
/* Idioma elegido: la carta se muestra con su imagen en ese idioma (TCGdex publica imágenes por idioma; si no existe, se
   usa la inglesa) y los enlaces abren Cardmarket filtrado por ese idioma. Los precios de la guía no se separan por idioma:
   se indica, y se usan los datos de ese idioma si los has pegado. */
const CMID={en:1,fr:2,de:3,es:4,it:5,ja:7,pt:8,ko:10,zh:6},LNAME2={en:"Inglés",es:"Español",fr:"Francés",de:"Alemán",it:"Italiano",pt:"Portugués",ja:"Japonés",ko:"Coreano",zh:"Chino"};
const selLang=()=>view.lang&&view.lang!=="all"?view.lang:"";
function img(x){
 const lg=selLang();
 if(x.kind==="pk"&&lg&&lg!=="en"&&lg!=="ja"&&lg!=="ko"&&lg!=="zh"){/* TCGdex no tiene imágenes en coreano ni chino */const id=x.id,url="https://assets.tcgdex.net/"+lg+"/"+x.r[6]+"/"+id.slice(0,id.lastIndexOf("-"))+"/"+x.r[3]+"/high.webp",R=window.CVRadar,[a]=R?.pkImages?R.pkImages(x.r,null):[""];
  return '<img src="'+E(url)+'"'+(a?' data-alt="'+E(a)+'"':'')+' alt="'+E(x.name)+' ('+E(LNAME2[lg])+')" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>'}
 if(x.kind==="jp")return x.image?'<img src="'+E(x.image)+'" alt="'+E(x.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>':'';
 if(x.kind==="lo")return x.x.image?'<img src="'+E(x.x.image)+'" alt="'+E(x.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>':'';
 const R=window.CVRadar;const [a,b]=R?.pkImages?R.pkImages(x.r,null):["",""];
 return a?'<img src="'+E(a)+'"'+(b?' data-alt="'+E(b)+'"':'')+' alt="'+E(x.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>':'';
}
function opRows(x,c){
 const shown=x.ops.filter(o=>o.cond===view.cond);if(!shown.length)return '';
 return '<details class="v4more cpOpsBox"><summary>Todas las opciones calculadas ('+shown.length+')</summary><div class="cpOps">'+shown.slice().sort((a,b)=>(N(b.profit)||-1e9)-(N(a.profit)||-1e9)).map(o=>'<div class="cpOp'+(o===x.best?' best':'')+'"><p>'+E(o.label)+(inBudget(o.buy)?'':' <small>(compra fuera de 20–200 €)</small>')+'</p>'+
  '<dl><div><dt>Compra en 41020</dt><dd>'+EUR(o.cost)+'</dd></div><div><dt>Venta</dt><dd>'+EUR(o.sale)+'</dd></div><div><dt>Beneficio</dt><dd class="'+(o.profit>=c.minProfit?'pos':'neg')+'">'+SIGNED(o.profit)+'</dd></div><div><dt>Compra máx.</dt><dd>'+EUR(o.maxBuy)+'</dd></div></dl></div>').join("")+'</div></details>';
}
/* Tabla «mismo idioma»: por cada idioma, compra, venta de ESE idioma y beneficio. Solo se llama «venta comprobada» cuando
   la cifra es de ese idioma (producto japonés propio, o media pegada distinta de la media general). */
function langLine(x){
 const lg=selLang();if(!lg||x.kind==="jp")return '';const v=(langData[x.id]||{})[lg],chk=v?langCheck(x)[lg]:null;
 return '<p class="cpLangSel"><b>'+E(LNAME2[lg])+'</b> · '+(v&&N(v.buy)?'compra '+EUR(v.buy)+(N(v.sell)?' · venta '+EUR(v.sell):'')+' en '+E(LNAME2[lg].toLowerCase())+(chk==="separada"?' ✔ comprobada':chk==="general"?' ⚠ Cardmarket no separó el idioma':' (anotado)'):'Cardmarket no publica precios de venta por idioma: la compra y la venta de arriba son de todos los idiomas. «Abrir en Cardmarket» ya filtra en '+E(LNAME2[lg].toLowerCase())+'; si pegas su ficha, la app calcula compra y venta de este idioma.')+'</p>';
}
function sameLangTable(x,c){
 const saved=langData[x.id]||{},chk=langCheck(x),l=links(x),S=saleRef(x.p),rows=[];
 const gen=x.ops.find(o=>o.cond===view.cond&&!o.own);
 const row=(lang,buy,sale,profit,tag,cls,extra)=>'<tr><th scope="row">'+lang+'</th><td>'+EUR(buy)+'</td><td>'+EUR(sale)+'</td><td class="'+(Number.isFinite(profit)?(profit>=c.minProfit?'pos':'neg'):'')+'">'+SIGNED(profit)+'</td><td><span class="cpLT '+cls+'">'+tag+'</span>'+(extra||'')+'</td></tr>';
 if(x.kind==="jp")return '';/* japonesa: su ficha ya es solo japonesa (arriba) */
 const lgS=selLang();
 for(const o of l.lang){if(x.kind==="jp")break;if(lgS&&o.k!==lgS&&!(saved[o.k]&&N(saved[o.k].buy)))continue;if(!lgS&&!(saved[o.k]&&N(saved[o.k].buy)))continue;const v=saved[o.k],op=x.ops.find(q=>q.k==="own-"+o.k&&q.cond===view.cond);
  if(v&&N(v.buy)){const st=v.src==="pegado"?chk[o.k]:null;
   rows.push(row(o.n,op?op.buy:v.buy,op?.sale,op?.profit,st==="separada"?"✔ venta comprobada · "+o.n.toLowerCase():st==="general"?"⚠ Cardmarket no separó el idioma":N(v.sell)?"anotada por ti":"venta: todos los idiomas",st==="separada"?"ok":st==="general"?"warn":"mix",'<small>'+(v.src==="pegado"?(N(v.offerMin)?"compra: anuncio más barato copiado":"compra: «desde» de la ficha")+" · pegado "+E(WHEN(v.at)):"a mano "+E(WHEN(v.at)))+'</small> <a href="'+E(o.url)+'" target="_blank" rel="noopener noreferrer">ver ↗</a>'))}
  else rows.push('<tr class="cpLTempty"><th scope="row">'+o.n+'</th><td colspan="3"><a href="'+E(o.url)+'" target="_blank" rel="noopener noreferrer">Ver en '+o.n.toLowerCase()+' en Cardmarket ↗</a></td><td><button type="button" class="v4btn" data-cp-pasteopen="'+E(x.id)+'|'+o.k+'">Pegar datos</button></td></tr>')}
 if(!rows.length)return '';
 return '<div class="cpLTbox"><table class="cpLTtab"><caption>Tus datos por idioma (pegados de Cardmarket)'+(view.cond==="mal"?' · restaurar':'')+'<small>Compra = precio del anuncio; el beneficio ya descuenta envíos y comisión.</small></caption><thead><tr><th scope="col">Idioma</th><th scope="col">Compra</th><th scope="col">Venta</th><th scope="col">Beneficio</th><th scope="col">Fiabilidad</th></tr></thead><tbody>'+rows.join("")+'</tbody></table></div>';
}
function pasteBox(x){
 const l=links(x);if(x.kind==="jp"||!l.lang.length)return '';
 return '<details class="v4more cpPaste" data-cp-pastebox="'+E(x.id)+'"><summary>Pegar datos de Cardmarket por idioma</summary><ol class="v4help"><li>Pulsa «Abrir ficha» del idioma en la tabla de arriba (se abre filtrada por ese idioma'+(view.cond==="mal"?'':' y EX o mejor')+').</li><li>En Cardmarket, mantén pulsado sobre «Disponible» y arrastra hasta los primeros anuncios; pulsa «Copiar».</li><li>Vuelve aquí, elige el idioma y pega.</li><li>Truco de iPhone: también puedes hacer una captura de la ficha, abrirla en Fotos, mantener pulsado el texto (Texto en vivo) y copiarlo.</li></ol>'+
 '<div class="cpPasteRow"><label>Idioma<select data-cp-pastelang>'+l.lang.map(o=>'<option value="'+o.k+'">'+o.n+'</option>').join("")+'</select></label><label>Estado<select data-cp-pastecond><option value="buen">Buen estado</option><option value="mal"'+(view.cond==="mal"?" selected":"")+'>Mal estado</option></select></label></div>'+
 '<textarea data-cp-paste rows="5" placeholder="Pega aquí el texto copiado de Cardmarket (Desde, Tendencia de precio, Precio medio 30 días… y los anuncios)" aria-label="Texto copiado de Cardmarket"></textarea>'+
 '<button type="button" class="v4btn primary" data-cp-pastesave="'+E(x.id)+'">Leer y calcular beneficio</button><p class="v4note">Se usa el anuncio más barato que hayas copiado (o «desde») como compra, y la menor de tendencia, media 30 y 7 días como venta de ese idioma. Si la media coincide con la general o con la de otro idioma, se avisa y no se usa como venta del idioma.</p></details>';
}
function langBox(x){
 const s=langData[x.id]||{};
 return '<details class="v4more"><summary>Anotar precios por idioma a mano</summary><p class="v4note">Si prefieres, escribe tú el anuncio más barato y la venta que conozcas en cada idioma: el cálculo usa tus cifras.</p>'+
 '<div class="cpLang">'+LANGS.map(([k,n])=>{const v=s[k]||{};return '<label><span>'+n+'</span><input inputmode="decimal" placeholder="compra €" aria-label="Compra en '+n+'" data-cp-lbuy="'+E(x.id)+'|'+k+'" value="'+(N(v.buy)?String(v.buy).replace(".",","):"")+'"><input inputmode="decimal" placeholder="venta €" aria-label="Venta en '+n+'" data-cp-lsell="'+E(x.id)+'|'+k+'" value="'+(N(v.sell)?String(v.sell).replace(".",","):"")+'"><select aria-label="Estado en '+n+'" data-cp-lcond="'+E(x.id)+'|'+k+'"><option value="buen">Buen estado</option><option value="mal"'+(v.cond==="mal"?" selected":"")+'>Mal estado</option></select></label>'}).join("")+'</div>'+
 '<button type="button" class="v4btn primary" data-cp-lsave="'+E(x.id)+'">Guardar precios por idioma</button></details>';
}
/* V138 · Internacional sin compra confirmada en su idioma: precio OBJETIVO. «Cómprala en inglés por ≤ X € (con envío
   ≤ Y €) → la vendes a S € → ganas ≥ tu mínimo». No depende de pokemontcg.io: con la guía basta. Así las internacionales
   salen siempre en «Todos los idiomas» (antes, sin «EX o mejor», desaparecían y solo quedaban japonesas). */
function tgtOf(x,c,cond){
 if(x.kind!=="pk"&&x.kind!=="lo"&&x.kind!=="jp")return null;const p=x.p,S=saleRef(p);/* V140: japonesas también (idioma seguro, estado por confirmar) */if(!Number.isFinite(S)||S<40)return null;/* V140: también Lorcana */
 const mal=cond==="mal",sale=mal?S*c.restLow:S,net=netSale(sale,c);/* mal estado: restaurada se vende al restLow (60 %) de su valor, conservador */
 const maxPay=Math.min(net-minP(x,c),net/(1+(Number.isFinite(c.minMargin)?c.minMargin:25)/100),c.maxBuy),maxBuy=Math.floor((maxPay-c.buyShip)*100)/100;if(!(maxBuy>=20))return null;/* lo que pagas deja tu beneficio Y tu margen mínimos */
 /* realista: en buen estado hay que pagar ≥ 60 % de su valor (una inglesa al 20 % no existe: sería coreana o falsa); en mal estado ≥ 25 % */
 if(maxBuy<S*(mal?TGT_MIN_MAL:TGT_MIN))return null;
 const cheap=Math.min(...[p.low,mal?NaN:p.exPlus].filter(Number.isFinite));if(!Number.isFinite(cheap)||cheap>maxBuy)return null;/* ni el más barato de cualquier idioma llega: no hay nada que buscar */
 const pid=x.res?.pid,jp=x.kind==="jp";return {mal,jp,S,sale,maxPay,maxBuy,gain:net-maxPay,cheap,url:pid?"https://www.cardmarket.com/es/"+cmGame(x)+"/Products?idProduct="+encodeURIComponent(pid)+(jp?"":"&language=1")+(mal?"":"&minCondition=3")+(x.fo?"&isFoil=Y":""):links(x).cm};
}
const TGT_MIN=.6,TGT_MIN_MAL=.25;
const LANGUP=o=>({jp:"JAPONÉS",ja:"JAPONÉS",en:"INGLÉS"})[o]||"";
/* La línea que manda: qué comprar, en qué idioma, dónde, lo que pagas, a cuánto la vendes y lo que ganas. */
function decide(x,c){
 const o=goodOp(x.best,x,c)?x.best:null;
 if(o){const lang=o.ctl||o.cn?String(o.lang).toUpperCase():o.k==="ct"?(x.kind==="jp"?"JAPONÉS":"INGLÉS"):o.k==="shop"||x.kind==="jp"?"JAPONÉS":o.us?"INGLÉS":o.own?String(o.lang||"").toUpperCase():x.kind==="lo"?"idioma sin indicar":"idioma sin indicar (a precio de mercado: no es una coreana barata)";
  const where=o.where?o.where:o.us?"TCGplayer (EE. UU.), importada":o.k==="ct"||o.ctl?"CardTrader":o.k==="shop"?o.shop:"Cardmarket",cond=o.cn?"NM"+(x.fo?" · foil":""):o.k==="ex"?"EX o mejor":o.k==="ct"||o.ctl?"NM/EX":o.k==="po"?"mal estado (restaurar)":"estado sin indicar";
  return {k:"buy",text:"COMPRA en "+where+" · "+lang+" · "+cond+": pagas "+EUR(o.cost)+" (carta "+EUR(o.buy)+" + envío"+(o.us||o.k==="shop"&&o.costFull?", IVA y gestión":"")+") → la vendes "+(o.ctl?"en "+String(o.lang).toLowerCase()+" (Cardmarket o CardTrader)":"en Cardmarket")+" a "+EUR(o.sale)+(x.kind==="jp"?" (ventas de japonesas)":"")+" → ganas "+SIGNED(o.profit),
   html:'<div class="cpDecide buy"><b>✅ COMPRA</b> en <b>'+E(where)+'</b> · <b>'+E(lang)+'</b> · '+E(cond)+'<br>Pagas <b>'+EUR(o.cost)+'</b> (carta '+EUR(o.buy)+' + envío) → la vendes '+(o.ctl?'en '+E(String(o.lang).toLowerCase())+' (Cardmarket o CardTrader)':'en Cardmarket')+' a <b>'+EUR(o.sale)+'</b>'+(x.kind==="jp"?' (ventas de japonesas)':'')+' → <b class="pos">ganas '+SIGNED(o.profit)+'</b>'+(o.ctl?'<br><small>Venta estimada con lo que piden los otros '+o.exitN+' vendedores de '+E(String(o.lang).toLowerCase())+' en CardTrader, −5 % para venderla antes y nunca por encima de su valor en Cardmarket ('+EUR(saleRef(x.p))+'). Son precios pedidos, no ventas cerradas: confianza como mucho 60/100.</small>':'')+'</div>'};}
 if(x.langPend){const lg=selLang(),nm=(LNAME2[lg]||"").toLowerCase(),r=ctRes[x.id],url=links(x).cm;
  return {k:"check",text:"POR COMPROBAR EN "+nm.toUpperCase(),html:'<div class="cpDecide check"><b>🔎 POR COMPROBAR EN '+E(nm.toUpperCase())+'</b> · aún sin precio de venta en '+E(nm)+': su valor en Cardmarket (~'+EUR(saleRef(x.p))+') mezcla todos los idiomas y en '+E(nm)+' suele ser otro, así que no te doy un beneficio inventado.<br><small>'+(!ctToken()?'Conecta CardTrader para ver sus anuncios en '+E(nm)+'. ':r?.loading?'⏳ CardTrader la está consultando en '+E(nm)+'. ':r?.rows?(r.rows.some(o=>o.lang===lg)?'CardTrader tiene anuncios en '+E(nm)+' pero ninguno deja tu beneficio. ':'CardTrader no tiene ninguna en '+E(nm)+' entre las más baratas ahora. '):'CardTrader la buscará en '+E(nm)+'. ')+'También puedes pegar su ficha filtrada en «Pegar datos». <a href="'+E(url)+'" target="_blank" rel="noopener noreferrer">Ver solo anuncios en '+E(nm)+' ↗</a></small></div>'}}
 const t=x.tgt;if(t){const head=t.jp?(t.mal?"🔧 BUSCA EN MAL ESTADO · JAPONÉS":"🔎 BUSCA EN BUEN ESTADO · JAPONÉS"):t.mal?"🔧 BUSCA EN INGLÉS EN MAL ESTADO":"🔎 BUSCA EN INGLÉS",sell=t.mal?"restaurada la vendes a ~"+EUR(t.sale)+" ("+Math.round(c.restLow*100)+" % de su valor, conservador)":"la vendes en Cardmarket a "+EUR(t.S);
  return {k:"check",text:head.replace(/^\S+ /,"")+": cómprala solo si la encuentras a ≤ "+EUR(t.maxBuy)+" (≤ "+EUR(t.maxPay)+" con envío) → "+sell+" → ganas ≥ "+EUR(t.gain),
  html:'<div class="cpDecide check"><b>'+head+'</b> · cómprala solo si la encuentras a <b>≤ '+EUR(t.maxBuy)+'</b> ('+Math.round(t.maxBuy/t.S*100)+' % de su valor; ≤ '+EUR(t.maxPay)+' con envío) → '+E(sell).replace(EUR(t.mal?t.sale:t.S),'<b>'+EUR(t.mal?t.sale:t.S)+'</b>')+' → <b class="pos">ganas ≥ '+EUR(t.gain)+'</b><br><small>'+(t.jp?(t.mal?'Japonesa (idioma seguro). Mira en las fotos que sea restaurable. ':'Japonesa (idioma seguro). El anuncio más barato ('+EUR(t.cheap)+') no dice el estado: puede estar jugada; el enlace abre solo EX o mejor. '):t.mal?'Cardmarket no separa el estado ni el idioma en su precio más barato ('+EUR(t.cheap)+'): mira fotos (que sea restaurable) y que sea inglesa. ':'El anuncio más barato ('+EUR(t.cheap)+') no dice el idioma: puede ser coreano o chino, que valen menos. ')+(ctRes[x.id]?.rows?'CardTrader no tiene ninguna en inglés por debajo de ese precio ahora.':ctToken()?'CardTrader la comprobará en inglés.':'')+' <a href="'+E(t.url)+'" target="_blank" rel="noopener noreferrer">'+(t.jp?'Ver solo EX o mejor ↗':'Ver solo anuncios en inglés ↗')+'</a></small></div>'}}
 return null;
}
/* V142 · Vídeos: búsqueda en YouTube de cómo distinguir esa carta real de una falsa y de análisis de su precio (no se
   inventa ningún vídeo: se abre la búsqueda) */
function ytLinks(x){const g=x.kind==="lo"?BXG[gOf(x)].yt:"pokemon",q=x.name+" "+String(x.set).replace(/\s*\(japon[eé]s\)$/i,"")+" "+(x.kind==="jp"?"japanese ":"")+g,Y=t=>"https://www.youtube.com/results?search_query="+encodeURIComponent(t);
 return '<a class="v4btn" href="'+E(Y(q+" real vs fake"))+'" target="_blank" rel="noopener noreferrer">🎥 ¿Es auténtica? Vídeos ↗</a><a class="v4btn" href="'+E(Y(q+" price analysis"))+'" target="_blank" rel="noopener noreferrer">📺 Análisis de su precio ↗</a>'}
function cardHtml(x,rank,c,pre="cp-"){
 const p=x.p,ob=x.best||x.ops.filter(o=>Number.isFinite(o.profit)).sort((a,b)=>b.profit-a.profit)[0]||null,b=ob,out=ob&&!opIn(ob),[sc,st]=STAT[x.res.status]||["",""],l=links(x),S=saleRef(p),w=x.watch;
 const alts=x.kind==="pk"&&x.res.status!=="verificado"?(window.CV_CM_MAP?.[x.id]||[]).slice(2).map(G).filter(Boolean):[];
 return '<article class="v4card cpCard" id="'+pre+E(x.id)+'" data-cpid="'+E(x.id)+'" data-game="'+(x.kind==="lo"?"lorcana":"pokemon")+'">'+
 '<figure class="v4photo">'+img(x)+'<div class="v4noimg"'+(img(x)?' hidden':'')+'><b>'+E(x.name)+'</b><span>'+E(x.set)+' nº '+E(x.number)+'</span></div><figcaption>Imagen de catálogo · el ejemplar se ve en el anuncio</figcaption></figure>'+
 '<div class="v4body"><div class="v4badges">'+(rank?'<span class="v4tag rank">#'+rank+'</span>':'')+(x.hit?'<span class="v4status s-comprobada">¡BAJO TU PRECIO!</span>':'')+(x.isNew?'<span class="v4status s-comprobada">🆕 NUEVA</span>':'')+(x.tgtOnly?'<span class="v4status s-observacion">'+(x.tgt.mal?'🔧 BUSCA EN MAL ESTADO':x.tgt.jp?'🔎 BUSCA EN BUEN ESTADO':'🔎 BUSCA EN INGLÉS')+'</span>':'')+(x.hot?'<span class="v4status s-comprobada">🔥 BAJÓ '+Math.round(x.dl.drop*100)+' % DESDE AYER</span>':'')+'<span class="v4tag '+sc+'">'+st+'</span><span class="v4tag">'+(x.kind==="lo"?BXG[gOf(x)].name:"Pokémon")+'</span><span class="v4tag">'+E(x.liq.t)+'</span>'+(Number.isFinite(x.mom)&&Math.abs(x.mom)>=.1?'<span class="v4tag">'+(x.mom>0?"▲ ":"▼ ")+PCT(x.mom)+' semana</span>':'')+'</div>'+
 '<h3>'+E(x.name)+'</h3><p class="v4id">'+E(x.set)+' · nº '+E(x.number)+' · '+E(x.rarity||"—")+'</p>'+(decide(x,c)?.html||'')+
 (x.dl&&Math.abs(x.dl.drop)>=.1?'<p class="v4note cpDelta">«Desde» en Cardmarket: '+EUR(x.dl.lo0)+' ayer → <b>'+EUR(x.dl.lo)+'</b> hoy ('+PCT(-x.dl.drop)+'). '+(x.dl.drop>0?'Un anuncio barato acaba de aparecer: puede venderse en horas.':'')+'</p>':'')+
 moneyHtml(x,b,c,out)+
 confHtml(x,b)+
 langLine(x)+jpRouteLine(x,c)+
 (x.res.status!=="verificado"&&x.res.status!=="una-fuente"&&x.res.status!=="bindex"&&x.res.status!=="pt-only"||alts.length?'<p class="v4missing"><b>Versión:</b> '+E(x.res.why)+(alts.length?' · otras versiones con el mismo nombre: '+alts.map(a=>EUR(a.trend)).join(", ")+'. En Cardmarket comprueba que el número es <b>'+E(x.number)+'</b>.':'')+'</p>':'')+
 buyTable(x,c)+sameLangTable(x,c)+opRows(x,c)+
 '<details class="v4more"><summary>Datos de Cardmarket e historial</summary><p class="v4note">Guía oficial de Cardmarket '+E(DATE(p.date))+': «desde» '+EUR(p.low)+(Number.isFinite(p.exPlus)?' · «desde» EX o mejor '+EUR(p.exPlus):'')+' · tendencia '+EUR(p.trend)+' · media 1 día '+EUR(p.avg1)+' · 7 días '+EUR(p.avg7)+' · 30 días '+EUR(p.avg30)+'. '+(x.kind==="jp"?'Producto japonés: todos los estados, solo cartas japonesas.':'Todos los idiomas y estados.')+' '+E(x.res.why)+'.</p>'+
 (x.res.pid&&x.kind!=="lo"?'<div class="cpHist" data-cp-hist="'+E(x.res.pid)+'"><button type="button" class="v4btn" data-cp-histload="'+E(x.res.pid)+'">Ver historial de precio</button></div>':x.kind==="lo"&&x.x?.setId?'<div class="cpHist" data-cp-hist="'+E(x.id)+'"><button type="button" class="v4btn" data-cp-histload="'+E(x.id)+'">Ver historial de precio</button></div>':'')+'</details>'+
 '<div class="cpCT" data-cp-ct="'+E(x.id)+'">'+(ctRes[x.id]?ctHtml(ctRes[x.id]):'<button type="button" class="v4btn" data-cp-ctload="'+E(x.id)+'">Precios por idioma ahora (CardTrader)</button>')+'</div>'+
 pasteBox(x)+langBox(x)+
 '<div class="cpWatch">'+(w?'Vigilando: avisa si baja de <b>'+EUR(w.target)+'</b> <button type="button" class="v4btn" data-cp-unwatch="'+E(x.id)+'">Dejar de vigilar</button>':'<label>Avisar si la compra baja de <input inputmode="decimal" data-cp-target="'+E(x.id)+'" value="'+(b&&Number.isFinite(b.maxBuy)&&b.maxBuy>0?String(Math.floor(b.maxBuy)):"")+'" aria-label="Precio objetivo"> €</label><button type="button" class="v4btn" data-cp-watch="'+E(x.id)+'">Vigilar</button>')+'</div>'+
 '<details class="v4more cpCheck"><summary>Antes de pagar (30 segundos)</summary><ol class="v4help"><li>El anuncio es de esta carta: mismo número <b>'+E(x.number)+'</b>, edición e idioma'+(x.kind==="jp"?' (japonés)':'')+'.</li><li><b>Que no sea proxy ni falsa:</b> lee la descripción entera. Si dice «proxy», «réplica», «custom», «fan art», «orica», «no original» o «reproducción», NO la compres (y si el precio está por debajo del 30 % de lo que vale, sospecha siempre).</li><li><b>¿Es auténtica?</b> Compara las fotos con la imagen de la carta: código de colección y número abajo, tipografía'+(x.kind==="jp"?' japonesa':'')+', textura y brillo del holo, y el reverso. Al recibirla: mismo tamaño y grosor que una tuya; si dudas, reclama antes de confirmar la recepción. Graduada: comprueba el certificado en la web de PSA/CGC/Beckett.</li><li>Estado y fotos: si cuesta más de 50 €, pide fotos reales del anverso y reverso (bordes, esquinas, rayas).</li><li>Vendedor: muchas ventas, buena valoración y país de envío (el envío a 41020 cambia el coste).</li><li>Precio total con envío ≤ <b>'+EUR(b&&Number.isFinite(b.maxBuy)?b.maxBuy+c.buyShip:NaN)+'</b> (tu compra máxima para ganar '+EUR(c.minProfit)+').</li><li>Paga siempre dentro de Cardmarket, con envío certificado si supera 25 €. Nunca fuera de la plataforma.</li></ol></details>'+
 '<div class="v4actions"><a class="v4btn primary" href="'+E(l.cm)+'" target="_blank" rel="noopener noreferrer">Abrir en Cardmarket ↗</a>'+ytLinks(x)+(x.ops.find(o=>o.us)?'<a class="v4btn" href="'+E(x.ops.find(o=>o.us).url)+'" target="_blank" rel="noopener noreferrer">Comprar en TCGplayer ↗</a>':'')+(x.kind!=="lo"?'<button type="button" class="v4btn" data-cp-promote="'+E(x.id)+'">Registrar este anuncio</button>':'')+'</div></div></article>';
}
/* V145 · Las tres cajas dicen LO MISMO que la línea de decisión: qué pagas (o tu precio máximo), a cuánto la vendes y
   cuánto ganas. Nunca enseñan un «desde» de otro idioma o estado como si fuera la compra. */
function moneyHtml(x,b,c,out){
 const box=(cls,h,v,sm)=>'<div'+(cls?' class="'+cls+'"':'')+'><span>'+h+'</span><b>'+v+'</b><small>'+sm+'</small></div>',S=saleRef(x.p),g=goodOp(b,x,c)&&!out;
 const whereOf=o=>o.where||(o.us?"TCGplayer (EE. UU.)":o.k==="ct"||o.ctl?"CardTrader":o.k==="shop"?o.shop:"Cardmarket");
 const langOf=o=>o.ctl||o.cn?String(o.lang):o.k==="ct"?(x.kind==="jp"?"japonés":"inglés"):o.k==="shop"||x.kind==="jp"?"japonés":o.us?"inglés":o.own?String(o.lang||""):"idioma sin indicar";
 if(g)return '<div class="cpMoney">'+box('','Pagas en '+E(whereOf(b)),EUR(b.cost),'carta '+EUR(b.buy)+' + envío'+(b.us?', IVA y gestión':'')+' · '+E(langOf(b).toLowerCase())+(b.own&&b.sameLang?' · mismo idioma':'')+(b.k==="ex"?' · EX o mejor':b.k==="ct"||b.ctl||b.cn?' · NM':''))+
  box('','La vendes a',EUR(b.sale),b.ctl?'en '+E(String(b.lang).toLowerCase())+' (lo que piden los demás −5 %)':b.own&&b.sameLang?'ventas en '+E(String(b.lang).toLowerCase())+' (comprobadas)':x.kind==="jp"?'ventas reales de japonesas en Cardmarket':'ventas reales en Cardmarket')+
  box('pos','Ganas',SIGNED(b.profit),'margen '+PCT(b.margin)+' · ya descontados comisión y envíos')+'</div>';
 const t=x.tgt;
 if(x.tgtOnly&&t)return '<div class="cpMoney">'+box('','Paga como máximo','≤ '+EUR(t.maxPay),'con envío (carta ≤ '+EUR(t.maxBuy)+') · '+(t.jp?'japonés':'inglés')+(t.mal?' · mal estado':t.jp?' · EX o mejor':''))+
  box('','La vendes a',EUR(t.mal?t.sale:t.S),t.mal?'restaurada ('+Math.round(c.restLow*100)+' % de su valor, conservador)':'ventas reales en Cardmarket')+
  box('pos','Ganas','≥ '+EUR(t.gain),'si la encuentras a ese precio')+'</div>';
 if(x.langPend)return '<div class="cpMoney">'+box('','Compra','—','aún sin precio en '+E((LNAME2[selLang()]||'').toLowerCase()))+box('','Valor en Cardmarket',EUR(S),'todos los idiomas mezclados')+box('','Ganas','—','sin dato del idioma, no se inventa')+'</div>';
 if(b)return '<div class="cpMoney">'+box('','Mejor compra encontrada',EUR(b.cost),'en '+E(whereOf(b))+' · '+E(langOf(b).toLowerCase())+(out?' · fuera de tu presupuesto':''))+box('','La vendes a',EUR(b.sale),'ventas reales en Cardmarket')+
  box('neg','Ganas',SIGNED(b.profit),'no llega a tu mínimo ('+EUR(minP(x,c))+' y '+(c.minMargin??25)+' %)')+'</div>';
 return '<div class="cpMoney">'+box('','Compra','—','ninguna compra comparable hoy (mismo idioma y estado)')+box('','Valor en Cardmarket',EUR(S),'ventas reales')+box('','Ganas','—','')+'</div>';
}
function confHtml(x,b){
 const k=confidence(x,b),P=k.parts,lvl=k.score>=75?"ok":k.score>=50?"mid":"low";
 return '<div class="cpConf '+lvl+'"><div class="cpConfBar" role="img" aria-label="Confianza '+k.score+' de 100"><i style="width:'+k.score+'%"></i></div><p><b>Confianza '+k.score+'/100</b>'+(b&&Number.isFinite(k.prudent)?' · beneficio prudente <b>'+SIGNED(k.prudent)+'</b>':'')+'</p><small>Versión '+P.version+'/25 · ventas '+P.ventas+'/20 · estabilidad '+P.estabilidad+'/20'+(Number.isFinite(k.disp)?' (medias a ±'+Math.round(k.disp*50)+' %)':'')+' · tendencia '+P.tendencia+'/10 · colchón '+P.colchon+'/10 · estado '+P.estado+'/15'+(P.estado===0&&b&&b.cond==="buen"?' (el «desde» no dice el estado: abre la ficha con «EX o mejor»)':'')+'</small></div>';
}
/* 🎯 Punto de mira: anuncios muy por debajo de lo que la carta vale y se vende. Ejemplo: vale ~80 € y alguien la pone a
   30 €. Criterios (todos con la guía real): «desde» ≤ 60 % de la venta de referencia, venta ≥ 40 €, se vende cada semana,
   precio estable (medias a ±25 %) y versión fiable. Suele volar: o es un error de precio o la carta tiene un defecto u
   otro idioma; por eso va con su comprobación de 1 minuto. */
function sniper(){
 const c=cfg(),lg=selLang();let all=[];
 if(!isBx(view.game)&&lg!=="ja")all=all.concat(cardsPk());if(!isBx(view.game)&&(!lg||lg==="ja"))all=all.concat(cardsJp());if(!lg)all=all.concat(loPool(""));
 const out=[];
 for(const x of all){const p=x.p,S=saleRef(p);if(x.kind!=="jp")continue;/* V131: el «desde EX o mejor» internacional no dice el idioma; tan barato, suele ser coreano o chino */
  if(!Number.isFinite(S)||S<40||!Number.isFinite(p.exPlus)||p.exPlus>S*.6||p.exPlus<S*FAKE_RATIO||p.exPlus+c.buyShip>c.maxBuy)continue;/* solo «desde» EX o mejor: el de cualquier estado engaña */
  if((x.liq?.k||0)<2||(TRUST[x.res?.status]??0)<2)continue;
  const xs=[p.avg1,p.avg7,p.avg30,p.trend].filter(Number.isFinite),disp=xs.length>=2?(Math.max(...xs)-Math.min(...xs))/S:1;if(disp>.25)continue;
  const cost=p.exPlus+c.buyShip,profit=netSale(S,c)-cost;if(profit<c.minProfit||!mgOk(profit,cost,c))continue;
  out.push({x:{...x,dl:x.res?.pid?delta(x.res.pid):null,best:{k:"ex"}},S,low:p.exPlus,cost,profit,ratio:p.exPlus/S,isNew:!!(x.res?.pid&&delta(x.res.pid)?.drop>=.15)})}
 return out.sort((a,b)=>(b.isNew-a.isNew)||b.profit-a.profit);
}
/* 🇯🇵 Comprar japonesas (V132). Solo lo que se puede comprobar:
   1) Cardmarket, ficha SOLO japonesa: el «desde» es el anuncio real más barato de hoy (guía oficial), Cardmarket envía a
      41020, cobra el IVA antes de pagar en pedidos de vendedores de fuera de la UE de menos de 150 € (IOSS, desde enero de
      2026) y tiene protección al comprador (si llega falsa, se reclama). Desde el 1/7/2026 la UE cobra además 3 € de
      arancel por paquete pequeño de fuera de la UE.
   2) Comprar EN Japón (tiendas como Hareruya2 o Card Rush, o Mercari/Yahoo vía Buyee): sus precios NO se pueden leer
      desde la app (sin acceso público), así que no se inventan: calculadora con el precio que tú veas → total puesto en
      41020 = (precio + envío en Japón + comisión de Buyee ¥500 + EMS) × cambio + arancel 3 € + IVA 21 % sobre todo eso +
      gestión del transportista. EMS: mínimo ¥3.450 (Japan Post, tarifa publicada por Hareruya). Cambio del BCE.
   Antes (V124–V131) aquí salía un «máximo a pagar en Japón» sin ningún anuncio real: no servía para comprar y se quita. */
const JKEY="cv_v124_jp",FXKEY="cv_v124_fx";let jp={shipUS:15,vat:21,handling:15,ems:3450,buyee:500,dom:0,duty:3,...readLS(JKEY,{})},fx=readLS(FXKEY,{});
function impCfg(){return jp}/* supuestos de importación (Japón y EE. UU.) */
async function loadFx(){
 const today=new Date().toISOString().slice(0,10);if(fx.date===today&&N(fx.rate)&&(N(fx.usd)||fx.usdTried===today))return;/* un intento al día aunque falle el dólar */
 try{const [j,u]=await Promise.all([getJSON("https://api.frankfurter.app/latest?from=JPY&to=EUR",null,15000,1),getJSON("https://api.frankfurter.app/latest?from=USD&to=EUR",null,15000,1).catch(()=>null)]),r=N(j?.rates?.EUR);if(r){fx={rate:r,usd:N(u?.rates?.EUR)||fx.usd,usdTried:today,date:today,ecb:j.date||""};writeLS(FXKEY,fx)}}catch{}
}
const YEN=v=>Number.isFinite(v)?"¥"+v.toLocaleString("es-ES"):"—";
/* Cardmarket (ficha solo japonesa): precio real de hoy, lo que pagas en 41020 y en qué estado puede estar */
function jpRoute(x,c){
 const p=x.p,S=saleRef(p);if(x.kind!=="jp"||!Number.isFinite(S)||!Number.isFinite(p.low))return null;
 const r=p.low/S,cost=p.low+c.buyShip,profit=netSale(S,c)-cost;
 const st=r<FAKE_RATIO?{k:"fake",t:"⛔ por debajo del 30 % de su valor: casi seguro proxy, falsa u otra carta"}:r>=LANG_OK?{k:"ok",t:"precio de mercado: anuncio normal"}:r<=.5?{k:"chollo",t:"🎲 muy barato: puede ser una ganga o estar dañada, míralo"}:{k:"mid",t:"estado sin indicar: puede estar jugada"};
 return {S,low:p.low,cost,profit,r,st,url:links(x).cm.replace(/&minCondition=3/,"")};
}
/* Comprar EN Japón: total puesto en 41020 a partir del precio que tú ves allí */
function jpCalc(yen,o={}){
 const rate=N(fx.rate);if(!Number.isFinite(yen)||!rate)return null;const dom=Number.isFinite(o.dom)?o.dom:jp.dom,fee=o.buyee===false?0:jp.buyee;
 const goods=(yen+dom+fee)*rate,ship=jp.ems*rate,duty=jp.duty,vat=(goods+ship+duty)*jp.vat/100,total=goods+ship+duty+vat+jp.handling;
 return {goods,ship,duty,vat,handling:jp.handling,total,rate,fee,dom};
}
function jpRouteLine(x,c){
 const r=jpRoute(x,c);if(!r)return '';
 return '<p class="cpLangSel">🇯🇵 <b>Cardmarket, solo japonesas:</b> anuncio más barato hoy <b>'+EUR(r.low)+'</b> → pagas '+EUR(r.cost)+' con envío → se vende a '+EUR(r.S)+' → '+SIGNED(r.profit)+' · '+E(r.st.t)+'. <a href="'+E(r.url)+'" target="_blank" rel="noopener noreferrer">Ver anuncios ↗</a></p>';
}
/* V135 · Sin calculadora de compra en Japón: el usuario solo quiere sitios CON precio (Cardmarket, CardTrader y tiendas
   cuyo precio se lea en vivo). */
const thumb=x=>{const h=img(x);return h?'<span class="cpThumb">'+h+'</span>':'<span class="cpThumb"></span>'};
/* 🏆 Top 5 de hoy: une todas las opciones (Cardmarket EX o mejor, «desde», TCGplayer importada, datos pegados por idioma,
   japonesas y sellado) y las ordena por beneficio prudente = beneficio × confianza. En sellado la confianza es 50 fija:
   Cardmarket no publica medias de venta de sellado. Sin presupuesto ni filtros de la vista: lo mejor del día. */
function top5(c){
 const cands=[];
 for(const x of cardsPk().concat(cardsJp(),cardsLo())){
  const o=x.ops.filter(o=>!o.mixLang&&!o.langUnk&&o.cond==="buen"&&goodOp(o,x,c)&&opIn(o)).sort((a,b)=>b.profit-a.profit)[0];
  if(!o||(TRUST[x.res?.status]??0)<2||(x.liq?.k||0)<minLiq(c))continue;const k=confidence(x,o);/* sin tocar x.best: la carta es la misma que pinta la lista */
  cands.push({kind:"card",x,o,conf:k.score,prudent:o.profit*k.score/100})}
 const inTop=new Set(cands.map(t=>t.x.id));/* una carta solo una vez: si ya tiene compra fiable, no se repite como chollo */
 for(const h of chollos(c))if(!inTop.has(h.x.id))cands.push({kind:"chollo",x:h.x,o:h.op,h,conf:h.conf,prudent:h.profit*h.conf/100});
 const S=window.CVSellado?.rows?.()||[];
 for(const r of S)if(r.arb&&r.cost<=c.maxBuy&&r.ratio>=LANG_OK)/* V131: sellado más barato suele ser coreano o chino */cands.push({kind:"sealed",r,conf:50,prudent:r.profit*.5});
 let nCh=0;/* como mucho 3 chollos sin verificar: el resto del Top 5 queda para compras fiables */
 return cands.sort((a,b)=>b.prudent-a.prudent).filter(t=>t.kind!=="chollo"||++nCh<=3).slice(0,5);
}
function top5Html(c){
 if(!M.guide)return '';const T=top5(c);
 return '<section class="cpTop"><h4>🏆 Top 5 de hoy · lo que yo compraría</h4>'+(T.length?'<ol class="cpPlanList">'+T.map((t,i)=>{
  if(t.kind==="sealed"){const r=t.r,u="https://www.cardmarket.com/es/Pokemon/Products?idProduct="+encodeURIComponent(r.pid);return '<li><span class="cpThumb">📦</span><span><b>'+(i+1)+'. '+E(r.name)+'</b> · sellado ('+E(r.type)+')</span><a class="v4btn primary" href="'+E(u)+'" target="_blank" rel="noopener noreferrer">Comprar ↗</a><small><b>Pagas '+EUR(r.cost)+'</b> (Cardmarket «desde» '+EUR(r.low)+' + envío) → reventa a su tendencia '+EUR(r.trend)+' → '+SIGNED(r.profit)+' · confianza 50/100 (sellado: sin medias de venta) · prudente '+SIGNED(t.prudent)+'</small></li>'}
  if(t.kind==="chollo"){const x=t.x,h=t.h,u=links(x).cm.replace(/&minCondition=3/,"");return '<li>'+thumb(x)+'<span><b>'+(i+1)+'. '+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+' · 🎲 por verificar</span><a class="v4btn primary" href="'+E(u)+'" target="_blank" rel="noopener noreferrer">Ver ya ↗</a><small><b>Pagas '+EUR(h.cost)+'</b> (anuncio de cualquier estado a '+EUR(h.low)+' + envío) → vale ~'+EUR(h.S)+' → si está bien '+SIGNED(h.profit)+' · confianza '+t.conf+'/100 (estado sin comprobar) · prudente '+SIGNED(t.prudent)+'. Lee la descripción: si dice «proxy» es falsa.</small></li>'}
  const x=t.x,o=t.o,u=o.url||links(x).cm,where=o.us?"TCGplayer (EE. UU.), importada":o.k==="shop"?o.shop:o.cn?o.where+", "+String(o.lang).toLowerCase()+" NM":o.ctl?"CardTrader, "+String(o.lang).toLowerCase()+" NM/EX":o.k==="ct"?"CardTrader, "+(x.kind==="jp"?"japonés":"inglés")+" NM/EX":o.k==="ex"?"Cardmarket, EX o mejor":o.own?"Cardmarket, "+(o.lang||"").toLowerCase():"Cardmarket «desde»";
  const lg=o.ctl||o.cn?String(o.lang).toUpperCase():o.k==="ct"?(x.kind==="jp"?"JAPONÉS":"INGLÉS"):o.k==="shop"||x.kind==="jp"?"JAPONÉS":o.us?"INGLÉS":o.own?String(o.lang||"").toUpperCase():"idioma sin indicar";
  return '<li>'+thumb(x)+'<span><b>'+(i+1)+'. '+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+' · <b>'+E(lg)+'</b></span><a class="v4btn primary" href="'+E(u)+'" target="_blank" rel="noopener noreferrer">Comprar ↗</a><small><b>Pagas '+EUR(o.cost)+'</b> ('+E(where)+', puesta en 41020) → venta '+EUR(o.sale)+' → <b>'+SIGNED(o.profit)+'</b> · confianza '+t.conf+'/100 · prudente '+SIGNED(t.prudent)+'. '+E(x.liq.t)+'.</small></li>'}).join("")+'</ol>':'<p class="v4note">Hoy ninguna opción deja tu beneficio mínimo con suficiente confianza.</p>')+
 '<p class="v4note">Une todas las opciones (Cardmarket, TCGplayer importada, japonesas, idiomas pegados y sellado) y las ordena por beneficio × confianza. Solo con compra y venta del mismo idioma: un anuncio internacional por debajo del 75 % de su valor suele ser coreano o chino y no entra. Ninguna es segura: comprueba cada anuncio con «Antes de pagar».</p></section>';
}
/* Dónde comprarla más barata: todas las vías, con el coste puesto en 41020. */
/* V133 · Tiendas que envían a 41020 (comprobado en sus webs y guías, oct-2026):
   · Zenpan EU: japonesas con stock en Lisboa (Portugal) → IVA incluido y SIN aduana.
   · Zenpan Japan y Hareruya2 (Japón): envío internacional; al llegar, IVA, arancel de 3 € y gestión.
   Son tiendas Shopify: la app intenta leer su buscador (search/suggest.json) desde tu iPhone. Si la tienda no lo permite
   (CORS), no se inventa nada: sale su enlace de búsqueda y la calculadora. «Probar tiendas» dice cuáles se pueden leer. */
const SHOPS=[
 {id:"zenpan-eu",name:"Zenpan EU",where:"Lisboa, UE",eu:true,root:"https://zenpan-eu.com",search:"https://zenpan-eu.com/search?q=",note:"stock en la UE: IVA incluido, sin aduana"},
 {id:"zenpan-jp",name:"Zenpan Japan",where:"Japón",eu:false,root:"https://zenpan-japan.com",search:"https://zenpan-japan.com/search?q=",note:"envío internacional con seguimiento"},
 {id:"hareruya2",name:"Hareruya2",where:"Japón",eu:false,root:"https://www.hareruya2.com",search:"https://www.hareruya2.com/en/search?q=",note:"tienda de Pokémon; mira en su carrito si envía a España"}];
const SHKEY="cv_v133_shops";let shopSt=readLS(SHKEY,{});const shopRes={};
const shopQ=x=>x.name+" "+String(x.number||"").split("/")[0];
function toEur(v,cur){const n=Number(String(v??"").replace(/[^\d.]/g,""));if(!Number.isFinite(n)||n<=0)return NaN;return cur==="EUR"?n:cur==="JPY"?(N(fx.rate)?n*fx.rate:NaN):cur==="USD"?(N(fx.usd)?n*fx.usd:NaN):NaN}
/* importación desde fuera de la UE: envío EMS + arancel + IVA sobre todo + gestión */
function impFromEur(g){const r=N(fx.rate);if(!Number.isFinite(g)||!r)return NaN;const ship=jp.ems*r,vat=(g+ship+jp.duty)*jp.vat/100;return g+ship+jp.duty+vat+jp.handling}
async function shopGet(sh,q){
 const j=await getJSON(sh.root+"/search/suggest.json?q="+encodeURIComponent(q)+"&resources[type]=product&resources[limit]=10",null,12000,1);
 return (j?.resources?.results?.products||[]).map(o=>({title:String(o.title||""),price:o.price??o.price_min,url:o.url?(String(o.url).startsWith("http")?o.url:sh.root+o.url):"",available:o.available!==false}));
}
async function shopProbe(){
 for(const sh of SHOPS){try{const cart=await getJSON(sh.root+"/cart.js",null,12000,1),cur=String(cart?.currency||"").toUpperCase();await shopGet(sh,"pikachu");
   shopSt[sh.id]={ok:!!cur,currency:cur,err:cur?"":"no dice su moneda",at:Date.now()}}
  catch(e){shopSt[sh.id]={ok:false,err:String(e.message||e).slice(0,60)==="Error de red"||/fetch|red|load failed|network/i.test(String(e.message))?"la tienda no deja leer sus precios desde otra web":String(e.message||e).slice(0,60),at:Date.now()}}}
 writeLS(SHKEY,shopSt);
}
async function shopLoad(id,quiet){
 const x=cardsJp().find(c=>c.id===id);if(!x)return;shopRes[id]={loading:true};if(!quiet)renderNow();
 if(!SHOPS.some(sh=>shopSt[sh.id]))await shopProbe();const c=cfg(),num=String(x.number||"").split("/")[0].replace(/^0+/,""),nm=nrm(x.name).split(" ")[0],out={};
 for(const sh of SHOPS){const st=shopSt[sh.id];if(!st?.ok)continue;
  try{const L=(await shopGet(sh,shopQ(x))).filter(o=>o.available&&nrm(o.title).includes(nm)&&new RegExp("(^|\\D)0*"+num+"(\\D|$)").test(o.title)).map(o=>{const g=toEur(o.price,st.currency);return {...o,eur:g,total:sh.eu?g+c.buyShip:impFromEur(g)}}).filter(o=>Number.isFinite(o.total)).sort((a,b)=>a.total-b.total);
   out[sh.id]=L.length?{best:L[0],n:L.length}:{none:true}}catch(e){out[sh.id]={error:String(e.message||e).slice(0,60)}}}
 shopRes[id]={at:Date.now(),res:out};if(quiet)render();else renderNow();
}
/* V135: solo tiendas CON precio leído ahora (sin precio no se enseñan) */
function shopRows(x,c){
 if(x.kind!=="jp")return [];const rows=[],r=shopRes[x.id];
 for(const sh of SHOPS){const o=r?.res?.[sh.id];if(o?.best)rows.push([sh.name+" ("+sh.where+")",o.best.total,"precio leído ahora: «"+o.best.title+"» "+EUR(o.best.eur)+(sh.eu?" + envío estimado "+EUR(c.buyShip)+" (el real, en su carrito; "+sh.note+")":" + EMS, arancel, IVA "+jp.vat+" % y gestión")+(o.n>1?" · "+o.n+" coincidencias, la más barata":""),o.best.url,true])}
 return rows;
}
function buyTable(x,c){
 const p=x.p,rows=[],I=impCfg(),l=links(x),base=l.cm.split("&")[0];
 /* V139 · UNA fila por sitio. Cardmarket: la compra comparable (EX o mejor del mismo idioma, o «desde» a precio de mercado);
    si no hay, el más barato marcado «no comparable» con el enlace filtrado (inglés y EX o mejor). */
 {const S=saleRef(p),jp=x.kind==="jp",exOk=Number.isFinite(p.exPlus)&&(jp||p.exPlus>=S*LANG_OK),loOk=Number.isFinite(p.low)&&p.low>=S*.75;
  if(view.cond==="mal"&&Number.isFinite(p.low))rows.push(["Cardmarket · cualquier estado",p.low+c.buyShip,"«desde» de cualquier estado"+(jp?"":" y cualquier idioma (puede ser coreano o chino)")+" + envío "+EUR(c.buyShip),base+(jp?"":"&language=1"),jp]);
  else if(exOk)rows.push(["Cardmarket · EX o mejor",p.exPlus+c.buyShip,"«desde» EX o mejor"+(jp?" (japonés)":"")+" + envío "+EUR(c.buyShip),base+"&minCondition=3"+(jp?"":"&language=1"),true]);
  else if(loOk)rows.push(["Cardmarket · «desde»",p.low+c.buyShip,"anuncio más barato (a precio de mercado) + envío "+EUR(c.buyShip),base,true]);
  else{const ex=Number.isFinite(p.exPlus),v=ex?p.exPlus:p.low;if(Number.isFinite(v))rows.push(["Cardmarket",v+c.buyShip,"⚠ el más barato "+(ex?"EX o mejor":"de cualquier estado")+" ("+EUR(v)+") no dice "+(jp?"el estado":ex?"el idioma":"el idioma ni el estado")+": a ese precio puede ser coreano o chino, no comparable. El enlace abre solo "+(jp?"":"inglés y ")+"EX o mejor",base+"&minCondition=3"+(jp?"":"&language=1"),false])}}
 const us=x.ops.find(o=>o.us);if(us)rows.push(["TCGplayer (EE. UU.)",us.cost,"mercado + envío "+EUR(I.shipUS)+", IVA "+I.vat+" % y gestión "+EUR(I.handling),us.url,true]);
 const ct=ctRes[x.id],ctL=x.kind==="jp"?"japonés":"inglés";
 if(ctToken()&&(!ct||ct.loading))rows.push(["CardTrader",NaN,"⏳ consultando su anuncio en "+ctL+"…","https://www.cardtrader.com/",false]);
 else if(ct?.error)rows.push(["CardTrader",NaN,ct.error.replace(/^CardTrader: /,""),"https://www.cardtrader.com/",false]);
 else if(ct?.rows&&!(x.kind==="jp"?ct.rows.find(o=>o.lang==="jp"||o.lang==="ja"):ct.rows.find(o=>o.lang==="en"))?.cheapestGood)rows.push(["CardTrader",NaN,"no tiene ninguna en "+ctL+" NM/EX a la venta ahora","https://www.cardtrader.com/cards/"+encodeURIComponent(ct.bp),false]);
 if(ct&&ct.rows){const r=x.kind==="jp"?ct.rows.find(o=>o.lang==="jp"||o.lang==="ja"):ct.rows.find(o=>o.lang==="en");const a=r&&r.cheapestGood;
  if(a){const sh=Number.isFinite(a.ship);rows.push(["CardTrader · "+(LNAME[r.lang]||r.lang)+" "+(a.cond||"NM/EX"),a.eur+(sh?a.ship:c.buyShip),"anuncio "+EUR(a.eur)+(a.country?" (vendedor de "+a.country+")":"")+" + envío "+(sh?"real "+EUR(a.ship):"estimado "+EUR(c.buyShip)+" (CardTrader no lo dio)")+(a.hub?" · admite CardTrader Zero: revisan la carta antes de enviártela":""),"https://www.cardtrader.com/cards/"+encodeURIComponent(ct.bp),true])}}
 {const cn=cnRes[x.id],lk=x.kind==="jp"?"ja":"en",nm=(LNAME2[lk]||"").toLowerCase();/* V143 */
  if(cnKey()&&!cn&&Number(x.res?.pid))rows.push(["CardNexus",NaN,cnSt.busy?"⏳ revisando…":"aún sin revisar (se revisa sola cada hora)","https://cardnexus.com/",false]);
  else if(cn){const cm=N(cn.cm?.byCondition?.NM?.byLanguage?.[lk]?.low),xb=cn.cxBuy;
   if(Number.isFinite(cm))rows.push(["Cardmarket · "+nm+" NM",cm+c.buyShip,"anuncio más barato en "+nm+" y NM (dato de CardNexus, del día) + envío "+EUR(c.buyShip),"https://www.cardmarket.com/es/"+cmGame(x)+"/Products?idProduct="+encodeURIComponent(x.res.pid)+"&language="+CMID[lk]+"&minCondition=2"+(x.fo?"&isFoil=Y":""),true]);
   if(xb&&!xb.none)rows.push(["CardNexus · "+nm+" NM",xb.eur+(Number.isFinite(xb.ship)?xb.ship:c.buyShip),"anuncio "+EUR(xb.eur)+" de «"+xb.user+"» ("+xb.country+") + envío "+(Number.isFinite(xb.ship)?"real "+EUR(xb.ship):"estimado")+" · pago retenido hasta recibirla","https://cardnexus.com/",true]);
   else rows.push(["CardNexus",NaN,xb?.none?"no tiene ninguna en "+nm+" NM que envíe a España ahora":cn.cxErr?cn.cxErr:"su anuncio no deja tu beneficio","https://cardnexus.com/",false])}}
 rows.push(...shopRows(x,c));
  for(const r of rows)if(Number.isFinite(r[1])&&r[1]>c.maxBuy){r[2]+=" · fuera de tu presupuesto ("+EUR(c.maxBuy)+")";r[4]=false}
 rows.sort((a,b)=>(b[4]-a[4])||(Number.isFinite(a[1])?a[1]:1e9)-(Number.isFinite(b[1])?b[1]:1e9));/* primero lo comparable (mismo idioma y estado), de más barata a más cara */
 const ok=rows.filter(r=>r[4]&&Number.isFinite(r[1])),best=ok.reduce((m,r)=>!m||r[1]<m[1]?r:m,null),cmp=rows.filter(r=>r[4]),ref=rows.filter(r=>!r[4]);
 /* V145 · Dos bloques que no se mezclan: lo que SÍ puedes comprar (mismo idioma y estado) y, aparte y en gris, los precios de referencia
    que NO sirven como compra (otro idioma o estado posible). Así nunca hay dos «Cardmarket» con precios distintos sin explicar. */
 const tr=r=>'<tr'+(r===best?' class="best"':'')+'><th scope="row"><a href="'+E(r[3])+'" target="_blank" rel="noopener noreferrer">'+E(r[0])+' ↗</a></th><td class="'+(r===best?'pos':'')+'">'+(Number.isFinite(r[1])?EUR(r[1]):'—')+'</td><td><small>'+E(r[2])+'</small></td></tr>',t=x.tgtOnly&&x.tgt;
 return '<details class="v4more cpBuy" open><summary><span><b>Dónde comprarla</b>'+(best?' · lo más barato comparable: '+E(best[0])+' '+EUR(best[1])+' con envío':t?' · busca a ≤ '+EUR(t.maxPay)+' con envío':' · ninguna compra comparable hoy')+'</span></summary>'+
  (cmp.length?'<table class="cpLTtab"><caption>Compras comparables ('+(x.kind==="jp"?'japonés':'mismo idioma')+' y estado) · con envío a 41020</caption><tbody>'+cmp.map(tr).join("")+'</tbody></table>':'<p class="v4note">Ninguna tienda tiene hoy esta carta '+(x.kind==="jp"?'en japonés':'en inglés')+' y '+(view.cond==="mal"?'en mal estado':'en buen estado')+' con un precio que se pueda comprobar.</p>')+
  (ref.length?'<table class="cpLTtab cpRef"><caption>⚠ Solo referencia, NO es tu compra: el precio puede ser de otro idioma o estado</caption><tbody>'+ref.map(tr).join("")+'</tbody></table>':'')+
  (t?'<p class="v4note">👉 Tu precio máximo para ganar tu mínimo: <b>≤ '+EUR(t.maxPay)+' con envío</b> (carta ≤ '+EUR(t.maxBuy)+'). Si en la ficha encuentras una '+(t.jp?'japonesa':'inglesa')+(t.mal?' restaurable':'')+' a ese precio o menos, cómprala.</p>':'')+
  (ctRes[x.id]||ctToken()?'':'<p class="v4note">Con tu token de CardTrader («Estado de las fuentes») se añade su precio con envío real.</p>')+'</details>';
}
/* 🎲 Chollos por verificar: el anuncio más barato de CUALQUIER estado está al 50 % o menos de su valor, la carta se vende
   cada semana y lo que pagas cabe en tu presupuesto (caso real: Mewtwo & Mew GX de Miracle Twins a 50 €). Pueden ser
   gangas o cartas dañadas, de otro idioma o ya vendidas: el beneficio es «si está bien» y la confianza se reduce a la mitad.
   El enlace abre la ficha SIN filtro, para que veas ese mismo anuncio. */
let fakeN=0,langN=0;
function chollos(c){return memoOf("ch",()=>chollos_(c))}
function chollos_(c){
 const lg=selLang();let all=[];
 if(!isBx(view.game)&&lg!=="ja")all=all.concat(cardsPk());if(!isBx(view.game)&&(!lg||lg==="ja"))all=all.concat(cardsJp());if(!lg)all=all.concat(loPool(""));
 const out=[];fakeN=0;langN=0;
 for(const x of all){const p=x.p,S=saleRef(p);if(!Number.isFinite(S)||S<40||!Number.isFinite(p.low)||p.low<5||p.low>S*.5)continue;
  if(x.kind!=="jp"){langN++;continue}/* V131: idioma sin comprobar */
  if(p.low<S*FAKE_RATIO){fakeN++;continue}/* V130: proxy, falsa o error */
  if((x.liq?.k||0)<2||(TRUST[x.res?.status]??0)<2)continue;
  const cost=p.low+c.buyShip;if(cost>c.maxBuy)continue;const profit=netSale(S,c)-cost;if(profit<minP(x,c)||!mgOk(profit,cost,c))continue;
  const op={k:"low",cond:"buen",buy:p.low,cost,sale:S,profit,margin:profit/cost},k=confidence(x,op);
  x.dl=x.res?.pid?delta(x.res.pid):null;out.push({x,op,S,low:p.low,cost,profit,ratio:p.low/S,conf:Math.round(k.score/2),isNew:!!(x.dl&&x.dl.drop>=.15)})}
 return out.sort((a,b)=>(b.isNew-a.isNew)||b.profit*b.conf-a.profit*a.conf);
}
/* Comprobador: pega la descripción o el título de un anuncio y avisa si tiene palabras de proxy o falsificación. */
function fakeBox(){
 return '<details class="v4more cpFake" data-cp-fakebox><summary>🔎 ¿Es proxy? Pega aquí la descripción del anuncio</summary><textarea data-cp-faketxt rows="3" aria-label="Descripción del anuncio"></textarea><button type="button" class="v4btn primary" data-cp-fakecheck>Comprobar</button><p class="v4note" data-cp-fakeout role="status"></p></details>';
}
function fakeVerdict(t){const w=fakeWords(t);return w.length?'⛔ NO LA COMPRES: el anuncio dice «'+w.join("», «")+'». Es una carta proxy o falsa.':String(t||"").trim()?'✅ No veo palabras de proxy ni falsificación. Aun así mira las fotos (brillo, letra, borde y reverso) y la reputación del vendedor.':'Pega primero el texto del anuncio.'}
/* V146 · 🩹 MAL ESTADO BARATO: cartas en mal estado a precio muy bajo (por defecto ≤ 35 €) cuyo valor en buen estado es
   muy superior (≥ 2,5 veces) y que se venden de verdad (Cardmarket: ventas cada semana). Solo anuncios con el IDIOMA y el
   ESTADO comprobados: CardTrader (cada anuncio dice su estado) y Cardmarket por estado vía CardNexus; en japonesas, además,
   el «desde» de su ficha solo japonesa. Se vende TAL CUAL: precio = lo que piden otros vendedores en ese estado (−5 %) o la
   estimación prudente por estado, el MENOR de los dos. Restaurar es un extra, no se cuenta. */
function malCfg(c){return {max:N(c.malMax)||35,ratio:N(c.malRatio)||2.5,min:Number.isFinite(Number(c.malMinProfit))?Number(c.malMinProfit):15}}
function malHunt(c){return memoOf("mal",()=>malHunt_(c))}
function malHunt_(c){
 const m=malCfg(c),out=[];let seen=0;
 for(const x of cardsPk().concat(cardsJp(),loPool(""))){if(x.owned||(TRUST[x.res?.status]??0)<2||(x.liq?.k||0)<minLiq(c))continue;
  if(isBx(view.game)&&gOf(x)!==view.game||view.game==="pokemon"&&x.kind==="lo"||view.game==="jp"&&x.kind!=="jp")continue;
  const S=saleRef(x.p);if(!Number.isFinite(S)||S<m.ratio*10)continue;seen++;
  const lk=x.kind==="jp"?"ja":"en",cands=[],r=ctRes[x.id]?.rows?.find(o=>o.lang===lk);
  if(r?.bad?.length){const b0=r.bad[0],near=r.bad.slice(1).filter(o=>Math.abs(o.lvl-b0.lvl)<=1).slice(0,5).map(o=>o.eur),ex=near.length>=2?near[Math.floor(near.length/2)]:NaN;
   cands.push({where:"CardTrader",lvl:b0.lvl,cond:b0.cond,buy:b0.eur,ship:b0.ship,user:b0.user,country:b0.country,hub:b0.hub,exit:ex,exitN:near.length,url:"https://www.cardtrader.com/cards/"+encodeURIComponent(ctRes[x.id].bp)})}
  const cn=cnRes[x.id];if(cn)for(const [k,l] of [["MP",2],["HP",4],["DMG",5]]){const v=N(cn.cm?.byCondition?.[k]?.byLanguage?.[lk]?.low);if(Number.isFinite(v))cands.push({where:"Cardmarket",lvl:l,cond:k,buy:v,exit:NaN,exitN:0,url:"https://www.cardmarket.com/es/"+cmGame(x)+"/Products?idProduct="+encodeURIComponent(x.res.pid)+"&language="+CMID[lk]+(x.fo?"&isFoil=Y":"")})}
  let best=null;
  for(const o of cands){if(!(o.buy<=m.max)||o.buy<Math.max(3,S*.1)||S/o.buy<m.ratio)continue;/* < 10 % de su valor: proxy, falsa u otra carta */
   const est=S*LVLF[o.lvl],sale=Number.isFinite(o.exit)?Math.min(o.exit*.95,est):est,cost=o.buy+(Number.isFinite(o.ship)?o.ship:c.buyShip),profit=netSale(sale,c)-cost;
   if(profit<m.min||!mgOk(profit,cost,c))continue;const h={x,o,S,sale,est,cost,profit,ratio:S/o.buy,rest:S*c.restLow,shown:Number.isFinite(o.exit)&&o.exit*.95<=est};
   if(!best||h.profit>best.profit)best=h}
  if(best)out.push(best)}
 malSeen=seen;return out.sort((a,b)=>b.profit-a.profit);
}
let malSeen=0;
/* V147 · 🔎 POR COMPROBAR EN UN TOQUE: el anuncio más barato de Cardmarket (guía oficial) no dice idioma ni estado, pero en
   cartas que valen mucho y se venden cada semana, un anuncio a ≤ 35 € suele ser una carta jugada. No se inventa su estado:
   se calcula EN QUÉ ESTADO tiene que estar, como mínimo, para que vendiéndola tal cual ganes tu mínimo, y el enlace abre la
   ficha solo en su idioma ordenada por precio. Las primeras se consultan solas en CardTrader para pasarlas a comprobadas. */
function needLvl(S,cost,c,m){const f=Math.max((cost+m.min+c.sellShip)/(1-c.feePct/100),(cost*(1+(Number.isFinite(c.minMargin)?c.minMargin:25)/100)+c.sellShip)/(1-c.feePct/100))/S;let w=0;for(const l of [5,4,3,2,1])if(LVLF[l]>=f){w=l;break}return {f,w}}
function malCheck(c){return memoOf("malc",()=>malCheck_(c))}
function malCheck_(c){
 const m=malCfg(c),ok=new Set(malHunt(c).map(h=>h.x.id)),out=[];
 for(const x of cardsPk().concat(cardsJp(),loPool(""))){if(ok.has(x.id)||x.owned||(TRUST[x.res?.status]??0)<2||(x.liq?.k||0)<minLiq(c))continue;
  if(isBx(view.game)&&gOf(x)!==view.game||view.game==="pokemon"&&x.kind==="lo"||view.game==="jp"&&x.kind!=="jp")continue;
  const S=saleRef(x.p),lo=x.p.low;if(!Number.isFinite(S)||S<Math.max(60,m.ratio*10)||!Number.isFinite(lo)||lo>m.max||lo<Math.max(3,S*.1)||S/lo<m.ratio)continue;
  const cost=lo+c.buyShip,n=needLvl(S,cost,c,m);if(!n.w)continue;
  const lg=x.kind==="jp"?"":"&language=1",u="https://www.cardmarket.com/es/"+cmGame(x)+"/Products?idProduct="+encodeURIComponent(x.res.pid)+lg+(x.fo?"&isFoil=Y":"");
  out.push({x,S,lo,cost,need:n.w,f:n.f,ratio:S/lo,url:u,profitHP:netSale(S*LVLF[4],c)-cost})}
 return out.sort((a,b)=>b.need-a.need||b.ratio-a.ratio);
}
const NEEDT={5:"sirve aunque esté DAÑADA",4:"sirve si está muy jugada (HP) o mejor",3:"sirve si está jugada (PL) o mejor",2:"sirve si está en MP o mejor",1:"solo si está poco jugada (SP/LP) o mejor"};
function malHtml(c){
 if(!M.guide)return '';const L=malHunt(c),K=malCheck(c),m=malCfg(c);
 return '<details class="cpSnipe cpMal" data-cp-mal'+(L.length||K.length?' open':'')+'><summary><b>🩹 Mal estado barato</b> · '+(L.length?'✅ '+L.length+' comprobada(s)':'✅ 0 comprobadas')+' · 🔎 '+K.length+' por comprobar en un toque (≤ '+EUR(m.max)+', valen ×'+String(m.ratio).replace(".",",")+' o más)</summary>'+
 '<h4>✅ Estado e idioma comprobados</h4>'+(L.length?'<ol class="cpPlanList">'+L.slice(0,15).map(h=>{const x=h.x,o=h.o;return '<li>'+thumb(x)+'<span><b>'+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+' · <b>'+(x.kind==="jp"?'JAPONÉS':'INGLÉS')+'</b> · '+E(o.unk?'estado sin indicar':LVLN[o.lvl])+'</span><a class="v4btn primary" href="'+E(o.url)+'" target="_blank" rel="noopener noreferrer">Ver ya ↗</a>'+
  '<small><b>Pagas '+EUR(h.cost)+'</b> en '+E(o.where)+' (carta '+EUR(o.buy)+' «'+E(o.cond)+'»'+(o.country?' · vendedor de '+E(o.country):'')+' + envío '+(Number.isFinite(o.ship)?'real':'estimado')+') · en buen estado vale '+EUR(h.S)+' (×'+h.ratio.toFixed(1).replace(".",",")+') y '+E(x.liq.t.toLowerCase())+
  ' → <b>tal cual la vendes a ~'+EUR(h.sale)+'</b> ('+(h.shown?'lo que piden otros '+o.exitN+' vendedores en ese estado −5 %':'estimación prudente: '+Math.round(LVLF[o.lvl]*100)+' % de su valor en ese estado')+') → <b class="pos">ganas '+SIGNED(h.profit)+'</b>'+
  '. Si la restauras bien, podría venderse a ~'+EUR(h.rest)+' (no contado).'+(o.unk?' ⚠ El anuncio no dice el estado: mira las fotos.':'')+(o.hub?' · admite CardTrader Zero (revisan la carta).':'')+'</small></li>'}).join("")+'</ol>':'<p class="v4note">Aún ninguna con el estado comprobado'+(ctToken()?': CardTrader consulta solo las de abajo y las va subiendo aquí.':': conecta CardTrader (gratis) en «Estado de las fuentes», es quien dice el estado de cada anuncio.')+'</p>')+
 '<h4>🔎 Por comprobar en un toque · '+K.length+' carta(s)</h4>'+(K.length?'<ol class="cpPlanList" data-cp-malchk>'+K.slice(0,30).map(h=>{const x=h.x,r=ctRes[x.id];return '<li>'+thumb(x)+'<span><b>'+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+' · vale <b>'+EUR(h.S)+'</b> · '+E(x.liq.t.toLowerCase())+'</span><a class="v4btn primary" href="'+E(h.url)+'" target="_blank" rel="noopener noreferrer">Ver '+(x.kind==="jp"?'anuncios':'solo inglesas')+' ↗</a>'+
  '<small>Hay un anuncio desde <b>'+EUR(h.lo)+'</b> ('+EUR(h.cost)+' con envío; la carta vale '+h.ratio.toFixed(1).replace(".",",")+' veces más), '+(x.kind==="jp"?'japonesa (idioma seguro), estado sin indicar':'de idioma y estado sin indicar')+'. <b>Te compensa: '+E(NEEDT[h.need])+'</b> (vendiéndola tal cual ganas ≥ '+EUR(m.min)+'). Si está muy jugada (HP), tal cual ganarías ~'+SIGNED(h.profitHP)+'.'+(r?.loading?' ⏳ CardTrader la está consultando.':r?.rows?' CardTrader no tiene ninguna '+(x.kind==="jp"?'japonesa':'inglesa')+' en mal estado que lo cumpla ahora.':'')+' Mira en las fotos que sea '+(x.kind==="jp"?'':'inglesa, ')+'auténtica y el estado.</small></li>'}).join("")+'</ol>'+(K.length>30?'<p class="v4note">… y '+(K.length-30)+' más (ordenadas: primero las que sirven en peor estado).</p>':''):'<p class="v4note">Ninguna con estos filtros.</p>')+
 '<p class="v4note">«Comprobadas»: anuncios con el <b>idioma y el estado comprobados</b> (CardTrader dice el estado de cada anuncio; Cardmarket por estado con CardNexus; en japonesas, su ficha es solo japonesa) de cartas que se venden de verdad en Cardmarket. La venta es <b>tal cual, sin restaurar</b>: lo que piden otros vendedores en ese mismo estado (−5 %) o, si es menor, una estimación prudente por estado (poco jugada 75 %, MP 60 %, PL 45 %, HP 35 %, dañada 25 % de su valor). «Por comprobar»: el anuncio más barato de la guía oficial de Cardmarket, que no dice idioma ni estado; se te dice en qué estado tiene que estar como mínimo. Por debajo del 10 % de su valor se descarta (proxy o falsa). Cambia el precio máximo, las veces y el beneficio mínimo en «Supuestos del cálculo».</p></details>';
}
function cholloHtml(c){
 if(!M.guide)return '';const L=chollos(c);
 return '<details class="cpSnipe cpChollo" data-cp-chollo'+(L.length?' open':'')+'><summary><b>🎲 Chollos por verificar</b> · '+(L.length?L.length+' anuncio(s) de cualquier estado a la mitad de su valor o menos':'ninguno hoy dentro de tu presupuesto')+'</summary>'+
 (L.length?'<ol class="cpPlanList">'+L.slice(0,12).map(o=>{const x=o.x,u=links(x).cm.replace(/&minCondition=3/,"");return '<li>'+thumb(x)+'<span><b>'+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+(o.isNew?' · <b>🔥 NUEVO HOY</b>':'')+'</span><a class="v4btn primary" href="'+E(u)+'" target="_blank" rel="noopener noreferrer">Ver ya ↗</a><small>Vale ~'+EUR(o.S)+' y su anuncio más barato (cualquier estado) está a <b>'+EUR(o.low)+'</b> ('+Math.round(o.ratio*100)+' %) · pagas '+EUR(o.cost)+' con envío · si está bien: '+SIGNED(o.profit)+'. Lee la descripción y mira las fotos antes de pagar: si dice «proxy», «réplica», «custom» o «no original» es FALSA.</small></li>'}).join("")+'</ol>':'')+
 '<p class="v4note">🛡️ Escudo anti-proxy: '+(fakeN?fakeN+' anuncio(s) por debajo del 30 % de su valor descartados hoy (casi siempre proxy, falsificación u otra carta, como el Mewtwo & Mew GX a 50 € que decía «proxy»). ':'se descartan los anuncios por debajo del 30 % de su valor (casi siempre proxy o falsificación). ')+'Solo cartas japonesas: su ficha de Cardmarket es solo japonesa, así que compra y venta son del mismo idioma'+(langN?' ('+(langN===1?'1 internacional descartada':langN+' internacionales descartadas')+': su anuncio más barato puede ser coreano o chino)':'')+'.</p>'+fakeBox()+'</details>';
}
function sniperHtml(){
 const L=sniper();if(!M.guide)return '';
 return '<details class="cpSnipe" data-cp-snipe'+(L.length?' open':'')+'><summary><b>🎯 Punto de mira</b> · '+(L.length?L.length+' anuncio(s) muy por debajo de su valor':'nada muy por debajo de su valor hoy')+'</summary>'+
 (L.length?'<ol class="cpPlanList">'+L.slice(0,12).map(o=>{const x=o.x,l=links(x);return '<li>'+thumb(x)+'<span><b>'+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+(o.isNew?' · <b>🔥 NUEVO HOY</b>':'')+'</span><a class="v4btn primary" href="'+E(l.cm)+'" target="_blank" rel="noopener noreferrer">Ver ya ↗</a><small>Vale ~'+EUR(o.S)+' (se vende cada semana) y hay un anuncio EX o mejor a <b>'+EUR(o.low)+'</b> ('+Math.round(o.ratio*100)+' % de su valor) · si está bien: '+SIGNED(o.profit)+' con envíos y comisión. Comprueba en 1 minuto: descripción (que no diga «proxy»), estado y fotos, idioma, número y vendedor.</small></li>'}).join("")+'</ol><p class="v4note">Precio «desde» de la guía de Cardmarket (de madrugada): a ese precio suelen venderse en horas. Si el anuncio ya no está, la carta seguirá en la lista hasta la próxima guía.</p>':'<p class="v4note">Solo anuncios con el idioma comprobado. En las cartas internacionales Cardmarket no dice de qué idioma es el «desde EX o mejor»: por debajo del 60 % de su valor casi siempre es coreano o chino y la ganancia sería falsa, así que no se proponen. Las japonesas baratas (idioma seguro) salen en «🎲 Chollos por verificar».</p>')+'</details>';
}
/* Lorcana sin oportunidades: en vez de una lista vacía, cuántas cartas tienen precio y las de mejor margen de hoy. */
/* Lorcana: por qué no hay oportunidades, con números. Sin «desde EX o mejor» la compra fiable es un «desde» ≥ 75 % de la
   venta; para dejar el beneficio mínimo tras comisión y envíos la carta debe valer al menos Smin, y para costar ≤ compra
   máxima, como mucho Smax. Se cuentan las cartas reales en esa ventana y se enseñan las de mejor margen. */
function loDiag(c){
 const mp=minP({kind:"lo"},c),f=1-c.feePct/100,Smin=(mp+c.sellShip+c.buyShip)/(f-.75),Smax=(c.maxBuy-c.buyShip)/.75;
 return {mp,Smin,Smax,possible:Smin<=Smax};
}
function loBest(c){
 if(!isBx(view.game)||view.q)return '';const all=loPool(""),GN=BXG[view.game].name,st=view.game==="lorcana"?loState:bxSt[view.game];
 if(!all.length)return '<p class="v4note neg">'+GN+': aún no hay precios cargados'+(st?' ('+E(st)+')':'')+'. Pulsa «Actualizar precios». Fuente: Bindex (guía oficial de Cardmarket).</p>';
 const d=loDiag(c),S=x=>saleRef(x.p),win=all.filter(x=>S(x)>=d.Smin&&S(x)<=d.Smax).length,cheap=all.filter(x=>Number.isFinite(x.p.low)&&x.p.low+c.buyShip<=c.maxBuy).length,over=all.filter(x=>S(x)>d.Smax).length;
 const best=all.map(x=>({x,o:x.ops.filter(o=>o.cond===view.cond&&Number.isFinite(o.profit)&&opIn(o)).sort((a,b)=>b.profit-a.profit)[0]})).filter(y=>y.o).sort((a,b)=>b.o.profit-a.o.profit).slice(0,10);
 return '<div class="cpPlan"><p><b>'+GN+': '+all.length.toLocaleString("es-ES")+(all.length===1?' carta':' cartas')+' con precio de Cardmarket hoy; ninguna deja '+EUR(d.mp)+'.</b></p>'+
  '<ul class="v4help"><li>'+GN+' no tiene el dato «desde EX o mejor»: la compra fiable es un «desde» de al menos el 75 % de su venta (por debajo suele ser una carta jugada o ya vendida).</li>'+
  '<li>Con ese margen, tras la comisión del '+E(String(c.feePct).replace(".",","))+' % y '+EUR(c.sellShip+c.buyShip)+' de envíos, para ganar '+EUR(d.mp)+' la carta tiene que valer <b>al menos '+EUR(d.Smin)+'</b>, y para que pagues como mucho tu compra máxima ('+EUR(c.maxBuy)+' con envío), <b>como mucho '+EUR(d.Smax)+'</b>.'+(d.possible?'':' Esa ventana no existe: ninguna carta puede cumplir las dos cosas.')+'</li>'+
  '<li>Hoy: '+win+' carta(s) en esa ventana de valor · '+cheap+' con «desde» dentro de tu presupuesto · '+over+' valen más de '+EUR(d.Smax)+' (fuera de presupuesto).</li>'+
  '<li>Para ver márgenes más pequeños, baja '+(view.game==="lorcana"?'el «Beneficio mínimo en Lorcana»':'el «Beneficio mínimo»')+' en Supuestos del cálculo.</li></ul>'+
  (best.length?'<p>Las de mejor margen dentro de tu presupuesto:</p><ol class="cpPlanList">'+best.map(({x,o})=>'<li>'+thumb(x)+'<span><b>'+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+'</span><a class="v4btn" href="'+E(links(x).cm)+'" target="_blank" rel="noopener noreferrer">Abrir ↗</a><small>Compra '+EUR(o.cost)+' → venta '+EUR(o.sale)+' · '+SIGNED(o.profit)+'</small></li>').join("")+'</ol>':'<p class="v4note">Ninguna carta de '+GN+' tiene hoy un «desde» fiable dentro de tu presupuesto.</p>')+'</div>';
}
/* V134 · «Con todos los idiomas solo salen japonesas»: no es un filtro roto. Las internacionales cuyo anuncio barato no dice
   el idioma (puede ser coreano o chino) no dan beneficio (V131). Se cuentan y se explica, y con CardTrader se comprueban en inglés. */
function langNote(L,c){
 const ol=selLang();if(M.guide&&OTHER_L.includes(ol)){const nm=LNAME2[ol].toLowerCase(),n=L.sure.filter(x=>x.best&&x.best.ctl).length;
  return '<p class="v4note cpLangNote">🌐 <b>'+E(LNAME2[ol])+':</b> la guía de Cardmarket mezcla todos los idiomas y una carta en '+E(nm)+' suele valer distinto que en inglés, así que aquí <b>no se usa el precio de la inglesa</b>. Las compras en '+E(nm)+' salen de CardTrader (anuncios con el idioma comprobado): compras al más barato NM/EX y la venta se estima con lo que piden los demás vendedores de '+E(nm)+' −5 %, nunca por encima de su valor en Cardmarket. '+(ctToken()?'✅ '+n+' compra(s) en '+E(nm)+' ahora'+(sweep.busy===ol?' · ⏳ buscando en '+E(nm)+' colección a colección…':'')+'.':'Conecta CardTrader en «Estado de las fuentes» para verlas.')+' También puedes pegar la ficha de Cardmarket filtrada por idioma en cada carta («Pegar datos»).</p>'}
 if(!M.guide||selLang()==="ja"||view.game==="jp"||isBx(view.game)||view.q)return '';
 const nJ=L.sure.filter(x=>x.kind==="jp"&&!x.tgtOnly).length,nI=L.sure.filter(x=>x.kind==="pk"&&!x.tgtOnly).length,nT=L.sure.filter(x=>x.tgtOnly).length;
 return '<p class="v4note cpLangNote">🌐 <b>Idiomas:</b> ✅ '+nJ+' compra(s) en japonés y '+nI+' internacional(es) confirmada(s)'+(nT?' · 🔎 '+nT+' internacional(es) con <b>precio objetivo en inglés</b> (debajo): en Cardmarket su anuncio más barato no dice el idioma y puede ser coreano o chino; te digo hasta cuánto pagar en inglés para ganar tu mínimo'+(ctToken()?' y CardTrader busca el anuncio en inglés':'')+'.':'.')+'</p>';
}
function summaryHtml(L,c){
 const g=M.guide,lo=M.lo,pt=Object.keys(M.pt.cards).length,ver=window.CV_UNIVERSE?window.CV_UNIVERSE.cards.filter(r=>resolve(r[0])?.status==="verificado").length:0;
 const hits=Object.entries(watch).length,hitN=L.sure.concat(L.pending).filter(x=>x.hit).length;
 return '<div class="cpSum"><div><b>'+(g?g.count.toLocaleString("es-ES"):"—")+'</b><span>productos con precio oficial de Cardmarket'+(g?' ('+E(DATE(g.sourceCreatedAt))+')':'')+'</span></div><div><b>'+ver.toLocaleString("es-ES")+'</b><span>versiones verificadas con 2 fuentes</span></div><div><b>'+cardsLo().length.toLocaleString("es-ES")+'</b><span>cartas de Lorcana, Magic, One Piece, Gundam y Riftbound con precio y ventas de Cardmarket</span></div><div><b>'+L.sure.length+'</b><span>oportunidades con beneficio ≥ '+EUR(c.minProfit)+'</span></div><div><b>'+L.sure.concat(L.pending).filter(x=>x.hot).length+'</b><span>🔥 bajadas desde ayer con beneficio</span></div></div>'+
 (g?'<p class="v4note"><b>Compra máxima por carta: '+EUR(c.maxBuy)+'</b> en total, con envío (cámbiala en «Supuestos del cálculo»): nada por encima sale en Compra YA, Top 5, Punto de mira, chollos ni Importar.</p>':'')+(g?'<p class="v4note">Precios de Cardmarket del '+E(WHEN(g.sourceCreatedAt))+' (se publican una vez al día, de madrugada)'+(M.prev?.date?' · comparados con el '+E(DATE(M.prev.date)):'')+'. El anuncio más barato puede haberse vendido: si una oferta te encaja, ábrela ya.</p>':'')+
 langNote(L,c)+apHtml()+
 (hits?'<p class="cpAlert'+(hitN?' on':'')+'">'+(hitN?'🔔 '+hitN+' carta(s) vigilada(s) por debajo de tu precio':'Vigilando '+hits+' carta(s): te avisaré aquí cuando bajen de tu precio')+'</p>':'');
}
function diagText(){
 let errs=[];try{errs=JSON.parse(localStorage.getItem(ERRKEY)||"[]")}catch{}const s=M.src,t=ctToken(),ti=t?tokInfo(t):null;
 return ["Card Vault · diagnóstico "+new Date().toLocaleString("es-ES"),"Versión: "+(document.body?.dataset?.release||"?"),"Navegador: "+navigator.userAgent,
  "Guía Cardmarket: "+(M.guide?M.guide.count+" productos del "+DATE(M.guide.sourceCreatedAt):"no cargada")+" · "+(s.guide?.ok||0)+" ok / "+(s.guide?.fail||0)+" fallos"+(s.guide?.lastErr?" · "+s.guide.lastErr:""),
  "pokemontcg.io: "+Object.keys(M.pt.cards).length+" cartas con «EX o mejor» · "+(s.ptcg?.ok||0)+" ok / "+(s.ptcg?.fail||0)+" fallos · hoy "+budget().n+"/"+PT_DAILY+(s.ptcg?.lastErr?" · "+s.ptcg.lastErr:""),
  "CardTrader: "+(!t?"sin token":"token "+t.length+" caracteres, "+(ti.ok?"forma correcta"+(ti.exp?", válido hasta "+ti.exp:""):ti.why)+" · prueba: "+(s.ct?.test?(s.ct.test.ok?"✓ "+s.ct.test.name:"✗ "+s.ct.test.err):"sin hacer")+" · "+(s.ct?.ok||0)+" ok / "+(s.ct?.fail||0)+" fallos"),
  "CardNexus: "+(cnKey()?"clave "+cnKey().length+" caracteres · prueba: "+(cnSt.test?(cnSt.test.ok?"✓":"✗ "+cnSt.test.err):"sin hacer")+" · "+cnSt.ok+" ok / "+cnSt.fail+" fallos"+(cnSt.err?" · "+cnSt.err:""):"sin clave"),
  "Tiendas: "+SHOPS.map(sh=>sh.name+" "+(shopSt[sh.id]?(shopSt[sh.id].ok?"✓":"✗ "+shopSt[sh.id].err):"sin probar")).join(" · "),
  "Cambio: 1 ¥ = "+(fx.rate||"?")+" € · 1 $ = "+(fx.usd||"?")+" € ("+(fx.date||"?")+")",
  "Errores ("+errs.length+"):"].concat(errs.map(e=>"· "+e.at+" "+e.msg+" ["+e.where+"]")).join("\n");
}
function sourcesHtml(){
 const s=M.src,b=budget(),line=(n,o)=>'<li><b>'+n+'</b> · '+(o.ok||0)+' correctas, '+(o.fail||0)+' fallidas'+(o.last?' · última '+WHEN(o.last):'')+(o.lastErr?' · <span class="neg">'+E(o.lastErr)+'</span>':'')+'</li>';
 return '<details class="v4settings"><summary>Estado de las fuentes</summary><ul class="v4help">'+line("Guía oficial de Cardmarket (espejo diario en GitHub)",s.guide)+line("pokemontcg.io · verificación y «desde» EX+ · "+b.n+"/"+PT_DAILY+" hoy"+(ptRunning?" · comprobando "+ptRunning.done+"/"+ptRunning.total+" colecciones":""),s.ptcg)+line("Bindex · Lorcana, Magic, One Piece, Gundam y Riftbound en Cardmarket",s.bindex)+ctPanel()+cnPanel()+'</ul>'+
  (()=>{let n=0;try{n=JSON.parse(localStorage.getItem(ERRKEY)||"[]").length}catch{}return '<p class="v4note"><b>Errores registrados en este iPhone:</b> '+(n?'<span class="neg">'+n+'</span>':'ninguno')+' <button type="button" class="v4btn" data-cp-diag>Copiar diagnóstico</button>'+(n?' <button type="button" class="v4btn" data-cp-diagclear>Borrar errores</button>':'')+'</p><pre class="cpDiag" data-cp-diagout hidden></pre>'})()+
  '<div class="cpShops"><p><b>CardTrader</b>: '+(!ctToken()?'sin token':!s.ct?.test?'token guardado, sin probar':s.ct.test.ok?'<span class="pos">✓ conectado ('+E(s.ct.test.name)+')</span>':'<span class="neg">✗ '+E(s.ct.test.err)+'</span>')+(ctToken()?' <button type="button" class="v4btn" data-cp-cttest>Probar CardTrader</button>':'')+'</p>'+
  '<details class="v4more" data-cp-impbox><summary>Gastos de importación (TCGplayer y tiendas fuera de la UE)</summary><div class="cpPlanIn"><label>Envío desde EE. UU. (€)<input inputmode="decimal" data-cp-jp="shipUS" value="'+E(String(jp.shipUS).replace(".",","))+'"></label><label>EMS desde Japón (¥)<input inputmode="numeric" data-cp-jp="ems" value="'+E(String(jp.ems))+'"></label><label>Comisión Buyee (¥)<input inputmode="numeric" data-cp-jp="buyee" value="'+E(String(jp.buyee))+'"></label><label>Arancel UE por paquete (€)<input inputmode="decimal" data-cp-jp="duty" value="'+E(String(jp.duty).replace(".",","))+'"></label><label>IVA de importación %<input inputmode="decimal" data-cp-jp="vat" value="'+E(String(jp.vat).replace(".",","))+'"></label><label>Gestión del transportista (€)<input inputmode="decimal" data-cp-jp="handling" value="'+E(String(jp.handling).replace(".",","))+'"></label><label>Cambio 1 ¥ = €<input inputmode="decimal" data-cp-jp="rate" value="'+(N(fx.rate)?E(String(fx.rate).replace(".",",")):"")+'"></label></div><button type="button" class="v4btn" data-cp-jpsave>Guardar gastos</button></details>'+
  '<p><b>Otras tiendas</b> ('+SHOPS.map(sh=>E(sh.name)).join(", ")+'): '+(SHOPS.some(sh=>shopSt[sh.id]?.ok)?'<span class="pos">✓ '+SHOPS.filter(sh=>shopSt[sh.id]?.ok).map(sh=>E(sh.name)).join(", ")+' se pueden leer: su precio sale en «Dónde comprarla»</span>':SHOPS.some(sh=>shopSt[sh.id])?'no dejan leer sus precios → no se enseñan':'se prueban al cargar con CardTrader')+'.</p></div>'+
  '<p class="v4note">La guía de Cardmarket mezcla idiomas y estados en las ediciones internacionales; las japonesas son productos propios (idioma seguro). Para otro idioma usa «Pegar datos» en la tabla «Mismo idioma» de cada carta. Envío a 41020 y comisión editables en «Supuestos del cálculo». Fuentes: <a href="https://github.com/ZyzyThePizi/pokemon-price-data" target="_blank" rel="noopener">espejo de la guía</a>, <a href="https://pokemontcg.io" target="_blank" rel="noopener">pokemontcg.io</a>, <a href="https://github.com/Douxeh/bindex-prices" target="_blank" rel="noopener">Bindex</a>.</p></details>';
}
/* Repintado en segundo plano (verificación, cambio, foto de ayer…): nunca mientras escribes en la lista; se hace al salir
   del campo. Y al repintar se conservan los desplegables abiertos y lo escrito (pegar datos, precios, plan, Japón). */
let rT=null,rPending=false;
function typingIn(slot){const a=document.activeElement;return !!(a&&slot&&slot.contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&!a.matches("[data-cp-q]"))}
/* V132 · Repintados en segundo plano (comprobación de versiones, CardTrader, foto de ayer…): en el iPhone llegaban cada ~2 s
   durante minutos y, al rehacer toda la sección, cerraban/abrían desplegables y movían la página («se queda colgada y me
   desplaza»). Ahora: como mucho uno cada 8 s, nunca mientras tocas, desplazas o escribes (espera 2,5 s de calma), se
   respetan los desplegables tal como los dejaste y la página no se mueve. */
let lastUI=0,lastPaint=0;
["touchstart","touchmove","pointerdown","wheel","scroll","keydown"].forEach(ev=>addEventListener(ev,()=>{lastUI=Date.now()},{passive:true,capture:true}));
function render(){clearTimeout(rT);const now=Date.now(),wait=Math.max(30,lastPaint+8000-now,lastUI+2500-now);
 rT=setTimeout(()=>{if(Date.now()-lastUI<2500){render();return}const slot=document.querySelector('[data-rd-live="compra"]');if(typingIn(slot)){rPending=true;return}renderNow()},wait)}
document.addEventListener("focusout",()=>{if(rPending)setTimeout(()=>{const slot=document.querySelector('[data-rd-live="compra"]');if(!typingIn(slot)){rPending=false;renderNow()}},60)});
const KEEP="textarea,input:not([type=search]),select:not([data-cp-view])";
function keyOf(el){const card=el.closest(".cpCard"),box=el.closest("[data-cp-planbox],[data-cp-jpbox],[data-cp-snipe],.v4settings");const own=[...el.attributes].filter(a=>a.name.startsWith("data-")).map(a=>a.name+"="+a.value).join("&");
 return (card?card.id:box?(box.getAttribute("data-cp-planbox")!=null?"plan":box.getAttribute("data-cp-jpbox")!=null?"jp":box.getAttribute("data-cp-snipe")!=null?"snipe":"settings"):"")+"|"+el.tagName+"|"+own}
const openSt={};let restoring=false;
function detKey(d){const card=d.closest(".cpCard"),own=["data-cp-snipe","data-cp-mal","data-cp-chollo","data-cp-jpbox","data-cp-fakebox","data-cp-planbox","data-cp-pastebox","data-cp-more","data-cp-pend"].find(a=>d.hasAttribute(a));
 if(own&&!card)return own;const scope=card||d.closest("[data-cp-jpbox],[data-cp-chollo]")||document.querySelector('[data-rd-live="compra"]');return (card?card.id:(scope&&scope.getAttribute&&["data-cp-jpbox","data-cp-chollo"].find(a=>scope.hasAttribute(a))||""))+"|"+(d.className||"")+"|"+[...scope.querySelectorAll("details")].indexOf(d)}
document.addEventListener("toggle",e=>{const d=e.target;if(restoring||!(d instanceof HTMLDetailsElement)||!d.closest('[data-rd-live="compra"]'))return;openSt[detKey(d)]=d.open;if(d.open&&(d.hasAttribute("data-cp-more")||d.hasAttribute("data-cp-pend")))fillLazy(d);if(Date.now()-lastPaint>200)lastUI=Date.now();if(d.hasAttribute("data-cp-jpbox")){jp.open=d.open;writeLS(JKEY,jp)}},true);
function anchorOf(slot){const r0=slot.getBoundingClientRect();if(r0.top>=0)return null;
 for(const el of slot.querySelectorAll(".cpCard[id],[data-cp-snipe],[data-cp-chollo],[data-cp-jpbox],.cpTop,.cpSum")){const r=el.getBoundingClientRect();if(r.bottom>0)return {k:el.id?"#"+CSS.escape(el.id):el.matches(".cpTop")?".cpTop":el.matches(".cpSum")?".cpSum":"["+["data-cp-snipe","data-cp-chollo","data-cp-jpbox"].find(a=>el.hasAttribute(a))+"]",top:r.top}}return null}
function snapUI(slot){const det=[],val=[];slot.querySelectorAll("details").forEach((d,i)=>{if(d.open){const card=d.closest(".cpCard");det.push((card?card.id:"")+"|"+(d.className||"")+"|"+[...(card||slot).querySelectorAll("details")].indexOf(d))}});
 slot.querySelectorAll(KEEP).forEach(el=>{if(el.value!==el.defaultValue||el.tagName==="SELECT"&&el.value!==(el.querySelector("option[selected]")?.value??el.options?.[0]?.value))val.push([keyOf(el),el.value])});return {det,val}}
function restoreUI(slot,st){if(!st)return;restoring=true;slot.querySelectorAll("details").forEach(d=>{const card=d.closest(".cpCard"),k=(card?card.id:"")+"|"+(d.className||"")+"|"+[...(card||slot).querySelectorAll("details")].indexOf(d),k2=detKey(d);if(k2 in openSt)d.open=openSt[k2];else if(st.det.includes(k))d.open=true});setTimeout(()=>{restoring=false},0);
 const m=new Map(st.val);slot.querySelectorAll(KEEP).forEach(el=>{const k=keyOf(el);if(m.has(k))el.value=m.get(k)})}
function renderNow(){memo=new Map();try{paint()}finally{memo=null}}
/* V141 · «Ver más» y «Por confirmar» cerrados no se construyen (eran 1,3 MB de HTML y 18.000 elementos en cada pintado):
   se rellenan al abrirlos. */
let lastL=null;
const moreHtml=(L,c)=>L.sure.slice(25,150).map((x,i)=>cardHtml(x,i+26,c)).join(""),pendHtml=(L,c)=>L.pending.slice(0,40).map(x=>cardHtml(x,0,c)).join("");
function lazyBox(k,sum,note,html){const open=!!openSt[k];return '<details class="v4old" '+k+(open?' open':'')+'><summary>'+sum+'</summary>'+note+'<div class="v4list" data-cp-lazy>'+(open?html():'')+'</div></details>'}
function fillLazy(d){const box=d.querySelector(":scope > [data-cp-lazy]");if(!box||box.childElementCount||!lastL)return;const {L,c}=lastL;
 memo=new Map();try{box.innerHTML=d.hasAttribute("data-cp-more")?moreHtml(L,c):pendHtml(L,c)}finally{memo=null}const slot=d.closest('[data-rd-live="compra"]');if(slot){ctWatch(slot);wireImgs(slot)}}
function wireImgs(slot){slot.querySelectorAll("img[data-v4img]").forEach(im=>{if(im.dataset.wired)return;im.dataset.wired="1";im.addEventListener("error",()=>{const a=im.dataset.alt;if(a&&!im.dataset.usedAlt){im.dataset.usedAlt="1";im.src=a;return}im.hidden=true;const n=im.parentElement.querySelector(".v4noimg");if(n)n.hidden=false})})}
function paint(){
 if(typeof document.querySelector!=="function")return;const slot=document.querySelector('[data-rd-live="compra"]');if(!slot)return;
 langData=readLS(LKEY,{});watch=readLS(WKEY,{});const c=cfg(),L=list();lastL={L,c};
 const sel=(k,opts,label)=>'<label>'+label+'<select data-cp-view="'+k+'">'+opts.map(([v,t])=>'<option value="'+v+'"'+(view[k]===v?' selected':'')+'>'+t+'</option>').join("")+'</select></label>';
 const loading=!M.guide&&!M.lo;
 trackNew(L,c);
 const ui=slot.firstChild?snapUI(slot):null,anc=slot.firstChild?anchorOf(slot):null;lastPaint=Date.now();
 slot.innerHTML='<section class="rdlivebox cpBox"><h3>Ofertas en Cardmarket · compra y venta desde 41020 Sevilla</h3>'+summaryHtml(L,c)+
  (busy?'<p class="v4note">⏳ '+E(busy)+'</p>':'')+((view.game==="all"||isBx(view.game))?[["lorcana",loState]].concat(Object.entries(bxSt)).filter(([g,t])=>t&&(view.game==="all"||view.game===g)).map(([,t])=>'<p class="v4note'+(t.startsWith("Cargando")?'':' neg')+'">'+E(t)+'</p>').join(""):'')+
  '<div class="rdctl"><label class="cpQ">Buscar carta<input type="search" data-cp-q value="'+E(view.q)+'" placeholder="Nombre, colección o número"></label>'+sel("game",[["all","Todas"],["pokemon","Pokémon"],["jp","Pokémon japonés (idioma seguro)"],["lorcana","Lorcana"],["mtg","Magic"],["onepiece","One Piece"],["gundam","Gundam"],["riftbound","Riftbound"]],"Juego")+sel("lang",[["all","Todos los idiomas"]].concat(LANGS.map(([k,n])=>[k,n])),"Idioma de la carta")+sel("cond",[["buen","Buen estado"],["mal","Mal estado · restaurar"]],"Estado")+
  sel("show",[["profit","Solo con beneficio ≥ "+EUR(c.minProfit)],["all","Todas con precio"]],"Mostrar")+sel("sort",[["profit","Mayor beneficio"],["risk","Mejor beneficio prudente (con riesgo)"],["buy","Menor precio de compra"],["margin","Mayor margen %"],["sale","Mayor precio de venta"],["liq","Se venden más rápido"],["mom","Subiendo esta semana"],["drop","🔥 Bajadas desde ayer"],["name","Nombre A–Z"]],"Ordenar")+'</div>'+
  '<div class="v4actions"><button type="button" class="v4btn" data-cp-refresh>Actualizar precios</button></div>'+top5Html(c)+sourcesHtml()+sniperHtml()+malHtml(c)+cholloHtml(c)+
  (L.sure.length?'<div class="v4list">'+L.sure.slice(0,25).map((x,i)=>cardHtml(x,i+1,c)).join("")+'</div>'+(L.sure.length>25?lazyBox("data-cp-more",'Ver más ('+(L.sure.length-25)+')','',()=>moreHtml(L,c)):''):
   '<p class="v4empty">'+(loading?'Cargando la guía oficial de Cardmarket…':view.q?'Ninguna carta coincide con «'+E(view.q)+'».':'Ninguna oportunidad cumple estos filtros. Prueba «Todas con precio», otro estado u ordenar distinto.')+'</p>'+loBest(c))+
  (L.pending.length?lazyBox("data-cp-pend",'Por confirmar versión o se venden poco ('+L.pending.length+')','<p class="v4note">Cardmarket tiene varias versiones con el mismo nombre y aún no hay una segunda fuente que confirme cuál es, o se venden menos de lo que pides en «Ventas mínimas» ('+["","una vez al mes","cada semana","a diario"][minLiq(c)]+'). Comprueba el número en la ficha antes de comprar.</p>',()=>pendHtml(L,c)):'')+'</section>';
 restoreUI(slot,ui);ctWatch(slot);
 if(anc){const el=slot.querySelector(anc.k);if(el){const dy=el.getBoundingClientRect().top-anc.top;if(Math.abs(dy)>1)window.scrollBy(0,dy)}}
 wireImgs(slot);
}

/* ---------- CardTrader (opcional): anuncios reales por IDIOMA y estado ----------
   CardTrader es un mercado europeo (envía a España). Su API oficial devuelve cada anuncio con idioma, estado, precio y país
   del vendedor. Necesita el token personal de TU cuenta gratuita (CardTrader → Ajustes → API). Se guarda solo en este iPhone.
   Son precios PEDIDOS (anuncios), no ventas cerradas: la «salida» es la mediana de los 5 anuncios NM/EX más baratos del idioma. */
const CT="https://api.cardtrader.com/api/v2",CTKEY="cv_cardtrader_token",ctRes={},ctCache={games:null,exps:null,bp:{}};
/* V136 · Token limpio: al pegarlo en el iPhone a veces lleva «Bearer », comillas, espacios o saltos de línea, y CardTrader
   responde HTTP 500. Se limpia al guardar y al usar (también el ya guardado). */
const cleanTok=v=>String(v||"").replace(/["'“”‘’<>]/g,"").trim().replace(/^bearer[\s:]*/i,"").replace(/\s+/g,"");/* primero comillas, luego «Bearer», luego espacios */
const ctToken=()=>{try{return cleanTok(localStorage.getItem(CTKEY)||"")}catch{return ""}};
/* qué dice el propio token (JWT): si tiene la forma correcta y cuándo caduca; no se envía a ningún sitio */
function tokInfo(t){const p=String(t||"").split(".");if(p.length!==3)return {ok:false,why:"no tiene la forma de un token de CardTrader (3 partes separadas por puntos)"};
 try{const j=JSON.parse(atob(p[1].replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(p[1].length/4)*4,"=")));const exp=Number(j.exp)*1000;
  if(exp&&exp<Date.now())return {ok:false,why:"caducó el "+new Date(exp).toLocaleDateString("es-ES")+": genera uno nuevo en CardTrader → Ajustes → API"};
  return {ok:true,exp:exp?new Date(exp).toLocaleDateString("es-ES"):""}}catch{return {ok:false,why:"está incompleto o mal copiado"}}}
async function ctGet(path){
 const t=ctToken();if(!t)throw new Error("Sin token de CardTrader");
 let r;try{r=await fetch(CT+path,{headers:{Authorization:"Bearer "+t,Accept:"application/json"}})}catch{throw new Error("CardTrader no responde o no permite consultas desde el navegador")}
 if(r.status===401||r.status===403)throw new Error("Token de CardTrader no válido o caducado (HTTP "+r.status+"): genera uno nuevo en CardTrader → Ajustes → API");if(r.status===429)throw new Error("CardTrader: demasiadas consultas, espera un momento");
 if(!r.ok){let b="";try{b=(await r.text()).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,90)}catch{}throw new Error("CardTrader HTTP "+r.status+(b?": "+b:""))}return r.json();
}
const nrm=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const numK=v=>String(v||"").split("/")[0].toUpperCase().replace(/^([A-Z]*)0+(?=\d)/,"$1");
/* V135 · Emparejar con CardTrader por el id de Cardmarket: cada carta de su catálogo (blueprint) trae «card_market_ids»,
   así que la carta de CardTrader es EXACTAMENTE la misma ficha de Cardmarket (sin adivinar por nombre). Si no aparece,
   se busca por número y nombre en la colección (nombre exacto primero: «Base Set» no es «Base Set 2»). */
async function ctExps(x){
 if(!ctCache.games)ctCache.games=await ctGet("/games");
 const games=Array.isArray(ctCache.games)?ctCache.games:(ctCache.games?.array||[]);
 const g=games.find(o=>(x.kind==="lo"?BXG[gOf(x)].ct:/pok[eé]mon/i).test(String(o.name||o.display_name||"")));if(!g)throw new Error("CardTrader: juego no encontrado");
 if(!ctCache.exps)ctCache.exps=await ctGet("/expansions");
 return (Array.isArray(ctCache.exps)?ctCache.exps:(ctCache.exps?.array||[])).filter(e=>e.game_id===g.id);
}
function ctExpCands(x,exps){const sn=nrm(String(x.set).replace(/\s*\(japon[eé]s\)$/i,"")),jc=x.kind==="jp"?String(x.code||"").toLowerCase():"";
 return [...new Set([...(jc?exps.filter(e=>String(e.code||"").toLowerCase()===jc):[]),...exps.filter(e=>nrm(e.name)===sn),...exps.filter(e=>nrm(e.name).includes(sn)||sn.includes(nrm(e.name)))])].slice(0,4)}
async function ctBpOf(exp){if(!ctCache.bp[exp.id]){try{const j=await ctGet("/blueprints/export?expansion_id="+encodeURIComponent(exp.id));ctCache.bp[exp.id]=Array.isArray(j)?j:(j?.array||[])}catch(e){if(/token|navegador|no responde/i.test(e.message))throw e;ctCache.bp[exp.id]=[]}}return ctCache.bp[exp.id]}/* una colección que falla no impide probar la siguiente */
async function ctBlueprint(x){
 const exps=await ctExps(x),cands=ctExpCands(x,exps);
 if(!cands.length)throw new Error("CardTrader: colección «"+x.set+"» no encontrada");
 const pid=Number(x.res?.pid),num=numK(x.number),nn=nrm(x.name).split(" ")[0];
 for(const exp of cands){await ctBpOf(exp);
  const bp=pid&&ctCache.bp[exp.id].find(b=>(b.card_market_ids||[]).map(Number).includes(pid));if(bp)return {bp,exp,how:"id de Cardmarket"}}
 for(const exp of cands){const bp=ctCache.bp[exp.id].find(b=>numK(b.fixed_properties?.collector_number||b.collector_number)===num&&nrm(b.name).includes(nn));if(bp)return {bp,exp,how:"número y nombre"}}
 throw new Error("CardTrader: carta nº "+x.number+" no encontrada en «"+cands[0].name+"»");
}
/* precio en euros de un anuncio (la API da price.cents en tu moneda; price_cents en ejemplos antiguos) */
function ctEur(p){const c=Number(p.price?.cents??p.price_cents),cur=String(p.price?.currency||p.price_currency||"EUR").toUpperCase();if(!Number.isFinite(c)||c<=0)return NaN;return cur==="EUR"?c/100:cur==="USD"&&N(fx.usd)?c/100*fx.usd:NaN}
/* envío REAL del vendedor a tu país (GET /shipping_methods?username=…): el más barato que ofrezca */
const ctShipC={};
async function ctShip(user){
 if(!user)return NaN;if(user in ctShipC)return ctShipC[user];let v=NaN;
 try{const j=await ctGet("/shipping_methods?username="+encodeURIComponent(user)),L=Array.isArray(j)?j:(j?.array||j?.shipping_methods||[]);
  const cents=L.map(m=>Number(m.price?.cents??m.price_cents??m.cost?.cents??m.shipping_cost?.cents??m.total?.cents)).filter(n=>Number.isFinite(n)&&n>=0);if(cents.length)v=Math.min(...cents)/100}catch{}
 return ctShipC[user]=v;
}
/* V146 · Nivel de deterioro de un anuncio (CardTrader y Cardmarket): 1 poco jugada … 5 muy dañada */
const condLvl=c=>{c=String(c||"").toLowerCase();return /slightly|^lp$|light/.test(c)?1:/moderately|^mp$/.test(c)?2:/heavily|^hp$/.test(c)?4:/poor|damag|^dmg$|^po$/.test(c)?5:/played|^pl$/.test(c)?3:0};
/* Lo que vale una carta en ese estado frente a una en buen estado, PRUDENTE (por debajo de las referencias públicas:
   LP ≈ 87 %, MP ≈ 67 %, HP ≈ 44 %, dañada ≈ 34 %). Si hay otros vendedores en ese mismo estado, manda el menor de los dos. */
const LVLF={1:.75,2:.6,3:.45,4:.35,5:.25},LVLN={1:"poco jugada (SP/LP)",2:"jugada (MP)",3:"jugada (PL)",4:"muy jugada (HP)",5:"dañada (Poor)"};
const ctFoil=p=>Object.entries(p.properties_hash||{}).some(([k,v])=>/foil/i.test(k)&&(v===true||v==="true"||v==="foil"));
function ctSummary(list,fo){
 const by={};
 for(const p of list){if(fo!==undefined&&ctFoil(p)!==!!fo)continue;/* V143: Lorcana foil solo con foil, normal solo con normal */const h=p.properties_hash||{},lk=Object.keys(h).find(k=>/language/i.test(k)),lang=normL(lk?h[lk]:"?"),cond=String(h.condition||"");
  const eur=ctEur(p);if(!Number.isFinite(eur)||p.graded||p.on_vacation||fakeWords(p.description).length)continue;/* V141: vendedor de vacaciones o descripción con «proxy», «réplica»… fuera */
  (by[lang]=by[lang]||[]).push({eur,cond,good:/mint|near|excellent|^nm|^ex/i.test(cond),country:p.user?.country_code||"",user:p.user?.username||"",hub:!!p.user?.can_sell_via_hub,qty:p.quantity||1})}
 return Object.entries(by).map(([lang,a])=>{a.sort((x,y)=>x.eur-y.eur);const g=a.filter(o=>o.good),top=g.slice(0,5).map(o=>o.eur),med=top.length?top[Math.floor(top.length/2)]:NaN;
  const o2=g.slice(1,6).map(o=>o.eur),exit2=o2.length?o2[Math.floor(o2.length/2)]:NaN;/* V142: lo que piden los DEMÁS vendedores de ese idioma (sin el más barato, que es el que compras) */
  const bad=a.filter(o=>!o.good&&condLvl(o.cond)>=1).slice(0,10).map(o=>({...o,lvl:condLvl(o.cond)}));/* V146: los anuncios en mal estado, del más barato al más caro */
  return {lang,n:a.length,cheapest:a[0],cheapestGood:g[0]||null,exit:med,exit2,n2:o2.length,bad}}).sort((x,y)=>(y.n-x.n));
}
const LNAME={en:"Inglés",es:"Español",fr:"Francés",de:"Alemán",it:"Italiano",pt:"Portugués",jp:"Japonés",ja:"Japonés",kr:"Coreano",ko:"Coreano",zh:"Chino","zh-cn":"Chino","zh-tw":"Chino trad."};
function ctHtml(r){
 if(r.error)return '<p class="v4note neg">'+E(r.error)+'</p>'+(ctToken()?'':'<p class="v4note">Conéctalo en «Estado de las fuentes» (opcional).</p>')+'<button type="button" class="v4btn" data-cp-ctload="'+E(r.id||"")+'">Reintentar</button>';
 if(r.loading)return '<p class="v4note">Consultando CardTrader…</p>';
 const c=cfg();
 return '<div class="cpCTt"><p class="v4note"><b>CardTrader ahora</b> · '+E(r.exp)+(r.how?' (emparejada por '+E(r.how)+')':'')+' · anuncios por idioma (precio pedido, no venta).</p>'+
  (r.rows.length?r.rows.map(o=>'<div class="cpCTr"><b>'+E(LNAME[o.lang]||o.lang.toUpperCase())+'</b><span>más barato '+EUR(o.cheapest.eur)+' <small>'+E(o.cheapest.cond)+(o.cheapest.country?' · '+E(o.cheapest.country):'')+'</small></span><span>NM/EX '+EUR(o.cheapestGood?.eur)+'</span><span>salida '+EUR(o.exit)+'</span>'+
   (o.cheapestGood&&Number.isFinite(o.exit)?'<span class="'+(netSale(o.exit,c)-o.cheapestGood.eur-c.buyShip>=c.minProfit?'pos':'')+'">mismo idioma '+SIGNED(netSale(o.exit,c)-o.cheapestGood.eur-c.buyShip)+'</span>':'')+'<small>'+o.n+' anuncios</small></div>').join(""):'<p class="v4note">Sin anuncios ahora.</p>')+
  '<a class="v4btn" href="https://www.cardtrader.com/cards/'+E(r.bp)+'" target="_blank" rel="noopener noreferrer">Abrir en CardTrader ↗</a></div>';
}
async function ctLoad(id){
 const x=cardsPk().concat(cardsLo(),cardsJp()).find(c=>c.id===id);if(!x)return;ctRes[id]={loading:true};paintCT(id);
 try{const {bp,exp,how}=await ctBlueprint(x),flat=j=>Array.isArray(j)?j:(j?.[bp.id]||Object.values(j||{}).flat()),lg=x.kind==="jp"?"jp":"en";
  const all=flat(await ctGet("/marketplace/products?blueprint_id="+encodeURIComponent(bp.id)));
  /* los 25 más baratos pueden ser todos coreanos: se piden aparte los del idioma que se compara */
  let mine=[];try{mine=flat(await ctGet("/marketplace/products?blueprint_id="+encodeURIComponent(bp.id)+"&language="+lg))}catch{}
  const ol=selLang();if(x.kind!=="jp"&&OTHER_L.includes(ol))try{mine=mine.concat(flat(await ctGet("/marketplace/products?blueprint_id="+encodeURIComponent(bp.id)+"&language="+CTLANG[ol])))}catch{}/* V142: y el idioma que has elegido */
  const seen=new Set(),rows=ctSummary(all.concat(mine).filter(p=>{const k=p.id??JSON.stringify(p);if(seen.has(k))return false;seen.add(k);return true}),x.kind==="lo"?x.fo:undefined);
  const tg=rows.find(o=>o.lang===lg||(lg==="jp"&&o.lang==="ja"));if(tg?.cheapestGood){tg.cheapestGood.ship=await ctShip(tg.cheapestGood.user)}
  {const b0=tg?.bad?.[0],mc=malCfg(cfg()),S=saleRef(x.p);if(b0&&b0.eur<=mc.max&&S/b0.eur>=mc.ratio)b0.ship=await ctShip(b0.user)}/* V146 */
  ctRes[id]={rows,exp:exp.name,bp:bp.id,how,at:Date.now()};M.src.ct={...(M.src.ct||{}),ok:(M.src.ct?.ok||0)+1,last:Date.now(),lastErr:""}}
 catch(e){ctRes[id]={error:String(e.message||e),id};M.src.ct={...(M.src.ct||{}),fail:(M.src.ct?.fail||0)+1,lastErr:String(e.message||e).slice(0,80)}}
 paintCT(id);
}
function paintCT(id){document.querySelectorAll('[data-cp-ct="'+CSS.escape(id)+'"]').forEach(b=>b.innerHTML=ctHtml(ctRes[id]));if(ctRes[id]&&!ctRes[id].loading)render()}
/* ---------- CardNexus (opcional, V143) ----------
   Mercado europeo de cartas (Francia, desde 2026) con API pública y clave GRATUITA de tu cuenta (cardnexus.com → Ajustes →
   API Keys). Por cada carta da lo que la guía oficial de Cardmarket NO separa: el anuncio más barato de CARDMARKET por
   IDIOMA y ESTADO (y normal/foil por separado), además de los anuncios reales de CardNexus con el envío a España. Límites:
   600 consultas de precios por hora y 120 de anuncios: la app lleva la cuenta y nunca los supera. La clave solo vive en
   este iPhone y no sale en el diagnóstico. */
const CN="https://public-api.cardnexus.com/v1",CNKEY="cv_cardnexus_key",CNMAP="cv_v143_cnmap",CNBUD="cv_v143_cnbud",cnRes={};
let cnMap=readLS(CNMAP,{}),cnSt={ok:0,fail:0,err:"",busy:false,cards:0,at:0,test:null};
const cnKey=()=>{try{return cleanTok(localStorage.getItem(CNKEY)||"")}catch{return ""}};
function cnBudget(kind,max){const h=new Date().toISOString().slice(0,13),b=readLS(CNBUD,{});if(b.h!==h){b.h=h;b.p=0;b.l=0}if(b[kind]>=max)return false;b[kind]++;writeLS(CNBUD,b);return true}
async function cnGet(path,body){
 const k=cnKey();if(!k)throw new Error("Sin clave de CardNexus");let r;
 try{r=await fetch(CN+path,{method:body?"POST":"GET",headers:{Authorization:"Bearer "+k,Accept:"application/json",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})})}catch{throw new Error("CardNexus no responde o no permite consultas desde el navegador")}
 if(r.status===401||r.status===403)throw new Error("Clave de CardNexus no válida (HTTP "+r.status+"): créala en cardnexus.com → Ajustes → API Keys");
 if(r.status===429)throw new Error("CardNexus: límite de consultas de esta hora alcanzado; sigue sola en un rato");
 if(!r.ok){let b="";try{b=(await r.text()).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,90)}catch{}throw new Error("CardNexus HTTP "+r.status+(b?": "+b:""))}
 return r.json();
}
/* id de Cardmarket → producto de CardNexus (200 por consulta; se guarda: no cambia) */
async function cnResolve(pids){
 const need=[...new Set(pids.map(Number))].filter(n=>n>0&&!(cnMap[n]&&(cnMap[n].id||Date.now()-cnMap[n].miss<7*DAY)));
 for(let i=0;i<need.length;i+=200){const ch=need.slice(i,i+200),j=await cnGet("/products/resolve",{marketplace:"cardmarket",ids:ch});
  for(const r of (j?.results||[]))cnMap[r.externalId]=r.product?{id:r.product.id,fin:r.product.finish||"Standard"}:{miss:Date.now()};
  for(const id of ch)if(!cnMap[id])cnMap[id]={miss:Date.now()}}
 writeLS(CNMAP,cnMap);
}
/* precios de una carta: Cardmarket por idioma y estado + CardNexus; en las que pueden dar beneficio, el anuncio real con envío a España */
async function cnLoad(x,c){
 const m=cnMap[Number(x.res?.pid)];if(!m?.id||!cnBudget("p",590))return false;
 const j=await cnGet("/products/"+m.id+"/prices"),pf=j?.pricesByFinish||{},fins=Object.keys(pf);
 const fin=x.kind==="lo"&&x.fo?fins.find(f=>/foil/i.test(f)):pf[m.fin]&&!(x.kind==="lo"&&/foil/i.test(m.fin))?m.fin:fins.find(f=>!/reverse|foil/i.test(f));
 const b=fin?pf[fin]:null,r={at:Date.now(),pid:m.id,fin:fin||"",cm:b?.cardmarket||null,cx:b?.cardnexus||null};
 /* anuncio de CardNexus con el envío real a 41020 (España), solo si su precio puede dejar tu beneficio */
 const S=saleRef(x.p),lk=x.kind==="jp"?"ja":"en",cx=N(r.cx?.regions?.eu?.byCondition?.NM?.byLanguage?.[lk]?.low);
 if(Number.isFinite(cx)&&Number.isFinite(S)&&netSale(S,c)-cx-minP(x,c)>=0&&cnBudget("l",110)){
  try{const L=await cnGet("/products/"+m.id+"/listings?condition=NM&language="+lk+(fin?"&finish="+encodeURIComponent(fin):"")+"&deliveryCountry=ES&limit=10");
   const ok=(L?.data||[]).filter(o=>!o.graded&&o.price?.currency==="EUR"&&!fakeWords(o.comment).length&&o.seller?.shipping);/* sin «proxy»/«réplica» en la nota y que envíe a España */
   if(ok.length){const o=ok[0];r.cxBuy={eur:o.price.amount,ship:o.seller.shipping.currency==="EUR"?o.seller.shipping.amount:NaN,user:o.seller.username,country:o.seller.country,rating:o.seller.rating?.average??null,photos:(o.photos||[]).length}}
   else r.cxBuy={none:true}}catch(e){r.cxErr=String(e.message||e).slice(0,80)}}
 cnRes[x.id]=r;return true;
}
function cnCands(c){
 return cardsPk().concat(cardsJp(),cardsLo()).filter(x=>!x.owned&&(TRUST[x.res?.status]??0)>=2&&(x.liq?.k||0)>=2&&Number(x.res?.pid)).map(x=>{const S=saleRef(x.p);return {x,S,room:Number.isFinite(S)?Math.min(netSale(S,c)-minP(x,c),netSale(S,c)/(1+(c.minMargin||0)/100),c.maxBuy)-c.buyShip:NaN}})
  .filter(o=>o.S>=40&&o.room>=o.S*FAKE_RATIO).sort((a,b)=>b.room-a.room);
}
/* revisión: primero las cartas que ves, después las de más beneficio posible (cada hora, sin pasar del límite) */
async function cnScan(force){
 if(cnSt.busy||!cnKey()||!M.guide||(!force&&Date.now()-cnSt.at<60*60e3))return;cnSt.busy=true;cnSt.at=Date.now();const c=cfg();let n=0;
 try{const vis=list().sure.slice(0,25).map(x=>x.id),C=cnCands(c),ord=[...new Set(vis.concat(C.map(o=>o.x.id)))].slice(0,150),all=cardsPk().concat(cardsJp(),cardsLo()),by=new Map(all.map(x=>[x.id,x]));
  const xs=ord.map(id=>by.get(id)).filter(x=>x&&Number(x.res?.pid));await cnResolve(xs.map(x=>x.res.pid));
  for(const x of xs){const r=cnRes[x.id];if(!force&&r&&Date.now()-r.at<AP_EVERY)continue;if(!await cnLoad(x,c))continue;n++;cnSt.ok++;if(n%10===0)render();await new Promise(r=>setTimeout(r,400))}
  cnSt.err=""}
 catch(e){cnSt.fail++;cnSt.err=String(e.message||e).slice(0,90);logErr("CardNexus: "+cnSt.err)}
 finally{cnSt.busy=false;cnSt.cards=Object.keys(cnRes).length;render()}
}
async function cnTest(){try{await cnGet("/games");cnSt.test={ok:true};return {ok:true}}catch(e){cnSt.test={ok:false,err:String(e.message||e)};return {ok:false,err:cnSt.test.err}}}
function cnPanel(){const k=cnKey();
 return '<li><b>CardNexus (opcional) · Cardmarket por idioma y estado</b> · '+(k?'conectado'+(cnSt.busy?' · ⏳ revisando cartas…':cnSt.cards?' · '+cnSt.cards+' cartas con precio por idioma':''):'no conectado')+(cnSt.err?' · <span class="neg">'+E(cnSt.err)+'</span>':'')+
  '<div class="cpCTk"><input type="password" autocomplete="off" data-cp-cnkey placeholder="'+(k?'Clave guardada en este iPhone':'Pega tu clave de CardNexus (cnk_live_…)')+'" aria-label="Clave de CardNexus"><button type="button" class="v4btn" data-cp-cnsave>'+(k?'Cambiar':'Conectar')+'</button>'+(k?'<button type="button" class="v4btn" data-cp-cntest>Probar CardNexus</button><button type="button" class="v4btn" data-cp-cndel>Desconectar</button>':'')+'</div>'+
  '<small>Opcional y gratis: con una cuenta de CardNexus (cardnexus.com → Ajustes → API Keys) la app ve el anuncio más barato de Cardmarket <b>en cada idioma y estado</b> (la guía oficial los mezcla) y los anuncios de CardNexus con su envío a España. Solo lectura; la clave se guarda únicamente en este dispositivo.</small></li>'}
function ctPanel(){const t=ctToken();
 return '<li><b>CardTrader (opcional) · anuncios por idioma</b> · '+(t?'conectado':'no conectado')+(M.src.ct?.lastErr?' · <span class="neg">'+E(M.src.ct.lastErr)+'</span>':'')+
  '<div class="cpCTk"><input type="password" autocomplete="off" data-cp-cttoken placeholder="'+(t?'Token guardado en este iPhone':'Pega tu token de CardTrader')+'" aria-label="Token de CardTrader"><button type="button" class="v4btn" data-cp-ctsave>'+(t?'Cambiar':'Conectar')+'</button>'+(t?'<button type="button" class="v4btn" data-cp-ctdel>Desconectar</button>':'')+'</div>'+
  '<small>CardTrader es otra web, no Cardmarket: la API de Cardmarket está cerrada a nuevas solicitudes y no hace falta. Si quieres anuncios por idioma de CardTrader: cuenta gratuita en CardTrader → Ajustes → API → copia el token. Solo lectura; se guarda únicamente en este dispositivo.</small></li>'}

/* ---------- Favoritos: vigiladas (datos en directo) y registradas (con su comprobación y «He comprado») ---------- */
let fv={type:"all",game:"all",...readLS("cv_v117_favview",{})};
function renderFavs(){
 const host=document.getElementById("cpFavs");if(!host||typeof document.querySelector!=="function")return;
 watch=readLS(WKEY,{});langData=readLS(LKEY,{});const c=cfg();
 const w=(window.CV_UNIVERSE?cardsPk():[]).concat(cardsJp(),cardsLo()).filter(x=>watch[x.id]&&(fv.game==="all"||gOf(x)===fv.game));
 for(const x of w){x.best=bestOp(x.ops,view.cond)||bestOp(x.ops,view.cond==="buen"?"mal":"buen");x.watch=watch[x.id];x.hit=!!(x.best&&x.best.buy<=x.watch.target)}
 w.sort((a,b)=>(b.hit-a.hit)||((b.best?.profit??-1e9)-(a.best?.profit??-1e9)));
 const missing=Object.keys(watch).filter(id=>!w.some(x=>x.id===id)&&(fv.game==="all"||(fv.game==="lorcana")===id.startsWith("lo-")));
 const showW=fv.type==="all"||fv.type==="watch"||fv.type==="hit",showR=fv.type==="all"||fv.type==="reg",list=fv.type==="hit"?w.filter(x=>x.hit):w;
 const sel=(k,opts,label)=>'<label>'+label+'<select data-cp-fav="'+k+'">'+opts.map(([v,t])=>'<option value="'+v+'"'+(fv[k]===v?' selected':'')+'>'+t+'</option>').join("")+'</select></label>';
 host.innerHTML='<section class="rdlivebox cpBox"><h3>Favoritos</h3><p class="v4note">Las cartas que vigilas (con aviso cuando bajan de tu precio) y las que registras desde Compra YA. Se guardan en este iPhone y viajan en la copia de seguridad de Datos.</p>'+
  '<div class="rdctl">'+sel("type",[["all","Todas"],["watch","Vigiladas"],["hit","Bajo mi precio"],["reg","Registradas"]],"Mostrar")+sel("game",[["all","Todas"],["pokemon","Pokémon"],["lorcana","Lorcana"],["mtg","Magic"],["onepiece","One Piece"],["gundam","Gundam"],["riftbound","Riftbound"]],"Juego")+'</div>'+
  (showW?'<h4>Vigiladas ('+list.length+')'+(w.filter(x=>x.hit).length?' · 🔔 '+w.filter(x=>x.hit).length+' bajo tu precio':'')+'</h4>'+(list.length?'<div class="v4list">'+list.map(x=>cardHtml(x,0,c,"fav-")).join("")+'</div>':'<p class="v4empty">'+(fv.type==="hit"?'Ninguna vigilada está por debajo de tu precio.':'Aún no vigilas ninguna carta: en Compra YA pon un precio y pulsa «Vigilar».')+'</p>')+
   (missing.length?'<p class="v4note">'+missing.length+' vigilada(s) sin precio cargado todavía (abre Compra YA para descargar la guía).</p>':''):'')+
  (showR?'<h4>Registradas</h4><div id="cpFavReg"></div>':'')+'</section>';
 if(showR){const n=window.CVVault?.renderFavs?.(document.getElementById("cpFavReg"),{game:fv.game})||0;if(!n)document.getElementById("cpFavReg").innerHTML='<p class="v4empty">Aún no has registrado ninguna carta: usa «Registrar este anuncio» en Compra YA.</p>'}
 host.querySelectorAll("img[data-v4img]").forEach(im=>{if(im.dataset.wired)return;im.dataset.wired="1";im.addEventListener("error",()=>{const a=im.dataset.alt;if(a&&!im.dataset.usedAlt){im.dataset.usedAlt="1";im.src=a;return}im.hidden=true;const n=im.parentElement.querySelector(".v4noimg");if(n)n.hidden=false})});
}
function onFavs(){ready.then(async()=>{renderFavs();try{await loadCatalog();if(!M.guide)await loadGuide(false)}catch{}renderFavs()})}

/* ---------- historial (guía diaria acumulada) ---------- */
const histCache={};
async function loadHist(pid,box){
 box=box||document.querySelector('[data-cp-hist="'+CSS.escape(String(pid))+'"]');if(!box)return;box.innerHTML='<p class="v4note">Cargando historial…</p>';
 try{let rows;
  if(/^(lo|bx)-/.test(String(pid))){/* V143 · Lorcana: historial diario de Bindex (tendencia de Cardmarket de cada versión, normal o foil); sin los puntos estimados */
   const x=cardsLo().find(c=>c.id===pid),b=x?.x;if(!b?.setId)throw new Error("carta sin colección");const k="lo:"+gOf(x)+":"+b.setId;
   const j=histCache[k]||(histCache[k]=await getJSON(BXB+gOf(x)+"/history/"+encodeURIComponent(b.setId)+".json",null,30000));rows=(j?.points?.[b.bxId+"|"+b.variant]||[]).filter(r=>N(r[2])&&!r[3]).map(r=>[r[0],null,r[2]])}
  else{const sh=Number(pid)%1000;const j=histCache[sh]||(histCache[sh]=await getJSON(ZZ+"history/"+sh+".json",null,30000));rows=(j?.[String(pid)]||[]).filter(r=>N(r[2]))}
  if(rows.length<2){box.innerHTML='<p class="v4note">Aún no hay historial suficiente para este producto.</p>';return}
  const xs=rows.map(r=>N(r[2])),lo=Math.min(...xs),hi=Math.max(...xs),W=300,H=70,pts=xs.map((v,i)=>(i*(W/(xs.length-1))).toFixed(1)+","+(H-4-(hi===lo?.5:(v-lo)/(hi-lo))*(H-8)).toFixed(1)).join(" ");
  box.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" class="cpSpark" role="img" aria-label="Tendencia de precio"><polyline fill="none" stroke="currentColor" stroke-width="2" points="'+pts+'"/></svg><p class="v4note">Tendencia de Cardmarket del '+E(DATE(rows[0][0]))+' al '+E(DATE(rows[rows.length-1][0]))+': '+EUR(xs[0])+' → '+EUR(xs[xs.length-1])+' ('+PCT(xs[xs.length-1]/xs[0]-1)+') · mínimo '+EUR(lo)+' · máximo '+EUR(hi)+'.</p>';
 }catch(e){box.innerHTML='<p class="v4note neg">No se pudo cargar el historial ('+E(e.message||e)+').</p>'}
}

/* ---------- acciones ---------- */
function saveLang(id,box){
 box=box||document.getElementById("cp-"+id);if(!box)return;const cur={};const bad=[];
 for(const [k,n] of LANGS){const bi=box.querySelector('[data-cp-lbuy="'+id+'|'+k+'"]'),si=box.querySelector('[data-cp-lsell="'+id+'|'+k+'"]'),ci=box.querySelector('[data-cp-lcond="'+id+'|'+k+'"]');if(!bi)continue;
  const b=NUM(bi.value),s=NUM(si.value);if((bi.value.trim()&&!Number.isFinite(b))||(si.value.trim()&&!Number.isFinite(s))){bad.push(n);continue}
  const pv=(langData[id]||{})[k],cond=ci?.value==="mal"?"mal":"buen";
  /* si no has cambiado lo pegado, se conserva tal cual (con su comprobación de idioma) */
  if(pv&&pv.src==="pegado"&&pv.buy===b&&(pv.sell===s||!N(pv.sell)&&!Number.isFinite(s))&&pv.cond===cond){cur[k]=pv;continue}
  if(Number.isFinite(b)||Number.isFinite(s))cur[k]={buy:Number.isFinite(b)?b:undefined,sell:Number.isFinite(s)?s:undefined,cond,at:new Date().toISOString()}}
 if(bad.length){alert("Importe no válido en: "+bad.join(", ")+". Usa números como 150 o 149,90.");return}
 const all=readLS(LKEY,{});if(Object.keys(cur).length)all[id]=cur;else delete all[id];
 if(!writeLS(LKEY,all)){alert("NO se han guardado los precios: el almacenamiento del navegador no lo permite.");return}
 langData=all;renderNow();renderFavs();box.scrollIntoView?.({block:"nearest"});
}
function savePaste(id,box){
 if(!box)return;const k=box.querySelector("[data-cp-pastelang]")?.value,cond=box.querySelector("[data-cp-pastecond]")?.value==="mal"?"mal":"buen",txt=box.querySelector("[data-cp-paste]")?.value||"";
 const name=(LANGS.find(l=>l[0]===k)||[])[1];if(!name)return;
 const fw=fakeWords(txt);if(fw.length){alert("⛔ El texto pegado dice «"+fw.join("», «")+"»: es un anuncio de carta proxy o falsa. No lo compres. No se han guardado estos precios.");return}
 const o=parseCmPaste(txt),buy=N(o.offerMin)||N(o.from),sell=saleRef({trend:o.trend,avg30:o.avg30,avg7:o.avg7});
 if(!Number.isFinite(buy)&&!Number.isFinite(sell)){alert("No encuentro precios en el texto pegado. Copia desde «Disponible/Desde» hasta los primeros anuncios de la ficha de Cardmarket.");return}
 const all=readLS(LKEY,{}),cur={...(all[id]||{})};
 cur[k]={buy:Number.isFinite(buy)?buy:undefined,sell:Number.isFinite(sell)?sell:undefined,from:N(o.from)||undefined,offerMin:N(o.offerMin)||undefined,offers:o.offers||0,trend:N(o.trend)||undefined,avg30:N(o.avg30)||undefined,avg7:N(o.avg7)||undefined,avg1:N(o.avg1)||undefined,cond,src:"pegado",at:new Date().toISOString()};
 all[id]=cur;if(!writeLS(LKEY,all)){alert("NO se han guardado los datos: el almacenamiento del navegador no lo permite.");return}
 langData=all;const x=cardsPk().concat(cardsJp(),cardsLo()).find(c=>c.id===id),chk=x?langCheck(x):{};
 renderNow();renderFavs();
 toastCp(name+": compra "+EUR(buy)+(Number.isFinite(sell)?" · venta "+EUR(sell):" · sin medias de venta en lo pegado")+(chk[k]==="general"?" · ⚠ la media es la general, no la del idioma":chk[k]==="separada"?" · venta del idioma comprobada":""));
}
function setWatch(id,target){const w=readLS(WKEY,{});if(target==null)delete w[id];else w[id]={target,at:new Date().toISOString()};if(!writeLS(WKEY,w)){alert("NO se ha guardado: el almacenamiento del navegador no lo permite.");return}watch=w;renderNow();renderFavs();if(target!=null)toastCp("Guardada en Favoritos · te avisaré si baja de "+EUR(target))}
function toastCp(msg){let t=document.getElementById("cpToast");if(!t){t=document.createElement("div");t.id="cpToast";t.className="v4toast";t.setAttribute("role","status");document.body.appendChild(t)}t.textContent=msg;t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>{t.hidden=true},3200)}
function promote(id){
 const x=cardsPk().concat(cardsJp()).find(c=>c.id===id);if(!x)return;const jp=x.kind==="jp",lg=jp?"japonés":"todos";const c=cfg(),b=bestOp(x.ops,"all"),l=links(x),p=x.p,d=p.date||new Date().toISOString();
 const sales=[];
 if(Number.isFinite(p.avg30))sales.push({kind:"agregado",price:p.avg30,currency:"EUR",date:d,condition:"todas",language:lg,platform:"Cardmarket · media 30 días (guía oficial, "+(jp?"producto japonés":"todos los idiomas")+")",url:l.cm,note:"Agregado de ventas reales; no es una venta individual."});
 if(Number.isFinite(p.trend))sales.push({kind:"agregado",price:p.trend,currency:"EUR",date:d,condition:"todas",language:lg,platform:"Cardmarket · tendencia (guía oficial)",url:l.cm,note:"Agregado."});
 if(Number.isFinite(p.low))sales.push({kind:"anuncio",price:p.low,currency:"EUR",date:d,condition:"desconocido",language:jp?"japonés":"desconocido",platform:"Cardmarket · «desde» (guía oficial)",url:l.cm,note:"Precio pedido. NO es una venta."});
 const sv=langData[x.id]||{},chk=langCheck(x);
 for(const [k,n] of LANGS){const v=sv[k];if(v?.src==="pegado"&&chk[k]==="separada"&&N(v.sell))sales.push({kind:"agregado",price:v.sell,currency:"EUR",date:v.at,condition:"todas",language:n,platform:"Cardmarket · venta de referencia en "+n.toLowerCase()+" (ficha filtrada, pegada por ti)",url:l.cm,note:"Agregado de ventas del idioma; no es una venta individual."})}
 for(const o of x.ops)if(o.own)sales.push({kind:"anuncio",price:o.buy,currency:"EUR",date:o.at||new Date().toISOString(),condition:o.cond==="mal"?"mal estado":"buen estado",language:o.lang,platform:"Cardmarket · anotado por ti",url:l.cm,note:"Precio pedido. NO es una venta."});
 const [a,alt]=jp?[x.image,""]:window.CVRadar?.pkImages?window.CVRadar.pkImages(x.r,null):["",""];
 window.CVVault?.addCustom?.({lane:b&&b.cond==="mal"?"restaurar":"compra",game:"pokemon",name:x.name,set:x.set,number:x.number,rarity:x.rarity,language:b&&b.own?b.lang:jp?"Japonés":"",image:a,imageAlt:alt||"",links:{cardmarket:l.cm},
  why:b?"Compra YA (Cardmarket, 41020): "+b.label+" · compra "+EUR(b.buy)+", con envío "+EUR(b.cost)+", venta "+EUR(b.sale)+" → "+SIGNED(b.profit)+". Versión: "+x.res.why+". Comprueba idioma, estado y número en el anuncio.":"Registrada desde Compra YA. Comprueba el anuncio.",sales,source:"Compra YA V118"});
}
let busy="",ctrl=null,started=false;
async function refresh(force){
 if(busy)return;ctrl=new AbortController();
 try{busy="Cargando catálogo…";render();await loadCatalog();
  busy="Descargando la guía oficial de Cardmarket…";render();try{await loadGuide(force)}catch{}
  busy="";render();loadPrev().then(render).catch(()=>{});loadFx().then(render).catch(()=>{});
  /* verificación de versiones: primero las colecciones de las cartas que salen en la lista y las vigiladas */
  /* Primero las colecciones de las cartas que valen ≥ 40 € y se venden (de más a menos valor): la 2.ª fuente trae el
     «desde» EX o mejor, que es el único precio de compra fiable; sin él la carta no puede salir como oportunidad. */
  const L=list(),pot=cardsPk().filter(x=>hasPtcg(x.id)&&saleRef(x.p)>=40&&(x.liq?.k||0)>=1).sort((a,b)=>saleRef(b.p)-saleRef(a.p));
  const first=[...new Set(L.sure.concat(L.pending).slice(0,80).filter(x=>x.kind==="pk"&&hasPtcg(x.id)).concat(pot).map(x=>ptSetOf(x.id)))];
  const rest=[...new Set(window.CV_UNIVERSE.cards.filter(r=>hasPtcg(r[0])).map(r=>ptSetOf(r[0])))].filter(s=>!first.includes(s));
  const lor=view.game==="all"||isBx(view.game)?loadAllBx(ctrl).then(render):Promise.resolve();
  if(ctToken()&&!M.src.ct?.test)ctTest().then(render);/* el estado de CardTrader, al momento */
  await verifyPriority(ctrl);ctAuto();/* CardTrader en paralelo, sin esperar a todas las colecciones */
  if(cnKey())lor.then(()=>cnScan(false));/* V143: CardNexus (Cardmarket por idioma), con Lorcana ya cargada */
  await verifySets(first.concat(rest),ctrl);await lor;
 }finally{busy="";ctrl=null;render()}
 ctAuto();
}
/* V131 (V134: 30): con token de CardTrader, comprueba solo las CT_AUTO cartas con más margen posible cuyo anuncio más barato de Cardmarket
   es de idioma desconocido: si en CardTrader hay una en INGLÉS lo bastante barata, sale como oportunidad del mismo idioma. */
let ctAutoDone=false;const CT_AUTO=60;
/* V140 · 🤖 Piloto automático (sin IA de pago ni servidores): con la app abierta, cada 15 min vuelve a mirar la guía (si
   hay una nueva) y CardTrader en las cartas de tu lista; detecta las compras que NO estaban antes, las marca «🆕 NUEVA»
   y te avisa (aviso del sistema si lo permites; en iPhone, con la app añadida a la pantalla de inicio). */
const SEENKEY="cv_v140_seen",AP_EVERY=15*60e3;let seen=readLS(SEENKEY,{}),apLast=Date.now(),apNew=[];
if(!seen.__init){seen={__init:Date.now()};writeLS(SEENKEY,seen)}
const oppKey=(x,o)=>x.id+"|"+o.k+"|"+Math.round(o.cost);
function trackNew(L,c){
 const now=Date.now(),fresh=[];let dirty=false;
 for(const x of L.sure){const o=goodOp(x.best,x,c)?x.best:null;if(!o)continue;const k=oppKey(x,o);
  if(!seen[k]){seen[k]=now;dirty=true;if(now-seen.__init>60e3)fresh.push({x,o})}
  x.isNew=seen[k]>seen.__init+60e3&&now-seen[k]<DAY}
 /* también los chollos nuevos (anuncio a la mitad de su valor o menos) */
 for(const h of chollos(c)){const k=h.x.id+"|chollo|"+Math.round(h.cost);if(!seen[k]){seen[k]=now;dirty=true;if(now-seen.__init>60e3)fresh.push({x:h.x,o:{...h.op,k:"chollo"},chollo:true})}}
 for(const k in seen)if(k!=="__init"&&now-seen[k]>7*DAY){delete seen[k];dirty=true}
 if(dirty)writeLS(SEENKEY,seen);
 if(fresh.length){apNew=fresh.concat(apNew).slice(0,20);const f0=fresh[0],d=f0.chollo?{text:"🎲 chollo por verificar: pagas "+EUR(f0.o.cost)+" → ganas "+SIGNED(f0.o.profit)+" si está bien"}:decide(f0.x,c);toastCp("🆕 "+fresh.length+" compra(s) nueva(s): "+f0.x.name+(f0.chollo?" (🎲 chollo)":""));
  try{if(typeof Notification==="function"&&Notification.permission==="granted")new Notification("Card Vault · "+fresh.length+" compra(s) nueva(s)",{body:fresh[0].x.name+" · "+(d?.text||""),tag:"cv-nuevas"})}catch{}}
}
function apTick(force){
 if(force!==true&&(document.visibilityState!=="visible"||Date.now()-apLast<AP_EVERY))return;apLast=Date.now();
 loadGuide(force===true).then(render).catch(()=>{});/* la guía solo se baja si hay una nueva (6 h) */
 if(cnKey())cnScan();/* V143 */
 if(ctToken()&&ctAutoDone)ctSweep().then(()=>{const l=selLang();if(OTHER_L.includes(l))return ctSweep(false,l)});
 if(ctToken())for(const x of list().sure.slice(0,30)){const r=ctRes[x.id];if(r&&!r.loading&&(!r.at||Date.now()-r.at>AP_EVERY)){delete ctRes[x.id];ctEnqueue(x.id)}}
 render();
}
setInterval(apTick,60e3);document.addEventListener("visibilitychange",apTick);
function apHtml(){
 const n=apNew.filter(o=>Date.now()-(seen[oppKey(o.x,o.o)]||0)<DAY).length,perm=typeof Notification==="function"?Notification.permission:"no";
 return '<p class="v4note cpAuto">🤖 <b>Piloto automático</b> · con la app abierta revisa la guía y CardTrader cada 15 min y marca <b>🆕 NUEVA</b> cada compra que no estaba antes'+(n?' · <b>'+n+' nueva(s) hoy</b>':'')+(ctToken()&&(sweep.busy||sweep.cards)?' · CardTrader: '+(sweep.busy?'⏳ barriendo colecciones'+(sweep.busy!=="base"&&LNAME2[sweep.busy]?' en '+LNAME2[sweep.busy].toLowerCase():'')+'…':(sweep.lang&&sweep.lang!=="base"&&LNAME2[sweep.lang]?'('+LNAME2[sweep.lang].toLowerCase()+') ':'')+'cartas comparadas '+sweep.cards+' (en '+sweep.exps+' colecc.) · compras con tu beneficio: '+sweep.buys):'')+(ctToken()&&sweep.err?' · <span class="neg">barrido: '+E(sweep.err)+'</span>':'')+' · última revisión '+new Date(apLast).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})+'.'+(perm==="default"?' <button type="button" class="v4btn" data-cp-notify>🔔 Avisarme de compras nuevas</button>':perm==="granted"?' 🔔 Avisos activados.':perm==="no"?' (Para avisos del sistema en iPhone, añade la app a la pantalla de inicio.)':'')+'</p>';
}
/* V139 · CardTrader en TODAS las cartas que ves: al aparecer en pantalla, su precio en su idioma se pide solo (en cola, de
   una en una, con pausa: el límite de CardTrader es 10/s). */
const ctQ=[];let ctQBusy=false,ctObs=null;
function ctEnqueue(id){if(!ctToken()||ctRes[id]||ctQ.includes(id))return;ctQ.push(id);ctRes[id]={loading:true};ctRun()}
async function ctRun(){if(ctQBusy)return;ctQBusy=true;try{while(ctQ.length){const id=ctQ.shift();delete ctRes[id];await ctLoad(id);await new Promise(r=>setTimeout(r,250))}}finally{ctQBusy=false}}
function ctWatch(slot){
 if(!ctToken()||typeof IntersectionObserver!=="function")return;ctObs?.disconnect();
 ctObs=new IntersectionObserver(es=>{for(const e of es){if(!e.isIntersecting)continue;const id=e.target.dataset.cpid;if(id)ctEnqueue(id);/* V140: también Lorcana */ctObs.unobserve(e.target)}},{rootMargin:"200px"});
 slot.querySelectorAll(".cpCard[data-cpid]").forEach(el=>{if(!ctRes[el.dataset.cpid])ctObs.observe(el)});
}
/* «Probar CardTrader»: GET /info (la llamada que CardTrader indica para comprobar el token) */
async function ctTest(){
 const t=ctToken(),ti=tokInfo(t);let r;
 if(!t)r={ok:false,err:"sin token"};
 else if(!ti.ok)r={ok:false,err:"El token "+ti.why+"."};
 else{try{const j=await ctGet("/info");r={ok:true,name:String(j?.name||j?.app?.name||"tu app")}}
  catch(e){const m=String(e.message||e);
   /* /info falla: ¿funciona el resto? (es lo que la app usa de verdad) */
   if(/HTTP 5\d\d/.test(m)){try{await ctGet("/games");r={ok:true,name:"funciona; /info dio error en CardTrader"}}catch(e2){r={ok:false,err:m+" · CardTrader da error interno con este token: cópialo de nuevo ENTERO desde CardTrader → Ajustes → API (o genera uno nuevo) y pégalo aquí con «Cambiar»."}}}
   else r={ok:false,err:/no responde|navegador/.test(m)?m+" (bloqueo del navegador o sin conexión).":m}}}
 if(ti.exp&&r.ok)r.name+=" · token válido hasta "+ti.exp;
 M.src.ct={...(M.src.ct||{}),test:{...r,at:Date.now()},lastErr:r.ok?"":r.err};
 return M.src.ct.test;
}
/* V141 · Barrido de CardTrader por COLECCIÓN: una sola consulta trae los 25 anuncios más baratos de CADA carta de la
   colección en el idioma que se compara (antes, una consulta por carta: 60 al abrir). Se eligen las colecciones con más
   beneficio posible y se van rotando (una colección no se repite en 6 h), así en pocas horas se compara casi todo. */
const SWKEY="cv_v141_sweep",SWEEP_EXPS=12,SWEEP_EVERY=60*60e3,SWEEP_AGAIN=6*36e5;let sweep={at:0,busy:false,exps:0,cards:0,buys:0,err:"",...readLS(SWKEY,{}),busy:false};sweep.done=sweep.done||{};
/* V142 · El barrido también por IDIOMA: «base» = inglés (y japonés en las japonesas); con otro idioma elegido en el filtro
   (alemán, francés, italiano, español, portugués, coreano o chino) se barren sus anuncios en ese idioma. */
function sweepGroups(c,exps,lang){
 const base=lang==="base",g={};for(const x of cardsPk().concat(cardsJp(),cardsLo())){if(x.owned||(TRUST[x.res?.status]??0)<2||(x.liq?.k||0)<2||!Number(x.res?.pid))continue;
  if(!base&&(x.kind==="jp"||x.kind==="lo"&&!gLangs(x).includes(lang)))continue;
  const S=saleRef(x.p),mc=malCfg(c);if(!Number.isFinite(S)||S<Math.min(40,mc.ratio*10))continue;let room=Math.min(netSale(S,c)-minP(x,c),netSale(S,c)/(1+(c.minMargin||0)/100),c.maxBuy)-c.buyShip;
  if(room<S*FAKE_RATIO*(base?1:.5)){if(!(base&&S>=mc.ratio*10))continue;room=S*.1}/* ni el más barato dejaría tu beneficio… salvo en mal estado barato (V146) */
  const e=ctExpCands(x,exps[gOf(x)])[0];if(!e)continue;const lg=base?(x.kind==="jp"?"ja":"en"):lang,k=e.id+"|"+lg;(g[k]=g[k]||{exp:e,lg,cards:[],pot:0}).cards.push(x);g[k].pot+=room}
 return Object.entries(g).filter(([k])=>Date.now()-(sweep.done[k]||0)>SWEEP_AGAIN).sort((a,b)=>b[1].pot-a[1].pot).slice(0,SWEEP_EXPS);
}
async function ctSweep(force,lang="base"){
 const atK=lang==="base"?"at":"at_"+lang;
 if(sweep.busy&&sweep.busy!==lang&&ctToken()){sweep.next=[lang,force];return}/* V142: el idioma que eliges se barre en cuanto acabe el barrido en marcha */
 if(sweep.busy||!ctToken()||!M.guide||(!force&&Date.now()-(sweep[atK]||0)<SWEEP_EVERY))return;sweep.busy=lang;sweep[atK]=Date.now();const c=cfg();let nc=0,nb=0,ne=0;
 try{const exps={pokemon:await ctExps({kind:"pk"})};for(const g of Object.keys(BXG))exps[g]=await ctExps({kind:"lo",game:g}).catch(()=>[]);
  for(const [k,G] of sweepGroups(c,exps,lang)){
   const bps=await ctBpOf(G.exp),byPid=new Map();for(const b of bps)for(const id of (b.card_market_ids||[]))byPid.set(Number(id),b);
   let j;try{j=await ctGet("/marketplace/products?expansion_id="+encodeURIComponent(G.exp.id)+"&language="+CTLANG[G.lg])}catch(e){if(/token|navegador|no responde|demasiadas/i.test(e.message))throw e;j=await ctGet("/marketplace/products?expansion_id="+encodeURIComponent(G.exp.id))}
   for(const x of G.cards){const b=byPid.get(Number(x.res.pid)),old=ctRes[x.id];if(!b||old?.loading)continue;
    const fresh=ctSummary((j&&j[b.id])||[],x.kind==="lo"?x.fo:undefined),tg=fresh.find(o=>o.lang===G.lg);nc++;if(!tg)continue;/* sin anuncios en su idioma entre los más baratos: la consulta carta a carta (por idioma) lo mirará */
    const S=saleRef(x.p);if(tg.cheapestGood&&tg.cheapestGood.eur>=S*FAKE_RATIO*.5&&netSale(S,c)-tg.cheapestGood.eur-minP(x,c)>=0)tg.cheapestGood.ship=await ctShip(tg.cheapestGood.user);
    const mc=malCfg(c),b0=tg.bad?.[0];if(b0&&b0.eur<=mc.max&&S/b0.eur>=mc.ratio)b0.ship=await ctShip(b0.user);/* V146: envío real del más barato en mal estado */
    /* se juntan con lo que ya había de otros idiomas (el barrido en alemán no borra el inglés) */
    const langs=new Set(fresh.map(o=>o.lang)),rows=(old?.rows||[]).filter(o=>!langs.has(o.lang)).concat(fresh);
    ctRes[x.id]={rows,exp:G.exp.name,bp:b.id,how:"id de Cardmarket",at:Date.now(),sweep:true};
    if(ops(x,c).some(o=>(o.k==="ct"||o.ctl&&o.langK===G.lg)&&goodOp(o,x,c)&&opIn(o)))nb++}
   ne++;sweep.done[k]=Date.now();M.src.ct={...(M.src.ct||{}),ok:(M.src.ct?.ok||0)+1,last:Date.now(),lastErr:""};render();await new Promise(r=>setTimeout(r,300))}
  sweep.err=""}
 catch(e){sweep.err=String(e.message||e).slice(0,90);logErr("CardTrader barrido: "+sweep.err)}
 finally{sweep.busy=false;sweep.lang=lang;sweep.exps=ne;sweep.cards=nc;sweep.buys=nb;for(const k in sweep.done)if(Date.now()-sweep.done[k]>SWEEP_AGAIN)delete sweep.done[k];writeLS(SWKEY,{at:sweep.at,lang,exps:ne,cards:nc,buys:nb,err:sweep.err,done:sweep.done});render();const nx=sweep.next;sweep.next=null;if(nx&&nx[0]!==lang)setTimeout(()=>ctSweep(nx[1],nx[0]),300)}
}
async function ctAuto(){
 if(ctAutoDone||!ctToken())return;ctAutoDone=true;const c=cfg();
 const cand=cardsPk().concat(cardsJp(),cardsLo()).filter(x=>!x.owned&&!ctRes[x.id]&&(TRUST[x.res?.status]??0)>=2&&(x.liq?.k||0)>=2).map(x=>{const S=saleRef(x.p),lo=Math.min(...[x.p.low,x.p.exPlus].filter(Number.isFinite));return {x,S,lo,room:netSale(S,c)-minP(x,c)-c.buyShip}})
  .filter(o=>Number.isFinite(o.S)&&o.S>=40&&Number.isFinite(o.lo)&&o.lo<o.S*LANG_OK&&o.lo<=Math.min(o.room,c.maxBuy-c.buyShip)).sort((a,b)=>(b.room-b.lo)-(a.room-a.lo)).slice(0,CT_AUTO);
 const t=await ctTest();if(!t.ok){render();return}
 await ctSweep(true);/* V141: primero el barrido por colección (cubre muchas más cartas con menos consultas) */
 if(OTHER_L.includes(selLang()))await ctSweep(true,selLang());/* V142: y el idioma elegido en el filtro */
 for(const h of malCheck(c).slice(0,30))ctEnqueue(h.x.id);/* V147: las de «mal estado barato» por comprobar, carta a carta (idioma y estado) */
 /* además de las candidatas, las cartas que ves en Compra YA (las 25 primeras), para comparar Cardmarket y CardTrader */
 const vis=list().sure.slice(0,25).filter(x=>!ctRes[x.id]&&!cand.some(o=>o.x.id===x.id)).map(x=>({x}));
 for(const o of cand.concat(vis)){if(ctRes[o.x.id]&&!ctRes[o.x.id].error)continue;/* ya pedida por la cola de pantalla */await ctLoad(o.x.id);if(ctRes[o.x.id]?.error&&/token|navegador|no responde/i.test(ctRes[o.x.id].error))break;await new Promise(r=>setTimeout(r,250))}
 /* tiendas que dejen leer su precio (si ninguna, no se enseña nada) */
 if(!SHOPS.some(sh=>shopSt[sh.id]&&Date.now()-shopSt[sh.id].at<864e5))await shopProbe();
 if(SHOPS.some(sh=>shopSt[sh.id]?.ok))for(const x of list().sure.filter(x=>x.kind==="jp").slice(0,15))await shopLoad(x.id,true);
}
/* Verifica primero las colecciones de lo que estás viendo (lista o búsqueda), aunque otra verificación esté en marcha. */
let vqBusy=false;
async function verifyVisible(){
 if(vqBusy||!window.CV_UNIVERSE)return;const L=list();
 const sets=[...new Set(L.sure.concat(L.pending).slice(0,30).filter(x=>x.kind==="pk"&&hasPtcg(x.id)&&!(M.pt.cards[x.id]&&Date.now()-M.pt.cards[x.id].t<PT_TTL)).map(x=>ptSetOf(x.id)))].filter(s=>!(M.pt.sets[s]&&Date.now()-M.pt.sets[s]<PT_TTL)).slice(0,6);
 if(!sets.length)return;vqBusy=true;try{await verifySets(sets,new AbortController())}finally{vqBusy=false;render()}
}
function onShow(){ready.then(()=>{render();if(!started&&navigator.onLine!==false){started=true;setTimeout(()=>refresh(false),900)}})}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-cp-cnsave],[data-cp-cntest],[data-cp-cndel],[data-cp-notify],[data-cp-diag],[data-cp-diagclear],[data-cp-cttest],[data-cp-shopload],[data-cp-shopprobe],[data-cp-fakecheck],[data-cp-jpsave],[data-cp-refresh],[data-cp-lsave],[data-cp-pastesave],[data-cp-pasteopen],[data-cp-watch],[data-cp-unwatch],[data-cp-promote],[data-cp-histload],[data-cp-ctload],[data-cp-ctsave],[data-cp-ctdel]");if(!t)return;const d=t.dataset;
 if("cpJpsave" in d){const box=t.closest("[data-cp-impbox]"),v=k=>{const r=String(box.querySelector('[data-cp-jp="'+k+'"]')?.value||"").trim();return r==="0"?0:NUM(r)};/* 0 es válido */
  const f={ems:v("ems"),buyee:v("buyee"),duty:v("duty"),vat:v("vat"),handling:v("handling"),shipUS:v("shipUS")},ra=Number(String(box.querySelector('[data-cp-jp="rate"]')?.value||"").replace(",","."));
  if(Object.values(f).some(x=>!Number.isFinite(x))){alert("Revisa los gastos: números como 3450, 500, 3, 21 o 15.");return}
  jp={...jp,...f};writeLS(JKEY,jp);if(ra>0&&ra<1){fx={...fx,rate:ra,date:fx.date||new Date().toISOString().slice(0,10),manual:true};writeLS(FXKEY,fx)}
  renderNow();toastCp("Gastos de importación guardados");return}
 if(d.cpShopload){shopLoad(d.cpShopload);if(ctToken()&&!ctRes[d.cpShopload])ctLoad(d.cpShopload);return}
 if("cpShopprobe" in d){t.disabled=true;t.textContent="Probando…";shopProbe().then(renderNow);return}
 if("cpNotify" in d){try{Notification.requestPermission().then(()=>renderNow())}catch{}return}
 if("cpDiag" in d){const txt=diagText(),o=document.querySelector("[data-cp-diagout]");if(o){o.hidden=false;o.textContent=txt}
  (navigator.clipboard?.writeText?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toastCp("Diagnóstico copiado: pégalo en el chat"),()=>toastCp("Selecciona el texto de abajo y cópialo"));return}
 if("cpDiagclear" in d){try{localStorage.removeItem(ERRKEY)}catch{}renderNow();return}
 if("cpCttest" in d){t.disabled=true;t.textContent="Probando…";ctTest().then(r=>{renderNow();toastCp(r.ok?"CardTrader conectado ✓":"CardTrader: "+r.err)});return}
 if("cpFakecheck" in d){const b=t.closest("[data-cp-fakebox]"),o=b?.querySelector("[data-cp-fakeout]");if(o)o.textContent=fakeVerdict(b.querySelector("[data-cp-faketxt]")?.value);return}
 if(d.cpCtload){ctLoad(d.cpCtload);return}
 if(d.cpPastesave){savePaste(d.cpPastesave,t.closest(".cpPaste"));return}
 if(d.cpPasteopen){const k=d.cpPasteopen.split("|")[1],box=t.closest(".cpCard")?.querySelector(".cpPaste");if(!box)return;box.open=true;const sl=box.querySelector("[data-cp-pastelang]");if(sl)sl.value=k;box.querySelector("[data-cp-paste]")?.focus();box.scrollIntoView?.({block:"nearest"});return}
 if("cpCtsave" in d){const v=cleanTok(document.querySelector("[data-cp-cttoken]")?.value);if(!v){alert("Pega el token de tu cuenta de CardTrader.");return}try{localStorage.setItem(CTKEY,v)}catch{alert("NO se ha guardado el token: el almacenamiento del navegador no lo permite.");return}M.src.ct={};for(const k in ctRes)delete ctRes[k];renderNow();return}
 if("cpCnsave" in d){const v=cleanTok(document.querySelector("[data-cp-cnkey]")?.value);if(!v){alert("Pega la clave de tu cuenta de CardNexus.");return}try{localStorage.setItem(CNKEY,v)}catch{alert("NO se ha guardado la clave: el almacenamiento del navegador no lo permite.");return}cnSt.err="";cnTest().then(r=>{toastCp(r.ok?"CardNexus conectado ✓":"CardNexus: "+r.err);if(r.ok)cnScan(true);renderNow()});renderNow();return}
 if("cpCntest" in d){t.disabled=true;t.textContent="Probando…";cnTest().then(r=>{renderNow();toastCp(r.ok?"CardNexus conectado ✓":"CardNexus: "+r.err)});return}
 if("cpCndel" in d){try{localStorage.removeItem(CNKEY)}catch{}for(const k in cnRes)delete cnRes[k];cnSt={ok:0,fail:0,err:"",busy:false,cards:0,at:0,test:null};renderNow();return}
 if("cpCtdel" in d){try{localStorage.removeItem(CTKEY)}catch{}M.src.ct={};for(const k in ctRes)delete ctRes[k];renderNow();return}
 if("cpRefresh" in d){M.pt.sets={};if(M.lo)M.lo.at=0;loState="";refresh(true)}
 else if(d.cpLsave)saveLang(d.cpLsave,t.closest(".cpCard"));
 else if(d.cpWatch){const v=NUM(t.closest(".cpCard")?.querySelector("[data-cp-target]")?.value);if(!Number.isFinite(v)){alert("Indica el precio máximo al que quieres comprar.");return}setWatch(d.cpWatch,v)}
 else if(d.cpUnwatch)setWatch(d.cpUnwatch,null);
 else if(d.cpPromote)promote(d.cpPromote);
 else if(d.cpHistload)loadHist(d.cpHistload,t.closest(".cpHist"));
});
document.addEventListener("change",e=>{const f=e.target.closest("[data-cp-fav]");if(f){fv[f.dataset.cpFav]=f.value;writeLS("cv_v117_favview",fv);renderFavs();return}});
document.addEventListener("change",e=>{const t=e.target.closest("[data-cp-view]");if(!t)return;view[t.dataset.cpView]=t.value;writeLS(VKEY,view);if(t.dataset.cpView==="cond")window.CVVault?.setCondView?.(t.value);if(t.dataset.cpView==="game"&&(t.value==="all"||isBx(t.value)))loadAllBx(new AbortController()).then(render);if(t.dataset.cpView==="lang"&&OTHER_L.includes(t.value)&&ctToken())ctSweep(false,t.value);renderNow()});
let qT=null;document.addEventListener("input",e=>{const t=e.target.closest("[data-cp-q]");if(!t)return;clearTimeout(qT);qT=setTimeout(()=>{view.q=t.value;writeLS(VKEY,view);renderNow();if(view.q.trim())verifyVisible();const q=document.querySelector("[data-cp-q]"),ae=document.activeElement;if(q&&(!ae||ae===document.body||!ae.isConnected)){q.focus();q.setSelectionRange(q.value.length,q.value.length)}},250)});/* devuelve el foco al buscador solo si no te has ido a otro campo */
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="radar"]'))setTimeout(onShow,60);if(e.target.closest('.mainNav [data-tab="favoritos"]'))setTimeout(onFavs,60)});
if(location.hash==="#favoritos")setTimeout(onFavs,1300);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(onShow,1200));else setTimeout(onShow,1200);
window.CVCompra={malCheck,malHunt,condLvl,BXG,gOf,loadBx,minLiq,cardsLo,cnScan,cnState:()=>({cnSt,cnRes,cnMap}),ctSweep,ctState:()=>({sweep,ctRes}),apTick,trackNew,seenState:()=>seen,decide,tgtOf,diagText,logErr,verifyPriority,ctTest,ctShip,SHOPS,shopProbe,shopLoad,shopState:()=>shopSt,fakeWords,FAKE_RATIO,chollos,loDiag,minP,opIn,top5,ctBlueprint,ctGet,ctToken,ctSummary,parseTcg,bgRender:render,jpRoute,jpCalc,loadFx,loadOld,loadPrev,sniper,matchOwned,loadCatalog,loadGuide,ready_:()=>ready,confidence,cardsPk,links,netSale,cfg,G,saleRef_:saleRef,parseCmPaste,langCheck,cardsJp,renderFavs,render:renderNow,refresh,resolve,ops,bestOp,parseGuide,parsePtCard,liquidity,momentum,saleRef,list,state:()=>M,ready:()=>ready,setState:x=>{M={...M,...x}},reloadLocal:()=>{langData=readLS(LKEY,{});watch=readLS(WKEY,{});view={...view,...readLS(VKEY,{})}}};
})();
