// V120 · Confianza por oferta, plan de compra con presupuesto y Vender YA (Mi colección frente a Cardmarket).
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v120-decision-e2e.cjs
// Sin Internet: la guía (espejo ZyzyThePizi) y pokemontcg.io se SIMULAN con su formato público.
// Identificadores reales (base4-10 = 273933; Pikachu ex M2A 234 = 861477, del catálogo japonés); PRECIOS INVENTADOS.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let pw;for(const m of ['playwright','/opt/node22/lib/node_modules/playwright']){try{pw=require(m);break}catch{}}
if(!pw){console.log('PENDIENTE: Playwright no disponible.');process.exit(2)}
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
let n=0;const ok=(name,cond,extra='')=>{console.log((cond?'OK ':'FALLO')+' · '+name+(extra?' · '+extra:''));assert.ok(cond,name+' '+extra);n++};
const GUIDE={fields:['idProduct','low','trend','avg1','avg7','avg30','lowHolo','trendHolo','avg30Holo'],sourceCreatedAt:'2026-10-24T02:45:46+0200',generatedAt:'2026-10-24T08:30:52Z',rows:[
 [273933,150,258,258,263,268,null,null,null],   // base4-10 Mewtwo (todos los idiomas)
 [273924,60,200,240,235,190,null,null,null],   // base4-1 Alakazam · semana +24 % sobre su media → buen momento de venta
 [861477,193,257,257,257,262,null,null,null],   // Pikachu ex M2A 234 · producto JAPONÉS
 [861287,0.5,0.75,null,0.8,0.7,null,null,null]]};
