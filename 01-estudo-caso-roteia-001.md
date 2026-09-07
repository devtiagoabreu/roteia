Sim. Inclusive, dá para montar um MVP muito bom gastando praticamente R$ 0 no início.

Como você já trabalha com Next.js, Vercel, n8n e bancos SQL, eu faria uma arquitetura assim:

Stack
Frontend: Next.js 15 + React + TypeScript
Hospedagem: Vercel (plano gratuito)
Banco: PostgreSQL da Neon (grátis)
Autenticação: Clerk ou Supabase Auth
ORM: Prisma
Mapas: Google Maps JavaScript API
Geocoding: Google Geocoding API
Rotas: Google Routes API (substitui a antiga Directions API)
Armazenamento: Cloudflare R2 (opcional)
Multi-tenant

Uma estrutura simples:

Empresa
 ├── Usuários
 ├── Veículos
 ├── Motoristas
 ├── Clientes
 ├── Rotas
 └── Entregas

Todas as tabelas possuem:

tenant_id

Assim uma única aplicação atende milhares de empresas.

Funcionalidades
Login
Cadastro de clientes
Importação por Excel
Geolocalização automática
Planejamento de rota
Ordem das entregas
Mapa interativo
Distância
Tempo previsto
Exportar PDF
Compartilhar rota com motorista
Google Maps

Você consegue:

Mostrar mapa
Colocar marcadores
Calcular rota
Calcular distância
Calcular tempo
Trânsito em tempo real

Tudo usando a API do Google.

Existe um detalhe importante

O Google Maps não é totalmente gratuito.

Hoje ele possui um crédito mensal gratuito, suficiente para desenvolvimento e projetos pequenos, mas quando houver muitos cálculos de rota começará a cobrar conforme o uso. Vale acompanhar o consumo desde o início.

Alternativa totalmente gratuita

Se quiser evitar custos do Google no futuro:

OpenStreetMap
Leaflet
OpenRouteService
OSRM

Visualmente não ficam tão bonitos quanto o Google, mas reduzem bastante os custos.

Minha sugestão

Como você pretende hospedar na Vercel e criar um SaaS, eu faria algo assim:

Next.js + TypeScript
Vercel
Neon PostgreSQL
Prisma
Clerk
Google Maps
Google Routes API
React Query
Tailwind CSS
shadcn/ui

Essa arquitetura escala bem e permite começar no plano gratuito.

Também acrescentaria um diferencial importante: otimização automática de rotas (caixeiro-viajante/VRP), para que o sistema reorganize as entregas na sequência mais eficiente. Esse é o tipo de recurso que agrega bastante valor em um SaaS de logística.

Sim. Agora vamos fechar a arquitetura de roteirização. Vou manter a decisão do projeto: OpenStreetMap para dados/mapa, Leaflet para visualização e OpenRouteService como provider inicial de geocodificação/roteamento, mas deixando tudo desacoplado para trocar o provider depois.

RouteOS
Documento 13 — Arquitetura de Roteirização

Versão: 1.0
Status: Aprovado

1. Objetivo

Definir a arquitetura responsável por:

transformar endereços em coordenadas;
exibir pontos no mapa;
calcular rotas;
calcular distâncias e tempos;
otimizar a sequência das paradas;
permitir alteração manual da sequência;
recalcular a rota;
persistir o resultado.
2. Stack Geográfica

O MVP utilizará:

Função	Tecnologia
Dados geográficos	OpenStreetMap
Renderização do mapa	Leaflet
Geocodificação	OpenRouteService
Routing	OpenRouteService
Otimização	OpenRouteService
Frontend Map	React Leaflet
Backend	Next.js
Persistência	PostgreSQL + Prisma
3. Princípio Fundamental

O frontend não deverá depender diretamente da API do OpenRouteService para operações privadas.

Fluxo:

Frontend
   ↓
RouteOS API
   ↓
Routing Service
   ↓
Routing Provider
   ↓
OpenRouteService

Isso permite:

proteger API keys;
controlar limites;
implementar cache;
registrar consumo;
trocar provider;
adicionar regras próprias.
4. Abstração de Provider

Criar:

interface RoutingProvider {
  geocode(
    input: GeocodeInput
  ): Promise<GeocodeResult>;

  calculateRoute(
    input: RouteCalculationInput
  ): Promise<RouteCalculationResult>;

  optimizeRoute(
    input: RouteOptimizationInput
  ): Promise<RouteOptimizationResult>;
}

Implementação inicial:

OpenRouteServiceProvider

Futuramente:

GoogleRoutingProvider
HereRoutingProvider
MapboxRoutingProvider

sem alterar o domínio.

5. Geocodificação

Quando um cliente for cadastrado:

Endereço
   ↓
Geocoding Service
   ↓
OpenRouteService
   ↓
Latitude + Longitude

Exemplo:

{
  "latitude": -22.7539,
  "longitude": -47.4136
}

Essas coordenadas deverão ser armazenadas no Address.

6. Quando Geocodificar

Não geocodificar repetidamente o mesmo endereço.

Fluxo:

Cliente possui coordenadas?

SIM
 ↓
Utilizar coordenadas existentes

NÃO
 ↓
Geocodificar
 ↓
Salvar coordenadas

Se o endereço for alterado significativamente:

latitude = null
longitude = null

e uma nova geocodificação deverá ser realizada.

7. Endereço Não Encontrado

Se o provider não conseguir localizar o endereço:

CUSTOMER_INVALID_ADDRESS

O cliente não deverá ser incluído em uma rota até possuir coordenadas válidas.

A interface deverá informar:

Não foi possível localizar este endereço no mapa.

E permitir correção manual.

8. Ajuste Manual de Coordenadas

O usuário poderá ajustar a posição do cliente diretamente no mapa.

Fluxo:

Cliente
 ↓
Editar localização
 ↓
Arrastar marcador
 ↓
Salvar coordenadas

Isso será particularmente útil para:

áreas rurais;
endereços incompletos;
condomínios;
empresas sem numeração;
endereços mal cadastrados.
9. Fonte dos Dados do Mapa

O mapa utilizará OpenStreetMap como fonte cartográfica.

O mapa será renderizado através do Leaflet.

O Leaflet será responsável somente pela visualização.

Ele não será responsável pela lógica de negócio.

10. Leaflet

O frontend utilizará:

Leaflet
React Leaflet

Responsabilidades:

mapa;
zoom;
markers;
popup;
polyline;
interação;
seleção;
arrastar marcador.

Não deverá realizar diretamente regras de otimização.

11. Estrutura de uma Rota

Uma rota possui:

Origem
   ↓
Parada 1
   ↓
Parada 2
   ↓
Parada 3
   ↓
...
   ↓
Destino

Origem e destino poderão ser:

endereço da empresa;
base operacional;
localização inicial do motorista;
ponto definido manualmente.
12. Origem da Rota

O MVP deverá permitir configurar uma origem.

Modelo inicial:

Route Start

com:

latitude
longitude

A origem poderá futuramente ser relacionada a uma entidade:

Depot

Essa entidade não precisa ser implementada obrigatoriamente no primeiro MVP.

13. Destino da Rota

O destino poderá ser:

Mesmo da origem

ou:

Local diferente

No MVP, o padrão será:

Origem = Destino

Isso representa uma operação de saída e retorno à base.

14. Seleção das Paradas

O usuário seleciona clientes.

Exemplo:

Cliente A
Cliente B
Cliente C
Cliente D
Cliente E

