// V118 · Mismo idioma: cartas japonesas (producto propio en Cardmarket) y datos pegados de la ficha filtrada por idioma.
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v118-idioma-e2e.cjs
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
 [861477,193,257,257,257,262,null,null,null],   // Pikachu ex M2A 234 · producto JAPONÉS
 [861287,0.5,0.75,null,0.8,0.7,null,null,null]]};// Pikachu ex M2A 44 · japonés barato (sin beneficio)
const pasteES=`Disponible
128
Desde
85,00 €
Tendencia de precio
258,00 €
Precio medio 30 días
268,00 €
Precio medio 7 días
263,00 €`;
const pasteEN=`Available items 31 From 115,00 € Price Trend 250,00 € 30-days average price 260,00 € 7-days average price 255,00 € 1-day average price 249,00 €
Seller  Near Mint  English  120,00 €  1
Seller2 Near Mint English 129,99 € 2`;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});const hits={guide:0,img:[]};
 await ctx.addInitScript(()=>{try{const u=JSON.parse(localStorage.getItem('cv_v104_user')||'{}');u.cfg=u.cfg||{};if(u.cfg.minMargin==null){u.cfg.minMargin=0;localStorage.setItem('cv_v104_user',JSON.stringify(u))}}catch{}});/* V139: estas pruebas no miden el margen mínimo */
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/pokellector/.test(u))hits.img.push(u);
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.endsWith('/prices/latest.json')){hits.guide++;return J(GUIDE)}
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-jp-861477')&&/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||''),null,{timeout:120000}).catch(async e=>{console.log('DBG',errors.join('|'),JSON.stringify(await page.evaluate(()=>({ids:[...document.querySelectorAll('.cpCard')].map(a=>a.dataset.cpid),jp:!!window.CV_JP_MAP,g:window.CVCompra.state().guide&&Object.keys(window.CVCompra.state().guide.rows)}))));throw e});
 const openPaste=async k=>{await page.evaluate(()=>{document.querySelector('#v4Buy #cp-base4-10 .cpPaste').open=true});await page.selectOption('#v4Buy #cp-base4-10 [data-cp-pastelang]',k)};/* V122: el cuadro tiene su propio selector de idioma */
 const T=id=>page.textContent('#v4Buy #cp-'+id),ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 let t=await T('jp-861477');
 ok('Japonés: Pikachu ex (M2A 234) con su producto japonés propio · compra 193 € (199 € en 41020) → venta 257 € → +40,15 €',/JAPONÉS · PRECIO Y VENTAS DEL MISMO IDIOMA/.test(t)&&/199,00\s€/.test(t)&&/257,00\s€/.test(t)&&/\+40,15\s€/.test(t)&&/ventas reales de japonesas/.test(t)/* V145: cajas iguales a la decisión */,t.slice(0,500));
 ok('Japonés: sin tabla de idiomas (su ficha ya es solo japonesa) y la venta dice «ventas reales de japonesas» (V145)',!(await page.$('#v4Buy #cp-jp-861477 .cpLTbox'))&&/ventas reales de japonesas/.test(await page.textContent('#v4Buy #cp-jp-861477 .cpMoney')));
 const jl=await page.evaluate(()=>({main:document.querySelector('#v4Buy #cp-jp-861477 .v4actions a').href,img:document.querySelector('#v4Buy #cp-jp-861477 img')?.src||''}));
 await page.selectOption('[data-cp-view="lang"]','ja');await page.waitForTimeout(300);jl.ja=await page.getAttribute('#v4Buy #cp-jp-861477 .v4actions a','href');jl.ids=await ids();await page.selectOption('[data-cp-view="lang"]','all');await page.waitForTimeout(300);
 ok('Japonés: enlace exacto al producto; con idioma «Japonés» solo japonesas y filtro language=7; foto del catálogo japonés',jl.main==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=861477'&&/idProduct=861477&language=7$/.test(jl.ja)/* V126: su compra es el «desde» sin estado, así que la ficha se abre sin filtro de estado */&&jl.ids.join()==='jp-861477'&&/den-cards\.pokellector\.com\/.*Pikachu-ex\.M2A\.234/.test(jl.img),JSON.stringify(jl));
 ok('Japonés sin beneficio (M2A 44 a 0,75 €) no se recomienda',!(await ids()).includes('jp-861287'));
 await page.selectOption('[data-cp-view="game"]','jp');await page.waitForTimeout(300);
 ok('Filtro «Pokémon japonés (idioma seguro)»',(await ids()).join()==='jp-861477',JSON.stringify(await ids()));
 await page.selectOption('[data-cp-view="game"]','pokemon');await page.waitForTimeout(300);
 ok('Filtro «Pokémon» incluye inglés/internacional y japonés',(await ids()).includes('base4-10')&&(await ids()).includes('jp-861477'),JSON.stringify(await ids()));
 await page.selectOption('[data-cp-view="game"]','all');await page.waitForTimeout(300);
 // Carta internacional: tabla por idioma con «Abrir ficha» y «Pegar datos»
 ok('Mewtwo sin datos pegados: sin la tabla confusa «Todos (guía)» (V145)',!(await page.$('#v4Buy #cp-base4-10 .cpLTbox'))&&!/Todos \(guía\)/.test(await page.textContent('#v4Buy #cp-base4-10')));
 await page.selectOption('[data-cp-view="lang"]','en');await page.waitForTimeout(300);/* V122: con el idioma elegido aparece su fila */
 const ifl=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-base4-10 .cpLTtab a')].map(a=>a.href).find(h=>/language=1&/.test(h)));await page.selectOption('[data-cp-view="lang"]','all');await page.waitForTimeout(300);
 ok('Con idioma «Inglés», su fila abre el producto exacto filtrado por inglés y EX o mejor',ifl==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=273933&language=1&minCondition=3',String(ifl));
 // Pegar español: la media coincide con la general → aviso, no se usa como venta del idioma
 await openPaste('es');
 ok('«Pegar datos»: cuadro con el idioma elegido',await page.inputValue('#v4Buy #cp-base4-10 [data-cp-pastelang]')==='es');
 await page.fill('#v4Buy #cp-base4-10 [data-cp-paste]',pasteES);await page.click('#v4Buy #cp-base4-10 [data-cp-pastesave]');await page.waitForTimeout(400);
 let toast=await page.textContent('#cpToast');
 ok('Español pegado con media 30 días = media general (268 €): avisa de que Cardmarket no separó el idioma',/Español: compra 85,00\s€/.test(toast)&&/no la del idioma/.test(toast),toast);
 t=await page.textContent('#v4Buy #cp-base4-10 .cpLTbox .cpLTtab');
 ok('Tabla: español 85 € «⚠ Cardmarket no separó el idioma» y venta = guía general (258 €) → +149,10 €',/Español85,00\s€258,00\s€\+149,10\s€⚠ Cardmarket no separó el idioma/.test(t),t.slice(0,400));
 // Pegar inglés: medias distintas → venta del idioma comprobada; compra = anuncio más barato copiado (120 €)
 await openPaste('en');
 await page.fill('#v4Buy #cp-base4-10 [data-cp-paste]',pasteEN);await page.click('#v4Buy #cp-base4-10 [data-cp-pastesave]');await page.waitForTimeout(400);
 toast=await page.textContent('#cpToast');
 ok('Inglés pegado (web en inglés): compra 120 € (anuncio copiado), venta 250 € del idioma comprobada',/Inglés: compra 120,00\s€ · venta 250,00\s€ · venta del idioma comprobada/.test(toast),toast);
 t=await page.textContent('#v4Buy #cp-base4-10 .cpLTbox .cpLTtab');
 // 250·0,95−5 = 232,50 − (120+6) = +106,50
 ok('Tabla: inglés 120 € (+6 € de envío) → 250 € → +106,50 € «✔ venta comprobada · inglés»',/Inglés120,00\s€250,00\s€\+106,50\s€✔ venta comprobada · inglés/.test(t)&&/compra: anuncio más barato copiado/.test(t),t.slice(0,500));
 const mon=await page.textContent('#v4Buy #cp-base4-10 .cpMoney');
 ok('La mejor operación pasa a ser la del mismo idioma (inglés) y lo dice',/inglés · mismo idioma/.test(mon)&&/ventas en inglés \(comprobadas\)/.test(mon)&&/\+106,50\s€/.test(mon),mon);
 // Pegado sin precios: no inventa nada
 await openPaste('fr');await page.fill('#v4Buy #cp-base4-10 [data-cp-paste]','texto sin precios');
 let alerted='';page.once('dialog',d=>{alerted=d.message();d.dismiss()});await page.click('#v4Buy #cp-base4-10 [data-cp-pastesave]');await page.waitForTimeout(300);
 ok('Texto sin precios: lo avisa y no guarda nada',/No encuentro precios/.test(alerted)&&!(await page.evaluate(()=>JSON.parse(localStorage.getItem('cv_v113_lang')||'{}')['base4-10']?.fr)),alerted);
 // Guardar a mano no borra la comprobación del idioma pegado
 await page.evaluate(()=>{document.querySelector('#v4Buy #cp-base4-10 [data-cp-lbuy]').closest('details').open=true});await page.click('#v4Buy [data-cp-lsave="base4-10"]');await page.waitForTimeout(300);
 ok('«Guardar precios por idioma» conserva lo pegado (y su comprobación)',/✔ venta comprobada · inglés/.test(await page.textContent('#v4Buy #cp-base4-10 .cpLTbox .cpLTtab')));
 await page.reload();await page.waitForSelector('#v4Buy #cp-base4-10 .cpLTbox .cpLTtab',{timeout:60000});
 ok('Tras recargar se conserva el inglés comprobado',/\+106,50\s€✔ venta comprobada · inglés/.test(await page.textContent('#v4Buy #cp-base4-10 .cpLTbox .cpLTtab')));
 // Registrar el japonés: idioma y ventas japonesas en la ficha registrada
 await page.click('#v4Buy #cp-jp-861477 [data-cp-promote]');await page.waitForTimeout(600);
 const reg=await page.evaluate(()=>{const it=window.CVVault.allItems().find(i=>i.custom&&i.name==='Pikachu ex');return it?{lang:it.language,sales:(it.sales||[]).map(s=>s.language+':'+s.platform)}:null});
 ok('Registrar japonés: idioma «Japonés» y ventas del producto japonés',reg&&reg.lang==='Japonés'&&reg.sales.some(s=>/^japonés:.*producto japonés/.test(s)),JSON.stringify(reg));
 await page.click('.mainNav [data-tab="radar"]');
 for(const w of [320,375,430]){await page.setViewportSize({width:w,height:800});await page.waitForTimeout(200);
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Sin desbordamiento horizontal · '+w+' px',o.sw<=o.iw,JSON.stringify(o))}
 ok('Una sola descarga de la guía',hits.guide===1,String(hits.guide));
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V118 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
