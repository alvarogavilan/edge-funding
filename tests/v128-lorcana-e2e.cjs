// V128 · Lorcana: diagnóstico con números de por qué no hay oportunidades y beneficio mínimo propio para Lorcana.
// Chromium con emulación de iPhone; no es Safari real. Ejecutar: node tests/v128-lorcana-e2e.cjs · Bindex SIMULADO con su formato.
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
const GUIDE={fields:F,sourceCreatedAt:'2026-10-24T02:45:46+0200',generatedAt:'2026-10-24T08:30:52Z',rows:[[273933,90,160,160,165,170,null,null,null]]};
const v=(t,l)=>[{name:'normal',eur:{trend:t,low:l,avg30:t,avg7:t,avg1:t}}];
const LOR={sets:[{id:'tfc',name:'The First Chapter'}]},LORSET={updatedAt:'2026-10-24',cards:[
 {id:'tfc-1',name:'Mickey Mouse - Brave Little Tailor',number:'1',rarity:'Legendary',imageSmall:'https://images.example/a.png',cardmarketId:681001,variants:v(80,62)},
 {id:'tfc-2',name:'Elsa - Snow Queen',number:'2',rarity:'Super Rare',imageSmall:'https://images.example/b.png',cardmarketId:681002,variants:v(120,92)},
 {id:'tfc-3',name:'Stitch - Rock Star',number:'3',rarity:'Enchanted',imageSmall:'https://images.example/c.png',cardmarketId:681003,variants:v(300,250)}]};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  if(u.endsWith('/bindex-prices/v1/lorcana/sets.json'))return J(LOR);
  if(u.endsWith('/bindex-prices/v1/lorcana/sets/tfc.json'))return J(LORSET);
  if(/api\.pokemontcg\.io/.test(u))return J({data:[],totalCount:0});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>window.CVCompra?.state()?.lo?.cards?.length===3,null,{timeout:120000});
 await page.selectOption('[data-cp-view="game"]','lorcana');await page.waitForTimeout(400);
 let t=await page.textContent('#v4Buy .cpBox');
 // (40 + 5 + 6) / (0,95 − 0,75) = 255 · (200 − 6) / 0,75 = 258,67
 ok('Diagnóstico: 3 cartas, ventana de valor 255–258,67 €, 0 en la ventana, 2 dentro del presupuesto, 1 por encima',/Lorcana: 3 cartas con precio de Cardmarket hoy; ninguna deja 40,00\s€/.test(t)&&/al menos 255,00\s€/.test(t)&&/como mucho 258,67\s€/.test(t)&&/Hoy: 0 carta\(s\) en esa ventana de valor · 2 con «desde» dentro de tu presupuesto · 1 valen más de 258,67\s€/.test(t),t.slice(0,1200));
 // Elsa 120·0,95 − 5 − (92 + 6) = +11 · Mickey 80·0,95 − 5 − 68 = +3 · Stitch fuera de presupuesto
 ok('Mejor margen dentro del presupuesto: Elsa +11 € y Mickey +3 €; Stitch (250 €) no',/Elsa - Snow Queen/.test(t)&&/\+11,00\s€/.test(t)&&/Mickey Mouse/.test(t)&&/\+3,00\s€/.test(t)&&!/Stitch/.test(t.split('mejor margen')[1]||''),t.slice(0,1500));
 // Beneficio mínimo en Lorcana: 10 €
 await page.evaluate(()=>{document.querySelector('#v4Buy [data-v4-cfg="minProfitLo"]').closest('details').open=true});
 await page.fill('#v4Buy [data-v4-cfg="minProfitLo"]','10');await page.click('#v4Buy [data-v4-cfgsave]');await page.waitForTimeout(800);
 await page.evaluate(()=>window.CVCompra.render());await page.waitForTimeout(300);
 const ids=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy .cpBox > .v4list > .cpCard')].map(a=>a.dataset.cpid));
 ok('Con beneficio mínimo en Lorcana de 10 €: Elsa (+11 €) sale como oportunidad; Mickey (+3 €) no',ids.join()==='lo-tfc-2',JSON.stringify(ids));
 await page.selectOption('[data-cp-view="game"]','all');await page.waitForTimeout(300);
 ok('Top 5 incluye Lorcana con su propio mínimo',/Elsa - Snow Queen/.test(await page.textContent('#v4Buy .cpTop')));
 ok('El mínimo general (40 €) no cambia para Pokémon',await page.evaluate(()=>window.CVVault.user().cfg.minProfit)===40);
 ok('Sin errores de JavaScript',errors.length===0,errors.join(' | '));
 await browser.close();server.close();console.log('\n'+n+' comprobaciones V128 superadas');
})().catch(async e=>{console.error(e);server.close();process.exit(1)});