O frontend envia apenas os IDs:

{
  "customerIds": [
    "uuid-a",
    "uuid-b",
    "uuid-c",
    "uuid-d",
    "uuid-e"
  ]
}

O backend busca as coordenadas.

Nunca confiar nas coordenadas enviadas pelo frontend como fonte de verdade.

15. Preparação da Rota

Backend:

customerIds
   ↓
Buscar Customers
   ↓
Validar tenant
   ↓
Validar active
   ↓
Buscar Address
   ↓
Validar latitude/longitude
   ↓
Criar lista de coordenadas

Resultado:

{
  "locations": [
    {
      "customerId": "A",
      "latitude": -22.75,
      "longitude": -47.41
    },
    {
      "customerId": "B",
      "latitude": -22.76,
      "longitude": -47.40
    }
  ]
}
16. Otimização

O RouteOS não deverá tentar implementar inicialmente seu próprio algoritmo matemático de Vehicle Routing Problem.

O MVP utilizará o serviço de otimização do provider.

Fluxo:

Clientes
 ↓
Coordenadas
 ↓
Routing Provider
 ↓
Optimization API
 ↓
Sequência otimizada
 ↓
RouteOS
17. Problema de Otimização

O problema inicial será:

Single Vehicle Routing Problem

Com:

uma origem;
um veículo;
múltiplas paradas;
um destino;
objetivo de minimizar distância/tempo.
18. MVP

O MVP NÃO deverá implementar:

múltiplos veículos simultâneos;
capacidade de carga;
janela de entrega;
prioridades avançadas;
múltiplos depósitos;
restrições complexas;
roteirização dinâmica.

Esses recursos serão previstos na arquitetura.

19. Evolução

Posteriormente:

VRP
 ↓
Multiple Vehicles
 ↓
Capacity
 ↓
Time Windows
 ↓
Priorities
 ↓
Multiple Depots
 ↓
Dynamic Routing
20. Matriz de Distâncias

Quando necessário, utilizar matriz de distância/tempo.

Exemplo:

       A     B     C     D

A      0    10     8    15
B     10     0     5     7
C      8     5     0     9
D     15     7     9     0

Cada valor representa:

distância

ou:

tempo
21. Quando Utilizar Matriz

No MVP, não utilizar matriz se o endpoint de otimização do provider já resolver diretamente o problema.

A matriz deverá existir como abstração para futuras estratégias próprias.

Interface:

interface DistanceMatrixProvider {
  calculateMatrix(
    locations: Coordinate[]
  ): Promise<DistanceMatrix>;
}
22. Cálculo da Rota Final

Após obter a sequência otimizada:

Origem
 ↓
Parada 3
 ↓
Parada 1
 ↓
Parada 5
 ↓
Parada 2
 ↓
Destino

O backend deverá calcular a geometria da rota final.

Fluxo:

Optimization
 ↓
Sequence
 ↓
Route Calculation
 ↓
Geometry + Distance + Duration
23. Por que Separar Otimização e Routing

O resultado da otimização pode informar a ordem das paradas.

O cálculo da rota final fornece:

geometria;
distância;
duração;
instruções futuras.

Separar as duas operações torna a arquitetura mais flexível.

24. Resultado Interno

O domínio deverá trabalhar com:

interface OptimizedRoute {
  distanceMeters: number;
  durationSeconds: number;

  stops: OptimizedStop[];

  geometry: string;
}

Stop:

interface OptimizedStop {
  customerId: string;
  sequence: number;
  arrivalEstimate?: Date;
}
25. Persistência

Após otimização:

Route

será criada.

Depois:

RouteStop
RouteStop
RouteStop
...

serão criados conforme a sequência.

26. Geometry

A geometria será armazenada na rota.

Formato inicial:

encoded polyline

O frontend poderá transformar essa geometria em:

Leaflet Polyline
27. Renderização

Frontend:

API Response
   ↓
Decode Geometry
   ↓
Leaflet
   ↓
Polyline

A geometria não deverá ser recalculada no frontend.

28. Marcadores

Cada parada deverá possuir um marker.

Antes da otimização:

●
●
●
●

Depois:

①
②
③
④

O número deverá corresponder ao sequence.

29. Sincronização Mapa ↔ Lista

A lista e o mapa deverão representar a mesma sequência.

Se o usuário alterar:

1 → A
2 → B
3 → C

para:

1 → C
2 → A
3 → B

o mapa deverá refletir imediatamente a nova ordem visual.

30. Alteração Manual

Quando o usuário alterar a ordem:

RouteStop.sequence

deverá ser atualizado.

A rota calculada anteriormente deverá ser considerada inválida.

Estado:

PLANNED

ou um estado interno equivalente de "recalcular necessário".

31. Reotimização

Botão:

Reotimizar rota

deverá:

obter sequência atual;
enviar novamente ao provider;
recalcular;
atualizar sequência;
atualizar geometria;
atualizar distância;
atualizar duração.
32. Cache de Geocoding

Criar cache por endereço normalizado.

Exemplo de chave:

BR|SP|Santa Barbara d'Oeste|13450-000|Rua Exemplo|100

Antes de consultar o provider:

Cache?
 ↓
SIM → usar
NÃO → consultar provider
33. Normalização de Endereço

Antes da geocodificação:

remover espaços duplicados;
normalizar CEP;
normalizar UF;
normalizar país;
padronizar número;
padronizar texto.

Objetivo:

reduzir chamadas duplicadas.

34. Cache de Routing

Não utilizar cache indiscriminado de rotas.

Uma rota poderá depender de:

sequência;
origem;
destino;
provider;
versão do provider;
condições/configurações.

O cache de rota deverá ser implementado somente quando houver benefício comprovado.

35. Limites do Provider

O backend deverá tratar limites de utilização do provider.

Nunca assumir que o serviço externo possui capacidade infinita.

Criar uma abstração:

interface ProviderUsage {
  requestsUsed: number;
  requestsRemaining?: number;
}

A implementação poderá evoluir posteriormente.

36. Rate Limit Interno

Além do limite externo, o RouteOS deverá limitar operações de roteirização por tenant.

Exemplo conceitual:

Tenant
 ↓
Otimizações por minuto
 ↓
Limite

O valor exato deverá ser configurável.

37. Falha do Provider

Se OpenRouteService falhar:

RoutingProvider
 ↓
ExternalServiceError
 ↓
RouteOptimizationService
 ↓
API
 ↓
Frontend

Resposta:

{
  "success": false,
  "error": {
    "code": "ROUTE_OPTIMIZATION_FAILED",
    "message": "Não foi possível calcular a rota neste momento."
  }
}

Não expor detalhes internos da API externa ao usuário.

38. Retry

Retry deverá ser utilizado apenas para erros transitórios.

Exemplos:

Timeout
HTTP 502
HTTP 503
HTTP 504

Não realizar retry infinito.

39. Timeout

Toda chamada externa deverá possuir timeout.

Valor inicial recomendado:

15 segundos

O valor deverá ficar configurável.

40. Provider Offline

Se o provider estiver indisponível:

A aplicação deverá continuar permitindo:

cadastro;
edição;
consulta;
organização manual de clientes.

Somente operações que dependam do provider deverão ficar indisponíveis.

41. Rota Manual

O sistema deverá permitir criar uma rota sem otimização automática.

Fluxo:

Selecionar clientes
 ↓
Definir ordem manual
 ↓
Salvar

Isso garante que a operação não dependa completamente do provider.

