/* Card Vault V120 · Vender YA: qué cartas de Mi colección conviene vender hoy en Cardmarket y a qué precio.
   Datos: guía oficial diaria de Cardmarket (vía CVCompra). Señal de venta: precio de la última semana frente a su media de
   30 días, con ventas suficientes. Nada se vende solo: la app solo calcula y enlaza a la ficha del producto. */
(()=>{"use strict";
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=v=>Number.isFinite(v)?v.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—";
const SIGNED=v=>Number.isFinite(v)?(v>=0?"+":"−")+EUR(Math.abs(v)):"—";
const PCT=v=>Number.isFinite(v)?(v>=0?"+":"−")+Math.abs(Math.round(v*100))+" %":"—";
const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:NaN};
const readLS=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k)||"null");return x&&typeof x==="object"?x:d}catch{return d}};
const writeLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
let sv={show:"all",...readLS("cv_v120_sellview",{})};
/* Dónde vender: misma carta en cada sitio, con su comisión. Envío/embalaje que pones tú: el mismo en todos (Supuestos).
   Comisiones: CardTrader 5 % directa y 7 % Zero (página oficial); Vinted 0 % para el vendedor (la protección la paga el
   comprador); Cardmarket 5 % (fuentes secundarias); Wallapop y Catawiki sin confirmar: editables. */
