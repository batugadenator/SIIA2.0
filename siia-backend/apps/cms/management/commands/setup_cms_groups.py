"""
Comando: python manage.py setup_cms_groups

Cria (ou atualiza) os três grupos de perfil do módulo CMS:
  - publicador_cms   → CRUD de notícias
  - homologador_cms  → CRUD de notícias + can_authorize_noticia
  - admin_cms        → acesso total (notícias, menus, SVGs e configuração visual)
"""
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Cria os grupos e permissões do módulo CMS"

    def handle(self, *args, **options):
        # Importação tardia para evitar problemas antes das migrações
        from apps.cms.models import ConfiguracaoVisual, Menu, Noticia

        noticia_ct = ContentType.objects.get_for_model(Noticia)
        menu_ct = ContentType.objects.get_for_model(Menu)
        cv_ct = ContentType.objects.get_for_model(ConfiguracaoVisual)

        crud_noticia = list(
            Permission.objects.filter(
                content_type=noticia_ct,
                codename__in=["add_noticia", "change_noticia", "delete_noticia", "view_noticia"],
            )
        )
        can_authorize = Permission.objects.filter(
            content_type=noticia_ct, codename="can_authorize_noticia"
        ).first()
        crud_menu = list(Permission.objects.filter(content_type=menu_ct))
        crud_cv = list(Permission.objects.filter(content_type=cv_ct))

        #  Publicador
        publicador, _ = Group.objects.get_or_create(name="publicador_cms")
        publicador.permissions.set(crud_noticia)
        self.stdout.write("  Grupo 'publicador_cms' configurado.")

        #  Homologador
        homologador, _ = Group.objects.get_or_create(name="homologador_cms")
        p_hom = list(crud_noticia)
        if can_authorize:
            p_hom.append(can_authorize)
        homologador.permissions.set(p_hom)
        self.stdout.write("  Grupo 'homologador_cms' configurado.")

        #  Admin CMS
        admin_cms, _ = Group.objects.get_or_create(name="admin_cms")
        all_perms = list(crud_noticia) + crud_menu + crud_cv
        if can_authorize:
            all_perms.append(can_authorize)
        admin_cms.permissions.set(all_perms)
        self.stdout.write("  Grupo 'admin_cms' configurado.")

        self.stdout.write(self.style.SUCCESS("Grupos CMS criados/atualizados com sucesso."))