42. Coordenadas Manuais

O usuário poderá informar:

Latitude
Longitude

ou mover o marcador no mapa.

Essa informação deverá substituir a coordenada geocodificada anterior.

43. Precisão

Não apresentar falsa precisão.

Exibir:

48,5 km

em vez de:

48,532871 km

No banco, entretanto, manter precisão suficiente.

44. ETA

No MVP, ETA será estimado com base em:

scheduledDate
+
route duration

Posteriormente poderá incorporar:

horário de saída;
tempo de serviço;
trânsito;
janela de entrega;
pausas.
45. Tempo de Serviço

O modelo deverá estar preparado para futuramente armazenar:

serviceDurationSeconds

por cliente.

No MVP:

serviceDurationSeconds = 0

ou valor configurável globalmente.

46. Janela de Entrega

Não implementar no MVP.

Porém o domínio deverá permitir futuramente:

deliveryWindowStart
deliveryWindowEnd

por parada.

47. Capacidade do Veículo

Não utilizar capacidade no algoritmo do MVP.

Mas manter:

weightCapacity
volumeCapacity

em Vehicle.

Futuro:

Cliente
  ↓
peso / volume
  ↓
Vehicle Capacity
  ↓
VRP
48. Prioridade

Não implementar no MVP.

Futuro:

LOW
NORMAL
HIGH
URGENT

Isso poderá influenciar a otimização.

49. Arquitetura Interna

Estrutura:

modules/routes/

domain/
    entities/
        route.ts
        route-stop.ts

    repositories/
        route-repository.ts

    services/
        route-domain-service.ts

application/
    services/
        create-route.service.ts
        optimize-route.service.ts
        reorder-route-stops.service.ts

    dto/
        optimize-route.dto.ts

infrastructure/
    providers/
        routing/
            routing-provider.ts
            openrouteservice.provider.ts

        geocoding/
            geocoding-provider.ts
            openrouteservice.provider.ts

    repositories/
        prisma-route.repository.ts

presentation/
    schemas/
        optimize-route.schema.ts
50. Routing Provider

Interface:

interface RoutingProvider {
  calculateRoute(
    input: RouteCalculationInput
  ): Promise<RouteCalculationResult>;

  optimizeRoute(
    input: RouteOptimizationInput
  ): Promise<RouteOptimizationResult>;
}
51. Geocoding Provider

Interface:

interface GeocodingProvider {
  geocode(
    input: GeocodeInput
  ): Promise<GeocodeResult>;

  reverseGeocode(
    input: Coordinate
  ): Promise<AddressResult | null>;
}
52. Domain Independence

O domínio nunca poderá importar:

OpenRouteService
Leaflet
OpenStreetMap
React
Next.js
Prisma

Esses elementos pertencem à infraestrutura ou apresentação.

53. Fluxo Completo
Usuário
  ↓
Seleciona clientes
  ↓
Frontend
  ↓
POST /api/v1/routes/optimize
  ↓
Authentication
  ↓
Tenant
  ↓
Authorization
  ↓
Validation
  ↓
OptimizeRouteService
  ↓
CustomerRepository
  ↓
Validação das coordenadas
  ↓
RoutingProvider
  ↓
OpenRouteService
  ↓
Sequência otimizada
  ↓
Route Calculation
  ↓
Geometria
  ↓
Persistência
  ↓
Route + RouteStops
  ↓
API Response
  ↓
Leaflet
  ↓
Mapa + Sequência
54. Fluxo de Geocodificação
Cadastro de cliente
  ↓
Salvar endereço
  ↓
Verificar coordenadas
  ↓
Geocoding Service
  ↓
Cache
  ↓
OpenRouteService
  ↓
Latitude/Longitude
  ↓
Atualizar Address
55. Fluxo de Reordenação
Drag & Drop
  ↓
Nova sequência
  ↓
PUT /routes/{id}/stops/reorder
  ↓
Validar Route
  ↓
Atualizar RouteStops
  ↓
Invalidar geometria
  ↓
Marcar necessidade de recalcular
56. Fluxo de Reotimização
Reotimizar
  ↓
Obter Route
  ↓
Obter RouteStops
  ↓
Enviar coordenadas
  ↓
Provider
  ↓
Nova sequência
  ↓
Novo routing
  ↓
Atualizar Route
  ↓
Atualizar RouteStops
  ↓
Auditoria
57. Segurança

A API de roteirização deverá:

validar autenticação;
validar tenant;
validar permissões;
validar IDs;
validar coordenadas;
limitar tamanho da requisição;
aplicar rate limiting;
proteger API key;
registrar erros.
58. Não Expor API Key

A chave:

ORS_API_KEY

somente poderá existir no servidor.

Nunca utilizar:

NEXT_PUBLIC_ORS_API_KEY
59. Configuração

Variáveis:

ORS_API_KEY=
ORS_BASE_URL=
ROUTING_TIMEOUT_MS=15000
GEOCODING_CACHE_TTL=
ROUTING_PROVIDER=openrouteservice
60. Troca de Provider

A aplicação deverá permitir:

ROUTING_PROVIDER=openrouteservice

Futuramente:

ROUTING_PROVIDER=google

sem modificar:

Route entity;
Services;
frontend;
banco;
API pública.

Somente a implementação do Provider deverá mudar.

61. OpenStreetMap

O OpenStreetMap será tratado como fonte cartográfica.

Não confundir:

OpenStreetMap

com:

Routing Provider

OpenStreetMap fornece dados cartográficos.

O serviço de roteamento será responsável por calcular caminhos.

62. Leaflet

Leaflet também não será um serviço de roteamento.

Responsabilidade:

Visualização

Não:

Otimização
63. OpenRouteService

No MVP será o provider principal para:

geocodificação;
routing;
otimização;
matriz de distância, quando necessária.

A integração deverá ficar isolada atrás das interfaces.

64. Testes

Criar testes para:

Geocoding
endereço válido
endereço inválido
provider indisponível
cache
Routing
rota válida
coordenada inválida
provider indisponível
timeout
Optimization
2 clientes
10 clientes
nenhum cliente
cliente sem coordenada
cliente de outro tenant
Reorder
ordem válida
ID inexistente
duplicidade
rota finalizada
65. Teste de Isolamento Multi-Tenant

Obrigatório:

Tenant A
 └── Cliente A

Tenant B
 └── Cliente B

Usuário do Tenant A tentando utilizar Cliente B deverá receber:

404

ou erro equivalente sem revelar a existência do recurso.

66. Critérios de Aceite

A arquitetura será considerada implementada quando:

OpenStreetMap estiver configurado;
Leaflet estiver funcionando;
OpenRouteService estiver isolado em Provider;
geocodificação funcionar;
clientes possuírem coordenadas;
pontos aparecerem no mapa;
rota puder ser otimizada;
sequência puder ser alterada manualmente;
rota puder ser recalculada;
geometria for exibida;
distância e duração forem persistidas;
API key não aparecer no frontend;
erros do provider forem tratados;
isolamento Multi-Tenant estiver testado.
Decisão Arquitetural Final

O RouteOS não ficará amarrado ao OpenRouteService.

A arquitetura será:

                 ┌─────────────────────┐
                 │      RouteOS        │
                 └──────────┬──────────┘
                            │
                     RoutingProvider
                            │
             ┌──────────────┴──────────────┐
             │                             │
