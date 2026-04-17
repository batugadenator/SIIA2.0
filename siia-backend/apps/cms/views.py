import json
import logging
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache
from django.core.paginator import EmptyPage, Paginator
from django.db.models import Q
from django.utils import timezone
from rest_framework import parsers
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Artigo,
    CabecalhoHistorico,
    CabecalhoLinkExtra,
    CabecalhoWorkflow,
    CardInformativo,
    ConfiguracaoCabecalho,
    ConfiguracaoPortal,
    ConfiguracaoVisual,
    FontAwesomeIcon,
    Menu,
    Noticia,
)
from .permissions import CanAuthorizeNoticia, IsCMSAdmin, IsCMSUser, perfil_cms
from .serializers import MenuTreeSerializer


LOGGER = logging.getLogger("cms.audit")
PUBLIC_PAGE_CACHE_KEY = "cms_public_page"
PUBLIC_MENU_CACHE_KEY = "cms_public_menu"


class HealthView(APIView):
    def get(self, request):
        return Response({"module": "cms", "status": "ok"})


def serialize_menu_item(item: Menu) -> dict:
    return {
        "id": item.id,
        "titulo": item.titulo,
        "link_url": item.link_url,
        "abrir_em_nova_aba": item.abrir_em_nova_aba,
        "filhos": [
            serialize_menu_item(filho)
            for filho in item.filhos.filter(ativo=True).order_by("ordem", "id")
        ],
    }


def _normalizar_link_menu(link_url: str, abrir_em_nova_aba: bool) -> tuple[str | None, str | None]:
    """Valida URL/caminho para menus corporativos (interno, legado e Nextcloud)."""
    link = (link_url or "").strip()
    if not link:
        return None, "Campo 'link_url' é obrigatório."

    if link.startswith("/"):
        # Rotas internas da SPA são válidas e não precisam abrir em nova aba.
        return link, None

    parsed = urlparse(link)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None, "Use rota interna iniciando com '/' ou URL absoluta (http/https)."

    host = (parsed.netloc or "").split(":")[0].lower()

    nextcloud_hosts = set(getattr(settings, "CMS_ALLOWED_NEXTCLOUD_HOSTS", []))
    legacy_hosts = set(getattr(settings, "CMS_ALLOWED_LEGACY_HOSTS", []))
    external_hosts = set(getattr(settings, "CMS_ALLOWED_EXTERNAL_HOSTS", []))
    allowed_hosts = nextcloud_hosts.union(legacy_hosts).union(external_hosts)

    if nextcloud_hosts and host in nextcloud_hosts and not abrir_em_nova_aba:
        return None, "Links Nextcloud devem abrir em nova aba (abrir_em_nova_aba=True)."

    # Regra estrita por ambiente: quando listas são definidas, host externo deve estar permitido.
    if allowed_hosts and host not in allowed_hosts:
        return None, f"Domínio '{host}' não permitido para menu neste ambiente."

    return link, None


def _is_descendente(possivel_pai: Menu, menu_alvo: Menu) -> bool:
    """Retorna True se possivel_pai estiver dentro da subárvore de menu_alvo."""
    atual = possivel_pai
    while atual is not None:
        if atual.id == menu_alvo.id:
            return True
        atual = atual.parent
    return False


def _menu_depth(menu: Menu | None) -> int:
    depth = 0
    atual = menu
    while atual is not None:
        depth += 1
        atual = atual.parent
    return depth


def _menu_subtree_depth(menu: Menu) -> int:
    filhos = list(menu.filhos.all())
    if not filhos:
        return 1
    return 1 + max(_menu_subtree_depth(filho) for filho in filhos)


def _invalidate_public_cache() -> None:
    cache.delete(PUBLIC_PAGE_CACHE_KEY)
    cache.delete(PUBLIC_MENU_CACHE_KEY)


def _normalizar_link_cabecalho(link_url: str, abrir_em_nova_aba: bool) -> tuple[str | None, str | None]:
    link = (link_url or "").strip()
    if not link:
        return None, "Campo de URL é obrigatório."

    if link.startswith("/"):
        return link, None

    parsed = urlparse(link)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None, "Use rota interna iniciando com '/' ou URL absoluta (http/https)."

    if not abrir_em_nova_aba:
        return None, "Links externos do cabeçalho devem abrir em nova aba."

    return link, None


def _testar_disponibilidade_link(link_url: str) -> tuple[bool, str | None]:
    if not link_url or link_url.startswith("/"):
        return True, None
    try:
        req = Request(link_url, method="HEAD")
        with urlopen(req, timeout=4) as resp:  # nosec B310 - URL validada para http/https
            status = getattr(resp, "status", 200)
            if status >= 400:
                return False, f"Link indisponível: status HTTP {status}."
        return True, None
    except Exception as exc:
        return False, f"Falha de disponibilidade para '{link_url}': {exc}"  # noqa: BLE001


def _detectar_lang(request, config: ConfiguracaoCabecalho | None = None) -> str:
    lang_q = (request.query_params.get("lang") or "").strip().lower()
    if lang_q in {"pt-br", "en"}:
        return lang_q
    accept_lang = (request.headers.get("Accept-Language") or "").lower()
    if accept_lang.startswith("en"):
        return "en"
    if config and config.idioma_padrao == ConfiguracaoCabecalho.IDIOMA_EN:
        return "en"
    return "pt-br"


