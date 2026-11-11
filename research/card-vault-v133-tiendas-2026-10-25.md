# Card Vault V133 · Comparador de puntos de compra que llegan a 41020 (25/10/2026)

## Qué se ha investigado
| Vía | ¿Llega a 41020? | ¿Precio real en la app? | ¿Garantía/autenticidad? |
|---|---|---|---|
| **Cardmarket**, ficha solo japonesa | Sí. Vendedores de la UE y de Japón | Sí: guía oficial diaria | Protección al comprador y reclamación. IVA cobrado al pagar en pedidos de fuera de la UE de menos de 150 € (IOSS, desde 2026) |
| **CardTrader** (con tu token) | Sí. CardTrader Zero reúne en Italia y envía | Sí: cada anuncio con idioma, estado y país | Zero revisa cada carta en su almacén (idioma, estado, edición). Sin aduana adicional según su FAQ |
| **Zenpan EU** (Lisboa) | Sí. Stock en Portugal | Si la tienda lo permite desde el iPhone (Shopify) | Tienda de japonesas. IVA incluido, sin aduana |
| **Zenpan Japan** | Sí. Envío internacional con seguimiento | Igual que la anterior | Tienda en Japón. Al llegar: IVA, arancel de 3 € y gestión |
| **Hareruya2** | Por confirmar en su carrito. Su tienda de Magic envía a Europa solo por EMS desde junio de 2026 | Igual que la anterior | Gran tienda japonesa de Pokémon |
| **Suruga-ya** (web global) | Sí. DHL, EMS o SAL, con ¥900 de gestión | No: sin buscador legible | Cadena japonesa desde 1948. Precios 10–25 % más altos que en su web japonesa, según una reseña |
| **Mercari / Yahoo vía Buyee** | Sí. Buyee cobra ¥500 por pedido | No: sin acceso público | Particulares. Más riesgo de falsas y sin la protección de Cardmarket |

**Límite técnico.** Una página web solo puede leer otra web si esa web lo permite (CORS). Desde este entorno no se ha
podido abrir ninguna tienda para comprobarlo. Por eso la app lo prueba **desde tu iPhone** con «Probar tiendas ahora»,
en Estado de las fuentes:
- si una tienda deja leer su buscador, sale su precio real;
- si no, sale su enlace de búsqueda y la calculadora. Nunca un precio inventado.

## Lo que hace la app
- **«Dónde comprarla más barata»**, en cada carta. Reúne todas las vías y las **ordena por lo que pagas en total en
  41020**:
  - **Cardmarket:** precio más envío.
  - **CardTrader:** precio más envío. En las japonesas usa solo anuncios en japonés; en las demás, en inglés.
  - **Tiendas leídas en vivo:**
    - en la UE: precio más un envío estimado;
    - desde Japón: precio más EMS, arancel de 3 €, IVA del 21 % y gestión.
  - **Las tiendas que no se pueden leer y Buyee:** enlace y aviso, sin precio.

  Marca la más barata con su enlace directo al producto.
- **«🇯🇵 Comprar japonesas» → «Comparar en tiendas y CardTrader»:** busca esa carta en todas las vías y dice cuál es
  la más barata fuera de Cardmarket.
- **Lo encontrado en vivo entra en las oportunidades y en el Top 5**, por ejemplo «Pagas 156 € (Zenpan EU) → +83 €».
- **Solo cuenta lo comparable:** anuncios disponibles, mismo número de carta, mismo idioma y por encima del 30 % de su
  valor (anti-proxy).
- **CardTrader encuentra la colección japonesa por su código** (p. ej. M2a) y nunca usa la edición internacional ni
  anuncios coreanos.

## Pruebas
- tests/v133-tiendas-e2e.cjs (10 comprobaciones). Simula:
  - una tienda que se deja leer en euros y otra en yenes;
  - una tienda que bloquea (Hareruya2);
  - CardTrader con un anuncio japonés y otro coreano;
  - un producto agotado y otro número de carta.
- Toda la batería anterior sigue en verde.

## Fuentes
- Zenpan EU, almacén en Lisboa, IVA incluido: https://zenpan-eu.com/pages/about-us
- Zenpan Japan, envío internacional: https://zenpan-japan.com/
- Suruga-ya, gastos de envío internacional: https://www.suruga-ya.com/en/qa-detail/109
- Reseña de Suruga-ya global: https://microsounds.github.io/notes/suruga-ya-intl.htm
- Hareruya, envíos a Europa solo por EMS: https://www.hareruyamtg.com/en/user_data/international_shipping_suspension_202603
- CardTrader Zero: https://www.cardtrader.com/en/pages/zero
- API de CardTrader: https://www.cardtrader.com/en-EU/docs/api/full/reference
- Cardmarket, IVA en importaciones: https://help.cardmarket.com/en/TaxRequirements
- Buyee, planes y comisiones: https://buyee.jp/helpcenter/guide/plans?lang=en
