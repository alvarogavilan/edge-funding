(()=>{"use strict";
const KEY="cv_cardtrader_token",BASE="https://api.cardtrader.com/api/v2";
const norm=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const numKey=v=>{const m=String(v||"").match(/[A-Za-z]*\d+/);return m?m[0].replace(/^0+(?=\d)/,"").toLowerCase():""};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let busy=false,cache={games:null,expansions:null,blueprints:new Map(),usdEur:null};
function token(){return localStorage.getItem(KEY)||""}
function setToken(v){v=String(v||"").trim();if(v)localStorage.setItem(KEY,v);else localStorage.removeItem(KEY);return !!v}
async function ct(path){
 const t=token();if(!t)throw new Error("TOKEN_MISSING");
 const r=await fetch(BASE+path,{headers:{Authorization:"Bearer "+t,Accept:"application/json"}});
 if(r.status===401)throw new Error("TOKEN_INVALID");
 if(!r.ok)throw new Error("CARDTRADER_"+r.status);
 return r.json();
}
async function verify(){try{await ct("/info");return {ok:true}}catch(e){return {ok:false,error:String(e.message||e)}}}
async function bootstrap(){
 if(!cache.games)cache.games=await ct("/games");
 if(!cache.expansions)cache.expansions=await ct("/expansions");
 if(!cache.usdEur){
  try{const r=await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR");const j=await r.json();cache.usdEur=Number(j?.rates?.EUR)||null}catch{}
 }
 return cache;
}
function gameId(universe){
 const re=universe==="lorcana"?/lorcana/i:/pok[eé]mon/i;
 return (cache.games||[]).find(x=>re.test(String(x.name||x.display_name||"")))?.id||null;
}
async function blueprintsFor(exp){
 if(cache.blueprints.has(exp.id))return cache.blueprints.get(exp.id);
 const j=await ct("/blueprints/export?expansion_id="+encodeURIComponent(exp.id));
 const rows=Array.isArray(j)?j:(j?.array||j?.results||j?.data||[]);
 cache.blueprints.set(exp.id,rows);return rows;
}
async function marketplaceForExpansion(exp,marketCache){
 if(marketCache.has(exp.id))return marketCache.get(exp.id);
 const j=await ct("/marketplace/products?expansion_id="+encodeURIComponent(exp.id));
 let rows=[];
 if(Array.isArray(j))rows=j;
 else if(j&&typeof j==="object"){
  if(Array.isArray(j.array))rows=j.array;
  else if(Array.isArray(j.results))rows=j.results;
  else rows=Object.values(j).flatMap(v=>Array.isArray(v)?v:[]);
 }
 marketCache.set(exp.id,rows);
 return rows;
}
async function candidateRows(){
 const out=[];
 for(const u of ["pokemon","lorcana"]){
  const pack=state.autoMarketScans?.[u];
  for(const x of (Array.isArray(pack?.signals)?pack.signals:[]))out.push({...x,universe:u});
 }
 for(const x of (state.marketScan||[]))out.push(x);
 try{const all=await window.CVAllMarketSignals?.();for(const x of (all||[]))out.push(x)}catch{}
 const seen=new Set();
 return out.filter(x=>x?.name&&x?.set).filter(x=>{
  const k=[x.universe,norm(x.canonicalName||x.name),norm(x.canonicalSet||x.set),numKey(x.number),norm(x.language||x.languageCode||""),norm(x.finish||"")].join("|");
  if(seen.has(k))return false;seen.add(k);return true;
 }).filter(x=>{const p=Number(x.price)||0,cur=String(x.currency||"EUR").toUpperCase(),eur=cur==="USD"&&cache.usdEur?p*cache.usdEur:p;return !p||eur>=20})
 .sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0)||(Number(b.price)||0)-(Number(a.price)||0)).slice(0,320);
}
function pctMedian(a){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]}
function localArbitrageForCandidate(c,offers){
 const out=[],groups=new Map();
 for(const o of offers){
  if(!o||!/near mint|mint/i.test(String(o.condition||""))||!(Number(o.total)>0)||!o.language)continue;
  const k=norm(o.language);
  if(!groups.has(k))groups.set(k,[]);
  groups.get(k).push(o);
 }
 for(const rows of groups.values()){
  rows.sort((a,b)=>Number(a.total)-Number(b.total));
  if(rows.length<5)continue;
  const entry=rows[0],sameMedian=pctMedian(rows.map(x=>Number(x.total)).filter(x=>x>0));
  const refCurrency=String(c.currency||"EUR").toUpperCase();
  const rawRef=Number(c.price||c.avg30||c.trend||0);
  const marketRefEUR=refCurrency==="USD"&&cache.usdEur?rawRef*cache.usdEur:rawRef;
  if(!(marketRefEUR>0)||!(sameMedian>0))continue;
  const grossExit=Math.min(marketRefEUR,sameMedian);
  const prudentGross=grossExit*.88,netExit=prudentGross*.95-3;
  const edge=netExit-Number(entry.total),roi=Number(entry.total)>0?edge/Number(entry.total)*100:0;
  const spread=grossExit>0?(grossExit-Number(entry.total))/grossExit*100:0;
  const pass=Number(entry.total)>=20&&edge>=40&&roi>=35&&spread>=25;
  out.push({
   product_id:"local:"+String(entry.externalId||entry.id||c.id||c.name),universe:c.universe||"pokemon",name:c.name,set_name:c.set||"",number:c.number||"",
   image:c.image||"",blueprint_id:String(entry.externalId||"").replace(/^ct:/,""),lang:entry.language||"",condition:entry.condition||"Near Mint",
   finish:entry.variant||"",price_eur:Number(entry.total),seller:entry.seller||"",url:entry.url||"",fetched_at:entry.checkedAt||new Date().toISOString(),
   exit_gross:Math.round(grossExit*100)/100,exit_net:Math.round(netExit*100)/100,edge:Math.round(edge*100)/100,roi:Math.round(roi*10)/10,
   spread:Math.round(spread*10)/10,pass,evidence_refs:4,same_language_offers:rows.length,same_language_median:Math.round(sameMedian*100)/100,
   exit_basis:"mínimo entre referencia Cardmarket actual y mediana CardTrader del mismo idioma"
  });
 }
 return out;
}
function parseOffer(p,bp,c){
 if(p?.on_vacation)return null;
 const ph=p.properties_hash||{},lang=Object.entries(ph).find(([k])=>/language$/i.test(k))?.[1]||"";
 const condition=ph.condition||"",raw=(p.price?.cents||0)/100,currency=String(p.price?.currency||"EUR").toUpperCase();
 const price=currency==="USD"&&cache.usdEur?raw*cache.usdEur:currency==="EUR"?raw:0;
 if(!(price>0))return null;
 return {id:"ct-direct:"+bp.id+":"+p.id,externalId:"ct:"+bp.id,universe:c.universe||"pokemon",name:c.name,set:c.set,number:c.number,
  language:lang,variant:[bp.version||"",Object.entries(ph).filter(([k,v])=>/foil|reverse|holo|edition/i.test(k)&&v===true).map(([k])=>k).join(",")].filter(Boolean).join(" · "),
  condition,seller:p.user?.username||"",shop:"CardTrader",price:Math.round(price*100)/100,shipping:0,total:Math.round(price*100)/100,currency:"EUR",
  url:"https://www.cardtrader.com/cards/"+bp.id,checkedAt:new Date().toISOString(),source:"CardTrader API directa"};
}
function discoverExpansionDislocations(expansionProducts,bps,universe){
 const byBp=new Map(),bpMap=new Map((bps||[]).map(b=>[Number(b.id),b]));
 for(const prod of expansionProducts||[]){
  if(prod?.graded||prod?.on_vacation)continue;
  const bpId=Number(prod?.blueprint_id);if(!bpId)continue;
  const bp=bpMap.get(bpId);if(!bp)continue;
  const ph=prod.properties_hash||{},lang=Object.entries(ph).find(([k])=>/language$/i.test(k))?.[1]||"",condition=ph.condition||"";
  const raw=(prod.price?.cents||0)/100,currency=String(prod.price?.currency||"EUR").toUpperCase(),price=currency==="USD"&&cache.usdEur?raw*cache.usdEur:currency==="EUR"?raw:0;
  if(!(price>=20)||!lang||!/near mint|mint/i.test(String(condition)))continue;
  const finish=Object.entries(ph).filter(([k,v])=>/foil|reverse|holo|edition/i.test(k)&&v===true).map(([k])=>k).join(",");
  const k=[bpId,norm(lang),norm(finish)].join("|");
  if(!byBp.has(k))byBp.set(k,[]);
  byBp.get(k).push({prod,bp,lang,condition,finish,price});
 }
 const out=[];
 for(const rows of byBp.values()){
  if(rows.length<5)continue;
  rows.sort((a,b)=>a.price-b.price);
  const entry=rows[0],median=pctMedian(rows.map(x=>x.price));
  if(!(median>0))continue;
  const gap=(median-entry.price)/median*100;
  if(gap<35||median-entry.price<40)continue;
  const ph=entry.prod.properties_hash||{},number=ph.collector_number||ph.pokemon_number||ph.lorcana_number||ph.number||"";
  out.push({universe,name:entry.bp.name||"",set:"",number:String(number||""),blueprintId:entry.bp.id,language:entry.lang,condition:entry.condition,
   variant:[entry.bp.version||"",entry.finish].filter(Boolean).join(" · "),price:entry.price,medianSameMarket:Math.round(median*100)/100,gapPct:Math.round(gap*10)/10,
   seller:entry.prod.user?.username||"",url:"https://www.cardtrader.com/cards/"+entry.bp.id,image:entry.bp.image_url||entry.bp.image?.url||"",offers:rows.length,
   source:"CardTrader · anomalía interna",status:"discovered"});
 }
 return out.sort((a,b)=>(b.medianSameMarket-b.price)-(a.medianSameMarket-a.price));
}
function referenceForDiscovery(x,candidates){
 const same=(candidates||[]).filter(r=>norm(r.name)===norm(x.name)&&(!x.number||numKey(r.number)===numKey(x.number)));
 if(!same.length)return null;
 const best=same.sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0))[0];
 const cur=String(best.currency||"EUR").toUpperCase(),raw=Number(best.price||best.avg30||best.trend||0);
 const eur=cur==="USD"&&cache.usdEur?raw*cache.usdEur:raw;
 return eur>0?{row:best,eur}:null;
}
async function scan(){
 if(busy||!token())return {ok:false,reason:"no-token"};
 busy=true;
 try{
  await bootstrap();const rows=await candidateRows(),found=[],arbs=[],discovered=[],marketCache=new Map(),blueprintCacheByExp=new Map(),diag={candidates:rows.length,expansionExact:0,uniqueExpansions:0,blueprintExact:0,ambiguousBlueprint:0,withOffers:0,languageDepth:0,economicPass:0,dislocations:0,pokemon:0,lorcana:0};
  for(const c of rows){
   const gid=gameId(c.universe==="lorcana"?"lorcana":"pokemon");if(!gid)continue;
   const setNorm=norm(c.canonicalSet||c.set),setCode=norm(c.setId||"");
   const exps=(cache.expansions||[]).filter(e=>{
    if(e.game_id!==gid)return false;
    const en=norm(e.name),ec=norm(e.code||"");
    return (!!setCode&&ec===setCode)||en===setNorm||(setNorm&&en.includes(setNorm))||(en&&setNorm.includes(en));
   });
   if(exps.length!==1)continue;
   diag.expansionExact++;
   const bps=await blueprintsFor(exps[0]);blueprintCacheByExp.set(exps[0].id,bps);
   let expansionProducts;try{expansionProducts=await marketplaceForExpansion(exps[0],marketCache)}catch(e){if(String(e.message).includes("429")){await sleep(1100);continue}throw e}
   diag.uniqueExpansions=marketCache.size;
   const baseName=norm(String(c.canonicalName||c.name).replace(/ · Foil$/i,"").replace(/ · [^·]+$/,""));
   const tcgId=Number(c.tcgplayer)||0,nk=numKey(c.number);
   let exact=tcgId?bps.filter(b=>Number(b.tcg_player_id)===tcgId):[];
   if(!exact.length){
    exact=bps.filter(b=>{
     const bn=norm(b.name),bv=norm(b.version||""),full=norm([b.name,b.version].filter(Boolean).join(" "));
     const nameOk=bn===baseName||full===norm(String(c.name).replace(/ · Foil$/i,""));
     const finish=norm(c.finish||"");
     const versionOk=!finish||!bv||bv.includes(finish)||finish.includes(bv);
     return nameOk&&versionOk;
    });
   }
   /* Fallback Pokémon internacional: el número está en properties_hash del producto real,
      aunque no exista en Blueprint. Esto rescata JP/promos con nombre localizado. */
   if(exact.length!==1&&nk){
    const want=String(c.languageCode||c.language||"").toLowerCase(),aliases={japanese:"ja",english:"en",spanish:"es",italian:"it",german:"de",french:"fr",korean:"ko",jp:"ja"};
    const wk=aliases[want]||want,ids=new Set();
    for(const prod of expansionProducts||[]){
     const ph=prod.properties_hash||{},pn=numKey(ph.collector_number||ph.pokemon_number||ph.number||"");
     const rawLang=Object.entries(ph).find(([k])=>/language$/i.test(k))?.[1]||"",got=String(rawLang).toLowerCase(),gk=aliases[got]||got;
     if(pn===nk&&(!wk||!gk||wk===gk))ids.add(Number(prod.blueprint_id));
    }
    if(ids.size===1)exact=bps.filter(b=>ids.has(Number(b.id)));
   }
   if(exact.length!==1){diag.ambiguousBlueprint++;continue}
   diag.blueprintExact++;
   diag[c.universe==="lorcana"?"lorcana":"pokemon"]++;
   const bp=exact[0];
   const products=(expansionProducts||[]).filter(p=>Number(p.blueprint_id)===Number(bp.id));
   const local=[];
   for(const p of products){
     const o=parseOffer(p,bp,c);if(!o||!/near mint|mint/i.test(o.condition)||p.graded)continue;
     const want=String(c.languageCode||c.language||"").toLowerCase(),got=String(o.language||"").toLowerCase();
     const aliases={japanese:"ja",english:"en",spanish:"es",italian:"it",german:"de",french:"fr",korean:"ko",portuguese:"pt",dutch:"nl",polish:"pl",russian:"ru","traditional chinese":"zh-tw","simplified chinese":"zh-cn",indonesian:"id",thai:"th",jp:"ja",kr:"ko","zh-tw":"zh-tw","zh-cn":"zh-cn"};
     const wk=aliases[want]||want,gk=aliases[got]||got;
     if(wk&&gk&&wk!==gk)continue;
     found.push(o);local.push(o);
   }
   if(local.length)diag.withOffers++;
   const langs=new Map();for(const o of local){const k=norm(o.language||"");if(k)langs.set(k,(langs.get(k)||0)+1)}
   if([...langs.values()].some(n=>n>=5))diag.languageDepth++;
   const calc=localArbitrageForCandidate(c,local);arbs.push(...calc);diag.economicPass+=calc.filter(x=>x.pass).length;
   await sleep(30);
  }
  for(const [expId,products] of marketCache){
   const bps=blueprintCacheByExp.get(expId)||[];
   const exp=(cache.expansions||[]).find(e=>Number(e.id)===Number(expId));
   if(!exp)continue;
   const sample=rows.find(r=>{
    const gid=gameId(r.universe==="lorcana"?"lorcana":"pokemon"),setNorm=norm(r.set);
    return exp.game_id===gid&&(norm(exp.name)===setNorm||norm(exp.name).includes(setNorm)||setNorm.includes(norm(exp.name)));
   });
   const universe=sample?.universe||"pokemon";
   const ds=discoverExpansionDislocations(products,bps,universe);
   for(const x of ds)x.set=exp.name||sample?.set||"";
   discovered.push(...ds);
  }
  const verified=[];
  for(const x of discovered){
   const ref=referenceForDiscovery(x,rows);if(!ref)continue;
   const grossExit=Math.min(ref.eur,x.medianSameMarket),netExit=grossExit*.88*.95-3,edge=netExit-x.price,roi=edge/x.price*100;
   if(edge>=40&&roi>=35&&x.gapPct>=35){
    verified.push({product_id:"disloc:"+x.blueprintId,universe:x.universe,name:x.name,set_name:x.set||ref.row.set||"",number:x.number||ref.row.number||"",
     image:x.image||ref.row.image||"",blueprint_id:x.blueprintId,lang:x.language,condition:x.condition,finish:x.variant,price_eur:x.price,seller:x.seller,url:x.url,
     fetched_at:new Date().toISOString(),exit_gross:Math.round(grossExit*100)/100,exit_net:Math.round(netExit*100)/100,edge:Math.round(edge*100)/100,roi:Math.round(roi*10)/10,
     spread:x.gapPct,pass:true,evidence_refs:4,same_language_offers:x.offers,same_language_median:x.medianSameMarket,exit_basis:"anomalía CardTrader + referencia de mercado externa"});
   }
  }
  diag.dislocations=discovered.length;diag.economicPass+=verified.length;arbs.push(...verified);
  state.cardTraderDislocations=discovered.slice(0,100);
  state.euOffers=Array.isArray(state.euOffers)?state.euOffers:[];
  state.euOffers=state.euOffers.filter(o=>!String(o.id||"").startsWith("ct-direct:")).concat(found);
  state.crossMarketArbitrageLocal=arbs.filter(x=>x.pass).sort((a,b)=>b.edge-a.edge||b.roi-a.roi);
  state.cardTraderDirect={at:new Date().toISOString(),offers:found.length,approved:state.crossMarketArbitrageLocal.length,scanned:rows.length,usdEur:cache.usdEur,diagnostics:diag,status:"ok"};save();
  try{window.renderOpportunityEngine?.()}catch{}try{window.CVSimpleHome?.render?.()}catch{}
  return {ok:true,offers:found.length,approved:state.crossMarketArbitrageLocal.length,scanned:rows.length};
 }catch(e){
  state.cardTraderDirect={at:new Date().toISOString(),offers:0,status:"error",error:String(e.message||e)};save();
  return {ok:false,error:String(e.message||e)};
 }finally{busy=false}
}
window.CVCardTraderDirect={scan,verify,setToken,hasToken:()=>!!token()};
})();