# OpenRouteService (ORS)

> URL: https://github.com/GIScience/openrouteservice · API hospedada: https://openrouteservice.org · Classificação ROTEIA: **Routing/Matrix** — prioridade alta.

## Licença

**GPL-3.0** (grep confirmou GPL-3 no LICENSE do repo; a concessão é GPL-3.0). O projeto também distribui `LICENSE.LESSER` para partes específicas (dual GPL/LGPL por componente).

⚠️ **Implicação GPL-3 para self-host em produto fechado:** se fizermos modificações e redistribuirmos o ORS como serviço integrado, o GPL-3 pode exigir liberar o código do ORS sob GPL-3. Para o ROTEIA, opções seguras:
1. **API hospedada** (openrouteservice.org, free tier, ver abaixo) — sem copyleft na nossa base.
2. **Self-host como serviço separado** (container próprio, sem linkar ao nosso código) — o ROTEIA apenas o consome via HTTP; a interação por "agregate/independent works" não contamina o nosso produto.
3. Não modificar internamente o ORS e consumir via API.

## O que oferece

Serviços sobre OpenStreetMap (fork GraphHopper):
- **`directions`** — rota ponto a ponto com geometria GeoJSON e instruções.
- **`matrix`** — matriz de durações/distâncias entre pontos (nosso caso).
- **`geocoding`** — geocodificação/reverse (alternativa ao Nominatim — hoje usamos ORS no ROTEIA já é? Não: hoje `lib/maps/geocode.ts` usa ORS/Nominatim).
- **`isochrones`** — áreas de alcance.
- **`snap`**, **`elevation`**, **`optimization`** (VRP).

Perfis: `driving-car`, **`driving-hgv` (truck)**, `cycling-*`, `foot-*`, `wheelchair`.

## API hospedada (openrouteservice.org)

- **Free tier reajustado: ~7000+ requisições/dia** (site oficial 2026; limites por endpoint via conta HeiGIT).
- Restrições por endpoint (2026):
  - Optimization: **máx 50 rotas, 3 veículos** (suficiente p/ 1 veículo / <100 paradas).
  - Directions: **máx 50 waypoints**, 6000 km.
  - Matrix: **3.500 localizações** (ex.: 50×50), 25 com dynamic args.
  - Isochrones: máx 5.
- SDKs oficiais: **JS (`openrouteservice-js`)**, Python, R.

## Self-host (Docker)

O ORS roda em Docker com bundles de profile e preparação dos dados OSM (fingerprint). Ver fluxo de dados via Geofabrik (mesma base do OSRM). Custo de infra maior que OSRM; a vantagem são os perfis ricos (truck).

## Comparação rápida ORS vs OSRM (para o ROTEIA)

| Critério | OSRM | ORS |
|---|---|---|
| Licença | BSD-2 (permissiva) | GPL-3 (copyleft) |
| Perfis | car/foot/bicycle (Lua estático) | driving-car, **driving-hgv**, cycling, foot, wheelchair |
| Self-host | leve (binário C++) | Java/Docker + prep dados |
| Matriz | `/table` nativo | `/v2/matrix` |
| API hospedada | não oficial | sim, free ~7k/dia |

## Verdicto ROTEIA

**Alternativa de `RoutingEngine`** (especialmente quando precisar de perfil truck ou da API hospedada) e possível provider de geocoding. Preferência default continua **OSRM** (self-host, BSD-2, leve); usar ORS via **API hospedada** (free tier) ou serviço separado — nunca linkar modificações internas do ORS ao nosso código para não atrair GPL-3 sobre a base.