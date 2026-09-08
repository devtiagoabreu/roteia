VAMOS INICIAR UM NOVO DOCUMENTO, SEM ESQUECER O QUE JÁ FALAMOS... VAMOS FAZER A BASE PARA A IA CONTINUAR O PANEJAMENTO OK...   ANTES DE TUDO PROCURE IMAGENS E PRNTS DO SPOKE NA INTERNET.... PROCURE REPOSITÓRIOS OPEN SOURCE QUE SE BASEIAM NO SPOKE.... PREOCURE TUTORIAIS DO SPOKE, RECLAMAÇÕES... TUDO QUE PRECISAMOS PARA ENTENDER A REGRA DE NEGÓCIO E AS TELAS E FUCIONALIDADES DO SPOKE

Sim. Vamos tratar isso como uma pesquisa de produto, não apenas como inspiração visual.

Fiz uma varredura inicial de prints, funcionalidades, documentação, avaliações, reclamações de usuários, discussões de comunidade e projetos open source relacionados a roteirização. Também procurei especificamente por projetos que fossem um clone/open source direto do Spoke/Circuit; não encontrei um repositório confiável que se apresente como uma implementação open source do Spoke. Em compensação, encontrei projetos muito relevantes para reconstruirmos tecnicamente as mesmas capacidades.

Isso é importante porque o objetivo agora será criar uma base de conhecimento para a IA do ROTEIA, para que as próximas etapas de desenvolvimento não sejam baseadas em suposições.

1. Prints e interface que encontrei
Spoke Route Planner — experiência do motorista
6

Os prints encontrados mostram uma lógica muito clara:

rota → lista de paradas → mapa → detalhes da parada → navegação → conclusão da entrega.

Há inclusive telas de edição de parada com informações como endereço, instruções, quantidade/localização de pacotes, prioridade da parada, horário e tempo de serviço.

Spoke Dispatch — operação empresarial
6

Aqui aparece outra camada do produto:

pedidos → planejamento → distribuição entre motoristas → otimização → acompanhamento → execução.

O Spoke Dispatch é a evolução do antigo Circuit for Teams, enquanto o Spoke Route Planner é voltado principalmente ao motorista/usuário individual. A própria Spoke descreve essa evolução como Route Planner em 2018 e Circuit for Teams/Spoke Dispatch em 2020.

DOCUMENTO — BASE DE CONHECIMENTO DO ROTEIA
Benchmark Funcional, UX e Regras de Negócio do Spoke

Versão: 1.0
Projeto: ROTEIA
Objetivo: fornecer à IA de desenvolvimento uma referência funcional profunda para construção do ROTEIA.

1. Objetivo deste documento

Este documento não determina que o ROTEIA deve copiar o Spoke.

Ele determina que a equipe de desenvolvimento e os agentes de IA devem compreender:

o problema que o Spoke resolve;
como o usuário trabalha;
quais entidades existem;
quais informações são necessárias;
como uma rota é construída;
como uma rota é otimizada;
como o motorista executa a rota;
como o operador interfere no algoritmo;
quais problemas os usuários enfrentam;
quais funcionalidades são diferenciais;
quais funcionalidades devem ser melhoradas no ROTEIA.
Princípio

O ROTEIA deve aprender com o produto existente, mas não deve ficar limitado às decisões do produto existente.

2. O que descobrimos sobre o Spoke

O Spoke não é simplesmente um aplicativo de mapas.

Ele é essencialmente um sistema de:

Route Planning + Route Optimization + Navigation + Delivery Execution

No produto empresarial existe ainda:

Dispatch + Fleet/Driver Management + Tracking + Delivery Management.

A própria empresa descreve o Spoke Dispatch como uma solução para planejar, otimizar e atribuir rotas para múltiplos motoristas.

3. Os dois produtos que devemos estudar separadamente
3.1 Spoke Route Planner

Voltado principalmente para:

motorista;
entregador;
courier;
prestador de serviço;
profissional que possui várias paradas.

Fluxo:

CRIAR ROTA
    ↓
ADICIONAR PARADAS
    ↓
