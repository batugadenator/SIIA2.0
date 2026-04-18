from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("reabilita", "0002_auth_and_saude_models"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReabilitaEvolucaoMultidisciplinar",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("profissional_id", models.PositiveIntegerField()),
                ("parecer_tecnico", models.TextField()),
                ("data_evolucao", models.DateField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "atendimento",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="evolucoes",
                        to="reabilita.reabilitaatendimentosaude",
                    ),
                ),
            ],
            options={
                "db_table": "reabilita_evolucao_multidisciplinar",
                "ordering": ["-data_evolucao", "-id"],
            },
        ),
    ]
