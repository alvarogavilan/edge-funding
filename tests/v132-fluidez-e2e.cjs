// V132 · «Al desplegar chollos o punto de mira se queda colgada y me desplaza»: en el iPhone la comprobación de versiones
// repintaba toda la sección cada ~2 s durante minutos. Se simula esa red lenta y se comprueba que lo desplegado sigue
// abierto/cerrado, la página no se mueve y no hay repintados mientras desplazas. Chromium con emulación de iPhone.
// Ejecutar: node tests/v132-fluidez-e2e.cjs · Datos SIMULADOS con el formato público; PRECIOS INVENTADOS.
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
 [861287,100,300,300,300,300,null,null,null],   // Pikachu ex M2A 44 japonés · chollo
 [861477,193,257,257,257,262,null,null,null]]}; // Pikachu ex M2A 234 japonés
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(()=>{try{const u=JSON.parse(localStorage.getItem('cv_v104_user')||'{}');u.cfg=u.cfg||{};if(u.cfg.minMargin==null){u.cfg.minMargin=0;localStorage.setItem('cv_v104_user',JSON.stringify(u))}}catch{}});/* V139: estas pruebas no miden el margen mínimo */
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,async route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  /* como en el iPhone: cada colección tarda en llegar y la comprobación sigue durante minutos */
  if(m){await new Promise(r=>setTimeout(r,1500));const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#v4Buy [data-cp-chollo] li'),null,{timeout:120000});
 await page.evaluate(()=>{window.__paints=0;new MutationObserver(m=>{if(m.some(r=>r.type==='childList'))window.__paints++}).observe(document.querySelector('[data-rd-live="compra"]'),{childList:true})});
 ok('La comprobación de versiones sigue en marcha (como en el iPhone)',await page.evaluate(()=>window.CVCompra.state().pt&&true));
 // Desplegar «Chollos por verificar»: se cierra si ya estaba abierto, se vuelve a abrir y se coloca arriba de la pantalla
 const sum='#v4Buy [data-cp-chollo] > summary';
 if(await page.evaluate(()=>document.querySelector('#v4Buy [data-cp-chollo]').open))await page.click(sum);
 await page.evaluate(()=>{const el=document.querySelector('#v4Buy [data-cp-chollo]');window.scrollTo(0,el.getBoundingClientRect().top+scrollY-60)});await page.waitForTimeout(300);
 await page.click(sum);
 const y0=await page.evaluate(()=>document.querySelector('#v4Buy [data-cp-chollo]').getBoundingClientRect().top);
 await page.evaluate(()=>{window.__paints=0});await page.waitForTimeout(12000);
 let st=await page.evaluate(()=>({open:document.querySelector('#v4Buy [data-cp-chollo]').open,top:document.querySelector('#v4Buy [data-cp-chollo]').getBoundingClientRect().top,paints:window.__paints}));
 ok('Abierto «🎲 Chollos por verificar» durante 12 s de comprobaciones: sigue abierto',st.open,JSON.stringify(st));
 ok('…y la página no se desplaza (±2 px)',Math.abs(st.top-y0)<=2,JSON.stringify({y0,...st}));
 ok('…y no se repinta cada 2 s (como mucho 2 veces en 12 s)',st.paints<=2,JSON.stringify(st));
 // Cerrarlo: no se vuelve a abrir solo
 await page.click(sum);await page.waitForTimeout(10000);
 ok('Cerrado: sigue cerrado tras los repintados',!(await page.evaluate(()=>document.querySelector('#v4Buy [data-cp-chollo]').open)));
 // Punto de mira: igual
 await page.click('#v4Buy [data-cp-snipe] > summary');const ys=await page.evaluate(()=>document.querySelector('#v4Buy [data-cp-snipe]').getBoundingClientRect().top);await page.waitForTimeout(9000);
 st=await page.evaluate(()=>({open:document.querySelector('#v4Buy [data-cp-snipe]').open,top:document.querySelector('#v4Buy [data-cp-snipe]').getBoundingClientRect().top}));
 ok('«🎯 Punto de mira» abierto: no se cierra ni mueve la página',st.open&&Math.abs(st.top-ys)<=2,JSON.stringify({ys,...st}));
 // Mientras desplazas con el dedo no se repinta nunca
 await page.evaluate(()=>{window.__paints=0});
 for(let i=0;i<14;i++){await page.mouse.wheel(0,i%2?40:-40);await page.waitForTimeout(500)}
 ok('Mientras desplazas (7 s) no se repinta',await page.evaluate(()=>window.__paints)===0,String(await page.evaluate(()=>window.__paints)));
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V132 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
