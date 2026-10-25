// V134 · Sin apartado «Comprar japonesas» (las japonesas en Compra YA), aviso de idiomas y «Cartas graduadas» como Compra
// YA: graduadas con oportunidad de compra (CardTrader), dónde comprarla y su enlace. Chromium con emulación de iPhone.
// Ejecutar: node tests/v134-graduadas-e2e.cjs · Datos SIMULADOS con el formato público; PRECIOS INVENTADOS.
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
 [273933,150,258,258,263,268,null,null,null],   // Mewtwo · EX o mejor 194 € (75 %) → internacional con beneficio
 [273924,90,300,300,300,300,null,null,null],    // Alakazam · EX o mejor 100 € de ~300 € (33 %, idioma sin indicar) → no se propone
 [861477,193,257,257,257,262,null,null,null]]}; // Pikachu ex M2A 234 japonés
const hits=[];
async function setup(withToken){
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 if(withToken)await ctx.addInitScript(()=>{try{localStorage.setItem('cv_cardtrader_token','eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.prueba')}catch{}});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}},{id:'base4-1',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:299,avg30:301,lowPrice:90,lowPriceExPlus:100}}}]:[];return J({data,totalCount:data.length})}
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);hits.push(p);
   if(p==='/games')return J([{id:5,name:'Pokemon'}]);
   if(p==='/expansions')return J([{id:11,game_id:5,code:'base4',name:'Base Set 2'},{id:21,game_id:5,code:'m2a',name:'MEGA Dream ex'}]);
   if(p.startsWith('/blueprints/export?expansion_id=11'))return J([{id:900,name:'Mewtwo',fixed_properties:{collector_number:'10'}},{id:901,name:'Alakazam',fixed_properties:{collector_number:'1'}}]);
   if(p.startsWith('/blueprints/export?expansion_id=21'))return J([{id:950,name:'Pikachu ex',fixed_properties:{collector_number:'234'}}]);
   const G=(c,co,gr,lang,cc)=>({price_cents:c,graded:true,properties_hash:{grading_company:co,grade:gr,pokemon_language:lang},user:{country_code:cc}});
   if(p.startsWith('/marketplace/products?expansion_id=11'))return J({
    900:[G(2000,'PSA','10','en','XX'),G(15000,'PSA','10','en','IT'),G(23000,'PSA','10','en','FR'),G(26000,'PSA','10','en','DE'),G(9000,'PSA','9','en','ES'),{price_cents:19000,properties_hash:{condition:'Near Mint',pokemon_language:'en'},user:{country_code:'IT'}}],
    901:[G(6000,'BGS','9.5','en','IT'),G(8000,'BGS','9.5','en','DE')]});
   if(p.startsWith('/marketplace/products?expansion_id=21'))return J({950:[G(18000,'PSA','10','jp','JP'),G(30000,'PSA','10','jp','JP')]});
   if(p.startsWith('/marketplace/products'))return J({});
   return route.fulfill({status:404,headers:H,body:'{}'})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));return {browser,page,errors};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 let {browser,page,errors}=await setup(false);
 await page.goto(base);
 await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||'')&&window.CVCompra.state().pt.cards['base4-1'],null,{timeout:120000});await page.waitForTimeout(500);
 ok('Ya no existe el apartado «Comprar japonesas»',!(await page.$('#v4Buy [data-cp-jpbox]'))&&!/Comprar japonesas/.test(await page.textContent('#v4Buy')));
 const ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 ok('«Todos los idiomas»: salen internacionales y japonesas en Compra YA',(await ids()).includes('base4-10')&&(await ids()).includes('jp-861477'),JSON.stringify(await ids()));
 let t=await page.textContent('#v4Buy .cpLangNote');
 ok('Aviso de idiomas: cuántas de cada y por qué faltan internacionales (anuncio barato sin idioma = coreano o chino)',/✅ 1 compra\(s\) en japonés y 1 internacional\(es\) confirmada\(s\) · 🔎 1 internacional\(es\) con precio objetivo en inglés/.test(t),t);
 await page.selectOption('[data-cp-view="lang"]','ja');await page.waitForTimeout(400);
 ok('Idioma «Japonés»: las japonesas salen en Compra YA (y solo ellas)',JSON.stringify(await ids())==='["jp-861477"]',JSON.stringify(await ids()));
 t=await page.textContent('#v4Buy #cp-jp-861477');
 ok('La ficha japonesa lleva el precio real de Cardmarket y «Dónde comprarla» (solo sitios con precio)',/Cardmarket, solo japonesas:/.test(t)&&/Dónde comprarla más barata/.test(t)&&!/Zenpan EU/.test(t),t.slice(0,300));
 ok('V135: la ficha japonesa ya no lleva calculadora sin precio',!(await page.$('#v4Buy #cp-jp-861477 [data-cp-jpcalcbox]')));
 // Graduadas sin token
 await page.click('.mainNav [data-tab="pregrade"]');await page.waitForSelector('#cpGraded h4',{timeout:30000});
 t=await page.textContent('#cpGraded');
 ok('Cartas graduadas sin token: explica que CardTrader es la fuente y dónde ponerlo; el analizador manual sigue (plegado)',/Graduadas con oportunidad de compra/.test(t)&&/token de CardTrader/.test(t)&&/Analizar un anuncio que hayas visto/.test(t),t.slice(0,600));
 ok('Sin errores de JavaScript (1)',!errors.length,errors.join(' | '));
 await browser.close();
 // Con token: lista automática
 ({browser,page,errors}=await setup(true));
 await page.goto(base+'#pregrade');
 await page.waitForFunction(()=>/Pagas/.test(document.querySelector('#cpGraded')?.textContent||''),null,{timeout:120000});
 t=await page.textContent('#cpGraded');
 // PSA 10 Mewtwo: 150 € + envío 6 = 156 → siguiente PSA 10 igual 230 € → 230·0,95 − 5 − 156 = +57,50 (el de 20 € es sospechoso: < 30 % de 258 €)
 ok('Graduadas (como Compra YA): 2. PSA 10 Mewtwo · Pagas 156 € en CardTrader → reventa 230 € → +57,50 €',/2\. PSA 10 · Mewtwo · Base Set 2 nº 10\/130 \(inglés\)/.test(t)&&/Pagas 156,00\s€ \(CardTrader, anuncio 150,00\s€ de un vendedor de IT \+ envío\) → revéndela al precio del siguiente PSA 10 igual \(230,00\s€\) → \+57,50\s€ · 3 anuncios iguales · sin graduar vale ~258,00\s€/.test(t),t.slice(0,1200));
 ok('Con su enlace de compra',await page.evaluate(()=>[...document.querySelectorAll('#cpGraded li a')].some(a=>a.href==='https://www.cardtrader.com/cards/900')));
 // Japonesa PSA 10: 180 + 6 = 186 → 300·0,95 − 5 − 186 = +94
 ok('Japonesa graduada (colección por código M2a): PSA 10 Pikachu ex → +94 €, y primera por beneficio',/1\. PSA 10 · Pikachu ex · MEGA Dream ex \(japonés\) nº 234 \(japonés\)/.test(t)&&/\+94,00\s€/.test(t),t.slice(0,600));
 ok('Fuera: la de 20 € (sospechosa), la PSA 9 sin otra igual, la BGS 9,5 que deja +5 € y la no graduada',!/20,00\s€/.test(t)&&!/PSA 9 ·/.test(t)&&!/BGS 9,5 ·/.test(t)&&!/190,00/.test(t),t.slice(0,1500));
 ok('Pide comprobar el certificado',/comprueba el certificado|pide el número de certificado/i.test(t));
 ok('Sin errores de JavaScript (2)',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V134 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
