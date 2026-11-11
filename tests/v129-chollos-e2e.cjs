// V129 · Top 5 dentro del presupuesto (lo que pagas en total, con envío) y «🎲 Chollos por verificar»: anuncios de
// cualquier estado a la mitad de su valor o menos, como el Mewtwo & Mew GX japonés a 50 €. Chromium con emulación de iPhone;
// no es Safari real. Ejecutar: node tests/v129-chollos-e2e.cjs
// Sin Internet: la guía (espejo ZyzyThePizi) y pokemontcg.io se SIMULAN con su formato público.
// Identificadores reales (base4-10 = 273933, base4-1 = 273924; M2A 44 = 861287, M2A 234 = 861477); PRECIOS INVENTADOS.
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
 [273933,150,258,258,263,268,null,null,null],   // Mewtwo · EX+ 95 € → compra fiable
 [273924,60,200,200,200,200,null,null,null],   // Alakazam · EX+ 100 € y un anuncio de cualquier estado a 60 € → fiable Y chollo: sale una vez
 [861287,100,300,300,300,300,null,null,null],   // Pikachu ex M2A 44 japonés · «desde» 100 € (33 %) y vale ~300 € → chollo
 [861477,240,1000,1000,1000,1000,null,null,null]]};// Pikachu ex M2A 234 japonés · 240 € (pagas 246 € > 200 €) → fuera
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(()=>{try{const u=JSON.parse(localStorage.getItem('cv_v104_user')||'{}');u.cfg=u.cfg||{};if(u.cfg.minMargin==null){u.cfg.minMargin=0;localStorage.setItem('cv_v104_user',JSON.stringify(u))}}catch{}});/* V139: estas pruebas no miden el margen mínimo */
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}},{id:'base4-1',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:200,avg30:200,lowPrice:60,lowPriceExPlus:100}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||'')&&window.CVCompra.state().pt.cards['base4-1'],null,{timeout:120000});
 await page.waitForTimeout(800);
 const top=await page.textContent('#v4Buy .cpTop');
 const pays=[...top.matchAll(/Pagas ([\d.]+,\d\d)\s€/g)].map(m=>Number(m[1].replace(/\./g,'').replace(',','.')));
 ok('Top 5: todo lo que pagas (con envío) es ≤ 200 €',pays.length>=2&&pays.every(v=>v<=200),JSON.stringify(pays));
 ok('Top 5: la japonesa de 1.000 € con anuncio a 240 € no aparece (pagarías 246 €)',!/246,00\s€/.test(top)&&!/MEGA Dream ex \(japonés\) nº 234/.test(top),top);
 ok('Top 5: el chollo japonés (100 € de cualquier estado, vale ~300 €) aparece como «🎲 por verificar»',/Pikachu ex[^]*🎲 por verificar[^]*Pagas 106,00\s€ \(anuncio de cualquier estado a 100,00\s€ \+ envío\) → vale ~300,00\s€/.test(top),top);
 ok('Top 5: Alakazam internacional (EX o mejor a 100 €, 50 % de su valor: idioma sin indicar) no entra, ni como compra ni como chollo',!/Alakazam/.test(top),top);
 const ch=await page.textContent('#v4Buy [data-cp-chollo]');
 ok('Panel «🎲 Chollos por verificar»: solo la japonesa (mismo idioma seguro), sin Alakazam internacional ni la de 246 €',/Chollos por verificar/.test(ch)&&/Pikachu ex/.test(ch)&&!/Alakazam/.test(ch)&&/internacional(es)? descartadas?/.test(ch)&&!/246,00\s€/.test(ch),ch.slice(0,900));
 const hrefs=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy [data-cp-chollo] li a')].map(a=>a.href));
 ok('Chollos: el enlace abre la ficha SIN filtro de estado (para ver ese mismo anuncio)',hrefs.length>=1&&hrefs.every(h=>!/minCondition/.test(h))&&hrefs.some(h=>/idProduct=861287/.test(h)),JSON.stringify(hrefs));
 const t=await page.textContent('#v4Buy .cpBox');
 ok('Aviso: compra máxima por carta en total, con envío',/Compra máxima por carta: 200,00\s€ en total, con envío/.test(t),t.slice(0,600));
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V129 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
