// V119 · Bajadas desde ayer (foto diaria anterior de la guía), japonesas ampliadas y «Antes de pagar».
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v119-rapidez-e2e.cjs
// Sin Internet: la guía (espejo ZyzyThePizi) y pokemontcg.io se SIMULAN con su formato público.
// Identificadores reales (base4-10 = 273933; Pikachu ex M2A 234 = 861477, del catálogo japonés); PRECIOS INVENTADOS.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let pw;for(const m of ['playwright','/opt/node22/lib/node_modules/playwright']){try{pw=require(m);break}catch{}}
if(!pw){console.log('PENDIENTE: Playwright no disponible.');process.exit(2)}
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
let n=0;const ok=(name,cond,extra='')=>{console.log((cond?'OK ':'FALLO')+' · '+name+(extra?' · '+extra:''));assert.ok(cond,name+' '+extra);n++};
const GUIDE={fields:['idProduct','low','trend','avg1','avg7','avg30','lowHolo','trendHolo','avg30Holo'],sourceCreatedAt:'2026-10-24T02:45:46+0200',generatedAt:'2026-10-24T08:30:52Z',rows:[
 [273933,150,258,258,263,268,null,null,null],   // base4-10 Mewtwo (todos los idiomas)
 [861477,193,257,257,257,262,null,null,null],   // Pikachu ex M2A 234 · producto JAPONÉS
 [861287,0.5,0.75,null,0.8,0.7,null,null,null],
 [861466,150,200,200,200,205,null,null,null]]};// Mega Charizard X ex M2A 223 (japonés, emparejado por nombre y orden)
const PREV={...GUIDE,sourceCreatedAt:'2026-10-23T02:45:00+0200',rows:[[273933,200,258,258,263,268,null,null,null],[861477,193,257,257,257,262,null,null,null]]};
const pasteES=`Disponible
128
Desde
85,00 €
Tendencia de precio
160,00 €
Precio medio 30 días
170,00 €
Precio medio 7 días
165,00 €`;
const pasteEN=`Available items 31 From 115,00 € Price Trend 250,00 € 30-days average price 260,00 € 7-days average price 255,00 € 1-day average price 249,00 €
Seller  Near Mint  English  120,00 €  1
Seller2 Near Mint English 129,99 € 2`;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});const hits={guide:0,prev:[]};
 await ctx.addInitScript(()=>{try{const u=JSON.parse(localStorage.getItem('cv_v104_user')||'{}');u.cfg=u.cfg||{};if(u.cfg.minMargin==null){u.cfg.minMargin=0;localStorage.setItem('cv_v104_user',JSON.stringify(u))}}catch{}});/* V139: estas pruebas no miden el margen mínimo */
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.endsWith('/prices/latest.json')){hits.guide++;return J(GUIDE)}
  const d=u.match(/\/prices\/(\d{4}\/\d{2}\/\d{2})\.json$/);if(d){hits.prev.push(d[1]);return d[1]==='2026/10/23'?J(PREV):route.fulfill({status:404,headers:H,body:'404: Not Found'})}
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/BAJÓ 25 % DESDE AYER/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||''),null,{timeout:90000}).catch(async e=>{console.log('DBG',errors.join('|'),hits);throw e});
 const T=id=>page.textContent('#v4Buy #cp-'+id),ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 ok('Foto anterior: se pide la del día anterior (23/10) una sola vez',hits.prev.join()==='2026/10/23',hits.prev.join());
 let t=await T('base4-10');
 ok('Mewtwo: «desde» 200 € ayer → 150 € hoy, aviso 🔥 BAJÓ 25 % y explicación',/BAJÓ 25 % DESDE AYER/.test(t)&&/200,00\s€ ayer → 150,00\s€ hoy \(−25 %\)/.test(t)&&/puede venderse en horas/.test(t),t.slice(0,400));
 ok('Sin bajada (Pikachu ex japonés, mismo precio que ayer): sin aviso',!/DESDE AYER|ayer →/.test(await T('jp-861477')));
 const sum=await page.textContent('#v4Buy .cpSum');
 ok('Resumen: 1 bajada desde ayer con beneficio',/1🔥 bajadas desde ayer con beneficio/.test(sum),sum);
 const fr=await page.textContent('#v4Buy .cpBox');
 ok('Hora de los datos de Cardmarket y comparación con el 23/10',/Precios de Cardmarket del 24\/10.*comparados con el 23\/10\/2026/.test(fr));
 await page.selectOption('[data-cp-view="sort"]','drop');await page.waitForTimeout(300);
 ok('Ordenar «🔥 Bajadas desde ayer»: Mewtwo primero',(await ids())[0]==='base4-10',JSON.stringify(await ids()));
 await page.selectOption('[data-cp-view="sort"]','profit');await page.selectOption('[data-cp-view="show"]','all');await page.selectOption('[data-cp-view="game"]','jp');await page.waitForTimeout(400);
 t=await page.evaluate(()=>{const a=document.querySelector('#cp-jp-861466');return a?a.textContent:''});
 ok('Japonesa ampliada: Mega Charizard X ex M2A nº 223 (producto 861466) con su precio japonés y método explicado',/Mega Charizard X ex/.test(t)&&/nº 223/.test(t)&&/emparejado por nombre y orden/.test(t)&&/JAPONÉS/.test(t),t.slice(0,300));
 await page.selectOption('[data-cp-view="game"]','all');await page.selectOption('[data-cp-view="show"]','profit');await page.waitForTimeout(300);
 await page.evaluate(()=>{document.querySelector('#v4Buy #cp-base4-10 .cpCheck').open=true});
 const ck=await page.textContent('#v4Buy #cp-base4-10 .cpCheck');
 ok('«Antes de pagar»: número, fotos, vendedor, total máximo con envío y pago dentro de Cardmarket',/mismo número 10\/130/.test(ck)&&/≤ 200,10\s€/.test(ck)&&/fotos reales/.test(ck)&&/Vendedor/.test(ck)&&/dentro de Cardmarket/.test(ck),ck);/* 258·0,95−5 = 240,10 − 40 de beneficio mínimo = 200,10 € con envío */
 await page.reload();await page.waitForSelector('#v4Buy #cp-base4-10',{timeout:60000});await page.waitForTimeout(1500);
 ok('Tras recargar no se vuelve a descargar ni la guía ni la foto anterior',hits.guide===1&&hits.prev.length===1,JSON.stringify(hits));
 ok('Tras recargar sigue el aviso de bajada',/BAJÓ 25 % DESDE AYER/.test(await T('base4-10')));
 for(const w of [320,430]){await page.setViewportSize({width:w,height:800});await page.waitForTimeout(200);
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Sin desbordamiento horizontal · '+w+' px',o.sw<=o.iw,JSON.stringify(o))}
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V119 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