CONFIGURAR ROTA
    ↓
OTIMIZAR
    ↓
VISUALIZAR ORDEM
    ↓
NAVEGAR
    ↓
EXECUTAR PARADA
    ↓
ENTREGAR
    ↓
PRÓXIMA PARADA
4. Spoke Dispatch

É a camada empresarial.

Fluxo:

PEDIDOS
    ↓
PARADAS NÃO ATRIBUÍDAS
    ↓
PLANEJAMENTO
    ↓
DISTRIBUIÇÃO ENTRE MOTORISTAS
    ↓
OTIMIZAÇÃO
    ↓
PUBLICAÇÃO/DESPACHO
    ↓
MOTORISTAS
    ↓
ACOMPANHAMENTO
    ↓
ENTREGAS

O produto permite acompanhar motoristas no mapa e atualizar estimativas de chegada durante a execução.

5. Modelo mental do produto

A grande descoberta da pesquisa é que o objeto principal não é o mapa.

O objeto principal é a PARADA.

O mapa é uma representação visual da rota.

A lista é outra representação da rota.

A navegação é outra representação.

Portanto:

                 ┌───────────────┐
                 │     ROTA      │
                 └───────┬───────┘
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       MAPA            LISTA        TIMELINE
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                    MOTORISTA

Essa decisão arquitetural é extremamente importante para o ROTEIA.

6. Entidade fundamental: STOP

Uma parada precisa possuir muito mais informações do que:

endereço
latitude
longitude

O modelo conceitual deve contemplar:

STOP
├── id
├── cliente
├── endereço
├── latitude
├── longitude
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

Os prints encontrados mostram, por exemplo, edição de parada, instruções, código de portão, quantidade de pacotes, tipo de entrega e tempo no local.

7. Entrada de paradas

O Spoke oferece diferentes maneiras de inserir paradas.

A pesquisa encontrou:

Entrada manual
Digite o endereço
Voz
Falar endereço
Importação
CSV
Spreadsheet
Seleção no mapa
Clique no mapa
→
Adicionar parada
Parada existente

Uma parada pode ser reutilizada.

Isso é especialmente importante para o ROTEIA.

8. Cadastro permanente de clientes

Encontramos uma reclamação interessante na App Store:

um usuário que utiliza repetidamente os mesmos endereços sugeriu um cadastro de endereços/favoritos para não precisar recriar as mesmas paradas.

Isso confirma uma decisão que já havíamos tomado para o ROTEIA:

CLIENTE
   ↓
ENDEREÇO
   ↓
PARADA
   ↓
ROTA

Não devemos tratar endereço como dado descartável.

9. Geocodificação é parte crítica do negócio

Uma das descobertas mais importantes veio do próprio material da Spoke com o Google Maps.

A Spoke informa que utiliza:

Places Autocomplete;
Geocoding;
Google Maps Platform;
Navigation SDK;
Routes API.

O objetivo é validar endereços e localizar precisamente o imóvel. A empresa destaca inclusive a necessidade de localização em nível de propriedade/rooftop para melhorar a precisão das entregas.

Portanto:

ENDEREÇO DIGITADO
        ↓
VALIDAÇÃO
        ↓
GEOCODIFICAÇÃO
        ↓
CONFIRMAÇÃO
        ↓
LAT/LNG
        ↓
PARADA
Regra para o ROTEIA

Nunca devemos simplesmente aceitar um endereço e presumir que a coordenada está correta.

Precisamos armazenar:

address_raw
address_normalized
latitude
longitude
provider
confidence
geocoded_at
10. Construção da rota

A rota possui:

Origem
   ↓
Paradas
   ↓
Destino

Porém origem e destino podem ter comportamentos diferentes.

Origem

Pode ser:

empresa;
depósito;
endereço fixo;
localização atual;
endereço do motorista.
Destino

Pode ser:

empresa;
depósito;
endereço fixo;
localização diferente;
nenhum destino definido.
11. Regras de posição

O estudo das telas mostra que o conceito de prioridade de posição é importante.

Uma parada pode ser:

FIRST
AUTO
LAST

