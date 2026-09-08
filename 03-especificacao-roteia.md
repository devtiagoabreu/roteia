# Roteia — Especificação Consolidada

> **Versão:** 1.0 · **Status:** vigente
> **Origem:** fusão de `01-estudo-caso-roteia-001.md` (engenharia/arquitetura) e
> `02-estudo-caso-roteia-002.md` (produto/Livro de Decisões). Os dois docs
> originais permanecem como histórico de conversa.
> **Documento normativo:** decisões de produto e arquitetura vivem aqui a partir
> de agora; mudanças registram entrada no Livro de Decisões (seção 3) ou ADR
> (seção 9).

---

## 1. Visão, público e marca

### 1.1 O que é

O **Roteia** é um planejador pessoal de dia que transforma uma lista de tarefas
e compromissos em uma **sequência executável** — com horários planejados, ordem
otimizada, mapa e execução parada a parada.

A "rota" aqui não é um GPS (o GPS fica no celular de quem dirige): o Roteia
decide **o que** fazer em **que ordem** e **a que horas**, considerando
prioridades, horários fixos/janelas, duração e deslocamento — e então navega o
dia inteiro com o usuário.

### 1.2 Público-alvo

- Técnicos/prestadores de serviço que atendem em vários locais no dia.
- Representantes e vendedores que visitam clientes.
- Entregadores e motoristas de curta distância.
- Pessoas com dia cheio de compromissos e família (uso pessoal).

Um tenant Roteia = **uma pessoa**. Multi-tenant existe para permitir, no
futuro, time/família sem misturar dados entre contas — não para VRP de frotas.

### 1.3 Marca

- **Nome:** Roteia (RT-projetos). Opções alternativas foram descartadas
  (ex.: RouteOS, "Rota Certa").
- Tom: ajuda sem burocracia; "seu dia, organizado".
- Idioma padrão do produto: **pt-BR**. Datas/horas exibidas no fuso do tenant.

### 1.4 Posicionamento e não-escopo

| É | Não é |
|---|---|
| Otimizar a ordem do dia | GPS / navegação em tempo real |
| Respeitar prioridades e horários | App de roteirização de frotas |
| Execução guiada por paradas | Sistemão com motoristas/clientes/veículos |
| Simples, mobile-first | Rota em tempo real (roadmap) |

> **Regra de ouro:** 🔴 **não aumentar o escopo sem passar por este documento.**
> Ideia nova ➝ backlog. Fluxo: MVP ➝ teste real ➝ aprendizado ➝ V2.

---

## 2. Livro de Decisões consolidado

Base: decisões registradas em `002` (nomenclatura, catálogo de decisões,
checklist). Status reflete o que está implementado em `03`.

### 2.1 Fundacionais

| # | Decisão | Status |
|---|---|---|
| D01 | Nome **Roteia** (RT-projetos) | ✅ |
| D02 | Escopo **pessoal** (não frota) | ✅ |
| D03 | Margem de segurança: 10 min padrão, aplicada entre paradas | ✅ |
| D04 | Prioridades em 4 níveis 🔴🟠🟢⚪ (essencial/alta/normal/baixa) | ✅ |
| D05 | Motor nunca remove paradas "silenciosamente" | ✅ |
| D06 | Conflitos de horário visíveis por parada | ✅ |
| D07 | Navegação abre Google Maps/Waze; Roteia mantém a rota como referência | ✅ |
| D08 | Não viramos GPS; rota em tempo real fica no roadmap | ✅ |
| D09 | Offline V1: só visualizar rota/paradas; otimização offline fora do MVP | ☐ |
| D10 | Modo de transporte V1: carro; expansão depois | ✅ (assume carro) |
| D11 | Câmera/OCR de lista: incluir na família de prioridade alta; requer direção técnica (web OCR) antes de implementar | ☐ |
| D12 | Compartilhamento e "rota em tempo real" vão para o roadmap | ☐ |
| D13 | Busca/autocomplete de endereço = prioridade para a UX de endereço | 🟡 (geocode ao salvar; sem dropdown) |
| D14 | Meus Locais: salvar lugar usado em paradas e reutilizar no formulário | ✅ |

### 2.2 Motor de otimização (regras de produto)

