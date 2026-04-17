from django.urls import path
from .views import (
    CabecalhoAdminView,
    CabecalhoAutorizarView,
    CabecalhoHistoricoListView,
    CabecalhoLinkExtraDetailView,
    CabecalhoLinkExtraListCreateView,
    CabecalhoSubmeterView,
    CMSImageUploadView,
    ConfiguracaoVisualDetailView,
    ConfiguracaoVisualListCreateView,
    FontAwesomeIconListView,
    HealthView,
    MenuAdminDetailView,
    MenuAdminListCreateView,
    MePerfilCMSView,
    NoticiaAutorizarView,
    NoticiaDetailView,
    NoticiaListCreateView,
    NoticiaSubmeterView,
    PublicMenuView,
    PublicNoticiasView,
    PublicPageView,
)

urlpatterns = [
    # Públicos
    path("health/", HealthView.as_view(), name="cms-health"),
    path("public-page/", PublicPageView.as_view(), name="cms-public-page"),
    path("menus/", PublicMenuView.as_view(), name="cms-public-menus"),
    path("menus/arvore/", PublicMenuView.as_view(), name="cms-public-menus-tree"),
    path("noticias/", PublicNoticiasView.as_view(), name="cms-public-noticias"),

    # Autenticados – perfil CMS
    path("cms/me/", MePerfilCMSView.as_view(), name="cms-me"),

    # Autenticados – CRUD de notícias (publicador / homologador / admin)
    path("cms/noticias/", NoticiaListCreateView.as_view(), name="cms-noticias-list"),
    path("cms/noticias/<int:pk>/", NoticiaDetailView.as_view(), name="cms-noticias-detail"),
    path("cms/noticias/<int:pk>/submeter/", NoticiaSubmeterView.as_view(), name="cms-noticias-submeter"),
    path("cms/noticias/<int:pk>/autorizar/", NoticiaAutorizarView.as_view(), name="cms-noticias-autorizar"),

    # Admin CMS – menus
    path("cms/admin/menus/", MenuAdminListCreateView.as_view(), name="cms-admin-menus-list"),
    path("cms/admin/menus/<int:pk>/", MenuAdminDetailView.as_view(), name="cms-admin-menus-detail"),
    path("cms/admin/fontawesome-icons/", FontAwesomeIconListView.as_view(), name="cms-admin-fontawesome-icons"),

    # Admin CMS – cabeçalho público (DSGov)
    path("cms/admin/cabecalho/", CabecalhoAdminView.as_view(), name="cms-admin-cabecalho"),
    path("cms/admin/cabecalho/submeter/", CabecalhoSubmeterView.as_view(), name="cms-admin-cabecalho-submeter"),
    path("cms/admin/cabecalho/autorizar/", CabecalhoAutorizarView.as_view(), name="cms-admin-cabecalho-autorizar"),
    path("cms/admin/cabecalho/historico/", CabecalhoHistoricoListView.as_view(), name="cms-admin-cabecalho-historico"),
    path("cms/admin/cabecalho/links/", CabecalhoLinkExtraListCreateView.as_view(), name="cms-admin-cabecalho-links-list"),
    path("cms/admin/cabecalho/links/<int:pk>/", CabecalhoLinkExtraDetailView.as_view(), name="cms-admin-cabecalho-links-detail"),
    path("cms/admin/upload-image/", CMSImageUploadView.as_view(), name="cms-admin-upload-image"),

    # Admin CMS – configurações visuais (SVGs)
    path("cms/admin/config-visual/", ConfiguracaoVisualListCreateView.as_view(), name="cms-admin-cv-list"),
    path("cms/admin/config-visual/<int:pk>/", ConfiguracaoVisualDetailView.as_view(), name="cms-admin-cv-detail"),
]
