(()=>{'use strict';
const $=id=>document.getElementById(id);
const eur=n=>Number(n).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const number=(id)=>{const v=Number($(id)?.value);return Number.isFinite(v)&&v>=0?v:NaN};
function calc(){
 const buy=number('restBuy'),ship=number('restShip'),materials=number('restMaterials'),hours=number('restHours'),hourly=number('restHourly'),exit=number('restExit'),fees=number('restFees'),outship=number('restOutship'),reserve=number('restReserve');
 const result=$('restResult'),link=$('restEvidence').value.trim(),altered=$('restAltered').checked;
 if(!result)return;
 const vals=[buy,ship,materials,hours,hourly,exit,fees,outship,reserve];
 if(vals.some(x=>!Number.isFinite(x))||fees>100){result.textContent='Introduce importes válidos y una comisión entre 0 % y 100 %.';return}
 const cost=buy+ship+materials+hours*hourly+outship+reserve,net=exit*(1-fees/100)-cost,breakEven=cost/(1-fees/100||Infinity);
 const evidence=(()=>{try{const u=new URL(link);return u.protocol==='https:'&&!/(^|\\.)ebay\\./i.test(u.hostname)}catch{return false}})();
 const proof=evidence&&$('restSameVariant').checked&&$('restSaleConfirmed').checked&&$('restBuyerAccepts').checked;
 result.replaceChildren();
 const title=document.createElement('strong');title.textContent=(net>=40&&proof?'CANDIDATA PARA REVISIÓN':'NO COMPRAR CON ESTOS DATOS');result.append(title);
 const p=document.createElement('p');p.textContent='Coste completo '+eur(cost)+' · Salida declarada '+eur(exit)+' · Beneficio neto teórico '+eur(net)+' · Salida mínima para no perder '+eur(breakEven)+'.';result.append(p);
 const msg=document.createElement('p');msg.textContent=proof?'Evidencias DECLARADAS por el usuario, no contrastadas automáticamente. Verificar vigencia de venta comparable y demanda antes de comprar.':'Faltan ventas cerradas comparables y aceptación explícita de restauración; el precio de una carta NM o PSA no acredita la salida.';result.append(msg);
 const note=document.createElement('p');note.textContent=altered?'Tratamiento que altera la carta: vender expresamente como restaurada/alterada y con fotos del antes y después; NO proyectar graduación numérica PSA.':'Conservación no invasiva declarada: documentar técnica y no asegurar nota PSA; informar igualmente de cualquier intervención.';result.append(note);
}
function init(){
 if(!$('restResult'))return;
 const ids=['restBuy','restShip','restMaterials','restHours','restHourly','restExit','restFees','restOutship','restReserve','restEvidence','restSameVariant','restSaleConfirmed','restBuyerAccepts','restAltered'];
 for(const id of ids)$(id)?.addEventListener('input',calc);
 for(const id of ids)$(id)?.addEventListener('change',calc);
 $('restSave')?.addEventListener('click',()=>{
  const values={};for(const id of ids){const e=$(id);values[id]=e.type==='checkbox'?e.checked:e.value}
  values.name=$('restName').value;values.savedAt=new Date().toISOString();
  try{const all=JSON.parse(localStorage.getItem('cv_restoration_cases_v1')||'[]');all.unshift(values);localStorage.setItem('cv_restoration_cases_v1',JSON.stringify(all.slice(0,30)));$('restSaved').textContent='Escenario guardado solo en este dispositivo · '+all.length+' registro(s).';}catch(_){$('restSaved').textContent='No se ha podido guardar el escenario en este navegador.'}
 });
 calc();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();