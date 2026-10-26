// V126 · Caso real Mew ex 232 (Paldean Fates): la app mostraba el «desde» de cualquier estado (50 €) y la ficha abierta
// con «EX o mejor» daba 149,90 €. Ahora: compra = «desde» EX o mejor, enlace con el mismo filtro, tabla «Dónde comprarla»
// y Top 5. Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v126-precio-real-e2e.cjs
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
const F=['idProduct','low','trend','avg1','avg7','avg30','lowHolo','trendHolo','avg30Holo'];
// Cifras de la guía real de Cardmarket del 24/10/2026 para Mew ex 232 (751779) y su versión normal (751763)
const GUIDE={fields:F,sourceCreatedAt:'2026-10-24T02:45:46+0200',generatedAt:'2026-10-24T08:30:52Z',rows:[
 [751779,50,470.42,570,610.05,726.29,null,0,null],
 [751763,8.99,19.11,20.77,19.66,20.07,null,0,null],
 [861477,193,257,257,257,262,null,null,null]]};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(()=>{try{const u=JSON.parse(localStorage.getItem('cv_v104_user')||'{}');u.cfg=u.cfg||{};if(u.cfg.minMargin==null){u.cfg.minMargin=0;localStorage.setItem('cv_v104_user',JSON.stringify(u))}}catch{}});/* V139: estas pruebas no miden el margen mínimo */
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='sv4pt5'?[{id:'sv4pt5-232',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:470,avg30:726,lowPrice:50,lowPriceExPlus:149.9}},tcgplayer:{url:'https://prices.pokemontcg.io/tcgplayer/sv4pt5-232',prices:{holofoil:{low:380,market:420}}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>window.CVCompra?.state()?.pt?.cards?.['sv04.5-232']&&document.querySelector('#v4Buy .cpTop'),null,{timeout:120000});await page.waitForTimeout(800);
 // V131 · mismo idioma: el «desde EX o mejor» de 149,90 € es el 32 % de su valor (470,42 €) y Cardmarket no dice de qué
 // idioma es (coreano y chino valen mucho menos) → no se calcula beneficio con él ni se recomienda.
 const ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 ok('V138 · Mew ex 232 (vale 470 €) no sale: con 200 € tendrías que encontrar una inglesa al 41 % de su valor (objetivo irreal; su EX o mejor de 149,90 € puede ser coreano)',!(await ids()).includes('sv04.5-232'),JSON.stringify(await ids()));
 let t=await page.textContent('#v4Buy .cpTop');
 ok('🏆 Top 5: sin Mew ex y lo explica (solo mismo idioma)',!/Mew ex/.test(t)&&/Solo con compra y venta del mismo idioma/.test(t),t.slice(0,400));
 t=await page.textContent('[data-cp-snipe]');
 ok('Punto de mira: Mew ex no entra y nunca con el «desde» de 50 €',!/Mew ex/.test(t)&&!/a 50,00/.test(t),t.slice(0,300));
 await page.fill('[data-cp-q]','mew ex');await page.waitForSelector('#v4Buy #cp-sv04\\.5-232',{timeout:30000});await page.waitForTimeout(500);
 const T=sel=>page.textContent('#v4Buy #cp-sv04\\.5-232 '+sel);
 t=await T('.cpBuy');
 // TCGplayer: $420 · 0,9 = 378 € → (378 + 15) · 1,21 + 15 = 490,53 €
 ok('Buscándola: «Dónde comprarla» con UNA fila de Cardmarket (EX o mejor 155,90 €, avisando de que no dice el idioma) y TCGplayer 490,53 €',/Cardmarket ↗155,90\s€/.test(t)&&/el más barato EX o mejor \(149,90\s€\) no dice el idioma: a ese precio puede ser coreano o chino/.test(t)&&!/cualquier estado/.test(t)&&/TCGplayer \(EE\. UU\.\) ↗490,53\s€/.test(t),t);
 const bl=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-sv04\\.5-232 .cpBuy a')].map(a=>a.href));
 ok('Cada vía con su enlace directo (EX o mejor filtrado, cualquier estado sin filtro, TCGplayer)',['https://www.cardmarket.com/es/Pokemon/Products?idProduct=751779&minCondition=3&language=1','https://prices.pokemontcg.io/tcgplayer/sv4pt5-232'].every(u=>bl.includes(u))/* V133: filas ordenadas por lo que pagas */,JSON.stringify(bl));
 await page.fill('[data-cp-q]','');await page.waitForTimeout(600);
 ok('Ya no hay plan de compra con presupuesto',!(await page.$('[data-cp-planbox]')));
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V126 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
