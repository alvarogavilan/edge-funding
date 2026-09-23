const seed=[
{id:"vap149",name:"Vaporeon ex #149/131",set:"Prismatic Evolutions · 2025",grade:9,cert:"136142566",value:215,purchase:null,referenceImage:"https://images.pokemontcg.io/sv8pt5/149_hires.png",icon:"💧"},
{id:"eev174",name:"Eevee ex #174",set:"SVP Promo · 2025",grade:9,cert:"136142568",value:30,purchase:null,referenceImage:"https://images.pokemontcg.io/svp/174_hires.png",icon:"✨"},
{id:"cha074",name:"Charizard ex #074",set:"Paldean Fates Tin · 2024",grade:9,cert:"136142569",value:38,purchase:null,referenceImage:"https://images.pokemontcg.io/svp/74_hires.png",icon:"🔥"},
{id:"cha228",name:"Charizard ex #228/197",set:"Obsidian Flames · 2023",grade:9,cert:"136142567",value:55,purchase:null,referenceImage:"https://images.pokemontcg.io/sv3/228_hires.png",icon:"🏆"}];
const KEY="cardvault.v2";let editId=null;const DB="cardvault.media.v1";let db;function openDB(){return new Promise((ok,no)=>{let r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore("photos");r.onsuccess=()=>{db=r.result;ok(db)};r.onerror=()=>no(r.error)})}function photoPut(id,blob){return new Promise((ok,no)=>{let t=db.transaction("photos","readwrite"),r=t.objectStore("photos").put(blob,id);r.onsuccess=()=>ok();r.onerror=()=>no(r.error)})}function photoGet(id){return new Promise((ok,no)=>{let r=db.transaction("photos").objectStore("photos").get(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}function photoDel(id){return new Promise(ok=>{let r=db.transaction("photos","readwrite").objectStore("photos").delete(id);r.onsuccess=()=>ok()})}let state=JSON.parse(localStorage.getItem(KEY)||"null")||{cards:seed,watch:[],history:[],market:[]};if(!state.market)state.market=[];if(!state.watch)state.watch=[];if(!state.history)state.history=[];const refImages={vap149:"https://images.pokemontcg.io/sv8pt5/149_hires.png",eev174:"https://images.pokemontcg.io/svp/174_hires.png",cha074:"https://images.pokemontcg.io/svp/74_hires.png",cha228:"https://images.pokemontcg.io/sv3/228_hires.png"};for(const c of state.cards){if(refImages[c.id]&&!c.referenceImage)c.referenceImage=refImages[c.id]}save();let radarLimit=999999;
const euro=n=>(+n||0).toLocaleString("es-ES",{style:"currency",currency:"EUR"});
const qty=x=>Math.max(1,+x.quantity||1);
const total=()=>state.cards.reduce((a,x)=>a+(+x.value||0)*qty(x),0);
const invested=()=>state.cards.reduce((a,x)=>a+(x.purchase==null?0:(+x.purchase||0)*qty(x)),0);
const drafts=()=>state.cards.filter(x=>x.draft).length;
const gain=()=>total()-invested();function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function forecast(x){let obs=state.market.filter(m=>m.name.toLowerCase()===x.name.toLowerCase()&&String(m.grade||"")===String(x.grade||"")&&m.kind==="sold").slice(-12);if(obs.length<3)return null;let a=obs.map(o=>o.price),first=a.slice(0,Math.ceil(a.length/2)).reduce((s,n)=>s+n,0)/Math.ceil(a.length/2),last=a.slice(Math.floor(a.length/2)).reduce((s,n)=>s+n,0)/(a.length-Math.floor(a.length/2)),trend=Math.max(-.25,Math.min(.25,(last-first)/Math.max(first,1)));return {low:x.value*(1+trend*.5),base:x.value*(1+trend),high:x.value*(1+trend*1.75),evidence:obs.length}}
async function hydratePhotos(){for(const x of state.cards){if(x.photoKey&&!x.photoURL){let b=await photoGet(x.photoKey);if(b)x.photoURL=URL.createObjectURL(b)}}render()}function render(){let q=(document.querySelector("#searchCards")?.value||"").toLowerCase(),ft=document.querySelector("#filterType")?.value||"",visible=state.cards.filter(x=>(!ft||(x.grading||"PSA")===ft)&&(!q||[x.name,x.set,x.number,x.cert].join(" ").toLowerCase().includes(q)));document.querySelector("#cards").innerHTML=visible.map(x=>{let p=x.purchase!=null?((x.value-x.purchase)*qty(x)):null;return `<article class="card" onclick="editCard(\`${x.id}\`)"><div class="thumb">${x.photoURL?`<img src="${x.photoURL}">`:x.photo?`<img src="${x.photo}">`:x.referenceImage?`<img src="${x.referenceImage}" alt="${x.name}">`:x.icon||"🃏"}</div><div><h3>${x.draft?"⚠️ ":""}${x.name}</h3><div class="meta">${x.number?x.number+" · ":""}${x.set||""}<br>${x.cert?"Cert. "+x.cert:""}${qty(x)>1?" · Cant. "+qty(x):""}</div><span class="grade">${x.grading||"PSA"} ${x.grade||""}</span>${x.recognition?.score?`<div class="recognition">Reconocimiento ${x.recognition.score}%</div>`:""}</div><div class="price">${euro(x.value)}${forecast(x)?`<div class="future">12m ≈ ${euro(forecast(x).base)}</div>`:""}${p==null?"":`<div class="profit ${p>=0?"up":"down"}">${p>=0?"+":""}${euro(p)}</div>`}</div></article>`}).join("");document.querySelector("#total").textContent=euro(total());document.querySelector("#count").textContent=state.cards.reduce((n,x)=>n+qty(x),0)+" cartas";
let cs=document.querySelector("#collectionStats");if(cs){let g=gain(),inv=invested();cs.innerHTML=
'<div><span>Valor actual</span><b>'+euro(total())+'</b></div>'+
'<div><span>Invertido</span><b>'+euro(inv)+'</b></div>'+
'<div><span>Resultado</span><b class="'+(g>=0?'up':'down')+'">'+(g>=0?'+':'')+euro(g)+'</b></div>'+
'<div><span>Pendientes</span><b>'+drafts()+'</b></div>';} let prev=state.history.at(-1)?.total;document.querySelector("#change").textContent=prev==null?"Pulsa «Guardar valoración» para crear histórico":(total()-prev>=0?"+":"")+euro(total()-prev)+" desde la última valoración";document.querySelector("#watchList").innerHTML=state.watch.length?state.watch.map((x,i)=>`<div class="card"><div class="thumb">👁️</div><div><h3>${x.name}</h3><div class="meta">Objetivo ≤ ${euro(x.target)}</div></div><button onclick="removeWatch(${i})">×</button></div>`).join(""):'<div class="empty">No sigues ninguna carta todavía.</div>';renderHistory()}
function renderHistory(){const h=[...state.history].reverse();document.querySelector("#history").innerHTML=h.slice(0,10).map(x=>`<div class="historyRow"><span>${new Date(x.at).toLocaleString("es-ES")}</span><b>${euro(x.total)}</b></div>`).join("");drawChart()}
function drawChart(){const c=document.querySelector("#chart"),dpr=devicePixelRatio||1,r=c.getBoundingClientRect();c.width=r.width*dpr;c.height=r.height*dpr;const g=c.getContext("2d");g.scale(dpr,dpr);g.clearRect(0,0,r.width,r.height);let a=state.history.slice(-30);if(a.length<2){g.fillStyle="#8992ad";g.font="13px -apple-system";g.fillText("Guarda 2 snapshots para ver la evolución",12,30);return}let vals=a.map(x=>x.total),mn=Math.min(...vals),mx=Math.max(...vals);if(mx===mn){mx++;mn--}g.strokeStyle="#eef2ff";g.lineWidth=2;g.beginPath();a.forEach((x,i)=>{let px=10+i*(r.width-20)/(a.length-1),py=10+(mx-x.total)*(r.height-20)/(mx-mn);i?g.lineTo(px,py):g.moveTo(px,py)});g.stroke()}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".tab").forEach(x=>x.classList.add("hidden"));document.querySelector("#"+b.dataset.tab).classList.remove("hidden");if(b.dataset.tab==="data")drawChart()});
document.querySelector("#snapshot").onclick=()=>{state.history.push({at:new Date().toISOString(),total:total(),cards:Object.fromEntries(state.cards.map(x=>[x.id,x.value]))});save();render()};
function radarScore(group){let sold=group.filter(x=>x.kind==="sold"),list=group.filter(x=>x.kind==="listing");if(!sold.length)return 0;let prices=sold.map(x=>x.price).sort((a,b)=>a-b),med=prices[Math.floor(prices.length/2)],latest=sold.at(-1)?.price||med,score=Math.min(55,sold.length*11);if(latest<med)score+=15;if(list.length&&Math.min(...list.map(x=>x.price))<med*.9)score+=20;return Math.min(100,score)}
function renderRadar(){let groups={};state.market.forEach(x=>{let key=[x.name,x.set||"",x.grading||"",x.grade||""].join("||");(groups[key]??=[]).push(x)});let rows=Object.entries(groups).map(([key,g])=>({name:g[0]?.name||key,set:g[0]?.set||"",grading:g[0]?.grading||"",grade:g[0]?.grade||"",g,score:radarScore(g),sold:g.filter(x=>x.kind==="sold"),ask:g.filter(x=>x.kind==="listing")})).filter(x=>{let p=x.ask.length?Math.min(...x.ask.map(y=>y.price)):Infinity;return p<=radarLimit}).sort((a,b)=>b.score-a.score);let rs=document.querySelector("#radarSummary");if(rs){let obs=state.market.length,sales=state.market.filter(x=>x.kind==="sold").length,active=state.market.filter(x=>x.kind==="listing").length,opps=rows.filter(x=>x.score>=60).length;rs.innerHTML='<div><span>Observaciones</span><b>'+obs+'</b></div><div><span>Ventas</span><b>'+sales+'</b></div><div><span>Anuncios</span><b>'+active+'</b></div><div><span>Señales ≥60</span><b>'+opps+'</b></div>';}document.querySelector("#radarList").innerHTML=rows.length?rows.map(x=>{let sold=x.sold.map(y=>y.price).sort((a,b)=>a-b),med=sold.length?sold[Math.floor(sold.length/2)]:null,ask=x.ask.length?Math.min(...x.ask.map(y=>y.price)):null;return `<article class="opportunity"><div><b>${x.name}</b><div class="meta">${x.set||""}${x.grading||x.grade?" · "+(x.grading||"")+" "+(x.grade||""):""}<br>${x.sold.length} ventas · ${x.ask.length} anuncios</div></div><div><strong>${x.score}/100</strong><div class="meta">${ask!=null?"Oferta "+euro(ask):""}${med!=null?" · Mediana "+euro(med):""}</div></div></article>`}).join(""):'<div class="empty">No hay todavía oportunidades con evidencia suficiente dentro de este precio.</div>'}
document.querySelectorAll("[data-limit]").forEach(b=>b.onclick=()=>{radarLimit=+b.dataset.limit;document.querySelectorAll("[data-limit]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");renderRadar()});
const marketDialog=document.querySelector("#marketDialog"),marketForm=document.querySelector("#marketForm");document.querySelector("#addMarket").onclick=()=>marketDialog.showModal();document.querySelector("#saveMarket").onclick=e=>{e.preventDefault();if(!marketForm.reportValidity())return;let f=new FormData(marketForm);state.market.push({id:crypto.randomUUID(),name:f.get("name").trim(),set:f.get("set"),grading:f.get("grading"),grade:f.get("grade"),price:+f.get("price"),kind:f.get("kind"),source:f.get("source"),url:f.get("url"),at:new Date().toISOString()});save();renderRadar();marketForm.reset();marketDialog.close()};
document.querySelector("#addWatch").onclick=()=>{let name=prompt("Nombre de la carta que quieres seguir");if(!name)return;let target=prompt("Precio objetivo en euros","30");state.watch.push({name,target:+target||0});save();render()};window.removeWatch=i=>{state.watch.splice(i,1);save();render()};

