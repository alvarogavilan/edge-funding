const seed=[
{id:"vap149",name:"Vaporeon ex #149/131",set:"Prismatic Evolutions · 2025",grade:9,cert:"136142566",value:215,purchase:null,referenceImage:"https://images.pokemontcg.io/sv8pt5/149_hires.png",icon:"💧"},
{id:"eev174",name:"Eevee ex #174",set:"SVP Promo · 2025",grade:9,cert:"136142568",value:30,purchase:null,referenceImage:"https://images.pokemontcg.io/svp/174_hires.png",icon:"✨"},
{id:"cha074",name:"Charizard ex #074",set:"Paldean Fates Tin · 2024",grade:9,cert:"136142569",value:38,purchase:null,referenceImage:"https://images.pokemontcg.io/svp/74_hires.png",icon:"🔥"},
{id:"cha228",name:"Charizard ex #228/197",set:"Obsidian Flames · 2023",grade:9,cert:"136142567",value:55,purchase:null,referenceImage:"https://images.pokemontcg.io/sv3/228_hires.png",icon:"🏆"}];
const KEY="cardvault.v2";let editId=null;const catalogCache={};let recognitionQueue=[];let queueRunning=false;const DB="cardvault.media.v1";let db;function openDB(){return new Promise((ok,no)=>{let r=indexedDB.open(DB,3);r.onupgradeneeded=()=>{let d=r.result;if(!d.objectStoreNames.contains("photos"))d.createObjectStore("photos");if(!d.objectStoreNames.contains("marketSignals"))d.createObjectStore("marketSignals",{keyPath:"id"});if(!d.objectStoreNames.contains("catalog")){let s=d.createObjectStore("catalog",{keyPath:"id"});s.createIndex("universe","universe",{unique:false})}};r.onsuccess=()=>{db=r.result;ok(db)};r.onerror=()=>no(r.error)})}
function photoPut(id,blob){return new Promise((ok,no)=>{let t=db.transaction("photos","readwrite"),r=t.objectStore("photos").put(blob,id);r.onsuccess=()=>ok();r.onerror=()=>no(r.error)})}
function photoGet(id){return new Promise((ok,no)=>{let r=db.transaction("photos").objectStore("photos").get(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
function photoDel(id){return new Promise(ok=>{let r=db.transaction("photos","readwrite").objectStore("photos").delete(id);r.onsuccess=()=>ok()})}
function marketSignalPutMany(rows){return new Promise((ok,no)=>{try{let t=db.transaction("marketSignals","readwrite"),s=t.objectStore("marketSignals");for(const x of rows||[])if(x?.id)s.put(x);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)}catch(e){no(e)}})}
function marketSignalAll(){return new Promise((ok,no)=>{try{let r=db.transaction("marketSignals").objectStore("marketSignals").getAll();r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>no(r.error)}catch(e){no(e)}})}
function marketSignalCount(){return new Promise((ok,no)=>{try{let r=db.transaction("marketSignals").objectStore("marketSignals").count();r.onsuccess=()=>ok(r.result||0);r.onerror=()=>no(r.error)}catch(e){no(e)}})}function marketSignalDeleteMany(ids){return new Promise((ok,no)=>{try{let t=db.transaction("marketSignals","readwrite"),s=t.objectStore("marketSignals");for(const id of ids||[])s.delete(id);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)}catch(e){no(e)}})}
function marketSignalClear(){return new Promise((ok,no)=>{try{let r=db.transaction("marketSignals","readwrite").objectStore("marketSignals").clear();r.onsuccess=()=>ok();r.onerror=()=>no(r.error)}catch(e){no(e)}})}function catalogPutMany(rows){return new Promise((ok,no)=>{try{let t=db.transaction("catalog","readwrite"),s=t.objectStore("catalog");for(const x of rows||[])if(x&&x.id)s.put(x);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)}catch(e){no(e)}})}function catalogAll(){return new Promise((ok,no)=>{try{let r=db.transaction("catalog").objectStore("catalog").getAll();r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>no(r.error)}catch(e){no(e)}})}function catalogCount(universe){return new Promise((ok,no)=>{try{let s=db.transaction("catalog").objectStore("catalog"),r=universe?s.index("universe").count(IDBKeyRange.only(universe)):s.count();r.onsuccess=()=>ok(r.result||0);r.onerror=()=>no(r.error)}catch(e){no(e)}})}let state=JSON.parse(localStorage.getItem(KEY)||"null")||{cards:seed,watch:[],history:[],market:[]};if(!state.market)state.market=[];if(!state.watch)state.watch=[];if(!state.history)state.history=[];if(!state.marketScan)state.marketScan=[];if(!state.marketScanHistory)state.marketScanHistory=[];if(!state.compare)state.compare=[];if(!state.alertHistory)state.alertHistory=[];if(!state.signalHistory)state.signalHistory=[];if(!state.analystWeights)state.analystWeights={momentum:.30,value:.22,stability:.18,global:.12,data:.18,scarcity:.12};if(!state.processingLog)state.processingLog=[];if(!state.selfTest)state.selfTest={};if(!state.photoValidation)state.photoValidation={};if(!state.certification)state.certification={};if(!state.releaseChecks)state.releaseChecks={};if(!state.runtimeErrors)state.runtimeErrors=[];if(!state.dataQuality)state.dataQuality={};if(!state.schemaVersion||state.schemaVersion<43)state.schemaVersion=66;if(!state.marketCursor)state.marketCursor=0;if(!state.marketUniverse)state.marketUniverse={};if(!state.marketCoverage)state.marketCoverage={total:0,seen:0,priced:0,at:null};if(!state.marketScannedIds)state.marketScannedIds={};if(!state.marketFailures)state.marketFailures={};if(!state.coverageByUniverse)state.coverageByUniverse={pokemon:state.marketCoverage||{},lorcana:{total:0,seen:0,priced:0,active:0,stale:0,failed:0,at:null}};if(!state.cursorByUniverse)state.cursorByUniverse={pokemon:state.marketCursor||0,lorcana:0};if(!state.archivedUniverses)state.archivedUniverses={};if(!state.gradingEconomics||typeof state.gradingEconomics!=="object")state.gradingEconomics={buy:50,buyShip:5,gradeCost:40,psa9:100,psa10:250,sellFeePct:13};if(!state.investmentProfile||typeof state.investmentProfile!=="object")state.investmentProfile={minPriceEUR:40,maxPriceEUR:150,minUpsideEUR:50,minPriceUSD:45,maxPriceUSD:170,minUpsideUSD:55};if(!state.catalogMeta)state.catalogMeta={pokemon:{count:0,at:null},lorcana:{count:0,sets:0,at:null}};if(!state.processingLog)state.processingLog=[];if(!state.selfTest)state.selfTest={};if(!state.photoValidation)state.photoValidation={};if(!state.certification)state.certification={};if(!state.releaseChecks)state.releaseChecks={};if(!state.runtimeErrors)state.runtimeErrors=[];state=ensureStateShape(state);const refImages={vap149:"https://images.pokemontcg.io/sv8pt5/149_hires.png",eev174:"https://images.pokemontcg.io/svp/174_hires.png",cha074:"https://images.pokemontcg.io/svp/74_hires.png",cha228:"https://images.pokemontcg.io/sv3/228_hires.png"};for(const c of state.cards){if(refImages[c.id]&&!c.referenceImage)c.referenceImage=refImages[c.id]}save();let radarLimit=999999;
const euro=n=>(+n||0).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const qty=x=>Math.max(1,+x.quantity||1);
const total=()=>state.cards.reduce((a,x)=>a+(+x.value||0)*qty(x),0);
const invested=()=>state.cards.reduce((a,x)=>a+(x.purchase==null?0:(+x.purchase||0)*qty(x)),0);
const drafts=()=>state.cards.filter(x=>x.draft).length;
const gain=()=>total()-invested();function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function universeLabel(u){return u==="lorcana"?"Lorcana":"Pokémon"}
function universeIcon(u){return u==="lorcana"?"✨":"⚡"}
function currentRadarUniverse(){const u=document.querySelector("#radarUniverse")?.value||"pokemon";return u==="lorcana"?"lorcana":"pokemon"}
function cardUniverse(c){return c?.universe==="lorcana"?"lorcana":"pokemon"}
function marketUniverseOf(x){return x?.universe==="lorcana"?"lorcana":"pokemon"}
function money(n,currency="EUR"){return (+n||0).toLocaleString("es-ES",{style:"currency",currency:currency||"EUR"})}
function ensureStateShape(s){
  s=s&&typeof s==="object"?s:{};
  const arrays=["cards","watch","history","market","marketScan","marketScanHistory","compare","alertHistory","signalHistory","processingLog","runtimeErrors","pregradeHistory"];
  for(const k of arrays)if(!Array.isArray(s[k]))s[k]=k==="cards"?[]:[];
  if(!s.analystWeights||typeof s.analystWeights!=="object")s.analystWeights={momentum:.30,value:.22,stability:.18,global:.12,data:.18,scarcity:.12};
  for(const k of ["selfTest","photoValidation","certification","releaseChecks","dataQuality","marketUniverse","marketFailures"])if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]={};
  if(!s.marketCoverage||typeof s.marketCoverage!=="object"||Array.isArray(s.marketCoverage))s.marketCoverage={total:0,seen:0,priced:0,active:0,stale:0,failed:0,at:null};
  s.marketCursor=Math.max(0,+s.marketCursor||0);
  s.schemaVersion=66;
  for(const c of s.cards){
    if(!c||typeof c!=="object")continue;
    if(!c.universe)c.universe="pokemon";
    if(["vap149","eev174","cha074","cha228"].includes(c.id)&&!c.grading)c.grading="PSA";if(c.universe==="football"){c.archivedUniverse="football";c.universe="pokemon";c.archivedAt=c.archivedAt||new Date().toISOString();}
    if(!c.id)c.id=crypto.randomUUID();
    c.quantity=Math.max(1,+c.quantity||1);
    c.value=Number.isFinite(+c.value)?+c.value:0;
    if(!c.name)c.name="Carta por identificar";
    if(!c.grading)c.grading=(["vap149","eev174","cha074","cha228"].includes(c.id)?"PSA":"RAW");
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
  const arrays=["cards","watch","history","market","marketScan","marketScanHistory","compare","alertHistory","signalHistory","processingLog","runtimeErrors","pregradeHistory"];
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
  state.cards=fixed;state.runtimeErrors=(state.runtimeErrors||[]).filter(x=>ageDays(x.at)<=14);save();return stateIntegrityReport();
}
function renderIntegrity(){
  const box=document.querySelector("#integrityResults");if(!box)return;const r=stateIntegrityReport(),errs=(state.runtimeErrors||[]),bootAt=new Date(state.bootInfo?.at||0).getTime(),current=errs.filter(x=>new Date(x.at).getTime()>=bootAt&&bootAt>0);
  box.innerHTML='<div class="qaRow"><span>Estado de datos</span><b class="'+(r.ok?"ok":"warn")+'">'+(r.ok?"OK":r.issues.length+" incidencias")+'</b></div>'+
    '<div class="qaRow"><span>Errores de este arranque</span><b class="'+(current.length?"warn":"ok")+'">'+current.length+'</b></div>'+
    '<div class="qaRow"><span>Errores históricos guardados</span><b>'+errs.length+'</b></div>'+
    (current.length?'<div class="integrityIssues">'+current.slice(-5).map(x=>'<div>• '+x.kind+': '+x.message+'</div>').join("")+'</div>':'')+
    (r.issues.length?'<div class="integrityIssues">'+r.issues.slice(0,8).map(x=>'<div>• '+x+'</div>').join("")+'</div>':'');
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
async function hydratePhotos(){for(const x of state.cards){if(x.photoKey&&!x.photoURL){let b=await photoGet(x.photoKey);if(b)x.photoURL=URL.createObjectURL(b)}}render()}function render(){let q=(document.querySelector("#searchCards")?.value||"").toLowerCase(),ft=document.querySelector("#filterType")?.value||"",fu=document.querySelector("#collectionUniverse")?.value||"",visible=state.cards.filter(x=>(!fu||cardUniverse(x)===fu)&&(!ft||(x.grading||"PSA")===ft)&&(!q||[x.name,x.set,x.number,x.cert,x.notes,universeLabel(cardUniverse(x))].join(" ").toLowerCase().includes(q)));document.querySelector("#cards").innerHTML=visible.map(x=>{let p=x.purchase!=null?((x.value-x.purchase)*qty(x)):null;return `<article class="card" onclick="editCard(\`${x.id}\`)"><div class="thumb">${x.photoURL?`<img src="${x.photoURL}">`:x.photo?`<img src="${x.photo}">`:x.referenceImage?`<img src="${x.referenceImage}" alt="${x.name}">`:x.icon||"🃏"}</div><div><div class="universeBadge ${cardUniverse(x)}">${universeIcon(cardUniverse(x))} ${universeLabel(cardUniverse(x))}</div><h3>${x.draft?"⚠️ ":""}${x.name}</h3><div class="meta">${x.number?x.number+" · ":""}${x.set||""}<br>${x.cert?"Cert. "+x.cert:""}${qty(x)>1?" · Cant. "+qty(x):""}</div><span class="grade">${x.grading||"PSA"} ${x.grade||""}</span>${x.recognition?.score?`<div class="recognition">Reconocimiento ${x.recognition.score}% · ${x.recognition.source==="collector-number"?"número exacto":x.recognition.source==="collector-number+visual"?"número + imagen":x.recognition.source==="collector-number+name-tokens"?"número + texto":"asistido"}</div>`:""}${x.popGrade!=null&&x.popSource?`<div class="scarcity">Pop ${x.grade||""}: ${x.popGrade} · ${x.popSource}${x.popHigher!=null?" · superiores "+x.popHigher:""}</div>`:""}</div><div class="price">${euro(x.value)}${(()=>{let s=(state.marketScan||[]).find(m=>m.id===x.catalogId);return s?`<div class="signal mini">${s.score}</div>`:""})()}${x.marketPricing?`<div class="marketRef">RAW · ${x.marketPricing.source}</div>`:""}${x.gradedValuation?`<div class="marketRef">${x.grading} ${x.grade||""} · ${x.gradedValuation.count} ventas · ${x.gradedValuation.confidence}${x.gradedValuation.liquidity!=null?" · Liq "+x.gradedValuation.liquidity:""}</div>`:""}${(()=>{try{let f=forecast(x);return f?`<div class="future">12m ≈ ${euro(f.base)}</div>`:""}catch{return ""}})()}${p==null?"":`<div class="profit ${p>=0?"up":"down"}">${p>=0?"+":""}${euro(p)}</div>`}</div></article>`}).join("");document.querySelector("#total").textContent=euro(total());document.querySelector("#count").textContent=state.cards.reduce((n,x)=>n+qty(x),0)+" cartas";
let cs=document.querySelector("#collectionStats");if(cs){let g=gain(),inv=invested();cs.innerHTML=
'<div><span>Valor actual</span><b>'+euro(total())+'</b></div>'+
'<div><span>Invertido</span><b>'+euro(inv)+'</b></div>'+
'<div><span>Resultado</span><b class="'+(g>=0?'up':'down')+'">'+(g>=0?'+':'')+euro(g)+'</b></div>'+
'<div><span>Pendientes</span><b>'+drafts()+'</b></div>';} let prev=state.history.at(-1)?.total;document.querySelector("#change").textContent=prev==null?"Pulsa «Guardar valoración» para crear histórico":(total()-prev>=0?"+":"")+euro(total()-prev)+" desde la última valoración";document.querySelector("#watchList").innerHTML=state.watch.length?state.watch.map((x,i)=>{let m=(state.marketScan||[]).find(s=>s.id===x.catalogId||norm(s.name)===norm(x.name));return `<div class="card"><div class="thumb">👁️</div><div><h3>${x.name}</h3><div class="meta">Objetivo ≤ ${euro(x.target)}${m?" · mercado "+euro(m.price):""}${m&&m.price<=x.target?" · ✅ en objetivo":""}</div>${m?`<div class="recognition">Convicción ${convictionSignal(m)}/100 · Liquidez ${liquiditySignal(m)}/100</div>`:""}</div><button onclick="removeWatch(${i})">×</button></div>`}).join(""):'<div class="empty">No sigues ninguna carta todavía.</div>';renderWatchSummary();renderHistory()}
function renderHistory(){const h=[...state.history].reverse();document.querySelector("#history").innerHTML=h.slice(0,10).map(x=>`<div class="historyRow"><span>${new Date(x.at).toLocaleString("es-ES")}</span><b>${euro(x.total)}</b></div>`).join("");drawChart()}
function drawChart(){const c=document.querySelector("#chart"),dpr=devicePixelRatio||1,r=c.getBoundingClientRect();c.width=r.width*dpr;c.height=r.height*dpr;const g=c.getContext("2d");g.scale(dpr,dpr);g.clearRect(0,0,r.width,r.height);let a=state.history.slice(-30);if(a.length<2){g.fillStyle="#8992ad";g.font="13px -apple-system";g.fillText("Guarda 2 valoraciones para ver la evolución",12,30);return}let vals=a.map(x=>x.total),mn=Math.min(...vals),mx=Math.max(...vals);if(mx===mn){mx++;mn--}g.strokeStyle="#eef2ff";g.lineWidth=2;g.beginPath();a.forEach((x,i)=>{let px=10+i*(r.width-20)/(a.length-1),py=10+(mx-x.total)*(r.height-20)/(mx-mn);i?g.lineTo(px,py):g.moveTo(px,py)});g.stroke()}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".tab").forEach(x=>x.classList.add("hidden"));document.querySelector("#"+b.dataset.tab).classList.remove("hidden");if(b.dataset.tab==="data")drawChart()});document.querySelector("#runPregrade").onclick=runPSAPregrade;renderPregradeHistory();document.querySelector("#calculateGradingEconomics").onclick=calculateGradingEconomics;hydrateGradingEconomics();
document.querySelector("#snapshot").onclick=()=>{state.history.push({at:new Date().toISOString(),total:total(),cards:Object.fromEntries(state.cards.map(x=>[x.id,x.value]))});save();render()};
function radarScore(group){let sold=group.filter(x=>x.kind==="sold"),list=group.filter(x=>x.kind==="listing");if(!sold.length)return 0;let prices=sold.map(x=>x.price).sort((a,b)=>a-b),med=prices[Math.floor(prices.length/2)],latest=sold.at(-1)?.price||med,score=Math.min(55,sold.length*11);if(latest<med)score+=15;if(list.length&&Math.min(...list.map(x=>x.price))<med*.9)score+=20;return Math.min(100,score)}
function setupMarketWorkspace(){
  const section=document.querySelector("#radar"),host=document.querySelector("#marketPaneHost"),sub=document.querySelector("#marketSubnav");
  if(!section||!host||host.dataset.ready)return;
  const today=document.createElement("div"),radar=document.createElement("div"),catalog=document.createElement("div");
  today.id="marketPaneToday";radar.id="marketPaneRadar";catalog.id="marketPaneCatalog";
  today.className="marketPane";radar.className="marketPane hidden";catalog.className="marketPane hidden";
  host.append(today,radar,catalog);
  const move=(id,target)=>{const el=document.querySelector(id);if(el)target.appendChild(el)};
  // First screen: only the decision output.
  move("#topBuyCandidates",today);move("#opportunityAlerts",today);move("#decisionBoard",today);
  // Catalog gets its own clean screen.
  move(".catalogHub",catalog);
  // Everything else belongs to the technical radar screen.
  const keep=[".labControls",".scanModes","#coveragePanel",".researchDesk","#marketIndex","#marketHealth","#provenancePanel","#sectorGrid","#portfolioRisk","#marketLeaders","#compareTray","#signalPerformance","#scanHistory"];
  keep.forEach(sel=>move(sel,radar));
  // Move the lower opportunities block and its controls into Radar.
  const heads=[...section.querySelectorAll(".sectionHead")];
  const oppHead=heads.find(h=>/Oportunidades de mercado/i.test(h.textContent||""));
  if(oppHead){
    radar.appendChild(oppHead);
    let n=oppHead.nextElementSibling;
    while(n&&n!==host&&n.tagName!=="SECTION"){
      const next=n.nextElementSibling;
      if(n.id==="pregrade"||n.id==="watch"||n.id==="data")break;
      if(["radarSummary","radarList"].includes(n.id)||n.classList?.contains("filters")||n.classList?.contains("muted"))radar.appendChild(n);
      n=next;
    }
  }
  host.dataset.ready="1";
  const show=name=>{
    [today,radar,catalog].forEach(p=>p.classList.add("hidden"));
    ({today,radar,catalog}[name]||today).classList.remove("hidden");
    sub.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.marketpane===name));
    if(name==="today"){renderTopBuyCandidates(state.marketScan||[]);renderOpportunityAlerts(state.marketScan||[]);renderDecisionBoard(state.marketScan||[]);refreshGlobalToday().catch(()=>{})}
    if(name==="catalog")refreshCatalogBrowser(false).catch(()=>{});
  };
  sub.querySelectorAll("button").forEach(b=>b.onclick=()=>show(b.dataset.marketpane));
  show("today");renderInvestmentProfile();
}
function renderRadar(){setupMarketWorkspace();
  const u=currentRadarUniverse(),auto=[...(state.marketScan||[])].filter(x=>{const g=investmentGate(x);return marketUniverseOf(x)===u&&(+x.price||0)>0&&(+x.price||0)<=radarLimit&&(+x.price||0)>=Math.min(g.profile.min,radarLimit)}).sort((a,b)=>{const A=topBuyRank(a),B=topBuyRank(b);return (B.eligible-A.eligible)||(B.rank-A.rank)||((+b.score||0)-(+a.score||0))});
  const manual=state.market.filter(x=>marketUniverseOf(x)===u),sales=manual.filter(x=>x.kind==="sold"),listings=manual.filter(x=>x.kind==="listing");
  const rs=document.querySelector("#radarSummary");
  if(rs)rs.innerHTML='<div><span>Señales automáticas</span><b>'+auto.length+'</b></div><div><span>Señales ≥60</span><b>'+auto.filter(x=>(+x.score||0)>=60).length+'</b></div><div><span>Ventas verificadas</span><b>'+sales.length+'</b></div><div><span>Anuncios manuales</span><b>'+listings.length+'</b></div>';
  const box=document.querySelector("#radarList");if(!box)return;
  if(!auto.length){
    box.innerHTML='<div class="empty">No hay señales automáticas visibles para este filtro. El radar superior puede contener datos guardados de otro universo o pendientes de cargar; pulsa «Escanear mercado» o cambia el filtro de precio.</div>';
    return;
  }
  box.innerHTML=auto.slice(0,80).map(x=>'<article class="opportunity"><div class="oppThumb">'+(x.image?'<img src="'+x.image+'" alt="" onerror="this.style.display=\'none\';this.nextElementSibling&&(this.nextElementSibling.style.display=\'flex\')"><div class="catalogNoImg fallbackImg" style="display:none">🃏</div>':'🃏')+'</div><div class="oppMain"><b>'+x.name+'</b><div class="meta">'+[x.set,x.rarity].filter(Boolean).join(" · ")+'</div><div class="oppSignals"><span>'+signalLabel(x)+'</span><span>Riesgo '+(x.risk||"—")+'</span><span>Liquidez '+liquiditySignal(x)+'/100</span></div></div><div class="oppRight"><strong>'+money(x.price,x.currency||"EUR")+'</strong><b class="signal '+((+x.score||0)>=75?"hot":(+x.score||0)>=60?"warm":"")+'">'+Math.round(+x.score||0)+'/100</b><button class="watchFromMarket" data-watchid="'+x.id+'">Seguir</button></div></article>').join("");
}
document.querySelector("#refreshValues").onclick=refreshPortfolioValues;document.querySelector("#scanMarket").onclick=()=>runMarketScan("quick");document.querySelector("#deepScanMarket").onclick=()=>runMarketScan("wide");document.querySelector("#radarUniverse").onchange=async()=>{const u=currentRadarUniverse(),q=await activeMarketSignals(45,u);state.marketScan=q.active.sort((a,b)=>b.score-a.score).slice(0,400);state.marketScanUniverse=u;renderCoverage();renderMarketScan();renderRadar();renderQA();};document.querySelector("#continueCoverage").onclick=()=>continueCoverage(5);document.querySelector("#retryMarketFailures").onclick=retryMarketFailures;document.querySelector("#indexFullCatalog").onclick=indexFullCatalog;document.querySelector("#enrichCatalogPage").onclick=enrichCatalogPage;document.querySelector("#catalogSearch").oninput=()=>refreshCatalogBrowser(true);document.querySelector("#catalogUniverse").onchange=()=>refreshCatalogBrowser(true);document.querySelector("#catalogPrev").onclick=()=>{catalogPage=Math.max(0,catalogPage-1);refreshCatalogBrowser()};document.querySelector("#catalogNext").onclick=()=>{catalogPage++;refreshCatalogBrowser()};refreshCatalogBrowser(true);renderMarketScan();renderScanHistory();
document.addEventListener("click",e=>{let b=e.target.closest(".watchFromMarket");if(!b)return;e.stopPropagation();let x=(state.marketScan||[]).find(m=>m.id===b.dataset.watchid);if(!x)return;if(!state.watch.some(w=>w.catalogId===x.id))state.watch.push({name:x.name,target:Math.round((x.low||x.price*.9)*100)/100,catalogId:x.id,source:"Market Lab"});save();render();b.textContent="En seguimiento";});
document.addEventListener("click",e=>{let b=e.target.closest(".compareMarket");if(!b)return;e.stopPropagation();toggleCompare(b.dataset.compareid)});
document.querySelectorAll("[data-limit]").forEach(b=>b.onclick=()=>{radarLimit=+b.dataset.limit;document.querySelectorAll("[data-limit]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");renderRadar()});
const marketDialog=document.querySelector("#marketDialog"),marketForm=document.querySelector("#marketForm");document.querySelector("#addMarket").onclick=()=>{marketForm.elements.universe.value=currentRadarUniverse();marketDialog.showModal()};document.querySelector("#saveMarket").onclick=e=>{e.preventDefault();if(!marketForm.reportValidity())return;let f=new FormData(marketForm);state.market.push({id:crypto.randomUUID(),universe:f.get("universe")||currentRadarUniverse(),name:f.get("name").trim(),set:f.get("set"),grading:f.get("grading"),grade:f.get("grade"),price:+f.get("price"),kind:f.get("kind"),source:f.get("source"),url:f.get("url"),soldDate:f.get("soldDate")||"",currency:(f.get("currency")||"EUR").toUpperCase(),at:new Date().toISOString()});save();renderRadar();renderMarketEvidence();marketForm.reset();marketDialog.close()};
document.querySelector("#addWatch").onclick=()=>{let name=prompt("Nombre de la carta que quieres seguir");if(!name)return;let target=prompt("Precio objetivo en euros","30");state.watch.push({name,target:+target||0});save();render()};window.removeWatch=i=>{state.watch.splice(i,1);save();render()};

