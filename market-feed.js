(()=>{"use strict";
/* V86.0 · Mercado controlado: conecta Card Vault con el recolector propio (Cloudflare Worker + D1).
   - Históricos diarios propios (Cardmarket/TCGplayer agregados vía TCGdex/Lorcast; asks reales CardTrader).
   - Zonas históricas BAJA / MEDIA / ALTA solo con ≥30 días de histórico. Nunca crean BUY ni venden.
   - Ofertas ejecutables CardTrader con enlace (vendedor, idioma, condición, CardTrader Zero).
   - Verificación de certificados PSA.
   Vinculación exacta: la carta solo se conecta a un producto que el usuario confirma. */
const N=v=>Number(v)||0,EUR=v=>v==null?"—":N(v).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const Q=s=>document.querySelector(s);
const pct=v=>v==null||!Number.isFinite(v)?"—":(v>=0?"+":"")+v.toFixed(1)+"%";
const LANG={"español":"es","espanol":"es","spanish":"es","inglés":"en","ingles":"en","english":"en","japonés":"ja","japones":"ja","japanese":"ja","francés":"fr","frances":"fr","french":"fr","alemán":"de","aleman":"de","german":"de","italiano":"it","italian":"it","portugués":"pt","coreano":"ko","korean":"ko","chino":"zh"};
const langCode=v=>LANG[String(v||"").trim().toLowerCase()]||(String(v||"").length===2?String(v).toLowerCase():"");
let ui={linking:null,results:{},hist:{},busy:false,msg:"",open:new Set()};

function cfg(){state.marketFeed=state.marketFeed&&typeof state.marketFeed==="object"?state.marketFeed:{};return state.marketFeed}
function ready(){const c=cfg();return !!(c.url&&c.key)}
async function api(path,opt={}){
 const c=cfg(),ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),20000);
 try{
  const r=await fetch(c.url.replace(/\/+$/,"")+path,{method:opt.method||"GET",headers:{"x-cv-key":c.key,"content-type":"application/json"},body:opt.body?JSON.stringify(opt.body):undefined,signal:ctl.signal});
  const j=await r.json().catch(()=>({error:"Respuesta no JSON"}));
  if(!r.ok)throw new Error(j.error||("HTTP "+r.status));
  return j;
 }finally{clearTimeout(t)}
}
function universeOf(x){return String(x.universe||"pokemon").toLowerCase()==="lorcana"?"lorcana":"pokemon"}
/* Activos que Card Vault vigila: colección activa, seguimiento y sellado vinculado */
function assets(){
 const out=[];
 for(const c of state.cards||[]){if(c.archivedSold)continue;
  const listed=(state.saleListings||[]).some(l=>l.cardId===c.id&&l.status==="active");
  out.push({kind:"card",ref:c,id:c.id,name:c.name,set:c.set,number:c.number,lang:langCode(c.language),universe:universeOf(c),owned:true,
   priority:listed||["investment","sell"].includes(c.purpose)?5:2,investment:listed||["investment","sell","reinvest"].includes(c.purpose||""),graded:String(c.grading||"RAW").toUpperCase()!=="RAW"})}
 (state.watch||[]).forEach((w,i)=>out.push({kind:"watch",ref:w,id:"watch-"+i,name:w.name,set:w.set,number:w.number,lang:langCode(w.language),universe:universeOf(w),owned:false,priority:4}));
 for(const p of state.sealedProducts||[])if(p.marketLink)out.push({kind:"sealed",ref:p,id:p.id,name:p.name,set:p.set,number:"",lang:langCode(p.language),universe:universeOf(p),owned:N(p.ownedQuantity)>0,priority:3});
 return out;
}
const linked=()=>assets().filter(a=>a.ref.marketLink?.productId);
function signal(a){return (state.marketSignals||{})[a.ref.marketLink?.productId]||null}
function offers(a){return (state.marketOffers||{})[a.ref.marketLink?.productId]||null}

