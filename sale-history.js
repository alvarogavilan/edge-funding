(()=>{"use strict";
const Q=s=>document.querySelector(s),N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
function statusFor(h){const r=(state.investmentLedger||[]).find(x=>x.id===h.id);const s=String(r?.fulfillmentStatus||h.fulfillmentStatus||"");return ["paid","paid-confirmed","completed","settled"].includes(s)?"COBRADA":"COBRO PENDIENTE"}
function render(){
 const box=Q("#saleHistoryPanel");if(!box)return;
 const rows=[...(state.saleHistory||[])].sort((a,b)=>(b.soldAt||"").localeCompare(a.soldAt||""));
 if(!rows.length){box.innerHTML='<div class="emptyState"><b>Aún no hay ventas registradas.</b><span>Usa “Marcar vendida” en cualquier carta de Mi colección.</span></div>';return}
 box.innerHTML=rows.map(h=>{
  const st=statusFor(h),basis=h.purchase==null?null:N(h.purchase)*N(h.qty||1),result=basis==null?null:N(h.net)-basis;
  return '<article class="sealedCard"><div class="sealedMain"><div><span class="pill">'+st+'</span><h4>'+String(h.name||"")+'</h4><small>'+[h.number,h.set,h.language,h.grading,h.grade].filter(Boolean).join(" · ")+'</small></div><div class="sealedNumbers"><b>'+EUR(h.unitPrice)+' / ud</b><span>'+N(h.qty||1)+' ud · neto '+EUR(h.net)+'</span></div></div><div class="microNote">Venta '+String(h.soldAt||"")+(result==null?"":" · resultado vs coste "+(result>=0?"+":"")+EUR(result))+'</div></article>'
 }).join("");
}
window.CVSalesHistory={render};render();
})();