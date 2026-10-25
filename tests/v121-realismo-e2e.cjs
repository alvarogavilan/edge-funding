// V121 · Tarifas Correos 2026 en un toque, estado en la confianza y lector de Cardmarket con más etiquetas.
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v121-realismo-e2e.cjs
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
 [273933,90,160,160,165,170,null,null,null],   // base4-10 Mewtwo (todos los idiomas)
 [273924,60,200,240,235,190,null,null,null],   // base4-1 Alakazam · semana +24 % sobre su media → buen momento de venta
 [861477,193,257,257,257,262,null,null,null],   // Pikachu ex M2A 234 · producto JAPONÉS
 [861287,0.5,0.75,null,0.8,0.7,null,null,null]]};
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
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:158,avg30:168,lowPrice:90,lowPriceExPlus:95}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||''),null,{timeout:90000});
 const T=id=>page.textContent('#v4Buy #cp-'+id);
 ok('Por defecto: Mewtwo +46,00 € (envíos 5/6 €)',/\+46,00\s€/.test(await page.textContent('#v4Buy #cp-base4-10 .cpMoney')));
 await page.evaluate(()=>{document.querySelector('#v4Buy .v4settings [data-v4-correos]').closest('details').open=true});
 ok('Supuestos: tarifas Correos 2026 explicadas',/nacional 5,74\s€, a o desde Europa 7,15\s€/.test(await page.textContent('#v4Buy .v4settings:has([data-v4-correos])')));
 await page.click('#v4Buy [data-v4-correos]');await page.waitForTimeout(600);
 // 160·0,95 − 5,74 − (95 + 7,15) = 152 − 5,74 − 102,15 = 44,11
 const cfg=await page.evaluate(()=>window.CVVault.user().cfg);
 ok('«Aplicar tarifas Correos 2026» guarda venta 5,74 €, compra 7,15 € y 5 %',cfg.sellShip===5.74&&cfg.buyShip===7.15&&cfg.feePct===5,JSON.stringify(cfg));
 await page.waitForFunction(()=>/\+44,11\s€/.test(document.querySelector('#v4Buy #cp-base4-10 .cpMoney')?.textContent||''),null,{timeout:10000}).catch(()=>{});
 ok('Mewtwo recalculado con Correos: +44,11 €',/\+44,11\s€/.test(await page.textContent('#v4Buy #cp-base4-10 .cpMoney')),await page.textContent('#v4Buy #cp-base4-10 .cpMoney'));
 await page.reload();await page.waitForSelector('#v4Buy #cp-base4-10',{timeout:60000});
 ok('Tras recargar se conservan las tarifas',/\+44,11\s€/.test(await page.textContent('#v4Buy #cp-base4-10 .cpMoney')));
 await page.evaluate(()=>{document.querySelector('#v4Buy [data-v4-cfg="maxBuy"]').closest('details').open=true});await page.fill('#v4Buy [data-v4-cfg="maxBuy"]','300');await page.click('#v4Buy [data-v4-cfgsave]');await page.waitForTimeout(600);/* con Correos pagas 193 + 7,15 = 200,15 € > 200 */
 await page.selectOption('[data-cp-view="show"]','all');await page.waitForTimeout(300);/* y deja 39,11 € (< 40 €): se ve en «Todas con precio» */
 const cj=await page.textContent('#v4Buy #cp-jp-861477 .cpConf');
 ok('Confianza: el «desde» sin estado resta y lo explica',/estado 0\/15 \(el «desde» no dice el estado: abre la ficha con «EX o mejor»\)/.test(cj),cj);
 ok('Confianza: compra EX o mejor suma 15/15',/estado 15\/15/.test(await page.textContent('#v4Buy #cp-base4-10 .cpConf')));
 const P=await page.evaluate(()=>[window.CVCompra.parseCmPaste('Tendencia 90,22 €\nMedia 1 día 88,00 €\nMedia 7 días 95,50 €\nMedia 30 días 124,19 €\nPrecio mínimo 79,99 €'),window.CVCompra.parseCmPaste('Avg. 30 days 12,00 € Avg. 7 days 11,00 € Avg. 1 day 10,50 € Price Trend 11,80 € From 9,00 €')]);
 ok('Lector: «Media 30 días», «Precio mínimo» y «Avg. 30 days» también se entienden',P[0].avg30===124.19&&P[0].avg7===95.5&&P[0].avg1===88&&P[0].trend===90.22&&P[0].from===79.99&&P[1].avg30===12&&P[1].avg7===11&&P[1].avg1===10.5&&P[1].trend===11.8&&P[1].from===9,JSON.stringify(P));
 await page.evaluate(()=>{document.querySelector('#v4Buy #cp-base4-10 .cpPaste').open=true});
 ok('Pegar datos: truco de Texto en vivo del iPhone',/Texto en vivo/.test(await page.textContent('#v4Buy #cp-base4-10 .cpPaste')));
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V121 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