Ou seja:

FIRST

A parada deve ser a primeira.

AUTO

O algoritmo decide.

LAST

A parada deve ser a última.

Isso deve existir nativamente no ROTEIA.

12. O algoritmo não pode ser soberano

Esta é uma das conclusões mais importantes da pesquisa.

Usuários reclamam que o algoritmo pode escolher uma ordem que não corresponde à lógica operacional humana.

Um usuário brasileiro relatou que o aplicativo passa próximo de uma entrega e manda o motorista para outro bairro antes de retornar.

Outro usuário reclamou especificamente que, depois da otimização, não consegue reorganizar a rota facilmente arrastando os endereços como no Google Maps.

Portanto:

PRINCÍPIO DO ROTEIA

O algoritmo sugere. O operador decide.

13. Drag & Drop é requisito estratégico

O ROTEIA deverá permitir:

1 Cliente A
2 Cliente B
3 Cliente C
4 Cliente D
5 Cliente E

O usuário arrasta:

Cliente E

para:

posição 2

Resultado:

1 Cliente A
2 Cliente E
3 Cliente B
4 Cliente C
5 Cliente D

E então o sistema deve:

recalcular segmentos;
recalcular distância;
recalcular duração;
recalcular ETA;
verificar violações;
informar impacto.
14. Reordenação granular

Uma discussão recente no Reddit é ainda mais interessante.

Um usuário pediu que fosse possível mover diretamente uma parada da posição 10 para a posição 5, sem precisar utilizar uma sequência de comandos como "make next" ou "make last". Um representante da Circuit respondeu que estavam trabalhando em uma experiência de reorganização mais granular.

Isso é praticamente uma especificação de produto para nós.

ROTEIA deve permitir:
arrastar parada 27
        ↓
posição 4
        ↓
recalcular

sem obrigar o usuário a executar várias operações intermediárias.

15. Refinamento de rota

Outro conceito encontrado:

Refine

A ideia é permitir reorganizar grupos/áreas da rota sem necessariamente destruir todo o planejamento.

O próprio representante da Circuit comentou que estavam evoluindo essa experiência para permitir adicionar/remover áreas de grupos e reorganizar grupos existentes.

ROTEIA

Podemos transformar isso em:

ROTA
│
├── Região Norte
├── Região Centro
├── Região Sul
└── Região Leste

O operador poderia:

Norte → prioridade alta
Centro → prioridade normal
Sul → final
Leste → retirar da rota

Isso pode se tornar um diferencial enorme.

16. Agrupamento geográfico

Usuários também reclamam quando o algoritmo não agrupa corretamente as entregas.

Exemplo:

A
B
C
D

Todos no mesmo bairro.

O algoritmo deveria evitar:

A → B → X → Y → C → D

quando uma solução mais natural seria:

A → B → C → D → X → Y

Esse comportamento deve ser considerado no motor de otimização.

17. Time Windows

O Spoke trabalha com janelas de entrega.

Exemplo:

Cliente A
09:00 → 10:00

Cliente B
10:30 → 12:00

Cliente C
13:00 → 15:00

A otimização não pode considerar apenas distância.

Ela precisa considerar:

DISTÂNCIA
+
TEMPO DE VIAGEM
+
TEMPO DE SERVIÇO
+
JANELA DE ENTREGA
+
PRIORIDADE
+
ORIGEM
+
DESTINO
18. Tempo de serviço

Uma parada não representa somente o deslocamento.

Exemplo:

Chegar
↓
Estacionar
↓
Localizar cliente
↓
Entregar
↓
Coletar assinatura
↓
Voltar ao veículo

Portanto:

travel_time
+
service_time

deve fazer parte do planejamento.

O material visual do Spoke mostra configuração de tempo por parada e configurações de rota com intervalo de descanso.

19. Breaks

A rota pode possuir:

08:00 início

12:00 → 12:30
intervalo

18:00 fim

O intervalo precisa entrar no cálculo da rota.

20. ETA dinâmico

O ETA não é estático.

Inicialmente:

Stop 1 → 09:10
Stop 2 → 09:27
Stop 3 → 09:45

