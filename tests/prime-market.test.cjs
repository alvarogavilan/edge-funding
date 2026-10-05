const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{},state:{cards:[],manualOpportunities:[]},document:{querySelector:()=>null,addEventListener:()=>{}},setTimeout:()=>{},save:()=>{},URL,Date};
vm.createContext(context);
for(const file of ['prime-identity.js','prime-market.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const api=context.window.CVPrimeMarket;
const ago=days=>new Date(Date.now()-days*86400000).toISOString();
const offer=()=>({name:'Mew VMAX',set:'Prize Pack Series Two',number:'114',universe:'pokemon',grading:'RAW',condition:'NM',variant:'Prize Pack stamp',offerLanguage:'English',languageVerified:true,price:60,seller:'ExactSeller',url:'https://www.cardmarket.com/en/Pokemon/Products/Singles/Prize-Pack/Mew',sameMarketComparableVerified:true,evidenceCheckedAt:ago(.1),closedSaleEvidence:{source:'TCGPlayer',url:'https://www.tcgplayer.com/product/123',at:ago(.1),pricesEUR:[500,140],saleDates:[ago(20),ago(2)],language:'EN',condition:'Near Mint',identityVerified:true,languageVerified:true,conditionVerified:true,transactionType:'closed-sale'}});
let x=offer();x.marketEvidence={identityKey:context.window.CVIdentity.key(x)};
let result=api.closedSaleEvidence(x);
assert.equal(result.verified,true);assert.equal(result.last,140);assert.equal(result.median,320);
assert.ok(Math.abs(api.quality(x).econ.exit-(140*.85*.95-3))<1e-8);
for(const [key,value] of [['language','German'],['condition','PO'],['identityVerified',false],['url','https://www.ebay.es/itm/123'],['at',ago(-1)]]){
 const y=offer();y.closedSaleEvidence[key]=value;assert.equal(api.closedSaleEvidence(y).verified,false,key);
}
x=offer();delete x.closedSaleEvidence.saleDates;assert.equal(api.closedSaleEvidence(x).verified,false,'undated sales');
x=offer();x.closedSaleEvidence.saleDates=[ago(121),ago(-1)];assert.equal(api.closedSaleEvidence(x).sample,0,'stale and future sales');
x=offer();x.closedSaleEvidence.pricesEUR=[100,200,300,400];x.closedSaleEvidence.saleDates=[ago(10),ago(5),ago(4),ago(1)];assert.equal(api.closedSaleEvidence(x).median,250);
x.evidenceCheckedAt=ago(-1);assert.equal(api.exitEvidence(x).fresh,false);
x=offer();context.state.cards=[{...x}];assert.equal(api.quality(x).checks.find(([k])=>k==='No está ya en Mi colección')[1],false);
console.log('PRIME: cronología, mediana, recorte, idioma, estado, identidad, eBay, caducidad, fechas futuras y duplicados correctos.');
