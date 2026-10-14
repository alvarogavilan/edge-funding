# Phygitals · evidencia real, pruebas y detector (14/10/2026)

Reproducir: `python3 tools/phygitals_evidence.py` (semilla 20261014) · `node tests/phygitals-detector.test.cjs`.
Datos: `research/phygitals-data/` (raw = capturas transcritas; ripranks = agregados por pack; out = CSV/JSON generados).

## 1. Qué se ha obtenido realmente

| Tipo | Cantidad | Calidad | Fuente |
|---|---:|---|---|
| Aperturas individuales (carta, pack, valor, antigüedad relativa) | 118 | C: feed público, sin tx, sin hora absoluta; 2 posibles duplicados marcados | PackSpy (vistas pokemon / onepiece / all) |
| Aperturas individuales (carta, categoría, valor) | 50 | D: sin pack ni hora | RipRanks /live |
| **Total filas individuales** | **168** | **0 con firma Solana, 0 con segundo UTC, 0 con posición elegida** | `out/phygitals-openings.csv` |
| Aperturas agregadas por nivel de rareza (11 packs ≤50 $) | 460.173 | B: recuento publicado por tercero a partir del feed de Phygitals | ripranks.com/card-rip-sites/phygitals/packs/<slug> |
| Series diarias (20/08–08/10/2026, 50 días por pack) | 11 packs | B | idem |
| Catálogo oficial (EV, recompra, odds, stock, num_pulls_7d) | 40 objetos (truncado) | A, transcrito | api.phygitals.com/api/vm/available, 13/10 23:45 UTC |

Bloqueos reales de esta sesión: el shell no tiene salida a api.phygitals.com, rip-index.com, vollector.id ni RPC de Solana (403 de política de red). La lectura web funciona, pero solo devuelve la página renderizada. No se ha obtenido ningún registro on-chain verificable: la colección Phygitals es `BSG6DyEihFFtfvxtL9mKYsvTwiZXB1rq5gARMTJC2xAM` (OKX), pero la cartera-vault que sigue RipIndex no está publicada y las APIs de indexadores requieren POST o clave. La página /fairness solo muestra pruebas de la propia cuenta autenticada.

## 2. ¿La posición elegida afecta al resultado? — No (documental + API)
- La API oficial `POST /vm/buy/crypto` devuelve la carta (`nfts[].id`) y su `buyback_price` en la respuesta de compra: el resultado existe antes de cualquier animación.
- docs.phygitals.com/platform-features/provable-fairness: la semilla del servidor se publica (hash SHA-256) antes de cualquier elección y el resultado está determinado antes de abrir.
- ToS §8: la carta es aleatoria y no preseleccionable; existe auto-revelado.
Conclusión: tocar una posición solo revela. No se ha visto el código cliente; para la interfaz web no hay contraejemplo.

## 3. Pruebas estadísticas ejecutadas

### 3.1 Odds anunciadas vs observadas (χ², corrección de Holm, 11 packs)
| Pack | n | p Holm | Hallazgo |
|---|---:|---:|---|
| Trainer 10 $ | 205.089 | 6e-62 | Mythic (50–200 $) 0,65 % [0,62–0,69] vs 1 % anunciado → **35 % menos premios altos**; Legendary 9,4 % vs 9 % |
| Pirate 10 $ | 22.472 | 2e-6 | Mythic 12,9 % [12,5–13,4] vs 14,1 % |
| Rookie Sport 25 $ | 12.446 | 3e-24 | Epic 1,75 % y Mythic 0,55 % por encima de 1 %/0,3 %: las odds de referencia (09/09) probablemente cambiaron |
| Rookie Pokémon 25 $ | 100.808 | 0,0014 | desviación mínima (V=0,008), sin efecto económico |
| Resto (7) | — | >0,09 | compatibles con lo anunciado |
Interpretación prudente: los niveles se clasifican por valor de mercado (FMV) en el momento de la apertura; revalorizaciones de cartas o cambios de odds durante la ventana pueden explicar desviaciones. No demuestra manipulación.

