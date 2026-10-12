(()=>{"use strict";
// Exact catalog references shipped with the app; never synthesize card artwork.
const manifest=window.CVCardImageManifest||{urls:{},cards:{}};
function entry(card){
 const e=manifest.cards[card?.id];
 return e&&(!e.expectedLanguage||e.expectedLanguage===String(card.language||""))&&["name","number","set"].every(k=>String(e[k]||"")===String(card[k]||""))?e:null;
}
function localUrl(url){return manifest.urls[url]||url||""}
function resolve(card,url){return entry(card)?.path||localUrl(url||card?.referenceImage||card?.image||"")}
const queued=new WeakSet();
function prepare(img){
 if(!(img instanceof HTMLImageElement))return;
 const original=img.getAttribute("src");if(!original)return;
 const card=img.dataset.autoCard?window.CVStateBridge?.get?.()?.cards?.find(c=>c.id===img.dataset.autoCard):null;
 const ref=entry(card),local=img.dataset.cvImageRetried?null:(ref?.path||manifest.urls[original]);
 if(local&&original!==local){img.dataset.cvOriginalImage=ref?.source||original;img.src=local}
 if(!queued.has(img)){queued.add(img);img.addEventListener("load",()=>{img.style.display="";img.removeAttribute("data-cv-image-error")});}
}
function hydrate(root=document){root.querySelectorAll("img").forEach(prepare)}
// Only retry the exact original URL. No alternate card, language or edition lookup.
document.addEventListener("error",event=>{
 const img=event.target;if(!(img instanceof HTMLImageElement))return;
 const original=img.dataset.cvOriginalImage;
 if(original&&!img.dataset.cvImageRetried){img.dataset.cvImageRetried="1";img.src=original;img.style.display="";return}
 img.dataset.cvImageError="1";
},true);
const observer=new MutationObserver(records=>{for(const r of records){
 if(r.type==="attributes")prepare(r.target);
 for(const n of r.addedNodes||[])if(n.nodeType===1){if(n.tagName==="IMG")prepare(n);hydrate(n)}
}});
observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});
window.CVCardImages={resolve,localUrl,entry,hydrate,manifest};
hydrate();
})();
