(()=>{
const CVMarket={
 providers:{
  cardmarket:{label:"Cardmarket",currency:"EUR",role:"primary-eu",notes:"Catálogo y guía pública descargable; compra siempre mediante URL exacta verificada."},
  tickermint:{label:"TickerMint",currency:"USD",role:"history-secondary",base:"https://api.tickermint.cards",attribution:"TickerMint",notes:"Fuente read-only secundaria para identidad, histórico y ventas cuando estén disponibles."}
 },
 normalizePrice(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:null},
 async tickerSearch(query,game){
  const g=game==="lorcana"?"lorcana":"pokemon",url=this.providers.tickermint.base+"/products/search?q="+encodeURIComponent(query)+"&game="+g;
  const res=await fetch(url,{headers:{Accept:"application/json"}});if(!res.ok)throw new Error("TickerMint HTTP "+res.status);const data=await res.json();return {provider:"tickermint",url,checkedAt:new Date().toISOString(),data};
 },
 async tickerProduct(id){
  const url=this.providers.tickermint.base+"/products/"+encodeURIComponent(id),res=await fetch(url,{headers:{Accept:"application/json"}});if(!res.ok)throw new Error("TickerMint HTTP "+res.status);return {provider:"tickermint",url,checkedAt:new Date().toISOString(),data:await res.json()};
 },
 async tickerPrices(id){
  const url=this.providers.tickermint.base+"/products/"+encodeURIComponent(id)+"/prices",res=await fetch(url,{headers:{Accept:"application/json"}});if(!res.ok)throw new Error("TickerMint HTTP "+res.status);return {provider:"tickermint",url,checkedAt:new Date().toISOString(),data:await res.json()};
 },
 cardmarketSearchUrl(name,universe="pokemon"){const root=universe==="lorcana"?"https://www.cardmarket.com/es/Lorcana/Products/Search?searchString=":"https://www.cardmarket.com/es/Pokemon/Products/Search?searchString=";return root+encodeURIComponent(name)},
 evidenceRecord(provider,url,raw){return {provider,url,checkedAt:new Date().toISOString(),raw}}
};
window.CVMarket=CVMarket;
})();