function cleanOCR(s){return (s||"").replace(/[|]/g,"I").replace(/\s+/g," ").trim()}
function guessFromOCR(text){
  const raw=text||"", lines=raw.split(/\n+/).map(cleanOCR).filter(Boolean);
  const number=(raw.match(/\b\d{1,3}\s*\/\s*\d{2,3}\b/)||[])[0]?.replace(/\s/g,"")||"";
  const cert=(raw.match(/\b\d{8,10}\b/)||[])[0]||"";
  const gradeMatch=raw.match(/(?:GEM\s*MT|MINT|NM[- ]?MT|PSA|BGS|CGC|BECKETT)\s*(10(?:\.0)?|9\.5|9|8\.5|8|7\.5|7|6\.5|6|5\.5|5|4\.5|4|3\.5|3|2\.5|2|1\.5|1)\b/i);
  const grading=/\bPSA\b/i.test(raw)?"PSA":/\bBGS|BECKETT\b/i.test(raw)?"BGS":/\bCGC\b/i.test(raw)?"CGC":"RAW";
  const grade=gradeMatch?gradeMatch[1]:"";
  const year=(raw.match(/\b(19\d{2}|20\d{2})\b/)||[])[0]||"";
  const language=/\bESPAÑOL|SPANISH\b/i.test(raw)?"Español":/\bJAPANESE|JAPON[EÉ]S\b/i.test(raw)?"Japonés":/\bENGLISH\b/i.test(raw)?"Inglés":"";
  const stop=/POK[EÉ]MON|TRAINER|ENERGY|BASIC|STAGE|PSA|GEM|MINT|HP|SVP|ILLUSTRATION|RARE|HOLO|CARD/i;
  let name=lines.find(x=>x.length>=3&&x.length<=28&&!stop.test(x)&&!/^\d/.test(x)&&/^[A-Za-zÀ-ÿ0-9 .\-]+$/.test(x)&&(/[A-Za-zÀ-ÿ]{3,}/.test(x)))||"";
  return {number,cert,grade,grading,year,language,name:""};
}
async function tcgdexList(lang){
  try{let r=await fetch("https://api.tcgdex.net/v2/"+lang+"/cards");if(!r.ok)return[];return await r.json()}catch{return[]}
}
async function tcgdexCard(lang,id){
  try{let r=await fetch("https://api.tcgdex.net/v2/"+lang+"/cards/"+encodeURIComponent(id));if(!r.ok)return null;return await r.json()}catch{return null}
}
function normNum(v){return String(v||"").replace(/\s/g,"").replace(/^0+(?=\d)/,"").toLowerCase()}
async function findCardMeta(g){
  if(!g.number)return[];
  const front=normNum(g.number.split("/")[0]);
  const langs=["es","en"];
  let out=[];
  for(const lang of langs){
    const list=await Promise.race([tcgdexList(lang),timeoutAfter(6000)]).catch(()=>[]);
    const hits=(list||[]).filter(c=>normNum(c.localId)===front).slice(0,16);
    for(const h of hits){
      const full=await Promise.race([tcgdexCard(lang,h.id),timeoutAfter(4000)]).catch(()=>null);
      if(full){
        full._lang=lang;
        full.printed_number=full.localId||h.localId||"";
        full.expansion=full.set||full.expansion||{};
        if(!full.images&&full.image)full.images=[{small:full.image+"/low.webp",medium:full.image+"/high.webp",large:full.image+"/high.webp"}];
        out.push(full);
      }
    }
    if(out.length===1)break;
  }
  return out;
}
function norm(s){return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim()}
function tokenScore(a,b){let A=new Set(norm(a).split(" ").filter(Boolean)),B=new Set(norm(b).split(" ").filter(Boolean));if(!A.size||!B.size)return 0;let hit=[...A].filter(x=>B.has(x)).length;return hit/Math.max(A.size,B.size)}
function candidateScore(c,g){
  const printed=String(c.printed_number||"").replace(/\s/g,"").toLowerCase();
  const num=String(c.number||"").replace(/\s/g,"").replace(/^0+/,"").toLowerCase();
  const gn=String(g.number||"").replace(/\s/g,"").toLowerCase();
  if(!gn)return 0;
  if(printed===gn)return 100;
  const front=gn.split("/")[0].replace(/^0+/,"");
  if(num===front)return 55;
  return 0;
}
function bestCandidate(found,g){
  return (found||[]).map(c=>({c,score:candidateScore(c,g)})).sort((a,b)=>b.score-a.score)[0]||null
}
function marketValueFor(name,grading,grade){
  let sold=state.market.filter(m=>m.kind==="sold"&&norm(m.name)===norm(name)&&String(m.grading||"")===String(grading||"")&&String(m.grade||"")===String(grade||"")).map(m=>+m.price).filter(n=>n>0).sort((a,b)=>a-b);
  if(sold.length<3)return null;
  let mid=Math.floor(sold.length/2), med=sold.length%2?sold[mid]:(sold[mid-1]+sold[mid])/2;
  return {value:med,count:sold.length}
}
async function prepareOCRBlob(file){
  return new Promise((ok,no)=>{let im=new Image(),r=new FileReader();r.onload=()=>im.src=r.result;r.onerror=no;im.onload=()=>{let w=im.width,h=im.height,x=w*.05,y=h*.04,cw=w*.90,ch=h*.92,cv=document.createElement("canvas"),max=850;let scale=Math.min(1,max/cw);cv.width=Math.max(1,Math.round(cw*scale));cv.height=Math.max(1,Math.round(ch*scale));let g=cv.getContext("2d");g.drawImage(im,x,y,cw,ch,0,0,cv.width,cv.height);cv.toBlob(b=>b?ok(b):no(new Error("No blob")),"image/jpeg",.72)};r.readAsDataURL(file)})
}
function timeoutAfter(ms){return new Promise((_,no)=>setTimeout(()=>no(new Error("timeout")),ms))}
async function analyzeCardFile(file){
  if(!window.Tesseract)throw new Error("OCR no disponible");
  const small=await prepareOCRBlob(file);
  const res=await Promise.race([Tesseract.recognize(small,"eng"),timeoutAfter(12000)]);
  const g=guessFromOCR(res.data.text),found=await Promise.race([findCardMeta(g),timeoutAfter(7000)]);
  const best=bestCandidate(found,g);
  return {g,found,best};
}
function cardFromRecognition(id,blob,r){
  const g=r.g||{}, exact=(r.found||[]).filter(c=>normNum(c.localId||c.printed_number||c.number)===normNum((g.number||"").split("/")[0]));
  const c=exact.length===1?exact[0]:null, confident=!!c, img=c?.images?.[0], name=confident?(c.name||"Carta identificada"):"Carta por identificar",grading=g.grading||"RAW",grade=g.grade||"";
  const mv=confident?marketValueFor(name,grading,grade):null;
  return {id,name,set:confident?(c.set?.name||c.expansion?.name||""):"",number:confident?(c.localId||c.printed_number||c.number||g.number||""):(g.number||""),year:confident?String(c.set?.releaseDate||c.expansion?.release_date||c.expansion?.releaseDate||g.year||"").slice(0,4):(g.year||""),language:confident?(c._lang==="es"?"Español":c._lang==="en"?"Inglés":(c.language_code||c.language||g.language||"")):(g.language||""),grading,grade,cert:g.cert||"",value:mv?.value||0,valueEvidence:mv?.count||0,purchase:null,quantity:1,purchaseDate:"",referenceImage:img?(img.large||img.medium||img.small||""):"",photoKey:id,photoURL:URL.createObjectURL(blob),icon:"🃏",draft:!confident,recognition:{score:confident?100:0,source:confident?"printed-number":"pending",at:new Date().toISOString()},createdAt:new Date().toISOString()}
}
async function recognizeSavedCard(card,file){
  try{
    const r=await analyzeCardFile(file),fresh=cardFromRecognition(card.id,file,r);
    if(!fresh.draft){
      const keep={purchase:card.purchase,quantity:card.quantity||1,purchaseDate:card.purchaseDate||"",notes:card.notes||"",photoKey:card.photoKey,photoURL:card.photoURL};
      Object.assign(card,fresh,keep);save();render();return true;
    }
    card.number=r.g?.number||card.number||"";card.recognition=fresh.recognition;save();render();return false;
  }catch{
    card.recognition={score:0,source:"timeout-or-error",at:new Date().toISOString()};save();render();return false;
  }
}

