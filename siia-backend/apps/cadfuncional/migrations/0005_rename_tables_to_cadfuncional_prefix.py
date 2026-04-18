from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("reabilita", "0004_avaliacao_fisioterapia_sred"),
    ]

    operations = [
        migrations.AlterModelTable(
            name="reabilitaregistro",
            table="cadfuncional_registro",
        ),
        migrations.AlterModelTable(
            name="reabilitaatendimentoclinico",
            table="cadfuncional_atendimento_clinico",
        ),
        migrations.AlterModelTable(
            name="reabilitaldapconfig",
            table="cadfuncional_ldap_config",
        ),
        migrations.AlterModelTable(
            name="reabilitausuarioperfil",
            table="cadfuncional_usuario_perfil",
        ),
        migrations.AlterModelTable(
            name="reabilitaatendimentosaude",
            table="cadfuncional_atendimento_saude",
        ),
        migrations.AlterModelTable(
            name="reabilitaevolucaomultidisciplinar",
            table="cadfuncional_evolucao_multidisciplinar",
        ),
        migrations.AlterModelTable(
            name="reabilitaavaliacaofisioterapiasred",
            table="cadfuncional_avaliacao_fisioterapia_sred",
        ),
    ]
