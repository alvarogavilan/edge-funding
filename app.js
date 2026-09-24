const seed=[
{id:"vap149",name:"Vaporeon ex #149/131",set:"Prismatic Evolutions · 2025",grade:9,cert:"136142566",value:215,purchase:null,referenceImage:"https://images.pokemontcg.io/sv8pt5/149_hires.png",icon:"💧"},
{id:"eev174",name:"Eevee ex #174",set:"SVP Promo · 2025",grade:9,cert:"136142568",value:30,purchase:null,referenceImage:"https://images.pokemontcg.io/svp/174_hires.png",icon:"✨"},
{id:"cha074",name:"Charizard ex #074",set:"Paldean Fates Tin · 2024",grade:9,cert:"136142569",value:38,purchase:null,referenceImage:"https://images.pokemontcg.io/svp/74_hires.png",icon:"🔥"},
{id:"cha228",name:"Charizard ex #228/197",set:"Obsidian Flames · 2023",grade:9,cert:"136142567",value:55,purchase:null,referenceImage:"https://images.pokemontcg.io/sv3/228_hires.png",icon:"🏆"}];
const KEY="cardvault.v2";let editId=null;const catalogCache={};let recognitionQueue=[];let queueRunning=false;const DB="cardvault.media.v1";let db;function openDB(){return new Promise((ok,no)=>{let r=indexedDB.open(DB,2);r.onupgradeneeded=()=>{let d=r.result;if(!d.objectStoreNames.contains("photos"))d.createObjectStore("photos");if(!d.objectStoreNames.contains("marketSignals"))d.createObjectStore("marketSignals",{keyPath:"id"})};r.onsuccess=()=>{db=r.result;ok(db)};r.onerror=()=>no(r.error)})}
function photoPut(id,blob){return new Promise((ok,no)=>{let t=db.transaction("photos","readwrite"),r=t.objectStore("photos").put(blob,id);r.onsuccess=()=>ok();r.onerror=()=>no(r.error)})}
function photoGet(id){return new Promise((ok,no)=>{let r=db.transaction("photos").objectStore("photos").get(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
function photoDel(id){return new Promise(ok=>{let r=db.transaction("photos","readwrite").objectStore("photos").delete(id);r.onsuccess=()=>ok()})}
function marketSignalPutMany(rows){return new Promise((ok,no)=>{try{let t=db.transaction("marketSignals","readwrite"),s=t.objectStore("marketSignals");for(const x of rows||[])if(x?.id)s.put(x);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)}catch(e){no(e)}})}
function marketSignalAll(){return new Promise((ok,no)=>{try{let r=db.transaction("marketSignals").objectStore("marketSignals").getAll();r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>no(r.error)}catch(e){no(e)}})}
function marketSignalCount(){return new Promise((ok,no)=>{try{let r=db.transaction("marketSignals").objectStore("marketSignals").count();r.onsuccess=()=>ok(r.result||0);r.onerror=()=>no(r.error)}catch(e){no(e)}})}function marketSignalDeleteMany(ids){return new Promise((ok,no)=>{try{let t=db.transaction("marketSignals","readwrite"),s=t.objectStore("marketSignals");for(const id of ids||[])s.delete(id);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)}catch(e){no(e)}})}
function marketSignalClear(){return new Promise((ok,no)=>{try{let r=db.transaction("marketSignals","readwrite").objectStore("marketSignals").clear();r.onsuccess=()=>ok();r.onerror=()=>no(r.error)}catch(e){no(e)}})}let state=JSON.parse(localStorage.getItem(KEY)||"null")||{cards:seed,watch:[],history:[],market:[]};if(!state.market)state.market=[];if(!state.watch)state.watch=[];if(!state.history)state.history=[];if(!state.marketScan)state.marketScan=[];if(!state.marketScanHistory)state.marketScanHistory=[];if(!state.compare)state.compare=[];if(!state.alertHistory)state.alertHistory=[];if(!state.signalHistory)state.signalHistory=[];if(!state.analystWeights)state.analystWeights={momentum:.30,value:.22,stability:.18,global:.12,data:.18,scarcity:.12};if(!state.processingLog)state.processingLog=[];if(!state.selfTest)state.selfTest={};if(!state.photoValidation)state.photoValidation={};if(!state.certification)state.certification={};if(!state.releaseChecks)state.releaseChecks={};if(!state.runtimeErrors)state.runtimeErrors=[];if(!state.dataQuality)state.dataQuality={};if(!state.schemaVersion||state.schemaVersion<43)state.schemaVersion=44;if(!state.marketCursor)state.marketCursor=0;if(!state.marketUniverse)state.marketUniverse={};if(!state.marketCoverage)state.marketCoverage={total:0,seen:0,priced:0,at:null};if(!state.marketScannedIds)state.marketScannedIds={};if(!state.marketFailures)state.marketFailures={};if(!state.processingLog)state.processingLog=[];if(!state.selfTest)state.selfTest={};if(!state.photoValidation)state.photoValidation={};if(!state.certification)state.certification={};if(!state.releaseChecks)state.releaseChecks={};if(!state.runtimeErrors)state.runtimeErrors=[];state=ensureStateShape(state);const refImages={vap149:"https://images.pokemontcg.io/sv8pt5/149_hires.png",eev174:"https://images.pokemontcg.io/svp/174_hires.png",cha074:"https://images.pokemontcg.io/svp/74_hires.png",cha228:"https://images.pokemontcg.io/sv3/228_hires.png"};for(const c of state.cards){if(refImages[c.id]&&!c.referenceImage)c.referenceImage=refImages[c.id]}save();let radarLimit=999999;
const euro=n=>(+n||0).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const qty=x=>Math.max(1,+x.quantity||1);
const total=()=>state.cards.reduce((a,x)=>a+(+x.value||0)*qty(x),0);
const invested=()=>state.cards.reduce((a,x)=>a+(x.purchase==null?0:(+x.purchase||0)*qty(x)),0);
const drafts=()=>state.cards.filter(x=>x.draft).length;
const gain=()=>total()-invested();function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function ensureStateShape(s){
  s=s&&typeof s==="object"?s:{};
  const arrays=["cards","watch","history","market","marketScan","marketScanHistory","compare","alertHistory","signalHistory","processingLog","runtimeErrors"];
  for(const k of arrays)if(!Array.isArray(s[k]))s[k]=k==="cards"?[]:[];
  if(!s.analystWeights||typeof s.analystWeights!=="object")s.analystWeights={momentum:.30,value:.22,stability:.18,global:.12,data:.18,scarcity:.12};
  for(const k of ["selfTest","photoValidation","certification","releaseChecks","dataQuality","marketUniverse","marketFailures"])if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]={};
  if(!s.marketCoverage||typeof s.marketCoverage!=="object"||Array.isArray(s.marketCoverage))s.marketCoverage={total:0,seen:0,priced:0,active:0,stale:0,failed:0,at:null};
  s.marketCursor=Math.max(0,+s.marketCursor||0);
  s.schemaVersion=44;
  for(const c of s.cards){
    if(!c||typeof c!=="object")continue;
    if(!c.id)c.id=crypto.randomUUID();
    c.quantity=Math.max(1,+c.quantity||1);
    c.value=Number.isFinite(+c.value)?+c.value:0;
    if(!c.name)c.name="Carta por identificar";
    if(!c.grading)c.grading="RAW";
    if(c.draft==null)c.draft=c.name==="Carta por identificar";
  }
  return s;
}
function renderBootStatus(){
  const box=document.querySelector("#bootPanel");if(!box)return;const b=state.bootInfo||{};
  box.innerHTML='<h3>Inicio y recuperación</h3><div class="qaRow"><span>Esquema de datos</span><b class="ok">V'+(state.schemaVersion||"?")+'</b></div><div class="qaRow"><span>Radar recuperado</span><b class="'+(b.radarLoaded?"ok":"warn")+'">'+(b.radarLoaded?(b.radarCount+" señales"):"Pendiente")+'</b></div><div class="qaRow"><span>Último arranque</span><b>'+(b.at?new Date(b.at).toLocaleString("es-ES"):"—")+'</b></div>';
}
function pushRuntimeError(kind,message){
  try{state.runtimeErrors=state.runtimeErrors||[];state.runtimeErrors.push({at:new Date().toISOString(),kind,message:String(message||"").slice(0,240)});state.runtimeErrors=state.runtimeErrors.slice(-20);save()}catch{}
}
window.addEventListener("error",e=>pushRuntimeError("error",e.message||e.error));
window.addEventListener("unhandledrejection",e=>pushRuntimeError("promise",e.reason?.message||e.reason||"rejection"));
function stateIntegrityReport(){
  const issues=[],ids=new Set();
  if(!Array.isArray(state.cards))issues.push("Colección inválida");
  else for(const c of state.cards){
    if(!c||typeof c!=="object"){issues.push("Ficha inválida");continue}
    if(!c.id)issues.push("Carta sin ID");
    else if(ids.has(c.id))issues.push("ID duplicado: "+c.id); else ids.add(c.id);
    if(c.quantity!=null&&(!Number.isFinite(+c.quantity)||+c.quantity<1))issues.push("Cantidad inválida: "+(c.name||c.id));
    if(c.value!=null&&!Number.isFinite(+c.value))issues.push("Valor inválido: "+(c.name||c.id));
  }
  for(const k of ["watch","history","market","marketScan","marketScanHistory","compare","alertHistory","signalHistory","processingLog","runtimeErrors"])if(!Array.isArray(state[k]))issues.push(k+" no es una lista");if(!state.marketUniverse||typeof state.marketUniverse!=="object"||Array.isArray(state.marketUniverse))issues.push("marketUniverse inválido");if(!state.marketFailures||typeof state.marketFailures!=="object"||Array.isArray(state.marketFailures))issues.push("marketFailures inválido");
  return {ok:issues.length===0,issues};
}
function repairStateIntegrity(){
  const arrays=["cards","watch","history","market","marketScan","marketScanHistory","compare","alertHistory","signalHistory","processingLog","runtimeErrors"];
  for(const k of arrays)if(!Array.isArray(state[k]))state[k]=[];if(!state.marketUniverse||typeof state.marketUniverse!=="object"||Array.isArray(state.marketUniverse))state.marketUniverse={};if(!state.marketScannedIds||typeof state.marketScannedIds!=="object"||Array.isArray(state.marketScannedIds))state.marketScannedIds={};if(!state.marketFailures||typeof state.marketFailures!=="object"||Array.isArray(state.marketFailures))state.marketFailures={};
  const seen=new Set(),fixed=[];
  for(const c0 of state.cards){
    if(!c0||typeof c0!=="object")continue;const c=c0;
    if(!c.id||seen.has(c.id))c.id=crypto.randomUUID();seen.add(c.id);
    c.quantity=Math.max(1,Number.isFinite(+c.quantity)?+c.quantity:1);
    c.value=Number.isFinite(+c.value)?+c.value:0;
    if(!c.name)c.name="Carta por identificar";
    if(!c.grading)c.grading="RAW";
    if(c.draft==null)c.draft=c.name==="Carta por identificar";
    fixed.push(c);
  }
  state.cards=fixed;save();return stateIntegrityReport();
}
function renderIntegrity(){
  const box=document.querySelector("#integrityResults");if(!box)return;const r=stateIntegrityReport(),errs=(state.runtimeErrors||[]);
  box.innerHTML='<div class="qaRow"><span>Estado de datos</span><b class="'+(r.ok?"ok":"warn")+'">'+(r.ok?"OK":r.issues.length+" incidencias")+'</b></div><div class="qaRow"><span>Errores de ejecución guardados</span><b class="'+(errs.length?"warn":"ok")+'">'+errs.length+'</b></div>'+(r.issues.length?'<div class="integrityIssues">'+r.issues.slice(0,8).map(x=>'<div>• '+x+'</div>').join("")+'</div>':'');
}
function comparableKeyMatch(m,x){
  if(m.kind!=="sold")return false;
  if((m.currency||"EUR").toUpperCase()!=="EUR")return false;
  if(norm(m.name)!==norm(x.name))return false;
  if(String(m.grading||"")!==String(x.grading||""))return false;
  if(String(m.grade||"")!==String(x.grade||""))return false;
  if(m.set&&x.set&&norm(m.set)!==norm(x.set))return false;
  return true;
}
function forecast(x){
  let obs=state.market.filter(m=>comparableKeyMatch(m,x)).map(m=>({...m,price:+m.price,t:new Date(m.soldDate||m.at||0).getTime()})).filter(m=>m.price>0&&Number.isFinite(m.t)).sort((a,b)=>a.t-b.t).slice(-12);
  if(obs.length<3||!(+x.value>0))return null;
  const mid=Math.ceil(obs.length/2),a=obs.slice(0,mid),b=obs.slice(mid);
  if(!b.length)return null;
  const avg=v=>v.reduce((s,o)=>s+o.price,0)/v.length,first=avg(a),last=avg(b),trend=clamp((last-first)/Math.max(first,1),-.25,.25);
  return {low:+x.value*(1+trend*.5),base:+x.value*(1+trend),high:+x.value*(1+trend*1.75),evidence:obs.length,trend};
}
async function hydratePhotos(){for(const x of state.cards){if(x.photoKey&&!x.photoURL){let b=await photoGet(x.photoKey);if(b)x.photoURL=URL.createObjectURL(b)}}render()}function render(){let q=(document.querySelector("#searchCards")?.value||"").toLowerCase(),ft=document.querySelector("#filterType")?.value||"",visible=state.cards.filter(x=>(!ft||(x.grading||"PSA")===ft)&&(!q||[x.name,x.set,x.number,x.cert].join(" ").toLowerCase().includes(q)));document.querySelector("#cards").innerHTML=visible.map(x=>{let p=x.purchase!=null?((x.value-x.purchase)*qty(x)):null;return `<article class="card" onclick="editCard(\`${x.id}\`)"><div class="thumb">${x.photoURL?`<img src="${x.photoURL}">`:x.photo?`<img src="${x.photo}">`:x.referenceImage?`<img src="${x.referenceImage}" alt="${x.name}">`:x.icon||"🃏"}</div><div><h3>${x.draft?"⚠️ ":""}${x.name}</h3><div class="meta">${x.number?x.number+" · ":""}${x.set||""}<br>${x.cert?"Cert. "+x.cert:""}${qty(x)>1?" · Cant. "+qty(x):""}</div><span class="grade">${x.grading||"PSA"} ${x.grade||""}</span>${x.recognition?.score?`<div class="recognition">Reconocimiento ${x.recognition.score}% · ${x.recognition.source==="collector-number"?"número exacto":x.recognition.source==="collector-number+visual"?"número + imagen":x.recognition.source==="collector-number+name-tokens"?"número + texto":"asistido"}</div>`:""}${x.popGrade!=null&&x.popSource?`<div class="scarcity">Pop ${x.grade||""}: ${x.popGrade} · ${x.popSource}${x.popHigher!=null?" · superiores "+x.popHigher:""}</div>`:""}</div><div class="price">${euro(x.value)}${(()=>{let s=(state.marketScan||[]).find(m=>m.id===x.catalogId);return s?`<div class="signal mini">${s.score}</div>`:""})()}${x.marketPricing?`<div class="marketRef">RAW · ${x.marketPricing.source}</div>`:""}${x.gradedValuation?`<div class="marketRef">${x.grading} ${x.grade||""} · ${x.gradedValuation.count} ventas · ${x.gradedValuation.confidence}${x.gradedValuation.liquidity!=null?" · Liq "+x.gradedValuation.liquidity:""}</div>`:""}${forecast(x)?`<div class="future">12m ≈ ${euro(forecast(x).base)}</div>`:""}${p==null?"":`<div class="profit ${p>=0?"up":"down"}">${p>=0?"+":""}${euro(p)}</div>`}</div></article>`}).join("");document.querySelector("#total").textContent=euro(total());document.querySelector("#count").textContent=state.cards.reduce((n,x)=>n+qty(x),0)+" cartas";
let cs=document.querySelector("#collectionStats");if(cs){let g=gain(),inv=invested();cs.innerHTML=
'<div><span>Valor actual</span><b>'+euro(total())+'</b></div>'+
'<div><span>Invertido</span><b>'+euro(inv)+'</b></div>'+
'<div><span>Resultado</span><b class="'+(g>=0?'up':'down')+'">'+(g>=0?'+':'')+euro(g)+'</b></div>'+
'<div><span>Pendientes</span><b>'+drafts()+'</b></div>';} let prev=state.history.at(-1)?.total;document.querySelector("#change").textContent=prev==null?"Pulsa «Guardar valoración» para crear histórico":(total()-prev>=0?"+":"")+euro(total()-prev)+" desde la última valoración";document.querySelector("#watchList").innerHTML=state.watch.length?state.watch.map((x,i)=>{let m=(state.marketScan||[]).find(s=>s.id===x.catalogId||norm(s.name)===norm(x.name));return `<div class="card"><div class="thumb">👁️</div><div><h3>${x.name}</h3><div class="meta">Objetivo ≤ ${euro(x.target)}${m?" · mercado "+euro(m.price):""}${m&&m.price<=x.target?" · ✅ en objetivo":""}</div>${m?`<div class="recognition">Convicción ${convictionSignal(m)}/100 · Liquidez ${liquiditySignal(m)}/100</div>`:""}</div><button onclick="removeWatch(${i})">×</button></div>`}).join(""):'<div class="empty">No sigues ninguna carta todavía.</div>';renderWatchSummary();renderHistory()}
function renderHistory(){const h=[...state.history].reverse();document.querySelector("#history").innerHTML=h.slice(0,10).map(x=>`<div class="historyRow"><span>${new Date(x.at).toLocaleString("es-ES")}</span><b>${euro(x.total)}</b></div>`).join("");drawChart()}
function drawChart(){const c=document.querySelector("#chart"),dpr=devicePixelRatio||1,r=c.getBoundingClientRect();c.width=r.width*dpr;c.height=r.height*dpr;const g=c.getContext("2d");g.scale(dpr,dpr);g.clearRect(0,0,r.width,r.height);let a=state.history.slice(-30);if(a.length<2){g.fillStyle="#8992ad";g.font="13px -apple-system";g.fillText("Guarda 2 valoraciones para ver la evolución",12,30);return}let vals=a.map(x=>x.total),mn=Math.min(...vals),mx=Math.max(...vals);if(mx===mn){mx++;mn--}g.strokeStyle="#eef2ff";g.lineWidth=2;g.beginPath();a.forEach((x,i)=>{let px=10+i*(r.width-20)/(a.length-1),py=10+(mx-x.total)*(r.height-20)/(mx-mn);i?g.lineTo(px,py):g.moveTo(px,py)});g.stroke()}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".tab").forEach(x=>x.classList.add("hidden"));document.querySelector("#"+b.dataset.tab).classList.remove("hidden");if(b.dataset.tab==="data")drawChart()});
document.querySelector("#snapshot").onclick=()=>{state.history.push({at:new Date().toISOString(),total:total(),cards:Object.fromEntries(state.cards.map(x=>[x.id,x.value]))});save();render()};
function radarScore(group){let sold=group.filter(x=>x.kind==="sold"),list=group.filter(x=>x.kind==="listing");if(!sold.length)return 0;let prices=sold.map(x=>x.price).sort((a,b)=>a-b),med=prices[Math.floor(prices.length/2)],latest=sold.at(-1)?.price||med,score=Math.min(55,sold.length*11);if(latest<med)score+=15;if(list.length&&Math.min(...list.map(x=>x.price))<med*.9)score+=20;return Math.min(100,score)}
function renderRadar(){let groups={};state.market.forEach(x=>{let key=[x.name,x.set||"",x.grading||"",x.grade||""].join("||");(groups[key]??=[]).push(x)});let rows=Object.entries(groups).map(([key,g])=>({name:g[0]?.name||key,set:g[0]?.set||"",grading:g[0]?.grading||"",grade:g[0]?.grade||"",g,score:radarScore(g),sold:g.filter(x=>x.kind==="sold"),ask:g.filter(x=>x.kind==="listing")})).filter(x=>{let p=x.ask.length?Math.min(...x.ask.map(y=>y.price)):Infinity;return p<=radarLimit}).sort((a,b)=>b.score-a.score);let rs=document.querySelector("#radarSummary");if(rs){let obs=state.market.length,sales=state.market.filter(x=>x.kind==="sold").length,active=state.market.filter(x=>x.kind==="listing").length,opps=rows.filter(x=>x.score>=60).length;rs.innerHTML='<div><span>Observaciones</span><b>'+obs+'</b></div><div><span>Ventas</span><b>'+sales+'</b></div><div><span>Anuncios</span><b>'+active+'</b></div><div><span>Señales ≥60</span><b>'+opps+'</b></div>';}document.querySelector("#radarList").innerHTML=rows.length?rows.map(x=>{let sold=x.sold.map(y=>y.price).sort((a,b)=>a-b),med=sold.length?sold[Math.floor(sold.length/2)]:null,ask=x.ask.length?Math.min(...x.ask.map(y=>y.price)):null;return `<article class="opportunity"><div><b>${x.name}</b><div class="meta">${x.set||""}${x.grading||x.grade?" · "+(x.grading||"")+" "+(x.grade||""):""}<br>${x.sold.length} ventas · ${x.ask.length} anuncios · evidencia ${Math.round((x.sold.filter(y=>y.url).length/Math.max(1,x.sold.length))*100)}%</div></div><div><strong>${x.score}/100</strong><div class="meta">${ask!=null?"Oferta "+euro(ask):""}${med!=null?" · Mediana "+euro(med):""}</div></div></article>`}).join(""):'<div class="empty">No hay todavía oportunidades con evidencia suficiente dentro de este precio.</div>'}
document.querySelector("#refreshValues").onclick=refreshPortfolioValues;document.querySelector("#scanMarket").onclick=()=>runMarketScan("quick");document.querySelector("#deepScanMarket").onclick=()=>runMarketScan("wide");document.querySelector("#continueCoverage").onclick=()=>continueCoverage(5);document.querySelector("#retryMarketFailures").onclick=retryMarketFailures;renderMarketScan();renderScanHistory();
document.addEventListener("click",e=>{let b=e.target.closest(".watchFromMarket");if(!b)return;e.stopPropagation();let x=(state.marketScan||[]).find(m=>m.id===b.dataset.watchid);if(!x)return;if(!state.watch.some(w=>w.catalogId===x.id))state.watch.push({name:x.name,target:Math.round((x.low||x.price*.9)*100)/100,catalogId:x.id,source:"Market Lab"});save();render();b.textContent="En seguimiento";});
document.addEventListener("click",e=>{let b=e.target.closest(".compareMarket");if(!b)return;e.stopPropagation();toggleCompare(b.dataset.compareid)});
document.querySelectorAll("[data-limit]").forEach(b=>b.onclick=()=>{radarLimit=+b.dataset.limit;document.querySelectorAll("[data-limit]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");renderRadar()});
const marketDialog=document.querySelector("#marketDialog"),marketForm=document.querySelector("#marketForm");document.querySelector("#addMarket").onclick=()=>marketDialog.showModal();document.querySelector("#saveMarket").onclick=e=>{e.preventDefault();if(!marketForm.reportValidity())return;let f=new FormData(marketForm);state.market.push({id:crypto.randomUUID(),name:f.get("name").trim(),set:f.get("set"),grading:f.get("grading"),grade:f.get("grade"),price:+f.get("price"),kind:f.get("kind"),source:f.get("source"),url:f.get("url"),soldDate:f.get("soldDate")||"",currency:(f.get("currency")||"EUR").toUpperCase(),at:new Date().toISOString()});save();renderRadar();renderMarketEvidence();marketForm.reset();marketDialog.close()};
document.querySelector("#addWatch").onclick=()=>{let name=prompt("Nombre de la carta que quieres seguir");if(!name)return;let target=prompt("Precio objetivo en euros","30");state.watch.push({name,target:+target||0});save();render()};window.removeWatch=i=>{state.watch.splice(i,1);save();render()};

