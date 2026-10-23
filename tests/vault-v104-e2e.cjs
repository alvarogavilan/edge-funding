// Prueba de extremo a extremo de Card Vault V104 en navegador real (Chromium con emulación de iPhone 13).
// Ejecutar: node tests/vault-v104-e2e.cjs   (necesita Playwright; usa el Chromium preinstalado)
// No usa Internet: las peticiones externas se cortan. Las imágenes de images.pokemontcg.io se sirven con una
// imagen local para probar el pintado; una se fuerza a fallar para probar el sustituto.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let pw;try{pw=require('playwright')}catch{pw=require('/opt/node22/lib/node_modules/playwright')}
const root=path.resolve(__dirname,'..'),shots=process.env.SHOTS||'';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
const results=[];const ok=(name,cond,extra='')=>{results.push([cond?'OK ':'FALLO',name,extra]);assert.ok(cond,name+' '+extra)};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch();
 const ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url();
  if(/images\.pokemontcg\.io\/base1\/15_hires/.test(u))return route.fulfill({status:404,body:''});
  if(/images\.pokemontcg\.io/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  return route.abort()});
 const page=await ctx.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|net::/.test(m.text()))errors.push(m.text())});
 page.on('dialog',d=>d.accept());
 await page.goto(base,{waitUntil:'load'});await page.waitForSelector('#v4Buy .v4head');await page.waitForTimeout(800);
 // 1. Compra YA
 ok('Compra YA visible al abrir',await page.isVisible('#v4Buy h2'));
 const buy=await page.evaluate(()=>({cards:document.querySelectorAll('#v4Buy .v4card').length,titles:[...document.querySelectorAll('#v4Buy .v4card h3')].map(h=>h.textContent),status:[...document.querySelectorAll('#v4Buy .v4status')].map(s=>s.textContent),others:[...document.querySelectorAll('#radar>*')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.id||e.className)}));
 ok('Compra YA tiene fichas',buy.cards>0,String(buy.cards));
 ok('Gyarados EX (ya en Mi colección) no aparece',!buy.titles.some(t=>/Gyarados EX/.test(t)));
 ok('Sin estados inventados: ninguna COMPRA COMPROBADA sin comprobación',!buy.status.includes('COMPRA COMPROBADA'));
 ok('Sin tableros antiguos superpuestos en Compra YA',buy.others.every(x=>x==='v4Buy'||/expertDrawer/.test(x)),buy.others.join(','));
 ok('Sin desbordamiento horizontal',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 if(shots)await page.screenshot({path:path.join(shots,'1-compra-ya.png')});
 // 2. Comprar para restaurar desde la barra de pestañas
 await page.click('.mainNav [data-tab="comprar-restaurar"]');await page.waitForTimeout(600);
 for(const el of await page.$$('#v4Restore .v4card figure')){await el.scrollIntoViewIfNeeded();await page.waitForTimeout(120)}
 await page.waitForTimeout(500);await page.evaluate(()=>window.scrollTo(0,0));
 ok('Pestaña restaurar visible',await page.isVisible('#v4Restore h2'));
 ok('Compra YA oculta al cambiar de pestaña',!(await page.isVisible('#v4Buy h2')));
 const rest=await page.evaluate(()=>({n:document.querySelectorAll('#v4Restore .v4card').length,imgs:[...document.querySelectorAll('#v4Restore .v4card img')].map(i=>({ok:i.complete&&i.naturalWidth>0,h:i.getBoundingClientRect().height,hidden:i.hidden})),noimg:[...document.querySelectorAll('#v4Restore .v4noimg')].filter(n=>!n.hidden).length}));
 ok('12 objetivos de restauración',rest.n===12,String(rest.n));
 ok('Fotos grandes (≥ 250 px de alto en iPhone)',rest.imgs.filter(i=>!i.hidden).every(i=>i.ok&&i.h>=250),JSON.stringify(rest.imgs.slice(0,3)));
 ok('Foto que falla muestra sustituto legible',rest.noimg===1,String(rest.noimg));
 ok('Hash de URL directo',(await page.evaluate(()=>location.hash))==='#comprar-restaurar');
 if(shots)await page.screenshot({path:path.join(shots,'2-restaurar.png')});
 // 3. Registrar anuncio: búsqueda y eBay rechazados
 const id='rest-base1-4';
 await page.click('[data-v4-verify="'+id+'"]');await page.waitForSelector('#v4Sheet form');
 await page.fill('#v4Sheet [name=url]','https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=charizard');
 await page.fill('#v4Sheet [name=price]','180');await page.click('#v4Sheet button[type=submit]');
 ok('Rechaza enlace de búsqueda',/búsqueda/.test(await page.textContent('#v4Sheet .v4err')));
 await page.fill('#v4Sheet [name=url]','https://www.ebay.es/itm/123');await page.click('#v4Sheet button[type=submit]');
 ok('Rechaza eBay',/eBay/.test(await page.textContent('#v4Sheet .v4err')));
 await page.fill('#v4Sheet [name=url]','https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Set/Charizard-V1-BS4');
 await page.click('#v4Sheet button[type=submit]');
 ok('Ficha Cardmarket exige vendedor',/vendedor/.test(await page.textContent('#v4Sheet .v4err')));
 await page.fill('#v4Sheet [name=seller]','VendedorPrueba');await page.fill('#v4Sheet [name=price]','180,50');await page.fill('#v4Sheet [name=shipping]','7');
 await page.selectOption('#v4Sheet [name=language]','Inglés');await page.selectOption('#v4Sheet [name=condition]','DMG');await page.fill('#v4Sheet [name=defects]','Pliegue horizontal');
 await page.setInputFiles('#v4Sheet [name=photo]',path.join(root,'assets/cards/machamp-gx-154-es.png'));
 await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(700);
 ok('Hoja cerrada tras guardar',!(await page.isVisible('#v4Sheet form')));
 let c=await page.locator('#card-'+id);
 ok('Estado COMPRA COMPROBADA tras comprobación completa',(await c.locator('.v4status').textContent())==='COMPRA COMPROBADA');
 ok('Foto del ejemplar anunciado sustituye a la de catálogo',/Foto del ejemplar anunciado/.test(await c.locator('figcaption').textContent()));
 ok('Precio de compra visible',/180,50/.test(await c.locator('.v4money').textContent()));
 ok('Envío marcado como confirmado',/confirmado/.test(await c.locator('.v4money').textContent()));
 // 4. Ventas reales: 2 ventas en USD y 1 anuncio (que no debe contar)
 for(const [kind,price,cur,date] of [['venta','600','USD','2026-10-01'],['venta','700','USD','2026-10-10'],['anuncio','5000','EUR','2026-10-20']]){
  await page.click('#card-'+id+' [data-v4-sale]');await page.waitForSelector('#v4Sheet form');
  await page.selectOption('#v4Sheet [name=kind]',kind);await page.fill('#v4Sheet [name=price]',price);await page.selectOption('#v4Sheet [name=currency]',cur);
  await page.fill('#v4Sheet [name=date]',date);await page.selectOption('#v4Sheet [name=condition]','MP');await page.selectOption('#v4Sheet [name=language]','Inglés');
  await page.fill('#v4Sheet [name=url]','https://www.tcgplayer.com/product/42382/pokemon-base-set-charizard');
  await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(300);
 }
 // Cálculo esperado: ventas 600 y 700 USD ×0,86 = 516 / 602; restaurada ×0,6 / mediana 559×0,75 / ×0,9
 const exp=(s)=>s*(0.95)-5-180.5-7;
 const want={low:exp(516*0.6),mid:exp(559*0.75),high:exp(602*0.9)};
 const scen=await page.evaluate(i=>[...document.querySelectorAll('#card-'+i+' .v4scen tbody tr td:last-child')].map(td=>td.textContent),id);
 const parse=t=>Number(t.replace(/[^\d,−-]/g,'').replace('−','-').replace(',','.'));
 ok('Escenarios calculados con ventas cerradas (no con el anuncio)',Math.abs(parse(scen[0])-want.low)<0.02&&Math.abs(parse(scen[1])-want.mid)<0.02&&Math.abs(parse(scen[2])-want.high)<0.02,JSON.stringify({scen,want}));
 ok('Anuncio etiquetado como NO venta',/ANUNCIO ACTIVO · NO ES VENTA/.test(await page.textContent('#card-'+id+' .v4sales')));
 ok('Texto de beneficio no promete seguridad',(t=>!/garantizado/i.test(t.replace(/no garantizado/gi,'')))(await page.textContent('#card-'+id+' .v4profit')));
 // 5. Texto para declarar la restauración
 await page.click('#card-'+id+' details.v4more:nth-of-type(2) summary');
 await page.check('#card-'+id+' [data-v4-declare] input[value="Corrección de doblez o pliegue"]');
 ok('Declaración de intervención generada',/CARTA RESTAURADA.*Corrección de doblez/s.test(await page.inputValue('#card-'+id+' [data-v4-declare] textarea')));
 if(shots){await c.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'3-ficha-comprobada.png'),fullPage:false})}
 // 6. Ventas reales
 await page.click('.mainNav [data-tab="ventas-reales"]');await page.waitForTimeout(400);
 const vr=await page.textContent('#v4Sales');
 ok('Pestaña Ventas reales distingue tipos',/VENTA CERRADA/.test(vr)&&/DATO AGREGADO/.test(vr)&&/ANUNCIO ACTIVO/.test(vr));
 if(shots)await page.screenshot({path:path.join(shots,'4-ventas-reales.png')});
 // 7. Persistencia y caducidad a las 24 h
 await page.reload({waitUntil:'load'});await page.waitForSelector('#v4Restore .v4card',{state:'attached'});await page.waitForTimeout(700);
 ok('Comprobación persiste tras recargar',(await page.locator('#card-'+id+' .v4status').textContent())==='COMPRA COMPROBADA');
 ok('Foto persiste tras recargar (IndexedDB)',/Foto del ejemplar anunciado/.test(await page.locator('#card-'+id+' figcaption').textContent()));
 await page.evaluate(i=>{const u=JSON.parse(localStorage.getItem('cv_v104_user'));u.patches[i].listing.checkedAt=new Date(Date.now()-25*3600e3).toISOString();localStorage.setItem('cv_v104_user',JSON.stringify(u))},id);
 await page.reload({waitUntil:'load'});await page.waitForSelector('#v4Restore .v4card',{state:'attached'});await page.waitForTimeout(500);
 ok('Pasadas 24 h pasa a CADUCADA',(await page.locator('#card-'+id+' .v4status').textContent())==='CADUCADA');
 // 8. Otras pestañas siguen funcionando
 for(const t of ['collection','sealed','pregrade','arbitraje','archive','radar']){await page.click('.mainNav [data-tab="'+t+'"]');await page.waitForTimeout(250);ok('Pestaña '+t+' se muestra',await page.evaluate(x=>!document.getElementById(x).classList.contains('hidden'),t))}
 ok('Mi colección sigue con cartas',await page.evaluate(()=>window.CVStateBridge.get().cards.length>=15));
 ok('Sin errores de JavaScript',errors.length===0,errors.slice(0,5).join(' | '));
 await browser.close();server.close();
 console.log(results.map(r=>r.join(' · ')).join('\n'));console.log('\n'+results.length+' comprobaciones superadas');
})().catch(e=>{console.log(results.map(r=>r.join(' · ')).join('\n'));console.error(e.message);process.exit(1)});
