// V135 · Comparar solo con precio: Cardmarket y CardTrader (con tu token), y otras tiendas solo si dan precio. CardTrader:
// prueba del token (/info), emparejado por id de Cardmarket, anuncios del mismo idioma (language=) y envío real del vendedor
// (/shipping_methods). Chromium con emulación de iPhone. Ejecutar: node tests/v135-cardtrader-e2e.cjs
// Sin Internet: guía y CardTrader SIMULADOS con el formato de los ejemplos públicos de su API. PRECIOS INVENTADOS.
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
 [273933,150,258,258,263,268,null,null,null],   // Mewtwo · Cardmarket EX o mejor 194 € → pagas 200 €
 [861477,193,257,257,257,262,null,null,null]]}; // Pikachu ex M2A 234 japonés · Cardmarket 193 € → pagas 199 €
const hits=[];
// Formato real de la API (ejemplos de la documentación): price {cents,currency}, user {username,country_code,can_sell_via_hub}, properties_hash {condition, <juego>_language}
const P=(id,cents,lang,user,cc,hub,cond='Near Mint')=>({id,price:{cents,currency:'EUR'},quantity:1,properties_hash:{condition:cond,pokemon_language:lang},user:{username:user,country_code:cc,can_sell_via_hub:hub},graded:false});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(()=>{try{localStorage.setItem('cv_cardtrader_token','prueba')}catch{}});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}}]:[];return J({data,totalCount:data.length})}
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);hits.push(p);
   if(route.request().headers()['authorization']!=='Bearer prueba')return route.fulfill({status:401,headers:H,body:'{}'});
   if(p==='/info')return J({id:42,name:'Card Vault',shared_secret:'x'});
   if(p==='/games')return J([{id:5,name:'Pokemon'}]);
   if(p==='/expansions')return J([{id:10,game_id:5,code:'base1',name:'Base Set'},{id:11,game_id:5,code:'b2',name:'Base Set 2'},{id:21,game_id:5,code:'m2a',name:'MEGA Dream ex'}]);
   // «Base Set» (exacto) no tiene la carta; «Base Set 2» sí, con otro número de colección pero el id de Cardmarket correcto
   if(p.startsWith('/blueprints/export?expansion_id=10'))return J([{id:800,name:'Mewtwo',fixed_properties:{collector_number:'10'},card_market_ids:[999999]}]);
   if(p.startsWith('/blueprints/export?expansion_id=11'))return J([{id:900,name:'Mewtwo',fixed_properties:{collector_number:'10a'},card_market_ids:[273933]}]);
   if(p.startsWith('/blueprints/export?expansion_id=21'))return J([{id:950,name:'Pikachu ex',fixed_properties:{collector_number:'234'},card_market_ids:[861477]}]);
   if(p==='/marketplace/products?blueprint_id=900')return J({900:Array.from({length:25},(_,i)=>P(1000+i,9000+i*100,'kr','kr'+i,'KR',false))});// los 25 más baratos: coreanos
   if(p==='/marketplace/products?blueprint_id=900&language=en')return J({900:[P(2001,17000,'en','mario','IT',true),P(2002,19000,'en','luigi','DE',false),P(2003,12000,'en','peach','FR',false,'Played')]});
   if(p==='/marketplace/products?blueprint_id=950')return J({950:[P(3001,15000,'jp','kenji','JP',false)]});
   if(p==='/marketplace/products?blueprint_id=950&language=jp')return J({950:[P(3001,15000,'jp','kenji','JP',false)]});
   if(p==='/shipping_methods?username=mario')return J([{id:1,name:'Correo',price:{cents:590,currency:'EUR'}},{id:2,name:'Urgente',price:{cents:1290,currency:'EUR'}}]);
   if(p.startsWith('/shipping_methods'))return J([]);// sin métodos → envío estimado, se dice
   if(p.startsWith('/marketplace/products'))return J({});
   return route.fulfill({status:404,headers:H,body:'{}'})}
  return route.abort()});// tiendas (Zenpan, Hareruya2) y demás: bloqueadas
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/CardTrader · Inglés/.test(document.querySelector('#v4Buy #cp-base4-10 .cpBuy')?.textContent||''),null,{timeout:150000});
 await page.waitForTimeout(800);
 await page.evaluate(()=>{document.querySelectorAll('#v4Buy details.v4settings').forEach(d=>d.open=true)});
 let t=await page.textContent('#v4Buy .cpShops');
 ok('«Probar CardTrader» (GET /info): ✓ conectado con tu token',/CardTrader: ✓ conectado \(Card Vault\)/.test(t)&&hits.includes('/info'),t);
 t=await page.textContent('#v4Buy #cp-base4-10 .cpBuy');
 // 170 € (NM, inglés, Italia) + envío real 5,90 € = 175,90 € · el coreano de 90 € y la «Played» de 120 € no cuentan
 ok('Mewtwo en CardTrader: emparejada por id de Cardmarket (aunque el número sea «10a» y exista «Base Set»), anuncio en INGLÉS 170 € + envío REAL 5,90 € = 175,90 €',/CardTrader · Inglés Near Mint ↗175,90\s€/.test(t)&&/anuncio 170,00\s€ \(vendedor de IT\) \+ envío real 5,90\s€/.test(t)&&hits.includes('/marketplace/products?blueprint_id=900&language=en'),t);
 ok('…y admite CardTrader Zero (revisan la carta)',/admite CardTrader Zero/.test(t));
 ok('Comparación ordenada: CardTrader 175,90 € (la mejor), Cardmarket 200,00 € y al final lo no comparable (cualquier estado 156 €)',/Dónde comprarla más barata · CardTrader · Inglés Near Mint 175,90\s€ puesta en 41020/.test(t)&&t.indexOf('CardTrader · Inglés Near Mint ↗')<t.indexOf('Cardmarket · EX o mejor ↗')&&t.indexOf('Cardmarket · EX o mejor ↗')<t.indexOf('Cardmarket · cualquier estado ↗'),t.slice(0,500));
 ok('Solo sitios con precio: sin Buyee, Hareruya2, Zenpan ni calculadoras',!/Buyee|Mercari|Hareruya|Zenpan/.test(t)&&!(await page.$('[data-cp-jpcalcbox]'))&&!/¿Y si la compro en Japón\?/.test(await page.textContent('#v4Buy')),t);
 t=await page.textContent('#v4Buy #cp-jp-861477 .cpBuy');
 ok('Japonesa: CardTrader en japonés con envío estimado cuando el vendedor no da métodos (y lo dice)',/CardTrader · Japonés Near Mint ↗156,00\s€/.test(t)&&/envío estimado 6,00\s€ \(CardTrader no lo dio\)/.test(t),t);
 t=await page.textContent('#v4Buy .cpTop');
 // 258·0,95 − 5 − 175,90 = +64,20
 ok('Top 5: Mewtwo comprada en CardTrader con lo que pagas de verdad (175,90 €) → +64,20 €',/Pagas 175,90\s€ \(CardTrader, inglés NM\/EX, puesta en 41020\) → venta 258,00\s€ → \+64,20\s€/.test(t),t.slice(0,600));
 await page.evaluate(()=>{document.querySelectorAll('#v4Buy details.v4settings').forEach(d=>d.open=true)});
 t=await page.textContent('#v4Buy .cpShops');
 ok('Otras tiendas que no dejan leer precios: no se enseñan (y se dice en Estado de las fuentes)',/Otras tiendas[^]*no dejan leer sus precios → no se enseñan/.test(t),t);
 await page.click('.mainNav [data-tab="pregrade"]');await page.waitForSelector('#cpGraded h4',{timeout:30000});
 ok('Graduadas: sin lista de tiendas sin precio',!(await page.$('#cpGraded a[href*="pokemillon"]'))&&!(await page.$('#cpGraded a[href*="wallapop"]')));
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V135 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
