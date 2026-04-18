from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.cadfuncional.models import CadfuncionalAtendimentoClinico

User = get_user_model()


def _months_ago(base: date, months: int) -> date:
    month = base.month - months
    year = base.year
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, 15)


class PainelClinicoViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("cadfuncional-painel-clinico")

    def test_retorna_shape_e_tipos_sem_dados(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertIn("metricas", data)
        self.assertIn("atendimentos_ultimos_6_meses", data)
        self.assertIn("encaminhamentos_por_perfil", data)
        self.assertIn("ultimos_atendimentos", data)
        self.assertIn("atendimentos_iniciais_analitico", data)

        self.assertEqual(data["metricas"]["cadetes"], 0)
        self.assertEqual(data["metricas"]["atendimentos"], 0)
        self.assertEqual(len(data["atendimentos_ultimos_6_meses"]), 6)
        self.assertTrue(all(item["total"] == 0 for item in data["atendimentos_ultimos_6_meses"]))

    def test_retorna_agregacoes_reais_com_dados(self):
        today = date.today()

        CadfuncionalAtendimentoClinico.objects.bulk_create(
            [
                CadfuncionalAtendimentoClinico(
                    cadete="Cadete Alfa",
                    sexo="Masculino",
                    data_atendimento=today,
                    tipo="inicial",
                    perfil_encaminhamento="Medico",
                    lesao="Entorse de tornozelo",
                    conduta="Repouso e fisioterapia",
                    curso="CFO 1",
                    atividade="Corrida",
                ),
                CadfuncionalAtendimentoClinico(
                    cadete="Cadete Bravo",
                    sexo="Feminino",
                    data_atendimento=today,
                    tipo="retorno",
                    perfil_encaminhamento="Fisioterapeuta",
                    lesao="Tendinite",
                    conduta="Alongamento e retorno gradual",
                    curso="CFO 2",
                    atividade="Marcha",
                ),
                CadfuncionalAtendimentoClinico(
                    cadete="Cadete Alfa",
                    sexo="Masculino",
                    data_atendimento=_months_ago(today, 1),
                    tipo="inicial",
                    perfil_encaminhamento="PEF",
                    lesao="Dor lombar",
                    conduta="Fortalecimento de core",
                    curso="CFO 1",
                    atividade="Treinamento funcional",
                ),
            ]
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data

        self.assertEqual(data["metricas"]["cadetes"], 2)
        self.assertEqual(data["metricas"]["atendimentos"], 3)
        self.assertEqual(data["metricas"]["atendimentos_homens"], 2)
        self.assertEqual(data["metricas"]["atendimentos_mulheres"], 1)
        self.assertEqual(data["metricas"]["por_data"], 2)
        self.assertEqual(data["metricas"]["retornos"], 1)

        self.assertEqual(len(data["atendimentos_ultimos_6_meses"]), 6)
        self.assertEqual(sum(item["total"] for item in data["atendimentos_ultimos_6_meses"]), 3)

        perfis = {item["perfil"]: item for item in data["encaminhamentos_por_perfil"]}
        self.assertEqual(perfis["Medico"]["total"], 1)
        self.assertEqual(perfis["Fisioterapeuta"]["total"], 1)
        self.assertEqual(perfis["PEF"]["total"], 1)

        self.assertGreaterEqual(len(data["ultimos_atendimentos"]), 3)
        self.assertEqual(data["ultimos_atendimentos"][0]["cadete"], "Cadete Bravo")

        self.assertEqual(len(data["atendimentos_iniciais_analitico"]), 2)
        cursos = {item["curso"] for item in data["atendimentos_iniciais_analitico"]}
        self.assertIn("CFO 1", cursos)


class AtendimentoReferenciasViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("cadfuncional-saude-atendimentos-referencias")

    def test_retorna_shape_minimo_de_referencias(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertIn("tipos_lesao", data)
        self.assertIn("origens_lesao", data)
        self.assertIn("segmentos", data)
        self.assertIn("lateralidades", data)
        self.assertIn("atividades", data)

        self.assertGreater(len(data["tipos_lesao"]), 0)
        self.assertGreater(len(data["origens_lesao"]), 0)


class AuthSessionAdapterViewTests(APITestCase):
    def setUp(self):
        self.csrf_url = reverse("cadfuncional-auth-csrf")
        self.login_url = reverse("cadfuncional-auth-login")
        self.me_url = reverse("cadfuncional-auth-me")
        self.logout_url = reverse("cadfuncional-auth-logout")
        self.user = User.objects.create_user(
            username="cadete.auth",
            password="SenhaForte#123",
            first_name="Cadete",
            last_name="Auth",
            is_staff=True,
        )

    def test_me_anonimo_retorna_sessao_nao_autenticada(self):
        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["is_authenticated"], False)
        self.assertIsNone(response.data["user"])
        self.assertIsNone(response.data["autorizacao_legada"])

    def test_login_me_logout_fluxo_sessao(self):
        csrf_response = self.client.get(self.csrf_url)
        self.assertEqual(csrf_response.status_code, status.HTTP_200_OK)

        login_response = self.client.post(
            self.login_url,
            {"username": "cadete.auth", "password": "SenhaForte#123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(login_response.data["is_authenticated"], True)
        self.assertEqual(login_response.data["user"]["username"], "cadete.auth")
        self.assertEqual(login_response.data["user"]["is_staff"], True)
        self.assertEqual(login_response.data["user"]["perfil"], "Operador")
        self.assertIn("autorizacao_legada", login_response.data)
        self.assertIn("cadfuncional", login_response.data["autorizacao_legada"])
        self.assertIn("cms", login_response.data["autorizacao_legada"])

        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["is_authenticated"], True)
        self.assertEqual(me_response.data["user"]["username"], "cadete.auth")
        self.assertIn("autorizacao_legada", me_response.data)
        self.assertIn("cadfuncional", me_response.data["autorizacao_legada"])
        self.assertIn("cms", me_response.data["autorizacao_legada"])

        logout_response = self.client.post(self.logout_url, {}, format="json")
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        me_after_logout = self.client.get(self.me_url)
        self.assertEqual(me_after_logout.status_code, status.HTTP_200_OK)
        self.assertEqual(me_after_logout.data["is_authenticated"], False)
        self.assertIsNone(me_after_logout.data["user"])

    def test_login_invalido_retorna_401(self):
        response = self.client.post(
            self.login_url,
            {"username": "cadete.auth", "password": "senha-incorreta"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)


class AuthLdapConfigViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("cadfuncional-auth-ldap-config")
        self.staff = User.objects.create_user(username="admin.ldap", password="SenhaForte#123", is_staff=True)
        self.non_staff = User.objects.create_user(username="operador.ldap", password="SenhaForte#123", is_staff=False)

    def test_get_requer_admin(self):
        self.client.force_login(self.non_staff)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_e_put_retorna_shape_esperado(self):
        self.client.force_login(self.staff)

        get_response = self.client.get(self.url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertIn("enabled", get_response.data)
        self.assertIn("bind_password_configured", get_response.data)

        put_response = self.client.put(
            self.url,
            {
                "enabled": True,
                "server_uri": "ldap://aman.local",
                "bind_dn": "CN=svc,OU=Usuarios,DC=aman,DC=eb,DC=mil,DC=br",
                "bind_password": "segredo-supervisor",
                "cache_timeout": 1800,
                "group_type": "PosixGroupType",
            },
            format="json",
        )
        self.assertEqual(put_response.status_code, status.HTTP_200_OK)
        self.assertEqual(put_response.data["enabled"], True)
        self.assertEqual(put_response.data["server_uri"], "ldap://aman.local")
        self.assertEqual(put_response.data["bind_password_configured"], True)
        self.assertEqual(put_response.data["cache_timeout"], 1800)
        self.assertEqual(put_response.data["group_type"], "PosixGroupType")


class AuthUsuariosViewTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("cadfuncional-auth-usuarios-list")
        self.new_url = reverse("cadfuncional-auth-usuarios-novo")
        self.admin = User.objects.create_user(username="admin.users", password="SenhaForte#123", is_staff=True)
        self.client.force_login(self.admin)

    def test_fluxo_crud_e_reset_senha(self):
        create_response = self.client.post(
            self.new_url,
            {
                "nome_completo": "Fulano de Tal",
                "cpf": "12345678901",
                "perfil": "Administrador",
                "especialidade_medica": "",
                "funcao_instrutor": "",
                "posto_graduacao": "Cap",
                "nome_guerra": "Fulano",
                "setor": "Saude",
                "fracao": "A",
                "senha_inicial": "SenhaInicial#123",
                "confirmar_senha_inicial": "SenhaInicial#123",
                "usuario_ativo": True,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        created_id = create_response.data["id"]

        list_response = self.client.get(self.list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(item["id"] == created_id for item in list_response.data))

        detail_url = reverse("cadfuncional-auth-usuario-detail", kwargs={"user_id": created_id})
        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["cpf"], "12345678901")

        patch_response = self.client.patch(
            detail_url,
            {
                "perfil": "Instrutor",
                "funcao_instrutor": "Comandante de Pelotao",
                "usuario_ativo": False,
            },
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data["perfil"], "Instrutor")
        self.assertEqual(patch_response.data["is_active"], False)

        reset_url = reverse("cadfuncional-auth-usuario-resetar-senha", kwargs={"user_id": created_id})
        reset_response = self.client.post(reset_url, {}, format="json")
        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", reset_response.data)

        delete_response = self.client.delete(detail_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

        list_after_delete = self.client.get(self.list_url)
        self.assertFalse(any(item["id"] == created_id for item in list_after_delete.data))


class AtendimentoListCreateViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("cadfuncional-saude-atendimentos")

    def test_lista_vazia_por_padrao(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_cria_e_lista_atendimento_com_shape_do_contrato(self):
        create_response = self.client.post(
            self.url,
            {
                "cadete_id": 1,
                "cadete_nr_militar": "123456",
                "cadete_nome_guerra": "ALFA",
                "medico_id": 10,
                "tipo_atendimento": "Inicial",
                "tipo_lesao": "Muscular",
                "origem_lesao": "Por Estresse",
                "segmento_corporal": "Membro inferior",
                "estrutura_anatomica": "Joelho",
                "localizacao_lesao": "Anterior",
                "lateralidade": "Direita",
                "classificacao_atividade": "Militar",
                "tipo_atividade": "Corrida",
                "tfm_taf": "TFM",
                "modalidade_esportiva": "Atletismo",
                "conduta_terapeutica": "Fisioterapia",
                "decisao_sred": "Em Investigacao",
                "medicamentoso": False,
                "solicitar_exames_complementares": True,
                "exames_complementares": ["Raio-X"],
                "encaminhamentos_multidisciplinares": ["Fisioterapeuta"],
                "disposicao_cadete": ["Apto com restricoes"],
                "notas_clinicas": "Evolucao inicial.",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", create_response.data)
        self.assertEqual(create_response.data["tipo_lesao"], "Muscular")
        self.assertEqual(create_response.data["encaminhamentos_multidisciplinares"], ["Fisioterapeuta"])

        list_response = self.client.get(self.url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        item = list_response.data[0]
        self.assertIn("estado_fluxo", item)
        self.assertIn("prontidao_instrutor", item)
        self.assertIn("flag_sred", item)


class AuthPasswordFlowsViewTests(APITestCase):
    def setUp(self):
        self.mudar_senha_url = reverse("cadfuncional-auth-mudar-senha")
        self.recuperar_senha_url = reverse("cadfuncional-auth-recuperar-senha")
        self.auth_user = User.objects.create_user(username="user.authpass", password="SenhaAntiga#123")
        self.admin = User.objects.create_user(username="admin.authpass", password="SenhaAdmin#123", is_staff=True)
        self.client.force_login(self.admin)

        create_response = self.client.post(
            reverse("cadfuncional-auth-usuarios-novo"),
            {
                "nome_completo": "Recuperar Senha",
                "cpf": "98765432100",
                "perfil": "Consultor",
                "senha_inicial": "Inicial#123",
                "confirmar_senha_inicial": "Inicial#123",
                "usuario_ativo": True,
            },
            format="json",
        )
        self.recuperar_username = create_response.data["username"]

    def test_mudar_senha_exige_autenticacao(self):
        self.client.logout()
        response = self.client.post(
            self.mudar_senha_url,
            {
                "senha_atual": "SenhaAntiga#123",
                "senha_nova": "SenhaNova#123",
                "confirmar_senha_nova": "SenhaNova#123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_mudar_senha_altera_credencial(self):
        self.client.force_login(self.auth_user)
        response = self.client.post(
            self.mudar_senha_url,
            {
                "senha_atual": "SenhaAntiga#123",
                "senha_nova": "SenhaNova#123",
                "confirmar_senha_nova": "SenhaNova#123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)

        self.auth_user.refresh_from_db()
        self.assertTrue(self.auth_user.check_password("SenhaNova#123"))

    def test_recuperar_senha_por_cpf(self):
        response = self.client.post(
            self.recuperar_senha_url,
            {"cpf": "987.654.321-00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)

        reset_user = User.objects.get(username=self.recuperar_username)
        self.assertTrue(reset_user.check_password(f"Rec#{reset_user.id:06d}"))


class EvolucaoListCreateViewTests(APITestCase):
    def setUp(self):
        self.atendimentos_url = reverse("cadfuncional-saude-atendimentos")
        self.url = reverse("cadfuncional-saude-evolucoes")
        atendimento_response = self.client.post(
            self.atendimentos_url,
            {
                "cadete_id": 7,
                "cadete_nr_militar": "2026001",
                "cadete_nome_guerra": "BRAVO",
                "medico_id": 13,
                "tipo_atendimento": "Inicial",
                "tipo_lesao": "Articular",
                "origem_lesao": "Traumatica",
                "segmento_corporal": "Membro inferior",
                "estrutura_anatomica": "Tornozelo",
                "localizacao_lesao": "Lateral",
                "lateralidade": "Esquerda",
            },
            format="json",
        )
        self.atendimento_id = atendimento_response.data["id"]

    def test_lista_vazia_por_padrao(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_cria_lista_e_filtra_evolucoes(self):
        create_response = self.client.post(
            self.url,
            {
                "atendimento_id": self.atendimento_id,
                "profissional_id": 99,
                "parecer_tecnico": "Evolucao positiva.",
                "data_evolucao": date.today().isoformat(),
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["atendimento_id"], self.atendimento_id)

        list_response = self.client.get(self.url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertIn("parecer_tecnico", list_response.data[0])

        filtered_response = self.client.get(self.url, {"atendimento_id": self.atendimento_id})
        self.assertEqual(filtered_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filtered_response.data), 1)


class AvaliacaoFisioterapiaSREDViewTests(APITestCase):
    def setUp(self):
        self.atendimentos_url = reverse("cadfuncional-saude-atendimentos")
        self.url = reverse("cadfuncional-saude-fisio-avaliacoes-sred")
        self.user = User.objects.create_user(username="fisioterapeuta.sred", password="SenhaFisio#123")

        atendimento_response = self.client.post(
            self.atendimentos_url,
            {
                "cadete_id": 15,
                "cadete_nr_militar": "2026015",
                "cadete_nome_guerra": "CHARLIE",
                "medico_id": 31,
                "tipo_atendimento": "Inicial",
                "tipo_lesao": "Tendinosa",
                "origem_lesao": "Por Estresse",
                "segmento_corporal": "Membro inferior",
                "estrutura_anatomica": "Joelho",
                "localizacao_lesao": "Anterior",
                "lateralidade": "Direita",
            },
            format="json",
        )
        self.atendimento_id = atendimento_response.data["id"]

    def test_lista_vazia_por_padrao(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_cria_lista_filtra_e_patch_avaliacao(self):
        create_response = self.client.post(
            self.url,
            {
                "atendimento_id": self.atendimento_id,
                "fisioterapeuta_id": 77,
                "gravidade_eva": 6,
                "reatividade": "Moderada",
                "etiologia": "Sobrecarga (Overuse)",
                "diagnostico_clinico": "Sindroma femoropatelar.",
                "plano_tratamento": "Fortalecimento e progressao de carga.",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["atendimento_id"], self.atendimento_id)
        self.assertIn("reatividade_options", create_response.data)
        self.assertIn("etiologia_options", create_response.data)

        avaliacao_id = create_response.data["id"]

        list_response = self.client.get(self.url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]["cadete_nome"], "CHARLIE")

        filtered_response = self.client.get(self.url, {"atendimento_id": self.atendimento_id})
        self.assertEqual(filtered_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filtered_response.data), 1)

        self.client.force_login(self.user)
        patch_response = self.client.patch(
            reverse("cadfuncional-saude-fisio-avaliacoes-sred-detail", kwargs={"avaliacao_id": avaliacao_id}),
            {
                "liberado_para_pef": True,
                "observacoes_liberacao_pef": "Liberado para retorno gradual supervisionado.",
            },
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data["liberado_para_pef"], True)
        self.assertEqual(patch_response.data["liberado_para_pef_por_username"], "fisioterapeuta.sred")
        self.assertIsNotNone(patch_response.data["liberado_para_pef_em"])

