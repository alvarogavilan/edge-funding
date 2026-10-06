(function(root){
"use strict";

const MINUTE_IDS=new Set(["mtgo-bot-arbitrage","phygitals-claw-buyback","courtyard-vaulted","giftcard-cross","dmarket-cs2","csfloat","fanatics-vault"]);
const FREQ_KEY="cv_arb_live_frequency_v2";
const AGENT_KEY="cv_arb_agent_v1";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(Number(v||0));
const allowedUrl=value=>{try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!/(^|\.)ebay\.[a-z.]+$/i.test(u.hostname)}catch{return false}};
const links=sources=>(sources||[]).filter(s=>allowedUrl(s.url)).map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.label)+'</a>').join("");
const statusLabel=s=>s==="candidate"?"RUTA PRIORITARIA":s==="conditional"?"CONDICIONADA":s==="research"?"INVESTIGACIÓN":"DESCARTADA";

let report=null, liveFeed=null, liveTimer=null;

function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}

function agentState(){
 return {...{
   enabled:true,
   mode:"AUTO_READY",
   capitalLimitEUR:20,
   minNetPct:1,
   minDepthUSD:10000,
   maxQuoteAgeSec:15,
   dailyStopLossEUR:5,
   consecutiveFailuresLimit:2,
   tradesPrepared:0,
   tradesExecuted:0,
   realizedProfitEUR:0,
   lastDecision:null
 },...readJson(AGENT_KEY,{})};
}
function saveAgent(next){writeJson(AGENT_KEY,next);return next}

function readFreq(){return readJson(FREQ_KEY,{samples:[]})}
function recordFrequency(feed){
 const now=Date.now(),cut=now-86400000,f=readFreq();
 f.samples=(f.samples||[]).filter(x=>x.at>=cut);
 const best=(feed?.rows||[])
  .filter(x=>x.executable===true&&x.route_available===true&&x.depth_status==="ok")
  .sort((a,b)=>Number(b.net_spread_pct||0)-Number(a.net_spread_pct||0))[0];
 f.samples.push({at:now,ok:!!best,net:best?Number(best.net_spread_pct||0):0,coin:best?.coin||null});
 writeJson(FREQ_KEY,f);
}
function frequencyStats(){
 const s=readFreq().samples||[];
 const a=agentState();
 const positive=s.filter(x=>x.ok&&x.net>=a.minNetPct);
 return {samples:s.length,positive:positive.length,availability:s.length?positive.length/s.length:0};
}

function evaluateLiveRow(x){
 const a=agentState();
 const ageSec=liveFeed?.updated_at?Math.max(0,(Date.now()-Date.parse(liveFeed.updated_at))/1000):9999;
 const scannerNet=Number(x.net_spread_pct||0);
 const conservative=Math.max(0,scannerNet-0.75);
 const reasons=[];
 if(x.executable!==true)reasons.push("feed no ejecutable");
 if(x.route_available!==true)reasons.push("ruta cerrada");
 if(x.depth_status!=="ok")reasons.push("profundidad insuficiente");
 if(Number(x.depth_usdt||0)<a.minDepthUSD)reasons.push("profundidad < mínimo");
 if(conservative<a.minNetPct)reasons.push("neto conservador < mínimo");
 if(ageSec>a.maxQuoteAgeSec)reasons.push("quote antiguo");
 if(x.primary_buy_verified!==true)reasons.push("compra no confirmada en fuente primaria");
 if(x.primary_sell_verified!==true)reasons.push("venta no confirmada en fuente primaria");
 return {ready:reasons.length===0,reasons,scannerNet,conservative,ageSec};
}

function bestLive(){
 const rows=(liveFeed?.rows||[]).map(x=>({row:x,eval:evaluateLiveRow(x)}));
 rows.sort((a,b)=>b.eval.conservative-a.eval.conservative);
 return rows[0]||null;
}

function agentDecision(){
 const a=agentState(),best=bestLive();
 let decision={at:new Date().toISOString(),status:"WAIT",reason:"Sin oportunidad viva"};
 if(!a.enabled)decision={...decision,status:"OFF",reason:"Agente desactivado"};
 else if(best?.eval.ready){
   const expectedEUR=a.capitalLimitEUR*(best.eval.conservative/100);
   decision={
     at:new Date().toISOString(),
     status:"AUTO_READY",
     reason:"Cumple filtros; requiere aprobación humana antes de mover fondos.",
     coin:best.row.coin,
     buy:best.row.buy_exchange,
     sell:best.row.sell_exchange,
     netPct:best.eval.conservative,
     expectedProfitEUR:expectedEUR,
     capitalEUR:a.capitalLimitEUR
   };
 }
 a.lastDecision=decision;
 saveAgent(a);
 return decision;
}