Depois que o motorista conclui a parada:

Stop 1 → concluído

o sistema deve recalcular:

Stop 2 → 09:31
Stop 3 → 09:51

O Spoke informa que atualiza os ETAs à medida que as entregas são realizadas e permite reotimizar o restante da rota quando necessário.

21. Reotimização durante a execução

Esse é um requisito essencial.

Imagine:

ROTA ORIGINAL

A → B → C → D → E → F

O motorista chega ao ponto B e:

C está fechado.

O operador deve conseguir:

pular C

e o sistema recalcula:

D → E → F

ou:

D → C → E → F

dependendo das regras.

22. Inserção de parada durante a rota

Outro requisito:

Motorista está executando:

A → B → C → D

Surge uma nova entrega:

X

O sistema precisa permitir:

Adicionar X

e escolher:

inserir automaticamente

ou:

inserir depois de B

ou:

colocar no final

O conceito de edição dinâmica de rotas também aparece em projetos modernos de route optimization, como o SDK da Geoapify, que suporta adicionar, remover, mover e reotimizar tarefas em rotas existentes.

23. Package Finder

Uma funcionalidade particularmente interessante encontrada no Spoke é o Package Finder.

O motorista pode registrar onde determinado pacote está dentro do veículo.

Exemplo:

Pacote 001
→ porta-malas

Pacote 002
→ banco traseiro

Pacote 003
→ caixa 4

Isso é um diferencial operacional muito forte para empresas de entrega.

Uma análise independente também destaca o Package Finder como uma das funcionalidades mais fortes do aplicativo do motorista.

ROTEIA

Devemos considerar:

VEÍCULO
 ├── posição
 │
 ├── pacote
 │
 └── parada
24. Prova de entrega

O produto também possui fluxo de:

ENTREGUE

ou:

FALHOU

e versões atuais mencionam melhorias na prova de entrega e contagem de pacotes.

Para o ROTEIA:

DELIVERY
├── delivered
├── failed
├── skipped
└── rescheduled

Futuras provas:

foto
assinatura
nome do recebedor
observação
GPS
timestamp
25. Navegação

Precisamos separar:

Route Planning

Responsável por:

qual parada vem primeiro?
Routing

Responsável por:

qual caminho usar entre A e B?
Navigation

Responsável por:

vire à direita em 200 metros.

São problemas diferentes.

O Spoke atualmente utiliza tecnologia do Google Maps Platform e Navigation SDK para navegação e informações de trânsito.

26. Arquitetura que devemos preservar no ROTEIA
                  ROTEIA
                    │
          ┌─────────┴─────────┐
          │                   │
      PLANEJAMENTO         EXECUÇÃO
          │                   │
          ↓                   ↓
     OPTIMIZATION          DRIVER APP
          │                   │
          ↓                   ↓
       ROUTING            NAVIGATION
          │                   │
          └─────────┬─────────┘
                    ↓
                  MAPA
27. Open Source encontrado

Aqui temos material extremamente importante.

27.1 VROOM

VROOM — Vehicle Routing Open-source Optimization Machine

Esse é um dos projetos mais importantes para estudarmos.

O VROOM suporta:

veículos;
jobs;
shipments;
pickup;
delivery;
capacidade;
janela de atendimento;
duração do serviço;
prioridade;
horário de trabalho;
intervalo do motorista;
origem;
destino;
múltiplos depósitos.

E pode trabalhar sobre:

OSRM;
OpenRouteService;
Valhalla.

Conclusão

VROOM deve entrar obrigatoriamente na nossa investigação técnica.

28. FleetPilot

FleetPilot no GitHub

Projeto recente em TypeScript com:

VRP;
pickup/delivery;
time windows;
veículos;
capacidade;
tráfego;
analytics;
GeoJSON;
CSV;
interface Next.js;
timeline;
Web Worker.

Ele é particularmente interessante para o nosso projeto porque utiliza tecnologias próximas ao nosso stack.

ROTEIA deve estudar:
fleetpilot/frontend
fleetpilot solver
time windows
traffic model
timeline
route replay
29. Geoapify Route Planner SDK

