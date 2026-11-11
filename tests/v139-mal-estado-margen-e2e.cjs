// V139 · «Mal estado» con internacionales (precio objetivo para restaurar) y buscador; CardTrader en cada carta que ves (una
// fila por sitio en «Dónde comprarla»); margen mínimo 25 % para no proponer compras con muy poco margen.
// Chromium con emulación de iPhone. Ejecutar: node tests/v139-mal-estado-margen-e2e.cjs · Datos SIMULADOS; token inventado.
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
 [273933,150,258,258,263,268,null,null,null],   // Mewtwo · internacional
 [273924,60,250,250,250,250,null,null,null],    // Alakazam · internacional · más barato 60 € (cualquier estado e idioma)
 [861477,193,257,257,257,262,null,null,null],   // Pikachu ex M2A 234 · japonés · pagas 199 → +40,15 (20 %): poco margen
 [861287,150,280,280,280,280,null,null,null]]}; // Pikachu ex M2A 44 · japonés · pagas 156 (56 %) → +100,00 (64 %)
const TOK='eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.firma';
const P=(id,cents,lang,user,cc)=>({id,price:{cents,currency:'EUR'},quantity:1,properties_hash:{condition:'Near Mint',pokemon_language:lang},user:{username:user,country_code:cc,can_sell_via_hub:true},graded:false});
const ctHits=[];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(t=>{try{localStorage.setItem('cv_cardtrader_token',t)}catch{}},TOK);
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  if(u.startsWith('https://api.pokemontcg.io/'))return route.fulfill({status:429,headers:H,body:'{}'});
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);ctHits.push(p);
   if(p==='/info')return J({id:1,name:'Card Vault'});
   if(p==='/games')return J([{id:5,name:'Pokemon'}]);
   if(p==='/expansions')return J([{id:11,game_id:5,code:'base4',name:'Base Set 2'},{id:21,game_id:5,code:'m2a',name:'MEGA Dream ex'}]);
   if(p.startsWith('/blueprints/export?expansion_id=11'))return J([{id:900,name:'Mewtwo',fixed_properties:{collector_number:'10'},card_market_ids:[273933]},{id:901,name:'Alakazam',fixed_properties:{collector_number:'1'},card_market_ids:[273924]}]);
   if(p.startsWith('/blueprints/export?expansion_id=21'))return J([{id:950,name:'Pikachu ex',fixed_properties:{collector_number:'234'},card_market_ids:[861477]},{id:951,name:'Pikachu ex',fixed_properties:{collector_number:'44'},card_market_ids:[861287]}]);
   if(p.startsWith('/marketplace/products?blueprint_id=951'))return J({951:[P(5,14000,'jp','taro','JP')]});
   if(p.startsWith('/marketplace/products'))return J({});
   if(p.startsWith('/shipping_methods'))return J([{price:{cents:800,currency:'EUR'}}]);
   return J([])}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 const ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-jp-861287'),null,{timeout:120000});await page.waitForTimeout(600);
 // 1) margen mínimo 25 % por defecto
 ok('Margen mínimo 25 %: fuera Pikachu ex 234 (pagas 199 € para ganar +40,15 €: 20 %)',!(await ids()).includes('jp-861477'),JSON.stringify(await ids()));
 let t=await page.textContent('#v4Buy #cp-jp-861287 .cpDecide');
 // 280·0,95 − 5 − 156 = +105 (67 %)
 ok('Dentro Pikachu ex 44 (Cardmarket 156 € → +105 € o, si CardTrader ya respondió, 148 € → +113 €)',/✅ COMPRA en (Cardmarket|CardTrader) · JAPONÉS/.test(t)&&(/Pagas 156,00\s€[^]*ganas \+105,00\s€/.test(t)||/Pagas 148,00\s€[^]*ganas \+113,00\s€/.test(t)),t);
 t=await page.textContent('#v4Buy #cp-base4-1 .cpDecide');
 // neta 250·0,95 − 5 = 232,50 → ≤ 232,50/1,25 = 186 € con envío (deja ≥ 25 %) → 180 € la carta → ganas ≥ 46,50 €
 ok('Precio objetivo con margen: cómprala en inglés por ≤ 180 € (≤ 186 € con envío) → ganas ≥ 46,50 € (25 %)',/≤ 180,00\s€/.test(t)&&/≤ 186,00\s€ con envío/.test(t)&&/ganas ≥ 46,50\s€/.test(t),t);
 await page.evaluate(()=>{document.querySelectorAll('#v4Buy details.v4settings').forEach(d=>d.open=true)});
 ok('Ajuste «Margen mínimo %» en Supuestos (25 por defecto)',await page.inputValue('#v4Buy [data-v4-cfg="minMargin"]')==='25');
 // 2) CardTrader: cada carta en pantalla se consulta sola; una fila por sitio
 await page.waitForFunction(()=>/CardTrader · Japonés/.test(document.querySelector('#v4Buy #cp-jp-861287 .cpBuy')?.textContent||''),null,{timeout:90000});
 t=await page.textContent('#v4Buy #cp-jp-861287 .cpBuy');
 const sites=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-jp-861287 .cpBuy tbody th')].map(th=>th.textContent.replace(' ↗','').trim()));
 ok('«Dónde comprarla»: una fila por sitio (Cardmarket y CardTrader), no dos de Cardmarket',sites.filter(x=>/^Cardmarket/.test(x)).length===1&&sites.some(x=>/^CardTrader/.test(x)),JSON.stringify(sites));
 ok('Pasa a ✅ COMPRA en CardTrader · JAPONÉS: pagas 148 € → ganas +113 € (la más barata)',/✅ COMPRA en CardTrader · JAPONÉS/.test(await page.textContent('#v4Buy #cp-jp-861287 .cpDecide')));
 ok('CardTrader japonés con su envío real (140 + 8 = 148 €), consultado solo al verla en pantalla',/CardTrader · Japonés Near Mint ↗148,00\s€/.test(t)&&ctHits.some(h=>h.includes('blueprint_id=951')),t.slice(0,500));
 t=await page.textContent('#v4Buy #cp-base4-1 .cpBuy');
 ok('Si CardTrader no la tiene en inglés, lo dice en su fila',/CardTrader ↗—\s*no tiene ninguna en inglés NM\/EX a la venta ahora/.test(t),t.slice(0,500));
 // 3) Mal estado: internacionales con precio objetivo, buscador
 await page.selectOption('[data-cp-view="cond"]','mal');await page.waitForTimeout(600);
 ok('«Mal estado»: salen internacionales (no solo japonesas)',(await ids()).includes('base4-1'),JSON.stringify(await ids()));
 t=await page.textContent('#v4Buy #cp-base4-1 .cpDecide');
 // restaurada 250·0,6 = 150 → neta 137,50 → ≤ min(137,50 − 40 = 97,50; 137,50/1,25 = 110) = 97,50 con envío → 91,50 € la carta (37 %)
 ok('«🔧 BUSCA EN INGLÉS EN MAL ESTADO · cómprala ≤ 91,50 € → restaurada la vendes a ~150 € → ganas ≥ 40 €»',/🔧 BUSCA EN INGLÉS EN MAL ESTADO/.test(t)&&/≤ 91,50\s€/.test(t)&&/restaurada la vendes a ~150,00\s€/.test(t)&&/ganas ≥ 40,00\s€/.test(t),t);
 ok('…con enlace solo en inglés y sin filtro de estado',await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-base4-1 .cpDecide a')].some(a=>a.href==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=273924&language=1')));
 await page.click('[data-cp-q]');await page.keyboard.type('alakazam',{delay:80});await page.waitForTimeout(1200);
 ok('Buscador en «Mal estado»: «alakazam» encuentra la carta, con su línea de qué hacer',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid)))==='["base4-1"]'&&/BUSCA EN INGLÉS EN MAL ESTADO/.test(await page.textContent('#v4Buy #cp-base4-1')));
 ok('El texto escrito no se pierde mientras buscas',await page.inputValue('[data-cp-q]')==='alakazam');
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V139 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
