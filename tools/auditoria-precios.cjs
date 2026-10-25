// Auditoría de PRECIOS con datos reales, paso 1: abre la app (Chromium, emulación iPhone) con la guía real de Cardmarket y
// vuelca en JSON todo lo que enseña (recomendadas, pendientes, punto de mira y lo pintado en pantalla).
// Paso 2: python3 tools/verificar-precios.py <volcado.json> <latest.json> <products.json> lo recalcula todo por su cuenta.
// Herramienta manual, no es un workflow.
//   ZZ_DIR=carpeta node tools/auditoria-precios.cjs > volcado.json   (carpeta con latest.json y prev_AAAA-MM-DD.json)
//   sin ZZ_DIR descarga del espejo (necesita acceso a raw.githubusercontent.com).
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
let pw;for(const m of ['playwright','/opt/node22/lib/node_modules/playwright']){try{pw=require(m);break}catch{}}const root=require('node:path').resolve(__dirname,'..'),D=process.env.ZZ_DIR||'';const ZZ='https://raw.githubusercontent.com/ZyzyThePizi/pokemon-price-data/main/prices/';
const get=async n=>{if(D){const f=D+'/'+n;return fs.existsSync(f)?fs.readFileSync(f):null}const r=await fetch(ZZ+(n==='latest.json'?n:n.replace(/^prev_(\d{4})-(\d{2})-(\d{2})\.json$/,'$1/$2/$3.json')));return r.ok?Buffer.from(await r.arrayBuffer()):null};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const b=await pw.chromium.launch(),ctx=await b.newContext({...pw.devices['iPhone 13']});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,async route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'};
  if(u.endsWith('/prices/latest.json')){const b=await get('latest.json');return b?route.fulfill({status:200,headers:H,contentType:'application/json',body:b}):route.abort()}
  const d=u.match(/\/prices\/(\d{4})\/(\d{2})\/(\d{2})\.json$/);if(d){const b=await get('prev_'+d[1]+'-'+d[2]+'-'+d[3]+'.json');return b?route.fulfill({status:200,headers:H,contentType:'application/json',body:b}):route.fulfill({status:404,headers:H,body:'404'})}
  return route.abort()});
 const p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));const t0=Date.now();await p.goto(base);
 await p.waitForFunction(()=>window.CVCompra?.state()?.guide&&document.querySelector('#v4Buy .cpBox .cpSum'),null,{timeout:120000});await p.waitForTimeout(4000);
 const t1=Date.now();
 const r=await p.evaluate(async()=>{await window.CVCompra.loadPrev();window.CVCompra.render();await new Promise(r=>setTimeout(r,300));const C=window.CVCompra;
 const dump=x=>({id:x.id,kind:x.kind,name:x.name,set:x.set,number:x.number,pid:x.res.pid,st:x.res.status,p:x.p,best:x.best&&{k:x.best.k,cond:x.best.cond,buy:x.best.buy,sale:x.best.sale,cost:x.best.cost,profit:x.best.profit,maxBuy:x.best.maxBuy,margin:x.best.margin},conf:x.conf&&x.conf.score,prudent:x.conf&&x.conf.prudent});
 const Lb=C.list();window.__d={cfg:C.cfg(),sure:Lb.sure.map(dump),pending:Lb.pending.map(dump),sn:C.sniper().map(o=>({id:o.x.id,pid:o.x.res.pid,low:o.low,S:o.S,cost:o.cost,profit:o.profit})),
 jp:C.cardsJp().map(x=>({x,r:C.jpRoute(x,C.cfg())})).filter(o=>o.r).slice(0,3000).map(o=>({id:o.x.id,pid:o.x.res.pid,low:o.r.low,S:o.r.S,cost:o.r.cost,profit:o.r.profit,url:o.r.url})),
 ch:C.chollos(C.cfg()).map(o=>({id:o.x.id,pid:o.x.res.pid,low:o.low,S:o.S,cost:o.cost,profit:o.profit})),top:C.top5(C.cfg()).map(t=>({kind:t.kind,cost:t.kind==='sealed'?t.r.cost:t.kind==='chollo'?t.h.cost:t.o.cost})),
 dom:[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>({id:a.dataset.cpid,money:a.querySelector('.cpMoney').textContent,conf:a.querySelector('.cpConf')?.textContent||'',href:a.querySelector('.v4actions a').href}))};const t=performance.now();const L=window.CVCompra.list();const dt=performance.now()-t;const f=x=>({id:x.id,n:x.name,set:x.set,num:x.number,st:x.res.status,buy:x.best?.buy,sale:x.best?.sale,profit:x.best?.profit&&+x.best.profit.toFixed(1),k:x.best?.k,conf:x.conf?.score,liq:x.liq.k,low:x.p.low,trend:x.p.trend,a30:x.p.avg30,a7:x.p.avg7,hot:x.hot,drop:x.dl&&+x.dl.drop.toFixed(2)});
  return {d:window.__d,ms:Math.round(dt),sure:L.sure.length,pending:L.pending.length,top:L.sure.slice(0,25).map(f),hot:L.sure.concat(L.pending).filter(x=>x.hot).slice(0,10).map(f),stat:L.sure.reduce((o,x)=>(o[x.res.status]=(o[x.res.status]||0)+1,o),{}),kinds:L.sure.reduce((o,x)=>(o[x.kind]=(o[x.kind]||0)+1,o),{})}});
 console.log(JSON.stringify({loadMs:t1-t0,errs,...r},null,1));
 const rt=await p.evaluate(async()=>{const t=performance.now();window.CVCompra.render();await new Promise(r=>setTimeout(r,50));return Math.round(performance.now()-t)});console.log('render ms',rt);
 await b.close();server.close()})();
