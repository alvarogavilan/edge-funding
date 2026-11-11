// V136 · CardTrader «HTTP 500» con el token pegado (se limpia, se comprueba su forma y caducidad, y si /info falla se
// prueba el resto) y «Todos los idiomas» con internacionales marcadas «IDIOMA POR CONFIRMAR». Chromium con emulación
// de iPhone. Ejecutar: node tests/v136-token-idiomas-e2e.cjs · Datos SIMULADOS; tokens de prueba inventados.
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
 [273933,150,258,258,263,268,null,null,null],   // Mewtwo · EX o mejor 194 € (75 %): idioma probable
 [273924,90,300,300,300,300,null,null,null],    // Alakazam · EX o mejor 100 € de ~300 € (33 %): idioma POR CONFIRMAR
 [861477,193,257,257,257,262,null,null,null]]}; // Pikachu ex M2A 234 japonés
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
const TOK='eyJhbGciOiJIUzI1NiJ9.'+b64({exp:4102444800})+'.firma',OLD='eyJhbGciOiJIUzI1NiJ9.'+b64({exp:1700000000})+'.firma';
const hits=[];
async function setup(stored){
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 if(stored!=null)await ctx.addInitScript(t=>{try{localStorage.setItem('cv_cardtrader_token',t)}catch{}},stored);
 await ctx.addInitScript(()=>{try{const u=JSON.parse(localStorage.getItem('cv_v104_user')||'{}');u.cfg=u.cfg||{};if(u.cfg.minMargin==null){u.cfg.minMargin=0;localStorage.setItem('cv_v104_user',JSON.stringify(u))}}catch{}});/* V139: estas pruebas no miden el margen mínimo */
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}},{id:'base4-1',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:299,avg30:301,lowPrice:90,lowPriceExPlus:100}}}]:[];return J({data,totalCount:data.length})}
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);hits.push(p+' '+route.request().headers()['authorization']);
   if(route.request().headers()['authorization']!=='Bearer '+TOK)return route.fulfill({status:500,headers:H,body:'<html><body>Internal Server Error</body></html>'});
   if(p==='/info')return route.fulfill({status:500,headers:H,body:'Internal Server Error'});// /info falla, el resto funciona
   if(p==='/games')return J([{id:5,name:'Pokemon'}]);
   if(p==='/expansions')return J([]);
   return J({})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));return {browser,page,errors};
}
const shops=async page=>{await page.evaluate(()=>{document.querySelectorAll('#v4Buy details.v4settings').forEach(d=>d.open=true)});return page.textContent('#v4Buy .cpShops')};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 // 1) token pegado con «Bearer », comillas, espacios y salto de línea → se limpia; /info da 500 pero /games funciona
 let {browser,page,errors}=await setup('  "Bearer '+TOK.slice(0,20)+'\n'+TOK.slice(20)+'"  ');
 await page.goto(base);
 await page.waitForFunction(()=>/conectado/.test(document.querySelector('#v4Buy .cpShops')?.textContent||''),null,{timeout:150000});
 let t=await shops(page);
 ok('Token pegado con «Bearer», comillas y salto de línea: se limpia y CardTrader responde',hits.some(h=>h==='/games Bearer '+TOK),JSON.stringify(hits.slice(0,4)));
 ok('/info da HTTP 500 pero el resto funciona: ✓ conectado (y lo explica) con la fecha de caducidad del token',/✓ conectado \(funciona; \/info dio error en CardTrader · token válido hasta 1\/1\/2100\)/.test(t),t);
 // 2) «Todos los idiomas»: las internacionales vuelven, marcadas
 const ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 await page.waitForFunction(()=>window.CVCompra.state().pt.cards['base4-1'],null,{timeout:120000});await page.waitForTimeout(800);
 const L=await ids();
 ok('…lista con las tres: Mewtwo, Alakazam y Pikachu ex japonés',['base4-10','base4-1','jp-861477'].every(i=>L.includes(i)),JSON.stringify(L));
 t=await page.textContent('#v4Buy #cp-base4-1');
 ok('V138 · Alakazam marcada «🔎 BUSCA EN INGLÉS» con su precio máximo (≤ 194 € para ganar 40 €)',/🔎 BUSCA EN INGLÉS/.test(t)&&/≤ 194,00\s€/.test(t),t.slice(0,600));
 ok('Su enlace abre solo los anuncios en INGLÉS (EX o mejor) para ver el precio real',await page.getAttribute('#v4Buy #cp-base4-1 .v4actions a','href')==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=273924&language=1&minCondition=3');
  ok('No entra en el Top 5',!/Alakazam/.test(await page.textContent('#v4Buy .cpTop')));
 t=await page.textContent('#v4Buy .cpLangNote');
 ok('Aviso de idiomas: 1 compra en japonés, 1 internacional confirmada y 1 con precio objetivo',/✅ 1 compra\(s\) en japonés y 1 internacional\(es\) confirmada\(s\) · 🔎 1 internacional\(es\) con precio objetivo en inglés/.test(t),t);
 await page.selectOption('[data-cp-view="lang"]','en');await page.waitForTimeout(400);
 ok('Idioma «Inglés»: salen las internacionales (no solo japonesas)',(await ids()).includes('base4-10')&&(await ids()).includes('base4-1')&&!(await ids()).includes('jp-861477'),JSON.stringify(await ids()));
 ok('Sin errores de JavaScript (1)',!errors.length,errors.join(' | '));
 await browser.close();
 // 3) token mal copiado y token caducado: lo dice claro, sin llamar a CardTrader
 ({browser,page,errors}=await setup('abc123'));await page.goto(base);
 await page.waitForFunction(()=>/✗/.test(document.querySelector('#v4Buy .cpShops')?.textContent||''),null,{timeout:150000});
 ok('Token mal copiado: «no tiene la forma de un token de CardTrader»',/no tiene la forma de un token de CardTrader/.test(await shops(page)));
 await browser.close();
 ({browser,page,errors}=await setup(OLD));await page.goto(base);
 await page.waitForFunction(()=>/✗/.test(document.querySelector('#v4Buy .cpShops')?.textContent||''),null,{timeout:150000});
 ok('Token caducado: dice la fecha y cómo generar uno nuevo',/caducó el 14\/11\/2023: genera uno nuevo en CardTrader → Ajustes → API/.test(await shops(page)),await shops(page));
 ok('Sin errores de JavaScript (2)',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V136 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
