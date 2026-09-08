# Google OR-Tools (Vehicle Routing)

> URL: https://github.com/google/or-tools · Classificação ROTEIA: **Otimização (alternativa)** — prioridade máxima de estudo.

## Licença

**Apache-2.0** (confirmado via GitHub API). Permissiva — compatível com produto comercial fechado.

## Stack e formato de consumo

- Núcleo **C++** com bindings oficiais **Python, Java, C#, .NET**.
- **NÃO há binding oficial para JS/TS** (`mapbox/node-or-tools` é community e está preso ao OR-Tools 5.1 / Node 4-6 — abandonado).
- ⚠️ Por isso **é biblioteca, não serviço HTTP**. Para expor ao Next.js precisaríamos de um **worker próprio** (processo Python/Java/.NET) atrás de um endpoint HTTP — a mesma arquitetura de sidecar do VROOM, porém mantendo um runtime extra em produção (pip/maven + processo).
- Nota: `@googlemaps/routeoptimization` (Route Optimization API da Google Cloud, hosted preview) e `@googlemaps/routing` (TSP ≤25 waypoints) **não são** o OR-Tools self-host.

## Modelo resolvido

Motor *routing*: **TSP, CVRP, VRPTW, PDP (pickup & delivery), frota heterogênea, janelas de tempo, capacidade, break times**, com metaheurísticas (GLS, first-solution heuristics). Qualidade excelente p/ VRP rico.

## Viabilidade TS/Next self-host

Viável com **sidecar**: empacotar OR-Tools num serviço Python/Java com API JSON e chamar do backend. Mesma arquitetura do VROOM, mas com runtime extra.

## Manutenção

Muito ativa: v9.15 (2026-01-12), commits recentes (08/2026), mantido pela Google, 14k★.

## Verdicto ROTEIA

Candidato sólido e maduro. Para <100 paradas entrega qualidade comparável ao VROOM, mas **sem binding JS**: a aposta em worker próprio só compensa se já rodarmos Python/Java. **Manter VROOM (HTTP nativo) à frente como `OptimizationProvider` principal; OR-Tools como alternativa** caso a qualidade do solver domine o critério de decisão.