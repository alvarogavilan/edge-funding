(function (root) {
  "use strict";
  const costKeys = ["purchaseCents", "shippingCents", "feesCents", "withdrawalCents", "taxesCents", "contingencyCents"];
  function allowedUrl(value) {
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password &&
        !/(^|\.)ebay\.[a-z.]+$/i.test(u.hostname);
    } catch { return false; }
  }
  function evaluate(record, now = Date.now()) {
    const r = record || {}, reasons = [];
    const monetary = [...costKeys, "saleCents"].every(k => Number.isSafeInteger(r[k]) && r[k] >= 0);
    const total = monetary ? costKeys.reduce((sum, k) => sum + r[k], 0) : null;
    const net = monetary && Number.isSafeInteger(total) ? r.saleCents - total : null;
    if (!monetary || !Number.isSafeInteger(total)) reasons.push("Faltan importes o costes válidos.");
    if (!(r.purchaseCents > 0)) reasons.push("Falta precio de compra.");
    if (!(net > 0)) reasons.push("No hay margen neto positivo demostrado.");
    const checks = [
      ["sameUnitVerified", "Modelo, estado y accesorios no coinciden o no están verificados."],
      ["stockVerified", "Disponibilidad sin verificar."],
      ["spainAllowed", "Compra y venta desde España sin verificar."],
      ["homeLogisticsVerified", "Logística desde casa sin verificar."],
      ["cashWithdrawalVerified", "Salida a dinero sin verificar."],
      ["bindingExitVerified", "Falta comprador con oferta vinculante para esta unidad."],
      ["inspectionResolved", "La recompra todavía depende de inspección."],
      ["nonPromoVerified", "Operación estructural sin promociones sin verificar."],
      ["costsComplete", "Costes completos sin verificar."],
      ["accountEligibleVerified", "Elegibilidad de cuenta y condiciones sin verificar."]
    ];
    for (const [key, message] of checks) if (r[key] !== true) reasons.push(message);
    if (!allowedUrl(r.buyUrl) || !allowedUrl(r.exitUrl)) reasons.push("Enlaces inválidos o mercado excluido.");
    if (!Array.isArray(r.evidenceUrls) || r.evidenceUrls.length < 2 || !r.evidenceUrls.every(allowedUrl)) reasons.push("Faltan fuentes de compra y salida.");
    const checked = Date.parse(r.checkedAt), expiry = Date.parse(r.quoteExpiresAt);
    if (!Number.isFinite(checked) || checked > now || now - checked > 86400000) reasons.push("Precios pendientes de revalidación.");
    if (!Number.isFinite(expiry) || expiry <= now) reasons.push("Oferta de salida caducada o sin plazo.");
    return {status: reasons.length ? "BLOCKED" : "HUMAN_REVIEW", netCents: net,
      reasons, guaranteed: false, autoPurchase: false, humanReviewRequired: true};
  }
  const api = {evaluate, allowedUrl};
  if (typeof module === "object" && module.exports) module.exports = api;
  if (!root.document) return;
  root.CVOnlineArbitrage = api;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = value => new Intl.NumberFormat("es-ES", {style:"currency", currency:"EUR"}).format(value);
  let report;
  function links(sources) {
    return sources.filter(s => allowedUrl(s.url)).map(s => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.label) + '</a>').join("");
  }
  function render() {
    const host = document.getElementById("onlineArbitrageContent");
    if (!host || !report) return;
    const filter = document.getElementById("arbitrageCategory")?.value || "";
    const routes = report.routes.filter(r => !filter || r.category === filter);
    const date = new Date(report.checkedAt).toLocaleString("es-ES", {timeZone:"Europe/Madrid"});
    const stale = Date.now() - Date.parse(report.checkedAt) > 86400000;
    host.innerHTML = '<div class="arbSummary"><strong>0 compras con beneficio cerrado demostradas</strong><p>' + esc(report.summary) +
      '</p><small>Revisión: ' + esc(date) + ' · España · sin eBay ni promociones</small><p class="arbFreshness">' +
      (stale ? "Precios pendientes de revalidación. " : "Precios observados en la fecha de revisión. ") +
      'Este informe no se actualiza automáticamente.</p></div>' +
      '<h3>Compra investigada y descartada</h3>' + report.cases.map(c => '<article class="arbCase"><span class="arbBadge">NO COMPRAR PARA REVENTA</span><h4>' + esc(c.name) +
      '</h4><dl><div><dt>Compra observada</dt><dd>' + money(c.buyPriceEUR) + '</dd></div><div><dt>Máximo de recompra publicado</dt><dd>' +
      money(c.exitCeilingEUR) + '</dd></div><div><dt>Diferencia antes de costes</dt><dd>' + money(c.ceilingDifferenceEUR) +
      '</dd></div></dl><p>' + esc(c.buyCondition) + '</p><p>' + esc(c.exitCondition) + '</p><p>' + esc(c.finding) +
      '</p><div class="arbLinks">' + links([{label:"Ficha de compra investigada",url:c.buyUrl},{label:"Referencia de recompra",url:c.exitUrl}]) + '</div></article>').join("") +
      '<h3>Rutas investigadas · ' + routes.length + '</h3><div class="arbRoutes">' + routes.map(r =>
      '<article class="arbRoute"><span class="arbBadge">' + (r.status === "excluded" ? "DESCARTADA PARA BENEFICIO CERRADO" : "RECOMPRA CONDICIONADA") +
      '</span><h4>' + esc(r.name) + '</h4><p>' + esc(r.finding) + '</p><p><b>Logística:</b> ' + esc(r.logistics) +
      '</p><p><b>Por qué no comprar aún:</b> ' + esc(r.missing) + '</p><div class="arbLinks">' + links(r.sources) + '</div></article>').join("") + '</div>';
  }
  function copyReport() {
    const text = ["ARBITRAJE ONLINE · ESPAÑA", report.summary, "Revisión: " + report.checkedAt, ...report.routes.map(r => r.name + ": " + r.finding + "\n" + r.sources.map(s => s.url).join("\n"))].join("\n\n");
    const status = document.getElementById("arbitrageCopyStatus");
    if (!navigator.clipboard?.writeText) return fallback();
    navigator.clipboard.writeText(text).then(() => status.textContent = "Informe copiado.").catch(fallback);
    function fallback() {
      const box = document.createElement("textarea"); box.value = text;
      box.style.position = "fixed"; box.style.top = "0"; box.style.left = "0"; box.setAttribute("aria-label", "Informe para copiar");
      document.body.appendChild(box); box.focus(); box.select();
      let ok = false; try {ok = document.execCommand("copy");} catch {}
      if (ok) {box.remove(); status.textContent = "Informe copiado.";}
      else {status.textContent = "Selecciona el texto del informe para copiarlo."; box.style.position = "static"; document.getElementById("onlineArbitrageContent").prepend(box);}
    }
  }
  async function start() {
    try {
      const response = await fetch("online-arbitrage-data.json?v=1.0", {cache:"no-store"});
      if (!response.ok) throw new Error("Informe no disponible");
      report = await response.json();
      if (report.schemaVersion !== 1 || !Array.isArray(report.routes) || !Array.isArray(report.cases)) throw new Error("Informe inválido");
      const categories = [...new Set(report.routes.map(r => r.category))];
      const select = document.getElementById("arbitrageCategory");
      select.innerHTML = '<option value="">Todas las categorías</option>' + categories.map(c => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join("");
      select.addEventListener("change", render);
      document.getElementById("arbitrageCopy").disabled = false;
      document.getElementById("arbitrageCopy").addEventListener("click", copyReport);
      render();
    } catch {
      document.getElementById("onlineArbitrageContent").textContent = "No se pudo cargar el informe. No hay recomendaciones de compra disponibles.";
    }
    if (location.hash === "#arbitraje") root.CVSimpleNav?.showTab("arbitraje");
  }
  start();
})(typeof globalThis !== "undefined" ? globalThis : this);
