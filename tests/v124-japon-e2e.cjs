// V124 · Importar de Japón: máximo en yenes que se puede pagar en Japón para revender en Cardmarket desde 41020.
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v124-japon-e2e.cjs
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
const F=['idProduct','low','trend','avg1','avg7','avg30','lowHolo','trendHolo','avg30Holo'];
const GUIDE={fields:F,sourceCreatedAt:'2026-10-24T02:45:46+0200',generatedAt:'2026-10-24T08:30:52Z',rows:[
 [273933,90,160,160,165,170,null,null,null],   // base4-10 Mewtwo (verificada, EX+ 95 €)
 [273924,30,200,200,205,210,null,null,null],   // base4-1 Alakazam · vale ~200 € y hay un anuncio a 30 € → punto de mira
 [574435,560,900,null,null,null,null,null,null],// Evolving Skies Booster Box · «desde» 62 % de su tendencia
 [583510,150,290,null,null,null,null,null,null],// Brilliant Stars ETB
 [271439,250,270,null,null,null,null,null,null],// Phantom Forces Booster
 [861477,195,260,260,260,265,null,null,null],   // Pikachu ex M2A 234 · producto japonés (venta de referencia 190 €)
 [861287,0.5,0.75,null,0.8,0.7,null,null,null]]};// Pikachu ex M2A 44 · japonés barato
