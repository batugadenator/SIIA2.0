"""
Permissões e helpers para o módulo CMS do SIIA 2.0.

Grupos Django esperados:
  - admin_cms       → acesso total (Noticia, Menu, ConfiguracaoVisual, troca SVG)
  - homologador_cms → CRUD de notícias + can_authorize_noticia
  - publicador_cms  → CRUD de notícias (próprias ou todas, conforme regra)
"""
from rest_framework.permissions import BasePermission

GRUPO_ADMIN = "admin_cms"
GRUPO_HOMOLOGADOR = "homologador_cms"
GRUPO_PUBLICADOR = "publicador_cms"

CMS_GRUPOS = {
    "admin": GRUPO_ADMIN,
    "homologador": GRUPO_HOMOLOGADOR,
    "publicador": GRUPO_PUBLICADOR,
}


def perfil_cms(user) -> str | None:
    """Retorna o perfil CMS mais privilegiado do usuário, ou None se não for membro."""
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return "admin"
    grupos = set(user.groups.values_list("name", flat=True))
    if GRUPO_ADMIN in grupos:
        return "admin"
    if GRUPO_HOMOLOGADOR in grupos:
        return "homologador"
    if GRUPO_PUBLICADOR in grupos:
        return "publicador"
    return None


class IsCMSUser(BasePermission):
    """Qualquer membro dos grupos CMS (publicador, homologador ou admin)."""

    message = "Acesso restrito a membros do CMS."

    def has_permission(self, request, view):
        return perfil_cms(request.user) is not None


class IsCMSAdmin(BasePermission):
    """Apenas membros do grupo admin_cms (ou superuser)."""

    message = "Acesso restrito a administradores do CMS."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.groups.filter(name=GRUPO_ADMIN).exists()


class CanAuthorizeNoticia(BasePermission):
    """Homologadores e administradores do CMS."""

    message = "Apenas homologadores e administradores podem autorizar publicações."

    def has_permission(self, request, view):
        return perfil_cms(request.user) in ("admin", "homologador")
