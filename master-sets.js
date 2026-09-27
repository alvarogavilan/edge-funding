(()=>{"use strict";
const Q=s=>document.querySelector(s),N=v=>Number(v)||0;
function E(v){const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML}
const EUR=v=>N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
if(!state.collectorTools)state.collectorTools={masterTargets:{}};
function imageOf(c){
 return c.photoURL||c.photo||c.referenceImage||(()=>{
  const rows=[...(state.marketScan||[]),...(state.marketCandidates||[]),...(state.globalRadar?.scored||[]).map(z=>z.x||z)].filter(Boolean);
  const name=String(c.name||"").trim().toLowerCase(),num=String(c.number||"").replace(/\s/g,"").toLowerCase();
  return rows.find(r=>r.image&&String(r.name||"").trim().toLowerCase()===name&&(!num||String(r.number||"").replace(/\s/g,"").toLowerCase()===num))?.image||"";
 })();
}
function prudent(c){
 try{const b=window.CVPrimeValuation?.bucket?.(c);return b&&["CONFIRMED","PROVISIONAL"].includes(b.bucket)?N(b.amount):0}catch{return 0}
}
function cost(c){
 const q=Math.max(1,N(c.quantity)||1);
 if(c.landedCostUnit!=null&&N(c.landedCostUnit)>0)return N(c.landedCostUnit)*q;
 if(c.purchase!=null&&N(c.purchase)>=0)return (N(c.purchase)*q)+N(c.purchaseShipping)+N(c.purchaseFees);
 return 0;
}
function render(){
 const box=Q("#masterSets");if(!box)return;
 const groups={};
 for(const c of (state.cards||[])){
  if(c.archivedSold)continue;
  const k=(c.universe||"pokemon")+"|"+(c.set||"Sin set");
  (groups[k]||(groups[k]=[])).push(c);
 }
 const keys=Object.keys(groups).sort((a,b)=>a.localeCompare(b,"es"));
 box.innerHTML=keys.length?keys.map(k=>{
  const rows=groups[k],parts=k.split("|"),set=parts[1],unique=new Set(rows.map(c=>c.number||c.name)).size,target=N(state.collectorTools.masterTargets[k]),
    progress=target?Math.min(100,unique/target*100):null,value=rows.reduce((a,c)=>a+prudent(c),0),basis=rows.reduce((a,c)=>a+cost(c),0),
    image=rows.map(imageOf).find(Boolean)||"",cards=rows.slice().sort((a,b)=>String(a.number||"").localeCompare(String(b.number||""),"es")).slice(0,12);
  return '<article class="masterSetPrime">'+
    (image?'<img class="masterSetCover" src="'+E(image)+'" alt="'+E(set)+'" loading="lazy">':'<div class="masterSetCover masterSetNoImage">SIN IMAGEN<br>DE CATÁLOGO</div>')+
    '<div class="masterSetBody"><div class="masterSetHead"><div><small>'+E(parts[0]==="lorcana"?"Lorcana":"Pokémon")+'</small><h3>'+E(set)+'</h3></div><b>'+unique+' '+(unique===1?'carta':'cartas')+'</b></div>'+
    '<div class="masterSetStats"><div><span>Valor prudente</span><b>'+EUR(value)+'</b></div><div><span>Coste conocido</span><b>'+EUR(basis)+'</b></div><div><span>Progreso</span><b>'+(target?unique+'/'+target+' · '+progress.toFixed(1)+'%':'Objetivo no verificado')+'</b></div></div>'+
    (target?'<div class="allocationBar"><i style="width:'+progress+'%"></i></div>':'')+
    '<details><summary>Ver mis cartas ('+unique+')</summary><div class="masterSetCards">'+cards.map(c=>'<div><span>'+E(c.number||"—")+'</span><b>'+E(c.name)+'</b><small>'+E(c.grading||"RAW")+' '+E(c.grade||c.condition||"")+'</small></div>').join("")+'</div></details>'+
    '<details class="masterSetTarget"><summary>Configurar objetivo total</summary><label class="microNote">Total verificado del set <input data-master-set="'+E(k)+'" type="number" min="0" inputmode="numeric" value="'+(target||"")+'"></label><small>Solo introdúcelo si conoces el total exacto. Card Vault no lo inventa.</small></details>'+
    '</div></article>';
 }).join(""):'<div class="emptyState"><b>Aún no hay sets.</b><span>Añade cartas a Mi colección y aparecerán aquí automáticamente.</span></div>';
 document.querySelectorAll("[data-master-set]").forEach(x=>x.onchange=()=>{state.collectorTools.masterTargets[x.dataset.masterSet]=N(x.value);save();render()});
}
window.renderMasterSets=render;render();setTimeout(render,2200);document.addEventListener("click",e=>{if(e.target.closest('[data-tab="collector"]')||e.target.closest('[data-simple-tab]'))setTimeout(render,150)});
})();