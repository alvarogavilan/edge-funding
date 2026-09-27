(()=>{"use strict";
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>(Number(v)||0).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const Q=s=>document.querySelector(s);
const qty=c=>Math.max(1,Number(c?.quantity)||1);
function img(c){
 const exact={
  "own-hitmonlee-106-jp-fossil-psa5":"https://auctions.c.yimg.jp/images.auctions.yahoo.co.jp/image/dr000/auc0511/users/e9f856a2ec12f2a846115d263d6a1bc6928e6c87/i-img977x1200-1730593480kv0niq7.jpg",
  "own-surfing-pikachu-mt-fuji-jr-1997":"https://cdn-vault.fanaticscollect.com/2026/3/6/wr12/large/v2783490_20260306155210986M_1.jpg"
 };
 if(exact[c?.id])return exact[c.id];
 if(c?.referenceImage&&c.referenceImageIdentityExact===true)return c.referenceImage;
 /* Nunca usamos una coincidencia solo por nombre/número para vintage: puede devolver otra impresión con el mismo nº. */
 try{
  const x=typeof catalogImageFor==="function"?catalogImageFor(c):"";
  if(x&&c?.catalogId)return x;
 }catch{}
 return "";
}
function labelGrade(c){
 const g=String(c?.grading||"RAW").toUpperCase();
 return g==="RAW"?(c.condition||c.grade||"RAW"):(g+" "+(c.grade||""));
}
function render(){
 const box=Q("#cards");if(!box||typeof state==="undefined")return;
 const rows=(state.cards||[]).filter(c=>c&&!c.archivedSold);
 const title=Q("#collection .sectionHead h3");
 if(title)title.textContent="Mi colección · "+rows.reduce((n,c)=>n+qty(c),0)+" cartas";
 const total=rows.reduce((s,c)=>s+(Number(c.value)||0)*qty(c),0);
 const stats=Q("#collectionStats");
 if(stats)stats.innerHTML='<div><span>Cartas activas</span><b>'+rows.reduce((n,c)=>n+qty(c),0)+'</b></div><div><span>Valor registrado</span><b>'+EUR(total)+'</b></div>';
 if(!rows.length){
  box.innerHTML='<div class="emptyState"><b>No se ha podido cargar ninguna carta activa.</b><span>Los datos siguen guardados; recarga la página. Si persiste, Card Vault reparará el estado local sin borrar ventas.</span></div>';
  return;
 }
 rows.sort((a,b)=>(Number(b.value)||0)-(Number(a.value)||0)||String(a.name||"").localeCompare(String(b.name||"")));
 box.innerHTML=rows.map(c=>{
  const image=img(c),u=c.universe==="lorcana"?"Lorcana":"Pokémon",value=Number(c.value)||0,ref=c.valuationStatus==="reference";
  return '<article class="collectionPrimeCard" data-collection-card="'+E(c.id)+'">'+
   (image?'<img src="'+E(image)+'" alt="'+E(c.name)+'" loading="lazy">':'<div class="collectionPrimeNoImg">🃏<small>Buscando imagen automática</small></div>')+
   '<div class="collectionPrimeBody"><div class="collectionPrimeTop"><span>'+E(u)+'</span><span>'+E(labelGrade(c))+'</span></div>'+
   '<h3>'+E(c.name||"Carta")+'</h3><p>'+E([c.number,c.set,c.language].filter(Boolean).join(" · "))+'</p>'+
   '<div class="collectionPrimeValue"><b>'+EUR(value)+'</b><small>'+(ref?'Referencia de mercado; valor del ejemplar pendiente de ajuste':'Valor registrado')+'</small></div>'+
   (c.purchase!=null?'<small>Coste registrado '+EUR(c.purchase)+'</small>':'')+
   '<div class="collectionPrimeActions"><button type="button" data-edit-card="'+E(c.id)+'">Ver ficha</button><button type="button" data-cv-sell="'+E(c.id)+'">Marcar vendida</button></div>'+
   '</div></article>';
 }).join("");
 try{window.CVCatalogImages?.hydrate?.()}catch{}
}
document.addEventListener("click",e=>{
 const nav=e.target.closest('[data-tab="collection"],[data-simple-tab="collection"]');
 if(nav)setTimeout(render,25);
 const edit=e.target.closest("[data-edit-card]");if(edit){e.preventDefault();e.stopPropagation();try{window.editCard?.(edit.dataset.editCard)}catch{}}
});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&document.body.dataset.activeTab==="collection")setTimeout(render,20)});
setTimeout(render,300);setTimeout(render,1200);
window.CVRenderCollection=render;
window.CVCollectionSimple={render};
})();