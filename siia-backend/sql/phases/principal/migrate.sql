-- Fase principal: mover autenticacao, usuarios e catalogo de aplicativos para principal.
--
-- Legado temporario em public:
-- - views de compatibilidade apontando para principal para evitar quebra imediata.

BEGIN;

CREATE SCHEMA IF NOT EXISTS principal;

DO $$
DECLARE
  tbl text;
  seq record;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'auth_group',
    'auth_group_permissions',
    'auth_permission',
    'authtoken_token',
    'django_admin_log',
    'django_content_type',
    'django_migrations',
    'django_session',
    'usuarios_launchpadaplicativo',
    'usuarios_logsacesso',
    'usuarios_usuario',
    'usuarios_usuario_groups',
    'usuarios_usuario_user_permissions'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND table_type = 'BASE TABLE'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA principal', tbl);

      FOR seq IN
        SELECT ns.nspname AS sequence_schema, c.relname AS sequence_name
        FROM pg_class t
        JOIN pg_depend d ON d.refobjid = t.oid
        JOIN pg_class c ON c.oid = d.objid AND c.relkind = 'S'
        JOIN pg_namespace ns ON ns.oid = c.relnamespace
        WHERE t.relkind = 'r'
          AND t.relnamespace = 'principal'::regnamespace
          AND t.relname = tbl
          AND d.deptype IN ('a', 'i')
      LOOP
        IF seq.sequence_schema = 'public' THEN
          EXECUTE format('ALTER SEQUENCE public.%I SET SCHEMA principal', seq.sequence_name);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'principal') THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.auth_group AS SELECT * FROM principal.auth_group';
    EXECUTE 'CREATE OR REPLACE VIEW public.auth_group_permissions AS SELECT * FROM principal.auth_group_permissions';
    EXECUTE 'CREATE OR REPLACE VIEW public.auth_permission AS SELECT * FROM principal.auth_permission';
    EXECUTE 'CREATE OR REPLACE VIEW public.authtoken_token AS SELECT * FROM principal.authtoken_token';
    EXECUTE 'CREATE OR REPLACE VIEW public.django_admin_log AS SELECT * FROM principal.django_admin_log';
    EXECUTE 'CREATE OR REPLACE VIEW public.django_content_type AS SELECT * FROM principal.django_content_type';
    EXECUTE 'CREATE OR REPLACE VIEW public.django_migrations AS SELECT * FROM principal.django_migrations';
    EXECUTE 'CREATE OR REPLACE VIEW public.django_session AS SELECT * FROM principal.django_session';
    EXECUTE 'CREATE OR REPLACE VIEW public.usuarios_usuario AS SELECT * FROM principal.usuarios_usuario';
    EXECUTE 'CREATE OR REPLACE VIEW public.usuarios_usuario_groups AS SELECT * FROM principal.usuarios_usuario_groups';
    EXECUTE 'CREATE OR REPLACE VIEW public.usuarios_usuario_user_permissions AS SELECT * FROM principal.usuarios_usuario_user_permissions';
    EXECUTE 'CREATE OR REPLACE VIEW public.usuarios_logsacesso AS SELECT * FROM principal.usuarios_logsacesso';
    EXECUTE 'CREATE OR REPLACE VIEW public.usuarios_launchpadaplicativo AS SELECT * FROM principal.usuarios_launchpadaplicativo';
  END IF;
END
$$;

DO $$
DECLARE
  s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['principal']
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