def _build_payload_from_models(config: ConfiguracaoCabecalho | None) -> dict:
    if not config:
        return {
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
                "servicos": {
                    "titulo": "Servicos",
                    "titulo_en": "Services",
                    "url": "/servicos",
                    "abrir_em_nova_aba": False,
                },
                "contato": {
                    "titulo": "Contato",
                    "titulo_en": "Contact",
                    "url": "/contato",
                    "abrir_em_nova_aba": False,
                },
                "estrutura": {
                    "titulo": "Estrutura Organizacional",
                    "titulo_en": "Organizational Structure",
                    "url": "/estrutura-organizacional",
                    "abrir_em_nova_aba": False,
                },
            },
            "links_extras": [],
        }

    return {
        "nome_instituicao": config.nome_instituicao,
        "nome_instituicao_en": config.nome_instituicao_en,
        "nome_orgao": config.nome_orgao,
        "nome_orgao_en": config.nome_orgao_en,
        "slogan": config.slogan,
        "slogan_en": config.slogan_en,
        "logo_url": config.logo_url,
        "link_logo_url": config.link_logo_url,
        "idioma_padrao": config.idioma_padrao,
        "links_fixos": {
            "inicio": {
                "titulo": config.link_inicio_titulo,
                "titulo_en": config.link_inicio_titulo_en,
                "url": config.link_inicio_url,
                "abrir_em_nova_aba": config.link_inicio_nova_aba,
            },
            "servicos": {
                "titulo": config.link_servicos_titulo,
                "titulo_en": config.link_servicos_titulo_en,
                "url": config.link_servicos_url,
                "abrir_em_nova_aba": config.link_servicos_nova_aba,
            },
            "contato": {
                "titulo": config.link_contato_titulo,
                "titulo_en": config.link_contato_titulo_en,
                "url": config.link_contato_url,
                "abrir_em_nova_aba": config.link_contato_nova_aba,
            },
            "estrutura": {
                "titulo": config.link_estrutura_titulo,
                "titulo_en": config.link_estrutura_titulo_en,
                "url": config.link_estrutura_url,
                "abrir_em_nova_aba": config.link_estrutura_nova_aba,
            },
        },
        "links_extras": [
            {
                "id": item.id,
                "titulo": item.titulo,
                "link_url": item.link_url,
                "ordem": item.ordem,
                "abrir_em_nova_aba": item.abrir_em_nova_aba,
                "ativo": item.ativo,
            }
            for item in config.links_extras.order_by("ordem", "id")
        ],
    }


def _serialize_public_header_from_payload(payload: dict, lang: str) -> dict:
    links_fixos = payload.get("links_fixos") or {}
    def _titulo(sec: dict):
        if lang == "en":
            return (sec.get("titulo_en") or sec.get("titulo") or "").strip()
        return (sec.get("titulo") or "").strip()

    links = []
    for key in ["inicio", "servicos", "contato", "estrutura"]:
        sec = links_fixos.get(key) or {}
        links.append(
            {
                "titulo": _titulo(sec),
                "url": (sec.get("url") or "").strip(),
                "abrir_em_nova_aba": bool(sec.get("abrir_em_nova_aba", False)),
            }
        )

    links_extras = payload.get("links_extras") or []
    for item in sorted(links_extras, key=lambda x: (int(x.get("ordem", 0)), str(x.get("titulo", "")))):
        if not item.get("ativo", True):
            continue
        links.append(
            {
                "titulo": (item.get("titulo") or "").strip(),
                "url": (item.get("link_url") or "").strip(),
                "abrir_em_nova_aba": bool(item.get("abrir_em_nova_aba", False)),
            }
        )

    nome_instituicao = payload.get("nome_instituicao_en") if lang == "en" else payload.get("nome_instituicao")
    nome_orgao = payload.get("nome_orgao_en") if lang == "en" else payload.get("nome_orgao")
    slogan = payload.get("slogan_en") if lang == "en" else payload.get("slogan")

    return {
        "nome_instituicao": (nome_instituicao or "").strip(),
        "nome_orgao": (nome_orgao or "").strip(),
        "slogan": (slogan or "").strip(),
        "logo_url": (payload.get("logo_url") or "").strip(),
        "link_logo_url": (payload.get("link_logo_url") or "/").strip() or "/",
        "idioma": lang,
        "links": links,
    }


def _payload_diff(before_payload: dict, after_payload: dict) -> str:
    before = json.dumps(before_payload or {}, ensure_ascii=True, sort_keys=True, indent=2)
    after = json.dumps(after_payload or {}, ensure_ascii=True, sort_keys=True, indent=2)
    if before == after:
        return "Sem alteracoes"
    return f"--- before\n{before}\n--- after\n{after}"


def _registrar_historico_cabecalho(acao: str, actor, before_payload: dict, after_payload: dict) -> None:
    diff = _payload_diff(before_payload, after_payload)
    CabecalhoHistorico.objects.create(
        acao=acao,
        actor=actor,
        before_payload=before_payload or {},
        after_payload=after_payload or {},
        diff_text=diff,
    )
    LOGGER.info(
        "cms_cabecalho_event",
        extra={
            "event": "cms_cabecalho_event",
            "acao": acao,
            "actor_id": getattr(actor, "id", None),
            "timestamp": timezone.now().isoformat(),
        },
    )


class PublicPageView(APIView):
    def get(self, request):
        lang = _detectar_lang(request)
        cache_key = f"{PUBLIC_PAGE_CACHE_KEY}:{lang}"
        cached_payload = cache.get(cache_key)
        if cached_payload:
            return Response(cached_payload)

        config = ConfiguracaoPortal.objects.filter(ativo=True).first()
        cabecalho = ConfiguracaoCabecalho.objects.filter(ativo=True).first()
        workflow = CabecalhoWorkflow.objects.filter(pk=1).first()
        payload_header = workflow.payload if workflow and workflow.status == CabecalhoWorkflow.STATUS_PUBLICADO else _build_payload_from_models(cabecalho)
        menus = Menu.objects.filter(ativo=True, parent__isnull=True).prefetch_related("filhos")
        artigos = Artigo.objects.filter(publicado=True)[:6]
        noticias = Noticia.objects.filter(is_destaque=True, status=Noticia.STATUS_PUBLICADO)[:6]
        cards = CardInformativo.objects.filter(ativo=True)

        payload = {
            "configuracao": {
                "nome_portal": config.nome_portal if config else "SIIA 2.0",
                "logo_url": config.logo_url if config else "",
                "cor_primaria": config.cor_primaria if config else "#1351B4",
                "cor_secundaria": config.cor_secundaria if config else "#2670E8",
                "nextcloud_publico": config.link_diretorio_nextcloud_publico if config else "",
                "nextcloud_interno": config.link_diretorio_nextcloud_interno if config else "",
            },
            "cabecalho": _serialize_public_header_from_payload(payload_header, lang),
            "menus": [serialize_menu_item(menu) for menu in menus],
            "artigos": [
                {
                    "id": artigo.id,
                    "titulo": artigo.titulo,
                    "resumo": artigo.resumo,
                    "conteudo": artigo.conteudo,
                    "imagem_url": artigo.imagem_url,
                    "link_externo": artigo.link_externo,
                    "destaque": artigo.destaque,
                    "publicado_em": artigo.publicado_em,
                }
                for artigo in artigos
            ],
            "noticias": [
                {
                    "id": noticia.id,
                    "titulo": noticia.titulo,
                    "imagem_url": noticia.imagem_url,
                    "categoria_texto": noticia.categoria_texto,
                    "data_publicacao": noticia.data_publicacao,
                    "conteudo": noticia.conteudo,
                    "is_destaque": noticia.is_destaque,
                }
                for noticia in noticias
            ],
            "cards": [
                {
                    "id": card.id,
                    "titulo": card.titulo,
                    "descricao": card.descricao,
                    "link_url": card.link_url,
                    "icone": card.icone,
                    "icone_url": card.icone_url,
                    "cor_fundo": card.cor_fundo,
                    "cor_texto": card.cor_texto,
                }
                for card in cards
            ],
        }

        cache.set(cache_key, payload, 60)
        return Response(payload)


