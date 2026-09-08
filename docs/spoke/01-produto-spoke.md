# Como o Spoke funciona — estudo de produto

> Fonte primária: `04-novo-roteia.md` (pesquisa de produto com prints, documentação, avaliações e reclamações de usuários). Este arquivo destila o entendimento para a IA de desenvolvimento do ROTEIA.

## 1. O Spoke em uma frase

O Spoke não é um "Google Maps com várias paradas". É um sistema de **Route Planning + Route Optimization + Navigation + Delivery Execution**, com a camada empresarial **Dispatch + Fleet/Driver Management + Tracking + Delivery Management**.

## 2. Os dois produtos distintos

| | Spoke Route Planner | Spoke Dispatch |
|---|---|---|
| Público | motorista, entregador, courier, prestador de serviço individual | operação empresarial (despacho) |
| Origem | Route Planner desde 2018 | Circuit for Teams / Spoke Dispatch desde 2020 |
| Fluxo | criar rota → adicionar paradas → configurar → otimizar → navegar → executar → entregar | pedidos → paradas não atribuídas → planejamento → distribuição → otimização → publicação → motoristas → acompanhamento → entregas |

## 3. Modelo mental: a ROTA e a PARADA

**O objeto principal não é o mapa. É a PARADA.** O mapa, a lista e a timeline são três representações da mesma rota:

```
                        ROTA
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
        MAPA           LISTA         TIMELINE
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                     MOTORISTA
```

### 3.1 A parada (STOP) é um objeto rico

```
STOP
├── id
├── cliente
├── endereço
├── latitude / longitude
├── sequência
├── tipo
├── prioridade
├── janela de entrega
├── tempo de serviço
├── observações
├── instruções
├── código de acesso
├── quantidade de pacotes
├── peso
├── volume
├── status
├── ETA
├── horário real de chegada
├── horário real de conclusão
└── prova de entrega
```

Os prints do Spoke mostram edição de parada com: endereço, instruções, código de portão, quantidade de pacotes, tipo de entrega e tempo no local.

### 3.2 Entrada de paradas

- Entrada manual (digitar endereço)
- Voz (falar endereço)
- Importação (CSV, spreadsheet)
- Seleção no mapa (clique → adicionar parada)
- **Parada existente reutilizada** (importante: endereço não é dado descartável)

## 4. Clientes recorrentes

Reclamação real na App Store: usuário que usa repetidamente os mesmos endereços pediu cadastro de endereços/favoritos. Confirma a hierarquia do ROTEIA:

```
CLIENTE → ENDEREÇO → PARADA → ROTA
```

## 5. Geocodificação é parte crítica do negócio

O Spoke usa Google Places Autocomplete, Geocoding, Navigation SDK e Routes API, com localização nível propriedade/rooftop. Fluxo:

```
ENDEREÇO DIGITADO → VALIDAÇÃO → GEOCODIFICAÇÃO → CONFIRMAÇÃO → LAT/LNG → PARADA
```

Regra ROTEIA: nunca aceitar endereço presumindo coordenada correta. Armazenar:
`address_raw`, `address_normalized`, `latitude`, `longitude`, `provider`, `confidence`, `geocoded_at`.

## 6. Origem e destino

Origem pode ser: empresa, depósito, endereço fixo, localização atual, endereço do motorista. Destino pode ser: empresa, depósito, endereço fixo, endereço diferente, **nenhum destino definido**.

## 7. Regras de posição

Uma parada pode ser **FIRST**, **AUTO** (algoritmo decide) ou **LAST**. Deve existir nativamente.

## 8. O algoritmo não é soberano

Reclamação: o algoritmo passa perto de uma entrega, manda para outro bairro e volta depois. Outra: depois da otimização não dá para reorganizar arrastando como no Google Maps.

> **PRINCÍPIO DO ROTEIA: O algoritmo sugere. O operador decide.**

## 9. Drag & drop com impacto calculável

Arrastar parada da posição 5 para a 2 deve: recalcular segmentos, distância, duração, ETA; verificar violações; **informar impacto**. Sem obrigar sequências intermediárias ("make next"/"make last").

## 10. Reordenação granular e Refine

- Reordenação granular: mover direto da posição 27 para a 4.
- **Refine**: reorganizar grupos/áreas sem destruir o planejamento. Ex.: ROTA com Região Norte/Centro/Sul/Leste, onde o operador pode dar prioridades por região, tirar uma região da rota etc. — potencial diferencial.

## 11. Agrupamento geográfico

Deve evitar `A → B → X → Y → C → D` quando `A → B → C → D → X → Y` é natural (mesmo bairro). Considerar no motor de otimização.

## 12. Restrições do problema

Otimização não considera só distância, mas:
`DISTÂNCIA + TEMPO DE VIAGEM + TEMPO DE SERVIÇO + JANELA DE ENTREGA + PRIORIDADE + ORIGEM + DESTINO`

- **Time windows**: ex. Cliente A 09:00→10:00, B 10:30→12:00, C 13:00→15:00.
- **Tempo de serviço**: travel_time + service_time (estacionar, localizar, entregar, assinar, voltar).
- **Breaks**: o intervalo (12:00→12:30) entra no cálculo da rota.

## 13. ETA dinâmico

ETA inicial: Stop1 09:10, Stop2 09:27, Stop3 09:45. Após concluir o Stop1, o sistema recalcula: Stop2 09:31, Stop3 09:51. O Spoke atualiza ETAs conforme entregas ocorrem e permite reotimizar o resto da rota.

## 14. Reotimização durante a execução

`A → B → C → D → E → F`; em B o operador pula C (fechado) → recalcula `D → E → F` ou `D → C → E → F` conforme regras.

## 15. Inserção de parada durante a rota

Novo pedido X durante execução: adicionar X e escolher **inserir automaticamente**, **inserir depois de B** ou **colocar no final**. (Mesmo conceito do SDK da Geoapify: add/move/reoptimize em rotas existentes.)

## 16. Package Finder

Motorista registra onde cada pacote está dentro do veículo (porta-malas, banco traseiro, caixa 4). Diferencial forte do app do motorista:

```
VEÍCULO ├── posição └── pacote └── parada
```

## 17. Prova de entrega (POD)

Estados: **entregue / falhou / pulado / reagendado**. Provas futuras: foto, assinatura, nome do recebedor, observação, GPS, timestamp.

## 18. Navegação ≠ planejamento ≠ routing

- **Route Planning**: qual parada vem primeiro?
- **Routing**: qual caminho usar entre A e B?
- **Navigation**: "vire à direita em 200 m" (o Spoke usa Google Maps Platform + Navigation SDK).

## 19. O que o ROTEIA NÃO deve fazer

1. Mapa como fonte principal de verdade.
2. Algoritmo impossível de editar.
3. Frontend dependente de um único provedor de mapas.
4. Endereço sem geocodificação validada.
5. ETA fixo.
6. Rota destruída após alteração manual.
7. Reotimização completa quando o usuário quer só inserir uma parada.

## 20. Aprendizado central

> "Vamos criar uma plataforma de roteirização onde o **algoritmo e o operador trabalham juntos**."

ALGORITMO → SUGERE → OPERADOR → ACEITA/EDITA → SISTEMA → RECALCULA → MOTORISTA → EXECUTA → SISTEMA → APRENDE COM OS RESULTADOS.