let pf={wallapop:0,catawiki:12.5,...readLS("cv_v125_fees",{})};const ctP={};const wOpen=new Set();
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.dataset&&d.dataset.where){if(d.open)wOpen.add(d.dataset.where);else wOpen.delete(d.dataset.where)}},true);
const LCT={"inglés":"en","ingles":"en",english:"en",en:"en","español":"es",espanol:"es",es:"es",italiano:"it",it:"it","francés":"fr",frances:"fr",fr:"fr","alemán":"de",aleman:"de",de:"de","portugués":"pt",portugues:"pt",pt:"pt","japonés":"jp",japones:"jp",ja:"jp",jp:"jp"};
function platforms(a,C){
 const cfg=C.cfg(),ct=ctP[a.c.id],ctPrice=ct&&ct.price,ctUrl=ct&&ct.bp?"https://www.cardtrader.com/cards/"+encodeURIComponent(ct.bp):"https://www.cardtrader.com/";
 const L=[["Cardmarket",cfg.feePct,a.list,"precio sugerido (guía oficial)","comisión "+String(cfg.feePct).replace(".",",")+" %",a.url],
  ["CardTrader · venta directa",5,ctPrice||a.list,ctPrice?"igualas al más barato de tu idioma en CardTrader ahora":"referencia de Cardmarket (pulsa «Precio en CardTrader»)","comisión oficial 5 %",ctUrl],
  ["CardTrader Zero",7,ctPrice||a.list,ctPrice?"igualas al más barato de tu idioma en CardTrader ahora":"referencia de Cardmarket","comisión oficial 7 %",ctUrl],
  ["Vinted",0,a.list,"si consigues el mismo precio","el vendedor no paga comisión","https://www.vinted.es/"],
  ["Wallapop",pf.wallapop,a.list,"si consigues el mismo precio","comisión sin confirmar: "+String(pf.wallapop).replace(".",",")+" % (edítala)","https://es.wallapop.com/"],
  ["Catawiki (subasta)",pf.catawiki,a.list,"si la subasta llega a ese precio","comisión sin confirmar: "+String(pf.catawiki).replace(".",",")+" % (edítala)","https://www.catawiki.com/es/"]];
 const rows=L.map(([n,fee,price,how,feeTxt,url])=>({n,fee,price,how,feeTxt,url,net:Number.isFinite(price)?price*(1-fee/100)-cfg.sellShip:NaN}));
 const best=rows.reduce((m,r)=>r.net>(m?.net??-1e9)?r:m,null);return {rows,best};
}
function platHtml(a,C){
 const {rows,best}=platforms(a,C),ct=ctP[a.c.id];
 return '<details class="v4more cpWhere" data-where="'+E(a.c.id)+'"'+(wOpen.has(a.c.id)?' open':'')+'><summary><b>Dónde vender</b> · mejor: '+E(best?.n||"—")+' → te quedan '+EUR(best?.net)+'</summary><table class="cpLTtab"><thead><tr><th scope="col">Sitio</th><th scope="col">Precio</th><th scope="col">Te queda</th><th scope="col">Cómo</th></tr></thead><tbody>'+
  rows.map(r=>'<tr'+(r===best?' class="best"':'')+'><th scope="row"><a href="'+E(r.url)+'" target="_blank" rel="noopener noreferrer">'+E(r.n)+' ↗</a></th><td>'+EUR(r.price)+'</td><td class="'+(r===best?'pos':'')+'">'+EUR(r.net)+'</td><td><small>'+E(r.feeTxt)+' · '+E(r.how)+'</small></td></tr>').join("")+
  '</tbody></table>'+(ct&&ct.error?'<p class="v4note neg">'+E(ct.error)+'</p>':'')+(ct&&ct.loading?'<p class="v4note">Consultando CardTrader…</p>':'')+'<button type="button" class="v4btn" data-sell-ct="'+E(a.c.id)+'">Precio en CardTrader ahora</button><p class="v4note">Envío y embalaje que pones tú: '+EUR(C.cfg().sellShip)+' en todos los sitios (cámbialo en Supuestos). En Vinted y Wallapop el comprador paga su envío.</p></details>';
}
async function loadCt(id){
 const C=window.CVCompra,st=window.CVStateBridge?.get?.(),c=(st?.cards||[]).find(x=>x.id===id);if(!C||!c)return;const m=C.matchOwned(c);if(!m?.card)return;
 if(!C.ctToken()){ctP[id]={error:"Sin token de CardTrader: pégalo en Compra YA → Estado de las fuentes."};render();return}
 ctP[id]={loading:true};render();
 try{const {bp}=await C.ctBlueprint(m.card),j=await C.ctGet("/marketplace/products?blueprint_id="+encodeURIComponent(bp.id)),list=Array.isArray(j)?j:(j?.[bp.id]||Object.values(j||{}).flat());
  const lang=LCT[String(c.language||"").toLowerCase().trim()]||"en",rows=C.ctSummary(list),r=rows.find(x=>x.lang===lang||(lang==="jp"&&x.lang==="ja"));
  ctP[id]={bp:bp.id,price:r?.cheapestGood?.eur||r?.cheapest?.eur||NaN,lang};if(!r)ctP[id].error="CardTrader: sin anuncios en tu idioma ahora."}
 catch(e){ctP[id]={error:String(e.message||e)}}
 render();
}

/* Señal: go = la semana (o el día) se vende claramente por encima de su media de 30 días y hay ventas;
   wait = claramente por debajo; flat = estable o sin datos suficientes. */
