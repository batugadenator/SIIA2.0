-- Carga idempotente inicial para principal.usuario_pessoa_vinculo.
-- Regra aplicada: usuarios_usuario.username == pessoal.pessoa.login (normalizado).
-- Fonte marcada como carga_v1 para permitir rollback seletivo.

BEGIN;

INSERT INTO principal.usuario_pessoa_vinculo (
    usuario_id,
    cod_pessoa,
    fonte_vinculo,
    confianca,
    ativo
)
SELECT
    u.id AS usuario_id,
    p.cod_pessoa,
    'carga_v1' AS fonte_vinculo,
    90 AS confianca,
    TRUE AS ativo
FROM principal.usuarios_usuario u
JOIN pessoal.pessoa p
  ON lower(btrim(u.username)) = lower(btrim(p.login))
LEFT JOIN principal.usuario_pessoa_vinculo uv
  ON uv.usuario_id = u.id
WHERE uv.id IS NULL
  AND coalesce(btrim(u.username), '') <> ''
  AND coalesce(btrim(p.login), '') <> '';

COMMIT;
