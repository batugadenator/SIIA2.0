-- Fase cadfuncional: garantir objetos cadfuncional_* no schema cadfuncional.

BEGIN;

CREATE SCHEMA IF NOT EXISTS cadfuncional;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'cadfuncional_atendimento_saude',
    'cadfuncional_avaliacao_fisioterapia_sred',
    'cadfuncional_evolucao_multidisciplinar',
    'cadfuncional_ldap_config',
    'cadfuncional_registro',
    'cadfuncional_usuario_perfil',
    'cadfuncional_atendimento_clinico'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl AND table_type = 'BASE TABLE') THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA cadfuncional', tbl);
    END IF;
  END LOOP;
END
$$;

DO $$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['cadfuncional'] LOOP
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
