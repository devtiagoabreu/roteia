# Regras de negócio — extraídas do estudo do Spoke

> Fonte: `04-novo-roteia.md`. Estas são as dez regras transversais que TODO agente de IA do ROTEIA deve assumir. Referenciadas pela matriz funcional (`05-matriz-funcional-roteia.md`) e pela documentação em `docs/`.

## As 10 regras (contrato)

| # | Regra | Implicação técnica |
|---|-------|---------------------|
| 01 | **A rota é editável.** | `RouteStop` mutável; drag & drop nativo; nenhum lock de rota após otimização. |
| 02 | **O algoritmo nunca deve impedir uma decisão humana legítima.** | Otimização = sugestão; edição manual sempre possível e persistida. |
| 03 | **Toda alteração manual deve possuir impacto calculável.** | Após move/insert/remove: recalcular segmentos, distância, duração, ETA e violações; exibir impacto. |
| 04 | **O mapa é uma visualização da rota, não a fonte de verdade.** | Estado da rota é o modelo (lista/sequência); Leaflet apenas renderiza. |
| 05 | **Uma parada possui contexto operacional.** | STOP rico: cliente, instruções, código de acesso, pacotes, peso, volume, janela, prioridade, tempo de serviço, POD. |
| 06 | **ETA é dinâmico.** | Recalcular ao concluir parada, ao editar, ao inserir pedido; distinguir ETA planejado/atual/estimado/atraso. |
| 07 | **Rotas podem ser reotimizadas parcialmente.** | Reotimizar somente o restante; não destruir decisões humanas (preserveOrder). |
| 08 | **Providers de mapas/roteamento são substituíveis.** | Abstrações: GeocodingProvider, RoutingProvider, OptimizationProvider, NavigationProvider. |
| 09 | **Clientes e endereços recorrentes devem ser reutilizáveis.** | CLIENTE → ENDEREÇO → PARADA → ROTA. |
| 10 | **O sistema deve explicar decisões importantes da otimização.** | Ex.: "Cliente B foi colocado depois de C porque B tem janela 10:00–11:00". Nunca rota "mágica". |

## Entidades centrais

```
CLIENTE → ENDEREÇO → PARADA → ROTA

EMPRESA → USUÁRIOS → MOTORISTAS → VEÍCULOS → CLIENTES → ROTAS   (multitenancy)
```

### STOP (parada rica)

`id, cliente, endereço, lat/lng, sequência, tipo, prioridade, janela de entrega, tempo de serviço, observações, instruções, código de acesso, nº de pacotes, peso, volume, status, ETA, chegada real, conclusão real, prova de entrega`.

### Endereço geocodificado

Nunca aceitar endereço sem validação. Armazenar: `address_raw`, `address_normalized`, `latitude`, `longitude`, `provider`, `confidence`, `geocoded_at`.

## Posicionamento

- Uma parada: **FIRST** (deve ser a primeira), **AUTO** (algoritmo decide), **LAST** (deve ser a última).
- Origem: empresa/depósito/endereço fixo/localização atual/endereço do motorista. Destino: empresa/depósito/endereço fixo/diferente/nenhum.
- Otimização considera: distância + tempo de viagem + tempo de serviço + janela + prioridade + origem + destino.
- O mapa, a lista e a timeline são três representações da mesma rota.

## Modelos de falha observados no Spoke (→ diferenciais ROTEIA)

| Falha no Spoke | Diferencial ROTEIA |
|---|---|
| Algoritmo passa perto e vai a outro bairro | Explicação da otimização (Regra 10) |
| Reordenar após otimização é difícil | Drag & drop direto + impacto calculável (P0) |
| ETA difere ao iniciar navegação | ETA planejado/atual + recalculo contínuo |
| Scanner captura só CEP | OCR → normalização → validação → confirmação humana (nunca aceite automático) |
| Histórico difícil de limpar | hoje/futuro/concluído/arquivado + arquivar/excluir/duplicar/reutilizar |
| Importação vinculada a plano alto | Importação CSV/Excel/Sheets de primeira classe; limites claros nos planos |
| Endereços repetidos recriados | Cadastro permanente de clientes/endereços |

## Grande oportunidade

Criar uma plataforma onde **algoritmo e operador trabalham juntos**: o algoritmo sugere, o operador aceita/edita, o sistema recalcula e o motorista executa.