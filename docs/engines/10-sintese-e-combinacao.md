# Síntese: qual engine usar, como combinar e arquitetura de providers

> Este documento fecha a matriz técnica pedida pelo `04-novo-roteia.md` (§ etapa obrigatória). Base: fichas em `docs/engines/01-vroom.md` a `09-trafficiq.md`, regras do `04`·`05`·`docs/spoke/`, e o código já existente no ROTEIA (`lib/maps/*`, `lib/day/optimize.ts`, Leaflet).

## 1. Resumo executivo

Para otimização de rotas de entregas no Brasil (escopo inicial: 1 veículo, <100 paradas), a combinação recomendada é:

| Camada | Engine | Licença | Papel | Forma |
|---|---|---|---|---|
| **OptimizationProvider** | **VROOM** | BSD-2-Clause | resolver o VRP (jobs, veículos, janelas, breaks, prioridade) | Docker `vroom-docker` + HTTP (vroom-express), porta 3000 |
| **RoutingProvider / matrix** | **OSRM** | BSD-2-Clause | matriz de durações/distâncias + geometria das rotas | Docker, porta 5000, sub-região do Geofabrik |
| **GeocodingProvider** | **ORS geocoding** (ou Nominatim) | API hospedada / open | geocodificar endereços BR | HTTP |
| **Map rendering** | **Leaflet** | BSD | visualização (nunca fonte de verdade) | biblioteca |
| **Navigation (futuro)** | Google Navigation ou OSRM+instruções | — | "vire à direita em 200m" | provider abstrato |

Alternativas documentadas: OR-Tools (sidecar Python; Apache-2.0), ORS (perfil truck; GPL-3 — usa hospedada ou serviço separado), Geoapify SDK (SaaS paga; **referência de UX** do editor), jsprit/FleetPilot/RouteShaper/TrafficIQ (referências de arquitetura, não engines principais).

## 2. Por que VROOM + OSRM vencem

1. **Licenças permissivas** (BSD-2 nas duas) — self-host em produto fechado sem obrigação de copyleft.
2. **HTTP nativo** — integração TS/Next.js trivial (server-side fetch), sem sidecar em runtime extra.
3. **VROOM consome a matriz do OSRM nativamente** (`/table`) — um fluxo de dados coeso: peças → OSRM calcula custos → VROOM otimiza → OSRM devolve geometria.
4. **Cobertura do modelo ROTEIA**: VROOM suporta jobs com service time, janelas, prioridade, skills, breaks, origem/destino, capacidade — exatamente o STOP rico do ROTEIA.
5. **Custo**: OSS, sem API key nem créditos.
6. **Dados Brasil**: extract Geofabrik (sub-regiões prontas, atualização diária).

## 3. Matriz técnica de decisão (resumo)

| Engine | Licença | Self-host | Integra TS/Next | Qualidade VRP | Veredicto ROTEIA |
|---|---|---|---|---|---|
| **VROOM** | BSD-2 | ✅ (Docker) | ⭐⭐⭐ (HTTP) | Alta (TSP→PDPTW) | **Principal (OptimizationProvider)** |
| **OSRM** | BSD-2 | ✅ (Docker) | ⭐⭐⭐ (HTTP) | — (matriz/rota) | **Principal (RoutingProvider)** |
| OR-Tools | Apache-2.0 | ✅ (sidecar Python/Java) | ⭐⭐ | Alta | Alternativa |
| ORS | GPL-3 | ✅ (cuidado copyleft) | ⭐⭐⭐ (HTTP+SDK JS) | Matrix/VRP limitado | Routing p/ truck / geocode |
| Geoapify SDK | MIT (SDK) / SaaS | ❌ (API paga) | ⭐⭐⭐ | Boa | Referência de UX de edição |
| jsprit | Apache-2.0 | ✅ (sidecar Java) | ⭐ | Alta | Só com infra Java |
| FleetPilot | BSD-2 (repo) | parcial (usa ORS hosted) | ⭐⭐ | — | Referência UI/tracking |
| RouteShaper | Apache-2.0 | ✅ (app Django) | ⭐ | via VRP CLI | Referência caso/emissões |
| TrafficIQ | MIT | ❌ (Azure Maps) | ⭐ | — | Referência multi-agente/tráfego |

## 4. Arquitetura de providers (a implementar no ROTEIA)

Do `04` (Regra 08: providers substituíveis) e do código existente:

```
                    ROTEIA (Next.js / Prisma / Leaflet)
                                  │
          ┌───────────────┬──────┴────────┬──────────────┐
          │               │               │              │
  GeocodingProvider  RoutingProvider  OptimizationProvider  (Map = Leaflet)
          │               │               │
    ORS geocode /     OSRM (default)     VROOM (default)
    Nominatim /       ORS (truck)        OR-Tools (opcional)
    Google (futuro)   Google (futuro)    (Geoapify = mock/referência)
```

