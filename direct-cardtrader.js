(()=>{"use strict";
const KEY="cv_cardtrader_token",BASE="https://api.cardtrader.com/api/v2";
const norm=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const numKey=v=>{const m=String(v||"").match(/[A-Za-z]*\d+/);return m?m[0].replace(/^0+(?=\d)/,"").toLowerCase():""};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let busy=false,cache={games:null,expansions:null,blueprints:new Map()};
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
function candidateRows(){
 const out=[];
 for(const u of ["pokemon","lorcana"]){
  const pack=state.autoMarketScans?.[u];
  for(const x of (Array.isArray(pack?.signals)?pack.signals:[]))out.push({...x,universe:u});
 }
 for(const x of (state.marketScan||[]))out.push(x);
 const seen=new Set();
 return out.filter(x=>x?.name&&x?.set&&x?.number).filter(x=>{
  const k=[x.universe,norm(x.name),norm(x.set),numKey(x.number)].join("|");
  if(seen.has(k))return false;seen.add(k);return true;
 }).filter(x=>{const p=Number(x.price)||0,c=String(x.currency||"EUR").toUpperCase();return !p||(c==="EUR"&&p>=20&&p<=300)})
 .sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0)||(Number(b.price)||0)-(Number(a.price)||0)).slice(0,140);
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
  const cardmarketRef=refCurrency==="EUR"?Number(c.price||c.avg30||c.trend||0):0;
  if(!(cardmarketRef>0)||!(sameMedian>0))continue;
  const grossExit=Math.min(cardmarketRef,sameMedian);
  const prudentGross=grossExit*.88,netExit=prudentGross*.95-3;
  const edge=netExit-Number(entry.total),roi=Number(entry.total)>0?edge/Number(entry.total)*100:0;
  const spread=grossExit>0?(grossExit-Number(entry.total))/grossExit*100:0;
  const pass=Number(entry.total)>=20&&Number(entry.total)<=250&&edge>=40&&roi>=35&&spread>=25;
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
 const ph=p.properties_hash||{},lang=Object.entries(ph).find(([k])=>/language$/i.test(k))?.[1]||"";
 const condition=ph.condition||"",price=(p.price?.cents||0)/100,currency=p.price?.currency||"EUR";
 if(!(price>0)||currency!=="EUR")return null;
 return {id:"ct-direct:"+bp.id+":"+p.id,externalId:"ct:"+bp.id,universe:c.universe||"pokemon",name:c.name,set:c.set,number:c.number,
  language:lang,variant:[bp.version||"",Object.entries(ph).filter(([k,v])=>/foil|reverse|holo|edition/i.test(k)&&v===true).map(([k])=>k).join(",")].filter(Boolean).join(" · "),
  condition,seller:p.user?.username||"",shop:"CardTrader",price,shipping:0,total:price,currency:"EUR",
  url:"https://www.cardtrader.com/cards/"+bp.id,checkedAt:new Date().toISOString(),source:"CardTrader API directa"};
}
async function scan(){
 if(busy||!token())return {ok:false,reason:"no-token"};
 busy=true;
 try{
  await bootstrap();const rows=candidateRows(),found=[],arbs=[];
  for(const c of rows){
   const gid=gameId(c.universe==="lorcana"?"lorcana":"pokemon");if(!gid)continue;
   const setNorm=norm(c.set);
   const exps=(cache.expansions||[]).filter(e=>e.game_id===gid&&(norm(e.name)===setNorm||norm(e.name).includes(setNorm)||setNorm.includes(norm(e.name))));
   if(exps.length!==1)continue;
   const bps=await blueprintsFor(exps[0]);
   const nk=numKey(c.number),nn=norm(String(c.name).replace(/ · Foil$/i,""));
   const exact=bps.filter(b=>{
    const fp=b.fixed_properties||{},bn=numKey(fp.collector_number||fp.pokemon_number||fp.lorcana_number||fp.number||"");
    const nameOk=norm(b.name)===nn||norm([b.name,b.version].filter(Boolean).join(" "))===nn;
    const numOk=!nk||bn===nk;
    return nameOk&&numOk;
   });
   if(exact.length!==1)continue;
   const bp=exact[0];
   let j;try{j=await ct("/marketplace/products?blueprint_id="+bp.id)}catch(e){if(String(e.message).includes("429")){await sleep(600);continue}throw e}
   const products=Array.isArray(j)?j:(j?.[String(bp.id)]||j?.array||j?.results||[]);
   const local=[];
   for(const p of products||[]){const o=parseOffer(p,bp,c);if(o&&/near mint|mint/i.test(o.condition)&&!p.graded){found.push(o);local.push(o)}}
   arbs.push(...localArbitrageForCandidate(c,local));
   await sleep(80);
  }
  state.euOffers=Array.isArray(state.euOffers)?state.euOffers:[];
  state.euOffers=state.euOffers.filter(o=>!String(o.id||"").startsWith("ct-direct:")).concat(found);
  state.crossMarketArbitrageLocal=arbs.filter(x=>x.pass).sort((a,b)=>b.edge-a.edge||b.roi-a.roi);
  state.cardTraderDirect={at:new Date().toISOString(),offers:found.length,approved:state.crossMarketArbitrageLocal.length,scanned:rows.length,status:"ok"};save();
  try{window.renderOpportunityEngine?.()}catch{}try{window.CVSimpleHome?.render?.()}catch{}
  return {ok:true,offers:found.length,approved:state.crossMarketArbitrageLocal.length,scanned:rows.length};
 }catch(e){
  state.cardTraderDirect={at:new Date().toISOString(),offers:0,status:"error",error:String(e.message||e)};save();
  return {ok:false,error:String(e.message||e)};
 }finally{busy=false}
}
window.CVCardTraderDirect={scan,verify,setToken,hasToken:()=>!!token()};
})();