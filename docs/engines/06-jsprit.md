# jsprit

> URL: https://github.com/graphhopper/jsprit · Classificação ROTEIA: **VRP (referência)** — prioridade alta de estudo.

## Licença

**Apache-2.0** (confirmado; antes GPLv3, migrado para Apache-2.0). Permissiva — compatível com produto fechado.

## Stack e formato de consumo

- **Java** (linha 2.0 exige Java 21; Maven central).
- ⚠️ Consumo **in-process como biblioteca Java** — **sem serviço HTTP/REST oficial**. Para integrar ao Next.js seria necessário um serviço Java próprio.

## Modelo resolvido

VRP rico: frota heterogênea, janelas de tempo, capacidade, pickup/delivery, múltiplos depósitos, break/skills, serviço/encomenda.

## Viabilidade TS/Next self-host

**Baixa-média**: exige worker Java dedicado; sem binding JS; sem API estabelecida. Para stack TS equivale a criar infra só para o solver, com payback menor que VROOM/OR-Tools.

## Manutenção

Híbrida: **1.8 (última stable 2020-04) = legada**; **2.0 em desenvolvimento ativo** (push 08/2026, Java 21, JUnit5). Não arquivado, mas 2.0 ainda sem release estável.

## Verdicto ROTEIA

Referência acadêmica/legada de VRP rico. Sem binding nem API HTTP, é a pior relação custo/benefício dos engines para o nosso caso TS. **Só faria sentido com infra Java já existente** — fora do caminho principal.