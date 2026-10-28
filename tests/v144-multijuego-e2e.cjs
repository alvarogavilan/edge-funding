// V144 · Más juegos con la MISMA calidad que Pokémon (precio y ventas reales de Cardmarket vía Bindex): Magic y One Piece,
// y «Ventas mínimas» (por defecto: se vende cada semana). Ejecutar: node tests/v144-multijuego-e2e.cjs
// Datos SIMULADOS; token inventado.
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
const GUIDE={fields:F,sourceCreatedAt:'2026-10-28T02:45:46+0200',generatedAt:'2026-10-28T08:30:52Z',rows:[[273924,60,250,250,250,250,null,null,null]]};
const e=(t,l,o={})=>({trend:t,low:l,avg30:t,avg7:t,avg1:t,...o});
const BXD={
 'lorcana/sets.json':{sets:[]},
 'mtg/sets.json':{sets:[{id:'mh2',name:'Modern Horizons 2',releaseDate:'2021/06/18',setValueUsd:9000},{id:'lea',name:'Limited Edition Alpha',releaseDate:'1993/08/05',setValueUsd:900000}]},
 'mtg/sets/mh2.json':{updatedAt:'2026-10-28',cards:[
  {id:'mh2-138',name:'Ragavan, Nimble Pilferer',number:'138',rarity:'Mythic',imageSmall:'https://images.example/r.png',cardmarketId:555001,variants:[{name:'nonfoil',eur:e(150,60)},{name:'foil',eur:e(260,150)}]},
  {id:'mh2-200',name:'Slow Seller',number:'200',rarity:'Rare',imageSmall:'https://images.example/s.png',cardmarketId:555002,variants:[{name:'nonfoil',eur:{trend:150,low:60,avg30:150}}]},// solo 1 venta en 30 días
  {id:'mh2-201',name:'Bulk Rare',number:'201',rarity:'Rare',cardmarketId:555003,variants:[{name:'nonfoil',eur:e(3,1)}]}]},// < 15 €: no se guarda
 'mtg/sets/lea.json':{updatedAt:'2026-10-28',cards:[]},
 'mtg/history/mh2.json':{updatedAt:'2026-10-28',points:{'mh2-138|nonfoil':[['2026-10-01',null,140],['2026-10-28',null,150]]}},
 'onepiece/sets.json':{sets:[{id:'op05',name:'Awakening of the New Era',releaseDate:'2023/12/08',setValueUsd:5000}]},
 'onepiece/sets/op05.json':{updatedAt:'2026-10-28',cards:[{id:'OP05-119',name:'Monkey.D.Luffy',number:'OP05-119',rarity:'SEC',imageSmall:'https://images.example/l.png',cardmarketId:777001,variants:[{name:'normal',eur:e(250,120)}]}]}};
