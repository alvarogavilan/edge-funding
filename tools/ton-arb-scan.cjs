// Registrador 24 h sin coste: `node tools/ton-arb-scan.cjs` en tu ordenador (Node ≥18).
// Cotiza en STON.fi/DeDust cada 60 s (8 s si hay candidata) y guarda el registro en
// ton-arb-log.json (mismo formato que la app: importable desde "Exportar registro").
const fs=require("node:fs");
const path=require("node:path");
const core=require("../ton-arb-scanner.js");
const file=path.resolve(process.argv[2]||"ton-arb-log.json");
const db=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,"utf8")):{};
core.setStore({read:k=>db[k]??null,write:(k,v)=>{db[k]=v;fs.writeFileSync(file,JSON.stringify(db))}});
const pct=v=>v==null?"—":(v>=0?"+":"")+v.toFixed(3)+"%";
async function loop(){
  await core.scan();
  const r=core.state.results,best=r[0],now=Date.now();
  const f=core.frequencyStats(core.readLog(),now,core.capitalLimit(core.readTrades()).limit);
  const green=r.filter(x=>x.eval.ready);
  console.log(new Date().toISOString(),green.length?"🟢 VERDE":"🔴 sin verde",
    best?best.route.id+" neto mín "+pct(best.eval.netPct):"",
    "| 24h: "+f.day+" oportunidades, "+f.coverageH.toFixed(1)+" h observadas",
    Object.keys(core.state.sourceErr).length?"| errores: "+JSON.stringify(core.state.sourceErr):"");
  for(const g of green)console.log("  ",g.route.id,g.legs.map(l=>l.url).join(" | "));
  const fast=best&&best.eval.netPct>=core.RULES.minNetPct*0.5;
  setTimeout(loop,fast?8000:60000);
}
loop();
