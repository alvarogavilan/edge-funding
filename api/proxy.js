const ALLOWED={
  ston:{host:"api.ston.fi",base:"https://api.ston.fi",paths:[/^\/v1\/assets\//,/^\/v1\/pools\//,/^\/v1\/swap\/simulate$/]},
  dedust:{host:"api.dedust.io",base:"https://api.dedust.io",paths:[/^\/v2\/pools$/]},
  fx:{host:"api.frankfurter.app",base:"https://api.frankfurter.app",paths:[/^\/latest$/]},
  lorcast:{host:"api.lorcast.com",base:"https://api.lorcast.com",paths:[/^\/v0\/cards\/search$/,/^\/v0\/sets$/,/^\/v0\/sets\/[^/]+\/cards$/]},
  tcgdex:{host:"api.tcgdex.net",base:"https://api.tcgdex.net",paths:[/^\/v2\//]}
};
const cors={
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
 "Access-Control-Allow-Headers":"Content-Type",
 "Cache-Control":"no-store"
};
module.exports=async function handler(req,res){
 Object.entries(cors).forEach(([k,v])=>res.setHeader(k,v));
 if(req.method==="OPTIONS")return res.status(204).end();
 const src=String(req.query.source||"");
 const path=String(req.query.path||"");
 const cfg=ALLOWED[src];
 if(!cfg||!cfg.paths.some(r=>r.test(path)))return res.status(400).json({ok:false,error:"source/path no permitido"});
 const qp=new URLSearchParams();
 for(const [k,v] of Object.entries(req.query)){
   if(k==="source"||k==="path")continue;
   if(Array.isArray(v))v.forEach(x=>qp.append(k,String(x))); else if(v!=null)qp.set(k,String(v));
 }
 const url=cfg.base+path+(qp.toString()?"?"+qp.toString():"");
 const ctl=new AbortController();
 const timer=setTimeout(()=>ctl.abort(),9000);
 try{
   const upstream=await fetch(url,{method:req.method==="POST"?"POST":"GET",headers:{"Accept":"application/json","User-Agent":"CardVault/98"},signal:ctl.signal});
   const text=await upstream.text();
   res.status(upstream.status);
   res.setHeader("Content-Type",upstream.headers.get("content-type")||"application/json; charset=utf-8");
   return res.send(text);
 }catch(e){
   return res.status(502).json({ok:false,error:String(e&&e.message||e),source:src});
 }finally{clearTimeout(timer)}
};