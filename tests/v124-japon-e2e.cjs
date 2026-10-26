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
 [273933,150,258,258,263,268,null,null,null],   // base4-10 Mewtwo (verificada, EX+ 95 €)
 [273924,30,200,200,205,210,null,null,null],   // base4-1 Alakazam · vale ~200 € y hay un anuncio a 30 € → punto de mira
 [574435,560,900,null,null,null,null,null,null],// Evolving Skies Booster Box · «desde» 62 % de su tendencia
 [583510,150,290,null,null,null,null,null,null],// Brilliant Stars ETB
 [271439,250,270,null,null,null,null,null,null],// Phantom Forces Booster
 [861477,193,257,257,257,262,null,null,null],   // Pikachu ex M2A 234 · producto japonés (venta de referencia 190 €)
 [861287,0.5,0.75,null,0.8,0.7,null,null,null]]};// Pikachu ex M2A 44 · japonés barato
const PREV={...GUIDE,sourceCreatedAt:'2026-10-23T02:45:00+0200',rows:[[273933,150,258,258,263,268,null,null,null],[273924,120,200,200,205,210,null,null,null],[574435,560,880,null,null,null,null,null,null],[583510,150,290,null,null,null,null,null,null],[271439,250,262,null,null,null,null,null,null]]};
const OLD={...GUIDE,sourceCreatedAt:'2026-10-11T02:45:00+0200',rows:[[574435,600,850,null,null,null,null,null,null],[583510,150,280,null,null,null,null,null,null],[271439,240,220,null,null,null,null,null,null]]};
const LOR={sets:[{id:'tfc',name:'The First Chapter'}]},LORSET={updatedAt:'2026-10-24',cards:[{id:'tfc-1',name:'Mickey Mouse - Brave Little Tailor',number:'1',rarity:'Legendary',imageSmall:'https://images.example/m.png',cardmarketId:681001,variants:[{name:'normal',eur:{trend:60,low:55,avg30:62,avg7:61,avg1:60}}]}]};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch(),ctx=await browser.newContext({...pw.devices['iPhone 13']});let fxHits=0;
 await ctx.addInitScript(()=>{try{const u=JSON.parse(localStorage.getItem('cv_v104_user')||'{}');u.cfg=u.cfg||{};if(u.cfg.minMargin==null){u.cfg.minMargin=0;localStorage.setItem('cv_v104_user',JSON.stringify(u))}}catch{}});/* V139: estas pruebas no miden el margen mínimo */
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url(),H={'access-control-allow-origin':'*'},J=b=>route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify(b)});
  if(/images\.|assets\.tcgdex|pokellector/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(u.startsWith('https://api.frankfurter.app/latest?from=JPY&to=EUR')){fxHits++;return J({amount:1,base:'JPY',date:'2026-10-24',rates:{EUR:0.0058}})}
  if(u.endsWith('/prices/latest.json'))return J(GUIDE);
  if(/\/prices\/\d{4}\/\d{2}\/\d{2}\.json$/.test(u))return route.fulfill({status:404,headers:H,body:'404'});
  const m=u.match(/api\.pokemontcg\.io\/v2\/cards\?q=set\.id:([^&]+)/);
  if(m){const s=decodeURIComponent(m[1]),data=s==='base4'?[{id:'base4-10',cardmarket:{updatedAt:'2026/10/24',prices:{trendPrice:256,avg30:266,lowPrice:150,lowPriceExPlus:194}}}]:[];return J({data,totalCount:data.length})}
  if(/bindex-prices/.test(u))return route.fulfill({status:404,body:''});
  return route.abort()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.waitForFunction(()=>/Cardmarket, solo japonesas/.test(document.querySelector('#v4Buy #cp-jp-861477')?.textContent||''),null,{timeout:120000});
 // V132 · Pikachu ex M2A 234 (ficha solo japonesa): «desde» 193 € (75 % de 257 €) → pagas 193 + 6 = 199 € → 257·0,95 − 5 − 199 = +40,15 €
 let t=await page.textContent('#v4Buy #cp-jp-861477 .cpLangSel');
 ok('Pikachu ex japonés: precio REAL de Cardmarket (ficha japonesa) 193 €, pagas 199 € con envío, se vende a 257 € → +40,15 €',/anuncio más barato hoy 193,00\s€ → pagas 199,00\s€ con envío → se vende a 257,00\s€ → \+40,15\s€/.test(t)&&/precio de mercado/.test(t),t);
 const links=await page.evaluate(()=>[...document.querySelectorAll('#v4Buy #cp-jp-861477 .cpLangSel a')].map(a=>a.href));
 ok('«Ver anuncios» abre la ficha japonesa exacta de Cardmarket (sin búsquedas a ciegas en Mercari)',links.length===1&&links[0]==='https://www.cardmarket.com/es/Pokemon/Products?idProduct=861477',JSON.stringify(links));
 ok('Cambio del BCE descargado una vez',fxHits===1,String(fxHits));
 ok('V134: sin apartado aparte; la japonesa sale en Compra YA',!(await page.$('#v4Buy [data-cp-jpbox]'))&&await page.evaluate(()=>!!document.querySelector('#v4Buy .cpBox > .v4list > #cp-jp-861477')));
 t=await page.textContent('#v4Buy #cp-jp-861477 .cpCheck');
 ok('«Antes de pagar»: cómo comprobar que es auténtica (fotos, código, tipografía japonesa, holo, reverso, certificado)',/¿Es auténtica\?/.test(t)&&/tipografía japonesa/.test(t)&&/certificado/.test(t),t);
 ok('No entra la japonesa barata (M2A 44, 0,75 €)',!(await page.$('#v4Buy #cp-jp-861287')));
 // V135 · sin calculadora para comprar en Japón (no da precio real): solo sitios con precio
 ok('Sin «¿Y si la compro en Japón?» (no hay precio que comprobar)',!(await page.$('#v4Buy [data-cp-jpcalcbox]'))&&!/¿Y si la compro en Japón\?/.test(await page.textContent('#v4Buy')));
 await page.evaluate(()=>{document.querySelectorAll('#v4Buy details.v4settings,#v4Buy [data-cp-impbox]').forEach(d=>d.open=true)});
 await page.fill('#v4Buy [data-cp-impbox] [data-cp-jp="handling"]','0');await page.click('#v4Buy [data-cp-impbox] [data-cp-jpsave]');await page.waitForTimeout(300);
 await page.reload();await page.waitForSelector('#v4Buy #cp-jp-861477',{timeout:60000});await page.waitForTimeout(800);
 ok('Gastos de importación editables en «Estado de las fuentes»: se guardan y no se vuelve a pedir el cambio',await page.evaluate(()=>window.CVCompra&&JSON.parse(localStorage.getItem('cv_v124_jp')||'{}').handling===0)&&fxHits===1,String(fxHits));
 ok('Las cartas no japonesas no llevan la línea de Japón',!(await page.textContent('#v4Buy #cp-base4-10')).includes('solo japonesas'));
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
