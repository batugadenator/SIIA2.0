from django.db import migrations, models


def seed_default_header(apps, schema_editor):
    ConfiguracaoCabecalho = apps.get_model("cms", "ConfiguracaoCabecalho")
    ConfiguracaoCabecalho.objects.get_or_create(
        pk=1,
        defaults={
            "nome_instituicao": "Ministerio da Defesa",
            "nome_orgao": "Exercito Brasileiro",
            "slogan": "Braco Forte - Mao Amiga",
            "logo_url": "",
            "link_logo_url": "/",
            "link_inicio_titulo": "Inicio",
            "link_inicio_url": "/",
            "link_inicio_nova_aba": False,
            "link_servicos_titulo": "Servicos",
            "link_servicos_url": "/servicos",
            "link_servicos_nova_aba": False,
            "link_contato_titulo": "Contato",
            "link_contato_url": "/contato",
            "link_contato_nova_aba": False,
            "link_estrutura_titulo": "Estrutura Organizacional",
            "link_estrutura_url": "/estrutura-organizacional",
            "link_estrutura_nova_aba": False,
            "ativo": True,
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ("cms", "0010_fontawesomeicon_aman_curadoria"),
    ]

    operations = [
        migrations.CreateModel(
            name="ConfiguracaoCabecalho",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome_instituicao", models.CharField(default="Ministerio da Defesa", max_length=120)),
                ("nome_orgao", models.CharField(default="Exercito Brasileiro", max_length=120)),
                ("slogan", models.CharField(default="Braco Forte - Mao Amiga", max_length=160)),
                ("logo_url", models.URLField(blank=True)),
                ("link_logo_url", models.CharField(default="/", max_length=300)),
                ("link_inicio_titulo", models.CharField(default="Inicio", max_length=80)),
                ("link_inicio_url", models.CharField(default="/", max_length=300)),
                ("link_inicio_nova_aba", models.BooleanField(default=False)),
                ("link_servicos_titulo", models.CharField(default="Servicos", max_length=80)),
                ("link_servicos_url", models.CharField(default="/servicos", max_length=300)),
                ("link_servicos_nova_aba", models.BooleanField(default=False)),
                ("link_contato_titulo", models.CharField(default="Contato", max_length=80)),
                ("link_contato_url", models.CharField(default="/contato", max_length=300)),
                ("link_contato_nova_aba", models.BooleanField(default=False)),
                (
                    "link_estrutura_titulo",
                    models.CharField(default="Estrutura Organizacional", max_length=80),
                ),
                (
                    "link_estrutura_url",
                    models.CharField(default="/estrutura-organizacional", max_length=300),
                ),
                ("link_estrutura_nova_aba", models.BooleanField(default=False)),
                ("ativo", models.BooleanField(default=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "cms_configuracao_cabecalho",
            },
        ),
        migrations.CreateModel(
            name="CabecalhoLinkExtra",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=80)),
                ("link_url", models.CharField(max_length=300)),
                ("ordem", models.PositiveIntegerField(default=0)),
                ("abrir_em_nova_aba", models.BooleanField(default=False)),
                ("ativo", models.BooleanField(default=True)),
                (
                    "configuracao",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="links_extras",
                        to="cms.configuracaocabecalho",
                    ),
                ),
            ],
            options={
                "db_table": "cms_cabecalho_link_extra",
                "ordering": ["ordem", "id"],
            },
        ),
        migrations.RunPython(seed_default_header, migrations.RunPython.noop),
    ]
