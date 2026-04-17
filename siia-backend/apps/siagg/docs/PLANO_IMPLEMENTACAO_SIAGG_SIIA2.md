# Plano de Implementacao do SIAGG no SIIA2.0

## 1. Diagnostico consolidado

### 1.1 Estado atual no SIIA2.0
- Frontend ja possui rota base do modulo em /dashboard/siagg.
- Layout padrao ja esta integrado no AppLayout (header, sidebar, logout e contexto de modulo).
- Modulo frontend SIAGG atual no SIIA2.0 esta em modo placeholder (apenas dashboard simples).
- Backend SIIA2.0 possui app apps.siagg com estrutura minima (health endpoint + 1 model exemplo).

### 1.2 Estado do projeto SIAGG original (fonte)
- Backend original (Django/DRF) possui entidades: User, Area, DataEntry, Report, ReportFile, GovernanceDocument.
- Endpoints originais: users, areas, data-entries, reports, governance-documents e pncp/pca-summary.
- Frontend original (React) possui fluxos: dashboard, pagina por area, documentos, repositorio de governanca, administracao e usuarios.

### 1.3 Banco de dados (credenciais de apps/siagg/siia.txt)
- Host: localhost
- Database: siia
- Usuario: siia
- Schema alvo: siagg
- Resultado da inspecao: schema siagg existe, porem sem tabelas.
- Resultado no SIAGG legado (sqlite): somente 1 usuario; nao ha dados operacionais relevantes para migracao historica.

Conclusao tecnica:
- A migracao deve priorizar modelagem e API primeiro (schema vazio), seguida por telas conectadas a API real.
- Nao existe carga historica obrigatoria; apenas carga inicial de referencia (areas, perfis, configuracoes).

## 2. Escopo funcional do primeiro ciclo (MVP)

### 2.1 Entradas do MVP
- Dashboard SIAGG com KPIs reais (dados agregados por area e por periodo).
- Cadastro e consulta de Areas.
- Cadastro e consulta de Data Entries (indicadores por area).
- Cadastro e consulta de Reports com upload de anexos.
- Repositorio de Governanca (upload/listagem/download de documentos).
- Integracao PNCP para area Orcamento e Financas.

### 2.2 Fora do MVP (fase 2)
- Tela administrativa completa de tema/layout do SIAGG legado.
- Gestao avancada de usuarios dentro do modulo SIAGG (sera reaproveitada da app usuarios do SIIA2.0).
- Refino visual completo do design system gov.br do projeto legado.

## 3. Arquitetura alvo no SIIA2.0

### 3.1 Backend (Django/DRF)
- Manter prefixo padrao existente: /api/siagg/.
- Implementar models reais em apps/siagg/models.py com schema PostgreSQL siagg.
- Implementar serializers, viewsets e permissions por papel usando usuario central (apps.usuarios.Usuario).
- Registrar rotas DRF em apps/siagg/urls.py com namespace proprio.
- Adicionar servico de integracao PNCP com cache e timeout defensivo.

### 3.2 Frontend (React/TypeScript)
- Manter AppLayout padrao do SIIA2.0 como shell unico.
- Expandir modulo src/modules/siagg com layout interno e rotas filhas:
  - /dashboard/siagg
  - /dashboard/siagg/areas/:id
  - /dashboard/siagg/documentos
  - /dashboard/siagg/governanca
  - /dashboard/siagg/relatorios
- Criar camada de servicos em src/services/siagg/ para chamadas REST.
- Tipar contratos API em src/types/siagg/.

### 3.3 Banco (PostgreSQL)
- Criar migracoes Django para tabelas no schema siagg.
- Garantir constraints, indices e foreign keys para consultas por area/data.
- Definir estrategia de media storage para anexos de relatorios e governanca.

## 4. Plano incremental de implementacao

## Fase 0 - Preparacao e contratos (1 a 2 dias)
- Definir contratos de API finais com payloads versionados.
- Definir matriz de permissoes por perfil (ADMIN, GESTOR, OPERADOR, CONSULTOR).
- Definir naming e padrao de resposta de erro.

Criterio de aceite:
- Documento de contratos aprovado (backend + frontend).

## Fase 1 - Modelo de dados e migracoes (2 a 3 dias)
- Substituir model placeholder do app siagg por entidades reais.
- Criar migracoes iniciais no app siagg com db_table no schema siagg.
- Incluir indices:
  - dataentry(area_id, date)
  - report(area_id, date)
  - governancedocument(uploaded_at)
- Criar comando de seed inicial de Areas e perfis basicos.

