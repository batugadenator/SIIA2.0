from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.usuarios.models import LaunchpadAplicativo, LogsAcesso, Usuario


class LaunchpadAppsViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("usuarios-launchpad-apps")

        self.dn_admin = "CN=SG_APP_SIIA_ADMIN,OU=Aplicacoes,OU=Grupos,DC=tesouro,DC=fazenda,DC=gov,DC=br"
        self.dn_fin = "CN=SG_APP_SIIA_FIN,OU=Aplicacoes,OU=Grupos,DC=tesouro,DC=fazenda,DC=gov,DC=br"

        self.app_publica = LaunchpadAplicativo.objects.create(
            codigo="app-publica",
            nome="Aplicativo Publico",
            descricao="Visivel para qualquer autenticado",
            section="launchpad",
            tipo_acesso="interno",
            rota_interna="/dashboard/publica",
            grupos_ad_permitidos=[],
            ordem=1,
            ativo=True,
        )

        self.app_admin_cn = LaunchpadAplicativo.objects.create(
            codigo="app-admin-cn",
            nome="Aplicativo Admin",
            descricao="Visivel por CN",
            section="launchpad",
            tipo_acesso="interno",
            rota_interna="/dashboard/admin",
            grupos_ad_permitidos=["sg_app_siia_admin"],
            ordem=2,
            ativo=True,
        )

        self.app_fin_dn = LaunchpadAplicativo.objects.create(
            codigo="app-fin-dn",
            nome="Aplicativo Financeiro",
            descricao="Visivel por DN",
            section="legados",
            tipo_acesso="interno",
            rota_interna="/dashboard/fin",
            grupos_ad_permitidos=[self.dn_fin],
            ordem=1,
            ativo=True,
        )

    def _autenticar(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_permitido_quando_grupo_bate_por_cn_ou_dn(self):
        user_admin = Usuario.objects.create_user(
            username="u_admin",
            password="senha-forte-123",
            ldap_grupos_cache=[self.dn_admin],
        )
        self._autenticar(user_admin)

        response_launchpad = self.client.get(self.url, {"section": "launchpad"})
        self.assertEqual(response_launchpad.status_code, status.HTTP_200_OK)
        codigos_launchpad = {item["codigo"] for item in response_launchpad.data["results"]}
        self.assertIn("app-admin-cn", codigos_launchpad)

        user_fin = Usuario.objects.create_user(
            username="u_fin",
            password="senha-forte-123",
            ldap_grupos_cache=[self.dn_fin],
        )
        self._autenticar(user_fin)

        response_legados = self.client.get(self.url, {"section": "legados"})
        self.assertEqual(response_legados.status_code, status.HTTP_200_OK)
        codigos_legados = {item["codigo"] for item in response_legados.data["results"]}
        self.assertIn("app-fin-dn", codigos_legados)

    def test_negado_quando_grupo_nao_bate(self):
        user_sem_permissao = Usuario.objects.create_user(
            username="u_sem_permissao",
            password="senha-forte-123",
            ldap_grupos_cache=["CN=SG_APP_OUTRO,OU=Aplicacoes,DC=tesouro,DC=gov,DC=br"],
        )
        self._autenticar(user_sem_permissao)

        response = self.client.get(self.url, {"section": "launchpad"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        codigos = {item["codigo"] for item in response.data["results"]}
        self.assertNotIn("app-admin-cn", codigos)

    def test_sem_grupo_ve_apenas_apps_sem_restricao(self):
        user_sem_grupos = Usuario.objects.create_user(
            username="u_sem_grupos",
            password="senha-forte-123",
            ldap_grupos_cache=[],
        )
        self._autenticar(user_sem_grupos)

        response = self.client.get(self.url, {"section": "launchpad"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        codigos = {item["codigo"] for item in response.data["results"]}
        self.assertIn("app-publica", codigos)
        self.assertNotIn("app-admin-cn", codigos)

    def test_retorna_400_para_secao_invalida(self):
        user = Usuario.objects.create_user(
            username="u_invalida",
            password="senha-forte-123",
            ldap_grupos_cache=[self.dn_admin],
        )
        self._autenticar(user)

        response = self.client.get(self.url, {"section": "qualquer-coisa"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("section", response.data["detail"].lower())


class LogsAcessoListViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("usuarios-logs-acesso")

        self.admin = Usuario.objects.create_user(
            username="admin_auditoria",
            password="senha-forte-123",
            is_staff=True,
        )
        self.user = Usuario.objects.create_user(
            username="usuario_comum",
            password="senha-forte-123",
            is_staff=False,
        )

        self.log_alfa = LogsAcesso.objects.create(
            usuario=self.user,
            username_informado="cadete.alfa",
            metodo_autenticacao="ldap",
            backend_autenticacao="django_auth_ldap.backend.LDAPBackend",
            endereco_ip="10.0.0.11",
            user_agent="Mozilla/5.0",
        )
        self.log_bravo = LogsAcesso.objects.create(
            usuario=self.user,
            username_informado="cadete.bravo",
            metodo_autenticacao="ldap",
            backend_autenticacao="django_auth_ldap.backend.LDAPBackend",
            endereco_ip="10.0.0.12",
            user_agent="Mozilla/5.0",
        )

        now = timezone.now()
        LogsAcesso.objects.filter(id=self.log_alfa.id).update(data_hora=now - timedelta(days=2))
        LogsAcesso.objects.filter(id=self.log_bravo.id).update(data_hora=now - timedelta(hours=6))

    def _autenticar(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_bloqueia_usuario_nao_admin(self):
        self._autenticar(self.user)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_lista_logs_para_admin_com_filtro_por_username(self):
        self._autenticar(self.admin)

        response = self.client.get(self.url, {"username": "bravo"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["username_informado"], "cadete.bravo")

    def test_lista_logs_para_admin_com_filtro_por_periodo(self):
        self._autenticar(self.admin)
        date_from = (timezone.now() - timedelta(days=1)).date().isoformat()

        response = self.client.get(self.url, {"date_from": date_from})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = {item["username_informado"] for item in response.data["results"]}
        self.assertIn("cadete.bravo", usernames)
        self.assertNotIn("cadete.alfa", usernames)

    def test_retorna_400_para_data_invalida(self):
        self._autenticar(self.admin)

        response = self.client.get(self.url, {"date_from": "11/04/2026"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date_from", response.data["detail"])