Geoapify Route Planner SDK no GitHub

Este projeto é especialmente interessante para nosso objetivo.

Ele implementa conceitos como:

assignJobs()
removeJobs()
addNewJobs()
moveWaypoint()
reoptimizeAgentPlan()

Ou seja:

edição da rota depois da otimização.

Isso confirma tecnicamente que a arquitetura que queremos para o ROTEIA é viável.

O SDK inclusive possui estratégias de:

reoptimize
preserveOrder

e permite mover manualmente uma parada.

30. RouteShaper

RouteShaper no GitHub

Outro projeto muito interessante.

Combina:

OpenRouteService
+
VRP Solver
+
PostgreSQL/Django
+
CSV
+
relatórios

Possui:

pickup;
delivery;
time windows;
veículos;
importação;
otimização;
emissão de CO₂;
relatórios.

31. OR-Tools

Também precisamos estudar profundamente:

Google OR-Tools — Vehicle Routing

O OR-Tools é uma das referências para:

CVRP
VRPTW
Pickup & Delivery
Multiple Vehicles
Capacity
Time Windows

Encontramos inclusive projetos práticos utilizando OR-Tools especificamente para rotas de entrega com capacidade e janelas de horário.

32. Jsprit

Outro motor que merece avaliação:

jsprit no GitHub

Ele trabalha com:

delivery;
pickup;
shipment;
service;
time windows;
vehicle routing.

33. OpenRouteService

openrouteservice no GitHub

É importante porque fornece infraestrutura de routing baseada em OpenStreetMap.

34. Encontramos um ponto importante

Não encontrei um:

"Spoke open source clone"

confiável no GitHub.

Isso é bom.

Significa que não precisamos tentar copiar um código proprietário.

Podemos construir o ROTEIA a partir de:

UX do Spoke
+
regras observadas
+
feedback dos usuários
+
VROOM
+
OR-Tools
+
OSRM
+
OpenRouteService
+
Leaflet
+
PostgreSQL
+
Next.js
35. Reclamações encontradas

Esta parte é extremamente importante.

Não queremos apenas saber:

"O que o Spoke faz?"

Queremos saber:

"Onde o Spoke falha?"

Porque essas falhas podem virar diferenciais do ROTEIA.

35.1 Problema: algoritmo aparentemente estranho

Usuários relatam situações em que:

passa perto da entrega
↓
não entrega
↓
vai para outro bairro
↓
retorna depois

ROTEIA

Precisamos explicar o resultado.

Por exemplo:

"O cliente B foi colocado depois do cliente C porque B possui janela de atendimento 10:00–11:00."

O usuário não deve receber uma rota "mágica".

36. Problema: edição manual

Reclamação atual:

dificuldade para reorganizar manualmente as paradas depois da otimização.

ROTEIA

Isso será prioridade máxima.

DRAG
↓
DROP
↓
RECALCULATE
↓
SHOW IMPACT
37. Problema: ETA

Usuários relatam discrepâncias entre ETA calculado e tempo real.

Em discussão no Reddit, usuários descrevem situações em que a estimativa muda significativamente assim que a navegação começa. Um representante da Circuit informou que estavam trabalhando com otimização baseada em Google Maps para melhorar a correspondência entre ETA e navegação e discutiu também estratégias para lidar melhor com janelas de tempo.

ROTEIA

Precisamos distinguir:

ETA PLANEJADO
ETA ATUAL
ETA ESTIMADO
ATRASO
38. Problema: scanner

Há reclamações sobre leitura incorreta de endereços através do scanner.

Usuários relataram que o scanner às vezes captura somente CEP/cidade e não o endereço completo.

ROTEIA

Se implementarmos scanner:

OCR
↓
ENDEREÇO EXTRAÍDO
↓
NORMALIZAÇÃO
↓
VALIDAÇÃO
↓
CONFIRMAÇÃO HUMANA

Nunca:

OCR
↓
ACEITAR AUTOMATICAMENTE
39. Problema: histórico

Um usuário brasileiro reclamou da dificuldade para limpar rotas antigas e organizar o histórico.

