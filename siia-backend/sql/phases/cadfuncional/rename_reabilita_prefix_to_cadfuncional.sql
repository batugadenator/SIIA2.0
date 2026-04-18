-- Renomeia objetos do schema cadfuncional de reabilita_* para cadfuncional_*.
-- Execute em janela de manutencao: ALTER TABLE/INDEX/SEQUENCE adquire locks exclusivos.

BEGIN;

DO $$
DECLARE
    obj RECORD;
    new_name text;
BEGIN
    -- 1) Tabelas
    FOR obj IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'cadfuncional'
          AND c.relkind = 'r'
                    AND c.relname LIKE 'reabilita_%'
        ORDER BY c.relname
    LOOP
        new_name := regexp_replace(obj.relname, '^reabilita_', 'cadfuncional_');

        IF to_regclass(format('cadfuncional.%I', new_name)) IS NULL THEN
            EXECUTE format('ALTER TABLE cadfuncional.%I RENAME TO %I', obj.relname, new_name);
        END IF;
    END LOOP;

    -- 2) Sequences
    FOR obj IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'cadfuncional'
          AND c.relkind = 'S'
                    AND c.relname LIKE 'reabilita_%'
        ORDER BY c.relname
    LOOP
        new_name := regexp_replace(obj.relname, '^reabilita_', 'cadfuncional_');

        IF to_regclass(format('cadfuncional.%I', new_name)) IS NULL THEN
            EXECUTE format('ALTER SEQUENCE cadfuncional.%I RENAME TO %I', obj.relname, new_name);
        END IF;
    END LOOP;

    -- 3) Indexes
    FOR obj IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'cadfuncional'
          AND c.relkind = 'i'
                    AND c.relname LIKE 'reabilita_%'
        ORDER BY c.relname
    LOOP
        new_name := regexp_replace(obj.relname, '^reabilita_', 'cadfuncional_');

        IF to_regclass(format('cadfuncional.%I', new_name)) IS NULL THEN
            EXECUTE format('ALTER INDEX cadfuncional.%I RENAME TO %I', obj.relname, new_name);
        END IF;
    END LOOP;

    -- 4) Constraints
    FOR obj IN
        SELECT
            tbl.relname AS table_name,
            con.conname AS constraint_name
        FROM pg_constraint con
        JOIN pg_class tbl ON tbl.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = tbl.relnamespace
        WHERE n.nspname = 'cadfuncional'
                    AND con.conname LIKE 'reabilita_%'
        ORDER BY tbl.relname, con.conname
    LOOP
        new_name := regexp_replace(obj.constraint_name, '^reabilita_', 'cadfuncional_');

        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint con2
            JOIN pg_class tbl2 ON tbl2.oid = con2.conrelid
            JOIN pg_namespace n2 ON n2.oid = tbl2.relnamespace
            WHERE n2.nspname = 'cadfuncional'
              AND tbl2.relname = obj.table_name
              AND con2.conname = new_name
        ) THEN
            EXECUTE format(
                'ALTER TABLE cadfuncional.%I RENAME CONSTRAINT %I TO %I',
                obj.table_name,
                obj.constraint_name,
                new_name
            );
        END IF;
    END LOOP;
END
$$;

COMMIT;
