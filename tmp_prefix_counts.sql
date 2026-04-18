SELECT 'cadfuncional.reabilita_' AS alvo, COUNT(*) AS quantidade
FROM information_schema.tables
WHERE table_schema='cadfuncional' AND table_type='BASE TABLE' AND left(table_name,10)='reabilita_'
UNION ALL
SELECT 'cms.cms_' AS alvo, COUNT(*) AS quantidade
FROM information_schema.tables
WHERE table_schema='cms' AND table_type='BASE TABLE' AND left(table_name,4)='cms_'
UNION ALL
SELECT 'public.reabilita_' AS alvo, COUNT(*) AS quantidade
FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE' AND left(table_name,10)='reabilita_'
UNION ALL
SELECT 'public.cms_' AS alvo, COUNT(*) AS quantidade
FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE' AND left(table_name,4)='cms_';
