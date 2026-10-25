// V122 · Punto de mira, idioma de la carta, Lorcana sin lista vacía, Sellado (revender/invertir) y graduadas.
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v122-mercado-e2e.cjs
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
 [271439,180,270,null,null,null,null,null,null]]};// Phantom Forces Booster (sube en 2 semanas)
const PREV={...GUIDE,sourceCreatedAt:'2026-10-23T02:45:00+0200',rows:[[273933,90,160,160,165,170,null,null,null],[273924,120,200,200,205,210,null,null,null],[574435,560,880,null,null,null,null,null,null],[583510,150,290,null,null,null,null,null,null],[271439,250,262,null,null,null,null,null,null]]};
const OLD={...GUIDE,sourceCreatedAt:'2026-10-11T02:45:00+0200',rows:[[574435,600,850,null,null,null,null,null,null],[583510,150,280,null,null,null,null,null,null],[271439,240,220,null,null,null,null,null,null]]};
const LOR={sets:[{id:'tfc',name:'The First Chapter'}]},LORSET={updatedAt:'2026-10-24',cards:[{id:'tfc-1',name:'Mickey Mouse - Brave Little Tailor',number:'1',rarity:'Legendary',imageSmall:'https://images.example/m.png',cardmarketId:681001,variants:[{name:'normal',eur:{trend:60,low:55,avg30:62,avg7:61,avg1:60}}]}]};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});const hits=[];
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/assets\.tcgdex\.net\/it\//.test(u))hits.push(u);
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(u.endsWith('/prices/2026/10/23.json'))return J(PREV);
  if(u.endsWith('/prices/2026/10/11.json'))return J(OLD);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:158,avg30:168,lowPrice:90,lowPriceExPlus:95}}},{id:'base4-1',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:201,avg30:209,lowPrice:30,lowPriceExPlus:30}}}]:[];/* V126: el punto de mira exige el «desde» EX o mejor (2.ª fuente) */return J({data,totalCount:data.length})}
  if(u.endsWith('/bindex-prices/v1/lorcana/sets.json'))return J(LOR);
  if(u.endsWith('/bindex-prices/v1/lorcana/sets/tfc.json'))return J(LORSET);
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||'')&&document.querySelector('[data-cp-snipe] li'),null,{timeout:120000});
 // Punto de mira
 let t=await page.textContent('[data-cp-snipe]');
 // 200·0,95 − 5 − (30 + 6) = +149
 ok('🎯 Punto de mira: Alakazam vale ~200 € y hay un anuncio a 30 € (15 %) → +149 € si está bien; marcado NUEVO HOY (ayer 120 €)',/Alakazam/.test(t)&&/Vale ~200,00\s€/.test(t)&&/anuncio EX o mejor a 30,00\s€/.test(t)&&/15 % de su valor/.test(t)&&/\+149,00\s€/.test(t)&&/NUEVO HOY/.test(t),t.slice(0,400));
 ok('Punto de mira abierto y el enlace va al producto exacto',await page.evaluate(()=>document.querySelector('[data-cp-snipe]').open)&&await page.getAttribute('[data-cp-snipe] li a','href')==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=273924&minCondition=3');
 ok('Ya no hay fila de enlaces por idioma en cada carta',!(await page.$('#v4Buy .cpLangLinks')));
 // Idioma de la carta
 await page.selectOption('[data-cp-view="lang"]','it');await page.waitForTimeout(500);
 const it=await page.evaluate(()=>({img:document.querySelector('#v4Buy #cp-base4-10 img')?.getAttribute('src'),link:document.querySelector('#v4Buy #cp-base4-10 .v4actions a').href,line:document.querySelector('#v4Buy #cp-base4-10 .cpLangSel')?.textContent||''}));
 ok('Italiano: la carta se muestra con su imagen italiana y Cardmarket abre filtrado en italiano (EX o mejor)',/assets\.tcgdex\.net\/it\/base\/base4\/10\/high\.webp/.test(it.img)&&it.link==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=273933&language=5&minCondition=3',JSON.stringify(it));
 ok('Italiano: dice claramente que Cardmarket no publica precios por idioma y cómo obtenerlos',/Italiano · Cardmarket no publica precios de venta por idioma/.test(it.line),it.line);
 await page.evaluate(()=>{document.querySelector('#v4Buy #cp-base4-10 .cpPaste').open=true});await page.selectOption('#v4Buy #cp-base4-10 [data-cp-pastelang]','it');
 await page.fill('#v4Buy #cp-base4-10 [data-cp-paste]','Desde 70,00 €\nTendencia de precio 130,00 €\nPrecio medio 30 días 135,00 €\nPrecio medio 7 días 131,00 €');await page.click('#v4Buy #cp-base4-10 [data-cp-pastesave]');await page.waitForTimeout(400);
 const it2=await page.textContent('#v4Buy #cp-base4-10 .cpLangSel');
 ok('Italiano pegado: compra 70 € y venta 130 € en italiano, comprobada',/compra 70,00\s€ · venta 130,00\s€ en italiano ✔ comprobada/.test(it2),it2);
 await page.selectOption('[data-cp-view="lang"]','all');await page.waitForTimeout(300);
 // Lorcana
 await page.selectOption('[data-cp-view="game"]','lorcana');await page.waitForFunction(()=>/con precio de Cardmarket hoy/.test(document.querySelector('#v4Buy .cpBox')?.textContent||''),null,{timeout:30000});
 t=await page.textContent('#v4Buy .cpBox');
 // 60·0,95 − 5 − (55 + 6) = −9
 ok('Lorcana sin oportunidades: cuántas tiene, por qué y las de mejor margen (Mickey −9 €)',/Lorcana: 1 carta con precio de Cardmarket hoy/.test(t)&&/Mickey Mouse/.test(t)&&/−9,00\s€/.test(t)&&/casi todas valen menos de 100/.test(t),t.slice(0,600));
 await page.selectOption('[data-cp-view="game"]','all');await page.waitForTimeout(300);
 // Sellado
 await page.click('.mainNav [data-tab="sealed"]');await page.waitForFunction(()=>/para revender con beneficio/.test(document.querySelector('#cpSealed')?.textContent||'')&&/subiendo/.test(document.querySelector('#cpSealed')?.textContent||''),null,{timeout:60000});
 await page.waitForFunction(()=>/Brilliant Stars/.test(document.querySelector('#cpSealed ol')?.textContent||''),null,{timeout:30000});
 t=await page.textContent('#cpSealed');
 // 900·0,95 − 10 − (560 + 10) = +275 · Brilliant Stars ETB: tendencia sin moverse ayer pero sí en 2 semanas → 290·0,95−10−160 = +105,50
 // V127: compra máxima 200 € → la caja de Evolving Skies (560 €) no sale; Brilliant Stars ETB 290·0,95−10−160 = +105,50; Phantom Forces 270·0,95−10−190 = +56,50
 ok('Sellado · revender dentro del presupuesto: Brilliant Stars ETB +105,50 € y Phantom Forces Booster +56,50 €; la caja de 560 € no sale',!/Evolving Skies/.test(t.split('Ver')[1]||t)&&/Brilliant Stars Elite Trainer Box/.test(t)&&/\+105,50\s€/.test(t)&&/\+56,50\s€/.test(t),t.slice(0,700));
 ok('Sellado: se avisa de comprobar idioma y precinto',/Comprueba idioma/.test(t)&&/precinto/.test(t));
 await page.selectOption('[data-sl="show"]','inv');await page.waitForTimeout(300);
 t=await page.textContent('#cpSealed ol');
 // Phantom Forces Booster 220 → 270 en 2 semanas = +23 %; Evolving Skies 850 → 900 = +6 % (no llega al 10 %)
 ok('Sellado · invertir: Phantom Forces Booster sube +23 % en 2 semanas; Evolving Skies (+6 %) no entra',/Phantom Forces Booster/.test(t)&&/\+23 %/.test(t)&&!/Evolving Skies/.test(t),t);
 ok('Se conserva «Mi sellado» debajo',await page.isVisible('#sealed .cpMine'));
 // Graduadas
 await page.click('.mainNav [data-tab="pregrade"]');await page.waitForSelector('#cpGraded [data-gr-q]',{timeout:30000});
 await page.fill('#cpGraded [data-gr-q]','mewtwo base');await page.waitForSelector('[data-gr-pick="base4-10"]');await page.click('[data-gr-pick="base4-10"]');
 await page.fill('[data-gr="grade"]','10');await page.fill('[data-gr="price"]','150');await page.fill('[data-gr="ship"]','8');await page.fill('[data-gr="sale"]','260');await page.click('[data-gr-add]');await page.waitForTimeout(300);
 t=await page.textContent('#cpGraded ol');
 // reposición 95 + 49,99 + 15 + 25 = 184,99 · anuncio 158 → 85 % · venta 260·0,95 − 5 = 242 → +84
 ok('Graduadas: PSA 10 Mewtwo a 158 € con envío → oferta (85 % de crearla tú: 184,99 €) y +84 € vendiéndola a 260 €',/Oferta: más barata que graduarla tú/.test(t)&&/184,99\s€/.test(t)&&/85 % de su reposición/.test(t)&&/\+84,00\s€/.test(t),t);
 ok('PSA: la calculadora de graduar sigue visible debajo',await page.isVisible('#cpPsa'));
 await page.reload();await page.click('.mainNav [data-tab="pregrade"]');await page.waitForSelector('#cpGraded ol li',{timeout:30000});
 ok('El anuncio analizado se conserva tras recargar',/PSA 10 · Mewtwo/.test(await page.textContent('#cpGraded ol')));
 for(const tab of ['sealed','pregrade','radar']){await page.click('.mainNav [data-tab="'+tab+'"]');await page.setViewportSize({width:320,height:800});await page.waitForTimeout(300);
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Sin desbordamiento horizontal a 320 px · '+tab,o.sw<=o.iw,JSON.stringify(o))}
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V122 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
