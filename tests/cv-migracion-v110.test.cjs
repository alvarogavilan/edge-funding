// Migración de costes antiguos (V110). Ejecutar: node tests/cv-migracion-v110.test.cjs
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const load=()=>{const ctx={console,Date,JSON,Math,Number,String,Object,Array,Set,Map};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','cv-money.js'),'utf8'),ctx);return ctx};
const {CVMoney:M}=load();let n=0;const t=(name,fn)=>{fn();n++;console.log('OK ·',name)};
t('C: compra antigua de Japón sin datos fiscales → subtotal 57, total desconocido, nada «no aplica» inventado',()=>{
 const c={purchase:50,purchaseShipping:5,purchaseFees:2,quantity:1,buyCountry:'Japón'};M.migrateCard(c);const l=c.costLot;
 assert.equal(l.knownCents,5700);assert.equal(l.totalCents,null);assert.notEqual(l.status,'pagado');
 for(const k of ['vat','duty','handling']){assert.notEqual(l.extras[k].status,'no-aplica',k);assert.equal(l.extras[k].cents,null,k)}
 assert.equal(c.purchase,50);assert.equal(c.purchaseShipping,5);assert.equal(c.purchaseFees,2);
 const r=M.remaining(c);assert.equal(r.cents,null);assert.equal(r.knownCents,5700);
 assert.equal(M.result(9500,M.basisForUnits(c,1)).cents,null)});
t('D: impuestos explícitamente incluidos → sin doble cómputo y con justificación',()=>{
 const c={purchase:60,purchaseShipping:5,purchaseFees:0,quantity:1,purchaseCosts:{shipping:5,vat:null,duty:0,handling:0,fxFee:0,status:'pagados',included:{vat:{in:'precio',ref:'Factura 123'}}}};M.migrateCard(c);
 assert.equal(c.costLot.extras.vat.status,'incluido');assert.equal(c.costLot.totalCents,6500);assert.equal(c.costLot.extras.vat.ref,'Factura 123')});
t('E/G: lote V109 persistido con «no-aplica» inferido y ventas → marcado para revisión, idempotente',()=>{
 const lot={v:1,qtyOriginal:2,unitPriceCents:5000,extras:{shipping:{cents:1000,status:'pagado'},vat:{cents:0,status:'no-aplica'},duty:{cents:0,status:'no-aplica'},handling:{cents:0,status:'no-aplica'},fxFee:{cents:0,status:'pagado'}},knownCents:11000,totalCents:11000,status:'pagado',unknown:[],allocation:[5500,5500],unitsSold:1,source:'migrado-legado',note:'',conflicts:[],createdAt:''};
 const st={cards:[{id:'c1',name:'Lote V109',purchase:50,purchaseShipping:10,purchaseFees:0,quantity:1,costLot:JSON.parse(JSON.stringify(lot))}],saleHistory:[{id:'s1',cardId:'c1',qty:1,net:70,basisCents:5500,basisStatus:'pagado',resultCents:1500,costUnits:{from:0,to:1}}]};
 const r1=M.repairState(st);const a=JSON.stringify(st);const r2=M.repairState(st);
 assert.equal(JSON.stringify(st),a,'segunda pasada sin cambios');assert.ok(r1.changed&&!r2.changed);
 const l=st.cards[0].costLot;assert.equal(l.unitsSold,1);assert.deepEqual(l.allocation,[5500,5500]);assert.equal(l.status,'revisar');assert.equal(l.totalCents,null);assert.equal(l.knownCents,11000);
 for(const k of ['vat','duty','handling'])assert.equal(l.extras[k].status,'desconocido');assert.equal(l.reviews.length,1);
 const h=st.saleHistory[0];assert.equal(h.basisStatus,'revisar');assert.equal(h.basisHistory[0].basisStatus,'pagado');assert.equal(h.basisHistory[0].resultCents,1500);assert.equal(h.basisCents,5500)});
t('Lotes de «He comprado» con no-aplica declarado por el usuario no se tocan',()=>{
 const l=M.newLot({qty:1,unitPrice:50,extras:{shipping:{eur:5,status:'pagado'},vat:{status:'no-aplica'},duty:{status:'no-aplica'},handling:{status:'no-aplica'},fxFee:{eur:0,status:'pagado'}}});
 const st={cards:[{id:'x',purchase:50,quantity:1,costLot:l}],saleHistory:[]};const before=JSON.stringify(st);M.repairState(st);assert.equal(JSON.stringify(st),before)});
t('A: 79 € intacto',()=>{const l=M.newLot({qty:1,unitPrice:50,extras:{shipping:{eur:5,status:'pagado'},vat:{eur:12,status:'pagado'},duty:{eur:3,status:'pagado'},handling:{eur:7,status:'pagado'},fxFee:{eur:2,status:'pagado'}}});assert.equal(l.totalCents,7900)});
console.log('\n'+n+' pruebas de migración superadas');