function cleanOCR(s){return (s||"").replace(/[|]/g,"I").replace(/\s+/g," ").trim()}
function guessFromOCR(text){
  const raw=text||"", lines=raw.split(/\n+/).map(cleanOCR).filter(Boolean);
  const number=(raw.match(/\b\d{1,3}\s*\/\s*\d{2,3}\b/)||[])[0]?.replace(/\s/g,"")||"";
  const cert=(raw.match(/\b\d{8,10}\b/)||[])[0]||"";
  const gradeMatch=raw.match(/(?:GEM\s*MT|MINT|NM[- ]?MT|PSA|BGS|CGC|BECKETT)\s*(10(?:\.0)?|9\.5|9|8\.5|8|7\.5|7|6\.5|6|5\.5|5|4\.5|4|3\.5|3|2\.5|2|1\.5|1)\b/i);
  const grading=/\bPSA\b/i.test(raw)?"PSA":/\bBGS|BECKETT\b/i.test(raw)?"BGS":/\bCGC\b/i.test(raw)?"CGC":"RAW";
  const grade=gradeMatch?gradeMatch[1]:"";
  const year=(raw.match(/\b(19\d{2}|20\d{2})\b/)||[])[0]||"";
  const language=/\bESPAÑOL|SPANISH\b/i.test(raw)?"Español":/\bJAPANESE|JAPON[EÉ]S\b/i.test(raw)?"Japonés":/\bENGLISH\b/i.test(raw)?"Inglés":"";
  const stop=/POK[EÉ]MON|TRAINER|ENERGY|BASIC|STAGE|PSA|GEM|MINT|HP|SVP|ILLUSTRATION|RARE|HOLO|CARD/i;
  let name=lines.find(x=>x.length>=3&&x.length<=28&&!stop.test(x)&&!/^\d/.test(x)&&/^[A-Za-zÀ-ÿ0-9 .\-]+$/.test(x)&&(/[A-Za-zÀ-ÿ]{3,}/.test(x)))||"";
  return {number,cert,grade,grading,year,language,name:""};
}
async function tcgdexList(lang){
  if(catalogCache[lang])return catalogCache[lang];
  try{
    let r=await fetch("https://api.tcgdex.net/v2/"+lang+"/cards");if(!r.ok)return[];
    let data=await r.json();catalogCache[lang]=data;return data;
  }catch{return[]}
}
async function tcgdexCard(lang,id){
  try{let r=await fetch("https://api.tcgdex.net/v2/"+lang+"/cards/"+encodeURIComponent(id));if(!r.ok)return null;return await r.json()}catch{return null}
}
function normNum(v){return String(v||"").replace(/\s/g,"").replace(/^0+(?=\d)/,"").toLowerCase()}

