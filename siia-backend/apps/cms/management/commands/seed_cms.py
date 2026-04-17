from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.cms.models import Artigo, CardInformativo, ConfiguracaoPortal, Menu, Noticia


class Command(BaseCommand):
    help = "Popula dados iniciais do CMS (configuracao, menu, artigos e cards)."

    def handle(self, *args, **options):
        config, _ = ConfiguracaoPortal.objects.update_or_create(
            nome_portal="SIIA 2.0",
            defaults={
                "logo_url": "",
                "cor_primaria": "#1351B4",
                "cor_secundaria": "#2670E8",
                "link_diretorio_nextcloud_publico": "https://nextcloud.exemplo.gov.br/publico",
                "link_diretorio_nextcloud_interno": "https://nextcloud.exemplo.gov.br/interno",
                "ativo": True,
            },
        )

        inicio, _ = Menu.objects.update_or_create(
            titulo="Inicio",
            parent=None,
            defaults={
                "link_url": "https://siia.gov.br",
                "icone_classe": "fas fa-home",
                "ordem": 1,
                "ativo": True,
            },
        )
        servicos, _ = Menu.objects.update_or_create(
            titulo="Servicos",
            parent=None,
            defaults={
                "link_url": "https://siia.gov.br/servicos",
                "icone_classe": "fas fa-th-large",
                "ordem": 2,
                "ativo": True,
            },
        )
        Menu.objects.update_or_create(
            titulo="Diretorio Nextcloud",
            parent=servicos,
            defaults={
                "link_url": config.link_diretorio_nextcloud_publico,
                "icone_classe": "fas fa-folder-open",
                "ordem": 1,
                "abrir_em_nova_aba": True,
                "ativo": True,
            },
        )
        Menu.objects.update_or_create(
            titulo="Contato",
            parent=None,
            defaults={
                "link_url": "https://siia.gov.br/contato",
                "icone_classe": "fas fa-envelope",
                "ordem": 3,
                "ativo": True,
            },
        )

        Artigo.objects.update_or_create(
            titulo="Nova versao do portal SIIA",
            defaults={
                "resumo": "Melhorias de navegacao e integracao entre modulos.",
                "conteudo": "Publicacao inicial do portal modernizado.",
                "destaque": True,
                "publicado": True,
                "publicado_em": timezone.now(),
            },
        )
        Artigo.objects.update_or_create(
            titulo="SIAGG com novos paineis",
            defaults={
                "resumo": "Indicadores de governanca com visual renovado.",
                "conteudo": "Painel com acompanhamento de resultados institucionais.",
                "destaque": False,
                "publicado": True,
                "publicado_em": timezone.now(),
            },
        )
        Artigo.objects.update_or_create(
            titulo="Reabilita amplia cobertura",
            defaults={
                "resumo": "Fluxos de atendimento e evolucao clinica revisados.",
                "conteudo": "Nova fase de evolucao do modulo Reabilita.",
                "destaque": False,
                "publicado": True,
                "publicado_em": timezone.now(),
            },
        )

        noticias_seed = [
            {
                "titulo": "SIIA 2.0 integra painéis operacionais",
                "categoria_texto": "Operacionalidade",
                "imagem_url": f"{config.link_diretorio_nextcloud_publico}/noticias/siia-operacionalidade.jpg",
                "conteudo": "Nova camada de observabilidade unifica indicadores estratégicos e operacionais.",
                "is_destaque": True,
            },
            {
                "titulo": "AMAN publica nova diretriz de interoperabilidade",
                "categoria_texto": "Institucional",
                "imagem_url": f"{config.link_diretorio_nextcloud_publico}/noticias/aman-interoperabilidade.jpg",
                "conteudo": "Documento atualiza requisitos de integração entre módulos legados e novos serviços.",
                "is_destaque": True,
            },
            {
                "titulo": "SIAGG recebe painel de governança em tempo real",
                "categoria_texto": "Governança",
                "imagem_url": f"{config.link_diretorio_nextcloud_publico}/noticias/siagg-governanca.jpg",
                "conteudo": "Painéis agora destacam evolução de metas e risco por eixo de gestão.",
                "is_destaque": True,
            },
            {
                "titulo": "Reabilita amplia trilhas de cuidado",
                "categoria_texto": "Saúde",
                "imagem_url": f"{config.link_diretorio_nextcloud_publico}/noticias/reabilita-trilhas.jpg",
                "conteudo": "Fluxos assistenciais foram reorganizados para acelerar acompanhamento clínico.",
                "is_destaque": True,
            },
            {
                "titulo": "Portal adota novo padrão DSGov para cards",
                "categoria_texto": "UX",
                "imagem_url": f"{config.link_diretorio_nextcloud_publico}/noticias/portal-dsgov-cards.jpg",
                "conteudo": "Atualização melhora leitura, contraste e hierarquia visual das seções.",
                "is_destaque": True,
            },
            {
                "titulo": "Diretório Nextcloud ganha novo catálogo",
                "categoria_texto": "Documentação",
                "imagem_url": f"{config.link_diretorio_nextcloud_publico}/noticias/nextcloud-catalogo.jpg",
                "conteudo": "Biblioteca documental foi reorganizada para busca rápida por unidade e assunto.",
                "is_destaque": True,
            },
        ]

        for item in noticias_seed:
            Noticia.objects.update_or_create(
                titulo=item["titulo"],
                defaults={
                    "categoria_texto": item["categoria_texto"],
                    "imagem_url": item["imagem_url"],
                    "conteudo": item["conteudo"],
                    "is_destaque": item["is_destaque"],
                },
            )

        CardInformativo.objects.update_or_create(
            titulo="Diretorio de Documentos",
            defaults={
                "descricao": "Acesse pastas institucionais no Nextcloud.",
                "link_url": config.link_diretorio_nextcloud_publico,
                "icone": "folder",
                "icone_url": f"{config.link_diretorio_nextcloud_publico}/icons/noticiario.svg",
                "cor_fundo": "#E7F1FF",
                "cor_texto": "#1351B4",
                "ordem": 1,
                "ativo": True,
            },
        )
        CardInformativo.objects.update_or_create(
            titulo="Agenda Institucional",
            defaults={
                "descricao": "Eventos e comunicados oficiais do ecossistema SIIA.",
                "link_url": "https://siia.gov.br/agenda",
                "icone": "calendar",
                "icone_url": f"{config.link_diretorio_nextcloud_publico}/icons/agenda.svg",
                "cor_fundo": "#E6F6EC",
                "cor_texto": "#168821",
                "ordem": 2,
                "ativo": True,
            },
        )
        CardInformativo.objects.update_or_create(
            titulo="Central de Atendimento",
            defaults={
                "descricao": "Canal de suporte para usuarios do portal.",
                "link_url": "https://siia.gov.br/atendimento",
                "icone": "help",
                "icone_url": f"{config.link_diretorio_nextcloud_publico}/icons/atendimento.svg",
                "cor_fundo": "#FFF4E5",
                "cor_texto": "#A05C00",
                "ordem": 3,
                "ativo": True,
            },
        )

        self.stdout.write(self.style.SUCCESS("Dados iniciais do CMS aplicados com sucesso."))