┌────────────▼────────────┐   ┌────────────▼────────────┐
│ OpenRouteServiceProvider │   │ Futuro Provider         │
│                          │   │ Google / HERE / Mapbox  │
└──────────────────────────┘   └─────────────────────────┘

No frontend:

OpenStreetMap
      ↓
   Leaflet
      ↓
Visualização

No backend:

RouteOS
  ↓
RoutingProvider
  ↓
OpenRouteService
  ↓
Otimização + Routing

Essa separação é obrigatória para que o SaaS possa começar utilizando serviços gratuitos/de baixo custo e posteriormente migrar para um provider comercial sem precisar reescrever o produto.

ok proximo

Perfeito. O próximo documento deve fechar uma parte crítica para o SaaS multitenant: banco de dados, isolamento entre empresas, RBAC e modelo de cobrança. Isso vem antes de começar a codificação porque praticamente todo o restante depende desse contrato.

Documento 14 — Banco de Dados e Multi-Tenant
RouteOS
Documento 14 — Banco de Dados e Multi-Tenant

Versão: 1.0
Status: Aprovado
1. Objetivo

Definir:

banco de dados;
entidades;
relacionamentos;
isolamento de tenants;
usuários;
permissões;
planos;
limites;
auditoria;
soft delete.
2. Banco

Utilizar:

PostgreSQL

ORM:

Prisma

Arquitetura:

Next.js
   ↓
Prisma
   ↓
PostgreSQL

O banco deverá ser compatível com hospedagem externa gratuita ou de baixo custo.

3. Estratégia Multi-Tenant

Utilizar:

Shared Database
+
Shared Schema
+
tenantId

Exemplo:

customers
────────────────────────
id
tenant_id
name
...

Todos os recursos pertencentes a uma empresa deverão possuir:

tenantId
4. Regra Fundamental

Nenhuma query de negócio poderá acessar dados sem considerar o tenant.

Errado:

prisma.customer.findMany()

Correto:

prisma.customer.findMany({
  where: {
    tenantId
  }
})
5. Tenant

Tabela:

Tenant

Campos:

id
name
slug
email
phone
status
timezone
language
createdAt
updatedAt
deletedAt

Status:

ACTIVE
SUSPENDED
CANCELED
6. User
User

Campos:

id
tenantId
name
email
passwordHash
role
status
lastLoginAt
createdAt
updatedAt
deletedAt

Um usuário pertence a apenas um tenant no MVP.

7. Roles

Utilizar:

ADMIN
MANAGER
DISPATCHER
DRIVER
VIEWER
ADMIN

Pode:

administrar empresa;
usuários;
clientes;
motoristas;
veículos;
rotas;
configurações;
auditoria.
MANAGER

Pode:

clientes;
motoristas;
veículos;
rotas;
relatórios.

Não pode:

alterar configurações críticas;
administrar ADMIN.
DISPATCHER

Pode:

clientes;
visualizar motoristas;
visualizar veículos;
planejar rotas;
otimizar rotas.
DRIVER

Pode:

visualizar suas rotas;
atualizar status da própria rota;
visualizar paradas.
VIEWER

Somente leitura.

8. Customer
Customer

Campos:

id
tenantId
code
name
document
email
phone
mobile
notes
active
createdAt
updatedAt
deletedAt

Unique:

tenantId + code
9. Address
Address

Campos:

id
customerId
zipcode
street
number
complement
district
city
state
country
latitude
longitude
geocodedAt
geocodingProvider
createdAt
updatedAt

Um cliente poderá possuir mais de um endereço futuramente.

No MVP:

Customer 1 ─── 1 Address
10. Driver
Driver

Campos:

id
tenantId
name
document
cnh
cnhCategory
cnhExpiration
phone
email
status
createdAt
updatedAt
deletedAt
11. Vehicle
Vehicle

Campos:

id
tenantId
plate
model
manufacturer
year
type
weightCapacity
volumeCapacity
averageConsumption
status
createdAt
updatedAt
deletedAt

Unique:

tenantId + plate
12. Route
Route

Campos:

id
tenantId

scheduledDate

driverId
vehicleId

startLatitude
startLongitude

endLatitude
endLongitude

distanceMeters
durationSeconds

geometry

status

optimizationProvider
optimizedAt

createdAt
updatedAt
deletedAt
13. RouteStop
RouteStop

Campos:

id
routeId
customerId
sequence

latitude
longitude

distanceFromPreviousMeters
durationFromPreviousSeconds

estimatedArrivalAt

status

createdAt
updatedAt

Status:

PENDING
IN_PROGRESS
COMPLETED
SKIPPED
FAILED
14. RouteStop Snapshot

A parada deverá armazenar:

latitude
longitude

mesmo que o endereço do cliente seja posteriormente alterado.

Isso é importante.

Exemplo:

Cliente
Rua A
 ↓
Rota criada
 ↓
Cliente muda para Rua B

A rota antiga deverá continuar apontando para:

Rua A

Portanto, a RouteStop representa um snapshot operacional.

15. ImportJob
ImportJob

Campos:

id
tenantId
userId

filename
type
status

totalRows
processedRows
successRows
errorRows

createdAt
startedAt
finishedAt

Tipos:

CUSTOMERS

Futuramente:

DRIVERS
VEHICLES
16. ImportError
ImportError

Campos:

id
importJobId
rowNumber
field
value
message
createdAt
17. AuditLog
AuditLog

Campos:

id
tenantId
userId

action
entity
entityId

oldData
newData

ipAddress
userAgent

createdAt

Exemplos:

CUSTOMER_CREATED
CUSTOMER_UPDATED
CUSTOMER_DELETED

ROUTE_CREATED
ROUTE_OPTIMIZED
ROUTE_REORDERED
ROUTE_CANCELED

USER_CREATED
USER_UPDATED
18. Plan

O sistema será preparado para SaaS.

Tabela:

Plan

Campos:

id
name
slug

maxUsers
maxCustomers
maxDrivers
maxVehicles

monthlyRouteLimit

features

active

createdAt
updatedAt
19. TenantSubscription
TenantSubscription

Campos:

id
tenantId
planId

status

startedAt
expiresAt

createdAt
updatedAt

Status:

TRIAL
ACTIVE
PAST_DUE
CANCELED
20. Billing

A cobrança não deverá ser implementada no primeiro MVP.

Porém a arquitetura deverá permitir:

Tenant
 ↓
Subscription
 ↓
Plan

Posteriormente poderá integrar:

Stripe
Mercado Pago
Asaas

sem alterar as entidades principais.

21. Trial

O sistema deverá estar preparado para trial.

Configuração:

TRIAL_DAYS=14

Quando o tenant for criado:

Tenant
 ↓
Subscription
 ↓
TRIAL
22. Limites

Os limites deverão ser verificados no backend.

Exemplo:

Plano Starter

Usuários: 3
Clientes: 1.000
Motoristas: 10
Veículos: 10
Rotas/mês: 500

Os valores finais poderão ser definidos posteriormente.

23. Regra de Limite

Nunca confiar no frontend.

Errado:

Frontend verifica limite

Correto:

Frontend
   ↓
API
   ↓
SubscriptionService
   ↓
Verificação
   ↓
Banco
24. Excedeu Limite

Resposta:

{
  "success": false,
  "error": {
    "code": "PLAN_LIMIT_REACHED",
    "message": "O limite do seu plano foi atingido."
  }
}

HTTP:

403

ou:

409

conforme o contexto.

25. Soft Delete

Entidades principais utilizarão:

deletedAt

