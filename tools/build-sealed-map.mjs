// Genera vault-sealed-map.js: productos SELLADOS de Pokémon en Cardmarket (id, nombre, tipo, expansión) para que la app
// cruce sus precios con la guía oficial diaria. Ejecutar a mano (no es un workflow): node tools/build-sealed-map.mjs
// sin red: ZZ_DIR=carpeta (con products.json) node tools/build-sealed-map.mjs
// Categorías de Cardmarket incluidas (comprobadas por nombre de producto, 24/10/2026):
//   52 sobres · 53 cajas de sobres · 1016 Elite Trainer Box · 1015 colecciones · 1014 latas · 1083 blísteres ·
//   54 barajas temáticas · 1013 kits de entrenador. Excluidas: 1017 monedas, 1654 sets completos, 1064 lotes aleatorios.
import { readFileSync, writeFileSync } from 'node:fs';
const B = 'https://raw.githubusercontent.com/ZyzyThePizi/pokemon-price-data/main/', D = process.env.ZZ_DIR;
const prod = D ? JSON.parse(readFileSync(D + '/products.json', 'utf8')) : await (await fetch(B + 'prices/products.json')).json();
const CAT = { 52: 'Sobre', 53: 'Caja de sobres', 1016: 'Elite Trainer Box', 1015: 'Colección', 1014: 'Lata', 1083: 'Blíster', 54: 'Baraja temática', 1013: 'Kit de entrenador' };
const out = prod.rows.filter(r => CAT[r[3]]).map(r => [r[0], r[1], r[3], r[2]]);
const js = '/* Generado por tools/build-sealed-map.mjs el ' + new Date().toISOString().slice(0, 10) + ' · ' + out.length + ' productos sellados */\n' +
  'window.CV_SEALED_MAP=' + JSON.stringify({ cats: CAT, fields: ['idProduct', 'name', 'cat', 'idExpansion'], items: out }) + ';\n';
writeFileSync(new URL('../vault-sealed-map.js', import.meta.url), js);
console.log(out.length, 'productos sellados');
