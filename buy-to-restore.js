(()=>{'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key='cv_buy_to_restore_v1';
function read(){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
function validUrl(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!/(^|\\.)ebay\\./i.test(u.hostname)}catch{return false}}
function profit(x,sale){return sale*(1-x.fee/100)-x.buy-x.buyShipping-x.sellShipping}
function render(){
 const root=$('brResults');if(!root)return;
 const items=read();
 $('brCount').textContent=items.length+' fichas guardadas · 0 compras con rentabilidad confirmada automáticamente';
 root.innerHTML=items.length?items.map(x=>{
 const low=profit(x,x.sellLow),high=profit(x,x.sellHigh),hasSale=!!(x.soldUrl&&x.soldAmount>0&&x.soldDate&&x.soldType==='completed'&&x.soldSameIdentity===true),matched=hasSale&&x.soldIsAltered===true;
 return '<article style="border:1px solid #43516a;border-radius:12px;padding:14px;margin:12px 0;display:grid;gap:7px">'+
 '<strong>'+esc(x.name)+'</strong><small>'+esc(x.game)+' · '+esc(x.set)+' · '+esc(x.language)+' · estado anunciado: '+esc(x.condition)+'</small>'+
 (x.imageUrl&&validUrl(x.imageUrl)?'<img loading="lazy" alt="Foto de la carta" src="'+esc(x.imageUrl)+'" style="max-height:160px;max-width:130px;object-fit:contain">':'')+
 '<div>Compra: <b>'+fmt(x.buy)+'</b> · Envío compra: '+fmt(x.buyShipping)+'</div>'+
 '<div>Posible venta como restaurada: <b>'+fmt(x.sellLow)+' – '+fmt(x.sellHigh)+'</b></div>'+
 '<div>Beneficio hipotético: <b>'+fmt(low)+' – '+fmt(high)+'</b> (comisión '+x.fee+' %, envío venta '+fmt(x.sellShipping)+')</div>'+ 
 '<div><b>Evidencia de ventas:</b> '+(matched?'Referencia declarada de carta intervenida; pendiente de auditoría independiente':hasSale?'Venta cerrada declarada, pero NO comparable automáticamente con carta intervenida':'SIN VENTA CERRADA COMPARABLE')+'</div>'+
 '<small>Escenario NO verificado. Es obligatorio declarar la restauración; no valorar como carta NM original ni como PSA numérica. '+(x.soldUrl?'La URL de referencia la aportó el usuario y no está verificada automáticamente.':'Sin venta cerrada comparable aportada.')+'</small>'+
 '<div><a target="_blank" rel="noopener noreferrer" href="'+esc(x.buyUrl)+'">Abrir compra exacta ↗</a>'+(x.soldUrl&&validUrl(x.soldUrl)?' · <a target="_blank" rel="noopener noreferrer" href="'+esc(x.soldUrl)+'">Ver referencia de salida ↗</a>':'')+'</div>'+
 '<button type="button" data-br-delete="'+esc(x.id)+'" style="width:max-content">Quitar de estudio</button></article>';
 }).join(''):'<p>Sin oportunidades guardadas aún. Introduce una carta dañada con enlace de compra exacto. No inventamos anuncios ni precios de venta.</p>';
}
function save(ev){ev?.preventDefault?.();const form=$('brForm');if(!form)return;
 const x={id:String(Date.now())+Math.random().toString(36).slice(2),savedAt:new Date().toISOString()};
 const get=n=>form.elements.namedItem(n)?.value?.trim?.()||'';
 for(const f of ['name','game','set','language','condition','buyUrl','imageUrl','soldUrl','soldDate','soldType'])x[f]=get(f);
 x.soldAmount=Number(get('soldAmount'));x.soldSameIdentity=!!form.elements.namedItem('soldSameIdentity')?.checked;x.soldIsAltered=!!form.elements.namedItem('soldIsAltered')?.checked;
 for(const f of ['buy','buyShipping','sellLow','sellHigh','fee','sellShipping'])x[f]=Number(get(f));
 if(!x.name||!validUrl(x.buyUrl)||x.imageUrl&&!validUrl(x.imageUrl)||x.soldUrl&&!validUrl(x.soldUrl)||!Number.isFinite(x.buy)||x.buy<=0||!Number.isFinite(x.sellLow)||x.sellLow<=0||!Number.isFinite(x.sellHigh)||x.sellHigh<x.sellLow||[x.buyShipping,x.fee,x.sellShipping].some(v=>!Number.isFinite(v)||v<0)||x.fee>=100||(x.soldUrl&&(!Number.isFinite(x.soldAmount)||x.soldAmount<=0||!x.soldDate||x.soldType!=='completed'))){$('brFeedback').textContent='Comprueba la URL exacta y los importes. La venta superior debe ser mayor o igual a la inferior.';return}
 try{localStorage.setItem(key,JSON.stringify([x,...read()].slice(0,60)));form.reset();$('brFeedback').textContent='Estudio guardado en este navegador. No es una compra aprobada.';render()}catch(_){$('brFeedback').textContent='El almacenamiento local no está disponible.'}
}
function init(){if(!$('brForm'))return;$('brForm').addEventListener('submit',save);$('brResults').addEventListener('click',e=>{const b=e.target.closest('[data-br-delete]');if(!b)return;try{localStorage.setItem(key,JSON.stringify(read().filter(x=>x.id!==b.dataset.brDelete)));render()}catch(_){}});render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();