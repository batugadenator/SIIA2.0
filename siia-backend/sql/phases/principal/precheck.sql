-- Pre-checagem da fase principal.
-- Objetivo: identificar objetos de autenticacao, usuarios e catalogo de aplicativos
-- ainda presentes em public, e validar se principal ja possui o schema-alvo.

WITH target_tables(prefix, destination_schema, table_name) AS (
  VALUES
    ('principal', 'principal', 'auth_group'),
    ('principal', 'principal', 'auth_group_permissions'),
    ('principal', 'principal', 'auth_permission'),
    ('principal', 'principal', 'authtoken_token'),
    ('principal', 'principal', 'django_admin_log'),
    ('principal', 'principal', 'django_content_type'),
    ('principal', 'principal', 'django_migrations'),
    ('principal', 'principal', 'django_session'),
    ('principal', 'principal', 'usuarios_launchpadaplicativo'),
    ('principal', 'principal', 'usuarios_logsacesso'),
    ('principal', 'principal', 'usuarios_usuario'),
    ('principal', 'principal', 'usuarios_usuario_groups'),
    ('principal', 'principal', 'usuarios_usuario_user_permissions')
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
    r.table_name,
    con.conname,
    nsrc.nspname AS source_schema,
    src.relname AS source_table,
    ntgt.nspname AS target_schema,
    tgt.relname AS target_table
  FROM resolved r
  JOIN pg_constraint con ON con.conrelid = r.table_oid AND con.contype = 'f'
  JOIN pg_class src ON src.oid = con.conrelid
  JOIN pg_namespace nsrc ON nsrc.oid = src.relnamespace
  JOIN pg_class tgt ON tgt.oid = con.confrelid
  JOIN pg_namespace ntgt ON ntgt.oid = tgt.relnamespace
  WHERE r.exists_in_public
)
SELECT 'TABLES_FOUND' AS section, prefix, destination_schema, table_name, NULL::text AS detail_1, NULL::text AS detail_2, NULL::text AS detail_3
FROM resolved WHERE exists_in_public
UNION ALL
SELECT 'TABLES_MISSING' AS section, prefix, destination_schema, table_name, NULL::text, NULL::text, NULL::text
FROM resolved WHERE NOT exists_in_public
UNION ALL
SELECT 'OWNED_SEQUENCES' AS section, prefix, destination_schema, table_name, sequence_schema, sequence_name, CASE WHEN sequence_schema = 'public' THEN 'will_move' ELSE 'already_outside_public' END
FROM owned_sequences
UNION ALL
SELECT 'FK_OUT' AS section, 'principal' AS prefix, 'principal' AS destination_schema, table_name, conname, source_schema || '.' || source_table, target_schema || '.' || target_table
FROM fk_out
ORDER BY section, table_name, detail_1, detail_2;
