-- Pre-checagem da fase cadfuncional.

WITH target_tables(prefix, destination_schema, table_name) AS (
  VALUES
    ('cadfuncional', 'cadfuncional', 'cadfuncional_atendimento_saude'),
    ('cadfuncional', 'cadfuncional', 'cadfuncional_avaliacao_fisioterapia_sred'),
    ('cadfuncional', 'cadfuncional', 'cadfuncional_evolucao_multidisciplinar'),
    ('cadfuncional', 'cadfuncional', 'cadfuncional_ldap_config'),
    ('cadfuncional', 'cadfuncional', 'cadfuncional_registro'),
    ('cadfuncional', 'cadfuncional', 'cadfuncional_usuario_perfil'),
    ('cadfuncional', 'cadfuncional', 'cadfuncional_atendimento_clinico')
),
resolved AS (
  SELECT t.prefix, t.destination_schema, t.table_name, c.oid AS table_oid, (c.oid IS NOT NULL) AS exists_in_cadfuncional
  FROM target_tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relkind = 'r' AND c.relnamespace = 'cadfuncional'::regnamespace
),
owned_sequences AS (
  SELECT r.prefix, r.destination_schema, r.table_name, nseq.nspname AS sequence_schema, seq.relname AS sequence_name
  FROM resolved r
  JOIN pg_depend d ON d.refobjid = r.table_oid AND d.deptype IN ('a', 'i')
  JOIN pg_class seq ON seq.oid = d.objid AND seq.relkind = 'S'
  JOIN pg_namespace nseq ON nseq.oid = seq.relnamespace
  WHERE r.exists_in_cadfuncional
)
SELECT 'TABLES_FOUND' AS section, prefix, destination_schema, table_name, NULL::text AS detail_1, NULL::text AS detail_2, NULL::text AS detail_3 FROM resolved WHERE exists_in_cadfuncional
UNION ALL
SELECT 'TABLES_MISSING' AS section, prefix, destination_schema, table_name, NULL::text, NULL::text, NULL::text FROM resolved WHERE NOT exists_in_cadfuncional
UNION ALL
SELECT 'OWNED_SEQUENCES' AS section, prefix, destination_schema, table_name, sequence_schema, sequence_name, CASE WHEN sequence_schema = 'cadfuncional' THEN 'ok_in_schema' ELSE 'outside_schema' END FROM owned_sequences
ORDER BY section, table_name, detail_1, detail_2;
