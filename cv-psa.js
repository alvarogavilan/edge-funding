/* Card Vault V117 · PSA desde 41020 Sevilla.
   Pestaña «PSA»: ¿merece la pena graduar? (coste PSA Europa + envíos frente a venta graduada), dónde comprar PSA
   oficiales en España/UE y verificación del certificado. Pestaña «Valorar PSA»: valoración orientativa con fotos
   (centrado medido, blanqueo de esquinas y bordes detectado en la foto y comprobación guiada), nota probable y
   recomendación. Nada sustituye a PSA: es una estimación para decidir si enviar.
   Fuentes de criterios: PSA 10 exige ~55/45 de centrado frontal y 75/25 trasero (bien documentado); los umbrales
   de 9 a 3 varían entre guías y se muestran como aproximados. PSA no gradúa cartas restauradas, recortadas o alteradas.
   Tarifas PSA Frankfurt (oct. 2026, lanzamiento): Standard 49,99 € (lista 59,99), Priority 69,99 € (lista 79,99),
   Express 199 €; devolución en la UE aún no publicada por PSA → estimación editable. */
(()=>{"use strict";
const E=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const N=v=>{const n=Number(String(v??"").replace(",","."));return Number.isFinite(n)?n:NaN};
const EUR=v=>Number.isFinite(v)?v.toLocaleString("es-ES",{style:"currency",currency:"EUR"}):"—";
const SIGNED=v=>Number.isFinite(v)?(v>=0?"+":"−")+EUR(Math.abs(v)):"—";
const readLS=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k)||"null");return x??d}catch{return d}};
const writeLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const HKEY="cv_v117_pregrade",CKEY="cv_v117_psacalc";
const SERVICES=[["std",'Standard · 49,99 € (lanzamiento; lista 59,99 €) · 80–90 días hábiles',49.99],["std-list","Standard · tarifa de lista 59,99 €",59.99],["prio","Priority · 69,99 € (lanzamiento; lista 79,99 €)",69.99],["exp","Express · 199 €",199],["custom","Otra cantidad",NaN]];