| Regra | Como o motor trata |
|---|---|
| Essenciais e horários fixos **nunca** saem do lugar | Âncoras: FIXO por horário </br> depois JANELA, depois PENDENTE/flexíveis por prioridade |
| Prioridade desempata flexíveis | ESSENCIAL > ALTA > NORMAL > BAIXA |
| Margem de segurança entre paradas | 10 min (campo por dia/atividade) |
| Atividade sem local não quebra a rota | Entra na sequência, sem deslocamento |
| Conflito não é erro | Fixo que colide com anterior gera aviso ⚠ na parada |
| Impossibilidade de cumprir tudo é sinalizada | Aviso por parada e na reotimização |

### 2.3 Outras decisões de produto registradas

- **Criar planejamento sem cadastro:** decidido em `002`; na implementação
  optamos por exigir conta para preservar isolamento multi-tenant (ADR-003).
- **Considerar destino final do dia:** adiado (endAddress não modelado).
- **Preferências de rota (evitar pedágio, etc.):** backlog.
- **Duplicar dia e histórico pesquisável:** backlog.
- **Reorganizar restante / "estou atrasado" / replanejar pendências:** backlog
  (execução atual: concluir/pular/reabrir por parada).

---

## 3. Escopo do MVP e critério de pronto

Para declarar o MVP pronto, **uma pessoa** deve conseguir:

> Entrar → criar um dia → adicionar vários locais → validar endereços →
> definir horários e prioridades → mandar organizar → receber a sequência
> otimizada → ver no mapa → navegar → executar as paradas → concluir o dia.

Se isso funcionar bem, temos um produto para testar.

---

## 4. Checklist de desenvolvimento (Blocos 1–20)

> Legenda: ✅ feito · 🟡 parcial · ☐ não iniciado

### 🔴 BLOCO 1 — FUNDAÇÃO

| # | Tarefa | Status |
|---|---|---|
| 01 | Estruturar projeto (Next.js + TS) | ✅ |
| 02 | Padrão visual base (Tailwind, dark/light) | ✅ |
| 03 | Banco de dados (Postgres Neon) | ✅ |
| 04 | Variáveis de ambiente documentadas | ✅ |
| 05 | Git + padrão de commits | ✅ |
| 06 | Lint/build configurados | ✅ |
| 07 | Readme do projeto | ✅ |
| 08 | Deploy inicial | 🟡 (Vercel pendente — usuário adiciona o repo) |

### 🔴 BLOCO 2 — CONTA E USUÁRIO

| # | Tarefa | Status |
|---|---|---|
| 09 | Criar conta com e-mail/senha | ✅ |
| 10 | Entrar e sair | ✅ |
| 11 | Login com Google | ☐ |
| 12 | Login com Apple | ☐ |
| 13 | Recuperar senha | ☐ |
| 14 | Editar perfil | ☐ |
| 15 | Selecionar perfil de uso | ☐ |
| 16 | Múltiplos perfis | ☐ |
| 17 | Preferência de transporte | ☐ (motor assume carro) |
| 18 | Preferências de rota | ☐ |
| 19 | Margem de segurança | ✅ (padrão 10 min por dia/atividade) |
| 20 | Origem padrão | ✅ (endereço inicial do dia) |
| 21 | Destino padrão | ☐ |

### 🔴 BLOCO 3 — SEM CADASTRO

| # | Tarefa | Status |
|---|---|---|
| 22 | Criar planejamento sem cadastro | ☐ (ADR-003) |
| 23 | Salvar ao criar conta | ☐ |
| 24 | Limitar funcionalidades anônimas | ☐ |
| 25 | Alertar para criar conta | ☐ |
| 26 | Migrar dados do anônimo | ☐ |

### 🔴 BLOCO 4 — ENDEREÇOS

