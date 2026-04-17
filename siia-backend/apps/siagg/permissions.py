from rest_framework.permissions import SAFE_METHODS, BasePermission


def _group_names(user):
    return {group.name.lower() for group in user.groups.all()}


def _has_any_group(user, allowed_group_names):
    names = _group_names(user)
    return any(group_name in names for group_name in allowed_group_names)


class IsAuthenticatedReadOnlyOrAreaWriter(BasePermission):
    message = "Somente perfis de gestao podem alterar Areas do SIAGG."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        if user.is_superuser or user.is_staff:
            return True

        return _has_any_group(user, {"siagg_admin", "siagg_gestor", "admin_siagg", "gestor_siagg"})


class IsAuthenticatedReadOnlyOrDataEntryWriter(BasePermission):
    message = "Somente perfis autorizados podem alterar indicadores do SIAGG."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        if user.is_superuser or user.is_staff:
            return True

        return _has_any_group(
            user,
            {
                "siagg_admin",
                "siagg_gestor",
                "siagg_operador",
                "admin_siagg",
                "gestor_siagg",
                "operador_siagg",
            },
        )


class IsAuthenticatedReadOnlyOrReportWriter(BasePermission):
    message = "Somente perfis autorizados podem alterar relatorios do SIAGG."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        if user.is_superuser or user.is_staff:
            return True

        return _has_any_group(
            user,
            {
                "siagg_admin",
                "siagg_gestor",
                "siagg_operador",
                "admin_siagg",
                "gestor_siagg",
                "operador_siagg",
            },
        )


class IsAuthenticatedReadOnlyOrGovernanceWriter(BasePermission):
    message = "Somente perfis autorizados podem alterar documentos de governanca do SIAGG."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        if user.is_superuser or user.is_staff:
            return True

        return _has_any_group(
            user,
            {
                "siagg_admin",
                "siagg_gestor",
                "siagg_operador",
                "admin_siagg",
                "gestor_siagg",
                "operador_siagg",
            },
        )


class IsAuthenticatedReadOnlyOrReportFileWriter(BasePermission):
    message = "Somente perfis autorizados podem anexar/remover arquivos de relatorio."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        if user.is_superuser or user.is_staff:
            return True

        return _has_any_group(
            user,
            {
                "siagg_admin",
                "siagg_gestor",
                "siagg_operador",
                "admin_siagg",
                "gestor_siagg",
                "operador_siagg",
            },
        )


class IsAuthenticatedReadOnlyOrPncpRefreshWriter(BasePermission):
    message = "Somente perfis de gestao podem forcar refresh do PNCP."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        if user.is_superuser or user.is_staff:
            return True

        return _has_any_group(user, {"siagg_admin", "siagg_gestor", "admin_siagg", "gestor_siagg"})
