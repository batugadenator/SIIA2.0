from django.conf import settings
from django.db import models


def schema_table(table_name: str) -> str:
    return f'"siagg"."{table_name}"'


class SiaggArea(models.Model):
    nome = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = schema_table("area")
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class SiaggDataEntry(models.Model):
    area = models.ForeignKey(SiaggArea, on_delete=models.CASCADE, related_name="indicadores")
    titulo = models.CharField(max_length=200)
    valor = models.DecimalField(max_digits=15, decimal_places=2)
    data_referencia = models.DateField()
    observacao = models.TextField(blank=True)
    operador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="siagg_data_entries",
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = schema_table("data_entry")
        ordering = ["-data_referencia", "-id"]
        indexes = [
            models.Index(fields=["area", "data_referencia"], name="siagg_data_area_data_idx"),
        ]


class SiaggReport(models.Model):
    area = models.ForeignKey(SiaggArea, on_delete=models.CASCADE, related_name="relatorios")
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    data_referencia = models.DateField()
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="siagg_reports",
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = schema_table("report")
        ordering = ["-data_referencia", "-id"]
        indexes = [
            models.Index(fields=["area", "data_referencia"], name="siagg_report_area_data_idx"),
        ]


class SiaggReportFile(models.Model):
    report = models.ForeignKey(SiaggReport, on_delete=models.CASCADE, related_name="arquivos")
    arquivo = models.FileField(upload_to="siagg/reports/%Y/%m/%d/")
    enviado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="siagg_report_files",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = schema_table("report_file")
        ordering = ["-criado_em", "-id"]


class SiaggGovernanceDocument(models.Model):
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    categoria = models.CharField(max_length=80)
    arquivo = models.FileField(upload_to="siagg/governanca/%Y/%m/%d/")
    enviado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="siagg_governance_documents",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = schema_table("governance_document")
        ordering = ["-criado_em", "-id"]
        indexes = [
            models.Index(fields=["criado_em"], name="siagg_gov_doc_criado_idx"),
        ]
