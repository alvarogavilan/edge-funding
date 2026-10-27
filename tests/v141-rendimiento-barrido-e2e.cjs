// V141 · Rendimiento (las listas cerradas no se construyen; las cartas se calculan una vez por pintado) y barrido de
// CardTrader por colección (una consulta para todas las cartas de una colección), sin anuncios «proxy» ni de vacaciones.
// Ejecutar: node tests/v141-rendimiento-barrido-e2e.cjs · Datos SIMULADOS; token inventado.
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
// 45 japonesas a la venta con precio objetivo (más de 25: hay «Ver más») + Alakazam de Base Set 2 (internacional)
const JP=[899818,899839,899868,899896,899897,899908,899941,899949,899950,899951,899956,899985,900000,900007,900101,900104,900110,900113,900114,900115,900117,900136,900140,888245,888253,888255,888277,876913,876917,876925,876953,868102,868119,861280,861287,861294,861306,861309,861372,861425,861446,861453,861477,861480,840556];
const GUIDE={fields:F,sourceCreatedAt:'2026-10-27T02:45:46+0200',generatedAt:'2026-10-27T08:30:52Z',rows:[[273924,60,250,250,250,250,null,null,null]].concat(JP.map((id,i)=>[id,150,280+i,280+i,280+i,280+i,null,null,null]))};
const TOK='eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.firma';
const P=(id,cents,user,o={})=>({id,price:{cents,currency:'EUR'},quantity:1,properties_hash:{condition:'Near Mint',pokemon_language:'en'},user:{username:user,country_code:'DE',can_sell_via_hub:true},graded:false,...o});
const LISTINGS=[P(1,9000,'proxyguy',{description:'High quality PROXY, not original'}),P(2,9500,'away',{on_vacation:true}),P(3,15000,'bob')];
const calls=[];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(t=>{try{localStorage.setItem('cv_cardtrader_token',t);localStorage.setItem('cv_v104_user',JSON.stringify({minMargin:25}))}catch{}},TOK);
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/'))return J({rates:{EUR:0.9},date:'2026-10-27'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  if(u.startsWith('https://api.pokemontcg.io/'))return route.fulfill({status:429,headers:H,body:'{}'});
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);calls.push(p);
   if(p==='/info')return J({id:1,name:'Card Vault'});
   if(p==='/games')return J([{id:5,name:'Pokemon'},{id:18,name:'Disney Lorcana'}]);
   if(p==='/expansions')return J([{id:41,game_id:5,code:'b2',name:'Base Set 2'}]);
   if(p.startsWith('/blueprints/export?expansion_id=41'))return J([{id:777,name:'Alakazam',fixed_properties:{collector_number:'1'},card_market_ids:[273924]}]);
   if(p.startsWith('/marketplace/products?expansion_id=41'))return J({777:LISTINGS});
   if(p.startsWith('/marketplace/products?blueprint_id=777'))return J({777:LISTINGS});
   if(p.startsWith('/shipping_methods'))return J([{price:{cents:500,currency:'EUR'}}]);
   if(p.startsWith('/marketplace/products'))return J({});
   return J([])}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#v4Buy [data-cp-more]'),null,{timeout:120000});await page.waitForTimeout(600);
 // 1) «Ver más» y «Por confirmar» cerrados: no se construyen
 let st=await page.evaluate(()=>{const d=document.querySelector('#v4Buy [data-cp-more]');return {sum:d.querySelector('summary').textContent,cards:d.querySelectorAll('.cpCard').length,open:d.open}});
 ok('«Ver más» cerrado no construye sus cartas (antes ~10.000 elementos en cada pintado)',/Ver más \(\d+\)/.test(st.sum)&&st.cards===0&&!st.open,JSON.stringify(st));
 const want=Number(st.sum.match(/\((\d+)\)/)[1]);
 await page.click('#v4Buy [data-cp-more] > summary');await page.waitForTimeout(400);
 st=await page.evaluate(()=>document.querySelectorAll('#v4Buy [data-cp-more] .cpCard').length);
 ok('Al abrir «Ver más» aparecen sus cartas ('+want+')',st===Math.min(want,125),String(st));
 await page.evaluate(()=>window.CVCompra.render());await page.waitForTimeout(300);
 st=await page.evaluate(()=>({open:document.querySelector('#v4Buy [data-cp-more]').open,cards:document.querySelectorAll('#v4Buy [data-cp-more] .cpCard').length}));
 ok('Tras repintar sigue abierto y con sus cartas',st.open&&st.cards===Math.min(want,125),JSON.stringify(st));
 await page.click('#v4Buy [data-cp-more] > summary');await page.waitForTimeout(200);await page.evaluate(()=>window.CVCompra.render());await page.waitForTimeout(200);
 ok('Cerrado otra vez: vuelve a no construirse',await page.evaluate(()=>document.querySelectorAll('#v4Buy [data-cp-more] .cpCard').length)===0);
 // 2) Las cartas se calculan una vez por pintado (antes 4: lista, Top 5, punto de mira y chollos)
 const cnt=await page.evaluate(()=>{let k=0;const C=window.CVCompra,o=C.cardsPk;const t=performance.now();C.render();return Math.round(performance.now()-t)});
 ok('Pintado completo de Compra YA rápido ('+cnt+' ms)',cnt<1500,String(cnt));
 // 3) Barrido de CardTrader por colección
 await page.waitForFunction(()=>/✅ COMPRA en CardTrader/.test(document.querySelector('#v4Buy #cp-base4-1 .cpDecide')?.textContent||''),null,{timeout:120000});
 const t=await page.textContent('#v4Buy #cp-base4-1 .cpDecide');
 // 150 + 5 de envío real = 155 → 250·0,95 − 5 − 155 = +77,50; el de 90 € dice «PROXY» y el de 95 € está de vacaciones
 ok('Alakazam: «✅ COMPRA en CardTrader · INGLÉS · Pagas 155 €» (el anuncio de 90 € que dice «PROXY» y el de vacaciones no cuentan)',/✅ COMPRA en CardTrader · INGLÉS/.test(t)&&/Pagas 155,00\s€/.test(t)&&/ganas \+77,50\s€/.test(t),t);
 ok('Una sola consulta para toda la colección (marketplace/products?expansion_id=41&language=en)',calls.some(p=>p==='/marketplace/products?expansion_id=41&language=en'),calls.join(' '));
 // directo: el barrido solo, sin la consulta carta a carta
 const r=await page.evaluate(async()=>{const C=window.CVCompra,s=C.ctState();for(const k in s.ctRes)delete s.ctRes[k];s.sweep.done={};await C.ctSweep(true);const x=s.ctRes['base4-1'];return {sweep:x&&x.sweep,bp:x&&x.bp,good:x&&x.rows[0].cheapestGood,cards:s.sweep.cards,buys:s.sweep.buys}});
 ok('El barrido rellena la carta por su id de Cardmarket, con el envío real del vendedor y 1 compra que deja tu beneficio',r.sweep===true&&r.bp===777&&r.good.eur===150&&r.good.ship===5&&r.cards===1&&r.buys===1,JSON.stringify(r));
 await page.evaluate(()=>window.CVCompra.render());await page.waitForTimeout(300);
 const a=await page.textContent('#v4Buy .cpAuto');
 ok('El piloto automático dice lo que ha barrido: «CardTrader: cartas comparadas 1 (en 1 colecc.) · compras con tu beneficio: 1»',/CardTrader: cartas comparadas 1 \(en 1 colecc\.\) · compras con tu beneficio: 1/.test(a),a);
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V141 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
