from django.db import migrations


def seed_launchpad_apps(apps, schema_editor):
    LaunchpadAplicativo = apps.get_model("usuarios", "LaunchpadAplicativo")

    defaults = [
        {
            "codigo": "reabilita",
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
        },
        {
            "codigo": "siagg",
            "nome": "SIAGG",
            "descricao": "Indicadores de governanca e acompanhamento de resultados.",
            "section": "launchpad",
            "tipo_acesso": "interno",
            "rota_interna": "/dashboard/siagg",
            "url_externa": "",
            "badge": "Gestao",
            "icon": "fas fa-file-signature",
            "abrir_em_nova_aba": False,
            "grupos_ad_permitidos": [
                "SIIA_APP_SIAGG",
                "CN=SIIA_APP_SIAGG,OU=Grupos,DC=aman,DC=eb,DC=mil,DC=br",
            ],
            "ordem": 20,
            "ativo": True,
        },
        {
            "codigo": "cms",
            "nome": "CMS",
            "descricao": "Gestao de conteudo do portal publico e navegacao institucional.",
            "section": "launchpad",
            "tipo_acesso": "interno",
            "rota_interna": "/dashboard/cms",
            "url_externa": "",
            "badge": "Conteudo",
            "icon": "fas fa-edit",
            "abrir_em_nova_aba": False,
            "grupos_ad_permitidos": [
                "SIIA_APP_CMS",
                "CN=SIIA_APP_CMS,OU=Grupos,DC=aman,DC=eb,DC=mil,DC=br",
            ],
            "ordem": 30,
            "ativo": True,
        },
        {
            "codigo": "legados-hub",
            "nome": "Sistemas Legados (PHP)",
            "descricao": "Acesso controlado aos modulos em transicao do legado PHP.",
            "section": "launchpad",
            "tipo_acesso": "interno",
            "rota_interna": "/dashboard/legados",
            "url_externa": "",
            "badge": "Migracao",
            "icon": "fas fa-layer-group",
            "abrir_em_nova_aba": False,
            "grupos_ad_permitidos": [
                "SIIA_APP_LEGADOS",
                "CN=SIIA_APP_LEGADOS,OU=Grupos,DC=aman,DC=eb,DC=mil,DC=br",
            ],
            "ordem": 40,
            "ativo": True,
        },
    ]

    for item in defaults:
        LaunchpadAplicativo.objects.update_or_create(codigo=item["codigo"], defaults=item)

    for index in range(1, 21):
        codigo = f"legado-{index:02d}"
        LaunchpadAplicativo.objects.update_or_create(
            codigo=codigo,
            defaults={
                "nome": f"Modulo Legado {index:02d}",
                "descricao": "Abertura em nova aba para continuidade operacional durante migracao.",
                "section": "legados",
                "tipo_acesso": "externo",
                "rota_interna": "",
                "url_externa": f"https://siia-legado.aman.intranet/modulo-{index}",
                "badge": "Legado",
                "icon": "fas fa-cubes",
                "abrir_em_nova_aba": True,
                "grupos_ad_permitidos": [
                    "SIIA_APP_LEGADOS",
                    "CN=SIIA_APP_LEGADOS,OU=Grupos,DC=aman,DC=eb,DC=mil,DC=br",
                ],
                "ordem": 100 + index,
                "ativo": True,
            },
        )


def rollback_launchpad_apps(apps, schema_editor):
    LaunchpadAplicativo = apps.get_model("usuarios", "LaunchpadAplicativo")
    LaunchpadAplicativo.objects.filter(codigo__in=[
        "reabilita",
        "siagg",
        "cms",
        "legados-hub",
    ]).delete()
    LaunchpadAplicativo.objects.filter(codigo__startswith="legado-").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("usuarios", "0003_launchpadaplicativo_usuario_ldap_grupos_cache_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_launchpad_apps, rollback_launchpad_apps),
    ]