function venueUrl(name,side){
 const n=String(name||"").toLowerCase();
 if(n.includes("ston")) return "https://app.ston.fi/swap";
 if(n.includes("bybit")) return "https://www.bybit.eu/en-EU/trade/spot/USDE/USDT";
 if(n.includes("dedust")) return "https://dedust.io/swap/TON/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
 return "";
}
function executionPackage(d){
 if(d.status!=="AUTO_READY")return "";
 const buyUrl=venueUrl(d.buy,"buy"),sellUrl=venueUrl(d.sell,"sell");
 return '<section class="arbExecute">'+
  '<span class="arbKicker">EJECUCIÓN GUIADA · TODO PREPARADO</span>'+
  '<h3>Solo revisar y confirmar</h3>'+
  '<div class="arbExecGrid">'+
   '<div><span>Capital</span><b>'+money(d.capitalEUR)+'</b></div>'+
   '<div><span>Activo</span><b>'+esc(d.coin)+'</b></div>'+
   '<div><span>Comprar en</span><b>'+esc(d.buy)+'</b></div>'+
   '<div><span>Vender en</span><b>'+esc(d.sell)+'</b></div>'+
   '<div><span>Neto conservador</span><b>≈'+d.netPct.toFixed(2)+'%</b></div>'+
   '<div><span>Beneficio potencial</span><b>'+money(d.expectedProfitEUR)+'</b></div>'+
  '</div>'+
  '<ol class="arbExecSteps"><li>Pulsa <b>1 · Abrir compra</b>. La app ya te indica activo e importe.</li><li>Comprueba que el precio final no empeora respecto al verde.</li><li>Confirma la compra.</li><li>Pulsa <b>2 · Abrir venta</b> y confirma la salida preparada.</li><li>Vuelve a Card Vault y registra el resultado real.</li></ol>'+
  '<div class="arbExecActions">'+
   (buyUrl?'<a class="primaryAction" href="'+esc(buyUrl)+'" target="_blank" rel="noopener">1 · Abrir compra</a>':'')+
   (sellUrl?'<a href="'+esc(sellUrl)+'" target="_blank" rel="noopener">2 · Abrir venta</a>':'')+
  '</div>'+
  '<small>No se mostrará esta tarjeta si falta verificación primaria de cualquiera de las dos patas.</small>'+
 '</section>';
}
function renderAgent(){
 const a=agentState(),d=agentDecision(),fs=frequencyStats();
 const status=d.status==="AUTO_READY"?"LISTO PARA APROBAR":d.status==="OFF"?"DESACTIVADO":"VIGILANDO";
 return '<section class="arbAgent">'+
 '<div class="arbAgentHead"><div><span class="arbKicker">AGENTE 24/7 · AUTO READY</span><h3>'+status+'</h3></div><span class="arbAgentMode">'+esc(a.mode)+'</span></div>'+
 '<div class="arbAgentGrid">'+
 '<label>Capital por operación €<input id="arbAgentCapital" type="number" min="10" max="106" step="1" value="'+esc(a.capitalLimitEUR)+'"></label>'+
 '<label>Neto mínimo %<input id="arbAgentMinNet" type="number" min="0.1" step="0.1" value="'+esc(a.minNetPct)+'"></label>'+
 '<label>Profundidad mínima $<input id="arbAgentDepth" type="number" min="100" step="100" value="'+esc(a.minDepthUSD)+'"></label>'+
 '<label>Quote máximo s<input id="arbAgentAge" type="number" min="3" step="1" value="'+esc(a.maxQuoteAgeSec)+'"></label>'+
 '</div>'+
 '<div class="arbAgentDecision"><b>'+esc(d.status)+'</b><span>'+esc(d.reason)+'</span>'+
 (d.status==="AUTO_READY"?'<span>'+esc(d.coin)+' · '+esc(d.buy)+' → '+esc(d.sell)+' · ≈'+d.netPct.toFixed(2)+'% · '+money(d.expectedProfitEUR)+' potencial sobre '+money(d.capitalEUR)+'</span>':'')+
 '</div>'+
 '<div class="arbFrequency"><b>Frecuencia observada</b><span>'+fs.positive+'/'+fs.samples+' muestras por encima del umbral · '+(fs.samples?Math.round(fs.availability*100):0)+'% del tiempo observado</span><small>Solo cuenta mientras la app está abierta en este dispositivo.</small></div>'+
 executionPackage(d)+
 '<div class="arbAgentActions"><button id="arbAgentToggle">'+(a.enabled?"Pausar agente":"Activar agente")+'</button><button id="arbAgentSave">Guardar límites</button></div>'+
 '<small>Capital total actual: 106 €. Escalado automático recomendado: 20 € de prueba → 50 € tras 2 operaciones positivas → hasta 106 € solo después de validar costes, tiempos y slippage reales. El agente no firma ni mueve fondos.</small>'+
 '</section>';
}

