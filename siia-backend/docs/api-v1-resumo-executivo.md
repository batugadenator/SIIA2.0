# Resumo Executivo - Descontinuacao do Alias API v1 (CadFuncional)

## Contexto

O dominio CadFuncional possui endpoint canonico em /api/cadfuncional e alias legado em /api/v1.
A proposta e descontinuar o alias legado de forma controlada, reduzindo custo de manutencao e risco de ambiguidade de contrato.

## Objetivo da mudanca

1. Encerrar o uso de /api/v1 para o dominio CadFuncional.
2. Consolidar /api/cadfuncional como unica rota suportada.
3. Executar corte com controle operacional e rollback rapido.

## Escopo

1. Em escopo: chamadas CadFuncional atendidas por /api/v1.
2. Fora de escopo: /api/siagg, /api/cms, /api/usuarios.

## Mecanismo de controle

1. Feature flag operacional: API_V1_ALIAS_ENABLED.
2. Comportamento:
   - true: mantem alias /api/v1 ativo.
   - false: desativa alias /api/v1 e preserva /api/cadfuncional.

## Beneficios esperados

1. Reducao de superficie legada e de custo de suporte.
2. Contrato de API mais claro para integradores.
3. Menor risco de divergencia funcional entre rotas equivalentes.

## Riscos

1. Consumidores externos ainda dependentes de /api/v1.
2. Aumento pontual de 4xx apos corte, se houver cliente nao migrado.

## Mitigacoes

1. Comunicacao em janelas T-7, T-1, T-0 e T+1.
2. Execucao em HML antes de PROD.
3. Monitoracao por path, status code, p95/p99 e 5xx.
4. Rollback operacional em menos de 5 minutos.

## Criterios de aprovacao

1. Inventario de consumidores atualizado.
2. Dry-run em HML sem regressao funcional.
3. Sem dependencia obrigatoria residual de /api/v1 antes do corte em PROD.
4. Evidencias publicadas de validacao tecnica e observabilidade.

## Plano de execucao

1. T-7: aviso inicial com orientacao de migracao para /api/cadfuncional.
2. T-1: lembrete final com janela e impacto esperado.
3. T-0: aplicar API_V1_ALIAS_ENABLED=false e validar health/rotas.
4. T+2h: consolidar monitoracao e confirmar estabilidade.

## Plano de rollback

1. Reativar API_V1_ALIAS_ENABLED=true.
2. Reiniciar backend.
3. Revalidar:
   - /api/v1/health com 200
   - /api/cadfuncional/health com 200
4. Publicar comunicacao de rollback e nova janela de corte.

## Evidencias minimas para CAB/CR

1. Resultado de backend check.
2. Resultado de build frontend.
3. Snapshot de metricas por path antes/depois.
4. Registro de comunicacoes e aprovacoes.

## Referencias

1. docs/api-v1-decommission-checklist.md
2. docs/api-v1-plano-comunicacao.md
3. docs/api-v1-communication-plan.md