function applyCandidate(c,g={}){
  if(!c)return;
  form.elements.name.value=c.name||g.name||"";
  form.elements.number.value=c.number||g.number||"";
  form.elements.year.value=(c.set?.releaseDate||c.expansion?.release_date||c.expansion?.releaseDate||g.year||"").toString().slice(0,4);
  form.elements.set.value=c.set?.name||c.expansion?.name||"";
  form.elements.language.value=c._lang==="es"?"Español":c._lang==="en"?"Inglés":(c.language_code||c.language||g.language||"");
  if(g.grading)form.elements.grading.value=g.grading;
  if(g.grade)form.elements.grade.value=g.grade;
  if(g.cert)form.elements.cert.value=g.cert;
  const img=(c.images||[])[0]; if(img) form.dataset.referenceImage=img.large||img.medium||img.small||""; else if(c.image) form.dataset.referenceImage=c.image+"/high.webp";
}
async function scanCardFile(file){
  const st=document.querySelector("#scanStatus"),box=document.querySelector("#autoMatch");
  st.textContent="Leyendo número de colección, grado y certificado…";box.classList.add("hidden");box.innerHTML="";
  try{
    const r=await analyzeCardFile(file),g=r.g,exact=r.found.filter(c=>normNum(c.localId||c.printed_number||c.number)===normNum((g.number||"").split("/")[0]));
    if(form.elements.grading)form.elements.grading.value=g.grading;
    for(const k of ["number","year","language","cert","grade"])if(g[k]&&form.elements[k])form.elements[k].value=g[k];
    if(exact.length===1){
      applyCandidate(exact[0],g);form.dataset.recognitionScore=100;
      st.textContent="✅ Identificación exacta por número "+g.number+". Revisa y guarda.";return;
    }
    const choices=exact.length?exact:r.found;
    if(choices.length){
      st.textContent=(g.number?"Número leído: "+g.number+". ":"")+"Elige la imagen correcta:";
      box.innerHTML=choices.slice(0,8).map((c,i)=>{let im=c.images?.[0]?.small||c.images?.[0]?.medium||"";return '<button type="button" class="candidateCard" data-match="'+i+'">'+(im?'<img src="'+im+'" alt="">':'')+'<span><b>'+(c.name||"Carta")+'</b><small>'+(c.printed_number||c.number||"")+' · '+(c.expansion?.name||"")+'</small></span></button>'}).join("");
      box.classList.remove("hidden");
      box.querySelectorAll("[data-match]").forEach(b=>b.onclick=()=>{applyCandidate(choices[+b.dataset.match],g);form.dataset.recognitionScore=exact.length?95:80;box.classList.add("hidden");st.textContent="✅ Carta seleccionada. Pulsa «Guardar carta»."});
      return;
    }
    form.elements.name.value="";
    st.textContent=g.number?"⚠️ He leído "+g.number+", pero no encontré una coincidencia en el catálogo.":"⚠️ No he podido leer el número de colección. Usa una foto más cercana y recta del frontal.";
  }catch(e){st.textContent="⚠️ El reconocimiento no ha podido completarse. Prueba otra foto frontal."}
}

