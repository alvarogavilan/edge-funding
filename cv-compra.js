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
const loadCatalog=()=>Promise.all([loadScript("vault-universe.js?v=1.0",()=>!!window.CV_UNIVERSE),loadScript("vault-cm-map.js?v=1.0",()=>!!window.CV_CM_MAP)]);

/* ---------- guía oficial de Cardmarket (espejo diario) ---------- */
const GF=["low","trend","avg1","avg7","avg30","lowHolo","trendHolo","avg30Holo"];
function neededIds(){const s=new Set();for(const v of Object.values(window.CV_CM_MAP||{})){s.add(v[0]);for(let i=2;i<v.length;i++)s.add(v[i])}return s}
function parseGuide(j,need){
 const f=j?.fields,rows=j?.rows;if(!Array.isArray(f)||!Array.isArray(rows))throw new Error("Guía con formato inesperado");
 const ix=GF.map(k=>f.indexOf(k)),id=f.indexOf("idProduct");if(id<0||ix[1]<0)throw new Error("Guía sin idProduct/trend");
 const out={};for(const r of rows){const p=r[id];if(need&&!need.has(p))continue;out[p]=ix.map(i=>i<0?null:r[i])}
 return {rows:out,sourceCreatedAt:j.sourceCreatedAt||"",generatedAt:j.generatedAt||"",fetchedAt:Date.now(),count:Object.keys(out).length};
}
async function loadGuide(force){
 if(!force&&M.guide&&Date.now()-M.guide.fetchedAt<GUIDE_TTL)return;
 try{const j=await getJSON(ZZ+"prices/latest.json",null,60000);M.guide=parseGuide(j,neededIds());M.src.guide.ok++;M.src.guide.last=Date.now();M.src.guide.lastErr="";persist()}
 catch(e){M.src.guide.fail++;M.src.guide.lastErr=String(e.message||e).slice(0,80);persist();throw e}
}
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
async function loadLorcana(ctrl){
 if(M.lo&&Date.now()-M.lo.at<LO_TTL)return;
 try{const sets=(await getJSON(BX+"sets.json",ctrl.signal,30000))?.sets||[];const cards=[];
  for(const s of sets){if(ctrl.signal.aborted)break;
   try{const f=await getJSON(BX+"sets/"+encodeURIComponent(s.id)+".json",ctrl.signal,30000);
    for(const c of (f?.cards||[])){const vs=(c.variants||[]).filter(v=>v?.eur&&N(v.eur.trend));if(!vs.length)continue;
     const ench=/enchanted|iconic|epic/i.test(c.rarity||"");const v=(ench&&vs.find(x=>x.name==="foil"))||vs.find(x=>x.name==="normal")||vs[0];
     cards.push({id:"lo-"+c.id,name:c.name,number:String(c.number||""),set:s.name||f?.set?.name||"",rarity:c.rarity||"",variant:v.name,image:c.imageLarge||c.imageSmall||"",cm:c.cardmarketId||null,
      low:N(v.eur.low),trend:N(v.eur.trend),avg1:N(v.eur.avg1),avg7:N(v.eur.avg7),avg30:N(v.eur.avg30),updated:f?.updatedAt||""})}
   }catch(e){if(ctrl.signal.aborted)break;M.src.bindex.fail++;M.src.bindex.lastErr=String(e.message||e).slice(0,80)}
   await sleep(150)}
  if(cards.length){M.lo={at:Date.now(),cards};M.src.bindex.ok++;M.src.bindex.last=Date.now();M.src.bindex.lastErr=""}
  persist();
 }catch(e){M.src.bindex.fail++;M.src.bindex.lastErr=String(e.message||e).slice(0,80);persist()}
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
const TRUST={"verificado":3,"una-fuente":2,"pt-only":2,"bindex":2,"sin-confirmar":1,"dudoso":0};

/* ---------- valoración ---------- */
const LANGS=[["en","Inglés"],["es","Español"],["fr","Francés"],["de","Alemán"],["it","Italiano"],["pt","Portugués"],["ja","Japonés"]];
let langData=readLS(LKEY,{}),watch=readLS(WKEY,{}),view={game:"all",cond:"all",show:"profit",sort:"profit",q:"",...readLS(VKEY,{})};
const netSale=(v,c)=>v*(1-c.feePct/100)-c.sellShip;
const inBudget=v=>Number.isFinite(v)&&v>=20&&v<=200;
function liquidity(p){if(N(p.avg1)&&N(p.avg7))return {k:3,t:"Se vende a diario"};if(N(p.avg7))return {k:2,t:"Ventas esta semana"};if(N(p.avg30))return {k:1,t:"Pocas ventas (30 días)"};return {k:0,t:"Sin ventas recientes"}}
function momentum(p){return N(p.avg7)&&N(p.avg30)?p.avg7/p.avg30-1:NaN}
function saleRef(p){const xs=[p.trend,p.avg30,p.avg7].filter(Number.isFinite);return xs.length?Math.min(...xs):NaN}
function ops(card,c){
 const {p,res}=card,S=saleRef(p),out=[],saved=langData[card.id]||{};
 const add=o=>{o.cost=o.buy+c.buyShip;o.profit=Number.isFinite(o.sale)?netSale(o.sale,c)-o.cost:NaN;o.margin=o.profit/o.cost;o.maxBuy=Number.isFinite(o.sale)?netSale(o.sale,c)-c.minProfit-c.buyShip:NaN;out.push(o)};
 if(Number.isFinite(S)){
  if(Number.isFinite(p.exPlus))add({k:"ex",cond:"buen",label:"Cardmarket · EX o mejor (idioma sin indicar) → venta en Cardmarket",buy:p.exPlus,sale:S});
  else if(Number.isFinite(p.low)&&p.low>=S*.5)add({k:"low",cond:"buen",label:"Cardmarket · «desde» (estado e idioma sin indicar) → venta en Cardmarket",buy:p.low,sale:S});
  if(Number.isFinite(p.low)&&p.low<S*.5)add({k:"po",cond:"mal",label:"Restaurar · «desde» en mal estado → venta mejorada al "+Math.round(c.restLow*100)+" % (supuesto conservador)",buy:p.low,sale:S*c.restLow});
 }
 for(const [k,name] of LANGS){const v=saved[k];if(!v||!N(v.buy))continue;const cond=v.cond==="mal"?"mal":"buen";const sale=N(v.sell)||(Number.isFinite(S)?(cond==="mal"?S*c.restLow:S):NaN);
  add({k:"own-"+k,cond,own:true,lang:name,label:name+" · anotado por ti → venta "+(N(v.sell)?"anotada en "+name.toLowerCase():"en Cardmarket (todos los idiomas)"),buy:N(v.buy),sale,at:v.at})}
 return out;
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
function cardsLo(){
 if(!M.lo?.cards)return [];const c=cfg(),own=ownedSet();
 return M.lo.cards.map(x=>{const card={kind:"lo",id:x.id,x,name:x.name,set:x.set,number:x.number,rarity:x.rarity,res:{pid:x.cm,status:"bindex",why:"Bindex empareja Cardmarket por nombre y precio dentro de la expansión"},p:{low:x.low,trend:x.trend,avg1:x.avg1,avg7:x.avg7,avg30:x.avg30,date:x.updated},owned:own.has(x.name,x.number)};
  card.ops=ops(card,c);card.liq=liquidity(card.p);card.mom=momentum(card.p);return card});
}
const nq=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
function list(){
 const c=cfg(),q=nq(view.q).trim();let all=[];
 if(view.game!=="lorcana")all=all.concat(cardsPk());if(view.game!=="pokemon")all=all.concat(cardsLo());
 for(const x of all){x.best=bestOp(x.ops,view.cond);x.watch=watch[x.id];x.hit=x.watch&&x.best&&x.best.buy<=x.watch.target}
 if(q)all=all.filter(x=>nq(x.name+" "+x.set+" "+x.number).includes(q));
 else all=all.filter(x=>!x.owned&&(x.watch||x.best&&(view.show==="all"||x.best.profit>=c.minProfit)));
 const pr=x=>x.best?x.best.profit:-1e9,by={profit:(a,b)=>pr(b)-pr(a),buy:(a,b)=>(a.best?a.best.buy:1e9)-(b.best?b.best.buy:1e9),margin:(a,b)=>(b.best?b.best.margin:-9)-(a.best?a.best.margin:-9),
  sale:(a,b)=>(saleRef(b.p)||0)-(saleRef(a.p)||0),liq:(a,b)=>b.liq.k-a.liq.k||pr(b)-pr(a),mom:(a,b)=>(Number.isFinite(b.mom)?b.mom:-9)-(Number.isFinite(a.mom)?a.mom:-9),name:(a,b)=>a.name.localeCompare(b.name,"es")};
 all.sort((a,b)=>(b.hit?1:0)-(a.hit?1:0)||by[view.sort||"profit"](a,b));
 /* Recomendadas: versión fiable y con ventas en los últimos 30 días. El resto, aparte y avisado. */
 const sure=all.filter(x=>q||TRUST[x.res.status]>=2&&x.liq.k>=1),pending=q?[]:all.filter(x=>!(TRUST[x.res.status]>=2&&x.liq.k>=1));
 return {sure,pending,total:all.length};
}

/* ---------- vista ---------- */
const STAT={"verificado":["v4ok","VERSIÓN VERIFICADA (2 FUENTES)"],"una-fuente":["v4ok","VERSIÓN ÚNICA"],"pt-only":["v4ok","DATOS VÍA POKEMONTCG.IO"],"bindex":["v4ok","LORCANA · BINDEX"],"sin-confirmar":["v4warn","COMPRUEBA LA VERSIÓN"],"dudoso":["v4bad","VERSIÓN DUDOSA"]};
function links(x){
 if(x.kind==="lo")return {cm:"https://www.cardmarket.com/es/Lorcana/Products/Search?searchString="+encodeURIComponent(x.name.split(" - ")[0])};
 const q=encodeURIComponent(x.name+" "+String(x.r[3]).replace(/^0+(?=\d)/,""));
 return {cm:hasPtcg(x.id)?"https://prices.pokemontcg.io/cardmarket/"+ptcgId(x.id):"https://www.cardmarket.com/es/Pokemon/Products/Search?searchString="+q};
}
function img(x){
 if(x.kind==="lo")return x.x.image?'<img src="'+E(x.x.image)+'" alt="'+E(x.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>':'';
 const R=window.CVRadar;const [a,b]=R?.pkImages?R.pkImages(x.r,null):["",""];
 return a?'<img src="'+E(a)+'"'+(b?' data-alt="'+E(b)+'"':'')+' alt="'+E(x.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-v4img>':'';
}
function opRows(x,c){
 if(!x.ops.length)return '<p class="v4note">Sin precio de compra en 20–200 € o sin ventas de referencia.</p>';
 return '<div class="cpOps">'+x.ops.slice().sort((a,b)=>(N(b.profit)||-1e9)-(N(a.profit)||-1e9)).map(o=>'<div class="cpOp'+(o===x.best?' best':'')+'"><p>'+E(o.label)+(inBudget(o.buy)?'':' <small>(compra fuera de 20–200 €)</small>')+'</p>'+
  '<dl><div><dt>Compra en 41020</dt><dd>'+EUR(o.cost)+'</dd></div><div><dt>Venta</dt><dd>'+EUR(o.sale)+'</dd></div><div><dt>Beneficio</dt><dd class="'+(o.profit>=c.minProfit?'pos':'neg')+'">'+SIGNED(o.profit)+'</dd></div><div><dt>Compra máx.</dt><dd>'+EUR(o.maxBuy)+'</dd></div></dl></div>').join("")+'</div>';
}
function langBox(x){
 const s=langData[x.id]||{};
 return '<details class="v4more"><summary>Anotar precios por idioma (Cardmarket → Filtros → Idioma)</summary><p class="v4note">La guía de Cardmarket mezcla idiomas. Si filtras por idioma en la ficha, anota aquí el anuncio más barato y, si la conoces, la venta en ese idioma: el cálculo usa tus cifras.</p>'+
 '<div class="cpLang">'+LANGS.map(([k,n])=>{const v=s[k]||{};return '<label><span>'+n+'</span><input inputmode="decimal" placeholder="compra €" aria-label="Compra en '+n+'" data-cp-lbuy="'+E(x.id)+'|'+k+'" value="'+(N(v.buy)?String(v.buy).replace(".",","):"")+'"><input inputmode="decimal" placeholder="venta €" aria-label="Venta en '+n+'" data-cp-lsell="'+E(x.id)+'|'+k+'" value="'+(N(v.sell)?String(v.sell).replace(".",","):"")+'"><select aria-label="Estado en '+n+'" data-cp-lcond="'+E(x.id)+'|'+k+'"><option value="buen">Buen estado</option><option value="mal"'+(v.cond==="mal"?" selected":"")+'>Mal estado</option></select></label>'}).join("")+'</div>'+
 '<button type="button" class="v4btn primary" data-cp-lsave="'+E(x.id)+'">Guardar precios por idioma</button></details>';
}
function cardHtml(x,rank,c){
 const p=x.p,ob=x.best||x.ops.filter(o=>Number.isFinite(o.profit)).sort((a,b)=>b.profit-a.profit)[0]||null,b=ob,out=ob&&!inBudget(ob.buy),[sc,st]=STAT[x.res.status]||["",""],l=links(x),S=saleRef(p),w=x.watch;
 const alts=x.kind==="pk"&&x.res.status!=="verificado"?(window.CV_CM_MAP?.[x.id]||[]).slice(2).map(G).filter(Boolean):[];
 return '<article class="v4card cpCard" id="cp-'+E(x.id)+'" data-game="'+(x.kind==="lo"?"lorcana":"pokemon")+'">'+
 '<figure class="v4photo">'+img(x)+'<div class="v4noimg"'+(img(x)?' hidden':'')+'><b>'+E(x.name)+'</b><span>'+E(x.set)+' nº '+E(x.number)+'</span></div><figcaption>Imagen de catálogo · el ejemplar se ve en el anuncio</figcaption></figure>'+
 '<div class="v4body"><div class="v4badges">'+(rank?'<span class="v4tag rank">#'+rank+'</span>':'')+(x.hit?'<span class="v4status s-comprobada">¡BAJO TU PRECIO!</span>':'')+'<span class="v4tag '+sc+'">'+st+'</span><span class="v4tag">'+(x.kind==="lo"?"Lorcana":"Pokémon")+'</span><span class="v4tag">'+E(x.liq.t)+'</span>'+(Number.isFinite(x.mom)&&Math.abs(x.mom)>=.1?'<span class="v4tag">'+(x.mom>0?"▲ ":"▼ ")+PCT(x.mom)+' semana</span>':'')+'</div>'+
 '<h3>'+E(x.name)+'</h3><p class="v4id">'+E(x.set)+' · nº '+E(x.number)+' · '+E(x.rarity||"—")+'</p>'+
 '<div class="cpMoney"><div><span>Compra en Cardmarket</span><b>'+EUR(b?b.buy:p.exPlus||p.low)+'</b><small>'+(b?(b.k==="ex"?"EX o mejor":b.k==="po"?"cualquier estado (casi siempre mal estado)":b.own?b.lang+" (anotado)":"estado sin indicar")+" · con envío a 41020 "+EUR(b.cost)+(out?" · fuera de tu presupuesto 20–200 €":""):"—")+'</small></div>'+
  '<div><span>Venta en Cardmarket</span><b>'+EUR(b?b.sale:S)+'</b><small>'+(b&&b.k==="po"?"mejorada · ":"")+'ventas reales de todos los idiomas</small></div>'+
  '<div class="'+(b&&!out&&b.profit>=c.minProfit?'pos':'neg')+'"><span>'+(out?'Beneficio (fuera de presupuesto)':'Beneficio')+'</span><b>'+(b?SIGNED(b.profit):"—")+'</b><small>'+(b?"margen "+PCT(b.margin)+" · tras "+String(c.feePct).replace(".",",")+" % y envíos":"")+'</small></div></div>'+
 (x.res.status!=="verificado"&&x.res.status!=="una-fuente"&&x.res.status!=="bindex"&&x.res.status!=="pt-only"||alts.length?'<p class="v4missing"><b>Versión:</b> '+E(x.res.why)+(alts.length?' · otras versiones con el mismo nombre: '+alts.map(a=>EUR(a.trend)).join(", ")+'. En Cardmarket comprueba que el número es <b>'+E(x.number)+'</b>.':'')+'</p>':'')+
 opRows(x,c)+
 '<details class="v4more"><summary>Datos de Cardmarket e historial</summary><p class="v4note">Guía oficial de Cardmarket '+E(DATE(p.date))+': «desde» '+EUR(p.low)+(Number.isFinite(p.exPlus)?' · «desde» EX o mejor '+EUR(p.exPlus):'')+' · tendencia '+EUR(p.trend)+' · media 1 día '+EUR(p.avg1)+' · 7 días '+EUR(p.avg7)+' · 30 días '+EUR(p.avg30)+'. Todos los idiomas y estados. '+E(x.res.why)+'.</p>'+
 (x.res.pid&&x.kind==="pk"?'<div class="cpHist" data-cp-hist="'+E(x.res.pid)+'"><button type="button" class="v4btn" data-cp-histload="'+E(x.res.pid)+'">Ver historial de precio</button></div>':'')+'</details>'+
 langBox(x)+
 '<div class="cpWatch">'+(w?'Vigilando: avisa si baja de <b>'+EUR(w.target)+'</b> <button type="button" class="v4btn" data-cp-unwatch="'+E(x.id)+'">Dejar de vigilar</button>':'<label>Avisar si la compra baja de <input inputmode="decimal" data-cp-target="'+E(x.id)+'" value="'+(b&&Number.isFinite(b.maxBuy)&&b.maxBuy>0?String(Math.floor(b.maxBuy)):"")+'" aria-label="Precio objetivo"> €</label><button type="button" class="v4btn" data-cp-watch="'+E(x.id)+'">Vigilar</button>')+'</div>'+
 '<div class="v4actions"><a class="v4btn primary" href="'+E(l.cm)+'" target="_blank" rel="noopener noreferrer">Abrir en Cardmarket ↗</a>'+(x.kind==="pk"?'<button type="button" class="v4btn" data-cp-promote="'+E(x.id)+'">Registrar este anuncio</button>':'')+'</div></div></article>';
}
function summaryHtml(L,c){
 const g=M.guide,lo=M.lo,pt=Object.keys(M.pt.cards).length,ver=window.CV_UNIVERSE?window.CV_UNIVERSE.cards.filter(r=>resolve(r[0])?.status==="verificado").length:0;
 const hits=Object.entries(watch).length,hitN=L.sure.concat(L.pending).filter(x=>x.hit).length;
 return '<div class="cpSum"><div><b>'+(g?g.count.toLocaleString("es-ES"):"—")+'</b><span>productos con precio oficial de Cardmarket'+(g?' ('+E(DATE(g.sourceCreatedAt))+')':'')+'</span></div><div><b>'+ver.toLocaleString("es-ES")+'</b><span>versiones verificadas con 2 fuentes</span></div><div><b>'+(lo?lo.cards.length:0)+'</b><span>cartas Lorcana con precio de Cardmarket</span></div><div><b>'+L.sure.length+'</b><span>oportunidades con beneficio ≥ '+EUR(c.minProfit)+'</span></div></div>'+
 (hits?'<p class="cpAlert'+(hitN?' on':'')+'">'+(hitN?'🔔 '+hitN+' carta(s) vigilada(s) por debajo de tu precio':'Vigilando '+hits+' carta(s): te avisaré aquí cuando bajen de tu precio')+'</p>':'');
}
function sourcesHtml(){
 const s=M.src,b=budget(),line=(n,o)=>'<li><b>'+n+'</b> · '+(o.ok||0)+' correctas, '+(o.fail||0)+' fallidas'+(o.last?' · última '+WHEN(o.last):'')+(o.lastErr?' · <span class="neg">'+E(o.lastErr)+'</span>':'')+'</li>';
 return '<details class="v4settings"><summary>Estado de las fuentes</summary><ul class="v4help">'+line("Guía oficial de Cardmarket (espejo diario en GitHub)",s.guide)+line("pokemontcg.io · verificación y «desde» EX+ · "+b.n+"/"+PT_DAILY+" hoy"+(ptRunning?" · comprobando "+ptRunning.done+"/"+ptRunning.total+" colecciones":""),s.ptcg)+line("Bindex · Lorcana en Cardmarket",s.bindex)+'</ul>'+
  '<p class="v4note">Cardmarket no publica el idioma de su «desde» ni ventas por idioma: las cifras mezclan idiomas y estados. Envío a 41020 y comisión editables en «Supuestos del cálculo». Fuentes: <a href="https://github.com/ZyzyThePizi/pokemon-price-data" target="_blank" rel="noopener">espejo de la guía</a>, <a href="https://pokemontcg.io" target="_blank" rel="noopener">pokemontcg.io</a>, <a href="https://github.com/Douxeh/bindex-prices" target="_blank" rel="noopener">Bindex</a>.</p></details>';
}
let rT=null;function render(){clearTimeout(rT);rT=setTimeout(renderNow,30)}
function renderNow(){
 if(typeof document.querySelector!=="function")return;const slot=document.querySelector('[data-rd-live="compra"]');if(!slot)return;
 langData=readLS(LKEY,{});watch=readLS(WKEY,{});const c=cfg(),L=list();
 const sel=(k,opts,label)=>'<label>'+label+'<select data-cp-view="'+k+'">'+opts.map(([v,t])=>'<option value="'+v+'"'+(view[k]===v?' selected':'')+'>'+t+'</option>').join("")+'</select></label>';
 const loading=!M.guide&&!M.lo;
 slot.innerHTML='<section class="rdlivebox cpBox"><h3>Ofertas en Cardmarket · compra y venta desde 41020 Sevilla</h3>'+summaryHtml(L,c)+
  (busy?'<p class="v4note">⏳ '+E(busy)+'</p>':'')+
  '<div class="rdctl"><label class="cpQ">Buscar carta<input type="search" data-cp-q value="'+E(view.q)+'" placeholder="Nombre, colección o número"></label>'+sel("game",[["all","Todas"],["pokemon","Pokémon"],["lorcana","Lorcana"]],"Juego")+sel("cond",[["all","Todos"],["buen","Buen estado"],["mal","Mal estado · restaurar"]],"Estado")+
  sel("show",[["profit","Solo con beneficio ≥ "+EUR(c.minProfit)],["all","Todas con precio"]],"Mostrar")+sel("sort",[["profit","Mayor beneficio"],["buy","Menor precio de compra"],["margin","Mayor margen %"],["sale","Mayor precio de venta"],["liq","Se venden más rápido"],["mom","Subiendo esta semana"],["name","Nombre A–Z"]],"Ordenar")+'</div>'+
  '<div class="v4actions"><button type="button" class="v4btn" data-cp-refresh>Actualizar precios</button></div>'+sourcesHtml()+
  (L.sure.length?'<div class="v4list">'+L.sure.slice(0,25).map((x,i)=>cardHtml(x,i+1,c)).join("")+'</div>'+(L.sure.length>25?'<details class="v4old"><summary>Ver más ('+(L.sure.length-25)+')</summary><div class="v4list">'+L.sure.slice(25,150).map((x,i)=>cardHtml(x,i+26,c)).join("")+'</div></details>':''):
   '<p class="v4empty">'+(loading?'Cargando la guía oficial de Cardmarket…':view.q?'Ninguna carta coincide con «'+E(view.q)+'».':'Ninguna oportunidad cumple estos filtros. Prueba «Todas con precio», otro estado u ordenar distinto.')+'</p>')+
  (L.pending.length?'<details class="v4old"><summary>Por confirmar versión o sin ventas recientes ('+L.pending.length+')</summary><p class="v4note">Cardmarket tiene varias versiones con el mismo nombre y aún no hay una segunda fuente que confirme cuál es, o no hay ventas en los últimos 30 días. Comprueba el número en la ficha antes de comprar.</p><div class="v4list">'+L.pending.slice(0,40).map(x=>cardHtml(x,0,c)).join("")+'</div></details>':'')+'</section>';
 slot.querySelectorAll("img[data-v4img]").forEach(im=>{if(im.dataset.wired)return;im.dataset.wired="1";im.addEventListener("error",()=>{const a=im.dataset.alt;if(a&&!im.dataset.usedAlt){im.dataset.usedAlt="1";im.src=a;return}im.hidden=true;const n=im.parentElement.querySelector(".v4noimg");if(n)n.hidden=false})});
}

/* ---------- historial (guía diaria acumulada) ---------- */
const histCache={};
async function loadHist(pid){
 const box=document.querySelector('[data-cp-hist="'+CSS.escape(String(pid))+'"]');if(!box)return;box.innerHTML='<p class="v4note">Cargando historial…</p>';
 try{const sh=Number(pid)%1000;const j=histCache[sh]||(histCache[sh]=await getJSON(ZZ+"history/"+sh+".json",null,30000));const rows=(j?.[String(pid)]||[]).filter(r=>N(r[2]));
  if(rows.length<2){box.innerHTML='<p class="v4note">Aún no hay historial suficiente para este producto.</p>';return}
  const xs=rows.map(r=>N(r[2])),lo=Math.min(...xs),hi=Math.max(...xs),W=300,H=70,pts=xs.map((v,i)=>(i*(W/(xs.length-1))).toFixed(1)+","+(H-4-(hi===lo?.5:(v-lo)/(hi-lo))*(H-8)).toFixed(1)).join(" ");
  box.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" class="cpSpark" role="img" aria-label="Tendencia de precio"><polyline fill="none" stroke="currentColor" stroke-width="2" points="'+pts+'"/></svg><p class="v4note">Tendencia de Cardmarket del '+E(DATE(rows[0][0]))+' al '+E(DATE(rows[rows.length-1][0]))+': '+EUR(xs[0])+' → '+EUR(xs[xs.length-1])+' ('+PCT(xs[xs.length-1]/xs[0]-1)+') · mínimo '+EUR(lo)+' · máximo '+EUR(hi)+'.</p>';
 }catch(e){box.innerHTML='<p class="v4note neg">No se pudo cargar el historial ('+E(e.message||e)+').</p>'}
}

/* ---------- acciones ---------- */
function saveLang(id){
 const box=document.getElementById("cp-"+id);if(!box)return;const cur={};const bad=[];
 for(const [k,n] of LANGS){const bi=box.querySelector('[data-cp-lbuy="'+id+'|'+k+'"]'),si=box.querySelector('[data-cp-lsell="'+id+'|'+k+'"]'),ci=box.querySelector('[data-cp-lcond="'+id+'|'+k+'"]');if(!bi)continue;
  const b=NUM(bi.value),s=NUM(si.value);if((bi.value.trim()&&!Number.isFinite(b))||(si.value.trim()&&!Number.isFinite(s))){bad.push(n);continue}
  if(Number.isFinite(b)||Number.isFinite(s))cur[k]={buy:Number.isFinite(b)?b:undefined,sell:Number.isFinite(s)?s:undefined,cond:ci?.value==="mal"?"mal":"buen",at:new Date().toISOString()}}
 if(bad.length){alert("Importe no válido en: "+bad.join(", ")+". Usa números como 150 o 149,90.");return}
 const all=readLS(LKEY,{});if(Object.keys(cur).length)all[id]=cur;else delete all[id];
 if(!writeLS(LKEY,all)){alert("NO se han guardado los precios: el almacenamiento del navegador no lo permite.");return}
 langData=all;renderNow();document.getElementById("cp-"+id)?.scrollIntoView({block:"nearest"});
}
function setWatch(id,target){const w=readLS(WKEY,{});if(target==null)delete w[id];else w[id]={target,at:new Date().toISOString()};if(!writeLS(WKEY,w)){alert("NO se ha guardado: el almacenamiento del navegador no lo permite.");return}watch=w;renderNow()}
function promote(id){
 const x=cardsPk().find(c=>c.id===id);if(!x)return;const c=cfg(),b=bestOp(x.ops,"all"),l=links(x),p=x.p,d=p.date||new Date().toISOString();
 const sales=[];
 if(Number.isFinite(p.avg30))sales.push({kind:"agregado",price:p.avg30,currency:"EUR",date:d,condition:"todas",language:"todos",platform:"Cardmarket · media 30 días (guía oficial, todos los idiomas)",url:l.cm,note:"Agregado de ventas reales; no es una venta individual."});
 if(Number.isFinite(p.trend))sales.push({kind:"agregado",price:p.trend,currency:"EUR",date:d,condition:"todas",language:"todos",platform:"Cardmarket · tendencia (guía oficial)",url:l.cm,note:"Agregado."});
 if(Number.isFinite(p.low))sales.push({kind:"anuncio",price:p.low,currency:"EUR",date:d,condition:"desconocido",language:"desconocido",platform:"Cardmarket · «desde» (guía oficial)",url:l.cm,note:"Precio pedido. NO es una venta."});
 for(const o of x.ops)if(o.own)sales.push({kind:"anuncio",price:o.buy,currency:"EUR",date:o.at||new Date().toISOString(),condition:o.cond==="mal"?"mal estado":"buen estado",language:o.lang,platform:"Cardmarket · anotado por ti",url:l.cm,note:"Precio pedido. NO es una venta."});
 const [a,alt]=window.CVRadar?.pkImages?window.CVRadar.pkImages(x.r,null):["",""];
 window.CVVault?.addCustom?.({lane:b&&b.cond==="mal"?"restaurar":"compra",game:"pokemon",name:x.name,set:x.set,number:x.number,rarity:x.rarity,language:b&&b.own?b.lang:"",image:a,imageAlt:alt||"",links:{cardmarket:l.cm},
  why:b?"Compra YA (Cardmarket, 41020): "+b.label+" · compra "+EUR(b.buy)+", con envío "+EUR(b.cost)+", venta "+EUR(b.sale)+" → "+SIGNED(b.profit)+". Versión: "+x.res.why+". Comprueba idioma, estado y número en el anuncio.":"Registrada desde Compra YA. Comprueba el anuncio.",sales,source:"Compra YA V116"});
}
let busy="",ctrl=null,started=false;
async function refresh(force){
 if(busy)return;ctrl=new AbortController();
 try{busy="Cargando catálogo…";render();await loadCatalog();
  busy="Descargando la guía oficial de Cardmarket…";render();try{await loadGuide(force)}catch{}
  busy="";render();
  /* verificación de versiones: primero las colecciones de las cartas que salen en la lista y las vigiladas */
  const L=list(),first=[...new Set(L.sure.concat(L.pending).slice(0,80).filter(x=>x.kind==="pk"&&hasPtcg(x.id)).map(x=>ptSetOf(x.id)))];
  const rest=[...new Set(window.CV_UNIVERSE.cards.filter(r=>hasPtcg(r[0])&&window.CV_CM_MAP?.[r[0]]?.[1]).map(r=>ptSetOf(r[0])))].filter(s=>!first.includes(s));
  const lor=view.game!=="pokemon"?loadLorcana(ctrl).then(render):Promise.resolve();
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
 const t=e.target.closest("[data-cp-refresh],[data-cp-lsave],[data-cp-watch],[data-cp-unwatch],[data-cp-promote],[data-cp-histload]");if(!t)return;const d=t.dataset;
 if("cpRefresh" in d){M.pt.sets={};refresh(true)}
 else if(d.cpLsave)saveLang(d.cpLsave);
 else if(d.cpWatch){const v=NUM(document.querySelector('[data-cp-target="'+CSS.escape(d.cpWatch)+'"]')?.value);if(!Number.isFinite(v)){alert("Indica el precio máximo al que quieres comprar.");return}setWatch(d.cpWatch,v)}
 else if(d.cpUnwatch)setWatch(d.cpUnwatch,null);
 else if(d.cpPromote)promote(d.cpPromote);
 else if(d.cpHistload)loadHist(d.cpHistload);
});
document.addEventListener("change",e=>{const t=e.target.closest("[data-cp-view]");if(!t)return;view[t.dataset.cpView]=t.value;writeLS(VKEY,view);if(t.dataset.cpView==="cond")window.CVVault?.setCondView?.(t.value);if(t.dataset.cpView==="game"&&t.value!=="pokemon"&&!M.lo)loadLorcana(new AbortController()).then(render);renderNow()});
let qT=null;document.addEventListener("input",e=>{const t=e.target.closest("[data-cp-q]");if(!t)return;clearTimeout(qT);qT=setTimeout(()=>{view.q=t.value;writeLS(VKEY,view);renderNow();if(view.q.trim())verifyVisible();const q=document.querySelector("[data-cp-q]");if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}},250)});
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="radar"]'))setTimeout(onShow,60)});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(onShow,1200));else setTimeout(onShow,1200);
window.CVCompra={render:renderNow,refresh,resolve,ops,bestOp,parseGuide,parsePtCard,liquidity,momentum,saleRef,list,state:()=>M,ready:()=>ready,setState:x=>{M={...M,...x}},reloadLocal:()=>{langData=readLS(LKEY,{});watch=readLS(WKEY,{});view={...view,...readLS(VKEY,{})}}};
})();
