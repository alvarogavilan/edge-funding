// V131 · Mismo idioma: el Top 5 enseñaba un Umbreon a 135 € que era COREANO con un beneficio enorme calculado con ventas de
// todos los idiomas. Ahora un «desde» internacional por debajo del 75 % de su valor (idioma sin indicar) no da beneficio, y
// con CardTrader se compra en INGLÉS. Chromium con emulación de iPhone; no es Safari real. node tests/v131-idioma-e2e.cjs
// Sin Internet: guía, pokemontcg.io y CardTrader SIMULADOS con su formato público. PRECIOS INVENTADOS.
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
 [273933,150,258,258,263,268,null,null,null],   // Mewtwo · EX o mejor 194 € (75 %) → compra con idioma probable
 [273924,120,450,450,455,460,null,null,null],   // «Alakazam» como el Umbreon: vale ~450 € y su EX o mejor es 135 € (30 %) → COREANO
 [861287,100,300,300,300,300,null,null,null]]};// Pikachu ex M2A 44 japonés · 100 € → chollo con idioma seguro (japonés)
let ctHits=[];
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
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}},{id:'base4-1',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:449,avg30:459,lowPrice:120,lowPriceExPlus:135}}}]:[];return J({data,totalCount:data.length})}
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);ctHits.push(p);
   if(p==='/info')return J({id:1,name:'Card Vault'});
   if(p==='/games')return J([{id:5,name:'Pokemon'}]);
   if(p==='/expansions')return J([{id:11,game_id:5,name:'Base Set 2'}]);
   if(p.startsWith('/blueprints/export?expansion_id=11'))return J([{id:900,name:'Mewtwo',fixed_properties:{collector_number:'10'}},{id:901,name:'Alakazam',fixed_properties:{collector_number:'1'}}]);
   if(p.startsWith('/marketplace/products?blueprint_id=901'))return J({901:[
    {price_cents:13500,properties_hash:{condition:'Near Mint',pokemon_language:'kr'},user:{country_code:'DE'}},   // el «coreano» de 135 €
    {price_cents:16000,properties_hash:{condition:'Near Mint',pokemon_language:'en'},user:{country_code:'IT'}},   // inglés NM 160 €
    {price_cents:9000,properties_hash:{condition:'Heavily Played',pokemon_language:'en'},user:{country_code:'FR'}}]});
   if(p.startsWith('/marketplace/products'))return J({});
   return route.fulfill({status:404,headers:H,body:'{}'})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // 1) Sin CardTrader: solo la guía (idioma desconocido en las internacionales)
 await page.goto(base);
 await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||'')&&window.CVCompra.state().pt.cards['base4-1'],null,{timeout:120000});
 await page.waitForTimeout(800);
 const ops1=await page.evaluate(()=>window.CVCompra.cardsPk().find(c=>c.id==='base4-1').ops.map(o=>o.k));
 let top=await page.textContent('#v4Buy .cpTop');
 ok('Caso Umbreon: EX o mejor a 135 € de una carta de ~450 € (30 %, idioma sin indicar) → sin beneficio calculado y fuera del Top 5',!ops1.includes('ex')&&!ops1.includes('po')&&!/Alakazam/.test(top),JSON.stringify(ops1)+' '+top);
 ok('Top 5: Mewtwo (EX o mejor 194 € = 75 %) y la japonesa (mismo idioma seguro)',/Mewtwo/.test(top)&&/Pikachu ex/.test(top)&&/Solo con compra y venta del mismo idioma/.test(top),top);
 const ch=await page.textContent('#v4Buy [data-cp-chollo]');
 ok('Chollos: solo japonesas; la internacional se cuenta como descartada por idioma',/Pikachu ex/.test(ch)&&!/Alakazam/.test(ch)&&/1 internacional descartada/.test(ch),ch.slice(-600));
 ok('Sin botón «Es proxy o falsa»',!(await page.$('[data-cp-bad]')));
 // 2) Con token de CardTrader: comprueba solo las candidatas y usa el anuncio en INGLÉS (no el coreano)
 await page.evaluate(()=>localStorage.setItem('cv_cardtrader_token','prueba'));
 await page.reload();
 await page.waitForFunction(()=>/CardTrader, inglés/.test(document.querySelector('#v4Buy .cpTop')?.textContent||''),null,{timeout:120000});
 top=await page.textContent('#v4Buy .cpTop');
 // 450·0,95 − 5 − (160 + 6) = +256,50
 ok('CardTrader: compra en INGLÉS NM a 160 € (no el coreano de 135 €) → Top 5 con +256,50 € y enlace a CardTrader',/Alakazam[^]*Pagas 166,00\s€ \(CardTrader, inglés NM\/EX, puesta en 41020\) → venta 450,00\s€ → \+256,50\s€/.test(top)&&await page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpTop li a')].some(a=>a.href==='https://www.cardtrader.com/cards/901')),top);
 ok('Solo consulta CardTrader para las candidatas (no carta a carta)',ctHits.filter(p=>p.startsWith('/marketplace')).length<=12,JSON.stringify(ctHits));
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V131 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
