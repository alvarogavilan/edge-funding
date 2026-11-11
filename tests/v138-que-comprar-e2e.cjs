// V138 · «Con todos los idiomas solo salen japonesas»: las internacionales salen siempre, aunque pokemontcg.io no responda,
// con «🔎 BUSCA EN INGLÉS» y el precio máximo; con CardTrader se convierten en compra confirmada. Cada carta dice claro
// qué comprar, en qué idioma, dónde, cuánto pagas, a cuánto la vendes y cuánto ganas. Chromium con emulación de iPhone.
// Ejecutar: node tests/v138-que-comprar-e2e.cjs · Datos SIMULADOS; token de prueba inventado.
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
 [273924,90,250,250,250,250,null,null,null],    // Alakazam · internacional · anuncio más barato 90 € (idioma sin indicar)
 [861477,193,257,257,257,262,null,null,null]]}; // Pikachu ex M2A 234 · japonés
const TOK='eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.firma';
const P=(id,cents,lang,user,cc)=>({id,price:{cents,currency:'EUR'},quantity:1,properties_hash:{condition:'Near Mint',pokemon_language:lang},user:{username:user,country_code:cc,can_sell_via_hub:true},graded:false});
async function setup(withCT){
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 if(withCT)await ctx.addInitScript(t=>{try{localStorage.setItem('cv_cardtrader_token',t)}catch{}},TOK);
 await ctx.addInitScript(()=>{try{const u=JSON.parse(localStorage.getItem('cv_v104_user')||'{}');u.cfg=u.cfg||{};if(u.cfg.minMargin==null){u.cfg.minMargin=0;localStorage.setItem('cv_v104_user',JSON.stringify(u))}}catch{}});/* V139: estas pruebas no miden el margen mínimo */
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  if(u.startsWith('https://api.pokemontcg.io/'))return route.fulfill({status:429,headers:H,body:'{}'});// pokemontcg.io sin respuesta (tope diario o caído), como en el iPhone
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);
   if(p==='/info')return J({id:1,name:'Card Vault'});
   if(p==='/games')return J([{id:5,name:'Pokemon'}]);
   if(p==='/expansions')return J([{id:11,game_id:5,code:'base4',name:'Base Set 2'}]);
   if(p.startsWith('/blueprints/export?expansion_id=11'))return J([{id:900,name:'Mewtwo',fixed_properties:{collector_number:'10'},card_market_ids:[273933]},{id:901,name:'Alakazam',fixed_properties:{collector_number:'1'},card_market_ids:[273924]}]);
   if(p==='/marketplace/products?blueprint_id=901&language=en')return J({901:[P(1,15000,'en','mario','IT')]});
   if(p==='/marketplace/products?blueprint_id=901')return J({901:[P(2,9000,'kr','kim','KR'),P(1,15000,'en','mario','IT')]});
   if(p.startsWith('/shipping_methods?username=mario'))return J([{price:{cents:500,currency:'EUR'}}]);
   if(p.startsWith('/marketplace/products'))return J({});
   return J([])}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));return {browser,page,errors};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 let {browser,page,errors}=await setup(false);
 await page.goto(base);
 const ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-base4-1')&&document.querySelector('#v4Buy #cp-jp-861477'),null,{timeout:120000});await page.waitForTimeout(600);
 ok('Sin pokemontcg.io (tope diario o caído): «Todos los idiomas» enseña internacionales Y japonesas',(await ids()).includes('base4-1')&&(await ids()).includes('base4-10')&&(await ids()).includes('jp-861477'),JSON.stringify(await ids()));
 let t=await page.textContent('#v4Buy #cp-jp-861477 .cpDecide');
 // 257·0,95 − 5 − (193 + 6) = +40,15
 ok('Japonesa: «✅ COMPRA en Cardmarket · JAPONÉS · pagas 199 € → la vendes a 257 € → ganas +40,15 €»',/✅ COMPRA en Cardmarket · JAPONÉS · estado sin indicar/.test(t)&&/Pagas 199,00\s€ \(carta 193,00\s€ \+ envío\) → la vendes en Cardmarket a 257,00\s€ \(ventas de japonesas\) → ganas \+40,15\s€/.test(t),t);
 t=await page.textContent('#v4Buy #cp-base4-1 .cpDecide');
 // 250·0,95 − 40 − 5 = 192,50 € con envío → 186,50 € la carta (75 % de 250)
 ok('Internacional: «🔎 BUSCA EN INGLÉS · cómprala solo si la encuentras a ≤ 186,50 € (75 %) → la vendes a 250 € → ganas ≥ 40 €»',/🔎 BUSCA EN INGLÉS · cómprala solo si la encuentras a ≤ 186,50\s€ \(75 % de su valor; ≤ 192,50\s€ con envío\) → la vendes en Cardmarket a 250,00\s€ → ganas ≥ 40,00\s€/.test(t)&&/anuncio más barato \(90,00\s€\) no dice el idioma: puede ser coreano o chino/.test(t),t);
 ok('…con el enlace a Cardmarket solo en inglés y EX o mejor',await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-base4-1 .cpDecide a')].some(a=>a.href==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=273924&language=1&minCondition=3')));
 ok('Las compras confirmadas van antes que los precios objetivo',(await ids()).indexOf('jp-861477')<(await ids()).indexOf('base4-1'),JSON.stringify(await ids()));
 t=await page.textContent('#v4Buy .cpLangNote');
 ok('Aviso de idiomas claro: compras en japonés y precios objetivo en inglés',/✅ 1 compra\(s\) en japonés/.test(t)&&/🔎 \d+ internacional\(es\) con precio objetivo en inglés/.test(t),t);
 t=await page.textContent('#v4Buy .cpTop');
 ok('Top 5 con el idioma de cada compra',/Pikachu ex · MEGA Dream ex \(japonés\) nº 234 · JAPONÉS/.test(t),t.slice(0,300));
 ok('Ninguna carta de 885 € con «paga ≤ 194 €» (objetivo irreal): solo objetivos ≥ 60 % de su valor',await page.evaluate(()=>window.CVCompra.list().sure.filter(x=>x.tgtOnly).every(x=>x.tgt.maxBuy>=x.tgt.S*.6)));
 ok('Sin errores de JavaScript (1)',!errors.length,errors.join(' | '));
 await browser.close();
 // Con CardTrader: encuentra la inglesa por debajo del objetivo → COMPRA confirmada con lo que pagas de verdad
 ({browser,page,errors}=await setup(true));
 await page.goto(base);
 await page.waitForFunction(()=>/✅ COMPRA en CardTrader/.test(document.querySelector('#v4Buy #cp-base4-1 .cpDecide')?.textContent||''),null,{timeout:150000});
 t=await page.textContent('#v4Buy #cp-base4-1 .cpDecide');
 // 150 + 5 (envío real) = 155 → 250·0,95 − 5 − 155 = +77,50
 ok('Con CardTrader: «✅ COMPRA en CardTrader · INGLÉS · NM/EX: pagas 155 € → la vendes a 250 € → ganas +77,50 €» (no la coreana de 90 €)',/✅ COMPRA en CardTrader · INGLÉS · NM\/EX/.test(t)&&/Pagas 155,00\s€ \(carta 150,00\s€ \+ envío\) → la vendes en Cardmarket a 250,00\s€ → ganas \+77,50\s€/.test(t),t);
 t=await page.textContent('#v4Buy .cpTop');
 ok('…y entra en el Top 5 como INGLÉS',/Alakazam · Base Set 2 nº 1\/130 · INGLÉS/.test(t),t.slice(0,400));
 ok('Sin errores de JavaScript (2)',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V138 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