class PublicMenuView(APIView):
    def get(self, request):
        cached_payload = cache.get(PUBLIC_MENU_CACHE_KEY)
        if cached_payload:
            return Response(cached_payload)
        # Entrega somente nós raiz; submenus são serializados recursivamente.
        menus_raiz = Menu.objects.filter(ativo=True, parent__isnull=True).order_by("ordem", "id")
        payload = MenuTreeSerializer(menus_raiz, many=True).data
        cache.set(PUBLIC_MENU_CACHE_KEY, payload, 60)
        return Response(payload)


class PublicNoticiasView(APIView):
    def get(self, request):
        categoria_texto = (request.query_params.get("categoria_texto") or "").strip()
        q = (request.query_params.get("q") or "").strip()

        try:
            page = int(request.query_params.get("page", 1))
        except (TypeError, ValueError):
            page = 1

        try:
            page_size = int(request.query_params.get("page_size", 12))
        except (TypeError, ValueError):
            page_size = 12

        page = max(page, 1)
        page_size = max(1, min(page_size, 50))

        queryset = Noticia.objects.filter(is_destaque=True, status=Noticia.STATUS_PUBLICADO)
        if categoria_texto:
            queryset = queryset.filter(categoria_texto__iexact=categoria_texto)
        if q:
            queryset = queryset.filter(
                Q(titulo__icontains=q)
                | Q(conteudo__icontains=q)
                | Q(categoria_texto__icontains=q)
            )

        paginator = Paginator(queryset, page_size)

        try:
            page_obj = paginator.page(page)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages) if paginator.count > 0 else []

        results = []
        if page_obj:
            results = [
                {
                    "id": noticia.id,
                    "titulo": noticia.titulo,
                    "imagem_url": noticia.imagem_url,
                    "categoria_texto": noticia.categoria_texto,
                    "data_publicacao": noticia.data_publicacao,
                    "conteudo": noticia.conteudo,
                    "is_destaque": noticia.is_destaque,
                }
                for noticia in page_obj.object_list
            ]

        categorias = list(
            Noticia.objects.filter(is_destaque=True, status=Noticia.STATUS_PUBLICADO)
            .values_list("categoria_texto", flat=True)
            .distinct()
            .order_by("categoria_texto")
        )

        payload = {
            "count": paginator.count,
            "page": page_obj.number if page_obj else 1,
            "page_size": page_size,
            "total_pages": paginator.num_pages,
            "next": page_obj.has_next() if page_obj else False,
            "previous": page_obj.has_previous() if page_obj else False,
            "categoria_texto": categoria_texto,
            "q": q,
            "categorias_disponiveis": categorias,
            "results": results,
        }

        return Response(payload)


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints autenticados do módulo CMS
# ─────────────────────────────────────────────────────────────────────────────

def _serializar_noticia(n: Noticia) -> dict:
    return {
        "id": n.id,
        "titulo": n.titulo,
        "imagem_url": n.imagem_url,
        "categoria_texto": n.categoria_texto,
        "data_publicacao": n.data_publicacao,
        "conteudo": n.conteudo,
        "is_destaque": n.is_destaque,
        "status": n.status,
        "autor": n.autor_id,
        "autor_nome": f"{n.autor.get_full_name() or n.autor.username}" if n.autor else None,
        "homologado_por": n.homologado_por_id,
        "homologado_por_nome": (
            f"{n.homologado_por.get_full_name() or n.homologado_por.username}"
            if n.homologado_por
            else None
        ),
        "homologado_em": n.homologado_em,
    }


class MePerfilCMSView(APIView):
    """Retorna dados do usuário + perfil CMS e permissões relevantes."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        perfil = perfil_cms(user)
        pode_autorizar = user.has_perm("cms.can_authorize_noticia") or perfil in ("admin", "homologador")
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "full_name": user.get_full_name(),
                "perfil_cms": perfil,
                "pode_autorizar": pode_autorizar,
                "is_admin_cms": perfil == "admin",
            }
        )


class NoticiaListCreateView(APIView):
    """GET: lista notícias conforme perfil. POST: cria notícia (status=rascunho)."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSUser]

    def get(self, request):
        perfil = perfil_cms(request.user)
        status_filter = (request.query_params.get("status") or "").strip().lower()
        valid_statuses = {s[0] for s in Noticia.STATUS_CHOICES}

        qs = Noticia.objects.select_related("autor", "homologado_por").all()

        # Publicadores só veem as próprias; admins/homologadores veem tudo
        if perfil == "publicador":
            qs = qs.filter(autor=request.user)

        if status_filter and status_filter in valid_statuses:
            qs = qs.filter(status=status_filter)

        return Response([_serializar_noticia(n) for n in qs])

    def post(self, request):
        data = request.data
        titulo = (data.get("titulo") or "").strip()
        if not titulo:
            return Response({"erro": "O campo 'titulo' é obrigatório."}, status=400)

        noticia = Noticia.objects.create(
            titulo=titulo,
            imagem_url=(data.get("imagem_url") or "").strip(),
            categoria_texto=(data.get("categoria_texto") or "Geral").strip(),
            conteudo=(data.get("conteudo") or "").strip(),
            is_destaque=bool(data.get("is_destaque", True)),
            status=Noticia.STATUS_RASCUNHO,
            autor=request.user,
        )
        return Response(_serializar_noticia(noticia), status=201)


