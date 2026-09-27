(()=>{
const Q=s=>document.querySelector(s),N=v=>Number(v)||0,E=v=>{const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML};
function exactOfferCount(){
  const rows=[...(state.euOffers||[]),...(state.gradedOffers||[])];
  return rows.filter(o=>String(o.currency||"EUR").toUpperCase()==="EUR"&&N(o.total||o.price)>0&&window.CVMarket?.admittedShop?.(o.url||"")?.ok).length;
}
function psaReadyCount(){
  return (state.cards||[]).filter(c=>!c.archivedSold&&(c.grading||"RAW")==="RAW").filter(c=>{try{const e=psaEvidenceForCard(c);return !!(e?.p9&&e?.p10)}catch{return false}}).length;
}
function sealedStats(){
  const rows=state.sealedProducts||[],buy=rows.filter(p=>window.CVSealedPrime?.decision?.(p)?.key==="buy");
  return {total:rows.length,buy:buy.length};
}
function primeBuyCount(){
  return (state.manualOpportunities||[]).filter(x=>{const q=window.CVPrimeMarket?.quality?.(x);return q&&q.passed===q.total&&["BUY-ONE","BUY-SCALE"].includes(x.approval)}).length;
}
function collectionStats(){
  const rows=(state.cards||[]).filter(c=>!c.archivedSold),valued=rows.filter(c=>N(c.value)>0),pending=rows.filter(c=>c.draft||!N(c.value));
  return {total:rows.length,valued:valued.length,pending:pending.length};
}
function salesStats(){const rows=window.CVSalesDesk?.active?.()||[];return {active:rows.length,gross:rows.reduce((a,x)=>a+N(x.price),0),net:rows.reduce((a,x)=>a+N(x.price)*.95,0)}}
function ledgerStats(){
  const rows=state.investmentLedger||[],settled=x=>["paid","paid-confirmed","completed","settled"].includes(String(x.fulfillmentStatus||"").toLowerCase());
  const sale=rows.filter(x=>x.type==="sell"&&settled(x)).reduce((a,x)=>a+N(x.unitPrice)*N(x.qty||1)-N(x.fees)-N(x.shipping),0);
  return {entries:rows.length,released:sale};
}
function render(){
  const host=Q("#operationalStatus");if(!host)return;
  const c=collectionStats(),s=sealedStats(),l=ledgerStats(),sale=salesStats(),offers=exactOfferCount(),psa=psaReadyCount(),prime=primeBuyCount();
  const critical=[
    {name:"Mi colección",ok:c.total>0,detail:c.total+" posiciones · "+c.valued+" valoradas"+(c.pending?" · "+c.pending+" pendientes":"")},
    {name:"BUY PRIME",ok:true,detail:prime?prime+" compra(s) ejecutable(s) PRIME":offers?offers+" oferta(s) exacta(s) detectada(s) · 0 pasan PRIME":"0 BUY PRIME · correcto si no hay evidencia completa"},
    {name:"PSA",ok:true,detail:psa?psa+" cartas con PSA 9+10 comparables":"Motor listo · esperando comparables/fotos"},
    {name:"Sellado",ok:true,detail:s.buy?s.buy+" producto(s) pasan PRIME":"Motor listo · "+s.total+" registrados · 0 BUY PRIME"},
    {name:"Ventas",ok:true,detail:sale.active?sale.active+" anuncios · neto esperado ≈ "+sale.net.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"Sin anuncios activos"},{name:"Reinvertir",ok:true,detail:l.released>0?l.released.toLocaleString("es-ES",{style:"currency",currency:"EUR"})+" liberados en ledger":"Motor listo · sin capital liberado registrado"}
  ];
  const systemReady=critical.every(x=>x.ok);
  host.innerHTML='<section class="opsHero '+(systemReady?"ready":"warn")+'"><div><span>MODO OPERAR · PRIME</span><h2>'+(systemReady?"APP OPERATIVA · FINAL":"FALTA CERRAR DATOS")+'</h2><p>'+(systemReady?"Los motores principales están disponibles. Que una zona muestre 0 oportunidades significa que hoy no hay una operación que pase sus filtros; no es un fallo.":"Hay un bloqueo de datos básico que revisar antes de operar.")+'</p></div><b>'+(systemReady?"LISTA":"REVISAR")+'</b></section>'+
    '<div class="opsGrid">'+critical.map(x=>'<div class="opsItem '+(x.ok?"ok":"warn")+'"><span>'+E(x.name)+'</span><b>'+(x.ok?"✓":"!")+'</b><small>'+E(x.detail)+'</small></div>').join("")+'</div>'+
    '<div class="opsRules"><b>Reglas de operación</b><span>Comprar ahora = gate PRIME completo y vigente. PSA = comparables reales + revisión física. Sellado = oferta exacta + salida verificable + gate PRIME. Reinvertir = solo ventas cobradas. Si falta evidencia, Card Vault debe decir esperar.</span></div>';
}
window.CVFinalOps={render};
render();
document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
setInterval(render,30000);
})();