# PR-01 - Contratos de API e Matriz de Permissoes do SIAGG

## Objetivo
Definir contratos de API, padrao de erro e matriz de autorizacao do modulo SIAGG no SIIA2.0 para guiar backend e frontend.

## Premissas
- Prefixo de rotas: /api/siagg/
- Autenticacao: TokenAuthentication do SIIA2.0
- Usuario de referencia: apps.usuarios.Usuario
- Perfis SIAGG: ADMIN, GESTOR, OPERADOR, CONSULTOR

## Padrao de resposta

### Sucesso (lista)
{
  "count": 0,
  "next": null,
  "previous": null,
  "results": []
}

### Sucesso (item)
{
  "id": 1,
  "...": "..."
}

### Erro padronizado
{
  "code": "validation_error",
  "detail": "Dados invalidos.",
  "fields": {
    "titulo": ["Este campo e obrigatorio."]
  }
}

Codigos de erro previstos:
- validation_error
- permission_denied
- not_found
- conflict
- external_service_unavailable
- internal_error

## Contratos de endpoints

### 1) Health
- GET /api/siagg/health/
- Permissao: publica
- Response 200:
{
  "module": "siagg",
  "status": "ok"
}

### 2) Areas
- GET /api/siagg/areas/
  - Query params: ativo=true|false, search
- GET /api/siagg/areas/{id}/
- POST /api/siagg/areas/
- PUT/PATCH /api/siagg/areas/{id}/
- DELETE /api/siagg/areas/{id}/

Payload base (Area):
{
  "id": 1,
  "nome": "Planejamento Estrategico",
  "slug": "planejamento-estrategico",
  "descricao": "...",
  "ativo": true,
  "criado_em": "2026-04-16T10:00:00-03:00",
  "atualizado_em": "2026-04-16T10:00:00-03:00"
}

### 3) Data Entries (Indicadores)
- GET /api/siagg/data-entries/
  - Query params: area_id, data_inicio, data_fim, ordering
- GET /api/siagg/data-entries/{id}/
- POST /api/siagg/data-entries/
- PUT/PATCH /api/siagg/data-entries/{id}/
- DELETE /api/siagg/data-entries/{id}/

Payload base (DataEntry):
{
  "id": 1,
  "area": 1,
  "titulo": "Indicador de conformidade",
  "valor": "98.50",
  "data_referencia": "2026-04-01",
  "observacao": "...",
  "operador": 10,
  "criado_em": "2026-04-16T10:00:00-03:00",
  "atualizado_em": "2026-04-16T10:00:00-03:00"
}

### 4) Reports
- GET /api/siagg/reports/
  - Query params: area_id, data_inicio, data_fim, ordering
- GET /api/siagg/reports/{id}/
- POST /api/siagg/reports/
- PUT/PATCH /api/siagg/reports/{id}/
- DELETE /api/siagg/reports/{id}/

Payload base (Report):
{
  "id": 1,
  "area": 1,
  "titulo": "Relatorio Trimestral",
  "descricao": "...",
  "data_referencia": "2026-03-31",
  "autor": 10,
  "criado_em": "2026-04-16T10:00:00-03:00",
  "atualizado_em": "2026-04-16T10:00:00-03:00",
  "arquivos": []
}

### 5) Report Files
- POST /api/siagg/reports/{id}/arquivos/
- DELETE /api/siagg/report-files/{id}/

Payload de upload (multipart/form-data):
- arquivo: file
- enviado_por: int (opcional; backend pode inferir do token)

Response base:
{
  "id": 1,
  "report": 1,
  "arquivo": "/media/siagg/reports/2026/04/16/arquivo.pdf",
  "enviado_por": 10,
  "criado_em": "2026-04-16T10:00:00-03:00"
}

### 6) Governance Documents
- GET /api/siagg/governance-documents/
  - Query params: categoria, data_inicio, data_fim, search
- GET /api/siagg/governance-documents/{id}/
- POST /api/siagg/governance-documents/
- PUT/PATCH /api/siagg/governance-documents/{id}/
- DELETE /api/siagg/governance-documents/{id}/

Payload base:
{
  "id": 1,
  "titulo": "Plano de Gestao 2025-2027",
  "descricao": "...",
  "categoria": "Estrategico",
  "arquivo": "/media/siagg/governanca/2026/04/16/plano.pdf",
  "enviado_por": 10,
  "criado_em": "2026-04-16T10:00:00-03:00"
}

### 7) PNCP
- GET /api/siagg/pncp/pca-summary/?cnpj=00394452000103&ano=2026
- POST /api/siagg/pncp/pca-summary/ (force refresh)

Response base:
{
  "ano": 2026,
  "cnpj": "00394452000103",
  "total_itens": 0,
  "valor_total": 0,
  "quantidade_categorias": 0,
  "categorias": [],
  "atualizado_em": "2026-04-16T10:00:00-03:00",
  "fonte": "Portal Nacional de Contratacoes Publicas (PNCP)"
}

## Matriz de permissoes

Legenda:
- R: leitura
- W: escrita (create/update/delete)
- U: upload/download de arquivo

| Recurso | ADMIN | GESTOR | OPERADOR | CONSULTOR |
|---|---|---|---|---|
| Health | R | R | R | R |
| Areas | R/W | R/W | R | R |
| Data Entries | R/W | R/W | R/W (somente propria area quando aplicavel) | R |
| Reports | R/W | R/W | R/W | R |
| Report Files | U | U | U | R (download) |
| Governance Documents | R/W/U | R/W/U | R/U | R/U |
| PNCP | R/W (refresh) | R/W (refresh) | R | R |

## Regras transversais
- Todos os endpoints, exceto health, exigem usuario autenticado.
- Escrita sensivel (delete e alteracoes estruturais) prioriza ADMIN e GESTOR.
- Upload permitido apenas para PDF, limite inicial 10 MB por arquivo.
- Erros de integracao externa (PNCP) nao devem quebrar o dashboard; retornar code external_service_unavailable com fallback tratavel no frontend.

## Critérios de aceite do PR-01
- Contratos e matriz de permissao aprovados por frontend e backend.
- Campos obrigatorios por endpoint explicitados.
- Padrao de erro reutilizavel definido.
