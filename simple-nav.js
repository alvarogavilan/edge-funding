(()=>{"use strict";
function mark(tab){document.body.dataset.activeTab=tab||"radar"}
function showTab(id){
 const target=document.getElementById(id);if(!target)return;
 document.querySelectorAll("main .tab").forEach(x=>x.classList.add("hidden"));
 target.classList.remove("hidden");
 document.querySelectorAll(".mainNav [data-tab]").forEach(x=>x.classList.toggle("active",x.dataset.tab===id));
 mark(id);
 if(id==="collection"){
  const u=document.querySelector("#collectionUniverse"),t=document.querySelector("#filterType"),q=document.querySelector("#searchCards");
  if(u)u.value="";if(t)t.value="";if(q)q.value="";
  try{window.CVRenderCollection?.()}catch{}
  setTimeout(()=>{try{window.CVRenderCollection?.()}catch{}},50);
 }
}
const validTab=id=>!!id&&!!document.getElementById(id)&&!!document.querySelector('.mainNav [data-tab="'+CSS.escape(id)+'"]');
const initialHash=decodeURIComponent(location.hash.replace(/^#/,""));
const initialTab=validTab(initialHash)?initialHash:(document.querySelector(".mainNav button.active")?.dataset.tab||"radar");
mark(initialTab);
setTimeout(()=>showTab(initialTab),0);
window.addEventListener("hashchange",()=>{const id=decodeURIComponent(location.hash.replace(/^#/,""));if(validTab(id))showTab(id)});
document.addEventListener("click",e=>{
 const nav=e.target.closest(".mainNav [data-tab]");
 if(nav){e.preventDefault();showTab(nav.dataset.tab);if(location.hash!=="#"+nav.dataset.tab)history.replaceState(null,"","#"+nav.dataset.tab)}
 const b=e.target.closest("[data-simple-tab]");if(!b)return;
 e.preventDefault();showTab(b.dataset.simpleTab);if(location.hash!=="#"+b.dataset.simpleTab)history.replaceState(null,"","#"+b.dataset.simpleTab);window.scrollTo({top:0,behavior:"smooth"});
});
window.CVSimpleNav={showTab};
})();