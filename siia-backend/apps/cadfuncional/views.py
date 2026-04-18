from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import (
    build_legacy_access_snapshot_payload,
    build_atendimentos_referencias_payload,
    build_ldap_config_payload,
    build_painel_clinico_payload,
    change_password_payload,
    create_saude_atendimento_payload,
    create_saude_avaliacao_sred_payload,
    create_saude_evolucao_payload,
    create_system_user_payload,
    get_saude_avaliacao_sred_or_none,
    get_system_user_detail_payload,
    get_system_user_profile_or_none,
    list_saude_avaliacoes_sred_payload,
    list_saude_atendimentos_payload,
    list_saude_evolucoes_payload,
    list_system_users_payload,
    request_password_reset_payload,
    reset_system_user_password_payload,
    update_ldap_config_payload,
    update_saude_avaliacao_sred_payload,
    update_system_user_payload,
)


def _build_auth_session_payload(user):
    if not user or not user.is_authenticated:
        return {
            "is_authenticated": False,
            "user": None,
            "autorizacao_legada": None,
        }

    # Map Django user flags to CadFuncional profile for SIIA integration.
    # Full per-user profile mapping will be done when the CadFuncional user model
    # is consolidated with the SIIA Usuario model.
    perfil = "Administrador" if user.is_staff else "Operador"

    return {
        "is_authenticated": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_staff": user.is_staff,
            "perfil": perfil,
        },
        "autorizacao_legada": build_legacy_access_snapshot_payload(user),
    }


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"module": "cadfuncional", "status": "ok"})


class PainelClinicoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(build_painel_clinico_payload())


class AtendimentoReferenciasView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(build_atendimentos_referencias_payload())


class AtendimentoListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(list_saude_atendimentos_payload())

    def post(self, request):
        try:
            created = create_saude_atendimento_payload(request.data or {})
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(created, status=status.HTTP_201_CREATED)


class EvolucaoListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        atendimento_id = request.query_params.get("atendimento_id")
        if atendimento_id is not None:
            try:
                parsed = int(atendimento_id)
            except ValueError:
                return Response({"detail": "Parametro atendimento_id invalido."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            parsed = None
        return Response(list_saude_evolucoes_payload(parsed))

    def post(self, request):
        try:
            created = create_saude_evolucao_payload(request.data or {})
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(created, status=status.HTTP_201_CREATED)


class AvaliacaoSREDListCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]

    def get(self, request):
        atendimento_id = request.query_params.get("atendimento_id")
        if atendimento_id is not None:
            try:
                parsed = int(atendimento_id)
            except ValueError:
                return Response({"detail": "Parametro atendimento_id invalido."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            parsed = None
        return Response(list_saude_avaliacoes_sred_payload(parsed))

    def post(self, request):
        try:
            created = create_saude_avaliacao_sred_payload(request.data or {})
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(created, status=status.HTTP_201_CREATED)


class AvaliacaoSREDDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]

    def patch(self, request, avaliacao_id: int):
        item = get_saude_avaliacao_sred_or_none(avaliacao_id)
        if not item:
            return Response({"detail": "Avaliacao nao encontrada."}, status=status.HTTP_404_NOT_FOUND)

        try:
            updated = update_saude_avaliacao_sred_payload(item, request.data or {}, request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(updated)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class AuthCsrfView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"detail": "CSRF cookie set."})


class AuthLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""

        if not username or not password:
            return Response(
                {"detail": "Usuario e senha sao obrigatorios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request=request, username=username, password=password)
        if not user:
            return Response({"detail": "Credenciais invalidas."}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({"detail": "Usuario inativo."}, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        return Response(_build_auth_session_payload(user))


class AuthMeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication, TokenAuthentication]

    def get(self, request):
        return Response(_build_auth_session_payload(request.user))


class AuthLogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]

    def post(self, request):
        if request.user.is_authenticated:
            logout(request)
        return Response({"detail": "Logout efetuado com sucesso."})


class AuthMudarSenhaView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    def post(self, request):
        try:
            payload = change_password_payload(request.user, request.data or {})
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(payload)


class AuthRecuperarSenhaView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            payload = request_password_reset_payload(request.data or {})
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(payload)


class AuthLDAPConfigView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication, TokenAuthentication]

    def _ensure_staff(self, request):
        if not request.user.is_staff:
            return Response({"detail": "Acesso restrito a administradores."}, status=status.HTTP_403_FORBIDDEN)
        return None

    def get(self, request):
        denied = self._ensure_staff(request)
        if denied:
            return denied
        return Response(build_ldap_config_payload())

    def put(self, request):
        denied = self._ensure_staff(request)
        if denied:
            return denied
        payload = update_ldap_config_payload(request.data or {}, request.user)
        return Response(payload)


class AuthUsuariosListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication, TokenAuthentication]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"detail": "Acesso restrito a administradores."}, status=status.HTTP_403_FORBIDDEN)
        return Response(list_system_users_payload())


class AuthUsuariosNovoView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication, TokenAuthentication]

    def post(self, request):
        if not request.user.is_staff:
            return Response({"detail": "Acesso restrito a administradores."}, status=status.HTTP_403_FORBIDDEN)
        try:
            created = create_system_user_payload(request.data or {})
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(created, status=status.HTTP_201_CREATED)


class AuthUsuarioDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication, TokenAuthentication]

    def _get_profile(self, user_id):
        return get_system_user_profile_or_none(user_id)

    def get(self, request, user_id: int):
        if not request.user.is_staff:
            return Response({"detail": "Acesso restrito a administradores."}, status=status.HTTP_403_FORBIDDEN)
        profile = self._get_profile(user_id)
        if not profile:
            return Response({"detail": "Usuario nao encontrado."}, status=status.HTTP_404_NOT_FOUND)
        return Response(get_system_user_detail_payload(profile))

    def patch(self, request, user_id: int):
        if not request.user.is_staff:
            return Response({"detail": "Acesso restrito a administradores."}, status=status.HTTP_403_FORBIDDEN)
        profile = self._get_profile(user_id)
        if not profile:
            return Response({"detail": "Usuario nao encontrado."}, status=status.HTTP_404_NOT_FOUND)
        try:
            updated = update_system_user_payload(profile, request.data or {})
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(updated)

    def delete(self, request, user_id: int):
        if not request.user.is_staff:
            return Response({"detail": "Acesso restrito a administradores."}, status=status.HTTP_403_FORBIDDEN)
        profile = self._get_profile(user_id)
        if not profile:
            return Response({"detail": "Usuario nao encontrado."}, status=status.HTTP_404_NOT_FOUND)
        profile.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AuthUsuarioResetarSenhaView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication, TokenAuthentication]

    def post(self, request, user_id: int):
        if not request.user.is_staff:
            return Response({"detail": "Acesso restrito a administradores."}, status=status.HTTP_403_FORBIDDEN)
        profile = get_system_user_profile_or_none(user_id)
        if not profile:
            return Response({"detail": "Usuario nao encontrado."}, status=status.HTTP_404_NOT_FOUND)
        return Response(reset_system_user_password_payload(profile))
