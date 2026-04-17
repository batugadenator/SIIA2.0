from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models


class ConfiguracaoPortal(models.Model):
    nome_portal = models.CharField(max_length=120, default="SIIA 2.0")
    logo_url = models.URLField(blank=True)
    cor_primaria = models.CharField(max_length=7, default="#1351B4")
    cor_secundaria = models.CharField(max_length=7, default="#2670E8")
    link_diretorio_nextcloud_publico = models.URLField(blank=True)
    link_diretorio_nextcloud_interno = models.URLField(blank=True)
    ativo = models.BooleanField(default=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_configuracao_portal"

    def __str__(self) -> str:
        return self.nome_portal


class ConfiguracaoCabecalho(models.Model):
    IDIOMA_PT_BR = "pt-br"
    IDIOMA_EN = "en"
    IDIOMA_CHOICES = [
        (IDIOMA_PT_BR, "Português (Brasil)"),
        (IDIOMA_EN, "English"),
    ]

    nome_instituicao = models.CharField(max_length=120, default="Ministerio da Defesa")
    nome_instituicao_en = models.CharField(max_length=120, blank=True, default="Ministry of Defense")
    nome_orgao = models.CharField(max_length=120, default="Exercito Brasileiro")
    nome_orgao_en = models.CharField(max_length=120, blank=True, default="Brazilian Army")
    slogan = models.CharField(max_length=160, default="Braco Forte - Mao Amiga")
    slogan_en = models.CharField(max_length=160, blank=True, default="Strong Arm - Friendly Hand")
    logo_url = models.URLField(blank=True)
    link_logo_url = models.CharField(max_length=300, default="/")
    idioma_padrao = models.CharField(max_length=10, choices=IDIOMA_CHOICES, default=IDIOMA_PT_BR)

    link_inicio_titulo = models.CharField(max_length=80, default="Inicio")
    link_inicio_titulo_en = models.CharField(max_length=80, blank=True, default="Home")
    link_inicio_url = models.CharField(max_length=300, default="/")
    link_inicio_nova_aba = models.BooleanField(default=False)

    link_servicos_titulo = models.CharField(max_length=80, default="Servicos")
    link_servicos_titulo_en = models.CharField(max_length=80, blank=True, default="Services")
    link_servicos_url = models.CharField(max_length=300, default="/servicos")
    link_servicos_nova_aba = models.BooleanField(default=False)

    link_contato_titulo = models.CharField(max_length=80, default="Contato")
    link_contato_titulo_en = models.CharField(max_length=80, blank=True, default="Contact")
    link_contato_url = models.CharField(max_length=300, default="/contato")
    link_contato_nova_aba = models.BooleanField(default=False)

    link_estrutura_titulo = models.CharField(max_length=80, default="Estrutura Organizacional")
    link_estrutura_titulo_en = models.CharField(max_length=80, blank=True, default="Organizational Structure")
    link_estrutura_url = models.CharField(max_length=300, default="/estrutura-organizacional")
    link_estrutura_nova_aba = models.BooleanField(default=False)

    ativo = models.BooleanField(default=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_configuracao_cabecalho"

    def __str__(self) -> str:
        return f"Cabecalho - {self.nome_orgao}"


class CabecalhoLinkExtra(models.Model):
    configuracao = models.ForeignKey(
        ConfiguracaoCabecalho,
        on_delete=models.CASCADE,
        related_name="links_extras",
    )
    titulo = models.CharField(max_length=80)
    link_url = models.CharField(max_length=300)
    ordem = models.PositiveIntegerField(default=0)
    abrir_em_nova_aba = models.BooleanField(default=False)
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = "cms_cabecalho_link_extra"
        ordering = ["ordem", "id"]

    def __str__(self) -> str:
        return self.titulo


class CabecalhoWorkflow(models.Model):
    STATUS_RASCUNHO = "rascunho"
    STATUS_PENDENTE = "pendente"
    STATUS_PUBLICADO = "publicado"
    STATUS_CHOICES = [
        (STATUS_RASCUNHO, "Rascunho"),
        (STATUS_PENDENTE, "Pendente de Homologação"),
        (STATUS_PUBLICADO, "Publicado"),
    ]

    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RASCUNHO)
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cabecalho_workflows_criados",
    )
    homologado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cabecalho_workflows_homologados",
    )
    submetido_em = models.DateTimeField(null=True, blank=True)
    homologado_em = models.DateTimeField(null=True, blank=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cms_cabecalho_workflow"


class CabecalhoHistorico(models.Model):
    ACAO_RASCUNHO = "rascunho"
    ACAO_SUBMETIDO = "submetido"
    ACAO_PUBLICADO = "publicado"
    ACAO_CHOICES = [
        (ACAO_RASCUNHO, "Rascunho salvo"),
        (ACAO_SUBMETIDO, "Submetido para homologação"),
        (ACAO_PUBLICADO, "Publicado"),
    ]

    acao = models.CharField(max_length=20, choices=ACAO_CHOICES)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cabecalho_historicos",
    )
    before_payload = models.JSONField(default=dict)
    after_payload = models.JSONField(default=dict)
    diff_text = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cms_cabecalho_historico"
        ordering = ["-criado_em", "-id"]