Criterio de aceite:
- migrate executa sem erro em ambiente local.
- rollback das migracoes validado.

## Fase 2 - API SIAGG (3 a 5 dias)
- Implementar serializers e viewsets:
  - areas
  - data-entries
  - reports
  - governance-documents
- Implementar upload de arquivos com validacao de tipo/tamanho.
- Integrar endpoint pncp/pca-summary com cache (1h) e fallback.
- Cobrir permissoes:
  - leitura: autenticado
  - escrita sensivel: ADMIN/GESTOR

Criterio de aceite:
- Colecao de endpoints validada com testes automatizados DRF.

## Fase 3 - Frontend SIAGG no shell padrao (4 a 6 dias)
- Evoluir SiaggLayout para menu interno do modulo.
- Implementar paginas principais com dados reais (sem mocks):
  - dashboard
  - area detalhe
  - documentos
  - repositorio governanca
- Integrar filtros, paginacao e estados de carregamento/erro.
- Reaproveitar componentes visuais do SIIA2.0 para manter consistencia.

Criterio de aceite:
- Navegacao completa via /dashboard/siagg funcionando em desktop e mobile.

## Fase 4 - Seguranca, auditoria e observabilidade (2 a 3 dias)
- Reutilizar autenticacao por token do SIIA2.0.
- Registrar logs de acoes criticas (upload, create/update/delete).
- Padronizar respostas de erro e mensagens de auditoria.

Criterio de aceite:
- Trilhas de auditoria disponiveis para acoes sensiveis.

## Fase 5 - Testes e homologacao (2 a 4 dias)
- Backend:
  - testes de serializers, permissions, filtros e uploads.
  - testes de contrato dos endpoints.
- Frontend:
  - testes de fluxo principal (dashboard -> area -> documentos).
  - testes de estados criticos (erro API, vazio, carregamento).
- Banco:
  - validar plano de rollback das migracoes.
  - validar performance de consultas mais frequentes.

Criterio de aceite:
- Pacote minimo de testes passando e homologacao funcional concluida.

## 5. Mapeamento de arquivos alvo no SIIA2.0