const MARKET_NAMES=["Pikachu","Charizard","Umbreon","Eevee","Rayquaza","Gengar","Mew","Lugia","Giratina","Sylveon","Greninja","Mewtwo"];
function num(v){v=Number(v);return Number.isFinite(v)?v:null}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function tcgplayerMarket(c){
  const t=c?.pricing?.tcgplayer;if(!t)return null;
  const vals=[];
  for(const [variant,o] of Object.entries(t)){if(o&&typeof o==="object"){let m=num(o.marketPrice);if(m)vals.push({variant,price:m})}}
  if(!vals.length)return null;
  vals.sort((a,b)=>a.price-b.price);return vals[Math.floor(vals.length/2)];
}
function buildMarketSignal(c){
  const cm=c?.pricing?.cardmarket||{},trend=num(cm.trend)||num(cm.avg30)||num(cm.avg7)||num(cm.avg),a1=num(cm.avg1),a7=num(cm.avg7),a30=num(cm.avg30),low=num(cm.low);
  if(!trend)return null;
  const m1=a1&&a30?(a1/a30-1):0,m7=a7&&a30?(a7/a30-1):0,discount=low?clamp((trend-low)/trend,0,0.6):0;
  const vals=[a1,a7,a30,trend].filter(Boolean),mean=vals.reduce((s,n)=>s+n,0)/vals.length;
  const vol=vals.length>1?Math.sqrt(vals.reduce((s,n)=>s+Math.pow((n-mean)/mean,2),0)/vals.length):0.18;
  const global=!!tcgplayerMarket(c),dataCount=[a1,a7,a30,low,trend].filter(Boolean).length;
  const analysts={momentum:Math.round(clamp(50+(m1*.35+m7*.65)*100,0,100)),value:Math.round(clamp(discount*170,0,100)),stability:Math.round(clamp(100-vol*360,0,100)),global:global?80:45,data:Math.round(clamp(dataCount/5*100,0,100))};
  const w=state.analystWeights||{},baseW={momentum:.30,value:.22,stability:.18,global:.12,data:.18};let denom=0,weighted=0;for(const k of Object.keys(baseW)){let wk=Number(w[k]??baseW[k]);denom+=wk;weighted+=(analysts[k]||0)*wk}const score=Math.round(weighted/Math.max(denom,.001));
  const risk=vol<0.08?"Bajo":vol<0.18?"Medio":"Alto";
  const scenario12=trend*(1+clamp(m7*3,-0.25,0.35));
  const owned=state.cards.find(x=>x.catalogId===c.id),sc=owned?scarcitySignal(owned):null;let finalScore=score;if(sc){analysts.scarcity=sc.score;let sw=Number(state.analystWeights?.scarcity??.12);finalScore=Math.round((score+sc.score*sw)/(1+sw))}return {id:c.id,name:c.name,set:c.set?.name||"",image:c.image?c.image+"/low.webp":"",price:trend,low,avg1:a1,avg7:a7,avg30:a30,momentum1:m1,momentum7:m7,discount,volatility:vol,global,tcgplayer:tcgplayerMarket(c),score:finalScore,risk,scenario12,rarity:c.rarity||"",updated:cm.updated||null,scannedAt:new Date().toISOString(),analysts,scarcity:sc};
}
async function mapLimit(items,limit,fn){
  let out=new Array(items.length),i=0;async function worker(){while(true){let n=i++;if(n>=items.length)return;try{out[n]=await fn(items[n],n)}catch{out[n]=null}}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));return out;
}
async function activeMarketSignals(maxAgeDays=45){
  const all=await marketSignalAll().catch(()=>[]);
  const now=Date.now(),active=[],stale=[];
  for(const x of all){
    const t=new Date(x.scannedAt||x.updated||0).getTime();
    if(t&&now-t<=maxAgeDays*86400000)active.push(x);else stale.push(x);
  }
  return {all,active,stale};
}
async function refreshMarketFreshness(){
  const q=await activeMarketSignals(45);
  state.marketCoverage.priced=q.all.length;
  state.marketCoverage.active=q.active.length;
  state.marketCoverage.stale=q.stale.length;
  save();
  return q;
}
async function fetchMarketUniverse(mode="quick"){
  const list=await tcgdexList("en"),pool=(list||[]).filter(x=>x.id&&x.name);
  if(mode==="wide"){
    const batchSize=120,total=pool.length||0,start=total?state.marketCursor%total:0,briefs=[];
    for(let n=0;n<Math.min(batchSize,total);n++)briefs.push(pool[(start+n)%total]);
    const full=await mapLimit(briefs,4,async b=>{
      const c=await tcgdexCard("en",b.id);
      if(!c)state.marketFailures[b.id]=(state.marketFailures[b.id]||0)+1;
      else delete state.marketFailures[b.id];
      return c;
    });
    const fetched=full.filter(Boolean),signals=fetched.map(buildMarketSignal).filter(Boolean),pricedIds=new Set(signals.map(x=>x.id)),lostPrice=fetched.filter(c=>!pricedIds.has(c.id)).map(c=>c.id);
    if(signals.length)await marketSignalPutMany(signals);if(lostPrice.length)await marketSignalDeleteMany(lostPrice);
    state.marketCursor=total?((start+briefs.length)%total):0;
    const previousSeen=+state.marketCoverage?.seen||0;
    const seen=Math.min(total,previousSeen+briefs.length);
    const fresh=await activeMarketSignals(45),priced=fresh.all.length;
    state.marketCoverage={total,seen,priced,active:fresh.active.length,stale:fresh.stale.length,failed:Object.keys(state.marketFailures).length,at:new Date().toISOString(),cursor:state.marketCursor};
    state.marketUniverse={};state.marketScannedIds={};save();
    return fresh.active.sort((a,b)=>b.score-a.score).slice(0,400);
  }
  const wanted=MARKET_NAMES.map(n=>norm(n)),owned=new Set(state.cards.map(c=>c.catalogId).filter(Boolean)),briefs=[];
  for(const b of pool){
    const nm=norm(b.name);
    if(owned.has(b.id)||wanted.some(w=>nm.includes(w)))briefs.push(b);
    if(briefs.length>=100)break;
  }
  for(const c of state.cards)if(c.catalogId&&!briefs.some(b=>b.id===c.catalogId))briefs.unshift({id:c.catalogId,name:c.name});
  const full=await mapLimit(briefs.slice(0,100),4,async b=>tcgdexCard("en",b.id));
  return full.filter(Boolean);
}
async function retryMarketFailures(){
  const btn=document.querySelector("#retryMarketFailures"),st=document.querySelector("#marketScanState"),ids=Object.keys(state.marketFailures||{}).slice(0,80);
  if(!ids.length){st.textContent="No hay fallos pendientes de mercado.";return}
  btn.disabled=true;st.textContent="Reintentando "+ids.length+" consultas fallidas…";
  const rows=await mapLimit(ids,3,async id=>{
    const c=await tcgdexCard("en",id);
    if(c){delete state.marketFailures[id];let s=buildMarketSignal(c);if(!s)await marketSignalDeleteMany([id]);return s}
    state.marketFailures[id]=(state.marketFailures[id]||0)+1;return null
  });
  const good=rows.filter(Boolean);if(good.length)await marketSignalPutMany(good);
  state.marketCoverage.failed=Object.keys(state.marketFailures).length;await refreshMarketFreshness();renderCoverage();renderQA();
  st.textContent=good.length+" recuperadas · "+state.marketCoverage.failed+" fallos pendientes";btn.disabled=false;
}
function renderCoverage(){
  const box=document.querySelector("#coveragePanel");if(!box)return;
  const c=state.marketCoverage||{},total=+c.total||0,seen=+c.seen||0,priced=+c.priced||0,active=+c.active||0,stale=+c.stale||0,failed=+c.failed||0,pct=total?seen/total*100:0;
  box.innerHTML='<div><span>Cartas recorridas</span><b>'+seen+(total?' / '+total:'')+'</b></div>'+
    '<div><span>Con precio guardado</span><b>'+priced+'</b></div>'+
    '<div><span>Radar activo ≤45d</span><b>'+active+'</b></div>'+
    '<div><span>Señales antiguas</span><b class="'+(stale?"warn":"")+'">'+stale+'</b></div>'+
    '<div><span>Cobertura real</span><b>'+pct.toFixed(1)+'%</b></div>'+
    '<div><span>Fallos de consulta</span><b class="'+(failed?"warn":"")+'">'+failed+'</b></div>'+
    '<div class="coverageBar"><i style="width:'+Math.min(100,pct)+'%"></i></div>'+
    '<small>El radar operativo solo usa señales revisadas en los últimos 45 días. Las antiguas se conservan para trazabilidad, pero no entran en decisiones actuales.</small>';
}
function signalLabel(x){
  if(x.score>=78&&x.risk!=="Alto")return "Señal cuantitativa alta";
  if(x.score>=65)return "Señal cuantitativa media";
  if(x.score>=52)return "Señal mixta";
  return "Señal baja";
}
function buildThesis(x){
  const bits=[];
  if(x.momentum7>0.08)bits.push("momentum positivo");
  if(x.discount>0.12)bits.push("descuento frente a tendencia");
  if(x.volatility<0.08)bits.push("precio estable");
  if(x.global)bits.push("referencia EU/US");
  if(!bits.length)bits.push("sin catalizador cuantitativo claro");
  return bits.join(" · ");
}
function snapshotMarketScan(mode){
  const rows=state.marketScan||[];
  if(!rows.length)return;
  const top=[...rows].sort((a,b)=>b.score-a.score).slice(0,10).map(x=>({id:x.id,name:x.name,score:x.score,price:x.price,risk:x.risk}));
  state.marketScanHistory.push({at:new Date().toISOString(),mode,count:rows.length,index:Math.round(median(rows.map(x=>x.score))||0),breadth:Math.round(rows.filter(x=>x.momentum7>0).length/rows.length*100),candidates:rows.filter(x=>decisionFor(x).status==="CANDIDATA").length,top});
  state.marketScanHistory=state.marketScanHistory.slice(-20);
  save();
}
function renderScanHistory(){
  const box=document.querySelector("#scanHistory");if(!box)return;
  const h=[...(state.marketScanHistory||[])].reverse().slice(0,6);
  box.innerHTML=h.length?'<h3>Histórico de mercado</h3>'+h.map(x=>'<div class="scanRow"><span>'+new Date(x.at).toLocaleString("es-ES")+' · '+(x.mode==="wide"?"amplio":"rápido")+'</span><b>Índice '+x.index+' · '+x.breadth+'% positivo · '+(x.candidates??0)+' candidatas · '+x.count+' cartas</b></div>').join(""):"";
}

