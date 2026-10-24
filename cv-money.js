/* Card Vault · cálculo económico canónico (V109).
   Todo el dinero se calcula en CÉNTIMOS ENTEROS. Un único modelo de coste por carta: «lote» (costLot).
   Estados de cada importe: pagado · estimado · desconocido · no-aplica · incluido.
   - desconocido ≠ 0: si falta un gasto, el coste total y el resultado NO se confirman.
   - estimado ≠ pagado: el resultado se muestra solo como estimación.
   - no-aplica / incluido: 0 € a todos los efectos (p. ej. IVA ya incluido en un precio UE), sin volver a sumarlo.
   Venta parcial: el coste del lote se reparte UNA vez entre las unidades originales (reparto exacto al céntimo)
   y cada venta consume su parte; el coste unitario restante no cambia. No descuenta horas ni materiales. */
(()=>{"use strict";
const EXTRAS=["shipping","vat","duty","handling","fxFee"];
const LABEL={shipping:"envío",vat:"IVA de importación",duty:"aranceles",handling:"gestión aduanera",fxFee:"cambio / pago"};
/* Entrada española o numérica → céntimos. Acepta «79», «79,5», «1.234,56», «12.50». Rechaza NaN, Infinity y texto. */
function cents(v){
 if(v==null||v==="")return NaN;
 if(typeof v==="number")return Number.isFinite(v)?Math.round(v*100+(v>=0?1e-7:-1e-7)):NaN;
 let s=String(v).trim().replace(/[\s€]/g,"");
 if(/^-?\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s))s=s.replace(/\./g,"").replace(",",".");
 else if(/^-?\d+,\d{1,2}$/.test(s))s=s.replace(",",".");
 else if(!/^-?\d+(\.\d{1,2})?$/.test(s))return NaN;
 const n=Number(s);return Number.isFinite(n)?Math.round(n*100+(n>=0?1e-7:-1e-7)):NaN;
}
const eur=c=>c==null||!Number.isFinite(c)?null:c/100;
const fmt=c=>c==null||!Number.isFinite(c)?"—":(c/100).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
/* Reparto exacto: los céntimos sobrantes van a las primeras unidades. La suma siempre es el total. */
function allocate(total,n){n=Math.max(1,Math.floor(n));const base=Math.floor(total/n),r=total-base*n;return Array.from({length:n},(_,i)=>base+(i<r?1:0))}
function extra(x){
 if(x==null)return {cents:null,status:"desconocido"};
 const st=String(x.status||"").toLowerCase(),ev={};for(const k of ["ref","date","in","origin","note"])if(x[k])ev[k]=String(x[k]).slice(0,300);
 if(st==="no-aplica"||st==="incluido")return {cents:0,status:st,...ev};
 if(st==="desconocido")return {cents:null,status:"desconocido",...ev};
 const c=x.cents!=null?Math.round(Number(x.cents)):cents(x.eur);
 if(!Number.isFinite(c)||c<0)return {cents:null,status:"desconocido",...ev};
 return {cents:c,status:st==="estimado"?"estimado":st==="pagado"?"pagado":"estimado",...ev};
}
function newLot({qty=1,unitPrice,unitPriceCents,extras={},source="v109",note="",createdAt,priceBasis="precio"}={}){
 const q=Math.max(1,Math.floor(Number(qty)||1)),pu=unitPriceCents!=null?Math.round(unitPriceCents):cents(unitPrice);
 const ex={};for(const k of EXTRAS)ex[k]=extra(extras[k]);
 const priceKnown=Number.isFinite(pu)&&pu>=0,unknown=EXTRAS.filter(k=>ex[k].status==="desconocido");
 const knownCents=(priceKnown?pu*q:0)+EXTRAS.reduce((a,k)=>a+(ex[k].cents||0),0);
 const status=!priceKnown||unknown.length?"desconocido":EXTRAS.some(k=>ex[k].status==="estimado")?"estimado":"pagado";
 const totalCents=status==="desconocido"?null:knownCents;
 return {v:1,qtyOriginal:q,unitPriceCents:priceKnown?pu:null,extras:ex,knownCents,totalCents,status,unknown:unknown.map(k=>LABEL[k]),
  allocation:allocate(knownCents,q),unitsSold:0,source,note,priceBasis,conflicts:[],createdAt:createdAt||(source==="v109"?new Date().toISOString():"")};
}
/* Convierte datos antiguos a lote. Idempotente: si ya hay lote v1, no cambia nada. No inventa gastos que falten. */
function migrateCard(c){
 if(!c||typeof c!=="object")return null;
 if(c.costLot&&c.costLot.v===1){
  const lot=c.costLot;
  // Lotes migrados sin ventas: se recalculan desde los campos antiguos por si se han editado (sigue siendo idempotente).
  if(!(String(lot.source).startsWith("migrado")&&!lot.unitsSold)){
   const pc=c.purchase==null||c.purchase===""?null:cents(Number(c.purchase));
   if(lot.source==="v109"&&lot.priceBasis!=="aterrizado"&&lot.unitPriceCents!=null&&pc!=null&&pc!==lot.unitPriceCents){
    const msg="Precio de compra editado ("+fmt(pc)+") distinto del registrado en la compra ("+fmt(lot.unitPriceCents)+")";
    if(!lot.conflicts.includes(msg))lot.conflicts.push(msg);lot.status="conflicto";
   }
   return lot;
  }
  delete c.costLot;
 }
 if(c.archivedSold&&c.purchase==null)return null;
 const q=Math.max(1,Math.floor(Number(c.quantity)||1)),has=v=>v!=null&&v!==""&&Number.isFinite(Number(v));
 let lot;
 if(c.purchaseCosts&&typeof c.purchaseCosts==="object"){
  const pc=c.purchaseCosts,st=pc.status==="pagados"?"pagado":"estimado",ex={};
  for(const k of EXTRAS){const inc=pc.included&&pc.included[k];ex[k]=inc?{status:"incluido",in:inc.in||"",ref:inc.ref||"",origin:"registrado"}:has(pc[k])?{eur:Number(pc[k]),status:(pc.notApplicable||[]).includes(k)&&Number(pc[k])===0?"no-aplica":st,origin:"registrado"}:null}
  lot=newLot({qty:q,unitPrice:has(c.purchase)?Number(c.purchase):undefined,extras:ex,source:"migrado-v107",note:"Desglose de «He comprado» (V107–V108)."});
 }else if(has(c.landedCostUnit)&&Number(c.landedCostUnit)>0){
  // El coste aterrizado antiguo era precio + envío + comisiones: no demuestra nada sobre IVA, aranceles ni gestión.
  lot=newLot({qty:q,unitPriceCents:cents(Number(c.landedCostUnit)),extras:{shipping:{status:"incluido",in:"coste aterrizado",origin:"registrado"},fxFee:{status:"incluido",in:"coste aterrizado",origin:"registrado"},vat:null,duty:null,handling:null},source:"migrado-aterrizado",priceBasis:"aterrizado",note:"Coste aterrizado por unidad registrado anteriormente (sin desglose fiscal)."});
 }else if(has(c.purchase)){
  // Datos antiguos: envío y comisiones son totales del lote. IVA de importación, aranceles y gestión NO se registraban:
  // su ausencia no demuestra que no apliquen (V110). Quedan desconocidos hasta que el usuario los revise.
  const ex={shipping:has(c.purchaseShipping)?{eur:Number(c.purchaseShipping),status:"pagado",origin:"registrado"}:null,fxFee:has(c.purchaseFees)?{eur:Number(c.purchaseFees),status:"pagado",origin:"registrado"}:null,vat:null,duty:null,handling:null};
  lot=newLot({qty:q,unitPrice:Number(c.purchase),extras:ex,source:"migrado-legado",note:"Compra registrada antes de V109."});
 }else return null;
 if(has(c.landedCostUnit)&&lot.source!=="migrado-aterrizado"&&lot.totalCents!=null){
  const other=cents(Number(c.landedCostUnit))*q;if(Math.abs(other-lot.totalCents)>q){lot.conflicts.push("Coste aterrizado anterior ("+fmt(other)+") distinto del desglose ("+fmt(lot.totalCents)+")");lot.status="conflicto"}
 }
 c.costLot=lot;return lot;
}
function remaining(c){
 const lot=migrateCard(c);const units=Math.max(1,Math.floor(Number(c?.quantity)||1));
 if(!lot)return {cents:null,knownCents:null,units,unitAvg:null,status:"desconocido",lot:null};
 const left=lot.allocation.slice(lot.unitsSold),mismatch=left.length!==units;
 const known=left.reduce((a,b)=>a+b,0),status=mismatch?"conflicto":lot.status;
 const confirmed=status==="pagado"||status==="estimado";
 return {cents:confirmed?known:null,knownCents:known,units,unitAvg:confirmed&&left.length?known/left.length/100:null,status,mismatch,lot};
}
function basisForUnits(c,q){
 const lot=migrateCard(c);q=Math.max(1,Math.floor(Number(q)||1));
 if(!lot)return {cents:null,knownCents:null,status:"desconocido",from:0,to:0};
 const part=lot.allocation.slice(lot.unitsSold,lot.unitsSold+q),known=part.reduce((a,b)=>a+b,0);
 const status=part.length<q?"conflicto":lot.status;
 return {cents:status==="pagado"||status==="estimado"?known:null,knownCents:known,status,from:lot.unitsSold,to:lot.unitsSold+part.length,lotSource:lot.source};
}
function consume(c,q){const lot=migrateCard(c);if(lot)lot.unitsSold=Math.min(lot.qtyOriginal,lot.unitsSold+Math.max(1,Math.floor(q)))}
/* Venta: ingreso neto = bruto − comisiones − envío − otros. Todos en céntimos. */
function saleNet({grossCents,feesCents=0,shippingCents=0,otherCents=0}){return [grossCents,feesCents,shippingCents,otherCents].every(Number.isFinite)?grossCents-feesCents-shippingCents-otherCents:null}
/* Resultado confirmado solo con coste pagado; con coste estimado, solo estimación; desconocido o conflicto: ninguno. */
function result(netCents,basis){
 if(netCents==null||!basis)return {cents:null,estimateCents:null,status:"desconocido"};
 if(basis.status==="pagado"&&basis.cents!=null)return {cents:netCents-basis.cents,estimateCents:null,status:"confirmado"};
 if(basis.status==="estimado"&&basis.cents!=null)return {cents:null,estimateCents:netCents-basis.cents,status:"estimado"};
 return {cents:null,estimateCents:null,status:basis.status||"desconocido"};
}
const STATUS_TXT={revisar:"coste pendiente de revisión: datos fiscales no registrados",legado:"coste registrado antes de V109, sin desglose: pendiente de revisión",pagado:"coste pagado",estimado:"coste estimado (no confirmado)",desconocido:"coste desconocido: faltan gastos",conflicto:"datos de coste en conflicto"};
/* V110 · reparación de lotes migrados por V109 que tienen ventas (los no vendidos se recalculan solos).
   V109 marcó IVA, aranceles y gestión como «no aplica» sin evidencia. Se marcan como desconocidos y el lote como
   «revisar»; se conservan reparto, unidades vendidas e importes, y las ventas afectadas guardan su cálculo anterior
   como antecedente. Idempotente: identificador de reparación único. */
const REPAIR="v110-fiscal-inferido";
function repairState(st){
 let changed=false;const touched=new Set();
 for(const c of (st&&st.cards)||[]){
  const lot=c&&c.costLot;
  if(lot&&lot.v===1&&String(lot.source).startsWith("migrado")&&!lot.unitsSold){const before=JSON.stringify(lot);delete c.costLot;migrateCard(c);if(JSON.stringify(c.costLot)!==before)changed=true;continue}
  if(!lot||lot.v!==1||!(lot.source==="migrado-legado"||lot.source==="migrado-aterrizado")||!lot.unitsSold)continue;
  if((lot.reviews||[]).some(r=>r.id===REPAIR)){touched.add(c.id);continue}
  const inferred=["vat","duty","handling"].filter(k=>lot.extras[k]&&(lot.extras[k].status==="no-aplica"||lot.extras[k].status==="incluido")&&lot.extras[k].origin!=="usuario");
  if(!inferred.length)continue;
  const prev={status:lot.status,totalCents:lot.totalCents,extras:JSON.parse(JSON.stringify(lot.extras))};
  for(const k of inferred)lot.extras[k]={cents:null,status:"desconocido",origin:"inferido-v109",note:"V109 lo dio por «"+prev.extras[k].status+"» sin datos"};
  lot.totalCents=null;lot.status="revisar";lot.unknown=EXTRAS.filter(k=>lot.extras[k].status==="desconocido").map(k=>LABEL[k]);
  (lot.reviews=lot.reviews||[]).push({id:REPAIR,at:new Date().toISOString(),reason:"IVA, aranceles o gestión inferidos sin evidencia por la migración V109",previous:prev});
  touched.add(c.id);changed=true;
 }
 for(const h of (st&&st.saleHistory)||[]){
  if(!h||!touched.has(h.cardId)||!(h.basisStatus==="pagado"||h.basisStatus==="estimado"))continue;
  if((h.basisHistory||[]).some(x=>x.id===REPAIR))continue;
  (h.basisHistory=h.basisHistory||[]).push({id:REPAIR,at:new Date().toISOString(),basisStatus:h.basisStatus,basisCents:h.basisCents,resultCents:h.resultCents??null,resultEstimateCents:h.resultEstimateCents??null,reason:"Coste calculado con datos fiscales inferidos (V109). Se conserva como antecedente."});
  h.basisStatus="revisar";h.resultCents=null;h.resultEstimateCents=null;h.resultStatus="revisar";h.basisUnknown=true;changed=true;
  const r=((st.investmentLedger)||[]).find(x=>x.id===h.id);if(r)r.basisUnknown=true;
 }
 return {changed};
}
/* Revisión de coste por el usuario (V110). Recalcula el lote con CVMoney, conserva el anterior en el historial y
   reparte el nuevo total entre las unidades ORIGINALES. Devuelve el ajuste de las unidades ya vendidas para que
   las ventas afectadas actualicen su coste (con su antecedente). */
function reviseLot(c,input,meta={}){
 const old=migrateCard(c);if(!old)throw new Error("Sin datos de compra");
 const q=old.qtyOriginal,unitsSold=old.unitsSold||0,ex={};
 for(const k of EXTRAS){const x=input.extras&&input.extras[k];ex[k]=x?{...x,origin:"usuario",date:meta.date||x.date,ref:meta.ref||x.ref}:old.extras[k]&&old.extras[k].status!=="desconocido"?{cents:old.extras[k].cents,status:old.extras[k].status,origin:old.extras[k].origin||"registrado",ref:old.extras[k].ref,in:old.extras[k].in}:null}
 const lot=newLot({qty:q,unitPriceCents:input.unitPriceCents!=null?input.unitPriceCents:old.unitPriceCents,extras:ex,source:"v109",note:"Coste revisado por el usuario",createdAt:old.createdAt,priceBasis:old.priceBasis||(old.source==="migrado-aterrizado"?"aterrizado":"precio")});
 lot.unitsSold=unitsSold;lot.reviews=[...(old.reviews||[]),{id:"usuario-"+Date.now().toString(36),at:new Date().toISOString(),by:"usuario",ref:meta.ref||"",date:meta.date||"",shipOrigin:meta.shipOrigin||"",previous:{status:old.status,totalCents:old.totalCents,knownCents:old.knownCents,extras:old.extras,allocation:old.allocation}}];
 const soldBefore=old.allocation.slice(0,unitsSold),soldAfter=lot.allocation.slice(0,unitsSold);
 return {lot,unitsSold,soldBefore,soldAfter};
}
function applySaleBasis(h,basisCents,status,reason){
 (h.basisHistory=h.basisHistory||[]).push({id:"rev-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),at:new Date().toISOString(),basisStatus:h.basisStatus||"",basisCents:h.basisCents??null,resultCents:h.resultCents??null,reason});
 h.basisCents=status==="pagado"||status==="estimado"?basisCents:null;h.basisKnownCents=basisCents;h.basisStatus=status;h.basis=h.basisCents==null?null:h.basisCents/100;
 h.landedCostUnit=h.basisCents==null?null:h.basisCents/Math.max(1,Number(h.qty)||1)/100;
 const net=h.net==null?null:cents(Number(h.net)),r=result(net,{cents:h.basisCents,status});h.resultCents=r.cents;h.resultEstimateCents=r.estimateCents;h.resultStatus=r.status;h.basisUnknown=status!=="pagado";
}
window.CVMoney={cents,eur,fmt,allocate,newLot,migrateCard,remaining,basisForUnits,consume,saleNet,result,repairState,reviseLot,applySaleBasis,REPAIR,EXTRAS,LABEL,STATUS_TXT};

/* Graduación: empresa y nota separadas del estado físico. Vacío = sin confirmar (no RAW). «NM» es un estado, no una nota. */
const COMPANIES=["PSA","BGS","CGC","SGC","ACE","TAG","AP"];
function parse(v){
 const s=String(v??"").trim().toUpperCase().replace(/\s+/g," ");
 if(!s)return {company:"",grade:"",complete:false,raw:false,label:"Graduación sin confirmar"};
 if(s==="RAW"||s==="SIN GRADUAR")return {company:"RAW",grade:"",complete:true,raw:true,label:"Sin graduar (RAW)"};
 const m=s.match(/^([A-Z]+)\s*(\d{1,2}(?:[.,]\d)?)?$/);
 if(m&&COMPANIES.includes(m[1])){const g=(m[2]||"").replace(",",".");return {company:m[1],grade:g,complete:!!g,raw:false,label:m[1]+(g?" "+g.replace(".",","):" · nota sin confirmar")}}
 return {company:"",grade:"",complete:false,raw:false,label:"No es una graduación reconocida («"+String(v).trim()+"»)"};
}
function ofCard(c){const g=String(c?.grading||"").trim();if(!g)return parse("");if(g.toUpperCase()==="RAW")return parse("RAW");return parse(g+" "+String(c?.grade||"").trim())}
window.CVGrade={parse,ofCard};
})();
/* Copias completas (V109): validación sin mutar y fusión no destructiva por identificador. */
(()=>{"use strict";
const BAD=new Set(["__proto__","constructor","prototype"]);
function dangerous(o,depth=0){if(depth>40)return "demasiado anidada";if(o&&typeof o==="object"){for(const k of Object.keys(o)){if(BAD.has(k))return "clave peligrosa «"+k+"»";const r=dangerous(o[k],depth+1);if(r)return r}}return ""}
function validate(x){
 if(!x||typeof x!=="object"||Array.isArray(x))throw new Error("formato desconocido");
 const d=dangerous(x);if(d)throw new Error(d);
 const s=x.format==="cardvault-backup"?x.state:x;
 if(!s||typeof s!=="object"||!Array.isArray(s.cards))throw new Error("no contiene una colección (cards)");
 for(const k of ["saleHistory","investmentLedger","sealedProducts"])if(s[k]!=null&&!Array.isArray(s[k]))throw new Error("«"+k+"» no es una lista");
 for(const c of s.cards)if(!c||typeof c!=="object"||!c.id)throw new Error("hay cartas sin identificador");
 if(x.photos!=null&&(typeof x.photos!=="object"||Array.isArray(x.photos)))throw new Error("fotos con formato no válido");
 if(x.photos)for(const v of Object.values(x.photos))if(typeof v!=="string"||!/^data:image\//.test(v))throw new Error("foto con formato no válido");
 if(x.vault!=null){if(typeof x.vault!=="object"||Array.isArray(x.vault)||(x.vault.user!=null&&typeof x.vault.user!=="object"))throw new Error("bloque de oportunidades no válido");for(const v of Object.values(x.vault.photos||{}))if(typeof v!=="string"||!/^data:image\//.test(v))throw new Error("foto de anuncio con formato no válido")}
 if(x.marketSignals!=null&&!Array.isArray(x.marketSignals))throw new Error("señales de mercado no válidas");
 return {state:s,photos:x.photos||{},marketSignals:Array.isArray(x.marketSignals)?x.marketSignals:[],vault:x.vault&&typeof x.vault==="object"?x.vault:null,version:x.version||0,blocks:{estado:true,fotos:Object.keys(x.photos||{}).length,oportunidades:!!x.vault,senales:Array.isArray(x.marketSignals)?x.marketSignals.length:0}};
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function mergeList(local=[],incoming=[],extraKey){
 const out=local.slice(),byId=new Map(out.map(x=>[x?.id,x])),seen=new Set(extraKey?out.map(extraKey).filter(Boolean):[]);let added=0;const conflicts=[];
 for(const it of incoming){if(!it||typeof it!=="object")continue;
  if(it.id!=null&&byId.has(it.id)){if(!same(byId.get(it.id),it))conflicts.push(it.name||it.id);continue}
  const ek=extraKey&&extraKey(it);if(ek&&seen.has(ek)){conflicts.push((it.name||it.id)+" (operación ya registrada)");continue}
  out.push(it);if(it.id!=null)byId.set(it.id,it);if(ek)seen.add(ek);added++}
 return {list:out,added,conflicts};
}
function mergeState(local,incoming){
 const next=JSON.parse(JSON.stringify(local)),rep={cards:0,saleHistory:0,investmentLedger:0,other:0,conflicts:[]};
 const saleKey=h=>h&&h.saleOrder?String(h.channel||"")+"|"+String(h.saleOrder):"";
 for(const k of Object.keys(incoming)){
  const iv=incoming[k],lv=next[k];
  if(Array.isArray(iv)){const r=mergeList(Array.isArray(lv)?lv:[],iv,k==="saleHistory"?saleKey:null);next[k]=r.list;if(k in rep)rep[k]+=r.added;else rep.other+=r.added;rep.conflicts.push(...r.conflicts.map(n=>k+": "+n))}
  else if(lv===undefined){next[k]=iv;rep.other++}
  else if(!same(lv,iv)&&iv&&typeof iv==="object"&&!Array.isArray(iv)&&lv&&typeof lv==="object"){for(const kk of Object.keys(iv))if(!(kk in lv)){lv[kk]=iv[kk]}}
 }
 return {next,rep};
}
window.CVBackup={validate,mergeState,dangerous};
})();