/* =================== VALORAR PSA (fotos) =================== */
const PH={front:null,back:null};          // {img, w, h, data, lines:{ol,or,ot,ob,il,ir,it,ib}, q:{...}}
let gradeState={card:"",answers:{},auto:{},result:null};
const Q=[
 ["corners","Esquinas",[[10,"Perfectas: afiladas y sin blanco"],[9,"Mínimo desgaste en una (solo con lupa)"],[8,"Ligero blanco o desgaste en varias"],[6,"Desgaste visible o ligeramente redondeadas"],[4,"Redondeadas o dañadas"]]],
 ["edges","Bordes",[[10,"Perfectos"],[9,"Un punto mínimo de blanco"],[8,"Ligero blanco en varios puntos"],[6,"Blanco visible o pequeñas muescas"],[4,"Muescas o desgaste fuerte"]]],
 ["surface","Superficie (mírala con luz rasante)",[[10,"Impecable: sin arañazos, puntos ni líneas"],[9,"Un punto de impresión o marca mínima"],[8,"Arañazos muy leves o líneas de impresión a contraluz"],[6,"Arañazos visibles o pérdida de brillo"],[4,"Manchas, abolladuras o marcas fuertes"]]],
 ["crease","Dobleces o arrugas",[[10,"Ninguna"],[5,"Arruga muy leve (solo a contraluz)"],[3,"Doblez visible"]]],
 ["altered","¿Restaurada, limpiada con producto, prensada, recortada o alterada?",[[10,"No"],[0,"Sí o no lo sé"]]]
];
function centeringCap(r,side){/* r = peor lado / total (0,5 = perfecto) */
 const p=r*100;if(!Number.isFinite(p))return NaN;
 if(side==="front")return p<=55?10:p<=60?9:p<=65?8:p<=70?7:p<=75?6:p<=80?5:p<=85?4:p<=90?3:2;
 return p<=75?10:p<=90?9:5;
}
const ratioTxt=r=>Number.isFinite(r)?Math.round(r*100)+"/"+Math.round(100-r*100):"—";
function loadImage(file){return new Promise((ok,ko)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{ok(im);setTimeout(()=>URL.revokeObjectURL(u),2000)};im.onerror=()=>ko(new Error("No se pudo leer la foto"));im.src=u})}
function toCanvas(img,max=1000){const s=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.round(img.naturalWidth*s),h=Math.round(img.naturalHeight*s),c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(img,0,0,w,h);return {c,w,h,data:x.getImageData(0,0,w,h).data,srcW:img.naturalWidth}}
const lum=(d,i)=>.299*d[i]+.587*d[i+1]+.114*d[i+2];
/* Perfil de gradiente: media de |Δluminancia| a lo largo de una banda central. */
function profile(P,axis){
 const {w,h,data}=P,out=new Float32Array(axis==="x"?w:h);
 if(axis==="x"){const y0=Math.round(h*.3),y1=Math.round(h*.7);for(let x=1;x<w-1;x++){let s=0;for(let y=y0;y<y1;y+=2){const i=(y*w+x)*4;s+=Math.abs(lum(data,i+4)-lum(data,i-4))}out[x]=s/((y1-y0)/2)}}
 else{const x0=Math.round(w*.3),x1=Math.round(w*.7);for(let y=1;y<h-1;y++){let s=0;for(let x=x0;x<x1;x+=2){const i=(y*w+x)*4;s+=Math.abs(lum(data,i+w*4)-lum(data,i-w*4))}out[y]=s/((x1-x0)/2)}}
 return out;
}
function peak(arr,from,to,step){/* primer pico fuerte desde «from» hacia «to» */
 let mx=0,mean=0,n=0;for(let i=Math.min(from,to);i<=Math.max(from,to);i++){mean+=arr[i]||0;n++;mx=Math.max(mx,arr[i]||0)}mean/=n||1;
 const th=mean+(mx-mean)*.45;let best=-1,bv=0;
 for(let i=from;step>0?i<=to:i>=to;i+=step){if((arr[i]||0)>=th){/* afina al máximo local */let j=i,v=arr[i];for(let k=1;k<6;k++){const q=i+k*step;if((arr[q]||0)>v){v=arr[q];j=q}}best=j;bv=v;break}}
 return best;
}
/* Detección automática: borde exterior de la carta (fondo → carta) y marco interior (borde → ilustración). Se puede corregir arrastrando. */
function detect(P){
 const px=profile(P,"x"),py=profile(P,"y"),{w,h}=P;
 const ol=peak(px,2,Math.round(w*.35),1),or=peak(px,w-3,Math.round(w*.65),-1),ot=peak(py,2,Math.round(h*.35),1),ob=peak(py,h-3,Math.round(h*.65),-1);
 const L=ol>0?ol:Math.round(w*.04),R=or>0?or:Math.round(w*.96),T=ot>0?ot:Math.round(h*.04),B=ob>0?ob:Math.round(h*.96),cw=R-L,ch=B-T;
 const il=peak(px,L+Math.round(cw*.02)+3,L+Math.round(cw*.16),1),ir=peak(px,R-Math.round(cw*.02)-3,R-Math.round(cw*.16),-1);
 const it=peak(py,T+Math.round(ch*.02)+3,T+Math.round(ch*.14),1),ib=peak(py,B-Math.round(ch*.02)-3,B-Math.round(ch*.14),-1);
 return {ol:L,or:R,ot:T,ob:B,il:il>0?il:L+Math.round(cw*.06),ir:ir>0?ir:R-Math.round(cw*.06),it:it>0?it:T+Math.round(ch*.06),ib:ib>0?ib:B-Math.round(ch*.06),auto:{outer:ol>0&&or>0&&ot>0&&ob>0,inner:il>0&&ir>0&&it>0&&ib>0}};
}
function centering(L){const l=L.il-L.ol,r=L.or-L.ir,t=L.it-L.ot,b=L.ob-L.ib;if(!(l>0&&r>0&&t>0&&b>0))return null;return {lr:Math.max(l,r)/(l+r),tb:Math.max(t,b)/(t+b),l,r,t,b}}
/* Calidad de la foto: resolución útil de la carta, nitidez (varianza del laplaciano) y brillos quemados. */
function quality(P,L){
 const {w,data}=P,cw=L.or-L.ol,warn=[];if(cw*(P.srcW/w)<700)warn.push("Resolución baja: acércate o usa la cámara principal");
 let s=0,s2=0,n=0,burn=0,tot=0;for(let y=L.ot+4;y<L.ob-4;y+=3)for(let x=L.ol+4;x<L.or-4;x+=3){const i=(y*w+x)*4,v=4*lum(data,i)-lum(data,i-4)-lum(data,i+4)-lum(data,i-w*4)-lum(data,i+w*4);s+=v;s2+=v*v;n++;if(lum(data,i)>248)burn++;tot++}
 const varL=n?s2/n-(s/n)**2:0;if(varL<60)warn.push("Foto poco nítida: enfoca tocando la carta y sujeta el móvil firme");
 if(tot&&burn/tot>.02)warn.push("Reflejos o brillos: usa luz difusa y evita el flash");
 return {warn,sharp:Math.round(varL)};
}
/* Blanqueo: píxeles claros y poco saturados en las franjas pegadas al borde exterior (en el reverso azul se ve muy bien). */
function whitening(P,L){
 const {w,data}=P,cw=L.or-L.ol,ch=L.ob-L.ot,band=Math.max(3,Math.round(cw*.025)),cs=Math.round(cw*.07);
 const isWhite=i=>{const r=data[i],g=data[i+1],b=data[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);return mx>200&&mx-mn<40};
 const frac=(x0,y0,x1,y1)=>{let c=0,t=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){if(x<0||y<0||x>=w||y>=P.h)continue;t++;if(isWhite((y*w+x)*4))c++}return t?c/t:0};
 const o=L,inset=2;
 const corners={tl:Math.max(frac(o.ol+inset,o.ot+inset,o.ol+cs,o.ot+band),frac(o.ol+inset,o.ot+inset,o.ol+band,o.ot+cs)),tr:Math.max(frac(o.or-cs,o.ot+inset,o.or-inset,o.ot+band),frac(o.or-band,o.ot+inset,o.or-inset,o.ot+cs)),
  bl:Math.max(frac(o.ol+inset,o.ob-band,o.ol+cs,o.ob-inset),frac(o.ol+inset,o.ob-cs,o.ol+band,o.ob-inset)),br:Math.max(frac(o.or-cs,o.ob-band,o.or-inset,o.ob-inset),frac(o.or-band,o.ob-cs,o.or-inset,o.ob-inset))};
 const edges={top:frac(o.ol+cs,o.ot+inset,o.or-cs,o.ot+band),bottom:frac(o.ol+cs,o.ob-band,o.or-cs,o.ob-inset),left:frac(o.ol+inset,o.ot+cs,o.ol+band,o.ob-cs),right:frac(o.or-band,o.ot+cs,o.or-inset,o.ob-cs)};
 return {corners,edges,maxC:Math.max(...Object.values(corners)),maxE:Math.max(...Object.values(edges)),ch};
}
const capFromWhite=f=>f<.004?10:f<.015?9:f<.04?8:f<.09?6:4;
function suggest(){/* sugiere respuestas a partir del reverso (o del frontal si no hay reverso) */
 const P=PH.back||PH.front;if(!P)return;const wv=whitening(P,P.lines);P.white=wv;
 /* solo rellena (o actualiza) lo que no hayas elegido tú */
 for(const [k,v] of [["corners",capFromWhite(wv.maxC)],["edges",capFromWhite(wv.maxE)]])if(gradeState.answers[k]==null||gradeState.auto[k]){gradeState.answers[k]=String(v);gradeState.auto[k]=true}
}
function compute(){
 const a=gradeState.answers,caps=[],why=[];
 for(const side of ["front","back"]){const P=PH[side];if(!P)continue;const c=centering(P.lines);if(!c){why.push("Centrado "+(side==="front"?"frontal":"trasero")+": ajusta las líneas");continue}
  const worst=Math.max(c.lr,c.tb),cap=centeringCap(worst,side);caps.push(cap);why.push("Centrado "+(side==="front"?"frontal":"trasero")+" "+ratioTxt(c.lr)+" (izq./dcha.) y "+ratioTxt(c.tb)+" (arriba/abajo) → máx. PSA "+cap)}
 for(const [k,label] of Q){const v=a[k];if(v==null)continue;const n=Number(v);if(k==="altered"&&n===0)return {invalid:true,why:["PSA no gradúa cartas restauradas, recortadas o alteradas (las devuelve como «Altered»). No la envíes."]};
  if(k!=="altered"){caps.push(n);if(n<10)why.push(label+" → máx. PSA "+n)}}
 if(!caps.length)return null;
 const g=Math.max(1,Math.min(...caps)),missing=Q.filter(([k])=>a[k]==null).map(q=>q[1]);
 /* PSA suele ser más estricta que una foto: la nota probable es el tope y hay riesgo de un punto menos. */
 const dist=g>=10?{10:.4,9:.42,8:.18}:{[g]:.55,[g-1]:.33,[Math.max(1,g-2)]:.12};
 const warn=[...(PH.front?.q?.warn||[]),...(PH.back?.q?.warn||[])];
 return {grade:g,range:g>=10?"9–10":(g-1)+"–"+g,dist,why,missing,warn,limiting:why.filter(t=>/máx\. PSA (\d+)/.test(t)&&Number(t.match(/máx\. PSA (\d+)/)[1])===g)};
}
function drawPreview(side){
 const P=PH[side],host=document.querySelector('[data-pg-canvas="'+side+'"]');if(!P||!host)return;
 let cv=host.querySelector("canvas");if(!cv){cv=document.createElement("canvas");host.innerHTML="";host.appendChild(cv);wireDrag(cv,side)}
 cv.width=P.w;cv.height=P.h;const x=cv.getContext("2d");x.drawImage(P.c,0,0);const L=P.lines,lw=Math.max(2,Math.round(P.w/300));
 x.lineWidth=lw;x.strokeStyle="#2ecc71";x.strokeRect(L.ol,L.ot,L.or-L.ol,L.ob-L.ot);x.strokeStyle="#ff4d6d";x.setLineDash([lw*3,lw*2]);x.strokeRect(L.il,L.it,L.ir-L.il,L.ib-L.it);x.setLineDash([]);
 const c=centering(L),info=document.querySelector('[data-pg-info="'+side+'"]');
 if(info)info.innerHTML=c?'Izq./dcha. <b>'+ratioTxt(c.lr)+'</b> · arriba/abajo <b>'+ratioTxt(c.tb)+'</b> · máx. PSA por centrado <b>'+centeringCap(Math.max(c.lr,c.tb),side)+'</b>'+(L.auto&&!L.auto.inner?' · <span class="neg">marco interior no detectado: arrástralo</span>':''):'Ajusta las líneas';
}
/* Arrastrar líneas: verde = borde de la carta, roja = marco interior. Toca cerca de una línea y desliza. */
function wireDrag(cv,side){
 let drag=null;const pos=e=>{const r=cv.getBoundingClientRect(),P=PH[side];return {x:(e.clientX-r.left)*P.w/r.width,y:(e.clientY-r.top)*P.h/r.height,tol:18*P.w/r.width}};
 cv.style.touchAction="none";
 cv.addEventListener("pointerdown",e=>{const P=PH[side];if(!P)return;const p=pos(e),L=P.lines;let best=null,bd=p.tol;
  for(const k of ["ol","or","il","ir"]){const d=Math.abs(p.x-L[k]);if(d<bd&&p.y>L.ot-p.tol&&p.y<L.ob+p.tol){bd=d;best=k}}
  for(const k of ["ot","ob","it","ib"]){const d=Math.abs(p.y-L[k]);if(d<bd&&p.x>L.ol-p.tol&&p.x<L.or+p.tol){bd=d;best=k}}
  if(best){drag=best;cv.setPointerCapture(e.pointerId);e.preventDefault()}});
 cv.addEventListener("pointermove",e=>{if(!drag)return;const P=PH[side],p=pos(e);P.lines[drag]=Math.round(/[lr]$/.test(drag)?p.x:p.y);drawPreview(side)});
 const end=()=>{if(drag){drag=null;renderResult()}};cv.addEventListener("pointerup",end);cv.addEventListener("pointercancel",end);
}
async function onPhoto(side,file){
 const st=document.querySelector('[data-pg-info="'+side+'"]');if(st)st.textContent="Analizando…";
 try{const img=await loadImage(file),P=toCanvas(img);P.lines=detect(P);P.q=quality(P,P.lines);PH[side]=P;
  if(side==="back"||!PH.back)suggest();
  drawPreview(side);renderQuestions();renderResult();
 }catch(e){if(st)st.textContent=String(e.message||e)}
}
function cornerCrops(){
 const P=PH.back||PH.front;if(!P)return "";const L=P.lines,cs=Math.round((L.or-L.ol)*.14),out=[];
 for(const [k,x,y] of [["↖",L.ol,L.ot],["↗",L.or-cs,L.ot],["↙",L.ol,L.ob-cs],["↘",L.or-cs,L.ob-cs]]){const c=document.createElement("canvas");c.width=c.height=160;c.getContext("2d").drawImage(P.c,Math.max(0,x-4),Math.max(0,y-4),cs+8,cs+8,0,0,160,160);out.push('<figure><img alt="Esquina '+k+'" src="'+c.toDataURL("image/jpeg",.85)+'"><figcaption>'+k+'</figcaption></figure>')}
 const w=P.white;return '<div class="pgCorners">'+out.join("")+'</div>'+(w?'<p class="v4note">Detección automática de blanqueo ('+(PH.back?'reverso':'frontal')+'): esquinas '+Math.round(w.maxC*1000)/10+' %, bordes '+Math.round(w.maxE*1000)/10+' % de píxeles blancos junto al borde. Orientativo: confírmalo abajo mirando estas ampliaciones.</p>':'');
}
function renderQuestions(){
 const box=document.getElementById("pgQuestions");if(!box)return;
 box.innerHTML=cornerCrops()+Q.map(([k,label,opts])=>'<fieldset class="pgQ"><legend>'+E(label)+'</legend>'+opts.map(([v,t])=>'<label><input type="radio" name="pg-'+k+'" value="'+v+'"'+(String(gradeState.answers[k])===String(v)?' checked':'')+'> '+E(t)+'</label>').join("")+'</fieldset>').join("");
}
function renderResult(){
 const box=document.getElementById("pgResult");if(!box)return;const r=compute();gradeState.result=r;
 if(!r){box.innerHTML='<p class="v4note">Sube al menos el frontal y responde la comprobación.</p>';return}
 if(r.invalid){box.innerHTML='<div class="pgRes bad"><b>No apta para PSA</b><p>'+E(r.why[0])+'</p></div>';return}
 const p=r.dist,pct=v=>Math.round((v||0)*100)+" %";
 box.innerHTML='<div class="pgRes"><span>Nota PSA probable</span><b>PSA '+r.grade+'</b><small>rango '+r.range+' · '+(r.grade>=9?'candidata a enviar si el valor lo justifica':r.grade>=7?'solo compensa en cartas de valor alto':'normalmente no compensa graduarla')+'</small></div>'+
  '<p class="v4note">Probabilidad estimada: '+Object.keys(p).sort((a,b)=>b-a).map(k=>'PSA '+k+' '+pct(p[k])).join(" · ")+'.</p>'+
  (r.limiting.length?'<p class="v4missing"><b>Lo que limita la nota:</b> '+E(r.limiting.join(" · "))+'</p>':'')+
  '<details class="v4more"><summary>Detalle</summary><ul class="v4help">'+r.why.map(t=>'<li>'+E(t)+'</li>').join("")+'</ul></details>'+
  (r.missing.length?'<p class="v4note">Falta responder: '+E(r.missing.join(", "))+'.</p>':'')+(r.warn.length?'<p class="v4note neg">Calidad de foto: '+E(r.warn.join(" · "))+'.</p>':'')+
  '<div class="v4actions"><button type="button" class="v4btn primary" data-pg-save>Guardar valoración</button><button type="button" class="v4btn" data-pg-tocalc>¿Merece la pena enviarla? →</button></div>'+
  '<p class="v4note">Estimación a partir de fotos: PSA examina la carta en mano y suele ser más estricta. Los umbrales de centrado para PSA 9 a 3 varían entre guías y son aproximados; el de PSA 10 (≈55/45 frontal, 75/25 trasero) es el más documentado.</p>';
}
function renderValorar(){
 const host=document.getElementById("cpPregrade");if(!host)return;
 const st=window.CVStateBridge?.get?.(),mine=(st?.cards||[]).filter(c=>!c.archivedSold&&!/^(PSA|BGS|CGC|SGC)$/i.test(String(c.grading||"")));
 const hist=readLS(HKEY,[]);
 host.innerHTML='<section class="rdlivebox cpBox pg"><h3>Valorar para PSA</h3><p class="v4note">Haz las fotos sin funda, sobre fondo oscuro y liso, con luz difusa y el móvil paralelo a la carta. La app mide el centrado, busca blanqueo en esquinas y bordes y te guía en el resto. Resultado orientativo.</p>'+
  '<label class="pgCard">Carta<select data-pg-card><option value="">(sin elegir)</option>'+mine.map(c=>'<option value="'+E(c.id)+'"'+(gradeState.card===c.id?' selected':'')+'>'+E([c.name,c.number,c.set,c.language].filter(Boolean).join(" · "))+'</option>').join("")+'</select></label>'+
  '<div class="pgPhotos">'+[["front","1 · Frontal (obligatoria)"],["back","2 · Reverso (recomendada: el borde azul delata el blanqueo)"]].map(([k,t])=>'<div class="pgPh"><label class="v4btn">'+t+'<input type="file" accept="image/*" capture="environment" data-pg-photo="'+k+'" hidden></label><div class="pgCv" data-pg-canvas="'+k+'"></div><p class="v4note" data-pg-info="'+k+'">'+(PH[k]?'':'Sin foto')+'</p></div>').join("")+'</div>'+
  '<p class="v4note">Línea <b style="color:#2ecc71">verde</b>: borde de la carta. Línea <b style="color:#ff4d6d">roja</b>: marco interior. Si no coinciden, toca cerca de la línea y arrástrala.</p>'+
  '<div id="pgQuestions"></div><div id="pgResult"></div>'+
  (hist.length?'<details class="v4old"><summary>Valoraciones guardadas ('+hist.length+')</summary><ul class="v4help">'+hist.slice(0,30).map(h=>'<li><b>'+E(h.name||"Carta")+'</b> · PSA '+E(h.grade)+' ('+E(h.range)+') · '+E(new Date(h.at).toLocaleDateString("es-ES"))+(h.lr?' · centrado '+E(h.lr):'')+'</li>').join("")+'</ul></details>':'')+'</section>';
 for(const k of ["front","back"])if(PH[k])drawPreview(k);
 renderQuestions();renderResult();
}
function saveValuation(){
 const r=gradeState.result;if(!r||r.invalid)return;const st=window.CVStateBridge?.get?.(),c=(st?.cards||[]).find(x=>x.id===gradeState.card);
 const fc=PH.front&&centering(PH.front.lines),h=readLS(HKEY,[]);
 h.unshift({at:new Date().toISOString(),cardId:gradeState.card||"",name:c?[c.name,c.number].filter(Boolean).join(" "):"",grade:r.grade,range:r.range,dist:r.dist,lr:fc?ratioTxt(fc.lr)+" · "+ratioTxt(fc.tb):"",answers:{...gradeState.answers}});
 if(!writeLS(HKEY,h.slice(0,60))){alert("NO se ha guardado la valoración: el almacenamiento del navegador no lo permite.");return}renderValorar();
}

