# FleetPilot

> ⚠️ **Nome ambíguo** — não existe UM projeto open source único chamado "FleetPilot" para otimização. Identificamos os candidatos e documentamos abaixo.

## Identificação

| Candidato | URL | Licença | Natureza |
|---|---|---|---|
| **Provável referência citada** | `github.com/vkondepati/fleet-route-optimizer` | **BSD-2-Clause** | "fleets / route optimization platform" — mas o solver dele É **VROOM via OpenRouteService** (hosted) |
| Outro homônimo | `faborubio/fleetpilot` | — | Rails 8, gestão de frotas (sem otimização) |
| Comercial | "FleetPilot" da DevPilot (devpilot.co.in) | — | SaaS corporativo que também usa **VROOM** por baixo |
| Hackathon | FleetPilot (React, TMS NavPro) | — | sem relevância |

## O que é (vkondepati/fleet-route-optimizer)

- Stack: **JS (76%) + TS (8%), React + Leaflet**; **engine = API VROOM do OpenRouteService** (`openroute-vrp.ts`: A*, Clarke-Wright, GA) + tracking WebSocket.
- Resolve: VRP com capacidade e janelas (como o ORS oferece), multi-veículo, pathfinding geográfico.
- Consumo: serviço externo hospedado (ORS) + código próprio de UI/estado. **Não é engine embutível** — é um app de referência de arquitetura.
- Manutenção: baixa (criado 10/2025, último push 02/2026, 1★).

## Viabilidade TS/Next self-host

Parcial: o código TS é self-host, mas a otimização delega à API do OpenRouteService (dependência externa). Para self-host puro trocar o solver por VROOM/OR-Tools próprio.

## Verdicto ROTEIA

**Referência de arquitetura de UI + tracking** (Leaflet + WebSocket), NÃO como engine. Confirma o padrão "Next/React + solver externo em HTTP" que já validamos com VROOM/OR-Tools. Licença BSD-2-Clause só se reutilizarmos partes do código dele.