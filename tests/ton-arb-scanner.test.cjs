const assert=require("node:assert/strict");
const core=require("../ton-arb-scanner.js");
const {evaluateCycle,capitalLimit,frequencyStats,cpOut,friendlyToRaw,TOKENS}=core;

// --- evaluateCycle: verde solo con neto mínimo ≥1% tras gas y slippage ---
const now=1_000_000;
const leg=(o,a,m,extra)=>({offerUnits:o,askUnits:a,minAskUnits:m,impactPct:0.1,gasNano:10_000_000,tvlUSD:1e6,binding:true,...extra});
const base={startUnits:20e6,startDec:6,startPriceUSD:1,tonPriceUSD:3,quoteAt:now,now};
let e=evaluateCycle({...base,legs:[leg(20e6,10e9,9.98e9),leg(10e9,20.6e6,20.56e6),leg(20.6e6,20.7e6,20.66e6)]});
assert.equal(e.ready,true,e.reasons.join());
assert.ok(e.netPct>=1&&e.netPct<e.netExpPct);
// gas: 3×0.15 TON×3$ = 1.35$ sobre 20$ = 6.75% → no verde
e=evaluateCycle({...base,legs:[leg(20e6,10e9,9.98e9,{gasNano:150_000_000}),leg(10e9,20.6e6,20.56e6,{gasNano:150_000_000}),leg(20.6e6,20.7e6,20.66e6,{gasNano:150_000_000})]});
assert.equal(e.ready,false);
assert.ok(e.reasons.some(r=>r.startsWith("neto mínimo")));
// quote > 10 s
e=evaluateCycle({...base,now:now+10_001,legs:[leg(20e6,10e9,9.98e9),leg(10e9,20.6e6,20.56e6),leg(20.6e6,20.7e6,20.66e6)]});
assert.ok(e.reasons.some(r=>r.includes("10 s")));
// pata indicativa, impacto, profundidad
for(const bad of [{binding:false},{impactPct:0.6},{tvlUSD:19_999}])
  assert.equal(evaluateCycle({...base,legs:[leg(20e6,10e9,9.98e9,bad),leg(10e9,20.6e6,20.56e6),leg(20.6e6,20.7e6,20.66e6)]}).ready,false,JSON.stringify(bad));
// ciclo con pérdida
assert.equal(evaluateCycle({...base,legs:[leg(20e6,10e9,9.98e9),leg(10e9,19.9e6,19.86e6),leg(19.9e6,19.88e6,19.84e6)]}).ready,false);
assert.equal(evaluateCycle({legs:[],reasons:["x"]}).ready,false);

// --- capital: 20 € → 50 € → disponible completo; nunca aportaciones externas ---
assert.deepEqual([capitalLimit([]).limit,capitalLimit([]).available],[20,100]);
assert.equal(capitalLimit([{resultEUR:0.3}]).limit,50);
assert.equal(capitalLimit([{resultEUR:0.3},{resultEUR:0.4}]).limit,100.7);
assert.equal(capitalLimit([{resultEUR:0.3},{resultEUR:0.4,incident:true}]).limit,20);
assert.equal(capitalLimit([{resultEUR:0.3},{resultEUR:-1}]).available,99.3);
assert.equal(capitalLimit([{resultEUR:-200}]).limit,0);

// --- frecuencia: episodios, sin extrapolar con pocos datos ---
const T=Date.parse("2026-10-06T12:00:00Z"),m=60000;
const log=[];
for(let i=0;i<60;i++)log.push({t:T-i*m,r:"a",n:i<3||(i>=30&&i<32)?1.2:0.1,x:i<3||(i>=30&&i<32)?"VERDE":"BLOQUEADO"});
let f=frequencyStats(log,T,20);
assert.equal(f.day,2);assert.equal(f.lastHour,2);assert.equal(f.greenMinutes,5);
assert.equal(f.enough,false);assert.equal(f.dailyPotentialEUR,null);
assert.ok(Math.abs(f.meanGapMin-29)<0.01);
f=frequencyStats([{t:T,r:"a",n:null,x:"BLOQUEADO"}],T,20);
assert.equal(f.bestNet,null);assert.equal(f.meanGapMin,null);

