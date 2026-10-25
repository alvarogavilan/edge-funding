// V130 · Escudo anti-proxy: el chollo del Mewtwo & Mew GX japonés a 50 € era una carta PROXY (falsa). Un anuncio por
// debajo del 30 % de su valor no se propone nunca; «🚫 Es proxy o falsa» oculta un anuncio; detector de palabras de proxy.
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v130-antiproxy-e2e.cjs
// Sin Internet: la guía y pokemontcg.io se SIMULAN con su formato público. PRECIOS INVENTADOS salvo el caso 50 € / ~638 €.
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
 [273924,60,200,200,200,200,null,null,null],   // Alakazam · anuncio de cualquier estado a 60 € (30 %) → chollo por verificar
 [273925,30,300,300,300,300,null,null,null],   // Blastoise · EX+ 30 € y vale ~300 € (10 %) → casi seguro proxy: ni punto de mira ni restaurar
 [861287,50,638,638,638,638,null,null,null]]};// caso real: japonesa a 50 € frente a ~638 € (8 %) → el anuncio era PROXY: descartada
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY'))return J({rates:{EUR:0.0058},date:'2026-10-24'});
  if(u.startsWith('https://api.frankfurter.app/latest?from=USD'))return J({rates:{EUR:0.9},date:'2026-10-24'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}},{id:'base4-1',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:200,avg30:200,lowPrice:60,lowPriceExPlus:100}}},{id:'base4-2',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:300,avg30:300,lowPrice:30,lowPriceExPlus:30}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||'')&&window.CVCompra.state().pt.cards['base4-1'],null,{timeout:120000});
 await page.waitForTimeout(800);
 const ids=await page.evaluate(()=>window.CVCompra.chollos(window.CVCompra.cfg()).map(o=>o.x.id));
 const top=await page.textContent('#v4Buy .cpTop'),ch=await page.textContent('#v4Buy [data-cp-chollo]');
 ok('La japonesa a 50 € que vale ~638 € (8 %) NO sale: ni en chollos ni en el Top 5',!ids.some(i=>/861287/.test(i))&&!/nº 44/.test(top)&&!/50,00\s€/.test(top),JSON.stringify(ids)+' '+top);
 ok('Escudo anti-proxy visible con lo descartado hoy',/Escudo anti-proxy: 1 anuncio\(s\) por debajo del 30 % de su valor descartados hoy/.test(ch),ch.slice(-700));
 ok('Blastoise «EX o mejor» a 30 € de una carta de ~300 € (10 %) tampoco entra en el Top 5 como compra fiable',!/Blastoise/.test(top),top);
 const sn=await page.evaluate(()=>window.CVCompra.sniper().map(o=>o.x.id));
 ok('Punto de mira: el EX o mejor a 30 € de una carta de ~300 € (10 %) no sale',!sn.includes('base4-2'),JSON.stringify(sn));
 const po=await page.evaluate(()=>{const x=window.CVCompra.cardsPk().find(c=>c.id==='base4-2');return x?x.ops.filter(o=>o.k==='po').length:-1});
 ok('Restaurar: tampoco se propone comprar el anuncio del 10 %',po===0,String(po));
 ok('V131: Alakazam internacional a 60 € (30 %) ya no es chollo: idioma sin comprobar',!ids.includes('base4-1')&&/internacional(es)? descartadas?/.test(ch),ch.slice(-500));
 ok('Antes de pagar: punto «Que no sea proxy ni falsa»',await page.evaluate(()=>/Que no sea proxy ni falsa/.test([...document.querySelectorAll('#v4Buy .cpCheck')].map(e=>e.textContent).join(' '))));
 ok('V131: ya no hay botón «🚫 Es proxy o falsa» (cada anuncio lo miras tú)',!(await page.$('[data-cp-bad]'))&&!/Es proxy o falsa/.test(await page.textContent('#v4Buy')));
 // comprobador de descripción
 await page.waitForSelector('#v4Buy [data-cp-fakebox]',{state:'attached',timeout:60000});
 await page.evaluate(()=>{document.querySelector('#v4Buy [data-cp-chollo]').open=true;document.querySelector('#v4Buy [data-cp-fakebox]').open=true});
 await page.fill('#v4Buy [data-cp-faketxt]','Mewtwo & Mew GX 098/094 SM11 - Carta PROXY de alta calidad, no original');
 await page.click('#v4Buy [data-cp-fakecheck]');
 let v=await page.textContent('#v4Buy [data-cp-fakeout]');
 ok('Comprobador: «Carta PROXY… no original» → NO LA COMPRES',/NO LA COMPRES/.test(v)&&/proxy/.test(v)&&/no original/.test(v),v);
 await page.fill('#v4Buy [data-cp-faketxt]','Near Mint, enviada en funda y toploader, envío certificado');
 await page.click('#v4Buy [data-cp-fakecheck]');v=await page.textContent('#v4Buy [data-cp-fakeout]');
 ok('Comprobador: anuncio normal → sin palabras de proxy (y recuerda mirar fotos)',/No veo palabras de proxy/.test(v),v);
 const w=await page.evaluate(()=>['Proxy card','RÉPLICA','custom art','fan made','Orica','not original','カード プロキシ','approximately mint','Near Mint'].map(t=>window.CVCompra.fakeWords(t).length>0));
 ok('Palabras de proxy en varios idiomas (y sin falsos positivos como «approximately»)',JSON.stringify(w)==='[true,true,true,true,true,true,true,false,false]',JSON.stringify(w));
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V130 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
