# RouteShaper

> 📌 Identificação: `github.com/r1azmh/vrp-backend` + `github.com/r1azmh/vrp-frontend` (projeto de tese — Univ. de Vaasa, Riaz Mahmud; caso real: Honkajoki Oy, Finlândia). Site: routeshaper.live. ⚠️ Não confundir com a crate Rust `nest-rs-guards` (coincidência de nome).

## Licença

**Apache-2.0** (confirmado nos dois repos).

## Stack e arquitetura

- Backend **Django + DRF (Python)**, frontend **React**.
- **Engine = pacote "VRP CLI"** (feito por *Builuk*, híbrido de heurísticas) + estimativa de emissão de CO₂.
- É **aplicação web completa** (front + back), **sem motor reutilizável via API limpa**.

## Modelo resolvido

CVRP, VRPTW, VRPPD, MDVRP (via VRP CLI); otimização de transporte com foco em **sustentabilidade/emissões de CO₂**.

## Viabilidade TS/Next self-host

Baixa — app acadêmico acoplado (Django+React+VRP CLI). Reusar exigiria extrair o VRP CLI como serviço. Não é engine embutível.

## Manutenção

Baixa — projeto de tese, 0★, sem releases, autor único (commits até 08/2026), sem comunidade/suporte.

## Verdicto ROTEIA

**Referência de caso de uso (VRP + emissões de CO₂)** e de arquitetura web "frontend + solver". Não usar como engine. Licença Apache-2.0 no caso de estudo/inspiração.