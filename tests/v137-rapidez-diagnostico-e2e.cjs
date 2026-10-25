// V137 · Las internacionales que importan llegan en segundos (pokemontcg.io por id antes que por colección) y registro
// de errores con «Copiar diagnóstico» (sin el token). Chromium con emulación de iPhone.
// Ejecutar: node tests/v137-rapidez-diagnostico-e2e.cjs · Datos SIMULADOS; token de prueba inventado.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let pw;for(const m of ['playwright','/opt/node22/lib/node_modules/playwright']){try{pw=require(m);break}catch{}}
if(!pw){console.log('PENDIENTE: Playwright no disponible.');process.exit(2)}
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
let n=0;const ok=(name,cond,extra='')=>{console.log((cond?'OK ':'FALLO')+' · '+name+(extra?' · '+extra:''));assert.ok(cond,name+' '+extra);n++};
const F=['idProduct','low','trend','avg1','avg7','avg30','lowHolo','trendHolo','avg30Holo'];
const GUIDE={fields:F,sourceCreatedAt:'2026-10-24T02:45:46+0200',generatedAt:'2026-10-24T08:30:52Z',rows:[
 [273933,150,258,258,263,268,null,null,null],   // Mewtwo
 [273924,90,300,300,300,300,null,null,null],    // Alakazam
 [861477,193,257,257,257,262,null,null,null]]};
const TOK='eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.secreto';
const PTC={'base4-10':{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}},'base4-1':{id:'base4-1',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:299,avg30:301,lowPrice:90,lowPriceExPlus:100}}}};
const q=[];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(t=>{try{localStorage.setItem('cv_cardtrader_token',t)}catch{}},TOK);
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,async route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  if(u.startsWith('https://api.pokemontcg.io/v2/cards?q=')){const qq=decodeURIComponent(u.split('q=')[1].split('&')[0]);q.push(qq);
   if(/^id:"/.test(qq)){const ids=[...qq.matchAll(/id:"([^"]+)"/g)].map(m=>m[1]),data=ids.map(i=>PTC[i]).filter(Boolean);return J({data,totalCount:data.length})}
   await new Promise(r=>setTimeout(r,20000));return J({data:[],totalCount:0})}// por colección: lentísimo (como en el iPhone)
  if(u.startsWith('https://api.cardtrader.com/'))return route.fulfill({status:500,headers:H,body:'Internal Server Error'});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const t0=Date.now();await page.goto(base);
 await page.waitForFunction(()=>/BUSCA EN INGLÉS/.test(document.querySelector('#v4Buy #cp-base4-1')?.textContent||'')&&/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||''),null,{timeout:60000});
 const secs=Math.round((Date.now()-t0)/1000);
 ok('Las internacionales que importan llegan en segundos aunque cada colección tarde 20 s ('+secs+' s)',secs<40,String(secs));
 ok('Se piden por id (id:"base4-10" OR id:"base4-1"…) antes que colección a colección',/id:"base4-10"/.test(q[0]||'')&&/ OR /.test(q[0]||''),JSON.stringify(q.slice(0,2)).slice(0,300));
 // error en el iPhone → queda registrado
 await page.evaluate(()=>setTimeout(()=>{throw new Error('fallo de prueba en el iPhone')},0));await page.waitForTimeout(300);
 await page.evaluate(()=>window.CVCompra.render());await page.waitForTimeout(9000);
 await page.evaluate(()=>{document.querySelectorAll('#v4Buy details.v4settings').forEach(d=>d.open=true)});
 let t=await page.textContent('#v4Buy .cpBox details.v4settings');
 ok('Errores registrados en este iPhone: 1 (con «Copiar diagnóstico»)',/Errores registrados en este iPhone: 1/.test(t)&&/Copiar diagnóstico/.test(t),t.slice(0,300));
 await page.click('#v4Buy [data-cp-diag]');await page.waitForTimeout(300);
 const dg=await page.textContent('#v4Buy [data-cp-diagout]');
 ok('Diagnóstico: versión, guía, pokemontcg, CardTrader (prueba con su error), tiendas, cambio y el error',/Versión: CARD VAULT V1\d\d/.test(dg)&&/Guía Cardmarket: 3 productos/.test(dg)&&/pokemontcg\.io: \d+ cartas/.test(dg)&&/CardTrader: token \d+ caracteres, forma correcta/.test(dg)&&/HTTP 500/.test(dg)&&/fallo de prueba en el iPhone/.test(dg),dg);
 ok('El diagnóstico NUNCA incluye el token',!dg.includes('secreto')&&!dg.includes(TOK),'');
 await page.click('#v4Buy [data-cp-diagclear]');await page.waitForTimeout(300);
 await page.evaluate(()=>{document.querySelectorAll('#v4Buy details.v4settings').forEach(d=>d.open=true)});
 ok('«Borrar errores» los quita',/Errores registrados en este iPhone: ninguno/.test(await page.textContent('#v4Buy .cpBox details.v4settings')));
 ok('Sin otros errores de JavaScript',errors.filter(e=>!/fallo de prueba/.test(e)).length===0,errors.join(' | '));
 console.log(n+' comprobaciones V137 superadas');
 await browser.close();server.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
