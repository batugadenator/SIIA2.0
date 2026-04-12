# Relatorio de Reengenharia - Integracao Reabilita no Ecossistema SIIA

## Contexto confirmado
- Codigo-fonte original do Reabilita nesta maquina: `D:\BigData\Projetos\reabilita`.
- Banco de dados alvo: `siia`.
- Schema do dominio Reabilita no PostgreSQL: `reabilita`.

## Diagnostico consolidado

### 1) Frontend SIIA atual (workspace)
- O Launchpad e layout autenticado foram evoluidos para visual inspirado no Reabilita.
- A rota `/dashboard/reabilita/*` ja renderiza paginas reais do modulo Reabilita (fase incremental), sem bootstrap independente.
- O SIIA principal usa autenticacao por token (endpoints em `/api/usuarios/*`).
- Arquitetura de layout consolidada com dois layouts de plataforma:
  - `PublicLayout` para area publica.
  - `AppLayout` para area autenticada.

### 2) Reabilita original (projeto externo)
- O backend original expoe API em:
  - `/api/v1/auth/*`
  - `/api/v1/pessoal/*`
  - `/api/v1/saude/*`
  - `/api/v1/estatistica/*`
- O frontend original consome exatamente esse contrato (`/auth`, `/saude`, `/pessoal`) via `VITE_API_BASE_URL`.
- O modulo Reabilita copiado no SIIA ainda esta no formato de app independente (router/providers bootstrap proprios).

### 3) Gap principal de integracao
- Ha divergencia de contrato entre:
  - SIIA atual: `/api/usuarios/*` (token)
  - Reabilita original: `/api/v1/auth/*`, `/api/v1/saude/*`, `/api/v1/pessoal/*` (session/csrf + api de dominio)
- O backend `apps/reabilita` no SIIA ainda esta minimo (health + modelo simplificado), sem endpoints de dominio clinico.

## Decisoes arquiteturais recomendadas

### Decisao A (recomendada): SIIA como plataforma unica, Reabilita como modulo interno
1. Manter frontend unico (`siia-frontend`) e backend unico (`siia-backend`).
2. Integrar o modulo Reabilita como sub-rotas reais em `/dashboard/reabilita/*`.
3. Adaptar servicos do Reabilita para o cliente API compartilhado do SIIA.
4. Expor no backend SIIA os endpoints de dominio Reabilita em namespace estavel (preferencia: `/api/reabilita/*` com aliases temporarios `/api/v1/*` durante transicao).

### Decisao B (alternativa temporaria): camada de compatibilidade
1. Preservar contrato legado `/api/v1/*` no SIIA para reduzir impacto inicial.
2. Gradualmente migrar frontend para contratos finais do ecossistema.

## Plano tecnico incremental

### Fase 1 - Contrato e dados (bloqueador)
1. Definir mapa endpoint-a-endpoint (origem Reabilita -> destino SIIA).
2. Definir politica de autenticacao unica (token ou sessao) para todo ecossistema.
3. Configurar schema `reabilita` no backend SIIA para migracoes e queries.

### Fase 2 - Backend Reabilita no SIIA
1. Portar modelos de dominio (saude, pessoal, estatistica) com ajuste de namespace e dependencias.
2. Portar serializers/views/viewsets e rotas principais.
3. Garantir permissao por perfil/grupo AD e auditoria.
4. Criar migracoes reversiveis no schema `reabilita`.

### Fase 3 - Frontend Reabilita integrado
1. Remover bootstrap independente do modulo copiado (sem BrowserRouter proprio).
2. Integrar providers do Reabilita ao runtime principal (ou adapter por modulo).
3. Substituir chamadas de auth/session por estrategia escolhida no SIIA.
4. Ativar paginas reais nas rotas `/dashboard/reabilita/*`.

### Fase 4 - Padrao visual unico (requisito do projeto)
1. Consolidar shell visual Reabilita como base compartilhada de apps.
2. Aplicar mesmo padrao em SIAGG e CMS (layout, tipografia, espacos, estados de loading/empty/error).
3. Extrair componentes comuns para evitar duplicacao (cards, sections, breadcrumbs, filtros).

## Schema PostgreSQL: orientacao pratica
Para usar o schema `reabilita` dentro do banco `siia`, configurar o `search_path` no backend SIIA, por exemplo:
- `OPTIONS: { options: '-c search_path=reabilita,public' }`

Observacoes:
- Essa estrategia permite que migracoes e tabelas do dominio Reabilita sejam criadas no schema `reabilita`.
- Manter `public` no fim do `search_path` evita quebra de dependencias gerais.
- Em migracao incremental, aplicar primeiro em ambiente de dev/hml e validar rollback.

