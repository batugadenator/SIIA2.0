-- Rollback da fase cadfuncional.

BEGIN;

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
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cadfuncional' AND table_name = tbl AND table_type = 'BASE TABLE') THEN
      EXECUTE format('ALTER TABLE cadfuncional.%I SET SCHEMA public', tbl);
    END IF;
  END LOOP;
END
$$;

COMMIT;