/* =================== PSA: comprar, graduar, vender =================== */
let calc={value:"",service:"std",serviceEur:"",shipOut:15,shipBack:25,p10:"",p9:"",p8:"",sale10:"",sale9:"",sale8:"",feePct:5,sellShip:5,name:"",...readLS(CKEY,{})};
function calcResult(){
 const v=N(calc.value),svc=SERVICES.find(s=>s[0]===calc.service),fee=N(calc.service==="custom"?calc.serviceEur:svc?.[2]);
 const f=(N(calc.feePct)||0)/100,ship=N(calc.sellShip)||0,net=x=>x*(1-f)-ship,extra=(Number.isFinite(fee)?fee:0)+(N(calc.shipOut)||0)+(N(calc.shipBack)||0);
 const cost=(Number.isFinite(v)?v:0)+extra;
 const p={10:N(calc.p10)/100,9:N(calc.p9)/100,8:N(calc.p8)/100},sale={10:N(calc.sale10),9:N(calc.sale9),8:N(calc.sale8)};
 let psum=0,ok=true;for(const g of [10,9,8])if(p[g]>0){psum+=p[g];if(!Number.isFinite(sale[g]))ok=false}
 const rest=Math.max(0,1-psum),low=Number.isFinite(v)?rest*net(v*.8):0;/* ≤ 7: se vende al 80 % del valor RAW de hoy */
 const term=g=>p[g]>0&&Number.isFinite(sale[g])?p[g]*net(sale[g]):0;
 const ev=term(10)+term(9)+term(8)+low,profit=ok&&Number.isFinite(v)?ev-cost:NaN;
 const vsRaw=ok&&Number.isFinite(v)?ev-extra-net(v):NaN;/* graduar frente a venderla RAW hoy */
 const be10=p[10]>0&&Number.isFinite(v)?((cost-term(9)-term(8)-low)/p[10]+ship)/(1-f):NaN;/* precio PSA 10 con beneficio esperado 0 */
 return {v,fee,cost,ev,profit,vsRaw,be10,ok,psum,rest};
}
function q(s){return encodeURIComponent(s)}
function renderPsa(){
 const host=document.getElementById("cpPsa");if(!host)return;const r=calcResult(),last=readLS(HKEY,[])[0];
 const inp=(k,label,ph,extra="")=>'<label>'+label+'<input inputmode="decimal" data-psa="'+k+'" value="'+E(calc[k])+'" placeholder="'+E(ph||"")+'"'+extra+'></label>';
 const name=calc.name||"";
 host.innerHTML='<section class="rdlivebox cpBox psa"><h3>¿Merece la pena graduarla con PSA? · desde 41020</h3>'+
  '<p class="v4note">PSA Europa (Frankfurt) acepta envíos de particulares de la UE desde el 15/09/2026. Tarifas de lanzamiento publicadas: Standard 49,99 € (80–90 días hábiles), Priority 69,99 €, Express 199 €. La devolución dentro de la UE aún no está publicada: ponla estimada.</p>'+
  '<div class="psaGrid"><label class="wide">Carta<input data-psa="name" value="'+E(name)+'" placeholder="Nombre y número (para buscar ventas)"></label>'+
  inp("value","Valor actual o coste RAW €","Cardmarket")+'<label class="wide">Servicio PSA<select data-psa="service">'+SERVICES.map(([k,t])=>'<option value="'+k+'"'+(calc.service===k?' selected':'')+'>'+t+'</option>').join("")+'</select></label>'+
  (calc.service==="custom"?inp("serviceEur","Tarifa PSA €",""):'')+inp("shipOut","Envío asegurado a Frankfurt €","")+inp("shipBack","Devolución asegurada (estimada) €","")+'</div>'+
  '<h4>Probabilidad de nota</h4><div class="psaGrid">'+inp("p10","PSA 10 %","")+inp("p9","PSA 9 %","")+inp("p8","PSA 8 %","")+'</div>'+
  (last?'<p class="v4note">Última valoración: '+E(last.name||"carta")+' · PSA '+E(last.grade)+' ('+E(last.range)+') <button type="button" class="v4btn" data-psa-uselast>Usar sus probabilidades</button></p>':'<p class="v4note">Usa «Valorar PSA» con fotos para estimar las probabilidades.</p>')+
  '<h4>Precio de venta graduada (lo que veas vendido o anunciado)</h4><div class="psaGrid">'+inp("sale10","Venta PSA 10 €","")+inp("sale9","Venta PSA 9 €","")+inp("sale8","Venta PSA 8 €","")+inp("feePct","Comisión de venta %","")+inp("sellShip","Envío de venta €","")+'</div>'+
  (name?'<p class="v4note">Ver precios de PSA de «'+E(name)+'»: <a href="https://www.catawiki.com/es/s?q='+q(name+" PSA")+'" target="_blank" rel="noopener">Catawiki</a> · <a href="https://es.wallapop.com/app/search?keywords='+q(name+" PSA")+'" target="_blank" rel="noopener">Wallapop</a> · <a href="https://www.vinted.es/catalog?search_text='+q(name+" PSA")+'" target="_blank" rel="noopener">Vinted</a> · <a href="https://www.psacard.com/auctionprices/search?q='+q(name)+'" target="_blank" rel="noopener">PSA (ventas registradas)</a></p>':'')+
  '<div class="cpMoney"><div><span>Coste total</span><b>'+EUR(r.cost)+'</b><small>carta + PSA + envíos</small></div><div><span>Valor esperado</span><b>'+(r.ok?EUR(r.ev):"—")+'</b><small>'+(r.ok?'según tus probabilidades y precios':'faltan precios de venta')+'</small></div><div class="'+(r.profit>0?'pos':'neg')+'"><span>Beneficio esperado</span><b>'+(r.ok?SIGNED(r.profit):"—")+'</b><small>'+(Number.isFinite(r.vsRaw)?'frente a venderla RAW hoy: '+SIGNED(r.vsRaw):'')+'</small></div></div>'+
  (Number.isFinite(r.be10)&&r.be10>0?'<p class="v4note">Para no perder dinero, un PSA 10 debería venderse al menos por <b>'+EUR(r.be10)+'</b> (con tus probabilidades).</p>':'')+
  (r.psum>1.001?'<p class="v4note neg">Las probabilidades suman más de 100 %.</p>':'')+
  '<p class="v4note">Las notas ≤ 7 se calculan como venta al 80 % del valor RAW. Es una estimación: PSA puede tardar meses y la nota no está garantizada.</p></section>'+
  '<section class="rdlivebox cpBox psa"><h3>Comprar PSA oficiales desde España</h3><ul class="v4help">'+
  '<li><b>Verifica SIEMPRE el certificado</b> antes de pagar: el número de la etiqueta debe existir en PSA y coincidir con carta, nota y foto.</li>'+
  '<li>Dónde buscar en la UE: subastas de <a href="https://www.catawiki.com/es/s?q='+q((name||"pokemon")+" PSA 10")+'" target="_blank" rel="noopener">Catawiki</a>, particulares en <a href="https://es.wallapop.com/app/search?keywords='+q((name||"pokemon")+" PSA")+'" target="_blank" rel="noopener">Wallapop</a> y <a href="https://www.vinted.es/catalog?search_text='+q((name||"pokemon")+" PSA")+'" target="_blank" rel="noopener">Vinted</a>, y tiendas especializadas. Pide fotos del frente y del reverso del estuche y del código QR.</li>'+
  '<li>Señales de falsificación: etiqueta con tipografía o colores distintos, estuche sin el holograma de PSA, certificado que muestra otra carta u otra nota.</li></ul>'+
  '<div class="cpCTk"><input inputmode="numeric" data-psa-cert placeholder="Nº de certificado PSA" aria-label="Número de certificado PSA"><button type="button" class="v4btn primary" data-psa-certgo>Verificar en PSA ↗</button></div>'+
  mineGraded()+'</section>';
}
function mineGraded(){const st=window.CVStateBridge?.get?.(),g=(st?.cards||[]).filter(c=>!c.archivedSold&&/^PSA$/i.test(String(c.grading||"")));
 if(!g.length)return '';return '<h4>Tus cartas PSA</h4><ul class="v4help">'+g.map(c=>'<li><b>'+E(c.name)+'</b> · PSA '+E(c.grade||"?")+(c.cert?' · <a href="https://www.psacard.com/cert/'+encodeURIComponent(c.cert)+'" target="_blank" rel="noopener">cert. '+E(c.cert)+' ↗</a>':' · sin certificado anotado')+'</li>').join("")+'</ul>'}

