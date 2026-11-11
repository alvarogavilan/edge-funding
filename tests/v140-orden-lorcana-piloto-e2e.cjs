// V140 · «Ordenar por menor precio de compra» por lo que pagas, Lorcana con precio objetivo y CardTrader, y piloto
// automático que detecta compras nuevas y avisa. Chromium con emulación de iPhone.
// Ejecutar: node tests/v140-orden-lorcana-piloto-e2e.cjs · Datos SIMULADOS; token inventado.
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
let GUIDE={fields:F,sourceCreatedAt:'2026-10-24T02:45:46+0200',generatedAt:'2026-10-24T08:30:52Z',rows:[
 [273933,150,258,258,263,268,null,null,null],   // Mewtwo · internacional → objetivo (pagas ≤ 192,08)
 [273924,60,250,250,250,250,null,null,null],    // Alakazam · internacional → objetivo (pagas ≤ 186)
 [861477,193,257,257,257,262,null,null,null],   // Pikachu ex 234 · japonés · 20 % de margen: no se propone
 [861287,150,280,280,280,280,null,null,null]]}; // Pikachu ex 44 · japonés · pagas 156 → +105
const GUIDE2={...GUIDE,sourceCreatedAt:'2026-10-25T02:45:46+0200',rows:GUIDE.rows.map(r=>r[0]===861477?[861477,100,257,257,257,262,null,null,null]:r)};// al día siguiente: Pikachu ex 234 tiene un anuncio a 100 € → chollo NUEVO
const v=(t,l)=>[{name:'normal',eur:{trend:t,low:l,avg30:t,avg7:t,avg1:t}}];
const LOR={sets:[{id:'tfc',name:'The First Chapter'}]},LORSET={updatedAt:'2026-10-24',cards:[
 {id:'tfc-3',name:'Stitch - Rock Star',number:'3',rarity:'Enchanted',imageSmall:'https://images.example/c.png',cardmarketId:681003,variants:v(300,150)}]};
