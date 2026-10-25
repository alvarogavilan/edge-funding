/* Card Vault V122 · Sellado: comprar producto sellado de Pokémon (sobres, cajas, ETB, colecciones…) en Cardmarket para
   revender o para invertir. Datos: guía oficial diaria de Cardmarket (vía CVCompra). En sellado la guía solo trae «desde»
   y tendencia (sin medias de venta), y muchas tendencias quedan congeladas cuando no hay ventas: por eso solo se usan
   productos cuya tendencia se ha movido (se están vendiendo) y con un «desde» entre el 50 % y el 90 % de su tendencia
   (por debajo suele ser otro idioma, caja vacía o abierta). Nada se compra solo. */
(()=>{"use strict";
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>Number.isFinite(v)?v.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—";
const SIGNED=v=>Number.isFinite(v)?(v>=0?"+":"−")+EUR(Math.abs(v)):"—";
const PCT=v=>Number.isFinite(v)?(v>=0?"+":"−")+Math.abs(Math.round(v*100))+" %":"—";
const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:NaN};
const NUM=v=>{const t=String(v??"").trim().replace(/\s|€/g,"");if(!t)return NaN;const x=Number(t.includes(",")?t.replace(/\./g,"").replace(",","."):t);return Number.isFinite(x)&&x>=0?x:NaN};
const readLS=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k)||"null");return x&&typeof x==="object"?x:d}catch{return d}};
const writeLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const KEY="cv_v122_sealed";let sv={cat:"all",show:"arb",max:600,ship:10,...readLS(KEY,{})};
let busy="";

