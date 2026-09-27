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
function ageHours(v){const t=new Date(v||0).getTime();return Number.isFinite(t)?(Date.now()-t)/36e5:Infinity}
window.CVIdentity={norm,tuple,key,same,ageHours};
})();