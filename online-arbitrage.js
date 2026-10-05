(function (root) {
  "use strict";
  const costKeys = ["purchaseCents","shippingCents","feesCents","withdrawalCents","taxesCents","contingencyCents"];
  function allowedUrl(value) {
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password && !/(^|\.)ebay\.[a-z.]+$/i.test(u.hostname);
    } catch { return false; }
  }
  function evaluate(record, now = Date.now()) {
    const r = record || {}, reasons = [];
    const monetary = [...costKeys,"saleCents"].every(k => Number.isSafeInteger(r[k]) && r[k] >= 0);
    const total = monetary ? costKeys.reduce((sum,k) => sum + r[k],0) : null;
    const net = monetary && Number.isSafeInteger(total) ? r.saleCents - total : null;
    if (!monetary || !Number.isSafeInteger(total)) reasons.push("Faltan importes o costes válidos.");
    if (!(r.purchaseCents > 0)) reasons.push("Falta precio de compra.");
    if (!(net > 0)) reasons.push("No hay margen neto positivo demostrado.");
    const checks = [
      ["sameUnitVerified","Referencia, variante, estado o accesorios sin verificar."],
      ["stockVerified","Stock de compra sin verificar."],
      ["spainAllowed","Compra y venta desde España sin verificar."],
      ["cashWithdrawalVerified","Salida a dinero sin verificar."],
      ["bindingExitVerified","No existe comprador o puja ejecutable para esta misma unidad."],
      ["inspectionResolved","Queda inspección, autenticación o revisión material pendiente."],
      ["nonPromoVerified","La operación depende de una promoción."],
      ["costsComplete","Costes totales incompletos."],
      ["accountEligibleVerified","Cuenta, límites o condiciones de vendedor sin verificar."],
      ["variantLocked","Talla, color, capacidad, referencia o edición no están bloqueados a la misma variante."],
      ["quoteLiveVerified","La salida no se ha revalidado en el momento de decisión."]
    ];
    for (const [key,msg] of checks) if (r[key] !== true) reasons.push(msg);
    if (!allowedUrl(r.buyUrl) || !allowedUrl(r.exitUrl)) reasons.push("Enlaces inválidos o mercado excluido.");
    if (!Array.isArray(r.evidenceUrls) || r.evidenceUrls.length < 2 || !r.evidenceUrls.every(allowedUrl)) reasons.push("Faltan fuentes independientes de compra y salida.");
    const checked = Date.parse(r.checkedAt), expiry = Date.parse(r.quoteExpiresAt);
    if (!Number.isFinite(checked) || checked > now || now - checked > 86400000) reasons.push("Precios pendientes de revalidación.");
    if (!Number.isFinite(expiry) || expiry <= now) reasons.push("Oferta de salida caducada o sin plazo.");
    return {
      status: reasons.length ? "BLOCKED" : "HUMAN_REVIEW",
      netCents: net,
      reasons,
      guaranteed:false,
      autoPurchase:false,
      humanReviewRequired:true
    };
  }
  const api={evaluate,allowedUrl};
  if (typeof module==="object" && module.exports) module.exports=api;
  if (!root.document) return;
  root.CVOnlineArbitrage=api;

  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money=v=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(v);
  const statusLabel=s=>s==="candidate"?"RUTA PRIORITARIA":s==="conditional"?"RECOMPRA CONDICIONADA":"DESCARTADA COMO SALIDA CERRADA";
  let report;

  function safeLinks(sources){
    return (sources||[]).filter(s=>allowedUrl(s.url)).map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.label)+'</a>').join("");
  }
  function ensureToolbar(){
    const bar=document.querySelector(".arbToolbar"); if(!bar) return;
    if(!document.getElementById("arbitrageStatus")){
      bar.insertAdjacentHTML("beforeend",
        '<label for="arbitrageStatus">Estado</label><select id="arbitrageStatus"><option value="">Todos</option><option value="candidate">Ruta prioritaria</option><option value="conditional">Condicionada</option><option value="excluded">Descartada</option></select>'+
        '<label for="arbitrageOrigin">Origen</label><select id="arbitrageOrigin"><option value="">Online + Sevilla</option><option value="Online">Solo online</option><option value="Sevilla">Admite Sevilla físico</option></select>');
    }
  }
  function filteredRoutes(){
    const category=document.getElementById("arbitrageCategory")?.value||"";
    const status=document.getElementById("arbitrageStatus")?.value||"";
    const origin=document.getElementById("arbitrageOrigin")?.value||"";
    return report.routes.filter(r=>{
      if(category&&r.category!==category) return false;
      if(status&&r.status!==status) return false;
      if(origin==="Online"&&!String(r.origin||"").includes("Online")) return false;
      if(origin==="Sevilla"&&!String(r.origin||"").includes("Sevilla")) return false;
      return true;
    });
  }
  function render(){
    const host=document.getElementById("onlineArbitrageContent"); if(!host||!report) return;
    const routes=filteredRoutes(), date=new Date(report.checkedAt).toLocaleString("es-ES",{timeZone:"Europe/Madrid"});
    const stale=Date.now()-Date.parse(report.checkedAt)>86400000;
    const ready=Number(report.readyCount||0), candidates=report.routes.filter(r=>r.status==="candidate").length;
    host.innerHTML=
      '<section class="arbCommand"><div><span class="arbKicker">MODO ESTRICTO</span><h3>'+esc(report.strictPolicy?.label||"SALIDA EJECUTABLE O BLOQUEO")+'</h3><p>'+esc(report.strictPolicy?.rule||"")+'</p></div>'+
      '<div class="arbKpis"><div><b>'+ready+'</b><span>compras autorizadas</span></div><div><b>'+candidates+'</b><span>rutas prioritarias</span></div><div><b>'+report.routes.length+'</b><span>circuitos investigados</span></div></div></section>'+
      '<div class="arbSummary"><strong>'+ready+' compras con beneficio cerrado demostradas</strong><p>'+esc(report.summary)+'</p><small>Revisión: '+esc(date)+' · España · eBay excluido</small><p class="arbFreshness">'+
      (stale?"Datos de mercado pendientes de revalidación. ":"Evidencia revisada en las últimas 24 h. ")+"La app no compra ni vende automáticamente.</p></div>"+
      '<section class="arbLaneBlock"><h3>Motor de búsqueda</h3><div class="arbLanes">'+(report.lanes||[]).map(l=>'<article><span>#'+esc(l.priority)+'</span><h4>'+esc(l.name)+'</h4><p>'+esc(l.rule)+'</p><small>'+esc((l.examples||[]).join(" · "))+'</small></article>').join("")+'</div></section>'+
      '<h3>Casos concretos investigados</h3>'+report.cases.map(c=>'<article class="arbCase"><span class="arbBadge">'+(c.ceilingDifferenceEUR>0?"DIFERENCIAL APARENTE · BLOQUEADO":"NO COMPRAR PARA REVENTA")+'</span><h4>'+esc(c.name)+'</h4><dl><div><dt>Compra observada</dt><dd>'+money(c.buyPriceEUR)+'</dd></div><div><dt>Salida observada / techo</dt><dd>'+money(c.exitCeilingEUR)+'</dd></div><div><dt>Diferencia bruta</dt><dd>'+money(c.ceilingDifferenceEUR)+'</dd></div></dl><p>'+esc(c.buyCondition)+'</p><p>'+esc(c.exitCondition)+'</p><p><b>Decisión:</b> '+esc(c.finding)+'</p><div class="arbLinks">'+safeLinks([{label:"Compra / mercado",url:c.buyUrl},{label:"Salida / evidencia",url:c.exitUrl}])+'</div></article>').join("")+
      '<h3>Rutas investigadas · '+routes.length+'</h3><div class="arbRoutes">'+routes.map(r=>
        '<article class="arbRoute arb-'+esc(r.status)+'"><div class="arbRouteTop"><span class="arbBadge">'+statusLabel(r.status)+'</span><span class="arbOrigin">'+esc(r.origin||"Online")+'</span></div><h4>'+esc(r.name)+'</h4><div class="arbExitType">'+esc(r.exitType||"Salida no clasificada")+'</div><p>'+esc(r.finding)+'</p><p><b>Logística:</b> '+esc(r.logistics)+'</p><p><b>Qué falta para comprar:</b> '+esc(r.missing)+'</p><div class="arbLinks">'+safeLinks(r.sources)+'</div></article>'
      ).join("")+'</div>'+
      '<div class="arbNoGuarantee"><b>Regla empresarial:</b> '+esc(report.strictPolicy?.reason||"No se promete seguridad absoluta.")+'</div>';
  }
  function copyReport(){
    const rows=filteredRoutes();
    const txt=[
      "ARBITRAJE ONLINE · CARD VAULT",
      report.strictPolicy?.label||"",
      report.summary,
      "Revisión: "+report.checkedAt,
      "eBay: EXCLUIDO",
      ...rows.map(r=>r.name+"\nEstado: "+statusLabel(r.status)+"\nSalida: "+(r.exitType||"")+"\n"+r.finding+"\nFalta: "+r.missing+"\n"+(r.sources||[]).map(s=>s.url).join("\n"))
    ].join("\n\n");
    const status=document.getElementById("arbitrageCopyStatus");
    const fallback=()=>{
      const box=document.createElement("textarea"); box.value=txt; box.style.position="fixed"; box.style.top="0"; box.style.left="0";
      document.body.appendChild(box); box.focus(); box.select(); let ok=false; try{ok=document.execCommand("copy");}catch{}
      if(ok){box.remove();status.textContent="Informe copiado.";}else{status.textContent="Selecciona el texto para copiarlo.";box.style.position="static";document.getElementById("onlineArbitrageContent").prepend(box);}
    };
    if(!navigator.clipboard?.writeText) return fallback();
    navigator.clipboard.writeText(txt).then(()=>status.textContent="Informe copiado.").catch(fallback);
  }
  async function start(){
    try{
      const response=await fetch("online-arbitrage-data.json?v=2.0",{cache:"no-store"});
      if(!response.ok) throw new Error("Informe no disponible");
      report=await response.json();
      if(report.schemaVersion!==2||!Array.isArray(report.routes)||!Array.isArray(report.cases)) throw new Error("Informe inválido");
      ensureToolbar();
      const categories=[...new Set(report.routes.map(r=>r.category))];
      const select=document.getElementById("arbitrageCategory");
      select.innerHTML='<option value="">Todas las categorías</option>'+categories.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join("");
      ["arbitrageCategory","arbitrageStatus","arbitrageOrigin"].forEach(id=>document.getElementById(id)?.addEventListener("change",render));
      const copy=document.getElementById("arbitrageCopy"); copy.disabled=false; copy.addEventListener("click",copyReport);
      render();
    }catch(e){
      const host=document.getElementById("onlineArbitrageContent"); if(host) host.textContent="No se pudo cargar el informe. No hay recomendaciones de compra disponibles.";
    }
    if(location.hash==="#arbitraje") root.CVSimpleNav?.showTab("arbitraje");
  }
  start();
})(typeof globalThis!=="undefined"?globalThis:this);
