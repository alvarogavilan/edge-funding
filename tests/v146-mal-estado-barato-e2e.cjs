// V146 · 🩹 Mal estado barato: cartas en mal estado por ≤ 35 € que valen ≥ 2,5 veces más y se venden cada semana, con el
// idioma y el estado comprobados (CardTrader) y venta TAL CUAL (otros vendedores en ese estado o estimación prudente).
// Ejecutar: node tests/v146-mal-estado-barato-e2e.cjs · Datos SIMULADOS; token inventado.
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
// Alakazam vale 200 € (se vende a diario) · Mewtwo vale 100 €
const GUIDE={fields:F,sourceCreatedAt:'2026-10-29T02:45:46+0200',generatedAt:'2026-10-29T08:30:52Z',rows:[[273924,20,200,200,200,200,null,null,null],[273933,24,100,100,100,100,null,null,null]]};
const TOK='eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.firma';
const P=(id,eur,cond,user,o={},lang='en')=>({id,price:{cents:Math.round(eur*100),currency:'EUR'},quantity:1,properties_hash:{condition:cond,pokemon_language:lang},user:{username:user,country_code:'IT',can_sell_via_hub:true},graded:false,...o});
const L={
 // Alakazam: HP a 22 € (los demás en mal estado piden 60, 64 y 68) + una «proxy» a 21 € y una coreana HP a 15 € que no cuentan
 777:[P(1,21,'Heavily Played','fake',{description:'PROXY high quality'}),P(2,15,'Heavily Played','kim',{},'kr'),P(3,22,'Heavily Played','pepe'),P(4,60,'Played','a'),P(5,64,'Heavily Played','b'),P(6,68,'Poor','c'),P(7,150,'Near Mint','d')],
 // Mewtwo: HP a 25 € pero los demás HP piden 26-28 € → vendida tal cual no deja beneficio
 778:[P(8,25,'Heavily Played','e'),P(9,26,'Heavily Played','f'),P(10,27,'Heavily Played','g'),P(11,28,'Poor','h')]};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.addInitScript(t=>{try{localStorage.setItem('cv_cardtrader_token',t)}catch{}},TOK);
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/'))return J({rates:{EUR:0.9},date:'2026-10-29'});
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  if(/bindex-prices/.test(u))return J({sets:[]});
  if(u.startsWith('https://api.pokemontcg.io/'))return route.fulfill({status:429,headers:H,body:'{}'});
  if(u.startsWith('https://api.cardtrader.com/api/v2/')){const p=u.slice('https://api.cardtrader.com/api/v2'.length);
   if(p==='/info')return J({id:1,name:'Card Vault'});
   if(p==='/games')return J([{id:5,name:'Pokemon'}]);
   if(p==='/expansions')return J([{id:41,game_id:5,code:'b2',name:'Base Set 2'}]);
   if(p.startsWith('/blueprints/export?expansion_id=41'))return J([{id:777,name:'Alakazam',card_market_ids:[273924]},{id:778,name:'Mewtwo',card_market_ids:[273933]}]);
   if(/^\/marketplace\/products\?expansion_id=41/.test(p))return J(L);
   const m=p.match(/^\/marketplace\/products\?blueprint_id=(\d+)/);if(m)return J({[m[1]]:L[m[1]]||[]});
   if(p.startsWith('/shipping_methods'))return J([{price:{cents:500,currency:'EUR'}}]);
   return J([])}
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/✅ 1 comprobada\(s\)/.test(document.querySelector('#v4Buy [data-cp-mal] summary')?.textContent||''),null,{timeout:150000});
 const t=await page.textContent('#v4Buy [data-cp-mal]');
 // HP a 22 € + 5 € de envío real = 27 · otros en mal estado piden 60/64/68 → 64 × 0,95 = 60,80 (< 35 % de 200 = 70) → 60,80·0,95 − 5 − 27 = +25,76
 ok('🩹 Alakazam INGLÉS muy jugada (HP): pagas 27 € (22 € + envío real) · vale 200 € (×9,1) · tal cual ~60,80 € · ganas +25,76 €',/Alakazam/.test(t)&&/INGLÉS · muy jugada \(HP\)/.test(t)&&/Pagas 27,00\s€/.test(t)&&/×9,1/.test(t)&&/tal cual la vendes a ~60,80\s€/.test(t)&&/ganas \+25,76\s€/.test(t),t.slice(0,700));
 ok('…la venta sale de lo que piden otros 3 vendedores en ese estado (no del precio de una en buen estado)',/lo que piden otros 3 vendedores en ese estado −5 %/.test(t),t.slice(0,700));
 {const A0=await page.textContent('#v4Buy [data-cp-mal] ol:not([data-cp-malchk])');ok('El anuncio «PROXY» de 21 € y la coreana de 15 € no cuentan',!/21,00\s€/.test(A0)&&!/15,00\s€/.test(A0),A0.slice(0,300))}
 const A=await page.textContent('#v4Buy [data-cp-mal] ol:not([data-cp-malchk])'),B=await page.textContent('#v4Buy [data-cp-mal] [data-cp-malchk]');
 ok('Mewtwo HP a 25 € NO es «comprobada»: los demás HP piden 26-28 € (tal cual no deja beneficio)',!/Mewtwo/.test(A),A.slice(0,200));
 // V147 · por comprobar: «desde» 24 € (30 € con envío), vale 100 € → necesita ≥ 53 % de su valor → MP o mejor
 ok('V147 · Mewtwo pasa a «🔎 Por comprobar en un toque»: desde 24 €, vale 100 € → «Te compensa: sirve si está en MP o mejor», con lo que dice CardTrader',/Mewtwo/.test(B)&&/Hay un anuncio desde 24,00\s€ \(30,00\s€ con envío; la carta vale 4,2 veces más\)/.test(B)&&/sirve si está en MP o mejor/.test(B)&&/CardTrader no tiene ninguna inglesa en mal estado que lo cumpla ahora/.test(B),B.slice(0,500));
 ok('V147 · Su enlace abre la ficha solo con inglesas',await page.evaluate(()=>[...document.querySelectorAll('#v4Buy [data-cp-malchk] a')].some(a=>/idProduct=273933&language=1/.test(a.href))));
 ok('V147 · Alakazam (ya comprobada) no se repite en «por comprobar»',!/Alakazam/.test(B));
 ok('Restaurar es un extra, no se cuenta: «podría venderse a ~120 € (no contado)»',/podría venderse a ~120,00\s€ \(no contado\)/.test(t));
 ok('Enlace a su anuncio en CardTrader',await page.evaluate(()=>[...document.querySelectorAll('#v4Buy [data-cp-mal] a')].some(a=>/cardtrader\.com\/cards\/777/.test(a.href))));
 const H=await page.evaluate(()=>{const C=window.CVCompra;return C.malHunt(C.cfg()).map(h=>({id:h.x.id,lvl:h.o.lvl}))});
 ok('Nivel de estado leído de CardTrader (HP = 4)',H.length===1&&H[0].lvl===4,JSON.stringify(H));
 ok('Supuestos: precio máximo, veces y beneficio mínimo del mal estado barato',!!(await page.$('[data-v4-cfg="malMax"]'))&&!!(await page.$('[data-v4-cfg="malRatio"]'))&&!!(await page.$('[data-v4-cfg="malMinProfit"]')));
 ok('Sin errores de JavaScript',!errors.length,errors.join(' | '));
 console.log(n+' comprobaciones V146 superadas');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