| # | Tarefa | Status |
|---|---|---|
| 27 | Digitar endereço | ✅ |
| 28 | Autocomplete de endereço | ✅ (dropdown ORS/Nominatim no formulário) |
| 29 | Geocodificar endereço | ✅ (Nominatim + ORS) |
| 30 | Confirmar endereço | 🟡 (marcador no mapa) |
| 31 | Exibir no mapa | ✅ |
| 32 | Guardar lat/lng | ✅ |
| 33 | Tratar endereço ambíguo | ✅ (lista de sugestões; usuário escolhe) |
| 34 | Endereço não encontrado | ✅ (aviso no dropdown + geocodifica ao salvar) |
| 35 | Ajustar manualmente no mapa | ☐ |
| 36 | Parada sem endereço | ✅ |
| 37 | Salvar local (Meus Locais) | ✅ |
| 38 | Editar local salvo | ✅ |
| 39 | Excluir local salvo | ✅ |
| 40 | Locais recentes | 🟡 (lista ordenada por último uso) |
| 41 | Favoritos | ✅ |

### 🔴 BLOCO 5 — CÂMERA (FOTOGRAFAR LISTA)

| # | Tarefa | Status |
|---|---|---|
| 42–49 | Fotografar lista, interpretar, conferir, adicionar todos | ☐ (decidido; requer OCR/web) |

### 🔴 BLOCO 6 — CRIAR ATIVIDADES

| # | Tarefa | Status |
|---|---|---|
| 50 | Adicionar atividade | ✅ |
| 51 | Título | ✅ |
| 52 | Endereço | ✅ |
| 53 | Sem endereço | ✅ |
| 54 | Data | ✅ (nominal: atividade vive em dias) |
| 55 | Horário fixo | ✅ |
| 56 | Janela de horário | ✅ |
| 57 | Sem horário (flexível) | ✅ |
| 58 | Duração | ✅ |
| 59 | Prioridade | ✅ |
| 60 | Observações | ✅ |
| 61 | Telefone | ☐ |
| 62 | Status | ✅ (por parada: feito/pulado/andamento) |

### 🔴 BLOCO 7 — ADIÇÃO EM MASSA

| # | Tarefa | Status |
|---|---|---|
| 63–68 | Colar múltiplos endereços, interpretar linhas, criar paradas, foto de lista, conferir, adicionar todos | ☐ |

### 🔴 BLOCO 8 — MEUS DIAS

| # | Tarefa | Status |
|---|---|---|
| 69 | Criar dia | ✅ |
| 70 | Selecionar qualquer data | ✅ |
| 71 | Hoje | ✅ |
| 72 | Amanhã | ✅ |
| 73 | Meus Dias | ✅ (página /days) |
| 74 | Status "Planejado" | ✅ (rascunho) |
| 75 | Status "Organizado" | ✅ (otimizado) |
| 76 | Duplicar dia | ☐ |
| 77 | Histórico | 🟡 (dias passados listados) |
| 78 | Buscar histórico | ☐ |
| 79 | Excluir dia | ✅ |

### 🔴 BLOCO 9 — MOTOR DE OTIMIZAÇÃO

| # | Tarefa | Status |
|---|---|---|
| 80 | Receber atividades | ✅ |
| 81 | Considerar origem | ✅ |
| 82 | Considerar destino | 🟡 (origem sim; destino não modelado) |
| 83 | Considerar horários | ✅ |
| 84 | Considerar duração | ✅ |
| 85 | Considerar prioridades | ✅ |
| 86 | Considerar sem local | ✅ |
| 87 | Considerar deslocamentos | ✅ (haversine + fator de ruas; ORS real com chave) |
| 88 | Considerar margem | ✅ |
| 89 | Considerar preferências de rota | ☐ |
| 90 | Otimizar sequência | ✅ |
| 91 | Detectar conflitos | ✅ |
| 92 | Não remover silenciosamente | ✅ |
| 93 | Mostrar impossibilidade de cumprir tudo | 🟡 (conflito por parada) |

### 🔴 BLOCO 10 — MAPA

| # | Tarefa | Status |
|---|---|---|
| 94 | Integrar serviço de mapas | ✅ (Leaflet + OSM) |
| 95 | Exibir mapa | ✅ |
| 96 | Exibir marcadores | ✅ |
| 97 | Numerar sequência | ✅ |
| 98 | Desenhar rota | ✅ (polyline) |
| 99 | Zoom automático | ✅ (fitBounds) |
| 100 | Selecionar parada | 🟡 |
| 101 | Ver detalhes | 🟡 (popup) |
| 102 | Reordenar pela lista | ✅ (drag & drop) |
| 103 | Atualizar mapa após reordenação | ✅ |
| 104 | Destacar próxima parada | ✅ (chip "Próxima" + marcador) |