ROTEIA

Precisamos de:

Rotas de hoje
Rotas futuras
Rotas concluídas
Rotas arquivadas

com:

arquivar
excluir
duplicar
reutilizar
40. Problema: importação

Usuários dependem bastante de:

Excel
CSV
Google Sheets

Há inclusive discussões de usuários criando planilhas para preparar dados antes de enviar ao Circuit.

ROTEIA

Importação deve ser uma funcionalidade de primeira classe.

41. Problema: planos e limitações

Uma avaliação recente reclama que determinadas funcionalidades de importação estão associadas a um plano superior e que isso pode não ficar suficientemente claro antes da compra.

ROTEIA

Precisamos evitar:

funcionalidade essencial
↓
bloqueio inesperado

O plano deve deixar claro:

limite de paradas
limite de motoristas
importação
otimização
tracking
API
histórico
42. Oportunidades identificadas para o ROTEIA

Com base nessa pesquisa, temos uma lista inicial de diferenciais.

1. Edição manual superior
drag & drop
2. Explicação da otimização
Por que esta parada ficou aqui?
3. Reotimização parcial
somente restante da rota
4. Preservar ordem
não destruir decisões humanas
5. Rotas favoritas/templates
duplicar rota
6. Clientes recorrentes
cadastro permanente
7. Histórico inteligente
hoje
futuro
concluído
arquivado
8. Importação robusta
Excel
CSV
Google Sheets
API
9. Dados brasileiros
CEP
CNPJ
UF
cidade
bairro
WhatsApp
10. Multitenancy
empresa
→ usuários
→ motoristas
→ veículos
→ clientes
→ rotas
43. O que o ROTEIA NÃO deve fazer

A IA de desenvolvimento deve evitar algumas decisões ruins.

Não fazer:
Mapa como fonte principal de verdade
Não fazer:
Algoritmo impossível de editar
Não fazer:
Frontend dependente de um único provedor de mapas
Não fazer:
Endereço sem geocodificação validada
Não fazer:
ETA fixo
Não fazer:
rota destruída após alteração manual
Não fazer:
reotimização completa quando o usuário quer somente inserir uma parada
44. Arquitetura conceitual definitiva

Neste momento, minha recomendação é que a arquitetura conceitual do ROTEIA seja:

                         ROTEIA
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   CADASTROS           PLANEJAMENTO       EXECUÇÃO
        │                  │                  │
        │                  │                  │
   Clientes            Route Builder       Motorista
   Endereços            Stops              Navegação
   Motoristas           Constraints        Entrega
   Veículos             Optimization       POD
   Usuários             Manual Edit        Status
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                      ROUTE ENGINE
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
      VROOM             OR-Tools          futuro
        │                  │
        └──────────────────┼──────────────────┘
                           │
                     ROUTING ENGINE
                           │
              ┌────────────┼────────────┐
              │            │            │
             OSRM          ORS       Google
              │            │            │
              └────────────┼────────────┘
                           │
                         MAPA
                           │
                        Leaflet
45. Decisão estratégica sobre Google Maps

A pesquisa muda um pouco nossa visão anterior.

A Spoke utiliza fortemente Google Maps Platform porque considera a precisão dos endereços e localização crítica para a operação.

Por outro lado, o ROTEIA não precisa necessariamente colocar toda a infraestrutura em Google.

Podemos manter:

Map Rendering
    ↓
Leaflet

e abstrair:

GeocodingProvider
RoutingProvider
OptimizationProvider
NavigationProvider

Assim podemos ter:

Google
OSRM
OpenRouteService
VROOM
outros

sem reescrever o sistema.

46. Google Maps atualmente

Também precisamos corrigir uma informação importante do planejamento anterior.

O Google Maps Platform mudou sua estrutura de preços.

Atualmente existem categorias como:

Essentials;
Pro;
Enterprise;

e há chamadas gratuitas mensais por SKU em determinados produtos, além de planos pagos/assinaturas. A página oficial atual informa, por exemplo, 10 mil chamadas mensais gratuitas por SKU em Essentials e planos de assinatura a partir de US$100/mês para determinados conjuntos de funcionalidades.

