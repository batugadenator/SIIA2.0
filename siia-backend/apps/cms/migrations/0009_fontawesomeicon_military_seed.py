from django.db import migrations


CATALOG_VERSION = "5.10.2"

MILITARY_ICONS = [
    {"style": "fas", "icon_name": "fighter-jet", "class_name": "fas fa-fighter-jet", "label": "Caca"},
    {"style": "fas", "icon_name": "helicopter", "class_name": "fas fa-helicopter", "label": "Helicoptero"},
    {"style": "fas", "icon_name": "ship", "class_name": "fas fa-ship", "label": "Navio"},
    {"style": "fas", "icon_name": "space-shuttle", "class_name": "fas fa-space-shuttle", "label": "Aeroespacial"},
    {"style": "fas", "icon_name": "parachute-box", "class_name": "fas fa-parachute-box", "label": "Paraquedismo"},
    {"style": "fas", "icon_name": "crosshairs", "class_name": "fas fa-crosshairs", "label": "Mira"},
    {"style": "fas", "icon_name": "binoculars", "class_name": "fas fa-binoculars", "label": "Binoculo"},
    {"style": "fas", "icon_name": "medal", "class_name": "fas fa-medal", "label": "Medalha"},
]


def seed_military_icons(apps, schema_editor):
    FontAwesomeIcon = apps.get_model("cms", "FontAwesomeIcon")

    for item in MILITARY_ICONS:
        FontAwesomeIcon.objects.get_or_create(
            class_name=item["class_name"],
            defaults={
                "style": item["style"],
                "icon_name": item["icon_name"],
                "label": item["label"],
                "version": CATALOG_VERSION,
                "ativo": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("cms", "0008_fontawesomeicon_full_seed"),
    ]

    operations = [
        migrations.RunPython(seed_military_icons, migrations.RunPython.noop),
    ]
