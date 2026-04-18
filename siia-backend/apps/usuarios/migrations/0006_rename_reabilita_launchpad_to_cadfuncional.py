from django.db import migrations


def rename_launchpad_to_cadfuncional(apps, schema_editor):
    LaunchpadAplicativo = apps.get_model("usuarios", "LaunchpadAplicativo")

    existing_reabilita = LaunchpadAplicativo.objects.filter(codigo="reabilita").first()
    existing_cadfuncional = LaunchpadAplicativo.objects.filter(codigo="cadfuncional").first()

    defaults = {
        "nome": "Cadete Funcional",
        "descricao": "Fluxos de atendimento, evolucao clinica e prontuarios do S-RED.",
        "section": "launchpad",
        "tipo_acesso": "interno",
        "rota_interna": "/dashboard/cadfuncional",
        "url_externa": "",
        "badge": "Saude",
        "icon": "fas fa-stethoscope",
        "abrir_em_nova_aba": False,
        "grupos_ad_permitidos": [
            "SIIA_APP_REABILITA",
            "CN=SIIA_APP_REABILITA,OU=Grupos,DC=aman,DC=eb,DC=mil,DC=br",
            "SIIA_APP_CADFUNCIONAL",
            "CN=SIIA_APP_CADFUNCIONAL,OU=Grupos,DC=aman,DC=eb,DC=mil,DC=br",
        ],
        "ordem": 10,
        "ativo": True,
    }

    if existing_reabilita and existing_cadfuncional:
        for field, value in defaults.items():
            setattr(existing_cadfuncional, field, value)
        existing_cadfuncional.save()
        existing_reabilita.delete()
        return

    if existing_reabilita:
        existing_reabilita.codigo = "cadfuncional"
        for field, value in defaults.items():
            setattr(existing_reabilita, field, value)
        existing_reabilita.save()
        return

    if existing_cadfuncional:
        for field, value in defaults.items():
            setattr(existing_cadfuncional, field, value)
        existing_cadfuncional.save()
        return

    LaunchpadAplicativo.objects.create(codigo="cadfuncional", **defaults)


def rollback_launchpad_to_reabilita(apps, schema_editor):
    LaunchpadAplicativo = apps.get_model("usuarios", "LaunchpadAplicativo")

    existing_cadfuncional = LaunchpadAplicativo.objects.filter(codigo="cadfuncional").first()
    existing_reabilita = LaunchpadAplicativo.objects.filter(codigo="reabilita").first()

    defaults = {
        "nome": "Reabilita",
        "descricao": "Fluxos de atendimento, evolucao clinica e prontuarios do S-RED.",
        "section": "launchpad",
        "tipo_acesso": "interno",
        "rota_interna": "/dashboard/reabilita",
        "url_externa": "",
        "badge": "Saude",
        "icon": "fas fa-stethoscope",
        "abrir_em_nova_aba": False,
        "grupos_ad_permitidos": [
            "SIIA_APP_REABILITA",
            "CN=SIIA_APP_REABILITA,OU=Grupos,DC=aman,DC=eb,DC=mil,DC=br",
        ],
        "ordem": 10,
        "ativo": True,
    }

    if existing_cadfuncional and existing_reabilita:
        for field, value in defaults.items():
            setattr(existing_reabilita, field, value)
        existing_reabilita.save()
        existing_cadfuncional.delete()
        return

    if existing_cadfuncional:
        existing_cadfuncional.codigo = "reabilita"
        for field, value in defaults.items():
            setattr(existing_cadfuncional, field, value)
        existing_cadfuncional.save()
        return

    if existing_reabilita:
        for field, value in defaults.items():
            setattr(existing_reabilita, field, value)
        existing_reabilita.save()
        return

    LaunchpadAplicativo.objects.create(codigo="reabilita", **defaults)


class Migration(migrations.Migration):
    dependencies = [
        ("usuarios", "0005_update_launchpad_visual_identity"),
    ]

    operations = [
        migrations.RunPython(rename_launchpad_to_cadfuncional, rollback_launchpad_to_reabilita),
    ]