class NoticiaDetailView(APIView):
    """GET / PUT / DELETE notícia por ID."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSUser]

    def _get_or_403(self, pk, user):
        try:
            n = Noticia.objects.select_related("autor", "homologado_por").get(pk=pk)
        except Noticia.DoesNotExist:
            return None, Response({"erro": "Notícia não encontrada."}, status=404)
        perfil = perfil_cms(user)
        if perfil == "publicador" and n.autor_id != user.id:
            return None, Response({"erro": "Sem permissão para esta notícia."}, status=403)
        return n, None

    def get(self, request, pk):
        n, err = self._get_or_403(pk, request.user)
        if err:
            return err
        return Response(_serializar_noticia(n))

    def put(self, request, pk):
        n, err = self._get_or_403(pk, request.user)
        if err:
            return err
        if n.status == Noticia.STATUS_PUBLICADO:
            perfil = perfil_cms(request.user)
            if perfil not in ("admin", "homologador"):
                return Response({"erro": "Notícias publicadas só podem ser editadas por admins/homologadores."}, status=403)

        data = request.data
        n.titulo = (data.get("titulo") or n.titulo).strip()
        n.imagem_url = data.get("imagem_url", n.imagem_url)
        n.categoria_texto = (data.get("categoria_texto") or n.categoria_texto).strip()
        n.conteudo = data.get("conteudo", n.conteudo)
        n.is_destaque = bool(data.get("is_destaque", n.is_destaque))
        n.save(update_fields=["titulo", "imagem_url", "categoria_texto", "conteudo", "is_destaque"])
        return Response(_serializar_noticia(n))

    def delete(self, request, pk):
        n, err = self._get_or_403(pk, request.user)
        if err:
            return err
        n.delete()
        return Response(status=204)


class NoticiaSubmeterView(APIView):
    """POST: publicador submete notícia para homologação (rascunho → pendente)."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSUser]

    def post(self, request, pk):
        try:
            n = Noticia.objects.get(pk=pk)
        except Noticia.DoesNotExist:
            return Response({"erro": "Notícia não encontrada."}, status=404)

        perfil = perfil_cms(request.user)
        if perfil == "publicador" and n.autor_id != request.user.id:
            return Response({"erro": "Sem permissão."}, status=403)
        if n.status != Noticia.STATUS_RASCUNHO:
            return Response({"erro": f"Apenas rascunhos podem ser submetidos. Status atual: {n.status}"}, status=400)

        n.status = Noticia.STATUS_PENDENTE
        n.save(update_fields=["status"])
        return Response(_serializar_noticia(n))


class NoticiaAutorizarView(APIView):
    """POST: homologador/admin autoriza publicação (pendente → publicado)."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, CanAuthorizeNoticia]

    def post(self, request, pk):
        try:
            n = Noticia.objects.get(pk=pk)
        except Noticia.DoesNotExist:
            return Response({"erro": "Notícia não encontrada."}, status=404)

        if n.status != Noticia.STATUS_PENDENTE:
            return Response({"erro": f"Apenas pendentes podem ser autorizadas. Status atual: {n.status}"}, status=400)

        n.status = Noticia.STATUS_PUBLICADO
        n.homologado_por = request.user
        n.homologado_em = timezone.now()
        n.save(update_fields=["status", "homologado_por", "homologado_em"])
        return Response(_serializar_noticia(n))


class MenuAdminListCreateView(APIView):
    """Admin-only: lista e cria menus do portal."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def _serializar(self, m: Menu) -> dict:
        return {
            "id": m.id,
            "titulo": m.titulo,
            "link_url": m.link_url,
            "icone_classe": m.icone_classe,
            "parent": m.parent_id,
            "ordem": m.ordem,
            "abrir_em_nova_aba": m.abrir_em_nova_aba,
            "ativo": m.ativo,
            "num_filhos": m.filhos.count() if hasattr(m, "filhos") else 0,
        }

    def get(self, request):
        menus = Menu.objects.select_related("parent").order_by("ordem", "id")
        return Response([self._serializar(m) for m in menus])

    def post(self, request):
        data = request.data
        titulo = (data.get("titulo") or "").strip()
        raw_link_url = (data.get("link_url") or "").strip()
        abrir_em_nova_aba = bool(data.get("abrir_em_nova_aba", False))
        if not titulo or not raw_link_url:
            return Response({"erro": "Campos 'titulo' e 'link_url' são obrigatórios."}, status=400)

        link_url, link_error = _normalizar_link_menu(raw_link_url, abrir_em_nova_aba)
        if link_error:
            return Response({"erro": link_error}, status=400)

        parent_id = data.get("parent")
        parent = None
        if parent_id:
            try:
                parent = Menu.objects.get(pk=parent_id)
            except Menu.DoesNotExist:
                return Response({"erro": "Parent não encontrado."}, status=400)

        if parent is None:
            total_raiz = Menu.objects.filter(parent__isnull=True).count()
            if total_raiz >= 8:
                return Response(
                    {"erro": "Limite de 8 menus raiz atingido para o padrão DSGov."},
                    status=400,
                )

        novo_depth = _menu_depth(parent) + 1 if parent else 1
        if novo_depth > 4:
            return Response(
                {"erro": "Profundidade máxima permitida para menu é 4 níveis (DSGov)."},
                status=400,
            )

        menu = Menu.objects.create(
            titulo=titulo,
            link_url=link_url,
            icone_classe=(data.get("icone_classe") or "").strip(),
            parent=parent,
            ordem=int(data.get("ordem", 0)),
            abrir_em_nova_aba=abrir_em_nova_aba,
            ativo=bool(data.get("ativo", True)),
        )
        _invalidate_public_cache()
        return Response(self._serializar(menu), status=201)


