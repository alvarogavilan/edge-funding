(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const dateOK=(v,now=Date.now())=>{const t=Date.parse(v||'');return Number.isFinite(t)&&t<=now&&now-t<=86400000};
const validUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.hostname.toLowerCase().includes('ebay.')}catch{return false}};
function state(){try{return window.CVStateBridge?.get?.()||{}}catch{return {}}}
function owned(r,s){
 const cards=Array.isArray(s.cards)?s.cards:[];
 const n=norm(r.number),set=norm(r.set),lang=norm(r.language);
 return cards.some(c=>!c.archivedSold&&norm(c.universe||'pokemon')===norm(r.universe||'pokemon')&&norm(c.set)===set&&norm(c.number)===n&&n&&(!c.language||norm(c.language)===lang))||
  (r.kind==='sealed'&&(s.sealedProducts||[]).some(c=>norm(c.name)===norm(r.name)));
}
function getRows(){
 const s=state(),offers=Array.isArray(window.CVRetailSnapshot?.offers)?window.CVRetailSnapshot.offers:[];
 return offers.filter(r=>r&&['card','graded','sealed'].includes(r.kind)&&!owned(r,s))
 .map(r=>{
   const buyValid=!!(r.stock===true&&dateOK(r.checkedAt)&&validUrl(r.url)&&Number(r.priceEUR)>=20&&r.evidenceType==='ANUNCIO ACTIVO');
   // Never deduce a firm buyer or comparable sold from a listing / marketing price.
   return {r,buyValid,exitVerified:false,netVerified:false};
 });
}
function render(){
 const root=document.getElementById('cvDealsVerified');if(!root)return;
 const rows=getRows(),live=rows.filter(x=>x.buyValid),cards=live.filter(x=>x.r.kind==='card'||x.r.kind==='graded'),sealed=live.filter(x=>x.r.kind==='sealed');
 const all=rows.filter(x=>x.r&&x.r.evidenceType==='ANUNCIO ACTIVO');
 root.innerHTML='<section style="border:1px solid #334866;border-radius:16px;padding:16px;background:#132039;margin:12px 0">'+
 '<div style="font-weight:800;letter-spacing:.05em;color:#bcd6ff;font-size:.8rem">CARD VAULT · COMPRAS Y ARBITRAJE</div>'+
 '<h2 style="margin:6px 0">0 arbitrajes con beneficio probado</h2>'+
 '<p style="margin:8px 0;color:#d9e5f4">Ofertas vigentes de compra: <b>'+live.length+'</b> · Cartas: <b>'+cards.length+'</b> · Sellado: <b>'+sealed.length+'</b> · Anuncios registrados: '+all.length+'.</p>'+
 '<p style="margin:8px 0;color:#c5d3e4">Una oferta de venta activa no demuestra a cuánto se revenderá. No hay comprador firme ni margen confirmado en estos registros. Se excluyen cartas ya identificadas en tu colección.</p>'+
 '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="cvDealsShow" style="padding:10px">Ver ofertas vigentes</button><button type="button" id="cvDealsArb" style="padding:10px">Ir a arbitrajes</button></div>'+
 '<div id="cvDealsList" style="display:none;margin-top:12px"></div>'+
 '</section>';
 const list=root.querySelector('#cvDealsList');
 root.querySelector('#cvDealsShow').onclick=()=>{
  const open=list.style.display==='none';list.style.display=open?'block':'none';if(!open)return;
  list.innerHTML=live.length?live.slice(0,12).map(({r})=>
   '<article style="padding:12px 0;border-top:1px solid #314056"><strong>'+esc(r.displayName||r.name)+'</strong> · '+esc(r.universe)+'<div>'+Number(r.priceEUR).toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' · '+esc(r.language)+' · '+esc(r.condition||r.grading||'')+'</div><small>Compra anunciada; venta cerrada y beneficio sin demostrar. Oferta comprobada: '+esc(r.checkedAt)+'</small><div><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Abrir producto específico ↗</a></div></article>').join(''):'<p>No hay ofertas verificadas durante las últimas 24 h. No se mostrarán anuncios caducados como compras actuales.</p>';
 };
 root.querySelector('#cvDealsArb').onclick=()=>{const btn=document.querySelector('[data-tab="arbitraje"]');if(btn)btn.click()};
}
function install(){
 const radar=document.getElementById('radar');if(!radar)return;
 let box=document.getElementById('cvDealsVerified');if(!box){box=document.createElement('div');box.id='cvDealsVerified';radar.insertBefore(box,radar.firstChild)}
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,600));
else setTimeout(install,600);
window.addEventListener('cv:retail-refresh',render);
window.CVDealsVerified={render,getRows};
})();