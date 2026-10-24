// V116–V117 · Compra YA (guía oficial de Cardmarket desde 41020), Favoritos, idiomas (CardTrader), PSA y Valorar PSA.
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v117-app-e2e.cjs
// Sin Internet: la guía (espejo ZyzyThePizi), pokemontcg.io, Bindex y CardTrader se SIMULAN con su formato público.
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
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});const hits={guide:0,pt:[],bx:0,us:0,ct:[]};let bxDown=false;
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/tcgplayer|api\.tcgdex\.net\/v2\/[a-z-]+\/cards\/./.test(u)){hits.us++;if(process.env.DBG)console.log('precio EE. UU./carta a carta:',u);return route.abort()}/* el índice de nombres de TCGdex (identificar cartas) no cuenta */
  if(/images\.|assets\.tcgdex|cards\.lorcast|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.endsWith('/prices/latest.json')){hits.guide++;return J(GUIDE)}
  if(u.endsWith('/history/933.json'))return J({'273933':[['2026-10-01',95,150,null,null,null,null,null,null],['2026-10-12',92,155,null,null,null,null,null,null],['2026-10-24',90,160,null,null,null,null,null,null]]});
  let m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]);hits.pt.push(s);const data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:158,avg30:168,lowPrice:90,lowPriceExPlus:95}}}]:s==='ecard2'?[{id:'ecard2-H29',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:760,avg30:1000,lowPrice:290,lowPriceExPlus:310}}}]:[];return J({data,totalCount:data.length})}
  if(u.endsWith('/bindex-prices/v1/lorcana/sets.json')){hits.bx++;return bxDown?route.fulfill({status:404,body:''}):J(LOR)}
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);hits.ct.push(p);
   if(p==='/games')return J([{id:5,name:'Pokemon'},{id:18,name:'Lorcana'}]);
   if(p==='/expansions')return J([{id:11,game_id:5,name:'Base Set 2'},{id:12,game_id:5,name:'Base Set'}]);
   if(p.startsWith('/blueprints/export?expansion_id=11'))return J([{id:900,name:'Mewtwo',fixed_properties:{collector_number:'10'}},{id:901,name:'Alakazam',fixed_properties:{collector_number:'1'}}]);
   if(p.startsWith('/marketplace/products?blueprint_id=900'))return J({900:[{price_cents:9000,properties_hash:{condition:'Near Mint',pokemon_language:'en'},user:{country_code:'DE'}},{price_cents:11000,properties_hash:{condition:'Near Mint',pokemon_language:'en'},user:{country_code:'IT'}},{price_cents:20000,properties_hash:{condition:'Near Mint',pokemon_language:'en'},user:{country_code:'FR'}},{price_cents:6000,properties_hash:{condition:'Excellent',pokemon_language:'it'},user:{country_code:'IT'}},{price_cents:7000,properties_hash:{condition:'Good',pokemon_language:'it'},user:{country_code:'ES'}}]});
   return route.fulfill({status:404,body:''})}
  if(u.endsWith('/bindex-prices/v1/lorcana/sets/tfc.json')){hits.bx++;return J(LORSET)}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 ok('Barra: Compra YA, Favoritos, Mi colección, Sellado, PSA, Valorar PSA y Archivo',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.mainNav [data-tab]')].map(b=>b.textContent)))===JSON.stringify(['Compra YA','Favoritos','Mi colección','Sellado','PSA','Valorar PSA','Archivo']));
 await page.waitForFunction(()=>document.querySelector('#v4Buy #cp-base4-10 .v4badges')&&/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10 .v4badges').textContent)&&document.querySelector('#v4Buy #cp-lo-tfc-207'),null,{timeout:120000});
 ok('Una sola descarga de la guía oficial; ni precios de EE. UU. ni consultas carta a carta',hits.guide===1&&hits.us===0&&hits.bx>=2,JSON.stringify({guide:hits.guide,us:hits.us,pt:hits.pt.length,bx:hits.bx}));
 const T=id=>page.textContent('#v4Buy #cp-'+id),ids=()=>page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 let t=await T('base4-10');
 ok('Mewtwo: versión verificada con 2 fuentes, compra EX o mejor 95 € (101 € en 41020), venta 160 € → +46,00 €',/VERSIÓN VERIFICADA/.test(t)&&/95,00\s€/.test(t)&&/101,00\s€/.test(t)&&/160,00\s€/.test(t)&&/\+46,00\s€/.test(t),t.slice(0,400));
 ok('Compra YA sin «+ Nueva oportunidad» ni fichas de restauración aparte',!(await page.$('[data-v4-new]'))&&!(await page.isVisible('#v4Restore h2').catch(()=>false)));
 ok('En «Buen estado» no aparece la operación de restaurar',!(await ids()).includes('base4-1')&&!/Restaurar/.test(await T('base4-10')));
 const lk=await page.evaluate(()=>({main:document.querySelector('#v4Buy #cp-base4-10 .v4actions a').href,langs:[...document.querySelectorAll('#v4Buy #cp-base4-10 .cpLangLinks a')].map(a=>a.textContent+'='+a.href)}));
 ok('Enlace exacto al producto verificado de Cardmarket (idProduct) y un botón por idioma (EX o mejor)',lk.main==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=273933'&&lk.langs.some(x=>x==='Español=https://www.cardmarket.com/es/Pokemon/Products?idProduct=273933&language=4&minCondition=3')&&lk.langs.some(x=>/^Inglés=.*language=1/.test(x)),JSON.stringify(lk));
 await page.selectOption('[data-cp-view="cond"]','mal');await page.waitForTimeout(300);
 t=await T('base4-1');
 ok('«Mal estado · restaurar»: Alakazam «desde» 30 € → venta mejorada al 60 % 120 € → +73,00 €',/Restaurar/.test(t)&&/120,00\s€/.test(t)&&/\+73,00\s€/.test(t),t.slice(0,300));
 await page.selectOption('[data-cp-view="cond"]','buen');await page.waitForTimeout(300);
 t=await T('lo-tfc-207');
 ok('Lorcana (Bindex): Elsa foil · compra 150 € → venta 300 € → +124,00 €',/LORCANA · BINDEX/.test(t)&&/\+124,00\s€/.test(t),t.slice(0,300));
 ok('Los números de las operaciones no se parten en vertical',await page.evaluate(()=>[...document.querySelectorAll('.cpOp dd')].every(d=>d.getBoundingClientRect().height<30)));
 await page.selectOption('[data-cp-view="cond"]','mal');await page.waitForTimeout(300);
 const pend=await page.textContent('.cpBox > details.v4old');await page.selectOption('[data-cp-view="cond"]','buen');await page.waitForTimeout(300);
 ok('Aparte, sin recomendar: Nidoking sin ventas recientes y Aerodactyl con versión dudosa (colisión TCGdex)',/Nidoking/.test(pend)&&/Aerodactyl/.test(pend)&&/VERSIÓN DUDOSA/.test(pend)&&!(await ids()).includes('base4-11'),pend.slice(0,160));
 await page.fill('[data-cp-q]','umbreon');await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-ecard2-H29')?.textContent||''),null,{timeout:30000});
 t=await T('ecard2-H29');
 ok('Umbreon Aquapolis H29: la 2.ª fuente corrige la versión (748,52 €, no 98 €) y avisa del presupuesto',/748,52\s€/.test(t)&&!/24,99\s€ cualquier/.test(t)&&/fuera de tu presupuesto/.test(t)&&/310,00\s€/.test(t),t.slice(0,400));
 await page.fill('[data-cp-q]','');await page.waitForTimeout(600);
 await page.selectOption('[data-cp-view="sort"]','buy');await page.waitForTimeout(300);
 ok('Ordenar por menor precio de compra',(await ids()).join()==='base4-10,lo-tfc-207',JSON.stringify(await ids()));
 await page.selectOption('[data-cp-view="cond"]','mal');await page.waitForTimeout(300);
 ok('Estado «Mal estado · restaurar»',(await ids()).join()==='base4-1',JSON.stringify(await ids()));
 await page.selectOption('[data-cp-view="cond"]','buen');await page.waitForTimeout(300);
 ok('Estado «Buen estado»',(await ids()).join()==='base4-10,lo-tfc-207',JSON.stringify(await ids()));
 await page.selectOption('[data-cp-view="cond"]','buen');await page.selectOption('[data-cp-view="game"]','lorcana');await page.waitForTimeout(300);
 ok('Juego «Lorcana»',(await ids()).join()==='lo-tfc-207');
 await page.selectOption('[data-cp-view="game"]','all');await page.selectOption('[data-cp-view="sort"]','profit');await page.waitForTimeout(300);
 await page.fill('#v4Buy [data-cp-target="base4-10"]','100');await page.click('#v4Buy [data-cp-watch="base4-10"]');await page.waitForTimeout(300);
 {const d={hit:/BAJO TU PRECIO/.test(await T('base4-10')),alert:await page.textContent('.cpAlert').catch(()=>''),first:(await ids())[0],toast:await page.textContent('#cpToast').catch(()=>'')};
 ok('Vigilar con precio objetivo: «¡BAJO TU PRECIO!», aviso arriba y confirmación «Guardada en Favoritos»',d.hit&&/🔔 1 carta/.test(d.alert)&&d.first==='base4-10'&&/Favoritos/.test(d.toast),JSON.stringify(d))}
 await page.click('.mainNav [data-tab="favoritos"]');await page.waitForSelector('#cpFavs #fav-base4-10',{timeout:30000});
 ok('Favoritos: la vigilada aparece con su aviso',/BAJO TU PRECIO/.test(await page.textContent('#cpFavs #fav-base4-10')));
 await page.selectOption('[data-cp-fav="type"]','reg');await page.waitForTimeout(200);
 ok('Favoritos · Registradas vacío al principio',/Aún no has registrado/.test(await page.textContent('#cpFavs')));
 await page.selectOption('[data-cp-fav="type"]','all');await page.click('.mainNav [data-tab="radar"]');await page.waitForTimeout(300);
 await page.evaluate(()=>{document.querySelector('#v4Buy #cp-base4-10 details.v4more').open=true});await page.click('#v4Buy #cp-base4-10 [data-cp-histload="273933"]');await page.waitForSelector('#v4Buy #cp-base4-10 svg.cpSpark');
 ok('Historial de precio (guía diaria acumulada)',/150,00\s€ → 160,00\s€/.test(await page.textContent('#v4Buy #cp-base4-10 .cpHist')));
 await page.evaluate(()=>{document.querySelectorAll('#v4Buy #cp-base4-10 details.v4more')[1].open=true});
 await page.fill('#v4Buy [data-cp-lbuy="base4-10|es"]','70');await page.fill('#v4Buy [data-cp-lsell="base4-10|es"]','180');await page.click('#v4Buy [data-cp-lsave="base4-10"]');await page.waitForTimeout(300);
 ok('Español anotado: compra 70 → venta 180 → +90,00 €',/\+90,00\s€/.test(await T('base4-10')));
 await page.reload();await page.waitForSelector('#v4Buy #cp-base4-10',{timeout:60000});
 ok('Tras recargar: vigilancia, idioma anotado y orden conservados',/BAJO TU PRECIO/.test(await T('base4-10'))&&/\+90,00\s€/.test(await T('base4-10'))&&await page.inputValue('[data-cp-view="sort"]')==='profit');
 ok('Tras recargar no se vuelve a descargar la guía (caché en IndexedDB)',hits.guide===1,String(hits.guide));
 // CardTrader por idioma: sin token avisa; con token muestra anuncios por idioma y el beneficio en el mismo idioma
 await page.click('#v4Buy #cp-base4-10 [data-cp-ctload]');await page.waitForTimeout(400);
 ok('CardTrader sin token: lo explica y no inventa precios',/Sin token de CardTrader/.test(await page.textContent('#v4Buy #cp-base4-10 .cpCT')));
 await page.evaluate(()=>document.querySelector('.cpBox details.v4settings').open=true);await page.fill('[data-cp-cttoken]','token-de-prueba');await page.click('[data-cp-ctsave]');await page.waitForTimeout(300);
 await page.click('#v4Buy #cp-base4-10 [data-cp-ctload]');await page.waitForFunction(()=>/Inglés|CardTrader|rror/.test(document.querySelector('#v4Buy #cp-base4-10 .cpCT')?.textContent||''),null,{timeout:15000});await page.waitForTimeout(800);
 const ct=await page.textContent('#v4Buy #cp-base4-10 .cpCT');
 ok('CardTrader: inglés más barato 90 € (DE), salida 110 € → mismo idioma +3,50 €; italiano EX 60 € → −14,00 €',/Inglés.*más barato 90,00\s€.*DE.*salida 110,00\s€.*mismo idioma \+3,50\s€/.test(ct)&&/Italiano.*NM\/EX 60,00\s€.*mismo idioma −14,00\s€/.test(ct),ct.slice(0,400));
 await page.click('#v4Buy #cp-base4-10 [data-cp-promote]');await page.waitForTimeout(600);
 const reg=await page.evaluate(()=>{const it=window.CVVault.allItems().find(i=>i.custom&&i.name==='Mewtwo');return it?{lane:it.lane,why:it.why,tab:document.body.dataset.activeTab,shown:!!document.querySelector('#cpFavReg #card-'+it.id)}:null});
 ok('Registrar: va a Favoritos con la operación y su coste en 41020',reg&&reg.lane==='compra'&&/41020/.test(reg.why)&&reg.tab==='favoritos'&&reg.shown,JSON.stringify(reg));
 const exp=await page.evaluate(async()=>{const v=await window.CVVault.exportData();return {watch:Object.keys(v.extra?.watch||{}),lang:Object.keys(v.extra?.lang||{})}});
 ok('La copia de seguridad incluye vigiladas y precios por idioma',exp.watch.includes('base4-10')&&exp.lang.includes('base4-10'),JSON.stringify(exp));
 // Valorar PSA con fotos sintéticas: frontal 30/20 px de borde (60/40) y reverso con una esquina blanqueada
 await page.click('.mainNav [data-tab="psa-valorar"]');await page.waitForSelector('[data-pg-photo="front"]',{state:'attached'});await page.waitForTimeout(400);
 await page.setInputFiles('[data-pg-photo="front"]',path.join(root,'tests/fixtures/pg-front.png'));await page.waitForFunction(()=>/máx\. PSA/.test(document.querySelector('[data-pg-info="front"]')?.textContent||''),null,{timeout:15000});
 const fi=await page.textContent('[data-pg-info="front"]');
 ok('Valorar PSA: centrado frontal medido 60/40 (izq./dcha.) y 50/50 → máx. PSA 9',/Izq\.\/dcha\. 60\/40/.test(fi)&&/arriba\/abajo 50\/50/.test(fi)&&/máx\. PSA por centrado 9/.test(fi),fi);
 await page.setInputFiles('[data-pg-photo="back"]',path.join(root,'tests/fixtures/pg-back.png'));await page.waitForFunction(()=>/máx\. PSA/.test(document.querySelector('[data-pg-info="back"]')?.textContent||''),null,{timeout:15000});
 const auto=await page.evaluate(()=>({c:document.querySelector('input[name="pg-corners"]:checked')?.value,e:document.querySelector('input[name="pg-edges"]:checked')?.value,crops:document.querySelectorAll('.pgCorners img').length}));
 ok('Valorar PSA: detecta el blanqueo de la esquina en el reverso y lo propone (esquinas < 10), bordes limpios',Number(auto.c)<10&&auto.e==='10'&&auto.crops===4,JSON.stringify(auto));
 for(const [k,v] of [['surface','10'],['crease','10'],['altered','10']])await page.check('input[name="pg-'+k+'"][value="'+v+'"]');
 const res=await page.textContent('#pgResult');
 ok('Valorar PSA: nota probable limitada por la esquina y explicada',/Nota PSA probable/.test(res)&&/PSA [4-8](?!\d)/.test(res)&&/Esquinas/.test(res),res.slice(0,200));
 await page.check('input[name="pg-altered"][value="0"]');
 ok('Restaurada o alterada → «No apta para PSA»',/No apta para PSA/.test(await page.textContent('#pgResult')));
 await page.check('input[name="pg-altered"][value="10"]');await page.check('input[name="pg-corners"][value="10"]');
 {const rt=await page.textContent('#pgResult .pgRes');ok('Con esquinas perfectas, la nota la limita el centrado: PSA 9',/PSA 9(?!\d)/.test(rt),rt)}
 await page.click('[data-pg-save]');await page.waitForTimeout(200);
 ok('Valoración guardada en el historial',/Valoraciones guardadas \(1\)/.test(await page.textContent('#cpPregrade')));
 await page.click('[data-pg-tocalc]');await page.waitForSelector('#cpPsa [data-psa="p10"]');
 ok('«¿Merece la pena?» pasa las probabilidades a la calculadora PSA',(await page.inputValue('[data-psa="p9"]'))==='55'&&(await page.inputValue('[data-psa="p8"]'))==='33');
 ok('PSA: el contenido antiguo queda oculto',!(await page.isVisible('text=PSA 10 ANUNCIADAS').catch(()=>false)));
 for(const [k,v] of [['value','100'],['sale9','200'],['sale8','120']]){await page.fill('[data-psa="'+k+'"]',v);await page.dispatchEvent('[data-psa="'+k+'"]','change')}
 const pr=await page.textContent('#cpPsa .cpMoney');
 // coste 100+49,99+15+25=189,99 · valor esperado: 0,55·(200·0,95−5)+0,33·(120·0,95−5)+0,12·(80·0,95−5) = 101,75+35,97+8,52 = 146,24
 ok('Calculadora PSA: coste 189,99 €, valor esperado 146,24 €, beneficio −43,75 €',/189,99\s€/.test(pr)&&/146,24\s€/.test(pr)&&/−43,75\s€/.test(pr),pr);
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
 // Lorcana sin respuesta de Bindex: aviso claro en lugar de lista vacía
 bxDown=true;await page.click('.mainNav [data-tab="radar"]');await page.evaluate(()=>{const s=window.CVCompra.state();s.lo=null});await page.selectOption('[data-cp-view="game"]','lorcana');
 await page.waitForFunction(()=>/Lorcana no disponible/.test(document.querySelector('#v4Buy .cpBox')?.textContent||''),null,{timeout:20000}).catch(async e=>{console.log('DBG',(await page.textContent('#v4Buy .cpBox')).slice(0,600));throw e});
 ok('Lorcana: si Bindex no responde, la app lo dice',true);await page.selectOption('[data-cp-view="game"]','all');
 await page.click('.mainNav [data-tab="radar"]');
 for(const w of [320,375,430]){await page.setViewportSize({width:w,height:800});await page.waitForTimeout(200);
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Sin desbordamiento horizontal · '+w+' px',o.sw<=o.iw,JSON.stringify(o))}
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V117 superadas');
})().catch(e=>{console.error(e);process.exit(1)});