function scarcitySignal(card){
  if(card.popGrade==null||!card.popSource)return null;
  const pg=Math.max(0,+card.popGrade||0),ph=Math.max(0,+card.popHigher||0),pt=Math.max(pg+ph,+card.popTotal||0);
  if(!pt)return null;
  const gradeShare=pg/pt,higherShare=ph/pt;
  const scarcity=Math.round(clamp(100-(gradeShare*55+higherShare*80),0,100));
  const evidence=card.popUrl&&card.popCheckedAt?"Verificada":"Parcial";
  return {score:scarcity,evidence,source:card.popSource,popGrade:pg,popHigher:ph,popTotal:pt};
}
function portfolioResearchRows(){
  return state.cards.map(c=>({card:c,scarcity:scarcitySignal(c),comps:(c.grading||"RAW")!=="RAW"?marketValueFor(c.name,c.grading,c.grade,c.set||""):null})).filter(x=>x.scarcity||x.comps);
}
function renderPortfolioRisk(){
  const box=document.querySelector("#portfolioRisk");if(!box)return;
  const valued=state.cards.filter(c=>(+c.value||0)>0),sum=valued.reduce((s,c)=>s+(+c.value||0)*qty(c),0);
  if(!sum){box.innerHTML="";return}
  const byName={};for(const c of valued){let k=(c.name||"Sin nombre").split(" ex")[0];byName[k]=(byName[k]||0)+(+c.value||0)*qty(c)}
  const top=Object.entries(byName).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const topShare=top[0]?top[0][1]/sum*100:0;
  const graded=valued.filter(c=>(c.grading||"RAW")!=="RAW").reduce((s,c)=>s+(+c.value||0)*qty(c),0)/sum*100;
  const research=portfolioResearchRows();const evidence=research.filter(x=>x.scarcity?.evidence==="Verificada").length;const notes=rebalanceNotes();box.innerHTML='<h3>Riesgo de cartera</h3><div class="riskGrid"><div><span>Mayor concentración</span><b>'+topShare.toFixed(0)+'%</b></div><div><span>Graduadas</span><b>'+graded.toFixed(0)+'%</b></div></div><div class="riskEvidence"><span>Fichas con población verificada</span><b>'+evidence+'</b></div>'+(notes.length?'<div class="rebalanceNotes">'+notes.map(n=>'<div>'+n+'</div>').join("")+'</div>':'')+'<div class="riskBars">'+top.map(([n,v])=>'<div><span>'+n+'</span><i style="width:'+Math.min(100,v/sum*100)+'%"></i><b>'+((v/sum)*100).toFixed(0)+'%</b></div>').join("")+'</div>';
}
function toggleCompare(id){
  let a=state.compare||[],i=a.indexOf(id);if(i>=0)a.splice(i,1);else if(a.length<3)a.push(id);state.compare=a;save();renderCompare();renderMarketScan();
}
function renderCompare(){
  const box=document.querySelector("#compareTray");if(!box)return;
  const rows=(state.marketScan||[]).filter(x=>(state.compare||[]).includes(x.id));
  if(!rows.length){box.classList.add("hidden");box.innerHTML="";return}
  box.classList.remove("hidden");
  box.innerHTML='<h3>Comparador</h3><div class="compareGrid">'+rows.map(x=>'<div><b>'+x.name+'</b><span>'+euro(x.price)+'</span><small>Señal '+x.score+' · Riesgo '+x.risk+'</small><small>Mom 7/30d '+(x.momentum7>=0?"+":"")+(x.momentum7*100).toFixed(1)+'%</small><small>Descuento '+(x.discount*100).toFixed(1)+'%</small></div>').join("")+'</div>';
}
function ageDays(date){if(!date)return 9999;let t=new Date(date).getTime();return Number.isFinite(t)?Math.max(0,(Date.now()-t)/86400000):9999}
function freshnessLabel(days){return days<=2?"Muy reciente":days<=14?"Reciente":days<=45?"Aceptable":"Antiguo"}
function liquiditySignal(x){
  const spread=(x.low&&x.price)?Math.max(0,(x.price-x.low)/x.price):null;
  const data=[x.avg1,x.avg7,x.avg30,x.low,x.price].filter(v=>v!=null).length;
  let score=35+data*8+(x.global?12:0);
  if(spread!=null)score+=clamp((.35-spread)*70,-10,20);
  return Math.round(clamp(score,0,100));
}
function convictionSignal(x){
  const liq=liquiditySignal(x),fresh=ageDays(x.updated),freshPts=fresh<=2?100:fresh<=14?80:fresh<=45?55:30;
  const sc=x.scarcity?.score??50;
  return Math.round(clamp(x.score*.5+liq*.2+freshPts*.15+sc*.15,0,100));
}
function buyZone(x){
  const floor=x.low||x.avg30||x.price;
  const fair=x.avg30||x.price;
  if(!floor||!fair)return null;
  const low=Math.min(floor,fair*.94),high=Math.min(fair,floor*1.08);
  return {low,high};
}
function renderMarketHealth(rows){
  const box=document.querySelector("#marketHealth");if(!box)return;
  if(!rows.length){box.innerHTML="";return}
  const liq=median(rows.map(liquiditySignal))||0;
  const fresh=rows.filter(x=>ageDays(x.updated)<=14).length/rows.length*100;
  const strong=rows.filter(x=>convictionSignal(x)>=75).length;
  const stale=rows.filter(x=>ageDays(x.updated)>45).length;
  box.innerHTML='<div><span>Liquidez mediana</span><b>'+Math.round(liq)+'/100</b></div><div><span>Datos recientes</span><b>'+fresh.toFixed(0)+'%</b></div><div><span>Convicción ≥75</span><b>'+strong+'</b></div><div><span>Datos antiguos</span><b>'+stale+'</b></div>';
}
async function refreshPortfolioValues(){
  const btn=document.querySelector("#refreshValues"),st=document.querySelector("#marketScanState");btn.disabled=true;let changed=0,checked=0;
  st.textContent="Actualizando valores de tu colección…";
  for(const c of state.cards){
    if(!c.catalogId)continue;checked++;
    try{
      const full=await tcgdexCard("en",c.catalogId);
      if(!full)continue;
      if((c.grading||"RAW")==="RAW"){let p=extractRawPricing(full);if(p){c.value=p.value;c.marketPricing=p;changed++}}
      else{let gv=marketValueFor(c.name,c.grading,c.grade,c.set||"");if(gv){c.value=gv.value;c.gradedValuation={...gv,at:new Date().toISOString()};changed++}}
    }catch{}
  }
  save();render();renderPortfolioRisk();renderReadiness();btn.disabled=false;st.textContent=changed+" valores actualizados de "+checked+" fichas vinculadas.";
}
function evaluateOpportunityAlerts(rows){
  const alerts=[];
  for(const x of rows){
    const zone=buyZone(x),conv=convictionSignal(x),liq=liquiditySignal(x);
    if(conv>=78&&liq>=65&&x.risk!=="Alto"&&zone&&x.price<=zone.high){
      alerts.push({type:"oportunidad",id:x.id,name:x.name,score:x.score,conviction:conv,liquidity:liq,price:x.price,zone,reason:"Convicción alta, liquidez suficiente y precio dentro de zona de compra de referencia"});
    }else if(x.discount>=.18&&liq>=55&&x.risk!=="Alto"){
      alerts.push({type:"descuento",id:x.id,name:x.name,score:x.score,conviction:conv,liquidity:liq,price:x.price,zone,reason:"Descuento relevante frente a tendencia con liquidez aceptable"});
    }
  }
  return alerts.sort((a,b)=>b.conviction-a.conviction).slice(0,8);
}
function renderOpportunityAlerts(rows){
  const box=document.querySelector("#opportunityAlerts");if(!box)return;
  const alerts=evaluateOpportunityAlerts(rows);
  if(!alerts.length){box.innerHTML='<div class="empty">Sin alertas cuantitativas claras en este escaneo.</div>';return}
  box.innerHTML='<h3>Alertas cuantitativas</h3>'+alerts.map(a=>'<article class="alertCard"><div><b>'+a.name+'</b><small>'+a.reason+'</small></div><div class="alertNums"><span>Conv '+a.conviction+'</span><span>Liq '+a.liquidity+'</span><span>'+euro(a.price)+'</span></div></article>').join("");
}
function portfolioAllocation(){
  const rows=state.cards.filter(c=>(+c.value||0)>0),sum=rows.reduce((s,c)=>s+(+c.value||0)*qty(c),0);if(!sum)return[];
  return rows.map(c=>({id:c.id,name:c.name,value:(+c.value||0)*qty(c),share:((+c.value||0)*qty(c))/sum,grading:c.grading||"RAW"})).sort((a,b)=>b.share-a.share);
}
function renderWatchSummary(){
  const box=document.querySelector("#watchSummary");if(!box)return;
  const scan=state.marketScan||[];
  let matched=0,below=0,strong=0;
  for(const w of state.watch){
    const m=scan.find(x=>x.id===w.catalogId||norm(x.name)===norm(w.name));
    if(m){matched++;if(w.target&&m.price<=w.target)below++;if(convictionSignal(m)>=75)strong++}
  }
  box.innerHTML='<div><span>En seguimiento</span><b>'+state.watch.length+'</b></div><div><span>Con mercado</span><b>'+matched+'</b></div><div><span>En objetivo</span><b>'+below+'</b></div><div><span>Convicción ≥75</span><b>'+strong+'</b></div>';
}
function rebalanceNotes(){
  const a=portfolioAllocation(),notes=[];if(!a.length)return notes;
  if(a[0]?.share>=.35)notes.push("Concentración elevada en "+a[0].name+" ("+(a[0].share*100).toFixed(0)+"% del valor).");
  const graded=a.filter(x=>x.grading!=="RAW").reduce((s,x)=>s+x.share,0);
  if(graded>=.8)notes.push("Más del 80% del valor está en cartas graduadas.");
  if(graded<=.15)notes.push("Menos del 15% del valor está en cartas graduadas.");
  return notes;
}
function recordSignalSnapshot(rows){
  const at=new Date().toISOString();
  for(const x of rows){
    state.signalHistory.push({at,id:x.id,name:x.name,price:x.price,score:x.score,conviction:convictionSignal(x),liquidity:liquiditySignal(x),risk:x.risk,analysts:{...(x.analysts||{})}});
  }
  const cutoff=Date.now()-180*86400000;
  state.signalHistory=state.signalHistory.filter(s=>new Date(s.at).getTime()>=cutoff).slice(-5000);
  save();
}
function evaluateSignalPerformance(){
  const h=state.signalHistory||[],latest=state.marketScan||[],latestMap=new Map(latest.map(x=>[x.id,x]));
  const windows=[7,30,90],stats={};
  for(const d of windows){
    const min=Date.now()-(d+3)*86400000,max=Date.now()-(d-3)*86400000;
    const samples=h.filter(s=>{let t=new Date(s.at).getTime();return t>=min&&t<=max&&latestMap.has(s.id)&&s.price>0&&latestMap.get(s.id).price>0});
    const strong=samples.filter(s=>s.conviction>=70);
    const rets=strong.map(s=>(latestMap.get(s.id).price/s.price-1));
    stats[d]={n:strong.length,avg:rets.length?rets.reduce((a,b)=>a+b,0)/rets.length:null,hit:rets.length?rets.filter(r=>r>0).length/rets.length:null};
  }
  return stats;
}
function analystBacktest(){
  const h=state.signalHistory||[],latest=state.marketScan||[],latestMap=new Map(latest.map(x=>[x.id,x]));
  const pairs=h.filter(s=>{let age=ageDays(s.at);return age>=20&&age<=45&&latestMap.has(s.id)&&s.price>0});
  const keys=["momentum","value","stability","global","data","scarcity"],out={};
  for(const k of keys){
    const pts=pairs.filter(p=>p.analysts?.[k]!=null).map(p=>({a:p.analysts[k],r:latestMap.get(p.id).price/p.price-1}));
    if(pts.length<5){out[k]=null;continue}
    const hi=pts.filter(p=>p.a>=60),lo=pts.filter(p=>p.a<60);
    const havg=hi.length?hi.reduce((s,p)=>s+p.r,0)/hi.length:0,lavg=lo.length?lo.reduce((s,p)=>s+p.r,0)/lo.length:0;
    out[k]={n:pts.length,edge:havg-lavg};
  }
  return out;
}
function updateAnalystWeights(){
  const bt=analystBacktest(),base={momentum:.30,value:.22,stability:.18,global:.12,data:.18,scarcity:.12},raw={};
  let sum=0;
  for(const [k,b] of Object.entries(base)){let edge=bt[k]?.edge;let mult=edge==null?1:clamp(1+edge*3,.65,1.45);raw[k]=b*mult;sum+=raw[k]}
  if(sum){for(const k of Object.keys(raw))raw[k]/=sum}
  state.analystWeights=raw;save();return {weights:raw,backtest:bt};
}
function renderSignalPerformance(){
  const box=document.querySelector("#signalPerformance");if(!box)return;
  const perf=evaluateSignalPerformance(),learn=updateAnalystWeights(),labels={momentum:"Momentum",value:"Valor",stability:"Estabilidad",global:"Global",data:"Datos",scarcity:"Escasez"};
  const perfHtml=[7,30,90].map(d=>{let x=perf[d];return '<div><span>'+d+' días</span><b>'+(x?.n?((x.avg>=0?"+":"")+(x.avg*100).toFixed(1)+"%"):"Sin muestra")+'</b><small>'+(x?.n?("acierto "+(x.hit*100).toFixed(0)+"% · "+x.n+" señales"):"")+'</small></div>'}).join("");
  const weights=Object.entries(learn.weights||{}).map(([k,v])=>'<span>'+labels[k]+' '+Math.round(v*100)+'%</span>').join("");
  box.innerHTML='<h3>Rendimiento de señales</h3><div class="performanceGrid">'+perfHtml+'</div><div class="learnedWeights"><b>Pesos aprendidos</b><div>'+weights+'</div><small>Los pesos solo se ajustan cuando existe historial suficiente; no convierten una señal en garantía.</small></div>';
}
function decisionFor(x){
  const conv=convictionSignal(x),liq=liquiditySignal(x),zone=buyZone(x),fresh=ageDays(x.updated),reasons=[];
  let status="OBSERVAR";
  if(conv>=80&&liq>=70&&x.risk!=="Alto"&&fresh<=14&&zone&&x.price<=zone.high){status="CANDIDATA";reasons.push("convicción alta","liquidez suficiente","dato reciente","precio en zona")}
  else{
    if(conv<70)reasons.push("convicción insuficiente");
    if(liq<60)reasons.push("liquidez limitada");
    if(x.risk==="Alto")reasons.push("riesgo alto");
    if(fresh>30)reasons.push("dato antiguo");
    if(zone&&x.price>zone.high)reasons.push("precio fuera de zona");
  }
  return {status,conv,liq,zone,reasons};
}
function renderDecisionBoard(rows){
  const box=document.querySelector("#decisionBoard");if(!box)return;
  const ranked=rows.map(x=>({x,d:decisionFor(x)})).sort((a,b)=>b.d.conv-a.d.conv);
  const candidates=ranked.filter(o=>o.d.status==="CANDIDATA").slice(0,8);
  const observe=ranked.filter(o=>o.d.status==="OBSERVAR").slice(0,5);
  box.innerHTML='<h3>Panel de decisión</h3><p class="muted">Filtro objetivo: ninguna etiqueta implica recomendación ni rentabilidad garantizada.</p>'+
    '<div class="decisionGroup"><b>Candidatas por criterios</b>'+(candidates.length?candidates.map(o=>'<div class="decisionRow"><span>'+o.x.name+'</span><strong>'+euro(o.x.price)+'</strong><small>Conv '+o.d.conv+' · Liq '+o.d.liq+(o.d.zone?' · zona '+euro(o.d.zone.low)+'–'+euro(o.d.zone.high):'')+'</small></div>').join(""):'<div class="empty">Ninguna carta cumple todos los filtros.</div>')+'</div>'+
    '<div class="decisionGroup"><b>En observación</b>'+observe.map(o=>'<div class="decisionRow mutedRow"><span>'+o.x.name+'</span><small>'+o.d.reasons.slice(0,2).join(" · ")+'</small></div>').join("")+'</div>';
}
function renderProvenance(rows){
  const box=document.querySelector("#provenancePanel");if(!box)return;
  if(!rows.length){box.innerHTML="";return}
  let cm=rows.filter(x=>x.price>0).length,us=rows.filter(x=>x.global).length,fresh=rows.filter(x=>ageDays(x.updated)<=14).length,stale=rows.length-fresh;
  box.innerHTML='<h3>Calidad de fuentes</h3><div class="provenanceGrid"><div><span>Cardmarket/TCGdex</span><b>'+cm+'</b></div><div><span>También EEUU</span><b>'+us+'</b></div><div><span>Datos ≤14 días</span><b>'+fresh+'</b></div><div><span>Datos >14 días</span><b>'+stale+'</b></div></div><small>Las señales cuantitativas se calculan solo con los campos disponibles; ausencia de una fuente no se rellena con estimaciones inventadas.</small>';
}
function renderPhotoValidation(){
  const box=document.querySelector("#photoValidationResults");if(!box)return;const v=state.photoValidation||{};
  if(!v.at){box.innerHTML='<p class="muted">Aún no se ha validado el reconocimiento con fotos reales etiquetadas.</p>';return}
  const acc=v.labeledTested?((v.correct||0)/v.labeledTested):0;
  box.innerHTML='<div class="selfTestHeader"><b>Validación real: '+(v.correct||0)+'/'+(v.labeledTested||0)+' correctas</b><span>'+new Date(v.at).toLocaleString("es-ES")+'</span></div>'+
    '<div class="qaRow"><span>Exactitud con verdad conocida</span><b class="'+(acc>=.7&&v.labeledTested>=3?"ok":"warn")+'">'+(acc*100).toFixed(0)+'%</b></div>'+
    '<div class="qaRow"><span>Incorrectas</span><b class="'+((v.incorrect||0)?"warn":"ok")+'">'+(v.incorrect||0)+'</b></div>'+
    '<div class="qaRow"><span>No resueltas</span><b class="'+((v.unresolved||0)?"warn":"ok")+'">'+(v.unresolved||0)+'</b></div>'+
    '<div class="qaRow"><span>Fotos sin etiqueta</span><b>'+(v.unlabeledTested||0)+'</b></div>'+
    '<div class="qaRow"><span>Proceso completado</span><b class="'+(v.completed?"ok":"warn")+'">'+(v.completed?"OK":"FALLO")+'</b></div>'+
    '<small>La exactitud solo cuenta fotos cuyo catalogId ya era conocido antes de la prueba. Resolver una carta desconocida no se contabiliza como acierto.</small>';
}
async function runPhotoValidation(){
  const btn=document.querySelector("#runPhotoValidation"),box=document.querySelector("#photoValidationResults");
  const labeled=state.cards.filter(c=>c.photoKey&&c.catalogId).slice(0,5);
  const unlabeled=state.cards.filter(c=>c.photoKey&&!c.catalogId).slice(0,Math.max(0,5-labeled.length));
  const candidates=[...labeled,...unlabeled];
  if(!candidates.length){box.innerHTML='<p class="muted">No hay fotos guardadas para validar.</p>';return}
  btn.disabled=true;box.innerHTML='<p class="muted">Validando '+candidates.length+' fotos reales sin modificar tu colección…</p>';
  let correct=0,incorrect=0,unresolved=0,labeledTested=0,unlabeledTested=0,unlabeledResolved=0,completed=true,details=[];
  for(const c of candidates){
    try{
      const blob=await photoGet(c.photoKey);if(!blob)continue;
      const expected=c.catalogId||"";
      if(expected)labeledTested++;else unlabeledTested++;
      const r=await Promise.race([analyzeCardFile(blob),timeoutAfter(22000)]);
      const fresh=cardFromRecognition("__validation__",blob,r);
      if(expected){
        if(fresh.draft||!fresh.catalogId){unresolved++;details.push({id:c.id,result:"unresolved"})}
        else if(fresh.catalogId===expected){correct++;details.push({id:c.id,result:"correct",catalogId:fresh.catalogId})}
        else{incorrect++;details.push({id:c.id,result:"incorrect",expected,got:fresh.catalogId})}
      }else{
        if(!fresh.draft&&fresh.catalogId)unlabeledResolved++;
        details.push({id:c.id,result:!fresh.draft&&fresh.catalogId?"resolved-unlabeled":"unresolved-unlabeled",got:fresh.catalogId||""});
      }
      if(fresh.photoURL)try{URL.revokeObjectURL(fresh.photoURL)}catch{}
    }catch{completed=false;details.push({id:c.id,result:"error"})}
    await new Promise(r=>setTimeout(r,120));
  }
  const accuracy=labeledTested?correct/labeledTested:0;
  const resolution=unlabeledTested?unlabeledResolved/unlabeledTested:0;
  state.photoValidation={at:new Date().toISOString(),labeledTested,correct,incorrect,unresolved,accuracy,unlabeledTested,unlabeledResolved,resolution,completed,details:details.slice(-10)};
  save();renderPhotoValidation();renderReadiness();renderQA();btn.disabled=false;
}
function readinessScore(){
  const photos=state.cards.filter(c=>c.photoKey),identified=photos.filter(c=>!c.draft&&c.recognition?.score>0);
  const scan=state.marketScan||[],signals=state.signalHistory||[],graded=state.market.filter(m=>m.kind==="sold"&&(m.grading||"RAW")!=="RAW"),pop=state.cards.filter(c=>c.popGrade!=null&&c.popSource&&c.popUrl&&c.popCheckedAt);
  const checks=[
    {k:"code",ok:(state.selfTest?.pass||0)>=7,label:"Autotest técnico ≥7/8"},
    {k:"market",ok:scan.length>=20,label:"Market Lab con datos"},{k:"coverage",ok:(state.marketCoverage?.seen||0)>=120,label:"Cobertura acumulada ≥120 cartas"},{k:"freshmarket",ok:(state.marketCoverage?.active||0)>=40,label:"Radar activo ≥40 cartas"},
    {k:"recognition",ok:(state.photoValidation?.labeledTested||0)>=3&&(state.photoValidation?.accuracy||0)>=.7&&state.photoValidation?.completed===true,label:"Exactitud real ≥70% (≥3 fotos etiquetadas)"},
    {k:"history",ok:signals.length>=50,label:"Histórico ≥50 señales"},
    {k:"graded",ok:graded.length>=4,label:"Comparables graduadas ≥4"},
    {k:"population",ok:pop.length>=1,label:"Población verificada"},
    {k:"backup",ok:(state.selfTest?.results||[]).some(x=>x.label==="Backup serializable"&&x.ok)&&(state.selfTest?.results||[]).some(x=>x.label==="IndexedDB radar"&&x.ok),label:"Backup + radar local"},{k:"integrity",ok:stateIntegrityReport().ok,label:"Integridad de datos local"},{k:"evidence",ok:marketEvidenceQuality().score>=60,label:"Evidencia de mercado ≥60/100"}
  ];
  return {checks,score:Math.round(checks.filter(x=>x.ok).length/checks.length*100),identified:identified.length,photos:photos.length};
}
function readinessBlockers(){
  const r=readinessScore();return r.checks.filter(c=>!c.ok).map(c=>{
    if(c.k==="market")return "Haz un escaneo de mercado.";if(c.k==="coverage")return "Haz al menos un escaneo amplio para iniciar la cobertura acumulada.";if(c.k==="freshmarket")return "Actualiza el radar hasta tener al menos 40 cartas revisadas en los últimos 45 días.";
    if(c.k==="recognition")return "Necesitas al menos 3 fotos con catalogId conocido y ≥70% de aciertos exactos.";
    if(c.k==="history")return "Acumula al menos 50 señales reales con escaneos.";
    if(c.k==="graded")return "Añade al menos 4 ventas cerradas comparables de cartas graduadas.";
    if(c.k==="population")return "Verifica población oficial de al menos una carta graduada.";
    if(c.k==="code")return "Ejecuta el autotest técnico y supera al menos 7 de 8 pruebas.";
    if(c.k==="backup")return "Ejecuta el autotest para verificar el backup.";if(c.k==="integrity")return "Pulsa «Revisar y reparar» en Integridad local.";if(c.k==="evidence")return "Añade más ventas cerradas con fecha, moneda y URL de evidencia hasta alcanzar 60/100.";
    return c.label;
  })
}
function renderCertification(){
  const box=document.querySelector("#certificationResults");if(!box)return;const c=state.certification||{},r=readinessScore(),blocks=readinessBlockers();
  const dq=dataQualityScore();let head='<div class="certScore '+(r.score===100?"complete":"")+'">'+r.score+'%</div><div class="certSub">Calidad global '+dq.score+'%</div>';
  if(c.at)head+='<small>Última comprobación: '+new Date(c.at).toLocaleString("es-ES")+'</small>';
  box.innerHTML=head+(blocks.length?'<div class="blockers"><b>Para llegar al 100%:</b>'+blocks.map(x=>'<div>• '+x+'</div>').join("")+'</div>':'<div class="certDone">✅ Todos los criterios de V44 están superados.</div>');
}
async function runCertification(){
  const btn=document.querySelector("#runCertification");btn.disabled=true;btn.textContent="Comprobando…";repairStateIntegrity();renderIntegrity();
  try{await runSelfTest()}catch{}
  try{if(state.cards.filter(c=>c.photoKey&&c.catalogId).length>=3)await runPhotoValidation()}catch{}
  try{if((state.marketScan||[]).length<20)await runMarketScan("quick")}catch{}
  try{await refreshPortfolioValues()}catch{}
  state.certification={at:new Date().toISOString(),score:readinessScore().score,quality:dataQualityScore().score,marketEvidence:marketEvidenceQuality().score,blockers:readinessBlockers()};save();renderCertification();renderReadiness();renderQA();
  btn.disabled=false;btn.textContent="Comprobar todo";
}
function renderReadiness(){
  const box=document.querySelector("#readinessPanel");if(!box)return;const r=readinessScore();
  const blocks=readinessBlockers();box.innerHTML='<h3>Preparación para uso real</h3><div class="readinessScore">'+r.score+'%</div>'+r.checks.map(c=>'<div class="qaRow"><span>'+c.label+'</span><b class="'+(c.ok?'ok':'warn')+'">'+(c.ok?'OK':'Pendiente')+'</b></div>').join("")+(blocks.length?'<div class="nextBlocker"><b>Siguiente bloqueo</b><span>'+blocks[0]+'</span></div>':'<div class="certDone">✅ Lista para el hito V44.</div>')+'<small>El 100% solo aparece cuando todas las comprobaciones objetivas están cumplidas.</small>';
}
function renderMarketScan(){
  renderPortfolioRisk();renderCompare();
  const box=document.querySelector("#marketLeaders");if(!box)return;
  const rows=[...(state.marketScan||[])].sort((a,b)=>b.score-a.score);renderCoverage();renderMarketIndex(rows);renderMarketHealth(rows);renderOpportunityAlerts(rows);renderDecisionBoard(rows);renderProvenance(rows);renderSignalPerformance();
  if(!rows.length){box.innerHTML='<div class="empty">Pulsa «Escanear mercado» para crear el primer radar cuantitativo.</div>';return}
  box.innerHTML='<div class="marketGrid">'+rows.slice(0,20).map((x,i)=>'<article class="marketAsset">'+(x.image?'<img src="'+x.image+'" alt="">':'')+'<div class="assetBody"><div class="assetTop"><b>#'+(i+1)+' '+x.name+'</b><span class="signal '+(x.score>=75?'hot':x.score>=60?'warm':'')+'">'+x.score+'</span></div><div class="signalLabel">'+signalLabel(x)+'</div><small>'+x.set+(x.rarity?' · '+x.rarity:'')+'</small><div class="assetMetrics"><span>Mercado <b>'+euro(x.price)+'</b></span><span>Riesgo <b>'+x.risk+'</b></span><span>Liquidez <b>'+liquiditySignal(x)+'/100</b></span><span>Convicción <b>'+convictionSignal(x)+'/100</b></span><span>1d <b class="'+(x.momentum1>=0?'up':'down')+'">'+(x.momentum1>=0?'+':'')+(x.momentum1*100).toFixed(1)+'%</b></span><span>7/30d <b class="'+(x.momentum7>=0?'up':'down')+'">'+(x.momentum7>=0?'+':'')+(x.momentum7*100).toFixed(1)+'%</b></span></div><div class="analystStrip"><span>Mom '+(x.analysts?.momentum??0)+'</span><span>Valor '+(x.analysts?.value??0)+'</span><span>Estab '+(x.analysts?.stability??0)+'</span><span>Global '+(x.analysts?.global??0)+'</span><span>Datos '+(x.analysts?.data??0)+'</span>'+(x.analysts?.scarcity!=null?'<span>Escasez '+x.analysts.scarcity+'</span>':'')+'</div><div class="thesis">'+buildThesis(x)+'. Datos: '+freshnessLabel(ageDays(x.updated))+' · '+(buyZone(x)?('zona de compra basada en referencias '+euro(buyZone(x).low)+'–'+euro(buyZone(x).high)+'. '):'')+'Escenario 12m: '+euro(x.scenario12)+' (no es predicción).</div><div class="marketActions"><button class="watchFromMarket" data-watchid="'+x.id+'">Seguir</button><button class="compareMarket" data-compareid="'+x.id+'">'+((state.compare||[]).includes(x.id)?"✓ Comparando":"Comparar")+'</button></div></div></article>').join("")+'</div>';
}
async function continueCoverage(blocks=5){
  const btn=document.querySelector("#continueCoverage"),st=document.querySelector("#marketScanState");
  btn.disabled=true;document.querySelector("#deepScanMarket").disabled=true;
  let completed=0;
  try{
    for(let i=0;i<blocks;i++){
      st.textContent="Cobertura "+(i+1)+"/"+blocks+" · consultando siguiente bloque…";
      await fetchMarketUniverse("wide");
      completed++;
      renderCoverage();
      await new Promise(r=>setTimeout(r,180));
    }
    const signals=(await activeMarketSignals(45)).active.sort((a,b)=>b.score-a.score).slice(0,400);
    state.marketScan=signals;state.marketScanAt=new Date().toISOString();state.marketScanMode="wide";
    recordSignalSnapshot(signals);
    const alerts=evaluateOpportunityAlerts(signals);
    state.alertHistory.push({at:state.marketScanAt,count:alerts.length,ids:alerts.map(a=>a.id)});
    state.alertHistory=state.alertHistory.slice(-30);save();renderMarketScan();snapshotMarketScan("wide");renderScanHistory();renderWatchSummary();renderQA();renderReadiness();
    st.textContent=completed+" bloques completados · "+(state.marketCoverage?.seen||0)+" cartas recorridas";
  }catch(e){st.textContent="Cobertura interrumpida tras "+completed+" bloques. Puedes continuar después."}
  btn.disabled=false;document.querySelector("#deepScanMarket").disabled=false;
}
async function runMarketScan(mode="quick"){
  const btn=mode==="wide"?document.querySelector("#deepScanMarket"):document.querySelector("#scanMarket"),st=document.querySelector("#marketScanState");
  btn.disabled=true;st.textContent=mode==="wide"?"Preparando escaneo amplio…":"Construyendo universo…";
  try{
    const cards=await fetchMarketUniverse(mode);st.textContent="Analizando "+cards.length+" cartas…";renderCoverage();
    const signals=cards.map(buildMarketSignal).filter(Boolean);
    state.marketScan=signals;state.marketScanAt=new Date().toISOString();state.marketScanMode=mode;recordSignalSnapshot(signals);const alerts=evaluateOpportunityAlerts(signals);state.alertHistory.push({at:state.marketScanAt,count:alerts.length,ids:alerts.map(a=>a.id)});state.alertHistory=state.alertHistory.slice(-30);save();renderMarketScan();snapshotMarketScan(mode);renderScanHistory();renderWatchSummary();
    st.textContent=signals.length+" cartas analizadas"+(mode==="wide"&&state.marketCoverage?.total?" · cobertura "+((state.marketCoverage.seen/state.marketCoverage.total)*100).toFixed(1)+"%":"")+" · "+new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});renderQA();renderReadiness();
  }catch(e){st.textContent="No se pudo completar el escaneo. Inténtalo de nuevo."}
  btn.disabled=false;
}