function cleanOCR(s){return (s||"").replace(/[|]/g,"I").replace(/\s+/g," ").trim()}
function guessFromOCR(text){
  const raw=text||"", lines=raw.split(/\n+/).map(cleanOCR).filter(Boolean);
  const number=(raw.match(/\b\d{1,3}\s*\/\s*\d{2,3}\b/)||[])[0]?.replace(/\s/g,"")||"";
  const cert=(raw.match(/\b\d{8,10}\b/)||[])[0]||"";
  const issuer=/\bPSA\b/i.test(raw)?"PSA":/\bBGS|BECKETT\b/i.test(raw)?"BGS":/\bCGC\b/i.test(raw)?"CGC":"";
  const gradeMatch=raw.match(/(?:GEM\s*MT|MINT|NM[- ]?MT|PSA|BGS|CGC|BECKETT)\s*(10(?:\.0)?|9\.5|9|8\.5|8|7\.5|7|6\.5|6|5\.5|5|4\.5|4|3\.5|3|2\.5|2|1\.5|1)\b/i);
  const grading=issuer||"RAW";
  const grade=gradeMatch?gradeMatch[1]:"";
  const year=(raw.match(/\b(19\d{2}|20\d{2})\b/)||[])[0]||"";
  const language=/\bESPAÑOL|SPANISH\b/i.test(raw)?"Español":/\bJAPANESE|JAPON[EÉ]S\b/i.test(raw)?"Japonés":/\bENGLISH\b/i.test(raw)?"Inglés":"";
  const stop=/POK[EÉ]MON|TRAINER|ENERGY|BASIC|STAGE|PSA|GEM|MINT|HP|SVP|ILLUSTRATION|RARE|HOLO|CARD/i;
  lines.find(x=>x.length>=3&&x.length<=28&&!stop.test(x)&&!/^\d/.test(x)&&/^[A-Za-zÀ-ÿ0-9 .\-]+$/.test(x)&&(/[A-Za-zÀ-ÿ]{3,}/.test(x)))||"";
  return {number,cert,grade,grading,gradingEvidence:issuer?"ocr-label":"none",issuerDetected:issuer,year,language,name:""};
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
  const owned=state.cards.find(x=>x.catalogId===c.id),sc=owned?scarcitySignal(owned):null;let finalScore=score;if(sc){analysts.scarcity=sc.score;let sw=Number(state.analystWeights?.scarcity??.12);finalScore=Math.round((score+sc.score*sw)/(1+sw))}return {id:c.id,universe:"pokemon",name:c.name,set:c.set?.name||"",image:c.image?c.image+"/low.webp":"",price:trend,low,avg1:a1,avg7:a7,avg30:a30,momentum1:m1,momentum7:m7,discount,volatility:vol,global,tcgplayer:tcgplayerMarket(c),score:finalScore,risk,scenario12,rarity:c.rarity||"",updated:cm.updated||null,scannedAt:new Date().toISOString(),analysts,scarcity:sc};
}
async function mapLimit(items,limit,fn){
  let out=new Array(items.length),i=0;async function worker(){while(true){let n=i++;if(n>=items.length)return;try{out[n]=await fn(items[n],n)}catch{out[n]=null}}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));return out;
}
async function activeMarketSignals(maxAgeDays=45,universe=currentRadarUniverse()){
  const all=(await marketSignalAll().catch(()=>[])).filter(x=>marketUniverseOf(x)===universe);
  const now=Date.now(),active=[],stale=[];
  for(const x of all){
    const t=new Date(x.scannedAt||x.updated||0).getTime();
    if(t&&now-t<=maxAgeDays*86400000)active.push(x);else stale.push(x);
  }
  return {all,active,stale};
}
async function refreshMarketFreshness(universe=currentRadarUniverse()){
  const q=await activeMarketSignals(45,universe);
  state.coverageByUniverse=state.coverageByUniverse||{};
  const prev=state.coverageByUniverse[universe]||{};
  state.coverageByUniverse[universe]={...prev,priced:q.all.length,active:q.active.length,stale:q.stale.length,at:prev.at||new Date().toISOString()};
  if(universe==="pokemon"){
    state.marketCoverage={...(state.marketCoverage||{}),priced:q.all.length,active:q.active.length,stale:q.stale.length};
  }
  save();return q;
}
function pokemonCatalogRow(c){return {id:"pokemon:"+c.id,sourceId:c.id,universe:"pokemon",name:c.name||"",set:c.set?.name||c.expansion?.name||"",number:c.localId||c.printed_number||c.number||"",image:c.image?c.image+"/low.webp":(c.images?.[0]?.small||""),rarity:c.rarity||"",source:"TCGdex"}}
function lorcanaCatalogRow(c){return {id:"lorcana:"+c.id,sourceId:c.id,universe:"lorcana",name:(c.name||"")+(c.version?" · "+c.version:""),set:c.set?.name||"",number:c.collector_number||"",image:c.image_uris?.digital?.small||c.image_uris?.digital?.normal||"",rarity:c.rarity||"",price:Number(c?.prices?.usd)||Number(c?.prices?.usd_foil)||null,foilPrice:Number(c?.prices?.usd_foil)||null,currency:"USD",source:"Lorcast"}}
let catalogPage=0,catalogPageSize=60,catalogVisibleRows=[],catalogHydrating=false;
async function resolveCatalogCard(row){
  if(!row)return null;
  if(row.universe==="pokemon"){
    const full=await tcgdexCard("en",row.sourceId);if(!full)return row;
    const signal=buildMarketSignal(full),merged={...row,...pokemonCatalogRow(full),price:signal?.price||null,currency:"EUR",marketScore:signal?.score??null,updated:new Date().toISOString()};
    await catalogPutMany([merged]);if(signal)await marketSignalPutMany([signal]);return merged;
  }
  const signals=(await marketSignalAll().catch(()=>[])).filter(x=>x.universe==="lorcana"&&x.sourceId===row.sourceId),signal=signals.sort((a,b)=>(+b.price||0)-(+a.price||0))[0];
  return {...row,price:row.price??signal?.price??null,currency:"USD",marketScore:signal?.score??row.marketScore??null};
}
function renderCatalogDetail(row){
  const box=document.querySelector("#catalogDetail");if(!box)return;if(!row){box.classList.add("hidden");box.innerHTML="";return}
  box.classList.remove("hidden");
  box.innerHTML='<div class="detailTop">'+(row.image?'<img src="'+row.image+'" alt="">':'<div class="catalogNoImg">🃏<small>Sin imagen de fuente</small></div>')+
    '<div><div class="universeBadge '+row.universe+'">'+universeIcon(row.universe)+' '+universeLabel(row.universe)+'</div><h3>'+row.name+'</h3><p>'+[row.set,row.number?("#"+row.number):"",row.rarity].filter(Boolean).join(" · ")+'</p>'+
    '<div class="detailPrice">'+(row.price?money(row.price,row.currency||"EUR"):'Sin precio utilizable todavía')+'</div>'+
    (row.marketScore!=null?'<div class="signal mini">'+row.marketScore+'/100</div>':'')+'</div></div>'+
    '<div class="detailActions"><button id="catalogLoadDetail">Actualizar ficha/precio</button><button id="catalogAddCollection">+ Mi colección</button><button id="catalogAddWatch">Seguir</button></div>'+
    '<small>La ficha se completa bajo demanda para no lanzar decenas de miles de consultas desde el iPhone.</small>';
  document.querySelector("#catalogLoadDetail").onclick=async()=>{const b=document.querySelector("#catalogLoadDetail");b.disabled=true;b.textContent="Actualizando…";const fresh=await resolveCatalogCard(row);renderCatalogDetail(fresh);await refreshCatalogBrowser();};
  document.querySelector("#catalogAddCollection").onclick=()=>addCatalogRowToCollection(row);
  document.querySelector("#catalogAddWatch").onclick=()=>addCatalogRowToWatch(row);
}
function addCatalogRowToCollection(row){
  if(state.cards.some(c=>c.catalogId===row.sourceId&&cardUniverse(c)===row.universe)){alert("Esta carta ya está en tu colección.");return}
  const c={id:crypto.randomUUID(),universe:row.universe,name:row.name,set:row.set||"",number:row.number||"",year:"",language:row.universe==="pokemon"?"Inglés":"",grading:"RAW",grade:"",cert:"",value:+row.price||0,purchase:null,quantity:1,purchaseDate:"",notes:"Añadida desde catálogo",catalogId:row.sourceId,referenceImage:row.image||"",marketPricing:row.price?{value:+row.price,source:row.source||"Catálogo",currency:row.currency||"EUR"}:null,draft:false,icon:"🃏",createdAt:new Date().toISOString()};
  state.cards.push(c);save();render();renderQA();alert("Añadida a Mi colección.");
}
function addCatalogRowToWatch(row){
  if(!state.watch.some(w=>w.catalogId===row.id||w.catalogId===row.sourceId))state.watch.push({name:row.name,target:+row.price||0,catalogId:row.id,source:"Catálogo "+universeLabel(row.universe)});
  save();render();alert("Añadida a Seguimiento.");
}
async function enrichCatalogPage(){
  const btn=document.querySelector("#enrichCatalogPage"),st=document.querySelector("#catalogStatus"),rows=[...catalogVisibleRows];
  if(!rows.length){st.textContent="No hay cartas visibles para analizar.";return}
  btn.disabled=true;let done=0,priced=0;
  st.textContent="Analizando "+rows.length+" cartas visibles…";
  const out=await mapLimit(rows,4,async row=>{const fresh=await resolveCatalogCard(row);done++;if(fresh?.price)priced++;st.textContent="Analizadas "+done+"/"+rows.length+" · con precio "+priced;return fresh});
  await refreshMarketFreshness(document.querySelector("#catalogUniverse")?.value||"pokemon").catch(()=>{});
  await refreshCatalogBrowser();btn.disabled=false;st.textContent="Página analizada: "+done+" fichas · "+priced+" con precio utilizable.";
  return out;
}