function bindAgent(){
 const a=agentState();
 const save=()=>{
   const n={...a,
     capitalLimitEUR:Math.min(106,Math.max(10,Number(document.getElementById("arbAgentCapital")?.value||a.capitalLimitEUR))),
     minNetPct:Math.max(.1,Number(document.getElementById("arbAgentMinNet")?.value||a.minNetPct)),
     minDepthUSD:Math.max(100,Number(document.getElementById("arbAgentDepth")?.value||a.minDepthUSD)),
     maxQuoteAgeSec:Math.max(3,Number(document.getElementById("arbAgentAge")?.value||a.maxQuoteAgeSec))
   };
   saveAgent(n);renderMode("minutes");
 };
 const saveBtn=document.getElementById("arbAgentSave");if(saveBtn)saveBtn.onclick=save;
 const toggle=document.getElementById("arbAgentToggle");if(toggle)toggle.onclick=()=>{saveAgent({...agentState(),enabled:!agentState().enabled});renderMode("minutes")};
}

function splitRoutes(mode){
 const rows=report?.routes||[];
 return rows.filter(r=>mode==="minutes"?MINUTE_IDS.has(r.id):!MINUTE_IDS.has(r.id));
}
function splitCases(mode){
 const rows=report?.cases||[];
 if(mode==="minutes")return rows.filter(c=>/phygitals|courtyard|mtgo|gift|cs2|skin|digital|crypto|usde/i.test((c.id||"")+" "+(c.name||"")+" "+(c.finding||"")));
 return rows.filter(c=>!/phygitals|courtyard|mtgo|gift|cs2|skin|digital|crypto|usde/i.test((c.id||"")+" "+(c.name||"")+" "+(c.finding||"")));
}
function renderCapacity(){
 const c=report?.capacityEngine;if(!c)return"";
 const rows=(c.scenarios||[]).filter(x=>[100,500,1000].includes(x.capitalEUR)&&[1,2].includes(x.netPct));
 return '<section class="arbCapacity"><span class="arbKicker">POTENCIAL CONDICIONADO</span><h3>'+esc(c.title)+'</h3><p>'+esc(c.principle)+'</p><div class="arbCapGrid">'+rows.map(x=>'<div><b>'+money(x.capitalEUR)+' · '+x.netPct+'%</b><span>1 cruce: '+money(x.profitPerTradeEUR)+'</span><span>3: '+money(x.profit3TradesEUR)+'</span><span>6: '+money(x.profit6TradesEUR)+'</span><span>12: '+money(x.profit12TradesEUR)+'</span></div>').join("")+'</div></section>';
}
function renderSwarm(){
 const s=report?.virtualResearchSwarm;if(!s)return"";
 return '<section class="arbSwarm"><span class="arbKicker">'+esc(s.label)+'</span><h3>'+Number(s.syntheticProfiles||0).toLocaleString("es-ES")+' perfiles sintéticos</h3><p>'+esc(s.description)+'</p><div class="arbRoleGrid">'+(s.expertRoles||[]).map(x=>'<span>'+esc(x)+'</span>').join("")+'</div></section>';
}
function liveMinutesBlock(){
 if(!liveFeed?.rows?.length)return '<section class="arbLive"><span class="arbKicker">RADAR EN VIVO</span><h3>Sin señal viva cargada</h3><p>No se autoriza ninguna operación sin datos actuales.</p></section>';
 const rows=liveFeed.rows.map(x=>({x,e:evaluateLiveRow(x)})).sort((a,b)=>b.e.conservative-a.e.conservative).slice(0,5);
 return '<section class="arbLive"><div class="arbLiveHead"><div><span class="arbKicker">RADAR EN VIVO</span><h3>Spreads ejecutables detectados</h3></div><small>'+esc(liveFeed.updated_at||"")+'</small></div>'+
 rows.map(({x,e})=>'<article class="arbLiveCard '+(e.ready?"liveGreen":"liveWatch")+'"><span class="arbBadge">'+(e.ready?"AUTO READY":"VIGILAR")+'</span><h4>'+esc(x.coin)+' · '+esc(x.buy_exchange)+' → '+esc(x.sell_exchange)+'</h4><div class="arbLiveNumbers"><b>'+Number(x.spread||0).toFixed(2)+'%</b><span>bruto</span><b>'+e.scannerNet.toFixed(2)+'%</b><span>scanner</span><b>≈'+e.conservative.toFixed(2)+'%</b><span>conservador</span></div><p>Compra: $'+Number(x.buy_price||0).toFixed(6)+' · Venta: $'+Number(x.sell_price||0).toFixed(6)+' · Profundidad ≈$'+Number(x.depth_usdt||0).toLocaleString("es-ES",{maximumFractionDigits:0})+'.</p><small>'+(e.ready?"Cumple filtros actuales.":"Bloqueos: "+esc(e.reasons.join(", ")))+'</small></article>').join("")+
 '</section>';
}
function renderMode(mode){
 if(!report)return;
 const physical=mode==="physical";
 const prefix=physical?"physicalArbitrage":"arbitrage";
 const host=document.getElementById(physical?"physicalArbitrageContent":"onlineArbitrageContent");if(!host)return;
 const cat=document.getElementById(prefix+"Category")?.value||"";
 const st=document.getElementById(prefix+"Status")?.value||"";
 const routes=splitRoutes(mode).filter(r=>(!cat||r.category===cat)&&(!st||r.status===st));
 const cases=splitCases(mode);
 const cfg=physical?report.tabs?.physical:report.tabs?.minutes;
 host.innerHTML=(physical?"":renderAgent()+liveMinutesBlock())+
 '<section class="arbCommand '+(physical?'physical':'minutes')+'"><div><span class="arbKicker">'+(physical?'ESCALADO':'PRIORIDAD ABSOLUTA')+'</span><h3>'+(physical?'Compra física / Sevilla → venta online':'Sin stock físico · compra y salida en minutos')+'</h3><p>'+esc(cfg?.objective||"")+'</p></div><div class="arbKpis"><div><b>'+routes.filter(r=>r.ready===true).length+'</b><span>verdes reales</span></div><div><b>'+routes.filter(r=>r.status==="candidate").length+'</b><span>rutas prioritarias</span></div><div><b>'+routes.length+'</b><span>rutas visibles</span></div></div></section>'+
 (physical?"":renderCapacity())+renderSwarm()+
 (cases.length?'<h3>Casos concretos</h3>'+cases.map(c=>'<article class="arbCase"><span class="arbBadge">'+(c.recommendBuy?"COMPRAR":"BLOQUEADO")+'</span><h4>'+esc(c.name)+'</h4><p>'+esc(c.finding)+'</p><div class="arbLinks">'+links([{label:"Compra",url:c.buyUrl},{label:"Salida",url:c.exitUrl}])+'</div></article>').join(""):"")+
 '<h3>Rutas · '+routes.length+'</h3><div class="arbRoutes">'+routes.map(r=>'<article class="arbRoute arb-'+esc(r.status)+'"><div class="arbRouteTop"><span class="arbBadge">'+statusLabel(r.status)+'</span><span class="arbOrigin">'+esc(r.origin||"Online")+'</span></div><h4>'+esc(r.name)+'</h4><div class="arbExitType">'+esc(r.exitType||"")+'</div><p>'+esc(r.finding)+'</p><p><b>Qué falta:</b> '+esc(r.missing)+'</p><div class="arbLinks">'+links(r.sources)+'</div></article>').join("")+'</div>';
 if(!physical)bindAgent();
}
function setupSelects(mode){
 const physical=mode==="physical",prefix=physical?"physicalArbitrage":"arbitrage";
 const rows=splitRoutes(mode),cat=document.getElementById(prefix+"Category"),st=document.getElementById(prefix+"Status");
 if(cat){const cats=[...new Set(rows.map(r=>r.category))].sort();cat.innerHTML='<option value="">Todas</option>'+cats.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join("");cat.onchange=()=>renderMode(mode)}
 if(st)st.onchange=()=>renderMode(mode);
}
async function refreshLive(){
 try{
   const x=await fetch("https://yieldo.me/arbitrage/live.json?ts="+Date.now(),{cache:"no-store"});
   if(x.ok){liveFeed=await x.json();recordFrequency(liveFeed);renderMode("minutes")}
 }catch{}
}
async function start(){
 try{
  const [r,live]=await Promise.all([
   fetch("online-arbitrage-data.json?v=4.0",{cache:"no-store"}),
   fetch("https://yieldo.me/arbitrage/live.json?ts="+Date.now(),{cache:"no-store"}).catch(()=>null)
  ]);
  if(!r.ok)throw new Error("data");
  report=await r.json();
  try{if(live?.ok){liveFeed=await live.json();recordFrequency(liveFeed)}}catch{}
  setupSelects("minutes");setupSelects("physical");
  renderMode("minutes");renderMode("physical");
  if(!liveTimer)liveTimer=setInterval(refreshLive,60000);
 }catch{
  ["onlineArbitrageContent","physicalArbitrageContent"].forEach(id=>{const h=document.getElementById(id);if(h)h.textContent="No se pudo cargar el motor de arbitraje."});
 }
}
start();
})(typeof globalThis!=="undefined"?globalThis:this);
