(()=>{"use strict";
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>(Number(v)||0).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const Q=s=>document.querySelector(s);
const qty=c=>Math.max(1,Number(c?.quantity)||1);
function img(c){
 // Catálogos contrastados visualmente: nombre, número, edición e idioma.
 const local={
  "own-machamp-gx-154-bus-es":["Machamp GX","154/147","Sombras Ardientes","Español","machamp-gx-154-es.png"],
  "own-metang-094-cri-es":["Metang","094/086","Caos Creciente","Español","metang-094-es.png"],
  "own-toxtricity-089-m2-jp":["Toxtricity","089/080","Inferno X","Japonés","toxtricity-089-ja.jpg"]
 };
 const card=local[c?.id];
 if(card&&[c.name,c.number,c.set,c.language].every((v,i)=>v===card[i]))return "assets/cards/"+card[4];
 const exact={
  "own-hitmonlee-106-jp-fossil-psa5":"https://cdn.pooka.app/card/ja-mystery-of-the-fossils-39.png",
  "own-gyarados-ex-089-xy9-jp":"https://cdn.pooka.app/card/ja-xy9-89.png",
  "own-mewtwo-118-ec1-jp-1ed-holo":"https://cdn.pooka.app/card/ja-base-expansion-pack-118.png"
 };
 // Surfing Pikachu (promo JR 1997): sin imagen oficial verificada; nunca imágenes de eBay ni fotos personales.
 if(exact[c?.id])return exact[c.id];
 if(c?.referenceImage&&c.referenceImageIdentityExact===true&&!/ebay/i.test(c.referenceImage))return c.referenceImage;
 /* Las referencias de catálogo con ID exacto no dependen del radar cargado. */
 if(c?.catalogId&&c?.referenceImage){
  const match=String(c.catalogId).match(/^([a-z0-9]+)-(\d+)$/i);
  if(match){
   const expected="https://images.pokemontcg.io/"+match[1]+"/"+Number(match[2])+"_hires.png";
   if(c.referenceImage===expected)return expected;
  }
 }
 const graded={vap149:["Vaporeon ex #149/131","sv8pt5/149"],cha228:["Charizard ex #228/197","sv3/228"],cha074:["Charizard ex #074","svp/74"]};
 const ref=graded[c?.id];
 if(ref&&c.name===ref[0])return "https://images.pokemontcg.io/"+ref[1]+"_hires.png";
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
 const V=window.CVPrimeValuation;
 const FLAGS={"español":"🇪🇸","spanish":"🇪🇸","japonés":"🇯🇵","japanese":"🇯🇵","inglés":"🇬🇧","english":"🇬🇧","francés":"🇫🇷","alemán":"🇩🇪","italiano":"🇮🇹","coreano":"🇰🇷"};
 const flag=c=>{const l=String(c.language||"").toLowerCase();return l?(FLAGS[l]||"🏳️")+" "+c.language:(String(c.set||"").match(/·\s*20\d\d/)?"🇬🇧 Inglés (según set)":"🏳️ Idioma pendiente")};
 const val=c=>{if(c.valuationStatus==="reference")return null;try{const b=V?.bucket?.(c);if(b&&b.unit>0)return {unit:b.unit,prudent:["CONFIRMED","PROVISIONAL"].includes(b.bucket),label:V.LABEL?.[b.bucket]||b.bucket,reason:b.reason}}catch{}
  return Number(c.value)>0?{unit:Number(c.value),prudent:false,label:"Referencia",reason:"Sin evidencia de venta de este ejemplar"}:null};
 const basis=c=>{try{const b=V?.basisUnit?.(c);return b==null?null:b}catch{return c.purchase!=null?Number(c.purchase):null}};
 let prudent=0,refOnly=0,cost=0,costN=0;
 for(const c of rows){const v=val(c),q=qty(c),b=basis(c);if(v)(v.prudent?prudent+=v.unit*q:refOnly+=v.unit*q);else if(Number(c.value)>0)refOnly+=Number(c.value)*q;if(b!=null){cost+=b*q;costN++}}
 const pending=rows.filter(c=>!val(c)).length;
 const stats=Q("#collectionStats");
 if(stats)stats.innerHTML='<div><span>Cartas activas</span><b>'+rows.reduce((n,c)=>n+qty(c),0)+'</b></div><div><span>Valor prudente (igual que cabecera)</span><b>'+EUR(prudent)+'</b></div><div><span>Referencia sin evidencia</span><b>'+EUR(refOnly)+'</b></div><div><span>Coste conocido ('+costN+' cartas)</span><b>'+EUR(cost)+'</b></div>'+(pending?'<div><span>Sin valor todavía</span><b>'+pending+'</b></div>':'');
 if(!rows.length){
  box.innerHTML='<div class="emptyState"><b>No se ha podido cargar ninguna carta activa.</b><span>Los datos siguen guardados; recarga la página. Si persiste, Card Vault reparará el estado local sin borrar ventas.</span></div>';
  return;
 }
 rows.sort((a,b)=>(val(b)?.unit||0)-(val(a)?.unit||0)||String(a.name||"").localeCompare(String(b.name||"")));
 box.innerHTML=rows.map(c=>{
  const image=img(c),u=c.universe==="lorcana"?"Lorcana":"Pokémon",v=val(c),b=basis(c),q=qty(c),pl=v&&b!=null?(v.unit-b)*q:null;
  return '<article class="collectionPrimeCard" data-collection-card="'+E(c.id)+'">'+
   (image?'<img src="'+E(image)+'" alt="'+E(c.name)+'" loading="lazy" referrerpolicy="no-referrer">':'<div class="collectionPrimeNoImg">🃏<small>Imagen oficial no verificada</small></div>')+
   '<div class="collectionPrimeBody"><div class="collectionPrimeTop"><span>'+E(u)+'</span><span>'+E(labelGrade(c))+'</span>'+(q>1?'<span>×'+q+'</span>':'')+'</div>'+
   '<h3>'+E(c.name||"Carta")+'</h3><p>'+E([c.number?"nº "+c.number:"",c.set].filter(Boolean).join(" · "))+'</p><p>'+E(flag(c))+'</p>'+
   '<div class="collectionPrimeValue"><b>'+(v?EUR(v.unit):'VALOR PENDIENTE')+'</b><small>'+(v?E(v.label+" · "+v.reason):'Sin comparable fiable de la misma condición'+(Number(c.value)>0?' · referencia de otra condición '+EUR(c.value)+' (no aplicable)':''))+'</small></div>'+
   '<small>Coste '+(b!=null?EUR(b):'pendiente')+(pl!=null?' · <b class="'+(pl>=0?'plPos':'plNeg')+'">'+(pl>=0?'+':'')+EUR(pl)+'</b> '+(v&&v.prudent?'':'(sobre referencia)'):'')+'</small>'+
   '<div class="collectionPrimeActions"><button type="button" data-edit-card="'+E(c.id)+'">Editar</button><button type="button" data-cv-sell="'+E(c.id)+'">Vendido</button></div>'+
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