## Riscos e mitigacoes
- Risco: choque de autenticacao (token vs sessao).
  - Mitigacao: decidir padrao unico antes de portar telas.
- Risco: duplicacao de routers/providers no frontend.
  - Mitigacao: converter modulo Reabilita para modo embed no Router principal.
- Risco: regressao de contrato de API.
  - Mitigacao: suite de testes de contrato e aliases temporarios.
- Risco: inconsistencias visuais entre apps.
  - Mitigacao: design system compartilhado e checklists de UI por modulo.

## Criterios de aceite da integracao
1. Login unico no SIIA acessa modulo Reabilita sem novo login.
2. Rotas reais do Reabilita funcionam em `/dashboard/reabilita/*`.
3. Endpoints criticos de saude/pessoal/estatistica respondem no backend SIIA.
4. SIAGG, CMS e Reabilita usam o mesmo shell visual base.
5. Build frontend, checks backend e testes de contrato passam em CI.

## Proximo passo recomendado imediato
- Gerar matriz tecnica de migracao (Endpoint, Metodo, Origem, Destino, Status, Risco, Teste de aceite) para iniciar execucao por sprint.

## Execucao realizada nesta rodada
1. Matriz endpoint-a-endpoint gerada em `MATRIZ_ENDPOINTS_REABILITA_X_SIIA.md`.
2. Backend SIIA ajustado para `search_path=reabilita,public` via `POSTGRES_SEARCH_PATH`.
3. Rota `/dashboard/reabilita/*` saiu do placeholder e passou a renderizar o dashboard real do modulo Reabilita (fase inicial).
4. Endpoint `GET /api/v1/estatistica/painel-clinico/` passou de payload mock para agregacoes reais com base em dados de atendimentos clinicos.
5. Testes de API adicionados para o contrato do painel clinico cobrindo cenarios sem dados e com dados (shape + tipos + consistencia de agregacoes).
6. Proximo endpoint critico da matriz implementado no mesmo padrao incremental: `GET /api/v1/saude/atendimentos/referencias/`.
7. Adapter de autenticacao por sessao implementado para contrato Reabilita em `/api/v1/auth/*` com os endpoints:
  - `GET /api/v1/auth/csrf/`
  - `POST /api/v1/auth/login/`
  - `GET /api/v1/auth/me/`
  - `POST /api/v1/auth/logout/`
8. Testes de API adicionados para o contrato de autenticacao por sessao, cobrindo:
  - `me` anonimo
  - fluxo completo `csrf -> login -> me -> logout`
  - falha de login com `401`
9. Endpoint `GET/PUT /api/v1/auth/ldap-config/` implementado com persistencia e contrato compativel (`bind_password_configured`, `updated_by_username`, etc.).
10. Bloco `auth/usuarios/*` implementado com operacoes:
  - `GET /api/v1/auth/usuarios/`
  - `POST /api/v1/auth/usuarios/novo/`
  - `GET/PATCH/DELETE /api/v1/auth/usuarios/{id}/`
  - `POST /api/v1/auth/usuarios/{id}/resetar-senha/`
11. Endpoint critico de dominio `GET/POST /api/v1/saude/atendimentos/` implementado com shape compativel ao frontend Reabilita.
12. Endpoint `GET /api/v1/saude/atendimentos/referencias/` ampliado para o contrato completo esperado no frontend (mantendo aliases do payload transitorio para compatibilidade).
13. Testes de contrato adicionados para:
  - `auth/ldap-config` (GET/PUT + controle de acesso)
  - `auth/usuarios/*` (fluxo CRUD + reset de senha)
  - `saude/atendimentos/` (lista vazia e criacao/listagem com shape)
14. Bloco Auth restante fechado com:
  - `POST /api/v1/auth/mudar-senha/`
  - `POST /api/v1/auth/recuperar-senha/`
15. Proximo endpoint critico de saude implementado:
  - `GET/POST /api/v1/saude/evolucoes/` (com filtro opcional por `atendimento_id`)
16. Testes de contrato adicionados para:
  - `auth/mudar-senha` (autenticacao obrigatoria + alteracao efetiva de credencial)
  - `auth/recuperar-senha` (reset por CPF)
  - `saude/evolucoes/` (lista vazia, criacao e filtro)
17. Endpoint critico de fisioterapia implementado:
  - `GET/POST /api/v1/saude/fisioterapia/avaliacoes-sred/`
  - `PATCH /api/v1/saude/fisioterapia/avaliacoes-sred/{id}/`
18. Testes de contrato adicionados para S-RED cobrindo:
  - lista vazia
  - criacao e listagem
  - filtro por `atendimento_id`
  - patch de campos clinicos e liberacao para PEF com rastreio de usuario autenticado
