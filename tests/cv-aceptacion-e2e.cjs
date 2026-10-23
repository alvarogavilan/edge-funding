// Matriz de aceptación Card Vault (V109). Recorrido real por la interfaz en Chromium con emulación de iPhone.
// NO es Safari real. Sin Internet: respuestas externas simuladas. Datos ficticios aislados («Carta Prueba …»).
// Ejecutar: node tests/cv-aceptacion-e2e.cjs            (todas las filas)
//           ONLY=A,G,I node tests/cv-aceptacion-e2e.cjs   (filas concretas)
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
let pw;for(const m of ['playwright',process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES&&process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright','/opt/node22/lib/node_modules/playwright'].filter(Boolean)){try{pw=require(m);break}catch{}}
if(!pw){console.log('NO EJECUTADO: Playwright no disponible.');process.exit(2)}
const root=path.resolve(__dirname,'..'),ONLY=(process.env.ONLY||'').split(',').filter(Boolean);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const sample=fs.readFileSync(path.join(root,'assets/cards/machamp-gx-154-es.png'));
const rows=[];let current='';
function check(name,cond,evidence=''){rows.push({row:current,name,ok:!!cond,evidence:String(evidence).slice(0,300)})}
const run=(id,title,fn)=>({id,title,fn});
const parseEUR=t=>{const m=String(t).match(/[−-]?\s?\d{1,3}(?:\.\d{3})*,\d{2}/);return m?Number(m[0].replace(/\s/g,'').replace('−','-').replace(/\./g,'').replace(',','.')):NaN};
async function newPage(browser,base,{mode='normal'}={}){
 const ctx=await browser.newContext({...pw.devices['iPhone 13']});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{const u=route.request().url();
  if(/images\.pokemontcg\.io|assets\.tcgdex\.net|cards\.lorcast\.io/.test(u))return route.fulfill({status:200,contentType:'image/png',body:sample});
  if(/api\.tcgdex\.net/.test(u)){if(mode==='down')return route.fulfill({status:503,body:''});return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{}'})}
  return route.abort()});
 const page=await ctx.newPage();page.errors=[];page.toasts=[];
 page.on('pageerror',e=>page.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|net::/.test(m.text()))page.errors.push(m.text())});
 page.prompts=[];page.on('dialog',d=>{if(d.type()==='prompt'){const a=page.prompts.shift();d.accept(a==null?'':a)}else d.accept()});
 await page.goto(base,{waitUntil:'load'});await page.waitForSelector('#v4Buy .v4head');await page.waitForTimeout(600);
 await page.exposeFunction('__noop',()=>0).catch(()=>{});
 return {ctx,page};
}
// Crea una oportunidad ficticia y registra el anuncio por la interfaz.
async function opportunity(page,{name='Carta Prueba A',grade='PSA 10',price='50',shipping='5',vat='12',duty='3',handling='7',fxFee='2',zone='fuera',country='Estados Unidos',condition='NM'}={}){
 const id=await page.evaluate(n=>{window.CVVault.addCustom({lane:'compra',game:'pokemon',name:n,set:'Set de prueba',number:'1/100',rarity:'Prueba',language:'Inglés',links:{}});return window.CVVault.user().custom.find(c=>c.name===n).id},name);
 await page.click('.mainNav [data-tab="radar"]');await page.waitForTimeout(300);
 await page.evaluate(i=>{const c=document.getElementById('card-'+i);c?.closest('details')?.setAttribute('open','');c?.scrollIntoView()},id);
 await page.click('#card-'+id+' [data-v4-verify]');await page.waitForSelector('#v4Sheet form');
 const f=async(k,v)=>{if(v!=null&&await page.locator('#v4Sheet [name='+k+']').count())await page.fill('#v4Sheet [name='+k+']',String(v))};
 const s=async(k,v)=>{if(await page.locator('#v4Sheet [name='+k+']').count())await page.selectOption('#v4Sheet [name='+k+']',v)};
 await f('url','https://shop.example/producto/'+id);await f('seller','Vendedor ficticio');await f('price',price);await f('shipping',shipping);
 await s('language','Inglés');await s('condition',condition);await f('country',country);await s('zone',zone);await f('grade',grade);
 for(const [k,v] of [['vat',vat],['duty',duty],['handling',handling],['fxFee',fxFee]])await f(k,v);
 await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(400);
 return id;
}
async function bought(page,id,{paid='pagados',double=false}={}){
 await page.evaluate(i=>{const c=document.getElementById('card-'+i);c?.closest('details')?.setAttribute('open','');c?.scrollIntoView()},id);
 await page.click('#card-'+id+' [data-v4-bought]');await page.waitForSelector('#v4Sheet form');
 await page.selectOption('#v4Sheet [name=costsPaid]',paid);
 if(double)await page.dblclick('#v4Sheet button[type=submit]');else await page.click('#v4Sheet button[type=submit]');
 await page.waitForTimeout(500);
 return page.evaluate(i=>window.CVStateBridge.get().cards.filter(c=>c.buyOpportunityId===i),id);
}
async function collectionCostText(page,name){
 await page.click('.mainNav [data-tab="collection"]');await page.waitForTimeout(400);
 return page.evaluate(n=>{const el=[...document.querySelectorAll('#cards *')].find(e=>e.children.length<40&&new RegExp(n).test(e.textContent)&&/Coste/.test(e.textContent)&&e.textContent.length<800);return el?el.textContent:''},name);
}
async function sell(page,cardId,answers){page.prompts=answers.slice();await page.evaluate(id=>window.CVCollectionSales.sell(id),cardId);await page.waitForTimeout(400)}
const MATRIX=[
 run('A','Coste 79 €, ingreso neto 95 €, beneficio 16 € en cartera, historial, archivo y CSV',async({page})=>{
  const id=await opportunity(page);const cards=await bought(page,id);const c=cards[0];
  const basis=await page.evaluate(id=>window.CVPrimeValuation.basisUnit(window.CVStateBridge.get().cards.find(x=>x.id===id)),c?.id);
  check('Cartera: coste unitario 79 €',Math.abs(basis-79)<0.005,basis);
  const txt=await collectionCostText(page,'Carta Prueba A');check('Mi colección muestra «Coste 79,00 €»',/Coste\s*79,00/.test(txt),txt.match(/Coste[^·]*/)?.[0]);
  await sell(page,c.id,['100','5','0','Cardmarket','PRUEBA-A','']);
  const rec=await page.evaluate(()=>window.CVArchive.records().find(r=>r.saleOrder==='PRUEBA-A'));
  check('Archivo: coste 79, neto 95, resultado 16',rec&&Math.abs(rec.basis-79)<0.005&&Math.abs(rec.net-95)<0.005&&Math.abs(rec.result-16)<0.005,rec&&JSON.stringify({basis:rec.basis,net:rec.net,result:rec.result}));
  await page.click('.mainNav [data-tab="collection"]');await page.waitForTimeout(300);
  const hist=await page.evaluate(()=>[...document.querySelectorAll('#saleHistoryPanel article')].find(a=>/Carta Prueba A/.test(a.textContent))?.textContent||'');
  check('Historial visible: neto 95,00 € y resultado +16,00 €',/neto 95,00/.test(hist)&&/16,00/.test(hist)&&!/45,00/.test(hist),hist);
  const csv=await page.evaluate(()=>{let out='';const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>window.__csv=t);return o.call(URL,b)};try{window.CVArchive.exportCsv()}catch(e){out='ERR '+e.message}URL.createObjectURL=o;return out});
  await page.waitForTimeout(300);const csvTxt=await page.evaluate(()=>window.__csv||'');const line=csvTxt.split('\n').find(l=>/PRUEBA-A/.test(l))||'';
  check('CSV del archivo contiene coste 79 y resultado 16',/79([.,]00)?\b/.test(line)&&/(^|[;,"])16([.,]00)?([;,"]|$)/.test(line),line.slice(0,300));
 }),
 run('B','Coste desconocido: resultado no confirmado',async({page})=>{
  const id=await opportunity(page,{name:'Carta Prueba B',vat:'',duty:'',handling:'',fxFee:''});const [c]=await bought(page,id);
  await sell(page,c.id,['100','5','0','Cardmarket','PRUEBA-B','']);
  const rec=await page.evaluate(()=>window.CVArchive.records().find(r=>r.saleOrder==='PRUEBA-B'));
  check('Resultado confirmado vacío y estado «desconocido»',rec&&rec.result==null&&/desconocid/i.test(rec.basisStatus||''),rec&&JSON.stringify({result:rec.result,basisStatus:rec.basisStatus}));
 }),
 run('C','Coste estimado: no presentado como pagado',async({page})=>{
  const id=await opportunity(page,{name:'Carta Prueba C'});const [c]=await bought(page,id,{paid:'estimados'});
  check('Lote marcado estimado',c&&/estimad/.test(c.costLot?.status||c.purchaseCosts?.status||''),JSON.stringify(c?.costLot||c?.purchaseCosts));
  const cash=await page.evaluate(i=>{const r=(window.CVStateBridge.get().investmentLedger||[]).filter(x=>x.buyOpportunityId===i);return r.map(x=>({unit:x.unitPrice,ship:x.shipping,fees:x.fees,est:x.estimatedExtras}))},id);
  check('Libro: los extras estimados no salen de caja',cash.length===1&&cash[0].unit===50&&cash[0].ship===0&&cash[0].fees===0,JSON.stringify(cash));
  await sell(page,c.id,['100','5','0','Cardmarket','PRUEBA-C','']);
  const rec=await page.evaluate(()=>window.CVArchive.records().find(r=>r.saleOrder==='PRUEBA-C'));
  check('Resultado solo estimado (no confirmado)',rec&&rec.result==null&&Math.abs(rec.resultEstimate-16)<0.005,rec&&JSON.stringify({result:rec.result,est:rec.resultEstimate}));
 }),
 run('D','IVA incluido / UE: no se duplica',async({page})=>{
  const id=await opportunity(page,{name:'Carta Prueba D',zone:'ue',country:'Alemania',vat:'',duty:'',handling:'',fxFee:'0'});const [c]=await bought(page,id);
  const basis=await page.evaluate(id=>window.CVPrimeValuation.basisUnit(window.CVStateBridge.get().cards.find(x=>x.id===id)),c?.id);
  check('Coste = 50 + 5 (IVA incluido en precio UE, sin aranceles)',Math.abs(basis-55)<0.005,basis);
 }),
 run('E','Venta parcial: coste restante correcto',async({page})=>{
  const r=await page.evaluate(()=>{const M=window.CVMoney;if(!M)return {err:'sin CVMoney'};const st=window.CVStateBridge.get();
   const c={id:'prueba-e',universe:'pokemon',name:'Carta Prueba E',set:'Set de prueba',number:'2/100',grading:'RAW',condition:'NM',quantity:2,purchase:50,purchaseDate:'2026-10-20',costLot:M.newLot({qty:2,unitPrice:50,extras:{shipping:{eur:10,status:'pagado'},vat:{status:'no-aplica'},duty:{status:'no-aplica'},handling:{status:'no-aplica'},fxFee:{status:'no-aplica'}}})};st.cards.push(c);window.CVStateBridge.save();return {total:c.costLot.totalCents,alloc:c.costLot.allocation}});
  const nd=await page.evaluate(()=>window.CVMoney.newLot({qty:2,unitPrice:50,extras:{shipping:{eur:10,status:'pagado'}}}).totalCents);
  check('Gastos no declarados = desconocidos (total sin confirmar)',nd===null,nd);
  check('Lote: 110 € y 55 € por unidad',r.total===11000&&JSON.stringify(r.alloc)==='[5500,5500]',JSON.stringify(r));
  await sell(page,'prueba-e',['1','70','0','0','Cardmarket','PRUEBA-E','']);
  const after=await page.evaluate(()=>{const c=window.CVStateBridge.get().cards.find(x=>x.id==='prueba-e');const rec=window.CVArchive.records().find(r=>r.saleOrder==='PRUEBA-E');return {qty:c.quantity,unit:window.CVPrimeValuation.basisUnit(c),remaining:window.CVMoney.remaining(c).cents,result:rec?.result}});
  check('Beneficio 15 €, 1 unidad, coste restante 55 €',after.qty===1&&Math.abs(after.unit-55)<0.005&&after.remaining===5500&&Math.abs(after.result-15)<0.005,JSON.stringify(after));
 }),
 run('F','Redondeo: 3 unidades con gastos no divisibles',async({page})=>{
  const r=await page.evaluate(()=>{const M=window.CVMoney;if(!M)return {err:1};const l=M.newLot({qty:3,unitPrice:10,extras:{shipping:{eur:0.01,status:'pagado'},vat:{status:'no-aplica'},duty:{status:'no-aplica'},handling:{status:'no-aplica'},fxFee:{status:'no-aplica'}}});return {total:l.totalCents,alloc:l.allocation,sum:l.allocation.reduce((a,b)=>a+b,0)}});
  check('Asignaciones suman el total exacto (30,01 €)',r.total===3001&&r.sum===3001&&r.alloc.length===3,JSON.stringify(r));
 }),
 run('G','PSA 10 conservada de anuncio a archivo, exportación, importación y recarga',async({page,browser,base})=>{
  const id=await opportunity(page,{name:'Carta Prueba G',grade:'PSA 10'});const [c]=await bought(page,id);
  check('Compra: grading PSA, nota 10, estado NM separado',c&&c.grading==='PSA'&&String(c.grade)==='10'&&c.condition==='NM',c&&JSON.stringify({grading:c.grading,grade:c.grade,condition:c.condition}));
  await page.reload({waitUntil:'load'});await page.waitForTimeout(800);
  const rl=await page.evaluate(i=>{const c=window.CVStateBridge.get().cards.find(x=>x.buyOpportunityId===i);return c&&{g:c.grading,n:c.grade}},id);
  check('Tras recargar sigue PSA 10',rl&&rl.g==='PSA'&&String(rl.n)==='10',JSON.stringify(rl));
  const cid=await page.evaluate(i=>window.CVStateBridge.get().cards.find(x=>x.buyOpportunityId===i).id,id);
  await sell(page,cid,['100','5','0','Cardmarket','PRUEBA-G','']);
  const rec=await page.evaluate(()=>window.CVArchive.records().find(r=>r.saleOrder==='PRUEBA-G'));
  check('Archivo: PSA 10',rec&&rec.grading==='PSA'&&String(rec.grade)==='10',rec&&JSON.stringify({g:rec.grading,n:rec.grade}));
  // exportación completa → importación en contexto limpio
  await page.click('.mainNav [data-tab="data"]').catch(()=>{});await page.evaluate(()=>window.CVSimpleNav?.showTab?.('data'));await page.waitForTimeout(300);
  const [dl]=await Promise.all([page.waitForEvent('download'),page.click('#export')]);const file=await dl.path();const pack=JSON.parse(fs.readFileSync(file,'utf8'));
  check('Copia completa incluye colección, ventas, libro y oportunidades',!!pack.state?.cards&&!!pack.state?.saleHistory&&!!pack.state?.investmentLedger&&!!pack.vault?.user,Object.keys(pack).join(','));
  const {ctx:ctx2,page:p2}=await newPage(browser,base);await p2.evaluate(()=>window.CVSimpleNav?.showTab?.('data'));
  await p2.setInputFiles('#import',file);await p2.waitForTimeout(1500);
  const r2=await p2.evaluate(()=>{const s=window.CVStateBridge.get();const h=(s.saleHistory||[]).find(x=>x.saleOrder==='PRUEBA-G');const rec=window.CVArchive.records().find(r=>r.saleOrder==='PRUEBA-G');return h&&{g:h.grading,n:h.grade,basis:rec?.basis,result:rec?.result}});
  check('Importada en entorno limpio: PSA 10, coste 79, resultado 16',r2&&r2.g==='PSA'&&String(r2.n)==='10'&&Math.abs(r2.basis-79)<0.005&&Math.abs(r2.result-16)<0.005,JSON.stringify(r2));
  await ctx2.close();
 }),
 run('H','RAW y estado físico separados; graduación incompleta no se inventa',async({page})=>{
  const id=await opportunity(page,{name:'Carta Prueba H',grade:'RAW',condition:'EX'});const [c]=await bought(page,id);
  check('RAW: grading RAW, nota vacía, estado EX',c&&c.grading==='RAW'&&!c.grade&&c.condition==='EX',c&&JSON.stringify({g:c.grading,n:c.grade,c:c.condition}));
  const p=await page.evaluate(()=>[window.CVGrade.parse('BGS 8,5'),window.CVGrade.parse('PSA'),window.CVGrade.parse(''),window.CVGrade.parse('PSA 9'),window.CVGrade.parse('NM')]);
  check('BGS 8,5 / PSA sin nota / vacío / NM',p[0].company==='BGS'&&p[0].grade==='8.5'&&p[1].company==='PSA'&&p[1].complete===false&&p[2].company===''&&p[3].grade==='9'&&p[4].company==='',JSON.stringify(p));
 }),
 run('I','Guardado fallido: no hay falso éxito',async({page})=>{
  const id=await opportunity(page,{name:'Carta Prueba I'});
  const before=await page.evaluate(()=>window.CVStateBridge.get().cards.length);
  await page.evaluate(()=>{window.__realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){const e=new Error('Cuota agotada (simulada)');e.name='QuotaExceededError';throw e}});
  await page.evaluate(i=>{const c=document.getElementById('card-'+i);c?.closest('details')?.setAttribute('open','')},id);
  await page.click('#card-'+id+' [data-v4-bought]');await page.waitForSelector('#v4Sheet form');await page.selectOption('#v4Sheet [name=costsPaid]','pagados');await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(500);
  const st=await page.evaluate(i=>({n:window.CVStateBridge.get().cards.length,err:document.querySelector('#v4Sheet .v4err')?.textContent||'',toast:document.getElementById('v4Toast')?.hidden===false?document.getElementById('v4Toast').textContent:'',bought:!!window.CVVault.user().bought?.[i],btn:document.querySelector('#card-'+i+' [data-v4-bought]')?.textContent||''}),id);
  check('No se añade a la colección en memoria',st.n===before,JSON.stringify(st));
  check('Mensaje de error y sin «Añadida»',/no se ha guardado/i.test(st.err)&&!/Añadida/.test(st.toast),JSON.stringify(st));
  check('No queda marcada como comprada',!st.bought,JSON.stringify(st));
  await page.evaluate(()=>{Storage.prototype.setItem=window.__realSet});
  // J. Reintento sin duplicar
  current='J';await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(500);await page.click('#v4Sheet button[type=submit]').catch(()=>{});await page.waitForTimeout(400);
  const n2=await page.evaluate(i=>window.CVStateBridge.get().cards.filter(c=>c.buyOpportunityId===i).length,id);
  check('Reintento guarda una sola vez',n2===1,n2);
  const [again]=await Promise.all([bought(page,id).catch(()=>[])]);check('Doble toque / repetición: sigue habiendo 1',(await page.evaluate(i=>window.CVStateBridge.get().cards.filter(c=>c.buyOpportunityId===i).length,id))===1);
  // Venta con almacenamiento fallido: sin registro parcial
  const cid=await page.evaluate(i=>window.CVStateBridge.get().cards.find(c=>c.buyOpportunityId===i).id,id);
  const h0=await page.evaluate(()=>({h:(window.CVStateBridge.get().saleHistory||[]).length,l:(window.CVStateBridge.get().investmentLedger||[]).length}));
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('bloqueado')}});
  await sell(page,cid,['100','5','0','Cardmarket','PRUEBA-I','']);
  const h1=await page.evaluate(i=>({h:(window.CVStateBridge.get().saleHistory||[]).length,l:(window.CVStateBridge.get().investmentLedger||[]).length,arch:!!window.CVStateBridge.get().cards.find(c=>c.id===i)?.archivedSold}),cid);
  await page.evaluate(()=>{Storage.prototype.setItem=window.__realSet});
  check('Venta no guardada: sin historial, libro ni archivado parciales',h1.h===h0.h&&h1.l===h0.l&&!h1.arch,JSON.stringify({h0,h1}));
 }),
 run('U','Dos pestañas: la desactualizada no sobrescribe',async({page,base})=>{
  const id=await opportunity(page,{name:'Carta Prueba U'});
  const p2=await page.context().newPage();p2.on('dialog',d=>d.accept());await p2.goto(base,{waitUntil:'load'});await p2.waitForTimeout(900);
  // La pestaña 1 es ahora la antigua: intenta registrar la compra.
  await page.evaluate(i=>{document.getElementById('card-'+i)?.closest('details')?.setAttribute('open','')},id);
  await page.click('#card-'+id+' [data-v4-bought]');await page.waitForSelector('#v4Sheet form');await page.selectOption('#v4Sheet [name=costsPaid]','pagados');await page.click('#v4Sheet button[type=submit]');await page.waitForTimeout(400);
  const r=await page.evaluate(i=>({err:document.querySelector('#v4Sheet .v4err')?.textContent||'',alert:document.getElementById('cvStorageAlert')?.textContent||'',mem:window.CVStateBridge.get().cards.some(c=>c.buyOpportunityId===i),stored:JSON.parse(localStorage.getItem('cardvault.v2')).cards.some(c=>c.buyOpportunityId===i)}),id);
  check('Pestaña antigua: compra NO guardada, aviso de otra pestaña',!r.mem&&!r.stored&&/otra pestaña/i.test(r.err)&&/Otra pestaña/.test(r.alert),JSON.stringify(r));
  const p2cards=await p2.evaluate(()=>window.CVStateBridge.get().cards.length);
  await page.reload({waitUntil:'load'});await page.waitForTimeout(800);
  const [c]=await bought(page,id);
  check('Tras recargar, la compra se guarda una vez y conserva lo de la otra pestaña',!!c&&await page.evaluate(n=>window.CVStateBridge.get().cards.length===n+1,p2cards),p2cards);
  await p2.close();
 }),
 run('V','Recarga durante el registro: sin registros a medias',async({page})=>{
  const id=await opportunity(page,{name:'Carta Prueba V'});
  await page.evaluate(i=>{document.getElementById('card-'+i)?.closest('details')?.setAttribute('open','')},id);
  await page.click('#card-'+id+' [data-v4-bought]');await page.waitForSelector('#v4Sheet form');await page.selectOption('#v4Sheet [name=costsPaid]','pagados');
  await page.reload({waitUntil:'load'});await page.waitForTimeout(800);
  const r=await page.evaluate(i=>({cards:window.CVStateBridge.get().cards.filter(c=>c.buyOpportunityId===i).length,ledger:(window.CVStateBridge.get().investmentLedger||[]).filter(x=>x.buyOpportunityId===i).length}),id);
  check('Formulario abandonado: ni carta ni movimiento',r.cards===0&&r.ledger===0,JSON.stringify(r));
  const [c]=await bought(page,id);
  const r2=await page.evaluate(i=>({cards:window.CVStateBridge.get().cards.filter(c=>c.buyOpportunityId===i).length,ledger:(window.CVStateBridge.get().investmentLedger||[]).filter(x=>x.buyOpportunityId===i).length}),id);
  check('Al repetir: exactamente 1 carta y 1 movimiento',r2.cards===1&&r2.ledger===1,JSON.stringify(r2));
 }),
 run('K','Compra → venta → envío → cobro → caja',async({page})=>{
  const id=await opportunity(page,{name:'Carta Prueba K'});const [c]=await bought(page,id);
  const s0=await page.evaluate(()=>window.investmentLedgerStats());
  const cashBuy=await page.evaluate(i=>(window.CVStateBridge.get().investmentLedger||[]).filter(r=>r.buyOpportunityId===i).reduce((a,r)=>a+r.unitPrice*r.qty+r.shipping+r.fees,0),id);
  check('Libro: compra total 79 €',Math.abs(cashBuy-79)<0.005,cashBuy);
  await sell(page,c.id,['100','5','0','Cardmarket','PRUEBA-K','']);
  const saleId=await page.evaluate(()=>window.CVStateBridge.get().saleHistory.find(h=>h.saleOrder==='PRUEBA-K').id);
  const s1=await page.evaluate(()=>window.investmentLedgerStats());
  check('Venta pendiente no entra en caja',Math.abs(s1.sales-s0.sales)<0.005,JSON.stringify({s0:s0.sales,s1:s1.sales}));
  await page.evaluate(id=>{window.CVLedgerWorkflow.confirmShipment(id);window.CVLedgerWorkflow.confirmSaleCash(id)},saleId);
  const s2=await page.evaluate(()=>window.investmentLedgerStats());
  check('Tras cobro: +95 € en caja; resultado 16 €',Math.abs(s2.sales-s0.sales-95)<0.005&&Math.abs((s2.netCash-s0.netCash)-95)<0.005,JSON.stringify({d:s2.sales-s0.sales,dc:s2.netCash-s0.netCash}));
  await page.reload({waitUntil:'load'});await page.waitForTimeout(800);
  const rec=await page.evaluate(()=>window.CVArchive.records().find(r=>r.saleOrder==='PRUEBA-K'));
  check('Tras recargar: COBRADA, resultado 16',rec&&rec.payment==='COBRADA'&&Math.abs(rec.result-16)<0.005,rec&&JSON.stringify({p:rec.payment,r:rec.result}));
 }),
 run('L','Exportar/importar: recuperación equivalente sin duplicar',async({page,browser,base})=>{
  const id=await opportunity(page,{name:'Carta Prueba L'});const [c]=await bought(page,id);await sell(page,c.id,['100','5','0','Cardmarket','PRUEBA-L','']);
  await page.evaluate(()=>window.CVSimpleNav?.showTab?.('data'));
  const [dl]=await Promise.all([page.waitForEvent('download'),page.click('#export')]);const file=await dl.path();
  const before=await page.evaluate(()=>{const s=window.CVStateBridge.get();return {c:s.cards.length,h:s.saleHistory.length,l:s.investmentLedger.length}});
  const {ctx:ctx2,page:p2}=await newPage(browser,base);await p2.evaluate(()=>window.CVSimpleNav?.showTab?.('data'));
  await p2.setInputFiles('#import',file);await p2.waitForTimeout(1500);await p2.setInputFiles('#import',file);await p2.waitForTimeout(1500);
  const after=await p2.evaluate(()=>{const s=window.CVStateBridge.get();return {c:s.cards.length,h:s.saleHistory.length,l:s.investmentLedger.length,u:!!window.CVVault.user().custom.find(x=>x.name==='Carta Prueba L')}});
  check('Importar dos veces = mismo contenido que el origen',after.c===before.c&&after.h===before.h&&after.l===before.l&&after.u,JSON.stringify({before,after}));
  await ctx2.close();
 }),
 run('M','Copia inválida: sin cambios parciales',async({page})=>{
  await page.evaluate(()=>window.CVSimpleNav?.showTab?.('data'));
  const snap=await page.evaluate(()=>localStorage.getItem('cardvault.v2'));
  for(const [nm,body] of [['corrupta','{roto'],['proto','{"format":"cardvault-backup","version":3,"state":{"cards":[],"__proto__":{"x":1}}}'],['sin-cards','{"format":"cardvault-backup","version":3,"state":{"nada":1}}'],['tipos','{"format":"cardvault-backup","version":3,"state":{"cards":"no"}}']]){
   const f=path.join(os.tmpdir(),'cv-bad-'+nm+'-'+Date.now()+'.json');fs.writeFileSync(f,body);await page.setInputFiles('#import',f);await page.waitForTimeout(600);
   const now=await page.evaluate(()=>localStorage.getItem('cardvault.v2'));check('Copia '+nm+' rechazada sin tocar datos',now===snap,nm);
  }
 }),
 run('N','Migración repetida: sin alteración adicional',async({page})=>{
  const r=await page.evaluate(()=>{const M=window.CVMoney;if(!M?.migrateCard)return {err:1};const legacy={id:'leg',purchase:40,purchaseShipping:6,purchaseFees:1,quantity:1,purchaseCosts:{shipping:6,vat:4,duty:null,handling:0,fxFee:1,status:'pagados'}};
   const a=JSON.parse(JSON.stringify(legacy));M.migrateCard(a);const once=JSON.stringify(a);M.migrateCard(a);return {once,twice:JSON.stringify(a),status:a.costLot?.status,total:a.costLot?.totalCents}});
  check('Migrar dos veces da el mismo resultado; arancel desconocido no es 0',r.once===r.twice&&r.total==null&&/desconocid/.test(r.status),JSON.stringify(r).slice(0,300));
 }),
 run('Q','API caída: estado coherente',async({browser,base})=>{
  const {ctx,page}=await newPage(browser,base,{mode:'down'});await page.evaluate(()=>window.CVSimpleNav.showTab('investigacion'));await page.waitForFunction(()=>!!document.querySelector('[data-rd-scan]'));
  await page.waitForFunction(()=>!!window.CV_UNIVERSE,null,{timeout:20000}).catch(()=>{});
  await page.selectOption('[data-rd-group]','vintage');await page.click('[data-rd-scan]');await page.waitForTimeout(1500);await page.click('[data-rd-stop]').catch(()=>{});
  await page.waitForFunction(()=>/Última consulta/.test(document.getElementById('v4Radar').textContent),null,{timeout:60000});
  const t=await page.textContent('#v4Radar');check('Cancelado: sin tarjetas y consulta registrada',(await page.locator('#v4Radar .v4card').count())===0&&/Última consulta/.test(t),(t.match(/Última consulta[^.]*\./)||[''])[0]);
  check('Sin errores JS',page.errors.length===0,page.errors.join('|'));await ctx.close();
 }),
 run('S','Móvil: sin desbordamientos y controles táctiles ≥ 44 px',async({browser,base})=>{
  for(const w of [320,375,390,430]){const ctx=await browser.newContext({viewport:{width:w,height:780},isMobile:true,hasTouch:true});await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());const p=await ctx.newPage();await p.goto(base,{waitUntil:'load'});await p.waitForSelector('#v4Buy .v4head');
   for(const tab of ['radar','comprar-restaurar','investigacion','ventas-reales','collection','archive']){await p.evaluate(t=>window.CVSimpleNav.showTab(t),tab);await p.waitForTimeout(200);
    const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,small:[...document.querySelectorAll('.tab:not(.hidden) .v4btn,.mainNav button')].filter(b=>b.offsetParent&&b.getBoundingClientRect().height<43.5).length}));
    check(w+' px · '+tab,o.sw<=o.iw+1&&o.small===0,JSON.stringify(o))}
   await ctx.close()}
 })
];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await pw.chromium.launch();
 for(const t of MATRIX){if(ONLY.length&&!ONLY.includes(t.id))continue;current=t.id;const {ctx,page}=await newPage(browser,base);
  try{await t.fn({page,browser,base})}catch(e){check('Excepción en la prueba',false,e.message.split('\n')[0])}
  if(page.errors.length)check('Sin errores de JavaScript',false,page.errors.slice(0,3).join(' | '));
  await ctx.close()}
 await browser.close();server.close();
 const by={};for(const r of rows)(by[r.row]=by[r.row]||[]).push(r);
 let fail=0;for(const t of MATRIX){const rs=by[t.id];if(!rs)continue;const ok=rs.every(r=>r.ok);if(!ok)fail++;console.log((ok?'APROBADA ':'FALLIDA  ')+t.id+' · '+t.title);for(const r of rs)console.log('   '+(r.ok?'ok   ':'FALLO')+' '+r.name+(r.ok?'':' → '+r.evidence))}
 if(by.J){const ok=by.J.every(r=>r.ok);console.log((ok?'APROBADA ':'FALLIDA  ')+'J · Reintento sin duplicación');for(const r of by.J)console.log('   '+(r.ok?'ok   ':'FALLO')+' '+r.name+(r.ok?'':' → '+r.evidence));if(!ok)fail++}
 fs.writeFileSync(path.join(os.tmpdir(),'cv-aceptacion-resultado.json'),JSON.stringify(rows,null,1));
 console.log('\nFilas fallidas: '+fail);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