Não excluir fisicamente:

Customer;
Driver;
Vehicle;
User;
Route.
26. Exceção

Logs e dados temporários poderão utilizar exclusão física quando apropriado.

27. Índices

Criar índices principalmente em:

tenantId
tenantId + status
tenantId + createdAt
tenantId + deletedAt
28. Customer Indexes
tenantId
tenantId + code
tenantId + name
tenantId + active
29. Route Indexes
tenantId
tenantId + scheduledDate
tenantId + status
tenantId + driverId
tenantId + vehicleId
30. RouteStop Indexes
routeId
routeId + sequence
customerId

Unique:

routeId + sequence
31. User Indexes
tenantId
tenantId + email

Email deverá ser tratado de maneira case-insensitive.

32. Prisma

O schema deverá utilizar:

prisma/schema.prisma

Exemplo conceitual:

model Customer {
  id        String   @id @default(uuid())
  tenantId  String

  code      String?
  name      String

  active    Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
  @@index([tenantId, active])
}
33. Tenant Context

Toda requisição autenticada deverá gerar um contexto:

type TenantContext = {
  tenantId: string;
  userId: string;
  role: Role;
};
34. Repository

Repositories deverão receber o contexto.

Exemplo:

customerRepository.findMany({
  tenantId,
  filters
})

Não:

customerRepository.findMany(filters)
35. Service

Services deverão trabalhar com contexto.

optimizeRouteService.execute({
  tenantId,
  userId,
  ...
})
36. Proibição

É proibido que controllers recebam:

tenantId

do body para definir o tenant.

Exemplo proibido:

{
  "tenantId": "..."
}

O tenant vem da autenticação.

37. Segurança

Nunca retornar:

tenantId

como mecanismo de autorização.

Ele poderá aparecer em respostas administrativas quando necessário, mas nunca será considerado uma prova de pertencimento.

38. Cross-Tenant

Teste obrigatório:

Tenant A
Customer A

Tenant B
Customer B

Usuário A:

GET /customers/customer-b

Resultado:

404

O sistema não deverá revelar:

"Customer B exists but belongs to another tenant."
39. Transações

Operações críticas deverão utilizar transação.

Exemplo:

Criar rota
+
Criar RouteStops
+
Registrar AuditLog

Tudo deverá ocorrer dentro de uma transação quando possível.

40. Otimização + Persistência

Não persistir parcialmente uma rota otimizada.

Fluxo:

Provider
 ↓
Resultado válido?
 ↓ SIM
Transaction
 ├── Route
 ├── RouteStops
 └── AuditLog
 ↓
Commit

Se falhar:

Rollback
41. Concorrência

Dois usuários podem tentar editar a mesma rota.

Implementar futuramente:

updatedAt

como mecanismo de optimistic concurrency.

Exemplo:

version

poderá ser adicionado posteriormente.

42. Timestamps

Todos os timestamps deverão ser armazenados em:

UTC

A apresentação utilizará:

tenant.timezone
43. Datas

Banco:

UTC

Frontend:

America/Sao_Paulo

ou timezone configurado pelo tenant.

44. Documentos

CPF/CNPJ/CNH deverão ser armazenados normalizados.

Exemplo:

Entrada:

123.456.789-00

Banco:

12345678900

A máscara será responsabilidade do frontend.

45. Telefone

Armazenar preferencialmente em formato normalizado.

Exemplo:

5519999999999

A apresentação poderá utilizar:

(19) 99999-9999
46. Slug

Tenant:

Minha Empresa Ltda

Slug:

minha-empresa

O slug deverá ser único.

47. Soft Delete e Unicidade

Cuidado com:

tenantId + code

e registros deletados.

A estratégia deverá permitir reutilização do código após exclusão lógica somente se isso fizer sentido para o domínio.

Preferência inicial:

códigos excluídos continuam reservados.

48. Auditoria

Ações críticas obrigatoriamente registradas:

USER_CREATED
USER_DELETED

CUSTOMER_CREATED
CUSTOMER_UPDATED
CUSTOMER_DELETED

DRIVER_CREATED
DRIVER_UPDATED
DRIVER_DELETED

VEHICLE_CREATED
VEHICLE_UPDATED
VEHICLE_DELETED

ROUTE_CREATED
ROUTE_OPTIMIZED
ROUTE_REORDERED
ROUTE_CANCELED
ROUTE_STARTED
ROUTE_FINISHED

TENANT_UPDATED
49. Dados Sensíveis

Não registrar em AuditLog:

senha;
tokens;
API keys;
secrets;
dados de autenticação.

Antes de salvar oldData ou newData, realizar sanitização.

50. Backup

O banco deverá possuir backup fornecido pelo serviço PostgreSQL escolhido.

O projeto deverá documentar:

backup frequency
retention
restore procedure

A configuração exata dependerá do provider escolhido.

51. Migrações

Todas as alterações deverão utilizar:

Prisma Migrate

Nunca alterar produção manualmente sem migração correspondente.

52. Seed

Criar:

prisma/seed.ts

O seed deverá criar:

1 Tenant
1 ADMIN
1 Plan
1 Subscription
5 Customers
2 Drivers
2 Vehicles
1 Route

Somente para desenvolvimento/testes.

53. Dados de Teste

Nunca utilizar dados reais.

Utilizar:

Empresa Demo
Cliente Demo
Motorista Demo
Veículo Demo
54. Diagrama
                 ┌──────────────┐
                 │    Tenant    │
                 └──────┬───────┘
                        │
       ┌────────────────┼─────────────────┐
       │                │                 │
       ▼                ▼                 ▼
     Users          Customers          Drivers
                         │
                         ▼
                      Address

       │                │                 │
       │                │                 │
       └────────────────┼─────────────────┘
                        │
                        ▼
                      Routes
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
        RouteStops              Vehicle
55. Fluxo Multi-Tenant
Request
   ↓
Authentication
   ↓
User
   ↓
tenantId
   ↓
TenantContext
   ↓
Service
   ↓
Repository
   ↓
WHERE tenantId = context.tenantId
   ↓
PostgreSQL
56. Regra de Ouro

Toda entidade pertencente ao cliente SaaS deverá responder à pergunta:

"A qual tenant este registro pertence?"

Se a resposta não estiver clara, o modelo está incorreto.

57. Critérios de Aceite

O banco será considerado conforme quando:

PostgreSQL estiver configurado;
Prisma estiver configurado;
migrations funcionarem;
seed funcionar;
Tenant existir;
User estiver ligado ao Tenant;
Customers estiverem isolados;
Drivers estiverem isolados;
Vehicles estiverem isolados;
Routes estiverem isoladas;
RouteStops estiverem isoladas através da Route;
AuditLog estiver isolado;
planos estiverem modelados;
subscription estiver modelada;
soft delete estiver implementado;
testes cross-tenant estiverem implementados.
Decisão Arquitetural

O RouteOS utilizará:

PostgreSQL
+
Prisma
+
Shared Database
+
Shared Schema
+
tenantId

O isolamento será aplicado em todas as camadas:

Authentication
      ↓
TenantContext
      ↓
Services
      ↓
Repositories
      ↓
Database

O tenant nunca será escolhido pelo frontend.

Essa regra é uma das principais garantias de segurança do SaaS.


### Próximo documento

O próximo é o **Documento 15 — Arquitetura do Projeto Next.js**, onde vamos transformar tudo isso em uma estrutura real de pastas, módulos, componentes, Prisma, API, autenticação, middlewares, Zod, React Query/TanStack Query, Leaflet e configuração para **Vercel**.

