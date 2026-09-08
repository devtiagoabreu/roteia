# OSRM — Open Source Routing Machine

> URL: https://github.com/Project-OSRM/osrm-backend · Site: http://project-osrm.org · Demo: http://map.project-osrm.org
> Classificação ROTEIA: **Routing / matriz (backend de custos)** — prioridade máxima do estudo.

## Licença

**BSD-2-Clause.** Permissiva — compatível com uso comercial/self-host. (Os dados OSM são ODbL 1.0 — citar atribuição: https://download.geofabrik.de/south-america/brazil.html.)

## O que resolve / modelo matemático

Motor de roteamento de alta performance sobre OpenStreetMap — **não é otimizador de frota**. Serviços HTTP:

| Serviço | Uso no ROTEIA |
|---|---|
| **`route`** | caminho mais rápido na ordem dada (ETA, geometria, instruções `steps=true`) |
| **`table`** | **matriz de durações/distâncias entre todos os pares — nosso caso de uso** (backend do VROOM) |
| `nearest` | snap de coordenada na rede |
| `match` | map-matching de trilhas GPS ruidosas |
| `trip` | TSP greedy "farthest-insertion" (aproximação, sem constraints — **não usar** como otimizador) |
| `tile` | vector tiles do grafo (debug) |

Algoritmos: **Contraction Hierarchies (CH)** e **Multi-Level Dijkstra (MLD)**. MLD = default recomendado; CH ainda melhor p/ matrizes de distância muito grandes.

Perfis de velocidade são definidos **estaticamente** via Lua na etapa `extract`: `car.lua`, `foot.lua`, `bicycle.lua`. **Não há `truck.lua` oficial** — para caminhão customizar `car.lua`.

## Arquitetura

- **Linguagem:** C++20 (CMake ≥3.29 + vcpkg).
- **Binários:** `osrm-extract`, `osrm-partition`, `osrm-customize` (MLD), `osrm-contract` (CH), `osrm-routed` (servidor HTTP).
- **Docker:** `ghcr.io/project-osrm/osrm-backend`.
- **Consumo:** API HTTP `GET /{service}/v1/{profile}/{coords}`; desde **v26.9.0 também POST** (evita limite de URL com muitas coordenadas — ideal p/ nossa escala).
- **Node:** `npm i @project-osrm/osrm` (bindings nativos — atenção, não é wrapper HTTP). Para o ROTEIA: chamadas HTTP server-side ao `osrm-routed`.

## Endpoints principais

- **`route`:** `/route/v1/driving/{lon,lat};{lon,lat}?...` — `alternatives`, `steps`, `geometries=polyline|polyline6|geojson`, `overview=full|false`, `annotations=duration,distance`, `continue_straight`, `waypoints`.
- **`table` (matriz):** `/table/v1/{profile}/{coords}?sources=i;j&destinations=k;l&annotations=duration|distance&fallback_speed` → `{durations: number[][], distances: number[][]}` (row-major; `null` sem rota). `sources`/`destinations` menores que o total permitem **matriz retangular** (ex.: depósito→pontos).
- **`nearest`:** `/nearest/v1/{profile}/{coords}?number=N` (multi-coordenada desde v26.9.0).
- **`trip`:** combinações limitadas (ex.: `roundtrip=false&source=any&destination=any` não é suportado).

## Docker (pipeline MLD — recommended)

```bash
# 1. Extract Brasil/sub-região
wget http://download.geofabrik.de/south-america/brazil-latest.osm.pbf

# 2. Preprocess
docker run -t -v ${PWD}:/data ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/brazil-latest.osm.pbf
docker run -t -v ${PWD}:/data ghcr.io/project-osrm/osrm-backend osrm-partition /data/brazil-latest.osrm
docker run -t -v ${PWD}:/data ghcr.io/project-osrm/osrm-backend osrm-customize /data/brazil-latest.osrm

# 3. Servidor HTTP (porta 5000)
docker run -t -i -p 5000:5000 -v ${PWD}:/data ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/brazil-latest.osrm
```

## Dados do Brasil (Geofabrik)

- Brasil completo: `brazil-latest.osm.pbf` **~1,9 GB** (atualizado diariamente).
- **Sub-regiões prontas** (recomendado p/ escopo de entregas): **Sudeste 817 MB**, Nordeste 420 MB, Sul 404 MB, Centro-Oeste 195 MB, Norte 152 MB.

## Limitações p/ nosso caso

- **Trânsito real: não.** OSRM é estático (velocidades fixas por classe de via). `--segment-speed-file` permite injetar velocidades históricas, mas re-extração/re-customize é necessária. Para "trânsito agora" não serve; para planejamento de rotas é padrão da indústria.
- `trip` é só TSP greedy — **papel do OSRM = matriz + rota; otimização fica com + VROOM**.
- **Preprocess consome muita RAM** (Brasil inteiro → vários GB; README: ~30 min p/ México 550 MB). Usar sub-regiões.
- `osrm-routed` usa memory-mapping (RAM menor em runtime, disco soma os `.osrm.*`).
- Requer re-extração periódica para manter dados atuais.
- Limites de request configuráveis; matriz N×N grande → POST ou slice em `sources/destinations`.
- Qualidade OSM no Brasil: snap impreciso em áreas rurais/novas — usar hints/radiuses e validar `NoSegment`.

## Saúde do projeto

v26.9.0 (2026-09-01; **POST support**, nearest multi-coordenada, áreas pedonais). 8.1k stars, 4.0k forks, releases mensais (CalVer v26.x), >10 anos de maturidade (Mapbox/NAVER derivam dele historicamente).

## Verdicto ROTEIA

**`RoutingEngine` default (self-host)** + **backbone de matriz para o VROOM**. Licença permissiva, leve, `/table` nativo, substruturas prontas no Geofabrik. Limitar o extract à sub-região de operação.