from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    ldap_grupos_cache = models.JSONField(default=list, blank=True)
    ldap_ultimo_sync = models.DateTimeField(null=True, blank=True)


class LaunchpadAplicativo(models.Model):
    SECTION_CHOICES = [
        ("launchpad", "Launchpad"),
        ("legados", "Legados"),
    ]

    TIPO_ACESSO_CHOICES = [
        ("interno", "Interno"),
        ("externo", "Externo"),
    ]

    codigo = models.CharField(max_length=100, unique=True)
    nome = models.CharField(max_length=120)
    descricao = models.CharField(max_length=255)
    section = models.CharField(max_length=20, choices=SECTION_CHOICES, default="launchpad")
    tipo_acesso = models.CharField(max_length=20, choices=TIPO_ACESSO_CHOICES, default="interno")
    rota_interna = models.CharField(max_length=255, blank=True)
    url_externa = models.URLField(blank=True)
    badge = models.CharField(max_length=50, blank=True)
    icon = models.CharField(max_length=100, blank=True)
    abrir_em_nova_aba = models.BooleanField(default=False)
    grupos_ad_permitidos = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de grupos AD autorizados (CN ou DN). Vazio libera para todos os autenticados.",
    )
    ordem = models.PositiveIntegerField(default=100)
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Aplicativo do Launchpad"
        verbose_name_plural = "Aplicativos do Launchpad"
        ordering = ["ordem", "nome"]

    def __str__(self):
        return f"{self.nome} ({self.section})"


class LogsAcesso(models.Model):
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="logs_acesso",
    )
    username_informado = models.CharField(max_length=150)
    metodo_autenticacao = models.CharField(max_length=50)
    backend_autenticacao = models.CharField(max_length=255)
    endereco_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)
    data_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log de Acesso"
        verbose_name_plural = "Logs de Acesso"
        ordering = ["-data_hora"]

    def __str__(self):
        return f"{self.username_informado} - {self.metodo_autenticacao} - {self.data_hora:%Y-%m-%d %H:%M:%S}"
