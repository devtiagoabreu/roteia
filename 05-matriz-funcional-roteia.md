# Matriz Funcional do ROTEIA (benchmark Spoke → produto)

> Versão: 1.0 · Base: `04-novo-roteia.md` · Decisão: o ROTEIA **aprende com o Spoke**, não o copia.
> Esta matriz é a referência tela por tela, componente a componente, ação por ação e regra por regra
> para a IA de desenvolvimento. Antes de codar qualquer tela do módulo Rota, consultar esta matriz.

---

## 0. Como ler esta matriz

Cada área lista: **Telas** (com blocos/componentes), **Ações**, **Regras de negócio** e **Decisão ROTEIA**.

Prioridades:

- **P0 — MVP da Rota** (milestone 1 do `01`): cadastro de clientes/endereços + rota única editável.
- **P1 — Route Builder completo**: otimização + edição manual + impacto + janelas + origem/destino.
- **P2 — Execução**: experiência do motorista (navegação, entregas, POD, status/ETA).
- **P3 — Dispatch/tracking**: multi-motorista, mapa de frota, acompanhamento ao vivo.
- **Futuro**: refinamento por grupos, package finder, OCR/importação avançada, API.

Regras transversais herdadas do 04 (aplicam a **toda** tela):

1. A rota é editável.
2. O algoritmo nunca impede uma decisão humana legítima.
3. Toda alteração manual tem impacto calculável.
4. O mapa é uma visualização da rota, não a fonte de verdade.
5. Uma parada possui contexto operacional (não é só endereço/lat-lng).
6. ETA é dinâmico.
7. Rotas podem ser reotimizadas parcialmente.
8. Providers de mapas/roteamento são substituíveis.
9. Clientes e endereços recorrentes são reutilizáveis.
10. O sistema explica decisões importantes da otimização.

Entidade central: **ROTA (origem → paradas → destino)**; a **PARADA (STOP)** é o objeto rico.
Cliente e endereço vivem **antes** da parada (cadastro permanente): `CLIENTE → ENDEREÇO → PARADA → ROTA`.

---

## A. CADASTROS

### A1. Clientes

- **Blocos/componentes**: tabela pesquisável (nome, CEP, cidade, bairro, doc, telefone/WhatsApp);
  formulário em drawer; botão «novo cliente»; botões editar/excluir/arquivar; ação «criar rota com este cliente».
- **Ações**: criar, editar, excluir (soft), arquivar, buscar/filtrar, importar (lote), ver histórico de paradas.
- **Regras**: endereço pertence ao cliente (1:N) e é reutilizável entre paradas; dados BR nativos
  (CEP, CNPJ/CPF, UF, cidade, bairro, WhatsApp); cliente pode ter múltiplos endereços
  (matriz, filial, "melhor endereço"); exclusão de cliente não apaga rotas históricas.
- **Decisão ROTEIA**: **P0**. Reutilizar o conceito de `SavedPlace` do módulo Dia, elevado a
  `Cliente + Endereço` (doc 01/14).

### A2. Endereços (cadastro permanente)

- **Ações**: criar a partir da parada (sugestão salvar), selecionar dos favoritos, editar/apagar, geocodificar.
- **Regras**: nunca aceitar endereço sem geocodificação validada e confirmável:
  `address_raw → validação → geocodificação → confirmação → lat/lng`.
  Persistir `address_raw, address_normalized, latitude, longitude, provider, confidence, geocoded_at`.
- **Decisão ROTEIA**: **P0**. É o coração do diferencial "clientes recorrentes".

### A3. Motoristas (usuários)

- **Blocos**: convite por e-mail (login Google e/ou e-mail+senha); perfil (nome, telefone, foto, idioma).
- **Regras**: papel `motorista` é restrito à execução (não vê cadastros financeiros);
  `admin/operador` planeja; permissões por papel (RBAC por tenant).
- **Decisão ROTEIA**: **P1** para convite; **P3** para divisão de papéis avançada.

### A4. Veículos

- **Blocos**: placa, capacidade (peso/volume), dimensões, tipo (carro/van/caminhão), perfil de roteamento.
- **Regras**: capacidade entra no solver (CVRP); restrições de dimensão passam ao routing engine quando houver.
- **Decisão ROTEIA**: **P1** (capacidade básica) / **P3** (dimension-aware).

### A5. Usuários, times e tenant (multitenancy)

- **Regras**: Shared DB + Shared Schema + `tenantId` (doc 01/14); cross-tenant = 404; UTC + fuso do tenant.
- **Decisão ROTEIA**: **P0** — já implementado no login/tenant atual.

---

## B. DASHBOARD / INÍCIO

### B1. Home operador (módulo Rota)

- **Blocos**: resumo do dia (rotas de hoje, paradas a executar, entregues/falhas), próxima rota,
  lista de rotas por estado; links rápidos (nova rota, importar, clientes).
- **Ações**: abrir rota de hoje, criar rota, duplicar rota, arquivar rota.
- **Regras**: separar claramente **hoje / futuras / concluídas / arquivadas**; nada de "limbo".
- **Decisão ROTEIA**: **P1**. Diferenciais: histórico inteligente + rotas favoritas/templates.

