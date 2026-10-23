(()=>{"use strict";
const Q=s=>document.querySelector(s),N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"}),E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function statusFor(h){const r=(state.investmentLedger||[]).find(x=>x.id===h.id);const s=String(r?.fulfillmentStatus||h.fulfillmentStatus||"");if(["paid","paid-confirmed","completed","settled"].includes(s))return "COBRADA";if(s==="sold-awaiting-shipment")return "ENVÍO PENDIENTE";if(s==="sold-awaiting-payment")return "COBRO PENDIENTE";return "VENDIDA / PENDIENTE"}
function render(){
 const box=Q("#saleHistoryPanel");if(!box)return;
 const rows=[...(state.saleHistory||[])].sort((a,b)=>(b.soldAt||"").localeCompare(a.soldAt||""));
 if(!rows.length){box.innerHTML='<div class="emptyState"><b>Aún no hay ventas registradas.</b><span>Usa “Marcar vendida” en cualquier carta de Mi colección.</span></div>';return}
 box.innerHTML=rows.map(h=>{
  const st=statusFor(h),rec=(window.CVArchive?.records?.()||[]).find(r=>r.id===h.id),result=h.costsPending?null:rec?rec.result:null,est=rec?.resultEstimate;
  return '<article class="sealedCard"><div class="sealedMain"><div><span class="pill">'+st+'</span><h4>'+E(h.name)+'</h4><small>'+E([h.number,h.set,h.language,h.grading?(h.grading+(h.grade&&h.grading!=="RAW"?" "+h.grade:"")):"graduación sin confirmar",h.condition].filter(Boolean).join(" · "))+'</small></div><div class="sealedNumbers"><b>'+EUR(h.unitPrice)+'</b><span>'+N(h.qty||1)+' '+(N(h.qty||1)===1?'unidad':'unidades')+' · neto '+(h.costsPending?'pendiente':EUR(h.net))+'</span></div></div><div class="microNote">Venta '+E(h.soldAt)+(rec?" · coste "+(rec.basis==null?"desconocido":EUR(rec.basis)):"")+(result!=null?" · resultado "+(result>=0?"+":"")+EUR(result):est!=null?" · resultado ESTIMADO "+(est>=0?"+":"")+EUR(est)+" (coste no confirmado)":" · resultado no confirmado"+(rec?.basisStatus?" ("+E(window.CVMoney?.STATUS_TXT?.[rec.basisStatus]||rec.basisStatus)+")":""))+'</div></article>'
 }).join("");
}
window.CVSalesHistory={render};render();
})();