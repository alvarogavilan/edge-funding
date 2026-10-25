/* Card Vault V122 · Comprar graduadas (PSA, Beckett, CGC, SGC, Ace…) a buen precio.
   No hay una fuente gratuita y legítima de ventas de graduadas en Europa sin eBay, así que la app usa un ancla que sí es
   real: lo que te costaría CREAR esa graduada tú = carta sin graduar en Cardmarket (EX o mejor si se conoce) + tarifa de
   graduación + envíos. Una graduada alta (9–10) anunciada por debajo de ese «precio de reposición» es una oferta: nadie
   la fabrica más barato. Si conoces una venta real de esa graduada, la app calcula tu beneficio exacto. */
(()=>{"use strict";
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>Number.isFinite(v)?v.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—";
const SIGNED=v=>Number.isFinite(v)?(v>=0?"+":"−")+EUR(Math.abs(v)):"—";
const NUM=v=>{const t=String(v??"").trim().replace(/\s|€/g,"");if(!t)return NaN;const x=Number(t.includes(",")?t.replace(/\./g,"").replace(",","."):t);return Number.isFinite(x)&&x>=0?x:NaN};
const nq=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const readLS=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k)||"null");return x??d}catch{return d}};
const writeLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const KEY="cv_v122_graded";
/* Tarifa de graduación por empresa (lo más barato publicado para particulares en Europa; editable en cada análisis).
   PSA Europa Standard 49,99 € (lanzamiento oct. 2026). Para el resto se usa la misma cifra si no escribes otra. */
const GRADE_FEE=49.99,SHIP_TO=15,SHIP_BACK=25;
let pick=null,list=readLS(KEY,[]);if(!Array.isArray(list))list=[];

function search(q){
 const C=window.CVCompra;if(!C||!q||q.trim().length<3)return [];const k=nq(q).trim();
 const all=C.cardsPk().concat(C.cardsJp?C.cardsJp():[]);return all.filter(x=>nq(x.name+" "+x.set+" "+x.number).includes(k)).slice(0,8);
}
function analyse(a){
 const C=window.CVCompra,x=(C.cardsPk().concat(C.cardsJp())).find(y=>y.id===a.id);if(!x)return null;
 const p=x.p,raw=Number.isFinite(p.exPlus)?p.exPlus:C.saleRef_(p),rawKind=Number.isFinite(p.exPlus)?"«desde» EX o mejor":"venta de referencia sin graduar";
 const fee=Number.isFinite(a.fee)?a.fee:GRADE_FEE,repo=raw+fee+SHIP_TO+SHIP_BACK,cost=a.price+(a.ship||0);
 const cfg=C.cfg(),net=Number.isFinite(a.sale)?a.sale*(1-cfg.feePct/100)-cfg.sellShip:NaN,profit=net-cost;
 const vs=cost/repo,high=a.grade>=9;
 const verdict=!Number.isFinite(raw)?{k:"flat",t:"Sin precio de la carta sin graduar"}:
  cost<=raw&&high?{k:"go",t:"🟢 Muy por debajo: cuesta menos que la carta sin graduar"}:
  cost<repo&&high?{k:"go",t:"🟢 Oferta: más barata que graduarla tú"}:
  cost<repo?{k:"flat",t:"⚪ Por debajo de reposición, pero nota "+a.grade+" (las notas bajas valen poco más que sin graduar)"}:
  {k:"wait",t:"🟠 Más cara que graduarla tú"};
 return {x,raw,rawKind,fee,repo,cost,vs,net,profit,verdict};
}
function rowHtml(a,i){
 const r=analyse(a);if(!r)return '<li><span><b>'+E(a.name)+'</b></span><small>Sin precio en la guía todavía.</small></li>';
 return '<li><span><b>'+E(a.company)+' '+E(a.grade)+' · '+E(r.x.name)+'</b> · '+E(r.x.set)+' nº '+E(r.x.number)+'</span><button type="button" class="v4btn" data-gr-del="'+i+'">Quitar</button>'+
  '<small><span class="cpSig '+r.verdict.k+'">'+r.verdict.t+'</span> Anuncio '+EUR(r.cost)+' (con envío) · crearla tú: '+EUR(r.repo)+' = carta '+EUR(r.raw)+' ('+r.rawKind+') + graduación '+EUR(r.fee)+' + envíos '+EUR(SHIP_TO+SHIP_BACK)+' · '+Math.round(r.vs*100)+' % de su reposición'+
  (Number.isFinite(r.net)?' · si la vendes a '+EUR(a.sale)+': te quedan '+EUR(r.net)+' → <b>'+SIGNED(r.profit)+'</b>':' · añade una venta conocida de esta graduada para ver tu beneficio')+'.</small></li>';
}
function render(){
 const host=ensureHost();if(!host)return;const C=window.CVCompra;
 const ready=C&&C.state().guide;
 host.innerHTML='<section class="rdlivebox cpBox"><h3>Comprar graduadas a buen precio (PSA, Beckett, CGC, SGC…)</h3>'+
  '<p class="v4note">No hay datos públicos y gratuitos de ventas de graduadas en Europa sin eBay. La app compara cada anuncio que veas (Cardmarket, Catawiki, Wallapop, Vinted, tiendas) con lo que te costaría <b>crear esa graduada tú</b>: la carta sin graduar en Cardmarket + graduación + envíos. Por debajo de eso, nadie la fabrica más barata.</p>'+
  (ready?'<div class="cpPlanIn"><label class="wide">Carta<input type="search" data-gr-q placeholder="Nombre, colección o número (mín. 3 letras)" value="'+E(pick?pick.name+" · "+pick.set+" nº "+pick.number:"")+'"></label></div><div data-gr-res></div>'+
   '<div class="cpPlanIn"><label>Empresa<select data-gr="company">'+["PSA","Beckett (BGS)","CGC","SGC","Ace","Otra"].map(c=>'<option>'+c+'</option>').join("")+'</select></label><label>Nota<input inputmode="decimal" data-gr="grade" placeholder="10"></label>'+
   '<label>Precio del anuncio €<input inputmode="decimal" data-gr="price" placeholder="120"></label><label>Envío €<input inputmode="decimal" data-gr="ship" placeholder="8"></label>'+
   '<label>Venta conocida de esa graduada € (opcional)<input inputmode="decimal" data-gr="sale" placeholder="vacío = no la sé"></label><label>Tarifa de graduación €<input inputmode="decimal" data-gr="fee" placeholder="'+String(GRADE_FEE).replace(".",",")+'"></label></div>'+
   '<button type="button" class="v4btn primary" data-gr-add>Analizar anuncio</button>':'<p class="v4note">⏳ Cargando la guía de Cardmarket… (abre Compra YA una vez si no aparece)</p>')+
  (list.length?'<h4>Anuncios analizados</h4><ol class="cpPlanList">'+list.map(rowHtml).join("")+'</ol>':'')+'</section>';
}
function ensureHost(){
 const sec=document.getElementById("pregrade");if(!sec)return null;let h=document.getElementById("cpGraded");
 if(!h){h=document.createElement("div");h.id="cpGraded";h.className="v4board";sec.prepend(h)}return h;
}
document.addEventListener("input",e=>{const t=e.target.closest("[data-gr-q]");if(!t)return;pick=null;const r=search(t.value),box=document.querySelector("[data-gr-res]");if(!box)return;
 box.innerHTML=r.length?'<ul class="cpPlanList">'+r.map(x=>'<li><span>'+E(x.name)+' · '+E(x.set)+' nº '+E(x.number)+'</span><button type="button" class="v4btn" data-gr-pick="'+E(x.id)+'">Elegir</button></li>').join("")+'</ul>':(t.value.trim().length>=3?'<p class="v4note">Ninguna carta coincide.</p>':'')});
