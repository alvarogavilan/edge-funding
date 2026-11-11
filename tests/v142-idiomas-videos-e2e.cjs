// V142 · Todos los idiomas con su propio precio: alemán, francés, italiano, español, portugués, coreano y chino desde
// CardTrader (idioma comprobado), venta estimada con los demás vendedores de ESE idioma (nunca con el precio de la
// inglesa), barrido por idioma y vídeos de autenticidad/análisis. Ejecutar: node tests/v142-idiomas-videos-e2e.cjs
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
const GUIDE={fields:F,sourceCreatedAt:'2026-10-28T02:45:46+0200',generatedAt:'2026-10-28T08:30:52Z',rows:[[273924,60,250,250,250,250,null,null,null]]};// Alakazam · Base Set 2 · vale 250 €
const TOK='eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.firma';
const P=(id,eur,lang,user)=>({id,price:{cents:Math.round(eur*100),currency:'EUR'},quantity:1,properties_hash:{condition:'Near Mint',pokemon_language:lang},user:{username:user,country_code:'DE',can_sell_via_hub:true},graded:false});
// alemán: 60 € y los demás piden 120-140 → venta = mediana 130 × 0,95 = 123,50 · coreano: 20 € y los demás ~55 (no da) · inglés: 240 €
const BY={de:[P(1,60,'de','hans'),P(2,120,'de','a'),P(3,125,'de','b'),P(4,130,'de','c'),P(5,140,'de','d')],kr:[P(6,20,'kr','kim'),P(7,50,'kr','e'),P(8,55,'kr','f'),P(9,58,'kr','g')],en:[P(10,240,'en','bob')]};
const calls=[];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(t=>{try{localStorage.setItem('cv_cardtrader_token',t);localStorage.setItem('cv_v104_user',JSON.stringify({minMargin:25}))}catch{}},TOK);
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/'))return J({rates:{EUR:0.9},date:'2026-10-28'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  if(u.startsWith('https://api.pokemontcg.io/'))return route.fulfill({status:429,headers:H,body:'{}'});
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);calls.push(p);
   if(p==='/info')return J({id:1,name:'Card Vault'});
   if(p==='/games')return J([{id:5,name:'Pokemon'},{id:18,name:'Disney Lorcana'}]);
   if(p==='/expansions')return J([{id:41,game_id:5,code:'b2',name:'Base Set 2'}]);
   if(p.startsWith('/blueprints/export?expansion_id=41'))return J([{id:777,name:'Alakazam',fixed_properties:{collector_number:'1'},card_market_ids:[273924]}]);
   const m=p.match(/^\/marketplace\/products\?(?:expansion_id=41|blueprint_id=777)(?:&language=([\w-]+))?$/);
   if(m)return J({777:m[1]?(BY[m[1]]||[]):BY.en.concat(BY.kr).slice(0,25)});// sin idioma: los más baratos (sin las alemanas)
   if(p.startsWith('/shipping_methods'))return J([{price:{cents:500,currency:'EUR'}}]);
   return J([])}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#v4Buy [data-cp-view="lang"] option[value="ko"]')&&document.querySelector('#v4Buy .cpBox'),null,{timeout:120000});
 const opts=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy [data-cp-view="lang"] option')].map(o=>o.textContent));
 ok('Idiomas del filtro: también coreano y chino',['Inglés','Español','Francés','Alemán','Italiano','Portugués','Japonés','Coreano','Chino'].every(l=>opts.includes(l)),opts.join(', '));
 // 1) Alemán
 await page.selectOption('[data-cp-view="lang"]','de');
 await page.waitForFunction(()=>/✅ COMPRA en CardTrader · ALEMÁN/.test(document.querySelector('#v4Buy #cp-base4-1 .cpDecide')?.textContent||''),null,{timeout:120000});
 let t=await page.textContent('#v4Buy #cp-base4-1 .cpDecide');
 // 60 + 5 envío = 65 · venta min(130×0,95; 250) = 123,50 → 123,50×0,95 − 5 − 65 = +47,33
 ok('Alemán: «✅ COMPRA en CardTrader · ALEMÁN · Pagas 65 € → la vendes en alemán a 123,50 € → ganas +47,33 €»',/Pagas 65,00\s€/.test(t)&&/la vendes en alemán \(Cardmarket o CardTrader\) a 123,50\s€/.test(t)&&/ganas \+47,3[23]\s€/.test(t),t);
 ok('…explica de dónde sale la venta (los otros 4 vendedores de alemán, −5 %, nunca por encima de su valor) y no usa el precio de la inglesa (250 €)',/otros 4 vendedores de alemán/.test(t)&&/250,00\s€/.test(t)&&!/a 250,00\s€/.test(t),t);
 ok('Barrido de la colección EN ALEMÁN (una consulta: expansion_id=41&language=de)',calls.includes('/marketplace/products?expansion_id=41&language=de'),calls.join(' '));
 t=await page.textContent('#v4Buy .cpLangNote');
 ok('Aviso del idioma: «no se usa el precio de la inglesa»',/Alemán:/.test(t)&&/no se usa el precio de la inglesa/.test(t)&&/1 compra\(s\) en alemán/.test(t),t);
 // 2) Todos los idiomas: la compra en alemán sale con su idioma
 await page.selectOption('[data-cp-view="lang"]','all');await page.waitForTimeout(500);
 t=await page.textContent('#v4Buy #cp-base4-1 .cpDecide');
 ok('«Todos los idiomas»: Alakazam sale como compra en ALEMÁN',/COMPRA en CardTrader · ALEMÁN/.test(t),t);
 t=await page.textContent('#v4Buy .cpTop');
 ok('Top 5 con el idioma: «ALEMÁN» y «CardTrader, alemán NM/EX»',/Alakazam/.test(t)&&/ALEMÁN/.test(t)&&/CardTrader, alemán NM\/EX/.test(t),t.slice(0,300));
 // 3) Inglés: la alemana no cuenta
 await page.selectOption('[data-cp-view="lang"]','en');await page.waitForTimeout(500);
 t=await page.evaluate(()=>document.querySelector('#v4Buy #cp-base4-1 .cpDecide')?.textContent||'');
 ok('«Inglés»: la compra en alemán no se ofrece como inglesa',!/ALEMÁN/.test(t),t);
 // 4) Coreano: no da beneficio y no se inventa con el precio de la inglesa
 await page.selectOption('[data-cp-view="lang"]','ko');
 await page.waitForFunction(()=>(window.CVCompra.ctState().ctRes['base4-1']?.rows||[]).some(r=>r.lang==='ko'),null,{timeout:60000});await page.evaluate(()=>window.CVCompra.render());await page.waitForTimeout(300);
 t=await page.textContent('#v4Buy #cp-base4-1 .cpDecide');
 ok('Coreano: la de 20 € NO es compra (los demás coreanos piden ~55 €; con el precio de la inglesa saldría +192 € falso): «🔎 POR COMPROBAR EN COREANO», sin beneficio',/POR COMPROBAR EN COREANO/.test(t)&&/no te doy un beneficio inventado/.test(t)&&/CardTrader tiene anuncios en coreano pero ninguno deja tu beneficio/.test(t)&&!/COMPRA|ganas/.test(t),t);
 ok('…con el enlace a Cardmarket solo en coreano',await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-base4-1 .cpDecide a')].some(a=>/language=10/.test(a.href))));
 const rows=await page.evaluate(()=>window.CVCompra.ctState().ctRes['base4-1'].rows.map(r=>r.lang).sort().join());
 ok('El barrido en coreano no borra lo que ya había en alemán e inglés',rows==='de,en,ko',rows);
 // 5) Vídeos
 await page.selectOption('[data-cp-view="lang"]','all');await page.waitForTimeout(400);
 const yt=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-base4-1 a[href*="youtube.com"]')].map(a=>a.textContent+' '+decodeURIComponent(a.href)));
 ok('Vídeos: «🎥 ¿Es auténtica?» y «📺 Análisis de su precio» (búsqueda en YouTube de esa carta)',yt.length===2&&/¿Es auténtica\?.*Alakazam Base Set 2 pokemon real vs fake/.test(yt[0])&&/Análisis de su precio.*Alakazam Base Set 2 pokemon price analysis/.test(yt[1]),yt.join(' | '));
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V142 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
