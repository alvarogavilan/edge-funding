// V133 · Comparador de puntos de compra que llegan a 41020: Cardmarket, CardTrader (japonés) y tiendas que envían a España
// (Zenpan EU desde Lisboa sin aduana, Zenpan Japan y Hareruya2 desde Japón), ordenados por lo que pagas en total.
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v133-tiendas-e2e.cjs
// Sin Internet: la guía, CardTrader y el buscador de las tiendas (Shopify search/suggest.json) se SIMULAN. PRECIOS INVENTADOS.
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
 [861477,193,257,257,257,262,null,null,null]]}; // Pikachu ex M2A 234 japonés · Cardmarket 193 € (pagas 199 €)
const hits={shop:[],ct:[]};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(()=>{try{localStorage.setItem('cv_cardtrader_token','eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.prueba')}catch{}});
 await ctx.addInitScript(()=>{try{const u=JSON.parse(localStorage.getItem('cv_v104_user')||'{}');u.cfg=u.cfg||{};if(u.cfg.minMargin==null){u.cfg.minMargin=0;localStorage.setItem('cv_v104_user',JSON.stringify(u))}}catch{}});/* V139: estas pruebas no miden el margen mínimo */
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}}]:[];return J({data,totalCount:data.length})}
  // Tiendas Shopify: Zenpan EU (euros, se deja leer), Zenpan Japan (yenes, se deja leer), Hareruya2 (bloquea: CORS)
  if(u.startsWith('https://zenpan-eu.com/')){hits.shop.push(u);if(u.endsWith('/cart.js'))return J({currency:'EUR'});
   return J({resources:{results:{products:[{title:'Pikachu ex SAR 234/193 [M2a] Japanese',price:'150.00',url:'/products/pikachu-ex-234',available:true},{title:'Pikachu ex 044/193 [M2a]',price:'9.00',url:'/products/pikachu-ex-44',available:true},{title:'Pikachu ex SAR 234/193 [M2a] Japanese',price:'140.00',url:'/products/agotada',available:false}]}}})}
  if(u.startsWith('https://zenpan-japan.com/')){hits.shop.push(u);if(u.endsWith('/cart.js'))return J({currency:'JPY'});
   return J({resources:{results:{products:[{title:'Pikachu ex SAR 234/193 M2a',price:'20000',url:'https://zenpan-japan.com/products/pika-234',available:true}]}}})}
  if(u.startsWith('https://www.hareruya2.com/')){hits.shop.push(u);return route.abort()}
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);hits.ct.push(p);
   if(p==='/info')return J({id:1,name:'Card Vault'});
   if(p==='/games')return J([{id:5,name:'Pokemon'}]);
   if(p==='/expansions')return J([{id:11,game_id:5,code:'base4',name:'Base Set 2'},{id:21,game_id:5,code:'m2a',name:'MEGA Dream ex'}]);
   if(p.startsWith('/blueprints/export?expansion_id=21'))return J([{id:950,name:'Pikachu ex',fixed_properties:{collector_number:'234'}}]);
   if(p.startsWith('/marketplace/products?blueprint_id=950'))return J({950:[
    {price_cents:17000,properties_hash:{condition:'Near Mint',pokemon_language:'jp'},user:{country_code:'IT'}},
    {price_cents:9000,properties_hash:{condition:'Near Mint',pokemon_language:'kr'},user:{country_code:'DE'}}]});
   if(p.startsWith('/marketplace/products'))return J({});
   return route.fulfill({status:404,headers:H,body:'{}'})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 // V135: las tiendas se leen solas al cargar (con el token de CardTrader); sin botón
 await page.waitForFunction(()=>/Zenpan EU \(Lisboa, UE\) ↗156,00/.test(document.querySelector('#v4Buy #cp-jp-861477 .cpBuy')?.textContent||''),null,{timeout:150000});
 let t=await page.textContent('#v4Buy #cp-jp-861477 .cpBuy');
 // Zenpan EU: 150 € + envío 6 € = 156 € (en la UE: sin aduana)
 ok('Ficha japonesa en Compra YA (lectura automática): la más barata es Zenpan EU 156 € puesta en 41020',/Dónde comprarla más barata · Zenpan EU \(Lisboa, UE\) 156,00\s€ puesta en 41020/.test(t),t.slice(0,600));
 await page.evaluate(()=>{document.querySelectorAll('#v4Buy details.v4settings').forEach(d=>d.open=true)});
 t=await page.textContent('#v4Buy .cpShops');
 ok('Estado de las fuentes: Zenpan EU y Zenpan Japan se pueden leer (Hareruya2 no: no se enseña)',/✓ Zenpan EU, Zenpan Japan se pueden leer/.test(t),t);
 // Ficha de la carta: buscarla
 await page.fill('[data-cp-q]','pikachu ex');await page.waitForSelector('#v4Buy #cp-jp-861477 .cpBuy',{timeout:30000});
 await page.waitForFunction(()=>/CardTrader · Japonés/.test(document.querySelector('#v4Buy #cp-jp-861477 .cpBuy')?.textContent||''),null,{timeout:30000});
 t=await page.textContent('#v4Buy #cp-jp-861477 .cpBuy');
 const order=[...t.matchAll(/(Zenpan EU \(Lisboa, UE\)|CardTrader · Japonés Near Mint|Zenpan Japan \(Japón\)|Cardmarket · «desde») ↗([\d.,]+)\s€/g)].map(m=>m[1]+' '+m[2]);
 // Zenpan Japan: ¥20.000 = 116 € + EMS 20,01 + arancel 3 + IVA 21 % de 139,01 = 29,19 + gestión 15 = 183,20 €
 ok('«Dónde comprarla»: todas las vías ordenadas por lo que pagas en 41020 (Zenpan EU 156 → CardTrader japonés 176 → Zenpan Japan 183,20 → Cardmarket 199)',JSON.stringify(order)===JSON.stringify(['Zenpan EU (Lisboa, UE) 156,00','CardTrader · Japonés Near Mint 176,00','Zenpan Japan (Japón) 183,20','Cardmarket · «desde» 199,00']),JSON.stringify(order)+' '+t.slice(0,900));
 ok('La mejor marcada: Zenpan EU con su anuncio y enlace al producto',/Dónde comprarla más barata · Zenpan EU \(Lisboa, UE\) 156,00\s€ puesta en 41020/.test(t)&&await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-jp-861477 .cpBuy tr.best a')].some(a=>a.href==='https://zenpan-eu.com/products/pikachu-ex-234')),t.slice(0,300));
 ok('Solo cuenta la disponible y del mismo número (no la agotada de 140 € ni la nº 44 de 9 €)',!/140,00/.test(t)&&!/9,00\s€ \+/.test(t)&&/«Pikachu ex SAR 234\/193 \[M2a\] Japanese» 150,00\s€ \+ envío estimado 6,00\s€ \(el real, en su carrito; stock en la UE: IVA incluido, sin aduana\)/.test(t),t);
 ok('Hareruya2 no deja leer su precio: no sale (solo sitios con precio)',!/Hareruya2/.test(t),t);
 ok('CardTrader en japonés (no el coreano de 90 €), con su colección japonesa por código M2a',/CardTrader · Japonés Near Mint ↗176,00\s€/.test(t)&&!/90,00/.test(t)&&hits.ct.some(p=>p.includes('expansion_id=21')),JSON.stringify(hits.ct));
 ok('Sin Mercari/Buyee (no hay precio que leer)',!/Buyee|Mercari/.test(t));
 await page.fill('[data-cp-q]','');await page.waitForTimeout(800);
 t=await page.textContent('#v4Buy .cpTop');
 // 257·0,95 − 5 − 156 = +83,15
 ok('Top 5: la compra en Zenpan EU entra con lo que pagas y su enlace',/Pikachu ex[^]*Pagas 156,00\s€ \(Zenpan EU \(Lisboa, UE\), puesta en 41020\) → venta 257,00\s€ → \+83,15\s€/.test(t)&&await page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpTop li a')].some(a=>a.href==='https://zenpan-eu.com/products/pikachu-ex-234')),t.slice(0,600));
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V133 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
