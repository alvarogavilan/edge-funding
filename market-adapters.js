(()=>{
const CVMarket={
 providers:{
  cardmarket:{label:"Cardmarket",currency:"EUR",role:"primary-eu",notes:"Catálogo y guía pública descargable; compra siempre mediante URL exacta verificada."},
  cardtrader:{label:"CardTrader",currency:"EUR",role:"marketplace-eu",base:"https://www.cardtrader.com/es",notes:"Marketplace TCG admitido para Pokemon y Lorcana; comparar producto exacto, estado e importe final."},
  metropolis:{label:"Metropolis Center",currency:"EUR",role:"retailer-es",base:"https://metropolis-center.com/es/",notes:"Tienda espanola con singles y sellado Pokemon/Lorcana; usar solo producto exacto y stock disponible."},
  tickermint:{label:"TickerMint",currency:"USD",role:"history-secondary",base:"https://api.tickermint.cards",attribution:"TickerMint",notes:"Fuente read-only secundaria para identidad, histórico y ventas cuando estén disponibles."}
 },
 admittedShop(url){try{const h=new URL(url).hostname.toLowerCase();if(h.includes("ebay."))return {ok:false,reason:"eBay excluido"};if(h==="www.cardmarket.com"||h.endsWith(".cardmarket.com"))return {ok:true,key:"cardmarket",label:"Cardmarket"};if(h==="www.cardtrader.com"||h.endsWith(".cardtrader.com"))return {ok:true,key:"cardtrader",label:"CardTrader"};if(h==="metropolis-center.com"||h.endsWith(".metropolis-center.com"))return {ok:true,key:"metropolis",label:"Metropolis Center"};return {ok:false,reason:"Tienda aun no incluida en lista verificada"}}catch{return {ok:false,reason:"URL invalida"}}},
 bestVerifiedOffer(identity){const n=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim(),rows=[...(state.euOffers||[]),...(state.gradedOffers||[])].filter(o=>{const a=this.admittedShop(o.url||"");if(!a.ok||String(o.currency||"EUR").toUpperCase()!=="EUR")return false;if(n(o.name)!==n(identity.name)||!n(o.set)||!n(identity.set)||n(o.set)!==n(identity.set)||!n(o.number)||!n(identity.number)||n(o.number)!==n(identity.number))return false;if(identity.language&&o.language&&n(identity.language)!==n(o.language))return false;if(identity.variant&&o.variant&&n(identity.variant)!==n(o.variant))return false;if(identity.finish&&o.finish&&n(identity.finish)!==n(o.finish))return false;return true}).map(o=>({...o,shop:o.shop||this.admittedShop(o.url).label,total:Number(o.total)||((Number(o.price)||0)+(Number(o.shipping)||0))||Infinity})).filter(o=>Number.isFinite(o.total)&&o.total>0).sort((a,b)=>a.total-b.total);return rows[0]||null},
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