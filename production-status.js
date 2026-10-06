(()=>{"use strict";
function render(){
 let box=document.getElementById("cvProdDiag");
 if(!box){box=document.createElement("details");box.id="cvProdDiag";box.className="cvProdDiag";document.body.appendChild(box)}
 const bridge=!!window.CVStateBridge;
 const state=bridge?window.CVStateBridge.get?.():null;
 const final=!!window.CVFinal;
 const arb=!!window.CVTonArb;
 const scan=arb?window.CVTonArb.state?.scanAt:0;
 box.innerHTML='<summary>Estado técnico</summary>'+
 '<div><b>Release:</b> '+(document.body?.dataset?.release||"—")+'</div>'+
 '<div><b>Estado:</b> '+(bridge?"OK":"FALTA")+' · cartas '+(state?.cards?.length??"—")+' · oportunidades '+(state?.manualOpportunities?.length??"—")+'</div>'+
 '<div><b>Compra YA:</b> '+(final?"OK":"FALTA")+' · <b>Arbitraje:</b> '+(arb?"OK":"FALTA")+' · <b>barrido:</b> '+(scan?new Date(scan).toLocaleTimeString("es-ES"):"—")+'</div>';
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(render,1500));else setTimeout(render,1500);
setInterval(render,15000);
})();