async function sync(force=false){
 if(!ready()||ui.busy)return;
 const c=cfg();if(!force&&c.lastSync&&Date.now()-new Date(c.lastSync).getTime()<30*60000)return;
 ui.busy=true;ui.msg="Sincronizando…";render();
 try{
  const L=linked();
  const items=L.map(a=>({product_id:a.ref.marketLink.productId,label:a.name,universe:a.universe,lang:a.ref.marketLink.lang||a.lang,priority:a.priority,
   blueprint_id:a.ref.marketLink.blueprintId||null,blueprint_confirmed:!!a.ref.marketLink.blueprintConfirmed}));
  if(items.length)await api("/api/track",{method:"POST",body:{items,replace:true}});
  const ids=[...new Set(items.map(i=>i.product_id))];
  state.marketSignals=state.marketSignals||{};state.marketOffers=state.marketOffers||{};
  for(let i=0;i<ids.length;i+=100){const part=ids.slice(i,i+100).join(",");
   const s=await api("/api/signals?ids="+encodeURIComponent(part));for(const [k,v] of Object.entries(s.signals||{}))state.marketSignals[k]={...v,at:new Date().toISOString()};
   const o=await api("/api/offers?ids="+encodeURIComponent(part));for(const [k,v] of Object.entries(o.offers||{}))if(v)state.marketOffers[k]=v;
  }
  c.status=await api("/api/status");c.lastSync=new Date().toISOString();c.lastError="";ui.msg="";
 }catch(e){c.lastError=String(e.message||e);ui.msg="Error: "+c.lastError}
 ui.busy=false;save();render();try{window.CVPrimeAttention?.render?.()}catch{}
}
function connect(){
 const c=cfg();
 const url=(prompt("URL de tu Worker (ej. https://cardvault-market.TU-USUARIO.workers.dev):",c.url||"")||"").trim();if(!url)return;
 if(!/^https:\/\//i.test(url)){alert("La URL debe empezar por https://");return}
 const key=(prompt("Clave CV_KEY (la misma que pusiste como secreto en el Worker):",c.key||"")||"").trim();if(!key)return;
 c.url=url;c.key=key;save();sync(true);
}
async function search(assetId,custom){
 const a=assets().find(x=>x.id===assetId);if(!a)return;
 const q=custom??a.name;ui.linking=assetId;ui.results[assetId]={loading:true};render();
 try{
  const nb=String(a.number||"").split("/")[0];
  let r=await api("/api/search?universe="+a.universe+"&q="+encodeURIComponent(q)+(nb?"&number="+encodeURIComponent(nb):""));
  if(!(r.results||[]).length&&nb)r=await api("/api/search?universe="+a.universe+"&q="+encodeURIComponent(q));
  ui.results[assetId]={list:r.results||[]};
 }catch(e){ui.results[assetId]={error:String(e.message||e)}}
 render();
}
async function link(assetId,productId,label){
 const a=assets().find(x=>x.id===assetId);if(!a)return;
 if(!confirm("¿Confirmas que "+label+" es EXACTAMENTE la misma carta (set, número, variante)? El idioma y la condición se toman de tu ficha."))return;
 a.ref.marketLink={productId,label,lang:a.lang,confirmedAt:new Date().toISOString()};save();
 try{const r=await api("/api/ct/candidates?product_id="+encodeURIComponent(productId));ui.results[assetId]={ct:r.results||[],exact:r.exact}}catch(e){ui.results[assetId]={ct:[],ctError:String(e.message||e)}}
 render();
}
function linkCt(assetId,bp,label){
 const a=assets().find(x=>x.id===assetId);if(!a||!a.ref.marketLink)return;
 if(!confirm("¿Confirmas que la ficha CardTrader «"+label+"» es la MISMA carta? Solo así se usarán sus ofertas."))return;
 Object.assign(a.ref.marketLink,{blueprintId:Number(bp),blueprintLabel:label,blueprintConfirmed:true});save();ui.linking=null;sync(true);
}
async function trackCtItem(){
 const q=(prompt("Busca en CardTrader (sellado, japonés, etc.). Ej: «151 Booster Bundle» o «Pikachu»:","")||"").trim();if(!q)return;
 const game=confirm("¿Es Disney Lorcana? (Aceptar = Lorcana · Cancelar = Pokémon)")?"lorcana":"pokemon";
 try{
  const r=await api("/api/ct/search?game="+game+"&q="+encodeURIComponent(q));
  const list=(r.results||[]).slice(0,15);
  if(!list.length){alert("Sin resultados. Los catálogos de CardTrader tardan unos días en sincronizarse la primera vez.");return}
  const pick=prompt("Elige el número:\n"+list.map((b,i)=>(i+1)+") "+b.name+(b.version?" "+b.version:"")+" · "+b.expansion_name+(b.number?" · "+b.number:"")).join("\n"),"1");
  const b=list[N(pick)-1];if(!b)return;
  const lang=(prompt("Idioma exacto que quieres seguir (es, en, ja, fr, de, it…):","en")||"").trim().toLowerCase();
  state.watch=Array.isArray(state.watch)?state.watch:[];
  state.watch.push({name:b.name+(b.version?" "+b.version:""),target:0,set:b.expansion_name,number:b.number||"",language:lang,universe:game,source:"CardTrader",
   marketLink:{productId:"ct:"+b.id,label:b.name+" · "+b.expansion_name,lang,blueprintId:b.id,blueprintLabel:b.expansion_name,blueprintConfirmed:true,confirmedAt:new Date().toISOString()}});
  save();sync(true);try{window.CVRenderCollection?.()}catch{}
 }catch(e){alert("Error: "+(e.message||e))}
}
async function verifyCert(cardId){
 const c=(state.cards||[]).find(x=>x.id===cardId);if(!c?.cert)return;
 try{
  const r=await api("/api/cert/"+encodeURIComponent(c.cert)),d=r.data?.PSACert||r.data||{};
  const gradeTxt=String(d.CardGrade||d.GradeDescription||""),gradeNum=(gradeTxt.match(/\d+(\.\d)?/)||[])[0]||"";
  const subj=String(d.Subject||"").toLowerCase(),first=String(c.name||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").split(/\s+/)[0];
  const valid=d.IsValidRequest!==false&&!!(d.CertNumber||d.Subject);
  const gradeOk=!!gradeNum&&String(gradeNum)===String(c.grade);
  const nameOk=!!first&&subj.normalize("NFD").replace(/[̀-ͯ]/g,"").includes(first);
  c.certVerification={at:new Date().toISOString(),valid,gradeOk,nameOk,grade:gradeTxt,subject:d.Subject||"",year:d.Year||d.YearIssued||"",brand:d.Brand||"",variety:d.Variety||"",source:"PSA Public API"};
  save();render();try{window.CVPrimeAttention?.render?.()}catch{}
  alert(valid?(gradeOk&&nameOk?"Certificado PSA verificado: "+gradeTxt+" · "+d.Subject:"ATENCIÓN: el certificado existe pero NO coincide ("+gradeTxt+" · "+d.Subject+")."):"PSA no reconoce este certificado.");
 }catch(e){alert("No se pudo verificar: "+(e.message||e))}
}
async function loadHistory(pid){
 if(ui.hist[pid])return;ui.hist[pid]={loading:true};
 try{const r=await api("/api/history?id="+encodeURIComponent(pid)+"&days=365");ui.hist[pid]={points:r.points||[]}}catch(e){ui.hist[pid]={error:String(e.message||e)}}
 render();
}
function spark(points,s){
 if(!points||points.length<2)return '<div class="microNote">Histórico insuficiente para gráfico ('+(points?.length||0)+' días).</div>';
 const w=300,h=70,vs=points.map(p=>p.v),mn=Math.min(...vs),mx=Math.max(...vs),rg=mx-mn||1;
 const x=i=>(i/(points.length-1))*(w-8)+4,y=v=>h-6-((v-mn)/rg)*(h-12);
 const line=points.map((p,i)=>x(i).toFixed(1)+","+y(p.v).toFixed(1)).join(" ");
 const band=(v,cls)=>v==null?"":'<line class="'+cls+'" x1="4" x2="'+(w-4)+'" y1="'+y(v).toFixed(1)+'" y2="'+y(v).toFixed(1)+'"/>';
 return '<svg class="mfSpark" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img" aria-label="Histórico de precio">'+band(s?.p20_90,"p20")+band(s?.p80_90,"p80")+'<polyline points="'+line+'"/></svg>'+
  '<div class="mfAxis"><span>'+E(points[0].day)+'</span><span>mín '+EUR(mn)+' · máx '+EUR(mx)+'</span><span>'+E(points[points.length-1].day)+'</span></div>';
}
function links(a){
 const u=a.universe==="lorcana"?"Lorcana":"Pokemon",q=encodeURIComponent([a.name,a.number&&String(a.number).split("/")[0]].filter(Boolean).join(" "));
 const bp=a.ref.marketLink?.blueprintId;
 return '<div class="mfLinks"><a href="https://www.cardmarket.com/es/'+u+'/Products/Search?searchString='+encodeURIComponent(a.name)+'" target="_blank" rel="noopener">Cardmarket</a>'+
  (bp?'<a href="https://www.cardtrader.com/cards/'+bp+'" target="_blank" rel="noopener">CardTrader</a>':'')+
  (a.universe==="lorcana"&&a.ref.marketLink?.productId?.startsWith("lor:")?'<a href="https://www.tcgplayer.com/search/lorcana-tcg/product?q='+q+'" target="_blank" rel="noopener">TCGplayer (ref. EE.UU.)</a>':'')+'</div>';
}
const ZONE={BAJA:"z-low",ALTA:"z-high",MEDIA:"z-mid",INSUFICIENTE:"z-na"};
function row(a){
 const s=signal(a),o=offers(a),pid=a.ref.marketLink.productId,h=ui.hist[pid];
 const best=(o?.offers||[]).filter(x=>/mint/i.test(x.condition||"")&&!x.graded)[0]||null,zero=(o?.offers||[]).find(x=>x.zero)||null;
 const cv=a.ref.certVerification;
 return '<details class="mfRow" data-mf-pid="'+E(pid)+'"'+(ui.open.has(pid)?' open':'')+'><summary><span class="mfZone '+(ZONE[s?.zone]||"z-na")+'">'+E(s?.zone||"SIN DATO")+'</span><span class="mfName">'+E(a.name)+'<small>'+E([a.kind==="watch"?"seguimiento":a.kind==="sealed"?"sellado":a.investment?"inversión":"colección",a.ref.marketLink.label].filter(Boolean).join(" · "))+'</small></span><span class="mfPx">'+EUR(s?.last)+'<small>'+pct(s?.change30)+' 30d</small></span></summary>'+
  (h?.points?spark(h.points,s):'<div class="microNote">'+(h?.loading?'Cargando histórico…':h?.error?'Error: '+E(h.error):'')+'</div>')+
  '<div class="exitGrid">'+
   '<div><span>Histórico propio</span><b>'+(s?.points||0)+' días'+(s?.firstDay?'<small> desde '+E(s.firstDay)+'</small>':'')+'</b></div>'+
   '<div><span>Posición en '+(s?.rankWindow||90)+'d</span><b>'+(s?.rank==null?'—':'p'+s.rank)+'</b></div>'+
   '<div><span>Banda 90d p20–p80</span><b>'+EUR(s?.p20_90)+' – '+EUR(s?.p80_90)+'</b></div>'+
   '<div><span>Δ 7 / 90 días</span><b>'+pct(s?.change7)+' / '+pct(s?.change90)+'</b></div>'+
   '<div><span>Volatilidad 30d</span><b>'+(s?.volatility30==null?'—':s.volatility30.toFixed(1)+'%')+'</b></div>'+
   '<div><span>Caída máx. 90d</span><b>'+(s?.drawdown90==null?'—':s.drawdown90.toFixed(1)+'%')+'</b></div>'+
   '<div><span>Ask NM más bajo</span><b>'+EUR(s?.askMinNm)+'<small>'+(s?.askListings!=null?' '+s.askListings+' anuncios':'')+'</small></b></div>'+
   '<div><span>Ask Zero (verificado)</span><b>'+EUR(s?.askZeroMin)+'</b></div>'+
  '</div>'+
  (best||zero?'<div class="mfOffers"><b>Ofertas ejecutables CardTrader · '+E(o.day)+'</b>'+[best,zero].filter((x,i,arr)=>x&&arr.indexOf(x)===i).map(x=>'<a class="mfOffer" href="'+E(x.url)+'" target="_blank" rel="noopener"><span>'+EUR(x.price_eur)+'</span><small>'+E([x.condition,String(x.lang||"").toUpperCase(),x.seller,x.country].filter(Boolean).join(" · "))+(x.zero?' · <b>CardTrader Zero</b>':'')+'</small></a>').join("")+'<small>Oferta real en el momento de la consulta: confirma precio, idioma y portes antes de comprar. No activa BUY: sigue exigiendo el gate PRIME.</small></div>':'')+
  (a.graded&&a.ref.cert?'<div class="qaRow"><span>Certificado '+E(a.ref.cert)+'<small> · '+(cv?(cv.valid&&cv.gradeOk&&cv.nameOk?'verificado PSA '+E(cv.grade):'NO COINCIDE · '+E(cv.grade+' '+cv.subject)):'sin verificar')+'</small></span><b><button type="button" data-mf-cert="'+E(a.ref.id)+'">Verificar</button></b></div>':'')+
  links(a)+
  '<small class="microNote">'+E(s?.note||"")+(s?.basis?' Base: '+E(s.basis)+'.':'')+'</small></details>';
}
function ctButtons(a,r){
 return (r.ct?(r.ct.length?'<div class="microNote">Confirma su ficha en CardTrader para recibir ofertas'+(r.exact?' (coincidencia exacta por ID TCGplayer)':'')+':</div>'+r.ct.slice(0,6).map(b=>'<button type="button" class="mfCand" data-mf-ct="'+E(a.id)+'" data-bp="'+b.id+'" data-label="'+E(b.name+" · "+b.expansion+" · "+b.number)+'">'+(b.image?'<img src="'+E(b.image)+'" alt="" loading="lazy">':'')+'<span>'+E(b.name+(b.version?" "+b.version:""))+'<small>'+E(b.expansion+" · nº "+b.number)+'</small></span></button>').join(""):'<div class="microNote">'+(r.ctError?E(r.ctError):'Sin ficha CardTrader aún (el catálogo tarda unos días en sincronizarse o falta el token).')+'</div>'):'');
}
function linkingBox(){
 const un=assets().filter(a=>a.kind!=="sealed"&&!a.ref.marketLink?.productId);
 const pend=linked().filter(a=>!a.ref.marketLink.blueprintConfirmed);
 const one=a=>{
  const r=ui.results[a.id]||{};
  return '<div class="mfLink"><div class="qaRow"><span>'+E(a.name)+'<small> · '+E([a.set,a.number,a.lang.toUpperCase()].filter(Boolean).join(" · "))+'</small></span><b><button type="button" data-mf-search="'+E(a.id)+'">Buscar</button></b></div>'+
   (r.loading?'<div class="microNote">Buscando…</div>':'')+(r.error?'<div class="microNote">Error: '+E(r.error)+'</div>':'')+
   (r.list?(r.list.length?r.list.slice(0,8).map(p=>'<button type="button" class="mfCand" data-mf-link="'+E(a.id)+'" data-pid="'+E(p.id)+'" data-label="'+E(p.name+" · "+p.set_name+" · "+p.number)+'">'+(p.image?'<img src="'+E(p.image)+'" alt="" loading="lazy">':'')+'<span>'+E(p.name)+'<small>'+E(p.set_name+" · nº "+p.number+(p.rarity?" · "+p.rarity:""))+'</small></span></button>').join(""):'<div class="microNote">Sin coincidencias. Prueba el nombre en inglés.</div>')+'<button type="button" class="linkish" data-mf-custom="'+E(a.id)+'">Buscar con otro nombre</button>':'')+
   ctButtons(a,r)+'</div>';
 };
 return '<details class="mfLinking"'+(ui.linking?' open':'')+'><summary>Vincular · '+un.length+' sin vincular · '+pend.length+' sin CardTrader</summary>'+
  un.slice(0,40).map(one).join("")+pend.slice(0,20).map(a=>{const r=ui.results[a.id];return '<div class="mfLink"><div class="qaRow"><span>'+E(a.name)+'<small> · vinculada · falta CardTrader</small></span><b><button type="button" data-mf-relink="'+E(a.id)+'" data-pid="'+E(a.ref.marketLink.productId)+'">Buscar ficha</button></b></div>'+(r?ctButtons(a,r):"")+'</div>'}).join("")+
  '<div class="sealedActions"><button type="button" data-mf-ct-track="1">+ Seguir producto CardTrader (sellado / japonés)</button></div></details>';
}
function render(){
 const host=Q("#todaySimple");if(!host)return;
 let box=Q("#primeMarketFeed");
 if(!box){box=document.createElement("section");box.id="primeMarketFeed";box.className="qaPanel";const after=Q("#primeValuationQuality");after?after.after(box):host.prepend(box)}
 const c=cfg();
 if(!ready()){
  box.innerHTML='<b>Mercado controlado · históricos propios</b><div class="microNote">Conecta tu recolector (Cloudflare Worker gratuito) para guardar cada día el precio de todo el catálogo Pokémon y Lorcana, ofertas reales con enlace de CardTrader y verificación de certificados PSA.</div>'+
   '<div class="sealedActions primaryOnly"><button type="button" class="primaryAction" data-mf-connect="1">Conectar recolector</button></div><a href="https://github.com/alvarogavilan/edge-funding/blob/main/market-worker/LEEME.md" target="_blank" rel="noopener">Guía de instalación (10 min desde el iPhone)</a>';
  return;
 }
 const L=linked(),zones={BAJA:0,MEDIA:0,ALTA:0,INSUFICIENTE:0};for(const a of L){const z=signal(a)?.zone||"INSUFICIENTE";zones[z]=(zones[z]||0)+1}
 const st=c.status||{};
 const order={BAJA:0,ALTA:1,MEDIA:2,INSUFICIENTE:3};
 const rows=L.slice().sort((a,b)=>(order[signal(a)?.zone]??4)-(order[signal(b)?.zone]??4)||b.priority-a.priority);
 box.innerHTML='<b>Mercado controlado · históricos propios</b>'+
  '<div class="statsGrid"><div><span>Zona baja</span><b>'+zones.BAJA+'</b></div><div><span>Zona alta</span><b>'+zones.ALTA+'</b></div><div><span>Vigilados</span><b>'+L.length+'</b></div><div><span>Histórico</span><b>'+(st.historyDays||0)+' días</b></div></div>'+
  '<div class="microNote">'+(ui.msg?E(ui.msg)+' · ':'')+'Catálogo: '+(st.products?.pokemon||0)+' Pokémon · '+(st.products?.lorcana||0)+' Lorcana · precios hoy '+(st.pricesToday||0)+' · CardTrader '+(st.sources?.cardtrader?'activo':'sin token')+' · PSA '+(st.sources?.psa?'activo':'sin token')+(c.lastSync?' · sync '+new Date(c.lastSync).toLocaleString("es-ES"):'')+(c.lastError?' · ⚠️ '+E(c.lastError):'')+'</div>'+
  '<div class="sealedActions primaryOnly"><button type="button" class="primaryAction" data-mf-sync="1"'+(ui.busy?' disabled':'')+'>'+(ui.busy?'Sincronizando…':'Sincronizar mercado')+'</button></div>'+
  rows.slice(0,60).map(row).join("")+
  linkingBox()+
  '<details class="moreActions"><summary>Conexión</summary><div class="sealedActions"><button type="button" data-mf-connect="1">Cambiar URL / clave</button></div></details>'+
  '<small>Zonas = posición del precio de referencia dentro de su propio rango de 90–180 días (BAJA ≤p20, ALTA ≥p80) y solo con ≥30 días de histórico. Es contexto para decidir cuándo mirar, no una orden: BUY y SELL siguen exigiendo evidencia PRIME.</small>';
}
function attentionItems(){
 if(!ready())return [];
 const out=[],c=cfg();
 if(c.lastSync&&Date.now()-new Date(c.lastSync).getTime()>36*3600e3)out.push({kind:"market-stale",priority:70,name:"Mercado controlado",text:"Sin sincronizar desde hace más de 36 h"});
 if(c.lastError)out.push({kind:"market-error",priority:72,name:"Mercado controlado",text:"Error del recolector: "+c.lastError});
 for(const a of linked()){
  const s=signal(a);
  if(s?.zone==="BAJA"&&!a.owned)out.push({kind:"market-low",priority:76,name:a.name,text:"Zona BAJA histórica (p"+s.rank+" "+s.rankWindow+"d · "+EUR(s.last)+") · revisar evidencia de compra"});
  if(s?.zone==="ALTA"&&a.owned&&a.investment)out.push({kind:"market-high",priority:75,name:a.name,text:"Zona ALTA histórica (p"+s.rank+" "+s.rankWindow+"d) · revisar venta con evidencia"});
  const cv=a.ref.certVerification;if(cv&&!(cv.valid&&cv.gradeOk&&cv.nameOk))out.push({kind:"cert-mismatch",priority:99,name:a.name,text:"Certificado PSA NO coincide con la ficha · no vender/comprar hasta aclarar"});
 }
 return out;
}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-mf-connect],[data-mf-sync],[data-mf-search],[data-mf-custom],[data-mf-link],[data-mf-ct],[data-mf-relink],[data-mf-ct-track],[data-mf-cert]");if(!t)return;
 e.preventDefault();
 const d=t.dataset;
 if(d.mfConnect)connect();
 else if(d.mfSync)sync(true);
 else if(d.mfSearch)search(d.mfSearch);
 else if(d.mfCustom){const v=prompt("Nombre a buscar (mejor en inglés):","");if(v)search(d.mfCustom,v)}
 else if(d.mfLink)link(d.mfLink,d.pid,d.label);
 else if(d.mfCt)linkCt(d.mfCt,d.bp,d.label);
 else if(d.mfRelink)(async()=>{try{const r=await api("/api/ct/candidates?product_id="+encodeURIComponent(d.pid));ui.results[d.mfRelink]={ct:r.results||[],exact:r.exact};ui.linking=d.mfRelink}catch(err){ui.results[d.mfRelink]={ct:[],ctError:String(err.message||err)}}render()})();
 else if(d.mfCtTrack)trackCtItem();
 else if(d.mfCert)verifyCert(d.mfCert);
});
document.addEventListener("toggle",e=>{const el=e.target;if(!el?.classList?.contains("mfRow"))return;const pid=el.dataset.mfPid;if(el.open){ui.open.add(pid);if(ready())loadHistory(pid)}else ui.open.delete(pid)},true);
setTimeout(()=>{render();sync(false)},350);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)sync(false)});
window.CVMarketFeed={sync,render,attentionItems,assets,signal,verifyCert};
})();