### 4.1 Contratos sugeridos

- `OptimizationProvider.optimize(input): OptimizationResult`
  - input: lista de stops + veículo(s) + constraints (janelas, capacidade, breaks, prioridade, FIRST/LAST).
  - result: sequência ordenada + unassigned + summary (distância, duração, violações, ETA por stop).
- `RoutingProvider.route(stops): legs` + `RoutingProvider.matrix(coords): DurationMatrix` (para o VROOM e para ETAs).
- `GeocodingProvider.geocode(address): { lat, lng, normalized, confidence, provider, geocoded_at }`.
- `MapProvider` — **não existe**: mapa é Leaflet e se alimenta do modelo, nunca o contrário.

### 4.2 Interfaces concretas

```ts
interface RouteEditor {           // inspirado no Geoapify (docs/engines/04)
  addStop(stop, opts: { strategy: 'reoptimize' | 'preserveOrder'; afterId?; append? });
  moveStop(stopId, position);     // drag & drop → recalcula impacto
  removeStop(stopId, opts);
  addDelayAfterWaypoint(stopId, seconds);
  reoptimize(partial?: { from: number });  // reotimização parcial
  getResult(): OptimizationResult;         // para persistir/undo-redo
}
```

## 5. Fluxo de dados do "otimizar" (end-to-end)

```
stops (com coords válidas)
   → MatrixProvider.matrix(coords)  [OSRM /table, cache: key = hash de coords+profile]
   → VROOM.optimize(jobs, vehicle, matrices)  [matriz custom evita re-consulta]
   → resultado: ordem + unassigned
   → OSRM route/geometry p/ desenhar no Leaflet + leg geometries
   → salvar Route + RouteStops na Prisma
   → exibir impacto de edição manual (Regra 03)
```

Dica técnica (estudo OSRM): usar `annotations=duration` + `skip_waypoints=true`, e **POST** (v26.9+) para muitos pontos. Cache de matriz por chave `coords-sorted|profile` para não re-gastar.

## 6. Pontos de atenção

- **ETA estático**: VROOM+OSRM dão ETA de planejamento sem trânsito real. Para "trânsito agora" (futuro): provedor separado (Google Routes / Azure) ou dados históricos. ETA deve ser tratado como dinâmico (Regra 06) e recalcular localmente conforme execução.
- **GPL-3 do ORS**: usar via API hospedada (free ~7k/dia) ou container separado; nunca modificar e redistribuir integrado sem abrir sob GPL-3.
- **Preprocess OSRM**: Brasil inteiro ≈ 1,9 GB / vários GB RAM. Começar com uma **sub-região** (ex.: Sudeste 817 MB) e só pré-processar o que a operação cobre.
- **Matriz custom no VROOM**: cachear a matriz e passar `matrices` no input (desempenho).
- **FleetPilot/RouteShaper/TrafficIQ**: apenas referências de arquitetura — não trazer dependência.

## 7. O que reaproveitar do código atual do ROTEIA

- `lib/maps/geocode.ts` — geocode (ORS/Nominatim) → base do `GeocodingProvider`.
- `lib/maps/route.ts` — buscas de rota → base do `RoutingProvider` (trocar/abstrair p/ OSRM).
- `lib/day/optimize.ts` — motor TS próprio para rota de poucas paradas → **fallback** (sem engine) para rotas pequenas/offline e testes.
- `components/address-input.tsx`, `components/maps/coordinate-picker.tsx` — UI de geocode.
- `lib/day/` estrutura de otimização → adaptar para o contrato `OptimizationProvider`.
- Prisma: modelos atuais `SavedPlace`/etc. → evoluir para `Customer`, `Address`, `Route`, `RouteStop`, `Driver`, `Vehicle` (schema do `01`).

## 8. Rotas de implementação sugeridas (fase técnica)

1. **SPIKE**: subir OSRM (sub-região) + VROOM local, provar 1 rota: matrix → otimizar → geometria. (Valida o Docker no Windows.)
2. **Contracts**: tipar `OptimizationProvider`/`RoutingProvider`/`GeocodingProvider` + `RouteEditor`.
3. **Adapters**: `VroomOptimizer`, `OsrmRouting`, `OrsGeocoder` (wrappers HTTP com timeout/fallback).
4. **Cache**: matriz + resultados de rota.
5. **Fallback**: manter motor TS próprio como `OptimizationProvider` local p/ <N paradas (e testes).
6. **UI do Route Builder** (conforme 05, sessão C) consumindo os providers com impacto calculável.

## 9. Fontes

- `docs/engines/01-vroom.md` a `09-trafficiq.md` (fichas técnicas com licenças/URLs).
- `04-novo-roteia.md` §§ 27–34, 44–47, 49 (engines e arquitetura).
- `05-matriz-funcional-roteia.md` (prioridades funcional de cada tela).
- Pesquisa primária de licenças/atividade (08/09/2026) via GitHub API e repos oficiais.