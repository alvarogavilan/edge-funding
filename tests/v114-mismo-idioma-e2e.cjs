// V112–V114 · ofertas en directo con compra y venta del MISMO idioma (Chromium con emulación de iPhone; no es Safari real).
// Ejecutar: node tests/v114-mismo-idioma-e2e.cjs
// Sin Internet: las respuestas de TCGdex y pokemontcg.io son SIMULADAS con su formato público; no son datos de mercado.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let pw;for(const m of ['playwright','/opt/node22/lib/node_modules/playwright']){try{pw=require(m);break}catch{}}
if(!pw){console.log('PENDIENTE: Playwright no disponible.');process.exit(2)}
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
let n=0;const ok=(name,cond,extra='')=>{console.log((cond?'OK ':'FALLO')+' · '+name+(extra?' · '+extra:''));assert.ok(cond,name+' '+extra);n++};
// base1-4: Compra YA, inglés siempre presente · base1-2: Restaurar, TCGdex omite el inglés en la 1.ª respuesta (incidencia #2479)
// base1-15: Restaurar, TCGdex nunca trae inglés → pokemontcg.io · resto: sin margen.
const CM={'base1-2':{trend:210,avg30:200,avg7:205,low:50},'base1-4':{trend:175,avg30:170,avg7:172,low:100},'base1-15':{trend:300,avg30:300,avg7:300,low:60}};
const TP={'base1-4':{holofoil:{lowPrice:90,marketPrice:200}},'base1-2':{holofoil:{lowPrice:40,marketPrice:160}}};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});let calls=0;const seen={},ptcg=[];
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url();
  if(/images\.pokemontcg\.io\/base1\/2_hires/.test(u))return route.fulfill({status:404,body:''});/* fuerza el respaldo de foto */
  if(/assets\.tcgdex\.net|images\.pokemontcg\.io/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  const hdr={'access-control-allow-origin':'*'};
  let m=u.match(/api\.pokemontcg\.io\/v2\/cards\/([^?]+)/);
  if(m){ptcg.push(m[1]);return route.fulfill({status:200,contentType:'application/json',headers:hdr,body:JSON.stringify({data:{id:m[1],tcgplayer:m[1]==='base1-15'?{updatedAt:'2026/10/24',prices:{holofoil:{low:50,market:400}}}:null}})})}
  m=u.match(/api\.tcgdex\.net\/v2\/en\/cards\/([^?]+)/);
  if(m){calls++;const id=decodeURIComponent(m[1]);seen[id]=(seen[id]||0)+1;const cm={updated:'2026-10-24T00:00:00Z',unit:'EUR',...(CM[id]||{trend:60,avg30:58,avg7:59,low:55})};
   const tp=TP[id]&&!(id==='base1-2'&&seen[id]===1)?{updated:'2026-10-24',unit:'USD',...TP[id]}:null;
   return route.fulfill({status:200,contentType:'application/json',headers:hdr,body:JSON.stringify({id,pricing:{cardmarket:cm,tcgplayer:tp}})})}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>!document.querySelector('[data-rd-live] .rdprog')&&document.querySelectorAll('[data-rd-live] .rdlive').length>0,null,{timeout:120000});
 ok('Compra YA consulta precios sola al abrir',calls>=315,calls+' consultas');
 ok('TCGdex sin inglés en la 1.ª respuesta → se repite la petición',seen['base1-2']>=2,String(seen['base1-2']));
 ok('Sin inglés en TCGdex → se consulta pokemontcg.io (solo para candidatas)',ptcg.length===1&&ptcg[0]==='base1-15',JSON.stringify(ptcg));
 const buy=await page.evaluate(()=>[...document.querySelectorAll('[data-rd-live="compra"] .rdlive')].map(a=>({id:a.id,t:a.textContent,href:a.querySelector('a.v4btn.primary')?.href})));
 const b=buy.find(x=>x.id==='live-base1-4');
 ok('Compra YA: aparece la candidata',!!b,JSON.stringify(buy.map(x=>x.id)));
 ok('Inglés automático: ventas 172 € y anuncio 77,40 € del mismo idioma (TCGplayer, holofoil)',/INGLÉS · TCGPLAYER EE\. UU\.172,00\s€/.test(b.t)&&/anuncio más barato en inglés 77,40\s€/.test(b.t)&&/variante holofoil/.test(b.t),b.t.slice(0,420));
 ok('Inglés automático: beneficio +41,60 € con compra traída a Sevilla (116,80 €) → RENTABLE EN INGLÉS',/RENTABLE EN INGLÉS · TCGPLAYER EE\. UU\./.test(b.t)&&/\+41,60\s€/.test(b.t)&&/116,80\s€/.test(b.t));
 ok('Idiomas mezclados de Cardmarket solo como criba',/TODOS LOS IDIOMAS/.test(b.t)&&/NO es beneficio/.test(b.t));
 ok('Enlace directo a la ficha de Cardmarket',b.href==='https://prices.pokemontcg.io/cardmarket/base1-4',b.href);
 await page.evaluate(()=>{document.querySelector('#live-base1-4 details.rdlangbox').open=true});
 await page.fill('[data-rd-lbuy="base1-4|en"]','150');await page.fill('[data-rd-lbuy="base1-4|es"]','100');await page.fill('[data-rd-lsell="base1-4|es"]','175');
 await page.click('[data-rd-lsave="base1-4"]');await page.waitForTimeout(300);
 let t4=await page.textContent('#live-base1-4');
 ok('Inglés anotado (Cardmarket 150 €) manda sobre el automático → +2,40 €',/\+2,40\s€/.test(t4));
 ok('Español anotado 100 → 175 → +55,25 € y «RENTABLE EN ESPAÑOL»',/\+55,25\s€/.test(t4)&&/RENTABLE EN ESPAÑOL · PRECIOS DEL IDIOMA/.test(t4));
 await page.reload();await page.waitForFunction(()=>!!document.querySelector('#live-base1-4'),null,{timeout:60000});
 t4=await page.textContent('#live-base1-4');ok('Precios por idioma conservados tras recargar',/RENTABLE EN ESPAÑOL/.test(t4)&&/\+55,25\s€/.test(t4));
 ok('Compra YA: la dañada barata no aparece aquí',!buy.some(x=>x.id==='live-base1-2'));
 await page.click('.mainNav [data-tab="comprar-restaurar"]');await page.waitForTimeout(500);
 const rest=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('[data-rd-live="restaurar"] .rdlive')].map(a=>[a.id,a.textContent])));
 const r2=rest['live-base1-2'],r15=rest['live-base1-15'];
 ok('Restaurar (reintento TCGdex): ventas en inglés 137,60 € (mejorada al 75 %) frente a compra 34,40 € → +28,27 €, sin margen suficiente',!!r2&&/137,60\s€/.test(r2)&&/34,40\s€/.test(r2)&&/\+28,27\s€/.test(r2)&&/MISMO IDIOMA · INGLÉS SIN MARGEN SUFICIENTE/.test(r2),r2?r2.slice(0,300):'');
 ok('Restaurar (pokemontcg.io): +164,92 € en inglés → RENTABLE EN INGLÉS, fuente indicada',!!r15&&/\+164,92\s€/.test(r15)&&/RENTABLE EN INGLÉS/.test(r15)&&/vía pokemontcg\.io/.test(r15),r15?r15.slice(0,300):'');
 ok('Restaurar: la rentable en inglés va primero',Object.keys(rest)[0]==='live-base1-15',JSON.stringify(Object.keys(rest)));
 await page.locator('#live-base1-2 img').scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const im=document.querySelector('#live-base1-2 img');return im.hidden||(im.complete&&im.naturalWidth>0)},null,{timeout:15000}).catch(()=>{});
 const ph=await page.evaluate(()=>{const im=document.querySelector('#live-base1-2 img');return {src:im.currentSrc||im.src,ok:im.complete&&im.naturalWidth>0,hidden:im.hidden}});
 ok('Foto: si la imagen principal falla se usa la alternativa de TCGdex',ph.ok&&!ph.hidden&&/assets\.tcgdex\.net/.test(ph.src),JSON.stringify(ph));
 await page.click('[data-rd-live="restaurar"] [data-rd-promote="base1-15|restaurar"]');await page.waitForTimeout(500);
 const reg=await page.evaluate(()=>{const it=window.CVVault.allItems().find(i=>i.custom&&i.lane==='restaurar'&&i.name==='Venusaur');return it?{lang:it.language,en:(it.sales||[]).filter(s=>s.language==='Inglés').length}:null});
 ok('«Registrar este anuncio» la pasa en inglés con su venta en inglés etiquetada',reg&&reg.lang==='Inglés'&&reg.en>=1,JSON.stringify(reg));
 for(const w of [320,375,430]){await page.setViewportSize({width:w,height:800});await page.waitForTimeout(150);
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Sin desbordamiento horizontal · '+w+' px',o.sw<=o.iw,JSON.stringify(o))}
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V114 superadas');
})().catch(e=>{console.error(e);process.exit(1)});
