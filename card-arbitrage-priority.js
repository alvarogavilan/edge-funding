(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const dateOK=(v,now=Date.now())=>{const t=Date.parse(v||'');return Number.isFinite(t)&&t<=now&&now-t<=86400000};
const validUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!/(^|\.)ebay\.[a-z.]+$/i.test(u.hostname)&&!['localhost','127.0.0.1'].includes(u.hostname)}catch{return false}};
function state(){try{return window.CVStateBridge?.get?.()||{}}catch{return {}}}
function owned(r,s){
 const cards=Array.isArray(s.cards)?s.cards:[];
 const n=norm(String(r.number||'').split('/')[0]).replace(/^0+(?=\d)/,''),set=norm(r.set),lang=norm(r.language);
 return cards.some(c=>!c.archivedSold&&norm(c.universe||'pokemon')===norm(r.universe||'pokemon')&&norm(c.set)===set&&norm(String(c.number||'').split('/')[0]).replace(/^0+(?=\d)/,'')===n&&n&&(!c.language||norm(c.language)===lang))||
  (r.kind==='sealed'&&(s.sealedProducts||[]).some(c=>norm(c.name)===norm(r.name)));
}
function getRows(){
 const s=state(),offers=Array.isArray(window.CVRetailSnapshot?.offers)?window.CVRetailSnapshot.offers:[];
 return offers.filter(r=>r&&['card','graded','sealed'].includes(r.kind)&&!owned(r,s))
 .map(r=>{
   const buyValid=!!(r.stock===true&&dateOK(r.checkedAt)&&r.liveVerified===true&&validUrl(r.url)&&Number(r.priceEUR)>=20&&r.evidenceType==='ANUNCIO ACTIVO');
   // Never deduce a firm buyer or comparable sold from a listing / marketing price.
   return {r,buyValid,exitVerified:false,netVerified:false};
 });
}
let refreshRunning=false;let refreshStatus='Sin comprobación de tienda en esta sesión';let storeCoverage={connected:0,unavailable:0};let refreshAt=0;const REFRESH_INTERVAL=15*60*1000;
async function refreshShopify(force=false){
 if(refreshRunning||typeof fetch!=='function'||(!force&&Date.now()-refreshAt<REFRESH_INTERVAL))return;refreshRunning=true;refreshAt=Date.now();refreshStatus='Consultando variantes exactas en tiendas…';render();let ok=0,failed=0;
 try{
  const all=(window.CVRetailSnapshot?.offers||[]);for(const r of all){if(r.liveVerified!==true)r.liveVerified=false}const items=all.filter(r=>r.refreshUrl&&r.variantId&&validUrl(r.refreshUrl));storeCoverage={connected:items.length,unavailable:all.length-items.length};
  for(const r of items.slice(0,12)){
   try{
    const res=await fetch(r.refreshUrl,{method:'GET',mode:'cors',credentials:'omit',cache:'no-store'});
    if(!res.ok){failed++;continue;}
    const product=await res.json();const v=(product?.variants||[]).find(x=>String(x.id)===String(r.variantId));
    if(!v||typeof v.available!=='boolean'||!Number.isFinite(Number(v.price))||Number(v.price)<=0){failed++;continue;}
    // Only product's exact Shopify variant. Never infer resale price or profit.
    r.stock=v.available===true;r.priceEUR=Number(v.price)/100;r.checkedAt=new Date().toISOString();r.liveVerified=true;r.evidenceType='ANUNCIO ACTIVO';ok++;
   }catch(_){failed++;/* CORS or unavailable store: retain old, stale offer */}
  }
 }finally{refreshStatus=ok+' variantes exactas consultadas · '+failed+' fallidas · '+storeCoverage.unavailable+' sin conector automático';refreshRunning=false;render();window.CVFinal?.renderAll?.()}
}
function render(){
 const root=document.getElementById('cvDealsVerified');if(!root)return;
 const rows=getRows(),live=rows.filter(x=>x.buyValid),cards=live.filter(x=>x.r.kind==='card'||x.r.kind==='graded'),sealed=live.filter(x=>x.r.kind==='sealed');
 const all=rows.filter(x=>x.r&&x.r.evidenceType==='ANUNCIO ACTIVO'&&validUrl(x.r.url));
 const historical=all.filter(x=>!x.buyValid&&Number(x.r.priceEUR)>=20);
 const shown=live.length?live:historical.slice().sort((a,b)=>Number(a.r.priceEUR)-Number(b.r.priceEUR));
 root.innerHTML='<section style="border:1px solid #334866;border-radius:16px;padding:16px;background:#132039;margin:12px 0">'+
 '<div style="font-weight:800;letter-spacing:.05em;color:#bcd6ff;font-size:.8rem">CARD VAULT · COMPRAS Y ARBITRAJE</div>'+
 '<h2 style="margin:6px 0">Compra YA · cartas para comprobar</h2><p style="color:#ffcb85;margin:6px 0"><b>0 compras con beneficio neto demostrado.</b> Comprueba el stock y precio actual antes de pagar.</p>'+
 '<p style="margin:8px 0;color:#d9e5f4">Ofertas vigentes de compra: <b>'+live.length+'</b> · Cartas: <b>'+cards.length+'</b> · Sellado: <b>'+sealed.length+'</b> · Anuncios registrados: '+all.length+'.</p>'+
 '<p style="margin:8px 0;color:#c5d3e4" role="status">Actualización de tiendas: '+esc(refreshStatus)+'. La tienda debe permitir acceso desde el navegador; sin conexión, el anuncio continúa caducado.</p>'+ 
 '<p style="margin:8px 0;color:#c5d3e4">Una oferta de venta activa no demuestra a cuánto se revenderá. No hay comprador firme ni margen confirmado en estos registros. Se excluyen cartas ya identificadas en tu colección.</p>'+
 '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="cvDealsRefresh" style="padding:10px">Actualizar tiendas</button><button type="button" id="cvDealsShow" style="padding:10px">Ver ofertas y referencias</button><button type="button" id="cvDealsArb" style="padding:10px">Ir a arbitrajes</button></div>'+
 '<div id="cvDealsList" style="display:block;margin-top:12px"></div>'+
 '</section>';
 const list=root.querySelector('#cvDealsList');
 const paintList=()=>{

  list.innerHTML=shown.length?shown.slice(0,12).map(({r,buyValid})=>
   '<article style="padding:12px 0;border-top:1px solid #314056">'+(r.image?'<img alt="" loading="lazy" src="'+esc(r.image)+'" style="float:right;width:65px;height:85px;object-fit:contain"/>':'')+'<strong>'+esc(r.displayName||r.name)+'</strong> · '+esc(r.universe)+'<div>'+Number(r.priceEUR).toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' · '+esc(r.language)+' · '+esc(r.condition||r.grading||'')+'</div><small>'+(buyValid?'OFERTA RECIENTE POR REVISAR':'OFERTA HISTÓRICA, STOCK NO VERIFICADO')+' · Sin venta cerrada ni beneficio demostrado. Comprobada: '+esc(r.checkedAt)+'</small><div><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Comprobar precio y disponibilidad en tienda ↗</a></div></article>').join(''):'<p>No existen ofertas registradas que puedan consultarse. No se inventarán precios ni enlaces.</p>';
 };
 paintList();
 root.querySelector('#cvDealsShow').onclick=()=>{const hidden=list.style.display==='none';list.style.display=hidden?'block':'none';root.querySelector('#cvDealsShow').textContent=hidden?'Ocultar ofertas':'Ver ofertas y referencias'};
 root.querySelector('#cvDealsRefresh').onclick=()=>{refreshStatus='Consultando productos exactos…';render();refreshShopify(true)};
 root.querySelector('#cvDealsArb').onclick=()=>{const btn=document.querySelector('[data-tab="arbitraje"]');if(btn)btn.click()};
}
function install(){
 const radar=document.getElementById('radar');if(!radar)return;
 let box=document.getElementById('cvDealsVerified');if(!box){box=document.createElement('div');box.id='cvDealsVerified';radar.insertBefore(box,radar.firstChild)}
 render();
 refreshStatus='Comprobación automática iniciada; solo Shopify admite el método implementado';
 refreshShopify();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,600));
else setTimeout(install,600);
window.addEventListener('cv:retail-refresh',()=>{render();refreshShopify()});
window.addEventListener('pageshow',()=>refreshShopify());
window.addEventListener('focus',()=>refreshShopify());
// Reconsultar mientras la app está abierta; no depende de pulsaciones del usuario.
setInterval(()=>{if(!document.hidden)refreshShopify()},15*60*1000);
window.CVDealsVerified={render,getRows,refreshShopify};
})();