function extractRawPricing(c){
  const p=c?.pricing?.cardmarket;if(!p)return null;
  const candidates=[p.trend,p.avg7,p.avg30,p.avg1,p.avg].map(Number).filter(n=>Number.isFinite(n)&&n>0);
  if(!candidates.length)return null;
  const value=candidates[0];
  return {value,source:"Cardmarket vía TCGdex",updated:p.updated||c.pricing?.cardmarket?.updated||"",low:+p.low||null,avg7:+p.avg7||null,avg30:+p.avg30||null};
}
function applyCatalogPricing(card,c){
  const price=extractRawPricing(c);
  if(card.grading==="RAW"&&price){
    card.value=price.value;
    card.marketPricing=price;
  }
  return card;
}
function showMarketHint(card){
  const box=document.querySelector("#marketHint");if(!box)return;
  if(card?.marketPricing){
    const p=card.marketPricing;
    box.innerHTML="<b>Referencia RAW</b><span>"+euro(p.value)+" · "+p.source+(p.avg7?" · media 7d "+euro(p.avg7):"")+(p.avg30?" · media 30d "+euro(p.avg30):"")+"</span>";
    box.classList.remove("hidden");
  }else{
    box.classList.add("hidden");box.innerHTML="";
  }
}
function updateQueueUI(){
  const box=document.querySelector("#queueStatus");if(!box)return;
  if(!recognitionQueue.length&&!queueRunning){box.classList.add("hidden");box.textContent="";return}
  box.classList.remove("hidden");box.textContent=queueRunning?"Identificación en curso · "+recognitionQueue.length+" pendientes":"Pendientes de identificar: "+recognitionQueue.length;
}
async function processRecognitionQueue(){
  if(queueRunning)return;queueRunning=true;updateQueueUI();
  while(recognitionQueue.length){
    const job=recognitionQueue.shift();updateQueueUI();
    try{await recognizeSavedCard(job.card,job.blob)}catch{}
    await new Promise(r=>setTimeout(r,150));
  }
  queueRunning=false;updateQueueUI();
}
function enqueueRecognition(card,blob){
  recognitionQueue.push({card,blob});updateQueueUI();setTimeout(processRecognitionQueue,50);
}