A partir dele já estaremos praticamente no nível de **"entregar a documentação para o OpenCode e mandar desenvolver"**.
pode fazer

Perfeito. Agora vamos transformar toda a arquitetura anterior em uma estrutura concreta de projeto, já pensando no OpenCode gerar o sistema sem inventar organização própria.

Documento 15 — Arquitetura do Projeto Next.js
RouteOS
Documento 15 — Arquitetura do Projeto Next.js

Versão: 1.0
Status: Aprovado
1. Objetivo

Definir:

estrutura de diretórios;
stack frontend/backend;
convenções;
módulos;
autenticação;
API;
Prisma;
validação;
estado;
mapas;
tratamento de erros;
testes;
configuração para Vercel.
2. Stack Oficial

O projeto deverá utilizar:

Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
Prisma
PostgreSQL
Zod
TanStack Query
React Hook Form
Leaflet
React Leaflet
dnd-kit

Para autenticação:

Auth.js

ou implementação equivalente somente se houver justificativa técnica.

A preferência é utilizar uma solução consolidada e evitar autenticação criada manualmente.

3. Runtime

O projeto será executado inicialmente na:

Vercel

Backend:

Next.js Route Handlers

Não criar um servidor Express separado no MVP.

Arquitetura:

Browser
   ↓
Next.js
   ├── React UI
   ├── Server Components
   ├── Route Handlers
   └── Services
          ↓
       Prisma
          ↓
      PostgreSQL
4. Estrutura Principal

A estrutura inicial deverá ser:

routeos/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── forgot-password/
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── routes/
│   │   ├── customers/
│   │   ├── drivers/
│   │   ├── vehicles/
│   │   ├── users/
│   │   ├── audit/
│   │   └── settings/
│   │
│   ├── api/
│   │   └── v1/
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── tables/
│   ├── maps/
│   └── feedback/
│
├── modules/
│   ├── auth/
│   ├── tenants/
│   ├── users/
│   ├── customers/
│   ├── drivers/
│   ├── vehicles/
│   ├── routes/
│   ├── imports/
│   ├── audit/
│   ├── billing/
│   └── routing/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── http/
│   ├── validation/
│   ├── errors/
│   ├── permissions/
│   ├── tenant/
│   ├── cache/
│   └── utils/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── hooks/
│
├── types/
│
├── config/
│
├── tests/
│
├── docs/
│
├── public/
│
├── middleware.ts
├── auth.ts
├── prisma.config.ts
├── next.config.ts
├── tsconfig.json
├── eslint.config.js
├── package.json
└── README.md
5. App Router

Utilizar exclusivamente:

Next.js App Router

Não utilizar:

Pages Router
6. Route Groups

Utilizar:

(auth)
(dashboard)

para separar layouts sem alterar URLs.

Exemplo:

app/
├── (auth)/
│   └── login/
│
└── (dashboard)/
    └── customers/

URL:

/login
/customers
7. Dashboard Layout

Arquivo:

app/(dashboard)/layout.tsx

Responsabilidades:

autenticação;
sidebar;
header;
tenant atual;
usuário;
theme;
navegação.

Estrutura:

DashboardLayout
├── Sidebar
├── Header
└── MainContent
8. Sidebar

Componente:

components/layout/sidebar.tsx

A navegação deverá ser baseada em permissões.

Exemplo:

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    permission: "dashboard.read"
  },
  {
    label: "Rotas",
    href: "/routes",
    permission: "routes.read"
  },
  {
    label: "Clientes",
    href: "/customers",
    permission: "customers.read"
  }
];

Não esconder apenas visualmente.

A API também deverá validar permissão.

9. Componentes UI

Todos os componentes genéricos deverão ficar:

components/ui/

Exemplos:

button.tsx
input.tsx
select.tsx
dialog.tsx
dropdown-menu.tsx
table.tsx
badge.tsx
card.tsx
tabs.tsx
tooltip.tsx
calendar.tsx

Preferência:

shadcn/ui
10. Componentes de Domínio

Não colocar componentes específicos dentro de components/ui.

Exemplo:

components/maps/route-map.tsx
components/maps/customer-marker.tsx

e:

modules/routes/components/route-stop-list.tsx
modules/routes/components/route-summary.tsx
11. Modules

Cada domínio possuirá seu próprio módulo.

Exemplo:

modules/customers/

Estrutura:

modules/customers/
├── components/
├── schemas/
├── services/
├── repositories/
├── types/
├── hooks/
└── index.ts
12. Customer Module
modules/customers/
├── components/
│   ├── customer-form.tsx
│   ├── customer-table.tsx
│   ├── customer-filters.tsx
│   └── customer-map.tsx
│
├── schemas/
│   └── customer.schema.ts
│
├── services/
│   ├── create-customer.service.ts
│   ├── update-customer.service.ts
│   └── delete-customer.service.ts
│
├── repositories/
│   └── customer.repository.ts
│
├── types/
│   └── customer.types.ts
│
└── index.ts
13. Route Module

Este será o maior módulo.

modules/routes/
├── components/
│   ├── route-form.tsx
│   ├── route-map.tsx
│   ├── route-stop-list.tsx
│   ├── route-summary.tsx
│   ├── route-status-badge.tsx
│   ├── route-filters.tsx
│   └── route-actions.tsx
│
├── schemas/
│   ├── create-route.schema.ts
│   ├── optimize-route.schema.ts
│   └── reorder-stops.schema.ts
│
├── services/
│   ├── create-route.service.ts
│   ├── optimize-route.service.ts
│   ├── reorder-route-stops.service.ts
│   ├── recalculate-route.service.ts
│   └── cancel-route.service.ts
│
├── repositories/
│   └── route.repository.ts
│
├── types/
│   └── route.types.ts
│
└── index.ts
14. Routing Module

Routing não deverá ficar misturado ao módulo de Routes.

modules/routing/

Estrutura:

modules/routing/
├── domain/
│   ├── routing-provider.ts
│   ├── geocoding-provider.ts
│   └── distance-matrix-provider.ts
│
├── providers/
│   └── openrouteservice/
│       ├── openrouteservice.client.ts
│       ├── openrouteservice.routing.ts
│       ├── openrouteservice.geocoding.ts
│       └── openrouteservice.optimization.ts
│
├── services/
│   ├── geocode-address.service.ts
│   ├── calculate-route.service.ts
│   └── optimize-route.service.ts
│
├── types/
│   └── routing.types.ts
│
└── index.ts
15. Regra do Routing Module

Nenhum componente React poderá importar:

openrouteservice

diretamente.

Somente:

modules/routing

poderá conhecer o provider.

16. API

Estrutura:

app/api/v1/
├── health/
│   └── route.ts
│
├── auth/
│   └── me/
│       └── route.ts
│
├── tenant/
│   └── route.ts
│
├── users/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
│
├── customers/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
│
├── drivers/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
│
├── vehicles/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
│
├── routes/
│   ├── route.ts
│   ├── optimize/
│   │   └── route.ts
│   └── [id]/
│       ├── route.ts
│       └── stops/
│           ├── route.ts
│           └── reorder/
│               └── route.ts
│
├── imports/
│   ├── customers/
│   │   └── route.ts
│   └── [id]/
│       ├── route.ts
│       └── errors/
│           └── route.ts
│
├── dashboard/
│   └── route.ts
│
└── audit/
    └── route.ts
