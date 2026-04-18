from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("reabilita", "0003_evolucao_multidisciplinar"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReabilitaAvaliacaoFisioterapiaSRED",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("fisioterapeuta_id", models.PositiveIntegerField()),
                ("gravidade_eva", models.PositiveSmallIntegerField()),
                ("limitacao_funcional", models.TextField(blank=True, default="")),
                ("sinais_vermelhos", models.TextField(blank=True, default="")),
                ("reatividade", models.CharField(max_length=20)),
                ("etiologia", models.CharField(max_length=40)),
                ("etiologia_complemento", models.CharField(blank=True, default="", max_length=255)),
                ("diagnostico_clinico", models.TextField()),
                ("inspecao_palpacao", models.TextField(blank=True, default="")),
                ("adm_ativa_graus", models.CharField(blank=True, default="", max_length=80)),
                ("adm_passiva_graus", models.CharField(blank=True, default="", max_length=80)),
                ("teste_forca", models.TextField(blank=True, default="")),
                ("testes_especificos", models.TextField(blank=True, default="")),
                ("objetivos_tratamento", models.TextField(blank=True, default="")),
                ("plano_tratamento", models.TextField(blank=True, default="")),
                ("liberado_para_pef", models.BooleanField(default=False)),
                ("liberado_para_pef_em", models.DateTimeField(blank=True, null=True)),
                ("liberado_para_pef_por", models.PositiveIntegerField(blank=True, null=True)),
                ("liberado_para_pef_por_username", models.CharField(blank=True, default="", max_length=150)),
                ("observacoes_liberacao_pef", models.TextField(blank=True, default="")),
                ("data_avaliacao", models.DateField()),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "atendimento",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="avaliacoes_sred",
                        to="reabilita.reabilitaatendimentosaude",
                    ),
                ),
            ],
            options={
                "db_table": "reabilita_avaliacao_fisioterapia_sred",
                "ordering": ["-data_avaliacao", "-id"],
            },
        ),
    ]
