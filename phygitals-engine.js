(function(root){'use strict';
const TIERS=[{p:.8,lo:600,hi:1000},{p:.15,lo:1000,hi:2000},{p:.04,lo:2000,hi:8000},{p:.01,lo:8000,hi:100000}];
function economic({price,ev,buyback,fees=null,discount=0}){
 if(![price,ev,buyback,discount].every(Number.isFinite)||price<=0||ev<0||buyback<0||buyback>1||discount<0||discount>=price||(fees!==null&&(!Number.isFinite(fees)||fees<0)))throw Error('Revisa precio, valor esperado, recompra y costes.');
 const cost=price-discount,cash=ev*buyback,net=cash-cost-(fees??0);
 return {cost,cash,net,costsComplete:fees!==null,breakEven:ev>0?(cost+(fees??0))/ev:null};
}
function validateTiers(t){if(!Array.isArray(t)||!t.length||t.some(r=>![r.p,r.lo,r.hi].every(Number.isFinite)||r.p<0||r.lo<0||r.hi<r.lo)||Math.abs(t.reduce((s,r)=>s+r.p,0)-1)>1e-8)throw Error('Las probabilidades deben sumar exactamente 100%; no se normalizan datos incompletos.');return t;}
function rng(seed=20261013){let x=seed>>>0;if(!x)x=1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function draw(t,random){const x=random();let sum=0;for(let i=0;i<t.length;i++){sum+=t[i].p;if(x<sum)return i;}return t.length-1;}
function parseCSV(text){if(text.length>2_000_000)throw Error('Máximo 2 MB.');const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else if(quoted||!field)quoted=!quoted;else throw Error('Comillas CSV no válidas.');}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field='';}else field+=c;}
 if(quoted)throw Error('Comillas CSV sin cerrar.');row.push(field);if(row.some(x=>x.trim()))rows.push(row);return rows;}
function history(text){const rows=parseCSV(text.trim()),headers=rows.shift()||[],required=['id','timestamp_utc','pack_id','odds_version','cost_usd','cash_received_usd'];if(required.some(k=>!headers.includes(k)))throw Error('Faltan columnas: '+required.join(', '));if(!rows.length)throw Error('No hay operaciones.');
 const seen=new Set();return rows.map((row,i)=>{if(row.length!==headers.length)throw Error('Columnas incorrectas en fila '+(i+2));const r=Object.fromEntries(headers.map((k,j)=>[k,row[j].trim()]));if(!r.id||seen.has(r.id))throw Error('ID vacío o duplicado en fila '+(i+2));seen.add(r.id);
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(r.timestamp_utc)||!Number.isFinite(Date.parse(r.timestamp_utc)))throw Error('Fecha UTC inválida en fila '+(i+2));const date=new Date(r.timestamp_utc);if(date.toISOString().slice(0,19)!==r.timestamp_utc.slice(0,19))throw Error('Fecha imposible en fila '+(i+2));
 const cost=r.cost_usd===''?NaN:Number(r.cost_usd),cash=r.cash_received_usd===''?null:Number(r.cash_received_usd);if(!r.pack_id||!r.odds_version||!Number.isFinite(cost)||cost<=0||(cash!==null&&(!Number.isFinite(cash)||cash<0)))throw Error('Importe o pack inválido en fila '+(i+2));return {...r,cost,cash,hour:date.getUTCHours(),time:date.getTime()};});}
function summarize(rows){const groups=new Map();for(const r of rows){const key=JSON.stringify([r.pack_id,r.odds_version,r.hour]);if(!groups.has(key))groups.set(key,{pack:r.pack_id,version:r.odds_version,hour:r.hour,n:0,cost:0,cash:0,pending:0});const g=groups.get(key);g.n++;g.cost+=r.cost;if(r.cash===null)g.pending++;else g.cash+=r.cash;}
 return [...groups.values()].sort((a,b)=>a.pack.localeCompare(b.pack)||a.version.localeCompare(b.version)||a.hour-b.hour).map(g=>({...g,net:g.pending?null:g.cash-g.cost}));}
const api={TIERS,economic,validateTiers,rng,draw,parseCSV,history,summarize};if(typeof module==='object'&&module.exports)module.exports=api;root.PhygitalsLab=api;
})(typeof window==='object'?window:globalThis);
