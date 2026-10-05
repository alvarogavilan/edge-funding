(()=>{"use strict";
const norm=v=>String(v??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
function tuple(x={}){
 return {
  universe:norm(x.universe||"pokemon"),
  name:norm(x.name),
  set:norm(x.set),
  number:norm(x.number),
  language:norm(x.offerLanguage||x.language),
  variant:norm(x.variant),
  condition:norm(x.condition||x.grade),
  grading:norm(x.grading||"RAW"),
  grade:norm(x.grade)
 };
}
function key(x={}){const t=tuple(x);return [t.universe,t.name,t.set,t.number,t.language,t.variant,t.condition,t.grading,t.grade].join("|")}
function same(a,b){return !!a&&!!b&&key(a)===key(b)}
function cleanCardName(v){return norm(v).replace(/\s+#?\d+(?:\/\d+)?\s*$/,"").replace(/\s+/g," ").trim()}
function collectorNumber(x={}){
 const direct=norm(x.number).replace(/^#/,"").replace(/\s/g,"");
 if(direct)return direct;
 const m=String(x.name||"").match(/#?([A-Za-z]*\d+(?:\/\d+)?)\s*$/);
 return m?norm(m[1]).replace(/\s/g,""):"";
}
function canonicalSet(v){
 const s=norm(v).replace(/\b20\d{2}\b/g,"").replace(/\s*·\s*/g," ").trim();
 const aliases=[
  [["evoluciones prismaticas","prismatic evolutions"],"prismatic evolutions"],
  [["sol y luna","sun moon"],"sun moon"],
  [["destinos de paldea","paldean fates"],"paldean fates"],
  [["llamas obsidianas","obsidian flames"],"obsidian flames"],
  [["sombras ardientes","burning shadows"],"burning shadows"],
  [["japanese mystery of the fossils","mystery of the fossils"],"mystery of the fossils"],
  [["base expansion pack e card","base expansion pack","e card"],"base expansion pack e card"],
  [["pokemon card 151","151"],"pokemon card 151"]
 ];
 for(const [keys,to] of aliases)if(keys.some(k=>s===k||s.includes(k)))return to;
 return s;
}
function productFingerprint(x={}){
 const raw=x.url||x.buySourceUrl||x.sourceUrl||x.marketPricing?.url||"";
 if(!/^https?:\/\//i.test(String(raw)))return "";
 try{
  const u=new URL(raw),parts=u.pathname.split("/").filter(Boolean);
  if(/^(en|es|de|fr|it|pt)$/i.test(parts[0]||""))parts.shift();
  return (u.hostname.replace(/^www\./,"")+"|"+parts.join("/")).toLowerCase().replace(/\/$/,"");
 }catch{return ""}
}
function ownershipTuple(x={}){
 const t=tuple(x);
 return {
  universe:t.universe,
  name:cleanCardName(x.name),
  set:canonicalSet(x.canonicalSet||x.set),
  number:collectorNumber(x),
  language:t.language,
  catalogId:norm(x.catalogId||x.sourceId),
  product:productFingerprint(x)
 };
}
function ownershipKey(x={}){const t=ownershipTuple(x);return [t.universe,t.name,t.set,t.number,t.language,t.catalogId,t.product].join("|")}
function sameOwnedCard(a,b){
 if(!a||!b)return false;
 const x=ownershipTuple(a),y=ownershipTuple(b);
 if(x.universe!==y.universe)return false;
 if(x.product&&y.product&&x.product===y.product)return true;
 if(x.catalogId&&y.catalogId&&x.catalogId===y.catalogId)return true;
 if(!x.name||!y.name||x.name!==y.name)return false;
 if(x.number&&y.number&&x.number!==y.number)return false;
 if(x.language&&y.language&&x.language!==y.language)return false;
 const setCompatible=!x.set||!y.set||x.set===y.set||x.set.includes(y.set)||y.set.includes(x.set);
 if(setCompatible&&!!(x.number||x.set))return true;
 /* número completo + nombre + idioma es suficientemente fuerte aunque el set esté traducido */
 if(x.number&&y.number&&x.number===y.number&&x.number.includes("/"))return true;
 return false;
}
function ageHours(v){const t=new Date(v||0).getTime();return Number.isFinite(t)&&t<=Date.now()?(Date.now()-t)/36e5:Infinity}
window.CVIdentity={norm,tuple,key,same,cleanCardName,collectorNumber,canonicalSet,productFingerprint,ownershipTuple,ownershipKey,sameOwnedCard,ageHours};
})();