class MenuAdminDetailView(APIView):
    """Admin-only: detalhe, edição e remoção de menu."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def _serializar(self, m: Menu) -> dict:
        return {
            "id": m.id,
            "titulo": m.titulo,
            "link_url": m.link_url,
            "icone_classe": m.icone_classe,
            "parent": m.parent_id,
            "ordem": m.ordem,
            "abrir_em_nova_aba": m.abrir_em_nova_aba,
            "ativo": m.ativo,
        }

    def get(self, request, pk):
        try:
            m = Menu.objects.get(pk=pk)
        except Menu.DoesNotExist:
            return Response({"erro": "Menu não encontrado."}, status=404)
        return Response(self._serializar(m))

    def put(self, request, pk):
        try:
            m = Menu.objects.get(pk=pk)
        except Menu.DoesNotExist:
            return Response({"erro": "Menu não encontrado."}, status=404)
        data = request.data
        m.titulo = (data.get("titulo") or m.titulo).strip()
        abrir_em_nova_aba = bool(data.get("abrir_em_nova_aba", m.abrir_em_nova_aba))
        link_url, link_error = _normalizar_link_menu((data.get("link_url") or m.link_url).strip(), abrir_em_nova_aba)
        if link_error:
            return Response({"erro": link_error}, status=400)
        m.link_url = link_url
        m.icone_classe = data.get("icone_classe", m.icone_classe)
        m.ordem = int(data.get("ordem", m.ordem))
        m.abrir_em_nova_aba = abrir_em_nova_aba
        m.ativo = bool(data.get("ativo", m.ativo))
        parent_id = data.get("parent")
        if parent_id is not None:
            if parent_id == "" or parent_id == 0:
                if m.parent_id is not None:
                    total_raiz = Menu.objects.filter(parent__isnull=True).exclude(pk=m.id).count()
                    if total_raiz >= 8:
                        return Response(
                            {"erro": "Limite de 8 menus raiz atingido para o padrão DSGov."},
                            status=400,
                        )
                m.parent = None
            else:
                try:
                    novo_parent = Menu.objects.get(pk=parent_id)
                except Menu.DoesNotExist:
                    return Response({"erro": "Parent não encontrado."}, status=400)
                if novo_parent.id == m.id:
                    return Response({"erro": "Um menu não pode ser pai de si mesmo."}, status=400)
                if _is_descendente(novo_parent, m):
                    return Response({"erro": "Hierarquia inválida: ciclo detectado na árvore de menus."}, status=400)

                novo_depth = _menu_depth(novo_parent) + _menu_subtree_depth(m)
                if novo_depth > 4:
                    return Response(
                        {"erro": "Profundidade máxima permitida para menu é 4 níveis (DSGov)."},
                        status=400,
                    )
                m.parent = novo_parent
        m.save()
        _invalidate_public_cache()
        return Response(self._serializar(m))

    def delete(self, request, pk):
        try:
            m = Menu.objects.get(pk=pk)
        except Menu.DoesNotExist:
            return Response({"erro": "Menu não encontrado."}, status=404)
        m.delete()
        _invalidate_public_cache()
        return Response(status=204)


class ConfiguracaoVisualListCreateView(APIView):
    """Admin-only: lista e cria configurações visuais (SVGs)."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def _serializar(self, cv: ConfiguracaoVisual) -> dict:
        return {"id": cv.id, "chave": cv.chave, "valor_svg": cv.valor_svg, "descricao": cv.descricao}

    def get(self, request):
        return Response([self._serializar(cv) for cv in ConfiguracaoVisual.objects.all().order_by("chave")])

    def post(self, request):
        data = request.data
        chave = (data.get("chave") or "").strip()
        valor_svg = (data.get("valor_svg") or "").strip()
        descricao = (data.get("descricao") or "").strip()
        if not chave or not valor_svg:
            return Response({"erro": "Campos 'chave' e 'valor_svg' são obrigatórios."}, status=400)
        if ConfiguracaoVisual.objects.filter(chave=chave).exists():
            return Response({"erro": f"Já existe uma configuração com a chave '{chave}'."}, status=400)
        cv = ConfiguracaoVisual.objects.create(chave=chave, valor_svg=valor_svg, descricao=descricao)
        return Response(self._serializar(cv), status=201)


class ConfiguracaoVisualDetailView(APIView):
    """Admin-only: detalhe, edição e remoção de configuração visual."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def _serializar(self, cv: ConfiguracaoVisual) -> dict:
        return {"id": cv.id, "chave": cv.chave, "valor_svg": cv.valor_svg, "descricao": cv.descricao}

    def get(self, request, pk):
        try:
            cv = ConfiguracaoVisual.objects.get(pk=pk)
        except ConfiguracaoVisual.DoesNotExist:
            return Response({"erro": "Configuração não encontrada."}, status=404)
        return Response(self._serializar(cv))

    def put(self, request, pk):
        try:
            cv = ConfiguracaoVisual.objects.get(pk=pk)
        except ConfiguracaoVisual.DoesNotExist:
            return Response({"erro": "Configuração não encontrada."}, status=404)
        data = request.data
        cv.valor_svg = (data.get("valor_svg") or cv.valor_svg).strip()
        cv.descricao = (data.get("descricao") or cv.descricao).strip()
        cv.save(update_fields=["valor_svg", "descricao"])
        return Response(self._serializar(cv))

    def delete(self, request, pk):
        try:
            cv = ConfiguracaoVisual.objects.get(pk=pk)
        except ConfiguracaoVisual.DoesNotExist:
            return Response({"erro": "Configuração não encontrada."}, status=404)
        cv.delete()
        return Response(status=204)


class FontAwesomeIconListView(APIView):
    """Admin-only: lista catálogo de ícones Font Awesome para seleção em menus."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def get(self, request):
        style = (request.query_params.get("style") or "").strip().lower()
        q = (request.query_params.get("q") or "").strip()
        limit_param = (request.query_params.get("limit") or "200").strip()

        try:
            limit = max(1, min(int(limit_param), 500))
        except ValueError:
            limit = 200

        qs = FontAwesomeIcon.objects.filter(ativo=True)
        if style in {"fas", "fab"}:
            qs = qs.filter(style=style)
        if q:
            qs = qs.filter(Q(label__icontains=q) | Q(icon_name__icontains=q) | Q(class_name__icontains=q))

        itens = qs.order_by("style", "label", "icon_name")[:limit]
        return Response(
            [
                {
                    "id": item.id,
                    "style": item.style,
                    "icon_name": item.icon_name,
                    "class_name": item.class_name,
                    "label": item.label,
                    "version": item.version,
                }
                for item in itens
            ]
        )