async function findCardMeta(g){
  if(!g.number)return[];
  const front=normNum(g.number.split("/")[0]);
  const langs=["es","en"];
  let out=[];
  for(const lang of langs){
    const list=await Promise.race([tcgdexList(lang),timeoutAfter(6000)]).catch(()=>[]);
    const hits=(list||[]).filter(c=>normNum(c.localId)===front).slice(0,16);
    for(const h of hits){
      const full=await Promise.race([tcgdexCard(lang,h.id),timeoutAfter(4000)]).catch(()=>null);
      if(full){
        full._lang=lang;
        full.printed_number=full.localId||h.localId||"";
        full.expansion=full.set||full.expansion||{};
        if(!full.images&&full.image)full.images=[{small:full.image+"/low.webp",medium:full.image+"/high.webp",large:full.image+"/high.webp"}];
        out.push(full);
      }
    }
    if(out.length===1)break;
  }
  return out;
}
function norm(s){return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim()}
function tokenScore(a,b){let A=new Set(norm(a).split(" ").filter(Boolean)),B=new Set(norm(b).split(" ").filter(Boolean));if(!A.size||!B.size)return 0;let hit=[...A].filter(x=>B.has(x)).length;return hit/Math.max(A.size,B.size)}
function candidateScore(c,g){
  const printed=String(c.printed_number||"").replace(/\s/g,"").toLowerCase();
  const num=String(c.number||"").replace(/\s/g,"").replace(/^0+/,"").toLowerCase();
  const gn=String(g.number||"").replace(/\s/g,"").toLowerCase();
  if(!gn)return 0;
  if(printed===gn)return 100;
  const front=gn.split("/")[0].replace(/^0+/,"");
  if(num===front)return 55;
  return 0;
}
function bestCandidate(found,g){
  return (found||[]).map(c=>({c,score:candidateScore(c,g)})).sort((a,b)=>b.score-a.score)[0]||null
}
function marketValueFor(name,grading,grade,setName=""){
  const all=state.market.filter(m=>m.kind==="sold"&&norm(m.name)===norm(name)&&String(m.grading||"")===String(grading||"")&&String(m.grade||"")===String(grade||""));
  const excludedCurrency=all.filter(m=>(m.currency||"EUR").toUpperCase()!=="EUR").length;
  let sold=all.filter(m=>(m.currency||"EUR").toUpperCase()==="EUR").filter(m=>!setName||!m.set||norm(m.set)===norm(setName)).map(m=>({...m,price:+m.price})).filter(m=>m.price>0);
  if(sold.length<2)return null;
  const now=Date.now(),weighted=[];
  for(const m of sold){
    let age=(now-new Date(m.soldDate||m.at||now).getTime())/86400000;
    let w=age<=30?4:age<=90?3:age<=180?2:1;
    for(let i=0;i<w;i++)weighted.push(m.price);
  }
  weighted.sort((a,b)=>a-b);
  const q1=weighted[Math.floor(weighted.length*.25)],q3=weighted[Math.floor(weighted.length*.75)],iqr=q3-q1;
  let clean=weighted.filter(v=>v>=q1-1.5*iqr&&v<=q3+1.5*iqr);if(!clean.length)clean=weighted;
  const mid=Math.floor(clean.length/2),med=clean.length%2?clean[mid]:(clean[mid-1]+clean[mid])/2;
  const recent30=sold.filter(m=>(now-new Date(m.soldDate||m.at||now).getTime())/86400000<=30).length;
  const recent90=sold.filter(m=>(now-new Date(m.soldDate||m.at||now).getTime())/86400000<=90).length;
  const dispersion=med?iqr/med:1;
  const liquidity=Math.round(clamp(recent30*15+recent90*7+sold.length*3-dispersion*25,0,100));
  return {value:med,count:sold.length,recent:recent90,recent30,dispersion,liquidity,excludedCurrency,confidence:sold.length>=8&&recent90>=3&&dispersion<=.35?"Alta":sold.length>=4&&dispersion<=.6?"Media":"Baja"};
}
function imageCropBlob(file,region="full",max=900,quality=.78){
  return new Promise((ok,no)=>{let im=new Image(),r=new FileReader();r.onload=()=>im.src=r.result;r.onerror=no;im.onload=()=>{
    let x=0,y=0,cw=im.width,ch=im.height;
    if(region==="bottom"){x=im.width*.03;y=im.height*.60;cw=im.width*.94;ch=im.height*.38}
    if(region==="label"){x=im.width*.05;y=0;cw=im.width*.90;ch=im.height*.28}
    let scale=Math.min(1,max/cw),cv=document.createElement("canvas");cv.width=Math.max(1,Math.round(cw*scale));cv.height=Math.max(1,Math.round(ch*scale));
    let g=cv.getContext("2d");g.drawImage(im,x,y,cw,ch,0,0,cv.width,cv.height);
    if(region!=="full"){
      let d=g.getImageData(0,0,cv.width,cv.height),p=d.data;
      for(let i=0;i<p.length;i+=4){let v=.299*p[i]+.587*p[i+1]+.114*p[i+2];v=v>145?255:v<105?0:v;p[i]=p[i+1]=p[i+2]=v}
      g.putImageData(d,0,0);
    }
    cv.toBlob(b=>b?ok(b):no(new Error("No blob")),"image/jpeg",quality)
  };r.readAsDataURL(file)})
}
function timeoutAfter(ms){return new Promise((_,no)=>setTimeout(()=>no(new Error("timeout")),ms))}
function extractNumberCandidates(text){
  const raw=String(text||"").replace(/[Oo]/g,"0");
  const out=[];
  for(const m of raw.matchAll(/\b(\d{1,3})\s*[\/|\\-]\s*(\d{2,3})\b/g))out.push(m[1]+"/"+m[2]);
  for(const m of raw.matchAll(/\b(\d{1,3})\s+(\d{2,3})\b/g)){let a=+m[1],b=+m[2];if(a<=b+80)out.push(m[1]+"/"+m[2])}
  return [...new Set(out)].slice(0,6);
}
function ocrNameTokens(text){
  return [...new Set(String(text||"").toLowerCase().match(/[a-záéíóúñ]{4,}/gi)||[])].filter(x=>!["pokemon","basic","stage","trainer","energy","damage","weakness","resistance","retreat"].includes(x)).slice(0,12);
}
function candidateTextScore(c,tokens){
  if(!tokens?.length)return 0;let hay=(c.name+" "+(c.set?.name||"")).toLowerCase(),s=0;
  for(const t of tokens)if(hay.includes(t))s+=8;
  return s;
}
async function detectSlabCode(file){
  if(!("BarcodeDetector" in window))return null;
  try{
    const formats=await BarcodeDetector.getSupportedFormats();
    const wanted=["code_128","qr_code","data_matrix","ean_13"].filter(x=>formats.includes(x));
    if(!wanted.length)return null;
    const bd=new BarcodeDetector({formats:wanted}),bmp=await createImageBitmap(file);
    const codes=await Promise.race([bd.detect(bmp),timeoutAfter(3500)]);bmp.close?.();
    for(const c of codes||[]){const raw=String(c.rawValue||"").trim(),m=raw.match(/\b\d{7,10}\b/);if(m)return {cert:m[0],format:c.format||"",raw}}
  }catch{} return null;
}
async function imageQuality(file){
  return new Promise((ok,no)=>{let im=new Image(),r=new FileReader();r.onload=()=>im.src=r.result;r.onerror=no;im.onload=()=>{
    let cv=document.createElement("canvas"),s=Math.min(1,320/im.width);cv.width=Math.max(1,Math.round(im.width*s));cv.height=Math.max(1,Math.round(im.height*s));
    let g=cv.getContext("2d");g.drawImage(im,0,0,cv.width,cv.height);let d=g.getImageData(0,0,cv.width,cv.height).data,lum=0,lum2=0,edges=0,n=0,prev=null;
    for(let y=0;y<cv.height;y+=2)for(let x=0;x<cv.width;x+=2){let i=(y*cv.width+x)*4,v=.299*d[i]+.587*d[i+1]+.114*d[i+2];lum+=v;lum2+=v*v;n++;if(prev!=null)edges+=Math.abs(v-prev);prev=v}
    let mean=lum/Math.max(1,n),variance=Math.max(0,lum2/Math.max(1,n)-mean*mean),contrast=Math.sqrt(variance),sharp=edges/Math.max(1,n),score=Math.round(clamp(35+contrast*.7+sharp*.7-(mean<55||mean>225?20:0),0,100));
    ok({score,brightness:mean,contrast,sharpness:sharp,width:im.width,height:im.height});
  };r.readAsDataURL(file)})
}
function showPhotoQuality(q){
  const box=document.querySelector("#photoQuality");if(!box)return;if(!q){box.classList.add("hidden");box.innerHTML="";return}
  let label=q.score>=75?"Buena":q.score>=55?"Aceptable":"Mejorable";
  box.classList.remove("hidden");box.innerHTML="<b>Calidad de foto: "+label+" · "+q.score+"/100</b><span>"+(q.score<55?"Acerca la carta, evita reflejos y mantenla recta.":"Suficiente para intentar reconocimiento automático.")+"</span>";
}
function renderBatchStatus(){
  const box=document.querySelector("#batchStatus");if(!box)return;let withPhoto=state.cards.filter(c=>c.photoKey),pending=withPhoto.filter(c=>c.draft),good=withPhoto.filter(c=>(c.recognition?.quality?.score||0)>=55),codes=withPhoto.filter(c=>c.recognition?.barcode?.cert);
  box.innerHTML="<h3>Calidad de entrada</h3><div class=\"qaRow\"><span>Fotos guardadas</span><b>"+withPhoto.length+"</b></div><div class=\"qaRow\"><span>Calidad ≥55</span><b>"+good.length+"</b></div><div class=\"qaRow\"><span>Códigos slab leídos</span><b>"+codes.length+"</b></div><div class=\"qaRow\"><span>Pendientes</span><b class=\""+(pending.length?"warn":"ok")+"\">"+pending.length+"</b></div>";
}
async function blobFingerprint(blob){
  return new Promise((ok,no)=>{let im=new Image(),u=URL.createObjectURL(blob);im.onload=()=>{try{
    let cv=document.createElement("canvas");cv.width=24;cv.height=34;let g=cv.getContext("2d");g.drawImage(im,0,0,24,34);let d=g.getImageData(0,0,24,34).data,arr=[];
    for(let i=0;i<d.length;i+=4)arr.push(Math.round((.299*d[i]+.587*d[i+1]+.114*d[i+2])/16));
    URL.revokeObjectURL(u);ok(arr)
  }catch(e){URL.revokeObjectURL(u);no(e)}};im.onerror=e=>{URL.revokeObjectURL(u);no(e)};im.src=u})
}
function fingerprintScore(a,b){if(!a||!b||a.length!==b.length)return 0;let diff=0;for(let i=0;i<a.length;i++)diff+=Math.abs(a[i]-b[i]);return Math.round(clamp(100-diff/(a.length*15)*100,0,100))}
async function candidateImageBlob(c){
  let u=c.image?c.image+"/low.webp":(c.images?.[0]?.small||c.images?.[0]?.medium||"");if(!u)return null;
  try{let r=await Promise.race([fetch(u,{mode:"cors"}),timeoutAfter(4500)]);if(!r.ok)return null;return await r.blob()}catch{return null}
}
async function visualMatchCandidates(file,candidates){
  if(!candidates?.length)return [];let source;try{source=await imageCropBlob(file,"full",520,.70)}catch{return candidates.map(c=>({c,visual:0}))}
  let sf;try{sf=await blobFingerprint(source)}catch{return candidates.map(c=>({c,visual:0}))}
  const rows=await mapLimit(candidates.slice(0,8),3,async c=>{const b=await candidateImageBlob(c);if(!b)return {c,visual:0};try{return {c,visual:fingerprintScore(sf,await blobFingerprint(b))}}catch{return {c,visual:0}}});
  return rows.filter(Boolean).sort((a,b)=>b.visual-a.visual);
}
async function analyzeCardFile(file){
  const [barcode,quality]=await Promise.all([detectSlabCode(file),imageQuality(file).catch(()=>null)]);
  if(!window.Tesseract)throw new Error("OCR no disponible");
  const passes=[["bottom",650,6500],["full",850,8500],["label",700,6500]];
  let texts=[],numbers=[],gBest=null;
  for(const [region,max,ms] of passes){
    try{
      const blob=await imageCropBlob(file,region,max,.74);
      const res=await Promise.race([Tesseract.recognize(blob,"eng"),timeoutAfter(ms)]);
      const text=res?.data?.text||"";texts.push(text);numbers.push(...extractNumberCandidates(text));
      const g=guessFromOCR(text);if(!gBest||(!gBest.number&&g.number)||(!gBest.cert&&g.cert))gBest={...(gBest||{}),...g};
      if(numbers.length&&region==="bottom")break;
    }catch{}
  }
  const mergedText=texts.join("\n"),allNumbers=[...new Set(numbers)];
  let g={...(gBest||guessFromOCR(mergedText))};if(allNumbers[0])g.number=allNumbers[0];if(barcode?.cert){g.cert=barcode.cert;if(g.grading==="RAW")g.grading="PSA"}
  const tokens=ocrNameTokens(mergedText);
  let found=[];
  for(const n of allNumbers.length?allNumbers:[g.number].filter(Boolean)){
    const x=await Promise.race([findCardMeta({...g,number:n}),timeoutAfter(7000)]).catch(()=>[]);
    found.push(...x);
  }
  const uniq=[];const seen=new Set();for(const c of found){if(c?.id&&!seen.has(c.id)){seen.add(c.id);uniq.push(c)}}
  uniq.sort((a,b)=>candidateTextScore(b,tokens)-candidateTextScore(a,tokens));
  let visual=[];if(uniq.length>1)visual=await visualMatchCandidates(file,uniq);if(visual.length){uniq.sort((a,b)=>(visual.find(v=>v.c.id===b.id)?.visual||0)-(visual.find(v=>v.c.id===a.id)?.visual||0))}const best=uniq[0]||null;
  return {g,found:uniq,best,debug:{passes:texts.length,numbers:allNumbers,tokens,barcode,quality,visual:visual.map(v=>({id:v.c.id,score:v.visual}))}};
}
function cardFromRecognition(id,blob,r){
  const g=r.g||{}, exact=(r.found||[]).filter(c=>normNum(c.localId||c.printed_number||c.number)===normNum((g.number||"").split("/")[0]));
  const ranked=(r.found||[]),top=ranked[0],second=ranked[1],topScore=top?candidateTextScore(top,r.debug?.tokens||[]):0,secondScore=second?candidateTextScore(second,r.debug?.tokens||[]):0,visTop=r.debug?.visual?.find(v=>v.id===top?.id)?.score||0,visSecond=r.debug?.visual?.find(v=>v.id===second?.id)?.score||0;const c=exact.length===1?exact[0]:(top&&((topScore>=16&&topScore-secondScore>=8)||(visTop>=72&&visTop-visSecond>=8))?top:null), confident=!!c, img=c?.images?.[0], name=confident?(c.name||"Carta identificada"):"Carta por identificar",grading=g.grading||"RAW",grade=g.grade||"";
  const mv=confident?marketValueFor(name,grading,grade,""):null;
  let result={id,name,set:confident?(c.set?.name||c.expansion?.name||""):"",number:confident?(c.localId||c.printed_number||c.number||g.number||""):(g.number||""),year:confident?String(c.set?.releaseDate||c.expansion?.release_date||c.expansion?.releaseDate||g.year||"").slice(0,4):(g.year||""),language:confident?(c._lang==="es"?"Español":c._lang==="en"?"Inglés":(c.language_code||c.language||g.language||"")):(g.language||""),grading,grade,cert:g.cert||"",value:mv?.value||0,valueEvidence:mv?.count||0,purchase:null,quantity:1,purchaseDate:"",catalogId:confident?(c.id||""):"",referenceImage:img?(img.large||img.medium||img.small||""):"",photoKey:id,photoURL:URL.createObjectURL(blob),icon:"🃏",draft:!confident,recognition:{score:confident?(exact.length===1?100:(visTop>=72?92:88)):0,source:confident?(exact.length===1?"collector-number":visTop>=72?"collector-number+visual":"collector-number+name-tokens"):"pending",passes:r.debug?.passes||0,candidates:(r.found||[]).length,visualScore:visTop||0,barcode:r.debug?.barcode||null,quality:r.debug?.quality||null,at:new Date().toISOString()},createdAt:new Date().toISOString()};if(confident)applyCatalogPricing(result,c);return result
}
async function recognizeSavedCard(card,file){
  try{
    const r=await analyzeCardFile(file),fresh=cardFromRecognition(card.id,file,r);
    if(!fresh.draft){
      const keep={purchase:card.purchase,quantity:card.quantity||1,purchaseDate:card.purchaseDate||"",notes:card.notes||"",photoKey:card.photoKey,photoURL:card.photoURL};
      Object.assign(card,fresh,keep);save();render();return true;
    }
    card.number=r.g?.number||card.number||"";card.recognition=fresh.recognition;save();render();return false;
  }catch{
    card.recognition={score:0,source:"timeout-or-error",at:new Date().toISOString()};save();render();return false;
  }
}

