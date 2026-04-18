# Proposta Tecnica de Migracao SIIA -> SIIA2.0

## 1. Objetivo

Definir um plano tecnico para migrar e integrar o modelo legado de autorizacao por sistema/nivel/pessoa (SIIA antigo) no SIIA2.0, com foco em:

- Reuso da logica legada de permissao para CMS e CadFuncional.
- Ponte de identidade entre usuario autenticado e cod_pessoa.
- Execucao incremental com baixo risco operacional.
- Validacao objetiva de comportamento, performance e rollback.

## 2. Diagnostico Atual

### 2.1 Modelo legado de acesso (confirmado)

- `principal.sistemas_perifericos`: cadastro de sistemas.
- `principal.ni_aces_sist_perif`: niveis por sistema (`cod_sist`, `cod_ni`, `nivel`).
- `principal.ct_aces_sist_perif`: concessao por pessoa e sistema (`cod_pessoa`, `cod_sist`, `cod_ni`).

Relacionamentos confirmados:

1. `ct_aces_sist_perif.cod_pessoa` -> `pessoal.pessoa.cod_pessoa`
2. `ct_aces_sist_perif.(cod_sist,cod_ni)` -> `ni_aces_sist_perif.(cod_sist,cod_ni)`
3. `ni_aces_sist_perif.cod_sist` -> `sistemas_perifericos.cod_sist`

### 2.2 Lacuna para SIIA2.0

- O login atual usa `principal.usuarios_usuario`.
- O legado autoriza por `pessoal.pessoa.cod_pessoa`.
- Nao existe ponte confiavel e explicita entre `usuarios_usuario` e `cod_pessoa` no ambiente atual.

### 2.3 Impacto funcional

- Mesmo com catalogo de niveis existente, sem ponte de identidade a autorizacao legada nao pode ser aplicada de forma segura nos endpoints novos.

## 3. Gargalos Prioritarios

1. Ausencia de vinculo usuario -> pessoa.
2. Ausencia de concessoes ativas para os modulos novos em parte dos ambientes.
3. Risco de drift entre nomenclatura antiga (`reabilita`) e nova (`cadfuncional`) em metadados de sistema.
4. Falta de servico centralizado de decisao de autorizacao no backend.

## 4. Proposta de Arquitetura

## 4.1 Camada de identidade (obrigatoria)

Criar tabela de ponte dedicada no schema `principal` para mapear usuario autenticado para pessoa legada.

### Tabela sugerida

`principal.usuario_pessoa_vinculo`

Campos:

- `id` bigserial PK
- `usuario_id` bigint NOT NULL UNIQUE FK -> `principal.usuarios_usuario(id)`
- `cod_pessoa` integer NOT NULL FK -> `pessoal.pessoa(cod_pessoa)`
- `fonte_vinculo` varchar(30) NOT NULL (`manual`, `carga`, `ldap`, `api`)
- `confianca` smallint NOT NULL (`0..100`)
- `ativo` boolean NOT NULL default true
- `criado_em` timestamptz NOT NULL default now()
- `atualizado_em` timestamptz NOT NULL default now()

Indices:

- `ux_usuario_pessoa_vinculo_usuario_id` UNIQUE (`usuario_id`)
- `ix_usuario_pessoa_vinculo_cod_pessoa_ativo` (`cod_pessoa`, `ativo`)

Trade-off:

- Pro: elimina heuristica em runtime e reduz ambiguidade.
- Contra: exige governanca de carga/vinculacao inicial.

## 4.2 Servico de autorizacao unico (backend)

Criar servico no backend (ex.: `apps/cadfuncional/services.py` e camada compartilhada) com fluxo:

1. Receber `request.user.id`.
2. Resolver `cod_pessoa` em `usuario_pessoa_vinculo` (somente `ativo=true`).
3. Resolver permissao em `ct_aces_sist_perif` para `cod_sist` do modulo.
4. Enriquecer com `ni_aces_sist_perif.nivel`.
5. Retornar decisao final (`permitido|negado`) + `cod_ni` + `nivel`.

Regra de seguranca:

- Sem vinculo ou sem concessao: negar por padrao (deny-by-default).

## 4.3 Mapeamento de modulos

- CMS: `cod_sist = 26`.
- CadFuncional: `cod_sist = 27`.

Observacao:

- Validar e alinhar `principal.sistemas_perifericos.caminho` para nomenclatura final do frontend atual.

## 5. Plano de Migracao por Etapas

## Etapa A - Preparacao (DB e observabilidade)

1. Criar `usuario_pessoa_vinculo` e indices.
2. Criar view de diagnostico de cobertura de vinculo.
3. Adicionar logging estruturado de decisao de autorizacao.

Criterio de sucesso:

- Estruturas criadas sem lock prolongado.
- Tempo de lookup de vinculo e permissao com p95 < 20 ms no banco.

## Etapa B - Carga inicial de vinculos

1. Executar rotina de carga com regras deterministicas (quando houver chave forte).
2. Itens ambiguos ficam pendentes para validacao manual.
3. Marcar `confianca` por regra aplicada.

Criterio de sucesso:

- Cobertura de vinculo >= 95% dos usuarios ativos do modulo alvo.
- 0 conflitos de `usuario_id` duplicado.

## Etapa C - Carga de concessoes para cod_sist 26/27

1. Validar existencia dos niveis em `ni_aces_sist_perif`.
2. Popular `ct_aces_sist_perif` por politica de negocio aprovada.
3. Garantir unicidade por (`cod_pessoa`,`cod_sist`).

