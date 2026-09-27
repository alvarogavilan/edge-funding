(()=>{"use strict";
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-simple-tab]");if(!b)return;
 e.preventDefault();const id=b.dataset.simpleTab;
 const target=document.querySelector('.mainNav [data-tab="'+id+'"]');
 if(target){target.click();window.scrollTo({top:0,behavior:"smooth"})}
});
})();