function applyCandidate(c,g={}){
  if(!c)return;
  form.elements.name.value=c.name||g.name||"";form.dataset.catalogId=c.id||"";
  form.elements.number.value=c.number||g.number||"";
  form.elements.year.value=(c.set?.releaseDate||c.expansion?.release_date||c.expansion?.releaseDate||g.year||"").toString().slice(0,4);
  form.elements.set.value=c.set?.name||c.expansion?.name||"";
  form.elements.language.value=c._lang==="es"?"Español":c._lang==="en"?"Inglés":(c.language_code||c.language||g.language||"");
  if(g.grading)form.elements.grading.value=g.grading;
  if(g.grade)form.elements.grade.value=g.grade;
  if(g.cert)form.elements.cert.value=g.cert;
  const img=(c.images||[])[0]; if(img) form.dataset.referenceImage=img.large||img.medium||img.small||""; else if(c.image) form.dataset.referenceImage=c.image+"/high.webp";const rp=extractRawPricing(c);if(form.elements.grading.value==="RAW"&&rp){form.elements.value.value=rp.value;form.dataset.marketPricing=JSON.stringify(rp);showMarketHint({marketPricing:rp})}else{delete form.dataset.marketPricing;showMarketHint(null)}
}
async function scanCardFile(file){
  const st=document.querySelector("#scanStatus"),box=document.querySelector("#autoMatch");
  st.textContent="Leyendo número de colección, grado y certificado…";box.classList.add("hidden");box.innerHTML="";
  try{
    const r=await analyzeCardFile(file),g=r.g,exact=r.found.filter(c=>normNum(c.localId||c.printed_number||c.number)===normNum((g.number||"").split("/")[0]));
    if(form.elements.grading)form.elements.grading.value=g.grading;
    for(const k of ["number","year","language","cert","grade"])if(g[k]&&form.elements[k])form.elements[k].value=g[k];
    if(exact.length===1){
      applyCandidate(exact[0],g);form.dataset.recognitionScore=100;
      st.textContent="✅ Identificación exacta por número "+g.number+". Revisa y guarda.";return;
    }
    const choices=exact.length?exact:r.found;
    if(choices.length){
      st.textContent=(g.number?"Número leído: "+g.number+". ":"")+"Elige la imagen correcta:";
      box.innerHTML=choices.slice(0,8).map((c,i)=>{let im=c.images?.[0]?.small||c.images?.[0]?.medium||"";return '<button type="button" class="candidateCard" data-match="'+i+'">'+(im?'<img src="'+im+'" alt="">':'')+'<span><b>'+(c.name||"Carta")+'</b><small>'+(c.printed_number||c.number||"")+' · '+(c.expansion?.name||"")+'</small></span></button>'}).join("");
      box.classList.remove("hidden");
      box.querySelectorAll("[data-match]").forEach(b=>b.onclick=()=>{applyCandidate(choices[+b.dataset.match],g);form.dataset.recognitionScore=exact.length?95:80;box.classList.add("hidden");st.textContent="✅ Carta seleccionada. Pulsa «Guardar carta»."});
      return;
    }
    form.elements.name.value="";
    st.textContent=g.number?"⚠️ He leído "+g.number+", pero no encontré una coincidencia en el catálogo.":"⚠️ No he podido leer el número de colección. Usa una foto más cercana y recta del frontal.";
  }catch(e){st.textContent="⚠️ El reconocimiento no ha podido completarse. Prueba otra foto frontal."}
}

