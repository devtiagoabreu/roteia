# Geoapify Route Planner SDK

> URL SDK: https://github.com/geoapify/route-planner-sdk · API: https://apidocs.geoapify.com/docs/route-planner/ · Classificação ROTEIA: **edição dinâmica de rotas (referência de UX)** — prioridade máxima do estudo (é o projeto que prova a viabilidade do "operador decide").

## Licença e modelo

- **SDK npm `@geoapify/route-planner-sdk`**: **MIT** (livre, sem copyleft) — TypeScript, dependency-free, roda no browser E Node.js.
- ⚠️ O SDK é um **cliente da API SaaS Geoapify Route Planner** (hospedada). Requer **API key**; modelo por **créditos** (free plan ~3000 créditos/dia p/ testes; planos pagos p/ uso comercial). **Não é self-host** — a otimização roda no servidor da Geoapify.
- V2 com assinaturas melhoradas e editor de rotas expandido. 4★, 206 commits, último push 03/2026 (atividade moderada).

## O que é

SDK para **construir, executar e modificar** problemas de otimização de rotas (delivery planning, pickup/drop-off, time-constrained multi-agent). Confirma tecnicamente a arquitetura de edição pós-otimização que queremos no ROTEIA.

## API do SDK (conceitos-chave)

```ts
import { RoutePlanner, Agent, Job, Location, Shipment, ShipmentStep, Avoid } from "@geoapify/route-planner-sdk";

const planner = new RoutePlanner({ apiKey: API_KEY });
planner.setMode("drive");
planner.addAgent(new Agent().setStartLocation(lat, lng).addTimeWindow(0, 10800).setEndLocation(...).setPickupCapacity(10000));
planner.addJob(new Job().setDuration(300).setPickupAmount(60).setLocation(lat, lng));
planner.addAvoid(new Avoid().setType("tolls"));
planner.setTraffic("approximated");
const result = await planner.plan();
```

- **Agent** = veículo: start/end location, time window, capacity (pickup), profile.
- **Job** = parada: duration (service time), pickup/delivery amounts, location.
- **Shipment** = pickup + delivery no mesmo agente (amanpara `order-1` → pickup no depósito + delivery no cliente).
- **Avoid** = evitar pedágios, locais, etc.
- **Traffic** = `approximated` (ou live).
- **Timeline** = `RoutePlannerTimeline` gera linha do tempo visual (time/distance), com waypoint popups e menu por agente (que também existe no ROTEIA como representação da rota).

## Edição dinâmica — RoutePlannerResultEditor (diferencial)

Estratégias de modificação:

| Estratégia | Descrição | API usada |
|---|---|---|
| **`reoptimize`** (default) | re-otimiza a rota inteira; melhores resultados | Route Planner API |
| **`preserveOrder`** | insere sem reordenar paradas existentes; rápido; **não destrói decisões humanas** (Regra 07) | Route Matrix API ou None |

Operações do editor:

| Ação | Método | Caso de uso |
|---|---|---|
| Mover jobs p/ outro agente | `assignJobs()` | motorista doente; rebalanceamento |
| Mover shipments | `assignShipments()` | veículo atrasado; reatribuição |
| Remover jobs | `removeJobs()` | cancelamento; parada adiada |
| Remover shipments | `removeShipments()` | pedido cancelado |
| Adicionar jobs | `addNewJobs()` | pedido same-day; tarefa manual; **inserir parada durante a rota** |
| Adicionar shipments | `addNewShipments()` | entrada ao vivo |
| Inserir atraso após waypoint | `addDelayAfterWaypoint()` | engarrafamento; fila no cais; adiantamento (delay negativo) |
| **Reordenar manualmente uma parada** | `moveWaypoint()` | **drag & drop do despachante** |
| Re-otimizar rota de um agente | `reoptimizeAgentPlan({allowViolations})` | limpeza após muitas edições; incluir unassigned |
| Ler resultado editado | `getModifiedResult()` | persistir plano; re-render mapa/timeline; undo/redo |

Estratégia `preserveOrder`: sem posição → Route Matrix API escolhe ponto de inserção ótimo; com `afterId`/`afterWaypointIndex` → otimiza a inserção após aquela posição; com `append:true` → insere direto no fim sem chamada de API.

## O que isso valida para o ROTEIA

1. A ARQUITETURA "algoritmo sugere / operador decide" é implementável: move → add → remove → reoptimizeAgentPlan(partial).
2. `moveWaypoint` + `assignJobs` == nosso **drag & drop com impacto calculável** (diferencial #1 da matriz funcional, P0).
3. `preserveOrder` == nossa **reotimização parcial** (não destruir decisões humanas).
4. O conceito de timeline do agente == nossa representação "lista/timeline" da rota.

## Verdicto ROTEIA

Usar como **referência de API/UX de edição**, não como dependência (é SaaS). Os conceitos `reoptimize vs preserveOrder` e o conjunto `assign*/addNew*/remove*/moveWaypoint/addDelayAfterWaypoint` devem moldar a **nossa abstração `RouteEditor`** em cima do motor VROOM/OR-Tools self-host. O custo/credits e a não self-hostability afastam a Geoapify como provedor principal, mas ela serve como provider SaaS opcional (mock/fallback comercial).