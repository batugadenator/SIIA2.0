from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient


@override_settings(MEDIA_ROOT="/tmp/siia_media_test")
class CMSCabecalhoAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()

        self.admin_user = User.objects.create_user(username="admincms", password="123")
        self.homologador_user = User.objects.create_user(username="homologadorcms", password="123")

        admin_group, _ = Group.objects.get_or_create(name="admin_cms")
        homologador_group, _ = Group.objects.get_or_create(name="homologador_cms")

        self.admin_user.groups.add(admin_group)
        self.homologador_user.groups.add(homologador_group)

    def test_public_page_contract_has_cabecalho(self):
        response = self.client.get("/api/cms/public-page/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertIn("cabecalho", payload)
        self.assertIn("links", payload["cabecalho"])
        self.assertGreaterEqual(len(payload["cabecalho"]["links"]), 4)

    def test_cabecalho_workflow_end_to_end(self):
        self.client.force_authenticate(user=self.admin_user)

        put_resp = self.client.put(
            "/api/cms/cms/admin/cabecalho/",
            {
                "nome_instituicao": "Ministerio da Defesa",
                "nome_instituicao_en": "Ministry of Defense",
                "nome_orgao": "Exercito Brasileiro",
                "nome_orgao_en": "Brazilian Army",
                "slogan": "Braco Forte - Mao Amiga",
                "slogan_en": "Strong Arm - Friendly Hand",
                "logo_url": "",
                "link_logo_url": "/",
                "idioma_padrao": "pt-br",
                "links_fixos": {
                    "inicio": {"titulo": "Inicio", "titulo_en": "Home", "url": "/", "abrir_em_nova_aba": False},
                    "servicos": {"titulo": "Servicos", "titulo_en": "Services", "url": "/servicos", "abrir_em_nova_aba": False},
                    "contato": {"titulo": "Contato", "titulo_en": "Contact", "url": "/contato", "abrir_em_nova_aba": False},
                    "estrutura": {
                        "titulo": "Estrutura Organizacional",
                        "titulo_en": "Organizational Structure",
                        "url": "/estrutura-organizacional",
                        "abrir_em_nova_aba": False,
                    },
                },
                "links_extras": [],
            },
            format="json",
        )
        self.assertEqual(put_resp.status_code, 200)
        self.assertEqual(put_resp.json().get("status"), "rascunho")

        submit_resp = self.client.post("/api/cms/cms/admin/cabecalho/submeter/")
        self.assertEqual(submit_resp.status_code, 200)
        self.assertEqual(submit_resp.json().get("status"), "pendente")

        self.client.force_authenticate(user=self.homologador_user)
        auth_resp = self.client.post("/api/cms/cms/admin/cabecalho/autorizar/")
        self.assertEqual(auth_resp.status_code, 200)
        self.assertEqual(auth_resp.json().get("status"), "publicado")

    def test_upload_image_endpoint(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        self.client.force_authenticate(user=self.admin_user)
        image = SimpleUploadedFile("logo.png", b"\x89PNG\r\n\x1a\n", content_type="image/png")
        response = self.client.post("/api/cms/cms/admin/upload-image/", {"file": image}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertIn("url", response.json())
