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
const ZZ="https://raw.githubusercontent.com/ZyzyThePizi/pokemon-price-data/main/",PT="https://api.pokemontcg.io/v2",BX="https://douxeh.github.io/bindex-prices/v1/lorcana/";
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
const cfg=()=>({feePct:5,sellShip:5,buyShip:6,minProfit:40,restLow:.6,restMid:.75,restHigh:.9,...(window.CVVault?.user?.().cfg||{})});
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
function parsePtCard(c){const cm=c?.cardmarket?.prices||{};return {t:Date.now(),trend:N(cm.trendPrice),avg30:N(cm.avg30),low:N(cm.lowPrice),exPlus:N(cm.lowPriceExPlus),avg7:N(cm.avg7),avg1:N(cm.avg1),updated:c?.cardmarket?.updatedAt||""}}
let ptRunning=null;/* progreso de la verificación en bloque */
async function verifySets(sets,ctrl){
 const rev={};for(const r of window.CV_UNIVERSE.cards)if(hasPtcg(r[0]))rev[ptcgId(r[0])]=r[0];
 const todo=sets.filter(s=>!(M.pt.sets[s]&&Date.now()-M.pt.sets[s]<PT_TTL));
 const prog={total:todo.length,done:0};ptRunning=prog;
 for(const s of todo){if(ctrl.signal.aborted)break;if(budget().n>=PT_DAILY){M.src.ptcg.lastErr="Tope diario propio ("+PT_DAILY+") alcanzado: sigue mañana";break}
  let page=1,got=0,total=Infinity,ok=true;
  while(got<total){
   try{spend();M.src.ptcg.req++;
    const j=await getJSON(PT+"/cards?q=set.id:"+encodeURIComponent(s)+"&pageSize=250&page="+page+"&select=id,cardmarket",ctrl.signal,45000);
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
async function loadLorcana(ctrl){
 if(M.lo&&Date.now()-M.lo.at<LO_TTL)return;if(loState.startsWith("Cargando"))return;
 loState="Cargando Lorcana (precios de Cardmarket vía Bindex)…";render();
 try{const sets=(await getJSON(BX+"sets.json",ctrl.signal,30000))?.sets||[];const cards=[];
  for(const s of sets){if(ctrl.signal.aborted)break;
   try{const f=await getJSON(BX+"sets/"+encodeURIComponent(s.id)+".json",ctrl.signal,30000);
    for(const c of (f?.cards||[])){const vs=(c.variants||[]).filter(v=>v?.eur&&N(v.eur.trend));if(!vs.length)continue;
     const ench=/enchanted|iconic|epic/i.test(c.rarity||"");const v=(ench&&vs.find(x=>x.name==="foil"))||vs.find(x=>x.name==="normal")||vs[0];
     cards.push({id:"lo-"+c.id,name:c.name,number:String(c.number||""),set:s.name||f?.set?.name||"",rarity:c.rarity||"",variant:v.name,image:c.imageLarge||c.imageSmall||"",cm:c.cardmarketId||null,
      low:N(v.eur.low),trend:N(v.eur.trend),avg1:N(v.eur.avg1),avg7:N(v.eur.avg7),avg30:N(v.eur.avg30),updated:f?.updatedAt||""})}
   }catch(e){if(ctrl.signal.aborted)break;M.src.bindex.fail++;M.src.bindex.lastErr=String(e.message||e).slice(0,80)}
   await sleep(150)}
  if(cards.length){M.lo={at:Date.now(),cards};M.src.bindex.ok++;M.src.bindex.last=Date.now();M.src.bindex.lastErr="";loState=""}
  else loState="Lorcana no disponible: Bindex no ha devuelto cartas con precio de Cardmarket"+(M.src.bindex.lastErr?" ("+M.src.bindex.lastErr+")":"")+". Mira «Estado de las fuentes».";
  persist();
 }catch(e){M.src.bindex.fail++;M.src.bindex.lastErr=String(e.message||e).slice(0,80);loState="Lorcana no disponible ahora: "+M.src.bindex.lastErr+". Pulsa «Actualizar precios» para reintentar.";persist()}
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
const LANGS=[["en","Inglés"],["es","Español"],["fr","Francés"],["de","Alemán"],["it","Italiano"],["pt","Portugués"],["ja","Japonés"]];
let langData=readLS(LKEY,{}),watch=readLS(WKEY,{}),view={game:"all",cond:"buen",show:"profit",sort:"profit",q:"",lang:"all",...readLS(VKEY,{})};if(view.cond!=="mal")view.cond="buen";
const netSale=(v,c)=>v*(1-c.feePct/100)-c.sellShip;
const inBudget=v=>Number.isFinite(v)&&v>=20&&v<=200;
function liquidity(p){if(N(p.avg1)&&N(p.avg7))return {k:3,t:"Se vende a diario"};if(N(p.avg7))return {k:2,t:"Ventas esta semana"};if(N(p.avg30))return {k:1,t:"Pocas ventas (30 días)"};return {k:0,t:"Sin ventas recientes"}}
function momentum(p){return N(p.avg7)&&N(p.avg30)?p.avg7/p.avg30-1:NaN}
function saleRef(p){const xs=[p.trend,p.avg30,p.avg7].filter(Number.isFinite);return xs.length?Math.min(...xs):NaN}
function ops(card,c){
 const {p,res}=card,S=saleRef(p),out=[],saved=langData[card.id]||{},jp=card.kind==="jp",idi=jp?"japonés":"idioma sin indicar";
 const add=o=>{o.cost=o.buy+c.buyShip;o.profit=Number.isFinite(o.sale)?netSale(o.sale,c)-o.cost:NaN;o.margin=o.profit/o.cost;o.maxBuy=Number.isFinite(o.sale)?netSale(o.sale,c)-c.minProfit-c.buyShip:NaN;out.push(o)};
 if(Number.isFinite(S)){
  if(Number.isFinite(p.exPlus))add({k:"ex",cond:"buen",label:"Cardmarket · EX o mejor ("+idi+") → venta en Cardmarket"+(jp?" (ventas de cartas japonesas)":""),buy:p.exPlus,sale:S});
  else if(Number.isFinite(p.low)&&p.low>=S*.5)add({k:"low",cond:"buen",label:jp?"Cardmarket · «desde» japonés (estado sin indicar) → venta de cartas japonesas en Cardmarket":"Cardmarket · «desde» (estado e idioma sin indicar) → venta en Cardmarket",buy:p.low,sale:S});
  if(Number.isFinite(p.low)&&p.low<S*.5)add({k:"po",cond:"mal",label:"Restaurar · «desde» en mal estado → venta mejorada al "+Math.round(c.restLow*100)+" % (supuesto conservador)",buy:p.low,sale:S*c.restLow});
 }
 const chk=langCheck(card);
 for(const [k,name] of LANGS){const v=saved[k];if(!v||!N(v.buy))continue;const cond=v.cond==="mal"?"mal":"buen";const ls=N(v.sell),sep=chk[k]==="separada";
  /* venta del mismo idioma: la media pegada solo cuenta si se ha comprobado que es distinta de la media general */
  const sale0=ls&&(v.src!=="pegado"||sep)?ls:S,sale=Number.isFinite(sale0)?(cond==="mal"?sale0*c.restLow:sale0):NaN;
  const how=v.src==="pegado"?(sep?"venta media 30 días en "+name.toLowerCase()+" (Cardmarket, comprobada)":"venta en Cardmarket de todos los idiomas (la ficha no separó el idioma)"):(ls?"anotada en "+name.toLowerCase():"en Cardmarket (todos los idiomas)");
  add({k:"own-"+k,cond,own:true,lang:name,sameLang:v.src==="pegado"?sep:!!ls,label:name+" · "+(v.src==="pegado"?"Cardmarket filtrado por "+name.toLowerCase()+" (pegado por ti)":"anotado por ti")+" → "+how,buy:N(v.buy),sale,at:v.at})}
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
 parts.estado=!o?0:o.k==="ex"?15:o.own||o.k==="po"?8:0;/* en restaurar el mal estado es lo esperado; queda por ver cuánto */
 const score=Object.values(parts).reduce((a,b)=>a+b,0);
 return {score,parts,disp,prudent:Number.isFinite(o?.profit)?o.profit*score/100:NaN};
}
function bestOp(list,cond){return list.filter(o=>(cond==="all"||o.cond===cond)&&Number.isFinite(o.profit)&&inBudget(o.buy)).sort((a,b)=>b.profit-a.profit)[0]||null}
function ownedSet(){const st=window.CVStateBridge?.get?.(),n=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim(),num=v=>String(v||"").split("/")[0].replace(/\D/g,"").replace(/^0+/,"");
 const s=new Set();for(const c of (st?.cards||[]))if(!c.archivedSold)s.add(n(c.name)+"|"+num(c.number));return {has:(name,number)=>s.has(n(name)+"|"+num(number))}}
function cardsPk(){
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
function cardsJp(){
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
function cardsLo(){
 if(!M.lo?.cards)return [];const c=cfg(),own=ownedSet();
 return M.lo.cards.map(x=>{const card={kind:"lo",id:x.id,x,name:x.name,set:x.set,number:x.number,rarity:x.rarity,res:{pid:x.cm,status:"bindex",why:"Bindex empareja Cardmarket por nombre y precio dentro de la expansión"},p:{low:x.low,trend:x.trend,avg1:x.avg1,avg7:x.avg7,avg30:x.avg30,date:x.updated},owned:own.has(x.name,x.number)};
  card.ops=ops(card,c);card.liq=liquidity(card.p);card.mom=momentum(card.p);return card});
}
const nq=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
function list(){
 const c=cfg(),q=nq(view.q).trim();let all=[];
 const lg=selLang();
 if((view.game==="all"||view.game==="pokemon")&&lg!=="ja")all=all.concat(cardsPk());if(view.game!=="lorcana"&&(!lg||lg==="ja"))all=all.concat(cardsJp());if((view.game==="all"||view.game==="lorcana")&&lg!=="ja"&&lg!=="pt"&&lg!=="es")all=all.concat(cardsLo());
 for(const x of all){x.best=bestOp(x.ops,view.cond);x.conf=confidence(x,x.best);x.dl=x.kind!=="lo"&&x.res?.pid?delta(x.res.pid):null;x.hot=!!(x.dl&&x.dl.drop>=.15&&x.best&&x.best.profit>=c.minProfit);x.watch=watch[x.id];x.hit=x.watch&&x.best&&x.best.buy<=x.watch.target}
 if(q)all=all.filter(x=>nq(x.name+" "+x.set+" "+x.number).includes(q));
 else all=all.filter(x=>!x.owned&&(x.watch||x.best&&(view.show==="all"||x.best.profit>=c.minProfit)));
 const pr=x=>x.best?x.best.profit:-1e9,by={profit:(a,b)=>pr(b)-pr(a),buy:(a,b)=>(a.best?a.best.buy:1e9)-(b.best?b.best.buy:1e9),margin:(a,b)=>(b.best?b.best.margin:-9)-(a.best?a.best.margin:-9),
  sale:(a,b)=>(saleRef(b.p)||0)-(saleRef(a.p)||0),liq:(a,b)=>b.liq.k-a.liq.k||pr(b)-pr(a),mom:(a,b)=>(Number.isFinite(b.mom)?b.mom:-9)-(Number.isFinite(a.mom)?a.mom:-9),name:(a,b)=>a.name.localeCompare(b.name,"es"),risk:(a,b)=>(N(b.conf?.prudent)||-1e9)-(N(a.conf?.prudent)||-1e9),drop:(a,b)=>(b.hot-a.hot)||((b.dl?b.dl.drop:-9)-(a.dl?a.dl.drop:-9))};
 all.sort((a,b)=>(b.hit?1:0)-(a.hit?1:0)||by[view.sort||"profit"](a,b));
 /* Recomendadas: versión fiable y con ventas en los últimos 30 días. El resto, aparte y avisado. */
 const sure=all.filter(x=>q||TRUST[x.res.status]>=2&&x.liq.k>=1),pending=q?[]:all.filter(x=>!(TRUST[x.res.status]>=2&&x.liq.k>=1));
 return {sure,pending,total:all.length};
}

/* ---------- vista ---------- */
const STAT={"verificado":["v4ok","VERSIÓN VERIFICADA (2 FUENTES)"],"una-fuente":["v4ok","VERSIÓN ÚNICA"],"pt-only":["v4ok","DATOS VÍA POKEMONTCG.IO"],"bindex":["v4ok","LORCANA · BINDEX"],"jp":["v4ok","JAPONÉS · PRECIO Y VENTAS DEL MISMO IDIOMA"],"sin-confirmar":["v4warn","COMPRUEBA LA VERSIÓN"],"dudoso":["v4bad","VERSIÓN DUDOSA"]};
/* Enlace oficial de Cardmarket por id de producto (cardmarket.com/{juego}/Products?idProduct=N, admite filtros):
   abre EXACTAMENTE la versión verificada. Idiomas de Cardmarket: 1 inglés, 2 francés, 3 alemán, 4 español, 5 italiano,
   6 chino simpl., 7 japonés, 8 portugués, 9 ruso, 10 coreano, 11 chino trad. Estado mínimo: 3 = EX o mejor. */
const CM_LANG=[["en","Inglés",1],["es","Español",4],["fr","Francés",2],["de","Alemán",3],["it","Italiano",5],["pt","Portugués",8]];
function links(x){
 const game=x.kind==="lo"?"Lorcana":"Pokemon",pid=x.res?.pid;
 if(pid&&x.kind==="jp"){const base="https://www.cardmarket.com/es/Pokemon/Products?idProduct="+encodeURIComponent(pid);return {cm:selLang()==="ja"?base+"&language=7"+(view.cond==="mal"?"":"&minCondition=3"):base,exact:true,lang:[{k:"ja",n:"Japonés",url:base+"&language=7"+(view.cond==="mal"?"":"&minCondition=3")}]}}
 if(pid){const base="https://www.cardmarket.com/es/"+game+"/Products?idProduct="+encodeURIComponent(pid),cond=view.cond==="mal"?"":"&minCondition=3",lg=selLang();
  return {cm:lg&&CMID[lg]&&!(x.kind==="lo"&&(lg==="pt"||lg==="es"))?base+"&language="+CMID[lg]+cond:base,exact:true,lang:CM_LANG.filter(l=>x.kind!=="lo"||l[0]!=="pt"&&l[0]!=="es").map(([k,n,id])=>({k,n,url:base+"&language="+id+cond}))}}
 if(x.kind==="lo")return {cm:"https://www.cardmarket.com/es/Lorcana/Products/Search?searchString="+encodeURIComponent(x.name.split(" - ")[0]),lang:[]};
 const q=encodeURIComponent(x.name+" "+String(x.r[3]).replace(/^0+(?=\d)/,""));
 return {cm:hasPtcg(x.id)?"https://prices.pokemontcg.io/cardmarket/"+ptcgId(x.id):"https://www.cardmarket.com/es/Pokemon/Products/Search?searchString="+q,lang:[]};
}
/* Idioma elegido: la carta se muestra con su imagen en ese idioma (TCGdex publica imágenes por idioma; si no existe, se
   usa la inglesa) y los enlaces abren Cardmarket filtrado por ese idioma. Los precios de la guía no se separan por idioma:
   se indica, y se usan los datos de ese idioma si los has pegado. */
const CMID={en:1,fr:2,de:3,es:4,it:5,ja:7,pt:8},LNAME2={en:"Inglés",es:"Español",fr:"Francés",de:"Alemán",it:"Italiano",pt:"Portugués",ja:"Japonés"};
const selLang=()=>view.lang&&view.lang!=="all"?view.lang:"";
function img(x){
 const lg=selLang();
 if(x.kind==="pk"&&lg&&lg!=="en"&&lg!=="ja"){const id=x.id,url="https://assets.tcgdex.net/"+lg+"/"+x.r[6]+"/"+id.slice(0,id.lastIndexOf("-"))+"/"+x.r[3]+"/high.webp",R=window.CVRadar,[a]=R?.pkImages?R.pkImages(x.r,null):[""];
  return '<img src="'+E(url)+'"'+(a?' data-alt="'+E(a)+'"':'')+' alt="'+E(x.name)+' ('+E(LNAME2[lg])+')" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>'}
 if(x.kind==="jp")return x.image?'<img src="'+E(x.image)+'" alt="'+E(x.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>':'';
 if(x.kind==="lo")return x.x.image?'<img src="'+E(x.x.image)+'" alt="'+E(x.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>':'';
 const R=window.CVRadar;const [a,b]=R?.pkImages?R.pkImages(x.r,null):["",""];
 return a?'<img src="'+E(a)+'"'+(b?' data-alt="'+E(b)+'"':'')+' alt="'+E(x.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>':'';
}
function opRows(x,c){
 if(!x.ops.length)return '<p class="v4note">Sin precio de compra en 20–200 € o sin ventas de referencia.</p>';
 const shown=x.ops.filter(o=>o.cond===view.cond);if(!shown.length)return '<p class="v4note">Sin operación '+(view.cond==="mal"?"de restauración":"en buen estado")+' para esta carta.</p>';
 return '<div class="cpOps">'+shown.slice().sort((a,b)=>(N(b.profit)||-1e9)-(N(a.profit)||-1e9)).map(o=>'<div class="cpOp'+(o===x.best?' best':'')+'"><p>'+E(o.label)+(inBudget(o.buy)?'':' <small>(compra fuera de 20–200 €)</small>')+'</p>'+
  '<dl><div><dt>Compra en 41020</dt><dd>'+EUR(o.cost)+'</dd></div><div><dt>Venta</dt><dd>'+EUR(o.sale)+'</dd></div><div><dt>Beneficio</dt><dd class="'+(o.profit>=c.minProfit?'pos':'neg')+'">'+SIGNED(o.profit)+'</dd></div><div><dt>Compra máx.</dt><dd>'+EUR(o.maxBuy)+'</dd></div></dl></div>').join("")+'</div>';
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
 if(x.kind==="jp")rows.push(row("Japonés",gen?.buy,gen?.sale,gen?.profit,"✔ venta comprobada · japonés","ok",'<small>producto japonés propio en Cardmarket</small>'));
 else rows.push(row("Todos (guía)",gen?gen.buy:x.p.low,gen?gen.sale:S,gen?.profit,"mezcla idiomas","mix",'<small>guía oficial: no separa idiomas</small>'));
 const lgS=selLang();
 for(const o of l.lang){if(x.kind==="jp")break;if(lgS&&o.k!==lgS&&!(saved[o.k]&&N(saved[o.k].buy)))continue;if(!lgS&&!(saved[o.k]&&N(saved[o.k].buy)))continue;const v=saved[o.k],op=x.ops.find(q=>q.k==="own-"+o.k&&q.cond===view.cond);
  if(v&&N(v.buy)){const st=v.src==="pegado"?chk[o.k]:null;
   rows.push(row(o.n,op?op.buy:v.buy,op?.sale,op?.profit,st==="separada"?"✔ venta comprobada · "+o.n.toLowerCase():st==="general"?"⚠ Cardmarket no separó el idioma":N(v.sell)?"anotada por ti":"venta: todos los idiomas",st==="separada"?"ok":st==="general"?"warn":"mix",'<small>'+(v.src==="pegado"?(N(v.offerMin)?"compra: anuncio más barato copiado":"compra: «desde» de la ficha")+" · pegado "+E(WHEN(v.at)):"a mano "+E(WHEN(v.at)))+'</small> <a href="'+E(o.url)+'" target="_blank" rel="noopener noreferrer">ver ↗</a>'))}
  else rows.push('<tr class="cpLTempty"><th scope="row">'+o.n+'</th><td colspan="3"><a href="'+E(o.url)+'" target="_blank" rel="noopener noreferrer">Ver en '+o.n.toLowerCase()+' en Cardmarket ↗</a></td><td><button type="button" class="v4btn" data-cp-pasteopen="'+E(x.id)+'|'+o.k+'">Pegar datos</button></td></tr>')}
 return '<div class="cpLTbox"><table class="cpLTtab"><caption>Mismo idioma: compra, venta y beneficio'+(view.cond==="mal"?' (restaurar)':'')+'<small>Compra = precio del anuncio; el beneficio ya descuenta envíos a/desde 41020 y la comisión.</small></caption><thead><tr><th scope="col">Idioma</th><th scope="col">Compra</th><th scope="col">Venta</th><th scope="col">Beneficio</th><th scope="col">Fiabilidad</th></tr></thead><tbody>'+rows.join("")+'</tbody></table></div>';
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
function cardHtml(x,rank,c,pre="cp-"){
 const p=x.p,ob=x.best||x.ops.filter(o=>Number.isFinite(o.profit)).sort((a,b)=>b.profit-a.profit)[0]||null,b=ob,out=ob&&!inBudget(ob.buy),[sc,st]=STAT[x.res.status]||["",""],l=links(x),S=saleRef(p),w=x.watch;
 const alts=x.kind==="pk"&&x.res.status!=="verificado"?(window.CV_CM_MAP?.[x.id]||[]).slice(2).map(G).filter(Boolean):[];
 return '<article class="v4card cpCard" id="'+pre+E(x.id)+'" data-cpid="'+E(x.id)+'" data-game="'+(x.kind==="lo"?"lorcana":"pokemon")+'">'+
 '<figure class="v4photo">'+img(x)+'<div class="v4noimg"'+(img(x)?' hidden':'')+'><b>'+E(x.name)+'</b><span>'+E(x.set)+' nº '+E(x.number)+'</span></div><figcaption>Imagen de catálogo · el ejemplar se ve en el anuncio</figcaption></figure>'+
 '<div class="v4body"><div class="v4badges">'+(rank?'<span class="v4tag rank">#'+rank+'</span>':'')+(x.hit?'<span class="v4status s-comprobada">¡BAJO TU PRECIO!</span>':'')+(x.hot?'<span class="v4status s-comprobada">🔥 BAJÓ '+Math.round(x.dl.drop*100)+' % DESDE AYER</span>':'')+'<span class="v4tag '+sc+'">'+st+'</span><span class="v4tag">'+(x.kind==="lo"?"Lorcana":"Pokémon")+'</span><span class="v4tag">'+E(x.liq.t)+'</span>'+(Number.isFinite(x.mom)&&Math.abs(x.mom)>=.1?'<span class="v4tag">'+(x.mom>0?"▲ ":"▼ ")+PCT(x.mom)+' semana</span>':'')+'</div>'+
 '<h3>'+E(x.name)+'</h3><p class="v4id">'+E(x.set)+' · nº '+E(x.number)+' · '+E(x.rarity||"—")+'</p>'+
 (x.dl&&Math.abs(x.dl.drop)>=.1?'<p class="v4note cpDelta">«Desde» en Cardmarket: '+EUR(x.dl.lo0)+' ayer → <b>'+EUR(x.dl.lo)+'</b> hoy ('+PCT(-x.dl.drop)+'). '+(x.dl.drop>0?'Un anuncio barato acaba de aparecer: puede venderse en horas.':'')+'</p>':'')+
 '<div class="cpMoney"><div><span>Compra en Cardmarket</span><b>'+EUR(b?b.buy:p.exPlus||p.low)+'</b><small>'+(b?(b.k==="ex"?"EX o mejor":b.k==="po"?"cualquier estado (casi siempre mal estado)":b.own?b.lang+(b.sameLang?" · mismo idioma":" (anotado)"):x.kind==="jp"?"japonés · "+(b.k==="ex"?"EX o mejor":"estado sin indicar"):"estado sin indicar")+" · con envío a 41020 "+EUR(b.cost)+(out?" · fuera de tu presupuesto 20–200 €":""):"—")+'</small></div>'+
  '<div><span>Venta en Cardmarket</span><b>'+EUR(b?b.sale:S)+'</b><small>'+(b&&b.k==="po"?"mejorada · ":"")+(x.kind==="jp"?"ventas reales de cartas japonesas":b&&b.own&&b.sameLang?"ventas en "+E(b.lang.toLowerCase())+" (comprobadas)":"ventas reales de todos los idiomas")+'</small></div>'+
  '<div class="'+(b&&!out&&b.profit>=c.minProfit?'pos':'neg')+'"><span>'+(out?'Beneficio (fuera de presupuesto)':'Beneficio')+'</span><b>'+(b?SIGNED(b.profit):"—")+'</b><small>'+(b?"margen "+PCT(b.margin)+" · tras "+String(c.feePct).replace(".",",")+" % y envíos":"")+'</small></div></div>'+
 confHtml(x,b)+
 langLine(x)+
 (x.res.status!=="verificado"&&x.res.status!=="una-fuente"&&x.res.status!=="bindex"&&x.res.status!=="pt-only"||alts.length?'<p class="v4missing"><b>Versión:</b> '+E(x.res.why)+(alts.length?' · otras versiones con el mismo nombre: '+alts.map(a=>EUR(a.trend)).join(", ")+'. En Cardmarket comprueba que el número es <b>'+E(x.number)+'</b>.':'')+'</p>':'')+
 sameLangTable(x,c)+opRows(x,c)+
 '<details class="v4more"><summary>Datos de Cardmarket e historial</summary><p class="v4note">Guía oficial de Cardmarket '+E(DATE(p.date))+': «desde» '+EUR(p.low)+(Number.isFinite(p.exPlus)?' · «desde» EX o mejor '+EUR(p.exPlus):'')+' · tendencia '+EUR(p.trend)+' · media 1 día '+EUR(p.avg1)+' · 7 días '+EUR(p.avg7)+' · 30 días '+EUR(p.avg30)+'. '+(x.kind==="jp"?'Producto japonés: todos los estados, solo cartas japonesas.':'Todos los idiomas y estados.')+' '+E(x.res.why)+'.</p>'+
 (x.res.pid&&x.kind!=="lo"?'<div class="cpHist" data-cp-hist="'+E(x.res.pid)+'"><button type="button" class="v4btn" data-cp-histload="'+E(x.res.pid)+'">Ver historial de precio</button></div>':'')+'</details>'+
 '<div class="cpCT" data-cp-ct="'+E(x.id)+'">'+(ctRes[x.id]?ctHtml(ctRes[x.id]):'<button type="button" class="v4btn" data-cp-ctload="'+E(x.id)+'">Precios por idioma ahora (CardTrader)</button>')+'</div>'+
 pasteBox(x)+langBox(x)+
 '<div class="cpWatch">'+(w?'Vigilando: avisa si baja de <b>'+EUR(w.target)+'</b> <button type="button" class="v4btn" data-cp-unwatch="'+E(x.id)+'">Dejar de vigilar</button>':'<label>Avisar si la compra baja de <input inputmode="decimal" data-cp-target="'+E(x.id)+'" value="'+(b&&Number.isFinite(b.maxBuy)&&b.maxBuy>0?String(Math.floor(b.maxBuy)):"")+'" aria-label="Precio objetivo"> €</label><button type="button" class="v4btn" data-cp-watch="'+E(x.id)+'">Vigilar</button>')+'</div>'+
 '<details class="v4more cpCheck"><summary>Antes de pagar (30 segundos)</summary><ol class="v4help"><li>El anuncio es de esta carta: mismo número <b>'+E(x.number)+'</b>, edición e idioma'+(x.kind==="jp"?' (japonés)':'')+'.</li><li>Estado y fotos: si cuesta más de 50 €, pide fotos reales del anverso y reverso (bordes, esquinas, rayas).</li><li>Vendedor: muchas ventas, buena valoración y país de envío (el envío a 41020 cambia el coste).</li><li>Precio total con envío ≤ <b>'+EUR(b&&Number.isFinite(b.maxBuy)?b.maxBuy+c.buyShip:NaN)+'</b> (tu compra máxima para ganar '+EUR(c.minProfit)+').</li><li>Paga siempre dentro de Cardmarket, con envío certificado si supera 25 €. Nunca fuera de la plataforma.</li></ol></details>'+
 '<div class="v4actions"><a class="v4btn primary" href="'+E(l.cm)+'" target="_blank" rel="noopener noreferrer">Abrir en Cardmarket ↗</a>'+(x.kind!=="lo"?'<button type="button" class="v4btn" data-cp-promote="'+E(x.id)+'">Registrar este anuncio</button>':'')+'</div></div></article>';
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
 if(view.game!=="lorcana"&&lg!=="ja")all=all.concat(cardsPk());if(view.game!=="lorcana"&&(!lg||lg==="ja"))all=all.concat(cardsJp());if((view.game==="all"||view.game==="lorcana")&&!lg)all=all.concat(cardsLo());
 const out=[];
 for(const x of all){const p=x.p,S=saleRef(p);if(!Number.isFinite(S)||S<40||!Number.isFinite(p.low)||p.low>S*.6||p.low<1)continue;
  if((x.liq?.k||0)<2||(TRUST[x.res?.status]??0)<2)continue;
  const xs=[p.avg1,p.avg7,p.avg30,p.trend].filter(Number.isFinite),disp=xs.length>=2?(Math.max(...xs)-Math.min(...xs))/S:1;if(disp>.25)continue;
  const cost=p.low+c.buyShip,profit=netSale(S,c)-cost;if(profit<c.minProfit)continue;
  x.dl=x.res?.pid?delta(x.res.pid):null;out.push({x,S,low:p.low,cost,profit,ratio:p.low/S,isNew:!!(x.dl&&x.dl.drop>=.15)})}
 return out.sort((a,b)=>(b.isNew-a.isNew)||b.profit-a.profit);
}
function sniperHtml(){
 const L=sniper();if(!M.guide)return '';
 return '<details class="cpSnipe" data-cp-snipe'+(L.length?' open':'')+'><summary><b>🎯 Punto de mira</b> · '+(L.length?L.length+' anuncio(s) muy por debajo de su valor':'nada muy por debajo de su valor hoy')+'</summary>'+
 (L.length?'<ol class="cpPlanList">'+L.slice(0,12).map(o=>{const x=o.x,l=links(x);return '<li><span><b>'+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+(o.isNew?' · <b>🔥 NUEVO HOY</b>':'')+'</span><a class="v4btn primary" href="'+E(l.cm)+'" target="_blank" rel="noopener noreferrer">Ver ya ↗</a><small>Vale ~'+EUR(o.S)+' (se vende cada semana) y hay un anuncio a <b>'+EUR(o.low)+'</b> ('+Math.round(o.ratio*100)+' % de su valor) · si está bien: '+SIGNED(o.profit)+' con envíos y comisión. Comprueba en 1 minuto: estado y fotos, idioma, número y vendedor.</small></li>'}).join("")+'</ol><p class="v4note">Precio «desde» de la guía de Cardmarket (de madrugada): a ese precio suelen venderse en horas. Si el anuncio ya no está, la carta seguirá en la lista hasta la próxima guía.</p>':'<p class="v4note">Busca a diario cartas que se venden con regularidad y tienen un anuncio por debajo del 60 % de su valor.</p>')+'</details>';
}
/* Plan de compra con presupuesto: elige, de las ofertas fiables, la combinación que más beneficio prudente da por cada
   euro invertido, sin pasarse del presupuesto, sin repetir carta y como máximo 2 por colección (para no concentrar riesgo). */
const PKEY="cv_v120_plan";let plan={budget:300,max:200,minConf:50,...readLS(PKEY,{})};
function buildPlan(L,c){
 const cand=L.sure.filter(x=>x.best&&Number.isFinite(x.best.profit)&&x.best.profit>=c.minProfit&&x.best.cost<=plan.max&&x.conf&&x.conf.score>=plan.minConf)
  .sort((a,b)=>b.conf.prudent/b.best.cost-a.conf.prudent/a.best.cost);
 const pick=[],perSet={};let spent=0;
 for(const x of cand){if(spent+x.best.cost>plan.budget)continue;const k=x.set;if((perSet[k]||0)>=2)continue;perSet[k]=(perSet[k]||0)+1;pick.push(x);spent+=x.best.cost}
 const profit=pick.reduce((a,x)=>a+x.best.profit,0),prudent=pick.reduce((a,x)=>a+x.conf.prudent,0);
 return {pick,spent,profit,prudent,roi:spent?prudent/spent:NaN,cand:cand.length};
}
function planHtml(L,c){
 const P=buildPlan(L,c);
 return '<details class="cpPlan" data-cp-planbox'+(plan.open?' open':'')+'><summary><b>🧮 Plan de compra con mi presupuesto</b>'+(P.pick.length?' · '+P.pick.length+' cartas, '+EUR(P.spent)+' → prudente '+SIGNED(P.prudent):'')+'</summary>'+
 '<div class="cpPlanIn"><label>Presupuesto total (€)<input inputmode="decimal" data-cp-plan="budget" value="'+E(String(plan.budget).replace(".",","))+'"></label><label>Máximo por carta con envío (€)<input inputmode="decimal" data-cp-plan="max" value="'+E(String(plan.max).replace(".",","))+'"></label><label>Confianza mínima (0–100)<input inputmode="numeric" data-cp-plan="minConf" value="'+E(String(plan.minConf))+'"></label><label>&nbsp;<button type="button" class="v4btn primary" data-cp-plancalc>Calcular plan</button></label></div>'+
 (P.pick.length?'<div class="cpTot"><div><b>'+EUR(P.spent)+'</b><span>inversión con envíos a 41020</span></div><div><b>'+SIGNED(P.profit)+'</b><span>beneficio si se vende al precio de referencia</span></div><div><b>'+SIGNED(P.prudent)+'</b><span>beneficio prudente (× confianza)</span></div><div><b>'+PCT(P.roi)+'</b><span>rentabilidad prudente</span></div></div>'+
  '<ol class="cpPlanList">'+P.pick.map(x=>'<li><span><b>'+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+'</span><a class="v4btn" href="'+E(links(x).cm)+'" target="_blank" rel="noopener noreferrer">Abrir ↗</a><small>Compra '+EUR(x.best.cost)+' (máx. '+EUR(x.best.maxBuy+c.buyShip)+') → venta '+EUR(x.best.sale)+' · '+SIGNED(x.best.profit)+' · confianza '+x.conf.score+'/100</small></li>').join("")+'</ol>'+
  '<p class="v4note">Elegidas entre '+P.cand+' ofertas fiables por beneficio prudente por euro, sin repetir carta y máximo 2 por colección. No es un beneficio asegurado: comprueba cada anuncio con «Antes de pagar». Si compras varias al mismo vendedor, el envío baja.</p>':
  '<p class="v4empty">Ninguna combinación cumple estos límites hoy. Sube el presupuesto, el máximo por carta o baja la confianza mínima.</p>')+'</details>';
}
/* Lorcana sin oportunidades: en vez de una lista vacía, cuántas cartas tienen precio y las de mejor margen de hoy. */
function loBest(c){
 if(view.game!=="lorcana"||view.q)return '';const all=cardsLo();
 if(!all.length)return '<p class="v4note neg">Lorcana: aún no hay precios cargados'+(loState?' ('+E(loState)+')':'')+'. Pulsa «Actualizar precios».</p>';
 const best=all.map(x=>({x,o:x.ops.filter(o=>o.cond===view.cond&&Number.isFinite(o.profit)).sort((a,b)=>b.profit-a.profit)[0]})).filter(y=>y.o).sort((a,b)=>b.o.profit-a.o.profit).slice(0,10);
 return '<div class="cpPlan"><p><b>Lorcana: '+all.length.toLocaleString("es-ES")+(all.length===1?' carta':' cartas')+' con precio de Cardmarket hoy.</b> Ninguna deja '+EUR(c.minProfit)+' con compra entre 20 y 200 €: en Lorcana casi todas valen menos de 100 € y el anuncio más barato está muy cerca de su precio de venta. Estas son las de mejor margen ahora (baja el «Beneficio mínimo» en Supuestos si quieres verlas como oportunidad):</p><ol class="cpPlanList">'+
  best.map(({x,o})=>'<li><span><b>'+E(x.name)+'</b> · '+E(x.set)+' nº '+E(x.number)+'</span><a class="v4btn" href="'+E(links(x).cm)+'" target="_blank" rel="noopener noreferrer">Abrir ↗</a><small>Compra '+EUR(o.cost)+' → venta '+EUR(o.sale)+' · '+SIGNED(o.profit)+'</small></li>').join("")+'</ol></div>';
}
function summaryHtml(L,c){
 const g=M.guide,lo=M.lo,pt=Object.keys(M.pt.cards).length,ver=window.CV_UNIVERSE?window.CV_UNIVERSE.cards.filter(r=>resolve(r[0])?.status==="verificado").length:0;
 const hits=Object.entries(watch).length,hitN=L.sure.concat(L.pending).filter(x=>x.hit).length;
 return '<div class="cpSum"><div><b>'+(g?g.count.toLocaleString("es-ES"):"—")+'</b><span>productos con precio oficial de Cardmarket'+(g?' ('+E(DATE(g.sourceCreatedAt))+')':'')+'</span></div><div><b>'+ver.toLocaleString("es-ES")+'</b><span>versiones verificadas con 2 fuentes</span></div><div><b>'+(lo?lo.cards.length:0)+'</b><span>cartas Lorcana con precio de Cardmarket</span></div><div><b>'+L.sure.length+'</b><span>oportunidades con beneficio ≥ '+EUR(c.minProfit)+'</span></div><div><b>'+L.sure.concat(L.pending).filter(x=>x.hot).length+'</b><span>🔥 bajadas desde ayer con beneficio</span></div></div>'+
 (g?'<p class="v4note">Precios de Cardmarket del '+E(WHEN(g.sourceCreatedAt))+' (se publican una vez al día, de madrugada)'+(M.prev?.date?' · comparados con el '+E(DATE(M.prev.date)):'')+'. El anuncio más barato puede haberse vendido: si una oferta te encaja, ábrela ya.</p>':'')+
 (hits?'<p class="cpAlert'+(hitN?' on':'')+'">'+(hitN?'🔔 '+hitN+' carta(s) vigilada(s) por debajo de tu precio':'Vigilando '+hits+' carta(s): te avisaré aquí cuando bajen de tu precio')+'</p>':'');
}
function sourcesHtml(){
 const s=M.src,b=budget(),line=(n,o)=>'<li><b>'+n+'</b> · '+(o.ok||0)+' correctas, '+(o.fail||0)+' fallidas'+(o.last?' · última '+WHEN(o.last):'')+(o.lastErr?' · <span class="neg">'+E(o.lastErr)+'</span>':'')+'</li>';
 return '<details class="v4settings"><summary>Estado de las fuentes</summary><ul class="v4help">'+line("Guía oficial de Cardmarket (espejo diario en GitHub)",s.guide)+line("pokemontcg.io · verificación y «desde» EX+ · "+b.n+"/"+PT_DAILY+" hoy"+(ptRunning?" · comprobando "+ptRunning.done+"/"+ptRunning.total+" colecciones":""),s.ptcg)+line("Bindex · Lorcana en Cardmarket",s.bindex)+ctPanel()+'</ul>'+
  '<p class="v4note">La guía de Cardmarket mezcla idiomas y estados en las ediciones internacionales; las japonesas son productos propios (idioma seguro). Para otro idioma usa «Pegar datos» en la tabla «Mismo idioma» de cada carta. Envío a 41020 y comisión editables en «Supuestos del cálculo». Fuentes: <a href="https://github.com/ZyzyThePizi/pokemon-price-data" target="_blank" rel="noopener">espejo de la guía</a>, <a href="https://pokemontcg.io" target="_blank" rel="noopener">pokemontcg.io</a>, <a href="https://github.com/Douxeh/bindex-prices" target="_blank" rel="noopener">Bindex</a>.</p></details>';
}
let rT=null;function render(){clearTimeout(rT);rT=setTimeout(renderNow,30)}
function renderNow(){
 if(typeof document.querySelector!=="function")return;const slot=document.querySelector('[data-rd-live="compra"]');if(!slot)return;
 langData=readLS(LKEY,{});watch=readLS(WKEY,{});const c=cfg(),L=list();
 const sel=(k,opts,label)=>'<label>'+label+'<select data-cp-view="'+k+'">'+opts.map(([v,t])=>'<option value="'+v+'"'+(view[k]===v?' selected':'')+'>'+t+'</option>').join("")+'</select></label>';
 const loading=!M.guide&&!M.lo;
 slot.innerHTML='<section class="rdlivebox cpBox"><h3>Ofertas en Cardmarket · compra y venta desde 41020 Sevilla</h3>'+summaryHtml(L,c)+
  (busy?'<p class="v4note">⏳ '+E(busy)+'</p>':'')+((view.game==="all"||view.game==="lorcana")&&loState?'<p class="v4note'+(loState.startsWith("Cargando")?'':' neg')+'">'+E(loState)+'</p>':'')+
  '<div class="rdctl"><label class="cpQ">Buscar carta<input type="search" data-cp-q value="'+E(view.q)+'" placeholder="Nombre, colección o número"></label>'+sel("game",[["all","Todas"],["pokemon","Pokémon"],["jp","Pokémon japonés (idioma seguro)"],["lorcana","Lorcana"]],"Juego")+sel("lang",[["all","Todos los idiomas"]].concat(LANGS.map(([k,n])=>[k,n])),"Idioma de la carta")+sel("cond",[["buen","Buen estado"],["mal","Mal estado · restaurar"]],"Estado")+
  sel("show",[["profit","Solo con beneficio ≥ "+EUR(c.minProfit)],["all","Todas con precio"]],"Mostrar")+sel("sort",[["profit","Mayor beneficio"],["risk","Mejor beneficio prudente (con riesgo)"],["buy","Menor precio de compra"],["margin","Mayor margen %"],["sale","Mayor precio de venta"],["liq","Se venden más rápido"],["mom","Subiendo esta semana"],["drop","🔥 Bajadas desde ayer"],["name","Nombre A–Z"]],"Ordenar")+'</div>'+
  '<div class="v4actions"><button type="button" class="v4btn" data-cp-refresh>Actualizar precios</button></div>'+sourcesHtml()+sniperHtml()+(M.guide?planHtml(L,c):'')+
  (L.sure.length?'<div class="v4list">'+L.sure.slice(0,25).map((x,i)=>cardHtml(x,i+1,c)).join("")+'</div>'+(L.sure.length>25?'<details class="v4old"><summary>Ver más ('+(L.sure.length-25)+')</summary><div class="v4list">'+L.sure.slice(25,150).map((x,i)=>cardHtml(x,i+26,c)).join("")+'</div></details>':''):
   '<p class="v4empty">'+(loading?'Cargando la guía oficial de Cardmarket…':view.q?'Ninguna carta coincide con «'+E(view.q)+'».':'Ninguna oportunidad cumple estos filtros. Prueba «Todas con precio», otro estado u ordenar distinto.')+'</p>'+loBest(c))+
  (L.pending.length?'<details class="v4old"><summary>Por confirmar versión o sin ventas recientes ('+L.pending.length+')</summary><p class="v4note">Cardmarket tiene varias versiones con el mismo nombre y aún no hay una segunda fuente que confirme cuál es, o no hay ventas en los últimos 30 días. Comprueba el número en la ficha antes de comprar.</p><div class="v4list">'+L.pending.slice(0,40).map(x=>cardHtml(x,0,c)).join("")+'</div></details>':'')+'</section>';
 slot.querySelectorAll("img[data-v4img]").forEach(im=>{if(im.dataset.wired)return;im.dataset.wired="1";im.addEventListener("error",()=>{const a=im.dataset.alt;if(a&&!im.dataset.usedAlt){im.dataset.usedAlt="1";im.src=a;return}im.hidden=true;const n=im.parentElement.querySelector(".v4noimg");if(n)n.hidden=false})});
}

/* ---------- CardTrader (opcional): anuncios reales por IDIOMA y estado ----------
   CardTrader es un mercado europeo (envía a España). Su API oficial devuelve cada anuncio con idioma, estado, precio y país
   del vendedor. Necesita el token personal de TU cuenta gratuita (CardTrader → Ajustes → API). Se guarda solo en este iPhone.
   Son precios PEDIDOS (anuncios), no ventas cerradas: la «salida» es la mediana de los 5 anuncios NM/EX más baratos del idioma. */
const CT="https://api.cardtrader.com/api/v2",CTKEY="cv_cardtrader_token",ctRes={},ctCache={games:null,exps:null,bp:{}};
const ctToken=()=>{try{return localStorage.getItem(CTKEY)||""}catch{return ""}};
async function ctGet(path){
 const t=ctToken();if(!t)throw new Error("Sin token de CardTrader");
 let r;try{r=await fetch(CT+path,{headers:{Authorization:"Bearer "+t,Accept:"application/json"}})}catch{throw new Error("CardTrader no responde o no permite consultas desde el navegador")}
 if(r.status===401)throw new Error("Token de CardTrader no válido");if(r.status===429)throw new Error("CardTrader: demasiadas consultas, espera un momento");
 if(!r.ok)throw new Error("CardTrader HTTP "+r.status);return r.json();
}
const nrm=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const numK=v=>String(v||"").split("/")[0].toUpperCase().replace(/^([A-Z]*)0+(?=\d)/,"$1");
async function ctBlueprint(x){
 if(!ctCache.games)ctCache.games=await ctGet("/games");
 const games=Array.isArray(ctCache.games)?ctCache.games:(ctCache.games?.array||[]);
 const g=games.find(o=>(x.kind==="lo"?/lorcana/i:/pok[eé]mon/i).test(String(o.name||o.display_name||"")));if(!g)throw new Error("CardTrader: juego no encontrado");
 if(!ctCache.exps)ctCache.exps=await ctGet("/expansions");
 const exps=(Array.isArray(ctCache.exps)?ctCache.exps:[]).filter(e=>e.game_id===g.id),sn=nrm(x.set);
 const exp=exps.find(e=>nrm(e.name)===sn)||exps.find(e=>nrm(e.name).includes(sn)||sn.includes(nrm(e.name)));if(!exp)throw new Error("CardTrader: colección «"+x.set+"» no encontrada");
 if(!ctCache.bp[exp.id]){const j=await ctGet("/blueprints/export?expansion_id="+encodeURIComponent(exp.id));ctCache.bp[exp.id]=Array.isArray(j)?j:(j?.array||[])}
 const num=numK(x.number),nn=nrm(x.name).split(" ")[0];
 const bp=ctCache.bp[exp.id].find(b=>numK(b.fixed_properties?.collector_number||b.collector_number)===num&&nrm(b.name).includes(nn));
 if(!bp)throw new Error("CardTrader: carta nº "+x.number+" no encontrada en «"+exp.name+"»");
 return {bp,exp};
}
function ctSummary(list){
 const by={};
 for(const p of list){const h=p.properties_hash||{},lk=Object.keys(h).find(k=>/language/i.test(k)),lang=String(lk?h[lk]:"?").toLowerCase(),cond=String(h.condition||"");
  const cents=Number(p.price_cents??p.price?.cents);if(!Number.isFinite(cents)||cents<=0||p.graded)continue;
  (by[lang]=by[lang]||[]).push({eur:cents/100,cond,good:/mint|near|excellent|^nm|^ex/i.test(cond),country:p.user?.country_code||"",qty:p.quantity||1})}
 return Object.entries(by).map(([lang,a])=>{a.sort((x,y)=>x.eur-y.eur);const g=a.filter(o=>o.good),top=g.slice(0,5).map(o=>o.eur),med=top.length?top[Math.floor(top.length/2)]:NaN;
  return {lang,n:a.length,cheapest:a[0],cheapestGood:g[0]||null,exit:med}}).sort((x,y)=>(y.n-x.n));
}
const LNAME={en:"Inglés",es:"Español",fr:"Francés",de:"Alemán",it:"Italiano",pt:"Portugués",jp:"Japonés",ja:"Japonés",kr:"Coreano",ko:"Coreano",zh:"Chino","zh-cn":"Chino","zh-tw":"Chino trad."};
function ctHtml(r){
 if(r.error)return '<p class="v4note neg">'+E(r.error)+'</p>'+(ctToken()?'':'<p class="v4note">Conéctalo en «Estado de las fuentes» (opcional).</p>')+'<button type="button" class="v4btn" data-cp-ctload="'+E(r.id||"")+'">Reintentar</button>';
 if(r.loading)return '<p class="v4note">Consultando CardTrader…</p>';
 const c=cfg();
 return '<div class="cpCTt"><p class="v4note"><b>CardTrader ahora</b> · '+E(r.exp)+' · anuncios por idioma (precio pedido, no venta). Envío a 41020 estimado '+EUR(c.buyShip)+'.</p>'+
  (r.rows.length?r.rows.map(o=>'<div class="cpCTr"><b>'+E(LNAME[o.lang]||o.lang.toUpperCase())+'</b><span>más barato '+EUR(o.cheapest.eur)+' <small>'+E(o.cheapest.cond)+(o.cheapest.country?' · '+E(o.cheapest.country):'')+'</small></span><span>NM/EX '+EUR(o.cheapestGood?.eur)+'</span><span>salida '+EUR(o.exit)+'</span>'+
   (o.cheapestGood&&Number.isFinite(o.exit)?'<span class="'+(netSale(o.exit,c)-o.cheapestGood.eur-c.buyShip>=c.minProfit?'pos':'')+'">mismo idioma '+SIGNED(netSale(o.exit,c)-o.cheapestGood.eur-c.buyShip)+'</span>':'')+'<small>'+o.n+' anuncios</small></div>').join(""):'<p class="v4note">Sin anuncios ahora.</p>')+
  '<a class="v4btn" href="https://www.cardtrader.com/cards/'+E(r.bp)+'" target="_blank" rel="noopener noreferrer">Abrir en CardTrader ↗</a></div>';
}
async function ctLoad(id){
 const x=cardsPk().concat(cardsLo()).find(c=>c.id===id);if(!x)return;ctRes[id]={loading:true};paintCT(id);
 try{const {bp,exp}=await ctBlueprint(x);const j=await ctGet("/marketplace/products?blueprint_id="+encodeURIComponent(bp.id));
  const list=Array.isArray(j)?j:(j?.[bp.id]||Object.values(j||{}).flat());ctRes[id]={rows:ctSummary(list),exp:exp.name,bp:bp.id};M.src.ct={...(M.src.ct||{}),ok:(M.src.ct?.ok||0)+1,last:Date.now(),lastErr:""}}
 catch(e){ctRes[id]={error:String(e.message||e),id};M.src.ct={...(M.src.ct||{}),fail:(M.src.ct?.fail||0)+1,lastErr:String(e.message||e).slice(0,80)}}
 paintCT(id);
}
function paintCT(id){document.querySelectorAll('[data-cp-ct="'+CSS.escape(id)+'"]').forEach(b=>b.innerHTML=ctHtml(ctRes[id]))}
function ctPanel(){const t=ctToken();
 return '<li><b>CardTrader (opcional) · anuncios por idioma</b> · '+(t?'conectado':'no conectado')+(M.src.ct?.lastErr?' · <span class="neg">'+E(M.src.ct.lastErr)+'</span>':'')+
  '<div class="cpCTk"><input type="password" autocomplete="off" data-cp-cttoken placeholder="'+(t?'Token guardado en este iPhone':'Pega tu token de CardTrader')+'" aria-label="Token de CardTrader"><button type="button" class="v4btn" data-cp-ctsave>'+(t?'Cambiar':'Conectar')+'</button>'+(t?'<button type="button" class="v4btn" data-cp-ctdel>Desconectar</button>':'')+'</div>'+
  '<small>CardTrader es otra web, no Cardmarket: la API de Cardmarket está cerrada a nuevas solicitudes y no hace falta. Si quieres anuncios por idioma de CardTrader: cuenta gratuita en CardTrader → Ajustes → API → copia el token. Solo lectura; se guarda únicamente en este dispositivo.</small></li>'}

/* ---------- Favoritos: vigiladas (datos en directo) y registradas (con su comprobación y «He comprado») ---------- */
let fv={type:"all",game:"all",...readLS("cv_v117_favview",{})};
function renderFavs(){
 const host=document.getElementById("cpFavs");if(!host||typeof document.querySelector!=="function")return;
 watch=readLS(WKEY,{});langData=readLS(LKEY,{});const c=cfg();
 const w=(window.CV_UNIVERSE?cardsPk():[]).concat(cardsJp(),cardsLo()).filter(x=>watch[x.id]&&(fv.game==="all"||(fv.game==="lorcana")===(x.kind==="lo")));
 for(const x of w){x.best=bestOp(x.ops,view.cond)||bestOp(x.ops,view.cond==="buen"?"mal":"buen");x.watch=watch[x.id];x.hit=!!(x.best&&x.best.buy<=x.watch.target)}
 w.sort((a,b)=>(b.hit-a.hit)||((b.best?.profit??-1e9)-(a.best?.profit??-1e9)));
 const missing=Object.keys(watch).filter(id=>!w.some(x=>x.id===id)&&(fv.game==="all"||(fv.game==="lorcana")===id.startsWith("lo-")));
 const showW=fv.type==="all"||fv.type==="watch"||fv.type==="hit",showR=fv.type==="all"||fv.type==="reg",list=fv.type==="hit"?w.filter(x=>x.hit):w;
 const sel=(k,opts,label)=>'<label>'+label+'<select data-cp-fav="'+k+'">'+opts.map(([v,t])=>'<option value="'+v+'"'+(fv[k]===v?' selected':'')+'>'+t+'</option>').join("")+'</select></label>';
 host.innerHTML='<section class="rdlivebox cpBox"><h3>Favoritos</h3><p class="v4note">Las cartas que vigilas (con aviso cuando bajan de tu precio) y las que registras desde Compra YA. Se guardan en este iPhone y viajan en la copia de seguridad de Datos.</p>'+
  '<div class="rdctl">'+sel("type",[["all","Todas"],["watch","Vigiladas"],["hit","Bajo mi precio"],["reg","Registradas"]],"Mostrar")+sel("game",[["all","Todas"],["pokemon","Pokémon"],["lorcana","Lorcana"]],"Juego")+'</div>'+
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
 try{const sh=Number(pid)%1000;const j=histCache[sh]||(histCache[sh]=await getJSON(ZZ+"history/"+sh+".json",null,30000));const rows=(j?.[String(pid)]||[]).filter(r=>N(r[2]));
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
  busy="";render();loadPrev().then(render).catch(()=>{});
  /* verificación de versiones: primero las colecciones de las cartas que salen en la lista y las vigiladas */
  const L=list(),first=[...new Set(L.sure.concat(L.pending).slice(0,80).filter(x=>x.kind==="pk"&&hasPtcg(x.id)).map(x=>ptSetOf(x.id)))];
  const rest=[...new Set(window.CV_UNIVERSE.cards.filter(r=>hasPtcg(r[0])&&window.CV_CM_MAP?.[r[0]]?.[1]).map(r=>ptSetOf(r[0])))].filter(s=>!first.includes(s));
  const lor=view.game==="all"||view.game==="lorcana"?loadLorcana(ctrl).then(render):Promise.resolve();
  await verifySets(first.concat(rest),ctrl);await lor;
 }finally{busy="";ctrl=null;render()}
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
 const t=e.target.closest("[data-cp-plancalc],[data-cp-refresh],[data-cp-lsave],[data-cp-pastesave],[data-cp-pasteopen],[data-cp-watch],[data-cp-unwatch],[data-cp-promote],[data-cp-histload],[data-cp-ctload],[data-cp-ctsave],[data-cp-ctdel]");if(!t)return;const d=t.dataset;
 if("cpPlancalc" in d){const box=t.closest("[data-cp-planbox]"),v=k=>NUM(box.querySelector('[data-cp-plan="'+k+'"]')?.value);const b=v("budget"),m=v("max"),q=Number(String(box.querySelector('[data-cp-plan="minConf"]')?.value||"").trim());
  if(!Number.isFinite(b)||!Number.isFinite(m)||!(q>=0&&q<=100)){alert("Revisa los importes: presupuesto y máximo en euros, confianza entre 0 y 100.");return}
  plan={budget:b,max:m,minConf:q,open:true};writeLS(PKEY,plan);renderNow();return}
 if(d.cpCtload){ctLoad(d.cpCtload);return}
 if(d.cpPastesave){savePaste(d.cpPastesave,t.closest(".cpPaste"));return}
 if(d.cpPasteopen){const k=d.cpPasteopen.split("|")[1],box=t.closest(".cpCard")?.querySelector(".cpPaste");if(!box)return;box.open=true;const sl=box.querySelector("[data-cp-pastelang]");if(sl)sl.value=k;box.querySelector("[data-cp-paste]")?.focus();box.scrollIntoView?.({block:"nearest"});return}
 if("cpCtsave" in d){const v=String(document.querySelector("[data-cp-cttoken]")?.value||"").trim();if(!v){alert("Pega el token de tu cuenta de CardTrader.");return}try{localStorage.setItem(CTKEY,v)}catch{alert("NO se ha guardado el token: el almacenamiento del navegador no lo permite.");return}M.src.ct={};for(const k in ctRes)delete ctRes[k];renderNow();return}
 if("cpCtdel" in d){try{localStorage.removeItem(CTKEY)}catch{}M.src.ct={};for(const k in ctRes)delete ctRes[k];renderNow();return}
 if("cpRefresh" in d){M.pt.sets={};if(M.lo)M.lo.at=0;loState="";refresh(true)}
 else if(d.cpLsave)saveLang(d.cpLsave,t.closest(".cpCard"));
 else if(d.cpWatch){const v=NUM(t.closest(".cpCard")?.querySelector("[data-cp-target]")?.value);if(!Number.isFinite(v)){alert("Indica el precio máximo al que quieres comprar.");return}setWatch(d.cpWatch,v)}
 else if(d.cpUnwatch)setWatch(d.cpUnwatch,null);
 else if(d.cpPromote)promote(d.cpPromote);
 else if(d.cpHistload)loadHist(d.cpHistload,t.closest(".cpHist"));
});
document.addEventListener("change",e=>{const f=e.target.closest("[data-cp-fav]");if(f){fv[f.dataset.cpFav]=f.value;writeLS("cv_v117_favview",fv);renderFavs();return}});
document.addEventListener("change",e=>{const t=e.target.closest("[data-cp-view]");if(!t)return;view[t.dataset.cpView]=t.value;writeLS(VKEY,view);if(t.dataset.cpView==="cond")window.CVVault?.setCondView?.(t.value);if(t.dataset.cpView==="game"&&(t.value==="all"||t.value==="lorcana")&&!M.lo)loadLorcana(new AbortController()).then(render);renderNow()});
let qT=null;document.addEventListener("input",e=>{const t=e.target.closest("[data-cp-q]");if(!t)return;clearTimeout(qT);qT=setTimeout(()=>{view.q=t.value;writeLS(VKEY,view);renderNow();if(view.q.trim())verifyVisible();const q=document.querySelector("[data-cp-q]");if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}},250)});
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="radar"]'))setTimeout(onShow,60);if(e.target.closest('.mainNav [data-tab="favoritos"]'))setTimeout(onFavs,60)});
if(location.hash==="#favoritos")setTimeout(onFavs,1300);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(onShow,1200));else setTimeout(onShow,1200);
window.CVCompra={loadOld,loadPrev,sniper,matchOwned,loadCatalog,loadGuide,ready_:()=>ready,confidence,cardsPk,links,netSale,cfg,G,saleRef_:saleRef,parseCmPaste,langCheck,cardsJp,renderFavs,render:renderNow,refresh,resolve,ops,bestOp,parseGuide,parsePtCard,liquidity,momentum,saleRef,list,state:()=>M,ready:()=>ready,setState:x=>{M={...M,...x}},reloadLocal:()=>{langData=readLS(LKEY,{});watch=readLS(WKEY,{});view={...view,...readLS(VKEY,{})}}};
})();
