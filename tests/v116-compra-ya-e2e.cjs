// V116 · Compra YA con la guía oficial de Cardmarket desde 41020 (Chromium con emulación de iPhone; no es Safari real).
// Ejecutar: node tests/v116-compra-ya-e2e.cjs
// Sin Internet: la guía (espejo ZyzyThePizi), pokemontcg.io y Bindex se SIMULAN con su formato público.
// Identificadores de cartas y productos reales; PRECIOS INVENTADOS para la prueba (no son datos de mercado).
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let pw;for(const m of ['playwright','/opt/node22/lib/node_modules/playwright']){try{pw=require(m);break}catch{}}
if(!pw){console.log('PENDIENTE: Playwright no disponible.');process.exit(2)}
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
let n=0;const ok=(name,cond,extra='')=>{console.log((cond?'OK ':'FALLO')+' · '+name+(extra?' · '+extra:''));assert.ok(cond,name+' '+extra);n++};
// [idProduct, low, trend, avg1, avg7, avg30, lowHolo, trendHolo, avg30Holo]
const GUIDE={fields:['idProduct','low','trend','avg1','avg7','avg30','lowHolo','trendHolo','avg30Holo'],sourceCreatedAt:'2026-10-24T02:45:46+0200',generatedAt:'2026-10-24T08:30:52Z',rows:[
 [273933,90,160,160,165,170,null,null,null],   // base4-10 Mewtwo · versión única → verificada con pokemontcg.io
 [273924,30,200,null,205,210,null,null,null],  // base4-1 Alakazam · restaurar
 [273934,30,400,null,null,null,null,null,null],// base4-11 Nidoking · sin ventas recientes
 [275113,24.99,98.29,90,59.11,165.15,26,232.88,173.55],[275070,298,748.52,1650,1194.3,1008.71,null,null,null], // Umbreon Aquapolis
 [273862,20,300,300,300,300,null,null,null]]}; // base3-1 Aerodactyl · colisión TCGdex