async function hydrateVisibleCatalog(rows){
  const st=document.querySelector("#catalogStatus");
  const todo=(rows||[]).filter(x=>x.universe==="pokemon"&&(!x.image||!x.set||!x.number||x.price==null)).slice(0,60);
  if(!todo.length)return;
  let done=0,updated=0;
  if(st)st.textContent="Completando "+todo.length+" fichas visibles…";
  await mapLimit(todo,4,async row=>{
    const fresh=await resolveCatalogCard(row);
    done++;if(fresh&&(fresh.image||fresh.set||fresh.number||fresh.price!=null))updated++;
    if(st)st.textContent="Completando fichas visibles "+done+"/"+todo.length+"…";
    return fresh;
  });
  if(st)st.textContent="Página completada: "+updated+"/"+todo.length+" fichas enriquecidas.";
}
async function refreshCatalogBrowser(reset=false){
  if(reset)catalogPage=0;const u=document.querySelector("#catalogUniverse")?.value||"pokemon",q=norm(document.querySelector("#catalogSearch")?.value||"");
  const all=(await catalogAll().catch(()=>[])).filter(x=>x.universe===u),rows=q?all.filter(x=>norm([x.name,x.set,x.number,x.rarity].join(" ")).includes(q)):all;
  rows.sort((a,b)=>String(a.set).localeCompare(String(b.set))||String(a.number).localeCompare(String(b.number),undefined,{numeric:true})||String(a.name).localeCompare(String(b.name)));
  const pages=Math.max(1,Math.ceil(rows.length/catalogPageSize));catalogPage=Math.min(catalogPage,pages-1);const slice=rows.slice(catalogPage*catalogPageSize,(catalogPage+1)*catalogPageSize);catalogVisibleRows=slice;
  const box=document.querySelector("#catalogResults");if(box){box.innerHTML=slice.length?slice.map((x,i)=>'<article class="catalogCard" data-catalog-index="'+i+'">'+(x.image?'<img src="'+x.image+'" alt="">':'<div class="catalogNoImg">🃏</div>')+'<div><b>'+x.name+'</b><small>'+([x.set,x.number?("#"+x.number):"",x.rarity].filter(Boolean).join(" · ")||"Pulsa para completar ficha")+'</small>'+(x.price?'<strong>'+money(x.price,x.currency||"EUR")+'</strong>':'')+'</div></article>').join(""):'<div class="empty">No hay cartas indexadas para este filtro.</div>';box.querySelectorAll("[data-catalog-index]").forEach(el=>el.onclick=()=>renderCatalogDetail(slice[+el.dataset.catalogIndex]));}
  const info=document.querySelector("#catalogPageInfo");if(info)info.textContent=rows.length?((catalogPage*catalogPageSize+1)+"–"+Math.min((catalogPage+1)*catalogPageSize,rows.length)+" de "+rows.length):"0 cartas";
  const pc=await catalogCount("pokemon").catch(()=>0),lc=await catalogCount("lorcana").catch(()=>0),cc=document.querySelector("#catalogCounts");if(cc)cc.innerHTML='<div><span>Pokémon indexadas</span><b>'+pc.toLocaleString("es-ES")+'</b></div><div><span>Lorcana indexadas</span><b>'+lc.toLocaleString("es-ES")+'</b></div><div><span>Total local</span><b>'+(pc+lc).toLocaleString("es-ES")+'</b></div>';
  if(!catalogHydrating&&catalogVisibleRows.some(x=>x.universe==="pokemon"&&(!x.image||!x.set||!x.number||x.price==null))){catalogHydrating=true;setTimeout(()=>hydrateVisibleCatalog(catalogVisibleRows).then(async()=>{catalogHydrating=false;await refreshCatalogBrowser(false)}).catch(()=>{catalogHydrating=false}),80)}
}
async function indexFullCatalog(){
  const btn=document.querySelector("#indexFullCatalog"),st=document.querySelector("#catalogStatus");btn.disabled=true;
  try{
    st.textContent="Pokémon · cargando índice completo…";const pok=await tcgdexList("en"),prows=(pok||[]).filter(x=>x.id).map(pokemonCatalogRow);
    for(let i=0;i<prows.length;i+=800)await catalogPutMany(prows.slice(i,i+800));state.catalogMeta.pokemon={count:prows.length,at:new Date().toISOString()};
    st.textContent="Lorcana · recorriendo todos los sets…";const sets=await lorcastSets();let lcount=0;
    for(let i=0;i<sets.length;i++){st.textContent="Lorcana · set "+(i+1)+"/"+sets.length+"…";const cards=await lorcastSetCards(sets[i].code),rows=cards.map(lorcanaCatalogRow);lcount+=rows.length;await catalogPutMany(rows);await new Promise(r=>setTimeout(r,70))}
    state.catalogMeta.lorcana={count:lcount,sets:sets.length,at:new Date().toISOString()};save();await refreshCatalogBrowser(true);
    st.textContent="Índice local: "+prows.length.toLocaleString("es-ES")+" Pokémon + "+lcount.toLocaleString("es-ES")+" Lorcana. Precio/señal se enriquece aparte.";
  }catch(e){pushRuntimeError("catalog-index",e?.message||e);st.textContent="Indexado interrumpido. Lo ya guardado se conserva; puedes reintentar."}
  btn.disabled=false;
}
let lorcastSetsCache=null;
async function lorcastSets(){
  if(lorcastSetsCache)return lorcastSetsCache;
  const r=await fetch("https://api.lorcast.com/v0/sets");if(!r.ok)throw new Error("Lorcast sets");
  const j=await r.json();lorcastSetsCache=j.results||[];return lorcastSetsCache;
}
async function lorcastSetCards(code){
  const r=await fetch("https://api.lorcast.com/v0/sets/"+encodeURIComponent(code)+"/cards");if(!r.ok)throw new Error("Lorcast set");
  const j=await r.json();return Array.isArray(j)?j:(j.results||[]);
}
function lorcanaHistoryStats(id,currentPrice){
  const pts=(state.signalHistory||[]).filter(s=>s.id===id&&(+s.price||0)>0).map(s=>({t:new Date(s.at).getTime(),p:+s.price})).filter(x=>Number.isFinite(x.t)).sort((a,b)=>a.t-b.t);
  const unique=[];for(const x of pts){const day=new Date(x.t).toISOString().slice(0,10);if(!unique.some(y=>y.day===day))unique.push({day,t:x.t,p:x.p})}
  const recent=unique.filter(x=>x.t>=Date.now()-90*86400000),first=recent[0],span=first?(Date.now()-first.t)/86400000:0;
  const high=recent.length?Math.max(currentPrice,...recent.map(x=>x.p)):currentPrice,low=recent.length?Math.min(currentPrice,...recent.map(x=>x.p)):currentPrice;
  const momentum=first&&span>=3?clamp(currentPrice/first.p-1,-.5,.5):0;
  return {points:recent.length,spanDays:span,high90:high,low90:low,momentum};
}
function buildLorcanaSignals(c){
  const variants=[["normal",Number(c?.prices?.usd)],["foil",Number(c?.prices?.usd_foil)]],out=[];
  for(const [finish,price] of variants){
    if(!(price>0))continue;
    const id="lorcana:"+c.id+":"+finish,h=lorcanaHistoryStats(id,price),rarity=String(c.rarity||"").toLowerCase();
    const rarityScore=rarity.includes("enchanted")?92:rarity.includes("legendary")?76:rarity.includes("super")?66:rarity.includes("rare")?58:48;
    const dataScore=Math.round(clamp(([c.name,c.set?.name,c.collector_number,c.image_uris?.digital?.small,c.prices,c.tcgplayer_id].filter(Boolean).length/6)*100,0,100));
    const histScore=h.points>=3&&h.spanDays>=3?Math.min(100,55+h.points*5):35;
    const momentum7=h.momentum,discount=h.high90>price?(h.high90-price)/h.high90:0;
    const score=Math.round(clamp(rarityScore*.34+dataScore*.30+histScore*.16+clamp(50+momentum7*120,0,100)*.12+clamp(discount*180,0,100)*.08,0,100));
    const target=(h.points>=3&&h.spanDays>=3&&h.high90>price)?h.high90:price;
    out.push({id,sourceId:c.id,universe:"lorcana",finish,name:(c.name||"")+(c.version?" · "+c.version:"")+(finish==="foil"?" · Foil":""),set:c.set?.name||"",number:c.collector_number||"",image:c.image_uris?.digital?.small||c.image_uris?.digital?.normal||"",price,currency:"USD",low:h.low90,avg1:null,avg7:null,avg30:null,momentum1:0,momentum7,discount,volatility:.18,global:true,tcgplayer:c.tcgplayer_id||null,score,risk:h.points>=3?"Medio":"Datos limitados",scenario12:target,observedTarget:target,historyPoints:h.points,historySpanDays:Math.round(h.spanDays),rarity:c.rarity||"",releaseDate:c.released_at||null,updated:new Date().toISOString(),scannedAt:new Date().toISOString(),source:"Lorcast",catalogOnly:false,analysts:{momentum:Math.round(clamp(50+momentum7*120,0,100)),value:Math.round(clamp(50+discount*140,0,100)),stability:h.points>=3?62:40,global:70,data:dataScore}});
  }
  return out;
}
function buildLorcanaSignal(c){return buildLorcanaSignals(c)[0]||null}
async function fetchLorcanaUniverse(mode){
  const sets=await lorcastSets(),total=sets.length;
  if(!total)return [];
  const perRun=mode==="wide"?Math.min(4,total):Math.min(3,total),start=state.cursorByUniverse.lorcana%total,chosen=[];
  for(let i=0;i<perRun;i++)chosen.push(sets[(start+i)%total]);
  let signals=[];
  for(const st of chosen){
    const cards=await lorcastSetCards(st.code);await catalogPutMany(cards.map(lorcanaCatalogRow));
    signals.push(...cards.flatMap(buildLorcanaSignals));
    await new Promise(r=>setTimeout(r,90));
  }
  if(signals.length)await marketSignalPutMany(signals);
  state.cursorByUniverse.lorcana=(start+chosen.length)%total;
  const all=(await marketSignalAll()).filter(x=>marketUniverseOf(x)==="lorcana");
  const seenSets=Math.min(total,(state.coverageByUniverse.lorcana?.seen||0)+chosen.length);
  state.coverageByUniverse.lorcana={total,seen:seenSets,priced:all.length,active:all.filter(x=>ageDays(x.scannedAt)<=45).length,stale:all.filter(x=>ageDays(x.scannedAt)>45).length,failed:0,at:new Date().toISOString(),unit:"sets"};
  save();
  return all.filter(x=>ageDays(x.scannedAt)<=45).sort((a,b)=>b.score-a.score).slice(0,400);
}

