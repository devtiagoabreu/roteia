# Documentação do Roteia

Centro de documentação do módulo **Programa a Rota** (plataforma de entregas) e do estudo do **Spoke** e dos **engines de otimização/roteirização**. Esta pasta nasce do 04-novo-roteia.md (matrizes funcional + técnica) e concentra o aprendizado de estudo repositório-por-repositório antes de implementar.

## Como ler

| Prioridade | P0 = essencial | P1 = importante | P2 = útil | P3 = futuro |
|-----------|---               |---              |---        |---          |

As regras transversais (10 regras) vivem no `04-novo-roteia.md` e são o contrato de todo o código que fizermos aqui.

## Mapas de leitura

### Origem (na raiz — specs)

| Arquivo | O que é | Status |
|---------|---------|--------|
| `01-estudo-caso-roteia-001.md` | Spec central do módulo Rota (Docs 13/14/15: providers, schema Route/RouteStop/Customer/Driver/Vehicle, milestones de 25 passos) | vigente |
| `02-estudo-caso-roteia-002.md` | Origem do produto (Spoke/antigo Circuit), naming Roteia, identidade BR | vigente |
| `03-especificacao-roteia.md` | Espec v1.0 do planejador pessoal (Meu Dia) — reconcile com o 04 | vigente |
| `04-novo-roteia.md` | Pesquisa do Spoke + repensar do produto: plataforma de entregas com Route Planner + Dispatch | vigente (base deste estudo) |
| `05-matriz-funcional-roteia.md` | Matriz funcional A–H (cadastros, dashboard, route builder, execução, importação, dispatch, planos) com prioridades P0–P3 | vigente |

### Estudo de produto (nesta pasta)

| Arquivo | Conteúdo |
|---------|----------|
| `docs/spoke/01-produto-spoke.md` | Como o Spoke funciona (Route Planner + Dispatch) |
| `docs/spoke/02-regras-de-negocio.md` | Regras de negócio extraídas do estudo (parada rica, "algoritmo sugere, operador decide", etc.) |

### Estudo de repositórios/engines (nesta pasta)

| Arquivo | Engine | Licença | Papel |
|---------|--------|---------|-------|
| `docs/engines/01-vroom.md` | VROOM | BSD-2-Clause | Otimização de rotas (VRP) |
| `docs/engines/02-osrm.md` | OSRM | BSD-2-Clause | Matrizes de rota/tempo (backend de custos) |
| `docs/engines/03-openrouteservice.md` | OpenRouteService | GPL-3.0 | Rotas/matrizes com perfis + geocoding |
| `docs/engines/04-geoapify-route-planner.md` | Geoapify Route Planner | MIT (SDK) / SaaS (API) | Otimização online (reference de UX) |
| `docs/engines/05-or-tools.md` | Google OR-Tools | Apache-2.0 | Alternativa de otimização (worker) |
| `docs/engines/06-jsprit.md` | jsprit | Apache-2.0 | Alternativa VRP em Java |
| `docs/engines/07-fleetpilot.md` | FleetPilot | verificar | Referência de produto/arquitetura |
| `docs/engines/08-routeshaper.md` | RouteShaper | verificar | Referência de produto/arquitetura |
| `docs/engines/09-trafficiq.md` | TrafficIQ | verificar | Referência de produto/arquitetura |
| `docs/engines/10-sintese-e-combinacao.md` | — | — | Qual engine usar, como combinar, arquitetura de providers |

## Decisões arquiteturais de referência (do 04)

- Parada (stop) é o objeto rico do sistema; rota é uma sequência ordenada de paradas.
- **O algoritmo sugere; o operador decide.** Toda otimização é editável; edição manual com impacto calculável.
- Reotimização parcial (inserir/não destruir o que o operador ajustou).
- Mapa NUNCA é fonte da verdade; é uma visão. Nada de frontend acoplado a um único provedor de mapa.
- Endereço só existe após geocode validado.
- ETA sempre dinâmico.
- Separar navegação (o GPS que dirige) de planejamento (o mapa) de roteirização (o motor de custos).
- Entidade central: `CLIENTE → ENDEREÇO → PARADA → ROTA`.
- Multitenancy: `empresa → usuários → motoristas → veículos → clientes → rotas`.
- Dados Brasil como cidadão de primeira classe (CEP, CNPJ, UF, cidade, bairro, WhatsApp).
- Importação CSV/Excel/Sheets de primeira classe.