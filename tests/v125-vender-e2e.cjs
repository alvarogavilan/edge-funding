// V125 · TCGplayer con todos los costes hasta 41020 y enlace, «Dónde vender» (Cardmarket, CardTrader, Vinted, Wallapop,
// Catawiki) y graduadas reales en CardTrader con token. Chromium con emulación de iPhone; no es Safari real.
// Ejecutar: node tests/v125-vender-e2e.cjs · CardTrader, pokemontcg.io y el BCE se SIMULAN con su formato público.
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
 [273933,90,160,160,165,170,null,null,null],   // base4-10 Mewtwo (verificada, EX+ 95 €)
 [273924,30,200,200,205,210,null,null,null],   // base4-1 Alakazam · vale ~200 € y hay un anuncio a 30 € → punto de mira
 [574435,560,900,null,null,null,null,null,null],// Evolving Skies Booster Box · «desde» 62 % de su tendencia
 [583510,150,290,null,null,null,null,null,null],// Brilliant Stars ETB
 [271439,250,270,null,null,null,null,null,null],// Phantom Forces Booster
 [861477,195,260,260,260,265,null,null,null],   // Pikachu ex M2A 234 · producto japonés (venta de referencia 190 €)
 [861287,0.5,0.75,null,0.8,0.7,null,null,null]]};// Pikachu ex M2A 44 · japonés barato