class CabecalhoAdminView(APIView):
    """Admin-only: retorna/edita rascunho do cabeçalho público DSGov."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def get(self, request):
        config, _ = ConfiguracaoCabecalho.objects.get_or_create(pk=1)
        workflow, _ = CabecalhoWorkflow.objects.get_or_create(
            pk=1,
            defaults={
                "payload": _build_payload_from_models(config),
                "status": CabecalhoWorkflow.STATUS_PUBLICADO,
            },
        )
        return Response(
            {
                "id": config.id,
                "publicado": _build_payload_from_models(config),
                "rascunho": workflow.payload,
                "status": workflow.status,
                "submetido_em": workflow.submetido_em,
                "homologado_em": workflow.homologado_em,
                "autor": workflow.autor_id,
                "homologado_por": workflow.homologado_por_id,
            }
        )

    def put(self, request):
        config, _ = ConfiguracaoCabecalho.objects.get_or_create(pk=1)
        workflow, _ = CabecalhoWorkflow.objects.get_or_create(
            pk=1,
            defaults={
                "payload": _build_payload_from_models(config),
                "status": CabecalhoWorkflow.STATUS_RASCUNHO,
            },
        )
        data = request.data or {}

        payload = {
            "nome_instituicao": (data.get("nome_instituicao") or "").strip(),
            "nome_instituicao_en": (data.get("nome_instituicao_en") or "").strip(),
            "nome_orgao": (data.get("nome_orgao") or "").strip(),
            "nome_orgao_en": (data.get("nome_orgao_en") or "").strip(),
            "slogan": (data.get("slogan") or "").strip(),
            "slogan_en": (data.get("slogan_en") or "").strip(),
            "logo_url": (data.get("logo_url") or "").strip(),
            "link_logo_url": (data.get("link_logo_url") or "/").strip() or "/",
            "idioma_padrao": (data.get("idioma_padrao") or "pt-br").strip().lower(),
            "links_fixos": data.get("links_fixos") or {},
            "links_extras": data.get("links_extras") or [],
        }

        if payload["idioma_padrao"] not in {"pt-br", "en"}:
            return Response({"erro": "idioma_padrao deve ser 'pt-br' ou 'en'."}, status=400)

        if not payload["nome_instituicao"] or not payload["nome_orgao"] or not payload["slogan"]:
            return Response(
                {"erro": "Nome da instituição, nome do órgão e slogan são obrigatórios."},
                status=400,
            )

        links_for_check = []
        for key in ["inicio", "servicos", "contato", "estrutura"]:
            sec = payload["links_fixos"].get(key) or {}
            titulo = (sec.get("titulo") or "").strip()
            url = (sec.get("url") or "").strip()
            abrir = bool(sec.get("abrir_em_nova_aba", False))
            if not titulo or not url:
                return Response({"erro": f"Link fixo '{key}' deve ter titulo e url."}, status=400)
            normalizado, err = _normalizar_link_cabecalho(url, abrir)
            if err:
                return Response({"erro": f"{key}: {err}"}, status=400)
            sec["url"] = normalizado
            links_for_check.append((normalizado, abrir))

        if len(payload["links_extras"]) > 8:
            return Response({"erro": "Limite máximo de 8 links extras no cabeçalho."}, status=400)

        for idx, item in enumerate(payload["links_extras"]):
            titulo = (item.get("titulo") or "").strip()
            link_url = (item.get("link_url") or "").strip()
            if not titulo or not link_url:
                return Response({"erro": f"Link extra #{idx + 1} deve ter titulo e link_url."}, status=400)
            normalizado, err = _normalizar_link_cabecalho(link_url, bool(item.get("abrir_em_nova_aba", False)))
            if err:
                return Response({"erro": f"Link extra #{idx + 1}: {err}"}, status=400)
            item["link_url"] = normalizado
            links_for_check.append((normalizado, bool(item.get("abrir_em_nova_aba", False))))

        warnings = []
        for link_url, _abrir in links_for_check:
            ok, warn = _testar_disponibilidade_link(link_url)
            if not ok and warn:
                warnings.append(warn)

        before = workflow.payload or {}
        workflow.payload = payload
        workflow.status = CabecalhoWorkflow.STATUS_RASCUNHO
        workflow.autor = request.user
        workflow.save(update_fields=["payload", "status", "autor", "atualizado_em"])

        _registrar_historico_cabecalho(CabecalhoHistorico.ACAO_RASCUNHO, request.user, before, payload)

        return Response(
            {
                "status": workflow.status,
                "rascunho": workflow.payload,
                "warnings": warnings,
            }
        )


class CabecalhoSubmeterView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSUser]

    def post(self, request):
        config, _ = ConfiguracaoCabecalho.objects.get_or_create(pk=1)
        workflow, _ = CabecalhoWorkflow.objects.get_or_create(
            pk=1,
            defaults={"payload": _build_payload_from_models(config)},
        )
        if not workflow.payload:
            return Response({"erro": "Não há rascunho para submeter."}, status=400)

        before = workflow.payload
        workflow.status = CabecalhoWorkflow.STATUS_PENDENTE
        workflow.submetido_em = timezone.now()
        workflow.save(update_fields=["status", "submetido_em", "atualizado_em"])
        _registrar_historico_cabecalho(CabecalhoHistorico.ACAO_SUBMETIDO, request.user, before, workflow.payload)
        return Response({"status": workflow.status, "submetido_em": workflow.submetido_em})


class CabecalhoAutorizarView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, CanAuthorizeNoticia]

    def post(self, request):
        config, _ = ConfiguracaoCabecalho.objects.get_or_create(pk=1)
        workflow = CabecalhoWorkflow.objects.filter(pk=1).first()
        if not workflow or not workflow.payload:
            return Response({"erro": "Não há rascunho pendente para publicar."}, status=400)
        if workflow.status != CabecalhoWorkflow.STATUS_PENDENTE:
            return Response({"erro": "Apenas rascunhos pendentes podem ser publicados."}, status=400)

        payload = workflow.payload
        links_fixos = payload.get("links_fixos") or {}

        config.nome_instituicao = (payload.get("nome_instituicao") or config.nome_instituicao).strip()
        config.nome_instituicao_en = (payload.get("nome_instituicao_en") or config.nome_instituicao_en).strip()
        config.nome_orgao = (payload.get("nome_orgao") or config.nome_orgao).strip()
        config.nome_orgao_en = (payload.get("nome_orgao_en") or config.nome_orgao_en).strip()
        config.slogan = (payload.get("slogan") or config.slogan).strip()
        config.slogan_en = (payload.get("slogan_en") or config.slogan_en).strip()
        config.logo_url = (payload.get("logo_url") or "").strip()
        config.link_logo_url = (payload.get("link_logo_url") or "/").strip() or "/"
        config.idioma_padrao = (payload.get("idioma_padrao") or "pt-br").strip().lower()

        inicio = links_fixos.get("inicio") or {}
        servicos = links_fixos.get("servicos") or {}
        contato = links_fixos.get("contato") or {}
        estrutura = links_fixos.get("estrutura") or {}

        config.link_inicio_titulo = (inicio.get("titulo") or config.link_inicio_titulo).strip()
        config.link_inicio_titulo_en = (inicio.get("titulo_en") or config.link_inicio_titulo_en).strip()
        config.link_inicio_url = (inicio.get("url") or config.link_inicio_url).strip()
        config.link_inicio_nova_aba = bool(inicio.get("abrir_em_nova_aba", config.link_inicio_nova_aba))

        config.link_servicos_titulo = (servicos.get("titulo") or config.link_servicos_titulo).strip()
        config.link_servicos_titulo_en = (servicos.get("titulo_en") or config.link_servicos_titulo_en).strip()
        config.link_servicos_url = (servicos.get("url") or config.link_servicos_url).strip()
        config.link_servicos_nova_aba = bool(servicos.get("abrir_em_nova_aba", config.link_servicos_nova_aba))

        config.link_contato_titulo = (contato.get("titulo") or config.link_contato_titulo).strip()
        config.link_contato_titulo_en = (contato.get("titulo_en") or config.link_contato_titulo_en).strip()
        config.link_contato_url = (contato.get("url") or config.link_contato_url).strip()
        config.link_contato_nova_aba = bool(contato.get("abrir_em_nova_aba", config.link_contato_nova_aba))

        config.link_estrutura_titulo = (estrutura.get("titulo") or config.link_estrutura_titulo).strip()
        config.link_estrutura_titulo_en = (estrutura.get("titulo_en") or config.link_estrutura_titulo_en).strip()
        config.link_estrutura_url = (estrutura.get("url") or config.link_estrutura_url).strip()
        config.link_estrutura_nova_aba = bool(estrutura.get("abrir_em_nova_aba", config.link_estrutura_nova_aba))

        before_publicado = _build_payload_from_models(config)
        config.save()

        CabecalhoLinkExtra.objects.filter(configuracao=config).delete()
        extras = payload.get("links_extras") or []
        for item in extras:
            CabecalhoLinkExtra.objects.create(
                configuracao=config,
                titulo=(item.get("titulo") or "").strip(),
                link_url=(item.get("link_url") or "").strip(),
                ordem=int(item.get("ordem", 0)),
                abrir_em_nova_aba=bool(item.get("abrir_em_nova_aba", False)),
                ativo=bool(item.get("ativo", True)),
            )

        workflow.status = CabecalhoWorkflow.STATUS_PUBLICADO
        workflow.homologado_por = request.user
        workflow.homologado_em = timezone.now()
        workflow.save(update_fields=["status", "homologado_por", "homologado_em", "atualizado_em"])

        _registrar_historico_cabecalho(CabecalhoHistorico.ACAO_PUBLICADO, request.user, before_publicado, payload)
        _invalidate_public_cache()
        return Response({"status": workflow.status, "homologado_em": workflow.homologado_em})


class CabecalhoHistoricoListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def get(self, request):
        historico = CabecalhoHistorico.objects.select_related("actor")[:100]
        return Response(
            [
                {
                    "id": item.id,
                    "acao": item.acao,
                    "actor": item.actor_id,
                    "actor_nome": (
                        f"{item.actor.get_full_name() or item.actor.username}"
                        if item.actor
                        else None
                    ),
                    "criado_em": item.criado_em,
                    "diff_text": item.diff_text,
                }
                for item in historico
            ]
        )


class CabecalhoLinkExtraListCreateView(APIView):
    """Admin-only: CRUD da lista de links extras no rascunho (máx. 8)."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def post(self, request):
        config, _ = ConfiguracaoCabecalho.objects.get_or_create(pk=1)
        workflow, _ = CabecalhoWorkflow.objects.get_or_create(
            pk=1,
            defaults={"payload": _build_payload_from_models(config)},
        )
        data = request.data or {}
        extras = list((workflow.payload or {}).get("links_extras") or [])
        if len(extras) >= 8:
            return Response({"erro": "Limite máximo de 8 links extras no cabeçalho."}, status=400)

        titulo = (data.get("titulo") or "").strip()
        link_url = (data.get("link_url") or "").strip()
        if not titulo or not link_url:
            return Response({"erro": "Campos 'titulo' e 'link_url' são obrigatórios."}, status=400)

        abrir = bool(data.get("abrir_em_nova_aba", False))
        normalizado, err = _normalizar_link_cabecalho(link_url, abrir)
        if err:
            return Response({"erro": err}, status=400)

        item = {
            "id": int(timezone.now().timestamp() * 1000),
            "titulo": titulo,
            "link_url": normalizado,
            "ordem": int(data.get("ordem", 0)),
            "abrir_em_nova_aba": abrir,
            "ativo": bool(data.get("ativo", True)),
        }
        extras.append(item)
        payload = workflow.payload or {}
        payload["links_extras"] = extras
        workflow.payload = payload
        workflow.status = CabecalhoWorkflow.STATUS_RASCUNHO
        workflow.autor = request.user
        workflow.save(update_fields=["payload", "status", "autor", "atualizado_em"])
        return Response(item, status=201)


class CabecalhoLinkExtraDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def put(self, request, pk):
        config, _ = ConfiguracaoCabecalho.objects.get_or_create(pk=1)
        workflow, _ = CabecalhoWorkflow.objects.get_or_create(
            pk=1,
            defaults={"payload": _build_payload_from_models(config)},
        )
        payload = workflow.payload or {}
        extras = list(payload.get("links_extras") or [])
        data = request.data or {}

        found = False
        for item in extras:
            if int(item.get("id", 0)) != int(pk):
                continue
            found = True
            titulo = (data.get("titulo") or item.get("titulo") or "").strip()
            link_url = (data.get("link_url") or item.get("link_url") or "").strip()
            abrir = bool(data.get("abrir_em_nova_aba", item.get("abrir_em_nova_aba", False)))
            if not titulo or not link_url:
                return Response({"erro": "Campos 'titulo' e 'link_url' são obrigatórios."}, status=400)
            normalizado, err = _normalizar_link_cabecalho(link_url, abrir)
            if err:
                return Response({"erro": err}, status=400)

            item["titulo"] = titulo
            item["link_url"] = normalizado
            item["ordem"] = int(data.get("ordem", item.get("ordem", 0)))
            item["abrir_em_nova_aba"] = abrir
            item["ativo"] = bool(data.get("ativo", item.get("ativo", True)))

        if not found:
            return Response({"erro": "Link extra não encontrado no rascunho."}, status=404)

        payload["links_extras"] = extras
        workflow.payload = payload
        workflow.status = CabecalhoWorkflow.STATUS_RASCUNHO
        workflow.autor = request.user
        workflow.save(update_fields=["payload", "status", "autor", "atualizado_em"])
        return Response({"ok": True})

    def delete(self, request, pk):
        config, _ = ConfiguracaoCabecalho.objects.get_or_create(pk=1)
        workflow, _ = CabecalhoWorkflow.objects.get_or_create(
            pk=1,
            defaults={"payload": _build_payload_from_models(config)},
        )
        payload = workflow.payload or {}
        extras = list(payload.get("links_extras") or [])
        filtered = [item for item in extras if int(item.get("id", 0)) != int(pk)]
        if len(filtered) == len(extras):
            return Response({"erro": "Link extra não encontrado no rascunho."}, status=404)

        payload["links_extras"] = filtered
        workflow.payload = payload
        workflow.status = CabecalhoWorkflow.STATUS_RASCUNHO
        workflow.autor = request.user
        workflow.save(update_fields=["payload", "status", "autor", "atualizado_em"])
        return Response(status=204)