### Backend
- apps/siagg/models.py
- apps/siagg/serializers.py (novo)
- apps/siagg/views.py
- apps/siagg/urls.py
- apps/siagg/services/pncp_service.py (novo)
- apps/siagg/migrations/*

### Frontend
- src/modules/siagg/SiaggLayout.tsx
- src/modules/siagg/SiaggDashboardPage.tsx
- src/modules/siagg/pages/* (novas paginas)
- src/services/siagg/*
- src/types/siagg/*
- src/App.tsx (rotas filhas do modulo)
- src/layouts/AppLayout.tsx (ajuste de menu SIAGG interno)

## 6. Riscos e mitigacoes
- Risco: schema siagg vazio atrasa frontend por falta de dados.
  - Mitigacao: seed inicial + mocks controlados apenas durante fase de API.
- Risco: divergencia de auth entre SIAGG legado e SIIA2.0.
  - Mitigacao: remover auth local legado e centralizar em apps.usuarios.
- Risco: upload de arquivos sem politica clara de armazenamento.
  - Mitigacao: definir limite, extensoes permitidas e estrategia de backup antes de producao.
- Risco: regressao no AppLayout global.
  - Mitigacao: encapsular menu SIAGG em layout interno sem alterar shell global.

## 7. Estrategia de compatibilidade (SIAGG legado -> SIIA2.0)
- Estrategia adotada: migracao incremental por equivalencia funcional.
- Equivalencias previstas:
  - areas -> /api/siagg/areas/
  - data-entries -> /api/siagg/data-entries/
  - reports -> /api/siagg/reports/
  - governance-documents -> /api/siagg/governance-documents/
  - pncp/pca-summary -> /api/siagg/pncp/pca-summary/
- Status de compatibilidade atual: parcial (somente health e dashboard placeholder).
- Status alvo do ciclo MVP: compatibilidade funcional dos fluxos principais, com UI alinhada ao shell SIIA2.0.

## 8. Checklist objetivo de execucao
- [x] Aprovar contratos API e permissoes
- [x] Implementar models + migracoes schema siagg
- [ ] Publicar endpoints DRF SIAGG
- [ ] Integrar frontend SIAGG no AppLayout padrao
- [ ] Conectar paginas principais sem mocks
- [ ] Validar testes backend/frontend/banco
- [ ] Homologar com usuarios chave
- [ ] Preparar PR com evidencias de teste e rollback

Status de execucao em 2026-04-16:
- Passo 1 aprovado.
- Passo 2 aprovado (inicio autorizado para PR-01 e PR-02).
- Passo 3 iniciado e entregue com documento de contratos em [PR01_CONTRATOS_API_PERMISSOES_SIAGG.md](PR01_CONTRATOS_API_PERMISSOES_SIAGG.md).
- PR-02 concluido no escopo inicial: modelagem aplicada, migracao 0001 executada e seed das Areas realizado (8 registros).
- PR-03 concluido no escopo previsto para esta etapa: serializers, viewsets e permissoes de Areas e Data Entries, com testes DRF de contrato/autorizacao aprovados (10 testes).
- PR-04 concluido no escopo previsto para esta etapa: serializers, viewsets, upload e testes DRF de Reports e Governance Documents (suíte apps.siagg com 20 testes, todos aprovados).
- PR-05 concluido no escopo previsto para esta etapa: integracao PNCP com cache e endpoint dedicado, incluindo testes de contrato, autorizacao de refresh e tratamento de indisponibilidade externa (suíte apps.siagg com 24 testes, todos aprovados).
- Validacao manual em runtime concluida para endpoints de escrita: operador com upload de PDF em reports/governance (201) e consultor bloqueado para escrita (403).
- PR-06 concluido no frontend SIAGG: rotas internas, navegacao de modulo no AppLayout, servicos tipados e paginas funcionais (dashboard, area, relatorios, governanca e PNCP) com build validado.
- PR-07 iniciado: refinamentos funcionais em frontend com filtros avancados, paginacao client-side e estados de vazio/erro por endpoint nas telas SIAGG.

## 9. Backlog executavel (PR por PR)

### 9.1 Sequencia recomendada de PR
1. PR-01: Contratos API, tipos e permissoes (documentacao tecnica)
2. PR-02: Modelagem SIAGG + migracoes iniciais PostgreSQL
3. PR-03: Endpoints Areas e Data Entries com testes DRF
4. PR-04: Endpoints Reports e Governance Documents (upload/download)
5. PR-05: Integracao PNCP com cache e endpoint consolidado
6. PR-06: Estrutura frontend SIAGG (rotas, layout interno e servicos)
7. PR-07: Paginas funcionais SIAGG (dashboard, areas, documentos, governanca)
8. PR-08: Seguranca/auditoria e hardening de erros
9. PR-09: Pacote final de testes, ajustes de performance e homologacao

### 9.2 Backlog detalhado por PR

#### PR-01 - Contratos e alinhamento tecnico (4h a 6h)
Tarefas:
- Definir payloads padrao de request/response para todos os endpoints SIAGG.
- Definir matriz de permissoes por perfil (ADMIN, GESTOR, OPERADOR, CONSULTOR).
- Definir padrao de erro da API (code, detail, fields quando aplicavel).
- Definir convencao de filtros (area, data_inicio, data_fim, pagina, ordenacao).

Entregaveis:
- Documento de contrato de API e regras de autorizacao.

Dependencias:
- Nenhuma.

Criterio de pronto:
- Contrato aprovado por backend e frontend.

#### PR-02 - Dados e migracoes no schema siagg (8h a 12h)
Tarefas:
- Implementar modelos SIAGG em apps/siagg/models.py integrados ao usuario central (apps.usuarios.Usuario).
- Criar migracao inicial no app siagg para PostgreSQL.
- Adicionar indices de consulta por area/data e uploaded_at.
- Criar comando de seed para Areas padrao do SIAGG.

Entregaveis:
- Migracoes versionadas e reversiveis.
- Seed inicial executavel via comando Django.

Dependencias:
- PR-01.

Criterio de pronto:
- migrate e rollback executados com sucesso em ambiente local.
- Schema siagg com tabelas criadas e Areas carregadas.

#### PR-03 - API de Areas e Indicadores (10h a 14h)
Tarefas:
- Criar serializers para Area e DataEntry.
- Criar viewsets com filtros por area e periodo.
- Aplicar permissoes por perfil para operacoes de escrita.
- Escrever testes DRF de validacao, filtro e autorizacao.

Entregaveis:
- Endpoints /api/siagg/areas/ e /api/siagg/data-entries/ funcionais.

Dependencias:
- PR-02.

Criterio de pronto:
- Testes DRF do escopo passando.
- Contratos aderentes ao PR-01.

#### PR-04 - API de Relatorios e Governanca (12h a 16h)
Tarefas:
- Criar serializers e viewsets para Report, ReportFile e GovernanceDocument.
- Implementar upload com validacao de extensao e tamanho.
- Implementar listagem ordenada, download e metadados de autoria.
- Escrever testes DRF para upload, permissoes e listagem.

Entregaveis:
- Endpoints /api/siagg/reports/ e /api/siagg/governance-documents/ completos.

Dependencias:
- PR-02.

Criterio de pronto:
- Upload e download testados localmente.
- Testes de seguranca minima (tipo/tamanho e permissao) passando.

#### PR-05 - Integracao PNCP (6h a 10h)
Tarefas:
- Criar servico de consulta PNCP com timeout, retry leve e cache de 1 hora.
- Expor endpoint /api/siagg/pncp/pca-summary/ padronizado.
- Tratar falhas de origem sem quebrar o dashboard.
- Escrever testes de comportamento para sucesso/falha/cache.

Entregaveis:
- Endpoint PNCP estavel para consumo pelo frontend.

Dependencias:
- PR-03.

Criterio de pronto:
- Endpoint responde em cenario normal e falho com contrato consistente.

#### PR-06 - Estrutura frontend SIAGG (8h a 12h)
Tarefas:
- Estruturar rotas filhas de /dashboard/siagg no frontend.
- Evoluir SiaggLayout para navegacao interna do modulo.
- Criar camada src/services/siagg para chamadas API.
- Criar tipagem forte em src/types/siagg.

Entregaveis:
- Esqueleto funcional do modulo SIAGG sem dados mockados fixos.

Dependencias:
- PR-03 e PR-04.

Criterio de pronto:
- Rotas carregam sem erro e com estados de loading/erro padrao.

#### PR-07 - Telas funcionais SIAGG (16h a 24h)
Tarefas:
- Implementar Dashboard SIAGG com KPIs reais da API.
- Implementar pagina de Area com filtros e historico de indicadores.
- Implementar pagina de Documentos e Repositorio de Governanca com upload/listagem.
- Integrar consumo PNCP na visao de Orcamento e Financas.

Entregaveis:
- Fluxo ponta a ponta: dashboard -> area -> documentos/governanca.

Dependencias:
- PR-05 e PR-06.

Criterio de pronto:
- Fluxo principal validado manualmente sem uso de dados mock no caminho principal.

#### PR-08 - Seguranca, auditoria e observabilidade (8h a 12h)
Tarefas:
- Registrar logs de acoes criticas no backend (create/update/delete/upload).
- Padronizar mensagens de erro e codigos de resposta.
- Revisar controles de permissao de todos os endpoints SIAGG.
- Ajustar logs para consumo operacional (estrutura e nivel).

Entregaveis:
- Trilha minima de auditoria e hardening de API.

Dependencias:
- PR-04 e PR-07.

Criterio de pronto:
- Evidencias de log para operacoes sensiveis e testes de permissao revisados.

#### PR-09 - Testes finais e homologacao (10h a 16h)
Tarefas:
- Consolidar suite minima de testes backend e frontend.
- Executar validacao de performance basica para consultas por area/data.
- Executar roteiro de homologacao com usuarios chave.
- Preparar checklist final de PR com risco/rollback/evidencias.

Entregaveis:
- Pacote de release do modulo SIAGG pronto para deploy controlado.

Dependencias:
- PR-08.

Criterio de pronto:
- Testes definidos no plano aprovados.
- Homologacao funcional assinada.

### 9.3 Estimativa consolidada
- Faixa otimista: 82 horas.
- Faixa conservadora: 122 horas.
- Janela sugerida com 1 dev fulltime: 3 a 4 semanas.
- Janela sugerida com 2 devs (backend + frontend): 2 a 3 semanas.

### 9.4 Criterio de release (go/no-go)
- Go:
  - migracoes aplicam e revertem sem erro;
  - endpoints MVP com testes passando;
  - frontend sem mocks no fluxo principal;
  - homologacao de usuarios chave concluida.
- No-go:
  - falha de integridade no schema siagg;
  - upload sem validacao de seguranca;
  - quebra do shell comum AppLayout;
  - ausencia de evidencias minimas de teste.

### 9.5 Estrategia de commits recomendada
- Commits pequenos e coesos por intencao.
- Convencoes sugeridas:
  - feat(siagg-backend): modelagem inicial e migracoes
  - feat(siagg-api): endpoints de areas e indicadores
  - feat(siagg-frontend): estrutura de rotas e servicos
  - test(siagg): cobertura de contratos e permissoes
  - chore(siagg): seeds e ajustes de observabilidade
