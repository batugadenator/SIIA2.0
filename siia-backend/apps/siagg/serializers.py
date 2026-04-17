from rest_framework import serializers

from .models import SiaggArea, SiaggDataEntry, SiaggGovernanceDocument, SiaggReport, SiaggReportFile


MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024


def _validate_pdf_upload(file_obj):
    if not file_obj:
        raise serializers.ValidationError("Arquivo e obrigatorio.")

    content_type = (getattr(file_obj, "content_type", "") or "").lower()
    filename = (getattr(file_obj, "name", "") or "").lower()

    if content_type != "application/pdf" and not filename.endswith(".pdf"):
        raise serializers.ValidationError("Apenas arquivos PDF sao permitidos.")

    if getattr(file_obj, "size", 0) > MAX_UPLOAD_SIZE_BYTES:
        raise serializers.ValidationError("Arquivo excede o limite de 10MB.")


class SiaggAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiaggArea
        fields = [
            "id",
            "nome",
            "slug",
            "descricao",
            "ativo",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "criado_em", "atualizado_em"]


class SiaggDataEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SiaggDataEntry
        fields = [
            "id",
            "area",
            "titulo",
            "valor",
            "data_referencia",
            "observacao",
            "operador",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "operador", "criado_em", "atualizado_em"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            validated_data["operador"] = request.user
        return super().create(validated_data)


class SiaggReportFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiaggReportFile
        fields = ["id", "report", "arquivo", "enviado_por", "criado_em"]
        read_only_fields = ["id", "report", "enviado_por", "criado_em"]

    def validate_arquivo(self, value):
        _validate_pdf_upload(value)
        return value


class SiaggReportSerializer(serializers.ModelSerializer):
    arquivos = SiaggReportFileSerializer(many=True, read_only=True)

    class Meta:
        model = SiaggReport
        fields = [
            "id",
            "area",
            "titulo",
            "descricao",
            "data_referencia",
            "autor",
            "criado_em",
            "atualizado_em",
            "arquivos",
        ]
        read_only_fields = ["id", "autor", "criado_em", "atualizado_em", "arquivos"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            validated_data["autor"] = request.user
        return super().create(validated_data)


class SiaggGovernanceDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiaggGovernanceDocument
        fields = ["id", "titulo", "descricao", "categoria", "arquivo", "enviado_por", "criado_em"]
        read_only_fields = ["id", "enviado_por", "criado_em"]

    def validate_arquivo(self, value):
        _validate_pdf_upload(value)
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            validated_data["enviado_por"] = request.user
        return super().create(validated_data)