### 🔴 BLOCO 11 — NAVEGAÇÃO

| # | Tarefa | Status |
|---|---|---|
| 105 | Botão "Navegar" | ✅ |
| 106 | Abrir Google Maps | ✅ |
| 107 | Abrir Waze quando disponível | ✅ |
| 108 | Manter rota como referência | ✅ |

### 🔴 BLOCO 12 — EXECUÇÃO DO DIA

| # | Tarefa | Status |
|---|---|---|
| 109 | Iniciar execução | ✅ |
| 110 | Mostrar próxima parada | ✅ |
| 111 | Mostrar próximas atividades | ✅ |
| 112 | Horário planejado | ✅ |
| 113 | Horário recomendado de saída | 🟡 (delivered: plannedStart) |
| 114 | "Cheguei" | ✅ |
| 115 | "Concluído" | ✅ |
| 116 | "Pular" | ✅ |
| 117 | Reorganizar restante | ✅ (recalculo dos horários restantes mantendo ordem; reordenação manual disponível) |
| 118 | "Estou atrasado" | ✅ (banner de atraso na próxima parada) |
| 119 | Recalcular restante | ✅ (reagenda restantes a partir da parada atual) |
| 120 | Adicionar parada durante execução | 🟡 (adiciona e reordena) |

### 🔴 BLOCO 13 — FINALIZAÇÃO

| # | Tarefa | Status |
|---|---|---|
| 121 | Registrar horários reais | ✅ (iniciada às / concluída às em cada parada) |
| 122 | Registrar concluídas | ✅ |
| 123 | Registrar puladas | ✅ |
| 124 | Registrar atrasos | ✅ (banner "Você está atrasado" + recalculo) |
| 125 | Resumo do dia | ✅ (card resumo ao concluir) |
| 126 | Dia concluído | ✅ (automático) |
| 127 | Dia incompleto | ✅ (dias passados com pendências mostram replanejamento) |
| 128 | Replanejar pendências | ✅ (copia pendências para hoje) |

### 🔴 BLOCO 14 — COMPARTILHAMENTO

| # | Tarefa | Status |
|---|---|---|
| 129–131 | Compartilhar planejamento/view | ☐ (roadmap; rota em tempo real no roadmap) |

### 🔴 BLOCO 15 — OFFLINE

| # | Tarefa | Status |
|---|---|---|
| 132–136 | Visualizar rota/paradas offline e sincronizar | ☐ |

### 🔴 BLOCO 16 — RESPONSIVIDADE

| # | Tarefa | Status |
|---|---|---|
| 137 | Desktop | ✅ |
| 138 | Tablet | 🟡 (não validado em device real) |
| 139 | Celular | ✅ |
| 140 | Lista + mapa no desktop | ✅ |
| 141 | Lista prioritária no celular | ✅ |

### 🔴 BLOCO 17 — SEGURANÇA

| # | Tarefa | Status |
|---|---|---|
| 142 | Autenticação segura | ✅ (senha bcrypt, sessão httpOnly) |
| 143 | Proteção de dados | ✅ (validação Zod, server actions) |
| 144 | Separação entre usuários | ✅ (tenantId em toda consulta) |
| 145 | Controle de acesso | 🟡 (roles no schema; uso parcial) |
| 146 | Exclusão de conta | ☐ (exclusão física hoje; sem self-service) |
| 147 | Compartilhamento somente autorizado | ☐ (bloco 14) |

### 🔴 BLOCO 18 — TESTES

| # | Teste | Status |
|---|---|---|
| 148–176 | Suite de testes funcional (fluxos do MVP) | ☐ (validação manual + build; sem suíte automatizada) |

### 🔴 BLOCO 19 — TESTE REAL

| # | Teste | Status |
|---|---|---|
| 177–184 | Entregador, representante, técnico, família, coletar erros/dificuldades, cortar não-usados, corrigir críticos | ☐ |

### 🔴 BLOCO 20 — LANÇAMENTO DO MVP

