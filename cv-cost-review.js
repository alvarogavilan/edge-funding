/* Card Vault V110 · revisión de costes de adquisición y guardado protegido.
   - Al arrancar aplica CVMoney.repairState (idempotente) y lo guarda.
   - «Revisar coste de adquisición»: desde Mi colección (carta), historial y archivo (venta). Un único motor: CVMoney.
   - CVGuard: guardado protegido común. Si el guardado falla, deshace el cambio en memoria y lo explica. */
(()=>{"use strict";
const M=()=>window.CVMoney,B=()=>window.CVStateBridge,st=()=>B()?.get?.();
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const EUR=c=>M()?M().fmt(c):String(c);
/* ---------- guardado protegido común ---------- */
function guard(bk,label){
 if(B()?.save?.()!==false)return true;
 if(bk)B().restore(bk);
 const why=window.CVLastSaveError==="otra-pestana"?"otra pestaña o ventana tiene datos más recientes; recarga esta pestaña":"el almacenamiento del navegador está lleno o bloqueado";
 alert("NO se ha guardado «"+label+"»: "+why+". No se ha registrado ningún cambio; tus datos siguen como antes. Puedes volver a intentarlo sin riesgo de duplicar.");
 try{window.CVRenderCollection?.()}catch{}
 return false;
}
window.CVGuard=guard;
window.CVSnapshot=()=>B()?.snapshot?.();

/* ---------- reparación V110 al arrancar ---------- */
function boot(){
 const s=st();if(!s||!M())return;
 const r=M().repairState(s);
 if(r.changed){s.costMigrations=Array.isArray(s.costMigrations)?s.costMigrations:[];if(!s.costMigrations.some(x=>x.id===M().REPAIR))s.costMigrations.push({id:M().REPAIR,at:new Date().toISOString(),note:"IVA, aranceles y gestión de compras antiguas: de «no aplica» inferido a desconocido / revisar"});B().save()}
}

/* ---------- hoja de revisión ---------- */
const STATUS=[["pagado","Pagado"],["estimado","Estimado"],["desconocido","Desconocido"],["incluido","Incluido en otro importe"],["no-aplica","No aplicable"]];
const INCL=[["","—"],["precio","en el precio"],["envío","en el envío"],["otro","en otro importe"]];
function sheet(html){let s=document.getElementById("cvCostSheet");if(!s){s=document.createElement("div");s.id="cvCostSheet";s.className="v4sheet";s.setAttribute("role","dialog");s.setAttribute("aria-modal","true");s.setAttribute("aria-label","Revisar coste de adquisición");document.body.appendChild(s)}
 s.innerHTML='<div class="v4sheetIn">'+html+'</div>';s.hidden=false;document.documentElement.classList.add("v4lock");setTimeout(()=>s.querySelector("input,select")?.focus?.({preventScroll:true}),50)}
function close(){const s=document.getElementById("cvCostSheet");if(s){s.hidden=true;s.innerHTML=""}document.documentElement.classList.remove("v4lock")}
function rowFor(k,x){
 const amount=x&&x.cents!=null&&x.status!=="no-aplica"&&x.status!=="incluido"?(x.cents/100).toFixed(2).replace(".",","):"";
 return '<fieldset class="cvCostRow"><legend>'+E(M().LABEL[k])+(x&&x.origin==="inferido-v109"?' · <span class="cvWarn">V109 lo había supuesto sin datos</span>':'')+'</legend>'+
  '<label>Importe €<input name="amt-'+k+'" inputmode="decimal" value="'+E(amount)+'" placeholder="vacío = desconocido"></label>'+
  '<label>Estado<select name="st-'+k+'">'+STATUS.map(([v,t])=>'<option value="'+v+'"'+((x?x.status:"desconocido")===v?" selected":"")+'>'+t+'</option>').join("")+'</select></label>'+
  '<label>Si está incluido, ¿dónde?<select name="in-'+k+'">'+INCL.map(([v,t])=>'<option value="'+v+'"'+((x&&x.in)===v?" selected":"")+'>'+t+'</option>').join("")+'</select></label></fieldset>';
}
function readForm(f){
 const ex={},errs=[];
 for(const k of M().EXTRAS){
  const status=f.elements["st-"+k].value,raw=f.elements["amt-"+k].value.trim(),inc=f.elements["in-"+k].value;
  if(status==="desconocido"){ex[k]={status:"desconocido"};continue}
  if(status==="no-aplica"){ex[k]={status:"no-aplica"};continue}
  if(status==="incluido"){if(!inc)errs.push(M().LABEL[k]+": indica en qué importe está incluido");ex[k]={status:"incluido",in:inc};continue}
  const c=M().cents(raw);if(!Number.isFinite(c)||c<0){errs.push(M().LABEL[k]+": importe no válido");continue}
  ex[k]={cents:c,status};
 }
 return {ex,errs,date:f.elements.date.value,ref:f.elements.ref.value.trim(),origin:f.elements.origin.value.trim()};
}
function originals(o){return '<dl class="v4facts">'+o.map(([k,v])=>'<div><dt>'+E(k)+'</dt><dd>'+E(v==null||v===""?"—":v)+'</dd></div>').join("")+'</dl>'}
function openCard(id){
 const s=st(),c=(s?.cards||[]).find(x=>x.id===id);if(!c)return;
 const lot=M().migrateCard(c);if(!lot){alert("Esta carta no tiene precio de compra registrado: añádelo con «Editar» antes de revisar sus gastos.");return}
 const sold=lot.unitsSold||0,left=lot.qtyOriginal-sold;
 sheet('<h3>Revisar coste de adquisición</h3><p class="v4id">'+E(c.name)+' · '+E([c.set,c.number].filter(Boolean).join(" · "))+'</p>'+
  originals([["Precio de compra registrado",c.purchase!=null?EUR(M().cents(Number(c.purchase))):null],["Envío registrado",c.purchaseShipping!=null?EUR(M().cents(Number(c.purchaseShipping))):"no registrado"],["Comisiones registradas",c.purchaseFees!=null?EUR(M().cents(Number(c.purchaseFees))):"no registradas"],["Coste aterrizado anterior",c.landedCostUnit!=null?EUR(M().cents(Number(c.landedCostUnit)))+"/ud":null],["País del vendedor",c.buyCountry||null],["Fecha de compra",c.purchaseDate||null],["Unidades",lot.qtyOriginal+" originales · "+sold+" vendidas · "+left+" restantes"]])+
  '<p class="v4note">Subtotal conocido: <b>'+EUR(lot.knownCents)+'</b> · estado: <b>'+E(M().STATUS_TXT[lot.status]||lot.status)+'</b>'+(lot.unknown?.length?' · pendientes: '+E(lot.unknown.join(", ")):'')+'.</p>'+
  (sold?'<p class="v4missing">Este lote ya tiene '+sold+' unidad(es) vendida(s). El nuevo total se reparte entre las '+lot.qtyOriginal+' unidades originales (al céntimo); las ventas afectadas actualizarán su coste y conservarán el cálculo anterior como antecedente.</p>':'')+
  '<form class="v4form cvCostForm" data-cv-cost-form="card" data-id="'+E(id)+'">'+M().EXTRAS.map(k=>rowFor(k,lot.extras[k])).join("")+
  '<label>Fecha del justificante<input type="date" name="date"></label><label>Referencia (factura, pedido, captura)<input name="ref" placeholder="Ej.: pedido Cardmarket 123456"></label>'+
  '<label>Origen real del envío<input name="origin" value="'+E(c.buyShipOrigin||"")+'" placeholder="País desde el que se expidió"></label>'+
  '<div class="cvPreview" aria-live="polite"></div>'+
  '<div class="v4actions"><button type="submit" class="v4btn primary">Guardar revisión</button><button type="button" class="v4btn" data-cv-cost-close>Cancelar</button></div><p class="v4err" aria-live="polite"></p></form>');
 preview();
}
function openSale(id){
 const s=st(),h=(s?.saleHistory||[]).find(x=>x.id===id);if(!h)return;
 const c=(s.cards||[]).find(x=>x.id===h.cardId);
 if(c&&c.costLot&&h.costUnits){openCard(c.id);return}
 const snap=h.cardSnapshot||{},unit=h.landedCostUnit??snap.landedCostUnit??h.purchase??snap.purchase;
 if(unit==null){alert("Esta venta no tiene precio de compra registrado; no se puede calcular su coste.");return}
 const qty=Math.max(1,Number(h.qty)||1),aterrizado=(h.landedCostUnit??snap.landedCostUnit)!=null;
 sheet('<h3>Revisar coste de adquisición de una venta</h3><p class="v4id">'+E(h.name)+' · vendida el '+E(h.soldAt)+' · '+qty+' ud</p>'+
  originals([["Coste unitario registrado",EUR(M().cents(Number(unit)))+(aterrizado?" (aterrizado: incluía envío y comisiones)":" (solo precio)")],["Ingreso neto",h.net!=null?EUR(M().cents(Number(h.net))):"pendiente"],["Estado actual",M().STATUS_TXT[h.basisStatus]||h.basisStatus||"sin desglose"]])+
  '<form class="v4form cvCostForm" data-cv-cost-form="sale" data-id="'+E(id)+'" data-unit="'+E(unit)+'" data-qty="'+qty+'" data-basis="'+(aterrizado?"aterrizado":"precio")+'">'+
  M().EXTRAS.map(k=>rowFor(k,aterrizado&&(k==="shipping"||k==="fxFee")?{status:"incluido",in:"precio",cents:0}:null)).join("")+
  '<label>Fecha del justificante<input type="date" name="date"></label><label>Referencia<input name="ref"></label><label>Origen real del envío<input name="origin"></label>'+
  '<div class="cvPreview" aria-live="polite"></div><div class="v4actions"><button type="submit" class="v4btn primary">Guardar revisión</button><button type="button" class="v4btn" data-cv-cost-close>Cancelar</button></div><p class="v4err" aria-live="polite"></p></form>');
 preview();
}
function buildFromForm(f){
 const r=readForm(f);if(r.errs.length)return {r,lot:null};
 if(f.dataset.cvCostForm==="card"){const c=st().cards.find(x=>x.id===f.dataset.id);const rv=M().reviseLot(JSON.parse(JSON.stringify(c)),{extras:r.ex},{date:r.date,ref:r.ref,shipOrigin:r.origin});return {r,lot:rv.lot,rv}}
 const qty=Number(f.dataset.qty);const lot=M().newLot({qty,unitPriceCents:M().cents(Number(f.dataset.unit)),extras:r.ex,source:"v109",note:"Coste de venta revisado por el usuario",priceBasis:f.dataset.basis});return {r,lot};
}
function preview(){
 const f=document.querySelector("#cvCostSheet form");if(!f)return;const box=f.querySelector(".cvPreview");
 const {r,lot,rv}=buildFromForm(f);
 if(!lot){box.innerHTML='<p class="v4missing">'+E(r.errs.join(" · "))+'</p>';return}
 box.innerHTML='<div class="v4money"><div><span>TOTAL TRAS LA REVISIÓN</span><b>'+(lot.totalCents!=null?EUR(lot.totalCents):"—")+'</b><small>'+E(M().STATUS_TXT[lot.status]||lot.status)+(lot.totalCents==null?' · subtotal conocido '+EUR(lot.knownCents):'')+'</small></div>'+
  (rv&&rv.unitsSold?'<div><span>UNIDADES VENDIDAS</span><b>'+EUR(rv.soldAfter.reduce((a,b)=>a+b,0))+'</b><small>antes '+EUR(rv.soldBefore.reduce((a,b)=>a+b,0))+'</small></div>':'')+'</div>';
}
function submit(f){
 if(f.dataset.busy)return;f.dataset.busy="1";const err=m=>{f.querySelector(".v4err").textContent=m;delete f.dataset.busy};
 const {r,lot}=buildFromForm(f);if(!lot)return err(r.errs.join(" · "));
 const bk=window.CVSnapshot(),s=st();
 if(f.dataset.cvCostForm==="card"){
  const c=s.cards.find(x=>x.id===f.dataset.id),rv=M().reviseLot(c,{extras:r.ex},{date:r.date,ref:r.ref,shipOrigin:r.origin});
  c.costLot=rv.lot;if(r.origin)c.buyShipOrigin=r.origin;c.updatedAt=new Date().toISOString();
  for(const h of (s.saleHistory||[]).filter(h=>h.cardId===c.id&&h.costUnits&&h.costUnits.to>h.costUnits.from)){const b=c.costLot.allocation.slice(h.costUnits.from,h.costUnits.to).reduce((a,x)=>a+x,0);M().applySaleBasis(h,b,c.costLot.status,"Coste revisado por el usuario"+(r.ref?" · "+r.ref:""));const l=(s.investmentLedger||[]).find(x=>x.id===h.id);if(l)l.basisUnknown=h.basisUnknown}
 }else{
  const h=s.saleHistory.find(x=>x.id===f.dataset.id);M().applySaleBasis(h,lot.totalCents!=null?lot.totalCents:lot.knownCents,lot.status,"Coste revisado por el usuario"+(r.ref?" · "+r.ref:""));h.costReview={lot,at:new Date().toISOString(),ref:r.ref,date:r.date,shipOrigin:r.origin};
  const l=(s.investmentLedger||[]).find(x=>x.id===h.id);if(l)l.basisUnknown=h.basisUnknown;
 }
 if(!guard(bk,"revisión de coste")){delete f.dataset.busy;return err("No se ha guardado. Nada ha cambiado; puedes reintentarlo.")}
 close();try{window.CVRenderCollection?.();window.CVArchive?.render?.();window.CVSalesHistory?.render?.();window.renderInvestmentLedger?.()}catch{}
 alert("Coste guardado: "+(lot.totalCents!=null?EUR(lot.totalCents):"pendiente (subtotal "+EUR(lot.knownCents)+")")+" · "+(M().STATUS_TXT[lot.status]||lot.status)+".");
}
document.addEventListener("click",e=>{
 const a=e.target.closest("[data-cv-cost]");if(a){e.preventDefault();e.stopPropagation();openCard(a.dataset.cvCost);return}
 const b=e.target.closest("[data-cv-cost-sale]");if(b){e.preventDefault();e.stopPropagation();openSale(b.dataset.cvCostSale);return}
 if(e.target.closest("[data-cv-cost-close]")||e.target.id==="cvCostSheet")close();
},true);
document.addEventListener("input",e=>{if(e.target.closest(".cvCostForm"))preview()});
document.addEventListener("change",e=>{if(e.target.closest(".cvCostForm"))preview()});
document.addEventListener("submit",e=>{const f=e.target.closest(".cvCostForm");if(!f)return;e.preventDefault();submit(f)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.getElementById("cvCostSheet")&&!document.getElementById("cvCostSheet").hidden)close()});
window.CVCostReview={openCard,openSale,boot};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,200));else setTimeout(boot,200);
})();
