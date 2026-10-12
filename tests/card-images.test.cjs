const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const manifest=JSON.parse(fs.readFileSync('card-image-manifest.json','utf8'));
const listeners={};
class Img {constructor(src){this.src=src;this.dataset={};this.style={};}getAttribute(k){return this[k];}addEventListener(){}removeAttribute(){}}
const ctx={window:{CVCardImageManifest:manifest},HTMLImageElement:Img,document:{documentElement:{},querySelectorAll:()=>[],addEventListener:(k,f)=>listeners[k]=f},MutationObserver:class{observe(){}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('card-images.js','utf8'),ctx);
const api=ctx.window.CVCardImages;
for(const [id,e] of Object.entries(manifest.cards)){
 const card={id,name:e.name,number:e.number,set:e.set,language:e.expectedLanguage||""};
 assert.equal(api.resolve(card),e.path,id);
 assert.equal(api.entry({...card,number:'wrong-print'}),null,'Never replace another printing');
 if(e.expectedLanguage)assert.equal(api.entry({...card,language:'wrong-language'}),null,'Never change a documented collection language');
 assert.ok(fs.existsSync(e.path),e.path);assert.ok(fs.statSync(e.path).size>1000,e.path);
}
for(const [url,path] of Object.entries(manifest.urls)) {assert.ok(!/ebay/i.test(url));assert.ok(fs.existsSync(path));}
const [source,local]=Object.entries(manifest.urls)[0];const img=new Img(source);
api.hydrate({querySelectorAll:()=>[img]});assert.equal(img.src,local);
listeners.error({target:img});assert.equal(img.src,source);
api.hydrate({querySelectorAll:()=>[img]});assert.equal(img.src,source,'Never loop between failed local and original');
listeners.error({target:img});assert.equal(img.dataset.cvImageError,'1');
assert.ok(manifest.cards['own-surfing-pikachu-mt-fuji-jr-1997']);
console.log('card-images: exact identities, bundled files and bounded retry OK');