const TOK='eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.firma';
const P=(id,cents,lang,user,cc,key='pokemon_language')=>({id,price:{cents,currency:'EUR'},quantity:1,properties_hash:{condition:'Near Mint',[key]:lang},user:{username:user,country_code:cc,can_sell_via_hub:true},graded:false});
async function setup(withCT){
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 if(withCT)await ctx.addInitScript(t=>{try{localStorage.setItem('cv_cardtrader_token',t)}catch{}},TOK);
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  if(u.endsWith('/bindex-prices/v1/lorcana/sets.json'))return J(LOR);
  if(u.endsWith('/bindex-prices/v1/lorcana/sets/tfc.json'))return J(LORSET);
  if(u.startsWith('https://api.pokemontcg.io/'))return route.fulfill({status:429,headers:H,body:'{}'});
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);
   if(p==='/info')return J({id:1,name:'Card Vault'});
   if(p==='/games')return J([{id:5,name:'Pokemon'},{id:18,name:'Disney Lorcana'}]);
   if(p==='/expansions')return J([{id:31,game_id:18,code:'tfc',name:'The First Chapter'}]);
   if(p.startsWith('/blueprints/export?expansion_id=31'))return J([{id:990,name:'Stitch - Rock Star',fixed_properties:{collector_number:'3'},card_market_ids:[681003]}]);
   if(p.startsWith('/marketplace/products?blueprint_id=990'))return J({990:[P(9,17000,'en','ana','IT','lorcana_language')]});
   if(p.startsWith('/shipping_methods'))return J([{price:{cents:500,currency:'EUR'}}]);
   if(p.startsWith('/marketplace/products'))return J({});
   return J([])}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));return {browser,page,errors};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 let {browser,page,errors}=await setup(false);
 await page.goto(base);
 const ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-lo-tfc-3')&&document.querySelector('#v4Buy #cp-base4-1')&&document.querySelector('#v4Buy #cp-jp-861287'),null,{timeout:120000});await page.waitForTimeout(600);
 ok('Japonesa con su anuncio más barato al 54 % (estado sin indicar): «🔎 BUSCA EN BUEN ESTADO · JAPONÉS» con su precio máximo',/🔎 BUSCA EN BUEN ESTADO · JAPONÉS/.test(await page.textContent('#v4Buy #cp-jp-861287 .cpDecide')),await page.textContent('#v4Buy #cp-jp-861287 .cpDecide'));
 // 1) Lorcana con precio objetivo
 let t=await page.textContent('#v4Buy #cp-lo-tfc-3 .cpDecide');
 // 300·0,95 − 5 = 280 → ≤ min(240; 224; 200) = 200 con envío → 194 € la carta
 ok('Lorcana ya no está vacía: Stitch Enchanted «🔎 BUSCA EN INGLÉS · cómprala por ≤ 194 € → la vendes a 300 € → ganas ≥ 80 €»',/🔎 BUSCA EN INGLÉS/.test(t)&&/≤ 194,00\s€/.test(t)&&/300,00\s€/.test(t)&&/ganas ≥ 80,00\s€/.test(t),t);
 ok('…con su enlace a Cardmarket Lorcana solo en inglés',await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-lo-tfc-3 .cpDecide a')].some(a=>a.href==='https://www.cardmarket.com/es/Lorcana/Products?idProduct=681003&language=1&minCondition=3')));
 // 2) Ordenar por menor precio de compra = lo que pagas (compras y objetivos juntos)
 await page.selectOption('[data-cp-view="sort"]','buy');await page.waitForTimeout(400);
 const pays=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard .cpDecide')].map(d=>{const m=d.textContent.match(/(?:Pagas|≤ [\d.,]+\s€ \([^;]+; ≤) ([\d.]+,\d\d)\s€/);return m?Number(m[1].replace(/\./g,'').replace(',','.')):NaN}));
 ok('«Menor precio de compra»: de menos a más por lo que pagas (186 → 192,08 → 200 → 200)',JSON.stringify(pays)===JSON.stringify([186,192.08,200,200]),JSON.stringify(pays)+' '+JSON.stringify(await ids()));
 await page.selectOption('[data-cp-view="sort"]','profit');await page.waitForTimeout(300);
 // 3) Piloto automático: nueva compra detectada
 t=await page.textContent('#v4Buy .cpAuto');
 ok('🤖 Piloto automático visible (y el botón de avisos si el navegador los permite)',/Piloto automático/.test(t)&&/revisa la guía y CardTrader cada 15 min/.test(t)&&(await page.evaluate(()=>Notification.permission))!=='default'||/Avisarme de compras nuevas/.test(t),t);
 await page.evaluate(()=>{const s=window.CVCompra.seenState();s.__init-=120000});/* la app ya llevaba tiempo abierta */
 GUIDE=GUIDE2;await page.evaluate(()=>window.CVCompra.apTick(true));
 await page.waitForFunction(()=>/compra\(s\) nueva\(s\)/.test(document.querySelector('#cpToast')?.textContent||''),null,{timeout:30000});
 ok('Al revisar sola: aparece un anuncio de Pikachu ex 234 a 100 € → «🆕 1 compra(s) nueva(s): Pikachu ex (🎲 chollo)»',/🆕 1 compra\(s\) nueva\(s\): Pikachu ex \(🎲 chollo\)/.test(await page.textContent('#cpToast')),await page.textContent('#cpToast'));
 ok('Las que ya estaban no se marcan como nuevas',!/🆕 NUEVA/.test(await page.textContent('#v4Buy .cpBox > .v4list')));
 ok('Sin errores de JavaScript (1)',!errors.length,errors.join(' | '));
 await browser.close();GUIDE={...GUIDE2,rows:GUIDE2.rows};
 // 4) CardTrader también para Lorcana
 ({browser,page,errors}=await setup(true));await page.goto(base);
 await page.waitForFunction(()=>/✅ COMPRA en CardTrader/.test(document.querySelector('#v4Buy #cp-lo-tfc-3 .cpDecide')?.textContent||''),null,{timeout:150000});
 t=await page.textContent('#v4Buy #cp-lo-tfc-3 .cpDecide');
 // 170 + 5 = 175 → 280 − 175 = +105
 ok('Lorcana con CardTrader: «✅ COMPRA en CardTrader · INGLÉS · pagas 175 € → la vendes a 300 € → ganas +105 €»',/✅ COMPRA en CardTrader · INGLÉS/.test(t)&&/Pagas 175,00\s€/.test(t)&&/ganas \+105,00\s€/.test(t),t);
 ok('Sin errores de JavaScript (2)',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V140 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
