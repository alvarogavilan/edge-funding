// V143 · Lorcana al 100 % (foil con su propio precio y enlace, CardTrader separando foil y normal, historial de precio) y
// CardNexus (opcional): el anuncio más barato de Cardmarket POR IDIOMA y estado, y los anuncios de CardNexus con su envío
// real a España. Ejecutar: node tests/v143-lorcana-cardnexus-e2e.cjs · Datos SIMULADOS; claves inventadas.
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
const GUIDE={fields:F,sourceCreatedAt:'2026-10-28T02:45:46+0200',generatedAt:'2026-10-28T08:30:52Z',rows:[[273924,60,250,250,250,250,null,null,null]]};// Alakazam · vale 250 €
const eur=(t,l)=>({trend:t,low:l,avg30:t,avg7:t,avg1:t});
const LOR={sets:[{id:'tfc',name:'The First Chapter'}]},LORSET={updatedAt:'2026-10-28',cards:[
 {id:'tfc-3',name:'Stitch - Rock Star',number:'3',rarity:'Enchanted',imageSmall:'https://images.example/c.png',cardmarketId:681003,variants:[{name:'foil',eur:eur(300,150)}]},
 {id:'tfc-10',name:'Elsa - Snow Queen',number:'10',rarity:'Legendary',imageSmall:'https://images.example/e.png',cardmarketId:681010,variants:[{name:'normal',eur:eur(30,12)},{name:'foil',eur:eur(120,55)}]}]};
