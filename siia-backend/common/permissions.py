from rest_framework.permissions import BasePermission


class IsMilitar(BasePermission):
    message = "Acesso permitido apenas para perfil militar."

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)
