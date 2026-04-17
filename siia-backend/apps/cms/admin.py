from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Artigo,
    CabecalhoLinkExtra,
    CabecalhoHistorico,
    CabecalhoWorkflow,
    CardInformativo,
    ConfiguracaoCabecalho,
    ConfiguracaoPortal,
    ConfiguracaoVisual,
    FontAwesomeIcon,
    Menu,
    Noticia,
)


@admin.register(ConfiguracaoPortal)
class ConfiguracaoPortalAdmin(admin.ModelAdmin):
    list_display = ("nome_portal", "ativo", "atualizado_em")
    list_filter = ("ativo",)
    search_fields = ("nome_portal",)


@admin.register(ConfiguracaoCabecalho)
class ConfiguracaoCabecalhoAdmin(admin.ModelAdmin):
    list_display = ("nome_instituicao", "nome_orgao", "slogan", "ativo", "atualizado_em")
    list_filter = ("ativo",)
    search_fields = ("nome_instituicao", "nome_orgao", "slogan")


@admin.register(CabecalhoLinkExtra)
class CabecalhoLinkExtraAdmin(admin.ModelAdmin):
    list_display = ("titulo", "configuracao", "ordem", "abrir_em_nova_aba", "ativo")
    list_filter = ("ativo", "abrir_em_nova_aba")
    search_fields = ("titulo", "link_url")
    ordering = ("ordem", "id")


@admin.register(CabecalhoWorkflow)
class CabecalhoWorkflowAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "autor", "homologado_por", "submetido_em", "homologado_em", "atualizado_em")
    list_filter = ("status",)
    readonly_fields = ("atualizado_em",)


@admin.register(CabecalhoHistorico)
class CabecalhoHistoricoAdmin(admin.ModelAdmin):
    list_display = ("id", "acao", "actor", "criado_em")
    list_filter = ("acao",)
    search_fields = ("diff_text",)
    readonly_fields = ("criado_em", "diff_text", "before_payload", "after_payload")


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ("titulo", "parent", "ordem", "abrir_em_nova_aba", "icone_classe", "ativo")
    list_filter = ("ativo", "abrir_em_nova_aba")
    search_fields = ("titulo", "link_url", "icone_classe")
    autocomplete_fields = ("parent",)
    ordering = ("ordem", "id")


@admin.register(Artigo)
class ArtigoAdmin(admin.ModelAdmin):
    list_display = ("titulo", "destaque", "publicado", "publicado_em")
    list_filter = ("publicado", "destaque")
    search_fields = ("titulo", "resumo", "conteudo")


@admin.register(Noticia)
class NoticiaAdmin(admin.ModelAdmin):
    list_display = ("titulo", "status_badge", "categoria_texto", "autor", "homologado_por", "data_publicacao", "is_destaque")
    list_filter = ("status", "is_destaque", "categoria_texto")
    search_fields = ("titulo", "categoria_texto", "conteudo")
    ordering = ("-data_publicacao",)
    readonly_fields = ("data_publicacao", "homologado_em", "homologado_por")
    fieldsets = (
        ("Conteúdo", {"fields": ("titulo", "imagem_url", "categoria_texto", "conteudo", "is_destaque")}),
        ("Publicação", {"fields": ("status", "autor")}),
        ("Homologação", {"fields": ("homologado_por", "homologado_em"), "classes": ("collapse",)}),
    )

    def status_badge(self, obj):
        cores = {
            "rascunho": "#6c757d",
            "pendente": "#fd7e14",
            "publicado": "#198754",
        }
        cor = cores.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:0.8em">{}</span>',
            cor,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"


@admin.register(CardInformativo)
class CardInformativoAdmin(admin.ModelAdmin):
    list_display = ("titulo", "icone", "icone_url", "icone_svg_preview", "ordem", "ativo")
    list_filter = ("ativo",)
    search_fields = ("titulo", "descricao", "link_url", "icone", "icone_url")
    ordering = ("ordem", "id")
    readonly_fields = ("icone_svg_preview",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "titulo",
                    "descricao",
                    "link_url",
                    "icone",
                    "icone_url",
                    "icone_svg_preview",
                    "cor_fundo",
                    "cor_texto",
                    "ordem",
                    "ativo",
                )
            },
        ),
    )

    def icone_svg_preview(self, obj):
        if not obj.icone_url:
            return "Sem SVG"

        return format_html(
            '<a href="{}" target="_blank" rel="noopener noreferrer">'
            '<img src="{}" alt="Preview do SVG" style="width:32px;height:32px;object-fit:contain;vertical-align:middle;" />'
            "</a>",
            obj.icone_url,
            obj.icone_url,
        )

    icone_svg_preview.short_description = "Preview SVG"

@admin.register(ConfiguracaoVisual)
class ConfiguracaoVisualAdmin(admin.ModelAdmin):
    list_display = ("chave", "descricao", "svg_preview")
    search_fields = ("chave", "descricao")
    readonly_fields = ("svg_preview",)
    fieldsets = (
        (
            None,
            {"fields": ("chave", "descricao", "valor_svg", "svg_preview")},
        ),
    )

    def svg_preview(self, obj):
        if not obj.valor_svg:
            return "Sem valor SVG"
        v = obj.valor_svg.strip()
        # Se for URL, renderiza como imagem
        if v.startswith("http://") or v.startswith("https://"):
            return format_html(
                '<img src="{}" alt="SVG" style="width:40px;height:40px;object-fit:contain;" />',
                v,
            )
        # Se for código SVG inline, renderiza diretamente
        if v.startswith("<svg"):
            return format_html('<div style="width:40px;height:40px;">{}</div>', v)
        return v[:60]

    svg_preview.short_description = "Preview"


@admin.register(FontAwesomeIcon)
class FontAwesomeIconAdmin(admin.ModelAdmin):
    list_display = ("class_name", "label", "style", "version", "ativo")
    list_filter = ("style", "version", "ativo")
    search_fields = ("class_name", "label", "icon_name")
    ordering = ("style", "label")
