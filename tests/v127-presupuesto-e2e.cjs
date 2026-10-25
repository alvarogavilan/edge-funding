// V127 · Compra máxima por carta (200 € por defecto, editable): se respeta en Compra YA, Top 5, Punto de mira, Importar,
// Sellado y graduadas. Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v127-presupuesto-e2e.cjs
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
const GUIDE={fields:F,sourceCreatedAt:'2026-10-24T02:45:46+0200',generatedAt:'2026-10-24T08:30:52Z',rows:[
 [273933,90,160,160,165,170,null,null,null],   // Mewtwo · EX+ 95 €
 [273924,230,500,500,500,505,null,null,null],  // Alakazam · EX+ 230 € (vale ~500 €): punto de mira solo si el presupuesto llega
 [861287,290,380,380,380,385,null,null,null],  // Pikachu ex M2A 44 japonés · vale ~380 € → importar con tope de presupuesto
 [861477,700,900,900,900,905,null,null,null],// Pikachu ex M2A 234 japonés · vale ~900 € (> 2 × presupuesto) → fuera
 [583510,150,290,null,null,null,null,null,null]]};// Brilliant Stars ETB (sellado)
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:158,avg30:168,lowPrice:90,lowPriceExPlus:95}}},{id:'base4-1',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:501,avg30:505,lowPrice:230,lowPriceExPlus:230}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||'')&&window.CVCompra.state().pt.cards['base4-1'],null,{timeout:120000});
 await page.waitForTimeout(500);
 const box=()=>page.textContent('#v4Buy .cpBox'),ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 let t=await box();
 ok('Aviso visible: compra máxima por carta 200 €',/Compra máxima por carta: 200,00\s€/.test(t));
 ok('Compra YA: Alakazam (EX+ 230 €) no sale; Mewtwo (95 €) sí',(await ids()).includes('base4-10')&&!(await ids()).includes('base4-1'),JSON.stringify(await ids()));
 ok('Punto de mira y Top 5 sin nada por encima de 200 €',!/Alakazam/.test(await page.textContent('[data-cp-snipe]'))&&!/Alakazam/.test(await page.textContent('#v4Buy .cpTop')));
 await page.evaluate(()=>{document.querySelector('[data-cp-jpbox]').open=true});t=await page.textContent('[data-cp-jpbox]');
 // M2A 44 vale 380 €: (380·0,95 − 5 − 40 − 15) / 1,21 − 20 = 228,7 € → tope 200 € → 200 / 0,0058 = 34.482 ¥ → 34.400 ¥
 ok('Importar: M2A 44 con máximo topado en tu presupuesto (¥34.400) y fuera la de ~900 € (> 2 × presupuesto)',/nº 44/.test(t)&&/¥34\.400/.test(t)&&/tope de tu presupuesto/.test(t)&&!/nº 234/.test(t),t.slice(0,500));
 // Subir la compra máxima a 300 € en Supuestos
 await page.evaluate(()=>{document.querySelector('#v4Buy [data-v4-cfg="maxBuy"]').closest('details').open=true});
 await page.fill('#v4Buy [data-v4-cfg="maxBuy"]','300');await page.click('#v4Buy [data-v4-cfgsave]');await page.waitForTimeout(800);
 ok('Supuestos: compra máxima guardada (300 €)',await page.evaluate(()=>window.CVVault.user().cfg.maxBuy)===300);
 await page.evaluate(()=>window.CVCompra.render());await page.waitForTimeout(300);
 t=await box();
 // Alakazam: 500·0,95 − 5 − (230 + 6) = +234
 ok('Con 300 €: aviso actualizado y Alakazam aparece en Compra YA, Punto de mira y Top 5 (+234 €)',/Compra máxima por carta: 300,00\s€/.test(t)&&(await ids()).includes('base4-1')&&/Alakazam/.test(await page.textContent('[data-cp-snipe]'))&&/Alakazam/.test(await page.textContent('#v4Buy .cpTop'))&&/\+234,00\s€/.test(t),JSON.stringify(await ids()));
 await page.click('.mainNav [data-tab="sealed"]');await page.waitForSelector('#cpSealed .cpSum',{timeout:30000});
 ok('Sellado usa la misma compra máxima (Supuestos)',/Compra máxima300,00\s€ \(Supuestos\)/.test(await page.textContent('#cpSealed .rdctl')));
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V127 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
