// Prueba de extremo a extremo de Card Vault V104 en navegador real (Chromium con emulación de iPhone 13).
// Ejecutar: node tests/vault-v104-e2e.cjs   (necesita Playwright; usa el Chromium preinstalado)
// No usa Internet: las peticiones externas se cortan. Las imágenes de images.pokemontcg.io se sirven con una
// imagen local para probar el pintado; una se fuerza a fallar para probar el sustituto.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let pw;for(const m of ['playwright',process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES&&process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright','/opt/node22/lib/node_modules/playwright'].filter(Boolean)){try{pw=require(m);break}catch{}}
if(!pw){console.log('PENDIENTE: Playwright no disponible en este equipo; prueba de navegador no ejecutada.');process.exit(2)}
const root=path.resolve(__dirname,'..'),shots=process.env.SHOTS||'';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
const results=[];const ok=(name,cond,extra='')=>{results.push([cond?'OK ':'FALLO',name,extra]);assert.ok(cond,name+' '+extra)};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch();
 const ctx=await browser.newContext({...pw.devices['iPhone 13']});await ctx.addInitScript(()=>{window.CV_LEGACY_LANES=true});/* V117: tablero anterior de Compra YA (motor de compra y comprobación que usa Favoritos) */
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url();
  if(/images\.pokemontcg\.io\/base1\/15_hires/.test(u))return route.fulfill({status:404,body:''});
  if(/images\.pokemontcg\.io|assets\.tcgdex\.net|lorcast\.io|cdn\.shopify\.com|whatnot/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  // Respuestas SIMULADAS con el formato de las APIs públicas (no son datos de mercado):
  if(/api\.frankfurter\.app/.test(u))return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({amount:1,base:'USD',date:'2026-10-23',rates:{EUR:0.9}})});
  let m=u.match(/api\.tcgdex\.net\/v2\/en\/cards\/([^?]+)/);
  if(m){const id=decodeURIComponent(m[1]);if(id==='base1-6')return route.fulfill({status:500,body:''});
   const cm=id==='base1-4'||id==='base1-15'?{updated:'2026-10-22T00:00:00Z',unit:'EUR',trend:400,avg30:380,avg7:390,avg1:395,low:120}:id==='base1-2'?{updated:'2026-10-22T00:00:00Z',unit:'EUR',trend:12,avg30:11,low:3}:{updated:'2026-10-22T00:00:00Z',unit:'EUR',trend:60,avg30:58,avg7:59,low:55};
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({id,pricing:{cardmarket:cm,tcgplayer:{updated:'2026-10-22',unit:'USD',holofoil:{marketPrice:500}}}})})}
  if(/api\.lorcast\.com\/v0\/sets$/.test(u))return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({results:[{id:'s1',code:'1',name:'The First Chapter'}]})});
  if(/api\.lorcast\.com\/v0\/sets\/1\/cards/.test(u))return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify([{id:'c1',name:'Elsa',version:'Spirit of Winter',collector_number:'207',rarity:'Enchanted',prices:{usd:null,usd_foil:'100.00'},tcgplayer_id:123,set:{name:'The First Chapter'},image_uris:{digital:{normal:'https://cards.lorcast.io/x.avif'}}},{id:'c2',name:'Cheap',collector_number:'1',rarity:'Common',prices:{usd:'0.10'}}])});
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
 ok('Sin tableros antiguos superpuestos en Compra YA',buy.others.every(x=>x==='v4Buy'||x==='v4Restore'/* V115: restauración integrada */||/expertDrawer/.test(x)),buy.others.join(','));
 ok('Sin desbordamiento horizontal',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 if(shots)await page.screenshot({path:path.join(shots,'1-compra-ya.png')});
 // 2. V115: restauración integrada en Compra YA (sin pestaña propia)
 await page.click('.mainNav [data-tab="radar"]');await page.waitForTimeout(600);await page.locator('#v4Restore h2').scrollIntoViewIfNeeded();
 await page.evaluate(()=>document.querySelectorAll('#v4Restore details.v4old').forEach(d=>d.open=true));/* V110: objetivos plegados; se abren para comprobar todas las fotos */
 for(const el of await page.$$('#v4Restore .v4card figure')){await el.scrollIntoViewIfNeeded();await page.waitForTimeout(120)}
 await page.waitForTimeout(3500);await page.evaluate(()=>window.scrollTo(0,0));
 ok('Fichas de restauración visibles dentro de Compra YA',await page.isVisible('#v4Restore h2'));
 ok('Compra YA y restauración en la misma pestaña',await page.evaluate(()=>document.getElementById('v4Restore').closest('section').id==='radar'&&!document.querySelector('.mainNav [data-tab="comprar-restaurar"]')));
 const rest=await page.evaluate(()=>({n:document.querySelectorAll('#v4Restore .v4card:not(.rdlive)').length,imgs:[...document.querySelectorAll('#v4Restore .v4card img')].map(i=>({ok:i.complete&&i.naturalWidth>0,h:i.getBoundingClientRect().height,hidden:i.hidden})),noimg:[...document.querySelectorAll('#v4Restore .v4noimg')].filter(n=>!n.hidden).length}));
 const restExpected=12+await page.evaluate(()=>(window.CV_MARKET_OFFERS?.offers||[]).filter(x=>x.lane==='restaurar').length);/* V110: 12 objetivos + anuncios concretos registrados */
 ok('12 objetivos de restauración + anuncios concretos',rest.n===restExpected,rest.n+'/'+restExpected);
 ok('Fotos grandes (≥ 250 px de alto en iPhone)',rest.imgs.filter(i=>!i.hidden).every(i=>i.ok&&i.h>=250),JSON.stringify(rest.imgs.slice(0,3)));
 ok('Foto que falla muestra sustituto legible',rest.noimg===1,String(rest.noimg));
 ok('Hash de URL directo',(await page.evaluate(()=>location.hash))==='#radar');
 if(shots)await page.screenshot({path:path.join(shots,'2-restaurar.png')});
 // 3. Registrar anuncio: búsqueda y eBay rechazados
 const id='rest-base1-4';
 await page.click('[data-v4-verify="'+id+'"]');await page.waitForSelector('#v4Sheet form');
 await page.fill('#v4Sheet [name=url]','https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=charizard');
 await page.fill('#v4Sheet [name=price]','180');await page.click('#v4Sheet button[type=submit]');
 await page.waitForFunction(()=>/búsqueda/.test(document.querySelector('#v4Sheet .v4err')?.textContent||''),null,{timeout:5000}).catch(()=>{});/* espera al mensaje: antes se leía en el mismo instante del clic */
 ok('Rechaza enlace de búsqueda',/búsqueda/.test(await page.textContent('#v4Sheet .v4err')));
 await page.fill('#v4Sheet [name=url]','https://www.ebay.es/itm/123');await page.click('#v4Sheet button[type=submit]');
 ok('Rechaza eBay',/eBay/.test(await page.textContent('#v4Sheet .v4err')));
 await page.fill('#v4Sheet [name=url]','https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Set/Charizard-V1-BS4');
 await page.click('#v4Sheet button[type=submit]');
 ok('Ficha Cardmarket exige vendedor',/vendedor/.test(await page.textContent('#v4Sheet .v4err')));
 await page.fill('#v4Sheet [name=seller]','VendedorPrueba');await page.fill('#v4Sheet [name=price]','180,50');await page.fill('#v4Sheet [name=shipping]','7');
 await page.selectOption('#v4Sheet [name=language]','Inglés');await page.selectOption('#v4Sheet [name=condition]','DMG');await page.fill('#v4Sheet [name=defects]','Pliegue horizontal');
 await page.fill('#v4Sheet [name=country]','España');await page.selectOption('#v4Sheet [name=zone]','es');
 await page.fill('#v4Sheet [name=costSource]','https://shop.example/quote/1');
 for(const k of ['vat','duty','handling','fxFee','sellTax'])await page.fill('#v4Sheet [name='+k+']','0');
 await page.fill('#v4Sheet [name=sellShipping]','5');await page.fill('#v4Sheet [name=sellFeePct]','5');
 for(const k of ['shipsSpain','costsConfirmed','saleCostsConfirmed'])await page.selectOption('#v4Sheet [name='+k+']','true');
 await page.selectOption('#v4Sheet [name=resaleCondition]','MP');
 await page.setInputFiles('#v4Sheet [name=photo]',path.join(root,'assets/cards/machamp-gx-154-es.png'));
 await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(700);
 ok('Hoja cerrada tras guardar',!(await page.isVisible('#v4Sheet form')));
 let c=await page.locator('#card-'+id);
 ok('Estado COMPRA COMPROBADA tras comprobación completa',(await c.locator('.v4status').textContent())==='COMPRA COMPROBADA');
 ok('Foto del ejemplar anunciado sustituye a la de catálogo',/Foto del ejemplar anunciado/.test(await c.locator('figcaption').textContent()));
 ok('Precio de compra visible',/180,50/.test(await c.locator('.v4money').first().textContent()));
 {const mt=await c.locator('.v4money').first().textContent();ok('Envío conocido mostrado (tarifa publicada desde fd310a6)',/envío 7,00\s€\s\((confirmado|tarifa publicada)\)/.test(mt),mt.slice(0,300))}
 // 4. Ventas reales: 2 ventas en USD y 1 anuncio (que no debe contar)
 for(const [kind,price,cur,date] of [['venta','600','USD','2026-10-01'],['venta','700','USD','2026-10-10'],['anuncio','5000','EUR','2026-10-20']]){
  await page.click('#card-'+id+' [data-v4-sale]');await page.waitForSelector('#v4Sheet form');
  await page.selectOption('#v4Sheet [name=kind]',kind);await page.fill('#v4Sheet [name=price]',price);await page.selectOption('#v4Sheet [name=currency]',cur);
  await page.fill('#v4Sheet [name=transactionId]',date);
  for(const k of ['sameVariant','verified','restored','sameIntervention'])await page.selectOption('#v4Sheet [name='+k+']','true');
  await page.fill('#v4Sheet [name=fxRate]','0.86');await page.fill('#v4Sheet [name=fxDate]','2026-10-22');await page.fill('#v4Sheet [name=fxSource]','https://www.ecb.europa.eu/');
  await page.fill('#v4Sheet [name=date]',date);await page.selectOption('#v4Sheet [name=condition]','MP');await page.selectOption('#v4Sheet [name=language]','Inglés');
  await page.fill('#v4Sheet [name=url]','https://www.tcgplayer.com/product/42382/pokemon-base-set-charizard');
  await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(300);
 }
 // Comparables restaurados; cambio documentado por transacción 0,86.
 const exp=(s)=>s*(0.95)-5-180.5-7;
 const want={low:exp(516),mid:exp(559),high:exp(602)};
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
 await page.evaluate(t=>window.CVSimpleNav.showTab(t),'ventas-reales');/* V116: pestaña oculta, módulo conservado */await page.waitForTimeout(400);
 const vr=await page.textContent('#v4Sales');
 ok('Pestaña Ventas reales distingue tipos',/VENTA CERRADA/.test(vr)&&/DATO AGREGADO/.test(vr)&&/ANUNCIO ACTIVO/.test(vr));
 if(shots)await page.screenshot({path:path.join(shots,'4-ventas-reales.png')});
 // 6c. Radar «En investigación» (APIs simuladas)
 ok('El universo de cartas no bloquea la carga (no va en el HTML; V112 lo pide tras pintar para las ofertas en directo)',!/vault-universe\.js/.test(fs.readFileSync(path.join(root,'index.html'),'utf8')));
 await page.evaluate(t=>window.CVSimpleNav.showTab(t),'investigacion');/* V116: pestaña oculta, módulo conservado */await page.waitForSelector('#v4Radar [data-rd-scan]');await page.waitForFunction(()=>!!window.CV_UNIVERSE);
 await page.selectOption('#v4Radar [data-rd-group]','vintage');await page.click('#v4Radar [data-rd-scan]');
 await page.waitForFunction(()=>/Última consulta: Pokémon/.test(document.getElementById('v4Radar').textContent)&&!document.querySelector('#v4Radar .rdprog'),null,{timeout:120000});/* V115: la consulta automática también hace Lorcana */
 const rd=await page.evaluate(()=>({first:document.querySelector('#v4Radar .v4card h3')?.textContent,n:document.querySelectorAll('#v4Radar .v4card').length,txt:document.getElementById('v4Radar').textContent}));
 ok('Radar consulta el grupo vintage y registra fallos',/1 fallidas|1 fallida/.test(rd.txt),rd.txt.match(/Última consulta[^.]*\./)?.[0]);
 ok('Top 1 del radar: Venusaur (Charizard excluido por estar ya en Mi colección)',['Venusaur','Charizard'].includes(rd.first),String(rd.first));
 ok('Radar nunca marca compra comprobada ni muestra beneficio',!/COMPRA COMPROBADA/.test(rd.txt)&&/EN INVESTIGACIÓN/.test(rd.txt)&&!/SI ESTÁ DAÑADA|BENEFICIO/.test(rd.txt)&&/NO es beneficio/.test(rd.txt));
 await page.click('[data-rd-view="disc"]');
 ok('Descartadas con motivo (< 20 € y diferencia insuficiente)',/\(< 20 €\)/.test(await page.textContent('#v4Radar'))&&/Diferencia bruta/.test(await page.textContent('#v4Radar')));
 await page.click('[data-rd-view="top"]');
 await page.click('[data-rd-lorcana]');await page.waitForFunction(()=>/Lorcana · referencia/.test(document.getElementById('v4Radar').textContent),null,{timeout:30000});
 ok('Lorcana: referencia en € con cambio y sin beneficio inventado',/90,00\s€/.test(await page.textContent('#v4Radar details.v4old'))&&/no se calcula beneficio/.test(await page.textContent('#v4Radar details.v4old')));
 await page.click('#v4Radar [data-rd-promote="base1-15|restaurar"]');await page.waitForTimeout(500);
 const promo=await page.evaluate(()=>{const c=[...document.querySelectorAll('#v4Restore .v4card')].find(a=>/Radar/.test(a.textContent)||/Detectada (por el radar|en directo)/.test(a.textContent));return c?{status:c.querySelector('.v4status').textContent,profit:c.querySelector('.v4profit').textContent}:null});
 ok('Promover desde el radar crea ficha en Restaurar sin beneficio (solo agregados)',promo&&promo.status==='OBJETIVO · SIN ANUNCIO'&&/—/.test(promo.profit),JSON.stringify(promo));
 if(shots){await page.evaluate(t=>window.CVSimpleNav.showTab(t),'investigacion');/* V116: pestaña oculta, módulo conservado */await page.waitForTimeout(300);await page.screenshot({path:path.join(shots,'5-investigacion.png')});const c1=await page.$('#v4Radar .v4card');if(c1)await c1.screenshot({path:path.join(shots,'6-radar-ficha.png')})}
 // 7. Persistencia y caducidad a las 24 h
 await page.reload({waitUntil:'load'});await page.waitForSelector('#v4Restore .v4card',{state:'attached'});await page.waitForTimeout(700);
 ok('Comprobación persiste tras recargar',(await page.locator('#card-'+id+' .v4status').textContent())==='COMPRA COMPROBADA');
 ok('Foto persiste tras recargar (IndexedDB)',/Foto del ejemplar anunciado/.test(await page.locator('#card-'+id+' figcaption').textContent()));
 await page.evaluate(i=>{const u=JSON.parse(localStorage.getItem('cv_v104_user'));u.patches[i].listing.checkedAt=new Date(Date.now()-25*3600e3).toISOString();localStorage.setItem('cv_v104_user',JSON.stringify(u))},id);
 await page.reload({waitUntil:'load'});await page.waitForSelector('#v4Restore .v4card',{state:'attached'});await page.waitForTimeout(500);
 ok('Pasadas 24 h pasa a CADUCADA',(await page.locator('#card-'+id+' .v4status').textContent())==='CADUCADA');
 // 8. Otras pestañas siguen funcionando
 ok('V123: barra con Compra YA, Favoritos, Vender YA, Mi colección, Sellado, Cartas graduadas, Valorar PSA y Archivo',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.mainNav [data-tab]')].map(b=>b.dataset.tab)))===JSON.stringify(['radar','favoritos','vender','collection','sealed','pregrade','psa-valorar','archive']));
 for(const t of ['favoritos','collection','sealed','pregrade','psa-valorar','archive','radar']){await page.click('.mainNav [data-tab="'+t+'"]');await page.waitForTimeout(250);ok('Pestaña '+t+' se muestra',await page.evaluate(x=>!document.getElementById(x).classList.contains('hidden'),t))}
 ok('Mi colección sigue con cartas',await page.evaluate(()=>window.CVStateBridge.get().cards.length>=15));
 ok('Sin errores de JavaScript',errors.length===0,errors.slice(0,5).join(' | '));
 // 6b. He comprado → Mi colección
 await page.click('.mainNav [data-tab="radar"]');await page.waitForTimeout(300);
 const before=await page.evaluate(()=>window.CVStateBridge.get().cards.length);
 await page.evaluate(i=>{const d=document.getElementById('card-'+i)?.closest('details');if(d)d.open=true},id);await page.click('#card-'+id+' [data-v4-bought]');await page.waitForSelector('#v4Sheet form');await page.selectOption('#v4Sheet [name=costsPaid]','pagados');await page.dblclick('#v4Sheet button[type=submit]');await page.waitForTimeout(400);
 const after=await page.evaluate(()=>{const c=window.CVStateBridge.get().cards;return {n:c.length,last:c[c.length-1]}});
 ok('He comprado (doble toque) añade UNA carta con su coste completo',after.n===before+1&&after.last.purchase===180.5&&after.last.purchaseShipping===7&&after.last.purchaseCosts?.status==='pagados'&&after.last.valuationStatus==='cost'&&after.last.name==='Charizard',JSON.stringify(after.last).slice(0,220));
 ok('Comprada desaparece del radar de restauración',await page.locator('#card-'+id).count()===0);

 await browser.close();server.close();
 console.log(results.map(r=>r.join(' · ')).join('\n'));console.log('\n'+results.length+' comprobaciones superadas');
})().catch(e=>{console.log(results.map(r=>r.join(' · ')).join('\n'));console.error(e.message);process.exit(1)});