---

## C. ROUTE BUILDER (planejamento)

### C1. Criar rota (configuração)

- **Blocos**: data; origem (depósito / endereço fixo / localização atual); destino (depósito / nenhum);
  horário de início; intervalo/break (ex.: 12:00–12:30); motorista/veículo (P1+).
- **Regras**: origem/destino podem ter comportamentos diferentes (31 do `04`); break entra no cálculo.
- **Decisão ROTEIA**: **P0** (origem/destino/início) · **P1** (break, veículo, janelas).

### C2. Adicionar paradas

- **Vias de entrada**: digitar endereço (autocomplete + geocode), escolher de cliente/endereço salvo,
  clicar no mapa, importar em lote. Voz/OCR: **futuro** (nunca aceitar OCR sem confirmação humana).
- **Blocos**: campo endereço com sugestões (`AddressInput` reutilizável), lista escolhas de clientes,
  mapa clicável, botão «+ parada»; quick-add de cliente novo no popover.
- **Regras**: a parada sugere salvar o endereço como favorito/cliente; dedupe de endereço normalizado.
- **Decisão ROTEIA**: **P0**. Reutilizar `lib/maps/geocode`, `components/address-input`,
  `components/maps/coordinate-picker`.

### C3. Drawer de edição de parada

- **Blocos/campos**: cliente, endereço (link p/ cliente), lat/lng com marcador ajustável,
  tipo (entrega/coleta/serviço), **prioridade (First / Auto / Last)**, **janela de entrega**,
  **tempo de serviço**, observações, instruções, **código de acesso/portão**, qtd de pacotes, peso, volume.
- **Regras**: prioridade First/Last vira restrição do solver; janela + tempo de serviço entram no cálculo
  (distância + viagem + serviço + janela + prioridade + origem + destino); edição reflete o self em todos
  os painéis (lista, mapa, timeline) sem conflito.
- **Decisão ROTEIA**: **P0** (básico: cliente/endereço/observação) · **P1** (janela, serviço, First/Last/Auto,
  pacotes) · **P2** (código de acesso/instruções no app do motorista).

### C4. Lista de paradas (fonte de verdade operacional)

- **Blocos**: lista ordenada; número da parada; nome/endereço; janela/ETA; prioridade; chip de status;
  handle de arrastar; menu de contexto (mover para o topo / para o fim, remover, editar, duplicar).
- **Ações**: **drag & drop granular** (arrastar a 27ª direto para a 4ª, recalculando de uma vez),
  mover para first/last, remover, duplicar, "otimizar".
- **Regras (04/13,14,36,37)**: após qualquer reordenação manual → **recalcular segmentos, distância,
  duração, ETA; verificar violações; informar impacto** (painel "impacto" com antes/depois);
  nunca reotimizar tudo sem permissão (não destruir decisão humana).
- **Decisão ROTEIA**: **P0**. Este é o **diferencial #1** (edição manual superior ao Spoke).
  Implementar com dnd-kit (doc 01/15).

### C5. Mapa da rota

- **Blocos**: Leaflet com marcadores numerados, polylines por segmento, origem/destino distintos,
  parada selecionada destacada; legenda; botões centrar/fit.
- **Regras**: mapa é **visualização**; clicar no marcador seleciona a parada na lista (e vice-versa);
  estado único (`RoutePlanningState`, doc 01/15) sincroniza lista↔mapa↔timeline.
- **Decisão ROTEIA**: **P0**.

### C6. Otimizar

- **Blocos/ações**: botão «Otimizar», selector de critério (mais curto / mais rápido / respeitar janelas),
  painel de resultado, **explicação da solução**.
- **Regras**: o algoritmo **sugere**, o operador **aceita/edita**; sistema **explica** as decisões não
  óbvias (ex.: "B depois de C porque B tem janela 10:00–11:00"); agrupamento geográfico
  (evitar A→B→X→Y→C→D quando A→B→C→D→X→Y é natural); conservar First/Last; resultado é uma proposta
  editável, não dogma.
- **Decisão ROTEIA**: **P1** (VROOM via `OptimizeProvider`; P0 usa motor próprio simples).

### C7. Refinamento por grupos/áreas (Refine)

- **Blocos**: rota agrupada por padrão (região/bairro); chiplets de grupo com prioridade
  (alta/normal/final/retirar); reordenar grupos arrastando o cabeçalho.
- **Regras**: reorganizar grupos não destrói o planejamento interno de cada grupo;
  adicionar/remover áreas de grupos sem reotimizar o todo.
- **Decisão ROTEIA**: **Futuro** — diferencial estratégico (04/15).

### C8. Reotimização parcial e edição durante a execução

- **Ações**: pular parada (ex.: cliente fechado), inserir nova parada (auto / depois de X / no fim),
  reotimizar **apenas o restante** da rota; preservar ordem do que já passou.
- **Regras**: estados da parada `planned | in_transit | completed | skipped | failed | rescheduled`;
  ETA dinâmico: ao concluir parada, recalcular as seguintes.
- **Decisão ROTEIA**: **P2** (execução) ; lógica de resolver parcial já prevista no `lib/day/optimize`.