const dlg=document.querySelector("#cardDialog"),form=document.querySelector("#cardForm"),del=document.querySelector("#deleteCard");document.querySelector("#cardPhoto").onchange=e=>{let f=e.target.files?.[0];if(f){document.querySelector("#scanStatus").textContent="Foto lista. Al guardar, se añadirá primero y luego se identificará.";}};document.querySelector("#cardCamera").onchange=e=>{let f=e.target.files?.[0];if(f){try{let dt=new DataTransfer();dt.items.add(f);document.querySelector("#cardPhoto").files=dt.files}catch{}document.querySelector("#scanStatus").textContent="Foto lista. Al guardar, se añadirá primero y luego se identificará.";}};document.querySelector("#addCard").onclick=()=>{editId=null;form.reset();delete form.dataset.referenceImage;document.querySelector("#scanStatus").textContent="Elige una foto de tu galería o haz una nueva.";document.querySelector("#autoMatch").classList.add("hidden");del.classList.add("hidden");dlg.showModal()};window.editCard=id=>{let x=state.cards.find(c=>c.id===id);if(!x)return;editId=id;form.dataset.referenceImage=x.referenceImage||"";document.querySelector("#scanStatus").textContent="Puedes cambiar la foto para volver a identificarla.";for(const k of ["name","number","year","set","grading","grade","language","cert","value","purchase","quantity","purchaseDate","notes"])if(form.elements[k])form.elements[k].value=x[k]??"";del.classList.remove("hidden");dlg.showModal()};document.querySelector("#saveCard").onclick=async e=>{e.preventDefault();let f=new FormData(form),file=f.get("photo"),cameraFile=document.querySelector("#cardCamera")?.files?.[0],id=editId||crypto.randomUUID(),old=state.cards.find(x=>x.id===id)||{};if((!file||!file.size)&&cameraFile)file=cameraFile;if(!editId&&(!file||!file.size)){document.querySelector("#scanStatus").textContent="Selecciona una foto primero.";return}let x={...old,id,name:f.get("name")||old.name||"Carta por identificar",set:f.get("set")||old.set||"",grading:f.get("grading")||old.grading||"RAW",grade:f.get("grade")||old.grade||"",number:f.get("number")||old.number||"",year:f.get("year")||old.year||"",language:f.get("language")||old.language||"",value:+f.get("value")||old.value||0,cert:f.get("cert")||old.cert||"",purchase:f.get("purchase")===""?(old.purchase??null):+f.get("purchase"),quantity:Math.max(1,+f.get("quantity")||old.quantity||1),purchaseDate:f.get("purchaseDate")||old.purchaseDate||"",notes:f.get("notes")||old.notes||"",referenceImage:form.dataset.referenceImage||old.referenceImage||"",draft:old.draft??true,icon:old.icon||"🃏"};let savedBlob=null;if(file&&file.size){savedBlob=await resizeBlob(file);x.photoKey=id;delete x.photo;delete x.photoURL;await photoPut(id,savedBlob);x.photoURL=URL.createObjectURL(savedBlob)}if(editId)state.cards=state.cards.map(c=>c.id===id?x:c);else state.cards.push(x);save();render();form.reset();editId=null;dlg.close();storageStatus();if(savedBlob){let st=document.querySelector("#repairStatus");st.classList.remove("hidden");st.textContent="Foto guardada. Identificando carta…";setTimeout(async()=>{let ok=await recognizeSavedCard(x,savedBlob);st.textContent=ok?"✅ Carta identificada.":"Foto guardada. No se pudo identificar en unos segundos; queda pendiente para reanalizar.";},60)}};del.onclick=async()=>{if(!editId||!confirm("¿Eliminar esta carta del portfolio?"))return;state.cards=state.cards.filter(x=>x.id!==editId);await photoDel(editId);save();editId=null;dlg.close();render()};function resizeBlob(file){return new Promise(ok=>{let im=new Image(),rd=new FileReader();rd.onload=()=>im.src=rd.result;im.onload=()=>{let max=1200,s=Math.min(1,max/im.width),cv=document.createElement("canvas");cv.width=im.width*s;cv.height=im.height*s;cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);cv.toBlob(ok,"image/jpeg",.82)};rd.readAsDataURL(file)})}
function resize(file){return new Promise(ok=>{let im=new Image(),rd=new FileReader();rd.onload=()=>im.src=rd.result;im.onload=()=>{let max=900,s=Math.min(1,max/im.width),cv=document.createElement("canvas");cv.width=im.width*s;cv.height=im.height*s;cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);ok(cv.toDataURL("image/jpeg",.78))};rd.readAsDataURL(file)})}
function blobToDataURL(blob){return new Promise((ok,no)=>{let r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(blob)})}function dataURLToBlob(s){let [h,d]=s.split(","),mime=(h.match(/:(.*?);/)||[])[1]||"image/jpeg",bin=atob(d),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}async function storageStatus(){let label="Almacenamiento disponible";if(navigator.storage?.estimate){let e=await navigator.storage.estimate(),u=e.usage||0,q=e.quota||0,p=q?u/q*100:0;label=(u/1048576).toFixed(1)+" MB usados"+(q?" de "+(q/1048576).toFixed(0)+" MB · "+p.toFixed(1)+"%":"");document.querySelector("#storageText").textContent=label}let persisted=false;try{persisted=await navigator.storage?.persisted?.()}catch{}let r=document.querySelector("#readyText");if(r)r.textContent="Fotos en IndexedDB · backup completo disponible · "+(persisted?"almacenamiento persistente concedido":"haz backups periódicos en Archivos/iCloud")}document.querySelector("#export").onclick=async()=>{let photos={};for(const x of state.cards){if(x.photoKey){let b=await photoGet(x.photoKey);if(b)photos[x.photoKey]=await blobToDataURL(b)}}let clean=JSON.parse(JSON.stringify(state,(k,v)=>k==="photoURL"?undefined:v)),pack={format:"cardvault-backup",version:2,createdAt:new Date().toISOString(),state:clean,photos},blob=new Blob([JSON.stringify(pack)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="card-vault-completo-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
document.querySelector("#import").onchange=async e=>{try{let x=JSON.parse(await e.target.files[0].text()),s=x.format==="cardvault-backup"?x.state:x;if(!s.cards)throw 0;if(x.photos)for(const [id,data] of Object.entries(x.photos))await photoPut(id,dataURLToBlob(data));state=s;normalizePendingCards();save();await hydratePhotos();storageStatus();alert("Backup completo restaurado")}catch(err){alert("Backup no válido o incompleto")}};

function normalizePendingCards(){
  let changed=false;
  for(const c of state.cards){
    if(c.draft){
      const bad=!c.name||c.name==="Carta por identificar"||c.recognition?.source!=="catalog+ocr";
      if(bad&&c.name!=="Carta por identificar"){c.recognition={...(c.recognition||{}),legacyName:c.name};c.name="Carta por identificar";changed=true}
    }
  }
  if(changed)save();
}
async function reanalyzePending(){
  const btn=document.querySelector("#reanalyzePending"),st=document.querySelector("#repairStatus"),pending=state.cards.filter(c=>c.draft&&c.photoKey);
  if(!pending.length){st.textContent="No hay cartas pendientes con foto para reanalizar.";st.classList.remove("hidden");return}
  btn.disabled=true;st.classList.remove("hidden");let ok=0,fail=0;
  for(let i=0;i<pending.length;i++){
    const c=pending[i];st.textContent="Reanalizando "+(i+1)+"/"+pending.length+"…";
    try{
      const blob=await photoGet(c.photoKey);if(!blob){fail++;continue}
      const r=await analyzeCardFile(blob),fresh=cardFromRecognition(c.id,blob,r);
      if(!fresh.draft){
        const keep={purchase:c.purchase,quantity:c.quantity||1,purchaseDate:c.purchaseDate||"",notes:c.notes||"",photoKey:c.photoKey,photoURL:c.photoURL||fresh.photoURL};
        Object.assign(c,fresh,keep);ok++;
      }else{
        c.name="Carta por identificar";c.number=r.g?.number||c.number||"";c.recognition=fresh.recognition;fail++;
      }
    }catch{c.name="Carta por identificar";fail++}
    save();render();
  }
  btn.disabled=false;st.textContent=ok+" identificadas · "+fail+" siguen pendientes.";storageStatus();
}
normalizePendingCards();
document.querySelector("#reanalyzePending").onclick=reanalyzePending;
document.querySelector("#clearTests").onclick=async()=>{let bad=state.cards.filter(c=>c.draft);if(!bad.length){alert("No hay pruebas pendientes que limpiar.");return}if(!confirm("Esto borrará solo las cartas pendientes/de prueba. ¿Continuar?"))return;for(const c of bad){if(c.photoKey)await photoDel(c.photoKey)}state.cards=state.cards.filter(c=>!c.draft);save();render();storageStatus();alert("Pruebas pendientes eliminadas.")};

document.querySelector("#searchCards").oninput=render;document.querySelector("#filterType").onchange=render;
const bulkDialog=document.querySelector("#bulkDialog"),bulkPhotos=document.querySelector("#bulkPhotos");document.querySelector("#bulkAdd").onclick=()=>bulkDialog.showModal();
document.querySelector("#saveBulk").onclick=async e=>{e.preventDefault();let fs=[...bulkPhotos.files];if(!fs.length)return;let btn=e.currentTarget,old=btn.textContent;btn.disabled=true;btn.textContent="Guardando fotos…";let jobs=[];for(let i=0;i<fs.length;i++){let id=crypto.randomUUID(),blob=await resizeBlob(fs[i]);await photoPut(id,blob);let card={id,name:"Carta por identificar",set:"",number:"",year:"",language:"",grading:"RAW",grade:"",value:0,purchase:null,quantity:1,purchaseDate:"",cert:"",photoKey:id,photoURL:URL.createObjectURL(blob),icon:"🃏",draft:true,recognition:{score:0,source:"pending",at:new Date().toISOString()},createdAt:new Date().toISOString()};state.cards.push(card);jobs.push({card,blob});}save();render();storageStatus();btn.disabled=false;btn.textContent=old;bulkPhotos.value="";bulkDialog.close();let st=document.querySelector("#repairStatus");st.classList.remove("hidden");st.textContent=fs.length+" fotos guardadas. Identificando 1/"+fs.length+"…";setTimeout(async()=>{let ok=0;for(let i=0;i<jobs.length;i++){st.textContent=fs.length+" fotos guardadas. Identificando "+(i+1)+"/"+fs.length+"…";if(await recognizeSavedCard(jobs[i].card,jobs[i].blob))ok++;await new Promise(r=>setTimeout(r,120));}st.textContent="✅ "+fs.length+" fotos guardadas · "+ok+" identificadas · "+(fs.length-ok)+" pendientes.";},80)};

openDB().then(async()=>{try{await navigator.storage?.persist?.()}catch{} for(const x of state.cards){if(x.photo&&!x.photoKey&&x.photo.startsWith("data:")){try{let blob=await (await fetch(x.photo)).blob();x.photoKey=x.id;await photoPut(x.id,blob);delete x.photo}catch{}}}save();await hydratePhotos();storageStatus()}).catch(()=>{document.querySelector("#readyText").textContent="Error al abrir almacenamiento local. No cargues cartas hasta recargar la app."});