async function fetchMarketUniverse(mode="quick",universe=currentRadarUniverse()){
  if(universe==="lorcana")return fetchLorcanaUniverse(mode);
  const list=await tcgdexList("en"),pool=(list||[]).filter(x=>x.id&&x.name);if(pool.length){await catalogPutMany(pool.map(pokemonCatalogRow));state.catalogMeta.pokemon={count:pool.length,at:new Date().toISOString()};save()}
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
    state.marketCoverage={total,seen,priced,active:fresh.active.length,stale:fresh.stale.length,failed:Object.keys(state.marketFailures).length,at:new Date().toISOString(),cursor:state.marketCursor};state.coverageByUniverse.pokemon=state.marketCoverage;
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
  const u=currentRadarUniverse(),c=u==="pokemon"?(state.coverageByUniverse?.pokemon||state.marketCoverage||{}):(state.coverageByUniverse?.[u]||{}),total=+c.total||0,seen=+c.seen||0,priced=+c.priced||0,active=+c.active||0,stale=+c.stale||0,failed=+c.failed||0,pct=total?seen/total*100:0,unit=c.unit==="sets"?"sets":"elementos";
  box.innerHTML='<div><span>Universo</span><b>'+universeIcon(u)+' '+universeLabel(u)+'</b></div>'+
    '<div><span>Recorridos</span><b>'+seen+(total?' / '+total:'')+' '+unit+'</b></div>'+
    '<div><span>Con precio guardado</span><b>'+priced+'</b></div>'+
    '<div><span>Radar activo ≤45d</span><b>'+active+'</b></div>'+
    '<div><span>Señales antiguas</span><b class="'+(stale?"warn":"")+'">'+stale+'</b></div>'+
    '<div><span>Cobertura</span><b>'+pct.toFixed(1)+'%</b></div>'+
    '<div><span>Fallos</span><b class="'+(failed?"warn":"")+'">'+failed+'</b></div>'+
    '<div class="coverageBar"><i style="width:'+Math.min(100,pct)+'%"></i></div>'+
    '<small>'+(u==="lorcana"?"Lorcast expone todos los sets y cartas; precios actuales se conservan en USD y no se mezclan con EUR.":"TCGdex aporta catálogo y referencias Cardmarket para Pokémon.")+'</small>';
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
  return state.cards.map(c=>({card:c,scarcity:scarcitySignal(c),comps:(c.grading||"RAW")!=="RAW"?marketValueFor(c.name,c.grading,c.grade,c.set||"",cardUniverse(c)):null})).filter(x=>x.scarcity||x.comps);
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
function renderMarketIndex(rows){
  const box=document.querySelector("#marketIndex");if(!box)return;
  if(!rows?.length){box.innerHTML="";return}
  const prices=rows.map(x=>+x.price||0).filter(x=>x>0),scores=rows.map(x=>+x.score||0),positive=rows.filter(x=>(+x.momentum7||0)>0).length;
  const medPrice=prices.length?median(prices):0,medScore=scores.length?median(scores):0;
  box.innerHTML='<div><span>Universo</span><b>'+universeIcon(currentRadarUniverse())+' '+universeLabel(currentRadarUniverse())+'</b></div>'+
    '<div><span>Activos analizados</span><b>'+rows.length+'</b></div>'+
    '<div><span>Señal mediana</span><b>'+Math.round(medScore||0)+'/100</b></div>'+
    '<div><span>Precio mediano</span><b>'+money(medPrice,rows[0]?.currency||"EUR")+'</b></div>'+
    '<div><span>Momentum positivo</span><b>'+Math.round(positive/rows.length*100)+'%</b></div>';
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
      if(cardUniverse(c)!=="pokemon"){let mv=marketValueFor(c.name,c.grading,c.grade,c.set||"",cardUniverse(c));if(mv){c.value=mv.value;c.gradedValuation={...mv,at:new Date().toISOString()};changed++}continue}
      const full=await tcgdexCard("en",c.catalogId);
      if(!full)continue;
      if((c.grading||"RAW")==="RAW"){let p=extractRawPricing(full);if(p){c.value=p.value;c.marketPricing=p;changed++}}
      else{let gv=marketValueFor(c.name,c.grading,c.grade,c.set||"",cardUniverse(c));if(gv){c.value=gv.value;c.gradedValuation={...gv,at:new Date().toISOString()};changed++}}
    }catch{}
  }
  save();render();renderPortfolioRisk();renderReadiness();btn.disabled=false;st.textContent=changed+" valores actualizados de "+checked+" fichas vinculadas.";
}
function evaluateOpportunityAlerts(rows){
  const alerts=[];
  for(const x of rows){
    const zone=buyZone(x),conv=convictionSignal(x),liq=liquiditySignal(x),gate=investmentGate(x),historyOk=marketUniverseOf(x)!=="lorcana"||((+x.historyPoints||0)>=3&&(+x.historySpanDays||0)>=3);
    if(!gate.ok||!historyOk)continue;
    if(conv>=78&&liq>=65&&x.risk!=="Alto"&&zone&&x.price<=zone.high){
      alerts.push({type:"oportunidad",id:x.id,name:x.name,score:x.score,conviction:conv,liquidity:liq,price:x.price,currency:x.currency||"EUR",zone,upside:gate.upside,reason:"Pasa precio, margen absoluto, liquidez, frescura y zona de entrada"});
    }else if(x.discount>=.18&&liq>=65&&x.risk!=="Alto"){
      alerts.push({type:"descuento",id:x.id,name:x.name,score:x.score,conviction:conv,liquidity:liq,price:x.price,currency:x.currency||"EUR",zone,upside:gate.upside,reason:"Descuento relevante con margen absoluto y liquidez suficientes"});
    }
  }
  return alerts.sort((a,b)=>(b.upside-a.upside)||(b.conviction-a.conviction)).slice(0,8);
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
function investmentProfileFor(x){
  const p=state.investmentProfile||{};
  const usd=(x.currency||"EUR")==="USD";
  return {
    min:usd?(+p.minPriceUSD||45):(+p.minPriceEUR||40),
    max:usd?(+p.maxPriceUSD||170):(+p.maxPriceEUR||150),
    upside:usd?(+p.minUpsideUSD||55):(+p.minUpsideEUR||50),
    currency:usd?"USD":"EUR"
  };
}
function modeledUpside(x){
  const base=+x.price||0,target=+x.scenario12||0;
  return target>base?target-base:0;
}
function investmentGate(x){
  const p=investmentProfileFor(x),price=+x.price||0,up=modeledUpside(x),reasons=[];
  if(price<p.min)reasons.push("precio demasiado bajo");
  if(price>p.max)reasons.push("precio por encima del rango");
  if(up<p.upside)reasons.push("beneficio potencial < "+money(p.upside,p.currency));
  return {ok:!reasons.length,profile:p,upside:up,reasons};
}
function renderInvestmentProfile(){
  const host=document.querySelector("#marketPaneToday"),tpl=document.querySelector("#investmentProfileTemplate");if(!host||!tpl)return;
  if(!host.querySelector(".investmentProfile"))host.insertAdjacentHTML("afterbegin",tpl.innerHTML);
  const p=state.investmentProfile||{};
  const a=host.querySelector("#invMinPrice"),b=host.querySelector("#invMaxPrice"),c=host.querySelector("#invMinUpside");
  if(a){a.value=+p.minPriceEUR||40;b.value=+p.maxPriceEUR||150;c.value=+p.minUpsideEUR||50}
  [a,b,c].forEach(el=>{if(el)el.onchange=()=>{
    state.investmentProfile=state.investmentProfile||{};
    state.investmentProfile.minPriceEUR=Math.max(0,+a.value||40);
    state.investmentProfile.maxPriceEUR=Math.max(state.investmentProfile.minPriceEUR,+b.value||150);
    state.investmentProfile.minUpsideEUR=Math.max(0,+c.value||50);
    save();renderTopBuyCandidates(state.marketScan||[]);renderDecisionBoard(state.marketScan||[]);
  }});
}
function topBuyRank(x){
  const d=decisionFor(x),fresh=ageDays(x.updated),data=+x.analysts?.data||0,zone=d.zone,gate=investmentGate(x),historyOk=marketUniverseOf(x)!=="lorcana"||((+x.historyPoints||0)>=3&&(+x.historySpanDays||0)>=3);
  const pokemonEvidence=marketUniverseOf(x)!=="pokemon"||(!!x.global&&data>=80&&[x.avg7,x.avg30,x.low,x.price].filter(v=>v!=null).length>=4);const eligible=gate.ok&&historyOk&&pokemonEvidence&&(+x.price||0)>0&&d.conv>=76&&d.liq>=65&&x.risk!=="Alto"&&fresh<=14&&zone&&x.price<=zone.high&&data>=60;
  const rank=Math.round(d.conv*.33+d.liq*.23+(+x.score||0)*.20+data*.10+clamp((+x.discount||0)*100,0,100)*.07+clamp(gate.upside/Math.max(1,gate.profile.upside)*100,0,100)*.07);
  return {x,d,fresh,data,eligible,rank,gate,historyOk,pokemonEvidence};
}
function cardmarketProductLink(x){
  const key=(marketUniverseOf(x)+"|"+norm(x.name)+"|"+norm(x.set)).toLowerCase();
  const known=[
    [/pokemon\|eevee.*188.*twilight masquerade/,"https://www.cardmarket.com/es/Pokemon/Products/Singles/Twilight-Masquerade/Eevee-V2-TWM188"],
    [/pokemon\|charmander.*168.*151/,"https://www.cardmarket.com/es/Pokemon/Products/Singles/151/Charmander-V2-MEW168"],
    [/pokemon\|magikarp.*203.*paldea evolved/,"https://www.cardmarket.com/en/Pokemon/Products/Singles/Paldea-Evolved/Magikarp-V2-PAL203"],
    [/pokemon\|pikachu ex.*238.*surging sparks/,"https://www.cardmarket.com/en/Pokemon/Products/Singles/Surging-Sparks/Pikachu-ex-V3-SSP238"],
    [/lorcana\|aladdin heroic outlaw.*first chapter/,"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Aladdin-Heroic-Outlaw-V2"],
    [/lorcana\|genie on the job.*first chapter/,"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Genie-On-the-Job-V2"],
    [/lorcana\|elsa spirit of winter.*first chapter/,"https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Elsa-Spirit-of-Winter-V2"]
  ];
  for(const [re,url] of known)if(re.test(key))return url;
  const root=marketUniverseOf(x)==="lorcana"?"https://www.cardmarket.com/es/Lorcana/Cards":"https://www.cardmarket.com/es/Pokemon";
  return root;
}
function authenticityStatus(x){
  if((x.grading||"RAW")==="PSA"&&x.cert&&x.identityVerifiedBy==="user")return {label:"Certificado verificado por ti",level:"high"};
  if(x.source==="Lorcast"||x.global)return {label:"Producto/mercado identificado; autenticidad del ejemplar pendiente",level:"medium"};
  return {label:"Autenticidad del ejemplar no verificable online",level:"low"};
}
function buyRouteLabel(x){
  const g=topBuyRank(x);
  if((x.grading||"RAW")!=="RAW")return "Comprar ya graduada";
  if(g.gate.upside>=g.gate.profile.upside)return "RAW → revisar para PSA";
  return "RAW / conservar";
}
function renderBuyNow(ranked){
  const box=document.querySelector("#buyNowCard");if(!box)return;
  const best=(ranked||[])[0];
  if(!best){box.innerHTML='<div class="buyNow none"><b>COMPRA YA</b><strong>Ninguna validada ahora mismo</strong><span>Prefiero dejarlo vacío antes que señalar una carta sin margen, evidencia o autenticidad suficiente.</span></div>';return}
  const x=best.x,a=authenticityStatus(x),url=cardmarketProductLink(x);
  box.innerHTML='<div class="buyNow"><div class="buyNowFlag">COMPRA YA · candidata #1</div><div class="buyNowMain">'+
    (x.image?'<img src="'+x.image+'" alt="">':'<div class="buyNoImg">🃏</div>')+
    '<div><h3>'+universeIcon(marketUniverseOf(x))+' '+x.name+'</h3><small>'+[x.set,x.rarity,x.finish].filter(Boolean).join(" · ")+'</small>'+
    '<div class="buyRoute">'+buyRouteLabel(x)+'</div><div class="buyMetrics"><span>Precio señal <strong>'+money(x.price,x.currency||"EUR")+'</strong></span><span>Potencial modelado <strong>+'+money(best.gate.upside,x.currency||"EUR")+'</strong></span><span>Conv <strong>'+best.d.conv+'/100</strong></span><span>Liq <strong>'+best.d.liq+'/100</strong></span></div>'+
    '<div class="auth '+a.level+'">Originalidad: '+a.label+'</div></div></div>'+
    '<a class="buyLink" href="'+url+'" target="_blank" rel="noopener">Abrir en Cardmarket</a>'+
    '<small class="buyCaveat">“Compra ya” significa que pasa los filtros cuantitativos de Card Vault. No significa que un ejemplar concreto sea 100% auténtico: eso requiere verificar vendedor, fotos, idioma/versión y, si está graduada, certificado.</small></div>';
}
async function refreshGlobalToday(){
  const box=document.querySelector("#topBuyCandidates"),sum=document.querySelector("#globalTodaySummary");if(!box)return;
  const all=await marketSignalAll().catch(()=>[]),active=all.filter(x=>{const t=new Date(x.scannedAt||x.updated||0).getTime();return t&&Date.now()-t<=45*86400000});
  const scored=active.map(topBuyRank),eligible=scored.filter(o=>o.eligible).sort((a,b)=>b.rank-a.rank),ranked=eligible.slice(0,10);
  const pokemon=active.filter(x=>marketUniverseOf(x)==="pokemon"),lorcana=active.filter(x=>marketUniverseOf(x)==="lorcana");
  if(sum)sum.innerHTML='<div><span>Pokémon activas</span><b>'+pokemon.length+'</b></div><div><span>Lorcana activas</span><b>'+lorcana.length+'</b></div><div><span>Pasan filtro compra</span><b>'+eligible.length+'</b></div>';
  renderBuyNow(ranked);
  if(!ranked.length){
    const near=scored.filter(o=>(+o.x.price||0)>=o.gate.profile.min&&(+o.x.price||0)<=o.gate.profile.max).sort((a,b)=>b.rank-a.rank).slice(0,10);
    box.innerHTML='<div class="buyHead"><h3>Top 10 · vigilancia</h3><span>ninguna pasa todos los filtros</span></div>'+
      (near.length?'<div class="topTenList">'+near.map((o,i)=>'<article class="topTenRow"><b>#'+(i+1)+' '+universeIcon(marketUniverseOf(o.x))+' '+o.x.name+'</b><span>'+money(o.x.price,o.x.currency||"EUR")+'</span><small>'+[...(o.historyOk?[]:["historial insuficiente"]),...(o.pokemonEvidence?[]:["fuentes insuficientes"]),...o.gate.reasons,...o.d.reasons].slice(0,3).join(" · ")+'</small><a href="'+cardmarketProductLink(o.x)+'" target="_blank" rel="noopener">Ver Cardmarket</a></article>').join("")+'</div>':'<div class="empty">Sin candidatas en el rango económico actual.</div>');
    return;
  }
  box.innerHTML='<div class="buyHead"><h3>Top 10 global · Pokémon + Lorcana</h3><span>ordenado por calidad de oportunidad</span></div><div class="topTenList">'+
    ranked.map((o,i)=>{const x=o.x,a=authenticityStatus(x);return '<article class="topTenRow"><div class="topTenThumb">'+(x.image?'<img src="'+x.image+'" alt="">':'🃏')+'</div><div class="topTenBody"><b>#'+(i+1)+' '+universeIcon(marketUniverseOf(x))+' '+x.name+'</b><small>'+[x.set,x.rarity,x.finish].filter(Boolean).join(" · ")+'</small><div>'+buyRouteLabel(x)+'</div><div class="buyMetrics"><span>Precio <strong>'+money(x.price,x.currency||"EUR")+'</strong></span><span>Potencial <strong>+'+money(o.gate.upside,x.currency||"EUR")+'</strong></span><span>Conv <strong>'+o.d.conv+'</strong></span><span>Liq <strong>'+o.d.liq+'</strong></span></div><div class="auth '+a.level+'">'+a.label+'</div></div><a class="buyLink mini" href="'+cardmarketProductLink(x)+'" target="_blank" rel="noopener">Cardmarket</a></article>'}).join("")+'</div>'+
    '<small class="buyFoot">Antes de pagar, comprueba el ejemplar concreto. Card Vault verifica identidad de producto y mercado, pero una foto/listado online no permite certificar al 100% la autenticidad física de una carta RAW.</small>';
}
function renderTopBuyCandidates(rows){
  const box=document.querySelector("#topBuyCandidates");if(!box)return;
  renderInvestmentProfile();
  const all=(rows||[]).map(topBuyRank),ranked=all.filter(o=>o.eligible).sort((a,b)=>b.rank-a.rank).slice(0,3);
  if(!ranked.length){
    const near=all.filter(o=>(+o.x.price||0)>=o.gate.profile.min&&(+o.x.price||0)<=o.gate.profile.max).sort((a,b)=>b.rank-a.rank).slice(0,3);
    box.innerHTML='<div class="buyHead"><h3>Qué mirar hoy</h3><span>Filtro estricto</span></div><div class="buyNone"><b>Ninguna compra cumple hoy el objetivo</b><span>Exijo precio útil, al menos '+money((state.investmentProfile?.minUpsideEUR||50),"EUR")+' de beneficio potencial modelado y suficiente calidad/liquidez. No mostraré cartas de céntimos como compra.</span></div>'+
      (near.length?'<div class="nearMisses"><b>Más cercanas, pero NO pasan el filtro</b>'+near.map(o=>'<div><span>'+o.x.name+' · '+money(o.x.price,o.x.currency||"EUR")+'</span><small>'+[...o.gate.reasons,...o.d.reasons].slice(0,2).join(" · ")+'</small></div>').join("")+'</div>':'');
    return;
  }
  box.innerHTML='<div class="buyHead"><h3>Top 3 candidatas</h3><span>Solo si cumplen el perfil</span></div>'+
    ranked.map((o,i)=>{const x=o.x,z=o.d.zone,why=[];if((+x.momentum7||0)>0)why.push("momentum positivo");if((+x.discount||0)>=.08)why.push("descuento");if(o.d.liq>=75)why.push("liquidez alta");if(o.fresh<=2)why.push("dato reciente");return '<article class="buyPick"><div class="buyRank">#'+(i+1)+'</div>'+(x.image?'<img src="'+x.image+'" alt="">':'<div class="buyNoImg">🃏</div>')+'<div class="buyBody"><b>'+x.name+'</b><small>'+[x.set,x.rarity].filter(Boolean).join(" · ")+'</small><div class="buyReason">'+(why.join(" · ")||"equilibrio sólido")+'</div><div class="buyMetrics"><span>Precio <strong>'+money(x.price,x.currency||"EUR")+'</strong></span><span>Escenario <strong>'+money(x.scenario12,x.currency||"EUR")+'</strong></span><span>Potencial <strong>+'+money(o.gate.upside,x.currency||"EUR")+'</strong></span><span>Máx. zona <strong>'+money(z.high,x.currency||"EUR")+'</strong></span><span>Conv <strong>'+o.d.conv+'/100</strong></span><span>Liq <strong>'+o.d.liq+'/100</strong></span></div></div></article>'}).join("")+
    '<small class="buyFoot">Filtro cuantitativo, no promesa de beneficio. Si el potencial absoluto no llega al objetivo, la carta no aparece aquí aunque cueste céntimos.</small>';
}
function renderDecisionBoard(rows){
  const box=document.querySelector("#decisionBoard");if(!box)return;
  const ranked=rows.map(x=>({x,d:decisionFor(x),g:investmentGate(x)})).sort((a,b)=>b.d.conv-a.d.conv);
  const candidates=ranked.filter(o=>o.d.status==="CANDIDATA"&&o.g.ok).slice(0,8);
  const observe=ranked.filter(o=>o.d.status==="OBSERVAR").slice(0,5);
  box.innerHTML='<h3>Panel de decisión</h3><p class="muted">Filtro objetivo: ninguna etiqueta implica recomendación ni rentabilidad garantizada.</p>'+
    '<div class="decisionGroup"><b>Candidatas por criterios</b>'+(candidates.length?candidates.map(o=>'<div class="decisionRow"><span>'+o.x.name+'</span><strong>'+money(o.x.price,o.x.currency||"EUR")+'</strong><small>Conv '+o.d.conv+' · Liq '+o.d.liq+(o.d.zone?' · zona '+money(o.d.zone.low,o.x.currency||"EUR")+'–'+money(o.d.zone.high,o.x.currency||"EUR"):'')+'</small></div>').join(""):'<div class="empty">Ninguna carta cumple todos los filtros.</div>')+'</div>'+
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
    '<small>La exactitud solo cuenta fotos cuya identidad fue confirmada manualmente por ti antes de la prueba. Resolver una carta desconocida no se contabiliza como acierto.</small>';
}
async function runPhotoValidation(){
  const btn=document.querySelector("#runPhotoValidation"),box=document.querySelector("#photoValidationResults");
  const labeled=state.cards.filter(c=>c.photoKey&&c.catalogId&&c.identityVerifiedAt&&c.identityVerifiedBy==="user").slice(0,5);
  const unlabeled=state.cards.filter(c=>c.photoKey&&!(c.catalogId&&c.identityVerifiedAt&&c.identityVerifiedBy==="user")).slice(0,Math.max(0,5-labeled.length));
  const candidates=[...labeled,...unlabeled];
  if(!candidates.length){box.innerHTML='<p class="muted">No hay fotos guardadas para validar.</p>';return}
  btn.disabled=true;box.innerHTML='<p class="muted">Validando '+candidates.length+' fotos reales sin modificar tu colección…</p>';
  let correct=0,incorrect=0,unresolved=0,labeledTested=0,unlabeledTested=0,unlabeledResolved=0,completed=true,details=[];
  for(const c of candidates){
    try{
      const blob=await photoGet(c.photoKey);if(!blob)continue;
      const expected=c.catalogId||"";
      if(expected)labeledTested++;else unlabeledTested++;
      const r=await Promise.race([analyzeCollectibleFile(blob,cardUniverse(c)),timeoutAfter(22000)]);
      const fresh=cardFromRecognition("__validation__",blob,r,cardUniverse(c));
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
function productCompletionScore(){
  const t=technicalCompletionScore(),pc=state.catalogMeta?.pokemon?.count||0,lc=state.catalogMeta?.lorcana?.count||0,sets=state.catalogMeta?.lorcana?.sets||0;
  const panes=!!document.querySelector("#marketSubnav")&&!!document.querySelector("#pregrade")&&!!document.querySelector("#collection");
  const profile=!!state.investmentProfile&&(+state.investmentProfile.minPriceEUR||0)>=1&&(+state.investmentProfile.minUpsideEUR||0)>=1;
  const checks=[
    {label:"Núcleo técnico",ok:t.score===100},
    {label:"Catálogo Pokémon completo indexado",ok:pc>=20000},
    {label:"Catálogo Lorcana completo indexado",ok:lc>=2500&&sets>=20},
    {label:"Mercado separado en Hoy / Radar / Catálogo",ok:panes},
    {label:"Filtro económico de compra activo",ok:profile},{label:"Top 10 y Compra ya operativos",ok:!!document.querySelector("#buyNowCard")},
    {label:"Pregrado PSA operativo",ok:(state.selfTest?.results||[]).some(x=>x.label==="Pregrado PSA sintético"&&x.ok)},
    {label:"Backup local completo",ok:(state.selfTest?.results||[]).some(x=>x.label==="Backup serializable"&&x.ok)}
  ];
  return {score:Math.round(checks.filter(x=>x.ok).length/checks.length*100),checks};
}
function renderProductCompletion(){
  const box=document.querySelector("#technicalCompletionPanel");if(!box)return;const p=productCompletionScore(),t=technicalCompletionScore();
  box.innerHTML='<h3>Estado de la aplicación V66</h3><div class="readinessScore '+(p.score===100?"complete":"")+'">'+p.score+'%</div>'+
    p.checks.map(x=>'<div class="qaRow"><span>'+x.label+'</span><b class="'+(x.ok?"ok":"warn")+'">'+(x.ok?"OK":"Pendiente")+'</b></div>').join("")+
    '<small>'+(p.score===100?'✅ Aplicación terminada técnicamente al 100%.':'Pulsa «Finalizar app» para completar automáticamente lo que falte.')+' Los datos de tu colección, ventas comparables y población oficial se mantienen como evidencia independiente y no se inventan.</small>'+
    '<div class="qaRow"><span>Autotest técnico</span><b class="'+(t.score===100?"ok":"warn")+'">'+t.score+'%</b></div>';
}function technicalCompletionScore(){
  const self=state.selfTest||{},results=self.results||[],required=["JavaScript cargado","Estado local","IndexedDB fotos","IndexedDB radar","IndexedDB catálogo","Catálogo TCGdex","Catálogo Lorcast","Motor OCR cargado","Procesamiento de imagen","Pregrado PSA sintético","Backup serializable"];
  const pass=required.filter(name=>results.some(x=>x.label===name&&x.ok)).length;
  const integrity=stateIntegrityReport().ok;
  const boot=state.bootInfo?.radarLoaded!==false;
  const bootAt=new Date(state.bootInfo?.at||0).getTime(),runtime=(state.runtimeErrors||[]).filter(x=>new Date(x.at).getTime()>=bootAt&&bootAt>0).length===0;
  const checks=[
    {label:"11/11 autotests",ok:pass===required.length},
    {label:"Integridad local",ok:integrity},
    {label:"Arranque/IndexedDB",ok:boot},
    {label:"Sin errores runtime recientes",ok:runtime},
    {label:"Motor Pokémon",ok:results.some(x=>x.label==="Catálogo TCGdex"&&x.ok)},
    {label:"Motor Lorcana",ok:results.some(x=>x.label==="Catálogo Lorcast"&&x.ok)},
    {label:"Pregrado PSA",ok:results.some(x=>x.label==="Pregrado PSA sintético"&&x.ok)}
  ];
  return {score:Math.round(checks.filter(x=>x.ok).length/checks.length*100),checks,pass,total:required.length};
}

function readinessScore(){
  const photos=state.cards.filter(c=>c.photoKey),identified=photos.filter(c=>!c.draft&&c.recognition?.score>0);
  const signals=state.signalHistory||[],graded=state.market.filter(m=>m.kind==="sold"&&(m.grading||"RAW")!=="RAW"),pop=state.cards.filter(c=>c.popGrade!=null&&c.popSource&&c.popUrl&&c.popCheckedAt);
  const pc=state.coverageByUniverse?.pokemon||state.marketCoverage||{},lc=state.coverageByUniverse?.lorcana||{};
  const allStoredScan=(state.marketScan||[]).length;
  const checks=[
    {k:"code",ok:(state.selfTest?.pass||0)>=11,label:"Autotest técnico 11/11"},
    {k:"market",ok:allStoredScan>=20||(+pc.active||0)>=20||(+lc.active||0)>=20,label:"Market Lab con datos"},
    {k:"pokemonCoverage",ok:(+pc.seen||0)>=120,label:"Pokémon: ≥120 cartas recorridas"},
    {k:"lorcanaCoverage",ok:(+lc.total||0)>0&&(+lc.seen||0)>=(+lc.total||0),label:"Lorcana: todos los sets recorridos"},
    {k:"freshmarket",ok:(+pc.active||0)>=40&&(+lc.active||0)>=20,label:"Radar activo Pokémon ≥40 + Lorcana ≥20"},
    {k:"recognition",ok:(state.photoValidation?.labeledTested||0)>=3&&(state.photoValidation?.accuracy||0)>=.7&&state.photoValidation?.completed===true,label:"Exactitud real ≥70% (≥3 fotos etiquetadas)"},
    {k:"history",ok:signals.length>=50,label:"Histórico ≥50 señales"},
    {k:"graded",ok:graded.length>=4,label:"Comparables graduadas ≥4"},
    {k:"population",ok:pop.length>=1,label:"Población verificada"},
    {k:"backup",ok:(state.selfTest?.results||[]).some(x=>x.label==="Backup serializable"&&x.ok)&&(state.selfTest?.results||[]).some(x=>x.label==="IndexedDB radar"&&x.ok),label:"Backup + radar local"},
    {k:"integrity",ok:stateIntegrityReport().ok,label:"Integridad de datos local"},
    {k:"slab",ok:state.cards.filter(c=>c.recognition?.barcode?.cert&&(c.grading||"RAW")!=="RAW"&&c.recognition?.gradingEvidence!=="ocr-label"&&c.identityVerifiedBy!=="user").length===0,label:"Emisor de slab sin inferencias inseguras"},
    {k:"evidence",ok:marketEvidenceQuality().score>=60,label:"Evidencia de mercado ≥60/100"}
  ];
  return {checks,score:Math.round(checks.filter(x=>x.ok).length/checks.length*100),identified:identified.length,photos:photos.length,coverage:{pokemon:pc,lorcana:lc}};
}
function readinessBlockers(){
  const r=readinessScore();return r.checks.filter(c=>!c.ok).map(c=>{
    if(c.k==="market")return "Haz un escaneo de mercado.";if(c.k==="pokemonCoverage")return "Continúa el escaneo amplio de Pokémon hasta recorrer al menos 120 cartas.";if(c.k==="lorcanaCoverage")return "Continúa Lorcana hasta recorrer todos los sets disponibles.";if(c.k==="freshmarket")return "Mantén al menos 40 señales Pokémon y 20 Lorcana revisadas en los últimos 45 días.";
    if(c.k==="recognition")return "Confirma manualmente la identidad de al menos 3 fotos y alcanza ≥70% de aciertos exactos.";
    if(c.k==="history")return "Acumula al menos 50 señales reales con escaneos.";
    if(c.k==="graded")return "Añade al menos 4 ventas cerradas comparables de cartas graduadas.";
    if(c.k==="population")return "Verifica población oficial de al menos una carta graduada.";
    if(c.k==="code")return "Ejecuta el autotest técnico y supera las 11 de 11 pruebas.";
    if(c.k==="backup")return "Ejecuta el autotest para verificar el backup.";if(c.k==="integrity")return "Pulsa «Revisar y reparar» en Integridad local.";if(c.k==="slab")return "Revisa las cartas graduadas antiguas cuyo emisor se dedujo solo desde un código de barras.";if(c.k==="evidence")return "Añade más ventas cerradas con fecha, moneda y URL de evidencia hasta alcanzar 60/100.";
    return c.label;
  })
}
function renderCertification(){
  const box=document.querySelector("#certificationResults");if(!box)return;const c=state.certification||{},r=readinessScore(),blocks=readinessBlockers(),p=productCompletionScore(),dq=dataQualityScore();
  let head='<div class="certScore '+(p.score===100?"complete":"")+'">'+p.score+'%</div><div class="certSub">Aplicación · Evidencia real '+r.score+'% · Calidad de evidencia '+dq.score+'%</div>';
  if(c.at)head+='<small>Última comprobación: '+new Date(c.at).toLocaleString("es-ES")+'</small>';
  box.innerHTML=head+(p.score===100?'<div class="certDone">✅ Desarrollo de la aplicación completado al 100%.</div>':'')+
    (blocks.length?'<div class="blockers"><b>Evidencia real pendiente (no bloquea que la app esté terminada):</b>'+blocks.map(x=>'<div>• '+x+'</div>').join("")+'</div>':'<div class="certDone">✅ Evidencia real también completa.</div>');
}
async function finalizeApplication(){
  const btn=document.querySelector("#finalizeApp"),st=document.querySelector("#finalizeStatus"),selector=document.querySelector("#radarUniverse");
  btn.disabled=true;st.classList.remove("hidden");const before=selector?.value||"pokemon";
  try{
    st.textContent="1/5 · Autotest completo…";await runSelfTest();
    const pc=await catalogCount("pokemon").catch(()=>0),lc=await catalogCount("lorcana").catch(()=>0);
    if(pc<20000||lc<2500){st.textContent="2/5 · Indexando catálogos completos…";await indexFullCatalog()}
    else st.textContent="2/5 · Catálogos completos ya disponibles.";
    if(selector){
      selector.value="lorcana";const sets=await lorcastSets().catch(()=>[]);let cov=state.coverageByUniverse?.lorcana||{},guard=0;
      while(sets.length&&(+cov.seen||0)<sets.length&&guard<Math.min(sets.length,60)){st.textContent="3/5 · Lorcana "+(+cov.seen||0)+"/"+sets.length+" sets…";await fetchMarketUniverse("wide","lorcana");cov=state.coverageByUniverse?.lorcana||{};guard++}
      selector.value="pokemon";let pCov=state.coverageByUniverse?.pokemon||state.marketCoverage||{},runs=0;
      while((+pCov.active||0)<400&&runs<8){st.textContent="4/5 · Ampliando radar Pokémon…";await fetchMarketUniverse("wide","pokemon");pCov=state.coverageByUniverse?.pokemon||state.marketCoverage||{};runs++}
      selector.value=before;
    }
    st.textContent="5/5 · Validando versión final…";repairStateIntegrity();await refreshMarketFreshness("pokemon");await refreshMarketFreshness("lorcana");await runSelfTest();
    const q=await activeMarketSignals(45,currentRadarUniverse()).catch(()=>({active:[]}));state.marketScan=q.active.sort((a,b)=>b.score-a.score).slice(0,400);state.marketScanUniverse=currentRadarUniverse();
    save();renderMarketScan();renderRadar();renderQA();renderCertification();renderProductCompletion();
    const p=productCompletionScore();st.textContent=p.score===100?"✅ Aplicación terminada al 100% técnico.":"Finalización "+p.score+"% · revisa los pendientes mostrados abajo.";
  }catch(e){pushRuntimeError("finalize",e?.message||e);st.textContent="Finalización interrumpida: "+String(e?.message||e||"error")}
  if(selector)selector.value=before;btn.disabled=false;
}
async function advanceAutomaticCompletion(){
  const btn=document.querySelector("#advanceCompletion"),st=document.querySelector("#completionRunStatus"),selector=document.querySelector("#radarUniverse");
  btn.disabled=true;document.querySelector("#runCertification").disabled=true;st.classList.remove("hidden");
  const before=selector?.value||"pokemon";
  try{
    st.textContent="1/4 · Ejecutando autotests…";await runSelfTest();
    if(selector){
      selector.value="pokemon";
      let pc=state.coverageByUniverse?.pokemon||state.marketCoverage||{},guard=0;
      while((+pc.seen||0)<120&&guard<2){st.textContent="2/4 · Ampliando cobertura Pokémon…";await fetchMarketUniverse("wide","pokemon");pc=state.coverageByUniverse?.pokemon||state.marketCoverage||{};guard++}
      selector.value="lorcana";
      const sets=await lorcastSets().catch(()=>[]);let lc=state.coverageByUniverse?.lorcana||{},remaining=Math.max(0,(sets.length||0)-(+lc.seen||0)),runs=Math.min(remaining,60);
      for(let i=0;i<runs;i++){st.textContent="3/4 · Lorcana set "+(i+1)+"/"+runs+"…";await fetchMarketUniverse("wide","lorcana")}
      selector.value=before;
      const q=await activeMarketSignals(45,currentRadarUniverse());state.marketScan=q.active.sort((a,b)=>b.score-a.score).slice(0,400);state.marketScanUniverse=currentRadarUniverse();
      if(state.marketScan.length)recordSignalSnapshot(state.marketScan);
    }
    st.textContent="4/4 · Verificando integridad y estado…";repairStateIntegrity();await refreshMarketFreshness("pokemon");await refreshMarketFreshness("lorcana");await runSelfTest();
    save();renderCoverage();renderMarketScan();renderProductCompletion();renderReadiness();renderCertification();renderQA();
    const tech=technicalCompletionScore(),real=readinessScore();
    st.textContent="Completado · Técnico "+tech.score+"% · Datos reales "+real.score+"%";
  }catch(e){pushRuntimeError("completion-run",e?.message||e);st.textContent="Proceso interrumpido: "+String(e?.message||e||"error")}
  if(selector)selector.value=before;btn.disabled=false;document.querySelector("#runCertification").disabled=false;
}
async function runCertification(){
  const btn=document.querySelector("#runCertification");btn.disabled=true;btn.textContent="Comprobando…";repairStateIntegrity();renderIntegrity();
  try{await runSelfTest()}catch{}
  try{
    const selector=document.querySelector("#radarUniverse"),before=selector?.value||"pokemon";
    if(selector){
      selector.value="pokemon";await runMarketScan("quick");
      selector.value="lorcana";await runMarketScan("quick");
      selector.value=before;
      const q=await activeMarketSignals(45,currentRadarUniverse());state.marketScan=q.active.sort((a,b)=>b.score-a.score).slice(0,400);state.marketScanUniverse=currentRadarUniverse();
    }
  }catch(e){pushRuntimeError("cert-market",e?.message||e)}
  try{if(state.cards.filter(c=>c.photoKey&&c.catalogId&&c.identityVerifiedAt&&c.identityVerifiedBy==="user").length>=3)await runPhotoValidation()}catch{}
  try{await refreshPortfolioValues()}catch{}
  state.certification={at:new Date().toISOString(),technical:technicalCompletionScore().score,score:readinessScore().score,quality:dataQualityScore().score,marketEvidence:marketEvidenceQuality().score,blockers:readinessBlockers()};save();
  renderProductCompletion();renderCertification();renderReadiness();renderMarketScan();renderQA();
  btn.disabled=false;btn.textContent="Comprobar todo";
}
function renderReadiness(){
  const box=document.querySelector("#readinessPanel");if(!box)return;const r=readinessScore();
  const blocks=readinessBlockers();box.innerHTML='<h3>Evidencia para uso real</h3><div class="readinessScore">'+r.score+'%</div>'+r.checks.map(c=>'<div class="qaRow"><span>'+c.label+'</span><b class="'+(c.ok?'ok':'warn')+'">'+(c.ok?'OK':'Pendiente')+'</b></div>').join("")+(blocks.length?'<div class="nextBlocker"><b>Siguiente bloqueo</b><span>'+blocks[0]+'</span></div>':'<div class="certDone">✅ Lista para el hito V66.</div>')+'<small>Este porcentaje mide evidencia real; no mide si el desarrollo de la app está terminado.</small>';
}
function renderMarketScan(){setupMarketWorkspace();
  renderPortfolioRisk();renderCompare();
  const box=document.querySelector("#marketLeaders");if(!box)return;
  const rows=[...(state.marketScan||[])].sort((a,b)=>b.score-a.score);for(const fn of [()=>renderCoverage(),()=>renderMarketIndex(rows),()=>renderMarketHealth(rows),()=>renderTopBuyCandidates(rows),()=>renderOpportunityAlerts(rows),()=>renderDecisionBoard(rows),()=>renderProvenance(rows),()=>renderSignalPerformance()]){try{fn()}catch(e){pushRuntimeError("market-render",e?.message||e)}}
  if(!rows.length){box.innerHTML='<div class="empty">Pulsa «Escanear mercado» para crear el primer radar cuantitativo.</div>';return}
  box.innerHTML='<div class="marketGrid">'+rows.slice(0,20).map((x,i)=>'<article class="marketAsset">'+(x.image?'<img src="'+x.image+'" alt="">':'')+'<div class="assetBody"><div class="assetTop"><b>#'+(i+1)+' '+universeIcon(marketUniverseOf(x))+' '+x.name+'</b><span class="signal '+(x.score>=75?'hot':x.score>=60?'warm':'')+'">'+x.score+'</span></div><div class="signalLabel">'+signalLabel(x)+'</div><small>'+x.set+(x.rarity?' · '+x.rarity:'')+'</small><div class="assetMetrics"><span>Mercado <b>'+money(x.price,x.currency||"EUR")+'</b></span><span>Riesgo <b>'+x.risk+'</b></span><span>Liquidez <b>'+liquiditySignal(x)+'/100</b></span><span>Convicción <b>'+convictionSignal(x)+'/100</b></span><span>1d <b class="'+(x.momentum1>=0?'up':'down')+'">'+(x.momentum1>=0?'+':'')+(x.momentum1*100).toFixed(1)+'%</b></span><span>7/30d <b class="'+(x.momentum7>=0?'up':'down')+'">'+(x.momentum7>=0?'+':'')+(x.momentum7*100).toFixed(1)+'%</b></span></div><div class="analystStrip"><span>Mom '+(x.analysts?.momentum??0)+'</span><span>Valor '+(x.analysts?.value??0)+'</span><span>Estab '+(x.analysts?.stability??0)+'</span><span>Global '+(x.analysts?.global??0)+'</span><span>Datos '+(x.analysts?.data??0)+'</span>'+(x.analysts?.scarcity!=null?'<span>Escasez '+x.analysts.scarcity+'</span>':'')+'</div><div class="thesis">'+buildThesis(x)+'. Datos: '+freshnessLabel(ageDays(x.updated))+' · '+(buyZone(x)?('zona de compra basada en referencias '+euro(buyZone(x).low)+'–'+euro(buyZone(x).high)+'. '):'')+'Escenario 12m: '+money(x.scenario12,x.currency||"EUR")+' (no es predicción).</div><div class="marketActions"><button class="watchFromMarket" data-watchid="'+x.id+'">Seguir</button><button class="compareMarket" data-compareid="'+x.id+'">'+((state.compare||[]).includes(x.id)?"✓ Comparando":"Comparar")+'</button></div></div></article>').join("")+'</div>';
}
async function continueCoverage(blocks=5){
  const btn=document.querySelector("#continueCoverage"),st=document.querySelector("#marketScanState");
  btn.disabled=true;document.querySelector("#deepScanMarket").disabled=true;
  let completed=0;
  try{
    const u=currentRadarUniverse(),runs=blocks;for(let i=0;i<runs;i++){
      st.textContent="Cobertura "+(i+1)+"/"+runs+" · "+universeLabel(u)+"…";
      await fetchMarketUniverse("wide",u);
      completed++;
      renderCoverage();
      await new Promise(r=>setTimeout(r,180));
    }
    const signals=(await activeMarketSignals(45,currentRadarUniverse())).active.sort((a,b)=>b.score-a.score).slice(0,400);
    state.marketScan=signals;state.marketScanAt=new Date().toISOString();state.marketScanMode="wide";
    recordSignalSnapshot(signals);
    const alerts=evaluateOpportunityAlerts(signals);
    state.alertHistory.push({at:state.marketScanAt,count:alerts.length,ids:alerts.map(a=>a.id)});
    state.alertHistory=state.alertHistory.slice(-30);save();renderMarketScan();renderRadar();snapshotMarketScan("wide");renderScanHistory();renderWatchSummary();renderQA();renderReadiness();
    st.textContent=completed+" bloques completados · "+(state.marketCoverage?.seen||0)+" cartas recorridas";
  }catch(e){st.textContent="Cobertura interrumpida tras "+completed+" bloques. Puedes continuar después."}
  btn.disabled=false;document.querySelector("#deepScanMarket").disabled=false;
}
async function runMarketScan(mode="quick"){
  const btn=mode==="wide"?document.querySelector("#deepScanMarket"):document.querySelector("#scanMarket"),st=document.querySelector("#marketScanState");
  btn.disabled=true;st.textContent=mode==="wide"?"Preparando escaneo amplio…":"Actualizando radar…";
  try{
    const universe=currentRadarUniverse(),cards=await fetchMarketUniverse(mode,universe);
    st.textContent="Analizando "+cards.length+" elementos de "+universeLabel(universe)+"…";renderCoverage();
    const signals=universe==="pokemon"?cards.map(c=>c?.pricing?buildMarketSignal(c):c).filter(x=>x&&Number.isFinite(+x.score)&&(+x.price||0)>0):cards.filter(Boolean);
    if(!signals.length)throw new Error("La fuente no devolvió señales utilizables en esta pasada");
    state.marketScan=signals;state.marketScanAt=new Date().toISOString();state.marketScanMode=mode;state.marketScanUniverse=universe;
    recordSignalSnapshot(signals);const alerts=evaluateOpportunityAlerts(signals);state.alertHistory.push({at:state.marketScanAt,count:alerts.length,ids:alerts.map(a=>a.id)});state.alertHistory=state.alertHistory.slice(-30);
    save();renderMarketScan();renderRadar();refreshGlobalToday().catch(()=>{});snapshotMarketScan(mode);renderScanHistory();renderWatchSummary();
    st.textContent=signals.length+" señales activas · "+new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});renderQA();renderReadiness();
  }catch(e){
    pushRuntimeError("market-scan",e?.message||e);
    const fallback=(await activeMarketSignals(45,currentRadarUniverse()).catch(()=>({active:[]}))).active.sort((a,b)=>b.score-a.score).slice(0,400);
    if(fallback.length){
      state.marketScan=fallback;state.marketScanUniverse=currentRadarUniverse();save();renderMarketScan();renderRadar();
      st.textContent="No se pudo refrescar ahora; mostrando "+fallback.length+" señales guardadas.";
    }else st.textContent="No se pudo refrescar y no hay señales guardadas para este universo.";
  }
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
function marketValueFor(name,grading,grade,setName="",universe="pokemon"){
  const all=state.market.filter(m=>marketUniverseOf(m)===universe&&m.kind==="sold"&&norm(m.name)===norm(name)&&String(m.grading||"")===String(grading||"")&&String(m.grade||"")===String(grade||""));
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

async function imageToCanvas(file,maxW=720){
  const bmp=await createImageBitmap(file),scale=Math.min(1,maxW/bmp.width),cv=document.createElement("canvas");
  cv.width=Math.max(1,Math.round(bmp.width*scale));cv.height=Math.max(1,Math.round(bmp.height*scale));
  const g=cv.getContext("2d");g.drawImage(bmp,0,0,cv.width,cv.height);bmp.close?.();return cv;
}
function regionStats(data,w,h,x0,y0,x1,y1){
  x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(w,Math.ceil(x1));y1=Math.min(h,Math.ceil(y1));
  let n=0,lum=0,lum2=0,white=0,grad=0,prev=null;
  for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){
    const i=(y*w+x)*4,v=.299*data[i]+.587*data[i+1]+.114*data[i+2];
    lum+=v;lum2+=v*v;n++;if(v>238)white++;if(prev!=null)grad+=Math.abs(v-prev);prev=v;
  }
  const mean=lum/Math.max(1,n),variance=Math.max(0,lum2/Math.max(1,n)-mean*mean);
  return {mean,contrast:Math.sqrt(variance),white:white/Math.max(1,n),gradient:grad/Math.max(1,n)};
}
function symmetryScore(a,b){
  const d=Math.abs(a-b)/Math.max(1,(Math.abs(a)+Math.abs(b))/2);return Math.round(clamp(100-d*120,0,100));
}
function psaGradeFromScore(score){
  if(score>=96)return 10;if(score>=91)return 9;if(score>=84)return 8;if(score>=75)return 7;if(score>=66)return 6;
  if(score>=56)return 5;if(score>=46)return 4;if(score>=34)return 3;if(score>=22)return 2;return 1;
}
function psaRange(score,confidence){
  const g=psaGradeFromScore(score),spread=confidence>=80?1:confidence>=60?2:3;
  return {low:Math.max(1,g-spread+1),high:Math.min(10,g)};
}
async function analyzeCornerMacro(file,label){
  const q=await imageQuality(file),cv=await imageToCanvas(file,520),g=cv.getContext("2d"),w=cv.width,h=cv.height,d=g.getImageData(0,0,w,h).data;
  const outer=regionStats(d,w,h,0,0,w,h),inner=regionStats(d,w,h,w*.18,h*.18,w*.82,h*.82);
  const whitening=clamp((outer.white-inner.white)*220,0,35);
  const texture=Math.abs(outer.gradient-inner.gradient);
  const contrastPenalty=clamp((texture-7)*2.2,0,30);
  const focusPenalty=q.score<55?(55-q.score)*.7:0;
  const score=Math.round(clamp(100-whitening-contrastPenalty-focusPenalty,25,100));
  const issues=[];
  if(whitening>10)issues.push("posible blanqueamiento");
  if(contrastPenalty>10)issues.push("posible golpe/irregularidad");
  if(q.score<55)issues.push("macro poco nítido");
  return {label,score,quality:q.score,whitening:Math.round(whitening),texture:Math.round(texture),issues};
}
function cornerAggregate(corners){
  const valid=(corners||[]).filter(Boolean);if(!valid.length)return null;
  const avg=valid.reduce((s,x)=>s+x.score,0)/valid.length;
  const worst=Math.min(...valid.map(x=>x.score));
  const score=Math.round(avg*.55+worst*.45);
  return {score,worst,avg:Math.round(avg),count:valid.length,issues:[...new Set(valid.flatMap(x=>x.issues||[]))]};
}
async function analyzePregradeSide(file,side){
  const q=await imageQuality(file),cv=await imageToCanvas(file,760),g=cv.getContext("2d"),w=cv.width,h=cv.height,d=g.getImageData(0,0,w,h).data;
  const edge=Math.max(8,Math.round(Math.min(w,h)*.055)),corner=Math.max(18,Math.round(Math.min(w,h)*.13));
  const L=regionStats(d,w,h,0,h*.15,edge,h*.85),R=regionStats(d,w,h,w-edge,h*.15,w,h*.85);
  const T=regionStats(d,w,h,w*.15,0,w*.85,edge),B=regionStats(d,w,h,w*.15,h-edge,w*.85,h);
  const tl=regionStats(d,w,h,0,0,corner,corner),tr=regionStats(d,w,h,w-corner,0,w,corner),bl=regionStats(d,w,h,0,h-corner,corner,h),br=regionStats(d,w,h,w-corner,h-corner,w,h);
  const centerLR=symmetryScore(L.gradient,R.gradient),centerTB=symmetryScore(T.gradient,B.gradient);
  const centering=Math.round((centerLR+centerTB)/2);
  const edgeBalance=Math.round((symmetryScore(L.white,R.white)+symmetryScore(T.white,B.white))/2);
  const cornerVals=[tl,tr,bl,br],cornerMean=cornerVals.reduce((s,x)=>s+x.gradient,0)/4;
  const cornerSpread=Math.sqrt(cornerVals.reduce((s,x)=>s+Math.pow(x.gradient-cornerMean,2),0)/4);
  const corners=Math.round(clamp(100-cornerSpread*4-(cornerVals.filter(x=>x.white>.18).length*5),0,100));
  const edges=Math.round(clamp(edgeBalance*.65+Math.min(100,60+((L.gradient+R.gradient+T.gradient+B.gradient)/4)*1.2)*.35,0,100));
  const full=regionStats(d,w,h,w*.08,h*.08,w*.92,h*.92),glarePenalty=clamp((full.white-.08)*180,0,28);
  const surface=Math.round(clamp(94-Math.max(0,full.gradient-24)*1.1-glarePenalty,25,100));
  const focus=Math.round(clamp(q.score,0,100));
  const score=Math.round(centering*.25+corners*.27+edges*.23+surface*.20+focus*.05);
  const issues=[];
  if(centering<88)issues.push("centrado visual mejorable");
  if(corners<88)issues.push("posible desgaste o asimetría en esquinas");
  if(edges<88)issues.push("posible irregularidad/blanqueo en bordes");
  if(surface<88)issues.push("posibles marcas, reflejos o defectos de superficie");
  if(q.score<60)issues.push("foto insuficiente para máxima confianza");
  return {side,q,centering,corners,edges,surface,focus,score,issues,canvas:cv};
}
function paintPregradeOverlay(src,target,analysis){
  const ctx=target.getContext("2d"),w=src.width,h=src.height;target.width=w;target.height=h;ctx.drawImage(src,0,0);
  ctx.lineWidth=Math.max(2,Math.round(Math.min(w,h)*.006));ctx.strokeStyle="rgba(255,80,80,.9)";
  const c=Math.round(Math.min(w,h)*.13),e=Math.round(Math.min(w,h)*.055);
  ctx.strokeRect(1,1,c,c);ctx.strokeRect(w-c-1,1,c,c);ctx.strokeRect(1,h-c-1,c,c);ctx.strokeRect(w-c-1,h-c-1,c,c);
  ctx.strokeStyle="rgba(255,210,80,.9)";ctx.strokeRect(e,e,w-2*e,h-2*e);
}
function calculateGradingEconomics(){
  const v=id=>Math.max(0,+document.querySelector(id)?.value||0),buy=v("#gradeBuyPrice"),buyShip=v("#gradeBuyShip"),gradeCost=v("#gradeCost"),psa9=v("#gradePSA9"),psa10=v("#gradePSA10"),sellFeePct=clamp(v("#gradeSellFee"),0,50);
  const fixed=buy+buyShip+gradeCost,net=sale=>sale*(1-sellFeePct/100)-fixed,profit9=net(psa9),profit10=net(psa10),goal=+(state.investmentProfile?.minUpsideEUR||50);
  state.gradingEconomics={buy,buyShip,gradeCost,psa9,psa10,sellFeePct};save();
  const last=(state.pregradeHistory||[]).at(-1),box=document.querySelector("#gradingEconomicsResult");if(!box)return;
  let verdict="Necesita PSA 10 para justificar la operación",cls="warn";
  if(profit9>=goal){verdict="Incluso PSA 9 supera el objetivo de beneficio";cls="ok"}
  else if(profit10>=goal){verdict="Solo compensa si alcanza PSA 10";cls="warn"}
  else{verdict="No alcanza el objetivo ni con PSA 10";cls="bad"}
  const photo=last?(' · Pregrado fotográfico PSA '+last.range.low+'–'+last.range.high):'';
  box.innerHTML='<div class="gradeEconHero '+cls+'"><b>'+verdict+'</b><span>Coste total antes de venta '+euro(fixed)+photo+'</span></div>'+
    '<div class="gradeEconRows"><div><span>Si obtiene PSA 9</span><b class="'+(profit9>=goal?"ok":"warn")+'">'+(profit9>=0?"+":"")+euro(profit9)+'</b></div>'+
    '<div><span>Si obtiene PSA 10</span><b class="'+(profit10>=goal?"ok":"warn")+'">'+(profit10>=0?"+":"")+euro(profit10)+'</b></div>'+
    '<div><span>Objetivo mínimo</span><b>'+euro(goal)+'</b></div></div>'+
    '<small>No asigna probabilidades de nota. Usa el Pregrado PSA para descartar copias débiles y confirma los precios de venta con ventas cerradas antes de enviar.</small>';
  return {profit9,profit10,fixed,goal};
}
function hydrateGradingEconomics(){
  const g=state.gradingEconomics||{};const map={gradeBuyPrice:g.buy,gradeBuyShip:g.buyShip,gradeCost:g.gradeCost,gradePSA9:g.psa9,gradePSA10:g.psa10,gradeSellFee:g.sellFeePct};
  for(const [id,val] of Object.entries(map)){const el=document.querySelector("#"+id);if(el&&val!=null)el.value=val}
  calculateGradingEconomics();
}
function renderPregradeHistory(){
  const box=document.querySelector("#pregradeHistory");if(!box)return;const h=[...(state.pregradeHistory||[])].reverse().slice(0,5);
  box.innerHTML='<h3>Últimos pregrados</h3>'+(h.length?h.map(x=>'<div class="qaRow"><span>'+new Date(x.at).toLocaleString("es-ES")+'</span><b>PSA '+x.range.low+'–'+x.range.high+' · '+x.overall+'/100 · '+x.confidence+'%</b></div>').join(""):'<p class="muted">Aún no hay análisis guardados.</p>');
}
function renderPregradeReport(r){
  const box=document.querySelector("#pregradeResult");if(!box)return;
  const rows=[["Centrado",r.centering],["Esquinas",r.corners],["Bordes",r.edges],["Superficie",r.surface]];
  box.innerHTML='<div class="pregradeHero"><span>Pregrado estimado</span><strong>PSA '+r.range.low+'–'+r.range.high+'</strong><small>Confianza fotográfica '+r.confidence+'% · '+(r.cornerCount||0)+'/4 macros de esquina</small></div>'+
    '<div class="gradeBreakdown">'+rows.map(([n,v])=>'<div><span>'+n+'</span><b>'+v+'/100</b><i><em style="width:'+v+'%"></em></i></div>').join("")+'</div>'+
    '<div class="gradeNotes"><b>Hallazgos</b>'+(r.issues.length?r.issues.map(x=>'<div>• '+x+'</div>').join(""):'<div>• No se detectan defectos evidentes en estas fotografías.</div>')+'</div>'+
    '<div class="gradeNotes"><b>Lectura</b><div>El rango es una estimación visual. Defectos microscópicos, presión, indentaciones, alteraciones, autenticidad o daños invisibles en foto pueden cambiar el grado oficial.</div></div>';
}
async function runPSAPregrade(){
  const front=document.querySelector("#psaFront")?.files?.[0],back=document.querySelector("#psaBack")?.files?.[0],btn=document.querySelector("#runPregrade"),st=document.querySelector("#pregradeStatus");
  const cornerFiles=[
    ["Sup. izq.",document.querySelector("#psaCornerTL")?.files?.[0]],
    ["Sup. der.",document.querySelector("#psaCornerTR")?.files?.[0]],
    ["Inf. izq.",document.querySelector("#psaCornerBL")?.files?.[0]],
    ["Inf. der.",document.querySelector("#psaCornerBR")?.files?.[0]]
  ];
  if(!front){st.textContent="Añade al menos una foto frontal.";return}
  btn.disabled=true;st.textContent="Analizando centrado, esquinas, bordes y superficie…";
  try{
    const f=await analyzePregradeSide(front,"front"),b=back?await analyzePregradeSide(back,"back"):null;
    const corners=[];
    for(const [label,file] of cornerFiles)if(file)corners.push(await analyzeCornerMacro(file,label));
    const cornerAgg=cornerAggregate(corners);
    paintPregradeOverlay(f.canvas,document.querySelector("#pregradeFrontCanvas"),f);
    const bc=document.querySelector("#pregradeBackCanvas");if(b)paintPregradeOverlay(b.canvas,bc,b);else{bc.width=1;bc.height=1}
    const hasBack=!!b,weightFront=hasBack?.58:1,weightBack=hasBack?.42:0;
    const centering=Math.round(f.centering*(hasBack?.58:1)+(b?.centering||0)*(hasBack?.42:0));
    const cornerBase=Math.round(f.corners*weightFront+(b?.corners||0)*weightBack);
    const cornersScore=cornerAgg?Math.round(cornerBase*.35+cornerAgg.score*.65):cornerBase;
    const edges=Math.round(f.edges*weightFront+(b?.edges||0)*weightBack),surface=Math.round(f.surface*weightFront+(b?.surface||0)*weightBack);
    let overall=Math.round(centering*.22+cornersScore*.30+edges*.23+surface*.25);
    const minQuality=Math.min(f.q.score,b?.q.score??f.q.score,...corners.map(x=>x.quality));
    let confidence=Math.round(clamp((b?60:42)+(corners.length*6)+minQuality*.22,35,98));
    if(!b)confidence=Math.min(confidence,68);
    if(corners.length<4)confidence=Math.min(confidence,82);
    if(minQuality<50)overall=Math.min(overall,88);
    const range=psaRange(overall,confidence);
    const issues=[...new Set([...(f.issues||[]),...(b?.issues||[]),...(cornerAgg?.issues||[])])];
    const report={at:new Date().toISOString(),overall,centering,corners:cornersScore,edges,surface,confidence,range,issues,frontQuality:f.q.score,backQuality:b?.q.score??null,cornerCount:corners.length,cornerMacro:corners};
    state.pregradeHistory=state.pregradeHistory||[];state.pregradeHistory.push(report);state.pregradeHistory=state.pregradeHistory.slice(-20);save();
    renderPregradeReport(report);renderCornerDetail(report);renderPregradeHistory();calculateGradingEconomics();st.textContent="Análisis completado.";
  }catch(e){st.textContent="No se pudo completar el análisis. Usa fotos más rectas, nítidas y sin reflejos.";pushRuntimeError("pregrade",e?.message||e)}
  btn.disabled=false;
}
function renderCornerDetail(r){
  const box=document.querySelector("#cornerDetail");if(!box)return;const rows=r.cornerMacro||[];
  if(!rows.length){box.innerHTML='<h3>Macros de esquinas</h3><p class="muted">Sin macros. Añadir las 4 esquinas aumenta bastante la confianza del pregrado.</p>';return}
  box.innerHTML='<h3>Macros de esquinas</h3>'+rows.map(x=>'<div class="qaRow"><span>'+x.label+'</span><b class="'+(x.score>=88?"ok":x.score>=75?"":"warn")+'">'+x.score+'/100</b></div>').join("")+
    '<small>Se pondera más la peor esquina para evitar que tres esquinas buenas oculten una dañada.</small>';
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
  const box=document.querySelector("#batchStatus");if(!box)return;let withPhoto=state.cards.filter(c=>c.photoKey),pending=withPhoto.filter(c=>c.draft),good=withPhoto.filter(c=>(c.recognition?.quality?.score||0)>=55),codes=withPhoto.filter(c=>c.recognition?.barcode?.cert),issuer=withPhoto.filter(c=>c.recognition?.gradingEvidence==="ocr-label");
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
function signalToCandidate(x){
  return {id:x.id,name:x.name||"",number:x.number||"",localId:x.number||"",printed_number:x.number||"",set:{name:x.set||"",releaseDate:(x.updated||"").slice(0,10)},expansion:{name:x.set||"",releaseDate:(x.updated||"").slice(0,10)},image:x.image||"",images:x.image?[{small:x.image,medium:x.image,large:x.image}]:[],_lang:"",_universe:x.universe||"pokemon",_currency:x.currency||"EUR",_price:x.price||0};
}
function genericCandidateScore(x,g,tokens){
  let score=0,gn=normNum((g.number||"").split("/")[0]),xn=normNum(x.number||"");
  if(gn&&xn&&gn===xn)score+=70;
  const nameScore=tokenScore((tokens||[]).join(" "),x.name||"");
  const setScore=tokenScore((tokens||[]).join(" "),x.set||"");
  score+=nameScore*24+setScore*6;
  return score;
}
async function analyzeNonPokemonFile(file,universe){
  const [barcode,quality]=await Promise.all([detectSlabCode(file),imageQuality(file).catch(()=>null)]);
  if(!window.Tesseract)throw new Error("OCR no disponible");
  const passes=[["full",900,9000],["bottom",700,7000],["label",700,6500]],texts=[],numbers=[];
  let gBest=null;
  for(const [region,max,ms] of passes){
    try{
      const blob=await imageCropBlob(file,region,max,.76),res=await Promise.race([Tesseract.recognize(blob,"eng"),timeoutAfter(ms)]),text=res?.data?.text||"";
      texts.push(text);numbers.push(...extractNumberCandidates(text));const g=guessFromOCR(text);
      if(!gBest||(!gBest.number&&g.number)||(!gBest.cert&&g.cert))gBest={...(gBest||{}),...g};
    }catch{}
  }
  const merged=texts.join("\n"),tokens=ocrNameTokens(merged),g={...(gBest||guessFromOCR(merged))};
  if(numbers[0])g.number=numbers[0];
  if(barcode?.cert){g.cert=barcode.cert;g.certEvidence="barcode"}else if(g.cert)g.certEvidence="ocr";
  if(!g.issuerDetected){g.grading="RAW";g.gradingEvidence="none"}
  let pool=(await marketSignalAll().catch(()=>[])).filter(x=>marketUniverseOf(x)===universe);
  const ranked=pool.map(x=>({x,score:genericCandidateScore(x,g,tokens)})).filter(r=>r.score>=10).sort((a,b)=>b.score-a.score).slice(0,12);
  const found=ranked.map(r=>signalToCandidate(r.x));
  let visual=[];if(found.length>1)visual=await visualMatchCandidates(file,found);
  if(visual.length)found.sort((a,b)=>(visual.find(v=>v.c.id===b.id)?.visual||0)-(visual.find(v=>v.c.id===a.id)?.visual||0));
  return {g,found,best:found[0]||null,debug:{passes:texts.length,numbers:[...new Set(numbers)],tokens,barcode,quality,visual:visual.map(v=>({id:v.c.id,score:v.visual})),universe}};
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
  let g={...(gBest||guessFromOCR(mergedText))};if(allNumbers[0])g.number=allNumbers[0];if(barcode?.cert){g.cert=barcode.cert;g.certEvidence="barcode";}else if(g.cert){g.certEvidence="ocr";}if(!g.issuerDetected){g.grading="RAW";g.gradingEvidence="none"}
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
async function analyzeCollectibleFile(file,universe="pokemon"){return universe==="lorcana"?analyzeNonPokemonFile(file,"lorcana"):analyzeCardFile(file)}

function cardFromRecognition(id,blob,r,universe="pokemon"){
  const g=r.g||{}, exact=(r.found||[]).filter(c=>normNum(c.localId||c.printed_number||c.number)===normNum((g.number||"").split("/")[0]));
  const ranked=(r.found||[]),top=ranked[0],second=ranked[1],topScore=top?candidateTextScore(top,r.debug?.tokens||[]):0,secondScore=second?candidateTextScore(second,r.debug?.tokens||[]):0,visTop=r.debug?.visual?.find(v=>v.id===top?.id)?.score||0,visSecond=r.debug?.visual?.find(v=>v.id===second?.id)?.score||0;const c=exact.length===1?exact[0]:(top&&((topScore>=16&&topScore-secondScore>=8)||(visTop>=72&&visTop-visSecond>=8))?top:null), confident=!!c, img=c?.images?.[0], name=confident?(c.name||"Carta identificada"):"Carta por identificar",grading=g.grading||"RAW",grade=g.grade||"";
  const mv=confident?marketValueFor(name,grading,grade,"",universe):null;
  let result={id,universe,name,set:confident?(c.set?.name||c.expansion?.name||""):"",number:confident?(c.localId||c.printed_number||c.number||g.number||""):(g.number||""),year:confident?String(c.set?.releaseDate||c.expansion?.release_date||c.expansion?.releaseDate||g.year||"").slice(0,4):(g.year||""),language:confident?(c._lang==="es"?"Español":c._lang==="en"?"Inglés":(c.language_code||c.language||g.language||"")):(g.language||""),grading,grade,cert:g.cert||"",value:mv?.value||0,valueEvidence:mv?.count||0,purchase:null,quantity:1,purchaseDate:"",catalogId:confident?(c.id||""):"",referenceImage:img?(img.large||img.medium||img.small||""):"",photoKey:id,photoURL:URL.createObjectURL(blob),icon:"🃏",draft:!confident,recognition:{score:confident?(exact.length===1?100:(visTop>=72?92:88)):0,source:confident?(exact.length===1?"collector-number":visTop>=72?"collector-number+visual":"collector-number+name-tokens"):"pending",passes:r.debug?.passes||0,candidates:(r.found||[]).length,visualScore:visTop||0,barcode:r.debug?.barcode||null,quality:r.debug?.quality||null,gradingEvidence:g.gradingEvidence||"none",certEvidence:g.certEvidence||"",issuerDetected:g.issuerDetected||"",at:new Date().toISOString()},createdAt:new Date().toISOString()};if(confident&&universe==="pokemon")applyCatalogPricing(result,c);else if(confident&&c._price){result.value=+c._price||0;result.marketPricing={value:+c._price||0,source:"Lorcast",currency:c._currency||"USD"};}return result
}
async function recognizeSavedCard(card,file){
  try{
    const universe=cardUniverse(card),r=await analyzeCollectibleFile(file,universe),fresh=cardFromRecognition(card.id,file,r,universe);
    if(!fresh.draft){
      const keep={purchase:card.purchase,quantity:card.quantity||1,purchaseDate:card.purchaseDate||"",notes:card.notes||"",photoKey:card.photoKey,photoURL:card.photoURL,identityVerifiedAt:card.identityVerifiedAt||null,identityVerifiedBy:card.identityVerifiedBy||null};
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
  if(g.grading&&g.grading!=="RAW"&&g.gradingEvidence==="ocr-label")form.elements.grading.value=g.grading;
  if(g.grade)form.elements.grade.value=g.grade;
  if(g.cert)form.elements.cert.value=g.cert;
  const img=(c.images||[])[0]; if(img) form.dataset.referenceImage=img.large||img.medium||img.small||""; else if(c.image) form.dataset.referenceImage=c._universe&&c._universe!=="pokemon"?c.image:c.image+"/high.webp";const u=form.elements.universe?.value||"pokemon",rp=u==="pokemon"?extractRawPricing(c):(c._price?{value:+c._price,source:"Lorcast",currency:c._currency||"USD"}:null);if(form.elements.grading.value==="RAW"&&rp){form.elements.value.value=rp.value;form.dataset.marketPricing=JSON.stringify(rp);showMarketHint({marketPricing:rp})}else{delete form.dataset.marketPricing;showMarketHint(null)}
}
async function scanCardFile(file){
  const st=document.querySelector("#scanStatus"),box=document.querySelector("#autoMatch");
  st.textContent="Leyendo número de colección, grado y certificado…";box.classList.add("hidden");box.innerHTML="";
  try{
    const universe=form.elements.universe?.value||"pokemon",r=await analyzeCollectibleFile(file,universe),g=r.g,exact=r.found.filter(c=>normNum(c.localId||c.printed_number||c.number)===normNum((g.number||"").split("/")[0]));
    if(form.elements.grading&&g.grading&&g.grading!=="RAW"&&g.gradingEvidence==="ocr-label")form.elements.grading.value=g.grading;
    for(const k of ["number","year","language","cert"])if(g[k]&&form.elements[k])form.elements[k].value=g[k];if(g.grade&&g.gradingEvidence==="ocr-label"&&form.elements.grade)form.elements.grade.value=g.grade;
    if(exact.length===1){
      applyCandidate(exact[0],g);form.dataset.recognitionScore=100;delete form.dataset.truthVerified;document.querySelector("#confirmIdentity").classList.remove("hidden");document.querySelector("#confirmIdentity").textContent="✓ Confirmar que esta identidad es correcta";
      st.textContent="✅ Coincidencia automática por número "+g.number+". Confírmala si la imagen es correcta.";return;
    }
    const choices=exact.length?exact:r.found;
    if(choices.length){
      st.textContent=(g.number?"Número leído: "+g.number+". ":"")+"Elige la imagen correcta:";
      box.innerHTML=choices.slice(0,8).map((c,i)=>{let im=c.images?.[0]?.small||c.images?.[0]?.medium||"";return '<button type="button" class="candidateCard" data-match="'+i+'">'+(im?'<img src="'+im+'" alt="">':'')+'<span><b>'+(c.name||"Carta")+'</b><small>'+(c.printed_number||c.number||"")+' · '+(c.expansion?.name||"")+'</small></span></button>'}).join("");
      box.classList.remove("hidden");
      box.querySelectorAll("[data-match]").forEach(b=>b.onclick=()=>{applyCandidate(choices[+b.dataset.match],g);form.dataset.recognitionScore=exact.length?95:80;form.dataset.truthVerified="1";document.querySelector("#confirmIdentity").classList.remove("hidden");document.querySelector("#confirmIdentity").textContent="✓ Identidad confirmada";box.classList.add("hidden");st.textContent="✅ Carta seleccionada por ti. Pulsa «Guardar carta»."});
      return;
    }
    form.elements.name.value="";
    st.textContent=g.number?"⚠️ He leído "+g.number+", pero no encontré una coincidencia en el catálogo.":"⚠️ No he podido leer el número de colección. Usa una foto más cercana y recta del frontal.";
  }catch(e){st.textContent="⚠️ El reconocimiento no ha podido completarse. Prueba otra foto frontal."}
}

const dlg=document.querySelector("#cardDialog"),form=document.querySelector("#cardForm"),del=document.querySelector("#deleteCard");form.elements.universe.onchange=()=>{delete form.dataset.catalogId;delete form.dataset.referenceImage;delete form.dataset.marketPricing;delete form.dataset.truthVerified;document.querySelector("#autoMatch").classList.add("hidden");document.querySelector("#confirmIdentity").classList.add("hidden");showMarketHint(null);document.querySelector("#scanStatus").textContent="Universo cambiado. Selecciona o vuelve a analizar la foto."};document.querySelector("#cardPhoto").onchange=async e=>{let f=e.target.files?.[0];if(f){showPhotoQuality(await imageQuality(f).catch(()=>null));document.querySelector("#scanStatus").textContent="Analizando foto…";await scanCardFile(f)}};document.querySelector("#cardCamera").onchange=async e=>{let f=e.target.files?.[0];if(f){try{let dt=new DataTransfer();dt.items.add(f);document.querySelector("#cardPhoto").files=dt.files}catch{}showPhotoQuality(await imageQuality(f).catch(()=>null));document.querySelector("#scanStatus").textContent="Analizando foto…";await scanCardFile(f)}};document.querySelector("#addCard").onclick=()=>{editId=null;form.reset();form.elements.universe.value=document.querySelector("#collectionUniverse")?.value||"pokemon";delete form.dataset.referenceImage;delete form.dataset.marketPricing;delete form.dataset.catalogId;delete form.dataset.recognitionScore;delete form.dataset.truthVerified;showMarketHint(null);document.querySelector("#scanStatus").textContent="Elige una foto de tu galería o haz una nueva.";document.querySelector("#autoMatch").classList.add("hidden");showPhotoQuality(null);document.querySelector("#retryRecognition").classList.add("hidden");document.querySelector("#confirmIdentity").classList.add("hidden");del.classList.add("hidden");dlg.showModal()};window.editCard=id=>{let x=state.cards.find(c=>c.id===id);if(!x)return;editId=id;form.dataset.referenceImage=x.referenceImage||"";form.dataset.catalogId=x.catalogId||"";if(x.identityVerifiedAt)form.dataset.truthVerified="1";else delete form.dataset.truthVerified;let ci=document.querySelector("#confirmIdentity");if(x.catalogId){ci.classList.remove("hidden");ci.textContent=x.identityVerifiedAt?"✓ Identidad confirmada":"✓ Confirmar que esta identidad es correcta"}else ci.classList.add("hidden");document.querySelector("#scanStatus").textContent="Puedes cambiar la foto para volver a identificarla.";for(const k of ["universe","name","number","year","set","grading","grade","language","cert","value","purchase","quantity","purchaseDate","notes","popGrade","popHigher","popTotal","popSource","popUrl","popCheckedAt"])if(form.elements[k])form.elements[k].value=x[k]??"";if((x.grading||"RAW")!=="RAW"){let gv=marketValueFor(x.name,x.grading,x.grade);if(gv){form.elements.value.value=gv.value;let mb=document.querySelector("#marketHint");mb.innerHTML="<b>Valoración "+x.grading+" "+(x.grade||"")+"</b><span>"+euro(gv.value)+" · "+gv.count+" ventas cerradas · confianza "+gv.confidence+"</span>";mb.classList.remove("hidden")}else showMarketHint(null)}else showMarketHint(x);showPhotoQuality(x.recognition?.quality||null);if(x.photoKey)document.querySelector("#retryRecognition").classList.remove("hidden");else document.querySelector("#retryRecognition").classList.add("hidden");del.classList.remove("hidden");dlg.showModal()};document.querySelector("#retryRecognition").onclick=async()=>{if(!editId)return;let c=state.cards.find(x=>x.id===editId);if(!c?.photoKey)return;let b=await photoGet(c.photoKey);if(!b)return;let st=document.querySelector("#scanStatus"),btn=document.querySelector("#retryRecognition");btn.disabled=true;st.textContent="Reanalizando foto con varios recortes…";let ok=await recognizeSavedCard(c,b);btn.disabled=false;if(ok){st.textContent="✅ Identificación completada.";for(const k of ["name","number","year","set","grading","grade","language","cert","value"])if(form.elements[k])form.elements[k].value=c[k]??"";showMarketHint(c)}else st.textContent="No hay coincidencia suficientemente segura todavía."};
document.querySelector("#confirmIdentity").onclick=()=>{
  if(!form.dataset.catalogId){document.querySelector("#scanStatus").textContent="Primero identifica o selecciona una carta del catálogo.";return}
  form.dataset.truthVerified="1";
  const b=document.querySelector("#confirmIdentity");b.textContent="✓ Identidad confirmada";
  document.querySelector("#scanStatus").textContent="Identidad marcada como correcta. Guarda la carta para usarla como referencia de validación.";
};
document.querySelector("#saveCard").onclick=async e=>{e.preventDefault();let f=new FormData(form),file=f.get("photo"),cameraFile=document.querySelector("#cardCamera")?.files?.[0],id=editId||crypto.randomUUID(),old=state.cards.find(x=>x.id===id)||{};if((!file||!file.size)&&cameraFile)file=cameraFile;if(!editId&&(!file||!file.size)){document.querySelector("#scanStatus").textContent="Selecciona una foto primero.";return}let x={...old,id,universe:f.get("universe")||old.universe||"pokemon",name:f.get("name")||old.name||"Carta por identificar",set:f.get("set")||old.set||"",grading:f.get("grading")||old.grading||"RAW",grade:f.get("grade")||old.grade||"",number:f.get("number")||old.number||"",year:f.get("year")||old.year||"",language:f.get("language")||old.language||"",value:+f.get("value")||old.value||0,cert:f.get("cert")||old.cert||"",purchase:f.get("purchase")===""?(old.purchase??null):+f.get("purchase"),quantity:Math.max(1,+f.get("quantity")||old.quantity||1),purchaseDate:f.get("purchaseDate")||old.purchaseDate||"",notes:f.get("notes")||old.notes||"",popGrade:f.get("popGrade")===""?(old.popGrade??null):+f.get("popGrade"),popHigher:f.get("popHigher")===""?(old.popHigher??null):+f.get("popHigher"),popTotal:f.get("popTotal")===""?(old.popTotal??null):+f.get("popTotal"),popSource:f.get("popSource")||old.popSource||"",popUrl:f.get("popUrl")||old.popUrl||"",popCheckedAt:f.get("popCheckedAt")||old.popCheckedAt||"",catalogId:form.dataset.catalogId||old.catalogId||"",referenceImage:form.dataset.referenceImage||old.referenceImage||"",marketPricing:form.dataset.marketPricing?JSON.parse(form.dataset.marketPricing):old.marketPricing||null,draft:form.dataset.catalogId?false:(old.draft??true),identityVerifiedAt:form.dataset.truthVerified==="1"?(old.identityVerifiedAt||new Date().toISOString()):(old.identityVerifiedAt||null),identityVerifiedBy:form.dataset.truthVerified==="1"?"user":(old.identityVerifiedBy||null),icon:old.icon||"🃏"};if(x.identityVerifiedAt){x.recognition={...(old.recognition||{}),score:100,source:"user-confirmed-catalog",at:new Date().toISOString()}}let savedBlob=null;if(file&&file.size){savedBlob=await resizeBlob(file);x.photoKey=id;delete x.photo;delete x.photoURL;await photoPut(id,savedBlob);x.photoURL=URL.createObjectURL(savedBlob)}if(editId)state.cards=state.cards.map(c=>c.id===id?x:c);else state.cards.push(x);save();render();form.reset();editId=null;dlg.close();storageStatus();if(savedBlob){let st=document.querySelector("#repairStatus");st.classList.remove("hidden");st.textContent="Foto guardada. La identificación seguirá sin bloquear la app.";enqueueRecognition(x,savedBlob)}};del.onclick=async()=>{if(!editId||!confirm("¿Eliminar esta carta del portfolio?"))return;state.cards=state.cards.filter(x=>x.id!==editId);await photoDel(editId);save();editId=null;dlg.close();render()};function resizeBlob(file){return new Promise(ok=>{let im=new Image(),rd=new FileReader();rd.onload=()=>im.src=rd.result;im.onload=()=>{let max=1200,s=Math.min(1,max/im.width),cv=document.createElement("canvas");cv.width=im.width*s;cv.height=im.height*s;cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);cv.toBlob(ok,"image/jpeg",.82)};rd.readAsDataURL(file)})}
function resize(file){return new Promise(ok=>{let im=new Image(),rd=new FileReader();rd.onload=()=>im.src=rd.result;im.onload=()=>{let max=900,s=Math.min(1,max/im.width),cv=document.createElement("canvas");cv.width=im.width*s;cv.height=im.height*s;cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);ok(cv.toDataURL("image/jpeg",.78))};rd.readAsDataURL(file)})}
function blobToDataURL(blob){return new Promise((ok,no)=>{let r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(blob)})}function dataURLToBlob(s){let [h,d]=s.split(","),mime=(h.match(/:(.*?);/)||[])[1]||"image/jpeg",bin=atob(d),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}function renderRecognitionStats(){
  const box=document.querySelector("#recognitionStats");if(!box)return;
  const withPhoto=state.cards.filter(c=>c.photoKey),done=withPhoto.filter(c=>!c.draft&&c.recognition?.score>0),pending=withPhoto.filter(c=>c.draft),confirmed=withPhoto.filter(c=>c.catalogId&&c.identityVerifiedAt&&c.identityVerifiedBy==="user").length,rate=withPhoto.length?done.length/withPhoto.length*100:0;
  const exact=done.filter(c=>c.recognition?.source==="collector-number").length,visual=done.filter(c=>c.recognition?.source==="collector-number+visual").length,assisted=done.filter(c=>c.recognition?.source==="collector-number+name-tokens").length;
  box.innerHTML='<h3>Reconocimiento de fotos</h3><div class="qaRow"><span>Fotos procesables</span><b>'+withPhoto.length+'</b></div><div class="qaRow"><span>Referencias confirmadas</span><b class="'+(confirmed>=3?"ok":"warn")+'">'+confirmed+'</b></div><div class="qaRow"><span>Identificadas</span><b class="'+(done.length?"ok":"warn")+'">'+done.length+' · '+rate.toFixed(0)+'%</b></div><div class="qaRow"><span>Coincidencia exacta</span><b>'+exact+'</b></div><div class="qaRow"><span>Número + imagen</span><b>'+visual+'</b></div><div class="qaRow"><span>Número + texto</span><b>'+assisted+'</b></div><div class="qaRow"><span>Pendientes</span><b class="'+(pending.length?"warn":"ok")+'">'+pending.length+'</b></div>';
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
  try{const list=await Promise.race([tcgdexList("en"),timeoutAfter(9000)]);return Array.isArray(list)&&list.length>100}catch{return false}
}
async function testLorcanaConnectivity(){
  try{const sets=await Promise.race([lorcastSets(),timeoutAfter(9000)]);return Array.isArray(sets)&&sets.length>0}catch{return false}
}
async function testPregradePipeline(){
  try{
    const cv=document.createElement("canvas");cv.width=420;cv.height=590;const g=cv.getContext("2d");
    g.fillStyle="#d8d8d8";g.fillRect(0,0,420,590);g.fillStyle="#fff";g.fillRect(20,20,380,550);g.fillStyle="#333";g.fillRect(38,38,344,514);
    const blob=await new Promise(ok=>cv.toBlob(ok,"image/jpeg",.9));
    if(!blob)return false;const a=await analyzePregradeSide(blob,"front");
    return !!a&&["centering","corners","edges","surface","score"].every(k=>Number.isFinite(a[k]));
  }catch{return false}
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
  if(!rows.length){box.innerHTML='<p class="muted">Comprueba almacenamiento, catálogos, OCR, imagen, pregrado y backup.</p>';return}
  const failed=rows.filter(r=>!r.ok);
  box.innerHTML='<div class="selfTestHeader"><b>'+((t.pass||0))+'/'+rows.length+' pruebas superadas</b><span>'+new Date(t.at).toLocaleString("es-ES")+'</span></div>'+
    rows.map(r=>'<div class="qaRow"><span>'+r.label+'</span><b class="'+(r.ok?"ok":"warn")+'">'+(r.ok?"OK":"FALLO")+'</b></div>').join("")+
    (failed.length?'<div class="integrityIssues"><b>Faltan:</b>'+failed.map(r=>'<div>• '+r.label+(r.detail?' · '+r.detail:'')+'</div>').join("")+'</div>':'<div class="certDone">✅ Autotest 11/11.</div>');
}
async function runSelfTest(){
  const btn=document.querySelector("#runSelfTest"),box=document.querySelector("#selfTestResults");btn.disabled=true;box.innerHTML='<p class="muted">Ejecutando 10 pruebas independientes…</p>';
  const results=[];
  const one=async(label,fn)=>{try{const ok=await fn();results.push({label,ok:!!ok})}catch(e){results.push({label,ok:false,detail:String(e?.message||e||"error").slice(0,100)})}};
  await one("JavaScript cargado",async()=>true);
  await one("Estado local",async()=>testLocalState());
  await one("IndexedDB fotos",testIndexedDBRoundtrip);
  await one("IndexedDB radar",testMarketStoreRoundtrip);await one("IndexedDB catálogo",async()=>{await catalogPutMany([{id:"__catalog_test__",universe:"pokemon",name:"test"}]);const all=await catalogAll();const ok=all.some(x=>x.id==="__catalog_test__");let t=db.transaction("catalog","readwrite"),rr=t.objectStore("catalog").delete("__catalog_test__");await new Promise((y,n)=>{rr.onsuccess=()=>y();rr.onerror=()=>n(rr.error)});return ok});
  await one("Catálogo TCGdex",testCatalogConnectivity);
  await one("Catálogo Lorcast",testLorcanaConnectivity);
  await one("Motor OCR cargado",async()=>!!window.Tesseract);
  await one("Procesamiento de imagen",testImagePipeline);
  await one("Pregrado PSA sintético",testPregradePipeline);
  await one("Backup serializable",async()=>{JSON.stringify({format:"cardvault-backup",version:3,state});return true});
  state.selfTest={at:new Date().toISOString(),results,pass:results.filter(r=>r.ok).length};
  if(state.selfTest.pass===11){
    const bootAt=new Date(state.bootInfo?.at||0).getTime();
    state.runtimeErrors=(state.runtimeErrors||[]).filter(x=>new Date(x.at).getTime()<bootAt);
  }
  save();renderSelfTest();renderIntegrity();renderProductCompletion();renderQA();renderReadiness();btn.disabled=false;return state.selfTest;
}
function valuationAuditData(){
  const nonEur=state.market.filter(m=>m.kind==="sold"&&(m.currency||"EUR").toUpperCase()!=="EUR").length;
  const undated=state.market.filter(m=>m.kind==="sold"&&!m.soldDate&&!m.at).length;
  const graded=state.cards.filter(c=>(c.grading||"RAW")!=="RAW");
  const valued=graded.filter(c=>marketValueFor(c.name,c.grading,c.grade,c.set||"",cardUniverse(c)));
  const weak=graded.filter(c=>{let v=marketValueFor(c.name,c.grading,c.grade,c.set||"",cardUniverse(c));return v&&v.confidence==="Baja"}).length;
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
    {k:"autotest",v:Math.round(((self.pass||0)/11)*100),w:.20}
  ];
  return {score:Math.round(parts.reduce((s,x)=>s+x.v*x.w,0)),parts};
}
function renderValuationAudit(){
  const box=document.querySelector("#valuationAudit");if(!box)return;const a=valuationAuditData();
  box.innerHTML='<h3>Auditoría de valoración</h3><div class="qaRow"><span>Graduadas con valoración comparable</span><b>'+a.valued+'/'+a.graded+'</b></div><div class="qaRow"><span>Ventas no EUR excluidas</span><b class="'+(a.nonEur?"warn":"ok")+'">'+a.nonEur+'</b></div><div class="qaRow"><span>Valoraciones de confianza baja</span><b class="'+(a.weak?"warn":"ok")+'">'+a.weak+'</b></div><small>Las ventas en otras monedas se conservan como evidencia, pero ya no se mezclan con EUR hasta disponer de conversión de divisa fiable.</small>';
}function renderExcellenceBenchmark(){
  const box=document.querySelector("#excellenceBenchmark");if(!box)return;
  const rows=[
    ["Escaneo foto + identificación","Sí","Collectr/LUDEX también lo ofrecen"],
    ["Variante Lorcana normal/foil exacta","Sí","Separada desde V63"],
    ["Portfolio + coste + P/L","Sí","Comparable a trackers líderes"],
    ["Catálogo Pokémon + Lorcana","Sí","Más de 27k fichas locales según última indexación"],
    ["Filtros de compra por precio/margen","Sí","Ventaja específica de Card Vault"],
    ["Top 10 + Compra ya + enlace Cardmarket","Sí","Filtro combinado y ruta de compra V66"],
    ["Pregrado PSA + economía RAW→PSA","Sí","Compara PSA 9/10 neto sin asumir una nota"],
    ["Histórico largo de ventas verificadas","Parcial","Líderes comerciales disponen de años de datos; aquí depende de fuentes/histórico acumulado"],
    ["Venta/listado directo marketplace","No","No implementado: no es necesario para el objetivo actual"]
  ];
  const strong=rows.filter(r=>r[1]==="Sí").length;
  box.innerHTML='<h3>Benchmark mundial de producto</h3><div class="qaRow"><span>Capacidades fuertes</span><b class="ok">'+strong+'/'+rows.length+'</b></div>'+rows.map(r=>'<div class="benchRow"><b>'+r[0]+'</b><span class="'+(r[1]==="Sí"?"ok":r[1]==="Parcial"?"warn":"")+'">'+r[1]+'</span><small>'+r[2]+'</small></div>').join("")+'<small>Comparación funcional, no ranking comercial. La mayor brecha pendiente es disponer de histórico externo profundo de ventas verificadas sin añadir costes.</small>';
}
function renderQA(){
  const box=document.querySelector("#qaPanel");if(!box)return;
  const pending=state.cards.filter(c=>c.draft).length,photos=state.cards.filter(c=>c.photoKey).length,scan=(state.marketScan||[]).length,gradedSales=state.market.filter(m=>m.kind==="sold"&&(m.grading||"RAW")!=="RAW").length,popVerified=state.cards.filter(c=>c.popGrade!=null&&c.popSource&&c.popUrl&&c.popCheckedAt).length,activeAlerts=evaluateOpportunityAlerts(state.marketScan||[]).length,signalPoints=(state.signalHistory||[]).length,last=state.marketScanAt?new Date(state.marketScanAt).toLocaleString("es-ES"):"Nunca",scanAge=state.marketScanAt?ageDays(state.marketScanAt):9999;
  const catalogP=state.catalogMeta?.pokemon?.count||0,catalogL=state.catalogMeta?.lorcana?.count||0;const unsafeSlab=state.cards.filter(c=>c.recognition?.barcode?.cert&&(c.grading||"RAW")!=="RAW"&&c.recognition?.gradingEvidence!=="ocr-label"&&c.identityVerifiedBy!=="user").length;const checks=[["Build","V66","ok"],["Catálogo Pokémon",catalogP.toLocaleString("es-ES")+" cartas",catalogP>1000?"ok":"warn"],["Catálogo Lorcana",catalogL.toLocaleString("es-ES")+" cartas",catalogL>1000?"ok":"warn"],["Slab sin emisor verificado",String(unsafeSlab),unsafeSlab?"warn":"ok"],["Colección",state.cards.length+" fichas","ok"],["Fotos locales",photos+" guardadas",photos?"ok":"warn"],["Pendientes OCR",String(pending),pending?"warn":"ok"],["Market Lab",scan+" analizadas",scan?"ok":"warn"],["Pokémon recorridas",((state.coverageByUniverse?.pokemon||state.marketCoverage||{}).seen||0)+" cartas",((state.coverageByUniverse?.pokemon||state.marketCoverage||{}).seen||0)>=120?"ok":"warn"],["Lorcana cobertura",((state.coverageByUniverse?.lorcana||{}).seen||0)+"/"+((state.coverageByUniverse?.lorcana||{}).total||0)+" sets",((state.coverageByUniverse?.lorcana||{}).total||0)>0&&((state.coverageByUniverse?.lorcana||{}).seen||0)>=((state.coverageByUniverse?.lorcana||{}).total||0)?"ok":"warn"],["Radar Pokémon",((state.coverageByUniverse?.pokemon||state.marketCoverage||{}).active||0)+" activas",((state.coverageByUniverse?.pokemon||state.marketCoverage||{}).active||0)>=40?"ok":"warn"],["Radar Lorcana",((state.coverageByUniverse?.lorcana||{}).active||0)+" activas",((state.coverageByUniverse?.lorcana||{}).active||0)>=20?"ok":"warn"],["Ventas graduadas",gradedSales+" comps",gradedSales>=4?"ok":"warn"],["Población verificada",popVerified+" fichas",popVerified?"ok":"warn"],["Alertas activas",activeAlerts,activeAlerts?"ok":"warn"],["Histórico señales",signalPoints+" puntos",signalPoints>=20?"ok":"warn"],["Aplicación",productCompletionScore().score+"%",productCompletionScore().score===100?"ok":"warn"],["Evidencia real",readinessScore().score+"%",readinessScore().score===100?"ok":"warn"],["Calidad global",dataQualityScore().score+"%",dataQualityScore().score>=80?"ok":"warn"],["Autotest",(state.selfTest?.pass||0)+"/11",(state.selfTest?.pass||0)>=11?"ok":"warn"],["Prueba fotos",(state.photoValidation?.labeledTested||0)?Math.round((state.photoValidation.accuracy||0)*100)+"%":"Sin muestra",(state.photoValidation?.labeledTested||0)>=3&&(state.photoValidation?.accuracy||0)>=.7?"ok":"warn"],["Modo",state.marketScanMode==="wide"?"Amplio":"Rápido",state.marketScanMode==="wide"?"ok":"warn"],["Último escaneo",last,scan?"ok":"warn"],["Frescura mercado",scanAge<=1?"Hoy":scanAge<=7?"< 7 días":"Antiguo",scanAge<=7?"ok":"warn"]];
  box.innerHTML="<h3>Diagnóstico Card Vault</h3>"+checks.map(c=>"<div class=\"qaRow\"><span>"+c[0]+"</span><b class=\""+c[2]+"\">"+c[1]+"</b></div>").join("");renderBootStatus();renderProductCompletion();renderExcellenceBenchmark();renderRecognitionStats();renderBatchStatus();renderReadiness();renderSelfTest();renderPhotoValidation();renderCertification();renderIntegrity();renderValuationAudit();renderMarketEvidence();
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

document.querySelector("#runSelfTest").onclick=runSelfTest;renderSelfTest();document.querySelector("#runPhotoValidation").onclick=runPhotoValidation;renderPhotoValidation();document.querySelector("#finalizeApp").onclick=finalizeApplication;document.querySelector("#runCertification").onclick=runCertification;renderCertification();document.querySelector("#advanceCompletion").onclick=advanceAutomaticCompletion;document.querySelector("#repairIntegrity").onclick=()=>{repairStateIntegrity();renderIntegrity();render();renderQA()};renderIntegrity();
document.querySelector("#searchCards").oninput=render;document.querySelector("#filterType").onchange=render;document.querySelector("#collectionUniverse").onchange=render;
const bulkDialog=document.querySelector("#bulkDialog"),bulkPhotos=document.querySelector("#bulkPhotos");document.querySelector("#bulkAdd").onclick=()=>bulkDialog.showModal();
document.querySelector("#saveBulk").onclick=async e=>{e.preventDefault();let fs=[...bulkPhotos.files];if(!fs.length)return;let btn=e.currentTarget,old=btn.textContent;btn.disabled=true;btn.textContent="Guardando fotos…";let jobs=[];for(let i=0;i<fs.length;i++){let id=crypto.randomUUID(),blob=await resizeBlob(fs[i]);await photoPut(id,blob);let card={id,universe:document.querySelector("#bulkUniverse")?.value||"pokemon",name:"Carta por identificar",set:"",number:"",year:"",language:"",grading:"RAW",grade:"",value:0,purchase:null,quantity:1,purchaseDate:"",cert:"",photoKey:id,photoURL:URL.createObjectURL(blob),icon:"🃏",draft:true,recognition:{score:0,source:"pending",at:new Date().toISOString()},createdAt:new Date().toISOString()};state.cards.push(card);jobs.push({card,blob});}save();render();storageStatus();btn.disabled=false;btn.textContent=old;bulkPhotos.value="";bulkDialog.close();let st=document.querySelector("#repairStatus");st.classList.remove("hidden");st.textContent=fs.length+" fotos guardadas. La identificación continuará sin bloquear la app.";for(const j of jobs)enqueueRecognition(j.card,j.blob)};

async function hydrateMarketFromStorage(){
  try{
    const u=currentRadarUniverse(),q=await refreshMarketFreshness(u),rows=q.active.sort((a,b)=>b.score-a.score).slice(0,400);
    state.marketScan=rows;state.marketScanUniverse=u;
    if(rows.length){state.marketScanMode="wide";if(!state.marketScanAt)state.marketScanAt=new Date().toISOString()}
    state.bootInfo={at:new Date().toISOString(),radarLoaded:true,radarCount:rows.length};
    save();
    try{renderCoverage()}catch(e){pushRuntimeError("renderCoverage",e?.message||e)}
    try{renderMarketScan();renderRadar();refreshGlobalToday().catch(()=>{})}catch(e){pushRuntimeError("renderMarketScan",e?.message||e)}
    try{renderScanHistory()}catch(e){pushRuntimeError("renderScanHistory",e?.message||e)}
    try{renderBootStatus()}catch(e){pushRuntimeError("renderBootStatus",e?.message||e)}
  }catch(e){
    state.bootInfo={at:new Date().toISOString(),radarLoaded:false,radarCount:0,error:String(e?.message||e||"market hydrate")};save();
  }
}
async function archiveFootballUniverseData(){
  try{
    const all=await marketSignalAll(),football=all.filter(x=>x?.universe==="football");
    if(football.length){
      state.archivedUniverses=state.archivedUniverses||{};
      state.archivedUniverses.football={at:new Date().toISOString(),signals:football.slice(0,500),count:football.length};
      await marketSignalDeleteMany(football.map(x=>x.id));
    }
    state.market=state.market||[];
    const fm=state.market.filter(x=>x?.universe==="football");
    if(fm.length){
      state.archivedUniverses=state.archivedUniverses||{};
      state.archivedUniverses.footballMarket={at:new Date().toISOString(),rows:fm.slice(0,500),count:fm.length};
      state.market=state.market.filter(x=>x?.universe!=="football");
    }
    delete state.coverageByUniverse?.football;delete state.cursorByUniverse?.football;
    save();
  }catch{}
}
async function migrateLegacyMarketUniverse(){
  const rows=Object.values(state.marketUniverse||{}).filter(x=>x?.id);
  if(rows.length){await marketSignalPutMany(rows);state.marketUniverse={};}
  state.marketScannedIds={};
  await refreshMarketFreshness();
}
openDB().then(async()=>{try{await navigator.storage?.persist?.()}catch{}await migrateLegacyMarketUniverse();await archiveFootballUniverseData(); for(const x of state.cards){if(x.photo&&!x.photoKey&&x.photo.startsWith("data:")){try{let blob=await (await fetch(x.photo)).blob();x.photoKey=x.id;await photoPut(x.id,blob);delete x.photo}catch{}}}save();await hydratePhotos();await hydrateMarketFromStorage();storageStatus()}).catch(e=>{state.bootInfo={at:new Date().toISOString(),radarLoaded:false,radarCount:0,error:String(e?.message||e||"IndexedDB")};save();renderBootStatus();document.querySelector("#readyText").textContent="Error al abrir almacenamiento local. No cargues cartas hasta recargar la app."});