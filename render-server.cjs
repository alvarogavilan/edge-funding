const http=require("http");
const {URL}=require("url");
const ALLOWED={
 ston:{base:"https://api.ston.fi",paths:[/^\/v1\/assets\//,/^\/v1\/pools\//,/^\/v1\/swap\/simulate$/]},
 dedust:{base:"https://api.dedust.io",paths:[/^\/v2\/pools$/]},
 fx:{base:"https://api.frankfurter.app",paths:[/^\/latest$/]},
 lorcast:{base:"https://api.lorcast.com",paths:[/^\/v0\/cards\/search$/,/^\/v0\/sets$/,/^\/v0\/sets\/[^/]+\/cards$/]},
 tcgdex:{base:"https://api.tcgdex.net",paths:[/^\/v2\//]}
};
async function readBody(req){
 return await new Promise((resolve,reject)=>{
  let data="",size=0;
  req.on("data",chunk=>{size+=chunk.length;if(size>65536){reject(new Error("body too large"));return}data+=chunk});
  req.on("end",()=>resolve(data));
  req.on("error",reject);
 });
}
function send(res,status,body,type="application/json; charset=utf-8"){
 res.writeHead(status,{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store","Content-Type":type});
 res.end(body);
}
async function health(){
 const targets={ston:"https://api.ston.fi/v1/assets/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",dedust:"https://api.dedust.io/v2/pools",fx:"https://api.frankfurter.app/latest?from=USD&to=EUR"};
 const sources={};let ok=true;
 await Promise.all(Object.entries(targets).map(async([k,url])=>{
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),7000);
  try{const r=await fetch(url,{signal:ctl.signal,headers:{"Accept":"application/json"}});sources[k]={ok:r.ok,status:r.status};if(!r.ok)ok=false}
  catch(e){sources[k]={ok:false,error:String(e&&e.message||e)};ok=false}
  finally{clearTimeout(t)}
 }));
 return {ok,checkedAt:new Date().toISOString(),sources};
}
const server=http.createServer(async(req,res)=>{
 if(req.method==="OPTIONS")return send(res,204,"","text/plain");
 const u=new URL(req.url,"http://localhost");
 if(u.pathname==="/health"){const h=await health();return send(res,200,JSON.stringify(h))}
 if(u.pathname!=="/proxy")return send(res,404,JSON.stringify({ok:false,error:"not found"}));
 const src=u.searchParams.get("source")||"",path=u.searchParams.get("path")||"",cfg=ALLOWED[src];
 if(!cfg||!cfg.paths.some(r=>r.test(path)))return send(res,400,JSON.stringify({ok:false,error:"source/path no permitido"}));
 const qp=new URLSearchParams(u.searchParams);qp.delete("source");qp.delete("path");
 const target=cfg.base+path+(qp.toString()?"?"+qp.toString():"");
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),9000);
 try{
  const requestBody=req.method==="POST"?await readBody(req):undefined;
  const headers={"Accept":"application/json","User-Agent":"CardVault/98.2"};
  if(req.method==="POST")headers["Content-Type"]=req.headers["content-type"]||"application/json";
  const r=await fetch(target,{method:req.method==="POST"?"POST":"GET",headers,body:req.method==="POST"?requestBody:undefined,signal:ctl.signal});
  const responseBody=await r.text();return send(res,r.status,responseBody,r.headers.get("content-type")||"application/json; charset=utf-8");
 }catch(e){return send(res,502,JSON.stringify({ok:false,error:String(e&&e.message||e),source:src}))}
 finally{clearTimeout(t)}
});
const port=process.env.PORT||10000;
server.listen(port,()=>console.log("Card Vault bridge on",port));