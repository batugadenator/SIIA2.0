from datetime import date
import os
import tempfile
from unittest.mock import patch
import requests

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from apps.siagg.models import SiaggArea, SiaggDataEntry, SiaggGovernanceDocument, SiaggReport, SiaggReportFile


User = get_user_model()
TEST_MEDIA_ROOT = os.path.join(tempfile.gettempdir(), "siia_media_test")


def _create_user_with_group(username: str, group_name: str):
    user = User.objects.create_user(username=username, password="SenhaForte#123")
    group, _ = Group.objects.get_or_create(name=group_name)
    user.groups.add(group)
    return user


class SiaggAreaApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("siagg-area-list")

        self.gestor = _create_user_with_group("siagg.gestor", "siagg_gestor")
        self.operador = _create_user_with_group("siagg.operador", "siagg_operador")
        self.consultor = _create_user_with_group("siagg.consultor", "siagg_consultor")

        self.area = SiaggArea.objects.create(
            nome="Planejamento Estrategico",
            slug="planejamento-estrategico",
            descricao="Area de planejamento.",
            ativo=True,
        )

    def test_anonimo_nao_acessa_areas(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_consultor_pode_ler_areas(self):
        self.client.force_authenticate(user=self.consultor)

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        payload = response.data[0]
        self.assertIn("id", payload)
        self.assertIn("nome", payload)
        self.assertIn("slug", payload)
        self.assertIn("descricao", payload)
        self.assertIn("ativo", payload)
        self.assertIn("criado_em", payload)
        self.assertIn("atualizado_em", payload)

    def test_consultor_nao_pode_criar_area(self):
        self.client.force_authenticate(user=self.consultor)

        response = self.client.post(
            self.list_url,
            {
                "nome": "Tecnologia da Informacao",
                "slug": "tic",
                "descricao": "Area de tecnologia.",
                "ativo": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_gestor_pode_criar_area(self):
        self.client.force_authenticate(user=self.gestor)

        response = self.client.post(
            self.list_url,
            {
                "nome": "Tecnologia da Informacao",
                "slug": "tic",
                "descricao": "Area de tecnologia.",
                "ativo": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "tic")

    def test_filtro_de_areas_por_search_e_ativo(self):
        SiaggArea.objects.create(
            nome="Gestao Ambiental",
            slug="gestao-ambiental",
            descricao="Area ambiental.",
            ativo=False,
        )

        self.client.force_authenticate(user=self.consultor)

        response = self.client.get(self.list_url, {"search": "planejamento", "ativo": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["slug"], "planejamento-estrategico")


class SiaggDataEntryApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("siagg-data-entry-list")

        self.gestor = _create_user_with_group("siagg.gestor.2", "siagg_gestor")
        self.operador = _create_user_with_group("siagg.operador.2", "siagg_operador")
        self.consultor = _create_user_with_group("siagg.consultor.2", "siagg_consultor")

        self.area = SiaggArea.objects.create(
            nome="Orcamento e Financas",
            slug="orcamento-financas",
            descricao="Area orcamentaria.",
            ativo=True,
        )

        self.entry = SiaggDataEntry.objects.create(
            area=self.area,
            titulo="Indicador de Conformidade",
            valor="98.50",
            data_referencia=date(2026, 4, 1),
            observacao="Base inicial.",
            operador=self.gestor,
        )

    def test_anonimo_nao_acessa_data_entries(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_consultor_pode_ler_data_entries(self):
        self.client.force_authenticate(user=self.consultor)

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        payload = response.data[0]
        self.assertIn("id", payload)
        self.assertIn("area", payload)
        self.assertIn("titulo", payload)
        self.assertIn("valor", payload)
        self.assertIn("data_referencia", payload)
        self.assertIn("observacao", payload)
        self.assertIn("operador", payload)

    def test_operador_pode_criar_data_entry(self):
        self.client.force_authenticate(user=self.operador)

        response = self.client.post(
            self.list_url,
            {
                "area": self.area.id,
                "titulo": "Novo Indicador",
                "valor": "72.10",
                "data_referencia": "2026-04-10",
                "observacao": "Registro de teste.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["operador"], self.operador.id)

    def test_consultor_nao_pode_criar_data_entry(self):
        self.client.force_authenticate(user=self.consultor)

        response = self.client.post(
            self.list_url,
            {
                "area": self.area.id,
                "titulo": "Tentativa sem permissao",
                "valor": "50.00",
                "data_referencia": "2026-04-11",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filtro_data_entries_por_area_e_periodo(self):
        outra_area = SiaggArea.objects.create(
            nome="Gestao Ambiental",
            slug="gestao-ambiental",
            descricao="Area ambiental.",
            ativo=True,
        )
        SiaggDataEntry.objects.create(
            area=outra_area,
            titulo="Indicador Ambiental",
            valor="80.00",
            data_referencia=date(2026, 3, 15),
            observacao="Outro dado.",
            operador=self.gestor,
        )

        self.client.force_authenticate(user=self.consultor)

        response = self.client.get(
            self.list_url,
            {
                "area_id": self.area.id,
                "data_inicio": "2026-04-01",
                "data_fim": "2026-04-30",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["titulo"], "Indicador de Conformidade")


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class SiaggReportApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("siagg-report-list")
        self.gestor = _create_user_with_group("siagg.gestor.report", "siagg_gestor")
        self.operador = _create_user_with_group("siagg.operador.report", "siagg_operador")
        self.consultor = _create_user_with_group("siagg.consultor.report", "siagg_consultor")

        self.area = SiaggArea.objects.create(
            nome="Escritorio de Projetos",
            slug="escritorio-projetos",
            descricao="Area de projetos.",
            ativo=True,
        )

        self.report = SiaggReport.objects.create(
            area=self.area,
            titulo="Relatorio Trimestral",
            descricao="Resumo de entregas.",
            data_referencia=date(2026, 4, 15),
            autor=self.gestor,
        )

    def test_consultor_pode_ler_reports_com_contrato(self):
        self.client.force_authenticate(user=self.consultor)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        payload = response.data[0]
        self.assertIn("id", payload)
        self.assertIn("area", payload)
        self.assertIn("titulo", payload)
        self.assertIn("descricao", payload)
        self.assertIn("data_referencia", payload)
        self.assertIn("autor", payload)
        self.assertIn("arquivos", payload)

    def test_operador_pode_criar_report(self):
        self.client.force_authenticate(user=self.operador)
        response = self.client.post(
            self.list_url,
            {
                "area": self.area.id,
                "titulo": "Novo Relatorio",
                "descricao": "Descricao do relatorio.",
                "data_referencia": "2026-04-20",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["autor"], self.operador.id)

    def test_consultor_nao_pode_criar_report(self):
        self.client.force_authenticate(user=self.consultor)
        response = self.client.post(
            self.list_url,
            {
                "area": self.area.id,
                "titulo": "Relatorio sem permissao",
                "descricao": "Teste",
                "data_referencia": "2026-04-22",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_operador_pode_upload_pdf_em_report(self):
        self.client.force_authenticate(user=self.operador)
        upload_url = reverse("siagg-report-upload-arquivo", kwargs={"pk": self.report.id})
        pdf = SimpleUploadedFile("anexo.pdf", b"%PDF-1.4\n%test", content_type="application/pdf")

        response = self.client.post(upload_url, {"arquivo": pdf}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["report"], self.report.id)
        self.assertEqual(response.data["enviado_por"], self.operador.id)

    def test_consultor_nao_pode_upload_pdf_em_report(self):
        self.client.force_authenticate(user=self.consultor)
        upload_url = reverse("siagg-report-upload-arquivo", kwargs={"pk": self.report.id})
        pdf = SimpleUploadedFile("anexo.pdf", b"%PDF-1.4\n%test", content_type="application/pdf")

        response = self.client.post(upload_url, {"arquivo": pdf}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_gestor_pode_remover_report_file(self):
        report_file = SiaggReportFile.objects.create(
            report=self.report,
            arquivo=SimpleUploadedFile("base.pdf", b"%PDF-1.4\n%test", content_type="application/pdf"),
            enviado_por=self.gestor,
        )

        self.client.force_authenticate(user=self.gestor)
        delete_url = reverse("siagg-report-file-detail", kwargs={"pk": report_file.id})

        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class SiaggGovernanceDocumentApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("siagg-governance-document-list")
        self.gestor = _create_user_with_group("siagg.gestor.gov", "siagg_gestor")
        self.operador = _create_user_with_group("siagg.operador.gov", "siagg_operador")
        self.consultor = _create_user_with_group("siagg.consultor.gov", "siagg_consultor")

        self.doc = SiaggGovernanceDocument.objects.create(
            titulo="Plano de Gestao",
            descricao="Plano oficial.",
            categoria="Estrategico",
            arquivo=SimpleUploadedFile("plano.pdf", b"%PDF-1.4\n%test", content_type="application/pdf"),
            enviado_por=self.gestor,
        )

    def test_consultor_pode_ler_governance_documents(self):
        self.client.force_authenticate(user=self.consultor)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        payload = response.data[0]
        self.assertIn("id", payload)
        self.assertIn("titulo", payload)
        self.assertIn("categoria", payload)
        self.assertIn("arquivo", payload)
        self.assertIn("enviado_por", payload)

    def test_operador_pode_criar_governance_document(self):
        self.client.force_authenticate(user=self.operador)
        pdf = SimpleUploadedFile("documento.pdf", b"%PDF-1.4\n%test", content_type="application/pdf")

        response = self.client.post(
            self.list_url,
            {
                "titulo": "PDTIC 2026",
                "descricao": "Planejamento de TI.",
                "categoria": "Governanca TIC",
                "arquivo": pdf,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["enviado_por"], self.operador.id)

    def test_consultor_nao_pode_criar_governance_document(self):
        self.client.force_authenticate(user=self.consultor)
        pdf = SimpleUploadedFile("documento.pdf", b"%PDF-1.4\n%test", content_type="application/pdf")

        response = self.client.post(
            self.list_url,
            {
                "titulo": "Documento sem permissao",
                "descricao": "Teste",
                "categoria": "Governanca",
                "arquivo": pdf,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_upload_arquivo_invalido_retorna_400(self):
        self.client.force_authenticate(user=self.gestor)
        txt = SimpleUploadedFile("documento.txt", b"texto", content_type="text/plain")

        response = self.client.post(
            self.list_url,
            {
                "titulo": "Documento invalido",
                "descricao": "Teste",
                "categoria": "Governanca",
                "arquivo": txt,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("arquivo", response.data)


class SiaggPncpApiTests(APITestCase):
    def setUp(self):
        self.url = reverse("siagg-pncp-pca-summary")
        self.gestor = _create_user_with_group("siagg.gestor.pncp", "siagg_gestor")
        self.consultor = _create_user_with_group("siagg.consultor.pncp", "siagg_consultor")
        cache.clear()

    @patch("apps.siagg.services.pncp_service.requests.get")
    def test_get_retorna_resumo_pncp_e_usa_cache(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.raise_for_status.return_value = None
        mock_get.return_value.json.return_value = [
            {"categoria": "material", "valor_estimado": 1000},
            {"categoria": "servico", "valor_estimado": 2000},
        ]

        self.client.force_authenticate(user=self.consultor)

        first_response = self.client.get(self.url, {"cnpj": "00394452000103", "ano": 2026})
        second_response = self.client.get(self.url, {"cnpj": "00394452000103", "ano": 2026})

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(first_response.data["total_itens"], 2)
        self.assertEqual(first_response.data["quantidade_categorias"], 2)
        self.assertEqual(mock_get.call_count, 1)

    @patch("apps.siagg.services.pncp_service.requests.get")
    def test_post_force_refresh_requer_perfil_gestor(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.raise_for_status.return_value = None
        mock_get.return_value.json.return_value = [{"categoria": "material", "valor_estimado": 100}]

        self.client.force_authenticate(user=self.consultor)
        forbidden_response = self.client.post(self.url, {"cnpj": "00394452000103", "ano": 2026}, format="json")
        self.assertEqual(forbidden_response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.gestor)
        allowed_response = self.client.post(self.url, {"cnpj": "00394452000103", "ano": 2026}, format="json")
        self.assertEqual(allowed_response.status_code, status.HTTP_200_OK)
        self.assertEqual(allowed_response.data["total_itens"], 1)

    @patch("apps.siagg.services.pncp_service.requests.get")
    def test_pncp_get_falha_externa_retorna_503(self, mock_get):
        mock_get.side_effect = requests.RequestException("timeout")
        self.client.force_authenticate(user=self.consultor)

        response = self.client.get(self.url, {"cnpj": "00394452000103", "ano": 2026})
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["code"], "external_service_unavailable")

    def test_pncp_valida_cnpj_e_ano(self):
        self.client.force_authenticate(user=self.consultor)

        invalid_cnpj = self.client.get(self.url, {"cnpj": "123", "ano": 2026})
        invalid_year = self.client.get(self.url, {"cnpj": "00394452000103", "ano": "abc"})

        self.assertEqual(invalid_cnpj.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_year.status_code, status.HTTP_400_BAD_REQUEST)
