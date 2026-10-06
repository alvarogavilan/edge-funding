(()=>{"use strict";
const KEY="cv_prod_diag_v1";
const errs=[];
function rec(type,msg,src,line,col){
 const row={at:new Date().toISOString(),type,msg:String(msg||""),src:String(src||""),line:line||0,col:col||0};
 errs.push(row);while(errs.length>20)errs.shift();
 try{localStorage.setItem(KEY,JSON.stringify(errs))}catch{}
 render();
}
window.addEventListener("error",e=>rec("error",e.message,e.filename,e.lineno,e.colno));
window.addEventListener("unhandledrejection",e=>rec("promise",e.reason?.message||e.reason||"Promise rechazada"));
function ok(v){return v?"OK":"FALTA"}
function render(){
 let box=document.getElementById("cvProdDiag");
 if(!box){box=document.createElement("details");box.id="cvProdDiag";box.className="cvProdDiag";document.body.appendChild(box)}
 let stored=[];try{stored=JSON.parse(localStorage.getItem(KEY)||"[]")}catch{}
 const bridge=!!window.CVStateBridge;
 const state=bridge?window.CVStateBridge.get?.():null;
 const final=!!window.CVFinal;
 const arb=!!window.CVTonArb;
 const scan=arb?window.CVTonArb.state?.scanAt:0;
 const rel=document.body?.dataset?.release||"";
 box.innerHTML='<summary>Diagnóstico · '+(stored.length?'⚠ '+stored.length+' error(es)':'✅ JS sin errores capturados')+'</summary>'+
 '<div><b>Release:</b> '+(rel||"—")+'</div>'+
 '<div><b>Estado Card Vault:</b> '+ok(bridge)+' · cartas '+(state?.cards?.length??"—")+' · oportunidades '+(state?.manualOpportunities?.length??"—")+'</div>'+
 '<div><b>Módulo final:</b> '+ok(final)+' · <b>Arbitraje:</b> '+ok(arb)+' · <b>último barrido:</b> '+(scan?new Date(scan).toLocaleTimeString("es-ES"):"—")+'</div>'+
 (stored.length?'<ol>'+stored.slice(-8).reverse().map(x=>'<li><b>'+x.type+'</b> '+escapeHtml(x.msg)+'<br><small>'+escapeHtml(x.src)+(x.line?':'+x.line:'')+'</small></li>').join("")+'</ol>':'<p>Si algo visual no responde pero aquí todo está OK, el problema es de datos/red y no de JavaScript.</p>')+
 '<button type="button" id="cvDiagClear">Limpiar errores</button>';
 box.querySelector("#cvDiagClear").onclick=()=>{try{localStorage.removeItem(KEY)}catch{};errs.length=0;render()};
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(render,1500));else setTimeout(render,1500);
setInterval(render,15000);
})();