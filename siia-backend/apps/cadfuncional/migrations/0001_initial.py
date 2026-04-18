from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ReabilitaAtendimentoClinico",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("cadete", models.CharField(max_length=120)),
                ("sexo", models.CharField(blank=True, default="", max_length=20)),
                ("data_atendimento", models.DateField(db_index=True)),
                ("tipo", models.CharField(db_index=True, default="inicial", max_length=20)),
                ("perfil_encaminhamento", models.CharField(blank=True, default="", max_length=80)),
                ("lesao", models.CharField(blank=True, default="", max_length=255)),
                ("conduta", models.CharField(blank=True, default="", max_length=255)),
                ("curso", models.CharField(blank=True, default="", max_length=40)),
                ("atividade", models.CharField(blank=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "reabilita_atendimento_clinico"},
        ),
        migrations.CreateModel(
            name="ReabilitaRegistro",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "reabilita_registro"},
        ),
    ]