const PREV={...GUIDE,sourceCreatedAt:'2026-10-23T02:45:00+0200',rows:[[273933,90,160,160,165,170,null,null,null],[273924,120,200,200,205,210,null,null,null],[574435,560,880,null,null,null,null,null,null],[583510,150,290,null,null,null,null,null,null],[271439,250,262,null,null,null,null,null,null]]};
const OLD={...GUIDE,sourceCreatedAt:'2026-10-11T02:45:00+0200',rows:[[574435,600,850,null,null,null,null,null,null],[583510,150,280,null,null,null,null,null,null],[271439,240,220,null,null,null,null,null,null]]};
const LOR={sets:[{id:'tfc',name:'The First Chapter'}]},LORSET={updatedAt:'2026-10-24',cards:[{id:'tfc-1',name:'Mickey Mouse - Brave Little Tailor',number:'1',rarity:'Legendary',imageSmall:'https://images.example/m.png',cardmarketId:681001,variants:[{name:'normal',eur:{trend:60,low:55,avg30:62,avg7:61,avg1:60}}]}]};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});const ct=[];
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]);const data=s==='base4'?[
    {id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:158,avg30:168,lowPrice:90,lowPriceExPlus:95}},tcgplayer:{url:'https://prices.pokemontcg.io/tcgplayer/base4-10',updatedAt:'2026/10/24',prices:{holofoil:{low:40,mid:60,market:50}}}},
    {id:'base4-1',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:200,avg30:210,lowPrice:30}},tcgplayer:{url:'https://prices.pokemontcg.io/tcgplayer/base4-1',prices:{holofoil:{low:150,market:180}}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);ct.push(p+' '+route.request().headers()['authorization']);
   if(p==='/games')return J([{id:5,name:'Pokemon'}]);
   if(p==='/expansions')return J([{id:11,game_id:5,name:'Base Set 2'}]);
   if(p.startsWith('/blueprints/export?expansion_id=11'))return J([{id:900,name:'Mewtwo',fixed_properties:{collector_number:'10'}},{id:901,name:'Alakazam',fixed_properties:{collector_number:'1'}}]);
   if(p.startsWith('/marketplace/products?blueprint_id=900'))return J({900:[
    {price_cents:15000,properties_hash:{condition:'Near Mint',pokemon_language:'en'},user:{country_code:'IT'}},
    {price_cents:17000,properties_hash:{condition:'Near Mint',pokemon_language:'en'},user:{country_code:'DE'}},
    {price_cents:12000,properties_hash:{condition:'Near Mint',pokemon_language:'it'},user:{country_code:'IT'}},
    {price_cents:24000,graded:true,properties_hash:{condition:'Near Mint',pokemon_language:'en',grading_company:'PSA',grade:'9'},user:{country_code:'FR'}},
    {price_cents:41000,graded:true,properties_hash:{pokemon_language:'en',grading_company:'BGS',grade:'9.5'},user:{country_code:'ES'}}]});
   return route.fulfill({status:404,body:''})}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/Comprar en TCGplayer/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||''),null,{timeout:120000});
 // TCGplayer Mewtwo: mercado $50 · 0,90 = 45 € · (45 + 15) · 1,21 + 15 = 87,60 € → venta 160 € → 160·0,95 − 5 − 87,60 = +59,40
 let t=await page.textContent('#v4Buy #cp-base4-10 .cpOps');
 ok('TCGplayer: mercado $50 ≈ 45 € → puesto en 41020 con envío, IVA y gestión 87,60 € → venta 160 € → +59,40 €',/TCGplayer \(EE\. UU\.\) · mercado \$50,00 ≈ 45,00\s€/.test(t)&&/87,60\s€/.test(t)&&/\+59,40\s€/.test(t),t.slice(0,600));
 ok('Enlace directo a la carta en TCGplayer',await page.getAttribute('#v4Buy #cp-base4-10 .v4actions a[href*="tcgplayer"]','href')==='https://prices.pokemontcg.io/tcgplayer/base4-10');
 // Alakazam: $180·0,9 = 162 → (162+15)·1,21+15 = 229,17 → 200·0,95−5−229,17 = −44,17 → no compensa (y su «desde» de Cardmarket da más)
 // Token de CardTrader en la app (se guarda solo en este navegador)
 await page.evaluate(()=>document.querySelector('.cpBox details.v4settings').open=true);await page.fill('[data-cp-cttoken]','token-de-prueba');await page.click('[data-cp-ctsave]');await page.waitForTimeout(300);
 ok('El token no aparece en la página (campo de contraseña)',await page.getAttribute('[data-cp-cttoken]','type')==='password');
 // Vender YA · dónde vender
 await page.evaluate(()=>{const s=window.CVStateBridge.get();s.cards.push({id:'t-mew',universe:'pokemon',name:'Mewtwo',set:'Base Set 2',number:'10/130',grading:'RAW',language:'Inglés',purchase:100,quantity:1,catalogId:'base4-10'});return window.CVStateBridge.save()});
 await page.click('.mainNav [data-tab="vender"]');await page.waitForSelector('#cpSell [data-sell="t-mew"] .cpWhere',{timeout:60000});
 await page.evaluate(()=>{document.querySelector('#cpSell [data-sell="t-mew"] .cpWhere').open=true});
 t=await page.textContent('#cpSell [data-sell="t-mew"] .cpWhere');
 // precio 160 (tendencia, estable): Cardmarket 160·0,95−5 = 147 · CardTrader 5 % = 147 · Zero 7 % = 143,80 · Vinted 0 % = 155 · Wallapop 0 % = 155 · Catawiki 12,5 % = 135
 ok('Dónde vender: Cardmarket 147 €, CardTrader 147 €/143,80 €, Vinted 155 €, Catawiki 135 € y mejor Vinted',/Cardmarket ↗160,00\s€147,00\s€/.test(t)&&/CardTrader Zero ↗160,00\s€143,80\s€/.test(t)&&/Vinted ↗160,00\s€155,00\s€/.test(t)&&/Catawiki \(subasta\) ↗160,00\s€135,00\s€/.test(t)&&/mejor: Vinted → te quedan 155,00\s€/.test(t),t.slice(0,700));
 ok('Comisiones sin confirmar marcadas (Wallapop y Catawiki)',/Wallapop.*comisión sin confirmar/.test(t)&&/Catawiki.*comisión sin confirmar/.test(t));
 await page.click('#cpSell [data-sell-ct="t-mew"]');await page.waitForFunction(()=>/igualas al más barato/.test(document.querySelector('#cpSell [data-sell="t-mew"] .cpWhere')?.textContent||''),null,{timeout:20000});
 t=await page.textContent('#cpSell [data-sell="t-mew"] .cpWhere');
 // CardTrader en inglés: el más barato NM 150 € → 150·0,95−5 = 137,50
 ok('Precio en CardTrader ahora (inglés, el más barato 150 €) → te quedan 137,50 € y sigue abierto el desplegable',/CardTrader · venta directa ↗150,00\s€137,50\s€/.test(t)&&await page.evaluate(()=>document.querySelector('#cpSell [data-sell="t-mew"] .cpWhere').open),t.slice(0,500));
 ok('CardTrader recibe el token como «Bearer»',ct.some(x=>/marketplace\/products\?blueprint_id=900 Bearer token-de-prueba/.test(x)),JSON.stringify(ct));
 await page.fill('[data-sell-fee="wallapop"]','10');await page.dispatchEvent('[data-sell-fee="wallapop"]','change');await page.waitForTimeout(400);
 await page.evaluate(()=>{document.querySelector('#cpSell [data-sell="t-mew"] .cpWhere').open=true});
 ok('Comisión de Wallapop editable: 10 % → 160·0,90−5 = 139 €',/Wallapop ↗160,00\s€139,00\s€/.test(await page.textContent('#cpSell [data-sell="t-mew"] .cpWhere')));
 // Graduadas reales en CardTrader
 await page.click('.mainNav [data-tab="pregrade"]');await page.waitForSelector('#cpGraded [data-gr-q]',{timeout:30000});
 await page.fill('#cpGraded [data-gr-q]','mewtwo base');await page.waitForSelector('[data-gr-pick="base4-10"]');await page.click('[data-gr-pick="base4-10"]');
 await page.click('[data-gr-ct]');await page.waitForFunction(()=>/Graduadas en CardTrader ahora/.test(document.querySelector('#cpGraded')?.textContent||'')&&document.querySelector('[data-gr-use]'),null,{timeout:20000});
 t=await page.textContent('#cpGraded');
 ok('Graduadas en CardTrader: PSA 9 a 240 € (FR) y BGS 9,5 a 410 € (ES), ordenadas, sin las no graduadas',/240,00\s€ · vendedor FR/.test(t)&&/grading company: PSA · grade: 9/.test(t)&&/410,00\s€ · vendedor ES/.test(t)&&!/150,00\s€ · vendedor IT/.test(t)&&t.indexOf('240,00')<t.indexOf('410,00'),t.slice(t.indexOf('Graduadas en CardTrader'),t.indexOf('Graduadas en CardTrader')+400));
 await page.click('[data-gr-use="240"]');
 ok('«Analizar» pasa el precio y la tienda CardTrader al comparador',await page.inputValue('[data-gr="price"]')==='240'&&await page.inputValue('[data-gr="store"]')==='CardTrader');
 ok('El token no se ha guardado en el código: solo en este navegador',!(await (await page.request.get(base+'cv-compra.js')).text()).includes('token-de-prueba'));
 for(const tab of ['vender','pregrade','radar']){await page.click('.mainNav [data-tab="'+tab+'"]');await page.setViewportSize({width:320,height:800});await page.waitForTimeout(300);
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Sin desbordamiento horizontal a 320 px · '+tab,o.sw<=o.iw,JSON.stringify(o))}
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V125 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
