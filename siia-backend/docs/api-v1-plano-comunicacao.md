# Plano de Comunicacao - Descontinuacao do Alias API v1 (CadFuncional)

## Objetivo

Coordenar a descontinuacao do alias legado /api/v1 com janelas de aviso claras, baixo risco operacional e mensagens explicitas de rollback.

## Publico-alvo

1. Equipes internas de frontend e backend.
2. Consumidores de integracao (scripts de automacao, gateways e chamadores externos).
3. Equipes de operacao/observabilidade e service desk.

## Linha do tempo

1. T-7 dias: aviso inicial e orientacao de migracao.
2. T-1 dia: lembrete final e detalhes da janela de congelamento.
3. T-0: comunicados de inicio e conclusao do corte.
4. T+1 dia: resumo pos-corte e lista residual de acoes.

## Canais de comunicacao

1. Canal de equipe (principal): anuncio de release.
2. Ticket/chamado de mudanca: evidencias formais e aprovacoes.
3. Lista de e-mail dos consumidores de integracao.
4. Opcional: banner no portal interno para ampla visibilidade.

## Modelos de mensagem

### Aviso T-7

Assunto: Aviso de descontinuacao - alias /api/v1 do CadFuncional

Mensagem:

Sera realizada a descontinuacao do alias legado /api/v1 do CadFuncional.

- Endpoint canonico: /api/cadfuncional
- Janela prevista de corte: [DATA/HORA, FUSO]
- Sequencia de ambientes: HML primeiro, PROD apos validacao
- Acao necessaria: atualizar integracoes para /api/cadfuncional
- Controle temporario: API_V1_ALIAS_ENABLED

Solicitamos confirmar os consumidores afetados ate [DATA].

### Lembrete T-1

Assunto: Lembrete final - corte do /api/v1 em 24h

Mensagem:

Este e o lembrete final para o corte do alias /api/v1.

- Inicio: [DATA/HORA, FUSO]
- Impacto esperado: chamadas para /api/v1 podem retornar 404 apos o corte
- Sem impacto esperado para /api/cadfuncional
- Plano de rollback: reativar API_V1_ALIAS_ENABLED, se necessario

Se ainda houver dependencia de /api/v1, comunicar imediatamente.

### Inicio T-0

Assunto: Mudanca iniciada - descontinuacao do alias /api/v1

Mensagem:

O corte foi iniciado.

- Acao: API_V1_ALIAS_ENABLED=false
- Validacoes em andamento:
  - /api/cadfuncional/health -> esperado 200
  - /api/v1/health -> esperado 404

Proxima atualizacao em [X] minutos.

### Conclusao T-0

Assunto: Mudanca concluida - descontinuacao do alias /api/v1

Mensagem:

O corte foi concluido com sucesso.

- /api/cadfuncional e o unico endpoint suportado para este dominio.
- /api/v1 esta desativado.
- A janela de monitoracao permanece ativa por [X] horas.

Em caso de anomalia, informar horario, endpoint e status code.

### Aviso de rollback

Assunto: Rollback executado - alias /api/v1 restaurado temporariamente

Mensagem:

Rollback executado devido a [MOTIVO CURTO].

- Acao: API_V1_ALIAS_ENABLED=true
- Estado atual:
  - /api/v1 novamente disponivel
  - /api/cadfuncional permanece disponivel

Nova data de corte sera comunicada apos analise da causa raiz.

## Template de changelog

Titulo: CadFuncional API - descontinuacao de alias

Resumo:

- Descontinuado: /api/v1/* (escopo CadFuncional)
- Canonico: /api/cadfuncional/*
- Feature flag: API_V1_ALIAS_ENABLED

Mudanca disruptiva:

- Com API_V1_ALIAS_ENABLED=false, /api/v1/* retorna 404.

Notas de migracao:

1. Substituir /api/v1 por /api/cadfuncional em todos os consumidores.
2. Validar que comportamento de auth/sessao/token permanece inalterado.
3. Reexecutar smoke tests apos a troca de endpoint.

## Checklist de prontidao de comunicacao

1. Inventario de consumidores atualizado com responsaveis.
2. Aviso T-7 enviado com rastreio de confirmacoes.
3. Lembrete T-1 enviado e riscos sem resposta escalados.
4. Canal operacional T-0 com equipe ativa durante toda a janela.
5. Resumo pos-corte publicado com metricas.
