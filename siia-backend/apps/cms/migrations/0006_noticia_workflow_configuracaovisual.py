"""
Migration 0006 – Workflow de publicação em Noticia + novo modelo ConfiguracaoVisual

Alterações em Noticia:
  - Adiciona campo status (rascunho / pendente / publicado)
  - Migra registros existentes para status='publicado' (dado que já eram visíveis)
  - Adiciona FKs autor e homologado_por (nullable para registros pré-existentes)
  - Adiciona homologado_em (nullable)
  - Adiciona permissão customizada can_authorize_noticia

Novo modelo:
  - ConfiguracaoVisual (chave, valor_svg, descricao)
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def marcar_existentes_como_publicados(apps, schema_editor):
    Noticia = apps.get_model("cms", "Noticia")
    Noticia.objects.all().update(status="publicado")


class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0005_cardinformativo_icone_url"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Adiciona status com default rascunho
        migrations.AddField(
            model_name="noticia",
            name="status",
            field=models.CharField(
                choices=[
                    ("rascunho", "Rascunho"),
                    ("pendente", "Pendente de Homologação"),
                    ("publicado", "Publicado"),
                ],
                default="rascunho",
                max_length=20,
            ),
        ),
        # 2. Marca registros existentes como publicado
        migrations.RunPython(marcar_existentes_como_publicados, migrations.RunPython.noop),
        # 3. FK autor (nullable para compatibilidade com registros sem autor)
        migrations.AddField(
            model_name="noticia",
            name="autor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="noticias_criadas",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # 4. FK homologado_por
        migrations.AddField(
            model_name="noticia",
            name="homologado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="noticias_homologadas",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # 5. Campo homologado_em
        migrations.AddField(
            model_name="noticia",
            name="homologado_em",
            field=models.DateTimeField(blank=True, null=True),
        ),
        # 6. Atualiza Meta com a permissão customizada
        migrations.AlterModelOptions(
            name="noticia",
            options={
                "ordering": ["-data_publicacao"],
                "permissions": [("can_authorize_noticia", "Pode autorizar publicações")],
            },
        ),
        # 7. Cria ConfiguracaoVisual
        migrations.CreateModel(
            name="ConfiguracaoVisual",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("chave", models.SlugField(help_text="Ex: 'icone-central-noticias'", unique=True)),
                (
                    "valor_svg",
                    models.TextField(help_text="Código XML do ícone SVG ou URL do SVG no Nextcloud"),
                ),
                ("descricao", models.CharField(max_length=200)),
            ],
            options={
                "verbose_name": "Configuração Visual",
                "verbose_name_plural": "Configurações Visuais",
                "db_table": "cms_configuracao_visual",
            },
        ),
    ]
