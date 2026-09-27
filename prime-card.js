(()=>{"use strict";
const N=v=>Number(v)||0,EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function get(id){return (state.manualOpportunities||[]).find(x=>x.id===id)||null}
function dossier(x){
 const q=window.CVPrimeMarket?.quality?.(x)||null;
 const liq=window.CVPrimeMarket?.liquidityBand?.(x)||{label:"SIN DATO VERIFICADO",score:null};
 const d=window.CVPrimeMarket?.depth?.(x)||{prices:[],gap:null,units:0};
 const ev=x.marketEvidence||{};
 const reasons=q?.checks||[];
 const missing=reasons.filter(([,ok])=>!ok).map(([k])=>k);
 const positive=reasons.filter(([,ok])=>ok).map(([k])=>k);
 return {q,liq,d,ev,missing,positive};
}
function ensureDialog(){
 let dlg=document.querySelector("#primeCardDialog");if(dlg)return dlg;
 dlg=document.createElement("dialog");dlg.id="primeCardDialog";dlg.className="primeCardDialog";
 dlg.innerHTML='<form method="dialog"><div id="primeCardBody"></div><button class="buyButton" value="close">Cerrar</button></form>';
 document.body.appendChild(dlg);
 return dlg;
}
function row(label,value,cls=""){return '<div class="qaRow"><span>'+E(label)+'</span><b class="'+E(cls)+'">'+E(value)+'</b></div>'}
function open(id){
 const x=get(id);if(!x)return;
 const {q,liq,d,ev,missing,positive}=dossier(x),dlg=ensureDialog(),body=dlg.querySelector("#primeCardBody");
 const conf=window.CVPrimeMarket?.evidenceConfidence?.(x)||{label:"NO VERIFICADA",score:0};
 const history=Array.isArray(x.marketEvidenceHistory)?x.marketEvidenceHistory:[];
 const sources=[ev,...history].map(z=>String(z?.source||"").trim()).filter(Boolean);
 const uniqueSources=[...new Set(sources.map(s=>s.toLowerCase()))].length;
 const price=N(x.price),exit=q?.econ?.exit||0,edge=q?.econ?.edge||0,roi=q?.econ?.roi||0;
 const depth=d.prices?.length?d.prices.slice(0,8).map(EUR).join(" → "):"SIN DATO VERIFICADO";
 const last=N(x.lastSalePrice||ev.lastSaleEUR),lastDate=x.lastSaleDate||ev.lastSaleDate||"";
 const exact=q?.ex?"COMPLETA":"INCOMPLETA";
 const status=x.approval==="BUY-ONE"||x.approval==="BUY-SCALE"?"COMPRAR AHORA":x.approval==="WATCH"?"WATCH":x.approval||"REVISAR";
 body.innerHTML=
  '<div class="welcome"><b>Ficha PRIME · '+E(x.name)+'</b><span>'+E([x.set,x.number,x.variant,x.offerLanguage||x.language,x.condition].filter(Boolean).join(" · "))+'</span></div>'+
  '<div class="statsGrid">'+
   '<div><span>Estado</span><b>'+E(status)+'</b></div>'+
   '<div><span>Entrada</span><b>'+EUR(price)+'</b></div>'+
   '<div><span>Salida conservadora</span><b>'+EUR(exit)+'</b></div>'+
   '<div><span>Edge aprox.</span><b>'+EUR(edge)+'</b></div>'+
   '<div><span>ROI aprox.</span><b>'+roi.toFixed(1)+'%</b></div>'+
   '<div><span>Liquidez verificada</span><b>'+E(liq.label)+(liq.score==null?'':' · '+liq.score+'/100')+'</b></div>'+
   '<div><span>Confianza evidencia</span><b>'+E(conf.label)+' · '+conf.score+'/100</b></div>'+
  '</div>'+
  '<div class="qaPanel"><b>Identidad ejecutable</b>'+
   row("Oferta exacta",exact,q?.ex?"ok":"warn")+
   row("Vendedor",x.seller||"SIN DATO")+
   row("Idioma",x.offerLanguage||x.language||"SIN DATO")+
   row("Variante",x.variant||"SIN DATO")+
   row("Condición / grado",x.condition||x.grade||"SIN DATO")+
   row("URL",/^https?:\/\//i.test(String(x.url||""))?"OK":"SIN URL",/^https?:\/\//i.test(String(x.url||""))?"ok":"warn")+
  '</div>'+
  '<div class="qaPanel"><b>Mercado y salida</b>'+
   row("Última venta real",last>0?EUR(last)+(lastDate?" · "+lastDate:""):"SIN DATO VERIFICADO")+
   row("Mediana ventas reales",N(x.soldMedianEUR||ev.soldMedianEUR)>0?EUR(x.soldMedianEUR||ev.soldMedianEUR)+" · "+N(x.soldSample||ev.soldSample)+" comps":"SIN DATO VERIFICADO")+
   row("Ventas 7/30/90d",(x.sales7!=null||x.sales30!=null||x.sales90!=null)?(x.sales7??"—")+"/"+(x.sales30??"—")+"/"+(x.sales90??"—"):"SIN DATO VERIFICADO")+
   row("Profundidad",depth)+
   row("Gap 1º→2º",d.gap==null?"SIN DATO":d.gap.toFixed(1)+"%")+
   row("Disponible comparable",x.available!=null?String(x.available):"SIN DATO")+
   row("Fuente evidencia",ev.source||x.evidenceSource||"SIN DATO VERIFICADO")+
   row("Identidad evidencia",q?.ee?.idOk?"INTACTA":"NO COINCIDE / SIN SELLO")+
   row("Edad evidencia",Number.isFinite(q?.ee?.age)?q.ee.age.toFixed(1)+" h":"SIN DATO")+
   row("Vigencia",q?.ee?.fresh?"≤24 h · VÁLIDA":"CADUCADA / SIN DATO")+
   row("Historial evidencia",String(history.length+1)+" snapshot(s)")+
   row("Fuentes distintas",String(uniqueSources))+
  '</div>'+
  '<div class="qaPanel"><b>Gate PRIME</b>'+
   row("Cumple",q?q.passed+"/"+q.total:"SIN EVALUAR")+
   (positive.length?'<div class="microNote">✓ '+positive.map(E).join(" · ✓ ")+'</div>':"")+
   (missing.length?'<div class="microNote"><b>Falta:</b> '+missing.map(E).join(" · ")+'</div>':'<div class="microNote"><b>Sin bloqueos del gate actual.</b></div>')+
   '<small>La ficha no compra ni eleva automáticamente una oportunidad. La evidencia debe seguir siendo exacta y ejecutable.</small>'+
  '</div>'+
  (x.note?'<div class="qaPanel"><b>Notas de evidencia</b><div class="microNote">'+E(x.note)+'</div></div>':"")+
  (x.url?'<a class="buyButton" href="'+E(x.url)+'" target="_blank" rel="noopener">ABRIR OFERTA / MERCADO</a>':"");
 dlg.showModal();
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-prime-card]");if(!b)return;
 e.preventDefault();e.stopPropagation();open(b.dataset.primeCard);
});
window.CVPrimeCard={open,dossier};
})();