| # | Tarefa | Status |
|---|---|---|
| 185 | Deploy da versão final | 🟡 (Vercel pendente) |
| 186 | Domínio | ☐ |
| 187 | SSL/HTTPS | ✅ (Vercel) |
| 188 | Monitoramento de erros | 🟡 (dash Vercel; sem Sentry) |
| 189 | Analytics básico | ☐ |
| 190 | Página de apresentação | 🟡 (login serve de porta; sem landing) |
| 191 | Acesso para primeiros usuários | 🟡 (cadastro aberto) |
| 192 | Liberar MVP V1 | ☐ |

---

## 5. Arquitetura e stack

### 5.1 Stack

- **Next.js 16** — App Router, Server Components, Server Actions.
- **TypeScript** (strict) + **Tailwind CSS**.
- **Prisma 7** (generator `prisma-client`, ESM) + **PostgreSQL Neon**.
- **react-leaflet + OpenStreetMap** (tiles) — sem chave obrigatória.
- **Nominatim** (fallback) e **OpenRouteService** (opcional, com `ORS_API_KEY`)
  para geocodificação e rota real `driving-car`.
- **zod + react-hook-form** nos formulários; **@dnd-kit** na reordenação.
- Autenticação própria: **bcrypt** (hash) + **jose** (sessão httpOnly).

### 5.2 Estrutura de código

```
app/
  (app)/page.tsx          # Meu Dia (data de hoje; ?date=)
  (app)/days/page.tsx     # Meus Dias
  (auth)/login|register/  # autenticação
  actions/                # server actions (activity, day, auth)
components/
  site-header.tsx, ui.tsx # shell + primitivas (Button/Input/Select/Badge/Card)
  auth/                   # formulários de login/cadastro
  day/                    # day-planner, activity-form, stop-list,
                          #  map-panel, leaflet-map, delete-day-button, types
lib/
  db.ts                   # singleton Prisma
  validations.ts          # schemas Zod + rótulos pt-BR
  date.ts, format.ts      # fusos, ISO, formatação
  auth/                   # session, password, require-user
  day/                    # service (CRUD do dia/paradas) + optimize (motor)
  maps/                   # geocode + route (haversine/ORS)
prisma/schema.prisma
generated/prisma/         # gitignored
```

Princípios: server actions fazem a mutação com escopo por `tenantId`; serviço
de negócio em `lib/`; apresentação em componentes; sem "god service"/"god
component".

### 5.3 Módulos principais

- **Motor (`lib/day/optimize.ts`):** heurística de inserção. Âncoras FIXO (por
  horário) ➝ JANELA (por início da janela) ➝ flexíveis (por prioridade).
  Para cada parada testa todas as posições possíveis e escolhe a de menor
  "fim de rota"; marca conflito de horário fixo/janela em `conflict`.
  Deslocamento = haversine × 1,3 @30 km/h (sem chave) ou rota real ORS.
- **Mapa (`components/day/leaflet-map.tsx`):** marcadores numerados, `Polyline`
  do itinerário, `FitBounds` automático, marcador destacado para a próxima parada.
- **Execução:** `StopStatus` (PENDENTE/EM_ANDAMENTO/FEITO/PULADO); botões
  Cheguei/Concluído/Pular/Reabrir; links Google Maps/Waze por parada.
- **Dia:** `DayStatus` RASCUNHO/OTIMIZADO/EM_ANDAMENTO/CONCLUIDO — concluído
  automaticamente quando todas as paradas estão FEITO/PULADO.

---

## 6. Modelo de dados e multi-tenant

| Entidade | Papel |
|---|---|
| `Tenant` | Conta/domínio; `slug` único, plano, fuso padrão `America/Sao_Paulo` |
| `User` | Membros do tenant (`Role`, ativo, últimos dados) |
| `Session` | Sessão autenticada (tokenHash único, expiração, revogação) |
| `SavedPlace` | Local salvo do tenant (label, categoria, endereço, lat/lng, notas) |
| `Activity` | Candidata do dia (título, endereço, prioridade, horário fixo/janela/flexível, duração, margem, observações) |
| `Day` | Dia do tenant (data única, origem, status, totais, `routeJson`) |
| `DayStop` | Parada executável do dia (ordem, planejado real, deslocamento, status, `conflict`) |
| `AuditLog` | Trilha (CREATE/UPDATE/DELETE/LOGIN/LOGOUT/OPTIMIZE) |