/* =================== eventos =================== */
document.addEventListener("change",e=>{
 const ph=e.target.closest("[data-pg-photo]");if(ph&&ph.files?.[0]){onPhoto(ph.dataset.pgPhoto,ph.files[0]);return}
 const rd=e.target.closest('#pgQuestions input[type="radio"]');if(rd){const k=rd.name.slice(3);gradeState.answers[k]=rd.value;delete gradeState.auto[k];renderResult();return}
 const cd=e.target.closest("[data-pg-card]");if(cd){gradeState.card=cd.value;return}
 const ps=e.target.closest("[data-psa]");if(ps){calc[ps.dataset.psa]=ps.value;writeLS(CKEY,calc);renderPsa()}
});
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-pg-save],[data-pg-tocalc],[data-psa-uselast],[data-psa-certgo]");if(!t)return;const d=t.dataset;
 if("pgSave" in d)saveValuation();
 else if("pgTocalc" in d){const r=gradeState.result;if(r&&!r.invalid){calc.p10=String(Math.round((r.dist[10]||0)*100));calc.p9=String(Math.round((r.dist[9]||0)*100));calc.p8=String(Math.round((r.dist[8]||0)*100));
  const st=window.CVStateBridge?.get?.(),c=(st?.cards||[]).find(x=>x.id===gradeState.card);if(c){calc.name=[c.name,c.number].filter(Boolean).join(" ");if(!calc.value&&Number(c.value)>0)calc.value=String(c.value)}writeLS(CKEY,calc)}
  window.CVSimpleNav?.showTab?.("pregrade");history.replaceState(null,"","#pregrade");renderPsa();window.scrollTo({top:0})}
 else if("psaUselast" in d){const l=readLS(HKEY,[])[0];if(l){calc.p10=String(Math.round((l.dist?.[10]||0)*100));calc.p9=String(Math.round((l.dist?.[9]||0)*100));calc.p8=String(Math.round((l.dist?.[8]||0)*100));if(l.name&&!calc.name)calc.name=l.name;writeLS(CKEY,calc);renderPsa()}}
 else if("psaCertgo" in d){const n=String(document.querySelector("[data-psa-cert]")?.value||"").replace(/\D/g,"");if(!n){alert("Escribe el número de certificado de la etiqueta.");return}window.open("https://www.psacard.com/cert/"+n,"_blank","noopener")}
});
function mount(){
 const ps=document.getElementById("pregrade");if(ps&&!document.getElementById("cpPsa")){const d=document.createElement("div");d.id="cpPsa";d.className="v4board";ps.prepend(d);ps.classList.add("cpPsaOn")}
 renderPsa();renderValorar();
}
document.addEventListener("click",e=>{if(e.target.closest('.mainNav [data-tab="pregrade"]'))setTimeout(renderPsa,30);if(e.target.closest('.mainNav [data-tab="psa-valorar"]'))setTimeout(renderValorar,30)});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(mount,500));else setTimeout(mount,500);
window.CVPsa={centeringCap,centering,detect,whitening,compute:()=>compute(),calcResult,setCalc:x=>{calc={...calc,...x}},setAnswers:x=>{gradeState.answers={...gradeState.answers,...x}},photos:PH,renderPsa,renderValorar,capFromWhite};
})();
