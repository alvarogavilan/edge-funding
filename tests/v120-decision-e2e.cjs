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
 [273933,90,160,160,165,170,null,null,null],   // base4-10 Mewtwo (todos los idiomas)
 [273924,60,200,240,235,190,null,null,null],   // base4-1 Alakazam · semana +24 % sobre su media → buen momento de venta
 [861477,100,200,195,190,210,null,null,null],   // Pikachu ex M2A 234 · producto JAPONÉS
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
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:158,avg30:168,lowPrice:90,lowPriceExPlus:95}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||''),null,{timeout:90000});
 const T=id=>page.textContent('#v4Buy #cp-'+id),ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 // Mewtwo: versión verificada 25 · se vende a diario 20 · medias 160–170 sobre 160 → ±3 % → 20 · tendencia 165/170 −3 % → 10 · margen 46/101 = 45 % → 7 · compra EX o mejor → estado 15 → 97
 let t=await page.textContent('#v4Buy #cp-base4-10 .cpConf');
 ok('Confianza Mewtwo 97/100 con su desglose y beneficio prudente (+44,62 €)',/Confianza 97\/100/.test(t)&&/beneficio prudente \+44,62\s€/.test(t)&&/Versión 25\/25 · ventas 20\/20 · estabilidad 20\/20/.test(t)&&/colchón 7\/10 · estado 15\/15/.test(t),t);
 t=await page.textContent('#v4Buy #cp-jp-861477 .cpConf');
 // Pikachu ex JP: versión 25 · ventas 20 · medias 190–210 sobre 190 → 10,5 % → 14 · tendencia 190/210 −9,5 % → 5 · margen 69,5/106 = 66 % → 10 · «desde» sin estado → 0 → 74
 ok('Confianza japonesa 74/100: estabilidad 14, tendencia 5 y estado 0 con aviso (el «desde» no dice el estado)',/Confianza 74\/100/.test(t)&&/estabilidad 14\/20/.test(t)&&/tendencia 5\/10/.test(t)&&/estado 0\/15 \(el «desde» no dice el estado/.test(t),t);
 await page.selectOption('[data-cp-view="sort"]','risk');await page.waitForTimeout(300);
 ok('Orden «Mejor beneficio prudente»: Pikachu (51,43 €) antes que Mewtwo (44,62 €)',(await ids()).slice(0,2).join()==='jp-861477,base4-10',JSON.stringify(await ids()));
 // Plan de compra
 await page.evaluate(()=>{document.querySelector('[data-cp-planbox]').open=true});
 await page.fill('[data-cp-plan="budget"]','150');await page.fill('[data-cp-plan="max"]','200');await page.fill('[data-cp-plan="minConf"]','50');await page.click('[data-cp-plancalc]');await page.waitForTimeout(300);
 t=await page.textContent('[data-cp-planbox]');
 ok('Plan con 150 €: elige solo Pikachu ex (106 €), porque las dos no caben',/1 cartas, 106,00\s€/.test(t)&&/Pikachu ex/.test(t)&&!/Mewtwo/.test(t.split('Calcular plan')[1]||''),t.slice(0,400));
 await page.fill('[data-cp-plan="budget"]','300');await page.click('[data-cp-plancalc]');await page.waitForTimeout(300);
 t=await page.textContent('[data-cp-planbox]');
 ok('Plan con 300 €: las dos, 207 € de inversión, +115,50 € de referencia y +96,05 € prudente',/2 cartas, 207,00\s€/.test(t)&&/\+115,50\s€/.test(t)&&/\+96,05\s€/.test(t),t.slice(0,500));
 await page.fill('[data-cp-plan="minConf"]','150');let al='';page.once('dialog',d=>{al=d.message();d.dismiss()});await page.click('[data-cp-plancalc]');await page.waitForTimeout(200);
 ok('Plan: confianza fuera de 0–100 se rechaza',/confianza entre 0 y 100/.test(al),al);
 await page.reload();await page.waitForSelector('[data-cp-planbox]',{timeout:60000,state:'attached'});
 ok('El plan recuerda presupuesto y límites',await page.inputValue('[data-cp-plan="budget"]')==='300');
 // Vender YA: dos cartas RAW (una en buen momento de venta) y las graduadas de ejemplo
 const sv=await page.evaluate(()=>{const s=window.CVStateBridge.get();s.cards.push({id:'t-ala',universe:'pokemon',name:'Alakazam',set:'Base Set 2',number:'1',grading:'RAW',purchase:120,quantity:1,catalogId:'base4-1'},{id:'t-mew',universe:'pokemon',name:'Mewtwo',set:'Base Set 2',number:'10/130',grading:'RAW',purchase:200,quantity:1},{id:'t-x',universe:'pokemon',name:'Carta Inventada',number:'999',grading:'RAW'});return window.CVStateBridge.save()});
 ok('Cartas de prueba guardadas en Mi colección',sv===true);
 await page.click('.mainNav [data-tab="vender"]');await page.waitForFunction(()=>/Vender YA · tu colección/.test(document.querySelector('#cpSell')?.textContent||''),null,{timeout:30000});
 t=await page.textContent('#cpSell [data-sell="t-ala"]');
 // Alakazam: semana 235 vs mes 190 → +24 % → buen momento; precio sugerido max(trend 200, avg7 235) = 235; neto 235·0,95−5 = 218,25; pagó 120 → +98,25
 ok('Alakazam: 🟢 buen momento (+24 % sobre su media), anuncio 235 €, neto 218,25 €, resultado +98,25 €, mínimo 131,58 €',/Buen momento para vender/.test(t)&&/\+24 %/.test(t)&&/235,00\s€/.test(t)&&/218,25\s€/.test(t)&&/\+98,25\s€/.test(t)&&/131,58\s€/.test(t),t);
 t=await page.textContent('#cpSell [data-sell="t-mew"]');
 // Mewtwo por nombre y número: estable; anuncio = tendencia 160; neto 147; pagó 200 → −53; mínimo (200+5)/0,95 = 215,79
 ok('Mewtwo (emparejado por nombre y número): estable, neto 147 €, resultado −53 € y aviso de precio mínimo 215,79 €',/Precio estable/.test(t)&&/147,00\s€/.test(t)&&/−53,00\s€/.test(t)&&/215,79\s€/.test(t)&&/nombre y número/.test(t),t);
 const all=await page.textContent('#cpSell');
 ok('Carta sin catálogo: lo dice sin inventar precio',/Carta Inventada.*No la encuentro en el catálogo/.test(all));
 ok('Cartas graduadas: no se valoran con la guía de cartas sin graduar',/Carta graduada: la guía de Cardmarket es de cartas sin graduar/.test(all));
 ok('Resumen: neto total 365,25 € y 1 en buen momento',/365,25\s€/.test(all)&&/1🟢 en buen momento de venta/.test(all),all.slice(0,300));
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
