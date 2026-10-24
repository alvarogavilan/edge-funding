// Regresiones V107 en navegador (Chromium con emulación móvil; NO es Safari real).
// Ejecutar: node tests/vault-v107-regresion-e2e.cjs
// Sin Internet: todas las respuestas externas son SIMULADAS con el formato de las APIs públicas; no son datos de mercado.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
/* V110: los objetivos sin anuncio van plegados; se abre el bloque antes de pulsar */
const openClick=async(page,sel)=>{await page.evaluate(q=>{let d=document.querySelector(q)?.closest('details');while(d){d.open=true;d=d.parentElement?.closest('details')}},sel);await page.click(sel)};
let pw;for(const m of ['playwright',process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES&&process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright','/opt/node22/lib/node_modules/playwright'].filter(Boolean)){try{pw=require(m);break}catch{}}
if(!pw){console.log('PENDIENTE: Playwright no disponible; prueba no ejecutada.');process.exit(2)}
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
const J=(route,obj,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:typeof obj==='string'?obj:JSON.stringify(obj)});
const results=[];const ok=(name,cond,extra='')=>{results.push([cond?'OK ':'FALLO',name,extra]);if(!cond)throw new Error('FALLO: '+name+' '+extra)};
async function newPage(browser,opts={},mode='normal'){
 const ctx=await browser.newContext({...pw.devices['iPhone 13'],...opts});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url();
  if(/images\.pokemontcg\.io|assets\.tcgdex\.net|cards\.lorcast\.io/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(/api\.frankfurter\.app/.test(u))return J(route,{amount:1,base:'USD',date:'2026-10-23',rates:{EUR:0.9}});
  if(/api\.lorcast\.com\/v0\/sets$/.test(u))return J(route,{results:[{code:'1',name:'The First Chapter'},{code:'3',name:'Into the Inklands'}]});
  if(/api\.lorcast\.com\/v0\/sets\/1\/cards/.test(u))return J(route,[{id:'tb',name:'Tinker Bell',version:'Giant Fairy',collector_number:'216',rarity:'Enchanted',prices:{usd_foil:'90'},image_uris:{digital:{large:'https://cards.lorcast.io/card/digital/large/tb216.avif'}}},{id:'x',name:'Otra carta',collector_number:'215',rarity:'Enchanted',image_uris:{digital:{large:'https://cards.lorcast.io/card/digital/large/otra215.avif'}}}]);
  if(/api\.lorcast\.com/.test(u))return J(route,[]);
  if(/api\.tcgdex\.net/.test(u)){if(mode==='down')return route.fulfill({status:503,body:''});if(mode==='malformed')return J(route,'{no es json');return J(route,{pricing:{cardmarket:{updated:'2026-10-22',trend:30,avg30:29,avg7:30,low:25}}})}
  return route.abort()});
 const page=await ctx.newPage();page.errors=[];
 page.on('pageerror',e=>page.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|net::/.test(m.text()))page.errors.push(m.text())});
 return {ctx,page};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch({executablePath:fs.existsSync('/opt/pw-browsers/chromium')?undefined:undefined});
 // 1. Anchuras móviles y escritorio
 for(const w of [320,375,390,430,1280]){
  const {ctx,page}=await newPage(browser,w===1280?{viewport:{width:1280,height:900},isMobile:false,hasTouch:false,deviceScaleFactor:1,userAgent:undefined}:{viewport:{width:w,height:800}});
  const t0=Date.now();await page.goto(base,{waitUntil:'load'});await page.waitForSelector('#v4Buy .v4head');const ms=Date.now()-t0;
  for(const tab of ['radar','collection','archive']){/* V116: pestañas visibles */
   await page.click('.mainNav [data-tab="'+tab+'"]');await page.waitForTimeout(250);
   const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));
   ok('Sin desbordamiento horizontal · '+w+' px · '+tab,o.sw<=o.iw+1,JSON.stringify(o));
  }
  ok('Carga inicial con Compra YA pintada · '+w+' px',ms<15000,ms+' ms');
  ok('Sin errores de JavaScript · '+w+' px',page.errors.length===0,page.errors.join(' | '));
  await ctx.close();
 }
 // 2. Fotos e historial
 {const {ctx,page}=await newPage(browser);page.on('dialog',d=>d.accept());
  await page.goto(base,{waitUntil:'load'});await page.waitForSelector('#v4Buy .v4card',{state:'attached'});await page.waitForTimeout(1500);
  const lor=await page.evaluate(()=>{const c=[...document.querySelectorAll('#v4Buy .v4card')].find(a=>/Tinker Bell/.test(a.querySelector('h3').textContent));return c&&{src:c.querySelector('img')?.getAttribute('src')||'',txt:c.textContent}});
  ok('Lorcana histórica: foto por identidad exacta (colección + número + nombre)',lor&&/tb216/.test(lor.src),JSON.stringify(lor&&lor.src));
  ok('Notas antiguas marcadas como históricas, no como recomendación',/Nota histórica/.test(lor.txt)&&!/Por qué merece la pena mirarla/.test(lor.txt));
  const pp=await page.evaluate(()=>{const c=[...document.querySelectorAll('#v4Buy .v4card')].find(a=>/EVS 008/.test(a.textContent));return c?.querySelector('.v4noimg:not([hidden])')?.textContent||''});
  ok('Variante sin foto exacta: aviso honesto, sin foto de otra variante',/Sin foto verificada de esta variante exacta/.test(pp),pp);
  // 3. Venta futura rechazada
  await page.click('.mainNav [data-tab="radar"]');await page.waitForTimeout(300);
  await openClick(page,'[data-v4-sale="rest-base1-2"]');await page.waitForSelector('#v4Sheet form');
  await page.fill('#v4Sheet [name=price]','100');await page.fill('#v4Sheet [name=date]','2030-01-01');await page.click('#v4Sheet button[type=submit]');
  ok('Venta con fecha futura rechazada',/futura/.test(await page.textContent('#v4Sheet .v4err')));
  await page.fill('#v4Sheet [name=date]','2026-10-01');await page.selectOption('#v4Sheet [name=verified]','true');await page.click('#v4Sheet button[type=submit]');
  ok('Venta «comprobada» sin enlace rechazada',/enlace/.test(await page.textContent('#v4Sheet .v4err')));
  await page.click('#v4Sheet [data-v4-close]');
  // 4. Exportar → importar sin duplicar ni borrar
  await page.evaluate(()=>window.CVVault.addCustom({lane:'restaurar',game:'pokemon',name:'Ficha local',set:'Base Set',number:'1/102',sales:[{kind:'agregado',price:50,currency:'EUR',date:'2026-10-20',platform:'Prueba'}]}));
  await page.evaluate(t=>window.CVSimpleNav.showTab(t),'ventas-reales');/* V116: pestaña oculta, módulo conservado */await page.waitForTimeout(300);
  await page.evaluate(()=>{const d=[...document.querySelectorAll('#v4Sales details')].pop();d.open=true});
  const [dl]=await Promise.all([page.waitForEvent('download'),page.click('[data-v4-export]')]);
  const exported=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
  ok('Exportación incluye fichas propias, compras y formato',exported.format==='cv-user-v2'&&exported.user.custom.some(c=>c.name==='Ficha local'));
  const before=await page.evaluate(()=>({n:window.CVVault.user().custom.length,s:window.CVVault.user().custom.reduce((a,c)=>a+(c.sales||[]).length,0)}));
  const inc=JSON.parse(JSON.stringify(exported));inc.user.custom.push({id:'own-importada',custom:true,lane:'compra',game:'lorcana',name:'Ficha importada',set:'X',number:'1',sales:[]});
  const f=path.join(require('node:os').tmpdir(),'cv-import-'+Date.now()+'.json');fs.writeFileSync(f,JSON.stringify(inc));
  await page.setInputFiles('[data-v4-import]',f);await page.waitForTimeout(500);await page.setInputFiles('[data-v4-import]',f);await page.waitForTimeout(500);
  const after=await page.evaluate(()=>({n:window.CVVault.user().custom.length,s:window.CVVault.user().custom.reduce((a,c)=>a+(c.sales||[]).length,0),names:window.CVVault.user().custom.map(c=>c.name)}));
  ok('Importar dos veces: añade 1 ficha nueva, sin duplicar ventas ni borrar locales',after.n===before.n+1&&after.s===before.s&&after.names.includes('Ficha local'),JSON.stringify({before,after}));
  fs.writeFileSync(f,'{roto');await page.setInputFiles('[data-v4-import]',f);await page.waitForTimeout(400);
  ok('Copia corrupta: no cambia nada',(await page.evaluate(()=>window.CVVault.user().custom.length))===after.n);
  // 5. Compra → venta → archivo conserva costes
  const cardId=await page.evaluate(()=>{const it=window.CVVault.allItems().find(i=>i.id==='rest-base1-2');it.listing={url:'https://shop.example/p/1',shop:'Tienda',seller:'S',price:40,country:'Alemania',zone:'ue'};
   const r=window.CVVault.engine.addToCollection(it,{price:40,costs:{shipping:6,vat:0,duty:0,handling:0,fxFee:NaN},costsPaid:'pagados',language:'Inglés',condition:'PO',date:'2026-10-20'});
   const c=window.CVStateBridge.get().cards;return r===true?c[c.length-1].id:null});
  ok('Alta en colección con coste desconocido conservado como desconocido',!!cardId&&await page.evaluate(id=>{const c=window.CVStateBridge.get().cards.find(x=>x.id===id);return c.purchaseFees===null&&c.costLot.status==='desconocido'&&c.costLot.unknown.includes('cambio / pago')&&c.costLot.totalCents===null&&c.valuationStatus==='cost'},cardId));
  const dup=await page.evaluate(()=>{const it=window.CVVault.allItems().find(i=>i.id==='rest-base1-2');return window.CVVault.engine.addToCollection(it,{price:40,costs:{},costsPaid:'pagados',date:'2026-10-20'})});
  ok('Misma compra registrada dos veces: bloqueada',dup==='dup');
  const answers=['95','8','5','Cardmarket','PED-1','prueba'];page.removeAllListeners('dialog');page.on('dialog',d=>d.type()==='prompt'?d.accept(answers.shift()):d.accept());
  await page.evaluate(id=>window.CVCollectionSales.sell(id),cardId);await page.waitForTimeout(400);
  const sold=await page.evaluate(id=>{const s=window.CVStateBridge.get();const h=(s.saleHistory||[]).find(x=>x.cardId===id||x.cardSnapshot?.buyOpportunityId==='rest-base1-2'||x.name==='Blastoise');const c=s.cards.find(x=>x.id===id);return {h:!!h,costs:JSON.stringify(h||{}).includes('purchaseCosts'),archived:!!c?.archivedSold||!s.cards.some(x=>x.id===id&&!x.archivedSold)}},cardId);
  ok('Venta posterior: historial creado, costes de compra conservados, carta archivada',sold.h&&sold.costs&&sold.archived,JSON.stringify(sold));
  ok('Sin errores de JavaScript (historial)',page.errors.length===0,page.errors.join(' | '));
  await ctx.close();}
 // 5b. Copia antigua V104, compra en USD sin cambio documentado y evaluación de restauración
 {const {ctx,page}=await newPage(browser);page.on('dialog',d=>d.accept());
  await page.goto(base,{waitUntil:'load'});await page.waitForSelector('#v4Sales',{state:'attached'});await page.waitForTimeout(800);
  const old={app:'Card Vault V104',exportedAt:'2026-10-23T10:00:00Z',user:{cfg:{feePct:5},patches:{'rest-base1-15':{sales:[{id:'uold1',kind:'agregado',price:300,currency:'EUR',date:'2026-10-01',platform:'Antigua'}]}},custom:[{id:'own-v104',custom:true,lane:'restaurar',game:'pokemon',name:'Copia V104',set:'Neo',number:'9/111',listing:null,sales:[]}]},photos:{}};
  const f=path.join(require('node:os').tmpdir(),'cv-old-'+Date.now()+'.json');fs.writeFileSync(f,JSON.stringify(old));
  await page.evaluate(t=>window.CVSimpleNav.showTab(t),'ventas-reales');/* V116: pestaña oculta, módulo conservado */await page.evaluate(()=>{const d=[...document.querySelectorAll('#v4Sales details')].pop();d.open=true});
  await page.setInputFiles('[data-v4-import]',f);await page.waitForTimeout(500);
  ok('Copia antigua (formato V104) importada sin perder datos',await page.evaluate(()=>window.CVVault.user().custom.some(c=>c.id==='own-v104')&&(window.CVVault.user().patches['rest-base1-15']?.sales||[]).length===1));
  await page.click('.mainNav [data-tab="radar"]');await page.waitForTimeout(300);
  await openClick(page,'[data-v4-verify="rest-base1-15"]');await page.waitForSelector('#v4Sheet form');
  for(const k of ['defectsUnknown','plannedIntervention','exitScenario'])ok('Formulario restauración incluye '+k,await page.locator('#v4Sheet [name='+k+']').count()===1);
  await page.fill('#v4Sheet [name=url]','https://shop.example.co.uk/p/venusaur');await page.fill('#v4Sheet [name=seller]','Tienda UK');await page.fill('#v4Sheet [name=price]','60');
  await page.selectOption('#v4Sheet [name=language]','Inglés');await page.selectOption('#v4Sheet [name=condition]','PO');await page.fill('#v4Sheet [name=country]','Reino Unido');await page.selectOption('#v4Sheet [name=zone]','fuera');
  await page.fill('#v4Sheet [name=defects]','Pliegue central');await page.selectOption('#v4Sheet [name=irreversibleRisk]','alto');
  await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(500);
  const card=await page.textContent('#card-rest-base1-15');
  ok('Ficha restauración separa estado, defectos, no evaluables, riesgo y foto real',/Defectos no evaluables/.test(card)&&/Riesgo irreversible/.test(card)&&/NO: imprescindible/.test(card));
  ok('Importación extracomunitaria: IVA/aranceles desconocidos, no cero',/IVA adicional: desconocido/.test(card)&&/Aranceles: desconocido/.test(card)&&/importación: IVA, arancel/.test(card));
  await page.evaluate(()=>{const d=document.getElementById('card-rest-base1-15')?.closest('details');if(d)d.open=true});
  await page.click('#card-rest-base1-15 [data-v4-bought]');await page.waitForSelector('#v4Sheet form');
  await page.selectOption('#v4Sheet [name=currency]','GBP');await page.fill('#v4Sheet [name=originalTotal]','52');await page.selectOption('#v4Sheet [name=costsPaid]','estimados');await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(400);
  const last=await page.evaluate(()=>{const c=window.CVStateBridge.get().cards;return c[c.length-1]});
  ok('Compra en GBP sin cambio documentado: queda marcada, costes estimados no pasan a pagados',last.name==='Venusaur'&&last.purchaseCosts.fx.currency==='GBP'&&last.purchaseCosts.fx.documented===false&&last.purchaseCosts.status==='estimados'&&last.purchaseShipping===null,JSON.stringify(last.purchaseCosts));
  ok('Sin errores de JavaScript (copias, importación, divisa)',page.errors.length===0,page.errors.join('|'));
  await ctx.close();}
 // 6. Almacenamiento no disponible
 {const {ctx,page}=await newPage(browser);page.on('dialog',d=>d.accept());
  await page.goto(base,{waitUntil:'load'});await page.waitForSelector('#v4Restore .v4card',{state:'attached'});
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('QuotaExceededError')}});
  await page.click('.mainNav [data-tab="radar"]');await openClick(page,'[data-v4-new="restaurar"]');await page.fill('#v4Sheet [name=name]','Sin almacenamiento');await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(300);
  ok('Almacenamiento lleno/bloqueado: aviso claro y sin bloqueo',/No se ha podido guardar/.test(await page.textContent('#v4Toast'))&&page.errors.length===0,page.errors.join('|'));
  await ctx.close();}
 // 7. API caída y respuesta malformada
 for(const mode of ['down','malformed']){const {ctx,page}=await newPage(browser,{},mode);
  await page.goto(base,{waitUntil:'load'});await page.evaluate(()=>window.CVSimpleNav.showTab('investigacion'));/* V116: pestaña oculta */await page.waitForSelector('#v4Radar [data-rd-scan]');await page.waitForFunction(()=>!!window.CV_UNIVERSE);
  await page.selectOption('#v4Radar [data-rd-group]','vintage');await page.click('#v4Radar [data-rd-scan]');
  await page.waitForFunction(()=>/Última consulta/.test(document.getElementById('v4Radar').textContent),null,{timeout:240000});
  const t=await page.textContent('#v4Radar');
  ok('Radar con API '+(mode==='down'?'caída (503)':'malformada')+': fallos contados, sin tarjetas inventadas',/0 correctas/.test(t)&&/fallidas/.test(t)&&(await page.locator('#v4Radar .v4card').count())===0,(t.match(/Última consulta[^.]*\./)||[''])[0]);
  ok('Sin errores de JavaScript (API '+mode+')',page.errors.length===0,page.errors.join('|'));
  await ctx.close()}
 await browser.close();server.close();
 console.log(results.map(r=>r.join(' · ')).join('\n'));console.log('\n'+results.length+' comprobaciones superadas');
})().catch(e=>{console.log(results.map(r=>r.join(' · ')).join('\n'));console.error(e.message);server.close();process.exit(1)});
