const ALLOWED={
  ston:{host:"api.ston.fi",base:"https://api.ston.fi",paths:[/^\/v1\/assets\//,/^\/v1\/pools\//,/^\/v1\/swap\/simulate$/]},
  dedust:{host:"api.dedust.io",base:"https://api.dedust.io",paths:[/^\/v2\/pools$/]},
  fx:{host:"api.frankfurter.app",base:"https://api.frankfurter.app",paths:[/^\/latest$/]},
  lorcast:{host:"api.lorcast.com",base:"https://api.lorcast.com",paths:[/^\/v0\/cards\/search$/,/^\/v0\/sets$/,/^\/v0\/sets\/[^/]+\/cards$/]},
  tcgdex:{host:"api.tcgdex.net",base:"https://api.tcgdex.net",paths:[/^\/v2\//]}
};
const APP_ORIGIN="https://alvarogavilan.github.io";
function setCors(req,res){
 const origin=String(req.headers.origin||"");
 if(origin&&origin!==APP_ORIGIN)return false;
 res.setHeader("Access-Control-Allow-Origin",origin||APP_ORIGIN);
 res.setHeader("Vary","Origin");
 res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 res.setHeader("Cache-Control","no-store");
 return true;
}
module.exports=async function handler(req,res){
 if(!setCors(req,res))return res.status(403).json({ok:false,error:"origen no permitido"});
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
   const method=req.method==="POST"?"POST":"GET";
   const headers={"Accept":"application/json","User-Agent":"CardVault/98.2"};
   if(req.method!=="GET"&&req.method!=="POST")return res.status(405).json({ok:false,error:"método no permitido"});
   if(method==="POST"&&(src!=="ston"||path!=="/v1/swap/simulate"))
     return res.status(405).json({ok:false,error:"POST no permitido para esta ruta"});
   let requestBody;
   if(method==="POST"){
     headers["Content-Type"]=String(req.headers["content-type"]||"application/json");
     requestBody=Buffer.isBuffer(req.body)?req.body.toString("utf8"):typeof req.body==="string"?req.body:JSON.stringify(req.body??{});
     if(Buffer.byteLength(requestBody,"utf8")>65536)return res.status(413).json({ok:false,error:"cuerpo demasiado grande"});
   }
   const upstream=await fetch(url,{method,headers,body:requestBody,signal:ctl.signal});
   const text=await upstream.text();
   res.status(upstream.status);
   res.setHeader("Content-Type",upstream.headers.get("content-type")||"application/json; charset=utf-8");
   return res.send(text);
 }catch(e){
   return res.status(502).json({ok:false,error:String(e&&e.message||e),source:src});
 }finally{clearTimeout(timer)}
};