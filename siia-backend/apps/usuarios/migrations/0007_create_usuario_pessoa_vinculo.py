from django.db import migrations


CREATE_SQL = """
CREATE SCHEMA IF NOT EXISTS principal;

CREATE TABLE IF NOT EXISTS principal.usuario_pessoa_vinculo (
    id bigserial PRIMARY KEY,
    usuario_id bigint NOT NULL,
    cod_pessoa integer NOT NULL,
    fonte_vinculo varchar(30) NOT NULL,
    confianca smallint NOT NULL CHECK (confianca >= 0 AND confianca <= 100),
    ativo boolean NOT NULL DEFAULT true,
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ux_usuario_pessoa_vinculo_usuario_id UNIQUE (usuario_id),
    CONSTRAINT fk_usuario_pessoa_vinculo_usuario
        FOREIGN KEY (usuario_id) REFERENCES principal.usuarios_usuario(id),
    CONSTRAINT fk_usuario_pessoa_vinculo_pessoa
        FOREIGN KEY (cod_pessoa) REFERENCES pessoal.pessoa(cod_pessoa)
);

CREATE INDEX IF NOT EXISTS ix_usuario_pessoa_vinculo_cod_pessoa_ativo
    ON principal.usuario_pessoa_vinculo (cod_pessoa, ativo);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE principal.usuario_pessoa_vinculo TO siia;
GRANT USAGE, SELECT ON SEQUENCE principal.usuario_pessoa_vinculo_id_seq TO siia;
"""


DROP_SQL = """
DROP TABLE IF EXISTS principal.usuario_pessoa_vinculo;
"""


class Migration(migrations.Migration):

    dependencies = [
        ("usuarios", "0006_rename_reabilita_launchpad_to_cadfuncional"),
    ]

    operations = [
        migrations.RunSQL(
            sql=CREATE_SQL,
            reverse_sql=DROP_SQL,
        ),
    ]