**Isolamento:** toda tabela carrega `tenantId`; o middleware `requireUser()`
resolve o tenant da sessão e nenhuma query escapa do escopo. Timestamps em UTC
(`timestamptz(3)`); exibição por fuso do tenant. Margem padrão 10 min por
dia/atividade. Exclusão hoje é física (cascade) + auditada.

---

## 7. Definição de Pronto (cada entrega)

- Funciona no fluxo real de ponta a ponta (build limpo).
- `npm run build` passa; lint sem erros.
- Respeita isolamento de tenant (nenhum dado cruzando contas).
- Validação de entrada (Zod) e saída saneada.
- Sem segredos no código (env apenas em `.env`/Vercel).
- Documento de estado atualizado (este doc / checklist).
- Commit convencional; deploy verificado quando aplicável.

---

## 8. ADRs — divergências reconciliadas (001 ⇄ 002 ⇄ implementação)

| ADR | Decisão | Razão |
|---|---|---|
| ADR-001 | Nome: RouteOS → **Roteia** | Decisão de produto do `002`; nome único e falável |
| ADR-002 | Escopo: frota → **planejador pessoal** | `002` reduz para pessoa; frota vira roadmap |
| ADR-003 | **Sem modo anônimo** no MVP | Preserva isolamento multi-tenant de forma simples |
| ADR-004 | Auth própria (bcrypt + jose) em vez de Auth.js/Clerk | Zero custo, sem provider externo, sessão httpOnly |
| ADR-005 | Mapas: **OSM + Leaflet + Nominatim/ORS** em vez de Google Maps APIs | Sem chave obrigatória, custo zero, geocode/rota com fallback |
| ADR-006 | **Server Actions + RSC** em vez de Route Handlers + TanStack Query | App Router moderno, menos código cliente, cache automático |
| ADR-007 | Estrutura enxuta `app/` + `lib/` + `components/` (não modules/* profundo) | Proporção do MVP; serviço de negócio central em `lib/` |
| ADR-008 | Estados do dia: RASCUNHO/OTIMIZADO/EM_ANDAMENTO/CONCLUIDO | Mapeia "Planejado/Organizado/Execução" do `002` |
| ADR-009 | Prioridades: 4 níveis com pesos determinísticos no motor | Decisão 30 do `002` |
| ADR-010 | Margem de segurança padrão 10 min (dia e atividade) | Decisão 31 do `002`; configurável por entidade |
| ADR-011 | `SavedPlace` no schema desde o início (Locais salvos) | Modelo pronto p/ fatia Meus Locais |
| ADR-012 | **Login social e recuperação de senha fora do MVP** | Após teste real, se demandado |

---

## 9. Roadmap pós-MVP

- Login Google/Apple, recuperação de senha, múltiplos perfis.
- Câmera/OCR de listas (colar múltiplos endereços também).
- Ajuste manual do marcador no mapa (o autocomplete já está entregue).
- Finalização rica: horários reais, atrasos, resumo, replanejar pendências.
- "Estou atrasado" + recalcular restante durante execução.
- Offline de visualização; compartilhamento (view externa).
- Meus Locais avançado: favoritos, recentes, categorias (depende da fatia 37–41).
- Pré-lançamento: landing, domínio, monitoramento, analytics.

---

## 10. Registro de execução

| Data | Marco |
|---|---|
| — | Fundação, autenticação, criação de dias, atividades, motor, mapa, navegação, execução, responsividade (Blocos 1,6,8–12,16) commitados |
| — | Revisão profunda de 001/002; consolidação em `03` (este doc) |
| — | `03-especificacao-roteia.md` criado; docs 01/02 mantidos como histórico |
| próx. | Fatia **Meus Locais** (tarefas 37–41 + fluxo "salvar de parada" + "usar hoje" + "preencher com local salvo") — ✅ entregue |
| próx. | Fatia **Autocomplete de endereço** (28 + 33/34) — dropdown ORS/Nominatim com debounce, lat/lng precisos, aviso "não encontrado" — ✅ entregue |
| próx. | Fatia **Execução e finalização do dia** (117–119, 121, 124–125, 127–128 + settings de origem/horário) — horários reais, banner de atraso, recalculo do restante, resumo do dia, replanejamento de pendências para hoje — ✅ entregue |
| pend. | Deploy Vercel (usuário adiciona o repo); teste real (Bloco 19) |