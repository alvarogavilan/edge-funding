// Ejecutar manualmente: node tests/card-vault-compra-ya-smoke.cjs
// No usa GitHub Actions, Internet, compras ni datos de ejemplo para métricas de mercado.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const script=n=>fs.readFileSync(path.join(root,n),'utf8');
const nodes=()=>({innerHTML:'',textContent:'',style:{display:'block'},onclick:null,querySelector:()=>nodes()});
const panel=nodes(),radar={insertBefore(){}};
const doc={readyState:'complete',getElementById:id=>id==='radar'?radar:id==='cvDealsVerified'?panel:null,createElement:nodes,querySelector:()=>null};
const win={addEventListener(){},CVStateBridge:{get:()=>({cards:[],sealedProducts:[]})}};
const ctx={window:win,document:doc,URL,Date,Number,String,Array,Set,Object,Math,Intl,setTimeout:fn=>fn()};
vm.runInNewContext(script('retail-offers-data.js'),ctx,{filename:'retail-offers-data.js'});
vm.runInNewContext(script('card-arbitrage-priority.js'),ctx,{filename:'card-arbitrage-priority.js'});
assert.ok(win.CVDealsVerified);
assert.ok(panel.innerHTML.includes('Compra YA'));
const all=win.CVDealsVerified.getRows();
assert.ok(Array.isArray(all)&&all.length>0,'el repositorio debe contener al menos una oferta de estudio');
for(const row of all){assert.ok(row.r.url.startsWith('https://'))}
const stale=all.filter(x=>!x.buyValid).length;
const active=all.filter(x=>x.buyValid).length;
console.log(JSON.stringify({status:'OK',offers:all.length,live:active,historical:stale,verifiedNetResale:0},null,2));
assert.ok(!panel.innerHTML.includes('beneficio garantizado'),'nunca presentar ganancias garantizadas');
