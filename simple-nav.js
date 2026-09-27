(()=>{"use strict";
function mark(tab){document.body.dataset.activeTab=tab||"radar"}
mark(document.querySelector(".mainNav button.active")?.dataset.tab||"radar");
document.addEventListener("click",e=>{
 const nav=e.target.closest(".mainNav [data-tab]");if(nav)mark(nav.dataset.tab);
 const b=e.target.closest("[data-simple-tab]");if(!b)return;
 e.preventDefault();const id=b.dataset.simpleTab;
 const target=document.querySelector('.mainNav [data-tab="'+id+'"]');
 if(target){target.click();window.scrollTo({top:0,behavior:"smooth"})}
});
})();