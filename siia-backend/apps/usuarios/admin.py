from django.contrib import admin

from .models import LaunchpadAplicativo, LogsAcesso


@admin.register(LaunchpadAplicativo)
class LaunchpadAplicativoAdmin(admin.ModelAdmin):
    list_display = (
        "ordem",
        "nome",
        "codigo",
        "section",
        "tipo_acesso",
        "ativo",
    )
    list_filter = ("section", "tipo_acesso", "ativo", "abrir_em_nova_aba")
    search_fields = ("nome", "codigo", "descricao", "rota_interna", "url_externa")
    ordering = ("ordem", "nome")


@admin.register(LogsAcesso)
class LogsAcessoAdmin(admin.ModelAdmin):
    list_display = (
        "data_hora",
        "username_informado",
        "metodo_autenticacao",
        "backend_autenticacao",
        "usuario",
        "endereco_ip",
    )
    list_filter = ("metodo_autenticacao", "backend_autenticacao", "data_hora")
    search_fields = ("username_informado", "usuario__username", "endereco_ip")
    readonly_fields = (
        "usuario",
        "username_informado",
        "metodo_autenticacao",
        "backend_autenticacao",
        "endereco_ip",
        "user_agent",
        "data_hora",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
