# Card Vault · Recolector de mercado (Cloudflare Worker)

Guarda **cada día** el precio de referencia de todo el catálogo Pokémon y Lorcana, las **ofertas reales de CardTrader** (con enlace, vendedor, idioma, condición y CardTrader Zero) de lo que vigilas, y **verifica certificados PSA**. Card Vault lo lee para mostrar históricos, zonas (baja/media/alta) y la mejor oferta fiable.

Coste: **0 €** con el plan gratuito de Cloudflare (Workers + D1).

## Qué datos guarda y qué significan

| Fuente | Qué aporta | Tipo de dato |
|---|---|---|
| TCGdex | Pokémon: tendencia y medias de Cardmarket (EUR) y precio de mercado de TCGplayer (USD) | Referencia **agregada**, no venta |
| Lorcast | Lorcana: precio TCGplayer normal y foil (USD) | Referencia **agregada**, no venta |
| CardTrader (tu token) | Ofertas reales ejecutables, también japonés y sellado. Histórico del ask más bajo NM | **Ask real** (precio pedido), no venta |
| PSA Public API (tu token) | Verificación de certificados (100 consultas/día) | Dato oficial PSA |
| Frankfurter (BCE) | Cambio USD→EUR diario | Oficial BCE |

No se usa eBay. Cardmarket no ofrece API abierta y extraer datos de su web va contra sus condiciones: aparece solo como enlace de búsqueda.

El histórico empieza el día que actives el recolector. Las zonas necesitan **≥30 días** de datos.

## Instalación desde el iPhone (≈10 minutos)

1. **Base de datos D1** — dash.cloudflare.com → *Storage & Databases* → *D1* → **Create** → nombre `cardvault-market`.
2. **Worker** — *Workers & Pages* → **Create** → *Worker* → nombre `cardvault-market` → **Deploy**.
3. **Código** — en el Worker: **Edit code** → borra todo y pega el contenido de `worker.js` (del ZIP o de https://raw.githubusercontent.com/alvarogavilan/edge-funding/main/market-worker/worker.js) → **Deploy**.
4. **Conectar D1** — *Settings* → *Bindings* → **Add** → *D1 database* → nombre de variable **`DB`** → elige `cardvault-market`.
5. **Variables y secretos** — *Settings* → *Variables and Secrets*:
   - Secreto **`CV_KEY`**: una clave larga inventada por ti (la pondrás también en Card Vault).
   - Secreto **`CARDTRADER_TOKEN`**: CardTrader → tu perfil → *Settings* → *API* → token. (Opcional, pero sin él no hay ofertas ni japonés/sellado.)
   - Secreto **`PSA_TOKEN`**: psacard.com → *Public API* → genera token. (Opcional.)
   - Texto **`ALLOWED_ORIGIN`** = `https://alvarogavilan.github.io`
   - Texto **`BATCH`** = `30`
6. **Programación** — *Settings* → *Triggers* → *Cron Triggers* → **Add** → `*/2 * * * *` (cada 2 minutos).
7. **Card Vault** — pestaña *Hoy* → *Mercado controlado* → **Conectar recolector** → pega la URL del Worker (`https://cardvault-market.<tu-subdominio>.workers.dev`) y tu `CV_KEY`.

Comprobación: abrir la URL del Worker debe mostrar `Card Vault Market Collector 1.0.0 · OK`.

## Primeros días

- Día 1: tipo de cambio, Lorcana completo y catálogo Pokémon; los precios Pokémon se completan durante el día (primero lo que vigilas).
- Días 1–4: catálogo de fichas de CardTrader (para vincular ofertas).
- A partir de 30 días: zonas BAJA / MEDIA / ALTA fiables. Con 180 días la zona usa el rango semestral.

## Vincular cartas

En *Mercado controlado → Vincular*: busca cada carta (mejor por su nombre en inglés) y confirma la ficha exacta (set y número). Después confirma su ficha de CardTrader para recibir ofertas. Nada se vincula sin tu confirmación.

## Límites y soluciones

- Plan gratuito: 10 ms de CPU por ejecución. Si en *Logs* ves «exceeded CPU», baja `BATCH` a `15`.
- D1 gratuito: 100.000 filas escritas/día; el recolector se limita solo a ~90.000.
- `/api/status` (con cabecera `x-cv-key`) muestra días de histórico, productos, ofertas y últimas ejecuciones.
