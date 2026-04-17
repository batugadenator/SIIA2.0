from django.db import migrations, models


def seed_fontawesome_icons(apps, schema_editor):
    FontAwesomeIcon = apps.get_model("cms", "FontAwesomeIcon")

    defaults = [
        {"style": "fas", "icon_name": "home", "class_name": "fas fa-home", "label": "Home"},
        {"style": "fas", "icon_name": "tachometer-alt", "class_name": "fas fa-tachometer-alt", "label": "Dashboard"},
        {"style": "fas", "icon_name": "user", "class_name": "fas fa-user", "label": "Usuario"},
        {"style": "fas", "icon_name": "users", "class_name": "fas fa-users", "label": "Usuarios"},
        {"style": "fas", "icon_name": "cog", "class_name": "fas fa-cog", "label": "Configuracao"},
        {"style": "fas", "icon_name": "bars", "class_name": "fas fa-bars", "label": "Menu"},
        {"style": "fas", "icon_name": "search", "class_name": "fas fa-search", "label": "Buscar"},
        {"style": "fas", "icon_name": "folder-open", "class_name": "fas fa-folder-open", "label": "Pasta aberta"},
        {"style": "fas", "icon_name": "file-alt", "class_name": "fas fa-file-alt", "label": "Documento"},
        {"style": "fas", "icon_name": "edit", "class_name": "fas fa-edit", "label": "Editar"},
        {"style": "fas", "icon_name": "trash", "class_name": "fas fa-trash", "label": "Excluir"},
        {"style": "fas", "icon_name": "check", "class_name": "fas fa-check", "label": "Confirmar"},
        {"style": "fas", "icon_name": "times", "class_name": "fas fa-times", "label": "Cancelar"},
        {"style": "fas", "icon_name": "external-link-alt", "class_name": "fas fa-external-link-alt", "label": "Link externo"},
        {"style": "fas", "icon_name": "newspaper", "class_name": "fas fa-newspaper", "label": "Noticias"},
        {"style": "fas", "icon_name": "chart-bar", "class_name": "fas fa-chart-bar", "label": "Grafico"},
        {"style": "fas", "icon_name": "database", "class_name": "fas fa-database", "label": "Banco de dados"},
        {"style": "fas", "icon_name": "server", "class_name": "fas fa-server", "label": "Servidor"},
        {"style": "fas", "icon_name": "hospital", "class_name": "fas fa-hospital", "label": "Hospital"},
        {"style": "fas", "icon_name": "stethoscope", "class_name": "fas fa-stethoscope", "label": "Saude"},
        {"style": "fab", "icon_name": "facebook", "class_name": "fab fa-facebook", "label": "Facebook"},
        {"style": "fab", "icon_name": "instagram", "class_name": "fab fa-instagram", "label": "Instagram"},
        {"style": "fab", "icon_name": "linkedin", "class_name": "fab fa-linkedin", "label": "LinkedIn"},
        {"style": "fab", "icon_name": "youtube", "class_name": "fab fa-youtube", "label": "YouTube"},
        {"style": "fab", "icon_name": "twitter", "class_name": "fab fa-twitter", "label": "Twitter"},
        {"style": "fab", "icon_name": "whatsapp", "class_name": "fab fa-whatsapp", "label": "WhatsApp"},
        {"style": "fab", "icon_name": "telegram", "class_name": "fab fa-telegram", "label": "Telegram"},
        {"style": "fab", "icon_name": "github", "class_name": "fab fa-github", "label": "GitHub"},
        {"style": "fab", "icon_name": "gitlab", "class_name": "fab fa-gitlab", "label": "GitLab"},
        {"style": "fab", "icon_name": "docker", "class_name": "fab fa-docker", "label": "Docker"},
        {"style": "fab", "icon_name": "python", "class_name": "fab fa-python", "label": "Python"},
        {"style": "fab", "icon_name": "node-js", "class_name": "fab fa-node-js", "label": "Node.js"},
        {"style": "fab", "icon_name": "react", "class_name": "fab fa-react", "label": "React"},
        {"style": "fab", "icon_name": "google", "class_name": "fab fa-google", "label": "Google"},
        {"style": "fab", "icon_name": "apple", "class_name": "fab fa-apple", "label": "Apple"},
        {"style": "fab", "icon_name": "android", "class_name": "fab fa-android", "label": "Android"},
        {"style": "fab", "icon_name": "windows", "class_name": "fab fa-windows", "label": "Windows"},
        {"style": "fab", "icon_name": "linux", "class_name": "fab fa-linux", "label": "Linux"},
        {"style": "fab", "icon_name": "aws", "class_name": "fab fa-aws", "label": "AWS"},
        {"style": "fab", "icon_name": "wordpress", "class_name": "fab fa-wordpress", "label": "WordPress"},
    ]

    for item in defaults:
        FontAwesomeIcon.objects.get_or_create(
            class_name=item["class_name"],
            defaults={
                "style": item["style"],
                "icon_name": item["icon_name"],
                "label": item["label"],
                "version": "5.10.2",
                "ativo": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("cms", "0006_noticia_workflow_configuracaovisual"),
    ]

    operations = [
        migrations.CreateModel(
            name="FontAwesomeIcon",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("style", models.CharField(choices=[("fas", "Solid"), ("fab", "Brands")], max_length=3)),
                ("icon_name", models.CharField(max_length=100)),
                ("class_name", models.CharField(max_length=140, unique=True)),
                ("label", models.CharField(max_length=140)),
                ("unicode_hex", models.CharField(blank=True, max_length=10)),
                ("version", models.CharField(default="5.10.2", max_length=20)),
                ("ativo", models.BooleanField(default=True)),
            ],
            options={
                "db_table": "cms_fontawesome_icon",
                "ordering": ["style", "label", "icon_name"],
            },
        ),
        migrations.AddIndex(
            model_name="fontawesomeicon",
            index=models.Index(fields=["style", "ativo"], name="cms_fontaw_style_a_5c191c_idx"),
        ),
        migrations.AddIndex(
            model_name="fontawesomeicon",
            index=models.Index(fields=["icon_name"], name="cms_fontaw_icon_na_497f0a_idx"),
        ),
        migrations.RunPython(seed_fontawesome_icons, migrations.RunPython.noop),
    ]