17. API Route Handler

Cada Route Handler deverá seguir:

Request
 ↓
Authentication
 ↓
Tenant Context
 ↓
Permission
 ↓
Validation
 ↓
Service
 ↓
Response

Nunca colocar lógica de negócio complexa dentro do route.ts.

18. Exemplo
export async function POST(request: Request) {
  const context = await requireAuth();

  requirePermission(context, "routes.optimize");

  const body = await request.json();

  const input = optimizeRouteSchema.parse(body);

  const result = await optimizeRouteService.execute({
    ...input,
    tenantId: context.tenantId,
    userId: context.userId,
  });

  return apiResponse(result);
}

O handler deve permanecer pequeno.

19. Services

Services representam casos de uso.

Exemplo:

OptimizeRouteService

Responsabilidades:

validar domínio;
buscar dados;
chamar provider;
persistir;
gerar auditoria.

Não deverá conhecer:

Request
Response
React
20. Repository

Repository é responsável pelo acesso ao banco.

Exemplo:

customerRepository.findById({
  tenantId,
  id
});

Nunca:

customerRepository.findById(id);
21. Prisma Client

Criar singleton:

lib/db/prisma.ts

Evitar criar múltiplas instâncias do Prisma durante desenvolvimento.

22. Zod

Todos os inputs externos deverão ser validados com Zod.

Exemplo:

const optimizeRouteSchema = z.object({
  scheduledDate: z.string(),
  driverId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  customerIds: z.array(z.string().uuid()).min(1),
});
23. Regra de Validação

Validar:

Frontend
+
Backend

Mas a validação do backend é a autoridade.

24. React Hook Form

Formulários complexos deverão utilizar:

React Hook Form
+
Zod

Exemplo:

CustomerForm
DriverForm
VehicleForm
RouteForm
25. TanStack Query

Utilizar TanStack Query para dados dinâmicos do frontend.

Exemplos:

customers
drivers
vehicles
routes
dashboard

Benefícios:

cache;
loading;
retry;
invalidação;
mutations;
sincronização.
26. Server Components

Utilizar Server Components por padrão.

Usar Client Components somente quando necessário.

Exemplos que serão Client Components:

Mapa
Drag & Drop
Formulários interativos
Dropdowns
Dialogs
Filtros interativos
27. Mapas

Mapas deverão ser carregados no client.

Exemplo:

modules/routes/components/route-map.tsx

O componente deverá utilizar:

dynamic()

quando necessário para evitar problemas de SSR.

28. Leaflet

Não importar Leaflet indiscriminadamente em Server Components.

Map components:

"use client"
29. Estado da Tela de Planejamento

A tela /routes/new terá estado:

type RoutePlanningState = {
  scheduledDate: string;

  driverId: string | null;

  vehicleId: string | null;

  selectedCustomerIds: string[];

  optimizedStops: RouteStop[];

  isOptimizing: boolean;

  optimizationError: string | null;

  hasUnsavedChanges: boolean;
};
30. Estado do Mapa

O mapa não deverá ser a fonte de verdade.

A fonte de verdade será:

RoutePlanningState

O mapa apenas representa o estado.

31. Estado da Lista

A lista também representa:

RoutePlanningState

Assim:

Lista
 ↕
State
 ↕
Mapa
32. Drag and Drop

Utilizar:

@dnd-kit/core
@dnd-kit/sortable

Após alteração:

onDragEnd
 ↓
newSequence
 ↓
state
 ↓
map update

O backend somente será chamado quando a alteração precisar ser persistida.

33. API Client

Criar:

lib/http/api-client.ts

Responsável por:

base URL;
headers;
autenticação;
parse de erros;
JSON;
tratamento de status.
34. Não Fazer Fetch Espalhado

Evitar:

fetch("/api/v1/customers")

espalhado pelos componentes.

Preferir:

customersApi.list()

ou hooks:

useCustomers()
35. API Client Structure
lib/http/
├── api-client.ts
├── api-error.ts
└── endpoints/
    ├── customers.api.ts
    ├── routes.api.ts
    ├── drivers.api.ts
    ├── vehicles.api.ts
    └── users.api.ts
36. Auth

Estrutura:

lib/auth/
├── auth.config.ts
├── auth-guards.ts
├── permissions.ts
└── session.ts

Arquivo principal:

auth.ts
37. Middleware

middleware.ts deverá ser utilizado para:

proteger rotas de aplicação;
redirecionar usuário não autenticado;
verificações leves.

Não colocar queries Prisma pesadas no middleware.

38. Autorização

Criar:

lib/permissions/

Exemplo:

hasPermission(user, "routes.optimize")

Permissões:

dashboard.read

customers.read
customers.create
customers.update
customers.delete

drivers.read
drivers.create
drivers.update
drivers.delete

vehicles.read
vehicles.create
vehicles.update
vehicles.delete

routes.read
routes.create
routes.optimize
routes.update
routes.cancel
routes.execute

users.read
users.create
users.update
users.delete

audit.read

tenant.update
39. RBAC

Mapeamento:

ADMIN
  → *

MANAGER
  → maioria das operações

DISPATCHER
  → operação de rotas

DRIVER
  → próprias rotas

VIEWER
  → somente leitura

O permission system será a implementação efetiva.

40. Tratamento de Erros

Criar:

lib/errors/
├── app-error.ts
├── error-codes.ts
└── error-handler.ts

Classes:

AppError
ValidationError
NotFoundError
ForbiddenError
ConflictError
ExternalServiceError
41. API Error Handler

Todos os erros deverão ser convertidos para o padrão definido no Documento 11.

Nunca retornar:

stack trace
database error
API key
provider internals

para o usuário.

42. Logging

Criar:

lib/logging/

Mesmo que inicialmente seja simples.

Logs deverão possuir:

timestamp
level
requestId
tenantId
userId
message
43. Request ID

Toda requisição API deverá possuir um identificador.

Exemplo:

X-Request-Id

Se o cliente não enviar:

backend gera UUID

Esse ID deverá aparecer nos logs.

44. Observabilidade

MVP:

structured logging

Futuro:

Sentry
OpenTelemetry

Não adicionar complexidade antes da necessidade.

45. Configuração

Criar:

config/
├── app.ts
├── auth.ts
├── database.ts
├── routing.ts
└── plans.ts
46. Environment Variables

Exemplo:

DATABASE_URL=

AUTH_SECRET=

ORS_API_KEY=
ORS_BASE_URL=

ROUTING_PROVIDER=openrouteservice

NEXT_PUBLIC_APP_URL=

ROUTING_TIMEOUT_MS=15000

Secrets nunca deverão possuir prefixo:

NEXT_PUBLIC_
47. .env.example

Obrigatório:

.env.example

Nunca commitar:

.env
.env.local
48. Vercel

A aplicação deverá ser compatível com deployment:

Git
 ↓
GitHub
 ↓
Vercel
 ↓
Build
 ↓
Next.js
49. Banco na Vercel

O banco não deverá depender do filesystem da Vercel.

Utilizar PostgreSQL externo.

O projeto deverá suportar providers PostgreSQL compatíveis com serverless.

50. Arquivos Temporários

Não depender de:

/tmp
filesystem local

para persistência.

Uploads deverão utilizar storage apropriado quando necessário.

51. Importação de Excel

No MVP:

Upload
 ↓
API
 ↓
Processamento
 ↓
Banco

Se o processamento ficar pesado:

API
 ↓
Job
 ↓
Worker/Queue

