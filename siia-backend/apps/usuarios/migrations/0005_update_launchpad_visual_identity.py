from django.db import migrations


def update_launchpad_visual_identity(apps, schema_editor):
    LaunchpadAplicativo = apps.get_model("usuarios", "LaunchpadAplicativo")

    updates = {
        "reabilita": {
            "badge": "Saude",
            "icon": "fas fa-stethoscope",
        },
        "siagg": {
            "badge": "Governanca",
            "icon": "fas fa-folder-open",
        },
        "cms": {
            "badge": "Conteudo",
            "icon": "fas fa-edit",
        },
        "legados-hub": {
            "badge": "Legados",
            "icon": "fas fa-toolbox",
        },
    }

    for codigo, fields in updates.items():
        LaunchpadAplicativo.objects.filter(codigo=codigo).update(**fields)

    LaunchpadAplicativo.objects.filter(codigo__startswith="legado-").update(
        badge="Legado",
        icon="fas fa-tools",
        abrir_em_nova_aba=True,
    )


def rollback_launchpad_visual_identity(apps, schema_editor):
    LaunchpadAplicativo = apps.get_model("usuarios", "LaunchpadAplicativo")

    rollback = {
        "reabilita": {
            "badge": "Saude",
            "icon": "fas fa-stethoscope",
        },
        "siagg": {
            "badge": "Gestao",
            "icon": "fas fa-file-signature",
        },
        "cms": {
            "badge": "Conteudo",
            "icon": "fas fa-edit",
        },
        "legados-hub": {
            "badge": "Migracao",
            "icon": "fas fa-layer-group",
        },
    }

    for codigo, fields in rollback.items():
        LaunchpadAplicativo.objects.filter(codigo=codigo).update(**fields)

    LaunchpadAplicativo.objects.filter(codigo__startswith="legado-").update(
        badge="Legado",
        icon="fas fa-cubes",
        abrir_em_nova_aba=True,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("usuarios", "0004_seed_launchpad_apps"),
    ]

    operations = [
        migrations.RunPython(update_launchpad_visual_identity, rollback_launchpad_visual_identity),
    ]
