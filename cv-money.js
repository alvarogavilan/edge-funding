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
 const st=String(x.status||"").toLowerCase();
 if(st==="no-aplica"||st==="incluido")return {cents:0,status:st};
 const c=x.cents!=null?Math.round(Number(x.cents)):cents(x.eur);
 if(!Number.isFinite(c)||c<0)return {cents:null,status:"desconocido"};
 return {cents:c,status:st==="estimado"?"estimado":st==="pagado"?"pagado":"estimado"};
}
function newLot({qty=1,unitPrice,unitPriceCents,extras={},source="v109",note="",createdAt}={}){
 const q=Math.max(1,Math.floor(Number(qty)||1)),pu=unitPriceCents!=null?Math.round(unitPriceCents):cents(unitPrice);
 const ex={};for(const k of EXTRAS)ex[k]=extra(extras[k]);
 const priceKnown=Number.isFinite(pu)&&pu>=0,unknown=EXTRAS.filter(k=>ex[k].status==="desconocido");
 const knownCents=(priceKnown?pu*q:0)+EXTRAS.reduce((a,k)=>a+(ex[k].cents||0),0);
 const status=!priceKnown||unknown.length?"desconocido":EXTRAS.some(k=>ex[k].status==="estimado")?"estimado":"pagado";
 const totalCents=status==="desconocido"?null:knownCents;
 return {v:1,qtyOriginal:q,unitPriceCents:priceKnown?pu:null,extras:ex,knownCents,totalCents,status,unknown:unknown.map(k=>LABEL[k]),
  allocation:allocate(knownCents,q),unitsSold:0,source,note,conflicts:[],createdAt:createdAt||(source==="v109"?new Date().toISOString():"")};
}
/* Convierte datos antiguos a lote. Idempotente: si ya hay lote v1, no cambia nada. No inventa gastos que falten. */
function migrateCard(c){
 if(!c||typeof c!=="object")return null;
 if(c.costLot&&c.costLot.v===1){
  const lot=c.costLot;
  // Lotes migrados sin ventas: se recalculan desde los campos antiguos por si se han editado (sigue siendo idempotente).
  if(!(String(lot.source).startsWith("migrado")&&!lot.unitsSold)){
   const pc=c.purchase==null||c.purchase===""?null:cents(Number(c.purchase));
   if(lot.source==="v109"&&lot.unitPriceCents!=null&&pc!=null&&pc!==lot.unitPriceCents){
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
  for(const k of EXTRAS)ex[k]=has(pc[k])?{eur:Number(pc[k]),status:(pc.notApplicable||[]).includes(k)&&Number(pc[k])===0?"no-aplica":st}:null;
  lot=newLot({qty:q,unitPrice:has(c.purchase)?Number(c.purchase):undefined,extras:ex,source:"migrado-v107",note:"Desglose de «He comprado» (V107–V108)."});
 }else if(has(c.landedCostUnit)&&Number(c.landedCostUnit)>0){
  lot=newLot({qty:q,unitPriceCents:cents(Number(c.landedCostUnit)),extras:{shipping:{status:"incluido"},vat:{status:"incluido"},duty:{status:"incluido"},handling:{status:"incluido"},fxFee:{status:"incluido"}},source:"migrado-aterrizado",note:"Coste aterrizado por unidad registrado anteriormente."});
 }else if(has(c.purchase)){
  const ex={shipping:has(c.purchaseShipping)?{eur:Number(c.purchaseShipping),status:"pagado"}:null,fxFee:has(c.purchaseFees)?{eur:Number(c.purchaseFees),status:"pagado"}:null,vat:{status:"no-aplica"},duty:{status:"no-aplica"},handling:{status:"no-aplica"}};
  // Datos antiguos: envío y comisiones son totales del lote. Si no se registraron, quedan desconocidos.
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
const STATUS_TXT={pagado:"coste pagado",estimado:"coste estimado (no confirmado)",desconocido:"coste desconocido: faltan gastos",conflicto:"datos de coste en conflicto"};
window.CVMoney={cents,eur,fmt,allocate,newLot,migrateCard,remaining,basisForUnits,consume,saleNet,result,EXTRAS,LABEL,STATUS_TXT};

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
 return {state:s,photos:x.photos||{},marketSignals:Array.isArray(x.marketSignals)?x.marketSignals:[],vault:x.vault&&typeof x.vault==="object"?x.vault:null,version:x.version||0};
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