Essa evolução deverá ser possível sem alterar a interface.

52. Jobs

Criar abstração futura:

modules/jobs/

Inicialmente os imports poderão ser processados de forma síncrona para arquivos pequenos.

53. Limite de Upload

Inicial:

10 MB

Formatos:

CSV
XLSX
54. Testes

Utilizar:

Vitest

e:

Playwright
55. Testes Unitários

Testar:

services;
schemas;
permissions;
domain;
routing adapters.
56. Testes de Integração

Testar:

API
+
Prisma
+
PostgreSQL

Principalmente:

isolamento tenant;
CRUD;
rotas;
otimização;
permissões.
57. E2E

Fluxo principal:

Login
 ↓
Dashboard
 ↓
Clientes
 ↓
Criar cliente
 ↓
Planejar rota
 ↓
Selecionar clientes
 ↓
Otimizar
 ↓
Reordenar
 ↓
Salvar
 ↓
Visualizar rota

Esse fluxo deverá possuir pelo menos um teste E2E.

58. Lint

Utilizar:

ESLint

Nenhum PR deverá ser aceito com:

lint errors
59. TypeScript

Utilizar modo strict:

{
  "compilerOptions": {
    "strict": true
  }
}

Não utilizar:

any

sem justificativa.

60. Imports

Preferir aliases:

@/components
@/modules
@/lib
@/config
@/types

Exemplo:

import { Button } from "@/components/ui/button";
61. Barrel Exports

Cada módulo poderá possuir:

index.ts

Mas evitar barrels gigantes que causem dependências circulares.

62. Dependências

Dependências deverão ser adicionadas somente quando houver necessidade.

Evitar instalar bibliotecas para funcionalidades simples.

63. Regra de Arquitetura

Dependência permitida:

UI
 ↓
Application
 ↓
Domain

Infraestrutura:

Infrastructure
 ↓
Domain interfaces

O domínio não depende de infraestrutura.

64. Estrutura Final
app
 │
 ├── UI
 │
 └── API
      │
      ▼
modules
 │
 ├── application
 ├── domain
 └── infrastructure
      │
      ├── Prisma
      └── Providers
65. Regra Contra "God Service"

Não criar:

route.service.ts

com milhares de linhas.

Separar:

create-route.service.ts
optimize-route.service.ts
reorder-route-stops.service.ts
cancel-route.service.ts
finish-route.service.ts
66. Regra Contra "God Component"

Não criar:

RoutePage.tsx

com toda a aplicação.

Dividir:

RoutePlanningPage
├── RouteConfiguration
├── CustomerSelector
├── RouteMap
├── RouteStopList
├── RouteSummary
└── RouteActions
67. Feature Flags

Criar estrutura para futuras flags:

config/features.ts

Exemplo:

export const features = {
  billing: false,
  multipleVehicles: false,
  deliveryWindows: false,
  liveTracking: false,
};
68. Dark Mode

Implementar:

system
light
dark

utilizando o mecanismo definido pelo Design System.

69. Internacionalização

MVP:

pt-BR

Porém textos de interface não deverão ficar espalhados de maneira impossível de traduzir.

Preparar estrutura:

lib/i18n/

Futuro:

en
es
70. Formatação

Valores:

pt-BR

Exemplo:

R$ 1.250,00

Distância:

48,5 km

Data:

15/08/2026
71. Responsividade

Breakpoints padrão Tailwind.

Desktop:

≥ 1024px

Tablet:

768px–1023px

Mobile:

< 768px
72. Performance

Prioridades:

Server Components;
code splitting;
dynamic import do mapa;
cache TanStack Query;
paginação;
evitar renders desnecessários.
73. SEO

Área pública:

/

deverá possuir SEO básico.

Área autenticada:

/dashboard

não necessita indexação.

74. PWA

Não implementar PWA completo no primeiro MVP.

A arquitetura deverá permitir adicionar posteriormente:

Service Worker
Push Notifications
Offline
75. Regras para OpenCode

O OpenCode deverá:

respeitar esta estrutura;
não criar arquitetura paralela;
não mover arquivos arbitrariamente;
não instalar dependências sem necessidade;
não alterar o banco manualmente;
criar migrations;
criar testes;
atualizar OpenAPI;
manter TypeScript strict;
respeitar isolamento multi-tenant.
76. Ordem de Implementação

O OpenCode deverá desenvolver nesta ordem:

01. Inicialização Next.js

02. Tailwind + shadcn/ui

03. PostgreSQL

04. Prisma

05. Schema

06. Migrations

07. Seed

08. Auth

09. Tenant Context

10. RBAC

11. Customers

12. Drivers

13. Vehicles

14. Routing Provider

15. Geocoding

16. Map

17. Routes

18. Optimization

19. Drag & Drop

20. Dashboard

21. Imports

22. Audit

23. Tests

24. E2E

25. Production hardening
77. Primeiro Milestone

O primeiro milestone funcional será:

Login
 ↓
Tenant
 ↓
Clientes
 ↓
Cadastro
 ↓
Geocodificação
 ↓
Mapa

Não começar pela otimização antes de o cadastro e geocoding estarem funcionando.

78. Segundo Milestone
Motoristas
 ↓
Veículos
 ↓
Planejamento
 ↓
Seleção de clientes
 ↓
Mapa
79. Terceiro Milestone
OpenRouteService
 ↓
Otimização
 ↓
Sequência
 ↓
Geometria
 ↓
Persistência
80. Quarto Milestone
Drag & Drop
 ↓
Reordenação
 ↓
Reotimização
 ↓
Status
 ↓
Execução
81. Quinto Milestone
Dashboard
 ↓
Imports
 ↓
Auditoria
 ↓
Planos
 ↓
Hardening
82. Critério de Pronto

Uma funcionalidade somente será considerada pronta quando possuir:

UI
+
API
+
Validation
+
Service
+
Repository
+
Database
+
Permission
+
Tenant isolation
+
Error handling
+
Tests

Não considerar "funciona no navegador" como concluído.

83. Definition of Done

Antes de marcar uma tarefa como concluída:

[ ] Código implementado
[ ] TypeScript sem erros
[ ] ESLint sem erros
[ ] Zod validation
[ ] RBAC
[ ] Multi-tenant
[ ] Error handling
[ ] Loading state
[ ] Empty state
[ ] Error state
[ ] Testes
[ ] OpenAPI atualizado
[ ] Documentação atualizada
84. Decisão Arquitetural Final

O RouteOS será um monólito modular Next.js, e não microserviços.

Arquitetura:

                 RouteOS
                    │
        ┌───────────┴───────────┐
        │                       │
     Frontend                 API
        │                       │
        └───────────┬───────────┘
                    │
              Application
                    │
                Domain
                    │
        ┌───────────┼───────────┐
        │           │           │
      Prisma    Routing       Auth
        │       Provider
        │           │
   PostgreSQL   OpenRouteService

Essa arquitetura deverá ser suficiente para o MVP e para o crescimento inicial do SaaS sem introduzir complexidade prematura.


### Próximo documento

O próximo será o **Documento 16 — Autenticação, RBAC e Segurança**, detalhando exatamente como o usuário entra no sistema, criação do primeiro tenant, sessão, recuperação de senha, permissões, proteção das APIs e principalmente os mecanismos para impedir **vazamento de dados entre empresas**.
### Próximo documento

O próximo será o **Documento 16 — Autenticação, RBAC e Segurança**, detalhando exatamente como o usuár
