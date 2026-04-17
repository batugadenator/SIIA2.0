from django.urls import path
from .views import (
    AuthModeView,
    HealthView,
    LaunchpadAppsView,
    LDAPStatusView,
    LoginLDAPView,
    LogsAcessoListView,
    LogoutView,
    MeView,
)

urlpatterns = [
    path("health/", HealthView.as_view(), name="usuarios-health"),
    path("auth-mode/", AuthModeView.as_view(), name="usuarios-auth-mode"),
    path("ldap-status/", LDAPStatusView.as_view(), name="usuarios-ldap-status"),
    path("launchpad-apps/", LaunchpadAppsView.as_view(), name="usuarios-launchpad-apps"),
    path("logs-acesso/", LogsAcessoListView.as_view(), name="usuarios-logs-acesso"),
    path("login/", LoginLDAPView.as_view(), name="usuarios-login"),
    path("me/", MeView.as_view(), name="usuarios-me"),
    path("logout/", LogoutView.as_view(), name="usuarios-logout"),
]
