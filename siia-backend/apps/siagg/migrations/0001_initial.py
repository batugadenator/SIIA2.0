from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunSQL("CREATE SCHEMA IF NOT EXISTS siagg;", reverse_sql=migrations.RunSQL.noop),
        migrations.CreateModel(
            name="SiaggArea",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=100)),
                ("slug", models.SlugField(max_length=120, unique=True)),
                ("descricao", models.TextField(blank=True)),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": '"siagg"."area"',
                "ordering": ["nome"],
            },
        ),
        migrations.CreateModel(
            name="SiaggGovernanceDocument",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("descricao", models.TextField(blank=True)),
                ("categoria", models.CharField(max_length=80)),
                ("arquivo", models.FileField(upload_to="siagg/governanca/%Y/%m/%d/")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "enviado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="siagg_governance_documents",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": '"siagg"."governance_document"',
                "ordering": ["-criado_em", "-id"],
            },
        ),
        migrations.CreateModel(
            name="SiaggReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("descricao", models.TextField(blank=True)),
                ("data_referencia", models.DateField()),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                (
                    "area",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="relatorios",
                        to="siagg.siaggarea",
                    ),
                ),
                (
                    "autor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="siagg_reports",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": '"siagg"."report"',
                "ordering": ["-data_referencia", "-id"],
            },
        ),
        migrations.CreateModel(
            name="SiaggDataEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("valor", models.DecimalField(decimal_places=2, max_digits=15)),
                ("data_referencia", models.DateField()),
                ("observacao", models.TextField(blank=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                (
                    "area",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="indicadores",
                        to="siagg.siaggarea",
                    ),
                ),
                (
                    "operador",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="siagg_data_entries",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": '"siagg"."data_entry"',
                "ordering": ["-data_referencia", "-id"],
            },
        ),
        migrations.CreateModel(
            name="SiaggReportFile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("arquivo", models.FileField(upload_to="siagg/reports/%Y/%m/%d/")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "enviado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="siagg_report_files",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "report",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="arquivos",
                        to="siagg.siaggreport",
                    ),
                ),
            ],
            options={
                "db_table": '"siagg"."report_file"',
                "ordering": ["-criado_em", "-id"],
            },
        ),
        migrations.AddIndex(
            model_name="siaggdataentry",
            index=models.Index(fields=["area", "data_referencia"], name="siagg_data_area_data_idx"),
        ),
        migrations.AddIndex(
            model_name="siaggreport",
            index=models.Index(fields=["area", "data_referencia"], name="siagg_report_area_data_idx"),
        ),
        migrations.AddIndex(
            model_name="siagggovernancedocument",
            index=models.Index(fields=["criado_em"], name="siagg_gov_doc_criado_idx"),
        ),
    ]
