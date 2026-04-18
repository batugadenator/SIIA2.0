-- Pré-checagem da migração de tabelas public.reabilita_* e public.cms_*.
--
-- Este script NÃO altera dados/objetos.
-- Ele lista:
-- 1) tabelas alvo encontradas em public
-- 2) tabelas alvo ausentes
-- 3) sequences ownership-linked que serão movidas junto
-- 4) FKs de saída/entrada para avaliar impacto

WITH target_tables(prefix, destination_schema, table_name) AS (
  VALUES
    ('reabilita', 'cadfuncional', 'reabilita_atendimento_saude'),
    ('reabilita', 'cadfuncional', 'reabilita_avaliacao_fisioterapia_sred'),
    ('reabilita', 'cadfuncional', 'reabilita_evolucao_multidisciplinar'),
    ('reabilita', 'cadfuncional', 'reabilita_ldap_config'),
    ('reabilita', 'cadfuncional', 'reabilita_registro'),
    ('reabilita', 'cadfuncional', 'reabilita_usuario_perfil'),
    ('reabilita', 'cadfuncional', 'reabilita_atendimento_clinico'),
    ('cms', 'cms', 'cms_artigo'),
    ('cms', 'cms', 'cms_cabecalho_historico'),
    ('cms', 'cms', 'cms_cabecalho_link_extra'),
    ('cms', 'cms', 'cms_cabecalho_workflow'),
    ('cms', 'cms', 'cms_card_informativo'),
    ('cms', 'cms', 'cms_configuracao_cabecalho'),
    ('cms', 'cms', 'cms_configuracao_portal'),
    ('cms', 'cms', 'cms_configuracao_visual'),
    ('cms', 'cms', 'cms_fontawesome_icon'),
    ('cms', 'cms', 'cms_menu'),
    ('cms', 'cms', 'cms_noticia')
),
resolved AS (
  SELECT
    t.prefix,
    t.destination_schema,
    t.table_name,
    c.oid AS table_oid,
    (c.oid IS NOT NULL) AS exists_in_public
  FROM target_tables t
  LEFT JOIN pg_class c
    ON c.relname = t.table_name
   AND c.relkind = 'r'
   AND c.relnamespace = 'public'::regnamespace
),
owned_sequences AS (
  SELECT
    r.prefix,
    r.destination_schema,
    r.table_name,
    nseq.nspname AS sequence_schema,
    seq.relname AS sequence_name
  FROM resolved r
  JOIN pg_depend d
    ON d.refobjid = r.table_oid
   AND d.deptype IN ('a', 'i')
  JOIN pg_class seq
    ON seq.oid = d.objid
   AND seq.relkind = 'S'
  JOIN pg_namespace nseq
    ON nseq.oid = seq.relnamespace
  WHERE r.exists_in_public
),
fk_out AS (
  SELECT
    r.prefix,
    r.destination_schema,
    r.table_name,
    con.conname,
    nsrc.nspname AS source_schema,
    src.relname AS source_table,
    ntgt.nspname AS target_schema,
    tgt.relname AS target_table
  FROM resolved r
  JOIN pg_constraint con
    ON con.conrelid = r.table_oid
   AND con.contype = 'f'
  JOIN pg_class src
    ON src.oid = con.conrelid
  JOIN pg_namespace nsrc
    ON nsrc.oid = src.relnamespace
  JOIN pg_class tgt
    ON tgt.oid = con.confrelid
  JOIN pg_namespace ntgt
    ON ntgt.oid = tgt.relnamespace
  WHERE r.exists_in_public
),
fk_in AS (
  SELECT
    r.prefix,
    r.destination_schema,
    r.table_name,
    con.conname,
    nsrc.nspname AS source_schema,
    src.relname AS source_table,
    ntgt.nspname AS target_schema,
    tgt.relname AS target_table
  FROM resolved r
  JOIN pg_constraint con
    ON con.confrelid = r.table_oid
   AND con.contype = 'f'
  JOIN pg_class src
    ON src.oid = con.conrelid
  JOIN pg_namespace nsrc
    ON nsrc.oid = src.relnamespace
  JOIN pg_class tgt
    ON tgt.oid = con.confrelid
  JOIN pg_namespace ntgt
    ON ntgt.oid = tgt.relnamespace
  WHERE r.exists_in_public
)
SELECT
  'TABLES_FOUND' AS section,
  prefix,
  destination_schema,
  table_name,
  NULL::text AS detail_1,
  NULL::text AS detail_2,
  NULL::text AS detail_3
FROM resolved
WHERE exists_in_public

UNION ALL

SELECT
  'TABLES_MISSING' AS section,
  prefix,
  destination_schema,
  table_name,
  NULL::text AS detail_1,
  NULL::text AS detail_2,
  NULL::text AS detail_3
FROM resolved
WHERE NOT exists_in_public

UNION ALL

SELECT
  'OWNED_SEQUENCES' AS section,
  prefix,
  destination_schema,
  table_name,
  sequence_schema AS detail_1,
  sequence_name AS detail_2,
  CASE WHEN sequence_schema = 'public' THEN 'will_move' ELSE 'already_outside_public' END AS detail_3
FROM owned_sequences

UNION ALL

SELECT
  'FK_OUT' AS section,
  prefix,
  destination_schema,
  table_name,
  conname AS detail_1,
  source_schema || '.' || source_table AS detail_2,
  target_schema || '.' || target_table AS detail_3
FROM fk_out

UNION ALL

SELECT
  'FK_IN' AS section,
  prefix,
  destination_schema,
  table_name,
  conname AS detail_1,
  source_schema || '.' || source_table AS detail_2,
  target_schema || '.' || target_table AS detail_3
FROM fk_in

ORDER BY section, prefix, table_name, detail_1, detail_2;
