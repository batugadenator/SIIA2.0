-- Pre-checagem da fase cms.

WITH target_tables(prefix, destination_schema, table_name) AS (
  VALUES
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
  SELECT t.prefix, t.destination_schema, t.table_name, c.oid AS table_oid, (c.oid IS NOT NULL) AS exists_in_public
  FROM target_tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relkind = 'r' AND c.relnamespace = 'public'::regnamespace
),
owned_sequences AS (
  SELECT r.prefix, r.destination_schema, r.table_name, nseq.nspname AS sequence_schema, seq.relname AS sequence_name
  FROM resolved r
  JOIN pg_depend d ON d.refobjid = r.table_oid AND d.deptype IN ('a', 'i')
  JOIN pg_class seq ON seq.oid = d.objid AND seq.relkind = 'S'
  JOIN pg_namespace nseq ON nseq.oid = seq.relnamespace
  WHERE r.exists_in_public
)
SELECT 'TABLES_FOUND' AS section, prefix, destination_schema, table_name, NULL::text AS detail_1, NULL::text AS detail_2, NULL::text AS detail_3 FROM resolved WHERE exists_in_public
UNION ALL
SELECT 'TABLES_MISSING' AS section, prefix, destination_schema, table_name, NULL::text, NULL::text, NULL::text FROM resolved WHERE NOT exists_in_public
UNION ALL
SELECT 'OWNED_SEQUENCES' AS section, prefix, destination_schema, table_name, sequence_schema, sequence_name, CASE WHEN sequence_schema = 'public' THEN 'will_move' ELSE 'already_outside_public' END FROM owned_sequences
ORDER BY section, table_name, detail_1, detail_2;
