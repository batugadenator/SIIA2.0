# Matriz de Endpoints - Reabilita (origem) x SIIA (destino)

## Legenda de status
- Implementado: endpoint equivalente ja existe no SIIA.
- Parcial: existe endpoint similar, mas com diferenca de contrato/comportamento.
- Ausente: nao existe no SIIA atual.
- Alvo: endpoint recomendado para consolidacao no ecossistema.

## Matriz

| Dominio | Origem Reabilita | Metodo | Destino SIIA atual | Destino SIIA alvo | Status | Risco | Acao inicial |
|---|---|---|---|---|---|---|---|
| Auth | /api/v1/auth/csrf/ | GET | N/A (token) | /api/reabilita/auth/csrf/ (somente se sessao) | Ausente | Medio | Definir padrao unico de auth (token ou sessao) |
| Auth | /api/v1/auth/login/ | POST | /api/usuarios/login/ | /api/usuarios/login/ (alias opcional /api/reabilita/auth/login/) | Parcial | Medio | Criar adapter de payload/resposta no frontend Reabilita |
| Auth | /api/v1/auth/me/ | GET | /api/usuarios/me/ | /api/usuarios/me/ (alias opcional) | Parcial | Medio | Alinhar campos de retorno esperados pelo modulo |
| Auth | /api/v1/auth/logout/ | POST | /api/usuarios/logout/ | /api/usuarios/logout/ | Parcial | Baixo | Alinhar semantica (token revoke/session destroy) |
| Auth | /api/v1/auth/ldap-config/ | GET/PUT | N/A | /api/reabilita/auth/ldap-config/ ou /api/usuarios/ldap-config/ | Ausente | Medio | Portar views administrativas de LDAP |
| Auth | /api/v1/auth/usuarios/ | GET | N/A | /api/reabilita/auth/usuarios/ | Ausente | Medio | Portar gestao de usuarios do Reabilita |
| Auth | /api/v1/auth/usuarios/novo/ | POST | N/A | /api/reabilita/auth/usuarios/novo/ | Ausente | Medio | Portar criacao de usuario administrativo |
| Auth | /api/v1/auth/usuarios/{id}/ | PATCH/DELETE/GET | N/A | /api/reabilita/auth/usuarios/{id}/ | Ausente | Medio | Portar operacoes de detalhe de usuario |
| Auth | /api/v1/auth/usuarios/{id}/resetar-senha/ | POST | N/A | /api/reabilita/auth/usuarios/{id}/resetar-senha/ | Ausente | Medio | Portar reset admin |
| Auth | /api/v1/auth/mudar-senha/ | POST | N/A | /api/reabilita/auth/mudar-senha/ | Ausente | Medio | Portar fluxo de troca de senha |
| Auth | /api/v1/auth/recuperar-senha/ | POST | N/A | /api/reabilita/auth/recuperar-senha/ | Ausente | Medio | Portar fluxo de recuperacao |
| Pessoal | /api/v1/pessoal/militares/ | CRUD | N/A | /api/reabilita/pessoal/militares/ | Ausente | Alto | Portar models + viewsets + serializer |
| Pessoal | /api/v1/pessoal/profissionais-saude/ | CRUD | N/A | /api/reabilita/pessoal/profissionais-saude/ | Ausente | Alto | Portar models + viewsets + serializer |
| Saude | /api/v1/saude/atendimentos/ | CRUD | N/A | /api/reabilita/saude/atendimentos/ | Ausente | Alto | Portar dominio clinico central |
| Saude | /api/v1/saude/atendimentos/referencias/ | GET | N/A | /api/reabilita/saude/atendimentos/referencias/ | Ausente | Alto | Portar endpoint de referencias clinicas |
| Saude | /api/v1/saude/evolucoes/ | CRUD | N/A | /api/reabilita/saude/evolucoes/ | Ausente | Alto | Portar evolucao multidisciplinar |
| Saude | /api/v1/saude/fisioterapia/avaliacoes-sred/ | CRUD | N/A | /api/reabilita/saude/fisioterapia/avaliacoes-sred/ | Ausente | Alto | Portar ficha S-RED |
| Saude | /api/v1/saude/nutricao/avaliacoes/ | CRUD | N/A | /api/reabilita/saude/nutricao/avaliacoes/ | Ausente | Alto | Portar modulo nutricao |
| Saude | /api/v1/saude/educacao-fisica/sessoes-treino/ | CRUD | N/A | /api/reabilita/saude/educacao-fisica/sessoes-treino/ | Ausente | Alto | Portar modulo PEF |
| Saude | /api/v1/saude/educacao-fisica/evolucao-carga/ | GET | N/A | /api/reabilita/saude/educacao-fisica/evolucao-carga/ | Ausente | Alto | Portar visao agregada PEF |
| Saude | /api/v1/saude/psicopedagogia/intervencoes/ | CRUD | N/A | /api/reabilita/saude/psicopedagogia/intervencoes/ | Ausente | Alto | Portar modulo psicopedagogia |
| Saude | /api/v1/saude/sred/resumo-compartilhado/ | GET | N/A | /api/reabilita/saude/sred/resumo-compartilhado/ | Ausente | Alto | Portar resumo interdisciplinar |
| Saude | /api/v1/saude/atendimentos/{id}/fluxo/ | GET | N/A | /api/reabilita/saude/atendimentos/{id}/fluxo/ | Ausente | Alto | Portar estado de fluxo |
| Saude | /api/v1/saude/atendimentos/{id}/fluxo/transicao/ | POST | N/A | /api/reabilita/saude/atendimentos/{id}/fluxo/transicao/ | Ausente | Alto | Portar transicao de workflow |
| Saude | /api/v1/saude/atendimentos/{id}/instrutor/notas/ | GET/POST | N/A | /api/reabilita/saude/atendimentos/{id}/instrutor/notas/ | Ausente | Alto | Portar notas de instrutor |
| Saude | /api/v1/saude/atendimentos/{id}/instrutor/decisao-final/ | POST | N/A | /api/reabilita/saude/atendimentos/{id}/instrutor/decisao-final/ | Ausente | Alto | Portar decisao final |
| Saude | /api/v1/saude/referencia-lesao/ | GET | N/A | /api/reabilita/saude/referencia-lesao/ | Ausente | Medio | Portar catalogo lesao |
| Saude | /api/v1/saude/referencia-lesao/lookup/ | GET | N/A | /api/reabilita/saude/referencia-lesao/lookup/ | Ausente | Medio | Portar lookup em cadeia |
| Saude | /api/v1/saude/referencia-lesao/hierarquia/ | GET | N/A | /api/reabilita/saude/referencia-lesao/hierarquia/ | Ausente | Medio | Portar hierarquia para UI |
| Saude | /api/v1/saude/carga-referencias/ | POST | N/A | /api/reabilita/saude/carga-referencias/ | Ausente | Medio | Portar ETL/carga de referencia |
| Saude | /api/v1/saude/carga-referencias/historico/ | GET | N/A | /api/reabilita/saude/carga-referencias/historico/ | Ausente | Medio | Portar historico ETL |
| Saude | /api/v1/saude/importar-csv/preview/ | POST | N/A | /api/reabilita/saude/importar-csv/preview/ | Ausente | Medio | Portar validacao de preview |
| Saude | /api/v1/saude/importar-csv/confirmar/ | POST | N/A | /api/reabilita/saude/importar-csv/confirmar/ | Ausente | Medio | Portar confirmacao de carga |
| Estatistica | /api/v1/estatistica/painel-clinico/ | GET | N/A | /api/reabilita/estatistica/painel-clinico/ | Ausente | Alto | Portar painel clinico (dashboard) |
| Estatistica | /api/v1/estatistica/sred-anual/ | GET | N/A | /api/reabilita/estatistica/sred-anual/ | Ausente | Medio | Portar relatorio anual |
| Estatistica | /api/v1/estatistica/eficacia-reabilitacao/ | GET | N/A | /api/reabilita/estatistica/eficacia-reabilitacao/ | Ausente | Medio | Portar indicador de eficacia |

## Resumo executivo da matriz
- Total mapeado: 35 contratos.
- Ja existentes (parcial): 3 (login, me, logout).
- Ausentes no SIIA: 32.
- Bloco critico para ativar rota real do dashboard Reabilita: estatistica/painel-clinico + auth adapter.

## Ordem recomendada de execucao (MVP de integracao)
1. Adapter de autenticacao no frontend Reabilita para consumir `/api/usuarios/login`, `/me`, `/logout`.
2. Backend: implementar `/api/reabilita/estatistica/painel-clinico/` (ou alias `/api/v1/estatistica/painel-clinico/`).
3. Backend: implementar subconjunto minimo de `/api/reabilita/saude/atendimentos/referencias/`.
4. Em seguida, expandir saude/pessoal por fluxo clinico.
