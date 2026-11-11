# Card Vault V132 · Japonesas con precio real y la web sin saltos (25/10/2026)

## 1. «Al desplegar chollos o punto de mira se queda colgada y me desplaza»
**Causa.** Al abrir la app, la comprobación de versiones con pokemontcg.io recorre cientos de colecciones y, en el iPhone,
tarda minutos. Cada vez que terminaba una colección, la app rehacía toda la sección Compra YA, más o menos cada 2 s.
Al rehacerla pasaban tres cosas:
- se volvían a abrir los desplegables que tenían «abierto» por defecto, aunque los hubieras cerrado;
- cambiaba la altura de lo que hay encima, así que la página se movía;
- el iPhone iba a tirones.

La prueba nueva lo reproduce con la versión anterior: en 12 s hay 7 repintados y la página baja 175 px.

**Arreglo.**
- Los repintados en segundo plano se hacen como mucho cada 8 s, y nunca mientras tocas, desplazas o escribes (esperan
  2,5 s de calma).
- Cada desplegable se queda como lo dejaste, abierto o cerrado.
- La página se mantiene anclada en lo que estás viendo.

Con la versión nueva, en 12 s hay 1 repintado, 0 px de desplazamiento y 0 repintados mientras desplazas
(tests/v132-fluidez-e2e.cjs).

Con la guía real del 25/10, el verificador independiente comprobó 3.000 precios de japonesas contra la guía oficial: 0 errores.

## 2. «Importar de Japón» no servía para comprar
El panel anterior calculaba un «máximo a pagar en Japón» y enlazaba búsquedas de Mercari. No enseñaba ni una carta en
venta ni un precio real, así que se quita. Nada de lo que hay ahora usa precios inventados.

### Qué se puede comprobar de verdad
**Cardmarket, ficha solo japonesa.**
- El precio es el anuncio real más barato de hoy, de la guía oficial.
- Cardmarket envía a 41020.
- Para vendedores de fuera de la UE con pedidos de menos de 150 €, Cardmarket cobra el IVA antes de pagar (IOSS, desde
  enero de 2026). Además, la UE cobra un arancel de 3 € por paquete pequeño desde el 1/7/2026.
- Tiene protección al comprador: si la carta llega falsa, se reclama.

La app enseña el precio real, lo que pagas con envío, la venta de japonesas, el beneficio y en qué estado puede estar la
carta. El enlace lleva a la ficha japonesa exacta. El verificador independiente comprueba cada precio contra la guía.

### Qué no se puede comprobar desde la app (y por qué)
- **Tiendas japonesas (Hareruya2, Card Rush), Mercari y Yahoo vía Buyee.** No tienen acceso público a sus precios desde el
  navegador. Desde este entorno, hareruya2.com ni siquiera resuelve. No se inventan precios: hay una **calculadora**.
  Escribes el precio en yenes que ves y te da el total puesto en 41020 y el beneficio:

  total = (precio + envío en Japón + Buyee ¥500) × cambio del BCE + EMS + arancel 3 € + IVA 21 % sobre todo eso + gestión
  del transportista

  - EMS: mínimo ¥3.450 (Japan Post, tarifa publicada por Hareruya en 2024; sube con el peso).
  - Buyee: ¥500 por pedido desde el 1/4/2026.
  - Todos los gastos se pueden editar.
- **CardTrader Zero.** CardTrader revisa en su almacén de Italia cada carta comprada por Zero: idioma, estado y edición.
  Es lo más parecido a una comprobación de autenticidad, pero no se ha podido probar su API desde aquí ni casar sus
  colecciones japonesas. No se ha añadido automático. Sigue disponible para cartas internacionales en inglés (V131).

### Autenticidad
Ninguna app puede certificar una carta sin verla. Lo que sí hace la app:
- recomienda comprar solo dentro de Cardmarket, que tiene reclamación;
- revisa la descripción con «🔎 ¿Es proxy?»;
- aplica el suelo del 30 % de su valor;
- incluye una guía para comprobar la carta antes y al recibirla: código y número, tipografía, holo, reverso y grosor;
- recuerda comprobar el número de certificado en las graduadas.

## Fuentes
- Cardmarket, IVA en importaciones de vendedores de fuera de la UE: https://help.cardmarket.com/en/TaxRequirements
- Comisión Europea, arancel de 3 € desde el 1/7/2026: https://commission.europa.eu/news-and-media/news/ensuring-fairness-and-safety-eur3-customs-duty-low-value-parcels-2026-06-29_en
- Buyee, planes y comisiones: https://buyee.jp/helpcenter/guide/plans?lang=en
- Hareruya, envíos a Europa solo por EMS desde junio de 2026: https://www.hareruyamtg.com/en/user_data/international_shipping_suspension_202603
- Hareruya, EMS desde ¥3.450: https://x.com/hareruyaEnglish/status/1775402867160998002
- CardTrader Zero, revisión de las cartas en su almacén: https://www.cardtrader.com/en/pages/zero
