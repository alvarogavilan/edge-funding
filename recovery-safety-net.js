(()=>{"use strict";
const KEY="cardvault.recovery.v1";
function clean(v){return JSON.parse(JSON.stringify(v,(k,x)=>k==="photoURL"?undefined:x))}
function critical(){
 return clean({
  createdAt:new Date().toISOString(),
  cards:state.cards||[],
  saleHistory:state.saleHistory||[],
  investmentLedger:state.investmentLedger||[],
  watch:state.watch||[],
  sealedProducts:state.sealedProducts||[],
  manualOpportunities:state.manualOpportunities||[],
  saleListings:state.saleListings||[],
  operationPolicy:state.operationPolicy||{},
  investmentProfile:state.investmentProfile||{},
  prismaticSPCParentProduct:state.prismaticSPCParentProduct||null
 });
}
function signature(x){
 const s=JSON.stringify(x);
 let h=2166136261;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
 return (h>>>0).toString(16)+"-"+s.length;
}
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x:[]}catch{return []}}
function write(reason="auto"){
 try{
  const snap=critical(),sig=signature(snap),rows=read();
  if(rows[0]?.sig===sig)return rows[0];
  rows.unshift({at:new Date().toISOString(),reason,sig,data:snap});
  localStorage.setItem(KEY,JSON.stringify(rows.slice(0,3)));
  render();return rows[0];
 }catch(e){return null}
}
function download(){
 const rows=read();if(!rows.length){alert("Aún no existe snapshot de recuperación.");return}
 const blob=new Blob([JSON.stringify({format:"cardvault-recovery",version:1,snapshots:rows},null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="card-vault-recuperacion-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function restore(){
 const rows=read(),r=rows[0];if(!r?.data)return alert("No hay snapshot de recuperación.");
 if(!confirm("Restaurar el último snapshot ligero? Reemplazará colección, ventas, Archivo, libro, watchlist y sellado. Las fotos de IndexedDB no se borran."))return;
 const d=r.data;
 for(const k of ["cards","saleHistory","investmentLedger","watch","sealedProducts","manualOpportunities","saleListings"])if(Array.isArray(d[k]))state[k]=d[k];
 if(d.operationPolicy)state.operationPolicy=d.operationPolicy;
 if(d.investmentProfile)state.investmentProfile=d.investmentProfile;
 if("prismaticSPCParentProduct" in d)state.prismaticSPCParentProduct=d.prismaticSPCParentProduct;
 save();location.reload();
}
function render(){
 const host=document.querySelector("#storageBox");if(!host)return;
 let box=document.querySelector("#recoverySafetyNet");
 if(!box){box=document.createElement("div");box.id="recoverySafetyNet";box.className="qaPanel";host.after(box)}
 const rows=read(),r=rows[0];
 box.innerHTML='<b>Safety Net PRIME</b>'+
  '<div class="qaRow"><span>Snapshots ligeros</span><b>'+rows.length+'/3</b></div>'+
  '<div class="qaRow"><span>Último</span><b>'+(r?new Date(r.at).toLocaleString("es-ES"):"Pendiente")+'</b></div>'+
  '<small>Protege colección, ventas, Archivo, libro, watchlist y sellado sin duplicar catálogos ni fotos. El backup completo manual sigue siendo la copia principal.</small>'+
  '<div class="testActions"><button type="button" id="recoveryNow">Crear snapshot</button><button type="button" id="recoveryDownload">Descargar</button><button type="button" id="recoveryRestore">Restaurar último</button></div>';
 document.querySelector("#recoveryNow").onclick=()=>{write("manual");alert("Snapshot de recuperación creado.")};
 document.querySelector("#recoveryDownload").onclick=download;
 document.querySelector("#recoveryRestore").onclick=restore;
}
function start(){
 write("startup");
 render();
 setInterval(()=>write("periodic"),5*60*1000);
 document.addEventListener("visibilitychange",()=>{if(document.hidden)write("background")});
 window.addEventListener("beforeunload",()=>write("beforeunload"));
}
document.addEventListener("DOMContentLoaded",start);setTimeout(start,250);
window.CVRecovery={write,read,restore,download,render};
})();