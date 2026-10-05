const assert = require("node:assert/strict");
const fs = require("node:fs");
const {evaluate, allowedUrl} = require("../online-arbitrage.js");
const now = Date.parse("2026-10-05T23:42:00Z");
const base = {
  purchaseCents:10000, saleCents:15000, shippingCents:0, feesCents:0,
  withdrawalCents:0, taxesCents:0, contingencyCents:0,
  sameUnitVerified:true, stockVerified:true, spainAllowed:true,
  homeLogisticsVerified:true, cashWithdrawalVerified:true,
  bindingExitVerified:true, inspectionResolved:true, nonPromoVerified:true,
  costsComplete:true, accountEligibleVerified:true,
  buyUrl:"https://seller.example/product/1", exitUrl:"https://buyer.example/offer/1",
  evidenceUrls:["https://seller.example/product/1","https://buyer.example/offer/1"],
  checkedAt:new Date(now).toISOString(), quoteExpiresAt:new Date(now+3600000).toISOString()
};
assert.equal(evaluate(base,now).status,"HUMAN_REVIEW");
assert.equal(evaluate(base,now).guaranteed,false);
assert.equal(evaluate(base,now).autoPurchase,false);
for(const key of Object.keys(base).filter(k=>typeof base[k]==="boolean")){
  assert.equal(evaluate({...base,[key]:false},now).status,"BLOCKED",key);
  assert.equal(evaluate({...base,[key]:undefined},now).status,"BLOCKED",key);
}
for(const key of Object.keys(base).filter(k=>k.endsWith("Cents"))){
  for(const value of [null,undefined,"0",-1,NaN,Infinity,0.1]){
    assert.equal(evaluate({...base,[key]:value},now).status,"BLOCKED",key);
  }
}
for(const url of ["https://www.ebay.es/item/1","https://ebay.com/item/1","https://www.ebay.co.uk/1","javascript:alert(1)","http://seller.example","https://user:pass@seller.example"]){
  assert.equal(allowedUrl(url),false,url);
  assert.equal(evaluate({...base,buyUrl:url},now).status,"BLOCKED");
}
assert.equal(evaluate({...base,evidenceUrls:["https://seller.example","https://www.ebay.es/1"]},now).status,"BLOCKED");
assert.equal(evaluate({...base,quoteExpiresAt:new Date(now).toISOString()},now).status,"BLOCKED");
assert.equal(evaluate({...base,checkedAt:new Date(now-86400001).toISOString()},now).status,"BLOCKED");
assert.equal(evaluate({...base,checkedAt:new Date(now+1).toISOString()},now).status,"BLOCKED");
assert.equal(evaluate({...base,saleCents:10000},now).status,"BLOCKED");
assert.equal(evaluate({...base,purchaseCents:Number.MAX_SAFE_INTEGER,feesCents:1},now).status,"BLOCKED");
let scenarios=0,positive=0;
// 200 resale prices x 50 markdowns x 100 cost levels = 1,000,000.
// Each is tested with and without a binding buyer = 2,000,000.
// Hypothetical grid, not probabilities, real quotes or market simulations.
for(let sale=5000;sale<25000;sale+=100){
  for(let markdown=0;markdown<50;markdown++){
    for(let fees=0;fees<10000;fees+=100){
      const netSale=Math.floor(sale*(100-markdown)/100);
      const r={...base,saleCents:netSale,feesCents:fees};
      const expected=netSale-10000-fees;
      const result=evaluate(r,now);
      assert.equal(result.netCents,expected);
      assert.equal(result.status,expected>0?"HUMAN_REVIEW":"BLOCKED");
      assert.equal(result.guaranteed,false);
      if(expected>0)positive++;
      assert.equal(evaluate({...r,bindingExitVerified:false},now).status,"BLOCKED");
      scenarios+=2;
    }
  }
}
const report={executedAt:new Date().toISOString(),syntheticScenarios:scenarios,
  positiveArithmeticCases:positive,marketTransactions:0,guaranteedProfitCases:0,
  passed:true,meaning:"Validation of arithmetic and rejection rules only; no market probability or profitability evidence."};
fs.mkdirSync("docs",{recursive:true});
fs.writeFileSync("docs/arbitrage-validation.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report));