19. Refatoracao de layout autenticado concluida para padrao unico de plataforma:
  - area logada consolidada em `AppLayout`
  - wrappers visuais redundantes removidos de Reabilita, SIAGG, CMS e Legados (mantendo regras de acesso e providers)
20. Estrutura de `siia-frontend/src/layouts` reduzida para somente:
  - `PublicLayout.tsx`
  - `AppLayout.tsx`
  - shell interno movido para `siia-frontend/src/components/ui/shell/InternalAppLayout.tsx`
21. Ajuste de usabilidade visual no shell autenticado:
  - menu lateral do AppLayout reduzido (desktop e tablet) para ampliar area util dos modulos.
22. Smoke tecnico de rotas do shell autenticado executado em `vite preview` com retorno HTTP `200` para:
  - `/dashboard`
  - `/dashboard/reabilita`
  - `/dashboard/siagg`
  - `/dashboard/cms`
  - `/dashboard/legados`
23. Identificacao e aplicacao da paleta oficial do Reabilita no shell autenticado:
  - `src/assets/css/input.css` do Reabilita original validado como vazio (nao e fonte de estilo)
  - origem real do padrao visual confirmada em `src/design-system/tokens/colors.module.scss` e `src/design-system/styles/global.scss`
  - `InternalAppLayout.css` ajustado para aderir aos tokens de cor oficiais (tons de cinza + destaque amarelo e contraste de leitura)
24. Ajuste fino de UX por breakpoint no shell autenticado:
  - larguras do menu lateral parametrizadas por variaveis CSS (`desktop`, `tablet`, `mobile`) em `InternalAppLayout.css`
  - espacamento de conteudo tambem parametrizado por breakpoint para manter leitura e area util
25. Smoke visual automatizado do shell autenticado executado com Playwright:
  - spec: `tests/visual/app-shell-breakpoints.spec.ts`
  - rotas verificadas: `/dashboard`, `/dashboard/reabilita`, `/dashboard/siagg`, `/dashboard/cms`, `/dashboard/legados`
  - breakpoints validados: desktop (264px), tablet (228px), mobile (sidebar em largura total)
  - resultado: `6 passed`
26. Validacao automatizada da navegacao contextual do menu lateral por modulo:
  - spec: `tests/visual/app-shell-module-menu.spec.ts`
  - Reabilita: exibicao de menu funcional (ex.: `Médico`, `Fisioterapia`, `S-RED`) e navegacao para `/dashboard/reabilita/medico`
  - CMS: exibicao de menu funcional (ex.: `Notícias`, `Homologação`, `Configuração Visual`) e navegacao para `/dashboard/cms/homologacao`
  - resultado: `4 passed`
27. Correcao do menu lateral do Reabilita para aderencia ao padrao visual/funcional do original:
  - itens faltantes restaurados (ex.: `Cadetes / Alunos`, `Relatórios S-RED`, `Configurações Gerais`, `Minha Conta`)
  - agrupamento por secoes alinhado ao fluxo do modulo (`Seção de Saúde`, `Módulos`, `Configurações`, `Minha Conta`)
  - ajuste visual do sidebar para aproximacao do layout original (estado ativo, espacamentos e hierarquia)
  - validacao automatizada atualizada em `tests/visual/app-shell-module-menu.spec.ts` com resultado `4 passed`
28. Padronizacao e validacao do botao de retorno do shell autenticado:
  - rótulo do botao alterado para `Voltar` nas entradas dos apps
  - validacao automatizada adicionada para as rotas iniciais `/dashboard/reabilita`, `/dashboard/siagg`, `/dashboard/cms` e `/dashboard/legados`
  - assert de destino do link para `/dashboard`
  - resultado da suite atualizada `tests/visual/app-shell-module-menu.spec.ts`: `6 passed`

## Proximo passo tecnico apos esta rodada
1. Seguir para o proximo endpoint da matriz de saude ainda pendente (ex.: blocos de procedimentos/agenda), mantendo o padrao de adaptador incremental com testes de contrato.
2. Executar validacao integrada com o frontend Reabilita consumindo os endpoints de auth e saude ja entregues.
3. Consolidar checklist de equivalencia funcional (payloads, filtros, codigos de status e mensagens) para os proximos blocos da matriz.
4. Consolidar frente de UX/layout no shell autenticado (`AppLayout` + `InternalAppLayout`) com foco em area util:
  - validar largura do menu lateral por breakpoint (desktop/tablet/mobile)
  - definir ajuste fino via variaveis CSS para manutencao futura
  - executar smoke visual em Reabilita, SIAGG, CMS e Legados para garantir que a reducao do menu nao degrade navegacao, leitura e formularios.
