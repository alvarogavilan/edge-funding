/* Card Vault V104 · datos de partida.
   Identidades (nombre, número, rareza, imagen) contrastadas el 23/10/2026 con
   PokemonTCG/pokemon-tcg-data (GitHub). Enlaces TCGplayer de producto localizados en el buscador
   el 23/10/2026. NO contiene precios: desde el entorno de trabajo no se pudo abrir ningún anuncio
   ni ninguna venta en directo, y no se publican cifras sin fecha y fuente comprobables.
   Los precios, el stock y las ventas reales se añaden desde la propia app y quedan fechados. */
(()=>{"use strict";
const img=id=>"https://images.pokemontcg.io/"+id.replace("-","/")+"_hires.png";
const cm=id=>"https://prices.pokemontcg.io/cardmarket/"+id;
const tcg=id=>"https://prices.pokemontcg.io/tcgplayer/"+id;
const T=(id,name,set,number,rarity,o)=>({id:"rest-"+id,lane:"restaurar",game:"pokemon",ptcgId:id,name,set,number,rarity,language:"Inglés",image:img(id),
 links:{cardmarket:o.cm||cm(id),tcgplayer:o.tcg||tcg(id)},targetCondition:o.target||"HP / MP",why:o.why,source:"Identidad: pokemon-tcg-data · enlaces de producto"});
window.CV_VAULT_DATA={
 version:"V104",
 preparedAt:"2026-10-23T18:00:00+02:00",
 restoreTargets:[
  T("base1-4","Charizard","Base Set (Unlimited)","4/102","Holo rara",{cm:"https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Set/Charizard-V1-BS4",tcg:"https://www.tcgplayer.com/product/42382/pokemon-base-set-charizard",
   why:"La carta vintage con más demanda. Hay ejemplares dañados a la venta con frecuencia y muchas ventas cerradas en todos los estados, así que la salida se puede contrastar."}),
  T("base1-2","Blastoise","Base Set (Unlimited)","2/102","Holo rara",{tcg:"https://www.tcgplayer.com/product/42360/pokemon-base-set-blastoise",
   why:"Inicial clásica de Base Set con demanda estable. Diferencia de precio amplia entre Damaged y Moderately Played."}),
  T("base1-15","Venusaur","Base Set (Unlimited)","15/102","Holo rara",{
   why:"Completa el trío de iniciales de Base Set; los coleccionistas la buscan junto a Charizard y Blastoise."}),
  T("base5-4","Dark Charizard","Team Rocket","4/82","Holo rara",{tcg:"https://www.tcgplayer.com/product/84572/pokemon-team-rocket-dark-charizard-4",
   why:"Charizard holográfico de 2000 con precio de entrada más bajo que Base Set; mucha rotación de ejemplares jugados."}),
  T("neo1-9","Lugia","Neo Genesis (Unlimited)","9/111","Holo rara",{tcg:"https://www.tcgplayer.com/product/86903/pokemon-neo-genesis-lugia",
   why:"Holo de Neo con fuerte demanda; los ejemplares muy jugados son frecuentes por su uso en partidas de la época."}),
  T("neo4-107","Shining Charizard","Neo Destiny","107/105","Shining (secreta)",{
   why:"Carta secreta muy buscada. Los ejemplares deteriorados tienen precio muy inferior a los conservados."}),
  T("ex7-96","Rocket's Articuno ex","EX Team Rocket Returns","96/109","Holo EX",{cm:"https://www.cardmarket.com/en/Pokemon/Products/Singles/EX-Team-Rocket-Returns/Rockets-Articuno-ex-TRR96",tcg:"https://www.tcgplayer.com/product/88768/pokemon-ex-team-rocket-returns-rockets-articuno-ex",
   why:"EX de la era 2004 con demanda alta y pocas copias en buen estado. Ya estudiada en V101: se buscan ejemplares Poor."}),
  T("ex6-105","Charizard ex","EX FireRed & LeafGreen","105/112","Holo EX",{
   why:"Charizard ex de 2004, de los EX con mayor demanda. Los bordes y la superficie holográfica se desgastan con facilidad."}),
  T("ex8-107","Rayquaza ★","EX Deoxys","107/107","Gold Star",{
   why:"Gold Star de un legendario popular. Las Gold Star dañadas se negocian muy por debajo de las conservadas."}),
  T("ex13-104","Pikachu ★","EX Holon Phantoms","104/110","Gold Star",{tcg:"https://www.tcgplayer.com/product/88082/pokemon-holon-phantoms-pikachu",
   why:"Pikachu Gold Star: una de las cartas con más demanda de la era EX. Incluso dañada mantiene interés."}),
  T("ex7-108","Torchic ★","EX Team Rocket Returns","108/109","Gold Star",{
   why:"Gold Star con precio de entrada más bajo que Rayquaza o Pikachu: buena candidata para empezar la línea."}),
  T("ex10-112","Umbreon ex","EX Unseen Forces","112/115","Holo EX",{
   why:"Eeveelución con demanda constante entre coleccionistas; los EX de Unseen Forces tienen pocas copias en buen estado."})
 ]
};
})();