const PREV={...GUIDE,sourceCreatedAt:'2026-10-23T02:45:00+0200',rows:[[273933,90,160,160,165,170,null,null,null],[273924,120,200,200,205,210,null,null,null],[574435,560,880,null,null,null,null,null,null],[583510,150,290,null,null,null,null,null,null],[271439,250,262,null,null,null,null,null,null]]};
const OLD={...GUIDE,sourceCreatedAt:'2026-10-11T02:45:00+0200',rows:[[574435,600,850,null,null,null,null,null,null],[583510,150,280,null,null,null,null,null,null],[271439,240,220,null,null,null,null,null,null]]};
const LOR={sets:[{id:'tfc',name:'The First Chapter'}]},LORSET={updatedAt:'2026-10-24',cards:[{id:'tfc-1',name:'Mickey Mouse - Brave Little Tailor',number:'1',rarity:'Legendary',imageSmall:'https://images.example/m.png',cardmarketId:681001,variants:[{name:'normal',eur:{trend:60,low:55,avg30:62,avg7:61,avg1:60}}]}]};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});let fxHits=0;
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY&to=EUR')){fxHits++;return J({amount:1,base:'JPY',date:'2026-10-24',rates:{EUR:0.0058}})}
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:158,avg30:168,lowPrice:90,lowPriceExPlus:95}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/¥23\.100/.test(document.querySelector('#v4Buy #cp-jp-861477')?.textContent||''),null,{timeout:120000});
 // venta 300 € → neta 300·0,95 − 5 = 280 → coste máximo 240 → (240 − 15) / 1,21 − 20 = 165,95 € → / 0,0058 = 28.612 ¥ → 23.100 ¥ ≈ 133,98 €
 let t=await page.textContent('#v4Buy #cp-jp-861477 .cpLangSel');
 ok('Pikachu ex japonés: paga en Japón como máximo ¥23.100 (≈ 133,98 €) con envío 20 €, IVA 21 % y gestión 15 €',/paga como máximo ¥23\.100 \(≈ 133,98\s€\)/.test(t)&&/revendiéndola aquí a 260,00\s€/.test(t)&&/IVA 21 %/.test(t),t);
 const links=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-jp-861477 .cpLangSel a')].map(a=>a.href));
 ok('Búsquedas en Japón con código de colección, número y nombre',links[0]==='https://buyee.jp/mercari/search?keyword=M2A%20234%20Pikachu%20ex'&&links[1]==='https://buyee.jp/item/search/query/M2A%20234%20Pikachu%20ex'&&links.length===3,JSON.stringify(links));
 ok('Cambio del BCE descargado una vez',fxHits===1,String(fxHits));
 await page.evaluate(()=>{document.querySelector('[data-cp-jpbox]').open=true});t=await page.textContent('[data-cp-jpbox]');
 ok('Panel «Importar de Japón»: la carta con su máximo y el aviso de intermediario e IVA',/Pikachu ex/.test(t)&&/¥23\.100/.test(t)&&/Buyee/.test(t)&&/pagas IVA y gestión/.test(t),t.slice(0,300));
 ok('No entra la japonesa barata (M2A 44, 0,75 €)',!/Mercari \(vía Buyee\)/.test(await page.textContent('#v4Buy .cpBox').then(s=>s.split('Pikachu ex · MEGA Dream ex (japonés) nº 44')[1]||'')));
 await page.fill('[data-cp-jp="handling"]','0');await page.fill('[data-cp-jp="ship"]','10');await page.click('[data-cp-jpsave]');await page.waitForTimeout(300);
 // (240 − 0) / 1,21 − 10 = 188,35 € → 32.474 ¥ → 27.000 ¥
 t=await page.textContent('#v4Buy #cp-jp-861477 .cpLangSel');
 ok('Con envío 10 € y gestión 0 € (Correos): máximo ¥27.000',/¥27\.000/.test(t),t);
 await page.reload();await page.waitForSelector('#v4Buy #cp-jp-861477',{timeout:60000});await page.waitForTimeout(800);
 ok('Tras recargar se conservan los gastos y no se vuelve a pedir el cambio',/¥27\.000/.test(await page.textContent('#v4Buy #cp-jp-861477 .cpLangSel'))&&fxHits===1,String(fxHits));
 ok('Las cartas no japonesas no llevan la línea de Japón',!(await page.textContent('#v4Buy #cp-base4-10')).includes('Comprar en Japón'));
 // Repintado en segundo plano mientras escribes en «Pegar datos»: no se cierra ni se borra
 await page.evaluate(()=>{document.querySelector('#v4Buy #cp-base4-10 .cpPaste').open=true});
 await page.selectOption('#v4Buy #cp-base4-10 [data-cp-pastelang]','it');await page.fill('#v4Buy #cp-base4-10 [data-cp-paste]','Desde 70,00 €');await page.focus('#v4Buy #cp-base4-10 [data-cp-paste]');
 await page.evaluate(()=>window.CVCompra.bgRender());await page.waitForTimeout(400);
 let st=await page.evaluate(()=>({open:document.querySelector('#v4Buy #cp-base4-10 .cpPaste').open,txt:document.querySelector('#v4Buy #cp-base4-10 [data-cp-paste]').value,focus:document.activeElement?.matches('[data-cp-paste]')}));
 ok('Mientras escribes, el repintado en segundo plano espera: cuadro abierto, texto y foco intactos',st.open&&st.txt==='Desde 70,00 €'&&st.focus,JSON.stringify(st));
 await page.evaluate(()=>document.activeElement.blur());await page.waitForTimeout(500);
 st=await page.evaluate(()=>({open:document.querySelector('#v4Buy #cp-base4-10 .cpPaste').open,txt:document.querySelector('#v4Buy #cp-base4-10 [data-cp-paste]').value,lang:document.querySelector('#v4Buy #cp-base4-10 [data-cp-pastelang]').value}));
 ok('Al salir del campo se repinta y se conservan cuadro abierto, idioma elegido y texto',st.open&&st.txt==='Desde 70,00 €'&&st.lang==='it',JSON.stringify(st));
 await page.evaluate(()=>window.CVCompra.render());
 st=await page.evaluate(()=>({open:document.querySelector('#v4Buy #cp-base4-10 .cpPaste').open,txt:document.querySelector('#v4Buy #cp-base4-10 [data-cp-paste]').value}));
 ok('Un repintado directo también conserva lo abierto y lo escrito',st.open&&st.txt==='Desde 70,00 €',JSON.stringify(st));
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V124 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
