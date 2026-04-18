from django.urls import path

from .views import (
    AtendimentoReferenciasView,
    AtendimentoListCreateView,
    AvaliacaoSREDDetailView,
    AvaliacaoSREDListCreateView,
    EvolucaoListCreateView,
    AuthCsrfView,
    AuthLDAPConfigView,
    AuthLoginView,
    AuthLogoutView,
    AuthMudarSenhaView,
    AuthMeView,
    AuthRecuperarSenhaView,
    AuthUsuarioDetailView,
    AuthUsuarioResetarSenhaView,
    AuthUsuariosListView,
    AuthUsuariosNovoView,
    HealthView,
    PainelClinicoView,
)

urlpatterns = [
    path("health/", HealthView.as_view(), name="cadfuncional-health"),
    path("auth/csrf/", AuthCsrfView.as_view(), name="cadfuncional-auth-csrf"),
    path("auth/login/", AuthLoginView.as_view(), name="cadfuncional-auth-login"),
    path("auth/me/", AuthMeView.as_view(), name="cadfuncional-auth-me"),
    path("auth/logout/", AuthLogoutView.as_view(), name="cadfuncional-auth-logout"),
    path("auth/mudar-senha/", AuthMudarSenhaView.as_view(), name="cadfuncional-auth-mudar-senha"),
    path("auth/recuperar-senha/", AuthRecuperarSenhaView.as_view(), name="cadfuncional-auth-recuperar-senha"),
    path("auth/ldap-config/", AuthLDAPConfigView.as_view(), name="cadfuncional-auth-ldap-config"),
    path("auth/usuarios/", AuthUsuariosListView.as_view(), name="cadfuncional-auth-usuarios-list"),
    path("auth/usuarios/novo/", AuthUsuariosNovoView.as_view(), name="cadfuncional-auth-usuarios-novo"),
    path("auth/usuarios/<int:user_id>/", AuthUsuarioDetailView.as_view(), name="cadfuncional-auth-usuario-detail"),
    path(
        "auth/usuarios/<int:user_id>/resetar-senha/",
        AuthUsuarioResetarSenhaView.as_view(),
        name="cadfuncional-auth-usuario-resetar-senha",
    ),
    path("estatistica/painel-clinico/", PainelClinicoView.as_view(), name="cadfuncional-painel-clinico"),
    path("saude/atendimentos/", AtendimentoListCreateView.as_view(), name="cadfuncional-saude-atendimentos"),
    path("saude/evolucoes/", EvolucaoListCreateView.as_view(), name="cadfuncional-saude-evolucoes"),
    path(
        "saude/fisioterapia/avaliacoes-sred/",
        AvaliacaoSREDListCreateView.as_view(),
        name="cadfuncional-saude-fisio-avaliacoes-sred",
    ),
    path(
        "saude/fisioterapia/avaliacoes-sred/<int:avaliacao_id>/",
        AvaliacaoSREDDetailView.as_view(),
        name="cadfuncional-saude-fisio-avaliacoes-sred-detail",
    ),
    path(
        "saude/atendimentos/referencias/",
        AtendimentoReferenciasView.as_view(),
        name="cadfuncional-saude-atendimentos-referencias",
    ),
]
