// V123 · Pestaña «Cartas graduadas»: tiendas donde comprarlas, búsqueda directa, lector de anuncios y certificado.
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v123-graduadas-e2e.cjs
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
 [273933,150,258,258,263,268,null,null,null],   // base4-10 Mewtwo (verificada, EX+ 95 €)
 [273924,30,200,200,205,210,null,null,null],   // base4-1 Alakazam · vale ~200 € y hay un anuncio a 30 € → punto de mira
 [574435,560,900,null,null,null,null,null,null],// Evolving Skies Booster Box · «desde» 62 % de su tendencia
 [583510,150,290,null,null,null,null,null,null],// Brilliant Stars ETB
 [271439,250,270,null,null,null,null,null,null]]};// Phantom Forces Booster (sube en 2 semanas)
const PREV={...GUIDE,sourceCreatedAt:'2026-10-23T02:45:00+0200',rows:[[273933,150,258,258,263,268,null,null,null],[273924,120,200,200,205,210,null,null,null],[574435,560,880,null,null,null,null,null,null],[583510,150,290,null,null,null,null,null,null],[271439,250,262,null,null,null,null,null,null]]};
const OLD={...GUIDE,sourceCreatedAt:'2026-10-11T02:45:00+0200',rows:[[574435,600,850,null,null,null,null,null,null],[583510,150,280,null,null,null,null,null,null],[271439,240,220,null,null,null,null,null,null]]};
const LOR={sets:[{id:'tfc',name:'The First Chapter'}]},LORSET={updatedAt:'2026-10-24',cards:[{id:'tfc-1',name:'Mickey Mouse - Brave Little Tailor',number:'1',rarity:'Legendary',imageSmall:'https://images.example/m.png',cardmarketId:681001,variants:[{name:'normal',eur:{trend:60,low:55,avg30:62,avg7:61,avg1:60}}]}]};
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
 await page.waitForFunction(()=>/VERIFICADA/.test(document.querySelector('#v4Buy #cp-base4-10')?.textContent||''),null,{timeout:120000});
 ok('La pestaña se llama «Cartas graduadas»',await page.textContent('.mainNav [data-tab="pregrade"]')==='Cartas graduadas');
 await page.click('.mainNav [data-tab="pregrade"]');await page.waitForSelector('#cpGraded [data-gr-q]',{timeout:30000});
 let t=await page.textContent('#cpGraded');
 ok('Directorio de dónde comprar: tiendas españolas y mercados de la UE',['Pokémillon','Iberian Collect','Cardzone','MaickJP','Catawiki','Wallapop','Vinted'].every(n=>t.includes(n)),t.slice(0,300));
 await page.fill('#cpGraded [data-gr-q]','mewtwo base');await page.waitForSelector('[data-gr-pick="base4-10"]');await page.click('[data-gr-pick="base4-10"]');await page.waitForTimeout(200);
 const links=await page.evaluate(()=>[...document.querySelectorAll('#cpGraded .cpPlanList a')].map(a=>a.href));
 ok('Con la carta elegida, «Buscar» abre cada sitio con «Mewtwo 10»',links.length===7&&links.includes('https://www.pokemillon.com/search?type=product&q=Mewtwo%2010')&&links.includes('https://www.catawiki.com/es/s?q=Mewtwo%2010')&&links.includes('https://www.vinted.es/catalog?search_text=Mewtwo%2010'),JSON.stringify(links));
 await page.evaluate(()=>{document.querySelector('[data-gr-paste]').closest('details').open=true});
 await page.fill('[data-gr-paste]','Mewtwo Base Set 2 PSA 9 Mint · 215,90 € · Certificado 87654321');await page.click('[data-gr-parse]');
 const f=await page.evaluate(()=>({co:document.querySelector('[data-gr="company"]').value,g:document.querySelector('[data-gr="grade"]').value,p:document.querySelector('[data-gr="price"]').value,c:document.querySelector('[data-gr="cert"]').value}));
 ok('Pegar anuncio: rellena PSA, nota 9, 215,90 € y certificado',f.co==='PSA'&&f.g==='9'&&f.p==='215,9'&&f.c==='87654321',JSON.stringify(f));
 await page.selectOption('[data-gr="store"]','Iberian Collect');await page.fill('[data-gr="ship"]','0');await page.click('[data-gr-add]');await page.waitForTimeout(300);
 t=await page.textContent('#cpGraded ol:last-of-type');
 // reposición 194 + 49,99 + 40 = 283,99 · 215,90 → 76 %
 ok('Analizado: tienda, certificado con «verificar» y oferta frente a crearla tú (76 % de 283,99 €)',/Iberian Collect · certificado 87654321/.test(t)&&/Oferta: más barata que graduarla tú/.test(t)&&/76 % de su reposición/.test(t),t);
 ok('«Verificar» abre el certificado en psacard.com',await page.getAttribute('#cpGraded a[href*="psacard.com/cert/"]','href')==='https://www.psacard.com/cert/87654321');
 const P=await page.evaluate(()=>['Umbreon VMAX BGS 9.5 Gem Mint 1.250,00 €','CGC 9,5 Pikachu Precio: € 89','Gengar Beckett 8,5 75 €'].map(window.CVGraduadas.parseListing));
 ok('Lector: Beckett 9,5 a 1.250 €, CGC 9,5 a 89 € y Beckett 8,5 a 75 €',P[0].company==='Beckett (BGS)'&&P[0].grade===9.5&&P[0].price===1250&&P[1].company==='CGC'&&P[1].grade===9.5&&P[1].price===89&&P[2].grade===8.5&&P[2].price===75,JSON.stringify(P));
 let al='';page.once('dialog',d=>{al=d.message();d.dismiss()});await page.evaluate(()=>{document.querySelector('[data-gr-paste]').closest('details').open=true});await page.fill('[data-gr-paste]','texto sin datos');await page.click('[data-gr-parse]');await page.waitForTimeout(200);
 ok('Texto sin datos: lo avisa',/No encuentro empresa, nota ni precio/.test(al),al);
 await page.setViewportSize({width:320,height:800});await page.waitForTimeout(200);
 {const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok('Sin desbordamiento horizontal a 320 px',o.sw<=o.iw,JSON.stringify(o))}
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V123 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
