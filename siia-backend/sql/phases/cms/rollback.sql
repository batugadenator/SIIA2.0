-- Rollback da fase cms.

BEGIN;

DO $$
DECLARE
  tbl text;
  seq record;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'cms_artigo',
    'cms_cabecalho_historico',
    'cms_cabecalho_link_extra',
    'cms_cabecalho_workflow',
    'cms_card_informativo',
    'cms_configuracao_cabecalho',
    'cms_configuracao_portal',
    'cms_configuracao_visual',
    'cms_fontawesome_icon',
    'cms_menu',
    'cms_noticia'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cms' AND table_name = tbl AND table_type = 'BASE TABLE') THEN
      EXECUTE format('ALTER TABLE cms.%I SET SCHEMA public', tbl);
      FOR seq IN
        SELECT ns.nspname AS sequence_schema, c.relname AS sequence_name
        FROM pg_class t
        JOIN pg_depend d ON d.refobjid = t.oid
        JOIN pg_class c ON c.oid = d.objid AND c.relkind = 'S'
        JOIN pg_namespace ns ON ns.oid = c.relnamespace
        WHERE t.relkind = 'r' AND t.relnamespace = 'public'::regnamespace AND t.relname = tbl AND d.deptype IN ('a', 'i')
      LOOP
        IF seq.sequence_schema = 'cms' THEN
          EXECUTE format('ALTER SEQUENCE cms.%I SET SCHEMA public', seq.sequence_name);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END
$$;

COMMIT;
