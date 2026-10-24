// V115 · Compra YA unificada: dónde comprar, idioma, venta en el mismo idioma, Lorcana, orden y filtros (Chromium con emulación de iPhone; no es Safari real).
// Ejecutar: node tests/v115-compra-ya-e2e.cjs
// Sin Internet: TCGdex, pokemontcg.io y Lorcast se SIMULAN con su formato público; no son datos de mercado.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let pw;for(const m of ['playwright','/opt/node22/lib/node_modules/playwright']){try{pw=require(m);break}catch{}}
if(!pw){console.log('PENDIENTE: Playwright no disponible.');process.exit(2)}
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
let n=0;const ok=(name,cond,extra='')=>{console.log((cond?'OK ':'FALLO')+' · '+name+(extra?' · '+extra:''));assert.ok(cond,name+' '+extra);n++};
// TCGdex: solo Cardmarket (sin TCGplayer, como en la incidencia #2479). pokemontcg.io: inglés y EX+ por colección.
const CM={'base1-2':{trend:210,avg30:200,low:50},'base1-4':{trend:175,avg30:170,low:100},'base1-15':{trend:300,avg30:300,low:60}};
const PT={'base1-2':{tp:{holofoil:{low:40,market:160}},cm:{lowPrice:50,lowPriceExPlus:90,avg30:200,trendPrice:210}},
 'base1-4':{tp:{holofoil:{low:90,market:200}},cm:{lowPrice:100,lowPriceExPlus:120,avg30:170,trendPrice:175}},
 'base1-15':{tp:{holofoil:{low:250,market:400}},cm:{lowPrice:60,lowPriceExPlus:150,avg30:300,trendPrice:300}}};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});const hits={tcgdex:0,ptcg:[],lorcast:0};
 const today=new Date().toISOString().slice(0,10).replace(/-/g,'/');
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),hdr={'access-control-allow-origin':'*'},J=(b)=>route.fulfill({status:200,contentType:'application/json',headers:hdr,body:JSON.stringify(b)});
  if(/images\.pokemontcg\.io\/base1\/2_hires/.test(u))return route.fulfill({status:404,body:''});
  if(/assets\.tcgdex\.net|images\.pokemontcg\.io|lorcast\.io\/card/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  let m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]);hits.ptcg.push(s);const data=s==='base1'?Object.entries(PT).map(([id,v])=>({id,number:id.split('-')[1],tcgplayer:{url:'https://prices.pokemontcg.io/tcgplayer/'+id,updatedAt:today,prices:v.tp},cardmarket:{updatedAt:today,prices:v.cm}})):[];return J({data,page:1,pageSize:250,count:data.length,totalCount:data.length})}
  m=u.match(/api\.tcgdex\.net\/v2\/en\/cards\/([^?]+)/);
  if(m){hits.tcgdex++;const id=decodeURIComponent(m[1]);return J({id,pricing:{cardmarket:{updated:new Date().toISOString(),unit:'EUR',...(CM[id]||{trend:60,avg30:58,low:55})},tcgplayer:null}})}
  if(/api\.lorcast\.com\/v0\/sets$/.test(u)){hits.lorcast++;return J({results:[{id:'s1',code:'1',name:'The First Chapter'}]})}
  if(/api\.lorcast\.com\/v0\/sets\/1\/cards/.test(u)){hits.lorcast++;return J([{id:'c1',name:'Elsa',version:'Spirit of Winter',collector_number:'207',rarity:'Enchanted',prices:{usd:null,usd_foil:'200.00'},tcgplayer_id:123,set:{name:'The First Chapter'},image_uris:{digital:{normal:'https://cards.lorcast.io/card/digital/normal/x.avif'}}},{id:'c2',name:'Mickey',version:'Brave',collector_number:'1',rarity:'Common',prices:{usd:'0.20'},set:{name:'The First Chapter'}}])}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>!document.querySelector('[data-rd-live] .rdprog')&&document.querySelectorAll('[data-rd-live] .rdlive[data-game="lorcana"]').length>0,null,{timeout:150000});
 ok('Ya no hay pestaña «Comprar para restaurar»: se integra en Compra YA',await page.locator('.mainNav [data-tab="comprar-restaurar"]').count()===0&&await page.evaluate(()=>document.getElementById('v4Restore')?.closest('section')?.id==='radar'));
 ok('Consulta automática: TCGdex (Cardmarket), pokemontcg.io por colección y Lorcast',hits.tcgdex>=315&&hits.ptcg.includes('base1')&&hits.ptcg.length<=25&&hits.lorcast>=2,JSON.stringify({tcgdex:hits.tcgdex,ptcg:hits.ptcg.length,lorcast:hits.lorcast}));
 const ids=async()=>page.evaluate(()=>[...document.querySelectorAll('[data-rd-live] .rdlive')].map(a=>a.id));
 const txt=id=>page.textContent('#live-'+id);
 let order=await ids();
 ok('Orden por mayor beneficio: Venusaur, Blastoise, Charizard (y Lorcana sin precio de compra después)',order.slice(0,3).join()==='live-base1-15,live-base1-2,live-base1-4'&&order.includes('live-lo-c1'),JSON.stringify(order));
 let t4=await txt('base1-4');
 ok('Charizard: inglés confirmado TCGplayer 77,40 € → puesta en 41020 116,80 € → venta en inglés 172 € → +41,60 €',/RENTABLE · INGLÉS CONFIRMADO/.test(t4)&&/77,40\s€/.test(t4)&&/116,80\s€/.test(t4)&&/172,00\s€/.test(t4)&&/\+41,60\s€/.test(t4),t4.slice(0,500));
 ok('Charizard: dónde comprar con idioma y estado (Cardmarket sin indicar / TCGplayer inglés) y precio máximo en inglés 112,40 €',/Cardmarket \(UE\) ↗sin indicarcualquiera100,00\s€106,00\s€/.test(t4)&&/EX o mejor120,00\s€126,00\s€/.test(t4)&&/TCGplayer \(EE\. UU\.\) ↗inglés/.test(t4)&&/112,40\s€/.test(t4));
 const t15=await txt('base1-15');
 ok('Venusaur: TCGplayer en inglés fuera de presupuesto → Cardmarket EX+ 150 € «si es inglés» +165,80 €',/RENTABLE SI ES INGLÉS/.test(t15)&&/\+165,80\s€/.test(t15)&&/compra fuera de 20–200/.test(t15),t15.slice(0,300));
 await page.selectOption('[data-rd-lv="sort"]','buy');await page.waitForTimeout(200);order=await ids();
 ok('Ordenar por menor precio de compra',order.slice(0,3).join()==='live-base1-2,live-base1-15,live-base1-4'/* 34,40 · 60 (restaurar) · 77,40 */,JSON.stringify(order));
 await page.selectOption('[data-rd-lv="cond"]','mal');await page.waitForTimeout(200);order=await ids();
 ok('Estado «Mal estado · restaurar»: solo la operación de restaurar rentable (Venusaur +174,10 €)',order.join()==='live-base1-15'&&/\+174,10\s€/.test(await txt('base1-15'))&&!(await page.evaluate(()=>document.getElementById('v4Restore').hidden))&&await page.isVisible('#v4Restore h2'),JSON.stringify(order));
 await page.selectOption('[data-rd-lv="cond"]','buen');await page.waitForTimeout(200);
 ok('Estado «Buen estado» oculta las fichas de restauración registradas',!(await page.isVisible('#v4Restore h2')));
 await page.selectOption('[data-rd-lv="cond"]','all');await page.selectOption('[data-rd-lv="game"]','lorcana');await page.waitForTimeout(200);
 const tl=await txt('lo-c1');order=await ids();
 ok('Lorcana: Elsa con venta en inglés 172 € y precio máximo de compra 112,40 €',order.join()==='live-lo-c1'&&/172,00\s€/.test(tl)&&/COMPRA SI ≤ 112,40\s€ EN INGLÉS/.test(tl),tl.slice(0,300));
 await page.selectOption('[data-rd-lv="game"]','all');await page.selectOption('[data-rd-lv="sort"]','profit');await page.waitForTimeout(200);
 await page.evaluate(()=>{document.querySelector('#live-base1-4 details.rdlangbox').open=true});
 await page.fill('[data-rd-lbuy="base1-4|es"]','90');await page.fill('[data-rd-lsell="base1-4|es"]','175');await page.click('[data-rd-lsave="base1-4"]');await page.waitForTimeout(300);
 ok('Español anotado 90 → 175 → +65,25 € y «ESPAÑOL CONFIRMADO»',/RENTABLE · ESPAÑOL CONFIRMADO/.test(await txt('base1-4'))&&/\+65,25\s€/.test(await txt('base1-4')));
 await page.reload();await page.waitForFunction(()=>!!document.querySelector('#live-base1-4'),null,{timeout:60000});
 ok('Tras recargar: precios anotados y orden/filtros conservados',/ESPAÑOL CONFIRMADO/.test(await txt('base1-4'))&&await page.inputValue('[data-rd-lv="sort"]')==='profit');
 const src=await page.textContent('.rdsrc');
 ok('Estado de las fuentes visible con peticiones a pokemontcg.io',/pokemontcg\.io/.test(src)&&/correctas/.test(src),src.slice(0,200));
 await page.locator('#live-base1-2 img').scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const im=document.querySelector('#live-base1-2 img');return im.hidden||(im.complete&&im.naturalWidth>0)},null,{timeout:15000}).catch(()=>{});
 const ph=await page.evaluate(()=>{const im=document.querySelector('#live-base1-2 img');return {src:im.currentSrc||im.src,ok:im.complete&&im.naturalWidth>0}});
 ok('Foto: si la principal falla se usa la de TCGdex',ph.ok&&/assets\.tcgdex\.net/.test(ph.src),JSON.stringify(ph));
 await page.click('#live-base1-15 [data-rd-promote]');await page.waitForTimeout(500);
 const reg=await page.evaluate(()=>{const it=window.CVVault.allItems().find(i=>i.custom&&i.name==='Venusaur');return it?{lane:it.lane,lang:it.language,en:(it.sales||[]).filter(s=>s.language==='Inglés').length,why:it.why}:null});
 ok('Registrar: pasa la operación con su venta en inglés y avisa de comprobar el idioma',reg&&reg.lane==='restaurar'/* mejor operación: restaurar */&&reg.lang===''&&reg.en===1&&/Comprueba que el anuncio está en inglés/.test(reg.why),JSON.stringify(reg));
 for(const w of [320,375,430]){await page.setViewportSize({width:w,height:800});await page.waitForTimeout(150);
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Sin desbordamiento horizontal · '+w+' px',o.sw<=o.iw,JSON.stringify(o))}
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V115 superadas');
})().catch(e=>{console.error(e);process.exit(1)});