Criterio de sucesso:

- Percentual de usuarios vinculados com nivel definido >= meta acordada.

## Etapa D - Ativacao gradual na aplicacao

1. Introduzir feature flag no backend para enforcement por modulo.
2. Ativar primeiro em leitura/log-only (somente auditoria).
3. Ativar bloqueio real por grupos piloto.
4. Expandir para todos apos estabilidade.

Criterio de sucesso:

- Queda de acesso indevido sem aumento anormal de erro 403 legitimo.

## Etapa E - Consolidacao

1. Documentar matriz final de niveis e capacidades.
2. Remover caminhos antigos e aliases nao necessarios.
3. Encerrar pendencias de vinculacao manual.

## 6. SQL de Referencia

## 6.1 DDL da tabela de vinculo

```sql
CREATE TABLE IF NOT EXISTS principal.usuario_pessoa_vinculo (
    id bigserial PRIMARY KEY,
    usuario_id bigint NOT NULL,
    cod_pessoa integer NOT NULL,
    fonte_vinculo varchar(30) NOT NULL,
    confianca smallint NOT NULL CHECK (confianca >= 0 AND confianca <= 100),
    ativo boolean NOT NULL DEFAULT true,
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ux_usuario_pessoa_vinculo_usuario_id UNIQUE (usuario_id),
    CONSTRAINT fk_usuario_pessoa_vinculo_usuario
        FOREIGN KEY (usuario_id) REFERENCES principal.usuarios_usuario(id),
    CONSTRAINT fk_usuario_pessoa_vinculo_pessoa
        FOREIGN KEY (cod_pessoa) REFERENCES pessoal.pessoa(cod_pessoa)
);

CREATE INDEX IF NOT EXISTS ix_usuario_pessoa_vinculo_cod_pessoa_ativo
    ON principal.usuario_pessoa_vinculo (cod_pessoa, ativo);
```

## 6.2 Query de decisao de autorizacao

```sql
SELECT
    uv.usuario_id,
    uv.cod_pessoa,
    ct.cod_sist,
    ct.cod_ni,
    ni.nivel
FROM principal.usuario_pessoa_vinculo uv
JOIN principal.ct_aces_sist_perif ct
  ON ct.cod_pessoa = uv.cod_pessoa
JOIN principal.ni_aces_sist_perif ni
  ON ni.cod_sist = ct.cod_sist
 AND ni.cod_ni = ct.cod_ni
WHERE uv.usuario_id = :usuario_id
  AND uv.ativo = true
  AND ct.cod_sist = :cod_sist;
```

## 6.3 Diagnostico de cobertura por modulo

```sql
SELECT
    ct.cod_sist,
    COUNT(*) AS total_concessoes,
    COUNT(DISTINCT ct.cod_pessoa) AS pessoas_unicas
FROM principal.ct_aces_sist_perif ct
WHERE ct.cod_sist IN (26, 27)
GROUP BY ct.cod_sist
ORDER BY ct.cod_sist;
```

## 7. Riscos, Trade-offs e Mitigacao

1. Risco: vinculo incorreto usuario->pessoa conceder permissao indevida.
- Mitigacao: trilha de auditoria, confianca minima, revisao manual de casos sensiveis.

2. Risco: desempenho em alto volume de chamadas de autorizacao.
- Mitigacao: indices dedicados, query simples por chave, cache curto opcional por request.

3. Risco: divergencia entre matriz legada e regra nova por endpoint.
- Mitigacao: fase log-only comparando decisao antiga x nova antes de bloquear.

4. Risco: rollback complexo apos carga parcial.
- Mitigacao: deploy por feature flag e scripts idempotentes com reversao documentada.

## 8. Plano de Rollback

1. Desativar feature flag de enforcement e retornar ao modo atual.
2. Manter tabela de vinculo sem uso de bloqueio (nao destrutivo).
3. Reverter apenas concessoes inseridas na janela (script com carimbo de lote).
4. Preservar logs para analise da causa raiz.

## 9. Validacao Objetiva (antes/depois)

## Funcional

1. Usuario sem vinculo deve receber negacao consistente.
2. Usuario vinculado sem concessao deve receber negacao consistente.
3. Usuario vinculado com concessao valida deve acessar endpoints permitidos.

## Banco e performance

1. `EXPLAIN (ANALYZE, BUFFERS)` da query de autorizacao com alvo:
- p95 < 20 ms
- sem seq scan em tabelas de alto volume nesse caminho critico

2. Monitorar:
- taxa de 403 por rota/modulo
- latencia p95/p99 dos endpoints protegidos
- lock/wait e crescimento de I/O

## Operacional

1. Script de carga idempotente (reexecucao sem duplicidade).
2. Checklist de rollback testado em homologacao.

## 10. Entregaveis da Proxima Etapa da Refatoracao

1. Migration Django para `usuario_pessoa_vinculo`.
2. Servico de autorizacao central com testes unitarios e de integracao.
3. Feature flag por modulo (CMS e CadFuncional).
4. Script SQL de carga inicial e script SQL de rollback.
5. Documento de matriz `cod_ni -> capacidades` por endpoint.

## 11. Ordem recomendada de implementacao

1. Banco (tabela de vinculo + indices + scripts idempotentes).
2. Servico backend e testes automatizados.
3. Integracao com endpoints criticos (log-only).
4. Ativacao gradual com observabilidade.
5. Corte final de caminhos/aliases legados.

---

Status: proposta tecnica pronta para iniciar implementacao incremental na proxima etapa da refatoracao.