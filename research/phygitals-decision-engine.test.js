/* Run locally: node research/phygitals-decision-engine.test.js
 * Synthetic test inputs, NEVER real trade recommendations. */
const assert=require('node:assert/strict');
const {evaluate}=require('../phygitals-decision-engine.js');
const now=Date.parse('2026-10-14T12:00:00Z');
const base={
 budgetEUR:50,purchaseEUR:39,feesEUR:1,withdrawalFeesEUR:1,fxSpreadEUR:1,
 firmExitEUR:48,assetId:'TEST-ASSET',buyUrl:'https://example.org/item',
 randomPack:false,exitEvidenceUrl:'https://example.org/binding-bid',
 exitTransferable:true,exitAvailableToSpain:true,exitVerifiedAt:now-60_000,
 exitType:'binding_bid'
};
const cases=[
 ['plausible 6 EUR net needs external verification (synthetic)',{},'REVISAR OFERTA'],
 ['random pack',{randomPack:true},'NO COMPRAR'],
 ['unverified exit',{exitType:'listing'},'NO COMPRAR'],
 ['old quote',{exitVerifiedAt:now-900_001},'NO COMPRAR'],
 ['future quote',{exitVerifiedAt:now+100},'NO COMPRAR'],
 ['missing transferability',{exitTransferable:false},'NO COMPRAR'],
 ['no Spain eligibility',{exitAvailableToSpain:false},'NO COMPRAR'],
 ['cost including fees >50',{purchaseEUR:49},'NO COMPRAR'],
 ['purchase within budget but total cost exceeds tighter budget',{budgetEUR:40,purchaseEUR:39},'NO COMPRAR'],
 ['negative net',{firmExitEUR:39},'NO COMPRAR'],
 ['no identity',{assetId:''},'NO COMPRAR'],
 ['negative budget',{budgetEUR:-1},'NO COMPRAR'],
 ['missing exit proof',{exitEvidenceUrl:''},'NO COMPRAR']
];
for(const [name,change,want] of cases){const result=evaluate({...base,...change},now);assert.equal(result.decision,want,name);console.log('PASS:',name)}
console.log(cases.length+' of '+cases.length+' synthetic tests passed; not live market evidence.');