// --- utilidades ---
assert.equal(friendlyToRaw(TOKENS.USDT.addr),"0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe");
assert.ok(Math.abs(cpOut(100,1000,1000,0)-90.909)<0.01);
assert.equal(cpOut(0,1,1,0),0);

// --- barrido completo con API simulada: rechaza token suplantado y detecta verde ---
(async()=>{
  const store={};core.setStore({read:k=>store[k]??null,write:(k,v)=>{store[k]=v}});
  const price={USDT:1,TON:3,USDe:1,STON:1,NOT:0.01};
  const bySym=Object.fromEntries(Object.entries(TOKENS).map(([s,t])=>[t.addr,s]));
  let spoof=false;
  global.fetch=async(url,opts)=>{
    const u=new URL(url);const ok=j=>({ok:true,json:async()=>j});
    if(u.host==="api.frankfurter.app")return ok({rates:{EUR:0.9}});
    if(u.host==="api.dedust.io")return {ok:false,status:403};
    if(u.pathname.startsWith("/v1/assets/")){const s=bySym[u.pathname.split("/").pop()];
      if(s==="NOT")return ok({asset:{symbol:"NOT",decimals:9,blacklisted:true,dex_price_usd:"0.01"}});
      return ok({asset:{symbol:spoof&&s==="USDe"?"USDe2":s==="USDT"?"USD₮":s,decimals:TOKENS[s].dec,dex_price_usd:String(price[s])}});}
    if(u.pathname.startsWith("/v1/pools/"))return ok({pool:{lp_total_supply_usd:"5000000"}});
    if(u.pathname==="/v1/swap/simulate"){
      assert.equal(opts.method,"POST");
      const a=bySym[u.searchParams.get("offer_address")],b=bySym[u.searchParams.get("ask_address")],n=Number(u.searchParams.get("units"));
      if([a,b].includes("STON")&&[a,b].includes("USDe"))return {ok:false,status:400};
      let usd=n/10**TOKENS[a].dec*price[a]*0.997; if(a==="USDT"&&b==="USDe")usd*=1.06; // USDe barato 6 %
      const out=Math.floor(usd/price[b]*10**TOKENS[b].dec);
      return ok({ask_units:String(out),min_ask_units:String(Math.floor(out*0.998)),price_impact:"0.001",fee_units:"0",fee_percent:"0.003",pool_address:"EQpool",gas_params:{estimated_gas_consumption:"60000000"}});
    }
    throw new Error("url inesperada "+url);
  };
  await core.scan();
  const res=core.state.results;
  const g=res.filter(r=>r.eval.ready).map(r=>r.route.id);
  assert.ok(g.includes("USDT>USDe>TON>USDT"),JSON.stringify(res.map(r=>[r.route.id,r.eval.netPct,r.eval.reasons])));
  assert.ok(!g.some(id=>id.includes("NOT")),"NOT en lista negra no puede ser verde");
  assert.ok(!g.some(id=>id.includes("DeDust")),"DeDust indicativo nunca verde");
  const best=res.find(r=>r.route.id==="USDT>USDe>TON>USDT");
  assert.equal(best.capEUR,20);
  assert.equal(best.startUnits,Math.floor(20/0.9*1e6));
  assert.ok(best.legs[0].url.startsWith("https://app.ston.fi/swap?ft="+TOKENS.USDT.addr));
  assert.ok(core.readLog().some(x=>x.x==="VERDE"&&x.r==="USDT>USDe>TON>USDT"&&x.n>=1));
  // token suplantado → todo lo que lo toca queda bloqueado
  spoof=true;for(const k of Object.keys(core.state.assets))core.state.assets[k]=null;
  await core.scan();
  assert.ok(!core.state.results.some(r=>r.eval.ready&&r.route.path.includes("USDe")));
  assert.ok(core.state.results.find(r=>r.route.id==="USDT>USDe>TON>USDT").eval.reasons.some(x=>x.includes("no coincide")));
  console.log("ton-arb-scanner: OK");
})().catch(e=>{console.error(e);process.exit(1)});