const dlg=document.querySelector("#cardDialog"),form=document.querySelector("#cardForm"),del=document.querySelector("#deleteCard");document.querySelector("#cardPhoto").onchange=async e=>{let f=e.target.files?.[0];if(f){document.querySelector("#scanStatus").textContent="Foto lista. Al guardar, se añadirá primero y luego se identificará.";showPhotoQuality(await imageQuality(f).catch(()=>null));}};document.querySelector("#cardCamera").onchange=async e=>{let f=e.target.files?.[0];if(f){try{let dt=new DataTransfer();dt.items.add(f);document.querySelector("#cardPhoto").files=dt.files}catch{}document.querySelector("#scanStatus").textContent="Foto lista. Al guardar, se añadirá primero y luego se identificará.";showPhotoQuality(await imageQuality(f).catch(()=>null));}};document.querySelector("#addCard").onclick=()=>{editId=null;form.reset();delete form.dataset.referenceImage;delete form.dataset.marketPricing;showMarketHint(null);document.querySelector("#scanStatus").textContent="Elige una foto de tu galería o haz una nueva.";document.querySelector("#autoMatch").classList.add("hidden");showPhotoQuality(null);document.querySelector("#retryRecognition").classList.add("hidden");del.classList.add("hidden");dlg.showModal()};window.editCard=id=>{let x=state.cards.find(c=>c.id===id);if(!x)return;editId=id;form.dataset.referenceImage=x.referenceImage||"";document.querySelector("#scanStatus").textContent="Puedes cambiar la foto para volver a identificarla.";for(const k of ["name","number","year","set","grading","grade","language","cert","value","purchase","quantity","purchaseDate","notes","popGrade","popHigher","popTotal","popSource","popUrl","popCheckedAt"])if(form.elements[k])form.elements[k].value=x[k]??"";if((x.grading||"RAW")!=="RAW"){let gv=marketValueFor(x.name,x.grading,x.grade);if(gv){form.elements.value.value=gv.value;let mb=document.querySelector("#marketHint");mb.innerHTML="<b>Valoración "+x.grading+" "+(x.grade||"")+"</b><span>"+euro(gv.value)+" · "+gv.count+" ventas cerradas · confianza "+gv.confidence+"</span>";mb.classList.remove("hidden")}else showMarketHint(null)}else showMarketHint(x);showPhotoQuality(x.recognition?.quality||null);if(x.photoKey)document.querySelector("#retryRecognition").classList.remove("hidden");else document.querySelector("#retryRecognition").classList.add("hidden");del.classList.remove("hidden");dlg.showModal()};document.querySelector("#retryRecognition").onclick=async()=>{if(!editId)return;let c=state.cards.find(x=>x.id===editId);if(!c?.photoKey)return;let b=await photoGet(c.photoKey);if(!b)return;let st=document.querySelector("#scanStatus"),btn=document.querySelector("#retryRecognition");btn.disabled=true;st.textContent="Reanalizando foto con varios recortes…";let ok=await recognizeSavedCard(c,b);btn.disabled=false;if(ok){st.textContent="✅ Identificación completada.";for(const k of ["name","number","year","set","grading","grade","language","cert","value"])if(form.elements[k])form.elements[k].value=c[k]??"";showMarketHint(c)}else st.textContent="No hay coincidencia suficientemente segura todavía."};
document.querySelector("#saveCard").onclick=async e=>{e.preventDefault();let f=new FormData(form),file=f.get("photo"),cameraFile=document.querySelector("#cardCamera")?.files?.[0],id=editId||crypto.randomUUID(),old=state.cards.find(x=>x.id===id)||{};if((!file||!file.size)&&cameraFile)file=cameraFile;if(!editId&&(!file||!file.size)){document.querySelector("#scanStatus").textContent="Selecciona una foto primero.";return}let x={...old,id,name:f.get("name")||old.name||"Carta por identificar",set:f.get("set")||old.set||"",grading:f.get("grading")||old.grading||"RAW",grade:f.get("grade")||old.grade||"",number:f.get("number")||old.number||"",year:f.get("year")||old.year||"",language:f.get("language")||old.language||"",value:+f.get("value")||old.value||0,cert:f.get("cert")||old.cert||"",purchase:f.get("purchase")===""?(old.purchase??null):+f.get("purchase"),quantity:Math.max(1,+f.get("quantity")||old.quantity||1),purchaseDate:f.get("purchaseDate")||old.purchaseDate||"",notes:f.get("notes")||old.notes||"",popGrade:f.get("popGrade")===""?(old.popGrade??null):+f.get("popGrade"),popHigher:f.get("popHigher")===""?(old.popHigher??null):+f.get("popHigher"),popTotal:f.get("popTotal")===""?(old.popTotal??null):+f.get("popTotal"),popSource:f.get("popSource")||old.popSource||"",popUrl:f.get("popUrl")||old.popUrl||"",popCheckedAt:f.get("popCheckedAt")||old.popCheckedAt||"",catalogId:form.dataset.catalogId||old.catalogId||"",referenceImage:form.dataset.referenceImage||old.referenceImage||"",marketPricing:form.dataset.marketPricing?JSON.parse(form.dataset.marketPricing):old.marketPricing||null,draft:old.draft??true,icon:old.icon||"🃏"};let savedBlob=null;if(file&&file.size){savedBlob=await resizeBlob(file);x.photoKey=id;delete x.photo;delete x.photoURL;await photoPut(id,savedBlob);x.photoURL=URL.createObjectURL(savedBlob)}if(editId)state.cards=state.cards.map(c=>c.id===id?x:c);else state.cards.push(x);save();render();form.reset();editId=null;dlg.close();storageStatus();if(savedBlob){let st=document.querySelector("#repairStatus");st.classList.remove("hidden");st.textContent="Foto guardada. La identificación seguirá sin bloquear la app.";enqueueRecognition(x,savedBlob)}};del.onclick=async()=>{if(!editId||!confirm("¿Eliminar esta carta del portfolio?"))return;state.cards=state.cards.filter(x=>x.id!==editId);await photoDel(editId);save();editId=null;dlg.close();render()};function resizeBlob(file){return new Promise(ok=>{let im=new Image(),rd=new FileReader();rd.onload=()=>im.src=rd.result;im.onload=()=>{let max=1200,s=Math.min(1,max/im.width),cv=document.createElement("canvas");cv.width=im.width*s;cv.height=im.height*s;cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);cv.toBlob(ok,"image/jpeg",.82)};rd.readAsDataURL(file)})}
function resize(file){return new Promise(ok=>{let im=new Image(),rd=new FileReader();rd.onload=()=>im.src=rd.result;im.onload=()=>{let max=900,s=Math.min(1,max/im.width),cv=document.createElement("canvas");cv.width=im.width*s;cv.height=im.height*s;cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);ok(cv.toDataURL("image/jpeg",.78))};rd.readAsDataURL(file)})}
function blobToDataURL(blob){return new Promise((ok,no)=>{let r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(blob)})}function dataURLToBlob(s){let [h,d]=s.split(","),mime=(h.match(/:(.*?);/)||[])[1]||"image/jpeg",bin=atob(d),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}function renderRecognitionStats(){
  const box=document.querySelector("#recognitionStats");if(!box)return;
  const withPhoto=state.cards.filter(c=>c.photoKey),done=withPhoto.filter(c=>!c.draft&&c.recognition?.score>0),pending=withPhoto.filter(c=>c.draft),rate=withPhoto.length?done.length/withPhoto.length*100:0;
  const exact=done.filter(c=>c.recognition?.source==="collector-number").length,visual=done.filter(c=>c.recognition?.source==="collector-number+visual").length,assisted=done.filter(c=>c.recognition?.source==="collector-number+name-tokens").length;
  box.innerHTML='<h3>Reconocimiento de fotos</h3><div class="qaRow"><span>Fotos procesables</span><b>'+withPhoto.length+'</b></div><div class="qaRow"><span>Identificadas</span><b class="'+(done.length?"ok":"warn")+'">'+done.length+' · '+rate.toFixed(0)+'%</b></div><div class="qaRow"><span>Coincidencia exacta</span><b>'+exact+'</b></div><div class="qaRow"><span>Número + imagen</span><b>'+visual+'</b></div><div class="qaRow"><span>Número + texto</span><b>'+assisted+'</b></div><div class="qaRow"><span>Pendientes</span><b class="'+(pending.length?"warn":"ok")+'">'+pending.length+'</b></div>';
}
async function testMarketStoreRoundtrip(){
  const id="__cardvault_market_test__";
  try{
    await marketSignalPutMany([{id,name:"test",score:1,price:1}]);
    const all=await marketSignalAll();
    const ok=all.some(x=>x.id===id);
    let t=db.transaction("marketSignals","readwrite"),r=t.objectStore("marketSignals").delete(id);
    await new Promise((yes,no)=>{r.onsuccess=()=>yes();r.onerror=()=>no(r.error)});
    return ok;
  }catch{return false}
}
async function testIndexedDBRoundtrip(){
  const id="__cardvault_test__";try{const blob=new Blob(["ok"],{type:"text/plain"});await photoPut(id,blob);const got=await photoGet(id);await photoDel(id);return !!got&&got.size===2}catch{return false}
}
async function testCatalogConnectivity(){
  try{const r=await Promise.race([fetch("https://api.tcgdex.net/v2/en/cards/base1-4"),timeoutAfter(6000)]);if(!r.ok)return false;const j=await r.json();return !!j?.id}catch{return false}
}
async function testImagePipeline(){
  try{
    const cv=document.createElement("canvas");cv.width=120;cv.height=180;const g=cv.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,120,180);g.fillStyle="#000";g.font="16px sans-serif";g.fillText("149/131",20,155);
    const blob=await new Promise(ok=>cv.toBlob(ok,"image/jpeg",.8));const q=await imageQuality(blob);const fp=await imageFingerprint(blob);return !!blob&&q.score>=0&&!!fp
  }catch{return false}
}
function testLocalState(){try{const s=JSON.stringify(state);JSON.parse(s);localStorage.setItem("__cv_test__","1");const ok=localStorage.getItem("__cv_test__")==="1";localStorage.removeItem("__cv_test__");return ok}catch{return false}}
function renderSelfTest(){
  const box=document.querySelector("#selfTestResults");if(!box)return;const t=state.selfTest||{},rows=t.results||[];
  if(!rows.length){box.innerHTML='<p class="muted">Comprueba almacenamiento, catálogo, OCR, imagen y estado local.</p>';return}
  box.innerHTML='<div class="selfTestHeader"><b>'+((t.pass||0))+'/'+rows.length+' pruebas superadas</b><span>'+new Date(t.at).toLocaleString("es-ES")+'</span></div>'+rows.map(r=>'<div class="qaRow"><span>'+r.label+'</span><b class="'+(r.ok?"ok":"warn")+'">'+(r.ok?"OK":"FALLO")+'</b></div>').join("");
}
async function runSelfTest(){
  const btn=document.querySelector("#runSelfTest"),box=document.querySelector("#selfTestResults");btn.disabled=true;box.innerHTML='<p class="muted">Ejecutando pruebas…</p>';
  const results=[];
  const push=(label,ok)=>results.push({label,ok:!!ok});
  push("JavaScript cargado",true);
  push("Estado local",testLocalState());
  push("IndexedDB fotos",await testIndexedDBRoundtrip());push("IndexedDB radar",await testMarketStoreRoundtrip());
  push("Catálogo TCGdex",await testCatalogConnectivity());
  push("Motor OCR cargado",!!window.Tesseract);
  push("Procesamiento de imagen",await testImagePipeline());
  push("Backup serializable",(()=>{try{JSON.stringify({format:"cardvault-backup",version:3,state});return true}catch{return false}})());
  state.selfTest={at:new Date().toISOString(),results,pass:results.filter(r=>r.ok).length};save();renderSelfTest();renderQA();renderReadiness();btn.disabled=false;
}
function valuationAuditData(){
  const nonEur=state.market.filter(m=>m.kind==="sold"&&(m.currency||"EUR").toUpperCase()!=="EUR").length;
  const undated=state.market.filter(m=>m.kind==="sold"&&!m.soldDate&&!m.at).length;
  const graded=state.cards.filter(c=>(c.grading||"RAW")!=="RAW");
  const valued=graded.filter(c=>marketValueFor(c.name,c.grading,c.grade,c.set||""));
  const weak=graded.filter(c=>{let v=marketValueFor(c.name,c.grading,c.grade,c.set||"");return v&&v.confidence==="Baja"}).length;
  return {nonEur,undated,graded:graded.length,valued:valued.length,weak};
}
function marketEvidenceQuality(){
  const rows=state.market||[],sold=rows.filter(x=>x.kind==="sold"),listing=rows.filter(x=>x.kind==="listing");
  const withUrl=sold.filter(x=>x.url).length,dated=sold.filter(x=>x.soldDate||x.at).length,eur=sold.filter(x=>(x.currency||"EUR").toUpperCase()==="EUR").length;
  const recent=sold.filter(x=>ageDays(x.soldDate||x.at)<=90).length;
  const verified=sold.filter(x=>x.url&&x.source&&x.price>0).length;
  const score=sold.length?Math.round(clamp((withUrl/sold.length)*25+(dated/sold.length)*20+(eur/sold.length)*15+(recent/sold.length)*20+(verified/sold.length)*20,0,100)):0;
  return {sold:sold.length,listing:listing.length,withUrl,dated,eur,recent,verified,score};
}
function renderMarketEvidence(){
  const box=document.querySelector("#marketEvidencePanel");if(!box)return;const q=marketEvidenceQuality();
  box.innerHTML='<h3>Calidad de evidencia de mercado</h3><div class="evidenceScore">'+q.score+'/100</div>'+
    '<div class="qaRow"><span>Ventas cerradas</span><b>'+q.sold+'</b></div>'+
    '<div class="qaRow"><span>Con URL de evidencia</span><b>'+q.withUrl+'</b></div>'+
    '<div class="qaRow"><span>Con fecha</span><b>'+q.dated+'</b></div>'+
    '<div class="qaRow"><span>EUR utilizables</span><b>'+q.eur+'</b></div>'+
    '<div class="qaRow"><span>≤90 días</span><b>'+q.recent+'</b></div>'+
    '<small>Las observaciones sin URL, fecha o moneda compatible se conservan, pero pesan menos en la confianza y algunas quedan fuera de la valoración.</small>';
}
function dataQualityScore(){
  const r=readinessScore(),m=marketEvidenceQuality(),photos=state.photoValidation||{},self=state.selfTest||{};
  const parts=[
    {k:"preparacion",v:r.score,w:.35},
    {k:"mercado",v:m.score,w:.25},
    {k:"fotos",v:(photos.labeledTested||0)>=3?Math.round((photos.accuracy||0)*100):0,w:.20},
    {k:"autotest",v:Math.round(((self.pass||0)/8)*100),w:.20}
  ];
  return {score:Math.round(parts.reduce((s,x)=>s+x.v*x.w,0)),parts};
}
function renderValuationAudit(){
  const box=document.querySelector("#valuationAudit");if(!box)return;const a=valuationAuditData();
  box.innerHTML='<h3>Auditoría de valoración</h3><div class="qaRow"><span>Graduadas con valoración comparable</span><b>'+a.valued+'/'+a.graded+'</b></div><div class="qaRow"><span>Ventas no EUR excluidas</span><b class="'+(a.nonEur?"warn":"ok")+'">'+a.nonEur+'</b></div><div class="qaRow"><span>Valoraciones de confianza baja</span><b class="'+(a.weak?"warn":"ok")+'">'+a.weak+'</b></div><small>Las ventas en otras monedas se conservan como evidencia, pero ya no se mezclan con EUR hasta disponer de conversión de divisa fiable.</small>';
}function renderQA(){
  const box=document.querySelector("#qaPanel");if(!box)return;
  const pending=state.cards.filter(c=>c.draft).length,photos=state.cards.filter(c=>c.photoKey).length,scan=(state.marketScan||[]).length,gradedSales=state.market.filter(m=>m.kind==="sold"&&(m.grading||"RAW")!=="RAW").length,popVerified=state.cards.filter(c=>c.popGrade!=null&&c.popSource&&c.popUrl&&c.popCheckedAt).length,activeAlerts=evaluateOpportunityAlerts(state.marketScan||[]).length,signalPoints=(state.signalHistory||[]).length,last=state.marketScanAt?new Date(state.marketScanAt).toLocaleString("es-ES"):"Nunca",scanAge=state.marketScanAt?ageDays(state.marketScanAt):9999;
  const checks=[["Build","V44","ok"],["Colección",state.cards.length+" fichas","ok"],["Fotos locales",photos+" guardadas",photos?"ok":"warn"],["Pendientes OCR",String(pending),pending?"warn":"ok"],["Market Lab",scan+" analizadas",scan?"ok":"warn"],["Cobertura catálogo",(state.marketCoverage?.total?((state.marketCoverage.seen/state.marketCoverage.total)*100).toFixed(1)+"%":"Sin iniciar"),(state.marketCoverage?.seen||0)>=120?"ok":"warn"],["Con precio",(state.marketCoverage?.priced||0)+" cartas",(state.marketCoverage?.priced||0)>=40?"ok":"warn"],["Radar activo",(state.marketCoverage?.active||0)+" cartas",(state.marketCoverage?.active||0)>=40?"ok":"warn"],["Ventas graduadas",gradedSales+" comps",gradedSales>=4?"ok":"warn"],["Población verificada",popVerified+" fichas",popVerified?"ok":"warn"],["Alertas activas",activeAlerts,activeAlerts?"ok":"warn"],["Histórico señales",signalPoints+" puntos",signalPoints>=20?"ok":"warn"],["Preparación",readinessScore().score+"%",readinessScore().score===100?"ok":"warn"],["Calidad global",dataQualityScore().score+"%",dataQualityScore().score>=80?"ok":"warn"],["Autotest",(state.selfTest?.pass||0)+"/8",(state.selfTest?.pass||0)>=7?"ok":"warn"],["Prueba fotos",(state.photoValidation?.labeledTested||0)?Math.round((state.photoValidation.accuracy||0)*100)+"%":"Sin muestra",(state.photoValidation?.labeledTested||0)>=3&&(state.photoValidation?.accuracy||0)>=.7?"ok":"warn"],["Modo",state.marketScanMode==="wide"?"Amplio":"Rápido",state.marketScanMode==="wide"?"ok":"warn"],["Último escaneo",last,scan?"ok":"warn"],["Frescura mercado",scanAge<=1?"Hoy":scanAge<=7?"< 7 días":"Antiguo",scanAge<=7?"ok":"warn"]];
  box.innerHTML="<h3>Diagnóstico Card Vault</h3>"+checks.map(c=>"<div class=\"qaRow\"><span>"+c[0]+"</span><b class=\""+c[2]+"\">"+c[1]+"</b></div>").join("");renderBootStatus();renderRecognitionStats();renderBatchStatus();renderReadiness();renderSelfTest();renderPhotoValidation();renderCertification();renderIntegrity();renderValuationAudit();renderMarketEvidence();
}
async function storageStatus(){let label="Almacenamiento disponible";if(navigator.storage?.estimate){let e=await navigator.storage.estimate(),u=e.usage||0,q=e.quota||0,p=q?u/q*100:0;label=(u/1048576).toFixed(1)+" MB usados"+(q?" de "+(q/1048576).toFixed(0)+" MB · "+p.toFixed(1)+"%":"");document.querySelector("#storageText").textContent=label}renderQA();let persisted=false;try{persisted=await navigator.storage?.persisted?.()}catch{}let r=document.querySelector("#readyText");if(r)r.textContent="Fotos y radar guardados localmente · copia V3 completa · "+(persisted?"almacenamiento persistente concedido":"haz copias periódicas en Archivos/iCloud")}document.querySelector("#export").onclick=async()=>{let photos={};for(const x of state.cards){if(x.photoKey){let b=await photoGet(x.photoKey);if(b)photos[x.photoKey]=await blobToDataURL(b)}}let marketSignals=await marketSignalAll().catch(()=>[]),clean=JSON.parse(JSON.stringify(state,(k,v)=>k==="photoURL"?undefined:v)),pack={format:"cardvault-backup",version:3,createdAt:new Date().toISOString(),state:clean,photos,marketSignals},blob=new Blob([JSON.stringify(pack)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="card-vault-completo-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
document.querySelector("#import").onchange=async e=>{try{let x=JSON.parse(await e.target.files[0].text()),s=x.format==="cardvault-backup"?x.state:x;if(!s.cards)throw 0;if(x.photos)for(const [id,data] of Object.entries(x.photos))await photoPut(id,dataURLToBlob(data));if(x.marketSignals){await marketSignalClear();await marketSignalPutMany(x.marketSignals)}state=ensureStateShape(s);await refreshMarketFreshness();normalizePendingCards();save();await hydratePhotos();await hydrateMarketFromStorage();storageStatus();renderCoverage();renderBootStatus();setTimeout(async()=>{let todo=state.cards.filter(c=>c.draft&&c.photoKey).slice(0,3);for(const c of todo){let b=await photoGet(c.photoKey);if(b)enqueueRecognition(c,b)}},700);alert("Copia completa restaurada")}catch(err){alert("Copia no válida o incompleta")}};

function normalizePendingCards(){
  let changed=false;
  for(const c of state.cards){
    if(c.draft){
      const bad=!c.name||c.name==="Carta por identificar"||c.recognition?.source!=="catalog+ocr";
      if(bad&&c.name!=="Carta por identificar"){c.recognition={...(c.recognition||{}),legacyName:c.name};c.name="Carta por identificar";changed=true}
    }
  }
  if(changed)save();
}
async function reanalyzePending(){
  const btn=document.querySelector("#reanalyzePending"),st=document.querySelector("#repairStatus"),pending=state.cards.filter(c=>c.draft&&c.photoKey);
  if(!pending.length){st.textContent="No hay cartas pendientes con foto para reanalizar.";st.classList.remove("hidden");return}
  btn.disabled=true;st.classList.remove("hidden");let ok=0,fail=0;
  for(let i=0;i<pending.length;i++){
    const c=pending[i];st.textContent="Reanalizando "+(i+1)+"/"+pending.length+"…";
    try{
      const blob=await photoGet(c.photoKey);if(!blob){fail++;continue}
      const r=await analyzeCardFile(blob),fresh=cardFromRecognition(c.id,blob,r);
      if(!fresh.draft){
        const keep={purchase:c.purchase,quantity:c.quantity||1,purchaseDate:c.purchaseDate||"",notes:c.notes||"",photoKey:c.photoKey,photoURL:c.photoURL||fresh.photoURL};
        Object.assign(c,fresh,keep);ok++;
      }else{
        c.name="Carta por identificar";c.number=r.g?.number||c.number||"";c.recognition=fresh.recognition;fail++;
      }
    }catch{c.name="Carta por identificar";fail++}
    save();render();
  }
  btn.disabled=false;st.textContent=ok+" identificadas · "+fail+" siguen pendientes.";storageStatus();
}
normalizePendingCards();
document.querySelector("#reanalyzePending").onclick=reanalyzePending;
document.querySelector("#clearTests").onclick=async()=>{let bad=state.cards.filter(c=>c.draft);if(!bad.length){alert("No hay pruebas pendientes que limpiar.");return}if(!confirm("Esto borrará solo las cartas pendientes/de prueba. ¿Continuar?"))return;for(const c of bad){if(c.photoKey)await photoDel(c.photoKey)}state.cards=state.cards.filter(c=>!c.draft);save();render();storageStatus();alert("Pruebas pendientes eliminadas.")};

document.querySelector("#runSelfTest").onclick=runSelfTest;renderSelfTest();document.querySelector("#runPhotoValidation").onclick=runPhotoValidation;renderPhotoValidation();document.querySelector("#runCertification").onclick=runCertification;renderCertification();document.querySelector("#repairIntegrity").onclick=()=>{repairStateIntegrity();renderIntegrity();render();renderQA()};renderIntegrity();
document.querySelector("#searchCards").oninput=render;document.querySelector("#filterType").onchange=render;
const bulkDialog=document.querySelector("#bulkDialog"),bulkPhotos=document.querySelector("#bulkPhotos");document.querySelector("#bulkAdd").onclick=()=>bulkDialog.showModal();
document.querySelector("#saveBulk").onclick=async e=>{e.preventDefault();let fs=[...bulkPhotos.files];if(!fs.length)return;let btn=e.currentTarget,old=btn.textContent;btn.disabled=true;btn.textContent="Guardando fotos…";let jobs=[];for(let i=0;i<fs.length;i++){let id=crypto.randomUUID(),blob=await resizeBlob(fs[i]);await photoPut(id,blob);let card={id,name:"Carta por identificar",set:"",number:"",year:"",language:"",grading:"RAW",grade:"",value:0,purchase:null,quantity:1,purchaseDate:"",cert:"",photoKey:id,photoURL:URL.createObjectURL(blob),icon:"🃏",draft:true,recognition:{score:0,source:"pending",at:new Date().toISOString()},createdAt:new Date().toISOString()};state.cards.push(card);jobs.push({card,blob});}save();render();storageStatus();btn.disabled=false;btn.textContent=old;bulkPhotos.value="";bulkDialog.close();let st=document.querySelector("#repairStatus");st.classList.remove("hidden");st.textContent=fs.length+" fotos guardadas. La identificación continuará sin bloquear la app.";for(const j of jobs)enqueueRecognition(j.card,j.blob)};

async function hydrateMarketFromStorage(){
  const q=await refreshMarketFreshness();
  const rows=q.active.sort((a,b)=>b.score-a.score).slice(0,400);
  if(rows.length){state.marketScan=rows;state.marketScanMode="wide";if(!state.marketScanAt)state.marketScanAt=new Date().toISOString()}
  state.bootInfo={at:new Date().toISOString(),radarLoaded:true,radarCount:rows.length};
  save();renderCoverage();renderMarketScan();renderScanHistory();renderBootStatus();
}
async function migrateLegacyMarketUniverse(){
  const rows=Object.values(state.marketUniverse||{}).filter(x=>x?.id);
  if(rows.length){await marketSignalPutMany(rows);state.marketUniverse={};}
  state.marketScannedIds={};
  await refreshMarketFreshness();
}
openDB().then(async()=>{try{await navigator.storage?.persist?.()}catch{}await migrateLegacyMarketUniverse();await hydrateMarketFromStorage(); for(const x of state.cards){if(x.photo&&!x.photoKey&&x.photo.startsWith("data:")){try{let blob=await (await fetch(x.photo)).blob();x.photoKey=x.id;await photoPut(x.id,blob);delete x.photo}catch{}}}save();await hydratePhotos();storageStatus()}).catch(e=>{state.bootInfo={at:new Date().toISOString(),radarLoaded:false,radarCount:0,error:String(e?.message||e||"IndexedDB")};save();renderBootStatus();document.querySelector("#readyText").textContent="Error al abrir almacenamiento local. No cargues cartas hasta recargar la app."});