# VROOM — Vehicle Routing Open-source Optimization Machine

> URL: https://github.com/VROOM-Project/vroom · Site: https://vroom-project.org · Mantido por **Verso** (https://verso-optim.com/).
> Classificação ROTEIA: **Motor VRP (otimização)** — prioridade máxima do estudo.

## Licença

**BSD-2-Clause.** Copyright © 2015–2025 Julien Coupey. Permissiva, sem copyleft — compatível com uso comercial/self-host em produto fechado, sem obrigação de publicar código.

## O que resolve (modelo matemático)

Resolve VRP em C++20 em milissegundos. Suporta — inclusive simultaneamente no mesmo problema:

- **TSP** (caixeiro viajante)
- **CVRP** (com capacidade)
- **VRPTW** (com janelas de tempo)
- **MDHVRPTW** (multi-depósito, frota heterogênea, janelas)
- **PDPTW** (pickup-and-delivery)

Extras: capacidades multidimensionais, skills, prioridades, breaks, frota heterogênea, rota aberta/fechada, custos por veículo, **plan mode** (`-c`: constraints viram soft — útil para monitoramento/re-agendamento).

## Arquitetura e como consumir

| Forma | Descrição |
|---|---|
| Binário CLI | `vroom` lê JSON de stdin, escreve no stdout |
| **vroom-express** | wrapper **Node.js/Express**, HTTP POST JSON na porta **3000**, health `GET /health` — já empacotado na imagem Docker |
| pyvroom | wrapper Python oficial (`pip install pyvroom`) |
| Docker | `ghcr.io/vroom-project/vroom-docker:v1.15.0` (tag segue release do core) |

Para a stack TS/Next.js: **chamada HTTP do server/route handler ao vroom-express**. Não há SDK JS oficial, mas o payload JSON é trivial de tipar.

## Formato do problema (docs/API.md)

Convenções: coords **`[lon, lat]`**, tempos em **segundos**, distâncias em **metros**, `time_window = [start, end]` (inclusivo).

- **jobs**: `id` (obrigatório), `description`, `location`, `location_index` (matriz custom), `setup`, `service`, `delivery[]/pickup[]`, `skills[]` (job só vai para veículo com todas), `priority` (0–100), `time_windows[]`.
- **shipments**: `pickup`/`delivery` (objetos `id`, `location`, `setup`, `service`, `time_windows`), `amount[]`, `skills[]`, `priority`.
- **vehicles**: `id`, `profile` (default `car` → mapeia p/ OSRM), `start`/`end`, `capacity[]`, `costs` (fixed/per_hour/per_task_hour/per_km), `skills[]`, `type`, `time_window` (jornada), `breaks[]`, `speed_factor` (0–5), `max_tasks`, `max_travel_time`, `max_distance`, `steps[]` (rota inicial fixa).
- **Output**: `code` (0 ok / 1 interno / 2 input / 3 routing), `summary` (cost, distance, duration, setup, service, waiting_time, priority, violations, unassigned), **`unassigned[]`** ("who goes where" — decide por prioridade), `routes[]` com `steps[]` (type `start|job|pickup|delivery|break|end`, arrival, duration, load, violations) e `geometry`/`distance` (com flag `-g`).

## Integração com matrizes — VROOM + OSRM (essencial)

O VROOM funciona out-of-the-box sobre **OSRM, OpenRouteService e Valhalla**:

- Sem matriz custom no input, o VROOM envia uma query **`table` ao routing engine** para montar a matriz (no caso OSRM: `GET /table/v1/{profile}/{coords}`).
- Com **matriz custom** (`"matrices": {"car": {"durations": [...], "distances": [...]}}`, usando `location_index`), a chamada por request é eliminada — **recomendado para nossa escala: gerar a matriz via OSRM uma vez e reutilizar/cachear**.
- Geometria da rota (`-g`): VROOM busca no routing engine.
- Setup típico: OSRM em `localhost:5000` + vroom-express com `VROOM_ROUTER=osrm` (default).

## Docker (subida local)

```bash
docker run -dt --name vroom \
  -v ${PWD}/conf:/conf \
  -e VROOM_ROUTER=osrm \
  ghcr.io/vroom-project/vroom-docker:v1.15.0
```

> Requer um OSRM vivo (default `localhost:5000`; ORS `localhost:8080`; Valhalla `localhost:8002`). No Docker do Windows, prefira rede privada + configurar o host do router em `/conf/config.yml` (nome do container) em vez de `--net host`.

## Limitações para o nosso caso

- **Tempos estáticos**: matriz vem do OSRM (velocidades fixas por classe de via) — sem trânsito real/semáforos/hora do dia. ETA = estimativa (mitigar com `speed_factor` e calibração).
- Matriz por request re-consulta o OSRM a cada solve (cache. a matriz custom).
- Não tem GPS/telemetria — é otimizador de planejamento.
- Mapear veículos/janelas do domínio de entregas exige modelagem nossa.
- Heurística, sem garantia de ótimo (ok p/ planejamento).

## Saúde do projeto

v1.15.0 (2026-03-12; tempos por tipo de veículo, custo por hora de tarefa, heurísticas sobre solução parcial). ~1.9k stars, 432 forks, ativo desde 2015, mantido comercialmente pela Verso (Vroom Premium API = sinal de sustentabilidade; core segue open source).

## Verdicto ROTEIA

**Embutir no estudo como provedor de otimização principal** (`OptimizationProvider` default): self-host via Docker, HTTP nativo, licença permissiva, cobre exatamente o modelo de paradas/veículos/janelas/breaks/prioridades do ROTEIA, e se integra nativamente à matriz do OSRM.