class CMSImageUploadView(APIView):
    """Upload de imagem para uso em notícias e cabeçalho CMS."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSUser]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        arquivo = request.FILES.get("file")
        if not arquivo:
            return Response({"erro": "Arquivo não enviado (campo 'file')."}, status=400)

        ext = Path(arquivo.name).suffix.lower()
        if ext not in {".png", ".jpg", ".jpeg", ".webp", ".svg"}:
            return Response({"erro": "Formato inválido. Use PNG, JPG, JPEG, WEBP ou SVG."}, status=400)

        media_root = Path(getattr(settings, "MEDIA_ROOT", Path(settings.BASE_DIR) / "media"))
        target_dir = media_root / "cms_uploads"
        target_dir.mkdir(parents=True, exist_ok=True)

        safe_name = f"{timezone.now().strftime('%Y%m%d%H%M%S%f')}{ext}"
        target_path = target_dir / safe_name
        with target_path.open("wb") as f:
            for chunk in arquivo.chunks():
                f.write(chunk)

        media_url = getattr(settings, "MEDIA_URL", "/media/")
        public_url = f"{media_url.rstrip('/')}/cms_uploads/{safe_name}"
        return Response({"url": public_url, "name": safe_name})


class CabecalhoLinkExtraListCreateView(APIView):
    """Admin-only: CRUD da lista de links extras do cabeçalho (máx. 8)."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def post(self, request):
        config, _ = ConfiguracaoCabecalho.objects.get_or_create(pk=1)
        total_extras = CabecalhoLinkExtra.objects.filter(configuracao=config).count()
        if total_extras >= 8:
            return Response({"erro": "Limite máximo de 8 links extras no cabeçalho."}, status=400)

        data = request.data or {}
        titulo = (data.get("titulo") or "").strip()
        link_url = (data.get("link_url") or "").strip()
        if not titulo or not link_url:
            return Response({"erro": "Campos 'titulo' e 'link_url' são obrigatórios."}, status=400)

        item = CabecalhoLinkExtra.objects.create(
            configuracao=config,
            titulo=titulo,
            link_url=link_url,
            ordem=int(data.get("ordem", 0)),
            abrir_em_nova_aba=bool(data.get("abrir_em_nova_aba", False)),
            ativo=bool(data.get("ativo", True)),
        )
        return Response(
            {
                "id": item.id,
                "titulo": item.titulo,
                "link_url": item.link_url,
                "ordem": item.ordem,
                "abrir_em_nova_aba": item.abrir_em_nova_aba,
                "ativo": item.ativo,
            },
            status=201,
        )


class CabecalhoLinkExtraDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsCMSAdmin]

    def put(self, request, pk):
        try:
            item = CabecalhoLinkExtra.objects.get(pk=pk)
        except CabecalhoLinkExtra.DoesNotExist:
            return Response({"erro": "Link extra não encontrado."}, status=404)

        data = request.data or {}
        item.titulo = (data.get("titulo") or item.titulo).strip()
        item.link_url = (data.get("link_url") or item.link_url).strip()
        item.ordem = int(data.get("ordem", item.ordem))
        item.abrir_em_nova_aba = bool(data.get("abrir_em_nova_aba", item.abrir_em_nova_aba))
        item.ativo = bool(data.get("ativo", item.ativo))

        if not item.titulo or not item.link_url:
            return Response({"erro": "Campos 'titulo' e 'link_url' são obrigatórios."}, status=400)

        item.save()
        return Response(
            {
                "id": item.id,
                "titulo": item.titulo,
                "link_url": item.link_url,
                "ordem": item.ordem,
                "abrir_em_nova_aba": item.abrir_em_nova_aba,
                "ativo": item.ativo,
            }
        )

    def delete(self, request, pk):
        try:
            item = CabecalhoLinkExtra.objects.get(pk=pk)
        except CabecalhoLinkExtra.DoesNotExist:
            return Response({"erro": "Link extra não encontrado."}, status=404)
        item.delete()
        return Response(status=204)