function rows(C){
 const S=window.CV_SEALED_MAP,st=C.state(),cfg=C.cfg();if(!S||!st.guide)return [];
 const prev=st.prev?.rows||{},old=st.old?.rows||{},out=[];
 for(const [pid,name,cat,exp] of S.items){
  const g=C.G(pid);if(!g||!Number.isFinite(g.trend)||!Number.isFinite(g.low))continue;
  const t1=N(prev[pid]?.[1]),t14=N(old[pid]?.[1]);
  const moving=(Number.isFinite(t1)&&t1!==g.trend)||(Number.isFinite(t14)&&t14!==g.trend);
  const ratio=g.low/g.trend,cost=g.low+sv.ship,net=g.trend*(1-cfg.feePct/100)-sv.ship,profit=net-cost;
  const ch14=Number.isFinite(t14)?g.trend/t14-1:NaN;
  out.push({pid,name,cat,type:S.cats[cat]||"",exp,low:g.low,trend:g.trend,t14,ch14,moving,ratio,cost,net,profit,
   arb:moving&&ratio>=.5&&ratio<=.9&&profit>=cfg.minProfit&&g.low<=sv.max,
   inv:moving&&Number.isFinite(ch14)&&ch14>=.1&&g.trend>=30&&g.low<=sv.max&&ratio>=.5&&ratio<=1.1,/* ≥ 30 € y «desde» cerca de la tendencia: lo barato y lo de «desde» disparado es ruido */
   odd:ratio<.5});
 }
 return out;
}
function itemHtml(x,kind){
 const url="https://www.cardmarket.com/es/Pokemon/Products?idProduct="+encodeURIComponent(x.pid);
 return '<li><span><b>'+E(x.name)+'</b> · '+E(x.type)+'</span><a class="v4btn primary" href="'+E(url)+'" target="_blank" rel="noopener noreferrer">Ver en Cardmarket ↗</a>'+
  '<small>«Desde» <b>'+EUR(x.low)+'</b> ('+Math.round(x.ratio*100)+' % de su tendencia '+EUR(x.trend)+')'+
  (kind==="arb"?' · compra con envío '+EUR(x.cost)+' → te queda '+EUR(x.net)+' al venderlo a su tendencia → <b>'+SIGNED(x.profit)+'</b>':'')+
  (Number.isFinite(x.ch14)?' · tendencia '+PCT(x.ch14)+' en 2 semanas ('+EUR(x.t14)+' → '+EUR(x.trend)+')':'')+
  '. Comprueba idioma (el coreano y el chino suelen ser más baratos), precinto y estado de la caja.</small></li>';
}
async function render(){
 const host=ensureHost();if(!host)return;const C=window.CVCompra;
 if(!C){host.innerHTML='<p class="v4empty">Cargando…</p>';return}
 if(!C.state().guide||!window.CV_SEALED_MAP||C.state().guide.v<4){host.innerHTML=box('<p class="v4note">⏳ Cargando la guía oficial de Cardmarket y el catálogo de sellado…</p>');
  try{await C.ready_();await C.loadCatalog();await C.loadGuide(false)}catch{}}
 paint();
 if(!busy&&(!C.state().old||C.state().old.of!==C.state().guide?.sourceCreatedAt||!C.state().prev||C.state().prev.of!==C.state().guide?.sourceCreatedAt)){busy="Comparando con días anteriores…";paint();try{await C.loadPrev();await C.loadOld()}catch{}busy="";paint()}
}
function box(inner){return '<section class="rdlivebox cpBox"><h3>Sellado · comprar para revender o invertir</h3>'+inner+'</section>'}
function paint(){
 const host=ensureHost(),C=window.CVCompra;if(!host||!C)return;const cfg=C.cfg(),all=rows(C),st=C.state();
 if(!all.length){host.innerHTML=box('<p class="v4note">'+(st.guide?'Sin productos sellados con precio en la guía.':'⏳ Cargando…')+'</p>');return}
 const f=x=>sv.cat==="all"||String(x.cat)===sv.cat;
 const arb=all.filter(x=>x.arb&&f(x)).sort((a,b)=>b.profit-a.profit),inv=all.filter(x=>x.inv&&f(x)).sort((a,b)=>b.ch14-a.ch14),live=all.filter(x=>x.moving).length;
 const list=sv.show==="inv"?inv:arb;
 const cats=Object.entries(window.CV_SEALED_MAP.cats);
 host.innerHTML=box(
  '<div class="cpSum"><div><b>'+all.length.toLocaleString("es-ES")+'</b><span>productos sellados con precio de Cardmarket</span></div><div><b>'+live.toLocaleString("es-ES")+'</b><span>con ventas recientes (su tendencia se mueve)</span></div><div><b>'+arb.length+'</b><span>para revender con beneficio ≥ '+EUR(cfg.minProfit)+'</span></div><div><b>'+inv.length+'</b><span>subiendo ≥ 10 % en 2 semanas</span></div></div>'+
  (busy?'<p class="v4note">⏳ '+E(busy)+'</p>':'')+
  '<div class="rdctl"><label>Ver<select data-sl="show"><option value="arb"'+(sv.show!=="inv"?" selected":"")+'>Comprar y revender (arbitraje)</option><option value="inv"'+(sv.show==="inv"?" selected":"")+'>Para invertir (sube y se vende)</option></select></label>'+
  '<label>Tipo<select data-sl="cat"><option value="all">Todos</option>'+cats.map(([k,n])=>'<option value="'+k+'"'+(sv.cat===k?" selected":"")+'>'+E(n)+'</option>').join("")+'</select></label>'+
  '<label>Compra máxima (€)<input inputmode="decimal" data-sl="max" value="'+E(String(sv.max).replace(".",","))+'"></label><label>Envío de un sellado (€)<input inputmode="decimal" data-sl="ship" value="'+E(String(sv.ship).replace(".",","))+'"></label></div>'+
  (list.length?'<ol class="cpPlanList">'+list.slice(0,40).map(x=>itemHtml(x,sv.show)).join("")+'</ol>':'<p class="v4empty">'+(sv.show==="inv"?(st.old?.days?'Ningún producto con ventas sube ≥ 10 % en 2 semanas con estos filtros.':'Aún no hay foto de hace 2 semanas para comparar.'):'Ningún producto cumple hoy estos filtros.')+'</p>')+
  '<p class="v4note">'+(sv.show==="inv"?'«Para invertir» es una suposición, no una garantía: un sellado que sube y se sigue vendiendo suele seguir subiendo hasta que se reimprime. Compara con la foto del '+E(st.old?.date?new Date(st.old.date).toLocaleDateString("es-ES"):"—")+'.':'Arbitraje: comprar al «desde» y revender a su tendencia en Cardmarket (comisión '+E(String(cfg.feePct).replace(".",","))+' % y envío del sellado en cada sentido). Solo productos con ventas recientes y «desde» entre el 50 % y el 90 % de su tendencia: por debajo suele ser otro idioma o caja abierta.')+' En sellado Cardmarket no publica medias de venta, solo tendencia.</p>');
}
function ensureHost(){
 const sec=document.getElementById("sealed");if(!sec)return null;let h=document.getElementById("cpSealed");
 if(!h){h=document.createElement("div");h.id="cpSealed";h.className="v4board";sec.prepend(h);const t=document.createElement("h3");t.className="cpMine";t.textContent="Mi sellado";h.after(t)}
 return h;
}
document.addEventListener("change",e=>{const t=e.target.closest("[data-sl]");if(!t)return;const k=t.dataset.sl;
 if(k==="max"||k==="ship"){const v=NUM(t.value);if(!Number.isFinite(v)){alert("Escribe un importe en euros, por ejemplo 600 o 9,50.");return}sv[k]=v}else sv[k]=t.value;
 writeLS(KEY,sv);setTimeout(paint,0)});
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="sealed"]'))setTimeout(render,40)});
if(location.hash==="#sealed")setTimeout(render,1300);
window.CVSellado={render,rows:()=>rows(window.CVCompra)};
})();