### 3.2 Patrones temporales (entrenamiento = primeros 25 días, validación = últimos ~25, Holm sobre 22 contrastes)
- Rachas diarias (autocorrelación lag-1 de residuos ponderados): Trainer significativa en entrenamiento (r=0,72, p=0,0002) → en validación r=0,22, p=0,106 → **no supera**. Resto no significativos en entrenamiento.
- Mejor día de la semana elegido en entrenamiento: ninguno se repite en validación (mejor p bruto 0,078, Pirate).
- **Patrones validados: 0.** Hora, minuto, segundo y número de apertura: **no comprobables**, no existe dato con esa resolución; no se ha inventado.

### 3.3 Cambios de régimen (máximo estadístico con permutación, Holm)
- **Pirate Pack: caída desde 17/09/2026**, de ~92 % a ~72 % de valor devuelto (p Holm 0,011). Único cambio significativo. Compatible con cambio de inventario o de valoraciones.

### 3.4 Coherencia de fuentes
PackSpy (ventana 3 días) vs RipRanks (50 días): proporción de aperturas que cubren el precio Elite 49 % vs 30,5 % (z=7,6), Trainer 18 % vs 31,6 % (z=−13). Las muestras pequeñas de PackSpy no son representativas: medias como «Starter One Piece 190 %» son ruido de cola o sesgo del feed.

## 4. Oportunidades económicas
Retorno en efectivo = valor observado × recompra publicada (IC95 por bootstrap de días):

| Pack | Recompra | Operador (EV×recompra) | Observado en efectivo | Últimos 14 d | Veredicto |
|---|---:|---:|---|---:|---|
| Elite Riftbound 50 $ | 100 % | 93,0 % | 109,1 % [91,0–137,9] | 117,8 % | NO COMPRAR: IC incluye pérdida; n=2.269 |
| Trainer 10 $ | 100 % | — | 94,9 % [94,2–95,5] | 93,8 % | NO |
| Basketball Starter 50 $ | 85 % | — | 96,3 % [88,2–106,3] | 92,1 % | NO |
| Rookie Pokémon 25 $ | 85 % | 88,9 % | 91,3 % [88,9–93,8] | 89,6 % | NO |
| Elite Pokémon 50 $ | 85 % | 86,1 % | 89,8 % | 89,2 % | NO |
| Starter One Piece 25 $ | 85 % | — | 89,1 % | 84,6 % | NO |
| Elite One Piece 50 $ | 85 % | 85,8 % | 88,3 % | 82,6 % | NO |
| Pirate 10 $ | 100 % | — | 86,8 % | 76,8 % | NO |
| Boost Sport 5 $ | 100 % | 60,6 % | 83,6 % | 83,4 % | NO |

- Ningún pack ≤50 $ tiene efectivo esperado >100 % demostrado. Coincide con RipIndex (cash-out negativo en todos).
- Puntos (+100 por dólar): sin valor en efectivo publicado → no cuentan.
- Recompras potenciadas: la documentación las prevé con insignia; en el catálogo transcrito `sellback_rewards_amounts` está vacío. Ninguna vigente detectada.
- Pack Party: la regla oficial dice reparto aleatorio al llenarse; no consta si una persona puede comprar todas las plazas ni si hay recompra para esas cartas. Sin una party concreta visible, 0 oportunidades confirmadas. El motor `phygitals-party-arbitrage.js` la evalúa si se introducen datos reales.

## 5. Integración en la app
`phygitals.html` → sección «Semáforo con evidencia real» (`phygitals-detector.js`, `phygitals-evidence-ui.js`, `phygitals-evidence-data.json`). Reglas: pack aleatorio nunca «COMPRA YA»; «REVISAR» exige margen del operador positivo **y** evidencia independiente (IC95 inferior >100 % en efectivo, 14 días >100 %, sin caída de régimen ni déficit del nivel alto); «COMPRA YA» solo con puja firme verificada <15 min o Pack Party completa con pujas firmes. Estado actual: 0 COMPRA YA · 0 REVISAR · 11 NO COMPRAR.

## 6. Lo que sigue sin pruebas
- Patrones por hora/minuto/segundo/número de apertura y por posición: sin datos con esa resolución (0 filas).
- Desviación de odds verificada con transacciones: solo agregados de tercero.
- Para avanzar de verdad: (1) exportar tus propias aperturas desde /fairness con sesión iniciada (semillas + resultado + hora), (2) obtener la dirección de la cartera-vault para leer Solana con un RPC gratuito desde tu Worker, (3) seguir el Pirate Pack y el Trainer Mythic con nuevas capturas.
