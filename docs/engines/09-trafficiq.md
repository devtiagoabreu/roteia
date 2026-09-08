# TrafficIQ

> 📌 Identificação: `github.com/raghavmishrad365/TrafficIQ` — "Supply Chain Transport Intelligence", vencedor "Best Use of Microsoft Foundry" no AI Dev Days 2026. (Outro TrafficIQ em Devpost — previsão de trânsito urbano p/ África — não possui repo GitHub identificado; o repo real é o acima.)

## Licença

**MIT** (confirmado).

## Stack e arquitetura

- **React 19 + TypeScript 5.9** + Vite + Fluent UI + **Azure Maps Control**.
- Multi-agente **MS Agent Framework / Azure AI Foundry (GPT-4.1)**; **Dynamics 365 F&O via MCP**; **Azure IoT Hub**; Dataverse/Power Automate.
- Hospedagem: Azure Static Web Apps + Functions.
- ⚠️ A otimização de rota é o **"waypoint optimization" do Azure Maps (`computeBestOrder=true`, TSP)** + APIs de tráfego — **o solver é o Azure Maps, não há solver próprio**.

## Modelo resolvido

Reordering TSP multi-stop com tráfego em tempo real, ETA dinâmico, isócronas (reachable range), snap-to-road, incidentes. Orientado a operações enterprise (D365).

## Viabilidade TS/Next self-host

**Não self-host**: 100% acoplado a serviços Azure (Maps, IoT Hub, D365, Dataverse). O backend TS é só orquestração; sem Azure não roda e a rota não é calculada localmente.

## Manutenção

Baixa — projeto de hackathon (03–05/2026), autor único, sem releases.

## Verdicto ROTEIA

**Referência de arquitetura multi-agente + integração de tráfego/time**, não de engine de otimização (o solver é o Azure Maps externo). Fora do jogo para self-host de otimização de rotas. MIT para uso como material de estudo/arquitetura.