document.addEventListener("click",e=>{
 const p=e.target.closest("[data-gr-pick]");if(p){const C=window.CVCompra;pick=C.cardsPk().concat(C.cardsJp()).find(x=>x.id===p.dataset.grPick)||null;const q=document.querySelector("[data-gr-q]");if(q&&pick)q.value=pick.name+" · "+pick.set+" nº "+pick.number;const box=document.querySelector("[data-gr-res]");if(box)box.innerHTML="";return}
 const d=e.target.closest("[data-gr-del]");if(d){list.splice(+d.dataset.grDel,1);writeLS(KEY,list);render();return}
 if(e.target.closest("[data-gr-add]")){
  const g=k=>document.querySelector('[data-gr="'+k+'"]')?.value,price=NUM(g("price")),grade=NUM(g("grade")),ship=NUM(g("ship")),sale=NUM(g("sale")),fee=NUM(g("fee"));
  if(!pick){alert("Elige la carta de la lista.");return}
  if(!Number.isFinite(price)||price<=0){alert("Escribe el precio del anuncio.");return}
  if(!Number.isFinite(grade)||grade<1||grade>10){alert("La nota va de 1 a 10.");return}
  list.unshift({id:pick.id,name:pick.name,company:g("company")||"PSA",grade,price,ship:Number.isFinite(ship)?ship:0,sale:Number.isFinite(sale)&&sale>0?sale:undefined,fee:Number.isFinite(fee)?fee:undefined,at:new Date().toISOString()});
  if(!writeLS(KEY,list.slice(0,50))){alert("NO se ha guardado: el almacenamiento del navegador no lo permite.");return}
  pick=null;render()}
});
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="pregrade"]'))setTimeout(async()=>{render();const C=window.CVCompra;if(C){try{await C.ready_();await C.loadCatalog();if(!C.state().guide)await C.loadGuide(false)}catch{}render()}},60)});
if(location.hash==="#pregrade")setTimeout(async()=>{const C=window.CVCompra;if(C){try{await C.ready_();await C.loadCatalog()}catch{}}render()},1400);
window.CVGraduadas={render,analyse};
})();