const TOK='eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.firma';
const P=(id,cents,foil)=>({id,price:{cents,currency:'EUR'},quantity:1,properties_hash:{condition:'Near Mint',mtg_language:'en',mtg_foil:foil},user:{username:'u'+id,country_code:'DE'},graded:false});
const calls=[];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(t=>{try{localStorage.setItem('cv_cardtrader_token',t)}catch{}},TOK);
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/'))return J({rates:{EUR:0.9},date:'2026-10-28'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const b=u.match(/\/bindex-prices\/v1\/(.+)$/);if(b){calls.push('bx '+b[1]);return BXD[b[1]]?J(BXD[b[1]]):route.fulfill({status:404,headers:H,body:'404'})}
  if(u.startsWith('https://api.pokemontcg.io/'))return route.fulfill({status:429,headers:H,body:'{}'});
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);calls.push('ct '+p);
   if(p==='/info')return J({id:1,name:'Card Vault'});
   if(p==='/games')return J([{id:5,name:'Pokemon'},{id:18,name:'Disney Lorcana'},{id:1,name:'Magic: The Gathering'},{id:15,name:'One Piece Card Game'}]);
   if(p==='/expansions')return J([{id:61,game_id:1,code:'mh2',name:'Modern Horizons 2'}]);
   if(p.startsWith('/blueprints/export?expansion_id=61'))return J([{id:6001,name:'Ragavan, Nimble Pilferer',card_market_ids:[555001]}]);
   if(/^\/marketplace\/products\?(expansion_id=61|blueprint_id=6001)/.test(p))return J({6001:[P(1,5000,true),P(2,7000,false)]});// foil a 50 € (no cuenta para la normal) y normal a 70 €
   if(p.startsWith('/shipping_methods'))return J([{price:{cents:500,currency:'EUR'}}]);
   if(p.startsWith('/marketplace/products'))return J({});
   return J([])}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-bx-mtg-mh2-138')&&document.querySelector('#v4Buy #cp-bx-onepiece-OP05-119'),null,{timeout:120000});
 const opts=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy [data-cp-view="game"] option')].map(o=>o.textContent).join(', '));
 ok('Juegos: Pokémon, Lorcana, Magic y One Piece',/Magic/.test(opts)&&/One Piece/.test(opts)&&/Lorcana/.test(opts),opts);
 // 1) Magic
 let t=await page.textContent('#v4Buy #cp-bx-mtg-mh2-138');
 ok('Magic: Ragavan con su etiqueta «Magic»',/Magic/.test(t)&&/Ragavan/.test(t));
 const href=await page.evaluate(()=>document.querySelector('#v4Buy #cp-bx-mtg-mh2-138 .v4actions a').href);
 ok('…enlace a la ficha de Cardmarket de Magic',/cardmarket\.com\/es\/Magic\/Products\?idProduct=555001/.test(href),href);
 await page.waitForFunction(()=>/✅ COMPRA en CardTrader/.test(document.querySelector('#v4Buy #cp-bx-mtg-mh2-138 .cpDecide')?.textContent||''),null,{timeout:120000});
 t=await page.textContent('#v4Buy #cp-bx-mtg-mh2-138 .cpDecide');
 // normal a 70 € + 5 = 75 → 150·0,95 − 5 − 75 = +62,50 (la foil de 50 € no cuenta para la normal)
 ok('Magic con CardTrader: «✅ COMPRA · INGLÉS · pagas 75 € → +62,50 €» (normal; la foil de 50 € no cuenta)',/INGLÉS/.test(t)&&/Pagas 75,00\s€/.test(t)&&/ganas \+62,50\s€/.test(t),t);
 ok('Magic foil aparte (vale 260 €): «Ragavan, Nimble Pilferer (foil)»',!!(await page.$('[id="cp-bx-mtg-mh2-138~foil"]'))&&/\(foil\)/.test(await page.textContent('[id="cp-bx-mtg-mh2-138~foil"] h3')));
 ok('Las cartas de menos de 15 € de Magic no se cargan (no pueden dejar beneficio)',!(await page.evaluate(()=>window.CVCompra.cardsLo().some(x=>x.id==='bx-mtg-mh2-201'))));
 // 2) Ventas mínimas
 const sl=await page.evaluate(()=>{const C=window.CVCompra,L=C.list(),x=C.cardsLo().find(x=>x.id==='bx-mtg-mh2-200');return {loaded:!!x,liq:x&&x.liq.k,sure:L.sure.some(x=>x.id==='bx-mtg-mh2-200'),top:C.top5(C.cfg()).some(t=>t.x&&t.x.id==='bx-mtg-mh2-200'),dom:!!document.querySelector('#v4Buy #cp-bx-mtg-mh2-200')}});
 ok('«Ventas mínimas: cada semana»: una carta con una sola venta en 30 días NO se recomienda (ni en la lista ni en el Top 5)',sl.loaded&&sl.liq===1&&!sl.sure&&!sl.top&&!sl.dom,JSON.stringify(sl));
 ok('Ajuste «Ventas mínimas (1, 2 o 3)» en Supuestos',!!(await page.$('[data-v4-cfg="minLiq"]')));
 // 3) One Piece
 t=await page.textContent('#v4Buy #cp-bx-onepiece-OP05-119 .cpDecide');
 ok('One Piece: Luffy OP05-119 «🔎 BUSCA EN INGLÉS» con su precio máximo',/BUSCA EN INGLÉS/.test(t)&&/250,00\s€/.test(t),t);
 ok('…enlace a Cardmarket One Piece solo en inglés',await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-bx-onepiece-OP05-119 .cpDecide a')].some(a=>/cardmarket\.com\/es\/OnePiece\/Products\?idProduct=777001&language=1/.test(a.href))));
 // 4) filtro por juego
 await page.selectOption('[data-cp-view="game"]','mtg');await page.waitForTimeout(500);
 const ids=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 ok('Juego «Magic»: solo cartas de Magic',ids.length>0&&ids.every(i=>i.startsWith('bx-mtg-')),ids.join(','));
 // 5) historial y vídeos de Magic
 await page.evaluate(()=>{const d=document.querySelector('#v4Buy #cp-bx-mtg-mh2-138 [data-cp-histload]').closest('details');if(d)d.open=true});
 await page.click('#v4Buy #cp-bx-mtg-mh2-138 [data-cp-histload]');await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-bx-mtg-mh2-138 .cpHist svg'),null,{timeout:30000});
 ok('Historial de precio de Magic (Bindex): 140 € → 150 €',/140,00\s€ → 150,00\s€/.test(await page.textContent('#v4Buy #cp-bx-mtg-mh2-138 .cpHist')));
 ok('Vídeos de Magic: búsqueda «… magic the gathering real vs fake»',await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-bx-mtg-mh2-138 a[href*="youtube"]')].some(a=>/magic the gathering real vs fake/.test(decodeURIComponent(a.href).replace(/\+/g,' ')))));
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V144 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
