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
mark(document.querySelector(".mainNav button.active")?.dataset.tab||"radar");
document.addEventListener("click",e=>{
 const nav=e.target.closest(".mainNav [data-tab]");
 if(nav){e.preventDefault();showTab(nav.dataset.tab)}
 const b=e.target.closest("[data-simple-tab]");if(!b)return;
 e.preventDefault();showTab(b.dataset.simpleTab);window.scrollTo({top:0,behavior:"smooth"});
});
window.CVSimpleNav={showTab};
})();