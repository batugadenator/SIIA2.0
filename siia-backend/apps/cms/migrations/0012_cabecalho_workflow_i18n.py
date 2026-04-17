from django.conf import settings
from django.db import migrations, models


def seed_workflow_from_published(apps, schema_editor):
    ConfiguracaoCabecalho = apps.get_model("cms", "ConfiguracaoCabecalho")
    CabecalhoWorkflow = apps.get_model("cms", "CabecalhoWorkflow")

    config = ConfiguracaoCabecalho.objects.filter(ativo=True).first()
    if not config:
        return

    payload = {
        "nome_instituicao": config.nome_instituicao,
        "nome_instituicao_en": getattr(config, "nome_instituicao_en", "Ministry of Defense"),
        "nome_orgao": config.nome_orgao,
        "nome_orgao_en": getattr(config, "nome_orgao_en", "Brazilian Army"),
        "slogan": config.slogan,
        "slogan_en": getattr(config, "slogan_en", "Strong Arm - Friendly Hand"),
        "logo_url": config.logo_url,
        "link_logo_url": config.link_logo_url,
        "idioma_padrao": getattr(config, "idioma_padrao", "pt-br"),
        "links_fixos": {
            "inicio": {
                "titulo": config.link_inicio_titulo,
                "titulo_en": getattr(config, "link_inicio_titulo_en", "Home"),
                "url": config.link_inicio_url,
                "abrir_em_nova_aba": config.link_inicio_nova_aba,
            },
            "servicos": {
                "titulo": config.link_servicos_titulo,
                "titulo_en": getattr(config, "link_servicos_titulo_en", "Services"),
                "url": config.link_servicos_url,
                "abrir_em_nova_aba": config.link_servicos_nova_aba,
            },
            "contato": {
                "titulo": config.link_contato_titulo,
                "titulo_en": getattr(config, "link_contato_titulo_en", "Contact"),
                "url": config.link_contato_url,
                "abrir_em_nova_aba": config.link_contato_nova_aba,
            },
            "estrutura": {
                "titulo": config.link_estrutura_titulo,
                "titulo_en": getattr(config, "link_estrutura_titulo_en", "Organizational Structure"),
                "url": config.link_estrutura_url,
                "abrir_em_nova_aba": config.link_estrutura_nova_aba,
            },
        },
        "links_extras": [
            {
                "titulo": item.titulo,
                "link_url": item.link_url,
                "ordem": item.ordem,
                "abrir_em_nova_aba": item.abrir_em_nova_aba,
                "ativo": item.ativo,
            }
            for item in config.links_extras.order_by("ordem", "id")
        ],
    }

    CabecalhoWorkflow.objects.get_or_create(
        pk=1,
        defaults={
            "payload": payload,
            "status": "publicado",
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ("cms", "0011_configuracao_cabecalho"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="configuracaocabecalho",
            name="idioma_padrao",
            field=models.CharField(
                choices=[("pt-br", "Português (Brasil)"), ("en", "English")],
                default="pt-br",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="configuracaocabecalho",
            name="link_contato_titulo_en",
            field=models.CharField(blank=True, default="Contact", max_length=80),
        ),
        migrations.AddField(
            model_name="configuracaocabecalho",
            name="link_estrutura_titulo_en",
            field=models.CharField(blank=True, default="Organizational Structure", max_length=80),
        ),
        migrations.AddField(
            model_name="configuracaocabecalho",
            name="link_inicio_titulo_en",
            field=models.CharField(blank=True, default="Home", max_length=80),
        ),
        migrations.AddField(
            model_name="configuracaocabecalho",
            name="link_servicos_titulo_en",
            field=models.CharField(blank=True, default="Services", max_length=80),
        ),
        migrations.AddField(
            model_name="configuracaocabecalho",
            name="nome_instituicao_en",
            field=models.CharField(blank=True, default="Ministry of Defense", max_length=120),
        ),
        migrations.AddField(
            model_name="configuracaocabecalho",
            name="nome_orgao_en",
            field=models.CharField(blank=True, default="Brazilian Army", max_length=120),
        ),
        migrations.AddField(
            model_name="configuracaocabecalho",
            name="slogan_en",
            field=models.CharField(blank=True, default="Strong Arm - Friendly Hand", max_length=160),
        ),
        migrations.CreateModel(
            name="CabecalhoWorkflow",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("payload", models.JSONField(default=dict)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("rascunho", "Rascunho"),
                            ("pendente", "Pendente de Homologação"),
                            ("publicado", "Publicado"),
                        ],
                        default="rascunho",
                        max_length=20,
                    ),
                ),
                ("submetido_em", models.DateTimeField(blank=True, null=True)),
                ("homologado_em", models.DateTimeField(blank=True, null=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                (
                    "autor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="cabecalho_workflows_criados",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "homologado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="cabecalho_workflows_homologados",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "cms_cabecalho_workflow",
            },
        ),
        migrations.CreateModel(
            name="CabecalhoHistorico",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "acao",
                    models.CharField(
                        choices=[
                            ("rascunho", "Rascunho salvo"),
                            ("submetido", "Submetido para homologação"),
                            ("publicado", "Publicado"),
                        ],
                        max_length=20,
                    ),
                ),
                ("before_payload", models.JSONField(default=dict)),
                ("after_payload", models.JSONField(default=dict)),
                ("diff_text", models.TextField(blank=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="cabecalho_historicos",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "cms_cabecalho_historico",
                "ordering": ["-criado_em", "-id"],
            },
        ),
        migrations.RunPython(seed_workflow_from_published, migrations.RunPython.noop),
    ]
