module.exports=async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Cache-Control","no-store");
 const targets=[
  ["ston","https://api.ston.fi/v1/assets/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"],
  ["dedust","https://api.dedust.io/v2/pools"],
  ["fx","https://api.frankfurter.app/latest?from=USD&to=EUR"]
 ];
 const out={ok:true,checkedAt:new Date().toISOString(),sources:{}};
 await Promise.all(targets.map(async([name,url])=>{
   const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),7000);
   try{const r=await fetch(url,{signal:ctl.signal,headers:{"Accept":"application/json"}});out.sources[name]={ok:r.ok,status:r.status}}
   catch(e){out.sources[name]={ok:false,error:String(e&&e.message||e)};out.ok=false}
   finally{clearTimeout(t)}
 }));
 res.status(200).json(out);
};