import re
from datetime import datetime, time

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LaunchpadAplicativo, LogsAcesso

User = get_user_model()


def _get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _registrar_log_acesso_ldap(request, user, username_informado):
    backend = getattr(user, "backend", "")
    ldap_backend = "django_auth_ldap.backend.LDAPBackend"

    if backend != ldap_backend:
        return

    LogsAcesso.objects.create(
        usuario=user,
        username_informado=username_informado,
        metodo_autenticacao="ldap",
        backend_autenticacao=backend,
        endereco_ip=_get_client_ip(request),
        user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:512],
    )


def _normalizar_grupo(valor):
    return (valor or "").strip().lower()


def _extrair_cn_grupo(valor):
    if not valor:
        return ""
    match = re.search(r"CN=([^,]+)", valor, flags=re.IGNORECASE)
    if not match:
        return ""
    return match.group(1).strip().lower()


def _sincronizar_cache_grupos_ldap(user):
    backend = getattr(user, "backend", "")
    ldap_backend = "django_auth_ldap.backend.LDAPBackend"

    if backend != ldap_backend:
        return

    ldap_user = getattr(user, "ldap_user", None)
    group_dns = list(getattr(ldap_user, "group_dns", []) or []) if ldap_user else []

    if not group_dns:
        return

    user.ldap_grupos_cache = [str(group_dn) for group_dn in group_dns]
    user.ldap_ultimo_sync = timezone.now()
    user.save(update_fields=["ldap_grupos_cache", "ldap_ultimo_sync"])


def _grupos_do_usuario(user):
    grupos = set()

    for grupo in getattr(user, "ldap_grupos_cache", []) or []:
        grupo_norm = _normalizar_grupo(str(grupo))
        if grupo_norm:
            grupos.add(grupo_norm)

        grupo_cn = _extrair_cn_grupo(str(grupo))
        if grupo_cn:
            grupos.add(grupo_cn)

    for grupo in user.groups.all():
        nome = _normalizar_grupo(grupo.name)
        if nome:
            grupos.add(nome)

    return grupos


def _usuario_tem_acesso(app, grupos_usuario):
    grupos_permitidos = [str(grupo) for grupo in (app.grupos_ad_permitidos or []) if str(grupo).strip()]

    if not grupos_permitidos:
        return True

    if not grupos_usuario:
        return False

    for grupo in grupos_permitidos:
        grupo_norm = _normalizar_grupo(grupo)
        grupo_cn = _extrair_cn_grupo(grupo)

        if grupo_norm in grupos_usuario or (grupo_cn and grupo_cn in grupos_usuario):
            return True

    return False


class HealthView(APIView):
    def get(self, request):
        return Response({"module": "usuarios", "status": "ok"})


class LoginLDAPView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""

        if not username or not password:
            return Response({"detail": "Usuario e senha sao obrigatorios."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request=request, username=username, password=password)

        if not user:
            auth_mode = "LDAP" if settings.USE_LDAP_AUTH else "local"
            return Response(
                {"detail": f"Credenciais invalidas para o modo de autenticacao {auth_mode}."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response({"detail": "Usuario inativo."}, status=status.HTTP_403_FORBIDDEN)

        _sincronizar_cache_grupos_ldap(user)
        _registrar_log_acesso_ldap(request, user, username)

        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "token": token.key,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            }
        )


class MeView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "ldap_grupos_cache": getattr(request.user, "ldap_grupos_cache", []) or [],
            }
        )


class LaunchpadAppsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        section = (request.query_params.get("section") or "launchpad").strip().lower()

        if section not in {"launchpad", "legados"}:
            return Response(
                {"detail": "Parametro section invalido. Use launchpad ou legados."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grupos_usuario = _grupos_do_usuario(request.user)
        is_privileged = bool(request.user.is_superuser or request.user.is_staff)

        queryset = LaunchpadAplicativo.objects.filter(ativo=True, section=section)
        results = []

        for app in queryset:
            if not is_privileged and not _usuario_tem_acesso(app, grupos_usuario):
                continue

            results.append(
                {
                    "id": app.id,
                    "codigo": app.codigo,
                    "nome": app.nome,
                    "descricao": app.descricao,
                    "section": app.section,
                    "tipo_acesso": app.tipo_acesso,
                    "rota_interna": app.rota_interna,
                    "url_externa": app.url_externa,
                    "badge": app.badge,
                    "icon": app.icon,
                    "abrir_em_nova_aba": app.abrir_em_nova_aba,
                }
            )

        return Response(
            {
                "section": section,
                "count": len(results),
                "results": results,
            }
        )


class LogsAcessoListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _parse_datetime_param(raw_value, param_name, end_of_day=False):
        if not raw_value:
            return None, None

        raw_value = raw_value.strip()
        parsed = parse_datetime(raw_value)
        if parsed is not None:
            if timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
            return parsed, None

        parsed_date = parse_date(raw_value)
        if parsed_date is None:
            return None, f"Parametro {param_name} invalido. Use ISO datetime ou data YYYY-MM-DD."

        dt = datetime.combine(parsed_date, time.max if end_of_day else time.min)
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
        return dt, None

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"detail": "Acesso restrito a administradores."},
                status=status.HTTP_403_FORBIDDEN,
            )

        username = (request.query_params.get("username") or "").strip()
        date_from_raw = request.query_params.get("date_from")
        date_to_raw = request.query_params.get("date_to")
        limit_raw = (request.query_params.get("limit") or "100").strip()

        try:
            limit = max(1, min(int(limit_raw), 500))
        except ValueError:
            return Response(
                {"detail": "Parametro limit invalido. Use inteiro entre 1 e 500."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        date_from, error_from = self._parse_datetime_param(date_from_raw, "date_from")
        if error_from:
            return Response({"detail": error_from}, status=status.HTTP_400_BAD_REQUEST)

        date_to, error_to = self._parse_datetime_param(date_to_raw, "date_to", end_of_day=True)
        if error_to:
            return Response({"detail": error_to}, status=status.HTTP_400_BAD_REQUEST)

        if date_from and date_to and date_from > date_to:
            return Response(
                {"detail": "Intervalo invalido: date_from deve ser menor ou igual a date_to."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = LogsAcesso.objects.select_related("usuario").all()

        if username:
            queryset = queryset.filter(
                Q(username_informado__icontains=username) | Q(usuario__username__icontains=username)
            )

        if date_from:
            queryset = queryset.filter(data_hora__gte=date_from)

        if date_to:
            queryset = queryset.filter(data_hora__lte=date_to)

        total = queryset.count()
        logs = queryset[:limit]

        results = [
            {
                "id": log.id,
                "data_hora": log.data_hora.isoformat(),
                "username_informado": log.username_informado,
                "usuario": log.usuario.username if log.usuario else None,
                "metodo_autenticacao": log.metodo_autenticacao,
                "backend_autenticacao": log.backend_autenticacao,
                "endereco_ip": log.endereco_ip,
                "user_agent": log.user_agent,
            }
            for log in logs
        ]

        return Response(
            {
                "count": len(results),
                "total": total,
                "limit": limit,
                "filters": {
                    "username": username,
                    "date_from": date_from_raw,
                    "date_to": date_to_raw,
                },
                "results": results,
            }
        )


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"detail": "Logout efetuado com sucesso."})


class AuthModeView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        mode = "ldap" if settings.USE_LDAP_AUTH else "local"
        return Response(
            {
                "mode": mode,
                "ldap_enabled": settings.USE_LDAP_AUTH,
            }
        )


class LDAPStatusView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        ldap_backend = "django_auth_ldap.backend.LDAPBackend"
        configured_backends = getattr(settings, "AUTHENTICATION_BACKENDS", [])

        has_server_uri = bool(getattr(settings, "AUTH_LDAP_SERVER_URI", ""))
        has_bind_dn = bool(getattr(settings, "AUTH_LDAP_BIND_DN", ""))
        has_bind_password = bool(getattr(settings, "AUTH_LDAP_BIND_PASSWORD", ""))
        has_user_search = hasattr(settings, "AUTH_LDAP_USER_SEARCH")

        payload = {
            "mode": "ldap" if settings.USE_LDAP_AUTH else "local",
            "use_ldap_auth": settings.USE_LDAP_AUTH,
            "ldap_backend_configured": ldap_backend in configured_backends,
            "ldap_server_uri_configured": has_server_uri,
            "ldap_bind_dn_configured": has_bind_dn,
            "ldap_bind_password_configured": has_bind_password,
            "ldap_user_search_configured": has_user_search,
            "ready_for_ldap_auth": all(
                [
                    settings.USE_LDAP_AUTH,
                    ldap_backend in configured_backends,
                    has_server_uri,
                    has_bind_dn,
                    has_bind_password,
                    has_user_search,
                ]
            ),
        }

        return Response(payload)
