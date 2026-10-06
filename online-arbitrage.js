(function(root){
"use strict";

const minuteIds=new Set(["mtgo-bot-arbitrage","phygitals-claw-buyback","courtyard-vaulted","giftcard-cross","dmarket-cs2","csfloat","fanatics-vault"]);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(Number(v||0));
const allowedUrl=value=>{try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!/(^|\.)ebay\.[a-z.]+$/i.test(u.hostname)}catch{return false}};
const links=sources=>(sources||[]).filter(s=>allowedUrl(s.url)).map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.label)+'</a>').join("");
const statusLabel=s=>s==="candidate"?"RUTA PRIORITARIA":s==="conditional"?"CONDICIONADA":s==="research"?"INVESTIGACIÓN":"DESCARTADA";
const costKeys=["purchaseCents","shippingCents","feesCents","withdrawalCents","taxesCents","contingencyCents"];

function evaluate(record,now=Date.now()){
 const r=record||{},reasons=[];
 const monetary=[...costKeys,"saleCents"].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0);
 const total=monetary?costKeys.reduce((s,k)=>s+r[k],0):null;
 const net=monetary?r.saleCents-total:null;
 if(!monetary)reasons.push("Faltan importes o costes válidos.");
 if(!(r.purchaseCents>0))reasons.push("Falta precio de compra.");
 if(!(net>0))reasons.push("No hay margen neto positivo demostrado.");
 [["sameUnitVerified","Activo exacto sin verificar."],["stockVerified","Stock sin verificar."],["spainAllowed","España sin verificar."],["cashWithdrawalVerified","Salida a dinero sin verificar."],["bindingExitVerified","No existe comprador/orden ejecutable."],["inspectionResolved","Queda inspección o autenticación material."],["costsComplete","Costes incompletos."],["accountEligibleVerified","Cuenta/elegibilidad sin verificar."],["variantLocked","Variante exacta sin bloquear."],["quoteLiveVerified","Salida no revalidada."]].forEach(([k,m])=>{if(r[k]!==true)reasons.push(m)});
 return {status:reasons.length?"BLOCKED":"HUMAN_REVIEW",netCents:net,reasons,guaranteed:false,autoPurchase:false,humanReviewRequired:true};
}

root.CVOnlineArbitrage={evaluate,allowedUrl};
let report=null,liveFeed=null;

