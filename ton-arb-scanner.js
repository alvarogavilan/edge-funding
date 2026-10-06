(function(root){
"use strict";
// Escáner same-wallet TON: ciclos triangulares STON.fi (quote oficial /v1/swap/simulate)
// y cruce STON.fi↔DeDust (solo indicativo). Nunca ejecuta: solo prepara la tarjeta.

const STON_API="https://api.ston.fi/v1";
const DEDUST_API="https://api.dedust.io/v2";
const FX_API="https://api.frankfurter.app/latest?from=USD&to=EUR";
const TON_ADDRS=["EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c","EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez"];
const TOKENS={
 USDT:{addr:"EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",dec:6,symbols:["USD₮","USDT","jUSDT"],stable:true},
 TON:{addr:TON_ADDRS[0],dec:9,symbols:["TON","pTON"],native:true},
 USDe:{addr:"EQAIb6KmdfdDR7CN1GBqVJuP25iCnLKCvBlJ07Evuu2dzP5f",dec:6,symbols:["USDe"],stable:true},
 STON:{addr:"EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO",dec:9,symbols:["STON"]},
 NOT:{addr:"EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",dec:9,symbols:["NOT"]}
};
const RULES={minNetPct:1,maxQuoteAgeSec:10,slippage:0.002,maxImpactPct:0.5,minPoolTvlUSD:20000,baseCapitalEUR:100};
const LOG_KEY="cv_ton_arb_log_v1",TRADES_KEY="cv_ton_arb_trades_v1";
const DAY=86400000;

/* ---------- núcleo puro (testeable en Node) ---------- */
function friendlyToRaw(addr){
 const s=String(addr||"").trim();
 if(/^-?\d+:[0-9a-fA-F]{64}$/.test(s))return s.toLowerCase();
 try{
  const b64=s.replace(/-/g,"+").replace(/_/g,"/");
  const bin=typeof atob==="function"?atob(b64):Buffer.from(b64,"base64").toString("binary");
  if(bin.length!==36)return null;
  const wc=bin.charCodeAt(1)===0xff?-1:bin.charCodeAt(1);
  let hex="";for(let i=2;i<34;i++)hex+=bin.charCodeAt(i).toString(16).padStart(2,"0");
  return wc+":"+hex;
 }catch{return null}
}
// Producto constante con comisión: salida de un pool volátil.
function cpOut(amountIn,reserveIn,reserveOut,feeFraction){
 const a=Number(amountIn)*(1-Number(feeFraction||0)),ri=Number(reserveIn),ro=Number(reserveOut);
 if(!(a>0&&ri>0&&ro>0))return 0;
 return ro*a/(ri+a);
}
function buildCycles(symbols){
 const others=symbols.filter(s=>s!=="USDT"),out=[];
 for(const b of others)for(const c of others)if(b!==c)out.push({id:"USDT>"+b+">"+c+">USDT",kind:"triangular",path:["USDT",b,c,"USDT"],start:"USDT"});
 if(symbols.includes("TON")&&symbols.includes("USDe")){
  out.push({id:"TON>USDT>USDe>TON",kind:"triangular",path:["TON","USDT","USDe","TON"],start:"TON"});
  out.push({id:"TON>USDe>USDT>TON",kind:"triangular",path:["TON","USDe","USDT","TON"],start:"TON"});
 }
 for(const x of ["TON","USDe"])if(symbols.includes(x)){
  out.push({id:"USDT>"+x+"@STON>USDT@DeDust",kind:"cross",path:["USDT",x,"USDT"],venues:["STON.fi","DeDust"],start:"USDT"});
  out.push({id:"USDT>"+x+"@DeDust>USDT@STON",kind:"cross",path:["USDT",x,"USDT"],venues:["DeDust","STON.fi"],start:"USDT"});
 }
 return out;
}
// legs: [{offerUnits,askUnits,minAskUnits,impactPct,gasNano,feeUnits,tvlUSD,binding,venue}]
function evaluateCycle(input,rules){
 const r={...RULES,...(rules||{})};
 const legs=input.legs||[],reasons=[...(input.reasons||[])];
 const startUnits=Number(input.startUnits),dec=Number(input.startDec),px=Number(input.startPriceUSD),ton=Number(input.tonPriceUSD);
 if(!legs.length||!(startUnits>0))return {ready:false,executability:"BLOQUEADO",reasons:reasons.length?reasons:["sin quote"],grossPct:null,netPct:null,netExpPct:null};
 const last=legs[legs.length-1];
 const endExp=Number(last.askUnits);
 let ratioMin=1;for(const l of legs){const a=Number(l.askUnits),m=Number(l.minAskUnits);ratioMin*=a>0&&m>0?Math.min(1,m/a):0}
 const endMin=endExp*ratioMin;
 const gasTon=legs.reduce((s,l)=>s+Number(l.gasNano||0),0)/1e9;
 const gasUSD=gasTon*(ton>0?ton:0);
 const startUSD=startUnits/10**dec*px;
 const toUSD=u=>u/10**dec*px;
 const grossPct=(endExp/startUnits-1)*100;
 const netExpPct=startUSD>0?((toUSD(endExp)-gasUSD)/startUSD-1)*100:null;
 const netPct=startUSD>0?((toUSD(endMin)-gasUSD)/startUSD-1)*100:null;
 const depth=Math.min(...legs.map(l=>Number(l.tvlUSD||0)));
 const age=(Number(input.now)-Number(input.quoteAt))/1000;
 if(!(ton>0))reasons.push("sin precio TON para gas");
 if(!(px>0))reasons.push("sin precio del activo inicial");
 if(legs.some(l=>!l.binding))reasons.push("alguna pata no tiene quote vinculante (solo reservas)");
 if(legs.some(l=>Number(l.impactPct)>r.maxImpactPct))reasons.push("price impact > "+r.maxImpactPct+"%");
 if(!(depth>=r.minPoolTvlUSD))reasons.push("profundidad < $"+r.minPoolTvlUSD.toLocaleString("es-ES"));
 if(!(age>=0&&age<=r.maxQuoteAgeSec))reasons.push("quote con más de "+r.maxQuoteAgeSec+" s");
 if(!(netPct>=r.minNetPct))reasons.push("neto mínimo "+(netPct==null?"—":netPct.toFixed(3)+"%")+" < "+r.minNetPct+"%");
 const ready=reasons.length===0;
 return {ready,executability:ready?"VERDE":"BLOQUEADO",reasons,grossPct,netPct,netExpPct,gasTon,gasUSD,depth,ageSec:age,endExp,endMin,startUSD};
}
function capitalLimit(trades,base){
 const b=base==null?RULES.baseCapitalEUR:base,t=trades||[];
 const realized=t.reduce((s,x)=>s+Number(x.resultEUR||0),0);
 const available=Math.max(0,b+realized);
 let streak=0;for(let i=t.length-1;i>=0;i--){if(Number(t[i].resultEUR)>0&&!t[i].incident)streak++;else break}
 const limit=streak>=2?available:Math.min(streak===1?50:20,available);
 return {available,realized,streak,limit,tier:streak>=2?"completo":streak===1?"50 €":"20 €"};
}
// Agrupa minutos verdes consecutivos (hueco ≤ 2,5 min) en episodios = oportunidades.
function episodes(log){
 const green=(log||[]).filter(x=>x.x==="VERDE").sort((a,b)=>a.t-b.t),eps=[];
 for(const g of green){
  const cur=eps[eps.length-1];
  if(cur&&g.t-cur.end<=150000){cur.end=g.t;cur.best=Math.max(cur.best,g.n);cur.samples++}
  else eps.push({start:g.t,end:g.t,best:g.n,samples:1,route:g.r});
 }
 return eps;
}
function frequencyStats(log,now,capitalEUR){
 const l=(log||[]).filter(x=>x.t>=now-DAY);
 const minutes=new Set(l.map(x=>Math.floor(x.t/60000)));
 const coverageH=minutes.size/60;
 const eps=episodes(l);
 const lastHour=eps.filter(e=>e.start>=now-3600000).length;
 const greenMinutes=new Set(l.filter(x=>x.x==="VERDE").map(x=>Math.floor(x.t/60000))).size;
 const signals1=new Set(l.filter(x=>Number(x.n)>=RULES.minNetPct).map(x=>Math.floor(x.t/60000))).size;
 let meanGapMin=null;
 if(eps.length>=2){let s=0;for(let i=1;i<eps.length;i++)s+=eps[i].start-eps[i-1].start;meanGapMin=s/(eps.length-1)/60000}
 const nets=l.filter(x=>x.n!=null).map(x=>Number(x.n)).filter(Number.isFinite);
 const bestNet=nets.length?Math.max(...nets):null;
 const bestGreen=eps.length?Math.max(...eps.map(e=>e.best)):null;
 const enough=coverageH>=20;
 const dailyPotentialEUR=enough?eps.reduce((s,e)=>s+capitalEUR*e.best/100,0):null;
 return {samples:l.length,coverageH,lastHour,day:eps.length,greenMinutes,signals1,meanGapMin,bestNet,bestGreen,dailyPotentialEUR,enough};
}
function stonSwapUrl(fromAddr,toAddr,amount){
 return "https://app.ston.fi/swap?ft="+encodeURIComponent(fromAddr)+"&tt="+encodeURIComponent(toAddr)+"&fa="+encodeURIComponent(amount)+"&chartVisible=false";
}

/* ---------- cotización en vivo (navegador o Node ≥18) ---------- */
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const eur=v=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(Number(v||0));
const pct=v=>v==null||!Number.isFinite(v)?"—":(v>=0?"+":"")+v.toFixed(3)+"%";
let store={read:k=>localStorage.getItem(k),write:(k,v)=>localStorage.setItem(k,v)};
const readJson=(k,f)=>{try{const v=JSON.parse(store.read(k));return v??f}catch{return f}};
const writeJson=(k,v)=>{try{store.write(k,JSON.stringify(v))}catch{}};

const state={assets:{},assetErr:{},pools:{},noPool:{},dedust:null,dedustAt:0,fx:null,fxAt:0,results:[],scanAt:0,busy:false,fast:false,sourceErr:{},timer:null};

async function getJson(url,opts){
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),8000);
 try{const r=await fetch(url,{...(typeof document!=="undefined"?{cache:"no-store"}:{}),...(opts||{}),signal:ctl.signal});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}
 finally{clearTimeout(to)}
}
async function loadFx(){
 if(state.fx&&Date.now()-state.fxAt<3600000)return state.fx;
 try{const j=await getJson(FX_API);const v=Number(j?.rates?.EUR);if(v>0){state.fx=v;state.fxAt=Date.now()}}catch{}
 return state.fx;
}
// Verifica cada token contra la ficha oficial de STON.fi: símbolo, lista negra, obsoleto.
async function verifyToken(sym){
 if(state.assets[sym]&&Date.now()-state.assets[sym].at<600000)return state.assets[sym];
 const t=TOKENS[sym],cands=t.native?TON_ADDRS:[t.addr];
 for(const addr of cands){
  try{
   const j=await getJson(STON_API+"/assets/"+addr);const a=j?.asset||j;
   if(!a)continue;
   const symbol=String(a.symbol||a.display_name||"");
   const bad=a.blacklisted===true||a.deprecated===true;
   const symOk=t.symbols.some(s=>s.toLowerCase()===symbol.toLowerCase());
   if(bad||!symOk){state.assetErr[sym]=bad?"token en lista negra/obsoleto en STON.fi":"símbolo oficial no coincide ("+symbol+")";state.assets[sym]=null;return null}
   const v={addr,dec:Number.isInteger(Number(a.decimals))?Number(a.decimals):t.dec,priceUSD:Number(a.dex_price_usd||a.third_party_usd_price||0),symbol,at:Date.now()};
   state.assets[sym]=v;delete state.assetErr[sym];return v;
  }catch(e){state.sourceErr.ston=String(e.message||e)}
 }
 state.assetErr[sym]=state.assetErr[sym]||"STON.fi no responde para "+sym;
 return null;
}
async function poolTvl(addr){
 const c=state.pools[addr];if(c&&Date.now()-c.at<300000)return c.tvl;
 try{const j=await getJson(STON_API+"/pools/"+addr);const p=j?.pool||j;const tvl=Number(p?.lp_total_supply_usd||0);state.pools[addr]={tvl,at:Date.now()};return tvl}
 catch{return 0}
}
async function stonLeg(fromSym,toSym,units){
 const a=state.assets[fromSym],b=state.assets[toSym];
 const key=fromSym+">"+toSym;
 if(state.noPool[key]&&Date.now()-state.noPool[key]<1800000)throw new Error("sin pool directo "+key+" en STON.fi");
 const q="offer_address="+a.addr+"&ask_address="+b.addr+"&units="+Math.floor(units)+"&slippage_tolerance="+RULES.slippage+"&dex_v2=true";
 let j;
 try{j=await getJson(STON_API+"/swap/simulate?"+q,{method:"POST"})}
 catch(e){if(/HTTP 4/.test(e.message))state.noPool[key]=Date.now();throw new Error("STON.fi simulate "+key+": "+e.message)}
 const ask=Number(j.ask_units),min=Number(j.min_ask_units);
 if(!(ask>0&&min>0))throw new Error("STON.fi sin salida real "+key);
 const tvl=j.pool_address?await poolTvl(j.pool_address):0;
 return {venue:"STON.fi",from:fromSym,to:toSym,offerUnits:Math.floor(units),askUnits:ask,minAskUnits:min,impactPct:Number(j.price_impact||0)*100,
  gasNano:Number(j.gas_params?.estimated_gas_consumption||0),feeUnits:Number(j.fee_units||0),feePct:Number(j.fee_percent||0),tvlUSD:tvl,binding:true,pool:j.pool_address||"",
  url:stonSwapUrl(a.addr,b.addr,(Math.floor(units)/10**a.dec).toString())};
}
async function loadDedust(){
 if(state.dedust&&Date.now()-state.dedustAt<300000)return state.dedust;
 try{
  const list=await getJson(DEDUST_API+"/pools");
  const want=new Set(Object.values(TOKENS).filter(t=>!t.native).map(t=>friendlyToRaw(t.addr)));
  state.dedust=(Array.isArray(list)?list:[]).filter(p=>String(p.type||"volatile")==="volatile"&&(p.assets||[]).every(x=>x.type==="native"||want.has(friendlyToRaw(x.address))));
  state.dedustAt=Date.now();delete state.sourceErr.dedust;
 }catch(e){state.sourceErr.dedust=String(e.message||e)}
 return state.dedust;
}
function dedustLeg(fromSym,toSym,units){
 const id=s=>TOKENS[s].native?"native":friendlyToRaw(TOKENS[s].addr);
 const key=x=>x.type==="native"?"native":friendlyToRaw(x.address);
 const pools=(state.dedust||[]).filter(p=>{const k=(p.assets||[]).map(key);return k.includes(id(fromSym))&&k.includes(id(toSym))});
 let best=null;
 for(const p of pools){
  const k=p.assets.map(key),i=k.indexOf(id(fromSym)),o=k.indexOf(id(toSym));
  const fee=Number(p.tradeFee||0.25)/100;
  const out=cpOut(units,p.reserves?.[i],p.reserves?.[o],fee);
  if(!best||out>best.askUnits){
   const a=state.assets[fromSym],b=state.assets[toSym];
   const tvl=b&&b.priceUSD?2*Number(p.reserves?.[o]||0)/10**b.dec*b.priceUSD:0;
   const spot=Number(p.reserves[o])/Number(p.reserves[i]);
   best={venue:"DeDust",from:fromSym,to:toSym,offerUnits:units,askUnits:out,minAskUnits:out*(1-RULES.slippage),impactPct:spot>0?(1-out/(units*(1-fee)*spot))*100:100,
    gasNano:250000000,feeUnits:units*fee,feePct:fee,tvlUSD:tvl,binding:false,pool:p.address,
    url:"https://dedust.io/swap/"+encodeURIComponent(fromSym==="TON"?"TON":TOKENS[fromSym].addr)+"/"+encodeURIComponent(toSym==="TON"?"TON":TOKENS[toSym].addr)};
  }
 }
 if(!best||!(best.askUnits>0))throw new Error("DeDust sin pool volátil "+fromSym+"/"+toSym);
 return best;
}
async function evalRoute(route,capEUR,fx){
 const reasons=[];
 const syms=[...new Set(route.path)];
 for(const s of syms)if(!state.assets[s])reasons.push(state.assetErr[s]||"token "+s+" no verificado");
 if(!fx)reasons.push("sin tipo EUR/USD (frankfurter)");
 if(reasons.length)return {route,legs:[],eval:evaluateCycle({legs:[],reasons}),quoteAt:Date.now()};
 const st=state.assets[route.start],ton=state.assets.TON;
 if(!(st.priceUSD>0))return {route,legs:[],eval:evaluateCycle({legs:[],reasons:["STON.fi sin precio para "+route.start]}),quoteAt:Date.now()};
 const startUnits=Math.floor(capEUR/fx/st.priceUSD*10**st.dec);
 const legs=[];let units=startUnits;
 try{
  for(let i=0;i<route.path.length-1;i++){
   const venue=route.venues?route.venues[i]:"STON.fi";
   const leg=venue==="DeDust"?dedustLeg(route.path[i],route.path[i+1],units):await stonLeg(route.path[i],route.path[i+1],units);
   legs.push(leg);units=leg.askUnits;
  }
 }catch(e){reasons.push(String(e.message||e))}
 // Patas 2+ se precargan con el mínimo garantizado de la anterior: nunca piden más saldo del que tendrás.
 for(let i=1;i<legs.length;i++)if(legs[i].venue==="STON.fi"){const f=state.assets[legs[i].from],t=state.assets[legs[i].to];
  legs[i].url=stonSwapUrl(f.addr,t.addr,(Math.floor(legs[i-1].minAskUnits)/10**f.dec).toString())}
 const quoteAt=Date.now();
 const ev=evaluateCycle({legs:reasons.length?[]:legs,reasons,startUnits,startDec:st.dec,startPriceUSD:st.priceUSD,tonPriceUSD:ton?.priceUSD,quoteAt,now:quoteAt});
 return {route,legs,eval:ev,quoteAt,startUnits,startSym:route.start,startDec:st.dec,fx,capEUR};
}
function recordLog(results){
 const now=Date.now(),log=readJson(LOG_KEY,[]).filter(x=>x.t>=now-DAY);
 const ok=results.filter(r=>r.eval.netPct!=null).sort((a,b)=>b.eval.netPct-a.eval.netPct);
 const rows=ok.filter((r,i)=>i===0||r.eval.netPct>=RULES.minNetPct||r.eval.ready);
 if(!rows.length&&results[0])rows.push(results[0]);
 for(const r of rows)log.push({t:now,r:r.route.id,g:r.eval.grossPct==null?null:+r.eval.grossPct.toFixed(4),n:r.eval.netPct==null?null:+r.eval.netPct.toFixed(4),
  d:Math.round(r.eval.depth||0),a:r.eval.ageSec==null?null:+r.eval.ageSec.toFixed(1),x:r.eval.executability,b:r.eval.reasons.join("; ").slice(0,240)});
 writeJson(LOG_KEY,log);
}
async function scan(onlyIds){
 if(state.busy)return;state.busy=true;
 try{
  const fx=await loadFx();
  await Promise.all(Object.keys(TOKENS).map(verifyToken));
  const cap=capitalLimit(readJson(TRADES_KEY,[]));
  let routes=buildCycles(Object.keys(TOKENS));
  if(routes.some(r=>r.kind==="cross"))await loadDedust();
  if(onlyIds)routes=routes.filter(r=>onlyIds.includes(r.route?.id||r.id));
  const out=[];
  for(const r of routes)out.push(await evalRoute(r,cap.limit,fx));
  if(onlyIds){const map=new Map(state.results.map(x=>[x.route.id,x]));for(const o of out)map.set(o.route.id,o);state.results=[...map.values()]}
  else state.results=out;
  state.results.sort((a,b)=>(b.eval.netPct??-1e9)-(a.eval.netPct??-1e9));
  state.scanAt=Date.now();
  if(!onlyIds)recordLog(out);else if(out.some(o=>o.eval.ready))recordLog(out);
  const best=state.results[0];
  state.fast=!!(best&&best.eval.netPct!=null&&best.eval.netPct>=RULES.minNetPct*0.5);
 }finally{state.busy=false;if(typeof document!=="undefined"){render();schedule()}}
}
function schedule(){
 clearTimeout(state.timer);
 const ids=state.fast?state.results.filter(r=>r.eval.netPct>=RULES.minNetPct*0.5).map(r=>r.route.id):null;
 state.timer=setTimeout(()=>scan(ids&&Date.now()-state.lastFull<60000?ids:(state.lastFull=Date.now(),null)),state.fast?8000:60000);
}

