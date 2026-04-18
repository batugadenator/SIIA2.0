-- Rollback da carga inicial principal.usuario_pessoa_vinculo.
-- Remove somente vinculos inseridos pela rotina carga_v1.

BEGIN;

DELETE FROM principal.usuario_pessoa_vinculo
WHERE fonte_vinculo = 'carga_v1';

COMMIT;
