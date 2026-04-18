-- Orquestrador unico da migracao por fases.
--
-- Ordem recomendada:
-- 1) principal
-- 2) cadfuncional
-- 3) cms
--
-- Execucao sugerida em psql:
--   psql -h localhost -U siia -d siia -v ON_ERROR_STOP=1 -f sql/orchestrator.sql

\echo '== PRECHECK PRINCIPAL =='
\i phases/principal/precheck.sql

\echo '== MIGRATE PRINCIPAL =='
\i phases/principal/migrate.sql

\echo '== PRECHECK CADFUNCIONAL =='
\i phases/cadfuncional/precheck.sql

\echo '== MIGRATE CADFUNCIONAL =='
\i phases/cadfuncional/migrate.sql

\echo '== PRECHECK CMS =='
\i phases/cms/precheck.sql

\echo '== MIGRATE CMS =='
\i phases/cms/migrate.sql

\echo '== FASES CONCLUIDAS =='
