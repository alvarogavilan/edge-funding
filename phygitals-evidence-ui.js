/* Phygitals · semáforo con evidencia (iPhone). Lee phygitals-evidence-data.json (agregados reales publicados)
 * y el catálogo oficial que ya descarga phygitals.html. No compra, no envía credenciales. */
(()=>{'use strict';
const $=id=>document.getElementById(id),D=window.PhygitalsDetector;
let evidence=null,last=null;
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=text;return x};
const pillClass={'COMPRA YA':'ok','REVISAR':'warn','NO COMPRAR':'bad'};
function card(title,signal,facts,reasons,link){
  const c=el('div','minicard ev-card');const top=el('div','row');top.append(el('strong',null,title),el('span','ev-pill '+pillClass[signal],signal));c.append(top);
  for(const f of facts)c.append(el('p','fine',f));
  if(reasons.length){const d=el('details');d.append(el('summary',null,'Por qué: '+reasons.length+' motivo(s)'));for(const r of reasons)d.append(el('p','fine',r));c.append(d)}
  if(link){const a=el('a',null,'Ver ficha oficial ↗');a.href=link;a.target='_blank';a.rel='noopener noreferrer';c.append(a)}
  return c;
}
function render(){
  const box=$('evidenceSignals');if(!box)return;box.replaceChildren();
  if(!evidence){box.append(el('p','muted','Cargando evidencia…'));return}
  const ctx=last||{};const live=new Map((ctx.packs||[]).map(p=>[p.slug,p]));
  let counts={'COMPRA YA':0,'REVISAR':0,'NO COMPRAR':0};
  const list=evidence.packs.slice().sort((a,b)=>b.n-a.n);
  for(const e of list){
    const p=live.get(e.slug)||null;
    let r;
    if(p)r=D.randomPack(p,e,{usdToEur:ctx.fx,feesEUR:ctx.fees,budgetEUR:ctx.budget});
    else r={signal:'NO COMPRAR',facts:[],reasons:['El catálogo en directo no incluye este pack ahora mismo (o no se ha podido consultar)']};
    if(!p){const pe=D.randomPack({mint_price:e.price_usd,ev:NaN,buyback_percent:e.buyback_percent,in_stock:false,enable:false},e,{usdToEur:ctx.fx||1,feesEUR:0,budgetEUR:50});r.facts=pe.facts;r.reasons=r.reasons.concat(pe.reasons.filter(x=>!/EV|disponible|Precio|cambio|Costes/.test(x)))}
    counts[r.signal]++;
    box.append(card(e.name+' · '+e.price_usd+' $',r.signal,r.facts,r.reasons,'https://www.phygitals.com/claw/'+encodeURIComponent(e.slug)));
  }
  $('evidenceCount').textContent=counts['COMPRA YA']+' COMPRA YA · '+counts['REVISAR']+' REVISAR · '+counts['NO COMPRAR']+' NO COMPRAR';
}
window.addEventListener('phygitals:catalog',ev=>{last=ev.detail;render()});
fetch('phygitals-evidence-data.json?v=1',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(d=>{
  if(!d||!Array.isArray(d.packs))throw Error('formato');evidence=d;
  $('evidenceSource').textContent=d.source_note+' Captura: '+d.generated_at+'.';
  $('evidencePatterns').textContent=d.temporal_patterns_validated.length?('Patrones validados: '+d.temporal_patterns_validated.join('; ')):'Ningún patrón temporal (rachas ni día de la semana) ha superado la validación independiente con corrección de Holm.';
  render();
}).catch(e=>{const b=$('evidenceSignals');if(b)b.textContent='No se pudo cargar la evidencia ('+e.message+'). NO COMPRAR.'});
})();