function splitRoutes(mode){
 const rows=report?.routes||[];
 return rows.filter(r=>mode==="minutes"?minuteIds.has(r.id):!minuteIds.has(r.id));
}
function splitCases(mode){
 const rows=report?.cases||[];
 if(mode==="minutes") return rows.filter(c=>/phygitals|courtyard|mtgo|gift|cs2|skin|digital|crypto|usde/i.test((c.id||"")+" "+(c.name||"")+" "+(c.finding||"")));
 return rows.filter(c=>!/phygitals|courtyard|mtgo|gift|cs2|skin|digital|crypto|usde/i.test((c.id||"")+" "+(c.name||"")+" "+(c.finding||"")));
}
function renderSwarm(){
 const s=report?.virtualResearchSwarm;if(!s)return"";
 return '<section class="arbSwarm"><div><span class="arbKicker">'+esc(s.label)+'</span><h3>'+Number(s.syntheticProfiles||0).toLocaleString("es-ES")+' perfiles sintéticos</h3><p>'+esc(s.description)+'</p></div><div class="arbRoleGrid">'+(s.expertRoles||[]).map(x=>'<span>'+esc(x)+'</span>').join("")+'</div><small>'+esc(s.rule)+'</small></section>';
}
function liveMinutesBlock(){
 if(!liveFeed?.rows?.length)return '<section class="arbLive"><span class="arbKicker">RADAR EN VIVO</span><h3>Sin señal ejecutable cargada</h3><p>El resto del informe sigue disponible, pero ninguna compra se autoriza sin datos vivos.</p></section>';
 const rows=liveFeed.rows.filter(x=>x.executable===true&&x.route_available===true&&x.depth_status==="ok"&&Number(x.net_spread_pct)>0).sort((a,b)=>b.net_spread_pct-a.net_spread_pct);
 if(!rows.length)return '<section class="arbLive"><span class="arbKicker">RADAR EN VIVO</span><h3>0 cruces positivos verificados</h3><p>No comprar.</p></section>';
 const cards=rows.slice(0,5).map(x=>{
   const gross=Number(x.spread||0),baseNet=Number(x.net_spread_pct||0);
   const conservative=Math.max(0,baseNet-0.55-0.20);
   const green=conservative>=1&&Number(x.depth_usdt||0)>=10000;
   return '<article class="arbLiveCard '+(green?"liveGreen":"liveWatch")+'">'+
    '<span class="arbBadge">'+(green?"CRUCE VIVO · REVALIDAR ANTES DE PAGAR":"VIGILAR")+'</span>'+
    '<h4>'+esc(x.coin)+' · '+esc(x.buy_exchange)+' → '+esc(x.sell_exchange)+'</h4>'+
    '<div class="arbLiveNumbers"><b>'+gross.toFixed(2)+'%</b><span>spread bruto</span><b>'+baseNet.toFixed(2)+'%</b><span>neto scanner</span><b>≈'+conservative.toFixed(2)+'%</b><span>neto conservador*</span></div>'+
    '<p>Compra: $'+Number(x.buy_price).toFixed(6)+' · Venta: $'+Number(x.sell_price).toFixed(6)+' · Red: '+esc(x.route||"")+'.</p>'+
    '<p>Profundidad: ≈$'+Number(x.depth_usdt||0).toLocaleString("es-ES",{maximumFractionDigits:0})+' · Ruta: '+(x.route_available?"abierta":"cerrada")+'.</p>'+
    '<small>*Resta adicional conservadora de 0,55 pp por trading/DEX + 0,20 pp de colchón, además del coste de red ya reflejado por el feed. La comisión exacta de la cuenta y el quote final mandan.</small>'+
    '</article>';
 }).join("");
 return '<section class="arbLive"><div class="arbLiveHead"><div><span class="arbKicker">RADAR EN VIVO · APIs OFICIALES AGREGADAS</span><h3>Oportunidades ejecutables detectadas</h3></div><small>Actualizado: '+esc(liveFeed.updated_at||"")+' · posición base del feed: $'+esc(liveFeed.position_usd||"")+'.</small></div>'+cards+'<small>Fuente: Yieldo (yieldo.me) — datos de mercado en tiempo real agregados desde APIs oficiales · CC BY 4.0.</small></section>';
}
function renderMode(mode){
 if(!report)return;
 const physical=mode==="physical";
 const prefix=physical?"physicalArbitrage":"arbitrage";
 const host=document.getElementById(physical?"physicalArbitrageContent":"onlineArbitrageContent");if(!host)return;
 const cat=document.getElementById(prefix+"Category")?.value||"";
 const st=document.getElementById(prefix+"Status")?.value||"";
 let routes=splitRoutes(mode).filter(r=>(!cat||r.category===cat)&&(!st||r.status===st));
 const cases=splitCases(mode);
 const cfg=physical?report.tabs?.physical:report.tabs?.minutes;
 const date=new Date(report.checkedAt).toLocaleString("es-ES",{timeZone:"Europe/Madrid"});
 const ready=routes.filter(r=>r.ready===true).length;
 const candidates=routes.filter(r=>r.status==="candidate").length;
 const headline=physical?"Compra física / Sevilla → venta online":"Sin stock físico · compra y salida en minutos";
 host.innerHTML=(physical?"":liveMinutesBlock())+
 '<section class="arbCommand '+(physical?'physical':'minutes')+'"><div><span class="arbKicker">'+(physical?'ESCALADO':'PRIORIDAD ABSOLUTA')+'</span><h3>'+esc(headline)+'</h3><p>'+esc(cfg?.objective||"")+'</p></div><div class="arbKpis"><div><b>'+ready+'</b><span>verdes reales</span></div><div><b>'+candidates+'</b><span>rutas prioritarias</span></div><div><b>'+routes.length+'</b><span>rutas visibles</span></div></div></section>'+
 renderSwarm()+
 '<div class="arbSummary"><strong>'+ready+' operaciones autorizadas ahora</strong><p>'+esc(report.summary)+'</p><small>Revisión: '+esc(date)+' · España · eBay excluido</small><p><b>Regla:</b> '+esc(cfg?.hardGate||"")+'</p></div>'+
 (cases.length?'<h3>Casos concretos</h3>'+cases.map(c=>'<article class="arbCase"><span class="arbBadge">'+(c.recommendBuy?"COMPRAR":"BLOQUEADO")+'</span><h4>'+esc(c.name)+'</h4><dl><div><dt>Compra</dt><dd>'+money(c.buyPriceEUR)+'</dd></div><div><dt>Salida / techo</dt><dd>'+money(c.exitCeilingEUR)+'</dd></div><div><dt>Diferencia bruta</dt><dd>'+money(c.ceilingDifferenceEUR)+'</dd></div></dl><p>'+esc(c.finding)+'</p><div class="arbLinks">'+links([{label:"Compra",url:c.buyUrl},{label:"Salida",url:c.exitUrl}])+'</div></article>').join(""):"")+
 '<h3>Rutas · '+routes.length+'</h3><div class="arbRoutes">'+routes.map(r=>'<article class="arbRoute arb-'+esc(r.status)+'"><div class="arbRouteTop"><span class="arbBadge">'+statusLabel(r.status)+'</span><span class="arbOrigin">'+esc(r.origin||"Online")+'</span></div><h4>'+esc(r.name)+'</h4><div class="arbExitType">'+esc(r.exitType||"")+'</div><p>'+esc(r.finding)+'</p><p><b>Qué falta:</b> '+esc(r.missing)+'</p><p><b>Logística:</b> '+esc(r.logistics)+'</p><div class="arbLinks">'+links(r.sources)+'</div></article>').join("")+'</div>'+
 '<div class="arbNoGuarantee"><b>Control antifalso-positivo:</b> ninguna estimación, listing o beneficio futuro se trata como salida cerrada.</div>';
}
function setupSelects(mode){
 const physical=mode==="physical",prefix=physical?"physicalArbitrage":"arbitrage";
 const rows=splitRoutes(mode),cat=document.getElementById(prefix+"Category"),st=document.getElementById(prefix+"Status");
 if(cat){const cats=[...new Set(rows.map(r=>r.category))].sort();cat.innerHTML='<option value="">Todas</option>'+cats.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join("");cat.onchange=()=>renderMode(mode)}
 if(st)st.onchange=()=>renderMode(mode);
 const btn=document.getElementById(physical?"physicalArbitrageCopy":"arbitrageCopy");
 if(btn){btn.disabled=false;btn.onclick=()=>copyMode(mode)}
}
function copyMode(mode){
 const physical=mode==="physical",rows=splitRoutes(mode),status=document.getElementById(physical?"physicalArbitrageCopyStatus":"arbitrageCopyStatus");
 const txt=[physical?"ARBITRAJE FÍSICO · CARD VAULT":"ARBITRAJE MINUTOS · CARD VAULT","Revisión: "+report.checkedAt,"eBay: EXCLUIDO",...rows.map(r=>r.name+"\nEstado: "+statusLabel(r.status)+"\n"+r.finding+"\nFalta: "+r.missing+"\n"+(r.sources||[]).map(s=>s.url).join("\n"))].join("\n\n");
 const done=()=>{if(status)status.textContent="Informe copiado."};
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(txt).then(done).catch(()=>fallback(txt,status));else fallback(txt,status);
}
function fallback(txt,status){const t=document.createElement("textarea");t.value=txt;document.body.appendChild(t);t.select();try{document.execCommand("copy");t.remove();if(status)status.textContent="Informe copiado."}catch{if(status)status.textContent="Selecciona el texto para copiarlo."}}
async function start(){
 try{
  const [r,live]=await Promise.all([
   fetch("online-arbitrage-data.json?v=3.1",{cache:"no-store"}),
   fetch("https://yieldo.me/arbitrage/live.json",{cache:"no-store"}).catch(()=>null)
  ]);
  if(!r.ok)throw 0;
  report=await r.json();
  try{if(live?.ok)liveFeed=await live.json()}catch{}
  setupSelects("minutes");setupSelects("physical");renderMode("minutes");renderMode("physical");
 }catch{
  ["onlineArbitrageContent","physicalArbitrageContent"].forEach(id=>{const h=document.getElementById(id);if(h)h.textContent="No se pudo cargar el informe. No hay compras autorizadas."});
 }
 if(location.hash==="#arbitraje")root.CVSimpleNav?.showTab("arbitraje");
 if(location.hash==="#arbitraje-fisico")root.CVSimpleNav?.showTab("arbitraje-fisico");
}
start();
})(typeof globalThis!=="undefined"?globalThis:this);
