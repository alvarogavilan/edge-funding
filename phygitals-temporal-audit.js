/* Phygitals temporal coincidence audit: descriptive and holdout only; no guaranteed purchase signals. */
(function(root){'use strict';
const hour=t=>new Date(t).getUTCHours(),minute=t=>new Date(t).getUTCMinutes(),second=t=>new Date(t).getUTCSeconds(),weekday=t=>new Date(t).getUTCDay();
const dims={weekday:7,hour:24,minute:60,second:60};
const get={weekday,hour,minute,second};
function binomTail(n,k,p){if(k<=0)return 1;if(k>n)return 0;if(p<=0)return 0;if(p>=1)return 1;let log=Math.log,arr=[];let logfact=0;const lf=[0];for(let i=1;i<=n;i++){logfact+=log(i);lf.push(logfact)}for(let i=k;i<=n;i++)arr.push(lf[n]-lf[i]-lf[n-i]+i*log(p)+(n-i)*Math.log1p(-p));const max=Math.max(...arr);return Math.min(1,Math.exp(max)*arr.reduce((a,x)=>a+Math.exp(x-max),0))}
function audit(rows,{complete=false,minTrain=300,minTest=150}={}){
 if(!complete)return {status:'SIN EVIDENCIA',reason:'El origen no garantiza todas las aperturas, incluidas las comunes. Los feeds destacados sesgan cualquier patrón.'};
 if(!Array.isArray(rows)||rows.length<minTrain+minTest)return {status:'SIN EVIDENCIA',reason:'Historial insuficiente para separar entrenamiento y validación.'};
 const seen=new Set(),groups=new Map();
 for(const r of rows){if(!r||typeof r.id!=='string'||!r.id||seen.has(r.id)||typeof r.pack_id!=='string'||!r.pack_id||typeof r.odds_version!=='string'||!r.odds_version||typeof r.timestamp_utc!=='string')return {status:'SIN EVIDENCIA',reason:'Datos incompletos o duplicados'};seen.add(r.id);
 const time=Date.parse(r.timestamp_utc),label=String(r.rarity||'').toUpperCase();if(!Number.isFinite(time)||!label)return {status:'SIN EVIDENCIA',reason:'Fecha o categoría inválida'};
 const key=r.pack_id+'|'+r.odds_version;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({time,hit:label==='EPIC'||label==='MYTHIC'});
 }
 const results=[];
 for(const [group,data] of groups){data.sort((a,b)=>a.time-b.time);if(data.length<minTrain+minTest)continue;const cut=Math.floor(data.length*.65),train=data.slice(0,cut),test=data.slice(cut),base=train.filter(x=>x.hit).length/train.length; if(base<=0||base>=1)continue;
 const patterns=[];for(const [dimension,bins] of Object.entries(dims)){const counts=Array.from({length:bins},()=>({n:0,k:0}));for(const r of train){const b=get[dimension](r.time);counts[b].n++;if(r.hit)counts[b].k++}
 for(let i=0;i<bins;i++){const x=counts[i];if(x.n<30)continue;const expected=base*x.n;if(x.k<=expected)continue;const p=binomTail(x.n,x.k,base);patterns.push({dimension,value:i,p,trainN:x.n,trainHits:x.k})}}
 patterns.sort((a,b)=>a.p-b.p);const best=patterns[0];if(!best){results.push({group,status:'SIN PATRÓN',n:data.length});continue}
 const subset=test.filter(r=>get[best.dimension](r.time)===best.value),other=test.filter(r=>get[best.dimension](r.time)!==best.value);
 const hit=subset.filter(x=>x.hit).length,otherHits=other.filter(x=>x.hit).length;
 const familyThreshold=.05/(7+24+60+60);
 const verified=best.p<familyThreshold&&subset.length>=30&&other.length>=30&&hit/subset.length>otherHits/other.length&&binomTail(subset.length,hit,otherHits/other.length)<.05;
 results.push({group,n:data.length,holdoutN:test.length,pattern:best,holdout:{n:subset.length,hits:hit,comparisonN:other.length,comparisonHits:otherHits},exploratoryPass:best.p<familyThreshold,holdoutPass:verified,status:verified?'ASOCIACIÓN ESTADÍSTICA, NO PREDICCIÓN':'SIN PATRÓN VALIDADO'});
 }
 return {status:'ANÁLISIS DESCRIPTIVO',numberOfTests:151,coverageClaim:'Declarado por importador; requiere auditoría externa',results,decision:'NO COMPRAR',notes:'La selección de hora y día, los cambios de odds, el retraso de publicación y factores de confusión impiden una garantía o recomendación de gasto.'}
}
const api={audit};if(typeof module==='object'&&module.exports)module.exports=api;root.PhygitalsTemporal=api;
})(typeof window==='object'?window:globalThis);
