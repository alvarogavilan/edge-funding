const seed=[
{id:"vap149",name:"Vaporeon ex #149",set:"Prismatic Evolutions · 2025",grade:9,cert:"136142566",value:215,icon:"💧"},
{id:"eev174",name:"Eevee ex #174",set:"SVP Promo · 2025",grade:9,cert:"136142568",value:30,icon:"✨"},
{id:"cha074",name:"Charizard ex #074",set:"Paldean Fates Tin · 2024",grade:9,cert:"136142569",value:38,icon:"🔥"},
{id:"cha228",name:"Charizard ex #228/197",set:"Obsidian Flames · 2023",grade:9,cert:"136142567",value:55,icon:"🏆"}];
const KEY="cardvault.v1";let state=JSON.parse(localStorage.getItem(KEY)||"null")||{cards:seed,watch:[],history:[]};
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function render(){const c=document.querySelector("#collection");c.innerHTML=state.cards.map(x=>`<article class="card"><div class="thumb">${x.icon}</div><div><h3>${x.name}</h3><div class="meta">${x.set}<br>Cert. ${x.cert}</div><span class="grade">PSA ${x.grade}</span></div><div class="price">≈ ${x.value.toLocaleString("es-ES")} €</div></article>`).join("");document.querySelector("#total").textContent=state.cards.reduce((a,x)=>a+x.value,0).toLocaleString("es-ES")+" €";document.querySelector("#watchList").innerHTML=state.watch.map(x=>`<div class="card"><div>👁️</div><div><h3>${x}</h3><div class="meta">Seguimiento local</div></div></div>`).join("")}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".tab").forEach(x=>x.classList.add("hidden"));document.querySelector("#"+b.dataset.tab).classList.remove("hidden")});
document.querySelector("#addWatch").onclick=()=>{const n=prompt("Carta a seguir");if(n){state.watch.push(n);save();render()}};
document.querySelector("#refresh").onclick=()=>{state.history.push({at:new Date().toISOString(),total:state.cards.reduce((a,x)=>a+x.value,0)});save();document.querySelector("#delta").textContent="Snapshot local guardado · "+new Date().toLocaleString("es-ES")};
render();