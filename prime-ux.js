(()=>{"use strict";
/* V84.9 · UX iPhone: máximo 1–2 acciones primarias visibles.
   - Oportunidades no ejecutables (sin "LA HE COMPRADO") se pliegan en un cajón WATCH.
   - En cada ficha, las acciones secundarias van a "Más acciones".
   No cambia lógica ni datos: solo reorganiza el DOM ya renderizado. */
let busy=false;
function foldTile(t){
 if(t.querySelector(":scope .tileMore"))return;
 const sec=[...t.querySelectorAll("button.buyButton.secondary,a.buyButton.secondary")].filter(b=>!b.matches("a.buyButton.secondary:first-of-type")||t.querySelector("[data-cv-bought]"));
 const primaryLink=t.querySelector("a.buyButton");
 const extra=sec.filter(b=>b!==primaryLink);
 if(extra.length<2)return;
 const d=document.createElement("details");d.className="tileMore moreActions";d.innerHTML="<summary>Más acciones ("+extra.length+")</summary>";
 const wrap=document.createElement("div");wrap.className="tileMoreGrid";extra.forEach(b=>wrap.appendChild(b));d.appendChild(wrap);
 (t.querySelector(".buyBody")||t).appendChild(d);
}
function foldOpportunities(){
 const panel=document.querySelector("#manualOpportunityPanel");if(!panel||panel.querySelector(".watchDrawer"))return;
 const tiles=[...panel.querySelectorAll(":scope > .buyTile, :scope .buyTile")];if(!tiles.length)return;
 tiles.forEach(foldTile);
 const watch=tiles.filter(t=>!t.querySelector("[data-cv-bought]"));
 if(!watch.length)return;
 const d=document.createElement("details");d.className="watchDrawer";
 d.innerHTML='<summary><b>'+watch.length+' en WATCH / verificación</b><small>'+(tiles.length-watch.length)+' ejecutables · abrir para revisar</small></summary>';
 watch.forEach(t=>d.appendChild(t));
 panel.appendChild(d);
}
function run(){if(busy)return;busy=true;try{foldOpportunities()}catch{}busy=false}
const obs=new MutationObserver(()=>{if(!busy)requestAnimationFrame(run)});
function start(){const host=document.querySelector("#todaySimple");if(host)obs.observe(host,{childList:true,subtree:true});run()}
setTimeout(start,200);
window.CVPrimeUX={run};
})();