const core={TOKENS,RULES,friendlyToRaw,cpOut,buildCycles,evaluateCycle,capitalLimit,episodes,frequencyStats,stonSwapUrl,
 scan,state,setStore:x=>{store=x},readLog:()=>readJson(LOG_KEY,[]),readTrades:()=>readJson(TRADES_KEY,[])};
if(typeof module!=="undefined"&&module.exports)module.exports=core;
if(typeof document==="undefined")return;

/* ---------- interfaz ---------- */
function legLine(l,dec){
 const fmt=(u,s)=>(Number(u)/10**(state.assets[s]?.dec??TOKENS[s].dec)).toLocaleString("es-ES",{maximumFractionDigits:6})+" "+s;
 return '<li><b>'+esc(l.venue)+'</b> · '+fmt(l.offerUnits,l.from)+' → '+fmt(l.askUnits,l.to)+' (mín. '+fmt(l.minAskUnits,l.to)+') · impacto '+l.impactPct.toFixed(3)+'% · gas ≈'+(l.gasNano/1e9).toFixed(3)+' TON · pool $'+Math.round(l.tvlUSD).toLocaleString("es-ES")+(l.binding?'':' · <i>indicativo (reservas)</i>')+'</li>';
}
function readyCard(r){
 const e=r.eval,fx=r.fx,st=r.startSym,dec=r.startDec;
 const u=x=>(x/10**dec).toLocaleString("es-ES",{maximumFractionDigits:6})+" "+st;
 const minEUR=r.capEUR*e.netPct/100,expEUR=r.capEUR*e.netExpPct/100;
 const feeTxt=r.legs.map(l=>l.venue+" "+(l.feePct*100).toFixed(2)+"%").join(" + ");
 const l1=r.legs[0],rest=r.legs.slice(1);
 return '<article class="tonReady" data-route="'+esc(r.route.id)+'" data-quote="'+r.quoteAt+'">'+
 '<span class="arbKicker">🟢 AUTO READY — EJECUTAR</span><h3>'+esc(r.route.path.join(" → "))+'</h3>'+
 '<dl class="tonGrid">'+
 '<div><dt>Activo</dt><dd>'+esc(r.route.path.slice(1,-1).join(" + "))+'</dd></div>'+
 '<div><dt>Capital</dt><dd>'+eur(r.capEUR)+' = '+u(r.startUnits)+'</dd></div>'+
 '<div><dt>Ruta exacta</dt><dd>'+esc(r.route.id)+'</dd></div>'+
 '<div><dt>Compra</dt><dd>'+esc(l1.venue+": "+l1.from+" → "+l1.to)+'</dd></div>'+
 '<div><dt>Venta</dt><dd>'+esc(rest.map(l=>l.venue+": "+l.from+" → "+l.to).join(" · "))+'</dd></div>'+
 '<div><dt>Gas</dt><dd>≈'+e.gasTon.toFixed(3)+' TON ('+eur(e.gasUSD*fx)+')</dd></div>'+
 '<div><dt>Fees</dt><dd>'+esc(feeTxt)+' (ya descontadas en el quote)</dd></div>'+
 '<div><dt>Slippage máximo</dt><dd>'+(RULES.slippage*100).toFixed(2)+'% por pata</dd></div>'+
 '<div><dt>Beneficio mínimo garantizado por quote</dt><dd>'+eur(minEUR)+' ('+pct(e.netPct)+')</dd></div>'+
 '<div><dt>Beneficio estimado</dt><dd>'+eur(expEUR)+' ('+pct(e.netExpPct)+')</dd></div>'+
 '<div><dt>Tiempo</dt><dd>'+r.legs.length+' swaps · ≈'+(r.legs.length*15)+' s</dd></div>'+
 '<div><dt>Validez del quote</dt><dd data-age>—</dd></div>'+
 '<div><dt>Fuente compra</dt><dd>'+esc(l1.venue)+' /v1/swap/simulate</dd></div>'+
 '<div><dt>Fuente venta</dt><dd>'+esc([...new Set(rest.map(l=>l.venue))].join(" + "))+' /v1/swap/simulate</dd></div>'+
 '</dl><ol class="tonLegs">'+r.legs.map(l=>legLine(l)).join("")+'</ol>'+
 '<div class="arbExecActions">'+
 '<button class="primaryAction" data-act="buy">1 · ABRIR COMPRA</button>'+
 rest.map((l,i)=>'<a href="'+esc(l.url)+'" target="_blank" rel="noopener">2'+(rest.length>1?String.fromCharCode(97+i):"")+' · ABRIR VENTA / CONFIRMAR RUTA ('+esc(l.from+"→"+l.to)+')</a>').join("")+
 '<button data-act="log">3 · REGISTRAR RESULTADO</button></div>'+
 '<small>Al pulsar 1 la app vuelve a cotizar; si deja de cumplir ≥'+RULES.minNetPct+'% neto o el quote supera '+RULES.maxQuoteAgeSec+' s, cancela y no abre nada. Las patas se ejecutan una tras otra (no es atómico): si una se revierte por slippage, el contrato devuelve los fondos y quedas en el activo intermedio.</small>'+
 '</article>';
}
function render(){
 const host=document.getElementById("tonArbScanner");if(!host)return;
 const now=Date.now(),trades=readJson(TRADES_KEY,[]),cap=capitalLimit(trades),fx=state.fx||0;
 const fs=frequencyStats(readJson(LOG_KEY,[]),now,cap.limit);
 const ready=state.results.filter(r=>r.eval.ready&&now-r.quoteAt<=RULES.maxQuoteAgeSec*1000);
 const errs=Object.entries(state.sourceErr).map(([k,v])=>k+": "+v);
 const status=!state.scanAt?"Cotizando en STON.fi…":ready.length?"🟢 VERDE REAL ENCONTRADO":"🔴 NO EXISTE VERDE EJECUTABLE AHORA";
 host.innerHTML='<section class="tonScanner">'+
 '<div class="arbAgentHead"><div><span class="arbKicker">ESCÁNER SAME-WALLET TON · FUENTES PRIMARIAS</span><h3>'+status+'</h3></div><span class="arbAgentMode">'+(state.fast?"MODO RÁPIDO 8 s":"CADA 60 s")+'</span></div>'+
 '<p class="tonMeta">Último barrido: '+(state.scanAt?new Date(state.scanAt).toLocaleTimeString("es-ES"):"—")+' · '+state.results.length+' rutas · capital por operación '+eur(cap.limit)+' (tramo '+cap.tier+') · disponible '+eur(cap.available)+(fx?' · 1 USD = '+fx.toFixed(4)+' €':'')+'</p>'+
 (errs.length?'<p class="tonWarn">Fuente no accesible desde este dispositivo: '+esc(errs.join(" · "))+'. Sin quote primario no se marca nada en verde.</p>':'')+
 ready.slice(0,1).map(readyCard).join("")+(ready.length>1?'<p class="tonMeta">+'+(ready.length-1)+' rutas verdes más en la tabla.</p>':'')+
 '<div class="tonStats">'+
 stat(fs.lastHour,"oportunidades ≥1% última hora")+stat(fs.day,"oportunidades ≥1% en 24 h")+
 stat(fs.meanGapMin==null?"Datos insuficientes":fs.meanGapMin.toFixed(1)+" min","tiempo medio entre oportunidades")+
 stat(fs.greenMinutes+" min","tiempo total en verde")+
 stat(fs.bestNet==null?"—":pct(fs.bestNet),"mejor margen neto del día"+(fs.bestGreen==null?" (ninguno verde)":""))+
 stat(fs.enough?eur(fs.dailyPotentialEUR):"Datos insuficientes","beneficio potencial diario con "+eur(cap.limit)+" ("+fs.coverageH.toFixed(1)+" h de 24 h observadas)")+
 stat(eur(cap.realized),"beneficio REAL acumulado ("+trades.length+" operaciones)")+
 stat(fs.signals1+" min","minutos con neto ≥1% (incl. bloqueados)")+
 '</div>'+
 '<details class="tonTable"><summary>Todas las rutas barridas ('+state.results.length+')</summary><table><thead><tr><th>Ruta</th><th>Bruto</th><th>Neto mín.</th><th>Neto est.</th><th>Prof.</th><th>Estado / bloqueo</th></tr></thead><tbody>'+
 state.results.map(r=>'<tr class="'+(r.eval.ready?"g":"")+'"><td>'+esc(r.route.id)+'</td><td>'+pct(r.eval.grossPct)+'</td><td>'+pct(r.eval.netPct)+'</td><td>'+pct(r.eval.netExpPct)+'</td><td>'+(r.eval.depth?'$'+Math.round(r.eval.depth).toLocaleString("es-ES"):"—")+'</td><td>'+esc(r.eval.ready?"VERDE":r.eval.reasons.join("; "))+'</td></tr>').join("")+
 '</tbody></table></details>'+
 '<div class="arbAgentActions"><button id="tonScanNow">Barrer ahora</button><button id="tonExportLog">Exportar registro 24 h</button>'+(trades.length?'':'')+'</div>'+
 '<small>Reglas: neto mínimo '+RULES.minNetPct+'% tras gas y slippage máximo · quote ≤ '+RULES.maxQuoteAgeSec+' s · impacto ≤ '+RULES.maxImpactPct+'% por pata · pool ≥ $'+RULES.minPoolTvlUSD.toLocaleString("es-ES")+' · tokens verificados en STON.fi (no lista negra). DeDust se calcula desde reservas de su API oficial y nunca marca verde por sí solo. El registro solo crece mientras la app está abierta. Nunca se mueve dinero sin tu confirmación en la wallet.</small>'+
 '</section>';
 bind();tick();
}
const stat=(v,l)=>'<div><b>'+esc(v)+'</b><span>'+esc(l)+'</span></div>';
function tick(){
 document.querySelectorAll(".tonReady").forEach(card=>{
  const left=RULES.maxQuoteAgeSec-(Date.now()-Number(card.dataset.quote))/1000,el=card.querySelector("[data-age]");
  if(el)el.textContent=left>0?left.toFixed(0)+" s restantes":"CADUCADO — recotizando";
  card.classList.toggle("expired",left<=0);
 });
}
function bind(){
 const now=document.getElementById("tonScanNow");if(now)now.onclick=()=>{state.lastFull=Date.now();scan()};
 const ex=document.getElementById("tonExportLog");if(ex)ex.onclick=()=>{
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),fields:{t:"timestamp",r:"ruta",g:"grossPct",n:"netPct",d:"depth",a:"quoteAge",x:"executability",b:"reasonBlocked"},log:readJson(LOG_KEY,[]),trades:readJson(TRADES_KEY,[])},null,1)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cardvault-arbitraje-ton-24h.json";a.click();
 };
 document.querySelectorAll(".tonReady").forEach(card=>{
  const id=card.dataset.route,r=state.results.find(x=>x.route.id===id);if(!r)return;
  const buy=card.querySelector('[data-act="buy"]');
  if(buy)buy.onclick=async()=>{
   const w=window.open("about:blank","_blank");
   for(let i=0;state.busy&&i<100;i++)await new Promise(ok=>setTimeout(ok,200));
   await scan([id]);
   const fresh=state.results.find(x=>x.route.id===id);
   if(fresh&&fresh.eval.ready&&Date.now()-fresh.quoteAt<=RULES.maxQuoteAgeSec*1000){if(w)w.location.href=fresh.legs[0].url;else location.href=fresh.legs[0].url}
   else{if(w)w.close();alert("Cancelado: al recotizar, la ruta ya no cumple ≥"+RULES.minNetPct+"% neto con quote ≤ "+RULES.maxQuoteAgeSec+" s.")}
  };
  const lg=card.querySelector('[data-act="log"]');
  if(lg)lg.onclick=()=>registerResult(r);
 });
}
function registerResult(r){
 const st=r.startSym,dec=r.startDec,start=r.startUnits/10**dec;
 const got=prompt("¿Cuántos "+st+" tienes al terminar la ruta "+r.route.id+"? (empezaste con "+start.toLocaleString("es-ES",{maximumFractionDigits:6})+" "+st+")");
 if(got==null)return;
 const recv=Number(String(got).replace(",","."));if(!(recv>=0)){alert("Cantidad no válida.");return}
 const incident=confirm("¿Hubo alguna incidencia (pata revertida, fondos atascados, error)? Aceptar = SÍ, Cancelar = NO");
 const px=state.assets[st]?.priceUSD||0,ton=state.assets.TON?.priceUSD||0,fx=state.fx||r.fx;
 const resultEUR=((recv-start)*px-r.eval.gasTon*ton)*fx;
 const trades=readJson(TRADES_KEY,[]);
 trades.push({at:new Date().toISOString(),route:r.route.id,capitalEUR:r.capEUR,startUnits:start,endUnits:recv,gasTon:r.eval.gasTon,resultEUR:+resultEUR.toFixed(4),incident});
 writeJson(TRADES_KEY,trades);render();
 alert("Resultado registrado: "+eur(resultEUR)+". Nuevo límite: "+eur(capitalLimit(trades).limit)+".");
}
function start(){
 if(!document.getElementById("tonArbScanner"))return;
 state.lastFull=Date.now();render();scan();setInterval(tick,1000);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-state.scanAt>60000)scan()});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})(typeof globalThis!=="undefined"?globalThis:this);
