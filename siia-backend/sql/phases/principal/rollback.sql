-- Rollback da fase principal.

BEGIN;

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
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'principal' AND table_name = tbl AND table_type = 'BASE TABLE'
    ) THEN
      EXECUTE format('ALTER TABLE principal.%I SET SCHEMA public', tbl);
      FOR seq IN
        SELECT ns.nspname AS sequence_schema, c.relname AS sequence_name
        FROM pg_class t
        JOIN pg_depend d ON d.refobjid = t.oid
        JOIN pg_class c ON c.oid = d.objid AND c.relkind = 'S'
        JOIN pg_namespace ns ON ns.oid = c.relnamespace
        WHERE t.relkind = 'r' AND t.relnamespace = 'public'::regnamespace AND t.relname = tbl AND d.deptype IN ('a', 'i')
      LOOP
        IF seq.sequence_schema = 'principal' THEN
          EXECUTE format('ALTER SEQUENCE principal.%I SET SCHEMA public', seq.sequence_name);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END
$$;

DROP VIEW IF EXISTS public.usuarios_launchpadaplicativo;
DROP VIEW IF EXISTS public.usuarios_logsacesso;
DROP VIEW IF EXISTS public.usuarios_usuario_user_permissions;
DROP VIEW IF EXISTS public.usuarios_usuario_groups;
DROP VIEW IF EXISTS public.usuarios_usuario;
DROP VIEW IF EXISTS public.django_session;
DROP VIEW IF EXISTS public.django_migrations;
DROP VIEW IF EXISTS public.django_content_type;
DROP VIEW IF EXISTS public.django_admin_log;
DROP VIEW IF EXISTS public.authtoken_token;
DROP VIEW IF EXISTS public.auth_permission;
DROP VIEW IF EXISTS public.auth_group_permissions;
DROP VIEW IF EXISTS public.auth_group;

COMMIT;
