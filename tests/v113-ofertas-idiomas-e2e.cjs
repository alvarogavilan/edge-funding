// V112/V113 · ofertas en directo con idiomas separados y fotos con respaldo (Chromium con emulación de iPhone; no es Safari real).
// Ejecutar: node tests/v113-ofertas-idiomas-e2e.cjs
// Sin Internet: las respuestas de TCGdex son SIMULADAS con su formato público; no son datos de mercado.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let pw;for(const m of ['playwright','/opt/node22/lib/node_modules/playwright']){try{pw=require(m);break}catch{}}
if(!pw){console.log('PENDIENTE: Playwright no disponible.');process.exit(2)}
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
let n=0;const ok=(name,cond,extra='')=>{console.log((cond?'OK ':'FALLO')+' · '+name+(extra?' · '+extra:''));assert.ok(cond,name+' '+extra);n++};
// Simulación: base1-2 dañada barata (Restaurar), base1-4 anuncio cercano a la media (Compra YA), resto sin margen.
const CM={'base1-2':{trend:210,avg30:200,avg7:205,low:50},'base1-4':{trend:175,avg30:170,avg7:172,low:100}};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});let calls=0;
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url();
  if(/images\.pokemontcg\.io\/base1\/2_hires/.test(u))return route.fulfill({status:404,body:''});/* fuerza el respaldo de foto */
  if(/assets\.tcgdex\.net|images\.pokemontcg\.io/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  const m=u.match(/api\.tcgdex\.net\/v2\/en\/cards\/([^?]+)/);
  if(m){calls++;const id=decodeURIComponent(m[1]),cm={updated:'2026-10-24T00:00:00Z',unit:'EUR',...(CM[id]||{trend:60,avg30:58,avg7:59,low:55})};
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({id,pricing:{cardmarket:cm,...(id==='base1-4'?{tcgplayer:{updated:'2026-10-24',unit:'USD',holofoil:{marketPrice:200}}}:{})}})})}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>!document.querySelector('[data-rd-live="compra"] .rdprog')&&document.querySelectorAll('[data-rd-live] .rdlive').length>0,null,{timeout:120000});
 ok('Compra YA consulta precios sola al abrir (sin datos previos)',calls>=300,calls+' consultas');
 const buy=await page.evaluate(()=>[...document.querySelectorAll('[data-rd-live="compra"] .rdlive')].map(a=>({id:a.id,t:a.textContent,href:a.querySelector('a.v4btn.primary')?.href})));
 ok('Compra YA: aparece la oferta con margen',buy.some(x=>x.id==='live-base1-4'),JSON.stringify(buy.map(x=>x.id)));
 const b=buy.find(x=>x.id==='live-base1-4');
 ok('Compra YA: precio «desde», ventas de todos los idiomas y ventas en inglés, sin beneficio mezclado',/100,00\s€/.test(b.t)&&/TODOS LOS IDIOMAS/.test(b.t)&&/170,00\s€/.test(b.t)&&/VENTAS EN INGLÉS/.test(b.t)&&/IDIOMA SIN CONFIRMAR/.test(b.t)&&/NO es beneficio/.test(b.t),b.t.slice(0,300));
 ok('Compra YA: enlace directo a la ficha de Cardmarket',b.href==='https://prices.pokemontcg.io/cardmarket/base1-4',b.href);
 await page.evaluate(()=>{document.querySelector('#live-base1-4 details.rdlangbox').open=true});
 await page.fill('[data-rd-lbuy="base1-4|en"]','150');await page.fill('[data-rd-lbuy="base1-4|es"]','100');await page.fill('[data-rd-lsell="base1-4|es"]','175');
 await page.click('[data-rd-lsave="base1-4"]');await page.waitForTimeout(300);
 let t4=await page.textContent('#live-base1-4');
 ok('Inglés: compra 150 frente a ventas en inglés 172 → +2,40 € (no rentable)',/\+2,40\s€/.test(t4),t4.match(/Inglés[^A-Z]{0,80}/)?.[0]||'');
 ok('Español: compra 100 y venta 175 en español → +55,25 € y «RENTABLE EN ESPAÑOL»',/\+55,25\s€/.test(t4)&&/RENTABLE EN ESPAÑOL/.test(t4));
 await page.reload();await page.waitForFunction(()=>!!document.querySelector('#live-base1-4'),null,{timeout:60000});
 t4=await page.textContent('#live-base1-4');ok('Los precios por idioma se conservan tras recargar',/RENTABLE EN ESPAÑOL/.test(t4)&&/\+55,25\s€/.test(t4));
 ok('Compra YA: la dañada barata no aparece aquí',!buy.some(x=>x.id==='live-base1-2'));
 await page.click('.mainNav [data-tab="comprar-restaurar"]');await page.waitForTimeout(500);
 const rest=await page.evaluate(()=>[...document.querySelectorAll('[data-rd-live="restaurar"] .rdlive')].map(a=>({id:a.id,t:a.textContent,vis:a.getBoundingClientRect().height>0})));
 const r=rest.find(x=>x.id==='live-base1-2');
 ok('Restaurar: 50 € dañada con ventas de 200 € → venta mejorada central 150 € como criba (sin beneficio de idioma)',!!r&&r.vis&&/50,00\s€/.test(r.t)&&/150,00\s€/.test(r.t)&&/IDIOMA SIN CONFIRMAR/.test(r.t),r?r.t.slice(0,260):'');
 const ph=await page.evaluate(()=>{const im=document.querySelector('#live-base1-2 img');return {src:im.currentSrc||im.src,ok:im.complete&&im.naturalWidth>0,hidden:im.hidden}});
 ok('Foto: si la imagen principal falla se usa la alternativa de TCGdex',ph.ok&&!ph.hidden&&/assets\.tcgdex\.net/.test(ph.src),JSON.stringify(ph));
 ok('Restaurar: la de anuncio cercano a la media no aparece aquí',!rest.some(x=>x.id==='live-base1-4'));
 await page.click('[data-rd-live="restaurar"] [data-rd-promote="base1-2|restaurar"]');await page.waitForTimeout(500);
 ok('«Registrar este anuncio» la añade a Restaurar para comprobarla',await page.evaluate(()=>window.CVVault.allItems().some(i=>i.custom&&i.lane==='restaurar'&&i.name==='Blastoise')));
 for(const w of [320,375,430]){await page.setViewportSize({width:w,height:800});await page.waitForTimeout(150);
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Sin desbordamiento horizontal · '+w+' px',o.sw<=o.iw,JSON.stringify(o))}
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V113 superadas');
})().catch(e=>{console.error(e);process.exit(1)});