class Menu(models.Model):
    titulo = models.CharField(max_length=120)
    link_url = models.URLField(help_text="Aceita URL externa, incluindo pastas do Nextcloud")
    icone_classe = models.CharField(
        max_length=80,
        blank=True,
        validators=[
            RegexValidator(
                regex=r"^(fas|far|fab)\s+fa-[a-z0-9-]+$",
                message="Use classes FontAwesome 5 Free no formato: fas fa-folder-open.",
            )
        ],
        help_text="Classe FontAwesome 5 Free, ex: fas fa-folder-open",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="filhos",
    )
    ordem = models.PositiveIntegerField(default=0)
    abrir_em_nova_aba = models.BooleanField(
        default=False,
        help_text="Marque como True para links externos (ex.: Nextcloud) abrirem fora da SPA.",
    )
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = "cms_menu"
        ordering = ["ordem", "id"]

    def __str__(self) -> str:
        return self.titulo


class Artigo(models.Model):
    titulo = models.CharField(max_length=180)
    resumo = models.CharField(max_length=300, blank=True)
    conteudo = models.TextField()
    imagem_url = models.URLField(blank=True)
    link_externo = models.URLField(blank=True)
    destaque = models.BooleanField(default=False)
    publicado = models.BooleanField(default=True)
    publicado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cms_artigo"
        ordering = ["-publicado_em", "-id"]

    def __str__(self) -> str:
        return self.titulo


class Noticia(models.Model):
    STATUS_RASCUNHO = "rascunho"
    STATUS_PENDENTE = "pendente"
    STATUS_PUBLICADO = "publicado"
    STATUS_CHOICES = [
        (STATUS_RASCUNHO, "Rascunho"),
        (STATUS_PENDENTE, "Pendente de Homologação"),
        (STATUS_PUBLICADO, "Publicado"),
    ]

    titulo = models.CharField(max_length=200)
    imagem_url = models.CharField(max_length=500, blank=True)
    categoria_texto = models.CharField(max_length=50)
    data_publicacao = models.DateTimeField(auto_now_add=True)
    conteudo = models.TextField()
    is_destaque = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RASCUNHO)
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="noticias_criadas",
    )
    homologado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="noticias_homologadas",
    )
    homologado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cms_noticia"
        ordering = ["-data_publicacao"]
        permissions = [
            ("can_authorize_noticia", "Pode autorizar publicações"),
        ]

    def __str__(self) -> str:
        return self.titulo


class ConfiguracaoVisual(models.Model):
    chave = models.SlugField(unique=True, help_text="Ex: 'icone-central-noticias'")
    valor_svg = models.TextField(help_text="Código XML do ícone SVG ou URL do SVG no Nextcloud")
    descricao = models.CharField(max_length=200)

    class Meta:
        db_table = "cms_configuracao_visual"
        verbose_name = "Configuração Visual"
        verbose_name_plural = "Configurações Visuais"

    def __str__(self) -> str:
        return self.descricao

class FontAwesomeIcon(models.Model):
    STYLE_SOLID = "fas"
    STYLE_BRANDS = "fab"
    STYLE_CHOICES = [
        (STYLE_SOLID, "Solid"),
        (STYLE_BRANDS, "Brands"),
    ]

    style = models.CharField(max_length=3, choices=STYLE_CHOICES)
    icon_name = models.CharField(max_length=100)
    class_name = models.CharField(max_length=140, unique=True)
    label = models.CharField(max_length=140)
    unicode_hex = models.CharField(max_length=10, blank=True)
    version = models.CharField(max_length=20, default="5.10.2")
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = "cms_fontawesome_icon"
        ordering = ["style", "label", "icon_name"]
        indexes = [
            models.Index(fields=["style", "ativo"]),
            models.Index(fields=["icon_name"]),
        ]

    def __str__(self) -> str:
        return f"{self.class_name} ({self.label})"


class CardInformativo(models.Model):
    titulo = models.CharField(max_length=120)
    descricao = models.CharField(max_length=240, blank=True)
    link_url = models.URLField(help_text="Aceita URL externa, incluindo pastas do Nextcloud")
    icone = models.CharField(max_length=40, blank=True)
    icone_url = models.URLField(blank=True, help_text="URL de icone SVG (ex.: Nextcloud). Prioritario sobre o campo icone.")
    cor_fundo = models.CharField(max_length=7, default="#E7F1FF")
    cor_texto = models.CharField(max_length=7, default="#111111")
    ordem = models.PositiveIntegerField(default=0)
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = "cms_card_informativo"
        ordering = ["ordem", "id"]

    def __str__(self) -> str:
        return self.titulo
