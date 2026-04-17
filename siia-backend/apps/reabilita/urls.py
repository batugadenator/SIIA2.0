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
    path("health/", HealthView.as_view(), name="reabilita-health"),
    path("auth/csrf/", AuthCsrfView.as_view(), name="reabilita-auth-csrf"),
    path("auth/login/", AuthLoginView.as_view(), name="reabilita-auth-login"),
    path("auth/me/", AuthMeView.as_view(), name="reabilita-auth-me"),
    path("auth/logout/", AuthLogoutView.as_view(), name="reabilita-auth-logout"),
    path("auth/mudar-senha/", AuthMudarSenhaView.as_view(), name="reabilita-auth-mudar-senha"),
    path("auth/recuperar-senha/", AuthRecuperarSenhaView.as_view(), name="reabilita-auth-recuperar-senha"),
    path("auth/ldap-config/", AuthLDAPConfigView.as_view(), name="reabilita-auth-ldap-config"),
    path("auth/usuarios/", AuthUsuariosListView.as_view(), name="reabilita-auth-usuarios-list"),
    path("auth/usuarios/novo/", AuthUsuariosNovoView.as_view(), name="reabilita-auth-usuarios-novo"),
    path("auth/usuarios/<int:user_id>/", AuthUsuarioDetailView.as_view(), name="reabilita-auth-usuario-detail"),
    path(
        "auth/usuarios/<int:user_id>/resetar-senha/",
        AuthUsuarioResetarSenhaView.as_view(),
        name="reabilita-auth-usuario-resetar-senha",
    ),
    path("estatistica/painel-clinico/", PainelClinicoView.as_view(), name="reabilita-painel-clinico"),
    path("saude/atendimentos/", AtendimentoListCreateView.as_view(), name="reabilita-saude-atendimentos"),
    path("saude/evolucoes/", EvolucaoListCreateView.as_view(), name="reabilita-saude-evolucoes"),
    path(
        "saude/fisioterapia/avaliacoes-sred/",
        AvaliacaoSREDListCreateView.as_view(),
        name="reabilita-saude-fisio-avaliacoes-sred",
    ),
    path(
        "saude/fisioterapia/avaliacoes-sred/<int:avaliacao_id>/",
        AvaliacaoSREDDetailView.as_view(),
        name="reabilita-saude-fisio-avaliacoes-sred-detail",
    ),
    path(
        "saude/atendimentos/referencias/",
        AtendimentoReferenciasView.as_view(),
        name="reabilita-saude-atendimentos-referencias",
    ),
]