const pasteES=`Disponible
128
Desde
85,00 €
Tendencia de precio
160,00 €
Precio medio 30 días
170,00 €
Precio medio 7 días
165,00 €`;
const pasteEN=`Available items 31 From 115,00 € Price Trend 250,00 € 30-days average price 260,00 € 7-days average price 255,00 € 1-day average price 249,00 €
Seller  Near Mint  English  120,00 €  1
Seller2 Near Mint English 129,99 € 2`;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||''),null,{timeout:90000});
 const T=id=>page.textContent('#v4Buy #cp-'+id),ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 // Mewtwo: versión verificada 25 · se vende a diario 20 · medias 258–268 sobre 258 → ±2 % → 20 · tendencia → 10 · margen 40,10/200 = 20 % → 3 · compra EX o mejor → estado 15 → 93
 let t=await page.textContent('#v4Buy #cp-base4-10 .cpConf');
 ok('Confianza Mewtwo 93/100 con su desglose y beneficio prudente (+37,29 €)',/Confianza 93\/100/.test(t)&&/beneficio prudente \+37,29\s€/.test(t)&&/Versión 25\/25 · ventas 20\/20 · estabilidad 20\/20/.test(t)&&/colchón 3\/10 · estado 15\/15/.test(t),t);
 t=await page.textContent('#v4Buy #cp-jp-861477 .cpConf');
 // Pikachu ex JP («desde» 195 € = 75 % de 260 €): versión 25 · ventas 20 · medias 260–265 sobre 260 → ±1 % → 20 · tendencia 260/265 −2 % → 10 · margen 41/201 = 20 % → 3 · «desde» sin estado → 0 → 78
 ok('Confianza japonesa 78/100: estabilidad 20, colchón 3 y estado 0 con aviso (el «desde» no dice el estado)',/Confianza 78\/100/.test(t)&&/estabilidad 20\/20/.test(t)&&/colchón 3\/10 · estado 0\/15/.test(t)&&/beneficio prudente \+31,32\s€/.test(t),t);
 await page.selectOption('[data-cp-view="sort"]','risk');await page.waitForTimeout(300);
 ok('Orden «Mejor beneficio prudente»: Mewtwo (37,29 €) antes que Pikachu (31,32 €)',(await ids()).slice(0,2).join()==='base4-10,jp-861477',JSON.stringify(await ids()));
 ok('Ya no hay plan de compra con presupuesto',!(await page.$('[data-cp-planbox]')));
 t=await page.textContent('#v4Buy .cpTop');
 ok('🏆 Top 5 de hoy: 1. Mewtwo (EX o mejor, +37,29 € prudente), 2. Pikachu ex japonés (+31,32 €); Alakazam internacional a 60 € (idioma sin indicar) NO entra',/1\. Mewtwo/.test(t)&&/Pagas 200,00\s€ \(Cardmarket, EX o mejor, puesta en 41020\) → venta 258,00\s€ → \+40,10\s€ · confianza 93\/100 · prudente \+37,29\s€/.test(t)&&/2\. Pikachu ex/.test(t)&&/prudente \+31,32\s€/.test(t)&&!/Alakazam/.test(t)&&!/3\./.test(t.split('Une todas')[0]),t);
 {const h=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpTop li a')].map(a=>a.href));ok('Top 5: «Comprar» abre la ficha con el mismo filtro que el precio (Mewtwo EX o mejor; Pikachu «desde» sin filtro)',h[0]==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=273933&minCondition=3'&&h[1]==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=861477',JSON.stringify(h))}
 ok('Top 5 con imagen de cada carta',await page.evaluate(()=>document.querySelectorAll('#v4Buy .cpTop .cpThumb img').length)===2);
 // Vender YA: dos cartas RAW (una en buen momento de venta) y las graduadas de ejemplo
 const sv=await page.evaluate(()=>{const s=window.CVStateBridge.get();s.cards.push({id:'t-ala',universe:'pokemon',name:'Alakazam',set:'Base Set 2',number:'1',grading:'RAW',purchase:120,quantity:1,catalogId:'base4-1'},{id:'t-mew',universe:'pokemon',name:'Mewtwo',set:'Base Set 2',number:'10/130',grading:'RAW',purchase:200,quantity:1},{id:'t-x',universe:'pokemon',name:'Carta Inventada',number:'999',grading:'RAW'});return window.CVStateBridge.save()});
 ok('Cartas de prueba guardadas en Mi colección',sv===true);
 await page.click('.mainNav [data-tab="vender"]');await page.waitForFunction(()=>/Vender YA · tu colección/.test(document.querySelector('#cpSell')?.textContent||''),null,{timeout:30000});
 t=await page.textContent('#cpSell [data-sell="t-ala"]');
 // Alakazam: semana 235 vs mes 190 → +24 % → buen momento; precio sugerido max(trend 200, avg7 235) = 235; neto 235·0,95−5 = 218,25; pagó 120 → +98,25
 ok('Alakazam: 🟢 buen momento (+24 % sobre su media), anuncio 235 €, neto 218,25 €, resultado +98,25 €, mínimo 131,58 €',/Buen momento para vender/.test(t)&&/\+24 %/.test(t)&&/235,00\s€/.test(t)&&/218,25\s€/.test(t)&&/\+98,25\s€/.test(t)&&/131,58\s€/.test(t),t);
 t=await page.textContent('#cpSell [data-sell="t-mew"]');
 // Mewtwo por nombre y número: estable; anuncio = tendencia 258; neto 240,10; pagó 200 → +40,10; mínimo (200+5)/0,95 = 215,79
 ok('Mewtwo (emparejado por nombre y número): estable, neto 240,10 €, resultado +40,10 € y aviso de precio mínimo 215,79 €',/Precio estable/.test(t)&&/240,10\s€/.test(t)&&/\+40,10\s€/.test(t)&&/215,79\s€/.test(t)&&/nombre y número/.test(t),t);
 const all=await page.textContent('#cpSell');
 ok('Carta sin catálogo: lo dice sin inventar precio',/Carta Inventada.*No la encuentro en el catálogo/.test(all));
 ok('Cartas graduadas: no se valoran con la guía de cartas sin graduar',/Carta graduada: la guía de Cardmarket es de cartas sin graduar/.test(all));
 ok('Resumen: neto total 458,35 € (Mewtwo 240,10 + Alakazam 218,25) y 1 en buen momento',/458,35\s€/.test(all)&&/1🟢 en buen momento de venta/.test(all),all.slice(0,300));
 const order=await page.evaluate(()=>[...document.querySelectorAll('#cpSell [data-sell]')].map(a=>a.dataset.sell));
 ok('Primero lo que conviene vender',order[0]==='t-ala',JSON.stringify(order));
 await page.selectOption('[data-sell-view="show"]','go');await page.waitForTimeout(300);
 ok('Filtro «Solo buen momento de venta»',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('#cpSell [data-sell]')].map(a=>a.dataset.sell)))==='["t-ala"]');
 ok('«Vender en Cardmarket» abre el producto exacto',await page.getAttribute('#cpSell [data-sell="t-ala"] .v4actions a','href')==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=273924');
 for(const w of [320,430]){await page.setViewportSize({width:w,height:800});await page.waitForTimeout(200);
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Vender YA sin desbordamiento horizontal · '+w+' px',o.sw<=o.iw,JSON.stringify(o))}
 await page.click('.mainNav [data-tab="radar"]');await page.waitForTimeout(300);
 {const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Compra YA con plan y confianza sin desbordamiento · 430 px',o.sw<=o.iw,JSON.stringify(o))}
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V120 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