const HIST={updatedAt:'2026-10-28',points:{'tfc-3|foil':[['2026-09-01',null,250,1],['2026-10-20',null,280],['2026-10-27',null,295],['2026-10-28',null,300]]}};
const CTTOK='eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.firma',CNK='cnk_live_prueba123';
const P=(id,cents,foil,user,o={})=>({id,price:{cents,currency:'EUR'},quantity:1,properties_hash:{condition:'Near Mint',lorcana_language:'en',lorcana_foil:foil},user:{username:user,country_code:'DE',can_sell_via_hub:true},graded:false,...o});
const calls=[];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(([t,k])=>{try{localStorage.setItem('cv_cardtrader_token',t);localStorage.setItem('cv_cardnexus_key',k);localStorage.setItem('cv_v104_user',JSON.stringify({minMargin:25}))}catch{}},[CTTOK,CNK]);
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const req=route.request(),u=req.url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/'))return J({rates:{EUR:0.9},date:'2026-10-28'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  if(u.endsWith('/bindex-prices/v1/lorcana/sets.json'))return J(LOR);
  if(u.endsWith('/bindex-prices/v1/lorcana/sets/tfc.json'))return J(LORSET);
  if(u.endsWith('/bindex-prices/v1/lorcana/history/tfc.json'))return J(HIST);
  if(u.startsWith('https://api.pokemontcg.io/'))return route.fulfill({status:429,headers:H,body:'{}'});
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);calls.push('ct '+p);
   if(p==='/info')return J({id:1,name:'Card Vault'});
   if(p==='/games')return J([{id:5,name:'Pokemon'},{id:18,name:'Disney Lorcana'}]);
   if(p==='/expansions')return J([{id:31,game_id:18,code:'tfc',name:'The First Chapter'}]);
   if(p.startsWith('/blueprints/export?expansion_id=31'))return J([{id:990,name:'Stitch - Rock Star',card_market_ids:[681003]},{id:991,name:'Elsa - Snow Queen',card_market_ids:[681010]}]);
   const GR=(id,cents)=>({id,price:{cents,currency:'EUR'},quantity:1,properties_hash:{lorcana_language:'en',grader:'PSA',grade:9},user:{username:'g'+id,country_code:'IT'},graded:true});
   const L={990:[P(1,17000,true,'ana')],991:[P(2,1000,false,'luis'),P(3,6000,true,'eva'),GR(8,6000),GR(9,12000)]};
   if(/^\/marketplace\/products\?expansion_id=31/.test(p))return J(L);
   const m=p.match(/^\/marketplace\/products\?blueprint_id=(\d+)/);if(m)return J({[m[1]]:L[m[1]]||[]});
   if(p.startsWith('/shipping_methods'))return J([{price:{cents:500,currency:'EUR'}}]);
   if(p.startsWith('/marketplace/products'))return J({});
   return J([])}
  if(u.startsWith('https://public-api.cardnexus.com/v1/')){const p=u.slice('https://public-api.cardnexus.com/v1'.length),auth=req.headers()['authorization'];calls.push('cn '+p);
   if(auth!=='Bearer '+CNK)return route.fulfill({status:401,headers:H,body:'{}'});
   if(p==='/games')return J({data:[{id:'pokemon'},{id:'lorcana'}]});
   if(p==='/products/resolve'){const ids=JSON.parse(req.postData()).ids;return J({results:ids.map(id=>({externalId:id,product:id===273924?{id:5001,name:'Alakazam',gameId:'pokemon',expansionId:1,finish:'Standard'}:null}))})}
   if(p==='/products/5001/prices')return J({productId:5001,pricesByFinish:{Standard:{
     cardmarket:{currency:'EUR',low:55,marketValue:250,byCondition:{NM:{low:150,listingCount:9,byLanguage:{en:{low:150,listingCount:3},ko:{low:60,listingCount:2}}}}},
     cardnexus:{low:{amount:140,currency:'EUR'},listingCount:2,availableQuantity:2,regions:{eu:{currency:'EUR',low:50,listingCount:2,availableQuantity:2,byCondition:{NM:{low:50,listingCount:2,availableQuantity:2,byLanguage:{en:{low:50,listingCount:2,availableQuantity:2}}}}}}}}}});
   if(p.startsWith('/products/5001/listings'))return J({data:[
     {listingId:'a',price:{amount:50,currency:'EUR'},quantity:1,condition:'NM',language:'en',finish:'Standard',graded:null,comment:'Proxy card, high quality print',photos:[],seller:{username:'fake',country:'CN',type:'individual',shipping:{amount:3,currency:'EUR'}}},
     {listingId:'b',price:{amount:140,currency:'EUR'},quantity:1,condition:'NM',language:'en',finish:'Standard',graded:null,comment:null,photos:[{url:'x',width:1,height:1}],seller:{username:'marie',country:'FR',type:'pro',rating:{average:4.9},shipping:{amount:4,currency:'EUR'}}}],pagination:{nextCursor:null}});
   return J({})}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-lo-tfc-3')&&document.querySelector('[id="cp-lo-tfc-10~foil"]'),null,{timeout:120000});
 // 1) Lorcana foil
 let t=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpCard h3')].map(h=>h.textContent).join(' | '));
 ok('Lorcana: la Elsa legendaria FOIL (vale 120 €) sale aparte de la normal (30 €), como «Elsa - Snow Queen (foil)»',/Elsa - Snow Queen \(foil\)/.test(t)&&!/Stitch - Rock Star \(foil\)/.test(t),t);
 const href=await page.evaluate(()=>document.querySelector('[id="cp-lo-tfc-10~foil"] .v4actions a').href);
 ok('…y su enlace a Cardmarket abre solo anuncios FOIL (isFoil=Y)',/Lorcana\/Products\?idProduct=681010.*isFoil=Y/.test(href),href);
 // 2) CardTrader separa foil y normal
 await page.waitForFunction(()=>/✅ COMPRA en CardTrader/.test(document.querySelector('[id="cp-lo-tfc-10~foil"] .cpDecide')?.textContent||''),null,{timeout:120000});
 t=await page.textContent('[id="cp-lo-tfc-10~foil"] .cpDecide');
 // foil a 60 € + 5 € de envío = 65 → 120·0,95 − 5 − 65 = +44 (el de 10 € es NORMAL: no cuenta para la foil)
 ok('Elsa foil: «✅ COMPRA en CardTrader · pagas 65 € → +44 €» con la foil de 60 €, no con la normal de 10 € (+99 € falso)',/Pagas 65,00\s€/.test(t)&&/ganas \+44,00\s€/.test(t),t);
 ok('Stitch Enchanted (solo existe foil): CardTrader con su foil de 170 €',/Pagas 175,00\s€/.test(await page.textContent('#v4Buy #cp-lo-tfc-3 .cpDecide')),await page.textContent('#v4Buy #cp-lo-tfc-3 .cpDecide'));
 // 3) Historial de Lorcana
 await page.evaluate(()=>{const d=document.querySelector('#v4Buy #cp-lo-tfc-3 [data-cp-histload]').closest('details');if(d)d.open=true});
 await page.click('#v4Buy #cp-lo-tfc-3 [data-cp-histload]');await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-lo-tfc-3 .cpHist svg'),null,{timeout:30000});
 t=await page.textContent('#v4Buy #cp-lo-tfc-3 .cpHist');
 ok('Lorcana con historial de precio (Bindex, sin los puntos estimados): 280 € → 300 €',/280,00\s€ → 300,00\s€/.test(t)&&/\+7/.test(t),t);
 // 4) CardNexus
 await page.waitForFunction(()=>(window.CVCompra.cnState().cnRes['base4-1']||{}).cxBuy,null,{timeout:120000});await page.evaluate(()=>window.CVCompra.render());await page.waitForTimeout(400);
 t=await page.textContent('#v4Buy #cp-base4-1 .cpDecide');
 // CardNexus: 140 + 4 de envío real = 144 → 250·0,95 − 5 − 144 = +88,50 (el de 50 € dice «Proxy»: fuera)
 ok('CardNexus: «✅ COMPRA en CardNexus · INGLÉS · NM · pagas 144 € (envío real 4 €) → +88,50 €», sin el anuncio «Proxy» de 50 €',/✅ COMPRA en CardNexus · INGLÉS · NM/.test(t)&&/Pagas 144,00\s€/.test(t)&&/ganas \+88,50\s€/.test(t),t);
 const rows=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-base4-1 .cpBuy tr')].map(r=>r.textContent).join(' | '));
 ok('«Dónde comprarla»: Cardmarket EN INGLÉS NM a 150 € (+6 = 156 €, la guía oficial no lo separa) y CardNexus a 144 €',/Cardmarket · inglés NM.*156,00\s€/.test(rows)&&/CardNexus · inglés NM.*144,00\s€/.test(rows),rows.slice(0,600));
 ok('La compra de Cardmarket por idioma tiene su enlace solo en inglés y NM',await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-base4-1 .cpBuy a')].some(a=>/idProduct=273924&language=1&minCondition=2/.test(a.href))));
 ok('Una sola consulta para emparejar ids de Cardmarket (resolve) y la clave va como «Bearer»',calls.filter(c=>c==='cn /products/resolve').length>=1&&calls.includes('cn /products/5001/prices'),calls.filter(c=>c.startsWith('cn')).join(' '));
 const dg=await page.evaluate(()=>window.CVCompra.diagText());
 ok('Diagnóstico con CardNexus y SIN la clave',/CardNexus: clave 18 caracteres/.test(dg)&&!dg.includes('cnk_live_prueba123'),dg.split('\n').find(l=>/CardNexus/.test(l)));
 ok('Panel de CardNexus en «Estado de las fuentes»',/CardNexus \(opcional\) · Cardmarket por idioma y estado/.test(await page.textContent('#v4Buy .v4settings')));
 // 5) Graduadas también en Lorcana
 const g=await page.evaluate(async()=>{await window.CVGraduadas.scanGraded();return JSON.parse(localStorage.getItem('cv_v134_gr_opp')||'null')});
 const gl=(g?.rows||[]).find(r=>/Elsa/.test(r.name));
 // PSA 9 a 60 € (+6) frente a la siguiente PSA 9 a 120 € → 120·0,95 − 5 − 66 = +43
 ok('Cartas graduadas también en Lorcana: Elsa PSA 9 a 60 € → reventa 120 € → +43 €',gl&&gl.co==='PSA'&&gl.gr===9&&Math.abs(gl.profit-43)<.01,JSON.stringify(g&&g.rows));
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V143 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