---

## D. EXECUÇÃO (app/experiência do motorista)

### D1. Rota do dia / minha rota

- **Blocos**: próxima parada em destaque; progresso k/N; resumo do dia; botão navegar.
- **Regras**: ordenar por sequência da rota; mostrar "você está aqui" (GPS).
- **Decisão ROTEIA**: **P2**.

### D2. Navegação

- **Decisão**: separar Planejamento (qual parada primeiro) · Routing (qual caminho) · Navegação
  (vire à direita em 200m). Providers abstratos (`NavigationProvider`).
- **Decisão ROTEIA**: **P2** via OSRM turn-by-turn (Leaflet Routing Machine) ou Google (opcional).

### D3. Executar parada / Prova de entrega (POD)

- **Blocos**: tela da parada (endereço, instruções, código de acesso, pacotes, contato); botões
  **Entregue / Falhou**; modal de confirmação.
- **Estados**: `delivered | failed | skipped | rescheduled`; POD futuro: foto, assinatura,
  nome do recebedor, observação, GPS, timestamp.
- **Regras (04/24)**: entregas documentadas; falha exige motivo; reotimizar o restante após cada parada.
- **Decisão ROTEIA**: **P2** básico (`Entregue/Falhou`) · **P3** (foto/assinatura).

### D4. Inserir parada em execução

- **Ações**: adicionar parada nova ao vivo: `inserir automaticamente | depois de B | no final`;
  reotimização só do que falta (04/22; Geoapify `assignJobs()/reoptimizeAgentPlan`).
- **Decisão ROTEIA**: **P2**.

### D5. Package Finder (opcional)

- **Regras**: registrar local do pacote no veículo (posição × pacote × parada) para buscar no carregamento.
- **Decisão ROTEIA**: **Futuro** (diferencial forte, mas não essencial ao MVP).

---

## E. IMPORTACAO (primeira classe)

### E1. Importar paradas em lote

- **Formatos**: Excel (.xlsx), CSV, Google Sheets, template oficial; mapeamento de colunas;
  relatório de erros (linha → motivo); prévia antes de gravar.
- **Regras**: geocodificar em lote com rate limit e cache; erros de endereço **não** silenciados;
  nunca aceitar linha sem geocode confirmado — ir para fila de revisão.
- **Decisão ROTEIA**: **P1** (CSV) · **P2+** (Excel/Sheets com provedor de importação).

---

## F. DISPATCH / TRACKING (futuro multi-veículo)

### F1. Planejamento multi-motorista

- **Blocos**: paradas não atribuídas; distribuição entre motoristas (drag para a coluna do motorista);
  otimização multi-veículo; publicação/despacho.
- **Regras**: solver com N veículos e capacidades (VROOM/OR-Tools); publicar = soltar para o app do motorista.
- **Decisão ROTEIA**: **P3** (módulo dispatch do 04/4).

### F2. Acompanhamento ao vivo

- **Blocos**: mapa de frota (marcadores de motorista), ETA atualizado, alertas de desvio/atraso,
  timeline por motorista.
- **Regras**: ETAs atualizados conforme conclusão das paradas; estimativas de chegada recalculadas.
- **Decisão ROTEIA**: **P3**.

---

## G. PLANOS E LIMITES

### G1. Planos (anti-reclamação 04/41)

- **Regras**: deixar claro na escolha do plano: limite de paradas, limites de motoristas/rotas,
  importação, otimização, tracking, API, histórico. **Nenhum bloqueio inesperado de essencial**.
- **Decisão ROTEIA**: **P3**; definir matriz plano × recurso antes de qualquer cobrança.

---

## H. MATRIZ DE DECISÃO POR PRIORIDADE

| # | Diferencial (04/42) | Onde entra | Prioridade |
|---|---------------------|------------|-----------|
| 1 | Edição manual superior (drag & drop + impacto) | C4/C5 | **P0** |
| 2 | Explicação da otimização | C6 | P1 |
| 3 | Reotimização parcial (só o restante) | C8/D4 | P1 |
| 4 | Preservar ordem (não destruir decisão humana) | C4/C6/C8 | **P0** |
| 5 | Rotas favoritas/templates (duplicar) | B1/C1 | P1 |
| 6 | Clientes recorrentes (cadastro permanente) | A1/A2 | **P0** |
| 7 | Histórico inteligente (hoje/futuro/concluído/arquivado) | B1 | P1 |
| 8 | Importação robusta (CSV/Excel/Sheets/API) | E1 | P1 |
| 9 | Dados brasileiros (CEP/CNPJ/UF/cidade/bairro/WhatsApp) | A1/transversal | **P0** |
| 10 | Multitenancy (empresa→usuários→motoristas→veículos→clientes→rotas) | A5/transversal | **P0** |
| — | Package Finder | D5 | Futuro |
| — | Refine por grupos/áreas | C7 | Futuro |

> Próximo passo de documentação: para cada tela P0, detalhar wireframe ASCII + estados + props dos
> componentes reutilizados do módulo Dia (AddressInput, CoordinatePicker, ui.Button, Leaflet dinâmico).