const LOR={sets:[{id:'tfc',name:'The First Chapter'}]},LORSET={updatedAt:'2026-10-24',cards:[{id:'tfc-207',name:'Elsa - Spirit of Winter',number:'207',rarity:'Enchanted',imageSmall:'https://images.example/elsa.png',cardmarketId:681234,variants:[{name:'normal',eur:null},{name:'foil',eur:{trend:300,low:150,avg30:320,avg7:310,avg1:305}}]}]};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});const hits={guide:0,pt:[],bx:0,us:0};
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/tcgplayer|api\.tcgdex\.net\/v2\/[a-z-]+\/cards\/./.test(u)){hits.us++;if(process.env.DBG)console.log('precio EE. UU./carta a carta:',u);return route.abort()}/* el índice de nombres de TCGdex (identificar cartas) no cuenta */
  if(/images\.|assets\.tcgdex|cards\.lorcast|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.endsWith('/prices/latest.json')){hits.guide++;return J(GUIDE)}
  if(u.endsWith('/history/933.json'))return J({'273933':[['2026-10-01',95,150,null,null,null,null,null,null],['2026-10-12',92,155,null,null,null,null,null,null],['2026-10-24',90,160,null,null,null,null,null,null]]});
  let m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]);hits.pt.push(s);const data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:158,avg30:168,lowPrice:90,lowPriceExPlus:95}}}]:s==='ecard2'?[{id:'ecard2-H29',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:760,avg30:1000,lowPrice:290,lowPriceExPlus:310}}}]:[];return J({data,totalCount:data.length})}
  if(u.endsWith('/bindex-prices/v1/lorcana/sets.json')){hits.bx++;return J(LOR)}
  if(u.endsWith('/bindex-prices/v1/lorcana/sets/tfc.json')){hits.bx++;return J(LORSET)}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 ok('Barra solo con Compra YA, Mi colección, Sellado, PSA y Archivo',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.mainNav [data-tab]')].map(b=>b.textContent)))===JSON.stringify(['Compra YA','Mi colección','Sellado','PSA','Archivo']));
 await page.waitForFunction(()=>document.querySelector('#cp-base4-10 .v4badges')&&/VERIFICADA/.test(document.querySelector('#cp-base4-10 .v4badges').textContent)&&document.querySelector('#cp-lo-tfc-207'),null,{timeout:120000});
 ok('Una sola descarga de la guía oficial; ni precios de EE. UU. ni consultas carta a carta',hits.guide===1&&hits.us===0&&hits.bx>=2,JSON.stringify({guide:hits.guide,us:hits.us,pt:hits.pt.length,bx:hits.bx}));
 const T=id=>page.textContent('#cp-'+id),ids=()=>page.evaluate(()=>[...document.querySelectorAll('.cpBox > .v4list > .cpCard')].map(a=>a.id.slice(3)));
 let t=await T('base4-10');
 ok('Mewtwo: versión verificada con 2 fuentes, compra EX o mejor 95 € (101 € en 41020), venta 160 € → +46,00 €',/VERSIÓN VERIFICADA/.test(t)&&/95,00\s€/.test(t)&&/101,00\s€/.test(t)&&/160,00\s€/.test(t)&&/\+46,00\s€/.test(t),t.slice(0,400));
 t=await T('base4-1');
 ok('Alakazam: restaurar · «desde» 30 € → venta mejorada al 60 % 120 € → +73,00 €',/Restaurar/.test(t)&&/120,00\s€/.test(t)&&/\+73,00\s€/.test(t),t.slice(0,300));
 t=await T('lo-tfc-207');
 ok('Lorcana (Bindex): Elsa foil · compra 150 € → venta 300 € → +124,00 €',/LORCANA · BINDEX/.test(t)&&/\+124,00\s€/.test(t),t.slice(0,300));
 ok('Los números de las operaciones no se parten en vertical',await page.evaluate(()=>[...document.querySelectorAll('.cpOp dd')].every(d=>d.getBoundingClientRect().height<30)));
 const pend=await page.textContent('.cpBox > details.v4old');
 ok('Aparte, sin recomendar: Nidoking sin ventas recientes y Aerodactyl con versión dudosa (colisión TCGdex)',/Nidoking/.test(pend)&&/Aerodactyl/.test(pend)&&/VERSIÓN DUDOSA/.test(pend)&&!(await ids()).includes('base4-11'),pend.slice(0,160));
 await page.fill('[data-cp-q]','umbreon');await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#cp-ecard2-H29')?.textContent||''),null,{timeout:30000});
 t=await T('ecard2-H29');
 ok('Umbreon Aquapolis H29: la 2.ª fuente corrige la versión (748,52 €, no 98 €) y avisa del presupuesto',/748,52\s€/.test(t)&&!/24,99\s€ cualquier/.test(t)&&/fuera de tu presupuesto/.test(t)&&/310,00\s€/.test(t),t.slice(0,400));
 await page.fill('[data-cp-q]','');await page.waitForTimeout(600);
 await page.selectOption('[data-cp-view="sort"]','buy');await page.waitForTimeout(300);
 ok('Ordenar por menor precio de compra',(await ids()).join()==='base4-1,base4-10,lo-tfc-207',JSON.stringify(await ids()));
 await page.selectOption('[data-cp-view="cond"]','mal');await page.waitForTimeout(300);
 ok('Estado «Mal estado · restaurar»',(await ids()).join()==='base4-1',JSON.stringify(await ids()));
 await page.selectOption('[data-cp-view="cond"]','buen');await page.waitForTimeout(300);
 ok('Estado «Buen estado»',(await ids()).join()==='base4-10,lo-tfc-207',JSON.stringify(await ids()));
 await page.selectOption('[data-cp-view="cond"]','all');await page.selectOption('[data-cp-view="game"]','lorcana');await page.waitForTimeout(300);
 ok('Juego «Lorcana»',(await ids()).join()==='lo-tfc-207');
 await page.selectOption('[data-cp-view="game"]','all');await page.selectOption('[data-cp-view="sort"]','profit');await page.waitForTimeout(300);
 await page.fill('[data-cp-target="base4-1"]','35');await page.click('[data-cp-watch="base4-1"]');await page.waitForTimeout(300);
 ok('Vigilar con precio objetivo: «¡BAJO TU PRECIO!» y aviso arriba',/BAJO TU PRECIO/.test(await T('base4-1'))&&/🔔 1 carta/.test(await page.textContent('.cpAlert'))&&(await ids())[0]==='base4-1');
 await page.evaluate(()=>{document.querySelector('#cp-base4-10 details.v4more').open=true});await page.click('[data-cp-histload="273933"]');await page.waitForSelector('#cp-base4-10 svg.cpSpark');
 ok('Historial de precio (guía diaria acumulada)',/150,00\s€ → 160,00\s€/.test(await page.textContent('#cp-base4-10 .cpHist')));
 await page.evaluate(()=>{document.querySelectorAll('#cp-base4-10 details.v4more')[1].open=true});
 await page.fill('[data-cp-lbuy="base4-10|es"]','70');await page.fill('[data-cp-lsell="base4-10|es"]','180');await page.click('[data-cp-lsave="base4-10"]');await page.waitForTimeout(300);
 ok('Español anotado: compra 70 → venta 180 → +90,00 €',/\+90,00\s€/.test(await T('base4-10')));
 await page.reload();await page.waitForSelector('#cp-base4-1',{timeout:60000});
 ok('Tras recargar: vigilancia, idioma anotado y orden conservados',/BAJO TU PRECIO/.test(await T('base4-1'))&&/\+90,00\s€/.test(await T('base4-10'))&&await page.inputValue('[data-cp-view="sort"]')==='profit');
 ok('Tras recargar no se vuelve a descargar la guía (caché en IndexedDB)',hits.guide===1,String(hits.guide));
 await page.click('#cp-base4-1 [data-cp-promote]');await page.waitForTimeout(500);
 const reg=await page.evaluate(()=>{const it=window.CVVault.allItems().find(i=>i.custom&&i.name==='Alakazam');return it?{lane:it.lane,why:it.why}:null});
 ok('Registrar: pasa la operación con su coste en 41020',reg&&reg.lane==='restaurar'&&/41020/.test(reg.why),JSON.stringify(reg));
 // Guardado con el almacenamiento lleno por cachés antiguas: se liberan y la venta se guarda
 const q=await page.evaluate(()=>{
  localStorage.setItem('cv_v115_radar','x'.repeat(1500000));/* caché antigua de precios (regenerable) */
  let i=0;for(const sz of [262144,16384,1024,64])try{for(;;i++)localStorage.setItem('cvtest_relleno_'+i,'y'.repeat(sz))}catch{}
  let full=false;try{localStorage.setItem('cvtest_sonda','z'.repeat(4096))}catch{full=true}
  const s=window.CVStateBridge.get();s.cards.push({id:'quota-test',name:'Prueba cuota',number:'1',quantity:1,notes:'n'.repeat(20000)});const r=window.CVStateBridge.save();
  const out={full,r,radar:localStorage.getItem('cv_v115_radar')===null,saved:JSON.parse(localStorage.getItem('cardvault.v2')).cards.some(c=>c.id==='quota-test')};
  for(let k=0;k<=i;k++)localStorage.removeItem('cvtest_relleno_'+k);return out});
 ok('Almacenamiento lleno por cachés: se liberan y el guardado funciona',q.full&&q.r===true&&q.radar&&q.saved,JSON.stringify(q));
 await page.click('.mainNav [data-tab="archive"]');await page.waitForTimeout(500);
 const ar=await page.evaluate(()=>[...document.querySelectorAll('.archiveCard h4')].map(h=>Math.round(h.getBoundingClientRect().width)));
 ok('Archivo legible en iPhone: el nombre ocupa el ancho de la ficha',ar.length>0&&ar.every(w=>w>150),JSON.stringify(ar));
 await page.click('.mainNav [data-tab="radar"]');
 for(const w of [320,375,430]){await page.setViewportSize({width:w,height:800});await page.waitForTimeout(200);
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Sin desbordamiento horizontal · '+w+' px',o.sw<=o.iw,JSON.stringify(o))}
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V116 superadas');
})().catch(e=>{console.error(e);process.exit(1)});