function signal(p,liq){
 const r7=N(p.avg7)/N(p.avg30),r1=N(p.avg1)/N(p.avg30);
 if((r7>=1.15||r1>=1.2)&&liq>=2)return {k:"go",t:"🟢 Buen momento para vender",why:"La última semana se vende "+PCT((Number.isFinite(r7)&&r7>=1.15?r7:r1)-1)+" por encima de su media de 30 días."};
 if(Number.isFinite(r7)&&r7<=.85)return {k:"wait",t:"🟠 Mejor esperar",why:"Se vende "+PCT(r7-1)+" por debajo de su media de 30 días: si no necesitas liquidez, espera a que se recupere."};
 return {k:"flat",t:"⚪ Precio estable",why:Number.isFinite(r7)?"Semana y mes parecidos ("+PCT(r7-1)+").":"Sin ventas suficientes para comparar semana y mes."};
}
function analyse(c,C){
 const unit=Number.isFinite(+c.purchase)&&+c.purchase>0?+c.purchase:NaN,qty=Math.max(1,+c.quantity||1);
 const graded=c.grading?!/^raw$/i.test(String(c.grading)):!!(c.cert&&c.grade);/* sin «grading» pero con certificado y nota = graduada */
 const m=C.matchOwned(c);if(!m||!m.card)return {c,qty,unit,graded,miss:m?.ambiguous?"Hay "+m.ambiguous+" cartas con ese nombre y número: añade la colección o el id de catálogo en la ficha.":"No la encuentro en el catálogo con precio (revisa nombre y número)."};
 const x=m.card,p=x.p,cfg=C.cfg(),S=C.saleRef_(p),liq=x.liq?.k??0,sig=signal(p,liq);
 const list=sig.k==="go"?Math.max(N(p.trend)||0,N(p.avg7)||0)||S:N(p.trend)||S;
 const net=C.netSale(list,cfg),netRef=C.netSale(S,cfg);
 const floor=Number.isFinite(unit)?(unit+cfg.sellShip)/(1-cfg.feePct/100):NaN;
 return {c,x,how:m.how,qty,unit,graded,sig,S,list,net,netRef,floor,res:Number.isFinite(unit)?net-unit:NaN,url:C.links(x).cm,liq:x.liq?.t||""};
}
function rowHtml(a){
 const c=a.c;
 if(a.graded)return '<article class="cpSell"><h4>'+E(c.name)+' <small>'+E(c.grading||"PSA")+' '+E(c.grade||"")+'</small></h4><p class="v4note">Carta graduada: la guía de Cardmarket es de cartas sin graduar y no sirve para valorarla. Usa la pestaña «Cartas graduadas».</p>'+(a.url?'<a class="v4btn" href="'+E(a.url)+'" target="_blank" rel="noopener noreferrer">Ver en Cardmarket ↗</a>':'')+'</article>';
 if(a.miss)return '<article class="cpSell"><h4>'+E(c.name)+' <small>'+E(c.set||"")+' nº '+E(c.number||"—")+'</small></h4><p class="v4note">'+E(a.miss)+'</p></article>';
 return '<article class="cpSell" data-sell="'+E(c.id)+'"><h4>'+E(c.name)+' <small>'+E(a.x.set)+' nº '+E(a.x.number)+(a.qty>1?' · ×'+a.qty:'')+'</small></h4>'+
  '<p><span class="cpSig '+a.sig.k+'">'+a.sig.t+'</span> <small>'+E(a.sig.why)+' '+E(a.liq)+'.</small></p>'+
  '<div class="cpTot"><div><b>'+EUR(a.list)+'</b><span>precio de anuncio sugerido</span></div><div><b>'+EUR(a.net)+'</b><span>te queda tras comisión y envío</span></div><div><b>'+(Number.isFinite(a.unit)?EUR(a.unit):"—")+'</b><span>lo que pagaste (por unidad)</span></div><div class="'+(a.res>=0?'pos':'neg')+'"><b>'+SIGNED(a.res)+'</b><span>resultado por unidad</span></div></div>'+
  (Number.isFinite(a.floor)?'<p class="v4note">No la anuncies por debajo de <b>'+EUR(a.floor)+'</b>: perderías dinero.</p>':'<p class="v4note">Añade lo que pagaste en Mi colección para ver tu resultado y el precio mínimo.</p>')+
  '<p class="v4note">Referencia de venta en Cardmarket '+EUR(a.S)+' ('+(a.x.kind==="jp"?"producto japonés":"todos los idiomas y estados")+') · emparejada por '+E(a.how)+'.</p>'+
  platHtml(a,window.CVCompra)+
  '<div class="v4actions"><a class="v4btn primary" href="'+E(a.url)+'" target="_blank" rel="noopener noreferrer">Vender en Cardmarket ↗</a></div></article>';
}
async function render(){
 const host=document.getElementById("cpSell");if(!host)return;const C=window.CVCompra;
 if(!C){host.innerHTML='<p class="v4empty">Cargando…</p>';return}
 const st=window.CVStateBridge?.get?.(),own=(st?.cards||[]).filter(c=>!c.archivedSold&&(c.universe||"pokemon")==="pokemon");
 if(!own.length){host.innerHTML='<section class="rdlivebox cpBox"><h3>Vender YA</h3><p class="v4empty">Tu colección no tiene cartas Pokémon todavía.</p></section>';return}
 host.innerHTML='<section class="rdlivebox cpBox"><h3>Vender YA</h3><p class="v4note">⏳ Cargando la guía oficial de Cardmarket…</p></section>';
 try{await C.ready_();await C.loadCatalog();await C.loadGuide(false)}catch{}
 const A=own.map(c=>analyse(c,C)),ok=A.filter(a=>a.x&&!a.graded);
 const order={go:0,flat:1,wait:2},shown=(sv.show==="go"?ok.filter(a=>a.sig.k==="go"):A).slice().sort((a,b)=>(a.x&&!a.graded?0:1)-(b.x&&!b.graded?0:1)||(order[a.sig?.k]??3)-(order[b.sig?.k]??3)||(b.net||0)-(a.net||0));
 const tot=ok.reduce((s,a)=>s+a.net*a.qty,0),go=ok.filter(a=>a.sig.k==="go").length,paid=ok.filter(a=>Number.isFinite(a.unit)).reduce((s,a)=>s+a.unit*a.qty,0),netPaid=ok.filter(a=>Number.isFinite(a.unit)).reduce((s,a)=>s+a.net*a.qty,0);
 host.innerHTML='<section class="rdlivebox cpBox"><h3>Vender YA · tu colección en Cardmarket hoy</h3>'+
  '<div class="cpSum"><div><b>'+EUR(tot)+'</b><span>te quedaría si vendes hoy las '+ok.length+' cartas con precio (neto)</span></div><div><b>'+go+'</b><span>🟢 en buen momento de venta</span></div><div><b>'+(paid?SIGNED(netPaid-paid):"—")+'</b><span>resultado frente a lo que pagaste (las que tienen precio de compra)</span></div></div>'+
  '<div class="rdctl"><label>Mostrar<select data-sell-view="show"><option value="all"'+(sv.show!=="go"?" selected":"")+'>Todas</option><option value="go"'+(sv.show==="go"?" selected":"")+'>Solo buen momento de venta</option></select></label><label>Comisión Wallapop %<input inputmode="decimal" data-sell-fee="wallapop" value="'+E(String(pf.wallapop).replace(".",","))+'"></label><label>Comisión Catawiki %<input inputmode="decimal" data-sell-fee="catawiki" value="'+E(String(pf.catawiki).replace(".",","))+'"></label></div>'+
  '<p class="v4note">Precio sugerido: tendencia de Cardmarket (o la media de la semana si está por encima, en buen momento). Neto = tras la comisión de '+E(String(C.cfg().feePct).replace(".",","))+' % y '+EUR(C.cfg().sellShip)+' de envío. Las cifras de Cardmarket mezclan idiomas y estados salvo en las japonesas.</p>'+
  (shown.length?shown.map(rowHtml).join(""):'<p class="v4empty">Ninguna carta en buen momento de venta hoy.</p>')+'</section>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-sell-ct]");if(b)loadCt(b.dataset.sellCt)});
document.addEventListener("change",e=>{const f=e.target.closest("[data-sell-fee]");if(f){const v=Number(String(f.value).replace(",","."));if(!(v>=0&&v<100)){alert("La comisión va de 0 a 99 %.");return}pf[f.dataset.sellFee]=v;writeLS("cv_v125_fees",pf);setTimeout(render,0);return}});/* fuera del evento: repintar dentro de «change» (que salta al perder el foco) rompe el DOM */
document.addEventListener("change",e=>{const t=e.target.closest("[data-sell-view]");if(!t)return;sv[t.dataset.sellView]=t.value;writeLS("cv_v120_sellview",sv);setTimeout(render,0)});
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="vender"]'))setTimeout(render,40)});
if(location.hash==="#vender")setTimeout(render,1300);
window.CVVender={render,signal,platforms};
})();