Portanto:

Não devemos projetar o ROTEIA assumindo que Google Maps é "gratuito".

Devemos projetar para troca de provider.

47. A grande oportunidade técnica

O maior aprendizado dessa pesquisa não é:

"Vamos fazer um clone do Spoke."

É:

Vamos criar uma plataforma de roteirização onde o algoritmo e o operador trabalham juntos.

Isso nos leva ao conceito:

ALGORITMO
    ↓
SUGERE
    ↓
OPERADOR
    ↓
ACEITA / EDITA
    ↓
SISTEMA
    ↓
RECALCULA
    ↓
MOTORISTA
    ↓
EXECUTA
    ↓
SISTEMA
    ↓
APRENDE COM OS RESULTADOS
48. Diretriz para todos os agentes de IA do ROTEIA

A partir deste documento, qualquer agente que trabalhar no ROTEIA deverá assumir:

Regra 01

A rota é editável.

Regra 02

O algoritmo nunca deve impedir uma decisão humana legítima.

Regra 03

Toda alteração manual deve possuir impacto calculável.

Regra 04

O mapa é uma visualização da rota, não a fonte de verdade.

Regra 05

Uma parada possui contexto operacional.

Regra 06

ETA é dinâmico.

Regra 07

Rotas podem ser reotimizadas parcialmente.

Regra 08

Providers de mapas/roteamento são substituíveis.

Regra 09

Clientes e endereços recorrentes devem ser reutilizáveis.

Regra 10

O sistema deve explicar decisões importantes da otimização.

49. Repositórios que entram oficialmente na pesquisa do ROTEIA

A partir desta pesquisa inicial, considero estes projetos prioritários para os próximos agentes:

Projeto	Função	Prioridade
VROOM	Motor VRP	⭐⭐⭐⭐⭐
OR-Tools	Otimização	⭐⭐⭐⭐⭐
Geoapify Route Planner SDK	Edição dinâmica	⭐⭐⭐⭐⭐
FleetPilot	VRP + Next.js + TypeScript	⭐⭐⭐⭐⭐
OSRM	Routing	⭐⭐⭐⭐⭐
OpenRouteService	Routing/Matrix	⭐⭐⭐⭐
jsprit	VRP	⭐⭐⭐⭐
RouteShaper	Arquitetura logística	⭐⭐⭐⭐
TrafficIQ	IA + logística + tracking	⭐⭐⭐
projetos Leaflet/OSRM	UX/mapa	⭐⭐⭐
50. Conclusão desta etapa

Já temos material suficiente para afirmar que o ROTEIA não deve ser pensado como:

"um Google Maps com várias paradas."

Ele deve ser:

uma plataforma de planejamento e execução de operações de campo baseada em rotas.

E o núcleo será:

              ROTEIA
                 │
          ┌──────┴──────┐
          │             │
       HUMANO        ALGORITMO
          │             │
          └──────┬──────┘
                 ↓
             ROTA ÓTIMA
                 │
          ┌──────┴──────┐
          ↓             ↓
       DESPACHO     MOTORISTA
          │             │
          └──────┬──────┘
                 ↓
             EXECUÇÃO
                 ↓
               ETA
                 ↓
             RESULTADO

Essa é a base que devemos entregar para a próxima IA.

E tem uma próxima etapa que considero obrigatória antes de começarmos a codificar as telas: transformar toda essa pesquisa em uma matriz funcional do Spoke, tela por tela, componente por componente, ação por ação e regra por regra — incluindo Dashboard, criação de rota, lista de paradas, mapa, edição de parada, otimização, refine, time windows, driver, navegação, prova de entrega, importação, Dispatch e tracking.

Também devemos transformar os projetos open source encontrados em uma matriz técnica, identificando exatamente o que podemos reaproveitar como arquitetura/conceito, o que podemos instalar, quais licenças possuem e qual seria a melhor combinação VROOM + OSRM/ORS + Leaflet para o ROTEIA. Isso será a base ideal para o próximo documento da IA.