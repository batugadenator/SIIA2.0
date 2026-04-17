from django.db import migrations

# ---------------------------------------------------------------------------
# Curadoria AMAN — ícones militares recomendados para menus e admin.
# Seleção validada contra o bundle Font Awesome 7.2.0 (all.min.css).
# Foco: Exército Brasileiro / AMAN — atividades, armas, comunicações, honras.
# Idempotente via get_or_create em class_name (campo único).
# ---------------------------------------------------------------------------
CATALOG_VERSION = "5.10.2"

AMAN_ICONS = [
    # ── Pessoal militar ──────────────────────────────────────────────────────
    # fa-person-military-pointing (e54a) — FA 7.2
    {"style": "fas", "icon_name": "person-military-pointing", "class_name": "fas fa-person-military-pointing", "label": "Instrucao Militar"},
    # fa-person-military-rifle (e54b) — FA 7.2
    {"style": "fas", "icon_name": "person-military-rifle", "class_name": "fas fa-person-military-rifle", "label": "Soldado Armado"},
    # fa-person-military-to-person (e54c) — FA 7.2
    {"style": "fas", "icon_name": "person-military-to-person", "class_name": "fas fa-person-military-to-person", "label": "Instrucao em Grupo"},
    # fa-helmet-un (e503) — FA 7.2
    {"style": "fas", "icon_name": "helmet-un", "class_name": "fas fa-helmet-un", "label": "Capacete Militar"},

    # ── Táticas e terreno ────────────────────────────────────────────────────
    # fa-bullseye (f140)
    {"style": "fas", "icon_name": "bullseye", "class_name": "fas fa-bullseye", "label": "Alvo"},
    # fa-compass (f14e)
    {"style": "fas", "icon_name": "compass", "class_name": "fas fa-compass", "label": "Bussola"},
    # fa-mountain (f6fc)
    {"style": "fas", "icon_name": "mountain", "class_name": "fas fa-mountain", "label": "Terreno"},
    # fa-campground (f6bb)
    {"style": "fas", "icon_name": "campground", "class_name": "fas fa-campground", "label": "Bivaque"},
    # fa-fist-raised / fa-hand-fist (f6de)
    {"style": "fas", "icon_name": "fist-raised", "class_name": "fas fa-fist-raised", "label": "Combate"},

    # ── Armas de combate ─────────────────────────────────────────────────────
    # fa-bomb (f1e2)
    {"style": "fas", "icon_name": "bomb", "class_name": "fas fa-bomb", "label": "Armamento"},
    # fa-rocket (f135)
    {"style": "fas", "icon_name": "rocket", "class_name": "fas fa-rocket", "label": "Missilistica"},

    # ── Comunicações operacionais ─────────────────────────────────────────────
    # fa-broadcast-tower / fa-tower-broadcast (f519)
    {"style": "fas", "icon_name": "broadcast-tower", "class_name": "fas fa-broadcast-tower", "label": "Comunicacoes"},
    # fa-satellite-dish (f7c0)
    {"style": "fas", "icon_name": "satellite-dish", "class_name": "fas fa-satellite-dish", "label": "Com Satelital"},

    # ── Tradições e honras militares ──────────────────────────────────────────
    # fa-horse (f6f0) — Cavalaria
    {"style": "fas", "icon_name": "horse", "class_name": "fas fa-horse", "label": "Cavalaria"},
    # fa-trophy (f091)
    {"style": "fas", "icon_name": "trophy", "class_name": "fas fa-trophy", "label": "Premio"},
]


def seed_aman_curadoria(apps, schema_editor):
    FontAwesomeIcon = apps.get_model("cms", "FontAwesomeIcon")

    for item in AMAN_ICONS:
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
        ("cms", "0009_fontawesomeicon_military_seed"),
    ]

    operations = [
        migrations.RunPython(seed_aman_curadoria, migrations.RunPython.noop),
    ]
