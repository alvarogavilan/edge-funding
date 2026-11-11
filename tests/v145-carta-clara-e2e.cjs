// V145 · Carta clara: las cajas de dinero dicen lo mismo que la línea de decisión (pagas / precio máximo, vendes, ganas),
// «Dónde comprarla» separa lo comparable de lo que es solo referencia, sin la fila «Todos (guía)»; Gundam y Riftbound.
// Ejecutar: node tests/v145-carta-clara-e2e.cjs · Datos SIMULADOS.
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
// Alakazam internacional: anuncio más barato 29 € (cualquier idioma y estado), vale 164,75 € (caso de la captura)
const GUIDE={fields:F,sourceCreatedAt:'2026-10-28T02:45:46+0200',generatedAt:'2026-10-28T08:30:52Z',rows:[[273924,29,164.75,164.75,164.75,164.75,null,null,null]]};
const e=(t,l)=>({trend:t,low:l,avg30:t,avg7:t,avg1:t});
const BXD={'lorcana/sets.json':{sets:[]},'mtg/sets.json':{sets:[]},'onepiece/sets.json':{sets:[]},
 'gundam/sets.json':{sets:[{id:'gd01',name:'Newtype Rising',releaseDate:'2025/07/11',setValueUsd:3000}]},
 'gundam/sets/gd01.json':{updatedAt:'2026-10-28',cards:[{id:'GD01-001',name:'Gundam',number:'GD01-001',rarity:'LR',cardmarketId:880001,variants:[{name:'normal',eur:e(250,150)}]}]},
 'riftbound/sets.json':{sets:[{id:'ogn',name:'Origins',releaseDate:'2025/10/31',setValueUsd:3000}]},
 'riftbound/sets/ogn.json':{updatedAt:'2026-10-28',cards:[{id:'OGN-300',name:'Jinx - Loose Cannon',number:'300',rarity:'Overnumbered',cardmarketId:990001,variants:[{name:'foil',eur:e(180,90)}]}]}};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/'))return J({rates:{EUR:0.9},date:'2026-10-28'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const b=u.match(/\/bindex-prices\/v1\/(.+)$/);if(b)return BXD[b[1]]?J(BXD[b[1]]):route.fulfill({status:404,headers:H,body:'404'});
  if(u.startsWith('https://api.pokemontcg.io/'))return route.fulfill({status:429,headers:H,body:'{}'});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-base4-1'),null,{timeout:120000});
 // 1) Mal estado (la captura)
 await page.selectOption('[data-cp-view="cond"]','mal');await page.waitForFunction(()=>/MAL ESTADO/.test(document.querySelector('#v4Buy #cp-base4-1 .cpDecide')?.textContent||''),null,{timeout:30000});
 const card=await page.evaluate(()=>{const a=document.querySelector('#v4Buy #cp-base4-1');return {dec:a.querySelector('.cpDecide').textContent,money:a.querySelector('.cpMoney').textContent,buy:a.querySelector('.cpBuy').textContent,all:a.textContent}});
 // venta restaurada 164,75 × 0,6 = 98,85 → neto 88,91 → pagas como máximo min(48,91; 71,13) = 48,91 · carta ≤ 42,90
 ok('Cajas = línea de decisión: «Paga como máximo ≤ 48,91 € · La vendes a 98,85 € (restaurada) · Ganas ≥ 40 €»',/Paga como máximo≤ 48,91\s€/.test(card.money)&&/La vendes a98,85\s€/.test(card.money)&&/Ganas≥ 40,00\s€/.test(card.money)&&/≤ 42,90\s€/.test(card.dec),card.money+' || '+card.dec);
 ok('Ninguna caja dice «Compra en Cardmarket» con un precio que no es tu compra',!/Compra en Cardmarket/.test(card.money),card.money);
 ok('«Dónde comprarla»: el «desde» de 29 € (35 € con envío) está en «⚠ Solo referencia, NO es tu compra», con el motivo',/Solo referencia, NO es tu compra/.test(card.buy)&&/Cardmarket · cualquier estado.*35,00\s€.*cualquier idioma \(puede ser coreano o chino\)/.test(card.buy),card.buy);
 ok('…y recuerda tu precio máximo: «👉 … ≤ 48,91 € con envío»',/Tu precio máximo para ganar tu mínimo: ≤ 48,91\s€ con envío/.test(card.buy),card.buy);
 ok('Sin la tabla confusa «Mismo idioma · Todos (guía)» ni «Sin precio de compra en 20–200 €»',!/Todos \(guía\)/.test(card.all)&&!/Sin precio de compra en 20–200/.test(card.all));
 // 2) Gundam y Riftbound
 await page.selectOption('[data-cp-view="cond"]','buen');await page.selectOption('[data-cp-view="game"]','gundam');
 await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-bx-gundam-GD01-001'),null,{timeout:60000});
 let href=await page.evaluate(()=>document.querySelector('#v4Buy #cp-bx-gundam-GD01-001 .v4actions a').href);
 ok('Gundam: carta con su ficha de Cardmarket (/Gundam/)',/cardmarket\.com\/es\/Gundam\/Products\?idProduct=880001/.test(href),href);
 await page.selectOption('[data-cp-view="game"]','riftbound');
 await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-bx-riftbound-OGN-300'),null,{timeout:60000});
 href=await page.evaluate(()=>document.querySelector('#v4Buy #cp-bx-riftbound-OGN-300 .v4actions a').href);
 ok('Riftbound: carta foil con su ficha de Cardmarket (/Riftbound/, solo foil)',/cardmarket\.com\/es\/Riftbound\/Products\?idProduct=990001.*isFoil=Y/.test(href),href);
 const t=await page.textContent('#v4Buy #cp-bx-riftbound-OGN-300 .cpMoney');
 ok('Riftbound con objetivo claro en las cajas: «Paga como máximo … La vendes a 180 €»',/Paga como máximo/.test(t)&&/La vendes a180,00\s€/.test(t),t);
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V145 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
