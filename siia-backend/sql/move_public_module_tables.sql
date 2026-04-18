-- Migração conservadora dos módulos hoje armazenados em public.
--
-- Regras:
-- - tabelas reabilita_* -> cadfuncional
-- - tabelas cms_* -> cms
-- - sequences ownership-linked seguem a tabela quando ainda estiverem no schema origem
-- - grants são reaplicados nos schemas de destino
--
-- Observação:
-- - ALTER TABLE ... SET SCHEMA preserva constraints e FKs por OID.
-- - este script não tenta mover views, funções ou triggers auxiliares.
-- - valide em homologacao antes de executar em producao.

BEGIN;

CREATE SCHEMA IF NOT EXISTS cadfuncional;
CREATE SCHEMA IF NOT EXISTS cms;

DO $$
DECLARE
  tbl text;
  seq record;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'reabilita_atendimento_saude',
    'reabilita_avaliacao_fisioterapia_sred',
    'reabilita_evolucao_multidisciplinar',
    'reabilita_ldap_config',
    'reabilita_registro',
    'reabilita_usuario_perfil',
    'reabilita_atendimento_clinico'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND table_type = 'BASE TABLE'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA cadfuncional', tbl);

      FOR seq IN
        SELECT ns.nspname AS sequence_schema, c.relname AS sequence_name
        FROM pg_class t
        JOIN pg_depend d ON d.refobjid = t.oid
        JOIN pg_class c ON c.oid = d.objid AND c.relkind = 'S'
        JOIN pg_namespace ns ON ns.oid = c.relnamespace
        WHERE t.relkind = 'r'
          AND t.relnamespace = 'public'::regnamespace
          AND t.relname = tbl
          AND d.deptype IN ('a', 'i')
      LOOP
        IF seq.sequence_schema = 'public' THEN
          EXECUTE format('ALTER SEQUENCE public.%I SET SCHEMA cadfuncional', seq.sequence_name);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END
$$;

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
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND table_type = 'BASE TABLE'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA cms', tbl);

      FOR seq IN
        SELECT ns.nspname AS sequence_schema, c.relname AS sequence_name
        FROM pg_class t
        JOIN pg_depend d ON d.refobjid = t.oid
        JOIN pg_class c ON c.oid = d.objid AND c.relkind = 'S'
        JOIN pg_namespace ns ON ns.oid = c.relnamespace
        WHERE t.relkind = 'r'
          AND t.relnamespace = 'public'::regnamespace
          AND t.relname = tbl
          AND d.deptype IN ('a', 'i')
      LOOP
        IF seq.sequence_schema = 'public' THEN
          EXECUTE format('ALTER SEQUENCE public.%I SET SCHEMA cms', seq.sequence_name);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END
$$;

DO $$
DECLARE
  s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['cadfuncional', 'cms']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = s) THEN
      EXECUTE format('GRANT USAGE ON SCHEMA %I TO siia', s);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO siia', s);
      EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO siia', s);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO siia', s);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO siia', s);
    END IF;
  END LOOP;
END
$$;

COMMIT;

-- ======================================================================
-- ROLLBACK PLAN
-- ======================================================================
-- Execute only if you need to revert the migration.
--
-- BEGIN;
--
-- DO $$
-- DECLARE
--   tbl text;
--   seq record;
-- BEGIN
--   FOREACH tbl IN ARRAY ARRAY[
--     'reabilita_atendimento_saude',
--     'reabilita_avaliacao_fisioterapia_sred',
--     'reabilita_evolucao_multidisciplinar',
--     'reabilita_ldap_config',
--     'reabilita_registro',
--     'reabilita_usuario_perfil',
--     'reabilita_atendimento_clinico'
--   ]
--   LOOP
--     IF EXISTS (
--       SELECT 1
--       FROM information_schema.tables
--       WHERE table_schema = 'cadfuncional'
--         AND table_name = tbl
--         AND table_type = 'BASE TABLE'
--     ) THEN
--       EXECUTE format('ALTER TABLE cadfuncional.%I SET SCHEMA public', tbl);
--
--       FOR seq IN
--         SELECT ns.nspname AS sequence_schema, c.relname AS sequence_name
--         FROM pg_class t
--         JOIN pg_depend d ON d.refobjid = t.oid
--         JOIN pg_class c ON c.oid = d.objid AND c.relkind = 'S'
--         JOIN pg_namespace ns ON ns.oid = c.relnamespace
--         WHERE t.relkind = 'r'
--           AND t.relnamespace = 'cadfuncional'::regnamespace
--           AND t.relname = tbl
--           AND d.deptype IN ('a', 'i')
--       LOOP
--         IF seq.sequence_schema = 'cadfuncional' THEN
--           EXECUTE format('ALTER SEQUENCE cadfuncional.%I SET SCHEMA public', seq.sequence_name);
--         END IF;
--       END LOOP;
--     END IF;
--   END LOOP;
-- END
-- $$;
--
-- DO $$
-- DECLARE
--   tbl text;
--   seq record;
-- BEGIN
--   FOREACH tbl IN ARRAY ARRAY[
--     'cms_artigo',
--     'cms_cabecalho_historico',
--     'cms_cabecalho_link_extra',
--     'cms_cabecalho_workflow',
--     'cms_card_informativo',
--     'cms_configuracao_cabecalho',
--     'cms_configuracao_portal',
--     'cms_configuracao_visual',
--     'cms_fontawesome_icon',
--     'cms_menu',
--     'cms_noticia'
--   ]
--   LOOP
--     IF EXISTS (
--       SELECT 1
--       FROM information_schema.tables
--       WHERE table_schema = 'cms'
--         AND table_name = tbl
--         AND table_type = 'BASE TABLE'
--     ) THEN
--       EXECUTE format('ALTER TABLE cms.%I SET SCHEMA public', tbl);
--
--       FOR seq IN
--         SELECT ns.nspname AS sequence_schema, c.relname AS sequence_name
--         FROM pg_class t
--         JOIN pg_depend d ON d.refobjid = t.oid
--         JOIN pg_class c ON c.oid = d.objid AND c.relkind = 'S'
--         JOIN pg_namespace ns ON ns.oid = c.relnamespace
--         WHERE t.relkind = 'r'
--           AND t.relnamespace = 'cms'::regnamespace
--           AND t.relname = tbl
--           AND d.deptype IN ('a', 'i')
--       LOOP
--         IF seq.sequence_schema = 'cms' THEN
--           EXECUTE format('ALTER SEQUENCE cms.%I SET SCHEMA public', seq.sequence_name);
--         END IF;
--       END LOOP;
--     END IF;
--   END LOOP;
-- END
-- $$;
--
-- DO $$
-- DECLARE
--   s text;
-- BEGIN
--   FOREACH s IN ARRAY ARRAY['cadfuncional', 'cms']
--   LOOP
--     IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = s) THEN
--       EXECUTE format('REVOKE USAGE ON SCHEMA %I FROM siia', s);
--       EXECUTE format('REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I FROM siia', s);
--       EXECUTE format('REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I FROM siia', s);
--     END IF;
--   END LOOP;
-- END
-- $$;
--
-- COMMIT;
